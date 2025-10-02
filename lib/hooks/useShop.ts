/**
 * Hook pour récupérer automatiquement la boutique courante
 */

import { useState, useEffect } from "react";

interface Shop {
  id: string;
  shopDomain: string;
  shopName: string;
}

export function useShop() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCurrentShop() {
      try {
        setIsLoading(true);
        setError(null);

        // Récupérer le shop depuis l'URL ou les cookies
        const urlParams = new URLSearchParams(window.location.search);
        let shopDomain = urlParams.get("shop");

        // Si pas dans l'URL, chercher dans les cookies
        if (!shopDomain) {
          const cookies = document.cookie.split(";");
          const shopCookie = cookies.find((c) =>
            c.trim().startsWith("shopDomain=")
          );
          if (shopCookie) {
            shopDomain = shopCookie.split("=")[1].trim();
          }
        }

        // Fallback pour le développement
        if (!shopDomain) {
          shopDomain = "collective-club.myshopify.com";
        }

        // Récupérer les infos de la boutique depuis l'API
        const response = await fetch(`/api/shop/current?shop=${shopDomain}`);
        if (!response.ok) {
          throw new Error("Shop not found");
        }

        const shopData = await response.json();
        setShop(shopData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCurrentShop();
  }, []);

  return {
    shop,
    shopDomain: shop?.shopDomain || null,
    shopId: shop?.id || null,
    isLoading,
    error,
  };
}
