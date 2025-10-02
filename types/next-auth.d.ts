import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "ADMIN" | "MODERATOR" | "MEMBER"
      isShopOwner: boolean
      shopId: string // ✅ OBLIGATOIRE
      roleInfo?: any
    } & DefaultSession["user"]
  }

  interface User {
    role: "ADMIN" | "MODERATOR" | "MEMBER"
    isShopOwner: boolean
    shopId: string // ✅ OBLIGATOIRE
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "ADMIN" | "MODERATOR" | "MEMBER"
    isShopOwner: boolean
    shopId: string // ✅ OBLIGATOIRE
    roleInfo?: any
  }
}