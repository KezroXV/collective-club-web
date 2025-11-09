/**
 * Utilitaires pour Shopify App Bridge et Session Tokens côté client
 */

/**
 * Récupère le session token Shopify depuis App Bridge
 * À utiliser côté client (composants React)
 */
export async function getShopifySessionToken(): Promise<string | null> {
  try {
    // Vérifier si nous sommes dans un environnement navigateur
    if (typeof window === "undefined") {
      return null;
    }

    // Importer App Bridge dynamiquement (évite les erreurs SSR)
    const { default: createApp } = await import("@shopify/app-bridge");
    const { getSessionToken } = await import("@shopify/app-bridge/utilities");

    // Récupérer les paramètres nécessaires
    const params = new URLSearchParams(window.location.search);
    const host = params.get("host");
    const shop = params.get("shop");

    if (!host || !shop) {
      console.warn("Missing host or shop parameters for App Bridge");
      return null;
    }

    // Créer l'instance App Bridge
    const app = createApp({
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
      host,
    });

    // Récupérer le session token
    const token = await getSessionToken(app);
    return token;
  } catch (error) {
    console.error("Failed to get Shopify session token:", error);
    return null;
  }
}

/**
 * Hook personnalisé pour fetch avec authentification Shopify
 * Ajoute automatiquement le session token dans les headers
 */
export async function shopifyAuthenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getShopifySessionToken();

  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
