import assert from "node:assert";
import { BoardGameRoomMachine } from "./src/game/gameRoom";
import { PRESET_PACKS } from "./src/game/aiPackGenerator";
import { detectRulebookId } from "./src/game/rulebooks";
import {
  gameUsesCurrency,
  getPlayerResultStat,
  getWinnerAchievement,
  orderGameStandings
} from "./src/utils/gameResults";

console.log("====================================================");
console.log("🏁 RUNNING GAME-OVER STANDINGS & RESULT STATS SUITE");
console.log("====================================================\n");

// 1. Winner-first standings even when the winner has fewer coins.
console.log("1️⃣ Testing winner-first standings and GAME_OVER payload...");
{
  const events: any[] = [];
  const machine = new BoardGameRoomMachine("room_winner_first", (type, payload) => {
    events.push({ type, payload });
  });
  machine.joinPlayer("p1", "الأول", "#EF4444");
  machine.joinPlayer("p2", "الثاني", "#3B82F6");
  machine.startGameWithAIPack(PRESET_PACKS.CONNECT_FOUR);
  machine.state.players.p1.coins = 500;
  machine.state.players.p2.coins = 10;

  (machine as any).endGame({
    winner: machine.state.players.p2,
    reasonAr: "اختبار ترتيب الفائز"
  });

  const over = events.find((e) => e.type === "GAME_OVER");
  assert.ok(over, "GAME_OVER event emitted");
  assert.strictEqual(over.payload.winner.id, "p2", "winner passed through");
  assert.strictEqual(over.payload.standings[0].id, "p2", "winner first in standings");
  assert.strictEqual(over.payload.reasonAr, "اختبار ترتيب الفائز", "reasonAr broadcast");
  assert.strictEqual(machine.state.winner?.id, "p2", "machine stores winner");
  machine.resetToLobby();
  assert.strictEqual(machine.state.winner, undefined, "lobby reset clears winner");
  assert.strictEqual(machine.state.victoryReason, undefined, "lobby reset clears reason");
  machine.startGameWithAIPack(PRESET_PACKS.CONNECT_FOUR);
  assert.strictEqual(machine.state.winner, undefined, "new match starts without stale winner");

  const rulebookId = detectRulebookId(machine.state);
  assert.strictEqual(rulebookId, "CONNECT_FOUR", "Connect Four detected");
  assert.strictEqual(gameUsesCurrency(rulebookId), false, "Connect Four is non-currency");
  const ordered = orderGameStandings(over.payload.standings, machine.state, rulebookId, "p2");
  assert.deepStrictEqual(ordered.map((p: any) => p.id), ["p2", "p1"], "non-currency order");
  assert.strictEqual(
    getPlayerResultStat(rulebookId, "p1", machine.state),
    "0 قرص على اللوحة",
    "Connect Four stats count discs"
  );
  assert.strictEqual(getWinnerAchievement(rulebookId), "🔴 أربعة على التوالي");
  console.log("   ✅ Winner-first standings + Connect Four stats verified.\n");
}

// 2. Draws must not crown a player, even with unequal coins.
console.log("2️⃣ Testing draws without a false winner...");
{
  const events: any[] = [];
  const machine = new BoardGameRoomMachine("room_draw", (type, payload) => {
    events.push({ type, payload });
  });
  machine.joinPlayer("p1", "أحمد", "#22C55E");
  machine.joinPlayer("p2", "بدر", "#EAB308");
  machine.startGameWithAIPack(PRESET_PACKS.CHECKERS_CLASSIC);
  machine.state.players.p1.coins = 300;
  machine.state.players.p2.coins = 5;

  (machine as any).endGame({ reasonAr: "تعادل مشرف!" });

  const over = events.find((e) => e.type === "GAME_OVER");
  assert.ok(over, "draw GAME_OVER event emitted");
  assert.strictEqual(over.payload.winner, undefined, "draw has no winner in payload");
  assert.strictEqual(machine.state.winner, undefined, "draw has no winner in state");
  assert.strictEqual(over.payload.reasonAr, "تعادل مشرف!", "draw reason broadcast");
  assert.strictEqual(over.payload.standings.length, 2, "both players ranked");
  assert.strictEqual(getPlayerResultStat("CHECKERS", "p1", machine.state), "12 قطعة · 0 ملك");
  assert.strictEqual(getWinnerAchievement("CHECKERS"), "👑 ملك الرقعة");
  console.log("   ✅ Draw without false winner + Checkers stats verified.\n");
}

// 3. Per-game stat labels for every game type.
console.log("3️⃣ Testing per-game result stat labels...");
{
  const base = {
    players: {
      p1: { id: "p1", name: "لاعب", coins: 0, position: 37, secretHand: [1, 2, 3] }
    },
    turnOrder: ["p1"],
    currencyName: "ذهبة",
    ludoState: { players: { p1: { finishedCount: 2 } } },
    bingoState: { cards: { p1: { lines: 1 } } },
    mafiaState: { roles: { p1: "DETECTIVE" } },
    unoState: {
      playerCardCounts: { p1: 4 },
      playerHands: { p1: [{}, {}, {}, {}] }
    },
    tiles: [{ ownerId: "p1" }, { ownerId: "p1" }, { ownerId: null }],
    connectFourState: { board: [["p1", null], [null, null]] },
    checkersState: { board: [[{ playerId: "p1", king: true }], []] }
  } as any;

  assert.strictEqual(getPlayerResultStat("BINGO", "p1", base), "1 خط مكتمل");
  assert.strictEqual(getPlayerResultStat("LUDO", "p1", base), "2/4 في المركز");
  assert.strictEqual(getPlayerResultStat("UNO", "p1", base), "4 ورقة في اليد");
  assert.strictEqual(getPlayerResultStat("SNAKES_AND_LADDERS", "p1", base), "المربع 38");
  assert.strictEqual(getPlayerResultStat("MAFIA", "p1", base), "المحقق 🔎");
  assert.strictEqual(getPlayerResultStat("RISK", "p1", base), "2 إقليم");
  assert.strictEqual(getPlayerResultStat("CONNECT_FOUR", "p1", base), "1 قرص على اللوحة");
  assert.strictEqual(getPlayerResultStat("CHECKERS", "p1", base), "1 قطعة · 1 ملك");
  assert.strictEqual(getPlayerResultStat("GENERIC", "p1", base), "0 ذهبة");
  assert.strictEqual(gameUsesCurrency("MONOPOLY"), true);
  assert.strictEqual(gameUsesCurrency("RISK"), true);
  assert.strictEqual(gameUsesCurrency("BINGO"), false);
  console.log("   ✅ Stat labels for all nine games verified.\n");
}

console.log("====================================================");
console.log("🎉 ALL GAME-OVER & RESULT STATS TESTS PASSED 100%! 🎉");
console.log("====================================================");
