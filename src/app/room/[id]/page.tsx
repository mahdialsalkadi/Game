"use client";

import { use, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGameRoom } from "@/hooks/useGameRoom";
import SharedBoardScreen from "@/components/SharedBoardScreen";
import PlayerControllerScreen from "@/components/PlayerControllerScreen";
import { Trophy, Medal, Award, Home, RotateCcw, Shield, Coins, Flame } from "lucide-react";
import type { FullRoomState } from "@/game/gameRoom";

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

function GameOverScreen({
  gameState,
  lastAnimation,
  role,
  playerId
}: {
  gameState: FullRoomState;
  lastAnimation: any;
  role: "HOST" | "PLAYER";
  playerId: string;
}) {
  const router = useRouter();
  const standings =
    lastAnimation?.standings ||
    Object.values(gameState.players).sort((a, b) => b.coins - a.coins);

  const winner = lastAnimation?.winner || standings[0];
  const myPlayer = gameState.players[playerId];

  // Derive MVP titles
  const richest = standings[0];
  const biggestThief = [...standings].sort(
    (a, b) => (b.stats?.coinsStolen || 0) - (a.stats?.coinsStolen || 0)
  )[0];
  const shieldMaster = [...standings].sort(
    (a, b) => (b.stats?.shieldsTriggered || 0) - (a.stats?.shieldsTriggered || 0)
  )[0];

  let mostBetrayed = null;
  let maxBetrayals = 0;
  for (const p of standings) {
    const total = Object.values(p.stats?.timesBetrayedBy || {}).reduce<number>((s, v) => s + (Number(v) || 0), 0);
    if (total > maxBetrayals) {
      maxBetrayals = total;
      mostBetrayed = p;
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between p-6 select-none font-sans"
    >
      {/* Header */}
      <header className="text-center mt-4">
        <div className="inline-flex p-4 rounded-3xl bg-amber-500/20 border border-amber-400/40 mb-3 shadow-2xl">
          <Trophy className="w-14 h-14 text-amber-400 animate-bounce" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-2">انتهت السهرة! 🏆</h1>
        <p className="text-slate-400 text-base md:text-lg">
          سهرة مليئة بالذكاء والمؤامرات والمفاجآت
        </p>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl my-6 flex flex-col gap-6">
        {/* Personal stats if player */}
        {role === "PLAYER" && myPlayer && (
          <div
            style={{ borderColor: myPlayer.color }}
            className="bg-slate-900/90 border-2 rounded-3xl p-6 text-center shadow-xl"
          >
            <h2 className="text-lg font-bold text-slate-300">نتيجتك الشخصية</h2>
            <div className="text-4xl font-black text-amber-400 mt-2">
              {myPlayer.coins} {gameState.currencyName}
            </div>
            <p className="text-sm text-slate-400 mt-1">
              المركز #{standings.findIndex((p: any) => p.id === myPlayer.id) + 1} من بين {standings.length} لاعبين
            </p>
          </div>
        )}

        {/* Winner Highlight */}
        {winner && (
          <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-400/60 rounded-3xl p-6 text-center shadow-2xl">
            <span className="text-xs uppercase font-black tracking-widest text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/30">
              👑 بطل السهرة الأول
            </span>
            <div className="flex items-center justify-center gap-3 mt-4">
              <div
                style={{ backgroundColor: winner.color }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg"
              >
                {winner.name.slice(0, 2)}
              </div>
              <div className="text-right">
                <h3 className="text-2xl font-black text-white">{winner.name}</h3>
                <span className="text-amber-400 font-bold text-lg">
                  {winner.coins} {gameState.currencyName}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Standings Podium */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-black mb-4 flex items-center gap-2">
            <Medal className="w-5 h-5 text-amber-400" />
            جدول الترتيب النهائي
          </h3>
          <div className="space-y-3">
            {standings.map((player: any, idx: number) => {
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const isThird = idx === 2;

              return (
                <div
                  key={player.id}
                  style={{
                    borderColor: isFirst
                      ? "#F59E0B"
                      : isSecond
                      ? "#94A3B8"
                      : isThird
                      ? "#B45309"
                      : "rgba(51, 65, 85, 0.5)"
                  }}
                  className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                    isFirst ? "bg-amber-950/30 shadow-md" : "bg-slate-950/60"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                        isFirst
                          ? "bg-amber-400 text-slate-950"
                          : isSecond
                          ? "bg-slate-300 text-slate-950"
                          : isThird
                          ? "bg-amber-700 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div
                      style={{ backgroundColor: player.color }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-slate-950 text-sm shadow"
                    >
                      {player.name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-base text-white">{player.name}</div>
                      <div className="text-xs text-slate-400">
                        وصل إلى المربع #{player.position}
                      </div>
                    </div>
                  </div>

                  <div className="text-left font-black text-xl text-amber-400 flex items-center gap-1.5">
                    <span>{player.coins}</span>
                    <Coins className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MVP Titles Awards */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-black mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" />
            أوسمة وجوائز السهرة الشرفية
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {richest && (
              <div className="bg-slate-950/70 border border-amber-500/30 rounded-2xl p-4 text-center">
                <span className="text-2xl block mb-1">💰</span>
                <span className="text-xs text-amber-400 font-bold block">وزير المالية</span>
                <span className="font-black text-white text-base block mt-1">{richest.name}</span>
                <span className="text-xs text-slate-400">{richest.coins} {gameState.currencyName}</span>
              </div>
            )}

            {biggestThief && (biggestThief.stats?.coinsStolen || 0) > 0 && (
              <div className="bg-slate-950/70 border border-rose-500/30 rounded-2xl p-4 text-center">
                <span className="text-2xl block mb-1">🦊</span>
                <span className="text-xs text-rose-400 font-bold block">الثعلب الماكر</span>
                <span className="font-black text-white text-base block mt-1">{biggestThief.name}</span>
                <span className="text-xs text-slate-400">سرق {biggestThief.stats.coinsStolen} {gameState.currencyName}</span>
              </div>
            )}

            {shieldMaster && (shieldMaster.stats?.shieldsTriggered || 0) > 0 && (
              <div className="bg-slate-950/70 border border-cyan-500/30 rounded-2xl p-4 text-center">
                <span className="text-2xl block mb-1">🛡️</span>
                <span className="text-xs text-cyan-400 font-bold block">الحصن المنيع</span>
                <span className="font-black text-white text-base block mt-1">{shieldMaster.name}</span>
                <span className="text-xs text-slate-400">صد {shieldMaster.stats.shieldsTriggered} هجمات</span>
              </div>
            )}

            {mostBetrayed && maxBetrayals > 0 && (
              <div className="bg-slate-950/70 border border-indigo-500/30 rounded-2xl p-4 text-center">
                <span className="text-2xl block mb-1">🎯</span>
                <span className="text-xs text-indigo-400 font-bold block">الضحية المفضلة</span>
                <span className="font-black text-white text-base block mt-1">{mostBetrayed.name}</span>
                <span className="text-xs text-slate-400">تعرض للغدر {maxBetrayals} مرات</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="w-full max-w-md flex flex-col gap-3 my-4">
        <button
          onClick={() => router.push("/")}
          className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
        >
          <Home className="w-5 h-5" />
          <span>العودة للرئيسية</span>
        </button>
      </footer>
    </div>
  );
}

function RoomPageContent({ roomId }: { roomId: string }) {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role")?.toUpperCase();
  const role: "HOST" | "PLAYER" = roleParam === "PLAYER" ? "PLAYER" : "HOST";

  const {
    playerId,
    gameState,
    lastAnimation,
    errorToast,
    sendAction,
    isGeneratingAI
  } = useGameRoom(roomId, role);

  if (!roomId) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-rose-400">رمز الغرفة غير موجود.</p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">
            {role === "HOST" ? "🎲" : "📱"}
          </div>
          <p className="text-slate-300 text-lg">
            {role === "HOST" ? "جاري تجهيز لوحة اللعبة..." : `جاري الاتصال بالغرفة ${roomId}...`}
          </p>
        </div>
      </div>
    );
  }

  // 1. GAME_OVER Phase: render game over summary screen
  if (gameState.phase === "GAME_OVER") {
    return (
      <GameOverScreen
        gameState={gameState}
        lastAnimation={lastAnimation}
        role={role}
        playerId={playerId}
      />
    );
  }

  // 2. HOST Role: renders SharedBoardScreen
  if (role === "HOST") {
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

  // 3. PLAYER Role: renders PlayerControllerScreen
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

export default function RoomPage({ params }: RoomPageProps) {
  const { id: roomId } = use(params);

  return (
    <Suspense
      fallback={
        <div dir="rtl" className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-spin">🎲</div>
            <p className="text-slate-400">جاري التحميل...</p>
          </div>
        </div>
      }
    >
      <RoomPageContent roomId={roomId} />
    </Suspense>
  );
}
