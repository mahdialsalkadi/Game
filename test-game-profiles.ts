import assert from "assert";
import fs from "fs";
import path from "path";
import {
  GAME_PROFILES,
  MAX_PLAYERS_GLOBAL,
  PLAYER_COLORS,
  clampPlayerCount,
  detectGameKey,
  getBotName,
  getPlayerColor,
  resolveGameProfile
} from "./src/game/gameProfiles";
import { JAWAKER_LOUNGE_GAMES } from "./src/components/studio/presets";
import { BoardGameRoomMachine } from "./src/game/gameRoom";

console.log("====================================================");
console.log("🎛️ RUNNING GAME PROFILES & LOBBY CAPACITY TEST SUITE");
console.log("====================================================\n");

// ====================================================
// 1. Game profiles (min / max / labels)
// ====================================================
console.log("1️⃣ Testing per-game player profiles...");
{
  const expected: Record<string, [number, number]> = {
    MONOPOLY_CLASSIC: [2, 8],
    TACTICAL_CARDS_UNO: [2, 10],
    LUDO_CLASSIC: [2, 4],
    SNAKES_AND_LADDERS_RPG: [2, 8],
    WORLD_CONQUEST_RISK: [2, 8],
    SOCIAL_MAFIA_SPY: [5, 10],
    CONNECT_FOUR: [2, 2],
    CHECKERS_CLASSIC: [2, 2],
    BINGO_NIGHT: [2, 8],
    GENERIC_BOARD: [2, 8]
  };

  for (const [key, [min, max]] of Object.entries(expected)) {
    const profile = GAME_PROFILES[key];
    assert.ok(profile, `Profile ${key} must exist`);
    assert.strictEqual(profile.minPlayers, min, `${key} min players must be ${min}`);
    assert.strictEqual(profile.maxPlayers, max, `${key} max players must be ${max}`);
  }

  assert.ok(
    GAME_PROFILES.SOCIAL_MAFIA_SPY.minPlayers >= 5,
    "Mafia must require at least 5 players so the first night is playable"
  );
  assert.ok(
    GAME_PROFILES.TACTICAL_CARDS_UNO.maxPlayers <= MAX_PLAYERS_GLOBAL,
    "Uno cannot exceed the shared player-color budget"
  );
  console.log("   ✅ All expected min/max player counts are configured correctly.");
}

// ====================================================
// 2. Shared colors, bot names, and clamp helpers
// ====================================================
console.log("\n2️⃣ Testing shared colors, bot names, and clamping...");
{
  assert.strictEqual(MAX_PLAYERS_GLOBAL, 10, "The platform supports up to 10 player colors");
  assert.strictEqual(new Set(PLAYER_COLORS).size, 10, "All player colors must be unique");
  assert.strictEqual(getPlayerColor(0), PLAYER_COLORS[0]);
  assert.strictEqual(getPlayerColor(10), PLAYER_COLORS[0], "Colors must wrap safely");
  assert.strictEqual(getPlayerColor(-1), PLAYER_COLORS[9], "Negative indexes must wrap safely");
  assert.strictEqual(typeof getBotName(0), "string", "Bot names must resolve");
  assert.ok(getBotName(0).length > 0, "Bot name must not be empty");

  const uno = GAME_PROFILES.TACTICAL_CARDS_UNO;
  assert.strictEqual(clampPlayerCount(uno, 1), 2, "Clamping raises below-minimum counts");
  assert.strictEqual(clampPlayerCount(uno, 8), 8, "Clamping preserves valid counts");
  assert.strictEqual(clampPlayerCount(uno, 42), 10, "Clamping caps at the game maximum");
  console.log("   ✅ Color wrap, bot naming, and clamping behave correctly.");
}

