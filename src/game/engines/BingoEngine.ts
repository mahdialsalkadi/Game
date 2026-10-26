import type { IGameEngine, GameType, VictoryCheckResult, EngineContext } from "./types";
import type { GeneratedSessionPack } from "../schema";
import {
  BINGO_MAX_NUMBER,
  createBingoCard,
  describeCompletedLine,
  markBingoNumber,
  makeBingoCallDeck,
  bingoColumnLetter
} from "../bingoEngine";

export class BingoEngine implements IGameEngine {
  public readonly gameType: GameType = "BINGO";

  constructor(private ctx: EngineContext) {}

  public initialize(_pack: GeneratedSessionPack): void {
    const s = this.ctx.state;
    const cards = Object.fromEntries(
      s.turnOrder.map((playerId) => [playerId, createBingoCard()])
    );

    s.boardSize = BINGO_MAX_NUMBER;
    s.tiles = [];
    s.rulesConfig = {
      turnMechanism: "BINGO_CALL",
      cardVisibility: "OPEN_PUBLIC_CARDS",
      ownershipSystem: "NONE"
    };
    s.winCondition = "FIRST_TO_FINISH";
    s.bingoState = {
      cards,
      calledNumbers: []
    };

    for (const pid of s.turnOrder) {
      const player = s.players[pid];
      if (player) {
        player.position = 0;
        player.isBankrupt = false;
        player.isEliminated = false;
      }
    }
  }

  public callBingoNumber(playerId: string): void {
    const s = this.ctx.state;
    const state = s.bingoState;
    const caller = s.players[playerId];
    if (!state || !caller) {
      throw new Error("جلسة بينغو غير جاهزة.");
    }
    if (s.phase !== "TURN_START") {
      throw new Error("لا يمكن سحب كرة بينغو الآن.");
    }

    const remaining = makeBingoCallDeck().filter(
      (number) => !state.calledNumbers.includes(number)
    );

    if (remaining.length === 0) {
      this.ctx.endGame({
        reasonAr: "نفدت كرات البينغو دون اكتمال أي خط — تعادل! 🤝"
      });
      return;
    }

    const number = remaining[Math.floor(Math.random() * remaining.length)];
    state.calledNumbers.push(number);
    state.lastCalled = number;
    state.lastCallerId = playerId;

    for (const player of Object.values(s.players)) {
      const card = state.cards[player.id];
      if (card) markBingoNumber(card, number);
    }

    const lineWinner = s.turnOrder
      .map((id) => s.players[id])
      .find((player) => player && (state.cards[player.id]?.lines || 0) > 0);

    const lineLabel = lineWinner
      ? describeCompletedLine(state.cards[lineWinner.id].marked)
      : null;

    this.ctx.broadcast("BINGO_NUMBER_CALLED", {
      callerId: playerId,
      callerName: caller.name,
      number,
      letter: bingoColumnLetter(Math.min(4, Math.floor((number - 1) / 15))),
      calledNumbers: state.calledNumbers,
      cards: state.cards,
      winnerId: lineWinner?.id,
      winningLineAr: lineLabel,
      messageAr: lineWinner
        ? `بينغو! أكمل ${lineWinner.name} ${lineLabel || "خطاً"} وحسم اللعبة! 🎉`
        : `سحب ${caller.name} الكرة ${number}.`
    });

    if (lineWinner) {
      state.winnerId = lineWinner.id;
      state.winningLineAr = lineLabel || undefined;
      this.ctx.endGame({
        winner: lineWinner,
        reasonAr: `أكمل ${lineLabel || "أول خط"} في بطاقته وقال بينغو! 🎉`
      });
      return;
    }

    this.ctx.advanceTurn();
  }

  public checkVictory(): VictoryCheckResult {
    const s = this.ctx.state;
    const state = s.bingoState;
    if (!state?.winnerId) {
      return { isOver: false, reasonAr: "" };
    }

    return {
      isOver: true,
      winner: s.players[state.winnerId],
      reasonAr: `أكمل ${state.winningLineAr || "أول خط"} في بطاقته وقال بينغو! 🎉`
    };
  }

  public executeBotTurn(botPlayerId: string): void {
    this.callBingoNumber(botPlayerId);
  }
}
