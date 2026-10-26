"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, X, Target, ListOrdered, Trophy, Lightbulb, AlertTriangle, Layers } from "lucide-react";
import { getRulebook, type RulebookId } from "@/game/rulebooks";

const ACCENTS: Record<RulebookId, { ring: string; chip: string; glow: string; accentText: string }> = {
  MONOPOLY: {
    ring: "border-amber-500/60",
    chip: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    glow: "shadow-[0_30px_80px_rgba(245,158,11,0.18)]",
    accentText: "text-amber-300"
  },
  LUDO: {
    ring: "border-sky-500/60",
    chip: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    glow: "shadow-[0_30px_80px_rgba(56,189,248,0.18)]",
    accentText: "text-sky-300"
  },
  UNO: {
    ring: "border-emerald-500/60",
    chip: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    glow: "shadow-[0_30px_80px_rgba(16,185,129,0.18)]",
    accentText: "text-emerald-300"
  },
  SNAKES_AND_LADDERS: {
    ring: "border-fuchsia-500/60",
    chip: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
    glow: "shadow-[0_30px_80px_rgba(217,70,239,0.18)]",
    accentText: "text-fuchsia-300"
  },
  RISK: {
    ring: "border-rose-500/60",
    chip: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    glow: "shadow-[0_30px_80px_rgba(244,63,94,0.18)]",
    accentText: "text-rose-300"
  },
  MAFIA: {
    ring: "border-cyan-500/60",
    chip: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    glow: "shadow-[0_30px_80px_rgba(6,182,212,0.18)]",
    accentText: "text-cyan-300"
  },
  CONNECT_FOUR: {
    ring: "border-blue-500/60",
    chip: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    glow: "shadow-[0_30px_80px_rgba(59,130,246,0.18)]",
    accentText: "text-blue-300"
  },
  CHECKERS: {
    ring: "border-stone-400/60",
    chip: "bg-stone-500/15 text-stone-200 border-stone-400/30",
    glow: "shadow-[0_30px_80px_rgba(168,162,158,0.18)]",
    accentText: "text-stone-200"
  },
  BINGO: {
    ring: "border-pink-500/60",
    chip: "bg-pink-500/15 text-pink-300 border-pink-500/30",
    glow: "shadow-[0_30px_80px_rgba(236,72,153,0.18)]",
    accentText: "text-pink-300"
  },
  GENERIC: {
    ring: "border-slate-500/60",
    chip: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    glow: "shadow-[0_30px_80px_rgba(148,163,184,0.18)]",
    accentText: "text-slate-300"
  }
};

const TABS = [
  { id: "goal", label: "الهدف", icon: Target },
  { id: "rules", label: "القوانين", icon: BookOpen },
  { id: "flow", label: "تسلسل الدور", icon: ListOrdered },
  { id: "win", label: "الفوز", icon: Trophy },
  { id: "tips", label: "نصائح", icon: Lightbulb }
] as const;

type TabId = (typeof TABS)[number]["id"];

