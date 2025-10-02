import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

/**
 * POST /api/users/[userId]/follow - Suivre un utilisateur
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { userId: targetUserId } = resolvedParams;
    const body = await request.json();
    const { followerId, shopId } = body;

    if (!followerId || !shopId) {
      return NextResponse.json(
        { error: 'followerId et shopId requis' },
        { status: 400 }
      );
    }

    // Vérifier qu'on ne suit pas soi-même
    if (followerId === targetUserId) {
      return NextResponse.json(
        { error: 'Impossible de se suivre soi-même' },
        { status: 400 }
      );
    }

    // Vérifier que les deux utilisateurs existent dans la même boutique
    const [follower, following] = await Promise.all([
      prisma.user.findFirst({
        where: { id: followerId, shopId },
        select: { id: true },
      }),
      prisma.user.findFirst({
        where: { id: targetUserId, shopId },
        select: { id: true },
      }),
    ]);

    if (!follower || !following) {
      return NextResponse.json(
        { error: 'Un ou plusieurs utilisateurs introuvables dans cette boutique' },
        { status: 404 }
      );
    }

    // Vérifier si déjà suivi
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Utilisateur déjà suivi' },
        { status: 400 }
      );
    }

    // Créer la relation de suivi
    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId: targetUserId,
        shopId,
      },
    });

    // Compter les nouvaux totaux
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({
        where: { followingId: targetUserId, shopId },
      }),
      prisma.follow.count({
        where: { followerId, shopId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      follow,
      followersCount,
      followingCount,
    });
  } catch (error) {
    console.error('Error in POST /api/users/[userId]/follow:', error);
    return NextResponse.json(
      { error: 'Erreur lors du suivi de l\'utilisateur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[userId]/follow - Ne plus suivre un utilisateur
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { userId: targetUserId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const followerId = searchParams.get('followerId');
    const shopId = searchParams.get('shopId');

    if (!followerId || !shopId) {
      return NextResponse.json(
        { error: 'followerId et shopId requis' },
        { status: 400 }
      );
    }

    // Vérifier que la relation de suivi existe
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUserId,
        },
      },
    });

    if (!existingFollow) {
      return NextResponse.json(
        { error: 'Relation de suivi introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que la relation appartient à la bonne boutique
    if (existingFollow.shopId !== shopId) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Supprimer la relation de suivi
    await prisma.follow.delete({
      where: {
        id: existingFollow.id,
      },
    });

    // Compter les nouveaux totaux
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({
        where: { followingId: targetUserId, shopId },
      }),
      prisma.follow.count({
        where: { followerId, shopId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      followersCount,
      followingCount,
    });
  } catch (error) {
    console.error('Error in DELETE /api/users/[userId]/follow:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'arrêt du suivi' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/[userId]/follow - Vérifier si un utilisateur suit l'utilisateur cible
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { userId: targetUserId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const followerId = searchParams.get('followerId');
    const shopId = searchParams.get('shopId');

    if (!followerId || !shopId) {
      return NextResponse.json(
        { error: 'followerId et shopId requis' },
        { status: 400 }
      );
    }

    const isFollowing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUserId,
        },
      },
    });

    // Compter les totaux
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({
        where: { followingId: targetUserId, shopId },
      }),
      prisma.follow.count({
        where: { followerId, shopId },
      }),
    ]);

    return NextResponse.json({
      isFollowing: !!isFollowing,
      followersCount,
      followingCount,
    });
  } catch (error) {
    console.error('Error in GET /api/users/[userId]/follow:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du suivi' },
      { status: 500 }
    );
  }
}