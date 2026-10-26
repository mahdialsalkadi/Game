/**
 * Unified Game Engine Architecture Types
 * Fully separates game engines (Monopoly, Ludo, Uno, Snakes & Ladders)
 * from generic quantitative parameterizations.
 */

import type { ExtendedPlayerState, FullRoomState, RoomPhase, BroadcastFn } from "../gameRoom";
import type { BoardTile, GameCard, GeneratedSessionPack } from "../schema";
import type { PlayerState } from "../effectEngine";

export type GameType =
  | "MONOPOLY"
  | "LUDO"
  | "UNO"
  | "SNAKES_AND_LADDERS"
  | "RISK"
  | "MAFIA"
  | "CONNECT_FOUR"
  | "CHECKERS"
  | "BINGO"
  | "GENERIC_BOARD";

export interface VictoryCheckResult {
  isOver: boolean;
  winner?: PlayerState;
  reasonAr: string;
}

export interface EngineActionResult {
  success: boolean;
  messageAr?: string;
  data?: Record<string, unknown>;
  advanceTurnAfter?: boolean;
}

export interface EngineContext {
  state: FullRoomState;
  broadcast: BroadcastFn;
  syncState: () => void;
  advanceTurn: () => void;
  endGame: (victory?: { winner?: PlayerState; reasonAr: string }) => void;
  getActivePlayerId: () => string;
}

/**
 * Common Contract for all Dedicated Game Engines
 */
export interface IGameEngine {
  readonly gameType: GameType;

  /**
   * Initializes the game with the pack, board tiles, or deck
   */
  initialize(pack: GeneratedSessionPack): void;

  /**
   * Rolling dice (for dice-based games: Monopoly, Ludo, Snakes & Ladders)
   */
  rollDice?(playerId: string): void;

  /**
   * Handle generic or specialized actions
   */
  handleAction?(actionType: string, playerId: string, payload: Record<string, unknown>): EngineActionResult;

  /**
   * Victory check specific to this game's mechanics
   */
  checkVictory(): VictoryCheckResult;

  /**
   * Bot auto-play logic for this specific game
   */
  executeBotTurn?(botPlayerId: string): void;

  /**
   * Called by the room whenever the turn passes to a new player.
   * Used for per-turn income / action points (Risk, Monopoly, ...).
   */
  onTurnStart?(playerId: string): void;

  /**
   * Voluntary end of the current turn (multi-action games such as Risk).
   */
  endTurn?(playerId: string): void;

  /**
   * Resolve landed tile (for board games)
   */
  resolveLandedTile?(player: ExtendedPlayerState, tile: BoardTile): void;

  // --- Monopoly Specific Capabilities ---
  buyProperty?(playerId: string, tileIndex?: number): void;
  declinePurchase?(playerId: string): void;
  buildHouse?(playerId: string, tileIndex: number): void;
  payJailFine?(playerId: string): void;

  // --- Ludo Specific Capabilities ---
  moveLudoToken?(playerId: string, tokenId: number): any;

  // --- Connect Four Specific Capabilities ---
  dropConnectFourPiece?(playerId: string, column: number): void;

  // --- Checkers Specific Capabilities ---
  moveCheckersPiece?(
    playerId: string,
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number
  ): void;

  // --- Bingo Specific Capabilities ---
  callBingoNumber?(playerId: string): void;

  // --- Uno Specific Capabilities ---
  playUnoCard?(playerId: string, cardId: string, chosenColor?: any): void;
  drawUnoCard?(playerId: string): void;
  passUnoAfterDraw?(playerId: string): void;
  shoutUno?(playerId: string): void;

  // --- Generic / Territory / Voting Board Capabilities ---
  claimOrAttackTile?(playerId: string, targetTileIndex: number): void;
  submitPlayerVote?(voterId: string, targetPlayerId: string): void;

  // --- Risk / Territory Strategy Capabilities ---
  reinforceTile?(playerId: string, tileIndex: number, count?: number): void;

  // --- Mafia / Social Deduction Capabilities ---
  mafiaNightAction?(playerId: string, targetId: string): void;
  castMafiaVote?(voterId: string, targetPlayerId: string): void;
  advanceMafiaPhase?(force?: boolean): void;

  /** Clears any internal timers when a room resets. */
  dispose?(): void;
}
