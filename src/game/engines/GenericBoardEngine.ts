import type { IGameEngine, GameType, VictoryCheckResult, EngineContext } from "./types";
import type { GeneratedSessionPack, BoardTile, GameCard } from "../schema";
import { executeCardEffects } from "../effectEngine";
import { recordUserActionInStore } from "../behavioralDNA";

export class GenericBoardEngine implements IGameEngine {
  public readonly gameType: GameType = "GENERIC_BOARD";
  private voteTimer?: ReturnType<typeof setTimeout>;

  constructor(private ctx: EngineContext) {}

  public initialize(pack: GeneratedSessionPack): void {
    const s = this.ctx.state;
    s.boardSize = pack.tiles?.length || 20;
    s.tiles = pack.tiles || [];
    s.deck = [...pack.cardsDeck];
    s.rulesConfig = pack.rulesConfig || {
      turnMechanism: "DICE_AND_MOVE",
      cardVisibility: "SECRET_PHONE_ONLY",
      ownershipSystem: "NONE"
    };
    s.winCondition = pack.winCondition || "MOST_COINS";
    s.targetScore = pack.targetScore;
  }

  public rollDice(playerId: string): void {
    const s = this.ctx.state;
    const player = s.players[playerId];
    if (!player) return;

    s.phase = "RESOLVING_TILE";

    const dice1 = Math.floor(Math.random() * 6) + 1;
    s.lastDiceRoll = {
      dice1,
      dice2: dice1,
      sum: dice1,
      isDoubles: false
    };

    const moveEvents = executeCardEffects(
      s,
      [{ actionType: "MOVE_STEPS", targetType: "SELF", value: dice1 }],
      { sourcePlayerId: playerId }
    );

    const landedTile = s.tiles[player.position];

    this.ctx.broadcast("DICE_ROLLED", {
      playerId,
      dice1,
      dice2: dice1,
      diceValue: dice1,
      isDoubles: false,
      inJail: false,
      newPosition: player.position,
      landedTile,
      moveEvents
    });

    this.resolveLandedTile(player, landedTile);
  }

  public claimOrAttackTile(playerId: string, targetTileIndex: number): void {
    const s = this.ctx.state;
    const player = s.players[playerId];
    const tile = s.tiles[targetTileIndex];

    if (!tile) {
      throw new Error("الإقليم المطلوب غير موجود.");
    }
    if (tile.ownerId === playerId) {
      throw new Error("هذا الإقليم خاضع لسيطرتك بالفعل!");
    }

    const cost = tile.price || 50;

    if (!tile.ownerId) {
      if (player.coins < cost) {
        throw new Error("رصيدك لا يكفي لفتح هذا الإقليم!");
      }
      player.coins -= cost;
      tile.ownerId = playerId;
      tile.armies = (tile.armies || 1);

      this.ctx.broadcast("TERRITORY_CLAIMED", {
        playerId,
        targetTileIndex,
        tile,
        messageAr: `فرض ${player.name} سيطرته على إقليم ${tile.name}!`
      });
    } else {
      const defenderId = tile.ownerId;
      const defender = s.players[defenderId];
      const currentArmies = tile.armies || 1;

      if (currentArmies > 1) {
        tile.armies = currentArmies - 1;
        this.ctx.broadcast("TERRITORY_DEFENDED", {
          attackerId: playerId,
          defenderId,
          targetTileIndex,
          remainingArmies: tile.armies,
          messageAr: `هاجم ${player.name} إقليم ${tile.name} لكن دفاعات ${defender?.name || "الخصم"} صمدت (الجيوش المتبقية: ${tile.armies})!`
        });
      } else {
        tile.ownerId = playerId;
        tile.armies = 1;
        this.ctx.broadcast("TERRITORY_CONQUERED", {
          attackerId: playerId,
          defenderId,
          targetTileIndex,
          tile,
          messageAr: `اجتاح ${player.name} إقليم ${tile.name} وانتزعه من ${defender?.name || "الخصم"}!`
        });
      }
    }

    if (player.userId) {
      recordUserActionInStore(player.userId, "CLAIM_OR_ATTACK_TILE", {
        targetTileIndex,
        targetPlayerId: tile.ownerId || undefined
      });
    }

    this.ctx.syncState();

    const victory = this.checkVictory();
    if (victory.isOver) {
      this.ctx.endGame(victory);
      return;
    }

    if (s.rulesConfig?.turnMechanism === "TERRITORY_COMMAND") {
      this.ctx.advanceTurn();
    }
  }

