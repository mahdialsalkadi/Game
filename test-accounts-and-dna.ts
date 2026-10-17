import assert from "node:assert";
import {
  createUser,
  authenticateUser,
  getUserById,
  saveCustomGame,
  getPublicCommunityGames,
  getUserGames,
  remixCommunityGame,
  toggleGameLike,
  resetStoreForTesting
} from "./src/game/userStore";
import {
  createDefaultDNA,
  calculateArchetypeTitle,
  processPlayerAction,
  finalizeGameDNA
} from "./src/game/behavioralDNA";
import { buildUserPrompt, PRESET_PACKS } from "./src/game/aiPackGenerator";
import { BoardGameRoomMachine } from "./src/game/gameRoom";

console.log("====================================================");
console.log("🧪 RUNNING SUITE: User Accounts, Persistent AI DNA & Community Hub");
console.log("====================================================\n");

async function main() {
  await resetStoreForTesting();

  // ----------------------------------------------------
  // 1. User Registration & Authentication
  // ----------------------------------------------------
  console.log("1️⃣ Testing User Registration & Authentication...");
  const user1 = await createUser({
    username: "tariq_the_conqueror",
    email: "tariq@test.com",
    password: "SecretPassword123!",
    avatarColor: "#EF4444"
  });

  assert.strictEqual(user1.username, "tariq_the_conqueror");
  assert.strictEqual(user1.email, "tariq@test.com");
  assert.ok(user1.passwordHash !== "SecretPassword123!", "Password must be securely hashed");
  assert.strictEqual(user1.dna.archetypeTitle, "المغامر المتوازن 🎲");

  // Duplicate user check
  await assert.rejects(async () => {
    await createUser({
      username: "tariq_the_conqueror",
      email: "other@test.com",
      password: "pass"
    });
  }, /مسجل مسبقاً/);

  // Authentication
  const authSuccess = await authenticateUser("tariq_the_conqueror", "SecretPassword123!");
  assert.ok(authSuccess, "Auth by username must succeed with valid credentials");
  assert.strictEqual(authSuccess.id, user1.id);

  const authByEmail = await authenticateUser("TARIQ@TEST.COM", "SecretPassword123!");
  assert.ok(authByEmail, "Auth by email must be case-insensitive");

  const authFail = await authenticateUser("tariq_the_conqueror", "WrongPass");
  assert.strictEqual(authFail, null, "Auth with wrong password must return null");

  console.log("   ✅ User Registration & Auth passed.\n");

  // ----------------------------------------------------
  // 2. Custom Game Saving, Community Hub & Remix
  // ----------------------------------------------------
  console.log("2️⃣ Testing Custom Games Storage, Community Hub & Remix...");
  const user2 = await createUser({
    username: "salman_creator",
    email: "salman@test.com",
    password: "pass"
  });

  // Save private game
  const privateGame = await saveCustomGame({
    authorId: user2.id,
    authorName: user2.username,
    visibility: "PRIVATE",
    pack: PRESET_PACKS.MONOPOLY_CLASSIC
  });

  // Save public community game
  const publicGame = await saveCustomGame({
    authorId: user2.id,
    authorName: user2.username,
    visibility: "PUBLIC",
    pack: PRESET_PACKS.WORLD_CONQUEST_RISK
  });

  // Check public community query: must only include PUBLIC games
  const publicList = await getPublicCommunityGames();
  assert.strictEqual(publicList.length, 1, "Only public games must appear in community hub");
  assert.strictEqual(publicList[0].id, publicGame.id);

  // Check user games: must include both private and public
  const salmanGames = await getUserGames(user2.id);
  assert.strictEqual(salmanGames.length, 2, "Author must see both private and public games");

  // Like game
  const likedGame = await toggleGameLike(publicGame.id);
  assert.ok(likedGame);
  assert.strictEqual(likedGame.likesCount, 1);

  // Remix game
  const remixed = await remixCommunityGame(publicGame.id, user1.id);
  assert.ok(remixed);
  assert.strictEqual(remixed.authorId, user1.id);
  assert.strictEqual(remixed.visibility, "PRIVATE");
  assert.ok(remixed.pack.themeTitle.includes("ريمكس"));

  console.log("   ✅ Game Storage, Community Publishing & Remix passed.\n");

  // ----------------------------------------------------
  // 3. Persistent Behavioral DNA & Title Evolution
  // ----------------------------------------------------
  console.log("3️⃣ Testing Player Behavioral DNA & Action Evolution...");
  const dna = createDefaultDNA();

  // Test Capitalist Evolution
  for (let i = 0; i < 7; i++) {
    processPlayerAction(dna, "BUY_PROPERTY", { price: 200 });
  }
  assert.strictEqual(calculateArchetypeTitle(dna), "الإمبراطور الرأسمالي 🏦");

  // Test Aggression Evolution
  for (let i = 0; i < 15; i++) {
    processPlayerAction(dna, "CLAIM_OR_ATTACK_TILE", { targetTileIndex: 5 });
    processPlayerAction(dna, "STEAL_COINS", { victimId: "player_nemesis" });
  }
  assert.strictEqual(calculateArchetypeTitle(dna), "الجنرال الفاتح ⚔️");
  assert.strictEqual(dna.nemesisMap["player_nemesis"], 15);

  // Test Tactical Cards Evolution
  const dnaTac = createDefaultDNA();
  for (let i = 0; i < 12; i++) {
    processPlayerAction(dnaTac, "PLAY_SECRET_CARD", { cardId: "card_swap" });
  }
  assert.strictEqual(calculateArchetypeTitle(dnaTac), "المخطط التكتيكي 🃏");

  // Test Social Voter Evolution
  const dnaSoc = createDefaultDNA();
  for (let i = 0; i < 12; i++) {
    processPlayerAction(dnaSoc, "SUBMIT_VOTE", { targetPlayerId: "rival_boss" });
  }
  assert.strictEqual(calculateArchetypeTitle(dnaSoc), "داهية المجلس 🕵️");
  assert.strictEqual(dnaSoc.nemesisMap["rival_boss"], 12);

  console.log("   ✅ Behavioral DNA & Title Evolution passed.\n");

  // ----------------------------------------------------
  // 4. In-Game Room Engine Action Tracking
  // ----------------------------------------------------
  console.log("4️⃣ Testing Room Machine Live Action Tracking to User Accounts...");
  const events: Array<{ type: string; payload: any }> = [];
  const machine = new BoardGameRoomMachine("full_dna_room", (type, payload) => {
    events.push({ type, payload });
  });

  machine.joinPlayer("p1", "طارق", "#EF4444", user1.id);
  machine.joinPlayer("p2", "سلمان", "#3B82F6", user2.id);

  // Start with Monopoly
  machine.startGameWithAIPack(PRESET_PACKS.MONOPOLY_CLASSIC);

  // p1 buys property
  machine.state.players["p1"].position = 1;
  machine.buyProperty("p1", 1);

  // Verify user1's persistent DNA updated in userStore
  const refreshedUser1 = await getUserById(user1.id);
  assert.ok(refreshedUser1);
  assert.ok(
    refreshedUser1.dna.capitalistScore > 25,
    "user1 capitalistScore must be dynamically incremented upon buyProperty"
  );

  console.log("   ✅ Live Engine Action Tracking passed.\n");

  // ----------------------------------------------------
  // 5. AI Prompt Personality Injection
  // ----------------------------------------------------
  console.log("5️⃣ Testing AI Prompt Behavioral DNA Injection...");
  const prompt = buildUserPrompt({
    players: [
      { name: user1.username, dna: refreshedUser1.dna },
      { name: user2.username, dna: user2.dna }
    ]
  });

  assert.ok(prompt.includes(user1.username));
  assert.ok(prompt.includes(refreshedUser1.dna.archetypeTitle));
  assert.ok(prompt.includes("AI DNA Profiles"));

  console.log("   ✅ AI Prompt Personality Injection passed.\n");

  // ----------------------------------------------------
  // 6. Mid-Game Adaptive Director Intervention
  // ----------------------------------------------------
  console.log("6️⃣ Testing Mid-Game Adaptive Director Support...");
  const machineDirector = new BoardGameRoomMachine("director_test_room", (type, payload) => {
    events.push({ type, payload });
  });

  machineDirector.joinPlayer("p1", "طارق", "#EF4444", user1.id);
  machineDirector.joinPlayer("p2", "سلمان", "#3B82F6", user2.id);

  machineDirector.updateSettings({ maxRounds: 4 }); // midpoint is round 2
  machineDirector.startGameWithAIPack(PRESET_PACKS.MONOPOLY_CLASSIC);

  // p1 is trailing with 50 coins, p2 has 300
  machineDirector.state.players["p1"].coins = 50;
  machineDirector.state.players["p2"].coins = 300;

  // Advance through round 1 to round 2 (midpoint)
  machineDirector.advanceTurn(); // p1 turn ends -> p2 turn
  machineDirector.advanceTurn(); // p2 turn ends -> round becomes 2 (midpoint)

  assert.strictEqual(machineDirector.state.currentRound, 2);
  assert.strictEqual(machineDirector.state.midGameInterventionTriggered, true);

  const interventionEvent = events.find((e) => e.type === "ADAPTIVE_DIRECTOR_INTERVENTION");
  assert.ok(interventionEvent, "ADAPTIVE_DIRECTOR_INTERVENTION event must be broadcasted");
  assert.strictEqual(interventionEvent.payload.trailingPlayerId, "p1");

  const p1Hand = machineDirector.state.players["p1"].secretHand;
  const hasReward = p1Hand.some((c) => c.id.startsWith("director_card_"));
  assert.ok(hasReward, "Trailing player must receive adaptive booster card");

  console.log("   ✅ Mid-Game Adaptive Director passed.\n");

  console.log("====================================================");
  console.log("🎉 ALL USER ACCOUNTS, BEHAVIORAL DNA & COMMUNITY TESTS PASSED 100%!");
  console.log("====================================================");
}

main().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
