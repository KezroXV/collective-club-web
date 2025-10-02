import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { createDefaultBadgesForShop } from "./defaultBadges";

const prisma = new PrismaClient();

export interface ShopContext {
  shopId: string;
  shopDomain: string;
  shopName: string;
}

export interface ShopIsolationError {
  code: 'MISSING_SHOP_ID' | 'INVALID_SHOP_ID' | 'SHOP_NOT_FOUND' | 'SESSION_EXPIRED' | 'SHOP_DELETED';
  message: string;
  recoverable: boolean;
  fallbackAction?: string;
}

export class ShopIsolationException extends Error {
  public readonly code: ShopIsolationError['code'];
  public readonly recoverable: boolean;
  public readonly fallbackAction?: string;

  constructor(error: ShopIsolationError) {
    super(error.message);
    this.name = 'ShopIsolationException';
    this.code = error.code;
    this.recoverable = error.recoverable;
    this.fallbackAction = error.fallbackAction;
  }
}

/**
 * Middleware pour l'isolation multi-tenant des boutiques Shopify
 * Récupère ou crée une boutique en fonction du shopDomain
 * 
 * @throws {ShopIsolationException} En cas d'erreur critique d'isolation
 */
export async function getShopContext(request: NextRequest): Promise<ShopContext> {
  try {
    // Récupérer le shopDomain depuis les paramètres de requête Shopify
    const url = new URL(request.url);
    let shopDomain = url.searchParams.get('shop');
  
  
  // Vérifier dans les headers (Shopify peut envoyer dans des headers)
  if (!shopDomain) {
    const shopifyDomain = request.headers.get('x-shopify-shop-domain') || 
                         request.headers.get('x-shop-domain') ||
                         request.headers.get('shopify-shop-domain');
    if (shopifyDomain) {
      shopDomain = shopifyDomain;
    }
  }
  
  // Fallback pour le développement local
  if (!shopDomain) {
    // Vérifier les headers de referer ou host
    const referer = request.headers.get('referer');
    if (referer) {
      const refererUrl = new URL(referer);
      shopDomain = refererUrl.searchParams.get('shop');
    }
  }
  
  // Vérifier dans le host/origin pour les apps Shopify
  if (!shopDomain) {
    const origin = request.headers.get('origin');
    
    // Si l'origine contient myshopify.com, l'utiliser
    if (origin && origin.includes('.myshopify.com')) {
      const match = origin.match(/https?:\/\/([^.]+)\.myshopify\.com/);
      if (match) {
        shopDomain = `${match[1]}.myshopify.com`;
      }
    }
  }
  
  // Vérifier dans les cookies (pour les navigations internes)
  if (!shopDomain) {
    const cookies = request.headers.get('cookie');
    if (cookies) {
      const shopCookie = cookies.split(';').find(c => c.trim().startsWith('shopDomain='));
      if (shopCookie) {
        shopDomain = shopCookie.split('=')[1].trim();
      }
    }
  }
  
    // Dernière fallback pour le développement
    if (!shopDomain) {
      if (process.env.NODE_ENV === 'production') {
        throw new ShopIsolationException({
          code: 'MISSING_SHOP_ID',
          message: 'Shop domain is required in production environment',
          recoverable: false,
          fallbackAction: 'redirect_to_shopify_auth'
        });
      }
      shopDomain = "collective-club.myshopify.com";
    }
    
    // Valider le format du shopDomain
    if (!isValidShopDomain(shopDomain)) {
      throw new ShopIsolationException({
        code: 'INVALID_SHOP_ID',
        message: `Invalid shop domain format: ${shopDomain}`,
        recoverable: false,
        fallbackAction: 'redirect_to_error_page'
      });
    }
    
    // Normaliser le shopDomain
    if (!shopDomain.includes('.myshopify.com')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }

    // Récupérer ou créer la boutique
    let shop = await prisma.shop.findUnique({
      where: { shopDomain }
    });

    if (!shop) {
      // En production, ne pas créer automatiquement des boutiques
      if (process.env.NODE_ENV === 'production') {
        throw new ShopIsolationException({
          code: 'SHOP_NOT_FOUND',
          message: `Shop not found: ${shopDomain}. Shop must be registered first.`,
          recoverable: true,
          fallbackAction: 'redirect_to_shopify_auth'
        });
      }

      // Créer une nouvelle boutique si elle n'existe pas (dev uniquement)
      try {
        shop = await prisma.shop.create({
          data: {
            shopDomain,
            shopName: extractShopName(shopDomain),
            ownerId: `owner-${Date.now()}`, // ID temporaire
            settings: {
              environment: process.env.NODE_ENV,
              createdVia: "auto-isolation",
              createdAt: new Date().toISOString()
            }
          }
        });

        // Créer automatiquement des catégories et des badges par défaut (SANS admin automatique)
        await createDefaultCategoriesForShop(shop.id);
        await createDefaultBadgesForShop(shop.id);
        
      } catch (dbError) {
        throw new ShopIsolationException({
          code: 'SHOP_NOT_FOUND',
          message: `Failed to create shop: ${shopDomain}. Database error: ${dbError}`,
          recoverable: false,
          fallbackAction: 'contact_support'
        });
      }
    }

    // Vérifier que la boutique n'est pas marquée comme supprimée
    if (shop.settings && typeof shop.settings === 'object' && 
        'deleted' in shop.settings && shop.settings.deleted) {
      throw new ShopIsolationException({
        code: 'SHOP_DELETED',
        message: `Shop has been deleted: ${shopDomain}`,
        recoverable: false,
        fallbackAction: 'redirect_to_error_page'
      });
    }

    return {
      shopId: shop.id,
      shopDomain: shop.shopDomain,
      shopName: shop.shopName
    };
    
  } catch (error) {
    // Si c'est déjà une ShopIsolationException, la relancer
    if (error instanceof ShopIsolationException) {
      throw error;
    }
    
    // Pour toute autre erreur, l'encapsuler
    throw new ShopIsolationException({
      code: 'INVALID_SHOP_ID',
      message: `Unexpected error in shop isolation: ${error}`,
      recoverable: false,
      fallbackAction: 'contact_support'
    });
  }
}

