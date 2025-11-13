import { NextRequest, NextResponse } from 'next/server';
import { getUserPointsData, awardPoints } from '@/lib/points';
import { PointAction } from '@prisma/client';
import { requireAuth, requireAdmin } from '@/lib/apiAuth';
import { getShopId } from '@/lib/shopIsolation';

/**
 * GET /api/users/points - Récupérer les points de l'utilisateur courant
 * ✅ SÉCURISÉ: Utilise l'authentification et shopId du contexte serveur
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ SÉCURITÉ: Authentification obligatoire
    const auth = await requireAuth(request);

    // ✅ SÉCURITÉ: shopId du contexte serveur, pas des params
    const shopId = await getShopId(request);

    const userPointsData = await getUserPointsData(auth.userId, shopId);
    
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
 * ✅ SÉCURISÉ: Utilise l'authentification du contexte serveur
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ SÉCURITÉ: Authentification et vérification rôle ADMIN
    const auth = await requireAdmin(request);

    // ✅ SÉCURITÉ: shopId du contexte serveur, pas du body
    const shopId = await getShopId(request);

    const body = await request.json();
    const { userId, action, points: customPoints } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId et action requis' },
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