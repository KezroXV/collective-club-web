/**
 * 🏪 Shop Logo Utilities
 * Fonctions pour récupérer et générer les logos des boutiques
 */

import { prisma } from '@/lib/prisma';

/**
 * Génère un avatar par défaut basé sur le nom du shop
 * Utilise Dicebear API pour générer un avatar unique
 * @param shopName - Nom de la boutique
 * @returns URL de l'avatar généré
 */
export function generateDefaultShopAvatar(shopName: string): string {
  // Utiliser Dicebear pour générer un avatar unique basé sur le nom
  const seed = encodeURIComponent(shopName);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=3b82f6,8b5cf6,10b981&fontSize=40`;
}

/**
 * Récupère le logo du shop depuis CustomizationSettings
 * Avec fallback sur un avatar généré automatiquement
 * @param shopId - ID de la boutique
 * @param shopName - Nom de la boutique (pour le fallback)
 * @returns URL du logo ou avatar généré
 */
export async function getShopLogo(
  shopId: string,
  shopName: string
): Promise<string> {
  try {
    // Chercher les settings de customisation du shop owner
    const shopOwner = await prisma.user.findFirst({
      where: {
        shopId,
        isShopOwner: true,
      },
      select: {
        id: true,
      },
    });

    if (!shopOwner) {
      // Pas de owner trouvé, retourner avatar par défaut
      return generateDefaultShopAvatar(shopName);
    }

    // Récupérer les settings de customisation
    const customizationSettings = await prisma.customizationSettings.findUnique({
      where: {
        userId_shopId: {
          userId: shopOwner.id,
          shopId,
        },
      },
      select: {
        logoImageUrl: true,
      },
    });

    // Retourner le logo s'il existe, sinon avatar par défaut
    return customizationSettings?.logoImageUrl || generateDefaultShopAvatar(shopName);
  } catch (error) {
    console.error('Error fetching shop logo:', error);
    // En cas d'erreur, retourner avatar par défaut
    return generateDefaultShopAvatar(shopName);
  }
}

/**
 * Récupère le logo du shop de manière synchrone (pour les cas où on a déjà les données)
 * @param logoImageUrl - URL du logo depuis CustomizationSettings
 * @param shopName - Nom de la boutique (pour le fallback)
 * @returns URL du logo ou avatar généré
 */
export function getShopLogoSync(
  logoImageUrl: string | null | undefined,
  shopName: string
): string {
  return logoImageUrl || generateDefaultShopAvatar(shopName);
}

/**
 * Valide qu'une URL de logo est valide et accessible
 * @param logoUrl - URL à valider
 * @returns true si l'URL est valide
 */
export function isValidLogoUrl(logoUrl: string | null | undefined): boolean {
  if (!logoUrl) return false;

  try {
    const url = new URL(logoUrl);
    // Vérifier que c'est http ou https
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
