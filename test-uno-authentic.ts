import assert from "assert";
import {
  createStandardUnoDeck,
  initializeUnoGame,
  canPlayUnoCard,
  executePlayUnoCard,
  executeDrawUnoCard,
  executePassUnoAfterDraw,
  executeShoutUno,
  getBestUnoBotMove,
  sanitizeUnoStateForViewer,
  type UnoCard,
  type UnoActiveColor
} from "./src/game/unoEngine";
import { BoardGameRoomMachine } from "./src/game/gameRoom";
import { PRESET_PACKS } from "./src/game/aiPackGenerator";

console.log("====================================================");
console.log("🃏 RUNNING AUTHENTIC UNO & TACTICAL CARDS TEST SUITE");
console.log("====================================================\n");

function createMockRoom() {
  const broadcasts: Array<{ eventType: string; payload: Record<string, unknown> }> = [];
  const machine = new BoardGameRoomMachine("test_uno_room", (eventType, payload) => {
    broadcasts.push({ eventType, payload });
  });

  machine.joinPlayer("p1", "سعود", "#EF4444");
  machine.joinPlayer("p2", "فيصل", "#3B82F6");
  machine.joinPlayer("p3", "نورة", "#22C55E");

  return { machine, broadcasts };
}

// ====================================================
// 1. Standard 108-Card Uno Deck Composition & Dealing
// ====================================================
console.log("1️⃣ Testing Standard 108-Card Uno Deck Composition & Dealing...");
{
  const deck = createStandardUnoDeck();
  assert.strictEqual(deck.length, 108, "Standard Uno deck must contain exactly 108 cards");

  const colorsCount = {
    RED: deck.filter((c) => c.color === "RED").length,
    BLUE: deck.filter((c) => c.color === "BLUE").length,
    GREEN: deck.filter((c) => c.color === "GREEN").length,
    YELLOW: deck.filter((c) => c.color === "YELLOW").length,
    WILD: deck.filter((c) => c.color === "WILD").length
  };

  assert.strictEqual(colorsCount.RED, 25, "Red must have 25 cards");
  assert.strictEqual(colorsCount.BLUE, 25, "Blue must have 25 cards");
  assert.strictEqual(colorsCount.GREEN, 25, "Green must have 25 cards");
  assert.strictEqual(colorsCount.YELLOW, 25, "Yellow must have 25 cards");
  assert.strictEqual(colorsCount.WILD, 8, "Wilds must have 8 cards (4 Wild + 4 Wild +4)");

  const wildCount = deck.filter((c) => c.value === "WILD").length;
  const wild4Count = deck.filter((c) => c.value === "WILD_DRAW_FOUR").length;
  assert.strictEqual(wildCount, 4, "Must have exactly 4 regular Wild cards");
  assert.strictEqual(wild4Count, 4, "Must have exactly 4 Wild Draw Four (+4) cards");

  // Test game initialization with 3 players
  const uno = initializeUnoGame(["p1", "p2", "p3"]);
  assert.strictEqual(uno.playerHands["p1"].length, 7, "Player 1 must receive 7 cards");
  assert.strictEqual(uno.playerHands["p2"].length, 7, "Player 2 must receive 7 cards");
  assert.strictEqual(uno.playerHands["p3"].length, 7, "Player 3 must receive 7 cards");
  assert.ok(uno.topCard, "Top card must exist on table");
  assert.notStrictEqual(uno.topCard.value, "WILD_DRAW_FOUR", "First top card cannot be a Wild Draw Four");
  assert.strictEqual(uno.direction, 1, "Initial play direction must be clockwise (+1)");
  assert.strictEqual(uno.deck.length, 108 - 21 - 1, "Deck should have remaining cards");

  console.log("   ✅ Standard 108-card deck composition and 7-card deal passed!");
}

