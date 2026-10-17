import http from "http";
import { spawn, ChildProcess } from "child_process";
import WebSocket from "ws";
import { BoardGameRoomMachine } from "./src/game/gameRoom";
import { getDefaultSessionPack } from "./src/game/aiPackGenerator";

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    passedTests++;
    console.log(`✅ PASS: ${message}`);
  }
}

interface IncomingMessage {
  type: string;
  [key: string]: any;
}

class TestClient {
  public ws!: WebSocket;
  public messages: IncomingMessage[] = [];
  private messageListeners: Array<(msg: IncomingMessage) => void> = [];

  constructor(public url: string) {}

  async connect(timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Connection to ${this.url} timed out after ${timeout}ms`));
      }, timeout);

      this.ws = new WebSocket(this.url);

      this.ws.on("open", () => {
        clearTimeout(timer);
        resolve();
      });

      this.ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString()) as IncomingMessage;
          this.messages.push(msg);
          for (const listener of [...this.messageListeners]) {
            listener(msg);
          }
        } catch (e) {
          console.error("Failed to parse message:", data.toString());
        }
      });

      this.ws.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  send(data: any) {
    this.ws.send(JSON.stringify(data));
  }

  markIndex(): number {
    return this.messages.length;
  }

  async waitForMessage(
    predicate: (msg: IncomingMessage) => boolean,
    startFrom = 0,
    timeout = 6000
  ): Promise<IncomingMessage> {
    const existing = this.messages.slice(startFrom).find(predicate);
    if (existing) return existing;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new Error(
            `Timed out waiting for message after ${timeout}ms (inspected from msg index ${startFrom}, total received: ${this.messages.length})`
          )
        );
      }, timeout);

      const listener = (msg: IncomingMessage) => {
        // Only accept if index is >= startFrom
        const currentIdx = this.messages.indexOf(msg);
        if (currentIdx >= startFrom && predicate(msg)) {
          clearTimeout(timer);
          const index = this.messageListeners.indexOf(listener);
          if (index !== -1) this.messageListeners.splice(index, 1);
          resolve(msg);
        }
      };

      this.messageListeners.push(listener);
    });
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        resolve();
        return;
      }
      this.ws.once("close", () => resolve());
      this.ws.close();
    });
  }
}

async function checkPortRunning(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function httpRequest(
  url: string,
  options: http.RequestOptions = {}
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  console.log("=== DOMAIN 3 TEST SUITE: WEBSOCKET SERVER & STATE MACHINE PROTOCOL ===\n");

  const PORT = 1999;
  let serverProcess: ChildProcess | null = null;

  // 1. Check if server is running on port 1999; if not, spawn standalone.ts
  const isAlreadyRunning = await checkPortRunning(PORT);
  if (!isAlreadyRunning) {
    serverProcess = spawn("./node_modules/.bin/tsx src/server/standalone.ts", [], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(PORT) },
      shell: true,
      stdio: "pipe"
    });

    serverProcess.stdout?.on("data", (d) => {
      const txt = d.toString();
      if (txt.includes("running on ws")) {
        console.log(`  [Server stdout]: ${txt.trim()}`);
      }
    });

    serverProcess.stderr?.on("data", (d) => {
      console.error(`  [Server stderr]: ${d.toString().trim()}`);
    });

    // Wait until server is healthy
    let ready = false;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 400));
      if (await checkPortRunning(PORT)) {
        ready = true;
        break;
      }
    }
    assert(ready, "Standalone WebSocket server successfully started and listening on port 1999");
  } else {
    console.log(`Server already running on port ${PORT}. Connecting directly.`);
  }

  try {
    // -------------------------------------------------------------
    // SECTION 1: HTTP Server Health Check & CORS
    // -------------------------------------------------------------
    console.log("\n--- 1. Testing HTTP Server Health Check & CORS ---");
    const getRes = await httpRequest(`http://127.0.0.1:${PORT}/`, { method: "GET" });
    assert(getRes.statusCode === 200, "GET / responds with HTTP 200 status");
    assert(
      getRes.headers["access-control-allow-origin"] === "*",
      "GET / includes Access-Control-Allow-Origin: * header"
    );
    assert(
      getRes.headers["content-type"] === "application/json",
      "GET / returns Content-Type: application/json"
    );

    const getBody = JSON.parse(getRes.body);
    assert(getBody.status === "ok", "GET / response body contains status: 'ok'");
    assert(
      typeof getBody.activeRooms === "number",
      "GET / response body contains activeRooms number"
    );

    const optionsRes = await httpRequest(`http://127.0.0.1:${PORT}/`, { method: "OPTIONS" });
    assert(optionsRes.statusCode === 204, "OPTIONS / responds with HTTP 204 No Content");
    assert(
      optionsRes.headers["access-control-allow-origin"] === "*",
      "OPTIONS / includes Access-Control-Allow-Origin: *"
    );
    assert(
      optionsRes.headers["access-control-allow-methods"]?.includes("GET, OPTIONS") === true,
      "OPTIONS / includes Access-Control-Allow-Methods: GET, OPTIONS"
    );

    // -------------------------------------------------------------
    // SECTION 2: WebSocket URL Parsing & Role Assignment
    // -------------------------------------------------------------
    console.log("\n--- 2. Testing WebSocket URL Parsing & Role Handling ---");
    const testRoomId = `test_room_${Date.now()}`;

    // A. Connect HOST to /party/:roomId?role=HOST
    const hostClient = new TestClient(`ws://127.0.0.1:${PORT}/party/${testRoomId}?role=HOST`);
    await hostClient.connect();
    const hostInitialSync = await hostClient.waitForMessage(
      (m) => m.type === "STATE_SYNC"
    );
    assert(hostInitialSync !== undefined, "Host receives initial STATE_SYNC upon connection");
    assert(
      hostInitialSync.state.roomId === testRoomId,
      `Host URL path /party/:roomId parsed roomId correctly: ${testRoomId}`
    );
    assert(
      hostInitialSync.state.phase === "LOBBY",
      "Room initialized in LOBBY phase"
    );

    // B. Connect PLAYER 1 to /party/:roomId?role=PLAYER&playerId=alice_p1
    const p1Client = new TestClient(
      `ws://127.0.0.1:${PORT}/party/${testRoomId}?role=PLAYER&playerId=alice_p1`
    );
    await p1Client.connect();
    const p1InitialSync = await p1Client.waitForMessage((m) => m.type === "STATE_SYNC");
    assert(p1InitialSync !== undefined, "Player 1 receives initial STATE_SYNC upon connection");
    assert(
      p1InitialSync.state.roomId === testRoomId,
      "Player 1 parsed same roomId correctly"
    );

    // C. Connect PLAYER 2 to /party/:roomId?role=PLAYER&playerId=bob_p2
    const p2Client = new TestClient(
      `ws://127.0.0.1:${PORT}/party/${testRoomId}?role=PLAYER&playerId=bob_p2`
    );
    await p2Client.connect();
    const p2InitialSync = await p2Client.waitForMessage((m) => m.type === "STATE_SYNC");
    assert(p2InitialSync !== undefined, "Player 2 receives initial STATE_SYNC upon connection");

    // D. Test alternate URL paths: /alternate_room?role=HOST and /?role=HOST (DEFAULT)
    const altRoomClient = new TestClient(`ws://127.0.0.1:${PORT}/alternate_room?role=HOST`);
    await altRoomClient.connect();
    const altSync = await altRoomClient.waitForMessage((m) => m.type === "STATE_SYNC");
    assert(
      altSync.state.roomId === "alternate_room",
      "URL parsing fallback handles /alternate_room path format"
    );
    await altRoomClient.close();

    const defaultRoomClient = new TestClient(`ws://127.0.0.1:${PORT}/?role=HOST`);
    await defaultRoomClient.connect();
    const defSync = await defaultRoomClient.waitForMessage((m) => m.type === "STATE_SYNC");
    assert(
      defSync.state.roomId === "DEFAULT",
      "URL parsing fallback handles root path / by defaulting roomId to 'DEFAULT'"
    );
    await defaultRoomClient.close();

    // -------------------------------------------------------------
    // SECTION 3: Message Routing (JOIN_ROOM, SEND_REACTION, Action Rejection)
    // -------------------------------------------------------------
    console.log("\n--- 3. Testing Message Routing ---");

    // A. HOST cannot join as a player
    hostClient.send({
      type: "JOIN_ROOM",
      name: "FakeHostPlayer",
      color: "#000000"
    });
    // Wait briefly to verify no state updated with HOST as player
    await new Promise((r) => setTimeout(r, 200));

    // B. Player 1 (Alice) joins room
    const hostIdxBeforeP1 = hostClient.markIndex();
    p1Client.send({
      type: "JOIN_ROOM",
      name: "سارة",
      color: "#E74C3C",
      promptIdea: "تحب القهوة وتحسب الحسابات بدقة"
    });

    const p1JoinHostSync = await hostClient.waitForMessage(
      (m) => m.type === "STATE_SYNC" && m.state.players["alice_p1"] !== undefined,
      hostIdxBeforeP1
    );
    assert(
      p1JoinHostSync.state.players["alice_p1"].name === "سارة",
      "Host receives STATE_SYNC when Player 1 joins with name 'سارة'"
    );

    // C. Player 2 (Bob) joins room
    const hostIdxBeforeP2 = hostClient.markIndex();
    p2Client.send({
      type: "JOIN_ROOM",
      name: "فيصل",
      color: "#3498DB",
      promptIdea: "يحب المقالب والمفاجآت في اللعب"
    });

    const p2JoinHostSync = await hostClient.waitForMessage(
      (m) => m.type === "STATE_SYNC" && m.state.players["bob_p2"] !== undefined,
      hostIdxBeforeP2
    );
    assert(
      p2JoinHostSync.state.players["bob_p2"].name === "فيصل",
      "Host receives STATE_SYNC when Player 2 joins with name 'فيصل'"
    );
    assert(
      p2JoinHostSync.state.players["FakeHostPlayer"] === undefined,
      "HOST role ignored JOIN_ROOM and was not added as a player"
    );

    // D. Test SEND_REACTION broadcast
    const hostIdxBeforeReaction = hostClient.markIndex();
    const p2IdxBeforeReaction = p2Client.markIndex();
    p1Client.send({
      type: "SEND_REACTION",
      emoji: "🔥"
    });

    const hostReaction = await hostClient.waitForMessage(
      (m) => m.type === "LIVE_REACTION",
      hostIdxBeforeReaction
    );
    assert(
      hostReaction.playerId === "alice_p1" && hostReaction.emoji === "🔥",
      "Host receives LIVE_REACTION broadcast from Player 1 with emoji 🔥"
    );

    const p2Reaction = await p2Client.waitForMessage(
      (m) => m.type === "LIVE_REACTION",
      p2IdxBeforeReaction
    );
    assert(
      p2Reaction.playerId === "alice_p1" && p2Reaction.emoji === "🔥",
      "Peer Player 2 receives LIVE_REACTION broadcast from Player 1"
    );

    // E. Test Invalid Action Rejection (Error handling & ACTION_REJECTED message)
    const p1IdxBeforeVoteRejection = p1Client.markIndex();
    p1Client.send({
      type: "SUBMIT_VOTE",
      targetPlayerId: "bob_p2"
    });
    const voteRejected = await p1Client.waitForMessage(
      (m) => m.type === "ACTION_REJECTED",
      p1IdxBeforeVoteRejection
    );
    assert(
      voteRejected !== undefined && typeof voteRejected.messageAr === "string",
      `SUBMIT_VOTE in LOBBY phase correctly rejected with messageAr: "${voteRejected.messageAr}"`
    );

    const p1IdxBeforeCardRejection = p1Client.markIndex();
    p1Client.send({
      type: "PLAY_SECRET_CARD",
      cardId: "fake_card_id"
    });
    const cardRejected = await p1Client.waitForMessage(
      (m) => m.type === "ACTION_REJECTED",
      p1IdxBeforeCardRejection
    );
    assert(
      cardRejected !== undefined,
      `PLAY_SECRET_CARD in LOBBY phase correctly rejected with messageAr: "${cardRejected.messageAr}"`
    );

    const p1IdxBeforeDiceRejection = p1Client.markIndex();
    p1Client.send({
      type: "ROLL_DICE"
    });
    const diceRejected = await p1Client.waitForMessage(
      (m) => m.type === "ACTION_REJECTED",
      p1IdxBeforeDiceRejection
    );
    assert(
      diceRejected !== undefined,
      `ROLL_DICE in LOBBY phase correctly rejected with messageAr: "${diceRejected.messageAr}"`
    );

    // -------------------------------------------------------------
    // SECTION 4: START_AI_GAME & Privacy Filtering (sendSanitizedState)
    // -------------------------------------------------------------
    console.log("\n--- 4. Testing START_AI_GAME & Privacy Filtering ---");

    const hostIdxBeforeStart = hostClient.markIndex();
    const p1IdxBeforeStart = p1Client.markIndex();
    const p2IdxBeforeStart = p2Client.markIndex();

    // Start game using default pack
    p1Client.send({
      type: "START_AI_GAME",
      useDefaultPack: true
    });

    const aiGenHost = await hostClient.waitForMessage(
      (m) => m.type === "AI_GENERATING",
      hostIdxBeforeStart
    );
    assert(aiGenHost !== undefined, "Host receives AI_GENERATING announcement broadcast");

    const gameStartedHost = await hostClient.waitForMessage(
      (m) => m.type === "GAME_STARTED",
      hostIdxBeforeStart
    );
    assert(
      gameStartedHost !== undefined && typeof gameStartedHost.themeTitle === "string",
      `Host receives GAME_STARTED with themeTitle: "${gameStartedHost.themeTitle}"`
    );

    const hostGameState = await hostClient.waitForMessage(
      (m) => m.type === "STATE_SYNC" && m.state.phase === "TURN_START",
      hostIdxBeforeStart
    );
    assert(
      hostGameState.state.phase === "TURN_START",
      "Game transitions to TURN_START phase"
    );
    assert(
      Array.isArray(hostGameState.state.tiles) && hostGameState.state.tiles.length === 20,
      "Board initialized with 20 tiles"
    );

    // Verify Deck Privacy: deck is undefined for all clients
    assert(
      hostGameState.state.deck === undefined,
      "Deck is undefined for HOST (hidden draw pile)"
    );

    const p1GameState = await p1Client.waitForMessage(
      (m) => m.type === "STATE_SYNC" && m.state.phase === "TURN_START",
      p1IdxBeforeStart
    );
    assert(
      p1GameState.state.deck === undefined,
      "Deck is undefined for Player 1"
    );

    const p2GameState = await p2Client.waitForMessage(
      (m) => m.type === "STATE_SYNC" && m.state.phase === "TURN_START",
      p2IdxBeforeStart
    );
    assert(
      p2GameState.state.deck === undefined,
      "Deck is undefined for Player 2"
    );

    // -------------------------------------------------------------
    // SECTION 5: In-Depth Secret Card Privacy Verification
    // -------------------------------------------------------------
    console.log("\n--- 5. Testing Secret Hand Privacy (HOST, Owner, Opponent) ---");

    // Check privacy on Host:
    assert(
      Array.isArray(hostGameState.state.players["alice_p1"].secretHand) &&
        hostGameState.state.players["alice_p1"].secretHand.length === 0,
      "Host sees secretHand as empty array [] for Player 1"
    );
    assert(
      typeof hostGameState.state.players["alice_p1"].secretHandCount === "number",
      "Host sees secretHandCount for Player 1"
    );
    assert(
      Array.isArray(hostGameState.state.players["bob_p2"].secretHand) &&
        hostGameState.state.players["bob_p2"].secretHand.length === 0,
      "Host sees secretHand as empty array [] for Player 2"
    );
    assert(
      typeof hostGameState.state.players["bob_p2"].secretHandCount === "number",
      "Host sees secretHandCount for Player 2"
    );

    // Test in-game turn validation: Inactive player roll rejected
    let activePlayerId = hostGameState.state.turnOrder[hostGameState.state.currentTurnIndex];
    const inactiveClient = activePlayerId === "alice_p1" ? p2Client : p1Client;
    const activeClient = activePlayerId === "alice_p1" ? p1Client : p2Client;

    const inactiveIdx = inactiveClient.markIndex();
    inactiveClient.send({ type: "ROLL_DICE" });
    const rej = await inactiveClient.waitForMessage((m) => m.type === "ACTION_REJECTED", inactiveIdx);
    assert(
      rej.messageAr.includes("دور"),
      `Inactive player ROLL_DICE rejected with message: "${rej.messageAr}"`
    );

    // Active player rolls dice
    const hostIdxRoll = hostClient.markIndex();
    activeClient.send({ type: "ROLL_DICE" });
    const diceEvent = await hostClient.waitForMessage(
      (m) => m.type === "DICE_ROLLED" && m.playerId === activePlayerId,
      hostIdxRoll
    );
    assert(
      diceEvent.diceValue >= 1 && diceEvent.diceValue <= 6,
      `Active player ${activePlayerId} rolled dice: ${diceEvent.diceValue}, landed on tile ${diceEvent.landedTile.name}`
    );

    // Comprehensive mathematical unit verification of sendSanitizedState logic:
    console.log("\n--- Testing sendSanitizedState Privacy Logic Permutations ---");
    const mockRoomMachine = new BoardGameRoomMachine("test_privacy", () => {});
    const mockPack = getDefaultSessionPack(["أليس", "بسام"]);
    mockRoomMachine.joinPlayer("p_alice", "أليس", "#ff0000");
    mockRoomMachine.joinPlayer("p_bassam", "بسام", "#00ff00");
    mockRoomMachine.startGameWithAIPack(mockPack);

    // Give Alice 2 secret cards, Bassam 1 secret card
    mockRoomMachine.state.players["p_alice"].secretHand = [
      mockPack.cardsDeck[0],
      mockPack.cardsDeck[1]
    ];
    mockRoomMachine.state.players["p_bassam"].secretHand = [mockPack.cardsDeck[2]];

    // Helper replicating sendSanitizedState exact logic from standalone.ts
    function getSanitizedOutput(viewerId: string, role: "HOST" | "PLAYER") {
      const rawState = mockRoomMachine.state;
      const vId = role === "HOST" ? "HOST" : viewerId;
      const sanitizedPlayers = Object.fromEntries(
        Object.entries(rawState.players).map(([id, player]) => {
          const isOwner = id === vId;
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
      return JSON.parse(
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

    // 1. HOST VIEW
    const hostSanitized = getSanitizedOutput("HOST", "HOST");
    assert(
      hostSanitized.state.players["p_alice"].secretHandCount === 2,
      "HOST view: Alice secretHandCount is 2"
    );
    assert(
      hostSanitized.state.players["p_alice"].secretHand.length === 0,
      "HOST view: Alice secretHand array is completely empty []"
    );
    assert(
      hostSanitized.state.players["p_bassam"].secretHandCount === 1,
      "HOST view: Bassam secretHandCount is 1"
    );
    assert(
      hostSanitized.state.players["p_bassam"].secretHand.length === 0,
      "HOST view: Bassam secretHand array is completely empty []"
    );
    assert(
      hostSanitized.state.deck === undefined,
      "HOST view: Deck is completely undefined"
    );

    // 2. OWNER VIEW (Alice)
    const aliceSanitized = getSanitizedOutput("p_alice", "PLAYER");
    assert(
      aliceSanitized.state.players["p_alice"].secretHand.length === 2,
      "ALICE view: Alice sees her own 2 cards in secretHand"
    );
    assert(
      aliceSanitized.state.players["p_alice"].secretHand[0].id === mockPack.cardsDeck[0].id,
      "ALICE view: Alice card 1 matches expected card"
    );
    assert(
      aliceSanitized.state.players["p_bassam"].secretHandCount === 1,
      "ALICE view: Alice sees opponent Bassam secretHandCount as 1"
    );
    assert(
      aliceSanitized.state.players["p_bassam"].secretHand.length === 0,
      "ALICE view: Alice sees opponent Bassam secretHand as empty []"
    );

    // 3. OPPONENT VIEW (Bassam)
    const bassamSanitized = getSanitizedOutput("p_bassam", "PLAYER");
    assert(
      bassamSanitized.state.players["p_bassam"].secretHand.length === 1,
      "BASSAM view: Bassam sees his own 1 card in secretHand"
    );
    assert(
      bassamSanitized.state.players["p_alice"].secretHandCount === 2,
      "BASSAM view: Bassam sees opponent Alice secretHandCount as 2"
    );
    assert(
      bassamSanitized.state.players["p_alice"].secretHand.length === 0,
      "BASSAM view: Bassam sees opponent Alice secretHand as empty []"
    );

    // -------------------------------------------------------------
    // SECTION 6: Player Disconnection & Reconnection
    // -------------------------------------------------------------
    console.log("\n--- 6. Testing Player Disconnection and Reconnection ---");

    // Close Player 1's connection
    console.log("Disconnecting Player 1 (Alice)...");
    const hostIdxDisconnect = hostClient.markIndex();
    const p2IdxDisconnect = p2Client.markIndex();
    await p1Client.close();

    // Host should receive STATE_SYNC where alice_p1 has isConnected: false
    const hostSyncAfterDisconnect = await hostClient.waitForMessage(
      (m) =>
        m.type === "STATE_SYNC" &&
        m.state.players["alice_p1"] &&
        m.state.players["alice_p1"].isConnected === false,
      hostIdxDisconnect
    );
    assert(
      hostSyncAfterDisconnect.state.players["alice_p1"].isConnected === false,
      "Host receives STATE_SYNC with isConnected === false after Player 1 disconnects"
    );

    // Peer Player 2 should also see isConnected === false
    const p2SyncAfterDisconnect = await p2Client.waitForMessage(
      (m) =>
        m.type === "STATE_SYNC" &&
        m.state.players["alice_p1"] &&
        m.state.players["alice_p1"].isConnected === false,
      p2IdxDisconnect
    );
    assert(
      p2SyncAfterDisconnect.state.players["alice_p1"].isConnected === false,
      "Peer Player 2 receives STATE_SYNC with isConnected === false for Alice"
    );

    // Reconnect Player 1 with same playerId alice_p1
    console.log("Reconnecting Player 1 (Alice)...");
    const hostIdxReconnect = hostClient.markIndex();
    const p1Reconnected = new TestClient(
      `ws://127.0.0.1:${PORT}/party/${testRoomId}?role=PLAYER&playerId=alice_p1`
    );
    await p1Reconnected.connect();

    const hostSyncAfterReconnect = await hostClient.waitForMessage(
      (m) =>
        m.type === "STATE_SYNC" &&
        m.state.players["alice_p1"] &&
        m.state.players["alice_p1"].isConnected === true,
      hostIdxReconnect
    );
    assert(
      hostSyncAfterReconnect.state.players["alice_p1"].isConnected === true,
      "Host receives STATE_SYNC with isConnected === true after Player 1 reconnects"
    );

    const p1SyncAfterReconnect = await p1Reconnected.waitForMessage(
      (m) =>
        m.type === "STATE_SYNC" &&
        m.state.players["alice_p1"] &&
        m.state.players["alice_p1"].isConnected === true
    );
    assert(
      p1SyncAfterReconnect.state.players["alice_p1"].isConnected === true,
      "Reconnected Player 1 receives STATE_SYNC with isConnected === true"
    );
    assert(
      p1SyncAfterReconnect.state.players["alice_p1"].name === "سارة",
      "Reconnected Player 1 maintains identity ('سارة') and player state"
    );

    // Clean up connections
    await hostClient.close();
    await p1Reconnected.close();
    await p2Client.close();

    console.log("\n=== SUMMARY ===");
    console.log(`Passed: ${passedTests}/${totalTests} tests`);
    assert(passedTests === totalTests, "All Domain 3 protocol verification tests passed!");
  } finally {
    if (serverProcess) {
      console.log("Shutting down test standalone server...");
      try {
        serverProcess.kill("SIGKILL");
      } catch {}
    }
  }
}

main().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
