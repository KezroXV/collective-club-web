/**
 * 🔧 Configuration SEO centralisée pour CollectiveClub
 * Contient les constantes et configurations SEO réutilisables
 */

export const SEO_CONFIG = {
  // Limites de caractères pour SEO
  LIMITS: {
    TITLE_MAX: 60,
    DESCRIPTION_MAX: 160,
    KEYWORDS_MAX: 10,
    COMMENT_EXCERPT_MAX: 300,
    COMMENTS_FOR_SEO: 5, // Nombre max de commentaires dans structured data
  },

  // URLs et domaines
  URLS: {
    DEFAULT_BASE: 'http://localhost:3000',
    COMMUNITY_PREFIX: '/community',
    POSTS_PREFIX: '/community/posts',
    USERS_PREFIX: '/community/users',
  },

  // Méta-données par défaut
  DEFAULTS: {
    LOCALE: 'fr_FR',
    SITE_NAME_SUFFIX: 'Community',
    OG_IMAGE_WIDTH: 1200,
    OG_IMAGE_HEIGHT: 630,
    TWITTER_CARD: 'summary_large_image',
  },

  // Mots-clés de base pour le SEO
  BASE_KEYWORDS: [
    'forum',
    'community',
    'communauté',
    'discussion',
    'commentaires',
    'échanges',
    'entraide',
  ],

  // Types de contenu Schema.org
  SCHEMA_TYPES: {
    ARTICLE: 'Article',
    COMMENT: 'Comment',
    PERSON: 'Person',
    ORGANIZATION: 'Organization',
    DISCUSSION: 'DiscussionForumPosting',
    ITEM_LIST: 'ItemList',
    LIST_ITEM: 'ListItem',
    WEB_PAGE: 'WebPage',
    IMAGE_OBJECT: 'ImageObject',
    INTERACTION_COUNTER: 'InteractionCounter',
    COLLECTION_PAGE: 'CollectionPage',
    BREADCRUMB_LIST: 'BreadcrumbList',
  },

  // Actions d'interaction Schema.org
  INTERACTION_TYPES: {
    COMMENT: 'https://schema.org/CommentAction',
    LIKE: 'https://schema.org/LikeAction',
    SHARE: 'https://schema.org/ShareAction',
    VIEW: 'https://schema.org/ViewAction',
  },

  // Robots et indexation
  ROBOTS: {
    INDEX: true,
    FOLLOW: true,
    NO_CACHE: false,
    GOOGLE_BOT: {
      INDEX: true,
      FOLLOW: true,
      NO_IMAGE_INDEX: false,
      MAX_VIDEO_PREVIEW: -1,
      MAX_IMAGE_PREVIEW: 'large',
      MAX_SNIPPET: -1,
    },
  },

  // Templates de messages
  TEMPLATES: {
    COMMENT_SHARE_TEXT: (authorName: string, postTitle: string, commentText: string) =>
      `Commentaire de ${authorName} sur "${postTitle}": ${commentText.substring(0, 100)}${commentText.length > 100 ? '...' : ''}`,

    POST_WITH_COMMENTS: (commentsCount: number) =>
      commentsCount > 0 ? ` | ${commentsCount} commentaire${commentsCount > 1 ? 's' : ''}` : '',

    SEO_TITLE: (postTitle: string, shopName: string, categoryName?: string) => {
      const parts = [postTitle];
      if (categoryName) parts.push(categoryName);
      parts.push(`${shopName} Community`);
      return parts.join(' | ');
    },
  },

  // Règles de validation
  VALIDATION: {
    SLUG_PATTERN: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    MIN_SLUG_LENGTH: 3,
    MAX_SLUG_LENGTH: 100,
    WORD_MIN_LENGTH_FOR_KEYWORDS: 3,
    CONTENT_WORD_MIN_LENGTH: 4,
  },

  // Configuration des balises meta spéciales
  META_TAGS: {
    ARTICLE_PREFIX: 'article:',
    OG_PREFIX: 'og:',
    TWITTER_PREFIX: 'twitter:',

    // Tags spécifiques aux articles
    ARTICLE_TAGS: {
      AUTHOR: 'article:author',
      SECTION: 'article:section',
      PUBLISHED_TIME: 'article:published_time',
      MODIFIED_TIME: 'article:modified_time',
      TAG: 'article:tag',
      COMMENT_COUNT: 'article:comment_count',
      REACTION_COUNT: 'article:reaction_count',
    },

    // Tags Open Graph personnalisés
    CUSTOM_OG_TAGS: {
      ENGAGEMENT: 'og:engagement',
      INTERACTION_COUNT: 'og:interaction_count',
      FORUM_TYPE: 'og:forum_type',
    },
  },

  // Configuration des images
  IMAGES: {
    DEFAULT_OG_IMAGE: '/og-images/default.jpg',
    LOGO_PATH: '/logo.png',
    PLACEHOLDER_AVATAR: '/avatars/default.png',
  },

  // Erreurs et messages par défaut
  ERROR_MESSAGES: {
    POST_NOT_FOUND: {
      TITLE: 'Post non trouvé',
      DESCRIPTION: 'Le post demandé est introuvable ou a été supprimé.',
    },
    COMMENT_NOT_FOUND: {
      TITLE: 'Commentaire non trouvé',
      DESCRIPTION: 'Le commentaire demandé est introuvable ou a été supprimé.',
    },
  },
} as const;

/**
 * Fonction utilitaire pour obtenir l'URL de base
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || SEO_CONFIG.URLS.DEFAULT_BASE;
}

/**
 * Fonction utilitaire pour construire des URLs complètes
 */
export function buildUrl(path: string, baseUrl?: string): string {
  const base = baseUrl || getBaseUrl();
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Fonction utilitaire pour valider les limites SEO
 */
export function validateSEOLimits(text: string, maxLength: number): boolean {
  return text.length <= maxLength;
}

/**
 * Type pour les configurations de métadonnées
 */
export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  imageUrl?: string;
  type?: 'article' | 'website' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
}