import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";

const prisma = new PrismaClient();

// POST /api/users/[userId]/ban - Bannir un utilisateur
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    console.log('BAN API POST: Starting request');
    
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);
    console.log('BAN API POST: ShopId obtained', { shopId });

    const { userId: targetUserId } = await params;
    const body = await request.json();
    const { userId: currentUserId, userRole } = body;
    
    console.log('BAN API POST: Request data', { targetUserId, currentUserId, userRole });

    if (!currentUserId || !userRole) {
      return NextResponse.json(
        { error: "User ID and role are required" },
        { status: 400 }
      );
    }

    // Vérifier les permissions - seulement Admin et Modérateur peuvent bannir
    if (!['ADMIN', 'MODERATOR'].includes(userRole)) {
      console.log('BAN API POST: Permission denied', { userRole });
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

    // Bannir l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { 
        isBanned: true,
        bannedAt: new Date(),
        bannedBy: currentUserId
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Utilisateur banni avec succès",
      user: updatedUser
    });

  } catch (error) {
    console.error("Error banning user:", error);
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
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { userId: targetUserId } = await params;
    const body = await request.json();
    const { userId: currentUserId, userRole } = body;

    if (!currentUserId || !userRole) {
      return NextResponse.json(
        { error: "User ID and role are required" },
        { status: 400 }
      );
    }

    // Vérifier les permissions - seulement Admin et Modérateur peuvent débannir
    if (!['ADMIN', 'MODERATOR'].includes(userRole)) {
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
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Utilisateur débanni avec succès",
      user: updatedUser
    });

  } catch (error) {
    console.error("Error unbanning user:", error);
    return NextResponse.json(
      { error: "Failed to unban user" },
      { status: 500 }
    );
  }
}