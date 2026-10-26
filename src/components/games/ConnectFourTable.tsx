"use client";

import React from "react";
import { motion } from "framer-motion";
import { Crown, Menu, QrCode, Sparkles } from "lucide-react";
import type { GameTableProps } from "./types";
import GameRulesSheet from "./GameRulesSheet";
import { PlayerPill, TurnBanner } from "./shared";

const COLUMNS = 7;
const ROWS = 6;
const CONNECT_FOUR_ACCENT = "#38BDF8";

export default function ConnectFourTable({
  gameState,
  isSpectator,
  onOpenInvite,
  onOpenMenu
}: GameTableProps) {
  const activePlayerId = gameState.turnOrder[gameState.currentTurnIndex];
  const activePlayer = gameState.players[activePlayerId];
  const players = Object.values(gameState.players);
  const state = gameState.connectFourState;
  const board = state?.board || [];
  const winning = new Set(
    (state?.winningCells || []).map((cell) => `${cell.row}:${cell.col}`)
  );

  return (
    <div
      dir="rtl"
      className="relative w-full h-full flex flex-col text-white overflow-hidden select-none"
      style={{
        background:
          "radial-gradient(ellipse at 50% 35%, #0b2a52 0%, #07152a 48%, #02060d 100%)"
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.05]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(0,0,0,0.82)_100%)]" />
      <div className="pointer-events-none absolute -top-24 left-1/3 w-[520px] h-[300px] bg-sky-500/15 blur-[120px]" />

      <header className="relative z-30 flex items-center justify-between gap-2 px-3 md:px-5 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMenu}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 border border-white/15 backdrop-blur-md"
            title="القائمة"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-sky-400/25 text-[11px] font-black text-sky-200">
            <span>🔴</span>
            <span>{gameState.currencyName || "قرص"}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 border border-white/10 text-[10px] font-bold text-white/60">
            {state?.moveCount || 0} حركة
          </div>
        </div>

        <div className="text-center leading-tight">
          <h1 className="text-sm md:text-base font-black tracking-wide flex items-center justify-center gap-1.5 text-sky-100">
            <Sparkles className="w-4 h-4 text-sky-400" />
            {gameState.themeTitle || "كونكت فور — أربعة على التوالي"}
          </h1>
          <p className="text-[10px] text-sky-200/40 font-bold">
            أربعة أقراص متصلة تحسم اللقب — أفقياً أو عمودياً أو قطرياً
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GameRulesSheet rulebookId="CONNECT_FOUR" variant="ghost" label="قوانين" />
          <button
            onClick={onOpenInvite}
            className="px-2.5 py-1 rounded-full bg-black/50 border border-sky-400/30 text-sky-300 hover:bg-black/70 text-[11px] font-mono font-bold flex items-center gap-1"
          >
            <QrCode className="w-3.5 h-3.5" />
            {gameState.roomId}
          </button>
        </div>
      </header>

      <main className="relative z-20 flex-1 min-h-0 flex items-center justify-center gap-4 px-3 md:px-6 py-2">
        <aside className="hidden lg:flex w-48 shrink-0 flex-col gap-2 self-center">
          <div className="text-[10px] font-black text-sky-300/80 tracking-widest px-1">
            لاعبو الطاولة
          </div>
          {players.map((player) => (
            <PlayerPill
              key={player.id}
              player={player}
              isActive={player.id === activePlayerId}
              trailing={state?.lastMove?.playerId === player.id ? "آخر قرص 🎯" : "بانتظار دوره"}
            />
          ))}
          <div className="mt-2 rounded-2xl border border-white/10 bg-black/35 p-2.5 text-[10px] leading-5 text-white/55">
            الأقراص تُسقط من جوال كل لاعب. راقب الخط القطري — أخطر خط في اللعبة.
          </div>
        </aside>

        <div
          className="relative aspect-[7/6] w-full max-w-[760px] rounded-[28px] p-2 md:p-3 border-2 border-sky-900/70 shadow-[0_30px_90px_rgba(0,0,0,0.85),inset_0_2px_3px_rgba(148,197,255,0.25)]"
          style={{
            background:
              "linear-gradient(160deg, #1e3a8a 0%, #0c1c3d 45%, #112c5c 100%)"
          }}
        >
          <div className="w-full h-full grid grid-cols-7 grid-rows-6 gap-1.5 md:gap-2.5 rounded-[20px] bg-[#071426]/85 p-1.5 md:p-2.5 shadow-inner">
            {Array.from({ length: ROWS }).map((_, row) =>
              Array.from({ length: COLUMNS }).map((__, col) => {
                const ownerId = board[row]?.[col] || null;
                const owner = ownerId ? gameState.players[ownerId] : null;
                const isWinning = winning.has(`${row}:${col}`);
                return (
                  <div
                    key={`${row}:${col}`}
                    className={`relative rounded-full flex items-center justify-center transition-all ${
                      isWinning
                        ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-[#071426] shadow-[0_0_22px_rgba(251,191,36,0.85)]"
                        : ""
                    }`}
                    style={{
                      background:
                        "radial-gradient(circle at 35% 28%, #0a2547 0%, #041020 62%, #020a13 100%)",
                      boxShadow:
                        "inset 0 5px 10px rgba(0,0,0,0.9), inset 0 -1px 1px rgba(125,211,252,0.12)"
                    }}
                  >
                    {owner ? (
                      <motion.div
                        initial={{ scale: 0.3, y: -60, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 380, damping: 24 }}
                        className="w-[86%] h-[86%] rounded-full border-2 border-white/70 relative"
                        style={{
                          background: `radial-gradient(circle at 32% 26%, #ffffff 0%, ${owner.color} 42%, #050b14 100%)`,
                          boxShadow: `0 0 18px ${owner.color}55, inset 0 -4px 8px rgba(0,0,0,0.45)`
                        }}
                      >
                        <span className="absolute inset-[22%] rounded-full border border-white/25" />
                        {isWinning && (
                          <span className="absolute -top-2 -left-2 text-amber-300">
                            <Crown className="w-5 h-5 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                          </span>
                        )}
                      </motion.div>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-white/[0.04]" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <aside className="hidden xl:flex w-44 shrink-0 flex-col gap-2 self-center">
          <div className="rounded-2xl border border-sky-400/25 bg-black/40 p-3">
            <div className="text-[10px] font-black text-sky-300 mb-1.5">آخر حركة</div>
            {state?.lastMove ? (
              <>
                <div
                  className="w-10 h-10 rounded-full mx-auto mb-2 border-2 border-white/70"
                  style={{
                    background: `radial-gradient(circle at 32% 26%, #ffffff 0%, ${
                      gameState.players[state.lastMove.playerId]?.color || CONNECT_FOUR_ACCENT
                    } 45%, #050b14 100%)`
                  }}
                />
                <p className="text-[11px] font-bold text-white/75 leading-5 text-center">
                  {gameState.players[state.lastMove.playerId]?.name || "لاعب"} أسقط قرصاً في
                  العمود {state.lastMove.col + 1}
                </p>
              </>
            ) : (
              <p className="text-[10px] text-white/40">لم يُسقط أول قرص بعد.</p>
            )}
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/35 p-2.5 text-[10px] leading-5 text-white/50">
            كل لاعب لديه لون قرص ثابت. البوت يفضّل المركز ويسدّ تهديداتك.
          </div>
        </aside>
      </main>

      <footer className="relative z-20 flex items-center justify-between gap-2 px-3 md:px-5 pb-2">
        <div className="flex flex-wrap gap-1.5">
          {players.map((player) => (
            <span
              key={player.id}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/45 border border-white/10 text-[10px] font-black max-w-[140px]"
            >
              <span
                style={{ backgroundColor: player.color }}
                className="w-2.5 h-2.5 rounded-full border border-white/50 shrink-0"
              />
              <span className="truncate">{player.name}</span>
            </span>
          ))}
        </div>
        <TurnBanner name={activePlayer?.name} color={activePlayer?.color} text="دور" />
        <span className="hidden sm:block text-[10px] text-white/35 font-bold">
          {isSpectator ? "وضع المتفرج" : "الإسقاط من جوال اللاعب · اللوحة للعرض"}
        </span>
      </footer>
    </div>
  );
}
