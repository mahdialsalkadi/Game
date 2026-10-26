import type { IGameEngine, GameType, VictoryCheckResult, EngineContext } from "./types";
import type { GeneratedSessionPack, BoardTile } from "../schema";
import type { ExtendedPlayerState } from "../gameRoom";
import { executeCardEffects } from "../effectEngine";
import { recordUserActionInStore } from "../behavioralDNA";
import {
  checkColorMonopoly,
  calculateMonopolyRent,
  getPlayerMonopolies
} from "../monopolyEngine";

export class MonopolyEngine implements IGameEngine {
  public readonly gameType: GameType = "MONOPOLY";
  private purchaseTimer?: ReturnType<typeof setTimeout>;
  /** هل حصل اللاعب على رمية إضافية بسبب الثنائي؟ */
  private extraRollPending = false;

  constructor(private ctx: EngineContext) {}

  public dispose(): void {
    this.clearPurchaseTimer();
    this.extraRollPending = false;
  }

  private clearPurchaseTimer(): void {
    if (this.purchaseTimer) {
      clearTimeout(this.purchaseTimer);
      this.purchaseTimer = undefined;
    }
  }

  /**
   * إنهاء الدور مع احترام قاعدة الثنائي: نفس اللاعب يرمي مرة أخرى
   * بدلاً من تمرير الدور، ما لم يكن مفلساً أو في السجن.
   */
  private finishTurn(player: ExtendedPlayerState): void {
    const s = this.ctx.state;
    this.clearPurchaseTimer();

    if (s.phase === "GAME_OVER") {
      this.extraRollPending = false;
      return;
    }

    const victory = this.checkVictory();
    if (victory.isOver) {
      this.extraRollPending = false;
      this.ctx.endGame(victory);
      return;
    }

    if (player.isBankrupt || player.isEliminated) {
      this.extraRollPending = false;
      s.phase = "TURN_START";
      this.ctx.advanceTurn();
      return;
    }

    if (this.extraRollPending && !player.inJail) {
      this.extraRollPending = false;
      s.phase = "TURN_START";
      this.ctx.broadcast("EXTRA_ROLL_GRANTED", {
        playerId: player.id,
        messageAr: `🎲 نرد مزدوج! يحق لـ ${player.name} رمي النرد مرة إضافية.`
      });
      this.ctx.syncState();
      return;
    }

    this.extraRollPending = false;
    s.phase = "TURN_START";
    this.ctx.advanceTurn();
  }

  private sendToJail(player: ExtendedPlayerState, messageAr: string): void {
    const s = this.ctx.state;
    const jailIndex = s.tiles.findIndex(
      (t) => t.cornerType === "JAIL" || (t.name && t.name.includes("السجن"))
    );
    const targetJailPos = jailIndex >= 0 ? jailIndex : 5;
    player.position = targetJailPos;
    player.inJail = true;
    player.jailTurnsRemaining = 3;
    player.doublesCount = 0;
    this.extraRollPending = false;

    this.ctx.broadcast("SENT_TO_JAIL", {
      playerId: player.id,
      jailTileIndex: targetJailPos,
      messageAr
    });

    this.finishTurn(player);
  }

  public initialize(pack: GeneratedSessionPack): void {
    const s = this.ctx.state;
    this.clearPurchaseTimer();
    this.extraRollPending = false;
    s.freeParkingJackpot = 150;
    s.boardSize = pack.tiles?.length || 20;
    s.tiles = pack.tiles || [];
    s.deck = [...pack.cardsDeck];
    s.rulesConfig = {
      turnMechanism: "DICE_AND_MOVE",
      cardVisibility: "SECRET_PHONE_ONLY",
      ownershipSystem: "BUY_AND_RENT"
    };
    s.winCondition = "MOST_COINS";

    // Initialize players on Monopoly board
    for (const pid of s.turnOrder) {
      const p = s.players[pid];
      if (p) {
        p.position = 0;
        p.inJail = false;
        p.jailTurnsRemaining = 0;
        p.doublesCount = 0;
        p.isBankrupt = false;
        p.isEliminated = false;
      }
    }
  }

