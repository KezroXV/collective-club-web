import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";
import { subDays } from "date-fns";

const prisma = new PrismaClient();

interface StatsResponse {
  posts: {
    total: number;
    variation: number;
    trend: 'up' | 'down';
  };
  engagement: {
    total: number;
    variation: number;
    trend: 'up' | 'down';
  };
  members: {
    total: number;
    variation: number;
    trend: 'up' | 'down';
  };
}

interface PeriodStats {
  start: Date;
  end: Date;
}

async function calculatePostsStats(shopId: string, currentPeriod: PeriodStats, previousPeriod: PeriodStats) {
  // Compter les posts de la période actuelle
  const currentPosts = await prisma.post.count({
    where: {
      shopId,
      createdAt: {
        gte: currentPeriod.start,
        lte: currentPeriod.end,
      },
    },
  });

  // Compter les posts de la période précédente
  const previousPosts = await prisma.post.count({
    where: {
      shopId,
      createdAt: {
        gte: previousPeriod.start,
        lte: previousPeriod.end,
      },
    },
  });

  // Calculer la variation
  let variation = 0;
  if (previousPosts > 0) {
    variation = Math.round(((currentPosts - previousPosts) / previousPosts) * 100);
  } else if (currentPosts > 0) {
    variation = 100;
  }

  return {
    total: currentPosts,
    variation: Math.abs(variation),
    trend: variation >= 0 ? 'up' as const : 'down' as const,
  };
}

async function calculateEngagementStats(shopId: string, currentPeriod: PeriodStats, previousPeriod: PeriodStats) {
  // Engagement actuel (réactions + commentaires)
  const currentReactions = await prisma.reaction.count({
    where: {
      post: { shopId },
      createdAt: {
        gte: currentPeriod.start,
        lte: currentPeriod.end,
      },
    },
  });

  const currentComments = await prisma.comment.count({
    where: {
      post: { shopId },
      createdAt: {
        gte: currentPeriod.start,
        lte: currentPeriod.end,
      },
    },
  });

  const currentEngagement = currentReactions + currentComments;

  // Engagement précédent
  const previousReactions = await prisma.reaction.count({
    where: {
      post: { shopId },
      createdAt: {
        gte: previousPeriod.start,
        lte: previousPeriod.end,
      },
    },
  });

  const previousComments = await prisma.comment.count({
    where: {
      post: { shopId },
      createdAt: {
        gte: previousPeriod.start,
        lte: previousPeriod.end,
      },
    },
  });

  const previousEngagement = previousReactions + previousComments;

  // Calculer la variation
  let variation = 0;
  if (previousEngagement > 0) {
    variation = Math.round(((currentEngagement - previousEngagement) / previousEngagement) * 100);
  } else if (currentEngagement > 0) {
    variation = 100;
  }

  return {
    total: currentEngagement,
    variation: Math.abs(variation),
    trend: variation >= 0 ? 'up' as const : 'down' as const,
  };
}

async function calculateMembersStats(shopId: string, currentPeriod: PeriodStats, previousPeriod: PeriodStats) {
  // Utilisateurs actifs actuels (avec posts ou commentaires récents)
  const currentActiveUsers = await prisma.user.count({
    where: {
      shopId,
      OR: [
        {
          posts: {
            some: {
              createdAt: {
                gte: currentPeriod.start,
                lte: currentPeriod.end,
              },
            },
          },
        },
        {
          comments: {
            some: {
              createdAt: {
                gte: currentPeriod.start,
                lte: currentPeriod.end,
              },
            },
          },
        },
        {
          reactions: {
            some: {
              createdAt: {
                gte: currentPeriod.start,
                lte: currentPeriod.end,
              },
            },
          },
        },
      ],
    },
  });

  // Utilisateurs actifs précédents
  const previousActiveUsers = await prisma.user.count({
    where: {
      shopId,
      OR: [
        {
          posts: {
            some: {
              createdAt: {
                gte: previousPeriod.start,
                lte: previousPeriod.end,
              },
            },
          },
        },
        {
          comments: {
            some: {
              createdAt: {
                gte: previousPeriod.start,
                lte: previousPeriod.end,
              },
            },
          },
        },
        {
          reactions: {
            some: {
              createdAt: {
                gte: previousPeriod.start,
                lte: previousPeriod.end,
              },
            },
          },
        },
      ],
    },
  });

  // Calculer la variation
  let variation = 0;
  if (previousActiveUsers > 0) {
    variation = Math.round(((currentActiveUsers - previousActiveUsers) / previousActiveUsers) * 100);
  } else if (currentActiveUsers > 0) {
    variation = 100;
  }

  return {
    total: currentActiveUsers,
    variation: Math.abs(variation),
    trend: variation >= 0 ? 'up' as const : 'down' as const,
  };
}

export async function GET(request: NextRequest): Promise<NextResponse<StatsResponse>> {
  try {
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    // Définir les périodes de calcul
    const now = new Date();
    
    // Période actuelle (30 derniers jours)
    const currentPeriod: PeriodStats = {
      start: subDays(now, 30),
      end: now,
    };
    
    // Période précédente (60-30 jours)
    const previousPeriod: PeriodStats = {
      start: subDays(now, 60),
      end: subDays(now, 30),
    };

    // Calculer toutes les statistiques en parallèle pour optimiser les performances
    const [postsStats, engagementStats, membersStats] = await Promise.all([
      calculatePostsStats(shopId, currentPeriod, previousPeriod),
      calculateEngagementStats(shopId, currentPeriod, previousPeriod),
      calculateMembersStats(shopId, currentPeriod, previousPeriod),
    ]);

    const response: StatsResponse = {
      posts: postsStats,
      engagement: engagementStats,
      members: membersStats,
    };

    return NextResponse.json(response, {
      headers: {
        // Cache pendant 5 minutes
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
      },
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { 
        posts: { total: 0, variation: 0, trend: 'up' as const },
        engagement: { total: 0, variation: 0, trend: 'up' as const },
        members: { total: 0, variation: 0, trend: 'up' as const },
      },
      { status: 500 }
    );
  }
}