# COLLECTIVE CLUB - GUIDE DE PRODUCTION

## Scripts de gestion disponibles

### 🛡️ Gestion des administrateurs
```bash
# Analyser le statut des admins dans toutes les boutiques
npm run admin analyze

# Créer un admin d'urgence pour une boutique
npm run admin create-admin <shopId> [email] [name]

# Promouvoir un utilisateur existant
npm run admin promote <userId> [requesterId]

# Réparation automatique des boutiques orphelines
npm run admin auto-repair

# Générer un rapport d'audit complet
npm run admin audit
```

### 🔄 Récupération de données
```bash
# Sauvegarder une boutique complète
npm run recovery backup <shopId>

# Restaurer depuis une sauvegarde
npm run recovery restore <backupPath> [newShopId]

# Nettoyer les données orphelines
npm run recovery clean

# Migrer des données entre boutiques
npm run recovery migrate <sourceShopId> <targetShopId> [posts,categories,users]
```

### 🗄️ Base de données
```bash
# Générer le client Prisma
npx prisma generate

# Pousser les changements de schéma
npx prisma db push

# Ouvrir Prisma Studio
npx prisma studio

# Populer avec des données initiales
npm run seed
```

### 📧 Système d'Emailing
```bash
# Tester le système d'emailing (notifications + exports RGPD)
npm run test:email

# Tester avec un email spécifique
TEST_EMAIL=votre-email@example.com npm run test:email
```

**Configuration** : Voir [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md)
- Mode `console` (dev) : emails loggés dans la console
- Mode `resend` (prod) : emails envoyés via Resend.com

## Architecture Multi-Tenant

### Navigation et URLs

Pour accéder au forum d'un shop, l'application utilise le paramètre `shop` dans l'URL :

**Format d'URL** : `https://votre-domaine.com/?shop=nom-du-shop.myshopify.com`

**Pages disponibles** :
- Page d'accueil/Forum : `/?shop=nom-du-shop.myshopify.com`
- Communauté : `/community?shop=nom-du-shop.myshopify.com`
- Dashboard admin : `/dashboard?shop=nom-du-shop.myshopify.com`

**Mécanisme d'isolation** :
Le `shopId` est extrait automatiquement de :
1. Query params (`?shop=`)
2. Headers HTTP
3. Cookies (pour persister la session)

⚠️ En développement : utilise par défaut `collective-club.myshopify.com` si aucun shop n'est fourni
⚠️ En production : l'absence du paramètre `shop` bloque la requête

### Sécurité
- **Isolation stricte** : Chaque boutique ne peut accéder qu'à ses propres données
- **Validation des domaines** : Vérification stricte des formats Shopify
- **Gestion d'erreurs** : Exceptions spécialisées avec actions de récupération
- **Monitoring** : Alertes automatiques sur les violations de sécurité

### Performance
- **Temps de réponse** : < 2s même avec 1000+ posts par boutique
- **Tests de charge** : Validé avec 10 boutiques et requêtes simultanées
- **Indexation DB** : Optimisée pour les requêtes multi-tenant

## Monitoring en Production

Le système de monitoring (`lib/monitoring.ts`) surveille automatiquement :
- Tentatives d'accès cross-tenant
- Performances dégradées (> 5s)
- Escalades de privilèges non autorisées
- Métriques par boutique en temps réel

## Procédures d'urgence

### Boutique sans administrateur
```bash
npm run admin auto-repair
```

### Données corrompues
```bash
npm run recovery clean
npm run recovery backup <shopId>  # Avant toute intervention
```

### Performance dégradée
1. Vérifier les logs de monitoring
2. Analyser les requêtes lentes avec Prisma Studio
3. Identifier les boutiques problématiques

## Structure des données

### Modèles principaux
- **Shop** : Boutique Shopify avec isolation
- **User** : Utilisateurs liés à une boutique (role: ADMIN/MODERATOR/MEMBER)
- **Post** : Messages du forum avec auteur, catégorie, sondages
- **Comment** : Commentaires sur les posts
- **Reaction** : Réactions emoji sur posts/commentaires
- **Category** : Catégories personnalisées par boutique
- **Badge** : Système de récompenses par boutique

### Relations clés
- Toutes les données sont liées à `shopId` pour l'isolation
- Contraintes uniques respectent l'isolation multi-tenant
- Cascade de suppression pour la cohérence des données

## Variables d'environnement requises

```env
# Base de données
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="générer-avec-openssl-rand-base64-32"
NEXTAUTH_URL="https://votredomaine.com"

# Shopify
SHOPIFY_CUSTOMER_CLIENT_ID="..."
SHOPIFY_CUSTOMER_CLIENT_SECRET="..."
SHOPIFY_API_SECRET="..."

# Email (RGPD)
EMAIL_PROVIDER="resend"  # ou "console" pour dev
EMAIL_FROM="noreply@votredomaine.com"
EMAIL_API_KEY="re_..."  # Clé API Resend

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# URLs
NEXT_PUBLIC_BASE_URL="https://votredomaine.com"
NODE_ENV="production"
```

**Guide complet** : Voir [docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md)

## Déploiement

**Guide de déploiement complet** : [docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md)

### Déploiement rapide

```bash
# Build de production (avec Prisma)
npm run vercel-build

# Ou séparément
npx prisma generate
npx prisma migrate deploy
npm run build

# Démarrer en production
npm start
```

### Services requis

- **Base de données** : PostgreSQL (Neon, Supabase, etc.)
- **Emails** : Resend.com (gratuit jusqu'à 3000 emails/mois)
- **Images** : Cloudinary (gratuit jusqu'à 25 crédits/mois)
- **Hébergement** : Vercel, Railway, Render, etc.

### Webhooks Shopify (RGPD obligatoire)

Configurez ces 3 webhooks dans Shopify Admin :
- `customers/data_request` → `/api/webhooks/compliance`
- `customers/redact` → `/api/webhooks/compliance`
- `shop/redact` → `/api/webhooks/compliance`

## Maintenance

### Hebdomadaire
- Audit des administrateurs : `npm run admin audit`
- Nettoyage des données : `npm run recovery clean`

### Mensuelle
- Sauvegarde complète des boutiques actives
- Analyse des performances et alertes

---

🔒 **Sécurité garantie** | ⚡ **Performance validée** | 🛡️ **Multi-tenant robuste**