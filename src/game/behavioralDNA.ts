import {
  type PlayerBehavioralDNA,
  createDefaultDNA,
  getUserById,
  updateUserDNA
} from "./userStore";

export { type PlayerBehavioralDNA, createDefaultDNA };

/**
 * دالة حساب اللقب السلوكي المتطور تلقائياً
 */
export function calculateArchetypeTitle(dna: PlayerBehavioralDNA): string {
  const { aggressionScore, capitalistScore, tacticalCardScore, socialVoterScore } = dna;

  // إذا كانت جميع المؤشرات متقاربة وأقل من أو تساوي 35
  const maxScore = Math.max(aggressionScore, capitalistScore, tacticalCardScore, socialVoterScore);
  if (maxScore <= 35) {
    return "المغامر المتوازن 🎲";
  }

  // تحديد النزعة الغالبة
  if (capitalistScore === maxScore) {
    return "الإمبراطور الرأسمالي 🏦";
  }
  if (aggressionScore === maxScore) {
    return "الجنرال الفاتح ⚔️";
  }
  if (tacticalCardScore === maxScore) {
    return "المخطط التكتيكي 🃏";
  }
  if (socialVoterScore === maxScore) {
    return "داهية المجلس 🕵️";
  }

  return "المغامر المتوازن 🎲";
}

/**
 * معالجة وتحديث سلوك اللاعب اللحظي عند اتخاذ قرارات داخل اللعبة
 */
export function processPlayerAction(
  dna: PlayerBehavioralDNA,
  actionType:
    | "BUY_PROPERTY"
    | "RENT_COLLECTED"
    | "CLAIM_OR_ATTACK_TILE"
    | "STEAL_COINS"
    | "PLAY_SECRET_CARD"
    | "DRAW_CARD"
    | "SUBMIT_VOTE",
  payload?: any
): PlayerBehavioralDNA {
  switch (actionType) {
    case "BUY_PROPERTY":
      dna.capitalistScore = Math.min(100, dna.capitalistScore + 5);
      break;

    case "RENT_COLLECTED":
      dna.capitalistScore = Math.min(100, dna.capitalistScore + 3);
      break;

    case "CLAIM_OR_ATTACK_TILE":
      dna.aggressionScore = Math.min(100, dna.aggressionScore + 6);
      if (payload?.targetPlayerId) {
        dna.nemesisMap[payload.targetPlayerId] = (dna.nemesisMap[payload.targetPlayerId] || 0) + 1;
      }
      break;

    case "STEAL_COINS":
      dna.aggressionScore = Math.min(100, dna.aggressionScore + 5);
      if (payload?.victimId) {
        dna.nemesisMap[payload.victimId] = (dna.nemesisMap[payload.victimId] || 0) + 1;
      }
      break;

    case "PLAY_SECRET_CARD":
      dna.tacticalCardScore = Math.min(100, dna.tacticalCardScore + 4);
      if (payload?.chosenTargetId) {
        dna.nemesisMap[payload.chosenTargetId] = (dna.nemesisMap[payload.chosenTargetId] || 0) + 1;
      }
      break;

    case "DRAW_CARD":
      dna.tacticalCardScore = Math.min(100, dna.tacticalCardScore + 2);
      break;

    case "SUBMIT_VOTE":
      dna.socialVoterScore = Math.min(100, dna.socialVoterScore + 4);
      if (payload?.targetPlayerId) {
        dna.nemesisMap[payload.targetPlayerId] = (dna.nemesisMap[payload.targetPlayerId] || 0) + 1;
      }
      break;
  }

  dna.archetypeTitle = calculateArchetypeTitle(dna);
  dna.lastUpdated = new Date().toISOString();

  return dna;
}

/**
 * ختام الجلسة وتحديث ملف اللاعب السلوكي الدائم
 */
export function finalizeGameDNA(
  dna: PlayerBehavioralDNA,
  isWinner: boolean,
  finalCoins?: number
): PlayerBehavioralDNA {
  dna.gamesPlayed += 1;
  if (isWinner) {
    dna.winsCount += 1;
  }

  if (finalCoins && finalCoins > 300) {
    dna.capitalistScore = Math.min(100, dna.capitalistScore + 5);
  }

  dna.archetypeTitle = calculateArchetypeTitle(dna);
  dna.lastUpdated = new Date().toISOString();

  return dna;
}

/**
 * حفظ التحديث مباشرة في مستودع الحسابات إذا كان اللاعب مسجلاً
 */
export async function recordUserActionInStore(
  userId: string,
  actionType:
    | "BUY_PROPERTY"
    | "RENT_COLLECTED"
    | "CLAIM_OR_ATTACK_TILE"
    | "STEAL_COINS"
    | "PLAY_SECRET_CARD"
    | "DRAW_CARD"
    | "SUBMIT_VOTE",
  payload?: any
): Promise<void> {
  try {
    const user = await getUserById(userId);
    if (!user) return;

    processPlayerAction(user.dna, actionType, payload);
    await updateUserDNA(userId, user.dna);
  } catch (err) {
    console.warn(`[BehavioralDNA] Failed to update DNA for user ${userId}:`, err);
  }
}

/**
 * إنهاء اللعبة لجميع اللاعبين وتحديث سجلاتهم
 */
export async function finalizeGameForUsers(
  playersWithUserId: Array<{ userId: string; isWinner: boolean; finalCoins: number }>
): Promise<void> {
  for (const p of playersWithUserId) {
    try {
      const user = await getUserById(p.userId);
      if (user) {
        finalizeGameDNA(user.dna, p.isWinner, p.finalCoins);
        await updateUserDNA(p.userId, user.dna);
      }
    } catch (err) {
      console.warn(`[BehavioralDNA] Failed to finalize game for user ${p.userId}:`, err);
    }
  }
}
