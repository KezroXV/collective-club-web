"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Upload, Trash2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface Badge {
  id: string;
  name: string;
  imageUrl: string;
  requiredPoints: number;
  isDefault: boolean;
}

interface EditBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: Badge | null;
  userId?: string;
  onBadgeUpdated?: () => void;
}

export default function EditBadgeModal({
  isOpen,
  onClose,
  badge,
  userId,
  onBadgeUpdated,
}: EditBadgeModalProps) {
  const [badgeName, setBadgeName] = useState("");
  const [badgeImage, setBadgeImage] = useState("");
  const [badgeCount, setBadgeCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const badgeImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && badge) {
      setBadgeName(badge.name);
      setBadgeImage(badge.imageUrl);
      setBadgeCount(badge.requiredPoints);
    }
  }, [isOpen, badge]);

  const handleBadgeImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setBadgeImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateBadge = async () => {
    if (!badgeName.trim()) {
      toast.error("Veuillez entrer un nom pour le badge");
      return;
    }

    if (!badgeImage) {
      toast.error("Veuillez ajouter une image pour le badge");
      return;
    }

    if (!userId || !badge) {
      toast.error("Informations manquantes");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/badges/${badge.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          name: badgeName,
          imageUrl: badgeImage,
          requiredPoints: badgeCount,
        }),
      });

      if (response.ok) {
        toast.success(`Badge "${badgeName}" modifié !`);
        onBadgeUpdated?.();
        handleClose();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || "Erreur lors de la modification";
        
        if (response.status === 409) {
          // Erreur de conflit (nom de badge déjà existant)
          toast.error(`❌ ${errorMessage}`);
        } else {
          toast.error(errorMessage);
        }
        return;
      }
    } catch (error) {
      console.error("Erreur lors de la modification du badge:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de modifier le badge"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBadge = () => {
    if (!badge) return;
    if (badge.isDefault) {
      toast.error("Impossible de supprimer un badge par défaut");
      return;
    }
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!userId || !badge) {
      toast.error("Informations manquantes");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/badges/${badge.id}?userId=${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(`Badge "${badge.name}" supprimé !`);
        onBadgeUpdated?.();
        handleClose();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du badge:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer le badge"
      );
    } finally {
      setIsLoading(false);
      setIsConfirmOpen(false);
    }
  };

  const handleClose = () => {
    onClose();
    setBadgeName("");
    setBadgeImage("");
    setBadgeCount(5);
  };

  const incrementBadgeCount = () => {
    setBadgeCount((prev) => prev + 5);
  };

  const decrementBadgeCount = () => {
    setBadgeCount((prev) => Math.max(5, prev - 5));
  };

  if (!badge) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-auto max-w-[90vw] sm:max-w-[320px] p-4">
        <DialogHeader className="relative">
          <DialogTitle className="text-center text-gray-600 text-sm">
            modifier
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex justify-center">
            <div className="flex items-center gap-1 border rounded-full px-3 py-1">
              <span className="text-sm font-medium">{badgeCount}</span>
              <div className="flex flex-col">
                <button
                  onClick={incrementBadgeCount}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-2.5 h-2.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  onClick={decrementBadgeCount}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-2.5 h-2.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div
              onClick={() => badgeImageInputRef.current?.click()}
              className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              {badgeImage ? (
                <Image
                  src={badgeImage}
                  alt="Badge preview"
                  width={88}
                  height={88}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <>
                  <Upload className="h-6 w-6 text-gray-400 mb-1" />
                  <span className="text-[10px] text-gray-500 text-center">
                    Cliquer pour uploader
                  </span>
                </>
              )}
            </div>
            <input
              ref={badgeImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleBadgeImageUpload}
              className="hidden"
            />
          </div>

          <div className="text-center">
            <Input
              value={badgeName}
              onChange={(e) => setBadgeName(e.target.value)}
              placeholder="Nom..."
              className="text-center border-0 border-b border-chart-4 rounded-none focus:border-gray-400 text-sm text-gray-400 bg-transparent p-1"
            />
          </div>

          <div className="flex justify-center gap-2 pt-2">
            {!badge.isDefault && (
              <button
                onClick={handleDeleteBadge}
                disabled={isLoading}
                className="w-8 h-8 rounded-full border-2 border-red-300 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full border-2 border-red-300 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors text-sm"
            >
              ×
            </button>
            <button
              onClick={handleUpdateBadge}
              disabled={isLoading}
              className="w-8 h-8 rounded-full border-2 border-green-300 flex items-center justify-center text-green-500 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "..." : "✓"}
            </button>
          </div>
        </div>
      </DialogContent>
      {/* Confirmation dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="w-auto max-w-[90vw] sm:max-w-[320px] p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-gray-600 text-sm">
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600 text-center">
            Voulez-vous vraiment supprimer ce badge ?
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="px-3 py-1.5 rounded border-2 border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={confirmDelete}
              disabled={isLoading}
              className="px-3 py-1.5 rounded border-2 border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {isLoading ? "..." : "Supprimer"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
