"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  shopId?: string;
}

export default function CustomizationModal({
  isOpen,
  onClose,
  userId,
  shopId,
}: CustomizationModalProps) {
  const {
    colors: globalColors,
    selectedFont: globalFont,
    bannerImageUrl: globalBannerImage,
    logoImageUrl: globalLogoImage,
    updateTheme,
  } = useTheme();

  const [activeColorTab, setActiveColorTab] = useState("Posts");
  const [colors, setColors] = useState(globalColors);
  const [selectedFont, setSelectedFont] = useState(globalFont);
  const [bannerImage, setBannerImage] = useState(
    globalBannerImage || "/Bannière.svg"
  );
  const [logoImage, setLogoImage] = useState<string | null>(
    globalLogoImage || null
  );
  const [isAddBadgeModalOpen, setIsAddBadgeModalOpen] = useState(false);
  const [isEditBadgeModalOpen, setIsEditBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Charger les badges
  const loadBadges = useCallback(async () => {
    if (!userId) {
      console.log("⚠️ loadBadges: userId manquant");
      return;
    }

    if (!shopId) {
      console.log("⚠️ loadBadges: shopId manquant");
      return;
    }

    console.log("🔄 Chargement des badges...", { userId, shopId });
    setIsLoadingBadges(true);
    try {
      const response = await fetch(
        `/api/badges?userId=${userId}&shopId=${shopId}`
      );

      console.log("📡 Réponse API badges:", response.status);

      if (response.ok) {
        const badgesData = await response.json();
        console.log("✅ Badges reçus:", badgesData);

        // Trier les badges par ordre croissant de points requis
        const sortedBadges = badgesData.sort(
          (a: any, b: any) => a.requiredPoints - b.requiredPoints
        );

        // L'API crée automatiquement les badges par défaut si ils n'existent pas
        setBadges(sortedBadges);
      } else {
        console.error(
          "❌ Failed to load badges:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement des badges:", error);
    } finally {
      setIsLoadingBadges(false);
    }
  }, [userId, shopId]);

  // Synchroniser avec le contexte global au moment de l'ouverture
  useEffect(() => {
    if (isOpen) {
      setColors(globalColors);
      setSelectedFont(globalFont);
      setBannerImage(globalBannerImage || "/Bannière.svg");
      setLogoImage(globalLogoImage || null);
      loadBadges();
    }
  }, [
    isOpen,
    globalColors,
    globalFont,
    globalBannerImage,
    globalLogoImage,
    loadBadges,
  ]);

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

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setLogoImage(reader.result as string);
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
    setLogoImage(null);

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
          logoImageUrl: logoImage,
        }),
      });

      if (response.ok) {
        // Mettre à jour le contexte global
        updateTheme(colors, selectedFont, null, bannerImage, logoImage);
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
          className="sm:max-w-7xl w-[96vw] max-h-[90vh] flex flex-col p-4 sm:p-6"
        >
          <DialogHeader className="pb-3 sm:pb-4">
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              Personnalisation du forum
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 sm:gap-6 py-2 sm:py-4 flex-1 overflow-y-auto">
            {/* Contenu principal */}
            <div className="lg:col-span-4 space-y-3 sm:space-y-4">
              {/* Section Couleurs */}
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3">
                  Couleurs
                </h3>

                <div className="flex gap-2 mb-3 flex-wrap">
                  <Button
                    variant={activeColorTab === "Posts" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveColorTab("Posts")}
                    className="text-xs sm:text-sm rounded-full"
                  >
                    Posts
                  </Button>
                  <Button
                    variant={activeColorTab === "Bordures" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveColorTab("Bordures")}
                    className="text-xs sm:text-sm rounded-full"
                  >
                    Bordures
                  </Button>
                  <Button
                    variant={activeColorTab === "Police" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveColorTab("Police")}
                    className="text-xs sm:text-sm rounded-full"
                  >
                    Police
                  </Button>
                </div>

                <ColorPicker
                  color={colors[activeColorTab as keyof typeof colors]}
                  onChange={handleColorChange}
                  borderColor={colors.Bordures}
                />
              </div>

              {/* Section Police */}
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3">
                  Police
                </h3>
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  {FONTS.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => setSelectedFont(font.name)}
                      className={`px-2 sm:px-3 py-1 sm:py-0.5 rounded-4xl border text-center transition-all ${
                        selectedFont === font.name
                          ? "border-blue-500 bg-blue-50"
                          : "border-chart-4 hover:border-gray-300"
                      }`}
                      style={{ fontFamily: font.name }}
                    >
                      <span className="font-medium text-[10px] sm:text-xs">
                        {font.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section Logo du forum */}
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3">
                  Logo du forum
                </h3>

                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    {logoImage ? (
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                        <Image
                          src={logoImage}
                          alt="Logo"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover rounded-xl border border-chart-4"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${colors.Posts} 0%, ${colors.Posts}dd 100%)`,
                        }}
                      >
                        <span className="text-white font-bold text-3xl sm:text-4xl">
                          ?
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => logoInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="text-gray-600 hover:text-gray-700 h-8 text-xs"
                  >
                    <Upload className="h-3 w-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    {logoImage ? "Changer" : "Ajouter"}
                  </Button>
                </div>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              {/* Section Bannière */}
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3">
                  Photo de couverture{" "}
                </h3>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Image
                      src={bannerImage}
                      alt="Bannière"
                      width={400}
                      height={100}
                      className="w-full h-20 sm:h-24 object-cover rounded-lg"
                    />
                  </div>

                  <Button
                    onClick={() => bannerInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="text-gray-600 hover:text-gray-700 h-8 text-xs flex-shrink-0"
                  >
                    <Upload className="h-3 w-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Changer
                  </Button>
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
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3">
                  Paliers
                </h3>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {isLoadingBadges ? (
                    <div className="col-span-4 text-center text-gray-500 text-sm py-4">
                      Chargement des badges...
                    </div>
                  ) : (
                    <>
                      {badges.map((badge) => (
                        <div key={badge.id} className="text-center">
                          <div className="relative mx-auto mb-1 sm:mb-1.5 drop-hover:shadow-sm w-10 h-10 sm:w-14 sm:h-14">
                            <Image
                              src={badge.imageUrl}
                              alt={badge.name}
                              width={56}
                              height={56}
                              className="rounded-full w-full h-full"
                            />
                            <span
                              className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 text-[8px] sm:text-[9px] px-0.5 sm:px-1 py-0.5 rounded bg-white shadow"
                              style={{ border: `1px solid ${colors.Bordures}` }}
                            >
                              {badge.requiredPoints || badge.requiredCount || 0}
                            </span>
                          </div>
                          <p className="font-medium text-[10px] sm:text-xs text-gray-900 line-clamp-1">
                            {badge.name}
                          </p>
                          {!badge.isDefault && (
                            <div
                              className="flex items-center justify-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedBadge(badge);
                                setIsEditBadgeModalOpen(true);
                              }}
                            >
                              <Edit2 className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                              <span className="text-[9px] sm:text-[10px] hidden xs:inline">
                                Modifier
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                  <div className=" text-left">
                    <button
                      onClick={() => setIsAddBadgeModalOpen(true)}
                      className="w-10 h-10 sm:w-14 sm:h-14 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-1 sm:mb-1.5 hover:border-gray-400 transition-colors bg-white/60"
                    >
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <p className="font-medium text-[10px] sm:text-xs text-gray-500">
                        Ajouter
                      </p>
                    </button>
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
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-0 pt-3 sm:pt-4 border-t border-gray-200 mt-3 sm:mt-4 flex-shrink-0">
            <Button
              variant="outline"
              onClick={handleReset}
              className="text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-700 transition-colors h-9 sm:h-10 text-sm order-2 sm:order-1"
            >
              <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Par défaut
            </Button>
            <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 sm:flex-none h-9 sm:h-10 text-sm"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none h-9 sm:h-10 text-sm"
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
        shopId={shopId}
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
        shopId={shopId}
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
