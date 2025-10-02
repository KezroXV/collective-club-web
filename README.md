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

## Architecture Multi-Tenant

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
DATABASE_URL="postgresql://..."
SHOPIFY_API_KEY="b4e0f05c3b167ee4454a2bb3785bf717"
SHOPIFY_API_SECRET="..."
HOST="http://localhost:3000/"
NODE_ENV="production"
```

## Déploiement

1. **Build** : `npm run build`
2. **Base de données** : `npx prisma db push`
3. **Seeding** : `npm run seed` (optionnel)
4. **Start** : `npm run start`

## Maintenance

### Hebdomadaire
- Audit des administrateurs : `npm run admin audit`
- Nettoyage des données : `npm run recovery clean`

### Mensuelle
- Sauvegarde complète des boutiques actives
- Analyse des performances et alertes

---

🔒 **Sécurité garantie** | ⚡ **Performance validée** | 🛡️ **Multi-tenant robuste**