"use client";

import React from "react";
import { motion } from "framer-motion";
import { Crown, Menu, QrCode, Shield, Swords } from "lucide-react";
import type { GameTableProps } from "./types";
import GameRulesSheet from "./GameRulesSheet";
import { PlayerPill, TurnBanner } from "./shared";

const SIZE = 8;

export default function CheckersTable({
  gameState,
  isSpectator,
  onOpenInvite,
  onOpenMenu
}: GameTableProps) {
  const activePlayerId = gameState.turnOrder[gameState.currentTurnIndex];
  const activePlayer = gameState.players[activePlayerId];
  const players = Object.values(gameState.players);
  const state = gameState.checkersState;
  const board = state?.board || [];
  const pending = state?.pendingCapture;

  return (
    <div
      dir="rtl"
      className="relative w-full h-full flex flex-col text-amber-50 overflow-hidden select-none"
      style={{
        background:
          "radial-gradient(ellipse at 50% 32%, #3b2412 0%, #1c1108 48%, #070402 100%)"
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:34px_34px] opacity-[0.05]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />

      <header className="relative z-30 flex items-center justify-between gap-2 px-3 md:px-5 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMenu}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 border border-white/15 backdrop-blur-md"
            title="القائمة"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-amber-400/25 text-[11px] font-black text-amber-200">
            <Swords className="w-3.5 h-3.5" />
            الضامة الكلاسيكية
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 border border-white/10 text-[10px] font-bold text-white/60">
            جولة {gameState.currentRound || 1}
          </div>
        </div>

        <div className="text-center leading-tight">
          <h1 className="text-sm md:text-base font-black tracking-wide text-amber-100">
            {gameState.themeTitle || "الضامة — صراع المربعات"}
          </h1>
          <p className="text-[10px] text-amber-200/40 font-bold">
            الأكل إجباري · التاج يمنح حركة في كل الاتجاهات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GameRulesSheet rulebookId="CHECKERS" variant="ghost" label="قوانين" />
          <button
            onClick={onOpenInvite}
            className="px-2.5 py-1 rounded-full bg-black/50 border border-amber-400/30 text-amber-200 hover:bg-black/70 text-[11px] font-mono font-bold flex items-center gap-1"
          >
            <QrCode className="w-3.5 h-3.5" />
            {gameState.roomId}
          </button>
        </div>
      </header>

      <main className="relative z-20 flex-1 min-h-0 flex items-center justify-center gap-4 px-3 md:px-6 py-2">
        <aside className="hidden lg:flex w-48 shrink-0 flex-col gap-2 self-center">
          <div className="text-[10px] font-black text-amber-300/80 tracking-widest px-1">
            الجيوش على الرقعة
          </div>
          {players.map((player) => {
            const pieces = board.reduce(
              (total, row) =>
                total + row.filter((piece) => piece?.playerId === player.id).length,
              0
            );
            const kings = board.reduce(
              (total, row) =>
                total +
                row.filter((piece) => piece?.playerId === player.id && piece.king)
                  .length,
              0
            );
            return (
              <div key={player.id} className="space-y-1.5">
                <PlayerPill
                  player={player}
                  isActive={player.id === activePlayerId}
                  trailing={`${pieces} قطعة · ${kings} ملك`}
                />
              </div>
            );
          })}

          {pending && (
            <div className="rounded-2xl border border-rose-400/40 bg-rose-950/40 p-2.5 text-[10px] font-bold text-rose-200 leading-5">
              ⚡ سلسلة أكل نشطة! على {gameState.players[pending.playerId]?.name || "اللاعب"}{" "}
              متابعة القفز بالقطعة نفسها.
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-black/35 p-2.5 text-[10px] leading-5 text-white/55">
            القطعة التي تبلغ آخر صف تصبح ملكاً 👑 وتتحرك للأمام والخلف.
          </div>
        </aside>

        <div className="relative aspect-square w-full max-w-[min(80vh,720px)] rounded-2xl border-[10px] border-[#2a1609] shadow-[0_35px_90px_rgba(0,0,0,0.9),inset_0_2px_3px_rgba(255,205,150,0.2)] overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
            {Array.from({ length: SIZE }).map((_, row) =>
              Array.from({ length: SIZE }).map((__, col) => {
                const dark = (row + col) % 2 === 1;
                return (
                  <div
                    key={`${row}:${col}`}
                    className={`relative flex items-center justify-center ${
                      dark ? "bg-[#4a2a12]" : "bg-[#e7d3a8]"
                    }`}
                  >
                    {dark && (
                      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent_65%)]" />
                    )}
                    {(() => {
                      const piece = board[row]?.[col];
                      if (!piece) return null;
                      const owner = gameState.players[piece.playerId];
                      const isKing = piece.king;
                      const isLastFrom =
                        state?.lastMove?.from.row === row &&
                        state?.lastMove?.from.col === col;
                      const isLastTo =
                        state?.lastMove?.to.row === row &&
                        state?.lastMove?.to.col === col;
                      const isPending = pending?.row === row && pending?.col === col;

                      return (
                        <motion.div
                          layout
                          key={`${piece.playerId}-${row}-${col}`}
                          initial={{ scale: 0.55, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 360, damping: 24 }}
                          className={`relative w-[78%] h-[78%] rounded-full border-2 flex items-center justify-center ${
                            isPending
                              ? "ring-4 ring-rose-400 ring-offset-1 ring-offset-[#4a2a12] animate-pulse"
                              : isLastTo
                              ? "ring-2 ring-amber-300"
                              : ""
                          } ${isLastFrom ? "opacity-40" : ""}`}
                          style={{
                            backgroundColor: owner?.color || "#f59e0b",
                            borderColor: isKing ? "#FDE68A" : "rgba(255,255,255,0.72)",
                            backgroundImage: `radial-gradient(circle at 32% 26%, #ffffff 0%, ${
                              owner?.color || "#f59e0b"
                            } 48%, #120a04 100%)`,
                            boxShadow: `0 5px 10px rgba(0,0,0,0.6), inset 0 -3px 6px rgba(0,0,0,0.4), 0 0 14px ${owner?.color || "#f59e0b"}44`
                          }}
                        >
                          <span className="absolute inset-[18%] rounded-full border border-white/25" />
                          {isKing && (
                            <Crown className="w-1/2 h-1/2 text-amber-200 drop-shadow-[0_0_6px_rgba(251,191,36,0.80)]" />
                          )}
                        </motion.div>
                      );
                    })()}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <aside className="hidden xl:flex w-44 shrink-0 flex-col gap-2 self-center">
          <div className="rounded-2xl border border-amber-400/25 bg-black/40 p-3">
            <div className="text-[10px] font-black text-amber-300 mb-1.5">آخر حركة</div>
            {state?.lastMove ? (
              <p className="text-[11px] font-bold text-white/75 leading-5">
                {gameState.players[state.lastMove.playerId]?.name || "لاعب"} حرّك قطعة
                {state.lastMove.captured ? " وأكل قطعة خصم ⚔️" : " على الرقعة"}
                {state.lastMove.promoted ? " وتوّجها ملكاً 👑" : ""}
              </p>
            ) : (
              <p className="text-[10px] text-white/40">ابدأ بتحريك قطعة من الصف الأمامي.</p>
            )}
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/35 p-2.5 text-[10px] leading-5 text-white/50">
            <Shield className="w-3.5 h-3.5 text-amber-300 mb-1" />
            احمِ صفك الخلفي، ولا تفتح طريقاً لترقية قطع الخصم.
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
          {isSpectator ? "وضع المتفرج" : "التحريك من جوال اللاعب · الرقعة للعرض"}
        </span>
      </footer>
    </div>
  );
}
