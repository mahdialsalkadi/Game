import { z } from "zod";

// 1. القوائم المغلقة للأوامر والأهداف وأنواع المربعات (Enums)
export const TileTypeEnum = z.enum([
  "START",
  "RESOURCE",
  "HAZARD",
  "SECRET_CARD",
  "DRAMA_EVENT",
  "GLOBAL_VOTE"
]);

export const ActionTypeEnum = z.enum([
  "MODIFY_COINS",
  "STEAL_COINS",
  "MOVE_STEPS",
  "SWAP_POSITIONS",
  "SKIP_TURN",
  "GRANT_SHIELD",
  "TAX_PERCENTAGE",
  "VOTE_PENALTY"
]);

export const TargetTypeEnum = z.enum([
  "SELF",
  "CHOSEN_PLAYER",
  "RICHEST_PLAYER",
  "POOREST_PLAYER",
  "RANDOM_OTHER",
  "ALL_OTHERS"
]);

// 2. هيكل التأثير البرمجي الواحد (Atomic Effect)
export const AtomicEffectSchema = z.object({
  actionType: ActionTypeEnum.describe("نوع الأمر البرمجي الذي سينفذه المحرك"),
  targetType: TargetTypeEnum.describe("من الذي سيتأثر بهذا الأمر"),
  value: z.number().int().min(-500).max(500).describe("القيمة الرقمية للتأثير ضمن الحدود الآمنة")
});

// 3. هيكل البطاقة (سواء كانت بطاقة يد سرية أو حدث علني)
export const GameCardSchema = z.object({
  id: z.string(),
  title: z.string().max(35).describe("عنوان قصير وجذاب للبطاقة يظهر على الشاشة"),
  category: z.enum(["SECRET_HAND", "PUBLIC_DRAMA", "VOTE_CARD"]),
  flavorText: z.string().max(160).describe("النص الفكاهي أو الدرامي المخصص للشلة وثيم الجلسة"),
  effects: z.array(AtomicEffectSchema).min(1).max(2).describe("تأثير واحد أو تأثيران كحد أقصى لكل بطاقة")
});

// 4. هيكل مربع اللوحة (Tile) - تم توسيعه ليدعم أسعار الشراء، الإيجارات، الجيوش، والانتقال الفوري (السلم والثعبان)
export const BoardTileSchema = z.object({
  index: z.number().int().min(0).max(100),
  tileType: TileTypeEnum,
  name: z.string().max(40).describe("اسم مختصر للمربع من كلمتين أو ثلاث"),
  description: z.string().max(160).describe("وصف سريع يظهر عند وقوف اللاعب على المربع"),
  defaultEffect: AtomicEffectSchema.optional().describe("تأثير مباشر للمربعات من نوع RESOURCE أو HAZARD"),
  price: z.number().int().min(0).optional().describe("سعر شراء العقار أو تكلفة فتح الإقليم"),
  rent: z.number().int().min(0).optional().describe("قيمة الإيجار التلقائي المفروض عند هبوط الخصوم"),
  ownerId: z.string().nullable().optional().describe("معرف اللاعب المالك للعقار حالياً"),
  armies: z.number().int().min(0).optional().describe("القوة العسكرية أو الدروع الدفاعية للإقليم"),
  jumpToIndex: z.number().int().min(0).max(100).optional().describe("وجهة الانتقال الفوري للسلم أو الثعبان"),
  colorGroup: z.string().optional().describe("المجموعة اللونية للعقار في المونوبولي"),
  houses: z.number().int().min(0).max(5).optional().describe("مستوى المباني (0 إلى 4 بيوت، 5 = فندق)"),
  houseCost: z.number().int().min(0).optional().describe("تكلفة تشييد البيت الواحد"),
  rentTiers: z.array(z.number().int()).optional().describe("جدول الإيجارات حسب عدد البيوت والفندق"),
  cornerType: z.enum(["GO", "JAIL", "FREE_PARKING", "GO_TO_JAIL"]).optional().describe("نوع زاوية المونوبولي الخاصة")
});

// 5. أنماط الألعاب وشروط الفوز العالمية (Game Archetypes & Win Conditions)
export const WinConditionEnum = z.enum([
  "MOST_COINS",
  "FIRST_TO_FINISH",
  "TARGET_SCORE",
  "LAST_SURVIVOR"
]);

export const GameArchetypeEnum = z.enum([
  "BOARD_RACE",
  "PARTY_ECONOMY",
  "SOCIAL_DEDUCTION",
  "DECK_BATTLER"
]);

// 6. قواعد الألعاب الحقيقية المتعددة (True Multi-Rule Engine Mechanics)
export const TurnMechanismEnum = z.enum([
  "DICE_AND_MOVE",
  "TERRITORY_COMMAND",
  "CARD_PLAY_ONLY",
  "SOCIAL_DISCUSSION_VOTE",
  "GRID_PLACEMENT",
  "CHECKERS_MOVE",
  "BINGO_CALL"
]);

