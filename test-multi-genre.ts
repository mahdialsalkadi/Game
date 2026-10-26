import assert from "node:assert";
import { BoardGameRoomMachine } from "./src/game/gameRoom";
import type { GeneratedSessionPack } from "./src/game/schema";

console.log("🧪 Running Multi-Genre Engine Verification Test...");

function createMockRoom(customRules?: any) {
  const broadcasts: { eventType: string; payload: any }[] = [];
  const machine = new BoardGameRoomMachine("test_room", (type, payload) => {
    broadcasts.push({ eventType: type, payload });
  });

  machine.joinPlayer("p1", "سلطان", "#EF4444");
  machine.joinPlayer("p2", "فارس", "#3B82F6");

  return { machine, broadcasts };
}

// ==========================================
// 1. Monopoly-Style BUY_AND_RENT & Automatic Rent Collection
// ==========================================
console.log("  Testing 1: Monopoly-Style BUY_AND_RENT & Automated Rent...");
{
  const { machine, broadcasts } = createMockRoom();

  const monopolyPack: GeneratedSessionPack = {
    themeTitle: "مونوبولي كلاسيك",
    visualStyle: "CARTOON_OFFICE",
    archetype: "PARTY_ECONOMY",
    winCondition: "MOST_COINS",
    currencyName: "دينار",
    narratorIntro: "مرحباً بكم في عالم العقارات!",
    rulesConfig: {
      turnMechanism: "DICE_AND_MOVE",
      cardVisibility: "SECRET_PHONE_ONLY",
      ownershipSystem: "BUY_AND_RENT"
    },
    tiles: Array.from({ length: 20 }, (_, idx) => ({
      index: idx,
      tileType: idx === 0 ? "START" : "RESOURCE",
      name: idx === 3 ? "شارع الحمراء" : `شارع ${idx}`,
      description: `عقار ${idx}`,
      price: idx === 3 ? 100 : 80,
      rent: idx === 3 ? 40 : 20,
      ownerId: null
    })),
    cardsDeck: Array.from({ length: 15 }, (_, idx) => ({
      id: `card_${idx}`,
      title: `بطاقة ${idx}`,
      category: "SECRET_HAND",
      flavorText: `نص ${idx}`,
      effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 20 }]
    }))
  };

  machine.startGameWithAIPack(monopolyPack);
  assert.strictEqual(machine.state.rulesConfig.ownershipSystem, "BUY_AND_RENT");

  // Sultan (p1) is turn 1. Starting coins = 150.
  // Move p1 to tile 3 (price: 100, rent: 40)
  machine.state.players["p1"].position = 3;
  machine.buyProperty("p1", 3);

  // Check p1 coins deducted: 150 - 100 = 50
  assert.strictEqual(machine.state.players["p1"].coins, 50);
  assert.strictEqual(machine.state.tiles[3].ownerId, "p1");

  // End p1's turn
  (machine as any).advanceTurn();
  assert.strictEqual(machine.getActivePlayerId(), "p2");

  // Faris (p2) lands on tile 3 owned by Sultan
  // p2 starting coins = 150
  const landedTile = machine.state.tiles[3];
  (machine as any).resolveLandedTile(machine.state.players["p2"], landedTile);

  // Faris should pay 40 to Sultan automatically
  assert.strictEqual(machine.state.players["p2"].coins, 110, "Faris coins should be 150 - 40 = 110");
  assert.strictEqual(machine.state.players["p1"].coins, 90, "Sultan coins should be 50 + 40 = 90");

  const rentBroadcast = broadcasts.find(b => b.eventType === "RENT_PAID");
  assert.ok(rentBroadcast, "RENT_PAID broadcast should be emitted");
  assert.strictEqual(rentBroadcast.payload.rent, 40);

  // Rent clamping edge case: player has fewer coins than rent
  machine.state.players["p2"].coins = 15; // less than rent 40
  (machine as any).resolveLandedTile(machine.state.players["p2"], landedTile);
  assert.strictEqual(machine.state.players["p2"].coins, 0, "Coins must clamp at 0");
  assert.strictEqual(machine.state.players["p1"].coins, 90 + 15, "Owner only receives available 15 coins");
  console.log("  ✅ Monopoly BUY_AND_RENT passed!");
}

