"use client";

import { useState, Suspense, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Menu,
  X,
  Home,
  Users,
  LayoutDashboard,
  User as UserIcon,
  LogOut,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { signOut, signIn } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrentShop } from "@/lib/useShopPersistence";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function HeaderContent() {
  const { currentUser } = useCurrentUser();
  const { canManageShop, isModerator } = usePermissions();
  const { colors: themeColors, logoImageUrl } = useTheme();
  const currentShop = useCurrentShop();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Récupérer le shop depuis les paramètres URL
  const shopParam = searchParams.get("shop");

  // Thème par défaut pour le dashboard
  const defaultColors = {
    Posts: "#3B82F6",
    Bordures: "#E5E7EB",
    Fond: "#F9FAFB",
    Police: "#111827",
  };

  // Utiliser le thème par défaut si on est sur /dashboard, sinon le thème personnalisé
  const colors = pathname === "/dashboard" ? defaultColors : themeColors;

  // Vérifier si l'utilisateur peut accéder au dashboard
  const canAccessDashboard = canManageShop() || isModerator();

  // Extraire le nom de la boutique depuis le domaine Shopify
  const getShopName = () => {
    if (!currentShop) return "Collective Club";
    // Extrait "ma-boutique" de "ma-boutique.myshopify.com"
    const shopName = currentShop.split(".")[0];
    // Capitalise la première lettre et remplace les tirets par des espaces
    return shopName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Effet de scroll pour le header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fermer le menu mobile lors du changement de route
  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  // Fonction pour gérer la connexion
  const handleSignIn = () => {
    const callbackUrl = window.location.href;
    signIn("google", { callbackUrl });
  };

  // Fonction pour obtenir les initiales
  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "?"
    );
  };

  const navigation = [
    {
      name: "Accueil",
      href: "/",
      icon: Home,
      current: pathname === "/",
    },
    {
      name: "Communauté",
      href: "/community",
      icon: Users,
      current: pathname === "/community",
    },
    ...(canAccessDashboard
      ? [
          {
            name: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            current: pathname === "/dashboard",
          },
        ]
      : []),
    ...(currentUser
      ? [
          {
            name: "Profil",
            href: "/profile",
            icon: UserIcon,
            current: pathname === "/profile",
          },
        ]
      : []),
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "shadow-md backdrop-blur-lg bg-opacity-95" : "border-b"
      }`}
      style={{
        backgroundColor: scrolled ? `${colors.Fond}f5` : colors.Fond,
        borderBottomColor: colors.Bordures,
      }}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16 sm:h-[72px]">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            {logoImageUrl ? (
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <Image
                  src={logoImageUrl}
                  alt={getShopName()}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${colors.Posts} 0%, ${colors.Posts}dd 100%)`,
                }}
              >
                <span className="text-white font-bold text-lg sm:text-xl">
                  {getShopName().charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex flex-col">
              <span
                className="font-bold text-base sm:text-lg leading-tight"
                style={{ color: colors.Police }}
              >
                {getShopName()}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-500 leading-tight">
                Communauté
              </span>
            </div>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center gap-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                      item.current ? "shadow-sm" : "hover:shadow-sm"
                    }`}
                    style={{
                      backgroundColor: item.current
                        ? `${colors.Posts}15`
                        : "transparent",
                      color: item.current ? colors.Posts : colors.Police,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Actions Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity">
                    <Avatar
                      className="h-9 w-9 border-2 cursor-pointer"
                      style={{ borderColor: colors.Posts }}
                    >
                      <AvatarImage
                        src={currentUser.image || "/pdp.svg"}
                        alt={currentUser.name || "Photo de profil"}
                      />
                      <AvatarFallback
                        className="text-white text-sm font-semibold"
                        style={{ backgroundColor: colors.Posts }}
                      >
                        {getInitials(currentUser.name || "?")}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={handleSignIn}
                className="rounded-xl px-6 py-2.5 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, ${colors.Posts} 0%, ${colors.Posts}dd 100%)`,
                  color: "white",
                }}
              >
                Se connecter
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? (
              <X className="h-6 w-6" style={{ color: colors.Police }} />
            ) : (
              <Menu className="h-6 w-6" style={{ color: colors.Police }} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div
            className="lg:hidden py-4 border-t animate-in slide-in-from-top duration-300"
            style={{ borderTopColor: colors.Bordures }}
          >
            <nav className="flex flex-col gap-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 px-4 py-3 rounded-xl ${
                        item.current ? "shadow-sm" : ""
                      }`}
                      style={{
                        backgroundColor: item.current
                          ? `${colors.Posts}15`
                          : "transparent",
                        color: item.current ? colors.Posts : colors.Police,
                      }}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Button>
                  </Link>
                );
              })}

              {/* User Section Mobile */}
              {currentUser ? (
                <div
                  className="border-t mt-2 pt-4"
                  style={{ borderTopColor: colors.Bordures }}
                >
                  <Link href="/profile">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <Avatar
                        className="h-10 w-10 border-2"
                        style={{ borderColor: colors.Posts }}
                      >
                        <AvatarImage
                          src={currentUser.image || "/pdp.svg"}
                          alt={currentUser.name || "Photo"}
                        />
                        <AvatarFallback
                          className="text-white font-semibold"
                          style={{ backgroundColor: colors.Posts }}
                        >
                          {getInitials(currentUser.name || "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p
                          className="font-semibold text-sm"
                          style={{ color: colors.Police }}
                        >
                          {currentUser.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <Button
                    onClick={() => signOut()}
                    variant="ghost"
                    className="w-full justify-start gap-3 mt-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-3 rounded-xl"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Se déconnecter</span>
                  </Button>
                </div>
              ) : (
                <div
                  className="border-t mt-2 pt-4"
                  style={{ borderTopColor: colors.Bordures }}
                >
                  <Button
                    onClick={handleSignIn}
                    className="w-full rounded-xl py-3 font-semibold shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${colors.Posts} 0%, ${colors.Posts}dd 100%)`,
                      color: "white",
                    }}
                  >
                    Se connecter
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default function Header() {
  return (
    <Suspense
      fallback={
        <header className="border-b bg-white sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex justify-between items-center h-16 sm:h-[72px]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="flex flex-col gap-1">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </header>
      }
    >
      <HeaderContent />
    </Suspense>
  );
}
