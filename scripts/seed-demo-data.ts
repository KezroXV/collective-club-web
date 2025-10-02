import { PrismaClient, PointAction } from '@prisma/client';
import { awardPoints } from '../lib/points';

const prisma = new PrismaClient();

const SHOP_ID = 'cmeycnv0e0000u3w82k76qv0l';

async function createDemoUsers() {
  const users = [
    {
      email: 'alice.martin@example.com',
      name: 'Alice Martin',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b06c?w=150&h=150&fit=crop&crop=face',
      role: 'MEMBER'
    },
    {
      email: 'bob.dubois@example.com', 
      name: 'Bob Dubois',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      role: 'MEMBER'
    },
    {
      email: 'clara.bernard@example.com',
      name: 'Clara Bernard', 
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      role: 'MODERATOR'
    },
    {
      email: 'david.rouge@example.com',
      name: 'David Rouge',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 
      role: 'MEMBER'
    },
    {
      email: 'emma.vert@example.com',
      name: 'Emma Vert',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      role: 'MEMBER'
    },
    {
      email: 'felix.noir@example.com', 
      name: 'Félix Noir',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      role: 'MEMBER'
    }
  ];

  const createdUsers = [];
  
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: {
        shopId_email: {
          shopId: SHOP_ID,
          email: userData.email,
        }
      },
      update: {},
      create: {
        ...userData,
        shopId: SHOP_ID,
      }
    });
    createdUsers.push(user);
    console.log(`✅ Utilisateur créé: ${user.name}`);
  }

  return createdUsers;
}

