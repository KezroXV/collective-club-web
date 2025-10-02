"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Suspense } from "react"

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  
  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'Il y a un problème avec la configuration du serveur.';
      case 'AccessDenied':
        return 'Accès refusé. Vous n\'avez pas l\'autorisation d\'accéder à cette application.';
      case 'Verification':
        return 'Le token de vérification a expiré ou a déjà été utilisé.';
      case 'Default':
      default:
        return 'Une erreur inattendue s\'est produite lors de la connexion.';
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-6 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Erreur de connexion</h1>
          <p className="text-gray-600 mt-2">
            {getErrorMessage(error)}
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/auth/signin">
            <Button className="w-full">
              Réessayer
            </Button>
          </Link>
          
          <Link href="/community">
            <Button variant="outline" className="w-full">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
        
        {error && (
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Code d'erreur: {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}