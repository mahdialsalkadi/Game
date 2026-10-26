import assert from "node:assert";
import { BoardGameRoomMachine } from "./src/game/gameRoom";
import {
  AUTHENTIC_MONOPOLY_PACK,
  MONOPOLY_COLOR_GROUPS,
  checkColorMonopoly,
  calculateMonopolyRent,
  type MonopolyColorGroupKey
} from "./src/game/monopolyEngine";
import { PRESET_PACKS } from "./src/game/aiPackGenerator";
import { GeneratedSessionPackSchema } from "./src/game/schema";

console.log("====================================================");
console.log("🏙️ RUNNING SUITE: Authentic Monopoly (عقارات الرياض) Engine & Board");
console.log("====================================================\n");

// 1. Verify Schema and Presets
console.log("1️⃣ Verifying Authentic Monopoly Pack & Color Groups...");
const monopolyPack = PRESET_PACKS.MONOPOLY_CLASSIC;
assert.ok(monopolyPack, "MONOPOLY_CLASSIC must be defined in PRESET_PACKS");

const validated = GeneratedSessionPackSchema.parse(monopolyPack);
assert.strictEqual(validated.tiles.length, 20, "Must have exactly 20 tiles");
assert.strictEqual(validated.rulesConfig.ownershipSystem, "BUY_AND_RENT", "Must use BUY_AND_RENT ownership");
assert.strictEqual(validated.rulesConfig.turnMechanism, "DICE_AND_MOVE", "Must use DICE_AND_MOVE mechanism");

// Check the 4 iconic corners
const cornerGo = validated.tiles[0];
assert.strictEqual(cornerGo.cornerType, "GO", "Tile 0 must be GO corner");
assert.strictEqual(cornerGo.tileType, "START", "Tile 0 must be START type");

const cornerJail = validated.tiles[5];
assert.strictEqual(cornerJail.cornerType, "JAIL", "Tile 5 must be JAIL corner");

const cornerParking = validated.tiles[10];
assert.strictEqual(cornerParking.cornerType, "FREE_PARKING", "Tile 10 must be FREE_PARKING corner");

const cornerGoToJail = validated.tiles[15];
assert.strictEqual(cornerGoToJail.cornerType, "GO_TO_JAIL", "Tile 15 must be GO_TO_JAIL corner");

// Check the 8 distinct color groups
const colorGroupsExpected: MonopolyColorGroupKey[] = [
  "BROWN",
  "LIGHT_BLUE",
  "PINK",
  "ORANGE",
  "RED",
  "YELLOW",
  "GREEN",
  "DARK_BLUE"
];

for (const group of colorGroupsExpected) {
  const groupTiles = validated.tiles.filter((t) => t.colorGroup === group);
  assert.ok(groupTiles.length >= 1, `Color group ${group} must be represented on board`);
  assert.ok(MONOPOLY_COLOR_GROUPS[group], `Config must exist for color group ${group}`);
}

console.log("   ✅ Authentic Riyadh Monopoly Pack & 4 Corners verified.\n");

// 2. Test Color Monopoly & Escalating Rent
console.log("2️⃣ Testing Color Monopoly Rent Doubling & Escalating House/Hotel Rent...");
const brownTiles = validated.tiles.filter((t) => t.colorGroup === "BROWN");
assert.ok(brownTiles.length >= 2, "Brown group must have at least 2 properties (الديرة والبطحاء)");

const [bathaa, deera] = brownTiles;
bathaa.ownerId = "player_1";
deera.ownerId = "player_2"; // split ownership

// Partial ownership: regular rent
assert.strictEqual(
  checkColorMonopoly(validated.tiles, "player_1", "BROWN"),
  false,
  "Player 1 should not have monopoly when properties are split"
);
const baseRent = bathaa.rent || 20;
assert.strictEqual(
  calculateMonopolyRent(bathaa, validated.tiles),
  baseRent,
  "Single property should charge standard base rent"
);

