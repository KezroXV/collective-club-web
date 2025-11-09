import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/hybridAuth";
import { PrismaClient } from "@prisma/client";
import { getShopContext } from "@/lib/shopIsolation";

const prisma = new PrismaClient();

// GET - Récupérer l'état d'onboarding d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { shopId } = await getShopContext(request);
    const userId = auth.userId;

    // Récupérer ou créer l'onboarding
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
          hasLikedPost: false,
          hasCommentedPost: false,
          hasCreatedPost: false,
        },
      });
    }

    return NextResponse.json(onboarding);
  } catch (error) {
    console.error("Error fetching onboarding:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'onboarding" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour l'état d'onboarding
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { shopId } = await getShopContext(request);
    const userId = auth.userId;
    const body = await request.json();

    const { hasLikedPost, hasCommentedPost, hasCreatedPost } = body;

    // Récupérer l'onboarding actuel
    let onboarding = await prisma.userOnboarding.findUnique({
      where: {
        userId_shopId: {
          userId,
          shopId,
        },
      },
    });

    // Si pas d'onboarding, le créer
    if (!onboarding) {
      onboarding = await prisma.userOnboarding.create({
        data: {
          userId,
          shopId,
          hasLikedPost: hasLikedPost || false,
          hasCommentedPost: hasCommentedPost || false,
          hasCreatedPost: hasCreatedPost || false,
        },
      });
    } else {
      // Mettre à jour
      onboarding = await prisma.userOnboarding.update({
        where: {
          userId_shopId: {
            userId,
            shopId,
          },
        },
        data: {
          hasLikedPost:
            hasLikedPost !== undefined ? hasLikedPost : onboarding.hasLikedPost,
          hasCommentedPost:
            hasCommentedPost !== undefined
              ? hasCommentedPost
              : onboarding.hasCommentedPost,
          hasCreatedPost:
            hasCreatedPost !== undefined
              ? hasCreatedPost
              : onboarding.hasCreatedPost,
        },
      });
    }

    // Vérifier si toutes les tâches sont complétées
    const allCompleted =
      onboarding.hasLikedPost &&
      onboarding.hasCommentedPost &&
      onboarding.hasCreatedPost;

    // Si toutes les tâches sont complétées et que completedAt n'est pas défini, le définir
    if (allCompleted && !onboarding.completedAt) {
      onboarding = await prisma.userOnboarding.update({
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

    return NextResponse.json(onboarding);
  } catch (error) {
    console.error("Error updating onboarding:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'onboarding" },
      { status: 500 }
    );
  }
}
