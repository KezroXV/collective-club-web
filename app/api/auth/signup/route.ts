import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDefaultRolesForShop } from "@/lib/shopIsolation";
import bcrypt from "bcrypt";
import { z } from "zod";

/**
 * 🔐 API d'inscription sécurisée avec email/mot de passe
 * Gère le multi-tenant et la création automatique du premier admin
 */

// Schéma de validation Zod pour les données d'inscription
const signupSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
    ),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  shop: z.string().min(1, "Le shop est requis"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation des données avec Zod
    const validationResult = signupSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validationResult.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { email, password, name, shop } = validationResult.data;

    // Validation du format du shop domain (sécurité contre injection)
    if (!shop.includes(".myshopify.com") && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Format de shop invalide" },
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

    // Vérifier si l'utilisateur existe déjà pour ce shop
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email,
        shopId: shopRecord.id,
      },
      select: {
        id: true,
        // ⚠️ NE JAMAIS inclure password dans les select !
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà pour ce shop" },
        { status: 409 }
      );
    }

    // Vérifier s'il existe déjà un admin pour ce shop
    const existingAdmin = await prisma.user.findFirst({
      where: {
        shopId: shopRecord.id,
        isShopOwner: true,
      },
      select: {
        id: true,
        // ⚠️ NE JAMAIS inclure password dans les select !
      }
    });

    const role: "ADMIN" | "MODERATOR" | "MEMBER" = !existingAdmin
      ? "ADMIN"
      : "MEMBER";
    const isShopOwner = !existingAdmin;

    // 🔐 Hasher le mot de passe avec bcrypt (10 rounds de salt)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: email,
        name: name,
        password: hashedPassword, // ✅ Mot de passe hashé
        shopId: shopRecord.id,
        role: role,
        isShopOwner: isShopOwner,
        emailVerified: new Date(), // Auto-vérification pour simplifier (optionnel)
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isShopOwner: true,
        shopId: true,
      },
    });

    // Mettre à jour l'ownerId du shop si c'est le premier admin
    if (role === "ADMIN" && isShopOwner) {
      await prisma.shop.update({
        where: { id: shopRecord.id },
        data: { ownerId: user.id },
      });
    }

    console.log(
      `✅ Inscription réussie pour ${email} dans ${shop}, role: ${role}`
    );

    return NextResponse.json({
      success: true,
      message: "Inscription réussie",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isShopOwner: user.isShopOwner,
      },
      shop: {
        id: shopRecord.id,
        domain: shopRecord.shopDomain,
        name: shopRecord.shopName,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}
