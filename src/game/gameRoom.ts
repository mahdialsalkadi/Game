import type {
  GeneratedSessionPack,
  BoardTile,
  GameCard,
  GameSettings,
  WinCondition,
  GameArchetype,
  GameRulesConfig,
  PlayMode
} from "./schema";
import { GameSettingsSchema } from "./schema";
import { applyThemeToGamePack } from "./themeRegistry";
import {
  type GameRoomState,
  type PlayerState,
  type AnimationEvent,
  executeCardEffects
} from "./effectEngine";
import { recordUserActionInStore, finalizeGameForUsers, type PlayerBehavioralDNA } from "./behavioralDNA";
import { getUserByIdSync } from "./userStore";
import {
  type UnoState,
  type UnoActiveColor,
  type UnoCard,
  type UnoSanitizedState
} from "./unoEngine";
import {
  type LudoState,
  type LudoPlayerTokens,
  type LudoToken,
  type LudoMoveResult
} from "./ludoEngine";
import {
  GameEngineRegistry,
  type IGameEngine,
  type GameType,
  type EngineContext
} from "./engines";
import { MAX_PLAYERS_GLOBAL } from "./gameProfiles";

export type {
  GeneratedSessionPack as SessionPack,
  BoardTile,
  GameCard,
  GameSettings,
  WinCondition,
  GameArchetype,
  GameRulesConfig
};
export type { UnoState, UnoActiveColor, UnoCard, UnoSanitizedState };
export type { LudoState, LudoPlayerTokens, LudoToken, LudoMoveResult };

export type RoomPhase =
  | "LOBBY"
  | "TURN_START"
  | "RESOLVING_TILE"
  | "VOTING"
  | "SOCIAL_PHASE"
  | "GAME_OVER";

// ==========================================
// حالة استراتيجية الأقاليم (غزو العالم / Risk)
// ==========================================
export interface TerritoryBattle {
  attackerId: string;
  defenderId: string;
  tileIndex: number;
  attackerRolls: number[];
  defenderRolls: number[];
  attackerWins: boolean;
  captured: boolean;
  /** خسائر المدافع في مقارنات النرد (كتائب). */
  defenderLosses?: number;
  /** خسائر المهاجم في مقارنات النرد (كتائب). */
  attackerLosses?: number;
  /** كلفة الخسائر المخصومة من احتياط المهاجم. */
  casualtyCost?: number;
  messageAr: string;
}

export interface TerritoryState {
  actionsLeft: number;
  activePlayerId?: string;
  turnIncome: number;
  turnNumber: number;
  lastSettledPlayerId?: string;
  lastBattle?: TerritoryBattle;
}

// ==========================================
// حالة المافيا والجاسوس (Social Deduction)
// ==========================================
export type MafiaRole = "MAFIA" | "DETECTIVE" | "CITIZEN";
export type MafiaPhase = "ROLE_REVEAL" | "NIGHT" | "DAY" | "VOTE" | "RESOLUTION";

export interface MafiaElimination {
  playerId: string;
  role: MafiaRole;
  day: number;
  reason: "NIGHT" | "VOTE";
}

export interface MafiaState {
  phase: MafiaPhase;
  day: number;
  /** تُخفى من العملاء قبل الإرسال، ويُرسل لكل لاعب دوره فقط في myRole. */
  roles: Record<string, MafiaRole>;
  myRole?: MafiaRole;
  /** يعرض فقط للاعب المافيا: بقية أفراد العصابة. */
  myMafiaAllies?: string[];
  nightVictimId?: string;
  nightActorsReady?: string[];
  detectiveResult?: { detectiveId: string; targetId: string; isMafia: boolean };
  votes: Record<string, string>;
  votesCount?: number;
  votedBy?: string[];
  eliminated: MafiaElimination[];
  deadline?: number;
  phaseDurationMs?: number;
  lastSummary?: string;
}

