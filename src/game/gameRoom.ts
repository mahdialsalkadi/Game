import type { GeneratedSessionPack, BoardTile, GameCard, GameSettings, WinCondition, GameArchetype, GameRulesConfig } from "./schema";
import { GameSettingsSchema } from "./schema";
import {
  type GameRoomState,
  type PlayerState,
  type AnimationEvent,
  executeCardEffects
} from "./effectEngine";
import { recordUserActionInStore, finalizeGameForUsers, type PlayerBehavioralDNA } from "./behavioralDNA";
import { getUserByIdSync } from "./userStore";

export type { GeneratedSessionPack as SessionPack, BoardTile, GameCard, GameSettings, WinCondition, GameArchetype, GameRulesConfig };

export type RoomPhase =
  | "LOBBY"
  | "TURN_START"
  | "RESOLVING_TILE"
  | "VOTING"
  | "GAME_OVER";

// توسيع حالة اللاعب لتشمل البطاقات السرية التي في يده (على جواله)
export interface ExtendedPlayerState extends PlayerState {
  secretHand: GameCard[];
  isConnected: boolean;
  userId?: string;
}

// الحالة الكاملة للغرفة شاملة تعاقب الأدوار وحزمة الذكاء الاصطناعي
export interface FullRoomState extends GameRoomState {
  phase: RoomPhase;
  players: Record<string, ExtendedPlayerState>;
  turnOrder: string[];       // مصفوفة بمعرفات اللاعبين لضبط ترتيب الدور
  currentTurnIndex: number;  // مؤشر اللاعب صاحب الدور الحالي
  currentRound: number;
  maxRounds: number;
  tiles: BoardTile[];
  deck: GameCard[];
  activeVoteCard?: GameCard; // البطاقة التي يتم التصويت عليها حالياً
  settings: GameSettings;    // إعدادات الغرفة القابلة للتخصيص
  archetype: GameArchetype;  // نمط اللعبة (اقتصاد، سباق، معركة، إلخ)
  rulesConfig: GameRulesConfig; // القواعد الميكانيكية للعبة
  winCondition: WinCondition;// شرط الفوز المحدد
  targetScore?: number;      // الرصيد المستهدف للفوز السريع
  midGameInterventionTriggered?: boolean; // مؤشر تدخل المخرج الذكي في منتصف اللعبة
}

// دالة إرسال التحديثات عبر WebSockets (يتم تمريرها من Socket.io أو PartyKit)
export type BroadcastFn = (
  eventType: string,
  payload: Record<string, unknown>
) => void;

export class BoardGameRoomMachine {
  public state: FullRoomState;
  private broadcast: BroadcastFn;
  private voteTimer?: ReturnType<typeof setTimeout>;

  constructor(
    roomId: string,
    broadcastCallback: BroadcastFn,
    customSettings?: Partial<GameSettings>
  ) {
    this.broadcast = broadcastCallback;
    const settings = GameSettingsSchema.parse(customSettings || {});
    this.state = {
      roomId,
      phase: "LOBBY",
      boardSize: 20,
      passStartBonus: settings.passStartBonus,
      currencyName: "ذهبة",
      players: {},
      turnOrder: [],
      currentTurnIndex: 0,
      currentRound: 1,
      maxRounds: settings.maxRounds,
      tiles: [],
      deck: [],
      settings,
      archetype: "PARTY_ECONOMY",
      rulesConfig: {
        turnMechanism: "DICE_AND_MOVE",
        cardVisibility: "SECRET_PHONE_ONLY",
        ownershipSystem: "NONE"
      },
      winCondition: "MOST_COINS",
      midGameInterventionTriggered: false
    };
  }

  // ==========================================
  // 1. إدارة انضمام اللاعبين وبدء الجلسة وإعدادات الغرفة
  // ==========================================

