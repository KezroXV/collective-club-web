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
    if (!shop) {
      // Pas de shop param, rediriger vers dashboard standard
      window.location.href = "/dashboard";
      return;
    }

    // Construire l'URL de l'app Shopify embarquée
    const shopifyAppUrl = `https://${shop}/admin/apps/${process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || ""}`;

    // Attendre un peu pour s'assurer que la session est bien créée
    setTimeout(() => {
      // Rediriger vers l'admin Shopify qui va recharger l'app dans l'iframe
      window.location.href = shopifyAppUrl;
    }, 500);
  }, [shop]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
        <p className="text-gray-600">Connexion réussie ! Redirection vers Shopify...</p>
        {shop && (
          <p className="text-sm text-gray-500 mt-2">{shop}</p>
        )}
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
