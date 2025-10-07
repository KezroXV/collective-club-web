# 🔐 Implementation OAuth Google - Shopify Embedded + Front Public

## 📋 Résumé

J'ai implémenté un système d'authentification Google OAuth compatible avec :

1. **Shopify Embedded** : App intégrée dans l'admin Shopify (iframe)
2. **Front Public** : Site Next.js accessible hors de Shopify

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers

1. **`app/api/auth/callback/google/route.ts`**
   - Endpoint de callback OAuth personnalisé
   - Détection automatique du contexte (Shopify vs public)
   - Gestion des cookies avec `SameSite` approprié
   - Création/récupération utilisateur multi-tenant
   - Redirection intelligente selon le contexte

2. **`app/auth/shopify-redirect/page.tsx`**
   - Page intermédiaire pour redirection dans iframe Shopify
   - Utilise Shopify App Bridge pour navigation
   - Fallback vers navigation standard

3. **`docs/SHOPIFY_OAUTH_SETUP.md`**
   - Documentation complète du système
   - Guide de configuration Google Cloud Console
   - Guide de configuration Shopify App
   - Debugging et troubleshooting

4. **`README_OAUTH_IMPLEMENTATION.md`**
   - Ce fichier (résumé de l'implémentation)

### Fichiers modifiés

1. **`app/auth/signin/page.tsx`**
   - Ajout de la détection du contexte (iframe vs public)
   - Construction manuelle de l'URL Google OAuth avec `state` parameter
   - Définition du cookie `auth_context` pour backup

2. **`.env.auth.example`**
   - Ajout de `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - Ajout de `NEXT_PUBLIC_SHOPIFY_API_KEY`
   - Ajout de `SHOPIFY_APP_HANDLE`

## 🔑 Points clés de l'implémentation

### 1. Détection du contexte

Le système utilise **plusieurs méthodes** pour détecter si la connexion vient de Shopify ou du front public :

```typescript
// Méthode 1: State parameter (prioritaire)
if (state?.includes("shopify")) return true;

// Méthode 2: Cookie custom
if (cookies.get("auth_context") === "shopify") return true;

// Méthode 3: Referer header
if (referer.includes("admin.shopify.com")) return true;

// Méthode 4: Cookie Shopify session
if (cookies.get("shopify_app_session")) return true;
```

### 2. Cookies sécurisés pour Shopify iframe

**CRITICAL** : Les cookies doivent avoir `SameSite=None` et `Secure=true` pour fonctionner dans un iframe cross-origin (Shopify admin).

```typescript
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: isShopifyEmbedded ? "none" : "lax", // ✅ CRITICAL
  path: "/",
  maxAge: 30 * 24 * 60 * 60,
};

response.cookies.set("next-auth.session-token", sessionToken, cookieOptions);
response.cookies.set("shopDomain", shop.shopDomain, cookieOptions);
```

### 3. Redirection intelligente

Selon le contexte détecté :

**Shopify Embedded** :
```
/api/auth/callback/google
  → /auth/shopify-redirect?shop=my-shop.myshopify.com
  → Shopify App Bridge redirect → /dashboard
```

**Front Public** :
```
/api/auth/callback/google
  → /dashboard
```

### 4. Isolation multi-tenant

Respect strict de l'isolation multi-tenant avec `shopId` :

```typescript
const shopId = await getCurrentShopId();
if (!shopId) {
  throw new Error("Shop context required");
}

const user = await prisma.user.findFirst({
  where: { email, shopId }, // ✅ Toujours filtrer par shopId
});
```

### 5. Compatibilité NextAuth

Le token JWT est encodé avec `next-auth/jwt` pour rester compatible avec les composants NextAuth existants :

```typescript
import { encode } from "next-auth/jwt";

const token = await encode({
  token: {
    sub: user.id,
    email: user.email,
    shopId: user.shopId,
    role: user.role,
    // ...
  },
  secret: process.env.NEXTAUTH_SECRET!,
});
```

## 🛠️ Configuration requise

### Variables d'environnement

Ajouter dans `.env.local` :

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# NextAuth
NEXTAUTH_SECRET=your-secret-minimum-32-characters
NEXTAUTH_URL=https://collective-club-web.vercel.app

# Shopify App
NEXT_PUBLIC_SHOPIFY_API_KEY=your-shopify-app-api-key
SHOPIFY_APP_HANDLE=your-app-handle
```

### Google Cloud Console

