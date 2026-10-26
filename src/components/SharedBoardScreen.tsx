"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Coins,
  Shield,
  Sparkles,
  AlertTriangle,
  Vote,
  Flame,
  Flag,
  Layers,
  Dices,
  Users,
  Volume2,
  VolumeX,
  FastForward,
  Trophy,
  Medal,
  Building2,
  Menu,
  Eye,
  QrCode,
  UserPlus,
  Mic,
  MicOff,
  Smile,
  Gift,
  MessageSquare,
  X,
  Copy,
  Check,
  RotateCcw
} from "lucide-react";
import type { FullRoomState } from "../game/gameRoom";
import { GeneratedSessionPackSchema, type BoardTile, type GameCard, type GeneratedSessionPack } from "../game/schema";
import { getAllThemes, getThemeById } from "../game/themeRegistry";
import { FAMOUS_GAME_PRESETS, PRESET_PACKS } from "../game/aiPackGenerator";
import { JAWAKER_LOUNGE_GAMES, COMMUNITY_MAPS, type CommunityMapItem } from "./studio/presets";
import { sfx, speakArabicNarrator } from "../utils/soundEffects";
import LiveEventTicker from "./LiveEventTicker";
import RealisticDice3D from "./common/RealisticDice3D";
import MonopolyBoardView from "./monopoly/MonopolyBoardView";
import UnoCardTableView from "./cards/UnoCardTableView";
import SnakesLaddersBoardView from "./snakes/SnakesLaddersBoardView";
import LudoBoardView from "./ludo/LudoBoardView";
import SpatialPlayerSeat from "./common/SpatialPlayerSeat";
import WoodTabletopEnvironment from "./common/WoodTabletopEnvironment";
import GameTables from "./games/GameTables";
import GameRulesSheet from "./games/GameRulesSheet";
import { detectRulebookId } from "../game/rulebooks";
import { resolveGameProfile } from "../game/gameProfiles";
import { getPlayerInitials } from "../utils/playerDisplay";
import {
  gameUsesCurrency,
  getPlayerResultStat,
  getWinnerAchievement,
  orderGameStandings
} from "../utils/gameResults";

interface SharedBoardProps {
  gameState: FullRoomState;
  lastAnimation: any;
  joinUrl: string;
  sendAction?: (payload: Record<string, unknown>) => void;
  isGeneratingAI?: boolean;
  errorToast?: string | null;
  isSpectator?: boolean;
}

function getTileGridPosition(index: number): { row: number; col: number } {
  if (index >= 0 && index <= 6) {
    return { row: 1, col: index + 1 };
  }
  if (index >= 7 && index <= 9) {
    return { row: index - 5, col: 7 };
  }
  if (index >= 10 && index <= 16) {
    return { row: 5, col: 17 - index };
  }
  return { row: 21 - index, col: 1 };
}

const TILE_STYLES: Record<
  string,
  { bg: string; border: string; icon: React.ReactNode; badge: string }
> = {
  START: {
    bg: "bg-emerald-950/90",
    border: "border-emerald-400",
    icon: <Flag className="w-5 h-5 text-emerald-400" />,
    badge: "البداية"
  },
  RESOURCE: {
    bg: "bg-amber-950/80",
    border: "border-amber-400/70",
    icon: <Coins className="w-5 h-5 text-amber-400" />,
    badge: "مكسب"
  },
  HAZARD: {
    bg: "bg-rose-950/80",
    border: "border-rose-500/70",
    icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
    badge: "فخ"
  },
  SECRET_CARD: {
    bg: "bg-indigo-950/80",
    border: "border-indigo-400/70",
    icon: <Layers className="w-5 h-5 text-indigo-400" />,
    badge: "بطاقة سرية"
  },
  DRAMA_EVENT: {
    bg: "bg-purple-950/80",
    border: "border-purple-400/70",
    icon: <Flame className="w-5 h-5 text-purple-400" />,
    badge: "حدث درامي"
  },
  GLOBAL_VOTE: {
    bg: "bg-cyan-950/80",
    border: "border-cyan-400/70",
    icon: <Vote className="w-5 h-5 text-cyan-400" />,
    badge: "تصويت جماعي"
  }
};

function getMechanismTheme(turnMechanism?: string) {
  switch (turnMechanism) {
    case "TERRITORY_COMMAND":
      return {
        accentBorder: "border-red-500/50",
        centerGlow: "shadow-[0_0_60px_rgba(239,68,68,0.25)]",
        badge: "bg-red-500/20 text-red-300 border-red-500/30"
      };
    case "CARD_PLAY_ONLY":
      return {
        accentBorder: "border-indigo-500/50",
        centerGlow: "shadow-[0_0_60px_rgba(99,102,241,0.25)]",
        badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
      };
    case "SOCIAL_DISCUSSION_VOTE":
      return {
        accentBorder: "border-cyan-500/50",
        centerGlow: "shadow-[0_0_60px_rgba(6,182,212,0.25)]",
        badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
      };
    default:
      return {
        accentBorder: "border-amber-500/40",
        centerGlow: "shadow-[0_0_60px_rgba(245,158,11,0.2)]",
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/30"
      };
  }
}

function GoldenCelebrationParticles() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const particles = useMemo(() => {
    const colors = [
      "#F59E0B",
      "#FBBF24",
      "#FCD34D",
      "#FEF08A",
      "#EAB308",
      "#CA8A04",
      "#FFFFFF",
      "#F59E0B"
    ];

    return Array.from({ length: 70 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 3.5,
      duration: 3 + Math.random() * 3.5,
      width: 6 + Math.random() * 8,
      height: 10 + Math.random() * 14,
      color: colors[i % colors.length],
      rotationX: Math.random() > 0.5 ? 720 : -720,
      rotationY: Math.random() > 0.5 ? 360 : -360,
      rotationZ: Math.random() * 720,
      sway: (Math.random() - 0.5) * 50,
      isCircle: Math.random() > 0.65
    }));
  }, []);

  const sparkles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      top: 10 + Math.random() * 75,
      left: 8 + Math.random() * 84,
      size: 16 + Math.random() * 20,
      delay: Math.random() * 2,
      duration: 1.4 + Math.random() * 1.6
    }));
  }, []);

  if (!isClient) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {/* Fluttering Golden Confetti */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            y: "-5vh",
            x: `${p.x}vw`,
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            opacity: 1
          }}
          animate={{
            y: "110vh",
            x: [
              `${p.x}vw`,
              `${p.x + p.sway / 15}vw`,
              `${p.x - p.sway / 15}vw`,
              `${p.x}vw`
            ],
            rotateX: p.rotationX,
            rotateY: p.rotationY,
            rotateZ: p.rotationZ,
            opacity: [1, 1, 0.9, 0]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeIn"
          }}
          style={{
            position: "absolute",
            width: p.width,
            height: p.isCircle ? p.width : p.height,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? "50%" : "3px",
            boxShadow: `0 0 8px ${p.color}`,
            willChange: "transform, opacity"
          }}
        />
      ))}

      {/* Sparkling Twinkling Stars */}
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          initial={{ scale: 0, opacity: 0, rotate: 0 }}
          animate={{
            scale: [0, 1.25, 0],
            opacity: [0, 1, 0],
            rotate: [0, 90, 180]
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: "absolute",
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size
          }}
          className="text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]"
        >
          <Sparkles className="w-full h-full fill-amber-300" />
        </motion.div>
      ))}
    </div>
  );
}

