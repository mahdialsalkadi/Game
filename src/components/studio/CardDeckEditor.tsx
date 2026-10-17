"use client";

import React, { useState } from "react";
import {
  Layers,
  Flame,
  Vote,
  Plus,
  Trash2,
  Edit3,
  X,
  AlertCircle,
  Coins,
  Shield,
  Sparkles,
  Zap,
  Target,
  CheckCircle2
} from "lucide-react";
import type {
  GameCard,
  ActionType,
  TargetType,
  AtomicEffect
} from "@/game/schema";

interface CardDeckEditorProps {
  cards: GameCard[];
  currencyName: string;
  onChangeCards: (cards: GameCard[]) => void;
}

type CardCategory = "SECRET_HAND" | "PUBLIC_DRAMA" | "VOTE_CARD";

const CATEGORY_CONFIG: Record<
  CardCategory,
  {
    label: string;
    description: string;
    badgeBg: string;
    border: string;
    icon: React.ReactNode;
    color: string;
  }
> = {
  SECRET_HAND: {
    label: "بطاقات اليد السرية",
    description: "بطاقات تكتيكية يحتفظ بها اللاعب في هاتفه ويلعبها في دوره",
    badgeBg: "bg-indigo-950/80 border-indigo-500/50 text-indigo-300",
    border: "border-indigo-500/40 hover:border-indigo-400",
    icon: <Layers className="w-4 h-4 text-indigo-400" />,
    color: "from-indigo-600 to-blue-700"
  },
  PUBLIC_DRAMA: {
    label: "أحداث الدراما العامة",
    description: "أحداث علنية تُنفذ فوراً على الشاشة الكبرى عند سحبها",
    badgeBg: "bg-purple-950/80 border-purple-500/50 text-purple-300",
    border: "border-purple-500/40 hover:border-purple-400",
    icon: <Flame className="w-4 h-4 text-purple-400" />,
    color: "from-purple-600 to-pink-700"
  },
  VOTE_CARD: {
    label: "بطاقات التصويت الجماعي",
    description: "أسئلة ومحاكمات يصوت عليها جميع اللاعبين بهواتفهم وتوقع غرامة بالخاسر",
    badgeBg: "bg-cyan-950/80 border-cyan-500/50 text-cyan-300",
    border: "border-cyan-500/40 hover:border-cyan-400",
    icon: <Vote className="w-4 h-4 text-cyan-400" />,
    color: "from-cyan-600 to-teal-700"
  }
};

const ACTION_LABELS: Record<ActionType, { label: string; desc: string }> = {
  MODIFY_COINS: { label: "تعديل رصيد العملات", desc: "إضافة أو خصم عملات مباشرة" },
  STEAL_COINS: { label: "سرقة عملات من الخصم", desc: "خصم من لاعب وإيداع في حسابك" },
  MOVE_STEPS: { label: "تحريك خطوات", desc: "تقدم أو تراجع على المربعات" },
  SWAP_POSITIONS: { label: "تبديل المواقع", desc: "تبديل المربع مع لاعب آخر" },
  SKIP_TURN: { label: "تجميد وتفويت الدور", desc: "تعطيل دور الخصم القادم" },
  GRANT_SHIELD: { label: "منح درع حماية", desc: "صد الهجمة أو الخصم القادم" },
  TAX_PERCENTAGE: { label: "ضريبة نسبة مئوية (%)", desc: "خصم نسبة من ثروة اللاعب" },
  VOTE_PENALTY: { label: "عقوبة الخاسر بالتصويت", desc: "خصم رصيد من يحصل على أعلى تصويت" }
};

const TARGET_LABELS: Record<TargetType, string> = {
  SELF: "اللاعب نفسه (SELF)",
  CHOSEN_PLAYER: "لاعب يختاره بنفسه (CHOSEN_PLAYER)",
  RICHEST_PLAYER: "أغنى لاعب في الجلسة (RICHEST_PLAYER)",
  POOREST_PLAYER: "أفقر لاعب في الجلسة (POOREST_PLAYER)",
  RANDOM_OTHER: "لاعب عشوائي آخر (RANDOM_OTHER)",
  ALL_OTHERS: "جميع اللاعبين الآخرين (ALL_OTHERS)"
};

