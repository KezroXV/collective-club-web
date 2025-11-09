import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";
import { requireAuthAdmin } from "@/lib/hybridAuth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const categories = await prisma.category.findMany({
      where: { 
        isActive: true,
        shopId // ✅ FILTRER PAR BOUTIQUE
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ SÉCURITÉ: Authentification OBLIGATOIRE - Admin uniquement (supporte Shopify + NextAuth)
    const auth = await requireAuthAdmin(request);
    const shopId = auth.shopId;
    ensureShopIsolation(shopId);

    const body = await request.json();
    const { name, color, description, order } = body;

    if (!name || !color) {
      return NextResponse.json(
        { error: "Name and color are required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        color,
        description,
        order: order || 0,
        shopId, // ✅ ASSOCIER À LA BOUTIQUE
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);

    // ✅ SÉCURITÉ: Gestion d'erreur d'authentification
    if (error instanceof Error) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json(
          { error: "Seuls les administrateurs peuvent créer des catégories" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
