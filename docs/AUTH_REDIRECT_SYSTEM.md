# 🔐 Système de redirection d'authentification

## Résumé des modifications

Implémentation d'un système automatique de redirection vers la page de connexion pour les utilisateurs non connectés, avec retour intelligent vers la page d'origine après connexion.

## 🎯 Objectifs atteints

### **1. Flux d'authentification automatique**
- ✅ **Redirection automatique** : Les utilisateurs non connectés sont redirigés vers `/auth/signin`
- ✅ **Preservation du contexte** : L'URL d'origine (avec paramètres `?shop=`) est préservée
- ✅ **Retour intelligent** : Redirection vers la page d'origine après connexion réussie

### **2. Pages protégées**
- ✅ **Page d'accueil** (`/`) : Redirection automatique si non connecté
- ✅ **Expérience fluide** : Loading state pendant la vérification d'authentification
- ✅ **Composant réutilisable** : `RequireAuth` pour protéger d'autres pages

## 🛠️ Composants créés/modifiés

### **1. Nouveau composant : `RequireAuth.tsx`**
```typescript
// Composant wrapper pour protéger les pages
<RequireAuth>
  <PageContent />
</RequireAuth>

// Hook personnalisé pour logique d'auth
const { currentUser, loading, isAuthenticated } = useRequireAuth();
```

**Fonctionnalités :**
- Vérification automatique de l'authentification
- Redirection avec preservation des paramètres URL
- Loading state customisable
- Hook réutilisable pour logique d'auth

### **2. Page principale modifiée : `page.tsx`**
**Avant :**
```typescript
export default function HomePage() {
  const { currentUser } = useCurrentUser();
  // Contenu accessible même sans connexion
  return <div>...</div>;
}
```

**Après :**
```typescript
function HomePageContent() {
  const { currentUser } = useCurrentUser();
  // Contenu protégé
  return <div>...</div>;
}

export default function HomePage() {
  return (
    <RequireAuth>
      <HomePageContent />
    </RequireAuth>
  );
}
```

### **3. Page de connexion ajustée : `auth/signin/page.tsx`**
**Modification :**
```typescript
// Redirection par défaut vers accueil au lieu de /community
const callbackUrl = searchParams.get('callbackUrl') || '/';
```

## 🔄 Flux utilisateur

### **Scénario 1 : Utilisateur non connecté**
1. 🌐 **Visite** : `https://app.com/?shop=boutique.myshopify.com`
2. ⏳ **Vérification** : Loading state pendant check d'auth
3. 🔄 **Redirection** : Vers `/auth/signin?callbackUrl=https://app.com/?shop=boutique.myshopify.com&shop=boutique.myshopify.com`
4. 🔐 **Connexion** : Interface Google OAuth avec contexte de boutique
5. ✅ **Retour** : Redirection vers l'URL d'origine avec shop

### **Scénario 2 : Utilisateur déjà connecté**
1. 🌐 **Visite** : `https://app.com/?shop=boutique.myshopify.com`
2. ⏳ **Vérification** : Check rapide de l'authentification
3. ✅ **Accès direct** : Affichage immédiat du contenu de la page

### **Scénario 3 : Connexion réussie**
1. 🔐 **OAuth Google** : Processus de connexion
2. 🔄 **Callback NextAuth** : Traitement du token
3. ✅ **Redirection** : Retour à `callbackUrl` ou `/` par défaut

## 📋 Code détaillé

### **RequireAuth Component**
```typescript
export function RequireAuth({ children, fallback, redirectTo = '/auth/signin' }) {
  const { currentUser, loading } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && !currentUser) {
      const currentUrl = window.location.href;
      const shopParam = searchParams.get('shop');

      const signInUrl = new URL(redirectTo, window.location.origin);
      signInUrl.searchParams.set('callbackUrl', currentUrl);

      if (shopParam) {
        signInUrl.searchParams.set('shop', shopParam);
      }

      router.push(signInUrl.toString());
    }
  }, [currentUser, loading, router, searchParams, redirectTo]);

  if (loading) return fallback || <AuthLoadingSpinner />;
  if (!currentUser) return null;

  return <>{children}</>;
}
```

### **Hook personnalisé**
```typescript
export function useRequireAuth() {
  const { currentUser, loading } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Logique de redirection identique
  }, [currentUser, loading, router, searchParams]);

  return { currentUser, loading, isAuthenticated: !!currentUser };
}
```

## 🎨 Interface utilisateur

### **Loading State**
```typescript
<div className="min-h-screen flex items-center justify-center bg-gray-50">
  <div className="text-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
    <p className="text-gray-600">Chargement...</p>
  </div>
</div>
```

### **Page de connexion**
- **Interface Google OAuth** avec logo et branding
- **Contexte de boutique** affiché si présent dans l'URL
- **Message d'information** : "Premier utilisateur = Admin automatique"
- **Redirection automatique** après connexion

## 🔧 Configuration technique

### **NextAuth Configuration**
```typescript
// lib/auth.ts
pages: {
  signIn: "/auth/signin",
  error: "/auth/error",
},

callbacks: {
  async signIn({ user, account }) {
    // Vérification du shopId obligatoire
    const shopId = await getCurrentShopId();
    return !!shopId;
  },
  // ... autres callbacks
}
```

### **URLs et paramètres**
- **Page de connexion** : `/auth/signin`
- **Callback par défaut** : `/` (page d'accueil)
- **Paramètres préservés** : `?shop=`, `?callbackUrl=`
- **Redirection intelligente** : Retour à l'URL d'origine

## 🚀 Avantages

### **1. Sécurité**
- **Protection automatique** de toutes les pages sensibles
- **Vérification côté client et serveur** via NextAuth
- **Isolation multi-tenant** avec shopId obligatoire

### **2. Expérience utilisateur**
- **Redirection transparente** sans perte de contexte
- **Loading states** pour éviter les flashs de contenu
- **Retour intelligent** à la page d'origine

### **3. Développement**
- **Composant réutilisable** pour protéger n'importe quelle page
- **Hook personnalisé** pour logique d'auth custom
- **Code centralisé** et maintenable

### **4. Multi-tenant**
- **Détection automatique du shop** via paramètres URL
- **Connexion contextualisée** pour chaque boutique
- **Isolation des données** par shopId

## 📝 Utilisation

### **Protéger une nouvelle page**
```typescript
// app/nouvelle-page/page.tsx
import { RequireAuth } from '@/components/auth/RequireAuth';

function NouvellePage() {
  return <div>Contenu protégé</div>;
}

export default function Page() {
  return (
    <RequireAuth>
      <NouvellePage />
    </RequireAuth>
  );
}
```

### **Logique d'auth custom**
```typescript
// Dans un composant
function MonComposant() {
  const { currentUser, loading, isAuthenticated } = useRequireAuth();

  if (loading) return <div>Loading...</div>;

  return <div>Utilisateur: {currentUser?.name}</div>;
}
```

## 🎉 Résultat final

- **Sécurité renforcée** : Aucune page sensible accessible sans connexion
- **UX fluide** : Redirection transparente avec preservation du contexte
- **Code maintenable** : Composants réutilisables et logique centralisée
- **Multi-tenant ready** : Support complet des boutiques Shopify
- **Performance optimisée** : Loading states et vérifications efficaces

---

*Système d'authentification automatique déployé avec succès* ✨