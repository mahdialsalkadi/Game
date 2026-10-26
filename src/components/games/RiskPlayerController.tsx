"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, Flag, Shield, ShieldPlus, Swords, TimerReset } from "lucide-react";
import type { FullRoomState } from "@/game/gameRoom";
import { getPlayerInitials } from "@/utils/playerDisplay";
import { TERRITORY_ACTIONS_PER_TURN, TERRITORY_ATTACK_COST, TERRITORY_REINFORCE_COST } from "@/game/territoryConfig";
import GameRulesSheet from "@/components/games/GameRulesSheet";
import { sfx } from "@/utils/soundEffects";

export interface RiskPlayerControllerProps {
  gameState: FullRoomState;
  playerId: string;
  isMyTurn: boolean;
  sendAction: (payload: Record<string, unknown>) => void;
  errorToast?: string | null;
}

type RegionFilter = "ALL" | "MINE" | "ENEMY" | "NEUTRAL";

export default function RiskPlayerController({
  gameState,
  playerId,
  isMyTurn,
  sendAction,
  errorToast
}: RiskPlayerControllerProps) {
  const [filter, setFilter] = useState<RegionFilter>("ALL");
  const player = gameState.players[playerId];
  const territory = gameState.territoryState;
  const actionsLeft = territory?.actionsLeft ?? TERRITORY_ACTIONS_PER_TURN;
  const regions = useMemo(
    () => gameState.tiles.filter((tile) => tile.tileType !== "START"),
    [gameState.tiles]
  );

  const owned = regions.filter((tile) => tile.ownerId === playerId);
  const neutral = regions.filter((tile) => !tile.ownerId);
  const enemy = regions.filter((tile) => tile.ownerId && tile.ownerId !== playerId);
  const visibleRegions = regions.filter((tile) => {
    if (filter === "MINE") return tile.ownerId === playerId;
    if (filter === "NEUTRAL") return !tile.ownerId;
    if (filter === "ENEMY") return Boolean(tile.ownerId && tile.ownerId !== playerId);
    return true;
  });

  const battle = territory?.lastBattle;

  return (
    <div dir="rtl" className="min-h-[100dvh] w-full bg-[#0b0604] text-amber-50 flex flex-col overflow-y-auto">
      {/* رأس القيادة */}
      <header
        className="px-4 pt-3 pb-2 border-b border-amber-500/20"
        style={{ background: "linear-gradient(180deg, rgba(120,53,15,0.5), rgba(20,10,5,0.2))" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              style={{ backgroundColor: player?.color }}
              className="w-9 h-9 rounded-xl border border-white/60 flex items-center justify-center text-xs font-black text-slate-950"
            >
              {getPlayerInitials(player?.name)}
            </span>
            <div>
              <div className="text-sm font-black leading-tight">{player?.name}</div>
              <div className="text-[10px] text-amber-300/70 font-bold">قائد ميداني · غزو العالم</div>
            </div>
          </div>
          <GameRulesSheet rulebookId="RISK" variant="ghost" label="القوانين" />
        </div>

        <div className="mt-2 grid grid-cols-4 gap-1.5">
          <div className="rounded-xl bg-black/40 border border-amber-500/20 px-2 py-1.5 text-center">
            <div className="text-sm font-black text-amber-300">{player?.coins ?? 0}</div>
            <div className="text-[9px] font-bold text-white/40">احتياط</div>
          </div>
          <div className="rounded-xl bg-black/40 border border-amber-500/20 px-2 py-1.5 text-center">
            <div className="text-sm font-black text-emerald-300">{owned.length}</div>
            <div className="text-[9px] font-bold text-white/40">أقاليمي</div>
          </div>
          <div className="rounded-xl bg-black/40 border border-amber-500/20 px-2 py-1.5 text-center">
            <div className="text-sm font-black text-rose-300">{enemy.length}</div>
            <div className="text-[9px] font-bold text-white/40">أقاليم العدو</div>
          </div>
          <div className="rounded-xl bg-black/40 border border-amber-500/20 px-2 py-1.5 text-center">
            <div className={`text-sm font-black ${actionsLeft > 0 ? "text-amber-300" : "text-white/30"}`}>
              {actionsLeft}/{TERRITORY_ACTIONS_PER_TURN}
            </div>
            <div className="text-[9px] font-bold text-white/40">أوامر</div>
          </div>
        </div>

        {isMyTurn ? (
          <div className="mt-2 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-[11px] font-black text-emerald-200">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              دورك — أصدر أوامرك الآن
            </span>
            <button
              onClick={() => sendAction({ type: "END_TURN" })}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center gap-1"
            >
              <TimerReset className="w-3 h-3" /> إنهاء الدور
            </button>
          </div>
        ) : (
          <div className="mt-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-[11px] font-bold text-white/50 text-center">
            بانتظار القائد{" "}
            <span className="text-amber-300">
              {gameState.players[gameState.turnOrder[gameState.currentTurnIndex]]?.name}
            </span>
          </div>
        )}
      </header>

      {errorToast && (
        <div className="mx-3 mt-2 rounded-xl bg-rose-950/80 border border-rose-500/50 px-3 py-2 text-[11px] font-bold text-rose-200 text-center">
          {errorToast}
        </div>
      )}

      {/* نتيجة آخر معركة */}
      <AnimatePresence>
        {battle && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mx-3 mt-2 rounded-xl border px-3 py-2 text-[11px] font-bold ${
              battle.attackerId === playerId
                ? battle.captured
                  ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-200"
                  : "bg-amber-500/10 border-amber-400/30 text-amber-200"
                : "bg-rose-500/10 border-rose-400/30 text-rose-200"
            }`}
          >
            {battle.messageAr}
            <div className="text-[9px] text-white/40 mt-0.5 font-mono">
              ⚔️ {battle.attackerRolls.join(" · ")} | 🛡️ {battle.defenderRolls.join(" · ")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* فلاتر الأقاليم */}
      <div className="flex gap-1 px-3 pt-2 pb-1">
        {(
          [
            { id: "ALL", label: `الكل ${regions.length}` },
            { id: "MINE", label: `لي ${owned.length}` },
            { id: "NEUTRAL", label: `محايد ${neutral.length}` },
            { id: "ENEMY", label: `عدو ${enemy.length}` }
          ] as { id: RegionFilter; label: string }[]
        ).map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-black border transition ${
              filter === item.id
                ? "bg-amber-500 text-slate-950 border-amber-300"
                : "bg-black/40 text-white/50 border-white/10"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* الأقاليم */}
      <main className="flex-1 px-3 pb-4 grid grid-cols-2 gap-2 content-start">
        {visibleRegions.map((tile) => {
          const owner = tile.ownerId ? gameState.players[tile.ownerId] : null;
          const isMine = tile.ownerId === playerId;
          const isEnemy = Boolean(tile.ownerId && tile.ownerId !== playerId);
          const affordableClaim = (player?.coins || 0) >= (tile.price || 50);
          const canAct = isMyTurn && actionsLeft > 0;

          return (
            <div
              key={tile.index}
              className={`rounded-xl border p-2 flex flex-col gap-1 ${
                isMine
                  ? "border-emerald-500/40 bg-emerald-950/30"
                  : isEnemy
                  ? "border-rose-500/40 bg-rose-950/25"
                  : "border-amber-500/25 bg-black/35"
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-[11px] font-black leading-tight line-clamp-2">{tile.name}</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-black/50 text-white/80 shrink-0">
                  <Shield className="w-2.5 h-2.5 inline mb-0.5" /> {tile.armies || 0}
                </span>
              </div>
              <div className="text-[9px] font-bold text-white/40 truncate">
                {owner ? (
                  <span style={{ color: owner.color }}>{owner.name}</span>
                ) : (
                  <span className="text-amber-300/70">محايد · {tile.price || 50}</span>
                )}
              </div>

              {isMine ? (
                <button
                  disabled={!canAct || (player?.coins || 0) < TERRITORY_REINFORCE_COST}
                  onClick={() => {
                    sfx.playCoinChime();
                    sendAction({ type: "REINFORCE_TILE", tileIndex: tile.index, count: 1 });
                  }}
                  className="mt-0.5 w-full py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-35 text-[10px] font-black flex items-center justify-center gap-1"
                >
                  <ShieldPlus className="w-3 h-3" /> تحصين (+1 · {TERRITORY_REINFORCE_COST})
                </button>
              ) : (
                <button
                  disabled={
                    !canAct ||
                    (isEnemy
                      ? (player?.coins || 0) < TERRITORY_ATTACK_COST
                      : !affordableClaim)
                  }
                  onClick={() => {
                    sfx.playCardSlap?.();
                    sendAction({ type: "CLAIM_OR_ATTACK_TILE", targetTileIndex: tile.index });
                  }}
                  className={`mt-0.5 w-full py-1.5 rounded-lg disabled:opacity-35 text-[10px] font-black flex items-center justify-center gap-1 ${
                    isEnemy
                      ? "bg-rose-600/80 hover:bg-rose-600"
                      : "bg-amber-500/85 hover:bg-amber-500 text-slate-950"
                  }`}
                >
                  {isEnemy ? (
                    <>
                      <Swords className="w-3 h-3" /> هجوم · {TERRITORY_ATTACK_COST}
                    </>
                  ) : (
                    <>
                      <Flag className="w-3 h-3" /> فتح · {tile.price || 50}
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
        {visibleRegions.length === 0 && (
          <div className="col-span-2 rounded-xl border border-white/10 bg-black/30 p-4 text-center text-[11px] font-bold text-white/40">
            <Crosshair className="w-4 h-4 mx-auto mb-1" />
            لا توجد أقاليم في هذا التصنيف.
          </div>
        )}
      </main>
    </div>
  );
}
