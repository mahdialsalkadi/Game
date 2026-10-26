"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Moon, Search, Skull, Sun, UserX, Vote } from "lucide-react";
import type { FullRoomState, MafiaRole } from "@/game/gameRoom";
import GameRulesSheet from "@/components/games/GameRulesSheet";
import { sfx } from "@/utils/soundEffects";
import { getPlayerInitial, getPlayerInitials } from "@/utils/playerDisplay";

const ROLE_META: Record<
  MafiaRole,
  { label: string; icon: string; color: string; border: string; briefAr: string }
> = {
  MAFIA: {
    label: "المافيا",
    icon: "🕵️‍♂️",
    color: "text-rose-300",
    border: "border-rose-500/50",
    briefAr: "ليلاً اختر ضحية واحدة. نهاراً تظاهر بالبراءة ووجّه الشك بعيداً عنك."
  },
  DETECTIVE: {
    label: "المحقق",
    icon: "🔎",
    color: "text-emerald-300",
    border: "border-emerald-500/50",
    briefAr: "ليلاً تحقّق من لاعب واحد لتعرف إن كان مافيا. لا تكشف نفسك بسرعة."
  },
  CITIZEN: {
    label: "مواطن",
    icon: "🧑‍🌾",
    color: "text-sky-300",
    border: "border-sky-500/50",
    briefAr: "لا حركة ليلية. راقب التصويتات والتناقضات واتهم بحكمة نهاراً."
  }
};

function useCountdown(deadline?: number) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!deadline) return setRemaining(0);
    const update = () => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [deadline]);
  return remaining;
}

export interface MafiaPlayerControllerProps {
  gameState: FullRoomState;
  playerId: string;
  sendAction: (payload: Record<string, unknown>) => void;
  errorToast?: string | null;
}

