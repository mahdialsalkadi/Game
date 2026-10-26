"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronsDown, ChevronsUp, Crown, Dices, Menu, QrCode } from "lucide-react";
import type { GameTableProps } from "./types";
import SnakesLaddersBoardView from "../snakes/SnakesLaddersBoardView";
import RealisticDice3D from "../common/RealisticDice3D";
import GameRulesSheet from "./GameRulesSheet";
import { TableStat, TurnBanner } from "./shared";

export default function SnakesTable({
  gameState,
  lastAnimation,
  visualPositions,
  displayedDice,
  isRollingDice,
  isSpectator,
  onOpenInvite,
  onOpenMenu
}: GameTableProps) {
  const activePlayerId = gameState.turnOrder[gameState.currentTurnIndex];
  const activePlayer = gameState.players[activePlayerId];
  const players = Object.values(gameState.players);
  const ladders = gameState.tiles.filter((tile) => tile.jumpToIndex !== undefined && tile.jumpToIndex > tile.index);
  const snakes = gameState.tiles.filter((tile) => tile.jumpToIndex !== undefined && tile.jumpToIndex < tile.index);
  const leader = [...players].sort((a, b) => (visualPositions[b.id] ?? b.position) - (visualPositions[a.id] ?? a.position))[0];

  return (
    <div
      dir="rtl"
      className="relative w-full h-full flex flex-col text-white overflow-hidden select-none"
      style={{ background: "radial-gradient(circle at 50% 40%, #2a1546 0%, #150a26 48%, #07030d 100%)" }}
    >
      {/* نباتات الغابة */}
      <div className="pointer-events-none absolute -top-16 right-10 w-64 h-80 bg-gradient-to-b from-emerald-500/15 to-transparent blur-[70px] rotate-12" />
      <div className="pointer-events-none absolute -top-16 left-10 w-64 h-80 bg-gradient-to-b from-fuchsia-500/15 to-transparent blur-[70px] -rotate-12" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:30px_30px] opacity-[0.05]" />

      <header className="relative z-30 flex items-center justify-between gap-2 px-3 md:px-5 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMenu}
            className="p-2 rounded-full bg-black/45 hover:bg-black/65 border border-white/15 backdrop-blur-md"
            title="القائمة"
          >
            <Menu className="w-4 h-4" />
          </button>
          <TableStat label="رمية" value={displayedDice ?? "-"} accent="text-purple-300" />
          <TableStat label="سلالم" value={ladders.length} accent="text-emerald-300" />
          <TableStat label="ثعابين" value={snakes.length} accent="text-rose-300" />
        </div>

        <div className="text-center leading-tight">
          <h1 className="text-sm md:text-base font-black tracking-wide flex items-center justify-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-300" />
            {gameState.themeTitle || "السلم والثعبان ١٠٠"}
          </h1>
          <p className="text-[10px] text-white/40 font-bold">شبكة ١٠٠ مربع · أول من يبلغ القمة</p>
        </div>

        <div className="flex items-center gap-2">
          <GameRulesSheet rulebookId="SNAKES_AND_LADDERS" variant="ghost" label="قوانين" />
          <button
            onClick={onOpenInvite}
            className="px-2.5 py-1 rounded-full bg-black/45 border border-purple-400/30 text-purple-300 hover:bg-black/65 text-[11px] font-mono font-bold flex items-center gap-1"
          >
            <QrCode className="w-3.5 h-3.5" />
            {gameState.roomId}
          </button>
        </div>
      </header>

      <div className="relative z-20 flex-1 min-h-0 flex items-center justify-center gap-3 px-2 md:px-4 py-1">
        {/* سلالم وثعابين */}
        <aside className="hidden xl:flex w-52 flex-col gap-2">
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-950/25 p-2.5">
            <div className="text-[10px] font-black text-emerald-300 mb-1 flex items-center gap-1">
              <ChevronsUp className="w-3.5 h-3.5" /> السلالم الصاعدة
            </div>
            <div className="flex flex-wrap gap-1">
              {ladders.map((tile) => (
                <span key={tile.index} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30">
                  {tile.index} → {tile.jumpToIndex}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-rose-400/25 bg-rose-950/25 p-2.5">
            <div className="text-[10px] font-black text-rose-300 mb-1 flex items-center gap-1">
              <ChevronsDown className="w-3.5 h-3.5" /> الثعابين الغادرة
            </div>
            <div className="flex flex-wrap gap-1">
              {snakes.map((tile) => (
                <span key={tile.index} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-400/30">
                  {tile.index} → {tile.jumpToIndex}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-2.5 text-[10px] leading-5 text-white/60">
            راجع شريط القوانين لمعرفة قاعدة الوصول الدقيق للمربع ١٠٠.
          </div>
        </aside>

        <main className="flex-1 min-h-0 flex items-center justify-center">
          <div className="rounded-[26px] p-[3px] bg-gradient-to-br from-[#b78b3d] via-[#4a2f10] to-[#d9b25f] shadow-[0_25px_70px_rgba(0,0,0,0.85)]">
            <div className="rounded-[23px] bg-[#0a0610] p-1.5">
              <SnakesLaddersBoardView
                gameState={gameState}
                visualPositions={visualPositions}
                activePlayerId={activePlayerId}
                isRollingDice={isRollingDice}
                displayedDice={displayedDice}
              />
            </div>
          </div>
        </main>

        <aside className="hidden md:flex w-44 flex-col gap-2">
          <div className="rounded-2xl border border-purple-400/25 bg-black/40 p-2 flex flex-col items-center gap-1">
            <span className="text-[10px] font-black text-white/50">النرد</span>
            <RealisticDice3D
              values={displayedDice ? [displayedDice] : [1]}
              isRolling={isRollingDice}
              size="md"
              showTray={false}
            />
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/35 p-2.5">
            <div className="text-[10px] font-black text-white/50 mb-1">آخر حدث</div>
            <p className="text-[11px] leading-5 text-white/75 font-bold">
              {lastAnimation?.messageAr || "ارمِ النرد من جوالك لتتحرك."}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-400/25 bg-amber-950/20 p-2.5">
            <div className="text-[10px] font-black text-amber-300 mb-1">المتصدر</div>
            <div className="text-[11px] font-black flex items-center gap-1.5">
              <span style={{ backgroundColor: leader?.color }} className="w-2.5 h-2.5 rounded-full" />
              {leader?.name || "—"}
              <span className="text-amber-300">#{visualPositions[leader?.id || ""] ?? leader?.position ?? 0}</span>
            </div>
          </div>
        </aside>
      </div>

      <footer className="relative z-20 flex items-center justify-between gap-2 px-3 md:px-5 pb-2">
        <div className="flex flex-wrap gap-1.5">
          {players.map((player) => (
            <span
              key={player.id}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/45 border border-white/10 text-[10px] font-black"
            >
              <span style={{ backgroundColor: player.color }} className="w-2 h-2 rounded-full" />
              {visualPositions[player.id] ?? player.position}
            </span>
          ))}
        </div>
        <TurnBanner name={activePlayer?.name} color={activePlayer?.color} text="دور" />
        <span className="hidden sm:flex items-center gap-1 text-[10px] text-white/35 font-bold">
          <Dices className="w-3 h-3 text-purple-300" />
          {isSpectator ? "وضع المتفرج" : "نرد فيزيائي مع هابتكس من الجوال"}
        </span>
      </footer>
    </div>
  );
}
