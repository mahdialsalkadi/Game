/**
 * Authentic Uno & Tactical Cards Game Engine
 * Standard 108-card deck, action resolution, turn direction flow,
 * Smart Uno Bot AI, and Uno shout mechanics.
 */

export type UnoColor = "RED" | "BLUE" | "GREEN" | "YELLOW" | "WILD";
export type UnoActiveColor = "RED" | "BLUE" | "GREEN" | "YELLOW";

export type UnoValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "SKIP"
  | "REVERSE"
  | "DRAW_TWO"
  | "WILD"
  | "WILD_DRAW_FOUR";

export interface UnoCard {
  id: string;
  color: UnoColor;
  value: UnoValue;
  label: string; // "0"-"9", "⊘", "⇄", "+2", "★", "+4"
  labelAr: string; // e.g. "أحمر 7", "أزرق تخطي", "جوكر سحب 4"
  symbol: string;
}

export interface UnoState {
  deck: UnoCard[];
  discardPile: UnoCard[];
  topCard: UnoCard;
  activeColor: UnoActiveColor;
  direction: 1 | -1; // 1 = clockwise, -1 = counter-clockwise
  playerHands: Record<string, UnoCard[]>;
  unoShouted: Record<string, boolean>;
  lastActionMessageAr?: string;
  lastPlayedCard?: UnoCard;
  lastPlayedBy?: string;
  winner?: string;
  turnJustStarted?: boolean;
  /** هل سحب اللاعب ورقة هذا الدور؟ (يمنع السحب المتكرر) */
  hasDrawnThisTurn?: boolean;
  /** معرّف الورقة المسحوبة إن كانت قابلة للعب — لا يُسمح بلعب غيرها. */
  drawnCardId?: string;
}

export interface UnoSanitizedState {
  deckCount: number;
  topCard: UnoCard;
  activeColor: UnoActiveColor;
  direction: 1 | -1;
  playerCardCounts: Record<string, number>;
  myHand: UnoCard[];
  unoShouted: Record<string, boolean>;
  lastActionMessageAr?: string;
  lastPlayedCard?: UnoCard;
  lastPlayedBy?: string;
  winner?: string;
  hasDrawnThisTurn?: boolean;
  drawnCardId?: string;
}

export const UNO_COLOR_CONFIG: Record<
  UnoActiveColor,
  { nameAr: string; hex: string; bgClass: string; textClass: string; borderClass: string; glowClass: string }
> = {
  RED: {
    nameAr: "أحمر",
    hex: "#EF4444",
    bgClass: "bg-red-600",
    textClass: "text-red-400",
    borderClass: "border-red-500",
    glowClass: "shadow-[0_0_25px_rgba(239,68,68,0.6)]"
  },
  BLUE: {
    nameAr: "أزرق",
    hex: "#3B82F6",
    bgClass: "bg-blue-600",
    textClass: "text-blue-400",
    borderClass: "border-blue-500",
    glowClass: "shadow-[0_0_25px_rgba(59,130,246,0.6)]"
  },
  GREEN: {
    nameAr: "أخضر",
    hex: "#22C55E",
    bgClass: "bg-emerald-600",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500",
    glowClass: "shadow-[0_0_25px_rgba(34,197,94,0.6)]"
  },
  YELLOW: {
    nameAr: "أصفر",
    hex: "#EAB308",
    bgClass: "bg-yellow-500",
    textClass: "text-yellow-400",
    borderClass: "border-yellow-400",
    glowClass: "shadow-[0_0_25px_rgba(234,179,8,0.6)]"
  }
};

const BASE_COLORS: UnoActiveColor[] = ["RED", "BLUE", "GREEN", "YELLOW"];

/**
 * Creates a standard authentic 108-card Uno deck:
 * - 4 colors x (1x "0", 2x "1"-"9", 2x "Skip", 2x "Reverse", 2x "+2 Draw Two") = 100 cards
 * - 4x "Wild" + 4x "Wild Draw Four (+4)" = 8 cards
 * Total = 108 cards
 */
