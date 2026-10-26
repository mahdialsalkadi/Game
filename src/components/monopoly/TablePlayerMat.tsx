"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Coins,
  Shield,
  Building2,
  Lock,
  Sparkles,
  Bot,
  Crown,
  Wifi,
  WifiOff
} from "lucide-react";
import type { ExtendedPlayerState } from "@/game/gameRoom";
import type { BoardTile } from "@/game/schema";
import {
  MONOPOLY_COLOR_GROUPS,
  type MonopolyColorGroupKey
} from "@/game/monopolyEngine";
import MonopolyPawn3D, {
  TOKEN_NAMES_AR,
  TOKEN_TYPES,
  type MonopolyTokenType
} from "./MonopolyPawn3D";

export interface TablePlayerMatProps {
  player: ExtendedPlayerState;
  isCurrentTurn: boolean;
  colorGroupCounts?: Record<string, number>;
  ownedTiles?: BoardTile[];
  position: "left" | "right" | "top" | "bottom";
  tokenType?: MonopolyTokenType;
  currencyName?: string;
}

// Saudi Riyal Banknote Denominations Specification
interface BanknoteConfig {
  value: number;
  arabicValue: string;
  arabicName: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  subText: string;
}

const SAUDI_BANKNOTES: BanknoteConfig[] = [
  {
    value: 500,
    arabicValue: "٥٠٠",
    arabicName: "خمسمائة ريال",
    bgGradient: "from-[#0f244a] via-[#1e3a8a] to-[#172554]",
    borderColor: "border-[#d97706]",
    textColor: "text-[#fef08a]",
    accentColor: "#fbbf24",
    subText: "البنك المركزي السعودي"
  },
  {
    value: 100,
    arabicValue: "١٠٠",
    arabicName: "مائة ريال",
    bgGradient: "from-[#5a1212] via-[#991b1b] to-[#7f1d1d]",
    borderColor: "border-[#f87171]",
    textColor: "text-[#fee2e2]",
    accentColor: "#ef4444",
    subText: "مؤسسة النقد العربي"
  },
  {
    value: 50,
    arabicValue: "٥٠",
    arabicName: "خمسون ريالاً",
    bgGradient: "from-[#063e2c] via-[#047857] to-[#064e3b]",
    borderColor: "border-[#34d399]",
    textColor: "text-[#d1fae5]",
    accentColor: "#10b981",
    subText: "ريال سعودي"
  },
  {
    value: 10,
    arabicValue: "١٠",
    arabicName: "عشرة ريالات",
    bgGradient: "from-[#3e1b07] via-[#78350f] to-[#451a03]",
    borderColor: "border-[#fbbf24]",
    textColor: "text-[#fef3c7]",
    accentColor: "#d97706",
    subText: "عملة تذكارية"
  },
  {
    value: 5,
    arabicValue: "٥",
    arabicName: "خمسة ريالات",
    bgGradient: "from-[#2f0d4f] via-[#581c87] to-[#3b0764]",
    borderColor: "border-[#c084fc]",
    textColor: "text-[#f3e8ff]",
    accentColor: "#a855f7",
    subText: "ريال سعودي"
  }
];