// ====================================================
// 2. Color Matching & Number Matching Rules
// ====================================================
console.log("\n2️⃣ Testing Color Matching & Number Matching Rules...");
{
  const topCard: UnoCard = {
    id: "c_red_7",
    color: "RED",
    value: "7",
    label: "7",
    labelAr: "أحمر 7",
    symbol: "7"
  };
  const activeColor: UnoActiveColor = "RED";

  // Same color, different number -> Allowed
  const matchingColorCard: UnoCard = {
    id: "c_red_3",
    color: "RED",
    value: "3",
    label: "3",
    labelAr: "أحمر 3",
    symbol: "3"
  };
  assert.strictEqual(
    canPlayUnoCard(matchingColorCard, topCard, activeColor),
    true,
    "Matching color must be playable"
  );

  // Different color, same number -> Allowed
  const matchingNumberCard: UnoCard = {
    id: "c_blue_7",
    color: "BLUE",
    value: "7",
    label: "7",
    labelAr: "أزرق 7",
    symbol: "7"
  };
  assert.strictEqual(
    canPlayUnoCard(matchingNumberCard, topCard, activeColor),
    true,
    "Matching number across colors must be playable"
  );

  // Different color, different number -> Rejected
  const invalidCard: UnoCard = {
    id: "c_green_2",
    color: "GREEN",
    value: "2",
    label: "2",
    labelAr: "أخضر 2",
    symbol: "2"
  };
  assert.strictEqual(
    canPlayUnoCard(invalidCard, topCard, activeColor),
    false,
    "Mismatched color and number must NOT be playable"
  );

  // Wild is always playable
  const wildCard: UnoCard = {
    id: "c_wild_1",
    color: "WILD",
    value: "WILD",
    label: "★",
    labelAr: "جوكر",
    symbol: "★"
  };
  assert.strictEqual(
    canPlayUnoCard(wildCard, topCard, activeColor),
    true,
    "Wild card must always be playable"
  );

  console.log("   ✅ Color and number matching validation passed!");
}

// ====================================================
// 3. Action Cards Resolution: Skip, Reverse, +2 Draw Two
// ====================================================
console.log("\n3️⃣ Testing Action Cards Resolution (Skip, Reverse, +2 Draw Two)...");
{
  const turnOrder = ["p1", "p2", "p3"];

  // 3a. Testing Skip (⊘)
  const uno = initializeUnoGame(turnOrder);
  uno.topCard = {
    id: "top_blue",
    color: "BLUE",
    value: "5",
    label: "5",
    labelAr: "أزرق 5",
    symbol: "5"
  };
  uno.activeColor = "BLUE";

  const skipCard: UnoCard = {
    id: "p1_skip",
    color: "BLUE",
    value: "SKIP",
    label: "⊘",
    labelAr: "أزرق تخطي",
    symbol: "⊘"
  };
  uno.playerHands["p1"] = [skipCard, { id: "p1_extra", color: "RED", value: "1", label: "1", labelAr: "أحمر 1", symbol: "1" }];

  const skipResult = executePlayUnoCard(uno, turnOrder, 0, "p1", skipCard.id);
  // Current index was 0 (p1), direction 1, skips p2 (idx 1), next turn must be p3 (idx 2)!
  assert.strictEqual(skipResult.nextTurnIndex, 2, "Skip must advance turn by 2 steps, skipping p2");
  assert.strictEqual(uno.topCard.value, "SKIP", "Top card should be Skip");
  console.log("   ✅ Skip action card passed!");

  // 3b. Testing Reverse (⇄) in 3 players
  const reverseCard: UnoCard = {
    id: "p3_rev",
    color: "BLUE",
    value: "REVERSE",
    label: "⇄",
    labelAr: "أزرق عكس الاتجاه",
    symbol: "⇄"
  };
  uno.playerHands["p3"] = [reverseCard, { id: "p3_extra", color: "RED", value: "2", label: "2", labelAr: "أحمر 2", symbol: "2" }];

  const revResult = executePlayUnoCard(uno, turnOrder, 2, "p3", reverseCard.id);
  assert.strictEqual(uno.direction, -1, "Direction must be reversed to counter-clockwise (-1)");
  // From p3 (idx 2), in reverse direction (-1), next player is p2 (idx 1)
  assert.strictEqual(revResult.nextTurnIndex, 1, "Next player in reverse direction should be p2");
  console.log("   ✅ Reverse in 3-player match passed!");

  // 3c. Testing Reverse (⇄) in 2 players (acts as Skip)
  const uno2P = initializeUnoGame(["p1", "p2"]);
  uno2P.topCard = { id: "t_yellow", color: "YELLOW", value: "3", label: "3", labelAr: "أصفر 3", symbol: "3" };
  uno2P.activeColor = "YELLOW";
  const rev2P: UnoCard = { id: "p1_rev_2p", color: "YELLOW", value: "REVERSE", label: "⇄", labelAr: "أصفر عكس", symbol: "⇄" };
  uno2P.playerHands["p1"] = [rev2P, { id: "p1_extra2", color: "RED", value: "4", label: "4", labelAr: "أحمر 4", symbol: "4" }];

  const rev2PResult = executePlayUnoCard(uno2P, ["p1", "p2"], 0, "p1", rev2P.id);
  assert.strictEqual(rev2PResult.nextTurnIndex, 0, "In 2 players, Reverse must act as Skip, keeping turn with p1");
  console.log("   ✅ Reverse in 2-player match acts as Skip passed!");

  // 3d. Testing Draw Two (+2)
  const drawTwoCard: UnoCard = {
    id: "p1_plus2",
    color: "YELLOW",
    value: "DRAW_TWO",
    label: "+2",
    labelAr: "أصفر +2",
    symbol: "+2"
  };
  uno2P.playerHands["p1"] = [drawTwoCard, { id: "p1_extra3", color: "BLUE", value: "9", label: "9", labelAr: "أزرق 9", symbol: "9" }];
  const p2CardsBefore = uno2P.playerHands["p2"].length;

  const plus2Result = executePlayUnoCard(uno2P, ["p1", "p2"], 0, "p1", drawTwoCard.id);
  assert.strictEqual(uno2P.playerHands["p2"].length, p2CardsBefore + 2, "Victim must draw 2 cards");
  assert.strictEqual(plus2Result.nextTurnIndex, 0, "Victim skips turn, next turn stays with p1 in 2-player match");
  console.log("   ✅ Draw Two (+2) attack & turn skip passed!");
}

