"use client";

import React, { useState } from "react";
import {
  Flag,
  Coins,
  AlertTriangle,
  Layers,
  Flame,
  Vote,
  Edit3,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sliders,
  CheckCircle2,
  Building2,
  Shield,
  ArrowUpRight
} from "lucide-react";
import type { BoardTile, TileType } from "@/game/schema";

interface BoardEditorProps {
  tiles: BoardTile[];
  currencyName: string;
  onChangeTiles: (tiles: BoardTile[]) => void;
}

export const TILE_CONFIG: Record<
  TileType,
  {
    label: string;
    description: string;
    badgeBg: string;
    border: string;
    text: string;
    glow: string;
    icon: React.ReactNode;
  }
> = {
  START: {
    label: "نقطة البداية",
    description: "المربع الأول الذي ينطلق منه جميع اللاعبين ومكافأة الدورة",
    badgeBg: "bg-emerald-950/80 border-emerald-500/50 text-emerald-300",
    border: "border-emerald-500/60 hover:border-emerald-400",
    text: "text-emerald-400",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.25)]",
    icon: <Flag className="w-4 h-4 text-emerald-400" />
  },
  RESOURCE: {
    label: "مكسب وموارد",
    description: "يمنح اللاعب عملات أو رصيد إيجابي مباشر",
    badgeBg: "bg-amber-950/80 border-amber-500/50 text-amber-300",
    border: "border-amber-500/60 hover:border-amber-400",
    text: "text-amber-400",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.25)]",
    icon: <Coins className="w-4 h-4 text-amber-400" />
  },
  HAZARD: {
    label: "فخ وعقوبة",
    description: "يخصم رصيداً أو يفرض غرامة مالية على اللاعب",
    badgeBg: "bg-rose-950/80 border-rose-500/50 text-rose-300",
    border: "border-rose-500/60 hover:border-rose-400",
    text: "text-rose-400",
    glow: "shadow-[0_0_15px_rgba(244,63,94,0.25)]",
    icon: <AlertTriangle className="w-4 h-4 text-rose-400" />
  },
  SECRET_CARD: {
    label: "بطاقة سرية",
    description: "يسحب اللاعب بطاقة يد تكتيكية سرية إلى جواله",
    badgeBg: "bg-indigo-950/80 border-indigo-500/50 text-indigo-300",
    border: "border-indigo-500/60 hover:border-indigo-400",
    text: "text-indigo-400",
    glow: "shadow-[0_0_15px_rgba(99,102,241,0.25)]",
    icon: <Layers className="w-4 h-4 text-indigo-400" />
  },
  DRAMA_EVENT: {
    label: "حدث درامي",
    description: "يسحب بطاقة حدث علني يهز الطاولة فوراً",
    badgeBg: "bg-purple-950/80 border-purple-500/50 text-purple-300",
    border: "border-purple-500/60 hover:border-purple-400",
    text: "text-purple-400",
    glow: "shadow-[0_0_15px_rgba(168,85,247,0.25)]",
    icon: <Flame className="w-4 h-4 text-purple-400" />
  },
  GLOBAL_VOTE: {
    label: "تصويت جماعي",
    description: "محاكمة جماعية وتصويت مباشر بين جميع اللاعبين",
    badgeBg: "bg-cyan-950/80 border-cyan-500/50 text-cyan-300",
    border: "border-cyan-500/60 hover:border-cyan-400",
    text: "text-cyan-400",
    glow: "shadow-[0_0_15px_rgba(6,182,212,0.25)]",
    icon: <Vote className="w-4 h-4 text-cyan-400" />
  }
};

const ALL_TILE_TYPES: TileType[] = [
  "START",
  "RESOURCE",
  "HAZARD",
  "SECRET_CARD",
  "DRAMA_EVENT",
  "GLOBAL_VOTE"
];

