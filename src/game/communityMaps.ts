import type { GeneratedSessionPack } from "./schema";
import {
  RIYADH_VIP_MONOPOLY_PACK,
  ORIGINAL_CLASSIC_MONOPOLY_PACK
} from "./monopolyEngine";
import { PRESET_PACKS } from "./aiPackGenerator";
import { getThemeById, applyThemeToGamePack } from "./themeRegistry";

export interface CommunityMapItem {
  id: string;
  presetKey: string;
  titleAr: string;
  subtitleAr: string;
  creatorAr: string;
  creatorBadgeAr: string;
  rating: number;
  reviewsCount: number;
  downloadsCount: number;
  badge: string;
  category: "MONOPOLY" | "RACE" | "TACTICAL" | "WAR" | "PARTY";
  themeId: string;
  pack: GeneratedSessionPack;
  descriptionAr: string;
  highlights: string[];
  colorScheme: {
    bgGradient: string;
    border: string;
    badgeBg: string;
    glow: string;
    accent: string;
  };
  rulesPreview: {
    board: string;
    mechanism: string;
    currency: string;
  };
}

/**
 * Community Maps & Mods Registry
 * Custom modifications and community-authored maps built on top of the authentic game engines.
 */
const cloneCommunityPack = (pack: GeneratedSessionPack): GeneratedSessionPack =>
  JSON.parse(JSON.stringify(pack)) as GeneratedSessionPack;

