import { BoardGameRoomMachine } from "./src/game/gameRoom";
import { getDefaultSessionPack } from "./src/game/aiPackGenerator";
import type { GameCard } from "./src/game/schema";

async function runTests() {
  console.log("🧪 Starting Edge Cases: Fair Voting Tie-Breaker & Hand Overflow Tests...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // --- Suite 1: Fair Voting Tie-Breaker ---
  try {
    const broadcasts: { type: string; payload: any }[] = [];
    const machine = new BoardGameRoomMachine("test_tie_1", (type, payload) => {
      broadcasts.push({ type, payload });
    });

    machine.joinPlayer("p1", "سعد", "#EF4444");
    machine.joinPlayer("p2", "فهد", "#3B82F6");
    machine.joinPlayer("p3", "نواف", "#22C55E");
    machine.joinPlayer("p4", "خالد", "#EAB308");

    const pack = getDefaultSessionPack(["سعد", "فهد", "نواف", "خالد"]);
    machine.startGameWithAIPack(pack);

    // Simulate entering VOTING phase with an active vote card
    const voteCard = pack.cardsDeck.find(c => c.category === "VOTE_CARD")!;
    machine.state.activeVoteCard = voteCard;
    machine.state.phase = "VOTING";
    machine.state.pendingVote = {
      isActive: true,
      penaltyValue: -60,
      votes: {}
    };

    // p1 votes for p2, p2 votes for p3, p3 votes for p2, p4 votes for p3
    // Result: p2 has 2 votes, p3 has 2 votes -> 2-way tie!
    machine.submitPlayerVote("p1", "p2");
    machine.submitPlayerVote("p2", "p3");
    machine.submitPlayerVote("p3", "p2");
    machine.submitPlayerVote("p4", "p3"); // All 4 players voted, triggers finalizeVoteSession()

    assert(machine.state.phase !== "VOTING", "Voting phase ended after all votes submitted");

    const voteEndEvent = broadcasts.find(b => b.type === "VOTE_SESSION_ENDED");
    assert(Boolean(voteEndEvent), "Broadcasted VOTE_SESSION_ENDED event");
    assert(voteEndEvent?.payload.isTie === true, "Payload indicates isTie: true");
    assert(
      Array.isArray(voteEndEvent?.payload.tiedCandidates) &&
      voteEndEvent?.payload.tiedCandidates.length === 2 &&
      voteEndEvent?.payload.tiedCandidates.includes("p2") &&
      voteEndEvent?.payload.tiedCandidates.includes("p3"),
      "Payload contains tiedCandidates ['p2', 'p3']"
    );

    const loserId = voteEndEvent?.payload.loserId;
    assert(loserId === "p2" || loserId === "p3", `Loser (${loserId}) is strictly chosen from tied candidates`);
    assert(machine.state.players[loserId].coins < 150, `Chosen loser (${loserId}) received the penalty deduction`);
  } catch (e: any) {
    assert(false, `Tie breaker test failed: ${e.message}`);
  }

  // --- Suite 2: Secret Hand Overflow Handling (Max 4 Cards) ---
  try {
    const broadcasts: { type: string; payload: any }[] = [];
    const machine = new BoardGameRoomMachine("test_hand_overflow", (type, payload) => {
      broadcasts.push({ type, payload });
    });

    machine.joinPlayer("p1", "أنس", "#EF4444");
    machine.joinPlayer("p2", "عمر", "#3B82F6");

    const pack = getDefaultSessionPack(["أنس", "عمر"]);
    machine.startGameWithAIPack(pack);

    const p1 = machine.state.players["p1"];
    const dummyCard: GameCard = {
      id: "card_dummy",
      title: "بطاقة تجريبية",
      category: "SECRET_HAND",
      flavorText: "وصف تجريبي",
      effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 10 }]
    };

    // Pre-populate player hand with 4 cards
    p1.secretHand = [
      { ...dummyCard, id: "c1" },
      { ...dummyCard, id: "c2" },
      { ...dummyCard, id: "c3" },
      { ...dummyCard, id: "c4" }
    ];

    // Find tile of type SECRET_CARD
    const secretTileIndex = machine.state.tiles.findIndex(t => t.tileType === "SECRET_CARD");
    p1.position = secretTileIndex;

    // Simulate landing on SECRET_CARD tile
    (machine as any).resolveLandedTile(p1, machine.state.tiles[secretTileIndex]);

    assert(p1.secretHand.length === 4, "Hand length stays capped at 4 cards, no 5th card added");

    const overflowEvent = broadcasts.find(b => b.type === "SECRET_HAND_FULL");
    assert(Boolean(overflowEvent), "Broadcasted SECRET_HAND_FULL event upon landing with full hand");
    assert(overflowEvent?.payload.playerId === "p1", "Overflow event identifies correct player");
    assert(
      typeof overflowEvent?.payload.messageAr === "string" &&
      overflowEvent.payload.messageAr.includes("ممتلئة"),
      "Overflow event contains clear Arabic notification"
    );
  } catch (e: any) {
    assert(false, `Hand overflow test failed: ${e.message}`);
  }

  // --- Suite 3: Normal Secret Card Draw with < 4 cards ---
  try {
    const broadcasts: { type: string; payload: any }[] = [];
    const machine = new BoardGameRoomMachine("test_hand_normal", (type, payload) => {
      broadcasts.push({ type, payload });
    });

    machine.joinPlayer("p1", "ياسين", "#EF4444");
    machine.joinPlayer("p2", "مالك", "#3B82F6");

    const pack = getDefaultSessionPack(["ياسين", "مالك"]);
    machine.startGameWithAIPack(pack);

    const p1 = machine.state.players["p1"];
    p1.secretHand = []; // Empty hand

    const secretTileIndex = machine.state.tiles.findIndex(t => t.tileType === "SECRET_CARD");
    p1.position = secretTileIndex;

    (machine as any).resolveLandedTile(p1, machine.state.tiles[secretTileIndex]);

    assert(p1.secretHand.length === 1, "Player with empty hand draws 1 card successfully");
    const drawnEvent = broadcasts.find(b => b.type === "SECRET_CARD_DRAWN");
    assert(Boolean(drawnEvent), "Broadcasted normal SECRET_CARD_DRAWN event");
  } catch (e: any) {
    assert(false, `Normal card draw test failed: ${e.message}`);
  }

  console.log(`\n================================`);
  console.log(`Total Passed: ${passed}`);
  console.log(`Total Failed: ${failed}`);
  console.log(`================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
