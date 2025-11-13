import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getShopId } from "@/lib/shopIsolation";

/**
 * GET /api/admin/check
 * Vérifie s'il existe déjà un admin dans la boutique
 * ⚠️ Route publique mais limitée au shopId du contexte pour éviter l'énumération
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ SÉCURITÉ: Utiliser le shopId du contexte uniquement
    // Cela empêche l'énumération de tous les shops
    const shopId = await getShopId(request);

    // Vérifier s'il existe un admin dans cette boutique
    const adminUser = await prisma.user.findFirst({
      where: {
        shopId: shopId,
        role: "ADMIN",
      },
      select: { id: true }
    });

    // ✅ SÉCURITÉ: Ne retourner que l'information minimale nécessaire
    return NextResponse.json({
      hasAdmin: !!adminUser
      // Note: shopId n'est plus exposé pour éviter l'information disclosure
    });

  } catch (error) {
    console.error("Erreur lors de la vérification admin:", error);
    return NextResponse.json(
      { hasAdmin: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}