/**
 * Récupère uniquement le shopId depuis une requête
 * Version sécurisée avec gestion d'erreurs
 */
export async function getShopId(request: NextRequest): Promise<string> {
  try {
    const context = await getShopContext(request);
    return context.shopId;
  } catch (error) {
    if (error instanceof ShopIsolationException) {
      throw error;
    }
    throw new ShopIsolationException({
      code: 'INVALID_SHOP_ID',
      message: `Failed to retrieve shop ID: ${error}`,
      recoverable: false,
      fallbackAction: 'contact_support'
    });
  }
}

/**
 * Version gracieuse qui retourne null au lieu de lever une exception
 */
export async function getShopIdSafe(request: NextRequest): Promise<string | null> {
  try {
    return await getShopId(request);
  } catch (error) {
    if (error instanceof ShopIsolationException && error.recoverable) {
      return null;
    }
    throw error;
  }
}

/**
 * Extrait le nom de boutique depuis un domaine Shopify
 */
function extractShopName(shopDomain: string): string {
  const shopSlug = shopDomain.replace('.myshopify.com', '');
  return shopSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Valide le format d'un domaine Shopify
 */
function isValidShopDomain(shopDomain: string): boolean {
  if (!shopDomain || typeof shopDomain !== 'string') {
    return false;
  }

  // Patterns acceptés:
  // - boutique.myshopify.com
  // - boutique-test.myshopify.com
  // - collective-club-dev.myshopify.com (dev)
  const shopifyDomainPattern = /^[a-z0-9][a-z0-9\-]*[a-z0-9]\.myshopify\.com$|^[a-z0-9]+\.myshopify\.com$/i;
  
  // Vérifier le format de base
  if (!shopifyDomainPattern.test(shopDomain)) {
    return false;
  }

  // Interdire certains patterns dangereux
  const forbiddenPatterns = [
    /\.\./,           // double points
    /[<>\"']/,        // caractères d'injection
    /javascript:/i,   // tentative d'injection JS
    /data:/i,         // data URLs
    /vbscript:/i      // VBScript
  ];

  return !forbiddenPatterns.some(pattern => pattern.test(shopDomain));
}

/**
 * Middleware pour vérifier l'isolation des données
 * Version améliorée avec gestion d'erreurs robuste
 */
export function ensureShopIsolation(shopId: string | null | undefined): string {
  if (!shopId || typeof shopId !== 'string') {
    throw new ShopIsolationException({
      code: 'MISSING_SHOP_ID',
      message: "Shop ID is required for multi-tenant isolation",
      recoverable: false,
      fallbackAction: 'redirect_to_shopify_auth'
    });
  }

  // Validation basique du format de l'ID
  if (shopId.length < 10 || shopId.length > 50) {
    throw new ShopIsolationException({
      code: 'INVALID_SHOP_ID',
      message: `Invalid shop ID format: ${shopId}`,
      recoverable: false,
      fallbackAction: 'contact_support'
    });
  }

  return shopId;
}

/**
 * Vérifie qu'un utilisateur appartient bien à la boutique spécifiée
 */
export async function validateUserBelongsToShop(userId: string, shopId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        shopId: shopId
      },
      select: { id: true }
    });
    
    return !!user;
  } catch (error) {
    throw new ShopIsolationException({
      code: 'INVALID_SHOP_ID',
      message: `Failed to validate user-shop relationship: ${error}`,
      recoverable: false,
      fallbackAction: 'contact_support'
    });
  }
}

