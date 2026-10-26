import { BoardGameRoomMachine } from "./src/game/gameRoom";
import { AUTHENTIC_MONOPOLY_PACK } from "./src/game/monopolyEngine";
import { AUTHENTIC_LUDO_PACK } from "./src/game/ludoEngine";
import { PRESET_PACKS } from "./src/game/aiPackGenerator";
import { getAllThemes, getThemeById } from "./src/game/themeRegistry";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`✅ PASS: ${message}`);
}

console.log("=================================================");
console.log("🧪 RUNNING UNIVERSAL RESKIN, THEME SELECTOR & DUAL PLAY MODES SUITE");
console.log("=================================================\n");

// 1. Room Machine Defaults (Phase 2)
console.log("--- 1. Testing Room Machine Defaults for Theme & PlayMode ---");
const events: Array<{ type: string; payload: any }> = [];
const machine = new BoardGameRoomMachine("TEST_ROOM_1", (type, payload) => {
  events.push({ type, payload });
});

assert(machine.state.themeId === "ARABIAN_MAJLIS", "Default themeId is ARABIAN_MAJLIS");
assert(machine.state.playMode === "CASUAL", "Default playMode is CASUAL");
assert(machine.state.settings.themeId === "ARABIAN_MAJLIS", "Default settings.themeId is ARABIAN_MAJLIS");
assert(machine.state.settings.playMode === "CASUAL", "Default settings.playMode is CASUAL");

// 2. UPDATE_SETTINGS (ThemeId and PlayMode Switching)
console.log("\n--- 2. Testing UPDATE_SETTINGS for Theme & PlayMode ---");
events.length = 0;
machine.updateSettings({ themeId: "CYBERPUNK_NEON" });
assert(machine.state.themeId === "CYBERPUNK_NEON", "themeId updated to CYBERPUNK_NEON");
assert(machine.state.settings.themeId === "CYBERPUNK_NEON", "settings.themeId updated to CYBERPUNK_NEON");
const themeUpdateEvt = events.find(e => e.type === "SETTINGS_UPDATED");
assert(Boolean(themeUpdateEvt), "SETTINGS_UPDATED broadcasted on theme change");
assert(themeUpdateEvt?.payload?.themeId === "CYBERPUNK_NEON", "Broadcast payload contains updated themeId");

events.length = 0;
machine.updateSettings({ playMode: "PRO" });
assert(machine.state.playMode === "PRO", "playMode updated to PRO");
assert(machine.state.settings.playMode === "PRO", "settings.playMode updated to PRO");
const modeUpdateEvt = events.find(e => e.type === "SETTINGS_UPDATED");
assert(Boolean(modeUpdateEvt), "SETTINGS_UPDATED broadcasted on playMode change");
assert(modeUpdateEvt?.payload?.playMode === "PRO", "Broadcast payload contains updated playMode");

// 3. Game Start with Cyberpunk Neon Reskin
console.log("\n--- 3. Testing Game Start with CYBERPUNK_NEON Reskin ---");
machine.joinPlayer("p1", "خالد", "#EF4444");
machine.joinPlayer("p2", "سارة", "#3B82F6");

events.length = 0;
machine.startGameWithAIPack(AUTHENTIC_MONOPOLY_PACK);

assert(machine.state.phase === "TURN_START", "Game started and transitioned to TURN_START");
assert(machine.state.themeId === "CYBERPUNK_NEON", "State themeId preserved as CYBERPUNK_NEON");
assert(machine.state.currencyName === "كريديت نيون", "Currency reskinned to كريديت نيون");
assert(machine.state.tiles[0].name.includes("تحديث النظام"), "GO tile reskinned to Cyberpunk System Update");
assert(machine.state.tiles[5].name.includes("معتقل الميغاكورب"), "JAIL tile reskinned to Cyberpunk Megacorp Jail");
assert(Boolean(machine.state.suggestedTokens?.includes("سايبورغ الهاكر 🤖")), "Suggested tokens include Cyberpunk hacker");
assert(machine.state.playMode === "PRO", "PlayMode remains PRO during game");

// 4. Reset to Lobby
console.log("\n--- 4. Testing Reset to Lobby Retaining Theme & PlayMode ---");
machine.resetToLobby();
assert(machine.state.phase === "LOBBY", "Phase reset to LOBBY");
assert(machine.state.themeId === "CYBERPUNK_NEON", "themeId preserved on resetToLobby");
assert(machine.state.playMode === "PRO", "playMode preserved on resetToLobby");

// 5. Game Start with Deep Space Sci-Fi Reskin (Ludo)
console.log("\n--- 5. Testing Game Start with DEEP_SPACE Reskin (Ludo) ---");
machine.updateSettings({ themeId: "DEEP_SPACE", playMode: "CASUAL" });
assert(machine.state.themeId === "DEEP_SPACE", "Switched theme to DEEP_SPACE");
assert(machine.state.playMode === "CASUAL", "Switched playMode to CASUAL");

machine.startGameWithAIPack(AUTHENTIC_LUDO_PACK);
assert(machine.state.isLudo === true, "Ludo mode detected and initialized");
assert(machine.state.currencyName === "نواة طاقة", "Ludo currency reskinned to نواة طاقة");
assert(Boolean(machine.state.suggestedTokens?.includes("مكوك مداري 🛸")), "Deep Space tokens include Space Shuttle");

// 6. Game Start with Medieval Fantasy Reskin (Snakes & Ladders)
console.log("\n--- 6. Testing Game Start with MEDIEVAL_FANTASY Reskin (Snakes & Ladders) ---");
machine.resetToLobby();
machine.updateSettings({ themeId: "MEDIEVAL_FANTASY" });
assert(machine.state.themeId === "MEDIEVAL_FANTASY", "Switched theme to MEDIEVAL_FANTASY");

machine.startGameWithAIPack(PRESET_PACKS.SNAKES_AND_LADDERS_RPG);
assert(Boolean(machine.state.suggestedTokens?.includes("تنين أسطوري 🐉")), "Medieval tokens include Dragon");
assert(Boolean(machine.state.suggestedTokens?.includes("فارس مصفح 🛡️")), "Medieval tokens include Knight");

// 7. Theme Registry Completeness
console.log("\n--- 7. Testing Universal Theme Registry Consistency ---");
const themes = getAllThemes();
assert(themes.length >= 5, `All universal themes registered (got ${themes.length})`);
for (const t of themes) {
  assert(Boolean(t.id), `Theme ${t.id} has valid id`);
  assert(Boolean(t.titleAr), `Theme ${t.id} has titleAr`);
  assert(Boolean(t.colorPalette.boardTint), `Theme ${t.id} has boardTint`);
  assert(Boolean(t.colorPalette.glowColor), `Theme ${t.id} has glowColor`);
  assert(t.playerTokens.length >= 4, `Theme ${t.id} has at least 4 player tokens`);
}

console.log("\n=================================================");
console.log(`🎉 ALL ${passedTests}/${totalTests} UNIVERSAL RESKIN & PLAY MODES TESTS PASSED!`);
console.log("=================================================");
