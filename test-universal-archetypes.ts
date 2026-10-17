import { BoardGameRoomMachine } from "./src/game/gameRoom";
import { getDefaultSessionPack } from "./src/game/aiPackGenerator";
import { WinConditionEnum, GameArchetypeEnum } from "./src/game/schema";

async function runTests() {
  console.log("🧪 Starting Universal Game Archetypes & Multi-Win Condition Tests...\n");
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

  // Test 1: Schema Enums
  try {
    assert(WinConditionEnum.options.includes("MOST_COINS"), "WinConditionEnum has MOST_COINS");
    assert(WinConditionEnum.options.includes("FIRST_TO_FINISH"), "WinConditionEnum has FIRST_TO_FINISH");
    assert(WinConditionEnum.options.includes("TARGET_SCORE"), "WinConditionEnum has TARGET_SCORE");
    assert(WinConditionEnum.options.includes("LAST_SURVIVOR"), "WinConditionEnum has LAST_SURVIVOR");
    assert(GameArchetypeEnum.options.includes("BOARD_RACE"), "GameArchetypeEnum has BOARD_RACE");
    assert(GameArchetypeEnum.options.includes("PARTY_ECONOMY"), "GameArchetypeEnum has PARTY_ECONOMY");
  } catch (e: any) {
    assert(false, `Schema enum test failed: ${e.message}`);
  }

  // Test 2: TARGET_SCORE Instant Win
  try {
    const broadcasts: { type: string; payload: any }[] = [];
    const machine = new BoardGameRoomMachine("test_target_score", (type, payload) => {
      broadcasts.push({ type, payload });
    });

    machine.joinPlayer("p1", "سلطان", "#EF4444");
    machine.joinPlayer("p2", "طارق", "#3B82F6");

    const pack = getDefaultSessionPack(["سلطان", "طارق"]);
    pack.winCondition = "TARGET_SCORE";
    pack.targetScore = 300;

    machine.startGameWithAIPack(pack);

    // Sultan gains 350 coins (exceeding target 300)
    machine.state.players["p1"].coins = 350;

    // Check victory condition
    const victory = machine.checkVictoryCondition();
    assert(victory.isOver === true, "TARGET_SCORE: isOver is true when player reaches target score");
    assert(victory.winner?.id === "p1", "TARGET_SCORE: Sultan is recognized as winner");
    assert(victory.reasonAr.includes("وصل للرصيد المستهدف"), "TARGET_SCORE: provides clear Arabic victory reason");
  } catch (e: any) {
    assert(false, `TARGET_SCORE test failed: ${e.message}`);
  }

  // Test 3: FIRST_TO_FINISH (Board Race)
  try {
    const machine = new BoardGameRoomMachine("test_race", () => {});
    machine.joinPlayer("p1", "فارس", "#EF4444");
    machine.joinPlayer("p2", "ماجد", "#3B82F6");

    const pack = getDefaultSessionPack(["فارس", "ماجد"]);
    pack.archetype = "BOARD_RACE";
    pack.winCondition = "FIRST_TO_FINISH";

    machine.startGameWithAIPack(pack);

    // Fares reaches the finish line (tile 19)
    machine.state.players["p1"].position = 19;
    const victory = machine.checkVictoryCondition();

    assert(victory.isOver === true, "FIRST_TO_FINISH: isOver is true when player reaches final tile 19");
    assert(victory.winner?.id === "p1", "FIRST_TO_FINISH: Fares is recognized as winner");
    assert(victory.reasonAr.includes("خط النهاية"), "FIRST_TO_FINISH: provides clear race finish message");
  } catch (e: any) {
    assert(false, `FIRST_TO_FINISH test failed: ${e.message}`);
  }

  // Test 4: Backward Compatibility - defaults to MOST_COINS
  try {
    const machine = new BoardGameRoomMachine("test_backward_compat", () => {});
    machine.joinPlayer("p1", "نور", "#EF4444");
    machine.joinPlayer("p2", "ريم", "#3B82F6");

    const pack = getDefaultSessionPack(["نور", "ريم"]);
    // Delete winCondition if present
    delete (pack as any).winCondition;

    machine.startGameWithAIPack(pack);
    assert(machine.state.winCondition === "MOST_COINS", "Backward compat: defaults to MOST_COINS");
  } catch (e: any) {
    assert(false, `Backward compatibility test failed: ${e.message}`);
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
