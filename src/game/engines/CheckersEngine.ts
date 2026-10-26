import type { IGameEngine, GameType, VictoryCheckResult, EngineContext } from "./types";
import type { GeneratedSessionPack } from "../schema";
import {
  createCheckersBoard,
  getAllLegalMoves,
  getMovesForPiece,
  countCheckersPieces,
  promoteIfNeeded,
  selectBestCheckersMove,
  CHECKERS_SIZE
} from "../checkersEngine";

const DRAW_PLY_LIMIT = 80;

export class CheckersEngine implements IGameEngine {
  public readonly gameType: GameType = "CHECKERS";

  constructor(private ctx: EngineContext) {}

  public initialize(_pack: GeneratedSessionPack): void {
    const s = this.ctx.state;
    if (s.turnOrder.length < 2) {
      throw new Error("الضامة تحتاج لاعبين اثنين لبدء اللعبة.");
    }

    const topPlayerId = s.turnOrder[0];
    const bottomPlayerId = s.turnOrder[1];
    s.boardSize = CHECKERS_SIZE;
    s.tiles = [];
    s.rulesConfig = {
      turnMechanism: "CHECKERS_MOVE",
      cardVisibility: "NO_HAND_CARDS",
      ownershipSystem: "NONE"
    };
    s.winCondition = "LAST_SURVIVOR";
    s.checkersState = {
      board: createCheckersBoard(topPlayerId, bottomPlayerId),
      topPlayerId,
      bottomPlayerId,
      moveCountWithoutCapture: 0
    };

    for (const iterator of s.turnOrder) {
      const player = s.players[iterator];
      if (player) {
        player.position = 0;
        player.isBankrupt = false;
        player.isEliminated = false;
      }
    }
  }

  public moveCheckersPiece(
    playerId: string,
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number
  ): void {
    const s = this.ctx.state;
    const state = s.checkersState;
    const player = s.players[playerId];
    if (!state || !player) {
      throw new Error("جلسة الضامة غير جاهزة.");
    }
    if (s.phase !== "TURN_START") {
      throw new Error("لا يمكن تحريك قطعة الآن.");
    }

    const pending = state.pendingCapture;
    if (pending && pending.playerId !== playerId) {
      throw new Error("على الخصم إكمال سلسلة الأكل أولاً.");
    }
    if (pending && (pending.row !== fromRow || pending.col !== fromCol)) {
      throw new Error("يجب متابعة الأكل بالقطعة نفسها.");
    }

    const legalMoves = getAllLegalMoves(
      state.board,
      playerId,
      state.topPlayerId,
      pending ? { row: fromRow, col: fromCol } : undefined
    );
    const move = legalMoves.find(
      (option) => option.to.row === toRow && option.to.col === toCol
    );

    if (!move) {
      const hasForcedCapture = !pending && legalMoves.some((option) => option.captured);
      throw new Error(
        hasForcedCapture
          ? "الأكل إجباري! اختر حركة الأكل المتاحة."
          : "هذه الحركة غير قانونية على لوحة الضامة."
      );
    }

    const piece = state.board[fromRow][fromCol];
    if (!piece || piece.playerId !== playerId) {
      throw new Error("لا توجد قطعة لك في هذا المربع.");
    }

    state.board[fromRow][fromCol] = null;
    state.board[toRow][toCol] = piece;

    let captured = false;
    if (move.captured) {
      captured = true;
      state.board[move.captured.row][move.captured.col] = null;
    }

    const promoted = promoteIfNeeded(piece, toRow, playerId, state.topPlayerId);
    state.lastMove = {
      playerId,
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      captured: move.captured,
      promoted
    };

    state.moveCountWithoutCapture = captured || promoted
      ? 0
      : state.moveCountWithoutCapture + 1;

    const opponentId =
      playerId === state.topPlayerId ? state.bottomPlayerId : state.topPlayerId;
    const opponentPieces = countCheckersPieces(state.board, opponentId);

    if (opponentPieces === 0) {
      state.pendingCapture = undefined;
      this.ctx.broadcast("CHECKERS_MOVED", {
        playerId,
        move: state.lastMove,
        board: state.board,
        pendingCapture: undefined,
        messageAr: `أطاح ${player.name} بآخر قطع الخصم وحسم اللعبة! 👑`
      });
      this.ctx.endGame({
        winner: player,
        reasonAr: "أسر كل قطع الخصم وتوّج نفسه ملكاً على الرقعة! 👑"
      });
      return;
    }

    // هل يمكن للقطعة نفسها متابعة الأكل؟ عندها يبقى الدور لها.
    const furtherCaptures = getMovesForPiece(
      state.board,
      toRow,
      toCol,
      state.topPlayerId
    ).filter((option) => Boolean(option.captured));

    state.pendingCapture =
      captured && furtherCaptures.length > 0
        ? { playerId, row: toRow, col: toCol }
        : undefined;

    const chained = Boolean(state.pendingCapture);
    state.lastMove = { ...state.lastMove, chained };

    this.ctx.broadcast("CHECKERS_MOVED", {
      playerId,
      move: state.lastMove,
      board: state.board,
      pendingCapture: state.pendingCapture,
      messageAr: chained
        ? `أكل ${player.name} قطعة ويمكنه متابعة الأكل بالقطعة نفسها! ⚡`
        : captured
        ? `اقتحم ${player.name} قطعة خصم وأرسلها خارج الرقعة! 💥`
        : promoted
        ? `توّج ${player.name} قطعته ملكاً! 👑`
        : `حرّك ${player.name} قطعته على الرقعة.`
    });

    if (state.moveCountWithoutCapture >= DRAW_PLY_LIMIT) {
      this.ctx.endGame({
        reasonAr: "استمرت الرقعة طويلاً دون أكل أو ترقية — تعادل مشرف! 🤝"
      });
      return;
    }

    if (chained) {
      // الدور نفسه يكمل سلسلة الأكل.
      s.phase = "TURN_START";
      this.ctx.syncState();
      return;
    }

    this.ctx.advanceTurn();
  }

