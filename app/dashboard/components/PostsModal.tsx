"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Heart,
  MessageSquare,
  Eye,
  Trash2,
  AlertTriangle,
  Loader2,
  Pin,
  PinOff,
  Plus,
} from "lucide-react";

interface PostData {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isPinned?: boolean;
  author: {
    name: string;
    email: string;
  };
  _count: {
    reactions: number;
    comments: number;
    views?: number;
  };
  category?: {
    name: string;
    color: string;
  };
}

interface PostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  shopId?: string;
  userRole?: string;
  onPostDeleted?: () => void;
}

export default function PostsModal({
  isOpen,
  onClose,
  userId,
  userRole,
  onPostDeleted,
}: PostsModalProps) {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pinningPostId, setPinningPostId] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3B82F6");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (!isOpen) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      params.append("admin", "true");
      params.append("include", "stats");

      const response = await fetch(`/api/posts?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const postsArray = data.posts || data; // Support nouvelle et ancienne structure
      setPosts(postsArray);
      setFilteredPosts(postsArray);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, userId]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(query.toLowerCase()) ||
          post.content.toLowerCase().includes(query.toLowerCase()) ||
          post.author.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredPosts(filtered);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId, userRole }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Retirer le post de la liste locale
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setFilteredPosts((prev) => prev.filter((p) => p.id !== postId));
      setDeleteConfirm(null);

      // Notifier le parent qu'un post a été supprimé
      if (onPostDeleted) {
        onPostDeleted();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePin = async (postId: string, isPinned: boolean) => {
    if (!userId || !userRole || userRole === "MEMBER") return;

    try {
      setPinningPostId(postId);
      const endpoint = `/api/posts/${postId}/pin`;
      const method = isPinned ? "DELETE" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId,
          userRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'épinglage");
      }

      // Mettre à jour le post dans la liste locale
      const updatePost = (post: PostData) =>
        post.id === postId ? { ...post, isPinned: !isPinned } : post;

      setPosts((prev) => prev.map(updatePost));
      setFilteredPosts((prev) => prev.map(updatePost));

      // Déclencher un événement pour rafraîchir les posts partout
      window.dispatchEvent(new CustomEvent("postPinToggled"));
    } catch (error) {
      console.error("Error toggling pin:", error);
    } finally {
      setPinningPostId(null);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    if (!userId || !userRole || userRole === "MEMBER") return;

    try {
      setIsCreatingCategory(true);
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId,
          name: newCategoryName.trim(),
          color: newCategoryColor,
          description: newCategoryDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création");
      }

      const newCategory = await response.json();
      console.log("Catégorie créée avec succès:", newCategory);

      // Réinitialiser le formulaire
      setNewCategoryName("");
      setNewCategoryColor("#3B82F6");
      setNewCategoryDescription("");
      setShowCategoryModal(false);

      // Optionnel: recharger les posts pour voir les nouvelles catégories
      await fetchPosts();
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Erreur lors de la création de la catégorie");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  useEffect(() => {
    if (isOpen) {
      fetchPosts();
    }
  }, [isOpen, userId, fetchPosts]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        size="full"
        className="sm:max-w-6xl w-[95vw] max-h-[85vh] sm:max-h-[80vh] overflow-hidden p-4 sm:p-6"
      >
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            Gestion des Posts
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Gérez tous les posts de votre communauté
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {/* Barre de recherche et bouton d'ajout de catégorie */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm"
              />
            </div>

            {/* Bouton pour créer une catégorie - visible seulement pour non-MEMBER */}
            {userRole && userRole !== "MEMBER" && (
              <Button
                variant="outline"
                onClick={() => setShowCategoryModal(true)}
                className="shrink-0 flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm px-3"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Nouvelle catégorie</span>
                <span className="xs:hidden">Catégorie</span>
              </Button>
            )}
          </div>

          {/* Stats rapides */}
          {!isLoading && (
            <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 flex-wrap">
              <span>Total: {posts.length}</span>
              <span>Affichés: {filteredPosts.length}</span>
            </div>
          )}

          {/* Liste des posts */}
          <div className="overflow-y-auto max-h-[50vh] sm:max-h-96 space-y-2 sm:space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">
                  Chargement des posts...
                </span>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery
                  ? "Aucun post trouvé pour cette recherche"
                  : "Aucun post dans votre communauté"}
              </div>
            ) : (
              filteredPosts.map((post) => (
                <Card
                  key={post.id}
                  className="hover:shadow-md transition-all duration-200"
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start mb-0 justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base text-gray-900 line-clamp-2 sm:truncate flex-1">
                            {post.title}
                          </h4>
                          {post.category && (
                            <Badge
                              variant="secondary"
                              className="shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                              style={{
                                backgroundColor: `${post.category.color}20`,
                                color: post.category.color,
                              }}
                            >
                              {post.category.name}
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2 line-clamp-2">
                          {truncateContent(post.content)}
                        </p>

                        <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-500 flex-wrap mb-1.5 sm:mb-2">
                          <span className="truncate">
                            Par {post.author.name}
                          </span>
                          <span className="hidden xs:inline">
                            {formatDate(post.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-4">
                            <div className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm text-gray-600">
                              <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="text-[10px] sm:text-sm">
                                {post._count.reactions}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm text-gray-600">
                              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="text-[10px] sm:text-sm">
                                {post._count.comments}
                              </span>
                            </div>
                            {post._count.views !== undefined && (
                              <div className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm text-gray-600">
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="text-[10px] sm:text-sm">
                                  {post._count.views}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 ml-2 sm:ml-4">
                        {/* Bouton Pin/Unpin pour non-MEMBER */}
                        {userRole && userRole !== "MEMBER" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleTogglePin(post.id, post.isPinned || false)
                            }
                            disabled={pinningPostId === post.id}
                            className={`h-7 w-7 sm:h-8 sm:w-8 p-0 ${
                              post.isPinned
                                ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                : "text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                            }`}
                            title={post.isPinned ? "Désépingler" : "Épingler"}
                          >
                            {pinningPostId === post.id ? (
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            ) : post.isPinned ? (
                              <PinOff className="h-3 w-3 sm:h-4 sm:w-4" />
                            ) : (
                              <Pin className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDeleteConfirm({ id: post.id, title: post.title })
                          }
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 sm:h-8 sm:w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Modal de confirmation de suppression */}
        {deleteConfirm && (
          <Dialog open={true} onOpenChange={() => setDeleteConfirm(null)}>
            <DialogContent className="w-[90vw] max-w-md mx-2">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Confirmer la suppression
                </DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer le post &quot;
                  {deleteConfirm.title}&quot; ?<br />
                  Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isDeleting}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeletePost(deleteConfirm.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Suppression...
                    </>
                  ) : (
                    "Supprimer"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Modal de création de catégorie */}
        {showCategoryModal && (
          <Dialog open={true} onOpenChange={() => setShowCategoryModal(false)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Créer une nouvelle catégorie
                </DialogTitle>
                <DialogDescription>
                  Ajoutez une nouvelle catégorie pour organiser les posts de
                  votre communauté.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Nom de la catégorie */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nom de la catégorie *
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: Produits, Support, Général..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    maxLength={50}
                  />
                </div>

                {/* Couleur de la catégorie */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Couleur de la catégorie
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Description (optionnelle) */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description (optionnelle)
                  </label>
                  <Input
                    type="text"
                    placeholder="Description courte de la catégorie..."
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    maxLength={100}
                  />
                </div>

                {/* Aperçu de la catégorie */}
                {newCategoryName && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Aperçu
                    </label>
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: `${newCategoryColor}20`,
                        color: newCategoryColor,
                      }}
                    >
                      {newCategoryName}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowCategoryModal(false)}
                  disabled={isCreatingCategory}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateCategory}
                  disabled={isCreatingCategory || !newCategoryName.trim()}
                >
                  {isCreatingCategory ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Création...
                    </>
                  ) : (
                    "Créer la catégorie"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
