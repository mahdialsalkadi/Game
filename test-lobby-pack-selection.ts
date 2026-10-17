import { BoardGameRoomMachine } from "./src/game/gameRoom";
import { PRESET_PACKS } from "./src/game/aiPackGenerator";
import { GeneratedSessionPackSchema, type GeneratedSessionPack } from "./src/game/schema";

console.log("🧪 Running Lobby Pack Selection Tests...\n");

let passed = 0;
let total = 0;

function assert(condition: boolean, message: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    process.exitCode = 1;
  }
}

// 1. Verify PRESET_PACKS are available and valid
assert(!!PRESET_PACKS.CYBERPUNK_HEIST, "Cyberpunk Heist preset exists");
assert(!!PRESET_PACKS.ANCIENT_SULTANATE, "Ancient Sultanate preset exists");
assert(!!PRESET_PACKS.OFFICE_MAYHEM, "Office Mayhem preset exists");

const cyberPack = PRESET_PACKS.CYBERPUNK_HEIST;
const validCyberPack = GeneratedSessionPackSchema.safeParse(cyberPack);
assert(validCyberPack.success, "Cyberpunk Heist passes GeneratedSessionPackSchema validation");

// 2. Test starting game with Cyberpunk Heist preset
const broadcastEvents: Array<{ type: string; payload: any }> = [];
const machine = new BoardGameRoomMachine("TEST_LOBBY", (type, payload) => {
  broadcastEvents.push({ type, payload });
});

machine.joinPlayer("p1", "سارة", "#ff0000");
machine.joinPlayer("p2", "طارق", "#00ff00");

assert(machine.state.phase === "LOBBY", "Room begins in LOBBY phase");

machine.startGameWithAIPack(cyberPack);

assert(machine.state.phase === "TURN_START", "Game moves to TURN_START phase");
assert(machine.state.archetype === "DECK_BATTLER", "Game archetype matches Cyberpunk (DECK_BATTLER)");
assert(machine.state.winCondition === "TARGET_SCORE", "Win condition is TARGET_SCORE");
assert(machine.state.currencyName === "بت كوين", "Currency name matches Cyberpunk (بت كوين)");
assert(machine.state.tiles.length === 20, "20 tiles loaded from custom pack");
assert(machine.state.deck.length === cyberPack.cardsDeck.length, "Custom deck loaded properly");

// 3. Test starting game with Ancient Sultanate preset
const machine2 = new BoardGameRoomMachine("TEST_SULTAN", () => {});
machine2.joinPlayer("p1", "سارة", "#ff0000");
machine2.joinPlayer("p2", "طارق", "#00ff00");

const sultanPack = PRESET_PACKS.ANCIENT_SULTANATE;
machine2.startGameWithAIPack(sultanPack);

assert(machine2.state.archetype === "PARTY_ECONOMY", "Sultanate archetype matches PARTY_ECONOMY");
assert(machine2.state.winCondition === "MOST_COINS", "Sultanate win condition is MOST_COINS");
assert(machine2.state.currencyName === "دينار ذهبي", "Sultanate currency is دينار ذهبي");

// 4. Test starting game with Office Mayhem preset
const machine3 = new BoardGameRoomMachine("TEST_OFFICE", () => {});
machine3.joinPlayer("p1", "سارة", "#ff0000");
machine3.joinPlayer("p2", "طارق", "#00ff00");

const officePack = PRESET_PACKS.OFFICE_MAYHEM;
machine3.startGameWithAIPack(officePack);

assert(machine3.state.archetype === "SOCIAL_DEDUCTION", "Office archetype matches SOCIAL_DEDUCTION");
assert(machine3.state.winCondition === "LAST_SURVIVOR", "Office win condition is LAST_SURVIVOR");
assert(machine3.state.currencyName === "نقاط هيبة", "Office currency is نقاط هيبة");

// 5. Test validation rejection on corrupt pack
const corruptPack = {
  themeTitle: "Bad Pack",
  visualStyle: "CYBERPUNK",
  currencyName: "ذهب",
  narratorIntro: "مرحبا",
  tiles: [{ index: 0, tileType: "START", name: "Start", description: "Start" }], // only 1 tile instead of 20
  cardsDeck: []
};

const validationResult = GeneratedSessionPackSchema.safeParse(corruptPack);
assert(!validationResult.success, "Corrupt pack (less than 20 tiles) fails Zod validation");

console.log(`\nResults: ${passed}/${total} passed (${Math.round((passed / total) * 100)}%)`);
if (passed === total) {
  console.log("🎉 All Lobby Pack Selection Unit Tests Passed!");
}
