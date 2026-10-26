export const CONNECT_FOUR_COLUMNS = 7;
export const CONNECT_FOUR_ROWS = 6;

export type ConnectFourBoard = (string | null)[][];

export interface ConnectFourCell {
  row: number;
  col: number;
}

export function createConnectFourBoard(): ConnectFourBoard {
  return Array.from({ length: CONNECT_FOUR_ROWS }, () =>
    Array.from({ length: CONNECT_FOUR_COLUMNS }, () => null)
  );
}

/** يعيد أقل صف فارغ في العمود، أو null إذا كان العمود ممتلئاً. */
export function getDropRow(board: ConnectFourBoard, col: number): number | null {
  if (col < 0 || col >= CONNECT_FOUR_COLUMNS) return null;
  for (let row = CONNECT_FOUR_ROWS - 1; row >= 0; row--) {
    if (!board[row][col]) return row;
  }
  return null;
}

export function isColumnPlayable(board: ConnectFourBoard, col: number): boolean {
  return getDropRow(board, col) !== null;
}

export function getPlayableColumns(board: ConnectFourBoard): number[] {
  return Array.from({ length: CONNECT_FOUR_COLUMNS }, (_, col) => col).filter((col) =>
    isColumnPlayable(board, col)
  );
}

/** يبحث عن خلايا الفوز الأربع المارة بآخر قطعة، أو null. */
export function findConnectFourWin(
  board: ConnectFourBoard,
  playerId: string,
  row: number,
  col: number
): ConnectFourCell[] | null {
  const directions: Array<[number, number]> = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  for (const [dr, dc] of directions) {
    const line: ConnectFourCell[] = [{ row, col }];

    for (const sign of [1, -1] as const) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (
        r >= 0 &&
        r < CONNECT_FOUR_ROWS &&
        c >= 0 &&
        c < CONNECT_FOUR_COLUMNS &&
        board[r][c] === playerId
      ) {
        if (sign === 1) {
          line.push({ row: r, col: c });
        } else {
          line.unshift({ row: r, col: c });
        }
        r += dr * sign;
        c += dc * sign;
      }
    }

    if (line.length >= 4) {
      return line.slice(0, 4);
    }
  }

  return null;
}

/** فحص سريع: هل يسقط اللاعب في هذا العمود فيصنع أربعة؟ */
export function winningColumnForPlayer(
  board: ConnectFourBoard,
  playerId: string
): number | null {
  for (const col of getPlayableColumns(board)) {
    const row = getDropRow(board, col);
    if (row === null) continue;
    board[row][col] = playerId;
    const win = findConnectFourWin(board, playerId, row, col);
    board[row][col] = null;
    if (win) return col;
  }
  return null;
}

/**
 * اختيار عمود للبوت: يفوز إن أمكن، يمنع خصم الخصم إن أمكن، ثم يفضّل
 * الأعمدة الوسطى مع قدر صغير من العشوائية.
 */
export function selectBestConnectFourColumn(
  board: ConnectFourBoard,
  botPlayerId: string,
  opponentIds: string[]
): number | null {
  const winning = winningColumnForPlayer(board, botPlayerId);
  if (winning !== null) return winning;

  for (const opponentId of opponentIds) {
    const blocking = winningColumnForPlayer(board, opponentId);
    if (blocking !== null) return blocking;
  }

  const columns = getPlayableColumns(board);
  if (columns.length === 0) return null;

  const centerDistance = (col: number) => Math.abs(col - 3);
  columns.sort((a, b) => centerDistance(a) - centerDistance(b));

  // أحياناً يلعب البوت عموداً مجاوراً حتى لا يصبح توقيعه حتمياً.
  const playful = Math.random() < 0.18 && columns.length > 1;
  return playful ? columns[1] : columns[0];
}