export function createStandardUnoDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  let cardSeq = 1;

  for (const color of BASE_COLORS) {
    const colorAr = UNO_COLOR_CONFIG[color].nameAr;

    // 1x "0"
    deck.push({
      id: `uno_${color}_0_${cardSeq++}`,
      color,
      value: "0",
      label: "0",
      labelAr: `${colorAr} 0`,
      symbol: "0"
    });

    // 2x each of "1"-"9"
    for (let num = 1; num <= 9; num++) {
      const valStr = String(num) as UnoValue;
      for (let copy = 0; copy < 2; copy++) {
        deck.push({
          id: `uno_${color}_${valStr}_c${copy}_${cardSeq++}`,
          color,
          value: valStr,
          label: valStr,
          labelAr: `${colorAr} ${valStr}`,
          symbol: valStr
        });
      }
    }

    // 2x "SKIP"
    for (let copy = 0; copy < 2; copy++) {
      deck.push({
        id: `uno_${color}_skip_c${copy}_${cardSeq++}`,
        color,
        value: "SKIP",
        label: "⊘",
        labelAr: `${colorAr} تخطي الدور (Skip)`,
        symbol: "⊘"
      });
    }

    // 2x "REVERSE"
    for (let copy = 0; copy < 2; copy++) {
      deck.push({
        id: `uno_${color}_rev_c${copy}_${cardSeq++}`,
        color,
        value: "REVERSE",
        label: "⇄",
        labelAr: `${colorAr} عكس الاتجاه (Reverse)`,
        symbol: "⇄"
      });
    }

    // 2x "DRAW_TWO"
    for (let copy = 0; copy < 2; copy++) {
      deck.push({
        id: `uno_${color}_plus2_c${copy}_${cardSeq++}`,
        color,
        value: "DRAW_TWO",
        label: "+2",
        labelAr: `${colorAr} سحب 2 (+2)`,
        symbol: "+2"
      });
    }
  }

  // 4x "WILD"
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `uno_wild_${i}_${cardSeq++}`,
      color: "WILD",
      value: "WILD",
      label: "★",
      labelAr: "جوكر تغيير اللون (Wild)",
      symbol: "★"
    });
  }

  // 4x "WILD_DRAW_FOUR"
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `uno_wild4_${i}_${cardSeq++}`,
      color: "WILD",
      value: "WILD_DRAW_FOUR",
      label: "+4",
      labelAr: "جوكر سحب 4 (+4 Wild)",
      symbol: "+4"
    });
  }

  return shuffleDeck(deck);
}

/**
 * Fisher-Yates array shuffle algorithm
 */
export function shuffleDeck<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Initializes a new Uno match with standard 7-card hands dealt to each player
 */
export function initializeUnoGame(playerIds: string[]): UnoState {
  if (playerIds.length < 2) {
    throw new Error("يجب وجود لاعبين اثنين على الأقل لبدء لعبة أونو.");
  }

  const deck = createStandardUnoDeck();
  const playerHands: Record<string, UnoCard[]> = {};
  const unoShouted: Record<string, boolean> = {};

  // Deal 7 cards to each player
  for (const pid of playerIds) {
    playerHands[pid] = deck.splice(0, 7);
    unoShouted[pid] = false;
  }

  // Draw initial top card: if it's WILD_DRAW_FOUR, recycle and pick another
  let topCardIndex = deck.findIndex((c) => c.value !== "WILD_DRAW_FOUR");
  if (topCardIndex === -1) topCardIndex = 0;
  const [topCard] = deck.splice(topCardIndex, 1);

  const activeColor: UnoActiveColor =
    topCard.color === "WILD"
      ? BASE_COLORS[Math.floor(Math.random() * BASE_COLORS.length)]
      : (topCard.color as UnoActiveColor);

  return {
    deck,
    discardPile: [topCard],
    topCard,
    activeColor,
    direction: 1,
    playerHands,
    unoShouted,
    lastActionMessageAr: `بدأت جولة أونو! الورقة الأولى هي [${topCard.labelAr}].`,
    turnJustStarted: true,
    hasDrawnThisTurn: false,
    drawnCardId: undefined
  };
}

