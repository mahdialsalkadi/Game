"use client";

import React, { useMemo, useState } from "react";
import type { FullRoomState, ExtendedPlayerState } from "@/game/gameRoom";
import type { BoardTile } from "@/game/schema";
import type { MonopolyTokenType } from "./MonopolyPawn3D";
import { getPlayerInitials } from "@/utils/playerDisplay";

interface LuxuryMonopolyBoardSVGProps {
  gameState: FullRoomState;
  tiles: BoardTile[];
  visualPositions: Record<string, number>;
  isRollingDice?: boolean;
  lastRoll?: { dice1: number; dice2: number } | null;
  activePlayer?: ExtendedPlayerState;
  activeTokenType?: MonopolyTokenType;
  lastAnimation?: any;
  jackpot?: number;
  onTileClick?: (tile: BoardTile) => void;
  className?: string;
}

// Official 40-space Authentic Monopoly reference definitions
const AUTHENTIC_40_DATA: Record<
  number,
  {
    title1: string;
    title2?: string;
    price?: string;
    icon?: string;
    color?: string;
    bgTintLight?: string;
    bgTintDark?: string;
    corner?: string;
  }
> = {
  0: { title1: "COLLECT", title2: "$200.00 SALARY AS YOU PASS", corner: "GO" },
  1: { title1: "MEDITERRANEAN", title2: "AVENUE", price: "PRICE $60", color: "#78350F", bgTintLight: "#FDF8F6", bgTintDark: "#26160F" },
  2: { title1: "COMMUNITY", title2: "CHEST", icon: "chest", bgTintLight: "#F0F9FF", bgTintDark: "#0C1F2E" },
  3: { title1: "BALTIC", title2: "AVENUE", price: "PRICE $60", color: "#78350F", bgTintLight: "#FDF8F6", bgTintDark: "#26160F" },
  4: { title1: "INCOME", title2: "TAX", price: "PAY $200", icon: "income-tax", bgTintLight: "#FEF2F2", bgTintDark: "#261215" },
  5: { title1: "READING", title2: "RAILROAD", price: "PRICE $200", icon: "train", color: "#334155", bgTintLight: "#F8FAFC", bgTintDark: "#18202F" },
  6: { title1: "ORIENTAL", title2: "AVENUE", price: "PRICE $100", color: "#0284C7", bgTintLight: "#F0F9FF", bgTintDark: "#0C2333" },
  7: { title1: "CHANCE", icon: "chance-red", bgTintLight: "#FFF7ED", bgTintDark: "#29180E" },
  8: { title1: "VERMONT", title2: "AVENUE", price: "PRICE $100", color: "#0284C7", bgTintLight: "#F0F9FF", bgTintDark: "#0C2333" },
  9: { title1: "CONNECTICUT", title2: "AVENUE", price: "PRICE $120", color: "#0284C7", bgTintLight: "#F0F9FF", bgTintDark: "#0C2333" },
  10: { title1: "JUST", title2: "VISITING", corner: "JAIL" },
  11: { title1: "ST. CHARLES", title2: "PLACE", price: "PRICE $140", color: "#DB2777", bgTintLight: "#FDF2F8", bgTintDark: "#2D1223" },
  12: { title1: "ELECTRIC", title2: "COMPANY", price: "PRICE $150", icon: "electric", color: "#D97706", bgTintLight: "#FFFBEB", bgTintDark: "#2B1E0A" },
  13: { title1: "STATES", title2: "AVENUE", price: "PRICE $140", color: "#DB2777", bgTintLight: "#FDF2F8", bgTintDark: "#2D1223" },
  14: { title1: "VIRGINIA", title2: "AVENUE", price: "PRICE $160", color: "#DB2777", bgTintLight: "#FDF2F8", bgTintDark: "#2D1223" },
  15: { title1: "PENNSYLVANIA", title2: "RAILROAD", price: "PRICE $200", icon: "train", color: "#334155", bgTintLight: "#F8FAFC", bgTintDark: "#18202F" },
  16: { title1: "ST. JAMES", title2: "PLACE", price: "PRICE $180", color: "#EA580C", bgTintLight: "#FFF7ED", bgTintDark: "#2E180B" },
  17: { title1: "COMMUNITY", title2: "CHEST", icon: "chest", bgTintLight: "#F0F9FF", bgTintDark: "#0C1F2E" },
  18: { title1: "TENNESSEE", title2: "AVENUE", price: "PRICE $180", color: "#EA580C", bgTintLight: "#FFF7ED", bgTintDark: "#2E180B" },
  19: { title1: "NEW YORK", title2: "AVENUE", price: "PRICE $200", color: "#EA580C", bgTintLight: "#FFF7ED", bgTintDark: "#2E180B" },
  20: { title1: "FREE", title2: "PARKING", corner: "FREE_PARKING" },
  21: { title1: "KENTUCKY", title2: "AVENUE", price: "PRICE $220", color: "#DC2626", bgTintLight: "#FEF2F2", bgTintDark: "#2E1014" },
  22: { title1: "CHANCE", icon: "chance-blue", bgTintLight: "#F0F9FF", bgTintDark: "#0C1F2E" },
  23: { title1: "INDIANA", title2: "AVENUE", price: "PRICE $220", color: "#DC2626", bgTintLight: "#FEF2F2", bgTintDark: "#2E1014" },
  24: { title1: "ILLINOIS", title2: "AVENUE", price: "PRICE $240", color: "#DC2626", bgTintLight: "#FEF2F2", bgTintDark: "#2E1014" },
  25: { title1: "B. & O.", title2: "RAILROAD", price: "PRICE $200", icon: "train", color: "#334155", bgTintLight: "#F8FAFC", bgTintDark: "#18202F" },
  26: { title1: "ATLANTIC", title2: "AVENUE", price: "PRICE $260", color: "#CA8A04", bgTintLight: "#FEFCE8", bgTintDark: "#2B2207" },
  27: { title1: "VENTNOR", title2: "AVENUE", price: "PRICE $260", color: "#CA8A04", bgTintLight: "#FEFCE8", bgTintDark: "#2B2207" },
  28: { title1: "WATER", title2: "WORKS", price: "PRICE $150", icon: "water", color: "#0284C7", bgTintLight: "#F0F9FF", bgTintDark: "#0C2333" },
  29: { title1: "MARVIN", title2: "GARDENS", price: "PRICE $280", color: "#CA8A04", bgTintLight: "#FEFCE8", bgTintDark: "#2B2207" },
  30: { title1: "GO TO", title2: "JAIL", corner: "GO_TO_JAIL" },
  31: { title1: "PACIFIC", title2: "AVENUE", price: "PRICE $300", color: "#059669", bgTintLight: "#F0FDF4", bgTintDark: "#0B2618" },
  32: { title1: "NORTH CAROLINA", title2: "AVENUE", price: "PRICE $300", color: "#059669", bgTintLight: "#F0FDF4", bgTintDark: "#0B2618" },
  33: { title1: "COMMUNITY", title2: "CHEST", icon: "chest", bgTintLight: "#F0F9FF", bgTintDark: "#0C1F2E" },
  34: { title1: "PENNSYLVANIA", title2: "AVENUE", price: "PRICE $320", color: "#059669", bgTintLight: "#F0FDF4", bgTintDark: "#0B2618" },
  35: { title1: "SHORT", title2: "LINE", price: "PRICE $200", icon: "train", color: "#334155", bgTintLight: "#F8FAFC", bgTintDark: "#18202F" },
  36: { title1: "CHANCE", icon: "chance-red", bgTintLight: "#FFF7ED", bgTintDark: "#29180E" },
  37: { title1: "PARK", title2: "PLACE", price: "PRICE $350", color: "#1D4ED8", bgTintLight: "#EFF6FF", bgTintDark: "#0F1E38" },
  38: { title1: "LUXURY", title2: "TAX", price: "PAY $75.00", icon: "luxury-tax", bgTintLight: "#FFFBEB", bgTintDark: "#2B1E0A" },
  39: { title1: "BOARDWALK", price: "PRICE $400", color: "#1D4ED8", bgTintLight: "#EFF6FF", bgTintDark: "#0F1E38" }
};

