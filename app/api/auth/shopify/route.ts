import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDefaultRolesForShop } from "@/lib/shop-context";
import { encode } from "next-auth/jwt";

/**
 * Route d'authentification automatique pour Shopify embedded apps
 * Crée automatiquement un utilisateur basé sur le shop Shopify
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop } = body;

    if (!shop || typeof shop !== "string") {
      return NextResponse.json(
        { error: "Shop parameter is required" },
        { status: 400 }
      );
    }

    // Vérifier/créer le shop dans la DB
    let shopRecord = await prisma.shop.findUnique({
      where: { shopDomain: shop },
      select: { id: true, shopName: true, shopDomain: true },
    });

    if (!shopRecord) {
      // Créer le shop
      shopRecord = await prisma.shop.create({
        data: {
          shopDomain: shop,
          shopName: shop.replace(".myshopify.com", ""),
          ownerId: "pending",
        },
        select: { id: true, shopName: true, shopDomain: true },
      });

      // Créer les rôles par défaut
      await createDefaultRolesForShop(shopRecord.id);
    }

    // Vérifier s'il existe déjà un admin pour ce shop
    const existingAdmin = await prisma.user.findFirst({
      where: {
        shopId: shopRecord.id,
        isShopOwner: true,
      },
    });

    const role: "ADMIN" | "MODERATOR" | "MEMBER" = !existingAdmin
      ? "ADMIN"
      : "MEMBER";
    const isShopOwner = !existingAdmin;

    // Email générique pour l'utilisateur Shopify
    const email = `shopify-user@${shop}`;

    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user.findFirst({
      where: {
        email: email,
        shopId: shopRecord.id,
      },
    });

    if (!user) {
      // Créer l'utilisateur
      user = await prisma.user.create({
        data: {
          email: email,
          name: `Utilisateur ${shopRecord.shopName}`,
          shopId: shopRecord.id,
          role: role,
          isShopOwner: isShopOwner,
        },
      });

      // Mettre à jour l'ownerId du shop si c'est le premier admin
      if (role === "ADMIN" && isShopOwner) {
        await prisma.shop.update({
          where: { id: shopRecord.id },
          data: { ownerId: user.id },
        });
      }
    }

    // Créer un token JWT NextAuth
    const token = await encode({
      token: {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role as "ADMIN" | "MODERATOR" | "MEMBER",
        shopId: user.shopId,
        isShopOwner: user.isShopOwner,
      },
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: 30 * 24 * 60 * 60, // 30 jours
    });

    // Créer la response avec le cookie de session
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        shopId: user.shopId,
        isShopOwner: user.isShopOwner,
      },
      shop: {
        id: shopRecord.id,
        domain: shopRecord.shopDomain,
        name: shopRecord.shopName,
      },
    });

    // Détection du contexte Shopify embedded (iframe, admin)
    const referer = request.headers.get("referer") || "";
    const isShopifyEmbedded =
      /admin\.shopify\.com/i.test(referer) ||
      /\.myshopify\.com/i.test(referer) ||
      !!request.cookies.get("shopDomain")?.value;

    // Choisir le nom du cookie de session NextAuth
    // En production HTTPS, utiliser __Secure-next-auth.session-token
    const cookieName =
      process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token";

    // Options cookies selon le contexte
    const sessionCookieOptions = {
      httpOnly: true,
      secure: isShopifyEmbedded ? true : process.env.NODE_ENV === "production",
      sameSite: isShopifyEmbedded
        ? ("none" as const)
        : process.env.NODE_ENV === "production"
        ? ("none" as const)
        : ("lax" as const),
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    };

    response.cookies.set(cookieName, token, sessionCookieOptions);

    // Définir aussi le cookie shopDomain
    const shopCookieOptions = {
      httpOnly: false,
      secure: isShopifyEmbedded ? true : process.env.NODE_ENV === "production",
      sameSite: isShopifyEmbedded
        ? ("none" as const)
        : process.env.NODE_ENV === "production"
        ? ("none" as const)
        : ("lax" as const),
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    };
    response.cookies.set("shopDomain", shop, shopCookieOptions);

    console.log(
      `✅ Shopify auth success for ${shop}, user: ${user.id}, cookie: ${cookieName}, embedded=${isShopifyEmbedded}`
    );

    return response;
  } catch (error) {
    console.error("Shopify auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
