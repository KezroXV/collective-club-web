import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentShopId, createDefaultRolesForShop } from "@/lib/shop-context";

/**
 * Endpoint de callback OAuth Google personnalisé
 * Gère la détection du contexte Shopify embedded vs front public
 * et redirige l'utilisateur vers la bonne interface
 */

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
  refresh_token?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Gérer les erreurs OAuth
    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/auth/error?error=${error}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/auth/error?error=missing_code", request.url)
      );
    }

    // 1. DÉTECTION DU CONTEXTE (Shopify embedded vs Front public)
    const isShopifyEmbedded = detectShopifyContext(request, state);

    console.log("🔍 Context detected:", { isShopifyEmbedded, state });

    // 2. ÉCHANGER LE CODE CONTRE UN ACCESS TOKEN GOOGLE
    const tokenResponse = await exchangeCodeForToken(code, request.url);

    if (!tokenResponse.access_token) {
      throw new Error("Failed to get access token from Google");
    }

    // 3. RÉCUPÉRER LES INFORMATIONS UTILISATEUR GOOGLE
    const userInfo = await fetchGoogleUserInfo(tokenResponse.access_token);

    if (!userInfo.email || !userInfo.email_verified) {
      return NextResponse.redirect(
        new URL("/auth/error?error=email_not_verified", request.url)
      );
    }

    // 4. RÉCUPÉRER LE SHOP ID (obligatoire pour multi-tenant)
    const shopId = await getCurrentShopId();

    if (!shopId) {
      console.error("❌ No shopId available during OAuth callback");
      return NextResponse.redirect(
        new URL("/auth/error?error=missing_shop", request.url)
      );
    }

    // 5. CRÉER OU RÉCUPÉRER L'UTILISATEUR DANS CE SHOP
    const user = await findOrCreateUser(
      userInfo,
      shopId,
      tokenResponse
    );

    // 6. CRÉER LA SESSION JWT (compatible NextAuth)
    const sessionToken = await createSessionToken(user);

    // 7. DÉFINIR LES COOKIES DE SESSION
    const response = await createSessionResponse(
      request,
      sessionToken,
      user,
      shopId,
      isShopifyEmbedded
    );

    // 8. REDIRECTION SELON LE CONTEXTE
    const redirectUrl = getRedirectUrl(
      isShopifyEmbedded,
      state,
      request.url
    );

    console.log("✅ Redirecting to:", redirectUrl);

    return NextResponse.redirect(redirectUrl, response);

  } catch (error) {
    console.error("❌ OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(`/auth/error?error=callback_failed`, request.url)
    );
  }
}

/**
 * Détecte si la requête vient d'un contexte Shopify embedded
 */
function detectShopifyContext(request: NextRequest, state: string | null): boolean {
  // Méthode 1: Vérifier le state parameter (si vous l'encodez avec "shopify")
  if (state && state.includes("shopify")) {
    return true;
  }

  // Méthode 2: Vérifier les cookies Shopify
  const cookieStore = request.cookies;
  const shopifySessionCookie = cookieStore.get("shopify_app_session");
  if (shopifySessionCookie) {
    return true;
  }

  // Méthode 3: Vérifier le referer header
  const referer = request.headers.get("referer") || "";
  if (referer.includes("admin.shopify.com") || referer.includes("myshopify.com")) {
    return true;
  }

  // Méthode 4: Vérifier un cookie custom défini lors de l'ouverture de l'iframe
  const contextCookie = cookieStore.get("auth_context");
  if (contextCookie?.value === "shopify") {
    return true;
  }

  // Par défaut: contexte public
  return false;
}

/**
 * Échange le code OAuth contre un access token Google
 */
async function exchangeCodeForToken(
  code: string,
  requestUrl: string
): Promise<GoogleTokenResponse> {
  const redirectUri = `${new URL(requestUrl).origin}/api/auth/callback/google`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error("Google token exchange failed:", error);
    throw new Error("Failed to exchange code for token");
  }

  return tokenResponse.json();
}

/**
 * Récupère les informations utilisateur depuis Google
 */
async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const userInfoResponse = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!userInfoResponse.ok) {
    throw new Error("Failed to fetch user info from Google");
  }

  return userInfoResponse.json();
}

/**
 * Trouve ou crée un utilisateur dans le shop
 */
