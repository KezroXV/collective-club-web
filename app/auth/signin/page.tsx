"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeWrapper from "@/components/ThemeWrapper";
import { Users, Crown, Sparkles } from "lucide-react";
import { useState, useEffect, Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shop = searchParams.get("shop");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const { colors, bannerImageUrl } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [loadingAdminCheck, setLoadingAdminCheck] = useState(true);
  const [isInIframe, setIsInIframe] = useState(false);
  const [authAttempted, setAuthAttempted] = useState(false);

  // Authentification automatique Shopify (pour iframe)
  const handleShopifyAuth = async () => {
    if (!shop || authAttempted) return;

    setAuthAttempted(true);
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/shopify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop }),
      });

      const data = await response.json();

      if (data.success) {
        // Rediriger vers le dashboard avec le shop param
        const url = new URL(callbackUrl, window.location.origin);
        url.searchParams.set("shop", shop);
        router.push(url.pathname + url.search);
      } else {
        console.error("Shopify auth failed:", data.error);
        setIsLoading(false);
        setAuthAttempted(false); // Permettre un nouvel essai
      }
    } catch (error) {
      console.error("Shopify auth error:", error);
      setIsLoading(false);
      setAuthAttempted(false); // Permettre un nouvel essai
    }
  };

  // Détecter si on est dans un iframe Shopify et auto-authentifier
  useEffect(() => {
    const inIframe = window !== window.parent;
    setIsInIframe(inIframe);

    // Si on est dans un iframe Shopify avec un shop param, auto-auth
    // MAIS uniquement si pas déjà en cours de chargement
    if (inIframe && shop && !isLoading) {
      handleShopifyAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop]);

  // Vérifier s'il existe déjà un admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const params = new URLSearchParams();
        if (shop) {
          params.append("shop", shop);
        }

        const response = await fetch(`/api/admin/check?${params}`);
        const data = await response.json();

        setHasAdmin(data.hasAdmin);
      } catch (error) {
        console.error("Erreur lors de la vérification admin:", error);
        setHasAdmin(false); // En cas d'erreur, considérer qu'il n'y a pas d'admin
      } finally {
        setLoadingAdminCheck(false);
      }
    };

    checkAdmin();
  }, [shop]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      // Si on est dans un iframe Shopify, utiliser l'auth Shopify
      if (isInIframe && shop) {
        await handleShopifyAuth();
        return;
      }

      // Sinon, utiliser Google OAuth (accès direct)
      let finalCallbackUrl = callbackUrl;
      if (shop) {
        const url = new URL(callbackUrl, window.location.origin);
        url.searchParams.set("shop", shop);
        finalCallbackUrl = url.toString();
      }

      await signIn("google", {
        callbackUrl: finalCallbackUrl,
        redirect: true,
      });
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setIsLoading(false);
    }
  };

  return (
    <ThemeWrapper applyBackgroundColor={true} className="min-h-screen">
      {/* Background avec pattern */}
      <div
        className="min-h-screen relative"
        style={{
          background: `linear-gradient(135deg, ${colors.Fond} 0%, ${colors.Posts}08 100%)`,
        }}
      >
        {/* Pattern décoratif */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute top-0 left-0 w-72 h-72 rounded-full"
            style={{
              background: `radial-gradient(circle, ${colors.Posts}40 0%, transparent 70%)`,
            }}
          ></div>
          <div
            className="absolute bottom-0 right-0 w-96 h-96 rounded-full"
            style={{
              background: `radial-gradient(circle, ${colors.Posts}30 0%, transparent 70%)`,
            }}
          ></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 py-8">
          {/* Contenu principal */}
          <div className="max-w-md mx-auto">
            {/* Logo et titre */}
            <div className="text-center mb-8">
              {/* Logo */}
              <div className="mb-6">
                <div
                  className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                  style={{ backgroundColor: colors.Posts }}
                >
                  <span className="text-white font-bold text-2xl">C</span>
                </div>
                <h1
                  className="text-2xl font-bold mb-2"
                  style={{ color: colors.Police }}
                >
                  Collective Club
                </h1>
                {shop && (
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: colors.Posts }}
                    ></div>
                    <span className="text-sm text-gray-600">{shop}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-8">
                <h2
                  className="text-xl font-semibold"
                  style={{ color: colors.Police }}
                >
                  {shop ? `Rejoindre la communauté` : "Bienvenue"}
                </h2>
                <p className="text-gray-600 text-sm">
                  Connectez-vous pour accéder à votre espace communautaire
                </p>
              </div>
            </div>

            {/* Card de connexion */}
            <div
              className="bg-white rounded-2xl shadow-xl border overflow-hidden"
              style={{ borderColor: colors.Bordures }}
            >
              {/* Image de bannière miniature */}
              {bannerImageUrl && (
                <div className="h-24 bg-gradient-to-r from-gray-100 to-gray-200 relative overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center "
                    style={{ backgroundImage: `url(${bannerImageUrl})` }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
                </div>
              )}

              <div className="p-8">
                {/* Bouton de connexion Google */}
                <Button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-3 rounded-xl font-medium"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Connexion...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                      <span>Continuer avec Google</span>
                    </>
                  )}
                </Button>

                {/* Informations sur les rôles */}
                <div className="mt-6 space-y-3">
                  {/* Toujours afficher l'information pour les utilisateurs existants */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                    <Users className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium text-green-900">
                        {hasAdmin === false
                          ? "Utilisateur futur ?"
                          : "Utilisateur existant ?"}
                      </span>
                      <p className="text-green-700">
                        {hasAdmin === false
                          ? "Rejoignez la communauté en tant que membre"
                          : "Accédez à votre compte membre"}
                      </p>
                    </div>
                  </div>

                  {/* Indicateur de chargement pour la vérification admin */}
                  {loadingAdminCheck && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">
                          Vérification en cours...
                        </span>
                        <p className="text-gray-600">
                          Détection du statut de la boutique
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Sparkles className="h-3 w-3" />
                    <span>Sécurisé et simple</span>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    En continuant, vous acceptez nos conditions
                    d&apos;utilisation
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div
                  className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${colors.Posts}20` }}
                >
                  <Users className="h-4 w-4" style={{ color: colors.Posts }} />
                </div>
                <p className="text-xs text-gray-600">Communauté</p>
              </div>
              <div className="space-y-2">
                <div
                  className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${colors.Posts}20` }}
                >
                  <Crown className="h-4 w-4" style={{ color: colors.Posts }} />
                </div>
                <p className="text-xs text-gray-600">Gestion</p>
              </div>
              <div className="space-y-2">
                <div
                  className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${colors.Posts}20` }}
                >
                  <Sparkles
                    className="h-4 w-4"
                    style={{ color: colors.Posts }}
                  />
                </div>
                <p className="text-xs text-gray-600">Engagement</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeWrapper>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
