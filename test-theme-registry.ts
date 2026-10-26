import {
  getAllThemes,
  getThemeById,
  applyThemeToGamePack,
  detectPackArchetype,
  UniversalThemeSchema,
  UNIVERSAL_THEMES
} from "./src/game/themeRegistry";
import { AUTHENTIC_MONOPOLY_PACK } from "./src/game/monopolyEngine";
import { AUTHENTIC_LUDO_PACK } from "./src/game/ludoEngine";
import { PRESET_PACKS } from "./src/game/aiPackGenerator";
import { GeneratedSessionPackSchema } from "./src/game/schema";
import { BoardGameRoomMachine } from "./src/game/gameRoom";
import { GameEngineRegistry } from "./src/game/engines/GameEngineRegistry";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`✅ PASS: ${message}`);
}

console.log("=================================================");
console.log("🧪 STARTING UNIVERSAL THEME REGISTRY TEST SUITE");
console.log("=================================================\n");

// 1. فحص الثيمات المدمجة وصحة الـ Schema
console.log("--- 1. Testing Universal Themes Schemas & Defaults ---");
const themes = getAllThemes();
assert(themes.length >= 5, `Expected at least 5 themes, got ${themes.length}`);

for (const theme of themes) {
  const parseResult = UniversalThemeSchema.safeParse(theme);
  assert(parseResult.success, `Theme ${theme.id} matches UniversalThemeSchema`);
  assert(theme.playerTokens.length >= 4, `Theme ${theme.id} has at least 4 tokens`);
  assert(theme.voiceReactions.length >= 3, `Theme ${theme.id} has at least 3 voice reactions`);
  assert(Boolean(theme.soundscapeProfile.diceShake), `Theme ${theme.id} has diceShake sound`);
  assert(Boolean(theme.gameOverrides.MONOPOLY.currencyName), `Theme ${theme.id} has Monopoly currency`);
  assert(Boolean(theme.gameOverrides.LUDO.safeStarTitle), `Theme ${theme.id} has Ludo safe star`);
  assert(Boolean(theme.gameOverrides.SNAKES.ladderTheme), `Theme ${theme.id} has Snakes ladder theme`);
  assert(Boolean(theme.gameOverrides.UNO.wildCardNames.wild), `Theme ${theme.id} has Uno wild card name`);
}

const defaultTheme = getThemeById("UNKNOWN_THEME_ID");
assert(defaultTheme.id === "ARABIAN_MAJLIS", "Fallback for unknown theme returns ARABIAN_MAJLIS");

const cyberpunkTheme = getThemeById("CYBERPUNK_NEON");
assert(cyberpunkTheme.id === "CYBERPUNK_NEON", "getThemeById returns requested theme");

// 2. فحص تحويل المونوبولي (Monopoly Skinning)
console.log("\n--- 2. Testing Monopoly Theme Transformation ---");
const originalMonopoly = JSON.parse(JSON.stringify(AUTHENTIC_MONOPOLY_PACK));
const themedMonopoly = applyThemeToGamePack(AUTHENTIC_MONOPOLY_PACK, "CYBERPUNK_NEON");

// فحص عدم تغيير الكائن الأصلي (Immutability)
assert(
  AUTHENTIC_MONOPOLY_PACK.currencyName === originalMonopoly.currencyName,
  "Original Monopoly pack currencyName remained untouched (Immutable)"
);
assert(
  AUTHENTIC_MONOPOLY_PACK.visualStyle === originalMonopoly.visualStyle,
  "Original Monopoly visualStyle remained untouched"
);
assert(
  AUTHENTIC_MONOPOLY_PACK.tiles[0].name === originalMonopoly.tiles[0].name,
  "Original Monopoly tile 0 remained untouched"
);

// فحص نجاح التحويل
assert(themedMonopoly.themeId === "CYBERPUNK_NEON", "Themed Monopoly themeId is CYBERPUNK_NEON");
assert(themedMonopoly.visualStyle === "CYBERPUNK", "Themed Monopoly visualStyle is CYBERPUNK");
assert(themedMonopoly.currencyName === "كريديت نيون", "Themed Monopoly currency is كريديت نيون");
assert(
  themedMonopoly.tiles.length === AUTHENTIC_MONOPOLY_PACK.tiles.length,
  `Monopoly tile count preserved: ${themedMonopoly.tiles.length}`
);
assert(
  themedMonopoly.cardsDeck.length === AUTHENTIC_MONOPOLY_PACK.cardsDeck.length,
  `Monopoly card count preserved: ${themedMonopoly.cardsDeck.length}`
);
assert(
  themedMonopoly.rulesConfig.ownershipSystem === "BUY_AND_RENT",
  "Monopoly ownershipSystem BUY_AND_RENT preserved"
);

