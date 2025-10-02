"use client";

import { Button } from "@/components/ui/button";
import { Camera, Save } from "lucide-react";

interface ProfileHeaderProps {
  isEditing: boolean;
  isSaving: boolean;
  onEditingToggle: () => void;
  onSaveProfile: () => void;
}

export default function ProfileHeader({
  isEditing,
  isSaving,
  onEditingToggle,
  onSaveProfile,
}: ProfileHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil</h1>
        <p className="text-gray-600">
          Vous pouvez gérer votre profil ici
        </p>
      </div>
      <Button
        onClick={isEditing ? onSaveProfile : onEditingToggle}
        disabled={isSaving}
        className="flex items-center gap-2"
      >
        {isSaving ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : isEditing ? (
          <Save className="h-4 w-4" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        {isSaving
          ? "Sauvegarde..."
          : isEditing
          ? "Enregistrer"
          : "Modifier"}
      </Button>
    </div>
  );
}