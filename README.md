# Collective Club Web

**Plateforme de forum communautaire multi-tenant pour Shopify**

Une application Next.js moderne qui permet à chaque boutique Shopify de créer et gérer sa propre communauté avec isolation complète des données, gamification, et conformité RGPD.

![Next.js](https://img.shields.io/badge/Next.js-15.4.7-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.14.0-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)

---

## Table des matières

- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Scripts CLI](#scripts-cli)
- [API Routes](#api-routes)
- [Déploiement](#déploiement)
- [Documentation](#documentation)

---

## Présentation

Collective Club Web est une **solution SaaS multi-tenant** qui transforme chaque boutique Shopify en une communauté engageante. Chaque shop dispose de :

- ✅ **Isolation stricte des données** - Aucun accès cross-tenant possible
- 🎨 **Interface personnalisable** - Couleurs, polices, images
- 🏆 **Système de gamification** - Points, badges, classements
- 🔐 **Double authentification** - Google OAuth + Shopify Session Tokens
- 📧 **Conformité RGPD** - Export automatique et webhooks Shopify
- ⚡ **Performance optimale** - < 2s même avec 1000+ posts

---

## Fonctionnalités

### 🏪 Multi-Tenant & Isolation

- **Isolation par boutique** : Chaque shop a ses propres utilisateurs, posts, catégories
- **Création automatique** : Premier utilisateur devient admin avec `isShopOwner: true`
- **Données par défaut** : Rôles, catégories et badges créés automatiquement
- **Validation stricte** : Format Shopify obligatoire (`*.myshopify.com`)

### 💬 Forum Communautaire

- **Posts** : Titre, contenu riche, images, épinglage (max 3), statuts (draft/published/archived)
- **Commentaires imbriqués** : Système de replies avec threads
- **Réactions emoji** : 5 types (LIKE, LOVE, LAUGH, WOW, APPLAUSE) sur posts et commentaires
- **Sondages** : Intégrés aux posts avec jusqu'à 4 options
- **Catégories** : Personnalisables avec couleurs et ordre
- **Slugs SEO** : URLs optimisées avec redirections 301 automatiques

### 🔐 Authentification Hybride

**Google OAuth (NextAuth)** :
- Connexion via compte Google
- Sessions JWT (30 jours)
- Support multi-boutiques
- Credentials email/password avec bcrypt

**Shopify Session Tokens** :
- Pour apps Shopify embedded
- Validation JWT automatique
- Création auto du shop et utilisateur
- Email générique : `shopify-user@{shop-domain}`

### 🎯 Système de Permissions

**3 rôles de base** :
- **ADMIN** : Toutes permissions (gestion shop, users, contenu)
- **MODERATOR** : Modération contenu uniquement
- **MEMBER** : Actions basiques (posts, commentaires, réactions)

**Rôles personnalisés** :
- Créer des rôles avec permissions spécifiques
- Permissions granulaires (MANAGE_SHOP, BAN_USERS, DELETE_POSTS, etc.)
- Règles de protection (shop owner, admin-to-admin)

### 🏆 Gamification

**Points automatiques** :
- Post créé : +10 points
- Commentaire : +5 points
- Réaction reçue : +2 points
- Connexion quotidienne : +1 point

**Badges** :
- Badges par défaut : Nouveau (0pts), Novice (50pts), Intermédiaire (200pts), Expert (500pts)
- Badges personnalisés par shop
- Débloquage automatique selon seuils
- Historique des transactions

### 👥 Fonctionnalités Sociales

- **Follow System** : Suivre d'autres utilisateurs avec compteurs
- **Profils utilisateurs** : Avatar, statistiques (posts, commentaires, points, badges)
- **Onboarding** : Tâches d'introduction avec progression trackée

### 📧 Conformité RGPD

**Export de données** :
- Format JSON complet + rapport texte
- Données personnelles, posts, commentaires, réactions, votes, points, badges
- Envoi par email avec pièce jointe

**Webhooks Shopify** :
- `customers/data_request` : Export automatique
- `customers/redact` : Suppression utilisateur
- `shop/redact` : Suppression complète du shop

**Providers email supportés** :
- `console` (développement)
- `resend` (production recommandé - 3000 emails/mois gratuits)
- `sendgrid`
- `webhook` (personnalisé)

### 🎨 Personnalisation

- Couleurs (posts, bordures, fond, texte)
- Polices personnalisées
- Images de bannière, logo, couverture
- Paramètres par utilisateur par shop

### 🔍 SEO Optimisé

- **Slugs SEO-friendly** : Auto-générés depuis les titres
- **Redirections 301** : Anciennes URLs vers slugs
- **Open Graph + Twitter Cards** : Métadonnées complètes
- **Sitemap dynamique** : Posts publiés + pages principales
- **Descriptions optimisées** : Tronquées à 160 caractères

---

## Architecture

### Stack Technique

**Frontend** :
- Next.js 15.4.7 (App Router + Server Components + Turbopack)
- React 19.1.0
- TypeScript 5
- Tailwind CSS 4
- Radix UI (composants accessibles)

**Backend** :
- Next.js API Routes
- Prisma 6.14.0 (ORM)
- PostgreSQL (Neon/Supabase compatible)
- NextAuth 4.24.11

**Services externes** :
- Shopify App Bridge 3.7.10
- Cloudinary (images)
- Resend/SendGrid (emails)

### Structure du Projet

```
collective-club-web/
├── app/                          # Next.js 15 App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # NextAuth + Shopify auth
│   │   ├── posts/                # CRUD posts
│   │   ├── comments/             # CRUD commentaires
│   │   ├── users/                # Gestion utilisateurs
│   │   ├── categories/           # Gestion catégories
│   │   ├── badges/               # Gestion badges
│   │   ├── roles/                # Rôles personnalisés
│   │   ├── webhooks/             # Webhooks RGPD Shopify
│   │   └── ...
│   ├── community/                # Pages forum
│   ├── dashboard/                # Dashboard admin
│   ├── profile/                  # Profils utilisateurs
│   └── ...
│
├── components/                   # Composants React
│   ├── ui/                       # Composants UI de base (Radix)
│   ├── PostCard.tsx              # Carte post
│   ├── CreatePostModal.tsx       # Création post
│   ├── CategoryFilter.tsx        # Filtres catégories
│   ├── BadgeGrid.tsx             # Affichage badges
│   └── ...
│
├── lib/                          # Utilitaires & Core Logic
│   ├── auth.ts                   # Configuration NextAuth
│   ├── hybridAuth.ts             # Auth hybride (Google + Shopify)
│   ├── shopIsolation.ts          # Isolation multi-tenant
│   ├── permissions.ts            # Système de permissions
│   ├── points.ts                 # Système de points
│   ├── seo.ts                    # Utilitaires SEO
│   ├── gdpr.ts                   # Conformité RGPD
│   ├── email.ts                  # Système d'emails
│   ├── shopifySessionToken.ts    # Validation tokens Shopify
│   └── monitoring.ts             # Monitoring multi-tenant
│
├── prisma/
│   ├── schema.prisma             # Schéma base de données
│   └── seed.ts                   # Seed données initiales
│
├── scripts/                      # Scripts CLI
│   ├── ensure-admin.ts           # Gestion admins
│   ├── data-recovery.ts          # Backup/restore
│   ├── test-email.ts             # Tests emails
│   └── test-session-tokens.ts    # Tests tokens Shopify
│
├── docs/                         # Documentation
│   ├── PRODUCTION_DEPLOYMENT.md
│   ├── EMAIL_SETUP.md
│   ├── GDPR_COMPLIANCE.md
│   ├── SHOPIFY_SESSION_TOKENS.md
│   └── ...
│
└── CLAUDE.md                     # Instructions Claude Code
```

### Système Multi-Tenant

**Isolation stricte par `shopId`** :

```typescript
// Extraction du shopId (lib/shopIsolation.ts)
const { shopId } = await getShopContext(request);

// TOUTES les requêtes filtrent par shopId
const posts = await prisma.post.findMany({
  where: { shopId }, // ✅ OBLIGATOIRE
});
```

**Contraintes DB** :
- `@@unique([shopId, email])` sur User
- `@@unique([shopId, name])` sur Category, Badge, Role
- `@@unique([shopId, slug])` sur Post
- Index sur `shopId` pour performance

**Navigation** :
- Format URL : `https://domain.com/?shop=boutique.myshopify.com`
- Extraction : Query params → Headers → Cookies
- Développement : Default à `collective-club.myshopify.com`
- Production : Requis, sinon erreur

---

## Installation

### Prérequis

- Node.js 20+
- PostgreSQL (ou compte Neon/Supabase)
- Compte Google Cloud (OAuth)
- Compte Shopify Partner (pour apps)
- Compte Cloudinary (images)
- Compte Resend/SendGrid (emails)

### Étapes

1. **Cloner le projet** :
```bash
git clone <repo-url>
cd collective-club-web
```

2. **Installer les dépendances** :
```bash
npm install
```

3. **Configurer les variables d'environnement** :
```bash
cp .env.example .env
```

Voir section [Configuration](#configuration) pour remplir le `.env`.

4. **Générer Prisma Client** :
```bash
npx prisma generate
```

5. **Créer la base de données** :
```bash
npx prisma db push
```

6. **Seed les données initiales** (optionnel) :
```bash
npm run seed
```

7. **Lancer le serveur de développement** :
```bash
npm run dev
```

Application disponible sur [http://localhost:3000](http://localhost:3000)

---

## Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine :

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# NextAuth (générer avec: openssl rand -base64 32)
NEXTAUTH_SECRET="votre-secret-aleatoire-32-chars"
NEXTAUTH_URL="http://localhost:3000"  # Production: https://votredomaine.com

# Google OAuth
# Créer sur: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"

# Shopify (pour apps embedded)
# Créer sur: https://partners.shopify.com
SHOPIFY_CUSTOMER_CLIENT_ID="xxx"
SHOPIFY_CUSTOMER_CLIENT_SECRET="xxx"
SHOPIFY_API_SECRET="xxx"

# Cloudinary (upload images)
# Créer sur: https://cloudinary.com
CLOUDINARY_CLOUD_NAME="votre-cloud-name"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="votre-cloud-name"
CLOUDINARY_API_KEY="xxx"
CLOUDINARY_API_SECRET="xxx"

# Système d'emails (RGPD)
EMAIL_PROVIDER="console"              # console | resend | sendgrid | webhook
EMAIL_FROM="noreply@votredomaine.com"
EMAIL_API_KEY="re_xxx"                # Pour resend/sendgrid
EMAIL_WEBHOOK_URL="https://..."       # Pour webhook custom
TEST_EMAIL="test@example.com"         # Pour tests

# URLs publiques
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Environnement
NODE_ENV="development"  # development | production
```

### Providers Email

**Console (développement)** :
```env
EMAIL_PROVIDER="console"
```
Les emails sont affichés dans la console.

**Resend (production recommandé)** :
```env
EMAIL_PROVIDER="resend"
EMAIL_FROM="noreply@votredomaine.com"
EMAIL_API_KEY="re_xxx"
```
Gratuit jusqu'à 3000 emails/mois : [resend.com](https://resend.com)

**SendGrid** :
```env
EMAIL_PROVIDER="sendgrid"
EMAIL_FROM="noreply@votredomaine.com"
EMAIL_API_KEY="SG.xxx"
```

**Webhook custom** :
```env
EMAIL_PROVIDER="webhook"
EMAIL_WEBHOOK_URL="https://votre-webhook.com/send"
```

Voir [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md) pour plus de détails.

---

## Utilisation

### Développement

```bash
# Lancer le serveur dev avec Turbopack
npm run dev

# Ouvrir Prisma Studio (GUI base de données)
npx prisma studio

# Linter le code
npm run lint
```

### Accéder au forum

**En développement** :
```
http://localhost:3000/?shop=collective-club.myshopify.com
```

**Créer un nouveau shop** :
1. Visiter : `http://localhost:3000/?shop=ma-boutique.myshopify.com`
2. Se connecter avec Google ou créer un compte
3. Vous devenez automatiquement `ADMIN` avec `isShopOwner: true`
4. Catégories, rôles et badges créés automatiquement

### Dashboard Admin

Une fois connecté en tant qu'admin :
```
http://localhost:3000/dashboard?shop=ma-boutique.myshopify.com
```

**Fonctionnalités admin** :
- Statistiques (posts, commentaires, utilisateurs)
- Gestion utilisateurs (bannir, changer rôles)
- Gestion catégories (créer, modifier, supprimer)
- Gestion badges (créer, modifier, supprimer)
- Gestion rôles personnalisés
- Modération posts/commentaires

---

## Scripts CLI

### 🛡️ Gestion des Administrateurs

```bash
# Afficher toutes les commandes
npm run admin

# Analyser le statut des admins dans tous les shops
npm run admin -- analyze

# Créer un admin d'urgence pour un shop
npm run admin -- create-admin <shopId> [email] [name]
# Exemple:
npm run admin -- create-admin clxxx "admin@example.com" "John Doe"

# Promouvoir un utilisateur existant en admin
npm run admin -- promote <userId> [requesterId]

# Réparer automatiquement les shops orphelins (sans admin)
npm run admin -- auto-repair

# Générer un rapport d'audit complet
npm run admin -- audit
```

### 🔄 Récupération de Données

```bash
# Afficher toutes les commandes
npm run recovery

# Sauvegarder un shop complet (JSON)
npm run recovery -- backup <shopId>
# Crée: backups/shop-{shopId}-{timestamp}.json

# Restaurer depuis une sauvegarde
npm run recovery -- restore <backupPath> [newShopId]
# Exemple:
npm run recovery -- restore ./backups/shop-clxxx-2025.json

# Nettoyer les données orphelines
npm run recovery -- clean

# Migrer des données entre shops
npm run recovery -- migrate <sourceShopId> <targetShopId> [posts,categories,users]
# Exemple (migrer uniquement posts):
npm run recovery -- migrate clxxx clyyy posts
```

### 🗄️ Base de Données

```bash
# Générer Prisma Client après modification du schema
npx prisma generate

# Pousser les changements de schema vers la DB
npx prisma db push

# Créer une migration (production)
npx prisma migrate dev --name nom_migration

# Appliquer les migrations (production)
npx prisma migrate deploy

# Ouvrir Prisma Studio (GUI)
npx prisma studio

# Seed les données initiales
npm run seed
# ou
npm run db:seed
```

### 📧 Tests Emails

```bash
# Tester le système d'emails (notifications + RGPD exports)
npm run test:email

# Tester avec un email spécifique
TEST_EMAIL=votre-email@example.com npm run test:email
```

**Ce qui est testé** :
- ✅ Email de notification général
- ✅ Export RGPD avec pièce jointe JSON
- ✅ Connexion au provider (console/resend/sendgrid/webhook)

### 🔐 Tests Session Tokens

```bash
# Tester les session tokens Shopify
npm run test:session-tokens
```

---

## API Routes

### Authentification

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/auth/signup` | Inscription credentials (email/password) |
| `POST` | `/api/auth/shopify` | Auth Shopify embedded app |
| `GET` | `/api/auth/verify` | Vérifier session actuelle |
| `*` | `/api/auth/[...nextauth]` | Endpoints NextAuth (signin, signout, session, etc.) |

### Utilisateurs

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/users` | Liste utilisateurs (admin) |
| `GET` | `/api/users/[userId]` | Détails utilisateur |
| `PATCH` | `/api/users/[userId]` | Modifier utilisateur |
| `DELETE` | `/api/users/[userId]` | Supprimer utilisateur (admin) |
| `POST` | `/api/users/[userId]/ban` | Bannir/débannir (admin) |
| `PATCH` | `/api/users/[userId]/role` | Changer rôle de base (admin) |
| `POST` | `/api/users/[userId]/role-assignment` | Assigner rôle personnalisé (admin) |
| `POST` | `/api/users/[userId]/follow` | Suivre/unfollow utilisateur |
| `GET` | `/api/users/[userId]/followers` | Liste followers |
| `GET` | `/api/users/[userId]/followers/count` | Nombre de followers |
| `GET` | `/api/users/[userId]/followers/status` | Statut follow actuel |
| `GET` | `/api/users/[userId]/following` | Liste following |
| `GET` | `/api/users/points` | Points de l'utilisateur connecté |

### Posts

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/posts` | Liste posts (filtres: category, pinned, status) |
| `POST` | `/api/posts` | Créer post |
| `GET` | `/api/posts/[postId]` | Détails post |
| `PATCH` | `/api/posts/[postId]` | Modifier post |
| `DELETE` | `/api/posts/[postId]` | Supprimer post |
| `POST` | `/api/posts/[postId]/pin` | Épingler/désépingler (admin, max 3) |
| `GET` | `/api/posts/by-slug/[slug]` | Post par slug (SEO) |
| `GET` | `/api/posts/[postId]/comments` | Commentaires d'un post |
| `POST` | `/api/posts/[postId]/comments` | Créer commentaire |
| `POST` | `/api/posts/[postId]/reactions` | Créer/modifier réaction |
| `DELETE` | `/api/posts/[postId]/reactions` | Supprimer réaction |

### Commentaires

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/comments/[commentId]` | Détails commentaire |
| `PATCH` | `/api/comments/[commentId]` | Modifier commentaire |
| `DELETE` | `/api/comments/[commentId]` | Supprimer commentaire |
| `POST` | `/api/comments/[commentId]/reactions` | Réagir à commentaire |
| `DELETE` | `/api/comments/[commentId]/reactions` | Supprimer réaction |

### Sondages

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/polls/vote` | Voter à un sondage (1 vote/utilisateur) |

### Catégories

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/categories` | Liste catégories |
| `POST` | `/api/categories` | Créer catégorie (admin) |
| `PATCH` | `/api/categories/[categoryId]` | Modifier catégorie (admin) |
| `DELETE` | `/api/categories/[categoryId]` | Supprimer catégorie (admin) |

### Badges

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/badges` | Liste badges avec statut utilisateur |
| `POST` | `/api/badges` | Créer badge (admin) |
| `PATCH` | `/api/badges/[badgeId]` | Modifier badge (admin) |
| `DELETE` | `/api/badges/[badgeId]` | Supprimer badge (admin) |
| `GET` | `/api/badges/points` | Points et badges utilisateur |

### Rôles Personnalisés

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/roles` | Liste rôles du shop |
| `POST` | `/api/roles` | Créer rôle personnalisé (admin) |
| `POST` | `/api/roles/init` | Initialiser rôles par défaut |
| `PATCH` | `/api/roles/[roleId]` | Modifier rôle (admin) |
| `DELETE` | `/api/roles/[roleId]` | Supprimer rôle (admin) |

### Admin & Dashboard

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/admin/check` | Vérifier statut admin |
| `POST` | `/api/admin/promote` | Promouvoir utilisateur admin |
| `GET` | `/api/dashboard/stats` | Statistiques dashboard |

### Autres

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/customization` | Paramètres personnalisation |
| `PATCH` | `/api/customization` | Modifier personnalisation |
| `GET` | `/api/profile/data` | Données profil utilisateur |
| `PATCH` | `/api/profile/update` | Modifier profil |
| `GET` | `/api/members` | Liste membres publics |
| `GET` | `/api/onboarding` | Statut onboarding |
| `PATCH` | `/api/onboarding` | Mettre à jour onboarding |
| `GET` | `/api/shop/current` | Informations shop actuel |
| `POST` | `/api/upload/profile-image` | Upload avatar (Cloudinary) |
| `POST` | `/api/webhooks/compliance` | Webhooks Shopify RGPD |

---

## Déploiement

### Guide Complet

Voir [docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md) pour le guide complet.

### Déploiement Rapide

**1. Services requis** :
- PostgreSQL (Neon, Supabase, etc.)
- Resend.com (emails RGPD)
- Cloudinary (images)

**2. Variables d'environnement** :

Configurer toutes les variables du `.env` (voir [Configuration](#configuration)).

**3. Build production** :

```bash
# Build avec Prisma
npm run vercel-build

# Ou séparément
npx prisma generate
npx prisma migrate deploy
npm run build
```

**4. Démarrer** :

```bash
npm start
```

### Webhooks Shopify (RGPD obligatoire)

Dans Shopify Admin → Settings → Notifications → Webhooks :

| Événement | URL | Format |
|-----------|-----|--------|
| `customers/data_request` | `https://votredomaine.com/api/webhooks/compliance` | JSON |
| `customers/redact` | `https://votredomaine.com/api/webhooks/compliance` | JSON |
| `shop/redact` | `https://votredomaine.com/api/webhooks/compliance` | JSON |

**Secret webhook** : Utiliser `SHOPIFY_API_SECRET` pour valider les signatures.

### Plateformes recommandées

- **Vercel** : Déploiement automatique, optimisé Next.js
- **Railway** : PostgreSQL + app en un clic
- **Render** : Alternative simple avec DB incluse
- **Fly.io** : Performance globale

---

## Documentation

### Guides disponibles

| Document | Description |
|----------|-------------|
| [PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md) | Guide déploiement complet |
| [EMAIL_SETUP.md](docs/EMAIL_SETUP.md) | Configuration système emails |
| [QUICK_START_EMAIL.md](docs/QUICK_START_EMAIL.md) | Démarrage rapide emails |
| [GDPR_COMPLIANCE.md](docs/GDPR_COMPLIANCE.md) | Conformité RGPD détaillée |
| [SHOPIFY_SESSION_TOKENS.md](docs/SHOPIFY_SESSION_TOKENS.md) | Session tokens Shopify |
| [SHOPIFY_OAUTH_SETUP.md](docs/SHOPIFY_OAUTH_SETUP.md) | OAuth Shopify |
| [SEO_COMMENTS_IMPROVEMENTS.md](docs/SEO_COMMENTS_IMPROVEMENTS.md) | Optimisations SEO |
| [CLAUDE.md](CLAUDE.md) | Instructions Claude Code |

### Maintenance

**Hebdomadaire** :
```bash
npm run admin -- audit
npm run recovery -- clean
```

**Mensuelle** :
```bash
npm run recovery -- backup <shopId>
```

**En cas de problème** :

| Problème | Solution |
|----------|----------|
| Shop sans admin | `npm run admin -- auto-repair` |
| Données corrompues | `npm run recovery -- clean` |
| Performance dégradée | Vérifier logs monitoring |

---

## Sécurité

### Garanties Multi-Tenant

- ✅ **Isolation stricte** : Toutes requêtes filtrent par `shopId`
- ✅ **Validation domaines** : Format Shopify obligatoire
- ✅ **Protection cross-tenant** : Validations `validateUserBelongsToShop`, `validateResourceBelongsToShop`
- ✅ **Contraintes DB** : Unicité respecte `shopId`
- ✅ **Cascade suppression** : Suppression shop supprime toutes données liées

### Monitoring

Le système (`lib/monitoring.ts`) surveille automatiquement :
- Tentatives d'accès cross-tenant
- Performances dégradées (> 5s)
- Escalades de privilèges non autorisées
- Métriques par shop en temps réel

---

## Performance

- ⚡ **Temps de réponse** : < 2s même avec 1000+ posts par shop
- 🔥 **Tests de charge** : Validé avec 10 shops concurrents
- 📊 **Indexation DB** : Optimisée pour requêtes multi-tenant
- 🚀 **Turbopack** : Build dev ultra-rapide

---

## License

Propriétaire - Collective Club

---

## Support

Pour toute question ou problème :

1. Consulter la [documentation](docs/)
2. Vérifier les [scripts CLI](#scripts-cli)
3. Analyser les logs de monitoring

---

**🔒 Sécurité garantie** | **⚡ Performance validée** | **🛡️ Multi-tenant robuste**