export const CardVisibilityEnum = z.enum([
  "SECRET_PHONE_ONLY",
  "OPEN_PUBLIC_CARDS",
  "NO_HAND_CARDS"
]);

export const OwnershipSystemEnum = z.enum([
  "NONE",
  "BUY_AND_RENT",
  "CONQUER_REGIONS"
]);

export const GameRulesConfigSchema = z.object({
  turnMechanism: TurnMechanismEnum.default("DICE_AND_MOVE").describe("ميكانيكية تحريك الدور"),
  cardVisibility: CardVisibilityEnum.default("SECRET_PHONE_ONLY").describe("طريقة عرض البطاقات وسريتها"),
  ownershipSystem: OwnershipSystemEnum.default("NONE").describe("نظام الملكية للعقارات أو الأراضي")
});

// 7. الهيكل الكامل لحزمة الجلسة التي يولدها الذكاء الاصطناعي أو الاستوديو
export const GeneratedSessionPackSchema = z.object({
  key: z.string().optional().describe("مفتاح اللعبة الكلاسيكية عند توفرها"),
  themeId: z.string().optional().describe("معرف العالم والثيم المختار للعبة"),
  themeTitle: z.string().describe("اسم السهرة المبتكر بناءً على طلب اللاعبين"),
  visualStyle: z.enum(["CYBERPUNK", "ANCIENT_ARABIA", "CARTOON_OFFICE", "FANTASY", "SPACE"]),
  archetype: GameArchetypeEnum.default("PARTY_ECONOMY").describe("نمط اللعبة الرئيسي"),
  rulesConfig: GameRulesConfigSchema.default({
    turnMechanism: "DICE_AND_MOVE",
    cardVisibility: "SECRET_PHONE_ONLY",
    ownershipSystem: "NONE"
  }).describe("القواعد الميكانيكية الحقيقية التي تحكم الغرفة والمحرك"),
  winCondition: WinConditionEnum.default("MOST_COINS").describe("شرط الفوز الأساسي"),
  targetScore: z.number().int().optional().describe("الرصيد أو النقاط المستهدفة للفوز السريع"),
  currencyName: z.string().max(15).describe("اسم العملة في هذه الجلسة مثل: دنانير، كؤوس قهوة، نقاط هيبة"),
  narratorIntro: z.string().describe("جملة ترحيبية ساخرة يلقيها الراوي الذكي في بداية الجلسة"),
  tiles: z.array(BoardTileSchema).min(12).max(100),
  cardsDeck: z.array(GameCardSchema).min(15).max(25),
  suggestedTokens: z.array(z.string()).optional().describe("أشكال القطع المقترحة للاعبين المتوافقة مع الثيم")
});

// 8. إعدادات الغرفة القابلة للتخصيص
export const GameSettingsSchema = z.object({
  maxRounds: z.number().int().min(3).max(999).default(999).describe("عدد جولات اللعبة (افتراضي مفتوح حتى الحسم الطبيعي)"),
  startingCoins: z.number().int().min(50).max(500).default(150).describe("رصيد البداية لكل لاعب (بين 50 و 500)"),
  passStartBonus: z.number().int().min(50).max(300).default(100).describe("مكافأة المرور بنقطة البداية (بين 50 و 300)"),
  themeId: z.string().default("ARABIAN_MAJLIS").describe("معرف العالم والثيم المختار للعبة"),
  playMode: z.enum(["CASUAL", "PRO"]).default("CASUAL").describe("طور اللعب: وناسة وجمعة مع تلميحات ذكية أو محترفين رسمي")
});

// Type exports
export type TileType = z.infer<typeof TileTypeEnum>;
export type ActionType = z.infer<typeof ActionTypeEnum>;
export type TargetType = z.infer<typeof TargetTypeEnum>;
export type AtomicEffect = z.infer<typeof AtomicEffectSchema>;
export type GameCard = z.infer<typeof GameCardSchema>;
export type BoardTile = z.infer<typeof BoardTileSchema>;
export type GeneratedSessionPack = z.infer<typeof GeneratedSessionPackSchema>;
export type GameSettings = z.infer<typeof GameSettingsSchema>;
export type PlayMode = z.infer<typeof GameSettingsSchema>["playMode"];
export type WinCondition = z.infer<typeof WinConditionEnum>;
export type GameArchetype = z.infer<typeof GameArchetypeEnum>;

export type TurnMechanism = z.infer<typeof TurnMechanismEnum>;
export type CardVisibility = z.infer<typeof CardVisibilityEnum>;
export type OwnershipSystem = z.infer<typeof OwnershipSystemEnum>;
export type GameRulesConfig = z.infer<typeof GameRulesConfigSchema>;