const CLASSIC_DOLLAR_BANKNOTES: BanknoteConfig[] = [
  {
    value: 500,
    arabicValue: "$500",
    arabicName: "خمسمائة دولار",
    bgGradient: "from-[#9a3412] via-[#ea580c] to-[#c2410c]",
    borderColor: "border-[#fef08a]",
    textColor: "text-[#fef08a]",
    accentColor: "#fbbf24",
    subText: "BANK OF MONOPOLY"
  },
  {
    value: 100,
    arabicValue: "$100",
    arabicName: "مائة دولار",
    bgGradient: "from-[#854d0e] via-[#ca8a04] to-[#a16207]",
    borderColor: "border-[#fef9c3]",
    textColor: "text-[#fef9c3]",
    accentColor: "#facc15",
    subText: "MONOPOLY RESERVE"
  },
  {
    value: 50,
    arabicValue: "$50",
    arabicName: "خمسون دولاراً",
    bgGradient: "from-[#1e3a8a] via-[#2563eb] to-[#1d4ed8]",
    borderColor: "border-[#bfdbfe]",
    textColor: "text-[#dbeafe]",
    accentColor: "#60a5fa",
    subText: "MONOPOLY RESERVE"
  },
  {
    value: 20,
    arabicValue: "$20",
    arabicName: "عشرون دولاراً",
    bgGradient: "from-[#14532d] via-[#16a34a] to-[#15803d]",
    borderColor: "border-[#bbf7d0]",
    textColor: "text-[#dcfce7]",
    accentColor: "#4ade80",
    subText: "MONOPOLY RESERVE"
  },
  {
    value: 10,
    arabicValue: "$10",
    arabicName: "عشرة دولارات",
    bgGradient: "from-[#78350f] via-[#b45309] to-[#92400e]",
    borderColor: "border-[#fde68a]",
    textColor: "text-[#fef3c7]",
    accentColor: "#fbbf24",
    subText: "MONOPOLY RESERVE"
  },
  {
    value: 5,
    arabicValue: "$5",
    arabicName: "خمسة دولارات",
    bgGradient: "from-[#831843] via-[#db2777] to-[#be185d]",
    borderColor: "border-[#fbcfe8]",
    textColor: "text-[#fdf2f8]",
    accentColor: "#f472b6",
    subText: "MONOPOLY RESERVE"
  },
  {
    value: 1,
    arabicValue: "$1",
    arabicName: "دولار واحد",
    bgGradient: "from-[#334155] via-[#64748b] to-[#475569]",
    borderColor: "border-[#e2e8f0]",
    textColor: "text-[#f8fafc]",
    accentColor: "#cbd5e1",
    subText: "MONOPOLY RESERVE"
  }
];

