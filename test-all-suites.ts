import { execSync, spawn, ChildProcess } from "child_process";
import http from "http";

const suites = [
  "test-engine.ts",
  "test-ai-pack.ts",
  "test-mechanics-edge-cases.ts",
  "test-game-settings.ts",
  "test-universal-archetypes.ts",
  "test-ai-co-designer.ts",
  "test-lobby-pack-selection.ts",
  "test-multi-genre-schema.ts",
  "test-multi-genre.ts",
  "test-famous-presets.ts",
  "test-server-protocol.ts",
  "test-room-security.ts",
  "test-accounts-and-dna.ts",
  "test-bots-integration.ts",
  "test-uno-authentic.ts",
  "test-monopoly-authentic.ts",
  "test-snakes-authentic.ts",
  "test-ludo-authentic.ts",
  "test-authentic-game-over.ts",
  "test-theme-registry.ts",
  "test-universal-reskin.ts",
  "test-themed-audio-social.ts",
  "test-base-community-maps.ts",
  "test-game-profiles.ts",
  "test-game-results.ts",
  "test-director-intervention.ts"
];

function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.log("====================================================");
  console.log(`🚀 RUNNING ALL ${suites.length} REGRESSION TEST SUITES (GAME RULES, ENGINES, PROTOCOL & UI INTEGRATION)`);
  console.log("====================================================\n");

  const PORT = 1999;
  let serverProcess: ChildProcess | null = null;

  const isRunning = await checkPort(PORT);
  if (!isRunning) {
    console.log("⚙️ Starting standalone server on port 1999 for integration tests...");
    serverProcess = spawn("./node_modules/.bin/tsx src/server/standalone.ts", [], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(PORT) },
      shell: true,
      stdio: "pipe"
    });

    let ready = false;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 200));
      if (await checkPort(PORT)) {
        ready = true;
        console.log("✅ Standalone server is healthy on port 1999.\n");
        break;
      }
    }

    if (!ready) {
      console.error("❌ Failed to start standalone server on port 1999.");
      if (serverProcess) serverProcess.kill("SIGKILL");
      process.exit(1);
    }
  }

  let allPassed = true;
  let totalSuites = suites.length;
  let passedSuites = 0;

  try {
    for (const suite of suites) {
      console.log(`▶ Running ${suite}...`);
      try {
        const output = execSync(`npx tsx ${suite}`, {
          encoding: "utf-8",
          stdio: "pipe"
        });
        console.log(output);
        console.log(`✅ [${suite}] PASSED 100%\n`);
        passedSuites++;
      } catch (err: any) {
        allPassed = false;
        console.error(`❌ [${suite}] FAILED!`);
        console.error(err.stdout || err.message);
        console.error(err.stderr || "");
        break;
      }
    }
  } finally {
    if (serverProcess) {
      console.log("🧹 Stopping test standalone server...");
      try {
        serverProcess.kill("SIGKILL");
      } catch {}
    }
  }

  if (allPassed) {
    console.log("====================================================");
    console.log(`🎉 ALL ${totalSuites} SUITES PASSED WITH 100% SUCCESS RATE! 🎉`);
    console.log("====================================================");
    process.exit(0);
  } else {
    console.error(`❌ REGRESSION FAILURE DETECTED. Passed ${passedSuites}/${totalSuites}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test runner encountered an error:", err);
  process.exit(1);
});
