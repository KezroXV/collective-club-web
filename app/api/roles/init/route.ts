import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";
import { requireAdmin, resolveActingAdmin } from "@/lib/auth";
import { ROLE_PERMISSIONS, UserRole } from "@/lib/permissions";

const prisma = new PrismaClient();

// POST /api/roles/init - Initialiser les rôles par défaut pour une boutique
export async function POST(request: NextRequest) {
  try {
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { searchParams } = new URL(request.url);
    const actingUserId = searchParams.get("userId");

    // Vérifier les droits admin
    const actorId = await resolveActingAdmin(actingUserId, shopId);
    await requireAdmin(actorId, shopId);

    // Vérifier si les rôles par défaut existent déjà
    const existingRoles = await prisma.role.findMany({
      where: {
        shopId,
        isDefault: true
      }
    });

    if (existingRoles.length > 0) {
      return NextResponse.json({
        message: "Les rôles par défaut existent déjà",
        roles: existingRoles
      });
    }

    // Créer les rôles par défaut
    const defaultRoles = [
      {
        name: "ADMIN",
        displayName: "Administrateur",
        color: "#EF4444", // Rouge
        permissions: ROLE_PERMISSIONS[UserRole.ADMIN],
        isDefault: true,
        shopId
      },
      {
        name: "MODERATOR",
        displayName: "Modérateur",
        color: "#3B82F6", // Bleu
        permissions: ROLE_PERMISSIONS[UserRole.MODERATOR],
        isDefault: true,
        shopId
      },
      {
        name: "MEMBER",
        displayName: "Membre",
        color: "#10B981", // Vert
        permissions: ROLE_PERMISSIONS[UserRole.MEMBER],
        isDefault: true,
        shopId
      }
    ];

    const createdRoles = await prisma.role.createMany({
      data: defaultRoles
    });

    const roles = await prisma.role.findMany({
      where: {
        shopId,
        isDefault: true
      }
    });

    return NextResponse.json({
      message: "Rôles par défaut créés avec succès",
      roles: roles
    }, { status: 201 });

  } catch (error) {
    console.error('Error initializing default roles:', error);
    return NextResponse.json(
      { error: "Erreur lors de l'initialisation des rôles par défaut" },
      { status: 500 }
    );
  }
}