import type { FullRoomState } from "@/game/gameRoom";
import type { RulebookId } from "@/game/rulebooks";

/** الألعاب التي يعتمد ترتيبها وفوزها على الرصيد/العملة. */
export function gameUsesCurrency(rulebookId: RulebookId): boolean {
  return rulebookId === "MONOPOLY" || rulebookId === "RISK" || rulebookId === "GENERIC";
}

const WIN_ACHIEVEMENTS: Record<RulebookId, string> = {
  MONOPOLY: "👑 احتكار السوق",
  RISK: "🌍 غزو الأقاليم",
  LUDO: "🎲 وصل للمركز",
  UNO: "🃏 أونو!",
  SNAKES_AND_LADDERS: "🪜 وصل للمربع 100",
  MAFIA: "🕵️ حسم التصويت",
  CONNECT_FOUR: "🔴 أربعة على التوالي",
  CHECKERS: "👑 ملك الرقعة",
  BINGO: "🎱 بينغو!",
  GENERIC: "🏆 بطل الحزمة"
};

export function getWinnerAchievement(rulebookId: RulebookId): string {
  return WIN_ACHIEVEMENTS[rulebookId] || WIN_ACHIEVEMENTS.GENERIC;
}

/**
 * ترتيب نتائج النهاية: الفائز أولاً، ثم الرصيد في الألعاب الاقتصادية،
 * أو ترتيب الأدوار في الألعاب التي لا تستخدم العملة. لا يتوّج لاعباً
 * تلقائياً عند التعادل.
 */
export function orderGameStandings<T extends { id: string; coins: number }>(
  standings: T[],
  state: FullRoomState,
  rulebookId: RulebookId,
  winnerId?: string
): T[] {
  const turnOrder = new Map(state.turnOrder.map((id, index) => [id, index]));
  return [...standings].sort((a, b) => {
    if (winnerId) {
      if (a.id === winnerId) return -1;
      if (b.id === winnerId) return 1;
    }
    if (gameUsesCurrency(rulebookId)) {
      return b.coins - a.coins;
    }
    return (turnOrder.get(a.id) ?? 999) - (turnOrder.get(b.id) ?? 999);
  });
}

/** إحصائية قصيرة لكل لاعب في شاشة النتائج بدل الرصيد غير ذي الصلة. */
export function getPlayerResultStat(
  rulebookId: RulebookId,
  playerId: string,
  state: FullRoomState
): string {
  const player = state.players[playerId];

  switch (rulebookId) {
    case "CONNECT_FOUR": {
      const board = state.connectFourState?.board || [];
      const discs = board.reduce(
        (total, row) => total + row.filter((cell) => cell === playerId).length,
        0
      );
      return `${discs} قرص على اللوحة`;
    }
    case "CHECKERS": {
      const board = state.checkersState?.board || [];
      let pieces = 0;
      let kings = 0;
      for (const row of board) {
        for (const piece of row) {
          if (piece?.playerId !== playerId) continue;
          pieces += 1;
          if (piece.king) kings += 1;
        }
      }
      return `${pieces} قطعة · ${kings} ملك`;
    }
    case "BINGO":
      return `${state.bingoState?.cards?.[playerId]?.lines || 0} خط مكتمل`;
    case "LUDO":
      return `${state.ludoState?.players?.[playerId]?.finishedCount || 0}/4 في المركز`;
    case "UNO": {
      // في الحالة الحقيقية توجد playerHands، وفي الحالة المرسلة للعميل
      // توجد playerCardCounts (يد اللاعب فقط تكون مكشوفة له).
      const uno = state.unoState as any;
      const count =
        uno?.playerCardCounts?.[playerId] ??
        uno?.playerHands?.[playerId]?.length ??
        (player as any)?.secretHandCount ??
        0;
      return `${count} ورقة في اليد`;
    }
    case "SNAKES_AND_LADDERS":
      // position داخلياً من 0 إلى 99، لكن اللاعب يرى المربع 1 إلى 100.
      return `المربع ${(player?.position ?? 0) + 1}`;
    case "MAFIA": {
      const role = state.mafiaState?.roles?.[playerId];
      if (role === "MAFIA") return "عضو المافيا 🕵️";
      if (role === "DETECTIVE") return "المحقق 🔎";
      return "مواطن 🏛️";
    }
    case "RISK": {
      const regions = state.tiles.filter((tile) => tile.ownerId === playerId).length;
      return `${regions} إقليم`;
    }
    default:
      return `${player?.coins ?? 0} ${state.currencyName || "ذهبة"}`;
  }
}
