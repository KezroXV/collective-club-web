# Shopify Session Tokens - Guide d'implémentation

## Vue d'ensemble

Ce projet implémente un **système d'authentification hybride** qui supporte :

1. **Session tokens Shopify** - Pour l'app embedded dans Shopify admin (requis par Shopify)
2. **NextAuth Google OAuth** - Pour l'accès public au forum

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Client Request                      │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  getAuthContext()    │
         │   (hybridAuth.ts)    │
         └──────────┬───────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐      ┌──────────────────┐
│ Authorization│      │  NextAuth        │
│ Bearer token │      │  Session Cookie  │
└──────┬───────┘      └────────┬─────────┘
       │                       │
       ▼                       ▼
┌──────────────┐      ┌──────────────────┐
│ Validate     │      │ Get session      │
│ Shopify JWT  │      │ from NextAuth    │
└──────┬───────┘      └────────┬─────────┘
       │                       │
       └───────────┬───────────┘
                   │
                   ▼
           ┌──────────────┐
           │ AuthContext  │
           │ - userId     │
           │ - shopId     │
           │ - role       │
           │ - authMethod │
           └──────────────┘
```

## Fichiers créés

### 1. `lib/shopifySessionToken.ts`
Validation des session tokens Shopify JWT.

**Fonctions principales :**
- `validateShopifySessionToken(token)` - Valide un JWT Shopify
- `extractShopFromPayload(payload)` - Extrait le shop domain
- `extractUserIdFromPayload(payload)` - Extrait l'user ID

### 2. `lib/hybridAuth.ts`
Système d'authentification hybride.

**Fonctions principales :**
- `getAuthContext(request)` - Détecte et valide l'auth (Shopify ou NextAuth)
- `requireAuth(request)` - Middleware pour protéger les routes

**Interface `AuthContext` :**
```typescript
{
  userId: string;
  shopId: string;
  shopDomain: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "MODERATOR" | "MEMBER";
  isShopOwner: boolean;
  authMethod: "shopify-session-token" | "nextauth";
}
```

### 3. `lib/shopifyAppBridge.ts`
Utilitaires client pour App Bridge.

**Fonctions principales :**
- `getShopifySessionToken()` - Récupère le token depuis App Bridge
- `shopifyAuthenticatedFetch(url, options)` - Fetch avec token automatique

### 4. `components/ShopifyAuthProvider.tsx`
Provider React pour l'authentification Shopify.

**Usage :**
```tsx
import { ShopifyAuthProvider, useShopifyAuth } from "@/components/ShopifyAuthProvider";

function App() {
  return (
    <ShopifyAuthProvider>
      <YourComponents />
    </ShopifyAuthProvider>
  );
}

function YourComponent() {
  const { isAuthenticated, user, isLoading } = useShopifyAuth();
  // ...
}
```

### 5. `app/api/auth/verify/route.ts`
Endpoint de test pour vérifier l'authentification.

## Migration des routes API existantes

### Avant (ancien système)
```typescript
export async function GET(request: NextRequest) {
  const { shopId } = await getShopContext(request);
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ... votre code
}
```

### Après (système hybride)
```typescript
import { getAuthContext } from "@/lib/hybridAuth";

