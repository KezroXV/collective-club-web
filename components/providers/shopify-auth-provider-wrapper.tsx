"use client";

import { ShopifyAuthProvider } from "@/components/ShopifyAuthProvider";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Wrapper conditionnel pour ShopifyAuthProvider
 * Active uniquement si l'app est embedded dans Shopify (paramètres ?shop= et ?host=)
 */
function ShopifyAuthProviderContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop");
  const host = searchParams.get("host");

  // Si les paramètres Shopify sont présents, utiliser ShopifyAuthProvider
  const isShopifyEmbedded = !!(shop && host);

  if (isShopifyEmbedded) {
    return <ShopifyAuthProvider>{children}</ShopifyAuthProvider>;
  }

  // Sinon, retourner les enfants directement (mode standalone/NextAuth)
  return <>{children}</>;
}

/**
 * Wrapper avec Suspense pour gérer useSearchParams
 */
export function ShopifyAuthProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<>{children}</>}>
      <ShopifyAuthProviderContent>{children}</ShopifyAuthProviderContent>
    </Suspense>
  );
}

