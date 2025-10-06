"use client";

import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

export default function Logo() {
  const { colors } = useTheme();

  return (
    <Link href="/" className="flex items-center gap-3 group">
      <div
        className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
        style={{
          background: `linear-gradient(135deg, ${colors.Posts} 0%, ${colors.Posts}dd 100%)`,
        }}
      >
        <span className="text-white font-bold text-lg sm:text-xl">C</span>
      </div>
      <div className="flex flex-col">
        <span
          className="font-bold text-base sm:text-lg leading-tight"
          style={{ color: colors.Police }}
        >
          Collective Club
        </span>
        <span className="text-[10px] sm:text-xs text-gray-500 leading-tight">
          Votre communauté
        </span>
      </div>
    </Link>
  );
}
