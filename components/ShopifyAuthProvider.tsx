"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { shopifyAuthenticatedFetch } from "@/lib/shopifyAppBridge";

interface ShopifyAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  refetch: () => Promise<void>;
}

const ShopifyAuthContext = createContext<ShopifyAuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  refetch: async () => {},
});

export function useShopifyAuth() {
  return useContext(ShopifyAuthContext);
}

/**
 * Provider d'authentification pour les apps Shopify embedded
 * Utilise automatiquement les session tokens
 */
export function ShopifyAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const fetchAuth = async () => {
    try {
      setIsLoading(true);

      // Utiliser le fetch authentifié qui ajoute automatiquement le session token
      const response = await shopifyAuthenticatedFetch("/api/auth/verify");

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        setUser(data.user);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Auth fetch error:", error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuth();
  }, []);

  return (
    <ShopifyAuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        refetch: fetchAuth,
      }}
    >
      {children}
    </ShopifyAuthContext.Provider>
  );
}
