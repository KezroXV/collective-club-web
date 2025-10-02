import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";

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
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const body = await request.json();
    
    // Récupérer ou utiliser l'utilisateur admin par défaut de cette boutique
    let userId = body.userId;
    
    if (!userId) {
      // Trouver un admin dans cette boutique comme fallback
      const adminUser = await prisma.user.findFirst({
        where: {
          shopId,
          role: "ADMIN"
        }
      });
      
      if (!adminUser) {
        return NextResponse.json(
          { error: "No admin user found in this shop" },
          { status: 403 }
        );
      }
      
      userId = adminUser.id;
    }
    
    // Vérifier les droits admin dans cette boutique
    await requireAdmin(userId, shopId);
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
    
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent créer des catégories" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