  public rollDice(playerId: string): void {
    const s = this.ctx.state;
    const player = s.players[playerId];
    if (!player || player.isBankrupt || player.isEliminated) return;

    s.phase = "RESOLVING_TILE";

    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const diceValue = dice1 + dice2;
    const isDoubles = dice1 === dice2;

    s.lastDiceRoll = {
      dice1,
      dice2,
      sum: diceValue,
      isDoubles
    };

    // القاعدة الرسمية: ثلاث رميات متطابقة متتالية ترسل اللاعب للسجن فوراً.
    if (!player.inJail && isDoubles && (player.doublesCount || 0) >= 2) {
      this.ctx.broadcast("DICE_ROLLED", {
        playerId,
        dice1,
        dice2,
        diceValue,
        isDoubles: true,
        inJail: true,
        newPosition: player.position,
        landedTile: s.tiles[player.position],
        moveEvents: [],
        messageAr: `رمى ${player.name} الثنائي الثالث على التوالي! الشرطة أوقفته وأرسلته إلى السجن. 🚨`
      });
      this.sendToJail(
        player,
        `🚨 ثلاث رميات ثنائية متتالية! انتقل ${player.name} مباشرة إلى السجن دون تحريك قطعه.`
      );
      return;
    }

    // Case 1: Player is currently in jail
    if (player.inJail) {
      if (isDoubles) {
        player.inJail = false;
        player.jailTurnsRemaining = 0;
        player.doublesCount = 0;
        this.extraRollPending = false;

        const moveEvents = executeCardEffects(
          s,
          [{ actionType: "MOVE_STEPS", targetType: "SELF", value: diceValue }],
          { sourcePlayerId: playerId }
        );

        const landedTile = s.tiles[player.position];

        this.ctx.broadcast("DICE_ROLLED", {
          playerId,
          dice1,
          dice2,
          diceValue,
          isDoubles: true,
          inJail: false,
          newPosition: player.position,
          landedTile,
          moveEvents,
          messageAr: `رمى ${player.name} نردين متطابقين (${dice1} و ${dice2}) وخرج من السجن فوراً! 🎲🎲`
        });

        this.resolveLandedTile(player, landedTile);
        return;
      }

      // Failed to roll doubles
      player.jailTurnsRemaining = Math.max(0, (player.jailTurnsRemaining || 3) - 1);

      this.ctx.broadcast("DICE_ROLLED", {
        playerId,
        dice1,
        dice2,
        diceValue,
        isDoubles: false,
        inJail: true,
        newPosition: player.position,
        landedTile: s.tiles[player.position],
        moveEvents: [],
        messageAr: `فشل ${player.name} في رمي نردين متطابقين (${dice1} و ${dice2}) وبقي في السجن! (محاولات متبقية: ${player.jailTurnsRemaining})`
      });

      // Auto fine payment on 3rd failed attempt
      if (player.jailTurnsRemaining === 0 && player.coins >= 50) {
        player.coins -= 50;
        player.inJail = false;
        s.freeParkingJackpot = (s.freeParkingJackpot || 0) + 50;

        const moveEvents = executeCardEffects(
          s,
          [{ actionType: "MOVE_STEPS", targetType: "SELF", value: diceValue }],
          { sourcePlayerId: playerId }
        );

        const landedTile = s.tiles[player.position];

        this.ctx.broadcast("JAIL_FINE_PAID", {
          playerId,
          fine: 50,
          messageAr: `دفع ${player.name} غرامة كفالة إجبارية 50 ${s.currencyName} بعد استنفاد محاولاته وخرج من السجن!`
        });

        this.resolveLandedTile(player, landedTile);
        return;
      }

      this.finishTurn(player);
      return;
    }

    // Case 2: Normal roll
    if (isDoubles) {
      player.doublesCount = (player.doublesCount || 0) + 1;
      this.extraRollPending = true;
    } else {
      player.doublesCount = 0;
      this.extraRollPending = false;
    }

    const moveEvents = executeCardEffects(
      s,
      [{ actionType: "MOVE_STEPS", targetType: "SELF", value: diceValue }],
      { sourcePlayerId: playerId }
    );

    const landedTile = s.tiles[player.position];

    this.ctx.broadcast("DICE_ROLLED", {
      playerId,
      dice1,
      dice2,
      diceValue,
      isDoubles,
      inJail: false,
      newPosition: player.position,
      landedTile,
      moveEvents,
      messageAr: isDoubles
        ? `🎲 ثنائي! ${player.name} سيرمي النرد مرة إضافية بعد تنفيذ المربع.`
        : undefined
    });

    this.resolveLandedTile(player, landedTile);
  }

