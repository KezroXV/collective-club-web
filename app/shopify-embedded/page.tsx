"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useShopifyAuth } from "@/components/ShopifyAuthProvider";
import { shopifyAuthenticatedFetch } from "@/lib/shopifyAppBridge";

interface AuthVerification {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    isShopOwner: boolean;
  };
  shop?: {
    id: string;
    domain: string;
  };
  authMethod?: "shopify-session-token" | "nextauth";
}

/**
 * Contenu de la page embedded Shopify avec App Bridge
 * Cette page démontre l'utilisation des session tokens Shopify
 */
function ShopifyEmbeddedContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, user } = useShopifyAuth();
  const [verificationData, setVerificationData] = useState<AuthVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shop = searchParams.get("shop");
  const host = searchParams.get("host");

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await shopifyAuthenticatedFetch("/api/auth/verify");
        if (response.ok) {
          const data = await response.json();
          setVerificationData(data);
        } else {
          setError("Échec de la vérification de l'authentification");
        }
      } catch (err) {
        setError("Erreur lors de la vérification");
        console.error(err);
      }
    };

    if (shop && host) {
      verifyAuth();
    }
  }, [shop, host]);

  if (!shop || !host) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Page Shopify Embedded
            </h1>
            <p className="text-gray-600 mb-6">
              Cette page doit être ouverte depuis Shopify Admin.
            </p>
            <div className="bg-gray-100 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-700 font-mono">
                Paramètres manquants :
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                {!shop && <li>• ?shop=</li>}
                {!host && <li>• ?host=</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🛍️ Shopify Embedded App
          </h1>
          <p className="text-gray-600">
            Cette page utilise App Bridge et les Session Tokens Shopify
          </p>
        </div>

        {/* Paramètres Shopify */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📋 Paramètres Shopify
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Shop Domain</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                {shop}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Host</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded break-all">
                {host}
              </dd>
            </div>
          </dl>
        </div>

        {/* État d'authentification */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🔐 État d'authentification
          </h2>
          
          {isLoading ? (
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Vérification en cours...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">❌ {error}</p>
            </div>
          ) : isAuthenticated ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">✅ Authentifié avec succès</p>
              </div>

              {verificationData && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Méthode d'authentification :
                    </p>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {verificationData.authMethod === "shopify-session-token" ? "🛍️ Shopify Session Token" : "🔑 NextAuth"}
                    </span>
                  </div>

                  {verificationData.user && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        👤 Informations utilisateur
                      </h3>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">ID</dt>
                          <dd className="mt-1 text-sm text-gray-900 font-mono">
                            {verificationData.user.id}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Nom</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {verificationData.user.name}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Email</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {verificationData.user.email}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Rôle</dt>
                          <dd className="mt-1">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {verificationData.user.role}
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Propriétaire de la boutique</dt>
                          <dd className="mt-1">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              verificationData.user.isShopOwner 
                                ? "bg-green-100 text-green-800" 
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {verificationData.user.isShopOwner ? "✓ Oui" : "✗ Non"}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}

                  {verificationData.shop && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        🏪 Informations boutique
                      </h3>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Shop ID</dt>
                          <dd className="mt-1 text-sm text-gray-900 font-mono">
                            {verificationData.shop.id}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Domain</dt>
                          <dd className="mt-1 text-sm text-gray-900 font-mono">
                            {verificationData.shop.domain}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">⏳ Non authentifié</p>
            </div>
          )}
        </div>

        {/* Informations techniques */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🔧 Informations techniques
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700">
                Utilise <code className="bg-gray-100 px-2 py-1 rounded text-xs">@shopify/app-bridge</code> pour récupérer les tokens
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700">
                Validation backend avec <code className="bg-gray-100 px-2 py-1 rounded text-xs">@shopify/shopify-api</code>
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700">
                Système hybride (Shopify + NextAuth)
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700">
                Isolation multi-tenant par shop
              </span>
            </div>
          </div>
        </div>

        {/* Actions de test */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🧪 Actions de test
          </h2>
          <div className="space-y-3">
            <button
              onClick={async () => {
                try {
                  const response = await shopifyAuthenticatedFetch("/api/auth/verify");
                  const data = await response.json();
                  alert(JSON.stringify(data, null, 2));
                } catch (err) {
                  alert("Erreur: " + err);
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Tester l'authentification
            </button>
            <Link
              href="/"
              className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg text-center transition-colors"
            >
              Aller au forum
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Page wrapper avec Suspense boundary
 */
export default function ShopifyEmbeddedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <ShopifyEmbeddedContent />
    </Suspense>
  );
}