export function GameRulesSheet({
  rulebookId,
  variant = "button",
  label = "كيف تلعب؟"
}: {
  rulebookId: RulebookId;
  variant?: "button" | "ghost";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabId>("goal");
  const book = getRulebook(rulebookId);
  const accent = ACCENTS[rulebookId] || ACCENTS.GENERIC;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "button"
            ? `px-3 py-1.5 rounded-full border bg-black/40 backdrop-blur-md text-xs font-bold flex items-center gap-1.5 transition hover:bg-black/60 ${accent.chip}`
            : `text-xs font-bold flex items-center gap-1.5 transition ${accent.accentText} hover:brightness-125`
        }
        title={`قوانين ${book.nameAr}`}
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span>{label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/80 backdrop-blur-md"
            dir="rtl"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(event) => event.stopPropagation()}
              className={`w-full max-w-2xl max-h-[88vh] overflow-hidden rounded-3xl border-2 ${accent.ring} bg-[#0b1220] text-white flex flex-col ${accent.glow}`}
            >
              {/* Header */}
              <div className="relative px-5 py-4 border-b border-white/10 bg-gradient-to-l from-white/[0.04] to-transparent">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{book.icon}</span>
                  <div>
                    <h2 className="text-lg font-black leading-tight">
                      {book.nameAr} <span className="text-white/40 text-xs font-bold">/ {book.nameEn}</span>
                    </h2>
                    <p className={`text-[11px] font-bold ${accent.accentText}`}>{book.taglineAr}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 text-[10px] font-bold text-white/70">
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">👥 {book.playersAr}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">⏱️ {book.durationAr}</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-3 pt-3 overflow-x-auto">
                {TABS.map((item) => {
                  const Icon = item.icon;
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 whitespace-nowrap transition ${
                        active ? accent.chip : "bg-white/5 text-white/50 hover:text-white/80"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-right">
                {tab === "goal" && (
                  <>
                    <SectionTitle accent={accent.accentText} title="هدف اللعبة" />
                    <p className="text-sm leading-7 text-white/85">{book.objectiveAr}</p>
                    <SectionTitle accent={accent.accentText} title="محتويات الطاولة" />
                    <ul className="space-y-1.5">
                      {book.componentsAr.map((item) => (
                        <li key={item} className="text-xs text-white/70 flex gap-2">
                          <Layers className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${accent.accentText}`} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <SectionTitle accent={accent.accentText} title="التجهيز قبل البداية" />
                    <ol className="space-y-2">
                      {book.setupAr.map((item, index) => (
                        <li key={item} className="flex gap-2 text-xs text-white/75 leading-6">
                          <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${accent.chip}`}>
                            {index + 1}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ol>
                  </>
                )}

                {tab === "rules" && (
                  <>
                    <SectionTitle accent={accent.accentText} title="ما المسموح في دورك" />
                    <div className="space-y-2">
                      {book.actionsAr.map((step) => (
                        <div key={step.titleAr} className="rounded-2xl bg-white/[0.04] border border-white/10 p-3">
                          <h4 className={`text-xs font-black mb-1 ${accent.accentText}`}>{step.titleAr}</h4>
                          <p className="text-[11px] leading-6 text-white/70">{step.detailAr}</p>
                        </div>
                      ))}
                    </div>
                    {book.mistakesAr.length > 0 && (
                      <>
                        <SectionTitle accent="text-rose-300" title="أخطاء شائعة" />
                        <ul className="space-y-1.5">
                          {book.mistakesAr.map((item) => (
                            <li key={item} className="text-[11px] text-rose-200/80 flex gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </>
                )}

                {tab === "flow" && (
                  <div className="relative border-r border-dashed border-white/15 pr-4 space-y-4">
                    {book.turnFlowAr.map((step, index) => (
                      <div key={step.titleAr} className="relative">
                        <span className={`absolute -right-[22px] top-1 w-3 h-3 rounded-full border-2 border-[#0b1220] ${accent.chip}`} />
                        <h4 className="text-xs font-black text-white">{step.titleAr}</h4>
                        <p className="text-[11px] leading-6 text-white/65 mt-0.5">{step.detailAr}</p>
                        {index < book.turnFlowAr.length - 1 && <span className="sr-only">التالي</span>}
                      </div>
                    ))}
                  </div>
                )}

                {tab === "win" && (
                  <>
                    <SectionTitle accent={accent.accentText} title="طريقة الفوز" />
                    <div className="space-y-2">
                      {book.winAr.map((item) => (
                        <div key={item} className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs leading-6 text-amber-100 flex gap-2">
                          <Trophy className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {tab === "tips" && (
                  <>
                    <SectionTitle accent={accent.accentText} title="نصائح تكتيكية" />
                    <ul className="space-y-2">
                      {book.tipsAr.map((item) => (
                        <li key={item} className="text-xs leading-6 text-white/75 rounded-2xl bg-white/[0.04] border border-white/10 p-3 flex gap-2">
                          <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-white/40 font-bold">
                  قوانين {book.nameAr} — مدمجة في محرك اللعبة
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black"
                >
                  تمام، فهمت
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SectionTitle({ title, accent }: { title: string; accent: string }) {
  return <h3 className={`text-[11px] font-black uppercase tracking-wider ${accent}`}>{title}</h3>;
}

export default GameRulesSheet;
