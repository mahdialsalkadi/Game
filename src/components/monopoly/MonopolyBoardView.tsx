"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Coins,
  Sparkles,
  Trophy,
  Dices,
  Layers,
  Crown,
  ChevronRight,
  Sparkle,
  X,
  Home
} from "lucide-react";
import type { FullRoomState, ExtendedPlayerState } from "@/game/gameRoom";
import type { BoardTile } from "@/game/schema";
import {
  AUTHENTIC_MONOPOLY_TILES_20,
  MONOPOLY_COLOR_GROUPS,
  type MonopolyColorGroupKey,
  calculateMonopolyRent
} from "@/game/monopolyEngine";
import SpatialPlayerSeat from "../common/SpatialPlayerSeat";
import LuxuryMonopolyBoardSVG from "./LuxuryMonopolyBoardSVG";
import MonopolyTileDeed from "./MonopolyTileDeed";

interface MonopolyBoardViewProps {
  gameState: FullRoomState;
  lastAnimation: any;
  isRollingDice: boolean;
  visualPositions: Record<string, number>;
  sendAction?: (payload: Record<string, unknown>) => void;
  activePlayerId?: string;
  displayedDice?: number | null;
  onTileClick?: (tile: BoardTile) => void;
  /** Shared TV/host boards are view-only; purchases happen on the player's phone. */
  canControl?: boolean;
}

