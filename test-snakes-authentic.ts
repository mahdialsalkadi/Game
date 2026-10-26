import assert from "node:assert";
import { BoardGameRoomMachine } from "./src/game/gameRoom";
import { PRESET_PACKS } from "./src/game/aiPackGenerator";
import { executeCardEffects } from "./src/game/effectEngine";
import {
  LADDERS,
  SNAKES,
  getSquareCoordinates,
  formatSquareNumber,
  getSurroundingThreatsAndOpportunities
} from "./src/components/snakes/snakesConfig";
import { sfx } from "./src/utils/soundEffects";

console.log("====================================================");
console.log("🪜 RUNNING AUTHENTIC SNAKES & LADDERS 100 VERIFICATION");
console.log("====================================================\n");

// --- 1. Verify 100-Tile Preset Architecture ---
console.log("1️⃣ Verifying SNAKES_AND_LADDERS_RPG Preset & 100 Tiles...");
const pack = PRESET_PACKS.SNAKES_AND_LADDERS_RPG;
assert.ok(pack, "Preset SNAKES_AND_LADDERS_RPG exists in PRESET_PACKS");
assert.strictEqual(pack.archetype, "BOARD_RACE", "Archetype must be BOARD_RACE");
assert.strictEqual(pack.winCondition, "FIRST_TO_FINISH", "Win condition must be FIRST_TO_FINISH");
assert.strictEqual(pack.tiles.length, 100, "Pack must contain exactly 100 tiles (1 to 100)");

assert.strictEqual(pack.tiles[0].index, 0, "Tile 0 index is 0");
assert.strictEqual(pack.tiles[0].tileType, "START", "Tile 0 is START (Square 1)");
assert.strictEqual(pack.tiles[99].index, 99, "Tile 99 index is 99");
assert.ok(pack.tiles[99].name.includes("100"), "Tile 99 represents Square 100");
console.log("   ✅ 100-Tile Preset structure verified successfully.\n");

// --- 2. Verify Exact Iconic Ladders (8 ladders) ---
console.log("2️⃣ Verifying All 8 Iconic Wooden Ladders...");
const expectedLadders = [
  { from: 4, to: 14 },
  { from: 9, to: 31 },
  { from: 20, to: 38 },
  { from: 28, to: 84 },
  { from: 40, to: 59 },
  { from: 51, to: 67 },
  { from: 63, to: 81 },
  { from: 71, to: 91 }
];

assert.strictEqual(LADDERS.length, 8, "Must define exactly 8 iconic ladders");

for (const exp of expectedLadders) {
  const ladderInConfig = LADDERS.find((l) => l.from === exp.from && l.to === exp.to);
  assert.ok(ladderInConfig, `Ladder ${exp.from} -> ${exp.to} must exist in LADDERS config`);

  // In 0-indexed tile array:
  const baseTile = pack.tiles[exp.from - 1];
  assert.ok(baseTile, `Tile for square ${exp.from} must exist`);
  assert.strictEqual(
    baseTile.jumpToIndex,
    exp.to - 1,
    `Tile ${exp.from - 1} (Square ${exp.from}) must have jumpToIndex ${exp.to - 1} (Square ${exp.to})`
  );
  assert.ok(
    baseTile.jumpToIndex! > baseTile.index,
    `Ladder must jump forward: ${baseTile.jumpToIndex} > ${baseTile.index}`
  );
}
console.log("   ✅ All 8 Iconic Ladders verified with forward jump indexes.\n");

// --- 3. Verify Exact Iconic Snakes (8 snakes) ---
console.log("3️⃣ Verifying All 8 Iconic Winding Snakes...");
const expectedSnakes = [
  { from: 17, to: 7 },
  { from: 54, to: 34 },
  { from: 62, to: 19 },
  { from: 64, to: 60 },
  { from: 87, to: 24 },
  { from: 93, to: 73 },
  { from: 95, to: 75 },
  { from: 99, to: 78 }
];

assert.strictEqual(SNAKES.length, 8, "Must define exactly 8 iconic snakes");

for (const exp of expectedSnakes) {
  const snakeInConfig = SNAKES.find((s) => s.from === exp.from && s.to === exp.to);
  assert.ok(snakeInConfig, `Snake ${exp.from} -> ${exp.to} must exist in SNAKES config`);

  // In 0-indexed tile array:
  const headTile = pack.tiles[exp.from - 1];
  assert.ok(headTile, `Tile for square ${exp.from} must exist`);
  assert.strictEqual(
    headTile.jumpToIndex,
    exp.to - 1,
    `Tile ${exp.from - 1} (Square ${exp.from}) must have jumpToIndex ${exp.to - 1} (Square ${exp.to})`
  );
  assert.ok(
    headTile.jumpToIndex! < headTile.index,
    `Snake must slide backward: ${headTile.jumpToIndex} < ${headTile.index}`
  );
}
console.log("   ✅ All 8 Iconic Snakes verified with backward slide indexes.\n");

