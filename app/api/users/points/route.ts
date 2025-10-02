import { NextRequest, NextResponse } from 'next/server';
import { getUserPointsData, awardPoints } from '@/lib/points';
import { PointAction } from '@prisma/client';

/**
 * GET /api/users/points - Récupérer les points de l'utilisateur courant
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

    const userPointsData = await getUserPointsData(userId, shopId);
    
    return NextResponse.json({
      points: userPointsData.points,
      history: userPointsData.pointsHistory,
      totalTransactions: userPointsData.pointsHistory.length,
    });
  } catch (error) {
    console.error('Error in GET /api/users/points:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des points' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/points - Ajouter des points à un utilisateur (admin seulement)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, shopId, action, points: customPoints, currentUserRole } = body;

    // Vérifier que l'utilisateur courant est admin
    if (currentUserRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    if (!userId || !shopId || !action) {
      return NextResponse.json(
        { error: 'userId, shopId et action requis' },
        { status: 400 }
      );
    }

    // Valider l'action
    if (!Object.values(PointAction).includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide' },
        { status: 400 }
      );
    }

    const result = await awardPoints(userId, shopId, action, customPoints);
    
    return NextResponse.json({
      success: true,
      newTotal: result.points,
      pointsAwarded: customPoints || 0,
    });
  } catch (error) {
    console.error('Error in POST /api/users/points:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}