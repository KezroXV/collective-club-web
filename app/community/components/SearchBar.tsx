"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Clock, TrendingUp } from "lucide-react";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: "recent" | "popular";
  onSortChange: (sort: "recent" | "popular") => void;
  resultsCount: number;
  totalCount: number;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  resultsCount,
  totalCount,
}: SearchBarProps) {
  return (
    <div className="mb-4 sm:mb-8 space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm border-muted-foreground/20 focus:border-primary hover:shadow-sm"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant={sortBy === "recent" ? "default" : "outline"}
            size="sm"
            onClick={() => onSortChange("recent")}
            className="gap-1.5 flex-1 sm:flex-none h-9 text-xs sm:text-sm"
          >
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Récents</span>
            <span className="xs:hidden">Récents</span>
          </Button>
          <Button
            variant={sortBy === "popular" ? "default" : "outline"}
            size="sm"
            onClick={() => onSortChange("popular")}
            className="gap-1.5 flex-1 sm:flex-none h-9 text-xs sm:text-sm"
          >
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Populaires</span>
            <span className="xs:hidden">Populaires</span>
          </Button>
        </div>
      </div>
      {(searchQuery || totalCount > 0) && (
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
          <span className="truncate pr-2">
            {searchQuery
              ? `${resultsCount} résultat${resultsCount > 1 ? "s" : ""}`
              : `${totalCount} post${totalCount > 1 ? "s" : ""} • ${
                  sortBy === "recent" ? "Récents" : "Populaires"
                }`}
          </span>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("")}
              className="text-xs px-2 py-1 h-7 flex-shrink-0"
            >
              Effacer
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
