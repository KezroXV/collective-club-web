import { PrismaClient, PointAction } from "@prisma/client";

const prisma = new PrismaClient();

// Configuration des points par action
export const POINTS_CONFIG = {
  [PointAction.POST_CREATED]: 10,
  [PointAction.COMMENT_CREATED]: 5,
  [PointAction.REACTION_RECEIVED]: 2,
  [PointAction.DAILY_LOGIN]: 1,
  [PointAction.BADGE_UNLOCKED]: 0, // Les points sont déduits, pas ajoutés
} as const;

/**
 * Attribuer des points à un utilisateur
 */
export async function awardPoints(
  userId: string,
  shopId: string,
  action: PointAction,
  customPoints?: number
) {
  const points = customPoints ?? POINTS_CONFIG[action];

  if (!points) {
    throw new Error(`Points not configured for action: ${action}`);
  }

  try {
    // Vérifier si l'utilisateur a déjà des points dans cette boutique
    let userPoints = await prisma.userPoints.findUnique({
      where: { userId_shopId: { userId, shopId } },
    });

    if (!userPoints) {
      // Créer l'enregistrement de points pour cet utilisateur
      userPoints = await prisma.userPoints.create({
        data: {
          userId,
          shopId,
          points: 0,
        },
      });
    }

    // Transaction pour mettre à jour les points et créer l'historique
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour les points totaux
      const updatedUserPoints = await tx.userPoints.update({
        where: { id: userPoints!.id },
        data: { points: { increment: points } },
      });

      // Créer l'enregistrement dans l'historique
      await tx.pointTransaction.create({
        data: {
          userId,
          shopId,
          points,
          action,
          description: getActionDescription(action, points),
          userPointsId: updatedUserPoints.id,
        },
      });

      return updatedUserPoints;
    });

    // Vérifier si de nouveaux badges peuvent être débloqués
    await checkBadgeUnlocks(userId, shopId, result.points);

    return result;
  } catch (error) {
    console.error("Error awarding points:", error);
    throw error;
  }
}

/**
 * Dépenser des points (pour débloquer des badges)
 */
export async function spendPoints(
  userId: string,
  shopId: string,
  points: number,
  description: string
) {
  try {
    const userPoints = await prisma.userPoints.findUnique({
      where: { userId_shopId: { userId, shopId } },
    });

    if (!userPoints || userPoints.points < points) {
      throw new Error("Points insuffisants");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Décrémenter les points
      const updatedUserPoints = await tx.userPoints.update({
        where: { id: userPoints.id },
        data: { points: { decrement: points } },
      });

      // Créer l'enregistrement dans l'historique
      await tx.pointTransaction.create({
        data: {
          userId,
          shopId,
          points: -points, // Négatif pour indiquer une dépense
          action: PointAction.BADGE_UNLOCKED,
          description,
          userPointsId: updatedUserPoints.id,
        },
      });

      return updatedUserPoints;
    });

    return result;
  } catch (error) {
    console.error("Error spending points:", error);
    throw error;
  }
}

/**
 * Vérifier et débloquer automatiquement les badges
 */
export async function checkBadgeUnlocks(
  userId: string,
  shopId: string,
  currentPoints: number
) {
  try {
    // Récupérer les badges disponibles dans cette boutique
    const availableBadges = await prisma.badge.findMany({
      where: {
        shopId,
        requiredPoints: { lte: currentPoints },
      },
    });

    // Récupérer les badges déjà débloqués par cet utilisateur
    const unlockedBadges = await prisma.userBadge.findMany({
      where: { userId, shopId },
    });

    const unlockedBadgeIds = new Set(unlockedBadges.map((ub) => ub.badgeId));

    // Débloquer automatiquement les badges éligibles
    const badgesToUnlock = availableBadges.filter(
      (badge) =>
        !unlockedBadgeIds.has(badge.id) && badge.requiredPoints <= currentPoints
    );

    if (badgesToUnlock.length > 0) {
      await prisma.userBadge.createMany({
        data: badgesToUnlock.map((badge) => ({
          userId,
          badgeId: badge.id,
          shopId,
        })),
      });

      return badgesToUnlock;
    }

    return [];
  } catch (error) {
    console.error("Error checking badge unlocks:", error);
    throw error;
  }
}

/**
 * Débloquer manuellement un badge avec les points
 */
