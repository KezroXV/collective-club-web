# 🚀 Guide de Déploiement en Production

Ce guide vous aide à déployer Collective Club en production de manière sécurisée.

---

## ✅ Checklist Pré-Déploiement

### 1. Variables d'Environnement

Assurez-vous que toutes les variables d'environnement sont configurées en production :

#### Base de Données (OBLIGATOIRE)
- [ ] `DATABASE_URL` - URL de connexion PostgreSQL
- [ ] `DIRECT_URL` - URL directe PostgreSQL (pour migrations)

#### NextAuth (OBLIGATOIRE)
- [ ] `NEXTAUTH_SECRET` - Secret aléatoire fort (générer avec `openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` - URL de production (ex: `https://votredomaine.com`)

#### URLs
- [ ] `NEXT_PUBLIC_BASE_URL` - URL de base publique
- [ ] `NEXT_PUBLIC_APP_URL` - URL de l'application

#### Cloudinary (Upload d'images)
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`

#### Google OAuth (Si utilisé)
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`

#### Shopify (Si utilisé)
- [ ] `SHOPIFY_CUSTOMER_CLIENT_ID`
- [ ] `SHOPIFY_CUSTOMER_CLIENT_SECRET`
- [ ] `SHOPIFY_API_SECRET` - Pour vérification des webhooks RGPD

#### Email (OBLIGATOIRE pour RGPD)
- [ ] `EMAIL_PROVIDER` - Configuré sur `resend` (recommandé)
- [ ] `EMAIL_FROM` - Email expéditeur (ex: `noreply@votredomaine.com`)
- [ ] `EMAIL_API_KEY` - Clé API Resend

---

## 🔒 Sécurité

### Secrets à NE JAMAIS committer

Les fichiers suivants ne doivent JAMAIS être versionnés :
- `.env` - Contient vos secrets de production
- `.env.local`
- `.env.production`

### Générer des secrets forts

```bash
# Générer NEXTAUTH_SECRET
openssl rand -base64 32

# Ou avec Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 📧 Configuration Email Production

### Étape 1 : Créer un compte Resend

1. Allez sur [resend.com](https://resend.com)
2. Créez un compte
3. Créez une API key

### Étape 2 : Vérifier votre domaine (Recommandé)

Pour envoyer des emails depuis votre propre domaine :

1. Dashboard Resend > Domains > Add Domain
2. Ajoutez les enregistrements DNS fournis
3. Attendez la vérification (quelques minutes à 48h)

### Étape 3 : Configurer les variables

```bash
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_votre_cle_api_production
EMAIL_FROM=noreply@votredomaine.com  # Ou onboarding@resend.dev
```

### Étape 4 : Tester

Si vous avez accès à un terminal de production :

```bash
# Configurez TEST_EMAIL avec votre email
TEST_EMAIL=votre-email@example.com npm run test:email
```

---

## 🔗 Webhooks Shopify RGPD

Pour respecter le RGPD, configurez les webhooks Shopify :

### Dans Shopify Admin

1. Settings > Notifications > Webhooks
2. Créez 3 webhooks :

| Topic | URL | Description |
|-------|-----|-------------|
| `customers/data_request` | `https://votredomaine.com/api/webhooks/compliance` | Export données RGPD |
| `customers/redact` | `https://votredomaine.com/api/webhooks/compliance` | Suppression données |
| `shop/redact` | `https://votredomaine.com/api/webhooks/compliance` | Suppression boutique |

3. Format: JSON
4. Version de l'API : Dernière stable

### Vérification HMAC

Le webhook vérifie automatiquement la signature HMAC avec `SHOPIFY_API_SECRET`.

---

## 🗄️ Base de Données

### Migrations Prisma

Avant le premier déploiement :

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy
```

### Seed Initial (Optionnel)

Pour créer les rôles et catégories par défaut :

```bash
npm run seed
```

**Note** : Le seed est automatique lors de la première connexion d'une boutique.

---

## 🚀 Déploiement Vercel (Recommandé)

### 1. Installer Vercel CLI

```bash
npm i -g vercel
```

### 2. Connecter le projet

```bash
vercel
```

### 3. Configurer les variables d'environnement

Dans le dashboard Vercel :
1. Settings > Environment Variables
2. Ajoutez toutes les variables listées ci-dessus
3. Sélectionnez "Production" comme environnement

### 4. Déployer

```bash
# Build de production
npm run build

# Ou déployer directement
vercel --prod
```

### 5. Configurer le domaine

1. Vercel Dashboard > Domains
2. Ajoutez votre domaine custom
3. Mettez à jour `NEXTAUTH_URL` et `NEXT_PUBLIC_BASE_URL`

---

## 🚀 Déploiement Autre Plateforme

### Build Command

```bash
npm run vercel-build
```

Ce script :
1. Génère le client Prisma
2. Applique les migrations
3. Build Next.js

### Start Command

```bash
npm start
```

### Variables d'environnement requises

Toutes celles listées dans la checklist ci-dessus.

---

## 🧪 Tests Post-Déploiement

### 1. Vérifier l'application

- [ ] La page d'accueil charge correctement
- [ ] L'authentification fonctionne
- [ ] Les posts peuvent être créés
- [ ] Les images s'uploadent (Cloudinary)

### 2. Tester le système d'emailing

Déclenchez manuellement un webhook RGPD depuis Shopify ou attendez qu'un client en fasse la demande.

### 3. Vérifier les logs

- [ ] Aucune erreur dans les logs de production
- [ ] Les webhooks Shopify sont bien reçus
- [ ] Les emails sont envoyés avec succès

---

## 📊 Monitoring

### Logs Vercel

```bash
vercel logs --follow
```

### Monitoring Email (Resend)

Dashboard Resend > Emails > Activity

Vérifiez :
- Emails envoyés avec succès
- Taux de délivrabilité
- Erreurs éventuelles

### Base de Données

Si vous utilisez Neon :
- Dashboard Neon > Metrics
- Surveillez les connexions et les requêtes

---

## ⚡ Performance

### Optimisations recommandées

1. **Images** : Utilisez Cloudinary avec transformations automatiques
2. **Caching** : Activé par défaut avec Next.js
3. **Database Connection Pooling** : Utilisé via `DATABASE_URL` (Neon)

### Limites

- **Resend gratuit** : 100 emails/jour, 3000/mois
- **Neon gratuit** : 512 MB storage, 100h compute/mois
- **Cloudinary gratuit** : 25 crédits/mois

---

## 🆘 Dépannage

### "Invalid signature" sur webhooks

Vérifiez que `SHOPIFY_API_SECRET` est correctement configuré.

### Emails non envoyés

1. Vérifiez `EMAIL_PROVIDER=resend`
2. Vérifiez `EMAIL_API_KEY`
3. Vérifiez les logs Resend
4. Si domaine custom : vérifiez qu'il est vérifié

### Erreurs de base de données

1. Vérifiez `DATABASE_URL` et `DIRECT_URL`
2. Vérifiez que les migrations sont appliquées : `npx prisma migrate deploy`
3. Vérifiez les logs de la base de données

### "NEXTAUTH_SECRET missing"

Générez et configurez `NEXTAUTH_SECRET` en production.

---

## 📚 Documentation Complémentaire

- [Configuration Email](EMAIL_SETUP.md)
- [Conformité RGPD](GDPR_COMPLIANCE.md)
- [Guide Admin](../CLAUDE.md)

---

## ✅ Checklist Finale

Avant de considérer le déploiement terminé :

- [ ] Toutes les variables d'environnement configurées
- [ ] Build réussi sans erreurs
- [ ] Application accessible sur le domaine de production
- [ ] Authentification testée
- [ ] Upload d'images testé
- [ ] Webhooks Shopify configurés
- [ ] Système d'emailing testé
- [ ] Domaine email vérifié (si custom)
- [ ] Logs de production vérifiés (aucune erreur)
- [ ] Monitoring en place

---

**Dernière mise à jour** : 2025-11-13
