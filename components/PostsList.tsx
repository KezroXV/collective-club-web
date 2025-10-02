/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import PostCard from "@/components/PostCard";
import EmptyState from "@/components/EmptyState";

interface Post {
  id: string;
  title: string;
  content: string;
  slug?: string;
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
    avatar?: string;
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

interface PostsListProps {
  posts: Post[];
  currentUser?: any;
  onVote?: () => void;
  searchQuery: string;
  selectedCategory: string;
}

export default function PostsList({
  posts,
  currentUser,
  onVote,
  searchQuery,
  selectedCategory,
}: PostsListProps) {
  const hasFilters = Boolean(searchQuery || selectedCategory !== "all");

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
