"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Building2
} from "lucide-react";
import type { FullRoomState } from "../game/gameRoom";
import { GeneratedSessionPackSchema, type BoardTile, type GameCard, type GeneratedSessionPack } from "../game/schema";
import { FAMOUS_GAME_PRESETS, PRESET_PACKS } from "../game/aiPackGenerator";
import { sfx, speakArabicNarrator } from "../utils/soundEffects";
import LiveEventTicker from "./LiveEventTicker";

interface SharedBoardProps {
  gameState: FullRoomState;
  lastAnimation: any;
  joinUrl: string;
  sendAction?: (payload: Record<string, unknown>) => void;
  isGeneratingAI?: boolean;
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
  isGeneratingAI = false
}: SharedBoardProps) {
  const [visualPositions, setVisualPositions] = useState<Record<string, number>>({});
  const [narratorMessage, setNarratorMessage] = useState<string>(
    "بانتظار رمية النرد الأولى..."
  );
  const [displayedDice, setDisplayedDice] = useState<number | null>(null);
  const [activeCardModal, setActiveCardModal] = useState<GameCard | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const [eventHistory, setEventHistory] = useState<string[]>([
    "أهلاً بكم في سهرة اللعبة التفاعلية الذكية!",
    "النرد والبطاقات جاهزة للإثارة والمنافسة."
  ]);
  const [selectedPackMode, setSelectedPackMode] = useState<string>("MONOPOLY_CLASSIC");
  const [customImportedPack, setCustomImportedPack] = useState<GeneratedSessionPack | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<Array<{
    id: string;
    emoji: string;
    playerName: string;
    playerColor: string;
    startX: number;
  }>>([]);

  // Auto-load custom pack from Studio if present in sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("custom_studio_pack");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const validated = GeneratedSessionPackSchema.safeParse(parsed);
          if (validated.success) {
            setCustomImportedPack(validated.data);
            setSelectedPackMode("CUSTOM_IMPORT");
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

    if (lastAnimation.type === "DICE_ROLLED") {
      sfx.playDiceRoll();
      setDisplayedDice(lastAnimation.diceValue);
      const diceMsg = `رمى ${gameState.players[lastAnimation.playerId]?.name || "اللاعب"} النرد وحصل على ${lastAnimation.diceValue}!`;
      setNarratorMessage(diceMsg);
      incomingMessages.push(diceMsg);
    }

    if (
      lastAnimation.type === "DRAMA_CARD_TRIGGERED" ||
      lastAnimation.type === "SECRET_CARD_PLAYED" ||
      lastAnimation.type === "VOTE_SESSION_STARTED"
    ) {
      sfx.playDramaAlert();
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
      const winnerName = lastAnimation.winner?.name || "البطل";
      const reason = lastAnimation.reasonAr || "تتويج بطل السهرة!";
      incomingMessages.push(`🏆 فاز ${winnerName} بالمركز الأول! ${reason}`);
    }

    if (lastAnimation.type === "LIVE_REACTION" && lastAnimation.emoji) {
      sfx.playTurnChime();
      const player = gameState.players[lastAnimation.playerId];
      const newReaction = {
        id: `react_${Date.now()}_${Math.random()}`,
        emoji: lastAnimation.emoji,
        playerName: player?.name || "لاعب",
        playerColor: player?.color || "#eab308",
        startX: 15 + Math.random() * 70
      };
      setFloatingReactions((prev) => [...prev.slice(-15), newReaction]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 2500);
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
      const standings = Object.values(gameState.players).sort((a, b) => b.coins - a.coins);
      const winner = lastAnimation?.winner || standings[0];
      if (winner && isVoiceEnabled) {
        speakArabicNarrator(`مبروك للفائز ${winner.name}! لقد توج بطلاً للسهرة!`);
      }
    }
  }, [gameState.phase]);

  // ============ GAME OVER SCREEN ============
  if (gameState.phase === "GAME_OVER") {
    const standings =
      lastAnimation?.standings ||
      Object.values(gameState.players).sort((a, b) => b.coins - a.coins);
    const winner = lastAnimation?.winner || standings[0];

    return (
      <div
        dir="rtl"
        className="w-screen h-screen bg-slate-950 text-white flex flex-col justify-between p-6 overflow-hidden select-none font-sans relative"
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
                {lastAnimation?.reasonAr || "اختتمت الجولات بنجاح وتفوق البطل على منافسيه"}
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
              👑 الفائز الأول بالعرش
            </span>

            {winner && (
              <>
                <h2 className="text-3xl md:text-5xl font-black text-white mt-1 mb-2 tracking-wide drop-shadow-md">
                  {winner.name}
                </h2>
                <div className="flex items-center gap-3 bg-amber-950/40 border border-amber-500/40 px-6 py-2.5 rounded-2xl my-2 shadow-inner">
                  <Coins className="w-7 h-7 text-amber-400" />
                  <span className="text-3xl font-black text-amber-300">
                    {winner.coins}
                  </span>
                  <span className="text-base text-amber-200 font-bold">
                    {gameState.currencyName || "ذهبة"}
                  </span>
                </div>
                <p className="text-slate-300 text-sm max-w-md mt-2">
                  {lastAnimation?.reasonAr || "أداء استثنائي وتخطيط استراتيجي قاده لاعتلاء القمة!"}
                </p>
              </>
            )}
          </div>

          {/* Standings Podium Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between h-full shadow-2xl backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Medal className="w-5 h-5 text-amber-400" />
                  الترتيب النهائي
                </h3>
                <span className="text-xs text-slate-400 font-bold">
                  {standings.length} لاعبين
                </span>
              </div>

              <div className="space-y-2.5 max-h-[38vh] overflow-y-auto pr-1">
                {standings.map((player: any, idx: number) => {
                  const isFirst = idx === 0;
                  const isSecond = idx === 1;
                  const isThird = idx === 2;

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
                          {idx + 1}
                        </div>
                        <div
                          style={{ backgroundColor: player.color }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-slate-950 text-xs shadow shrink-0"
                        >
                          {player.name.slice(0, 2)}
                        </div>
                        <span className="font-bold text-sm text-white truncate max-w-[120px]">
                          {player.name}
                        </span>
                      </div>

                      <div className="text-left font-black text-amber-400 text-sm flex items-center gap-1">
                        <span>{player.coins}</span>
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                      </div>
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

    return (
      <div
        dir="rtl"
        className="w-screen h-screen bg-slate-950 text-white flex flex-col justify-between p-8 overflow-hidden select-none font-sans"
      >
        {/* Header */}
        <header className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-3xl px-8 py-5 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg">
              🎲
            </div>
            <div>
              <h1 className="text-2xl font-black">غرفة السهرة الذكية</h1>
              <p className="text-sm text-slate-400">انضموا عبر مسح الرمز من هواتفكم</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-950 px-6 py-3 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400">رمز الغرفة</span>
            <span className="text-3xl font-black tracking-widest text-emerald-400 font-mono">
              {gameState.roomId}
            </span>
          </div>
        </header>

        {/* Center / Body: QR & Players */}
        <main className="flex-1 my-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-6xl mx-auto w-full">
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
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between h-full shadow-2xl backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black flex items-center gap-2">
                  <Users className="w-6 h-6 text-indigo-400" />
                  اللاعبون المنضمون
                </h2>
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-sm">
                  {playerCount} لاعبين
                </span>
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
                        {player.name.slice(0, 2)}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-sm text-white truncate">{player.name}</div>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                          متصل
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Game Settings Controls */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 my-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">عدد الجولات:</span>
                <div className="flex gap-1.5">
                  {[5, 10, 15, 20].map((rounds) => {
                    const isSelected = (gameState.settings?.maxRounds ?? gameState.maxRounds) === rounds;
                    return (
                      <button
                        key={rounds}
                        onClick={() => sendAction?.({ type: "UPDATE_SETTINGS", settings: { maxRounds: rounds } })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-amber-500 text-slate-950 shadow"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {rounds}
                      </button>
                    );
                  })}
                </div>
              </div>

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
            </div>

            {/* Game Archetype & Pack Selector */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 my-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  قالب وحزمة اللعبة:
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

              <div className="grid grid-cols-2 gap-2 text-right max-h-60 overflow-y-auto pr-1">
                {/* AI Pack Option */}
                <button
                  type="button"
                  onClick={() => setSelectedPackMode("AI")}
                  className={`p-2 rounded-xl border text-right transition-all flex flex-col justify-between ${
                    selectedPackMode === "AI"
                      ? "border-purple-400 bg-purple-950/50 text-purple-200 shadow-md shadow-purple-500/20"
                      : "border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="font-extrabold text-xs text-white flex items-center justify-between">
                    <span>✨ ابتكار AI مخصص</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">توليد فوري</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">توليد مخصص حسب أسماء واقتراحات الشلة</div>
                </button>

                {/* 6 Famous Game Presets */}
                {FAMOUS_GAME_PRESETS.map((preset) => {
                  const isSelected = selectedPackMode === preset.key;
                  return (
                    <div
                      key={preset.key}
                      onClick={() => setSelectedPackMode(preset.key)}
                      className={`p-2 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? "border-amber-400 bg-amber-950/40 text-amber-200 shadow-md shadow-amber-500/20"
                          : "border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="font-extrabold text-xs text-white flex items-center justify-between">
                        <span>{preset.icon} {preset.titleAr}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">{preset.badge}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{preset.taglineAr}</div>
                      <div className="mt-1.5 pt-1 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-[9px] text-slate-500 font-mono">{preset.turnMechanism}</span>
                        <a
                          href={`/studio?preset=${preset.key}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline flex items-center gap-0.5"
                        >
                          عدّل (Remix) 🎨
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* JSON Pack Import */}
              <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-xs">
                <label className="cursor-pointer text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span>📁 استيراد حزمة من ملف JSON</span>
                </label>
                {selectedPackMode === "CUSTOM_IMPORT" && customImportedPack && (
                  <span className="text-emerald-400 font-extrabold text-[11px] bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-lg truncate max-w-[180px]">
                    ✓ {customImportedPack.themeTitle}
                  </span>
                )}
              </div>
              {importError && (
                <div className="text-rose-400 text-[11px] font-bold mt-1">{importError}</div>
              )}
            </div>

            {/* Start Game Action */}
            <div className="pt-3 border-t border-slate-800/80 mt-1 flex flex-col items-center gap-3">
              {isGenerating ? (
                <div className="w-full py-5 rounded-2xl bg-purple-900/50 border border-purple-500/40 text-purple-200 flex items-center justify-center gap-3 shadow-xl animate-pulse">
                  <Sparkles className="w-6 h-6 animate-spin text-purple-300" />
                  <span className="text-lg font-black">
                    ✨ الذكاء الاصطناعي يبتكر اللوحة والبطاقات الآن...
                  </span>
                </div>
              ) : (
                <>
                  <button
                    disabled={playerCount < 2}
                    onClick={handleStartGame}
                    className="w-full py-5 rounded-2xl text-xl font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-white"
                  >
                    <Sparkles className="w-6 h-6 text-amber-300" />
                    <span>
                      {selectedPackMode === "AI" && "ابدأ اللعبة بالذكاء الاصطناعي"}
                      {selectedPackMode === "CUSTOM_IMPORT" && `ابدأ بالحزمة المخصصة (${customImportedPack?.themeTitle || ""})`}
                      {selectedPackMode !== "AI" && selectedPackMode !== "CUSTOM_IMPORT" && (
                        `ابدأ بـ (${FAMOUS_GAME_PRESETS.find(p => p.key === selectedPackMode)?.titleAr || selectedPackMode})`
                      )}
                    </span>
                  </button>
                  {playerCount < 2 && (
                    <p className="text-xs text-slate-500">
                      يجب انضمام لاعبين اثنين على الأقل لبدء اللعبة
                    </p>
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

  const activePlayerId = gameState.turnOrder[gameState.currentTurnIndex];
  const activePlayer = gameState.players[activePlayerId];

  return (
    <div
      dir="rtl"
      className="w-screen h-screen bg-slate-950 text-white flex flex-col justify-between p-4 overflow-hidden select-none font-sans"
    >
      {/* Top HUD */}
      <header className="h-[10vh] bg-slate-900/90 border border-slate-800 rounded-2xl px-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500/20 border border-amber-500/40 px-4 py-2 rounded-xl text-center">
            <span className="text-xs text-amber-300 block">الجولة</span>
            <span className="text-xl font-black text-amber-400">
              {gameState.currentRound} / {gameState.maxRounds}
            </span>
          </div>
          <div>
            <div className="text-xs text-slate-400">صاحب الدور</div>
            <div className="text-lg font-bold flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: activePlayer?.color || "#fff" }}
              />
              {activePlayer?.name || "—"}
            </div>
          </div>
        </div>

        {/* Narrator Banner */}
        <div className="flex-1 mx-6 bg-slate-950/80 border border-purple-500/30 rounded-xl px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <Sparkles className="w-6 h-6 text-purple-400 shrink-0 animate-pulse" />
            <motion.p
              key={narratorMessage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-base md:text-lg font-medium text-slate-100 truncate"
            >
              {narratorMessage}
            </motion.p>
          </div>
          <button
            onClick={() => {
              const nextState = !isVoiceEnabled;
              setIsVoiceEnabled(nextState);
              if (nextState) {
                speakArabicNarrator("تم تفعيل الراوي الصوتي");
              } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
            }}
            title={isVoiceEnabled ? "تعطيل الراوي الصوتي" : "تفعيل الراوي الصوتي"}
            className="shrink-0 p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-purple-400 text-slate-300 hover:text-white transition-colors"
          >
            {isVoiceEnabled ? (
              <Volume2 className="w-5 h-5 text-purple-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-500" />
            )}
          </button>
        </div>

        {/* Room Code + QR */}
        <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <div className="text-left">
            <span className="text-[11px] text-slate-400 block">رمز الغرفة</span>
            <span className="text-lg font-black tracking-widest text-emerald-400">
              {gameState.roomId}
            </span>
          </div>
          <div className="bg-white p-1 rounded-lg">
            <QRCodeSVG value={joinUrl} size={42} />
          </div>
        </div>
      </header>

      {/* Board Grid (7x5) */}
      <main className="h-[60vh] my-1 grid grid-cols-7 grid-rows-5 gap-2.5 relative">
        {gameState.tiles.map((tile) => {
          const pos = getTileGridPosition(tile.index);
          const style = TILE_STYLES[tile.tileType] || TILE_STYLES.RESOURCE;

          const playersHere = Object.values(gameState.players).filter(
            (p) => (visualPositions[p.id] ?? p.position) === tile.index
          );

          const owner = tile.ownerId ? gameState.players[tile.ownerId] : null;

          return (
            <div
              key={tile.index}
              style={{
                gridRow: pos.row,
                gridColumn: pos.col,
                borderColor: owner ? owner.color : undefined
              }}
              className={`relative rounded-2xl border-2 ${style.bg} ${
                owner ? "shadow-lg shadow-black/60 ring-1 ring-white/20" : style.border
              } p-2 flex flex-col justify-between transition-all shadow-md overflow-hidden`}
            >
              {/* Owner Top Strip */}
              {owner && (
                <div
                  style={{ backgroundColor: owner.color }}
                  className="absolute top-0 inset-x-0 h-1.5 z-10"
                />
              )}

              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-black/40 text-slate-300">
                  #{tile.index} · {style.badge}
                </span>
                {owner ? (
                  <span
                    style={{ backgroundColor: owner.color }}
                    className="text-[10px] font-black px-1.5 py-0.5 rounded text-slate-950 flex items-center gap-0.5 shadow"
                  >
                    👑 {owner.name}
                  </span>
                ) : (
                  style.icon
                )}
              </div>

              <div className="my-auto text-center z-10">
                <h3 className="text-sm md:text-base font-extrabold leading-snug text-white line-clamp-2">
                  {tile.name}
                </h3>
                {tile.defaultEffect && (
                  <span
                    className={`text-xs font-bold mt-0.5 inline-block ${
                      tile.defaultEffect.value >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {tile.defaultEffect.value >= 0 ? "+" : ""}
                    {tile.defaultEffect.value} {gameState.currencyName}
                  </span>
                )}

                {/* Property & Rent Display */}
                {tile.price !== undefined && (
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-amber-300 mt-0.5">
                    <span>🏷️ {tile.price}</span>
                    {tile.rent !== undefined && <span>🏠 {tile.rent}</span>}
                  </div>
                )}

                {/* Armies / Territory Display */}
                {tile.armies !== undefined && (
                  <div className="text-[10px] font-black text-cyan-300 mt-0.5 flex items-center justify-center gap-1">
                    <span>🛡️ {tile.armies} جيش</span>
                  </div>
                )}

                {/* Snakes & Ladders Jump Display */}
                {tile.jumpToIndex !== undefined && (
                  <div
                    className={`text-[10px] font-extrabold mt-0.5 ${
                      tile.jumpToIndex > tile.index
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }`}
                  >
                    {tile.jumpToIndex > tile.index
                      ? `🪜 سلم إلى #${tile.jumpToIndex}`
                      : `🐍 ثعبان إلى #${tile.jumpToIndex}`}
                  </div>
                )}
              </div>

              <div className="h-8 flex items-center justify-center gap-1.5 z-20">
                {playersHere.map((player) => (
                  <motion.div
                    key={player.id}
                    layoutId={`player-token-${player.id}`}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 22
                    }}
                    style={{ backgroundColor: player.color }}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center font-black text-xs text-slate-950 relative"
                  >
                    {player.name.slice(0, 2)}
                    {player.hasShield && (
                      <Shield className="w-3.5 h-3.5 text-cyan-300 fill-cyan-500 absolute -top-1.5 -right-1.5" />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Center Stage */}
        <div
          style={{ gridColumn: "2 / span 5", gridRow: "2 / span 3" }}
          className="bg-slate-900/70 backdrop-blur-md rounded-3xl border border-slate-800/80 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-inner"
        >
          <AnimatePresence mode="wait">
            {activeCardModal ? (
              <motion.div
                key={activeCardModal.id}
                initial={{ scale: 0.7, opacity: 0, rotate: -3 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="max-w-lg w-full bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-amber-400 rounded-3xl p-6 text-center shadow-2xl"
              >
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 text-amber-300">
                  {activeCardModal.category === "VOTE_CARD"
                    ? "🗳️ تصويت جماعي (15 ثانية)"
                    : "⚡ بطاقة الذكاء الاصطناعي"}
                </span>
                <h2 className="text-2xl font-black text-white mt-3 mb-2">
                  {activeCardModal.title}
                </h2>
                <p className="text-slate-300 text-base leading-relaxed mb-4">
                  {activeCardModal.flavorText}
                </p>
                {activeCardModal.category !== "VOTE_CARD" && (
                  <button
                    onClick={() => setActiveCardModal(null)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shadow-sm"
                  >
                    <FastForward className="w-3.5 h-3.5 text-amber-400" />
                    تخطي العرض
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="action-stage"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center text-center"
              >
                {/* Dynamically render center icon and message based on turnMechanism */}
                {gameState.rulesConfig?.turnMechanism === "TERRITORY_COMMAND" ? (
                  <>
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-600 to-amber-600 text-white flex items-center justify-center shadow-2xl mb-4 border-4 border-amber-300/60"
                    >
                      <Shield className="w-12 h-12" />
                    </motion.div>
                    <h2 className="text-xl font-black text-slate-100">
                      غرفة العمليات العسكرية: دور{" "}
                      <span style={{ color: activePlayer?.color }}>
                        {activePlayer?.name}
                      </span>
                    </h2>
                    <p className="text-sm text-amber-300/80 mt-1">
                      اختر إقليماً للهجوم أو السيطرة من هاتفك
                    </p>
                  </>
                ) : gameState.rulesConfig?.turnMechanism === "CARD_PLAY_ONLY" ? (
                  <>
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-2xl mb-4 border-4 border-indigo-300/60"
                    >
                      <Layers className="w-12 h-12" />
                    </motion.div>
                    <h2 className="text-xl font-black text-slate-100">
                      معركة الأوراق التكتيكية: دور{" "}
                      <span style={{ color: activePlayer?.color }}>
                        {activePlayer?.name}
                      </span>
                    </h2>
                    <p className="text-sm text-indigo-300/80 mt-1">
                      العب ورقة من يدك للتأثير على مجريات اللعبة
                    </p>
                  </>
                ) : gameState.rulesConfig?.turnMechanism === "SOCIAL_DISCUSSION_VOTE" ? (
                  <>
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white flex items-center justify-center shadow-2xl mb-4 border-4 border-cyan-300/60"
                    >
                      <Vote className="w-12 h-12" />
                    </motion.div>
                    <h2 className="text-xl font-black text-slate-100">
                      مجلس الحوار والتصويت: دور{" "}
                      <span style={{ color: activePlayer?.color }}>
                        {activePlayer?.name}
                      </span>
                    </h2>
                    <p className="text-sm text-cyan-300/80 mt-1">
                      تناقشوا بصوت عالٍ واكشفوا المندسين!
                    </p>
                  </>
                ) : (
                  <>
                    <motion.div
                      key={displayedDice}
                      initial={{ rotate: -180, scale: 0.5 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shadow-2xl mb-4 border-4 border-white"
                    >
                      {displayedDice ? (
                        <span className="text-5xl font-black">{displayedDice}</span>
                      ) : (
                        <Dices className="w-12 h-12" />
                      )}
                    </motion.div>
                    <h2 className="text-xl font-bold text-slate-200">
                      دور{" "}
                      <span style={{ color: activePlayer?.color }}>
                        {activePlayer?.name}
                      </span>{" "}
                      للعب من جواله!
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      اسحب النرد للأعلى على شاشة جوالك
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Player Docks */}
      <footer className="h-[16vh] grid grid-cols-4 gap-4">
        {Object.values(gameState.players).map((player) => {
          const isTurn = player.id === activePlayerId;

          return (
            <div
              key={player.id}
              style={{
                borderColor: isTurn ? player.color : "rgba(51, 65, 85, 0.6)"
              }}
              className={`rounded-2xl bg-slate-900/90 border-2 p-3.5 flex items-center justify-between transition-all ${
                isTurn ? "scale-[1.02] shadow-lg bg-slate-800/90" : "opacity-85"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: player.color }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-950 font-black text-lg shadow-md relative"
                >
                  {player.name.slice(0, 2)}
                  <span
                    className={`w-3 h-3 rounded-full border-2 border-slate-900 absolute -bottom-1 -left-1 ${
                      player.isConnected ? "bg-emerald-400" : "bg-rose-500"
                    }`}
                  />
                </div>
                <div>
                  <div className="font-bold text-base flex items-center gap-1.5">
                    {player.name}
                    {player.hasShield && (
                      <Shield className="w-4 h-4 text-cyan-400 fill-cyan-400/30" />
                    )}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span>المربع #{player.position}</span>
                    {player.userId && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                        DNA 🧠
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-left">
                <div className="text-xl font-black text-amber-400 flex items-center justify-end gap-1">
                  <span>{player.coins}</span>
                  <Coins className="w-4 h-4" />
                </div>
                <div className="text-xs text-indigo-300 flex items-center justify-end gap-1 mt-1">
                  <span>
                    {(player as any).secretHandCount ??
                      player.secretHand?.length ??
                      0}{" "}
                    بطاقات
                  </span>
                  <Layers className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </footer>

      {/* Floating Reaction Emojis Physics Container */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {floatingReactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 0, scale: 0.4, x: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -380,
                scale: [0.4, 1.4, 1.1],
                x: [0, 15, -15, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: "easeOut" }}
              style={{
                position: "absolute",
                bottom: "16%",
                left: `${r.startX}%`
              }}
              className="flex flex-col items-center filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)]"
            >
              <span className="text-5xl select-none">{r.emoji}</span>
              <span
                style={{ backgroundColor: r.playerColor }}
                className="mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black text-slate-950 shadow-lg"
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
