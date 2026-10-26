/**
 * Authentic Ludo & Jackaroo (لودو وجاكارو المجلس) Game Engine
 * Implements full 15x15 board geometry, 52-step perimeter track,
 * safe star squares, 4 distinct home bases, 5-step colored home columns,
 * capturing/eating mechanics, bonus roll rules, exact finish roll, and smart AI.
 */

import type { BoardTile, GameCard, GeneratedSessionPack } from "./schema";

export type LudoColor = "green" | "red" | "yellow" | "blue";
export type LudoTokenState = "HOME_BASE" | "ON_TRACK" | "HOME_PATH" | "FINISHED";

export interface LudoToken {
  id: number; // 0, 1, 2, 3
  state: LudoTokenState;
  stepCount: number; // 0 when HOME_BASE. ON_TRACK: 0..50. HOME_PATH: 51..55. FINISHED: 56.
}

export interface LudoPlayerTokens {
  playerId: string;
  playerIndex: number; // 0, 1, 2, 3
  color: LudoColor;
  colorHex: string;
  nameAr: string;
  startTrackTile: number; // 0 (green), 13 (red), 26 (yellow), 39 (blue)
  homeEntranceTile: number; // 50 (green), 11 (red), 24 (yellow), 37 (blue)
  tokens: LudoToken[]; // 4 tokens
  finishedCount: number; // 0..4
  rank?: number; // 1 for 1st, 2 for 2nd, etc.
}

export interface LudoMoveResult {
  success: boolean;
  messageAr: string;
  playerId: string;
  tokenId: number;
  fromState: LudoTokenState;
  toState: LudoTokenState;
  fromStep: number;
  toStep: number;
  diceRoll: number;
  trackTile?: number;
  capturedToken?: {
    playerId: string;
    tokenId: number;
    tileIndex: number;
  };
  reachedHome?: boolean;
  awardedBonusRoll?: boolean;
  winnerRank?: number;
}

export interface LudoState {
  isActive: boolean;
  players: Record<string, LudoPlayerTokens>;
  pendingDiceRoll?: number;
  eligibleTokenIds?: number[];
  consecutiveSixes: number;
  winners: string[]; // playerIds in order of winning
  lastMoveResult?: LudoMoveResult;
}

export const LUDO_BOARD_SIZE = 15;
export const LUDO_TRACK_LENGTH = 52;
export const LUDO_HOME_PATH_LENGTH = 5;
export const LUDO_MAX_STEPS = 56; // step 56 is FINISHED

// 8 Safe Squares: 4 start squares + 4 star squares (8 steps ahead of each start)
export const LUDO_SAFE_TILES = [0, 8, 13, 21, 26, 34, 39, 47];

export interface GridCoord {
  row: number;
  col: number;
}

