import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Contexte d'auth pour server-side
export async function getAuthContext() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  // ✅ shopId est maintenant OBLIGATOIRE dans la session
  if (!session.user.shopId) {
    throw new Error('User has no shopId - invalid session');
  }
  
  return {
    user: session.user as AuthUser,
    shopId: session.user.shopId
  };
}

// Helper pour vérifier admin avec contexte
export async function requireAuthAdmin() {
  const { user, shopId } = await getAuthContext();
  
  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  
  return { user, shopId };
}

// Types pour TypeScript
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  shopId: string; // ✅ OBLIGATOIRE
  isShopOwner: boolean;
}

export interface AuthContext {
  user: AuthUser;
  shopId: string;
}