// ====================================================
// 4. Wild & Wild Draw Four (+4) Color Selection
// ====================================================
console.log("\n4️⃣ Testing Wild & Wild Draw Four (+4) Color Selection...");
{
  const turnOrder = ["p1", "p2", "p3"];
  const uno = initializeUnoGame(turnOrder);
  uno.topCard = { id: "t_green", color: "GREEN", value: "9", label: "9", labelAr: "أخضر 9", symbol: "9" };
  uno.activeColor = "GREEN";

  // Regular Wild with Color Selection
  const wildCard: UnoCard = { id: "p1_wild", color: "WILD", value: "WILD", label: "★", labelAr: "جوكر", symbol: "★" };
  uno.playerHands["p1"] = [wildCard, { id: "p1_extra", color: "YELLOW", value: "2", label: "2", labelAr: "أصفر 2", symbol: "2" }];

  // Must reject if no color chosen
  assert.throws(
    () => executePlayUnoCard(uno, turnOrder, 0, "p1", wildCard.id, undefined),
    /يجب اختيار لون جديد/,
    "Wild must require choosing a color"
  );

  // Play Wild choosing BLUE
  const wildResult = executePlayUnoCard(uno, turnOrder, 0, "p1", wildCard.id, "BLUE");
  assert.strictEqual(uno.activeColor, "BLUE", "Active color must update to chosen color BLUE");
  assert.strictEqual(wildResult.nextTurnIndex, 1, "Turn advances to p2 after Wild");
  console.log("   ✅ Wild card color selection passed!");

  // Wild Draw Four (+4) on BLUE
  const wild4Card: UnoCard = { id: "p2_wild4", color: "WILD", value: "WILD_DRAW_FOUR", label: "+4", labelAr: "جوكر +4", symbol: "+4" };
  uno.playerHands["p2"] = [wild4Card, { id: "p2_extra", color: "RED", value: "5", label: "5", labelAr: "أحمر 5", symbol: "5" }];
  const p3CardsBefore = uno.playerHands["p3"].length;

  // Play +4 choosing YELLOW
  const wild4Result = executePlayUnoCard(uno, turnOrder, 1, "p2", wild4Card.id, "YELLOW");
  assert.strictEqual(uno.activeColor, "YELLOW", "Active color must update to chosen color YELLOW");
  assert.strictEqual(uno.playerHands["p3"].length, p3CardsBefore + 4, "Victim p3 must draw 4 cards");
  // p3 skips turn, so next turn index advances to p1 (index 0)
  assert.strictEqual(wild4Result.nextTurnIndex, 0, "Turn should advance past p3 to p1");
  console.log("   ✅ Wild Draw Four (+4) attack, color change & skip passed!");
}