/**
 * Check if a card is legally playable according to Uno rules
 */
export function canPlayUnoCard(
  card: UnoCard,
  topCard: UnoCard,
  activeColor: UnoActiveColor
): boolean {
  if (card.color === "WILD") return true;
  if (card.color === activeColor) return true;
  if (card.value === topCard.value) return true;
  return false;
}

/**
 * Get all playable cards in hand
 */
export function getPlayableUnoCards(
  hand: UnoCard[],
  topCard: UnoCard,
  activeColor: UnoActiveColor
): UnoCard[] {
  return hand.filter((c) => canPlayUnoCard(c, topCard, activeColor));
}

/**
 * Safely draw cards from deck, recycling discard pile if deck gets exhausted
 */
export function drawCardsFromDeck(
  state: UnoState,
  count: number
): UnoCard[] {
  const drawn: UnoCard[] = [];

  for (let i = 0; i < count; i++) {
    if (state.deck.length === 0) {
      if (state.discardPile.length > 1) {
        // Leave the top card on discardPile, shuffle the rest back into deck
        const cardsToRecycle = state.discardPile.slice(0, state.discardPile.length - 1);
        state.discardPile = [state.topCard];
        state.deck = shuffleDeck(cardsToRecycle);
      } else {
        // Completely out of cards
        break;
      }
    }

    if (state.deck.length > 0) {
      drawn.push(state.deck.pop()!);
    }
  }

  return drawn;
}

export interface PlayCardResult {
  nextTurnIndex: number;
  messageAr: string;
  isGameOver: boolean;
  winnerId?: string;
  penaltyApplied?: boolean;
}

/**
 * Execute playing a card in the Uno engine
 */
