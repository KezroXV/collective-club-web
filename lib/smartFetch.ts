/**
 * Smart Fetch - Détecte automatiquement le contexte et utilise la bonne méthode
 * - Si embedded Shopify (params ?shop= et ?host=) : utilise shopifyAuthenticatedFetch
 * - Sinon : utilise fetch normal (cookies NextAuth)
 */

import { shopifyAuthenticatedFetch } from "./shopifyAppBridge";

/**
 * Détecte si l'app est embedded dans Shopify
 */
export function isShopifyEmbedded(): boolean {
  if (typeof window === "undefined") return false;
  
  const params = new URLSearchParams(window.location.search);
  const shop = params.get("shop");
  const host = params.get("host");
  
  return !!(shop && host);
}

/**
 * Fetch intelligent qui s'adapte au contexte
 * - Utilise Shopify session tokens si embedded
 * - Utilise cookies NextAuth sinon
 */
export async function smartFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // Si embedded Shopify, utiliser shopifyAuthenticatedFetch
  if (isShopifyEmbedded()) {
    return shopifyAuthenticatedFetch(url, options);
  }
  
  // Sinon, utiliser fetch normal (cookies NextAuth)
  return fetch(url, options);
}

/**
 * Hook pour utiliser smartFetch dans les composants
 */
export function useSmartFetch() {
  const isEmbedded = isShopifyEmbedded();
  
  return {
    fetch: smartFetch,
    isEmbedded,
    fetchMethod: isEmbedded ? "shopify-session-token" : "nextauth"
  };
}