async function createDemoPosts(users: any[]) {
  const postsData = [
    {
      title: "🌟 Mes conseils pour débuter en e-commerce",
      content: `Salut tout le monde ! Je partage mes 5 conseils essentiels pour se lancer dans le e-commerce :

1. **Choisir sa niche** - Trouvez un marché pas trop concurrentiel mais avec de la demande
2. **Étudier sa concurrence** - Analysez ce qui marche et ce qui ne marche pas
3. **Soigner son branding** - Votre image de marque fait toute la différence
4. **Optimiser pour mobile** - 70% des achats se font sur mobile aujourd'hui
5. **Investir dans le service client** - C'est ce qui fidélise vos clients

Qu'est-ce que vous en pensez ? Vous avez d'autres conseils à ajouter ?`,
      imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
      authorIndex: 0
    },
    {
      title: "🚀 Comment j'ai augmenté mes ventes de 300% en 6 mois",
      content: `Hey la communauté ! Je voulais partager mon parcours car ça pourrait aider d'autres personnes.

Il y a 6 mois, je galérais avec ma boutique Shopify. Chiffre d'affaires stagnant, peu de trafic, conversion faible...

**Voici ce qui a tout changé :**

• **Marketing de contenu** → J'ai créé un blog et des vidéos TikTok
• **Email marketing** → Séquences automatisées pour récupérer les paniers abandonnés  
• **Optimisation UX** → Refonte complète de mon site pour le mobile
• **Partenariats influenceurs** → Collaborations avec des micro-influenceurs

**Résultats :**
- Traffic : +450%
- Conversion : 1.2% → 3.8%  
- Panier moyen : +85%

Je peux détailler chaque stratégie si ça vous intéresse ! 💪`,
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop",
      authorIndex: 1
    },
    {
      title: "📱 Apps Shopify indispensables en 2024",
      content: `Salut les e-commerçants ! En tant que modératrice, je vois souvent les mêmes questions sur les apps Shopify. Voici ma sélection des indispensables :

**MARKETING :**
• Klaviyo - Email marketing (gratuit jusqu'à 250 contacts)
• Loox - Avis clients avec photos
• PushOwl - Notifications push

**CONVERSION :**  
• Urgency Bear - Countdown timers
• Bold Upsell - Ventes additionnelles
• Lucky Orange - Heatmaps et enregistrements

**GESTION :**
• Oberlo - Dropshipping (si applicable)
• Recharge - Abonnements récurrents
• ShipStation - Gestion expéditions

**SUPPORT CLIENT :**
• Gorgias - Helpdesk unifié
• Tidio - Chat en direct

Vous utilisez lesquelles ? Des recommandations à ajouter ? 🤔`,
      authorIndex: 2
    },
    {
      title: "💡 Idée business : produits éco-responsables",
      content: `Hello ! Je réfléchis à me lancer dans les produits éco-responsables. Le marché explose littéralement !

**Tendances que j'observe :**
- Cosmétiques solides (+200% de recherches)
- Emballages réutilisables 
- Mode seconde main premium
- Produits ménagers DIY

**Mes questions :**
1. Vous pensez que c'est un effet de mode ou une vraie transformation ?
2. Comment communiquer sur l'aspect éco sans faire du greenwashing ?
3. Des fournisseurs à recommander ?

Je mise tout sur l'authenticité et la transparence. Vos retours sont super précieux ! 🌱`,
      imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=400&fit=crop",
      authorIndex: 3
    },
    {
      title: "🎯 Stratégie Facebook Ads qui cartonne",
      content: `Les amis, j'ai enfin trouvé LA formule pour mes campagnes Facebook Ads ! 🔥

**Ma stratégie gagnante :**

**Phase 1 - Test audiences (Budget: 20€/jour)**
- Créer 5 adsets avec des audiences différentes
- Laisser tourner 3-4 jours minimum
- Garder seulement les adsets rentables

**Phase 2 - Scale horizontal** 
- Dupliquer les adsets gagnants
- Tester d'autres audiences similaires
- Budget : 50€/jour

**Phase 3 - Scale vertical**
- Augmenter le budget des meilleures audiences
- +20% tous les 2 jours max
- Objectif : ROAS > 3

**Résultats actuels :**
- ROAS moyen : 4.2
- CPM en baisse de 30%
- Taux de conversion : 3.1%

Qui veut que je partage mes audiences qui fonctionnent ? 👀`,
      authorIndex: 4
    },
    {
      title: "🛠️ Outils gratuits pour créer du contenu",
      content: `Yo ! Comme promis, voici ma liste d'outils gratuits pour créer du contenu de qualité pro :

**DESIGN :**
• Canva - Templates partout
• Figma - Design avancé (gratuit pour usage perso)  
• Unsplash - Photos HD gratuites

**VIDÉO :**
• CapCut - Montage mobile ultra simple
• DaVinci Resolve - Montage pro gratuit
• Loom - Vidéos écran/webcam

**PRODUCTIVITÉ :**
• Notion - Organisation tout-en-un
• Calendly - Prise de RDV automatisée
• Buffer - Programmation réseaux sociaux (plan gratuit)

**ANALYSE :**
• Google Analytics - Obligatoire !
• Hotjar - Comportement utilisateurs
• Google Search Console - SEO

**BONUS :** Utilisez ChatGPT pour vos textes et Midjourney pour vos visuels créatifs !

Vous en utilisez d'autres ? Share ! 🚀`,
      imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=400&fit=crop",
      authorIndex: 5
    }
  ];

  const createdPosts = [];

  for (const postData of postsData) {
    const post = await prisma.post.create({
      data: {
        title: postData.title,
        content: postData.content,
        imageUrl: postData.imageUrl,
        authorId: users[postData.authorIndex].id,
        shopId: SHOP_ID,
        status: 'PUBLISHED'
      }
    });

    createdPosts.push(post);
    
    // Attribuer des points pour la création du post
    await awardPoints(users[postData.authorIndex].id, SHOP_ID, PointAction.POST_CREATED);
    
    console.log(`✅ Post créé: ${post.title}`);
  }

  return createdPosts;
}