// ==========================================
// حالة كونكت فور (Connect Four)
// ==========================================
export interface ConnectFourMove {
  playerId: string;
  row: number;
  col: number;
}

export interface ConnectFourState {
  /** 6 صفوف × 7 أعمدة — القيمة هي معرف اللاعب أو null. */
  board: (string | null)[][];
  lastMove?: ConnectFourMove;
  winningCells?: Array<{ row: number; col: number }>;
  moveCount: number;
}

// ==========================================
// حالة الضامة / الداما (Checkers)
// ==========================================
export interface CheckersPiece {
  playerId: string;
  king: boolean;
}

export interface CheckersMove {
  playerId: string;
  from: { row: number; col: number };
  to: { row: number; col: number };
  captured?: { row: number; col: number };
  promoted?: boolean;
  chained?: boolean;
}

export interface CheckersState {
  /** 8×8، الصف 0 في الأعلى. */
  board: (CheckersPiece | null)[][];
  /** لاعب الصفوف العليا (يتحرك نزولاً) ولاعب الصفوف السفلى (يتحرك صعوداً). */
  topPlayerId: string;
  bottomPlayerId: string;
  lastMove?: CheckersMove;
  /** قطعة يجب أن تكمل سلسلة أكل قبل أن ينتقل الدور. */
  pendingCapture?: { playerId: string; row: number; col: number };
  moveCountWithoutCapture: number;
}

// ==========================================
// حالة بينغو (Bingo)
// ==========================================
export interface BingoCardState {
  /** 5×5 — الصفر يمثل خانة FREE في المنتصف. */
  grid: number[][];
  marked: boolean[][];
  lines: number;
  markedCount: number;
}

export interface BingoState {
  cards: Record<string, BingoCardState>;
  calledNumbers: number[];
  lastCalled?: number;
  lastCallerId?: string;
  winnerId?: string;
  winningLineAr?: string;
}

// توسيع حالة اللاعب لتشمل البطاقات السرية التي في يده (على جواله)
export interface ExtendedPlayerState extends PlayerState {
  secretHand: GameCard[];
  isConnected: boolean;
  userId?: string;
  isBot?: boolean;
  inJail?: boolean;
  jailTurnsRemaining?: number;
  doublesCount?: number;
  isBankrupt?: boolean;
  isEliminated?: boolean;
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
  themeId: string;           // معرف العالم والثيم المختار للعبة
  themeTitle?: string;       // اسم وعنوان العالم أو الماب المختار
  playMode: PlayMode;        // طور اللعب: وناسة وجمعة مع تلميحات ذكية أو محترفين رسمي
  suggestedTokens?: string[];// أشكال القطع المقترحة المتوافقة مع الثيم
  archetype: GameArchetype;  // نمط اللعبة (اقتصاد، سباق، معركة، إلخ)
  rulesConfig: GameRulesConfig; // القواعد الميكانيكية للعبة
  winCondition: WinCondition;// شرط الفوز المحدد
  targetScore?: number;      // الرصيد المستهدف للفوز السريع
  midGameInterventionTriggered?: boolean; // مؤشر تدخل المخرج الذكي في منتصف اللعبة
  unoState?: UnoState;       // حالة لعبة أونو وبطاقات التكتيك الحقيقية
  isLudo?: boolean;          // مؤشر تفعيل نمط لودو وجاكارو المجلس
  ludoState?: LudoState;     // حالة قطع ومسارات لودو الكلاسيكية
  freeParkingJackpot?: number;
  /** حالة محرك غزو الأقاليم (Risk) */
  territoryState?: TerritoryState;
  /** حالة محرك المافيا والجاسوس */
  mafiaState?: MafiaState;
  /** مفتاح اللعبة الكلاسيكية النشطة إن وُجد */
  gameKey?: string;
  /** حالة كونكت فور */
  connectFourState?: ConnectFourState;
  /** حالة الضامة */
  checkersState?: CheckersState;
  /** حالة بينغو */
  bingoState?: BingoState;
  lastDiceRoll?: {
    dice1: number;
    dice2: number;
    sum: number;
    isDoubles: boolean;
  };
  winner?: ExtendedPlayerState;
  victoryReason?: string;
}

