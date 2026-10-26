import assert from "node:assert";
import { BoardGameRoomMachine } from "./src/game/gameRoom";
import {
  AUTHENTIC_LUDO_PACK,
  LUDO_BOARD_SIZE,
  LUDO_TRACK_LENGTH,
  LUDO_SAFE_TILES,
  LUDO_MAX_STEPS,
  TRACK_TILE_COORDS,
  LUDO_COLORS,
  initLudoState,
  initLudoPlayer,
  isSafeTile,
  getTokenBoardCoordinates,
  getEligibleTokensToMove,
  canAnyTokenMove,
  executeLudoMove,
  selectBestTokenForBot
} from "./src/game/ludoEngine";
import { PRESET_PACKS } from "./src/game/aiPackGenerator";
import { GeneratedSessionPackSchema } from "./src/game/schema";

console.log("====================================================");
console.log("🎲 RUNNING AUTHENTIC LUDO & JACKAROO (لودو وجاكارو المجلس) ENGINE TEST");
console.log("====================================================\n");

// --- 1. Verify Geometry, Track Coordinates & Safe Squares ---
console.log("1️⃣ Verifying 15x15 Geometry, 52-tile Perimeter Track, and 8 Safe Star Squares...");

assert.strictEqual(LUDO_BOARD_SIZE, 15, "Board size must be 15x15");
assert.strictEqual(LUDO_TRACK_LENGTH, 52, "Track length must be 52 perimeter steps");
assert.strictEqual(TRACK_TILE_COORDS.length, 52, "Must define 52 distinct grid coordinates");
assert.strictEqual(LUDO_SAFE_TILES.length, 8, "Must have exactly 8 safe squares");

// Check all 8 safe tiles
const expectedSafeTiles = [0, 8, 13, 21, 26, 34, 39, 47];
for (const tileIdx of expectedSafeTiles) {
  assert.ok(isSafeTile(tileIdx), `Tile ${tileIdx} must be safe`);
}
assert.strictEqual(isSafeTile(1), false, "Tile 1 is not a safe tile");
assert.strictEqual(isSafeTile(5), false, "Tile 5 is not a safe tile");

// Check the 4 colors in LUDO_COLORS
const colors = ["green", "red", "yellow", "blue"] as const;
for (const c of colors) {
  const cfg = LUDO_COLORS[c];
  assert.ok(cfg, `Config for color ${c} must exist`);
  assert.strictEqual(cfg.yardCoords.length, 4, `${c} must have 4 yard coordinates`);
  assert.strictEqual(cfg.homePathCoords.length, 5, `${c} must have 5 home path coordinates`);
  assert.ok(cfg.goalCoord, `${c} must have a goal coordinate`);
}

// Verify starting tiles
assert.strictEqual(LUDO_COLORS.green.startTrackTile, 0, "Green start track tile is 0");
assert.strictEqual(LUDO_COLORS.red.startTrackTile, 13, "Red start track tile is 13");
assert.strictEqual(LUDO_COLORS.yellow.startTrackTile, 26, "Yellow start track tile is 26");
assert.strictEqual(LUDO_COLORS.blue.startTrackTile, 39, "Blue start track tile is 39");

console.log("   ✅ Geometry, track coordinates, and safe star tiles verified.\n");

// --- 2. Verify Authentic Ludo Preset Pack Schema ---
console.log("2️⃣ Verifying AUTHENTIC_LUDO_PACK & Schema Validation...");
assert.ok(PRESET_PACKS.LUDO_CLASSIC, "LUDO_CLASSIC preset must exist in PRESET_PACKS");
const validatedPack = GeneratedSessionPackSchema.parse(AUTHENTIC_LUDO_PACK);
assert.strictEqual(validatedPack.archetype, "BOARD_RACE", "Archetype must be BOARD_RACE");
assert.strictEqual(validatedPack.winCondition, "FIRST_TO_FINISH", "Win condition must be FIRST_TO_FINISH");
assert.strictEqual(validatedPack.tiles.length, 20, "Pack must contain 20 tiles");
assert.strictEqual(validatedPack.cardsDeck.length, 18, "Pack must contain 18 deck cards");
console.log("   ✅ Preset pack schema validated successfully.\n");