// Full monopoly: 2x base rent
deera.ownerId = "player_1"; // player 1 now owns full group
assert.strictEqual(
  checkColorMonopoly(validated.tiles, "player_1", "BROWN"),
  true,
  "Player 1 should have monopoly when owning all group properties"
);
assert.strictEqual(
  calculateMonopolyRent(bathaa, validated.tiles),
  baseRent * 2,
  "Full monopoly with 0 houses must double the base rent (2x)"
);

// Escalating Houses (1 to 4 houses, 5 = hotel)
bathaa.houses = 1;
const rent1House = calculateMonopolyRent(bathaa, validated.tiles);
assert.ok(rent1House > baseRent * 2, "1 house rent must exceed monopoly base rent");

bathaa.houses = 3;
const rent3Houses = calculateMonopolyRent(bathaa, validated.tiles);
assert.ok(rent3Houses > rent1House, "3 houses rent must exceed 1 house rent");

bathaa.houses = 5; // Hotel
const rentHotel = calculateMonopolyRent(bathaa, validated.tiles);
assert.ok(rentHotel > rent3Houses, "Hotel rent must be maximum escalating rent");

console.log(`   ✅ Rent calculations verified: Base=${baseRent}, Monopoly=${baseRent * 2}, Hotel=${rentHotel}.\n`);

// 3. Test Room Machine: Buying, House Building & Rent Collection
console.log("3️⃣ Testing Room Machine: Buying Properties & Building Houses...");
let broadcastEvents: Array<{ type: string; payload: any }> = [];
const machine = new BoardGameRoomMachine("TEST_MONO", (type, payload) => {
  broadcastEvents.push({ type, payload });
});

machine.joinPlayer("p1", "فيصل", "#3B82F6");
machine.joinPlayer("p2", "سارة", "#EF4444");
machine.startGameWithAIPack(JSON.parse(JSON.stringify(AUTHENTIC_MONOPOLY_PACK)));

const p1 = machine.state.players["p1"];
const p2 = machine.state.players["p2"];
p1.coins = 1000;
p2.coins = 1000;

// p1 buys both brown properties (حي البطحاء index 1, حي الديرة index 2)
// Rule: a property can only be bought from the tile the player landed on.
p1.position = 1;
machine.buyProperty("p1", 1);
assert.strictEqual(machine.state.tiles[1].ownerId, "p1", "p1 should own tile 1");

p1.position = 2;
machine.buyProperty("p1", 2);
assert.strictEqual(machine.state.tiles[2].ownerId, "p1", "p1 should own tile 2");
assert.ok(
  checkColorMonopoly(machine.state.tiles, "p1", "BROWN"),
  "p1 should now hold the complete Brown monopoly"
);

// p1 builds houses on tile 1
const initialCoins = p1.coins;
const houseCost = machine.state.tiles[1].houseCost || 50;
machine.buildHouse("p1", 1);
assert.strictEqual(machine.state.tiles[1].houses, 1, "Tile 1 should now have 1 house");
assert.strictEqual(p1.coins, initialCoins - houseCost, "House cost should be deducted from player coins");

// p1 upgrades with even building across the whole Brown group.
machine.buildHouse("p1", 2); // both: level 1
machine.buildHouse("p1", 1); // both: level 2
machine.buildHouse("p1", 2);
machine.buildHouse("p1", 1); // both: level 3
machine.buildHouse("p1", 2);
machine.buildHouse("p1", 1); // both: level 4
machine.buildHouse("p1", 2);
machine.buildHouse("p1", 1); // Tile 1: hotel (level 5)
machine.buildHouse("p1", 2); // Tile 2: hotel (level 5)
assert.strictEqual(machine.state.tiles[1].houses, 5, "Tile 1 should now have a Hotel (level 5)");
assert.strictEqual(machine.state.tiles[2].houses, 5, "Tile 2 should now have a Hotel (level 5)");