export default function SharedBoardScreen({
  gameState,
  lastAnimation,
  joinUrl,
  sendAction,
  isGeneratingAI = false,
  errorToast = null,
  isSpectator = false
}: SharedBoardProps) {
  const [visualPositions, setVisualPositions] = useState<Record<string, number>>({});
  const [narratorMessage, setNarratorMessage] = useState<string>(
    "بانتظار رمية النرد الأولى..."
  );
  const [displayedDice, setDisplayedDice] = useState<number | null>(null);
  const [displayedDiceValues, setDisplayedDiceValues] = useState<number[]>([1]);
  const [isRollingDice, setIsRollingDice] = useState<boolean>(false);
  const diceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (diceIntervalRef.current) {
        clearInterval(diceIntervalRef.current);
      }
    };
  }, []);
  const [activeCardModal, setActiveCardModal] = useState<GameCard | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const [eventHistory, setEventHistory] = useState<string[]>([
    "أهلاً بكم في سهرة اللعبة التفاعلية الذكية!",
    "النرد والبطاقات جاهزة للإثارة والمنافسة."
  ]);
  const [selectedPackMode, setSelectedPackMode] = useState<string>("MONOPOLY_CLASSIC");
  const [lobbyCategory, setLobbyCategory] = useState<"BASE" | "COMMUNITY" | "AI_IMPORT">("BASE");
  const [customImportedPack, setCustomImportedPack] = useState<GeneratedSessionPack | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<Array<{
    id: string;
    emoji: string;
    text?: string;
    voiceId?: string;
    playerName: string;
    playerColor: string;
    startX: number;
  }>>([]);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showMenuModal, setShowMenuModal] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(true);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Auto-load custom pack from Studio if present in sessionStorage or URL preset.
  // An explicit ?preset= choice always wins, so a stale custom studio pack from a
  // previous room can never hijack the lobby or the next match.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const presetParam = sp.get("preset");

      if (presetParam) {
        setSelectedPackMode(presetParam);
        const isCommunityMap = COMMUNITY_MAPS.some(
          (map) => map.presetKey === presetParam || map.id === presetParam
        );
        if (isCommunityMap) {
          setLobbyCategory("COMMUNITY");
        } else if (JAWAKER_LOUNGE_GAMES.some((game) => game.key === presetParam)) {
          setLobbyCategory("BASE");
        }
      }

      const stored = sessionStorage.getItem("custom_studio_pack");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const validated = GeneratedSessionPackSchema.safeParse(parsed);
          if (validated.success) {
            setCustomImportedPack(validated.data);
            if (!presetParam) {
              setSelectedPackMode("CUSTOM_IMPORT");
              setLobbyCategory("AI_IMPORT");
            }
          }
        } catch {}
      }
    }
  }, []);

  const handleStartGame = () => {
    if (selectedPackMode === "AI") {
      sendAction?.({ type: "START_AI_GAME" });
    } else if (selectedPackMode === "CUSTOM_IMPORT") {
      if (customImportedPack) {
        sendAction?.({ type: "START_CUSTOM_GAME", pack: customImportedPack });
      }
    } else {
      sendAction?.({ type: "START_CUSTOM_GAME", presetKey: selectedPackMode });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const parsed = GeneratedSessionPackSchema.safeParse(json);
        if (parsed.success) {
          setCustomImportedPack(parsed.data);
          setImportError(null);
          setSelectedPackMode("CUSTOM_IMPORT");
        } else {
          setImportError("الملف لا يطابق معايير الحزمة (20 مربع و 18+ بطاقة)");
        }
      } catch {
        setImportError("صيغة الملف غير صحيحة (JSON غير صالح)");
      }
    };
    reader.readAsText(file);
  };

  // Auto-speak narrator message if voice is enabled
  useEffect(() => {
    if (isVoiceEnabled && narratorMessage) {
      speakArabicNarrator(narratorMessage);
    }
  }, [narratorMessage, isVoiceEnabled]);

  // Synchronize dynamic procedural audio theme with active room/game theme
  useEffect(() => {
    const currentThemeId = gameState.settings?.themeId || gameState.themeId || "ARABIAN_MAJLIS";
    sfx.setAudioTheme(currentThemeId);
  }, [gameState.settings?.themeId, gameState.themeId]);

  const isGenerating = Boolean(isGeneratingAI || lastAnimation?.type === "AI_GENERATING");

  // Tile-by-Tile Hopping Animation
  useEffect(() => {
    const interval = setInterval(() => {
      setVisualPositions((prev) => {
        const next = { ...prev };
        let changed = false;

        for (const player of Object.values(gameState.players)) {
          const currentVisual = prev[player.id] ?? player.position;
          if (currentVisual !== player.position) {
            next[player.id] = (currentVisual + 1) % gameState.boardSize;
            changed = true;
          } else if (prev[player.id] === undefined) {
            next[player.id] = player.position;
            changed = true;
          }
        }
        if (changed) {
          sfx.playPawnHop();
        }
        return changed ? next : prev;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [gameState.players, gameState.boardSize]);

  // Animation Events & Audio Effects Handler
  useEffect(() => {
    if (!lastAnimation) return;

    // Collect Arabic event messages for LiveEventTicker
    const incomingMessages: string[] = [];

    if (typeof lastAnimation.messageAr === "string" && lastAnimation.messageAr.trim()) {
      incomingMessages.push(lastAnimation.messageAr.trim());
    }

    if (Array.isArray(lastAnimation.events)) {
      for (const ev of lastAnimation.events) {
        if (ev && typeof ev.messageAr === "string" && ev.messageAr.trim()) {
          incomingMessages.push(ev.messageAr.trim());
        }
      }
    }

    if (Array.isArray(lastAnimation.moveEvents)) {
      for (const ev of lastAnimation.moveEvents) {
        if (ev && typeof ev.messageAr === "string" && ev.messageAr.trim()) {
          incomingMessages.push(ev.messageAr.trim());
        }
      }
    }

    if (lastAnimation.type === "BOT_THINKING") {
      if (lastAnimation.messageAr) {
        setNarratorMessage(lastAnimation.messageAr);
        incomingMessages.push(lastAnimation.messageAr);
      }
    }

    if (lastAnimation.type === "DICE_ROLL_START") {
      sfx.playDiceTumble();
      setIsRollingDice(true);
    }

    if (lastAnimation.type === "DICE_ROLLED") {
      const diceValues =
        lastAnimation.dice2 && lastAnimation.dice2 > 0
          ? [lastAnimation.dice1 || 1, lastAnimation.dice2]
          : [lastAnimation.diceValue || 1];

      setDisplayedDiceValues(diceValues);
      setDisplayedDice(lastAnimation.diceValue);

      if (diceIntervalRef.current) {
        clearTimeout(diceIntervalRef.current as any);
      }

      // Keep rolling state for 700ms to smoothly decelerate into settled dice faces
      diceIntervalRef.current = setTimeout(() => {
        setIsRollingDice(false);
        sfx.playCoinChime();
        diceIntervalRef.current = null;
      }, 700) as any;

      const diceMsg = `رمى ${gameState.players[lastAnimation.playerId]?.name || "اللاعب"} النرد وحصل على ${lastAnimation.diceValue}!`;
      setNarratorMessage(diceMsg);
      incomingMessages.push(diceMsg);
    }

    if (lastAnimation.type === "SECRET_CARD_DRAWN") {
      sfx.playCardSlide();
    }

    if (
      lastAnimation.type === "DRAMA_CARD_TRIGGERED" ||
      lastAnimation.type === "SECRET_CARD_PLAYED" ||
      lastAnimation.type === "VOTE_SESSION_STARTED"
    ) {
      if (lastAnimation.type === "SECRET_CARD_PLAYED" || lastAnimation.type === "DRAMA_CARD_TRIGGERED") {
        sfx.playCardSlap();
      } else {
        sfx.playDramaAlert();
      }
      setActiveCardModal(lastAnimation.card);
      if (lastAnimation.events?.[0]?.messageAr) {
        setNarratorMessage(lastAnimation.events[0].messageAr);
      }
      if (lastAnimation.type !== "VOTE_SESSION_STARTED") {
        const timer = setTimeout(() => setActiveCardModal(null), 6000);
        return () => clearTimeout(timer);
      }
    }

    if (
      lastAnimation.type === "TILE_RESOLVED" ||
      lastAnimation.type === "COIN_CHANGE"
    ) {
      sfx.playCoinChime();
      if (lastAnimation.events?.[0]) {
        setNarratorMessage(lastAnimation.events[0].messageAr);
      }
    }

    if (lastAnimation.type === "VOTE_SESSION_ENDED") {
      setActiveCardModal(null);
      if (lastAnimation.events?.[0]?.messageAr) {
        setNarratorMessage(lastAnimation.events[0].messageAr);
      }
    }

    if (lastAnimation.type === "GAME_STARTED") {
      const intro = lastAnimation.narratorIntro || "بدأت اللعبة!";
      setNarratorMessage(intro);
      incomingMessages.push(intro);
    }

    if (lastAnimation.type === "TURN_CHANGED") {
      const p = gameState.players[lastAnimation.activePlayerId];
      if (p) setNarratorMessage(`دور ${p.name} للعب!`);
    }

    if (lastAnimation.type === "TURN_SKIPPED") {
      setNarratorMessage(lastAnimation.messageAr);
    }

    if (lastAnimation.type === "AI_GENERATING") {
      setNarratorMessage(
        lastAnimation.messageAr || "✨ الذكاء الاصطناعي يبتكر اللوحة والبطاقات الآن..."
      );
    }

    if (lastAnimation.type === "ADAPTIVE_DIRECTOR_INTERVENTION") {
      sfx.playDramaAlert();
      const interventionMsg = lastAnimation.messageAr || `تدخل المخرج الذكي لدعم ${lastAnimation.trailingPlayerName}!`;
      setNarratorMessage(interventionMsg);
      incomingMessages.push(interventionMsg);
      if (lastAnimation.rewardCard) {
        setActiveCardModal(lastAnimation.rewardCard);
        setTimeout(() => setActiveCardModal(null), 7000);
      }
    }

    if (lastAnimation.type === "GAME_OVER") {
      sfx.playCoinChime();
      const winnerName = lastAnimation.winner?.name;
      const reason = lastAnimation.reasonAr || "تتويج بطل السهرة!";
      incomingMessages.push(
        winnerName
          ? `🏆 فاز ${winnerName} بالمركز الأول! ${reason}`
          : `🤝 انتهت الجولة بالتعادل! ${reason}`
      );
    }

    if (lastAnimation.type === "LIVE_REACTION" && lastAnimation.emoji) {
      if (lastAnimation.voiceId) {
        sfx.playReactionCue(lastAnimation.voiceId);
      } else {
        sfx.playTurnChime();
      }
      if (lastAnimation.text && isVoiceEnabled) {
        speakArabicNarrator(lastAnimation.text);
      }
      const player = gameState.players[lastAnimation.playerId];
      const newReaction = {
        id: `react_${Date.now()}_${Math.random()}`,
        emoji: lastAnimation.emoji,
        text: lastAnimation.text,
        voiceId: lastAnimation.voiceId,
        playerName: player?.name || "لاعب",
        playerColor: player?.color || "#eab308",
        startX: 15 + Math.random() * 70
      };
      setFloatingReactions((prev) => [...prev.slice(-15), newReaction]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 3200);
    }

    if (incomingMessages.length > 0) {
      setEventHistory((prev) => {
        const unique = incomingMessages.filter(
          (m) => prev.length === 0 || prev[prev.length - 1] !== m
        );
        if (unique.length === 0) return prev;
        return [...prev, ...unique].slice(-30);
      });
    }
  }, [lastAnimation, gameState.players]);

  // Audio effect when reaching GAME_OVER phase
  useEffect(() => {
    if (gameState.phase === "GAME_OVER") {
      sfx.playCoinChime();
      const winner = gameState.winner || lastAnimation?.winner;
      if (isVoiceEnabled) {
        if (winner) {
          speakArabicNarrator(`مبروك للفائز ${winner.name}! لقد توج بطلاً للسهرة!`);
        } else {
          speakArabicNarrator("انتهت الجولة بالتعادل بين اللاعبين. أحسنتم جميعاً!");
        }
      }
    }
  }, [gameState.phase]);

  // ============ GAME OVER SCREEN ============
  if (gameState.phase === "GAME_OVER") {
    const resultRulebookId = detectRulebookId(gameState);
    const resultUsesCurrency = gameUsesCurrency(resultRulebookId);
    const winner = lastAnimation?.winner || gameState.winner;
    const standings = orderGameStandings(
      (lastAnimation?.standings as any[]) || Object.values(gameState.players),
      gameState,
      resultRulebookId,
      winner?.id
    );
    const resultReason =
      lastAnimation?.reasonAr ||
      lastAnimation?.victoryReason ||
      gameState.victoryReason ||
      "اختتمت الجولات بنجاح وتفوق البطل على منافسيه";

    return (
      <div
        dir="rtl"
        className="w-screen min-h-screen bg-slate-950 bg-mesh-dark text-white flex flex-col justify-between p-4 sm:p-6 md:p-8 overflow-x-hidden overflow-y-auto select-none font-sans relative"
      >
        {/* Celebratory Golden Confetti & Sparkles Particle Effects */}
        <GoldenCelebrationParticles />

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between bg-slate-900/90 border border-amber-500/30 rounded-3xl px-8 py-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(245,158,11,0.6)]">
              👑
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                انتهت السهرة - تتويج بطل اللعبة!
              </h1>
              <p className="text-sm text-slate-400">
                {resultReason}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => sendAction?.({ type: "RESET_TO_LOBBY" })}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-sm font-bold transition-all shadow"
            >
              🔄 العودة إلى اللوبي
            </button>
          </div>
        </header>

        {/* Center: Winner Announcement Podium with celebratory aura */}
        <main className="relative z-10 flex-1 my-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-center max-w-6xl mx-auto w-full">
          {/* Winner Showcase Card */}
          <div className="md:col-span-2 bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950/95 border-2 border-amber-400/80 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[0_0_35px_rgba(245,158,11,0.25)] backdrop-blur-md relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400 via-amber-600/30 to-transparent" />

            <motion.div
              initial={{ scale: 0.5, y: -20, opacity: 0 }}
              animate={{ scale: [1, 1.08, 1], y: [0, -8, 0], opacity: 1 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative mb-4"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-600 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.8)] border-2 border-yellow-200">
                <Trophy className="w-14 h-14 text-slate-950" />
              </div>
            </motion.div>

            <span className="px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black text-xs md:text-sm uppercase tracking-widest mb-2 shadow-sm">
              {winner ? "👑 الفائز الأول بالعرش" : "🤝 انتهت الجولة بالتعادل"}
            </span>

            {winner ? (
              <>
                <h2 className="text-3xl md:text-5xl font-black text-white mt-1 mb-2 tracking-wide drop-shadow-md truncate max-w-full px-2" title={winner.name}>
                  {winner.name}
                </h2>
                {resultUsesCurrency ? (
                  <div className="flex items-center gap-3 bg-amber-950/40 border border-amber-500/40 px-6 py-2.5 rounded-2xl my-2 shadow-inner">
                    <Coins className="w-7 h-7 text-amber-400" />
                    <span className="text-3xl font-black text-amber-300">
                      {winner.coins}
                    </span>
                    <span className="text-base text-amber-200 font-bold">
                      {gameState.currencyName || "ذهبة"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/40 px-5 py-2.5 rounded-2xl my-2 shadow-inner">
                    <Trophy className="w-6 h-6 text-amber-300" />
                    <span className="text-lg font-black text-amber-200">
                      {getWinnerAchievement(resultRulebookId)}
                    </span>
                  </div>
                )}
                <p className="text-slate-300 text-sm max-w-md mt-2">
                  {resultReason}
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 my-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/15 flex items-center justify-center text-3xl">
                  🤝
                </div>
                <p className="text-slate-300 text-sm md:text-base font-bold max-w-md">
                  {resultReason}
                </p>
                <p className="text-xs text-slate-500">
                  لا يوجد فائز منفرد — الجميع خرج بسلام من هذه الجولة.
                </p>
              </div>
            )}
          </div>

          {/* Standings Podium Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between h-full shadow-2xl backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Medal className="w-5 h-5 text-amber-400" />
                  {winner ? "الترتيب النهائي" : "نتائج اللاعبين"}
                </h3>
                <span className="text-xs text-slate-400 font-bold">
                  {standings.length} لاعبين
                </span>
              </div>

              <div className="space-y-2.5 max-h-[38vh] overflow-y-auto pr-1">
                {standings.map((player: any, idx: number) => {
                  const isFirst = Boolean(winner) && idx === 0;
                  const isSecond = Boolean(winner) && idx === 1;
                  const isThird = Boolean(winner) && idx === 2;

                  return (
                    <div
                      key={player.id}
                      style={{
                        borderColor: isFirst
                          ? "#F59E0B"
                          : isSecond
                          ? "#94A3B8"
                          : isThird
                          ? "#B45309"
                          : "rgba(51, 65, 85, 0.5)"
                      }}
                      className={`p-3 rounded-2xl bg-slate-950/70 border flex items-center justify-between shadow ${
                        isFirst ? "bg-amber-950/30 shadow-amber-500/10" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                            isFirst
                              ? "bg-amber-400 text-slate-950"
                              : isSecond
                              ? "bg-slate-300 text-slate-950"
                              : isThird
                              ? "bg-amber-700 text-white"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {winner ? idx + 1 : "–"}
                        </div>
                        <div
                          style={{ backgroundColor: player.color }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-slate-950 text-xs shadow shrink-0"
                        >
                          {getPlayerInitials(player.name)}
                        </div>
                        <span className="font-bold text-sm text-white truncate max-w-[120px]" title={player.name}>
                          {player.name}
                        </span>
                      </div>

                      {resultUsesCurrency ? (
                        <div className="text-left font-black text-amber-400 text-sm flex items-center gap-1 shrink-0">
                          <span>{player.coins}</span>
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                      ) : (
                        <div className="text-left font-bold text-[11px] text-amber-200/80 shrink-0 max-w-[130px] truncate" title={getPlayerResultStat(resultRulebookId, player.id, gameState)}>
                          {getPlayerResultStat(resultRulebookId, player.id, gameState)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 mt-3 text-center text-xs text-slate-500">
              🎉 شكراً لجميع اللاعبين على هذه السهرة الرائعة!
            </div>
          </div>
        </main>

        {/* Bottom Ticker */}
        <footer className="relative z-10 w-full mt-2">
          <LiveEventTicker events={eventHistory} />
        </footer>
      </div>
    );
  }

  // ============ LOBBY SCREEN ============
  if (gameState.phase === "LOBBY") {
    const playersList = Object.values(gameState.players);
    const playerCount = playersList.length;
    const currentThemeId = gameState.settings?.themeId || gameState.themeId || "ARABIAN_MAJLIS";
    const activeTheme = getThemeById(currentThemeId);
    const currentPlayMode = gameState.settings?.playMode || gameState.playMode || "CASUAL";
    const allUniversalThemes = getAllThemes();
    const lobbyCommunityMap = COMMUNITY_MAPS.find((m) => m.presetKey === selectedPackMode);
    const lobbyLoungeGame = JAWAKER_LOUNGE_GAMES.find((g) => g.key === selectedPackMode);
    // الألعاب المجرّدة (كونكت فور/الضامة/بينغو) لا تعتمد على ثيم العالم ولا الرصيد.
    const supportsThemeSelector = !["CONNECT_FOUR", "CHECKERS_CLASSIC", "BINGO_NIGHT"].includes(
      selectedPackMode
    );
    const supportsStartingCoins =
      Boolean(lobbyCommunityMap) ||
      ["MONOPOLY_CLASSIC", "RIYADH_VIP", "WORLD_CONQUEST_RISK", "GENERIC_BOARD", "AI", "CUSTOM_IMPORT"].includes(
        selectedPackMode
      );
    const noCoinsNotes: Record<string, string> = {
      CONNECT_FOUR: "🔴 كونكت فور لا يستخدم رصيداً — الفوز بأربعة أقراص متصلة.",
      CHECKERS_CLASSIC: "⚫ الضامة لا تستخدم رصيداً — الفوز بأسر قطع الخصم أو تحريم حركته.",
      BINGO_NIGHT: "🎱 بينغو لا يستخدم رصيداً — الفوز بإكمال أول خط في بطاقتك.",
      LUDO_CLASSIC: "🎲 لودو لا يستخدم رصيداً — الفوز بإيصال القطع الأربعة إلى المركز.",
      TACTICAL_CARDS_UNO: "🃏 أونو لا يستخدم رصيداً — الفوز بالتخلص من كل أوراقك.",
      SNAKES_AND_LADDERS_RPG: "🪜 السلم والثعبان لا يستخدم رصيداً — الفوز بالوصول إلى المربع 100.",
      SOCIAL_MAFIA_SPY: "🕵️ مافيا لا تستخدم رصيداً — الفوز بإقصاء الفريق الخصم بالتصويت."
    };
    const noCoinsNote =
      noCoinsNotes[selectedPackMode] ||
      "هذه اللعبة لا تستخدم رصيداً — الفوز يتحقق وفق شروط اللعبة المعلنة.";
    const selectedWinText =
      lobbyCommunityMap
        ? "إفلاس المنافسين أو احتكار السوق بالكامل"
        : lobbyLoungeGame?.rulesPreview.win ||
          (selectedPackMode === "AI" || selectedPackMode === "CUSTOM_IMPORT"
            ? customImportedPack?.winCondition === "MOST_COINS"
              ? "جمع أعلى رصيد عند نهاية الجولات"
              : "تحقيق شرط الفوز المولّد في الحزمة"
            : "اللعب حتى تحقيق الهدف أو إنهاء الرقعة");
    const lobbyRulesId = lobbyCommunityMap
      ? detectRulebookId(lobbyCommunityMap.pack)
      : lobbyLoungeGame
        ? detectRulebookId({ key: lobbyLoungeGame.key })
        : customImportedPack
          ? detectRulebookId(customImportedPack)
          : "GENERIC";
    const activeGameProfile = resolveGameProfile(
      selectedPackMode === "CUSTOM_IMPORT" || selectedPackMode === "AI"
        ? undefined
        : selectedPackMode,
      selectedPackMode === "CUSTOM_IMPORT" ? customImportedPack || undefined : undefined
    );
    const canAddBot = playerCount < activeGameProfile.maxPlayers;
    const botsToAdd = Math.max(0, activeGameProfile.minPlayers - playerCount);

    return (
      <div
        dir="rtl"
        className="w-screen min-h-screen bg-slate-950 bg-mesh-dark text-white flex flex-col justify-between p-4 sm:p-6 md:p-8 overflow-x-hidden overflow-y-auto select-none font-sans relative"
      >
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-3xl px-6 sm:px-8 py-5 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg shrink-0">
              🎲
            </div>
            <div>
              <h1 className="text-2xl font-black">غرفة السهرة الذكية</h1>
              <p className="text-sm text-slate-400">انضموا عبر مسح الرمز من هواتفكم</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Theme Badge in Header */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800 shadow">
              <span className="text-xl">
                {currentThemeId === "ARABIAN_MAJLIS"
                  ? "🕌"
                  : currentThemeId === "CYBERPUNK_NEON"
                  ? "🏙️"
                  : currentThemeId === "DEEP_SPACE"
                  ? "🚀"
                  : currentThemeId === "CARTOON_OFFICE"
                  ? "☕"
                  : "⚔️"}
              </span>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold">العالم النشط</span>
                <span className="text-xs font-black text-amber-300">{activeTheme.titleAr}</span>
              </div>
            </div>

            {/* Play Mode Badge in Header */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800 shadow">
              <span className="text-xl">{currentPlayMode === "CASUAL" ? "☕" : "🏆"}</span>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold">طور اللعب</span>
                <span className={`text-xs font-black ${currentPlayMode === "CASUAL" ? "text-amber-400" : "text-rose-400"}`}>
                  {currentPlayMode === "CASUAL" ? "وناسة وجمعة" : "محترفين رسمي"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-950 px-6 py-3 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400">رمز الغرفة</span>
              <span className="text-3xl font-black tracking-widest text-emerald-400 font-mono">
                {gameState.roomId}
              </span>
            </div>
          </div>
        </header>

        {/* Center / Body: QR & Players */}
        <main className="flex-1 my-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-6xl mx-auto w-full">
          {/* QR Code Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-md">
            <div className="bg-white p-4 rounded-3xl shadow-2xl mb-4 transform hover:scale-105 transition-transform">
              <QRCodeSVG value={joinUrl} size={220} />
            </div>
            <h2 className="text-xl font-bold mb-1">امسح الكود بكاميرا جوالك</h2>
            <p className="text-sm text-slate-400">
              أو افتح الرابط:{" "}
              <span className="text-emerald-400 font-mono text-xs select-all">
                {joinUrl}
              </span>
            </p>
          </div>

          {/* Connected Players Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between w-full shadow-2xl backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black flex items-center gap-2">
                  <Users className="w-6 h-6 text-indigo-400" />
                  اللاعبون المنضمون
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => sendAction?.({ type: "ADD_BOT" })}
                    disabled={!canAddBot}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/50 text-xs font-black transition-all flex items-center gap-1 active:scale-95 disabled:opacity-40 shadow-sm"
                    title={
                      canAddBot
                        ? "إضافة لاعب روبوت ذكي"
                        : `وصلت الغرفة للحد الأقصى (${activeGameProfile.maxPlayers})`
                    }
                  >
                    <span>➕ إضافة بوت 🤖</span>
                  </button>
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-sm">
                    {playerCount}/{activeGameProfile.maxPlayers} لاعبين
                  </span>
                </div>
              </div>

              {playerCount === 0 ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-3">
                  <div className="text-4xl animate-bounce">📱</div>
                  <p>بانتظار مسح أول لاعب للكود للانضمام...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                  {playersList.map((player) => (
                    <div
                      key={player.id}
                      style={{ borderColor: player.color }}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border-2 flex items-center gap-3 shadow"
                    >
                      <div
                        style={{ backgroundColor: player.color }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-slate-950 shadow shrink-0"
                      >
                        {getPlayerInitials(player.name)}
                      </div>
                      <div className="truncate min-w-0 flex-1">
                        <div className="font-bold text-sm text-white truncate flex items-center gap-1.5 min-w-0">
                          <span className="truncate min-w-0" title={player.name}>{player.name}</span>
                          {player.isBot && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-black">
                              BOT 🤖
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                          {player.isBot ? "روبوت جاهز" : "متصل"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Unified Smart Hints Feature Banner */}
            <div className="bg-slate-950/70 border border-amber-500/30 rounded-2xl p-3 my-2 flex items-center justify-between gap-3 shadow">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-base shrink-0">
                  💡
                </div>
                <div>
                  <div className="text-xs font-black text-amber-300 flex items-center gap-2">
                    <span>نظام التلميحات الذكية مفعّل تلقائياً</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      نشط لجميع اللاعبين ✓
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-normal">
                    يقدم إرشادات تفاعلية أثناء الدور، مع إمكانية التخطي أو الإخفاء بضغطة زر واحدة من شاشة الهاتف.
                  </p>
                </div>
              </div>
            </div>

            {/* Universal Theme Selector Bar (عالم السهرة والشخصيات 🎨) */}
            {supportsThemeSelector && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-4 my-2 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>عالم السهرة والشخصيات 🎨</span>
                </span>
                <span
                  className="text-[11px] font-black px-2.5 py-0.5 rounded-full border shadow-sm"
                  style={{
                    backgroundColor: activeTheme.colorPalette.boardTint,
                    borderColor: activeTheme.colorPalette.accent,
                    color: activeTheme.colorPalette.primary
                  }}
                >
                  {activeTheme.titleAr}
                </span>
              </div>

              {/* 4 Universal Themes Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {allUniversalThemes.map((t) => {
                  const isSelected = currentThemeId === t.id;
                  const themeIcon =
                    t.id === "ARABIAN_MAJLIS"
                      ? "🕌"
                      : t.id === "CYBERPUNK_NEON"
                      ? "🏙️"
                      : t.id === "DEEP_SPACE"
                      ? "🚀"
                      : t.id === "CARTOON_OFFICE"
                      ? "☕"
                      : "⚔️";
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => sendAction?.({ type: "UPDATE_SETTINGS", settings: { themeId: t.id } })}
                      className={`p-2.5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-1 shadow-md relative overflow-hidden ${
                        isSelected
                          ? "ring-2 ring-amber-400/60 shadow-lg scale-[1.02]"
                          : "border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                      style={
                        isSelected
                          ? {
                              borderColor: t.colorPalette.accent,
                              backgroundColor: "rgba(15, 23, 42, 0.95)",
                              boxShadow: `0 0 16px ${t.colorPalette.glowColor}`
                            }
                          : {}
                      }
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-2xl">{themeIcon}</span>
                        {isSelected && (
                          <span
                            className="text-[9px] font-black px-1.5 py-0.5 rounded-md shadow"
                            style={{
                              backgroundColor: t.colorPalette.primary,
                              color: "#fff"
                            }}
                          >
                            مفعل ✓
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-black text-white mt-1 truncate">
                        {t.titleAr}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {t.visualStyle}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Theme Player Tokens Preview */}
              <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-inner">
                <span className="text-[11px] font-bold text-amber-300/90 whitespace-nowrap flex items-center gap-1">
                  <span>الشخصيات والقطع:</span>
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin scrollbar-thumb-slate-800 text-[11px] text-slate-200 font-medium">
                  {activeTheme.playerTokens.map((token, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 whitespace-nowrap shadow-sm text-slate-200"
                    >
                      {token}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            )}

            {/* Game Settings Controls */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 my-2 space-y-3">
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2.5 gap-2">
                <span className="text-xs text-amber-300 font-bold flex items-center gap-1.5 min-w-0">
                  🏆 شرط الفوز: <span className="truncate">{selectedWinText}</span>
                </span>
                <span className="text-[11px] text-amber-400/90 bg-amber-500/20 px-2 py-0.5 rounded-full font-medium shrink-0">
                  {lobbyLoungeGame?.rulesPreview.mechanism || lobbyCommunityMap?.rulesPreview.mechanism || "حسم طبيعي"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-bold">قوانين اللعبة الحالية:</span>
                <GameRulesSheet
                  rulebookId={lobbyRulesId}
                  variant="ghost"
                  label="اقرأ القوانين 📖"
                />
              </div>

              {supportsStartingCoins ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">رصيد البداية:</span>
                  <div className="flex gap-1.5">
                    {[100, 150, 200, 300].map((coins) => {
                      const isSelected = (gameState.settings?.startingCoins ?? 150) === coins;
                      return (
                        <button
                          key={coins}
                          onClick={() => sendAction?.({ type: "UPDATE_SETTINGS", settings: { startingCoins: coins } })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-emerald-500 text-slate-950 shadow"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {coins} {gameState.currencyName || "ذهبة"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-bold text-slate-400">
                  {noCoinsNote}
                </div>
              )}
            </div>

            {/* Jawaker-Style Lounge Games Carousel & Selector */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-4 my-2 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>صالة ألعاب المجلس — اختر اللعبة:</span>
                </span>
                <a
                  href="/studio"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline underline-offset-2"
                >
                  استوديو التصميم 🎨
                </a>
              </div>

              {/* Category Segmented Switch: Base Classic vs Community Maps vs Custom */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setLobbyCategory("BASE");
                    if (!JAWAKER_LOUNGE_GAMES.some((g) => g.key === selectedPackMode)) {
                      setSelectedPackMode("MONOPOLY_CLASSIC");
                    }
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    lobbyCategory === "BASE"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-black"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>🏛️</span>
                  <span>الألعاب الأصلية (Base)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLobbyCategory("COMMUNITY");
                    if (!COMMUNITY_MAPS.some((m) => m.presetKey === selectedPackMode)) {
                      setSelectedPackMode("RIYADH_VIP");
                    }
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    lobbyCategory === "COMMUNITY"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md font-black"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>🌐</span>
                  <span>مابات المجتمع (Mods)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLobbyCategory("AI_IMPORT");
                    if (selectedPackMode !== "AI" && selectedPackMode !== "CUSTOM_IMPORT") {
                      setSelectedPackMode("AI");
                    }
                  }}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    lobbyCategory === "AI_IMPORT"
                      ? "bg-slate-800 text-purple-300 border border-purple-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>✨</span>
                  <span>AI واستيراد</span>
                </button>
              </div>

              {/* Horizontal Carousel Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                {lobbyCategory === "BASE" &&
                  JAWAKER_LOUNGE_GAMES.map((game) => {
                    const isSelected = selectedPackMode === game.key;
                    return (
                      <button
                        key={game.key}
                        type="button"
                        onClick={() => setSelectedPackMode(game.key)}
                        className={`px-3 py-2 rounded-2xl border text-right transition-all flex items-center gap-2 whitespace-nowrap shrink-0 shadow-md ${
                          isSelected
                            ? `border-amber-400 bg-gradient-to-r from-amber-950/80 to-slate-900 text-amber-200 ring-2 ring-amber-400/40 shadow-lg scale-[1.02]`
                            : "border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        }`}
                      >
                        <span className="relative block h-9 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-slate-950">
                          <img
                            src={game.cover}
                            alt={game.titleAr}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute bottom-0 left-0.5 text-[10px] leading-none drop-shadow">
                            {game.icon}
                          </span>
                        </span>
                        <div className="text-right">
                          <div className="text-xs font-black text-white">{game.titleAr}</div>
                          <span className="text-[9px] text-amber-300/80 font-mono block">{game.badge}</span>
                        </div>
                      </button>
                    );
                  })}

                {lobbyCategory === "COMMUNITY" &&
                  COMMUNITY_MAPS.map((map) => {
                    const isSelected = selectedPackMode === map.presetKey;
                    return (
                      <button
                        key={map.presetKey}
                        type="button"
                        onClick={() => {
                          setSelectedPackMode(map.presetKey);
                          // زامن معاينة الثيم مع هوية الخريطة (يمكن للمضيف
                          // بعدها اختيار عالم آخر من منتقي الثيمات).
                          sendAction?.({
                            type: "UPDATE_SETTINGS",
                            settings: { themeId: map.themeId }
                          });
                        }}
                        className={`px-3 py-2 rounded-2xl border text-right transition-all flex items-center gap-2 whitespace-nowrap shrink-0 shadow-md ${
                          isSelected
                            ? `border-indigo-400 bg-gradient-to-r from-indigo-950/80 to-purple-950/80 text-indigo-200 ring-2 ring-indigo-400/40 shadow-lg scale-[1.02]`
                            : "border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-xl">
                          {map.presetKey === "RIYADH_VIP" ? "🏙️" : map.presetKey === "CYBERPUNK_HEIST" ? "⚡" : map.presetKey === "DEEP_SPACE_CUSTOM" ? "🚀" : map.presetKey === "MEDIEVAL_CUSTOM" ? "⚔️" : "🕌"}
                        </span>
                        <div className="text-right">
                          <div className="text-xs font-black text-white">{map.titleAr}</div>
                          <span className="text-[9px] text-indigo-300 font-mono block">{map.badge}</span>
                        </div>
                      </button>
                    );
                  })}

                {lobbyCategory === "AI_IMPORT" && (
                  <>
                    {/* AI Custom Generator Tab */}
                    <button
                      type="button"
                      onClick={() => setSelectedPackMode("AI")}
                      className={`px-3 py-2 rounded-2xl border text-right transition-all flex items-center gap-2 whitespace-nowrap shrink-0 shadow-md ${
                        selectedPackMode === "AI"
                          ? "border-purple-400 bg-purple-950/70 text-purple-200 ring-2 ring-purple-400/40 shadow-lg scale-[1.02]"
                          : "border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-xl">✨</span>
                      <div className="text-right">
                        <div className="text-xs font-black text-white">ابتكار AI مخصص</div>
                        <span className="text-[9px] text-purple-300 font-mono block">توليد فوري</span>
                      </div>
                    </button>

                    {/* JSON File Tab */}
                    <button
                      type="button"
                      onClick={() => setSelectedPackMode("CUSTOM_IMPORT")}
                      className={`px-3 py-2 rounded-2xl border text-right transition-all flex items-center gap-2 whitespace-nowrap shrink-0 shadow-md ${
                        selectedPackMode === "CUSTOM_IMPORT"
                          ? "border-teal-400 bg-teal-950/70 text-teal-200 ring-2 ring-teal-400/40 shadow-lg scale-[1.02]"
                          : "border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-xl">📁</span>
                      <div className="text-right">
                        <div className="text-xs font-black text-white">استيراد JSON</div>
                        <span className="text-[9px] text-teal-300 font-mono block">ملف خارجي</span>
                      </div>
                    </button>
                  </>
                )}
              </div>

              {/* Selected Game Card Showcase */}
              {(() => {
                const activeLoungeGame = JAWAKER_LOUNGE_GAMES.find((g) => g.key === selectedPackMode);
                const activeCommunityMap = COMMUNITY_MAPS.find((m) => m.presetKey === selectedPackMode);

                if (activeCommunityMap) {
                  return (
                    <motion.div
                      key={activeCommunityMap.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 rounded-2xl border bg-gradient-to-br ${activeCommunityMap.colorScheme.bgGradient} ${activeCommunityMap.colorScheme.border} space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl p-1.5 rounded-xl bg-slate-950/70 border border-white/10 shadow">
                            {activeCommunityMap.presetKey === "RIYADH_VIP" ? "🏙️" : "🌐"}
                          </span>
                          <div>
                            <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                              <span>{activeCommunityMap.titleAr}</span>
                              <span className="text-[10px] text-amber-300 font-bold px-2 py-0.2 rounded-full bg-amber-500/20 border border-amber-500/30">
                                {activeCommunityMap.creatorAr}
                              </span>
                            </h4>
                            <p className="text-[11px] text-slate-300 font-bold">
                              {activeCommunityMap.subtitleAr}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            ⭐ {activeCommunityMap.rating}
                          </span>
                          <GameRulesSheet
                            rulebookId={detectRulebookId(activeCommunityMap.pack)}
                            variant="ghost"
                            label="القوانين"
                          />
                          <a
                            href={`/studio?preset=${activeCommunityMap.presetKey}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-indigo-300 hover:text-white underline underline-offset-2"
                          >
                            تعديل 🎨
                          </a>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {activeCommunityMap.descriptionAr}
                      </p>

                      {/* 4 Feature Pills */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {activeCommunityMap.highlights.map((feat, idx) => (
                          <div
                            key={idx}
                            className="text-[10px] text-slate-200 bg-slate-950/60 border border-white/5 rounded-lg px-2 py-1 flex items-center gap-1 truncate"
                          >
                            <span className="text-emerald-400">✓</span>
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                }

                if (activeLoungeGame) {
                  return (
                    <motion.div
                      key={activeLoungeGame.key}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 rounded-2xl border bg-gradient-to-br ${activeLoungeGame.colorScheme.bgGradient} ${activeLoungeGame.colorScheme.border} space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="relative block h-14 w-24 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-slate-950/70 shadow">
                            <img
                              src={activeLoungeGame.cover}
                              alt={activeLoungeGame.titleAr}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute bottom-0.5 left-0.5 text-base leading-none drop-shadow">
                              {activeLoungeGame.icon}
                            </span>
                          </span>
                          <div>
                            <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                              <span>{activeLoungeGame.titleAr}</span>
                              <span className="text-[10px] text-slate-300 font-normal">
                                ({activeLoungeGame.subtitleAr})
                              </span>
                            </h4>
                            <p className="text-[11px] text-amber-300/90 font-bold">
                              {activeLoungeGame.taglineAr}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${activeLoungeGame.colorScheme.badgeBg}`}>
                            {activeLoungeGame.playerCount}
                          </span>
                          <GameRulesSheet
                            rulebookId={detectRulebookId({ key: activeLoungeGame.key })}
                            variant="ghost"
                            label="القوانين"
                          />
                          <a
                            href={`/studio?preset=${activeLoungeGame.key}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-indigo-300 hover:text-white underline underline-offset-2"
                          >
                            تعديل 🎨
                          </a>
                        </div>
                      </div>

                      {/* 4 Feature Pills */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {activeLoungeGame.features.map((feat, idx) => (
                          <div
                            key={idx}
                            className="text-[10px] text-slate-200 bg-slate-950/60 border border-white/5 rounded-lg px-2 py-1 flex items-center gap-1 truncate"
                          >
                            <span className="text-amber-400">✓</span>
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                }

                if (selectedPackMode === "AI") {
                  return (
                    <div className="p-3.5 rounded-2xl border border-purple-500/40 bg-purple-950/40 text-right space-y-1">
                      <div className="text-xs font-black text-purple-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                        <span>ابتكار جلسة ألعاب مخصصة بالذكاء الاصطناعي</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        سيقوم المخرج الذكي بصياغة لوحة وبطاقات درامية حصرية مستوحاة من أسماء اللاعبين المنضمين للجلسة فور الضغط على ابدأ!
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="p-3.5 rounded-2xl border border-teal-500/40 bg-teal-950/40 text-right space-y-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-600/30 hover:bg-teal-600/50 border border-teal-500/50 text-teal-200 text-xs font-bold transition-colors">
                      <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                      <span>📁 اختر ملف JSON لحزمة اللعبة</span>
                    </label>
                    {customImportedPack && (
                      <span className="text-emerald-400 font-extrabold text-[11px] block">
                        ✓ تم تحميل: {customImportedPack.themeTitle}
                      </span>
                    )}
                    {importError && <div className="text-rose-400 text-[11px] font-bold">{importError}</div>}
                  </div>
                );
              })()}
            </div>

            {/* Start Game Actions */}
            <div className="pt-3 border-t border-slate-800/80 mt-1 flex flex-col items-center gap-2.5">
              {isGenerating ? (
                <div className="w-full py-5 rounded-2xl bg-purple-900/50 border border-purple-500/40 text-purple-200 flex items-center justify-center gap-3 shadow-xl animate-pulse">
                  <Sparkles className="w-6 h-6 animate-spin text-purple-300" />
                  <span className="text-lg font-black">
                    ✨ الذكاء الاصطناعي يبتكر اللوحة والبطاقات الآن...
                  </span>
                </div>
              ) : (
                <>
                  {/* Primary Start Game Button (With joined players) */}
                  <button
                    disabled={playerCount < 1}
                    onClick={handleStartGame}
                    className="w-full py-4 rounded-2xl text-lg font-black bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xl transition-all transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 text-slate-950"
                  >
                    <Users className="w-5 h-5" />
                    <span>
                      {selectedPackMode === "AI" && "ابدأ اللعبة مع اللاعبين (توليد AI) 👥"}
                      {selectedPackMode === "CUSTOM_IMPORT" && `ابدأ بالحزمة المخصصة (${customImportedPack?.themeTitle || ""}) 👥`}
                      {selectedPackMode !== "AI" && selectedPackMode !== "CUSTOM_IMPORT" && (
                        `ابدأ (${COMMUNITY_MAPS.find((m) => m.presetKey === selectedPackMode)?.titleAr || JAWAKER_LOUNGE_GAMES.find((g) => g.key === selectedPackMode)?.titleAr || selectedPackMode}) مع اللاعبين 👥`
                      )}
                    </span>
                  </button>

                  {/* Instant Solo / Bot Match Launcher (Always available!) */}
                  <button
                    type="button"
                    onClick={() =>
                      sendAction?.({
                        type: "START_DEFAULT_WITH_BOTS",
                        presetKey:
                          selectedPackMode !== "AI" && selectedPackMode !== "CUSTOM_IMPORT"
                            ? selectedPackMode
                            : "MONOPOLY_CLASSIC"
                      })
                    }
                    className="w-full py-3.5 rounded-2xl text-sm font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 border border-amber-300/40 flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 glow-amber"
                  >
                    <span>
                      🤖 تشغيل عرض تجريبي فوري مع{" "}
                      {Math.max(3, activeGameProfile.minPlayers)} بوتات
                    </span>
                  </button>
                  {botsToAdd > 0 && (
                    <span className="text-[11px] text-amber-300/90 text-center">
                      سيُضاف {botsToAdd} بوت تلقائياً عند البدء للوصول إلى الحد الأدنى
                      ({activeGameProfile.minPlayers} لاعبين).
                    </span>
                  )}
                  {playerCount < 2 && (
                    <span className="text-[11px] text-slate-400 text-center">
                      يمكنك البدء الآن وسيكمل البوت الذكي العدد المطلوب، أو انتظر انضمام
                      اللاعبين عبر الرمز.
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </main>

        <footer className="w-full">
          <LiveEventTicker events={eventHistory} />
        </footer>
      </div>
    );
  }

  return (
    <div dir="rtl" className="w-screen h-screen overflow-hidden bg-black relative font-sans">
      <GameTables
        gameState={gameState}
        sendAction={sendAction || (() => {})}
        lastAnimation={lastAnimation}
        visualPositions={visualPositions}
        displayedDice={displayedDice}
        isRollingDice={isRollingDice}
        isSpectator={isSpectator}
        onOpenInvite={() => setShowQRModal(true)}
        onOpenMenu={() => setShowMenuModal(true)}
      />

      {/* ============================================================== */}
      {/* 6. INVITE QR CODE POPUP MODAL                                  */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-amber-400/80 shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-6 flex flex-col items-center gap-4 text-center relative"
            >
              <button
                onClick={() => setShowQRModal(false)}
                className="absolute top-4 left-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <QrCode className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">امسح للانضمام إلى الطاولة</h3>
                <p className="text-xs text-slate-400 mt-0.5">افتح كاميرا الجوال وشارك اللعب فوراً</p>
              </div>

              <div className="bg-white p-3 rounded-2xl shadow-inner border-4 border-amber-400">
                <QRCodeSVG value={joinUrl} size={180} />
              </div>

              <div className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">رمز الغرفة</span>
                  <span className="text-lg font-black tracking-widest text-emerald-400 font-mono">
                    {gameState.roomId}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (typeof navigator !== "undefined") {
                      navigator.clipboard.writeText(joinUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "تم النسخ!" : "نسخ الرابط"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 7. SETTINGS & MENU POPUP MODAL                                 */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showMenuModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 flex flex-col gap-4 text-right relative"
            >
              <button
                onClick={() => setShowMenuModal(false)}
                className="absolute top-4 left-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Menu className="w-5 h-5 text-amber-400" />
                <span>خيارات المجلس</span>
              </h3>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    const nextState = !isVoiceEnabled;
                    setIsVoiceEnabled(nextState);
                    if (nextState) speakArabicNarrator("تم تفعيل الراوي الصوتي");
                  }}
                  className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 flex items-center justify-between transition"
                >
                  <span className="text-sm font-bold text-slate-200">الراوي الصوتي التفاعلي</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isVoiceEnabled ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700 text-slate-400"}`}>
                    {isVoiceEnabled ? "مفعّل" : "معطّل"}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuModal(false);
                    sendAction?.({ type: "RESET_TO_LOBBY" });
                  }}
                  className="w-full p-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 flex items-center justify-between transition"
                >
                  <span className="text-sm font-bold">إنهاء الجولة والعودة للوبي</span>
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Host action feedback (invalid host token, wrong turn, etc.) */}
      <AnimatePresence>
        {errorToast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] max-w-[92vw] px-5 py-2.5 rounded-2xl bg-rose-950/95 border border-rose-500/60 text-rose-100 text-sm font-bold shadow-[0_12px_35px_rgba(0,0,0,0.8)] backdrop-blur-md"
            dir="rtl"
          >
            {errorToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Reaction Emojis Physics Container */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {floatingReactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 0, scale: 0.4, x: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -440,
                scale: [0.4, 1.35, 1.1],
                x: [0, 18, -18, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3.0, ease: "easeOut" }}
              style={{
                position: "absolute",
                bottom: "16%",
                left: `${r.startX}%`
              }}
              className="flex flex-col items-center filter drop-shadow-[0_8px_25px_rgba(0,0,0,0.9)] z-50 pointer-events-none select-none"
            >
              {r.text && (
                <div className="relative mb-2 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 font-black text-base shadow-[0_0_25px_rgba(245,158,11,0.6)] border-2 border-white animate-bounce whitespace-nowrap">
                  <span>{r.text}</span>
                  <div className="w-2.5 h-2.5 bg-orange-500 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b border-white" />
                </div>
              )}
              <span className="text-6xl select-none filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)] animate-pulse">
                {r.emoji}
              </span>
              <span
                style={{ backgroundColor: r.playerColor }}
                className="mt-1.5 px-3 py-0.5 rounded-full text-[11px] font-black text-slate-950 shadow-xl border border-white/60"
              >
                {r.playerName}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