// ====================================================
// 5. Drawing from Deck & Discard Pile Recycling
// ====================================================
console.log("\n5️⃣ Testing Drawing from Deck & Discard Pile Recycling...");
{
  const turnOrder = ["p1", "p2"];
  const uno = initializeUnoGame(turnOrder);
  uno.topCard = { id: "t_red", color: "RED", value: "0", label: "0", labelAr: "أحمر 0", symbol: "0" };
  uno.activeColor = "RED";

  // Give p1 a card that is not playable
  uno.playerHands["p1"] = [{ id: "p1_blue_9", color: "BLUE", value: "9", label: "9", labelAr: "أزرق 9", symbol: "9" }];

  // Put a blue 9 on top of deck (playable on p1's next turn if drawn) or red card
  uno.deck = [{ id: "deck_card", color: "YELLOW", value: "5", label: "5", labelAr: "أصفر 5", symbol: "5" }];

  // Draw non-matching card -> auto-advances turn
  const drawResult = executeDrawUnoCard(uno, turnOrder, 0, "p1");
  assert.strictEqual(uno.playerHands["p1"].length, 2, "Player should have 2 cards now");
  assert.strictEqual(drawResult.canPlayDrawnCard, false, "Yellow 5 on Red 0 cannot be played");
  assert.strictEqual(drawResult.nextTurnIndex, 1, "Non-playable draw advances turn to p2");
  console.log("   ✅ Draw non-playable card and auto-advance passed!");

  // Test Discard Pile Recycling when deck is exhausted
  uno.deck = [];
  uno.discardPile = [
    { id: "disc_1", color: "RED", value: "1", label: "1", labelAr: "أحمر 1", symbol: "1" },
    { id: "disc_2", color: "RED", value: "2", label: "2", labelAr: "أحمر 2", symbol: "2" },
    uno.topCard
  ];

  const recycleDraw = executeDrawUnoCard(uno, turnOrder, 1, "p2");
  assert.ok(recycleDraw.drawnCard, "Card should be drawn after recycling discard pile");
  assert.strictEqual(uno.discardPile.length, 1, "Discard pile must keep only top card");
  assert.strictEqual(uno.discardPile[0].id, uno.topCard.id, "Top card must remain on discard pile");
  console.log("   ✅ Empty deck recycle from discard pile passed!");

  // === Anti-exploit: one draw per turn, then only the drawn card or pass ===
  const drawOnce = initializeUnoGame(turnOrder);
  drawOnce.topCard = { id: "t_red", color: "RED", value: "0", label: "0", labelAr: "أحمر 0", symbol: "0" };
  drawOnce.activeColor = "RED";
  drawOnce.playerHands["p1"] = [
    { id: "held_red_7", color: "RED", value: "7", label: "7", labelAr: "أحمر 7", symbol: "7" }
  ];
  // deck draws from the end (pop)
  drawOnce.deck = [
    { id: "drawn_red_5", color: "RED", value: "5", label: "5", labelAr: "أحمر 5", symbol: "5" }
  ];

  const playableDraw = executeDrawUnoCard(drawOnce, turnOrder, 0, "p1");
  assert.strictEqual(playableDraw.canPlayDrawnCard, true, "Drawn red 5 must be playable on red 0");
  assert.strictEqual(playableDraw.nextTurnIndex, 0, "Playable draw keeps the turn with p1");
  assert.strictEqual(drawOnce.hasDrawnThisTurn, true, "hasDrawnThisTurn must be set after drawing");
  assert.strictEqual(drawOnce.drawnCardId, "drawn_red_5", "drawnCardId must track the drawn card");

  assert.throws(
    () => executeDrawUnoCard(drawOnce, turnOrder, 0, "p1"),
    /سحبت ورقة بالفعل/,
    "A player must not draw twice in the same turn"
  );

  assert.throws(
    () => executePlayUnoCard(drawOnce, turnOrder, 0, "p1", "held_red_7"),
    /بعد السحب/,
    "After drawing, only the drawn card may be played"
  );

  const passResult = executePassUnoAfterDraw(drawOnce, turnOrder, 0, "p1");
  assert.strictEqual(passResult.nextTurnIndex, 1, "Passing after draw advances to the next player");
  assert.strictEqual(drawOnce.hasDrawnThisTurn, false, "Passing clears the draw flag");
  assert.strictEqual(drawOnce.drawnCardId, undefined, "Passing clears the drawn card id");
  assert.strictEqual(drawOnce.playerHands["p1"].length, 2, "The drawn card stays in hand after passing");

  assert.throws(
    () => executePassUnoAfterDraw(drawOnce, turnOrder, 1, "p2"),
    /قبل سحب ورقة/,
    "Passing is not allowed before drawing"
  );
  console.log("   ✅ Draw-once-per-turn, drawn-card-only & pass-after-draw passed!");
}

