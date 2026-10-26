import { z } from "zod";
import type { GeneratedSessionPack, BoardTile, GameCard } from "./schema";

// 1. القوائم والمخططات البرمجية لمواصفات العالم والثيم (Universal Theme Schemas)

export const VisualStyleEnum = z.enum([
  "ANCIENT_ARABIA",
  "CYBERPUNK",
  "SPACE",
  "FANTASY",
  "CARTOON_OFFICE"
]);

export const ColorPaletteSchema = z.object({
  primary: z.string().describe("اللون الأساسي للثيم"),
  accent: z.string().describe("اللون الثانوي والتمييز"),
  bgGradient: z.string().describe("تدرج الخلفية الرئيسي (Tailwind gradient)"),
  boardTint: z.string().describe("صبغة أرضية اللوح (Hex/RGBA)"),
  glowColor: z.string().describe("لون الوهج والظلال المشعة (CSS rgba)")
});

export const SoundscapeProfileSchema = z.object({
  diceShake: z.string().describe("صوت خض النرد الخاص بالثيم"),
  pawnMove: z.string().describe("صوت حركة القطعة على المربع"),
  cardPlay: z.string().describe("صوت رمي وتفعيل البطاقة"),
  victory: z.string().describe("صوت نغمة أو نشيد الفوز"),
  hazard: z.string().describe("صوت الفخ أو الخطر")
});

export const MonopolyCornerOverridesSchema = z.object({
  go: z.string().describe("عنوان زاوية انطلق"),
  jail: z.string().describe("عنوان زاوية السجن / الزيارة"),
  freeParking: z.string().describe("عنوان زاوية المواقف المجانية"),
  goToJail: z.string().describe("عنوان زاوية اذهب إلى السجن")
});

export const MonopolyDistrictSchema = z.object({
  name: z.string().describe("اسم المجموعة أو المقاطعة"),
  tiles: z.array(z.string()).describe("أسماء العقارات التابعة للمجموعة")
});

export const MonopolyOverridesSchema = z.object({
  currencyName: z.string().describe("اسم العملة الخاص بالمونوبولي في هذا الثيم"),
  boardTitle: z.string().optional().describe("عنوان لوحة المونوبولي لهذا الثيم"),
  cornerTitles: MonopolyCornerOverridesSchema,
  cornerDescriptions: MonopolyCornerOverridesSchema.partial().optional(),
  districts: z.record(z.string(), MonopolyDistrictSchema).describe("المجموعات اللونية الثمانية مع محطات الخدمات")
});

export const LudoOverridesSchema = z.object({
  yardBases: z.object({
    green: z.string().describe("اسم قاعدة المعسكر الأخضر"),
    yellow: z.string().describe("اسم قاعدة المعسكر الأصفر"),
    blue: z.string().describe("اسم قاعدة المعسكر الأزرق"),
    red: z.string().describe("اسم قاعدة المعسكر الأحمر")
  }),
  safeStarTitle: z.string().describe("عنوان نجمة الأمان والحصانة"),
  trailName: z.string().describe("اسم مسار السباق"),
  currencyName: z.string().describe("اسم نقاط الفوز أو العملة"),
  homeTitle: z.string().describe("عنوان نقطة الوصول وخط النهاية")
});

export const SnakesOverridesSchema = z.object({
  trailName: z.string().describe("اسم مسار السلم والثعبان"),
  ladderTheme: z.string().describe("ثيم واسم السلم الصاعد"),
  snakeTheme: z.string().describe("ثيم واسم الثعبان أو الفخ الهابط"),
  currencyName: z.string().describe("اسم عملة الخطوات أو النقاط")
});

export const UnoOverridesSchema = z.object({
  cardDeckTheme: z.string().describe("اسم حزمة ورق اللعب"),
  currencyName: z.string().describe("اسم النقاط المحتسبة"),
  wildCardNames: z.object({
    wild: z.string().describe("اسم بطاقة الجوكر"),
    wildDrawFour: z.string().describe("اسم بطاقة جوكر سحب 4"),
    drawTwo: z.string().describe("اسم بطاقة سحب 2"),
    skip: z.string().describe("اسم بطاقة تخطي الدور"),
    reverse: z.string().describe("اسم بطاقة عكس الاتجاه")
  })
});

export const RiskOverridesSchema = z.object({
  currencyName: z.string().describe("اسم الوحدة العسكرية أو الكتيبة"),
  armyUnits: z.array(z.string()).describe("أنواع الوحدات والفيالق"),
  factionNames: z.array(z.string()).describe("أسماء الفصائل والجيوش"),
  territoryAdjective: z.string().describe("بادئة أو مسمى الإقليم / القطاع")
});

export const MafiaOverridesSchema = z.object({
  currencyName: z.string().describe("اسم نقاط الثقة أو النفوذ"),
  rolesTitles: z.object({
    investigator: z.string().describe("لقب المحقق"),
    spy: z.string().describe("لقب الجاسوس / الخائن"),
    citizen: z.string().describe("لقب المواطن المسالم"),
    doctor: z.string().optional().describe("لقب الطبيب / المعالج")
  })
});

export const GameOverridesSchema = z.object({
  MONOPOLY: MonopolyOverridesSchema,
  LUDO: LudoOverridesSchema,
  SNAKES: SnakesOverridesSchema,
  UNO: UnoOverridesSchema,
  RISK: RiskOverridesSchema,
  MAFIA: MafiaOverridesSchema
});

export const UniversalThemeSchema = z.object({
  id: z.string().describe("المعرف الفريد للعالم والثيم"),
  titleAr: z.string().describe("الاسم العربي الرئيسي للثيم"),
  subtitleAr: z.string().describe("الوصف الفرعي الجذاب"),
  icon: z.string().describe("أيقونة الثيم"),
  badge: z.string().describe("شارة الثيم المميزة"),
  visualStyle: VisualStyleEnum,
  colorPalette: ColorPaletteSchema,
  playerTokens: z.array(z.string()).min(4).max(8).describe("قطع اللاعبين المتوافقة مع الثيم"),
  soundscapeProfile: SoundscapeProfileSchema,
  voiceReactions: z.array(z.string()).min(3).describe("عبارات ردود الفعل الصوتية العربية المتوافقة مع الثيم"),
  gameOverrides: GameOverridesSchema
});

