"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCw,
  RotateCcw,
  Sparkles,
  Flame,
  Shield,
  Layers,
  Crown,
  Volume2,
  VolumeX,
  FastForward,
  Trophy,
  Gem
} from "lucide-react";
import type { FullRoomState } from "@/game/gameRoom";
import type { UnoCard, UnoSanitizedState, UnoActiveColor } from "@/game/unoEngine";
import { UNO_COLOR_CONFIG } from "@/game/unoEngine";
import WoodTabletopEnvironment from "@/components/common/WoodTabletopEnvironment";
import { sfx } from "@/utils/soundEffects";
import { getPlayerInitials } from "@/utils/playerDisplay";

interface UnoCardTableViewProps {
  gameState: FullRoomState;
  sendAction?: (payload: Record<string, unknown>) => void;
}

export default function UnoCardTableView({ gameState, sendAction }: UnoCardTableViewProps) {
  const uno = gameState.unoState as UnoSanitizedState | undefined;
  const [animatingCard, setAnimatingCard] = useState<{
    card: UnoCard;
    fromPlayerId: string;
  } | null>(null);

  const activePlayerId = gameState.turnOrder[gameState.currentTurnIndex];
  const activePlayer = gameState.players[activePlayerId];

  // Track card slap audio & animation when topCard changes
  useEffect(() => {
    if (uno?.lastPlayedCard && uno.lastPlayedBy) {
      setAnimatingCard({
        card: uno.lastPlayedCard,
        fromPlayerId: uno.lastPlayedBy
      });
      sfx.playCardSlap();

      const timer = setTimeout(() => {
        setAnimatingCard(null);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [uno?.topCard?.id, uno?.lastPlayedBy]);

  // Audio trigger on UNO shout
  useEffect(() => {
    if (uno?.lastActionMessageAr && uno.lastActionMessageAr.includes("أونو")) {
      sfx.playUnoShout();
    }
  }, [uno?.lastActionMessageAr]);

  const playersList = useMemo(() => {
    return gameState.turnOrder.map((pid) => gameState.players[pid]).filter(Boolean);
  }, [gameState.turnOrder, gameState.players]);

  const numPlayers = Math.max(2, playersList.length);

  // Position players around the oval table
  // theta = 2*PI * i / N - PI/2 (starting from top)
  const getPlayerPositionStyle = (index: number) => {
    const angle = (2 * Math.PI * index) / numPlayers - Math.PI / 2;
    // Oval radii in percentages: rx = 41%, ry = 36%
    const rx = 41;
    const ry = 36;
    const x = 50 + rx * Math.cos(angle);
    const y = 50 + ry * Math.sin(angle);
    return {
      left: `${x}%`,
      top: `${y}%`,
      transform: "translate(-50%, -50%)"
    };
  };

  const activeColorConfig = uno?.activeColor
    ? UNO_COLOR_CONFIG[uno.activeColor]
    : UNO_COLOR_CONFIG.RED;

  return (
    <WoodTabletopEnvironment
      variant="mahogany"
      showPlanks={true}
      showSpotlight={true}
      className="p-2 md:p-4 flex flex-col items-center justify-center overflow-hidden"
    >
      <div
        dir="rtl"
        className="relative w-full h-full flex flex-col items-center justify-center p-2 select-none overflow-hidden z-10"
      >
      {/* Table Overhead Ambient Illumination with Active Color Tint */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-1000"
        style={{
          background: `radial-gradient(ellipse at center, ${activeColorConfig.hex}25 0%, #03140c 60%, #010604 100%)`
        }}
      />

      {/* ========================================================= */}
      {/* THE LUXURIOUS CASINO FELT TABLE                           */}
      {/* Oval Padded Mahogany & Stitched Leather Armrest Bumper    */}
      {/* ========================================================= */}
      <div
        className="relative w-full max-w-5xl h-[82vh] max-h-[690px] rounded-[190px] md:rounded-[230px] border-[14px] md:border-[18px] border-[#18110b] shadow-[0_35px_100px_rgba(0,0,0,0.98),inset_0_3px_6px_rgba(255,220,180,0.2),inset_0_-6px_16px_rgba(0,0,0,0.9)] flex items-center justify-center overflow-visible"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, #0e6344 0%, #08432d 45%, #032417 80%, #01140c 100%)",
          backgroundImage: `
            radial-gradient(ellipse at 50% 50%, #0e6344 0%, #08432d 45%, #032417 80%, #01140c 100%),
            repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px)
          `
        }}
      >
        {/* Padded Leather Armrest Inner Tone */}
        <div className="absolute -inset-[14px] md:-inset-[18px] rounded-[190px] md:rounded-[230px] bg-gradient-to-b from-[#2b1c14]/40 via-transparent to-[#100a06]/80 pointer-events-none" />

        {/* Golden Stitched Seam on Leather Rail */}
        <div className="absolute inset-1.5 md:inset-2 rounded-[180px] md:rounded-[220px] border-2 border-dashed border-amber-600/40 pointer-events-none" />

        {/* Polished Brass Bevel Trim Ring */}
        <div className="absolute inset-3.5 md:inset-4.5 rounded-[172px] md:rounded-[212px] border-2 border-amber-400/60 shadow-[0_0_15px_rgba(212,175,55,0.35),inset_0_0_10px_rgba(212,175,55,0.2)] pointer-events-none" />

        {/* Casino Baize Inner Stitched Line */}
        <div className="absolute inset-8 md:inset-10 rounded-[150px] md:rounded-[190px] border border-dashed border-emerald-300/25 pointer-events-none" />

        {/* Table Felt Center Gold Watermark Silkscreen */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-15 select-none">
          <div className="flex items-center gap-4 text-amber-300">
            <span className="text-2xl">♠</span>
            <span className="text-7xl md:text-8xl font-black tracking-widest uppercase">
              UNO
            </span>
            <span className="text-2xl">♦</span>
          </div>
          <span className="text-base md:text-lg font-bold text-amber-200 mt-1 tracking-wider">
            طاولة النخبة التكتيكية • CASINO ROYALE
          </span>
          <div className="flex items-center gap-3 text-amber-400/80 text-xs mt-1">
            <span>♣</span>
            <span className="text-[10px] tracking-widest uppercase">VIP HIGH-ROLLER SUITE</span>
            <span>♥</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* GLOWING DIRECTION ORBIT RING EMBEDDED IN BAIZE FELT       */}
        {/* ========================================================= */}
        <div className="absolute w-72 h-72 md:w-84 md:h-84 rounded-full pointer-events-none flex items-center justify-center">
          <motion.div
            animate={{ rotate: (uno?.direction ?? 1) === 1 ? 360 : -360 }}
            transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
            className="w-full h-full rounded-full border border-dashed border-amber-400/50 relative shadow-[0_0_20px_rgba(245,158,11,0.25)]"
          >
            {/* Top Direction Indicator Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-amber-300 bg-gradient-to-r from-[#1c1208] to-[#2c1d0c] px-2.5 py-0.5 rounded-full border border-amber-400/60 text-[10px] font-black shadow-md">
              {(uno?.direction ?? 1) === 1 ? (
                <>
                  <span>مع عقارب الساعة</span>
                  <RotateCw className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: "8s" }} />
                </>
              ) : (
                <>
                  <span>عكس عقارب الساعة</span>
                  <RotateCcw className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: "8s" }} />
                </>
              )}
            </div>

            {/* Orbit Glow Chevrons */}
            <div className="absolute top-1/2 -right-3 -translate-y-1/2 text-amber-400 font-black text-xs drop-shadow-[0_0_6px_#f59e0b]">
              {(uno?.direction ?? 1) === 1 ? "▼" : "▲"}
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-amber-400 font-black text-xs drop-shadow-[0_0_6px_#f59e0b]">
              {(uno?.direction ?? 1) === 1 ? "◀" : "▶"}
            </div>
            <div className="absolute top-1/2 -left-3 -translate-y-1/2 text-amber-400 font-black text-xs drop-shadow-[0_0_6px_#f59e0b]">
              {(uno?.direction ?? 1) === 1 ? "▲" : "▼"}
            </div>
          </motion.div>
        </div>

        {/* Active Wild Color Orb / Ambient Radiance across Felt */}
        <div
          className="absolute w-72 h-72 md:w-80 md:h-80 rounded-full pointer-events-none transition-all duration-700 blur-3xl opacity-35"
          style={{ backgroundColor: activeColorConfig.hex }}
        />

        {/* ========================================================= */}
        {/* CENTER TABLE PLAY AREA: Draw Pile & Discard Pile          */}
        {/* ========================================================= */}
        <div className="relative z-20 flex items-center justify-center gap-7 md:gap-12">
          {/* 1. Draw Pile (كومة السحب): Multi-Layered 3D Deck Thickness */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-36 md:w-28 md:h-40 cursor-default group">
              {/* Layer 6 (Bottom Core Edge) */}
              <div
                className="absolute inset-0 rounded-xl bg-[#c8c8c8] border border-black/40"
                style={{
                  transform: "translate(7px, 7px)",
                  boxShadow: "-8px 14px 25px rgba(0,0,0,0.9)"
                }}
              />
              {/* Layer 5 (Card Stock Edge) */}
              <div
                className="absolute inset-0 rounded-xl bg-[#1c1c1c] border-b border-white/20"
                style={{ transform: "translate(6px, 6px)" }}
              />
              {/* Layer 4 (Card Stock White Edge) */}
              <div
                className="absolute inset-0 rounded-xl bg-[#f0f0f0] border-b border-black/30"
                style={{ transform: "translate(4.5px, 4.5px)" }}
              />
              {/* Layer 3 (Card Stock Edge) */}
              <div
                className="absolute inset-0 rounded-xl bg-[#e0e0e0] border-b border-black/20"
                style={{ transform: "translate(3px, 3px)" }}
              />
              {/* Layer 2 (Card Stock Edge) */}
              <div
                className="absolute inset-0 rounded-xl bg-[#181818] border-b border-white/10"
                style={{ transform: "translate(1.5px, 1.5px)" }}
              />

              {/* Top Face-Down Card of Casino Deck */}
              <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-[#12081f] via-[#1a0e2e] to-[#0d0718] border-2 border-amber-400 shadow-2xl flex flex-col items-center justify-center p-2 overflow-hidden">
                {/* Gilded Border Accent */}
                <div className="absolute inset-1 rounded-lg border border-amber-500/40 pointer-events-none" />

                {/* Classic Casino Oval Uno Logo */}
                <div className="w-16 h-24 md:w-18 md:h-28 rounded-full bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 border border-white/50 flex items-center justify-center rotate-[-25deg] shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
                  <span className="font-black text-white text-base md:text-lg tracking-wider drop-shadow-md">
                    UNO
                  </span>
                </div>
                <div className="absolute bottom-1.5 font-bold text-[10px] text-amber-300">
                  سحب
                </div>
              </div>
            </div>

            {/* Deck Count Brass Badge */}
            <div className="mt-3 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#201408] to-[#34220c] border border-amber-400/50 text-[11px] font-black text-amber-300 shadow-lg flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-amber-400" />
              <span>كومة السحب: {uno?.deckCount ?? 108}</span>
            </div>
          </div>

          {/* 2. Discard Pile / Top Card (Realistically Tossed Cards) */}
          <div className="flex flex-col items-center">
            <div className="relative w-28 h-40 md:w-32 md:h-48 flex items-center justify-center">
              {/* Active Color Ambient Baize Glow */}
              <div
                className="absolute -inset-3 rounded-2xl blur-lg opacity-75 transition-all duration-500 animate-pulse"
                style={{ backgroundColor: activeColorConfig.hex }}
              />

              {/* Tossed Previous Card 1 (Haphazard organic rotation on felt) */}
              <div
                className="absolute w-28 h-40 md:w-32 md:h-48 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/20 shadow-xl opacity-60 pointer-events-none"
                style={{
                  transform: "rotate(-10deg) translate(-4px, 4px)"
                }}
              />

              {/* Tossed Previous Card 2 (Haphazard organic rotation on felt) */}
              <div
                className="absolute w-28 h-40 md:w-32 md:h-48 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/25 shadow-xl opacity-80 pointer-events-none"
                style={{
                  transform: "rotate(6deg) translate(3px, -2px)"
                }}
              />

              {/* The Active Top Card */}
              {uno?.topCard ? (
                <motion.div
                  key={uno.topCard.id}
                  initial={{ scale: 1.3, rotate: 14, opacity: 0 }}
                  animate={{ scale: 1, rotate: -2, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 340, damping: 22 }}
                  className="relative w-full h-full shadow-[0_15px_35px_rgba(0,0,0,0.9)] z-10"
                >
                  <UnoCardItem card={uno.topCard} activeColor={uno.activeColor} size="lg" />
                </motion.div>
              ) : (
                <div className="w-full h-full rounded-2xl border-2 border-dashed border-amber-400/40 flex items-center justify-center text-amber-200 text-xs bg-black/40">
                  بانتظار البدء
                </div>
              )}
            </div>

            {/* Active Color Gemstone Orb Badge */}
            <div
              style={{ backgroundColor: activeColorConfig.hex }}
              className="mt-3 px-3.5 py-1 rounded-full text-white text-xs font-black shadow-[0_4px_12px_rgba(0,0,0,0.7)] flex items-center gap-1.5 border border-white/60"
            >
              <Gem className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>اللون النشط: {activeColorConfig.nameAr}</span>
            </div>
          </div>
        </div>

        {/* Flying Card Animation Overlay */}
        <AnimatePresence>
          {animatingCard && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0.8, y: -90 }}
              animate={{ scale: 1.12, opacity: 1, y: 0 }}
              exit={{ scale: 1, opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="absolute z-50 pointer-events-none"
            >
              <UnoCardItem card={animatingCard.card} activeColor={uno?.activeColor} size="md" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================= */}
        {/* PLAYERS AROUND THE TABLE (2 to 6 VIP High-Roller Seats)   */}
        {/* ========================================================= */}
        {playersList.map((player, idx) => {
          const isTurn = player.id === activePlayerId;
          const posStyle = getPlayerPositionStyle(idx);
          const handCount = uno?.playerCardCounts?.[player.id] ?? 7;
          const hasShoutedUno = Boolean(uno?.unoShouted?.[player.id] && handCount === 1);

          return (
            <div
              key={player.id}
              style={posStyle}
              className={`absolute z-30 flex flex-col items-center transition-transform duration-300 ${
                isTurn ? "scale-110 z-40" : "scale-95"
              }`}
            >
              {/* UNO Shout Flame Badge */}
              <AnimatePresence>
                {hasShoutedUno && (
                  <motion.div
                    initial={{ scale: 0, y: 10 }}
                    animate={{ scale: 1.15, y: -8 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="absolute -top-7 px-3 py-0.5 rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white font-black text-xs shadow-xl border border-yellow-300 flex items-center gap-1 animate-bounce"
                  >
                    <Flame className="w-3.5 h-3.5 text-yellow-200 fill-yellow-200" />
                    <span>أونو! 🔥</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Player Avatar Circle with Brass Bezel */}
              <div className="relative">
                {isTurn && (
                  <div
                    className="absolute -inset-2 rounded-full blur-md animate-pulse"
                    style={{ backgroundColor: player.color }}
                  />
                )}
                <div
                  style={{
                    backgroundColor: player.color,
                    borderColor: isTurn ? "#FBBF24" : "#e2d1a6"
                  }}
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-4 shadow-2xl flex items-center justify-center font-black text-slate-950 text-base md:text-lg relative z-10 transition-all ${
                    isTurn ? "ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-950" : ""
                  }`}
                >
                  {getPlayerInitials(player.name)}
                  {player.isBot && (
                    <span className="absolute -bottom-1 -left-1 text-[10px] bg-slate-900 border border-slate-700 rounded-full px-1 text-white shadow">
                      🤖
                    </span>
                  )}
                </div>
              </div>

              {/* Player Name & Casino Seat Plaque */}
              <div className="mt-1 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-[#180e06] to-[#2b180a] border border-amber-600/40 text-center shadow-lg max-w-[120px] truncate">
                <span className="text-xs font-black text-amber-100 block truncate">{player.name}</span>
                {isTurn ? (
                  <span className="text-[10px] font-black text-amber-400 block animate-pulse">
                    دوره الآن 🎮
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-200/70 block">
                    {handCount} {handCount === 1 ? "ورقة واحدة!" : "أوراق"}
                  </span>
                )}
              </div>

              {/* Fan of Face-Down Cards Held by Player with Multi-Ply White Edges */}
              <div className="relative h-9 w-24 flex items-center justify-center mt-1">
                {Array.from({ length: Math.min(handCount, 7) }).map((_, cIdx, arr) => {
                  const mid = (arr.length - 1) / 2;
                  const rot = (cIdx - mid) * 8;
                  const xOffset = (cIdx - mid) * 11;

                  return (
                    <div
                      key={cIdx}
                      style={{
                        transform: `translateX(${xOffset}px) rotate(${rot}deg)`,
                        zIndex: cIdx
                      }}
                      className="absolute w-6 h-9 md:w-7 md:h-10 rounded-md bg-gradient-to-br from-slate-900 to-indigo-950 border-2 border-white shadow-md flex items-center justify-center overflow-hidden"
                    >
                      <div className="w-3.5 h-5 rounded-full bg-red-600/70 border border-amber-300/40 rotate-[-20deg]" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Live Action Narrator Announcement */}
      <footer className="w-full max-w-4xl mt-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#160d05] via-[#241508] to-[#160d05] border border-amber-600/40 flex items-center justify-between text-xs md:text-sm shadow-2xl">
        <div className="flex items-center gap-2 text-amber-300 overflow-hidden">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-extrabold truncate">
            {uno?.lastActionMessageAr || "طاولة الكازينو جاهزة! العب ورقة تطابق اللون أو الرمز."}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-amber-200/80">
            صاحب الدور: <strong className="text-white">{activePlayer?.name}</strong>
          </span>
        </div>
      </footer>
      </div>
    </WoodTabletopEnvironment>
  );
}

/**
 * Authentic Uno Card Component (Renders front face with colors, oval, glossy sheen overlay)
 */
export function UnoCardItem({
  card,
  activeColor,
  size = "md"
}: {
  card: UnoCard;
  activeColor?: UnoActiveColor;
  size?: "sm" | "md" | "lg";
}) {
  const isWild = card.color === "WILD";
  const displayColor = isWild && activeColor ? activeColor : (card.color as UnoActiveColor);
  const colorCfg = UNO_COLOR_CONFIG[displayColor] || UNO_COLOR_CONFIG.RED;

  const sizeClasses = {
    sm: "w-16 h-24 text-xs rounded-xl",
    md: "w-24 h-36 text-base rounded-2xl",
    lg: "w-28 h-40 md:w-32 md:h-48 text-xl rounded-2xl"
  }[size];

  return (
    <div
      className={`relative ${sizeClasses} select-none border-2 md:border-4 border-white shadow-2xl flex flex-col justify-between p-2 overflow-hidden transition-transform ${
        isWild
          ? "bg-gradient-to-tr from-slate-950 via-purple-950 to-slate-900"
          : colorCfg.bgClass
      }`}
    >
      {/* Glossy Sheen Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-black/30 pointer-events-none" />

      {/* Top Left Corner Number/Symbol */}
      <div className="text-white font-black text-xs md:text-sm drop-shadow leading-none z-10">
        {card.label}
      </div>

      {/* Center Tilted White Oval */}
      <div className="relative mx-auto my-auto w-14 h-20 md:w-18 md:h-28 rounded-full bg-white shadow-inner border border-black/10 flex items-center justify-center rotate-[-22deg] z-10">
        {isWild ? (
          <div className="grid grid-cols-2 grid-rows-2 w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border border-black/20 shadow">
            <div className="bg-red-600" />
            <div className="bg-blue-600" />
            <div className="bg-yellow-500" />
            <div className="bg-emerald-600" />
          </div>
        ) : (
          <span
            style={{ color: colorCfg.hex }}
            className="font-black text-2xl md:text-4xl drop-shadow-sm rotate-[22deg]"
          >
            {card.symbol}
          </span>
        )}
      </div>

      {/* Bottom Right Corner Inverted Number/Symbol */}
      <div className="text-white font-black text-xs md:text-sm drop-shadow leading-none self-end rotate-180 z-10">
        {card.label}
      </div>
    </div>
  );
}
