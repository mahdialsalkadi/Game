import type { IGameEngine, GameType, VictoryCheckResult, EngineContext } from "./types";
import type { GeneratedSessionPack, BoardTile } from "../schema";
import { recordUserActionInStore } from "../behavioralDNA";
import {
  TERRITORY_ACTIONS_PER_TURN,
  TERRITORY_ATTACK_COST,
  TERRITORY_CASUALTY_COST,
  TERRITORY_INCOME_UNIT,
  TERRITORY_REINFORCE_COST,
  TERRITORY_WIN_RATIO
} from "../territoryConfig";

export {
  TERRITORY_ACTIONS_PER_TURN,
  TERRITORY_ATTACK_COST,
  TERRITORY_CASUALTY_COST,
  TERRITORY_INCOME_UNIT,
  TERRITORY_REINFORCE_COST,
  TERRITORY_WIN_RATIO
};

/**
 * TerritoryEngine — محرك "غزو العالم" (Risk)
 * ------------------------------------------
 * لا نرد حركة ولا شراء عقارات: كل دور = تعزيز + ٣ أوامر (فتح/هجوم/تحصين) + تمركز.
 * التقدم يُقاس بعدد الأقاليم، والرصيد ("كتيبة") هو احتياطي التعزيز والهجوم.
 *
 * قواعد مطبقة:
 *  - توزيع الأقاليم المحايدة على اللاعبين في البداية (٦٠٪ موزعة، ٤٠٪ محايدة).
 *  - دخل كل دور = (٣ + الأقاليم÷٣) كتائب.
 *  - فتح إقليم محايد = سعره نقداً + كتيبة دفاع واحدة.
 *  - هجوم = ٢٠ كتيبة، نردات المهاجم (٣) تُقارن أعلى نردين منها بنردي المدافع؛
 *    كل مقارنة يخسرها المدافع كتيبة، وكل مقارنة يخسرها المهاجم تكلفه احتياطاً إضافياً.
 *  - تحصين = ٢٠ كتيبة لكل كتيبة إضافية على إقليم تملكه.
 *  - الفوز عند ٧٥٪ من الأقاليم أو بقاء لاعب واحد.
 */