// ====================================================
// 6. UNO Shout Button, Catch Penalty & Victory
// ====================================================
console.log("\n6️⃣ Testing UNO Shout, Catch Penalty & Victory Condition...");
{
  const turnOrder = ["p1", "p2"];

  // 6a. Penalty when forgetting to shout UNO:
  const unoNoShout = initializeUnoGame(turnOrder);
  unoNoShout.topCard = { id: "top_card", color: "RED", value: "4", label: "4", labelAr: "أحمر 4", symbol: "4" };
  unoNoShout.activeColor = "RED";

  const cardToPlay: UnoCard = { id: "play_red", color: "RED", value: "4", label: "4", labelAr: "أحمر 4", symbol: "4" };
  unoNoShout.playerHands["p1"] = [
    cardToPlay,
    { id: "stay_card", color: "BLUE", value: "1", label: "1", labelAr: "أزرق 1", symbol: "1" }
  ];
  unoNoShout.unoShouted["p1"] = false;

  const resultNoShout = executePlayUnoCard(unoNoShout, turnOrder, 0, "p1", cardToPlay.id);
  assert.strictEqual(resultNoShout.penaltyApplied, true, "Penalty must be applied when down to 1 card without shout");
  // Player had 2 cards, played 1 (left with 1), penalized with 2 -> total 3 cards!
  assert.strictEqual(unoNoShout.playerHands["p1"].length, 3, "Hand must have 3 cards after penalty");
  console.log("   ✅ UNO shout penalty (+2 cards) verified!");

  // 6b. Safe play when UNO is shouted beforehand:
  const unoWithShout = initializeUnoGame(turnOrder);
  unoWithShout.topCard = { id: "top_card", color: "RED", value: "4", label: "4", labelAr: "أحمر 4", symbol: "4" };
  unoWithShout.activeColor = "RED";
  unoWithShout.playerHands["p1"] = [
    cardToPlay,
    { id: "stay_card2", color: "BLUE", value: "1", label: "1", labelAr: "أزرق 1", symbol: "1" }
  ];

  // p1 shouts UNO!
  executeShoutUno(unoWithShout, "p1");
  assert.strictEqual(unoWithShout.unoShouted["p1"], true, "p1 UNO shout flag should be true");

  const resultWithShout = executePlayUnoCard(unoWithShout, turnOrder, 0, "p1", cardToPlay.id);
  assert.strictEqual(resultWithShout.penaltyApplied, false, "No penalty should apply after shouting UNO");
  assert.strictEqual(unoWithShout.playerHands["p1"].length, 1, "Player should safely remain on 1 card");
  console.log("   ✅ Shouted UNO safe transition to 1 card verified!");

  // 6c. Winning by playing last card:
  const winCard: UnoCard = { id: "win_card", color: "BLUE", value: "1", label: "1", labelAr: "أزرق 1", symbol: "1" };
  unoWithShout.topCard = { id: "top_blue_1", color: "BLUE", value: "8", label: "8", labelAr: "أزرق 8", symbol: "8" };
  unoWithShout.activeColor = "BLUE";
  unoWithShout.playerHands["p1"] = [winCard];

  const winResult = executePlayUnoCard(unoWithShout, turnOrder, 0, "p1", winCard.id);
  assert.strictEqual(winResult.isGameOver, true, "Game must be over when player runs out of cards");
  assert.strictEqual(winResult.winnerId, "p1", "p1 must be declared winner");
  assert.strictEqual(unoWithShout.winner, "p1", "unoState.winner must be set to p1");
  console.log("   ✅ Zero-cards win condition verified!");
}

