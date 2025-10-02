import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { getCurrentShopId } from "@/lib/shop-context";

export const authOptions: NextAuthOptions = {
  // ✅ Ne pas utiliser PrismaAdapter pour multi-tenant - gérer manuellement

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (!user.email || account?.provider !== "google") return false;

      // Récupérer le shopId OBLIGATOIRE
      const shopId = await getCurrentShopId();

      if (!shopId) {
        return false; // ❌ BLOQUER si pas de shopId
      }

      return true;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.name = token.name || session.user.name;
        session.user.image = token.picture || session.user.image;
        session.user.role = (token.role as any) || "MEMBER";
        session.user.isShopOwner = (token.isShopOwner as boolean) || false;
        session.user.shopId = (token.shopId as string)!; // ✅ OBLIGATOIRE
        session.user.roleInfo = token.roleInfo as any;
      }
      return session;
    },

    async jwt({ token, user, account }) {
      // Premier sign-in avec Google
      if (user && account?.provider === "google") {
        try {
          const shopId = await getCurrentShopId();

          if (!shopId) {
            throw new Error("No shopId available during authentication");
          }

          // Créer ou récupérer l'account pour cette boutique
          const accountRecord = await prisma.account.findFirst({
            where: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              shopId: shopId,
            },
          });

          // Vérifier si l'utilisateur existe déjà dans cette boutique
          let shopUser = await prisma.user.findFirst({
            where: {
              email: user.email!,
              shopId: shopId,
            },
          });

          if (!shopUser) {
            // Vérifier si un admin existe déjà
            const existingAdmin = await prisma.user.findFirst({
              where: {
                shopId: shopId,
                isShopOwner: true,
              },
            });

            const role = !existingAdmin ? "ADMIN" : "MEMBER";
            const isShopOwner = !existingAdmin;

            // Créer nouvel utilisateur avec shopId OBLIGATOIRE
            shopUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name!,
                image: user.image,
                shopId: shopId, // ✅ OBLIGATOIRE
                role: role,
                isShopOwner: isShopOwner,
              },
            });

            // ✅ Mettre à jour l'ownerId du shop si c'est le premier admin
            if (role === "ADMIN" && isShopOwner) {
              await prisma.shop.update({
                where: { id: shopId },
                data: { ownerId: shopUser.id },
              });
            }
          }

          // Créer l'account si il n'existe pas
          if (!accountRecord) {
            await prisma.account.create({
              data: {
                userId: shopUser.id,
                type: account.type!,
                provider: account.provider!,
                providerAccountId: account.providerAccountId!,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
                shopId: shopId,
              },
            });
          }

          // Mettre à jour le token avec les infos de cet utilisateur
          token.sub = shopUser.id;
          token.role = shopUser.role as "ADMIN" | "MODERATOR" | "MEMBER";
          token.isShopOwner = shopUser.isShopOwner;
          token.shopId = shopUser.shopId;
        } catch (error) {
          console.error("🚫 JWT Error:", error);
          throw new Error("Authentication failed");
        }
      } else if (token.sub) {
        // Connexions suivantes
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            role: true,
            isShopOwner: true,
            shopId: true,
            email: true,
            name: true,
            image: true,
            roleInfo: true,
          },
        });

        if (dbUser) {
          token.role = dbUser.role as "ADMIN" | "MODERATOR" | "MEMBER";
          token.isShopOwner = dbUser.isShopOwner;
          token.shopId = dbUser.shopId;
          token.name = dbUser.name;
          token.picture = dbUser.image;
          token.roleInfo = dbUser.roleInfo;
        } else {
          throw new Error("User not found"); // ❌ BLOQUER si utilisateur n'existe plus
        }
      }

      return token;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt", // Changer pour JWT temporairement
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  debug: false,
};