  public updateSettings(newSettings: Partial<GameSettings>): void {
    if (this.state.phase !== "LOBBY") {
      throw new Error("لا يمكن تعديل الإعدادات بعد بدء الجلسة.");
    }
    const validated = GameSettingsSchema.partial().parse(newSettings);
    this.state.settings = { ...this.state.settings, ...validated };
    if (validated.maxRounds !== undefined) {
      this.state.maxRounds = validated.maxRounds;
    }
    if (validated.passStartBonus !== undefined) {
      this.state.passStartBonus = validated.passStartBonus;
    }
    if (validated.startingCoins !== undefined) {
      for (const player of Object.values(this.state.players)) {
        player.coins = validated.startingCoins;
      }
    }
    this.broadcast("SETTINGS_UPDATED", { settings: this.state.settings });
    this.syncState();
  }

  public joinPlayer(id: string, name: string, color: string, userId?: string): void {
    if (this.state.players[id]) {
      this.state.players[id].isConnected = true;
      if (userId) this.state.players[id].userId = userId;
      this.syncState();
      return;
    }

    if (this.state.phase !== "LOBBY") {
      throw new Error("لا يمكن انضمام لاعبين جدد بعد بدء الجلسة.");
    }

    this.state.players[id] = {
      id,
      name,
      color,
      coins: this.state.settings.startingCoins,
      position: 0,
      hasShield: false,
      skipNextTurn: false,
      secretHand: [],
      isConnected: true,
      userId,
      stats: {
        coinsStolen: 0,
        timesBetrayedBy: {},
        shieldsTriggered: 0
      }
    };

    this.state.turnOrder.push(id);
    this.syncState();
  }

  public startGameWithAIPack(pack: GeneratedSessionPack): void {
    if (this.state.turnOrder.length < 2) {
      throw new Error("يجب وجود لاعبين اثنين على الأقل لبدء اللعبة.");
    }

    this.state.currencyName = pack.currencyName;
    this.state.archetype = pack.archetype || "PARTY_ECONOMY";
    this.state.rulesConfig = pack.rulesConfig || {
      turnMechanism: "DICE_AND_MOVE",
      cardVisibility: "SECRET_PHONE_ONLY",
      ownershipSystem: "NONE"
    };
    this.state.winCondition = pack.winCondition || "MOST_COINS";
    this.state.targetScore = pack.targetScore;
    this.state.tiles = pack.tiles;
    this.state.deck = [...pack.cardsDeck];
    this.state.currentRound = 1;
    this.state.currentTurnIndex = 0;
    this.state.midGameInterventionTriggered = false;
    this.state.phase = "TURN_START";

    // توزيع بطاقات البداية على اللاعبين
    const startingHandCount = this.state.rulesConfig?.turnMechanism === "CARD_PLAY_ONLY" ? 4 : 2;
    for (const pid of this.state.turnOrder) {
      const p = this.state.players[pid];
      if (p) {
        p.secretHand = [];
        for (let i = 0; i < startingHandCount; i++) {
          const baseCard = this.drawCardByCategory("SECRET_HAND") || this.state.deck[i % Math.max(1, this.state.deck.length)];
          if (baseCard) {
            p.secretHand.push({
              ...baseCard,
              id: `${baseCard.id}_deal_${pid}_${i}`
            });
          }
        }
      }
    }

    this.broadcast("GAME_STARTED", {
      themeTitle: pack.themeTitle,
      visualStyle: pack.visualStyle,
      narratorIntro: pack.narratorIntro,
      activePlayerId: this.getActivePlayerId()
    });

    this.syncState();
  }

  public drawCardFromDeck(playerId: string): void {
    this.assertActiveTurn(playerId, "TURN_START");
    const player = this.state.players[playerId];
    if (player.secretHand.length >= 6) {
      throw new Error("يدك ممتلئة بالبطاقات بالفعل (الحد الأقصى 6 بطاقات)!");
    }
    const baseCard = this.drawCardByCategory("SECRET_HAND") || this.state.deck[Math.floor(Math.random() * Math.max(1, this.state.deck.length))];
    if (!baseCard) {
      throw new Error("لا توجد بطاقات في الكومة حالياً!");
    }
    const drawnCard = {
      ...baseCard,
      id: `${baseCard.id}_drawn_${Date.now()}`
    };
    player.secretHand.push(drawnCard);

    this.broadcast("SECRET_CARD_DRAWN", {
      playerId: player.id,
      messageAr: `سحب ${player.name} بطاقة جديدة من الكومة!`
    });

    if (player.userId) {
      recordUserActionInStore(player.userId, "DRAW_CARD", { cardId: drawnCard.id });
    }

    this.syncState();
  }

