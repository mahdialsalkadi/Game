import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  createUser,
  authenticateUser,
  getUserById,
  saveCustomGame,
  getPublicCommunityGames,
  getUserGames,
  remixCommunityGame,
  recordGamePlay,
  resetStoreForTesting
} from "./src/game/userStore";
import { PRESET_PACKS } from "./src/game/aiPackGenerator";

console.log("🧪 Running User Store & Accounts Verification Test...");

async function run() {
  await resetStoreForTesting();

  // 1. User Registration
  const user1 = await createUser({
    username: "faisal_king",
    email: "faisal@example.com",
    password: "secretpassword123",
    avatarColor: "#EF4444"
  });

  assert.strictEqual(user1.username, "faisal_king");
  assert.strictEqual(user1.email, "faisal@example.com");
  assert.strictEqual(user1.avatarColor, "#EF4444");
  assert.ok(user1.id.startsWith("usr_"));
  assert.ok(user1.dna);
  assert.strictEqual(user1.dna.gamesPlayed, 0);
  assert.strictEqual(user1.dna.archetypeTitle, "المغامر المتوازن 🎲");

  // Prevent duplicate username or email
  await assert.rejects(
    async () => {
      await createUser({
        username: "faisal_king",
        email: "other@example.com",
        password: "pass"
      });
    },
    /اسم المستخدم مسجل مسبقاً/
  );

  // 2. Authentication
  const authSuccess = await authenticateUser("faisal_king", "secretpassword123");
  assert.ok(authSuccess);
  assert.strictEqual(authSuccess?.id, user1.id);

  const authWrongPass = await authenticateUser("faisal_king", "wrongpass");
  assert.strictEqual(authWrongPass, null);

  const authByEmail = await authenticateUser("faisal@example.com", "secretpassword123");
  assert.ok(authByEmail);
  assert.strictEqual(authByEmail?.id, user1.id);

  // 3. Save Private Game
  const privateGame = await saveCustomGame({
    authorId: user1.id,
    pack: PRESET_PACKS.MONOPOLY_CLASSIC,
    visibility: "PRIVATE"
  });

  assert.strictEqual(privateGame.authorId, user1.id);
  assert.strictEqual(privateGame.visibility, "PRIVATE");
  assert.strictEqual(privateGame.pack.themeTitle, PRESET_PACKS.MONOPOLY_CLASSIC.themeTitle);

  // 4. Save Public Game
  const publicGame = await saveCustomGame({
    authorId: user1.id,
    pack: PRESET_PACKS.WORLD_CONQUEST_RISK,
    visibility: "PUBLIC"
  });

  assert.strictEqual(publicGame.visibility, "PUBLIC");
  assert.strictEqual(publicGame.playsCount, 0);

  // 5. Query Community Games (Only PUBLIC should appear)
  const publicGames = await getPublicCommunityGames();
  assert.strictEqual(publicGames.length, 1);
  assert.strictEqual(publicGames[0].id, publicGame.id);

  // 6. Query User Games (Both PRIVATE and PUBLIC should appear for owner)
  const userGames = await getUserGames(user1.id);
  assert.strictEqual(userGames.length, 2);

  // 7. Record Game Play
  const updatedPlay = await recordGamePlay(publicGame.id);
  assert.strictEqual(updatedPlay?.playsCount, 1);

  // 8. Remix Game
  const user2 = await createUser({
    username: "sara_gamer",
    email: "sara@example.com",
    password: "sarapassword123",
    avatarColor: "#3B82F6"
  });

  const remixed = await remixCommunityGame(publicGame.id, user2.id);
  assert.ok(remixed);
  assert.strictEqual(remixed?.authorId, user2.id);
  assert.strictEqual(remixed?.authorName, "sara_gamer");
  assert.ok(remixed?.pack.themeTitle.includes("ريمكس"));

  // 9. Persistence Check: verify file exists on disk
  const storeFilePath = path.join(process.cwd(), ".data", "platform-store.json");
  assert.ok(fs.existsSync(storeFilePath), "Store file must exist in .data/platform-store.json");

  console.log("✅ All User Store tests passed successfully!");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