function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a);
}

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export class TerritoryEngine implements IGameEngine {
  public readonly gameType: GameType = "RISK";

  constructor(private ctx: EngineContext) {}

  /** الأقاليم القابلة للسيطرة: كل مربع ليس مقر قيادة (START). */
  public static isRegion(tile: BoardTile): boolean {
    return tile.tileType !== "START";
  }

  private get regions(): BoardTile[] {
    return this.ctx.state.tiles.filter(TerritoryEngine.isRegion);
  }

  public initialize(pack: GeneratedSessionPack): void {
    const s = this.ctx.state;
    s.boardSize = pack.tiles?.length || 20;
    s.tiles = (pack.tiles || []).map((tile) => ({ ...tile, ownerId: null, armies: 0 }));
    s.deck = [...(pack.cardsDeck || [])];
    s.rulesConfig = pack.rulesConfig || {
      turnMechanism: "TERRITORY_COMMAND",
      cardVisibility: "NO_HAND_CARDS",
      ownershipSystem: "CONQUER_REGIONS"
    };
    s.winCondition = pack.winCondition || "LAST_SURVIVOR";

    const playerIds = s.turnOrder.filter((id) => {
      const p = s.players[id];
      return p && !p.isEliminated;
    });

    const claimable = shuffle(this.regions);
    const perPlayer = Math.max(2, Math.floor((claimable.length * 0.6) / Math.max(1, playerIds.length)));
    let cursor = 0;

    for (const playerId of playerIds) {
      const player = s.players[playerId];
      player.position = 0;
      player.coins = Math.max(player.coins, s.settings.startingCoins || 250);
      for (let i = 0; i < perPlayer && cursor < claimable.length; i++) {
        const tile = s.tiles[claimable[cursor].index];
        if (!tile) continue;
        tile.ownerId = playerId;
        tile.armies = 2;
        cursor++;
      }
    }

    for (; cursor < claimable.length; cursor++) {
      const tile = s.tiles[claimable[cursor].index];
      if (tile) {
        tile.ownerId = null;
        tile.armies = 1;
      }
    }

    s.territoryState = {
      actionsLeft: TERRITORY_ACTIONS_PER_TURN,
      activePlayerId: s.turnOrder[s.currentTurnIndex],
      turnIncome: 0,
      turnNumber: 1
    };

    this.ctx.broadcast("TERRITORY_DEPLOYED", {
      messageAr: "تم توزيع الأقاليم! عزّز دفاعاتك وابدأ الفتوحات.",
      regionsCount: this.regions.length
    });
  }

  public onTurnStart(playerId: string): void {
    const s = this.ctx.state;
    this.ensureState();
    const t = s.territoryState!;
    if (t.activePlayerId === playerId && t.actionsLeft > 0 && t.turnIncome > 0) {
      return;
    }

    t.activePlayerId = playerId;
    t.actionsLeft = TERRITORY_ACTIONS_PER_TURN;
    t.turnNumber = (t.turnNumber || 1) + (t.lastSettledPlayerId === playerId ? 0 : 1);
    t.lastSettledPlayerId = playerId;

    const player = s.players[playerId];
    if (player) {
      const owned = this.regions.filter((tile) => tile.ownerId === playerId).length;
      const units = 3 + Math.floor(owned / 3);
      const income = units * TERRITORY_INCOME_UNIT;
      player.coins += income;
      t.turnIncome = income;
      this.ctx.broadcast("TERRITORY_INCOME", {
        playerId,
        playerName: player.name,
        income,
        owned,
        actionsLeft: t.actionsLeft,
        messageAr: `${player.name} استلم ${units} كتائب تعزيز = ${income} ${s.currencyName} (3 أساس + ${Math.floor(owned / 3)} من ${owned} إقليماً). لديه ${t.actionsLeft} أوامر.`
      });
    }

    this.ctx.syncState();
  }

  public claimOrAttackTile(playerId: string, targetTileIndex: number): void {
    const s = this.ctx.state;
    this.ensureState();
    const t = s.territoryState!;
    const player = s.players[playerId];
    const tile = s.tiles[targetTileIndex];

    if (!player) throw new Error("اللاعب غير موجود.");
    if (!tile || !TerritoryEngine.isRegion(tile)) {
      throw new Error("هذا المربع ليس إقليماً قابلاً للسيطرة.");
    }
    if (t.activePlayerId !== playerId) {
      throw new Error("ليس دورك في القيادة الآن!");
    }
    if (t.actionsLeft <= 0) {
      throw new Error("نفدت أوامرك لهذا الدور. أنهِ الدور أو انتظر خصمك.");
    }
    if (tile.ownerId === playerId) {
      throw new Error("هذا الإقليم خاضع لسيطرتك بالفعل.");
    }

    if (!tile.ownerId) {
      const cost = tile.price || 50;
      if (player.coins < cost) {
        throw new Error(`احتياطك لا يكفي لفتح الإقليم (${cost} ${s.currencyName} مطلوبة).`);
      }
      player.coins -= cost;
      tile.ownerId = playerId;
      tile.armies = Math.max(1, tile.armies || 1);

      this.broadcastAction("TERRITORY_CLAIMED", {
        playerId,
        targetTileIndex,
        tile,
        cost,
        messageAr: `فرض ${player.name} سيطرته على ${tile.name}!`
      });
    } else {
      if (player.coins < TERRITORY_ATTACK_COST) {
        throw new Error(`الهجوم يحتاج ${TERRITORY_ATTACK_COST} ${s.currencyName} كتيبة احتياط.`);
      }

      const defenderId = tile.ownerId;
      const defender = s.players[defenderId];
      const defenderArmies = tile.armies || 1;

      player.coins -= TERRITORY_ATTACK_COST;

      const attackerRolls = rollDice(3);
      const defenderRolls = rollDice(Math.min(2, Math.max(1, defenderArmies)));

      // قاعدة النرد: نقارن أعلى نردين للمهاجم بنردي المدافع (الدفاع يفوز بالتعادل).
      const comparisons = Math.min(2, attackerRolls.length, defenderRolls.length);
      let defenderLosses = 0;
      let attackerLosses = 0;
      for (let i = 0; i < comparisons; i++) {
        if (attackerRolls[i] > defenderRolls[i]) defenderLosses += 1;
        else attackerLosses += 1;
      }

      const casualtyCost = attackerLosses * TERRITORY_CASUALTY_COST;
      const paidCasualtyCost = Math.min(player.coins, casualtyCost);
      player.coins -= paidCasualtyCost;

      const remainingDefenders = Math.max(0, defenderArmies - defenderLosses);
      const captured = remainingDefenders === 0;
      tile.armies = captured ? 0 : remainingDefenders;

      if (captured) {
        tile.ownerId = playerId;
        tile.armies = 1;
        player.coins += 30;
      }

      const attackerWins = defenderLosses > attackerLosses;
      const diceLine = `🎲 المهاجم [${attackerRolls.join("، ")}] ضد المدافع [${defenderRolls.join("، ")}]`;
      const lossesLine =
        attackerLosses > 0
          ? ` خسائر المهاجم: ${attackerLosses} كتيبة (${paidCasualtyCost} ${s.currencyName}).`
          : " لم يخسر المهاجم أي كتيبة.";

      t.lastBattle = {
        attackerId: playerId,
        defenderId,
        tileIndex: targetTileIndex,
        attackerRolls,
        defenderRolls,
        attackerWins: attackerWins || captured,
        captured,
        defenderLosses,
        attackerLosses,
        casualtyCost: paidCasualtyCost,
        messageAr: captured
          ? `⚔️ ${player.name} اجتاح ${tile.name} وطرد ${defender?.name || "الخصم"}! ${diceLine}. خسر المدافع ${defenderLosses} كتيبة.${lossesLine}`
          : attackerWins
          ? `⚔️ هجوم ${player.name} أوقع ${defenderLosses} خسارة في ${tile.name} (المتبقي: ${tile.armies} كتيبة). ${diceLine}.${lossesLine}`
          : defenderLosses > 0
          ? `🛡️ تبادل خسائر على ${tile.name}: المدافع فقد ${defenderLosses} كتيبة (المتبقي: ${tile.armies}). ${diceLine}.${lossesLine}`
          : `🛡️ صد ${defender?.name || "المدافع"} هجوم ${player.name} بالكامل على ${tile.name}. ${diceLine}.${lossesLine}`
      };

      this.broadcastAction("TERRITORY_BATTLE", {
        ...t.lastBattle,
        targetTileIndex,
        tile
      });

      if (defender) {
        const defenderStillOwns = this.regions.some((rt) => rt.ownerId === defender.id);
        if (!defenderStillOwns) {
          defender.isEliminated = true;
          this.ctx.broadcast("PLAYER_ELIMINATED", {
            playerId: defender.id,
            playerName: defender.name,
            messageAr: `☠️ خرج ${defender.name} من الخريطة بالكامل!`
          });
        }
      }

      if (player.userId) {
        recordUserActionInStore(player.userId, "CLAIM_OR_ATTACK_TILE", {
          targetTileIndex,
          targetPlayerId: defenderId,
          captured
        });
      }
    }

    this.spendAction(playerId);
  }

  public reinforceTile(playerId: string, tileIndex: number, count = 1): void {
    const s = this.ctx.state;
    this.ensureState();
    const t = s.territoryState!;
    const player = s.players[playerId];
    const tile = s.tiles[tileIndex];

    if (!player || !tile) throw new Error("الإقليم غير موجود.");
    if (t.activePlayerId !== playerId) throw new Error("ليس دورك في القيادة الآن!");
    if (t.actionsLeft <= 0) throw new Error("نفدت أوامرك لهذا الدور.");
    if (tile.ownerId !== playerId) throw new Error("لا يمكنك تحصين إقليم لا تملكه.");

    const troops = Math.max(1, Math.min(5, Math.round(count)));
    const cost = troops * TERRITORY_REINFORCE_COST;
    if (player.coins < cost) {
      throw new Error(`التحصين يحتاج ${cost} ${s.currencyName} (لديك ${player.coins}).`);
    }

    player.coins -= cost;
    tile.armies = (tile.armies || 1) + troops;

    this.broadcastAction("TERRITORY_REINFORCED", {
      playerId,
      targetTileIndex: tileIndex,
      troops,
      cost,
      tile,
      messageAr: `${player.name} حصّن ${tile.name} بـ ${troops} كتيبة (المجموع: ${tile.armies}).`
    });

    this.spendAction(playerId);
  }

  public endTurn(playerId: string): void {
    this.ensureState();
    const t = this.ctx.state.territoryState!;
    if (t.activePlayerId !== playerId) throw new Error("ليس دورك الآن.");
    t.actionsLeft = 0;
    this.ctx.broadcast("TERRITORY_TURN_ENDED", {
      playerId,
      messageAr: "تم تمرير القيادة للجنرال التالي."
    });
    this.ctx.advanceTurn();
  }

  private spendAction(playerId: string): void {
    const s = this.ctx.state;
    const t = s.territoryState!;
    t.actionsLeft = Math.max(0, t.actionsLeft - 1);

    this.ctx.syncState();

    const victory = this.checkVictory();
    if (victory.isOver) {
      this.ctx.endGame(victory);
      return;
    }

    if (t.actionsLeft <= 0) {
      this.ctx.broadcast("TERRITORY_ACTIONS_EXHAUSTED", {
        playerId,
        messageAr: "نفدت أوامرك. ينتقل الدور تلقائياً."
      });
      this.ctx.advanceTurn();
    } else {
      this.ctx.broadcast("TERRITORY_ACTION_SPENT", {
        playerId,
        actionsLeft: t.actionsLeft,
        messageAr: `تبقى لك ${t.actionsLeft} أوامر.`
      });
    }
  }

  private broadcastAction(eventType: string, payload: Record<string, unknown>): void {
    this.ctx.broadcast(eventType, payload);
  }

  private ensureState(): void {
    const s = this.ctx.state;
    if (!s.territoryState) {
      s.territoryState = {
        actionsLeft: TERRITORY_ACTIONS_PER_TURN,
        activePlayerId: s.turnOrder[s.currentTurnIndex],
        turnIncome: 0,
        turnNumber: 1
      };
    }
  }

  public checkVictory(): VictoryCheckResult {
    const s = this.ctx.state;
    const players = Object.values(s.players).filter((p) => !p.isEliminated);
    if (players.length === 0) return { isOver: false, reasonAr: "" };

    const regions = this.regions;

    if (players.length === 1 && Object.keys(s.players).length > 1) {
      return {
        isOver: true,
        winner: players[0],
        reasonAr: "آخر جنرال صامد على الخريطة.. سيطرته أصبحت مطلقة! 👑"
      };
    }

    if (regions.length > 0) {
      for (const player of players) {
        const owned = regions.filter((tile) => tile.ownerId === player.id).length;
        if (owned / regions.length >= TERRITORY_WIN_RATIO) {
          return {
            isOver: true,
            winner: player,
            reasonAr: `سيطر ${player.name} على ${Math.round((owned / regions.length) * 100)}٪ من الأقاليم وتجاوز قاعدة 75% للغزو الشامل! ⚔️`,
          };
        }
      }
    }

    return { isOver: false, reasonAr: "" };
  }

  public executeBotTurn(botPlayerId: string): void {
    const s = this.ctx.state;
    this.ensureState();
    const t = s.territoryState!;
    if (t.activePlayerId !== botPlayerId) return;

    const player = s.players[botPlayerId];
    if (!player) return;

    for (let step = 0; step < TERRITORY_ACTIONS_PER_TURN; step++) {
      if (t.actionsLeft <= 0 || s.phase === "GAME_OVER") break;
      if (t.activePlayerId !== botPlayerId) break;
      const live = s.players[botPlayerId];
      if (!live || live.isEliminated) break;

      const enemyTiles = this.regions.filter((tile) => tile.ownerId && tile.ownerId !== botPlayerId);
      // البوت يفضّل الأقاليم الضعيفة، ثم المحايدة الأرخص
      const weakestEnemy = [...enemyTiles].sort((a, b) => (a.armies || 1) - (b.armies || 1))[0];
      const neutral = this.regions
        .filter((tile) => !tile.ownerId)
        .sort((a, b) => (a.price || 50) - (b.price || 50))[0];

      try {
        if (weakestEnemy && (weakestEnemy.armies || 1) <= 2 && live.coins >= TERRITORY_ATTACK_COST + 40) {
          this.claimOrAttackTile(botPlayerId, weakestEnemy.index);
        } else if (neutral && live.coins >= (neutral.price || 50) + 20) {
          this.claimOrAttackTile(botPlayerId, neutral.index);
        } else if (live.coins >= TERRITORY_REINFORCE_COST) {
          const home = this.regions
            .filter((tile) => tile.ownerId === botPlayerId)
            .sort((a, b) => (a.armies || 1) - (b.armies || 1))[0];
          if (home) this.reinforceTile(botPlayerId, home.index, 1);
          else break;
        } else {
          break;
        }
      } catch {
        break;
      }
    }

    if (t.actionsLeft > 0 && t.activePlayerId === botPlayerId && s.phase !== "GAME_OVER") {
      try {
        this.endTurn(botPlayerId);
      } catch {
        /* ignore */
      }
    }
  }
}
