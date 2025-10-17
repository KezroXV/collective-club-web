import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Users, Home, Palette, FolderOpen } from "lucide-react";
import PopularPosts from "./PopularPosts";

interface ManagementSectionProps {
  onClientsClick: () => void;
  onPostsClick: () => void;
  onCategoriesClick: () => void;
  onThemeClick: () => void;
  shopId: string;
  refreshTrigger?: number;
}

export default function ManagementSection({
  onClientsClick,
  onPostsClick,
  onCategoriesClick,
  onThemeClick,
  shopId,
  refreshTrigger,
}: ManagementSectionProps) {
  const borderColor = "#E5E7EB";
  return (
    <div className="lg:col-span-8 space-y-4 sm:space-y-6">
      <Card className="hover:shadow-sm" style={{ borderColor }}>
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Gérer
          </h3>
          <nav className="space-y-2 sm:space-y-1">
            <Button
              variant="ghost"
              onClick={onClientsClick}
              className="w-full text-sm sm:text-md justify-start h-12 sm:h-16 py-3 sm:py-5 text-gray-600 bg-chart-6 mb-2 sm:mb-4 border"
              style={{ borderColor }}
              icon={<Users className="h-4 w-4" />}
            >
              Clients
            </Button>
            <Button
              variant="ghost"
              onClick={onPostsClick}
              className="w-full text-sm sm:text-md justify-start h-12 sm:h-16 py-3 sm:py-5 text-gray-600 bg-chart-6 mb-2 sm:mb-4 border"
              style={{ borderColor }}
              icon={<FileText className="h-4 w-4" />}
            >
              Posts
            </Button>

            <Button
              variant="ghost"
              onClick={onThemeClick}
              className="w-full text-sm sm:text-md justify-start h-12 sm:h-16 py-3 sm:py-5 text-gray-600 bg-chart-6 border"
              style={{ borderColor }}
              icon={<Palette className="h-4 w-4" />}
            >
              Thème
            </Button>
          </nav>
        </CardContent>
      </Card>

      <PopularPosts
        shopId={shopId}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
