import http from "http";
import WebSocket from "ws";

let totalTests = 0;
let passedTests = 0;

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

  constructor(public url: string) {}

  async connect(timeout = 4000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Connection to ${this.url} timed out`));
      }, timeout);

      this.ws = new WebSocket(this.url);

      this.ws.on("open", () => {
        clearTimeout(timer);
        resolve();
      });

      this.ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          this.messages.push(msg);
        } catch (e) {
          console.error("Failed to parse message:", e);
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

  async waitForMessage(
    predicate: (msg: IncomingMessage) => boolean,
    timeout = 4000
  ): Promise<IncomingMessage> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const match = this.messages.find(predicate);
      if (match) return match;
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error(`Timed out waiting for message matching predicate`);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  console.log("=== TASK 1 TEST SUITE: ROOM CREATION API & HOST SECURITY TOKEN ===");

  const serverPort = 1999;
  const testRoomId = `SEC_${Date.now().toString().slice(-4)}`;
  const validHostToken = `ht_${Math.random().toString(36).slice(2, 12)}`;
  const forgedHostToken = "ht_forged_invalid_token";

  // 1. First HOST connects with valid token
  console.log("\n--- 1. Testing Legitimate Host Connection ---");
  const host1 = new TestClient(
    `ws://127.0.0.1:${serverPort}/party/${testRoomId}?role=HOST&hostToken=${validHostToken}`
  );
  await host1.connect();
  const host1Sync = await host1.waitForMessage((m) => m.type === "STATE_SYNC");
  assert(host1Sync.type === "STATE_SYNC", "Legitimate host receives STATE_SYNC");

  // 2. Two players join the room
  console.log("\n--- 2. Joining 2 Players ---");
  const player1 = new TestClient(
    `ws://127.0.0.1:${serverPort}/party/${testRoomId}?role=PLAYER&playerId=p_sec1`
  );
  await player1.connect();
  player1.send({ type: "JOIN_ROOM", name: "نواف", color: "#3B82F6" });

  const player2 = new TestClient(
    `ws://127.0.0.1:${serverPort}/party/${testRoomId}?role=PLAYER&playerId=p_sec2`
  );
  await player2.connect();
  player2.send({ type: "JOIN_ROOM", name: "ريما", color: "#EF4444" });

  await host1.waitForMessage((m) => m.type === "STATE_SYNC" && m.state?.players?.["p_sec2"]);
  assert(true, "Both players successfully joined room");

  // 3. Imposter tries to connect as HOST with forged hostToken
  console.log("\n--- 3. Testing Unauthorized Host Connection (Hijack Attempt) ---");
  const imposter = new TestClient(
    `ws://127.0.0.1:${serverPort}/party/${testRoomId}?role=HOST&hostToken=${forgedHostToken}`
  );
  await imposter.connect();

  // Imposter attempts to start game
  imposter.send({ type: "START_AI_GAME", useDefaultPack: true });
  const rejection = await imposter.waitForMessage(
    (m) => m.type === "ACTION_REJECTED" && m.messageAr?.includes("مضيف")
  );
  assert(
    rejection.type === "ACTION_REJECTED" && rejection.messageAr?.includes("مضيف"),
    "Unauthorized host attempting START_AI_GAME is rejected with 'رمز المضيف غير مصرح به'"
  );

  // 4. Legitimate host starts game successfully
  console.log("\n--- 4. Testing Legitimate Host Starting Game ---");
  host1.send({ type: "START_AI_GAME", useDefaultPack: true });
  const gameStarted = await host1.waitForMessage((m) => m.type === "GAME_STARTED");
  assert(gameStarted.type === "GAME_STARTED", "Legitimate host starts game successfully");

  host1.close();
  imposter.close();
  player1.close();
  player2.close();

  console.log(`\n=== SUMMARY ===`);
  console.log(`Passed: ${passedTests}/${totalTests} tests`);
  console.log(`✅ PASS: All Task 1 security tests passed!`);
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
