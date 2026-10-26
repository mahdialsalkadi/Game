import type { IGameEngine, GameType, VictoryCheckResult, EngineContext } from "./types";
import type { GeneratedSessionPack } from "../schema";
import { recordUserActionInStore } from "../behavioralDNA";
import {
  initializeUnoGame,
  executePlayUnoCard,
  executeDrawUnoCard,
  executePassUnoAfterDraw,
  executeShoutUno,
  getBestUnoBotMove,
  type UnoActiveColor,
  type UnoState,
  type DrawCardResult
} from "../unoEngine";

export class UnoEngine implements IGameEngine {
  public readonly gameType: GameType = "UNO";

  constructor(private ctx: EngineContext) {}

  public initialize(pack: GeneratedSessionPack): void {
    const s = this.ctx.state;
    s.unoState = initializeUnoGame(s.turnOrder);
    s.rulesConfig = {
      turnMechanism: "CARD_PLAY_ONLY",
      cardVisibility: "SECRET_PHONE_ONLY",
      ownershipSystem: "NONE"
    };
    s.winCondition = "FIRST_TO_FINISH";
  }

  public playUnoCard(
    playerId: string,
    cardId: string,
    chosenColor?: UnoActiveColor
  ): void {
    const s = this.ctx.state;
    if (s.phase !== "TURN_START") {
      throw new Error(`الإجراء غير مسموح في المرحلة الحالية: ${s.phase}`);
    }
    if (!s.unoState) {
      throw new Error("لعبة أونو غير نشطة في هذه الغرفة!");
    }

    const playerNames = Object.fromEntries(
      Object.values(s.players).map((p) => [p.id, p.name])
    );

    const result = executePlayUnoCard(
      s.unoState,
      s.turnOrder,
      s.currentTurnIndex,
      playerId,
      cardId,
      chosenColor,
      playerNames
    );

    this.ctx.broadcast("UNO_CARD_PLAYED", {
      playerId,
      card: s.unoState.topCard,
      activeColor: s.unoState.activeColor,
      direction: s.unoState.direction,
      messageAr: result.messageAr,
      penaltyApplied: result.penaltyApplied,
      remainingCount: s.unoState.playerHands[playerId]?.length ?? 0
    });

    const player = s.players[playerId];
    if (player?.userId) {
      recordUserActionInStore(player.userId, "PLAY_SECRET_CARD", {
        cardId,
        chosenColor
      });
    }

    if (result.isGameOver) {
      this.ctx.endGame({
        winner: s.players[result.winnerId!],
        reasonAr: "تخلص من جميع أوراقه وصرخ أونو بنجاح!"
      });
      return;
    }

    s.currentTurnIndex = result.nextTurnIndex;
    s.phase = "TURN_START";
    this.ctx.broadcast("TURN_CHANGED", {
      activePlayerId: this.ctx.getActivePlayerId(),
      currentRound: s.currentRound
    });

    this.ctx.syncState();
  }

  public drawUnoCard(playerId: string): DrawCardResult | undefined {
    const s = this.ctx.state;
    if (s.phase !== "TURN_START") {
      throw new Error(`الإجراء غير مسموح في المرحلة الحالية: ${s.phase}`);
    }
    if (!s.unoState) {
      throw new Error("لعبة أونو غير نشطة في هذه الغرفة!");
    }

    const playerNames = Object.fromEntries(
      Object.values(s.players).map((p) => [p.id, p.name])
    );

    const result = executeDrawUnoCard(
      s.unoState,
      s.turnOrder,
      s.currentTurnIndex,
      playerId,
      playerNames
    );

    this.ctx.broadcast("UNO_CARD_DRAWN", {
      playerId,
      canPlayDrawnCard: result.canPlayDrawnCard,
      messageAr: result.messageAr,
      cardCount: s.unoState.playerHands[playerId]?.length ?? 0
    });

    const player = s.players[playerId];
    if (player?.userId) {
      recordUserActionInStore(player.userId, "DRAW_CARD", {
        cardId: result.drawnCard.id
      });
    }

    if (!result.canPlayDrawnCard) {
      s.currentTurnIndex = result.nextTurnIndex;
      s.phase = "TURN_START";
      this.ctx.broadcast("TURN_CHANGED", {
        activePlayerId: this.ctx.getActivePlayerId(),
        currentRound: s.currentRound
      });
    }

    this.ctx.syncState();
    return result;
  }

