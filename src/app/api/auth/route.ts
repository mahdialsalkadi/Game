import { NextResponse } from "next/server";
import { createUser, authenticateUser, type UserAccount } from "@/game/userStore";

function sanitizeUser(user: UserAccount) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body.action || "LOGIN").toUpperCase();

    if (action === "REGISTER") {
      const { username, email, password, avatarColor } = body;
      if (!username || !email || !password) {
        return NextResponse.json(
          { success: false, error: "يرجى تعبئة جميع الحقول المطلوبة (الاسم، البريد، كلمة المرور)." },
          { status: 400 }
        );
      }

      const user = await createUser({
        username,
        email,
        password,
        avatarColor
      });

      return NextResponse.json({
        success: true,
        token: user.id,
        user: sanitizeUser(user)
      });
    }

    if (action === "LOGIN") {
      const { usernameOrEmail, password } = body;
      if (!usernameOrEmail || !password) {
        return NextResponse.json(
          { success: false, error: "يرجى إدخال اسم المستخدم أو البريد وكلمة المرور." },
          { status: 400 }
        );
      }

      const user = await authenticateUser(usernameOrEmail, password);
      if (!user) {
        return NextResponse.json(
          { success: false, error: "بيانات الدخول غير صحيحة، يرجى التأكد من كلمة المرور." },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        token: user.id,
        user: sanitizeUser(user)
      });
    }

    return NextResponse.json(
      { success: false, error: "إجراء غير معروف." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[Auth API] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "حدث خطأ في معالجة طلب الحساب." },
      { status: 400 }
    );
  }
}
