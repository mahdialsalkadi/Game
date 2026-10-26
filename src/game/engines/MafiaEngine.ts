import type { IGameEngine, GameType, VictoryCheckResult, EngineContext } from "./types";
import type { GeneratedSessionPack } from "../schema";
import { recordUserActionInStore } from "../behavioralDNA";
import type { MafiaRole } from "../gameRoom";

/**
 * MafiaEngine — محرك "المافيا والجاسوس"
 * -------------------------------------
 * لعبة نقاش اجتماعي لا تعتمد على النرد أو الأدوار المتعاقبة، بل على دورة:
 *   توزيع الأدوار → ليل (اختيار ضحية + تحقيق) → نهار (نقاش) → تصويت → إقصاء → ليل…
 *
 * كل لاعب يرى دوره فقط (يُخفي الخادم بقية الأدوار قبل الإرسال).
 * المحرك يدعم البوتات ويقود المراحل بمؤقتات، مع إمكانية تخطي المرحلة من المضيف.
 */

export const MAFIA_PHASE_MS = {
  ROLE_REVEAL: 10000,
  NIGHT: 20000,
  DAY: 40000,
  VOTE: 25000,
  RESOLUTION: 5000
} as const;

const ROLE_NAMES_AR: Record<MafiaRole, string> = {
  MAFIA: "المافيا",
  DETECTIVE: "المحقق",
  CITIZEN: "مواطن"
};

export class MafiaEngine implements IGameEngine {
  public readonly gameType: GameType = "MAFIA";
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(private ctx: EngineContext) {}

  // ==========================================
  // التهيئة وتوزيع الأدوار
  // ==========================================
  public initialize(pack: GeneratedSessionPack): void {
    this.clearTimers();
    const s = this.ctx.state;

    s.boardSize = pack.tiles?.length || 1;
    s.tiles = pack.tiles || [];
    s.deck = [];
    s.rulesConfig = pack.rulesConfig || {
      turnMechanism: "SOCIAL_DISCUSSION_VOTE",
      cardVisibility: "OPEN_PUBLIC_CARDS",
      ownershipSystem: "NONE"
    };
    s.winCondition = "LAST_SURVIVOR";
    s.phase = "SOCIAL_PHASE";

    const playerIds = s.turnOrder.filter((id) => s.players[id]);
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    // توزيع متوازن: مافيا واحدة لكل ~4 لاعبين مع تقريب لأقرب عدد صحيح.
    // يضمن وجود مافيا واحدة على الأقل ويمنع طغيان العصابة في الجلسات الصغيرة.
    const mafiaCount = Math.max(1, Math.round(playerIds.length / 4));

    const roles: Record<string, MafiaRole> = {};
    shuffled.forEach((id, index) => {
      if (index < mafiaCount) roles[id] = "MAFIA";
      else if (index === mafiaCount && playerIds.length >= 3) roles[id] = "DETECTIVE";
      else roles[id] = "CITIZEN";
    });

    s.mafiaState = {
      phase: "ROLE_REVEAL",
      day: 1,
      roles,
      votes: {},
      eliminated: [],
      deadline: Date.now() + MAFIA_PHASE_MS.ROLE_REVEAL,
      phaseDurationMs: MAFIA_PHASE_MS.ROLE_REVEAL,
      lastSummary: `تم توزيع الأدوار! بينكم ${mafiaCount} من المافيا. افحصوا جوالاتكم سراً.`
    };

    this.ctx.broadcast("MAFIA_ROLES_DEALT", {
      mafiaCount,
      playersCount: playerIds.length,
      deadline: s.mafiaState.deadline,
      messageAr: `🕵️ بدأت الجلسة! تم توزيع ${mafiaCount} دور مافيا سراً على الجوالات.`
    });

    this.ctx.syncState();
    this.schedule(() => this.beginNight(), MAFIA_PHASE_MS.ROLE_REVEAL);
  }

  // ==========================================
  // دورة المراحل
  // ==========================================
  public advanceMafiaPhase(force = false): void {
    const m = this.ctx.state.mafiaState;
    if (!m) return;

    switch (m.phase) {
      case "ROLE_REVEAL":
        this.beginNight();
        break;
      case "NIGHT":
        this.resolveNight();
        break;
      case "DAY":
        this.beginVote();
        break;
      case "VOTE":
        this.resolveVote();
        break;
      case "RESOLUTION":
        this.beginNight();
        break;
      default:
        if (force) this.beginNight();
    }
  }

