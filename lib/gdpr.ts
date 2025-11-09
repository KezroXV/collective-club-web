/**
 * 🔒 GDPR/RGPD Data Export Utilities
 * Fonctions pour exporter les données utilisateur conformément au RGPD
 */

import { prisma } from '@/lib/prisma';

/**
 * Interface pour les données utilisateur exportées
 */
export interface UserDataExport {
  metadata: {
    exportDate: string;
    dataSubject: string;
    shopDomain: string;
    format: 'json';
  };
  personalInformation: {
    userId: string;
    email: string;
    name: string | null;
    image: string | null;
    role: string;
    isShopOwner: boolean;
    isBanned: boolean;
    bannedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  accounts: Array<{
    provider: string;
    providerAccountId: string;
    createdDate: string;
  }>;
  posts: Array<{
    id: string;
    title: string;
    content: string;
    slug: string | null;
    imageUrl: string | null;
    isPinned: boolean;
    status: string;
    categoryName: string | null;
    createdAt: string;
    updatedAt: string;
    reactionsCount: number;
    commentsCount: number;
  }>;
  comments: Array<{
    id: string;
    content: string;
    postTitle: string;
    parentCommentId: string | null;
    createdAt: string;
    updatedAt: string;
    reactionsCount: number;
  }>;
  reactions: Array<{
    id: string;
    type: string;
    targetType: 'post' | 'comment';
    targetId: string;
    createdAt: string;
  }>;
  pollVotes: Array<{
    pollQuestion: string;
    optionText: string;
    postTitle: string;
    votedAt: string;
  }>;
  socialConnections: {
    following: Array<{
      userId: string;
      userName: string | null;
      followedSince: string;
    }>;
    followers: Array<{
      userId: string;
      userName: string | null;
      followedSince: string;
    }>;
  };
  gamification: {
    totalPoints: number;
    badges: Array<{
      badgeName: string;
      badgeImageUrl: string;
      unlockedAt: string;
    }>;
    pointTransactions: Array<{
      points: number;
      action: string;
      description: string | null;
      createdAt: string;
    }>;
  };
  customization: {
    colorPosts: string;
    colorBorders: string;
    colorBg: string;
    colorText: string;
    selectedFont: string;
    coverImageUrl: string | null;
    bannerImageUrl: string;
    logoImageUrl: string | null;
  } | null;
  onboarding: {
    hasLikedPost: boolean;
    hasCommentedPost: boolean;
    hasCreatedPost: boolean;
    completedAt: string | null;
  } | null;
}

/**
 * Collecte toutes les données d'un utilisateur pour export RGPD
 * @param shopId - ID de la boutique
 * @param userEmail - Email de l'utilisateur
 * @returns Objet avec toutes les données utilisateur
 */
export async function collectUserData(
  shopId: string,
  userEmail: string
): Promise<UserDataExport | null> {
  try {
    // 1. Récupérer l'utilisateur
    const user = await prisma.user.findFirst({
      where: {
        shopId,
        email: userEmail,
      },
      include: {
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
          },
        },
        posts: {
          include: {
            category: {
              select: { name: true },
            },
            _count: {
              select: {
                reactions: true,
                comments: true,
              },
            },
          },
        },
        comments: {
          include: {
            post: {
              select: { title: true },
            },
            _count: {
              select: {
                reactions: true,
              },
            },
          },
        },
        reactions: {
          include: {
            post: {
              select: { id: true },
            },
            comment: {
              select: { id: true },
            },
          },
        },
        PollVote: {
          include: {
            poll: {
              select: {
                question: true,
                post: {
                  select: { title: true },
                },
              },
            },
            option: {
              select: { text: true },
            },
          },
        },
        following: {
          include: {
            following: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        followers: {
          include: {
            follower: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        userPoints: {
          select: {
            points: true,
          },
        },
        pointTransactions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        userBadges: {
          include: {
            badge: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        customizationSettings: {
          select: {
            colorPosts: true,
            colorBorders: true,
            colorBg: true,
            colorText: true,
            selectedFont: true,
            coverImageUrl: true,
            bannerImageUrl: true,
            logoImageUrl: true,
          },
        },
        onboarding: {
          select: {
            hasLikedPost: true,
            hasCommentedPost: true,
            hasCreatedPost: true,
            completedAt: true,
          },
        },
        shop: {
          select: {
            shopDomain: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // 2. Construire l'export structuré
    const exportData: UserDataExport = {
      metadata: {
        exportDate: new Date().toISOString(),
        dataSubject: user.email,
        shopDomain: user.shop.shopDomain,
        format: 'json',
      },

      personalInformation: {
        userId: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        isShopOwner: user.isShopOwner,
        isBanned: user.isBanned,
        bannedAt: user.bannedAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },

      accounts: user.accounts.map((account) => ({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        createdDate: new Date().toISOString(), // Account n'a pas de createdAt dans le schema
      })),

      posts: user.posts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        slug: post.slug,
        imageUrl: post.imageUrl,
        isPinned: post.isPinned,
        status: post.status,
        categoryName: post.category?.name || null,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        reactionsCount: post._count.reactions,
        commentsCount: post._count.comments,
      })),

      comments: user.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        postTitle: comment.post.title,
        parentCommentId: comment.parentId,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        reactionsCount: comment._count.reactions,
      })),

      reactions: user.reactions.map((reaction) => ({
        id: reaction.id,
        type: reaction.type,
        targetType: reaction.postId ? 'post' : 'comment',
        targetId: reaction.postId || reaction.commentId || '',
        createdAt: reaction.createdAt.toISOString(),
      })),

      pollVotes: user.PollVote.map((vote) => ({
        pollQuestion: vote.poll.question,
        optionText: vote.option.text,
        postTitle: vote.poll.post.title,
        votedAt: vote.createdAt.toISOString(),
      })),

      socialConnections: {
        following: user.following.map((follow) => ({
          userId: follow.following.id,
          userName: follow.following.name,
          followedSince: follow.createdAt.toISOString(),
        })),
        followers: user.followers.map((follow) => ({
          userId: follow.follower.id,
          userName: follow.follower.name,
          followedSince: follow.createdAt.toISOString(),
        })),
      },

      gamification: {
        totalPoints: user.userPoints[0]?.points || 0,
        badges: user.userBadges.map((userBadge) => ({
          badgeName: userBadge.badge.name,
          badgeImageUrl: userBadge.badge.imageUrl,
          unlockedAt: userBadge.unlockedAt.toISOString(),
        })),
        pointTransactions: user.pointTransactions.map((transaction) => ({
          points: transaction.points,
          action: transaction.action,
          description: transaction.description,
          createdAt: transaction.createdAt.toISOString(),
        })),
      },

      customization: user.customizationSettings[0] || null,

      onboarding: user.onboarding[0]
        ? {
            hasLikedPost: user.onboarding[0].hasLikedPost,
            hasCommentedPost: user.onboarding[0].hasCommentedPost,
            hasCreatedPost: user.onboarding[0].hasCreatedPost,
            completedAt: user.onboarding[0].completedAt?.toISOString() || null,
          }
        : null,
    };

    return exportData;
  } catch (error) {
    console.error('Error collecting user data:', error);
    throw error;
  }
}

/**
 * Génère un rapport formaté en JSON lisible
 * @param userData - Données utilisateur exportées
 * @returns String JSON formaté
 */
export function generateJSONReport(userData: UserDataExport): string {
  return JSON.stringify(userData, null, 2);
}

/**
 * Génère un rapport en format texte lisible (pour email)
 * @param userData - Données utilisateur exportées
 * @returns String texte formaté
 */
export function generateTextReport(userData: UserDataExport): string {
  const lines: string[] = [];

  lines.push('========================================');
  lines.push('RAPPORT D\'EXPORT DE DONNÉES RGPD/GDPR');
  lines.push('========================================');
  lines.push('');
  lines.push(`Date d'export: ${new Date(userData.metadata.exportDate).toLocaleString('fr-FR')}`);
  lines.push(`Boutique: ${userData.metadata.shopDomain}`);
  lines.push(`Email: ${userData.metadata.dataSubject}`);
  lines.push('');

  lines.push('--- INFORMATIONS PERSONNELLES ---');
  lines.push(`ID Utilisateur: ${userData.personalInformation.userId}`);
  lines.push(`Nom: ${userData.personalInformation.name || 'Non renseigné'}`);
  lines.push(`Email: ${userData.personalInformation.email}`);
  lines.push(`Rôle: ${userData.personalInformation.role}`);
  lines.push(`Compte créé le: ${new Date(userData.personalInformation.createdAt).toLocaleString('fr-FR')}`);
  lines.push('');

  lines.push('--- COMPTES CONNECTÉS ---');
  if (userData.accounts.length === 0) {
    lines.push('Aucun compte connecté');
  } else {
    userData.accounts.forEach((account) => {
      lines.push(`- ${account.provider} (ID: ${account.providerAccountId})`);
    });
  }
  lines.push('');

  lines.push('--- ACTIVITÉ ---');
  lines.push(`Posts créés: ${userData.posts.length}`);
  lines.push(`Commentaires: ${userData.comments.length}`);
  lines.push(`Réactions: ${userData.reactions.length}`);
  lines.push(`Votes aux sondages: ${userData.pollVotes.length}`);
  lines.push('');

  lines.push('--- CONNEXIONS SOCIALES ---');
  lines.push(`Abonnements: ${userData.socialConnections.following.length}`);
  lines.push(`Abonnés: ${userData.socialConnections.followers.length}`);
  lines.push('');

  lines.push('--- GAMIFICATION ---');
  lines.push(`Points totaux: ${userData.gamification.totalPoints}`);
  lines.push(`Badges débloqués: ${userData.gamification.badges.length}`);
  if (userData.gamification.badges.length > 0) {
    userData.gamification.badges.forEach((badge) => {
      lines.push(`  - ${badge.badgeName} (débloqué le ${new Date(badge.unlockedAt).toLocaleDateString('fr-FR')})`);
    });
  }
  lines.push('');

  lines.push('========================================');
  lines.push('FIN DU RAPPORT');
  lines.push('========================================');
  lines.push('');
  lines.push('Les données complètes au format JSON sont disponibles en pièce jointe.');
  lines.push('');
  lines.push('Conformément au RGPD, vous avez le droit de:');
  lines.push('- Demander la rectification de vos données');
  lines.push('- Demander la suppression de vos données');
  lines.push('- Vous opposer au traitement de vos données');
  lines.push('- Demander la portabilité de vos données');

  return lines.join('\n');
}

/**
 * Calcule la taille approximative de l'export en octets
 * @param userData - Données utilisateur exportées
 * @returns Taille en octets
 */
export function calculateExportSize(userData: UserDataExport): number {
  const jsonString = JSON.stringify(userData);
  return Buffer.byteLength(jsonString, 'utf8');
}

/**
 * Formate une taille en octets en format lisible
 * @param bytes - Taille en octets
 * @returns String formaté (ex: "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
