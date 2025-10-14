/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Share2, Heart, Pin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import PollDisplay from "@/components/PollDisplay";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

type ReactionType = "LIKE" | "LOVE" | "LAUGH" | "WOW" | "APPLAUSE";

interface ReactionData {
  type: ReactionType;
  count: number;
}

const REACTION_EMOJIS: Record<ReactionType, string> = {
  LIKE: "👍",
  LOVE: "❤️",
  LAUGH: "😂",
  WOW: "😮",
  APPLAUSE: "👏",
};

// Fonction helper pour convertir les classes Tailwind en valeurs CSS
const getCategoryColorValue = (colorClass: string): string => {
  // Si c'est déjà une couleur hexadécimale, la retourner directement
  if (colorClass.startsWith("#")) {
    return colorClass;
  }

  const colorMap: Record<string, string> = {
    "bg-blue-500": "#3b82f6",
    "bg-orange-500": "#f97316",
    "bg-emerald-500": "#10b981",
    "bg-green-500": "#22c55e",
    "bg-red-500": "#ef4444",
    "bg-violet-500": "#8b5cf6",
    "bg-purple-500": "#a855f7",
    "bg-amber-500": "#f59e0b",
    "bg-yellow-500": "#eab308",
    "bg-pink-500": "#ec4899",
    "bg-cyan-500": "#06b6d4",
    "bg-indigo-500": "#6366f1",
    "bg-teal-500": "#14b8a6",
  };

  return colorMap[colorClass] || "#3b82f6"; // Bleu par défaut
};

// Fonction pour convertir hex en rgba avec opacité
const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

interface Post {
  slug: string;
  id: string;
  title: string;
  content: string;
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
  reactions?: ReactionData[];
  userReaction?: ReactionType | null;
  createdAt: string;
}

interface PostCardProps {
  post: Post;
  currentUser?: any;
  onVote?: () => void;
  isLast?: boolean;
}

