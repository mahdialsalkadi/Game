import type { BoardTile, GameCard, GeneratedSessionPack } from "./schema";

export type MonopolyColorGroupKey =
  | "BROWN"
  | "LIGHT_BLUE"
  | "PINK"
  | "ORANGE"
  | "RED"
  | "YELLOW"
  | "GREEN"
  | "DARK_BLUE"
  | "STATION"
  | "UTILITY";

export interface ColorGroupConfig {
  key: MonopolyColorGroupKey;
  nameAr: string;
  colorHex: string;
  headerBg: string;
  textColor: string;
  borderColor: string;
  houseCost: number;
}

export const MONOPOLY_COLOR_GROUPS: Record<MonopolyColorGroupKey, ColorGroupConfig> = {
  BROWN: {
    key: "BROWN",
    nameAr: "البني (حي الديرة والبطحاء)",
    colorHex: "#843E23",
    headerBg: "bg-amber-950",
    textColor: "text-amber-200",
    borderColor: "border-amber-700/60",
    houseCost: 50
  },
  LIGHT_BLUE: {
    key: "LIGHT_BLUE",
    nameAr: "الأزرق السماوي (الملز والمربع)",
    colorHex: "#188AA3",
    headerBg: "bg-cyan-900",
    textColor: "text-cyan-200",
    borderColor: "border-cyan-500/50",
    houseCost: 50
  },
  PINK: {
    key: "PINK",
    nameAr: "الوردي (السليمانية والورود)",
    colorHex: "#B8256E",
    headerBg: "bg-pink-950",
    textColor: "text-pink-200",
    borderColor: "border-pink-500/50",
    houseCost: 100
  },
  ORANGE: {
    key: "ORANGE",
    nameAr: "البرتقالي (الملك فهد والعليا)",
    colorHex: "#D96B14",
    headerBg: "bg-orange-950",
    textColor: "text-orange-200",
    borderColor: "border-orange-500/50",
    houseCost: 100
  },
  RED: {
    key: "RED",
    nameAr: "الأحمر (النخيل والملقا)",
    colorHex: "#A81B24",
    headerBg: "bg-red-950",
    textColor: "text-red-200",
    borderColor: "border-red-500/50",
    houseCost: 150
  },
  YELLOW: {
    key: "YELLOW",
    nameAr: "الأصفر (حطين والياسمين)",
    colorHex: "#D4A017",
    headerBg: "bg-amber-900",
    textColor: "text-amber-200",
    borderColor: "border-amber-400/50",
    houseCost: 150
  },
  GREEN: {
    key: "GREEN",
    nameAr: "الأخضر (البوليفارد والدرعية)",
    colorHex: "#1A7D42",
    headerBg: "bg-emerald-950",
    textColor: "text-emerald-200",
    borderColor: "border-emerald-500/50",
    houseCost: 200
  },
  DARK_BLUE: {
    key: "DARK_BLUE",
    nameAr: "الكحلي الفاخر (برج المملكة و KAFD)",
    colorHex: "#12488B",
    headerBg: "bg-blue-950",
    textColor: "text-blue-200",
    borderColor: "border-blue-500/50",
    houseCost: 200
  },
  STATION: {
    key: "STATION",
    nameAr: "المحطات والقطارات",
    colorHex: "#334155",
    headerBg: "bg-slate-900",
    textColor: "text-slate-200",
    borderColor: "border-slate-500/50",
    houseCost: 0
  },
  UTILITY: {
    key: "UTILITY",
    nameAr: "الخدمات والمرافق",
    colorHex: "#B45309",
    headerBg: "bg-amber-950",
    textColor: "text-amber-200",
    borderColor: "border-amber-500/50",
    houseCost: 0
  }
};

/**
 * Checks if a player owns all properties of a specific color group.
 */
export function checkColorMonopoly(
  tiles: BoardTile[],
  ownerId: string,
  colorGroup: string
): boolean {
  if (!ownerId || !colorGroup) return false;
  const groupTiles = tiles.filter((t) => t.colorGroup === colorGroup);
  if (groupTiles.length === 0) return false;
  return groupTiles.every((t) => t.ownerId === ownerId);
}

/**
 * Returns list of color groups in which the player has achieved a full monopoly.
 */
