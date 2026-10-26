"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Flame,
  ChevronUp,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Brain,
  Shield
} from "lucide-react";
import type { FullRoomState } from "@/game/gameRoom";
import type {
  UnoCard,
  UnoSanitizedState,
  UnoActiveColor
} from "@/game/unoEngine";
import { UNO_COLOR_CONFIG, canPlayUnoCard } from "@/game/unoEngine";
import { sfx } from "@/utils/soundEffects";
import UserProfileModal from "@/components/profile/UserProfileModal";

interface UnoPlayerControllerProps {
  gameState: FullRoomState;
  sendAction: (payload: Record<string, unknown>) => void;
  playerId: string;
  errorToast: string | null;
  showSmartHints?: boolean;
  playMode?: "CASUAL" | "PRO";
}

export default function UnoPlayerController({
  gameState,
  sendAction,
  playerId,
  errorToast,
  showSmartHints = true,
  playMode = "CASUAL"
}: UnoPlayerControllerProps) {
  const [selectedWildCard, setSelectedWildCard] = useState<UnoCard | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasShoutedUnoLocally, setHasShoutedUnoLocally] = useState(false);

  const me = gameState?.players?.[playerId];
  const isMyTurn = gameState?.turnOrder?.[gameState.currentTurnIndex] === playerId;
  const phase = gameState?.phase;

  const uno = gameState?.unoState as UnoSanitizedState | undefined;
  const myCards: UnoCard[] = uno?.myHand || [];
  const topCard = uno?.topCard;
  const activeColor = uno?.activeColor || "RED";
  const hasDrawnThisTurn = Boolean(uno?.hasDrawnThisTurn);
  const drawnCardId = uno?.drawnCardId;

  // Reset local shout if hand grows above 2
  useEffect(() => {
    if (myCards.length > 2) {
      setHasShoutedUnoLocally(false);
    }
  }, [myCards.length]);

  // Haptic feedback helper
  const triggerHaptic = (pattern: number | number[] = 30) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  };

  // Turn arrival alert
  useEffect(() => {
    if (isMyTurn && phase === "TURN_START") {
      sfx.playTurnChime();
      triggerHaptic([80, 40, 100]);
    }
  }, [isMyTurn, phase]);

  // Calculate playable status for each card in hand
  const cardPlayability = useMemo(() => {
    if (!topCard || !activeColor) return {};
    const map: Record<string, boolean> = {};
    for (const card of myCards) {
      // بعد السحب: الورقة المسحوبة فقط قابلة للعب (أو تمرير الدور).
      const allowedAfterDraw = !hasDrawnThisTurn || card.id === drawnCardId;
      map[card.id] =
        isMyTurn && allowedAfterDraw && canPlayUnoCard(card, topCard, activeColor);
    }
    return map;
  }, [myCards, topCard, activeColor, isMyTurn, hasDrawnThisTurn, drawnCardId]);

  const playableCount = Object.values(cardPlayability).filter(Boolean).length;

  // Handle card click or drag release
  const handlePlayCard = (card: UnoCard) => {
    if (!isMyTurn || !cardPlayability[card.id]) {
      triggerHaptic(50);
      return;
    }

    triggerHaptic(35);
    sfx.playCardSlide();

    if (card.color === "WILD") {
      setSelectedWildCard(card);
      setIsColorPickerOpen(true);
    } else {
      sendAction({
        type: "PLAY_UNO_CARD",
        cardId: card.id
      });
    }
  };

  // Color selection for Wild cards
  const handleChooseColor = (color: UnoActiveColor) => {
    if (!selectedWildCard) return;
    triggerHaptic([40, 30]);
    sfx.playCardSlide();

    sendAction({
      type: "PLAY_UNO_CARD",
      cardId: selectedWildCard.id,
      chosenColor: color
    });

    setIsColorPickerOpen(false);
    setSelectedWildCard(null);
  };

  // Handle draw card from deck
  const handleDrawCard = () => {
    if (!isMyTurn || hasDrawnThisTurn) return;
    triggerHaptic([30, 20]);
    sfx.playCardPlay();
    sendAction({ type: "DRAW_UNO_CARD" });
  };

  // Keep the drawn card and pass the turn
  const handlePassAfterDraw = () => {
    if (!isMyTurn || !hasDrawnThisTurn) return;
    triggerHaptic(30);
    sfx.playCardSlide();
    sendAction({ type: "PASS_UNO_AFTER_DRAW" });
  };

  // Handle shouting UNO
  const handleShoutUno = () => {
    triggerHaptic([100, 50, 100]);
    sfx.playUnoShout();
    setHasShoutedUnoLocally(true);
    sendAction({ type: "SHOUT_UNO" });
  };

  const showUnoShoutButton = myCards.length <= 2 && !hasShoutedUnoLocally;

  return (
    <div
      dir="rtl"
      className="min-h-[100dvh] w-screen bg-slate-950 text-white flex flex-col justify-between overflow-y-auto select-none"
    >
      {/* 1. TOP IDENTITY & STATUS BAR */}
      <header
        className="h-14 flex items-center justify-between px-4 shadow-md z-30 shrink-0"
        style={{ backgroundColor: me?.color || "#3B82F6" }}
      >
        <div className="flex items-center gap-2">
          <span className="font-black text-lg text-slate-950 truncate max-w-[140px]">
            {me?.name || "اللاعب"}
          </span>
          <button
            onClick={() => setIsProfileOpen(true)}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors"
            title="البصمة والحساب"
          >
            <Brain className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Color & Top Card Preview */}
        <div className="flex items-center gap-3">
          {topCard && (
            <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-950">
              <span className="text-[10px] text-slate-800">على الطاولة:</span>
              <span
                style={{ backgroundColor: UNO_COLOR_CONFIG[activeColor].hex }}
                className="w-3.5 h-3.5 rounded-full inline-block border border-white/60 shadow"
              />
              <span className="font-black">{topCard.label}</span>
            </div>
          )}
          <div className="flex items-center gap-1 font-black text-slate-950 text-sm">
            <Layers className="w-4 h-4" />
            <span>{myCards.length} كروت</span>
          </div>
        </div>
      </header>

      {/* 2. DYNAMIC TURN & ACTION BANNER */}
      <div className="px-3 pt-2 shrink-0 z-20">
        {isMyTurn ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-2 px-3 rounded-2xl bg-gradient-to-r from-amber-500/30 via-orange-500/40 to-amber-500/30 border-2 border-amber-400 flex items-center justify-between text-amber-200 font-black text-xs shadow-lg"
          >
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span>
                ⭐ دورك الآن!{" "}
                {hasDrawnThisTurn
                  ? "سحبت ورقة — العب الورقة المسحوبة أو مرّر الدور"
                  : playableCount > 0
                  ? "المس ورقة أو اسحبها للأعلى لرميها"
                  : "ليس لديك ورقة مطابقة، اسحب من الكومة!"}
              </span>
            </span>
            <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black">
              {hasDrawnThisTurn
                ? "ورقة مسحوبة"
                : playableCount > 0
                ? `${playableCount} متاح للعب`
                : "اسحب ورقة"}
            </span>
          </motion.div>
        ) : (
          <div className="py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
            انتظر دورك... الورقة المطلوبة: لون{" "}
            <strong style={{ color: UNO_COLOR_CONFIG[activeColor].hex }}>
              {UNO_COLOR_CONFIG[activeColor].nameAr}
            </strong>{" "}
            أو رمز <strong>{topCard?.label}</strong>
          </div>
        )}

        {/* Just-In-Time Smart Hint Tooltip (Casual Mode Only) */}
        {showSmartHints && isMyTurn && playableCount > 0 && !hasDrawnThisTurn && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 py-1 px-3 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>💡 كارت صالح: يطابق اللون أو الرمز</span>
          </motion.div>
        )}

        {/* Error Toast Message */}
        <AnimatePresence>
          {errorToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 bg-rose-900/90 border border-rose-500 rounded-xl px-3 py-1.5 text-center text-xs text-rose-200 flex items-center justify-center gap-1.5 shadow"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>{errorToast}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. 3D CURVED CARD FAN (مروحة الكروت في يدك) */}
      <div className="flex-1 relative flex items-center justify-center px-2 overflow-visible">
        {myCards.length > 0 ? (
          <div className="relative w-full max-w-md h-56 md:h-64 flex items-center justify-center">
            {myCards.map((card, idx) => {
              const count = myCards.length;
              const mid = (count - 1) / 2;
              const offsetFromMid = idx - mid;

              // Fan curvature physics:
              // angle step contracts smoothly as hand size grows
              const maxSpreadAngle = Math.min(80, count * 11);
              const angleStep = count > 1 ? maxSpreadAngle / (count - 1) : 0;
              const rotation = offsetFromMid * angleStep;

              // Vertical arch offset: parabole y = (offset)^2 * archFactor
              const archFactor = count > 7 ? 3.5 : 5.5;
              const yArch = Math.pow(offsetFromMid, 2) * archFactor;

              // Horizontal spread
              const maxSpreadX = Math.min(260, count * 36);
              const xStep = count > 1 ? maxSpreadX / (count - 1) : 0;
              const xOffset = offsetFromMid * xStep;

              const isPlayable = Boolean(cardPlayability[card.id]);

              return (
                <motion.div
                  key={card.id}
                  drag={isPlayable ? "y" : false}
                  dragConstraints={{ top: -160, bottom: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    if (isPlayable && info.offset.y < -50) {
                      handlePlayCard(card);
                    }
                  }}
                  onClick={() => handlePlayCard(card)}
                  style={{
                    x: xOffset,
                    y: isPlayable ? yArch - 18 : yArch,
                    rotate: rotation,
                    zIndex: isPlayable ? 30 + idx : 10 + idx
                  }}
                  whileHover={isPlayable ? { scale: 1.12, y: yArch - 28 } : undefined}
                  whileTap={isPlayable ? { scale: 0.95 } : undefined}
                  className={`absolute w-24 h-38 md:w-28 md:h-44 cursor-pointer transition-shadow rounded-2xl ${
                    isPlayable
                      ? showSmartHints
                        ? "ring-4 ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.8)] filter brightness-105"
                        : "border border-amber-400/60"
                      : "opacity-75 filter grayscale-[25%]"
                  }`}
                >
                  <HandUnoCard card={card} isPlayable={isPlayable} />

                  {/* Swipe Up Arrow Indicator for Playable Cards (Casual Mode Only) */}
                  {isPlayable && showSmartHints && (
                    <motion.div
                      animate={{ y: [-2, -6, -2] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 rounded-full p-0.5 shadow-md"
                    >
                      <ChevronUp className="w-3.5 h-3.5 stroke-[3]" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6">
            <Sparkles className="w-12 h-12 text-amber-400 mb-2 animate-bounce" />
            <h3 className="text-xl font-black text-amber-300">أنهيت جميع أوراقك!</h3>
            <p className="text-xs text-slate-400 mt-1">ترقب إعلان الفوز على الشاشة الكبيرة!</p>
          </div>
        )}
      </div>

      {/* 4. BOTTOM INTERACTION AREA: DRAW CARD & UNO SHOUT BUTTONS */}
      <footer className="bg-slate-900/90 border-t border-slate-800 p-3 flex items-center justify-between gap-3 z-30 shrink-0">
        {/* Draw Card Button */}
        <button
          onClick={handleDrawCard}
          disabled={!isMyTurn || hasDrawnThisTurn}
          className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
            isMyTurn && !hasDrawnThisTurn
              ? "bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white border border-indigo-400/50 active:scale-95"
              : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
          }`}
        >
          <Layers className="w-5 h-5 text-indigo-300" />
          <span>
            {hasDrawnThisTurn ? "سحبت ورقتك بالفعل ✓" : "اسحب ورقة من الكومة 🃏"}
          </span>
        </button>

        {/* Pass After Drawing */}
        {hasDrawnThisTurn && (
          <button
            onClick={handlePassAfterDraw}
            disabled={!isMyTurn}
            className="flex-1 py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border border-slate-400/40 active:scale-95"
          >
            <span> احتفظ بها ومرّر الدور ⏭️</span>
          </button>
        )}

        {/* Pulsing "UNO!" Shout Button (زر صرخة أونو) */}
        {showUnoShoutButton && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.08, 1], opacity: 1 }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            onClick={handleShoutUno}
            className="py-3.5 px-6 rounded-2xl font-black text-base bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.9)] border-2 border-yellow-300 flex items-center gap-2 active:scale-90"
          >
            <Flame className="w-6 h-6 text-yellow-200 fill-yellow-200 animate-pulse" />
            <span>صرخة أونو! 🔥</span>
          </motion.button>
        )}
      </footer>

      {/* 5. 4-QUADRANT COLOR PICKER MODAL (FOR WILD / +4 CARDS) */}
      <AnimatePresence>
        {isColorPickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.7, rotate: -6 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl"
            >
              <h3 className="text-xl font-black text-white mb-1">اختر اللون التالي! 🎨</h3>
              <p className="text-xs text-slate-400 mb-5">
                لعبت ورقة الجوكر، حدد اللون الذي يجب على الخصم اتباعه:
              </p>

              {/* 4 Quadrants Grid */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleChooseColor("RED")}
                  className="h-20 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 text-white font-black text-lg shadow-lg border-2 border-red-300 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                >
                  أحمر 🔴
                </button>
                <button
                  onClick={() => handleChooseColor("BLUE")}
                  className="h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white font-black text-lg shadow-lg border-2 border-blue-300 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                >
                  أزرق 🔵
                </button>
                <button
                  onClick={() => handleChooseColor("YELLOW")}
                  className="h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 text-slate-950 font-black text-lg shadow-lg border-2 border-yellow-200 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                >
                  أصفر 🟡
                </button>
                <button
                  onClick={() => handleChooseColor("GREEN")}
                  className="h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-lg shadow-lg border-2 border-emerald-300 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                >
                  أخضر 🟢
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}

/**
 * Mobile Hand Uno Card Renderer
 */
function HandUnoCard({ card, isPlayable }: { card: UnoCard; isPlayable: boolean }) {
  const isWild = card.color === "WILD";
  const colorCfg = UNO_COLOR_CONFIG[card.color as UnoActiveColor] || UNO_COLOR_CONFIG.RED;

  return (
    <div
      className={`w-full h-full rounded-2xl border-2 border-white/90 shadow-xl flex flex-col justify-between p-2 relative overflow-hidden select-none ${
        isWild
          ? "bg-gradient-to-tr from-slate-950 via-purple-950 to-slate-900"
          : colorCfg.bgClass
      }`}
    >
      {/* Glossy Sheen Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/25 via-transparent to-black/25 pointer-events-none" />

      {/* Top Left Label */}
      <span className="text-white font-black text-xs drop-shadow leading-none z-10">
        {card.label}
      </span>

      {/* Center Oval */}
      <div className="mx-auto my-auto w-12 h-18 md:w-14 md:h-20 rounded-full bg-white shadow-inner flex items-center justify-center rotate-[-22deg] z-10 border border-black/10">
        {isWild ? (
          <div className="grid grid-cols-2 grid-rows-2 w-8 h-8 rounded-full overflow-hidden border border-black/20 shadow">
            <div className="bg-red-600" />
            <div className="bg-blue-600" />
            <div className="bg-yellow-500" />
            <div className="bg-emerald-600" />
          </div>
        ) : (
          <span
            style={{ color: colorCfg.hex }}
            className="font-black text-xl md:text-2xl drop-shadow-sm rotate-[22deg]"
          >
            {card.symbol}
          </span>
        )}
      </div>

      {/* Bottom Right Inverted Label */}
      <span className="text-white font-black text-xs drop-shadow leading-none self-end rotate-180 z-10">
        {card.label}
      </span>
    </div>
  );
}
