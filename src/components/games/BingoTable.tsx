"use client";

import React from "react";
import { motion } from "framer-motion";
import { Menu, QrCode, Sparkles, Star, Trophy } from "lucide-react";
import type { GameTableProps } from "./types";
import GameRulesSheet from "./GameRulesSheet";
import { PlayerPill, TurnBanner } from "./shared";
import { bingoColumnLetter } from "@/game/bingoEngine";

const LETTERS = ["B", "I", "N", "G", "O"];

function ballLetter(number: number): string {
  return bingoColumnLetter(Math.min(4, Math.floor((number - 1) / 15)));
}

export default function BingoTable({
  gameState,
  isSpectator,
  onOpenInvite,
  onOpenMenu
}: GameTableProps) {
  const activePlayerId = gameState.turnOrder[gameState.currentTurnIndex];
  const activePlayer = gameState.players[activePlayerId];
  const players = Object.values(gameState.players);
  const state = gameState.bingoState;
  const lastCalled = state?.lastCalled;
  const recent = (state?.calledNumbers || []).slice(-10).reverse();

  return (
    <div
      dir="rtl"
      className="relative w-full h-full flex flex-col text-white overflow-hidden select-none"
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, #4a0d3a 0%, #24051f 48%, #09020a 100%)"
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#f472b6_1px,transparent_1px)] [background-size:30px_30px] opacity-[0.05]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(0,0,0,0.85)_100%)]" />

      <header className="relative z-30 flex items-center justify-between gap-2 px-3 md:px-5 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMenu}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 border border-white/15 backdrop-blur-md"
            title="القائمة"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-pink-400/25 text-[11px] font-black text-pink-200">
            <Sparkles className="w-3.5 h-3.5" />
            {state?.calledNumbers.length || 0} / 75 كرة
          </div>
        </div>

        <div className="text-center leading-tight">
          <h1 className="text-sm md:text-base font-black tracking-wide text-pink-100">
            {gameState.themeTitle || "بينغو السهرة"}
          </h1>
          <p className="text-[10px] text-pink-200/40 font-bold">
            أول خط أفقي أو عمودي أو قطري يخطف الفوز
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GameRulesSheet rulebookId="BINGO" variant="ghost" label="قوانين" />
          <button
            onClick={onOpenInvite}
            className="px-2.5 py-1 rounded-full bg-black/50 border border-pink-400/30 text-pink-200 hover:bg-black/70 text-[11px] font-mono font-bold flex items-center gap-1"
          >
            <QrCode className="w-3.5 h-3.5" />
            {gameState.roomId}
          </button>
        </div>
      </header>

      <main className="relative z-20 flex-1 min-h-0 flex gap-3 px-2 md:px-4 py-2">
        <aside className="hidden lg:flex w-52 flex-col gap-2">
          <div className="text-[10px] font-black text-pink-300/80 tracking-widest px-1">
            بطاقات اللاعبين
          </div>
          {players.map((player) => {
            const card = state?.cards[player.id];
            return (
              <div
                key={player.id}
                className={`rounded-2xl border p-2 transition ${
                  player.id === activePlayerId
                    ? "border-pink-400/60 bg-pink-950/30"
                    : "border-white/10 bg-black/35"
                }`}
              >
                <PlayerPill
                  player={player}
                  isActive={player.id === activePlayerId}
                  compact
                  trailing={`${card?.lines || 0} خط · ${card?.markedCount || 0}/25`}
                />
              </div>
            );
          })}
        </aside>

        <section className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative shrink-0">
              <motion.div
                key={lastCalled || "waiting"}
                initial={{ scale: 0.5, rotate: -18, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
                className="w-28 h-28 md:w-36 md:h-36 rounded-full flex flex-col items-center justify-center border-4 border-white/85 relative"
                style={{
                  background:
                    "radial-gradient(circle at 32% 26%, #ffffff 0%, #fbcfe8 40%, #db2777 100%)",
                  boxShadow:
                    "0 20px 45px rgba(0,0,0,0.6), inset 0 -8px 16px rgba(131,24,67,0.35)"
                }}
              >
                <span className="text-[11px] font-black tracking-[0.35em] text-pink-900/70">
                  {lastCalled ? ballLetter(lastCalled) : "..."}
                </span>
                <span className="text-4xl md:text-5xl font-black text-pink-950 leading-none">
                  {lastCalled ?? "؟"}
                </span>
                <span className="absolute inset-3 rounded-full border border-pink-900/20" />
              </motion.div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black text-white/45 mb-1.5">
                آخر الأرقام المسحوبة
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recent.length === 0 && (
                  <span className="text-[11px] text-white/40">لم تُسحب أي كرة بعد.</span>
                )}
                {recent.map((number, index) => (
                  <span
                    key={number}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-black border ${
                      index === 0
                        ? "bg-pink-400 text-slate-950 border-white shadow-lg"
                        : "bg-black/45 text-pink-100 border-white/15"
                    }`}
                  >
                    {number}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1 mt-2 max-w-[260px]">
                {LETTERS.map((letter) => (
                  <span
                    key={letter}
                    className="text-center text-[10px] font-black text-pink-300/70"
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 overflow-y-auto content-start">
            {players.map((player) => {
              const card = state?.cards[player.id];
              const isWinner = state?.winnerId === player.id;
              return (
                <div
                  key={player.id}
                  className={`rounded-2xl border p-2 transition ${
                    isWinner
                      ? "border-amber-300 bg-amber-950/40 shadow-[0_0_25px_rgba(251,191,36,0.35)]"
                      : player.id === activePlayerId
                      ? "border-pink-400/50 bg-pink-950/25"
                      : "border-white/10 bg-black/35"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-black truncate flex items-center gap-1 min-w-0" title={player.name}>
                      <span
                        style={{ backgroundColor: player.color }}
                        className="w-2 h-2 rounded-full shrink-0"
                      />
                      <span className="truncate">{player.name}</span>
                    </span>
                    {isWinner ? (
                      <Trophy className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    ) : (
                      <span className="text-[9px] font-black text-pink-200/60 shrink-0">
                        {card?.lines || 0} خط
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-5 gap-[2px]">
                    {card?.grid.map((row, rowIndex) =>
                      row.map((number, colIndex) => {
                        const marked = card.marked[rowIndex][colIndex];
                        return (
                          <div
                            key={`${rowIndex}:${colIndex}`}
                            className={`aspect-square rounded-[3px] flex items-center justify-center text-[8px] font-black ${
                              number === 0
                                ? "bg-pink-500/30 text-pink-200"
                                : marked
                                ? "bg-pink-500 text-white shadow-inner"
                                : "bg-white/[0.06] text-white/35"
                            }`}
                          >
                            {number === 0 ? <Star className="w-2.5 h-2.5" /> : number}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="relative z-20 flex items-center justify-between gap-2 px-3 md:px-5 pb-2">
        <div className="flex flex-wrap gap-1.5">
          {players.map((player) => (
            <span
              key={player.id}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/45 border border-white/10 text-[10px] font-black max-w-[150px]"
            >
              <span
                style={{ backgroundColor: player.color }}
                className="w-2 h-2 rounded-full shrink-0"
              />
              <span className="truncate" title={player.name}>{player.name}</span>
              <span className="text-pink-200/60 shrink-0">
                {state?.cards[player.id]?.lines || 0} خط
              </span>
            </span>
          ))}
        </div>
        <TurnBanner name={activePlayer?.name} color={activePlayer?.color} text="دور السحب" />
        <span className="hidden sm:block text-[10px] text-white/35 font-bold">
          {isSpectator ? "وضع المتفرج" : "السحب من جوال اللاعب · البطاقات للعرض"}
        </span>
      </footer>
    </div>
  );
}