// فحص زوايا المونوبولي الأربع
assert(
  themedMonopoly.tiles[0].name.includes("تحديث النظام") && themedMonopoly.tiles[0].cornerType === "GO",
  "Corner 0 (GO) renamed to Cyberpunk GO with cornerType preserved"
);
assert(
  themedMonopoly.tiles[5].name.includes("معتقل الميغاكورب") && themedMonopoly.tiles[5].cornerType === "JAIL",
  "Corner 5 (JAIL) renamed to Cyberpunk JAIL"
);
assert(
  themedMonopoly.tiles[10].name.includes("محطة الشحن") && themedMonopoly.tiles[10].cornerType === "FREE_PARKING",
  "Corner 10 (FREE_PARKING) renamed to Cyberpunk FREE_PARKING"
);
assert(
  themedMonopoly.tiles[15].name.includes("تطويق أمني") && themedMonopoly.tiles[15].cornerType === "GO_TO_JAIL",
  "Corner 15 (GO_TO_JAIL) renamed to Cyberpunk GO_TO_JAIL"
);

// فحص الحفاظ على أسعار الشراء والإيجارات
for (let i = 0; i < themedMonopoly.tiles.length; i++) {
  const orig = AUTHENTIC_MONOPOLY_PACK.tiles[i];
  const skinned = themedMonopoly.tiles[i];
  assert(skinned.index === orig.index, `Tile ${i} index preserved`);
  assert(skinned.price === orig.price, `Tile ${i} price preserved (${skinned.price})`);
  assert(skinned.rent === orig.rent, `Tile ${i} rent preserved`);
  assert(skinned.colorGroup === orig.colorGroup, `Tile ${i} colorGroup preserved`);
  assert(skinned.houses === orig.houses, `Tile ${i} houses count preserved`);
}

// فحص توافق الحزمة الناتجة مع Zod Schema
const monoValidation = GeneratedSessionPackSchema.safeParse(themedMonopoly);
assert(monoValidation.success, "Themed Monopoly satisfies GeneratedSessionPackSchema");

// 3. فحص تحويل اللودو (Ludo Skinning)
console.log("\n--- 3. Testing Ludo Theme Transformation ---");
const originalLudo = JSON.parse(JSON.stringify(AUTHENTIC_LUDO_PACK));
const themedLudo = applyThemeToGamePack(AUTHENTIC_LUDO_PACK, "DEEP_SPACE");

assert(
  AUTHENTIC_LUDO_PACK.currencyName === originalLudo.currencyName,
  "Original Ludo pack currencyName untouched (Immutable)"
);
assert(themedLudo.themeId === "DEEP_SPACE", "Themed Ludo themeId is DEEP_SPACE");
assert(themedLudo.visualStyle === "SPACE", "Themed Ludo visualStyle is SPACE");
assert(themedLudo.currencyName === "نواة طاقة", "Themed Ludo currency is نواة طاقة");
assert(
  themedLudo.tiles.length === AUTHENTIC_LUDO_PACK.tiles.length,
  `Ludo tiles count preserved: ${themedLudo.tiles.length}`
);
assert(
  themedLudo.winCondition === "FIRST_TO_FINISH",
  "Ludo winCondition FIRST_TO_FINISH preserved"
);
assert(
  themedLudo.rulesConfig.turnMechanism === "DICE_AND_MOVE",
  "Ludo turnMechanism DICE_AND_MOVE preserved"
);
assert(
  themedLudo.rulesConfig.cardVisibility === "NO_HAND_CARDS",
  "Ludo cardVisibility NO_HAND_CARDS preserved"
);
assert(
  themedLudo.tiles[1].name.includes("محطة أوريون الخضراء"),
  "Ludo green base themed to Deep Space Orion station"
);

const ludoValidation = GeneratedSessionPackSchema.safeParse(themedLudo);
assert(ludoValidation.success, "Themed Ludo satisfies GeneratedSessionPackSchema");

