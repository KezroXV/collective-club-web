"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { ReactNode, useEffect } from "react";

interface ThemeWrapperProps {
  children: ReactNode;
  applyBackgroundColor?: boolean;
  className?: string;
}

export default function ThemeWrapper({ 
  children, 
  applyBackgroundColor = false,
  className = ""
}: ThemeWrapperProps) {
  const { colors, selectedFont } = useTheme();

  useEffect(() => {
    // Appliquer la police globalement
    document.body.style.fontFamily = selectedFont;
    
    // Appliquer les variables CSS au root
    const root = document.documentElement;
    root.style.setProperty('--theme-posts', colors.Posts);
    root.style.setProperty('--theme-borders', colors.Bordures);
    root.style.setProperty('--theme-bg', colors.Fond);
    root.style.setProperty('--theme-text', colors.Police);
    root.style.setProperty('--theme-font', selectedFont);
  }, [selectedFont, colors]);

  const dynamicStyle: React.CSSProperties = {
    ...(applyBackgroundColor && { backgroundColor: colors.Fond }),
    color: colors.Police,
    fontFamily: selectedFont,
    // Variables CSS pour les composants enfants
    '--theme-posts': colors.Posts,
    '--theme-borders': colors.Bordures,
    '--theme-bg': colors.Fond,
    '--theme-text': colors.Police,
  } as React.CSSProperties;

  return (
    <div 
      className={className} 
      style={dynamicStyle}
      // Variables CSS pour les enfants
      data-theme-posts={colors.Posts}
      data-theme-borders={colors.Bordures}
      data-theme-bg={colors.Fond}
      data-theme-text={colors.Police}
    >
      {children}
    </div>
  );
}