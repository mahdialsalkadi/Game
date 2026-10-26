import assert from "node:assert";
import { BoardGameRoomMachine } from "./src/game/gameRoom";
import { PRESET_PACKS } from "./src/game/aiPackGenerator";

console.log("====================================================");
console.log("🎬 RUNNING DIRECTOR INTERVENTION GATING SUITE");
console.log("====================================================\n");

function startTwoPlayerRoom(packKey: string) {
  const events: any[] = [];
  const machine = new BoardGameRoomMachine(`room_director_${packKey}`, (type, payload) => {
    events.push({ type, payload });
  });
  machine.joinPlayer("p1", "لاعب أول", "#EF4444", undefined, true);
  machine.joinPlayer("p2", "لاعب ثانٍ", "#3B82F6", undefined, true);
  machine.startGameWithAIPack(PRESET_PACKS[packKey]);
  return { machine, events };
}

function forceRoundThreshold(machine: BoardGameRoomMachine) {
  machine.state.currentRound = 4;
  machine.state.currentTurnIndex = Math.max(0, machine.state.turnOrder.length - 1);
  machine.advanceTurn();
}

console.log("1️⃣ Testing that games without a playable secret hand never receive director cards...");
for (const key of [
  "CONNECT_FOUR",
  "CHECKERS_CLASSIC",
  "BINGO_NIGHT",
  "LUDO_CLASSIC",
  "TACTICAL_CARDS_UNO",
  "SNAKES_AND_LADDERS_RPG",
  "SOCIAL_MAFIA_SPY",
  "WORLD_CONQUEST_RISK"
]) {
  const { machine, events } = startTwoPlayerRoom(key);
  const handsBefore = Object.values(machine.state.players).map(
    (player) => player.secretHand.length
  );
  forceRoundThreshold(machine);
  const interventions = events.filter((e) => e.type === "ADAPTIVE_DIRECTOR_INTERVENTION");
  assert.strictEqual(
    interventions.length,
    0,
    `${key} must not receive a director intervention`
  );
  const handsAfter = Object.values(machine.state.players).map(
    (player) => player.secretHand.length
  );
  assert.deepStrictEqual(
    handsAfter,
    handsBefore,
    `${key} players must not gain extra director cards`
  );
  console.log(`   ✅ ${key}: no intervention, no extra cards.`);
}

console.log("\n2️⃣ Testing that Monopoly still receives director support...");
{
  const { machine, events } = startTwoPlayerRoom("MONOPOLY_CLASSIC");
  forceRoundThreshold(machine);
  const interventions = events.filter((e) => e.type === "ADAPTIVE_DIRECTOR_INTERVENTION");
  assert.strictEqual(interventions.length, 1, "Monopoly receives exactly one intervention");
  assert.ok(interventions[0].payload.rewardCard, "intervention carries a reward card");
  assert.ok(
    machine.state.players[interventions[0].payload.trailingPlayerId].secretHand.length > 0,
    "trailing player holds the reward card"
  );
  console.log("   ✅ MONOPOLY_CLASSIC: intervention preserved.");
}

console.log("\n====================================================");
console.log("🎉 ALL DIRECTOR INTERVENTION TESTS PASSED 100%! 🎉");
console.log("====================================================");
