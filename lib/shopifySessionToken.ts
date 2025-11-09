/**
 * Validation des session tokens Shopify
 * Documentation: https://shopify.dev/docs/apps/auth/oauth/session-tokens
 */

import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import "@shopify/shopify-api/adapters/node";

// Initialiser Shopify API
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: [],
  hostName: process.env.NEXT_PUBLIC_APP_URL?.replace("https://", "") || "localhost:3000",
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
});

export interface ShopifySessionPayload {
  iss: string; // https://example.myshopify.com/admin
  dest: string; // https://example.myshopify.com
  aud: string; // API key
  sub: string; // User ID
  exp: number; // Expiration timestamp
  nbf: number; // Not before timestamp
  iat: number; // Issued at timestamp
  jti: string; // JWT ID
  sid: string; // Session ID
}

/**
 * Valide un session token Shopify JWT
 * @param token - Le session token à valider
 * @returns Le payload décodé si valide, null sinon
 */
export async function validateShopifySessionToken(
  token: string
): Promise<ShopifySessionPayload | null> {
  try {
    // Utiliser la méthode de validation de @shopify/shopify-api
    const payload = await shopify.session.decodeSessionToken(token);

    // Vérifier que le token n'est pas expiré
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.error("Session token expired");
      return null;
    }

    // Vérifier que le token est déjà valide
    if (payload.nbf > now) {
      console.error("Session token not yet valid");
      return null;
    }

    return payload as ShopifySessionPayload;
  } catch (error) {
    console.error("Failed to validate Shopify session token:", error);
    return null;
  }
}

/**
 * Extrait le shop domain depuis le payload du session token
 * @param payload - Le payload décodé
 * @returns Le shop domain (ex: example.myshopify.com)
 */
export function extractShopFromPayload(payload: ShopifySessionPayload): string {
  // Le dest contient https://example.myshopify.com
  const url = new URL(payload.dest);
  return url.hostname;
}

/**
 * Extrait l'user ID Shopify depuis le payload
 * @param payload - Le payload décodé
 * @returns L'ID utilisateur Shopify
 */
export function extractUserIdFromPayload(payload: ShopifySessionPayload): string {
  return payload.sub;
}
