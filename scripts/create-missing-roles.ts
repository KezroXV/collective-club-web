import { prisma } from "@/lib/prisma";

async function createMissingRoles() {
  console.log("🔍 Recherche des shops sans rôles par défaut...\n");

  const shops = await prisma.shop.findMany({
    include: {
      roles: true,
    },
  });

  console.log(`📊 ${shops.length} shop(s) trouvé(s)\n`);

  const defaultRoles = [
    {
      name: "ADMIN",
      displayName: "Administrateur",
      color: "#EF4444",
      permissions: ["MANAGE_USERS", "MANAGE_POSTS", "MANAGE_COMMENTS", "DELETE_POSTS", "DELETE_COMMENTS", "BAN_USERS", "MANAGE_CATEGORIES", "MANAGE_BADGES"],
      isDefault: true,
    },
    {
      name: "MODERATOR",
      displayName: "Modérateur",
      color: "#3B82F6",
      permissions: ["MANAGE_POSTS", "MANAGE_COMMENTS", "DELETE_COMMENTS"],
      isDefault: true,
    },
    {
      name: "MEMBER",
      displayName: "Membre",
      color: "#10B981",
      permissions: ["CREATE_POSTS", "CREATE_COMMENTS"],
      isDefault: true,
    },
  ];

  for (const shop of shops) {
    const existingRoleNames = shop.roles.map((r) => r.name);
    const missingRoles = defaultRoles.filter((r) => !existingRoleNames.includes(r.name));

    if (missingRoles.length > 0) {
      console.log(`🔧 Shop "${shop.shopName}" (${shop.shopDomain})`);
      console.log(`   Rôles manquants: ${missingRoles.map((r) => r.name).join(", ")}`);

      await prisma.role.createMany({
        data: missingRoles.map((role) => ({
          shopId: shop.id,
          name: role.name,
          displayName: role.displayName,
          color: role.color,
          permissions: role.permissions,
          isDefault: role.isDefault,
        })),
        skipDuplicates: true,
      });

      console.log(`   ✅ ${missingRoles.length} rôle(s) créé(s)\n`);
    } else {
      console.log(`✅ Shop "${shop.shopName}" a déjà tous les rôles par défaut\n`);
    }
  }

  console.log("✅ Migration terminée !");
}

createMissingRoles()
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