export default function MonopolyBoardView({
  gameState,
  lastAnimation,
  isRollingDice,
  visualPositions,
  sendAction,
  activePlayerId: propActivePlayerId,
  displayedDice,
  onTileClick,
  canControl = false
}: MonopolyBoardViewProps) {
  // Use existing tiles or fallback to authentic Riyadh 20-tile set
  const rawTiles = gameState.tiles || [];
  const tiles = rawTiles.length > 0 ? rawTiles : AUTHENTIC_MONOPOLY_TILES_20;
  const tilesCount = tiles.length;

  const [inspectedTile, setInspectedTile] = useState<BoardTile | null>(null);

  const handleTileClick = (tile: BoardTile) => {
    setInspectedTile(tile);
    onTileClick?.(tile);
  };

  const activeId =
    propActivePlayerId || gameState.turnOrder[gameState.currentTurnIndex] || "";
  const activePlayer = gameState.players[activeId];
  const lastRoll = gameState.lastDiceRoll;
  const jackpot = gameState.freeParkingJackpot || 150;

  // Prepare ordered player list
  const playerList = useMemo(() => {
    return gameState.turnOrder
      .map((id) => gameState.players[id])
      .filter((p): p is ExtendedPlayerState => Boolean(p));
  }, [gameState.turnOrder, gameState.players]);

  // Spatial positioning around the Monopoly square board. Every supported
  // player count (2-8) gets its own non-overlapping vertical slot per side.
  const getSpatialSeatPlacement = (index: number, total: number): string => {
    // Seats sit beside the playing surface, never under the page header/footer
    // and never on top of property names or the center dice tray.
    if (total <= 2) {
      return index === 0
        ? "top-1/2 -translate-y-1/2 -left-8 sm:-left-20 lg:-left-28"
        : "top-1/2 -translate-y-1/2 -right-8 sm:-right-20 lg:-right-28";
    }

    if (total === 3) {
      if (index === 0) return "top-1/2 -translate-y-1/2 -left-8 sm:-left-20 lg:-left-28";
      if (index === 1) return "top-1/2 -translate-y-1/2 -right-8 sm:-right-20 lg:-right-28";
      // Keep the third seat inside the empty centre hub, clear of the bottom row.
      return "bottom-20 left-1/2 -translate-x-1/2";
    }

    const perSide = Math.ceil(total / 2);
    const isLeft = index < perSide;
    const slot = isLeft ? index : index - perSide;
    const slotsOnSide = isLeft ? perSide : total - perSide;

    const SLOT_CLASSES: Record<number, string[]> = {
      2: ["top-[28%]", "top-[72%]"],
      3: ["top-[16%]", "top-1/2", "top-[84%]"],
      4: ["top-[11%]", "top-[37%]", "top-[63%]", "top-[89%]"]
    };
    const tops = SLOT_CLASSES[Math.min(4, Math.max(2, slotsOnSide))] || SLOT_CLASSES[4];
    const topClass = slotsOnSide >= tops.length ? tops[tops.length - 1] : tops[Math.max(0, slot)];
    const sideClass = isLeft
      ? "-translate-y-1/2 -left-8 sm:-left-20 lg:-left-28"
      : "-translate-y-1/2 -right-8 sm:-right-20 lg:-right-28";

    return `${topClass} ${sideClass}`;
  };

  return (
    <div className="w-full flex-1 flex items-center justify-center relative p-1 sm:p-2 select-none min-h-0">
      {/* Outer Centered Spatial Board Frame — sized to fit the TV viewport */}
      <div
        className="relative aspect-square flex items-center justify-center my-auto"
        style={{ width: "min(100%, 880px, calc(100dvh - 210px))" }}
      >
        {/* ============================================================== */}
        {/* 1. SPATIAL PLAYER SEATS AROUND THE MONOPOLY CORNERS            */}
        {/* ============================================================== */}
        {playerList.map((p, idx) => {
          const owned = tiles.filter((t) => t.ownerId === p.id && Boolean(t.colorGroup));
          const posClass = getSpatialSeatPlacement(idx, playerList.length);

          return (
            <SpatialPlayerSeat
              key={p.id}
              player={p}
              isCurrentTurn={p.id === activeId}
              ownedProperties={owned}
              currencySymbol={gameState.currencyName || "$"}
              positionClass={posClass}
              lastAnimation={lastAnimation}
            />
          );
        })}

        {/* ============================================================== */}
        {/* 2. AUTHENTIC LIGHTWEIGHT 2D VECTOR MONOPOLY BOARD              */}
        {/* ============================================================== */}
        {/* Handcrafted walnut-and-brass frame around the classic board. */}
        <div className="w-full h-full rounded-[22px] p-[4px] bg-gradient-to-br from-[#d8b45e] via-[#6d4a1e] to-[#b88934] shadow-[0_30px_80px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,240,200,0.6)] ring-1 ring-black/50">
          <div className="w-full h-full rounded-[18px] p-[6px] bg-gradient-to-br from-[#2a160a] via-[#160b04] to-[#3a2010] shadow-[inset_0_0_18px_rgba(0,0,0,0.95)]">
            <div className="w-full h-full rounded-[10px] overflow-hidden ring-1 ring-amber-900/40">
              <LuxuryMonopolyBoardSVG
                gameState={gameState}
                tiles={tiles}
                visualPositions={visualPositions}
                isRollingDice={isRollingDice}
                lastRoll={lastRoll}
                activePlayer={activePlayer}
                lastAnimation={lastAnimation}
                jackpot={jackpot}
                onTileClick={handleTileClick}
              />
            </div>
          </div>
        </div>


        {/* ============================================================== */}
        {/* 3. TITLE DEED INSPECTION POPUP MODAL (LIGHTWEIGHT 2D)          */}
        {/* ============================================================== */}
        <AnimatePresence>
          {inspectedTile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm cursor-pointer"
              onClick={() => setInspectedTile(null)}
            >
              <div
                className="w-full max-w-[280px] bg-[#FAF8F5] text-stone-900 rounded-xl shadow-2xl border-2 border-stone-800 overflow-hidden flex flex-col relative font-sans cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setInspectedTile(null)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-stone-900 flex items-center justify-center transition-colors z-20"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Color Header */}
                <div
                  className="w-full py-4 px-3 flex flex-col items-center justify-center text-center text-white border-b-2 border-stone-800"
                  style={{
                    backgroundColor:
                      inspectedTile.colorGroup === "BROWN"
                        ? "#6F3B1A"
                        : inspectedTile.colorGroup === "LIGHT_BLUE"
                        ? "#0284C7"
                        : inspectedTile.colorGroup === "PINK"
                        ? "#D93876"
                        : inspectedTile.colorGroup === "ORANGE"
                        ? "#EA580C"
                        : inspectedTile.colorGroup === "RED"
                        ? "#DC2626"
                        : inspectedTile.colorGroup === "YELLOW"
                        ? "#CA8A04"
                        : inspectedTile.colorGroup === "GREEN"
                        ? "#059669"
                        : inspectedTile.colorGroup === "DARK_BLUE"
                        ? "#1E3A8A"
                        : "#292524"
                  }}
                >
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">
                    TITLE DEED
                  </span>
                  <h3 className="text-base font-black uppercase tracking-tight mt-0.5">
                    {inspectedTile.name}
                  </h3>
                </div>

                {/* Rent & Upgrades Breakdown */}
                <div className="p-3 text-xs space-y-1.5 border-b border-stone-300">
                  <div className="flex justify-between items-center py-0.5 font-bold">
                    <span>RENT (الإيجار الأساسي)</span>
                    <span>${inspectedTile.rent || 20}</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span>With 1 House (منزل 1)</span>
                    <span>${inspectedTile.rentTiers?.[1] || (inspectedTile.rent || 20) * 3}</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span>With 2 Houses (منزلين)</span>
                    <span>${inspectedTile.rentTiers?.[2] || (inspectedTile.rent || 20) * 9}</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span>With 3 Houses (3 منازل)</span>
                    <span>${inspectedTile.rentTiers?.[3] || (inspectedTile.rent || 20) * 20}</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span>With 4 Houses (4 منازل)</span>
                    <span>${inspectedTile.rentTiers?.[4] || (inspectedTile.rent || 20) * 32}</span>
                  </div>
                  <div className="flex justify-between items-center text-red-600 font-bold pt-1 border-t border-dashed border-stone-300">
                    <span>With HOTEL (فندق فاخر)</span>
                    <span>${inspectedTile.rentTiers?.[5] || (inspectedTile.rent || 20) * 50}</span>
                  </div>
                </div>

                {/* House Costs & Owner Status */}
                <div className="p-3 bg-stone-100 text-[11px] space-y-1">
                  <div className="flex justify-between text-stone-600">
                    <span>تكلفة بناء المنزل:</span>
                    <span className="font-bold">${inspectedTile.houseCost || 50}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>المالك الحالي:</span>
                    <span className="font-bold">
                      {inspectedTile.ownerId
                        ? gameState.players[inspectedTile.ownerId]?.name || "لاعب"
                        : "معروض للشراء"}
                    </span>
                  </div>
                </div>

                {/* Buy Button if active player is on this tile and controls are enabled */}
                {canControl && !inspectedTile.ownerId && inspectedTile.price && activePlayer && (
                  <div className="p-2 bg-stone-200">
                    <button
                      onClick={() => {
                        sendAction?.({ type: "BUY_PROPERTY", tileIndex: inspectedTile.index });
                        setInspectedTile(null);
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>شراء العقار (${inspectedTile.price})</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