// TypeScript Types
export type VisualStyle = z.infer<typeof VisualStyleEnum>;
export type ColorPalette = z.infer<typeof ColorPaletteSchema>;
export type SoundscapeProfile = z.infer<typeof SoundscapeProfileSchema>;
export type MonopolyCornerOverrides = z.infer<typeof MonopolyCornerOverridesSchema>;
export type MonopolyOverrides = z.infer<typeof MonopolyOverridesSchema>;
export type LudoOverrides = z.infer<typeof LudoOverridesSchema>;
export type SnakesOverrides = z.infer<typeof SnakesOverridesSchema>;
export type UnoOverrides = z.infer<typeof UnoOverridesSchema>;
export type RiskOverrides = z.infer<typeof RiskOverridesSchema>;
export type MafiaOverrides = z.infer<typeof MafiaOverridesSchema>;
export type GameOverrides = z.infer<typeof GameOverridesSchema>;
export type UniversalTheme = z.infer<typeof UniversalThemeSchema>;
export type UniversalThemeId =
  | "ARABIAN_MAJLIS"
  | "CYBERPUNK_NEON"
  | "DEEP_SPACE"
  | "MEDIEVAL_FANTASY"
  | "CARTOON_OFFICE";

// 2. العوالم الأربعة المتكاملة مسبقة البناء (Pre-built Universal Themes)

