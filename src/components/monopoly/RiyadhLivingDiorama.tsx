"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  Coins,
  Sparkles,
  Dices,
  ChevronRight,
  ShieldAlert,
  Flame,
  Award
} from "lucide-react";
import type { ExtendedPlayerState } from "@/game/gameRoom";
import RealisticDice3D from "../common/RealisticDice3D";
import MonopolyPawn3D, {
  TOKEN_NAMES_AR,
  TOKEN_TYPES,
  type MonopolyTokenType
} from "./MonopolyPawn3D";
import LiveEventTicker from "../LiveEventTicker";
import { getDioramaMeta, DioramaSceneRenderer } from "./dioramas";

export interface RiyadhLivingDioramaProps {
  lastRoll?: { dice1: number; dice2: number } | null;
  isRollingDice?: boolean;
  jackpot?: number;
  activePlayer?: ExtendedPlayerState;
  activeTokenType?: MonopolyTokenType;
  lastAnimation?: any;
  onCommunityChestClick?: () => void;
  onChanceClick?: () => void;
  className?: string;
  showTabletopElements?: boolean;
  currencySymbol?: string;
  themeId?: string;
  themeTitle?: string;
  children?: React.ReactNode;
}

export default function RiyadhLivingDiorama({
  lastRoll,
  isRollingDice = false,
  jackpot = 150,
  activePlayer,
  activeTokenType = "FALCON",
  lastAnimation,
  onCommunityChestClick,
  onChanceClick,
  className = "",
  showTabletopElements = true,
  currencySymbol = "$",
  themeId,
  themeTitle,
  children
}: RiyadhLivingDioramaProps) {
  // Dice total calculation
  const diceTotal = useMemo(() => {
    if (!lastRoll) return null;
    return (lastRoll.dice1 ?? 3) + (lastRoll.dice2 ?? 4);
  }, [lastRoll]);

  const isDouble = lastRoll && lastRoll.dice1 === lastRoll.dice2;

  const dioramaMeta = useMemo(() => {
    return getDioramaMeta(currencySymbol, themeId, themeTitle);
  }, [currencySymbol, themeId, themeTitle]);

  const isClassic = dioramaMeta.themeKey === "CLASSIC";

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between items-center select-none overflow-hidden rounded-2xl ${className}`}
      style={{
        background: dioramaMeta.skyGradient
      }}
    >
      {/* ========================================================================= */}
      {/* 1. MODULAR LIVING 3D VECTOR DIORAMA (DEDICATED PER-MAP SCENE)             */}
      {/* ========================================================================= */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        viewBox="0 0 1200 780"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <DioramaSceneRenderer themeKey={dioramaMeta.themeKey} />
      </svg>

      {/* ========================================================================= */}
      {/* 2. INTEGRATED TABLETOP ELEMENTS (LUXURY CASINO & BOARD EXPERIENCE)        */}
      {/* ========================================================================= */}
      {showTabletopElements && (
        <>
          {/* --- TOP STAGE BAR: Discreet Free Parking Vault Pill --- */}
          <div className="w-full flex items-center justify-end px-2 sm:px-4 pt-1 sm:pt-2 z-10">
            {/* Free Parking Vault Jackpot Pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-950/80 border border-amber-400/60 shadow-md backdrop-blur-md shrink-0"
            >
              <div className="relative flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 shadow shrink-0">
                <Coins className="w-2.5 h-2.5 text-slate-950" />
              </div>
              <div className="flex items-center gap-1 text-[9px] sm:text-[11px] font-black text-amber-200">
                <span className="text-[10px]">🅿️</span>
                <span className="text-white font-black">{jackpot}</span>
                <span className="text-amber-400 text-[8px] sm:text-[9px]">{currencySymbol}</span>
              </div>
            </motion.div>
          </div>

          {/* --- MIDDLE TABLETOP STAGE: Felt Dice Tray & Embossed Decks --- */}
          <div className="w-full flex items-center justify-around my-auto z-10 px-1 sm:px-6">
            {/* LEFT: Community Chest Card Deck */}
            <div
              onClick={onCommunityChestClick}
              className="hidden sm:flex flex-col items-center gap-1.5 cursor-pointer group select-none"
            >
              <motion.div
                whileHover={{ scale: 1.08, rotate: -4, y: -4 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className="w-20 md:w-24 h-28 md:h-34 rounded-xl bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#022c22] border-2 border-amber-400 shadow-[0_12px_28px_rgba(0,0,0,0.85),0_0_15px_rgba(4,120,87,0.35),inset_0_2px_4px_rgba(255,255,255,0.35)] flex flex-col items-center justify-between p-2 text-center rotate-[-5deg] relative overflow-hidden"
              >
                {/* 3D Stacked Under-Cards Depth Illusion */}
                <div className="absolute -bottom-1 -left-1 w-full h-full rounded-xl bg-emerald-950/80 -z-10 pointer-events-none" />
                <div className="absolute -bottom-2 -left-2 w-full h-full rounded-xl bg-emerald-950/60 -z-20 pointer-events-none" />

                {/* Embossed 24k Gold Foil Filigree Edge */}
                <div className="absolute inset-1 rounded-lg border border-dashed border-amber-300/80 pointer-events-none" />

                {/* Header Title */}
                <div className="text-[9px] font-black text-amber-200 drop-shadow flex items-center gap-0.5 z-10">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{dioramaMeta.chestTitle}</span>
                </div>

                {/* Golden Treasure Chest Crest */}
                <div className="my-auto z-10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.6)] border-2 border-amber-200 group-hover:rotate-6 transition-transform">
                    <span className="text-xl drop-shadow">🎁</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-[7px] text-amber-200 font-black tracking-widest z-10 uppercase">
                  {dioramaMeta.chestSub}
                </div>
              </motion.div>
              <span className="text-[8.5px] font-extrabold text-amber-300 drop-shadow bg-slate-950/70 px-1.5 py-0.2 rounded-full border border-amber-400/40">
                {dioramaMeta.chestTitle}
              </span>
            </div>

            {/* CENTER: 3D Felt Dice Tray with Authentic Proportions */}
            <div className="relative flex flex-col items-center justify-center scale-[0.62] sm:scale-80 md:scale-95 origin-center my-auto transition-transform filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.9)]">
              <RealisticDice3D
                values={[lastRoll?.dice1 ?? 3, lastRoll?.dice2 ?? 4]}
                isRolling={isRollingDice}
                size="sm"
                showTray={true}
              />

              {/* Dice Total Announcement Callout Badge */}
              {lastRoll && !isRollingDice && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-1 px-2.5 sm:px-3 py-0.5 rounded-full bg-slate-950/95 border border-amber-400/80 text-[8.5px] sm:text-[10px] font-black text-amber-200 shadow-md flex items-center gap-1 sm:gap-1.5 backdrop-blur-sm whitespace-nowrap"
                >
                  <Dices className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 text-amber-300" />
                  <span>مجموع الرمية: {diceTotal}</span>
                  {isDouble && (
                    <span className="text-white font-extrabold mr-1 bg-amber-600/70 px-1.5 py-0.2 rounded-full border border-amber-300 text-[7.5px] sm:text-[9px]">
                      (دبل! 🎲🎲)
                    </span>
                  )}
                </motion.div>
              )}
            </div>

            {/* RIGHT: Chance Card Deck */}
            <div
              onClick={onChanceClick}
              className="hidden sm:flex flex-col items-center gap-1.5 cursor-pointer group select-none"
            >
              <motion.div
                whileHover={{ scale: 1.08, rotate: 4, y: -4 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className="w-24 md:w-28 h-32 md:h-38 rounded-2xl bg-gradient-to-br from-[#831843] via-[#be185d] to-[#500724] border-2 border-amber-400 shadow-[0_16px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(190,24,93,0.35),inset_0_2px_4px_rgba(255,255,255,0.35)] flex flex-col items-center justify-between p-2.5 text-center rotate-[5deg] relative overflow-hidden"
              >
                {/* 3D Stacked Under-Cards Depth Illusion */}
                <div className="absolute -bottom-1 -right-1 w-full h-full rounded-xl bg-rose-950/80 -z-10 pointer-events-none" />
                <div className="absolute -bottom-2 -right-2 w-full h-full rounded-xl bg-rose-950/60 -z-20 pointer-events-none" />

                {/* Embossed 24k Gold Foil Filigree Edge */}
                <div className="absolute inset-1 rounded-lg border border-dashed border-amber-300/80 pointer-events-none" />

                {/* Header Title */}
                <div className="text-[9px] font-black text-amber-200 drop-shadow flex items-center gap-0.5 z-10">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{dioramaMeta.chanceTitle}</span>
                </div>

                {/* Golden Question Mark Crest */}
                <div className="my-auto z-10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.6)] border-2 border-amber-200 group-hover:-rotate-6 transition-transform">
                    <span className="text-xl drop-shadow">❓</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-[7px] text-amber-200 font-black tracking-widest z-10 uppercase">
                  {dioramaMeta.chanceSub}
                </div>
              </motion.div>
              <span className="text-[8.5px] font-extrabold text-amber-300 drop-shadow bg-slate-950/70 px-1.5 py-0.2 rounded-full border border-amber-400/40">
                {dioramaMeta.chanceTitle}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Custom Children Slot if passed */}
      {children}
    </div>
  );
}