export function getPlayerMonopolies(
  tiles: BoardTile[],
  playerId: string
): MonopolyColorGroupKey[] {
  if (!playerId) return [];
  const monopolies: MonopolyColorGroupKey[] = [];
  const groups = Object.keys(MONOPOLY_COLOR_GROUPS) as MonopolyColorGroupKey[];

  for (const group of groups) {
    if (group === "STATION" || group === "UTILITY") continue;
    if (checkColorMonopoly(tiles, playerId, group)) {
      monopolies.push(group);
    }
  }
  return monopolies;
}

/**
 * Calculates authentic escalating rent:
 * - Unimproved: Base rent
 * - Full color group monopoly with 0 houses: 2x Base rent!
 * - 1 house: ~3x Base rent
 * - 2 houses: ~6x Base rent
 * - 3 houses: ~10x Base rent
 * - 4 houses: ~14x Base rent
 * - Hotel (level 5): ~20x Base rent
 */
export function calculateMonopolyRent(
  tile: BoardTile,
  allTiles: BoardTile[]
): number {
  const baseRent = tile.rent || Math.max(10, Math.floor((tile.price || 100) * 0.25));
  if (!tile.ownerId) return baseRent;

  const houses = tile.houses || 0;
  if (houses === 0) {
    const hasMonopoly = tile.colorGroup
      ? checkColorMonopoly(allTiles, tile.ownerId, tile.colorGroup)
      : false;
    return hasMonopoly ? baseRent * 2 : baseRent;
  }

  // Use custom rent tiers if explicitly configured on tile for houses >= 1
  if (tile.rentTiers && houses > 0) {
    const tierIndex = Math.min(houses, tile.rentTiers.length - 1);
    if (tile.rentTiers[tierIndex] !== undefined) {
      return tile.rentTiers[tierIndex];
    }
  }

  // Escalating house multipliers
  switch (houses) {
    case 1:
      return Math.round(baseRent * 3);
    case 2:
      return Math.round(baseRent * 6);
    case 3:
      return Math.round(baseRent * 10);
    case 4:
      return Math.round(baseRent * 14);
    case 5: // Hotel
      return Math.round(baseRent * 20);
    default:
      return baseRent;
  }
}

/**
 * Authentic 20-Tile Monopoly Board definition:
 * Fits rectangular perimeter (6x6 grid perimeter = 20 tiles) with 4 iconic corners:
 * - 0: انطلق (Go)
 * - 5: السجن / زيارة فقط (Jail / Just Visiting)
 * - 10: المواقف المجانية (Free Parking)
 * - 15: اذهب إلى السجن (Go to Jail)
 */
