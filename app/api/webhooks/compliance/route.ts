import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  collectUserData,
  generateJSONReport,
  generateTextReport,
  formatBytes,
  calculateExportSize,
} from "@/lib/gdpr";
import { sendGDPRDataEmail } from "@/lib/email";

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
    customerEmail: data.customer?.email,
  });

  if (!shopDomain) {
    console.error("No shop domain provided for data request");
    return;
  }

  try {
    // 1. Récupérer le shop
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
    });

    if (!shop) {
      console.error(`Shop not found: ${shopDomain}`);
      return;
    }

    // 2. Extraire l'email du client
    const customerEmail = data.customer?.email;
    const orderId = data.orders_requested?.[0]; // ID de commande Shopify (si disponible)

    if (!customerEmail) {
      console.error("No customer email provided in data request");
      return;
    }

    console.log(`📦 Processing GDPR data request for ${customerEmail} in shop ${shopDomain}`);

    // 3. Collecter toutes les données utilisateur
    const userData = await collectUserData(shop.id, customerEmail);

    if (!userData) {
      console.log(`No user data found for ${customerEmail} in shop ${shopDomain}`);

      // Envoyer un email indiquant qu'aucune donnée n'a été trouvée
      await sendGDPRDataEmail(
        customerEmail,
        {
          metadata: {
            exportDate: new Date().toISOString(),
            dataSubject: customerEmail,
            shopDomain: shopDomain,
            format: 'json',
          },
          personalInformation: {} as any,
          accounts: [],
          posts: [],
          comments: [],
          reactions: [],
          pollVotes: [],
          socialConnections: { following: [], followers: [] },
          gamification: { totalPoints: 0, badges: [], pointTransactions: [] },
          customization: null,
          onboarding: null,
        },
        `Bonjour,\n\nNous avons reçu votre demande d'export de données personnelles.\n\nAucune donnée n'a été trouvée pour l'adresse email ${customerEmail} dans notre système.\n\nSi vous pensez qu'il s'agit d'une erreur, veuillez contacter notre support.\n\nCordialement,\nL'équipe ${shopDomain}`,
        '{}'
      );
      return;
    }

    // 4. Générer les rapports
    const jsonReport = generateJSONReport(userData);
    const textReport = generateTextReport(userData);
    const exportSize = calculateExportSize(userData);

    console.log(`✅ Data collected for ${customerEmail}:`);
    console.log(`   - Posts: ${userData.posts.length}`);
    console.log(`   - Comments: ${userData.comments.length}`);
    console.log(`   - Reactions: ${userData.reactions.length}`);
    console.log(`   - Total points: ${userData.gamification.totalPoints}`);
    console.log(`   - Export size: ${formatBytes(exportSize)}`);

    // 5. Envoyer l'email avec les données
    const emailResult = await sendGDPRDataEmail(
      customerEmail,
      userData,
      textReport,
      jsonReport
    );

    if (emailResult.success) {
      console.log(`✅ GDPR data email sent successfully to ${customerEmail}`);

      // Log l'export dans la base de données (optionnel, pour audit)
      try {
        await prisma.pointTransaction.create({
          data: {
            shopId: shop.id,
            userId: userData.personalInformation.userId,
            userPointsId: (await prisma.userPoints.findFirst({
              where: {
                userId: userData.personalInformation.userId,
                shopId: shop.id,
              },
              select: { id: true },
            }))!.id,
            points: 0,
            action: 'DAILY_LOGIN', // Utiliser une action existante pour ne pas casser le schéma
            description: `GDPR data export requested and sent to ${customerEmail}`,
          },
        });
      } catch (logError) {
        console.error('Could not log GDPR export:', logError);
      }
    } else {
      console.error(`❌ Failed to send GDPR email: ${emailResult.error}`);
    }
  } catch (error) {
    console.error("Error handling customer data request:", error);
  }
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
