import assert from "node:assert";
import { PRESET_PACKS, FAMOUS_GAME_PRESETS, getMatchingPresetPack } from "./src/game/aiPackGenerator";
import { GeneratedSessionPackSchema } from "./src/game/schema";

console.log("🧪 Running 7 Famous Presets Verification Test...");

// 1. Verify FAMOUS_GAME_PRESETS metadata
assert.ok(Array.isArray(FAMOUS_GAME_PRESETS), "FAMOUS_GAME_PRESETS must be an array");
assert.strictEqual(FAMOUS_GAME_PRESETS.length, 7, "Must have exactly 7 famous presets metadata");

const expectedKeys = [
  "MONOPOLY_CLASSIC",
  "WORLD_CONQUEST_RISK",
  "TACTICAL_CARDS_UNO",
  "SOCIAL_MAFIA_SPY",
  "SNAKES_AND_LADDERS_RPG",
  "SULTANATE_MERCHANTS",
  "LUDO_CLASSIC"
];

for (const key of expectedKeys) {
  assert.ok(PRESET_PACKS[key], `PRESET_PACKS must contain ${key}`);
  const pack = PRESET_PACKS[key];

  const validated = GeneratedSessionPackSchema.parse(pack);
  if (key === "SNAKES_AND_LADDERS_RPG") {
    assert.strictEqual(validated.tiles.length, 100, `${key} must have exactly 100 tiles`);
  } else {
    assert.ok(validated.tiles.length >= 20, `${key} must have at least 20 tiles`);
  }
  assert.ok(validated.cardsDeck.length >= 15, `${key} must have at least 15 cards`);
  assert.ok(validated.rulesConfig, `${key} must have rulesConfig defined`);

  console.log(`  ✅ Preset ${key} is valid! (Archetype: ${pack.archetype}, Mechanism: ${pack.rulesConfig?.turnMechanism})`);
}

// 2. Specific mechanics verification per preset:

// Monopoly: BUY_AND_RENT, street prices and rents
const monopoly = PRESET_PACKS.MONOPOLY_CLASSIC;
assert.strictEqual(monopoly.rulesConfig.ownershipSystem, "BUY_AND_RENT");
assert.strictEqual(monopoly.rulesConfig.turnMechanism, "DICE_AND_MOVE");
const purchasableTiles = monopoly.tiles.filter(t => t.price && t.price > 0);
assert.ok(purchasableTiles.length >= 10, "Monopoly must have at least 10 purchasable properties");
assert.ok(purchasableTiles.every(t => t.rent && t.rent > 0), "Purchasable properties must have rent defined");

// Risk: TERRITORY_COMMAND, CONQUER_REGIONS, NO_HAND_CARDS
const risk = PRESET_PACKS.WORLD_CONQUEST_RISK;
assert.strictEqual(risk.rulesConfig.turnMechanism, "TERRITORY_COMMAND");
assert.strictEqual(risk.rulesConfig.ownershipSystem, "CONQUER_REGIONS");
assert.strictEqual(risk.rulesConfig.cardVisibility, "NO_HAND_CARDS");
const territories = risk.tiles.filter(t => t.armies && t.armies > 0);
assert.ok(territories.length >= 10, "Risk must have territories with armies defined");

// Uno: CARD_PLAY_ONLY, TARGET_SCORE
const uno = PRESET_PACKS.TACTICAL_CARDS_UNO;
assert.strictEqual(uno.rulesConfig.turnMechanism, "CARD_PLAY_ONLY");
assert.strictEqual(uno.winCondition, "TARGET_SCORE");

// Mafia: SOCIAL_DISCUSSION_VOTE, OPEN_PUBLIC_CARDS, LAST_SURVIVOR
const mafia = PRESET_PACKS.SOCIAL_MAFIA_SPY;
assert.strictEqual(mafia.rulesConfig.turnMechanism, "SOCIAL_DISCUSSION_VOTE");
assert.strictEqual(mafia.rulesConfig.cardVisibility, "OPEN_PUBLIC_CARDS");
assert.strictEqual(mafia.winCondition, "LAST_SURVIVOR");

// Snakes & Ladders: FIRST_TO_FINISH, jumpToIndex ladders and snakes
const snakes = PRESET_PACKS.SNAKES_AND_LADDERS_RPG;
assert.strictEqual(snakes.winCondition, "FIRST_TO_FINISH");
const ladders = snakes.tiles.filter(t => t.jumpToIndex !== undefined && t.jumpToIndex > t.index);
const snakeTraps = snakes.tiles.filter(t => t.jumpToIndex !== undefined && t.jumpToIndex < t.index);
assert.ok(ladders.length >= 2, "Must have at least 2 ladders");
assert.ok(snakeTraps.length >= 2, "Must have at least 2 snake traps");

// Sultanate: BUY_AND_RENT, MOST_COINS
const sultanate = PRESET_PACKS.SULTANATE_MERCHANTS;
assert.strictEqual(sultanate.rulesConfig.ownershipSystem, "BUY_AND_RENT");
assert.strictEqual(sultanate.winCondition, "MOST_COINS");

// Ludo: BOARD_RACE, DICE_AND_MOVE, FIRST_TO_FINISH
const ludo = PRESET_PACKS.LUDO_CLASSIC;
assert.strictEqual(ludo.archetype, "BOARD_RACE");
assert.strictEqual(ludo.rulesConfig.turnMechanism, "DICE_AND_MOVE");
assert.strictEqual(ludo.winCondition, "FIRST_TO_FINISH");

// 3. Keyword matching in getMatchingPresetPack
const monopolyMatch = getMatchingPresetPack("PARTY_ECONOMY", "نريد نلعب مونوبولي وعقارات");
assert.strictEqual(monopolyMatch.rulesConfig?.ownershipSystem, "BUY_AND_RENT");

const riskMatch = getMatchingPresetPack("BOARD_RACE", "حرب واحتلال دول وريسك");
assert.strictEqual(riskMatch.rulesConfig?.turnMechanism, "TERRITORY_COMMAND");

const ludoMatch = getMatchingPresetPack("BOARD_RACE", "نريد نلعب لودو ستار وجاكارو");
assert.strictEqual(ludoMatch.themeTitle, PRESET_PACKS.LUDO_CLASSIC.themeTitle);

console.log("🎉 All 7 Famous Presets verified successfully!");
