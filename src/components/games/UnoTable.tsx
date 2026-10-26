"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, Layers, Menu, QrCode, Sparkles } from "lucide-react";
import type { GameTableProps } from "./types";
import UnoCardTableView from "../cards/UnoCardTableView";
import GameRulesSheet from "./GameRulesSheet";
import { TableStat, TurnBanner } from "./shared";
import { getPlayerInitials } from "@/utils/playerDisplay";

export default function UnoTable({
  gameState,
  sendAction,
  isSpectator,
  onOpenInvite,
  onOpenMenu
}: GameTableProps) {
  const uno = gameState.unoState as any;
  const activePlayerId = gameState.turnOrder[gameState.currentTurnIndex];
  const activePlayer = gameState.players[activePlayerId];
  const players = Object.values(gameState.players);
  const colorHex: Record<string, string> = {
    RED: "#EF4444",
    BLUE: "#3B82F6",
    GREEN: "#22C55E",
    YELLOW: "#EAB308"
  };
  const activeColor = uno?.activeColor as string | undefined;

  return (
    <div
      dir="rtl"
      className="relative w-full h-full flex flex-col text-white overflow-hidden select-none"
      style={{ background: "radial-gradient(ellipse at 50% 45%, #0f3b2c 0%, #082018 50%, #030b08 100%)" }}
    >
      {/* إضاءة كازينو + نسيج الجوخ */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(255,255,255,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[repeating-linear-gradient(45deg,#fff_0px,#fff_1px,transparent_1px,transparent_4px)]" />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full blur-[130px] transition-colors duration-700"
        style={{ backgroundColor: `${colorHex[activeColor || ""] || "#10b981"}22` }}
      />

      <header className="relative z-30 flex items-center justify-between gap-2 px-3 md:px-5 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMenu}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/15 backdrop-blur-md"
            title="القائمة"
          >
            <Menu className="w-4 h-4" />
          </button>
          <TableStat label="الكومة" value={uno?.deckCount ?? "-"} accent="text-emerald-300" />
          <TableStat
            label="اللون"
            value={
              activeColor ? (
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorHex[activeColor] }} />
                </span>
              ) : "-"
            }
          />
        </div>

        <div className="text-center leading-tight">
          <h1 className="text-sm md:text-base font-black tracking-wide flex items-center justify-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-300" />
            {gameState.themeTitle || "طاولة أونو"}
          </h1>
          <p className="text-[10px] text-white/40 font-bold">طاولة جوخ · أول من يفرغ يده يفوز</p>
        </div>

        <div className="flex items-center gap-2">
          <GameRulesSheet rulebookId="UNO" variant="ghost" label="قوانين" />
          <button
            onClick={onOpenInvite}
            className="px-2.5 py-1 rounded-full bg-black/40 border border-emerald-400/30 text-emerald-300 hover:bg-black/60 text-[11px] font-mono font-bold flex items-center gap-1"
          >
            <QrCode className="w-3.5 h-3.5" />
            {gameState.roomId}
          </button>
        </div>
      </header>

      {/* شرائط الخصوم حول الطاولة */}
      <div className="relative z-20 flex items-center justify-center gap-2 flex-wrap px-3 pt-2">
        {players.map((player) => {
          const count = uno?.playerCardCounts?.[player.id] ?? 0;
          const shouted = uno?.unoShouted?.[player.id];
          const isActive = player.id === activePlayerId;
          return (
            <motion.div
              layout
              key={player.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black transition ${
                isActive
                  ? "bg-white/15 border-white/40 shadow-[0_0_18px_rgba(255,255,255,0.15)]"
                  : "bg-black/35 border-white/10"
              }`}
            >
              <span
                style={{ backgroundColor: player.color }}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-slate-950"
              >
                {getPlayerInitials(player.name)}
              </span>
              <span className="max-w-[80px] truncate">{player.name}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-amber-300">{count} 🂠</span>
              {shouted && <span className="text-emerald-300">UNO!</span>}
            </motion.div>
          );
        })}
      </div>

      <main className="relative z-20 flex-1 min-h-0 flex items-center justify-center">
        <UnoCardTableView gameState={gameState} sendAction={sendAction} />
      </main>

      <footer className="relative z-20 flex items-center justify-between gap-2 px-3 md:px-5 pb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/50">
          <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-300" />
          {uno?.direction === -1 ? "عكس عقارب الساعة" : "مع عقارب الساعة"}
          {uno?.lastActionMessageAr && <span className="text-white/70">· {uno.lastActionMessageAr}</span>}
        </div>
        <TurnBanner name={activePlayer?.name} color={activePlayer?.color} text="دور" />
        <span className="hidden sm:flex items-center gap-1 text-[10px] text-white/35 font-bold">
          <Sparkles className="w-3 h-3 text-amber-300" />
          {isSpectator ? "وضع المتفرج" : "العب من جوالك · اصرخ أونو عند آخر ورقة"}
        </span>
      </footer>
    </div>
  );
}
