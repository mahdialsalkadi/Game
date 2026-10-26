import type { GameCard, GeneratedSessionPack, BoardTile } from "./schema";

/**
 * حزم الألعاب السريعة الجديدة (كونكت فور، الضامة، بينغو).
 * هذه الألعاب لا تستخدم مربعات لوحة تقليدية ولا بطاقات يد، لكن حزمة
 * الجلسة تبقى متوافقة مع مخطط المنصة الموحّد حتى تعمل مع الغرف والبوتات
 * ونفس مسار البدء والتصفير.
 */

function makeTiles(count: number, label: string): BoardTile[] {
  return Array.from({ length: count }, (_, index) => ({
    index,
    tileType: "RESOURCE" as const,
    name: `${label} ${index + 1}`,
    description: `خانة ${index + 1} من لوحة ${label}.`
  }));
}

function makeCards(key: string): GameCard[] {
  const titles = [
    "انطلاقة قوية",
    "خطة ذكية",
    "ضغط محسوب",
    "فرصة سانحة",
    "تكتيك مفاجئ",
    "دفاع صلب",
    "هجوم خاطف",
    "قراءة الخصم",
    "نقطة تحول",
    "صبر استراتيجي",
    "تحالف مؤقت",
    "مناورة جريئة",
    "استغلال الثغرة",
    "إغلاق محكم",
    "ضربة حاسمة",
    "روح الفريق",
    "تركيز كامل",
    "لحظة الحسم"
  ];

  return titles.map((title, index) => ({
    id: `${key}_card_${index + 1}`,
    title,
    category: "PUBLIC_DRAMA" as const,
    flavorText: `${title} — بطاقة إيقاع سريعة لسهرة ${key}.`,
    effects: [
      {
        actionType: "MODIFY_COINS" as const,
        targetType: "SELF" as const,
        value: 0
      }
    ]
  }));
}

function buildPack(input: {
  key: string;
  themeTitle: string;
  currencyName: string;
  narratorIntro: string;
  tileCount: number;
  tileLabel: string;
  turnMechanism: "GRID_PLACEMENT" | "CHECKERS_MOVE" | "BINGO_CALL";
  suggestedTokens: string[];
}): GeneratedSessionPack {
  return {
    key: input.key,
    themeId: input.key,
    themeTitle: input.themeTitle,
    visualStyle: "ANCIENT_ARABIA",
    archetype: "BOARD_RACE",
    rulesConfig: {
      turnMechanism: input.turnMechanism,
      cardVisibility: "NO_HAND_CARDS",
      ownershipSystem: "NONE"
    },
    winCondition: "FIRST_TO_FINISH",
    currencyName: input.currencyName,
    narratorIntro: input.narratorIntro,
    tiles: makeTiles(input.tileCount, input.tileLabel),
    cardsDeck: makeCards(input.key),
    suggestedTokens: input.suggestedTokens
  };
}

export const CONNECT_FOUR_PACK: GeneratedSessionPack = buildPack({
  key: "CONNECT_FOUR",
  themeTitle: "كونكت فور — أربعة على التوالي",
  currencyName: "قرص",
  narratorIntro:
    "مرحباً بكم في كونكت فور! أسقط أقراصك في الأعمدة واصنع خطاً من أربعة قبل خصمك. لا نرد، لا حظ — تكتيك خالص!",
  tileCount: 42,
  tileLabel: "خانة كونكت",
  turnMechanism: "GRID_PLACEMENT",
  suggestedTokens: ["قرص أحمر 🔴", "قرص أصفر 🟡", "قرص أزرق 🔵", "قرص أخضر 🟢"]
});

export const CHECKERS_PACK: GeneratedSessionPack = buildPack({
  key: "CHECKERS_CLASSIC",
  themeTitle: "الضامة الكلاسيكية — صراع المربعات",
  currencyName: "قطعة",
  narratorIntro:
    "أهلاً بكم في الضامة! تحرّك قطعتك قطرياً، اقفز فوق خصمك، وتوّج قطعتك ملكاً. الأكل إجباري، والفوز لمن يبقى له جيش!",
  tileCount: 64,
  tileLabel: "مربع الضامة",
  turnMechanism: "CHECKERS_MOVE",
  suggestedTokens: ["قطعة بيضاء ⚪", "قطعة سوداء ⚫", "تاج الملك 👑", "درع الحماية 🛡️"]
});

export const BINGO_PACK: GeneratedSessionPack = buildPack({
  key: "BINGO_NIGHT",
  themeTitle: "بينغو السهرة — أول خط يفوز",
  currencyName: "كرة",
  narratorIntro:
    "ليلة البينغو! اسحب الأرقام، علّم بطاقتك، وأكمل أول خط أفقي أو عمودي أو قطري قبل الجميع. الحظ معك!",
  tileCount: 75,
  tileLabel: "كرة بينغو",
  turnMechanism: "BINGO_CALL",
  suggestedTokens: ["كرة بينغو 🎱", "بطاقة بينغو 🎟️", "نجمة الحظ ⭐", "كأس الفوز 🏆"]
});