  private beginNight(): void {
    if (this.gameOver()) return;
    this.clearTimers();
    const s = this.ctx.state;
    const m = s.mafiaState;
    if (!m) return;

    m.phase = "NIGHT";
    m.nightVictimId = undefined;
    m.detectiveResult = undefined;
    m.nightActorsReady = [];
    m.votes = {};
    m.deadline = Date.now() + MAFIA_PHASE_MS.NIGHT;
    m.phaseDurationMs = MAFIA_PHASE_MS.NIGHT;
    m.lastSummary = "🌙 حلّ الليل. المافيا تختار ضحيتها، والمحقق يتحرى عن حقيقة أحد اللاعبين.";

    this.ctx.broadcast("MAFIA_NIGHT_STARTED", {
      day: m.day,
      deadline: m.deadline,
      messageAr: m.lastSummary
    });

    this.ctx.syncState();

    // البوتات تتحرك سراً بعد ثانيتين
    this.schedule(() => this.runBotNightActions(), 2200);
    this.schedule(() => this.resolveNight(), MAFIA_PHASE_MS.NIGHT);
  }

  private resolveNight(): void {
    const s = this.ctx.state;
    const m = s.mafiaState;
    if (!m || m.phase !== "NIGHT") return;

    this.clearTimers();
    m.phase = "RESOLUTION";
    m.deadline = Date.now() + MAFIA_PHASE_MS.RESOLUTION;

    const victim = m.nightVictimId ? s.players[m.nightVictimId] : undefined;
    if (victim && !victim.isEliminated) {
      victim.isEliminated = true;
      m.eliminated.push({
        playerId: victim.id,
        role: m.roles[victim.id],
        day: m.day,
        reason: "NIGHT"
      });
      m.lastSummary = `☀️ أشرقت الشمس على جثة ${victim.name}. كان دوره: ${ROLE_NAMES_AR[m.roles[victim.id]]}.`;
      this.ctx.broadcast("MAFIA_NIGHT_RESULT", {
        victimId: victim.id,
        victimName: victim.name,
        day: m.day,
        messageAr: m.lastSummary
      });
    } else {
      m.lastSummary = "☀️ مرّ الليل بسلام.. لم تسقط أي ضحية هذه الليلة.";
      this.ctx.broadcast("MAFIA_NIGHT_RESULT", {
        victimId: null,
        day: m.day,
        messageAr: m.lastSummary
      });
    }

    this.ctx.syncState();

    const victory = this.checkVictory();
    if (victory.isOver) {
      this.ctx.endGame(victory);
      return;
    }

    this.beginDay();
  }

  private beginDay(): void {
    const s = this.ctx.state;
    const m = s.mafiaState;
    if (!m) return;

    this.clearTimers();
    m.phase = "DAY";
    m.deadline = Date.now() + MAFIA_PHASE_MS.DAY;
    m.phaseDurationMs = MAFIA_PHASE_MS.DAY;

    const alive = this.alivePlayers().map((p) => ({ id: p.id, name: p.name, color: p.color }));
    this.ctx.broadcast("MAFIA_DAY_STARTED", {
      day: m.day,
      alive,
      deadline: m.deadline,
      messageAr: `🗣️ نقاش مفتوح لـ ${Math.round(MAFIA_PHASE_MS.DAY / 1000)} ثانية. من المشتبه به؟`
    });
    this.ctx.syncState();
    this.schedule(() => this.beginVote(), MAFIA_PHASE_MS.DAY);
  }

  private beginVote(): void {
    if (this.gameOver()) return;
    const s = this.ctx.state;
    const m = s.mafiaState;
    if (!m) return;

    this.clearTimers();
    m.phase = "VOTE";
    m.votes = {};
    m.deadline = Date.now() + MAFIA_PHASE_MS.VOTE;
    m.phaseDurationMs = MAFIA_PHASE_MS.VOTE;
    m.lastSummary = "🗳️ التصويت مفتوح! اختاروا من تُقصون من الطاولة.";

    this.ctx.broadcast("MAFIA_VOTE_STARTED", {
      day: m.day,
      deadline: m.deadline,
      alive: this.alivePlayers().map((p) => ({ id: p.id, name: p.name, color: p.color })),
      messageAr: m.lastSummary
    });
    this.ctx.syncState();

    this.schedule(() => this.runBotVotes(), 2500);
    this.schedule(() => this.resolveVote(), MAFIA_PHASE_MS.VOTE);
  }