  public passTurn(playerId: string): void {
    this.assertActiveTurn(playerId, "TURN_START");
    const player = this.state.players[playerId];
    this.broadcast("TURN_PASSED", {
      playerId: player.id,
      messageAr: `مرر ${player.name} دوره إلى اللاعب التالي.`
    });
    this.advanceTurn();
  }

  // ==========================================
  // 2. استخدام البطاقات السرية من شاشة الجوال
  // ==========================================

  public playSecretCard(
    playerId: string,
    cardId: string,
    chosenTargetId?: string
  ): void {
    this.assertActiveTurn(playerId, "TURN_START");

    const player = this.state.players[playerId];
    const cardIndex = player.secretHand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      throw new Error("البطاقة غير موجودة في يد اللاعب.");
    }

    const [playedCard] = player.secretHand.splice(cardIndex, 1);
    const animationEvents = executeCardEffects(
      this.state,
      playedCard.effects,
      { sourcePlayerId: playerId, chosenTargetId }
    );

    this.broadcast("SECRET_CARD_PLAYED", {
      playerId,
      card: playedCard,
      events: animationEvents
    });

    if (player.userId) {
      recordUserActionInStore(player.userId, "PLAY_SECRET_CARD", {
        cardId,
        chosenTargetId
      });
    }

    this.syncState();

