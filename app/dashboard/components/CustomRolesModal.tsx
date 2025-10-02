"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Permission, UserRole, ROLE_PERMISSIONS } from "@/lib/permissions";
import { useShop } from "@/lib/hooks/useShop";

interface Role {
  id: string;
  name: string;
  displayName: string;
  color: string;
  permissions: string[];
  isDefault: boolean;
  _count?: {
    users: number;
  };
}

interface CustomRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  shopId: string;
}

export default function CustomRolesModal({
  isOpen,
  onClose,
  userId,
  shopId
}: CustomRolesModalProps) {
  const { shopDomain } = useShop();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Formulaire simplifié
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    permissionType: "" as "admin" | "moderator" | ""
  });

  const resetForm = () => {
    setFormData({
      name: "",
      displayName: "",
      permissionType: ""
    });
    setIsEditing(false);
    setEditingRole(null);
  };

  // Wrapper pour onClose qui reset aussi la modal
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Initialiser les rôles par défaut si nécessaire
  const initializeDefaultRoles = async () => {
    if (!shopDomain) return;

    try {
      const response = await fetch(`/api/roles/init?userId=${userId}&shop=${shopDomain}`, {
        method: 'POST',
      });
      if (response.ok) {
        setIsInitialized(true);
      }
    } catch (error) {
      console.error("Error initializing default roles:", error);
    }
  };

  // Charger tous les rôles
  const loadRoles = async () => {
    if (!shopId || !shopDomain) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/roles?shop=${shopDomain}`);
      if (response.ok) {
        const rolesData = await response.json();
        setRoles(rolesData);
        setIsInitialized(true);
      } else {
        // Si aucun rôle n'existe, initialiser les rôles par défaut
        if (response.status === 404 || !isInitialized) {
          await initializeDefaultRoles();
          // Recharger après initialisation
          const retryResponse = await fetch(`/api/roles?shop=${shopDomain}`);
          if (retryResponse.ok) {
            const rolesData = await retryResponse.json();
            setRoles(rolesData);
          }
        } else {
          toast.error("Erreur lors du chargement des rôles");
        }
      }
    } catch (error) {
      console.error("Error loading roles:", error);
      toast.error("Erreur lors du chargement des rôles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && shopDomain) {
      loadRoles();
      // Reset le mode édition quand on ouvre la modal
      resetForm();
    }
  }, [isOpen, shopId, shopDomain]);

  const handleEdit = (role: Role) => {
    // Ne permettre l'édition que des rôles non-par défaut
    if (role.isDefault) {
      toast.error("Les rôles par défaut ne peuvent pas être modifiés");
      return;
    }

    // Déterminer le type de permissions basé sur les permissions du rôle
    const isAdminPerms = ROLE_PERMISSIONS[UserRole.ADMIN].every(perm =>
      role.permissions.includes(perm)
    );
    const isModeratorPerms = ROLE_PERMISSIONS[UserRole.MODERATOR].every(perm =>
      role.permissions.includes(perm)
    );

    setFormData({
      name: role.name,
      displayName: role.displayName,
      permissionType: isAdminPerms ? "admin" : isModeratorPerms ? "moderator" : ""
    });
    setEditingRole(role);
    setIsEditing(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Le nom du rôle est requis");
      return;
    }

    if (!formData.displayName.trim()) {
      toast.error("Le nom d'affichage est requis");
      return;
    }

    if (!formData.permissionType) {
      toast.error("Le type de permissions est requis");
      return;
    }

    setIsLoading(true);
    try {
      const url = editingRole
        ? `/api/roles/${editingRole.id}?userId=${userId}&shop=${shopDomain}`
        : `/api/roles?userId=${userId}&shop=${shopDomain}`;

      const method = editingRole ? 'PUT' : 'POST';

      const payload = {
        name: formData.name.trim(),
        displayName: formData.displayName.trim(),
        color: "#3B82F6",
        permissionType: formData.permissionType
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingRole ? "Rôle modifié avec succès" : "Rôle créé avec succès");
        await loadRoles();
        resetForm();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Error saving role:", error);
      toast.error("Erreur lors de la sauvegarde du rôle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (role.isDefault) {
      toast.error("Les rôles par défaut ne peuvent pas être supprimés");
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${role.displayName}" ?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/roles/${role.id}?userId=${userId}&shop=${shopDomain}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Rôle supprimé avec succès");
        await loadRoles();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error("Erreur lors de la suppression du rôle");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le rôle" : "Gestion des rôles"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              {/* Formulaire simplifié */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nom du rôle (identifiant)
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: SUPER_MODERATOR"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Utilisé en interne, sera converti en majuscules
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Nom d'affichage
                </label>
                <Input
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Ex: Super Modérateur"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nom affiché aux utilisateurs
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Type de permissions
                </label>
                <Select
                  value={formData.permissionType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, permissionType: value as "admin" | "moderator" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moderator">Permissions Modérateur</SelectItem>
                    <SelectItem value="admin">Permissions Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? "Sauvegarde..." : (editingRole ? "Modifier" : "Créer")}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Bouton créer nouveau rôle */}
              <Button onClick={() => setIsEditing(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau rôle
              </Button>

              {/* Liste des rôles simplifiée */}
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Chargement...</p>
                </div>
              ) : roles.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Aucun rôle trouvé
                </div>
              ) : (
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div key={role.id} className="border rounded p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: role.color }}
                          />
                          <div>
                            <h3 className="font-medium">
                              {role.displayName}
                              {role.isDefault && (
                                <span className="text-xs text-gray-500 ml-2">(par défaut)</span>
                              )}
                            </h3>
                            <p className="text-xs text-gray-600">
                              {role.name} • {role._count?.users || 0} utilisateur(s)
                            </p>
                          </div>
                        </div>

                        {!role.isDefault && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(role)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(role)}
                              disabled={(role._count?.users || 0) > 0}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="pt-4 border-t">
            <Button variant="outline" onClick={handleClose} className="w-full">
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}