// 52 Perimeter Track Coordinates on 15x15 Grid (0-indexed, rows 0..14, cols 0..14)
export const TRACK_TILE_COORDS: GridCoord[] = [
  // Quadrant 1: Green arm heading to Red arm
  { row: 6, col: 1 },  // 0: Green Start 🟢
  { row: 6, col: 2 },  // 1
  { row: 6, col: 3 },  // 2
  { row: 6, col: 4 },  // 3
  { row: 6, col: 5 },  // 4
  { row: 5, col: 6 },  // 5: Turn up into top arm
  { row: 4, col: 6 },  // 6
  { row: 3, col: 6 },  // 7
  { row: 2, col: 6 },  // 8: Green Star ⭐️
  { row: 1, col: 6 },  // 9
  { row: 0, col: 6 },  // 10
  { row: 0, col: 7 },  // 11: Top middle cell
  { row: 0, col: 8 },  // 12: Turn corner

  // Quadrant 2: Red arm heading to Yellow arm
  { row: 1, col: 8 },  // 13: Red Start 🔴
  { row: 2, col: 8 },  // 14
  { row: 3, col: 8 },  // 15
  { row: 4, col: 8 },  // 16
  { row: 5, col: 8 },  // 17
  { row: 6, col: 9 },  // 18: Turn right into right arm
  { row: 6, col: 10 }, // 19
  { row: 6, col: 11 }, // 20
  { row: 6, col: 12 }, // 21: Red Star ⭐️
  { row: 6, col: 13 }, // 22
  { row: 6, col: 14 }, // 23
  { row: 7, col: 14 }, // 24: Right middle cell
  { row: 8, col: 14 }, // 25: Turn corner

  // Quadrant 3: Yellow arm heading to Blue arm
  { row: 8, col: 13 }, // 26: Yellow Start 🟡
  { row: 8, col: 12 }, // 27
  { row: 8, col: 11 }, // 28
  { row: 8, col: 10 }, // 29
  { row: 8, col: 9 },  // 30
  { row: 9, col: 8 },  // 31: Turn down into bottom arm
  { row: 10, col: 8 }, // 32
  { row: 11, col: 8 }, // 33
  { row: 12, col: 8 }, // 34: Yellow Star ⭐️
  { row: 13, col: 8 }, // 35
  { row: 14, col: 8 }, // 36
  { row: 14, col: 7 }, // 37: Bottom middle cell
  { row: 14, col: 6 }, // 38: Turn corner

  // Quadrant 4: Blue arm heading back to Green arm
  { row: 13, col: 6 }, // 39: Blue Start 🔵
  { row: 12, col: 6 }, // 40
  { row: 11, col: 6 }, // 41
  { row: 10, col: 6 }, // 42
  { row: 9, col: 6 },  // 43
  { row: 8, col: 5 },  // 44: Turn left into left arm
  { row: 8, col: 4 },  // 45
  { row: 8, col: 3 },  // 46
  { row: 8, col: 2 },  // 47: Blue Star ⭐️
  { row: 8, col: 1 },  // 48
  { row: 8, col: 0 },  // 49
  { row: 7, col: 0 },  // 50: Left middle cell (Green home entrance)
  { row: 6, col: 0 }   // 51: Turn corner into start
];

export interface LudoColorConfig {
  color: LudoColor;
  colorHex: string;
  nameAr: string;
  startTrackTile: number;
  homeEntranceTile: number;
  yardCoords: GridCoord[];
  homePathCoords: GridCoord[];
  goalCoord: GridCoord;
}

export const LUDO_COLORS: Record<LudoColor, LudoColorConfig> = {
  green: {
    color: "green",
    colorHex: "#22C55E",
    nameAr: "الأخضر",
    startTrackTile: 0,
    homeEntranceTile: 50,
    yardCoords: [
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 3, col: 2 },
      { row: 3, col: 3 }
    ],
    homePathCoords: [
      { row: 7, col: 1 },
      { row: 7, col: 2 },
      { row: 7, col: 3 },
      { row: 7, col: 4 },
      { row: 7, col: 5 }
    ],
    goalCoord: { row: 7, col: 6 }
  },
  red: {
    color: "red",
    colorHex: "#EF4444",
    nameAr: "الأحمر",
    startTrackTile: 13,
    homeEntranceTile: 11,
    yardCoords: [
      { row: 2, col: 11 },
      { row: 2, col: 12 },
      { row: 3, col: 11 },
      { row: 3, col: 12 }
    ],
    homePathCoords: [
      { row: 1, col: 7 },
      { row: 2, col: 7 },
      { row: 3, col: 7 },
      { row: 4, col: 7 },
      { row: 5, col: 7 }
    ],
    goalCoord: { row: 6, col: 7 }
  },
  yellow: {
    color: "yellow",
    colorHex: "#EAB308",
    nameAr: "الأصفر",
    startTrackTile: 26,
    homeEntranceTile: 24,
    yardCoords: [
      { row: 11, col: 11 },
      { row: 11, col: 12 },
      { row: 12, col: 11 },
      { row: 12, col: 12 }
    ],
    homePathCoords: [
      { row: 7, col: 13 },
      { row: 7, col: 12 },
      { row: 7, col: 11 },
      { row: 7, col: 10 },
      { row: 7, col: 9 }
    ],
    goalCoord: { row: 7, col: 8 }
  },
  blue: {
    color: "blue",
    colorHex: "#3B82F6",
    nameAr: "الأزرق",
    startTrackTile: 39,
    homeEntranceTile: 37,
    yardCoords: [
      { row: 11, col: 2 },
      { row: 11, col: 3 },
      { row: 12, col: 2 },
      { row: 12, col: 3 }
    ],
    homePathCoords: [
      { row: 13, col: 7 },
      { row: 12, col: 7 },
      { row: 11, col: 7 },
      { row: 10, col: 7 },
      { row: 9, col: 7 }
    ],
    goalCoord: { row: 8, col: 7 }
  }
};

