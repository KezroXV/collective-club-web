import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";
import { awardPoints } from "@/lib/points";
import { PointAction } from "@prisma/client";
import { getAuthContext } from "@/lib/hybridAuth";
import { updateOnboardingTask } from "@/lib/onboarding";

const prisma = new PrismaClient();

// GET /api/posts/[id]/comments - Récupérer les commentaires d'un post (isolés par boutique)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { postId } = await params;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Pour récupérer les réactions utilisateur

    // Récupérer tous les commentaires principaux (sans parentId)
    const topLevelComments = await prisma.comment.findMany({
      where: { 
        postId,
        shopId,
        OR: [
          { parentId: null },
          { parentId: { equals: null } }
        ]
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        reactions: {
          where: {
            postId: null // Seulement les réactions de commentaires
          },
          select: {
            type: true,
            userId: true
          }
        },
        _count: {
          select: { reactions: true }
        }
      },
      orderBy: { createdAt: "asc" },
    });

    // Récupérer toutes les réponses et les organiser par parentId
    const replies = await prisma.comment.findMany({
      where: { 
        postId,
        shopId,
        parentId: { not: null }
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        reactions: {
          where: {
            postId: null // Seulement les réactions de commentaires
          },
          select: {
            type: true,
            userId: true
          }
        },
        _count: {
          select: { reactions: true }
        }
      },
      orderBy: { createdAt: "asc" },
    });

    // Fonction récursive pour construire l'arbre de commentaires
    const buildCommentTree = (comments: any[], parentId: string | null = null): any[] => {
      return comments
        .filter(comment => comment.parentId === parentId)
        .map(comment => ({
          ...comment,
          replies: buildCommentTree(comments, comment.id)
        }));
    };

    // Combiner tous les commentaires (principaux + réponses)
    const allComments = [...topLevelComments, ...replies];

    // Construire l'arbre complet avec récursion infinie
    const comments = buildCommentTree(allComments, null);

    // Fonction récursive pour traiter les réactions de tous les niveaux
    const processCommentsReactions = (comments: any[]): any[] => {
      return comments.map((comment: any) => {
        // Grouper les réactions du commentaire
        const commentReactionsGrouped = comment.reactions?.reduce((acc: any, reaction: any) => {
          const existingType = acc.find((r: any) => r.type === reaction.type);
          if (existingType) {
            existingType.count += 1;
          } else {
            acc.push({ type: reaction.type, count: 1 });
          }
          return acc;
        }, []) || [];

        // Trouver la réaction de l'utilisateur pour ce commentaire
        const commentUserReaction = userId
          ? comment.reactions?.find((r: any) => r.userId === userId)?.type
          : null;

        // Traiter récursivement toutes les réponses
        const processedReplies = comment.replies ? processCommentsReactions(comment.replies) : [];

        return {
          ...comment,
          reactions: commentReactionsGrouped,
          userReaction: commentUserReaction,
          replies: processedReplies
        };
      });
    };

    const commentsWithReactions = processCommentsReactions(comments);

    return NextResponse.json(commentsWithReactions);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/posts/[id]/comments - Créer un commentaire (isolé par boutique)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // 🔐 AUTHENTICATION: Vérifier que l'utilisateur est connecté (supporte Shopify + NextAuth)
    const auth = await getAuthContext(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const shopId = auth.shopId;
    
    console.log("💬 Creating comment:", { userId: auth.userId, role: auth.role, shopId, authMethod: auth.authMethod });

    const { postId } = await params;
    const body = await request.json();
    const { content, parentId } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const authorId = auth.userId;

    // Si parentId est fourni, vérifier que le commentaire parent existe
    if (parentId) {
      const parentComment = await prisma.comment.findFirst({
        where: { id: parentId, shopId, postId }
      });
      
      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    // Créer le commentaire avec parentId
    const commentData: any = {
      content,
      authorId,
      postId,
      shopId,
    };

    if (parentId) {
      commentData.parentId = parentId;
    }

    const comment = await prisma.comment.create({
      data: commentData,
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        reactions: {
          where: {
            postId: null // Seulement les réactions de commentaires
          },
          select: {
            type: true,
            userId: true
          }
        },
        _count: {
          select: { reactions: true }
        }
      },
    });

    // 🏆 ATTRIBUER DES POINTS AUTOMATIQUEMENT POUR LA CRÉATION D'UN COMMENTAIRE
    try {
      await awardPoints(authorId, shopId, PointAction.COMMENT_CREATED);
    } catch (pointsError) {
      console.error("Error awarding points for comment creation:", pointsError);
      // Ne pas faire échouer la création du commentaire si l'attribution des points échoue
    }

    // 🎯 METTRE À JOUR L'ONBOARDING (premier commentaire)
    try {
      await updateOnboardingTask(authorId, shopId, "hasCommentedPost");
    } catch (onboardingError) {
      console.error("Error updating onboarding for first comment:", onboardingError);
      // Ne pas faire échouer la création du commentaire si l'onboarding échoue
    }

    // Traiter les réactions du nouveau commentaire
    const commentReactionsGrouped = comment.reactions.reduce((acc: any, reaction: any) => {
      const existingType = acc.find((r: any) => r.type === reaction.type);
      if (existingType) {
        existingType.count += 1;
      } else {
        acc.push({ type: reaction.type, count: 1 });
      }
      return acc;
    }, []);

    const responseComment = {
      ...comment,
      reactions: commentReactionsGrouped,
      userReaction: null, // Nouveau commentaire, pas de réaction utilisateur
      replies: [] // Nouveau commentaire, pas de réponses
    };

    return NextResponse.json(responseComment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
