"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Plus, Edit2, RotateCcw } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import ColorPicker from "./ColorPicker";
import BadgeModal from "./BadgeModal";
import EditBadgeModal from "./EditBadgeModal";
import PostPreview from "./PostPreview";
import { useTheme } from "@/contexts/ThemeContext";

const FONTS = [
  { name: "Inter", value: "font-inter" },
  { name: "Poppins", value: "font-poppins" },
  { name: "Arial", value: "font-arial" },
  { name: "Helvetica", value: "font-helvetica" },
  { name: "Roboto", value: "font-roboto" },
];

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export default function CustomizationModal({
  isOpen,
  onClose,
  userId,
}: CustomizationModalProps) {
  const {
    colors: globalColors,
    selectedFont: globalFont,
    bannerImageUrl: globalBannerImage,
    updateTheme,
  } = useTheme();

  const [activeColorTab, setActiveColorTab] = useState("Posts");
  const [colors, setColors] = useState(globalColors);
  const [selectedFont, setSelectedFont] = useState(globalFont);
  const [bannerImage, setBannerImage] = useState(
    globalBannerImage || "/Bannière.svg"
  );
  const [isAddBadgeModalOpen, setIsAddBadgeModalOpen] = useState(false);
  const [isEditBadgeModalOpen, setIsEditBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Charger les badges
  const loadBadges = useCallback(async () => {
    if (!userId) return;

    // Récupérer les informations utilisateur depuis localStorage
    const storedUser = localStorage.getItem("currentUser");
    let shopId = null;

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        shopId = user.shopId;
      } catch (error) {
        console.error("Error parsing stored user:", error);
        return;
      }
    }

    if (!shopId) {
      console.error("No shopId found in currentUser");
      return;
    }

    setIsLoadingBadges(true);
    try {
      const response = await fetch(
        `/api/badges?userId=${userId}&shopId=${shopId}`
      );

      if (response.ok) {
        const badgesData = await response.json();

        // Trier les badges par ordre croissant de points requis
        const sortedBadges = badgesData.sort(
          (a: any, b: any) => a.requiredPoints - b.requiredPoints
        );

        // L'API crée automatiquement les badges par défaut si ils n'existent pas
        setBadges(sortedBadges);
      } else {
        console.error(
          "Failed to load badges:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Erreur lors du chargement des badges:", error);
    } finally {
      setIsLoadingBadges(false);
    }
  }, [userId]);

  // Synchroniser avec le contexte global au moment de l'ouverture
  useEffect(() => {
    if (isOpen) {
      setColors(globalColors);
      setSelectedFont(globalFont);
      setBannerImage(globalBannerImage || "/Bannière.svg");
      loadBadges();
    }
  }, [isOpen, globalColors, globalFont, globalBannerImage, loadBadges]);

  const handleColorChange = (color: string) => {
    setColors((prev) => ({
      ...prev,
      [activeColorTab]: color,
    }));
  };

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setBannerImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    const defaultColors = {
      Posts: "#3B82F6",
      Bordures: "#E5E7EB",
      Fond: "#F9FAFB",
      Police: "#111827",
    };

    setColors(defaultColors);
    setSelectedFont("Helvetica");
    setBannerImage("/Bannière.svg");

    toast.success("Paramètres remis par défaut !");
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error("Utilisateur non connecté");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/customization", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          colorPosts: colors.Posts,
          colorBorders: colors.Bordures,
          colorBg: colors.Fond,
          colorText: colors.Police,
          selectedFont,
          coverImageUrl: null,
          bannerImageUrl: bannerImage,
        }),
      });

      if (response.ok) {
        // Mettre à jour le contexte global
        updateTheme(colors, selectedFont, null, bannerImage);
        toast.success("Personnalisation enregistrée !");
        onClose();
      } else {
        throw new Error("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Impossible de sauvegarder les paramètres");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          size="full"
          className="sm:max-w-7xl w-[96vw] max-h-[90vh] flex flex-col"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Personnalisation du forum
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 py-4 flex-1 overflow-y-auto">
            {/* Contenu principal */}
            <div className="lg:col-span-4 space-y-4">
              {/* Section Couleurs */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Couleurs
                </h3>

                <Tabs value={activeColorTab} onValueChange={setActiveColorTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="Posts">Posts</TabsTrigger>
                    <TabsTrigger value="Bordures">Bordures</TabsTrigger>
                    <TabsTrigger value="Fond">Fond</TabsTrigger>
                    <TabsTrigger value="Police">Police</TabsTrigger>
                  </TabsList>

                  <ColorPicker
                    color={colors[activeColorTab as keyof typeof colors]}
                    onChange={handleColorChange}
                    borderColor={colors.Bordures}
                  />
                </Tabs>
              </div>

              {/* Section Police */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Police
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {FONTS.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => setSelectedFont(font.name)}
                      className={`px-3 py-0.5 rounded-4xl border text-center transition-all ${
                        selectedFont === font.name
                          ? "border-blue-500 bg-blue-50"
                          : "border-chart-4 hover:border-gray-300"
                      }`}
                      style={{ fontFamily: font.name }}
                    >
                      <span className="font-medium text-xs">{font.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section Bannière */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    Bannière du forum
                  </h3>
                  <Button
                    onClick={() => bannerInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="text-gray-600 hover:text-gray-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Changer
                  </Button>
                </div>

                <div className="relative">
                  <Image
                    src={bannerImage}
                    alt="Bannière"
                    width={400}
                    height={100}
                    className="w-full h-24 object-cover rounded-lg border border-chart-4"
                  />
                </div>

                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
              </div>

              {/* Section Paliers */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Paliers
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {isLoadingBadges ? (
                    <div className="col-span-4 text-center text-gray-500 text-sm py-4">
                      Chargement des badges...
                    </div>
                  ) : (
                    <>
                      {badges.map((badge) => (
                        <div key={badge.id} className="text-center">
                          <div
                            className="relative mx-auto mb-1.5 drop-hover:shadow-sm"
                            style={{ width: 56, height: 56 }}
                          >
                            <Image
                              src={badge.imageUrl}
                              alt={badge.name}
                              width={56}
                              height={56}
                              className="rounded-full"
                            />
                            <span
                              className="absolute -top-1.5 -right-1.5 text-[9px] px-1 py-0.5 rounded bg-white shadow"
                              style={{ border: `1px solid ${colors.Bordures}` }}
                            >
                              {badge.requiredPoints || badge.requiredCount || 0}
                            </span>
                          </div>
                          <p className="font-medium text-xs text-gray-900">
                            {badge.name}
                          </p>
                          {!badge.isDefault && (
                            <div
                              className="flex items-center justify-center gap-1 mt-1 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedBadge(badge);
                                setIsEditBadgeModalOpen(true);
                              }}
                            >
                              <Edit2 className="h-2.5 w-2.5" />
                              <span className="text-[10px]">Modifier</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                  <div className="text-center">
                    <button
                      onClick={() => setIsAddBadgeModalOpen(true)}
                      className="w-14 h-14 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mx-auto mb-1.5 hover:border-gray-400 transition-colors bg-white/60"
                    >
                      <Plus className="h-5 w-5 text-gray-400" />
                    </button>
                    <p className="font-medium text-xs text-gray-500">Ajouter</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview à droite */}
            <div className="lg:col-span-6">
              <PostPreview
                colors={colors}
                selectedFont={selectedFont}
                coverImage={undefined}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t mt-4 flex-shrink-0">
            <Button
              variant="outline"
              onClick={handleReset}
              className="text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Par défaut
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BadgeModal
        isOpen={isAddBadgeModalOpen}
        onClose={() => setIsAddBadgeModalOpen(false)}
        userId={userId}
        onBadgeCreated={() => {
          // Callback pour rafraîchir les badges après création
          loadBadges();
          setIsAddBadgeModalOpen(false);
        }}
      />

      <EditBadgeModal
        isOpen={isEditBadgeModalOpen}
        onClose={() => {
          setIsEditBadgeModalOpen(false);
          setSelectedBadge(null);
        }}
        badge={selectedBadge}
        userId={userId}
        onBadgeUpdated={() => {
          // Callback pour rafraîchir les badges après modification
          loadBadges();
          setIsEditBadgeModalOpen(false);
          setSelectedBadge(null);
        }}
      />
    </>
  );
}
