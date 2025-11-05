import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

// DELETE /api/users/[userId] - Supprimer un utilisateur définitivement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    logger.api('/api/users/[userId]', 'DELETE request');
    
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);
    logger.debug('ShopId obtained', { shopId });

    const { userId: targetUserId } = await params;
    const body = await request.json();
    const { userId: currentUserId, userRole } = body;
    
    logger.debug('Request data', { targetUserId, currentUserId, userRole });

    if (!currentUserId || !userRole) {
      return NextResponse.json(
        { error: "User ID and role are required" },
        { status: 400 }
      );
    }

    // Vérifier les permissions - seulement les ADMIN peuvent supprimer
    if (userRole !== 'ADMIN') {
      logger.debug('Permission denied', { userRole });
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent supprimer des utilisateurs" },
        { status: 403 }
      );
    }

    logger.debug('Permissions OK');

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
        isShopOwner: true,
        // ⚠️ NE JAMAIS inclure password dans les select !
      }
    });

    logger.debug('Target user query result', { found: !!targetUser, targetUserId, shopId });

    if (!targetUser) {
      logger.debug('Target user not found');
      return NextResponse.json(
        { error: "Utilisateur non trouvé dans cette boutique" },
        { status: 404 }
      );
    }

    // Empêcher la suppression d'un administrateur par un autre admin
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json(
        { error: "Impossible de supprimer un administrateur" },
        { status: 400 }
      );
    }

    // Empêcher l'auto-suppression
    if (targetUserId === currentUserId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous supprimer vous-même" },
        { status: 400 }
      );
    }

    logger.debug('User found, proceeding with deletion');

    // Supprimer l'utilisateur (cascade supprimera automatiquement posts, comments, etc.)
    await prisma.user.delete({
      where: { id: targetUserId }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Utilisateur supprimé définitivement"
    });

  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

// PUT /api/users/[userId] - Modifier le rôle d'un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    logger.api('/api/users/[userId]', 'PUT request');
    
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);
    logger.debug('ShopId obtained', { shopId });

    const { userId: targetUserId } = await params;
    const body = await request.json();
    const { userId: currentUserId, userRole, newRole } = body;
    
    logger.debug('Request data', { targetUserId, currentUserId, userRole, newRole });

    if (!currentUserId || !userRole || !newRole) {
      return NextResponse.json(
        { error: "User ID, role and new role are required" },
        { status: 400 }
      );
    }

    // Vérifier les permissions - seulement les ADMIN peuvent modifier les rôles
    if (userRole !== 'ADMIN') {
      logger.debug('Permission denied', { userRole });
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent modifier les rôles" },
        { status: 403 }
      );
    }

    // Vérifier que le nouveau rôle est valide
    const validRoles = ['ADMIN', 'MODERATOR', 'MEMBER'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: "Rôle invalide" },
        { status: 400 }
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
        isShopOwner: true,
        // ⚠️ NE JAMAIS inclure password dans les select !
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé dans cette boutique" },
        { status: 404 }
      );
    }

    // Empêcher la modification de son propre rôle
    if (targetUserId === currentUserId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier votre propre rôle" },
        { status: 400 }
      );
    }

    logger.debug('Updating user role');

    // Mettre à jour le rôle de l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole as any },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        // ⚠️ NE JAMAIS inclure password dans les select !
      }
    });

    return NextResponse.json({
      success: true,
      message: `Rôle modifié vers ${newRole}`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}