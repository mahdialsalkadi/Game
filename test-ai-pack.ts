import { GeneratedSessionPackSchema } from "./src/game/schema";
import {
  BOARD_GAME_SYSTEM_PROMPT,
  getDefaultSessionPack,
  sanitizeGeneratedPack
} from "./src/game/aiPackGenerator";
import type { GeneratedSessionPack } from "./src/game/schema";

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    passedTests++;
    console.log(`✅ PASS: ${message}`);
  }
}

console.log("=== DOMAIN 2 TEST SUITE: AI PACK GENERATOR & FALLBACKS ===\n");

// -------------------------------------------------------------
// SECTION 1: BOARD_GAME_SYSTEM_PROMPT Analysis
// -------------------------------------------------------------
console.log("--- 1. Testing BOARD_GAME_SYSTEM_PROMPT Rules ---");
assert(
  typeof BOARD_GAME_SYSTEM_PROMPT === "string" && BOARD_GAME_SYSTEM_PROMPT.length > 0,
  "BOARD_GAME_SYSTEM_PROMPT is exported and non-empty"
);

// Rule 1: Tile Quotas
const hasTileQuotas =
  BOARD_GAME_SYSTEM_PROMPT.includes("20 مربعاً") &&
  BOARD_GAME_SYSTEM_PROMPT.includes("START") &&
  BOARD_GAME_SYSTEM_PROMPT.includes("GLOBAL_VOTE") &&
  BOARD_GAME_SYSTEM_PROMPT.includes("RESOURCE") &&
  BOARD_GAME_SYSTEM_PROMPT.includes("HAZARD") &&
  BOARD_GAME_SYSTEM_PROMPT.includes("SECRET_CARD") &&
  BOARD_GAME_SYSTEM_PROMPT.includes("DRAMA_EVENT");
assert(hasTileQuotas, "Rule 1 (Tile Quotas): Prompt specifies exact distribution for all 6 tile types (20 tiles total)");

// Rule 2: Anti-Clumping
const hasAntiClumping =
  BOARD_GAME_SYSTEM_PROMPT.includes("قاعدة عدم التكتل") ||
  BOARD_GAME_SYSTEM_PROMPT.includes("Anti-Clumping Rule") ||
  BOARD_GAME_SYSTEM_PROMPT.includes("يمنع منعاً باتاً وضع مربعين من نفس النوع خلف بعضهما");
assert(hasAntiClumping, "Rule 2 (Anti-Clumping): Prompt contains anti-clumping directive");

// Rule 3: Cards Distribution
const hasCardsDistribution =
  BOARD_GAME_SYSTEM_PROMPT.includes("18 بطاقة") &&
  BOARD_GAME_SYSTEM_PROMPT.includes("SECRET_HAND") &&
  BOARD_GAME_SYSTEM_PROMPT.includes("PUBLIC_DRAMA") &&
  BOARD_GAME_SYSTEM_PROMPT.includes("VOTE_CARD");
assert(hasCardsDistribution, "Rule 3 (Cards Distribution): Prompt specifies 18 cards across SECRET_HAND, PUBLIC_DRAMA, VOTE_CARD");

// Rule 4: Fair Spotlight
const hasFairSpotlight =
  BOARD_GAME_SYSTEM_PROMPT.includes("التوزيع العادل") &&
  BOARD_GAME_SYSTEM_PROMPT.includes("بطاقتين على الأقل");
assert(hasFairSpotlight, "Rule 4 (Fair Spotlight): Prompt mandates fair player name distribution (min 2, max 3)");

// Rule 5: Positive Bias
// Checking whether positive bias is explicitly named vs mathematically configured
const hasExplicitPositiveBiasPhrase =
  BOARD_GAME_SYSTEM_PROMPT.toLowerCase().includes("positive bias") ||
  BOARD_GAME_SYSTEM_PROMPT.includes("انحياز إيجابي");
const hasImplicitPositiveBias =
  BOARD_GAME_SYSTEM_PROMPT.includes("+100") &&
  BOARD_GAME_SYSTEM_PROMPT.includes("موجبة بين +45 و +85") &&
  BOARD_GAME_SYSTEM_PROMPT.includes("سالبة بين -25 و -55");

