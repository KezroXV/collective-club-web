"use client";

import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  hasFilters: boolean;
  currentUser?: any;
}

export default function EmptyState({ hasFilters, currentUser }: EmptyStateProps) {
  return (
    <div className="text-center py-24">
      <div className="text-gray-400 mb-8">
        <MessageSquare className="h-24 w-24 mx-auto" />
      </div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">
        {hasFilters ? "Aucun post trouvé" : "Aucun post pour l'instant"}
      </h3>
      <p className="text-gray-600 mb-10 text-lg leading-relaxed max-w-md mx-auto">
        {hasFilters
          ? "Essayez de modifier vos filtres de recherche"
          : "Soyez le premier à partager quelque chose !"}
      </p>
      {currentUser && (
        <Link href="/community">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg rounded-lg hover:shadow-sm">
            Créer le premier post
          </Button>
        </Link>
      )}
    </div>
  );
}