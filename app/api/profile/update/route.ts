import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getShopId, ensureShopIsolation } from "@/lib/shopIsolation";
import { getAuthContext } from "@/lib/hybridAuth";
import bcrypt from "bcrypt";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

// PUT /api/profile/update - Mettre à jour le profil utilisateur
export async function PUT(request: NextRequest) {
  try {
    logger.api('/api/profile/update', 'Starting request');
    
    // 🏪 ISOLATION MULTI-TENANT
    const shopId = await getShopId(request);
    ensureShopIsolation(shopId);
    logger.debug('ShopId obtained', { shopId });

    // Vérifier l'authentification (supporte Shopify session tokens + NextAuth)
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, image, password } = body;
    
    logger.debug('Profile update requested', { hasName: !!name, hasImage: !!image, authMethod: auth.authMethod });

    // Trouver l'utilisateur actuel
    const currentUser = await prisma.user.findFirst({
      where: {
        email: auth.email,
        shopId
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        // ⚠️ NE JAMAIS inclure password dans les select !
      }
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Mise à jour du nom
    if (name && name !== currentUser.name) {
      updateData.name = name;
    }

    // Mise à jour de l'image
    if (image && image !== currentUser.image) {
      updateData.image = image;
    }

    // Mise à jour du mot de passe (pour les utilisateurs non-OAuth uniquement)
    if (password) {
      // Vérifier que ce n'est pas un utilisateur OAuth
      const accounts = await prisma.account.findMany({
        where: { userId: currentUser.id }
      });
      
      if (accounts.length > 0) {
        return NextResponse.json(
          { error: "Cannot change password for OAuth users" },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    logger.debug('Update data prepared', { fields: Object.keys(updateData) });

    // Effectuer la mise à jour
    if (Object.keys(updateData).length > 0) {
      const updatedUser = await prisma.user.update({
        where: { id: currentUser.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true
        }
      });

      logger.debug('User updated successfully');

      return NextResponse.json({ 
        success: true, 
        message: "Profil mis à jour avec succès",
        user: updatedUser
      });
    } else {
      logger.debug('No changes detected');
      return NextResponse.json({ 
        success: true, 
        message: "Aucune modification détectée"
      });
    }

  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}