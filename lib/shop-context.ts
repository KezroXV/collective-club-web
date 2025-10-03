import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// ✅ Fonction pour créer les 3 rôles par défaut lors de la création d'un shop
export async function createDefaultRolesForShop(shopId: string) {
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
      shopId: shopId,
      name: role.name,
      displayName: role.displayName,
      color: role.color,
      permissions: role.permissions,
      isDefault: role.isDefault,
    })),
    skipDuplicates: true, // Évite les erreurs si les rôles existent déjà
  });
}

export async function getCurrentShopId(): Promise<string | null> {
  try {
    // Option 1: Depuis le cookie shopDomain (défini par middleware)
    const cookieStore = await cookies();
    const shopDomain = cookieStore.get("shopDomain")?.value;

    if (shopDomain) {
      let shop = await prisma.shop.findUnique({
        where: { shopDomain },
        select: { id: true },
      });

      // Si le shop n'existe pas, le créer automatiquement
      if (!shop) {
        shop = await prisma.shop.create({
          data: {
            shopDomain: shopDomain,
            shopName: shopDomain.replace(".myshopify.com", ""),
            ownerId: "pending", // À mettre à jour lors du premier admin
          },
          select: { id: true },
        });

        // ✅ Créer immédiatement les 3 rôles par défaut
        await createDefaultRolesForShop(shop.id);
      }

      return shop?.id || null;
    }

    // Option 2: Depuis les headers de la requête (fallback)
    const headersList = await headers();
    const referer = headersList.get("referer") || "";
    const host = headersList.get("host") || "";

    // Extraire shopId depuis l'URL ou query params
    // Exemple: ?shop=boutique-cosmetic.myshopify.com
    const shopMatch = referer.match(/[?&]shop=([^&]+)/);
    if (shopMatch) {
      const shopDomainFromUrl = shopMatch[1];

      let shop = await prisma.shop.findUnique({
        where: { shopDomain: shopDomainFromUrl },
        select: { id: true },
      });

      // Si le shop n'existe pas, le créer automatiquement
      if (!shop) {
        shop = await prisma.shop.create({
          data: {
            shopDomain: shopDomainFromUrl,
            shopName: shopDomainFromUrl.replace(".myshopify.com", ""),
            ownerId: "pending", // À mettre à jour lors du premier admin
          },
          select: { id: true },
        });

        // ✅ Créer immédiatement les 3 rôles par défaut
        await createDefaultRolesForShop(shop.id);
      }

      return shop?.id || null;
    }

    // Option 2: Fallback sur host pour développement
    // TODO: Adapter selon votre logique de boutique
    if (host.includes("localhost")) {
      // En développement, utiliser une boutique par défaut
      const defaultShop = await prisma.shop.findFirst({
        select: { id: true },
      });
      return defaultShop?.id || null;
    }

    return null;
  } catch (error) {
    console.error("Error getting shopId:", error);
    return null;
  }
}

export async function getShopContext(shopId: string) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      id: true,
      shopDomain: true,
      shopName: true,
      settings: true,
    },
  });

  return shop;
}
