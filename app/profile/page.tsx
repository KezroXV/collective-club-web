"use client";

import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ThemeWrapper from "@/components/ThemeWrapper";
import AuthorSidebar from "@/app/community/components/AuthorSidebar";
import ProfileEditForm from "./components/ProfileEditForm";
import { useTheme } from "@/contexts/ThemeContext";

interface AuthorPost {
  id: string;
  title: string;
  slug?: string;
  createdAt: string;
  _count: {
    comments: number;
    reactions: number;
  };
}

interface AuthorComment {
  id: string;
  content: string;
  createdAt: string;
  post: {
    id: string;
    title: string;
    slug?: string;
  };
  _count: {
    reactions: number;
  };
}

interface BadgeInfo {
  id: string;
  name: string;
  imageUrl: string;
  requiredPoints: number;
  unlocked: boolean;
}

export default function ProfilePage() {
  const { currentUser, loading } = useCurrentUser();
  const { colors } = useTheme();
  const [authorRecentPosts, setAuthorRecentPosts] = useState<AuthorPost[]>([]);
  const [authorRecentComments, setAuthorRecentComments] = useState<
    AuthorComment[]
  >([]);
  const [badges, setBadges] = useState<BadgeInfo[]>([]);
  const [points, setPoints] = useState<number>(0);
  const [loadingProfileData, setLoadingProfileData] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Charger les données du profil
  useEffect(() => {
    const loadProfileData = async () => {
      if (!currentUser) return;

      setLoadingProfileData(true);
      try {
        const response = await fetch("/api/profile/data");
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setAuthorRecentPosts(result.data.authorRecentPosts || []);
            setAuthorRecentComments(result.data.authorRecentComments || []);
            setBadges(result.data.badges || []);
            setPoints(result.data.points || 0);
          }
        }
      } catch (error) {
        // Silently handle error
      } finally {
        setLoadingProfileData(false);
      }
    };

    loadProfileData();
  }, [currentUser]);


  if (loading) {
    return (
      <ThemeWrapper applyBackgroundColor={true} className="min-h-screen">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement du profil...</p>
            </div>
          </div>
        </div>
      </ThemeWrapper>
    );
  }

  if (!currentUser) {
    return (
      <ThemeWrapper applyBackgroundColor={true} className="min-h-screen">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Profil non trouvé
            </h1>
            <p className="text-gray-600">
              Vous devez être connecté pour voir votre profil.
            </p>
          </div>
        </div>
      </ThemeWrapper>
    );
  }

  return (
    <ThemeWrapper applyBackgroundColor={true} className="min-h-screen">
      <Header />

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profil</h1>
                <p className="text-gray-600">
                  Vous pouvez gérer votre profil ici
                </p>
              </div>
              <ProfileEditForm
                currentUser={currentUser}
                borderColor={colors.Bordures}
              />
            </div>
            {/* Colonne droite - Sidebar avec infos utilisateur */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Aperçu du profil
                </h1>
                <p className="text-gray-600">
                  Voici comment votre profil est affiché au public.
                </p>
              </div>
              <AuthorSidebar
                author={{
                  id: currentUser.id,
                  name: currentUser.name || "",
                  email: currentUser.email || "",
                  image: currentUser.image || undefined,
                  createdAt:
                    (currentUser as any).createdAt || new Date().toISOString(),
                }}
                authorRecentPosts={authorRecentPosts}
                authorRecentComments={authorRecentComments}
                currentUser={null} // Pas de bouton follow sur son propre profil
                getInitials={getInitials}
                formatDate={formatDate}
                badges={badges}
                points={points}
              />
            </div>
          </div>
        </div>
      </div>
    </ThemeWrapper>
  );
}
