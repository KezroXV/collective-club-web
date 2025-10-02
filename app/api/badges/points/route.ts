import { NextRequest, NextResponse } from 'next/server';
import { getUserBadgesWithStatus, unlockBadge, createDefaultBadges } from '@/lib/points';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/badges/points - Récupérer les badges avec système de points et leur statut pour un utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const shopId = searchParams.get('shopId');

    if (!userId || !shopId) {
      return NextResponse.json(
        { error: 'userId et shopId requis' },
        { status: 400 }
      );
    }

    const badgesWithStatus = await getUserBadgesWithStatus(userId, shopId);
    
    return NextResponse.json({
      badges: badgesWithStatus,
      unlockedCount: badgesWithStatus.filter(b => b.unlocked).length,
      totalCount: badgesWithStatus.length,
    });
  } catch (error) {
    console.error('Error in GET /api/badges/points:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des badges' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/badges/points - Débloquer un badge ou créer des badges par défaut
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, shopId, badgeId, currentUserRole } = body;

    if (action === 'unlock') {
      // Débloquer un badge avec des points
      if (!userId || !shopId || !badgeId) {
        return NextResponse.json(
          { error: 'userId, shopId et badgeId requis' },
          { status: 400 }
        );
      }

      const result = await unlockBadge(userId, shopId, badgeId);
      
      return NextResponse.json({
        success: true,
        badge: result.badge,
        unlockedAt: result.unlockedAt,
      });
    }

    if (action === 'create-defaults') {
      // Créer les badges par défaut (admin seulement)
      if (currentUserRole !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Accès non autorisé' },
          { status: 403 }
        );
      }

      if (!shopId) {
        return NextResponse.json(
          { error: 'shopId requis' },
          { status: 400 }
        );
      }

      await createDefaultBadges(shopId);
      
      return NextResponse.json({
        success: true,
        message: 'Badges par défaut créés',
      });
    }

    if (action === 'create') {
      // Créer un nouveau badge personnalisé (admin seulement)
      if (currentUserRole !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Accès non autorisé' },
          { status: 403 }
        );
      }

      const { name, imageUrl, requiredPoints, description } = body;

      if (!name || !imageUrl || requiredPoints === undefined || !shopId) {
        return NextResponse.json(
          { error: 'Tous les champs requis doivent être fournis' },
          { status: 400 }
        );
      }

      const badge = await prisma.badge.create({
        data: {
          name,
          imageUrl,
          requiredPoints,
          description,
          shopId,
          isDefault: false,
          order: 999, // Mis à la fin par défaut
        },
      });

      return NextResponse.json({
        success: true,
        badge,
      });
    }

    return NextResponse.json(
      { error: 'Action non reconnue' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in POST /api/badges/points:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}