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
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  Edit,
} from "lucide-react";

interface CategoryData {
  id: string;
  name: string;
  color: string;
  description?: string;
  order: number;
  isActive: boolean;
  _count: {
    posts: number;
  };
}

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  shopId?: string;
  userRole?: string;
  onCategoryCreated?: () => void;
}

export default function CategoriesModal({
  isOpen,
  onClose,
  userId,
  userRole,
  onCategoryCreated,
}: CategoriesModalProps) {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryData[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3B82F6");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!isOpen) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/categories", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(
        (category) =>
          category.name.toLowerCase().includes(query.toLowerCase()) ||
          (category.description &&
            category.description.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredCategories(filtered);
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
          order: categories.length,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création");
      }

      const newCategory = await response.json();

      // Recharger les catégories
      await fetchCategories();

      // Réinitialiser le formulaire
      setNewCategoryName("");
      setNewCategoryColor("#3B82F6");
      setNewCategoryDescription("");
      setShowCreateModal(false);

      // Notifier le parent
      if (onCategoryCreated) {
        onCategoryCreated();
      }

      console.log("Catégorie créée avec succès:", newCategory);
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Erreur lors de la création de la catégorie");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/categories/${categoryId}`, {
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

      // Retirer la catégorie de la liste locale
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      setFilteredCategories((prev) => prev.filter((c) => c.id !== categoryId));
      setDeleteConfirm(null);

      // Notifier le parent
      if (onCategoryCreated) {
        onCategoryCreated();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Erreur lors de la suppression de la catégorie");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, userId, fetchCategories]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        size="full"
        className="sm:max-w-4xl w-[95vw] max-h-[80vh] overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Gestion des Catégories
          </DialogTitle>
          <DialogDescription>
            Gérez les catégories pour organiser les posts de votre communauté
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Barre de recherche et bouton d'ajout */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Rechercher une catégorie..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Bouton pour créer une catégorie - visible seulement pour non-MEMBER */}
            {userRole && userRole !== "MEMBER" && (
              <Button
                variant="default"
                onClick={() => setShowCreateModal(true)}
                className="shrink-0 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nouvelle catégorie
              </Button>
            )}
          </div>

          {/* Stats rapides */}
          {!isLoading && (
            <div className="flex gap-4 text-sm text-gray-600">
              <span>Total: {categories.length} catégories</span>
              <span>Affichées: {filteredCategories.length} catégories</span>
            </div>
          )}

          {/* Liste des catégories */}
          <div className="overflow-y-auto max-h-96 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">
                  Chargement des catégories...
                </span>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery
                  ? "Aucune catégorie trouvée pour cette recherche"
                  : "Aucune catégorie dans votre communauté"}
              </div>
            ) : (
              filteredCategories.map((category) => (
                <Card
                  key={category.id}
                  className="hover:shadow-md transition-all duration-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {category.name}
                          </h4>
                          {category.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {category.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{category._count.posts} posts</span>
                            <span>Ordre: {category.order}</span>
                            <Badge
                              variant={
                                category.isActive ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {category.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Actions - visible seulement pour non-MEMBER */}
                      {userRole && userRole !== "MEMBER" && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDeleteConfirm({
                                id: category.id,
                                name: category.name,
                              })
                            }
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={category._count.posts > 0}
                            title={
                              category._count.posts > 0
                                ? "Impossible de supprimer une catégorie avec des posts"
                                : "Supprimer"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Modal de création de catégorie */}
        {showCreateModal && (
          <Dialog open={true} onOpenChange={() => setShowCreateModal(false)}>
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
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: newCategoryColor }}
                      ></div>
                      <span className="text-sm">{newCategoryName}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
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

        {/* Modal de confirmation de suppression */}
        {deleteConfirm && (
          <Dialog open={true} onOpenChange={() => setDeleteConfirm(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Confirmer la suppression
                </DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer la catégorie &quot;
                  {deleteConfirm.name}&quot; ?<br />
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
                  onClick={() => handleDeleteCategory(deleteConfirm.id)}
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
      </DialogContent>
    </Dialog>
  );
}

