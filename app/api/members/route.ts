import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin, resolveActingAdmin } from "@/lib/auth";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";

const prisma = new PrismaClient();

interface MemberResponse {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  isActive: boolean;
  isOwner?: boolean;
  isBanned?: boolean;
  image?: string | null;
  postsCount: number;
  commentsCount: number;
  reactionsCount: number;
}

interface PaginatedMembersResponse {
  members: MemberResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function GET(request: NextRequest): Promise<NextResponse<PaginatedMembersResponse | { error: string }>> {
  try {
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    // Résoudre l'utilisateur admin agissant
    const actingUserId = await resolveActingAdmin(userId, shopId);

    // Vérifier les droits admin
    await requireAdmin(actingUserId, shopId);

    // Calculer l'offset pour la pagination
    const offset = (page - 1) * limit;

    // Construire les conditions de recherche
    const searchConditions = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    // Récupérer le nombre total d'utilisateurs pour la pagination
    const totalUsers = await prisma.user.count({
      where: {
        shopId,
        ...searchConditions,
      },
    });

    // Récupérer les informations du shop pour déterminer l'owner
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { ownerId: true }
    });

    if (!shop) {
      return NextResponse.json(
        { error: "Shop not found" },
        { status: 404 }
      );
    }

    // Récupérer les utilisateurs avec leurs statistiques
    const users = await prisma.user.findMany({
      where: {
        shopId,
        ...searchConditions,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            reactions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    });

    // Transformer les données pour la réponse
    const membersResponse: MemberResponse[] = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      isActive: (user._count.posts + user._count.comments + user._count.reactions) > 0,
      isOwner: user.id === shop.ownerId, // Déterminer si c'est le propriétaire du shop
      isBanned: user.isBanned,
      image: user.image,
      postsCount: user._count.posts,
      commentsCount: user._count.comments,
      reactionsCount: user._count.reactions,
    }));

    const totalPages = Math.ceil(totalUsers / limit);

    const response: PaginatedMembersResponse = {
      members: membersResponse,
      total: totalUsers,
      page,
      limit,
      totalPages,
    };

    return NextResponse.json(response, {
      headers: {
        // Cache pendant 2 minutes
        'Cache-Control': 's-maxage=120, stale-while-revalidate=300',
      },
    });

  } catch (error) {
    console.error('Error fetching members:', error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent voir les membres" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}