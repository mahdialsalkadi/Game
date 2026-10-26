"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Smile } from "lucide-react";
import { sfx } from "@/utils/soundEffects";

export interface CulturalVoiceLine {
  id: string;
  phrase: string;
  text: string;
  emoji: string;
  cueType: string;
  tag: string;
  gradient: string;
  borderColor: string;
}

export const THEMED_VOICE_LINES: Record<string, CulturalVoiceLine[]> = {
  ARABIAN_MAJLIS: [
    {
      id: "ya_laeeb",
      phrase: "يا لعيب! 🔥",
      text: "يا لعيب!",
      emoji: "🔥",
      cueType: "flame",
      tag: "حماس وتشجيع",
      gradient: "from-amber-600 to-orange-600",
      borderColor: "border-amber-400/60"
    },
    {
      id: "akalt_elgaw",
      phrase: "أكلت الجو! 👑",
      text: "أكلت الجو!",
      emoji: "👑",
      cueType: "crown",
      tag: "هيمنة وفوز",
      gradient: "from-yellow-500 to-amber-600",
      borderColor: "border-yellow-400/70"
    },
    {
      id: "hadhak_yefleq",
      phrase: "حظك يفلق الصخر! 🎲",
      text: "حظك يفلق الصخر!",
      emoji: "🎲",
      cueType: "dice",
      tag: "تعجب وحظ",
      gradient: "from-emerald-600 to-teal-700",
      borderColor: "border-emerald-400/60"
    },
    {
      id: "maysehsh_keda",
      phrase: "ما يصحش كده! 😅",
      text: "ما يصحش كده!",
      emoji: "😅",
      cueType: "laugh",
      tag: "مزاح وعتاب",
      gradient: "from-pink-600 to-rose-700",
      borderColor: "border-rose-400/60"
    },
    {
      id: "bilshefa",
      phrase: "بالشفا! ☕",
      text: "بالشفا!",
      emoji: "☕",
      cueType: "coffee",
      tag: "برود ورواقة",
      gradient: "from-amber-800 to-yellow-900",
      borderColor: "border-amber-600/60"
    },
    {
      id: "ween_tayer",
      phrase: "وين طاير؟ 🦅",
      text: "وين طاير؟",
      emoji: "🦅",
      cueType: "eagle",
      tag: "تحدي ومطاردة",
      gradient: "from-cyan-600 to-blue-700",
      borderColor: "border-cyan-400/60"
    }
  ],
  CYBERPUNK_NEON: [
    {
      id: "nezamak_tahakar",
      phrase: "نظامك تهكر! 🤖",
      text: "نظامك تهكر!",
      emoji: "🤖",
      cueType: "hack",
      tag: "اختراق وهجوم",
      gradient: "from-cyan-600 to-blue-600",
      borderColor: "border-cyan-400/70"
    },
    {
      id: "shahna_khareqa",
      phrase: "شحنة خارقة! ⚡",
      text: "شحنة خارقة!",
      emoji: "⚡",
      cueType: "zap",
      tag: "طاقة نيون قصوى",
      gradient: "from-fuchsia-600 to-pink-600",
      borderColor: "border-fuchsia-400/70"
    },
    {
      id: "inqata_etesalak",
      phrase: "انقطع اتصالك! 💥",
      text: "انقطع اتصالك!",
      emoji: "💥",
      cueType: "glitch",
      tag: "فصل النظام",
      gradient: "from-rose-600 to-red-700",
      borderColor: "border-rose-400/70"
    },
    {
      id: "tajawazt_elhemaya",
      phrase: "تجاوزت الحماية! 🔓",
      text: "تجاوزت الحماية!",
      emoji: "🔓",
      cueType: "bypass",
      tag: "كسر التشفير",
      gradient: "from-teal-500 to-emerald-600",
      borderColor: "border-teal-400/70"
    },
    {
      id: "overclock",
      phrase: "أوفركلوك! 🚀",
      text: "أوفركلوك!",
      emoji: "🚀",
      cueType: "overclock",
      tag: "تسريع توربو",
      gradient: "from-violet-600 to-purple-700",
      borderColor: "border-violet-400/70"
    },
    {
      id: "khawarezmiya",
      phrase: "خوارزمية محكمة! 🦾",
      text: "خوارزمية محكمة!",
      emoji: "🦾",
      cueType: "algorithm",
      tag: "ذكاء وهيمنة",
      gradient: "from-sky-600 to-indigo-700",
      borderColor: "border-sky-400/70"
    }
  ],
  DEEP_SPACE: [
    {
      id: "ila_allanihaya",
      phrase: "إلى اللانهاية! 🌌",
      text: "إلى اللانهاية!",
      emoji: "🌌",
      cueType: "infinity",
      tag: "انطلاق كوني",
      gradient: "from-indigo-600 to-violet-800",
      borderColor: "border-indigo-400/70"
    },
    {
      id: "istedam_naizaki",
      phrase: "اصطدام نيزكي! ☄️",
      text: "اصطدام نيزكي!",
      emoji: "☄️",
      cueType: "meteor",
      tag: "كارثة مدارية",
      gradient: "from-orange-600 to-red-700",
      borderColor: "border-orange-400/70"
    },
    {
      id: "jazebiya_faeqa",
      phrase: "جاذبية فائقة! 🕳️",
      text: "جاذبية فائقة!",
      emoji: "🕳️",
      cueType: "blackhole",
      tag: "ثقب أسود",
      gradient: "from-purple-900 to-slate-950",
      borderColor: "border-purple-400/70"
    },
    {
      id: "atlaqt_eltorpeedat",
      phrase: "أطلقت الطوربيدات! 🚀",
      text: "أطلقت الطوربيدات!",
      emoji: "🚀",
      cueType: "torpedo",
      tag: "هجوم باليستي",
      gradient: "from-cyan-600 to-blue-700",
      borderColor: "border-cyan-400/70"
    },
    {
      id: "captain_elostool",
      phrase: "كابتن الأسطول! 👨‍🚀",
      text: "كابتن الأسطول!",
      emoji: "👨‍🚀",
      cueType: "captain",
      tag: "قيادة مدارية",
      gradient: "from-sky-500 to-blue-600",
      borderColor: "border-sky-300/70"
    },
    {
      id: "doat_filfadaa",
      phrase: "ضعت في الفضاء! 🛸",
      text: "ضعت في الفضاء!",
      emoji: "🛸",
      cueType: "lost_space",
      tag: "تيه فضائي",
      gradient: "from-slate-700 to-indigo-900",
      borderColor: "border-slate-400/70"
    }
  ],
  CARTOON_OFFICE: [
    {
      id: "ijtima_tari2",
      phrase: "اجتماع طارئ! ☕",
      text: "اجتماع طارئ!",
      emoji: "☕",
      cueType: "office_meeting",
      tag: "دعوة إدارية",
      gradient: "from-orange-500 to-amber-600",
      borderColor: "border-orange-300/70"
    },
    {
      id: "indhar_hr",
      phrase: "إنذار من HR! 📋",
      text: "إنذار من HR!",
      emoji: "📋",
      cueType: "office_warning",
      tag: "مخالفة إدارية",
      gradient: "from-rose-600 to-red-700",
      borderColor: "border-rose-300/70"
    },
    {
      id: "istira7et_ghada",
      phrase: "استراحة الغداء! 🍕",
      text: "استراحة الغداء!",
      emoji: "🍕",
      cueType: "office_lunch",
      tag: "وقت الراحة",
      gradient: "from-emerald-500 to-teal-600",
      borderColor: "border-emerald-300/70"
    },
    {
      id: "tarqiya_mufaja2a",
      phrase: "ترقية مفاجئة! 📈",
      text: "ترقية مفاجئة!",
      emoji: "📈",
      cueType: "office_promotion",
      tag: "خبر سعيد",
      gradient: "from-sky-500 to-blue-600",
      borderColor: "border-sky-300/70"
    }
  ],
  MEDIEVAL_FANTASY: [
    {
      id: "litahya_almamlakah",
      phrase: "لتحيا المملكة! ⚔️",
      text: "لتحيا المملكة!",
      emoji: "⚔️",
      cueType: "kingdom",
      tag: "ولاء ملكي",
      gradient: "from-amber-600 to-yellow-600",
      borderColor: "border-yellow-400/70"
    },
    {
      id: "ghadr_alfursan",
      phrase: "غدر الفرسان! 🛡️",
      text: "غدر الفرسان!",
      emoji: "🛡️",
      cueType: "knight_treachery",
      tag: "خيانة شرف",
      gradient: "from-rose-700 to-red-800",
      borderColor: "border-rose-400/70"
    },
    {
      id: "nar_alteneen",
      phrase: "نار التنين! 🐉",
      text: "نار التنين!",
      emoji: "🐉",
      cueType: "dragon_fire",
      tag: "لهب حارق",
      gradient: "from-orange-600 to-red-600",
      borderColor: "border-orange-400/70"
    },
    {
      id: "darbat_alsaher",
      phrase: "ضربة الساحر! 🧙‍♂️",
      text: "ضربة الساحر!",
      emoji: "🧙‍♂️",
      cueType: "wizard_spell",
      tag: "تعويذة سحرية",
      gradient: "from-purple-600 to-indigo-700",
      borderColor: "border-purple-400/70"
    },
    {
      id: "hesar_mohkam",
      phrase: "حصار محكم! 🏰",
      text: "حصار محكم!",
      emoji: "🏰",
      cueType: "castle_siege",
      tag: "تطويق القلعة",
      gradient: "from-emerald-700 to-teal-800",
      borderColor: "border-emerald-400/70"
    },
    {
      id: "saqata_altaj",
      phrase: "سقط التاج! 👑",
      text: "سقط التاج!",
      emoji: "👑",
      cueType: "crown_fallen",
      tag: "سقوط الملك",
      gradient: "from-amber-700 to-yellow-800",
      borderColor: "border-amber-400/70"
    }
  ]
};

