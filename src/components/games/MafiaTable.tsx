"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Moon, Menu, QrCode, Skull, Sun, Timer, Vote } from "lucide-react";
import type { GameTableProps } from "./types";
import GameRulesSheet from "./GameRulesSheet";
import { TableStat } from "./shared";
import type { MafiaRole } from "@/game/gameRoom";
import { getPlayerInitial, getPlayerInitials } from "@/utils/playerDisplay";

const ROLE_LABEL: Record<MafiaRole, string> = {
  MAFIA: "مافيا",
  DETECTIVE: "محقق",
  CITIZEN: "مواطن"
};

const PHASE_META: Record<
  string,
  { titleAr: string; hintAr: string; icon: React.ReactNode; background: string; accent: string }
> = {
  ROLE_REVEAL: {
    titleAr: "توزيع الأدوار",
    hintAr: "كل لاعب يفحص دوره على جواله سراً",
    icon: <Eye className="w-5 h-5" />,
    background: "radial-gradient(ellipse at 50% 40%, #1f1b4d 0%, #0d0b23 50%, #04030a 100%)",
    accent: "text-indigo-300"
  },
  NIGHT: {
    titleAr: "الليل",
    hintAr: "المافيا تختار ضحيتها والمحقق يتحرى",
    icon: <Moon className="w-5 h-5" />,
    background: "radial-gradient(ellipse at 50% 30%, #122b4d 0%, #071322 50%, #02060b 100%)",
    accent: "text-sky-300"
  },
  DAY: {
    titleAr: "النقاش",
    hintAr: "اتهموا ودافعوا بصوت عالٍ",
    icon: <Sun className="w-5 h-5" />,
    background: "radial-gradient(ellipse at 50% 30%, #4a3410 0%, #241804 50%, #0a0602 100%)",
    accent: "text-amber-300"
  },
  VOTE: {
    titleAr: "التصويت",
    hintAr: "صوّتوا لإقصاء المشتبه به",
    icon: <Vote className="w-5 h-5" />,
    background: "radial-gradient(ellipse at 50% 30%, #4a1230 0%, #22081a 50%, #080206 100%)",
    accent: "text-rose-300"
  },
  RESOLUTION: {
    titleAr: "الحكم",
    hintAr: "الطاولة تنتظر النتيجة",
    icon: <Skull className="w-5 h-5" />,
    background: "radial-gradient(ellipse at 50% 30%, #3a2a12 0%, #1a1207 50%, #060402 100%)",
    accent: "text-orange-300"
  }
};

function useCountdown(deadline?: number) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!deadline) {
      setRemaining(0);
      return;
    }
    const update = () => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [deadline]);

  return remaining;
}