export default function TablePlayerMat({
  player,
  isCurrentTurn,
  colorGroupCounts = {},
  ownedTiles = [],
  position,
  tokenType,
  currencyName = "$"
}: TablePlayerMatProps) {
  const isDollar =
    currencyName === "$" ||
    currencyName === "دولار" ||
    currencyName === "USD" ||
    currencyName === "M";
  const banknotePalette = isDollar ? CLASSIC_DOLLAR_BANKNOTES : SAUDI_BANKNOTES;

  // Determine displayed banknotes fanned out based on cash
  const fannedNotes = useMemo(() => {
    const cash = Math.max(0, player.coins);
    const notes: { config: BanknoteConfig; count: number; angle: number; offsetX: number }[] = [];

    // Select suitable banknotes to fan out
    const activeDenoms: BanknoteConfig[] = [];
    for (const noteConfig of banknotePalette) {
      if (cash >= noteConfig.value) {
        activeDenoms.push(noteConfig);
      }
    }
    if (activeDenoms.length === 0) {
      activeDenoms.push(banknotePalette[banknotePalette.length - 1]);
    }

    // Pick top 3-4 representative notes to display fanned
    const displayList = activeDenoms.slice(0, 4);
    const angles = displayList.length === 4
      ? [-9, -3, 3, 9]
      : displayList.length === 3
      ? [-7, 0, 7]
      : [-4, 4];

    displayList.forEach((denom, i) => {
      notes.push({
        config: denom,
        count: Math.max(1, Math.floor(cash / denom.value)),
        angle: angles[i] || 0,
        offsetX: (i - (displayList.length - 1) / 2) * 14
      });
    });

    return notes;
  }, [player.coins, banknotePalette]);

  const isVertical = position === "left" || position === "right";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-3xl p-3 md:p-3.5 transition-all select-none ${
        isCurrentTurn
          ? "ring-2 ring-amber-400/90 shadow-[0_15px_35px_rgba(245,158,11,0.35),0_10px_25px_rgba(0,0,0,0.8)]"
          : "shadow-[0_12px_28px_rgba(0,0,0,0.7)]"
      } bg-gradient-to-b from-[#1b120c]/95 via-[#130b06]/95 to-[#0b0603]/95 border border-[#3e2415] backdrop-blur-sm w-full flex flex-col gap-2.5`}
    >
      {/* Table Stitching & Brass Corner Accents */}
      <div className="absolute inset-1 rounded-2xl border border-dashed border-[#57351f]/60 pointer-events-none" />
      <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-amber-500/50 rounded-tl pointer-events-none" />
      <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t border-r border-amber-500/50 rounded-tr pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b border-l border-amber-500/50 rounded-bl pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-amber-500/50 rounded-br pointer-events-none" />

      {/* --- SECTION 1: PLAYER PROFILE & 3D TOKEN HEADER --- */}
      <div className="flex items-center justify-between gap-2 z-10 w-full min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* 3D Metallic Token Icon with Turn Glow */}
          <div className="relative shrink-0">
            <div
              className={`relative rounded-full p-0.5 ${
                isCurrentTurn
                  ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-[#1b120c] animate-pulse"
                  : ""
              }`}
            >
              <MonopolyPawn3D
                tokenType={tokenType}
                playerColor={player.color}
                playerName={player.name}
                size="md"
              />
            </div>
            {player.inJail && (
              <span
                title="في السجن"
                className="absolute -bottom-1 -right-1 text-xs bg-rose-950 border border-rose-500 rounded-full p-0.5 shadow leading-none"
              >
                ⛓️
              </span>
            )}
          </div>

          {/* Name & Player Badges */}
          <div className="text-right min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="text-xs md:text-sm font-black text-amber-100 flex items-center gap-1 truncate max-w-[110px] sm:max-w-[160px]"
                title={player.name}
              >
                {player.name}
                {player.hasShield && (
                  <Shield className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/40 inline shrink-0" />
                )}
              </span>
              {player.isBot && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-600/40 shrink-0">
                  ذكاء 🤖
                </span>
              )}
            </div>

            {/* Connection and Turn Status */}
            <div className="flex items-center gap-1 text-[10px]">
              {player.isConnected ? (
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                  متصل
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                  غير متصل
                </span>
              )}
              {isCurrentTurn && (
                <span className="text-amber-300 font-extrabold mr-1 flex items-center gap-0.5">
                  • حان دوره! 🎲
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Total Cash Balance Plaque in Embossed Gold */}
        <div className="text-left px-2.5 py-1 rounded-xl bg-gradient-to-br from-[#2a170c] to-[#120904] border border-amber-500/40 shadow-inner shrink-0">
          <div className="text-[8.5px] font-bold text-amber-300/80">الرصيد النقدي</div>
          <div className="text-xs md:text-sm font-black text-amber-300 flex items-center justify-end gap-1">
            {isDollar ? (
              <span>${player.coins.toLocaleString()}</span>
            ) : (
              <>
                <span>{player.coins.toLocaleString("ar-SA")}</span>
                <span className="text-[10px] text-amber-400 font-bold">ريال</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- SECTION 2: PHYSICAL BANKNOTES (أوراق النقد) --- */}
      <div className="relative w-full py-1 z-10 flex flex-col items-center">
        <div className="w-full flex items-center justify-between text-[9px] font-extrabold text-amber-200/70 mb-1 px-1">
          <span>حزم النقد المتوفرة</span>
          <span className="text-emerald-400 font-black">
            {isDollar ? "أوراق مونوبولي الأصلية 💵" : "أوراق ملكية رسمية 🇸🇦"}
          </span>
        </div>

        {/* Banknotes Fanned Out Container */}
        <div className="relative h-20 w-full flex items-center justify-center overflow-visible my-1">
          {fannedNotes.map((note, idx) => {
            const { config, angle, offsetX } = note;
            return (
              <motion.div
                key={config.value}
                whileHover={{ scale: 1.12, y: -8, zIndex: 30 }}
                style={{
                  transform: `translateX(${offsetX}px) rotate(${angle}deg)`,
                  zIndex: 10 + idx
                }}
                className={`absolute w-36 md:w-40 h-16 rounded-md p-1.5 bg-gradient-to-r ${config.bgGradient} border ${config.borderColor} shadow-[0_6px_14px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.25)] flex flex-col justify-between overflow-hidden cursor-pointer transition-shadow`}
                title={`${config.arabicName} (${isDollar ? '$' : ''}${config.value}${isDollar ? '' : ' SAR'})`}
              >
                {/* Guilloche Micro-Pattern Watermark */}
                <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:4px_4px]" />

                {/* Central Bank Crest / Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                  {isDollar ? (
                    <svg viewBox="0 0 40 40" className="w-10 h-10 text-white fill-current">
                      <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
                      <text x="20" y="27" textAnchor="middle" fontSize="22" fontWeight="900" fill="currentColor">M</text>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 40 40" className="w-10 h-10 text-white fill-current">
                      <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
                      <path d="M20 8L20 32M12 24L28 24M14 16L26 16" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </div>

                {/* Banknote Top Header Bar */}
                <div className="flex items-center justify-between z-10">
                  <span className={`text-[7px] font-black ${config.textColor} tracking-tight`}>
                    {config.subText}
                  </span>
                  <span className={`text-[9px] font-black ${config.textColor} drop-shadow`}>
                    {config.arabicValue}
                  </span>
                </div>

                {/* Banknote Center Details */}
                <div className="text-center z-10">
                  <div className={`text-[8.5px] font-black ${config.textColor} leading-none tracking-wide`}>
                    {config.arabicName}
                  </div>
                  <div className="text-[6.5px] text-amber-200/70 font-semibold mt-0.5">
                    {isDollar ? `MONOPOLY RESERVE • $${config.value}` : `SAUDI RIYAL • ${config.value} SAR`}
                  </div>
                </div>

                {/* Banknote Bottom Footer Bar */}
                <div className="flex items-center justify-between z-10">
                  <span className={`text-[8px] font-black ${config.textColor}`}>
                    {config.arabicValue}
                  </span>
                  <span className="text-[6px] text-white/60 tracking-wider">
                    {isDollar ? `№ US-${config.value}78-M` : `№ 78942-SAR`}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* --- SECTION 3: PHYSICAL PROPERTY DEED CARDS (صكوك الملكية الورقية) --- */}
      <div className="w-full z-10 flex flex-col">
        <div className="flex items-center justify-between text-[9px] font-extrabold text-amber-200/70 mb-1 px-1">
          <span>صكوك الملكية ({ownedTiles.length})</span>
          {ownedTiles.length > 0 && (
            <span className="text-amber-400 font-bold">عقارات معتمدة</span>
          )}
        </div>

        {ownedTiles.length === 0 ? (
          <div className="text-center py-2 px-3 rounded-xl bg-black/30 border border-[#3e2415] text-[10px] text-amber-300/50">
            لا يملك أي عقار حتى الآن
          </div>
        ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-thin">
            {ownedTiles.map((tile) => {
              const colorConfig = tile.colorGroup
                ? MONOPOLY_COLOR_GROUPS[tile.colorGroup as MonopolyColorGroupKey]
                : null;
              const isMortgaged = (tile as any).isMortgaged || false;
              const houses = tile.houses || 0;

              return (
                <div
                  key={tile.index}
                  className={`shrink-0 w-16 md:w-20 rounded-lg bg-[#fbfbf8] border-2 border-stone-800 shadow-[0_4px_8px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden relative ${
                    isMortgaged ? "opacity-60" : ""
                  }`}
                  title={`${tile.name} - ${colorConfig?.nameAr || "عقار"}`}
                >
                  {/* Saturated Color Band at Top */}
                  <div
                    style={{
                      backgroundColor: colorConfig?.colorHex || "#475569"
                    }}
                    className="w-full h-3.5 flex items-center justify-between px-1 border-b border-stone-800"
                  >
                    {/* Miniature 3D Villas/Hotel Indicator */}
                    {houses >= 5 ? (
                      <span className="text-[7px] text-amber-300 font-black" title="فندق">
                        🏨
                      </span>
                    ) : houses > 0 ? (
                      <span className="text-[7px] text-emerald-300 font-black" title={`${houses} فيلا`}>
                        {"🏠".repeat(Math.min(houses, 4))}
                      </span>
                    ) : (
                      <span className="w-1" />
                    )}
                    <span className="text-[6.5px] font-black text-white truncate drop-shadow-xs">
                      صك
                    </span>
                  </div>

                  {/* Cream Paper Card Body */}
                  <div className="p-1 text-center bg-[#f7f6f0] flex flex-col justify-between min-h-[38px]">
                    <div className="text-[7.5px] font-black text-stone-900 leading-tight line-clamp-2">
                      {tile.name}
                    </div>
                    <div className="text-[6.5px] font-bold text-stone-600 mt-0.5">
                      {tile.price ? `${tile.price} ر.س` : "عقار"}
                    </div>
                  </div>

                  {/* Mortgaged Red Stamp Overlay */}
                  {isMortgaged && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="text-[8px] font-black text-rose-500 border border-rose-600 px-1 py-0.2 rounded bg-rose-950/90 rotate-[-18deg]">
                        مرهون
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
