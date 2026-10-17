import { NextResponse } from "next/server";
import {
  saveCustomGame,
  getPublicCommunityGames,
  getUserGames,
  remixCommunityGame,
  recordGamePlay,
  toggleGameLike
} from "@/game/userStore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get("authorId");

    if (authorId) {
      const userGames = await getUserGames(authorId);
      return NextResponse.json({
        success: true,
        games: userGames
      });
    }

    const publicGames = await getPublicCommunityGames();
    return NextResponse.json({
      success: true,
      games: publicGames
    });
  } catch (err: any) {
    console.error("[Community API GET] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "حدث خطأ في جلب ألعاب المجتمع." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { authorId, pack, visibility } = body;

    if (!authorId || !pack) {
      return NextResponse.json(
        { success: false, error: "معرّف المؤلف وحزمة اللعبة مطلوبان." },
        { status: 400 }
      );
    }

    const saved = await saveCustomGame({
      authorId,
      pack,
      visibility: visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE"
    });

    return NextResponse.json({
      success: true,
      game: saved
    });
  } catch (err: any) {
    console.error("[Community API POST] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "حدث خطأ في حفظ اللعبة." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { gameId, action, authorId } = body;

    if (!gameId || !action) {
      return NextResponse.json(
        { success: false, error: "معرّف اللعبة والإجراء مطلوبان." },
        { status: 400 }
      );
    }

    if (action === "LIKE") {
      const updated = await toggleGameLike(gameId);
      return NextResponse.json({ success: true, game: updated });
    }

    if (action === "PLAY") {
      const updated = await recordGamePlay(gameId);
      return NextResponse.json({ success: true, game: updated });
    }

    if (action === "REMIX") {
      if (!authorId) {
        return NextResponse.json(
          { success: false, error: "معرّف المؤلف الجديد مطلوب لعمل ريمكس." },
          { status: 400 }
        );
      }
      const remixed = await remixCommunityGame(gameId, authorId);
      return NextResponse.json({ success: true, game: remixed });
    }

    return NextResponse.json(
      { success: false, error: "إجراء غير معروف." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[Community API PUT] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "حدث خطأ في تحديث اللعبة." },
      { status: 500 }
    );
  }
}
