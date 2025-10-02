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
import {
  Search,
  Users,
  Shield,
  ShieldCheck,
  Crown,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserRole,
  getRoleLabel,
  getRoleColor,
  getAssignableRoles,
  canChangeRole,
  RoleChangeContext,
} from "@/lib/permissions";

interface MemberWithRole {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
  isOwner?: boolean;
  postsCount: number;
  commentsCount: number;
  reactionsCount: number;
}

interface RolesMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  shopId?: string;
  variant?: "modal" | "inline";
}

export default function RolesMembersModal({
  isOpen,
  onClose,
  userId,
  shopId,
  variant = "modal",
}: RolesMembersModalProps) {
  const [members, setMembers] = useState<MemberWithRole[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(
    UserRole.MEMBER
  );
  const [isChangingRole, setIsChangingRole] = useState<string | null>(null);
  const [changeResult, setChangeResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!isOpen) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      params.append("limit", "50"); // Limite raisonnable pour la modal

      const response = await fetch(`/api/members?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const membersData: MemberWithRole[] = data.members.map(
        (member: {
          id: string;
          name: string;
          email: string;
          role: string;
          createdAt: string;
          isActive: boolean;
          isOwner?: boolean;
          postsCount: number;
          commentsCount: number;
          reactionsCount: number;
        }) => ({
          ...member,
          role: member.role as UserRole,
        })
      );

      setMembers(membersData);
      setFilteredMembers(membersData);

      // Déterminer le rôle de l'utilisateur actuel
      const currentMember = membersData.find((m) => m.id === userId);
      if (currentMember) {
        setCurrentUserRole(currentMember.role);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, userId]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterMembers(query, roleFilter);
  };

  const handleRoleFilter = (role: UserRole | "ALL") => {
    setRoleFilter(role);
    filterMembers(searchQuery, role);
  };

  const filterMembers = (search: string, roleFilterValue: UserRole | "ALL") => {
    let filtered = members;

    // Filtrer par recherche
    if (search.trim()) {
      filtered = filtered.filter(
        (member) =>
          member.name.toLowerCase().includes(search.toLowerCase()) ||
          member.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filtrer par rôle
    if (roleFilterValue !== "ALL") {
      filtered = filtered.filter((member) => member.role === roleFilterValue);
    }

    setFilteredMembers(filtered);
  };

  const handleRoleChange = async (
    memberId: string,
    newRole: UserRole,
    reason?: string
  ) => {
    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember || !userId) return;

    // Vérifier les permissions localement
    const context: RoleChangeContext = {
      actorId: userId,
      actorRole: currentUserRole,
      targetId: memberId,
      targetRole: targetMember.role,
      newRole,
      isTargetOwner: targetMember.isOwner || false,
      shopId: shopId || "",
    };

    const permissionCheck = canChangeRole(context);
    if (!permissionCheck.allowed) {
      setChangeResult({
        type: "error",
        message: permissionCheck.reason || "Changement non autorisé",
      });
      return;
    }

    try {
      setIsChangingRole(memberId);
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);

      const requestBody = { 
        userId: userId,
        userRole: currentUserRole,
        newRole: newRole,
        reason 
      };
      
      console.log('Frontend sending role change request:', {
        memberId,
        requestBody,
        userId,
        currentUserRole,
        newRole
      });

      const response = await fetch(
        `/api/users/${memberId}?${params.toString()}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors du changement de rôle");
      }

      const result = await response.json();

      // Mettre à jour la liste locale
      setMembers((prev) =>
        prev.map((member) =>
          member.id === memberId ? { ...member, role: newRole } : member
        )
      );

      setFilteredMembers((prev) =>
        prev.map((member) =>
          member.id === memberId ? { ...member, role: newRole } : member
        )
      );

      setChangeResult({
        type: "success",
        message: result.message || `Rôle changé vers ${getRoleLabel(newRole)}`,
      });
    } catch (error) {
      console.error("Error changing role:", error);
      setChangeResult({
        type: "error",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setIsChangingRole(null);
      // Masquer le message après 3 secondes
      setTimeout(() => setChangeResult(null), 3000);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Crown className="h-4 w-4" />;
      case UserRole.MODERATOR:
        return <ShieldCheck className="h-4 w-4" />;
      case UserRole.MEMBER:
        return <Shield className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  // no-op helpers removed for compact UI

  const getAssignableRolesForMember = (targetMember: MemberWithRole) => {
    if (targetMember.isOwner || targetMember.id === userId) {
      return [];
    }
    return getAssignableRoles(currentUserRole);
  };

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, userId, fetchMembers]);
  const content = (
    <>
      {changeResult && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg ${
            changeResult.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {changeResult.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">{changeResult.message}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold">Rôles</h3>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronRight className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {roleFilter === "ALL"
                  ? "Tous les rôles"
                  : getRoleLabel(roleFilter as UserRole)}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleRoleFilter("ALL")}>
                Tous les rôles
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleRoleFilter(UserRole.ADMIN)}
              >
                {getRoleLabel(UserRole.ADMIN)}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleRoleFilter(UserRole.MODERATOR)}
              >
                {getRoleLabel(UserRole.MODERATOR)}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleRoleFilter(UserRole.MEMBER)}
              >
                {getRoleLabel(UserRole.MEMBER)}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">
                Chargement des membres...
              </span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery || roleFilter !== "ALL"
                ? "Aucun membre trouvé avec ces critères"
                : "Aucun membre dans votre communauté"}
            </div>
          ) : (
            filteredMembers.map((member, index) => {
              const assignableRoles = getAssignableRolesForMember(member);
              const canModify = assignableRoles.length > 0;

              const initials = (member.name || "?")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={member.id}
                  className={`py-4 ${
                    index !== 0 ? "border-t border-chart-4" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-gray-900 truncate max-w-xs sm:max-w-sm">
                            {member.name}
                          </span>
                          {member.isOwner && (
                            <Crown className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <p className="text-[12px] text-gray-500 truncate max-w-md">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        className={`text-[10px] px-3 py-1 rounded-full ${getRoleColor(
                          member.role
                        )}`}
                      >
                        {getRoleLabel(member.role)}
                      </Badge>
                      {canModify && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                            >
                              {isChangingRole === member.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-5 w-5" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem className="flex items-center gap-2">
                              Assigner à...
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-gray-600">
                              Modifier les rôles…
                            </DropdownMenuItem>
                            <div className="h-px bg-gray-200 my-1" />
                            {assignableRoles.map((role) => (
                              <DropdownMenuItem
                                key={role}
                                onClick={() =>
                                  handleRoleChange(member.id, role)
                                }
                                className="flex items-center gap-2"
                              >
                                {getRoleIcon(role)}
                                Promouvoir vers {getRoleLabel(role)}
                              </DropdownMenuItem>
                            ))}
                            {member.role !== UserRole.MEMBER && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRoleChange(member.id, UserRole.MEMBER)
                                }
                                className="flex items-center gap-2 text-orange-600"
                              >
                                <Shield className="h-4 w-4" />
                                Rétrograder vers Membre
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );

  if (variant === "inline") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-gray-800">Rôles</h4>
        </div>
        {content}
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        size="full"
        className="sm:max-w-6xl w-[95vw] max-h-[85vh] overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion des Rôles et Membres
          </DialogTitle>
          <DialogDescription>
            Gérez les rôles et permissions des membres de votre communauté
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
