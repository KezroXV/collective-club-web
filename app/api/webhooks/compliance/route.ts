import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// Vérification de la signature HMAC Shopify
function verifyShopifyWebhook(
  rawBody: string,
  hmacHeader: string | null
): boolean {
  if (!hmacHeader) return false;

  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    console.error("SHOPIFY_API_SECRET not configured");
    return false;
  }

  const hash = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hmacHeader)
  );
}

export async function POST(request: NextRequest) {
  try {
    // Récupérer le body brut pour vérification HMAC
    const rawBody = await request.text();
    const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
    const topic = request.headers.get("x-shopify-topic");
    const shopDomain = request.headers.get("x-shopify-shop-domain");

    // Vérifier la signature HMAC
    if (!verifyShopifyWebhook(rawBody, hmacHeader)) {
      console.error("Invalid HMAC signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    console.log(`Received webhook: ${topic} from ${shopDomain}`);

    // Parser le body après vérification
    const data = JSON.parse(rawBody);

    // Traiter selon le type de webhook
    switch (topic) {
      case "customers/data_request":
        await handleCustomerDataRequest(shopDomain, data);
        break;

      case "customers/redact":
        await handleCustomerRedact(shopDomain, data);
        break;

      case "shop/redact":
        await handleShopRedact(shopDomain, data);
        break;

      default:
        console.warn(`Unhandled webhook topic: ${topic}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}

// Handler pour demande de données client (RGPD)
async function handleCustomerDataRequest(
  shopDomain: string | null,
  data: any
) {
  console.log("Customer data request:", {
    shopDomain,
    customerId: data.customer?.id,
  });

  // TODO: Implémenter l'export des données client
  // Pour l'instant, juste logger la demande
  // Vous devez envoyer les données du client à l'email fourni dans data.customer.email
}

// Handler pour suppression de données client (RGPD)
async function handleCustomerRedact(shopDomain: string | null, data: any) {
  console.log("Customer redact request:", {
    shopDomain,
    customerId: data.customer?.id,
  });

  if (!shopDomain) return;

  try {
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
    });

    if (!shop) return;

    // Anonymiser ou supprimer les données du client
    // Pour ce forum, vous pouvez anonymiser les posts/comments du client
    const customerEmail = data.customer?.email;

    if (customerEmail) {
      await prisma.user.updateMany({
        where: {
          shopId: shop.id,
          email: customerEmail,
        },
        data: {
          email: `deleted-${Date.now()}@deleted.local`,
          name: "Utilisateur supprimé",
          image: null,
          isBanned: true,
        },
      });
    }
  } catch (error) {
    console.error("Error handling customer redact:", error);
  }
}

// Handler pour suppression de shop (48h après désinstallation)
async function handleShopRedact(shopDomain: string | null, data: any) {
  console.log("Shop redact request:", { shopDomain });

  if (!shopDomain) return;

  try {
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
    });

    if (!shop) return;

    // Supprimer toutes les données du shop
    // L'ordre est important à cause des contraintes de clés étrangères
    await prisma.$transaction([
      prisma.pollVote.deleteMany({ where: { shopId: shop.id } }),
      prisma.pollOption.deleteMany({ where: { shopId: shop.id } }),
      prisma.poll.deleteMany({ where: { shopId: shop.id } }),
      prisma.reaction.deleteMany({ where: { shopId: shop.id } }),
      prisma.comment.deleteMany({ where: { shopId: shop.id } }),
      prisma.post.deleteMany({ where: { shopId: shop.id } }),
      prisma.pointTransaction.deleteMany({ where: { shopId: shop.id } }),
      prisma.userPoints.deleteMany({ where: { shopId: shop.id } }),
      prisma.follow.deleteMany({ where: { shopId: shop.id } }),
      prisma.category.deleteMany({ where: { shopId: shop.id } }),
      prisma.badge.deleteMany({ where: { shopId: shop.id } }),
      prisma.role.deleteMany({ where: { shopId: shop.id } }),
      prisma.account.deleteMany({ where: { shopId: shop.id } }),
      prisma.user.deleteMany({ where: { shopId: shop.id } }),
      prisma.shop.delete({ where: { id: shop.id } }),
    ]);

    console.log(`Shop ${shopDomain} data redacted successfully`);
  } catch (error) {
    console.error("Error handling shop redact:", error);
  }
}
