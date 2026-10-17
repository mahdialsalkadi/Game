import assert from "node:assert";
import { buildUserPrompt } from "./src/game/aiPackGenerator";
import { createDefaultDNA, processPlayerAction } from "./src/game/behavioralDNA";
import { createUser, resetStoreForTesting } from "./src/game/userStore";
import { BoardGameRoomMachine } from "./src/game/gameRoom";
import { PRESET_PACKS } from "./src/game/aiPackGenerator";

console.log("🧪 Running AI Prompt Adaptation & Mid-Game Adaptive Director Tests...");

async function run() {
  await resetStoreForTesting();

  // ========================================================
  // 1. Test buildUserPrompt with DNA injection
  // ========================================================
  const dnaCapitalist = createDefaultDNA();
  for (let i = 0; i < 8; i++) {
    processPlayerAction(dnaCapitalist, "BUY_PROPERTY", { price: 200 });
  }

  const dnaAggressive = createDefaultDNA();
  for (let i = 0; i < 10; i++) {
    processPlayerAction(dnaAggressive, "CLAIM_OR_ATTACK_TILE", { targetTileIndex: 3 });
  }

  const prompt = buildUserPrompt({
    players: [
      { name: "سلطان", promptIdea: "سهرة عقارات واستثمار", dna: dnaCapitalist },
      { name: "خالد", promptIdea: "حروب وسيطرة", dna: dnaAggressive }
    ],
    pastGroupLore: ["خالد دائماً يغدر بسلطان في الجولة الأخيرة"]
  });

  assert.ok(prompt.includes("سلطان"), "Prompt must include player name");
  assert.ok(prompt.includes("خالد"), "Prompt must include player name");
  assert.ok(prompt.includes("الإمبراطور الرأسمالي 🏦"), "Prompt must include sultan's capitalist DNA title");
  assert.ok(prompt.includes("الجنرال الفاتح ⚔️"), "Prompt must include khalid's aggressive DNA title");
  assert.ok(prompt.includes("خالد دائماً يغدر بسلطان"), "Prompt must include past lore");

  // ========================================================
  // 2. Test Mid-Game Adaptive Director Intervention
  // ========================================================
  const userTrailing = await createUser({
    username: "underdog_player",
    email: "underdog@test.com",
    password: "pass"
  });

  // Give underdog high capitalist DNA
  for (let i = 0; i < 6; i++) {
    processPlayerAction(userTrailing.dna, "BUY_PROPERTY", { price: 200 });
  }

  const eventsReceived: Array<{ type: string; payload: any }> = [];
  const machine = new BoardGameRoomMachine("adaptive_room", (eventType, payload) => {
    eventsReceived.push({ type: eventType, payload });
  });

  machine.joinPlayer("p1", "المتعثر", "#EF4444", userTrailing.id);
  machine.joinPlayer("p2", "المتصدر", "#3B82F6");

  // Use a 6-round game so midpoint is round 3
  machine.updateSettings({ maxRounds: 6 });
  machine.startGameWithAIPack(PRESET_PACKS.MONOPOLY_CLASSIC);

  // Set p1 as trailing in coins
  machine.state.players["p1"].coins = 50;
  machine.state.players["p2"].coins = 400;

  // Simulate turns advancing to round 3
  // Each round has 2 turns (p1 then p2)
  // Round 1:
  machine.advanceTurn(); // p1 finishes turn -> now p2's turn
  machine.advanceTurn(); // p2 finishes turn -> now p1's turn, round becomes 2

  // Now round 2:
  assert.strictEqual(machine.state.currentRound, 2);
  assert.strictEqual(machine.state.midGameInterventionTriggered, false);

  machine.advanceTurn(); // p1 finishes turn -> now p2's turn
  machine.advanceTurn(); // p2 finishes turn -> round becomes 3 (midpoint of 6 rounds)

  // Now round 3 (midpoint of 6 rounds):
  assert.strictEqual(machine.state.currentRound, 3);
  assert.strictEqual(machine.state.midGameInterventionTriggered, true, "Mid-game director must trigger at midpoint round");

  // Verify intervention event was broadcasted
  const directorEvent = eventsReceived.find(e => e.type === "ADAPTIVE_DIRECTOR_INTERVENTION");
  assert.ok(directorEvent, "ADAPTIVE_DIRECTOR_INTERVENTION event must be broadcasted");
  assert.strictEqual(directorEvent.payload.trailingPlayerId, "p1");
  assert.ok(directorEvent.payload.rewardCard, "Reward card must be included");

  // Verify p1 received the card in their secret hand
  const p1Hand = machine.state.players["p1"].secretHand;
  const hasRewardCard = p1Hand.some(c => c.id.startsWith("director_card_"));
  assert.ok(hasRewardCard, "Trailing player must receive adaptive reward card in secret hand");

  console.log("✅ AI Prompt Adaptation & Mid-Game Adaptive Director tests passed successfully!");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
