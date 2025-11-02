"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAutoRefresh } from "@/lib/hooks/useAutoRefresh";
import {
  Filter,
  Search,
  Plus,
  ChevronDown,
  Share2,
  Wrench,
  Clock,
  Calendar,
  Heart,
  Check,
  Pin,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";

const SORT_OPTIONS = [
  {
    value: "newest",
    label: "Nouveau",
    icon: Clock,
  },
  {
    value: "oldest",
    label: "Plus ancien",
    icon: Calendar,
  },
  {
    value: "popular",
    label: "Plus likés",
    icon: Heart,
  },
];

interface Category {
  id: string;
  name: string;
  color: string;
  _count: {
    posts: number;
  };
}

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onSearch: (query: string) => void;
  onCreatePost: () => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  showPinnedOnly?: boolean;
  onPinnedFilterChange?: (showPinnedOnly: boolean) => void;
  pinnedCount?: number;
}

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  onSearch,
  onCreatePost,
  sortBy = "newest",
  onSortChange,
  showPinnedOnly = false,
  onPinnedFilterChange,
  pinnedCount = 0,
}: CategoryFilterProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const MAX_VISIBLE = 3; // Réduire pour tester le "Voir plus"

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Auto-refresh toutes les 10 secondes
  useAutoRefresh(fetchCategories, { enabled: true, interval: 10000 });

  // Écouter l'événement de création de catégorie pour rafraîchir immédiatement
  useEffect(() => {
    const handleCategoryCreated = () => {
      fetchCategories();
    };

    window.addEventListener("categoryCreated", handleCategoryCreated);
    return () =>
      window.removeEventListener("categoryCreated", handleCategoryCreated);
  }, []);

  // Ajouter "Tout" en premier
  const allCategories = [
    {
      id: "all",
      name: "Tout",
      color: "bg-gray-400",
      _count: { posts: 0 },
    },
    ...categories,
  ];

  const visibleCategories = allCategories.slice(0, MAX_VISIBLE + 1);
  const overflowCategories = allCategories.slice(MAX_VISIBLE + 1);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const currentSortLabel =
    SORT_OPTIONS.find((option) => option.value === sortBy)?.label || "Nouveau";

  if (loading) {
    return (
      <div className="bg-transparent">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-6 py-6">
            <div className="h-12 w-32 bg-gray-200 rounded-2xl animate-pulse"></div>
            <div className="h-14 flex-1 max-w-2xl bg-gray-200 rounded-2xl animate-pulse"></div>
            <div className="h-12 w-40 bg-gray-200 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent">
      <div className="container mx-auto px-6">
        {/* Top Row: Filter + Search + Create Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 pb-4 sm:pb-6">
          {/* Bouton Filtrer avec dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-3 text-base px-6 py-3 h-auto rounded-2xl bg-white hover:bg-gray-50 transition-all font-medium"
                style={{ borderColor: colors.Bordures }}
              >
                <Filter className="h-4 w-4" />
                Filtrer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Trier par
              </DropdownMenuLabel>
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() =>
                    option.value !== undefined && onSortChange?.(option.value)
                  }
                  className="flex items-center gap-3 py-2"
                >
                  {option.icon && (
                    <option.icon className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="flex-1">{option.label}</span>
                  {sortBy === option.value && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}

              {overflowCategories.length > 0 && <></>}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative flex-1 w-full sm:max-w-2xl">
            <Search className="absolute left-3 sm:left-5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 sm:h-5 w-4 sm:w-5" />
            <Input
              placeholder="Rechercher par nom ou par post..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 sm:pl-14 h-12 sm:h-14 border focus:border-primary focus:ring-primary rounded-xl sm:rounded-2xl text-sm sm:text-base bg-white"
              style={{ borderColor: colors.Bordures }}
            />
          </div>

          <Button
            onClick={onCreatePost}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 h-auto rounded-xl sm:rounded-2xl hover:shadow-sm font-medium text-sm sm:text-base"
          >
            Créer un post
            <div className="bg-white rounded-full p-1">
              <Plus className="h-4 w-4 text-black" />
            </div>
          </Button>
        </div>

        {/* Categories Row */}
        <div className="flex items-center gap-2 sm:gap-3 pb-4 flex-wrap sm:flex-nowrap">
          {visibleCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex items-center gap-2.5 px-2.5 py-1 rounded-lg whitespace-nowrap transition-all text-xs font-medium border ${
                selectedCategory === category.id
                  ? "bg-white text-gray-900 ring-2 ring-blue-300"
                  : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
              style={{ borderColor: colors.Bordures }}
            >
              <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
              <span>{category.name}</span>
              {category._count.posts > 0 && category.id !== "all" && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {category._count.posts}
                </span>
              )}
            </button>
          ))}

          {/* Dropdown "Voir plus" pour les catégories supplémentaires */}
          {overflowCategories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2.5 px-2.5 py-1 rounded-lg whitespace-nowrap transition-all text-xs font-medium border bg-white text-gray-900 hover:bg-gray-50"
                  style={{ borderColor: colors.Bordures }}
                >
                  <span>Voir plus</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Autres catégories
                </DropdownMenuLabel>
                {overflowCategories.map((category) => (
                  <DropdownMenuItem
                    key={category.id}
                    onClick={() => onCategoryChange(category.id)}
                    className="flex items-center gap-3 py-2"
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${category.color}`}
                    ></div>
                    <span className="flex-1">{category.name}</span>
                    <span className="text-xs text-gray-400">
                      {category._count.posts}
                    </span>
                    {selectedCategory === category.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Bouton de filtre pour les posts épinglés */}
          {onPinnedFilterChange && (
            <button
              onClick={() => onPinnedFilterChange?.(!showPinnedOnly)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all text-xs font-medium border ${
                showPinnedOnly
                  ? "bg-blue-50 text-blue-700"
                  : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
              style={{
                borderColor: showPinnedOnly ? colors.Posts : colors.Bordures,
              }}
            >
              <Pin
                className={`h-3 w-3 ${
                  showPinnedOnly ? "text-blue-600" : "text-gray-500"
                }`}
              />
              <span>Épinglés</span>
              {pinnedCount > 0 && (
                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {pinnedCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
