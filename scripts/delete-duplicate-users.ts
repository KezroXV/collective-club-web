/**
 * Script pour supprimer les utilisateurs dupliqués
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteDuplicateUsers() {
  try {
    console.log('=== SUPPRESSION DES DOUBLONS ===');

    // IDs à supprimer (boutique main)
    const idsToDelete = [
      'cmg16futx000mu32oy53g9bnd', // idrisbenabdallah28@gmail.com (main)
      'cmg16j0b8000uu32o4b57gftu'  // kezro10@gmail.com (main)
    ];

    console.log('🗑️  Suppression des utilisateurs dupliqués...');

    for (const userId of idsToDelete) {
      const user = await prisma.user.findFirst({
        where: { id: userId },
        include: { shop: true }
      });

      if (user) {
        console.log(`Suppression: ${user.email} (${user.shop?.shopDomain})`);

        // Supprimer l'utilisateur et toutes ses données associées
        await prisma.user.delete({
          where: { id: userId }
        });

        console.log(`✅ Supprimé: ${user.email}`);
      } else {
        console.log(`⚠️  Utilisateur ${userId} non trouvé`);
      }
    }

    console.log('\n=== VÉRIFICATION APRÈS NETTOYAGE ===');

    const remainingUsers = await prisma.user.findMany({
      include: { shop: true },
      orderBy: { email: 'asc' }
    });

    console.log(`📊 Utilisateurs restants: ${remainingUsers.length}`);

    remainingUsers.forEach(user => {
      console.log(`✅ ${user.email} - ${user.role} - ${user.shop?.shopDomain} (${user.id})`);
    });

    // Vérifier les doublons restants
    const emailGroups = new Map<string, typeof remainingUsers>();
    remainingUsers.forEach(user => {
      if (!emailGroups.has(user.email)) {
        emailGroups.set(user.email, []);
      }
      emailGroups.get(user.email)!.push(user);
    });

    const duplicates = Array.from(emailGroups.entries()).filter(([_, users]) => users.length > 1);

    if (duplicates.length === 0) {
      console.log('🎉 Plus de doublons détectés !');
    } else {
      console.log(`⚠️  ${duplicates.length} emails ont encore des doublons`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteDuplicateUsers();