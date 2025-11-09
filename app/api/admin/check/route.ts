import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentShopIdFromContext } from "@/lib/shopIsolation";

/**
 * GET /api/admin/check
 * Vérifie s'il existe déjà un admin dans la boutique
 */
export async function GET(request: NextRequest) {
  try {
    // Récupérer le shopId depuis les paramètres de requête ou le contexte
    const { searchParams } = new URL(request.url);
    const shopParam = searchParams.get('shop');

    let shopId: string | null = null;

    if (shopParam) {
      // Si shop fourni en paramètre, chercher le shop correspondant
      const shop = await prisma.shop.findFirst({
        where: {
          OR: [
            { shopDomain: shopParam },
            { shopDomain: shopParam.replace('.myshopify.com', '') },
            { shopDomain: `${shopParam}.myshopify.com` }
          ]
        },
        select: { id: true }
      });
      shopId = shop?.id || null;
    } else {
      // Sinon utiliser le contexte actuel
      shopId = await getCurrentShopIdFromContext();
    }

    if (!shopId) {
      return NextResponse.json(
        { hasAdmin: false, message: "Shop not found" },
        { status: 404 }
      );
    }

    // Vérifier s'il existe un admin dans cette boutique
    const adminUser = await prisma.user.findFirst({
      where: {
        shopId: shopId,
        role: "ADMIN",
      },
      select: { id: true }
    });

    return NextResponse.json({
      hasAdmin: !!adminUser,
      shopId: shopId
    });

  } catch (error) {
    console.error("Erreur lors de la vérification admin:", error);
    return NextResponse.json(
      { hasAdmin: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}