/**
 * Système de permissions et de gestion des rôles sécurisé
 * Multi-tenant avec isolation par boutique
 */

export enum UserRole {
  ADMIN = 'ADMIN',           // Toutes permissions boutique
  MODERATOR = 'MODERATOR',   // Modération contenu
  MEMBER = 'MEMBER'          // Lecture/écriture basique
}

export enum Permission {
  // Gestion boutique
  MANAGE_SHOP = 'manage_shop',
  MANAGE_SETTINGS = 'manage_settings',
  MANAGE_THEMES = 'manage_themes',
  
  // Gestion utilisateurs
  MANAGE_USERS = 'manage_users',
  CHANGE_ROLES = 'change_roles',
  BAN_USERS = 'ban_users',
  
  // Gestion contenu
  MANAGE_POSTS = 'manage_posts',
  DELETE_POSTS = 'delete_posts',
  MODERATE_COMMENTS = 'moderate_comments',
  DELETE_COMMENTS = 'delete_comments',
  
  // Gestion catégories et badges
  MANAGE_CATEGORIES = 'manage_categories',
  MANAGE_BADGES = 'manage_badges',
  
  // Actions de base
  CREATE_POSTS = 'create_posts',
  COMMENT = 'comment',
  REACT = 'react',
  VIEW_CONTENT = 'view_content',
}

// Permissions par rôle
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Toutes les permissions
    Permission.MANAGE_SHOP,
    Permission.MANAGE_SETTINGS,
    Permission.MANAGE_THEMES,
    Permission.MANAGE_USERS,
    Permission.CHANGE_ROLES,
    Permission.BAN_USERS,
    Permission.MANAGE_POSTS,
    Permission.DELETE_POSTS,
    Permission.MODERATE_COMMENTS,
    Permission.DELETE_COMMENTS,
    Permission.MANAGE_CATEGORIES,
    Permission.MANAGE_BADGES,
    Permission.CREATE_POSTS,
    Permission.COMMENT,
    Permission.REACT,
    Permission.VIEW_CONTENT,
  ],
  
  [UserRole.MODERATOR]: [
    // Modération uniquement
    Permission.MODERATE_COMMENTS,
    Permission.DELETE_COMMENTS,
    Permission.DELETE_POSTS, // Posts inappropriés
    Permission.CREATE_POSTS,
    Permission.COMMENT,
    Permission.REACT,
    Permission.VIEW_CONTENT,
  ],
  
  [UserRole.MEMBER]: [
    // Actions de base uniquement
    Permission.CREATE_POSTS,
    Permission.COMMENT,
    Permission.REACT,
    Permission.VIEW_CONTENT,
  ],
};

/**
 * Vérifie si un utilisateur a une permission spécifique
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) {
    // Si le rôle n'existe pas dans ROLE_PERMISSIONS (rôle personnalisé), retourner false
    return false;
  }
  return rolePermissions.includes(permission);
}

/**
 * Vérifie si un utilisateur peut effectuer plusieurs permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Vérifie si un utilisateur peut effectuer au moins une permission
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Règles de changement de rôles sécurisées
 */
export interface RoleChangeContext {
  actorId: string;
  actorRole: UserRole;
  targetId: string;
  targetRole: UserRole;
  newRole: UserRole;
  isTargetOwner: boolean;
  shopId: string;
}

export function canChangeRole(context: RoleChangeContext): { 
  allowed: boolean; 
  reason?: string;
} {
  const { actorId, actorRole, targetId, targetRole, newRole, isTargetOwner } = context;
  
  // Seuls les admins peuvent changer les rôles
  if (!hasPermission(actorRole, Permission.CHANGE_ROLES)) {
    return { 
      allowed: false, 
      reason: "Seuls les administrateurs peuvent modifier les rôles" 
    };
  }
  
  // Un utilisateur ne peut pas modifier son propre rôle
  if (actorId === targetId) {
    return { 
      allowed: false, 
      reason: "Vous ne pouvez pas modifier votre propre rôle" 
    };
  }
  
  // Le propriétaire de la boutique ne peut pas être modifié
  if (isTargetOwner) {
    return { 
      allowed: false, 
      reason: "Le propriétaire de la boutique ne peut pas être modifié" 
    };
  }
  
  // Un admin ne peut pas rétrograder un autre admin (sécurité)
  if (targetRole === UserRole.ADMIN && actorRole === UserRole.ADMIN) {
    return { 
      allowed: false, 
      reason: "Un administrateur ne peut pas modifier le rôle d'un autre administrateur" 
    };
  }
  
  // Validation du nouveau rôle
  if (!Object.values(UserRole).includes(newRole)) {
    return { 
      allowed: false, 
      reason: "Rôle invalide" 
    };
  }
  
  return { allowed: true };
}

