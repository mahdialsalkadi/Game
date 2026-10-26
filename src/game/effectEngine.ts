import type { AtomicEffect } from "./schema";
import { recordUserActionInStore } from "./behavioralDNA";

// 1. حالة اللاعب الواحد داخل الخادم
export interface PlayerState {
  id: string;
  name: string;
  color: string;
  coins: number;
  position: number;
  hasShield: boolean;
  skipNextTurn: boolean;
  userId?: string;
  isBankrupt?: boolean;
  isEliminated?: boolean;
  // إحصائيات الجلسة لتغذية "ذاكرة الشلة" وألقاب النهاية (Wrapped)
  stats: {
    coinsStolen: number;
    timesBetrayedBy: Record<string, number>; // سجل من غدر بهذا اللاعب
    shieldsTriggered: number;
  };
}

// 2. حالة الغرفة الكاملة
export interface GameRoomState {
  roomId: string;
  boardSize: number; // 20 مربعاً في النسخة الأولية
  passStartBonus: number; // مكافأة المرور على مربع البداية (مثلاً 100)
  currencyName: string;
  players: Record<string, PlayerState>;
  pendingVote?: {
    isActive: boolean;
    penaltyValue: number;
    votes: Record<string, string>; // voterId -> targetPlayerId
  };
  winCondition?: string;
}

// 3. سياق التنفيذ (من سحب البطاقة؟ ومن اختار كهدف من شاشة جواله؟)
export interface ExecutionContext {
  sourcePlayerId: string;
  chosenTargetId?: string; // يُرسل من جوال اللاعب إذا كان الهدف CHOSEN_PLAYER
  votedLoserId?: string;   // يُمرر بعد انتهاء الـ 15 ثانية الخاصة بالتصويت
}

// 4. سجل المخرجات الذي يُرسل للشاشة الرئيسية لتشغيل الأنيميشن والصوت
export interface AnimationEvent {
  type: "COIN_CHANGE" | "STEAL" | "MOVE" | "SWAP" | "SHIELD_BLOCK" | "STATUS" | "START_VOTE";
  sourceId: string;
  targetIds: string[];
  value?: number;
  messageAr: string; // النص الذي يظهر في شريط الراوي الذكي أعلى الشاشة
}

/**
 * الدالة الأولى: تحديد اللاعبين المستهدفين بناءً على نوع الهدف (targetType)
 */
function resolveTargets(
  state: GameRoomState,
  effect: AtomicEffect,
  ctx: ExecutionContext
): PlayerState[] {
  const allPlayers = Object.values(state.players);
  const sourcePlayer = state.players[ctx.sourcePlayerId];
  const others = allPlayers.filter((p) => p.id !== ctx.sourcePlayerId);

  if (!sourcePlayer || allPlayers.length === 0) return [];

  switch (effect.targetType) {
    case "SELF":
      return [sourcePlayer];

    case "CHOSEN_PLAYER": {
      if (ctx.chosenTargetId && state.players[ctx.chosenTargetId]) {
        return [state.players[ctx.chosenTargetId]];
      }
      // خطة بديلة آمنة: إذا لم يحدد اللاعب هدفاً قبل انتهاء الوقت، نختار خصماً عشوائياً
      const randomFallback = others[Math.floor(Math.random() * others.length)];
      return randomFallback ? [randomFallback] : [];
    }

    case "RICHEST_PLAYER": {
      const sortedByWealth = [...allPlayers].sort((a, b) => b.coins - a.coins);
      return [sortedByWealth[0]];
    }

    case "POOREST_PLAYER": {
      const sortedByPoverty = [...allPlayers].sort((a, b) => a.coins - b.coins);
      return [sortedByPoverty[0]];
    }

    case "RANDOM_OTHER": {
      if (others.length === 0) return [];
      const randomTarget = others[Math.floor(Math.random() * others.length)];
      return [randomTarget];
    }

    case "ALL_OTHERS":
      return others;
  }
}

/**
 * الدالة الثانية: فحص ما إذا كان التأثير عدائياً وهل يمتلك الهدف درع حماية
 */
