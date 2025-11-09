/**
 * Système d'authentification hybride
 * Supporte à la fois:
 * - Session tokens Shopify (pour embedded apps)
 * - NextAuth sessions (pour Google OAuth)
 */

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  validateShopifySessionToken,
  extractShopFromPayload,
  extractUserIdFromPayload,
} from "./shopifySessionToken";
import { prisma } from "./prisma";

export interface AuthContext {
  userId: string;
  shopId: string;
  shopDomain: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "MODERATOR" | "MEMBER";
  isShopOwner: boolean;
  authMethod: "shopify-session-token" | "nextauth";
}

/**
 * Extrait et valide l'authentification depuis une requête
 * Supporte:
 * 1. Session token Shopify (header Authorization: Bearer <token>)
 * 2. NextAuth session (cookies)
 */
export async function getAuthContext(
  request: NextRequest
): Promise<AuthContext | null> {
  // 1. Essayer avec Shopify session token
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const context = await authenticateWithShopifyToken(token);
    if (context) return context;
  }

  // 2. Essayer avec NextAuth session
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return {
      userId: session.user.id,
      shopId: session.user.shopId,
      shopDomain: "", // Sera rempli par getShopContext si nécessaire
      email: session.user.email!,
      name: session.user.name || null,
      role: session.user.role as "ADMIN" | "MODERATOR" | "MEMBER",
      isShopOwner: session.user.isShopOwner || false,
      authMethod: "nextauth",
    };
  }

  return null;
}

/**
 * Authentifie un utilisateur avec un session token Shopify
 */
async function authenticateWithShopifyToken(
  token: string
): Promise<AuthContext | null> {
  try {
    // Valider le token
    const payload = await validateShopifySessionToken(token);
    if (!payload) {
      return null;
    }

    // Extraire les infos du token
    const shopDomain = extractShopFromPayload(payload);
    const shopifyUserId = extractUserIdFromPayload(payload);

    // Récupérer le shop dans la DB
    let shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: {
        id: true,
        shopDomain: true,
        shopName: true,
      },
    });

    // Si le shop n'existe pas, le créer
    if (!shop) {
      const { createDefaultRolesForShop } = await import("./shopIsolation");
      shop = await prisma.shop.create({
        data: {
          shopDomain,
          shopName: shopDomain.replace(".myshopify.com", ""),
          ownerId: "pending", // Sera mis à jour après création de l'utilisateur
        },
        select: {
          id: true,
          shopDomain: true,
          shopName: true,
        },
      });

      await createDefaultRolesForShop(shop.id);
    }

    // Vérifier s'il y a déjà un admin
    const existingAdmin = await prisma.user.findFirst({
      where: {
        shopId: shop.id,
        isShopOwner: true,
      },
      select: { id: true },
    });

    const isFirstUser = !existingAdmin;
    const role: "ADMIN" | "MODERATOR" | "MEMBER" = isFirstUser ? "ADMIN" : "MEMBER";

    // Email générique pour l'utilisateur Shopify
    const email = `shopify-${shopifyUserId}@${shopDomain}`;

    // Chercher ou créer l'utilisateur
    let user = await prisma.user.findFirst({
      where: {
        email,
        shopId: shop.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        shopId: true,
        isShopOwner: true,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: `Utilisateur ${shop.shopName}`,
          shopId: shop.id,
          role,
          isShopOwner: isFirstUser,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          shopId: true,
          isShopOwner: true,
        },
      });

      // Mettre à jour l'owner du shop si premier utilisateur
      if (isFirstUser) {
        await prisma.shop.update({
          where: { id: shop.id },
          data: { ownerId: user.id },
        });
      }
    }

    return {
      userId: user.id,
      shopId: user.shopId,
      shopDomain: shop.shopDomain,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "MODERATOR" | "MEMBER",
      isShopOwner: user.isShopOwner,
      authMethod: "shopify-session-token",
    };
  } catch (error) {
    console.error("Failed to authenticate with Shopify token:", error);
    return null;
  }
}

/**
 * Middleware pour protéger les routes API
 * Retourne l'AuthContext ou throw une erreur
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const context = await getAuthContext(request);
  if (!context) {
    throw new Error("Unauthorized");
  }
  return context;
}

/**
 * Middleware pour routes admin uniquement
 * Retourne l'AuthContext ou throw une erreur
 */
export async function requireAuthAdmin(request: NextRequest): Promise<AuthContext> {
  const context = await requireAuth(request);
  
  if (context.role !== "ADMIN") {
    throw new Error("Admin access required");
  }
  
  return context;
}