// --- 3. Verify Token Initialization and Board Coordinate Mapping ---
console.log("3️⃣ Verifying Token Initialization and Coordinate Mapping...");
const ludoState = initLudoState(["p1", "p2", "p3", "p4"]);
assert.strictEqual(ludoState.isActive, true, "Ludo state must be active");
assert.strictEqual(Object.keys(ludoState.players).length, 4, "Must have 4 players");

const p1 = ludoState.players["p1"];
assert.strictEqual(p1.color, "green", "p1 is green");
assert.strictEqual(p1.tokens.length, 4, "p1 has 4 tokens");
assert.strictEqual(p1.tokens[0].state, "HOME_BASE", "Token starts in HOME_BASE");

// Check coordinate mapping for p1 token 0 in HOME_BASE
const yardCoord = getTokenBoardCoordinates(p1, p1.tokens[0]);
assert.deepStrictEqual(yardCoord, LUDO_COLORS.green.yardCoords[0], "Token in yard maps to yard coordinate");

// Check coordinate mapping for token ON_TRACK at step 0
const onTrackToken = { id: 0, state: "ON_TRACK" as const, stepCount: 0 };
const trackCoord = getTokenBoardCoordinates(p1, onTrackToken);
assert.deepStrictEqual(trackCoord, TRACK_TILE_COORDS[0], "Token on track step 0 maps to green start tile");

// Check coordinate mapping for token in HOME_PATH at step 51
const homePathToken = { id: 0, state: "HOME_PATH" as const, stepCount: 51 };
const homePathCoord = getTokenBoardCoordinates(p1, homePathToken);
assert.deepStrictEqual(homePathCoord, LUDO_COLORS.green.homePathCoords[0], "Token in home path maps to home path coordinate");

// Check coordinate mapping for FINISHED token
const finishedToken = { id: 0, state: "FINISHED" as const, stepCount: 56 };
const goalCoord = getTokenBoardCoordinates(p1, finishedToken);
assert.deepStrictEqual(goalCoord, LUDO_COLORS.green.goalCoord, "Finished token maps to goal coordinate");

console.log("   ✅ Token initialization & 15x15 coordinate mappings verified.\n");

// --- 4. Verify Yard Exit & Movement Rules ---
console.log("4️⃣ Verifying Yard Exit & Track Movement Rules...");

// When all tokens are in HOME_BASE:
// Rolls 1..5 cannot move any token
for (let roll = 1; roll <= 5; roll++) {
  const eligible = getEligibleTokensToMove(p1, roll);
  assert.strictEqual(eligible.length, 0, `Roll ${roll} should not allow any token to exit home base`);
  assert.strictEqual(canAnyTokenMove(p1, roll), false);
}

// Roll 6 allows all 4 home base tokens to move
const eligibleOn6 = getEligibleTokensToMove(p1, 6);
assert.deepStrictEqual(eligibleOn6, [0, 1, 2, 3], "Roll 6 must allow all home base tokens to exit");

// Execute move for token 0 with roll 6
const exitMove = executeLudoMove(ludoState, "p1", 0, 6);
assert.strictEqual(exitMove.success, true);
assert.strictEqual(exitMove.toState, "ON_TRACK");
assert.strictEqual(exitMove.toStep, 0);
assert.strictEqual(exitMove.trackTile, 0);
assert.strictEqual(exitMove.awardedBonusRoll, true, "Exiting base on 6 must award bonus roll");
assert.strictEqual(p1.tokens[0].state, "ON_TRACK");
assert.strictEqual(p1.tokens[0].stepCount, 0);