function tryConsumeShield(
  source: PlayerState,
  target: PlayerState,
  effect: AtomicEffect,
  eventsLog: AnimationEvent[]
): boolean {
  // اللاعب لا يصد البطاقات التي يلعبها على نفسه
  if (source.id === target.id || !target.hasShield) return false;

  const isHostileAction =
    (effect.actionType === "MODIFY_COINS" && effect.value < 0) ||
    (effect.actionType === "MOVE_STEPS" && effect.value < 0) ||
    effect.actionType === "STEAL_COINS" ||
    effect.actionType === "SWAP_POSITIONS" ||
    effect.actionType === "SKIP_TURN" ||
    effect.actionType === "TAX_PERCENTAGE";

  if (isHostileAction) {
    target.hasShield = false; // استهلاك الدرع
    target.stats.shieldsTriggered += 1;
    eventsLog.push({
      type: "SHIELD_BLOCK",
      sourceId: source.id,
      targetIds: [target.id],
      messageAr: `تحطم درع ${target.name} وصد الهجوم بنجاح!`
    });
    return true; // تم صد التأثير
  }

  return false;
}

/**
 * الدالة الرئيسية: تنفيذ مصفوفة التأثيرات الذرية للبطاقة أو المربع
 */
export function executeCardEffects(
  state: GameRoomState,
  effects: AtomicEffect[],
  ctx: ExecutionContext
): AnimationEvent[] {
  const eventsLog: AnimationEvent[] = [];
  const sourcePlayer = state.players[ctx.sourcePlayerId];
  if (!sourcePlayer) return eventsLog;

  for (const effect of effects) {
    // حالة خاصة: بطاقات التصويت الجماعي
    if (effect.actionType === "VOTE_PENALTY") {
      if (!ctx.votedLoserId) {
        // المرحلة 1: فتح نافذة التصويت على هواتف الجميع لمدة 15 ثانية
        state.pendingVote = {
          isActive: true,
          penaltyValue: -Math.abs(effect.value),
          votes: {}
        };
        eventsLog.push({
          type: "START_VOTE",
          sourceId: sourcePlayer.id,
          targetIds: Object.keys(state.players),
          value: effect.value,
          messageAr: "بدأ التصويت السري على هواتفكم! لديكم 15 ثانية."
        });
        continue;
      } else {
        // المرحلة 2: تطبيق العقوبة على اللاعب الذي حصل على أعلى أصوات
        const loser = state.players[ctx.votedLoserId];
        if (loser) {
          const deduction = Math.abs(effect.value);
          loser.coins = Math.max(0, loser.coins - deduction);
          eventsLog.push({
            type: "COIN_CHANGE",
            sourceId: sourcePlayer.id,
            targetIds: [loser.id],
            value: -deduction,
            messageAr: `حكمت الأغلبية ضد ${loser.name}! خسر ${deduction} ${state.currencyName}.`
          });
        }
        state.pendingVote = undefined;
        continue;
      }
    }

    // تحديد الأهداف لباقي الأوامر
    const targets = resolveTargets(state, effect, ctx);

    for (const target of targets) {
      // فحص الدرع قبل تنفيذ أي إجراء عدائي
      if (tryConsumeShield(sourcePlayer, target, effect, eventsLog)) {
        continue;
      }

      switch (effect.actionType) {
        case "MODIFY_COINS": {
          const previousCoins = target.coins;
          target.coins = Math.max(0, target.coins + effect.value);
          const actualDelta = target.coins - previousCoins;

          eventsLog.push({
            type: "COIN_CHANGE",
            sourceId: sourcePlayer.id,
            targetIds: [target.id],
            value: actualDelta,
            messageAr:
              actualDelta >= 0
                ? `حصل ${target.name} على ${actualDelta} ${state.currencyName}!`
                : `خسر ${target.name} ${Math.abs(actualDelta)} ${state.currencyName}!`
          });
          break;
        }

        case "STEAL_COINS": {
          const requestedSteal = Math.abs(effect.value);
          const actualStolen = Math.min(target.coins, requestedSteal);

          target.coins -= actualStolen;
          sourcePlayer.coins += actualStolen;

          sourcePlayer.stats.coinsStolen += actualStolen;
          target.stats.timesBetrayedBy[sourcePlayer.id] =
            (target.stats.timesBetrayedBy[sourcePlayer.id] || 0) + 1;

          if (sourcePlayer.userId) {
            recordUserActionInStore(sourcePlayer.userId, "STEAL_COINS", { victimId: target.id, actualStolen });
          }

          eventsLog.push({
            type: "STEAL",
            sourceId: sourcePlayer.id,
            targetIds: [target.id],
            value: actualStolen,
            messageAr: `قام ${sourcePlayer.name} بسرقة ${actualStolen} ${state.currencyName} من ${target.name}!`
          });
          break;
        }

        case "MOVE_STEPS": {
          const oldPos = target.position;
          const rawNewPos = oldPos + effect.value;

          if (state.winCondition === "FIRST_TO_FINISH") {
            const maxPos = state.boardSize - 1;
            let bounced = false;
            if (rawNewPos === maxPos) {
              target.position = maxPos;
            } else if (rawNewPos > maxPos) {
              // Exact roll required to land on 100 (or bounce back if roll exceeds 100)
              bounced = true;
              const excess = rawNewPos - maxPos;
              target.position = Math.max(0, maxPos - excess);
            } else {
              target.position = Math.max(0, rawNewPos);
            }

            eventsLog.push({
              type: "MOVE",
              sourceId: sourcePlayer.id,
              targetIds: [target.id],
              value: effect.value,
              messageAr: bounced
                ? `تجاوز ${target.name} خط النهاية برمي ${effect.value} وارتد إلى المربع #${target.position + 1}!`
                : effect.value >= 0
                ? `تقدم ${target.name} ${effect.value} خطوات للأمام.`
                : `تراجع ${target.name} ${Math.abs(effect.value)} خطوات للخلف!`
            });
          } else {
            target.position =
              ((rawNewPos % state.boardSize) + state.boardSize) % state.boardSize;

            const passedStart = effect.value > 0 && rawNewPos >= state.boardSize;
            if (passedStart) {
              target.coins += state.passStartBonus;
            }

            eventsLog.push({
              type: "MOVE",
              sourceId: sourcePlayer.id,
              targetIds: [target.id],
              value: effect.value,
              messageAr:
                effect.value >= 0
                  ? `تقدم ${target.name} ${effect.value} خطوات للأمام.`
                  : `تراجع ${target.name} ${Math.abs(effect.value)} خطوات للخلف!`
            });
          }
          break;
        }

        case "SWAP_POSITIONS": {
          if (sourcePlayer.id === target.id) break;
          const tempPos = sourcePlayer.position;
          sourcePlayer.position = target.position;
          target.position = tempPos;

          target.stats.timesBetrayedBy[sourcePlayer.id] =
            (target.stats.timesBetrayedBy[sourcePlayer.id] || 0) + 1;

          eventsLog.push({
            type: "SWAP",
            sourceId: sourcePlayer.id,
            targetIds: [target.id],
            messageAr: `بدّل ${sourcePlayer.name} موقعه على اللوحة مع ${target.name}!`
          });
          break;
        }

        case "SKIP_TURN": {
          target.skipNextTurn = true;
          eventsLog.push({
            type: "STATUS",
            sourceId: sourcePlayer.id,
            targetIds: [target.id],
            messageAr: `تم تجميد ${target.name} للدور القادم!`
          });
          break;
        }

        case "GRANT_SHIELD": {
          target.hasShield = true;
          eventsLog.push({
            type: "STATUS",
            sourceId: sourcePlayer.id,
            targetIds: [target.id],
            messageAr: `حصل ${target.name} على درع حماية ضد الهجمات!`
          });
          break;
        }

        case "TAX_PERCENTAGE": {
          const percent = Math.min(100, Math.max(0, Math.abs(effect.value)));
          const taxAmount = Math.floor(target.coins * (percent / 100));
          target.coins -= taxAmount;

          eventsLog.push({
            type: "COIN_CHANGE",
            sourceId: sourcePlayer.id,
            targetIds: [target.id],
            value: -taxAmount,
            messageAr: `ضريبة مفاجئة بنسبة ${percent}%! دفع ${target.name} مبلغ ${taxAmount} ${state.currencyName}.`
          });
          break;
        }
      }
    }
  }

  return eventsLog;
}
