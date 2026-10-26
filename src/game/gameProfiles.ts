/**
 * ملفات تعريف الألعاب (Game Profiles)
 * -----------------------------------
 * مصدر واحد لعدد اللاعبين الأدنى والأقصى وألوان اللاعبين لكل لعبة.
 * يُستخدم من السيرفر (الانضمام، ملء البوتات، بدء اللعبة) ومن الواجهات
 * (تلوين اللاعبين، حد إضافة البوتات، عرض السعة في اللوبي).
 */

export interface GameProfile {
  key: string;
  labelAr: string;
  minPlayers: number;
  maxPlayers: number;
}

export const PLAYER_COLORS = [
  "#EF4444", // أحمر
  "#3B82F6", // أزرق
  "#22C55E", // أخضر
  "#EAB308", // أصفر
  "#A855F7", // بنفسجي
  "#EC4899", // وردي
  "#F97316", // برتقالي
  "#06B6D4", // سماوي
  "#84CC16", // ليموني
  "#6366F1" // نيلي
] as const;

export const MAX_PLAYERS_GLOBAL = PLAYER_COLORS.length;

export const BOT_NAMES = [
  "فهد 🤖",
  "نورة 🤖",
  "سعود 🤖",
  "سارة 🤖",
  "ريان 🤖",
  "دحوم 🤖",
  "لمى 🤖",
  "بدر 🤖",
  "غادة 🤖",
  "تركي 🤖"
] as const;

export function getPlayerColor(index: number): string {
  return PLAYER_COLORS[((index % PLAYER_COLORS.length) + PLAYER_COLORS.length) % PLAYER_COLORS.length];
}

export function getBotName(index: number): string {
  return BOT_NAMES[((index % BOT_NAMES.length) + BOT_NAMES.length) % BOT_NAMES.length];
}

export const GAME_PROFILES: Record<string, GameProfile> = {
  MONOPOLY_CLASSIC: {
    key: "MONOPOLY_CLASSIC",
    labelAr: "مونوبولي كلاسيك",
    minPlayers: 2,
    maxPlayers: 8
  },
  RIYADH_VIP: {
    key: "RIYADH_VIP",
    labelAr: "عقارات الرياض",
    minPlayers: 2,
    maxPlayers: 8
  },
  DEEP_SPACE_CUSTOM: {
    key: "DEEP_SPACE_CUSTOM",
    labelAr: "غزو المجرة",
    minPlayers: 2,
    maxPlayers: 8
  },
  MEDIEVAL_CUSTOM: {
    key: "MEDIEVAL_CUSTOM",
    labelAr: "عصر الفرسان",
    minPlayers: 2,
    maxPlayers: 8
  },
  ANCIENT_SULTANATE: {
    key: "ANCIENT_SULTANATE",
    labelAr: "تجار السلطنة",
    minPlayers: 2,
    maxPlayers: 8
  },
  SULTANATE_MERCHANTS: {
    key: "SULTANATE_MERCHANTS",
    labelAr: "تجار السلطنة",
    minPlayers: 2,
    maxPlayers: 8
  },
  CYBERPUNK_HEIST: {
    key: "CYBERPUNK_HEIST",
    labelAr: "سايبربانك",
    minPlayers: 2,
    maxPlayers: 8
  },
  OFFICE_MAYHEM: {
    key: "OFFICE_MAYHEM",
    labelAr: "فوضى المكتب",
    minPlayers: 2,
    maxPlayers: 8
  },
  LUDO_CLASSIC: {
    key: "LUDO_CLASSIC",
    labelAr: "لودو المجلس",
    minPlayers: 2,
    maxPlayers: 4
  },
  TACTICAL_CARDS_UNO: {
    key: "TACTICAL_CARDS_UNO",
    labelAr: "أونو",
    minPlayers: 2,
    maxPlayers: 10
  },
  SNAKES_AND_LADDERS_RPG: {
    key: "SNAKES_AND_LADDERS_RPG",
    labelAr: "السلم والثعبان",
    minPlayers: 2,
    maxPlayers: 8
  },
  WORLD_CONQUEST_RISK: {
    key: "WORLD_CONQUEST_RISK",
    labelAr: "غزو العالم",
    minPlayers: 2,
    maxPlayers: 8
  },
  SOCIAL_MAFIA_SPY: {
    key: "SOCIAL_MAFIA_SPY",
    labelAr: "مافيا وجاسوس",
    minPlayers: 5,
    maxPlayers: 10
  },
  CONNECT_FOUR: {
    key: "CONNECT_FOUR",
    labelAr: "كونكت فور",
    minPlayers: 2,
    maxPlayers: 2
  },
  CHECKERS_CLASSIC: {
    key: "CHECKERS_CLASSIC",
    labelAr: "الضامة",
    minPlayers: 2,
    maxPlayers: 2
  },
  BINGO_NIGHT: {
    key: "BINGO_NIGHT",
    labelAr: "بينغو السهرة",
    minPlayers: 2,
    maxPlayers: 8
  },
  GENERIC_BOARD: {
    key: "GENERIC_BOARD",
    labelAr: "لعبة مخصصة",
    minPlayers: 2,
    maxPlayers: 8
  }
};

const DEFAULT_PROFILE: GameProfile = GAME_PROFILES.GENERIC_BOARD;

/** استنتاج مفتاح اللعبة من حزمة الجلسة عند غياب presetKey. */
export function detectGameKey(pack?: {
  key?: string;
  isLudo?: boolean;
  ludoState?: unknown;
  unoState?: unknown;
  themeTitle?: string;
  rulesConfig?: {
    turnMechanism?: string;
    ownershipSystem?: string;
  };
  archetype?: string;
  themeId?: string;
}): string {
  if (!pack) return DEFAULT_PROFILE.key;
  if (typeof pack.key === "string" && GAME_PROFILES[pack.key]) {
    return pack.key;
  }
  if (pack.unoState) {
    return "TACTICAL_CARDS_UNO";
  }
  if (
    typeof pack.themeTitle === "string" &&
    (pack.themeTitle.includes("أونو") ||
      pack.themeTitle.includes("Uno") ||
      pack.themeTitle.includes("UNO"))
  ) {
    return "TACTICAL_CARDS_UNO";
  }
  if (pack.isLudo || pack.ludoState) {
    return "LUDO_CLASSIC";
  }
  const mechanism = pack.rulesConfig?.turnMechanism;
  if (mechanism === "TERRITORY_COMMAND") return "WORLD_CONQUEST_RISK";
  if (mechanism === "SOCIAL_DISCUSSION_VOTE") return "SOCIAL_MAFIA_SPY";
  if (mechanism === "DICE_AND_MOVE_100") return "SNAKES_AND_LADDERS_RPG";
  if (pack.rulesConfig?.ownershipSystem === "BUY_AND_RENT") {
    return "MONOPOLY_CLASSIC";
  }
  return DEFAULT_PROFILE.key;
}

/**
 * يرجع ملف تعريف اللعبة من مفتاح القالب إن وُجد، وإلا يستنتجه من الحزمة.
 */
export function resolveGameProfile(
  presetKey?: string,
  pack?: Parameters<typeof detectGameKey>[0]
): GameProfile {
  if (presetKey && GAME_PROFILES[presetKey]) {
    return GAME_PROFILES[presetKey];
  }
  return GAME_PROFILES[detectGameKey(pack)] || DEFAULT_PROFILE;
}

/** الحد الآمن لأي غرفة قبل معرفة اللعبة المختارة. */
export function clampPlayerCount(profile: GameProfile, count: number): number {
  return Math.max(profile.minPlayers, Math.min(profile.maxPlayers, count));
}
