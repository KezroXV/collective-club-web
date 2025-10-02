import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import { performance } from "perf_hooks";

const prisma = new PrismaClient();

interface RecoveryReport {
  timestamp: Date;
  operation: string;
  shopId?: string;
  success: boolean;
  itemsProcessed: number;
  itemsRecovered: number;
  errors: string[];
  duration: number;
}

interface OrphanData {
  posts: number;
  comments: number;
  reactions: number;
  categories: number;
  badges: number;
  polls: number;
}

interface BackupData {
  shop: any;
  users: any[];
  posts: any[];
  comments: any[];
  reactions: any[];
  categories: any[];
  badges: any[];
  polls: any[];
  metadata: {
    version: string;
    timestamp: Date;
    totalRecords: number;
  };
}

/**
 * SYSTÈME DE RÉCUPÉRATION ET SAUVEGARDE DE DONNÉES
 *
 * Gère la sauvegarde, restauration et nettoyage des données
 * avec isolation multi-tenant.
 */

/**
 * Sauvegarde complète d'une boutique
 */
async function backupShop(shopId: string): Promise<RecoveryReport> {
  const start = performance.now();
  const report: RecoveryReport = {
    timestamp: new Date(),
    operation: "BACKUP_SHOP",
    shopId,
    success: false,
    itemsProcessed: 0,
    itemsRecovered: 0,
    errors: [],
    duration: 0,
  };

  try {
    console.log(`💾 Sauvegarde de la boutique ${shopId}...`);

    // Récupérer toutes les données de la boutique
    const [shop, users, posts, comments, reactions, categories, badges, polls] =
      await Promise.all([
        prisma.shop.findUnique({
          where: { id: shopId },
        }),
        prisma.user.findMany({
          where: { shopId },
          include: {
            posts: { select: { id: true } },
            comments: { select: { id: true } },
            reactions: { select: { id: true } },
          },
        }),
        prisma.post.findMany({
          where: { shopId },
          include: {
            author: true,
            comments: {
              include: { author: true },
            },
            reactions: {
              include: { user: true },
            },
            category: true,
            poll: {
              include: {
                options: {
                  include: {
                    votes: { include: { user: true } },
                  },
                },
              },
            },
          },
        }),
        prisma.comment.findMany({
          where: { shopId },
          include: {
            author: true,
            post: true,
          },
        }),
        prisma.reaction.findMany({
          where: { shopId },
          include: {
            user: true,
            post: true,
            comment: true,
          },
        }),
        prisma.category.findMany({
          where: { shopId },
          include: {
            posts: { select: { id: true } },
          },
        }),
        prisma.badge.findMany({
          where: { shopId },
        }),
        prisma.poll.findMany({
          where: { shopId },
          include: {
            options: {
              include: {
                votes: { include: { user: true } },
              },
            },
          },
        }),
      ]);

    if (!shop) {
      report.errors.push(`Shop not found: ${shopId}`);
      report.duration = performance.now() - start;
      return report;
    }

    const backupData: BackupData = {
      shop,
      users,
      posts,
      comments,
      reactions,
      categories,
      badges,
      polls,
      metadata: {
        version: "1.0",
        timestamp: new Date(),
        totalRecords:
          users.length +
          posts.length +
          comments.length +
          reactions.length +
          categories.length +
          badges.length +
          polls.length,
      },
    };

    report.itemsProcessed = backupData.metadata.totalRecords;

    // Sauvegarder dans un fichier JSON
    const filename = `backup_${shop.shopDomain.replace(
      /[^a-z0-9]/gi,
      "_"
    )}_${Date.now()}.json`;
    const backupPath = `./backups/${filename}`;

    // Créer le dossier backups s'il n'existe pas
    try {
      await fs.mkdir("./backups", { recursive: true });
    } catch (error) {
      // Ignorer l'erreur si le dossier existe déjà
    }

    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

    report.success = true;
    report.itemsRecovered = backupData.metadata.totalRecords;

    console.log(`✅ Sauvegarde terminée: ${filename}`);
    console.log(`   📊 ${report.itemsRecovered} enregistrements sauvegardés`);
  } catch (error) {
    report.errors.push(`Backup failed: ${error}`);
    console.error(`❌ Erreur de sauvegarde:`, error);
  }

  report.duration = performance.now() - start;
  return report;
}

/**
 * Restauration d'une boutique depuis une sauvegarde
 */
