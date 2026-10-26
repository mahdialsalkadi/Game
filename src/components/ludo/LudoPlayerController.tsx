"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Crown,
  Home,
  Flag,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import type { FullRoomState } from "@/game/gameRoom";
import { DiceShakerButton } from "@/components/common/RealisticDice3D";
import { sfx } from "@/utils/soundEffects";

export interface LudoPlayerControllerProps {
  gameState: FullRoomState;
  playerId: string;
  isMyTurn: boolean;
  sendAction: (payload: Record<string, unknown>) => void;
  triggerHaptic: (pattern: number | number[]) => void;
  showSmartHints?: boolean;
  playMode?: "CASUAL" | "PRO";
}

const REACTION_EMOJIS = ["😂", "😱", "🔥", "💀", "🤬", "🏆"];

export default function LudoPlayerController({
  gameState,
  playerId,
  isMyTurn,
  sendAction,
  triggerHaptic,
  showSmartHints = true,
  playMode = "CASUAL"
}: LudoPlayerControllerProps) {
  const ludoState = gameState.ludoState;
  const myPlayer = gameState.players[playerId];
  const myLudo = ludoState?.players?.[playerId];

  if (!myPlayer || !myLudo) return null;

  const pendingDice = isMyTurn ? ludoState?.pendingDiceRoll : undefined;
  const eligibleTokenIds = (isMyTurn ? ludoState?.eligibleTokenIds : []) || [];
  const finishedCount = myLudo.finishedCount || 0;

  const handleSelectToken = (tokenId: number) => {
    if (!isMyTurn || pendingDice === undefined) return;
    if (!eligibleTokenIds.includes(tokenId)) return;

    triggerHaptic([30, 25, 45]);
    sfx.playPawnHop();
    sendAction({ type: "MOVE_LUDO_TOKEN", tokenId });
  };

  const handleRollDice = () => {
    if (!isMyTurn || pendingDice !== undefined) return;
    triggerHaptic([40, 20]);
    sfx.playDiceShake();
    sendAction({ type: "ROLL_DICE" });
  };

  return (
    <div className="w-full flex flex-col items-center gap-3 font-sans select-none pb-4">
      {/* 1. Header & Progress Banner */}
      <div className="w-full max-w-xs p-3.5 rounded-2xl bg-slate-900/90 border border-[#3b2313] shadow-lg flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full border border-white/60 shadow"
              style={{ backgroundColor: myLudo.colorHex }}
            />
            <div>
              <div className="text-[10px] text-slate-400 font-bold">لون معسكرك</div>
              <div className="text-sm font-black text-white">{myLudo.nameAr}</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-bold">القطع في الهدف</div>
            <div className="text-sm font-black text-amber-400 flex items-center gap-1 justify-end">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{finishedCount} من 4</span>
            </div>
          </div>
        </div>

        {/* Goal Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(finishedCount / 4) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* 2. Interactive Token Selector Grid (4 Pawns) */}
      <div className="w-full max-w-xs flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs px-1 font-bold text-slate-300">
          <span>قطعك الأربعة (اختر للتحريك)</span>
          {pendingDice !== undefined && (
            <span className="text-amber-400 font-black animate-pulse">
              النرد: {pendingDice} 🎲
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {myLudo.tokens.map((token) => {
            const isEligible = eligibleTokenIds.includes(token.id);
            const isFinished = token.state === "FINISHED";
            const isAtHome = token.state === "HOME_BASE";
            const isInPath = token.state === "HOME_PATH";
            const isOnTrack = token.state === "ON_TRACK";

            let statusText = "في المعسكر 🏠";
            let statusColor = "text-slate-400";

            if (isFinished) {
              statusText = "في المركز 🏆";
              statusColor = "text-amber-400";
            } else if (isInPath) {
              statusText = `الممر الآمن (${token.stepCount - 50}/5)`;
              statusColor = "text-emerald-400";
            } else if (isOnTrack) {
              statusText = `المسار (${token.stepCount}/50)`;
              statusColor = "text-sky-300";
            }

            return (
              <motion.button
                key={`pawn-btn-${token.id}`}
                type="button"
                disabled={!isEligible}
                onClick={() => handleSelectToken(token.id)}
                whileHover={isEligible ? { scale: 1.03 } : {}}
                whileTap={isEligible ? { scale: 0.95 } : {}}
                className={`p-3 rounded-2xl border text-right flex flex-col justify-between transition-all relative overflow-hidden ${
                  isEligible
                    ? "bg-slate-900 border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.25)] cursor-pointer"
                    : isFinished
                    ? "bg-emerald-950/40 border-emerald-500/30 opacity-75"
                    : "bg-slate-950/60 border-slate-800 opacity-60"
                }`}
              >
                {/* Top Row: Pawn Badge & Number */}
                <div className="flex items-center justify-between w-full">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-white shadow-md border"
                    style={{
                      backgroundColor: myLudo.colorHex,
                      borderColor: "rgba(255,255,255,0.7)"
                    }}
                  >
                    {isFinished ? (
                      <Crown className="w-3.5 h-3.5 text-amber-200 fill-amber-300" />
                    ) : (
                      token.id + 1
                    )}
                  </div>

                  {isEligible && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow">
                      انقر للتحريك
                    </span>
                  )}
                </div>

                {/* Bottom Row: Status Text */}
                <div className="mt-2.5">
                  <div className="text-[11px] font-bold text-white">
                    القطعة {token.id + 1}
                  </div>
                  <div className={`text-[10px] font-extrabold ${statusColor}`}>
                    {statusText}
                  </div>
                </div>

                {/* Pulsing Highlight for Eligible Tokens (Casual Mode Only) */}
                {isEligible && showSmartHints && (
                  <motion.div
                    className="absolute inset-0 border-2 border-amber-300 rounded-2xl pointer-events-none"
                    animate={{ opacity: [0.4, 0.9, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 3. Action Section: Dice Shaker Button or Instructions */}
      <div className="w-full max-w-xs flex flex-col items-center mt-2">
        {isMyTurn ? (
          pendingDice === undefined ? (
            <div className="w-full flex flex-col items-center gap-2">
              <DiceShakerButton
                onRoll={handleRollDice}
                isRolling={false}
                diceCount={1}
                label="هز الكوب وارمِ النرد"
              />
              {showSmartHints && (
                <div className="text-[11px] text-amber-300/80 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>رمية 6 تخرج قطعة من المعسكر وتمنح دوراً إضافياً!</span>
                </div>
              )}
            </div>
          ) : (
            <div className={`w-full p-4 rounded-2xl bg-amber-950/80 border border-amber-500/50 shadow-xl flex items-center justify-between text-right ${showSmartHints ? "animate-pulse" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg">
                  {pendingDice}
                </div>
                <div>
                  <div className="text-xs text-amber-300 font-bold">
                    اختر القطعة المراد تحريكها
                  </div>
                  <div className="text-sm font-black text-white">
                    {eligibleTokenIds.length > 0
                      ? `لديك ${eligibleTokenIds.length} حركة متاحة أعلاه 👆`
                      : "لا توجد قطع مؤهلة للتحريك!"}
                  </div>
                  {showSmartHints && pendingDice === 6 && (
                    <div className="text-[11px] text-amber-300 font-extrabold mt-1">
                      💡 رميت 6! يمكنك إخراج قطعة جديدة من القاعدة أو تحريك قطعتك للأمام
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="w-full p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs font-bold text-center flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span>ترقب دورك... يلعب الآن خصمك في المجلس</span>
          </div>
        )}
      </div>

      {/* 4. Live Reactions Row */}
      <div className="w-full max-w-xs flex items-center justify-between mt-1 px-1">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              triggerHaptic(20);
              sendAction({ type: "SEND_REACTION", emoji });
            }}
            className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 text-xl hover:bg-slate-800 active:scale-75 transition-all flex items-center justify-center shadow select-none"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
