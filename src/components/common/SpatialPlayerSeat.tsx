"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Shield,
  Bot,
  Crown,
  Lock,
  Building2,
  Sparkles,
  Home
} from "lucide-react";
import type { ExtendedPlayerState } from "@/game/gameRoom";
import type { BoardTile } from "@/game/schema";
import { MONOPOLY_COLOR_GROUPS, type MonopolyColorGroupKey } from "@/game/monopolyEngine";
import { getPlayerInitials } from "@/utils/playerDisplay";

export interface SpatialPlayerSeatProps {
  player: ExtendedPlayerState;
  isCurrentTurn: boolean;
  ownedProperties?: BoardTile[];
  cardsCount?: number;
  currencySymbol?: string;
  positionClass: string;
  lastAnimation?: any;
  reaction?: { emoji: string; text?: string; id: string } | null;
  onSeatClick?: () => void;
}

// Authentic hex colors for Monopoly color groups
const COLOR_GROUP_PALETTE: Record<string, string> = {
  BROWN: "#78350f",
  LIGHT_BLUE: "#38bdf8",
  PINK: "#ec4899",
  ORANGE: "#f97316",
  RED: "#ef4444",
  YELLOW: "#eab308",
  GREEN: "#22c55e",
  DARK_BLUE: "#1e3a8a",
  STATION: "#475569",
  UTILITY: "#d97706"
};

