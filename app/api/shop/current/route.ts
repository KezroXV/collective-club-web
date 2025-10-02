import { NextRequest, NextResponse } from "next/server";
import { getShopContext } from "@/lib/shopIsolation";

// GET /api/shop/current - Récupérer les infos de la boutique courante
export async function GET(request: NextRequest) {
  try {
    const shopContext = await getShopContext(request);

    return NextResponse.json({
      id: shopContext.shopId,
      shopDomain: shopContext.shopDomain,
      shopName: shopContext.shopName
    });

  } catch (error) {
    console.error("Error fetching current shop:", error);
    return NextResponse.json(
      { error: "Boutique non trouvée" },
      { status: 404 }
    );
  }
}