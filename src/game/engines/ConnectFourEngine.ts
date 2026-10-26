import type { IGameEngine, GameType, VictoryCheckResult, EngineContext } from "./types";
import type { GeneratedSessionPack } from "../schema";
import {
  CONNECT_FOUR_COLUMNS,
  CONNECT_FOUR_ROWS,
  createConnectFourBoard,
  getDropRow,
  findConnectFourWin,
  getPlayableColumns,
  selectBestConnectFourColumn
} from "../connectFourEngine";

export class ConnectFourEngine implements IGameEngine {
  public readonly gameType: GameType = "CONNECT_FOUR";

  constructor(private ctx: EngineContext) {}

  public initialize(_pack: GeneratedSessionPack): void {
    const s = this.ctx.state;
    s.boardSize = CONNECT_FOUR_COLUMNS;
    s.tiles = [];
    s.rulesConfig = {
      turnMechanism: "GRID_PLACEMENT",
      cardVisibility: "NO_HAND_CARDS",
      ownershipSystem: "NONE"
    };
    s.winCondition = "FIRST_TO_FINISH";
    s.connectFourState = {
      board: createConnectFourBoard(),
      moveCount: 0
    };

    for (const pid of s.turnOrder) {
      const player = s.players[pid];
      if (player) {
        player.position = 0;
        player.isBankrupt = false;
        player.isEliminated = false;
      }
    }
  }

  public dropConnectFourPiece(playerId: string, column: number): void {
    const s = this.ctx.state;
    const state = s.connectFourState;
    const player = s.players[playerId];
    if (!state || !player) {
      throw new Error("جلسة كونكت فور غير جاهزة.");
    }

    if (!Number.isInteger(column) || column < 0 || column >= CONNECT_FOUR_COLUMNS) {
      throw new Error("العمود المطلوب غير موجود على اللوحة.");
    }
    if (s.phase !== "TURN_START") {
      throw new Error("لا يمكن إسقاط قرص الآن.");
    }

    const row = getDropRow(state.board, column);
    if (row === null) {
      throw new Error("هذا العمود ممتلئ! اختر عموداً آخر.");
    }

    state.board[row][column] = playerId;
    state.moveCount += 1;
    state.lastMove = { playerId, row, col: column };
    state.winningCells = undefined;

    const win = findConnectFourWin(state.board, playerId, row, column);
    if (win) {
      state.winningCells = win;
    }

    this.ctx.broadcast("CONNECT_FOUR_DROPPED", {
      playerId,
      playerName: player.name,
      column,
      row,
      board: state.board,
      winningCells: state.winningCells,
      messageAr: win
        ? `أكمل ${player.name} أربعة على التوالي وحسم اللعبة! 🏆`
        : `أسقط ${player.name} قرصه في العمود ${column + 1}.`
    });

    if (win) {
      this.ctx.endGame({
        winner: player,
        reasonAr: "أكمل خطاً متصلاً من أربعة أقراص وحقق الفوز! 🔴🟡"
      });
      return;
    }

    if (getPlayableColumns(state.board).length === 0) {
      this.ctx.endGame({
        reasonAr: "امتلأت اللوحة دون خط فوز — تعادل مشرف! 🤝"
      });
      return;
    }

    this.ctx.advanceTurn();
  }

  public checkVictory(): VictoryCheckResult {
    const s = this.ctx.state;
    const state = s.connectFourState;
    if (!state?.lastMove || !state.winningCells?.length) {
      return { isOver: false, reasonAr: "" };
    }

    const winner = s.players[state.lastMove.playerId];
    if (!winner) return { isOver: false, reasonAr: "" };

    return {
      isOver: true,
      winner,
      reasonAr: "أكمل خطاً متصلاً من أربعة أقراص وحقق الفوز! 🔴🟡"
    };
  }

  public executeBotTurn(botPlayerId: string): void {
    const state = this.ctx.state.connectFourState;
    if (!state) return;

    const opponentIds = Object.keys(this.ctx.state.players).filter(
      (id) => id !== botPlayerId
    );
    const column = selectBestConnectFourColumn(state.board, botPlayerId, opponentIds);

    if (column === null) {
      this.ctx.advanceTurn();
      return;
    }

    this.dropConnectFourPiece(botPlayerId, column);
  }
}
