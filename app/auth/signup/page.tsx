"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeWrapper from "@/components/ThemeWrapper";
import { Users, Crown, Sparkles, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";

function SignUpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shop = searchParams.get("shop");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const { colors, bannerImageUrl } = useTheme();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Effacer l'erreur du champ quand l'utilisateur commence à taper
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name || formData.name.length < 2) {
      errors.name = "Le nom doit contenir au moins 2 caractères";
    }

    if (!formData.email) {
      errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email invalide";
    }

    if (!formData.password) {
      errors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 8) {
      errors.password = "Le mot de passe doit contenir au moins 8 caractères";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password =
        "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    if (!shop) {
      errors.general = "Le paramètre shop est manquant";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 1. Inscription via API
      const signupResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          shop: shop,
        }),
      });

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        if (signupData.details) {
          // Erreurs de validation Zod
          const errors: Record<string, string> = {};
          signupData.details.forEach((detail: any) => {
            errors[detail.field] = detail.message;
          });
          setFieldErrors(errors);
        } else {
          setError(signupData.error || "Erreur lors de l'inscription");
        }
        setIsLoading(false);
        return;
      }

      console.log("✅ Inscription réussie, connexion automatique...");

      // 2. Connexion automatique avec NextAuth
      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        shop: shop,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Inscription réussie mais échec de connexion automatique");
        setIsLoading(false);
        return;
      }

      // 3. Redirection
      console.log("✅ Connexion réussie, redirection...");
      const url = new URL(callbackUrl, window.location.origin);
      if (shop) {
        url.searchParams.set("shop", shop);
      }
      window.location.href = url.pathname + url.search;
    } catch (err) {
      console.error("Erreur:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <ThemeWrapper applyBackgroundColor={true} className="min-h-screen">
      <div
        className="min-h-screen relative"
        style={{
          background: `linear-gradient(135deg, ${colors.Fond} 0%, ${colors.Posts}08 100%)`,
        }}
      >
        {/* Pattern décoratif */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute top-0 left-0 w-72 h-72 rounded-full"
            style={{
              background: `radial-gradient(circle, ${colors.Posts}40 0%, transparent 70%)`,
            }}
          ></div>
          <div
            className="absolute bottom-0 right-0 w-96 h-96 rounded-full"
            style={{
              background: `radial-gradient(circle, ${colors.Posts}30 0%, transparent 70%)`,
            }}
          ></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 py-8">
          <div className="max-w-md mx-auto">
            {/* Logo et titre */}
            <div className="text-center mb-8">
              <div className="mb-6">
                <div
                  className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                  style={{ backgroundColor: colors.Posts }}
                >
                  <span className="text-white font-bold text-2xl">C</span>
                </div>
                <h1
                  className="text-2xl font-bold mb-2"
                  style={{ color: colors.Police }}
                >
                  Créer un compte
                </h1>
                {shop && (
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: colors.Posts }}
                    ></div>
                    <span className="text-sm text-gray-600">{shop}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-8">
                <h2
                  className="text-xl font-semibold"
                  style={{ color: colors.Police }}
                >
                  Rejoignez la communauté
                </h2>
                <p className="text-gray-600 text-sm">
                  Créez votre compte pour accéder à l&apos;espace communautaire
                </p>
              </div>
            </div>

            {/* Card d'inscription */}
            <div
              className="bg-white rounded-2xl shadow-xl border overflow-hidden"
              style={{ borderColor: colors.Bordures }}
            >
              {/* Image de bannière miniature */}
              {bannerImageUrl && (
                <div className="h-24 bg-gradient-to-r from-gray-100 to-gray-200 relative overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${bannerImageUrl})` }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
                </div>
              )}

              <div className="p-8">
                {/* Erreur générale */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Nom */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Nom complet</span>
                      </div>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.name
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-200 focus:ring-blue-500"
                      }`}
                      placeholder="Jean Dupont"
                    />
                    {fieldErrors.name && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
                    )}
                  </div>

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
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.email
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-200 focus:ring-blue-500"
                      }`}
                      placeholder="email@exemple.com"
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                    )}
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
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all pr-12 ${
                          fieldErrors.password
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-200 focus:ring-blue-500"
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.password}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
                    </p>
                  </div>

                  {/* Confirmer mot de passe */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <span>Confirmer le mot de passe</span>
                      </div>
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={isLoading}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all pr-12 ${
                          fieldErrors.confirmPassword
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-200 focus:ring-blue-500"
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Bouton d'inscription */}
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
                        <div
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                        ></div>
                        <span>Création du compte...</span>
                      </div>
                    ) : (
                      "Créer mon compte"
                    )}
                  </Button>
                </form>

                {/* Lien vers connexion */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-center text-sm text-gray-600">
                    Vous avez déjà un compte ?{" "}
                    <Link
                      href={`/auth/signin?shop=${shop || ""}&callbackUrl=${callbackUrl}`}
                      className="font-medium hover:underline"
                      style={{ color: colors.Posts }}
                    >
                      Se connecter
                    </Link>
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Sparkles className="h-3 w-3" />
                    <span>Sécurisé et crypté</span>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    En créant un compte, vous acceptez nos conditions
                    d&apos;utilisation
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div
                  className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${colors.Posts}20` }}
                >
                  <Users className="h-4 w-4" style={{ color: colors.Posts }} />
                </div>
                <p className="text-xs text-gray-600">Communauté</p>
              </div>
              <div className="space-y-2">
                <div
                  className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${colors.Posts}20` }}
                >
                  <Crown className="h-4 w-4" style={{ color: colors.Posts }} />
                </div>
                <p className="text-xs text-gray-600">Gestion</p>
              </div>
              <div className="space-y-2">
                <div
                  className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${colors.Posts}20` }}
                >
                  <Sparkles className="h-4 w-4" style={{ color: colors.Posts }} />
                </div>
                <p className="text-xs text-gray-600">Engagement</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeWrapper>
  );
}

export default function SignUp() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
