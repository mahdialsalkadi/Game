import {
  ORIGINAL_CLASSIC_MONOPOLY_PACK,
  ORIGINAL_CLASSIC_MONOPOLY_TILES_20,
  RIYADH_VIP_MONOPOLY_PACK,
  AUTHENTIC_MONOPOLY_PACK
} from "./src/game/monopolyEngine";
import { PRESET_PACKS } from "./src/game/aiPackGenerator";
import { COMMUNITY_MAPS, getCommunityMapByKey } from "./src/game/communityMaps";
import { BASE_CLASSIC_GAMES } from "./src/components/studio/presets";
import { BoardGameRoomMachine } from "./src/game/gameRoom";

let passed = 0;
let total = 0;

function assert(condition: boolean, msg: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`✅ PASS: ${msg}`);
  } else {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
}

console.log("=================================================");
console.log("🧪 TESTING BASE CLASSIC GAMES & COMMUNITY MAPS");
console.log("=================================================");

// --- 1. Original Classic Monopoly Pack ---
console.log("\n--- 1. Testing Original Classic Monopoly Pack ---");
assert(ORIGINAL_CLASSIC_MONOPOLY_PACK.currencyName === "$", "Classic Monopoly currency is $");
assert(ORIGINAL_CLASSIC_MONOPOLY_PACK.tiles.length === 20, "Classic Monopoly has 20 tiles");
assert(ORIGINAL_CLASSIC_MONOPOLY_PACK.tiles[0].name.includes("انطلق (GO)"), "Tile 0 is GO");
assert(ORIGINAL_CLASSIC_MONOPOLY_PACK.tiles[0].defaultEffect?.value === 200, "GO pays $200");

const boardwalkTile = ORIGINAL_CLASSIC_MONOPOLY_PACK.tiles[19];
assert(boardwalkTile.name.includes("بوردووك") || boardwalkTile.name.includes("Boardwalk"), "Tile 19 is Boardwalk & Park Place");
assert(boardwalkTile.price === 400, "Boardwalk price is $400");
assert(boardwalkTile.rent === 100, "Boardwalk base rent is $100");
assert(boardwalkTile.colorGroup === "DARK_BLUE", "Boardwalk is DARK_BLUE");

const readingRailroad = ORIGINAL_CLASSIC_MONOPOLY_PACK.tiles[14];
assert(readingRailroad.name.includes("ريدينغ") || readingRailroad.name.includes("Reading"), "Tile 14 is Reading Railroad");

assert(ORIGINAL_CLASSIC_MONOPOLY_PACK.cardsDeck.length >= 12, "Classic Monopoly has cards deck");

// --- 2. Riyadh VIP Pack (Community Map) ---
console.log("\n--- 2. Testing Riyadh VIP Pack ---");
assert(RIYADH_VIP_MONOPOLY_PACK.currencyName === "ريال", "Riyadh VIP currency is SAR");
assert(RIYADH_VIP_MONOPOLY_PACK.tiles[19].name.includes("برج المملكة"), "Riyadh Tile 19 is Kingdom Centre");
assert(AUTHENTIC_MONOPOLY_PACK === RIYADH_VIP_MONOPOLY_PACK, "AUTHENTIC_MONOPOLY_PACK aliases RIYADH_VIP_MONOPOLY_PACK");

// --- 3. PRESET_PACKS Integrity ---
console.log("\n--- 3. Testing PRESET_PACKS Mapping ---");
assert(PRESET_PACKS.MONOPOLY_CLASSIC === ORIGINAL_CLASSIC_MONOPOLY_PACK, "PRESET_PACKS.MONOPOLY_CLASSIC is the Original Classic Monopoly");
assert(PRESET_PACKS.RIYADH_VIP === RIYADH_VIP_MONOPOLY_PACK, "PRESET_PACKS.RIYADH_VIP is Riyadh VIP");
assert(Boolean(PRESET_PACKS.LUDO_CLASSIC), "PRESET_PACKS.LUDO_CLASSIC exists");
assert(Boolean(PRESET_PACKS.TACTICAL_CARDS_UNO), "PRESET_PACKS.TACTICAL_CARDS_UNO exists");
assert(Boolean(PRESET_PACKS.SNAKES_AND_LADDERS_RPG), "PRESET_PACKS.SNAKES_AND_LADDERS_RPG exists");