async function restoreShop(
  backupPath: string,
  newShopId?: string
): Promise<RecoveryReport> {
  const start = performance.now();
  const report: RecoveryReport = {
    timestamp: new Date(),
    operation: "RESTORE_SHOP",
    success: false,
    itemsProcessed: 0,
    itemsRecovered: 0,
    errors: [],
    duration: 0,
  };

  try {
    console.log(`🔄 Restauration depuis ${backupPath}...`);

    // Lire le fichier de sauvegarde
    const backupContent = await fs.readFile(backupPath, "utf-8");
    const backupData: BackupData = JSON.parse(backupContent);

    report.itemsProcessed = backupData.metadata.totalRecords;
    const targetShopId = newShopId || backupData.shop.id;

    // Vérifier si la boutique de destination existe
    const existingShop = await prisma.shop.findUnique({
      where: { id: targetShopId },
    });

    if (existingShop && !newShopId) {
      report.errors.push(
        `Shop ${targetShopId} already exists. Use newShopId parameter to restore to a different shop.`
      );
      report.duration = performance.now() - start;
      return report;
    }

    let targetShop;
    if (!existingShop) {
      // Créer la boutique de destination
      targetShop = await prisma.shop.create({
        data: {
          id: targetShopId,
          shopDomain: backupData.shop.shopDomain,
          shopName: backupData.shop.shopName,
          ownerId: backupData.shop.ownerId,
          settings: backupData.shop.settings,
        },
      });
    } else {
      targetShop = existingShop;
    }

    report.shopId = targetShop.id;

    // Restaurer les données dans l'ordre des dépendances
    let recovered = 0;

    // 1. Utilisateurs
    for (const user of backupData.users) {
      try {
        await prisma.user.upsert({
          where: {
            shopId_email: {
              shopId: targetShop.id,
              email: user.email,
            },
          },
          update: {
            name: user.name,
            role: user.role,
            image: user.image,
          },
          create: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            shopId: targetShop.id,
            isShopOwner: user.isShopOwner || false,
          },
        });
        recovered++;
      } catch (error) {
        report.errors.push(`Failed to restore user ${user.email}: ${error}`);
      }
    }

    // 2. Catégories
    for (const category of backupData.categories) {
      try {
        await prisma.category.upsert({
          where: {
            shopId_name: {
              shopId: targetShop.id,
              name: category.name,
            },
          },
          update: {
            color: category.color,
            description: category.description,
            order: category.order,
            isActive: category.isActive,
          },
          create: {
            id: category.id,
            name: category.name,
            color: category.color,
            description: category.description,
            order: category.order,
            isActive: category.isActive,
            shopId: targetShop.id,
          },
        });
        recovered++;
      } catch (error) {
        report.errors.push(
          `Failed to restore category ${category.name}: ${error}`
        );
      }
    }

    // 3. Posts
    const postIdMapping: Record<string, string> = {};
    for (const post of backupData.posts) {
      try {
        // Récupérer l'auteur dans la boutique de destination
        const author = await prisma.user.findFirst({
          where: {
            shopId: targetShop.id,
            email: post.author.email,
          },
        });

        const category = post.category
          ? await prisma.category.findFirst({
              where: {
                shopId: targetShop.id,
                name: post.category.name,
              },
            })
          : null;

        if (!author) {
          report.errors.push(`Author not found for post ${post.title}`);
          continue;
        }

        const restoredPost = await prisma.post.create({
          data: {
            title: post.title,
            content: post.content,
            slug: post.slug,
            imageUrl: post.imageUrl,
            status: post.status,
            authorId: author.id,
            categoryId: category?.id,
            shopId: targetShop.id,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
          },
        });

        postIdMapping[post.id] = restoredPost.id;
        recovered++;
      } catch (error) {
        report.errors.push(`Failed to restore post ${post.title}: ${error}`);
      }
    }

    // 4. Commentaires
    for (const comment of backupData.comments) {
      try {
        const author = await prisma.user.findFirst({
          where: {
            shopId: targetShop.id,
            email: comment.author.email,
          },
        });

        const postId = postIdMapping[comment.postId];

        if (!author || !postId) {
          report.errors.push(`Cannot restore comment: missing author or post`);
          continue;
        }

        await prisma.comment.create({
          data: {
            content: comment.content,
            authorId: author.id,
            postId: postId,
            shopId: targetShop.id,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
          },
        });
        recovered++;
      } catch (error) {
        report.errors.push(`Failed to restore comment: ${error}`);
      }
    }

    // 5. Réactions
    for (const reaction of backupData.reactions) {
      try {
        const user = await prisma.user.findFirst({
          where: {
            shopId: targetShop.id,
            email: reaction.user.email,
          },
        });

        const postId = reaction.postId ? postIdMapping[reaction.postId] : null;

        if (!user) {
          continue;
        }

        await prisma.reaction.create({
          data: {
            type: reaction.type,
            userId: user.id,
            postId: postId,
            commentId: reaction.commentId,
            shopId: targetShop.id,
            createdAt: reaction.createdAt,
          },
        });
        recovered++;
      } catch (error) {
        // Ignorer les erreurs de contrainte unique
      }
    }

    // 6. Badges
    for (const badge of backupData.badges) {
      try {
        await prisma.badge.upsert({
          where: {
            shopId_name: {
              shopId: targetShop.id,
              name: badge.name,
            },
          },
          update: {
            imageUrl: badge.imageUrl,
            requiredPoints: badge.requiredPoints,
            description: badge.description,
          },
          create: {
            name: badge.name,
            imageUrl: badge.imageUrl,
            requiredPoints: badge.requiredPoints,
            description: badge.description,
            isDefault: badge.isDefault,
            order: badge.order,
            shopId: targetShop.id,
          },
        });
        recovered++;
      } catch (error) {
        report.errors.push(`Failed to restore badge ${badge.name}: ${error}`);
      }
    }

    report.success = true;
    report.itemsRecovered = recovered;

    console.log(`✅ Restauration terminée`);
    console.log(
      `   📊 ${recovered}/${report.itemsProcessed} enregistrements restaurés`
    );

    if (report.errors.length > 0) {
      console.log(
        `   ⚠️ ${report.errors.length} erreurs lors de la restauration`
      );
    }
  } catch (error) {
    report.errors.push(`Restore failed: ${error}`);
    console.error(`❌ Erreur de restauration:`, error);
  }

  report.duration = performance.now() - start;
  return report;
}

