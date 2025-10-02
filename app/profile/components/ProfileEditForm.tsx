"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import ProfilePhotoUpload from "./ProfilePhotoUpload";

// Fonction pour compresser les images
const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      // Calculer les nouvelles dimensions en gardant le ratio
      let { width, height } = img;
      const ratio = Math.min(maxWidth / width, maxHeight / height);

      if (ratio < 1) {
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Dessiner l'image redimensionnée
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir en blob avec compression
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob!], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve(compressedFile);
      }, 'image/jpeg', quality);
    };

    img.src = URL.createObjectURL(file);
  });
};

interface User {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}

interface ProfileEditFormProps {
  currentUser: User;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
  borderColor?: string;
}

export default function ProfileEditForm({
  currentUser,
  isEditing,
  onEditingChange,
  borderColor = "#E5E7EB",
}: ProfileEditFormProps) {
  const { update: updateSession } = useSession();
  const [editForm, setEditForm] = useState({
    name: currentUser.name || "",
    email: currentUser.email || "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const isOAuthUser = () => {
    return true;
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    setIsSaving(true);
    try {
      const updateData: any = {};

      if (editForm.name !== currentUser.name) {
        updateData.name = editForm.name;
      }

      if (editForm.email !== currentUser.email) {
        updateData.email = editForm.email;
      }

      if (selectedImage) {
        try {
          // Compresser l'image avant conversion
          const compressedImage = await compressImage(selectedImage, 400, 400, 0.8);

          const reader = new FileReader();
          const imageDataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(compressedImage);
          });

          updateData.image = imageDataUrl;
        } catch (error) {
          console.error('Erreur lecture image:', error);
          toast.error("Erreur lors de la lecture de l'image");
          setIsSaving(false);
          return;
        }
      }

      if (editForm.newPassword && !isOAuthUser()) {
        if (editForm.newPassword !== editForm.confirmPassword) {
          toast.error("Les mots de passe ne correspondent pas");
          return;
        }
        updateData.password = editForm.newPassword;
      }

      if (Object.keys(updateData).length > 0) {
        const response = await fetch(`/api/profile/update`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.user) {
            await updateSession();
            
            setEditForm(prev => ({
              ...prev,
              name: result.user.name || "",
              email: result.user.email || ""
            }));
            
            setSelectedImage(null);
            setImagePreview(null);
          }
          toast.success("Profil mis à jour avec succès");
        } else {
          const error = await response.json();
          toast.error(`Erreur lors de la sauvegarde: ${error.error || 'Erreur inconnue'}`);
        }
      }

      onEditingChange(false);
      setEditForm((prev) => ({
        ...prev,
        newPassword: "",
        confirmPassword: "",
      }));
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onEditingChange(false);
    setEditForm({
      name: currentUser.name || "",
      email: currentUser.email || "",
      newPassword: "",
      confirmPassword: "",
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  return (
    <Card style={{ borderColor }}>
      <CardHeader>
        <CardTitle>Informations du profil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ProfilePhotoUpload
          currentUser={currentUser}
          isEditing={isEditing}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          imagePreview={imagePreview}
          setImagePreview={setImagePreview}
        />

        <div className="space-y-2">
          <Label htmlFor="name">Nom</Label>
          {isEditing ? (
            <Input
              id="name"
              value={editForm.name}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Votre nom complet"
            />
          ) : (
            <div className="p-2 border rounded-md bg-gray-50">
              {currentUser.name || "Non renseigné"}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          {isEditing ? (
            <div>
              <Input
                id="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                type="email"
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-gray-500 mt-1">
                Email géré par Google (non modifiable)
              </p>
            </div>
          ) : (
            <div className="p-2 border rounded-md bg-gray-50">
              {currentUser.email}
            </div>
          )}
        </div>

        {!isOAuthUser() && (
          <>
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Modification du mot de passe
              </h3>

              {isEditing && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">
                      Nouveau mot de passe
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={editForm.newPassword}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      placeholder="Laissez vide pour ne pas modifier"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirmez le nouveau mot de passe
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={editForm.confirmPassword}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="Confirmez votre nouveau mot de passe"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {isEditing && (
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <Save className="h-4 w-4" />
              {isSaving ? "Sauvegarde..." : "Enregistrer"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Annuler
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}