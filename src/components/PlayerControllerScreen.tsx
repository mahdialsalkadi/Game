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
import { DiceShakerButton } from "./common/RealisticDice3D";
import MonopolyPlayerController from "./monopoly/MonopolyPlayerController";
import UnoPlayerController from "./cards/UnoPlayerController";
import SnakesLaddersPlayerController from "./snakes/SnakesLaddersPlayerController";
import LudoPlayerController from "./ludo/LudoPlayerController";
import SocialReactionsBar from "./common/SocialReactionsBar";
import RiskPlayerController from "./games/RiskPlayerController";
import MafiaPlayerController from "./games/MafiaPlayerController";
import ConnectFourPlayerController from "./games/ConnectFourPlayerController";
import CheckersPlayerController from "./games/CheckersPlayerController";
import BingoPlayerController from "./games/BingoPlayerController";
import { PLAYER_COLORS } from "../game/gameProfiles";
import { getPlayerInitials } from "../utils/playerDisplay";
import { detectRulebookId } from "../game/rulebooks";
import {
  gameUsesCurrency,
  getPlayerResultStat,
  getWinnerAchievement
} from "../utils/gameResults";

interface PlayerControllerProps {
  gameState: FullRoomState;
  lastAnimation: any;
  errorToast: string | null;
  sendAction: (payload: Record<string, unknown>) => void;
  playerId: string;
}

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
  const [isReactionsOpen, setIsReactionsOpen] = useState(false);

  // Session Refresh Retention: derive 'me' directly from gameState players
  const me = gameState?.players?.[playerId];
  const myPlayer = me;
  const isMyTurn = gameState?.turnOrder?.[gameState.currentTurnIndex] === playerId;
  const phase = gameState?.phase;
  // All games have smart hints by default, with an option to skip/dismiss them
  const [hintsDismissed, setHintsDismissed] = useState(false);
  const showSmartHints = !hintsDismissed;
  const playMode = "CASUAL";
  const activeThemeId = gameState?.settings?.themeId || (gameState as any)?.themeId || "ARABIAN_MAJLIS";

  useEffect(() => {
    sfx.setAudioTheme(activeThemeId);
  }, [activeThemeId]);

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

  // Safe Haptic feedback for mobile devices
  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  };

  // Turn arrival tactile vibration
  useEffect(() => {
    if (isMyTurn && phase === "TURN_START") {
      triggerHaptic([80, 40, 100]);
    }
  }, [isMyTurn, phase]);

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
        className="min-h-[100dvh] w-screen bg-slate-950 text-white flex flex-col justify-between p-6 overflow-y-auto"
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
        className="min-h-[100dvh] w-screen bg-slate-950 text-white flex flex-col items-center justify-between p-6 gap-6 overflow-y-auto"
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
    const resultRulebookId = detectRulebookId(gameState);
    const resultUsesCurrency = gameUsesCurrency(resultRulebookId);
    const winner = gameState.winner || lastAnimation?.winner;
    const isWinner = Boolean(winner && winner.id === playerId);
    const myStat = getPlayerResultStat(resultRulebookId, playerId, gameState);

    return (
      <div
        dir="rtl"
        className="min-h-[100dvh] w-screen bg-slate-950 text-white flex flex-col items-center justify-between p-6 gap-4 overflow-y-auto"
      >
        <div
          className="h-3 rounded-full w-full shrink-0"
          style={{ backgroundColor: myPlayer.color }}
        />
        <h1 className="text-3xl font-black text-center">
          {isWinner
            ? "مبروك! أنت بطل السهرة 🏆"
            : winner
              ? `انتهت اللعبة — فاز ${winner.name} 🏆`
              : "انتهت اللعبة بالتعادل 🤝"}
        </h1>
        <div className="text-5xl md:text-6xl font-black text-amber-400 text-center px-4" title={myStat}>
          {resultUsesCurrency
            ? `${myPlayer.coins} ${gameState.currencyName}`
            : myStat}
        </div>
        {winner && !resultUsesCurrency && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 px-4 py-2 text-sm font-black text-amber-200">
            {getWinnerAchievement(resultRulebookId)}
          </div>
        )}
        <p className="text-slate-400 text-lg text-center">
          شكراً على اللعب، {myPlayer.name}!
        </p>
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
        className="min-h-[100dvh] w-screen bg-slate-950 text-white flex flex-col justify-between p-6 overflow-y-auto"
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
  // المافيا والجاسوس: لعبة نقاش وأدوار سرية لها واجهة جوال خاصة.
  if (gameState.mafiaState || gameState.rulesConfig?.turnMechanism === "SOCIAL_DISCUSSION_VOTE") {
    return (
      <MafiaPlayerController
        gameState={gameState}
        playerId={playerId}
        sendAction={sendAction}
        errorToast={errorToast}
      />
    );
  }

  // غزو العالم: خريطة أوامر عسكرية من الجوال.
  if (gameState.rulesConfig?.turnMechanism === "TERRITORY_COMMAND") {
    return (
      <RiskPlayerController
        gameState={gameState}
        playerId={playerId}
        isMyTurn={isMyTurn}
        sendAction={sendAction}
        errorToast={errorToast}
      />
    );
  }

  // كونكت فور: إسقاط الأقراص من الجوال.
  if (gameState.connectFourState) {
    return (
      <ConnectFourPlayerController
        gameState={gameState}
        playerId={playerId}
        isMyTurn={isMyTurn}
        sendAction={sendAction}
        errorToast={errorToast}
        triggerHaptic={triggerHaptic}
      />
    );
  }

  // الداما: تحريك القطع والأكل الإجباري من الجوال.
  if (gameState.checkersState) {
    return (
      <CheckersPlayerController
        gameState={gameState}
        playerId={playerId}
        isMyTurn={isMyTurn}
        sendAction={sendAction}
        errorToast={errorToast}
        triggerHaptic={triggerHaptic}
      />
    );
  }

  // بينغو: البطاقة وسحب الكرات من الجوال.
  if (gameState.bingoState) {
    return (
      <BingoPlayerController
        gameState={gameState}
        playerId={playerId}
        isMyTurn={isMyTurn}
        sendAction={sendAction}
        errorToast={errorToast}
        triggerHaptic={triggerHaptic}
      />
    );
  }

  if (gameState.unoState) {
    return (
      <UnoPlayerController
        gameState={gameState}
        sendAction={sendAction}
        playerId={playerId}
        errorToast={errorToast}
        showSmartHints={showSmartHints}
        playMode={playMode}
      />
    );
  }

  const isLudo = Boolean(
    gameState.isLudo ||
    gameState.ludoState?.isActive ||
    (gameState as any).themeTitle?.includes("لودو") ||
    (gameState as any).themeTitle?.includes("جاكارو") ||
    (gameState as any).themeTitle?.includes("Ludo")
  );

  if (isLudo && myPlayer) {
    return (
      <div
        dir="rtl"
        className="min-h-[100dvh] w-screen bg-slate-950 text-white flex flex-col justify-between overflow-y-auto"
      >
        {/* Error Toast */}
        <AnimatePresence>
          {errorToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-4 mt-2 bg-rose-900/90 border border-rose-500 rounded-xl px-4 py-2 text-center text-sm text-rose-200 z-50"
            >
              {errorToast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header / Player Profile */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              style={{ backgroundColor: myPlayer.color }}
              className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-bold text-slate-950 text-xs shadow shrink-0"
            >
              {getPlayerInitials(myPlayer.name)}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm block leading-tight truncate max-w-[130px] sm:max-w-[190px]" title={myPlayer.name}>{myPlayer.name}</span>
              <span className="text-[11px] text-amber-400 font-extrabold flex items-center gap-1">
                🎲 لودو وجاكارو المجلس
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHintsDismissed(!hintsDismissed)}
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition-colors flex items-center gap-1 ${
                !hintsDismissed
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
              title="تخطي أو تفعيل التلميحات"
            >
              <span>💡 {!hintsDismissed ? "تخطي التلميحات ✕" : "إظهار التلميحات"}</span>
            </button>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                isMyTurn
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {isMyTurn ? "دورك الآن!" : "انتظر دورك"}
            </span>
          </div>
        </div>

        {/* Dedicated Mobile Controller */}
        <div className="flex-1 overflow-y-auto px-4 py-2 flex items-center justify-center">
          <LudoPlayerController
            gameState={gameState}
            playerId={playerId}
            isMyTurn={isMyTurn}
            sendAction={sendAction}
            triggerHaptic={triggerHaptic}
            showSmartHints={showSmartHints}
            playMode={playMode}
          />
        </div>

        {/* Social Reactions Bar */}
        <div className="p-2 border-t border-slate-900 bg-slate-950/80 shrink-0">
          <SocialReactionsBar
            themeId={activeThemeId}
            onSendReaction={(emoji, text, voiceId) =>
              sendAction({ type: "SEND_REACTION", emoji, text, voiceId })
            }
          />
        </div>

        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />
      </div>
    );
  }

  const isSnakesAndLadders = Boolean(
    gameState.tiles?.length === 100 ||
    (gameState as any).themeTitle?.includes("السلم والثعبان") ||
    (gameState as any).themeTitle?.includes("Snakes") ||
    (gameState.archetype === "BOARD_RACE" && gameState.tiles?.some((t) => t.jumpToIndex !== undefined))
  );

  if (isSnakesAndLadders && myPlayer) {
    return (
      <div
        dir="rtl"
        className="min-h-[100dvh] w-screen bg-slate-950 text-white flex flex-col justify-between overflow-y-auto"
      >
        {/* Error Toast */}
        <AnimatePresence>
          {errorToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-4 mt-2 bg-rose-900/90 border border-rose-500 rounded-xl px-4 py-2 text-center text-sm text-rose-200 z-50"
            >
              {errorToast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header / Player Profile */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              style={{ backgroundColor: myPlayer.color }}
              className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-bold text-slate-950 text-xs shadow shrink-0"
            >
              {getPlayerInitials(myPlayer.name)}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm block leading-tight truncate max-w-[130px] sm:max-w-[190px]" title={myPlayer.name}>{myPlayer.name}</span>
              <span className="text-[11px] text-amber-400 font-extrabold flex items-center gap-1">
                🪜 السلم والثعبان ١٠٠
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHintsDismissed(!hintsDismissed)}
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition-colors flex items-center gap-1 ${
                !hintsDismissed
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
              title="تخطي أو تفعيل التلميحات"
            >
              <span>💡 {!hintsDismissed ? "تخطي التلميحات ✕" : "إظهار التلميحات"}</span>
            </button>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                isMyTurn
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {isMyTurn ? "دورك للرمي!" : "انتظر دورك"}
            </span>
          </div>
        </div>

        {/* Dedicated Mobile Controller */}
        <SnakesLaddersPlayerController
          gameState={gameState}
          playerId={playerId}
          isMyTurn={isMyTurn}
          sendAction={sendAction}
          triggerHaptic={triggerHaptic}
          showSmartHints={showSmartHints}
          playMode={playMode}
        />

        {/* Social Reactions Bar */}
        <div className="p-2 border-t border-slate-900 bg-slate-950/80 shrink-0">
          <SocialReactionsBar
            themeId={activeThemeId}
            onSendReaction={(emoji, text, voiceId) =>
              sendAction({ type: "SEND_REACTION", emoji, text, voiceId })
            }
          />
        </div>
      </div>
    );
  }

  const isMonopoly =
    gameState.rulesConfig?.ownershipSystem === "BUY_AND_RENT" ||
    gameState.archetype === "PARTY_ECONOMY";

  if (isMonopoly) {
    return (
      <div
        dir="rtl"
        className="min-h-[100dvh] w-screen bg-slate-950 text-white flex flex-col justify-between overflow-y-auto"
      >
        {/* Error Toast */}
        <AnimatePresence>
          {errorToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-4 mt-2 bg-rose-900/90 border border-rose-500 rounded-xl px-4 py-2 text-center text-sm text-rose-200 z-50"
            >
              {errorToast}
            </motion.div>
          )}
        </AnimatePresence>

        <MonopolyPlayerController
          gameState={gameState}
          playerId={playerId}
          isMyTurn={isMyTurn}
          sendAction={sendAction}
          triggerHaptic={triggerHaptic}
          showSmartHints={showSmartHints}
          playMode={playMode}
        />

        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />
      </div>
    );
  }

  const mySecretHand: GameCard[] = myPlayer.secretHand || [];

  return (
    <div
      dir="rtl"
      className="min-h-[100dvh] w-screen bg-slate-950 text-white flex flex-col justify-between overflow-y-auto"
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

      {/* Dynamic Turn Alert Glow Banner */}
      {isMyTurn && phase === "TURN_START" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-3 mt-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500/30 via-orange-500/40 to-amber-500/30 border-2 border-amber-400 flex items-center justify-between text-amber-200 font-black text-xs shadow-lg turn-pulse"
        >
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            ⭐ دورك الآن! حان وقت التحرك!
          </span>
          <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black">
            نشط 🎮
          </span>
        </motion.div>
      )}

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
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 pt-1">
                {mySecretHand.map((card) => (
                  <motion.div
                    key={card.id}
                    layoutId={`card-${card.id}`}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      if (!isMyTurn || phase !== "TURN_START") return;
                      triggerHaptic(40);
                      sfx.playCardSlide();
                      setSelectedCard(selectedCard?.id === card.id ? null : card);
                      const needsTarget = card.effects.some(
                        (e) => e.targetType === "CHOSEN_PLAYER"
                      );
                      setTargetPickerVisible(needsTarget && selectedCard?.id !== card.id);
                    }}
                    className={`shrink-0 w-44 rounded-2xl border-2 p-3 transition-all cursor-pointer flex flex-col justify-between ${
                      selectedCard?.id === card.id
                        ? "border-amber-400 bg-slate-800 scale-105 shadow-2xl glow-amber ring-2 ring-amber-400/40"
                        : "border-slate-700/80 bg-gradient-to-b from-slate-900 to-slate-950 hover:border-slate-500 shadow-md"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-black/40 text-amber-400">
                          {card.category === "PUBLIC_DRAMA" ? "⚡ دراما" : "🃏 تكتيكية"}
                        </span>
                        {selectedCard?.id === card.id && (
                          <span className="text-[10px] font-black text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded animate-pulse">محددة ✓</span>
                        )}
                      </div>
                      <h4 className="font-black text-sm mb-1 text-amber-300 line-clamp-1">
                        {card.title}
                      </h4>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {card.flavorText}
                      </p>
                    </div>

                    {/* Effect Summary Badges */}
                    <div className="flex gap-1 flex-wrap mt-2.5 pt-2 border-t border-slate-800/80">
                      {card.effects.map((ef, idx) => (
                        <span key={idx} className="text-[9px] font-black px-1.5 py-0.5 rounded bg-black/60 text-emerald-400 border border-emerald-500/20">
                          {ef.actionType === "MODIFY_COINS" && `${ef.value > 0 ? "+" : ""}${ef.value} 💰`}
                          {ef.actionType === "STEAL_COINS" && `سرقة ${ef.value} 💰`}
                          {ef.actionType === "MOVE_STEPS" && `${ef.value > 0 ? "+" : ""}${ef.value} 👣`}
                          {ef.actionType === "GRANT_SHIELD" && `🛡️ درع`}
                          {ef.actionType === "SWAP_POSITIONS" && `🔀 تبادل`}
                          {ef.actionType === "SKIP_TURN" && `⛔ تفويت`}
                          {ef.actionType === "VOTE_PENALTY" && `🗳️ تصويت`}
                        </span>
                      ))}
                    </div>
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
                            sfx.playCardSlap();
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
          const canAfford = Boolean(isPurchasable && currentTile && myPlayer.coins >= (currentTile.price || 0));
          if (rules.ownershipSystem === "BUY_AND_RENT") {
            return (
              <MonopolyPlayerController
                gameState={gameState}
                playerId={playerId}
                isMyTurn={isMyTurn}
                sendAction={sendAction}
                triggerHaptic={triggerHaptic}
                showSmartHints={showSmartHints}
                playMode={playMode}
              />
            );
          }

          if (isMyTurn && phase === "TURN_START") {
            return (
              <>
                {/* Buy Property Button (Monopoly/Sultanate) */}
                {canAfford && (
                  <div className="flex flex-col gap-1 w-full max-w-xs items-center">
                    <button
                      onClick={() => {
                        triggerHaptic([30, 20, 50]);
                        sfx.playCoinChime();
                        sendAction({
                          type: "BUY_PROPERTY",
                          tileIndex: currentTile!.index
                        });
                      }}
                      className={`w-full py-3 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center gap-2 shadow-xl border border-emerald-400/40 active:scale-95 transition-all ${
                        showSmartHints ? "glow-emerald" : ""
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-emerald-200" />
                      <span>شراء {currentTile!.name} (🏠 {currentTile!.price} {gameState.currencyName})</span>
                    </button>
                    {showSmartHints && (
                      <span className="text-[11px] text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-500/30 rounded-lg py-0.5 px-2 text-center w-full">
                        💡 يمنحك دخل إيجار {currentTile?.rent || 20} {gameState.currencyName || "ر.س"} عند هبوط الخصوم
                      </span>
                    )}
                  </div>
                )}

                {/* Play selected card (no target needed) */}
                {selectedCard && !targetPickerVisible && (
                  <button
                    onClick={() => {
                      triggerHaptic(40);
                      sfx.playCardSlap();
                      sendAction({
                        type: "PLAY_SECRET_CARD",
                        cardId: selectedCard.id
                      });
                      setSelectedCard(null);
                    }}
                    className="w-full max-w-xs py-3 rounded-xl text-base font-bold bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2 transition-colors text-white active:scale-95 shadow-lg"
                  >
                    <Swords className="w-5 h-5" />
                    استخدم البطاقة
                  </button>
                )}

                {/* Adaptive Mechanism Buttons */}
                {rules.turnMechanism === "DICE_AND_MOVE" && (
                  <DiceShakerButton
                    onRoll={() => {
                      sendAction({ type: "ROLL_DICE" });
                      setSelectedCard(null);
                    }}
                    isRolling={false}
                    diceCount={gameState.rulesConfig?.ownershipSystem === "BUY_AND_RENT" ? 2 : 1}
                  />
                )}

                {rules.turnMechanism === "CARD_PLAY_ONLY" && (
                  <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                    {mySecretHand.length === 0 ? (
                      <button
                        onClick={() => {
                          triggerHaptic([40, 30]);
                          sfx.playCardSlide();
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
                              triggerHaptic([40, 30]);
                              sfx.playCardSlide();
                              sendAction({ type: "DRAW_CARD" });
                            }}
                            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                          >
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            <span>اسحب ورقة (+1)</span>
                          </button>
                          <button
                            onClick={() => {
                              triggerHaptic(20);
                              sendAction({ type: "PASS_TURN" });
                            }}
                            className="py-2.5 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-xs font-bold text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-colors active:scale-95"
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
              {/* Cultural Social Reactions Bar (Jawaker Style) */}
              <div className="w-full max-w-sm mt-1">
                <SocialReactionsBar
                  themeId={activeThemeId}
                  onSendReaction={(emoji, text, voiceId) => {
                    triggerHaptic(25);
                    sendAction({ type: "SEND_REACTION", emoji, text, voiceId });
                  }}
                />
              </div>
            </>
          );
        })()}
      </div>

      {/* Floating Cultural Reactions Quick Launcher */}
      <button
        type="button"
        onClick={() => setIsReactionsOpen(true)}
        className="fixed bottom-3 left-3 z-40 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-2xl border-2 border-white/40 flex items-center gap-1.5 active:scale-95 glow-amber"
      >
        <span>
          {activeThemeId === "CYBERPUNK_NEON"
            ? "⚡ بروتوكول السايبر"
            : activeThemeId === "DEEP_SPACE"
            ? "🌌 نداءات المجرة"
            : activeThemeId === "MEDIEVAL_FANTASY"
            ? "⚔️ هتافات المملكة"
            : "🗣️ عبارات المجلس"}
        </span>
      </button>

      {/* Social Reactions Bottom Drawer Modal */}
      <AnimatePresence>
        {isReactionsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center p-3 sm:p-6"
            onClick={() => setIsReactionsOpen(false)}
          >
            <motion.div
              initial={{ y: 150, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 150, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg space-y-2"
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsReactionsOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 shadow"
                >
                  إغلاق ✕
                </button>
              </div>
              <SocialReactionsBar
                themeId={activeThemeId}
                onSendReaction={(emoji, text, voiceId) => {
                  triggerHaptic(25);
                  sendAction({ type: "SEND_REACTION", emoji, text, voiceId });
                  setIsReactionsOpen(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