  /** تمرير الدور بعد سحب ورقة قابلة للعب والاحتفاظ بها. */
  public passUnoAfterDraw(playerId: string): void {
    const s = this.ctx.state;
    if (s.phase !== "TURN_START") {
      throw new Error(`الإجراء غير مسموح في المرحلة الحالية: ${s.phase}`);
    }
    if (!s.unoState) {
      throw new Error("لعبة أونو غير نشطة في هذه الغرفة!");
    }

    const playerNames = Object.fromEntries(
      Object.values(s.players).map((p) => [p.id, p.name])
    );

    const result = executePassUnoAfterDraw(
      s.unoState,
      s.turnOrder,
      s.currentTurnIndex,
      playerId,
      playerNames
    );

    this.ctx.broadcast("UNO_TURN_PASSED", {
      playerId,
      messageAr: result.messageAr
    });

    s.currentTurnIndex = result.nextTurnIndex;
    s.phase = "TURN_START";
    this.ctx.broadcast("TURN_CHANGED", {
      activePlayerId: this.ctx.getActivePlayerId(),
      currentRound: s.currentRound
    });

    this.ctx.syncState();
  }

  public shoutUno(playerId: string): void {
    const s = this.ctx.state;
    if (!s.unoState) {
      throw new Error("لعبة أونو غير نشطة في هذه الغرفة!");
    }

    const playerNames = Object.fromEntries(
      Object.values(s.players).map((p) => [p.id, p.name])
    );

    const messageAr = executeShoutUno(
      s.unoState,
      playerId,
      playerNames
    );

    this.ctx.broadcast("UNO_SHOUTED", {
      playerId,
      messageAr
    });

    this.ctx.syncState();
  }

  public checkVictory(): VictoryCheckResult {
    const s = this.ctx.state;
    if (!s.unoState) return { isOver: false, reasonAr: "" };

    for (const player of Object.values(s.players)) {
      const hand = s.unoState.playerHands[player.id];
      if (hand && hand.length === 0) {
        return {
          isOver: true,
          winner: player,
          reasonAr: "تخلص من جميع أوراقه وصرخ أونو بنجاح!"
        };
      }
    }

    return { isOver: false, reasonAr: "" };
  }

  public executeBotTurn(botPlayerId: string): void {
    const s = this.ctx.state;
    if (!s.unoState) return;

    const botMove = getBestUnoBotMove(s.unoState, botPlayerId);
    if (botMove.shoutUno) {
      try {
        this.shoutUno(botPlayerId);
      } catch {}
    }

    if (botMove.action === "PLAY" && botMove.cardId) {
      this.playUnoCard(botPlayerId, botMove.cardId, botMove.chosenColor);
      return;
    }

    const drawResult = this.drawUnoCard(botPlayerId);
    if (!drawResult) return;

    // القاعدة: بعد السحب لا يمكن لعب سوى الورقة المسحوبة (أو تمرير الدور).
    if (drawResult.canPlayDrawnCard) {
      const followUp = getBestUnoBotMove(
        s.unoState,
        botPlayerId,
        drawResult.drawnCard.id
      );
      if (followUp.action === "PLAY" && followUp.cardId) {
        if (followUp.shoutUno) {
          try {
            this.shoutUno(botPlayerId);
          } catch {}
        }
        try {
          this.playUnoCard(botPlayerId, followUp.cardId, followUp.chosenColor);
        } catch {
          try {
            this.passUnoAfterDraw(botPlayerId);
          } catch {}
        }
      } else {
        try {
          this.passUnoAfterDraw(botPlayerId);
        } catch {}
      }
    }
  }
}
