import WebSocket from "ws";
import http from "http";

function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(600, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  const isServerRunning = await checkPort(1999);
  if (!isServerRunning) {
    console.error("❌ خادم اللعبة غير مشغل على المنفذ 1999.");
    console.error("يرجى تشغيل المنصة أولاً عبر: npm run dev:all");
    process.exit(1);
  }

  const roomId = "BOTS";
  console.log(`\n======================================================`);
  console.log(`🎲 جاري إنشاء وبدء قيم افتراضي مع 3 بوتات ذكية في الغرفة [${roomId}]...`);
  console.log(`======================================================\n`);

  const ws = new WebSocket(`ws://127.0.0.1:1999/party/${roomId}?role=HOST`);

  ws.on("open", () => {
    console.log(`✅ تم الاتصال كمضيف بالغرفة [${roomId}]`);
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: "START_DEFAULT_WITH_BOTS",
        presetKey: "MONOPOLY_CLASSIC"
      }));
    }, 400);
  });

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "GAME_STARTED") {
        console.log(`🎉 بدأت اللعبة بنجاح! الثيم: ${msg.themeTitle || "مونوبولي كلاسيك"}`);
        console.log(`\n------------------------------------------------------`);
        console.log(`📺 رابط شاشة التلفزيون / المضيف (شاهد البوتات تلعب مباشرة):`);
        console.log(`👉 http://100.76.185.49:3000/host/${roomId}`);
        console.log(`👉 http://localhost:3000/host/${roomId}`);
        console.log(`\n📱 رابط الانضمام واللعب مع البوتات من هاتفك:`);
        console.log(`👉 http://100.76.185.49:3000/room/${roomId}?role=PLAYER`);
        console.log(`------------------------------------------------------\n`);
      } else if (msg.type === "DICE_ROLLED") {
        console.log(`🎲 رمى البوت النرد: [${msg.diceValue}] واستقر على: ${msg.landedTile?.name || ""}`);
      } else if (msg.type === "PROPERTY_BOUGHT") {
        console.log(`🏠 اشترى البوت العقار: ${msg.tile?.name || ""}`);
      } else if (msg.type === "RENT_PAID") {
        console.log(`💰 دفع إيجار: ${msg.messageAr}`);
      }
    } catch {}
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
}

main().catch(console.error);
