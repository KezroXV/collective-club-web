# 📧 Configuration du Système d'Emailing

Ce document explique comment configurer et utiliser le système d'emailing de Collective Club.

## 📋 Vue d'ensemble

Le système d'emailing est utilisé pour :
- **Exports RGPD** : Envoi automatique des données personnelles aux clients (obligation légale)
- **Notifications** : Emails de notification aux utilisateurs (optionnel)

**Fichiers principaux** :
- `lib/email.ts` - Fonctions d'envoi d'emails
- `app/api/webhooks/compliance/route.ts` - Webhooks RGPD Shopify
- `scripts/test-email.ts` - Script de test

---

## 🚀 Configuration Rapide avec Resend (Recommandé)

### Étape 1 : Créer un compte Resend

1. Allez sur [resend.com](https://resend.com)
2. Créez un compte gratuit (100 emails/jour)
3. Vérifiez votre email

### Étape 2 : Obtenir une API Key

1. Dans le dashboard Resend, allez dans **API Keys**
2. Cliquez sur **Create API Key**
3. Donnez-lui un nom (ex: "Collective Club - Production")
4. Copiez la clé (elle commence par `re_`)

### Étape 3 : Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```bash
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_votre_cle_api_ici
EMAIL_FROM=onboarding@resend.dev
```

**Notes importantes** :
- Par défaut, vous pouvez utiliser `onboarding@resend.dev` comme expéditeur
- Pour utiliser votre propre domaine (ex: `noreply@votredomaine.com`), vous devez le vérifier dans Resend

### Étape 4 : Vérifier votre domaine (Optionnel)

Pour envoyer des emails depuis votre propre domaine :

1. Dans Resend, allez dans **Domains**
2. Cliquez sur **Add Domain**
3. Entrez votre domaine (ex: `votredomaine.com`)
4. Ajoutez les enregistrements DNS fournis
5. Attendez la vérification (quelques minutes à quelques heures)
6. Mettez à jour `EMAIL_FROM` avec votre domaine :
   ```bash
   EMAIL_FROM=noreply@votredomaine.com
   ```

### Étape 5 : Tester la configuration

Exécutez le script de test :

```bash
npm run test:email
```

Vous devriez recevoir 2 emails :
1. Un email de notification simple
2. Un email RGPD avec une pièce jointe JSON

---

## 🧪 Mode Développement (Console)

Pour le développement local sans envoyer de vrais emails :

```bash
EMAIL_PROVIDER=console
EMAIL_FROM=noreply@collectiveclub.com
```

**Comportement** :
- Les emails sont affichés dans la console
- Les exports RGPD sont sauvegardés dans `temp/gdpr-exports/`
- Aucun email réel n'est envoyé

---

## 🔧 Autres Providers

### SendGrid

```bash
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=SG.votre_cle_api_ici
EMAIL_FROM=noreply@votredomaine.com
```

1. Créez un compte sur [sendgrid.com](https://sendgrid.com)
2. Créez une API Key avec les permissions d'envoi
3. Vérifiez votre domaine expéditeur

### Webhook Personnalisé

Pour utiliser votre propre système d'envoi d'emails :

```bash
EMAIL_PROVIDER=webhook
EMAIL_WEBHOOK_URL=https://votre-serveur.com/send-email
EMAIL_FROM=noreply@votredomaine.com
```

Le webhook recevra un POST avec :
```json
{
  "type": "notification" | "gdpr_data_export",
  "to": "destinataire@example.com",
  "from": "noreply@votredomaine.com",
  "subject": "Sujet de l'email",
  "textReport": "Contenu texte...",
  "jsonReport": "{ ... }",
  "metadata": { ... }
}
```

---

## 📚 Utilisation dans le Code

### Envoyer une notification simple

```typescript
import { sendNotificationEmail } from '@/lib/email';

const result = await sendNotificationEmail(
  'user@example.com',
  'Bienvenue sur notre forum!',
  'Merci de vous être inscrit. Commencez à explorer les discussions...'
);

if (result.success) {
  console.log('Email envoyé!');
} else {
  console.error('Erreur:', result.error);
}
```

### Envoyer un export RGPD

```typescript
import { sendGDPRDataEmail } from '@/lib/email';
import { collectUserData, generateTextReport, generateJSONReport } from '@/lib/gdpr';

// 1. Collecter les données
const userData = await collectUserData(shopId, userEmail);

// 2. Générer les rapports
const textReport = generateTextReport(userData);
const jsonReport = generateJSONReport(userData);

// 3. Envoyer l'email
const result = await sendGDPRDataEmail(
  userEmail,
  userData,
  textReport,
  jsonReport
);
```

---

## 🔒 Webhooks RGPD Shopify

Les webhooks RGPD sont automatiquement traités par `/api/webhooks/compliance`.

### Configuration dans Shopify

1. Allez dans **Settings > Notifications > Webhooks**
2. Créez ces webhooks :

| Topic | URL | Description |
|-------|-----|-------------|
| `customers/data_request` | `https://votre-domaine.com/api/webhooks/compliance` | Demande d'export RGPD |
| `customers/redact` | `https://votre-domaine.com/api/webhooks/compliance` | Demande de suppression |
| `shop/redact` | `https://votre-domaine.com/api/webhooks/compliance` | Suppression du shop |

3. Configurez `SHOPIFY_API_SECRET` dans `.env` pour la vérification HMAC

### Flux d'un export RGPD

1. **Client demande ses données** via Shopify
2. **Shopify envoie un webhook** à `/api/webhooks/compliance`
3. **Le système collecte** toutes les données du client
4. **Un email est envoyé** avec :
   - Rapport texte lisible
   - Fichier JSON en pièce jointe
5. **Log dans la base de données** pour l'audit

---

## 📊 Monitoring et Débogage

### Vérifier la configuration actuelle

```bash
# Voir les variables EMAIL_* configurées
cat .env | grep EMAIL_
```

### Logs en production

Les emails envoyés génèrent des logs :

```
✅ GDPR email sent via Resend to: user@example.com
❌ Failed to send GDPR email: API key not configured
```

### Tester avec des données réelles

Pour tester avec un vrai utilisateur :

```bash
# 1. Trouvez un user_id dans votre base
# 2. Modifiez scripts/test-email.ts
# 3. Exécutez le test
npm run test:email
```

---

## 🎯 Checklist de Déploiement

Avant de déployer en production :

- [ ] Variables `EMAIL_*` configurées dans `.env` de production
- [ ] Domaine expéditeur vérifié (si utilisation d'un domaine custom)
- [ ] Script de test exécuté avec succès (`npm run test:email`)
- [ ] Webhooks RGPD configurés dans Shopify
- [ ] `SHOPIFY_API_SECRET` configuré pour la vérification HMAC
- [ ] Quota d'envoi vérifié (100/jour gratuit pour Resend)
- [ ] Monitoring des emails en place (logs ou dashboard provider)

---

## ❓ FAQ

### Pourquoi mes emails ne sont pas envoyés ?

1. Vérifiez que `EMAIL_PROVIDER` est défini (pas `console`)
2. Vérifiez que `EMAIL_API_KEY` est correcte
3. Vérifiez les logs pour voir les erreurs
4. Testez avec le script : `npm run test:email`

### Comment changer d'expéditeur ?

Modifiez `EMAIL_FROM` dans `.env` et vérifiez le domaine dans votre provider.

### Quel est le quota d'emails ?

- **Resend gratuit** : 100 emails/jour
- **Resend payant** : Jusqu'à 50,000/mois (à partir de $20/mois)
- **SendGrid gratuit** : 100 emails/jour
- **SendGrid payant** : Plans variables

### Les emails vont dans les spams ?

1. Vérifiez que votre domaine est correctement vérifié
2. Configurez les enregistrements SPF, DKIM, DMARC
3. Resend configure automatiquement ces enregistrements lors de la vérification du domaine

### Puis-je tester sans créer de compte Resend ?

Oui ! Utilisez `EMAIL_PROVIDER=console` pour afficher les emails dans la console.

---

## 📞 Support

- **Documentation Resend** : [resend.com/docs](https://resend.com/docs)
- **Dashboard Resend** : [resend.com/overview](https://resend.com/overview)
- **Limite de taux** : [resend.com/docs/api-reference/introduction#rate-limit](https://resend.com/docs/api-reference/introduction#rate-limit)

---

**Dernière mise à jour** : 2025-01-13
