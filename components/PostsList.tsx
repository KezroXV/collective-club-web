/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import PostCard from "@/components/PostCard";
import PostCardSkeleton from "@/components/PostCardSkeleton";
import EmptyState from "@/components/EmptyState";

type ReactionType = "LIKE" | "LOVE" | "LAUGH" | "WOW" | "APPLAUSE";

interface Post {
  id: string;
  title: string;
  content: string;
  slug?: string;
  imageUrl?: string;
  isPinned?: boolean;
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
  reactions?: Array<{
    type: ReactionType;
    count: number;
  }>;
  userReaction?: ReactionType | null;
  createdAt: string;
}

interface PostsListProps {
  posts: Post[];
  currentUser?: any;
  onVote?: () => void;
  searchQuery: string;
  selectedCategory: string;
  isLoading?: boolean;
}

export default function PostsList({
  posts,
  currentUser,
  onVote,
  searchQuery,
  selectedCategory,
  isLoading = false,
}: PostsListProps) {
  const hasFilters = Boolean(searchQuery || selectedCategory !== "all");

  // Show skeletons while loading
  if (isLoading) {
    return (
      <div className="space-y-0 bg-transparent">
        {[...Array(3)].map((_, index) => (
          <PostCardSkeleton key={index} isLast={index === 2} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return <EmptyState hasFilters={hasFilters} currentUser={currentUser} />;
  }

  return (
    <div className="space-y-0 bg-transparent">
      {posts.map((post, index) => (
        <PostCard
          key={post.id}
          post={{ ...post, slug: post.slug ?? "" }}
          currentUser={currentUser}
          onVote={onVote}
          isLast={index === posts.length - 1}
        />
      ))}
    </div>
  );
}