async function findOrCreateUser(
  userInfo: GoogleUserInfo,
  shopId: string,
  tokenResponse: GoogleTokenResponse
) {
  // Vérifier si l'utilisateur existe déjà dans ce shop
  let user = await prisma.user.findFirst({
    where: {
      email: userInfo.email,
      shopId: shopId,
    },
  });

  if (!user) {
    // ✅ SÉCURITÉ : Vérifier que les rôles existent pour ce shop
    const rolesCount = await prisma.role.count({
      where: { shopId: shopId },
    });

    if (rolesCount === 0) {
      console.log(`⚠️ Rôles manquants pour shopId ${shopId}, création automatique...`);
      await createDefaultRolesForShop(shopId);
    }

    // Vérifier si un admin existe déjà
    const existingAdmin = await prisma.user.findFirst({
      where: {
        shopId: shopId,
        isShopOwner: true,
      },
    });

    const role = !existingAdmin ? "ADMIN" : "MEMBER";
    const isShopOwner = !existingAdmin;

    // Créer nouvel utilisateur avec shopId OBLIGATOIRE
    user = await prisma.user.create({
      data: {
        email: userInfo.email,
        name: userInfo.name,
        image: userInfo.picture,
        shopId: shopId,
        role: role,
        isShopOwner: isShopOwner,
      },
    });

    // ✅ Mettre à jour l'ownerId du shop si c'est le premier admin
    if (role === "ADMIN" && isShopOwner) {
      await prisma.shop.update({
        where: { id: shopId },
        data: { ownerId: user.id },
      });
    }
  }

  // Créer ou mettre à jour l'Account Google pour ce user
  const existingAccount = await prisma.account.findFirst({
    where: {
      provider: "google",
      providerAccountId: userInfo.sub,
      shopId: shopId,
    },
  });

  if (!existingAccount) {
    await prisma.account.create({
      data: {
        userId: user.id,
        type: "oauth",
        provider: "google",
        providerAccountId: userInfo.sub,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + tokenResponse.expires_in,
        token_type: tokenResponse.token_type,
        scope: tokenResponse.scope,
        id_token: tokenResponse.id_token,
        shopId: shopId,
      },
    });
  } else {
    // Mettre à jour le token
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || existingAccount.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + tokenResponse.expires_in,
      },
    });
  }

  return user;
}

/**
 * Crée un token de session JWT (compatible NextAuth)
 * Note: Pour une vraie implémentation, utiliser `encode` de next-auth/jwt
 */
async function createSessionToken(user: any): Promise<string> {
  // Import dynamique pour éviter les erreurs de build
  const { encode } = await import("next-auth/jwt");

  const token = await encode({
    token: {
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.image,
      role: user.role,
      isShopOwner: user.isShopOwner,
      shopId: user.shopId,
    },
    secret: process.env.NEXTAUTH_SECRET!,
  });

  return token;
}

/**
 * Crée la response avec les cookies de session
 */
async function createSessionResponse(
  request: NextRequest,
  sessionToken: string,
  user: any,
  shopId: string,
  isShopifyEmbedded: boolean
): Promise<NextResponse> {
  const response = new NextResponse();

  // Cookie NextAuth session token
  const cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax" | "none" | "strict";
    path: string;
    maxAge: number;
  } = {
    httpOnly: true,
    secure: true,
    sameSite: isShopifyEmbedded ? "none" : "lax", // ✅ CRITICAL pour Shopify iframe
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  };

  // Cookie principal de session NextAuth
  response.cookies.set(
    "next-auth.session-token",
    sessionToken,
    cookieOptions
  );

  // Cookie shopDomain pour getCurrentShopId()
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { shopDomain: true },
  });

  if (shop) {
    response.cookies.set(
      "shopDomain",
      shop.shopDomain,
      {
        ...cookieOptions,
        httpOnly: false, // Accessible en JS si besoin
      }
    );
  }

  return response;
}

/**
 * Détermine l'URL de redirection selon le contexte
 */
function getRedirectUrl(
  isShopifyEmbedded: boolean,
  state: string | null,
  requestUrl: string
): URL {
  const baseUrl = new URL(requestUrl).origin;

  if (isShopifyEmbedded) {
    // CONTEXTE SHOPIFY EMBEDDED

    // Extraire le shop domain depuis le state si disponible
    let shopDomain = "your-shop"; // Fallback

    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        shopDomain = stateData.shop || shopDomain;
      } catch {
        // State n'est pas du JSON, peut-être juste "shopify_<shop>"
        const match = state.match(/shopify_(.+)/);
        if (match) {
          shopDomain = match[1];
        }
      }
    }

    // Option 1: Rediriger vers une page qui utilise Shopify App Bridge
    // Cette page va faire un redirect client-side dans l'iframe
    return new URL(`/auth/shopify-redirect?shop=${shopDomain}`, baseUrl);

    // Option 2: Rediriger directement vers l'admin Shopify (peut ne pas fonctionner en iframe)
    // const shopifyAppUrl = `https://admin.shopify.com/store/${shopDomain.replace('.myshopify.com', '')}/apps/${process.env.SHOPIFY_APP_HANDLE}`;
    // return new URL(shopifyAppUrl);

  } else {
    // CONTEXTE FRONT PUBLIC
    return new URL("/dashboard", baseUrl);
  }
}
