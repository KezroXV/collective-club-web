/**
 * 🔐 Composant RequireAuth pour protéger les pages
 * Redirige automatiquement vers la page de connexion si l'utilisateur n'est pas connecté
 */

"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

interface RequireAuthProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

function RequireAuthContent({
  children,
  fallback,
  redirectTo = '/auth/signin'
}: RequireAuthProps) {
  const { currentUser, loading } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && !currentUser) {
      // 🔄 Vérifier si on vient juste d'une tentative d'authentification
      const lastAuthAttempt = sessionStorage.getItem('shopify_auth_attempt');
      const now = Date.now();

      // Si l'auth a été tentée il y a moins de 2 secondes, attendre encore un peu
      if (lastAuthAttempt && (now - parseInt(lastAuthAttempt)) < 2000) {
        console.log('⏳ Attente de la session après auth Shopify...');
        return; // Ne pas rediriger immédiatement
      }

      // Construire l'URL de redirection avec les paramètres actuels
      const currentUrl = window.location.href;
      const shopParam = searchParams.get('shop');

      // Créer l'URL de connexion avec callback
      const signInUrl = new URL(redirectTo, window.location.origin);
      signInUrl.searchParams.set('callbackUrl', currentUrl);

      if (shopParam) {
        signInUrl.searchParams.set('shop', shopParam);
      }

      router.push(signInUrl.toString());
    }
  }, [currentUser, loading, router, searchParams, redirectTo]);

  // 🔄 Afficher un loader pendant la vérification d'authentification
  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // 🔐 Ne rien afficher si pas d'utilisateur (redirection en cours)
  if (!currentUser) {
    return null;
  }

  // ✅ Utilisateur connecté, afficher le contenu
  return <>{children}</>;
}

export function RequireAuth(props: RequireAuthProps) {
  return (
    <Suspense fallback={
      props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      )
    }>
      <RequireAuthContent {...props} />
    </Suspense>
  );
}

function UseRequireAuthContent() {
  const { currentUser, loading } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && !currentUser) {
      const currentUrl = window.location.href;
      const shopParam = searchParams.get('shop');

      const signInUrl = new URL('/auth/signin', window.location.origin);
      signInUrl.searchParams.set('callbackUrl', currentUrl);

      if (shopParam) {
        signInUrl.searchParams.set('shop', shopParam);
      }

      router.push(signInUrl.toString());
    }
  }, [currentUser, loading, router, searchParams]);

  return { currentUser, loading, isAuthenticated: !!currentUser };
}

/**
 * Hook personnalisé pour protéger une page
 * Retourne null si l'utilisateur n'est pas connecté (avec redirection automatique)
 */
export function useRequireAuth() {
  // Note: Ce hook doit être utilisé dans un composant déjà wrappé avec Suspense
  // car il utilise useSearchParams
  return UseRequireAuthContent();
}

/**
 * Composant de chargement par défaut
 */
export function AuthLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement...</p>
      </div>
    </div>
  );
}
