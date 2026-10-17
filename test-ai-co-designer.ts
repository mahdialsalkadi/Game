import { PRESET_PACKS, generateGameFromTheme } from "./src/game/aiPackGenerator";
import { GeneratedSessionPackSchema } from "./src/game/schema";

async function runTests() {
  console.log("🧪 Starting AI Co-Designer & Preset Library Tests...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // Test 1: PRESET_PACKS existence and keys
  try {
    assert(Boolean(PRESET_PACKS), "PRESET_PACKS is exported");
    assert(Boolean(PRESET_PACKS.CYBERPUNK_HEIST), "PRESET_PACKS has CYBERPUNK_HEIST");
    assert(Boolean(PRESET_PACKS.ANCIENT_SULTANATE), "PRESET_PACKS has ANCIENT_SULTANATE");
    assert(Boolean(PRESET_PACKS.OFFICE_MAYHEM), "PRESET_PACKS has OFFICE_MAYHEM");
  } catch (e: any) {
    assert(false, `PRESET_PACKS export test failed: ${e.message}`);
  }

  // Test 2: CYBERPUNK_HEIST Validation & Config
  try {
    const pack = GeneratedSessionPackSchema.parse(PRESET_PACKS.CYBERPUNK_HEIST);
    assert(pack.tiles.length === 20, "CYBERPUNK_HEIST has exactly 20 tiles");
    assert(pack.cardsDeck.length >= 15, "CYBERPUNK_HEIST has at least 15 cards");
    assert(pack.archetype === "DECK_BATTLER", "CYBERPUNK_HEIST archetype is DECK_BATTLER");
    assert(pack.winCondition === "TARGET_SCORE", "CYBERPUNK_HEIST winCondition is TARGET_SCORE");
    assert(pack.targetScore === 400, "CYBERPUNK_HEIST targetScore is 400");
    assert(pack.currencyName === "بت كوين", "CYBERPUNK_HEIST currency is بت كوين");
  } catch (e: any) {
    assert(false, `CYBERPUNK_HEIST validation failed: ${e.message}`);
  }

  // Test 3: ANCIENT_SULTANATE Validation & Config
  try {
    const pack = GeneratedSessionPackSchema.parse(PRESET_PACKS.ANCIENT_SULTANATE);
    assert(pack.tiles.length === 20, "ANCIENT_SULTANATE has exactly 20 tiles");
    assert(pack.archetype === "PARTY_ECONOMY", "ANCIENT_SULTANATE archetype is PARTY_ECONOMY");
    assert(pack.winCondition === "MOST_COINS", "ANCIENT_SULTANATE winCondition is MOST_COINS");
  } catch (e: any) {
    assert(false, `ANCIENT_SULTANATE validation failed: ${e.message}`);
  }

  // Test 4: OFFICE_MAYHEM Validation & Config
  try {
    const pack = GeneratedSessionPackSchema.parse(PRESET_PACKS.OFFICE_MAYHEM);
    assert(pack.tiles.length === 20, "OFFICE_MAYHEM has exactly 20 tiles");
    assert(pack.archetype === "SOCIAL_DEDUCTION", "OFFICE_MAYHEM archetype is SOCIAL_DEDUCTION");
    assert(pack.winCondition === "LAST_SURVIVOR", "OFFICE_MAYHEM winCondition is LAST_SURVIVOR");
  } catch (e: any) {
    assert(false, `OFFICE_MAYHEM validation failed: ${e.message}`);
  }

  // Test 5: generateGameFromTheme export signature
  try {
    assert(typeof generateGameFromTheme === "function", "generateGameFromTheme is an exported function");
  } catch (e: any) {
    assert(false, `generateGameFromTheme test failed: ${e.message}`);
  }

  console.log(`\n================================`);
  console.log(`Total Passed: ${passed}`);
  console.log(`Total Failed: ${failed}`);
  console.log(`================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