/**
 * Vérifie qu'une ressource appartient bien à la boutique spécifiée
 */
export async function validateResourceBelongsToShop(
  resourceType: 'post' | 'category' | 'badge' | 'poll',
  resourceId: string,
  shopId: string
): Promise<boolean> {
  try {
    let resource;
    
    switch (resourceType) {
      case 'post':
        resource = await prisma.post.findFirst({
          where: { id: resourceId, shopId },
          select: { id: true }
        });
        break;
      case 'category':
        resource = await prisma.category.findFirst({
          where: { id: resourceId, shopId },
          select: { id: true }
        });
        break;
      case 'badge':
        resource = await prisma.badge.findFirst({
          where: { id: resourceId, shopId },
          select: { id: true }
        });
        break;
      case 'poll':
        resource = await prisma.poll.findFirst({
          where: { id: resourceId, shopId },
          select: { id: true }
        });
        break;
      default:
        return false;
    }
    
    return !!resource;
  } catch (error) {
    throw new ShopIsolationException({
      code: 'INVALID_SHOP_ID',
      message: `Failed to validate resource-shop relationship: ${error}`,
      recoverable: false,
      fallbackAction: 'contact_support'
    });
  }
}

/**
 * Helper pour créer des catégories par défaut pour une nouvelle boutique
 */
export async function createDefaultCategoriesForShop(shopId: string) {
  const defaultCategories = [
    {
      name: "Général",
      color: "bg-blue-500",
      description: "Discussions générales",
      order: 1,
      shopId,
    },
    {
      name: "Produits",
      color: "bg-green-500", 
      description: "À propos de nos produits",
      order: 2,
      shopId,
    },
    {
      name: "Support",
      color: "bg-orange-500",
      description: "Questions et support",
      order: 3,
      shopId,
    }
  ];

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: {
        shopId_name: {
          shopId,
          name: category.name,
        }
      },
      update: {},
      create: category,
    });
  }

}

/**
 * Helper pour créer un utilisateur admin par défaut pour une nouvelle boutique
 */
export async function createDefaultAdminForShop(shopId: string, shopDomain: string, ownerEmail?: string) {
  const adminEmail = ownerEmail || `admin@${shopDomain}`;
  
  const adminUser = await prisma.user.upsert({
    where: {
      shopId_email: {
        shopId,
        email: adminEmail,
      }
    },
    update: {},
    create: {
      email: adminEmail,
      name: "Propriétaire",
      role: "ADMIN",
      shopId,
      shopDomain,
      isShopOwner: true, // ✅ AJOUTER le champ obligatoire
    },
  });

  return adminUser;
}