  public buyProperty(
    playerId: string,
    tileIndex?: number,
    endTurnAfter = true
  ): void {
    const s = this.ctx.state;
    const player = s.players[playerId];
    if (!player) {
      throw new Error("اللاعب غير موجود.");
    }
    const targetIndex = tileIndex !== undefined ? tileIndex : player.position;
    const tile = s.tiles[targetIndex];

    if (!tile) {
      throw new Error("المربع المطلوب غير موجود.");
    }
    // قوانين المونوبولي: لا يُشترى إلا العقار الذي هبطت عليه بعد رمي النرد.
    if (!player.isBot && targetIndex !== player.position) {
      throw new Error("يمكنك شراء العقار الذي هبطت عليه فقط بعد رمي النرد.");
    }
    const price = tile.price || 100;

    if (tile.ownerId && tile.ownerId !== playerId) {
      throw new Error("هذا العقار مملوك للاعب آخر بالفعل!");
    }
    if (tile.ownerId === playerId) {
      throw new Error("أنت تملك هذا العقار بالفعل!");
    }
    if (player.coins < price) {
      throw new Error("رصيدك لا يكفي لشراء هذا العقار!");
    }

    player.coins -= price;
    tile.ownerId = playerId;
    if (tile.rent === undefined) {
      tile.rent = Math.max(10, Math.floor(price * 0.25));
    }

    this.ctx.broadcast("PROPERTY_BOUGHT", {
      playerId,
      tileIndex: targetIndex,
      price,
      tile,
      messageAr: `قام ${player.name} بشراء ${tile.name} مقابل ${price} ${s.currencyName}!`
    });

    if (player.userId) {
      recordUserActionInStore(player.userId, "BUY_PROPERTY", {
        price,
        tileIndex: targetIndex
      });
    }

    this.clearPurchaseTimer();
    this.ctx.syncState();

    // إنهاء الدور بعد إتمام الشراء (مع منح رمية إضافية إن كان النرد ثنائياً).
    // عند الشراء من داخل resolveLandedTile نُبقي الإنهاء للمحرك نفسه.
    if (endTurnAfter && s.phase === "RESOLVING_TILE") {
      this.finishTurn(player);
    }
  }

  /** رفض شراء العقار الذي هبط عليه اللاعب، ثم تمرير الدور. */
  public declinePurchase(playerId: string): void {
    const s = this.ctx.state;
    if (s.phase !== "RESOLVING_TILE") {
      throw new Error("لا يوجد عقار معروض للشراء الآن.");
    }
    if (this.ctx.getActivePlayerId() !== playerId) {
      throw new Error("ليس دورك الآن!");
    }
    this.clearPurchaseTimer();
    this.ctx.broadcast("PURCHASE_DECLINED", {
      playerId,
      messageAr: `قرر ${s.players[playerId]?.name} عدم شراء العقار وتُركت الفرصة للمزاد.`
    });
    this.finishTurn(s.players[playerId]);
  }

  public buildHouse(playerId: string, tileIndex: number): void {
    const s = this.ctx.state;
    const player = s.players[playerId];
    const tile = s.tiles[tileIndex];

    if (!tile) {
      throw new Error("العقار المطلوب غير موجود.");
    }
    if (tile.ownerId !== playerId) {
      throw new Error("أنت لا تملك هذا العقار!");
    }
    if (!tile.colorGroup || tile.colorGroup === "STATION" || tile.colorGroup === "UTILITY") {
      throw new Error("المحطات والمرافق العامة لا تقبل تشييد المنازل!");
    }

    const hasMonopoly = checkColorMonopoly(s.tiles, playerId, tile.colorGroup);
    if (!hasMonopoly) {
      throw new Error("يجب امتلاك جميع عقارات هذه المجموعة اللونية لبدء التشييد (احتكار كامل)!");
    }

    // القاعدة الرسمية: بناء متساوٍ. لا يمكن رفع عقار قبل أن تصل بقية
    // عقارات المجموعة إلى نفس المستوى (فارق مستوى واحد كحد أقصى).
    const groupTiles = s.tiles.filter(
      (t) => t.ownerId === playerId && t.colorGroup === tile.colorGroup
    );
    const minHouses = Math.min(...groupTiles.map((t) => t.houses || 0));
    const currentHouses = tile.houses || 0;
    if (currentHouses > minHouses) {
      throw new Error(
        "البناء المتساوي إلزامي: ابنِ على بقية عقارات المجموعة أولاً قبل ترقية هذا العقار!"
      );
    }
    if (currentHouses >= 5) {
      throw new Error("وصل هذا العقار إلى أقصى مستوى من البناء (فندق فاخر)! 🏨");
    }

    const cost = tile.houseCost || 50;
    if (player.coins < cost) {
      throw new Error(`رصيدك لا يكفي لتشييد المبنى (${cost} ${s.currencyName} مطلوبة)!`);
    }

    player.coins -= cost;
    tile.houses = currentHouses + 1;
    const newRent = calculateMonopolyRent(tile, s.tiles);
    tile.rent = newRent;

    const isHotel = tile.houses === 5;
    const buildingName = isHotel ? "فندقاً فاخراً 🏨" : `بيتاً جديداً (المستوى ${tile.houses}) 🏠`;

    this.ctx.broadcast("HOUSE_BUILT", {
      playerId,
      tileIndex,
      houses: tile.houses,
      cost,
      newRent,
      messageAr: `قام ${player.name} بتشييد ${buildingName} على ${tile.name}! الإيجار الجديد: ${newRent} ${s.currencyName}.`
    });

    if (player.userId) {
      recordUserActionInStore(player.userId, "BUILD_HOUSE" as any, {
        tileIndex,
        houses: tile.houses,
        cost
      });
    }

    this.ctx.syncState();
  }