// Advance token 0 with roll 4
const advanceMove = executeLudoMove(ludoState, "p1", 0, 4);
assert.strictEqual(advanceMove.success, true);
assert.strictEqual(advanceMove.toState, "ON_TRACK");
assert.strictEqual(advanceMove.toStep, 4);
assert.strictEqual(advanceMove.trackTile, 4);
assert.strictEqual(advanceMove.awardedBonusRoll, false, "Roll of 4 without capture does not award bonus roll");
assert.strictEqual(p1.tokens[0].stepCount, 4);

console.log("   ✅ Yard exit on 6 and track advancement verified.\n");

// --- 5. Verify Capturing (Eating) Opponent Pieces & Safe Tile Protection ---
console.log("5️⃣ Verifying Opponent Capturing & Safe Star Square Immunity...");

// Setup: Place p2 (red, start track tile 13) token 0 on tile 10 (not safe)
const p2 = ludoState.players["p2"];
p2.tokens[0].state = "ON_TRACK";
p2.tokens[0].stepCount = 49; // Red start (13) + 49 = 62 % 52 = tile 10
const p2Tile = (p2.startTrackTile + p2.tokens[0].stepCount) % LUDO_TRACK_LENGTH;
assert.strictEqual(p2Tile, 10, "p2 token 0 is at tile 10");
assert.strictEqual(isSafeTile(10), false, "Tile 10 is not safe");

// Place p1 token 0 at tile 4 (step 4), roll 6: 4 + 6 = 10 -> LANDS ON p2 TOKEN!
const captureMove = executeLudoMove(ludoState, "p1", 0, 6);
assert.strictEqual(captureMove.success, true);
assert.strictEqual(captureMove.trackTile, 10);
assert.ok(captureMove.capturedToken, "Must capture opponent token");
assert.strictEqual(captureMove.capturedToken?.playerId, "p2");
assert.strictEqual(captureMove.capturedToken?.tokenId, 0);
assert.strictEqual(captureMove.awardedBonusRoll, true, "Capturing must award bonus roll");

// Verify p2 token 0 returned to HOME_BASE
assert.strictEqual(p2.tokens[0].state, "HOME_BASE", "Captured token must return to HOME_BASE");
assert.strictEqual(p2.tokens[0].stepCount, 0, "Captured token step count reset to 0");

// Test Safe Square Immunity:
// Put p2 token 1 on tile 13 (Red start tile, which is safe: LUDO_SAFE_TILES includes 13)
p2.tokens[1].state = "ON_TRACK";
p2.tokens[1].stepCount = 0; // tile 13
assert.ok(isSafeTile(13), "Tile 13 is a safe star/start tile");

// Put p1 token 0 on tile 10 (step 10), roll 3: lands on tile 13 (safe tile)
const safeLandMove = executeLudoMove(ludoState, "p1", 0, 3);
assert.strictEqual(safeLandMove.trackTile, 13);
assert.strictEqual(safeLandMove.capturedToken, undefined, "Cannot capture opponent token on a safe tile!");
assert.strictEqual(p2.tokens[1].state, "ON_TRACK", "Opponent token on safe tile remains on track");

console.log("   ✅ Capturing with bonus turns and safe tile immunity verified.\n");

// --- 6. Verify Home Path and Exact Roll to Finish ---
console.log("6️⃣ Verifying Home Path Entry & Exact Roll to Finish (Step 56)...");

// Put p1 token 0 near finish: step 54 (Home Path, needs exact 2 to finish)
p1.tokens[0].stepCount = 54;
p1.tokens[0].state = "HOME_PATH";

// Roll 3: 54 + 3 = 57 > 56 -> CANNOT MOVE (overshoot disallowed)
const eligibleOn3 = getEligibleTokensToMove(p1, 3);
assert.ok(!eligibleOn3.includes(0), "Token cannot move if roll exceeds exact finish step 56");

// Roll 1: 54 + 1 = 55 (still in home path)
const eligibleOn1 = getEligibleTokensToMove(p1, 1);
assert.ok(eligibleOn1.includes(0), "Token can move within home path");

