import { PrismaClient } from "@prisma/client";
import { PostStructuredData } from "@/components/seo/StructuredData";
import PostClient from "../../components/PostClient";

// Import des métadonnées SEO
export { generateMetadata } from "./metadata";

const prisma = new PrismaClient();

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Page serveur pour les posts avec slug SEO
 * Récupère les données et génère les métadonnées côté serveur
 */
export default async function PostBySlugPage({ params }: PageProps) {
  const { slug } = await params;

  // Récupération des données côté serveur pour le SEO
  let post = null;
  let comments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
      name: string | null;
    };
    parentId: string | null;
    reactions: Array<{ type: string; count: number }>;
  }> | null = null;
  try {
    post = await prisma.post.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
            role: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        shop: {
          select: {
            id: true,
            shopName: true,
            shopDomain: true,
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    });

    // Récupérer les premiers commentaires pour SEO (limités à 5)
    if (post) {
      const rawComments = await prisma.comment.findMany({
        where: {
          postId: post.id,
          parentId: null, // Seulement les commentaires de premier niveau
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          reactions: {
            select: {
              type: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: 5, // Limiter pour SEO
      });

      // Transformer les réactions pour correspondre au format attendu
      comments = rawComments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: comment.author,
        parentId: comment.parentId,
        reactions: comment.reactions.reduce((acc: Array<{ type: string; count: number }>, reaction) => {
          const existing = acc.find(r => r.type === reaction.type);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ type: reaction.type, count: 1 });
          }
          return acc;
        }, []),
      }));
    }
  } catch (error) {
    console.error("Error fetching post for SSR:", error);
  }

  return (
    <>
      {/* Données structurées SEO - côté serveur avec commentaires */}
      {post && <PostStructuredData post={post} comments={comments || []} />}

      {/* Composant client pour l'interactivité */}
      <PostClient />
    </>
  );
}
