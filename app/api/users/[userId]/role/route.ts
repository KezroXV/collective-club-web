import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin, resolveActingAdmin } from "@/lib/auth";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";
import { 
  UserRole, 
  canChangeRole, 
  RoleChangeContext
} from "@/lib/permissions";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

interface RoleChangeRequest {
  role: UserRole;
  reason?: string;
}

interface RoleChangeResponse {
  success: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
  };
  message: string;
}

// PUT /api/users/[userId]/role - Changer le rôle d'un utilisateur (ADMIN ONLY, sécurisé)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse<RoleChangeResponse | { error: string }>> {
  try {
    // Await params (Next.js 15 requirement)
    const { userId } = await params;

    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const targetUserId = userId;
    const body: RoleChangeRequest = await request.json();
    const { searchParams } = new URL(request.url);
    const actingUserId = searchParams.get("userId");

    // Résoudre l'utilisateur admin agissant
    const actorId = await resolveActingAdmin(actingUserId, shopId);

    // Vérifier les droits admin
    await requireAdmin(actorId, shopId);

    // Valider les données d'entrée
    if (!body.role || !Object.values(UserRole).includes(body.role)) {
      return NextResponse.json(
        { error: "Rôle invalide" },
        { status: 400 }
      );
    }

    // Récupérer les informations des utilisateurs
    const [actor, target] = await Promise.all([
      prisma.user.findFirst({
        where: { id: actorId, shopId },
        select: { id: true, role: true, name: true }
      }),
      prisma.user.findFirst({
        where: { id: targetUserId, shopId },
        select: {
          id: true,
          role: true,
          name: true,
          email: true,
          isShopOwner: true // Vérifier si c'est le propriétaire
        }
      })
    ]);

    if (!actor) {
      return NextResponse.json(
        { error: "Utilisateur administrateur non trouvé" },
        { status: 404 }
      );
    }

    if (!target) {
      return NextResponse.json(
        { error: "Utilisateur cible non trouvé dans cette boutique" },
        { status: 404 }
      );
    }

    // Vérifier les permissions de changement de rôle
    const roleChangeContext: RoleChangeContext = {
      actorId: actor.id,
      actorRole: actor.role as UserRole,
      targetId: target.id,
      targetRole: target.role as UserRole,
      newRole: body.role,
      isTargetOwner: target.isShopOwner || false,
      shopId,
    };

    const permissionCheck = canChangeRole(roleChangeContext);
    
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.reason || "Changement de rôle non autorisé" },
        { status: 403 }
      );
    }

    // Si le rôle est déjà le même, pas besoin de mise à jour
    if (target.role === body.role) {
      return NextResponse.json({
        success: true,
        user: {
          id: target.id,
          name: target.name,
          email: target.email,
          role: target.role as UserRole,
        },
        message: "Le rôle est déjà à jour",
      });
    }

    // Effectuer le changement de rôle dans une transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour le rôle de l'utilisateur
      const user = await tx.user.update({
        where: { id: targetUserId },
        data: { role: body.role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        }
      });

      // 2. Logger le changement de rôle pour audit (si le modèle existe)
      try {
        // Note: Nécessite l'ajout du modèle RoleChange au schéma Prisma
        logger.info('Role change logged:', {
          shopId,
          adminId: actor.id.substring(0, 8) + '...',
          targetId: target.id.substring(0, 8) + '...',
          fromRole: target.role,
          toRole: body.role,
          hasReason: !!body.reason
        });
      } catch (error) {
        // Log silencieux si le modèle n'existe pas encore
        console.warn('RoleChange logging skipped:', error);
      }

      return user;
    });

    const response: RoleChangeResponse = {
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role as UserRole,
      },
      message: `Rôle changé avec succès de ${target.role} vers ${body.role}`,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error changing user role:', error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent modifier les rôles" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors du changement de rôle" },
      { status: 500 }
    );
  }
}

// GET - Obtenir les informations de rôle d'un utilisateur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  try {
    // Await params (Next.js 15 requirement)
    const { userId } = await params;

    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const targetUserId = userId;
    const { searchParams } = new URL(request.url);
    const actingUserId = searchParams.get("userId");

    // Résoudre l'utilisateur admin agissant
    const actorId = await resolveActingAdmin(actingUserId, shopId);

    // Vérifier les droits admin
    await requireAdmin(actorId, shopId);

    // Récupérer les informations de l'utilisateur
    const user = await prisma.user.findFirst({
      where: { id: targetUserId, shopId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isShopOwner: true,
        createdAt: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé dans cette boutique" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user,
      canModify: !user.isShopOwner && user.id !== actorId,
    });

  } catch (error) {
    console.error('Error fetching user role:', error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la récupération des informations utilisateur" },
      { status: 500 }
    );
  }
}