export const AUTHENTIC_MONOPOLY_TILES_20: BoardTile[] = [
  {
    index: 0,
    tileType: "START",
    name: "انطلق (Go) 🏁",
    description: "استلم 100 ريال مكافأة المرور بالبداية.",
    cornerType: "GO",
    defaultEffect: {
      actionType: "MODIFY_COINS",
      targetType: "SELF",
      value: 100
    }
  },
  {
    index: 1,
    tileType: "RESOURCE",
    name: "حي البطحاء",
    description: "عقار تجاري عريق في قلب العاصمة.",
    price: 100,
    rent: 20,
    colorGroup: "BROWN",
    houses: 0,
    houseCost: 50,
    rentTiers: [20, 60, 120, 200, 300, 450],
    ownerId: null
  },
  {
    index: 2,
    tileType: "RESOURCE",
    name: "حي الديرة",
    description: "قلب الرياض التاريخي وسوق الزل التراثي.",
    price: 120,
    rent: 25,
    colorGroup: "BROWN",
    houses: 0,
    houseCost: 50,
    rentTiers: [25, 75, 150, 250, 350, 500],
    ownerId: null
  },
  {
    index: 3,
    tileType: "RESOURCE",
    name: "حي الملز",
    description: "حي الوزارات وحديقة الملك عبدالله.",
    price: 140,
    rent: 30,
    colorGroup: "LIGHT_BLUE",
    houses: 0,
    houseCost: 50,
    rentTiers: [30, 90, 180, 280, 400, 550],
    ownerId: null
  },
  {
    index: 4,
    tileType: "RESOURCE",
    name: "حي المربع",
    description: "قصر المربع والمتحف الوطني.",
    price: 160,
    rent: 35,
    colorGroup: "LIGHT_BLUE",
    houses: 0,
    houseCost: 50,
    rentTiers: [35, 105, 210, 320, 450, 600],
    ownerId: null
  },
  {
    index: 5,
    tileType: "HAZARD",
    name: "السجن / زيارة فقط ⛓️",
    description: "زيارة عابرة للمساجين، أو زنزانة للمحتجزين!",
    cornerType: "JAIL"
  },
  {
    index: 6,
    tileType: "RESOURCE",
    name: "حي السليمانية",
    description: "مركز المطاعم الراقية والحياة الحيوية.",
    price: 180,
    rent: 40,
    colorGroup: "PINK",
    houses: 0,
    houseCost: 100,
    rentTiers: [40, 120, 240, 360, 500, 700],
    ownerId: null
  },
  {
    index: 7,
    tileType: "RESOURCE",
    name: "حي الورود",
    description: "حي سكني وتجاري فاره بموقع استراتيجي.",
    price: 200,
    rent: 45,
    colorGroup: "PINK",
    houses: 0,
    houseCost: 100,
    rentTiers: [45, 135, 270, 400, 550, 750],
    ownerId: null
  },
  {
    index: 8,
    tileType: "RESOURCE",
    name: "شركة الكهرباء ⚡",
    description: "مرفق طاقة عام يفرض رسوم استهلاك على الخصوم.",
    price: 180,
    rent: 40,
    colorGroup: "UTILITY",
    ownerId: null
  },
  {
    index: 9,
    tileType: "RESOURCE",
    name: "طريق الملك فهد",
    description: "شريان الرياض المالي والأبراج الزجاجية.",
    price: 220,
    rent: 50,
    colorGroup: "ORANGE",
    houses: 0,
    houseCost: 100,
    rentTiers: [50, 150, 300, 450, 600, 800],
    ownerId: null
  },
  {
    index: 10,
    tileType: "RESOURCE",
    name: "المواقف المجانية 🅿️",
    description: "نقطة استراحة آمنة وخزينة الضرائب والغرامات!",
    cornerType: "FREE_PARKING"
  },
  {
    index: 11,
    tileType: "RESOURCE",
    name: "طريق العليا",
    description: "أرقى مراكز التسوق ومقرات الشركات العالمية.",
    price: 240,
    rent: 55,
    colorGroup: "ORANGE",
    houses: 0,
    houseCost: 100,
    rentTiers: [55, 165, 330, 480, 650, 850],
    ownerId: null
  },
  {
    index: 12,
    tileType: "RESOURCE",
    name: "حي النخيل",
    description: "شمال الرياض الفاخر والفلل الدبلوماسية.",
    price: 260,
    rent: 60,
    colorGroup: "RED",
    houses: 0,
    houseCost: 150,
    rentTiers: [60, 180, 360, 520, 700, 950],
    ownerId: null
  },
  {
    index: 13,
    tileType: "RESOURCE",
    name: "حي الملقا",
    description: "عاصمة الاستثمار العقاري الحديث شمال الرياض.",
    price: 280,
    rent: 65,
    colorGroup: "RED",
    houses: 0,
    houseCost: 150,
    rentTiers: [65, 195, 390, 560, 750, 1000],
    ownerId: null
  },
  {
    index: 14,
    tileType: "RESOURCE",
    name: "قطار سار ومترو الرياض 🚆",
    description: "شبكة المواصلات السريعة في العاصمة.",
    price: 200,
    rent: 50,
    colorGroup: "STATION",
    ownerId: null
  },
  {
    index: 15,
    tileType: "HAZARD",
    name: "اذهب إلى السجن 🚨",
    description: "دورية الشرطة! تُرسل فوراً إلى زنزانة السجن!",
    cornerType: "GO_TO_JAIL"
  },
  {
    index: 16,
    tileType: "RESOURCE",
    name: "حي حطين",
    description: "منطقة البوليفارد والمشاريع الكبرى والتطوير الحديث.",
    price: 300,
    rent: 70,
    colorGroup: "YELLOW",
    houses: 0,
    houseCost: 150,
    rentTiers: [70, 210, 420, 600, 800, 1100],
    ownerId: null
  },
  {
    index: 17,
    tileType: "RESOURCE",
    name: "حي الياسمين",
    description: "واحة هادئة وموقع استثماري استثنائي.",
    price: 320,
    rent: 75,
    colorGroup: "YELLOW",
    houses: 0,
    houseCost: 150,
    rentTiers: [75, 225, 450, 650, 880, 1200],
    ownerId: null
  },
  {
    index: 18,
    tileType: "RESOURCE",
    name: "بوليفارد سيتي والدرعية 🎡",
    description: "عاصمة الترفيه العالمية والتراث السعودي العريق.",
    price: 350,
    rent: 85,
    colorGroup: "GREEN",
    houses: 0,
    houseCost: 200,
    rentTiers: [85, 255, 510, 750, 1000, 1400],
    ownerId: null
  },
  {
    index: 19,
    tileType: "RESOURCE",
    name: "برج المملكة والمالي KAFD 🏙️",
    description: "قمة الفخامة العقارية وأعلى إيجار في العاصمة!",
    price: 400,
    rent: 100,
    colorGroup: "DARK_BLUE",
    houses: 0,
    houseCost: 200,
    rentTiers: [100, 300, 600, 900, 1200, 1600],
    ownerId: null
  }
];