export async function GET(request: NextRequest) {
  // Supporte à la fois Shopify session tokens ET NextAuth
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // auth contient userId, shopId, role, etc.
  const posts = await prisma.post.findMany({
    where: { shopId: auth.shopId },
  });

  return NextResponse.json({ posts });
}
```

### Avec `requireAuth` (plus simple)
```typescript
import { requireAuth } from "@/lib/hybridAuth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    // auth est garanti d'exister ici
    const posts = await prisma.post.findMany({
      where: { shopId: auth.shopId },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
```

## Usage côté client

### Dans une app Shopify embedded

```tsx
"use client";

import { shopifyAuthenticatedFetch } from "@/lib/shopifyAppBridge";

export function MyComponent() {
  const handleFetch = async () => {
    // Le session token est automatiquement ajouté dans le header Authorization
    const response = await shopifyAuthenticatedFetch("/api/posts");
    const data = await response.json();
    console.log(data);
  };

  return <button onClick={handleFetch}>Charger les posts</button>;
}
```

### Dans l'app publique (Google OAuth)

```tsx
"use client";

export function MyComponent() {
  const handleFetch = async () => {
    // Utilise les cookies NextAuth automatiquement
    const response = await fetch("/api/posts");
    const data = await response.json();
    console.log(data);
  };

  return <button onClick={handleFetch}>Charger les posts</button>;
}
```

## Variables d'environnement requises

Assurez-vous d'avoir ces variables dans `.env.local` :

```bash
# Shopify API (OBLIGATOIRE pour session tokens)
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
NEXT_PUBLIC_SHOPIFY_API_KEY=your-shopify-api-key

# NextAuth (pour Google OAuth)
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-app.com

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
```

## Comment ça fonctionne

### Flux Shopify Embedded (Session Tokens)

1. L'utilisateur ouvre l'app depuis Shopify admin
2. Le composant React appelle `getShopifySessionToken()` via App Bridge
3. App Bridge génère un JWT signé par Shopify
4. Le fetch inclut ce token dans le header `Authorization: Bearer <token>`
5. Le serveur valide le JWT avec `validateShopifySessionToken()`
6. Si valide, l'utilisateur est créé/récupéré automatiquement

### Flux Public (Google OAuth)

1. L'utilisateur clique "Sign in with Google"
2. Redirection vers Google OAuth
3. Callback crée une session NextAuth
4. Les cookies NextAuth sont utilisés pour les requêtes suivantes
5. Le serveur lit la session via `getServerSession()`

## Avantages du système hybride

✅ **Conforme Shopify** - Utilise les session tokens comme requis
✅ **Rétrocompatible** - Google OAuth continue de fonctionner
✅ **Transparent** - Les routes API n'ont pas besoin de savoir quelle méthode est utilisée
✅ **Sécurisé** - Validation JWT pour Shopify, sessions sécurisées pour NextAuth
✅ **Multi-tenant** - Isolation par shop maintenue dans les deux cas

## Tests

### Test 1 : Session tokens Shopify

1. Installer l'app dans un dev store Shopify
2. Ouvrir l'app depuis l'admin Shopify
3. Vérifier dans la console réseau :
   - Requêtes API ont `Authorization: Bearer <token>`
   - Le token est un JWT valide
4. Tester `/api/auth/verify` - doit retourner `authMethod: "shopify-session-token"`

### Test 2 : Google OAuth

1. Accéder directement à `https://your-app.com/auth/signin`
2. Se connecter avec Google
3. Vérifier que les cookies NextAuth sont définis
4. Tester `/api/auth/verify` - doit retourner `authMethod: "nextauth"`

### Test 3 : Routes API

Créer un test simple :
```typescript
// test-api.ts
const testShopifyAuth = async () => {
  const token = await getShopifySessionToken();
  const response = await fetch("/api/posts", {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(await response.json());
};

const testNextAuth = async () => {
  const response = await fetch("/api/posts");
  console.log(await response.json());
};
```

## Migration progressive

Vous n'avez pas besoin de tout migrer d'un coup :

1. **Phase 1** : Déployer les nouveaux fichiers (`hybridAuth.ts`, etc.)
2. **Phase 2** : Créer une nouvelle route API test avec `getAuthContext()`
3. **Phase 3** : Tester avec les deux méthodes d'auth
4. **Phase 4** : Migrer progressivement les routes existantes

### Routes prioritaires à migrer

1. Routes utilisées dans l'app embedded Shopify
2. Routes de création/modification de données
3. Routes publiques (peuvent rester NextAuth uniquement)

## Debugging

### Vérifier quel mode d'auth est utilisé

```typescript
const auth = await getAuthContext(request);
console.log("Auth method:", auth?.authMethod);
// "shopify-session-token" ou "nextauth"
```

### Voir le contenu du session token

```typescript
const authHeader = request.headers.get("authorization");
if (authHeader) {
  const token = authHeader.substring(7);
  const payload = await validateShopifySessionToken(token);
  console.log("Session token payload:", payload);
}
```

### Logs utiles

```typescript
// Dans hybridAuth.ts
console.log("🔐 Auth attempt:", {
  hasAuthHeader: !!request.headers.get("authorization"),
  hasSession: !!session,
  method: context?.authMethod
});
```

## Sécurité

### Validation JWT Shopify
- Le token est signé par Shopify avec votre `SHOPIFY_API_SECRET`
- Vérification de l'expiration (`exp`)
- Vérification du `nbf` (not before)
- Validation de l'`aud` (audience = votre API key)

### Protection multi-tenant
- Chaque token contient le `dest` (shop domain)
- L'utilisateur est toujours lié au bon `shopId`
- Impossibilité d'accéder aux données d'un autre shop

## Troubleshooting

### "Failed to get Shopify session token"
- Vérifier que `NEXT_PUBLIC_SHOPIFY_API_KEY` est défini
- Vérifier que l'app est ouverte depuis Shopify admin avec `?host=` et `?shop=` dans l'URL
- Vérifier que App Bridge est bien chargé

### "Session token expired"
- Les tokens Shopify expirent après quelques minutes
- App Bridge les renouvelle automatiquement
- Ne pas stocker les tokens, les récupérer à chaque requête

### "Shop context missing"
- Vérifier que le `dest` dans le token pointe vers un shop valide
- Vérifier que le shop existe dans votre DB

## Pour aller plus loin

- [Shopify Session Tokens Documentation](https://shopify.dev/docs/apps/auth/oauth/session-tokens)
- [App Bridge Authentication](https://shopify.dev/docs/api/app-bridge-library/authentication)
- [NextAuth Documentation](https://next-auth.js.org/)
