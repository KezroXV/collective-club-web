import { NextRequest, NextResponse } from "next/server";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";
import { requireAdmin, resolveActingAdmin } from "@/lib/auth";
import { Permission, ROLE_PERMISSIONS, UserRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// GET /api/roles - Récupérer tous les rôles d'une boutique
export async function GET(request: NextRequest) {
  try {
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const roles = await prisma.role.findMany({
      where: { shopId },
      orderBy: [
        { isDefault: "desc" }, // Rôles par défaut en premier
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des rôles" },
      { status: 500 }
    );
  }
}

// POST /api/roles - Créer un nouveau rôle
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

    const body = await request.json();
    const { name, displayName, color, permissionType } = body;

    // Validation
    if (!name || !displayName || !permissionType) {
      return NextResponse.json(
        { error: "Nom, nom d'affichage et type de permissions requis" },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du nom dans la boutique
    const existingRole = await prisma.role.findFirst({
      where: {
        shopId,
        name: name.trim().toUpperCase(),
      },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "Un rôle avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    // Récupérer les permissions selon le type choisi
    const permissions =
      permissionType === "admin"
        ? ROLE_PERMISSIONS[UserRole.ADMIN]
        : ROLE_PERMISSIONS[UserRole.MODERATOR];

    const role = await prisma.role.create({
      data: {
        name: name.trim().toUpperCase(),
        displayName: displayName.trim(),
        color: color || "#3B82F6",
        permissions: permissions,
        isDefault: false,
        shopId,
      },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du rôle" },
      { status: 500 }
    );
  }
}
