import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { userId } = await params;

    // Récupérer le nombre de followers de cet utilisateur
    const followersCount = await prisma.follow.count({
      where: {
        followingId: userId, // Les gens qui suivent cet utilisateur
        shopId, // Dans cette boutique
      },
    });

    return NextResponse.json({ followersCount });
  } catch (error) {
    console.error("Error fetching followers count:", error);
    return NextResponse.json(
      { error: "Failed to fetch followers count" },
      { status: 500 }
    );
  }
}