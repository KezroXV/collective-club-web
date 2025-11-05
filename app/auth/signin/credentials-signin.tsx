"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";

interface CredentialsSignInProps {
  shop: string | null;
  callbackUrl: string;
  colors: any;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function CredentialsSignIn({
  shop,
  callbackUrl,
  colors,
  isLoading,
  setIsLoading,
}: CredentialsSignInProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null); // Effacer l'erreur quand l'utilisateur tape
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    if (!shop) {
      setError("Le paramètre shop est manquant");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        shop: shop,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Succès - redirection
      console.log("✅ Connexion réussie avec credentials");
      const url = new URL(callbackUrl, window.location.origin);
      if (shop) {
        url.searchParams.set("shop", shop);
      }
      window.location.href = url.pathname + url.search;
    } catch (err) {
      console.error("Erreur de connexion:", err);
      setError("Une erreur est survenue lors de la connexion");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Erreur */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </div>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="email@exemple.com"
            autoComplete="email"
          />
        </div>

        {/* Mot de passe */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Mot de passe</span>
            </div>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-12"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Bouton de connexion */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 transition-all duration-200 rounded-xl font-medium"
          style={{
            backgroundColor: colors.Posts,
            color: "white",
          }}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Connexion...</span>
            </div>
          ) : (
            "Se connecter"
          )}
        </Button>
      </form>

      {/* Lien vers inscription */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Pas encore de compte ?{" "}
          <Link
            href={`/auth/signup?shop=${shop || ""}&callbackUrl=${callbackUrl}`}
            className="font-medium hover:underline"
            style={{ color: colors.Posts }}
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