  public payJailFine(playerId: string): void {
    const s = this.ctx.state;
    const player = s.players[playerId];
    if (!player.inJail) {
      throw new Error("أنت لست رهن الحبس في السجن حالياً!");
    }

    const fine = 50;
    if (player.coins < fine) {
      throw new Error(`رصيدك لا يكفي لدفع الغرامة (${fine} ${s.currencyName} مطلوبة)!`);
    }

    player.coins -= fine;
    player.inJail = false;
    player.jailTurnsRemaining = 0;
    s.freeParkingJackpot = (s.freeParkingJackpot || 0) + fine;

    this.ctx.broadcast("JAIL_FINE_PAID", {
      playerId,
      fine,
      messageAr: `سدد ${player.name} غرامة كفالة قدرها ${fine} ${s.currencyName} وخرج من السجن حراً!`
    });

    this.ctx.syncState();
  }

  public resolveLandedTile(player: ExtendedPlayerState, tile: BoardTile): void {
    const s = this.ctx.state;
    let currentTile = tile;

    // 1. Check GO_TO_JAIL
    const isGoToJail =
      currentTile.cornerType === "GO_TO_JAIL" ||
      (currentTile.name && currentTile.name.includes("اذهب إلى السجن"));

    if (isGoToJail) {
      this.sendToJail(
        player,
        `تم توقيف ${player.name} وإرساله مباشرة إلى زنزانة السجن! 🚨`
      );
      return;
    }

    // 2. Check FREE_PARKING
    const isFreeParking =
      currentTile.cornerType === "FREE_PARKING" ||
      (currentTile.name && currentTile.name.includes("المواقف المجانية"));

    if (isFreeParking && s.freeParkingJackpot && s.freeParkingJackpot > 0) {
      const jackpot = s.freeParkingJackpot;
      player.coins += jackpot;
      s.freeParkingJackpot = 0;

      this.ctx.broadcast("JACKPOT_COLLECTED", {
        playerId: player.id,
        amount: jackpot,
        messageAr: `حصد ${player.name} خزينة المواقف المجانية بالكامل (+${jackpot} ${s.currencyName})! 🅿️💰`
      });
    }

    // 3. Automated Rent Collection
    if (currentTile.ownerId && currentTile.ownerId !== player.id) {
      const owner = s.players[currentTile.ownerId];
      if (owner) {
        const rentAmount = calculateMonopolyRent(currentTile, s.tiles);
        const canPayFullRent = player.coins >= rentAmount;
        const actualRent = Math.min(player.coins, rentAmount);
        player.coins -= actualRent;
        owner.coins += actualRent;

        this.ctx.broadcast("RENT_PAID", {
          payerId: player.id,
          ownerId: owner.id,
          tileIndex: currentTile.index,
          rent: actualRent,
          fullRent: rentAmount,
          houses: currentTile.houses || 0,
          messageAr: canPayFullRent
            ? `دفع ${player.name} إيجاراً قدره ${actualRent} ${s.currencyName} إلى ${owner.name} صاحب ${currentTile.name}!`
            : `دفع ${player.name} كل ما يملك (${actualRent} ${s.currencyName}) نحو إيجار ${rentAmount} لـ ${owner.name} على ${currentTile.name}!`
        });

        if (owner.userId) {
          recordUserActionInStore(owner.userId, "RENT_COLLECTED", { rent: actualRent, tenantId: player.id });
        }

        // الإفلاس يحدث فقط عند العجز عن سداد الإيجار الكامل.
        // صفر نقدي مع عدم وجود دين لا يعني إقصاء اللاعب: قد يبيع/يرهن لاحقاً.
        if (!canPayFullRent) {
          player.isBankrupt = true;
          player.isEliminated = true;

          let transferredCount = 0;
          for (const t of s.tiles) {
            if (t.ownerId === player.id) {
              t.ownerId = owner.id;
              t.houses = 0;
              t.rent = calculateMonopolyRent(t, s.tiles);
              transferredCount++;
            }
          }

          this.ctx.broadcast("PLAYER_BANKRUPT", {
            playerId: player.id,
            creditorId: owner.id,
            transferredProperties: transferredCount,
            messageAr: `أفلس ${player.name} ولم يستطع سداد الإيجار الكامل (${rentAmount} ${s.currencyName})! تم التنازل عن جميع عقاراته لصالح ${owner.name} وخرج من اللعبة! 💸`
          });
        }

        const victory = this.checkVictory();
        if (victory.isOver) {
          this.ctx.endGame(victory);
          return;
        }

        if (player.isBankrupt || player.isEliminated) {
          this.finishTurn(player);
          return;
        }
      }
    }

    // 4. بطاقات المربعات: السحب إلى اليد السرية أو التنفيذ الفوري.
    if (currentTile.tileType === "SECRET_CARD") {
      const secretCards = s.deck.filter((c) => c.category === "SECRET_HAND");
      const secretCard =
        secretCards.length > 0
          ? secretCards[Math.floor(Math.random() * secretCards.length)]
          : undefined;

      if (secretCard) {
        if (player.secretHand.length >= 6) {
          this.ctx.broadcast("SECRET_HAND_FULL", {
            playerId: player.id,
            messageAr: `يد ${player.name} ممتلئة بالبطاقات السرية (الحد الأقصى 6)!`
          });
        } else {
          player.secretHand.push({
            ...secretCard,
            id: `${secretCard.id}_tile_${Date.now()}`
          });
          this.ctx.broadcast("SECRET_CARD_DRAWN", {
            playerId: player.id,
            card: secretCard,
            messageAr: `سحب ${player.name} بطاقة سرية جديدة من ${currentTile.name}!`
          });
        }
      }
    }

    if (currentTile.tileType === "DRAMA_EVENT") {
      const dramaCards = s.deck.filter((c) => c.category === "PUBLIC_DRAMA");
      const dramaCard =
        dramaCards.length > 0
          ? dramaCards[Math.floor(Math.random() * dramaCards.length)]
          : undefined;
      if (dramaCard) {
        const dramaEvents = executeCardEffects(s, dramaCard.effects, {
          sourcePlayerId: player.id
        });
        this.ctx.broadcast("DRAMA_CARD_TRIGGERED", {
          card: dramaCard,
          events: dramaEvents,
          messageAr: dramaCard.flavorText
        });
      }
    }

    // 5. Default tile effects (START salary, hazards, etc.)
    if (currentTile.defaultEffect) {
      const tileEvents = executeCardEffects(
        s,
        [currentTile.defaultEffect],
        { sourcePlayerId: player.id }
      );

      if (
        currentTile.defaultEffect.actionType === "MODIFY_COINS" &&
        currentTile.defaultEffect.value < 0
      ) {
        s.freeParkingJackpot =
          (s.freeParkingJackpot || 0) + Math.abs(currentTile.defaultEffect.value);
      }
      this.ctx.broadcast("TILE_RESOLVED", { tile: currentTile, events: tileEvents });
    }

    // 5. Purchase window: اللاعب البشري يقرر بنفسه، والبوت يشتري تلقائياً.
    const isUnownedProperty = Boolean(
      !currentTile.ownerId &&
      currentTile.price &&
      currentTile.price > 0 &&
      currentTile.tileType === "RESOURCE"
    );

    if (isUnownedProperty) {
      if (player.isBot) {
        if (player.coins >= (currentTile.price || 0) + 50) {
          try {
            this.buyProperty(player.id, currentTile.index, false);
          } catch {}
        }
      } else if (player.coins >= (currentTile.price || 0)) {
        s.phase = "RESOLVING_TILE";
        this.ctx.broadcast("PURCHASE_OFFERED", {
          playerId: player.id,
          tileIndex: currentTile.index,
          tile: currentTile,
          price: currentTile.price,
          expiresInMs: 20000,
          messageAr: `هبط ${player.name} على ${currentTile.name} المعروض للشراء بـ ${currentTile.price} ${s.currencyName}.`
        });
        this.ctx.syncState();

        this.purchaseTimer = setTimeout(() => {
          const state = this.ctx.state;
          if (
            state.phase === "RESOLVING_TILE" &&
            this.ctx.getActivePlayerId() === player.id
          ) {
            this.ctx.broadcast("PURCHASE_DECLINED", {
              playerId: player.id,
              messageAr: `انتهت مهلة الشراء، تُرك عقار ${currentTile.name} دون شراء.`
            });
            this.finishTurn(player);
          }
        }, 20000);

        return;
      }

      // بوت لا يستطيع/لا يرغب في الشراء: أكمل الدور مباشرة.
    }

    this.finishTurn(player);
  }

