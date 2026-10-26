export const BINGO_SIZE = 5;
export const BINGO_MAX_NUMBER = 75;
export const BINGO_FREE_VALUE = 0;

export type BingoGrid = number[][];
export type BingoMarks = boolean[][];

export interface BingoCard {
  grid: BingoGrid;
  marked: BingoMarks;
  lines: number;
  markedCount: number;
}

const COLUMN_RANGES: Array<[number, number]> = [
  [1, 15],
  [16, 30],
  [31, 45],
  [46, 60],
  [61, 75]
];

export function bingoColumnLetter(col: number): string {
  return ["B", "I", "N", "G", "O"][col] || "?";
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickUniqueNumbers(min: number, max: number, count: number): number[] {
  const pool = new Set<number>();
  while (pool.size < count) {
    pool.add(randomInt(min, max));
  }
  return [...pool];
}

export function createBingoCard(): BingoCard {
  const grid: BingoGrid = Array.from({ length: BINGO_SIZE }, () =>
    Array.from({ length: BINGO_SIZE }, () => 0)
  );

  for (let col = 0; col < BINGO_SIZE; col++) {
    const [min, max] = COLUMN_RANGES[col];
    const numbers = pickUniqueNumbers(min, max, BINGO_SIZE);
    for (let row = 0; row < BINGO_SIZE; row++) {
      grid[row][col] = numbers[row];
    }
  }

  grid[2][2] = BINGO_FREE_VALUE;

  const marked: BingoMarks = Array.from({ length: BINGO_SIZE }, () =>
    Array.from({ length: BINGO_SIZE }, () => false)
  );
  marked[2][2] = true;

  const card: BingoCard = {
    grid,
    marked,
    lines: 0,
    markedCount: 1
  };
  card.lines = countCompletedLines(marked);
  return card;
}

export function countCompletedLines(marked: BingoMarks): number {
  let lines = 0;

  for (let row = 0; row < BINGO_SIZE; row++) {
    if (marked[row].every(Boolean)) lines++;
  }

  for (let col = 0; col < BINGO_SIZE; col++) {
    let complete = true;
    for (let row = 0; row < BINGO_SIZE; row++) {
      if (!marked[row][col]) {
        complete = false;
        break;
      }
    }
    if (complete) lines++;
  }

  let mainDiagonal = true;
  let antiDiagonal = true;
  for (let i = 0; i < BINGO_SIZE; i++) {
    if (!marked[i][i]) mainDiagonal = false;
    if (!marked[i][BINGO_SIZE - 1 - i]) antiDiagonal = false;
  }
  if (mainDiagonal) lines++;
  if (antiDiagonal) lines++;

  return lines;
}

export function markBingoNumber(card: BingoCard, number: number): boolean {
  if (number <= 0) return false;

  for (let row = 0; row < BINGO_SIZE; row++) {
    for (let col = 0; col < BINGO_SIZE; col++) {
      if (card.grid[row][col] === number) {
        if (!card.marked[row][col]) {
          card.marked[row][col] = true;
          card.markedCount += 1;
        }
        card.lines = countCompletedLines(card.marked);
        return true;
      }
    }
  }

  return false;
}

/** وصف الخط المكتمل للعرض، أو null إذا لم يكتمل أي خط. */
export function describeCompletedLine(marked: BingoMarks): string | null {
  for (let row = 0; row < BINGO_SIZE; row++) {
    if (marked[row].every(Boolean)) {
      return `الصف ${row + 1}`;
    }
  }

  for (let col = 0; col < BINGO_SIZE; col++) {
    let complete = true;
    for (let row = 0; row < BINGO_SIZE; row++) {
      if (!marked[row][col]) {
        complete = false;
        break;
      }
    }
    if (complete) return `العمود ${bingoColumnLetter(col)}`;
  }

  let mainDiagonal = true;
  let antiDiagonal = true;
  for (let i = 0; i < BINGO_SIZE; i++) {
    if (!marked[i][i]) mainDiagonal = false;
    if (!marked[i][BINGO_SIZE - 1 - i]) antiDiagonal = false;
  }
  if (mainDiagonal) return "القطر الرئيسي";
  if (antiDiagonal) return "القطر المعاكس";

  return null;
}

export function makeBingoCallDeck(): number[] {
  return Array.from({ length: BINGO_MAX_NUMBER }, (_, index) => index + 1);
}