export default function MafiaPlayerController({
  gameState,
  playerId,
  sendAction,
  errorToast
}: MafiaPlayerControllerProps) {
  const mafia = gameState.mafiaState;
  const me = gameState.players[playerId];
  const myRole: MafiaRole | undefined = mafia?.myRole;
  const role = myRole ? ROLE_META[myRole] : null;
  const [revealed, setRevealed] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const remaining = useCountdown(mafia?.deadline);
  const alive = Object.values(gameState.players).filter((player) => !player.isEliminated);
  const wasEliminated = Boolean(me?.isEliminated);
  const voted = mafia?.votedBy?.includes(playerId);
  const detective = mafia?.detectiveResult;
  const phase = mafia?.phase || "ROLE_REVEAL";

  const phaseMeta: Record<string, { label: string; icon: React.ReactNode; color: string; hint: string }> = {
    ROLE_REVEAL: { label: "توزيع الأدوار", icon: <Eye className="w-4 h-4" />, color: "text-indigo-300", hint: "لا تُظهر شاشتك لأحد!" },
    NIGHT: { label: "الليل", icon: <Moon className="w-4 h-4" />, color: "text-sky-300", hint: "نفّذ حركتك السرية الآن." },
    DAY: { label: "النقاش", icon: <Sun className="w-4 h-4" />, color: "text-amber-300", hint: "تكلّم، راقب، واتهم." },
    VOTE: { label: "التصويت", icon: <Vote className="w-4 h-4" />, color: "text-rose-300", hint: "صوّت لإقصاء المشتبه به." },
    RESOLUTION: { label: "الحكم", icon: <Skull className="w-4 h-4" />, color: "text-orange-300", hint: "النتيجة تُعلن الآن." }
  };
  const meta = phaseMeta[phase] || phaseMeta.ROLE_REVEAL;

  return (
    <div dir="rtl" className="min-h-[100dvh] w-full bg-[#060a12] text-white flex flex-col overflow-y-auto">
      <header className="px-4 pt-3 pb-2 border-b border-cyan-500/20 bg-gradient-to-b from-cyan-950/40 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              style={{ backgroundColor: me?.color }}
              className="w-9 h-9 rounded-xl border border-white/60 flex items-center justify-center text-xs font-black text-slate-950"
            >
              {getPlayerInitials(me?.name)}
            </span>
            <div>
              <div className="text-sm font-black leading-tight">{me?.name}</div>
              <div className="text-[10px] font-bold text-cyan-300/70">
                يوم {mafia?.day || 1} · {meta.label}
              </div>
            </div>
          </div>
          <GameRulesSheet rulebookId="MAFIA" variant="ghost" label="القوانين" />
        </div>

        <div className={`mt-2 flex items-center justify-between rounded-xl border border-cyan-500/25 bg-black/40 px-3 py-1.5 text-[11px] font-black ${meta.color}`}>
          <span className="flex items-center gap-1.5">{meta.icon} {meta.hint}</span>
          <span className="font-mono text-white/80">{remaining}s</span>
        </div>
      </header>

      {errorToast && (
        <div className="mx-3 mt-2 rounded-xl bg-rose-950/80 border border-rose-500/50 px-3 py-2 text-[11px] font-bold text-rose-200 text-center">
          {errorToast}
        </div>
      )}

      {mafia?.lastSummary && (
        <div className="mx-3 mt-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 px-3 py-2 text-[11px] font-bold text-cyan-100 text-center leading-5">
          {mafia.lastSummary}
        </div>
      )}

      {wasEliminated ? (
        <main className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto">
          <div className="flex flex-col items-center justify-center gap-2 text-center py-6">
            <UserX className="w-12 h-12 text-rose-400" />
            <h2 className="text-lg font-black text-rose-200">أنت خارج الطاولة</h2>
            <p className="text-xs text-white/50 leading-6">
              دورك السابق: <span className="font-black text-white/80">{role?.label || "—"}</span>
              . استمر في المراقبة — يمكنك متابعة النقاش والتصويتات من هنا أو من شاشة التلفزيون.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-3 flex items-center justify-between text-[11px] font-black">
            <span className={meta.color}>المرحلة: {meta.label}</span>
            <span className="text-white/60">{alive.length} لاعبين على الطاولة</span>
            <span className="font-mono text-white/50">{remaining}s</span>
          </div>

          <section className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <h3 className="text-[10px] font-black text-white/50 mb-1.5">المتبقون على الطاولة</h3>
            <div className="flex flex-wrap gap-1">
              {alive.map((player) => (
                <span
                  key={player.id}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/50 border border-white/10 flex items-center gap-1"
                >
                  <span
                    style={{ backgroundColor: player.color }}
                    className="w-2 h-2 rounded-full inline-block"
                  />
                  {player.name}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <h3 className="text-[10px] font-black text-white/50 mb-1.5">سجل الإقصاءات</h3>
            {(mafia?.eliminated || []).length === 0 ? (
              <p className="text-[10px] text-white/30">لا إقصاءات بعد.</p>
            ) : (
              <div className="space-y-1">
                {(mafia?.eliminated || []).map((entry, index) => (
                  <div
                    key={`dead-${entry.playerId}-${index}`}
                    className="flex items-center justify-between text-[10px] font-bold rounded-lg bg-black/40 px-2 py-1.5"
                  >
                    <span className="text-white/70">
                      {gameState.players[entry.playerId]?.name || entry.playerId}
                    </span>
                    <span className="text-white/40">
                      {entry.reason === "NIGHT" ? "🌙 ليلاً" : "🗳️ تصويت"} · يوم {entry.day}
                    </span>
                    <span className={entry.role === "MAFIA" ? "text-rose-300" : "text-emerald-300"}>
                      {entry.role === "MAFIA" ? "مافيا" : entry.role === "DETECTIVE" ? "محقق" : "مواطن"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <p className="text-[10px] text-center text-white/30 font-bold">
            🎥 وضع المشاهدة — الأدوار السرية للاعبين الأحياء تبقى مخفية حتى نهاية الجلسة.
          </p>
        </main>
      ) : (
        <main className="flex-1 flex flex-col gap-3 p-3">
          {/* بطاقة الدور */}
          {role && (
            <div className={`relative rounded-2xl border-2 ${role.border} bg-black/40 overflow-hidden`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(6,182,212,0.18),transparent_60%)]" />
              <div className="relative p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-white/40">بطاقة دورك السرية</span>
                  <button
                    onClick={() => setRevealed((prev) => !prev)}
                    className="text-[10px] font-black px-2 py-1 rounded-lg bg-white/10 flex items-center gap-1"
                  >
                    {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {revealed ? "إخفاء" : "اكشف"}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {revealed ? (
                    <motion.div
                      key="revealed"
                      initial={{ opacity: 0, rotateY: -80 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      exit={{ opacity: 0, rotateY: 80 }}
                      className="mt-2 flex items-center gap-3"
                    >
                      <span className="text-3xl">{role.icon}</span>
                      <div>
                        <div className={`text-lg font-black ${role.color}`}>{role.label}</div>
                        <p className="text-[10px] leading-5 text-white/60 font-bold">{role.briefAr}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 flex items-center justify-center py-3"
                    >
                      <span className="text-[11px] font-black text-white/30">🤫 اضغط «اكشف» في مكان لا يراك فيه أحد</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* إجراءات الليل */}
          {phase === "NIGHT" && (
            <section className="rounded-2xl border border-sky-500/25 bg-sky-950/20 p-3">
              <h3 className="text-[11px] font-black text-sky-300 mb-2 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                {myRole === "MAFIA"
                  ? "اختر ضحية الليلة"
                  : myRole === "DETECTIVE"
                  ? "اختر لاعباً لتحقيق"
                  : "لا حركة ليلية لدورك"}
              </h3>

              {myRole === "MAFIA" && (mafia?.myMafiaAllies?.length || 0) > 0 && (
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[9px] font-black text-rose-300/80">عصابتك:</span>
                  {(mafia?.myMafiaAllies || []).map((allyId) => (
                    <span key={allyId} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-200">
                      {gameState.players[allyId]?.name}
                    </span>
                  ))}
                </div>
              )}

              {myRole === "MAFIA" || myRole === "DETECTIVE" ? (
                <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto">
                  {alive
                    .filter((player) => player.id !== playerId)
                    .filter(
                      (player) =>
                        myRole !== "MAFIA" || !(mafia?.myMafiaAllies || []).includes(player.id)
                    )
                    .map((player) => (
                      <button
                        key={player.id}
                        disabled={selectedTarget === player.id}
                        onClick={() => {
                          setSelectedTarget(player.id);
                          sfx.playCardSlap();
                          sendAction({
                            type: "MAFIA_NIGHT_ACTION",
                            targetId: player.id
                          });
                        }}
                        className={`rounded-xl border px-2 py-2 text-[11px] font-black flex items-center gap-1.5 transition ${
                          selectedTarget === player.id
                            ? "border-sky-400 bg-sky-500/20"
                            : "border-white/10 bg-black/40 hover:border-sky-400/50"
                        }`}
                      >
                        <span style={{ backgroundColor: player.color }} className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-slate-950">
                          {getPlayerInitial(player.name)}
                        </span>
                        <span className="truncate">{player.name}</span>
                      </button>
                    ))}
                </div>
              ) : (
                <p className="text-[10px] text-white/40 font-bold">استعد للنقاش: من كان غائباً عن الأنظار؟</p>
              )}

              {myRole === "DETECTIVE" && detective && (
                <div
                  className={`mt-2 rounded-xl px-3 py-2 text-[11px] font-black border ${
                    detective.isMafia
                      ? "bg-rose-500/15 border-rose-400/40 text-rose-200"
                      : "bg-emerald-500/15 border-emerald-400/40 text-emerald-200"
                  }`}
                >
                  نتيجة التحقيق: {gameState.players[detective.targetId]?.name} —{" "}
                  {detective.isMafia ? "مافيا! 🚨" : "ليس مافيا ✅"}
                </div>
              )}

              {selectedTarget && (
                <p className="mt-2 text-[10px] font-bold text-sky-300/70">تم تسجيل أمرك. لا يمكنك التغيير لاحقاً.</p>
              )}
            </section>
          )}

          {/* النقاش */}
          {phase === "DAY" && (
            <section className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-3">
              <h3 className="text-[11px] font-black text-amber-300 mb-1">🗣️ وقت النقاش</h3>
              <p className="text-[10px] leading-5 text-white/60 font-bold">
                كل لاعب يشرح موقفه. راقب من يتهم بلا دليل، ومن يدافع بشراسة عن شخص بعينه.
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {alive.map((player) => (
                  <span key={player.id} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/40 border border-white/10">
                    {player.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* التصويت */}
          {phase === "VOTE" && (
            <section className="rounded-2xl border border-rose-500/25 bg-rose-950/20 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-black text-rose-300 flex items-center gap-1.5">
                  <Vote className="w-3.5 h-3.5" /> صوّت للإقصاء
                </h3>
                <span className="text-[9px] font-bold text-white/40">
                  {mafia?.votesCount || 0}/{alive.length} صوّتوا
                </span>
              </div>

              {voted ? (
                <div className="rounded-xl bg-emerald-500/15 border border-emerald-400/40 px-3 py-2 text-[11px] font-black text-emerald-200">
                  ✅ تم تسجيل صوتك. انتظر بقية الطاولة.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {alive
                    .filter((player) => player.id !== playerId)
                    .map((player) => (
                      <button
                        key={player.id}
                        onClick={() => {
                          sfx.playCardPlay();
                          sendAction({ type: "MAFIA_VOTE", targetPlayerId: player.id });
                        }}
                        className="rounded-xl border border-white/10 bg-black/40 hover:border-rose-400 hover:bg-rose-500/10 px-2 py-2 text-[11px] font-black flex items-center gap-1.5"
                      >
                        <span style={{ backgroundColor: player.color }} className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-slate-950">
                          {getPlayerInitial(player.name)}
                        </span>
                        <span className="truncate">{player.name}</span>
                      </button>
                    ))}
                </div>
              )}
            </section>
          )}

          {/* سجل الإقصاءات */}
          <section className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <h3 className="text-[10px] font-black text-white/50 mb-1.5">سجل الطاولة</h3>
            {(mafia?.eliminated || []).length === 0 ? (
              <p className="text-[10px] text-white/30">لا إقصاءات بعد.</p>
            ) : (
              <div className="space-y-1">
                {mafia!.eliminated.map((entry, index) => (
                  <div key={`${entry.playerId}-${index}`} className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-white/60">{gameState.players[entry.playerId]?.name}</span>
                    <span className={entry.role === "MAFIA" ? "text-rose-300" : "text-emerald-300"}>
                      {entry.role === "MAFIA" ? "مافيا" : entry.role === "DETECTIVE" ? "محقق" : "مواطن"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
}