  private resolveVote(): void {
    const s = this.ctx.state;
    const m = s.mafiaState;
    if (!m || m.phase !== "VOTE") return;

    this.clearTimers();
    m.phase = "RESOLUTION";
    m.deadline = Date.now() + MAFIA_PHASE_MS.RESOLUTION;

    const tally: Record<string, number> = {};
    for (const targetId of Object.values(m.votes)) {
      tally[targetId] = (tally[targetId] || 0) + 1;
    }

    let topId: string | null = null;
    let topVotes = 0;
    let tie = false;
    for (const [id, count] of Object.entries(tally)) {
      if (count > topVotes) {
        topVotes = count;
        topId = id;
        tie = false;
      } else if (count === topVotes && topVotes > 0) {
        tie = true;
      }
    }

    if (topId && !tie) {
      const player = s.players[topId];
      if (player) {
        player.isEliminated = true;
        m.eliminated.push({
          playerId: topId,
          role: m.roles[topId],
          day: m.day,
          reason: "VOTE"
        });
        m.lastSummary = `⚖️ أقصت الطاولة ${player.name} بأغلبية ${topVotes} أصوات. دوره: ${ROLE_NAMES_AR[m.roles[topId]]}.`;
        this.ctx.broadcast("MAFIA_VOTE_RESULT", {
          eliminatedId: topId,
          eliminatedName: player.name,
          role: m.roles[topId],
          tally,
          tie: false,
          messageAr: m.lastSummary
        });
      }
    } else {
      m.lastSummary = tie
        ? "⚖️ تعادل في الأصوات! لا إقصاء هذه الجولة، والطاولة تنقسم."
        : "⚖️ لم يصوّت أحد! لا إقصاء.";
      this.ctx.broadcast("MAFIA_VOTE_RESULT", {
        eliminatedId: null,
        tally,
        tie,
        messageAr: m.lastSummary
      });
    }

    this.ctx.syncState();

    const victory = this.checkVictory();
    if (victory.isOver) {
      this.ctx.endGame(victory);
      return;
    }

    m.day += 1;
    this.schedule(() => this.beginNight(), 1200);
  }

  // ==========================================
  // أفعال اللاعبين
  // ==========================================
  public mafiaNightAction(playerId: string, targetId: string): void {
    const s = this.ctx.state;
    const m = s.mafiaState;
    if (!m || m.phase !== "NIGHT") throw new Error("الآن ليس وقت الحركة الليلية.");
    const actor = s.players[playerId];
    const target = s.players[targetId];
    if (!actor || !target) throw new Error("اللاعب غير موجود.");
    if (actor.isEliminated) throw new Error("أنت خارج اللعبة.");
    if (target.isEliminated) throw new Error("هذا اللاعب مُقصى بالفعل.");
    if (targetId === playerId) throw new Error("لا يمكنك استهداف نفسك.");

    const role = m.roles[playerId];
    if (role === "MAFIA") {
      if (m.roles[targetId] === "MAFIA") throw new Error("لا يمكن تصفية أحد أفراد العصابة.");
      m.nightVictimId = targetId;
      if (actor.userId) recordUserActionInStore(actor.userId, "MAFIA_KILL", { targetId });
      this.ctx.broadcast("MAFIA_ACTION_LOCKED", {
        playerId,
        messageAr: "تم تسجيل أمر التصفية سراً."
      });
    } else if (role === "DETECTIVE") {
      m.detectiveResult = {
        detectiveId: playerId,
        targetId,
        isMafia: m.roles[targetId] === "MAFIA"
      };
      if (actor.userId) recordUserActionInStore(actor.userId, "DETECTIVE_CHECK", { targetId });
      this.ctx.broadcast("MAFIA_ACTION_LOCKED", {
        playerId,
        messageAr: "تم إرسال نوته التحقيق إلى جوالك."
      });
    } else {
      throw new Error("دورك لا يملك حركة ليلية.");
    }

    this.ctx.syncState();
    this.maybeFinishNight();
  }

  public castMafiaVote(voterId: string, targetPlayerId: string): void {
    const s = this.ctx.state;
    const m = s.mafiaState;
    if (!m || m.phase !== "VOTE") throw new Error("التصويت غير مفتوح حالياً.");
    const voter = s.players[voterId];
    const target = s.players[targetPlayerId];
    if (!voter || !target) throw new Error("اللاعب غير موجود.");
    if (voter.isEliminated) throw new Error("أنت خارج اللعبة.");
    if (target.isEliminated) throw new Error("لا يمكنك التصويت ضد لاعب مُقصى.");
    if (voterId === targetPlayerId) throw new Error("لا يمكنك التصويت لنفسك.");

    m.votes[voterId] = targetPlayerId;
    if (voter.userId) recordUserActionInStore(voter.userId, "SUBMIT_VOTE", { targetPlayerId });

    this.ctx.broadcast("MAFIA_VOTE_CAST", {
      voterId,
      voterName: voter.name,
      votesCount: Object.keys(m.votes).length,
      aliveCount: this.alivePlayers().length
    });

    this.ctx.syncState();

    if (Object.keys(m.votes).length >= this.alivePlayers().length) {
      this.resolveVote();
    }
  }