  public resolveLandedTile(player: any, tile: BoardTile): void {
    const s = this.ctx.state;
    if (!tile) {
      this.ctx.advanceTurn();
      return;
    }

    let tileEvents: any[] = [];

    switch (tile.tileType) {
      case "START":
      case "RESOURCE":
      case "HAZARD": {
        if (tile.defaultEffect) {
          tileEvents = executeCardEffects(
            s,
            [tile.defaultEffect],
            { sourcePlayerId: player.id }
          );
        }
        this.ctx.broadcast("TILE_RESOLVED", { tile, events: tileEvents });
        this.ctx.advanceTurn();
        break;
      }

      case "SECRET_CARD": {
        const secretCard = this.drawCardByCategory("SECRET_HAND");
        if (player.secretHand.length >= 4) {
          this.ctx.broadcast("SECRET_HAND_FULL", {
            playerId: player.id,
            messageAr: `يد ${player.name} ممتلئة بالبطاقات السرية (الحد الأقصى 4)!`
          });
        } else if (secretCard) {
          player.secretHand.push(secretCard);
          this.ctx.broadcast("SECRET_CARD_DRAWN", {
            playerId: player.id,
            messageAr: `سحب ${player.name} بطاقة تكتيكية سرية إلى هاتفه!`
          });
        }
        this.ctx.advanceTurn();
        break;
      }

      case "DRAMA_EVENT": {
        const dramaCard = this.drawCardByCategory("PUBLIC_DRAMA");
        if (dramaCard) {
          tileEvents = executeCardEffects(
            s,
            dramaCard.effects,
            { sourcePlayerId: player.id }
          );
          this.ctx.broadcast("DRAMA_CARD_TRIGGERED", {
            card: dramaCard,
            events: tileEvents
          });
        }
        this.ctx.advanceTurn();
        break;
      }

      case "GLOBAL_VOTE": {
        const voteCard = this.drawCardByCategory("VOTE_CARD");
        if (voteCard) {
          s.activeVoteCard = voteCard;
          s.phase = "VOTING";

          tileEvents = executeCardEffects(
            s,
            voteCard.effects,
            { sourcePlayerId: player.id }
          );

          this.ctx.broadcast("VOTE_SESSION_STARTED", {
            card: voteCard,
            timeoutSeconds: 15,
            events: tileEvents
          });

          this.voteTimer = setTimeout(() => {
            this.finalizeVoteSession();
          }, 15000);

          this.ctx.syncState();
        } else {
          this.ctx.advanceTurn();
        }
        break;
      }

      default:
        this.ctx.advanceTurn();
        break;
    }
  }

  public submitPlayerVote(voterId: string, targetPlayerId: string): void {
    const s = this.ctx.state;
    if (s.phase !== "VOTING" || !s.pendingVote) {
      throw new Error("لا يوجد تصويت نشط حالياً.");
    }
    if (!s.players[targetPlayerId]) {
      throw new Error("اللاعب المستهدف غير موجود.");
    }

    s.pendingVote.votes[voterId] = targetPlayerId;

    const voter = s.players[voterId];
    if (voter?.userId) {
      recordUserActionInStore(voter.userId, "SUBMIT_VOTE", { targetPlayerId });
    }

    const connectedCount = Object.values(s.players).filter((p) => p.isConnected).length;
    const votesCount = Object.keys(s.pendingVote.votes).length;

    if (votesCount >= connectedCount) {
      this.finalizeVoteSession();
    } else {
      this.ctx.syncState();
    }
  }

