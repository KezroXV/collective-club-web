/**
 * Hook pour vérifier les permissions utilisateur avec support des rôles personnalisés
 */

import { useCurrentUser } from './useCurrentUser';
import {
  Permission,
  UserRole,
  hasUserPermission,
  getAllUserPermissions
} from '../permissions';

export function usePermissions() {
  const { currentUser } = useCurrentUser();

  const hasPermission = (permission: Permission): boolean => {
    if (!currentUser) return false;

    // Récupérer les permissions du rôle personnalisé si disponible
    const customPermissions = Array.isArray(currentUser.roleInfo?.permissions)
      ? currentUser.roleInfo.permissions
      : [];

    return hasUserPermission(
      currentUser.role as UserRole,
      customPermissions,
      permission
    );
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const getAllPermissions = (): Permission[] => {
    if (!currentUser) return [];

    const customPermissions = Array.isArray(currentUser.roleInfo?.permissions)
      ? currentUser.roleInfo.permissions
      : [];

    return getAllUserPermissions(
      currentUser.role as UserRole,
      customPermissions
    );
  };

  // Helpers pour les vérifications courantes
  const canManageUsers = () => hasPermission(Permission.MANAGE_USERS);
  const canChangeRoles = () => hasPermission(Permission.CHANGE_ROLES);
  const canBanUsers = () => hasPermission(Permission.BAN_USERS);
  const canDeletePosts = () => hasPermission(Permission.DELETE_POSTS);
  const canDeleteComments = () => hasPermission(Permission.DELETE_COMMENTS);
  const canModerateComments = () => hasPermission(Permission.MODERATE_COMMENTS);
  const canManageShop = () => hasPermission(Permission.MANAGE_SHOP);
  const canManageCategories = () => hasPermission(Permission.MANAGE_CATEGORIES);
  const canManagePosts = () => hasPermission(Permission.MANAGE_POSTS);

  // Helper pour vérifier si c'est un admin (avec permissions complètes)
  const isAdmin = () => hasPermission(Permission.MANAGE_SHOP);

  // Helper pour vérifier si c'est un modérateur (peut modérer)
  const isModerator = () => hasPermission(Permission.MODERATE_COMMENTS);

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    getAllPermissions,
    canManageUsers,
    canChangeRoles,
    canBanUsers,
    canDeletePosts,
    canDeleteComments,
    canModerateComments,
    canManageShop,
    canManageCategories,
    canManagePosts,
    isAdmin,
    isModerator,
    currentUser
  };
}