/**
 * Détecte et nettoie les données orphelines
 */
async function cleanOrphanedData(): Promise<RecoveryReport> {
  const start = performance.now();
  const report: RecoveryReport = {
    timestamp: new Date(),
    operation: "CLEAN_ORPHANED_DATA",
    success: false,
    itemsProcessed: 0,
    itemsRecovered: 0,
    errors: [],
    duration: 0,
  };

  try {
    console.log(`🧹 Nettoyage des données orphelines...`);

    // 1. Trouver les posts sans shopId ou avec shopId invalide
    const orphanedPosts = await prisma.$queryRaw<any[]>`
      SELECT p.* FROM posts p
      LEFT JOIN shops s ON p."shopId" = s.id
      WHERE p."shopId" IS NULL OR s.id IS NULL
    `;

    // 2. Trouver les commentaires sans shopId
    const orphanedComments = await prisma.$queryRaw<any[]>`
      SELECT c.* FROM comments c
      LEFT JOIN shops s ON c."shopId" = s.id
      WHERE c."shopId" IS NULL OR s.id IS NULL
    `;

    // 3. Trouver les réactions sans shopId
    const orphanedReactions = await prisma.$queryRaw<any[]>`
      SELECT r.* FROM reactions r
      LEFT JOIN shops s ON r."shopId" = s.id
      WHERE r."shopId" IS NULL OR s.id IS NULL
    `;

    // 4. Trouver les catégories orphelines
    const orphanedCategories = await prisma.$queryRaw<any[]>`
      SELECT c.* FROM categories c
      LEFT JOIN shops s ON c."shopId" = s.id
      WHERE c."shopId" IS NULL OR s.id IS NULL
    `;

    // 5. Trouver les badges orphelins
    const orphanedBadges = await prisma.$queryRaw<any[]>`
      SELECT b.* FROM badges b
      LEFT JOIN shops s ON b."shopId" = s.id
      WHERE b."shopId" IS NULL OR s.id IS NULL
    `;

    const orphanData: OrphanData = {
      posts: orphanedPosts.length,
      comments: orphanedComments.length,
      reactions: orphanedReactions.length,
      categories: orphanedCategories.length,
      badges: orphanedBadges.length,
      polls: 0,
    };

    report.itemsProcessed = Object.values(orphanData).reduce(
      (sum, count) => sum + count,
      0
    );

    console.log(`📊 Données orphelines détectées:`);
    console.log(`   Posts: ${orphanData.posts}`);
    console.log(`   Commentaires: ${orphanData.comments}`);
    console.log(`   Réactions: ${orphanData.reactions}`);
    console.log(`   Catégories: ${orphanData.categories}`);
    console.log(`   Badges: ${orphanData.badges}`);

    if (report.itemsProcessed === 0) {
      console.log(`✅ Aucune donnée orpheline trouvée`);
      report.success = true;
      report.duration = performance.now() - start;
      return report;
    }

    // Créer le dossier backups s'il n'existe pas
    try {
      await fs.mkdir("./backups", { recursive: true });
    } catch (error) {
      // Ignorer
    }

    // Sauvegarder les données orphelines avant suppression
    const backupPath = `./backups/orphaned_data_${Date.now()}.json`;
    await fs.writeFile(
      backupPath,
      JSON.stringify(
        {
          posts: orphanedPosts,
          comments: orphanedComments,
          reactions: orphanedReactions,
          categories: orphanedCategories,
          badges: orphanedBadges,
          metadata: {
            timestamp: new Date(),
            totalOrphans: report.itemsProcessed,
          },
        },
        null,
        2
      )
    );

    console.log(`💾 Sauvegarde des données orphelines: ${backupPath}`);

    // Supprimer les données orphelines (dans l'ordre des dépendances)
    let cleaned = 0;

    // Réactions orphelines
    if (orphanedReactions.length > 0) {
      const result = await prisma.reaction.deleteMany({
        where: {
          id: { in: orphanedReactions.map((r) => r.id) },
        },
      });
      cleaned += result.count;
    }

    // Commentaires orphelins
    if (orphanedComments.length > 0) {
      const result = await prisma.comment.deleteMany({
        where: {
          id: { in: orphanedComments.map((c) => c.id) },
        },
      });
      cleaned += result.count;
    }

    // Posts orphelins
    if (orphanedPosts.length > 0) {
      const result = await prisma.post.deleteMany({
        where: {
          id: { in: orphanedPosts.map((p) => p.id) },
        },
      });
      cleaned += result.count;
    }

    // Catégories orphelines
    if (orphanedCategories.length > 0) {
      const result = await prisma.category.deleteMany({
        where: {
          id: { in: orphanedCategories.map((c) => c.id) },
        },
      });
      cleaned += result.count;
    }

    // Badges orphelins
    if (orphanedBadges.length > 0) {
      const result = await prisma.badge.deleteMany({
        where: {
          id: { in: orphanedBadges.map((b) => b.id) },
        },
      });
      cleaned += result.count;
    }

    report.success = true;
    report.itemsRecovered = cleaned;

    console.log(`✅ Nettoyage terminé: ${cleaned} enregistrements supprimés`);
  } catch (error) {
    report.errors.push(`Cleanup failed: ${error}`);
    console.error(`❌ Erreur de nettoyage:`, error);
  }

  report.duration = performance.now() - start;
  return report;
}

