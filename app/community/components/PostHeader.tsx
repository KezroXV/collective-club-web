/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, Pin, PinOff, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { usePermissions } from "@/lib/hooks/usePermissions";

interface PostHeaderProps {
  author: {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: string;
  };
  createdAt: string;
  category?: {
    id: string;
    name: string;
    color: string;
  };
  title: string;
  post: {
    id: string;
    isPinned?: boolean;
    authorId: string;
  };
  getInitials: (name: string) => string;
  formatDate: (dateString: string) => string;
  getRoleColor: (role: string) => string;
  getRoleLabel: (role: string) => string;
  currentUser?: {
    id: string;
    shopId?: string;
    role?: string;
  } | null;
  onPin?: () => void;
  onDelete?: () => void;
}

const PostHeader = ({
  author,
  createdAt,
  category,
  title,
  post,
  getInitials,
  formatDate,
  getRoleColor,
  getRoleLabel,
  currentUser,
  onPin,
  onDelete,
}: PostHeaderProps) => {
  const [highestBadge, setHighestBadge] = useState<any>(null);
  const [isLoadingBadge, setIsLoadingBadge] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { canManagePosts, canDeletePosts } = usePermissions();

  // Permissions basées sur le nouveau système
  const canPin = currentUser && canManagePosts();
  const canDelete = currentUser && (
    canDeletePosts() ||
    post.authorId === currentUser.id
  );

  // Charger le badge le plus élevé de l'auteur
  useEffect(() => {
    if (!author.id || !currentUser?.shopId) return;

    const loadHighestBadge = async () => {
      try {
        setIsLoadingBadge(true);

        // Charger les points et badges de l'utilisateur
        const [pointsResponse, badgesResponse] = await Promise.all([
          fetch(
            `/api/users/points?userId=${author.id}&shopId=${currentUser.shopId}`
          ),
          fetch(`/api/badges?userId=${author.id}&shopId=${currentUser.shopId}`),
        ]);

        let userPoints = 0;
        if (pointsResponse.ok) {
          const pointsData = await pointsResponse.json();
          userPoints = pointsData.points || 0;
        }

        if (badgesResponse.ok) {
          const allBadges = await badgesResponse.json();

          // Filtrer les badges débloqués et prendre le plus élevé
          const unlockedBadges = allBadges
            .filter((badge: any) => userPoints >= badge.requiredPoints)
            .sort((a: any, b: any) => b.requiredPoints - a.requiredPoints);

          if (unlockedBadges.length > 0) {
            setHighestBadge(unlockedBadges[0]);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement du badge:", error);
      } finally {
        setIsLoadingBadge(false);
      }
    };

    loadHighestBadge();
  }, [author.id, currentUser?.shopId]);

  const handleTogglePin = async () => {
    if (!currentUser || !canPin || !post?.id) {
      console.log('handleTogglePin: Missing requirements', { currentUser: !!currentUser, canPin, postId: post?.id });
      return;
    }

    console.log('handleTogglePin: Starting', { postId: post.id, isPinned: post.isPinned, userRole: currentUser.role });

    setIsPinning(true);
    try {
      const endpoint = `/api/posts/${post.id}/pin`;
      const method = post.isPinned ? 'DELETE' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userRole: currentUser.role,
        }),
      });

      console.log('handleTogglePin: Response received', { 
        ok: response.ok, 
        status: response.status, 
        statusText: response.statusText 
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('handleTogglePin: Success response', responseData);
        const action = post.isPinned ? 'désépinglé' : 'épinglé';
        toast.success(`Post ${action} avec succès !`);
        onPin?.(); // Callback pour rafraîchir la liste
      } else {
        const errorData = await response.json();
        console.log('handleTogglePin: Error response', errorData);
        toast.error(errorData.error || 'Erreur lors de l\'épinglage');
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Erreur lors de l\'épinglage');
    } finally {
      setIsPinning(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !canDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userRole: currentUser.role,
        }),
      });

      if (response.ok) {
        setShowDeleteDialog(false);
        toast.success('Post supprimé avec succès !');
        onDelete?.(); // Callback pour rafraîchir la liste
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };
  const { colors } = useTheme();

  return (
    <>
      {/* Post Header */}
      <div className="flex items-start justify-between ">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author.image} />
            <AvatarFallback
              className="text-white font-semibold text-sm"
              style={{ backgroundColor: colors.Posts }}
            >
              {getInitials(author.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            {/* Nom et date sur la même ligne */}
            <div className="flex items-center gap-2 mb-1">
              <p
                className="font-semibold text-sm"
                style={{ color: colors.Police }}
              >
                {author.name}
              </p>
              <span className="text-xs text-gray-500">
                · posté le {formatDate(createdAt)}
              </span>
            </div>

            {/* Badge le plus élevé en dessous */}
            <div className="flex items-center">
              {isLoadingBadge ? (
                <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
              ) : highestBadge ? (
                <Image
                  src={highestBadge.imageUrl}
                  alt={highestBadge.name}
                  width={15}
                  height={15}
                  className="rounded-full"
                  title={highestBadge.name}
                />
              ) : null}
            </div>
          </div>
        </div>
        
        {/* Menu dropdown pour les actions modération */}
        {(canPin || canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {canPin && (
                <DropdownMenuItem 
                  onClick={handleTogglePin}
                  disabled={isPinning}
                >
                  {post?.isPinned ? (
                    <>
                      <PinOff className="mr-2 h-4 w-4" />
                      {isPinning ? 'Désépinglage...' : 'Désépingler'}
                    </>
                  ) : (
                    <>
                      <Pin className="mr-2 h-4 w-4" />
                      {isPinning ? 'Épinglage...' : 'Épingler'}
                    </>
                  )}
                </DropdownMenuItem>
              )}
              
              {canDelete && (
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Post Title */}
      <h1
        className="text-[13px] font-semibold mb-4"
        style={{ color: colors.Police }}
      >
        {title}
      </h1>

      {/* Categories badges - Style CategoriesSection */}
      <div className="flex gap-2">
        {category && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white"
            style={{ border: `1px solid ${colors.Bordures}` }}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${category.color}`} />
            <span
              className="text-[12px] font-medium"
              style={{ color: colors.Police }}
            >
              {category.name}
            </span>
          </div>
        )}
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le post</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible et supprimera également tous les commentaires et réactions associés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PostHeader;
