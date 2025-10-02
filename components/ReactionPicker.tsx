/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";

interface ReactionPickerProps {
  postId: string;
  currentUserId: string;
  initialReactions?: any;
  onReactionUpdate?: () => void;
}

const REACTIONS = [
  { type: "LIKE", emoji: "👍", label: "J'aime" },
  { type: "LOVE", emoji: "❤️", label: "Adore" },
  { type: "LAUGH", emoji: "😂", label: "Drôle" },
  { type: "WOW", emoji: "😮", label: "Impressionnant" },
  { type: "APPLAUSE", emoji: "👏", label: "Bravo" },
];

export default function ReactionPicker({
  postId,
  currentUserId,
  initialReactions = {},
  onReactionUpdate,
}: ReactionPickerProps) {
  const [reactions, setReactions] = useState(initialReactions);
  const [loading, setLoading] = useState<string | null>(null);
  const userIsAuthenticated = Boolean(currentUserId);

  const handleReaction = async (reactionType: string) => {
    if (!currentUserId) return;

    setLoading(reactionType);
    try {
      const response = await fetch(`/api/posts/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reactionType,
          userId: currentUserId,
        }),
      });

      if (response.ok) {
        // Refresh reactions
        fetchReactions();
        onReactionUpdate?.();
      }
    } catch (error) {
      console.error("Error handling reaction:", error);
    } finally {
      setLoading(null);
    }
  };

  const fetchReactions = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/reactions`);
      if (response.ok) {
        const data = await response.json();
        setReactions(data);
      }
    } catch (error) {
      console.error("Error fetching reactions:", error);
    }
  };

  // Charger les réactions au montage et lors des changements de post
  useEffect(() => {
    fetchReactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const totalReactions = useMemo(() => {
    return Object.values(reactions || {}).reduce(
      (total: number, users: any) =>
        total + (Array.isArray(users) ? users.length : 0),
      0
    );
  }, [reactions]);

  const hasUserReacted = (reactionType: string) => {
    return reactions[reactionType]?.some(
      (user: any) => user.id === currentUserId
    );
  };

  const getUserReactionType = (): string | null => {
    for (const reaction of REACTIONS) {
      if (hasUserReacted(reaction.type)) return reaction.type;
    }
    return null;
  };

  const emojiStyle = {
    fontFamily:
      "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji','EmojiOne Color','Twemoji Mozilla',sans-serif",
  } as const;

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        {/* Chips des réactions uniquement si l'utilisateur a déjà réagi */}
        {getUserReactionType() && (
          <div className="flex flex-wrap items-center gap-1">
            {REACTIONS.map((reaction) => {
              const count = reactions?.[reaction.type]?.length || 0;
              if (count === 0) return null;
              return (
                <Button
                  key={reaction.type}
                  variant={
                    hasUserReacted(reaction.type) ? "default" : "secondary"
                  }
                  size="sm"
                  className="gap-1 h-auto py-1 px-2 text-xs"
                  onClick={() => handleReaction(reaction.type)}
                  disabled={!userIsAuthenticated || loading === reaction.type}
                  title={reaction.label}
                >
                  <span style={emojiStyle} className="text-[18px] leading-none">
                    {reaction.emoji}
                  </span>
                  {count}
                </Button>
              );
            })}
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-white px-4 py-2 rounded-full border-chart-4 text-gray-700 hover:text-gray-900 flex items-center gap-2"
              disabled={!userIsAuthenticated}
              title={
                userIsAuthenticated ? "Réagir" : "Connectez-vous pour réagir"
              }
            >
              <Heart className="h-4 w-4" />
              <span className="text-sm">{totalReactions}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={8}
            className="p-2 min-w-[220px]"
          >
            <div className="grid grid-cols-5 gap-2">
              {REACTIONS.map((reaction) => (
                <DropdownMenuItem
                  key={reaction.type}
                  className="p-2 justify-center cursor-pointer"
                  onClick={() => handleReaction(reaction.type)}
                  disabled={!userIsAuthenticated || loading === reaction.type}
                >
                  <span
                    title={reaction.label}
                    className="inline-flex items-center justify-center"
                    style={emojiStyle}
                  >
                    <span className="text-[24px] leading-none">
                      {reaction.emoji}
                    </span>
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Plus de badge total séparé: le compteur est intégré au bouton coeur */}
      </div>
    </div>
  );
}
