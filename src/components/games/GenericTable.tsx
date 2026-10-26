"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Coins, Dices, Flag, Menu, QrCode, Sparkles, Vote } from "lucide-react";
import type { GameTableProps } from "./types";
import { getPlayerInitial, getPlayerInitials } from "@/utils/playerDisplay";
import { diceValuesFromState } from "./types";
import RealisticDice3D from "../common/RealisticDice3D";
import GameRulesSheet from "./GameRulesSheet";
import { TableStat, TurnBanner } from "./shared";

function getTileGridPosition(index: number): { row: number; col: number } {
  if (index >= 0 && index <= 6) return { row: 1, col: index + 1 };
  if (index >= 7 && index <= 9) return { row: index - 5, col: 7 };
  if (index >= 10 && index <= 16) return { row: 5, col: 17 - index };
  return { row: 21 - index, col: 1 };
}

const TILE_STYLE: Record<string, { border: string; bg: string; icon: React.ReactNode; badge: string }> = {
  START: {
    border: "border-emerald-400/70",
    bg: "bg-emerald-950/70",
    icon: <Flag className="w-4 h-4 text-emerald-400" />,
    badge: "البداية"
  },
  RESOURCE: {
    border: "border-amber-400/60",
    bg: "bg-amber-950/60",
    icon: <Coins className="w-4 h-4 text-amber-400" />,
    badge: "مكسب"
  },
  HAZARD: {
    border: "border-rose-500/60",
    bg: "bg-rose-950/60",
    icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
    badge: "فخ"
  },
  SECRET_CARD: {
    border: "border-indigo-400/60",
    bg: "bg-indigo-950/60",
    icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
    badge: "بطاقة"
  },
  DRAMA_EVENT: {
    border: "border-purple-400/60",
    bg: "bg-purple-950/60",
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    badge: "دراما"
  },
  GLOBAL_VOTE: {
    border: "border-cyan-400/60",
    bg: "bg-cyan-950/60",
    icon: <Vote className="w-4 h-4 text-cyan-400" />,
    badge: "تصويت"
  }
};

export default function GenericTable({
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
  const diceValues = displayedDice ? [displayedDice] : diceValuesFromState(gameState);
  const tiles = gameState.tiles.slice(0, 20);

  return (
    <div
      dir="rtl"
      className="relative w-full h-full flex flex-col text-white overflow-hidden select-none"
      style={{ background: "radial-gradient(ellipse at 50% 40%, #16263f 0%, #0a1322 50%, #04070d 100%)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.05]" />

      <header className="relative z-30 flex items-center justify-between gap-2 px-3 md:px-5 pt-2">
        <div className="flex items-center gap-2">
          <button onClick={onOpenMenu} className="p-2 rounded-full bg-black/45 border border-white/15" title="القائمة">
            <Menu className="w-4 h-4" />
          </button>
          <TableStat label="الجولة" value={gameState.currentRound || 1} accent="text-sky-300" />
          <TableStat label="مربعات" value={tiles.length} />
        </div>
        <div className="text-center leading-tight">
          <h1 className="text-sm md:text-base font-black">{gameState.themeTitle || "استوديو اللوحة المخصصة"}</h1>
          <p className="text-[10px] text-sky-300/60 font-bold">تجربة مصممة خصيصاً لهذه الجلسة ✨</p>
        </div>
        <div className="flex items-center gap-2">
          <GameRulesSheet rulebookId="GENERIC" variant="ghost" label="قوانين" />
          <button
            onClick={onOpenInvite}
            className="px-2.5 py-1 rounded-full bg-black/45 border border-sky-400/30 text-sky-300 text-[11px] font-mono font-bold flex items-center gap-1"
          >
            <QrCode className="w-3.5 h-3.5" />
            {gameState.roomId}
          </button>
        </div>
      </header>

      <main className="relative z-20 flex-1 min-h-0 grid grid-cols-7 grid-rows-5 gap-2 p-2 md:p-3">
        {tiles.map((tile) => {
          const pos = getTileGridPosition(tile.index);
          const style = TILE_STYLE[tile.tileType] || TILE_STYLE.RESOURCE;
          const playersHere = Object.values(gameState.players).filter(
            (player) => (visualPositions[player.id] ?? player.position) === tile.index
          );
          const owner = tile.ownerId ? gameState.players[tile.ownerId] : null;

          return (
            <div
              key={tile.index}
              style={{ gridRow: pos.row, gridColumn: pos.col, borderColor: owner?.color }}
              className={`relative rounded-2xl border-2 ${style.bg} ${owner ? "" : style.border} p-1.5 flex flex-col justify-between overflow-hidden`}
            >
              {owner && <span style={{ backgroundColor: owner.color }} className="absolute top-0 inset-x-0 h-1" />}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/40 text-white/60">
                  #{tile.index} · {style.badge}
                </span>
                {style.icon}
              </div>
              <div className="text-center my-auto">
                <h3 className="text-[11px] font-black leading-tight line-clamp-2">{tile.name}</h3>
                {tile.price !== undefined && (
                  <span className="text-[9px] font-bold text-amber-300">🏷️ {tile.price}</span>
                )}
                {tile.armies !== undefined && (
                  <span className="text-[9px] font-bold text-cyan-300 block">🛡️ {tile.armies}</span>
                )}
                {tile.jumpToIndex !== undefined && (
                  <span className={`text-[9px] font-bold ${tile.jumpToIndex > tile.index ? "text-emerald-300" : "text-rose-300"}`}>
                    {tile.jumpToIndex > tile.index ? "🪜" : "🐍"} {tile.jumpToIndex}
                  </span>
                )}
              </div>
              <div className="h-5 flex items-center justify-center gap-1">
                {playersHere.map((player) => (
                  <motion.span
                    key={player.id}
                    layoutId={`generic-token-${player.id}`}
                    style={{ backgroundColor: player.color }}
                    className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px] font-black text-slate-950"
                  >
                    {getPlayerInitial(player.name)}
                  </motion.span>
                ))}
              </div>
            </div>
          );
        })}

        <div
          style={{ gridColumn: "2 / span 5", gridRow: "2 / span 3" }}
          className="rounded-3xl border border-sky-500/30 bg-slate-950/70 backdrop-blur-xl flex flex-col items-center justify-center gap-2 p-4"
        >
          <RealisticDice3D values={diceValues} isRolling={isRollingDice} size="lg" showTray />
          <p className="text-[11px] font-bold text-white/60 text-center max-w-xs">
            {lastAnimation?.messageAr || "الحركة والقرارات من جوال اللاعب."}
          </p>
          <div className="flex gap-1.5">
            {Object.values(gameState.players).map((player) => (
              <span
                key={player.id}
                style={{ backgroundColor: player.color }}
                className="w-6 h-6 rounded-full border border-white/70 flex items-center justify-center text-[9px] text-slate-950 font-black"
              >
                {player.coins}
              </span>
            ))}
          </div>
        </div>
      </main>

      <footer className="relative z-20 flex items-center justify-between gap-2 px-3 md:px-5 pb-2">
        <span className="text-[10px] font-bold text-white/40">
          {isSpectator ? "وضع المتفرج" : "استوديو مخصص"}
        </span>
        <TurnBanner name={activePlayer?.name} color={activePlayer?.color} text="دور" />
        <span className="hidden sm:flex items-center gap-1 text-[10px] text-white/35 font-bold">
          <Dices className="w-3 h-3" /> {gameState.currencyName}
        </span>
      </footer>
    </div>
  );
}
