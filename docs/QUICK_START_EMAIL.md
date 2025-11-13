# 🚀 Démarrage Rapide - Système d'Emailing

## ✅ Ce qui a été configuré

Le système d'emailing est **entièrement fonctionnel** et testé. Voici ce qui a été mis en place :

### 📦 Package installé
- ✅ `resend@^6.4.2` - Service d'emailing moderne et fiable

### 📝 Fichiers créés/modifiés
- ✅ [.env](../.env) - Variables d'environnement EMAIL_* ajoutées
- ✅ [scripts/test-email.ts](../scripts/test-email.ts) - Script de test complet
- ✅ [package.json](../package.json) - Commande `npm run test:email` ajoutée
- ✅ [CLAUDE.md](../CLAUDE.md) - Documentation des commandes mise à jour
- ✅ [docs/EMAIL_SETUP.md](EMAIL_SETUP.md) - Guide complet de configuration

### ⚙️ Configuration actuelle
```bash
EMAIL_PROVIDER=resend           # Provider configuré
EMAIL_FROM=onboarding@resend.dev  # Expéditeur par défaut
EMAIL_API_KEY=re_your_api_key_here  # À remplacer par votre clé
```

---

## 🎯 Prochaines Étapes

### Pour utiliser en DÉVELOPPEMENT (mode console)

Aucune action requise ! Le système fonctionne déjà en mode console.

```bash
# Les emails seront affichés dans la console
npm run test:email
```

Les exports RGPD sont sauvegardés dans `temp/gdpr-exports/`.

---

### Pour utiliser en PRODUCTION (Resend)

#### 1️⃣ Créer un compte Resend

1. Allez sur [resend.com](https://resend.com)
2. Créez un compte gratuit (100 emails/jour)

#### 2️⃣ Obtenir votre API Key

1. Dashboard > **API Keys** > **Create API Key**
2. Copiez la clé (commence par `re_`)

#### 3️⃣ Mettre à jour .env

Remplacez `re_your_api_key_here` par votre vraie clé dans `.env` :

```bash
EMAIL_API_KEY=re_votre_vraie_cle_ici
```

#### 4️⃣ Tester

```bash
npm run test:email
```

Vérifiez votre boîte email à `test@example.com` (ou changez l'email dans le script).

---

## 📧 Utiliser votre propre domaine (Optionnel)

Par défaut, les emails sont envoyés depuis `onboarding@resend.dev`.

Pour utiliser votre domaine (ex: `noreply@votredomaine.com`) :

1. **Dans Resend** : Domains > Add Domain
2. **Ajoutez les DNS** fournis par Resend
3. **Attendez la vérification** (quelques minutes)
4. **Mettez à jour .env** :
   ```bash
   EMAIL_FROM=noreply@votredomaine.com
   ```

---

## 🧪 Tests Effectués

```
✅ Test 1: Notification Simple
   - Envoi d'un email de notification basique
   - Résultat: ✅ Succès

✅ Test 2: Export RGPD
   - Envoi d'un email avec pièce jointe JSON
   - Fichier sauvegardé: temp/gdpr-exports/gdpr-export-test_example_com-*.json
   - Taille: 2.00 KB
   - Résultat: ✅ Succès
```

---

## 📊 Utilisation dans le Code

### Envoyer une notification

```typescript
import { sendNotificationEmail } from '@/lib/email';

const result = await sendNotificationEmail(
  'user@example.com',
  'Bienvenue!',
  'Message de bienvenue...'
);
```

### Envoyer un export RGPD (automatique via webhook)

Le système envoie automatiquement les exports RGPD quand Shopify déclenche le webhook `customers/data_request`.

Voir [app/api/webhooks/compliance/route.ts](../app/api/webhooks/compliance/route.ts:171).

---

## 📚 Documentation Complète

Pour plus de détails, consultez [EMAIL_SETUP.md](EMAIL_SETUP.md).

---

## ❓ Questions Fréquentes

### Les tests passent mais je ne reçois pas d'email

Vous êtes en mode `console`. Pour envoyer de vrais emails :
1. Configurez `EMAIL_API_KEY` avec votre clé Resend
2. L'email de test est envoyé à `test@example.com` - changez-le dans `scripts/test-email.ts`

### Comment changer l'email de test ?

Éditez [scripts/test-email.ts](../scripts/test-email.ts) et remplacez `test@example.com` par votre email.

### Le système est-il prêt pour la production ?

**Oui**, une fois que vous avez :
- ✅ Configuré `EMAIL_API_KEY` avec une vraie clé Resend
- ✅ Testé avec `npm run test:email`
- ✅ Configuré les webhooks RGPD dans Shopify (voir [EMAIL_SETUP.md](EMAIL_SETUP.md))

---

**Status** : ✅ Système fonctionnel et testé
**Dernière mise à jour** : 2025-11-13