export const AUTHENTIC_MONOPOLY_CARDS: GameCard[] = [
  {
    id: "chest_1",
    title: "صندوق الحظ: أرباح صناديق الريت 💰",
    category: "SECRET_HAND",
    flavorText: "وزعت الصناديق العقارية أرباحاً سنوية ممتازة! استلم 50 ريالاً.",
    effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 50 }]
  },
  {
    id: "chest_2",
    title: "صندوق الحظ: هدية مؤسس 🎁",
    category: "SECRET_HAND",
    flavorText: "حصلت على منحة من صندوق الاستثمار العقاري! +75 ريال.",
    effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 75 }]
  },
  {
    id: "chest_3",
    title: "فرصة: قفزة استثمارية ✈️",
    category: "SECRET_HAND",
    flavorText: "سافر عبر قطار الرياض السريع وتقدم 3 خطوات للأمام!",
    effects: [{ actionType: "MOVE_STEPS", targetType: "SELF", value: 3 }]
  },
  {
    id: "chest_4",
    title: "درع التفتيش الضريبي 🛡️",
    category: "SECRET_HAND",
    flavorText: "احمِ نفسك من أول مطالبة إيجار أو غرامة ضريبية مفاجئة!",
    effects: [{ actionType: "GRANT_SHIELD", targetType: "SELF", value: 0 }]
  },
  {
    id: "chest_5",
    title: "فرصة: صفقة حصرية 🤝",
    category: "SECRET_HAND",
    flavorText: "تفاوض على عمولة وساطة واسرق 40 ريالاً من الخصم المختار!",
    effects: [{ actionType: "STEAL_COINS", targetType: "CHOSEN_PLAYER", value: 40 }]
  },
  {
    id: "drama_1",
    title: "دراما: طفرة تقييم السوق 📈",
    category: "PUBLIC_DRAMA",
    flavorText: "ارتفعت القيمة السوقية لجميع العقارات في العاصمة بمقدار 20%!",
    effects: [{ actionType: "MODIFY_COINS", targetType: "ALL_OTHERS", value: 30 }]
  },
  {
    id: "drama_2",
    title: "دراما: رسوم صيانة البنية التحتية 🚧",
    category: "PUBLIC_DRAMA",
    flavorText: "بلدية الرياض تنفذ تحسينات على الشوارع! يدفع جميع الملاك رسوماً.",
    effects: [{ actionType: "MODIFY_COINS", targetType: "ALL_OTHERS", value: -25 }]
  },
  {
    id: "drama_3",
    title: "دراما: تسوية تجارية ⚖️",
    category: "PUBLIC_DRAMA",
    flavorText: "قررت هيئة المنافسة تعويض المستثمر الأكثر تضرراً على اللوحة!",
    effects: [{ actionType: "MODIFY_COINS", targetType: "POOREST_PLAYER", value: 60 }]
  },
  {
    id: "vote_1",
    title: "تصويت: فرض ضريبة الاحتكار 🏛️",
    category: "VOTE_CARD",
    flavorText: "صوّت الشلة لتغريم المستثمر الأكثر استحواذاً على الأراضي!",
    effects: [{ actionType: "VOTE_PENALTY", targetType: "CHOSEN_PLAYER", value: 50 }]
  },
  {
    id: "vote_2",
    title: "تصويت: جائزة أفضل مطور عقاري 🏆",
    category: "VOTE_CARD",
    flavorText: "صوّت لاختيار المستثمر النزيه لمنحه مكافأة تطوير بقيمة 60 ريالاً!",
    effects: [{ actionType: "MODIFY_COINS", targetType: "CHOSEN_PLAYER", value: 60 }]
  },
  {
    id: "chest_6",
    title: "صندوق الحظ: بيع حصة استثمارية 🏢",
    category: "SECRET_HAND",
    flavorText: "نجحت في تخارج جزئي من أحد الأصول! +60 ريال.",
    effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 60 }]
  },
  {
    id: "chest_7",
    title: "فرصة: إعفاء بنكي 📜",
    category: "SECRET_HAND",
    flavorText: "حصلت على تسوية بنكية ميسرة. احصل على درع حماية فوري!",
    effects: [{ actionType: "GRANT_SHIELD", targetType: "SELF", value: 0 }]
  },
  {
    id: "chest_8",
    title: "صندوق الحظ: تصحيح كشوفات الحساب 📑",
    category: "SECRET_HAND",
    flavorText: "خطأ بنكي لصالحك! استلم 45 ريالاً فوراً.",
    effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 45 }]
  },
  {
    id: "drama_4",
    title: "دراما: مهرجان الرياض للترفيه 🎉",
    category: "PUBLIC_DRAMA",
    flavorText: "إقبال سياحي هائل ينعش الإيجارات والمبيعات لجميع التجار!",
    effects: [{ actionType: "MODIFY_COINS", targetType: "ALL_OTHERS", value: 35 }]
  },
  {
    id: "vote_3",
    title: "تصويت: حظر بناء مؤقت ⛔",
    category: "VOTE_CARD",
    flavorText: "صوّت لتجميد ترخيص بناء للاعب الذي يهدد باحتكار الحي!",
    effects: [{ actionType: "SKIP_TURN", targetType: "CHOSEN_PLAYER", value: 1 }]
  }
];

