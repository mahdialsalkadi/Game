import type { CheckersPiece } from "./gameRoom";

export const CHECKERS_SIZE = 8;

export type CheckersBoard = (CheckersPiece | null)[][];

export interface CheckersMoveOption {
  from: { row: number; col: number };
  to: { row: number; col: number };
  captured?: { row: number; col: number };
}

export function isDarkSquare(row: number, col: number): boolean {
  return (row + col) % 2 === 1;
}

export function createCheckersBoard(
  topPlayerId: string,
  bottomPlayerId: string
): CheckersBoard {
  const board: CheckersBoard = Array.from({ length: CHECKERS_SIZE }, () =>
    Array.from({ length: CHECKERS_SIZE }, () => null)
  );

  for (let row = 0; row < CHECKERS_SIZE; row++) {
    for (let col = 0; col < CHECKERS_SIZE; col++) {
      if (!isDarkSquare(row, col)) continue;
      if (row < 3) {
        board[row][col] = { playerId: topPlayerId, king: false };
      } else if (row > 4) {
        board[row][col] = { playerId: bottomPlayerId, king: false };
      }
    }
  }

  return board;
}

function directionsFor(
  piece: CheckersPiece,
  playerId: string,
  topPlayerId: string
): Array<[number, number]> {
  if (piece.king) {
    return [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1]
    ];
  }

  // لاعب الصفوف العليا يتقدم نزولاً، والسفلي يصعد.
  return playerId === topPlayerId
    ? [
        [1, -1],
        [1, 1]
      ]
    : [
        [-1, -1],
        [-1, 1]
      ];
}

export function getMovesForPiece(
  board: CheckersBoard,
  row: number,
  col: number,
  topPlayerId: string
): CheckersMoveOption[] {
  const piece = board[row]?.[col];
  if (!piece) return [];

  const moves: CheckersMoveOption[] = [];
  for (const [dr, dc] of directionsFor(piece, piece.playerId, topPlayerId)) {
    const nextRow = row + dr;
    const nextCol = col + dc;
    if (
      nextRow < 0 ||
      nextRow >= CHECKERS_SIZE ||
      nextCol < 0 ||
      nextCol >= CHECKERS_SIZE
    ) {
      continue;
    }

    const occupant = board[nextRow][nextCol];
    if (!occupant) {
      moves.push({ from: { row, col }, to: { row: nextRow, col: nextCol } });
      continue;
    }

    if (occupant.playerId === piece.playerId) continue;

    const jumpRow = row + dr * 2;
    const jumpCol = col + dc * 2;
    if (
      jumpRow < 0 ||
      jumpRow >= CHECKERS_SIZE ||
      jumpCol < 0 ||
      jumpCol >= CHECKERS_SIZE
    ) {
      continue;
    }

    if (!board[jumpRow][jumpCol]) {
      moves.push({
        from: { row, col },
        to: { row: jumpRow, col: jumpCol },
        captured: { row: nextRow, col: nextCol }
      });
    }
  }

  return moves;
}

/**
 * كل الحركات القانونية للاعب. الأكل إجباري: إن وُجد أي أكل لا تُعاد
 * الحركات العادية. ويمكن تقييد البحث بقطعة واحدة أثناء سلسلة أكل.
 */
export function getAllLegalMoves(
  board: CheckersBoard,
  playerId: string,
  topPlayerId: string,
  mustFrom?: { row: number; col: number }
): CheckersMoveOption[] {
  const moves: CheckersMoveOption[] = [];

  if (mustFrom) {
    // أثناء سلسلة أكل، لا يُسمح بإنهاء السلسلة بحركة عادية.
    return getMovesForPiece(board, mustFrom.row, mustFrom.col, topPlayerId).filter(
      (move) =>
        Boolean(move.captured) &&
        board[mustFrom.row][mustFrom.col]?.playerId === playerId
    );
  }

  for (let row = 0; row < CHECKERS_SIZE; row++) {
    for (let col = 0; col < CHECKERS_SIZE; col++) {
      const piece = board[row][col];
      if (piece?.playerId === playerId) {
        moves.push(...getMovesForPiece(board, row, col, topPlayerId));
      }
    }
  }

  const captures = moves.filter((move) => move.captured);
  return captures.length > 0 ? captures : moves;
}

export function countCheckersPieces(board: CheckersBoard, playerId: string): number {
  return board.reduce(
    (total, row) =>
      total + row.filter((piece) => piece?.playerId === playerId).length,
    0
  );
}

export function promoteIfNeeded(
  piece: CheckersPiece,
  row: number,
  playerId: string,
  topPlayerId: string
): boolean {
  if (piece.king) return false;
  const reachedLastRow =
    playerId === topPlayerId ? row === CHECKERS_SIZE - 1 : row === 0;
  if (!reachedLastRow) return false;
  piece.king = true;
  return true;
}

export function selectBestCheckersMove(
  board: CheckersBoard,
  playerId: string,
  topPlayerId: string,
  mustFrom?: { row: number; col: number }
): CheckersMoveOption | null {
  const moves = getAllLegalMoves(board, playerId, topPlayerId, mustFrom);
  if (moves.length === 0) return null;

  const captures = moves.filter((move) => move.captured);
  if (captures.length > 0) {
    return captures[Math.floor(Math.random() * captures.length)];
  }

  // بدون أكل: حركة عشوائية من الحركات المتاحة.
  return moves[Math.floor(Math.random() * moves.length)];
}