// دالة إرسال التحديثات عبر WebSockets
export type BroadcastFn = (
  eventType: string,
  payload: Record<string, unknown>
) => void;

/**
 * آلة إدارة غرفة الألعاب (BoardGameRoomMachine)
 * معمارية مفصولة بالكامل: تقوم بإدارة اللاعبين والجلسات وتفويض آليات اللعب للمحركات المخصصة
 * (MonopolyEngine, LudoEngine, UnoEngine, SnakesLaddersEngine, GenericBoardEngine)
 */
export class BoardGameRoomMachine {
  public state: FullRoomState;
  private broadcast: BroadcastFn;
  private activeEngine: IGameEngine | null = null;

  constructor(
    roomId: string,
    broadcastCallback: BroadcastFn = () => {},
    customSettings?: Partial<GameSettings>
  ) {
    this.broadcast = typeof broadcastCallback === "function" ? broadcastCallback : () => {};
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
      maxRounds: settings.maxRounds ?? 999,
      tiles: [],
      deck: [],
      settings,
      themeId: settings.themeId || "ARABIAN_MAJLIS",
      playMode: settings.playMode || "CASUAL",
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
  // Engine Context & Factory Dispatch
  // ==========================================

  public getEngineContext(): EngineContext {
    return {
      state: this.state,
      broadcast: this.broadcast,
      syncState: () => this.syncState(),
      advanceTurn: () => this.advanceTurn(),
      endGame: (victory) => this.endGame(victory),
      getActivePlayerId: () => this.getActivePlayerId()
    };
  }

  public getActiveEngine(): IGameEngine {
    const detectedType = GameEngineRegistry.detectGameType(this.state as any);
    if (!this.activeEngine || this.activeEngine.gameType !== detectedType) {
      this.activeEngine = GameEngineRegistry.createEngine(detectedType, this.getEngineContext());
    }
    return this.activeEngine;
  }

  public getGameType(): GameType {
    return this.getActiveEngine().gameType;
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
    if (validated.themeId !== undefined) {
      this.state.themeId = validated.themeId;
      this.state.settings.themeId = validated.themeId;
    }
    if (validated.playMode !== undefined) {
      this.state.playMode = validated.playMode;
      this.state.settings.playMode = validated.playMode;
    }
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
    this.broadcast("SETTINGS_UPDATED", {
      settings: this.state.settings,
      themeId: this.state.themeId,
      playMode: this.state.playMode
    });
    this.syncState();
  }

  public joinPlayer(id: string, name: string, color: string, userId?: string, isBot?: boolean): void {
    if (this.state.players[id]) {
      this.state.players[id].isConnected = true;
      if (userId) this.state.players[id].userId = userId;
      if (isBot !== undefined) this.state.players[id].isBot = isBot;
      this.syncState();
      return;
    }

    if (this.state.phase !== "LOBBY") {
      throw new Error("لا يمكن انضمام لاعبين جدد بعد بدء الجلسة.");
    }

    if (Object.keys(this.state.players).length >= MAX_PLAYERS_GLOBAL) {
      throw new Error(
        `الغرفة ممتلئة بالكامل (${MAX_PLAYERS_GLOBAL} لاعبين). لا يمكن انضمام لاعب آخر.`
      );
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
      isBot: Boolean(isBot),
      inJail: false,
      jailTurnsRemaining: 0,
      doublesCount: 0,
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

    const roomTheme = this.state.themeId || this.state.settings?.themeId;
    const effectiveThemeId =
      roomTheme && roomTheme !== "ARABIAN_MAJLIS"
        ? roomTheme
        : pack.themeId || roomTheme || "MONOPOLY_CLASSIC";

    const shouldReskin = Boolean(
      effectiveThemeId &&
      effectiveThemeId !== "ARABIAN_MAJLIS" &&
      effectiveThemeId !== "MONOPOLY_CLASSIC" &&
      effectiveThemeId !== pack.themeId
    );
    // Always work on a private deep copy. Preset and community-map packs are
    // shared module-level objects; mutating their tiles (ownerId, houses) would
    // leak a finished match into the next room that uses the same map.
    const reskinnedPack = shouldReskin
      ? applyThemeToGamePack(pack, effectiveThemeId)
      : (JSON.parse(JSON.stringify(pack)) as GeneratedSessionPack);

    this.state.themeId = effectiveThemeId;
    this.state.themeTitle = reskinnedPack.themeTitle;
    this.state.suggestedTokens = reskinnedPack.suggestedTokens;
    this.state.currencyName = reskinnedPack.currencyName;
    this.state.archetype = reskinnedPack.archetype || "PARTY_ECONOMY";
    this.state.rulesConfig = reskinnedPack.rulesConfig || {
      turnMechanism: "DICE_AND_MOVE",
      cardVisibility: "SECRET_PHONE_ONLY",
      ownershipSystem: "NONE"
    };
    this.state.winCondition = reskinnedPack.winCondition || "MOST_COINS";
    this.state.targetScore = reskinnedPack.targetScore;
    this.state.tiles = reskinnedPack.tiles || [];
    this.state.boardSize = reskinnedPack.tiles?.length || this.state.boardSize || 20;
    this.state.deck = [...(reskinnedPack.cardsDeck || [])];
    this.state.currentRound = 1;
    this.state.currentTurnIndex = 0;
    this.state.midGameInterventionTriggered = false;
    this.state.winner = undefined;
    this.state.victoryReason = undefined;
    this.state.lastDiceRoll = undefined;
    this.state.activeVoteCard = undefined;
    this.state.phase = "TURN_START";
    this.state.territoryState = undefined;
    this.state.mafiaState = undefined;
    this.state.connectFourState = undefined;
    this.state.checkersState = undefined;
    this.state.bingoState = undefined;
    this.state.gameKey = reskinnedPack.key;

    // 1. اكتشاف نوع اللعبة وبناء المحرك المستقل الخاص بها
    this.activeEngine?.dispose?.();
    const gameType = GameEngineRegistry.detectGameType(reskinnedPack);
    this.activeEngine = GameEngineRegistry.createEngine(gameType, this.getEngineContext());
    this.activeEngine.initialize(reskinnedPack);

    // محرك الأقاليم والمافيا يبدآن دورتهما الخاصة فوراً
    if (gameType === "RISK") {
      this.activeEngine.onTurnStart?.(this.getActivePlayerId());
    }

    // 2. توزيع بطاقات البداية على اللاعبين
    const startingHandCount = this.state.rulesConfig?.turnMechanism === "CARD_PLAY_ONLY" ? 4 : 2;
    for (const pid of this.state.turnOrder) {
      const p = this.state.players[pid];
      if (p) {
        p.secretHand = [];
        if (this.state.deck.length > 0) {
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
    }

    this.broadcast("GAME_STARTED", {
      themeTitle: reskinnedPack.themeTitle,
      visualStyle: reskinnedPack.visualStyle,
      narratorIntro: reskinnedPack.narratorIntro,
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
  // 2. استخدام البطاقات السرية
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
  // 3. تفويض الإجراءات لمحركات الألعاب المستقلة
  // ==========================================

  public rollDiceAndMove(playerId: string): void {
    this.assertActiveTurn(playerId, "TURN_START");
    const engine = this.getActiveEngine();
    if (engine.rollDice) {
      engine.rollDice(playerId);
    }
  }

  public resolveLandedTile(player: ExtendedPlayerState, tile: BoardTile): void {
    const engine = this.getActiveEngine();
    if (engine.resolveLandedTile) {
      engine.resolveLandedTile(player, tile);
    }
  }

  public buyProperty(playerId: string, tileIndex?: number): void {
    if (this.state.phase !== "TURN_START" && this.state.phase !== "RESOLVING_TILE") {
      throw new Error(`الإجراء غير مسموح في المرحلة الحالية: ${this.state.phase}`);
    }
    if (this.getActivePlayerId() !== playerId) {
      throw new Error("ليس دورك الآن!");
    }
    const engine = this.getActiveEngine();
    if (engine.buyProperty) {
      engine.buyProperty(playerId, tileIndex);
    } else {
      throw new Error("شراء العقارات غير مدعوم في هذا النمط.");
    }
  }

  public declinePurchase(playerId: string): void {
    const engine = this.getActiveEngine();
    if (engine.declinePurchase) {
      engine.declinePurchase(playerId);
    } else {
      throw new Error("رفض الشراء غير مدعوم في هذا النمط.");
    }
  }

  public buildHouse(playerId: string, tileIndex: number): void {
    if (this.state.phase !== "TURN_START" && this.state.phase !== "RESOLVING_TILE") {
      throw new Error(`الإجراء غير مسموح في المرحلة الحالية: ${this.state.phase}`);
    }
    if (this.getActivePlayerId() !== playerId) {
      throw new Error("ليس دورك الآن!");
    }
    const engine = this.getActiveEngine();
    if (engine.buildHouse) {
      engine.buildHouse(playerId, tileIndex);
    } else {
      throw new Error("تشييد المباني غير مدعوم في هذا النمط.");
    }
  }

  public payJailFine(playerId: string): void {
    if (this.state.phase !== "TURN_START") {
      throw new Error(`الإجراء غير مسموح في المرحلة الحالية: ${this.state.phase}`);
    }
    if (this.getActivePlayerId() !== playerId) {
      throw new Error("ليس دورك الآن!");
    }
    const engine = this.getActiveEngine();
    if (engine.payJailFine) {
      engine.payJailFine(playerId);
    } else {
      throw new Error("دفع الكفالة غير مدعوم في هذا النمط.");
    }
  }

  public moveLudoToken(playerId: string, tokenId: number): LudoMoveResult {
    this.assertActiveTurn(playerId, "TURN_START");
    const engine = this.getActiveEngine();
    if (engine.moveLudoToken) {
      return engine.moveLudoToken(playerId, tokenId);
    }
    throw new Error("الجلسة الحالية ليست من نمط لودو.");
  }

  public dropConnectFourPiece(playerId: string, column: number): void {
    this.assertActiveTurn(playerId, "TURN_START");
    const engine = this.getActiveEngine();
    if (engine.dropConnectFourPiece) {
      engine.dropConnectFourPiece(playerId, column);
      return;
    }
    throw new Error("الجلسة الحالية ليست لعبة كونكت فور.");
  }

  public moveCheckersPiece(
    playerId: string,
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number
  ): void {
    this.assertActiveTurn(playerId, "TURN_START");
    const engine = this.getActiveEngine();
    if (engine.moveCheckersPiece) {
      engine.moveCheckersPiece(playerId, fromRow, fromCol, toRow, toCol);
      return;
    }
    throw new Error("الجلسة الحالية ليست لعبة الضامة.");
  }

  public callBingoNumber(playerId: string): void {
    this.assertActiveTurn(playerId, "TURN_START");
    const engine = this.getActiveEngine();
    if (engine.callBingoNumber) {
      engine.callBingoNumber(playerId);
      return;
    }
    throw new Error("الجلسة الحالية ليست لعبة بينغو.");
  }

  public playUnoCard(
    playerId: string,
    cardId: string,
    chosenColor?: UnoActiveColor
  ): void {
    const engine = this.getActiveEngine();
    if (engine.playUnoCard) {
      engine.playUnoCard(playerId, cardId, chosenColor);
    } else {
      throw new Error("لعبة أونو غير نشطة في هذه الغرفة!");
    }
  }

  public drawUnoCard(playerId: string): void {
    const engine = this.getActiveEngine();
    if (engine.drawUnoCard) {
      engine.drawUnoCard(playerId);
    } else {
      throw new Error("لعبة أونو غير نشطة في هذه الغرفة!");
    }
  }

  /** بعد سحب ورقة قابلة للعب: تمرير الدور مع الاحتفاظ بالورقة. */
  public passUnoAfterDraw(playerId: string): void {
    const engine = this.getActiveEngine();
    if (engine.passUnoAfterDraw) {
      engine.passUnoAfterDraw(playerId);
    } else {
      throw new Error("لعبة أونو غير نشطة في هذه الغرفة!");
    }
  }

  public shoutUno(playerId: string): void {
    const engine = this.getActiveEngine();
    if (engine.shoutUno) {
      engine.shoutUno(playerId);
    } else {
      throw new Error("لعبة أونو غير نشطة في هذه الغرفة!");
    }
  }

  public claimOrAttackTile(playerId: string, targetTileIndex: number): void {
    this.assertActiveTurn(playerId, "TURN_START");
    const engine = this.getActiveEngine();
    if (engine.claimOrAttackTile) {
      engine.claimOrAttackTile(playerId, targetTileIndex);
    }
  }

  public submitPlayerVote(voterId: string, targetPlayerId: string): void {
    const engine = this.getActiveEngine();
    if (engine.submitPlayerVote) {
      engine.submitPlayerVote(voterId, targetPlayerId);
    }
  }

  // ==========================================
  // 3.b إجراءات استراتيجية الأقاليم والمافيا
  // ==========================================

  public endTurn(playerId: string): void {
    const engine = this.getActiveEngine();
    if (!engine.endTurn) {
      throw new Error("إنهاء الدور غير مدعوم في هذا النمط.");
    }
    if (this.state.phase !== "TURN_START") {
      throw new Error(`الإجراء غير مسموح في المرحلة الحالية: ${this.state.phase}`);
    }
    engine.endTurn(playerId);
  }

  public reinforceTile(playerId: string, tileIndex: number, count = 1): void {
    this.assertActiveTurn(playerId, "TURN_START");
    const engine = this.getActiveEngine();
    if (!engine.reinforceTile) {
      throw new Error("التحصين غير مدعوم في هذا النمط.");
    }
    engine.reinforceTile(playerId, tileIndex, count);
  }

  public mafiaNightAction(playerId: string, targetId: string): void {
    const engine = this.getActiveEngine();
    if (!engine.mafiaNightAction) {
      throw new Error("الحركة الليلية غير مدعومة في هذا النمط.");
    }
    engine.mafiaNightAction(playerId, targetId);
  }

  public submitMafiaVote(voterId: string, targetPlayerId: string): void {
    const engine = this.getActiveEngine();
    if (engine.castMafiaVote) {
      engine.castMafiaVote(voterId, targetPlayerId);
      return;
    }
    this.submitPlayerVote(voterId, targetPlayerId);
  }

  public advanceMafiaPhase(): void {
    const engine = this.getActiveEngine();
    if (engine.advanceMafiaPhase) {
      engine.advanceMafiaPhase(true);
    }
  }

  // ==========================================
  // 4. الذكاء الاصطناعي للبوتات
  // ==========================================

  public executeBotTurn(botPlayerId: string): void {
    const engine = this.getActiveEngine();
    if (engine.executeBotTurn) {
      engine.executeBotTurn(botPlayerId);
    } else {
      this.rollDiceAndMove(botPlayerId);
    }
  }

  // ==========================================
  // 5. فحص الفوز وتعاقب الأدوار
  // ==========================================

  public checkVictoryCondition(): { isOver: boolean; winner?: PlayerState; reasonAr: string } {
    return this.getActiveEngine().checkVictory();
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

        // Dynamic mid-game director intervention
        const targetInterventionRound =
          this.state.maxRounds && this.state.maxRounds <= 20
            ? Math.ceil(this.state.maxRounds / 2)
            : 5;

        if (
          !this.state.midGameInterventionTriggered &&
          this.state.currentRound >= targetInterventionRound &&
          this.supportsDirectorIntervention()
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

      if (nextPlayer.isEliminated || nextPlayer.isBankrupt) {
        continue;
      }

      if (nextPlayer.skipNextTurn) {
        nextPlayer.skipNextTurn = false;
        this.broadcast("TURN_SKIPPED", {
          playerId: nextPlayer.id,
          messageAr: `تم تخطي دور ${nextPlayer.name} بسبب عقوبة التجميد!`
        });
        continue;
      }

      this.state.phase = "TURN_START";
      this.getActiveEngine().onTurnStart?.(nextPlayer.id);
      this.broadcast("TURN_CHANGED", {
        activePlayerId: nextPlayer.id,
        currentRound: this.state.currentRound
      });
      this.syncState();
      return;
    }
  }

  /**
   * تدخل «المخرج الذكي» يمنح بطاقة سرية، لذا يقتصر على الألعاب التي تعرض
   * يد البطاقات السرية وتسمح بلعبها (المونوبولي واللوحات المخصصة). ألعاب
   * المهارة والألعاب ذات الواجهات المستقلة لا تستفيد من هذه البطاقات.
   */
  private supportsDirectorIntervention(): boolean {
    const gameType = this.getActiveEngine().gameType;
    return gameType === "MONOPOLY" || gameType === "GENERIC_BOARD";
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

    const allPlayers = Object.values(this.state.players);
    const winner = customVictory?.winner;
    // الفائز أولاً دائماً؛ بقية اللاعبين حسب الرصيد في الألعاب الاقتصادية.
    // عند التعادل لا نتوّج أي لاعب تلقائياً.
    const standings = [...allPlayers].sort((a, b) => {
      if (winner) {
        if (a.id === winner.id) return -1;
        if (b.id === winner.id) return 1;
      }
      return b.coins - a.coins;
    });

    // Generate end-game titles
    const titles = this.generateEndGameTitles();
    this.state.winner = winner as ExtendedPlayerState | undefined;
    this.state.victoryReason = customVictory?.reasonAr;

    this.broadcast("GAME_OVER", {
      winner,
      victoryReason: customVictory?.reasonAr,
      reasonAr: customVictory?.reasonAr,
      standings,
      titles
    });

    const playersToFinalize = Object.values(this.state.players)
      .filter((p) => p.userId)
      .map((p) => ({
        userId: p.userId!,
        isWinner: Boolean(winner && p.id === winner.id),
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

  public syncState(): void {
    this.broadcast("STATE_UPDATED", { state: this.state });
  }

  public resetToLobby(): void {
    this.state.phase = "LOBBY";
    this.state.currentRound = 0;
    this.state.currentTurnIndex = 0;
    this.state.winner = undefined;
    this.state.victoryReason = undefined;
    this.state.lastDiceRoll = undefined;
    this.state.activeVoteCard = undefined;
    this.state.unoState = undefined;
    this.state.isLudo = false;
    this.state.ludoState = undefined;
    this.state.territoryState = undefined;
    this.state.mafiaState = undefined;
    this.state.connectFourState = undefined;
    this.state.checkersState = undefined;
    this.state.bingoState = undefined;
    this.state.gameKey = undefined;
    this.activeEngine?.dispose?.();
    this.activeEngine = null;
    for (const player of Object.values(this.state.players)) {
      player.position = 0;
      player.coins = this.state.settings.startingCoins;
      player.hasShield = false;
      player.skipNextTurn = false;
      player.secretHand = [];
      player.inJail = false;
      player.jailTurnsRemaining = 0;
      player.doublesCount = 0;
      player.isBankrupt = false;
      player.isEliminated = false;
    }
    this.state.freeParkingJackpot = 100;
    this.broadcast("RESET_TO_LOBBY", {});
    this.syncState();
  }
}