import type { FullRoomState } from "@/game/gameRoom";

/** الخصائص المشتركة التي تمررها غرفة العرض إلى طاولة كل لعبة. */
export interface GameTableProps {
  gameState: FullRoomState;
  sendAction: (payload: Record<string, unknown>) => void;
  lastAnimation: any;
  visualPositions: Record<string, number>;
  displayedDice: number | null;
  isRollingDice: boolean;
  isSpectator?: boolean;
  /** يفتح نافذة الدعوة (QR) المملوكة لشاشة الغرفة. */
  onOpenInvite?: () => void;
  /** يفتح قائمة الغرفة. */
  onOpenMenu?: () => void;
}

export function diceValuesFromState(gameState: FullRoomState): number[] {
  if (gameState.lastDiceRoll) {
    return [gameState.lastDiceRoll.dice1, gameState.lastDiceRoll.dice2].filter(
      (value): value is number => typeof value === "number"
    );
  }
  return [1];
}
