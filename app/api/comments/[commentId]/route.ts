import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";

const prisma = new PrismaClient();

// DELETE /api/comments/[commentId] - Supprimer un commentaire
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { commentId } = await params;
    const body = await request.json();
    const { userId, userRole } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Récupérer le commentaire avec ses informations
    const comment = await prisma.comment.findFirst({
      where: { 
        id: commentId, 
        shopId 
      },
      include: {
        author: {
          select: { id: true }
        }
      }
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Vérifier les permissions de suppression
    const canDelete = 
      comment.author.id === userId || // L'auteur peut supprimer son propre commentaire
      userRole === 'ADMIN' ||        // Les admins peuvent tout supprimer
      userRole === 'MODERATOR';      // Les modérateurs peuvent tout supprimer

    if (!canDelete) {
      return NextResponse.json(
        { error: "You don't have permission to delete this comment" },
        { status: 403 }
      );
    }

    // Supprimer d'abord toutes les réactions du commentaire et de ses réponses
    const commentAndReplies = await prisma.comment.findMany({
      where: {
        OR: [
          { id: commentId },
          { parentId: commentId }
        ],
        shopId
      },
      select: { id: true }
    });

    const commentIds = commentAndReplies.map(c => c.id);

    // Supprimer toutes les réactions des commentaires concernés
    await prisma.reaction.deleteMany({
      where: {
        commentId: { in: commentIds },
        shopId
      }
    });

    // Supprimer les réponses (sous-commentaires) en premier
    await prisma.comment.deleteMany({
      where: {
        parentId: commentId,
        shopId
      }
    });

    // Ensuite supprimer le commentaire principal
    await prisma.comment.delete({
      where: {
        id: commentId
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Comment deleted successfully" 
    });

  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}