export function executePlayUnoCard(
  state: UnoState,
  turnOrder: string[],
  currentTurnIndex: number,
  playerId: string,
  cardId: string,
  chosenColor?: UnoActiveColor,
  playerNames?: Record<string, string>
): PlayCardResult {
  const activePlayerId = turnOrder[currentTurnIndex];
  if (activePlayerId !== playerId) {
    throw new Error("ليس دورك للعب الآن!");
  }

  const hand = state.playerHands[playerId];
  if (!hand) {
    throw new Error("بيانات اللاعب غير موجودة في لعبة أونو.");
  }

  const cardIndex = hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) {
    throw new Error("البطاقة غير موجودة في يدك.");
  }

  const card = hand[cardIndex];
  if (!canPlayUnoCard(card, state.topCard, state.activeColor)) {
    throw new Error(
      `لا يمكن لعب هذه الورقة! يجب أن تطابق اللون الحالي (${UNO_COLOR_CONFIG[state.activeColor].nameAr}) أو الرقم/الرمز (${state.topCard.label}).`
    );
  }

  // القاعدة الرسمية: بعد سحب ورقة يمكن لعب الورقة المسحوبة فقط أو تمرير الدور.
  if (state.hasDrawnThisTurn && cardId !== state.drawnCardId) {
    throw new Error(
      "بعد السحب يمكنك لعب الورقة المسحوبة فقط، أو تمرير الدور إلى اللاعب التالي."
    );
  }

  // Handle Wild color selection
  let finalActiveColor: UnoActiveColor;
  if (card.color === "WILD") {
    if (!chosenColor || !BASE_COLORS.includes(chosenColor)) {
      throw new Error("يجب اختيار لون جديد عند لعب بطاقة الجوكر!");
    }
    finalActiveColor = chosenColor;
  } else {
    finalActiveColor = card.color as UnoActiveColor;
  }

  // Remove card from hand
  hand.splice(cardIndex, 1);

  // استهلك حالة السحب: أي ورقة تُلعب تُصفّر تتبع ورقة السحب.
  state.hasDrawnThisTurn = false;
  state.drawnCardId = undefined;

  // Update discard pile and top card
  state.discardPile.push(card);
  state.topCard = card;
  state.activeColor = finalActiveColor;
  state.lastPlayedCard = card;
  state.lastPlayedBy = playerId;

  const pName = playerNames?.[playerId] || `اللاعب #${playerId.slice(-4)}`;
  const totalPlayers = turnOrder.length;
  let nextTurnIndex = currentTurnIndex;
  let messageAr = "";
  let penaltyApplied = false;

  // 1. Win Check: If hand is empty, player wins!
  if (hand.length === 0) {
    state.winner = playerId;
    messageAr = `🏆 أنهى ${pName} جميع أوراقه وفاز باللعبة! مبروووك!`;
    state.lastActionMessageAr = messageAr;
    return {
      nextTurnIndex: currentTurnIndex,
      messageAr,
      isGameOver: true,
      winnerId: playerId
    };
  }

  // 2. Uno Shout Penalty Check:
  // If player now has exactly 1 card remaining and did NOT shout UNO, penalize with 2 cards!
  if (hand.length === 1) {
    if (!state.unoShouted[playerId]) {
      const penaltyCards = drawCardsFromDeck(state, 2);
      hand.push(...penaltyCards);
      penaltyApplied = true;
      messageAr = `⚠️ نسي ${pName} الصراخ بأونو (UNO)! تم تطبيق عقوبة سحب ورقتين إضافيتين! 🔥`;
    } else {
      messageAr = `🔥 صرخ ${pName}: أونووووو! بقيت ورقة واحدة في يده!`;
    }
  } else {
    // Reset shouted flag if player has more than 1 card
    state.unoShouted[playerId] = false;
  }

  // 3. Action Cards Resolution & Turn Advancing
  if (card.value === "SKIP") {
    // Skip next player: advance by 2 steps in current direction
    const skippedIdx = (currentTurnIndex + state.direction + totalPlayers) % totalPlayers;
    const skippedName = playerNames?.[turnOrder[skippedIdx]] || "الخصم";
    nextTurnIndex = (currentTurnIndex + state.direction * 2 + totalPlayers * 2) % totalPlayers;
    const actionDesc = `${pName} لعب تخطي ⊘! تم تخطي دور ${skippedName}.`;
    messageAr = penaltyApplied ? `${messageAr} (${actionDesc})` : actionDesc;
  } else if (card.value === "REVERSE") {
    // Reverse direction
    state.direction = (state.direction * -1) as 1 | -1;

    if (totalPlayers === 2) {
      // In 2-player official Uno rules, Reverse acts as a Skip (player gets another turn)
      nextTurnIndex = currentTurnIndex;
      const actionDesc = `${pName} لعب عكس الاتجاه ⇄ (تخطي الخصم في المواجهة الثنائية، دوره مجدداً!)`;
      messageAr = penaltyApplied ? `${messageAr} (${actionDesc})` : actionDesc;
    } else {
      nextTurnIndex = (currentTurnIndex + state.direction + totalPlayers) % totalPlayers;
      const actionDesc = `${pName} عكس اتجاه اللعب ⇄! الاتجاه الآن ${state.direction === 1 ? "مع عقارب الساعة" : "عكس عقارب الساعة"}.`;
      messageAr = penaltyApplied ? `${messageAr} (${actionDesc})` : actionDesc;
    }
  } else if (card.value === "DRAW_TWO") {
    // Next player draws 2 cards and skips turn
    const victimIdx = (currentTurnIndex + state.direction + totalPlayers) % totalPlayers;
    const victimId = turnOrder[victimIdx];
    const victimHand = state.playerHands[victimId];
    const victimName = playerNames?.[victimId] || "الخصم";

    if (victimHand) {
      const drawn = drawCardsFromDeck(state, 2);
      victimHand.push(...drawn);
    }

    nextTurnIndex = (currentTurnIndex + state.direction * 2 + totalPlayers * 2) % totalPlayers;
    const actionDesc = `${pName} هاجم ببطاقة +2! سحب ${victimName} ورقتين وخسر دوره!`;
    messageAr = penaltyApplied ? `${messageAr} (${actionDesc})` : actionDesc;
  } else if (card.value === "WILD") {
    // Wild card: player chose color, turn advances 1 step
    nextTurnIndex = (currentTurnIndex + state.direction + totalPlayers) % totalPlayers;
    const colorName = UNO_COLOR_CONFIG[finalActiveColor].nameAr;
    const actionDesc = `${pName} لعب جوكر ★ وغيّر لون اللعب إلى [${colorName}]!`;
    messageAr = penaltyApplied ? `${messageAr} (${actionDesc})` : actionDesc;
  } else if (card.value === "WILD_DRAW_FOUR") {
    // +4 Wild: next player draws 4 cards and skips turn
    const victimIdx = (currentTurnIndex + state.direction + totalPlayers) % totalPlayers;
    const victimId = turnOrder[victimIdx];
    const victimHand = state.playerHands[victimId];
    const victimName = playerNames?.[victimId] || "الخصم";

    if (victimHand) {
      const drawn = drawCardsFromDeck(state, 4);
      victimHand.push(...drawn);
    }

    nextTurnIndex = (currentTurnIndex + state.direction * 2 + totalPlayers * 2) % totalPlayers;
    const colorName = UNO_COLOR_CONFIG[finalActiveColor].nameAr;
    const actionDesc = `${pName} فجر قنبلة +4! غيّر اللون إلى [${colorName}]، وسحب ${victimName} 4 أوراق وفات دوره!`;
    messageAr = penaltyApplied ? `${messageAr} (${actionDesc})` : actionDesc;
  } else {
    // Normal number card ("0"-"9"): advance 1 step
    nextTurnIndex = (currentTurnIndex + state.direction + totalPlayers) % totalPlayers;
    const actionDesc = `${pName} لعب [${card.labelAr}].`;
    messageAr = penaltyApplied ? `${messageAr} (${actionDesc})` : actionDesc;
  }

  state.lastActionMessageAr = messageAr;

  return {
    nextTurnIndex,
    messageAr,
    isGameOver: false,
    penaltyApplied
  };
}