export const COLOR_ORDER: LudoColor[] = ["green", "red", "yellow", "blue"];

export function isSafeTile(tileIndex: number): boolean {
  return LUDO_SAFE_TILES.includes(tileIndex);
}

/**
 * Returns exact (row, col) grid coordinates on the 15x15 board for any token.
 */
export function getTokenBoardCoordinates(
  player: LudoPlayerTokens,
  token: LudoToken
): GridCoord {
  const cfg = LUDO_COLORS[player.color];

  if (token.state === "HOME_BASE") {
    return cfg.yardCoords[token.id % 4] || cfg.yardCoords[0];
  }

  if (token.state === "FINISHED") {
    return cfg.goalCoord;
  }

  if (token.state === "HOME_PATH") {
    const pathIdx = Math.max(0, Math.min(4, token.stepCount - 51));
    return cfg.homePathCoords[pathIdx];
  }

  // ON_TRACK:
  const trackIdx = (player.startTrackTile + token.stepCount) % LUDO_TRACK_LENGTH;
  return TRACK_TILE_COORDS[trackIdx];
}

/**
 * Initializes a player's Ludo tokens.
 */
export function initLudoPlayer(
  playerId: string,
  playerIndex: number,
  customColorHex?: string
): LudoPlayerTokens {
  const colorKey = COLOR_ORDER[playerIndex % COLOR_ORDER.length];
  const cfg = LUDO_COLORS[colorKey];

  return {
    playerId,
    playerIndex,
    color: colorKey,
    colorHex: customColorHex || cfg.colorHex,
    nameAr: cfg.nameAr,
    startTrackTile: cfg.startTrackTile,
    homeEntranceTile: cfg.homeEntranceTile,
    finishedCount: 0,
    tokens: [
      { id: 0, state: "HOME_BASE", stepCount: 0 },
      { id: 1, state: "HOME_BASE", stepCount: 0 },
      { id: 2, state: "HOME_BASE", stepCount: 0 },
      { id: 3, state: "HOME_BASE", stepCount: 0 }
    ]
  };
}

/**
 * Initializes full Ludo state for a game room.
 */
export function initLudoState(
  turnOrder: string[],
  players?: Record<string, { id: string; name: string; color?: string }>
): LudoState {
  const ludoPlayers: Record<string, LudoPlayerTokens> = {};

  turnOrder.forEach((pid, idx) => {
    const pInfo = players?.[pid];
    ludoPlayers[pid] = initLudoPlayer(pid, idx, pInfo?.color);
  });

  return {
    isActive: true,
    players: ludoPlayers,
    consecutiveSixes: 0,
    winners: []
  };
}

/**
 * Returns which tokens (IDs 0..3) can be moved by the player given the rolled dice value.
 */
export function getEligibleTokensToMove(
  player: LudoPlayerTokens,
  diceRoll: number
): number[] {
  const eligible: number[] = [];

  for (const token of player.tokens) {
    if (token.state === "FINISHED") {
      continue;
    }

    if (token.state === "HOME_BASE") {
      // Must roll 6 to exit home base
      if (diceRoll === 6) {
        eligible.push(token.id);
      }
      continue;
    }

    if (token.state === "ON_TRACK" || token.state === "HOME_PATH") {
      // Exact roll to finish: total steps cannot exceed 56
      if (token.stepCount + diceRoll <= LUDO_MAX_STEPS) {
        eligible.push(token.id);
      }
    }
  }

  return eligible;
}

export function canAnyTokenMove(
  player: LudoPlayerTokens,
  diceRoll: number
): boolean {
  return getEligibleTokensToMove(player, diceRoll).length > 0;
}

/**
 * Executes a token move on the Ludo board, handling captures, bonus turns, and victory.
 */
