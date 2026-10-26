import { ActionTypeEnum, TargetTypeEnum, TileTypeEnum, AtomicEffectSchema, GameCardSchema, BoardTileSchema, GeneratedSessionPackSchema, type GeneratedSessionPack } from "./src/game/schema";
import { executeCardEffects, type GameRoomState, type PlayerState } from "./src/game/effectEngine";
import { BoardGameRoomMachine } from "./src/game/gameRoom";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASS: ${message}`);
}

function createBaseState(): GameRoomState {
  const p1: PlayerState = {
    id: "p1",
    name: "سارة",
    color: "#ff0000",
    coins: 100,
    position: 0,
    hasShield: false,
    skipNextTurn: false,
    stats: { coinsStolen: 0, timesBetrayedBy: {}, shieldsTriggered: 0 }
  };
  const p2: PlayerState = {
    id: "p2",
    name: "خالد",
    color: "#00ff00",
    coins: 200,
    position: 5,
    hasShield: false,
    skipNextTurn: false,
    stats: { coinsStolen: 0, timesBetrayedBy: {}, shieldsTriggered: 0 }
  };
  const p3: PlayerState = {
    id: "p3",
    name: "فهد",
    color: "#0000ff",
    coins: 50,
    position: 10,
    hasShield: false,
    skipNextTurn: false,
    stats: { coinsStolen: 0, timesBetrayedBy: {}, shieldsTriggered: 0 }
  };

  return {
    roomId: "test-room",
    boardSize: 20,
    passStartBonus: 100,
    currencyName: "دينار",
    players: { p1, p2, p3 }
  };
}

function createMockSessionPack(): GeneratedSessionPack {
  const tiles = Array.from({ length: 20 }, (_, i) => ({
    index: i,
    tileType: (i === 0 ? "START" : (i === 7 || i === 15) ? "GLOBAL_VOTE" : i % 3 === 0 ? "HAZARD" : i % 2 === 0 ? "RESOURCE" : "SECRET_CARD") as any,
    name: `مربع ${i}`,
    description: `وصف المربع ${i}`,
    defaultEffect: i === 2 ? { actionType: "MODIFY_COINS" as const, targetType: "SELF" as const, value: 30 } : undefined
  }));

  const cardsDeck = Array.from({ length: 18 }, (_, i) => ({
    id: `card-${i}`,
    title: `بطاقة ${i}`,
    category: (i % 3 === 0 ? "SECRET_HAND" : i % 3 === 1 ? "PUBLIC_DRAMA" : "VOTE_CARD") as any,
    flavorText: `نص ساخر للبطاقة ${i}`,
    effects: i % 3 === 2
      ? [{ actionType: "VOTE_PENALTY" as const, targetType: "ALL_OTHERS" as const, value: -50 }]
      : [{ actionType: "MODIFY_COINS" as const, targetType: "SELF" as const, value: 40 }]
  }));

  return {
    themeTitle: "ليلة الغدر السيبراني",
    visualStyle: "CYBERPUNK",
    archetype: "PARTY_ECONOMY",
    rulesConfig: {
      turnMechanism: "DICE_AND_MOVE",
      cardVisibility: "SECRET_PHONE_ONLY",
      ownershipSystem: "NONE"
    },
    winCondition: "MOST_COINS",
    currencyName: "دينار",
    narratorIntro: "مرحباً بكم في أقوى جلسة تحدي!",
    tiles,
    cardsDeck
  };
}

async function runAllTests() {
  console.log("=== STARTING GAME ENGINE TESTS ===");

  // ==========================================
  // Section 1: Schema & Enums Verification
  // ==========================================
  console.log("\n--- Section 1: Schema & Enums ---");
  const expectedActions = [
    "MODIFY_COINS",
    "STEAL_COINS",
    "MOVE_STEPS",
    "SWAP_POSITIONS",
    "SKIP_TURN",
    "GRANT_SHIELD",
    "TAX_PERCENTAGE",
    "VOTE_PENALTY"
  ];
  assert(ActionTypeEnum.options.length === 8, "ActionTypeEnum has exactly 8 actions");
  for (const action of expectedActions) {
    assert(ActionTypeEnum.options.includes(action as any), `ActionTypeEnum contains ${action}`);
  }

  const expectedTargets = [
    "SELF",
    "CHOSEN_PLAYER",
    "RICHEST_PLAYER",
    "POOREST_PLAYER",
    "RANDOM_OTHER",
    "ALL_OTHERS"
  ];
  assert(TargetTypeEnum.options.length === 6, "TargetTypeEnum has exactly 6 target types");
  for (const target of expectedTargets) {
    assert(TargetTypeEnum.options.includes(target as any), `TargetTypeEnum contains ${target}`);
  }

  const expectedTileTypes = [
    "START",
    "RESOURCE",
    "HAZARD",
    "SECRET_CARD",
    "DRAMA_EVENT",
    "GLOBAL_VOTE"
  ];
  assert(TileTypeEnum.options.length === 6, "TileTypeEnum has exactly 6 tile types");
  for (const tt of expectedTileTypes) {
    assert(TileTypeEnum.options.includes(tt as any), `TileTypeEnum contains ${tt}`);
  }

  // Zod validation check
  const validEffect = AtomicEffectSchema.safeParse({ actionType: "MODIFY_COINS", targetType: "SELF", value: 50 });
  assert(validEffect.success, "AtomicEffectSchema parses valid effect");
  const invalidEffect = AtomicEffectSchema.safeParse({ actionType: "INVALID_ACTION", targetType: "SELF", value: 50 });
  assert(!invalidEffect.success, "AtomicEffectSchema rejects invalid action");

  // ==========================================
  // Section 2: Target Types Resolution
  // ==========================================
  console.log("\n--- Section 2: Target Types Resolution ---");
  {
    // SELF
    const s = createBaseState();
    executeCardEffects(s, [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 10 }], { sourcePlayerId: "p1" });
    assert(s.players.p1.coins === 110 && s.players.p2.coins === 200, "Target SELF targets only source player");

    // CHOSEN_PLAYER (explicit)
    executeCardEffects(s, [{ actionType: "MODIFY_COINS", targetType: "CHOSEN_PLAYER", value: 20 }], { sourcePlayerId: "p1", chosenTargetId: "p2" });
    assert(s.players.p2.coins === 220, "Target CHOSEN_PLAYER targets chosen player (p2)");

    // CHOSEN_PLAYER (fallback when chosenTargetId missing)
    const sFallback = createBaseState();
    executeCardEffects(sFallback, [{ actionType: "MODIFY_COINS", targetType: "CHOSEN_PLAYER", value: 15 }], { sourcePlayerId: "p1" });
    const p2Changed = sFallback.players.p2.coins !== 200;
    const p3Changed = sFallback.players.p3.coins !== 50;
    assert((p2Changed || p3Changed) && !(p2Changed && p3Changed) && sFallback.players.p1.coins === 100, "Target CHOSEN_PLAYER falls back to a random other player when no target chosen");

    // RICHEST_PLAYER
    const sRichest = createBaseState();
    // p2 has 200, p1 has 100, p3 has 50. Richest is p2.
    executeCardEffects(sRichest, [{ actionType: "MODIFY_COINS", targetType: "RICHEST_PLAYER", value: -50 }], { sourcePlayerId: "p1" });
    assert(sRichest.players.p2.coins === 150, "Target RICHEST_PLAYER accurately targets p2");

    // POOREST_PLAYER
    const sPoorest = createBaseState();
    // Poorest is p3 (50 coins)
    executeCardEffects(sPoorest, [{ actionType: "MODIFY_COINS", targetType: "POOREST_PLAYER", value: 25 }], { sourcePlayerId: "p1" });
    assert(sPoorest.players.p3.coins === 75, "Target POOREST_PLAYER accurately targets p3");

    // RANDOM_OTHER
    const sRandom = createBaseState();
    executeCardEffects(sRandom, [{ actionType: "MODIFY_COINS", targetType: "RANDOM_OTHER", value: 10 }], { sourcePlayerId: "p1" });
    const p2Hit = sRandom.players.p2.coins === 210;
    const p3Hit = sRandom.players.p3.coins === 60;
    assert((p2Hit || p3Hit) && !(p2Hit && p3Hit) && sRandom.players.p1.coins === 100, "Target RANDOM_OTHER targets one of other players and never source");

    // ALL_OTHERS
    const sAllOthers = createBaseState();
    executeCardEffects(sAllOthers, [{ actionType: "MODIFY_COINS", targetType: "ALL_OTHERS", value: -20 }], { sourcePlayerId: "p1" });
    assert(sAllOthers.players.p1.coins === 100 && sAllOthers.players.p2.coins === 180 && sAllOthers.players.p3.coins === 30, "Target ALL_OTHERS targets all players except source");
  }

  // ==========================================
  // Section 3: All 8 Atomic Actions & Edge Cases
  // ==========================================
  console.log("\n--- Section 3: Action Execution & Edge Cases ---");
  {
    // Action 1: MODIFY_COINS (gain & clamp at 0 min)
    const s = createBaseState();
    executeCardEffects(s, [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 50 }], { sourcePlayerId: "p1" });
    assert(s.players.p1.coins === 150, "MODIFY_COINS adds coins correctly (100 -> 150)");

    // Test clamp at 0
    executeCardEffects(s, [{ actionType: "MODIFY_COINS", targetType: "SELF", value: -300 }], { sourcePlayerId: "p1" });
    assert(s.players.p1.coins === 0, "MODIFY_COINS clamps coin balance at 0 minimum (150 - 300 => 0)");

    // Action 2: STEAL_COINS (sufficient vs insufficient victim balance)
    const sSteal = createBaseState();
    // p1 steals 30 from p2 (p2 has 200)
    executeCardEffects(sSteal, [{ actionType: "STEAL_COINS", targetType: "CHOSEN_PLAYER", value: 30 }], { sourcePlayerId: "p1", chosenTargetId: "p2" });
    assert(sSteal.players.p1.coins === 130 && sSteal.players.p2.coins === 170, "STEAL_COINS transfers exact requested coins when victim has enough");
    assert(sSteal.players.p1.stats.coinsStolen === 30, "STEAL_COINS records stats.coinsStolen on source");
    assert(sSteal.players.p2.stats.timesBetrayedBy["p1"] === 1, "STEAL_COINS records victim timesBetrayedBy source");

    // Insufficient victim balance: p3 has 50 coins, p1 tries to steal 100
    executeCardEffects(sSteal, [{ actionType: "STEAL_COINS", targetType: "CHOSEN_PLAYER", value: 100 }], { sourcePlayerId: "p1", chosenTargetId: "p3" });
    assert(sSteal.players.p3.coins === 0, "STEAL_COINS clamps victim coins at 0 min when requested > balance");
    assert(sSteal.players.p1.coins === 180, "STEAL_COINS steals at most what victim owns (130 + 50 = 180)");
    assert(sSteal.players.p1.stats.coinsStolen === 80, "STEAL_COINS stats.coinsStolen updated with actual stolen amount (30 + 50 = 80)");

    // Action 3: MOVE_STEPS & Circular Modulo & passStartBonus
    const sMove = createBaseState();
    // Positive movement within board
    sMove.players.p1.position = 5;
    executeCardEffects(sMove, [{ actionType: "MOVE_STEPS", targetType: "SELF", value: 4 }], { sourcePlayerId: "p1" });
    assert(sMove.players.p1.position === 9 && sMove.players.p1.coins === 100, "MOVE_STEPS advances position forward (5 + 4 = 9)");

    // Circular modulo positive crossing start (index 0)
    sMove.players.p1.position = 18;
    executeCardEffects(sMove, [{ actionType: "MOVE_STEPS", targetType: "SELF", value: 5 }], { sourcePlayerId: "p1" });
    assert(sMove.players.p1.position === 3, "MOVE_STEPS circular modulo wraps around: (18 + 5) % 20 = 3");
    assert(sMove.players.p1.coins === 200, "passStartBonus (+100) triggers when rawNewPos (23) >= boardSize (20)");

    // Circular modulo negative movement
    sMove.players.p1.position = 2;
    executeCardEffects(sMove, [{ actionType: "MOVE_STEPS", targetType: "SELF", value: -5 }], { sourcePlayerId: "p1" });
    assert(sMove.players.p1.position === 17, "MOVE_STEPS negative steps wrap backward: ((2 - 5) % 20 + 20) % 20 = 17");
    assert(sMove.players.p1.coins === 200, "Negative MOVE_STEPS does NOT trigger passStartBonus");

    // Exact landing on start (rawNewPos === boardSize)
    sMove.players.p1.position = 16;
    executeCardEffects(sMove, [{ actionType: "MOVE_STEPS", targetType: "SELF", value: 4 }], { sourcePlayerId: "p1" });
    assert(sMove.players.p1.position === 0, "Landing exactly on START: (16 + 4) % 20 = 0");
    assert(sMove.players.p1.coins === 300, "passStartBonus triggers on exact start tile pass/land (rawNewPos 20 >= 20)");

    // Action 4: SWAP_POSITIONS
    const sSwap = createBaseState();
    sSwap.players.p1.position = 2;
    sSwap.players.p2.position = 14;
    executeCardEffects(sSwap, [{ actionType: "SWAP_POSITIONS", targetType: "CHOSEN_PLAYER", value: 0 }], { sourcePlayerId: "p1", chosenTargetId: "p2" });
    assert(sSwap.players.p1.position === 14 && sSwap.players.p2.position === 2, "SWAP_POSITIONS swaps player positions accurately");
    assert(sSwap.players.p2.stats.timesBetrayedBy["p1"] === 1, "SWAP_POSITIONS records betrayal on swapped target");

    // Swap with self should do nothing
    executeCardEffects(sSwap, [{ actionType: "SWAP_POSITIONS", targetType: "SELF", value: 0 }], { sourcePlayerId: "p1" });
    assert(sSwap.players.p1.position === 14, "SWAP_POSITIONS with self does not change position");

    // Action 5: SKIP_TURN
    const sSkip = createBaseState();
    executeCardEffects(sSkip, [{ actionType: "SKIP_TURN", targetType: "CHOSEN_PLAYER", value: 1 }], { sourcePlayerId: "p1", chosenTargetId: "p2" });
    assert(sSkip.players.p2.skipNextTurn === true, "SKIP_TURN sets target skipNextTurn to true");

    // Action 6: GRANT_SHIELD
    const sShield = createBaseState();
    executeCardEffects(sShield, [{ actionType: "GRANT_SHIELD", targetType: "SELF", value: 1 }], { sourcePlayerId: "p1" });
    assert(sShield.players.p1.hasShield === true, "GRANT_SHIELD sets hasShield = true on target");

    // Action 7: TAX_PERCENTAGE
    const sTax = createBaseState();
    // p2 has 200 coins. Tax 25% => 50 coins.
    executeCardEffects(sTax, [{ actionType: "TAX_PERCENTAGE", targetType: "CHOSEN_PLAYER", value: 25 }], { sourcePlayerId: "p1", chosenTargetId: "p2" });
    assert(sTax.players.p2.coins === 150, "TAX_PERCENTAGE deducts 25% from 200 coins = 150 coins");

    // Tax percentage clamp: > 100% is clamped to 100%
    executeCardEffects(sTax, [{ actionType: "TAX_PERCENTAGE", targetType: "CHOSEN_PLAYER", value: 150 }], { sourcePlayerId: "p1", chosenTargetId: "p2" });
    assert(sTax.players.p2.coins === 0, "TAX_PERCENTAGE clamps at 100% max, reducing balance to 0");

    // Action 8: VOTE_PENALTY (Phase 1 & Phase 2)
    const sVote = createBaseState();
    // Phase 1: Initiation
    const voteEvents1 = executeCardEffects(sVote, [{ actionType: "VOTE_PENALTY", targetType: "ALL_OTHERS", value: -70 }], { sourcePlayerId: "p1" });
    assert(sVote.pendingVote !== undefined && sVote.pendingVote.isActive === true, "VOTE_PENALTY Phase 1 activates pendingVote");
    assert(sVote.pendingVote?.penaltyValue === -70, "VOTE_PENALTY sets penaltyValue correctly (-70)");
    assert(voteEvents1[0].type === "START_VOTE", "VOTE_PENALTY Phase 1 emits START_VOTE animation event");

    // Phase 2: Resolution
    const voteEvents2 = executeCardEffects(sVote, [{ actionType: "VOTE_PENALTY", targetType: "ALL_OTHERS", value: -70 }], { sourcePlayerId: "p1", votedLoserId: "p2" });
    assert(sVote.players.p2.coins === 130, "VOTE_PENALTY Phase 2 deducts 70 coins from loser p2 (200 - 70 = 130)");
    assert(sVote.pendingVote === undefined, "VOTE_PENALTY Phase 2 clears pendingVote");
    assert(voteEvents2[0].type === "COIN_CHANGE", "VOTE_PENALTY Phase 2 emits COIN_CHANGE event");

    // VOTE_PENALTY clamp at 0
    sVote.players.p3.coins = 40;
    executeCardEffects(sVote, [{ actionType: "VOTE_PENALTY", targetType: "ALL_OTHERS", value: -100 }], { sourcePlayerId: "p1", votedLoserId: "p3" });
    assert(sVote.players.p3.coins === 0, "VOTE_PENALTY clamps loser coins at 0 min (40 - 100 => 0)");
  }

  // ==========================================
  // Section 4: Shield Behavior (tryConsumeShield)
  // ==========================================
  console.log("\n--- Section 4: Shield Mechanics ---");
  {
    // 4.1 Hostile action is blocked and consumes shield
    const s1 = createBaseState();
    s1.players.p2.hasShield = true;
    s1.players.p2.coins = 200;
    const events1 = executeCardEffects(s1, [{ actionType: "MODIFY_COINS", targetType: "CHOSEN_PLAYER", value: -50 }], { sourcePlayerId: "p1", chosenTargetId: "p2" });
    assert(s1.players.p2.coins === 200, "Shield blocks hostile MODIFY_COINS (coins remain 200)");
    assert((s1.players.p2.hasShield as boolean) === false, "Shield is consumed after blocking");
    assert(s1.players.p2.stats.shieldsTriggered === 1, "shieldsTriggered stat incremented by 1");
    assert(events1.some(e => e.type === "SHIELD_BLOCK"), "SHIELD_BLOCK event emitted");

    // 4.2 Non-hostile action is NOT blocked, shield preserved
    const s2 = createBaseState();
    s2.players.p2.hasShield = true;
    s2.players.p2.coins = 200;
    const events2 = executeCardEffects(s2, [{ actionType: "MODIFY_COINS", targetType: "CHOSEN_PLAYER", value: 50 }], { sourcePlayerId: "p1", chosenTargetId: "p2" });
    assert(s2.players.p2.coins === 250, "Non-hostile MODIFY_COINS (+50) is applied");
    assert(s2.players.p2.hasShield === true, "Non-hostile action preserves shield");
    assert(s2.players.p2.stats.shieldsTriggered === 0, "shieldsTriggered not incremented on non-hostile action");

    // 4.3 Self hostile action is NOT blocked (player cannot shield own negative effects)
    const s3 = createBaseState();
    s3.players.p1.hasShield = true;
    s3.players.p1.coins = 100;
    executeCardEffects(s3, [{ actionType: "MODIFY_COINS", targetType: "SELF", value: -30 }], { sourcePlayerId: "p1" });
    assert(s3.players.p1.coins === 70, "Self negative effect is applied (100 - 30 = 70)");
    assert(s3.players.p1.hasShield === true, "Self negative effect does NOT consume own shield");

    // 4.4 All hostile action types trigger shield consumption:
    // STEAL_COINS
    const sSteal = createBaseState();
    sSteal.players.p2.hasShield = true;
    executeCardEffects(sSteal, [{ actionType: "STEAL_COINS", targetType: "CHOSEN_PLAYER", value: 50 }], { sourcePlayerId: "p1", chosenTargetId: "p2" });
    assert((sSteal.players.p2.hasShield as boolean) === false && sSteal.players.p2.coins === 200 && sSteal.players.p1.coins === 100, "Shield blocks STEAL_COINS completely");

    // MOVE_STEPS negative
    const sMoveNeg = createBaseState();
    sMoveNeg.players.p2.hasShield = true;
    sMoveNeg.players.p2.position = 5;
    executeCardEffects(sMoveNeg, [{ actionType: "MOVE_STEPS", targetType: "CHOSEN_PLAYER", value: -3 }], { sourcePlayerId: "p1", chosenTargetId: "p2" });
    assert((sMoveNeg.players.p2.hasShield as boolean) === false && sMoveNeg.players.p2.position === 5, "Shield blocks negative MOVE_STEPS");

    // SWAP_POSITIONS
    const sSwap = createBaseState();
    sSwap.players.p2.hasShield = true;
    sSwap.players.p1.position = 0;
    sSwap.players.p2.position = 8;
    executeCardEffects(sSwap, [{ actionType: "SWAP_POSITIONS", targetType: "CHOSEN_PLAYER", value: 0 }], { sourcePlayerId: "p1", chosenTargetId: "p2" });
    assert((sSwap.players.p2.hasShield as boolean) === false && sSwap.players.p1.position === 0 && sSwap.players.p2.position === 8, "Shield blocks SWAP_POSITIONS");

    // SKIP_TURN
    const sSkip = createBaseState();
    sSkip.players.p2.hasShield = true;
    executeCardEffects(sSkip, [{ actionType: "SKIP_TURN", targetType: "CHOSEN_PLAYER", value: 0 }], { sourcePlayerId: "p1", chosenTargetId: "p2" });
    assert((sSkip.players.p2.hasShield as boolean) === false && (sSkip.players.p2.skipNextTurn as boolean) === false, "Shield blocks SKIP_TURN");

    // TAX_PERCENTAGE
    const sTax = createBaseState();
    sTax.players.p2.hasShield = true;
    executeCardEffects(sTax, [{ actionType: "TAX_PERCENTAGE", targetType: "CHOSEN_PLAYER", value: 50 }], { sourcePlayerId: "p1", chosenTargetId: "p2" });
    assert((sTax.players.p2.hasShield as boolean) === false && sTax.players.p2.coins === 200, "Shield blocks TAX_PERCENTAGE");
  }

  // ==========================================
  // Section 5: BoardGameRoomMachine State & Lifecycle
  // ==========================================
  console.log("\n--- Section 5: BoardGameRoomMachine State & Lifecycle ---");
  {
    const broadcasts: Array<{ event: string; payload: any }> = [];
    const broadcastFn = (eventType: string, payload: Record<string, unknown>) => {
      broadcasts.push({ event: eventType, payload });
    };

    const room = new BoardGameRoomMachine("room-101", broadcastFn);

    // Join players
    room.joinPlayer("u1", "أحمد", "#ff0000");
    room.joinPlayer("u2", "سارة", "#00ff00");
    room.joinPlayer("u3", "عمر", "#0000ff");
    room.joinPlayer("u4", "نورة", "#ffff00");

    assert(Object.keys(room.state.players).length === 4, "Room has 4 joined players");
    assert(room.state.turnOrder.length === 4, "turnOrder has 4 player ids");
    assert(room.state.phase === "LOBBY", "Initial phase is LOBBY");

    // Start Game
    const pack = createMockSessionPack();
    room.startGameWithAIPack(pack);
    assert(room.state.phase === "TURN_START", "Phase changed to TURN_START after start");
    assert(room.getActivePlayerId() === "u1", "Active player starts as u1");
    assert(room.state.currentRound === 1, "Current round starts at 1");

    // 5.1 Test advanceTurn with skipNextTurn
    console.log("Testing skipNextTurn inside advanceTurn...");
    // Freeze u2
    room.state.players["u2"].skipNextTurn = true;

    // u1 completes turn by rolling dice
    room.rollDiceAndMove("u1");

    // u2 should be skipped! Active player should now be u3!
    assert((room.state.players["u2"].skipNextTurn as boolean) === false, "u2's skipNextTurn was reset to false");
    assert(room.getActivePlayerId() === "u3", "advanceTurn skipped frozen player u2 and advanced to u3");
    assert(broadcasts.some(b => b.event === "TURN_SKIPPED" && b.payload.playerId === "u2"), "TURN_SKIPPED event was broadcast for u2");

    // 5.2 Test Voting Lifecycle: submitPlayerVote & finalizeVoteSession
    console.log("Testing submitPlayerVote and vote resolution...");
    // Set up a vote scenario manually
    room.state.phase = "VOTING";
    const voteCard = {
      id: "vc-1",
      title: "محاكمة الشلة",
      category: "VOTE_CARD" as const,
      flavorText: "صوتوا ضد أكبر خائن ليخسر 80 دينار!",
      effects: [{ actionType: "VOTE_PENALTY" as const, targetType: "ALL_OTHERS" as const, value: -80 }]
    };
    room.state.activeVoteCard = voteCard;
    room.state.pendingVote = {
      isActive: true,
      penaltyValue: -80,
      votes: {}
    };

    // u1 votes for u3
    room.submitPlayerVote("u1", "u3");
    assert(room.state.pendingVote.votes["u1"] === "u3", "u1 vote recorded for u3");
    assert(room.state.phase === "VOTING", "Still in VOTING phase after 1 vote");

    // u2 votes for u3
    room.submitPlayerVote("u2", "u3");
    assert(room.state.phase === "VOTING", "Still in VOTING phase after 2 votes");

    // u4 votes for u3
    room.submitPlayerVote("u4", "u3");
    assert(room.state.phase === "VOTING", "Still in VOTING phase after 3 votes");

    // u3 votes for u1 (4th vote = connectedCount 4 => triggers finalizeVoteSession immediately)
    const prevCoinsU3 = room.state.players["u3"].coins;
    room.submitPlayerVote("u3", "u1");

    // Vote ended
    assert(room.state.activeVoteCard === undefined, "activeVoteCard cleared after vote finalization");
    assert(room.state.pendingVote === undefined, "pendingVote cleared after vote finalization");
    assert(room.state.players["u3"].coins === Math.max(0, prevCoinsU3 - 80), "Vote loser u3 suffered penalty of 80 coins");

    const voteEndBroadcast = broadcasts.find(b => b.event === "VOTE_SESSION_ENDED");
    assert(voteEndBroadcast !== undefined, "VOTE_SESSION_ENDED event broadcasted");
    assert(voteEndBroadcast?.payload.loserId === "u3", "VOTE_SESSION_ENDED correctly identified u3 as loser");
    assert(voteEndBroadcast?.payload.tally["u3"] === 3, "VOTE_SESSION_ENDED tally shows 3 votes for u3");

    // 5.3 Test Wrapped / End-Game Titles generation
    console.log("Testing generateEndGameTitles with distinct categories...");
    // u1: Richest only (coins 600, stolen 0, betrayals 0, shields 0)
    room.state.players["u1"].coins = 600;
    room.state.players["u1"].stats.coinsStolen = 0;
    room.state.players["u1"].stats.timesBetrayedBy = {};
    room.state.players["u1"].stats.shieldsTriggered = 0;

    // u2: Biggest Thief only (coins 150, stolen 95, betrayals 0, shields 0)
    room.state.players["u2"].coins = 150;
    room.state.players["u2"].stats.coinsStolen = 95;
    room.state.players["u2"].stats.timesBetrayedBy = {};
    room.state.players["u2"].stats.shieldsTriggered = 0;

    // u3: Most Betrayed only (coins 80, stolen 0, betrayals 4, shields 0)
    room.state.players["u3"].coins = 80;
    room.state.players["u3"].stats.coinsStolen = 0;
    room.state.players["u3"].stats.timesBetrayedBy = { u1: 2, u2: 2 };
    room.state.players["u3"].stats.shieldsTriggered = 0;

    // u4: Shield Master only (coins 100, stolen 0, betrayals 0, shields 6)
    room.state.players["u4"].coins = 100;
    room.state.players["u4"].stats.coinsStolen = 0;
    room.state.players["u4"].stats.timesBetrayedBy = {};
    room.state.players["u4"].stats.shieldsTriggered = 6;

    const titles = (room as any).generateEndGameTitles();

    assert(titles["u1"] !== undefined && titles["u1"].title === "وزير المالية 💰", "u1 awarded وزير المالية 💰");
    assert(titles["u1"].stat === `600 ${room.state.currencyName}`, "u1 stat format verified");

    assert(titles["u2"] !== undefined && titles["u2"].title === "الثعلب الماكر 🦊", "u2 awarded الثعلب الماكر 🦊");
    assert(titles["u2"].stat === `سرق 95 ${room.state.currencyName}`, "u2 stat format verified");

    assert(titles["u3"] !== undefined && titles["u3"].title === "الضحية المفضلة 🎯", "u3 awarded الضحية المفضلة 🎯");
    assert(titles["u3"].stat === "تعرض للغدر 4 مرات", "u3 stat format verified");

    assert(titles["u4"] !== undefined && titles["u4"].title === "الحصن المنيع 🛡️", "u4 awarded الحصن المنيع 🛡️");
    assert(titles["u4"].stat === "صد 6 هجمات", "u4 stat format verified");

    // Test edge-case: Overwrite behavior when 1 player qualifies for multiple titles
    room.state.players["u1"].stats.coinsStolen = 200; // u1 is now both richest and biggest thief
    const titlesOverwrite = (room as any).generateEndGameTitles();
    assert(titlesOverwrite["u1"].title === "الثعلب الماكر 🦊", "Titles keyed by player ID correctly documents that thief overwrites richest when 1 player leads both");

    // 5.4 Test Game Over trigger via authentic victory condition
    console.log("Testing Game Over transition via authentic victory condition...");
    room.state.winCondition = "FIRST_TO_FINISH";
    room.state.players["u1"].position = room.state.boardSize - 1;

    (room as any).advanceTurn();
    assert((room.state.phase as string) === "GAME_OVER", "Phase transitioned to GAME_OVER when authentic victory condition is met");
    assert(broadcasts.some(b => b.event === "GAME_OVER"), "GAME_OVER event was broadcasted with winner and titles");
  }

  console.log("\n=========================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉");
  console.log("=========================================");
}

runAllTests().catch((err) => {
  console.error("FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});
