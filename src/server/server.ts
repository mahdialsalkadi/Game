import type * as Party from "partykit/server";
import { BoardGameRoomMachine } from "../game/gameRoom";
import type { FullRoomState } from "../game/gameRoom";
import { generateAISessionPack, getDefaultSessionPack, PRESET_PACKS } from "../game/aiPackGenerator";
import { GeneratedSessionPackSchema, type GeneratedSessionPack, type GameCard } from "../game/schema";
import { applyThemeToGamePack } from "../game/themeRegistry";
import { COMMUNITY_MAPS, getCommunityMapByKey } from "../game/communityMaps";
import { sanitizeUnoStateForViewer, type UnoActiveColor } from "../game/unoEngine";

// تعريف شكل الرسائل القادمة من الجوال أو الشاشة الرئيسية
type ClientMessage =
  | { type: "JOIN_ROOM"; name: string; color: string; promptIdea?: string; userId?: string }
  | { type: "ADD_BOT"; name?: string; color?: string }
  | { type: "START_DEFAULT_WITH_BOTS"; presetKey?: string }
  | { type: "RESET_TO_LOBBY" }
  | { type: "UPDATE_SETTINGS"; settings: Record<string, unknown> }
  | { type: "START_AI_GAME"; useDefaultPack?: boolean }
  | { type: "START_CUSTOM_GAME"; presetKey?: string; pack?: unknown }
  | { type: "ROLL_DICE" }
  | { type: "MOVE_LUDO_TOKEN"; tokenId: number }
  | { type: "DROP_CONNECT_FOUR_PIECE"; column: number }
  | { type: "MOVE_CHECKERS_PIECE"; fromRow: number; fromCol: number; toRow: number; toCol: number }
  | { type: "CALL_BINGO_NUMBER" }
  | { type: "BUY_PROPERTY"; tileIndex?: number }
  | { type: "BUILD_HOUSE"; tileIndex: number }
  | { type: "PAY_JAIL_FINE" }
  | { type: "CLAIM_OR_ATTACK_TILE"; targetTileIndex: number }
  | { type: "PLAY_SECRET_CARD"; cardId: string; chosenTargetId?: string }
  | { type: "PLAY_UNO_CARD"; cardId: string; chosenColor?: UnoActiveColor }
  | { type: "DRAW_UNO_CARD" }
  | { type: "PASS_UNO_AFTER_DRAW" }
  | { type: "SHOUT_UNO" }
  | { type: "DRAW_CARD" }
  | { type: "PASS_TURN" }
  | { type: "SUBMIT_VOTE"; targetPlayerId: string }
  | { type: "SEND_REACTION"; emoji: string; text?: string; voiceId?: string };

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

          const activeThemeId = this.machine.state.themeId || this.machine.state.settings?.themeId;
          if (activeThemeId) {
            sessionPack = applyThemeToGamePack(sessionPack, activeThemeId);
          }
          this.machine.startGameWithAIPack(sessionPack);
          break;
        }

        case "START_CUSTOM_GAME": {
          let sessionPack: GeneratedSessionPack;
          const communityMap = typeof msg.presetKey === "string" ? getCommunityMapByKey(msg.presetKey) : undefined;
          if (communityMap) {
            sessionPack = communityMap.pack;
            const chosenTheme =
              this.machine.state.themeId || this.machine.state.settings?.themeId;
            if (!chosenTheme || chosenTheme === "ARABIAN_MAJLIS") {
              this.machine.state.themeId = communityMap.themeId;
              if (this.machine.state.settings) {
                this.machine.state.settings.themeId = communityMap.themeId;
              }
            }
          } else if (typeof msg.presetKey === "string" && PRESET_PACKS[msg.presetKey]) {
            sessionPack = PRESET_PACKS[msg.presetKey];
            if (msg.presetKey === "MONOPOLY_CLASSIC") {
              this.machine.state.themeId = "MONOPOLY_CLASSIC";
              if (this.machine.state.settings) {
                this.machine.state.settings.themeId = "MONOPOLY_CLASSIC";
              }
            }
          } else if (msg.pack) {
            const validation = GeneratedSessionPackSchema.safeParse(msg.pack);
            if (!validation.success) {
              sender.send(
                JSON.stringify({
                  type: "ACTION_REJECTED",
                  messageAr: "حزمة اللعبة المخصصة غير صالحة ولا تطابق معايير اللوحة والبطاقات!"
                })
              );
              return;
            }
            sessionPack = validation.data;
          } else {
            sender.send(
              JSON.stringify({
                type: "ACTION_REJECTED",
                messageAr: "لم يتم تمرير حزمة لعب أو قالب صالح!"
              })
            );
            return;
          }

          if (!communityMap && msg.presetKey !== "MONOPOLY_CLASSIC") {
            const activeThemeId = this.machine.state.themeId || this.machine.state.settings?.themeId;
            if (activeThemeId && activeThemeId !== "ARABIAN_MAJLIS") {
              sessionPack = applyThemeToGamePack(sessionPack, activeThemeId);
            }
          }
          if (communityMap) {
            const activeThemeId = this.machine.state.themeId || this.machine.state.settings?.themeId;
            if (
              activeThemeId &&
              activeThemeId !== "ARABIAN_MAJLIS" &&
              activeThemeId !== sessionPack.themeId
            ) {
              sessionPack = applyThemeToGamePack(sessionPack, activeThemeId);
            }
          }
          this.machine.startGameWithAIPack(sessionPack);
          break;
        }

        case "ADD_BOT": {
          const botNames = ["فهد 🤖", "نورة 🤖", "سعود 🤖", "سارة 🤖", "ريان 🤖", "دحوم 🤖"];
          const botColors = ["#EF4444", "#3B82F6", "#22C55E", "#EAB308", "#A855F7", "#EC4899"];
          const currentCount = Object.keys(this.machine.state.players).length;
          const botName = typeof msg.name === "string" ? msg.name : botNames[currentCount % botNames.length];
          const botColor = typeof msg.color === "string" ? msg.color : botColors[currentCount % botColors.length];
          const botId = `bot_${Date.now().toString().slice(-4)}_${Math.random().toString(36).slice(2, 6)}`;

          this.machine.joinPlayer(botId, botName, botColor, undefined, true);
          break;
        }

        case "START_DEFAULT_WITH_BOTS": {
          const botNames = ["فهد 🤖", "نورة 🤖", "سعود 🤖", "سارة 🤖"];
          const botColors = ["#EF4444", "#3B82F6", "#22C55E", "#EAB308"];
          while (Object.keys(this.machine.state.players).length < 3) {
            const count = Object.keys(this.machine.state.players).length;
            const botId = `bot_${count + 1}_${Date.now().toString().slice(-4)}`;
            this.machine.joinPlayer(botId, botNames[count % botNames.length], botColors[count % botColors.length], undefined, true);
          }

          let sessionPack: GeneratedSessionPack;
          const communityMap = typeof msg.presetKey === "string" ? getCommunityMapByKey(msg.presetKey) : undefined;
          if (communityMap) {
            sessionPack = communityMap.pack;
            const chosenTheme =
              this.machine.state.themeId || this.machine.state.settings?.themeId;
            if (!chosenTheme || chosenTheme === "ARABIAN_MAJLIS") {
              this.machine.state.themeId = communityMap.themeId;
              if (this.machine.state.settings) {
                this.machine.state.settings.themeId = communityMap.themeId;
              }
            }
          } else if (typeof msg.presetKey === "string" && PRESET_PACKS[msg.presetKey]) {
            sessionPack = PRESET_PACKS[msg.presetKey];
            if (msg.presetKey === "MONOPOLY_CLASSIC") {
              this.machine.state.themeId = "MONOPOLY_CLASSIC";
              if (this.machine.state.settings) {
                this.machine.state.settings.themeId = "MONOPOLY_CLASSIC";
              }
            }
          } else {
            const playerNames = Object.values(this.machine.state.players).map(p => p.name);
            sessionPack = getDefaultSessionPack(playerNames);
          }

          if (!communityMap && msg.presetKey !== "MONOPOLY_CLASSIC") {
            const activeThemeId = this.machine.state.themeId || this.machine.state.settings?.themeId;
            if (activeThemeId && activeThemeId !== "ARABIAN_MAJLIS") {
              sessionPack = applyThemeToGamePack(sessionPack, activeThemeId);
            }
          }
          if (communityMap) {
            const activeThemeId = this.machine.state.themeId || this.machine.state.settings?.themeId;
            if (
              activeThemeId &&
              activeThemeId !== "ARABIAN_MAJLIS" &&
              activeThemeId !== sessionPack.themeId
            ) {
              sessionPack = applyThemeToGamePack(sessionPack, activeThemeId);
            }
          }
          this.machine.startGameWithAIPack(sessionPack);
          break;
        }

        case "RESET_TO_LOBBY": {
          this.machine.resetToLobby();
          break;
        }

        case "ROLL_DICE": {
          this.machine.rollDiceAndMove(playerId);
          break;
        }

        case "MOVE_LUDO_TOKEN": {
          this.machine.moveLudoToken(playerId, msg.tokenId);
          break;
        }

        case "DROP_CONNECT_FOUR_PIECE": {
          this.machine.dropConnectFourPiece(playerId, Number(msg.column));
          break;
        }

        case "MOVE_CHECKERS_PIECE": {
          this.machine.moveCheckersPiece(
            playerId,
            Number(msg.fromRow),
            Number(msg.fromCol),
            Number(msg.toRow),
            Number(msg.toCol)
          );
          break;
        }

        case "CALL_BINGO_NUMBER": {
          this.machine.callBingoNumber(playerId);
          break;
        }

        case "BUY_PROPERTY": {
          this.machine.buyProperty(playerId, msg.tileIndex);
          break;
        }

        case "BUILD_HOUSE": {
          this.machine.buildHouse(playerId, msg.tileIndex);
          break;
        }

        case "PAY_JAIL_FINE": {
          this.machine.payJailFine(playerId);
          break;
        }

        case "CLAIM_OR_ATTACK_TILE": {
          this.machine.claimOrAttackTile(playerId, msg.targetTileIndex);
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

        case "PLAY_UNO_CARD": {
          this.machine.playUnoCard(
            playerId,
            msg.cardId,
            msg.chosenColor
          );
          break;
        }

        case "DRAW_UNO_CARD": {
          this.machine.drawUnoCard(playerId);
          break;
        }

        case "PASS_UNO_AFTER_DRAW": {
          this.machine.passUnoAfterDraw(playerId);
          break;
        }

        case "SHOUT_UNO": {
          this.machine.shoutUno(playerId);
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
              emoji: msg.emoji,
              text: msg.text,
              voiceId: msg.voiceId
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

    conn.send(
      JSON.stringify({
        type: "STATE_SYNC",
        state: {
          ...rawState,
          deck: undefined,
          players: sanitizedPlayers,
          unoState: sanitizedUnoState
        }
      })
    );
  }
}
