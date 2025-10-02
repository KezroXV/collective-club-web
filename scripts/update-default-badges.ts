import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateDefaultBadges() {
  try {
    console.log("🔄 Mise à jour des badges par défaut...");
    
    // Mettre à jour tous les badges qui ont isDefault: true pour les rendre modifiables
    const result = await prisma.badge.updateMany({
      where: {
        isDefault: true,
        name: {
          in: ["Nouveau", "Novice", "Intermédiaire", "Expert"]
        }
      },
      data: {
        isDefault: false
      }
    });

    console.log(`✅ ${result.count} badges mis à jour avec succès`);
    console.log("Les badges par défaut sont maintenant modifiables !");
    
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDefaultBadges();