/**
 * 🔍 SEO Utilities for CollectiveClub
 * Fonctions utilitaires pour optimisation SEO
 */

/**
 * Génère un slug URL-friendly à partir d'un titre
 * @param title - Titre du post à convertir
 * @returns Slug optimisé pour URL
 */
export function generateSlug(title: string): string {
  if (!title) return '';
  
  return title
    .toLowerCase()
    .normalize('NFD') // Décomposer les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents/diacritiques
    .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces, tirets
    .trim() // Supprimer espaces début/fin
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Réduire tirets multiples à un seul
    .replace(/^-+|-+$/g, '') // Supprimer tirets début/fin
    .substring(0, 100); // Limiter à 100 caractères
}

/**
 * Génère un slug unique en ajoutant un suffixe numérique si nécessaire
 * @param title - Titre original
 * @param existingSlugs - Liste des slugs existants à éviter
 * @returns Slug unique
 */
export function generateUniqueSlug(title: string, existingSlugs: string[]): string {
  const baseSlug = generateSlug(title);
  
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
  
  return uniqueSlug;
}

/**
 * Truncate text for SEO meta descriptions
 * @param text - Texte à tronquer
 * @param maxLength - Longueur maximale (défaut: 160 pour meta description)
 * @returns Texte tronqué avec ellipsis si nécessaire
 */
export function truncateForSEO(text: string, maxLength: number = 160): string {
  if (!text) return '';
  
  // Nettoyer le texte (supprimer HTML, espaces multiples, etc.)
  const cleanText = text
    .replace(/<[^>]*>/g, '') // Supprimer HTML
    .replace(/\s+/g, ' ') // Réduire espaces multiples
    .trim();
  
  if (cleanText.length <= maxLength) {
    return cleanText;
  }
  
  // Tronquer au dernier mot complet
  const truncated = cleanText.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
}

/**
 * Génère des mots-clés SEO à partir d'un post
 * @param title - Titre du post
 * @param content - Contenu du post
 * @param categoryName - Nom de la catégorie
 * @param shopName - Nom de la boutique
 * @returns Array de mots-clés pour SEO
 */
export function generateSEOKeywords(
  title: string,
  content: string,
  categoryName?: string,
  shopName?: string
): string[] {
  const keywords = new Set<string>();
  
  // Mots-clés de base
  keywords.add('forum');
  keywords.add('community');
  keywords.add('discussion');
  
  // Ajouter catégorie
  if (categoryName) {
    keywords.add(categoryName.toLowerCase());
  }
  
  // Ajouter nom de la boutique
  if (shopName) {
    keywords.add(shopName.toLowerCase());
  }
  
  // Extraire mots importants du titre (mots > 3 caractères)
  const titleWords = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  titleWords.forEach(word => keywords.add(word));
  
  // Extraire quelques mots du contenu (les plus fréquents)
  const contentWords = content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 4);
  
  // Compter fréquence des mots
  const wordCount = contentWords.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Ajouter les 3 mots les plus fréquents
  Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .forEach(([word]) => keywords.add(word));
  
  return Array.from(keywords).slice(0, 10); // Limiter à 10 mots-clés
}

/**
 * Génère une URL canonique pour un post
 * @param slug - Slug du post
 * @param baseUrl - URL de base du site
 * @returns URL canonique complète
 */
export function generateCanonicalURL(slug: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}/community/posts/${slug}`;
}

/**
 * Génère une URL pour un commentaire spécifique
 * @param postSlug - Slug du post
 * @param commentId - ID du commentaire
 * @param baseUrl - URL de base du site
 * @returns URL complète vers le commentaire
 */
export function generateCommentURL(postSlug: string, commentId: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}/community/posts/${postSlug}#comment-${commentId}`;
}

/**
 * Extrait l'ID d'un commentaire depuis une URL avec ancre
 * @param url - URL contenant l'ancre du commentaire
 * @returns ID du commentaire ou null
 */
export function extractCommentIdFromURL(url: string): string | null {
  const match = url.match(/#comment-(.+)$/);
  return match ? match[1] : null;
}

/**
 * Génère une URL d'image Open Graph par défaut
 * @param title - Titre pour l'image
 * @param baseUrl - URL de base
 * @returns URL de l'image OG
 */
export function generateOGImageURL(title: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  // TODO: Implémenter génération dynamique d'images OG
  return `${base}/og-images/default.jpg`;
}

/**
 * Valide qu'un slug respecte les bonnes pratiques SEO
 * @param slug - Slug à valider
 * @returns true si le slug est valide
 */
export function validateSlug(slug: string): boolean {
  if (!slug) return false;
  
  // Doit contenir seulement lettres minuscules, chiffres et tirets
  const validPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  
  return (
    validPattern.test(slug) &&
    slug.length >= 3 &&
    slug.length <= 100 &&
    !slug.startsWith('-') &&
    !slug.endsWith('-')
  );
}

/**
 * Génère un titre SEO optimisé
 * @param postTitle - Titre du post
 * @param shopName - Nom de la boutique
 * @param categoryName - Nom de la catégorie (optionnel)
 * @returns Titre SEO complet
 */
export function generateSEOTitle(
  postTitle: string,
  shopName: string,
  categoryName?: string
): string {
  const parts = [postTitle];
  
  if (categoryName) {
    parts.push(categoryName);
  }
  
  parts.push(`${shopName} Community`);
  
  const fullTitle = parts.join(' | ');
  
  // Limiter à 60 caractères pour title SEO
  if (fullTitle.length <= 60) {
    return fullTitle;
  }
  
  // Si trop long, raccourcir le titre du post
  let maxPostTitleLength = 60 - ` | ${shopName} Community`.length;
  if (categoryName) {
    maxPostTitleLength -= ` | ${categoryName}`.length;
  }
  
  const truncatedPostTitle = postTitle.length > maxPostTitleLength
    ? postTitle.substring(0, maxPostTitleLength - 3) + '...'
    : postTitle;
  
  return generateSEOTitle(truncatedPostTitle, shopName, categoryName);
}

/**
 * Types pour les données structurées Schema.org
 */
export interface ArticleStructuredData {
  '@context': 'https://schema.org';
  '@type': 'Article';
  headline: string;
  description: string;
  image?: string[];
  datePublished: string;
  dateModified: string;
  author: {
    '@type': 'Person';
    name: string;
    url?: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    url?: string;
    logo?: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  mainEntityOfPage: {
    '@type': 'WebPage';
    '@id': string;
  };
  articleSection?: string;
  commentCount?: number;
  comment?: CommentStructuredData[];
  interactionStatistic?: Array<{
    '@type': 'InteractionCounter';
    interactionType: string;
    userInteractionCount: number;
  }>;
}

export interface CommentStructuredData {
  '@context'?: 'https://schema.org';
  '@type': 'Comment';
  text: string;
  dateCreated: string;
  dateModified?: string;
  author: {
    '@type': 'Person';
    name: string;
    url?: string;
  };
  url?: string;
  parentItem?: {
    '@type': 'Comment' | 'Article';
    '@id': string;
  };
  upvoteCount?: number;
  downvoteCount?: number;
}

/**
 * Génère les données structurées Schema.org pour un commentaire
 */
export function generateCommentStructuredData(
  comment: {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt?: Date;
    author: { name: string | null; id: string };
    parentId?: string;
    reactions?: Array<{ type: string; count: number }>;
  },
  postSlug: string,
  baseUrl?: string
): CommentStructuredData {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const postUrl = generateCanonicalURL(postSlug, base);

  const totalReactions = comment.reactions?.reduce((sum, r) => sum + r.count, 0) || 0;

  return {
    '@type': 'Comment',
    text: truncateForSEO(comment.content, 300),
    dateCreated: comment.createdAt.toISOString(),
    dateModified: comment.updatedAt?.toISOString(),

    author: {
      '@type': 'Person',
      name: comment.author.name || 'Anonyme',
      url: `${base}/community/users/${comment.author.id}`
    },

    url: `${postUrl}#comment-${comment.id}`,

    parentItem: comment.parentId ? {
      '@type': 'Comment',
      '@id': `${postUrl}#comment-${comment.parentId}`
    } : {
      '@type': 'Article',
      '@id': postUrl
    },

    upvoteCount: totalReactions,
    downvoteCount: 0
  };
}

/**
 * Génère les données structurées Schema.org pour un article avec commentaires
 */
export function generateArticleStructuredData(
  post: {
    title: string;
    content: string;
    slug: string | null;
    imageUrl?: string | null;
    createdAt: Date;
    updatedAt: Date;
    author: { name: string | null; id: string };
    category?: { name: string } | null;
    _count?: { comments: number; reactions: number };
  },
  shop: { shopName: string; shopDomain: string },
  comments?: Array<{
    id: string;
    content: string;
    createdAt: Date;
    updatedAt?: Date;
    author: { name: string | null; id: string };
    parentId?: string;
    reactions?: Array<{ type: string; count: number }>;
  }>,
  baseUrl?: string
): ArticleStructuredData {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const structuredData: ArticleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: truncateForSEO(post.content, 300),
    image: post.imageUrl ? [post.imageUrl] : undefined,
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),

    author: {
      '@type': 'Person',
      name: post.author.name || 'Anonyme',
      url: `${base}/community/users/${post.author.id}`
    },

    publisher: {
      '@type': 'Organization',
      name: shop.shopName,
      url: `https://${shop.shopDomain}`,
      logo: {
        '@type': 'ImageObject',
        url: `${base}/logo.png` // TODO: Logo de la boutique
      }
    },

    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': generateCanonicalURL(post.slug || '', base)
    },

    articleSection: post.category?.name,
    commentCount: post._count?.comments,

    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: post._count?.comments || 0
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: post._count?.reactions || 0
      }
    ]
  };

  // Ajouter les commentaires si fournis (limiter à 5 pour SEO)
  if (comments && comments.length > 0) {
    structuredData.comment = comments.slice(0, 5).map(comment =>
      generateCommentStructuredData(comment, post.slug || '', base)
    );
  }

  return structuredData;
}