// 4. فحص تحويل السلم والثعبان (Snakes & Ladders Skinning)
console.log("\n--- 4. Testing Snakes & Ladders Theme Transformation ---");
const snakesBase = PRESET_PACKS.SNAKES_AND_LADDERS_RPG;
const originalSnakes = JSON.parse(JSON.stringify(snakesBase));
const themedSnakes = applyThemeToGamePack(snakesBase, "MEDIEVAL_FANTASY");

assert(
  snakesBase.currencyName === originalSnakes.currencyName,
  "Original Snakes pack currencyName untouched (Immutable)"
);
assert(themedSnakes.themeId === "MEDIEVAL_FANTASY", "Themed Snakes themeId is MEDIEVAL_FANTASY");
assert(themedSnakes.visualStyle === "FANTASY", "Themed Snakes visualStyle is FANTASY");
assert(themedSnakes.currencyName === "خطوة شرف", "Themed Snakes currency is خطوة شرف");
assert(
  themedSnakes.tiles.length === snakesBase.tiles.length,
  `Snakes tile count preserved: ${themedSnakes.tiles.length}`
);

// فحص السلالم والثعابين وأهداف الانتقال الفوري jumpToIndex
let foundLadder = false;
let foundSnake = false;

for (let i = 0; i < themedSnakes.tiles.length; i++) {
  const orig = snakesBase.tiles[i];
  const skinned = themedSnakes.tiles[i];
  assert(skinned.index === orig.index, `Tile ${i} index preserved`);
  assert(skinned.jumpToIndex === orig.jumpToIndex, `Tile ${i} jumpToIndex exact match`);

  if (orig.jumpToIndex !== undefined) {
    if (orig.jumpToIndex > orig.index) {
      foundLadder = true;
      assert(
        skinned.name.includes("سلم سحري طائر"),
        `Ladder tile ${i} re-skinned to Medieval Fantasy magic ladder`
      );
    } else if (orig.jumpToIndex < orig.index) {
      foundSnake = true;
      assert(
        skinned.name.includes("ثعبان التنين"),
        `Snake tile ${i} re-skinned to Medieval Fantasy dragon snake`
      );
    }
  }
}

assert(foundLadder, "Verified that at least one ladder was tested");
assert(foundSnake, "Verified that at least one snake was tested");

const snakesValidation = GeneratedSessionPackSchema.safeParse(themedSnakes);
assert(snakesValidation.success, "Themed Snakes satisfies GeneratedSessionPackSchema");

// 5. فحص تحويل أونو (Uno / Tactical Cards Skinning)
console.log("\n--- 5. Testing Uno / Tactical Cards Theme Transformation ---");
const unoBase = PRESET_PACKS.TACTICAL_CARDS_UNO;
const originalUno = JSON.parse(JSON.stringify(unoBase));
const themedUno = applyThemeToGamePack(unoBase, "ARABIAN_MAJLIS");

assert(
  unoBase.currencyName === originalUno.currencyName,
  "Original Uno pack currencyName untouched (Immutable)"
);
assert(themedUno.themeId === "ARABIAN_MAJLIS", "Themed Uno themeId is ARABIAN_MAJLIS");
assert(themedUno.visualStyle === "ANCIENT_ARABIA", "Themed Uno visualStyle is ANCIENT_ARABIA");
assert(themedUno.currencyName === "فنجان", "Themed Uno currency is فنجان");
assert(
  themedUno.cardsDeck.length === unoBase.cardsDeck.length,
  `Uno cardsDeck length preserved: ${themedUno.cardsDeck.length}`
);
assert(
  themedUno.rulesConfig.turnMechanism === "CARD_PLAY_ONLY",
  "Uno turnMechanism CARD_PLAY_ONLY preserved"
);

// فحص ثبات تأثيرات البطاقات مع تلوين الأسماء
for (let i = 0; i < themedUno.cardsDeck.length; i++) {
  const origCard = unoBase.cardsDeck[i];
  const skinnedCard = themedUno.cardsDeck[i];
  assert(skinnedCard.id === origCard.id, `Card ${i} ID preserved`);
  assert(skinnedCard.category === origCard.category, `Card ${i} category preserved`);
  assert(
    JSON.stringify(skinnedCard.effects) === JSON.stringify(origCard.effects),
    `Card ${i} atomic effects strictly identical`
  );
}

