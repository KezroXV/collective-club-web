"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Users,
  MessageSquare,
  Heart,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Ban,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Settings,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useShop } from "@/lib/hooks/useShop";
import { usePermissions } from "@/lib/hooks/usePermissions";

interface MemberData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isActive: boolean;
  isBanned?: boolean;
  postsCount: number;
  commentsCount: number;
  reactionsCount: number;
  roleInfo?: {
    id: string;
    name: string;
    displayName: string;
    color: string;
    isDefault: boolean;
  };
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  color: string;
  permissions: string[];
  isDefault: boolean;
}

interface PaginatedResponse {
  members: MemberData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  shopId?: string;
  userRole?: string;
}

export default function ClientsModal({
  isOpen,
  onClose,
  userId,
  userRole,
}: ClientsModalProps) {
  const { shopDomain } = useShop();
  const { canBanUsers, canManageUsers, canChangeRoles } = usePermissions();
  const [members, setMembers] = useState<MemberData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [banConfirm, setBanConfirm] = useState<{
    id: string;
    name: string;
    isBanned: boolean;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [roleChangeUserId, setRoleChangeUserId] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  const ITEMS_PER_PAGE = 10;

  // Charger tous les rôles disponibles
  const loadAvailableRoles = async () => {
    if (!shopDomain) return;

    try {
      const response = await fetch(`/api/roles?shop=${shopDomain}`);
      if (response.ok) {
        const roles = await response.json();
        setAvailableRoles(roles);
      }
    } catch (error) {
      console.error("Error loading roles:", error);
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchMembers = async (page: number = 1, search: string = "") => {
    if (!isOpen || !shopDomain) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      params.append("page", page.toString());
      params.append("limit", ITEMS_PER_PAGE.toString());
      if (search.trim()) params.append("search", search.trim());

      const response = await fetch(`/api/members?${params.toString()}&shop=${shopDomain}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PaginatedResponse = await response.json();
      setMembers(data.members);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotalMembers(data.total);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "moderator":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "member":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-chart-4";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "Administrateur";
      case "moderator":
        return "Modérateur";
      case "member":
        return "Membre";
      default:
        return role;
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchMembers(newPage, debouncedSearch);
  };

  const handleToggleBan = async (memberId: string, isBanned: boolean) => {
    if (!userId || !canBanUsers()) return;

    try {
      setBanningUserId(memberId);
      const endpoint = `/api/users/${memberId}/ban`;
      const method = isBanned ? "DELETE" : "POST";

      const response = await fetch(`${endpoint}?shop=${shopDomain}`, {
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
        throw new Error(errorData.error || "Erreur lors du bannissement");
      }

      // Mettre à jour le membre dans la liste locale
      const updateMember = (member: MemberData) =>
        member.id === memberId ? { ...member, isBanned: !isBanned } : member;

      setMembers((prev) => prev.map(updateMember));
      setBanConfirm(null);
    } catch (error) {
      console.error("Error toggling ban:", error);
    } finally {
      setBanningUserId(null);
    }
  };

  const handleDeleteUser = async (memberId: string) => {
    if (!userId || !canManageUsers()) return; // Seulement ceux qui peuvent gérer les utilisateurs

    try {
      setDeletingUserId(memberId);

      const response = await fetch(`/api/users/${memberId}?shop=${shopDomain}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId,
          userRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      // Retirer l'utilisateur de la liste locale
      setMembers((prev) => prev.filter((member) => member.id !== memberId));
      setTotalMembers((prev) => prev - 1);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleChangeRole = async (memberId: string, newRoleName: string) => {
    if (!userId || !canChangeRoles()) return; // Seulement ceux qui peuvent changer les rôles

    try {
      setRoleChangeUserId(memberId);

      const response = await fetch(`/api/users/${memberId}/role-assignment?userId=${userId}&shop=${shopDomain}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          roleName: newRoleName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la modification du rôle"
        );
      }

      const result = await response.json();

      // Mettre à jour le membre dans la liste locale
      setMembers((prev) =>
        prev.map((member) =>
          member.id === memberId ? {
            ...member,
            role: newRoleName,
            roleInfo: result.roleInfo ? {
              id: result.roleInfo.id,
              name: result.roleInfo.name,
              displayName: result.roleInfo.displayName,
              color: result.roleInfo.color,
              isDefault: result.roleInfo.isDefault
            } : undefined
          } : member
        )
      );
    } catch (error) {
      console.error("Error changing role:", error);
    } finally {
      setRoleChangeUserId(null);
    }
  };


  useEffect(() => {
    if (isOpen && shopDomain) {
      fetchMembers(currentPage, debouncedSearch);
      loadAvailableRoles();
    }
  }, [isOpen, userId, debouncedSearch, currentPage, shopDomain]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        size="full"
        className="sm:max-w-6xl w-[95vw] max-h-[80vh] overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion des Membres
          </DialogTitle>
          <DialogDescription>
            Consultez et gérez les membres de votre communauté
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats rapides */}
          {!isLoading && (
            <div className="flex gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Total: {totalMembers} membres</span>
              </div>
              <div className="flex items-center gap-1">
                <span>•</span>
                <span>
                  Page {currentPage} / {totalPages}
                </span>
              </div>
            </div>
          )}

          {/* Liste des membres */}
          <div className="overflow-y-auto max-h-96 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">
                  Chargement des membres...
                </span>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {debouncedSearch
                  ? "Aucun membre trouvé pour cette recherche"
                  : "Aucun membre dans votre communauté"}
              </div>
            ) : (
              members.map((member) => (
                <Card
                  key={member.id}
                  className="hover:shadow-md transition-all duration-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {member.name}
                            </h4>
                            <p className="text-sm text-gray-600 truncate">
                              {member.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {member.roleInfo && !member.roleInfo.isDefault ? (
                              <Badge
                                className="text-xs text-white border-gray-200"
                                style={{ backgroundColor: member.roleInfo.color }}
                              >
                                {member.roleInfo.displayName}
                              </Badge>
                            ) : (
                              <Badge
                                className={`text-xs ${getRoleBadgeColor(
                                  member.role
                                )}`}
                              >
                                {getRoleLabel(member.role)}
                              </Badge>
                            )}
                            {member.isBanned ? (
                              <Badge
                                variant="destructive"
                                className="text-xs bg-red-100 text-red-800 border-red-200"
                              >
                                Banni
                              </Badge>
                            ) : member.isActive ? (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-green-100 text-green-800"
                              >
                                Actif
                              </Badge>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-xs text-gray-500 mb-2">
                          <span>Inscrit le {formatDate(member.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">
                              {member.postsCount}
                            </span>
                            <span className="text-gray-500">posts</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MessageSquare className="h-4 w-4 text-green-600" />
                            <span className="font-medium">
                              {member.commentsCount}
                            </span>
                            <span className="text-gray-500">commentaires</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Heart className="h-4 w-4 text-red-600" />
                            <span className="font-medium">
                              {member.reactionsCount}
                            </span>
                            <span className="text-gray-500">réactions</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions de modération */}
                      {canBanUsers() &&
                        member.role !== "ADMIN" && (
                          <div className="flex items-center gap-2 ml-4">
                            {/* Menu Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={
                                    roleChangeUserId === member.id ||
                                    deletingUserId === member.id ||
                                    banningUserId === member.id
                                  }
                                  className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                  title="Actions"
                                >
                                  {roleChangeUserId === member.id ||
                                  deletingUserId === member.id ||
                                  banningUserId === member.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Settings className="h-4 w-4" />
                                      <ChevronDown className="h-3 w-3 ml-1" />
                                    </>
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                {/* Bannir/Débannir - ADMIN et MODERATOR */}
                                <DropdownMenuItem
                                  onClick={() =>
                                    setBanConfirm({
                                      id: member.id,
                                      name: member.name,
                                      isBanned: member.isBanned || false,
                                    })
                                  }
                                  disabled={banningUserId === member.id}
                                  className={`flex items-center gap-2 ${
                                    member.isBanned
                                      ? "text-green-600 focus:text-green-600 focus:bg-green-50"
                                      : "text-red-600 focus:text-red-600 focus:bg-red-50"
                                  }`}
                                >
                                  {banningUserId === member.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : member.isBanned ? (
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                  ) : (
                                    <Ban className="h-4 w-4 mr-2" />
                                  )}
                                  {member.isBanned ? "Débannir" : "Bannir"}{" "}
                                  l&apos;utilisateur
                                </DropdownMenuItem>

                                {/* Actions réservées aux utilisateurs avec permissions */}
                                {canChangeRoles() && (
                                  <>
                                    <DropdownMenuSeparator />

                                    {/* Changer le rôle */}
                                    <DropdownMenuItem
                                      disabled
                                      className="text-xs font-medium text-gray-500 uppercase"
                                    >
                                      Changer le rôle
                                    </DropdownMenuItem>

                                    {/* Tous les rôles disponibles */}
                                    {availableRoles
                                      .filter((role) => role.name !== member.role)
                                      .map((role) => (
                                        <DropdownMenuItem
                                          key={role.id}
                                          onClick={() => handleChangeRole(member.id, role.name)}
                                          className="flex items-center gap-2"
                                        >
                                          <span
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: role.color }}
                                          />
                                          {role.displayName}
                                        </DropdownMenuItem>
                                      ))}

                                    <DropdownMenuSeparator />

                                    {/* Supprimer */}
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setDeleteConfirm({
                                          id: member.id,
                                          name: member.name,
                                        })
                                      }
                                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Supprimer définitivement
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Modal de confirmation de ban/unban */}
        {banConfirm && (
          <Dialog open={true} onOpenChange={() => setBanConfirm(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle
                  className={`flex items-center gap-2 ${
                    banConfirm.isBanned ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                  {banConfirm.isBanned ? "Débannir" : "Bannir"} l'utilisateur
                </DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir{" "}
                  {banConfirm.isBanned ? "débannir" : "bannir"} l'utilisateur "
                  {banConfirm.name}" ?
                  {!banConfirm.isBanned && (
                    <>
                      <br />
                      L'utilisateur ne pourra plus se connecter ni interagir
                      avec la communauté.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setBanConfirm(null)}
                  disabled={banningUserId !== null}
                >
                  Annuler
                </Button>
                <Button
                  variant={banConfirm.isBanned ? "default" : "destructive"}
                  onClick={() =>
                    handleToggleBan(banConfirm.id, banConfirm.isBanned)
                  }
                  disabled={banningUserId !== null}
                >
                  {banningUserId !== null ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {banConfirm.isBanned
                        ? "Débannissement..."
                        : "Bannissement..."}
                    </>
                  ) : banConfirm.isBanned ? (
                    "Débannir"
                  ) : (
                    "Bannir"
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
                  Supprimer définitivement l'utilisateur
                </DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer définitivement
                  l'utilisateur "{deleteConfirm.name}" ?<br />
                  <strong className="text-red-600">
                    Cette action est irréversible
                  </strong>{" "}
                  et supprimera :
                  <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Tous ses posts et commentaires</li>
                    <li>Toutes ses réactions</li>
                    <li>Son profil complet</li>
                    <li>Toutes ses données associées</li>
                  </ul>
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deletingUserId !== null}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteUser(deleteConfirm.id)}
                  disabled={deletingUserId !== null}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deletingUserId !== null ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Suppression...
                    </>
                  ) : (
                    "Supprimer définitivement"
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
