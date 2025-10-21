"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShopPersistence } from "@/lib/useShopPersistence";

/**
 * Bouton flottant en bas à droite pour accéder au forum
 * Ajoute automatiquement le paramètre ?shop= pour naviguer vers le bon forum
 */
export default function ForumFloatingButton() {
  const { currentShop, navigateWithShop } = useShopPersistence();
  const searchParams = useSearchParams();
  const [isHovered, setIsHovered] = useState(false);

  // Récupérer le shop depuis URL ou localStorage
  const shop = searchParams.get("shop") || currentShop;

  const handleNavigateToForum = () => {
    // Utiliser la fonction navigateWithShop pour ajouter automatiquement le shop
    navigateWithShop("/");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Tooltip qui apparaît au survol */}
      {isHovered && (
        <div className="absolute bottom-full right-0 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-xl whitespace-nowrap">
            <div className="font-medium">Accéder au forum</div>
            {shop && (
              <div className="text-xs text-gray-300 mt-1 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                {shop}
              </div>
            )}
          </div>
          {/* Flèche du tooltip */}
          <div className="absolute top-full right-4 -mt-1">
            <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>
      )}

      {/* Bouton principal */}
      <Button
        onClick={handleNavigateToForum}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        size="lg"
        className="h-16 w-16 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white group relative overflow-hidden"
        title={`Accéder au forum${shop ? ` (${shop})` : ""}`}
      >
        {/* Animation de fond au survol */}
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>

        {/* Icône avec animation */}
        <div className="relative flex items-center justify-center">
          <MessageSquare className="h-7 w-7 group-hover:scale-110 transition-transform duration-300" />
          <ArrowRight className="h-4 w-4 absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
        </div>

        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover:opacity-20 group-hover:animate-ping"></span>
      </Button>
    </div>
  );
}
