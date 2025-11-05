/**
 * 🔐 Sélections Prisma sécurisées
 *
 * Ce fichier contient des sélections réutilisables pour les requêtes Prisma
 * afin d'éviter l'exposition accidentelle du champ `password`.
 *
 * ⚠️ RÈGLE ABSOLUE : JAMAIS de requête User sans select explicite !
 */

/**
 * Sélection minimale pour User (uniquement l'ID)
 * Utiliser pour les vérifications d'existence
 */
export const USER_SELECT_ID = {
  id: true,
  // ⚠️ NE JAMAIS inclure password !
} as const;

/**
 * Sélection basique pour User (infos publiques)
 * Utiliser pour l'affichage utilisateur
 */
export const USER_SELECT_PUBLIC = {
  id: true,
  email: true,
  name: true,
  image: true,
  role: true,
  shopId: true,
  isShopOwner: true,
  isBanned: true,
  createdAt: true,
  // ⚠️ NE JAMAIS inclure password !
} as const;

/**
 * Sélection pour profil utilisateur (avec stats)
 */
export const USER_SELECT_PROFILE = {
  id: true,
  email: true,
  name: true,
  image: true,
  role: true,
  shopId: true,
  isShopOwner: true,
  isBanned: true,
  createdAt: true,
  roleInfo: true,
  // ⚠️ NE JAMAIS inclure password !
} as const;

/**
 * Sélection pour vérification admin
 */
export const USER_SELECT_ADMIN_CHECK = {
  id: true,
  role: true,
  isShopOwner: true,
  // ⚠️ NE JAMAIS inclure password !
} as const;

/**
 * Exemple d'utilisation :
 *
 * ```typescript
 * import { USER_SELECT_PUBLIC } from '@/lib/prisma-safe-selects';
 *
 * const user = await prisma.user.findFirst({
 *   where: { id: userId, shopId },
 *   select: USER_SELECT_PUBLIC
 * });
 * ```
 */
