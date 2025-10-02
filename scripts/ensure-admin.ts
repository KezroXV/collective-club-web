import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fonction utilitaire pour anonymiser les emails dans les logs
function anonymizeEmail(email: string): string {
  if (!email || email.length < 3) return "***@***.***";

  const [localPart, domain] = email.split("@");
  if (!domain) return "***@***.***";

  const anonymizedLocal =
    localPart.length <= 2
      ? "**"
      : localPart[0] + "***" + localPart[localPart.length - 1];

  const domainParts = domain.split(".");
  const anonymizedDomain =
    domainParts.length >= 2
      ? "***." + domainParts[domainParts.length - 1]
      : "***";

  return `${anonymizedLocal}@${anonymizedDomain}`;
}

interface AdminCheckResult {
  shopId: string;
  shopName: string;
  shopDomain: string;
  hasAdmin: boolean;
  adminCount: number;
  adminUsers: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
  }>;
  actions: string[];
}

/**
 * SCRIPT D'ASSURANCE ADMIN
 *
 * Vérifie que chaque boutique a au moins un administrateur
 * et fournit des outils de récupération d'urgence.
 */

/**
 * Analyse l'état des administrateurs pour toutes les boutiques
 */
async function analyzeAdminStatus(): Promise<AdminCheckResult[]> {
  console.log("🔍 ANALYSE DES ADMINISTRATEURS");
  console.log("=".repeat(50));

  const shops = await prisma.shop.findMany({
    include: {
      users: {
        where: {
          role: { in: ["ADMIN", "MODERATOR"] },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  const results: AdminCheckResult[] = [];

  for (const shop of shops) {
    const adminUsers = shop.users.filter((u) => u.role === "ADMIN");
    const hasAdmin = adminUsers.length > 0;
    const adminCount = adminUsers.length;
    const actions: string[] = [];

    if (!hasAdmin) {
      const moderators = shop.users.filter((u) => u.role === "MODERATOR");
      if (moderators.length > 0) {
        actions.push(
          `PROMOTE_MODERATOR: ${anonymizeEmail(moderators[0].email)}`
        );
      } else {
        actions.push("CREATE_EMERGENCY_ADMIN");
      }
    }

    if (adminCount === 1) {
      actions.push("CONSIDER_BACKUP_ADMIN");
    }

    results.push({
      shopId: shop.id,
      shopName: shop.shopName,
      shopDomain: shop.shopDomain,
      hasAdmin,
      adminCount,
      adminUsers: shop.users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name || "",
        role: user.role,
        createdAt: user.createdAt,
      })),
      actions,
    });

    // Affichage du statut
    const status = hasAdmin ? "✅" : "❌";
    const adminInfo = hasAdmin ? `${adminCount} admin(s)` : "AUCUN ADMIN";

    console.log(`${status} ${shop.shopName}: ${adminInfo}`);

    if (!hasAdmin) {
      console.log(`   🚨 CRITIQUE: Boutique sans administrateur!`);
      actions.forEach((action) => {
        console.log(`   📋 Action suggérée: ${action}`);
      });
    }

    if (shop.users.length > 0) {
      console.log(`   👥 Utilisateurs avec privilèges:`);
      shop.users.forEach((user) => {
        const roleIcon = user.role === "ADMIN" ? "👑" : "🛡️";
        console.log(
          `     ${roleIcon} ${anonymizeEmail(user.email)} (${user.role})`
        );
      });
    }

    console.log("");
  }

  return results;
}

/**
 * Crée un administrateur d'urgence pour une boutique
 */
async function createEmergencyAdmin(
  shopId: string,
  email?: string,
  name?: string
): Promise<{ success: boolean; admin?: any; error?: string }> {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        shopDomain: true,
        shopName: true,
        users: { where: { role: "ADMIN" }, select: { id: true } },
      },
    });

    if (!shop) {
      return { success: false, error: `Shop not found: ${shopId}` };
    }

    if (shop.users.length > 0) {
      return {
        success: false,
        error: `Shop already has ${shop.users.length} admin(s)`,
      };
    }

    const adminEmail = email || `emergency-admin@${shop.shopDomain}`;
    const adminName = name || `Admin d'urgence - ${shop.shopName}`;

    // Vérifier qu'un utilisateur avec cet email n'existe pas déjà
    const existingUser = await prisma.user.findFirst({
      where: {
        email: adminEmail,
        shopId: shopId,
      },
    });

    if (existingUser) {
      // Promouvoir l'utilisateur existant
      const promotedAdmin = await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: "ADMIN" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      return { success: true, admin: promotedAdmin };
    }

    // Créer un nouvel administrateur
    const newAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        role: "ADMIN",
        shopId: shopId,
        shopDomain: shop.shopDomain,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return { success: true, admin: newAdmin };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create emergency admin: ${error}`,
    };
  }
}

/**
 * Promeut un utilisateur au rang d'administrateur
 */
async function promoteToAdmin(
  userId: string,
  requesterId?: string
): Promise<{ success: boolean; admin?: any; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { shop: true },
    });

    if (!user) {
      return { success: false, error: `User not found: ${userId}` };
    }

    if (user.role === "ADMIN") {
      return { success: false, error: `User is already an admin` };
    }

    // Vérifier les permissions du demandeur si spécifié
    if (requesterId) {
      const requester = await prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true, shopId: true },
      });

      if (
        !requester ||
        requester.role !== "ADMIN" ||
        requester.shopId !== user.shopId
      ) {
        return {
          success: false,
          error: `Requester lacks admin privileges in this shop`,
        };
      }
    }

    const promotedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        shop: {
          select: {
            shopName: true,
            shopDomain: true,
          },
        },
      },
    });

    return { success: true, admin: promotedUser };
  } catch (error) {
    return {
      success: false,
      error: `Failed to promote user: ${error}`,
    };
  }
}

/**
 * Rétrograder un administrateur (avec protection)
 */
async function demoteAdmin(
  userId: string,
  requesterId: string,
  newRole: "MODERATOR" | "MEMBER" = "MODERATOR"
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const [user, requester] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { shop: true },
      }),
      prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true, shopId: true },
      }),
    ]);

    if (!user || !requester) {
      return { success: false, error: "User or requester not found" };
    }

    if (requester.role !== "ADMIN" || requester.shopId !== user.shopId) {
      return { success: false, error: "Insufficient privileges" };
    }

    if (user.role !== "ADMIN") {
      return { success: false, error: "User is not an admin" };
    }

    // Vérifier qu'il restera au moins un admin
    const adminCount = await prisma.user.count({
      where: {
        shopId: user.shopId,
        role: "ADMIN",
      },
    });

    if (adminCount <= 1) {
      return {
        success: false,
        error: "Cannot demote the last admin. Create another admin first.",
      };
    }

    const demotedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        shop: {
          select: {
            shopName: true,
            shopDomain: true,
          },
        },
      },
    });

    return { success: true, user: demotedUser };
  } catch (error) {
    return {
      success: false,
      error: `Failed to demote admin: ${error}`,
    };
  }
}

/**
 * Répare automatiquement les boutiques sans administrateur
 */
async function autoRepairOrphanedShops(): Promise<void> {
  console.log("\n🔧 RÉPARATION AUTOMATIQUE");
  console.log("=".repeat(30));

  const results = await analyzeAdminStatus();
  const orphanedShops = results.filter((r) => !r.hasAdmin);

  if (orphanedShops.length === 0) {
    console.log("✅ Aucune boutique orpheline détectée");
    return;
  }

  console.log(
    `🚨 ${orphanedShops.length} boutique(s) sans administrateur détectée(s)`
  );

  for (const shop of orphanedShops) {
    console.log(`\n🔧 Réparation de ${shop.shopName}...`);

    // Essayer de promouvoir un modérateur
    const moderator = shop.adminUsers.find((u) => u.role === "MODERATOR");
    if (moderator) {
      const result = await promoteToAdmin(moderator.id);
      if (result.success) {
        console.log(
          `✅ Modérateur ${anonymizeEmail(
            moderator.email
          )} promu administrateur`
        );
        continue;
      }
    }

    // Créer un admin d'urgence
    const result = await createEmergencyAdmin(shop.shopId);
    if (result.success) {
      console.log(
        `✅ Administrateur d'urgence créé: ${anonymizeEmail(
          result.admin?.email || ""
        )}`
      );
    } else {
      console.log(
        `❌ Échec de la création d'admin pour ${shop.shopName}: ${result.error}`
      );
    }
  }
}

