import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ReactionType } from '@prisma/client';
import { getShopId, ensureShopIsolation } from '@/lib/shopIsolation';
import { awardPoints } from '@/lib/points';
import { PointAction } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{
    commentId: string;
  }>;
}

/**
 * POST /api/comments/[commentId]/reactions - Ajouter une réaction à un commentaire
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { commentId } = await params;
    const body = await request.json();
    const { type, userId } = body;

    if (!type || !userId) {
      return NextResponse.json(
        { error: 'Type de réaction et userId requis' },
        { status: 400 }
      );
    }

    // Vérifier que le commentaire existe dans cette boutique
    const comment = await prisma.comment.findFirst({
      where: { id: commentId, shopId },
      include: { author: { select: { id: true } } }
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Commentaire introuvable dans cette boutique' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur existe dans cette boutique
    const user = await prisma.user.findFirst({
      where: { id: userId, shopId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable dans cette boutique' },
        { status: 404 }
      );
    }

    // Supprimer l'ancienne réaction à ce commentaire spécifique si elle existe
    await prisma.reaction.deleteMany({
      where: {
        userId,
        commentId,
        shopId,
        postId: null // S'assurer qu'on ne supprime que les réactions de commentaires
      }
    });

    // Créer la nouvelle réaction pour le commentaire
    const reaction = await prisma.reaction.create({
      data: {
        type: type as ReactionType,
        userId,
        commentId,
        postId: null, // Explicitement null pour les réactions de commentaires
        shopId
      }
    });

    // Attribuer des points à l'auteur du commentaire (sauf si c'est lui-même qui réagit)
    if (comment.author.id !== userId) {
      await awardPoints(comment.author.id, shopId, PointAction.REACTION_RECEIVED);
    }

    // Récupérer toutes les réactions du commentaire après l'ajout
    const allReactions = await prisma.reaction.findMany({
      where: {
        commentId,
        shopId,
        postId: null // Seulement les réactions de commentaires
      }
    });

    // Grouper les réactions par type
    const reactionsGrouped = allReactions.reduce((acc: any, reaction: any) => {
      const existingType = acc.find((r: any) => r.type === reaction.type);
      if (existingType) {
        existingType.count += 1;
      } else {
        acc.push({ type: reaction.type, count: 1 });
      }
      return acc;
    }, []);

    // Trouver la réaction de l'utilisateur actuel
    const userReaction = allReactions.find(r => r.userId === userId)?.type || null;

    return NextResponse.json({
      success: true,
      reactions: reactionsGrouped,
      userReaction,
      totalCount: allReactions.length
    });
  } catch (error) {
    console.error('Error in POST /api/comments/[commentId]/reactions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout de la réaction' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments/[commentId]/reactions - Supprimer une réaction d'un commentaire
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { commentId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requis' },
        { status: 400 }
      );
    }

    // Supprimer la réaction du commentaire spécifique
    const deletedReactions = await prisma.reaction.deleteMany({
      where: {
        userId,
        commentId,
        shopId,
        postId: null // Seulement les réactions de commentaires
      }
    });

    return NextResponse.json({
      success: true,
      deletedCount: deletedReactions.count
    });
  } catch (error) {
    console.error('Error in DELETE /api/comments/[commentId]/reactions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la réaction' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/comments/[commentId]/reactions - Récupérer les réactions d'un commentaire
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { commentId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Récupérer toutes les réactions du commentaire
    const reactions = await prisma.reaction.findMany({
      where: {
        commentId,
        shopId,
        postId: null // Seulement les réactions de commentaires
      }
    });

    // Grouper les réactions par type
    const reactionsGrouped = reactions.reduce((acc: any, reaction: any) => {
      const existingType = acc.find((r: any) => r.type === reaction.type);
      if (existingType) {
        existingType.count += 1;
      } else {
        acc.push({ type: reaction.type, count: 1 });
      }
      return acc;
    }, []);

    // Trouver la réaction de l'utilisateur actuel
    const userReaction = userId 
      ? reactions.find(r => r.userId === userId)?.type 
      : null;

    return NextResponse.json({
      reactions: reactionsGrouped,
      userReaction,
      totalCount: reactions.length
    });
  } catch (error) {
    console.error('Error in GET /api/comments/[commentId]/reactions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des réactions' },
      { status: 500 }
    );
  }
}