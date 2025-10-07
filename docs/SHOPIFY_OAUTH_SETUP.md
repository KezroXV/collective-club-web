# Configuration OAuth Google pour Shopify Embedded + Front Public

Ce guide explique comment l'authentification Google OAuth fonctionne dans les deux contextes :
- **Shopify Embedded** : App intégrée dans l'admin Shopify (iframe)
- **Front Public** : Site Next.js accessible hors de Shopify

## Architecture

### 1. Flux d'authentification

```
┌─────────────────┐
│  User clicks    │
│  "Sign in"      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Détection du contexte           │
│ - Iframe Shopify? (embedded)    │
│ - Site public? (standalone)     │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Construction URL Google OAuth   │
│ avec state parameter encodé     │
│ {context: "shopify"|"public",   │
│  shop: "..."}                   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Redirect vers Google            │
│ accounts.google.com/o/oauth2/   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ User autorise l'app             │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Callback vers notre endpoint    │
│ /api/auth/callback/google       │
│ avec code + state               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Détection contexte via state    │
│ et cookies                      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Échange code → access token     │
│ Récupération user info Google   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Création/récupération User      │
│ dans shop (multi-tenant)        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Création session JWT            │
│ (compatible NextAuth)           │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Set cookies avec SameSite       │
│ - None (Shopify iframe)         │
│ - Lax (Front public)            │
└────────┬────────────────────────┘
         │
         ▼
    ┌───┴────┐
    │        │
    ▼        ▼
Shopify   Public
Redirect  Redirect
/auth/    /dashboard
shopify-
redirect
```

## Fichiers clés

### 1. `/api/auth/callback/google/route.ts`
Endpoint de callback OAuth personnalisé qui :
- Détecte le contexte (Shopify vs public)
- Échange le code OAuth contre un token
- Crée/récupère l'utilisateur dans le shop
- Définit les cookies de session avec `SameSite` approprié
- Redirige vers la bonne interface

**Points clés** :
```typescript
// Détection du contexte
function detectShopifyContext(request, state): boolean {
  // 1. Vérifier state parameter
  if (state?.includes("shopify")) return true;

  // 2. Vérifier cookies Shopify
  if (request.cookies.get("shopify_app_session")) return true;

  // 3. Vérifier referer header
  if (referer.includes("admin.shopify.com")) return true;

  // 4. Cookie custom
  if (request.cookies.get("auth_context") === "shopify") return true;

  return false;
}

// Cookies sécurisés pour Shopify iframe
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: isShopifyEmbedded ? "none" : "lax", // ✅ CRITICAL
  path: "/",
  maxAge: 30 * 24 * 60 * 60, // 30 jours
};
```

### 2. `/auth/shopify-redirect/page.tsx`
Page intermédiaire pour rediriger dans l'iframe Shopify avec App Bridge.

**Points clés** :
- Charge Shopify App Bridge dynamiquement
- Utilise `Redirect.Action.APP` pour naviguer dans l'iframe
- Fallback vers navigation standard si App Bridge échoue

```typescript
// Redirection avec App Bridge
const app = shopifyAppBridge.createApp({
  apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY,
  host: btoa(`${shop}/admin`),
});

const redirect = Redirect.create(app);
redirect.dispatch(Redirect.Action.APP, "/dashboard");
```

### 3. `/auth/signin/page.tsx` (modifié)
Page de sign-in qui construit l'URL Google OAuth avec le contexte encodé.

**Points clés** :
```typescript
// Détection du contexte
const isInIframe = window !== window.parent;
const isShopifyEmbedded = isInIframe && shop;

// State parameter avec contexte
const state = JSON.stringify({
  context: isShopifyEmbedded ? "shopify" : "public",
  shop: shop, // Pour Shopify
});

// Cookie de contexte (backup)
document.cookie = `auth_context=${
  isShopifyEmbedded ? 'shopify' : 'public'
}; path=/; SameSite=${
  isShopifyEmbedded ? 'None' : 'Lax'
}; Secure`;
```

## Configuration

### Variables d'environnement

Ajouter dans `.env.local` :

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# NextAuth
NEXTAUTH_SECRET=your-secret-minimum-32-characters
NEXTAUTH_URL=https://your-app.vercel.app

