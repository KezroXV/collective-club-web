import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";
import { requireAdmin, resolveActingAdmin } from "@/lib/auth";

const prisma = new PrismaClient();

// PUT /api/users/[userId]/role-assignment - Changer le rôle d'un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { userId } = await params;

    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { searchParams } = new URL(request.url);
    const actingUserId = searchParams.get("userId");

    // Vérifier les droits admin
    const actorId = await resolveActingAdmin(actingUserId, shopId);
    await requireAdmin(actorId, shopId);

    const body = await request.json();
    const { roleName } = body;

    // Validation
    if (!roleName) {
      return NextResponse.json(
        { error: "Nom du rôle requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe dans la boutique
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        shopId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        // ⚠️ NE JAMAIS inclure password dans les select !
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé dans cette boutique" },
        { status: 404 }
      );
    }

    // Vérifier que le rôle existe dans la boutique
    const role = await prisma.role.findFirst({
      where: {
        name: roleName,
        shopId
      }
    });

    if (!role) {
      return NextResponse.json(
        { error: "Rôle non trouvé dans cette boutique" },
        { status: 404 }
      );
    }

    // Mettre à jour le rôle de l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: roleName },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        // ⚠️ NE JAMAIS inclure password dans les select !
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      },
      roleInfo: {
        name: role.name,
        displayName: role.displayName,
        color: role.color
      },
      message: `Rôle changé vers ${role.displayName}`
    });

  } catch (error) {
    console.error('Error assigning role:', error);
    return NextResponse.json(
      { error: "Erreur lors de l'assignation du rôle" },
      { status: 500 }
    );
  }
}