export function executeLudoMove(
  ludoState: LudoState,
  playerId: string,
  tokenId: number,
  diceRoll: number
): LudoMoveResult {
  const player = ludoState.players[playerId];
  if (!player) {
    throw new Error("لاعب لودو غير موجود في الجلسة.");
  }

  const token = player.tokens.find((t) => t.id === tokenId);
  if (!token) {
    throw new Error(`القطعة رقم ${tokenId} غير موجودة.`);
  }

  const eligible = getEligibleTokensToMove(player, diceRoll);
  if (!eligible.includes(tokenId)) {
    throw new Error(`لا يمكن تحريك هذه القطعة بالنرد الحالي (${diceRoll})!`);
  }

  const fromState = token.state;
  const fromStep = token.stepCount;
  let toState = fromState;
  let toStep = fromStep;
  let trackTile: number | undefined;
  let capturedToken: LudoMoveResult["capturedToken"];
  let reachedHome = false;
  let awardedBonusRoll = false;

  // Case 1: Exiting Home Base (Rolled 6)
  if (fromState === "HOME_BASE") {
    token.state = "ON_TRACK";
    token.stepCount = 0;
    toState = "ON_TRACK";
    toStep = 0;
    trackTile = player.startTrackTile;
    awardedBonusRoll = true; // Rolling 6 always awards a bonus roll!
  } else {
    // Case 2: Moving forward on Track or Home Path
    toStep = fromStep + diceRoll;
    token.stepCount = toStep;

    if (toStep === LUDO_MAX_STEPS) {
      // Reached Victory Center
      token.state = "FINISHED";
      toState = "FINISHED";
      reachedHome = true;
      player.finishedCount += 1;
      awardedBonusRoll = true; // Bonus roll for getting a piece home!

      if (player.finishedCount === 4 && !player.rank) {
        const nextRank = ludoState.winners.length + 1;
        player.rank = nextRank;
        ludoState.winners.push(playerId);
      }
    } else if (toStep >= 51) {
      // In Home Path (immune from capture)
      token.state = "HOME_PATH";
      toState = "HOME_PATH";
      if (diceRoll === 6) awardedBonusRoll = true;
    } else {
      // On Track
      token.state = "ON_TRACK";
      toState = "ON_TRACK";
      trackTile = (player.startTrackTile + toStep) % LUDO_TRACK_LENGTH;

      // Check Capturing (Eating) Opponent Pieces
      if (!isSafeTile(trackTile)) {
        for (const [otherPid, otherPlayer] of Object.entries(ludoState.players)) {
          if (otherPid === playerId) continue;

          for (const otherToken of otherPlayer.tokens) {
            if (otherToken.state === "ON_TRACK") {
              const otherTrackTile =
                (otherPlayer.startTrackTile + otherToken.stepCount) %
                LUDO_TRACK_LENGTH;

              if (otherTrackTile === trackTile) {
                // CAPTURE! Send opponent piece back to their home base
                otherToken.state = "HOME_BASE";
                otherToken.stepCount = 0;
                capturedToken = {
                  playerId: otherPid,
                  tokenId: otherToken.id,
                  tileIndex: trackTile
                };
                awardedBonusRoll = true; // Capturing awards an extra turn!
                break;
              }
            }
          }
          if (capturedToken) break;
        }
      }

      if (diceRoll === 6) awardedBonusRoll = true;
    }
  }

  let messageAr = `حرك القطعة ${tokenId + 1} بمقدار ${diceRoll} خطوات`;
  if (fromState === "HOME_BASE") {
    messageAr = `أخرج القطعة ${tokenId + 1} من المعسكر إلى مربع البداية! 🚀`;
  } else if (reachedHome) {
    messageAr = `أدخل القطعة ${tokenId + 1} إلى خط النهاية بنجاح! 🏆`;
  }
  if (capturedToken) {
    messageAr = `أكل قطعة الخصم وأعادها إلى المعسكر وحصل على دور إضافي! 💥👏`;
  } else if (awardedBonusRoll && diceRoll === 6) {
    messageAr += ` (رمية 6 تمنح دوراً إضافياً! 🎲)`;
  }

  const result: LudoMoveResult = {
    success: true,
    messageAr,
    playerId,
    tokenId,
    fromState,
    toState,
    fromStep,
    toStep,
    diceRoll,
    trackTile,
    capturedToken,
    reachedHome,
    awardedBonusRoll,
    winnerRank: player.rank
  };

  ludoState.lastMoveResult = result;
  return result;
}

