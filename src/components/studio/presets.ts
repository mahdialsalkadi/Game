import { PRESET_PACKS, FAMOUS_GAME_PRESETS } from "@/game/aiPackGenerator";
import type { GeneratedSessionPack } from "@/game/schema";
import { COMMUNITY_MAPS, type CommunityMapItem } from "@/game/communityMaps";

export { PRESET_PACKS, FAMOUS_GAME_PRESETS, COMMUNITY_MAPS };
export type { CommunityMapItem };

export const CYBERPUNK_PRESET = PRESET_PACKS.CYBERPUNK_HEIST;
export const ANCIENT_SULTANATE_PRESET = PRESET_PACKS.ANCIENT_SULTANATE;
export const OFFICE_MAYHEM_PRESET = PRESET_PACKS.OFFICE_MAYHEM;

export const STUDIO_PRESETS: Record<string, { label: string; pack: GeneratedSessionPack; icon?: string }> = {
  LUDO_CLASSIC: {
    label: "🎲 لودو المجلس الكلاسيكية (سباق وقواعد وأكل قطع)",
    pack: PRESET_PACKS.LUDO_CLASSIC,
    icon: "🎲"
  },
  MONOPOLY_CLASSIC: {
    label: "🎩 مونوبولي الكلاسيكية الأصلية (شراء وإيجارات)",
    pack: PRESET_PACKS.MONOPOLY_CLASSIC,
    icon: "🎩"
  },
  RIYADH_VIP: {
    label: "🏙️ عقارات الرياض الفاخرة (ماب المجتمع)",
    pack: PRESET_PACKS.RIYADH_VIP,
    icon: "🏙️"
  },
  WORLD_CONQUEST_RISK: {
    label: "⚔️ صراع الدول والفتوحات (احتلال الأقاليم)",
    pack: PRESET_PACKS.WORLD_CONQUEST_RISK,
    icon: "⚔️"
  },
  TACTICAL_CARDS_UNO: {
    label: "🃏 حرب الأوراق التكتيكية (تخلص من البطاقات)",
    pack: PRESET_PACKS.TACTICAL_CARDS_UNO,
    icon: "🃏"
  },
  SOCIAL_MAFIA_SPY: {
    label: "🕵️ مجلس الشك والمافيا (نقاش وتصويت علني)",
    pack: PRESET_PACKS.SOCIAL_MAFIA_SPY,
    icon: "🕵️"
  },
  SNAKES_AND_LADDERS_RPG: {
    label: "🪜 السلم والثعبان 100 الأسطورية (شبكة 100 وقفزات)",
    pack: PRESET_PACKS.SNAKES_AND_LADDERS_RPG,
    icon: "🪜"
  },
  SULTANATE_MERCHANTS: {
    label: "🕌 تجار السلطنة والقوافل (عقارات ومضاربة)",
    pack: PRESET_PACKS.SULTANATE_MERCHANTS,
    icon: "🕌"
  },
  CYBERPUNK: {
    label: "⚡ سايبربانك نيون 2088 (سباق لوحة)",
    pack: PRESET_PACKS.CYBERPUNK_HEIST,
    icon: "⚡"
  },
  OFFICE_MAYHEM: {
    label: "☕ فوضى الدوام المكتبي (معارك بطاقات)",
    pack: PRESET_PACKS.OFFICE_MAYHEM,
    icon: "☕"
  },
  CONNECT_FOUR: {
    label: "🔴 كونكت فور (أربعة على التوالي)",
    pack: PRESET_PACKS.CONNECT_FOUR,
    icon: "🔴"
  },
  CHECKERS_CLASSIC: {
    label: "⚫ الضامة الكلاسيكية (أكل وترقية)",
    pack: PRESET_PACKS.CHECKERS_CLASSIC,
    icon: "⚫"
  },
  BINGO_NIGHT: {
    label: "🎱 بينغو السهرة (أول خط يفوز)",
    pack: PRESET_PACKS.BINGO_NIGHT,
    icon: "🎱"
  }
};

