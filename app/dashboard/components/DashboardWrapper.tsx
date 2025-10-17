"use client";

import { ReactNode, useEffect } from "react";

interface DashboardWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper pour isoler le dashboard du système de thème global.
 * Réinitialise les variables CSS et les styles appliqués par ThemeContext.
 */
export default function DashboardWrapper({ children }: DashboardWrapperProps) {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Sauvegarder les valeurs actuelles du thème
    const savedStyles = {
      bg: root.style.getPropertyValue('--theme-bg'),
      borders: root.style.getPropertyValue('--theme-borders'),
      posts: root.style.getPropertyValue('--theme-posts'),
      text: root.style.getPropertyValue('--theme-text'),
      font: body.style.fontFamily,
    };

    // Forcer les valeurs par défaut du dashboard (isolées du thème)
    root.style.setProperty('--theme-bg', '#F9FAFB');
    root.style.setProperty('--theme-borders', '#E5E7EB');
    root.style.setProperty('--theme-posts', '#3B82F6');
    root.style.setProperty('--theme-text', '#111827');
    body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

    // Restaurer les valeurs du thème quand on quitte le dashboard
    return () => {
      if (savedStyles.bg) root.style.setProperty('--theme-bg', savedStyles.bg);
      if (savedStyles.borders) root.style.setProperty('--theme-borders', savedStyles.borders);
      if (savedStyles.posts) root.style.setProperty('--theme-posts', savedStyles.posts);
      if (savedStyles.text) root.style.setProperty('--theme-text', savedStyles.text);
      if (savedStyles.font) body.style.fontFamily = savedStyles.font;
    };
  }, []);

  return <>{children}</>;
}
