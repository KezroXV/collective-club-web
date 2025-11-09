# Exemple de Migration - Route `/api/posts`

Ce document montre comment migrer une route API existante pour supporter les session tokens Shopify.

## Avant (utilise `getAuthContext` de auth-context.ts)

```typescript
import { getShopId } from "@/lib/shopIsolation";
import { getAuthContext } from "@/lib/auth-context";

export async function GET(request: NextRequest) {
  // Récupère shopId depuis query params/cookies
  const shopId = await getShopId(request);

  // Utilise NextAuth uniquement
  const posts = await prisma.post.findMany({
    where: { shopId },
  });

  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  // Authentification NextAuth uniquement
  const { user, shopId } = await getAuthContext();

  const body = await request.json();
  const post = await prisma.post.create({
    data: {
      ...body,
      authorId: user.id,
      shopId,
    },
  });

  return NextResponse.json(post);
}
```

## Après (supporte Shopify session tokens + NextAuth)

```typescript
import { getAuthContext } from "@/lib/hybridAuth";

export async function GET(request: NextRequest) {
  try {
    // getAuthContext() tente automatiquement:
    // 1. Session token Shopify (header Authorization)
    // 2. NextAuth session (cookies)
    const auth = await getAuthContext(request);

    // Si pas d'auth, c'est une requête publique
    // On peut toujours récupérer shopId depuis query params pour lecture seule
    const shopId = auth?.shopId || await getShopIdFromRequest(request);

    const posts = await prisma.post.findMany({
      where: { shopId },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Pour les opérations d'écriture, l'auth est OBLIGATOIRE
    const auth = await getAuthContext(request);

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const post = await prisma.post.create({
      data: {
        ...body,
        authorId: auth.userId,
        shopId: auth.shopId,
      },
    });

    console.log(`Post created via ${auth.authMethod}`);
    // Affichera "shopify-session-token" ou "nextauth"

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

// Helper pour récupérer shopId sans auth (lecture publique)
async function getShopIdFromRequest(request: NextRequest): Promise<string> {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");

  if (shop) {
    const shopRecord = await prisma.shop.findUnique({
      where: { shopDomain: shop },
      select: { id: true },
    });
    return shopRecord?.id || "";
  }

  return "";
}
```

## Version simplifiée avec `requireAuth`

Si l'authentification est TOUJOURS requise :

```typescript
import { requireAuth } from "@/lib/hybridAuth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const posts = await prisma.post.findMany({
      where: { shopId: auth.shopId },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const body = await request.json();
    const post = await prisma.post.create({
      data: {
        ...body,
        authorId: auth.userId,
        shopId: auth.shopId,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
```

## Changements clés

### 1. Import
```diff
- import { getAuthContext } from "@/lib/auth-context";
+ import { getAuthContext } from "@/lib/hybridAuth";
```

### 2. Gestion de l'auth
```diff
- const { user, shopId } = await getAuthContext();
+ const auth = await getAuthContext(request);
+ if (!auth) {
+   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
+ }
```

### 3. Utilisation des propriétés
```diff
- authorId: user.id,
+ authorId: auth.userId,

- shopId,
+ shopId: auth.shopId,

- role: user.role,
+ role: auth.role,
```

## Compatibilité

| Fonctionnalité | Avant | Après |
|---------------|-------|-------|
| Google OAuth | ✅ | ✅ |
| Shopify session tokens | ❌ | ✅ |
| NextAuth sessions | ✅ | ✅ |
| Multi-tenant isolation | ✅ | ✅ |
| Shop context detection | ✅ | ✅ |

## Test de la migration

### Test 1 : Avec Google OAuth (inchangé)
```bash
# Se connecter via Google
curl -X POST https://your-app.com/api/posts \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "content": "Test", "category": "General"}'
```

### Test 2 : Avec session token Shopify (nouveau)
```bash
# Depuis l'app embedded
curl -X POST https://your-app.com/api/posts \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "content": "Test", "category": "General"}'
```

### Test 3 : Vérifier l'authMethod
```typescript
const auth = await getAuthContext(request);
console.log("Auth method:", auth?.authMethod);
// "shopify-session-token" ou "nextauth"
```

## Checklist de migration

- [ ] Remplacer l'import de `getAuthContext`
- [ ] Passer `request` en paramètre à `getAuthContext()`
- [ ] Vérifier que `auth` n'est pas `null` avant utilisation
- [ ] Utiliser `auth.userId` au lieu de `user.id`
- [ ] Utiliser `auth.shopId` au lieu de `shopId`
- [ ] Utiliser `auth.role` au lieu de `user.role`
- [ ] Tester avec les deux méthodes d'auth
- [ ] Vérifier les logs pour confirmer l'authMethod

## Routes prioritaires à migrer

1. **Routes d'écriture (POST, PUT, DELETE)**
   - `/api/posts` ← PRIORITÉ
   - `/api/comments`
   - `/api/reactions`
   - `/api/categories`

2. **Routes utilisées dans Shopify embedded**
   - Toutes les routes appelées depuis l'app Shopify

3. **Routes publiques (optionnel)**
   - Peuvent rester avec NextAuth uniquement si pas utilisées dans Shopify

## Avantages de cette migration

✅ **Conforme Shopify** - Répond aux exigences de soumission d'app
✅ **Backward compatible** - L'ancien système continue de fonctionner
✅ **Transparent** - Code client inchangé (fetch automatique du token)
✅ **Sécurisé** - Double validation (JWT Shopify + sessions NextAuth)
✅ **Flexible** - Supporte les deux modes selon le contexte
