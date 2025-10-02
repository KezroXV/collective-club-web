import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const body = await request.json();
    const { pollId, optionId, userId } = body;

    if (!pollId || !optionId || !userId) {
      return NextResponse.json(
        { error: "pollId, optionId, and userId are required" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur a déjà voté (dans cette boutique)
    const existingVote = await prisma.pollVote.findUnique({
      where: {
        userId_pollId: {
          userId,
          pollId,
        },
      },
    });

    if (existingVote) {
      // Si re-clique sur la même option via POST, on renvoie le vote existant (pas de suppression ici)
      if (existingVote.optionId === optionId) {
        return NextResponse.json(existingVote);
      }
      // Mettre à jour le vote existant
      const updatedVote = await prisma.pollVote.update({
        where: { id: existingVote.id },
        data: { optionId },
      });
      return NextResponse.json(updatedVote);
    } else {
      // Créer un nouveau vote
      const newVote = await prisma.pollVote.create({
        data: {
          pollId,
          optionId,
          userId,
          shopId, // ✅ ASSOCIER À LA BOUTIQUE
        },
      });
      return NextResponse.json(newVote, { status: 201 });
    }
  } catch (error) {
    console.error("Error voting:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}

// Récupérer le vote actuel de l'utilisateur pour un sondage (isolé par boutique)
export async function GET(request: NextRequest) {
  try {
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const { searchParams } = new URL(request.url);
    const pollId = searchParams.get("pollId");
    const userId = searchParams.get("userId");

    if (!pollId || !userId) {
      return NextResponse.json(
        { error: "pollId and userId are required" },
        { status: 400 }
      );
    }

    const vote = await prisma.pollVote.findFirst({
      where: {
        userId,
        pollId,
        shopId, // ✅ FILTRER PAR BOUTIQUE
      },
    });

    return NextResponse.json(vote);
  } catch (error) {
    console.error("Error fetching vote:", error);
    return NextResponse.json(
      { error: "Failed to fetch vote" },
      { status: 500 }
    );
  }
}

// Supprimer le vote de l'utilisateur (toggle off, isolé par boutique)
export async function DELETE(request: NextRequest) {
  try {
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);

    const body = await request.json();
    const { pollId, userId } = body;

    if (!pollId || !userId) {
      return NextResponse.json(
        { error: "pollId and userId are required" },
        { status: 400 }
      );
    }

    const existingVote = await prisma.pollVote.findFirst({
      where: {
        userId,
        pollId,
        shopId, // ✅ CHERCHER DANS LA BOUTIQUE
      },
    });

    if (!existingVote) {
      return NextResponse.json({ ok: true });
    }

    await prisma.pollVote.delete({ where: { id: existingVote.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting vote:", error);
    return NextResponse.json(
      { error: "Failed to delete vote" },
      { status: 500 }
    );
  }
}
