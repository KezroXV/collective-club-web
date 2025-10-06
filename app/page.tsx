"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { RequireAuth } from "@/components/auth/RequireAuth";
import HeroBanner from "@/components/HeroBanner";
import CategoryFilter from "@/components/CategoryFilter";
import CreatePostModal from "@/components/CreatePostModal";
import PostsList from "@/components/PostsList";
import ThemeWrapper from "@/components/ThemeWrapper";
import { useShopPersistence } from "@/lib/useShopPersistence";
import { useTheme } from "@/contexts/ThemeContext";
import { useAutoRefresh } from "@/lib/hooks/useAutoRefresh";
// ReactionPicker retiré pour n'afficher que coeur + commentaires

interface Post {
  id: string;
  slug?: string;
  title: string;
  content: string;
  imageUrl?: string;
  category?: {
    id: string;
    name: string;
    color: string;
  };
  author: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  poll?: {
    id: string;
    question: string;
    options: Array<{
      id: string;
      text: string;
      order: number;
      _count: { votes: number };
    }>;
    _count: { votes: number };
  } | null;
  _count: {
    comments: number;
    reactions: number;
  };
  createdAt: string;
}

function HomePageContent() {
  const { currentUser } = useCurrentUser();
  const { colors } = useTheme();
  const searchParams = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [pinnedCount, setPinnedCount] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  // 🏪 Initialiser la persistance du shop
  const { currentShop } = useShopPersistence();

  // Fetch posts
  const fetchPosts = async () => {
    try {
      setIsLoadingPosts(true);
      const params = new URLSearchParams();
      if (showPinnedOnly) {
        params.append("pinnedOnly", "true");
      }
      if (currentUser?.id) {
        params.append("userId", currentUser.id);
      }

      const response = await fetch(`/api/posts?${params}`);
      const data = await response.json();
      const postsArray = data.posts || data; // Support nouvelle et ancienne structure
      const pinnedPostsCount = data.pinnedCount || 0;
      setPosts(postsArray);
      setFilteredPosts(postsArray);
      setPinnedCount(pinnedPostsCount);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [showPinnedOnly, currentUser?.id]);

  // Auto-refresh toutes les 10 secondes
  useAutoRefresh(fetchPosts, { enabled: true, interval: 10000 });

  // Écouter l'événement de pin/unpin pour rafraîchir immédiatement
  useEffect(() => {
    const handlePostPinToggled = () => {
      fetchPosts();
    };

    window.addEventListener('postPinToggled', handlePostPinToggled);
    return () => window.removeEventListener('postPinToggled', handlePostPinToggled);
  }, [showPinnedOnly, currentUser?.id]);

  // Filter posts
  // Modifier le filtering par catégorie :
  useEffect(() => {
    // Toujours cloner pour éviter les mutations in-place qui bloquent le re-render
    let filtered = [...posts];

    // Filter by category - CORRIGÉ
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (post) => post.category?.id === selectedCategory
      );
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.author.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort posts (sur une copie)
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "popular":
          const aReactions = a._count?.reactions || 0;
          const bReactions = b._count?.reactions || 0;
          return bReactions - aReactions;
        default:
          return 0;
      }
    });

    // Toujours setter une nouvelle référence
    setFilteredPosts(sorted);
  }, [posts, selectedCategory, searchQuery, sortBy]);

  return (
    <ThemeWrapper applyBackgroundColor={true} className="min-h-screen">
      {/* Header */}
      <Header />

      {/* Hero Banner */}
      <HeroBanner />
      {/* Section unifiée: Filtres + Posts */}
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div
            className="max-w-4xl mx-auto rounded-[16px] sm:rounded-[22px] hover:shadow-sm overflow-hidden bg-white"
            style={{
              border: `1px solid ${colors.Bordures}`,
            }}
          >
            <div
              className="p-4 sm:p-6"
              style={{ backgroundColor: colors.Fond }}
            >
              <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                onSearch={setSearchQuery}
                onCreatePost={() => setShowCreateModal(true)}
                sortBy={sortBy}
                onSortChange={setSortBy}
                showPinnedOnly={showPinnedOnly}
                onPinnedFilterChange={setShowPinnedOnly}
                pinnedCount={pinnedCount}
              />
              {/* Séparateur entre filtres et posts */}
              <div
                className="w-full h-px"
                style={{ backgroundColor: colors.Bordures }}
              ></div>

              {/* Posts Content */}
              <PostsList
                posts={filteredPosts}
                currentUser={currentUser ?? undefined}
                onVote={fetchPosts}
                searchQuery={searchQuery}
                selectedCategory={selectedCategory}
                isLoading={isLoadingPosts}
              />
            </div>
          </div>
        </div>
      </div>
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={fetchPosts}
      />
    </ThemeWrapper>
  );
}

export default function HomePage() {
  return (
    <RequireAuth>
      <HomePageContent />
    </RequireAuth>
  );
}