export const UNIVERSAL_THEMES: Record<UniversalThemeId, UniversalTheme> = {
  ARABIAN_MAJLIS: {
    id: "ARABIAN_MAJLIS",
    titleAr: "مجلس السهرة التراثي",
    subtitleAr: "أصالة ونخوة وأجواء السهرة الشعبية الفاخرة",
    icon: "☕",
    badge: "تراثي أصيل",
    visualStyle: "ANCIENT_ARABIA",
    colorPalette: {
      primary: "#D97706",
      accent: "#B45309",
      bgGradient: "from-amber-950 via-stone-900 to-amber-900",
      boardTint: "#29180C",
      glowColor: "rgba(217,119,6,0.5)"
    },
    playerTokens: [
      "دلة القهوة ☕",
      "الصقر الحر 🦅",
      "الخيل العربي 🐎",
      "المبخرة الملكية 🪵",
      "السيف الدمشقي 🗡️",
      "فنجان الشاي 🍵"
    ],
    soundscapeProfile: {
      diceShake: "dice_wooden_cup",
      pawnMove: "wood_thud",
      cardPlay: "card_swoosh_paper",
      victory: "oud_fanfare_victory",
      hazard: "oud_dramatic_sting"
    },
    voiceReactions: [
      "ارحب تراحيب المطر! ☕",
      "عينك على اللوح يا ذيب! 🐺",
      "يا مسير على المجلس، لا تغدر! 🤝",
      "الحظ ما يبي له غير شجاعة! 🦅",
      "فداك الكأس يا راعي الأوله! 🏆",
      "يا هني من تربع على الصدارة! 👑"
    ],
    gameOverrides: {
      MONOPOLY: {
        currencyName: "ريال ذهبي",
        boardTitle: "عقارات وأسواق التراث الأصيل 🏙️",
        cornerTitles: {
          go: "انطلق (المرور بالمجلس) 🏁",
          jail: "مجلس الصلح والتوقيف ⛓️",
          freeParking: "استراحة القهوة والضيافة ☕",
          goToJail: "توقيف بالمجلس العرفي 🚨"
        },
        districts: {
          BROWN: {
            name: "أسواق البلد القديمة",
            tiles: ["سوق الزل التراثي", "حي البطحاء العريق"]
          },
          LIGHT_BLUE: {
            name: "أحياء الديرة والمصمك",
            tiles: ["قصر المصمك التاريخي", "بوابة الثميري العتيقة"]
          },
          PINK: {
            name: "واحات النخيل والبساتين",
            tiles: ["واحة الدرعية القديمة", "بساتين وادي حنيفة"]
          },
          ORANGE: {
            name: "أسواق الذهب والتوابل",
            tiles: ["خان الصاغة التراثي", "سوق القيصرية"]
          },
          RED: {
            name: "قصور الضيافة العريقة",
            tiles: ["قصر المربع التراثي", "ديوان الضيافة الملكي"]
          },
          YELLOW: {
            name: "مضارب الفرسان والخيول",
            tiles: ["مركاض الخيل العربي", "ميدان الصقور الأصيلة"]
          },
          GREEN: {
            name: "حصون وقلاع الجزيرة",
            tiles: ["قلعة مارد الشامخة", "حصن تاروت العتيق"]
          },
          DARK_BLUE: {
            name: "عاصمة الحكم والمجد",
            tiles: ["قصر الحكم التاريخي", "درة نجد الكبرى"]
          },
          STATION: {
            name: "قوافل التجارة الكبرى",
            tiles: ["محطة درب الزبيدة للقوافل 🐪"]
          },
          UTILITY: {
            name: "عيون الماء والري",
            tiles: ["عين الماء وساقية الواحة 💧"]
          }
        }
      },
      LUDO: {
        yardBases: {
          green: "ديوانية النخيل 🟢",
          yellow: "مجلس النشامى 🟡",
          blue: "مربط الأصايل 🔵",
          red: "خيمة الصقور 🔴"
        },
        safeStarTitle: "نجمة الضيافة والأمان ⭐️",
        trailName: "درب القوافل التراثي",
        currencyName: "فنجان هيبة",
        homeTitle: "صدر المجلس 👑"
      },
      SNAKES: {
        trailName: "سباق عقبة الجبال والتلال التراثية",
        ladderTheme: "درج القلعة الحجري 🪜",
        snakeTheme: "أفعى الرمال الذهبية 🐍",
        currencyName: "خطوة نخوة"
      },
      UNO: {
        cardDeckTheme: "أوراق حكمة المجلس",
        currencyName: "فنجان",
        wildCardNames: {
          wild: "سيف النخوة (جوكر)",
          wildDrawFour: "غزوة الصقور (+4)",
          drawTwo: "فنجان ضيافة ثنائي (+2)",
          skip: "تأجيل الكلام (تخطي)",
          reverse: "قلب الدلة (عكس الاتجاه)"
        }
      },
      RISK: {
        currencyName: "فارس",
        armyUnits: ["خيالة نشامى", "فرسان الصحراء", "رماة القلاع", "كتائب البواسل"],
        factionNames: ["حلف النخوة", "راية الصحراء", "قبيلة الصقور", "فرسان الواحة"],
        territoryAdjective: "إقليم"
      },
      MAFIA: {
        currencyName: "صوت ثقة",
        rolesTitles: {
          investigator: "العسس والقاضي ⚖️",
          spy: "المندس والمخادع 🗡️",
          citizen: "ابن الحارة الوفي 👳‍♂️",
          doctor: "حكيم القبيلة 🌿"
        }
      }
    }
  },

  CYBERPUNK_NEON: {
    id: "CYBERPUNK_NEON",
    titleAr: "سايبربانك 2077",
    subtitleAr: "صراع نيون المستقبل وأبراج الميغاكورب العاتية",
    icon: "⚡",
    badge: "نيون مستقبلي",
    visualStyle: "CYBERPUNK",
    colorPalette: {
      primary: "#06B6D4",
      accent: "#EC4899",
      bgGradient: "from-slate-950 via-purple-950 to-slate-900",
      boardTint: "#0B0F19",
      glowColor: "rgba(6,182,212,0.6)"
    },
    playerTokens: [
      "سايبورغ الهاكر 🤖",
      "درون المراقبة 🛸",
      "دراجة النيون 🏍️",
      "شريحة الذكاء 💾",
      "القط الآلي 🐱",
      "مسدس البلازما 🔫"
    ],
    soundscapeProfile: {
      diceShake: "cyber_glitch_roll",
      pawnMove: "synth_servo_step",
      cardPlay: "digital_hologram_deploy",
      victory: "synthwave_drop_victory",
      hazard: "system_alarm_glitch"
    },
    voiceReactions: [
      "تم اختراق الشبكة بنجاح! ⚡",
      "فيروس في نظامك يا بطل! 💻",
      "النيون لا ينام، والميغاكورب تراقب! 👁️",
      "تعديل سيبراني فائق السرعة! 🚀",
      "فصل الاتصال الفوري! 🔌",
      "تحذير: تحميل زائد في الطاقة! 🔥"
    ],
    gameOverrides: {
      MONOPOLY: {
        currencyName: "كريديت نيون",
        boardTitle: "احتكار قطاعات نايت سيتي 2077 🏙️",
        cornerTitles: {
          go: "تحديث النظام والراتب 🏁",
          jail: "معتقل الميغاكورب الرقمي ⛓️",
          freeParking: "محطة الشحن الآمنة 🅿️",
          goToJail: "تطويق أمني ومصادرة 🚨"
        },
        districts: {
          BROWN: {
            name: "أحياء الخردة السفلية",
            tiles: ["سوق الهكرز الأسود", "أزقة النفايات الإلكترونية"]
          },
          LIGHT_BLUE: {
            name: "منطقة المعامل والشرائح",
            tiles: ["مختبر النانو تكنولوجي", "مصنع الرقائق الحيوية"]
          },
          PINK: {
            name: "شارع النيون الترفيهي",
            tiles: ["ملاهي الواقع الافتراضي", "نادي الماتريكس الصاخب"]
          },
          ORANGE: {
            name: "مجمعات الأجهزة والدرونز",
            tiles: ["محطة شحن الدرونز", "مستودع الأطراف السيبرانية"]
          },
          RED: {
            name: "أبراج التعدين الرقمي",
            tiles: ["مزرعة العملات المشفرة", "برج البيانات السحابية"]
          },
          YELLOW: {
            name: "مقرات الأمن السيبراني",
            tiles: ["مركز حماية الجدار الناري", "بوابة التشفير الكمومي"]
          },
          GREEN: {
            name: "جزر النخبة البيولوجية",
            tiles: ["حدائق النانو المغلقة", "مجمع الصفوة السكني"]
          },
          DARK_BLUE: {
            name: "قمة أبراج الميغاكورب",
            tiles: ["برج سينثيكورب المالي", "قمة أراكا القابضة 🏙️"]
          },
          STATION: {
            name: "القطار المغناطيسي فائق السرعة",
            tiles: ["هايبرلوب النيون المعلق 🚄"]
          },
          UTILITY: {
            name: "مفاعل الاندماج النووي",
            tiles: ["محطة طاقة البلازما المركزية ⚡"]
          }
        }
      },
      LUDO: {
        yardBases: {
          green: "قاعدة الهكرز الخضراء 🟢",
          yellow: "معمل النانو الأصفر 🟡",
          blue: "برج الميغاكورب الأزرق 🔵",
          red: "عصابة النيون الحمراء 🔴"
        },
        safeStarTitle: "بوابة الجدار الناري الآمن ⭐️",
        trailName: "مسار شبكة الألياف الضوئية",
        currencyName: "بايت",
        homeTitle: "الخادم المركزي 🌐"
      },
      SNAKES: {
        trailName: "اختراق جدران الحماية الرقمية",
        ladderTheme: "مصعد كمومي خارق ⚡",
        snakeTheme: "فيروس فدية مدمر 👾",
        currencyName: "بيانات مشفرة"
      },
      UNO: {
        cardDeckTheme: "بطاقات التشفير والاختراق",
        currencyName: "كريديت",
        wildCardNames: {
          wild: "تجاوز النظام الشامل (جوكر)",
          wildDrawFour: "هجوم الحرمان الشامل (+4)",
          drawTwo: "حقن بيانات ضارة (+2)",
          skip: "تعطيل جدار الحماية (تخطي)",
          reverse: "انعكاس الإشارة (عكس)"
        }
      },
      RISK: {
        currencyName: "درون حربي",
        armyUnits: ["درونات هجومية", "سايبورغ مصفح", "روبوتات ميكانيكية", "مقاتلات نفاثة"],
        factionNames: ["نقابة الهكرز", "تحالف الميغاكورب", "ثوار النيون", "أمن نايت سيتي"],
        territoryAdjective: "قطاع شبكي"
      },
      MAFIA: {
        currencyName: "مفتاح تشفير",
        rolesTitles: {
          investigator: "ضابط التحقيق السيبراني 🕵️‍♂️",
          spy: "الفيروس المزروع المندس 👾",
          citizen: "مبرمج شبكات مسالم 👨‍💻",
          doctor: "خبير صيانة الأنظمة 🛠️"
        }
      }
    }
  },

  DEEP_SPACE: {
    id: "DEEP_SPACE",
    titleAr: "مستكشفو الفضاء السحيق",
    subtitleAr: "غزو المجرة والمحطات المدارية الكونية السحيقة",
    icon: "🌌",
    badge: "خيال علمي",
    visualStyle: "SPACE",
    colorPalette: {
      primary: "#8B5CF6",
      accent: "#38BDF8",
      bgGradient: "from-black via-slate-950 to-indigo-950",
      boardTint: "#050814",
      glowColor: "rgba(139,92,246,0.6)"
    },
    playerTokens: [
      "مكوك مداري 🛸",
      "رائد فضاء 👨‍🚀",
      "قمر صناعي 🛰️",
      "مستكشف Rover 🚜",
      "كويكب بلوري 💎",
      "مذنب مشتعل ☄️"
    ],
    soundscapeProfile: {
      diceShake: "space_gravity_rumble",
      pawnMove: "thruster_burst",
      cardPlay: "warp_drive_whoosh",
      victory: "cosmic_symphony_victory",
      hazard: "hull_breach_warning"
    },
    voiceReactions: [
      "الرحلة إلى ما بعد النجوم! 🚀",
      "جاذبية الثقب الأسود تبتلعك! 🕳️",
      "تم رصد إشارة كائنات فضائية! 👽",
      "سرعة الضوء مفعلة 100%! ✨",
      "نفاد الأكسجين.. استعد للطوارئ! 🛰️",
      "قفزة بين مجرية ناجحة! 🌌"
    ],
    gameOverrides: {
      MONOPOLY: {
        currencyName: "سبيكة كوزميك",
        boardTitle: "استعمار كواكب ومحطات درب التبانة 🌌",
        cornerTitles: {
          go: "محطة الإطلاق المدارية 🏁",
          jail: "سجن الكويكب المعزول ⛓️",
          freeParking: "محطة الفضاء الدولية 🅿️",
          goToJail: "انحراف جاذبي نحو السجن 🚨"
        },
        districts: {
          BROWN: {
            name: "أحزمة الكويكبات القريبة",
            tiles: ["حزام كويبر الصخري", "منجم الحديد الفضائي"]
          },
          LIGHT_BLUE: {
            name: "أقمار الكواكب الغازية",
            tiles: ["قمر كاليستو الجليدي", "محطة تيتان الهيدروكربونية"]
          },
          PINK: {
            name: "مستعمرات كوكب المريخ",
            tiles: ["وادي مارينر الأحمر", "قبة أوليمبوس الاستيطانية"]
          },
          ORANGE: {
            name: "محطات سحب الغاز الكوني",
            tiles: ["مصفاة مدار المشتري", "مرفأ زحل الحلقي"]
          },
          RED: {
            name: "كواكب المنظومات المجاورة",
            tiles: ["كوكب ألفا قنطورس ب", "مستعمرة بروكسيما الصخرية"]
          },
          YELLOW: {
            name: "محطات الطاقة النجمية",
            tiles: ["مصفوفة دايسون الشمسية", "جامع بلازما النجوم"]
          },
          GREEN: {
            name: "عوالم الفردوس المدارية",
            tiles: ["المحيط العائم كيبلر", "كوكب الفردوس 186f"]
          },
          DARK_BLUE: {
            name: "مركز المجرة الإمبراطوري",
            tiles: ["بوابة الثقب الدودي الكبرى", "عاصمة الإمبراطورية الكونية 🌌"]
          },
          STATION: {
            name: "خطوط النقل الفضائي السريع",
            tiles: ["قطار الجاذبية الكوني الفائق 🚀"]
          },
          UTILITY: {
            name: "مفاعلات المادة المظلمة",
            tiles: ["محول المادة المضادة المركزي ⚛️"]
          }
        }
      },
      LUDO: {
        yardBases: {
          green: "محطة أوريون الخضراء 🟢",
          yellow: "مرصد سيريوس الأصفر 🟡",
          blue: "مرفأ كبلر الأزرق 🔵",
          red: "قاعدة أندروميدا الحمراء 🔴"
        },
        safeStarTitle: "حقل الطاقة الكهرومغناطيسي ⭐️",
        trailName: "مسار درب التبانة المداري",
        currencyName: "نواة طاقة",
        homeTitle: "عين المجرة 🌌"
      },
      SNAKES: {
        trailName: "سباق النجاة بين النيازك والمجرات",
        ladderTheme: "ثقب دودي انتقالي 🌌",
        snakeTheme: "دوامة ثقب أسود هابطة 🕳️",
        currencyName: "سنة ضوئية"
      },
      UNO: {
        cardDeckTheme: "بطاقات مناورات الأسطول الفضائي",
        currencyName: "طاقة",
        wildCardNames: {
          wild: "انفجار سوبرنوفا (جوكر)",
          wildDrawFour: "إطلاق أسطول الموت (+4)",
          drawTwo: "شحنة نيزكية (+2)",
          skip: "تشويش راداري (تخطي)",
          reverse: "انعكاس الجاذبية (عكس)"
        }
      },
      RISK: {
        currencyName: "أسطول كوني",
        armyUnits: ["مقاتلات استطلاعية", "طرادات فضائية", "مدمرات بين نجمية", "محطة المعارك الكبرى"],
        factionNames: ["اتحاد الأرض الموحد", "إمبراطورية المجرة", "تحالف الكواكب الحرة", "نقابة قراصنة الفضاء"],
        territoryAdjective: "مجرة"
      },
      MAFIA: {
        currencyName: "شفرة مدارية",
        rolesTitles: {
          investigator: "كابتن المحطة الفضائية 👨‍✈️",
          spy: "المتحول الفضائي المتخفي 👽",
          citizen: "مهندس طاقم السفينة 👨‍🚀",
          doctor: "طبيب الأحياء الكونية 🧪"
        }
      }
    }
  },

  MEDIEVAL_FANTASY: {
    id: "MEDIEVAL_FANTASY",
    titleAr: "عصر الفرسان والتنانين",
    subtitleAr: "ملاحم القلاع والحروب الأسطورية والسيوف الملكية",
    icon: "🏰",
    badge: "ملحمي أسطوري",
    visualStyle: "FANTASY",
    colorPalette: {
      primary: "#10B981",
      accent: "#F59E0B",
      bgGradient: "from-stone-950 via-emerald-950 to-stone-900",
      boardTint: "#0D1F17",
      glowColor: "rgba(16,185,129,0.5)"
    },
    playerTokens: [
      "فارس مصفح 🛡️",
      "تنين أسطوري 🐉",
      "تاج المملكة 👑",
      "ساحر الأبراج 🧙‍♂️",
      "ذئب الشمال 🐺",
      "سيف النصل ⚔️"
    ],
    soundscapeProfile: {
      diceShake: "medieval_metal_cup",
      pawnMove: "armor_clank_step",
      cardPlay: "spell_cast_parchment",
      victory: "royal_trumpets_victory",
      hazard: "dragon_roar_hazard"
    },
    voiceReactions: [
      "لتحيا المملكة العظمى! ⚔️",
      "غدر الفرسان لا يغتفر! 🛡️",
      "احذر زئير التنين في الوادي! 🐉",
      "بقوة السحر والسيف سننتصر! ✨",
      "إلى النصر أو الفناء! 🏰",
      "شرف الفارس أغلى من الذهب! 👑"
    ],
    gameOverrides: {
      MONOPOLY: {
        currencyName: "عملة ذهبية",
        boardTitle: "إقطاعيات وقلاع الممالك السبع 🏰",
        cornerTitles: {
          go: "بوابة القلعة الملكية (البداية) 🏁",
          jail: "برج الزنزانة المظلمة ⛓️",
          freeParking: "استراحة نزل الفرسان 🍺",
          goToJail: "حكم القائد بالأسر 🚨"
        },
        districts: {
          BROWN: {
            name: "قرى المزارعين والحدادين",
            tiles: ["قرية الحدادين الصغرى", "طاحونة القمح القديمة"]
          },
          LIGHT_BLUE: {
            name: "معسكرات حرس الحدود",
            tiles: ["ثكنة رماة السهام", "أبراج المراقبة الخشبية"]
          },
          PINK: {
            name: "غابات الأساطير والسحر",
            tiles: ["غابة الجنيات الساحرة", "مغارة الأقزام السرية"]
          },
          ORANGE: {
            name: "أسواق الميناء والحرير",
            tiles: ["ميناء الفايكنج التجاري", "سوق الحرير والتوابل"]
          },
          RED: {
            name: "أراضي الفرسان والمبارزة",
            tiles: ["ميدان فرسان البطولة", "حصن الدروع الحديدية"]
          },
          YELLOW: {
            name: "أبراج السحرة العالية",
            tiles: ["برج السحر الأرجواني", "مكتبة التعاويذ القديمة"]
          },
          GREEN: {
            name: "وديان التنانين الذهبية",
            tiles: ["وادي التنانين النائمة", "جبل الكنوز الأسطورية"]
          },
          DARK_BLUE: {
            name: "عرش المملكة والإمبراطورية",
            tiles: ["قصر العرش العاجي", "قلعة التاج الملكي الكبرى 🏰"]
          },
          STATION: {
            name: "إسطبلات الجياد الملكية",
            tiles: ["محطة عربات الجياد السريعة 🐎"]
          },
          UTILITY: {
            name: "أفران صهر الدروع",
            tiles: ["مسبك النيران السحرية ⚒️"]
          }
        }
      },
      LUDO: {
        yardBases: {
          green: "عرين التنين الأخضر 🟢",
          yellow: "حصن الفرسان الذهبي 🟡",
          blue: "برج السحرة الأزرق 🔵",
          red: "قلعة المحاربين الحمراء 🔴"
        },
        safeStarTitle: "ملاذ الدرع السحري ⭐️",
        trailName: "طريق الملوك الأسطوري",
        currencyName: "دينار شرف",
        homeTitle: "عرش المملكة 👑"
      },
      SNAKES: {
        trailName: "تسلق برج الساحر المحصن",
        ladderTheme: "سلم سحري طائر ✨",
        snakeTheme: "ثعبان التنين النافث للهب 🐉",
        currencyName: "خطوة شرف"
      },
      UNO: {
        cardDeckTheme: "لفائف ومخطوطات السحر القديم",
        currencyName: "ذهب",
        wildCardNames: {
          wild: "تعويذة الساحر الأكبر (جوكر)",
          wildDrawFour: "غضب التنانين الأربعة (+4)",
          drawTwo: "ضربة فأس مباركة (+2)",
          skip: "تعويذة التجميد (تخطي)",
          reverse: "مرآة العكس السحرية (عكس)"
        }
      },
      RISK: {
        currencyName: "فيلق فرسان",
        armyUnits: ["كتائب المشاة", "فرسان مصفحون", "رماة أقواس طويلة", "تنانين الحصار"],
        factionNames: ["حراس الشمال", "مملكة الفرسان", "حلف الأقزام", "نقابة الظلال"],
        territoryAdjective: "إقطاعية"
      },
      MAFIA: {
        currencyName: "قسم الولاء",
        rolesTitles: {
          investigator: "فارس العدالة والمحقق 🛡️",
          spy: "القاتل المأجور الخائن 🗡️",
          citizen: "قروي مسالم وفيّ 🧑‍🌾",
          doctor: "طبيب الأعشاب الملكي 🧪"
        }
      }
    }
  },

  CARTOON_OFFICE: {
    id: "CARTOON_OFFICE",
    titleAr: "فوضى الدوام المكتبي",
    subtitleAr: "قهوة الصباح، اجتماعات لا تنتهي، ومكائد الموارد البشرية",
    icon: "☕",
    badge: "كوميديا مكتبية",
    visualStyle: "CARTOON_OFFICE",
    colorPalette: {
      primary: "#F97316",
      accent: "#38BDF8",
      bgGradient: "from-stone-950 via-slate-900 to-orange-950",
      boardTint: "#1C1917",
      glowColor: "rgba(249,115,22,0.5)"
    },
    playerTokens: [
      "كوب القهوة ☕",
      "حافظة الملفات 🗂️",
      "كرسي المدير 💺",
      "آلة النسخ 🖨️",
      "بطاقة الدوام 🪪",
      "دونات الاجتماع 🍩"
    ],
    soundscapeProfile: {
      diceShake: "office_mug_rattle",
      pawnMove: "keyboard_click_step",
      cardPlay: "printer_swoosh",
      victory: "office_party_horn",
      hazard: "hr_warning_buzzer"
    },
    voiceReactions: [
      "اجتماع طارئ في غرفة الاجتماعات! ☕",
      "الموارد البشرية تشاهدك الآن! 👀",
      "قهوة الصباح أنقذت الموقف! ☕",
      "ترقية مفاجئة أو إنذار؟! 📋",
      "التقييم السنوي وصل! 📊",
      "استراحة الغداء مقدسة! 🍕"
    ],
    gameOverrides: {
      MONOPOLY: {
        currencyName: "كوب قهوة",
        boardTitle: "احتكار طوابق الشركة ومكاتب المدراء ☕",
        cornerTitles: {
          go: "تسجيل الحضور الصباحي 🏁",
          jail: "غرفة الموارد البشرية ⛓️",
          freeParking: "استراحة الغداء 🍕",
          goToJail: "إنذار رسمي من HR 🚨"
        },
        districts: {
          BROWN: {
            name: "مكاتب المتدربين",
            tiles: ["طاولة المتدربين", "خزانة القرطاسية"]
          },
          LIGHT_BLUE: {
            name: "ممر المكاتب المفتوحة",
            tiles: ["مكتب الاستقبال", "غرفة النسخ والطباعة"]
          },
          PINK: {
            name: "بوفيه القهوة",
            tiles: ["ماكينة القهوة المركزية", "ركن الدونات"]
          },
          ORANGE: {
            name: "أرض المكالمات",
            tiles: ["غرفة الاتصالات", "مكتب خدمة العملاء"]
          },
          RED: {
            name: "طوابق المشاريع",
            tiles: ["غرفة المشروع الأحمر", "قاعة العروض التقديمية"]
          },
          YELLOW: {
            name: "مكاتب الإدارة الوسطى",
            tiles: ["مكتب مدير المنتج", "غرفة التخطيط الاستراتيجي"]
          },
          GREEN: {
            name: "أجنحة التنفيذيين",
            tiles: ["مكتب نائب الرئيس", "جناح كبار التنفيذيين"]
          },
          DARK_BLUE: {
            name: "الطابق التنفيذي الأعلى",
            tiles: ["مكتب الرئيس التنفيذي", "برج مجلس الإدارة 🏢"]
          },
          STATION: {
            name: "مصاعد الشركة السريعة",
            tiles: ["مصعد الطابق التنفيذي 🛗"]
          },
          UTILITY: {
            name: "خدمات المبنى",
            tiles: ["مولد الكهرباء الاحتياطي ⚡"]
          }
        }
      },
      LUDO: {
        yardBases: {
          green: "فريق التسويق الأخضر 🟢",
          yellow: "فريق المبيعات الذهبي 🟡",
          blue: "فريق الهندسة الأزرق 🔵",
          red: "فريق الدعم الأحمر 🔴"
        },
        safeStarTitle: "غرفة اجتماعات محصنة ⭐️",
        trailName: "ممر طوابق الشركة",
        currencyName: "كوب قهوة",
        homeTitle: "مكتب الرئيس التنفيذي 👑"
      },
      SNAKES: {
        trailName: "سباق الترقية بين الطوابق",
        ladderTheme: "مصعد سريع نحو الترقية 🛗",
        snakeTheme: "قرار خفض الميزانية 📉",
        currencyName: "نقطة أداء"
      },
      UNO: {
        cardDeckTheme: "بطاقات مكائد المكتب",
        currencyName: "كوب قهوة",
        wildCardNames: {
          wild: "اجتماع طارئ (جوكر)",
          wildDrawFour: "إعادة هيكلة شاملة (+4)",
          drawTwo: "مهمة عاجلة (+2)",
          skip: "إجازة مرضية (تخطي)",
          reverse: "تحويل المكالمة (عكس)"
        }
      },
      RISK: {
        currencyName: "نقطة نفوذ",
        armyUnits: ["فريق المبيعات", "فريق التطوير", "فريق الدعم", "اللجنة التنفيذية"],
        factionNames: ["تحالف الطابق الثالث", "نقابة القهوة", "فريق المشروع السري", "إدارة المخاطر"],
        territoryAdjective: "قسم"
      },
      MAFIA: {
        currencyName: "صوت ثقة",
        rolesTitles: {
          investigator: "مدقق الحسابات 🕵️",
          spy: "الموظف المندس 🕶️",
          citizen: "موظف مجتهد 👔",
          doctor: "مسؤول القهوة ☕"
        }
      }
    }
  }
};

