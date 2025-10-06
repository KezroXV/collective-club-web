import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Met à jour l'onboarding d'un utilisateur pour une tâche spécifique
 * @param userId - ID de l'utilisateur
 * @param shopId - ID de la boutique
 * @param task - Type de tâche à marquer comme complétée
 */
export async function updateOnboardingTask(
  userId: string,
  shopId: string,
  task: "hasLikedPost" | "hasCommentedPost" | "hasCreatedPost"
) {
  try {
    // Vérifier si l'onboarding existe
    let onboarding = await prisma.userOnboarding.findUnique({
      where: {
        userId_shopId: {
          userId,
          shopId,
        },
      },
    });

    // Si pas d'onboarding existant, en créer un
    if (!onboarding) {
      onboarding = await prisma.userOnboarding.create({
        data: {
          userId,
          shopId,
          [task]: true,
        },
      });
    } else {
      // Mettre à jour la tâche seulement si elle n'est pas déjà complétée
      if (!onboarding[task]) {
        onboarding = await prisma.userOnboarding.update({
          where: {
            userId_shopId: {
              userId,
              shopId,
            },
          },
          data: {
            [task]: true,
          },
        });
      }
    }

    // Vérifier si toutes les tâches sont complétées
    const allCompleted =
      onboarding.hasLikedPost &&
      onboarding.hasCommentedPost &&
      onboarding.hasCreatedPost;

    // Si toutes les tâches sont complétées et que completedAt n'est pas défini, le définir
    if (allCompleted && !onboarding.completedAt) {
      await prisma.userOnboarding.update({
        where: {
          userId_shopId: {
            userId,
            shopId,
          },
        },
        data: {
          completedAt: new Date(),
        },
      });
    }

    return onboarding;
  } catch (error) {
    console.error("Error updating onboarding task:", error);
    // Ne pas faire échouer l'action principale si l'onboarding échoue
    return null;
  }
}