// ====================================================
// 3. Pack detection falls back to the custom studio
// ====================================================
console.log("\n3️⃣ Testing game key detection and custom-studio fallback...");
{
  assert.strictEqual(detectGameKey({ key: "MONOPOLY_CLASSIC" }), "MONOPOLY_CLASSIC");
  assert.strictEqual(detectGameKey({ key: "SOCIAL_MAFIA_SPY" }), "SOCIAL_MAFIA_SPY");
  assert.strictEqual(detectGameKey({ isLudo: true }), "LUDO_CLASSIC");
  assert.strictEqual(detectGameKey({ unoState: {} }), "TACTICAL_CARDS_UNO");
  assert.strictEqual(
    detectGameKey({ rulesConfig: { turnMechanism: "TERRITORY_COMMAND" } }),
    "WORLD_CONQUEST_RISK"
  );
  assert.strictEqual(
    detectGameKey({ rulesConfig: { turnMechanism: "SOCIAL_DISCUSSION_VOTE" } }),
    "SOCIAL_MAFIA_SPY"
  );
  assert.strictEqual(
    detectGameKey({ rulesConfig: { ownershipSystem: "BUY_AND_RENT" } }),
    "MONOPOLY_CLASSIC"
  );
  assert.strictEqual(
    detectGameKey({ rulesConfig: { turnMechanism: "CARD_PLAY_ONLY" } }),
    "GENERIC_BOARD",
    "A custom card-only pack must not be silently treated as Uno"
  );
  assert.strictEqual(
    detectGameKey({
      themeTitle: "أجواء المجلس - أوراق حكمة المجلس (أونو)",
      rulesConfig: { turnMechanism: "CARD_PLAY_ONLY" }
    }),
    "TACTICAL_CARDS_UNO",
    "An explicitly titled Uno pack must resolve the Uno profile"
  );
  assert.strictEqual(
    detectGameKey({
      themeTitle: "سرقة القرن السيبرانية",
      rulesConfig: { turnMechanism: "CARD_PLAY_ONLY" }
    }),
    "GENERIC_BOARD",
    "A themed custom card pack must keep the custom-studio profile"
  );
  assert.strictEqual(detectGameKey({ key: "CUSTOM_UNKNOWN" }), "GENERIC_BOARD");
  assert.strictEqual(detectGameKey(undefined), "GENERIC_BOARD");

  assert.strictEqual(
    resolveGameProfile("SOCIAL_MAFIA_SPY").minPlayers,
    5,
    "Explicit preset keys must resolve their own profile"
  );
  assert.strictEqual(
    resolveGameProfile(undefined, { unoState: {} }).key,
    "TACTICAL_CARDS_UNO"
  );
  console.log("   ✅ Known packs map to their games; unknown packs stay custom.");
}

// ====================================================
// 4. Lounge list integration + local covers
// ====================================================
console.log("\n4️⃣ Testing lounge game identities and cover art...");
{
  const coversDir = path.join(process.cwd(), "public", "covers");
  assert.strictEqual(JAWAKER_LOUNGE_GAMES.length, 9, "The lounge lists nine classic games");

  for (const game of JAWAKER_LOUNGE_GAMES) {
    const profile = GAME_PROFILES[game.key];
    assert.ok(profile, `${game.titleAr} must have a matching game profile`);
    assert.ok(game.cover.startsWith("/covers/"), `${game.titleAr} must use local cover art`);
    assert.ok(
      fs.existsSync(path.join(coversDir, path.basename(game.cover))),
      `Cover file for ${game.titleAr} must exist in public/covers`
    );

    const numbers = game.playerCount.match(/\d+/g)?.map(Number) || [];
    assert.ok(
      numbers.length === 1 || numbers.length === 2,
      `${game.titleAr} player count must contain one or two numbers`
    );
    assert.strictEqual(
      numbers[0],
      profile.minPlayers,
      `${game.titleAr} lobby min must match its profile`
    );
    assert.strictEqual(
      numbers[numbers.length - 1],
      profile.maxPlayers,
      `${game.titleAr} lobby max must match its profile`
    );
  }
  console.log("   ✅ Lounge player counts and local cover files match every profile.");
}

// ====================================================
// 5. Room hard cap
// ====================================================
console.log("\n5️⃣ Testing the shared 10-player room cap...");
{
  const machine = new BoardGameRoomMachine("profile_cap_room", () => {});
  for (let i = 0; i < MAX_PLAYERS_GLOBAL; i++) {
    machine.joinPlayer(`p${i + 1}`, `لاعب ${i + 1}`, getPlayerColor(i));
  }
  assert.strictEqual(
    Object.keys(machine.state.players).length,
    MAX_PLAYERS_GLOBAL,
    "The room must accept exactly 10 players"
  );
  assert.throws(
    () => machine.joinPlayer("overflow", "لاعب زائد", "#ffffff"),
    /ممتلئة/,
    "The 11th player must be rejected"
  );
  console.log("   ✅ Room join cap rejects the 11th player.");
}

console.log("\n====================================================");
console.log("🎉 ALL GAME PROFILE & CAPACITY TESTS PASSED 100%! 🎉");
console.log("====================================================");
