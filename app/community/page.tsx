"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useAutoRefresh } from "@/lib/hooks/useAutoRefresh";
import PostCard from "@/components/PostCard";
import PostCardSkeleton from "@/components/PostCardSkeleton";
import ThemeWrapper from "@/components/ThemeWrapper";
import CreatePostModal from "@/components/CreatePostModal";
import SearchBar from "./components/SearchBar";
import CommunityEmptyState from "./components/CommunityEmptyState";
import UserInfoCard from "./components/UserInfoCard";
import Header from "@/components/Header";

type ReactionType = "LIKE" | "LOVE" | "LAUGH" | "WOW" | "APPLAUSE";

interface Post {
  id: string;
  title: string;
  content: string;
  slug?: string;
  imageUrl?: string;
  isPinned?: boolean;
  author: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  category?: {
    id: string;
    name: string;
    color: string;
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
  reactions?: Array<{
    type: ReactionType;
    count: number;
  }>;
  userReaction?: ReactionType | null;
  createdAt: string;
}

function CommunityPageContent() {
  const { currentUser } = useCurrentUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (currentUser?.id) {
        params.append("userId", currentUser.id);
      }

      const response = await fetch(`/api/posts?${params}`);
      if (response.ok) {
        const data = await response.json();
        const postsArray = data.posts || data;
        setPosts(postsArray);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentUser?.id]);

  // Auto-refresh toutes les 10 secondes
  useAutoRefresh(fetchPosts, { enabled: true, interval: 10000 });

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    return posts
      .filter((post) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query) ||
          post.author.name.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (sortBy === "popular") {
          const aPopularity = a._count.comments + a._count.reactions;
          const bPopularity = b._count.comments + b._count.reactions;
          return bPopularity - aPopularity;
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [posts, searchQuery, sortBy]);

  return (
    <ThemeWrapper applyBackgroundColor={true} className="min-h-screen">
      {/* Header */}
      <Header />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="h-8 sm:h-9 px-2 sm:px-3"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Retour</span>
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold truncate">
                Forum Communautaire
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                <span className="hidden sm:inline">
                  Partagez vos idées et discutez •{" "}
                </span>
                {posts.length} posts
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-4 w-full sm:w-auto text-sm"
            disabled={!currentUser}
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Nouveau post</span>
          </Button>
        </div>

        {/* User Info */}
        {currentUser && <UserInfoCard user={currentUser} />}

        {/* Create Post Modal */}
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onPostCreated={fetchPosts}
        />

        {/* Search and Filter Bar */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          resultsCount={filteredAndSortedPosts.length}
          totalCount={posts.length}
        />

        {/* Posts List */}
        <div className="space-y-0 bg-transparent">
          {isLoading ? (
            // Skeleton pendant le chargement
            [...Array(3)].map((_, index) => (
              <PostCardSkeleton key={index} isLast={index === 2} />
            ))
          ) : posts.length === 0 ? (
            <CommunityEmptyState
              type="no-posts"
              onCreatePost={() => setShowCreateModal(true)}
              showCreateButton={!!currentUser}
            />
          ) : filteredAndSortedPosts.length === 0 ? (
            <CommunityEmptyState
              type="no-results"
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery("")}
            />
          ) : (
            filteredAndSortedPosts.map((post, index) => (
              <PostCard
                key={post.id}
                post={{ ...post, slug: post.slug ?? "" }}
                currentUser={currentUser ?? undefined}
                onVote={fetchPosts}
                isLast={index === filteredAndSortedPosts.length - 1}
              />
            ))
          )}
        </div>
      </div>
    </ThemeWrapper>
  );
}

export default function CommunityPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <CommunityPageContent />
    </Suspense>
  );
}
