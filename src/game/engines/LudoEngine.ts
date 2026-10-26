import type { IGameEngine, GameType, VictoryCheckResult, EngineContext } from "./types";
import type { GeneratedSessionPack } from "../schema";
import { recordUserActionInStore } from "../behavioralDNA";
import {
  initLudoState,
  getEligibleTokensToMove,
  executeLudoMove,
  selectBestTokenForBot,
  type LudoMoveResult,
  type LudoState
} from "../ludoEngine";

export class LudoEngine implements IGameEngine {
  public readonly gameType: GameType = "LUDO";

  constructor(private ctx: EngineContext) {}

  public initialize(pack: GeneratedSessionPack): void {
    const s = this.ctx.state;
    s.isLudo = true;
    s.ludoState = initLudoState(s.turnOrder, s.players);
    s.rulesConfig = {
      turnMechanism: "DICE_AND_MOVE",
      cardVisibility: "NO_HAND_CARDS",
      ownershipSystem: "NONE"
    };
    s.winCondition = "FIRST_TO_FINISH";
    s.boardSize = 52;
  }

  public rollDice(playerId: string): void {
    const s = this.ctx.state;
    const player = s.players[playerId];
    if (!player || !s.ludoState) return;

    const ludoPlayer = s.ludoState.players[playerId];
    if (!ludoPlayer) {
      throw new Error("لاعب لودو غير موجود في الجلسة.");
    }

    const diceValue = Math.floor(Math.random() * 6) + 1;
    s.lastDiceRoll = {
      dice1: diceValue,
      dice2: diceValue,
      sum: diceValue,
      isDoubles: false
    };

    // Check 3 consecutive sixes penalty
    if (diceValue === 6) {
      s.ludoState.consecutiveSixes = (s.ludoState.consecutiveSixes || 0) + 1;
      if (s.ludoState.consecutiveSixes >= 3) {
        s.ludoState.consecutiveSixes = 0;
        s.ludoState.pendingDiceRoll = undefined;
        s.ludoState.eligibleTokenIds = [];
        this.ctx.broadcast("LUDO_THREE_SIXES_PENALTY", {
          playerId,
          messageAr: `حصل ${player.name} على نرد 6 ثلاث مرات متتالية! سقط دوره فوراً كعقوبة. ⛔`
        });
        this.ctx.advanceTurn();
        return;
      }
    } else {
      s.ludoState.consecutiveSixes = 0;
    }

    const eligible = getEligibleTokensToMove(ludoPlayer, diceValue);
    s.ludoState.pendingDiceRoll = diceValue;
    s.ludoState.eligibleTokenIds = eligible;

    this.ctx.broadcast("LUDO_DICE_ROLLED", {
      playerId,
      diceValue,
      eligibleTokenIds: eligible,
      consecutiveSixes: s.ludoState.consecutiveSixes
    });

    if (eligible.length === 0) {
      this.ctx.broadcast("LUDO_NO_MOVES", {
        playerId,
        diceValue,
        messageAr: `حصل ${player.name} على ${diceValue} لكن لا توجد قطع مؤهلة للحركة!`
      });
      s.ludoState.pendingDiceRoll = undefined;
      s.ludoState.eligibleTokenIds = [];
      this.ctx.advanceTurn();
      return;
    }

    this.ctx.syncState();
  }

  public moveLudoToken(playerId: string, tokenId: number): LudoMoveResult {
    const s = this.ctx.state;
    if (!s.ludoState) {
      throw new Error("حالة لودو غير موجودة.");
    }
    const diceRoll = s.ludoState.pendingDiceRoll;
    if (diceRoll === undefined) {
      throw new Error("يجب رمي النرد أولاً قبل تحريك القطعة!");
    }

    const moveResult = executeLudoMove(s.ludoState, playerId, tokenId, diceRoll);

    s.ludoState.pendingDiceRoll = undefined;
    s.ludoState.eligibleTokenIds = [];

    // Track capture in behavioral DNA
    if (moveResult.capturedToken) {
      const movingPlayer = s.players[playerId];
      if (movingPlayer?.userId) {
        recordUserActionInStore(movingPlayer.userId, "LUDO_CAPTURE", {
          targetPlayerId: moveResult.capturedToken.playerId,
          targetTokenId: moveResult.capturedToken.tokenId
        });
      }
    }

    this.ctx.broadcast("LUDO_TOKEN_MOVED", {
      playerId,
      tokenId,
      moveResult,
      ludoState: s.ludoState
    });

    // Check Victory
    const ludoPlayer = s.ludoState.players[playerId];
    if (ludoPlayer.finishedCount === 4) {
      const winnerPlayer = s.players[playerId];
      this.ctx.endGame({
        winner: winnerPlayer,
        reasonAr: "أوصل جميع قطعه الأربعة للمركز وحقق النصر!"
      });
      return moveResult;
    }

    // Award bonus turn on 6, on capture, or on reaching center
    if (moveResult.awardedBonusRoll) {
      this.ctx.broadcast("LUDO_BONUS_ROLL_AWARDED", {
        playerId,
        messageAr: moveResult.capturedToken
          ? `أكل ${s.players[playerId]?.name || ""} قطعة الخصم وحصل على رمية إضافية! 💥`
          : diceRoll === 6
          ? `رمية 6 تمنح ${s.players[playerId]?.name || ""} رمية إضافية! 🎲`
          : `إدخال القطعة للمركز يمنح ${s.players[playerId]?.name || ""} رمية إضافية! 🌟`
      });
      s.phase = "TURN_START";
      this.ctx.syncState();
    } else {
      this.ctx.advanceTurn();
    }

    return moveResult;
  }

  public checkVictory(): VictoryCheckResult {
    const s = this.ctx.state;
    if (!s.ludoState) return { isOver: false, reasonAr: "" };

    for (const player of Object.values(s.players)) {
      const ludoPlayer = s.ludoState.players[player.id];
      if (ludoPlayer && ludoPlayer.finishedCount === 4) {
        return {
          isOver: true,
          winner: player,
          reasonAr: "أوصل جميع قطعه الأربعة للمركز وحقق النصر!"
        };
      }
    }

    return { isOver: false, reasonAr: "" };
  }

  public executeBotTurn(botPlayerId: string): void {
    const s = this.ctx.state;
    if (!s.ludoState) return;

    if (s.ludoState.pendingDiceRoll !== undefined) {
      const ludoPlayer = s.ludoState.players[botPlayerId];
      if (ludoPlayer) {
        const bestTokenId = selectBestTokenForBot(
          ludoPlayer,
          s.ludoState.players,
          s.ludoState.pendingDiceRoll
        );
        if (bestTokenId !== null) {
          this.moveLudoToken(botPlayerId, bestTokenId);
        } else {
          this.ctx.advanceTurn();
        }
      }
    } else {
      this.rollDice(botPlayerId);
    }
  }
}
