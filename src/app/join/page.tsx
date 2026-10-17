"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useGameRoom } from "@/hooks/useGameRoom";
import PlayerControllerScreen from "@/components/PlayerControllerScreen";

function JoinGameContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room") || "";

  const { playerId, gameState, lastAnimation, errorToast, sendAction } = useGameRoom(
    roomId,
    "PLAYER"
  );

  if (!roomId) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-rose-400">رمز الغرفة غير موجود. امسح الـ QR Code من جديد.</p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">📱</div>
          <p className="text-slate-400">جاري الاتصال بالغرفة {roomId}...</p>
        </div>
      </div>
    );
  }

  return (
    <PlayerControllerScreen
      gameState={gameState}
      lastAnimation={lastAnimation}
      errorToast={errorToast}
      sendAction={sendAction}
      playerId={playerId}
    />
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <p className="text-slate-400">جاري التحميل...</p>
        </div>
      }
    >
      <JoinGameContent />
    </Suspense>
  );
}
