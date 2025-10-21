"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import { useEffect, useState } from "react"

interface Props {
  children: React.ReactNode
  session?: Session | null
}

export function AuthSessionProvider({ children, session }: Props) {
  const [refetchInterval, setRefetchInterval] = useState(0);

  useEffect(() => {
    // 🔄 Si une auth Shopify vient d'avoir lieu, forcer le refresh de session
    const lastAuthAttempt = sessionStorage.getItem('shopify_auth_attempt');
    if (lastAuthAttempt) {
      const timeSinceAuth = Date.now() - parseInt(lastAuthAttempt);

      // Pendant les 3 premières secondes après auth, refresh toutes les 500ms
      if (timeSinceAuth < 3000) {
        setRefetchInterval(500);

        // Après 3 secondes, arrêter le refresh rapide
        const timeout = setTimeout(() => {
          setRefetchInterval(0);
          sessionStorage.removeItem('shopify_auth_attempt');
        }, 3000);

        return () => clearTimeout(timeout);
      }
    }
  }, []);

  return (
    <SessionProvider
      session={session}
      refetchInterval={refetchInterval}
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  )
}