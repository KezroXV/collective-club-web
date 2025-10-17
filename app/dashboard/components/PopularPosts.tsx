"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Post {
  id: string;
  title: string;
  commentsCount: number;
  viewsCount?: number;
}

interface PopularPostsProps {
  shopId: string;
  refreshTrigger?: number; // Trigger pour forcer le refresh
}

export default function PopularPosts({
  shopId,
  refreshTrigger,
}: PopularPostsProps) {
  const borderColor = "#E5E7EB";
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPopularPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/posts?sortBy=popular", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const formattedPosts =
        data.posts?.slice(0, 3).map((post: any) => ({
          id: post.id,
          title: post.title,
          commentsCount: post._count.comments,
          viewsCount: post._count.reactions, // Using reactions as engagement metric
        })) || [];

      setPosts(formattedPosts);
    } catch (error) {
      console.error("Error fetching popular posts:", error);
      setError("Erreur lors du chargement des posts populaires");
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPopularPosts();

    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(fetchPopularPosts, 30 * 1000);

    return () => clearInterval(interval);
  }, [shopId, refreshTrigger]);

  if (isLoading) {
    return (
      <Card className="hover:shadow-sm" style={{ borderColor }}>
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Communautés phares
          </h3>
          <div className="space-y-3 sm:space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 sm:h-4 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-2.5 sm:h-3 w-1/2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="hover:shadow-sm" style={{ borderColor }}>
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Communautés phares
          </h3>
          <p className="text-xs sm:text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-sm" style={{ borderColor }}>
      <CardContent className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          Communautés phares
        </h3>

        {posts.length === 0 ? (
          <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-800">
            <p>Un espace pour les ecommerçants dans la cosmétique</p>
            <hr className="border-[1px]" style={{ borderColor }} />
            <p>
              Débutants : Envoyez tous vos conseils ici sur comment gérer sa
              boutique
            </p>
            <hr className="border-[1px]" style={{ borderColor }} />
            <p>Quels sont vos objectifs ?</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-800">
            {posts.slice(0, 3).map((post, index) => (
              <div key={post.id}>
                <p className="line-clamp-2">{post.title}</p>
                {index < posts.slice(0, 3).length - 1 && (
                  <hr
                    className="border-[1px] mt-3 sm:mt-4"
                    style={{ borderColor }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