export async function unlockBadge(
  userId: string,
  shopId: string,
  badgeId: string
) {
  try {
    // Vérifier si le badge existe et récupérer ses infos
    const badge = await prisma.badge.findUnique({
      where: { id: badgeId },
    });

    if (!badge || badge.shopId !== shopId) {
      throw new Error("Badge introuvable");
    }

    // Vérifier si l'utilisateur a déjà ce badge
    const existingUserBadge = await prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } },
    });

    if (existingUserBadge) {
      throw new Error("Badge déjà débloqué");
    }

    // Vérifier les points de l'utilisateur
    const userPoints = await prisma.userPoints.findUnique({
      where: { userId_shopId: { userId, shopId } },
    });

    if (!userPoints || userPoints.points < badge.requiredPoints) {
      throw new Error("Points insuffisants pour débloquer ce badge");
    }

    // Débloquer le badge et dépenser les points
    const result = await prisma.$transaction(async (tx) => {
      // Dépenser les points
      await spendPoints(
        userId,
        shopId,
        badge.requiredPoints,
        `Badge débloqué: ${badge.name}`
      );

      // Débloquer le badge
      const userBadge = await tx.userBadge.create({
        data: {
          userId,
          badgeId,
          shopId,
        },
        include: {
          badge: true,
        },
      });

      return userBadge;
    });

    return result;
  } catch (error) {
    console.error("Error unlocking badge:", error);
    throw error;
  }
}

/**
 * Obtenir les points et l'historique d'un utilisateur
 */
export async function getUserPointsData(userId: string, shopId: string) {
  try {
    const userPoints = await prisma.userPoints.findUnique({
      where: { userId_shopId: { userId, shopId } },
      include: {
        pointsHistory: {
          orderBy: { createdAt: "desc" },
          take: 50, // Dernières 50 transactions
        },
      },
    });

    if (!userPoints) {
      // Créer l'enregistrement s'il n'existe pas
      return await prisma.userPoints.create({
        data: {
          userId,
          shopId,
          points: 0,
        },
        include: {
          pointsHistory: true,
        },
      });
    }

    return userPoints;
  } catch (error) {
    console.error("Error getting user points data:", error);
    throw error;
  }
}

/**
 * Obtenir les badges d'un utilisateur avec leur statut
 */
export async function getUserBadgesWithStatus(userId: string, shopId: string) {
  try {
    const userPoints = await getUserPointsData(userId, shopId);

    const [allBadges, unlockedBadges] = await Promise.all([
      prisma.badge.findMany({
        where: { shopId },
        orderBy: { order: "asc" },
      }),
      prisma.userBadge.findMany({
        where: { userId, shopId },
        include: { badge: true },
      }),
    ]);

    const unlockedBadgeIds = new Set(unlockedBadges.map((ub) => ub.badgeId));

    return allBadges.map((badge) => ({
      ...badge,
      unlocked: unlockedBadgeIds.has(badge.id),
      canUnlock:
        !unlockedBadgeIds.has(badge.id) &&
        userPoints.points >= badge.requiredPoints,
      unlockedAt: unlockedBadges.find((ub) => ub.badgeId === badge.id)
        ?.unlockedAt,
    }));
  } catch (error) {
    console.error("Error getting user badges with status:", error);
    throw error;
  }
}

/**
 * Créer les badges par défaut pour une boutique
 */
export async function createDefaultBadges(shopId: string) {
  const defaultBadges = [
    {
      name: "Nouveau",
      imageUrl: "/badges/nouveau.svg",
      requiredPoints: 0,
      description: "Bienvenue dans la communauté !",
      isDefault: true,
      order: 1,
    },
    {
      name: "Novice",
      imageUrl: "/badges/novice.svg",
      requiredPoints: 50,
      description: "Vous commencez à participer activement !",
      isDefault: true,
      order: 2,
    },
    {
      name: "Intermédiaire",
      imageUrl: "/badges/intermediaire.svg",
      requiredPoints: 200,
      description: "Membre actif de la communauté !",
      isDefault: true,
      order: 3,
    },
    {
      name: "Expert",
      imageUrl: "/badges/expert.svg",
      requiredPoints: 500,
      description: "Expert reconnu de la communauté !",
      isDefault: true,
      order: 4,
    },
  ];

  try {
    const createdBadges = await prisma.badge.createMany({
      data: defaultBadges.map((badge) => ({
        ...badge,
        shopId,
      })),
      skipDuplicates: true,
    });

    return createdBadges;
  } catch (error) {
    console.error("Error creating default badges:", error);
    throw error;
  }
}

/**
 * Helper: Description des actions pour l'historique
 */
function getActionDescription(action: PointAction, points: number): string {
  switch (action) {
    case PointAction.POST_CREATED:
      return `Post créé (+${points} points)`;
    case PointAction.COMMENT_CREATED:
      return `Commentaire ajouté (+${points} points)`;
    case PointAction.REACTION_RECEIVED:
      return `Réaction reçue (+${points} points)`;
    case PointAction.DAILY_LOGIN:
      return `Connexion quotidienne (+${points} points)`;
    case PointAction.BADGE_UNLOCKED:
      return `Badge débloqué (-${Math.abs(points)} points)`;
    default:
      return `Action inconnue (${points} points)`;
  }
}

export default prisma;
