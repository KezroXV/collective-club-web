"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "Proprió." | "admin" | "Modérateur";
}

export default function RolesSection() {
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "Renata Alink",
      email: "hello@gmail.com",
      role: "Proprió.",
      avatar: "",
    },
    {
      id: "2",
      name: "Roger Gomez",
      email: "hello@gmail.com",
      role: "admin",
      avatar: "",
    },
    {
      id: "3",
      name: "Sara dupont",
      email: "hello@gmail.com",
      role: "Modérateur",
      avatar: "",
    },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Proprió.":
        return "bg-red-100 text-red-800";
      case "admin":
        return "bg-orange-100 text-orange-800";
      case "Modérateur":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "?"
    );
  };

  const handleRoleChange = (userId: string, newRole: User["role"]) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
    toast.success("Rôle mis à jour avec succès");
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="border-chart-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Rôles</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>

        {/* Liste des utilisateurs */}
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`text-xs ${getRoleBadgeColor(user.role)}`}
                >
                  {user.role}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, "admin")}
                    >
                      Définir comme Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, "Modérateur")}
                    >
                      Définir comme Modérateur
                    </DropdownMenuItem>
                    {user.role !== "Proprió." && (
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(user.id, "Modérateur")}
                        className="text-red-600"
                      >
                        Retirer les permissions
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>

        {/* Bouton Ajouter */}
        <Button
          variant="outline"
          size="sm"
          className="w-full border-dashed"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </CardContent>
    </Card>
  );
}