  public checkVictory(): VictoryCheckResult {
    const s = this.ctx.state;
    const state = s.checkersState;
    if (!state) return { isOver: false, reasonAr: "" };

    const topPieces = countCheckersPieces(state.board, state.topPlayerId);
    const bottomPieces = countCheckersPieces(state.board, state.bottomPlayerId);

    if (topPieces === 0 && bottomPieces === 0) {
      return { isOver: true, reasonAr: "سقط كل الجيوش — تعادل! 🤝" };
    }
    if (topPieces === 0) {
      return {
        isOver: true,
        winner: s.players[state.bottomPlayerId],
        reasonAr: "أطاح بكل قطع الخصم وتوّج نفسه ملكاً! 👑"
      };
    }
    if (bottomPieces === 0) {
      return {
        isOver: true,
        winner: s.players[state.topPlayerId],
        reasonAr: "أطاح بكل قطع الخصم وتوّج نفسه ملكاً! 👑"
      };
    }

    // اللاعب النشط بلا حركة قانونية يخسر (يشمل الأكل الإجباري المسدود).
    const activeId = this.ctx.getActivePlayerId();
    const activeMoves = getAllLegalMoves(
      state.board,
      activeId,
      state.topPlayerId,
      state.pendingCapture?.playerId === activeId
        ? { row: state.pendingCapture.row, col: state.pendingCapture.col }
        : undefined
    );

    if (activeMoves.length === 0) {
      const opponentId =
        activeId === state.topPlayerId ? state.bottomPlayerId : state.topPlayerId;
      return {
        isOver: true,
        winner: s.players[opponentId],
        reasonAr: "حوصر الخصم بلا حركة قانونية — استسلام الجيش! 🏳️"
      };
    }

    return { isOver: false, reasonAr: "" };
  }

  public executeBotTurn(botPlayerId: string): void {
    const state = this.ctx.state.checkersState;
    if (!state) return;

    const pending =
      state.pendingCapture?.playerId === botPlayerId
        ? { row: state.pendingCapture.row, col: state.pendingCapture.col }
        : undefined;

    const move = selectBestCheckersMove(
      state.board,
      botPlayerId,
      state.topPlayerId,
      pending
    );

    if (!move) {
      const opponentId =
        botPlayerId === state.topPlayerId ? state.bottomPlayerId : state.topPlayerId;
      this.ctx.endGame({
        winner: this.ctx.state.players[opponentId],
        reasonAr: "لم يجد البوت أي حركة قانونية وخسر المواجهة! 🏳️"
      });
      return;
    }

    this.moveCheckersPiece(
      botPlayerId,
      move.from.row,
      move.from.col,
      move.to.row,
      move.to.col
    );
  }
}