Dans [Google Cloud Console](https://console.cloud.google.com/) :

**Authorized redirect URIs** :
```
https://collective-club-web.vercel.app/api/auth/callback/google
```

**Authorized JavaScript origins** :
```
https://collective-club-web.vercel.app
https://admin.shopify.com
```

### Shopify Partner Dashboard

1. **App URL** :
   ```
   https://collective-club-web.vercel.app/dashboard?shop={{shop}}
   ```

2. **Embedded app** : ✅ Activer

3. **Frame ancestors** : Ajouter votre domaine

## 📊 Flux d'authentification complet

```
┌─────────────────────────────────────────────────────────┐
│                User clicks "Sign in"                    │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Détection contexte (iframe Shopify ou public)          │
│  - window !== window.parent?                            │
│  - shop parameter présent?                              │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Construction URL Google OAuth                          │
│  state = {context: "shopify"|"public", shop: "..."}     │
│  + Cookie auth_context                                  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Redirect vers Google                                   │
│  accounts.google.com/o/oauth2/v2/auth                   │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  User autorise l'app                                    │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Callback /api/auth/callback/google                     │
│  params: code, state                                    │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Détection contexte via:                                │
│  - state parameter                                      │
│  - auth_context cookie                                  │
│  - referer header                                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Échange code OAuth → access token Google               │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Fetch user info Google                                 │
│  {sub, email, name, picture, email_verified}            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Get shopId via getCurrentShopId()                      │
│  (OBLIGATOIRE pour multi-tenant)                        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Find or Create User in shop                            │
│  - Premier user → ADMIN + isShopOwner                   │
│  - Autres users → MEMBER                                │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Create Account record (Google OAuth)                   │
│  avec access_token, refresh_token, etc.                 │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Create JWT session token                               │
│  (compatible NextAuth)                                  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Set cookies avec SameSite approprié                    │
│  - Shopify: SameSite=None, Secure=true                  │
│  - Public: SameSite=Lax, Secure=true                    │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
                 ┌────┴─────┐
                 │          │
                 ▼          ▼
         Shopify Context  Public Context
                 │          │
                 ▼          ▼
    /auth/shopify-redirect  /dashboard
    (App Bridge redirect)
                 │
                 ▼
            /dashboard
         (dans iframe)
```

## 🧪 Tests

### Test 1: Shopify Embedded

1. Ouvrir l'app depuis Shopify admin
2. Cliquer sur "Sign in with Google"
3. ✅ Vérifier que l'auth fonctionne dans l'iframe
4. ✅ Vérifier les cookies avec `document.cookie` :
   - `next-auth.session-token` avec `SameSite=None`
   - `shopDomain`
   - `auth_context=shopify`
5. ✅ Vérifier la redirection vers `/dashboard` dans l'iframe

### Test 2: Front Public

1. Ouvrir directement `https://your-app.vercel.app/auth/signin`
2. Cliquer sur "Sign in with Google"
3. ✅ Vérifier que l'auth fonctionne
4. ✅ Vérifier les cookies avec `document.cookie` :
   - `next-auth.session-token` avec `SameSite=Lax`
   - `shopDomain`
   - `auth_context=public`
5. ✅ Vérifier la redirection vers `/dashboard`

## 🐛 Troubleshooting

### Problème : Cookies bloqués dans Shopify iframe

**Cause** : `SameSite=None` et/ou `Secure=true` manquants

**Solution** :
```typescript
// Vérifier que ces options sont bien présentes
sameSite: "none"  // ✅ Obligatoire pour iframe cross-origin
secure: true      // ✅ Obligatoire avec SameSite=None
```

### Problème : "Shop context missing"

**Cause** : `shopId` non récupéré

**Solution** :
- Vérifier que le cookie `shopDomain` est défini
- Vérifier que le `shop` parameter est dans l'URL (`?shop=my-shop.myshopify.com`)
- Vérifier les logs de `getCurrentShopId()`

### Problème : Redirection échoue dans Shopify

**Cause** : Shopify App Bridge non chargé ou mal configuré

**Solution** :
- Vérifier que `NEXT_PUBLIC_SHOPIFY_API_KEY` est défini
- Vérifier que le script App Bridge est chargé
- Utiliser le fallback `window.location.href` si App Bridge échoue

## 🔒 Sécurité

### ✅ Protection CSRF
Le `state` parameter protège contre les attaques CSRF OAuth.

### ✅ Validation du shop domain
```typescript
const shopifyDomainPattern = /^[a-z0-9][a-z0-9\-]*\.myshopify\.com$/i;
```

### ✅ Email verification
```typescript
if (!userInfo.email_verified) {
  throw new Error("Email not verified");
}
```

### ✅ Isolation multi-tenant
Toutes les requêtes DB filtrent strictement par `shopId`.

### ✅ HTTPS obligatoire
`Secure=true` sur tous les cookies (requis pour production).

## 📚 Documentation

Voir [`docs/SHOPIFY_OAUTH_SETUP.md`](docs/SHOPIFY_OAUTH_SETUP.md) pour la documentation complète.

## ✅ Checklist de déploiement

- [ ] Variables d'environnement définies sur Vercel
- [ ] Authorized redirect URIs configurés dans Google Cloud Console
- [ ] Shopify App configurée avec l'App URL correcte
- [ ] Embedded app activé dans Shopify
- [ ] Frame ancestors configuré
- [ ] Tests effectués dans les deux contextes
- [ ] Cookies vérifiés avec les bons attributs `SameSite`
- [ ] Logs de production vérifiés

## 📝 Notes importantes

1. **Ne pas utiliser NextAuth `signIn()`** directement car il ne supporte pas le custom `state` parameter. Nous construisons l'URL Google OAuth manuellement.

2. **`SameSite=None`** est **OBLIGATOIRE** pour Shopify iframe, sinon les cookies seront bloqués par le navigateur.

3. **Multiple méthodes de détection** du contexte (defense in depth) pour éviter les faux négatifs.

4. **Compatibilité NextAuth** maintenue via le JWT encoding pour réutiliser les composants existants (`useSession`, `getServerSession`, etc.).

5. **Isolation multi-tenant** stricte : toujours filtrer par `shopId` dans toutes les requêtes DB.