export const SpatialPlayerSeat: React.FC<SpatialPlayerSeatProps> = ({
  player,
  isCurrentTurn,
  ownedProperties = [],
  cardsCount,
  currencySymbol = "$",
  positionClass,
  lastAnimation,
  reaction,
  onSeatClick
}) => {
  // Speech / Toast bubble message for this specific player
  const [activeToast, setActiveToast] = useState<{ message: string; icon?: string; type?: "money" | "deed" | "jail" | "turn" } | null>(null);

  // Watch lastAnimation events that directly target or involve this player
  useEffect(() => {
    if (!lastAnimation) return;

    let toastText = "";
    let icon = "✨";
    let toastType: "money" | "deed" | "jail" | "turn" = "turn";

    if (lastAnimation.type === "PROPERTY_BOUGHT" && lastAnimation.playerId === player.id) {
      toastText = `اشترى ${lastAnimation.tile?.name || "عقاراً"}!`;
      icon = "🏢";
      toastType = "deed";
    } else if (lastAnimation.type === "HOUSE_BUILT" && lastAnimation.playerId === player.id) {
      toastText = `شيّد مبنى جديداً!`;
      icon = "🏠";
      toastType = "deed";
    } else if (lastAnimation.type === "RENT_PAID") {
      if (lastAnimation.payerId === player.id) {
        toastText = `-${lastAnimation.rent} ${currencySymbol} إيجار`;
        icon = "💸";
        toastType = "money";
      } else if (lastAnimation.ownerId === player.id) {
        toastText = `+${lastAnimation.rent} ${currencySymbol} إيجار محصّل`;
        icon = "💰";
        toastType = "money";
      }
    } else if (lastAnimation.type === "SENT_TO_JAIL" && lastAnimation.playerId === player.id) {
      toastText = `سُجن في التوقيف! 🚨`;
      icon = "⛓️";
      toastType = "jail";
    } else if (lastAnimation.type === "JAIL_FINE_PAID" && lastAnimation.playerId === player.id) {
      toastText = `دفع الكفالة وخرج! 🕊️`;
      icon = "🔓";
      toastType = "jail";
    } else if (lastAnimation.type === "JACKPOT_COLLECTED" && lastAnimation.playerId === player.id) {
      toastText = `حصد المواقف +${lastAnimation.amount}! 🅿️`;
      icon = "💰";
      toastType = "money";
    } else if (lastAnimation.type === "BOT_THINKING" && lastAnimation.playerId === player.id) {
      toastText = `يدرس استراتيجيته... 🤔`;
      icon = "🤖";
      toastType = "turn";
    }

    if (toastText) {
      setActiveToast({ message: toastText, icon, type: toastType });
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [lastAnimation, player.id, currencySymbol]);

  // Derived properties display (up to 5 visible mini deed cards fanned out)
  const displayProperties = useMemo(() => {
    return ownedProperties.slice(0, 5);
  }, [ownedProperties]);

  const extraPropertiesCount = Math.max(0, ownedProperties.length - 5);

  // SVG Circular Timer Ring parameters
  const radius = 32;
  const circumference = 2 * Math.PI * radius;

  // Initials for avatar fallback (safe for Arabic, multi-word and bot names)
  const initials = getPlayerInitials(player.name);

  return (
    <div
      onClick={onSeatClick}
      className={`absolute z-20 flex flex-col items-center select-none pointer-events-auto transition-transform hover:scale-105 ${positionClass}`}
    >
      {/* ============================================================== */}
      {/* 1. DYNAMIC TOAST / SPEECH BUBBLE                               */}
      {/* ============================================================== */}
      <AnimatePresence>
        {(activeToast || reaction) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.7 }}
            animate={{ opacity: 1, y: -8, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute -top-12 z-30 flex flex-col items-center pointer-events-none whitespace-nowrap"
          >
            <div className="px-3 py-1 rounded-full bg-slate-950/95 border-2 border-amber-400 shadow-[0_8px_20px_rgba(0,0,0,0.85),0_0_15px_rgba(251,191,36,0.5)] flex items-center gap-1.5 backdrop-blur-md">
              <span className="text-sm">{reaction ? reaction.emoji : activeToast?.icon}</span>
              <span className="text-[11px] font-black text-amber-200">
                {reaction?.text || activeToast?.message}
              </span>
            </div>
            {/* Speech Bubble Arrow Indicator */}
            <div className="w-2.5 h-2.5 bg-slate-950 border-r-2 border-b-2 border-amber-400 rotate-45 -mt-1.5 shadow-md" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 2. AVATAR CONTAINER WITH RADIAL RING & FANNED DEEDS/CARDS     */}
      {/* ============================================================== */}
      <div className="relative flex items-center justify-center">

        {/* --- A. FANNED MONOPOLY TITLE DEED CARDS (سندات الملكية الملونة) --- */}
        {ownedProperties.length > 0 && (
          <div className="absolute -top-3.5 flex items-center justify-center pointer-events-none z-0">
            {displayProperties.map((prop, idx) => {
              const total = displayProperties.length;
              const angle = (idx - (total - 1) / 2) * 14;
              const yOffset = Math.abs(idx - (total - 1) / 2) * 2 - 4;
              const colorHex = (prop.colorGroup && COLOR_GROUP_PALETTE[prop.colorGroup]) || "#3b82f6";

              return (
                <div
                  key={prop.index}
                  style={{
                    transform: `rotate(${angle}deg) translateY(${yOffset}px)`,
                    boxShadow: "0 3px 8px rgba(0,0,0,0.6)"
                  }}
                  className="w-4 sm:w-5 h-6 sm:h-7 rounded-[3px] bg-[#fffbeb] border border-amber-900/40 flex flex-col overflow-hidden -ml-2.5 first:ml-0 transition-transform"
                >
                  {/* Top Color Group Stripe */}
                  <div
                    style={{ backgroundColor: colorHex }}
                    className="h-2 w-full border-b border-black/30 flex items-center justify-center"
                  >
                    {(prop.houses || 0) > 0 && (
                      <span className="text-[6px] text-white font-black leading-none">
                        {prop.houses === 5 ? "🏨" : "🏠"}
                      </span>
                    )}
                  </div>
                  {/* Deed Card Body */}
                  <div className="flex-1 bg-[#fffbeb] p-0.5 flex flex-col items-center justify-center">
                    <span className="text-[5px] sm:text-[6px] font-black text-slate-800 leading-none truncate max-w-full">
                      {prop.price || 100}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Extra Properties Overflow Badge */}
            {extraPropertiesCount > 0 && (
              <div className="w-4 h-4 rounded-full bg-amber-500 border border-amber-200 text-slate-950 font-black text-[8px] flex items-center justify-center shadow-md -ml-1 z-10">
                +{extraPropertiesCount}
              </div>
            )}
          </div>
        )}

        {/* --- B. FANNED PLAYING CARDS (لو كانت اللعبة أونو أو أوراق) --- */}
        {cardsCount !== undefined && cardsCount > 0 && ownedProperties.length === 0 && (
          <div className="absolute -top-3 flex items-center justify-center pointer-events-none z-0">
            {Array.from({ length: Math.min(cardsCount, 4) }).map((_, idx) => (
              <div
                key={idx}
                style={{ transform: `rotate(${(idx - 1.5) * 12}deg) translateY(-3px)` }}
                className="w-4 sm:w-5 h-6 sm:h-7 rounded-[3px] bg-gradient-to-b from-red-600 via-rose-700 to-red-900 border border-amber-300/60 shadow-md -ml-2.5 first:ml-0"
              />
            ))}
            {cardsCount > 4 && (
              <div className="w-3.5 h-3.5 rounded-full bg-red-600 border border-white text-white font-black text-[7px] flex items-center justify-center shadow -ml-1">
                {cardsCount}
              </div>
            )}
          </div>
        )}

        {/* --- C. SVG GLOWING TURN TIMER RING --- */}
        <svg className="w-[68px] sm:w-[76px] h-[68px] sm:h-[76px] -rotate-90 z-10" viewBox="0 0 76 76">
          {/* Static Background Border */}
          <circle
            cx="38"
            cy="38"
            r={radius}
            fill="none"
            stroke={player.color || "#38bdf8"}
            strokeWidth="3"
            strokeOpacity="0.45"
          />

          {/* Active Turn Radiant Golden Ring */}
          {isCurrentTurn && (
            <circle
              cx="38"
              cy="38"
              r={radius}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset="0"
              strokeLinecap="round"
              className="drop-shadow-[0_0_10px_rgba(251,191,36,0.95)] animate-pulse"
            />
          )}
        </svg>

        {/* --- D. CIRCULAR AVATAR BODY --- */}
        <div
          style={{ borderColor: player.color }}
          className={`absolute w-13 sm:w-14 h-13 sm:h-14 rounded-full overflow-hidden bg-gradient-to-b from-slate-800 to-slate-950 border-2 shadow-inner z-10 flex items-center justify-center ${
            isCurrentTurn ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950" : ""
          }`}
        >
          {(player as any).avatarUrl ? (
            <img src={(player as any).avatarUrl} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <div
              style={{ backgroundColor: `${player.color}25`, color: player.color }}
              className="w-full h-full flex items-center justify-center font-black text-sm sm:text-base drop-shadow"
            >
              {initials}
            </div>
          )}

          {/* Jail Icon Overlay */}
          {player.inJail && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-400 drop-shadow" />
            </div>
          )}
        </div>

        {/* Status / Bot Badge Beacon */}
        <div className="absolute bottom-0 right-0 z-20 flex items-center gap-0.5">
          {player.isBot ? (
            <div className="w-4 h-4 rounded-full bg-purple-600 border border-white/80 flex items-center justify-center text-[8px] text-white shadow">
              <Bot className="w-2.5 h-2.5" />
            </div>
          ) : (
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 border-slate-950 shadow ${
                player.isConnected ? "bg-emerald-400" : "bg-rose-500"
              }`}
            />
          )}

          {player.hasShield && (
            <div className="w-4 h-4 rounded-full bg-cyan-600 border border-cyan-200 flex items-center justify-center text-white shadow -ml-1">
              <Shield className="w-2.5 h-2.5 fill-cyan-200" />
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. NAME & BALANCE CAPSULE (كبسولة الاسم والرصيد المدمجة)        */}
      {/* ============================================================== */}
      <div className="-mt-1.5 z-20 px-2 sm:px-2.5 py-0.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-white/25 flex items-center gap-1.5 shadow-xl w-[104px] sm:w-[122px] max-w-[45vw]">
        <span
          style={{ color: isCurrentTurn ? "#fef08a" : "#f1f5f9" }}
          className="text-[10px] sm:text-[11px] font-black truncate leading-tight drop-shadow min-w-0 flex-1"
          title={player.name}
        >
          {player.name}
        </span>
        <div className="flex items-center gap-0.5 text-amber-400 text-[9.5px] sm:text-[10.5px] font-extrabold shrink-0">
          <Coins className="w-2.5 h-2.5 text-amber-300" />
          <span>{player.coins}</span>
        </div>
      </div>
    </div>
  );
};

export default SpatialPlayerSeat;
