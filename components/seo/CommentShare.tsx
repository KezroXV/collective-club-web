/**
 * 🔗 Composant CommentShare pour partage social des commentaires
 * Permet de partager des commentaires spécifiques avec liens directs
 */

"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { generateCommentURL } from '@/lib/seo';

interface CommentShareProps {
  commentId: string;
  postSlug: string;
  postTitle: string;
  commentText: string;
  authorName: string;
  baseUrl?: string;
}

export function CommentShare({
  commentId,
  postSlug,
  postTitle,
  commentText,
  authorName,
  baseUrl
}: CommentShareProps) {
  const [copied, setCopied] = useState(false);

  const commentUrl = generateCommentURL(postSlug, commentId, baseUrl);
  const shareText = `Commentaire de ${authorName} sur "${postTitle}": ${commentText.substring(0, 100)}${commentText.length > 100 ? '...' : ''}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(commentUrl);
      setCopied(true);
      toast.success('Lien copié dans le presse-papiers');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      toast.error('Erreur lors de la copie du lien');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Commentaire de ${authorName}`,
          text: shareText,
          url: commentUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Erreur lors du partage:', error);
          // Fallback vers la copie du lien
          handleCopyLink();
        }
      }
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API Web Share
      handleCopyLink();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        className="text-xs text-gray-500 hover:text-gray-700 h-6 px-2"
        title="Partager ce commentaire"
      >
        <Share2 className="h-3 w-3" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyLink}
        className="text-xs text-gray-500 hover:text-gray-700 h-6 px-2"
        title="Copier le lien du commentaire"
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

/**
 * Hook pour détecter si on arrive sur un commentaire spécifique via URL
 */
export function useCommentHighlight() {
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  const highlightComment = (commentId: string) => {
    setHighlightedCommentId(commentId);
    // Scroll vers le commentaire
    const element = document.getElementById(`comment-${commentId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Ajouter une classe temporaire pour l'effet visuel
      element.classList.add('bg-blue-50', 'border-blue-300');
      setTimeout(() => {
        element.classList.remove('bg-blue-50', 'border-blue-300');
      }, 3000);
    }
  };

  // Détecter l'ancre dans l'URL au chargement
  useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.startsWith('#comment-')) {
        const commentId = hash.replace('#comment-', '');
        setTimeout(() => highlightComment(commentId), 500);
      }
    }
  });

  return { highlightedCommentId, highlightComment };
}