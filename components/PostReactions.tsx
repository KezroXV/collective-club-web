"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Laugh, Eye, Sparkles, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

type ReactionType = 'LIKE' | 'LOVE' | 'LAUGH' | 'WOW' | 'APPLAUSE';

interface ReactionData {
  type: ReactionType;
  count: number;
}

interface PostReactionsProps {
  postId: string;
  shopId: string;
  userId: string;
  reactions: ReactionData[];
  userReaction?: ReactionType | null;
}

export default function PostReactions({
  postId,
  shopId,
  userId,
  reactions: initialReactions,
  userReaction: initialUserReaction,
}: PostReactionsProps) {
  const [reactions, setReactions] = useState(initialReactions);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(initialUserReaction || null);
  const [isLoading, setIsLoading] = useState(false);

  const reactionConfig = [
    { type: 'LIKE' as ReactionType, icon: ThumbsUp, emoji: '👍', label: 'J\'aime' },
    { type: 'LOVE' as ReactionType, icon: Heart, emoji: '❤️', label: 'J\'adore' },
    { type: 'LAUGH' as ReactionType, icon: Laugh, emoji: '😂', label: 'Drôle' },
    { type: 'WOW' as ReactionType, icon: Eye, emoji: '😮', label: 'Wow' },
    { type: 'APPLAUSE' as ReactionType, icon: Sparkles, emoji: '👏', label: 'Bravo' },
  ];

  const handleReaction = async (type: ReactionType) => {
    if (isLoading) return;

    setIsLoading(true);
    const previousUserReaction = userReaction;
    const previousReactions = [...reactions];

    try {
      if (userReaction === type) {
        // Supprimer la réaction existante
        setUserReaction(null);
        setReactions(prev => prev.map(r => 
          r.type === type ? { ...r, count: Math.max(0, r.count - 1) } : r
        ));

        const response = await fetch(`/api/posts/${postId}/reactions`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, shopId }),
        });

        if (!response.ok) throw new Error('Erreur lors de la suppression');
      } else {
        // Ajouter nouvelle réaction
        setUserReaction(type);
        setReactions(prev => prev.map(r => {
          if (r.type === type) return { ...r, count: r.count + 1 };
          if (r.type === previousUserReaction) return { ...r, count: Math.max(0, r.count - 1) };
          return r;
        }));

        const response = await fetch(`/api/posts/${postId}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, userId, shopId }),
        });

        if (!response.ok) throw new Error('Erreur lors de l\'ajout');
      }
    } catch (error) {
      // Rollback en cas d'erreur
      setUserReaction(previousUserReaction);
      setReactions(previousReactions);
      console.error('Erreur réaction:', error);
      toast.error('Erreur lors de la réaction');
    } finally {
      setIsLoading(false);
    }
  };

  const getReactionCount = (type: ReactionType) => {
    return reactions.find(r => r.type === type)?.count || 0;
  };

  const getTotalReactions = () => {
    return reactions.reduce((sum, r) => sum + r.count, 0);
  };

  return (
    <div className="border-t border-b py-4 my-6">
      {/* Statistiques */}
      {getTotalReactions() > 0 && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {reactions
              .filter(r => r.count > 0)
              .sort((a, b) => b.count - a.count)
              .slice(0, 3)
              .map(reaction => {
                const config = reactionConfig.find(c => c.type === reaction.type);
                return (
                  <span key={reaction.type} className="text-sm">
                    {config?.emoji}
                  </span>
                );
              })}
            <span className="text-sm text-gray-600 ml-1">
              {getTotalReactions()} réaction{getTotalReactions() > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Boutons de réaction */}
      <div className="flex items-center gap-2 flex-wrap">
        {reactionConfig.map(({ type, icon: Icon, emoji, label }) => {
          const count = getReactionCount(type);
          const isActive = userReaction === type;

          return (
            <Button
              key={type}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => handleReaction(type)}
              disabled={isLoading}
              className={`gap-2 transition-all ${
                isActive 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <span className="text-base">{emoji}</span>
              <span className="text-xs font-medium">{label}</span>
              {count > 0 && (
                <Badge 
                  variant="secondary" 
                  className={`ml-1 text-xs ${
                    isActive ? 'bg-blue-400 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}