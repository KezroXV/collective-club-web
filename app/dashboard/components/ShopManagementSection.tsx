import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  MoreVertical,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import ClientsModal from "./ClientsModal";
import CustomRolesModal from "./CustomRolesModal";
import Image from "next/image";

interface ShopManagementSectionProps {
  userId?: string;
  shopId: string;
  onThemeClick: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isOwner?: boolean;
  image?: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  _count: {
    posts: number;
  };
}

export default function ShopManagementSection({
  userId,
  shopId,
  onThemeClick,
}: ShopManagementSectionProps) {
  const borderColor = "#E5E7EB";
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // États pour les modals
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [showCustomRolesModal, setShowCustomRolesModal] = useState(false);

  // États pour la recherche
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  // États pour la pagination
  const [userCurrentPage, setUserCurrentPage] = useState(0);
  const [categoryCurrentPage, setCategoryCurrentPage] = useState(0);
  const USERS_PER_PAGE = 3;
  const CATEGORIES_PER_PAGE = 9;

  // États pour le changement de rôle
  const [loadingRoleChange, setLoadingRoleChange] = useState<string | null>(
    null
  );

  // États pour le modal d'ajout de catégorie
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-blue-500");
  const [loadingAddCategory, setLoadingAddCategory] = useState(false);

  // États pour le modal d'édition de catégorie
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryColor, setEditCategoryColor] = useState("bg-blue-500");
  const [loadingEditCategory, setLoadingEditCategory] = useState(false);

  // États pour le modal de suppression de catégorie
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );
  const [loadingDeleteCategory, setLoadingDeleteCategory] = useState(false);

  // Fonction pour récupérer les utilisateurs (admins et modérateurs)
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const url = userId
        ? `/api/members?userId=${userId}&limit=100`
        : `/api/members?limit=100`;
      console.log("🔍 Fetching users from:", url);

      const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log("👥 Raw users data:", data);

      // Filtrer pour ne garder que les admins et modérateurs
      const filteredUsers = data.members
        .filter(
          (user: any) => user.role === "ADMIN" || user.role === "MODERATOR"
        )
        .map((user: any) => ({
          ...user,
          image: user.image || null,
        }));

      console.log("👑 Filtered admin/mod users:", filteredUsers);
      console.log(
        "📊 Setting users state with:",
        filteredUsers.length,
        "users"
      );
      setUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fonction pour récupérer les catégories
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      console.log("🔍 Fetching categories from: /api/categories");

      const response = await fetch("/api/categories", {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log("📁 Categories data received:", data);
      console.log(
        "📊 Setting categories state with:",
        data.length,
        "categories"
      );
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (shopId) {
      fetchUsers();
      fetchCategories();
    }
  }, [shopId]);

  // Fonction pour ajouter une catégorie
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    setLoadingAddCategory(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          color: selectedColor,
          order: categories.length,
        }),
      });

      if (response.ok) {
        const newCategory = await response.json();
        // Recharger les catégories pour être sûr
        await fetchCategories();
        setNewCategoryName("");
        setSelectedColor("bg-blue-500");
        setShowAddCategoryModal(false);
        toast.success("Catégorie créée avec succès");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Erreur lors de la création");
    } finally {
      setLoadingAddCategory(false);
    }
  };

  // Fonction pour éditer une catégorie
  const handleEditCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) return;

    setLoadingEditCategory(true);
    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editCategoryName.trim(),
          color: editCategoryColor,
        }),
      });

      if (response.ok) {
        const updatedCategory = await response.json();
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === editingCategory.id
              ? {
                  ...cat,
                  name: updatedCategory.name,
                  color: updatedCategory.color,
                }
              : cat
          )
        );
        setShowEditCategoryModal(false);
        setEditingCategory(null);
        setEditCategoryName("");
        setEditCategoryColor("bg-blue-500");
        toast.success("Catégorie modifiée avec succès");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la modification");
      }
    } catch (error) {
      console.error("Error editing category:", error);
      toast.error("Erreur lors de la modification");
    } finally {
      setLoadingEditCategory(false);
    }
  };

  // Fonction pour supprimer une catégorie
  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    setLoadingDeleteCategory(true);
    try {
      const response = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCategories((prev) =>
          prev.filter((cat) => cat.id !== deletingCategory.id)
        );
        setShowDeleteCategoryModal(false);
        setDeletingCategory(null);
        toast.success("Catégorie supprimée avec succès");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoadingDeleteCategory(false);
    }
  };

  // Fonction pour changer le rôle d'un utilisateur
  const handleRoleChange = async (
    targetUserId: string,
    newRole: "ADMIN" | "MODERATOR"
  ) => {
    setLoadingRoleChange(targetUserId);
    try {
      const response = await fetch(
        `/api/users/${targetUserId}/role?userId=${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: newRole,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers((prev) =>
          prev.map((user) =>
            user.id === targetUserId ? { ...user, role: data.user.role } : user
          )
        );
        toast.success(
          `Rôle changé en ${
            newRole === "ADMIN" ? "Admin" : "Modérateur"
          } avec succès`
        );
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors du changement de rôle");
      }
    } catch (error) {
      console.error("Error changing role:", error);
      toast.error("Erreur lors du changement de rôle");
    } finally {
      setLoadingRoleChange(null);
    }
  };

  // Couleurs disponibles
  const COLOR_OPTIONS = [
    { name: "Bleu", value: "bg-blue-500" },
    { name: "Orange", value: "bg-orange-500" },
    { name: "Vert", value: "bg-emerald-500" },
    { name: "Rouge", value: "bg-red-500" },
    { name: "Violet", value: "bg-violet-500" },
    { name: "Jaune", value: "bg-amber-500" },
    { name: "Rose", value: "bg-pink-500" },
    { name: "Cyan", value: "bg-cyan-500" },
  ];

  // Fonctions helper
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplay = (role: string, isOwner?: boolean) => {
    if (isOwner) return "Proprio.";
    return role === "ADMIN" ? "admin" : "Modérateur";
  };

  const getRoleColor = (role: string, isOwner?: boolean) => {
    if (isOwner) return "bg-red-100 text-red-800";
    return role === "ADMIN"
      ? "bg-orange-100 text-orange-800"
      : "bg-blue-100 text-blue-800";
  };

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Filtrer les catégories selon la recherche
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  // Pagination pour les utilisateurs
  const totalUserPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    userCurrentPage * USERS_PER_PAGE,
    (userCurrentPage + 1) * USERS_PER_PAGE
  );

  // Pagination pour les catégories
  const totalCategoryPages = Math.ceil(
    filteredCategories.length / CATEGORIES_PER_PAGE
  );
  const paginatedCategories = filteredCategories.slice(
    categoryCurrentPage * CATEGORIES_PER_PAGE,
    (categoryCurrentPage + 1) * CATEGORIES_PER_PAGE
  );

  // Fonctions de navigation
  const handleUserPrevPage = () => {
    setUserCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleUserNextPage = () => {
    setUserCurrentPage((prev) => Math.min(totalUserPages - 1, prev + 1));
  };

  const handleCategoryPrevPage = () => {
    setCategoryCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleCategoryNextPage = () => {
    setCategoryCurrentPage((prev) =>
      Math.min(totalCategoryPages - 1, prev + 1)
    );
  };

  // DEBUG: Log des états avant le rendu
  console.log("🔍 RENDER DEBUG:", {
    shopId,
    userId,
    users: users.length,
    categories: categories.length,
    loadingUsers,
    loadingCategories,
    filteredUsers: filteredUsers.length,
    filteredCategories: filteredCategories.length,
  });

  // Reset pagination when search changes
  useEffect(() => {
    setUserCurrentPage(0);
  }, [userSearchQuery]);

  useEffect(() => {
    setCategoryCurrentPage(0);
  }, [categorySearchQuery]);

  return (
    <div className="lg:col-span-4">
      <Card className="hover:shadow-sm" style={{ borderColor }}>
        <CardContent className="p-4 sm:p-6">
          {/* Section Rôles */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Rôles
            </h3>
            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-8 sm:pl-10 w-full sm:w-32 h-8 text-xs sm:text-sm"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleUserPrevPage}
                disabled={userCurrentPage === 0}
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleUserNextPage}
                disabled={userCurrentPage >= totalUserPages - 1}
              >
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {loadingUsers ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                      <div>
                        <div className="h-3 w-24 bg-gray-200 rounded mb-1"></div>
                        <div className="h-2 w-32 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : paginatedUsers.length === 0 ? (
              <p className="text-sm text-gray-500">
                {userSearchQuery
                  ? "Aucun utilisateur trouvé"
                  : "Aucun administrateur ou modérateur trouvé"}
              </p>
            ) : (
              paginatedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name}
                        width={32}
                        height={32}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs sm:text-sm font-medium flex-shrink-0">
                        {getInitials(user.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-[13px] font-medium text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <span
                      className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full whitespace-nowrap ${getRoleColor(
                        user.role,
                        user.isOwner
                      )}`}
                    >
                      {getRoleDisplay(user.role, user.isOwner)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={loadingRoleChange === user.id}
                        >
                          <MoreVertical className="h-3 w-3 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.role === "MODERATOR" && !user.isOwner && (
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(user.id, "ADMIN")}
                            disabled={loadingRoleChange === user.id}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Changer en Admin
                          </DropdownMenuItem>
                        )}
                        {user.role === "ADMIN" && !user.isOwner && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleRoleChange(user.id, "MODERATOR")
                            }
                            disabled={loadingRoleChange === user.id}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Changer en Modérateur
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full border-2 border-dashed"
              style={{ borderColor }}
              onClick={() => setShowCustomRolesModal(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <hr className="border-[1px] mb-4 sm:mb-6" style={{ borderColor }} />

          {/* Section Catégories */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Catégories
            </h3>
            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="pl-8 sm:pl-10 w-full sm:w-32 h-8 text-xs sm:text-sm"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleCategoryPrevPage}
                disabled={categoryCurrentPage === 0}
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleCategoryNextPage}
                disabled={categoryCurrentPage >= totalCategoryPages - 1}
              >
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-3">
            {loadingCategories ? (
              <>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between  rounded-full border animate-pulse bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-200"></div>
                      <div className="h-2 w-12 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-3 w-3 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </>
            ) : paginatedCategories.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-3">
                {categorySearchQuery
                  ? "Aucune catégorie trouvée"
                  : "Aucune catégorie trouvée"}
              </p>
            ) : (
              paginatedCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center h-6 px-2 py-2 justify-between rounded-full border hover:bg-gray-50 transition-colors"
                  style={{ borderColor }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${category.color}`}
                    ></div>
                    <span className="text-[10px] font-medium text-gray-900">
                      {category.name}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full"
                      >
                        <MoreVertical className="h-3 w-3 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingCategory(category);
                          setEditCategoryName(category.name);
                          setEditCategoryColor(category.color);
                          setShowEditCategoryModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setDeletingCategory(category);
                          setShowDeleteCategoryModal(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto w-8 h-8 rounded-full border-2 border-dashed mb-6"
              style={{ borderColor }}
              onClick={() => setShowAddCategoryModal(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <hr className="border-[1px] mb-4 sm:mb-6" style={{ borderColor }} />

          {/* Section Personnalisation */}
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Personnalisation du forum
          </h3>

          <Button
            variant="ghost"
            onClick={onThemeClick}
            className="w-full justify-start h-12 sm:h-16 border border-dashed text-gray-600 hover:bg-gray-50 text-sm"
            style={{ borderColor }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Personnaliser
          </Button>
        </CardContent>
      </Card>

      {/* Modal d'ajout de catégorie */}
      <Dialog
        open={showAddCategoryModal}
        onOpenChange={setShowAddCategoryModal}
      >
        <DialogContent className="w-[95vw] max-w-md mx-2 sm:mx-4">
          <DialogHeader>
            <DialogTitle>Ajouter une catégorie</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                Nom de la catégorie
              </label>
              <Input
                placeholder="Ex: Mode, Tech, Lifestyle..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                Couleur
              </label>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-10 h-7 sm:w-12 sm:h-8 rounded-md relative ${
                      color.value
                    } ${
                      selectedColor === color.value
                        ? "ring-2 ring-gray-900 ring-offset-2"
                        : ""
                    }`}
                  >
                    {selectedColor === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 sm:pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCategoryName("");
                  setSelectedColor("bg-blue-500");
                }}
                disabled={loadingAddCategory}
                className="h-9 text-sm"
              >
                Annuler
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim() || loadingAddCategory}
                className="h-9 text-sm"
              >
                {loadingAddCategory ? "Création..." : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition de catégorie */}
      <Dialog
        open={showEditCategoryModal}
        onOpenChange={setShowEditCategoryModal}
      >
        <DialogContent className="w-[95vw] max-w-md mx-2 sm:mx-4">
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                Nom de la catégorie
              </label>
              <Input
                placeholder="Ex: Mode, Tech, Lifestyle..."
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                autoFocus
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                Couleur
              </label>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setEditCategoryColor(color.value)}
                    className={`w-10 h-7 sm:w-12 sm:h-8 rounded-md relative ${
                      color.value
                    } ${
                      editCategoryColor === color.value
                        ? "ring-2 ring-gray-900 ring-offset-2"
                        : ""
                    }`}
                  >
                    {editCategoryColor === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 sm:pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditCategoryModal(false);
                  setEditingCategory(null);
                  setEditCategoryName("");
                  setEditCategoryColor("bg-blue-500");
                }}
                disabled={loadingEditCategory}
                className="h-9 text-sm"
              >
                Annuler
              </Button>
              <Button
                onClick={handleEditCategory}
                disabled={!editCategoryName.trim() || loadingEditCategory}
                className="h-9 text-sm"
              >
                {loadingEditCategory ? "Modification..." : "Modifier"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de suppression de catégorie */}
      <Dialog
        open={showDeleteCategoryModal}
        onOpenChange={setShowDeleteCategoryModal}
      >
        <DialogContent className="w-[95vw] max-w-md mx-2 sm:mx-4">
          <DialogHeader>
            <DialogTitle>Supprimer la catégorie</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex-shrink-0">
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mt-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-red-800">
                  Attention
                </h3>
                <p className="text-xs sm:text-sm text-red-700 mt-1">
                  Êtes-vous sûr de vouloir supprimer la catégorie "
                  {deletingCategory?.name}" ? Cette action est irréversible.
                </p>
                {deletingCategory && deletingCategory._count.posts > 0 && (
                  <p className="text-[10px] sm:text-xs text-red-600 mt-1.5 sm:mt-2 font-medium">
                    ⚠️ Cette catégorie contient {deletingCategory._count.posts}{" "}
                    post(s)
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 sm:pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteCategoryModal(false);
                  setDeletingCategory(null);
                }}
                disabled={loadingDeleteCategory}
                className="h-9 text-sm"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCategory}
                disabled={loadingDeleteCategory}
                className="h-9 text-sm"
              >
                {loadingDeleteCategory ? "Suppression..." : "Supprimer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ClientsModal */}
      <ClientsModal
        isOpen={showClientsModal}
        onClose={() => setShowClientsModal(false)}
        userId={userId}
        shopId={shopId}
        userRole="ADMIN"
      />

      {/* CustomRolesModal */}
      <CustomRolesModal
        isOpen={showCustomRolesModal}
        onClose={() => setShowCustomRolesModal(false)}
        userId={userId}
        shopId={shopId}
      />
    </div>
  );
}
