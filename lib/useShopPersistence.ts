"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { logger } from "@/lib/logger";

export function useShopPersistence() {
  const searchParams = useSearchParams();
  const [currentShop, setCurrentShop] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer le shop depuis l'URL
    const shopFromUrl = searchParams.get("shop");

    if (shopFromUrl) {
      // Sauvegarder dans localStorage
      localStorage.setItem("shopDomain", shopFromUrl);
      setCurrentShop(shopFromUrl);
    } else {
      // Récupérer depuis localStorage
      const shopFromStorage = localStorage.getItem("shopDomain");
      if (shopFromStorage) {
        setCurrentShop(shopFromStorage);
      }
    }
  }, [searchParams]);

  // Function pour ajouter le shop à n'importe quel lien
  const addShopToUrl = (url: string): string => {
    if (!currentShop) return url;

    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}shop=${currentShop}`;
  };

  // Function pour naviguer avec le shop
  const navigateWithShop = (url: string) => {
    const urlWithShop = addShopToUrl(url);
    window.location.href = urlWithShop;
  };

  return {
    currentShop,
    addShopToUrl,
    navigateWithShop,
  };
}

// Hook pour les composants qui ont besoin du shopDomain
export function useCurrentShop(): string | null {
  const { currentShop } = useShopPersistence();
  return currentShop;
}