/**
 * Génère un rapport détaillé pour audit
 */
async function generateAdminAuditReport(): Promise<string> {
  const results = await analyzeAdminStatus();
  const timestamp = new Date().toISOString();

  let report = `# RAPPORT D'AUDIT DES ADMINISTRATEURS
Date: ${timestamp}

## Résumé
- Boutiques totales: ${results.length}
- Boutiques avec admin: ${results.filter((r) => r.hasAdmin).length}
- Boutiques orphelines: ${results.filter((r) => !r.hasAdmin).length}
- Administrateurs totaux: ${results.reduce((sum, r) => sum + r.adminCount, 0)}

## Détails par boutique

`;

  for (const shop of results) {
    report += `### ${shop.shopName} (${shop.shopDomain})
- Shop ID: ${shop.shopId}
- Statut: ${shop.hasAdmin ? "✅ ADMIN PRÉSENT" : "❌ AUCUN ADMIN"}
- Nombre d'admins: ${shop.adminCount}
`;

    if (shop.adminUsers.length > 0) {
      report += `- Utilisateurs privilégiés:\n`;
      for (const user of shop.adminUsers) {
        report += `  - ${user.email} (${
          user.role
        }) - Créé le ${user.createdAt.toLocaleDateString()}\n`;
      }
    }

    if (shop.actions.length > 0) {
      report += `- Actions recommandées:\n`;
      for (const action of shop.actions) {
        report += `  - ${action}\n`;
      }
    }

    report += "\n";
  }

  return report;
}