const ALL_ACTION_TYPES: ActionType[] = [
  "MODIFY_COINS",
  "STEAL_COINS",
  "MOVE_STEPS",
  "SWAP_POSITIONS",
  "SKIP_TURN",
  "GRANT_SHIELD",
  "TAX_PERCENTAGE",
  "VOTE_PENALTY"
];

const ALL_TARGET_TYPES: TargetType[] = [
  "SELF",
  "CHOSEN_PLAYER",
  "RICHEST_PLAYER",
  "POOREST_PLAYER",
  "RANDOM_OTHER",
  "ALL_OTHERS"
];

export default function CardDeckEditor({
  cards,
  currencyName,
  onChangeCards
}: CardDeckEditorProps) {
  const [activeCategoryTab, setActiveCategoryTab] = useState<CardCategory | "ALL">("ALL");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const filteredCards =
    activeCategoryTab === "ALL"
      ? cards
      : cards.filter((c) => c.category === activeCategoryTab);

  const editingCard = cards.find((c) => c.id === editingCardId) || null;

  const handleUpdateCard = (id: string, updates: Partial<GameCard>) => {
    const updated = cards.map((c) => (c.id === id ? { ...c, ...updates } : c));
    onChangeCards(updated);
  };

  const handleUpdateEffect = (
    cardId: string,
    effectIndex: number,
    updates: Partial<AtomicEffect>
  ) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    const newEffects = card.effects.map((eff, i) =>
      i === effectIndex ? { ...eff, ...updates } : eff
    );
    handleUpdateCard(cardId, { effects: newEffects });
  };

  const handleAddSecondaryEffect = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.effects.length >= 2) return;

    const newEffect: AtomicEffect = {
      actionType: "MODIFY_COINS",
      targetType: "POOREST_PLAYER",
      value: 30
    };
    handleUpdateCard(cardId, { effects: [...card.effects, newEffect] });
  };

  const handleRemoveSecondaryEffect = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.effects.length <= 1) return;

    handleUpdateCard(cardId, { effects: [card.effects[0]] });
  };

  const handleAddNewCard = () => {
    const targetCat: CardCategory =
      activeCategoryTab === "ALL" ? "SECRET_HAND" : activeCategoryTab;

    let defaultEffects: AtomicEffect[] = [];
    if (targetCat === "SECRET_HAND") {
      defaultEffects = [{ actionType: "STEAL_COINS", targetType: "CHOSEN_PLAYER", value: 50 }];
    } else if (targetCat === "PUBLIC_DRAMA") {
      defaultEffects = [{ actionType: "MODIFY_COINS", targetType: "ALL_OTHERS", value: -30 }];
    } else {
      defaultEffects = [{ actionType: "VOTE_PENALTY", targetType: "ALL_OTHERS", value: -70 }];
    }

    const newId = `card_${String(cards.length + 1).padStart(2, "0")}`;
    const newCard: GameCard = {
      id: newId,
      title: "بطاقة مبتكرة جديدة",
      category: targetCat,
      flavorText: "نص كوميدي أو درامي ساخر يصف الموقف للشلة...",
      effects: defaultEffects
    };

    const newCards = [...cards, newCard];
    onChangeCards(newCards);
    setEditingCardId(newId);
  };

  const handleDeleteCard = (id: string) => {
    if (cards.length <= 15) {
      alert("تنبيه: يجب ألا يقل عدد البطاقات عن 15 لضمان توازن اللعبة.");
    }
    const updated = cards.filter((c) => c.id !== id);
    onChangeCards(updated);
    if (editingCardId === id) {
      setEditingCardId(null);
    }
  };

  const secretCount = cards.filter((c) => c.category === "SECRET_HAND").length;
  const dramaCount = cards.filter((c) => c.category === "PUBLIC_DRAMA").length;
  const voteCount = cards.filter((c) => c.category === "VOTE_CARD").length;

  return (
    <div className="space-y-6">
      {/* Category Tabs & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveCategoryTab("ALL")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeCategoryTab === "ALL"
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            جميع البطاقات ({cards.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryTab("SECRET_HAND")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeCategoryTab === "SECRET_HAND"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>اليد السرية ({secretCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryTab("PUBLIC_DRAMA")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeCategoryTab === "PUBLIC_DRAMA"
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>الدراما العامة ({dramaCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryTab("VOTE_CARD")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeCategoryTab === "VOTE_CARD"
                ? "bg-cyan-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Vote className="w-3.5 h-3.5" />
            <span>التصويت ({voteCount})</span>
          </button>
        </div>

        {/* Action Button & Validation Alert */}
        <div className="flex items-center gap-3">
          <div
            className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
              cards.length >= 15 && cards.length <= 25
                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                : "bg-rose-950/60 border-rose-500/40 text-rose-300"
            }`}
          >
            {cards.length >= 15 && cards.length <= 25 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>إجمالي الكومة: {cards.length} / 25</span>
          </div>

          <button
            type="button"
            disabled={cards.length >= 25}
            onClick={handleAddNewCard}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 disabled:opacity-40 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة بطاقة جديدة</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {filteredCards.map((card) => {
          const cfg = CATEGORY_CONFIG[card.category];
          const isSelected = editingCardId === card.id;

          return (
            <div
              key={card.id}
              className={`rounded-2xl border p-4 transition-all flex flex-col justify-between min-h-[220px] relative group ${
                isSelected
                  ? `bg-slate-800/95 border-purple-400 ring-2 ring-purple-500/40 shadow-xl shadow-purple-500/10`
                  : `bg-slate-900/80 ${cfg.border} hover:bg-slate-850 hover:shadow-lg`
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-lg border font-bold flex items-center gap-1 ${cfg.badgeBg}`}
                >
                  {cfg.icon}
                  <span>{cfg.label}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {card.id}
                </span>
              </div>

              {/* Title & Flavor */}
              <div className="flex-1 my-1">
                <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1 mb-1">
                  {card.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  "{card.flavorText}"
                </p>
              </div>

              {/* Effects Chips */}
              <div className="pt-3 border-t border-slate-800/80 space-y-1.5 my-2">
                {card.effects.map((eff, i) => {
                  const act = ACTION_LABELS[eff.actionType] || {
                    label: eff.actionType,
                    desc: ""
                  };
                  const trg = TARGET_LABELS[eff.targetType] || eff.targetType;

                  return (
                    <div
                      key={i}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                    >
                      <span className="text-purple-300 font-bold truncate max-w-[150px]">
                        {act.label}
                      </span>
                      <span className="font-mono text-amber-300 font-bold">
                        {eff.value > 0 ? `+${eff.value}` : eff.value}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setEditingCardId(card.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                  <span>تعديل</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteCard(card.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="حذف البطاقة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Card Editor Modal */}
      {editingCard !== null && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            dir="rtl"
            className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    تعديل البطاقة ({editingCard.id})
                  </h3>
                  <p className="text-xs text-slate-400">
                    عدّل نصوص وأوامر وتأثيرات البطاقة البرمجية
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCardId(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  فئة البطاقة
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(["SECRET_HAND", "PUBLIC_DRAMA", "VOTE_CARD"] as CardCategory[]).map(
                    (cat) => {
                      const cfg = CATEGORY_CONFIG[cat];
                      const isCur = editingCard.category === cat;

                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleUpdateCard(editingCard.id, { category: cat })}
                          className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2 ${
                            isCur
                              ? `bg-slate-800 border-purple-400 text-white font-bold ring-1 ring-purple-400`
                              : `bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200`
                          }`}
                        >
                          <span className="p-1 rounded-md bg-slate-900 border border-slate-800">
                            {cfg.icon}
                          </span>
                          <span className="text-xs">{cfg.label}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  عنوان البطاقة (أقصى حد 35 حرفاً)
                </label>
                <input
                  type="text"
                  maxLength={35}
                  value={editingCard.title}
                  onChange={(e) =>
                    handleUpdateCard(editingCard.id, { title: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold focus:border-purple-500 outline-none transition-colors"
                  placeholder="مثال: سرقة خاطفة، انقلاب مفاجئ..."
                />
              </div>

              {/* Flavor Text */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  النص الفكاهي أو السيناريو الدرامي (أقصى حد 160 حرفاً)
                </label>
                <textarea
                  maxLength={160}
                  rows={3}
                  value={editingCard.flavorText}
                  onChange={(e) =>
                    handleUpdateCard(editingCard.id, { flavorText: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs focus:border-purple-500 outline-none resize-none transition-colors"
                  placeholder="اكتب سيناريو ساخر ومضحك يتناسب مع شخصيات وأسماء الشلة..."
                />
              </div>

              {/* Effects List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>التأثيرات البرمجية ({editingCard.effects.length} / 2)</span>
                  </label>

                  {editingCard.effects.length < 2 && (
                    <button
                      type="button"
                      onClick={() => handleAddSecondaryEffect(editingCard.id)}
                      className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة تأثير ثانٍ</span>
                    </button>
                  )}
                </div>

                {editingCard.effects.map((eff, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-300">
                        التأثير #{index + 1}: {ACTION_LABELS[eff.actionType]?.label}
                      </span>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSecondaryEffect(editingCard.id)}
                          className="text-[11px] text-rose-400 hover:text-rose-300 font-bold"
                        >
                          إلغاء التأثير الثاني
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Action Type */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          نوع الأمر البرمجي
                        </label>
                        <select
                          value={eff.actionType}
                          onChange={(e) =>
                            handleUpdateEffect(editingCard.id, index, {
                              actionType: e.target.value as ActionType
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-400"
                        >
                          {ALL_ACTION_TYPES.map((act) => (
                            <option key={act} value={act}>
                              {ACTION_LABELS[act].label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Target Type */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          المستهدف بالأمر
                        </label>
                        <select
                          value={eff.targetType}
                          onChange={(e) =>
                            handleUpdateEffect(editingCard.id, index, {
                              targetType: e.target.value as TargetType
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-400"
                        >
                          {ALL_TARGET_TYPES.map((trg) => (
                            <option key={trg} value={trg}>
                              {TARGET_LABELS[trg]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Value */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-400">
                          القيمة الرقمية (-100 إلى 150)
                        </label>
                        <span className="text-xs font-mono font-bold text-amber-300">
                          {eff.value > 0 ? `+${eff.value}` : eff.value}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={-100}
                          max={150}
                          value={eff.value}
                          onChange={(e) =>
                            handleUpdateEffect(editingCard.id, index, {
                              value: parseInt(e.target.value) || 0
                            })
                          }
                          className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-center text-white font-mono font-bold text-sm focus:border-amber-400 outline-none"
                        />
                        <div className="flex flex-wrap gap-1 flex-1">
                          {[-50, -25, 0, 1, 25, 50, 75].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() =>
                                handleUpdateEffect(editingCard.id, index, {
                                  value: val
                                })
                              }
                              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors ${
                                val === 0
                                  ? "bg-slate-800 text-slate-400 border-slate-700"
                                  : val > 0
                                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                                  : "bg-rose-950/60 text-rose-300 border-rose-500/40"
                              }`}
                            >
                              {val > 0 ? `+${val}` : val}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteCard(editingCard.id)}
                className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف البطاقة</span>
              </button>

              <button
                type="button"
                onClick={() => setEditingCardId(null)}
                className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all"
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