export const RIYADH_VIP_MONOPOLY_PACK: GeneratedSessionPack = {
  themeId: "RIYADH_VIP",
  themeTitle: "عقارات الرياض: بنك الحظ الأصيل 🏙️",
  visualStyle: "CARTOON_OFFICE",
  archetype: "PARTY_ECONOMY",
  winCondition: "MOST_COINS",
  currencyName: "ريال",
  narratorIntro: "مرحباً بكم في احتكار عقارات الرياض الأصيل! طوّر الأحياء، ابنِ الأبراج، واجمع الإيجارات من أصدقائك!",
  rulesConfig: {
    turnMechanism: "DICE_AND_MOVE",
    cardVisibility: "SECRET_PHONE_ONLY",
    ownershipSystem: "BUY_AND_RENT"
  },
  tiles: AUTHENTIC_MONOPOLY_TILES_20,
  cardsDeck: AUTHENTIC_MONOPOLY_CARDS
};

// Aliased for backward compatibility
export const AUTHENTIC_MONOPOLY_PACK = RIYADH_VIP_MONOPOLY_PACK;

/**
 * ORIGINAL CLASSIC MONOPOLY (Boardwalk, Park Place, Atlantic City, Dollars $)
 * The authentic original base game as requested by the user.
 */
export const ORIGINAL_CLASSIC_MONOPOLY_TILES_20: BoardTile[] = [
  {
    index: 0,
    tileType: "START",
    name: "انطلق (GO) 🏁",
    description: "استلم $200 راتب المرور بخط البداية.",
    cornerType: "GO",
    defaultEffect: {
      actionType: "MODIFY_COINS",
      targetType: "SELF",
      value: 200
    }
  },
  {
    index: 1,
    tileType: "RESOURCE",
    name: "شارع المتوسط (Mediterranean Ave)",
    description: "عقار بني كلاسيكي في أتلانتيك سيتي.",
    price: 60,
    rent: 10,
    colorGroup: "BROWN",
    houses: 0,
    houseCost: 50,
    rentTiers: [10, 30, 90, 160, 250, 400],
    ownerId: null
  },
  {
    index: 2,
    tileType: "RESOURCE",
    name: "شارع البلطيق (Baltic Ave)",
    description: "عقار بني كلاسيكي مجاور لشارع المتوسط.",
    price: 60,
    rent: 12,
    colorGroup: "BROWN",
    houses: 0,
    houseCost: 50,
    rentTiers: [12, 36, 100, 180, 280, 450],
    ownerId: null
  },
  {
    index: 3,
    tileType: "RESOURCE",
    name: "شارع أورينتال (Oriental Ave)",
    description: "عقار أزرق سماوي بموقع تجاري ممتاز.",
    price: 100,
    rent: 20,
    colorGroup: "LIGHT_BLUE",
    houses: 0,
    houseCost: 50,
    rentTiers: [20, 60, 180, 320, 450, 600],
    ownerId: null
  },
  {
    index: 4,
    tileType: "RESOURCE",
    name: "شارع كونيتيكت (Connecticut Ave)",
    description: "عقار أزرق سماوي شهير وواعد بالاستثمار.",
    price: 120,
    rent: 24,
    colorGroup: "LIGHT_BLUE",
    houses: 0,
    houseCost: 50,
    rentTiers: [24, 72, 200, 360, 500, 650],
    ownerId: null
  },
  {
    index: 5,
    tileType: "HAZARD",
    name: "السجن / زيارة فقط ⛓️",
    description: "زيارة عابرة للمساجين، أو زنزانة للمحتجزين!",
    cornerType: "JAIL"
  },
  {
    index: 6,
    tileType: "RESOURCE",
    name: "ساحة سانت تشارلز (St. Charles Place)",
    description: "عقار وردي كلاسيكي يبدأ الجانب الشرقي.",
    price: 140,
    rent: 30,
    colorGroup: "PINK",
    houses: 0,
    houseCost: 100,
    rentTiers: [30, 90, 270, 400, 550, 750],
    ownerId: null
  },
  {
    index: 7,
    tileType: "RESOURCE",
    name: "شارع فرجينيا (Virginia Ave)",
    description: "عقار وردي حيوي بحركة زوار وتجارة نشطة.",
    price: 160,
    rent: 35,
    colorGroup: "PINK",
    houses: 0,
    houseCost: 100,
    rentTiers: [35, 105, 300, 450, 625, 800],
    ownerId: null
  },
  {
    index: 8,
    tileType: "RESOURCE",
    name: "شركة الكهرباء (Electric Company) ⚡",
    description: "مرفق طاقة عام يفرض رسوم استهلاك على الخصوم.",
    price: 150,
    rent: 40,
    colorGroup: "UTILITY",
    ownerId: null
  },
  {
    index: 9,
    tileType: "RESOURCE",
    name: "ساحة سانت جيمس (St. James Place)",
    description: "عقار برتقالي محوري ذو عائد استثماري مرتفع.",
    price: 180,
    rent: 45,
    colorGroup: "ORANGE",
    houses: 0,
    houseCost: 100,
    rentTiers: [45, 135, 380, 550, 750, 950],
    ownerId: null
  },
  {
    index: 10,
    tileType: "RESOURCE",
    name: "المواقف المجانية (Free Parking) 🅿️",
    description: "نقطة استراحة آمنة وخزينة الضرائب والغرامات!",
    cornerType: "FREE_PARKING"
  },
  {
    index: 11,
    tileType: "RESOURCE",
    name: "شارع نيويورك (New York Ave)",
    description: "عقار برتقالي شهير يدر إيجارات ممتازة.",
    price: 200,
    rent: 50,
    colorGroup: "ORANGE",
    houses: 0,
    houseCost: 100,
    rentTiers: [50, 150, 450, 625, 825, 1000],
    ownerId: null
  },
  {
    index: 12,
    tileType: "RESOURCE",
    name: "شارع كنتاكي (Kentucky Ave)",
    description: "عقار أحمر رئيسي وفرصة تطوير فاخرة.",
    price: 220,
    rent: 55,
    colorGroup: "RED",
    houses: 0,
    houseCost: 150,
    rentTiers: [55, 165, 500, 700, 900, 1150],
    ownerId: null
  },
  {
    index: 13,
    tileType: "RESOURCE",
    name: "شارع إلينوي (Illinois Ave)",
    description: "أشهر وأكثر الشوارع الكلاسيكية هبوطاً باللوحة!",
    price: 240,
    rent: 60,
    colorGroup: "RED",
    houses: 0,
    houseCost: 150,
    rentTiers: [60, 180, 550, 750, 950, 1200],
    ownerId: null
  },
  {
    index: 14,
    tileType: "RESOURCE",
    name: "سكة حديد ريدينغ (Reading Railroad) 🚆",
    description: "سكة حديد كلاسيكية تنقل المسافرين عبر اللوح.",
    price: 200,
    rent: 50,
    colorGroup: "STATION",
    ownerId: null
  },
  {
    index: 15,
    tileType: "HAZARD",
    name: "اذهب إلى السجن 🚨",
    description: "أمر شرطة فوري! تُرسل مباشرة إلى زنزانة السجن!",
    cornerType: "GO_TO_JAIL"
  },
  {
    index: 16,
    tileType: "RESOURCE",
    name: "شارع أتلانتيك (Atlantic Ave)",
    description: "عقار أصفر استثماري عالي القيمة.",
    price: 260,
    rent: 70,
    colorGroup: "YELLOW",
    houses: 0,
    houseCost: 150,
    rentTiers: [70, 210, 600, 800, 1000, 1300],
    ownerId: null
  },
  {
    index: 17,
    tileType: "RESOURCE",
    name: "حدائق مارفن (Marvin Gardens)",
    description: "حي أصفر فاره وحدائق خلابة وإيجار مميز.",
    price: 280,
    rent: 75,
    colorGroup: "YELLOW",
    houses: 0,
    houseCost: 150,
    rentTiers: [75, 225, 650, 850, 1050, 1350],
    ownerId: null
  },
  {
    index: 18,
    tileType: "RESOURCE",
    name: "شارع باسيفيك (Pacific Ave)",
    description: "عقار أخضر راقٍ جداً وإيجارات ضخمة.",
    price: 320,
    rent: 85,
    colorGroup: "GREEN",
    houses: 0,
    houseCost: 200,
    rentTiers: [85, 255, 750, 1000, 1250, 1500],
    ownerId: null
  },
  {
    index: 19,
    tileType: "RESOURCE",
    name: "بوردووك وبارك بليس (Boardwalk) 🎩",
    description: "أغلى وأفخم عقار كلاسيكي في تاريخ المونوبولي العالمي!",
    price: 400,
    rent: 100,
    colorGroup: "DARK_BLUE",
    houses: 0,
    houseCost: 200,
    rentTiers: [100, 300, 900, 1200, 1500, 2000],
    ownerId: null
  }
];