    if (this.state.rulesConfig?.turnMechanism === "CARD_PLAY_ONLY") {
      this.advanceTurn();
    }
  }

  // ==========================================
  // 2b. شراء العقارات وقيادة الأقاليم
  // ==========================================

  public buyProperty(playerId: string, tileIndex?: number): void {
    if (this.state.phase !== "TURN_START" && this.state.phase !== "RESOLVING_TILE") {
      throw new Error(`الإجراء غير مسموح في المرحلة الحالية: ${this.state.phase}`);
    }
    if (this.getActivePlayerId() !== playerId) {
      throw new Error("ليس دورك الآن!");
    }

    const player = this.state.players[playerId];
    const targetIndex = tileIndex !== undefined ? tileIndex : player.position;
    const tile = this.state.tiles[targetIndex];

    if (!tile) {
      throw new Error("المربع المطلوب غير موجود.");
    }

    const price = tile.price || 100;

    if (tile.ownerId && tile.ownerId !== playerId) {
      throw new Error("هذا العقار مملوك للاعب آخر بالفعل!");
    }
    if (tile.ownerId === playerId) {
      throw new Error("أنت تملك هذا العقار بالفعل!");
    }
    if (player.coins < price) {
      throw new Error("رصيدك لا يكفي لشراء هذا العقار!");
    }

    player.coins -= price;
    tile.ownerId = playerId;
    if (tile.rent === undefined) {
      tile.rent = Math.max(10, Math.floor(price * 0.25));
    }

    this.broadcast("PROPERTY_BOUGHT", {
      playerId,
      tileIndex: targetIndex,
      price,
      tile,
      messageAr: `قام ${player.name} بشراء ${tile.name} مقابل ${price} ${this.state.currencyName}!`
    });

    if (player.userId) {
      recordUserActionInStore(player.userId, "BUY_PROPERTY", {
        price,
        tileIndex: targetIndex
      });
    }

    this.syncState();
  }

  public claimOrAttackTile(playerId: string, targetTileIndex: number): void {
    this.assertActiveTurn(playerId, "TURN_START");
    const player = this.state.players[playerId];
    const tile = this.state.tiles[targetTileIndex];

    if (!tile) {
      throw new Error("الإقليم المطلوب غير موجود.");
    }
    if (tile.ownerId === playerId) {
      throw new Error("هذا الإقليم خاضع لسيطرتك بالفعل!");
    }

    const cost = tile.price || 50;

    // حالة 1: إقليم غير محتل
    if (!tile.ownerId) {
      if (player.coins < cost) {
        throw new Error("رصيدك لا يكفي لفتح هذا الإقليم!");
      }
      player.coins -= cost;
      tile.ownerId = playerId;
      tile.armies = (tile.armies || 1);

      this.broadcast("TERRITORY_CLAIMED", {
        playerId,
        targetTileIndex,
        tile,
        messageAr: `فرض ${player.name} سيطرته على إقليم ${tile.name}!`
      });
    } else {
      // حالة 2: إقليم مملوك لخصم
      const defenderId = tile.ownerId;
      const defender = this.state.players[defenderId];
      const currentArmies = tile.armies || 1;

      if (currentArmies > 1) {
        tile.armies = currentArmies - 1;
        this.broadcast("TERRITORY_DEFENDED", {
          attackerId: playerId,
          defenderId,
          targetTileIndex,
          remainingArmies: tile.armies,
          messageAr: `هاجم ${player.name} إقليم ${tile.name} لكن دفاعات ${defender?.name || "الخصم"} صمدت (الجيوش المتبقية: ${tile.armies})!`
        });
      } else {
        // تم الاجتياح والسيطرة!
        tile.ownerId = playerId;
        tile.armies = 1;
        this.broadcast("TERRITORY_CONQUERED", {
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

    this.syncState();

    if (this.state.rulesConfig?.turnMechanism === "TERRITORY_COMMAND") {
      this.advanceTurn();
    }
  }

  // ==========================================
  // 3. رمي النرد، الحركة، وتنفيذ حدث المربع
  // ==========================================

  public rollDiceAndMove(playerId: string): void {
    this.assertActiveTurn(playerId, "TURN_START");
    this.state.phase = "RESOLVING_TILE";

    const player = this.state.players[playerId];
    const diceValue = Math.floor(Math.random() * 6) + 1;

    const moveEvents = executeCardEffects(
      this.state,
      [{ actionType: "MOVE_STEPS", targetType: "SELF", value: diceValue }],
      { sourcePlayerId: playerId }
    );

    const landedTile = this.state.tiles[player.position];

    this.broadcast("DICE_ROLLED", {
      playerId,
      diceValue,
      newPosition: player.position,
      landedTile,
      moveEvents
    });

    this.resolveLandedTile(player, landedTile);
  }

  private resolveLandedTile(
    player: ExtendedPlayerState,
    tile: BoardTile
  ): void {
    let currentTile = tile;

    // 1. Instant Jump (Snakes & Ladders)
    if (
      currentTile.jumpToIndex !== undefined &&
      currentTile.jumpToIndex >= 0 &&
      currentTile.jumpToIndex < this.state.boardSize
    ) {
      const destIndex = currentTile.jumpToIndex;
      const isLadder = destIndex > currentTile.index;
      player.position = destIndex;
      this.broadcast("LADDER_OR_SNAKE_JUMP", {
        playerId: player.id,
        fromIndex: currentTile.index,
        toIndex: destIndex,
        isLadder,
        messageAr: isLadder
          ? `صعد ${player.name} سلماً سريعاً إلى المربع #${destIndex}! 🪜`
          : `انزلق ${player.name} على ثعبان إلى المربع #${destIndex}! 🐍`
      });

      const victory = this.checkVictoryCondition();
      if (victory.isOver) {
        this.endGame(victory);
        return;
      }

      currentTile = this.state.tiles[destIndex] || currentTile;
    }

    // 2. Automated Rent Collection (Monopoly-style BUY_AND_RENT)
    if (
      this.state.rulesConfig?.ownershipSystem === "BUY_AND_RENT" &&
      currentTile.ownerId &&
      currentTile.ownerId !== player.id
    ) {
      const owner = this.state.players[currentTile.ownerId];
      if (owner) {
        const rentAmount = currentTile.rent !== undefined ? currentTile.rent : Math.floor((currentTile.price || 100) * 0.25);
        const actualRent = Math.min(player.coins, rentAmount);
        player.coins -= actualRent;
        owner.coins += actualRent;

        this.broadcast("RENT_PAID", {
          payerId: player.id,
          ownerId: owner.id,
          tileIndex: currentTile.index,
          rent: actualRent,
          messageAr: `دفع ${player.name} إيجاراً قدره ${actualRent} ${this.state.currencyName} إلى ${owner.name} صاحب ${currentTile.name}!`
        });

        if (owner.userId) {
          recordUserActionInStore(owner.userId, "RENT_COLLECTED", { rent: actualRent, tenantId: player.id });
        }

        const victory = this.checkVictoryCondition();
        if (victory.isOver) {
          this.endGame(victory);
          return;
        }
      }
    }

    let tileEvents: AnimationEvent[] = [];

    switch (currentTile.tileType) {
      case "START":
      case "RESOURCE":
      case "HAZARD": {
        if (currentTile.defaultEffect) {
          tileEvents = executeCardEffects(
            this.state,
            [currentTile.defaultEffect],
            { sourcePlayerId: player.id }
          );
        }
        this.broadcast("TILE_RESOLVED", { tile: currentTile, events: tileEvents });
        this.advanceTurn();
        break;
      }

      case "SECRET_CARD": {
        const secretCard = this.drawCardByCategory("SECRET_HAND");
        if (player.secretHand.length >= 4) {
          this.broadcast("SECRET_HAND_FULL", {
            playerId: player.id,
            messageAr: `يد ${player.name} ممتلئة بالبطاقات السرية (الحد الأقصى 4)!`
          });
        } else if (secretCard) {
          player.secretHand.push(secretCard);
          this.broadcast("SECRET_CARD_DRAWN", {
            playerId: player.id,
            messageAr: `سحب ${player.name} بطاقة تكتيكية سرية إلى هاتفه!`
          });
        }
        this.advanceTurn();
        break;
      }

      case "DRAMA_EVENT": {
        const dramaCard = this.drawCardByCategory("PUBLIC_DRAMA");
        if (dramaCard) {
          tileEvents = executeCardEffects(
            this.state,
            dramaCard.effects,
            { sourcePlayerId: player.id }
          );
          this.broadcast("DRAMA_CARD_TRIGGERED", {
            card: dramaCard,
            events: tileEvents
          });
        }
        this.advanceTurn();
        break;
      }

      case "GLOBAL_VOTE": {
        const voteCard = this.drawCardByCategory("VOTE_CARD");
        if (voteCard) {
          this.state.activeVoteCard = voteCard;
          this.state.phase = "VOTING";

          tileEvents = executeCardEffects(
            this.state,
            voteCard.effects,
            { sourcePlayerId: player.id }
          );

          this.broadcast("VOTE_SESSION_STARTED", {
            card: voteCard,
            timeoutSeconds: 15,
            events: tileEvents
          });

          this.voteTimer = setTimeout(() => {
            this.finalizeVoteSession();
          }, 15000);

          this.syncState();
        } else {
          this.advanceTurn();
        }
        break;
      }
    }
  }

  // ==========================================
  // 4. إدارة التصويت الجماعي (15 ثانية)
  // ==========================================

  public submitPlayerVote(voterId: string, targetPlayerId: string): void {
    if (this.state.phase !== "VOTING" || !this.state.pendingVote) {
      throw new Error("لا يوجد تصويت نشط حالياً.");
    }
    if (!this.state.players[targetPlayerId]) {
      throw new Error("اللاعب المستهدف غير موجود.");
    }

    this.state.pendingVote.votes[voterId] = targetPlayerId;

    const voter = this.state.players[voterId];
    if (voter?.userId) {
      recordUserActionInStore(voter.userId, "SUBMIT_VOTE", { targetPlayerId });
    }

    const connectedCount = Object.values(this.state.players).filter(
      (p) => p.isConnected
    ).length;
    const votesCount = Object.keys(this.state.pendingVote.votes).length;

    if (votesCount >= connectedCount) {
      this.finalizeVoteSession();
    } else {
      this.syncState();
    }
  }

  private finalizeVoteSession(): void {
    if (this.voteTimer) {
      clearTimeout(this.voteTimer);
      this.voteTimer = undefined;
    }

    if (!this.state.pendingVote || !this.state.activeVoteCard) {
      this.advanceTurn();
      return;
    }

    const tally: Record<string, number> = {};
    for (const votedTargetId of Object.values(this.state.pendingVote.votes)) {
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
    let loserId = candidatesWithMaxVotes[0] || this.getActivePlayerId();

    if (isTie) {
      // Pick randomly among tied candidates
      const randomIndex = Math.floor(Math.random() * candidatesWithMaxVotes.length);
      loserId = candidatesWithMaxVotes[randomIndex];
    }

    const voteResolutionEvents = executeCardEffects(
      this.state,
      this.state.activeVoteCard.effects,
      {
        sourcePlayerId: this.getActivePlayerId(),
        votedLoserId: loserId
      }
    );

    if (isTie && voteResolutionEvents.length > 0) {
      const loserName = this.state.players[loserId]?.name || loserId;
      const tiedNames = candidatesWithMaxVotes.map(id => this.state.players[id]?.name || id).join(" و ");
      voteResolutionEvents[0].messageAr = `تعادل في الأصوات بين (${tiedNames})! وقعت القرعة على ${loserName}. ${voteResolutionEvents[0].messageAr}`;
    }

    this.broadcast("VOTE_SESSION_ENDED", {
      loserId,
      tally,
      isTie,
      tiedCandidates: isTie ? candidatesWithMaxVotes : undefined,
      events: voteResolutionEvents
    });

    this.state.activeVoteCard = undefined;
    this.advanceTurn();
  }

  // ==========================================
  // 5. تعاقب الأدوار، فحص التجميد، وإنهاء اللعبة
  // ==========================================

  public checkVictoryCondition(): { isOver: boolean; winner?: PlayerState; reasonAr: string } {
    const players = Object.values(this.state.players);
    if (players.length === 0) return { isOver: false, reasonAr: "" };

    // 1. TARGET_SCORE Condition
    if (this.state.winCondition === "TARGET_SCORE" && this.state.targetScore) {
      const reachedTarget = players.find((p) => p.coins >= this.state.targetScore!);
      if (reachedTarget) {
        return {
          isOver: true,
          winner: reachedTarget,
          reasonAr: `وصل للرصيد المستهدف (${this.state.targetScore} ${this.state.currencyName})!`
        };
      }
    }

    // 2. FIRST_TO_FINISH (Race condition)
    if (this.state.winCondition === "FIRST_TO_FINISH") {
      const reachedFinish = players.find((p) => p.position >= this.state.boardSize - 1);
      if (reachedFinish) {
        return {
          isOver: true,
          winner: reachedFinish,
          reasonAr: `اجتاز خط النهاية أولاً بنجاح!`
        };
      }
    }

    // 3. LAST_SURVIVOR (Elimination)
    if (this.state.winCondition === "LAST_SURVIVOR") {
      const survivors = players.filter((p) => p.coins > 0);
      if (survivors.length === 1 && players.length > 1) {
        return {
          isOver: true,
          winner: survivors[0],
          reasonAr: `الناجي الوحيد المتبقي على قيد الحياة!`
        };
      }
    }

    // 4. Default: MOST_COINS when rounds expire
    if (this.state.currentRound > this.state.maxRounds) {
      const richest = [...players].sort((a, b) => b.coins - a.coins)[0];
      return {
        isOver: true,
        winner: richest,
        reasonAr: `انتهت الجولات بأعلى رصيد (${richest?.coins} ${this.state.currencyName}).`
      };
    }

    return { isOver: false, reasonAr: "" };
  }

  public advanceTurn(): void {
    const victory = this.checkVictoryCondition();
    if (victory.isOver) {
      this.endGame(victory);
      return;
    }

    const totalPlayers = this.state.turnOrder.length;

    for (let i = 0; i < totalPlayers; i++) {
      this.state.currentTurnIndex =
        (this.state.currentTurnIndex + 1) % totalPlayers;

      if (this.state.currentTurnIndex === 0) {
        this.state.currentRound += 1;

        if (
          !this.state.midGameInterventionTriggered &&
          this.state.currentRound >= Math.ceil(this.state.maxRounds / 2) &&
          this.state.currentRound <= this.state.maxRounds
        ) {
          this.triggerMidGameDirectorIntervention();
        }
      }

      const victoryAfterRound = this.checkVictoryCondition();
      if (victoryAfterRound.isOver) {
        this.endGame(victoryAfterRound);
        return;
      }

      const nextPlayerId = this.getActivePlayerId();
      const nextPlayer = this.state.players[nextPlayerId];

      if (nextPlayer.skipNextTurn) {
        nextPlayer.skipNextTurn = false;
        this.broadcast("TURN_SKIPPED", {
          playerId: nextPlayer.id,
          messageAr: `تم تخطي دور ${nextPlayer.name} بسبب عقوبة التجميد!`
        });
        continue;
      }

      this.state.phase = "TURN_START";
      this.broadcast("TURN_CHANGED", {
        activePlayerId: nextPlayer.id,
        currentRound: this.state.currentRound
      });
      this.syncState();
      return;
    }
  }

  private triggerMidGameDirectorIntervention(): void {
    this.state.midGameInterventionTriggered = true;

    const connectedPlayers = Object.values(this.state.players).filter((p) => p.isConnected);
    if (connectedPlayers.length < 2) return;

    // Find the trailing player (lowest coins)
    const sortedByCoins = [...connectedPlayers].sort((a, b) => a.coins - b.coins);
    const trailingPlayer = sortedByCoins[0];
    if (!trailingPlayer) return;

    let dna: PlayerBehavioralDNA | null = null;
    if (trailingPlayer.userId) {
      const user = getUserByIdSync(trailingPlayer.userId);
      if (user?.dna) {
        dna = user.dna;
      }
    }

    let rewardCard: GameCard;
    const agg = dna?.aggressionScore ?? 25;
    const cap = dna?.capitalistScore ?? 25;
    const tac = dna?.tacticalCardScore ?? 25;
    const soc = dna?.socialVoterScore ?? 25;

    const maxScore = Math.max(agg, cap, tac, soc);

    if (maxScore === agg && agg > 35) {
      rewardCard = {
        id: `director_card_aggression_${Date.now()}`,
        title: "مدد عسكري مباغت ⚔️",
        category: "SECRET_HAND",
        flavorText: "تدخل الراوي الذكي: لاحظ تعثرك فأرسل لك فرقة إغارة خاصة لتعويض خسائرك!",
        effects: [{ actionType: "STEAL_COINS", targetType: "RICHEST_PLAYER", value: 60 }]
      };
    } else if (maxScore === cap && cap > 35) {
      rewardCard = {
        id: `director_card_capitalist_${Date.now()}`,
        title: "منحة استثمارية ودرع مصرفي 💰",
        category: "SECRET_HAND",
        flavorText: "تدخل الراوي الذكي: أرسل لك صندوق إنقاذ مالي لتعود للمنافسة بقوة!",
        effects: [
          { actionType: "MODIFY_COINS", targetType: "SELF", value: 75 },
          { actionType: "GRANT_SHIELD", targetType: "SELF", value: 1 }
        ]
      };
    } else if (maxScore === tac && tac > 35) {
      rewardCard = {
        id: `director_card_tactical_${Date.now()}`,
        title: "شفرة تكتيكية سرية 🃏",
        category: "SECRET_HAND",
        flavorText: "تدخل الراوي الذكي: كشف لك ثغرة في تحصينات الخصوم لقلب الطاولة!",
        effects: [{ actionType: "SWAP_POSITIONS", targetType: "RICHEST_PLAYER", value: 0 }]
      };
    } else {
      rewardCard = {
        id: `director_card_social_${Date.now()}`,
        title: "حلف الأغلبية الدبلوماسي 🕵️",
        category: "SECRET_HAND",
        flavorText: "تدخل الراوي الذكي: أثار تعاطف المجلس معك لفرض ضريبة على المتصدر!",
        effects: [{ actionType: "TAX_PERCENTAGE", targetType: "RICHEST_PLAYER", value: 25 }]
      };
    }

    trailingPlayer.secretHand.push(rewardCard);

    this.broadcast("ADAPTIVE_DIRECTOR_INTERVENTION", {
      trailingPlayerId: trailingPlayer.id,
      trailingPlayerName: trailingPlayer.name,
      rewardCard,
      messageAr: `تدخل المخرج الذكي في منتصف اللعبة! لاحظ تعثر ${trailingPlayer.name} فمنحه [${rewardCard.title}] لقلب الموازين!`
    });
  }

  private endGame(customVictory?: { winner?: PlayerState; reasonAr: string }): void {
    this.state.phase = "GAME_OVER";

    const standings = Object.values(this.state.players).sort(
      (a, b) => b.coins - a.coins
    );

    // Generate end-game titles
    const titles = this.generateEndGameTitles();
    const winner = customVictory?.winner || standings[0];

    this.broadcast("GAME_OVER", {
      winner,
      victoryReason: customVictory?.reasonAr,
      standings,
      titles
    });

    const playersToFinalize = Object.values(this.state.players)
      .filter((p) => p.userId)
      .map((p) => ({
        userId: p.userId!,
        isWinner: p.id === (winner ? winner.id : standings[0]?.id),
        finalCoins: p.coins
      }));
    if (playersToFinalize.length > 0) {
      finalizeGameForUsers(playersToFinalize);
    }

    this.syncState();
  }

  private generateEndGameTitles(): Record<string, { title: string; stat: string }> {
    const titles: Record<string, { title: string; stat: string }> = {};
    const players = Object.values(this.state.players);

    // أغنى لاعب
    const richest = [...players].sort((a, b) => b.coins - a.coins)[0];
    if (richest) {
      titles[richest.id] = { title: "وزير المالية 💰", stat: `${richest.coins} ${this.state.currencyName}` };
    }

    // أكبر لص
    const biggestThief = [...players].sort((a, b) => b.stats.coinsStolen - a.stats.coinsStolen)[0];
    if (biggestThief && biggestThief.stats.coinsStolen > 0) {
      titles[biggestThief.id] = { title: "الثعلب الماكر 🦊", stat: `سرق ${biggestThief.stats.coinsStolen} ${this.state.currencyName}` };
    }

    // أكثر لاعب تعرض للغدر
    let mostBetrayed: PlayerState | null = null;
    let maxBetrayals = 0;
    for (const p of players) {
      const total = Object.values(p.stats.timesBetrayedBy).reduce((s, v) => s + v, 0);
      if (total > maxBetrayals) {
        maxBetrayals = total;
        mostBetrayed = p;
      }
    }
    if (mostBetrayed && maxBetrayals > 0) {
      titles[mostBetrayed.id] = { title: "الضحية المفضلة 🎯", stat: `تعرض للغدر ${maxBetrayals} مرات` };
    }

    // أكثر لاعب صد الدروع
    const shieldMaster = [...players].sort((a, b) => b.stats.shieldsTriggered - a.stats.shieldsTriggered)[0];
    if (shieldMaster && shieldMaster.stats.shieldsTriggered > 0) {
      titles[shieldMaster.id] = { title: "الحصن المنيع 🛡️", stat: `صد ${shieldMaster.stats.shieldsTriggered} هجمات` };
    }

    return titles;
  }

  // ==========================================
  // دوال مساعدة (Helpers & Guards)
  // ==========================================

  public getActivePlayerId(): string {
    return this.state.turnOrder[this.state.currentTurnIndex];
  }

  private assertActiveTurn(playerId: string, requiredPhase: RoomPhase): void {
    if (this.state.phase !== requiredPhase) {
      throw new Error(`الإجراء غير مسموح في المرحلة الحالية: ${this.state.phase}`);
    }
    if (this.getActivePlayerId() !== playerId) {
      throw new Error("ليس دورك الآن!");
    }
  }

  private drawCardByCategory(
    category: "SECRET_HAND" | "PUBLIC_DRAMA" | "VOTE_CARD"
  ): GameCard | undefined {
    const matchingCards = this.state.deck.filter(
      (c) => c.category === category
    );
    if (matchingCards.length === 0) return undefined;

    const randomIndex = Math.floor(Math.random() * matchingCards.length);
    return matchingCards[randomIndex];
  }

  private syncState(): void {
    this.broadcast("STATE_UPDATED", { state: this.state });
  }
}
