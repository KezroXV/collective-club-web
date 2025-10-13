# Plan de Passation - Collective Club

## 1. Vue d'ensemble du projet (5-10 min)

### Objectif
Forum communautaire multi-tenant pour boutiques Shopify avec système de gamification.

### Stack technique
- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS 4
- **Backend**: Next.js API Routes, NextAuth, Prisma ORM
- **Database**: PostgreSQL
- **Authentification**: Google OAuth + Shopify App Bridge
- **Déploiement**: Vercel (ou autre plateforme Node.js)

### Architecture clé
Multi-tenant avec **isolation stricte par boutique** (`shopId` obligatoire sur toutes les requêtes).

---

## 2. Concepts fondamentaux (10-15 min)

### 2.1 Multi-tenant & Shop Isolation
**Fichier clé**: `lib/shopIsolation.ts`

- Chaque boutique Shopify = tenant isolé
- `shopId` extrait depuis `?shop=boutique.myshopify.com`
- **RÈGLE D'OR**: Toujours filtrer par `shopId` dans les requêtes DB
- En dev: fallback sur `collective-club.myshopify.com`
- En prod: bloque si pas de `shop` dans l'URL

**Démonstration**:
```typescript
// ✅ BON
const { shopId } = await getShopContext(request);
const posts = await prisma.post.findMany({
  where: { shopId }
});

// ❌ MAUVAIS - fuite de données cross-tenant!
const posts = await prisma.post.findMany();
```

### 2.2 Système d'authentification

**Deux méthodes d'auth**:

1. **Google OAuth** (`/api/auth/[...nextauth]/route.ts`)
   - Premier user devient `ADMIN` avec `isShopOwner: true`
   - Users suivants deviennent `MEMBER`

2. **Shopify Embedded App** (`/api/auth/shopify/route.ts`)
   - Auth automatique pour apps Shopify en iframe
   - Crée user avec email `shopify-user@{shop}.myshopify.com`
   - Cookie persistant pour session iframe

### 2.3 Système de permissions
**Fichier clé**: `lib/permissions.ts`

- 3 rôles de base: `ADMIN`, `MODERATOR`, `MEMBER`
- Rôles custom par boutique (stockés dans table `Role`)
- Permissions JSON: `MANAGE_POSTS`, `DELETE_COMMENTS`, etc.

**Règles importantes**:
- Seul `ADMIN` peut changer les rôles
- Shop owner ne peut pas être modifié
- User ne peut pas changer son propre rôle

---

## 3. Structure du code (10-15 min)

### 3.1 Dossiers importants

```
app/
  ├── (forum)/              # Pages publiques du forum
  ├── dashboard/            # Admin dashboard
  ├── api/                  # API routes (TOUTES filtrées par shopId)
      ├── auth/
      ├── posts/
      ├── users/
      ├── admin/

lib/
  ├── shopIsolation.ts      # ⭐ Isolation multi-tenant
  ├── permissions.ts        # ⭐ Système de permissions
  ├── auth.ts               # Configuration NextAuth
  ├── points.ts             # Système de gamification

prisma/
  ├── schema.prisma         # ⭐ Schéma DB (tous les modèles ont shopId)
  ├── seed.ts               # Données de démo

scripts/
  ├── ensure-admin.ts       # CLI gestion admins
  ├── data-recovery.ts      # CLI backup/restore
```

### 3.2 Pattern API Route standard

**Montrer un exemple** (`app/api/posts/route.ts`):

```typescript
export async function GET(request: NextRequest) {
  // 1. Récupérer le shopId (TOUJOURS en premier)
  const { shopId } = await getShopContext(request);

  // 2. Vérifier l'authentification si nécessaire
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Vérifier les permissions si nécessaire
  if (!hasPermission(session.user.role, Permission.VIEW_POSTS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 4. Requête DB avec shopId
  const posts = await prisma.post.findMany({
    where: { shopId }
  });

  return NextResponse.json(posts);
}
```

---

## 4. Base de données (10 min)

### 4.1 Modèles principaux

**Montrer** `prisma/schema.prisma`:

- `Shop`: La boutique (tenant root)
- `User`: Utilisateurs (contrainte unique `[shopId, email]`)
- `Post`: Posts du forum
- `Comment`: Commentaires (support réponses imbriquées via `parentId`)
- `Category`: Catégories personnalisées par boutique
- `Badge`: Système de récompenses
- `Role`: Rôles custom par boutique
- `UserPoints`: Points de gamification

### 4.2 Contraintes importantes

```prisma
// Email unique PAR boutique seulement
@@unique([shopId, email])

// Catégorie unique PAR boutique
@@unique([shopId, name])

// Slug unique PAR boutique
@@unique([shopId, slug])
```

### 4.3 Commandes Prisma

```bash
npx prisma generate    # Générer le client Prisma
npx prisma db push     # Push schema vers DB
npx prisma studio      # GUI pour explorer la DB
npm run seed           # Populer avec données de démo
```

---

## 5. Features principales (10 min)

### 5.1 Forum
- Posts avec catégories, images (Cloudinary), sondages
- Commentaires imbriqués (réponses)
- Réactions emoji (LIKE, LOVE, LAUGH, WOW, APPLAUSE)
- Posts épinglés (max 3 par boutique)