export default function PostCard({
  post,
  currentUser,
  onVote,
  isLast = false,
}: PostCardProps) {
  const { colors } = useTheme();
  const [showReactionDropdown, setShowReactionDropdown] = useState(false);
  const [localReactions, setLocalReactions] = useState(post.reactions || []);
  const [localUserReaction, setLocalUserReaction] = useState(
    post.userReaction || null
  );
  const [localReactionsCount, setLocalReactionsCount] = useState(
    post._count.reactions
  );

  // Calculer la couleur de la catégorie
  const categoryColor = post.category
    ? getCategoryColorValue(post.category.color)
    : null;

  // Helper pour obtenir les initiales
  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "?"
    );
  };

  // Helper pour formater la date avec heure
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    const timeStr = date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `Il y a ${minutes} min`;
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h • ${timeStr}`;
    } else if (diffInDays < 7) {
      return `Il y a ${Math.floor(diffInDays)}j • ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
      return `${dateStr} • ${timeStr}`;
    }
  };

  // Gérer le clic à l'extérieur pour fermer le dropdown
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Element;
    if (target?.closest(".reaction-dropdown")) {
      return;
    }
    setShowReactionDropdown(false);
  }, []);

  useEffect(() => {
    if (showReactionDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showReactionDropdown, handleClickOutside]);
  const handleShare = () => {
    const url = `${window.location.origin}/community/posts/${
      post.slug || post.id
    }`;
    navigator.clipboard.writeText(url);
    toast.success("Lien copié dans le presse-papiers !");
  };

  const handleReaction = async (type: ReactionType) => {
    if (!currentUser) {
      toast.error("Vous devez être connecté pour réagir");
      return;
    }

    setShowReactionDropdown(false);

    // Mise à jour optimiste : mettre à jour l'UI immédiatement
    const previousReaction = localUserReaction;
    const previousReactions = [...localReactions];
    const previousCount = localReactionsCount;

    // Si l'utilisateur avait déjà réagi
    if (localUserReaction === type) {
      // Retirer la réaction
      setLocalUserReaction(null);
      setLocalReactionsCount((prev) => prev - 1);
      setLocalReactions((prev) => {
        return prev
          .map((r) =>
            r.type === type ? { ...r, count: Math.max(0, r.count - 1) } : r
          )
          .filter((r) => r.count > 0);
      });
    } else {
      // Ajouter ou changer la réaction
      setLocalUserReaction(type);

      if (localUserReaction) {
        // Changer de réaction (enlever l'ancienne, ajouter la nouvelle)
        setLocalReactions((prev) => {
          const updated = prev.map((r) => {
            if (r.type === localUserReaction) {
              return { ...r, count: Math.max(0, r.count - 1) };
            }
            if (r.type === type) {
              return { ...r, count: r.count + 1 };
            }
            return r;
          });

          // Ajouter la nouvelle réaction si elle n'existe pas
          if (!updated.find((r) => r.type === type)) {
            updated.push({ type, count: 1 });
          }

          return updated.filter((r) => r.count > 0);
        });
      } else {
        // Nouvelle réaction
        setLocalReactionsCount((prev) => prev + 1);
        setLocalReactions((prev) => {
          const existing = prev.find((r) => r.type === type);
          if (existing) {
            return prev.map((r) =>
              r.type === type ? { ...r, count: r.count + 1 } : r
            );
          } else {
            return [...prev, { type, count: 1 }];
          }
        });
      }
    }

    try {
      const response = await fetch(`/api/posts/${post.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          userId: currentUser.id,
          shopId: currentUser.shopId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Mettre à jour avec les vraies données du serveur
        setLocalReactions(data.reactions || []);
        setLocalUserReaction(data.userReaction || null);
        setLocalReactionsCount(
          data.reactions?.reduce(
            (sum: number, r: ReactionData) => sum + r.count,
            0
          ) || 0
        );
        toast.success("Réaction ajoutée !");

        // Rafraîchir en arrière-plan (optionnel, pour sync avec d'autres users)
        if (onVote) {
          setTimeout(() => onVote(), 1000);
        }
      } else {
        // Rollback en cas d'erreur
        setLocalUserReaction(previousReaction);
        setLocalReactions(previousReactions);
        setLocalReactionsCount(previousCount);
        toast.error("Erreur lors de l'ajout de la réaction");
      }
    } catch (error) {
      // Rollback en cas d'erreur
      setLocalUserReaction(previousReaction);
      setLocalReactions(previousReactions);
      setLocalReactionsCount(previousCount);
      console.error("Error adding reaction:", error);
      toast.error("Erreur lors de l'ajout de la réaction");
    }
  };

  return (
    <div
      className={`pb-4 sm:pb-8 ${post.isPinned ? "relative" : ""}`}
      style={{
        ...(!isLast && {
          borderBottom: `1px solid ${colors.Bordures}`,
        }),
      }}
    >
      <Link
        href={`/community/posts/${post.slug || post.id}`}
        className="block cursor-pointer"
      >
        {/* Author info and badge */}
        <div className="flex items-start justify-between pt-3 sm:pt-6 mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar className="h-7 w-7 sm:h-9 sm:w-9 flex-shrink-0">
              <AvatarImage src={post.author.image || "/pdp.svg"} />
              <AvatarFallback
                className="text-[10px] sm:text-xs font-semibold text-white"
                style={{ backgroundColor: colors.Posts }}
              >
                {getInitials(post.author.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span
                className="text-xs sm:text-sm font-semibold truncate"
                style={{ color: colors.Police }}
              >
                {post.author.name}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-500">
                {formatDate(post.createdAt)}
              </span>
            </div>
          </div>

          {/* Badges à droite (Catégorie et Épinglé) */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Badge de catégorie */}
            {post.category && categoryColor && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 border-0"
                style={{
                  backgroundColor: hexToRgba(categoryColor, 0.1),
                  color: categoryColor,
                }}
              >
                <div
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: categoryColor }}
                />
                <span className="text-[9px] sm:text-[10px] font-semibold whitespace-nowrap">
                  {post.category.name.toUpperCase()}
                </span>
              </Badge>
            )}

            {/* Badge épinglé */}
            {post.isPinned && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 sm:gap-1.5 transition-colors px-1.5 py-0.5 sm:px-2.5 sm:py-1"
                style={{
                  backgroundColor: `${colors.Posts}15`,
                  color: colors.Posts,
                  border: `1px solid ${colors.Posts}30`
                }}
              >
                <Pin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="text-[9px] sm:text-[10px] font-semibold whitespace-nowrap">
                  ÉPINGLÉ
                </span>
              </Badge>
            )}
          </div>
        </div>

        {/* Post Title and Content */}
        <div className="mb-4 sm:mb-6">
          <h2
            className={`text-sm sm:text-[13px] md:text-[15px] mb-2 leading-tight line-clamp-2 sm:line-clamp-1 transition-colors duration-200 ${
              post.isPinned ? "font-bold" : "font-semibold"
            }`}
            style={{ color: colors.Police }}
          >
            {post.title}
          </h2>
          <p
            className="text-xs sm:text-[13px] leading-5 sm:leading-6 line-clamp-3 sm:line-clamp-2"
            style={{ color: colors.Police }}
          >
            {post.content}
          </p>
        </div>

        {/* Post Image */}
        {post.imageUrl && (
          <div className="mb-8 ">
            <div
              className="rounded-2xl overflow-hidden hover:shadow-sm"
              style={{ border: `1px solid ${colors.Bordures}` }}
            >
              <Image
                src={post.imageUrl}
                alt={post.title}
                width={702}
                height={285}
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          </div>
        )}

        {/* Poll */}
        {post.poll && (
          <div className="mb-8 ">
            <PollDisplay
              poll={post.poll}
              currentUser={currentUser}
              onVote={onVote}
            />
          </div>
        )}
      </Link>

      {/* Post Actions */}
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        {/* Reactions with dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            className={`flex items-center gap-1.5 sm:gap-3 px-2.5 sm:px-6 py-1.5 sm:py-3 h-8 sm:h-auto rounded-full border-2 transition-colors ${
              localUserReaction
                ? "text-red-600 bg-red-50"
                : "text-gray-700 bg-gray-50 hover:bg-gray-100"
            }`}
            style={{
              borderColor: colors.Bordures,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowReactionDropdown(!showReactionDropdown);
            }}
            disabled={!currentUser}
          >
            <Heart
              className={`h-3.5 w-3.5 sm:h-5 sm:w-5 stroke-2 ${
                localUserReaction ? "fill-current" : ""
              }`}
            />
            <span className="text-xs sm:text-base font-medium">
              {localReactionsCount}
            </span>
          </Button>

          {/* Dropdown des réactions */}
          {showReactionDropdown && currentUser && (
            <div className="reaction-dropdown absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
              <div className="flex gap-1 mb-2">
                {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
                  const isSelected = localUserReaction === type;
                  const reactionCount =
                    localReactions?.find((r) => r.type === type)?.count || 0;
                  return (
                    <div key={type} className="flex flex-col items-center">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleReaction(type as ReactionType);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                        }}
                        className={`p-2 rounded transition-colors text-lg relative ${
                          isSelected
                            ? "border-2"
                            : "hover:bg-gray-100"
                        }`}
                        style={isSelected ? {
                          backgroundColor: `${colors.Posts}15`,
                          borderColor: colors.Posts
                        } : {}}
                        title={type}
                      >
                        {emoji}
                        {isSelected && (
                          <div
                            className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white"
                            style={{ backgroundColor: colors.Posts }}
                          />
                        )}
                      </button>
                      <span className="text-xs text-gray-500 mt-1">
                        {reactionCount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          className="flex items-center gap-1.5 sm:gap-3 bg-gray-50 px-2.5 sm:px-6 py-1.5 sm:py-3 h-8 sm:h-auto rounded-full border-2 hover:bg-gray-100 text-gray-700"
          style={{ borderColor: colors.Bordures }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = `/community/posts/${post.slug || post.id}`;
          }}
        >
          <MessageSquare className="h-3.5 w-3.5 sm:h-5 sm:w-5 stroke-2" />
          <span className="text-xs sm:text-base font-medium">
            {post._count.comments}
          </span>
        </Button>

        <Button
          variant="outline"
          className="ml-auto flex items-center gap-1 sm:gap-2 bg-white px-2 sm:px-4 py-1.5 sm:py-2 h-8 sm:h-auto rounded-full hover:bg-gray-100 text-gray-600"
          style={{ borderColor: colors.Bordures }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleShare();
          }}
        >
          <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-xs sm:text-sm">Partager</span>
        </Button>
      </div>
    </div>
  );
}
