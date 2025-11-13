/**
 * Helpers d'authentification et d'autorisation pour les routes API
 * Centralise la logique de sécurité pour éviter les erreurs
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "./hybridAuth";
import { getShopId } from "./shopIsolation";

export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  shopId: string;
  isShopOwner: boolean;
}

/**
 * Vérifie qu'un utilisateur est authentifié
 * @throws Error si pas authentifié
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const auth = await getAuthContext(request);

  if (!auth) {
    throw new Error("Authentication required");
  }

  return {
    userId: auth.userId,
    email: auth.email,
    role: auth.role,
    shopId: auth.shopId,
    isShopOwner: auth.isShopOwner || false,
  };
}

/**
 * Vérifie qu'un utilisateur a l'un des rôles requis
 * @throws Error si pas le bon rôle
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<AuthContext> {
  const auth = await requireAuth(request);

  if (!allowedRoles.includes(auth.role)) {
    throw new Error(`Insufficient permissions. Required: ${allowedRoles.join(" or ")}`);
  }

  return auth;
}

/**
 * Vérifie qu'un utilisateur est admin
 * @throws Error si pas admin
 */
export async function requireAdmin(request: NextRequest): Promise<AuthContext> {
  return requireRole(request, ["ADMIN"]);
}

/**
 * Vérifie qu'un utilisateur est admin ou modérateur
 * @throws Error si pas admin/moderator
 */
export async function requireModerator(request: NextRequest): Promise<AuthContext> {
  return requireRole(request, ["ADMIN", "MODERATOR"]);
}

/**
 * Récupère le contexte d'authentification et le shopId de manière sécurisée
 * @returns { auth, shopId }
 */
export async function getSecureContext(request: NextRequest): Promise<{
  auth: AuthContext;
  shopId: string;
}> {
  const auth = await requireAuth(request);
  const shopId = await getShopId(request);

  // Vérifier que l'utilisateur appartient bien au shop
  if (auth.shopId !== shopId) {
    throw new Error("Shop ID mismatch - possible cross-tenant attack");
  }

  return { auth, shopId };
}

/**
 * Wrapper pour gérer les erreurs de manière cohérente
 */
export function withAuth<T>(
  handler: (request: NextRequest, auth: AuthContext, ...args: any[]) => Promise<T>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse | T> => {
    try {
      const auth = await requireAuth(request);
      return await handler(request, auth, ...args);
    } catch (error: any) {
      if (error.message === "Authentication required") {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      if (error.message?.includes("Insufficient permissions")) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }
      if (error.message?.includes("cross-tenant")) {
        return NextResponse.json(
          { error: "Access denied - shop mismatch" },
          { status: 403 }
        );
      }
      throw error;
    }
  };
}

/**
 * Wrapper pour routes nécessitant des rôles spécifiques
 */
export function withRole<T>(
  allowedRoles: string[],
  handler: (request: NextRequest, auth: AuthContext, ...args: any[]) => Promise<T>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse | T> => {
    try {
      const auth = await requireRole(request, allowedRoles);
      return await handler(request, auth, ...args);
    } catch (error: any) {
      if (error.message === "Authentication required") {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      if (error.message?.includes("Insufficient permissions")) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }
      throw error;
    }
  };
}