/**
 * Obtient la liste des rôles qu'un utilisateur peut assigner
 */
export function getAssignableRoles(userRole: UserRole): UserRole[] {
  switch (userRole) {
    case UserRole.ADMIN:
      // Un admin peut assigner tous les rôles sauf admin (pour la sécurité)
      return [UserRole.MODERATOR, UserRole.MEMBER];
    
    case UserRole.MODERATOR:
    case UserRole.MEMBER:
      // Les modérateurs et membres ne peuvent rien assigner
      return [];
    
    default:
      return [];
  }
}

/**
 * Obtient le label français d'un rôle
 */
export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'Administrateur';
    case UserRole.MODERATOR:
      return 'Modérateur';
    case UserRole.MEMBER:
      return 'Membre';
    default:
      return role;
  }
}

/**
 * Obtient la couleur d'affichage d'un rôle
 */
export function getRoleColor(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'bg-red-100 text-red-800 border-red-200';
    case UserRole.MODERATOR:
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case UserRole.MEMBER:
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Obtient la couleur d'affichage d'un rôle personnalisé
 */
export function getCustomRoleColor(customRoleColor: string): string {
  // Conversion de couleur hexadécimale vers des classes CSS
  return `text-white border-gray-200`;
}

/**
 * Obtient le nom affiché d'un utilisateur (rôle de base + rôle personnalisé si présent)
 */
export function getUserDisplayRole(
  baseRole: UserRole,
  customRoleName?: string
): string {
  const baseLabel = getRoleLabel(baseRole);

  if (customRoleName) {
    return `${baseLabel} • ${customRoleName}`;
  }

  return baseLabel;
}

/**
 * Vérifie si un utilisateur avec un rôle personnalisé a une permission
 */
export function hasCustomRolePermission(
  customRolePermissions: string[],
  permission: Permission
): boolean {
  return customRolePermissions.includes(permission);
}

/**
 * Vérifie si un utilisateur a une permission (rôle de base + rôle personnalisé)
 */
export function hasUserPermission(
  baseRole: UserRole,
  customRolePermissions: string[] | null,
  permission: Permission
): boolean {
  // D'abord vérifier les permissions du rôle de base
  if (hasPermission(baseRole, permission)) {
    return true;
  }

  // Ensuite vérifier les permissions du rôle personnalisé si il existe
  if (customRolePermissions && customRolePermissions.length > 0) {
    return hasCustomRolePermission(customRolePermissions, permission);
  }

  return false;
}

/**
 * Obtient toutes les permissions d'un utilisateur (base + personnalisées)
 */
export function getAllUserPermissions(
  baseRole: UserRole,
  customRolePermissions: string[] | null
): Permission[] {
  const basePermissions = ROLE_PERMISSIONS[baseRole];

  if (!customRolePermissions || customRolePermissions.length === 0) {
    return basePermissions;
  }

  // Combiner les permissions de base avec les permissions personnalisées
  const allPermissions = new Set([
    ...basePermissions,
    ...customRolePermissions.filter(perm => Object.values(Permission).includes(perm as Permission))
  ]);

  return Array.from(allPermissions) as Permission[];
}

/**
 * Middleware de vérification des permissions pour les routes API
 */
export function requirePermissions(requiredPermissions: Permission[]) {
  return (userRole: UserRole): boolean => {
    return hasAllPermissions(userRole, requiredPermissions);
  };
}