// --- 4. Community Maps Registry ---
console.log("\n--- 4. Testing Community Maps Registry ---");
assert(COMMUNITY_MAPS.length >= 6, "At least 6 curated community maps registered");

const riyadhMap = getCommunityMapByKey("RIYADH_VIP");
assert(Boolean(riyadhMap), "Riyadh VIP community map found");
assert(riyadhMap!.creatorAr.includes("الرياض"), "Riyadh creator is Riyadh community");
assert(riyadhMap!.rating >= 4.5, "Riyadh rating is >= 4.5");
assert(riyadhMap!.downloadsCount > 10000, "Riyadh downloads > 10,000");

const cyberpunkMap = getCommunityMapByKey("CYBERPUNK_HEIST");
assert(Boolean(cyberpunkMap), "Cyberpunk community map found");
assert(cyberpunkMap!.pack.visualStyle === "CYBERPUNK", "Cyberpunk visual style is CYBERPUNK");

const spaceMap = getCommunityMapByKey("DEEP_SPACE_CUSTOM");
assert(Boolean(spaceMap), "Deep Space community map found");
assert(spaceMap!.pack.visualStyle === "SPACE", "Deep Space visual style is SPACE");

const medievalMap = getCommunityMapByKey("MEDIEVAL_CUSTOM");
assert(Boolean(medievalMap), "Medieval community map found");
assert(medievalMap!.pack.visualStyle === "FANTASY", "Medieval visual style is FANTASY");

// --- 5. Base Classic Games List ---
console.log("\n--- 5. Testing Base Classic Games List ---");
assert(BASE_CLASSIC_GAMES.length === 9, "Base classic games has 9 games");
assert(
  BASE_CLASSIC_GAMES.some((g) => g.key === "CONNECT_FOUR") &&
    BASE_CLASSIC_GAMES.some((g) => g.key === "CHECKERS_CLASSIC") &&
    BASE_CLASSIC_GAMES.some((g) => g.key === "BINGO_NIGHT"),
  "Base games include Connect Four, Checkers, and Bingo"
);
const baseMonopoly = BASE_CLASSIC_GAMES.find((g) => g.key === "MONOPOLY_CLASSIC");
assert(Boolean(baseMonopoly), "Base Monopoly exists in lounge games");
assert(baseMonopoly!.titleAr.includes("الأصلية") || baseMonopoly!.titleAr.includes("كلاسيك"), "Base Monopoly has classic title");
assert(baseMonopoly!.subtitleAr.includes("بوردووك") || baseMonopoly!.subtitleAr.includes("أتلانتيك"), "Base Monopoly references Boardwalk/Atlantic City");

// --- 6. Room Machine Game Execution ---
console.log("\n--- 6. Testing Room Machine Start with Base vs Community Maps ---");
const machine1 = new BoardGameRoomMachine("ROOM_BASE_1", () => {});
machine1.joinPlayer("p1", "خالد", "#3B82F6");
machine1.joinPlayer("p2", "فهد", "#EF4444");

// Start with Base Classic Monopoly
machine1.startGameWithAIPack(PRESET_PACKS.MONOPOLY_CLASSIC);
assert(machine1.state.phase === "TURN_START", "Machine started playing (TURN_START)");
assert(machine1.state.currencyName === "$", "Active room currency is $");
assert(machine1.state.tiles[19].name.includes("بوردووك") || machine1.state.tiles[19].name.includes("Boardwalk"), "Active room tile 19 is Boardwalk");

// Reset and Start with Community Map (Riyadh VIP)
machine1.resetToLobby();
assert(machine1.state.phase === "LOBBY", "Machine reset to lobby");
machine1.startGameWithAIPack(PRESET_PACKS.RIYADH_VIP);
assert(machine1.state.phase === "TURN_START", "Machine started playing Riyadh VIP (TURN_START)");
assert(machine1.state.currencyName === "ريال", "Active room currency is SAR for Riyadh");
assert(machine1.state.tiles[19].name.includes("برج المملكة"), "Active room tile 19 is Kingdom Centre");

console.log("\n=================================================");
console.log(`🎉 ALL ${passed}/${total} BASE & COMMUNITY MAPS TESTS PASSED!`);
console.log("=================================================");
