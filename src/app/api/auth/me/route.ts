import { NextResponse } from "next/server";
import { getUserById } from "@/game/userStore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
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
