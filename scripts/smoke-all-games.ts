import WebSocket from "ws";
import http from "http";

interface SmokeGame {
  key: string;
  label: string;
  expect: string[];
}

const GAMES: SmokeGame[] = [
  { key: "MONOPOLY_CLASSIC", label: "مونوبولي", expect: ["DICE_ROLLED"] },
  { key: "LUDO_CLASSIC", label: "لودو", expect: ["LUDO_DICE_ROLLED", "LUDO_NO_MOVES", "LUDO_THREE_SIXES_PENALTY"] },
  { key: "TACTICAL_CARDS_UNO", label: "أونو", expect: ["UNO_CARD_PLAYED", "UNO_CARD_DRAWN"] },
  { key: "SNAKES_AND_LADDERS_RPG", label: "السلم والثعبان", expect: ["DICE_ROLLED"] },
  { key: "WORLD_CONQUEST_RISK", label: "غزو العالم", expect: ["TERRITORY_INCOME", "TERRITORY_ACTION_SPENT"] },
  { key: "SOCIAL_MAFIA_SPY", label: "مافيا", expect: ["MAFIA_ROLES_DEALT", "MAFIA_NIGHT_STARTED", "MAFIA_ACTION_LOCKED"] },
  { key: "CONNECT_FOUR", label: "كونكت فور", expect: ["CONNECT_FOUR_DROPPED"] },
  { key: "CHECKERS_CLASSIC", label: "الضامة", expect: ["CHECKERS_MOVED"] },
  { key: "BINGO_NIGHT", label: "بينغو", expect: ["BINGO_NUMBER_CALLED"] }
];

function checkServer(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get("http://127.0.0.1:1999/", (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(700, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function smokeGame(game: SmokeGame): Promise<{ ok: boolean; detail: string }> {
  return new Promise((resolve) => {
    const roomId = `SMOKE_${game.key}_${Math.random().toString(36).slice(2, 6)}`;
    const ws = new WebSocket(`ws://127.0.0.1:1999/party/${roomId}?role=HOST`);
    const seen: string[] = [];
    let started = false;
    let settled = false;

    const finish = (ok: boolean, detail: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {}
      resolve({ ok, detail });
    };

    const timer = setTimeout(() => {
      finish(false, `مهلة منتهية — بدأت=${started} — الأحداث=${seen.slice(0, 12).join(", ")}`);
    }, 20000);

    ws.on("open", () => {
      setTimeout(() => {
        ws.send(JSON.stringify({ type: "START_DEFAULT_WITH_BOTS", presetKey: game.key }));
      }, 250);
    });

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "GAME_STARTED") started = true;
        if (typeof msg.type !== "string") return;
        if (!seen.includes(msg.type)) seen.push(msg.type);
        if (msg.type === "ACTION_REJECTED") {
          finish(false, `رفض الخادم: ${msg.messageAr}`);
          return;
        }
        if (started && game.expect.includes(msg.type)) {
          finish(true, `بدأت وأصدرت ${msg.type}`);
        }
      } catch {}
    });

    ws.on("error", (err) => finish(false, `خطأ اتصال: ${err.message}`));
  });
}

async function main() {
  if (!(await checkServer())) {
    console.error("❌ خادم اللعبة غير مشغّل على المنفذ 1999. شغّل: npm run dev:all");
    process.exit(1);
  }

  console.log("====================================================");
  console.log("🤖 تشغيل دخان آلي لكل لعبة مع بوتات حقيقية...");
  console.log("====================================================\n");

  let failed = 0;
  for (const game of GAMES) {
    const result = await smokeGame(game);
    console.log(`${result.ok ? "✅" : "❌"} ${game.label}: ${result.detail}`);
    if (!result.ok) failed++;
  }

  console.log(
    `\n${GAMES.length - failed}/${GAMES.length} لعبة بدأت وأنتجت حركة بوت حيّة.`
  );
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