export interface DrawCardResult {
  drawnCard: UnoCard;
  canPlayDrawnCard: boolean;
  nextTurnIndex: number;
  messageAr: string;
}

/**
 * Execute drawing a card from the deck for the active player.
 * If the drawn card is playable, the player can play it immediately or keep it.
 * If not playable, turn auto-advances.
 */
export function executeDrawUnoCard(
  state: UnoState,
  turnOrder: string[],
  currentTurnIndex: number,
  playerId: string,
  playerNames?: Record<string, string>
): DrawCardResult {
  const activePlayerId = turnOrder[currentTurnIndex];
  if (activePlayerId !== playerId) {
    throw new Error("ليس دورك للسحب الآن!");
  }

  const hand = state.playerHands[playerId];
  if (!hand) {
    throw new Error("بيانات اللاعب غير موجودة.");
  }

  if (state.hasDrawnThisTurn) {
    throw new Error(
      "لقد سحبت ورقة بالفعل هذا الدور. العب الورقة المسحوبة أو مرّر الدور."
    );
  }

  const drawn = drawCardsFromDeck(state, 1);
  if (drawn.length === 0) {
    throw new Error("لا توجد بطاقات متبقية في كومة السحب!");
  }

  const drawnCard = drawn[0];
  hand.push(drawnCard);
  state.hasDrawnThisTurn = true;
  state.drawnCardId = drawnCard.id;

  // If player previously shouted UNO and now has more than 1 card, reset shout
  if (hand.length > 1) {
    state.unoShouted[playerId] = false;
  }

  const canPlay = canPlayUnoCard(drawnCard, state.topCard, state.activeColor);
  const pName = playerNames?.[playerId] || `اللاعب #${playerId.slice(-4)}`;
  const totalPlayers = turnOrder.length;

  let nextTurnIndex = currentTurnIndex;
  let messageAr = "";

  if (canPlay) {
    messageAr = `سحب ${pName} ورقة قابلة للعب مباشرة [${drawnCard.labelAr}]! يمكنه لعبها الآن أو تمرير الدور.`;
  } else {
    nextTurnIndex = (currentTurnIndex + state.direction + totalPlayers) % totalPlayers;
    messageAr = `سحب ${pName} ورقة غير مطابقة وتمرر الدور إلى اللاعب التالي.`;
    // لا توجد فرصة للعب، لذا ينتهي الدور فوراً وتُصفّر حالة السحب.
    state.hasDrawnThisTurn = false;
    state.drawnCardId = undefined;
  }

  state.lastActionMessageAr = messageAr;

  return {
    drawnCard,
    canPlayDrawnCard: canPlay,
    nextTurnIndex,
    messageAr
  };
}

