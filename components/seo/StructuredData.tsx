/**
 * 🔍 Composant StructuredData pour Schema.org markup
 * Génère les données structurées JSON-LD pour SEO
 */

import {
  generateArticleStructuredData,
  generateCommentStructuredData,
  ArticleStructuredData,
  CommentStructuredData,
} from "@/lib/seo";

interface PostStructuredDataProps {
  post: {
    id: string;
    title: string;
    content: string;
    slug: string | null;
    imageUrl?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    author: {
      id: string;
      name: string | null;
    };
    category?: {
      name: string;
    } | null;
    shop: {
      shopName: string;
      shopDomain: string;
      logoUrl?: string | null;
    };
    _count?: {
      comments: number;
      reactions: number;
    };
  };
  comments?: Array<{
    id: string;
    content: string;
    createdAt: Date | string;
    updatedAt?: Date | string;
    author: {
      id: string;
      name: string | null;
    };
    parentId?: string | null;
    reactions?: Array<{ type: string; count: number }>;
  }>;
  baseUrl?: string;
}

/**
 * Composant pour les données structurées d'un article/post avec commentaires
 */
export function PostStructuredData({
  post,
  comments,
  baseUrl,
}: PostStructuredDataProps) {
  // Convertir les dates en objets Date si nécessaire
  const postForStructuredData = {
    ...post,
    createdAt:
      typeof post.createdAt === "string"
        ? new Date(post.createdAt)
        : post.createdAt,
    updatedAt:
      typeof post.updatedAt === "string"
        ? new Date(post.updatedAt)
        : post.updatedAt,
  };

  // Convertir les commentaires si fournis
  const commentsForStructuredData = comments?.map((comment) => ({
    ...comment,
    createdAt:
      typeof comment.createdAt === "string"
        ? new Date(comment.createdAt)
        : comment.createdAt,
    updatedAt: comment.updatedAt
      ? typeof comment.updatedAt === "string"
        ? new Date(comment.updatedAt)
        : comment.updatedAt
      : undefined,
  }));

  const structuredData = generateArticleStructuredData(
    postForStructuredData,
    {
      shopName: post.shop.shopName,
      shopDomain: post.shop.shopDomain,
      logoUrl: post.shop.logoUrl,
    },
    commentsForStructuredData
      ? commentsForStructuredData.map((comment) => ({
          ...comment,
          parentId: comment.parentId ?? undefined, // Convertir null en undefined
        }))
      : undefined,
    baseUrl
  );
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
}

/**
 * Données structurées pour une liste de posts (page forum)
 */
interface ForumStructuredDataProps {
  shop: {
    shopName: string;
    shopDomain: string;
  };
  posts: Array<{
    title: string;
    slug: string;
    author: { name: string };
    createdAt: Date | string;
    _count?: { comments: number };
  }>;
  baseUrl?: string;
}

export function ForumStructuredData({
  shop,
  posts,
  baseUrl,
}: ForumStructuredDataProps) {
  const base =
    baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${shop.shopName} Community Forum`,
    description: `Discussion forum and community for ${shop.shopName}`,
    url: `${base}/community`,

    publisher: {
      "@type": "Organization",
      name: shop.shopName,
      url: `https://${shop.shopDomain}`,
    },

    mainEntity: {
      "@type": "ItemList",
      numberOfItems: posts.length,
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Article",
          headline: post.title,
          url: `${base}/community/posts/${post.slug}`,
          author: {
            "@type": "Person",
            name: post.author.name,
          },
          datePublished:
            typeof post.createdAt === "string"
              ? post.createdAt
              : post.createdAt.toISOString(),
          commentCount: post._count?.comments || 0,
        },
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
}

/**
 * Données structurées pour le breadcrumb
 */
interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbStructuredDataProps {
  items: BreadcrumbItem[];
  baseUrl?: string;
}

export function BreadcrumbStructuredData({
  items,
  baseUrl,
}: BreadcrumbStructuredDataProps) {
  const base =
    baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href.startsWith("http") ? item.href : `${base}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
}

/**
 * Données structurées pour l'organisation (boutique)
 */
interface OrganizationStructuredDataProps {
  shop: {
    shopName: string;
    shopDomain: string;
  };
  baseUrl?: string;
}

export function OrganizationStructuredData({
  shop,
  baseUrl,
}: OrganizationStructuredDataProps) {
  const base =
    baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: shop.shopName,
    url: `https://${shop.shopDomain}`,

    // Liens sociaux et community
    sameAs: [`${base}/community`],

    // Sous-organisation pour la communauté
    subOrganization: {
      "@type": "Organization",
      name: `${shop.shopName} Community`,
      url: `${base}/community`,
      description: `Community forum for ${shop.shopName} customers and enthusiasts`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
}

/**
 * Données structurées pour une discussion/forum thread
 */
interface DiscussionStructuredDataProps {
  post: {
    title: string;
    slug: string;
    author: { name: string; id: string };
    createdAt: Date | string;
    _count?: { comments: number };
  };
  comments: Array<{
    id: string;
    content: string;
    author: { name: string };
    createdAt: Date | string;
  }>;
  shop: {
    shopName: string;
    shopDomain: string;
  };
  baseUrl?: string;
}

export function DiscussionStructuredData({
  post,
  comments,
  shop,
  baseUrl,
}: DiscussionStructuredDataProps) {
  const base =
    baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: post.title,
    url: `${base}/community/posts/${post.slug}`,

    author: {
      "@type": "Person",
      name: post.author.name,
      url: `${base}/community/users/${post.author.id}`,
    },

    datePublished:
      typeof post.createdAt === "string"
        ? post.createdAt
        : post.createdAt.toISOString(),

    commentCount: post._count?.comments || comments.length,

    comment: comments.slice(0, 10).map((comment) => ({
      "@type": "Comment",
      text: comment.content.substring(0, 300),
      author: {
        "@type": "Person",
        name: comment.author.name,
      },
      datePublished:
        typeof comment.createdAt === "string"
          ? comment.createdAt
          : comment.createdAt.toISOString(),
      url: `${base}/community/posts/${post.slug}#comment-${comment.id}`,
    })),

    publisher: {
      "@type": "Organization",
      name: shop.shopName,
      url: `https://${shop.shopDomain}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
}

/**
 * Composant pour données structurées d'un commentaire individuel
 */
interface CommentStructuredDataProps {
  comment: {
    id: string;
    content: string;
    createdAt: Date | string;
    updatedAt?: Date | string;
    author: {
      id: string;
      name: string;
    };
    parentId?: string;
    reactions?: Array<{ type: string; count: number }>;
  };
  postSlug: string;
  baseUrl?: string;
}

export function CommentStructuredDataComponent({
  comment,
  postSlug,
  baseUrl,
}: CommentStructuredDataProps) {
  // Convertir les dates si nécessaire
  const commentForStructuredData = {
    ...comment,
    createdAt:
      typeof comment.createdAt === "string"
        ? new Date(comment.createdAt)
        : comment.createdAt,
    updatedAt: comment.updatedAt
      ? typeof comment.updatedAt === "string"
        ? new Date(comment.updatedAt)
        : comment.updatedAt
      : undefined,
  };

  const structuredData = generateCommentStructuredData(
    commentForStructuredData,
    postSlug,
    baseUrl
  );

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
}
