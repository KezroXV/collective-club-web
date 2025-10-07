"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Page intermédiaire pour rediriger l'utilisateur dans l'iframe Shopify
 * Utilise Shopify App Bridge pour effectuer la navigation dans l'admin
 */
function ShopifyRedirectContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop");

  useEffect(() => {
    // Vérifier si on est dans un iframe Shopify
    const isInIframe = window !== window.parent;

    if (isInIframe && shop) {
      // Utiliser Shopify App Bridge pour la redirection
      redirectWithAppBridge(shop);
    } else {
      // Fallback: rediriger vers le dashboard public
      window.location.href = "/dashboard";
    }
  }, [shop]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
        <p className="text-gray-600">Connexion en cours...</p>
      </div>
    </div>
  );
}

export default function ShopifyRedirectPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <ShopifyRedirectContent />
    </Suspense>
  );
}

/**
 * Utilise Shopify App Bridge pour rediriger dans l'iframe
 */
function redirectWithAppBridge(shop: string) {
  // Charger dynamiquement le script Shopify App Bridge si pas déjà chargé
  if (!(window as any).shopify) {
    const script = document.createElement("script");
    script.src = "https://cdn.shopify.com/shopifycloud/app-bridge.js";
    script.onload = () => {
      performAppBridgeRedirect(shop);
    };
    document.head.appendChild(script);
  } else {
    performAppBridgeRedirect(shop);
  }
}

function performAppBridgeRedirect(shop: string) {
  try {
    const shopifyAppBridge = (window as any).shopify;

    if (!shopifyAppBridge) {
      throw new Error("Shopify App Bridge not loaded");
    }

    // Initialiser App Bridge
    const app = shopifyAppBridge.createApp({
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY,
      host: btoa(`${shop}/admin`), // Base64 encode du host
    });

    // Rediriger vers la page principale de l'app dans Shopify admin
    const Redirect = shopifyAppBridge.actions.Redirect;
    const redirect = Redirect.create(app);

    // Option 1: Rediriger vers une route spécifique de votre app
    redirect.dispatch(Redirect.Action.APP, "/dashboard");

    // Option 2: Rediriger vers une URL externe (si besoin)
    // redirect.dispatch(Redirect.Action.REMOTE, window.location.origin + "/dashboard");

  } catch (error) {
    console.error("App Bridge redirect failed:", error);
    // Fallback: navigation standard
    window.location.href = "/dashboard";
  }
}
