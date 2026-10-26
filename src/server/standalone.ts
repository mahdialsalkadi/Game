import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { BoardGameRoomMachine, FullRoomState } from "../game/gameRoom";
import { generateAISessionPack, getDefaultSessionPack, PRESET_PACKS } from "../game/aiPackGenerator";
import { GeneratedSessionPackSchema, type GeneratedSessionPack, type GameCard } from "../game/schema";
import { applyThemeToGamePack } from "../game/themeRegistry";
import { COMMUNITY_MAPS, getCommunityMapByKey } from "../game/communityMaps";
import { getBestUnoBotMove, sanitizeUnoStateForViewer, type UnoActiveColor } from "../game/unoEngine";
import { selectBestTokenForBot } from "../game/ludoEngine";
import {
  getBotName,
  getPlayerColor,
  resolveGameProfile,
  MAX_PLAYERS_GLOBAL,
  type GameProfile
} from "../game/gameProfiles";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 1999;

interface ClientConnection {
  id: string;
  ws: WebSocket;
  role: "HOST" | "PLAYER" | "SPECTATOR";
  playerId: string;
  roomId: string;
  isAuthorizedHost: boolean;
}

interface RoomInstance {
  id: string;
  machine: BoardGameRoomMachine;
  connections: Map<string, ClientConnection>;
  playerPrompts: Record<string, string>;
  lastActivityAt: number;
  hostToken: string;
  botTimer?: ReturnType<typeof setTimeout>;
  graceTimers: Map<string, ReturnType<typeof setTimeout>>;
  isBotTurnInProgress?: boolean;
}

const rooms = new Map<string, RoomInstance>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function playerCount(room: RoomInstance): number {
  return Object.keys(room.machine.state.players).length;
}

/**
 * ملء الغرفة بالبوتات حتى الحد الأدنى للعبة، مع احترام الحد الأقصى
 * وعدم تجاوز سعة الألوان المتاحة.
 */
function fillBotsToMinimum(room: RoomInstance, profile: GameProfile): void {
  const current = playerCount(room);
  if (current > profile.maxPlayers) {
    throw new Error(
      `هذه اللعبة (${profile.labelAr}) تقبل ${profile.maxPlayers} لاعبين كحد أقصى، لكن في الغرفة ${current}.`
    );
  }

  const target = Math.min(profile.minPlayers, profile.maxPlayers);
  let count = current;
  while (count < target) {
    const botId = `bot_${count + 1}_${Date.now().toString().slice(-5)}_${Math.random()
      .toString(36)
      .slice(2, 5)}`;
    room.machine.joinPlayer(
      botId,
      getBotName(count),
      getPlayerColor(count),
      undefined,
      true
    );
    count += 1;
  }
}

function fillDemoBots(room: RoomInstance, profile: GameProfile): void {
  const current = playerCount(room);
  if (current > profile.maxPlayers) {
    throw new Error(
      `هذه اللعبة (${profile.labelAr}) تقبل ${profile.maxPlayers} لاعبين كحد أقصى، لكن في الغرفة ${current}.`
    );
  }
  // العرض التجريبي الفوري يبدأ بثلاثة بوتات على الأقل، أو حد اللعبة الأدنى
  // إن كان أعلى (مثل المافيا التي تحتاج 5 لاعبين).
  const target = Math.min(profile.maxPlayers, Math.max(3, profile.minPlayers));
  let count = current;
  while (count < target) {
    const botId = `bot_${count + 1}_${Date.now().toString().slice(-5)}_${Math.random()
      .toString(36)
      .slice(2, 5)}`;
    room.machine.joinPlayer(
      botId,
      getBotName(count),
      getPlayerColor(count),
      undefined,
      true
    );
    count += 1;
  }
}

const DICE_GAME_TYPES = new Set<string>([
  "MONOPOLY",
  "LUDO",
  "SNAKES_AND_LADDERS"
]);

