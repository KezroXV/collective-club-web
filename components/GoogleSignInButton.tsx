"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface GoogleSignInButtonProps {
  shop?: string | null;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Bouton de connexion Google intelligent
 *
 * Détecte automatiquement si l'app est dans une iframe Shopify et:
 * - Si OUI: redirige le PARENT (window.top) vers Google OAuth pour éviter le blocage
 * - Si NON: redirige normalement
 *
 * Google bloque OAuth dans les iframes pour des raisons de sécurité.
 * Ce composant contourne ce problème en sortant de l'iframe.
 */
export function GoogleSignInButton({
  shop,
  className,
  children
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = () => {
    setIsLoading(true);

    try {
      // 1. DÉTECTER LE CONTEXTE (iframe Shopify ou standalone)
      const isInIframe = window !== window.parent;
      const isShopifyEmbedded = !!(isInIframe && shop);

      // 2. CRÉER LE STATE PARAMETER (pour identifier le contexte après callback)
      const state = JSON.stringify({
        context: isShopifyEmbedded ? "shopify" : "public",
        shop: shop || undefined,
      });

      // 3. DÉFINIR UN COOKIE DE CONTEXTE (backup du state)
      document.cookie = `auth_context=${
        isShopifyEmbedded ? 'shopify' : 'public'
      }; path=/; SameSite=${
        isShopifyEmbedded ? 'None' : 'Lax'
      }; Secure`;

      // 4. CONSTRUIRE L'URL GOOGLE OAUTH
      const googleAuthUrl = buildGoogleAuthUrl(state);

      // 5. REDIRIGER SELON LE CONTEXTE
      if (isShopifyEmbedded) {
        // ✅ CRITICAL: Sortir de l'iframe pour éviter le blocage Google
        console.log("🔓 OAuth Google: sortie de l'iframe Shopify");

        // Rediriger le parent (top window)
        if (window.top) {
          window.top.location.href = googleAuthUrl;
        } else {
          // Fallback si window.top n'est pas accessible
          window.parent.location.href = googleAuthUrl;
        }
      } else {
        // Contexte standalone: redirection normale
        window.location.href = googleAuthUrl;
      }

    } catch (error) {
      console.error("❌ Erreur lors de la connexion Google:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      disabled={isLoading}
      className={className || "w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300"}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Connexion...</span>
        </div>
      ) : (
        children || (
          <>
            <GoogleIcon />
            <span>Continuer avec Google</span>
          </>
        )
      )}
    </Button>
  );
}

/**
 * Construit l'URL d'authentification Google OAuth
 */
function buildGoogleAuthUrl(state: string): string {
  const redirectUri = `${window.location.origin}/api/auth/callback/google`;
  const scope = "openid email profile";

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scope,
    state: encodeURIComponent(state),
    access_type: "offline",
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Logo Google SVG
 */
function GoogleIcon() {
  return (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
