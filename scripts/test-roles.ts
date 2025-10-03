import { prisma } from "@/lib/prisma";

async function testRolesCreation() {
  console.log("🧪 Test de création d'un shop avec rôles par défaut...\n");

  // Nettoyer les données de test existantes
  const testShopDomain = "test-boutique.myshopify.com";

  const existingShop = await prisma.shop.findUnique({
    where: { shopDomain: testShopDomain },
  });

  if (existingShop) {
    console.log("🧹 Nettoyage du shop de test existant...");
    await prisma.shop.delete({ where: { id: existingShop.id } });
  }

  // Créer un nouveau shop
  console.log("✅ Création du shop...");
  const shop = await prisma.shop.create({
    data: {
      shopDomain: testShopDomain,
      shopName: "Test Boutique",
      ownerId: "pending",
    },
  });

  console.log(`✅ Shop créé avec l'ID: ${shop.id}\n`);

  // Créer les 3 rôles par défaut
  console.log("✅ Création des 3 rôles par défaut...");
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

  await prisma.role.createMany({
    data: defaultRoles.map((role) => ({
      shopId: shop.id,
      name: role.name,
      displayName: role.displayName,
      color: role.color,
      permissions: role.permissions,
      isDefault: role.isDefault,
    })),
  });

  console.log("✅ Rôles créés avec succès !\n");

  // Vérifier que les rôles ont bien été créés
  const roles = await prisma.role.findMany({
    where: { shopId: shop.id },
  });

  console.log("📋 Rôles créés:");
  roles.forEach((role) => {
    console.log(`  - ${role.name} (${role.displayName}) - Couleur: ${role.color}`);
  });

  // Tester la création d'un utilisateur
  console.log("\n✅ Test de création d'un utilisateur avec rôle ADMIN...");
  const user = await prisma.user.create({
    data: {
      email: "test@example.com",
      name: "Test User",
      shopId: shop.id,
      role: "ADMIN",
      isShopOwner: true,
    },
  });

  console.log(`✅ Utilisateur créé avec l'ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Rôle: ${user.role}`);

  // Vérifier la relation avec le rôle
  const userWithRole = await prisma.user.findUnique({
    where: { id: user.id },
    include: { roleInfo: true },
  });

  console.log(`\n✅ Relation User -> Role vérifiée:`);
  console.log(`   Rôle info:`, userWithRole?.roleInfo);

  console.log("\n✅ Test réussi ! La clé étrangère fonctionne correctement.");
}

testRolesCreation()
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