export default function MafiaTable({
  gameState,
  sendAction,
  isSpectator,
  onOpenInvite,
  onOpenMenu
}: GameTableProps) {
  const mafia = gameState.mafiaState;
  const phase = mafia?.phase || "ROLE_REVEAL";
  const meta = PHASE_META[phase] || PHASE_META.ROLE_REVEAL;
  const remaining = useCountdown(mafia?.deadline);
  const players = Object.values(gameState.players);
  const alive = players.filter((player) => !player.isEliminated);
  const eliminated = mafia?.eliminated || [];
  const totalSeconds = Math.max(1, Math.round((mafia?.phaseDurationMs || 1) / 1000));
  const progress = Math.max(0, Math.min(1, remaining / totalSeconds));

  return (
    <div
      dir="rtl"
      className="relative w-full h-full flex flex-col text-white overflow-hidden select-none transition-[background] duration-1000"
      style={{ background: meta.background }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.04]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.85)_100%)]" />

      <header className="relative z-30 flex items-center justify-between gap-2 px-3 md:px-5 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMenu}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 border border-white/15 backdrop-blur-md"
            title="القائمة"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 border border-white/15 backdrop-blur-md text-[11px] font-black ${meta.accent}`}>
            {meta.icon}
            {meta.titleAr}
          </div>
          <TableStat label="اليوم" value={mafia?.day || 1} accent={meta.accent} />
          <TableStat label="أحياء" value={`${alive.length}/${players.length}`} accent="text-white" />
        </div>

        <div className="text-center leading-tight">
          <h1 className="text-sm md:text-base font-black tracking-wide">{gameState.themeTitle || "مجلس المافيا والجاسوس"}</h1>
          <p className="text-[10px] text-white/40 font-bold">{meta.hintAr}</p>
        </div>

        <div className="flex items-center gap-2">
          <GameRulesSheet rulebookId="MAFIA" variant="ghost" label="قوانين" />
          <button
            onClick={onOpenInvite}
            className="px-2.5 py-1 rounded-full bg-black/50 border border-cyan-400/30 text-cyan-300 hover:bg-black/70 text-[11px] font-mono font-bold flex items-center gap-1"
          >
            <QrCode className="w-3.5 h-3.5" />
            {gameState.roomId}
          </button>
        </div>
      </header>

      <div className="relative z-20 flex-1 min-h-0 flex flex-col md:flex-row gap-3 px-3 md:px-5 py-2">
        {/* دائرة الأحياء */}
        <main className="relative flex-1 min-h-0 flex flex-col items-center justify-center gap-4 overflow-hidden">
          {/* طاولة التحقيق الدائرية في الخلفية */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-[min(70vw,620px)] aspect-square rounded-full border border-white/[0.06] bg-white/[0.015]" />
            <div className="absolute w-[min(52vw,460px)] aspect-square rounded-full border border-white/[0.05]" />
            <div className="absolute w-[min(34vw,300px)] aspect-square rounded-full bg-white/[0.02] blur-2xl" />
          </div>

          <div className="relative w-full max-w-3xl">
            <div className="flex flex-wrap items-stretch justify-center gap-2 md:gap-4">
              <AnimatePresence>
                {players.map((player) => {
                  const isDead = player.isEliminated;
                  const voted = mafia?.votedBy?.includes(player.id);
                  const isActiveVoter = phase === "VOTE" && !isDead;
                  return (
                    <motion.div
                      layout
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: isDead ? 0.35 : 1, scale: 1 }}
                      className={`relative w-[calc(33.333%-8px)] sm:w-32 md:w-36 rounded-2xl border p-3 md:p-4 flex flex-col items-center gap-1.5 transition ${
                        isDead
                          ? "border-white/10 bg-black/50 grayscale"
                          : "border-white/15 bg-black/35 backdrop-blur-sm"
                      }`}
                    >
                      <div
                        style={{ backgroundColor: player.color }}
                        className="w-14 h-14 rounded-full border-2 border-white/70 flex items-center justify-center text-sm font-black text-slate-950 relative shadow-[0_10px_25px_rgba(0,0,0,0.5)]"
                      >
                        {getPlayerInitials(player.name)}
                        {isDead && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full text-rose-400 text-lg">
                            ✕
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] md:text-xs font-black truncate max-w-full">{player.name}</span>
                      {isDead ? (
                        <span className="text-[9px] font-bold text-rose-300">مُقصى</span>
                      ) : (
                        <span className="text-[9px] font-bold text-white/40">
                          {isActiveVoter ? (voted ? "صوّت ✓" : "لم يصوّت…") : "على الطاولة"}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* المؤقت */}
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/45 backdrop-blur-md p-3 flex items-center gap-3">
            <div className={`relative w-12 h-12 shrink-0 ${meta.accent}`}>
              <svg viewBox="0 0 44 44" className="w-12 h-12 -rotate-90">
                <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                <circle
                  cx="22"
                  cy="22"
                  r="19"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 19}
                  strokeDashoffset={2 * Math.PI * 19 * (1 - progress)}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[13px] font-black text-white">
                {remaining}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-black flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" />
                {mafia?.lastSummary || "بانتظار انطلاق الجلسة…"}
              </div>
              <div className="text-[9px] text-white/40 font-bold mt-0.5">
                {phase === "NIGHT" && "الأدوار الليلية تُنفّذ من الجوال — لا تعلّق على ما تراه."}
                {phase === "DAY" && "تكلّموا الآن: من تناقض كلامه؟"}
                {phase === "VOTE" && `${mafia?.votesCount || 0} من ${alive.length} صوّتوا.`}
                {phase === "RESOLUTION" && "استعدوا لكشف الحقيقة."}
                {phase === "ROLE_REVEAL" && "لا تُظهر شاشتك لأحد!"}
              </div>
            </div>
          </div>
        </main>

        {/* سجل الإقصاءات */}
        <aside className="md:w-60 shrink-0 flex flex-row md:flex-col md:justify-center gap-2 overflow-x-auto md:overflow-visible">
          <div className="rounded-2xl border border-rose-400/25 bg-black/45 p-2.5 min-w-[200px]">
            <div className="text-[10px] font-black text-rose-300 mb-1.5 flex items-center gap-1">
              <Skull className="w-3.5 h-3.5" /> سجل الإقصاءات
            </div>
            {eliminated.length === 0 ? (
              <p className="text-[10px] text-white/40">لم يُقصَ أحد بعد.</p>
            ) : (
              <div className="space-y-1.5">
                {eliminated.map((entry, index) => (
                  <div key={`${entry.playerId}-${index}`} className="flex items-center justify-between text-[10px] font-bold">
                    <span className="truncate">{gameState.players[entry.playerId]?.name || entry.playerId}</span>
                    <span className={entry.role === "MAFIA" ? "text-rose-300" : "text-emerald-300"}>
                      {ROLE_LABEL[entry.role]} · {entry.reason === "NIGHT" ? "ليل" : "تصويت"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/35 p-2.5 min-w-[200px]">
            <div className="text-[10px] font-black text-white/50 mb-1">قواعد سريعة</div>
            <ul className="text-[10px] leading-5 text-white/60 space-y-0.5">
              <li>• المافيا تفوز عند تعادل الأعداد.</li>
              <li>• المواطنون يفوزون بإقصاء كل المافيا.</li>
              <li>• التعادل في التصويت = لا إقصاء.</li>
            </ul>
          </div>

          <button
            onClick={() => sendAction({ type: "ADVANCE_MAFIA_PHASE" })}
            className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[10px] font-black text-amber-200 hover:bg-amber-500/20 transition min-w-[200px]"
            title="تخطي المرحلة (للمضيف)"
          >
            ⏭️ تخطي المرحلة الحالية
          </button>
        </aside>
      </div>

      <footer className="relative z-20 flex items-center justify-between gap-2 px-3 md:px-5 pb-2">
        <div className="flex items-center gap-1.5">
          {alive.slice(0, 8).map((player) => (
            <span
              key={player.id}
              style={{ backgroundColor: player.color }}
              className="w-5 h-5 rounded-full border border-white/60 flex items-center justify-center text-[8px] font-black text-slate-950"
              title={player.name}
            >
              {getPlayerInitial(player.name)}
            </span>
          ))}
        </div>
        <span className={`text-[11px] font-black flex items-center gap-1.5 ${meta.accent}`}>
          {meta.icon}
          {meta.titleAr}
        </span>
        <span className="hidden sm:block text-[10px] text-white/35 font-bold">
          {isSpectator ? "وضع المتفرج" : "الأدوار سرية على الجوالات · الشاشة للعرض العام"}
        </span>
      </footer>
    </div>
  );
}
