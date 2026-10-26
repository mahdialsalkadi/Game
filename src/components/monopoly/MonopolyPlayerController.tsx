"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dices,
  Building2,
  Lock,
  Coins,
  Shield,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronDown,
  KeyRound,
  Home,
  MapPin
} from "lucide-react";
import type { FullRoomState, ExtendedPlayerState } from "@/game/gameRoom";
import type { BoardTile } from "@/game/schema";
import { getPlayerInitial } from "@/utils/playerDisplay";
import {
  MONOPOLY_COLOR_GROUPS,
  type MonopolyColorGroupKey,
  checkColorMonopoly,
  calculateMonopolyRent
} from "@/game/monopolyEngine";
import { sfx } from "@/utils/soundEffects";

interface MonopolyPlayerControllerProps {
  gameState: FullRoomState;
  playerId: string;
  isMyTurn: boolean;
  sendAction: (payload: Record<string, unknown>) => void;
  triggerHaptic: (pattern: number | number[]) => void;
  showSmartHints?: boolean;
  playMode?: "CASUAL" | "PRO";
}

export default function MonopolyPlayerController({
  gameState,
  playerId,
  isMyTurn,
  sendAction,
  triggerHaptic,
  showSmartHints = true,
  playMode = "CASUAL"
}: MonopolyPlayerControllerProps) {
  const me = gameState.players[playerId];
  const tiles = gameState.tiles || [];
  const currentTile = tiles[me?.position || 0];
  const activePlayerId = gameState.turnOrder?.[gameState.currentTurnIndex];
  const activePlayer = activePlayerId ? gameState.players[activePlayerId] : undefined;
  const otherPlayers = Object.values(gameState.players).filter((p) => p.id !== playerId);
  const [selectedDeed, setSelectedDeed] = useState<BoardTile | null>(null);
  const [showPortfolio, setShowPortfolio] = useState(false);

  if (!me) return null;

  // Owned properties
  const myProperties = tiles.filter((t) => t.ownerId === playerId);

  // Group properties by colorGroup
  const groupedProperties: Record<string, BoardTile[]> = {};
  for (const prop of myProperties) {
    const group = prop.colorGroup || "OTHER";
    if (!groupedProperties[group]) groupedProperties[group] = [];
    groupedProperties[group].push(prop);
  }

  // Check if current tile is purchasable
  const isPurchasable =
    currentTile &&
    currentTile.price &&
    currentTile.price > 0 &&
    !currentTile.ownerId &&
    currentTile.tileType === "RESOURCE";

  const canAffordCurrent = isPurchasable && me.coins >= (currentTile.price || 0);

  return (
    <div
      className="flex-1 flex flex-col justify-between overflow-hidden relative"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(245,158,11,0.08) 0%, transparent 62%)"
      }}
    >
      {/* 0. Turn / round status strip */}
      <div className="px-4 pt-2 flex items-center justify-between gap-2 text-[11px] font-bold">
        <span
          className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
            isMyTurn
              ? "bg-amber-500/20 text-amber-200 border-amber-400/50 animate-pulse"
              : "bg-slate-900/80 text-slate-400 border-slate-700"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isMyTurn ? "bg-amber-300" : "bg-slate-500"}`} />
          {isMyTurn ? "دورك الآن — ارمِ النرد" : `دور ${activePlayer?.name || "اللاعب"}`}
        </span>
        <span className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300">
          الجولة {gameState.currentRound || 1}
        </span>
      </div>

      {/* 1. Authentic Arabian Riyadh Riyal Cash Banknote Header */}
      <div className="px-4 pt-1.5 pb-1">
        <div className="rounded-2xl p-3 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500/40 shadow-xl flex items-center justify-between relative overflow-hidden">
          {/* Subtle Banknote Guilloche Pattern Watermark */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none" />

          <div className="flex items-center gap-2.5 z-10">
            <div
              style={{ backgroundColor: me.color }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-950 font-black text-lg border-2 border-white shadow-md"
            >
              {getPlayerInitial(me.name)}
            </div>
            <div>
              <div className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                <span>{me.name}</span>
                {me.hasShield && (
                  <Shield className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30" />
                )}
              </div>
              <div className="text-xs text-emerald-400 font-extrabold flex items-center gap-1">
                <span>محفظة الصكوك:</span>
                <span className="text-white font-black">{myProperties.length} عقار</span>
              </div>
            </div>
          </div>

          {/* Riyadh Riyal Balance */}
          <div className="z-10 text-left bg-black/50 px-3.5 py-1.5 rounded-xl border border-emerald-500/30">
            <span className="text-[10px] text-emerald-300 block font-bold">
              الرصيد النقدي 💵
            </span>
            <span className="text-xl font-black tracking-wide text-white">
              {me.coins}{" "}
              <span className="text-xs font-bold text-amber-400">
                {gameState.currencyName || "ريال"}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 1b. Compact opponents' balance rail */}
      {otherPlayers.length > 0 && (
        <div className="px-4 pb-1.5 flex items-center gap-1.5 overflow-x-auto hide-scrollbar shrink-0">
          {otherPlayers.map((p) => (
            <div
              key={p.id}
              className={`shrink-0 flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full border text-[10px] font-bold ${
                p.id === activePlayerId
                  ? "bg-amber-500/10 border-amber-400/50 text-amber-200"
                  : "bg-slate-900/80 border-slate-700 text-slate-300"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shadow"
                style={{ backgroundColor: p.color }}
              />
              <span className="max-w-[72px] truncate">{p.name}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-amber-300 font-black">
                {p.coins}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 2. In-Jail Alert Banner / Modal */}
      {me.inJail && (
        <div className="mx-4 my-2 p-3.5 rounded-2xl bg-gradient-to-br from-rose-950 via-slate-900 to-rose-950 border-2 border-rose-500 shadow-2xl flex flex-col gap-2.5 relative overflow-hidden animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-rose-400" />
              <span className="text-sm font-black text-rose-200">
                أنت رهن التوقيف في السجن! ⛓️
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600/30 text-rose-300 border border-rose-500/30">
              محاولات: {me.jailTurnsRemaining ?? 3}/3
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            للخروج: ارمِ نردين متطابقين (Doubles) أو سدد كفالة الغرامة (50 ريال).
          </p>
          {isMyTurn && (
            <div className="flex items-center gap-2 mt-1">
              {me.coins >= 50 && (
                <button
                  onClick={() => {
                    triggerHaptic([30, 20]);
                    sfx.playCoinChime();
                    sendAction({ type: "PAY_JAIL_FINE" });
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 font-black text-xs shadow-lg active:scale-95 transition-transform"
                >
                  ادفع كفالة 50 ريال 💸
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Middle Content: Current Tile Landing Deed or Deed Portfolio */}
      <div className="flex-1 px-4 py-2 flex flex-col overflow-y-auto hide-scrollbar">
        {/* Current tile snapshot when there is nothing to buy right now */}
        {(!isMyTurn || !isPurchasable) && currentTile && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-slate-900/95 to-slate-950/95 p-3.5 shadow-xl relative overflow-hidden"
          >
            <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-[10px] font-black text-amber-300/90 mb-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> موقعك الحالي · مربع #{currentTile.index}
              </span>
              {gameState.lastDiceRoll && (
                <span className="px-2 py-0.5 rounded-full bg-black/50 border border-slate-700 text-slate-300 font-mono">
                  🎲 {gameState.lastDiceRoll.dice1}+{gameState.lastDiceRoll.dice2}={gameState.lastDiceRoll.sum}
                </span>
              )}
            </div>
            <h3 className="text-base font-black text-white leading-tight">{currentTile.name}</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5 line-clamp-2">
              {currentTile.description}
            </p>
            <div className="grid grid-cols-3 gap-1.5 mt-2 text-center">
              <div className="rounded-lg bg-black/35 border border-white/5 py-1">
                <span className="block text-[9px] text-slate-500 font-bold">الإيجار</span>
                <span className="text-xs font-black text-emerald-400">
                  {currentTile.rent ?? "—"}
                </span>
              </div>
              <div className="rounded-lg bg-black/35 border border-white/5 py-1">
                <span className="block text-[9px] text-slate-500 font-bold">المالك</span>
                <span className="text-xs font-black text-amber-300 truncate block px-1">
                  {currentTile.ownerId ? gameState.players[currentTile.ownerId]?.name || "لاعب" : "البنك"}
                </span>
              </div>
              <div className="rounded-lg bg-black/35 border border-white/5 py-1">
                <span className="block text-[9px] text-slate-500 font-bold">رصيدك</span>
                <span className="text-xs font-black text-white">{me.coins}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* If landed on unowned property & player turn: Show prominent Buy Deed Card */}
        {isMyTurn && isPurchasable && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-3 rounded-2xl bg-slate-900 border-2 border-amber-400 p-3 shadow-2xl overflow-hidden"
          >
            {/* Color Header */}
            <div
              style={{
                backgroundColor:
                  MONOPOLY_COLOR_GROUPS[currentTile.colorGroup as MonopolyColorGroupKey]?.colorHex ||
                  "#3b82f6"
              }}
              className="w-full py-1 px-2 rounded-lg text-center text-xs font-black text-white shadow-sm mb-2"
            >
              صك عقاري معروض للشراء 📜
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-base font-black text-white">
                {currentTile.name}
              </h3>
              <span className="text-sm font-black text-amber-400">
                {currentTile.price} ريال
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              {currentTile.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs bg-black/40 p-2 rounded-xl mb-3">
              <span className="text-slate-400">الإيجار الأساسي:</span>
              <span className="text-left font-black text-emerald-400">
                {currentTile.rent || 20} ريال
              </span>
              <span className="text-slate-400">تكلفة تشييد البيت:</span>
              <span className="text-left font-black text-amber-300">
                {currentTile.houseCost || 50} ريال
              </span>
            </div>

            {canAffordCurrent ? (
              <div className="flex flex-col gap-1.5 w-full">
                <button
                  onClick={() => {
                    triggerHaptic([30, 20, 50]);
                    sfx.playCoinChime();
                    sendAction({
                      type: "BUY_PROPERTY",
                      tileIndex: currentTile.index
                    });
                  }}
                  className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 border border-emerald-400/40 ${showSmartHints ? "glow-emerald" : ""}`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>شراء صك الملكية ({currentTile.price} {gameState.currencyName || "ريال"})</span>
                </button>
                {showSmartHints && (
                  <div className="text-[11px] text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-500/30 rounded-lg py-1 px-2 text-center">
                    💡 يمنحك دخل إيجار {currentTile.rent || 20} {gameState.currencyName || "ر.س"} عند هبوط الخصوم
                  </div>
                )}
                <button
                  onClick={() => sendAction({ type: "DECLINE_PURCHASE" })}
                  className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-300 font-bold text-xs transition-colors"
                >
                  تخطي الشراء وتمرير الدور ⏭️
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="text-center text-xs font-bold text-rose-400 py-1">
                  رصيدك لا يكفي لشراء هذا العقار
                </div>
                <button
                  onClick={() => sendAction({ type: "DECLINE_PURCHASE" })}
                  className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-300 font-bold text-xs transition-colors"
                >
                  تخطي الشراء وتمرير الدور ⏭️
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Deed Portfolio Toggle Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowPortfolio((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-extrabold text-amber-400 hover:text-amber-300"
          >
            <Layers className="w-4 h-4" />
            <span>محفظة الصكوك العقارية ({myProperties.length})</span>
            {showPortfolio ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          <span className="text-[10px] text-slate-400">
            {myProperties.length === 0 ? "لا تملك عقارات بعد" : "انقر لتشييد المباني"}
          </span>
        </div>

        {/* Deed Cards List */}
        <div className="flex flex-col gap-2 pb-2">
          {Object.entries(groupedProperties).map(([groupKey, props]) => {
            const config = MONOPOLY_COLOR_GROUPS[groupKey as MonopolyColorGroupKey];
            const hasFullMonopoly = checkColorMonopoly(tiles, playerId, groupKey);

            return (
              <div
                key={groupKey}
                className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 flex flex-col gap-2"
              >
                {/* Group Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: config?.colorHex || "#64748b" }}
                      className="w-3 h-3 rounded-full shadow"
                    />
                    <span className="text-xs font-black text-slate-200">
                      {config?.nameAr || groupKey}
                    </span>
                  </div>
                  {hasFullMonopoly && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 flex items-center gap-1 shadow">
                      <Sparkles className="w-2.5 h-2.5" />
                      احتكار كامل ✨
                    </span>
                  )}
                </div>

                {/* Properties in this group */}
                <div className="grid grid-cols-1 gap-1.5">
                  {props.map((prop) => {
                    const currentHouses = prop.houses || 0;
                    const canBuild =
                      hasFullMonopoly &&
                      currentHouses < 5 &&
                      isMyTurn &&
                      gameState.phase === "TURN_START" &&
                      groupKey !== "STATION" &&
                      groupKey !== "UTILITY";
                    const houseCost = prop.houseCost || 50;
                    const canAffordHouse = me.coins >= houseCost;
                    const rent = calculateMonopolyRent(prop, tiles);

                    return (
                      <div
                        key={prop.index}
                        className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-2 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{prop.name}</span>
                            {currentHouses >= 5 ? (
                              <span className="text-[9px] bg-red-600 text-white px-1 rounded font-black">
                                فندق 🏨
                              </span>
                            ) : currentHouses > 0 ? (
                              <span className="text-[9px] bg-emerald-600 text-white px-1 rounded font-black">
                                {currentHouses} بيوت 🏠
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            الإيجار الحالي:{" "}
                            <span className="text-emerald-400 font-bold">{rent} ريال</span>
                          </div>
                        </div>

                        {/* Building Action Button */}
                        {canBuild && (
                          <button
                            disabled={!canAffordHouse}
                            onClick={() => {
                              triggerHaptic([30, 20, 50]);
                              sfx.playCoinChime();
                              sendAction({
                                type: "BUILD_HOUSE",
                                tileIndex: prop.index
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 disabled:opacity-50 text-white text-[11px] font-black flex items-center gap-1 shadow active:scale-95 transition-all"
                          >
                            <Home className="w-3 h-3" />
                            <span>
                              {currentHouses === 4
                                ? `فندق (${houseCost} ر.س)`
                                : `+بيت (${houseCost} ر.س)`}
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Controls: Dual 3D Dice Shaker Button */}
      <div className="h-[28%] bg-slate-900/60 border-t border-slate-800 p-4 flex flex-col items-center justify-center gap-2">
        {isMyTurn && gameState.phase === "TURN_START" ? (
          <div className="w-full max-w-xs flex flex-col items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic([40, 20, 70]);
                sfx.playDiceRoll();
                sendAction({ type: "ROLL_DICE" });
              }}
              className="w-full py-5 rounded-2xl text-2xl font-black bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500 text-slate-950 flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-transform border-2 border-amber-300/80 glow-amber"
            >
              <Dices className="w-8 h-8" />
              <span>هز وارمِ النردين 🎲🎲</span>
            </button>
            <p className="text-[11px] text-slate-400">
              {me.inJail ? "ارمِ نردين متطابقين للخروج مجاناً!" : "ارمِ النرد وانطلق عبر عقارات الرياض!"}
            </p>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-slate-400">
              {gameState.phase === "RESOLVING_TILE"
                ? "جاري احتساب الإيجارات والتحركات..."
                : "انتظر دورك لرمي النرد وتطوير عقاراتك..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