// 3. دوال الاستعلام والتحويل (Theme Query & Transformer Functions)

/**
 * استرجاع كائن الثيم بالمعرف المحدد، مع الرجوع التلقائي للثيم التراثي ARABIAN_MAJLIS
 */
export function getThemeById(themeId?: string | null): UniversalTheme {
  if (!themeId) {
    return UNIVERSAL_THEMES.ARABIAN_MAJLIS;
  }
  const found = UNIVERSAL_THEMES[themeId as UniversalThemeId];
  return found || UNIVERSAL_THEMES.ARABIAN_MAJLIS;
}

/**
 * استرجاع جميع العوالم والثيمات المتاحة
 */
export function getAllThemes(): UniversalTheme[] {
  return Object.values(UNIVERSAL_THEMES);
}

/**
 * تحديد نمط اللعبة للحزمة من أجل تطبيق الأسماء والعوالم المناسبة
 */
export function detectPackArchetype(
  pack: GeneratedSessionPack
): "MONOPOLY" | "LUDO" | "SNAKES" | "UNO" | "RISK" | "MAFIA" | "GENERIC" {
  // 1. فحص المونوبولي
  if (
    pack.rulesConfig?.ownershipSystem === "BUY_AND_RENT" ||
    pack.tiles.some((t) => t.cornerType !== undefined || t.colorGroup !== undefined) ||
    pack.themeTitle.includes("عقارات") ||
    pack.themeTitle.includes("بنك الحظ") ||
    pack.themeTitle.includes("احتكار")
  ) {
    return "MONOPOLY";
  }

  // 2. فحص السلم والثعبان
  if (
    pack.tiles.some((t) => t.jumpToIndex !== undefined) ||
    pack.themeTitle.includes("السلم") ||
    pack.themeTitle.includes("الثعبان")
  ) {
    return "SNAKES";
  }

  // 3. فحص اللودو
  if (
    (pack.winCondition === "FIRST_TO_FINISH" && pack.rulesConfig?.cardVisibility === "NO_HAND_CARDS") ||
    pack.themeTitle.includes("لودو") ||
    pack.themeTitle.includes("جاكارو")
  ) {
    return "LUDO";
  }

  // 4. فحص الأونو: عناوين صريحة فقط. لا يجوز اعتبار أي حزمة بطاقات
  // مخصصة (CARD_PLAY_ONLY / DECK_BATTLER) لعبة أونو وإعادة تلوينها كأونو.
  if (
    pack.themeTitle.includes("أونو") ||
    pack.themeTitle.includes("Uno") ||
    pack.themeTitle.includes("UNO")
  ) {
    return "UNO";
  }

  // 5. فحص الريسك
  if (
    pack.rulesConfig?.turnMechanism === "TERRITORY_COMMAND" ||
    pack.rulesConfig?.ownershipSystem === "CONQUER_REGIONS" ||
    pack.themeTitle.includes("غزو") ||
    pack.themeTitle.includes("حروب الأقاليم")
  ) {
    return "RISK";
  }

  // 6. فحص المافيا
  if (
    pack.rulesConfig?.turnMechanism === "SOCIAL_DISCUSSION_VOTE" ||
    pack.archetype === "SOCIAL_DEDUCTION" ||
    pack.themeTitle.includes("مافيا") ||
    pack.themeTitle.includes("الجاسوس")
  ) {
    return "MAFIA";
  }

  return "GENERIC";
}