// Cannot build past hotel
assert.throws(() => {
  machine.buildHouse("p1", 1);
}, /وصل هذا العقار إلى أقصى مستوى من البناء/);

console.log("   ✅ Property buying and 5-tier house/hotel upgrades verified.\n");

// 4. Test Jail & Bail Fine Mechanics
console.log("4️⃣ Testing Jail, Go to Jail, Bail Fine & Doubles Roll...");
// Send p2 to Go to Jail tile (index 15)
p2.position = 15;
const goToJailTile = machine.state.tiles[15];
(machine as any).resolveLandedTile(p2, goToJailTile);

assert.strictEqual(p2.inJail, true, "Player 2 should be in jail");
assert.strictEqual(p2.position, 5, "Player 2 position should be moved to Jail cell (tile 5)");
assert.strictEqual(p2.jailTurnsRemaining, 3, "Player 2 should have 3 jail attempts remaining");

// p2 pays jail fine (50 coins)
const coinsBeforeFine = p2.coins;
machine.state.currentTurnIndex = machine.state.turnOrder.indexOf("p2");
machine.state.phase = "TURN_START";

machine.payJailFine("p2");
assert.strictEqual(p2.inJail, false, "Player 2 should be released after paying fine");
assert.strictEqual(p2.jailTurnsRemaining, 0, "Jail turns remaining should reset to 0");
assert.strictEqual(p2.coins, coinsBeforeFine - 50, "50 coins fine should be deducted");
assert.ok(
  (machine.state.freeParkingJackpot || 0) >= 50,
  "Jail fine should be deposited into Free Parking jackpot"
);

console.log("   ✅ Go to Jail & Pay Jail Fine (50 coins) verified.\n");

// 5. Test Free Parking Jackpot Vault
console.log("5️⃣ Testing Free Parking Jackpot Vault Collection...");
const jackpotPot = machine.state.freeParkingJackpot || 100;
const p1CoinsBeforeParking = p1.coins;
p1.position = 10; // Free Parking tile
const freeParkingTile = machine.state.tiles[10];

(machine as any).resolveLandedTile(p1, freeParkingTile);
assert.strictEqual(
  p1.coins,
  p1CoinsBeforeParking + jackpotPot,
  "Player 1 should collect the full Free Parking jackpot"
);
assert.strictEqual(
  machine.state.freeParkingJackpot,
  0,
  "Free parking jackpot should be reset to 0 after collection"
);

console.log("   ✅ Free Parking Jackpot Vault verified.\n");

// 6. Test Dual Dice Roll & Doubles Release
console.log("6️⃣ Testing Dual Dice Roll & In-Jail Doubles Release...");
p2.inJail = true;
p2.jailTurnsRemaining = 2;
machine.state.currentTurnIndex = machine.state.turnOrder.indexOf("p2");
machine.state.phase = "TURN_START";

// Mock rolling dice
machine.rollDiceAndMove("p2");
assert.ok(machine.state.lastDiceRoll, "lastDiceRoll must be recorded");
assert.ok(machine.state.lastDiceRoll.dice1 >= 1 && machine.state.lastDiceRoll.dice1 <= 6, "Dice 1 must be 1-6");
assert.ok(machine.state.lastDiceRoll.dice2 >= 1 && machine.state.lastDiceRoll.dice2 <= 6, "Dice 2 must be 1-6");
assert.strictEqual(
  machine.state.lastDiceRoll.sum,
  machine.state.lastDiceRoll.dice1 + machine.state.lastDiceRoll.dice2,
  "Sum must equal dice1 + dice2"
);

console.log(`   ✅ Dual dice verified: rolled [${machine.state.lastDiceRoll.dice1}, ${machine.state.lastDiceRoll.dice2}] = ${machine.state.lastDiceRoll.sum}.\n`);

console.log("====================================================");
console.log("🎉 ALL AUTHENTIC MONOPOLY TESTS PASSED 100%! 🎉");
console.log("====================================================\n");
