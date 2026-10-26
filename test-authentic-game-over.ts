import assert from "node:assert";
import { BoardGameRoomMachine } from "./src/game/gameRoom";
import { PRESET_PACKS } from "./src/game/aiPackGenerator";
import { AUTHENTIC_MONOPOLY_PACK } from "./src/game/monopolyEngine";

console.log("====================================================");
console.log("🏆 RUNNING AUTHENTIC GAME-OVER & VICTORY CONDITIONS SUITE");
console.log("====================================================\n");

// --- 1. Authentic UNO Victory Check ---
console.log("1️⃣ Testing Authentic UNO Zero-Card Victory...");
{
  const broadcasts: any[] = [];
  const machine = new BoardGameRoomMachine("room_uno", (type, payload) => {
    broadcasts.push({ type, payload });
  });

  machine.joinPlayer("p1", "سعود", "#EF4444");
  machine.joinPlayer("p2", "فيصل", "#3B82F6");
  machine.startGameWithAIPack(PRESET_PACKS.TACTICAL_CARDS_UNO);

  assert.ok(machine.state.unoState, "unoState must be initialized");

  // Force p1's hand to 0 cards
  machine.state.unoState.playerHands["p1"] = [];

  const victory = machine.checkVictoryCondition();
  assert.strictEqual(victory.isOver, true, "UNO: Game is over when hand has 0 cards");
  assert.strictEqual(victory.winner?.id, "p1", "UNO: Player with 0 cards is winner");
  assert.strictEqual(victory.reasonAr, "تخلص من جميع أوراقه وصرخ أونو بنجاح!");
  console.log("   ✅ Authentic UNO zero-cards victory verified!\n");
}

// --- 2. Authentic LUDO 4-Token Finished Victory Check ---
console.log("2️⃣ Testing Authentic LUDO 4-Token Center Victory...");
{
  const broadcasts: any[] = [];
  const machine = new BoardGameRoomMachine("room_ludo", (type, payload) => {
    broadcasts.push({ type, payload });
  });

  machine.joinPlayer("p1", "خالد", "#22C55E");
  machine.joinPlayer("p2", "فهد", "#EAB308");
  machine.startGameWithAIPack(PRESET_PACKS.LUDO_CLASSIC);

  assert.ok(machine.state.isLudo, "isLudo flag must be true");
  assert.ok(machine.state.ludoState, "ludoState must be initialized");

  // Force p2 to have 4 finished tokens
  machine.state.ludoState.players["p2"].finishedCount = 4;

  const victory = machine.checkVictoryCondition();
  assert.strictEqual(victory.isOver, true, "LUDO: Game is over when 4 tokens are finished");
  assert.strictEqual(victory.winner?.id, "p2", "LUDO: Player with 4 tokens in center is winner");
  assert.strictEqual(victory.reasonAr, "أوصل جميع قطعه الأربعة للمركز وحقق النصر!");
  console.log("   ✅ Authentic LUDO 4-token center victory verified!\n");
}

// --- 3. Authentic Snakes & Ladders Square 100 Victory Check ---
console.log("3️⃣ Testing Authentic Snakes & Ladders Square 100 Victory...");
{
  const broadcasts: any[] = [];
  const machine = new BoardGameRoomMachine("room_snakes", (type, payload) => {
    broadcasts.push({ type, payload });
  });

  machine.joinPlayer("p1", "طارق", "#A855F7");
  machine.joinPlayer("p2", "ريان", "#EC4899");
  machine.startGameWithAIPack(PRESET_PACKS.SNAKES_AND_LADDERS_RPG);

  // Player lands on square 100 (index 99 in 0-indexed board)
  machine.state.players["p1"].position = 99;

  const victory = machine.checkVictoryCondition();
  assert.strictEqual(victory.isOver, true, "Snakes & Ladders: Game is over on square 100");
  assert.strictEqual(victory.winner?.id, "p1", "Snakes & Ladders: Player on square 100 is winner");
  assert.ok(victory.reasonAr.includes("بلغ قمة المربع 100 واعتلى عرش اللعبة!"));
  console.log("   ✅ Authentic Snakes & Ladders square 100 victory verified!\n");
}

// --- 4. Authentic Monopoly Real Bankruptcy Elimination & 1 Solvent Winner ---
console.log("4️⃣ Testing Monopoly Real Bankruptcy Elimination & Creditor Transfer...");
{
  const broadcasts: any[] = [];
  const machine = new BoardGameRoomMachine("room_monopoly", (type, payload) => {
    broadcasts.push({ type, payload });
  });

  machine.joinPlayer("p1", "سلمان", "#3B82F6");
  machine.joinPlayer("p2", "بندر", "#EF4444");
  machine.startGameWithAIPack(JSON.parse(JSON.stringify(AUTHENTIC_MONOPOLY_PACK)));

  // p1 owns tile 1 (حي البطحاء) with 3 houses
  machine.state.tiles[1].ownerId = "p1";
  machine.state.tiles[1].houses = 3;
  machine.state.tiles[1].rent = 200;

  // p2 owns tile 2 (حي الديرة)
  machine.state.tiles[2].ownerId = "p2";

  // p2 has only 50 coins and lands on p1's property (rent 200)
  machine.state.players["p2"].coins = 50;
  machine.state.players["p2"].position = 1;

  (machine as any).resolveLandedTile(machine.state.players["p2"], machine.state.tiles[1]);

  // p2 must be bankrupt and eliminated
  assert.strictEqual(machine.state.players["p2"].coins, 0, "Bankrupt player coins reduced to 0");
  assert.strictEqual(machine.state.players["p2"].isBankrupt, true, "p2 marked as isBankrupt");
  assert.strictEqual(machine.state.players["p2"].isEliminated, true, "p2 marked as isEliminated");

  // p2's property (tile 2) transferred to creditor (p1)
  assert.strictEqual(machine.state.tiles[2].ownerId, "p1", "Tile 2 transferred to creditor p1");

  // Game must end with p1 winning by bankrupting all competitors
  assert.strictEqual(machine.state.phase, "GAME_OVER", "Phase transitioned to GAME_OVER");
  assert.strictEqual(machine.state.winner?.id, "p1", "Solvent player p1 is declared winner");
  assert.strictEqual(machine.state.victoryReason, "أفلس جميع المنافسين واحتكر سوق العقارات بالكامل!");

  const bankruptEvent = broadcasts.find((b) => b.type === "PLAYER_BANKRUPT");
  assert.ok(bankruptEvent, "PLAYER_BANKRUPT event broadcasted");
  assert.strictEqual(bankruptEvent.payload.creditorId, "p1");

  console.log("   ✅ Real bankruptcy elimination and creditor asset transfer verified!\n");
}