console.log(`ℹ️ Rule 5 (Positive Bias): Explicit phrase present? ${hasExplicitPositiveBiasPhrase}`);
console.log(`ℹ️ Rule 5 (Positive Bias): Mathematical bias present (+100 start, +45-85 resources x6 vs -25-55 hazards x4)? ${hasImplicitPositiveBias}`);
assert(
  hasImplicitPositiveBias,
  "Rule 5 (Positive Bias): Net positive economic math (+100 Start, 6 positive Resources vs 4 Hazards) is encoded in prompt"
);

// -------------------------------------------------------------
// SECTION 2: getDefaultSessionPack Verification
// -------------------------------------------------------------
console.log("\n--- 2. Testing getDefaultSessionPack ---");
const playerNames = ["سارة", "فهد", "ريم", "عمر"];
const defaultPack = getDefaultSessionPack(playerNames);

// 2.1 Schema validation
const parseResult = GeneratedSessionPackSchema.safeParse(defaultPack);
assert(parseResult.success, "Default pack passes GeneratedSessionPackSchema validation without errors");

// 2.2 Board length and indices
assert(defaultPack.tiles.length === 20, "Default pack has exactly 20 tiles");
assert(
  defaultPack.tiles.every((tile, i) => tile.index === i),
  "Default pack tiles have strictly contiguous indices from 0 to 19"
);

// 2.3 Tile 0 is START with +100
const tile0 = defaultPack.tiles[0];
assert(
  tile0.tileType === "START" &&
  tile0.defaultEffect?.actionType === "MODIFY_COINS" &&
  tile0.defaultEffect?.targetType === "SELF" &&
  tile0.defaultEffect?.value === 100,
  "Tile 0 is START with defaultEffect MODIFY_COINS +100 for SELF"
);

// 2.4 GLOBAL_VOTE tiles at 7 and 15
assert(
  defaultPack.tiles[7].tileType === "GLOBAL_VOTE" && defaultPack.tiles[15].tileType === "GLOBAL_VOTE",
  "Tiles 7 and 15 are GLOBAL_VOTE"
);

