'use client';

import Link from 'next/link';
import { useShopPersistence } from '@/lib/useShopPersistence';
import { ReactNode } from 'react';

interface ShopLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Composant Link qui ajoute automatiquement le paramètre shop
 * Remplace tous les Link de Next.js dans l'app
 */
export function ShopLink({ href, children, className, onClick }: ShopLinkProps) {
  const { addShopToUrl } = useShopPersistence();
  
  const urlWithShop = addShopToUrl(href);
  
  return (
    <Link href={urlWithShop} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

/**
 * Hook pour les navigations programmatiques
 */
export function useShopNavigation() {
  const { navigateWithShop } = useShopPersistence();
  
  return { navigateWithShop };
}