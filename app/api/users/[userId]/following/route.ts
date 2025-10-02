import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

/**
 * GET /api/users/[userId]/following - Récupérer la liste des abonnements d'un utilisateur
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

    // Récupérer les abonnements avec pagination
    const [following, totalCount] = await Promise.all([
      prisma.follow.findMany({
        where: {
          followerId: userId,
          shopId,
        },
        include: {
          following: {
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
          followerId: userId,
          shopId,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      following: following.map(f => ({
        ...f.following,
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
    console.error('Error in GET /api/users/[userId]/following:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des abonnements' },
      { status: 500 }
    );
  }
}