// ==========================================
// 2. Risk-Style Territory Conquest without Dice
// ==========================================
console.log("  Testing 2: Risk-Style TERRITORY_COMMAND...");
{
  const { machine, broadcasts } = createMockRoom();

  const riskPack: GeneratedSessionPack = {
    themeTitle: "صراع الأقاليم",
    visualStyle: "ANCIENT_ARABIA",
    archetype: "BOARD_RACE",
    winCondition: "LAST_SURVIVOR",
    currencyName: "كتيبة",
    narratorIntro: "قُد جيوشك لغزو الخريطة!",
    rulesConfig: {
      turnMechanism: "TERRITORY_COMMAND",
      cardVisibility: "NO_HAND_CARDS",
      ownershipSystem: "CONQUER_REGIONS"
    },
    tiles: Array.from({ length: 20 }, (_, idx) => ({
      index: idx,
      tileType: "RESOURCE",
      name: `إقليم ${idx}`,
      description: `منطقة استراتيجية ${idx}`,
      price: 50,
      armies: idx === 5 ? 2 : 1,
      ownerId: idx === 5 ? "p2" : null
    })),
    cardsDeck: Array.from({ length: 15 }, (_, idx) => ({
      id: `card_${idx}`,
      title: `بطاقة ${idx}`,
      category: "SECRET_HAND",
      flavorText: `نص ${idx}`,
      effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 10 }]
    }))
  };

  machine.startGameWithAIPack(riskPack);
  assert.strictEqual(machine.state.rulesConfig.turnMechanism, "TERRITORY_COMMAND");

  // Sultan (p1) claims a neutral territory without rolling dice
  assert.strictEqual(machine.getActivePlayerId(), "p1");
  const neutralTile = machine.state.tiles.find((tile) => !tile.ownerId)!;
  assert.ok(neutralTile, "The map must start with neutral territories");
  machine.claimOrAttackTile("p1", neutralTile.index);

  // Neutral territory claimed by p1
  assert.strictEqual(machine.state.tiles[neutralTile.index].ownerId, "p1");

  // New Risk rules: a turn grants 3 command actions, so the turn stays with p1.
  assert.strictEqual(machine.getActivePlayerId(), "p1", "Turn should remain with p1 after the first command");
  assert.strictEqual(machine.state.territoryState?.actionsLeft, 2, "Two command actions should remain");

  // Reinforce the captured territory (one more command action)
  machine.reinforceTile("p1", neutralTile.index, 1);
  assert.strictEqual(machine.state.tiles[neutralTile.index].armies, 2, "Reinforcement should add an army");
  assert.strictEqual(machine.state.territoryState?.actionsLeft, 1);

  // End the turn explicitly, then Faris attacks with the dice-based combat resolver.
  machine.endTurn("p1");
  assert.strictEqual(machine.getActivePlayerId(), "p2", "Turn should advance to p2 after ending the turn");

  const p2CoinsBefore = machine.state.players["p2"].coins;
  machine.claimOrAttackTile("p2", neutralTile.index);
  const battle = machine.state.territoryState?.lastBattle;
  assert.ok(battle, "An attack must produce a battle log");
  // هجوم = 20 احتياطاً + كلفة الكتائب المهاجمة التي خسرتها مقارنات النرد،
  // مع مكافأة غنيمة 30 عند احتلال الإقليم.
  const expectedP2Coins =
    p2CoinsBefore - 20 - (battle?.casualtyCost || 0) + (battle?.captured ? 30 : 0);
  assert.strictEqual(
    machine.state.players["p2"].coins,
    expectedP2Coins,
    "An attack must cost 20 reserve battalions plus any attacker casualties, and award capture loot"
  );
  assert.ok(
    machine.state.tiles[neutralTile.index].ownerId === "p1" || machine.state.tiles[neutralTile.index].ownerId === "p2",
    "The attacked territory must have a valid owner after combat"
  );

  console.log("  ✅ Territory Command passed!");
}

