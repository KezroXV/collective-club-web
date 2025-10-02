import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";

const prisma = new PrismaClient();

// PUT - Mettre à jour une catégorie
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { categoryId } = await params;

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

    // Vérifier que la catégorie appartient à cette boutique
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        shopId
      }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found in this shop" },
        { status: 404 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: {
      name?: string;
      color?: string;
      description?: string | null;
      order?: number;
    } = {};
    
    if (body.name) {
      // Vérifier l'unicité du nom dans cette boutique
      const nameExists = await prisma.category.findFirst({
        where: {
          shopId,
          name: body.name,
          id: { not: categoryId }
        }
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 409 }
        );
      }

      updateData.name = body.name;
    }

    if (body.color) {
      updateData.color = body.color;
    }

    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    if (body.order !== undefined) {
      updateData.order = body.order;
    }

    // Mettre à jour la catégorie
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent modifier les catégories" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une catégorie
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { categoryId } = await params;

    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    
    // Récupérer ou utiliser l'utilisateur admin par défaut de cette boutique
    let userId = userIdParam;
    
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

    // Vérifier que la catégorie appartient à cette boutique
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        shopId
      },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found in this shop" },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des posts associés
    if (existingCategory._count.posts > 0) {
      // Option 1: Empêcher la suppression
      return NextResponse.json(
        { 
          error: `Cannot delete category with ${existingCategory._count.posts} post(s). Move or delete posts first.`,
          postsCount: existingCategory._count.posts 
        },
        { status: 409 }
      );
      
      // Option 2: Déplacer les posts vers "Non catégorisé" (commenté pour l'instant)
      /*
      // Trouver ou créer une catégorie "Non catégorisé"
      let uncategorized = await prisma.category.findFirst({
        where: {
          shopId,
          name: "Non catégorisé"
        }
      });

      if (!uncategorized) {
        uncategorized = await prisma.category.create({
          data: {
            name: "Non catégorisé",
            color: "bg-gray-500",
            description: "Posts sans catégorie spécifique",
            order: 999,
            shopId
          }
        });
      }

      // Déplacer tous les posts vers la catégorie "Non catégorisé"
      await prisma.post.updateMany({
        where: {
          categoryId: categoryId,
          shopId
        },
        data: {
          categoryId: uncategorized.id
        }
      });
      */
    }

    // Supprimer la catégorie
    await prisma.category.delete({
      where: { id: categoryId }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Category deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent supprimer les catégories" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}

// GET - Récupérer une catégorie spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { categoryId } = await params;

    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        shopId
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found in this shop" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}