export async function verifyAdminRole(
  userId: string,
  shopId?: string
): Promise<{ isAdmin: boolean; error?: string }> {
  try {
    if (!userId) {
      return { isAdmin: false, error: "userId is required" };
    }

    let user;

    // Si shopId fourni, chercher dans la boutique spécifique
    if (shopId) {
      user = await prisma.user.findFirst({
        where: {
          id: userId,
          shopId: shopId,
        },
        select: { id: true, role: true, email: true, shopId: true },
      });
    } else {
      // Fallback: chercher par ID uniquement
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, email: true, shopId: true },
      });
    }

    if (!user) {
      return { isAdmin: false, error: "User not found" };
    }

    if (user.role !== "ADMIN") {
      return { isAdmin: false, error: "Admin privileges required" };
    }

    return { isAdmin: true };
  } catch (error) {
    return { isAdmin: false, error: "Authorization check failed" };
  }
}

export async function getShopAdmin(shopId: string) {
  let adminUser = await prisma.user.findFirst({
    where: {
      shopId: shopId,
      role: "ADMIN",
    },
    select: { id: true, role: true, email: true, shopId: true, name: true },
  });

  // Si aucun admin n'existe, créer un admin automatiquement
  if (!adminUser) {
    try {
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { shopDomain: true, shopName: true },
      });

      if (!shop) {
        throw new Error("Shop not found");
      }

      adminUser = await prisma.user.create({
        data: {
          email: `admin@${shop.shopDomain}`,
          name: `Admin ${shop.shopName}`,
          role: "ADMIN",
          shopId: shopId,
          shopDomain: shop.shopDomain,
        },
        select: { id: true, role: true, email: true, shopId: true, name: true },
      });
    } catch (error) {
      throw new Error("No admin user found and failed to create one");
    }
  }

  return adminUser;
}

export async function resolveActingAdmin(
  providedUserId: string | null | undefined,
  shopId: string
): Promise<string> {
  let actingUserId: string | null = providedUserId || null;

  if (actingUserId) {
    // Vérifier si l'utilisateur fourni existe et est admin dans cette boutique
    const user = await prisma.user.findFirst({
      where: { id: actingUserId, shopId },
      select: { id: true, role: true },
    });

    // Si l'utilisateur n'existe pas ou n'est pas admin, chercher un admin existant
    if (!user || user.role !== "ADMIN") {
      const adminUser = await prisma.user.findFirst({
        where: {
          shopId: shopId,
          role: "ADMIN",
        },
        select: { id: true },
      });

      if (!adminUser) {
        throw new Error("No admin user found in this shop");
      }

      actingUserId = adminUser.id;
    }
  } else {
    // Si aucun userId fourni, chercher un admin existant
    const adminUser = await prisma.user.findFirst({
      where: {
        shopId: shopId,
        role: "ADMIN",
      },
      select: { id: true },
    });

    if (!adminUser) {
      throw new Error("No admin user found in this shop");
    }

    actingUserId = adminUser.id;
  }

  if (!actingUserId) {
    throw new Error("No admin user found in this shop");
  }

  return actingUserId;
}

export async function requireAdmin(userId: string, shopId?: string) {
  // 🔒 SÉCURITÉ: Validation stricte - ne pas auto-créer d'admin
  // Si l'userId est invalide, rejeter immédiatement
  if (!userId || typeof userId !== "string" || userId.length < 10) {
    throw new Error("Valid userId is required");
  }

  // Si l'userId est en fait l'ID de la boutique, utiliser l'admin existant UNIQUEMENT
  if (shopId && userId === shopId) {
    const adminUser = await prisma.user.findFirst({
      where: {
        shopId: shopId,
        role: "ADMIN",
      },
      select: { id: true, role: true, email: true, shopId: true },
    });

    if (!adminUser) {
      throw new Error("No admin user found for this shop");
    }

    userId = adminUser.id;
  }

  const auth = await verifyAdminRole(userId, shopId);

  if (!auth.isAdmin) {
    throw new Error(auth.error || "Unauthorized");
  }

  return true;
}
