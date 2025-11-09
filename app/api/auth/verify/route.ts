/**
 * Endpoint pour vérifier l'authentification (supporte les deux méthodes)
 * GET /api/auth/verify
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/hybridAuth";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);

    if (!authContext) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: authContext.userId,
        email: authContext.email,
        name: authContext.name,
        role: authContext.role,
        isShopOwner: authContext.isShopOwner,
      },
      shop: {
        id: authContext.shopId,
        domain: authContext.shopDomain,
      },
      authMethod: authContext.authMethod,
    });
  } catch (error) {
    console.error("Auth verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