export default function BoardEditor({
  tiles,
  currencyName,
  onChangeTiles
}: BoardEditorProps) {
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");

  const selectedTile =
    selectedTileIndex !== null && selectedTileIndex >= 0 && selectedTileIndex < tiles.length
      ? tiles[selectedTileIndex]
      : null;

  const handleUpdateTile = (index: number, updates: Partial<BoardTile>) => {
    const updated = tiles.map((tile, i) => {
      if (i !== index) return tile;
      return { ...tile, ...updates };
    });
    onChangeTiles(updated);
  };

  const handleTypeChange = (index: number, newType: TileType) => {
    const current = tiles[index];
    if (!current) return;

    let defaultEffect = current.defaultEffect;

    if (newType === "START") {
      defaultEffect = { actionType: "MODIFY_COINS", targetType: "SELF", value: 100 };
    } else if (newType === "RESOURCE") {
      defaultEffect = {
        actionType: "MODIFY_COINS",
        targetType: "SELF",
        value: current.defaultEffect?.value && current.defaultEffect.value > 0 ? current.defaultEffect.value : 60
      };
    } else if (newType === "HAZARD") {
      defaultEffect = {
        actionType: "MODIFY_COINS",
        targetType: "SELF",
        value: current.defaultEffect?.value && current.defaultEffect.value < 0 ? current.defaultEffect.value : -40
      };
    } else {
      defaultEffect = undefined;
    }

    handleUpdateTile(index, {
      tileType: newType,
      defaultEffect
    });
  };

  const handleCoinValueChange = (index: number, val: number) => {
    const current = tiles[index];
    if (!current) return;

    handleUpdateTile(index, {
      defaultEffect: {
        actionType: "MODIFY_COINS",
        targetType: "SELF",
        value: val
      }
    });
  };

  // Helper for grid positioning on visual track: 7 cols x 5 rows
  // 0..6 top, 7..9 right, 10..16 bottom (reversed), 17..19 left (reversed)
  const getGridCoords = (index: number) => {
    if (index >= 0 && index <= 6) return { row: 1, col: index + 1 };
    if (index >= 7 && index <= 9) return { row: index - 5, col: 7 };
    if (index >= 10 && index <= 16) return { row: 5, col: 17 - index };
    return { row: 21 - index, col: 1 };
  };

  return (
    <div className="space-y-6">
      {/* Top Bar / Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>محرر مسار اللعبة</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                20 مربعاً
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              انقر على أي مربع لتعديل اسمه، تصنيفه، وقيمة العملات المكتسبة أو المفقودة
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setViewMode("GRID")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === "GRID"
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            مسار دائري (Grid)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("LIST")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === "LIST"
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            قائمة المربعات (List)
          </button>
        </div>
      </div>

      {/* Grid Mode: Perimeter 7x5 Circuit */}
      {viewMode === "GRID" && (
        <div className="bg-slate-900/60 p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-xl overflow-x-auto">
          <div className="min-w-[650px] grid grid-cols-7 grid-rows-5 gap-2.5 relative">
            {/* Center HUD Info */}
            <div className="col-start-2 col-span-5 row-start-2 row-span-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 p-6 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-slate-200">
                حلبة اللعب التفاعلية
              </h4>
              <p className="text-xs text-slate-400 max-w-sm">
                المربع 0 يمثل نقطة البداية الدائرية. اضغط على أي مربع في المسار المحيط لفتح نافذة التعديل الفوري.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {ALL_TILE_TYPES.map((t) => {
                  const cfg = TILE_CONFIG[t];
                  const count = tiles.filter((x) => x.tileType === t).length;
                  return (
                    <div
                      key={t}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${cfg.badgeBg}`}
                    >
                      {cfg.icon}
                      <span>{cfg.label}:</span>
                      <span className="font-mono font-bold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Perimeter Tiles */}
            {tiles.map((tile) => {
              const cfg = TILE_CONFIG[tile.tileType] || TILE_CONFIG.RESOURCE;
              const coords = getGridCoords(tile.index);
              const isSelected = selectedTileIndex === tile.index;
              const effectVal = tile.defaultEffect?.value;

              return (
                <button
                  key={tile.index}
                  type="button"
                  style={{
                    gridRow: coords.row,
                    gridColumn: coords.col
                  }}
                  onClick={() => setSelectedTileIndex(tile.index)}
                  className={`relative p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between min-h-[92px] group ${
                    isSelected
                      ? `ring-2 ring-purple-400 bg-slate-800/90 ${cfg.glow}`
                      : `bg-slate-950/80 ${cfg.border} hover:bg-slate-800/50`
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700">
                      #{tile.index < 10 ? `0${tile.index}` : tile.index}
                    </span>
                    <span className="p-1 rounded-md bg-slate-900/60">{cfg.icon}</span>
                  </div>

                  <div className="my-1">
                    <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                      {tile.name}
                    </p>
                    <p className="text-[10px] text-slate-400 line-clamp-1">
                      {cfg.label}
                    </p>
                  </div>

                  <div className="text-[10px] font-mono">
                    {effectVal !== undefined && effectVal !== 0 ? (
                      <span
                        className={
                          effectVal > 0
                            ? "text-emerald-400 font-bold"
                            : "text-rose-400 font-bold"
                        }
                      >
                        {effectVal > 0 ? `+${effectVal}` : effectVal} {currencyName}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* List Mode: 20 Cards in Responsive Grid */}
      {viewMode === "LIST" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {tiles.map((tile) => {
            const cfg = TILE_CONFIG[tile.tileType] || TILE_CONFIG.RESOURCE;
            const isSelected = selectedTileIndex === tile.index;
            const effectVal = tile.defaultEffect?.value;

            return (
              <div
                key={tile.index}
                onClick={() => setSelectedTileIndex(tile.index)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? `bg-slate-800/90 border-purple-400 ring-2 ring-purple-500/40 ${cfg.glow}`
                    : `bg-slate-900/70 ${cfg.border} hover:bg-slate-800/50`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                      #{tile.index < 10 ? `0${tile.index}` : tile.index}
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md border flex items-center gap-1 font-bold ${cfg.badgeBg}`}
                    >
                      {cfg.icon}
                      <span>{cfg.label}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white mb-0.5">{tile.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {tile.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500">التأثير الافتراضي:</span>
                  {effectVal !== undefined && effectVal !== 0 ? (
                    <span
                      className={`font-mono font-bold ${
                        effectVal > 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {effectVal > 0 ? `+${effectVal}` : effectVal} {currencyName}
                    </span>
                  ) : (
                    <span className="text-slate-500">لا يوجد تأثير مباشر</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tile Edit Modal / Panel */}
      {selectedTile !== null && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            dir="rtl"
            className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-black px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  #{selectedTile.index < 10 ? `0${selectedTile.index}` : selectedTile.index}
                </span>
                <div>
                  <h3 className="text-lg font-black text-white">
                    تعديل المربع ({selectedTile.name})
                  </h3>
                  <p className="text-xs text-slate-400">
                    خصص خصائص هذا المربع في لوحة اللعبة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTileIndex(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Tile Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  اسم المربع (يظهر على اللوحة)
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={selectedTile.name}
                  onChange={(e) =>
                    handleUpdateTile(selectedTile.index, { name: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold focus:border-purple-500 outline-none transition-colors"
                  placeholder="مثال: منجم الذهب، فخ المتاهة..."
                />
              </div>

              {/* Tile Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  نوع المربع
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_TILE_TYPES.map((type) => {
                    const cfg = TILE_CONFIG[type];
                    const isCurrent = selectedTile.tileType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleTypeChange(selectedTile.index, type)}
                        className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2 ${
                          isCurrent
                            ? `bg-slate-800 border-purple-400 text-white font-bold ring-1 ring-purple-400 ${cfg.glow}`
                            : `bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200`
                        }`}
                      >
                        <span className="p-1 rounded-lg bg-slate-900 border border-slate-800">
                          {cfg.icon}
                        </span>
                        <span className="text-xs">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {TILE_CONFIG[selectedTile.tileType]?.description}
                </p>
              </div>

              {/* Coin Value (Default Effect) */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>تأثير العملات ({currencyName})</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {selectedTile.defaultEffect?.value !== undefined
                      ? `${selectedTile.defaultEffect.value > 0 ? "+" : ""}${
                          selectedTile.defaultEffect.value
                        } ${currencyName}`
                      : "بدون تأثير مالي"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={-100}
                    max={150}
                    value={selectedTile.defaultEffect?.value ?? 0}
                    onChange={(e) =>
                      handleCoinValueChange(
                        selectedTile.index,
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-32 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-white font-mono font-bold text-lg focus:border-amber-400 outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {[-50, -30, 0, 50, 75, 100].map((presetVal) => (
                      <button
                        key={presetVal}
                        type="button"
                        onClick={() =>
                          handleCoinValueChange(selectedTile.index, presetVal)
                        }
                        className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-colors ${
                          presetVal === 0
                            ? "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                            : presetVal > 0
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60"
                            : "bg-rose-950/60 text-rose-300 border-rose-500/40 hover:bg-rose-900/60"
                        }`}
                      >
                        {presetVal > 0 ? `+${presetVal}` : presetVal}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  القيم الموجبة تكافئ اللاعب عند الوقوف، والقيم السالبة تخصم من رصيده
                </p>
              </div>

              {/* Property, Rent, Armies, and Jump Settings */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>خصائص العقار والقفز والأقاليم</span>
                  </label>
                  <span className="text-[11px] text-slate-400">اختياري لمونوبولي وريسك والسلم</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Price */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      🏷️ سعر الشراء ({currencyName})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={selectedTile.price ?? ""}
                      placeholder="غير معروض للبيع"
                      onChange={(e) =>
                        handleUpdateTile(selectedTile.index, {
                          price: e.target.value === "" ? undefined : parseInt(e.target.value) || 0
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-emerald-400 outline-none"
                    />
                  </div>

                  {/* Rent */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      🏠 الإيجار عند الوقوف
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={selectedTile.rent ?? ""}
                      placeholder="بدون إيجار"
                      onChange={(e) =>
                        handleUpdateTile(selectedTile.index, {
                          rent: e.target.value === "" ? undefined : parseInt(e.target.value) || 0
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-emerald-400 outline-none"
                    />
                  </div>

                  {/* Jump To Index (Snakes & Ladders) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      🪜/🐍 قفزة إلى المربع #
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={tiles.length - 1}
                      value={selectedTile.jumpToIndex ?? ""}
                      placeholder="بدون قفزة"
                      onChange={(e) =>
                        handleUpdateTile(selectedTile.index, {
                          jumpToIndex: e.target.value === "" ? undefined : parseInt(e.target.value)
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-amber-400 outline-none"
                    />
                  </div>

                  {/* Armies (Risk) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      🛡️ جيش الدفاع (ريسك)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={selectedTile.armies ?? ""}
                      placeholder="بدون جيش"
                      onChange={(e) =>
                        handleUpdateTile(selectedTile.index, {
                          armies: e.target.value === "" ? undefined : parseInt(e.target.value) || 0
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  الوصف أو الرسالة الساخرة عند الوقوف عليه
                </label>
                <textarea
                  maxLength={120}
                  rows={2}
                  value={selectedTile.description}
                  onChange={(e) =>
                    handleUpdateTile(selectedTile.index, {
                      description: e.target.value
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs focus:border-purple-500 outline-none resize-none transition-colors"
                  placeholder="مثال: تعثرت في الحفرة ودفعت غرامة..."
                />
              </div>
            </div>

            {/* Modal Footer with Prev / Next Tile buttons */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={selectedTile.index <= 0}
                  onClick={() => setSelectedTileIndex(selectedTile.index - 1)}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>
                <button
                  type="button"
                  disabled={selectedTile.index >= tiles.length - 1}
                  onClick={() => setSelectedTileIndex(selectedTile.index + 1)}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTileIndex(null)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تم وحفظ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
