import type { IGameEngine, GameType, VictoryCheckResult, EngineContext } from "./types";
import type { GeneratedSessionPack, BoardTile } from "../schema";
import type { ExtendedPlayerState } from "../gameRoom";
import { executeCardEffects } from "../effectEngine";

export class SnakesLaddersEngine implements IGameEngine {
  public readonly gameType: GameType = "SNAKES_AND_LADDERS";

  constructor(private ctx: EngineContext) {}

  public initialize(pack: GeneratedSessionPack): void {
    const s = this.ctx.state;
    s.boardSize = pack.tiles?.length || 100;
    s.tiles = pack.tiles || [];
    s.rulesConfig = {
      turnMechanism: "DICE_AND_MOVE",
      cardVisibility: "NO_HAND_CARDS",
      ownershipSystem: "NONE"
    };
    s.winCondition = "FIRST_TO_FINISH";

    for (const pid of s.turnOrder) {
      const p = s.players[pid];
      if (p) {
        p.position = 0;
      }
    }
  }

  public rollDice(playerId: string): void {
    const s = this.ctx.state;
    const player = s.players[playerId];
    if (!player) return;

    s.phase = "RESOLVING_TILE";

    const diceValue = Math.floor(Math.random() * 6) + 1;
    s.lastDiceRoll = {
      dice1: diceValue,
      dice2: diceValue,
      sum: diceValue,
      isDoubles: false
    };

    const moveEvents = executeCardEffects(
      s,
      [{ actionType: "MOVE_STEPS", targetType: "SELF", value: diceValue }],
      { sourcePlayerId: playerId }
    );

    let currentTile = s.tiles[player.position];

    this.ctx.broadcast("DICE_ROLLED", {
      playerId,
      dice1: diceValue,
      dice2: diceValue,
      diceValue,
      isDoubles: false,
      inJail: false,
      newPosition: player.position,
      landedTile: currentTile,
      moveEvents
    });

    this.resolveLandedTile(player, currentTile);
  }

  public resolveLandedTile(player: ExtendedPlayerState, tile: BoardTile): void {
    const s = this.ctx.state;
    let currentTile = tile;

    // Check Victory for reaching finish (tile 99/100)
    if (player.position >= s.boardSize - 1) {
      const victory = this.checkVictory();
      if (victory.isOver) {
        this.ctx.endGame(victory);
        return;
      }
    }

    // Check instant Jump (Ladder or Snake)
    if (
      currentTile &&
      currentTile.jumpToIndex !== undefined &&
      currentTile.jumpToIndex >= 0 &&
      currentTile.jumpToIndex < s.boardSize
    ) {
      const destIndex = currentTile.jumpToIndex;
      const isLadder = destIndex > currentTile.index;
      player.position = destIndex;
      this.ctx.broadcast("LADDER_OR_SNAKE_JUMP", {
        playerId: player.id,
        fromIndex: currentTile.index,
        toIndex: destIndex,
        isLadder,
        messageAr: isLadder
          ? `صعد ${player.name} سلماً سريعاً إلى المربع #${destIndex + 1}! 🪜`
          : `انزلق ${player.name} على ثعبان إلى المربع #${destIndex + 1}! 🐍`
      });

      const victory = this.checkVictory();
      if (victory.isOver) {
        this.ctx.endGame(victory);
        return;
      }

      currentTile = s.tiles[destIndex] || currentTile;
    }

    // Default tile effect if present
    if (currentTile && currentTile.defaultEffect) {
      const tileEvents = executeCardEffects(
        s,
        [currentTile.defaultEffect],
        { sourcePlayerId: player.id }
      );
      this.ctx.broadcast("TILE_RESOLVED", { tile: currentTile, events: tileEvents });
    }

    this.ctx.advanceTurn();
  }

  public checkVictory(): VictoryCheckResult {
    const s = this.ctx.state;
    const players = Object.values(s.players);
    const winnerAt100 = players.find((p) => p.position >= s.boardSize - 1);

    if (winnerAt100) {
      return {
        isOver: true,
        winner: winnerAt100,
        reasonAr: "اجتاز خط النهاية وبلغ قمة المربع 100 واعتلى عرش اللعبة!"
      };
    }

    return { isOver: false, reasonAr: "" };
  }

  public executeBotTurn(botPlayerId: string): void {
    this.rollDice(botPlayerId);
  }
}