async function createComments(users: any[], posts: any[]) {
  const commentsData = [
    // Commentaires sur le premier post (conseils e-commerce)
    {
      content: "Excellent conseil ! Je rajouterais : ne pas négliger l'importance des avis clients. C'est ce qui convertit le plus !",
      authorIndex: 1,
      postIndex: 0
    },
    {
      content: "Merci pour ces tips ! Je débute et j'avoue que le point 3 sur le branding me pose problème. Des ressources à conseiller ?",
      authorIndex: 3,
      postIndex: 0
    },
    {
      content: "💯 d'accord ! En tant que modératrice, je vois trop de gens qui négligent le mobile. C'est l'erreur n°1",
      authorIndex: 2,
      postIndex: 0
    },

    // Commentaires sur le post des ventes +300%
    {
      content: "Waouh ces résultats ! 🔥 Peux-tu détailler la partie email marketing ? C'est mon point faible",
      authorIndex: 4,
      postIndex: 1
    },
    {
      content: "Impressionnant ! Combien tu as investi en pub au total pour arriver à ces résultats ?",
      authorIndex: 0,
      postIndex: 1
    },
    {
      content: "Les micro-influenceurs c'est le secret ! J'ai eu les mêmes résultats. Quelle plateforme tu utilises pour les trouver ?",
      authorIndex: 5,
      postIndex: 1
    },

    // Commentaires sur les apps Shopify
    {
      content: "Super liste Clara ! J'ajouterais Judge.me pour les avis, leur version gratuite est très complète",
      authorIndex: 1,
      postIndex: 2
    },
    {
      content: "Klaviyo c'est la vie ! Mais attention à bien configurer la RGPD, j'ai eu des problèmes au début 😅",
      authorIndex: 4,
      postIndex: 2
    },

    // Commentaires sur l'éco-responsable
    {
      content: "L'éco c'est l'avenir ! Mais fais attention aux coûts, les matières premières éco sont plus chères",
      authorIndex: 0,
      postIndex: 3
    },
    {
      content: "Excellente niche ! Pour la communication, mise sur la transparence totale : origine, processus, impact réel",
      authorIndex: 2,
      postIndex: 3
    },

    // Commentaires sur Facebook Ads
    {
      content: "Merci Emma ! Ta stratégie ressemble à la mienne. Tu utilises des lookalike ou plutôt des intérêts ?",
      authorIndex: 1,
      postIndex: 4
    },
    {
      content: "ROAS de 4.2 c'est énorme ! 🎯 Tu peux partager tes meilleures audiences stp ?",
      authorIndex: 3,
      postIndex: 4
    },

    // Commentaires sur les outils gratuits
    {
      content: "Liste au top ! J'ajouterais GIMP pour la retouche photo, c'est gratuit et très puissant",
      authorIndex: 2,
      postIndex: 5
    },
    {
      content: "CapCut c'est vraiment génial ! Je fais tous mes contenus TikTok avec. Simple et efficace 📱",
      authorIndex: 4,
      postIndex: 5
    }
  ];

  for (const commentData of commentsData) {
    const comment = await prisma.comment.create({
      data: {
        content: commentData.content,
        authorId: users[commentData.authorIndex].id,
        postId: posts[commentData.postIndex].id,
        shopId: SHOP_ID
      }
    });

    // Attribuer des points pour le commentaire
    await awardPoints(users[commentData.authorIndex].id, SHOP_ID, PointAction.COMMENT_CREATED);
    
    console.log(`✅ Commentaire ajouté par ${users[commentData.authorIndex].name}`);
  }
}

async function createFollowRelationships(users: any[]) {
  const followRelationships = [
    // Alice suit Bob, Clara et Emma
    { followerIndex: 0, followingIndex: 1 },
    { followerIndex: 0, followingIndex: 2 },
    { followerIndex: 0, followingIndex: 4 },
    
    // Bob suit Alice, David et Félix
    { followerIndex: 1, followingIndex: 0 },
    { followerIndex: 1, followingIndex: 3 },
    { followerIndex: 1, followingIndex: 5 },
    
    // Clara (modératrice) suit tout le monde
    { followerIndex: 2, followingIndex: 0 },
    { followerIndex: 2, followingIndex: 1 },
    { followerIndex: 2, followingIndex: 3 },
    { followerIndex: 2, followingIndex: 4 },
    { followerIndex: 2, followingIndex: 5 },
    
    // David suit Alice et Emma
    { followerIndex: 3, followingIndex: 0 },
    { followerIndex: 3, followingIndex: 4 },
    
    // Emma suit Bob et Clara
    { followerIndex: 4, followingIndex: 1 },
    { followerIndex: 4, followingIndex: 2 },
    
    // Félix suit Alice, Bob et Clara
    { followerIndex: 5, followingIndex: 0 },
    { followerIndex: 5, followingIndex: 1 },
    { followerIndex: 5, followingIndex: 2 }
  ];

  for (const rel of followRelationships) {
    await prisma.follow.create({
      data: {
        followerId: users[rel.followerIndex].id,
        followingId: users[rel.followingIndex].id,
        shopId: SHOP_ID
      }
    });
    
    console.log(`✅ ${users[rel.followerIndex].name} suit maintenant ${users[rel.followingIndex].name}`);
  }
}

