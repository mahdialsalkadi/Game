import type * as Party from "partykit/server";
import { BoardGameRoomMachine } from "../game/gameRoom";
import type { FullRoomState } from "../game/gameRoom";
import { generateAISessionPack, getDefaultSessionPack } from "../game/aiPackGenerator";
import type { GeneratedSessionPack } from "../game/schema";

// تعريف شكل الرسائل القادمة من الجوال أو الشاشة الرئيسية
type ClientMessage =
  | { type: "JOIN_ROOM"; name: string; color: string; promptIdea?: string }
  | { type: "UPDATE_SETTINGS"; settings: Record<string, unknown> }
  | { type: "START_AI_GAME"; useDefaultPack?: boolean }
  | { type: "ROLL_DICE" }
  | { type: "PLAY_SECRET_CARD"; cardId: string; chosenTargetId?: string }
  | { type: "DRAW_CARD" }
  | { type: "PASS_TURN" }
  | { type: "SUBMIT_VOTE"; targetPlayerId: string }
  | { type: "SEND_REACTION"; emoji: string };

export default class GameRoomServer implements Party.Server {
  private machine: BoardGameRoomMachine;
  private connectionToPlayerId = new Map<string, string>();
  private playerPrompts: Record<string, string> = {};

  constructor(readonly room: Party.Room) {
    this.machine = new BoardGameRoomMachine(
      room.id,
      (eventType, payload) => this.handleEngineBroadcast(eventType, payload)
    );
  }

  // =========================================================
  // 1. إدارة الاتصال وإعادة الاتصال
  // =========================================================

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const url = new URL(ctx.request.url);
    const role = url.searchParams.get("role");
    const playerId = url.searchParams.get("playerId");

    if (role === "HOST") {
      this.connectionToPlayerId.set(conn.id, "HOST");
      this.sendSanitizedStateToConnection(conn, "HOST");
      return;
    }

    if (playerId) {
      this.connectionToPlayerId.set(conn.id, playerId);

      if (this.machine.state.players[playerId]) {
        this.machine.state.players[playerId].isConnected = true;
        this.broadcastSanitizedStateToAll();
      } else {
        this.sendSanitizedStateToConnection(conn, playerId);
      }
    }
  }

  onClose(conn: Party.Connection) {
    const playerId = this.connectionToPlayerId.get(conn.id);
    this.connectionToPlayerId.delete(conn.id);

    if (playerId && playerId !== "HOST" && this.machine.state.players[playerId]) {
      this.machine.state.players[playerId].isConnected = false;
      this.broadcastSanitizedStateToAll();
    }
  }

  // =========================================================
  // 2. استقبال أوامر الجوال وتمريرها لآلة الحالة
  // =========================================================

  async onMessage(rawMessage: string, sender: Party.Connection) {
    const playerId = this.connectionToPlayerId.get(sender.id);
    if (!playerId) return;

    try {
      const msg = JSON.parse(rawMessage) as ClientMessage;

      switch (msg.type) {
        case "JOIN_ROOM": {
          if (playerId === "HOST") return;
          this.machine.joinPlayer(playerId, msg.name, msg.color);
          if (msg.promptIdea) {
            this.playerPrompts[msg.name] = msg.promptIdea;
          }
          break;
        }

        case "UPDATE_SETTINGS": {
          this.machine.updateSettings(msg.settings || {});
          break;
        }

        case "START_AI_GAME": {
          this.room.broadcast(
            JSON.stringify({
              type: "AI_GENERATING",
              messageAr: "الذكاء الاصطناعي يصمم لوحة السهرة والبطاقات الآن..."
            })
          );

          const playerNames = Object.values(this.machine.state.players).map(p => p.name);
          let sessionPack: GeneratedSessionPack;

          if (msg.useDefaultPack || !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            // Use default pack for development/testing
            sessionPack = getDefaultSessionPack(playerNames);
          } else {
            // Generate via AI
            const players = Object.values(this.machine.state.players).map(p => ({
              name: p.name,
              promptIdea: this.playerPrompts[p.name]
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

          this.machine.startGameWithAIPack(sessionPack);
          break;
        }

        case "ROLL_DICE": {
          this.machine.rollDiceAndMove(playerId);
          break;
        }

        case "PLAY_SECRET_CARD": {
          this.machine.playSecretCard(
            playerId,
            msg.cardId,
            msg.chosenTargetId
          );
          break;
        }

        case "DRAW_CARD": {
          this.machine.drawCardFromDeck(playerId);
          break;
        }

        case "PASS_TURN": {
          this.machine.passTurn(playerId);
          break;
        }

        case "SUBMIT_VOTE": {
          this.machine.submitPlayerVote(playerId, msg.targetPlayerId);
          break;
        }

        case "SEND_REACTION": {
          this.room.broadcast(
            JSON.stringify({
              type: "LIVE_REACTION",
              playerId,
              emoji: msg.emoji
            })
          );
          break;
        }
      }
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "حدث خطأ غير متوقع";
      sender.send(
        JSON.stringify({
          type: "ACTION_REJECTED",
          messageAr: errorMsg
        })
      );
    }
  }

  // =========================================================
  // 3. فلتر الخصوصية
  // =========================================================

  private handleEngineBroadcast(
    eventType: string,
    payload: Record<string, unknown>
  ) {
    if (eventType === "STATE_UPDATED") {
      this.broadcastSanitizedStateToAll();
      return;
    }

    this.room.broadcast(
      JSON.stringify({
        type: eventType,
        ...payload
      })
    );
  }

  private broadcastSanitizedStateToAll() {
    for (const conn of this.room.getConnections()) {
      const viewerId = this.connectionToPlayerId.get(conn.id) || "SPECTATOR";
      this.sendSanitizedStateToConnection(conn, viewerId);
    }
  }

  private sendSanitizedStateToConnection(
    conn: Party.Connection,
    viewerId: string
  ) {
    const rawState: FullRoomState = this.machine.state;

    const sanitizedPlayers = Object.fromEntries(
      Object.entries(rawState.players).map(([id, player]) => {
        const isOwner = id === viewerId;
        return [
          id,
          {
            ...player,
            secretHandCount: player.secretHand.length,
            secretHand: isOwner ? player.secretHand : []
          }
        ];
      })
    );

    conn.send(
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
}
