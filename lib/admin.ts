import { prisma } from "@/lib/prisma";

export async function checkAndPromoteFirstAdmin(
  userId: string,
  shopId: string
) {
  // Vérifier si aucun admin existe pour cette boutique
  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: "ADMIN",
      // Chercher parmi tous les utilisateurs qui ont été actifs sur cette boutique
      OR: [
        { posts: { some: { shopId } } },
        { comments: { some: { shopId } } },
        { userPoints: { some: { shopId } } },
      ],
    },
  });

  if (!existingAdmin) {
    await prisma.user.update({
      where: { id: userId },
      data: { role: "ADMIN" },
    });

    return true;
  }

  return false;
}

// Helper pour promouvoir manuellement un utilisateur
export async function promoteUserToAdmin(
  targetUserId: string,
  adminUserId: string,
  shopId: string
) {
  // Vérifier que l'utilisateur qui fait la promotion est admin
  const adminUser = await prisma.user.findUnique({
    where: { id: adminUserId },
    select: { role: true },
  });

  if (!adminUser || adminUser.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin privileges required");
  }

  // Promouvoir l'utilisateur cible
  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: "ADMIN" },
  });

  return updatedUser;
}

// Vérifier si c'est le premier utilisateur d'une boutique
export async function isFirstUserForShop(shopId: string): Promise<boolean> {
  const userCount = await prisma.user.count({
    where: {
      OR: [
        { posts: { some: { shopId } } },
        { comments: { some: { shopId } } },
        { userPoints: { some: { shopId } } },
      ],
    },
  });

  return userCount === 0;
}
