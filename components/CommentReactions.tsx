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

interface CommentReactionsProps {
  commentId: string;
  shopId: string;
  userId?: string;
  reactions?: ReactionData[];
  userReaction?: ReactionType | null;
}

export default function CommentReactions({
  commentId,
  shopId,
  userId,
  reactions: initialReactions = [],
  userReaction: initialUserReaction,
}: CommentReactionsProps) {
  const [reactions, setReactions] = useState(initialReactions);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(initialUserReaction || null);
  const [isLoading, setIsLoading] = useState(false);

  if (!userId) return null; // Ne pas afficher si pas connecté

  const reactionConfig = [
    { type: 'LIKE' as ReactionType, emoji: '👍' },
    { type: 'LOVE' as ReactionType, emoji: '❤️' },
    { type: 'LAUGH' as ReactionType, emoji: '😂' },
    { type: 'WOW' as ReactionType, emoji: '😮' },
    { type: 'APPLAUSE' as ReactionType, emoji: '👏' },
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

        const response = await fetch(`/api/comments/${commentId}/reactions`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, shopId }),
        });

        if (!response.ok) throw new Error('Erreur lors de la suppression');
      } else {
        // Ajouter nouvelle réaction
        setUserReaction(type);
        setReactions(prev => {
          const newReactions = [...prev];
          
          // Retirer l'ancienne réaction si elle existe
          if (previousUserReaction) {
            const oldIndex = newReactions.findIndex(r => r.type === previousUserReaction);
            if (oldIndex >= 0) {
              newReactions[oldIndex] = { 
                ...newReactions[oldIndex], 
                count: Math.max(0, newReactions[oldIndex].count - 1) 
              };
            }
          }
          
          // Ajouter la nouvelle réaction
          const newIndex = newReactions.findIndex(r => r.type === type);
          if (newIndex >= 0) {
            newReactions[newIndex] = { 
              ...newReactions[newIndex], 
              count: newReactions[newIndex].count + 1 
            };
          } else {
            newReactions.push({ type, count: 1 });
          }
          
          return newReactions;
        });

        const response = await fetch(`/api/comments/${commentId}/reactions`, {
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
      console.error('Erreur réaction commentaire:', error);
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
    <div className="mt-2">
      {/* Statistiques compactes */}
      {getTotalReactions() > 0 && (
        <div className="flex items-center gap-2 mb-2">
          {reactions
            .filter(r => r.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .map(reaction => {
              const config = reactionConfig.find(c => c.type === reaction.type);
              return (
                <span key={reaction.type} className="text-xs flex items-center gap-1">
                  {config?.emoji}
                  <span className="text-gray-500">{reaction.count}</span>
                </span>
              );
            })}
        </div>
      )}

      {/* Boutons de réaction compacts */}
      <div className="flex items-center gap-1">
        {reactionConfig.map(({ type, emoji }) => {
          const count = getReactionCount(type);
          const isActive = userReaction === type;

          return (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(type)}
              disabled={isLoading}
              className={`h-6 w-8 p-0 text-xs transition-all ${
                isActive 
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                  : 'hover:bg-gray-100'
              }`}
              title={`${type.toLowerCase()} (${count})`}
            >
              <span className="text-sm">{emoji}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}