  // توافق مع واجهة المحرك القديمة (بطاقة التصويت العامة)
  public submitPlayerVote(voterId: string, targetPlayerId: string): void {
    this.castMafiaVote(voterId, targetPlayerId);
  }

  // ==========================================
  // الفوز والبوتات
  // ==========================================
  public checkVictory(): VictoryCheckResult {
    const s = this.ctx.state;
    const m = s.mafiaState;
    if (!m) return { isOver: false, reasonAr: "" };

    const alive = this.alivePlayers();
    const mafiaAlive = alive.filter((p) => m.roles[p.id] === "MAFIA");
    const townAlive = alive.filter((p) => m.roles[p.id] !== "MAFIA");

    if (mafiaAlive.length === 0) {
      return {
        isOver: true,
        winner: townAlive[0],
        reasonAr: "أُقصيت المافيا بالكامل! انتصر المجلس والمواطنون 🎉"
      };
    }

    if (mafiaAlive.length >= townAlive.length) {
      return {
        isOver: true,
        winner: mafiaAlive[0],
        reasonAr: "سيطرت المافيا على الطاولة وتعادل عددها مع المواطنين! 🕵️‍♂️"
      };
    }

    return { isOver: false, reasonAr: "" };
  }

  public executeBotTurn(): void {
    // لعبة اجتماعية لا تعتمد على الأدوار المتعاقبة؛ البوتات تحرّك عبر المؤقتات.
  }

  public dispose(): void {
    this.clearTimers();
  }

  // ==========================================
  // أدوات داخلية
  // ==========================================
  private alivePlayers() {
    return Object.values(this.ctx.state.players).filter((p) => !p.isEliminated);
  }

  private gameOver(): boolean {
    return this.ctx.state.phase === "GAME_OVER";
  }

  private runBotNightActions(): void {
    const s = this.ctx.state;
    const m = s.mafiaState;
    if (!m || m.phase !== "NIGHT") return;

    const alive = this.alivePlayers();
    for (const bot of alive.filter((p) => p.isBot)) {
      const role = m.roles[bot.id];
      if (role === "MAFIA") {
        const targets = alive.filter((p) => m.roles[p.id] !== "MAFIA");
        const target = targets[Math.floor(Math.random() * targets.length)];
        if (target) {
          try {
            this.mafiaNightAction(bot.id, target.id);
          } catch {}
        }
      } else if (role === "DETECTIVE") {
        const targets = alive.filter((p) => p.id !== bot.id);
        const target = targets[Math.floor(Math.random() * targets.length)];
        if (target) {
          try {
            this.mafiaNightAction(bot.id, target.id);
          } catch {}
        }
      }
    }
  }

  private runBotVotes(): void {
    const s = this.ctx.state;
    const m = s.mafiaState;
    if (!m || m.phase !== "VOTE") return;

    const alive = this.alivePlayers();
    for (const bot of alive.filter((p) => p.isBot && !m.votes[p.id])) {
      const targets = alive.filter((p) => p.id !== bot.id);
      const target = targets[Math.floor(Math.random() * targets.length)];
      if (target) {
        try {
          this.castMafiaVote(bot.id, target.id);
        } catch {}
      }
    }
  }

  private maybeFinishNight(): void {
    const m = this.ctx.state.mafiaState;
    if (!m || m.phase !== "NIGHT") return;

    const alive = this.alivePlayers();
    const mafia = alive.filter((p) => m.roles[p.id] === "MAFIA");
    const detective = alive.find((p) => m.roles[p.id] === "DETECTIVE");

    const mafiaReady = mafia.every((p) => !p.isBot || Boolean(m.nightVictimId));
    const detectiveReady = !detective || !detective.isBot || Boolean(m.detectiveResult);

    // لا نُنهي الليل قبل انقضاء نصف المدة حتى يرى الجميع الأحداث
    if (mafiaReady && detectiveReady && m.nightVictimId && m.detectiveResult) {
      // إبقاء الليل ظاهراً للطاولة لثوانٍ كافية بدل قطعه فوراً
      this.schedule(() => this.resolveNight(), 8000);
    }
  }

  private schedule(fn: () => void, ms: number): void {
    const timer = setTimeout(() => {
      try {
        fn();
      } catch (err) {
        console.warn("[MafiaEngine]", err);
      }
    }, ms);
    this.timers.push(timer);
  }

  private clearTimers(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
  }
}
