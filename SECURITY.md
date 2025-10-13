# 🔒 SÉCURITÉ - COLLECTIVE CLUB WEB

## ⚠️ ACTION URGENTE REQUISE

**IMPORTANT:** Les credentials actuels dans votre fichier `.env` ont été exposés et doivent être révoqués immédiatement.

### 1. Révoquer les Secrets Actuels

#### Neon Database
1. Connectez-vous à https://console.neon.tech
2. Allez dans votre projet
3. Révoquez les credentials actuels
4. Générez de nouveaux credentials

#### Cloudinary
1. Connectez-vous à https://cloudinary.com
2. Allez dans Settings > Security
3. Révoquez l'API Secret actuel
4. Générez un nouveau API Secret

#### Google OAuth
1. Connectez-vous à https://console.cloud.google.com
2. Allez dans APIs & Services > Credentials
3. Supprimez les credentials actuels
4. Créez de nouveaux OAuth 2.0 Client IDs

#### Shopify OAuth
1. Connectez-vous à votre Shopify Partner Dashboard
2. Allez dans Apps > Votre App > App credentials
3. Révoquez les credentials actuels
4. Générez de nouveaux credentials

### 2. Générer NEXTAUTH_SECRET

```bash
# Générer un secret sécurisé avec OpenSSL
openssl rand -base64 32
```

### 3. Configuration des Variables d'Environnement

#### Développement Local
1. Copiez `.env.example` vers `.env`:
   ```bash
   cp .env.example .env
   ```

2. Remplissez TOUTES les valeurs avec vos nouveaux credentials

#### Production (Vercel/Netlify)
1. **NE JAMAIS** committer le fichier `.env`
2. Utilisez les variables d'environnement de votre plateforme:
   - Vercel: Project Settings > Environment Variables
   - Netlify: Site Settings > Environment variables

### 4. Vérification de Sécurité

Avant de déployer en production, vérifiez:

- [ ] `.env` est dans `.gitignore`
- [ ] Tous les anciens secrets ont été révoqués
- [ ] De nouveaux secrets ont été générés
- [ ] `NEXTAUTH_SECRET` est défini (32+ caractères)
- [ ] `NEXTAUTH_URL` pointe vers votre domaine de production
- [ ] `NODE_ENV=production` en production

### 5. Bonnes Pratiques

#### ✅ À FAIRE
- Utiliser des variables d'environnement pour tous les secrets
- Activer HTTPS/TLS en production
- Générer des secrets longs et aléatoires
- Utiliser des outils de gestion de secrets (AWS Secrets Manager, Vault)
- Faire une rotation des secrets régulièrement (tous les 90 jours)
- Auditer les accès aux secrets

#### ❌ À NE PAS FAIRE
- Committer `.env` dans Git
- Partager des secrets par email/chat
- Utiliser les mêmes secrets entre dev/staging/prod
- Hardcoder des secrets dans le code
- Utiliser des secrets faibles ou prévisibles

### 6. En Cas de Fuite de Secrets

Si vous suspectez qu'un secret a été compromis:

1. **IMMÉDIATEMENT:** Révoquez le secret compromis
2. Générez un nouveau secret
3. Mettez à jour toutes les configurations
4. Auditez les logs pour détecter des accès non autorisés
5. Notifiez votre équipe

### 7. Contact

Pour signaler une vulnérabilité de sécurité, contactez:
- Email: security@collective-club.com
- Ne divulguez PAS publiquement les vulnérabilités

---

**Dernière mise à jour:** 13 octobre 2025
