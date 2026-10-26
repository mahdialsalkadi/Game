"use client";

import React from "react";
import { motion } from "framer-motion";
import { Crown, Bot } from "lucide-react";
import type { ExtendedPlayerState } from "@/game/gameRoom";
import { getPlayerInitials } from "@/utils/playerDisplay";

/** شارة لاعب موحّدة الشكل لكن تُلوّن وتُستخدم داخل كل طاولة بطريقتها. */
export function PlayerPill({
  player,
  isActive,
  trailing,
  compact = false
}: {
  player: ExtendedPlayerState;
  isActive?: boolean;
  trailing?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative flex items-center gap-2 rounded-2xl px-2.5 py-1.5 border transition ${
        isActive
          ? "bg-white/10 border-white/30 shadow-[0_0_18px_rgba(255,255,255,0.12)]"
          : "bg-black/25 border-white/10"
      }`}
    >
      <span
        style={{ backgroundColor: player.color }}
        className={`${compact ? "w-6 h-6 text-[9px]" : "w-7 h-7 text-[10px]"} rounded-full border border-white/70 flex items-center justify-center font-black text-slate-950 shrink-0`}
      >
        {getPlayerInitials(player.name)}
      </span>
      <div className="min-w-0 text-right">
        <div className="flex items-center gap-1">
          <span className={`${compact ? "text-[10px]" : "text-[11px]"} font-black truncate max-w-[90px]`}>
            {player.name}
          </span>
          {player.isBot && <Bot className="w-3 h-3 text-slate-400" />}
          {player.isEliminated && <span className="text-[9px] text-rose-400 font-black">☠</span>}
        </div>
        {trailing ? <div className="text-[9px] font-bold text-white/50">{trailing}</div> : null}
      </div>
      {isActive && (
        <motion.span
          layoutId="active-turn-crown"
          className="absolute -top-2 -right-1 text-amber-300"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Crown className="w-3.5 h-3.5 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
        </motion.span>
      )}
    </div>
  );
}

export function TableStat({
  label,
  value,
  accent = "text-white",
  hint
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-black/30 border border-white/10 px-2.5 py-1.5 text-center min-w-[62px]">
      <div className={`text-sm font-black leading-tight ${accent}`}>{value}</div>
      <div className="text-[9px] font-bold text-white/40 leading-tight">{label}</div>
      {hint && <div className="text-[8px] text-white/30">{hint}</div>}
    </div>
  );
}

export function TurnBanner({ name, color, text }: { name?: string; color?: string; text: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/45 border border-white/15 backdrop-blur-md">
      <span className="relative flex w-2 h-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </span>
      <span className="text-[11px] font-bold text-white/70">{text}</span>
      {name && (
        <span style={{ color }} className="text-[11px] font-black truncate max-w-[110px]" title={name}>
          {name}
        </span>
      )}
    </div>
  );
}