// ====================================================
// 7. Smart Uno Bot AI Decision Engine
// ====================================================
console.log("\n7️⃣ Testing Smart Uno Bot AI Decisions...");
{
  const uno = initializeUnoGame(["bot1", "p2"]);
  uno.topCard = { id: "top_c", color: "GREEN", value: "5", label: "5", labelAr: "أخضر 5", symbol: "5" };
  uno.activeColor = "GREEN";

  // Bot hand has: Green 2, Green Draw Two, Wild, Yellow 9
  uno.playerHands["bot1"] = [
    { id: "b_num", color: "GREEN", value: "2", label: "2", labelAr: "أخضر 2", symbol: "2" },
    { id: "b_draw2", color: "GREEN", value: "DRAW_TWO", label: "+2", labelAr: "أخضر +2", symbol: "+2" },
    { id: "b_wild", color: "WILD", value: "WILD", label: "★", labelAr: "جوكر", symbol: "★" },
    { id: "b_yellow", color: "YELLOW", value: "9", label: "9", labelAr: "أصفر 9", symbol: "9" }
  ];

  const botMove = getBestUnoBotMove(uno, "bot1");
  assert.strictEqual(botMove.action, "PLAY", "Bot must choose to play a card");
  assert.strictEqual(botMove.cardId, "b_draw2", "Bot should prioritize action card DRAW_TWO to disrupt opponent");
  console.log("   ✅ Bot action card priority passed!");

  // Test Bot Dominant Color Selection on Wild
  uno.playerHands["bot1"] = [
    { id: "b_wild_only", color: "WILD", value: "WILD", label: "★", labelAr: "جوكر", symbol: "★" },
    { id: "b_blue1", color: "BLUE", value: "1", label: "1", labelAr: "أزرق 1", symbol: "1" },
    { id: "b_blue2", color: "BLUE", value: "3", label: "3", labelAr: "أزرق 3", symbol: "3" },
    { id: "b_red1", color: "RED", value: "8", label: "8", labelAr: "أحمر 8", symbol: "8" }
  ];
  uno.activeColor = "YELLOW"; // cannot play red or blue, must play wild
  uno.topCard = { id: "top_y", color: "YELLOW", value: "0", label: "0", labelAr: "أصفر 0", symbol: "0" };

  const botWildMove = getBestUnoBotMove(uno, "bot1");
  assert.strictEqual(botWildMove.cardId, "b_wild_only");
  assert.strictEqual(botWildMove.chosenColor, "BLUE", "Bot should pick dominant hand color (BLUE: 2 cards)");
  console.log("   ✅ Bot dominant hand color calculation on Wild passed!");

  // Test Bot auto-shout when on 2 cards playing down to 1
  uno.playerHands["bot1"] = [
    { id: "b_card_last1", color: "BLUE", value: "1", label: "1", labelAr: "أزرق 1", symbol: "1" },
    { id: "b_card_last2", color: "RED", value: "9", label: "9", labelAr: "أحمر 9", symbol: "9" }
  ];
  uno.activeColor = "BLUE";
  const botShoutMove = getBestUnoBotMove(uno, "bot1");
  assert.strictEqual(botShoutMove.shoutUno, true, "Bot must automatically shout UNO when left with 1 card");
  console.log("   ✅ Bot automatic UNO shout passed!");
}