/**
 * Migration de données entre boutiques
 */
async function migrateBetweenShops(
  sourceShopId: string,
  targetShopId: string,
  dataTypes: ("posts" | "users" | "categories")[] = ["posts", "categories"]
): Promise<RecoveryReport> {
  const start = performance.now();
  const report: RecoveryReport = {
    timestamp: new Date(),
    operation: "MIGRATE_BETWEEN_SHOPS",
    shopId: sourceShopId,
    success: false,
    itemsProcessed: 0,
    itemsRecovered: 0,
    errors: [],
    duration: 0,
  };

  try {
    console.log(`🔄 Migration de ${sourceShopId} vers ${targetShopId}...`);

    const [sourceShop, targetShop] = await Promise.all([
      prisma.shop.findUnique({ where: { id: sourceShopId } }),
      prisma.shop.findUnique({ where: { id: targetShopId } }),
    ]);

    if (!sourceShop || !targetShop) {
      report.errors.push("Source or target shop not found");
      report.duration = performance.now() - start;
      return report;
    }

    let migrated = 0;

    // Migration des catégories
    if (dataTypes.includes("categories")) {
      const categories = await prisma.category.findMany({
        where: { shopId: sourceShopId },
      });

      for (const category of categories) {
        try {
          await prisma.category.upsert({
            where: {
              shopId_name: {
                shopId: targetShopId,
                name: category.name,
              },
            },
            update: {
              color: category.color,
              description: category.description,
            },
            create: {
              name: category.name,
              color: category.color,
              description: category.description,
              order: category.order,
              isActive: category.isActive,
              shopId: targetShopId,
            },
          });
          migrated++;
        } catch (error) {
          report.errors.push(
            `Failed to migrate category ${category.name}: ${error}`
          );
        }
      }
    }

    // Migration des posts (nécessite des utilisateurs dans la boutique cible)
    if (dataTypes.includes("posts")) {
      const posts = await prisma.post.findMany({
        where: { shopId: sourceShopId },
        include: { author: true, category: true },
      });

      for (const post of posts) {
        try {
          // Trouver ou créer l'auteur dans la boutique cible
          let targetAuthor = await prisma.user.findFirst({
            where: {
              shopId: targetShopId,
              email: post.author.email,
            },
          });

          if (!targetAuthor) {
            targetAuthor = await prisma.user.create({
              data: {
                email: post.author.email,
                name: post.author.name,
                role: "MEMBER",
                shopId: targetShopId,
                isShopOwner: false,
              },
            });
          }

          // Trouver la catégorie dans la boutique cible
          const targetCategory = post.category
            ? await prisma.category.findFirst({
                where: {
                  shopId: targetShopId,
                  name: post.category.name,
                },
              })
            : null;

          await prisma.post.create({
            data: {
              title: post.title,
              content: post.content,
              slug: post.slug,
              imageUrl: post.imageUrl,
              status: post.status,
              authorId: targetAuthor.id,
              categoryId: targetCategory?.id,
              shopId: targetShopId,
            },
          });
          migrated++;
        } catch (error) {
          report.errors.push(`Failed to migrate post ${post.title}: ${error}`);
        }
      }
    }

    report.success = true;
    report.itemsProcessed = migrated;
    report.itemsRecovered = migrated;

    console.log(`✅ Migration terminée: ${migrated} éléments migrés`);
  } catch (error) {
    report.errors.push(`Migration failed: ${error}`);
    console.error(`❌ Erreur de migration:`, error);
  }

  report.duration = performance.now() - start;
  return report;
}

