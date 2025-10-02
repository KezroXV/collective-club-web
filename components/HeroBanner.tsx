"use client";

import { useTheme } from "@/contexts/ThemeContext";
import Image from "next/image";

export default function HeroBanner() {
  const { bannerImageUrl } = useTheme();

  return (
    <div className="container mx-auto px-4 sm:px-6">
      <div className="relative h-40 sm:h-48 md:h-56 overflow-hidden rounded-b-[16px] sm:rounded-b-[22px] border border-chart-4 hover:shadow-sm">
        {/* Image de bannière */}
        <div className="absolute inset-0">
          <Image
            src={bannerImageUrl}
            alt="Bannière du forum"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Overlay gradient pour la lisibilité du texte */}
        <div className="absolute inset-0 rounded-[16px] sm:rounded-[22px] bg-gradient-to-r from-black/40 via-black/20 to-black/40 pointer-events-none"></div>
      </div>
    </div>
  );
}
