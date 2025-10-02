import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";
import { requireAdmin, resolveActingAdmin } from "@/lib/auth";
import { Permission, ROLE_PERMISSIONS, UserRole } from "@/lib/permissions";

const prisma = new PrismaClient();

// PUT /api/roles/[roleId] - Modifier un rôle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { roleId } = await params;

    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { searchParams } = new URL(request.url);
    const actingUserId = searchParams.get("userId");

    // Vérifier les droits admin
    const actorId = await resolveActingAdmin(actingUserId, shopId);
    await requireAdmin(actorId, shopId);

    const body = await request.json();
    const { name, displayName, color, permissionType } = body;

    // Vérifier que le rôle existe et appartient à la boutique
    const existingRole = await prisma.role.findFirst({
      where: {
        id: roleId,
        shopId
      }
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: "Rôle non trouvé" },
        { status: 404 }
      );
    }

    // Ne pas permettre la modification des rôles par défaut
    if (existingRole.isDefault) {
      return NextResponse.json(
        { error: "Les rôles par défaut ne peuvent pas être modifiés" },
        { status: 403 }
      );
    }

    // Vérifier l'unicité du nom dans la boutique (si le nom change)
    if (name && name.trim().toUpperCase() !== existingRole.name) {
      const duplicateRole = await prisma.role.findFirst({
        where: {
          shopId,
          name: name.trim().toUpperCase(),
          id: { not: roleId }
        }
      });

      if (duplicateRole) {
        return NextResponse.json(
          { error: "Un rôle avec ce nom existe déjà" },
          { status: 409 }
        );
      }
    }

    // Récupérer les permissions selon le type choisi
    let permissions = existingRole.permissions;
    if (permissionType) {
      permissions = permissionType === "admin"
        ? ROLE_PERMISSIONS[UserRole.ADMIN]
        : ROLE_PERMISSIONS[UserRole.MODERATOR];
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        ...(name && { name: name.trim().toUpperCase() }),
        ...(displayName && { displayName: displayName.trim() }),
        ...(color && { color: color.trim() }),
        ...(permissionType && { permissions })
      }
    });

    return NextResponse.json(updatedRole);

  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du rôle" },
      { status: 500 }
    );
  }
}

// DELETE /api/roles/[roleId] - Supprimer un rôle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { roleId } = await params;

    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { searchParams } = new URL(request.url);
    const actingUserId = searchParams.get("userId");

    // Vérifier les droits admin
    const actorId = await resolveActingAdmin(actingUserId, shopId);
    await requireAdmin(actorId, shopId);

    // Vérifier que le rôle existe et appartient à la boutique
    const existingRole = await prisma.role.findFirst({
      where: {
        id: roleId,
        shopId
      }
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: "Rôle non trouvé" },
        { status: 404 }
      );
    }

    // Ne pas permettre la suppression des rôles par défaut
    if (existingRole.isDefault) {
      return NextResponse.json(
        { error: "Les rôles par défaut ne peuvent pas être supprimés" },
        { status: 403 }
      );
    }

    // Vérifier si des utilisateurs ont ce rôle
    const usersWithRole = await prisma.user.count({
      where: {
        shopId,
        role: existingRole.name
      }
    });

    if (usersWithRole > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer ce rôle, ${usersWithRole} utilisateur(s) l'utilisent encore` },
        { status: 409 }
      );
    }

    await prisma.role.delete({
      where: { id: roleId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du rôle" },
      { status: 500 }
    );
  }
}