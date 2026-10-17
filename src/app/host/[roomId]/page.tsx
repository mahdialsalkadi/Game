"use client";

import { use } from "react";
import { useGameRoom } from "@/hooks/useGameRoom";
import SharedBoardScreen from "@/components/SharedBoardScreen";

export default function HostPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const { gameState, lastAnimation, sendAction, isGeneratingAI } = useGameRoom(
    roomId,
    "HOST"
  );

  if (!gameState) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🎲</div>
          <p className="text-slate-400 text-lg">جاري تجهيز لوحة اللعبة #{roomId}...</p>
        </div>
      </div>
    );
  }

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${roomId}?role=PLAYER`
      : `https://yourgame.com/room/${roomId}?role=PLAYER`;

  return (
    <SharedBoardScreen
      gameState={gameState}
      lastAnimation={lastAnimation}
      joinUrl={joinUrl}
      sendAction={sendAction}
      isGeneratingAI={isGeneratingAI}
    />
  );
}
