import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";
import { requireModerator } from "@/lib/apiAuth";

const prisma = new PrismaClient();

// POST /api/posts/[postId]/pin - Épingler un post
// ✅ SÉCURISÉ: Utilise l'authentification du contexte serveur
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // ✅ SÉCURITÉ: Authentification et vérification rôle ADMIN/MODERATOR
    const auth = await requireModerator(request);

    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { postId } = await params;

    // Vérifier que le post existe et appartient à la bonne boutique
    const post = await prisma.post.findFirst({
      where: { 
        id: postId, 
        shopId 
      }
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found in this shop" },
        { status: 404 }
      );
    }

    // Vérifier si le post n'est pas déjà épinglé
    if (post.isPinned) {
      return NextResponse.json(
        { error: "Post is already pinned" },
        { status: 400 }
      );
    }

    // Vérifier la limite de 3 posts épinglés par boutique
    const pinnedCount = await prisma.post.count({
      where: { 
        shopId, 
        isPinned: true 
      }
    });

    if (pinnedCount >= 3) {
      return NextResponse.json(
        { error: "Maximum 3 posts épinglés autorisés par boutique" },
        { status: 400 }
      );
    }

    // Épingler le post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { 
        isPinned: true,
        pinnedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Post épinglé avec succès",
      post: updatedPost
    });

  } catch (error) {
    console.error("Error pinning post:", error);
    return NextResponse.json(
      { error: "Failed to pin post" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[postId]/pin - Désépingler un post
// ✅ SÉCURISÉ: Utilise l'authentification du contexte serveur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // ✅ SÉCURITÉ: Authentification et vérification rôle ADMIN/MODERATOR
    const auth = await requireModerator(request);

    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { postId } = await params;

    // Vérifier que le post existe et appartient à la bonne boutique
    const post = await prisma.post.findFirst({
      where: { 
        id: postId, 
        shopId 
      }
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found in this shop" },
        { status: 404 }
      );
    }

    // Vérifier si le post est épinglé
    if (!post.isPinned) {
      return NextResponse.json(
        { error: "Post is not pinned" },
        { status: 400 }
      );
    }

    // Désépingler le post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { 
        isPinned: false,
        pinnedAt: null
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Post désépinglé avec succès",
      post: updatedPost
    });

  } catch (error) {
    console.error("Error unpinning post:", error);
    return NextResponse.json(
      { error: "Failed to unpin post" },
      { status: 500 }
    );
  }
}