import assert from "node:assert";
import {
  TurnMechanismEnum,
  CardVisibilityEnum,
  OwnershipSystemEnum,
  GameRulesConfigSchema,
  BoardTileSchema,
  GeneratedSessionPackSchema
} from "./src/game/schema";

console.log("🧪 Running Multi-Genre Schema Verification...");

// 1. Enums verification
assert.strictEqual(TurnMechanismEnum.Enum.DICE_AND_MOVE, "DICE_AND_MOVE");
assert.strictEqual(TurnMechanismEnum.Enum.TERRITORY_COMMAND, "TERRITORY_COMMAND");
assert.strictEqual(TurnMechanismEnum.Enum.CARD_PLAY_ONLY, "CARD_PLAY_ONLY");
assert.strictEqual(TurnMechanismEnum.Enum.SOCIAL_DISCUSSION_VOTE, "SOCIAL_DISCUSSION_VOTE");

assert.strictEqual(CardVisibilityEnum.Enum.SECRET_PHONE_ONLY, "SECRET_PHONE_ONLY");
assert.strictEqual(CardVisibilityEnum.Enum.OPEN_PUBLIC_CARDS, "OPEN_PUBLIC_CARDS");
assert.strictEqual(CardVisibilityEnum.Enum.NO_HAND_CARDS, "NO_HAND_CARDS");

assert.strictEqual(OwnershipSystemEnum.Enum.NONE, "NONE");
assert.strictEqual(OwnershipSystemEnum.Enum.BUY_AND_RENT, "BUY_AND_RENT");
assert.strictEqual(OwnershipSystemEnum.Enum.CONQUER_REGIONS, "CONQUER_REGIONS");

// 2. GameRulesConfigSchema defaults
const defaultRules = GameRulesConfigSchema.parse({});
assert.strictEqual(defaultRules.turnMechanism, "DICE_AND_MOVE");
assert.strictEqual(defaultRules.cardVisibility, "SECRET_PHONE_ONLY");
assert.strictEqual(defaultRules.ownershipSystem, "NONE");

// 3. BoardTileSchema with property ownership, rent, armies, and jumps
const tile = BoardTileSchema.parse({
  index: 3,
  tileType: "RESOURCE",
  name: "شارع الحمراء",
  description: "عقار فاخر للشراء",
  price: 200,
  rent: 45,
  ownerId: "player_123",
  armies: 3,
  jumpToIndex: 12
});

assert.strictEqual(tile.price, 200);
assert.strictEqual(tile.rent, 45);
assert.strictEqual(tile.ownerId, "player_123");
assert.strictEqual(tile.armies, 3);
assert.strictEqual(tile.jumpToIndex, 12);

// 4. GeneratedSessionPackSchema with default rulesConfig
const pack = GeneratedSessionPackSchema.parse({
  themeTitle: "اختبار القواعد",
  visualStyle: "CYBERPUNK",
  currencyName: "ذهب",
  narratorIntro: "مرحبا",
  tiles: Array.from({ length: 20 }, (_, idx) => ({
    index: idx,
    tileType: idx === 0 ? "START" : "RESOURCE",
    name: `مربع ${idx}`,
    description: `وصف ${idx}`
  })),
  cardsDeck: Array.from({ length: 15 }, (_, idx) => ({
    id: `card_${idx}`,
    title: `بطاقة ${idx}`,
    category: "SECRET_HAND",
    flavorText: `نص ${idx}`,
    effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 10 }]
  }))
});

assert.ok(pack.rulesConfig);
assert.strictEqual(pack.rulesConfig.turnMechanism, "DICE_AND_MOVE");
assert.strictEqual(pack.rulesConfig.cardVisibility, "SECRET_PHONE_ONLY");
assert.strictEqual(pack.rulesConfig.ownershipSystem, "NONE");

console.log("✅ All Multi-Genre Schema tests passed successfully!");