/**
 * Smart Bot AI for Ludo:
 * Priority order:
 * 1) Moving out of home if rolled 6
 * 2) Capturing an opponent's token
 * 3) Escaping dangerous tiles (opponent is behind within 1-6 steps on an unsafe tile)
 * 4) Advancing piece closest to victory
 */
export function selectBestTokenForBot(
  player: LudoPlayerTokens,
  allPlayers: Record<string, LudoPlayerTokens>,
  diceRoll: number
): number | null {
  const eligibleIds = getEligibleTokensToMove(player, diceRoll);
  if (eligibleIds.length === 0) return null;
  if (eligibleIds.length === 1) return eligibleIds[0];

  let bestTokenId = eligibleIds[0];
  let highestScore = -Infinity;

  for (const tokenId of eligibleIds) {
    const token = player.tokens.find((t) => t.id === tokenId)!;
    let score = 0;

    // Check if token can capture an opponent
    let canCapture = false;
    if (token.state === "ON_TRACK" || token.state === "HOME_BASE") {
      const targetStep = token.state === "HOME_BASE" ? 0 : token.stepCount + diceRoll;
      if (targetStep <= 50) {
        const destTile = (player.startTrackTile + targetStep) % LUDO_TRACK_LENGTH;
        if (!isSafeTile(destTile)) {
          for (const [otherPid, otherPlayer] of Object.entries(allPlayers)) {
            if (otherPid === player.playerId) continue;
            for (const otherToken of otherPlayer.tokens) {
              if (otherToken.state === "ON_TRACK") {
                const otherTile =
                  (otherPlayer.startTrackTile + otherToken.stepCount) %
                  LUDO_TRACK_LENGTH;
                if (otherTile === destTile) {
                  canCapture = true;
                  break;
                }
              }
            }
            if (canCapture) break;
          }
        }
      }
    }

    // Priority 2: Capturing an opponent (+50,000)
    if (canCapture) {
      score += 50000;
    }

    // Priority 1: Moving out of home on 6 (+25,000 if not capturing)
    if (token.state === "HOME_BASE" && diceRoll === 6) {
      score += 25000;
    }

    // Check if token is currently in danger (an opponent is 1-6 steps behind on unsafe tile)
    let inDanger = false;
    if (token.state === "ON_TRACK") {
      const curTile = (player.startTrackTile + token.stepCount) % LUDO_TRACK_LENGTH;
      if (!isSafeTile(curTile)) {
        for (const [otherPid, otherPlayer] of Object.entries(allPlayers)) {
          if (otherPid === player.playerId) continue;
          for (const otherToken of otherPlayer.tokens) {
            if (otherToken.state === "ON_TRACK") {
              const otherTile =
                (otherPlayer.startTrackTile + otherToken.stepCount) %
                LUDO_TRACK_LENGTH;
              const distanceBehind = (curTile - otherTile + LUDO_TRACK_LENGTH) % LUDO_TRACK_LENGTH;
              if (distanceBehind >= 1 && distanceBehind <= 6) {
                inDanger = true;
                break;
              }
            }
          }
          if (inDanger) break;
        }
      }
    }

    // Priority 3: Escaping danger (+20,000)
    if (inDanger) {
      score += 20000;
    }

    // Reaching home or goal (+35,000 for finishing)
    if (token.stepCount + diceRoll === LUDO_MAX_STEPS) {
      score += 35000;
    } else if (token.stepCount + diceRoll >= 51 && token.state === "ON_TRACK") {
      // Entering immune home path
      score += 15000;
    }

    // Priority 4: Advancing piece closest to victory
    score += token.stepCount * 25;

    // Small penalty if move would land on an unsafe tile with opponent 1-6 behind
    if (token.stepCount + diceRoll <= 50) {
      const destTile = (player.startTrackTile + token.stepCount + diceRoll) % LUDO_TRACK_LENGTH;
      if (!isSafeTile(destTile)) {
        for (const [otherPid, otherPlayer] of Object.entries(allPlayers)) {
          if (otherPid === player.playerId) continue;
          for (const otherToken of otherPlayer.tokens) {
            if (otherToken.state === "ON_TRACK") {
              const otherTile =
                (otherPlayer.startTrackTile + otherToken.stepCount) %
                LUDO_TRACK_LENGTH;
              const dist = (destTile - otherTile + LUDO_TRACK_LENGTH) % LUDO_TRACK_LENGTH;
              if (dist >= 1 && dist <= 6) {
                score -= 4000;
                break;
              }
            }
          }
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestTokenId = tokenId;
    }
  }

  return bestTokenId;
}

export const AUTHENTIC_LUDO_PACK: GeneratedSessionPack = {
  themeTitle: "لودو وجاكارو المجلس (الكلاسيكية)",
  visualStyle: "ANCIENT_ARABIA",
  archetype: "BOARD_RACE",
  winCondition: "FIRST_TO_FINISH",
  currencyName: "نجمة",
  narratorIntro:
    "مرحباً بكم في لودو المجلس الكلاسيكية! أخرج قطعك بنرد 6، احمِ قواعدك على النجوم ⭐️، وكل قطع خصومك في طريقك نحو خط النهاية!",
  rulesConfig: {
    turnMechanism: "DICE_AND_MOVE",
    cardVisibility: "NO_HAND_CARDS",
    ownershipSystem: "NONE"
  },
  tiles: [
    {
      index: 0,
      tileType: "START",
      name: "معسكر البداية المشترك",
      description: "نقطة انطلاق سباق لودو الأسطوري نحو الهدف.",
      defaultEffect: { actionType: "MODIFY_COINS", targetType: "SELF", value: 100 }
    },
    {
      index: 1,
      tileType: "RESOURCE",
      name: "مربع البداية الأخضر 🟢",
      description: "خروج آمن ومكافأة انطلاق خضراء.",
      defaultEffect: { actionType: "MODIFY_COINS", targetType: "SELF", value: 50 }
    },
    {
      index: 2,
      tileType: "SECRET_CARD",
      name: "صندوق حظ المجلس 🎁",
      description: "اسحب بطاقة تكتيكية خاصة بلودو."
    },
    {
      index: 3,
      tileType: "RESOURCE",
      name: "المسار الشمالي السريع",
      description: "رياح مواتية تمنحك نجوم فخر.",
      defaultEffect: { actionType: "MODIFY_COINS", targetType: "SELF", value: 60 }
    },
    {
      index: 4,
      tileType: "HAZARD",
      name: "كمين الخصوم المباغت ⚠️",
      description: "فقدان بعض النجوم بسبب التهور!",
      defaultEffect: { actionType: "MODIFY_COINS", targetType: "SELF", value: -30 }
    },
    {
      index: 5,
      tileType: "RESOURCE",
      name: "نجمة الأمان الشمالية ⭐️",
      description: "مربع محمي لا يمكن أكل قطعك فيه أبداً.",
      defaultEffect: { actionType: "MODIFY_COINS", targetType: "SELF", value: 70 }
    },
    {
      index: 6,
      tileType: "DRAMA_EVENT",
      name: "نداء شيخ المجلس 📢",
      description: "حدث مفاجئ يقلب موازين الجلسة!"
    },
    {
      index: 7,
      tileType: "GLOBAL_VOTE",
      name: "تصويت طرد المشاغب 🗳️",
      description: "المجلس يصوت لمعاقبة أكثر لاعب أكل القطع!"
    },
    {
      index: 8,
      tileType: "RESOURCE",
      name: "مربع البداية الأحمر 🔴",
      description: "خروج الجيوش الحمراء بقوة.",
      defaultEffect: { actionType: "MODIFY_COINS", targetType: "SELF", value: 50 }
    },
    {
      index: 9,
      tileType: "SECRET_CARD",
      name: "غدر الصحراء التكتيكي 🃏",
      description: "اسحب بطاقة سرية لتغيير مجرى السباق."
    },
    {
      index: 10,
      tileType: "HAZARD",
      name: "عاصفة رملية تعيق الحركة 🌪️",
      description: "تراجع خطوتين للوراء!",
      defaultEffect: { actionType: "MOVE_STEPS", targetType: "SELF", value: -2 }
    },
    {
      index: 11,
      tileType: "RESOURCE",
      name: "نجمة الأمان الشرقية ⭐️",
      description: "حصن شرقي منيع ومكافأة نجوم.",
      defaultEffect: { actionType: "MODIFY_COINS", targetType: "SELF", value: 75 }
    },
    {
      index: 12,
      tileType: "DRAMA_EVENT",
      name: "مزاد نرد الحظ 🎲",
      description: "مزاد علني ومواقف ساخرة بين اللاعبين."
    },
    {
      index: 13,
      tileType: "RESOURCE",
      name: "مربع البداية الأصفر 🟡",
      description: "قوافل الأصفر تنطلق بأمان.",
      defaultEffect: { actionType: "MODIFY_COINS", targetType: "SELF", value: 50 }
    },
    {
      index: 14,
      tileType: "HAZARD",
      name: "فخ المطاردة والتعثر 🕳️",
      description: "تعثر مؤقت يخسرك بعض النجوم.",
      defaultEffect: { actionType: "MODIFY_COINS", targetType: "SELF", value: -35 }
    },
    {
      index: 15,
      tileType: "GLOBAL_VOTE",
      name: "محاكمة أكل القطع ⚖️",
      description: "تصويت جماعي لمعاقبة غدار الجلسة!"
    },
    {
      index: 16,
      tileType: "RESOURCE",
      name: "نجمة الأمان الجنوبية ⭐️",
      description: "مربع الحماية الذهبي الجنوبي.",
      defaultEffect: { actionType: "MODIFY_COINS", targetType: "SELF", value: 80 }
    },
    {
      index: 17,
      tileType: "SECRET_CARD",
      name: "حصانة الدرع الذهبي 🛡️",
      description: "بطاقة تحميك من هجمات الخصوم."
    },
    {
      index: 18,
      tileType: "DRAMA_EVENT",
      name: "وليمة الفوز الكبرى 🍖",
      description: "احتفال جماعي يقترب من النهاية."
    },
    {
      index: 19,
      tileType: "HAZARD",
      name: "المنعطف الأخير الخطر ⚡",
      description: "توتر الأعصاب قبل الدخول إلى الممر الآمن!",
      defaultEffect: { actionType: "MODIFY_COINS", targetType: "SELF", value: -40 }
    }
  ],
  cardsDeck: [
    {
      id: "ludo_card_01",
      title: "رمية نرد استثنائية 🎲",
      category: "SECRET_HAND",
      flavorText: "أعد رمي النرد واحصل على دفعة سريعة!",
      effects: [{ actionType: "MOVE_STEPS", targetType: "SELF", value: 4 }]
    },
    {
      id: "ludo_card_02",
      title: "درع الحصانة الملكي 🛡️",
      category: "SECRET_HAND",
      flavorText: "يحميك من أول محاولة أكل لقطعتك!",
      effects: [{ actionType: "GRANT_SHIELD", targetType: "SELF", value: 1 }]
    },
    {
      id: "ludo_card_03",
      title: "تبادل مواقع غادر 🔀",
      category: "SECRET_HAND",
      flavorText: "بدل موقعك مع الخصم المتصدر!",
      effects: [{ actionType: "SWAP_POSITIONS", targetType: "RICHEST_PLAYER", value: 0 }]
    },
    {
      id: "ludo_card_04",
      title: "تجميد نرد الخصم ⛔",
      category: "SECRET_HAND",
      flavorText: "عطل دور الخصم القريب منك!",
      effects: [{ actionType: "SKIP_TURN", targetType: "CHOSEN_PLAYER", value: 1 }]
    },
    {
      id: "ludo_card_05",
      title: "نهب نجوم الشهرة 💰",
      category: "SECRET_HAND",
      flavorText: "اسرق 50 نجمة من أغنى متسابق!",
      effects: [{ actionType: "STEAL_COINS", targetType: "RICHEST_PLAYER", value: 50 }]
    },
    {
      id: "ludo_card_06",
      title: "قفزة الغزال السريعة 🦌",
      category: "SECRET_HAND",
      flavorText: "تقدم 5 خطوات إضافية نحو الممر الآمن!",
      effects: [{ actionType: "MOVE_STEPS", targetType: "SELF", value: 5 }]
    },
    {
      id: "ludo_card_07",
      title: "عاصفة رملية عامة 🌪️",
      category: "PUBLIC_DRAMA",
      flavorText: "تراجع جميع اللاعبين خطوتين للوراء!",
      effects: [{ actionType: "MOVE_STEPS", targetType: "ALL_OTHERS", value: -2 }]
    },
    {
      id: "ludo_card_08",
      title: "مكافأة شيخ القبيلة 👑",
      category: "PUBLIC_DRAMA",
      flavorText: "يوزع الشيخ 60 نجمة على كل المتسابقين!",
      effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 60 }]
    },
    {
      id: "ludo_card_09",
      title: "ضريبة التهور على المتصدر ⚖️",
      category: "PUBLIC_DRAMA",
      flavorText: "المتصدر يدفع ضريبة الشهرة للمجلس!",
      effects: [{ actionType: "TAX_PERCENTAGE", targetType: "RICHEST_PLAYER", value: 20 }]
    },
    {
      id: "ludo_card_10",
      title: "هجوم الجراد الصحراوي 🦗",
      category: "PUBLIC_DRAMA",
      flavorText: "فقدان 30 نجمة لكل من في المسار الخارجي!",
      effects: [{ actionType: "MODIFY_COINS", targetType: "ALL_OTHERS", value: -30 }]
    },
    {
      id: "ludo_card_11",
      title: "حفلة شواء في المعسكر 🍗",
      category: "PUBLIC_DRAMA",
      flavorText: "احتفال يمنح الجميع طاقة ونجوماً إضافية!",
      effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 70 }]
    },
    {
      id: "ludo_card_12",
      title: "استرداد قطع غادرة 🔄",
      category: "PUBLIC_DRAMA",
      flavorText: "إنقاذ القطع العالقة ودعم المتعثرين!",
      effects: [{ actionType: "MODIFY_COINS", targetType: "POOREST_PLAYER", value: 65 }]
    },
    {
      id: "ludo_card_13",
      title: "رياح الشمال المواتية ⛵",
      category: "PUBLIC_DRAMA",
      flavorText: "تقدم سريع لجميع من في المسار!",
      effects: [{ actionType: "MOVE_STEPS", targetType: "SELF", value: 3 }]
    },
    {
      id: "ludo_card_14",
      title: "إنذار أخير من الحكم 🚩",
      category: "PUBLIC_DRAMA",
      flavorText: "خصم نجوم من اللاعب الأكثر هجوماً!",
      effects: [{ actionType: "MODIFY_COINS", targetType: "RICHEST_PLAYER", value: -45 }]
    },
    {
      id: "ludo_card_15",
      title: "أكثر لاعب غدار في اللودو 🗳️",
      category: "VOTE_CARD",
      flavorText: "صوتوا على من يستحق العقوبة بسبب أكله المتكرر للقطع!",
      effects: [{ actionType: "VOTE_PENALTY", targetType: "ALL_OTHERS", value: -60 }]
    },
    {
      id: "ludo_card_16",
      title: "صاحب الحظ الأعمى بالنرد 🗳️",
      category: "VOTE_CARD",
      flavorText: "صوتوا لمعاقبة صاحب النرد المحظوظ دائماً!",
      effects: [{ actionType: "VOTE_PENALTY", targetType: "ALL_OTHERS", value: -70 }]
    },
    {
      id: "ludo_card_17",
      title: "أبطأ لاعب في تحريك القطع 🗳️",
      category: "VOTE_CARD",
      flavorText: "صوتوا لتغريم اللاعب الذي يضيع وقت المجلس بالتفكير!",
      effects: [{ actionType: "VOTE_PENALTY", targetType: "ALL_OTHERS", value: -50 }]
    },
    {
      id: "ludo_card_18",
      title: "غدار اللفات الأخيرة 🗳️",
      category: "VOTE_CARD",
      flavorText: "صوتوا لإيقاف مخططات المتصدر قبل وصوله إلى خط النهاية!",
      effects: [{ actionType: "VOTE_PENALTY", targetType: "ALL_OTHERS", value: -80 }]
    }
  ]
};
