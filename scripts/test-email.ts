/**
 * 🧪 Script de Test du Système d'Emailing
 *
 * Ce script teste les deux fonctions principales d'envoi d'emails :
 * 1. sendNotificationEmail() - Pour les notifications simples
 * 2. sendGDPRDataEmail() - Pour les exports RGPD
 *
 * Usage:
 *   npm run test:email
 *
 * Configuration:
 *   Assurez-vous que les variables EMAIL_* sont définies dans .env
 */

// Charger les variables d'environnement depuis .env
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });

import { sendGDPRDataEmail, sendNotificationEmail } from '../lib/email';
import type { UserDataExport } from '../lib/gdpr';

/**
 * Génère des données utilisateur fictives pour le test RGPD
 */
function generateMockUserData(): UserDataExport {
  return {
    metadata: {
      exportDate: new Date().toISOString(),
      dataSubject: 'test@example.com',
      shopDomain: 'test-shop.myshopify.com',
      format: 'json',
    },
    personalInformation: {
      userId: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.jpg',
      createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
      updatedAt: new Date('2024-01-15T10:00:00Z').toISOString(),
      role: 'MEMBER',
      isShopOwner: false,
      isBanned: false,
      bannedAt: null,
    },
    accounts: [
      {
        provider: 'google',
        providerAccountId: 'google-123456',
        createdDate: new Date('2024-01-15T10:00:00Z').toISOString(),
      },
    ],
    posts: [
      {
        id: 'post-1',
        title: 'Mon premier post de test',
        content: 'Ceci est un contenu de test pour vérifier l\'export RGPD.',
        slug: 'mon-premier-post-de-test',
        imageUrl: null,
        isPinned: false,
        status: 'PUBLISHED',
        categoryName: 'Général',
        createdAt: new Date('2024-01-16T14:30:00Z').toISOString(),
        updatedAt: new Date('2024-01-16T14:30:00Z').toISOString(),
        reactionsCount: 1,
        commentsCount: 1,
      },
    ],
    comments: [
      {
        id: 'comment-1',
        content: 'Super post!',
        postTitle: 'Mon premier post de test',
        parentCommentId: null,
        createdAt: new Date('2024-01-17T09:15:00Z').toISOString(),
        updatedAt: new Date('2024-01-17T09:15:00Z').toISOString(),
        reactionsCount: 0,
      },
    ],
    reactions: [
      {
        id: 'reaction-1',
        type: 'LIKE',
        targetType: 'post',
        targetId: 'post-1',
        createdAt: new Date('2024-01-18T11:20:00Z').toISOString(),
      },
    ],
    pollVotes: [],
    socialConnections: {
      following: [],
      followers: [],
    },
    gamification: {
      totalPoints: 150,
      badges: [],
      pointTransactions: [
        {
          points: 50,
          action: 'POST_CREATED',
          description: 'Création d\'un post',
          createdAt: new Date('2024-01-16T14:30:00Z').toISOString(),
        },
        {
          points: 10,
          action: 'COMMENT_CREATED',
          description: 'Ajout d\'un commentaire',
          createdAt: new Date('2024-01-17T09:15:00Z').toISOString(),
        },
      ],
    },
    customization: null,
    onboarding: null,
  };
}

/**
 * Test 1 : Envoi d'une notification simple
 */
async function testSimpleNotification() {
  console.log('\n📧 TEST 1: Notification Simple');
  console.log('━'.repeat(50));

  // Utiliser l'email de test depuis les variables d'environnement ou un email par défaut
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';

  const result = await sendNotificationEmail(
    testEmail,
    'Email de Test - Notification',
    `Bonjour,

Ceci est un email de test du système de notification de Collective Club.

Si vous recevez cet email, cela signifie que le système d'emailing fonctionne correctement!

Détails du test:
- Provider: ${process.env.EMAIL_PROVIDER || 'console'}
- Date: ${new Date().toISOString()}
- From: ${process.env.EMAIL_FROM || 'default'}

Cordialement,
L'équipe Collective Club`
  );

  if (result.success) {
    console.log('✅ Notification envoyée avec succès!');
  } else {
    console.error('❌ Échec de l\'envoi de la notification:', result.error);
  }

  return result;
}

/**
 * Test 2 : Envoi d'un export RGPD complet
 */