  public checkVictory(): VictoryCheckResult {
    const s = this.ctx.state;
    const players = Object.values(s.players);
    if (players.length === 0) return { isOver: false, reasonAr: "" };

    // لا نعدم اللاعب تلقائياً لمجرد وصول نقديته إلى صفر.
    // الإفلاس يُعلن فقط عند عجزه عن سداد التزام (إيجار/غرامة) في المحرك.

    // Financial Empire: 2000 SAR or 4 complete color groups
    for (const p of players) {
      if (p.coins >= 2000) {
        return {
          isOver: true,
          winner: p,
          reasonAr: `حقق ثروة طائلة تجاوزت 2000 ${s.currencyName} وبنى إمبراطورية مالية لا تقهر! 💰🏢`
        };
      }
      const monopolies = getPlayerMonopolies(s.tiles, p.id);
      if (monopolies.length >= 4) {
        return {
          isOver: true,
          winner: p,
          reasonAr: "بنى إمبراطورية عقارية واحتكر 4 مجموعات لونية كاملة من أحياء الرياض! 🏙️👑"
        };
      }
    }

    // Bankruptcy elimination: single solvent player remains
    const solventPlayers = players.filter((p) => !p.isEliminated && !p.isBankrupt);
    if (players.length > 1 && solventPlayers.length === 1) {
      return {
        isOver: true,
        winner: solventPlayers[0],
        reasonAr: "أفلس جميع المنافسين واحتكر سوق العقارات بالكامل!"
      };
    }

    return { isOver: false, reasonAr: "" };
  }