// Interface en ligne de commande
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case "analyze":
        await analyzeAdminStatus();
        break;

      case "create-admin":
        const shopId = args[1];
        const email = args[2];
        const name = args[3];

        if (!shopId) {
          console.log(
            "Usage: npm run ensure-admin create-admin <shopId> [email] [name]"
          );
          process.exit(1);
        }

        const result = await createEmergencyAdmin(shopId, email, name);
        if (result.success) {
          console.log(`✅ Admin créé:`, {
            ...result.admin,
            email: anonymizeEmail(result.admin?.email || ""),
          });
        } else {
          console.log(`❌ Erreur:`, result.error);
          process.exit(1);
        }
        break;

      case "promote":
        const userId = args[1];
        const requesterId = args[2];

        if (!userId) {
          console.log(
            "Usage: npm run ensure-admin promote <userId> [requesterId]"
          );
          process.exit(1);
        }

        const promoteResult = await promoteToAdmin(userId, requesterId);
        if (promoteResult.success) {
          console.log(`✅ Utilisateur promu:`, promoteResult.admin);
        } else {
          console.log(`❌ Erreur:`, promoteResult.error);
          process.exit(1);
        }
        break;

      case "auto-repair":
        await autoRepairOrphanedShops();
        break;

      case "audit":
        const report = await generateAdminAuditReport();
        console.log(report);

        // Sauvegarder le rapport
        const fs = await import("fs");
        const filename = `admin-audit-${Date.now()}.md`;
        fs.writeFileSync(filename, report);
        console.log(`\n📄 Rapport sauvegardé: ${filename}`);
        break;

      default:
        console.log(`
🛡️ GESTIONNAIRE D'ADMINISTRATEURS

Usage: npm run ensure-admin <command> [options]

Commandes disponibles:
  analyze              - Analyser le statut des admins
  create-admin <id>    - Créer un admin d'urgence pour une boutique  
  promote <userId>     - Promouvoir un utilisateur admin
  auto-repair          - Réparer automatiquement les boutiques orphelines
  audit               - Générer un rapport d'audit complet

Exemples:
  npm run ensure-admin analyze
  npm run ensure-admin create-admin cm123456 admin@shop.com "Admin Name"
  npm run ensure-admin promote user123 requester456
  npm run ensure-admin auto-repair
  npm run ensure-admin audit
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
  analyzeAdminStatus,
  createEmergencyAdmin,
  promoteToAdmin,
  demoteAdmin,
  autoRepairOrphanedShops,
  generateAdminAuditReport,
  type AdminCheckResult,
};

// Exécuter si appelé directement
if (require.main === module) {
  main();
}
