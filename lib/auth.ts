import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { getCurrentShopId, createDefaultRolesForShop } from "@/lib/shop-context";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  // ✅ Ne pas utiliser PrismaAdapter pour multi-tenant - gérer manuellement

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Email et Mot de passe",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        shop: { label: "Shop", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.shop) {
          throw new Error("Email, mot de passe et shop requis");
        }

        try {
          // Récupérer le shop
          const shop = await prisma.shop.findUnique({
            where: { shopDomain: credentials.shop },
            select: { id: true },
          });

          if (!shop) {
            throw new Error("Shop non trouvé");
          }

          // Rechercher l'utilisateur par email ET shopId
          const user = await prisma.user.findFirst({
            where: {
              email: credentials.email,
              shopId: shop.id,
            },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              password: true,
              role: true,
              isShopOwner: true,
              shopId: true,
              isBanned: true,
              roleInfo: true,
            },
          });

          if (!user) {
            throw new Error("Email ou mot de passe incorrect");
          }

          // Vérifier si l'utilisateur est banni
          if (user.isBanned) {
            throw new Error("Votre compte a été suspendu");
          }

          // Vérifier si l'utilisateur a un mot de passe (peut être un compte OAuth)
          if (!user.password) {
            throw new Error("Ce compte utilise une autre méthode de connexion");
          }

          // 🔐 Vérifier le mot de passe avec bcrypt
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Email ou mot de passe incorrect");
          }

          // ✅ Authentification réussie
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role as "ADMIN" | "MODERATOR" | "MEMBER",
            isShopOwner: user.isShopOwner,
            shopId: user.shopId,
            roleInfo: user.roleInfo,
          };
        } catch (error) {
          console.error("Erreur d'authentification credentials:", error);
          throw error;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // ✅ Si credentials provider, l'authentification a déjà été validée dans authorize()
      if (account?.provider === "credentials") {
        return true;
      }

      // Pour Google OAuth, vérifier le shopId
      if (account?.provider === "google") {
        const shopId = await getCurrentShopId();
        if (!shopId) {
          return false; // ❌ BLOQUER si pas de shopId
        }
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
      // ✅ Premier sign-in avec Credentials
      if (user && account?.provider === "credentials") {
        // Les données sont déjà complètes depuis authorize()
        token.sub = user.id;
        token.email = user.email;
        token.role = (user as any).role as "ADMIN" | "MODERATOR" | "MEMBER";
        token.isShopOwner = (user as any).isShopOwner;
        token.shopId = (user as any).shopId;
        token.name = user.name;
        token.picture = user.image;
        token.roleInfo = (user as any).roleInfo;
        return token;
      }

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
            // ✅ SÉCURITÉ : Vérifier que les rôles existent pour ce shop
            const rolesCount = await prisma.role.count({
              where: { shopId: shopId }
            });

            if (rolesCount === 0) {
              // Créer les rôles si manquants (fallback de sécurité)
              console.log(`⚠️ Rôles manquants pour shopId ${shopId}, création automatique...`);
              await createDefaultRolesForShop(shopId);
            }

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
          token.email = shopUser.email;
          token.role = shopUser.role as "ADMIN" | "MODERATOR" | "MEMBER";
          token.isShopOwner = shopUser.isShopOwner;
          token.shopId = shopUser.shopId;
        } catch (error) {
          console.error("🚫 JWT Error:", error);
          throw new Error("Authentication failed");
        }
      } else if (token.sub && token.email) {
        // Connexions suivantes - récupérer le shopId actuel
        const currentShopId = await getCurrentShopId();

        if (!currentShopId) {
          throw new Error("No shopId available");
        }

        // Récupérer l'utilisateur pour CE shop spécifique
        const dbUser = await prisma.user.findFirst({
          where: {
            email: token.email as string,
            shopId: currentShopId,
          },
          select: {
            id: true,
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
          // Mettre à jour le token avec les infos de l'utilisateur pour CE shop
          token.sub = dbUser.id;
          token.role = dbUser.role as "ADMIN" | "MODERATOR" | "MEMBER";
          token.isShopOwner = dbUser.isShopOwner;
          token.shopId = dbUser.shopId;
          token.name = dbUser.name;
          token.picture = dbUser.image;
          token.roleInfo = dbUser.roleInfo;
        } else {
          // L'utilisateur n'existe pas dans ce shop - créer un nouveau compte MEMBER
          const rolesCount = await prisma.role.count({
            where: { shopId: currentShopId }
          });

          if (rolesCount === 0) {
            await createDefaultRolesForShop(currentShopId);
          }

          const existingAdmin = await prisma.user.findFirst({
            where: {
              shopId: currentShopId,
              isShopOwner: true,
            },
          });

          const role = !existingAdmin ? "ADMIN" : "MEMBER";
          const isShopOwner = !existingAdmin;

          const newShopUser = await prisma.user.create({
            data: {
              email: token.email as string,
              name: token.name as string,
              image: token.picture as string,
              shopId: currentShopId,
              role: role,
              isShopOwner: isShopOwner,
            },
          });

          if (role === "ADMIN" && isShopOwner) {
            await prisma.shop.update({
              where: { id: currentShopId },
              data: { ownerId: newShopUser.id },
            });
          }

          token.sub = newShopUser.id;
          token.role = newShopUser.role as "ADMIN" | "MODERATOR" | "MEMBER";
          token.isShopOwner = newShopUser.isShopOwner;
          token.shopId = newShopUser.shopId;
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
