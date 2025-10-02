import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";

const prisma = new PrismaClient();

// POST /api/posts/[postId]/pin - Épingler un post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    console.log('PIN API POST: Starting request');
    
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);
    console.log('PIN API POST: ShopId obtained', { shopId });

    const { postId } = await params;
    const body = await request.json();
    const { userId, userRole } = body;
    
    console.log('PIN API POST: Request data', { postId, userId, userRole });

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: "User ID and role are required" },
        { status: 400 }
      );
    }

    // Vérifier les permissions - seulement Admin et Modérateur peuvent épingler
    if (!['ADMIN', 'MODERATOR'].includes(userRole)) {
      console.log('PIN API POST: Permission denied', { userRole });
      return NextResponse.json(
        { error: "Seuls les administrateurs et modérateurs peuvent épingler des posts" },
        { status: 403 }
      );
    }

    console.log('PIN API POST: Permissions OK');

    // Vérifier que le post existe et appartient à la bonne boutique
    const post = await prisma.post.findFirst({
      where: { 
        id: postId, 
        shopId 
      }
    });

    console.log('PIN API POST: Post query result', { found: !!post, postId, shopId });

    if (!post) {
      console.log('PIN API POST: Post not found');
      return NextResponse.json(
        { error: "Post not found in this shop" },
        { status: 404 }
      );
    }

    console.log('PIN API POST: Post found', { isPinned: post.isPinned });

    // Vérifier si le post n'est pas déjà épinglé
    if (post.isPinned) {
      console.log('PIN API POST: Post already pinned');
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { postId } = await params;
    const body = await request.json();
    const { userId, userRole } = body;

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: "User ID and role are required" },
        { status: 400 }
      );
    }

    // Vérifier les permissions - seulement Admin et Modérateur peuvent désépingler
    if (!['ADMIN', 'MODERATOR'].includes(userRole)) {
      return NextResponse.json(
        { error: "Seuls les administrateurs et modérateurs peuvent désépingler des posts" },
        { status: 403 }
      );
    }

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