# Shopify App (pour embedded context)
NEXT_PUBLIC_SHOPIFY_API_KEY=your-shopify-app-api-key
SHOPIFY_APP_HANDLE=your-app-handle
```

### Google Cloud Console

Dans [Google Cloud Console](https://console.cloud.google.com/), configurer :

**Authorized redirect URIs** :
```
https://collective-club-web.vercel.app/api/auth/callback/google
https://localhost:3000/api/auth/callback/google (dev)
```

**Authorized JavaScript origins** :
```
https://collective-club-web.vercel.app
https://localhost:3000 (dev)
https://admin.shopify.com (pour iframe Shopify)
```

### Shopify App Configuration

Dans Shopify Partner Dashboard :

1. **App setup** > **App URL** :
   ```
   https://collective-club-web.vercel.app/dashboard?shop={{shop}}
   ```

2. **Embedded app** : Activer

3. **Frame ancestors** : Ajouter votre domaine
   ```
   https://collective-club-web.vercel.app
   ```

## Points critiques

### 1. SameSite=None pour Shopify iframe

**OBLIGATOIRE** pour que les cookies fonctionnent dans un iframe cross-origin (Shopify admin) :

```typescript
sameSite: "none"  // Pour Shopify
secure: true      // REQUIS avec SameSite=None
```

### 2. Détection du contexte

Utiliser **plusieurs méthodes** pour détecter le contexte (defense in depth) :
- State parameter (prioritaire)
- Cookies custom
- Referer header
- Detection iframe JavaScript

### 3. Multi-tenant isolation

**Toujours** récupérer et valider le `shopId` :
```typescript
const shopId = await getCurrentShopId();
if (!shopId) {
  throw new Error("Shop context required");
}
```

### 4. Session JWT

Compatible avec NextAuth pour réutiliser les composants existants :
```typescript
import { encode } from "next-auth/jwt";

const token = await encode({
  token: {
    sub: user.id,
    email: user.email,
    shopId: user.shopId,
    // ...
  },
  secret: process.env.NEXTAUTH_SECRET!,
});
```

## Redirections

### Shopify Embedded
```
/auth/signin?shop=my-shop.myshopify.com
  → Google OAuth
  → /api/auth/callback/google
  → /auth/shopify-redirect?shop=my-shop.myshopify.com
  → App Bridge redirect → /dashboard
```

### Front Public
```
/auth/signin
  → Google OAuth
  → /api/auth/callback/google
  → /dashboard
```

## Dépendances

```json
{
  "next-auth": "^4.24.11",
  "@next-auth/prisma-adapter": "^1.0.7"
}
```

**Shopify App Bridge** (chargé dynamiquement en CDN) :
```html
<script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
```

## Tests

### Test contexte Shopify
1. Ouvrir l'app depuis Shopify admin
2. Vérifier que la connexion fonctionne dans l'iframe
3. Vérifier que les cookies sont définis avec `SameSite=None`
4. Vérifier la redirection vers l'admin après connexion

### Test contexte public
1. Ouvrir directement `https://your-app.vercel.app/auth/signin`
2. Vérifier que la connexion fonctionne
3. Vérifier que les cookies sont définis avec `SameSite=Lax`
4. Vérifier la redirection vers `/dashboard`

## Debugging

### Vérifier les cookies
```javascript
// Dans la console du navigateur
document.cookie
```

Chercher :
- `next-auth.session-token`
- `shopDomain`
- `auth_context`

### Vérifier le contexte détecté
```typescript
console.log("🔍 Context detected:", {
  isShopifyEmbedded,
  state,
  referer: request.headers.get("referer")
});
```

### Vérifier la session
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const session = await getServerSession(authOptions);
console.log("Session:", session);
```

## Troubleshooting

### Erreur "Cookies blocked"
- Vérifier que `SameSite=None` est défini pour Shopify
- Vérifier que `Secure=true` est présent
- Vérifier que l'app utilise HTTPS (pas HTTP)

### Erreur "Shop context missing"
- Vérifier que le `shop` parameter est passé dans l'URL
- Vérifier que le cookie `shopDomain` est défini
- Vérifier `getCurrentShopId()` dans les logs

### Redirection échoue dans Shopify
- Vérifier que Shopify App Bridge est chargé
- Vérifier la clé API (`NEXT_PUBLIC_SHOPIFY_API_KEY`)
- Utiliser le fallback `window.location.href` si App Bridge échoue

## Sécurité

### Validation du shop domain
```typescript
function isValidShopDomain(shopDomain: string): boolean {
  const pattern = /^[a-z0-9][a-z0-9\-]*\.myshopify\.com$/i;
  return pattern.test(shopDomain);
}
```

### Protection CSRF
Le `state` parameter protège contre les attaques CSRF OAuth.

### Isolation multi-tenant
Toutes les requêtes DB filtrent par `shopId` :
```typescript
const user = await prisma.user.findFirst({
  where: { email, shopId }, // ✅ Toujours filtrer
});
```
