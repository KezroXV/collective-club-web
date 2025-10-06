"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Search, Plus } from "lucide-react";

interface CommunityEmptyStateProps {
  type: "no-posts" | "no-results";
  searchQuery?: string;
  onCreatePost?: () => void;
  onClearSearch?: () => void;
  showCreateButton?: boolean;
}

export default function CommunityEmptyState({
  type,
  searchQuery,
  onCreatePost,
  onClearSearch,
  showCreateButton = false,
}: CommunityEmptyStateProps) {
  if (type === "no-results") {
    return (
      <Card className="hover:shadow-sm border-0">
        <CardContent className="text-center py-8 sm:py-16 px-4">
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-full bg-muted/50">
              <Search className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <h3 className="text-lg sm:text-xl font-semibold">
                Aucun résultat
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md px-2">
                Aucun post pour &quot;{searchQuery}&quot;. Essayez avec
                d&apos;autres mots-clés.
              </p>
            </div>
            {onClearSearch && (
              <Button
                variant="outline"
                onClick={onClearSearch}
                className="mt-2 sm:mt-4 h-9 text-sm"
              >
                Afficher tous les posts
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-sm border-0">
      <CardContent className="text-center py-8 sm:py-16 px-4">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-full bg-muted/50">
            <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1 sm:space-y-2">
            <h3 className="text-lg sm:text-xl font-semibold">Aucun post</h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md px-2">
              Lancez la conversation ! Soyez le premier à partager quelque
              chose.
            </p>
          </div>
          {showCreateButton && onCreatePost && (
            <Button
              onClick={onCreatePost}
              className="mt-2 sm:mt-4 px-4 sm:px-6 h-9 sm:h-10 text-sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              Créer le premier post
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
