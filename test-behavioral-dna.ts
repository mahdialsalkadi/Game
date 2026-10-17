import assert from "node:assert";
import {
  createDefaultDNA,
  calculateArchetypeTitle,
  processPlayerAction,
  finalizeGameDNA
} from "./src/game/behavioralDNA";
import { createUser, getUserById, resetStoreForTesting } from "./src/game/userStore";
import { BoardGameRoomMachine } from "./src/game/gameRoom";
import { PRESET_PACKS } from "./src/game/aiPackGenerator";

console.log("🧪 Running Player Behavioral DNA & Action Tracking Verification Test...");

async function run() {
  await resetStoreForTesting();

  // 1. Initial DNA & Title
  const dna = createDefaultDNA();
  assert.strictEqual(dna.aggressionScore, 25);
  assert.strictEqual(dna.capitalistScore, 25);
  assert.strictEqual(dna.archetypeTitle, "المغامر المتوازن 🎲");

  // 2. Action Tracking: Capitalist evolution
  processPlayerAction(dna, "BUY_PROPERTY", { price: 200 });
  processPlayerAction(dna, "BUY_PROPERTY", { price: 250 });
  processPlayerAction(dna, "BUY_PROPERTY", { price: 300 });
  processPlayerAction(dna, "BUY_PROPERTY", { price: 350 });
  processPlayerAction(dna, "BUY_PROPERTY", { price: 400 });
  processPlayerAction(dna, "BUY_PROPERTY", { price: 450 });
  processPlayerAction(dna, "BUY_PROPERTY", { price: 500 });

  assert.ok(dna.capitalistScore > 50, "Capitalist score must increase significantly after buying 7 properties");
  assert.strictEqual(dna.archetypeTitle, "الإمبراطور الرأسمالي 🏦");

  // 3. Action Tracking: Aggression evolution (Attacking + Stealing + Nemesis)
  for (let i = 0; i < 12; i++) {
    processPlayerAction(dna, "CLAIM_OR_ATTACK_TILE", { targetTileIndex: 5 });
    processPlayerAction(dna, "STEAL_COINS", { victimId: "player_rival_99" });
  }

  assert.ok(dna.aggressionScore > dna.capitalistScore);
  assert.strictEqual(dna.archetypeTitle, "الجنرال الفاتح ⚔️");
  assert.strictEqual(dna.nemesisMap["player_rival_99"], 12, "Nemesis record must count 12 clashes");

  // 4. Action Tracking: Tactical Card Evolution
  const dna2 = createDefaultDNA();
  for (let i = 0; i < 15; i++) {
    processPlayerAction(dna2, "PLAY_SECRET_CARD", { cardId: "card_1" });
  }
  assert.strictEqual(dna2.archetypeTitle, "المخطط التكتيكي 🃏");

  // 5. Action Tracking: Social Voter Evolution
  const dna3 = createDefaultDNA();
  for (let i = 0; i < 15; i++) {
    processPlayerAction(dna3, "SUBMIT_VOTE", { targetPlayerId: "player_2" });
  }
  assert.strictEqual(dna3.archetypeTitle, "داهية المجلس 🕵️");
  assert.strictEqual(dna3.nemesisMap["player_2"], 15);

  // 6. Game End Finalization
  finalizeGameDNA(dna, true, 450);
  assert.strictEqual(dna.gamesPlayed, 1);
  assert.strictEqual(dna.winsCount, 1);

  // 7. Engine Integration: verify BoardGameRoomMachine updates userStore directly
  const user = await createUser({
    username: "tariq_the_conqueror",
    email: "tariq@test.com",
    password: "pass"
  });

  const machine = new BoardGameRoomMachine("test_dna_room", () => {});
  // Join player with attached persistent userId
  machine.joinPlayer("p1", "طارق", "#EF4444", user.id);
  machine.joinPlayer("p2", "خصم", "#3B82F6");

  // Start with Monopoly
  machine.startGameWithAIPack(PRESET_PACKS.MONOPOLY_CLASSIC);

  // Buy property as p1
  machine.state.players["p1"].position = 1; // شارع التخصصي (price: 60)
  machine.buyProperty("p1", 1);

  // Verify user's DNA was updated in userStore
  const updatedUser = await getUserById(user.id);
  assert.ok(updatedUser);
  assert.ok(
    updatedUser.dna.capitalistScore > 25,
    "User DNA capitalistScore must be updated automatically upon buyProperty"
  );

  console.log("✅ All Behavioral DNA tests passed successfully!");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
