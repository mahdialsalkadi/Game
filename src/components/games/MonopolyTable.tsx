"use client";

import React from "react";
import { motion } from "framer-motion";
import { Building2, Coins, Menu, QrCode, Sparkles } from "lucide-react";
import type { GameTableProps } from "./types";
import { diceValuesFromState } from "./types";
import MonopolyBoardView from "../monopoly/MonopolyBoardView";
import WoodTabletopEnvironment from "../common/WoodTabletopEnvironment";
import RealisticDice3D from "../common/RealisticDice3D";
import GameRulesSheet from "./GameRulesSheet";
import { PlayerPill, TableStat, TurnBanner } from "./shared";
import type { ExtendedPlayerState } from "@/game/gameRoom";

export default function MonopolyTable({
  gameState,
  sendAction,
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
  const diceValues = displayedDice ? [displayedDice] : diceValuesFromState(gameState);
  const ownedProperties = gameState.tiles.filter((tile) => tile.ownerId);

  return (
    <div
      dir="rtl"
      className="relative w-full h-full flex flex-col text-white overflow-hidden select-none"
      style={{
        background:
          "radial-gradient(circle at 50% 40%, #123a2c 0%, #0a2018 45%, #050d0a 100%)"
      }}
    >
      {/* ضوء الثريا على طاولة الجوخ */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,215,140,0.16),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d4a355_1px,transparent_1px)] [background-size:26px_26px] opacity-[0.04]" />

      {/* الشريط العلوي */}
      <header className="relative z-30 flex items-center justify-between gap-2 px-3 md:px-5 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMenu}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 border border-white/15 backdrop-blur-md"
            title="القائمة"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-white/15 backdrop-blur-md text-[11px] font-bold">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{gameState.currencyName}</span>
          </div>
          <TableStat label="الجولة" value={gameState.currentRound || 1} accent="text-amber-300" />
        </div>

        <div className="flex items-center gap-2">
          <div className="text-center leading-tight">
            <h1 className="text-sm md:text-base font-black tracking-wide text-amber-100 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {gameState.themeTitle || "مونوبولي المجلس"}
            </h1>
            <p className="text-[10px] text-white/40 font-bold">طاولة العقارات · {ownedProperties.length} عقار مباع</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSpectator && (
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-[10px] font-black">
              متفرج
            </span>
          )}
          <GameRulesSheet rulebookId="MONOPOLY" variant="ghost" label="قوانين" />
          <button
            onClick={onOpenInvite}
            className="px-2.5 py-1 rounded-full bg-black/50 border border-amber-400/30 text-amber-300 hover:bg-black/70 text-[11px] font-mono font-bold flex items-center gap-1"
            title="دعوة الأصدقاء"
          >
            <QrCode className="w-3.5 h-3.5" />
            {gameState.roomId}
          </button>
        </div>
      </header>

      {/* جسم الطاولة */}
      <div className="relative z-20 flex-1 min-h-0 flex gap-2 md:gap-3 px-2 md:px-4 py-2">
        {/* مقاعد اللاعبين */}
        <aside className="hidden lg:flex w-52 flex-col gap-2">
          <div className="text-[10px] font-black text-amber-300/80 tracking-widest px-1">مقاعد اللاعبين</div>
          {players.map((player) => (
            <MonopolySeat
              key={player.id}
              player={player}
              isActive={player.id === activePlayerId}
              properties={gameState.tiles.filter((tile) => tile.ownerId === player.id).length}
              currency={gameState.currencyName}
            />
          ))}

          <div className="mt-auto rounded-2xl border border-white/10 bg-black/35 p-2.5">
            <div className="text-[10px] font-black text-white/50 mb-1">بنك الطاولة</div>
            <div className="grid grid-cols-3 gap-1.5">
              <TableStat label="بيوت" value={gameState.tiles.reduce((sum, t) => sum + (t.houses && t.houses < 5 ? t.houses : 0), 0)} accent="text-emerald-300" />
              <TableStat label="فنادق" value={gameState.tiles.filter((t) => t.houses === 5).length} accent="text-rose-300" />
              <TableStat label="مواقف" value={gameState.freeParkingJackpot || 100} accent="text-amber-300" />
            </div>
          </div>
        </aside>

        {/* اللوحة */}
        <main className="flex-1 min-h-0 flex items-center justify-center">
          <WoodTabletopEnvironment variant="darkOak" className="p-2 md:p-3">
            <MonopolyBoardView
              gameState={gameState}
              lastAnimation={lastAnimation}
              visualPositions={visualPositions}
              isRollingDice={isRollingDice}
              sendAction={sendAction}
              displayedDice={displayedDice}
              activePlayerId={activePlayerId}
            />
          </WoodTabletopEnvironment>
        </main>

        {/* نرد وحالة الدور */}
        <aside className="hidden md:flex w-44 xl:w-52 flex-col gap-2">
          <div className="rounded-2xl border border-amber-400/25 bg-black/40 p-2 flex flex-col items-center gap-1">
            <span className="text-[10px] font-black text-white/50">نرد الطاولة</span>
            <RealisticDice3D values={diceValues} isRolling={isRollingDice} size="md" showTray={false} />
            <span className="text-[10px] font-bold text-amber-200">
              {gameState.lastDiceRoll
                ? `المجموع ${gameState.lastDiceRoll.sum}${gameState.lastDiceRoll.isDoubles ? " · ثنائي!" : ""}`
                : "بانتظار الرمية"}
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/35 p-2.5 space-y-1.5">
            <div className="text-[10px] font-black text-white/50">آخر حدث</div>
            <p className="text-[11px] leading-5 text-white/75 font-bold min-h-[40px]">
              {lastAnimation?.messageAr ||
                lastAnimation?.tile?.name ||
                (activePlayer ? `دور ${activePlayer.name} — ارمِ النرد على جوالك.` : "بانتظار بدء الجولة")}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-950/25 p-2.5">
            <div className="text-[10px] font-black text-emerald-300 mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> دخل الطاولة
            </div>
            <div className="flex flex-wrap gap-1">
              {ownedProperties.slice(0, 12).map((tile) => {
                const owner = tile.ownerId ? gameState.players[tile.ownerId] : null;
                return (
                  <span
                    key={tile.index}
                    style={{ borderColor: owner?.color || "#64748b" }}
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-black/40 truncate max-w-[90px]"
                  >
                    {tile.name}
                  </span>
                );
              })}
              {ownedProperties.length === 0 && (
                <span className="text-[10px] text-white/40">لم يُبع أي عقار بعد.</span>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* الشريط السفلي */}
      <footer className="relative z-20 flex items-center justify-between gap-2 px-3 md:px-5 pb-2">
        <div className="flex flex-wrap gap-1.5">
          {players.slice(0, 4).map((player) => (
            <span
              key={player.id}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/45 border border-white/10 text-[10px] font-black"
            >
              <span style={{ backgroundColor: player.color }} className="w-2 h-2 rounded-full" />
              {player.coins}
            </span>
          ))}
        </div>
        <TurnBanner
          name={activePlayer?.name}
          color={activePlayer?.color}
          text={isSpectator ? "دور" : "دور"}
        />
        <span className="hidden sm:block text-[10px] text-white/35 font-bold">
          الشراء والبناء من جوال اللاعب · اللوحة للعرض
        </span>
      </footer>
    </div>
  );
}

function MonopolySeat({
  player,
  isActive,
  properties,
  currency
}: {
  player: ExtendedPlayerState;
  isActive: boolean;
  properties: number;
  currency: string;
}) {
  return (
    <motion.div
      layout
      className={`rounded-2xl border p-2 transition ${
        isActive ? "border-amber-400/70 bg-amber-400/10" : "border-white/10 bg-black/30"
      }`}
    >
      <PlayerPill
        player={player}
        isActive={isActive}
        trailing={`${properties} عقار · ${player.coins} ${currency}`}
      />
      <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          style={{
            backgroundColor: player.color,
            width: `${Math.min(100, Math.max(6, (player.coins / Math.max(1, player.coins + 200)) * 100))}%`
          }}
          className="h-full"
        />
      </div>
    </motion.div>
  );
}
