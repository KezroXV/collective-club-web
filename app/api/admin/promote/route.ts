import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, requireAuthAdmin } from "@/lib/auth-context";
import { promoteUserToAdmin } from "@/lib/admin";

export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur actuel est admin
    const { user, shopId } = await requireAuthAdmin();
    
    const body = await request.json();
    const { targetUserId } = body;
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: "targetUserId is required" },
        { status: 400 }
      );
    }
    
    // Promouvoir l'utilisateur
    const updatedUser = await promoteUserToAdmin(targetUserId, user.id, shopId);
    
    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      }
    });
    
  } catch (error) {
    console.error("Admin promotion error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 403 : 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}