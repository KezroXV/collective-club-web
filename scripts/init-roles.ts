/**
 * Script pour initialiser les rôles par défaut dans une boutique
 */

import { PrismaClient } from '@prisma/client';
import { ROLE_PERMISSIONS, UserRole } from '../lib/permissions';

const prisma = new PrismaClient();

async function initDefaultRoles() {
  try {
    // Récupérer la première boutique
    const shop = await prisma.shop.findFirst();

    if (!shop) {
      console.error('❌ Aucune boutique trouvée');
      return;
    }

    console.log(`📦 Initialisation des rôles pour la boutique: ${shop.shopDomain}`);

    // Vérifier si les rôles existent déjà
    const existingRoles = await prisma.role.findMany({
      where: {
        shopId: shop.id,
        isDefault: true
      }
    });

    if (existingRoles.length > 0) {
      console.log('✅ Les rôles par défaut existent déjà:', existingRoles.map(r => r.name));
      return;
    }

    // Créer les rôles par défaut
    const defaultRoles = [
      {
        name: "ADMIN",
        displayName: "Administrateur",
        color: "#EF4444", // Rouge
        permissions: ROLE_PERMISSIONS[UserRole.ADMIN],
        isDefault: true,
        shopId: shop.id
      },
      {
        name: "MODERATOR",
        displayName: "Modérateur",
        color: "#3B82F6", // Bleu
        permissions: ROLE_PERMISSIONS[UserRole.MODERATOR],
        isDefault: true,
        shopId: shop.id
      },
      {
        name: "MEMBER",
        displayName: "Membre",
        color: "#10B981", // Vert
        permissions: ROLE_PERMISSIONS[UserRole.MEMBER],
        isDefault: true,
        shopId: shop.id
      }
    ];

    await prisma.role.createMany({
      data: defaultRoles
    });

    console.log('✅ Rôles par défaut créés avec succès !');

    // Afficher les rôles créés
    const createdRoles = await prisma.role.findMany({
      where: {
        shopId: shop.id,
        isDefault: true
      }
    });

    createdRoles.forEach(role => {
      console.log(`📋 ${role.displayName} (${role.name}) - ${role.color}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des rôles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initDefaultRoles();