/** نوع اللعبة الحالي لتخصيص إيقاع البوت (نرد / بدون نرد). */
function getRoomGameType(room: RoomInstance): string {
  try {
    return room.machine.getActiveEngine().gameType;
  } catch {
    return "GENERIC_BOARD";
  }
}

async function executeBotTurnStaged(room: RoomInstance, botPlayerId: string): Promise<void> {
  if (room.isBotTurnInProgress) return;
  room.isBotTurnInProgress = true;

  try {
    const state = room.machine.state;
    if (!state || state.phase !== "TURN_START") return;

    const bot = state.players[botPlayerId];
    if (!bot || (!bot.isBot && bot.isConnected)) return;

    const activePlayerId = room.machine.getActivePlayerId();
    if (activePlayerId !== botPlayerId) return;

    const gameType = getRoomGameType(room);
    const usesDice = DICE_GAME_TYPES.has(gameType);

    // 1. Bot Thinking & Announcement — أسرع في الألعاب التي لا نرد فيها.
    handleBroadcast(room, "BOT_THINKING", {
      playerId: bot.id,
      botName: bot.name,
      messageAr: `${bot.name} يفكر في خطوته القادمة... 🤔`
    });
    await sleep(usesDice ? 1100 : 650);

    // Validate turn & phase hasn't changed during sleep
    if (!room.machine.state || room.machine.state.phase !== "TURN_START") return;
    if (room.machine.getActivePlayerId() !== botPlayerId) return;

    // 2. 3D Dice Roll Start — للألعاب التي تعتمد النرد فقط.
    if (usesDice) {
      handleBroadcast(room, "DICE_ROLL_START", {
        playerId: bot.id,
        botName: bot.name,
        messageAr: `النرد يتدحرج الآن... 🎲`
      });
      await sleep(1200);

      if (!room.machine.state || room.machine.state.phase !== "TURN_START") return;
      if (room.machine.getActivePlayerId() !== botPlayerId) return;
    }

    // 3. Execute the bot move in the dedicated engine
    room.machine.executeBotTurn(bot.id);

    if (usesDice) {
      // 4. Pawn travel & hop animation delay
      const lastRoll = room.machine.state.lastDiceRoll?.sum || 4;
      const pawnHopMs = Math.min(lastRoll * 220 + 700, 2600);
      await sleep(pawnHopMs);

      // 5. Post-move resolution reading delay
      await sleep(1300);
    } else {
      // حركة فورية/سريعة: مهلة بسيطة لالتقاط أنيميشن القرص أو القطعة.
      await sleep(700);
    }

  } catch (err) {
    console.warn("[executeBotTurnStaged Error]:", err);
  } finally {
    room.isBotTurnInProgress = false;
    scheduleBotTurnIfNeeded(room);
  }
}

function scheduleBotTurnIfNeeded(room: RoomInstance) {
  if (room.isBotTurnInProgress) return;

  if (room.botTimer) {
    clearTimeout(room.botTimer);
    room.botTimer = undefined;
  }

  const state = room.machine.state;
  if (!state || state.phase === "GAME_OVER" || state.phase === "LOBBY") return;

  // 1. Voting phase bot auto-votes
  if (state.phase === "VOTING" && state.pendingVote?.isActive) {
    const unvotedBots = Object.values(state.players).filter(
      p => p.isBot && !state.pendingVote?.votes[p.id]
    );

    if (unvotedBots.length > 0) {
      room.botTimer = setTimeout(() => {
        const candidateIds = Object.keys(state.players);
        for (const bot of unvotedBots) {
          const targets = candidateIds.filter(id => id !== bot.id);
          const targetId = targets[Math.floor(Math.random() * targets.length)];
          if (targetId) {
            try {
              room.machine.submitPlayerVote(bot.id, targetId);
            } catch {}
          }
        }
      }, 1500);
      return;
    }
  }

  // 2. Turn phase bot auto-play & disconnected player fallback
  if (state.phase === "TURN_START") {
    const activePlayerId = state.turnOrder[state.currentTurnIndex];
    const activePlayer = state.players[activePlayerId];

    if (activePlayer && (activePlayer.isBot || !activePlayer.isConnected)) {
      const initialDelay = activePlayer.isBot ? 800 : 3000;
      room.botTimer = setTimeout(() => {
        executeBotTurnStaged(room, activePlayer.id).catch((err) => {
          console.warn("[executeBotTurnStaged Error]:", err);
        });
      }, initialDelay);
    }
  }
}

