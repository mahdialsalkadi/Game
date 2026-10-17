import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { BoardGameRoomMachine, FullRoomState } from "../game/gameRoom";
import { generateAISessionPack, getDefaultSessionPack, PRESET_PACKS } from "../game/aiPackGenerator";
import { GeneratedSessionPackSchema, type GeneratedSessionPack, type GameCard } from "../game/schema";

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
}

const rooms = new Map<string, RoomInstance>();

function getOrCreateRoom(roomId: string, initialHostToken?: string): RoomInstance {
  let room = rooms.get(roomId);
  if (!room) {
    const newRoom: RoomInstance = {
      id: roomId,
      connections: new Map(),
      playerPrompts: {},
      machine: null as any,
      lastActivityAt: Date.now(),
      hostToken: initialHostToken || `ht_${Math.random().toString(36).slice(2, 12)}`
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

  client.ws.send(
    JSON.stringify({
      type: "STATE_SYNC",
      state: {
        ...rawState,
        deck: undefined,
        players: sanitizedPlayers
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
        isAuthorizedHost = false;
        role = "SPECTATOR";
      }
    }

    const playerId = parsedUrl.searchParams.get("playerId") || (role === "HOST" ? "HOST" : `p_${Math.random().toString(36).slice(2, 9)}`);
    const connId = `conn_${Math.random().toString(36).slice(2, 11)}`;

    const client: ClientConnection = { id: connId, ws, role, playerId, roomId, isAuthorizedHost };
    room.connections.set(connId, client);

    console.log(`[WS] Client connected: ${role} (${playerId}) to room [${roomId}]. Total clients: ${room.connections.size}`);

    // If reconnecting player
    if (role === "PLAYER" && room.machine.state.players[playerId]) {
      room.machine.state.players[playerId].isConnected = true;
      broadcastSanitizedState(room);
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
            if (typeof msg.presetKey === "string" && PRESET_PACKS[msg.presetKey]) {
              sessionPack = PRESET_PACKS[msg.presetKey];
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

            room.machine.startGameWithAIPack(sessionPack);
            break;
          }

          case "ROLL_DICE": {
            room.machine.rollDiceAndMove(playerId);
            break;
          }

          case "BUY_PROPERTY": {
            room.machine.buyProperty(playerId, msg.tileIndex);
            break;
          }

          case "CLAIM_OR_ATTACK_TILE": {
            room.machine.claimOrAttackTile(playerId, msg.targetTileIndex);
            break;
          }

          case "PLAY_SECRET_CARD": {
            room.machine.playSecretCard(playerId, msg.cardId, msg.chosenTargetId);
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
              emoji: msg.emoji
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
      if (role === "PLAYER" && room.machine.state.players[playerId]) {
        room.machine.state.players[playerId].isConnected = false;
        broadcastSanitizedState(room);
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
