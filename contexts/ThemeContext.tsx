"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";

interface ThemeColors {
  Posts: string;
  Bordures: string;
  Fond: string;
  Police: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  selectedFont: string;
  coverImageUrl: string | null;
  bannerImageUrl: string;
  logoImageUrl: string | null;
  updateTheme: (
    colors: ThemeColors,
    font: string,
    coverImage?: string | null,
    bannerImage?: string,
    logoImage?: string | null
  ) => void;
  loadUserTheme: (userId: string) => Promise<void>;
}

const defaultTheme: ThemeColors = {
  Posts: "#3B82F6",
  Bordures: "#E5E7EB",
  Fond: "#F9FAFB",
  Police: "#111827",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [colors, setColors] = useState<ThemeColors>(defaultTheme);
  const [selectedFont, setSelectedFont] = useState("Helvetica");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [bannerImageUrl, setBannerImageUrl] = useState<string>("/Bannière.svg");
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  const updateTheme = (
    newColors: ThemeColors,
    font: string,
    coverImage?: string | null,
    bannerImage?: string,
    logoImage?: string | null
  ) => {
    setColors(newColors);
    setSelectedFont(font);
    if (coverImage !== undefined) {
      setCoverImageUrl(coverImage);
    }
    if (bannerImage !== undefined) {
      setBannerImageUrl(bannerImage);
    }
    if (logoImage !== undefined) {
      setLogoImageUrl(logoImage);
    }

    // Sauvegarder dans localStorage
    if (session?.user?.id) {
      const themeData = {
        colors: newColors,
        selectedFont: font,
        coverImageUrl: coverImage !== undefined ? coverImage : coverImageUrl,
        bannerImageUrl: bannerImage !== undefined ? bannerImage : bannerImageUrl,
        logoImageUrl: logoImage !== undefined ? logoImage : logoImageUrl,
      };
      localStorage.setItem(`theme_${session.user.id}`, JSON.stringify(themeData));
    }
  };

  const loadUserTheme = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/customization?userId=${userId}`);
      if (response.ok) {
        const settings = await response.json();
        const newColors = {
          Posts: settings.colorPosts,
          Bordures: settings.colorBorders,
          Fond: settings.colorBg,
          Police: settings.colorText,
        };

        setColors(newColors);
        setSelectedFont(settings.selectedFont);
        setCoverImageUrl(settings.coverImageUrl);
        setBannerImageUrl(settings.bannerImageUrl || "/Bannière.svg");
        setLogoImageUrl(settings.logoImageUrl || null);

        // Sauvegarder dans localStorage après chargement depuis l'API
        const themeData = {
          colors: newColors,
          selectedFont: settings.selectedFont,
          coverImageUrl: settings.coverImageUrl,
          bannerImageUrl: settings.bannerImageUrl || "/Bannière.svg",
          logoImageUrl: settings.logoImageUrl || null,
        };
        localStorage.setItem(`theme_${userId}`, JSON.stringify(themeData));
      }
    } catch (error) {
      console.error("Erreur lors du chargement du thème:", error);
    }
  }, []);

  // Charger le thème depuis localStorage ou API
  useEffect(() => {
    if (session?.user?.id && !isThemeLoaded) {
      // D'abord essayer de charger depuis localStorage
      const savedTheme = localStorage.getItem(`theme_${session.user.id}`);

      if (savedTheme) {
        try {
          const themeData = JSON.parse(savedTheme);
          setColors(themeData.colors);
          setSelectedFont(themeData.selectedFont);
          setCoverImageUrl(themeData.coverImageUrl);
          setBannerImageUrl(themeData.bannerImageUrl);
          setLogoImageUrl(themeData.logoImageUrl || null);
          setIsThemeLoaded(true);
        } catch (error) {
          console.error("Erreur parsing localStorage theme:", error);
          // En cas d'erreur, charger depuis l'API
          loadUserTheme(session.user.id);
          setIsThemeLoaded(true);
        }
      } else {
        // Pas de thème sauvegardé, charger depuis l'API
        loadUserTheme(session.user.id);
        setIsThemeLoaded(true);
      }
    }
  }, [session?.user?.id, isThemeLoaded, loadUserTheme]);

  // Reset quand l'utilisateur change
  useEffect(() => {
    if (!session?.user?.id) {
      setIsThemeLoaded(false);
      // Reset au thème par défaut
      setColors(defaultTheme);
      setSelectedFont("Helvetica");
      setCoverImageUrl(null);
      setBannerImageUrl("/Bannière.svg");
      setLogoImageUrl(null);
    }
  }, [session?.user?.id]);

  return (
    <ThemeContext.Provider
      value={{
        colors,
        selectedFont,
        coverImageUrl,
        bannerImageUrl,
        logoImageUrl,
        updateTheme,
        loadUserTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
