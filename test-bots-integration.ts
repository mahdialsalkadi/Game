import WebSocket from "ws";
import { spawn, ChildProcess } from "child_process";
import http from "http";

function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function run() {
  console.log("🤖 TESTING BOTS AND AUTO-PLAY ENGINE...");

  let serverProcess: ChildProcess | null = null;
  const isRunning = await checkPort(1999);
  if (!isRunning) {
    console.log("Starting server on 1999...");
    serverProcess = spawn("./node_modules/.bin/tsx src/server/standalone.ts", [], {
      shell: true,
      stdio: "pipe"
    });
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 200));
      if (await checkPort(1999)) break;
    }
  }

  const roomId = `BOT_${Math.floor(Math.random() * 9000 + 1000)}`;
  const ws = new WebSocket(`ws://127.0.0.1:1999/party/${roomId}?role=HOST`);

  await new Promise<void>((resolve, reject) => {
    ws.on("open", () => {
      console.log(`Connected as HOST to room ${roomId}`);
      resolve();
    });
    ws.on("error", reject);
  });

  // Wait for initial sync
  await new Promise(r => setTimeout(r, 500));

  // Send START_DEFAULT_WITH_BOTS
  console.log("Sending START_DEFAULT_WITH_BOTS...");
  ws.send(JSON.stringify({ type: "START_DEFAULT_WITH_BOTS", presetKey: "MONOPOLY_CLASSIC" }));

  let sawDiceRoll = false;
  let statesReceived = 0;

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "DICE_ROLLED") {
        console.log(`🎲 Bot rolled dice: ${msg.diceValue}! Landed on tile: ${msg.landedTile?.name}`);
        sawDiceRoll = true;
      }
      if (msg.type === "STATE_UPDATED" || msg.type === "STATE_SYNC") {
        statesReceived++;
      }
    } catch {}
  });

  // Wait for bot to auto-roll after ~2.5 seconds
  console.log("Waiting for bot auto-turn...");
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 300));
    if (sawDiceRoll) break;
  }

  if (sawDiceRoll) {
    console.log("✅ SUCCESS: Bots joined and auto-rolled successfully!");
  } else {
    console.log("⚠️ Did not see dice roll within timeout, but states received:", statesReceived);
  }

  ws.close();
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(sawDiceRoll ? 0 : 1);
}

run().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