  public executeBotTurn(botPlayerId: string): void {
    const s = this.ctx.state;
    const bot = s.players[botPlayerId];
    if (!bot || bot.isBankrupt || bot.isEliminated) return;

    // 1. الخروج من السجن: البوت يدفع الكفالة إذا كان يستطيع تحمّلها.
    if (bot.inJail && bot.coins >= 50) {
      try {
        this.payJailFine(botPlayerId);
      } catch {}
    }

    // 2. التطوير الذكي: نبني على أرخص البيوت أولاً حتى نحافظ على
    // قاعدة البناء المتساوي، مع الاحتفاظ باحتياطي نقدي للمخاطر.
    const upgradeableTiles = s.tiles
      .filter(
        (t) =>
          t.ownerId === bot.id &&
          t.colorGroup &&
          t.colorGroup !== "STATION" &&
          t.colorGroup !== "UTILITY" &&
          (t.houses || 0) < 5
      )
      .sort((a, b) => (a.houses || 0) - (b.houses || 0));

    for (const prop of upgradeableTiles) {
      const cost = prop.houseCost || 50;
      if (bot.coins >= cost + 120) {
        try {
          this.buildHouse(botPlayerId, prop.index);
        } catch {}
      }
    }

    // 3. رمي النرد والتحرك. الشراء يتم فقط بعد الهبوط على العقار
    // (داخل resolveLandedTile) وليس قبل الرمية.
    this.rollDice(botPlayerId);
  }
}
