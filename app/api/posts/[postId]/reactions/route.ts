/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";
import { awardPoints } from "@/lib/points";
import { PointAction } from "@prisma/client";
import { updateOnboardingTask } from "@/lib/onboarding";
import { getAuthContext } from "@/lib/auth-context";

const prisma = new PrismaClient();

// GET /api/posts/[id]/reactions - Récupérer les réactions d'un post (isolées par boutique)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { postId } = await params;

    const reactions = await prisma.reaction.findMany({
      where: {
        postId,
        shopId, // ✅ FILTRER PAR BOUTIQUE
        commentId: null // Seulement les réactions de posts
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Grouper par type de réaction
    const groupedReactions = reactions.reduce((acc: any, reaction) => {
      if (!acc[reaction.type]) {
        acc[reaction.type] = [];
      }
      acc[reaction.type].push(reaction.user);
      return acc;
    }, {});

    return NextResponse.json(groupedReactions);
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch reactions" },
      { status: 500 }
    );
  }
}

// POST /api/posts/[id]/reactions - Ajouter/enlever une réaction (isolée par boutique)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // ✅ SÉCURITÉ: Authentification OBLIGATOIRE via session NextAuth
    const { user, shopId } = await getAuthContext();
    ensureShopIsolation(shopId);

    const { postId } = await params;
    const body = await request.json();
    const { type } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Type is required" },
        { status: 400 }
      );
    }

    // ✅ SÉCURITÉ: Utiliser l'userId de la session authentifiée
    const userId = user.id;

    // Vérifier si l'user a déjà réagi à ce post (dans cette boutique)
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        postId,
        userId,
        shopId, // ✅ VÉRIFIER DANS LA BOUTIQUE
        commentId: null // Seulement les réactions de posts
      },
    });

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Même réaction → enlever
        await prisma.reaction.delete({
          where: { id: existingReaction.id },
        });
        return NextResponse.json({ action: "removed", type });
      } else {
        // Réaction différente → changer
        const updatedReaction = await prisma.reaction.update({
          where: { id: existingReaction.id },
          data: { type },
        });
        return NextResponse.json({
          action: "updated",
          reaction: updatedReaction,
        });
      }
    } else {
      // Nouvelle réaction → créer
      const newReaction = await prisma.reaction.create({
        data: {
          type,
          userId,
          postId,
          commentId: null, // Explicitement null pour les réactions de posts
          shopId, // ✅ ASSOCIER À LA BOUTIQUE
        },
      });

      // 🏆 ATTRIBUER DES POINTS À L'AUTEUR DU POST POUR LA RÉACTION REÇUE
      try {
        // Récupérer l'auteur du post pour lui attribuer des points
        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { authorId: true, shopId: true },
        });

        if (post && post.authorId !== userId) { // Ne pas attribuer de points si on réagit à son propre post
          await awardPoints(post.authorId, post.shopId, PointAction.REACTION_RECEIVED);
        }
      } catch (pointsError) {
        console.error("Error awarding points for reaction received:", pointsError);
        // Ne pas faire échouer la création de la réaction si l'attribution des points échoue
      }

      // 🎯 METTRE À JOUR L'ONBOARDING (première réaction)
      try {
        await updateOnboardingTask(userId, shopId, "hasLikedPost");
      } catch (onboardingError) {
        console.error("Error updating onboarding for first like:", onboardingError);
        // Ne pas faire échouer la création de la réaction si l'onboarding échoue
      }

      return NextResponse.json({ action: "created", reaction: newReaction });
    }
  } catch (error) {
    console.error("Error managing reaction:", error);

    // ✅ SÉCURITÉ: Gestion d'erreur d'authentification
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to manage reaction" },
      { status: 500 }
    );
  }
}