// ====================================================
// 8. Privacy Filtering & Sanitization
// ====================================================
console.log("\n8️⃣ Testing Privacy Filtering & Sanitization...");
{
  const uno = initializeUnoGame(["p1", "p2"]);
  uno.playerHands["p1"] = [{ id: "c1", color: "RED", value: "1", label: "1", labelAr: "أحمر 1", symbol: "1" }];
  uno.playerHands["p2"] = [
    { id: "c2", color: "BLUE", value: "2", label: "2", labelAr: "أزرق 2", symbol: "2" },
    { id: "c3", color: "GREEN", value: "3", label: "3", labelAr: "أخضر 3", symbol: "3" }
  ];

  // Viewer is p1
  const p1View = sanitizeUnoStateForViewer(uno, "p1");
  assert.strictEqual(p1View.myHand.length, 1, "p1 sees their own hand");
  assert.strictEqual(p1View.myHand[0].id, "c1");
  assert.strictEqual(p1View.playerCardCounts["p1"], 1);
  assert.strictEqual(p1View.playerCardCounts["p2"], 2, "p1 sees p2's card count");
  assert.strictEqual((p1View as any).deck, undefined, "Deck cards must not be exposed");

  // Viewer is HOST
  const hostView = sanitizeUnoStateForViewer(uno, "HOST");
  assert.strictEqual(hostView.myHand.length, 0, "HOST myHand must be empty []");
  assert.strictEqual(hostView.playerCardCounts["p1"], 1);
  assert.strictEqual(hostView.playerCardCounts["p2"], 2);
  assert.ok(hostView.topCard, "HOST sees top card on table");
  console.log("   ✅ Privacy filtering for players and HOST passed!");
}

// ====================================================
// 9. Full Room Machine Integration
// ====================================================
console.log("\n9️⃣ Testing Full Room Machine Integration (BoardGameRoomMachine)...");
{
  const { machine, broadcasts } = createMockRoom();

  const unoPack = PRESET_PACKS.TACTICAL_CARDS_UNO;
  assert.ok(unoPack, "Preset TACTICAL_CARDS_UNO must exist");

  machine.startGameWithAIPack(unoPack);
  assert.ok(machine.state.unoState, "unoState must be initialized on machine");
  assert.strictEqual(machine.state.unoState.playerHands["p1"].length, 7);

  // Play a valid card through room machine
  const activePid = machine.getActivePlayerId();
  const activeHand = machine.state.unoState.playerHands[activePid];
  const playable = activeHand.find((c) =>
    canPlayUnoCard(c, machine.state.unoState!.topCard, machine.state.unoState!.activeColor)
  );

  if (playable) {
    const chosenColor = playable.color === "WILD" ? "RED" : undefined;
    machine.playUnoCard(activePid, playable.id, chosenColor);
    const cardPlayedBroadcast = broadcasts.find((b) => b.eventType === "UNO_CARD_PLAYED");
    assert.ok(cardPlayedBroadcast, "UNO_CARD_PLAYED broadcast must be emitted");
  } else {
    machine.drawUnoCard(activePid);
    const cardDrawnBroadcast = broadcasts.find((b) => b.eventType === "UNO_CARD_DRAWN");
    assert.ok(cardDrawnBroadcast, "UNO_CARD_DRAWN broadcast must be emitted");
  }

  // Shout UNO through machine when holding 2 cards
  machine.state.unoState!.playerHands["p1"] = [
    { id: "p1_last1", color: "RED", value: "1", label: "1", labelAr: "أحمر 1", symbol: "1" },
    { id: "p1_last2", color: "BLUE", value: "2", label: "2", labelAr: "أزرق 2", symbol: "2" }
  ];
  machine.shoutUno("p1");
  const unoShoutBroadcast = broadcasts.find((b) => b.eventType === "UNO_SHOUTED");
  assert.ok(unoShoutBroadcast, "UNO_SHOUTED broadcast must be emitted");

  console.log("   ✅ Room Machine play, draw and shout Uno integration passed!");
}

console.log("\n====================================================");
console.log("🎉 ALL 9 AUTHENTIC UNO & TACTICAL CARD TESTS PASSED 100%! 🎉");
console.log("====================================================");
