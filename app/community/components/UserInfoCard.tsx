"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface UserInfoCardProps {
  user: {
    name: string;
    email: string;
    image?: string;
  };
}

export default function UserInfoCard({ user }: UserInfoCardProps) {
  const { colors } = useTheme();

  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "?"
    );
  };

  return (
    <Card
      className="mb-4 sm:mb-6 hover:shadow-sm border-0"
      style={{ backgroundColor: `${colors.Posts}08` }}
    >
      <CardContent className="pt-4 sm:pt-6 pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Avatar
              className="h-9 w-9 sm:h-10 sm:w-10 border-2 flex-shrink-0"
              style={{ borderColor: colors.Posts }}
            >
              <AvatarImage src={user.image} />
              <AvatarFallback
                className="text-white font-semibold text-xs sm:text-sm"
                style={{ backgroundColor: colors.Posts }}
              >
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p
                className="font-semibold text-sm sm:text-base truncate"
                style={{ color: colors.Police }}
              >
                <span className="hidden sm:inline">Connecté en tant que </span>
                {user.name}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="text-xs self-start sm:self-auto flex-shrink-0"
          >
            <User className="h-3 w-3 mr-1" />
            Membre actif
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
