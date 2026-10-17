"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dices,
  Send,
  Shield,
  Swords,
  ChevronUp,
  Coins,
  Layers,
  Building2,
  Vote,
  MapPin,
  User,
  Brain
} from "lucide-react";
import type { FullRoomState } from "../game/gameRoom";
import type { GameCard } from "../game/schema";
import { sfx } from "../utils/soundEffects";
import UserProfileModal from "./profile/UserProfileModal";

interface PlayerControllerProps {
  gameState: FullRoomState;
  lastAnimation: any;
  errorToast: string | null;
  sendAction: (payload: Record<string, unknown>) => void;
  playerId: string;
}

const PLAYER_COLORS = ["#EF4444", "#3B82F6", "#22C55E", "#EAB308"];

const REACTION_EMOJIS = ["😂", "😱", "🔥", "💀", "🤬", "🏆"];

export default function PlayerControllerScreen({
  gameState,
  lastAnimation,
  errorToast,
  sendAction,
  playerId
}: PlayerControllerProps) {
  const [playerName, setPlayerName] = useState("");
  const [promptIdea, setPromptIdea] = useState("");
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);
  const [targetPickerVisible, setTargetPickerVisible] = useState(false);
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Session Refresh Retention: derive 'me' directly from gameState players
  const me = gameState?.players?.[playerId];
  const myPlayer = me;
  const isMyTurn = gameState?.turnOrder?.[gameState.currentTurnIndex] === playerId;
  const phase = gameState?.phase;

  // 1. Screen Wake Lock API: keep screen active on mobile during gameplay
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if (
          typeof navigator !== "undefined" &&
          "wakeLock" in navigator &&
          document.visibilityState === "visible"
        ) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
        }
      } catch (err) {
        console.warn("Screen Wake Lock error:", err);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch((err: any) => {
          console.warn("Screen Wake Lock release error:", err);
        });
      }
    };
  }, []);

  // 2. Reset Selected Vote Target whenever phase is not VOTING
  useEffect(() => {
    if (gameState?.phase !== "VOTING") {
      setSelectedVoteTarget(null);
    }
  }, [gameState?.phase]);

  // 3. Audio & Haptic notification on turn start
  useEffect(() => {
    if (isMyTurn && phase === "TURN_START") {
      sfx.playTurnChime();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([150, 50, 150]);
      }
    }
  }, [isMyTurn, phase]);

  // 4. Alert tone on error toast
  useEffect(() => {
    if (errorToast) {
      sfx.playAlert();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(100);
      }
    }
  }, [errorToast]);

  // ============ LOBBY STATE (Not joined yet) ============
  if (!me && phase === "LOBBY") {
    const colorIndex = Object.keys(gameState.players || {}).length;
    const myColor = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];

    return (
      <div
        dir="rtl"
        className="h-[100dvh] w-screen bg-slate-950 text-white flex flex-col justify-between p-6 overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div
            className="h-3 rounded-full flex-1 ml-4"
            style={{ backgroundColor: myColor }}
          />
          <button
            onClick={() => setIsProfileOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300 flex items-center gap-1.5 text-xs font-bold"
          >
            <Brain className="w-4 h-4" />
            حسابي وبصمتي
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <h1 className="text-2xl font-black text-center">
            انضم للسهرة! 🎲
          </h1>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="اسمك في اللعبة"
            className="w-full max-w-xs text-center text-xl font-bold bg-slate-900 border-2 border-slate-700 rounded-2xl px-4 py-4 focus:border-amber-400 outline-none"
            maxLength={12}
          />
          <input
            type="text"
            value={promptIdea}
            onChange={(e) => setPromptIdea(e.target.value)}
            placeholder="موقف مضحك عن الشلة (اختياري)..."
            className="w-full max-w-xs text-center text-sm bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:border-purple-400 outline-none"
            maxLength={120}
          />
        </div>

        <button
          disabled={!playerName.trim()}
          onClick={() => {
            sfx.unlockAudio();
            const storedUserId = typeof window !== "undefined" ? localStorage.getItem("boardgame_user_id") : undefined;
            sendAction({
              type: "JOIN_ROOM",
              name: playerName.trim(),
              color: myColor,
              userId: storedUserId || undefined,
              promptIdea: promptIdea.trim() || undefined
            });
          }}
          className="w-full py-5 rounded-2xl text-xl font-black bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 transition-colors"
        >
          انضم للغرفة 🚀
        </button>

        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />
      </div>
    );
  }

  // ============ WAITING IN LOBBY (already joined) ============
  if (me && phase === "LOBBY") {
    const playerCount = Object.keys(gameState.players).length;
    const isHost = gameState.turnOrder?.[0] === playerId;

    return (
      <div
        dir="rtl"
        className="h-[100dvh] w-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 gap-6 overflow-hidden"
      >
        <div
          className="h-3 rounded-full w-full"
          style={{ backgroundColor: me.color }}
        />
        <h2 className="text-2xl font-black">
          مرحباً {me.name}! 🎉
        </h2>
        <p className="text-slate-400 text-center">
          {playerCount} لاعبين في الغرفة
          <br />
          {playerCount < 2
            ? "بانتظار انضمام لاعب آخر..."
            : "جاهزون للبدء!"}
        </p>

        {isHost && playerCount >= 2 && (
          <div className="w-full max-w-xs flex flex-col gap-2.5">
            <button
              onClick={() => sendAction({ type: "START_AI_GAME", useDefaultPack: false })}
              className="w-full py-4 rounded-2xl text-lg font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>🧠 ابدأ بالذكاء الاصطناعي</span>
            </button>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => sendAction({ type: "START_CUSTOM_GAME", presetKey: "CYBERPUNK_HEIST" })}
                className="py-2.5 px-1 rounded-xl text-xs font-bold bg-slate-900 border border-cyan-500/40 hover:bg-slate-800 text-cyan-300 transition-colors truncate"
              >
                🏙️ سايبربانك
              </button>
              <button
                onClick={() => sendAction({ type: "START_CUSTOM_GAME", presetKey: "ANCIENT_SULTANATE" })}
                className="py-2.5 px-1 rounded-xl text-xs font-bold bg-slate-900 border border-amber-500/40 hover:bg-slate-800 text-amber-300 transition-colors truncate"
              >
                👑 السلاطين
              </button>
              <button
                onClick={() => sendAction({ type: "START_CUSTOM_GAME", presetKey: "OFFICE_MAYHEM" })}
                className="py-2.5 px-1 rounded-xl text-xs font-bold bg-slate-900 border border-rose-500/40 hover:bg-slate-800 text-rose-300 transition-colors truncate"
              >
                🏢 المكاتب
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!me) {
    return (
      <div dir="rtl" className="h-[100dvh] w-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">جاري الاتصال...</p>
      </div>
    );
  }

  // ============ GAME OVER ============
  if (phase === "GAME_OVER") {
    return (
      <div
        dir="rtl"
        className="h-[100dvh] w-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 gap-4 overflow-hidden"
      >
        <div
          className="h-3 rounded-full w-full"
          style={{ backgroundColor: myPlayer.color }}
        />
        <h1 className="text-3xl font-black">انتهت اللعبة! 🏆</h1>
        <div className="text-6xl font-black text-amber-400">
          {myPlayer.coins} {gameState.currencyName}
        </div>
        <p className="text-slate-400 text-lg">شكراً على اللعب، {myPlayer.name}!</p>
      </div>
    );
  }

  // ============ VOTING PHASE ============
  if (phase === "VOTING") {
    const otherPlayers = Object.values(gameState.players).filter(p => p.id !== playerId);
    const hasVoted = gameState.pendingVote?.votes?.[playerId];

    return (
      <div
        dir="rtl"
        className="h-[100dvh] w-screen bg-slate-950 text-white flex flex-col justify-between p-6 overflow-hidden"
      >
        <div
          className="h-3 rounded-full w-full"
          style={{ backgroundColor: myPlayer.color }}
        />

        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <h2 className="text-2xl font-black text-center">🗳️ صوّت الآن!</h2>
          {gameState.activeVoteCard && (
            <p className="text-slate-300 text-center text-base px-4">
              {gameState.activeVoteCard.flavorText}
            </p>
          )}

          {hasVoted ? (
            <p className="text-emerald-400 font-bold text-lg">تم تسجيل صوتك ✅</p>
          ) : (
            <div className="w-full max-w-xs flex flex-col gap-3">
              {otherPlayers.map((p) => {
                const isSelected = selectedVoteTarget === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedVoteTarget(p.id)}
                    style={{ borderColor: isSelected ? "#A855F7" : p.color }}
                    className={`w-full py-4 rounded-2xl text-lg font-bold border-2 transition-all ${
                      isSelected
                        ? "bg-purple-600/40 text-white shadow-lg border-purple-400 scale-[1.02]"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
              <button
                disabled={!selectedVoteTarget}
                onClick={() => {
                  if (selectedVoteTarget) {
                    sendAction({ type: "SUBMIT_VOTE", targetPlayerId: selectedVoteTarget });
                  }
                }}
                className="w-full py-4 mt-2 rounded-2xl text-lg font-black bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 transition-colors shadow-lg"
              >
                تأكيد التصويت 🗳️
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ ACTIVE GAME (TURN_START / RESOLVING_TILE) ============
  const mySecretHand: GameCard[] = myPlayer.secretHand || [];

  return (
    <div
      dir="rtl"
      className="h-[100dvh] w-screen bg-slate-950 text-white flex flex-col justify-between overflow-hidden"
    >
      {/* Top Identity Bar */}
      <div
        className="h-14 flex items-center justify-between px-4"
        style={{ backgroundColor: myPlayer.color }}
      >
        <div className="flex items-center gap-2">
          <span className="font-black text-lg text-slate-950">{myPlayer.name}</span>
          {myPlayer.hasShield && <Shield className="w-5 h-5 text-slate-950" />}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors"
            title="البصمة السلوكية والحساب"
          >
            <Brain className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-slate-950 font-bold">
          <Coins className="w-5 h-5" />
          <span className="text-xl">{myPlayer.coins}</span>
          <span className="text-sm">{gameState.currencyName}</span>
        </div>
      </div>

      {/* Error Toast */}
      <AnimatePresence>
        {errorToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-4 mt-2 bg-rose-900/90 border border-rose-500 rounded-xl px-4 py-2 text-center text-sm text-rose-200"
          >
            {errorToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Middle Interactive Zone (Secret Hand or Territory Command or Race Info) */}
      {(() => {
        const rules = gameState.rulesConfig || {
          turnMechanism: "DICE_AND_MOVE",
          cardVisibility: "SECRET_PHONE_ONLY",
          ownershipSystem: "NONE"
        };
        const currentTile = gameState.tiles?.[myPlayer.position];

        if (rules.turnMechanism === "TERRITORY_COMMAND") {
          return (
            <div className="flex-1 px-4 py-2 flex flex-col overflow-y-auto">
              <div className="text-xs font-bold text-amber-400 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Swords className="w-3.5 h-3.5" />
                  خريطة الأقاليم والفتوحات
                </span>
                <span className="text-[10px] text-slate-400">انقر للفتح أو الهجوم</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pb-2">
                {gameState.tiles.map((t) => {
                  const isMine = t.ownerId === playerId;
                  const isEnemy = t.ownerId && t.ownerId !== playerId;
                  const enemy = isEnemy ? gameState.players[t.ownerId!] : null;

                  return (
                    <button
                      key={t.index}
                      disabled={!isMyTurn || isMine}
                      onClick={() => {
                        sfx.playCardPlay();
                        sendAction({
                          type: "CLAIM_OR_ATTACK_TILE",
                          targetTileIndex: t.index
                        });
                      }}
                      className={`p-2.5 rounded-xl border-2 text-right transition-all flex flex-col justify-between ${
                        isMine
                          ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-300 opacity-60"
                          : isEnemy
                          ? "border-rose-500 bg-rose-950/40 text-rose-200 hover:scale-[1.02] shadow-md shadow-rose-900/30"
                          : "border-slate-700 bg-slate-900 hover:border-amber-400 text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black truncate">#{t.index} {t.name}</span>
                        {t.armies && <span className="text-[10px] bg-black/40 px-1 py-0.5 rounded font-bold">🛡️ {t.armies}</span>}
                      </div>
                      <div className="text-[10px] mt-1 text-slate-400">
                        {isMine
                          ? "خاضع لسيطرتك ✓"
                          : isEnemy
                          ? `مملوك لـ ${enemy?.name || "الخصم"} (هجوم ⚔️)`
                          : `فتح إقليم (${t.price || 50} ${gameState.currencyName})`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        if (rules.cardVisibility === "NO_HAND_CARDS") {
          return (
            <div className="flex-1 px-4 py-4 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
                🎲
              </div>
              <h3 className="text-lg font-black text-amber-300">
                أنت في المربع #{myPlayer.position}: {currentTile?.name || "المسار"}
              </h3>
              <p className="text-xs text-slate-400 max-w-xs">
                {currentTile?.description || "تقدم على اللوحة متفادياً الفخاخ وصاعداً نحو خط النهاية!"}
              </p>
              {currentTile?.jumpToIndex !== undefined && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${currentTile.jumpToIndex > currentTile.index ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-rose-500/20 text-rose-300 border border-rose-500/40"}`}>
                  {currentTile.jumpToIndex > currentTile.index ? `🪜 يقود إلى المربع #${currentTile.jumpToIndex}` : `🐍 يتراجع إلى المربع #${currentTile.jumpToIndex}`}
                </span>
              )}
            </div>
          );
        }

        // Default: Secret Hand Area (SECRET_PHONE_ONLY or OPEN_PUBLIC_CARDS)
        return (
          <div className="flex-1 px-4 py-3 flex flex-col">
            <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              بطاقاتك {rules.cardVisibility === "OPEN_PUBLIC_CARDS" ? "المكشوفة" : "السرية"} ({mySecretHand.length})
            </div>

            {mySecretHand.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                {mySecretHand.map((card) => (
                  <motion.div
                    key={card.id}
                    layoutId={`card-${card.id}`}
                    onClick={() => {
                      if (!isMyTurn || phase !== "TURN_START") return;
                      setSelectedCard(selectedCard?.id === card.id ? null : card);
                      const needsTarget = card.effects.some(
                        (e) => e.targetType === "CHOSEN_PLAYER"
                      );
                      setTargetPickerVisible(needsTarget && selectedCard?.id !== card.id);
                    }}
                    className={`shrink-0 w-40 rounded-2xl border-2 p-3 transition-all cursor-pointer ${
                      selectedCard?.id === card.id
                        ? "border-amber-400 bg-slate-800 scale-105"
                        : "border-slate-700 bg-slate-900"
                    }`}
                  >
                    <h4 className="font-bold text-sm mb-1 text-amber-300 line-clamp-1">
                      {card.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-3">
                      {card.flavorText}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
                لا توجد بطاقات سرية حالياً
              </div>
            )}

            {/* Target Picker */}
            <AnimatePresence>
              {targetPickerVisible && selectedCard && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mt-2 bg-slate-900 border border-slate-700 rounded-2xl p-3"
                >
                  <p className="text-xs text-slate-400 mb-2">اختر الهدف:</p>
                  <div className="flex gap-2 flex-wrap">
                    {Object.values(gameState.players)
                      .filter((p) => p.id !== playerId)
                      .map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            sfx.playCardPlay();
                            sendAction({
                              type: "PLAY_SECRET_CARD",
                              cardId: selectedCard.id,
                              chosenTargetId: p.id
                            });
                            setSelectedCard(null);
                            setTargetPickerVisible(false);
                          }}
                          style={{ borderColor: p.color }}
                          className="px-4 py-2 rounded-xl border-2 bg-slate-800 font-bold text-sm"
                        >
                          {p.name}
                        </button>
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })()}

      {/* Bottom Action Zone */}
      <div className="h-[35%] bg-slate-900/50 border-t border-slate-800 p-4 flex flex-col items-center justify-center gap-2.5">
        {(() => {
          const rules = gameState.rulesConfig || {
            turnMechanism: "DICE_AND_MOVE",
            cardVisibility: "SECRET_PHONE_ONLY",
            ownershipSystem: "NONE"
          };
          const currentTile = gameState.tiles?.[myPlayer.position];
          const isPurchasable =
            rules.ownershipSystem === "BUY_AND_RENT" &&
            currentTile &&
            currentTile.price !== undefined &&
            currentTile.price > 0 &&
            !currentTile.ownerId;
          const canAfford = isPurchasable && myPlayer.coins >= (currentTile?.price || 0);

          if (isMyTurn && phase === "TURN_START") {
            return (
              <>
                {/* Buy Property Button (Monopoly/Sultanate) */}
                {canAfford && (
                  <button
                    onClick={() => {
                      sfx.playCoinChime();
                      sendAction({
                        type: "BUY_PROPERTY",
                        tileIndex: currentTile!.index
                      });
                    }}
                    className="w-full max-w-xs py-3 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center gap-2 shadow-xl border border-emerald-400/40"
                  >
                    <Building2 className="w-4 h-4 text-emerald-200" />
                    <span>شراء {currentTile!.name} (🏠 {currentTile!.price} {gameState.currencyName})</span>
                  </button>
                )}

                {/* Play selected card (no target needed) */}
                {selectedCard && !targetPickerVisible && (
                  <button
                    onClick={() => {
                      sfx.playCardPlay();
                      sendAction({
                        type: "PLAY_SECRET_CARD",
                        cardId: selectedCard.id
                      });
                      setSelectedCard(null);
                    }}
                    className="w-full max-w-xs py-3 rounded-xl text-base font-bold bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2 transition-colors text-white"
                  >
                    <Swords className="w-5 h-5" />
                    استخدم البطاقة
                  </button>
                )}

                {/* Adaptive Mechanism Buttons */}
                {rules.turnMechanism === "DICE_AND_MOVE" && (
                  <button
                    onClick={() => {
                      sfx.playDiceRoll();
                      sendAction({ type: "ROLL_DICE" });
                      setSelectedCard(null);
                    }}
                    className="w-full max-w-xs py-5 rounded-2xl text-2xl font-black bg-gradient-to-b from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-transform"
                  >
                    <Dices className="w-8 h-8" />
                    ارمِ النرد
                  </button>
                )}

                {rules.turnMechanism === "CARD_PLAY_ONLY" && (
                  <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                    {mySecretHand.length === 0 ? (
                      <button
                        onClick={() => {
                          sfx.playCardPlay();
                          sendAction({ type: "DRAW_CARD" });
                        }}
                        className="w-full py-5 rounded-2xl text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-transform border border-indigo-400/40"
                      >
                        <Layers className="w-6 h-6 text-indigo-200" />
                        <span>اسحب ورقة من الكومة 🃏</span>
                      </button>
                    ) : (
                      <>
                        <div className="text-center p-2 bg-indigo-950/50 border border-indigo-500/30 rounded-xl w-full">
                          <p className="text-xs font-black text-indigo-300">
                            🃏 دورك الآن: اختر ورقة من بطاقاتك بالأعلى والعبها!
                          </p>
                        </div>
                        <div className="flex items-center gap-2 w-full">
                          <button
                            onClick={() => {
                              sfx.playCardPlay();
                              sendAction({ type: "DRAW_CARD" });
                            }}
                            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            <span>اسحب ورقة (+1)</span>
                          </button>
                          <button
                            onClick={() => {
                              sendAction({ type: "PASS_TURN" });
                            }}
                            className="py-2.5 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-xs font-bold text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-colors"
                          >
                            إنهاء الدور ⏩
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {rules.turnMechanism === "TERRITORY_COMMAND" && (
                  <div className="text-center p-2 bg-amber-950/40 border border-amber-500/30 rounded-2xl w-full max-w-xs">
                    <p className="text-sm font-black text-amber-300">
                      ⚔️ اختر إقليماً من الخريطة أعلاه للسيطرة أو الهجوم!
                    </p>
                  </div>
                )}

                {rules.turnMechanism === "SOCIAL_DISCUSSION_VOTE" && (
                  <div className="text-center p-2 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl w-full max-w-xs">
                    <p className="text-sm font-black text-cyan-300">
                      🗣️ تناقشوا بصوت عالٍ! التصويت سيبدأ تلقائياً.
                    </p>
                  </div>
                )}
              </>
            );
          }

          return (
            <>
              <p className="text-slate-400 text-sm">
                {phase === "RESOLVING_TILE"
                  ? "جاري تنفيذ الحدث..."
                  : "انتظر دورك..."}
              </p>
              {/* Reaction Soundboard */}
              <div className="flex gap-3 flex-wrap justify-center">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendAction({ type: "SEND_REACTION", emoji })}
                    className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 text-2xl hover:bg-slate-700 active:scale-90 transition-all flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          );
        })()}
      </div>

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