// Map of dice pip coordinates in 44x44 die box
const DICE_PIPS: Record<number, [number, number][]> = {
  1: [[22, 22]],
  2: [[13, 13], [31, 31]],
  3: [[13, 13], [22, 22], [31, 31]],
  4: [[13, 13], [13, 31], [31, 13], [31, 31]],
  5: [[13, 13], [13, 31], [22, 22], [31, 13], [31, 31]],
  6: [[13, 13], [13, 22], [13, 31], [31, 13], [31, 22], [31, 31]]
};

export default function LuxuryMonopolyBoardSVG({
  gameState,
  tiles,
  visualPositions,
  isRollingDice = false,
  lastRoll,
  activePlayer,
  activeTokenType,
  lastAnimation,
  jackpot = 150,
  onTileClick,
  className = ""
}: LuxuryMonopolyBoardSVGProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Default to Upright Screen Mode so players never have to tilt their phone or head!
  const [isUprightMode, setIsUprightMode] = useState(true);

  const tilesCount = tiles.length || 20;
  const isFull40 = tilesCount >= 40;
  const tilesPerSide = isFull40 ? 9 : 4;
  const sideLength = tilesPerSide + 1; // 10 for 40-tile, 5 for 20-tile
  const tileSpan = 810 / tilesPerSide; // 90 for 40-tile, 202.5 for 20-tile

  // Color theme definitions
  const theme = isDarkMode
    ? {
        boardBg: "#0C0F17",
        centerBg: "#121722",
        tileBg: "#171D2B",
        tileStroke: "#C5A059",
        textMain: "#F8FAFC",
        textSub: "#94A3B8",
        priceColor: "#FDE047",
        redAccent: "#EF4444",
        jailOrange: "#EA580C",
        jailBars: "#FDE047",
        policeBlue: "#3B82F6",
        chestBlue: "#0EA5E9",
        bannerStroke: "#D4AF37",
        goldSeparator: "#D4AF37"
      }
    : {
        boardBg: "#FFFFFF",
        centerBg: "#FAF9F6",
        tileBg: "#FFFFFF",
        tileStroke: "#1E293B",
        textMain: "#0F172A",
        textSub: "#475569",
        priceColor: "#0F172A",
        redAccent: "#DC2626",
        jailOrange: "#FB923C",
        jailBars: "#111111",
        policeBlue: "#1E3A8A",
        chestBlue: "#0284C7",
        bannerStroke: "#FFFFFF",
        goldSeparator: "#CBD5E1"
      };

  // Pre-calculate token center coordinates for fast, buttery token movement
  const getTileCenterCoords = useMemo(() => {
    return (index: number): { cx: number; cy: number } => {
      const idx = index % tilesCount;
      const cornerSize = 145;

      if (idx === 0) {
        return { cx: 955 + cornerSize / 2, cy: 955 + cornerSize / 2 };
      }
      if (idx < sideLength) {
        // South (Bottom row)
        const k = idx;
        return { cx: 955 - (k - 0.5) * tileSpan, cy: 955 + cornerSize / 2 };
      }
      if (idx === sideLength) {
        // Jail
        return { cx: cornerSize / 2, cy: 955 + cornerSize / 2 };
      }
      if (idx < 2 * sideLength) {
        // West (Left row)
        const k = idx - sideLength;
        const cy = 955 - (k - 0.5) * tileSpan;
        return { cx: cornerSize / 2, cy };
      }
      if (idx === 2 * sideLength) {
        // Free Parking
        return { cx: cornerSize / 2, cy: cornerSize / 2 };
      }
      if (idx < 3 * sideLength) {
        // North (Top row)
        const k = idx - 2 * sideLength;
        const cx = 145 + (k - 0.5) * tileSpan;
        return { cx, cy: cornerSize / 2 };
      }
      if (idx === 3 * sideLength) {
        // Go To Jail
        return { cx: 955 + cornerSize / 2, cy: cornerSize / 2 };
      }
      // East (Right row)
      const k = idx - 3 * sideLength;
      const cy = 145 + (k - 0.5) * tileSpan;
      return { cx: 955 + cornerSize / 2, cy };
    };
  }, [tilesCount, sideLength, tileSpan]);

  // Group active players by tile for clean spatial positioning
  const playersByTile = useMemo(() => {
    const map: Record<number, { player: ExtendedPlayerState; indexInTurn: number }[]> = {};
    const turnOrder = gameState.turnOrder || [];

    turnOrder.forEach((pId, idx) => {
      const p = gameState.players[pId];
      if (!p) return;
      const currentPos = visualPositions[pId] !== undefined ? visualPositions[pId] : p.position;
      const tileIdx = currentPos % tilesCount;
      if (!map[tileIdx]) map[tileIdx] = [];
      map[tileIdx].push({ player: p, indexInTurn: idx });
    });

    return map;
  }, [gameState.turnOrder, gameState.players, visualPositions, tilesCount]);

  // Dice values fallback
  const d1 = lastRoll?.dice1 ?? 3;
  const d2 = lastRoll?.dice2 ?? 4;
  const diceTotal = d1 + d2;
  const isDouble = lastRoll && d1 === d2;

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center relative select-none ${className}`}>
      {/* Floating table controls — parked over the empty centre hub so they
          never cover property names or corner art. */}
      <div className="absolute top-[14%] right-[12%] z-40 flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
        {/* Toggle between Upright Screen View and Rotated View */}
        <button
          onClick={() => setIsUprightMode((prev) => !prev)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-sm transition-transform active:scale-95 shadow-md flex items-center gap-1 ${
            isUprightMode
              ? "bg-amber-500/90 hover:bg-amber-600 text-stone-950 border-amber-300 font-black"
              : "bg-black/60 hover:bg-black/80 text-white border-white/20"
          }`}
          title="تبديل وضع قراءة النصوص (رأسي مقروء / دوار)"
        >
          <span>{isUprightMode ? "📱 قراءة رأسية مريحة" : "🔄 تدوير كلاسيكي"}</span>
        </button>

        {/* Theme Switcher Button */}
        <button
          onClick={() => setIsDarkMode((prev) => !prev)}
          className="px-2.5 py-1 bg-black/60 hover:bg-black/80 text-white border border-white/20 rounded-full text-[11px] font-bold backdrop-blur-sm transition-transform active:scale-95 shadow-md flex items-center gap-1"
          title="تبديل مظهر المونوبولي (كلاسيكي / داكن)"
        >
          <span>{isDarkMode ? "☀️ كلاسيكي" : "🌙 داكن"}</span>
        </button>
      </div>

      {/* Main 2D Pure Vector Monopoly Board */}
      <div className="w-full h-full max-w-[95vmin] max-h-[95vmin] aspect-square rounded-lg overflow-hidden shadow-2xl relative">
        <svg
          viewBox="0 0 1100 1100"
          className="w-full h-full block"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* ============================================================== */}
          {/* REUSABLE 2D MICRO-ICONS (CRISP VECTOR, ZERO GPU OVERHEAD)      */}
          {/* ============================================================== */}
          <defs>
            {/* Steam Locomotive */}
            <g id="icon-steam-train">
              <path d="M -20,8 L -20,-2 L -14,-2 L -14,-14 L 6,-14 L 6,-6 L 16,-6 L 16,8 Z" fill={theme.textMain} />
              <rect x="-12" y="-12" width="7" height="6" rx="1" fill="#FEF08A" />
              <path d="M 9,-14 L 14,-14 L 13,-6 L 10,-6 Z" fill={theme.textMain} />
              <polygon points="16,3 21,8 16,8" fill={theme.textMain} />
              <circle cx="16" cy="-2" r="2" fill="#FDE047" />
              <circle cx="-13" cy="9" r="4.5" fill={theme.textMain} stroke="#666" strokeWidth="1.2" />
              <circle cx="-3" cy="9" r="4.5" fill={theme.textMain} stroke="#666" strokeWidth="1.2" />
              <circle cx="7" cy="9" r="4.5" fill={theme.textMain} stroke="#666" strokeWidth="1.2" />
              <circle cx="16" cy="9" r="3.2" fill={theme.textMain} stroke="#666" strokeWidth="1" />
              <line x1="-13" y1="9" x2="9" y2="9" stroke="#E2E8F0" strokeWidth="1.5" />
            </g>

            {/* Water Works Faucet */}
            <g id="icon-water-tap">
              <path d="M -18,-4 L -4,-4 L 3,-4 C 10,-4 12,1 12,8 L 12,14 L 7,14 L 7,8 C 7,5 5,4 1,4 L -18,4 Z" fill={theme.textMain} />
              <rect x="-2" y="-10" width="5" height="6" fill={theme.textMain} />
              <ellipse cx="0.5" cy="-10" rx="9" ry="3" fill={theme.textMain} />
              <path d="M 9.5,18 C 11.5,18 14,20.5 14,23.5 A 4.5 4.5 0 0 1 5,23.5 C 5,20.5 7.5,18 9.5,18 Z" fill="#0284C7" />
            </g>

            {/* Electric Company Lightbulb */}
            <g id="icon-electric-bulb">
              <path d="M 0,-14 C 7.5,-14 12.5,-8 12.5,-1.5 C 12.5,4.5 8,8 6,11 L -6,11 C -8,8 -12.5,4.5 -12.5,-1.5 C -12.5,-8 -7.5,-14 0,-14 Z" fill="#FEF08A" stroke={theme.textMain} strokeWidth="1.8" />
              <rect x="-5" y="11" width="10" height="2.5" fill={theme.textMain} />
              <rect x="-4" y="13.5" width="8" height="2.5" fill={theme.textMain} />
              <path d="M -2,16 L 2,16 L 0,18.5 Z" fill={theme.textMain} />
              <path d="M -3,8 L -3,0 L 0,-6 L 3,0 L 3,8" fill="none" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" />
              <line x1="0" y1="-18" x2="0" y2="-23" stroke={theme.textMain} strokeWidth="2" strokeLinecap="round" />
              <line x1="-16" y1="-11" x2="-21" y2="-14" stroke={theme.textMain} strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="-11" x2="21" y2="-14" stroke={theme.textMain} strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Solitaire Diamond Ring (Luxury Tax) */}
            <g id="icon-diamond-solitaire">
              <ellipse cx="0" cy="7" rx="15" ry="11" fill="none" stroke="#F59E0B" strokeWidth="3" />
              <polygon points="-7,-4 7,-4 5,2 -5,2" fill="#F59E0B" />
              <polygon points="0,-18 10,-8 7,-4 -7,-4 -10,-8" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1" />
              <polygon points="0,-18 4,-8 0,-4 -4,-8" fill="#FFFFFF" />
            </g>

            {/* Income Tax Diamond */}
            <g id="icon-tax-diamond">
              <polygon points="0,-18 18,0 0,18 -18,0" fill="#FEE2E2" stroke="#DC2626" strokeWidth="2.2" />
              <polygon points="0,-10 10,0 0,10 -10,0" fill="none" stroke="#DC2626" strokeWidth="1.2" />
              <circle cx="0" cy="0" r="4.5" fill="#DC2626" />
            </g>

            {/* Community Chest */}
            <g id="icon-chest-box">
              <rect x="-16" y="-4" width="32" height="20" rx="2" fill={theme.chestBlue} stroke={theme.textMain} strokeWidth="1.8" />
              <path d="M -18,-4 C -18,-14 18,-14 18,-4 Z" fill="#0369A1" stroke={theme.textMain} strokeWidth="1.8" />
              <line x1="-9" y1="-12" x2="-9" y2="16" stroke="#FEF08A" strokeWidth="1.8" />
              <line x1="9" y1="-12" x2="9" y2="16" stroke="#FEF08A" strokeWidth="1.8" />
              <rect x="-3" y="1" width="6" height="7" rx="1" fill="#FEF08A" stroke={theme.textMain} strokeWidth="1" />
            </g>

            {/* Chance ? Red */}
            <g id="icon-chance-q-red">
              <text x="0" y="18" fontFamily="'Times New Roman', 'Cinzel', serif" fontSize="52" fontWeight="900" fill={theme.redAccent} textAnchor="middle">?</text>
            </g>

            {/* Chance ? Blue */}
            <g id="icon-chance-q-blue">
              <text x="0" y="18" fontFamily="'Times New Roman', 'Cinzel', serif" fontSize="52" fontWeight="900" fill="#0284C7" textAnchor="middle">?</text>
            </g>

            {/* Glossy 2.5D marble token finish */}
            <radialGradient id="token-gloss" cx="34%" cy="24%" r="78%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
              <stop offset="38%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="72%" stopColor="#ffffff" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
            </radialGradient>
            <filter id="token-shadow" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.65" />
            </filter>
            <filter id="board-soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Base Background & Center Hub Track */}
          <rect x="0" y="0" width="1100" height="1100" fill={theme.boardBg} stroke={theme.tileStroke} strokeWidth="3" />
          <rect x="145" y="145" width="810" height="810" fill={theme.centerBg} stroke={theme.tileStroke} strokeWidth="2" />

          {/* ============================================================== */}
          {/* CENTER BOARD: THE SOUL OF MONOPOLY (RED BANNER, CARDS & DICE)  */}
          {/* ============================================================== */}
          <g id="board-center-area">
            {/* Iconic Diagonal Red Monopoly Banner */}
            <g transform="translate(550, 470) rotate(-45)">
              <rect x="-240" y="-55" width="480" height="110" rx="12" fill={theme.redAccent} stroke={theme.bannerStroke} strokeWidth="3" />
              <text
                x="0"
                y="24"
                fontFamily="'Arial Black', Impact, sans-serif"
                fontWeight="900"
                fontSize="64"
                letterSpacing="4"
                fill="#FFFFFF"
                stroke="#000000"
                strokeWidth="2"
                paintOrder="stroke fill"
                textAnchor="middle"
              >
                MONOPOLY
              </text>
            </g>

            {/* Community Chest Stamped Card Slot */}
            <g transform="translate(360, 360) rotate(-45)">
              <rect x="-85" y="-55" width="170" height="110" rx="8" fill="none" stroke={theme.tileStroke} strokeWidth="2" strokeDasharray="6 6" />
              <g transform="translate(0, -6)">
                <use href="#icon-chest-box" transform="scale(1.2)" />
              </g>
              <text x="0" y="32" fontFamily="'Montserrat', 'Oswald', sans-serif" fontSize="12" fontWeight="800" fill={theme.textMain} textAnchor="middle">
                COMMUNITY CHEST
              </text>
            </g>

            {/* Chance Stamped Card Slot */}
            <g transform="translate(740, 740) rotate(-45)">
              <rect x="-85" y="-55" width="170" height="110" rx="8" fill="none" stroke={theme.tileStroke} strokeWidth="2" strokeDasharray="6 6" />
              <g transform="translate(0, -6)">
                <use href="#icon-chance-q-red" transform="scale(0.8)" />
              </g>
              <text x="0" y="34" fontFamily="'Montserrat', 'Oswald', sans-serif" fontSize="13" fontWeight="800" fill={theme.textMain} textAnchor="middle">
                CHANCE
              </text>
            </g>

            {/* Clean 2D Dice Arena (Pure SVG Vectors, No 3D Canvas) */}
            <g transform="translate(550, 610)">
              {/* Die 1 */}
              <g transform={`translate(-50, -22) ${isRollingDice ? "rotate(-8)" : ""}`}>
                <rect x="0" y="0" width="44" height="44" rx="8" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />
                {(DICE_PIPS[d1] || DICE_PIPS[1]).map(([px, py], pIdx) => (
                  <circle key={pIdx} cx={px} cy={py} r="4" fill="#111111" />
                ))}
              </g>

              {/* Die 2 */}
              <g transform={`translate(6, -22) ${isRollingDice ? "rotate(8)" : ""}`}>
                <rect x="0" y="0" width="44" height="44" rx="8" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />
                {(DICE_PIPS[d2] || DICE_PIPS[1]).map(([px, py], pIdx) => (
                  <circle key={pIdx} cx={px} cy={py} r="4" fill="#111111" />
                ))}
              </g>

              {/* Dice Status Label */}
              <text x="0" y="44" fontFamily="'Montserrat', sans-serif" fontSize="12" fontWeight="900" fill={isDouble ? "#EAB308" : theme.textMain} textAnchor="middle" letterSpacing="1">
                {isRollingDice ? "🎲 ROLLING..." : isDouble ? `DOUBLES! [ ${diceTotal} ]` : `TOTAL: ${diceTotal}`}
              </text>
            </g>
          </g>

          {/* ============================================================== */}
          {/* CORNER 0: GO                                                   */}
          {/* ============================================================== */}
          <g id="corner-go" transform="translate(955, 955)" className="cursor-pointer" onClick={() => onTileClick?.(tiles[0])}>
            <rect x="0" y="0" width="145" height="145" fill={theme.tileBg} stroke={theme.tileStroke} strokeWidth="2" />
            <text x="72" y="24" fontFamily="'Montserrat', sans-serif" fontSize="8.5" fontWeight="900" fill={theme.textMain} textAnchor="middle">COLLECT</text>
            <text x="72" y="36" fontFamily="'Montserrat', sans-serif" fontSize="9.5" fontWeight="900" fill={theme.redAccent} textAnchor="middle">$200.00 SALARY</text>
            <text x="72" y="48" fontFamily="'Montserrat', sans-serif" fontSize="8.5" fontWeight="900" fill={theme.textMain} textAnchor="middle">AS YOU PASS</text>
            <text x="72" y="98" fontFamily="'Arial Black', Impact, sans-serif" fontSize="48" fontWeight="900" fill={theme.redAccent} stroke="#7F1D1D" strokeWidth="1.2" textAnchor="middle" letterSpacing="2">GO</text>
            <g transform="translate(72, 122)">
              <path d="M -46,0 L -20,-12 L -20,-5 L 46,-5 L 46,5 L -20,5 L -20,12 Z" fill={theme.redAccent} stroke="#7F1D1D" strokeWidth="1" />
            </g>
          </g>

          {/* ============================================================== */}
          {/* CORNER 10: JAIL / JUST VISITING                                */}
          {/* ============================================================== */}
          <g id="corner-jail" transform="translate(0, 955)" className="cursor-pointer" onClick={() => onTileClick?.(tiles[sideLength])}>
            <rect x="0" y="0" width="145" height="145" fill={theme.tileBg} stroke={theme.tileStroke} strokeWidth="2" />
            {isUprightMode ? (
              // Upright Readable Layout for Jail
              <>
                <rect x="25" y="8" width="95" height="92" fill={theme.jailOrange} stroke={theme.tileStroke} strokeWidth="2" rx="4" />
                <g transform="translate(72, 48)">
                  <ellipse cx="0" cy="12" rx="18" ry="14" fill="#FFFFFF" />
                  <path d="M -14,3 L 14,3 M -17,9 L 17,9 M -16,15 L 16,15" stroke="#111111" strokeWidth="2.5" />
                  <circle cx="0" cy="-6" r="12" fill="#FDE68A" stroke="#111111" strokeWidth="1.5" />
                  <ellipse cx="-4" cy="-8" rx="2" ry="2.5" fill="#111111" />
                  <ellipse cx="4" cy="-8" rx="2" ry="2.5" fill="#111111" />
                </g>
                <g stroke={theme.jailBars} strokeWidth="3">
                  <line x1="38" y1="8" x2="38" y2="100" />
                  <line x1="55" y1="8" x2="55" y2="100" />
                  <line x1="72" y1="8" x2="72" y2="100" />
                  <line x1="89" y1="8" x2="89" y2="100" />
                  <line x1="106" y1="8" x2="106" y2="100" />
                </g>
                <rect x="42" y="78" width="60" height="16" fill="#111111" rx="2" />
                <text x="72" y="90" fontFamily="'Montserrat', sans-serif" fontSize="10" fontWeight="900" fill="#FFFFFF" textAnchor="middle" letterSpacing="1.5">IN JAIL</text>
                <text x="72" y="128" fontFamily="'Montserrat', sans-serif" fontSize="12" fontWeight="900" fill={theme.textMain} textAnchor="middle" letterSpacing="2">JUST VISITING</text>
              </>
            ) : (
              // Classic Rotated Corner
              <>
                <text x="20" y="58" fontFamily="'Montserrat', sans-serif" fontSize="12" fontWeight="900" fill={theme.textMain} transform="rotate(-90, 20, 58)" textAnchor="middle" letterSpacing="3">JUST</text>
                <text x="92" y="128" fontFamily="'Montserrat', sans-serif" fontSize="12" fontWeight="900" fill={theme.textMain} textAnchor="middle" letterSpacing="3">VISITING</text>
                <rect x="42" y="0" width="103" height="103" fill={theme.jailOrange} stroke={theme.tileStroke} strokeWidth="2.5" />
                <g transform="translate(93, 46)">
                  <circle cx="0" cy="-6" r="14" fill="#FDE68A" stroke="#111111" strokeWidth="1.5" />
                </g>
                <g stroke={theme.jailBars} strokeWidth="3.5">
                  <line x1="58" y1="6" x2="58" y2="97" />
                  <line x1="75" y1="6" x2="75" y2="97" />
                  <line x1="93" y1="6" x2="93" y2="97" />
                  <line x1="111" y1="6" x2="111" y2="97" />
                  <line x1="128" y1="6" x2="128" y2="97" />
                </g>
                <rect x="52" y="74" width="82" height="18" fill="#111111" rx="3" />
                <text x="93" y="87" fontFamily="'Montserrat', sans-serif" fontSize="11" fontWeight="900" fill="#FFFFFF" textAnchor="middle" letterSpacing="2">JAIL</text>
              </>
            )}
          </g>

          {/* ============================================================== */}
          {/* CORNER 20: FREE PARKING (UPRIGHT VIEWABLE)                     */}
          {/* ============================================================== */}
          <g id="corner-parking" transform="translate(0, 0)" className="cursor-pointer" onClick={() => onTileClick?.(tiles[2 * sideLength])}>
            <rect x="0" y="0" width="145" height="145" fill={theme.tileBg} stroke={theme.tileStroke} strokeWidth="2" />
            <text x="72" y="26" fontFamily="'Montserrat', sans-serif" fontSize="13" fontWeight="900" fill={theme.redAccent} textAnchor="middle" letterSpacing="2">FREE</text>
            <g transform={isUprightMode ? "translate(72, 70)" : "translate(72, 70) rotate(-45)"}>
              <circle cx="-28" cy="14" r="9" fill="#111111" />
              <circle cx="-28" cy="14" r="5" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1" />
              <circle cx="28" cy="14" r="9" fill="#111111" />
              <circle cx="28" cy="14" r="5" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1" />
              <path d="M -38,14 C -38,3 -28,-4 -18,-4 L 18,-4 C 28,-4 38,3 38,14 Z" fill={theme.redAccent} stroke="#991B1B" strokeWidth="2" />
              <path d="M -12,-4 L -6,-16 L 10,-16 L 16,-4 Z" fill="#BAE6FD" stroke="#991B1B" strokeWidth="1.8" />
              <circle cx="37" cy="6" r="3" fill="#FDE047" stroke="#9CA3AF" strokeWidth="1" />
              <rect x="-34" y="-18" width="4" height="24" fill="#64748B" />
              <circle cx="-32" cy="-22" r="7" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
            </g>
            <text x="72" y="126" fontFamily="'Montserrat', sans-serif" fontSize="13" fontWeight="900" fill={theme.redAccent} textAnchor="middle" letterSpacing="2">PARKING</text>
          </g>

          {/* ============================================================== */}
          {/* CORNER 30: GO TO JAIL (UPRIGHT VIEWABLE)                       */}
          {/* ============================================================== */}
          <g id="corner-gotojail" transform="translate(955, 0)" className="cursor-pointer" onClick={() => onTileClick?.(tiles[3 * sideLength])}>
            <rect x="0" y="0" width="145" height="145" fill={theme.tileBg} stroke={theme.tileStroke} strokeWidth="2" />
            <text x="72" y="26" fontFamily="'Montserrat', sans-serif" fontSize="13" fontWeight="900" fill={theme.textMain} textAnchor="middle" letterSpacing="2">GO TO</text>
            <g transform="translate(72, 70)">
              <path d="M -18,24 L -14,-4 L 14,-4 L 18,24 Z" fill={theme.policeBlue} stroke="#111111" strokeWidth="1.8" />
              <polygon points="0,-1 5,3 4,9 0,11 -4,9 -5,3" fill="#F59E0B" />
              <circle cx="-16" cy="0" r="4" fill="#FDE68A" stroke="#111111" strokeWidth="1" />
              <rect x="-14" y="-3" width="7" height="3" fill="#D1D5DB" />
              <circle cx="0" cy="-14" r="13" fill="#FDE68A" stroke="#111111" strokeWidth="1.5" />
              <path d="M -14,-17 Q 0,-30 14,-17 Z" fill={theme.policeBlue} stroke="#111111" strokeWidth="1.5" />
              <path d="M -16,-17 L 16,-17" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
              <g transform="translate(14, 0) rotate(135)">
                <rect x="0" y="-5" width="22" height="10" rx="3" fill={theme.policeBlue} stroke="#111111" strokeWidth="1.5" />
                <circle cx="25" cy="0" r="4.5" fill="#FDE68A" stroke="#111111" strokeWidth="1" />
                <rect x="25" y="-2" width="16" height="4" rx="2" fill="#FDE68A" stroke="#111111" strokeWidth="1" />
              </g>
            </g>
            <text x="72" y="126" fontFamily="'Montserrat', sans-serif" fontSize="16" fontWeight="900" fill={theme.redAccent} textAnchor="middle" letterSpacing="3">JAIL</text>
          </g>

          {/* ============================================================== */}
          {/* PERIMETER REGULAR TILES (UPRIGHT SCREEN MODE OR ROTATED)       */}
          {/* ============================================================== */}
          {Array.from({ length: tilesCount }).map((_, tileIndex) => {
            // Skip the 4 corners (handled explicitly above)
            if (
              tileIndex === 0 ||
              tileIndex === sideLength ||
              tileIndex === 2 * sideLength ||
              tileIndex === 3 * sideLength
            ) {
              return null;
            }

            const tile = tiles[tileIndex] || { index: tileIndex, name: `Tile ${tileIndex}` };
            const authData = isFull40 ? AUTHENTIC_40_DATA[tileIndex] : null;

            // Extract or resolve authentic English name
            let title1 = authData?.title1 || "";
            let title2 = authData?.title2 || "";
            let priceText = authData?.price || (tile.price ? `PRICE $${tile.price}` : "");
            let iconType = authData?.icon || "";
            let colorHex = authData?.color || "";
            let bgTint = isDarkMode ? authData?.bgTintDark : authData?.bgTintLight;

            if (!authData) {
              // Parse English name from parentheses if present (e.g. "شارع المتوسط (Mediterranean Ave)")
              const parenMatch = tile.name?.match(/\(([^)]+)\)/);
              if (parenMatch) {
                const words = parenMatch[1].toUpperCase().replace("AVE", "AVENUE").replace("RR", "RAILROAD").split(" ");
                title1 = words.slice(0, Math.ceil(words.length / 2)).join(" ");
                title2 = words.slice(Math.ceil(words.length / 2)).join(" ");
              } else {
                const words = (tile.name || "").toUpperCase().split(" ");
                title1 = words[0] || "";
                title2 = words.slice(1).join(" ") || "";
              }

              // Color group mapping with matching tints
              if (tile.colorGroup === "BROWN") {
                colorHex = "#78350F";
                bgTint = isDarkMode ? "#26160F" : "#FDF8F6";
              } else if (tile.colorGroup === "LIGHT_BLUE") {
                colorHex = "#0284C7";
                bgTint = isDarkMode ? "#0C2333" : "#F0F9FF";
              } else if (tile.colorGroup === "PINK") {
                colorHex = "#DB2777";
                bgTint = isDarkMode ? "#2D1223" : "#FDF2F8";
              } else if (tile.colorGroup === "ORANGE") {
                colorHex = "#EA580C";
                bgTint = isDarkMode ? "#2E180B" : "#FFF7ED";
              } else if (tile.colorGroup === "RED") {
                colorHex = "#DC2626";
                bgTint = isDarkMode ? "#2E1014" : "#FEF2F2";
              } else if (tile.colorGroup === "YELLOW") {
                colorHex = "#CA8A04";
                bgTint = isDarkMode ? "#2B2207" : "#FEFCE8";
              } else if (tile.colorGroup === "GREEN") {
                colorHex = "#059669";
                bgTint = isDarkMode ? "#0B2618" : "#F0FDF4";
              } else if (tile.colorGroup === "DARK_BLUE") {
                colorHex = "#1D4ED8";
                bgTint = isDarkMode ? "#0F1E38" : "#EFF6FF";
              }

              // Special Icon Detection
              if (tile.colorGroup === "STATION" || tile.name?.includes("قطار") || tile.name?.includes("سكة")) {
                iconType = "train";
                colorHex = "#334155";
              } else if (tile.name?.includes("كهرباء") || tile.name?.includes("Electric")) {
                iconType = "electric";
                colorHex = "#D97706";
              } else if (tile.name?.includes("مياه") || tile.name?.includes("Water")) {
                iconType = "water";
                colorHex = "#0284C7";
              } else if (tile.name?.includes("صندوق") || tile.name?.includes("Chest")) {
                iconType = "chest";
              } else if (tile.name?.includes("فرصة") || tile.name?.includes("Chance") || tile.tileType === "DRAMA_EVENT") {
                iconType = "chance-red";
              } else if (tile.name?.includes("ضريبة") || tile.name?.includes("Tax") || tile.tileType === "HAZARD") {
                iconType = "luxury-tax";
              }
            }

            const houses = tile.houses || 0;
            const ownerColor = tile.ownerId ? gameState.players[tile.ownerId]?.color : null;
            const tileBg = bgTint || theme.tileBg;

            // ==============================================================
            // MODE A: UPRIGHT SCREEN MODE (ALL TEXT READABLE 0° ANGLE)
            // ==============================================================
            if (isUprightMode) {
              let x = 0;
              let y = 0;
              let w = 0;
              let h = 0;
              let bandX = 0;
              let bandY = 0;
              let bandW = 0;
              let bandH = 0;
              let contentCenterX = 0;
              let titleY1 = 0;
              let titleY2 = 0;
              let iconCenterY = 0;
              let priceY = 0;

              if (tileIndex < sideLength) {
                // SOUTH (Bottom row)
                const k = tileIndex;
                x = 955 - k * tileSpan;
                y = 955;
                w = tileSpan;
                h = 145;
                bandX = 0;
                bandY = 0;
                bandW = tileSpan;
                bandH = 28;
                contentCenterX = tileSpan / 2;
                titleY1 = colorHex ? (title2 ? 54 : 62) : (title2 ? 24 : 30);
                titleY2 = 68;
                iconCenterY = 72;
                priceY = 130;
              } else if (tileIndex < 2 * sideLength) {
                // WEST (Left row): Text readable horizontally!
                const k = tileIndex - sideLength;
                x = 0;
                y = 955 - k * tileSpan;
                w = 145;
                h = tileSpan;
                // Color band on the right (facing center)
                bandX = 117;
                bandY = 0;
                bandW = 28;
                bandH = tileSpan;
                contentCenterX = 58;
                titleY1 = title2 ? (tileSpan / 2 - 14) : (tileSpan / 2 - 6);
                titleY2 = tileSpan / 2 + 2;
                iconCenterY = tileSpan / 2;
                priceY = tileSpan - 14;
              } else if (tileIndex < 3 * sideLength) {
                // NORTH (Top row): Text readable horizontally upright (not upside down)!
                const k = tileIndex - 2 * sideLength;
                x = 145 + (k - 1) * tileSpan;
                y = 0;
                w = tileSpan;
                h = 145;
                // Color band at bottom (facing center)
                bandX = 0;
                bandY = 117;
                bandW = tileSpan;
                bandH = 28;
                contentCenterX = tileSpan / 2;
                titleY1 = title2 ? 38 : 46;
                titleY2 = 52;
                iconCenterY = 66;
                priceY = 104;
              } else {
                // EAST (Right row): Text readable horizontally!
                const k = tileIndex - 3 * sideLength;
                x = 955;
                y = 145 + (k - 1) * tileSpan;
                w = 145;
                h = tileSpan;
                // Color band on the left (facing center)
                bandX = 0;
                bandY = 0;
                bandW = 28;
                bandH = tileSpan;
                contentCenterX = 86;
                titleY1 = title2 ? (tileSpan / 2 - 14) : (tileSpan / 2 - 6);
                titleY2 = tileSpan / 2 + 2;
                iconCenterY = tileSpan / 2;
                priceY = tileSpan - 14;
              }

              return (
                <g
                  key={tileIndex}
                  transform={`translate(${x}, ${y})`}
                  className="cursor-pointer transition-opacity hover:opacity-90"
                  onClick={() => onTileClick?.(tile)}
                >
                  {/* Matching Tinted Tile Body */}
                  <rect
                    x="0"
                    y="0"
                    width={w}
                    height={h}
                    fill={tileBg}
                    stroke={theme.tileStroke}
                    strokeWidth="1.5"
                  />

                  {/* Cohesive Property Color Band */}
                  {colorHex && (
                    <g>
                      <rect
                        x={bandX}
                        y={bandY}
                        width={bandW}
                        height={bandH}
                        fill={colorHex}
                        stroke={theme.tileStroke}
                        strokeWidth="1"
                      />
                      {/* Subtle elegant gloss line */}
                      <rect
                        x={bandX}
                        y={bandY}
                        width={bandW}
                        height={bandH <= 30 ? 3 : bandH}
                        fill="rgba(255,255,255,0.25)"
                      />
                    </g>
                  )}

                  {/* 2D Houses & Hotel */}
                  {houses > 0 && houses < 5 && (
                    <g
                      transform={`translate(${
                        bandW > bandH
                          ? contentCenterX - (houses * 13) / 2
                          : bandX + 4
                      }, ${bandW > bandH ? bandY + 4 : h / 2 - (houses * 13) / 2})`}
                    >
                      {Array.from({ length: houses }).map((_, hIdx) => (
                        <rect
                          key={hIdx}
                          x={bandW > bandH ? hIdx * 13 : 0}
                          y={bandW > bandH ? 0 : hIdx * 13}
                          width={bandW > bandH ? 10 : 20}
                          height={bandW > bandH ? 20 : 10}
                          rx="2"
                          fill="#16A34A"
                          stroke="#14532D"
                          strokeWidth="1"
                        />
                      ))}
                    </g>
                  )}
                  {houses >= 5 && (
                    <g
                      transform={`translate(${
                        bandW > bandH ? contentCenterX - 14 : bandX + 3
                      }, ${bandW > bandH ? bandY + 3 : h / 2 - 9})`}
                    >
                      <rect
                        x="0"
                        y="0"
                        width={bandW > bandH ? 28 : 22}
                        height={bandW > bandH ? 22 : 18}
                        rx="2"
                        fill="#DC2626"
                        stroke="#7F1D1D"
                        strokeWidth="1.2"
                      />
                      <text
                        x={bandW > bandH ? 14 : 11}
                        y={bandW > bandH ? 14 : 12}
                        fontFamily="'Montserrat', sans-serif"
                        fontSize="8"
                        fontWeight="900"
                        fill="#FFFFFF"
                        textAnchor="middle"
                      >
                        HOTEL
                      </text>
                    </g>
                  )}

                  {/* Special Micro-Icons */}
                  {iconType === "train" && (
                    <g transform={`translate(${contentCenterX}, ${iconCenterY})`}>
                      <use href="#icon-steam-train" />
                    </g>
                  )}
                  {iconType === "water" && (
                    <g transform={`translate(${contentCenterX}, ${iconCenterY})`}>
                      <use href="#icon-water-tap" />
                    </g>
                  )}
                  {iconType === "electric" && (
                    <g transform={`translate(${contentCenterX}, ${iconCenterY})`}>
                      <use href="#icon-electric-bulb" />
                    </g>
                  )}
                  {iconType === "chest" && (
                    <g transform={`translate(${contentCenterX}, ${iconCenterY})`}>
                      <use href="#icon-chest-box" />
                    </g>
                  )}
                  {iconType === "chance-red" && (
                    <g transform={`translate(${contentCenterX}, ${iconCenterY + 8})`}>
                      <use href="#icon-chance-q-red" />
                    </g>
                  )}
                  {iconType === "chance-blue" && (
                    <g transform={`translate(${contentCenterX}, ${iconCenterY + 8})`}>
                      <use href="#icon-chance-q-blue" />
                    </g>
                  )}
                  {iconType === "luxury-tax" && (
                    <g transform={`translate(${contentCenterX}, ${iconCenterY})`}>
                      <use href="#icon-diamond-solitaire" />
                    </g>
                  )}
                  {iconType === "income-tax" && (
                    <g transform={`translate(${contentCenterX}, ${iconCenterY})`}>
                      <use href="#icon-tax-diamond" />
                    </g>
                  )}

                  {/* Title Lines (100% Upright, 0° Angle) */}
                  <text
                    x={contentCenterX}
                    y={titleY1}
                    fontFamily="'Montserrat', sans-serif"
                    fontSize={isFull40 ? "8.5" : "11"}
                    fontWeight="900"
                    fill={theme.textMain}
                    textAnchor="middle"
                    letterSpacing="0.2"
                  >
                    {title1}
                  </text>
                  {title2 && (
                    <text
                      x={contentCenterX}
                      y={titleY2}
                      fontFamily="'Montserrat', sans-serif"
                      fontSize={isFull40 ? "8.5" : "11"}
                      fontWeight="900"
                      fill={theme.textMain}
                      textAnchor="middle"
                      letterSpacing="0.2"
                    >
                      {title2}
                    </text>
                  )}

                  {/* Price Text (Upright) */}
                  {priceText && (
                    <text
                      x={contentCenterX}
                      y={priceY}
                      fontFamily="'Montserrat', sans-serif"
                      fontSize={isFull40 ? "9.5" : "11.5"}
                      fontWeight="900"
                      fill={theme.priceColor}
                      textAnchor="middle"
                    >
                      {priceText}
                    </text>
                  )}

                  {/* Owner Ring Marker */}
                  {ownerColor && (
                    <circle
                      cx={w - 12}
                      cy={14}
                      r="6.5"
                      fill={ownerColor}
                      stroke="#FFFFFF"
                      strokeWidth="1.8"
                    />
                  )}
                </g>
              );
            }

            // ==============================================================
            // MODE B: CLASSIC ROTATED INWARD MODE (ALTERNATIVE)
            // ==============================================================
            let transform = "";
            if (tileIndex < sideLength) {
              const k = tileIndex;
              transform = `translate(${955 - k * tileSpan}, 955)`;
            } else if (tileIndex < 2 * sideLength) {
              const k = tileIndex - sideLength;
              transform = `translate(145, ${955 - k * tileSpan}) rotate(90)`;
            } else if (tileIndex < 3 * sideLength) {
              const k = tileIndex - 2 * sideLength;
              transform = `translate(${145 + k * tileSpan}, 145) rotate(180)`;
            } else {
              const k = tileIndex - 3 * sideLength;
              transform = `translate(955, ${145 + k * tileSpan}) rotate(-90)`;
            }

            return (
              <g
                key={tileIndex}
                transform={transform}
                className="cursor-pointer transition-opacity hover:opacity-90"
                onClick={() => onTileClick?.(tile)}
              >
                <rect x="0" y="0" width={tileSpan} height="145" fill={tileBg} stroke={theme.tileStroke} strokeWidth="1.5" />
                {colorHex && <rect x="0" y="0" width={tileSpan} height="32" fill={colorHex} stroke={theme.tileStroke} strokeWidth="1" />}
                <text x={tileSpan / 2} y={colorHex ? 56 : 30} fontFamily="'Montserrat', sans-serif" fontSize={isFull40 ? "8.5" : "11"} fontWeight="900" fill={theme.textMain} textAnchor="middle">{title1}</text>
                {title2 && <text x={tileSpan / 2} y={70} fontFamily="'Montserrat', sans-serif" fontSize={isFull40 ? "8.5" : "11"} fontWeight="900" fill={theme.textMain} textAnchor="middle">{title2}</text>}
                {priceText && <text x={tileSpan / 2} y="130" fontFamily="'Montserrat', sans-serif" fontSize={isFull40 ? "10" : "12"} fontWeight="900" fill={theme.priceColor} textAnchor="middle">{priceText}</text>}
              </g>
            );
          })}

          {/* ============================================================== */}
          {/* LIVE 2D PLAYER TOKENS (SMOOTH HOVER & TRANSITIONS, ZERO LAG)    */}
          {/* ============================================================== */}
          <g id="live-player-tokens">
            {Object.entries(playersByTile).map(([tileIdxStr, playersOnTile]) => {
              const tileIdx = parseInt(tileIdxStr, 10);
              const { cx, cy } = getTileCenterCoords(tileIdx);
              const totalOnTile = playersOnTile.length;

              return playersOnTile.map(({ player, indexInTurn }, pIdx) => {
                let offsetX = 0;
                let offsetY = 0;

                if (totalOnTile === 2) {
                  offsetX = pIdx === 0 ? -14 : 14;
                } else if (totalOnTile === 3) {
                  const angle = (2 * Math.PI * pIdx) / 3 - Math.PI / 2;
                  offsetX = Math.cos(angle) * 17;
                  offsetY = Math.sin(angle) * 17;
                } else if (totalOnTile === 4) {
                  offsetX = pIdx % 2 === 0 ? -14 : 14;
                  offsetY = pIdx < 2 ? -14 : 14;
                } else if (totalOnTile > 4) {
                  // 5-8 tokens on one tile: compact 3-column grid so every
                  // player keeps a readable, non-stacked token from the start.
                  const columns = Math.min(3, totalOnTile);
                  const rows = Math.ceil(totalOnTile / 3);
                  const col = pIdx % 3;
                  const row = Math.floor(pIdx / 3);
                  offsetX = (col - (columns - 1) / 2) * 21;
                  offsetY = (row - (rows - 1) / 2) * 21;
                }

                const playerColor = player.color || "#DC2626";
                const initial = player.name
                  ? getPlayerInitials(player.name)
                  : `P${indexInTurn + 1}`;
                const tokenRadius = totalOnTile > 4 ? 10.5 : 16;
                const badgeFontSize = totalOnTile > 4 ? 7 : 9.5;

                return (
                  <g
                    key={player.id}
                    className="transition-all duration-500 ease-out cursor-pointer"
                    transform={`translate(${cx + offsetX}, ${cy + offsetY})`}
                    filter="url(#token-shadow)"
                  >
                    {/* Beveled Base Disc */}
                    <circle cx="0" cy="2" r={tokenRadius + 1} fill="#0f172a" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                    {/* Glossy Marble Token */}
                    <circle cx="0" cy="0" r={tokenRadius} fill={playerColor} stroke="#FFFFFF" strokeWidth={totalOnTile > 4 ? 1.6 : 2.5} />
                    <circle cx="0" cy="0" r={tokenRadius} fill="url(#token-gloss)" pointerEvents="none" />
                    <circle cx="0" cy="0" r={Math.max(5, tokenRadius - 4.5)} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
                    {/* Player Badge / Initial */}
                    <text
                      x="0"
                      y={badgeFontSize * 0.48}
                      fontFamily="'Montserrat', 'IBM Plex Sans Arabic', sans-serif"
                      fontSize={badgeFontSize}
                      fontWeight="900"
                      fill="#FFFFFF"
                      stroke="rgba(0,0,0,0.35)"
                      strokeWidth="0.6"
                      paintOrder="stroke fill"
                      textAnchor="middle"
                    >
                      {initial}
                    </text>
                  </g>
                );
              });
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