// --- 4. BoardGameRoomMachine Jump Event Verification ---
console.log("4️⃣ Verifying Room State Machine Ladder & Snake Jumps...");
const broadcasts: Array<{ eventType: string; payload: any }> = [];
const machine = new BoardGameRoomMachine("room_snakes_test", (type, payload) => {
  broadcasts.push({ eventType: type, payload });
});

machine.joinPlayer("player_1", "سعود", "#EF4444");
machine.joinPlayer("player_2", "سارة", "#3B82F6");
machine.startGameWithAIPack(pack);

assert.strictEqual(machine.state.boardSize, 100, "machine.state.boardSize must be 100");

// Test Ladder Ascent (Square 4 -> 14, tile index 3 -> 13)
machine.state.players["player_1"].position = 0;
const ladderTile = machine.state.tiles[3];
(machine as any).resolveLandedTile(machine.state.players["player_1"], ladderTile);
assert.strictEqual(machine.state.players["player_1"].position, 13, "Player 1 climbed to index 13 (Square 14)");

const ladderEvt = broadcasts.find(
  (b) => b.eventType === "LADDER_OR_SNAKE_JUMP" && b.payload.isLadder && b.payload.playerId === "player_1"
);
assert.ok(ladderEvt, "LADDER_OR_SNAKE_JUMP broadcast emitted for ladder");
assert.strictEqual(ladderEvt.payload.fromIndex, 3);
assert.strictEqual(ladderEvt.payload.toIndex, 13);
assert.ok(ladderEvt.payload.messageAr.includes("سلم"));

// Test Snake Slide (Square 99 -> 78, tile index 98 -> 77)
const snakeTile = machine.state.tiles[98];
(machine as any).resolveLandedTile(machine.state.players["player_1"], snakeTile);
assert.strictEqual(machine.state.players["player_1"].position, 77, "Player 1 slithered to index 77 (Square 78)");

const snakeEvt = broadcasts.find(
  (b) => b.eventType === "LADDER_OR_SNAKE_JUMP" && !b.payload.isLadder && b.payload.playerId === "player_1"
);
assert.ok(snakeEvt, "LADDER_OR_SNAKE_JUMP broadcast emitted for snake");
assert.strictEqual(snakeEvt.payload.fromIndex, 98);
assert.strictEqual(snakeEvt.payload.toIndex, 77);
assert.ok(snakeEvt.payload.messageAr.includes("ثعبان"));
console.log("   ✅ Room Machine jump events and position updates passed.\n");

// --- 5. Exact Roll Required & Bounce Back Rule ---
console.log("5️⃣ Verifying Exact Roll to 100 & Bounce Back Physics...");
// Player at Square 98 (index 97)
const testState = JSON.parse(JSON.stringify(machine.state));
testState.players["p_bounce"] = {
  id: "p_bounce",
  name: "فهد",
  position: 97, // Square 98
  coins: 100,
  secretHand: [],
  skipNextTurn: false,
  hasShield: false,
  stats: { turnsPlayed: 1, propertiesOwned: 0, shieldsTriggered: 0 }
};

// Roll 1: moves from 97 to 98 (Square 99)
// Note: Square 99 is Snake 99->78, so landing there slides to 77!
const move1 = executeCardEffects(
  testState,
  [{ actionType: "MOVE_STEPS", targetType: "SELF", value: 1 }],
  { sourcePlayerId: "p_bounce" }
);
assert.strictEqual(testState.players["p_bounce"].position, 98, "Roll 1 moves to index 98 (Square 99)");

// Roll 2 from 97: exact roll 97 + 2 = 99 (Square 100, Finish Line!)
testState.players["p_bounce"].position = 97;
const move2 = executeCardEffects(
  testState,
  [{ actionType: "MOVE_STEPS", targetType: "SELF", value: 2 }],
  { sourcePlayerId: "p_bounce" }
);
assert.strictEqual(testState.players["p_bounce"].position, 99, "Roll 2 lands EXACTLY on index 99 (Square 100)");

// Victory test
machine.state.players["player_1"].position = 99;
const victory = machine.checkVictoryCondition();
assert.strictEqual(victory.isOver, true, "Game is over when player reaches square 100 (index 99)");
assert.strictEqual(victory.winner?.id, "player_1", "Player 1 is the winner");
assert.ok(victory.reasonAr.includes("خط النهاية"), "Reason contains finish line victory message");

