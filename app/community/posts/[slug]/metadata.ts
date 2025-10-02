import { Metadata } from 'next';
import { PrismaClient } from '@prisma/client';
import { 
  generateSEOTitle, 
  truncateForSEO, 
  generateSEOKeywords, 
  generateCanonicalURL,
  generateOGImageURL 
} from '@/lib/seo';

const prisma = new PrismaClient();

interface PostForMetadata {
  id: string;
  title: string;
  content: string;
  slug: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    name: string | null;
  };
  category?: {
    name: string;
  } | null;
  shop: {
    shopName: string;
    shopDomain: string;
  };
  _count: {
    comments: number;
    reactions: number;
  };
}

/**
 * Récupère un post par son slug pour les métadonnées
 */
async function getPostBySlug(slug: string): Promise<PostForMetadata | null> {
  try {
    const post = await prisma.post.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        content: true,
        slug: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { name: true }
        },
        category: {
          select: { name: true }
        },
        shop: {
          select: {
            shopName: true,
            shopDomain: true,
          }
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          }
        }
      },
    });

    return post;
  } catch (error) {
    console.error('Error fetching post for metadata:', error);
    return null;
  }
}

/**
 * Génère les métadonnées SEO pour une page de post
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  // Récupérer le post
  const post = await getPostBySlug(slug);

  // Post non trouvé
  if (!post) {
    return {
      title: 'Post non trouvé',
      description: 'Le post demandé est introuvable ou a été supprimé.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  // Générer les métadonnées SEO
  const title = generateSEOTitle(post.title, post.shop.shopName, post.category?.name);
  const baseDescription = truncateForSEO(post.content, 120);
  const commentsInfo = post._count.comments > 0
    ? ` | ${post._count.comments} commentaire${post._count.comments > 1 ? 's' : ''}`
    : '';
  const description = baseDescription + commentsInfo;

  const keywords = generateSEOKeywords(
    post.title,
    post.content,
    post.category?.name,
    post.shop.shopName
  );
  const canonicalUrl = generateCanonicalURL(post.slug || post.id);
  const imageUrl = post.imageUrl || generateOGImageURL(post.title);

  return {
    title,
    description,
    keywords,
    authors: [{ name: post.author.name || 'Anonyme' }],

    // Open Graph
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author.name || 'Anonyme'],
      section: post.category?.name,
      tags: keywords,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        }
      ],
      siteName: `${post.shop.shopName} Community`,
      locale: 'fr_FR',
      // Ajouter des informations spécifiques pour les commentaires
      ...(post._count.comments > 0 && {
        // Open Graph permet d'ajouter des métadonnées custom
        'article:comment_count': post._count.comments.toString(),
      }),
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [imageUrl],
      creator: `@${(post.author.name || 'anonyme').replace(/\s+/g, '').toLowerCase()}`,
    },

    // URLs
    alternates: {
      canonical: canonicalUrl,
    },

    // Robots
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Métadonnées additionnelles
    category: post.category?.name,

    // JSON-LD sera ajouté via le composant StructuredData
    other: {
      'article:author': post.author.name || 'Anonyme',
      'article:section': post.category?.name || 'General',
      'article:published_time': post.createdAt.toISOString(),
      'article:modified_time': post.updatedAt.toISOString(),
      'article:tag': keywords.join(', '),
      'article:comment_count': post._count.comments.toString(),
      // Ajout de métadonnées pour les interactions sociales
      'article:reaction_count': post._count.reactions.toString(),
      'og:engagement': (post._count.comments + post._count.reactions).toString(),
    },
  };
}