  private finalizeVoteSession(): void {
    if (this.voteTimer) {
      clearTimeout(this.voteTimer);
      this.voteTimer = undefined;
    }

    const s = this.ctx.state;
    if (!s.pendingVote || !s.activeVoteCard) {
      this.ctx.advanceTurn();
      return;
    }

    const tally: Record<string, number> = {};
    for (const votedTargetId of Object.values(s.pendingVote.votes)) {
      tally[votedTargetId] = (tally[votedTargetId] || 0) + 1;
    }

    let maxVotes = -1;
    let candidatesWithMaxVotes: string[] = [];

    for (const [candidateId, count] of Object.entries(tally)) {
      if (count > maxVotes) {
        maxVotes = count;
        candidatesWithMaxVotes = [candidateId];
      } else if (count === maxVotes && maxVotes > 0) {
        candidatesWithMaxVotes.push(candidateId);
      }
    }

    const isTie = candidatesWithMaxVotes.length > 1;
    let loserId = candidatesWithMaxVotes[0] || this.ctx.getActivePlayerId();

    if (isTie) {
      const randomIndex = Math.floor(Math.random() * candidatesWithMaxVotes.length);
      loserId = candidatesWithMaxVotes[randomIndex];
    }

    const voteResolutionEvents = executeCardEffects(
      s,
      s.activeVoteCard.effects,
      {
        sourcePlayerId: this.ctx.getActivePlayerId(),
        votedLoserId: loserId
      }
    );

    this.ctx.broadcast("VOTE_SESSION_ENDED", {
      loserId,
      tally,
      isTie,
      tiedCandidates: isTie ? candidatesWithMaxVotes : undefined,
      events: voteResolutionEvents
    });

    s.activeVoteCard = undefined;
    this.ctx.advanceTurn();
  }

  private drawCardByCategory(category: "SECRET_HAND" | "PUBLIC_DRAMA" | "VOTE_CARD"): GameCard | undefined {
    const matchingCards = this.ctx.state.deck.filter((c) => c.category === category);
    if (matchingCards.length === 0) return undefined;
    return matchingCards[Math.floor(Math.random() * matchingCards.length)];
  }

  public checkVictory(): VictoryCheckResult {
    const s = this.ctx.state;
    const players = Object.values(s.players);
    if (players.length === 0) return { isOver: false, reasonAr: "" };

    // 1. CONQUER_REGIONS
    if (s.rulesConfig?.ownershipSystem === "CONQUER_REGIONS") {
      const claimableTiles = s.tiles.filter((t) => t.tileType !== "START" || t.price !== undefined);
      if (claimableTiles.length > 0) {
        for (const p of players) {
          const owned = claimableTiles.filter((t) => t.ownerId === p.id).length;
          const ratio = owned / claimableTiles.length;
          if (ratio >= 0.75 || owned === claimableTiles.length) {
            return {
              isOver: true,
              winner: p,
              reasonAr: "بسط نفوذه العسكري وسيطر على أكثر من 75% من أقاليم الخريطة وحقق الغزو الشامل! ⚔️👑"
            };
          }
        }
      }
    }

    // 2. TARGET_SCORE
    if (s.winCondition === "TARGET_SCORE" && s.targetScore) {
      const reachedTarget = players.find((p) => p.coins >= s.targetScore!);
      if (reachedTarget) {
        return {
          isOver: true,
          winner: reachedTarget,
          reasonAr: `وصل للرصيد المستهدف (${s.targetScore} ${s.currencyName})!`
        };
      }
    }

    // 3. FIRST_TO_FINISH
    if (s.winCondition === "FIRST_TO_FINISH") {
      const reachedFinish = players.find((p) => p.position >= s.boardSize - 1);
      if (reachedFinish) {
        return {
          isOver: true,
          winner: reachedFinish,
          reasonAr: "اجتاز خط النهاية أولاً بنجاح!"
        };
      }
    }

    // 4. LAST_SURVIVOR
    if (s.winCondition === "LAST_SURVIVOR") {
      const survivors = players.filter((p) => !p.isEliminated && !p.isBankrupt && p.coins > 0);
      if (survivors.length === 1 && players.length > 1) {
        return {
          isOver: true,
          winner: survivors[0],
          reasonAr: "الناجي الوحيد المتبقي على قيد الحياة!"
        };
      }
    }

    return { isOver: false, reasonAr: "" };
  }

  public executeBotTurn(botPlayerId: string): void {
    const s = this.ctx.state;
    const mechanism = s.rulesConfig?.turnMechanism || "DICE_AND_MOVE";

    if (mechanism === "TERRITORY_COMMAND") {
      const opponentTiles = s.tiles.filter((t) => t.ownerId !== botPlayerId);
      const targetTile = opponentTiles.length > 0
        ? opponentTiles[Math.floor(Math.random() * opponentTiles.length)]
        : s.tiles[0];
      if (targetTile) {
        this.claimOrAttackTile(botPlayerId, targetTile.index);
      }
    } else {
      this.rollDice(botPlayerId);
    }
  }
}