async function createReactions(users: any[], posts: any[]) {
  // Ajouter des réactions variées sur les posts
  const reactions = [
    { userIndex: 1, postIndex: 0, type: 'LIKE' },
    { userIndex: 2, postIndex: 0, type: 'APPLAUSE' },
    { userIndex: 3, postIndex: 0, type: 'LOVE' },
    { userIndex: 4, postIndex: 0, type: 'LIKE' },
    
    { userIndex: 0, postIndex: 1, type: 'APPLAUSE' },
    { userIndex: 2, postIndex: 1, type: 'WOW' },
    { userIndex: 4, postIndex: 1, type: 'LIKE' },
    { userIndex: 5, postIndex: 1, type: 'LOVE' },
    
    { userIndex: 0, postIndex: 2, type: 'LIKE' },
    { userIndex: 1, postIndex: 2, type: 'APPLAUSE' },
    { userIndex: 3, postIndex: 2, type: 'LIKE' },
    
    { userIndex: 0, postIndex: 3, type: 'LOVE' },
    { userIndex: 2, postIndex: 3, type: 'APPLAUSE' },
    { userIndex: 5, postIndex: 3, type: 'LIKE' },
    
    { userIndex: 0, postIndex: 4, type: 'WOW' },
    { userIndex: 1, postIndex: 4, type: 'APPLAUSE' },
    { userIndex: 3, postIndex: 4, type: 'LOVE' },
    
    { userIndex: 2, postIndex: 5, type: 'LIKE' },
    { userIndex: 4, postIndex: 5, type: 'APPLAUSE' }
  ];

  for (const reactionData of reactions) {
    await prisma.reaction.create({
      data: {
        type: reactionData.type as any,
        userId: users[reactionData.userIndex].id,
        postId: posts[reactionData.postIndex].id,
        shopId: SHOP_ID
      }
    });

    // Attribuer des points à l'auteur du post pour la réaction reçue
    await awardPoints(posts[reactionData.postIndex].authorId, SHOP_ID, PointAction.REACTION_RECEIVED);
  }
  
  console.log(`✅ ${reactions.length} réactions créées`);
}

async function addExtraPointsAndUnlockBadges(users: any[]) {
  // Donner des points bonus à certains utilisateurs pour débloquer des badges
  
  // Alice - Expert (500+ points)
  await awardPoints(users[0].id, SHOP_ID, PointAction.DAILY_LOGIN, 50); // Connexions quotidiennes
  await awardPoints(users[0].id, SHOP_ID, PointAction.POST_CREATED, 30); // Posts supplémentaires
  
  // Bob - Intermédiaire (200+ points) 
  await awardPoints(users[1].id, SHOP_ID, PointAction.DAILY_LOGIN, 30);
  await awardPoints(users[1].id, SHOP_ID, PointAction.COMMENT_CREATED, 20);
  
  // Clara - Expert (elle est modératrice)
  await awardPoints(users[2].id, SHOP_ID, PointAction.DAILY_LOGIN, 40);
  await awardPoints(users[2].id, SHOP_ID, PointAction.POST_CREATED, 35);
  
  // Emma - Intermédiaire 
  await awardPoints(users[4].id, SHOP_ID, PointAction.DAILY_LOGIN, 25);
  await awardPoints(users[4].id, SHOP_ID, PointAction.COMMENT_CREATED, 15);
  
  console.log('✅ Points bonus attribués');
}

async function main() {
  console.log('🚀 Création des données de démonstration...\n');
  
  try {
    console.log('👥 Création des utilisateurs...');
    const users = await createDemoUsers();
    
    console.log('\n📝 Création des posts...');
    const posts = await createDemoPosts(users);
    
    console.log('\n💬 Ajout des commentaires...');
    await createComments(users, posts);
    
    console.log('\n👥 Création des relations de suivi...');
    await createFollowRelationships(users);
    
    console.log('\n❤️ Ajout des réactions...');
    await createReactions(users, posts);
    
    console.log('\n🏆 Attribution des points bonus...');
    await addExtraPointsAndUnlockBadges(users);
    
    console.log('\n✅ Données de démonstration créées avec succès !');
    console.log(`
🎉 RÉCAPITULATIF :
• ${users.length} utilisateurs créés
• ${posts.length} posts avec contenus réalistes  
• Commentaires et interactions
• Réactions sur tous les posts
• Relations de suivi entre utilisateurs
• Points et badges distribués

🔍 Tu peux maintenant tester :
• Système de follow/unfollow
• Attribution automatique des points
• Déblocage des badges selon les points
• Interface utilisateur complète

Shop ID: ${SHOP_ID}
    `);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des données:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();