export interface LoungeGameItem {
  id: string;
  key: string;
  titleAr: string;
  subtitleAr: string;
  taglineAr: string;
  descriptionAr: string;
  icon: string;
  /** غلاف محلي فني خاص باللعبة (public/covers). */
  cover: string;
  badge: string;
  playerCount: string;
  colorScheme: {
    bgGradient: string;
    border: string;
    badgeBg: string;
    glow: string;
    accent: string;
  };
  features: string[];
  rulesPreview: {
    board: string;
    mechanism: string;
    win: string;
  };
  defaultSettings: {
    maxRounds: number;
    startingCoins: number;
  };
}

export const JAWAKER_LOUNGE_GAMES: LoungeGameItem[] = [
  {
    id: "monopoly",
    key: "MONOPOLY_CLASSIC",
    titleAr: "مونوبولي كلاسيك الأصلية",
    subtitleAr: "بوردووك وإلينوي وأتلانتيك سيتي الأصلية",
    taglineAr: "بورد 20 مربع كلاسيكي، بيوت وفنادق، سجن ونردين",
    descriptionAr: "لعبة المونوبولي العالمية الأصلية بالقوانين الكلاسيكية! اشترِ بوردووك وبارك بليس وشوارع أتلانتيك سيتي الشهيرة بالدولار، ابنِ المنازل والفنادق، واجمع الإيجارات حتى إفلاس الجميع!",
    icon: "🎩",
    cover: "/covers/monopoly.svg",
    badge: "اللعبة الأصلية 🎩",
    playerCount: "2 - 8 لاعبين",
    colorScheme: {
      bgGradient: "from-amber-950/70 via-slate-900 to-amber-900/40",
      border: "border-amber-500/40 hover:border-amber-400",
      badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      glow: "shadow-[0_0_35px_rgba(245,158,11,0.25)]",
      accent: "text-amber-400"
    },
    features: [
      "عقارات أتلانتيك سيتي الأصلية (Boardwalk & Park Place)",
      "بيوت خضراء وفنادق حمراء ومضاعفة الإيجار",
      "السجن، والمواقف المجانية، وصندوق الحظ، وفرص كلاسيكية",
      "التعامل بالدولار ونردين فيزيائيين ثلاثيي الأبعاد"
    ],
    rulesPreview: {
      board: "20 مربع أتلانتيك سيتي الأصلية",
      mechanism: "نرد وحركة وتملك كلاسيكي",
      win: "إفلاس المنافسين أو احتكار السوق بالكامل"
    },
    defaultSettings: {
      maxRounds: 999,
      startingCoins: 200
    }
  },
  {
    id: "ludo",
    key: "LUDO_CLASSIC",
    titleAr: "لودو المجلس الكلاسيكية",
    subtitleAr: "صليب 15x15 وحرب أكل القطع",
    taglineAr: "صليب 15x15، أكل القطع، نجوم الأمان، 4 قطع",
    descriptionAr: "لعبة المجلس العربية الأشهر! ارمِ النرد لإخراج قطعك من القاعدة، احتمِ بنجوم الأمان، واصطد قطع أصحابك لتصل إلى مثلث الفوز بالمركز!",
    icon: "🎲",
    cover: "/covers/ludo.svg",
    badge: "صليب ونجوم أمان ⭐",
    playerCount: "2 - 4 لاعبين",
    colorScheme: {
      bgGradient: "from-blue-950/70 via-slate-900 to-indigo-950/40",
      border: "border-blue-500/40 hover:border-blue-400",
      badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      glow: "shadow-[0_0_35px_rgba(59,130,246,0.25)]",
      accent: "text-blue-400"
    },
    features: [
      "صليب 15x15 بنكهة المجلس الأصيلة",
      "أكل قطع الخصوم وإعادتها للقاعدة",
      "نجوم الأمان لحصانة مطلقة ضد الأكل",
      "4 قطع لكل لاعب وتكتيك حركة محكم"
    ],
    rulesPreview: {
      board: "صليب لودو التقليدي",
      mechanism: "نرد وحركة وقطع",
      win: "إيصال القطع الأربعة للمركز وحسم النصر"
    },
    defaultSettings: {
      maxRounds: 999,
      startingCoins: 100
    }
  },
  {
    id: "uno",
    key: "TACTICAL_CARDS_UNO",
    titleAr: "طاولة كروت أونو",
    subtitleAr: "طاولة جوخ فاخرة وحرب بطاقات تكتيكية",
    taglineAr: "طاولة جوخ، مروحة كروت، كروت أكشن، صرخة أونو!",
    descriptionAr: "جلسة ورق كازينو حماسية على طاولة جوخ خضراء! تخلص من أوراقك، العب كروت الآكشن والتجميد، واصرخ 'أونو!' قبل أن يسبقك الجميع!",
    icon: "🃏",
    cover: "/covers/uno.svg",
    badge: "كروت أكشن وتكتيك 🎴",
    playerCount: "2 - 10 لاعبين",
    colorScheme: {
      bgGradient: "from-emerald-950/70 via-slate-900 to-teal-950/40",
      border: "border-emerald-500/40 hover:border-emerald-400",
      badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      glow: "shadow-[0_0_35px_rgba(16,185,129,0.25)]",
      accent: "text-emerald-400"
    },
    features: [
      "طاولة جوخ كازينو خضراء فاخرة",
      "مروحة كروت مقوسة ثلاثية الأبعاد على الجوال",
      "كروت سحب 4، تغيير اللون، عكس وتجميد",
      "زر صرخة 'أونو!' التفاعلي بصوت حي"
    ],
    rulesPreview: {
      board: "طاولة كروت وأكوام سحب وتخلص",
      mechanism: "لعب بطاقات تكتيكي فقط",
      win: "التخلص من جميع الكروت وصرخة أونو"
    },
    defaultSettings: {
      maxRounds: 999,
      startingCoins: 150
    }
  },
  {
    id: "snakes",
    key: "SNAKES_AND_LADDERS_RPG",
    titleAr: "السلم والثعبان 100",
    subtitleAr: "شبكة 100 وقفزات أسطورية",
    taglineAr: "شبكة 100، سلالم خشبية، ثعابين زاحفة",
    descriptionAr: "السباق الكلاسيكي الأصيل! اصعد السلالم الخشبية للقفز عبر الأدوار نحو القمة، واحذر رؤوس الثعابين التي تهوي بك إلى البداية!",
    icon: "🪜",
    cover: "/covers/snakes.svg",
    badge: "سباق وقفزات 🐍",
    playerCount: "2 - 8 لاعبين",
    colorScheme: {
      bgGradient: "from-purple-950/70 via-slate-900 to-pink-950/40",
      border: "border-purple-500/40 hover:border-purple-400",
      badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      glow: "shadow-[0_0_35px_rgba(168,85,247,0.25)]",
      accent: "text-purple-400"
    },
    features: [
      "شبكة 100 مربع بمسار حلزوني متعرج",
      "سلالم خشبية صاعدة تقفز للمقدمة",
      "ثعابين زاحفة تعيدك للوراء بلدغات قاسية",
      "رمي نرد فيزيائي ثلاثي الأبعاد مع هابتكس"
    ],
    rulesPreview: {
      board: "شبكة 100 مربع متعرجة",
      mechanism: "نرد وحركة وقفزات فورية",
      win: "بلوغ قمة المربع 100 واعتلاء العرش"
    },
    defaultSettings: {
      maxRounds: 999,
      startingCoins: 100
    }
  },
  {
    id: "risk",
    key: "WORLD_CONQUEST_RISK",
    titleAr: "غزو العالم (حرب القارات)",
    subtitleAr: "احتلال الأقاليم وتمركز الجيوش",
    taglineAr: "احتلال الأقاليم، تمركز الجيوش، تكتيك عسكري",
    descriptionAr: "خريطة العالم بين يديك! وزّع كتائبك، خطط لهجماتك الاستراتيجية، واحتل قارات وأقاليم الخصوم إقليماً تلو الآخر بلا نرد!",
    icon: "🌍",
    cover: "/covers/risk.svg",
    badge: "قيادة وجيوش ⚔️",
    playerCount: "2 - 8 لاعبين",
    colorScheme: {
      bgGradient: "from-rose-950/70 via-slate-900 to-red-950/40",
      border: "border-rose-500/40 hover:border-rose-400",
      badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      glow: "shadow-[0_0_35px_rgba(244,63,94,0.25)]",
      accent: "text-rose-400"
    },
    features: [
      "خريطة أقاليم وقارات حربية استراتيجية",
      "تحصين بالدروع وتمركز وتوزيع الكتائب",
      "أوامر عسكرية تكتيكية من شاشة الجوال",
      "معارك استنزاف حتى السيطرة الكاملة"
    ],
    rulesPreview: {
      board: "خريطة الأقاليم العالمية",
      mechanism: "أوامر هجوم ودفاع عسكرية",
      win: "السيطرة على أكثر من 75% من الأقاليم"
    },
    defaultSettings: {
      maxRounds: 999,
      startingCoins: 250
    }
  },
  {
    id: "mafia",
    key: "SOCIAL_MAFIA_SPY",
    titleAr: "مافيا وجاسوس الشلة",
    subtitleAr: "كشف الأدوار السرية وتصويت الشكوك",
    taglineAr: "كشف الأدوار السري، تصويت الشكوك، سوالف ومحاكمة",
    descriptionAr: "سهرة النقاش والخداع! استلم دورك السري على شاشة هاتفك، تناقشوا بصوت عالٍ في المجلس، واكشفوا المندسين بالتصويت الإقصائي!",
    icon: "🕵️‍♂️",
    cover: "/covers/mafia.svg",
    badge: "تصويت وخداع 🗳️",
    playerCount: "5 - 10 لاعبين",
    colorScheme: {
      bgGradient: "from-cyan-950/70 via-slate-900 to-sky-950/40",
      border: "border-cyan-500/40 hover:border-cyan-400",
      badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      glow: "shadow-[0_0_35px_rgba(6,182,212,0.25)]",
      accent: "text-cyan-400"
    },
    features: [
      "أدوار سرية خاصة على شاشة كل جوال",
      "مؤقت نقاش حي وسوالف المجلس الحماسية",
      "تصويت علني وإقصاء المتهمين بالجلسة",
      "تدخلات درامية صوتية بالذكاء الاصطناعي"
    ],
    rulesPreview: {
      board: "طاولة التحقيق ومؤقت الشك",
      mechanism: "نقاش جماعي وتصويت علني",
      win: "إقصاء المافيا بالكامل أو سيطرة المافيا"
    },
    defaultSettings: {
      maxRounds: 999,
      startingCoins: 100
    }
  },
  {
    id: "connect4",
    key: "CONNECT_FOUR",
    titleAr: "كونكت فور (أربعة على التوالي)",
    subtitleAr: "لوحة عمودية وأقراص ملونة وتكتيك بلا نرد",
    taglineAr: "أسقط قرصك، اصنع خطاً من أربعة، واسدّ خطط خصمك",
    descriptionAr:
      "لعبة الذكاء السريعة الأشهر! اختر العمود وأسقط قرصك، وراقب الصفوف والأعمدة والقطرين. أربعة أقراص متصلة تكفي لتحسم اللقب قبل خصمك!",
    icon: "🔴",
    cover: "/covers/connect4.svg",
    badge: "أربعة على التوالي 🔴",
    playerCount: "2 لاعبين",
    colorScheme: {
      bgGradient: "from-blue-950/70 via-slate-900 to-cyan-950/40",
      border: "border-sky-500/40 hover:border-sky-400",
      badgeBg: "bg-sky-500/20 text-sky-300 border-sky-500/30",
      glow: "shadow-[0_0_35px_rgba(56,189,248,0.25)]",
      accent: "text-sky-400"
    },
    features: [
      "لوحة ٧ أعمدة × ٦ صفوف بجاذبية طبيعية",
      "كشف تلقائي للفوز الأفقي والعمودي والقطري",
      "بوت ذكي يسدّ تهديداتك ويهاجم بخطة",
      "جولات سريعة في أقل من ١٥ دقيقة"
    ],
    rulesPreview: {
      board: "لوحة عمودية ٧×٦",
      mechanism: "إسقاط أقراص وبناء خطوط",
      win: "أربعة أقراص متصلة في أي اتجاه"
    },
    defaultSettings: {
      maxRounds: 999,
      startingCoins: 100
    }
  },
  {
    id: "checkers",
    key: "CHECKERS_CLASSIC",
    titleAr: "الضامة الكلاسيكية",
    subtitleAr: "رقعة ٨×٨ وأكل إجباري وترقية الملوك",
    taglineAr: "اقفز فوق قطع الخصم وتوّج قطعتك ملكاً",
    descriptionAr:
      "لعبة الأجيال! حرّك قطعك قطرياً، نفّذ الأكل الإجباري، وتابع القفزات المتسلسلة حتى تسقط جيش الخصم بالكامل. ملك واحد قد يقلب الرقعة!",
    icon: "⚫",
    cover: "/covers/checkers.svg",
    badge: "أكل وترقية 👑",
    playerCount: "2 لاعبين",
    colorScheme: {
      bgGradient: "from-stone-900 via-amber-950/40 to-stone-950",
      border: "border-amber-600/40 hover:border-amber-500",
      badgeBg: "bg-amber-500/20 text-amber-200 border-amber-500/30",
      glow: "shadow-[0_0_35px_rgba(217,119,6,0.22)]",
      accent: "text-amber-300"
    },
    features: [
      "رقعة ٨×٨ و١٢ قطعة لكل لاعب",
      "أكل إجباري وقفزات متسلسلة",
      "ترقية القطع إلى ملوك متحركين",
      "بوت يبحث عن أفضل أكل وحركة"
    ],
    rulesPreview: {
      board: "رقعة ضامة ٨×٨",
      mechanism: "حركة قطرية وأكل إجباري",
      win: "أسر كل قطع الخصم أو تحريم حركته"
    },
    defaultSettings: {
      maxRounds: 999,
      startingCoins: 100
    }
  },
  {
    id: "bingo",
    key: "BINGO_NIGHT",
    titleAr: "بينغو السهرة",
    subtitleAr: "بطاقات ٥×٥ و٧٥ كرة وأول خط يفوز",
    taglineAr: "اسحب الأرقام، علّم بطاقتك، واصرخ بينغو!",
    descriptionAr:
      "لعبة الحظ الجماعية الأشهر! كل لاعب يحصل على بطاقة عشوائية، ودورك يسحب كرة جديدة. أول من يكمل خطاً أفقياً أو عمودياً أو قطرياً يخطف الفوز!",
    icon: "🎱",
    cover: "/covers/bingo.svg",
    badge: "أول خط يفوز 🎉",
    playerCount: "2 - 8 لاعبين",
    colorScheme: {
      bgGradient: "from-fuchsia-950/70 via-slate-900 to-pink-950/40",
      border: "border-pink-500/40 hover:border-pink-400",
      badgeBg: "bg-pink-500/20 text-pink-300 border-pink-500/30",
      glow: "shadow-[0_0_35px_rgba(236,72,153,0.25)]",
      accent: "text-pink-400"
    },
    features: [
      "بطاقة عشوائية ٥×٥ لكل لاعب",
      "٧٥ كرة مرقّمة وخانة FREE",
      "تعليم تلقائي فوري للأرقام",
      "فوز بأول صف أو عمود أو قطر"
    ],
    rulesPreview: {
      board: "بطاقة بينغو ٥×٥",
      mechanism: "سحب أرقام وتعليم تلقائي",
      win: "إكمال أول خط في البطاقة"
    },
    defaultSettings: {
      maxRounds: 999,
      startingCoins: 100
    }
  }
];

export const BASE_CLASSIC_GAMES = JAWAKER_LOUNGE_GAMES;