function getOrCreateRoom(roomId: string, initialHostToken?: string): RoomInstance {
  let room = rooms.get(roomId);
  if (!room) {
    const newRoom: RoomInstance = {
      id: roomId,
      connections: new Map(),
      playerPrompts: {},
      machine: null as any,
      lastActivityAt: Date.now(),
      hostToken: initialHostToken || `ht_${Math.random().toString(36).slice(2, 12)}`,
      graceTimers: new Map()
    };

    newRoom.machine = new BoardGameRoomMachine(roomId, (eventType, payload) => {
      handleBroadcast(newRoom, eventType, payload);
    });

    rooms.set(roomId, newRoom);
    room = newRoom;
  }
  return room;
}

function handleBroadcast(room: RoomInstance, eventType: string, payload: Record<string, unknown>) {
  if (eventType === "STATE_UPDATED") {
    broadcastSanitizedState(room);
    scheduleBotTurnIfNeeded(room);
    return;
  }

  const message = JSON.stringify({
    type: eventType,
    ...payload
  });

  for (const client of room.connections.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }

  scheduleBotTurnIfNeeded(room);
}

function broadcastSanitizedState(room: RoomInstance) {
  for (const client of room.connections.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      sendSanitizedState(room, client);
    }
  }
}

function sendSanitizedState(room: RoomInstance, client: ClientConnection) {
  const rawState: FullRoomState = room.machine.state;
  const viewerId = client.role === "HOST" || client.role === "SPECTATOR" ? "HOST" : client.playerId;
  const visibility = rawState.rulesConfig?.cardVisibility || "SECRET_PHONE_ONLY";

  const sanitizedPlayers = Object.fromEntries(
    Object.entries(rawState.players).map(([id, player]) => {
      let visibleHand: GameCard[] = [];
      if (visibility === "OPEN_PUBLIC_CARDS") {
        visibleHand = player.secretHand;
      } else if (visibility === "NO_HAND_CARDS") {
        visibleHand = [];
      } else {
        // SECRET_PHONE_ONLY: only owner sees their cards
        const isOwner = id === viewerId;
        visibleHand = isOwner ? player.secretHand : [];
      }

      return [
        id,
        {
          ...player,
          secretHandCount: player.secretHand.length,
          secretHand: visibleHand
        }
      ];
    })
  );

  const sanitizedUnoState = rawState.unoState
    ? sanitizeUnoStateForViewer(rawState.unoState, viewerId)
    : undefined;

  // المافيا: كل لاعب يرى دوره فقط، والأدوار تُكشف عند نهاية اللعبة.
  const rawMafia = rawState.mafiaState;
  const sanitizedMafiaState = rawMafia
    ? {
        ...rawMafia,
        roles: rawState.phase === "GAME_OVER" ? rawMafia.roles : undefined,
        myRole: rawMafia.roles?.[viewerId],
        myMafiaAllies:
          rawMafia.roles?.[viewerId] === "MAFIA"
            ? Object.entries(rawMafia.roles)
                .filter(([id, role]) => role === "MAFIA" && id !== viewerId)
                .map(([id]) => id)
            : undefined,
        votes: undefined,
        votesCount: Object.keys(rawMafia.votes || {}).length,
        votedBy: Object.keys(rawMafia.votes || {}),
        nightVictimId: rawState.phase === "GAME_OVER" ? rawMafia.nightVictimId : undefined,
        detectiveResult:
          rawMafia.detectiveResult?.detectiveId === viewerId ? rawMafia.detectiveResult : undefined
      }
    : undefined;

  client.ws.send(
    JSON.stringify({
      type: "STATE_SYNC",
      state: {
        ...rawState,
        deck: undefined,
        players: sanitizedPlayers,
        unoState: sanitizedUnoState,
        mafiaState: sanitizedMafiaState
      }
    })
  );
}