export interface PassAfterDrawResult {
  nextTurnIndex: number;
  messageAr: string;
}

/**
 * تمرير الدور بعد سحب ورقة قابلة للعب والاحتفاظ بها في اليد.
 * لا يُسمح بالتمرير قبل السحب أو بعد لعب ورقة.
 */
export function executePassUnoAfterDraw(
  state: UnoState,
  turnOrder: string[],
  currentTurnIndex: number,
  playerId: string,
  playerNames?: Record<string, string>
): PassAfterDrawResult {
  const activePlayerId = turnOrder[currentTurnIndex];
  if (activePlayerId !== playerId) {
    throw new Error("ليس دورك للتمرير الآن!");
  }
  if (!state.hasDrawnThisTurn) {
    throw new Error("لا يمكنك تمرير الدور قبل سحب ورقة من الكومة.");
  }

  state.hasDrawnThisTurn = false;
  state.drawnCardId = undefined;

  const totalPlayers = turnOrder.length;
  const nextTurnIndex =
    (currentTurnIndex + state.direction + totalPlayers) % totalPlayers;
  const pName = playerNames?.[playerId] || `اللاعب #${playerId.slice(-4)}`;
  const messageAr = `احتفظ ${pName} بالورقة المسحوبة ومرّر الدور إلى اللاعب التالي.`;

  state.lastActionMessageAr = messageAr;

  return { nextTurnIndex, messageAr };
}

/**
 * Handle a player shouting "UNO!"
 */
export function executeShoutUno(
  state: UnoState,
  playerId: string,
  playerNames?: Record<string, string>
): string {
  const hand = state.playerHands[playerId];
  if (!hand) {
    throw new Error("بيانات اللاعب غير موجودة.");
  }

  // Can shout UNO when holding 1 or 2 cards (anticipating playing down to 1)
  if (hand.length > 2) {
    throw new Error("لا يمكنك الصراخ بأونو إلا عندما يتبقى في يدك ورقة واحدة أو اثنتان!");
  }

  state.unoShouted[playerId] = true;
  const pName = playerNames?.[playerId] || `اللاعب #${playerId.slice(-4)}`;
  const messageAr = `🔥 صرخ ${pName} بصوت عااالٍ: أونووووووووو!`;
  state.lastActionMessageAr = messageAr;
  return messageAr;
}

/**
 * Intelligent Bot AI for Uno:
 * - Prioritizes action cards (+2, Skip, Reverse) to sabotage opponents
 * - Matches numbers/colors
 * - Uses Wilds strategically
 * - Intelligently picks color matching dominant hand distribution
 * - Always shouts UNO when down to 1 card
 */