// --- 5. Monopoly Financial Empire Victory (2000 SAR or 4 Monopolies) ---
console.log("5️⃣ Testing Monopoly Financial Empire Victory Conditions...");
{
  // 5a. 2000 SAR Victory
  const machine1 = new BoardGameRoomMachine("room_empire_coins", () => {});
  machine1.joinPlayer("p1", "نايف", "#3B82F6");
  machine1.joinPlayer("p2", "مشعل", "#EF4444");
  machine1.startGameWithAIPack(JSON.parse(JSON.stringify(AUTHENTIC_MONOPOLY_PACK)));

  machine1.state.players["p1"].coins = 2050;
  const victoryCoins = machine1.checkVictoryCondition();
  assert.strictEqual(victoryCoins.isOver, true, "2000 SAR triggers financial empire victory");
  assert.strictEqual(victoryCoins.winner?.id, "p1");
  assert.ok(victoryCoins.reasonAr.includes("2000"));

  // 5b. 4 Complete Color Groups Monopoly
  const machine2 = new BoardGameRoomMachine("room_empire_groups", () => {});
  machine2.joinPlayer("p1", "نايف", "#3B82F6");
  machine2.joinPlayer("p2", "مشعل", "#EF4444");
  machine2.startGameWithAIPack(JSON.parse(JSON.stringify(AUTHENTIC_MONOPOLY_PACK)));

  // Give p1 4 complete color groups: BROWN, LIGHT_BLUE, PINK, ORANGE
  const targetGroups = ["BROWN", "LIGHT_BLUE", "PINK", "ORANGE"];
  for (const t of machine2.state.tiles) {
    if (t.colorGroup && targetGroups.includes(t.colorGroup)) {
      t.ownerId = "p1";
    }
  }

  const victoryGroups = machine2.checkVictoryCondition();
  assert.strictEqual(victoryGroups.isOver, true, "4 Color group monopolies trigger victory");
  assert.strictEqual(victoryGroups.winner?.id, "p1");
  assert.ok(victoryGroups.reasonAr.includes("4 مجموعات"));

  console.log("   ✅ Monopoly financial empire (2000 SAR & 4 monopolies) verified!\n");
}

// --- 6. Authentic Territory Conquest (Risk 75% Conquest) ---
console.log("6️⃣ Testing Authentic Territory Conquest (Risk 75% Rule)...");
{
  const broadcasts: any[] = [];
  const machine = new BoardGameRoomMachine("room_risk", (type, payload) => {
    broadcasts.push({ type, payload });
  });

  machine.joinPlayer("p1", "عمر", "#3B82F6");
  machine.joinPlayer("p2", "حمزة", "#EF4444");
  machine.startGameWithAIPack(PRESET_PACKS.WORLD_CONQUEST_RISK);

  const claimable = machine.state.tiles.filter((t) => t.tileType !== "START" || t.price !== undefined);
  const needed75Percent = Math.ceil(claimable.length * 0.75);

  // Give p1 75% of territories
  for (let i = 0; i < needed75Percent; i++) {
    claimable[i].ownerId = "p1";
  }

  const victory = machine.checkVictoryCondition();
  assert.strictEqual(victory.isOver, true, "Controlling >= 75% of territories triggers victory");
  assert.strictEqual(victory.winner?.id, "p1");
  assert.ok(victory.reasonAr.includes("75%"));

  console.log("   ✅ Risk territory conquest 75% victory verified!\n");
}

// --- 7. No Round Cap & Turn Advancement without Artificial Termination ---
console.log("7️⃣ Testing Endless Rounds Natural Flow (No Artificial Cap)...");
{
  const machine = new BoardGameRoomMachine("room_rounds", () => {}, { maxRounds: 5 });
  machine.joinPlayer("p1", "زيد", "#3B82F6");
  machine.joinPlayer("p2", "عمرو", "#EF4444");
  machine.startGameWithAIPack(PRESET_PACKS.SNAKES_AND_LADDERS_RPG);

  // Fast forward currentRound to round 20 (way beyond maxRounds 5!)
  machine.state.currentRound = 20;
  machine.state.currentTurnIndex = 1;

  machine.advanceTurn();

  assert.strictEqual(machine.state.phase, "TURN_START", "Game must stay active in TURN_START");
  assert.strictEqual(machine.state.currentRound, 21, "currentRound increments past 20 to 21 without terminating");

  console.log("   ✅ Natural round advancement without artificial limits verified!\n");
}

console.log("====================================================");
console.log("🎉 ALL AUTHENTIC GAME-OVER & VICTORY TESTS PASSED 100%!");
console.log("====================================================");
