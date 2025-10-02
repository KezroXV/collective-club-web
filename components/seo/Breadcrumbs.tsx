/**
 * 🔍 Composant Breadcrumbs SEO
 * Génère des breadcrumbs accessibles avec Schema.org markup
 */

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbStructuredData } from './StructuredData';

export interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage?: boolean;
}

interface SEOBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  homeLabel?: string;
  baseUrl?: string;
}

/**
 * Composant Breadcrumbs avec support SEO complet
 */
export function SEOBreadcrumbs({ 
  items, 
  className = "",
  showHome = true,
  homeLabel = "Accueil",
  baseUrl
}: SEOBreadcrumbsProps) {
  // Ajouter l'accueil au début si demandé
  const allItems: BreadcrumbItem[] = showHome 
    ? [{ label: homeLabel, href: '/' }, ...items]
    : items;

  return (
    <>
      {/* Données structurées Schema.org */}
      <BreadcrumbStructuredData items={allItems} baseUrl={baseUrl} />
      
      {/* Breadcrumbs visuels */}
      <nav 
        aria-label="Breadcrumb" 
        className={`mb-6 ${className}`}
        role="navigation"
      >
        <ol className="flex items-center space-x-2 text-sm text-gray-600 flex-wrap">
          {allItems.map((item, index) => (
            <li key={item.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight 
                  className="h-4 w-4 mx-2 text-gray-400" 
                  aria-hidden="true"
                />
              )}
              
              {item.isCurrentPage ? (
                <span 
                  className="text-gray-900 font-medium truncate max-w-xs"
                  aria-current="page"
                >
                  {index === 0 && showHome && (
                    <Home className="h-4 w-4 inline mr-1" aria-hidden="true" />
                  )}
                  {item.label}
                </span>
              ) : (
                <Link 
                  href={item.href}
                  className="hover:text-gray-900 transition-colors truncate max-w-xs"
                  title={item.label}
                >
                  {index === 0 && showHome && (
                    <Home className="h-4 w-4 inline mr-1" aria-hidden="true" />
                  )}
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/**
 * Hook utilitaire pour générer des breadcrumbs pour les posts
 */
export function usePostBreadcrumbs(post?: {
  title: string;
  slug?: string;
  category?: { id: string; name: string };
}): BreadcrumbItem[] {
  if (!post) return [];

  const items: BreadcrumbItem[] = [
    { label: 'Community', href: '/community' }
  ];

  // Note: Catégorie supprimée du breadcrumb (route non implémentée)

  // Ajouter le post actuel
  items.push({
    label: post.title,
    href: post.slug ? `/community/posts/${post.slug}` : '/community',
    isCurrentPage: true
  });

  return items;
}

/**
 * Hook utilitaire pour générer des breadcrumbs pour les catégories
 */
export function useCategoryBreadcrumbs(category?: {
  name: string;
  id: string;
}): BreadcrumbItem[] {
  if (!category) return [];

  return [
    { label: 'Community', href: '/community' },
    // Note: Route catégorie non implémentée, pas de lien
    { 
      label: category.name, 
      href: '/community', // Fallback vers community
      isCurrentPage: true 
    }
  ];
}

/**
 * Breadcrumbs spécialisés pour les posts
 */
interface PostBreadcrumbsProps {
  post: {
    title: string;
    slug?: string;
    category?: { id: string; name: string };
  };
  className?: string;
  baseUrl?: string;
}

export function PostBreadcrumbs({ post, className, baseUrl }: PostBreadcrumbsProps) {
  const items = usePostBreadcrumbs(post);
  
  return (
    <SEOBreadcrumbs 
      items={items}
      className={className}
      baseUrl={baseUrl}
    />
  );
}

/**
 * Breadcrumbs spécialisés pour les catégories
 */
interface CategoryBreadcrumbsProps {
  category: {
    name: string;
    id: string;
  };
  className?: string;
  baseUrl?: string;
}

export function CategoryBreadcrumbs({ category, className, baseUrl }: CategoryBreadcrumbsProps) {
  const items = useCategoryBreadcrumbs(category);
  
  return (
    <SEOBreadcrumbs 
      items={items}
      className={className}
      baseUrl={baseUrl}
    />
  );
}

/**
 * Breadcrumbs pour le forum général
 */
interface ForumBreadcrumbsProps {
  currentPage?: string;
  className?: string;
  baseUrl?: string;
}

export function ForumBreadcrumbs({ currentPage, className, baseUrl }: ForumBreadcrumbsProps) {
  const items: BreadcrumbItem[] = [
    { label: 'Community', href: '/community', isCurrentPage: !currentPage }
  ];

  if (currentPage) {
    items.push({
      label: currentPage,
      href: '/community', // href générique pour les sous-pages
      isCurrentPage: true
    });
  }

  return (
    <SEOBreadcrumbs 
      items={items}
      className={className}
      baseUrl={baseUrl}
    />
  );
}