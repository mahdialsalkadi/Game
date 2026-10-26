import { NextResponse } from "next/server";
import { getUserById } from "@/game/userStore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get("userId");

    if (!userId) {
      const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
      if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        userId = authHeader.slice(7).trim();
      }
    }

    if (!userId || userId === "undefined" || userId === "null") {
      return NextResponse.json(
        { success: false, error: "معرّف المستخدم مطلوب." },
        { status: 400 }
      );
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "الحساب غير موجود." },
        { status: 404 }
      );
    }

    const { passwordHash, ...sanitized } = user;
    return NextResponse.json({
      success: true,
      user: sanitized
    });
  } catch (err: any) {
    console.error("[Auth Me API] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "حدث خطأ في جلب بيانات الحساب." },
      { status: 500 }
    );
  }
}