// Roll 2: 54 + 2 = 56 -> EXACT FINISH!
const finishMove = executeLudoMove(ludoState, "p1", 0, 2);
assert.strictEqual(finishMove.toState, "FINISHED");
assert.strictEqual(finishMove.toStep, 56);
assert.strictEqual(finishMove.reachedHome, true);
assert.strictEqual(finishMove.awardedBonusRoll, true, "Reaching finish awards bonus roll");
assert.strictEqual(p1.finishedCount, 1, "p1 finishedCount incremented to 1");

// Test Win Condition: Complete remaining 3 tokens
p1.tokens[1].state = "FINISHED";
p1.tokens[1].stepCount = 56;
p1.tokens[2].state = "FINISHED";
p1.tokens[2].stepCount = 56;
p1.finishedCount = 3;

p1.tokens[3].state = "HOME_PATH";
p1.tokens[3].stepCount = 55;

const winMove = executeLudoMove(ludoState, "p1", 3, 1);
assert.strictEqual(winMove.reachedHome, true);
assert.strictEqual(p1.finishedCount, 4, "All 4 tokens finished");
assert.strictEqual(p1.rank, 1, "p1 awarded rank 1");
assert.strictEqual(ludoState.winners[0], "p1", "p1 is the winner");

console.log("   ✅ Exact finish roll and 4-token victory condition verified.\n");

// --- 7. Verify Smart AI Bot Decision Heuristics ---
console.log("7️⃣ Verifying Smart AI Bot Decision Heuristics (selectBestTokenForBot)...");

const botLudo = initLudoState(["bot1", "player2"]);
const bot = botLudo.players["bot1"];
const human = botLudo.players["player2"];

// Test AI Priority 1: Exit base on roll 6
const pickedOn6 = selectBestTokenForBot(bot, botLudo.players, 6);
assert.ok(pickedOn6 !== null, "Bot must pick a token on roll 6");
assert.ok([0, 1, 2, 3].includes(pickedOn6!), "Bot picks one of the base tokens to exit");

// Test AI Priority 2: Prioritize CAPTURE over regular advance
// Put bot token 0 on tile 1, and bot token 1 on tile 20
bot.tokens[0].state = "ON_TRACK";
bot.tokens[0].stepCount = 1;
bot.tokens[1].state = "ON_TRACK";
bot.tokens[1].stepCount = 20;

// Put human token on tile 4 (bot token 0 + roll 3 = tile 4 -> CAPTURE!)
human.tokens[0].state = "ON_TRACK";
human.tokens[0].stepCount = (4 - human.startTrackTile + LUDO_TRACK_LENGTH) % LUDO_TRACK_LENGTH;

const captureChoice = selectBestTokenForBot(bot, botLudo.players, 3);
assert.strictEqual(captureChoice, 0, "Bot must prioritize capturing opponent token (token 0)");

// Test AI Priority 3: Escape Danger
// Put human token 1 step behind bot token 1 on unsafe tile 20 (human on tile 19)
human.tokens[1].state = "ON_TRACK";
human.tokens[1].stepCount = (19 - human.startTrackTile + LUDO_TRACK_LENGTH) % LUDO_TRACK_LENGTH;

// bot token 0 is safe at step 35 (tile 35)
bot.tokens[0].stepCount = 35;
// bot token 1 is at step 20 (tile 20), endangered by human on tile 19
bot.tokens[1].stepCount = 20;

// Bot rolls 4: Moving token 1 escapes danger (from tile 20 to 24)
const escapeChoice = selectBestTokenForBot(bot, botLudo.players, 4);
assert.strictEqual(escapeChoice, 1, "Bot must prioritize escaping danger (token 1)");

console.log("   ✅ Smart AI bot priorities (exit base, capture, escape, advance) verified.\n");

// --- 8. Verify BoardGameRoomMachine Full Integration ---
console.log("8️⃣ Verifying BoardGameRoomMachine Integration with Ludo Mode...");