// ==========================================
// 3. Uno-Style CARD_PLAY_ONLY advancing turn
// ==========================================
console.log("  Testing 3: Uno-Style CARD_PLAY_ONLY...");
{
  const { machine } = createMockRoom();

  const unoPack: GeneratedSessionPack = {
    themeTitle: "تحدي الأوراق السريع",
    visualStyle: "CARTOON_OFFICE",
    archetype: "DECK_BATTLER",
    winCondition: "TARGET_SCORE",
    currencyName: "نقطة",
    narratorIntro: "العب بطاقاتك وتخلص منها أولاً!",
    rulesConfig: {
      turnMechanism: "CARD_PLAY_ONLY",
      cardVisibility: "SECRET_PHONE_ONLY",
      ownershipSystem: "NONE"
    },
    tiles: Array.from({ length: 20 }, (_, idx) => ({
      index: idx,
      tileType: "RESOURCE",
      name: `مربع ${idx}`,
      description: `مربع ${idx}`
    })),
    cardsDeck: Array.from({ length: 15 }, (_, idx) => ({
      id: `c_${idx}`,
      title: `ورقة تكتيكية ${idx}`,
      category: "SECRET_HAND",
      flavorText: `نص ${idx}`,
      effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 25 }]
    }))
  };

  machine.startGameWithAIPack(unoPack);
  assert.strictEqual(machine.state.rulesConfig.turnMechanism, "CARD_PLAY_ONLY");

  // Give p1 a card
  machine.state.players["p1"].secretHand = [
    {
      id: "card_uno_1",
      title: "ضربة قاضية",
      category: "SECRET_HAND",
      flavorText: "العبها واكسب نقاطاً",
      effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 25 }]
    }
  ];

  assert.strictEqual(machine.getActivePlayerId(), "p1");
  // In CARD_PLAY_ONLY, playing a secret card advances turn
  machine.playSecretCard("p1", "card_uno_1");

  assert.strictEqual(machine.getActivePlayerId(), "p2", "Turn should advance to p2 after card play");
  console.log("  ✅ CARD_PLAY_ONLY passed!");
}

// ==========================================
// 4. Snakes & Ladders Instant Jumps
// ==========================================
console.log("  Testing 4: Snakes & Ladders Instant Jumps...");
{
  const { machine, broadcasts } = createMockRoom();

  const snakesPack: GeneratedSessionPack = {
    themeTitle: "السلم والثعبان",
    visualStyle: "FANTASY",
    archetype: "BOARD_RACE",
    winCondition: "FIRST_TO_FINISH",
    currencyName: "خطوة",
    narratorIntro: "اصعد السلالم واحذر الثعابين!",
    rulesConfig: {
      turnMechanism: "DICE_AND_MOVE",
      cardVisibility: "NO_HAND_CARDS",
      ownershipSystem: "NONE"
    },
    tiles: Array.from({ length: 20 }, (_, idx) => ({
      index: idx,
      tileType: idx === 0 ? "START" : "RESOURCE",
      name: idx === 4 ? "سلم المجد 🪜" : idx === 14 ? "ثعبان الغدر 🐍" : `مربع ${idx}`,
      description: `وصف ${idx}`,
      jumpToIndex: idx === 4 ? 12 : idx === 14 ? 3 : undefined
    })),
    cardsDeck: Array.from({ length: 15 }, (_, idx) => ({
      id: `c_${idx}`,
      title: `بطاقة ${idx}`,
      category: "SECRET_HAND",
      flavorText: `نص ${idx}`,
      effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 10 }]
    }))
  };

  machine.startGameWithAIPack(snakesPack);

  // Player lands on ladder at index 4 (jumps to 12)
  const ladderTile = machine.state.tiles[4];
  (machine as any).resolveLandedTile(machine.state.players["p1"], ladderTile);
  assert.strictEqual(machine.state.players["p1"].position, 12, "Player should jump to index 12");

  const ladderBroadcast = broadcasts.find(b => b.eventType === "LADDER_OR_SNAKE_JUMP" && b.payload.isLadder);
  assert.ok(ladderBroadcast, "Ladder jump broadcast emitted");

  // Player lands on snake at index 14 (slides to 3)
  const snakeTile = machine.state.tiles[14];
  (machine as any).resolveLandedTile(machine.state.players["p1"], snakeTile);
  assert.strictEqual(machine.state.players["p1"].position, 3, "Player should slide down to index 3");

  const snakeBroadcast = broadcasts.find(b => b.eventType === "LADDER_OR_SNAKE_JUMP" && !b.payload.isLadder);
  assert.ok(snakeBroadcast, "Snake jump broadcast emitted");

  console.log("  ✅ Snakes & Ladders jumps passed!");
}

console.log("🎉 All Multi-Genre Engine tests passed successfully!");
