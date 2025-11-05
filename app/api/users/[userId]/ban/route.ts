import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";
import { getAuthContext } from "@/lib/auth-context";

const prisma = new PrismaClient();

// POST /api/users/[userId]/ban - Bannir un utilisateur
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    console.log('BAN API POST: Starting request');

    // ✅ SÉCURITÉ: Authentification OBLIGATOIRE via session NextAuth
    const { user: currentUser, shopId } = await getAuthContext();
    ensureShopIsolation(shopId);
    console.log('BAN API POST: Authenticated user', { userId: currentUser.id, role: currentUser.role, shopId });

    const { userId: targetUserId } = await params;

    console.log('BAN API POST: Request data', { targetUserId, currentUserId: currentUser.id, userRole: currentUser.role });

    // ✅ SÉCURITÉ: Vérifier les permissions depuis la session
    if (!['ADMIN', 'MODERATOR'].includes(currentUser.role)) {
      console.log('BAN API POST: Permission denied', { userRole: currentUser.role });
      return NextResponse.json(
        { error: "Seuls les administrateurs et modérateurs peuvent bannir des utilisateurs" },
        { status: 403 }
      );
    }

    console.log('BAN API POST: Permissions OK');

    // Vérifier que l'utilisateur cible existe et appartient à la bonne boutique
    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        shopId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBanned: true,
        // ⚠️ NE JAMAIS inclure password dans les select !
      }
    });

    console.log('BAN API POST: Target user query result', { found: !!targetUser, targetUserId, shopId });

    if (!targetUser) {
      console.log('BAN API POST: Target user not found');
      return NextResponse.json(
        { error: "Utilisateur non trouvé dans cette boutique" },
        { status: 404 }
      );
    }

    // Empêcher de bannir un administrateur
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json(
        { error: "Impossible de bannir un administrateur" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur n'est pas déjà banni
    if (targetUser.isBanned) {
      console.log('BAN API POST: User already banned');
      return NextResponse.json(
        { error: "L'utilisateur est déjà banni" },
        { status: 400 }
      );
    }

    console.log('BAN API POST: User found', { isBanned: targetUser.isBanned });

    // ✅ SÉCURITÉ: Bannir l'utilisateur avec l'ID de l'utilisateur authentifié
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        bannedBy: currentUser.id
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBanned: true,
        bannedAt: true,
        // ⚠️ NE JAMAIS inclure password dans les select !
      }
    });

    return NextResponse.json({
      success: true,
      message: "Utilisateur banni avec succès",
      user: updatedUser
    });

  } catch (error) {
    console.error("Error banning user:", error);

    // ✅ SÉCURITÉ: Gestion d'erreur d'authentification
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to ban user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[userId]/ban - Débannir un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // ✅ SÉCURITÉ: Authentification OBLIGATOIRE via session NextAuth
    const { user: currentUser, shopId } = await getAuthContext();
    ensureShopIsolation(shopId);

    const { userId: targetUserId } = await params;

    // ✅ SÉCURITÉ: Vérifier les permissions depuis la session
    if (!['ADMIN', 'MODERATOR'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Seuls les administrateurs et modérateurs peuvent débannir des utilisateurs" },
        { status: 403 }
      );
    }

    // Vérifier que l'utilisateur cible existe et appartient à la bonne boutique
    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        shopId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBanned: true,
        // ⚠️ NE JAMAIS inclure password dans les select !
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé dans cette boutique" },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur est banni
    if (!targetUser.isBanned) {
      return NextResponse.json(
        { error: "L'utilisateur n'est pas banni" },
        { status: 400 }
      );
    }

    // Débannir l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        isBanned: false,
        bannedAt: null,
        bannedBy: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBanned: true,
        // ⚠️ NE JAMAIS inclure password dans les select !
      }
    });

    return NextResponse.json({
      success: true,
      message: "Utilisateur débanni avec succès",
      user: updatedUser
    });

  } catch (error) {
    console.error("Error unbanning user:", error);

    // ✅ SÉCURITÉ: Gestion d'erreur d'authentification
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to unban user" },
      { status: 500 }
    );
  }
}