export const CULTURAL_VOICE_LINES: CulturalVoiceLine[] = THEMED_VOICE_LINES.ARABIAN_MAJLIS;

export const THEMED_QUICK_EMOJIS: Record<string, string[]> = {
  ARABIAN_MAJLIS: ["😂", "😱", "🔥", "💀", "☕", "🦅", "🏆", "🎲"],
  CYBERPUNK_NEON: ["🤖", "⚡", "💥", "🦾", "👾", "💻", "🚀", "💀"],
  DEEP_SPACE: ["🌌", "☄️", "🕳️", "🚀", "👨‍🚀", "🛸", "👽", "✨"],
  MEDIEVAL_FANTASY: ["⚔️", "🛡️", "🐉", "🧙‍♂️", "🏰", "👑", "🏹", "🔥"],
  CARTOON_OFFICE: ["☕", "📋", "💼", "🖨️", "🍩", "📈", "😂", "🤦‍♂️"]
};

export const QUICK_EMOJIS: string[] = ["😂", "😱", "🔥", "💀", "🤬", "🏆", "👏", "👀"];

interface ThemeSocialMeta {
  title: string;
  badge: string;
  voiceTabTitle: string;
  emojiTabTitle: string;
  activeTabColor: string;
  pingColor: string;
  headerTextColor: string;
}

