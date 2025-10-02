"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function ClearSessionPage() {
  const { data: session } = useSession();

  const clearEverything = async () => {
    // 1. Effacer la session NextAuth
    await signOut({ redirect: false });

    // 2. Effacer tous les cookies manuellement
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost`;
      document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });

    // 3. Effacer localStorage
    localStorage.clear();
    sessionStorage.clear();

    // 4. Recharger la page
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Effacer Session</h1>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Session Actuelle</h2>
        <pre className="text-sm p-2 bg-gray-100 rounded text-xs overflow-auto max-h-96">
          {JSON.stringify(session, null, 2) || 'Aucune session'}
        </pre>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Problème de Session</h3>
        <p className="text-yellow-700 text-sm">
          Si tu ne vois pas <code>roleInfo</code> dans ta session ci-dessus,
          c'est que NextAuth utilise une ancienne session en cache.
        </p>
      </div>

      <div className="space-y-4">
        <Button
          onClick={clearEverything}
          variant="destructive"
          className="w-full"
        >
          🧹 Effacer Tout (Session + Cookies + Cache)
        </Button>

        <p className="text-sm text-gray-600">
          Après avoir cliqué, tu seras déconnecté et la page va se recharger.
          Ensuite reconnecte-toi avec Google pour avoir une session fraîche.
        </p>
      </div>
    </div>
  );
}