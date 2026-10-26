"use client";

import React from "react";
import { motion } from "framer-motion";
import { Crosshair, Crown, Flag, Menu, QrCode, Shield, Swords, Target } from "lucide-react";
import type { GameTableProps } from "./types";
import GameRulesSheet from "./GameRulesSheet";
import { TableStat, TurnBanner } from "./shared";
import { TERRITORY_ACTIONS_PER_TURN, TERRITORY_WIN_RATIO, TERRITORY_ATTACK_COST } from "@/game/territoryConfig";

export default function RiskTable({
  gameState,
  isSpectator,
  onOpenInvite,
  onOpenMenu
}: GameTableProps) {
  const activePlayerId = gameState.turnOrder[gameState.currentTurnIndex];
  const territory = gameState.territoryState;
  const players = Object.values(gameState.players);
  const regions = gameState.tiles.filter((tile) => tile.tileType !== "START");
  const targetRegions = Math.ceil(regions.length * TERRITORY_WIN_RATIO);

  const countOwned = (playerId: string) => regions.filter((tile) => tile.ownerId === playerId).length;
  const countArmies = (playerId: string) =>
    regions.filter((tile) => tile.ownerId === playerId).reduce((sum, tile) => sum + (tile.armies || 0), 0);
  const activePlayer = gameState.players[activePlayerId];
  const leader = [...players].sort((a, b) => countOwned(b.id) - countOwned(a.id))[0];
  const neutralCount = regions.filter((tile) => !tile.ownerId).length;

  return (
    <div
      dir="rtl"
      className="relative w-full h-full flex flex-col text-amber-50 overflow-hidden select-none"
      style={{ background: "radial-gradient(ellipse at 50% 30%, #33150f 0%, #1b0a08 45%, #080403 100%)" }}
    >
      {/* خرائط قديمة وضباب حرب */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:34px_34px] opacity-[0.05]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.8)_100%)]" />
      <div className="pointer-events-none absolute -top-32 left-1/3 w-[520px] h-[320px] bg-rose-700/15 blur-[130px]" />

      <header className="relative z-30 flex items-center justify-between gap-2 px-3 md:px-5 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMenu}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 border border-amber-400/20 backdrop-blur-md"
            title="القائمة"
          >
            <Menu className="w-4 h-4" />
          </button>
          <TableStat label="الجولة" value={gameState.currentRound || 1} accent="text-amber-300" />
          <TableStat
            label="أوامر متبقية"
            value={`${territory?.actionsLeft ?? TERRITORY_ACTIONS_PER_TURN}/${TERRITORY_ACTIONS_PER_TURN}`}
            accent="text-rose-300"
          />
          <TableStat label="أقاليم محايدة" value={neutralCount} accent="text-white/80" />
        </div>

        <div className="text-center leading-tight">
          <h1 className="text-sm md:text-base font-black tracking-wide flex items-center justify-center gap-1.5 text-amber-200">
            <Swords className="w-4 h-4 text-rose-400" />
            {gameState.themeTitle || "غرفة العمليات · غزو العالم"}
          </h1>
          <p className="text-[10px] text-amber-200/40 font-bold">
            السيطرة على {targetRegions} إقليماً من {regions.length} لتحقيق الغزو الشامل
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GameRulesSheet rulebookId="RISK" variant="ghost" label="قوانين" />
          <button
            onClick={onOpenInvite}
            className="px-2.5 py-1 rounded-full bg-black/50 border border-rose-400/30 text-rose-300 hover:bg-black/70 text-[11px] font-mono font-bold flex items-center gap-1"
          >
            <QrCode className="w-3.5 h-3.5" />
            {gameState.roomId}
          </button>
        </div>
      </header>

      <div className="relative z-20 flex-1 min-h-0 flex gap-3 px-2 md:px-4 py-2">
        {/* بطاقات القادة */}
        <aside className="hidden lg:flex w-52 flex-col gap-2">
          <div className="text-[10px] font-black text-amber-300/80 tracking-widest px-1">بطاقات القادة</div>
          {players.map((player) => {
            const owned = countOwned(player.id);
            const progress = regions.length ? (owned / regions.length) * 100 : 0;
            const isActive = player.id === activePlayerId;
            return (
              <motion.div
                layout
                key={player.id}
                className={`rounded-2xl border p-2.5 transition ${
                  isActive
                    ? "border-rose-400/60 bg-rose-950/30 shadow-[0_0_22px_rgba(244,63,94,0.2)]"
                    : "border-white/10 bg-black/35"
                } ${player.isEliminated ? "opacity-45" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black truncate flex items-center gap-1 min-w-0 flex-1">
                    <span style={{ backgroundColor: player.color }} className="w-2.5 h-2.5 rounded-full shrink-0" />
                    <span className="truncate">{player.name}</span>
                    {leader?.id === player.id && !player.isEliminated && (
                      <Crown className="w-3 h-3 text-amber-300" />
                    )}
                  </span>
                  <span className="text-[10px] font-black text-amber-200">{owned}/{regions.length}</span>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    style={{ backgroundColor: player.color, width: `${Math.max(3, progress)}%` }}
                    className="h-full"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[9px] font-bold text-white/45">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" /> {countArmies(player.id)} كتيبة
                  </span>
                  <span>احتياط {player.coins}</span>
                </div>
              </motion.div>
            );
          })}
          <div className="rounded-2xl border border-amber-400/20 bg-black/40 p-2.5 text-[10px] leading-5 text-amber-100/60">
            <Target className="w-3.5 h-3.5 text-amber-300 mb-1" />
            الهجوم يكلف {TERRITORY_ATTACK_COST} من الاحتياط. التحصين يقوّي دفاع الإقليم.
          </div>
        </aside>

        {/* خريطة الأقاليم */}
        <main className="relative flex-1 min-h-0 rounded-3xl border border-amber-400/20 bg-[#0d0705]/60 p-2 md:p-3 flex flex-col">
          {/* خطوط الطول والعرض على الخريطة */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:80px_80px]" />
          <div className="relative flex-1 min-h-0 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 grid-rows-[repeat(auto-fit,minmax(72px,1fr))] gap-1.5 md:gap-2">
            {regions.map((tile) => {
              const owner = tile.ownerId ? gameState.players[tile.ownerId] : null;
              const lastBattle = territory?.lastBattle;
              const isBattleTile = lastBattle?.tileIndex === tile.index;
              return (
                <motion.div
                  key={tile.index}
                  layout
                  className={`relative rounded-xl border p-2 min-h-[62px] flex flex-col justify-between overflow-hidden transition ${
                    owner ? "border-white/25" : "border-amber-400/20 bg-black/30"
                  } ${isBattleTile ? "ring-2 ring-rose-400" : ""}`}
                  style={{
                    background: owner
                      ? `linear-gradient(160deg, ${owner.color}33, rgba(0,0,0,0.55))`
                      : "rgba(20,12,8,0.7)"
                  }}
                >
                  {owner && (
                    <span style={{ backgroundColor: owner.color }} className="absolute top-0 inset-x-0 h-1" />
                  )}
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[10px] md:text-xs font-black leading-tight line-clamp-2">
                      {tile.name}
                    </span>
                    <span
                      className={`shrink-0 text-[10px] font-black px-1 rounded ${
                        owner ? "bg-black/50 text-white" : "bg-amber-400/20 text-amber-200"
                      }`}
                    >
                      <Shield className="w-2.5 h-2.5 inline mb-0.5" /> {tile.armies || (owner ? 1 : 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-bold">
                    <span className="text-white/40">#{tile.index}</span>
                    {owner ? (
                      <span className="truncate max-w-[58px]" style={{ color: owner.color }}>
                        {owner.name}
                      </span>
                    ) : (
                      <span className="text-amber-300/70">{tile.price || 50}</span>
                    )}
                  </div>
                  {isBattleTile && (
                    <div className="absolute inset-0 bg-rose-500/10 flex items-center justify-center">
                      <Crosshair className="w-4 h-4 text-rose-300 animate-pulse" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </main>

        {/* سجل المعارك */}
        <aside className="hidden md:flex w-44 xl:w-52 flex-col gap-2">
          <div className="rounded-2xl border border-rose-400/25 bg-black/45 p-2.5">
            <div className="text-[10px] font-black text-rose-300 mb-1 flex items-center gap-1">
              <Swords className="w-3 h-3" /> آخر معركة
            </div>
            {territory?.lastBattle ? (
              <>
                <p className="text-[10px] leading-5 text-white/75 font-bold">{territory.lastBattle.messageAr}</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[9px] font-black">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    ⚔️ {territory.lastBattle.attackerRolls.join(" · ")}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    🛡️ {territory.lastBattle.defenderRolls.join(" · ")}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-[10px] text-white/40">لم تبدأ المعارك بعد. افتحوا الأقاليم المحايدة أولاً.</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/35 p-2.5">
            <div className="text-[10px] font-black text-white/50 mb-1">إحصاء القوى</div>
            <div className="space-y-1">
              {players.map((player) => (
                <div key={player.id} className="flex items-center justify-between text-[10px] font-bold">
                  <span className="flex items-center gap-1 truncate min-w-0 flex-1">
                    <span style={{ backgroundColor: player.color }} className="w-2 h-2 rounded-full shrink-0" />
                    <span className="truncate">{player.name}</span>
                  </span>
                  <span className="text-white/50 shrink-0 ml-1">{countArmies(player.id)} 🛡️</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto rounded-2xl border border-amber-400/20 bg-amber-950/20 p-2.5 text-[10px] leading-5 text-amber-100/70">
            <Flag className="w-3.5 h-3.5 text-amber-300 mb-1" />
            الأوامر تُصدر من جوال القائد: فتح، هجوم، تحصين، ثم إنهاء الدور.
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
              {countOwned(player.id)}
            </span>
          ))}
        </div>
        <TurnBanner name={activePlayer?.name} color={activePlayer?.color} text="القيادة لدى" />
        <span className="hidden sm:block text-[10px] text-white/35 font-bold">
          {isSpectator ? "وضع المتفرج" : `الدخل ${territory?.turnIncome || 0} كتيبة هذا الدور`}
        </span>
      </footer>
    </div>
  );
}
