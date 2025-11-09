/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin, resolveActingAdmin } from "@/lib/auth";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";
import { createDefaultBadgesForShop } from "@/lib/defaultBadges";

const prisma = new PrismaClient();

// GET - Récupérer les badges d'une boutique
export async function GET(request: NextRequest) {
  try {
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // 1) Si userId fourni, valider qu'il appartient à cette boutique
    if (userId) {
      // Vérifier que l'utilisateur existe dans cette boutique
      const user = await prisma.user.findFirst({
        where: { id: userId, shopId },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found in this shop" },
          { status: 404 }
        );
      }
    }

    // 2) Retourner tous les badges de la boutique
    const shopBadgeWhere: any = { shopId };

    const shopBadges = await prisma.badge.findMany({
      where: shopBadgeWhere,
      orderBy: { order: "asc" },
    });
    
    // Si aucun badge n'est trouvé pour cette boutique, créer les badges par défaut
    if (shopBadges.length === 0) {
      await createDefaultBadgesForShop(shopId);
      
      // Récupérer les badges nouvellement créés
      const newBadges = await prisma.badge.findMany({
        where: shopBadgeWhere,
        orderBy: { order: "asc" },
      });
      
      return NextResponse.json(newBadges);
    }
    
    return NextResponse.json(shopBadges);
  } catch (error) {
    console.error("Error fetching badges:", error);
    return NextResponse.json(
      { error: "Failed to fetch badges" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau badge (ADMIN ONLY, isolé par boutique)
export async function POST(request: NextRequest) {
  try {
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const body = await request.json();
    const { userId: providedUserId } = body;

    // Résoudre l'utilisateur admin agissant
    const userId = await resolveActingAdmin(providedUserId, shopId);

    // Vérifier les droits admin
    await requireAdmin(userId, shopId);

    const { name, imageUrl, requiredPoints, order } = body;

    if (!name || !imageUrl || requiredPoints === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: name, imageUrl, requiredPoints" },
        { status: 400 }
      );
    }

    // Vérifier si un badge avec ce nom existe déjà dans cette boutique
    const existingBadge = await prisma.badge.findUnique({
      where: {
        shopId_name: {
          shopId,
          name
        }
      }
    });

    if (existingBadge) {
      return NextResponse.json(
        { error: `Un badge nommé "${name}" existe déjà dans cette boutique` },
        { status: 409 }
      );
    }

    const badgeData: any = {
      name,
      imageUrl,
      requiredPoints,
      order: order || 0,
      isDefault: false,
      shopId, // ✅ ASSOCIER À LA BOUTIQUE
    };

    const badge = await prisma.badge.create({
      data: badgeData,
    });

    return NextResponse.json(badge);
  } catch (error) {
    console.error("Error creating badge:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent créer des badges" },
        { status: 403 }
      );
    }

    // Gestion spécifique des erreurs Prisma de contrainte d'unicité
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: "Un badge avec ce nom existe déjà dans cette boutique" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la création du badge" },
      { status: 500 }
    );
  }
}
