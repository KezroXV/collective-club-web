"use client";

import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

interface User {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}

interface ProfilePhotoUploadProps {
  currentUser: User;
  isEditing: boolean;
  selectedImage: File | null;
  setSelectedImage: (file: File | null) => void;
  imagePreview: string | null;
  setImagePreview: (preview: string | null) => void;
}

export default function ProfilePhotoUpload({
  currentUser,
  isEditing,
  selectedImage,
  setSelectedImage,
  imagePreview,
  setImagePreview,
}: ProfilePhotoUploadProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Photo de profil</Label>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar 
            className="h-20 w-20 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => document.getElementById('profile-image-input')?.click()}
          >
            <AvatarImage src={imagePreview || currentUser.image || undefined} />
            <AvatarFallback className="bg-blue-500 text-white font-semibold text-xl">
              {getInitials(currentUser.name || "")}
            </AvatarFallback>
          </Avatar>
          {isEditing && (
            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1.5 shadow-md">
              <Camera className="h-3 w-3" />
            </div>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {isEditing ? (
            <>
              <p>Cliquez sur l'image pour la modifier</p>
              <p className="text-xs">Formats: JPG, PNG (max 5MB)</p>
              {selectedImage && (
                <p className="text-green-600 text-xs mt-1">
                  ✓ Nouvelle image sélectionnée
                </p>
              )}
            </>
          ) : (
            <>
              <p>Photo de profil actuelle</p>
              <p className="text-xs">Modifiable en mode édition</p>
            </>
          )}
        </div>
      </div>
      <input
        id="profile-image-input"
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        onChange={handleImageSelect}
        className="hidden"
        disabled={!isEditing}
      />
    </div>
  );
}