export function getBestUnoBotMove(
  state: UnoState,
  botPlayerId: string,
  onlyCardId?: string
): {
  action: "PLAY" | "DRAW";
  cardId?: string;
  chosenColor?: UnoActiveColor;
  shoutUno: boolean;
} {
  const hand = state.playerHands[botPlayerId] || [];
  const playable = getPlayableUnoCards(hand, state.topCard, state.activeColor).filter(
    (card) => !onlyCardId || card.id === onlyCardId
  );

  const shouldShoutUno = hand.length === 2 && playable.length > 0;

  if (playable.length === 0) {
    return {
      action: "DRAW",
      shoutUno: false
    };
  }

  // Score candidate cards to pick the best strategic card:
  // 1. Draw Two (+2) has highest disruption value
  // 2. Skip has high value
  // 3. Reverse has high value
  // 4. Number cards matching active color
  // 5. Number cards matching top number
  // 6. Wild cards kept as backup unless no other color matches
  const sorted = [...playable].sort((a, b) => {
    const getScore = (c: UnoCard) => {
      if (c.value === "DRAW_TWO") return 100;
      if (c.value === "SKIP") return 80;
      if (c.value === "REVERSE") return 70;
      if (c.value === "WILD_DRAW_FOUR") return hand.length <= 3 ? 90 : 20; // Save +4 for end
      if (c.value === "WILD") return hand.length <= 2 ? 85 : 15; // Save Wild for end
      if (c.color === state.activeColor) return 50;
      return 40;
    };
    return getScore(b) - getScore(a);
  });

  const bestCard = sorted[0];

  // If wild card, determine dominant color in bot's hand
  let chosenColor: UnoActiveColor = "RED";
  if (bestCard.color === "WILD") {
    const colorCounts: Record<UnoActiveColor, number> = {
      RED: 0,
      BLUE: 0,
      GREEN: 0,
      YELLOW: 0
    };

    for (const c of hand) {
      if (c.color !== "WILD") {
        colorCounts[c.color as UnoActiveColor]++;
      }
    }

    let maxCount = -1;
    for (const color of BASE_COLORS) {
      if (colorCounts[color] > maxCount) {
        maxCount = colorCounts[color];
        chosenColor = color;
      }
    }
  }

  return {
    action: "PLAY",
    cardId: bestCard.id,
    chosenColor: bestCard.color === "WILD" ? chosenColor : undefined,
    shoutUno: shouldShoutUno
  };
}

/**
 * Filter UnoState for network transmission ensuring opponents cannot see each other's cards
 */
export function sanitizeUnoStateForViewer(
  state: UnoState,
  viewerId: string
): UnoSanitizedState {
  const playerCardCounts: Record<string, number> = {};
  for (const [pid, hand] of Object.entries(state.playerHands)) {
    playerCardCounts[pid] = hand.length;
  }

  // Owner sees full hand, opponents and HOST see empty array
  const myHand = viewerId !== "HOST" && state.playerHands[viewerId] ? state.playerHands[viewerId] : [];
  // لا نكشف معرّف الورقة المسحوبة للخصوم (قد يفشي قيمتها).
  const canSeeDrawnCard =
    viewerId !== "HOST" &&
    Boolean(state.drawnCardId) &&
    Boolean(state.playerHands[viewerId]?.some((card) => card.id === state.drawnCardId));

  return {
    deckCount: state.deck.length,
    topCard: state.topCard,
    activeColor: state.activeColor,
    direction: state.direction,
    playerCardCounts,
    myHand,
    unoShouted: state.unoShouted,
    lastActionMessageAr: state.lastActionMessageAr,
    lastPlayedCard: state.lastPlayedCard,
    lastPlayedBy: state.lastPlayedBy,
    winner: state.winner,
    hasDrawnThisTurn: Boolean(state.hasDrawnThisTurn),
    drawnCardId: canSeeDrawnCard ? state.drawnCardId : undefined
  };
}