export const ORIGINAL_CLASSIC_MONOPOLY_CARDS: GameCard[] = [
  {
    id: "chest_1",
    title: "صندوق الحظ: خطأ بنكي لصالحك 💰",
    category: "SECRET_HAND",
    flavorText: "خطأ مصرفي لصالحك! استلم $200 فوراً من البنك.",
    effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 200 }]
  },
  {
    id: "chest_2",
    title: "صندوق الحظ: بيع أسهم وحصص 📈",
    category: "SECRET_HAND",
    flavorText: "نجحت في بيع أسهمك في البورصة! استلم $100.",
    effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 100 }]
  },
  {
    id: "chest_3",
    title: "صندوق الحظ: عائدات التأمين 📜",
    category: "SECRET_HAND",
    flavorText: "استحقاق بوليصة التأمين على الحياة! استلم $100.",
    effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 100 }]
  },
  {
    id: "chest_4",
    title: "فرصة: قفزة سكة الحديد 🚆",
    category: "SECRET_HAND",
    flavorText: "اركب قطار ريدينغ السريع وتقدم 3 خطوات للأمام!",
    effects: [{ actionType: "MOVE_STEPS", targetType: "SELF", value: 3 }]
  },
  {
    id: "chest_5",
    title: "فرصة: بطاقة الخروج من السجن 🛡️",
    category: "SECRET_HAND",
    flavorText: "احصل على درع حماية فوري وإعفاء من أول غرامة أو احتجاز!",
    effects: [{ actionType: "GRANT_SHIELD", targetType: "SELF", value: 0 }]
  },
  {
    id: "chest_6",
    title: "فرصة: رئيس مجلس الإدارة 👔",
    category: "SECRET_HAND",
    flavorText: "حصلت على مكافأة تميز! خذ $50 من خصمك المختار.",
    effects: [{ actionType: "STEAL_COINS", targetType: "CHOSEN_PLAYER", value: 50 }]
  },
  {
    id: "chest_7",
    title: "صندوق الحظ: رسوم استشارة طبية 🏥",
    category: "SECRET_HAND",
    flavorText: "ادفع أتعاب الفحص الطبي السنوي بقيمة $50.",
    effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: -50 }]
  },
  {
    id: "chest_8",
    title: "صندوق الحظ: ضريبة الخدمات 🏫",
    category: "SECRET_HAND",
    flavorText: "ادفع ضريبة الخدمات البلدية بقيمة $50.",
    effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: -50 }]
  },
  {
    id: "chest_9",
    title: "صندوق الحظ: ميراث غير متوقع 🏛️",
    category: "SECRET_HAND",
    flavorText: "حصلت على ميراث عائلي مستحق! استلم $100 فوراً.",
    effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 100 }]
  },
  {
    id: "drama_1",
    title: "دراما: صعود بورصة وول ستريت 📊",
    category: "PUBLIC_DRAMA",
    flavorText: "انتعاش اقتصادي قوي في أسواق المال! يحصل الجميع على $30.",
    effects: [{ actionType: "MODIFY_COINS", targetType: "ALL_OTHERS", value: 30 }]
  },
  {
    id: "drama_2",
    title: "دراما: صيانة المنازل والفنادق 🔨",
    category: "PUBLIC_DRAMA",
    flavorText: "أعمال صيانة وإصلاحات للطرق! يدفع جميع الملاك $25.",
    effects: [{ actionType: "MODIFY_COINS", targetType: "ALL_OTHERS", value: -25 }]
  },
  {
    id: "drama_3",
    title: "دراما: دعم المشاريع الصغيرة ⚖️",
    category: "PUBLIC_DRAMA",
    flavorText: "قررت هيئة الاستثمار دعم المستثمر الأقل رصيداً بمبلغ $60!",
    effects: [{ actionType: "MODIFY_COINS", targetType: "POOREST_PLAYER", value: 60 }]
  },
  {
    id: "vote_1",
    title: "تصويت: ضريبة مكافحة الاحتكار 🏛️",
    category: "VOTE_CARD",
    flavorText: "صوّتت الشلة لتغريم اللاعب الأكثر استحواذاً على الأراضي بمبلغ $50!",
    effects: [{ actionType: "VOTE_PENALTY", targetType: "CHOSEN_PLAYER", value: 50 }]
  },
  {
    id: "vote_2",
    title: "تصويت: جائزة ريادة الأعمال 🏆",
    category: "VOTE_CARD",
    flavorText: "صوّت لاختيار المستثمر الأكثر نزاهة لمنحه جائزة بقيمة $60!",
    effects: [{ actionType: "MODIFY_COINS", targetType: "CHOSEN_PLAYER", value: 60 }]
  },
  {
    id: "vote_3",
    title: "تصويت: تجميد تراخيص البناء ⛔",
    category: "VOTE_CARD",
    flavorText: "صوّت لتجميد ترخيص تطوير عقاري للاعب يهدد باحتكار الشارع!",
    effects: [{ actionType: "SKIP_TURN", targetType: "CHOSEN_PLAYER", value: 1 }]
  }
];

export const ORIGINAL_CLASSIC_MONOPOLY_PACK: GeneratedSessionPack = {
  themeId: "MONOPOLY_CLASSIC",
  themeTitle: "مونوبولي الكلاسيكية الأصلية (Monopoly Classic) 🎩",
  visualStyle: "CARTOON_OFFICE",
  archetype: "PARTY_ECONOMY",
  winCondition: "MOST_COINS",
  currencyName: "$",
  narratorIntro: "مرحباً بكم في لعبة مونوبولي الكلاسيكية العالمية الأصلية! طوّر شوارع بوردووك وإلينوي، اشترِ محطات القطار، واحتكر السوق حتى إفلاس الجميع!",
  rulesConfig: {
    turnMechanism: "DICE_AND_MOVE",
    cardVisibility: "SECRET_PHONE_ONLY",
    ownershipSystem: "BUY_AND_RENT"
  },
  tiles: ORIGINAL_CLASSIC_MONOPOLY_TILES_20,
  cardsDeck: ORIGINAL_CLASSIC_MONOPOLY_CARDS
};