// Roll 3 from 97: 97 + 3 = 100 -> excess 1 -> bounce back to 99 - 1 = 98 (Square 99)!
testState.players["p_bounce"].position = 97;
const move3 = executeCardEffects(
  testState,
  [{ actionType: "MOVE_STEPS", targetType: "SELF", value: 3 }],
  { sourcePlayerId: "p_bounce" }
);
assert.strictEqual(testState.players["p_bounce"].position, 98, "Roll 3 bounces back from 100 to index 98");
assert.ok(move3[0].messageAr.includes("ارتد"), "Move event indicates bounce back");

// Roll 5 from 97: 97 + 5 = 102 -> excess 3 -> bounce back to 99 - 3 = 96 (Square 97)
testState.players["p_bounce"].position = 97;
executeCardEffects(
  testState,
  [{ actionType: "MOVE_STEPS", targetType: "SELF", value: 5 }],
  { sourcePlayerId: "p_bounce" }
);
assert.strictEqual(testState.players["p_bounce"].position, 96, "Roll 5 bounces back to index 96 (Square 97)");

// Roll 6 from 97: 97 + 6 = 103 -> excess 4 -> bounce back to 99 - 4 = 95 (Square 96)
testState.players["p_bounce"].position = 97;
executeCardEffects(
  testState,
  [{ actionType: "MOVE_STEPS", targetType: "SELF", value: 6 }],
  { sourcePlayerId: "p_bounce" }
);
assert.strictEqual(testState.players["p_bounce"].position, 95, "Roll 6 bounces back to index 95 (Square 96)");

console.log("   ✅ Exact roll and bounce-back physics verified 100%.\n");

// --- 6. Mathematical Zigzag 10x10 Grid Coordinates ---
console.log("6️⃣ Verifying Zigzag 10x10 Grid Coordinates & Digits...");

// Row 1 (bottom): 1 -> 10 (left to right)
const sq1 = getSquareCoordinates(1);
assert.strictEqual(sq1.row, 9, "Square 1 is bottom row (row index 9)");
assert.strictEqual(sq1.col, 0, "Square 1 is left column (col 0)");

const sq10 = getSquareCoordinates(10);
assert.strictEqual(sq10.row, 9, "Square 10 is bottom row (row index 9)");
assert.strictEqual(sq10.col, 9, "Square 10 is right column (col 9)");

// Row 2: 11 -> 20 (right to left)
const sq11 = getSquareCoordinates(11);
assert.strictEqual(sq11.row, 8, "Square 11 is row index 8");
assert.strictEqual(sq11.col, 9, "Square 11 is right column (col 9)");

const sq20 = getSquareCoordinates(20);
assert.strictEqual(sq20.row, 8, "Square 20 is row index 8");
assert.strictEqual(sq20.col, 0, "Square 20 is left column (col 0)");

// Row 10 (top): 91 -> 100 (right to left)
const sq91 = getSquareCoordinates(91);
assert.strictEqual(sq91.row, 0, "Square 91 is top row (row index 0)");
assert.strictEqual(sq91.col, 9, "Square 91 is right column (col 9)");

const sq100 = getSquareCoordinates(100);
assert.strictEqual(sq100.row, 0, "Square 100 is top row (row index 0)");
assert.strictEqual(sq100.col, 0, "Square 100 is left column (col 0)");

// Check Arabic-Indic digits formatting
const f100 = formatSquareNumber(100);
assert.strictEqual(f100.ar, "١٠٠", "Format 100 in Arabic-Indic digits");
assert.strictEqual(f100.en, "100");

// Check Radar threats & opportunities
const threats = getSurroundingThreatsAndOpportunities(97);
assert.strictEqual(threats.nearestSnake?.snake.from, 99, "Nearest snake at 97 is 99");
assert.strictEqual(threats.nearestSnake?.distance, 2, "Distance to snake 99 is 2");

console.log("   ✅ 10x10 Zigzag grid coordinates and radar math verified.\n");

// --- 7. Audio Synthesizer Functions ---
console.log("7️⃣ Verifying Audio Synthesizer Methods...");
assert.strictEqual(typeof sfx.playPawnHop, "function", "sfx.playPawnHop exists");
assert.strictEqual(typeof sfx.playLadderAscent, "function", "sfx.playLadderAscent exists");
assert.strictEqual(typeof sfx.playSnakeSlide, "function", "sfx.playSnakeSlide exists");
console.log("   ✅ Sound synthesizer methods verified.\n");

console.log("====================================================");
console.log("🎉 ALL AUTHENTIC SNAKES & LADDERS 100 TESTS PASSED! 🎉");
console.log("====================================================");
