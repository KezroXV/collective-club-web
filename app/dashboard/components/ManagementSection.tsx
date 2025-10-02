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
  borderColor?: string;
}

export default function ManagementSection({
  onClientsClick,
  onPostsClick,
  onCategoriesClick,
  onThemeClick,
  shopId,
  refreshTrigger,
  borderColor = "#E5E7EB",
}: ManagementSectionProps) {
  return (
    <div className="col-span-8 space-y-6">
      <Card className="hover:shadow-sm" style={{ borderColor }}>
        <CardContent className="">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gérer</h3>
          <nav className="space-y-1">
            <Button
              variant="ghost"
              onClick={onClientsClick}
              className="w-full text-md justify-start h-16 py-5 text-gray-600 bg-chart-6 mb-4 border"
              style={{ borderColor }}
              icon={<Users className="h-4 w-4" />}
            >
              Clients
            </Button>
            <Button
              variant="ghost"
              onClick={onPostsClick}
              className="w-full text-md justify-start h-16 py-5 text-gray-600 bg-chart-6 mb-4 border"
              style={{ borderColor }}
              icon={<FileText className="h-4 w-4" />}
            >
              Posts
            </Button>
            <Button
              variant="ghost"
              onClick={onCategoriesClick}
              className="w-full text-md justify-start h-16 py-5 text-gray-600 bg-chart-6 mb-4 border"
              style={{ borderColor }}
              icon={<FolderOpen className="h-4 w-4" />}
            >
              Catégories
            </Button>
            <Button
              variant="ghost"
              onClick={onThemeClick}
              className="w-full text-md justify-start h-16 py-5 text-gray-600 bg-chart-6 border"
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
        borderColor={borderColor}
      />
    </div>
  );
}