const THEME_SOCIAL_META: Record<string, ThemeSocialMeta> = {
  ARABIAN_MAJLIS: {
    title: "صالة ألعاب المجلس",
    badge: "تفاعل حي 🔥",
    voiceTabTitle: "عبارات المجلس 🗣️",
    emojiTabTitle: "إيموجي 😄",
    activeTabColor: "bg-amber-500 text-slate-950",
    pingColor: "bg-amber-400",
    headerTextColor: "text-amber-300"
  },
  CYBERPUNK_NEON: {
    title: "شبكة نايت سيتي 2077",
    badge: "بروتوكول حي ⚡",
    voiceTabTitle: "أوامر السايبر 🤖",
    emojiTabTitle: "رموز النيون 👾",
    activeTabColor: "bg-cyan-400 text-slate-950",
    pingColor: "bg-cyan-400",
    headerTextColor: "text-cyan-300"
  },
  DEEP_SPACE: {
    title: "مرصد الأسطول الكوني",
    badge: "بث فضائي 🌌",
    voiceTabTitle: "نداءات المجرة 👨‍🚀",
    emojiTabTitle: "رموز الكوزموس 🛸",
    activeTabColor: "bg-sky-400 text-slate-950",
    pingColor: "bg-sky-400",
    headerTextColor: "text-sky-300"
  },
  MEDIEVAL_FANTASY: {
    title: "ديوان قلعة الفرسان",
    badge: "صيحة حرب ⚔️",
    voiceTabTitle: "هتافات المملكة 👑",
    emojiTabTitle: "شارات الملوك 🛡️",
    activeTabColor: "bg-emerald-400 text-slate-950",
    pingColor: "bg-emerald-400",
    headerTextColor: "text-emerald-300"
  },
  CARTOON_OFFICE: {
    title: "استراحة المكتب",
    badge: "فوضى إدارية ☕",
    voiceTabTitle: "مكائد الموظفين 🗂️",
    emojiTabTitle: "أجواء الدوام 😂",
    activeTabColor: "bg-orange-400 text-slate-950",
    pingColor: "bg-orange-400",
    headerTextColor: "text-orange-300"
  }
};

