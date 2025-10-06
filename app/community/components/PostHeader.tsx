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
  const canDelete =
    currentUser && (canDeletePosts() || post.authorId === currentUser.id);

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
      console.log("handleTogglePin: Missing requirements", {
        currentUser: !!currentUser,
        canPin,
        postId: post?.id,
      });
      return;
    }

    console.log("handleTogglePin: Starting", {
      postId: post.id,
      isPinned: post.isPinned,
      userRole: currentUser.role,
    });

    setIsPinning(true);
    try {
      const endpoint = `/api/posts/${post.id}/pin`;
      const method = post.isPinned ? "DELETE" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          userRole: currentUser.role,
        }),
      });

      console.log("handleTogglePin: Response received", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("handleTogglePin: Success response", responseData);
        const action = post.isPinned ? "désépinglé" : "épinglé";
        toast.success(`Post ${action} avec succès !`);
        onPin?.(); // Callback pour rafraîchir la liste
      } else {
        const errorData = await response.json();
        console.log("handleTogglePin: Error response", errorData);
        toast.error(errorData.error || "Erreur lors de l'épinglage");
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Erreur lors de l'épinglage");
    } finally {
      setIsPinning(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !canDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          userRole: currentUser.role,
        }),
      });

      if (response.ok) {
        setShowDeleteDialog(false);
        toast.success("Post supprimé avec succès !");
        onDelete?.(); // Callback pour rafraîchir la liste
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };
  const { colors } = useTheme();

  return (
    <>
      {/* Post Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
            <AvatarImage src={author.image} />
            <AvatarFallback
              className="text-white font-semibold text-xs sm:text-sm"
              style={{ backgroundColor: colors.Posts }}
            >
              {getInitials(author.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            {/* Nom et date */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2 mb-1">
              <p
                className="font-semibold text-sm truncate"
                style={{ color: colors.Police }}
              >
                {author.name}
              </p>
              <span className="text-xs text-gray-500">
                <span className="hidden sm:inline">· posté le </span>
                {formatDate(createdAt)}
              </span>
            </div>

            {/* Badge le plus élevé en dessous */}
            <div className="flex items-center">
              {isLoadingBadge ? (
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gray-200 rounded-full animate-pulse"></div>
              ) : highestBadge ? (
                <Image
                  src={highestBadge.imageUrl}
                  alt={highestBadge.name}
                  width={14}
                  height={14}
                  className="rounded-full sm:w-[15px] sm:h-[15px]"
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
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-9 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 sm:w-48">
              {canPin && (
                <DropdownMenuItem
                  onClick={handleTogglePin}
                  disabled={isPinning}
                  className="text-xs sm:text-sm"
                >
                  {post?.isPinned ? (
                    <>
                      <PinOff className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {isPinning ? "Désépinglage..." : "Désépingler"}
                    </>
                  ) : (
                    <>
                      <Pin className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {isPinning ? "Épinglage..." : "Épingler"}
                    </>
                  )}
                </DropdownMenuItem>
              )}

              {canDelete && (
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600 text-xs sm:text-sm"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Post Title et Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
        <h1
          className="text-sm sm:text-[13px] font-semibold flex-1 min-w-0 pr-2"
          style={{ color: colors.Police }}
        >
          {title}
        </h1>

        {/* Badges (Catégorie et Épinglé) */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Badge de catégorie */}
          {category &&
            (() => {
              const categoryColor = getCategoryColorValue(category.color);
              return (
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
                    {category.name.toUpperCase()}
                  </span>
                </Badge>
              );
            })()}

          {/* Badge épinglé */}
          {post?.isPinned && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 sm:gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors px-1.5 py-0.5 sm:px-2.5 sm:py-1"
            >
              <Pin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span className="text-[9px] sm:text-[10px] font-semibold whitespace-nowrap">
                ÉPINGLÉ
              </span>
            </Badge>
          )}
        </div>
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le post</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce post ? Cette action est
              irréversible et supprimera également tous les commentaires et
              réactions associés.
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
              {isDeleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PostHeader;
