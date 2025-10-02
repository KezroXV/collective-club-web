"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Users,
  FileText,
  Palette,
  Settings,
  Home,
  MessageSquare,
} from "lucide-react";

const navigation = [
  {
    name: "Vue d'ensemble",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    name: "Gestion Posts",
    href: "/dashboard/posts",
    icon: FileText,
  },
  {
    name: "Membres",
    href: "/dashboard/members",
    icon: Users,
  },
  {
    name: "Personnalisation",
    href: "/dashboard/customization",
    icon: Palette,
  },
  {
    name: "Paramètres",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
      <div className="flex flex-col h-full pt-20">
        {" "}
        {/* pt-20 pour laisser place au header */}
        {/* Métriques rapides */}
        <div className="px-6 py-4 border-b border-chart-4">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600">37</span>
                <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                  ↓ 28%
                </span>
              </div>
              <p className="text-sm text-gray-500">Posts</p>
            </div>
          </div>
        </div>
        {/* Section Gérer */}
        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Gérer</h3>
          <nav className="space-y-1">
            <Link
              href="/dashboard/clients"
              className="flex items-center px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <Users className="h-4 w-4 mr-3" />
              Clients
            </Link>
            <Link
              href="/dashboard/posts"
              className="flex items-center px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <FileText className="h-4 w-4 mr-3" />
              Posts
            </Link>
            <Link
              href="/dashboard/customization"
              className="flex items-center px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <Palette className="h-4 w-4 mr-3" />
              Thème
            </Link>
          </nav>
        </div>
        {/* Section Communautés */}
        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Communautés phares
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>Un espace pour les ecommerçants dans la cosmétique</p>
            <p>
              Débutants : Envoyez tous vos conseils ici sur comment gérer sa
              boutique
            </p>
            <p>Quels sont vos objectifs ?</p>
          </div>
        </div>
        {/* Retour au forum */}
        <div className="mt-auto px-6 py-4 border-t border-chart-4">
          <Link
            href="/community"
            className="flex items-center px-3 py-2 text-sm text-blue-600 rounded-lg hover:bg-blue-50"
          >
            <Home className="h-4 w-4 mr-3" />
            Retour au forum
          </Link>
        </div>
      </div>
    </div>
  );
}