### 5.2 Gamification
- Points pour actions: créer post (+10), commenter (+5), recevoir réaction (+2)
- Badges débloquables avec seuil de points
- Leaderboard par boutique

### 5.3 Système social
- Follow/unfollow d'utilisateurs
- Profils utilisateurs avec stats
- Système d'onboarding (première action)

### 5.4 Administration
- Dashboard avec stats
- Gestion des users (ban, changement de rôle)
- Gestion des catégories et badges
- Customisation (couleurs, polices, images)

---

## 6. Outils de maintenance (5 min)

### 6.1 Scripts CLI

**Admin Management**:
```bash
npm run admin -- analyze         # Vérifier état des admins
npm run admin -- audit           # Rapport complet
npm run admin -- auto-repair     # Réparer boutiques sans admin
npm run admin -- create-admin <shopId> [email] [name]
```

**Data Recovery**:
```bash
npm run recovery -- backup <shopId>        # Backup complet
npm run recovery -- restore <backupPath>   # Restaurer
npm run recovery -- clean                  # Nettoyer données orphelines
```

---

## 7. Setup local (5 min)

### 7.1 Variables d'environnement requises

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Shopify (si app embedded)
SHOPIFY_API_KEY="..."
SHOPIFY_API_SECRET="..."

# Cloudinary (upload images)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### 7.2 Démarrage

```bash
npm install
npx prisma generate
npx prisma db push
npm run seed           # Optionnel: données de démo
npm run dev
```

**URL de test**: `http://localhost:3000/?shop=collective-club.myshopify.com`

---

## 8. Pièges courants & bonnes pratiques (5 min)

### ⚠️ Pièges à éviter

1. **Oublier le shopId dans les requêtes DB**
   - Risque: fuite de données cross-tenant
   - Solution: Toujours utiliser `getShopContext()` en début de route

2. **Modifier le shop owner ou un admin**
   - Risque: perte d'accès admin
   - Solution: Vérifier `isShopOwner` et `canChangeRole()`

3. **Créer des contraintes unique sans shopId**
   - Risque: collisions entre boutiques
   - Solution: Toujours `@@unique([shopId, field])`

4. **Ne pas gérer les erreurs d'isolation**
   - Risque: 500 au lieu de redirections propres
   - Solution: Catcher `ShopIsolationException`

### ✅ Bonnes pratiques

1. **Tester avec plusieurs shops**
   - Créer 2-3 boutiques de test
   - Vérifier l'isolation des données

2. **Utiliser les scripts CLI pour admin**
   - Ne jamais éditer manuellement les admins en DB
   - Utiliser `npm run admin`

3. **Vérifier les permissions avant les actions sensibles**
   - Utiliser `hasPermission()` systématiquement

4. **Logger les actions critiques**
   - Changements de rôle, bans, suppressions

---

## 9. Prochaines étapes suggérées (5 min)

### Pour démarrer
1. Clone le repo
2. Setup `.env` local
3. Lancer l'app en dev
4. Explorer Prisma Studio pour voir la structure DB
5. Créer un post de test
6. Tester avec un second shop: `/?shop=test-shop.myshopify.com`

### Points d'attention
- **Sécurité**: L'isolation multi-tenant est critique
- **Performance**: Penser aux index DB sur `shopId`
- **Testing**: Toujours tester avec plusieurs boutiques

### Documentation
- `CLAUDE.md`: Guide pour développeurs
- `README.md`: Guide de production (en français)
- Code comments: Annotations importantes dans le code

---

## 10. Questions & Réponses (10 min)

### Questions fréquentes

**Q: Comment ajouter un nouveau modèle DB?**
- Ajouter dans `schema.prisma` avec `shopId String`
- Relation vers `Shop`
- Contrainte `@@unique([shopId, field])` si nécessaire
- `npx prisma db push`

**Q: Comment ajouter une nouvelle permission?**
- Ajouter dans `enum Permission` dans `lib/permissions.ts`
- Mettre à jour `rolePermissions`
- Utiliser dans les API routes avec `hasPermission()`

**Q: Comment débugger un problème d'isolation?**
- Vérifier les logs pour `shopId`
- Utiliser Prisma Studio pour voir les données
- Vérifier les cookies/headers dans DevTools

**Q: Comment déployer en production?**
- Build: `npm run build`
- Migrer DB: `npx prisma db push` (ou migrations)
- Vérifier les variables d'environnement
- **Important**: En prod, `shop` param est obligatoire

---

## Checklist de fin de call

- [ ] Dev a cloné le repo
- [ ] `.env` configuré
- [ ] App lance en local
- [ ] Dev comprend le concept de shop isolation
- [ ] Dev a créé un post de test
- [ ] Dev a accès aux credentials (DB, APIs)
- [ ] Dev sait où trouver la doc (`CLAUDE.md`)
- [ ] Dev a les contacts en cas de blocage

---

**Durée totale estimée**: 60-90 minutes

**Conseil**: Partage d'écran pour montrer le code + DB en live, c'est plus efficace que de parler dans le vide.