async function testGDPREmail() {
  console.log('\n📧 TEST 2: Email RGPD avec Données');
  console.log('━'.repeat(50));

  const mockUserData = generateMockUserData();

  // Générer le rapport texte
  const textReport = `Bonjour,

Voici l'export complet de vos données personnelles collectées sur notre plateforme.

═══════════════════════════════════════════════════
         EXPORT DE DONNÉES PERSONNELLES (RGPD)
═══════════════════════════════════════════════════

📅 Date d'export: ${mockUserData.metadata.exportDate}
🏪 Boutique: ${mockUserData.metadata.shopDomain}
👤 Email: ${mockUserData.personalInformation.email}

───────────────────────────────────────────────────
📝 INFORMATIONS PERSONNELLES
───────────────────────────────────────────────────

Nom: ${mockUserData.personalInformation.name}
Email: ${mockUserData.personalInformation.email}
Rôle: ${mockUserData.personalInformation.role}
Date de création: ${mockUserData.personalInformation.createdAt}

───────────────────────────────────────────────────
📊 STATISTIQUES
───────────────────────────────────────────────────

Posts créés: ${mockUserData.posts.length}
Commentaires: ${mockUserData.comments.length}
Réactions: ${mockUserData.reactions.length}
Points totaux: ${mockUserData.gamification.totalPoints}

───────────────────────────────────────────────────
📎 PIÈCE JOINTE
───────────────────────────────────────────────────

Vous trouverez ci-joint un fichier JSON contenant l'intégralité
de vos données dans un format structuré et lisible par machine.

───────────────────────────────────────────────────

Conformément au RGPD, vous disposez des droits suivants:
• Droit d'accès (Art. 15)
• Droit de rectification (Art. 16)
• Droit à l'effacement (Art. 17)
• Droit à la limitation du traitement (Art. 18)
• Droit à la portabilité (Art. 20)

Pour exercer ces droits, contactez-nous.

Cordialement,
L'équipe ${mockUserData.metadata.shopDomain}`;

  // Générer le rapport JSON
  const jsonReport = JSON.stringify(mockUserData, null, 2);

  // Utiliser l'email de test depuis les variables d'environnement ou un email par défaut
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';

  const result = await sendGDPRDataEmail(
    testEmail,
    mockUserData,
    textReport,
    jsonReport
  );

  if (result.success) {
    console.log('✅ Email RGPD envoyé avec succès!');
    console.log(`   - Taille du JSON: ${(jsonReport.length / 1024).toFixed(2)} KB`);
    console.log(`   - Nombre de posts: ${mockUserData.posts.length}`);
    console.log(`   - Nombre de commentaires: ${mockUserData.comments.length}`);
  } else {
    console.error('❌ Échec de l\'envoi de l\'email RGPD:', result.error);
  }

  return result;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  🧪 TEST DU SYSTÈME D\'EMAILING - COLLECTIVE CLUB ║');
  console.log('╚═══════════════════════════════════════════════════╝');

  const testEmail = process.env.TEST_EMAIL || 'test@example.com';

  console.log('\n📋 Configuration actuelle:');
  console.log(`   - Provider: ${process.env.EMAIL_PROVIDER || 'console (default)'}`);
  console.log(`   - From: ${process.env.EMAIL_FROM || 'noreply@collectiveclub.com (default)'}`);
  console.log(`   - API Key configurée: ${process.env.EMAIL_API_KEY ? 'Oui ✅' : 'Non ❌'}`);
  console.log(`   - Email de test: ${testEmail}`);

  if (process.env.EMAIL_PROVIDER === 'console') {
    console.log('\n⚠️  MODE CONSOLE: Les emails seront affichés dans la console et sauvegardés dans temp/gdpr-exports/');
  } else if (process.env.EMAIL_PROVIDER === 'resend') {
    console.log(`\n📨 MODE RESEND: Les emails seront envoyés à ${testEmail}`);
    console.log('   Note: Sans domaine vérifié, Resend limite les tests à votre propre email.');
    console.log('   Pour envoyer à d\'autres destinataires, vérifiez un domaine sur resend.com/domains');
  }

  // Exécuter les tests
  const results = {
    notification: await testSimpleNotification(),
    gdpr: await testGDPREmail(),
  };

  // Résumé final
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║              RÉSUMÉ DES TESTS                     ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  const totalTests = 2;
  const successCount = [results.notification.success, results.gdpr.success].filter(Boolean).length;

  console.log(`Tests réussis: ${successCount}/${totalTests}`);
  console.log(`Test notification: ${results.notification.success ? '✅' : '❌'}`);
  console.log(`Test RGPD: ${results.gdpr.success ? '✅' : '❌'}`);

  if (successCount === totalTests) {
    console.log('\n🎉 Tous les tests sont passés avec succès!');
  } else {
    console.log('\n⚠️  Certains tests ont échoué. Vérifiez la configuration EMAIL_* dans .env');
  }

  console.log('\n━'.repeat(50));
  console.log('✨ Tests terminés\n');

  process.exit(successCount === totalTests ? 0 : 1);
}

// Exécuter le script
main().catch((error) => {
  console.error('\n💥 Erreur fatale:', error);
  process.exit(1);
});
