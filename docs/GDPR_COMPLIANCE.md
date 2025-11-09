# 🔒 Guide de Conformité RGPD/GDPR

Ce document explique comment fonctionne le système d'export de données RGPD et comment le configurer.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration](#configuration)
3. [Fonctionnement](#fonctionnement)
4. [Webhooks Shopify](#webhooks-shopify)
5. [Providers Email](#providers-email)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Vue d'ensemble

CollectiveClub implémente les 3 webhooks RGPD obligatoires de Shopify :

1. ✅ **`customers/data_request`** - Export des données personnelles
2. ✅ **`customers/redact`** - Anonymisation des données utilisateur
3. ✅ **`shop/redact`** - Suppression complète des données boutique (48h après désinstallation)

### Données exportées

Lors d'une demande d'export RGPD, nous collectons et envoyons :

- **Informations personnelles** : Email, nom, avatar, rôle, dates
- **Comptes liés** : OAuth providers (Google, Shopify)
- **Contenu créé** : Posts, commentaires, réactions
- **Votes aux sondages** : Toutes les réponses aux polls
- **Connexions sociales** : Abonnements et abonnés
- **Gamification** : Points, badges, transactions
- **Customisation** : Thème, couleurs, images personnalisées
- **Onboarding** : Statut de complétion

---

## Configuration

### 1. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```bash
# Provider email : 'console', 'resend', 'sendgrid', ou 'webhook'
EMAIL_PROVIDER="console"
EMAIL_FROM="noreply@votredomaine.com"

# Pour Resend (recommandé)
EMAIL_API_KEY="re_xxxxxxxxxxxx"

# Pour Shopify webhooks
SHOPIFY_API_SECRET="votre-shopify-api-secret"

# URL de votre application
NEXT_PUBLIC_APP_URL="https://votredomaine.com"
```

### 2. Configuration Shopify

#### a) Créer le webhook GDPR dans Shopify

1. Allez dans **Settings → Notifications → Webhooks**
2. Créez 3 webhooks :

**customers/data_request**
```
URL: https://votredomaine.com/api/webhooks/compliance
Format: JSON
API Version: Latest
```

**customers/redact**
```
URL: https://votredomaine.com/api/webhooks/compliance
Format: JSON
API Version: Latest
```

**shop/redact**
```
URL: https://votredomaine.com/api/webhooks/compliance
Format: JSON
API Version: Latest
```

#### b) Configurer la signature HMAC

Les webhooks Shopify incluent une signature HMAC dans le header `X-Shopify-Hmac-SHA256`.

Notre API vérifie automatiquement cette signature avec `SHOPIFY_API_SECRET`.

---

## Fonctionnement

### Flux d'une demande RGPD

```
1. Client demande export RGPD dans Shopify
       ↓
2. Shopify envoie webhook → /api/webhooks/compliance
       ↓
3. Vérification signature HMAC
       ↓
4. Collecte des données utilisateur (lib/gdpr.ts)
       ↓
5. Génération rapports JSON + texte
       ↓
6. Envoi email au client (lib/email.ts)
       ↓
7. Log de l'export dans la base de données
```

### Architecture des fichiers

```
app/api/webhooks/compliance/route.ts  → Endpoint webhook
lib/gdpr.ts                            → Collecte et export de données
lib/email.ts                           → Envoi d'emails
docs/GDPR_COMPLIANCE.md                → Cette documentation
```

---

## Webhooks Shopify

### 1. customers/data_request

**Fonction** : `handleCustomerDataRequest()`

**Payload Shopify** :
```json
{
  "shop_id": 12345678,
  "shop_domain": "boutique.myshopify.com",
  "orders_requested": [123456],
  "customer": {
    "id": 98765,
    "email": "client@example.com",
    "phone": "+33612345678"
  },
  "data_request": {
    "id": 111222333
  }
}
```

**Actions effectuées** :
1. Récupérer le shop depuis `shopDomain`
2. Trouver l'utilisateur par email dans la base
3. Collecter toutes ses données (posts, comments, points, etc.)
4. Générer rapport JSON complet + résumé texte
5. Envoyer email avec pièce jointe JSON
6. Logger l'export pour audit

**Email envoyé** :
- **Objet** : "Vos données personnelles - Export RGPD"
- **Corps** : Résumé texte des données
- **Pièce jointe** : `donnees-personnelles-[timestamp].json`

### 2. customers/redact

**Fonction** : `handleCustomerRedact()`

**Actions effectuées** :
1. Trouve l'utilisateur par email
2. Anonymise les données :
   - Email → `deleted-[timestamp]@deleted.local`
   - Nom → "Utilisateur supprimé"
   - Image → `null`
   - `isBanned` → `true` (pour empêcher reconnexion)
3. **Conserve** posts/comments (RGPD autorise conservation contenu public)

**Note** : Les posts et commentaires sont conservés car considérés comme contributions publiques au forum.

### 3. shop/redact

**Fonction** : `handleShopRedact()`

**Actions effectuées** :
1. Supprime TOUTES les données du shop dans l'ordre :
   - PollVotes
   - PollOptions
   - Polls
   - Reactions
   - Comments
   - Posts
   - PointTransactions
   - UserPoints
   - Follow
   - Categories
   - Badges
   - Roles
   - Accounts
   - Users
   - Shop

**Délai** : Shopify envoie ce webhook 48h après désinstallation de l'app.

---

## Providers Email

### 1. Console (Développement)

Par défaut en mode dev. Les emails sont affichés dans la console et le JSON est sauvegardé dans `temp/gdpr-exports/`.

```bash
EMAIL_PROVIDER="console"
```

**Avantages** :
- Gratuit
- Aucune configuration
- Parfait pour tester

**Limitations** :
- N'envoie pas de vrais emails
- Ne fonctionne pas en production

---

### 2. Resend (Recommandé)

Service moderne, simple et abordable.

**Configuration** :
```bash
EMAIL_PROVIDER="resend"
EMAIL_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="noreply@votredomaine.com"
```

**Tarifs** :
- 100 emails/jour GRATUIT
- $20/mois pour 50,000 emails

**Setup** :
1. Créer compte sur [resend.com](https://resend.com)
2. Ajouter et vérifier votre domaine
3. Créer une API key
4. Copier la key dans `.env`

**Documentation** : https://resend.com/docs

---

### 3. SendGrid

Service populaire de Twilio.

**Configuration** :
```bash
EMAIL_PROVIDER="sendgrid"
EMAIL_API_KEY="SG.xxxxxxxxxxxx"
EMAIL_FROM="noreply@votredomaine.com"
```

**Tarifs** :
- 100 emails/jour GRATUIT
- Plans payants à partir de $19.95/mois

**Setup** :
1. Créer compte sur [sendgrid.com](https://sendgrid.com)
2. Vérifier votre domaine (Sender Authentication)
3. Créer une API key avec permission "Mail Send"
4. Copier la key dans `.env`

**Documentation** : https://docs.sendgrid.com/

---

### 4. Webhook personnalisé

Si vous avez votre propre système d'envoi d'emails.

**Configuration** :
```bash
EMAIL_PROVIDER="webhook"
EMAIL_WEBHOOK_URL="https://votre-serveur.com/send-email"
```

**Payload envoyé** :
```json
{
  "type": "gdpr_data_export",
  "to": "client@example.com",
  "from": "noreply@votredomaine.com",
  "subject": "Vos données personnelles - Export RGPD",
  "textReport": "...",
  "jsonReport": "...",
  "metadata": {
    "exportDate": "2025-01-09T...",
    "dataSubject": "client@example.com",
    "shopDomain": "boutique.myshopify.com"
  }
}
```

**Votre webhook doit** :
1. Recevoir le POST JSON
2. Envoyer l'email avec `textReport` dans le corps
3. Attacher `jsonReport` en pièce jointe
4. Retourner status 200 si succès

---

## Testing

### Test en développement

#### 1. Configurer en mode console

```bash
EMAIL_PROVIDER="console"
```

#### 2. Simuler un webhook Shopify

Créez un fichier `test-gdpr-webhook.ts` :

```typescript
import crypto from 'crypto';

const payload = {
  shop_domain: "collective-club.myshopify.com",
  customer: {
    id: 123,
    email: "test@example.com"
  }
};

const secret = process.env.SHOPIFY_API_SECRET || '';
const rawBody = JSON.stringify(payload);
const hmac = crypto
  .createHmac('sha256', secret)
  .update(rawBody, 'utf8')
  .digest('base64');

fetch('http://localhost:3000/api/webhooks/compliance', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Hmac-SHA256': hmac,
    'X-Shopify-Topic': 'customers/data_request',
    'X-Shopify-Shop-Domain': 'collective-club.myshopify.com'
  },
  body: rawBody
}).then(res => console.log(res.status));
```

Puis exécutez :
```bash
npx tsx test-gdpr-webhook.ts
```

#### 3. Vérifier les logs

```
📦 Processing GDPR data request for test@example.com in shop collective-club.myshopify.com
✅ Data collected for test@example.com:
   - Posts: 5
   - Comments: 12
   - Reactions: 20
   - Total points: 150
   - Export size: 45.2 KB
📧 GDPR EMAIL (DEV MODE - CONSOLE)
...
✅ JSON saved to: temp/gdpr-exports/gdpr-export-test_example_com-1704804000000.json
```

### Test en production

#### 1. Utiliser Shopify CLI pour simuler webhook

```bash
shopify webhook trigger --topic=customers/data_request \
  --address=https://votredomaine.com/api/webhooks/compliance
```

#### 2. Vérifier dans les logs Vercel/Railway

```bash
vercel logs --follow
```

---

## Troubleshooting

### ❌ "Invalid HMAC signature"

**Cause** : La variable `SHOPIFY_API_SECRET` n'est pas correctement configurée.

**Solution** :
1. Vérifier que `SHOPIFY_API_SECRET` est dans `.env`
2. Vérifier que la valeur correspond à votre Shopify API Secret
3. Redémarrer le serveur après modification

---

### ❌ "Shop not found"

**Cause** : Le shop n'existe pas dans la base de données.

**Solution** :
1. Vérifier que le shop est bien créé lors de l'installation de l'app
2. Vérifier le `shopDomain` dans le payload webhook
3. Créer manuellement le shop si nécessaire :

```sql
INSERT INTO shops (id, "shopDomain", "shopName", "ownerId")
VALUES ('shop-id', 'boutique.myshopify.com', 'Ma Boutique', 'pending');
```

---

### ❌ "No user data found"

**Cause** : L'utilisateur n'a jamais créé de compte sur le forum.

**Solution** : C'est normal ! Un email sera quand même envoyé au client pour l'informer qu'aucune donnée n'a été trouvée.

---

### ❌ "Failed to send GDPR email"

**Cause** : Configuration email incorrecte.

**Solutions** :
- **Console** : Vérifier que le dossier `temp/gdpr-exports` est accessible en écriture
- **Resend** : Vérifier que `EMAIL_API_KEY` est valide et que le domaine est vérifié
- **SendGrid** : Vérifier que `EMAIL_API_KEY` a les permissions "Mail Send"
- **Webhook** : Vérifier que `EMAIL_WEBHOOK_URL` est accessible et retourne 200

---

### ❌ Email reçu mais pièce jointe manquante

**Cause** : Certains providers nécessitent une configuration spécifique pour les attachments.

**Solution** :
1. Vérifier que le JSON est bien encodé en base64
2. Vérifier la taille du JSON (< 10MB recommandé)
3. Tester avec un autre provider

---

## Conformité RGPD

### Droits des utilisateurs

✅ **Droit d'accès** : Webhook `customers/data_request` implémenté
✅ **Droit à l'effacement** : Webhook `customers/redact` implémenté
✅ **Droit à la portabilité** : Export JSON structuré
✅ **Droit d'information** : Email envoyé avec toutes les données
✅ **Conservation limitée** : Suppression automatique après 48h (shop/redact)

### Délais de réponse

- **Export RGPD** : Immédiat (< 1 minute après webhook)
- **Anonymisation** : Immédiate après webhook
- **Suppression totale** : 48h après désinstallation app

### Audit trail

Tous les exports RGPD sont loggés dans `pointTransactions` avec :
- Date et heure de l'export
- Email du demandeur
- Description : "GDPR data export requested and sent to [email]"

---

## Checklist de mise en production

Avant de passer en production, vérifiez :

- [ ] `SHOPIFY_API_SECRET` configuré
- [ ] `EMAIL_PROVIDER` configuré (pas "console")
- [ ] `EMAIL_API_KEY` configuré et testé
- [ ] `EMAIL_FROM` avec votre domaine vérifié
- [ ] `NEXT_PUBLIC_APP_URL` avec l'URL de production
- [ ] Webhooks Shopify créés et pointant vers votre URL
- [ ] Test d'envoi d'email réussi
- [ ] Logs de production configurés (Vercel, Sentry, etc.)
- [ ] Backup de base de données configuré

---

## Support

Pour toute question ou problème :

1. Vérifier les logs de votre serveur
2. Consulter cette documentation
3. Tester avec `EMAIL_PROVIDER=console` en dev
4. Contacter le support Shopify pour les webhooks

---

## Références

- [RGPD - Guide officiel](https://www.cnil.fr/fr/reglement-europeen-protection-donnees)
- [Shopify GDPR Webhooks](https://shopify.dev/docs/apps/webhooks/compliance)
- [Resend Documentation](https://resend.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com/)
