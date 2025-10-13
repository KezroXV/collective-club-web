import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";
import { getAuthContext } from "@/lib/auth-context";

const prisma = new PrismaClient();

// DELETE /api/comments/[commentId] - Supprimer un commentaire
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    // ✅ SÉCURITÉ: Authentification OBLIGATOIRE via session NextAuth
    const { user, shopId } = await getAuthContext();
    ensureShopIsolation(shopId);

    const { commentId } = await params;

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

    // ✅ SÉCURITÉ: Vérifier les permissions de suppression avec l'utilisateur authentifié
    const canDelete =
      comment.author.id === user.id ||  // L'auteur peut supprimer son propre commentaire
      user.role === 'ADMIN' ||          // Les admins peuvent tout supprimer
      user.role === 'MODERATOR';        // Les modérateurs peuvent tout supprimer

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

    // ✅ SÉCURITÉ: Gestion d'erreur d'authentification
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}