const unoValidation = GeneratedSessionPackSchema.safeParse(themedUno);
assert(unoValidation.success, "Themed Uno satisfies GeneratedSessionPackSchema");

// 6. فحص عدم الخلط بين حزم البطاقات المخصصة وأونو
console.log("\n--- 6. Testing Custom Card Packs vs Uno Archetype Detection ---");
const heistPack = PRESET_PACKS.CYBERPUNK_HEIST;
assert(
  detectPackArchetype(heistPack) === "GENERIC",
  "A custom DECK_BATTLER pack must not be detected as Uno for reskinning"
);
const themedHeist = applyThemeToGamePack(heistPack, "ARABIAN_MAJLIS");
assert(
  themedHeist.themeTitle === heistPack.themeTitle,
  "Custom pack title is preserved after theming"
);
assert(
  themedHeist.rulesConfig.turnMechanism === "CARD_PLAY_ONLY",
  "Custom pack mechanics are preserved after theming"
);
assert(
  themedHeist.currencyName === heistPack.currencyName,
  "Custom pack currency is preserved after theming"
);

const themedUnoCyberpunk = applyThemeToGamePack(PRESET_PACKS.TACTICAL_CARDS_UNO, "CYBERPUNK_NEON");
assert(
  themedUnoCyberpunk.themeTitle.includes("أونو"),
  "Themed Uno keeps an explicit Uno marker in its title"
);
assert(
  detectPackArchetype(themedUnoCyberpunk) === "UNO",
  "Themed Uno is still detected as Uno"
);

const unoRoom = new BoardGameRoomMachine("THEMED_UNO_ROOM", () => {});
unoRoom.joinPlayer("u1", "لاعب ١", "#EF4444");
unoRoom.joinPlayer("u2", "لاعب ٢", "#3B82F6");
unoRoom.state.themeId = "CYBERPUNK_NEON";
unoRoom.startGameWithAIPack(themedUnoCyberpunk);
assert(unoRoom.getGameType() === "UNO", "Themed Uno starts the dedicated Uno engine");
assert(Boolean(unoRoom.state.unoState), "Themed Uno initializes the Uno deck and hands");

const customRoom = new BoardGameRoomMachine("CUSTOM_CARDS_ROOM", () => {});
customRoom.joinPlayer("c1", "لاعب ١", "#EF4444");
customRoom.joinPlayer("c2", "لاعب ٢", "#3B82F6");
customRoom.startGameWithAIPack(themedHeist);
assert(
  customRoom.getGameType() === "GENERIC_BOARD",
  "A custom card-only pack still starts the custom studio engine"
);
assert(!customRoom.state.unoState, "A custom card-only pack must not initialize Uno state");

// 7. فحص أن إعادة التلوين لا تغيّر المحرك المتخصص لأي لعبة
console.log("\n--- 7. Testing Themed Engine Routing for Every Classic Game ---");
const themedRouting: Array<[string, string, string]> = [
  ["MONOPOLY_CLASSIC", "CYBERPUNK_NEON", "MONOPOLY"],
  ["RIYADH_VIP", "DEEP_SPACE", "MONOPOLY"],
  ["LUDO_CLASSIC", "DEEP_SPACE", "LUDO"],
  ["TACTICAL_CARDS_UNO", "MEDIEVAL_FANTASY", "UNO"],
  ["SNAKES_AND_LADDERS_RPG", "ARABIAN_MAJLIS", "SNAKES_AND_LADDERS"],
  ["WORLD_CONQUEST_RISK", "CYBERPUNK_NEON", "RISK"],
  ["SOCIAL_MAFIA_SPY", "MEDIEVAL_FANTASY", "MAFIA"],
  ["CYBERPUNK_HEIST", "DEEP_SPACE", "GENERIC_BOARD"]
];

for (const [packKey, themeId, expectedEngine] of themedRouting) {
  const routed = applyThemeToGamePack(PRESET_PACKS[packKey], themeId);
  assert(
    GameEngineRegistry.detectGameType(routed) === expectedEngine,
    `${packKey} keeps the ${expectedEngine} engine after ${themeId} theming`
  );
}

console.log("\n=================================================");
console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED WITH 100% SUCCESS RATE!`);
console.log("=================================================");