export const COMMUNITY_MAPS: CommunityMapItem[] = [
  {
    id: "community_riyadh_vip",
    presetKey: "RIYADH_VIP",
    titleAr: "عقارات الرياض الفاخرة (Riyadh VIP)",
    subtitleAr: "أحياء العاصمة والبوليفارد ومركز KAFD",
    creatorAr: "مجتمع الرياض للاعبين 🇸🇦",
    creatorBadgeAr: "صانع معتمد ⭐",
    rating: 4.9,
    reviewsCount: 384,
    downloadsCount: 14850,
    badge: "ماب المجتمع #1 🔥",
    category: "MONOPOLY",
    themeId: "ARABIAN_MAJLIS",
    pack: cloneCommunityPack(RIYADH_VIP_MONOPOLY_PACK),
    descriptionAr: "النسخة السعودية الفاخرة لمونوبولي: العليا والتحلية والملز والبوليفارد ومركز الملك عبدالله المالي KAFD مع ديوراما برج المملكة ثلاثية الأبعاد والتعامل بالريال السعودي!",
    highlights: [
      "شوارع وأحياء الرياض الحقيقية",
      "ديوراما برج المملكة والفيصلية 3D",
      "أوراق نقدية حقيقية للريال السعودي",
      "صندوق الحظ وفرص استثمارية محلية"
    ],
    colorScheme: {
      bgGradient: "from-amber-950/80 via-slate-900 to-amber-900/50",
      border: "border-amber-500/50 hover:border-amber-400",
      badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      glow: "shadow-[0_0_35px_rgba(245,158,11,0.25)]",
      accent: "text-amber-400"
    },
    rulesPreview: {
      board: "20 مربع أحياء الرياض",
      mechanism: "نرد وتملك واستثمار",
      currency: "ريال سعودي (SAR)"
    }
  },
  {
    id: "community_cyberpunk_neon",
    presetKey: "CYBERPUNK_HEIST",
    titleAr: "سايبربانك 2088 نيون (Cyberpunk Neon)",
    subtitleAr: "صراع الهاكرز والشركات العملاقة في شوارع المستقبل",
    creatorAr: "CyberDeck Studio ⚡",
    creatorBadgeAr: "نخبة المصممين 🤖",
    rating: 4.8,
    reviewsCount: 215,
    downloadsCount: 9400,
    badge: "خريطة مضافة ⚡",
    category: "MONOPOLY",
    themeId: "CYBERPUNK_NEON",
    pack: applyThemeToGamePack(ORIGINAL_CLASSIC_MONOPOLY_PACK, "CYBERPUNK_NEON"),
    descriptionAr: "شوارع النيون المشعة ومقرات السايبر! احتكر قطاعات الخوادم والذكاء الاصطناعي، تداول بعملة الكريبتو الرقمية، وتجنب فخاخ الرقابة الإلكترونية.",
    highlights: [
      "أبراج نيون ليزرية متوهجة",
      "عملة الكريبتو والشرائح المشفرة",
      "مؤثرات صوتية إلكترونية وسينثسايزر",
      "عبارات تفاعل سايبربانك عربية"
    ],
    colorScheme: {
      bgGradient: "from-fuchsia-950/80 via-slate-900 to-cyan-950/50",
      border: "border-cyan-500/50 hover:border-cyan-400",
      badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      glow: "shadow-[0_0_35px_rgba(6,182,212,0.25)]",
      accent: "text-cyan-400"
    },
    rulesPreview: {
      board: "شبكة النيون وسيرفرات المستقبل",
      mechanism: "شراء سيرفرات وتعدين",
      currency: "كريبتو (BTC/CR)"
    }
  },
  {
    id: "community_deep_space",
    presetKey: "DEEP_SPACE_CUSTOM",
    titleAr: "غزو المجرة وفضاء النجوم (Deep Space)",
    subtitleAr: "استعمار الكواكب ومحطات المدار الكونية",
    creatorAr: "AstroGamers 🚀",
    creatorBadgeAr: "فريق الإبداع الفلكي 🌌",
    rating: 4.9,
    reviewsCount: 198,
    downloadsCount: 8200,
    badge: "خريطة مضافة 🌌",
    category: "MONOPOLY",
    themeId: "DEEP_SPACE",
    pack: applyThemeToGamePack(ORIGINAL_CLASSIC_MONOPOLY_PACK, "DEEP_SPACE"),
    descriptionAr: "رحلة ملحمية بين النجوم! استولِ على الموانئ الفضائية ومفاعلات الطاقة الكونية، استثمر بنواة الطاقة، واحذر الثقوب السوداء وأسراب النيازك.",
    highlights: [
      "محطات مدارية وأقمار صناعية",
      "نواة الطاقة والمحركات الذرية",
      "صوتيات فضاء وترددات كونية عميقة",
      "شخصيات رواد فضاء ومركبات مكوكية"
    ],
    colorScheme: {
      bgGradient: "from-blue-950/80 via-slate-900 to-purple-950/50",
      border: "border-blue-500/50 hover:border-blue-400",
      badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      glow: "shadow-[0_0_35px_rgba(59,130,246,0.25)]",
      accent: "text-blue-400"
    },
    rulesPreview: {
      board: "حزام الكويكبات ومحطات المدار",
      mechanism: "استعمار كواكب ونرد كوني",
      currency: "نواة طاقة (Energy)"
    }
  },
  {
    id: "community_medieval",
    presetKey: "MEDIEVAL_CUSTOM",
    titleAr: "عصر الفرسان والتنانين (Medieval Realms)",
    subtitleAr: "ملاحم القلاع وحروب الحصار والتيجان الذهبية",
    creatorAr: "Guild of Lords ⚔️",
    creatorBadgeAr: "فرسان المجلس 🛡️",
    rating: 4.7,
    reviewsCount: 164,
    downloadsCount: 7100,
    badge: "خريطة مضافة 🏰",
    category: "MONOPOLY",
    themeId: "MEDIEVAL_FANTASY",
    pack: applyThemeToGamePack(ORIGINAL_CLASSIC_MONOPOLY_PACK, "MEDIEVAL_FANTASY"),
    descriptionAr: "عالم القلاع والفرسان الأسطوري! ابنِ الحصون والأبراج الملكية، اجمع الجزية بالتيجان الذهبية، واحذر نيران التنانين وغدر قطاع الطرق.",
    highlights: [
      "قلاع وحصون حجرية أصيلة",
      "تيجان ذهبية وعملات فضية",
      "أبواق حربية ورنين دروع وسيوف",
      "شخصيات فرسان وسحرة وتنانين"
    ],
    colorScheme: {
      bgGradient: "from-yellow-950/80 via-slate-900 to-amber-950/50",
      border: "border-amber-600/50 hover:border-amber-500",
      badgeBg: "bg-amber-600/20 text-amber-200 border-amber-600/30",
      glow: "shadow-[0_0_35px_rgba(217,119,6,0.25)]",
      accent: "text-amber-400"
    },
    rulesPreview: {
      board: "أراضي المملكة وممرات القلاع",
      mechanism: "حصون وجزية ونرد فرسان",
      currency: "تاج ذهبي (Gold)"
    }
  },
  {
    id: "community_sultanate",
    presetKey: "SULTANATE_MERCHANTS",
    titleAr: "تجار السلطنة وبازار الحرير (Silk Road)",
    subtitleAr: "قوافل التوابل والخان وخزائن الذهب العثمانية",
    creatorAr: "تراث الشرق 🕌",
    creatorBadgeAr: "مؤرخو التراث 📜",
    rating: 4.8,
    reviewsCount: 142,
    downloadsCount: 6500,
    badge: "خريطة مضافة 🕌",
    category: "MONOPOLY",
    themeId: "ARABIAN_MAJLIS",
    pack: applyThemeToGamePack(ORIGINAL_CLASSIC_MONOPOLY_PACK, "ARABIAN_MAJLIS"),
    descriptionAr: "تجارة القوافل التاريخية على طريق الحرير! امتلك خانات التجار وبازارات دمشق والقاهرة وبغداد، واجمع الدينار والدرهم في سهرة تراثية أصيلة.",
    highlights: [
      "بازارات تاريخية وقوافل جمال",
      "دنانير ذهبية ودراهم فضية",
      "موسيقى عود وإيقاعات تراثية",
      "صندوق الصفقات والفرمانات"
    ],
    colorScheme: {
      bgGradient: "from-emerald-950/80 via-slate-900 to-teal-950/50",
      border: "border-emerald-600/50 hover:border-emerald-500",
      badgeBg: "bg-emerald-600/20 text-emerald-300 border-emerald-600/30",
      glow: "shadow-[0_0_35px_rgba(16,185,129,0.25)]",
      accent: "text-emerald-400"
    },
    rulesPreview: {
      board: "طريق الحرير وبازارات الشرق",
      mechanism: "مضاربة وقوافل وتملك خانات",
      currency: "دينار ذهبي"
    }
  },
  {
    id: "community_office_mayhem",
    presetKey: "OFFICE_MAYHEM",
    titleAr: "فوضى الدوام المكتبي (Corporate Chaos)",
    subtitleAr: "معارك برادات الشاي وخطابات الإنذار وقهوة الصباح",
    creatorAr: "Corporate Rebels ☕",
    creatorBadgeAr: "موظفو الشهر 👔",
    rating: 4.6,
    reviewsCount: 110,
    downloadsCount: 5200,
    badge: "خريطة مضافة ☕",
    category: "PARTY",
    themeId: "CARTOON_OFFICE",
    pack: applyThemeToGamePack(ORIGINAL_CLASSIC_MONOPOLY_PACK, "CARTOON_OFFICE"),
    descriptionAr: "كوميديا العمل والدوام المكتبي! احتكر مكاتب المدراء وغرف الاجتماعات، احذر قرارات الموارد البشرية (HR)، واجمع أكواب القهوة لتفادي التقييم السلبي!",
    highlights: [
      "مكاتب وبوفيه وغرف اجتماعات",
      "عملة أكواب القهوة والمكافآت",
      "بطاقات إنذارات الموارد البشرية",
      "أجواء فكاهية وضحك جماعي"
    ],
    colorScheme: {
      bgGradient: "from-stone-900 via-slate-900 to-stone-950",
      border: "border-orange-500/40 hover:border-orange-400",
      badgeBg: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      glow: "shadow-[0_0_35px_rgba(249,115,22,0.2)]",
      accent: "text-orange-400"
    },
    rulesPreview: {
      board: "طوابق الشركة والمكاتب",
      mechanism: "نرد وكروت مكايدات وظيفية",
      currency: "أكواب قهوة ☕"
    }
  }
];

export function getCommunityMapByKey(presetKey: string): CommunityMapItem | undefined {
  return COMMUNITY_MAPS.find((m) => m.presetKey === presetKey || m.id === presetKey);
}