/**
 * محول نقي وغير مُغيّر (Pure Immutable Transformer)
 * يقوم بإعادة إلباس اللعبة بالثيم المختار (الأسماء، العملة، النصوص، أشكال القطع، النمط البصري)
 * مع الحفاظ التام 100% على:
 * - عدد المربعات ومؤشراتها (Tile Indexes & Counts)
 * - أسعار الشراء، قيم الإيجار، مستويات البيوت، وجهات القفز للسلم والثعبان
 * - ميكانيكيات القواعد (RulesConfig) وشروط الفوز (WinCondition)
 * - عدد البطاقات وتأثيراتها البرمجية المباشرة (Card Effects & Actions)
 */
export function applyThemeToGamePack(
  basePack: GeneratedSessionPack,
  themeId: string
): GeneratedSessionPack {
  const theme = getThemeById(themeId);
  // استنساخ عميق يضمن عدم المساس بالكائن الأصلي إطلاقاً
  const cloned: GeneratedSessionPack = JSON.parse(JSON.stringify(basePack));

  const gameType = detectPackArchetype(cloned);

  // تحديث الخصائص العامة للثيم
  cloned.themeId = theme.id;
  cloned.visualStyle = theme.visualStyle;
  cloned.suggestedTokens = [...theme.playerTokens];

  switch (gameType) {
    case "MONOPOLY": {
      const mono = theme.gameOverrides.MONOPOLY;
      cloned.currencyName = mono.currencyName;
      cloned.themeTitle = `${theme.titleAr} - ${mono.boardTitle || "احتكار العقارات"}`;
      cloned.narratorIntro = `مرحباً بكم في ${theme.titleAr}! امتلك القطاعات، ابنِ المنشآت، واجمع الإيجارات بعملة ${mono.currencyName}!`;

      // تحويل المربعات مع حفظ الأرقام والميكانيكا
      cloned.tiles = cloned.tiles.map((tile) => {
        const updatedTile: BoardTile = { ...tile };

        // 1. الزوايا الأيقونية للمونوبولي
        if (updatedTile.cornerType === "GO" || (updatedTile.index === 0 && !updatedTile.colorGroup)) {
          updatedTile.name = mono.cornerTitles.go;
          const goBonus = updatedTile.defaultEffect?.value ?? 200;
          updatedTile.description = `استلم ${goBonus} ${mono.currencyName} مكافأة المرور بالبداية.`;
          return updatedTile;
        }

        if (updatedTile.cornerType === "JAIL" || updatedTile.index === 5) {
          updatedTile.name = mono.cornerTitles.jail;
          updatedTile.description = "زيارة عابرة للمساجين، أو زنزانة للمحتجزين!";
          return updatedTile;
        }

        if (updatedTile.cornerType === "FREE_PARKING" || updatedTile.index === 10) {
          updatedTile.name = mono.cornerTitles.freeParking;
          updatedTile.description = "نقطة استراحة آمنة وخزينة الضرائب والغرامات!";
          return updatedTile;
        }

        if (updatedTile.cornerType === "GO_TO_JAIL" || updatedTile.index === 15) {
          updatedTile.name = mono.cornerTitles.goToJail;
          updatedTile.description = "دورية الشرطة! تُرسل فوراً إلى زنزانة السجن!";
          return updatedTile;
        }

        // 2. المجموعات اللونية والمرافق
        if (updatedTile.colorGroup && mono.districts[updatedTile.colorGroup]) {
          const district = mono.districts[updatedTile.colorGroup];
          const groupTiles = cloned.tiles.filter((t) => t.colorGroup === updatedTile.colorGroup);
          const posInGroup = groupTiles.findIndex((t) => t.index === updatedTile.index);

          if (district.tiles[posInGroup]) {
            updatedTile.name = district.tiles[posInGroup];
          } else {
            updatedTile.name = `${district.name} (${updatedTile.index + 1})`;
          }
          updatedTile.description = `عقار استثماري فاخر ضمن ${district.name}.`;
        }

        return updatedTile;
      });

      // تعديل أسماء ونصوص البطاقات لتواكب العملة مع ثبات التأثيرات
      cloned.cardsDeck = cloned.cardsDeck.map((card) => {
        const updatedCard: GameCard = {
          ...card,
          flavorText: card.flavorText.replace(/ريال(اً)?|ريالات/g, mono.currencyName)
        };
        return updatedCard;
      });
      break;
    }

    case "LUDO": {
      const ludo = theme.gameOverrides.LUDO;
      cloned.currencyName = ludo.currencyName;
      cloned.themeTitle = `${theme.titleAr} - ${ludo.trailName}`;
      cloned.narratorIntro = `مرحباً بكم في سباق ${ludo.trailName}! أخرج قطعك، احمِ موقعك في ${ludo.safeStarTitle}، وكن أول من يصل إلى ${ludo.homeTitle}!`;

      cloned.tiles = cloned.tiles.map((tile) => {
        const updatedTile: BoardTile = { ...tile };

        if (updatedTile.index === 0) {
          updatedTile.name = `معسكر البداية (${ludo.trailName})`;
          return updatedTile;
        }

        const nameLower = updatedTile.name.toLowerCase();
        if (nameLower.includes("أخضر") || nameLower.includes("green") || updatedTile.index === 1) {
          updatedTile.name = ludo.yardBases.green;
        } else if (nameLower.includes("أحمر") || nameLower.includes("red") || updatedTile.index === 8) {
          updatedTile.name = ludo.yardBases.red;
        } else if (nameLower.includes("أصفر") || nameLower.includes("yellow") || updatedTile.index === 13) {
          updatedTile.name = ludo.yardBases.yellow;
        } else if (nameLower.includes("أزرق") || nameLower.includes("blue")) {
          updatedTile.name = ludo.yardBases.blue;
        } else if (nameLower.includes("نجم") || nameLower.includes("أمان") || nameLower.includes("star")) {
          updatedTile.name = `${ludo.safeStarTitle} #${updatedTile.index + 1}`;
        }

        return updatedTile;
      });
      break;
    }

    case "SNAKES": {
      const snakes = theme.gameOverrides.SNAKES;
      cloned.currencyName = snakes.currencyName;
      cloned.themeTitle = `${theme.titleAr} - ${snakes.trailName}`;
      cloned.narratorIntro = `سباق نحو قمة ${snakes.trailName}! تسلق ${snakes.ladderTheme} واحذر السقوط مع ${snakes.snakeTheme}!`;

      cloned.tiles = cloned.tiles.map((tile) => {
        const updatedTile: BoardTile = { ...tile };

        if (updatedTile.index === 0) {
          updatedTile.name = `بوابة الانطلاق (${snakes.trailName})`;
          return updatedTile;
        }

        if (updatedTile.jumpToIndex !== undefined) {
          if (updatedTile.jumpToIndex > updatedTile.index) {
            // سلم صاعد (Ladder)
            updatedTile.name = `${snakes.ladderTheme} (المربع ${updatedTile.index + 1})`;
            updatedTile.description = `اصعد فوراً إلى المربع #${updatedTile.jumpToIndex + 1}!`;
          } else if (updatedTile.jumpToIndex < updatedTile.index) {
            // ثعبان هابط (Snake)
            updatedTile.name = `${snakes.snakeTheme} (المربع ${updatedTile.index + 1})`;
            updatedTile.description = `تراجع فوراً إلى المربع #${updatedTile.jumpToIndex + 1}!`;
          }
        }

        return updatedTile;
      });
      break;
    }

    case "UNO": {
      const uno = theme.gameOverrides.UNO;
      cloned.currencyName = uno.currencyName;
      // إبقاء «أونو» في العنوان ضروري لاكتشاف المحرك بعد إعادة التلوين:
      // كل من GameEngineRegistry وdetectPackArchetype يعتمد على عنوان صريح.
      cloned.themeTitle = `${theme.titleAr} - ${uno.cardDeckTheme} (أونو)`;
      cloned.narratorIntro = `تحدي السرعة والتكتيك في ${theme.titleAr}! العب أوراقك بذكاء واجمع ${cloned.targetScore || 350} ${uno.currencyName} لتفوز!`;

      // مواءمة أسماء البطاقات التكتيكية مع المحافظة التامة على الـ Effects
      cloned.cardsDeck = cloned.cardsDeck.map((card) => {
        const updatedCard: GameCard = { ...card };
        const titleLower = updatedCard.title.toLowerCase();

        if (titleLower.includes("+4") || titleLower.includes("سحب 4")) {
          updatedCard.title = `${uno.wildCardNames.wildDrawFour} 🃏`;
        } else if (titleLower.includes("جوكر") || titleLower.includes("wild")) {
          updatedCard.title = `${uno.wildCardNames.wild} 🃏`;
        } else if (titleLower.includes("+2") || titleLower.includes("سحب 2")) {
          updatedCard.title = `${uno.wildCardNames.drawTwo} ⚡`;
        } else if (titleLower.includes("تخطي") || titleLower.includes("skip")) {
          updatedCard.title = `${uno.wildCardNames.skip} 🛑`;
        } else if (titleLower.includes("عكس") || titleLower.includes("reverse")) {
          updatedCard.title = `${uno.wildCardNames.reverse} 🔄`;
        }

        return updatedCard;
      });
      break;
    }

    case "RISK": {
      const risk = theme.gameOverrides.RISK;
      cloned.currencyName = risk.currencyName;
      cloned.themeTitle = `${theme.titleAr} - حروب ${risk.territoryAdjective}`;
      cloned.narratorIntro = `قُد ${risk.armyUnits[0]} لاحتلال الخريطة! سيطر على كل ${risk.territoryAdjective} وكن القائد المنتصر!`;
      break;
    }

    case "MAFIA": {
      const mafia = theme.gameOverrides.MAFIA;
      cloned.currencyName = mafia.currencyName;
      cloned.themeTitle = `${theme.titleAr} - صراع الثقة والتحقيق`;
      cloned.narratorIntro = `بيننا ${mafia.rolesTitles.spy}! تناقشوا بصوت عالٍ واكشفوا الحقيقة لحصد ${mafia.currencyName}!`;
      break;
    }

    default: {
      // حزمة مخصصة أو نمط غير مصنف: تحديث المظهر دون المساس بأي ميكانيكا
      break;
    }
  }

  return cloned;
}