export interface SocialReactionsBarProps {
  onSendReaction: (emoji: string, text?: string, voiceId?: string) => void;
  compact?: boolean;
  className?: string;
  themeId?: string;
}

export default function SocialReactionsBar({
  onSendReaction,
  compact = false,
  className = "",
  themeId
}: SocialReactionsBarProps) {
  const [activeTab, setActiveTab] = useState<"VOICE" | "EMOJI">("VOICE");
  const [lastSent, setLastSent] = useState<string | null>(null);

  const activeThemeId = themeId || "ARABIAN_MAJLIS";
  const voiceLines = THEMED_VOICE_LINES[activeThemeId] || THEMED_VOICE_LINES.ARABIAN_MAJLIS;
  const quickEmojis = THEMED_QUICK_EMOJIS[activeThemeId] || THEMED_QUICK_EMOJIS.ARABIAN_MAJLIS;
  const meta = THEME_SOCIAL_META[activeThemeId] || THEME_SOCIAL_META.ARABIAN_MAJLIS;

  const triggerHaptic = (duration: number = 30) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([duration, 25, duration]);
      } catch {
        // Ignored if haptics unavailable
      }
    }
  };

  const handleSendVoiceLine = (item: CulturalVoiceLine) => {
    triggerHaptic(35);
    sfx.setAudioTheme(activeThemeId);
    sfx.playReactionCue(item.cueType);
    setLastSent(item.id);
    onSendReaction(item.emoji, item.text, item.cueType);
    setTimeout(() => setLastSent(null), 1200);
  };

  const handleSendEmoji = (emoji: string) => {
    triggerHaptic(20);
    sfx.setAudioTheme(activeThemeId);
    sfx.playTurnChime();
    setLastSent(emoji);
    onSendReaction(emoji);
    setTimeout(() => setLastSent(null), 1200);
  };

  return (
    <div
      dir="rtl"
      className={`w-full bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-3 shadow-2xl transition-all ${className}`}
    >
      {/* Header / Tabs */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${meta.pingColor} animate-ping inline-block`} />
          <h4 className={`text-xs font-black ${meta.headerTextColor} flex items-center gap-1.5`}>
            <span>{meta.title}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white/90 border border-white/15">
              {meta.badge}
            </span>
          </h4>
        </div>

        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("VOICE")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 ${
              activeTab === "VOICE"
                ? `${meta.activeTabColor} shadow-md scale-[1.02]`
                : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageCircle className="w-3 h-3" />
            <span>{meta.voiceTabTitle}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("EMOJI")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 ${
              activeTab === "EMOJI"
                ? `${meta.activeTabColor} shadow-md scale-[1.02]`
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Smile className="w-3 h-3" />
            <span>{meta.emojiTabTitle}</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "VOICE" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {voiceLines.map((item) => {
            const isSent = lastSent === item.id;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleSendVoiceLine(item)}
                className={`relative overflow-hidden p-2 rounded-2xl border-2 transition-all flex items-center justify-between text-right shadow-lg bg-gradient-to-r ${item.gradient} ${item.borderColor} ${
                  isSent ? "ring-2 ring-white scale-105" : "hover:brightness-110"
                }`}
              >
                <div className="z-10 truncate pr-1">
                  <div className="text-xs font-black text-white drop-shadow truncate">
                    {item.phrase}
                  </div>
                  {!compact && (
                    <span className="text-[9px] text-white/80 font-bold block mt-0.5">
                      {item.tag}
                    </span>
                  )}
                </div>

                <div className="text-2xl z-10 select-none pl-1 filter drop-shadow">
                  {item.emoji}
                </div>

                {isSent && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-[11px] text-white"
                  >
                    تم الإرسال للشاشة! ✨
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-2 justify-center flex-wrap py-1">
          {quickEmojis.map((emoji) => {
            const isSent = lastSent === emoji;
            return (
              <motion.button
                key={emoji}
                whileTap={{ scale: 0.8 }}
                whileHover={{ scale: 1.15 }}
                onClick={() => handleSendEmoji(emoji)}
                className={`w-12 h-12 rounded-2xl bg-slate-800/90 border border-slate-700 text-2xl hover:bg-slate-700 active:scale-75 shadow-lg transition-all flex items-center justify-center cursor-pointer select-none ${
                  isSent ? "border-amber-400 bg-amber-500/30 scale-110" : ""
                }`}
              >
                {emoji}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