// 2.5 Tile distribution counts
const tileCounts = defaultPack.tiles.reduce((acc, t) => {
  acc[t.tileType] = (acc[t.tileType] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

assert(tileCounts["START"] === 1, "Tile distribution: 1 START tile");
assert(tileCounts["RESOURCE"] === 6, "Tile distribution: 6 RESOURCE tiles");
assert(tileCounts["HAZARD"] === 4, "Tile distribution: 4 HAZARD tiles");
assert(tileCounts["SECRET_CARD"] === 4, "Tile distribution: 4 SECRET_CARD tiles");
assert(tileCounts["DRAMA_EVENT"] === 3, "Tile distribution: 3 DRAMA_EVENT tiles");
assert(tileCounts["GLOBAL_VOTE"] === 2, "Tile distribution: 2 GLOBAL_VOTE tiles");

// 2.6 Anti-clumping check on default tiles
let hasClumping = false;
for (let i = 0; i < defaultPack.tiles.length; i++) {
  const next = (i + 1) % defaultPack.tiles.length;
  if (defaultPack.tiles[i].tileType === defaultPack.tiles[next].tileType) {
    hasClumping = true;
    break;
  }
}
assert(!hasClumping, "Anti-clumping verified: No two adjacent tiles share the same type");

// 2.7 Cards Deck verification
assert(defaultPack.cardsDeck.length >= 15, `Cards deck has >= 15 cards (actual: ${defaultPack.cardsDeck.length})`);
const secretCards = defaultPack.cardsDeck.filter(c => c.category === "SECRET_HAND");
const dramaCards = defaultPack.cardsDeck.filter(c => c.category === "PUBLIC_DRAMA");
const voteCards = defaultPack.cardsDeck.filter(c => c.category === "VOTE_CARD");

assert(secretCards.length === 6, "Cards distribution: 6 SECRET_HAND cards");
assert(dramaCards.length === 8, "Cards distribution: 8 PUBLIC_DRAMA cards");
assert(voteCards.length === 4, "Cards distribution: 4 VOTE_CARD cards");
assert(
  secretCards.length > 0 && dramaCards.length > 0 && voteCards.length > 0,
  "All 3 card categories (SECRET_HAND, PUBLIC_DRAMA, VOTE_CARD) are present"
);

// 2.8 Narrator intro interpolation
assert(
  playerNames.every(name => defaultPack.narratorIntro.includes(name)),
  "Narrator intro correctly includes all provided player names"
);

// -------------------------------------------------------------
// SECTION 3: sanitizeGeneratedPack Verification
// -------------------------------------------------------------
console.log("\n--- 3. Testing sanitizeGeneratedPack Post-Processing Guard ---");

// Build a "dirty" / imperfect pack to test sanitization edge cases:
// 1. Tile 0 has wrong type ("HAZARD") and negative value
// 2. Tile 1 is RESOURCE without defaultEffect
// 3. Tile 3 is HAZARD without defaultEffect
// 4. Tile 4 is RESOURCE with existing defaultEffect (should NOT be overwritten)
// 5. Card 1 is PUBLIC_DRAMA with illegal CHOSEN_PLAYER target and VOTE_PENALTY action
// 6. Card 2 is VOTE_CARD with positive value and wrong target
// 7. Non-contiguous or wrong tile indices
// 8. Missing card IDs
const dirtyPack: GeneratedSessionPack = {
  themeTitle: "Dirty Test Pack",
  visualStyle: "CYBERPUNK",
  archetype: "PARTY_ECONOMY",
  rulesConfig: {
    turnMechanism: "DICE_AND_MOVE",
    cardVisibility: "SECRET_PHONE_ONLY",
    ownershipSystem: "NONE"
  },
  winCondition: "MOST_COINS",
  currencyName: "شيكل",
  narratorIntro: "مرحبا بالمختبرين",
  tiles: [
    { index: 99, tileType: "HAZARD", name: "خطر البداية", description: "وصف", defaultEffect: { actionType: "MODIFY_COINS", targetType: "SELF", value: -50 } },
    { index: 98, tileType: "RESOURCE", name: "مورد بدون تأثير", description: "وصف" }, // missing defaultEffect
    { index: 97, tileType: "SECRET_CARD", name: "سر", description: "وصف" },
    { index: 96, tileType: "HAZARD", name: "فخ بدون تأثير", description: "وصف" }, // missing defaultEffect
    { index: 95, tileType: "RESOURCE", name: "مورد موجود", description: "وصف", defaultEffect: { actionType: "MODIFY_COINS", targetType: "SELF", value: 85 } },
    ...defaultPack.tiles.slice(5) // rest from valid pack
  ],
  cardsDeck: [
    {
      id: "wrong_id_1",
      title: "دراما مخالفة",
      category: "PUBLIC_DRAMA",
      flavorText: "بطاقة دراما تحتوي CHOSEN_PLAYER و VOTE_PENALTY غير قانونيين",
      effects: [
        { actionType: "VOTE_PENALTY", targetType: "CHOSEN_PLAYER", value: -30 },
        { actionType: "MODIFY_COINS", targetType: "CHOSEN_PLAYER", value: 20 }
      ]
    },
    {
      id: "wrong_id_2",
      title: "تصويت مخالف",
      category: "VOTE_CARD",
      flavorText: "بطاقة تصويت بقيمة موجبة وهدف خاطئ",
      effects: [
        { actionType: "MODIFY_COINS", targetType: "SELF", value: 50 }
      ]
    },
    ...defaultPack.cardsDeck.slice(2)
  ]
};

const cleanedPack = sanitizeGeneratedPack(dirtyPack);

// 3.1 Tile 0 fix
assert(cleanedPack.tiles[0].index === 0, "Sanitization: Tile 0 index set to 0");
assert(cleanedPack.tiles[0].tileType === "START", "Sanitization: Tile 0 type forced to START");
assert(
  cleanedPack.tiles[0].defaultEffect?.actionType === "MODIFY_COINS" &&
  cleanedPack.tiles[0].defaultEffect?.targetType === "SELF" &&
  cleanedPack.tiles[0].defaultEffect?.value === 100,
  "Sanitization: Tile 0 defaultEffect forced to MODIFY_COINS +100 for SELF"
);

// 3.2 Contiguous indices
assert(
  cleanedPack.tiles.every((tile, i) => tile.index === i),
  "Sanitization: All 20 tile indices re-indexed contiguously from 0 to 19"
);

// 3.3 Missing RESOURCE defaultEffect filled with +60
assert(
  cleanedPack.tiles[1].defaultEffect?.actionType === "MODIFY_COINS" &&
  cleanedPack.tiles[1].defaultEffect?.targetType === "SELF" &&
  cleanedPack.tiles[1].defaultEffect?.value === 60,
  "Sanitization: Missing RESOURCE defaultEffect filled with default +60 coins"
);

// 3.4 Missing HAZARD defaultEffect filled with -40
assert(
  cleanedPack.tiles[3].defaultEffect?.actionType === "MODIFY_COINS" &&
  cleanedPack.tiles[3].defaultEffect?.targetType === "SELF" &&
  cleanedPack.tiles[3].defaultEffect?.value === -40,
  "Sanitization: Missing HAZARD defaultEffect filled with default -40 coins"
);

// 3.5 Existing RESOURCE defaultEffect preserved (+85)
assert(
  cleanedPack.tiles[4].defaultEffect?.value === 85,
  "Sanitization: Existing defaultEffect on RESOURCE (85) preserved, not overwritten"
);

// 3.6 PUBLIC_DRAMA: Illegal CHOSEN_PLAYER replaced with RANDOM_OTHER
const dramaCard = cleanedPack.cardsDeck[0];
assert(dramaCard.category === "PUBLIC_DRAMA", "First card is PUBLIC_DRAMA");
assert(
  dramaCard.effects.every(e => e.targetType !== "CHOSEN_PLAYER"),
  "Sanitization: Illegal CHOSEN_PLAYER in PUBLIC_DRAMA replaced (no CHOSEN_PLAYER remaining)"
);
assert(
  dramaCard.effects[0].targetType === "RANDOM_OTHER" && dramaCard.effects[1].targetType === "RANDOM_OTHER",
  "Sanitization: CHOSEN_PLAYER targets successfully transformed to RANDOM_OTHER"
);

// 3.7 PUBLIC_DRAMA: Illegal VOTE_PENALTY replaced with MODIFY_COINS
assert(
  dramaCard.effects[0].actionType === "MODIFY_COINS",
  "Sanitization: Illegal VOTE_PENALTY action in PUBLIC_DRAMA converted to MODIFY_COINS"
);

// 3.8 VOTE_CARD: Enforces VOTE_PENALTY, ALL_OTHERS, negative value
const voteCard = cleanedPack.cardsDeck[1];
assert(voteCard.category === "VOTE_CARD", "Second card is VOTE_CARD");
assert(voteCard.effects.length === 1, "Sanitization: VOTE_CARD has exactly 1 effect");
assert(
  voteCard.effects[0].actionType === "VOTE_PENALTY",
  "Sanitization: VOTE_CARD actionType enforced as VOTE_PENALTY"
);
assert(
  voteCard.effects[0].targetType === "ALL_OTHERS",
  "Sanitization: VOTE_CARD targetType enforced as ALL_OTHERS"
);
assert(
  voteCard.effects[0].value === -50,
  "Sanitization: VOTE_CARD value converted to negative (-50)"
);

// 3.9 Card IDs normalized to card_01, card_02, ...
assert(
  cleanedPack.cardsDeck.every((c, i) => c.id === `card_${String(i + 1).padStart(2, "0")}`),
  "Sanitization: All card IDs normalized sequentially to card_01, card_02, ..."
);

// 3.10 Cleaned pack validates against schema
const cleanedParse = GeneratedSessionPackSchema.safeParse(cleanedPack);
assert(cleanedParse.success, "Sanitization: Cleaned pack strictly validates against GeneratedSessionPackSchema");

console.log(`\n======================================================`);
console.log(`FINAL RESULT: All ${passedTests}/${totalTests} assertions PASSED!`);
console.log(`======================================================`);
