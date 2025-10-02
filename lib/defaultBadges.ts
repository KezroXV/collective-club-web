import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const DEFAULT_BADGES = [
  {
    name: "Nouveau",
    imageUrl: "/Badge-nouveau.svg",
    requiredPoints: 0,
    description: "Bienvenue dans la communauté !",
    isDefault: false, // Permettre la modification
    order: 1,
  },
  {
    name: "Novice", 
    imageUrl: "/Badge-bronze.svg",
    requiredPoints: 50,
    description: "Vous commencez à participer activement !",
    isDefault: false, // Permettre la modification
    order: 2,
  },
  {
    name: "Intermédiaire",
    imageUrl: "/Badge-argent.svg", 
    requiredPoints: 200,
    description: "Membre actif de la communauté !",
    isDefault: false, // Permettre la modification
    order: 3,
  },
  {
    name: "Expert",
    imageUrl: "/Badge-or.svg",
    requiredPoints: 500,
    description: "Expert reconnu de la communauté !",
    isDefault: false, // Permettre la modification
    order: 4,
  },
];

export async function createDefaultBadgesForShop(shopId: string) {
  const badges = DEFAULT_BADGES.map(badge => ({
    ...badge,
    shopId,
  }));

  for (const badge of badges) {
    try {
      await prisma.badge.upsert({
        where: {
          shopId_name: {
            shopId: badge.shopId,
            name: badge.name,
          },
        },
        update: {},
        create: badge,
      });
    } catch (error) {
      console.error(`❌ Erreur lors de la création du badge "${badge.name}":`, error);
    }
  }
}