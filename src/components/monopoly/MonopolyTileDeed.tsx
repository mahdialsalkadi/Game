"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Train,
  Zap,
  Droplets,
  HelpCircle,
  Gift,
  Lock,
  Flag,
  Coins
} from "lucide-react";
import type { FullRoomState, ExtendedPlayerState } from "@/game/gameRoom";
import type { BoardTile } from "@/game/schema";
import {
  MONOPOLY_COLOR_GROUPS,
  type MonopolyColorGroupKey,
  calculateMonopolyRent
} from "@/game/monopolyEngine";
import MonopolyPawn3D from "./MonopolyPawn3D";

interface MonopolyTileDeedProps {
  tile: BoardTile;
  gameState: FullRoomState;
  visualPositions: Record<string, number>;
  gridRow: number;
  gridCol: number;
  isCorner: boolean;
  onTileClick?: (tile: BoardTile) => void;
}

export default function MonopolyTileDeed({
  tile,
  gameState,
  visualPositions,
  gridRow,
  gridCol,
  isCorner,
  onTileClick
}: MonopolyTileDeedProps) {
  const owner = tile.ownerId ? gameState.players[tile.ownerId] : null;
  const colorConfig = tile.colorGroup
    ? MONOPOLY_COLOR_GROUPS[tile.colorGroup as MonopolyColorGroupKey]
    : null;

  // Players currently on this tile
  const playersHere = Object.values(gameState.players).filter(
    (p) => (visualPositions[p.id] ?? p.position) === tile.index
  );

  // Render 3D Miniature Green Villas or Red Luxury Hotel on the Color Band
  const renderBuildings = (housesCount: number) => {
    if (!housesCount || housesCount <= 0) return null;

    if (housesCount >= 5) {
      // 3D Red Luxury Hotel resting on color band (compact & proportional)
      return (
        <div
          className="relative flex items-center justify-center filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]"
          title="فندق فاخر 🏨"
        >
          <div className="w-3.5 h-2.5 sm:w-4 sm:h-3 bg-gradient-to-b from-red-600 to-red-800 rounded-2xs border border-amber-300 relative flex items-center justify-around px-0.5 shadow-xs">
            {/* Mansard roof highlight */}
            <div className="absolute -top-0.5 inset-x-0.5 h-0.5 bg-gradient-to-b from-amber-400 to-red-600 rounded-t-2xs" />
            {/* Windows */}
            <div className="w-0.5 h-1 bg-amber-200 rounded-3xs shadow-xs" />
            <div className="w-0.5 h-1 bg-amber-200 rounded-3xs shadow-xs" />
          </div>
        </div>
      );
    }

    // 1 to 4 Miniature 3D Green Villas
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: housesCount }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 sm:w-2.5 sm:h-2.5 relative flex items-center justify-center filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]"
            title={`فيلا ${i + 1}`}
          >
            {/* 3D Pitched Green Roof */}
            <div className="absolute top-0 w-2 h-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-t-3xs border-t border-emerald-200" />
            {/* Villa Body */}
            <div className="absolute bottom-0 w-2 h-1 bg-gradient-to-b from-emerald-600 to-emerald-800 border border-emerald-400/90 rounded-b-3xs flex items-center justify-center">
              {/* Window */}
              <div className="w-0.5 h-0.5 bg-amber-200/90 rounded-3xs" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // =========================================================================
  // CORNER 1: START (انطلق - GO) 🏁
  // =========================================================================
  // CORNER 1: START (انطلق - GO) 🏁
  // Cream background, bold red diagonal arrow, 1500 SAR salary
  // =========================================================================
  if (tile.cornerType === "GO" || tile.index === 0) {
    return (
      <div
        onClick={() => onTileClick?.(tile)}
        style={{ gridRow, gridColumn: gridCol }}
        className="relative rounded-xl sm:rounded-2xl bg-[#eaf4ea] border-2 border-stone-800 p-1 sm:p-2 flex flex-col justify-between overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.5)] group cursor-pointer transition-transform hover:scale-[1.02]"
      >
        {/* Paper texture overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#15803d0d_1px,transparent_1px)] [background-size:6px_6px] pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between z-10">
          <span className="text-[7.5px] sm:text-[9px] font-black bg-red-600 text-white px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded shadow-xs">
            نقطة الانطلاق
          </span>
          <Flag className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-600 drop-shadow-xs" />
        </div>

        {/* Center: Bold Red Diagonal Arrow & Authentic "انطلق" */}
        <div className="text-center my-auto z-10 flex flex-col items-center justify-center">
          {/* Authentic Big Red Directional Arrow */}
          <div className="relative w-8 h-4 sm:w-11 sm:h-5 flex items-center justify-center my-0.2 sm:my-0.5">
            <svg viewBox="0 0 60 28" className="w-full h-full drop-shadow">
              <path
                d="M4 14H44M44 14L32 4M44 14L32 24"
                stroke="#DC2626"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="text-xs sm:text-base font-black text-stone-900 tracking-wider">
            انطلق
          </div>
          <div className="text-[6.5px] sm:text-[8px] font-black text-red-700 mt-0.2 sm:mt-0.5 bg-red-100/90 border border-red-300 py-0.2 px-1 sm:px-1.5 rounded-full shadow-xs truncate max-w-full">
            {gameState.currencyName === "$"
              ? `$${tile.defaultEffect?.value || 200} راتب`
              : `${tile.defaultEffect?.value || gameState.passStartBonus || 200} ${gameState.currencyName || "ريال"}`}
          </div>
        </div>

        {/* Player Pawns Floating Overlay */}
        {playersHere.length > 0 && (
          <div className="absolute inset-x-0 bottom-0.5 flex items-center justify-center gap-0.5 z-20 pointer-events-none">
            {playersHere.map((p, idx) => (
              <MonopolyPawn3D
                key={p.id}
                tokenIndex={idx}
                playerColor={p.color}
                playerName={p.name}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // CORNER 2: JAIL & JUST VISITING (السجن / زيارة فقط) ⛓️
  // Classic orange corner with "في السجن" jail cell in center & "زيارة فقط" outer walkway
  // =========================================================================
  if (tile.cornerType === "JAIL" || tile.index === 5) {
    const jailedPlayers = playersHere.filter((p) => p.inJail);
    const visitingPlayers = playersHere.filter((p) => !p.inJail);

    return (
      <div
        onClick={() => onTileClick?.(tile)}
        style={{ gridRow, gridColumn: gridCol }}
        className="relative rounded-xl sm:rounded-2xl bg-[#ea580c] border-2 border-stone-800 p-0.5 sm:p-1 flex flex-col justify-between overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.5)] group cursor-pointer transition-transform hover:scale-[1.02]"
      >
        {/* Outer Walkway Ledge: "زيارة فقط" */}
        <div className="bg-[#fef3c7] border-b-2 border-stone-800 text-stone-900 text-[7.5px] sm:text-[8.5px] font-black text-center py-0.2 sm:py-0.5 rounded-t flex items-center justify-center gap-1">
          <span>زيارة فقط</span>
          <span className="text-[9px]">🚶‍♂️</span>
        </div>

        {/* Center: "في السجن" Jail Cell with Heavy Steel Bars */}
        <div className="flex-1 my-0.2 sm:my-0.5 rounded-md sm:rounded-lg bg-[#f8fafc] border border-stone-800 relative flex flex-col items-center justify-center p-0.5 overflow-hidden shadow-inner">
          {/* Heavy Steel Vertical Bars */}
          <div className="absolute inset-0 flex justify-around pointer-events-none opacity-40">
            <div className="w-0.5 sm:w-1 h-full bg-stone-900 shadow-sm" />
            <div className="w-0.5 sm:w-1 h-full bg-stone-900 shadow-sm" />
            <div className="w-0.5 sm:w-1 h-full bg-stone-900 shadow-sm" />
            <div className="w-0.5 sm:w-1 h-full bg-stone-900 shadow-sm" />
          </div>

          <div className="text-[8px] sm:text-[9.5px] font-black text-stone-900 z-10 flex items-center gap-0.5 bg-[#ea580c]/10 px-1 rounded">
            <Lock className="w-2.5 h-2.5 text-red-600" />
            <span>في السجن ⛓️</span>
          </div>

          {/* Jailed Players Behind Bars */}
          {jailedPlayers.length > 0 && (
            <div className="flex gap-0.5 mt-0.5 z-10 flex-wrap justify-center">
              {jailedPlayers.map((p, idx) => (
                <MonopolyPawn3D
                  key={p.id}
                  tokenIndex={idx}
                  playerColor={p.color}
                  playerName={p.name}
                  isJailed={true}
                  size="sm"
                />
              ))}
            </div>
          )}
        </div>

        {/* Visiting Players on Outer Ledge */}
        {visitingPlayers.length > 0 && (
          <div className="flex items-center justify-center gap-0.5 pb-0.5">
            {visitingPlayers.map((p, idx) => (
              <MonopolyPawn3D
                key={p.id}
                tokenIndex={idx}
                playerColor={p.color}
                playerName={p.name}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // CORNER 3: FREE PARKING (المواقف المجانية) 🅿️
  // Classic red vintage car icon on asphalt/cream with "مواقف مجانية"
  // =========================================================================
  if (tile.cornerType === "FREE_PARKING" || tile.index === 10) {
    const jackpot = gameState.freeParkingJackpot || 100;

    return (
      <div
        onClick={() => onTileClick?.(tile)}
        style={{ gridRow, gridColumn: gridCol }}
        className="relative rounded-xl sm:rounded-2xl bg-[#f4f8f4] border-2 border-stone-800 p-1 sm:p-2 flex flex-col justify-between overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.5)] group cursor-pointer transition-transform hover:scale-[1.02]"
      >
        {/* Header */}
        <div className="flex items-center justify-between z-10">
          <span className="text-[7.5px] sm:text-[8.5px] font-black bg-red-600 text-white px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded shadow-xs">
            مواقف مجانية
          </span>
          <span className="text-[10px] sm:text-xs">🅿️</span>
        </div>

        {/* Vintage Red Car Illustration */}
        <div className="text-center my-auto z-10 flex flex-col items-center">
          <div className="w-8 h-5 sm:w-10 sm:h-7 relative flex items-center justify-center drop-shadow">
            <svg viewBox="0 0 64 42" className="w-full h-full">
              {/* Vintage Car Body */}
              <path
                d="M6 24C6 24 10 14 18 12C26 10 38 10 46 12C52 14 58 24 58 24C60 26 62 28 62 31C62 33 60 34 57 34H7C4 34 2 33 2 31C2 28 4 26 6 24Z"
                fill="#DC2626"
                stroke="#1C1917"
                strokeWidth="2.5"
              />
              {/* Windshield & Windows */}
              <path
                d="M19 14L23 22H41L45 14C39 12 25 12 19 14Z"
                fill="#BAE6FD"
                stroke="#1C1917"
                strokeWidth="1.8"
              />
              {/* Front Wheel */}
              <circle cx="16" cy="34" r="6" fill="#1C1917" />
              <circle cx="16" cy="34" r="2.5" fill="#E2E8F0" />
              {/* Rear Wheel */}
              <circle cx="48" cy="34" r="6" fill="#1C1917" />
              <circle cx="48" cy="34" r="2.5" fill="#E2E8F0" />
              {/* Chrome Bumper */}
              <rect x="0" y="30" width="4" height="4" rx="1" fill="#CBD5E1" stroke="#1C1917" strokeWidth="1" />
              <rect x="60" y="30" width="4" height="4" rx="1" fill="#CBD5E1" stroke="#1C1917" strokeWidth="1" />
            </svg>
          </div>

          <div className="text-[8px] sm:text-[10px] font-black text-stone-900 mt-0.2 sm:mt-0.5">
            المواقف المجانية
          </div>
          <div className="text-[6.5px] sm:text-[8px] font-black text-amber-800 bg-amber-100/90 border border-amber-300 py-0.2 px-1 rounded-full inline-flex items-center gap-0.5 shadow-2xs mt-0.2 truncate max-w-full">
            <Coins className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-amber-600 shrink-0" />
            <span>خزينة: {gameState.currencyName === "$" ? `$${jackpot}` : `${jackpot} ${gameState.currencyName || "ريال"}`}</span>
          </div>
        </div>

        {/* Player Pawns Floating Overlay */}
        {playersHere.length > 0 && (
          <div className="absolute inset-x-0 bottom-0.5 flex items-center justify-center gap-0.5 z-20 pointer-events-none">
            {playersHere.map((p, idx) => (
              <MonopolyPawn3D
                key={p.id}
                tokenIndex={idx}
                playerColor={p.color}
                playerName={p.name}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // CORNER 4: GO TO JAIL (اذهب إلى السجن) 🚨
  // Classic police officer icon with whistle and pointing finger!
  // =========================================================================
  if (tile.cornerType === "GO_TO_JAIL" || tile.index === 15) {
    return (
      <div
        onClick={() => onTileClick?.(tile)}
        style={{ gridRow, gridColumn: gridCol }}
        className="relative rounded-xl sm:rounded-2xl bg-[#f4f8f4] border-2 border-stone-800 p-1 sm:p-2 flex flex-col justify-between overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.5)] group cursor-pointer transition-transform hover:scale-[1.02]"
      >
        {/* Header */}
        <div className="flex items-center justify-between z-10">
          <span className="text-[7.5px] sm:text-[8.5px] font-black bg-orange-600 text-white px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded shadow-xs">
            أمر توقيف 🚨
          </span>
          <span className="text-[10px] sm:text-xs">👮‍♂️</span>
        </div>

        {/* Police Officer with Whistle & Pointing Finger Illustration */}
        <div className="text-center my-auto z-10 flex flex-col items-center">
          <div className="w-8 h-6 sm:w-10 sm:h-8 relative flex items-center justify-center drop-shadow">
            <svg viewBox="0 0 60 50" className="w-full h-full">
              {/* Police Cap */}
              <ellipse cx="30" cy="11" rx="12" ry="5" fill="#1E3A8A" stroke="#1C1917" strokeWidth="1.5" />
              <path d="M22 11H38L35 7H25L22 11Z" fill="#1E40AF" stroke="#1C1917" strokeWidth="1.5" />
              <circle cx="30" cy="9" r="1.5" fill="#FBBF24" />
              {/* Face */}
              <circle cx="30" cy="20" r="8" fill="#FED7AA" stroke="#1C1917" strokeWidth="1.5" />
              {/* Whistle in mouth */}
              <rect x="23" y="21" width="5" height="2.5" rx="1" fill="#CBD5E1" stroke="#1C1917" strokeWidth="1" />
              {/* Body / Police Uniform */}
              <path d="M20 28H40L44 48H16L20 28Z" fill="#1E3A8A" stroke="#1C1917" strokeWidth="1.5" />
              {/* Golden Badge */}
              <polygon points="30,31 32,34 35,34 32,36 33,39 30,37 27,39 28,36 25,34 28,34" fill="#FBBF24" />
              {/* Pointing Arm & Hand */}
              <path
                d="M38 32L54 26"
                stroke="#1E3A8A"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M54 26L58 25"
                stroke="#FED7AA"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="text-[8.5px] sm:text-[10.5px] font-black text-red-700 leading-tight mt-0.2 sm:mt-0.5">
            اذهب إلى السجن!
          </div>
          <div className="text-[6.5px] sm:text-[7.5px] font-bold text-stone-600 bg-red-50 border border-red-200 py-0.2 px-1 rounded mt-0.2">
            دون المرور بنقطة الانطلاق
          </div>
        </div>

        {/* Players Floating Overlay */}
        {playersHere.length > 0 && (
          <div className="absolute inset-x-0 bottom-0.5 flex items-center justify-center gap-0.5 z-20 pointer-events-none">
            {playersHere.map((p, idx) => (
              <MonopolyPawn3D
                key={p.id}
                tokenIndex={idx}
                playerColor={p.color}
                playerName={p.name}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // REGULAR ARCHITECTURAL DEED TILE (Physical Classic Cream Cardboard Tile)
  // Bold saturated color bands, authentic crisp typography, 3D villas/hotels
  // =========================================================================
  const calculatedRent = calculateMonopolyRent(tile, gameState.tiles || []);
  const isStation =
    tile.colorGroup === "STATION" ||
    (tile.name ? tile.name.includes("محطة") || tile.name.includes("قطار") : false);
  const isUtility =
    tile.colorGroup === "UTILITY" ||
    (tile.name ? tile.name.includes("كهرباء") || tile.name.includes("مياه") : false);
  const isElectric =
    tile.name ? tile.name.includes("كهرباء") : false;
  const isWater =
    tile.name ? tile.name.includes("مياه") : false;
  const isChance =
    tile.tileType === "SECRET_CARD" ||
    (tile.name ? tile.name.includes("فرصة") : false);
  const isChest =
    tile.tileType === "DRAMA_EVENT" ||
    (tile.name ? tile.name.includes("صندوق") : false);

  return (
    <div
      onClick={() => onTileClick?.(tile)}
      style={{
        gridRow,
        gridColumn: gridCol,
        borderColor: owner ? owner.color : "#292524"
      }}
      className={`relative rounded-xl border-2 bg-[#f4f8f4] flex flex-col justify-between overflow-hidden transition-all shadow-md group cursor-pointer hover:shadow-xl hover:scale-[1.02] ${
        owner
          ? "ring-2 ring-amber-400/80 shadow-lg"
          : ""
      }`}
    >
      {/* Authentic Cardboard Paper Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b0a_1px,transparent_1px)] [background-size:5px_5px] pointer-events-none" />

      {/* Bold Saturated Color Band on Top (For regular property streets) */}
      {!isChance && !isChest && !isStation && !isUtility && (
        <div
          style={{
            backgroundColor: colorConfig?.colorHex || "#475569"
          }}
          className="w-full h-3.5 sm:h-4.5 px-1 sm:px-1.5 flex items-center justify-between border-b border-stone-800 shrink-0 relative shadow-xs"
        >
          {/* Subtle paper reflection line */}
          <div className="absolute top-0 inset-x-0 h-0.5 bg-white/20 pointer-events-none" />

          <span className="text-[6.5px] sm:text-[7.5px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] truncate">
            {colorConfig?.nameAr?.split(" ")[0] || "عقار"}
          </span>

          {/* 3D Green Villas or Red Hotel resting on the color band */}
          <div className="z-10">{renderBuildings(tile.houses || 0)}</div>
        </div>
      )}

      {/* Station Header Accent */}
      {isStation && (
        <div className="w-full h-3.5 sm:h-4 bg-stone-900 px-1 sm:px-1.5 flex items-center justify-between text-white border-b border-stone-800 shrink-0">
          <span className="text-[6.5px] sm:text-[7.5px] font-black">محطة قطار</span>
          <Train className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300" />
        </div>
      )}

      {/* Utility Header Accent */}
      {isUtility && (
        <div className="w-full h-3.5 sm:h-4 bg-amber-600 px-1 sm:px-1.5 flex items-center justify-between text-white border-b border-stone-800 shrink-0">
          <span className="text-[6.5px] sm:text-[7.5px] font-black">مرفق عام</span>
          {isWater ? (
            <Droplets className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-200" />
          ) : (
            <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-200" />
          )}
        </div>
      )}

      {/* Chance Header Accent */}
      {isChance && (
        <div className="w-full h-3.5 sm:h-4 bg-orange-600 px-1 sm:px-1.5 flex items-center justify-between text-white border-b border-stone-800 shrink-0">
          <span className="text-[6.5px] sm:text-[7.5px] font-black">بطاقة فرصة</span>
          <HelpCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-200" />
        </div>
      )}

      {/* Community Chest Header Accent */}
      {isChest && (
        <div className="w-full h-3.5 sm:h-4 bg-emerald-700 px-1 sm:px-1.5 flex items-center justify-between text-white border-b border-stone-800 shrink-0">
          <span className="text-[6.5px] sm:text-[7.5px] font-black">صندوق الحظ</span>
          <Gift className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-200" />
        </div>
      )}

      {/* Cardboard Tile Body with Clear Black Arabic Printing */}
      <div className="p-0.5 sm:p-1 flex-1 flex flex-col justify-between text-center z-10 min-h-0">
        <div>
          {/* Station / Utility / Special Visual Icon in Center */}
          {isStation && (
            <div className="my-0.2 sm:my-0.5 flex justify-center">
              <Train className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-stone-900 drop-shadow-xs" />
            </div>
          )}
          {isUtility && isElectric && (
            <div className="my-0.2 sm:my-0.5 flex justify-center">
              <Zap className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-amber-600 drop-shadow-xs" />
            </div>
          )}
          {isUtility && isWater && (
            <div className="my-0.2 sm:my-0.5 flex justify-center">
              <Droplets className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-blue-600 drop-shadow-xs" />
            </div>
          )}
          {isChance && (
            <div className="my-0.2 sm:my-0.5 flex justify-center">
              <span className="text-base sm:text-lg font-black text-orange-600">?</span>
            </div>
          )}
          {isChest && (
            <div className="my-0.2 sm:my-0.5 flex justify-center">
              <Gift className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-emerald-700 drop-shadow-xs" />
            </div>
          )}

          {/* Street Name in Bold Dark Ink */}
          <h4 className="text-[7.5px] sm:text-[9px] md:text-[10px] font-black text-stone-900 leading-tight line-clamp-2">
            {tile.name}
          </h4>

          {/* Price & Rent Callouts */}
          {tile.price ? (
            <div className="text-[6px] sm:text-[7.5px] font-black mt-0.2 sm:mt-0.5 flex items-center justify-between px-0.5 text-stone-800 border-t border-stone-300/80 pt-0.2 whitespace-nowrap">
              <span className="text-stone-900 font-extrabold truncate">
                {gameState.currencyName === "$" ? `$${tile.price}` : `${tile.price} ${gameState.currencyName || "ريال"}`}
              </span>
              <span className="text-emerald-700 font-black truncate">
                إيجار {gameState.currencyName === "$" ? `$${calculatedRent}` : calculatedRent}
              </span>
            </div>
          ) : (
            <div className="text-[6.5px] sm:text-[7.5px] text-stone-500 font-medium line-clamp-1 mt-0.2">
              {tile.description || "أرض مميزة"}
            </div>
          )}
        </div>

        {/* Ownership Ribbon / Stamp */}
        <div className="mt-0.2 flex items-center justify-center">
          {owner ? (
            <span
              style={{
                backgroundColor: `${owner.color}22`,
                borderColor: owner.color,
                color: "#1c1917"
              }}
              className="text-[6.5px] sm:text-[7.5px] font-black px-1 py-0.2 rounded border truncate max-w-full flex items-center gap-0.5 shadow-2xs"
            >
              <span
                style={{ backgroundColor: owner.color }}
                className="w-1.5 h-1.5 rounded-full shrink-0"
              />
              <span className="truncate">{owner.name}</span>
            </span>
          ) : tile.price ? (
            <span className="text-[6px] sm:text-[7px] text-stone-600 font-bold bg-stone-200/80 px-1 py-0.2 rounded border border-stone-300">
              للبيع
            </span>
          ) : null}
        </div>
      </div>

      {/* Player Pawns Floating Overlay */}
      {playersHere.length > 0 && (
        <div className="absolute inset-x-0 bottom-0.5 flex items-center justify-center gap-0.5 z-20 pointer-events-none">
          {playersHere.map((p, idx) => (
            <MonopolyPawn3D
              key={p.id}
              tokenIndex={idx}
              playerColor={p.color}
              playerName={p.name}
              size="sm"
            />
          ))}
        </div>
      )}
    </div>
  );
}
