import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

/**
 * GET /api/users/[userId]/followers - Récupérer la liste des abonnés d'un utilisateur
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { userId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (!shopId) {
      return NextResponse.json(
        { error: 'shopId requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe dans cette boutique
    const user = await prisma.user.findFirst({
      where: { id: userId, shopId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable dans cette boutique' },
        { status: 404 }
      );
    }

    // Récupérer les abonnés avec pagination
    const [followers, totalCount] = await Promise.all([
      prisma.follow.findMany({
        where: {
          followingId: userId,
          shopId,
        },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.follow.count({
        where: {
          followingId: userId,
          shopId,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      followers: followers.map(f => ({
        ...f.follower,
        followedAt: f.createdAt,
      })),
      pagination: {
        current: page,
        total: totalPages,
        count: totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/users/[userId]/followers:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des abonnés' },
      { status: 500 }
    );
  }
}