const server = http.createServer((req, res) => {
  // Add CORS headers for health check
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", activeRooms: rooms.size }));
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  try {
    const parsedUrl = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
    // Path format: /party/:roomId
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    const roomId = pathParts[1] || pathParts[0] || "DEFAULT";

    const incomingRole = (parsedUrl.searchParams.get("role") || "PLAYER") as "HOST" | "PLAYER";
    const hostToken = parsedUrl.searchParams.get("hostToken") || "";
    const isFirstConnection = !rooms.has(roomId);
    const room = getOrCreateRoom(roomId, incomingRole === "HOST" ? hostToken : undefined);

    let role: "HOST" | "PLAYER" | "SPECTATOR" = incomingRole;
    let isAuthorizedHost = true;

    if (incomingRole === "HOST") {
      if (room.hostToken && hostToken && room.hostToken !== hostToken) {
        isAuthorizedHost = false;
        role = "SPECTATOR";
      } else if (room.hostToken && !hostToken && !isFirstConnection) {
        if (roomId === "BOTS" || roomId.startsWith("DEMO_")) {
          isAuthorizedHost = true;
          role = "HOST";
        } else {
          isAuthorizedHost = false;
          role = "SPECTATOR";
        }
      }
    }

    const playerId = parsedUrl.searchParams.get("playerId") || (role === "HOST" ? "HOST" : `p_${Math.random().toString(36).slice(2, 9)}`);
    const connId = `conn_${Math.random().toString(36).slice(2, 11)}`;

    const client: ClientConnection = { id: connId, ws, role, playerId, roomId, isAuthorizedHost };
    room.connections.set(connId, client);

    console.log(`[WS] Client connected: ${role} (${playerId}) to room [${roomId}]. Total clients: ${room.connections.size}`);

    // Session Rehydration: Reconnect within grace period or back online
    if (role === "PLAYER") {
      const graceTimer = room.graceTimers.get(playerId);
      if (graceTimer) {
        clearTimeout(graceTimer);
        room.graceTimers.delete(playerId);
        console.log(`[WS] Player ${playerId} rehydrated session within grace period!`);
      }
      if (room.machine.state.players[playerId]) {
        room.machine.state.players[playerId].isConnected = true;
        broadcastSanitizedState(room);
      } else {
        sendSanitizedState(room, client);
      }
    } else {
      sendSanitizedState(room, client);
    }

    ws.on("message", async (data) => {
      try {
        room.lastActivityAt = Date.now();
        const msg = JSON.parse(data.toString());

        switch (msg.type) {
          case "JOIN_ROOM": {
            if (role === "HOST" || role === "SPECTATOR") return;
            const effectiveUserId = (msg as any).userId || parsedUrl.searchParams.get("userId") || undefined;
            room.machine.joinPlayer(playerId, msg.name, msg.color, effectiveUserId);
            if (msg.promptIdea) {
              room.playerPrompts[msg.name] = msg.promptIdea;
            }
            break;
          }

          case "UPDATE_SETTINGS": {
            if (client.role !== "HOST" || !client.isAuthorizedHost) {
              ws.send(
                JSON.stringify({
                  type: "ACTION_REJECTED",
                  messageAr: "لا تملك صلاحية تعديل إعدادات اللعبة."
                })
              );
              return;
            }
            room.machine.updateSettings(msg.settings || {});
            break;
          }

          case "START_AI_GAME": {
            if (client.role === "SPECTATOR" || !client.isAuthorizedHost) {
              ws.send(
                JSON.stringify({
                  type: "ACTION_REJECTED",
                  messageAr: "رمز المضيف غير مصرح به! لا تملك صلاحية بدء اللعبة."
                })
              );
              return;
            }
            const announceMsg = JSON.stringify({
              type: "AI_GENERATING",
              messageAr: "الذكاء الاصطناعي يصمم لوحة السهرة والبطاقات الآن..."
            });
            for (const c of room.connections.values()) {
              if (c.ws.readyState === WebSocket.OPEN) c.ws.send(announceMsg);
            }

            const playerNames = Object.values(room.machine.state.players).map(p => p.name);
            let sessionPack: GeneratedSessionPack;

            if (msg.useDefaultPack || !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
              sessionPack = getDefaultSessionPack(playerNames);
            } else {
              const players = Object.values(room.machine.state.players).map(p => ({
                name: p.name,
                promptIdea: room.playerPrompts[p.name]
              }));

              let timeoutId: ReturnType<typeof setTimeout> | undefined;
              try {
                const timeoutPromise = new Promise<never>((_, reject) => {
                  timeoutId = setTimeout(() => reject(new Error("AI_TIMEOUT")), 8000);
                });
                const aiPromise = generateAISessionPack({ players });
                aiPromise.catch(() => {});

                sessionPack = await Promise.race([
                  aiPromise,
                  timeoutPromise
                ]);
              } catch (error) {
                console.warn("[AI] AI generation failed or timed out after 8s, falling back to default pack:", error);
                sessionPack = getDefaultSessionPack(playerNames);
              } finally {
                if (timeoutId) clearTimeout(timeoutId);
              }
            }

            const activeThemeId = room.machine.state.themeId || room.machine.state.settings?.themeId;
            if (activeThemeId) {
              sessionPack = applyThemeToGamePack(sessionPack, activeThemeId);
            }
            fillBotsToMinimum(room, resolveGameProfile(undefined, sessionPack));
            room.machine.startGameWithAIPack(sessionPack);
            break;
          }

          case "START_CUSTOM_GAME": {
            if (client.role === "SPECTATOR" || !client.isAuthorizedHost) {
              ws.send(
                JSON.stringify({
                  type: "ACTION_REJECTED",
                  messageAr: "رمز المضيف غير مصرح به! لا تملك صلاحية بدء اللعبة."
                })
              );
              return;
            }

            let sessionPack: GeneratedSessionPack;
            const communityMap = typeof msg.presetKey === "string" ? getCommunityMapByKey(msg.presetKey) : undefined;
            if (communityMap) {
              sessionPack = communityMap.pack;
              // لا نسحق اختيار المضيف لثيم عالمي آخر؛ نطبّق ثيم الخريطة
              // الافتراضي فقط عندما تكون الغرفة على الثيم الافتراضي.
              const chosenTheme =
                room.machine.state.themeId || room.machine.state.settings?.themeId;
              if (!chosenTheme || chosenTheme === "ARABIAN_MAJLIS") {
                room.machine.state.themeId = communityMap.themeId;
                if (room.machine.state.settings) {
                  room.machine.state.settings.themeId = communityMap.themeId;
                }
              }
            } else if (typeof msg.presetKey === "string" && PRESET_PACKS[msg.presetKey]) {
              sessionPack = PRESET_PACKS[msg.presetKey];
              if (msg.presetKey === "MONOPOLY_CLASSIC") {
                room.machine.state.themeId = "MONOPOLY_CLASSIC";
                if (room.machine.state.settings) {
                  room.machine.state.settings.themeId = "MONOPOLY_CLASSIC";
                }
              }
            } else if (msg.pack) {
              const validation = GeneratedSessionPackSchema.safeParse(msg.pack);
              if (!validation.success) {
                ws.send(
                  JSON.stringify({
                    type: "ACTION_REJECTED",
                    messageAr: "حزمة اللعبة المخصصة غير صالحة ولا تطابق معايير اللوحة والبطاقات!"
                  })
                );
                return;
              }
              sessionPack = validation.data;
            } else {
              ws.send(
                JSON.stringify({
                  type: "ACTION_REJECTED",
                  messageAr: "لم يتم تمرير حزمة لعب أو قالب صالح!"
                })
              );
              return;
            }

            if (!communityMap && msg.presetKey !== "MONOPOLY_CLASSIC") {
              const activeThemeId = room.machine.state.themeId || room.machine.state.settings?.themeId;
              if (activeThemeId && activeThemeId !== "ARABIAN_MAJLIS") {
                sessionPack = applyThemeToGamePack(sessionPack, activeThemeId);
              }
            }
            // خرائط المجتمع تحترم الثيم العالمي الذي اختاره المضيف أيضاً.
            if (communityMap) {
              const activeThemeId = room.machine.state.themeId || room.machine.state.settings?.themeId;
              if (activeThemeId && activeThemeId !== "ARABIAN_MAJLIS" && activeThemeId !== sessionPack.themeId) {
                sessionPack = applyThemeToGamePack(sessionPack, activeThemeId);
              }
            }
            fillBotsToMinimum(
              room,
              resolveGameProfile(
                typeof msg.presetKey === "string" ? msg.presetKey : undefined,
                sessionPack
              )
            );
            room.machine.startGameWithAIPack(sessionPack);
            break;
          }

          case "ADD_BOT": {
            if (client.role === "SPECTATOR" || !client.isAuthorizedHost) {
              ws.send(
                JSON.stringify({
                  type: "ACTION_REJECTED",
                  messageAr: "رمز المضيف غير مصرح به! لا تملك صلاحية إضافة بوت."
                })
              );
              return;
            }
            const currentCount = playerCount(room);
            if (currentCount >= MAX_PLAYERS_GLOBAL) {
              throw new Error(
                `الغرفة ممتلئة بالكامل (${MAX_PLAYERS_GLOBAL} لاعبين). لا يمكن إضافة المزيد من البوتات.`
              );
            }
            const botName =
              typeof msg.name === "string" ? msg.name : getBotName(currentCount);
            const botColor =
              typeof msg.color === "string" ? msg.color : getPlayerColor(currentCount);
            const botId = `bot_${Date.now().toString().slice(-4)}_${Math.random()
              .toString(36)
              .slice(2, 6)}`;

            room.machine.joinPlayer(botId, botName, botColor, undefined, true);
            break;
          }

          case "START_DEFAULT_WITH_BOTS": {
            if (client.role === "SPECTATOR" || !client.isAuthorizedHost) {
              ws.send(
                JSON.stringify({
                  type: "ACTION_REJECTED",
                  messageAr: "رمز المضيف غير مصرح به! لا تملك صلاحية بدء اللعبة."
                })
              );
              return;
            }

            let sessionPack: GeneratedSessionPack;
            const communityMap = typeof msg.presetKey === "string" ? getCommunityMapByKey(msg.presetKey) : undefined;
            if (communityMap) {
              sessionPack = communityMap.pack;
              // لا نسحق اختيار المضيف لثيم عالمي آخر؛ نطبّق ثيم الخريطة
              // الافتراضي فقط عندما تكون الغرفة على الثيم الافتراضي.
              const chosenTheme =
                room.machine.state.themeId || room.machine.state.settings?.themeId;
              if (!chosenTheme || chosenTheme === "ARABIAN_MAJLIS") {
                room.machine.state.themeId = communityMap.themeId;
                if (room.machine.state.settings) {
                  room.machine.state.settings.themeId = communityMap.themeId;
                }
              }
            } else if (typeof msg.presetKey === "string" && PRESET_PACKS[msg.presetKey]) {
              sessionPack = PRESET_PACKS[msg.presetKey];
              if (msg.presetKey === "MONOPOLY_CLASSIC") {
                room.machine.state.themeId = "MONOPOLY_CLASSIC";
                if (room.machine.state.settings) {
                  room.machine.state.settings.themeId = "MONOPOLY_CLASSIC";
                }
              }
            } else {
              const playerNames = Object.values(room.machine.state.players).map(p => p.name);
              sessionPack = getDefaultSessionPack(playerNames);
            }

            if (!communityMap && msg.presetKey !== "MONOPOLY_CLASSIC") {
              const activeThemeId = room.machine.state.themeId || room.machine.state.settings?.themeId;
              if (activeThemeId && activeThemeId !== "ARABIAN_MAJLIS") {
                sessionPack = applyThemeToGamePack(sessionPack, activeThemeId);
              }
            }
            // خرائط المجتمع تحترم الثيم العالمي الذي اختاره المضيف أيضاً.
            if (communityMap) {
              const activeThemeId = room.machine.state.themeId || room.machine.state.settings?.themeId;
              if (activeThemeId && activeThemeId !== "ARABIAN_MAJLIS" && activeThemeId !== sessionPack.themeId) {
                sessionPack = applyThemeToGamePack(sessionPack, activeThemeId);
              }
            }
            fillDemoBots(
              room,
              resolveGameProfile(
                typeof msg.presetKey === "string" ? msg.presetKey : undefined,
                sessionPack
              )
            );
            room.machine.startGameWithAIPack(sessionPack);
            scheduleBotTurnIfNeeded(room);
            break;
          }

          case "RESET_TO_LOBBY": {
            if (client.role === "SPECTATOR" || !client.isAuthorizedHost) {
              ws.send(
                JSON.stringify({
                  type: "ACTION_REJECTED",
                  messageAr: "رمز المضيف غير مصرح به!"
                })
              );
              return;
            }
            if (room.botTimer) {
              clearTimeout(room.botTimer);
              room.botTimer = undefined;
            }
            room.isBotTurnInProgress = false;
            room.machine.resetToLobby();
            break;
          }

          case "ROLL_DICE": {
            room.machine.rollDiceAndMove(playerId);
            break;
          }

          case "MOVE_LUDO_TOKEN": {
            room.machine.moveLudoToken(playerId, msg.tokenId);
            break;
          }

          case "DROP_CONNECT_FOUR_PIECE": {
            room.machine.dropConnectFourPiece(playerId, Number(msg.column));
            break;
          }

          case "MOVE_CHECKERS_PIECE": {
            room.machine.moveCheckersPiece(
              playerId,
              Number(msg.fromRow),
              Number(msg.fromCol),
              Number(msg.toRow),
              Number(msg.toCol)
            );
            break;
          }

          case "CALL_BINGO_NUMBER": {
            room.machine.callBingoNumber(playerId);
            break;
          }

          case "BUY_PROPERTY": {
            room.machine.buyProperty(playerId, msg.tileIndex);
            break;
          }

          case "DECLINE_PURCHASE": {
            room.machine.declinePurchase(playerId);
            break;
          }

          case "BUILD_HOUSE": {
            room.machine.buildHouse(playerId, msg.tileIndex);
            break;
          }

          case "PAY_JAIL_FINE": {
            room.machine.payJailFine(playerId);
            break;
          }

          case "CLAIM_OR_ATTACK_TILE": {
            room.machine.claimOrAttackTile(playerId, msg.targetTileIndex);
            break;
          }

          case "REINFORCE_TILE": {
            room.machine.reinforceTile(playerId, msg.tileIndex, msg.count ?? 1);
            break;
          }

          case "END_TURN": {
            room.machine.endTurn(playerId);
            break;
          }

          case "MAFIA_NIGHT_ACTION": {
            room.machine.mafiaNightAction(playerId, msg.targetId);
            break;
          }

          case "MAFIA_VOTE": {
            room.machine.submitMafiaVote(playerId, msg.targetPlayerId);
            break;
          }

          case "ADVANCE_MAFIA_PHASE": {
            if (client.role === "SPECTATOR" || !client.isAuthorizedHost) {
              ws.send(
                JSON.stringify({
                  type: "ACTION_REJECTED",
                  messageAr: "رمز المضيف غير مصرح به!"
                })
              );
              return;
            }
            room.machine.advanceMafiaPhase();
            break;
          }

          case "PLAY_SECRET_CARD": {
            room.machine.playSecretCard(playerId, msg.cardId, msg.chosenTargetId);
            break;
          }

          case "PLAY_UNO_CARD": {
            room.machine.playUnoCard(playerId, msg.cardId, msg.chosenColor);
            break;
          }

          case "DRAW_UNO_CARD": {
            room.machine.drawUnoCard(playerId);
            break;
          }

          case "PASS_UNO_AFTER_DRAW": {
            room.machine.passUnoAfterDraw(playerId);
            break;
          }

          case "SHOUT_UNO": {
            room.machine.shoutUno(playerId);
            break;
          }

          case "DRAW_CARD": {
            room.machine.drawCardFromDeck(playerId);
            break;
          }

          case "PASS_TURN": {
            room.machine.passTurn(playerId);
            break;
          }

          case "SUBMIT_VOTE": {
            room.machine.submitPlayerVote(playerId, msg.targetPlayerId);
            break;
          }

          case "SEND_REACTION": {
            const reactionMsg = JSON.stringify({
              type: "LIVE_REACTION",
              playerId,
              emoji: msg.emoji,
              text: (msg as any).text,
              voiceId: (msg as any).voiceId
            });
            for (const c of room.connections.values()) {
              if (c.ws.readyState === WebSocket.OPEN) c.ws.send(reactionMsg);
            }
            break;
          }
        }
      } catch (err: unknown) {
        const messageAr = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ACTION_REJECTED", messageAr }));
        }
      }
    });

    ws.on("close", () => {
      room.connections.delete(connId);
      room.lastActivityAt = Date.now();
      console.log(`[WS] Client disconnected: ${role} (${playerId}) from [${roomId}]`);
      // A player may briefly hold two sockets during React Strict Mode mounts,
      // a mobile wake-up, or a reconnect overlap. Only mark them offline when
      // no other live socket for the same player remains.
      const hasOtherPlayerSocket = Array.from(room.connections.values()).some(
        (c) => c.role === "PLAYER" && c.playerId === playerId && c.ws.readyState === WebSocket.OPEN
      );
      if (role === "PLAYER" && !hasOtherPlayerSocket && room.machine.state.players[playerId]) {
        // Mark disconnected immediately so UI updates status badge
        room.machine.state.players[playerId].isConnected = false;
        broadcastSanitizedState(room);

        // Mobile Disconnect Resilience: 60-second grace period before bot auto-play takeover
        const existingTimer = room.graceTimers.get(playerId);
        if (existingTimer) clearTimeout(existingTimer);

        const graceTimer = setTimeout(() => {
          if (room.machine.state.players[playerId] && !room.machine.state.players[playerId].isConnected) {
            console.log(`[WS] Player ${playerId} grace period expired.`);
            // Auto-play via bot heuristics if current turn is stalled
            const activePid = room.machine.getActivePlayerId();
            if (activePid === playerId && room.machine.state.phase === "TURN_START") {
              try {
                executeBotTurnStaged(room, playerId).catch(() => {});
              } catch {}
            }
          }
          room.graceTimers.delete(playerId);
        }, 60000);

        room.graceTimers.set(playerId, graceTimer);
      }
    });

    ws.on("error", (err) => {
      console.error(`[WS] Connection error for ${playerId}:`, err);
    });
  } catch (err) {
    console.error("[WS] Error in connection handler:", err);
  }
});

// Periodic Garbage Collector: Cleans up rooms inactive for > 2 hours with 0 connections
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const GC_INTERVAL_MS = 30 * 60 * 1000; // Run every 30 minutes

setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    const isInactive = now - room.lastActivityAt > TWO_HOURS_MS;
    if (isInactive && room.connections.size === 0) {
      rooms.delete(roomId);
      console.log(`[GC] Cleaned up inactive room: ${roomId}`);
    }
  }
}, GC_INTERVAL_MS);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🎲 BoardGame WebSocket Server is running on ws://0.0.0.0:${PORT}`);
});
