"use client";

import React, { useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Star,
  Flag,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Sparkles,
  ShieldCheck,
  Crown
} from "lucide-react";
import type { FullRoomState } from "@/game/gameRoom";
import {
  LUDO_COLORS,
  LUDO_SAFE_TILES,
  TRACK_TILE_COORDS,
  getTokenBoardCoordinates,
  type LudoColor,
  type LudoToken,
  type LudoPlayerTokens
} from "@/game/ludoEngine";
import RealisticDice3D from "@/components/common/RealisticDice3D";
import WoodTabletopEnvironment from "@/components/common/WoodTabletopEnvironment";
import { sfx } from "@/utils/soundEffects";

export interface LudoBoardViewProps {
  gameState: FullRoomState;
  lastAnimation?: any;
  isRollingDice?: boolean;
  displayedDice?: number | null;
  sendAction?: (payload: Record<string, unknown>) => void;
  onTokenClick?: (tokenId: number) => void;
}

/**
 * Antique Brass Corner Bracket Component (زاوية نحاسية مذهبة بنقوش أرابيسك)
 */
function BrassCornerBracket({
  position
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const rotClasses = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0 rotate-90",
    "bottom-right": "bottom-0 right-0 rotate-180",
    "bottom-left": "bottom-0 left-0 -rotate-90"
  }[position];

  return (
    <div className={`absolute ${rotClasses} w-11 h-11 pointer-events-none z-30 select-none`}>
      <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]">
        <defs>
          <linearGradient id={`brass-grad-${position}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fae082" />
            <stop offset="35%" stopColor="#d4af37" />
            <stop offset="70%" stopColor="#8c6514" />
            <stop offset="100%" stopColor="#483005" />
          </linearGradient>
        </defs>
        {/* Main corner bracket plate */}
        <path
          d="M 2 2 L 40 2 A 4 4 0 0 1 44 6 L 44 12 A 24 24 0 0 1 20 36 L 12 44 A 4 4 0 0 1 6 44 L 2 40 Z"
          fill={`url(#brass-grad-${position})`}
          stroke="#422c07"
          strokeWidth="1"
        />
        {/* Decorative inner Arabesque bevel */}
        <path
          d="M 7 7 L 30 7 A 3 3 0 0 1 33 10 L 33 12 A 16 16 0 0 1 18 27 L 12 33 A 3 3 0 0 1 10 33 L 7 30 Z"
          fill="#2b1a08"
          opacity="0.45"
        />
        {/* Inlaid filigree detail */}
        <path
          d="M 12 12 Q 22 14 26 26 Q 14 22 12 12 Z"
          fill={`url(#brass-grad-${position})`}
          opacity="0.75"
        />
        {/* Brass Screws / Rivets */}
        <circle cx="9" cy="9" r="2.2" fill="#ffd700" stroke="#523908" strokeWidth="0.8" />
        <line x1="7.5" y1="9" x2="10.5" y2="9" stroke="#523908" strokeWidth="0.6" />
        <circle cx="36" cy="7" r="1.8" fill="#ffd700" stroke="#523908" strokeWidth="0.8" />
        <circle cx="7" cy="36" r="1.8" fill="#ffd700" stroke="#523908" strokeWidth="0.8" />
      </svg>
    </div>
  );
}

export default function LudoBoardView({
  gameState,
  lastAnimation,
  isRollingDice = false,
  displayedDice = null,
  sendAction,
  onTokenClick
}: LudoBoardViewProps) {
  const ludoState = gameState.ludoState;
  const activePlayerId = gameState.turnOrder?.[gameState.currentTurnIndex];
  const activePlayer = gameState.players?.[activePlayerId];
  const activeLudoPlayer = ludoState?.players?.[activePlayerId];
  const eligibleTokenIds = ludoState?.eligibleTokenIds || [];

  const prevLastMoveRef = useRef<any>(null);

  // Trigger procedural audio on token moves, captures, or victories
  useEffect(() => {
    if (!ludoState?.lastMoveResult) return;
    const move = ludoState.lastMoveResult;

    if (prevLastMoveRef.current !== move) {
      prevLastMoveRef.current = move;

      if (move.capturedToken) {
        sfx.playCaptureSlap();
      } else if (move.reachedHome || move.winnerRank === 1) {
        sfx.playVictoryFanfare();
      } else {
        sfx.playPawnHop();
      }
    }
  }, [ludoState?.lastMoveResult]);

  // Aggregate all tokens across all players to render on the board
  const allBoardTokens = useMemo(() => {
    if (!ludoState?.players) return [];
    const list: Array<{
      player: LudoPlayerTokens;
      token: LudoToken;
      coord: { row: number; col: number };
      isEligible: boolean;
    }> = [];

    for (const player of Object.values(ludoState.players)) {
      for (const token of player.tokens) {
        const coord = getTokenBoardCoordinates(player, token);
        const isEligible =
          player.playerId === activePlayerId &&
          eligibleTokenIds.includes(token.id);

        list.push({
          player,
          token,
          coord,
          isEligible
        });
      }
    }

    return list;
  }, [ludoState?.players, activePlayerId, eligibleTokenIds]);

  // Group tokens occupying the exact same (row, col) cell for stacking
  const groupedTokensByCell = useMemo(() => {
    const map = new Map<string, typeof allBoardTokens>();
    for (const item of allBoardTokens) {
      const key = `${item.coord.row}-${item.coord.col}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [allBoardTokens]);

  const handleTokenSelect = (token: LudoToken, player: LudoPlayerTokens) => {
    if (player.playerId !== activePlayerId) return;
    if (!eligibleTokenIds.includes(token.id)) return;

    // Trigger pawn hop tactile feedback
    sfx.playPawnHop();

    if (onTokenClick) {
      onTokenClick(token.id);
    } else if (sendAction) {
      sendAction({ type: "MOVE_LUDO_TOKEN", tokenId: token.id });
    }
  };

  return (
    <WoodTabletopEnvironment
      variant="walnut"
      showPlanks={true}
      showSpotlight={true}
      className="p-2 md:p-4 flex items-center justify-center overflow-hidden"
    >
      <div
        dir="rtl"
        className="w-full h-full aspect-square mx-auto p-3 sm:p-3.5 bg-gradient-to-br from-[#2b1509] via-[#1a0c05] to-[#241107] rounded-[28px] border-[10px] border-[#3a1d0d] shadow-[0_25px_80px_rgba(0,0,0,0.98),inset_0_2px_4px_rgba(255,220,170,0.3),inset_0_-8px_20px_rgba(0,0,0,0.9)] relative select-none font-sans overflow-hidden flex flex-col justify-between z-10"
        style={{ maxWidth: "min(84vh, calc(100dvh - 150px))", maxHeight: "min(84vh, calc(100dvh - 150px))" }}
      >
        {/* 4 Antique Brass Filigree Corner Brackets */}
      <BrassCornerBracket position="top-left" />
      <BrassCornerBracket position="top-right" />
      <BrassCornerBracket position="bottom-left" />
      <BrassCornerBracket position="bottom-right" />

      {/* Outer Polished Brass Stringing Accent Line */}
      <div className="absolute inset-2.5 rounded-[20px] border border-amber-600/30 pointer-events-none" />

      {/* 15x15 Classic Cross-Shaped Jackaroo Wood Inlay Grid */}
      <div
        className="w-full h-full relative grid gap-[2px] p-2 rounded-2xl border-2 border-[#522d16]/80 overflow-hidden shadow-inner"
        style={{
          gridTemplateColumns: "repeat(15, minmax(0, 1fr))",
          gridTemplateRows: "repeat(15, minmax(0, 1fr))",
          background: "radial-gradient(ellipse at center, #2e170c 0%, #1c0e07 60%, #100703 100%)",
          backgroundImage: `
            radial-gradient(ellipse at center, #2e170c 0%, #1c0e07 60%, #100703 100%),
            repeating-linear-gradient(45deg, rgba(255,215,160,0.015) 0px, rgba(255,215,160,0.015) 2px, transparent 2px, transparent 10px)
          `
        }}
      >
        {/* ======================================================== */}
        {/* 1. THE 4 COLORED HOME BASES / YARDS (6x6 cells each)     */}
        {/* Handcrafted Colored Lacquer Inlays with Brass Bezels     */}
        {/* ======================================================== */}

        {/* GREEN YARD: Top-Left (rows 1..6, cols 1..6) */}
        <div
          style={{ gridRow: "1 / 7", gridColumn: "1 / 7" }}
          className="relative rounded-2xl bg-gradient-to-br from-[#064e3b] via-[#043324] to-[#011c13] border-2 border-emerald-500/50 p-2 flex flex-col items-center justify-between shadow-[inset_0_4px_16px_rgba(0,0,0,0.85),0_6px_16px_rgba(0,0,0,0.6)]"
        >
          {/* Camp Header Plaque */}
          <div className="flex items-center gap-1.5 self-start px-2 py-0.5 rounded-lg bg-[#021810]/80 border border-emerald-400/40 text-emerald-200 text-[10px] font-black uppercase tracking-wider shadow">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            معسكر الأخضر
          </div>

          {/* Inner Yard Lacquer Plate with 4 Carved Waiting Marble Cups */}
          <div className="w-4/5 h-4/5 rounded-2xl bg-gradient-to-br from-[#021810] to-[#082e20] border border-emerald-500/40 grid grid-cols-2 grid-rows-2 gap-2 p-2 place-items-center shadow-[inset_0_4px_12px_rgba(0,0,0,0.95)]">
            {[0, 1, 2, 3].map((slotIdx) => (
              <div
                key={slotIdx}
                className="w-8 h-8 rounded-full bg-gradient-to-b from-[#01140d] to-[#052b1b] border border-emerald-500/40 flex items-center justify-center shadow-[inset_0_4px_7px_rgba(0,0,0,0.95),0_1px_2px_rgba(255,255,255,0.08)] relative"
              >
                <div className="w-3.5 h-3.5 rounded-full border border-dashed border-emerald-400/40 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/40" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RED YARD: Top-Right (rows 1..6, cols 10..15) */}
        <div
          style={{ gridRow: "1 / 7", gridColumn: "10 / 16" }}
          className="relative rounded-2xl bg-gradient-to-br from-[#881337] via-[#5b0821] to-[#360312] border-2 border-rose-500/50 p-2 flex flex-col items-center justify-between shadow-[inset_0_4px_16px_rgba(0,0,0,0.85),0_6px_16px_rgba(0,0,0,0.6)]"
        >
          {/* Camp Header Plaque */}
          <div className="flex items-center gap-1.5 self-end px-2 py-0.5 rounded-lg bg-[#24030d]/80 border border-rose-400/40 text-rose-200 text-[10px] font-black uppercase tracking-wider shadow">
            معسكر الأحمر
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_#fb7185]" />
          </div>

          {/* Inner Yard Lacquer Plate with 4 Carved Waiting Marble Cups */}
          <div className="w-4/5 h-4/5 rounded-2xl bg-gradient-to-br from-[#26030d] to-[#450718] border border-rose-500/40 grid grid-cols-2 grid-rows-2 gap-2 p-2 place-items-center shadow-[inset_0_4px_12px_rgba(0,0,0,0.95)]">
            {[0, 1, 2, 3].map((slotIdx) => (
              <div
                key={slotIdx}
                className="w-8 h-8 rounded-full bg-gradient-to-b from-[#1f020a] to-[#3a0514] border border-rose-500/40 flex items-center justify-center shadow-[inset_0_4px_7px_rgba(0,0,0,0.95),0_1px_2px_rgba(255,255,255,0.08)] relative"
              >
                <div className="w-3.5 h-3.5 rounded-full border border-dashed border-rose-400/40 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400/40" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BLUE YARD: Bottom-Left (rows 10..15, cols 1..6) */}
        <div
          style={{ gridRow: "10 / 16", gridColumn: "1 / 7" }}
          className="relative rounded-2xl bg-gradient-to-br from-[#1e3a8a] via-[#14265e] to-[#0b173b] border-2 border-blue-500/50 p-2 flex flex-col items-center justify-between shadow-[inset_0_4px_16px_rgba(0,0,0,0.85),0_6px_16px_rgba(0,0,0,0.6)]"
        >
          {/* Inner Yard Lacquer Plate with 4 Carved Waiting Marble Cups */}
          <div className="w-4/5 h-4/5 rounded-2xl bg-gradient-to-br from-[#091533] to-[#142657] border border-blue-500/40 grid grid-cols-2 grid-rows-2 gap-2 p-2 place-items-center shadow-[inset_0_4px_12px_rgba(0,0,0,0.95)]">
            {[0, 1, 2, 3].map((slotIdx) => (
              <div
                key={slotIdx}
                className="w-8 h-8 rounded-full bg-gradient-to-b from-[#060e24] to-[#12224d] border border-blue-500/40 flex items-center justify-center shadow-[inset_0_4px_7px_rgba(0,0,0,0.95),0_1px_2px_rgba(255,255,255,0.08)] relative"
              >
                <div className="w-3.5 h-3.5 rounded-full border border-dashed border-blue-400/40 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400/40" />
                </div>
              </div>
            ))}
          </div>

          {/* Camp Header Plaque */}
          <div className="flex items-center gap-1.5 self-start px-2 py-0.5 rounded-lg bg-[#071129]/80 border border-blue-400/40 text-blue-200 text-[10px] font-black uppercase tracking-wider shadow">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
            معسكر الأزرق
          </div>
        </div>

        {/* YELLOW YARD: Bottom-Right (rows 10..15, cols 10..15) */}
        <div
          style={{ gridRow: "10 / 16", gridColumn: "10 / 16" }}
          className="relative rounded-2xl bg-gradient-to-br from-[#854d0e] via-[#5c3407] to-[#361e03] border-2 border-amber-500/50 p-2 flex flex-col items-center justify-between shadow-[inset_0_4px_16px_rgba(0,0,0,0.85),0_6px_16px_rgba(0,0,0,0.6)]"
        >
          {/* Inner Yard Lacquer Plate with 4 Carved Waiting Marble Cups */}
          <div className="w-4/5 h-4/5 rounded-2xl bg-gradient-to-br from-[#271502] to-[#472706] border border-amber-500/40 grid grid-cols-2 grid-rows-2 gap-2 p-2 place-items-center shadow-[inset_0_4px_12px_rgba(0,0,0,0.95)]">
            {[0, 1, 2, 3].map((slotIdx) => (
              <div
                key={slotIdx}
                className="w-8 h-8 rounded-full bg-gradient-to-b from-[#1c0f01] to-[#3a2004] border border-amber-500/40 flex items-center justify-center shadow-[inset_0_4px_7px_rgba(0,0,0,0.95),0_1px_2px_rgba(255,255,255,0.08)] relative"
              >
                <div className="w-3.5 h-3.5 rounded-full border border-dashed border-amber-400/40 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400/40" />
                </div>
              </div>
            ))}
          </div>

          {/* Camp Header Plaque */}
          <div className="flex items-center gap-1.5 self-end px-2 py-0.5 rounded-lg bg-[#241302]/80 border border-amber-400/40 text-amber-200 text-[10px] font-black uppercase tracking-wider shadow">
            معسكر الأصفر
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fde047]" />
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. THE 52 OUTER TRACK CELLS (Carved Marble Divots)       */}
        {/* Concave Spherical Depressions with Golden Star Medallions*/}
        {/* ======================================================== */}
        {TRACK_TILE_COORDS.map((coord, idx) => {
          const isSafe = LUDO_SAFE_TILES.includes(idx);
          const isGreenStart = idx === 0;
          const isRedStart = idx === 13;
          const isYellowStart = idx === 26;
          const isBlueStart = idx === 39;
          const isExit = isGreenStart || isRedStart || isYellowStart || isBlueStart;

          return (
            <div
              key={`track-${idx}`}
              style={{
                gridRow: coord.row + 1,
                gridColumn: coord.col + 1
              }}
              className="relative w-full h-full p-[2px] flex items-center justify-center select-none"
            >
              {/* 3D Carved Hardwood Divot (حفرة العيون الرخامية المحفورة) */}
              <div
                className={`w-full h-full rounded-full flex items-center justify-center relative transition-all duration-300 ${
                  isSafe
                    ? "bg-gradient-to-br from-[#ffd978] via-[#d4af37] to-[#785008] p-[1.5px] shadow-[0_0_10px_rgba(212,175,55,0.45),inset_0_1px_2px_rgba(255,255,255,0.6)]"
                    : isExit
                    ? "p-[1.5px] shadow-[0_0_8px_rgba(0,0,0,0.6)]"
                    : "bg-gradient-to-b from-[#180d07] to-[#2b160b] shadow-[inset_0_3px_6px_rgba(0,0,0,0.95),inset_0_-1px_2px_rgba(255,230,190,0.1),0_1px_2px_rgba(0,0,0,0.5)] border border-[#3b1f11]"
                }`}
                style={
                  isGreenStart
                    ? { background: "linear-gradient(135deg, #10b981 0%, #064e3b 100%)", boxShadow: "0 0 8px rgba(16,185,129,0.4)" }
                    : isRedStart
                    ? { background: "linear-gradient(135deg, #f43f5e 0%, #881337 100%)", boxShadow: "0 0 8px rgba(244,63,94,0.4)" }
                    : isYellowStart
                    ? { background: "linear-gradient(135deg, #fbbf24 0%, #854d0e 100%)", boxShadow: "0 0 8px rgba(251,191,36,0.4)" }
                    : isBlueStart
                    ? { background: "linear-gradient(135deg, #38bdf8 0%, #1e3a8a 100%)", boxShadow: "0 0 8px rgba(56,189,248,0.4)" }
                    : undefined
                }
              >
                {/* Concave Pit Floor */}
                <div
                  className={`w-full h-full rounded-full flex items-center justify-center relative overflow-hidden ${
                    isSafe
                      ? "bg-gradient-to-b from-[#3a2004] via-[#201001] to-[#120901] border border-amber-300/40"
                      : isExit
                      ? "bg-[#100703] shadow-inner"
                      : "bg-gradient-to-b from-[#120904] to-[#1e0f07]"
                  }`}
                >
                  {/* 8 Star Safety Tiles: Inlaid Golden Star Medallion (نجمة نحاسية مذهبة) */}
                  {isSafe && (
                    <div className="relative flex items-center justify-center">
                      <Star
                        className={`w-3.5 h-3.5 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)] ${
                          isGreenStart
                            ? "text-emerald-300 fill-emerald-400"
                            : isRedStart
                            ? "text-rose-300 fill-rose-400"
                            : isYellowStart
                            ? "text-amber-300 fill-amber-400"
                            : isBlueStart
                            ? "text-sky-300 fill-sky-400"
                            : "text-amber-300 fill-amber-300 animate-pulse"
                        }`}
                      />
                    </div>
                  )}

                  {/* Start Exit Arrow Indicators */}
                  {isGreenStart && <ArrowRight className="w-3.5 h-3.5 text-emerald-300 drop-shadow" />}
                  {isRedStart && <ArrowDown className="w-3.5 h-3.5 text-rose-300 drop-shadow" />}
                  {isYellowStart && <ArrowLeft className="w-3.5 h-3.5 text-amber-300 drop-shadow" />}
                  {isBlueStart && <ArrowUp className="w-3.5 h-3.5 text-sky-300 drop-shadow" />}

                  {/* Circular marble seating groove for ordinary track divots */}
                  {!isSafe && !isExit && (
                    <div className="w-2.5 h-2.5 rounded-full border border-amber-900/40 bg-[#0e0703]/70 shadow-inner flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-amber-900/30" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* ======================================================== */}
        {/* 3. THE 4 COLORED HOME RUNWAYS (5 Safe Carved Steps Each) */}
        {/* ======================================================== */}

        {/* Green Home Column: row 7, cols 1..5 */}
        {LUDO_COLORS.green.homePathCoords.map((coord, stepIdx) => (
          <div
            key={`green-home-${stepIdx}`}
            style={{
              gridRow: coord.row + 1,
              gridColumn: coord.col + 1
            }}
            className="relative w-full h-full p-[2px] flex items-center justify-center"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-600 to-emerald-950 p-[1.5px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_1px_2px_rgba(16,185,129,0.3)]">
              <div className="w-full h-full rounded-full bg-[#032115] flex items-center justify-center shadow-inner">
                <ArrowRight className="w-3 h-3 text-emerald-300/80 drop-shadow" />
              </div>
            </div>
          </div>
        ))}

        {/* Red Home Column: rows 1..5, col 7 */}
        {LUDO_COLORS.red.homePathCoords.map((coord, stepIdx) => (
          <div
            key={`red-home-${stepIdx}`}
            style={{
              gridRow: coord.row + 1,
              gridColumn: coord.col + 1
            }}
            className="relative w-full h-full p-[2px] flex items-center justify-center"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-rose-600 to-rose-950 p-[1.5px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_1px_2px_rgba(244,63,94,0.3)]">
              <div className="w-full h-full rounded-full bg-[#26030c] flex items-center justify-center shadow-inner">
                <ArrowDown className="w-3 h-3 text-rose-300/80 drop-shadow" />
              </div>
            </div>
          </div>
        ))}

        {/* Yellow Home Column: row 7, cols 13..9 */}
        {LUDO_COLORS.yellow.homePathCoords.map((coord, stepIdx) => (
          <div
            key={`yellow-home-${stepIdx}`}
            style={{
              gridRow: coord.row + 1,
              gridColumn: coord.col + 1
            }}
            className="relative w-full h-full p-[2px] flex items-center justify-center"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-600 to-amber-950 p-[1.5px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_1px_2px_rgba(251,191,36,0.3)]">
              <div className="w-full h-full rounded-full bg-[#261301] flex items-center justify-center shadow-inner">
                <ArrowLeft className="w-3 h-3 text-amber-300/80 drop-shadow" />
              </div>
            </div>
          </div>
        ))}

        {/* Blue Home Column: rows 13..9, col 7 */}
        {LUDO_COLORS.blue.homePathCoords.map((coord, stepIdx) => (
          <div
            key={`blue-home-${stepIdx}`}
            style={{
              gridRow: coord.row + 1,
              gridColumn: coord.col + 1
            }}
            className="relative w-full h-full p-[2px] flex items-center justify-center"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-600 to-blue-950 p-[1.5px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_1px_2px_rgba(59,130,246,0.3)]">
              <div className="w-full h-full rounded-full bg-[#081536] flex items-center justify-center shadow-inner">
                <ArrowUp className="w-3 h-3 text-blue-300/80 drop-shadow" />
              </div>
            </div>
          </div>
        ))}

        {/* ======================================================== */}
        {/* 4. CENTER VICTORY GOAL (Mosaic Marquetry & Marble Inlay) */}
        {/* ======================================================== */}
        <div
          style={{ gridRow: "7 / 10", gridColumn: "7 / 10" }}
          className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#2a170c] via-[#1a0c05] to-[#341b0e] border-2 border-amber-400/70 shadow-[0_0_35px_rgba(245,158,11,0.3),inset_0_4px_12px_rgba(0,0,0,0.9)] flex items-center justify-center"
        >
          {/* Multi-Colored Mosaic Marquetry Polished Marble Inlays */}
          <div className="absolute inset-0">
            {/* Left triangle: Green Jade Marquetry */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-emerald-600/50 to-emerald-900/60"
              style={{ clipPath: "polygon(0 0, 50% 50%, 0 100%)" }}
            />
            {/* Top triangle: Ruby Marquetry */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-rose-600/50 to-rose-900/60"
              style={{ clipPath: "polygon(0 0, 100% 0, 50% 50%)" }}
            />
            {/* Right triangle: Amber Marquetry */}
            <div
              className="absolute inset-0 bg-gradient-to-l from-amber-500/50 to-amber-900/60"
              style={{ clipPath: "polygon(100% 0, 100% 100%, 50% 50%)" }}
            />
            {/* Bottom triangle: Lapis Lazuli Marquetry */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-blue-600/50 to-blue-900/60"
              style={{ clipPath: "polygon(0 100%, 100% 100%, 50% 50%)" }}
            />
            {/* Brass Marquetry Inlay Dividers */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
              <line x1="0" y1="0" x2="100" y2="100" stroke="#d4af37" strokeWidth="1.5" opacity="0.75" />
              <line x1="0" y1="100" x2="100" y2="0" stroke="#d4af37" strokeWidth="1.5" opacity="0.75" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="#d4af37" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
            </svg>
          </div>

          {/* Central 3D Dice Tray Sanctuary */}
          <div className="relative z-10 scale-90 flex flex-col items-center justify-center">
            <RealisticDice3D
              values={displayedDice ? [displayedDice] : [6]}
              isRolling={isRollingDice}
              size="sm"
              showTray={true}
              className="shadow-2xl"
            />
          </div>
        </div>

        {/* ======================================================== */}
        {/* 5. TOKENS LAYER (Glass / Ceramic Marble Pawns)           */}
        {/* Specular Shine, Translucent Colored Core, Parabolic Arc  */}
        {/* ======================================================== */}
        {Array.from(groupedTokensByCell.entries()).map(([cellKey, tokensInCell]) => {
          const first = tokensInCell[0];
          const { row, col } = first.coord;

          return (
            <div
              key={cellKey}
              style={{
                gridRow: row + 1,
                gridColumn: col + 1,
                zIndex: 30
              }}
              className="relative w-full h-full pointer-events-none flex items-center justify-center"
            >
              <div className="relative w-full h-full flex items-center justify-center pointer-events-auto">
                {tokensInCell.map((item, idx) => {
                  const isSingle = tokensInCell.length === 1;
                  // Stacking offset if multiple pieces share this square
                  const offsetX = isSingle ? 0 : (idx - (tokensInCell.length - 1) / 2) * 8;
                  const offsetY = isSingle ? 0 : (idx % 2 === 0 ? -4 : 4);

                  return (
                    <motion.div
                      key={`token-${item.player.playerId}-${item.token.id}`}
                      layoutId={`pawn-${item.player.playerId}-${item.token.id}`}
                      initial={{ scale: 0.6, y: -24, opacity: 0 }}
                      animate={{
                        scale: item.isEligible ? [1, 1.2, 1] : 1,
                        x: offsetX,
                        y: item.isEligible ? [offsetY - 4, offsetY, offsetY - 4] : offsetY,
                        opacity: 1
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 24,
                        scale: item.isEligible ? { repeat: Infinity, duration: 1.2 } : {},
                        y: item.isEligible ? { repeat: Infinity, duration: 1.2 } : {}
                      }}
                      onClick={() => handleTokenSelect(item.token, item.player)}
                      className={`absolute w-7 h-7 rounded-full flex items-center justify-center select-none cursor-pointer shadow-[0_6px_16px_rgba(0,0,0,0.95)] border ${
                        item.isEligible
                          ? "ring-4 ring-amber-300 ring-offset-2 ring-offset-black z-40 animate-pulse border-white"
                          : "border-white/70"
                      }`}
                      style={{
                        backgroundColor: item.player.colorHex,
                        background: `radial-gradient(circle at 32% 28%, #ffffff 0%, rgba(255,255,255,0.7) 12%, ${item.player.colorHex} 48%, #080402 100%)`,
                        boxShadow: "0 6px 14px rgba(0,0,0,0.9), inset 0 -3px 6px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.8)"
                      }}
                    >
                      {/* Token Inner Icon or Finished Crown */}
                      {item.token.state === "FINISHED" ? (
                        <Crown className="w-4 h-4 text-amber-200 fill-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
                      ) : (
                        <span className="text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                          {item.token.id + 1}
                        </span>
                      )}

                      {/* Radiant Golden Glow Ring for Eligible Tokens */}
                      {item.isEligible && (
                        <span className="absolute -inset-1 rounded-full border border-amber-300 animate-ping opacity-75 pointer-events-none" />
                      )}
                    </motion.div>
                  );
                })}

                {/* Counter badge if multiple tokens are stacked on the same safe square */}
                {tokensInCell.length > 2 && (
                  <span className="absolute -bottom-1 -right-1 bg-black/90 text-amber-300 text-[9px] font-black px-1 rounded-full border border-amber-400 shadow z-50">
                    x{tokensInCell.length}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Bar: Player Token Status Summaries with Walnut & Brass Styling */}
      <div className="w-full mt-2.5 pt-2 border-t border-[#4a2612] flex items-center justify-between text-xs px-2 select-none">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-0.5">
          {Object.values(ludoState?.players || {}).map((lp) => {
            const isTurn = lp.playerId === activePlayerId;
            const pInfo = gameState.players[lp.playerId];
            const inBaseCount = lp.tokens.filter((t) => t.state === "HOME_BASE").length;
            const finishedCount = lp.finishedCount;

            return (
              <div
                key={lp.playerId}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                  isTurn
                    ? "bg-gradient-to-r from-[#241305] to-[#3a1f0a] border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/60"
                    : "bg-[#140a04]/80 border-[#3d1f0d]"
                }`}
              >
                {/* Miniature Glass Marble Indicator */}
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white/60 shadow"
                  style={{
                    backgroundColor: lp.colorHex,
                    background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${lp.colorHex} 60%, #000000 100%)`
                  }}
                />
                <span className="font-extrabold text-amber-100 text-[11px] truncate max-w-[80px]">
                  {pInfo?.name || lp.nameAr}
                </span>

                <div className="flex items-center gap-1.5 text-[10px] text-amber-200/80">
                  <span title="في المعسكر">🏠 {inBaseCount}</span>
                  <span title="في المركز">🏆 {finishedCount}/4</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Turn Status Badge with Brass Plate Effect */}
        <div className="shrink-0 text-[11px] font-black text-amber-300 flex items-center gap-1.5 bg-gradient-to-r from-[#2b1704] to-[#422206] px-3 py-1.5 rounded-xl border border-amber-500/50 shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>دور: {activePlayer?.name || "..."}</span>
          {ludoState?.pendingDiceRoll && (
            <span className="text-amber-200 font-bold">(نرد {ludoState.pendingDiceRoll})</span>
          )}
        </div>
      </div>
      </div>
    </WoodTabletopEnvironment>
  );
}