// Interface en ligne de commande
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case "backup":
        const shopId = args[1];
        if (!shopId) {
          console.log("Usage: npm run data-recovery backup <shopId>");
          process.exit(1);
        }
        await backupShop(shopId);
        break;

      case "restore":
        const backupPath = args[1];
        const newShopId = args[2];
        if (!backupPath) {
          console.log(
            "Usage: npm run data-recovery restore <backupPath> [newShopId]"
          );
          process.exit(1);
        }
        await restoreShop(backupPath, newShopId);
        break;

      case "clean":
        await cleanOrphanedData();
        break;

      case "migrate":
        const sourceShopId = args[1];
        const targetShopId = args[2];
        const dataTypes = (args[3]?.split(",") as (
          | "posts"
          | "users"
          | "categories"
        )[]) || ["posts", "categories"];

        if (!sourceShopId || !targetShopId) {
          console.log(
            "Usage: npm run data-recovery migrate <sourceShopId> <targetShopId> [posts,categories,users]"
          );
          process.exit(1);
        }

        await migrateBetweenShops(sourceShopId, targetShopId, dataTypes);
        break;

      default:
        console.log(`
🔄 SYSTÈME DE RÉCUPÉRATION DE DONNÉES

Usage: npm run data-recovery <command> [options]

Commandes disponibles:
  backup <shopId>                    - Sauvegarder une boutique
  restore <backupPath> [newShopId]   - Restaurer depuis une sauvegarde
  clean                              - Nettoyer les données orphelines
  migrate <source> <target> [types]  - Migrer des données entre boutiques

Exemples:
  npm run data-recovery backup cm123456
  npm run data-recovery restore ./backups/backup_shop_123.json
  npm run data-recovery clean
  npm run data-recovery migrate shop1 shop2 posts,categories
`);
        break;
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exporter les fonctions pour utilisation programmatique
export {
  backupShop,
  restoreShop,
  cleanOrphanedData,
  migrateBetweenShops,
  type RecoveryReport,
  type OrphanData,
  type BackupData,
};

// Exécuter si appelé directement
if (require.main === module) {
  main();
}