const broadcasts: Array<{ type: string; payload: any }> = [];
const room = new BoardGameRoomMachine("TEST_LUDO_ROOM", (type, payload) => {
  broadcasts.push({ type, payload });
});
room.joinPlayer("p1", "لاعب 1", "#22C55E");
room.joinPlayer("p2", "لاعب 2", "#EF4444");

// Start game with LUDO_CLASSIC pack
room.startGameWithAIPack(AUTHENTIC_LUDO_PACK);
let state = room.state;

assert.strictEqual(state.phase, "TURN_START", "Phase must be TURN_START");
assert.strictEqual(state.isLudo, true, "gameState.isLudo must be true");
assert.ok(state.ludoState, "ludoState must be present in room state");
assert.strictEqual(state.ludoState?.isActive, true, "ludoState must be active");
assert.strictEqual(Object.keys(state.ludoState!.players).length, 2, "Room has 2 Ludo players");

const activePid = state.turnOrder[state.currentTurnIndex];
assert.ok(activePid, "Active player ID must exist");

// Test rolling dice and moving via Room Machine
// 1. Manually set roll of 6 to test yard exit and bonus turn
room.state.ludoState!.pendingDiceRoll = 6;
room.state.ludoState!.eligibleTokenIds = [0, 1, 2, 3];

const moveExitRes = room.moveLudoToken("p1", 0);
assert.strictEqual(moveExitRes.success, true);
assert.strictEqual(moveExitRes.toState, "ON_TRACK");
assert.strictEqual(moveExitRes.awardedBonusRoll, true);

// Verify bonus turn kept p1 active in TURN_START
state = room.state;
assert.strictEqual(state.turnOrder[state.currentTurnIndex], "p1", "Bonus roll must keep active player on p1");
assert.strictEqual(state.phase, "TURN_START");
assert.strictEqual(state.ludoState?.players["p1"].tokens[0].state, "ON_TRACK");

// 2. Set roll of 4 to advance token 0 (no bonus turn, turn advances to p2)
room.state.ludoState!.pendingDiceRoll = 4;
room.state.ludoState!.eligibleTokenIds = [0];

const moveAdvanceRes = room.moveLudoToken("p1", 0);
assert.strictEqual(moveAdvanceRes.success, true);
assert.strictEqual(moveAdvanceRes.toStep, 4);
assert.strictEqual(moveAdvanceRes.awardedBonusRoll, false);

// Turn now advances to p2!
state = room.state;
assert.strictEqual(state.turnOrder[state.currentTurnIndex], "p2", "Turn must advance to p2");

// 3. Test Game Over on 4 finished tokens
const p2Ludo = room.state.ludoState!.players["p2"];
p2Ludo.tokens[0].state = "FINISHED";
p2Ludo.tokens[0].stepCount = 56;
p2Ludo.tokens[1].state = "FINISHED";
p2Ludo.tokens[1].stepCount = 56;
p2Ludo.tokens[2].state = "FINISHED";
p2Ludo.tokens[2].stepCount = 56;
p2Ludo.tokens[3].state = "HOME_PATH";
p2Ludo.tokens[3].stepCount = 55;
p2Ludo.finishedCount = 3;

// p2 rolls 1 to finish 4th token
room.state.ludoState!.pendingDiceRoll = 1;
room.state.ludoState!.eligibleTokenIds = [3];

room.moveLudoToken("p2", 3);
state = room.state;
assert.strictEqual(state.phase, "GAME_OVER", "Phase must transition to GAME_OVER");
assert.ok(state.ludoState?.winners.includes("p2"), "p2 must be recorded in ludoState.winners");
const gameOverEvent = broadcasts.find((b) => b.type === "GAME_OVER");
assert.ok(gameOverEvent, "GAME_OVER event must be broadcast");
assert.strictEqual(gameOverEvent.payload.winner.id, "p2", "Winner in broadcast must be p2");

console.log("   ✅ BoardGameRoomMachine Ludo lifecycle & token moves verified.\n");

console.log("====================================================");
console.log("🏆 ALL AUTHENTIC LUDO & JACKAROO TESTS PASSED (100%)");
console.log("====================================================");
