"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trophy, AlertTriangle, Sparkles, TrendingUp } from "lucide-react";
import type { FullRoomState } from "@/game/gameRoom";
import { DiceShakerButton } from "@/components/common/RealisticDice3D";
import { LADDERS, SNAKES } from "./SnakesLaddersBoardView";

interface SnakesLaddersPlayerControllerProps {
  gameState: FullRoomState;
  playerId: string;
  isMyTurn: boolean;
  sendAction: (payload: Record<string, unknown>) => void;
  triggerHaptic: (pattern: number | number[]) => void;
  showSmartHints?: boolean;
  playMode?: "CASUAL" | "PRO";
}

export default function SnakesLaddersPlayerController({
  gameState,
  playerId,
  isMyTurn,
  sendAction,
  triggerHaptic,
  showSmartHints = true,
  playMode = "CASUAL"
}: SnakesLaddersPlayerControllerProps) {
  const player = gameState.players[playerId];
  if (!player) return null;

  const currentSquare = player.position + 1; // 1 to 100
  const progressPercent = Math.min(100, Math.round((currentSquare / 100) * 100));

  // Check if snake head or ladder base is within 6 steps
  let proximityAlert: { type: "ladder" | "snake"; target: number; dist: number } | null = null;
  for (let step = 1; step <= 6; step++) {
    const nextSq = currentSquare + step;
    if (LADDERS[nextSq]) {
      proximityAlert = { type: "ladder", target: nextSq, dist: step };
      break;
    } else if (SNAKES[nextSq]) {
      proximityAlert = { type: "snake", target: nextSq, dist: step };
      break;
    }
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* 1. Altitude Gauge Card */}
      <div className="w-full max-w-xs p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700 shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>موقعك على المسار</span>
          </div>
          <span className="text-base font-black text-amber-400 font-mono">
            {currentSquare} / 100 🏔️
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 shadow"
          />
        </div>

        {/* Proximity Warning (Casual Mode Only) */}
        {showSmartHints && proximityAlert && (
          <div
            className={`p-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border ${
              proximityAlert.type === "ladder"
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                : "bg-rose-950/80 border-rose-500/50 text-rose-300 animate-pulse"
            }`}
          >
            {proximityAlert.type === "ladder" ? (
              <>
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>فرصة: سلم يصعد بك في المربع {proximityAlert.target}! 🪜</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>احذر: رأس ثعبان في المربع {proximityAlert.target}! 🐍</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* 2. Single Die Shaker */}
      {isMyTurn && gameState.phase === "TURN_START" && (
        <DiceShakerButton
          onRoll={() => {
            sendAction({ type: "ROLL_DICE" });
          }}
          isRolling={false}
          label="ارمِ نرد السلم والثعبان 🎲"
          diceCount={1}
        />
      )}
    </div>
  );
}
