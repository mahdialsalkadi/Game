import { BoardGameRoomMachine } from "./src/game/gameRoom";
import { getDefaultSessionPack } from "./src/game/aiPackGenerator";
import { GameSettingsSchema } from "./src/game/schema";

async function runTests() {
  console.log("🧪 Starting Game Settings Unit & Integration Tests...\n");
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

  // Test 1: Schema validation and clamping
  try {
    const valid = GameSettingsSchema.parse({ maxRounds: 5, startingCoins: 200, passStartBonus: 100 });
    assert(valid.maxRounds === 5 && valid.startingCoins === 200, "GameSettingsSchema accepts valid custom values");

    let rejectedLow = false;
    try {
      GameSettingsSchema.parse({ maxRounds: 2 }); // min is 3
    } catch {
      rejectedLow = true;
    }
    assert(rejectedLow, "GameSettingsSchema rejects maxRounds < 3");

    let rejectedHigh = false;
    try {
      GameSettingsSchema.parse({ startingCoins: 600 }); // max is 500
    } catch {
      rejectedHigh = true;
    }
    assert(rejectedHigh, "GameSettingsSchema rejects startingCoins > 500");
  } catch (e: any) {
    assert(false, `Schema test failed: ${e.message}`);
  }

  // Test 2: Machine initialized with custom settings
  try {
    const events: any[] = [];
    const machine = new BoardGameRoomMachine("test_settings_1", (type, payload) => {
      events.push({ type, payload });
    }, { maxRounds: 5, startingCoins: 250 });

    assert(machine.state.settings?.maxRounds === 5, "Engine state reflects custom maxRounds (5)");
    assert(machine.state.settings?.startingCoins === 250, "Engine state reflects custom startingCoins (250)");

    machine.joinPlayer("p1", "خالد", "#EF4444");
    assert(machine.state.players["p1"].coins === 250, "Joined player receives custom starting coins (250)");
  } catch (e: any) {
    assert(false, `Initialization test failed: ${e.message}`);
  }

  // Test 3: Updating settings in LOBBY phase
  try {
    const events: any[] = [];
    const machine = new BoardGameRoomMachine("test_settings_2", (type, payload) => {
      events.push({ type, payload });
    });

    machine.joinPlayer("p1", "سارة", "#3B82F6");
    assert(machine.state.players["p1"].coins === 150, "Default starting coins is 150");

    // Update settings in lobby
    machine.updateSettings({ startingCoins: 300, maxRounds: 8 });
    assert(machine.state.settings.startingCoins === 300, "updateSettings updates state.settings.startingCoins");
    assert(machine.state.settings.maxRounds === 8, "updateSettings updates state.settings.maxRounds");
    assert(machine.state.players["p1"].coins === 300, "Existing lobby player coins updated to new startingCoins (300)");

    machine.joinPlayer("p2", "عمر", "#22C55E");
    assert(machine.state.players["p2"].coins === 300, "Newly joined player also gets updated startingCoins (300)");
  } catch (e: any) {
    assert(false, `Lobby update settings test failed: ${e.message}`);
  }

  // Test 4: Settings update rejected once game started
  try {
    const machine = new BoardGameRoomMachine("test_settings_3", () => {});
    machine.joinPlayer("p1", "علي", "#EF4444");
    machine.joinPlayer("p2", "فهد", "#3B82F6");

    const pack = getDefaultSessionPack(["علي", "فهد"]);
    machine.startGameWithAIPack(pack);

    let rejected = false;
    try {
      machine.updateSettings({ maxRounds: 20 });
    } catch {
      rejected = true;
    }
    assert(rejected, "updateSettings throws error if game already started");
  } catch (e: any) {
    assert(false, `Game started rejection test failed: ${e.message}`);
  }

  // Test 5: Game ends at custom maxRounds
  try {
    const machine = new BoardGameRoomMachine("test_settings_4", () => {}, { maxRounds: 3 });
    machine.joinPlayer("p1", "زيد", "#EF4444");
    machine.joinPlayer("p2", "عمرو", "#3B82F6");

    const pack = getDefaultSessionPack(["زيد", "عمرو"]);
    machine.startGameWithAIPack(pack);

    // Fast-forward rounds to round 3
    machine.state.currentRound = 3;
    machine.state.currentTurnIndex = 1; // Last player in turn order
    
    // Trigger roll dice which advances turn
    machine.rollDiceAndMove("p2");

    assert(machine.state.phase === "GAME_OVER", "Game reaches GAME_OVER after exceeding custom maxRounds (3)");
  } catch (e: any) {
    assert(false, `Max rounds game end test failed: ${e.message}`);
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
