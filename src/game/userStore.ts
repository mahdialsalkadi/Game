import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { GeneratedSessionPack } from "./schema";

export interface PlayerBehavioralDNA {
  gamesPlayed: number;
  winsCount: number;
  aggressionScore: number;    // 0-100: attacks, territory conquest, steals
  capitalistScore: number;    // 0-100: property buying, rent hoarding, high balances
  tacticalCardScore: number;  // 0-100: secret card plays, shields used
  socialVoterScore: number;   // 0-100: voting participation, voting consensus
  nemesisMap: Record<string, number>; // rivalId -> encounters/clashes
  archetypeTitle: string;     // evolved title e.g. "الإمبراطور الرأسمالي 🏦"
  lastUpdated: string;
}

export function createDefaultDNA(): PlayerBehavioralDNA {
  return {
    gamesPlayed: 0,
    winsCount: 0,
    aggressionScore: 25,
    capitalistScore: 25,
    tacticalCardScore: 25,
    socialVoterScore: 25,
    nemesisMap: {},
    archetypeTitle: "المغامر المتوازن 🎲",
    lastUpdated: new Date().toISOString()
  };
}

export interface SavedCustomGame {
  id: string;
  authorId: string;
  authorName: string;
  visibility: "PRIVATE" | "PUBLIC";
  likesCount: number;
  playsCount: number;
  createdAt: string;
  pack: GeneratedSessionPack;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatarColor: string;
  createdAt: string;
  dna: PlayerBehavioralDNA;
  myGames: SavedCustomGame[];
}

interface PlatformDataStore {
  users: Record<string, UserAccount>; // id -> user
  games: Record<string, SavedCustomGame>; // id -> game
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "platform-store.json");

let memoryStore: PlatformDataStore = {
  users: {},
  games: {}
};
let isInitialized = false;

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function loadStore(): void {
  if (isInitialized) return;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      memoryStore = JSON.parse(raw);
    } else {
      memoryStore = { users: {}, games: {} };
      fs.writeFileSync(STORE_PATH, JSON.stringify(memoryStore, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("[UserStore] Error loading store from disk, using empty memory store:", err);
    memoryStore = { users: {}, games: {} };
  }

  isInitialized = true;
}

function persistStore(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(memoryStore, null, 2), "utf-8");
  } catch (err) {
    console.error("[UserStore] Failed to write store to disk:", err);
  }
}

export async function resetStoreForTesting(): Promise<void> {
  memoryStore = { users: {}, games: {} };
  isInitialized = true;
  persistStore();
}

// ==========================================
// 1. إدارة حسابات المستخدمين
// ==========================================

export async function createUser(params: {
  username: string;
  email: string;
  password: string;
  avatarColor?: string;
}): Promise<UserAccount> {
  loadStore();

  const cleanUsername = params.username.trim().toLowerCase();
  const cleanEmail = params.email.trim().toLowerCase();

  // Validate duplicates
  const existingUser = Object.values(memoryStore.users).find(
    (u) => u.username.toLowerCase() === cleanUsername
  );
  if (existingUser) {
    throw new Error("اسم المستخدم مسجل مسبقاً، يرجى اختيار اسم آخر.");
  }

  const existingEmail = Object.values(memoryStore.users).find(
    (u) => u.email.toLowerCase() === cleanEmail
  );
  if (existingEmail) {
    throw new Error("البريد الإلكتروني مسجل مسبقاً.");
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newUser: UserAccount = {
    id: userId,
    username: params.username.trim(),
    email: cleanEmail,
    passwordHash: hashPassword(params.password),
    avatarColor: params.avatarColor || "#EF4444",
    createdAt: new Date().toISOString(),
    dna: createDefaultDNA(),
    myGames: []
  };

  memoryStore.users[userId] = newUser;
  persistStore();

  return newUser;
}

export async function authenticateUser(
  usernameOrEmail: string,
  password: string
): Promise<UserAccount | null> {
  loadStore();

  const query = usernameOrEmail.trim().toLowerCase();
  const expectedHash = hashPassword(password);

  const user = Object.values(memoryStore.users).find(
    (u) =>
      (u.username.toLowerCase() === query || u.email.toLowerCase() === query) &&
      u.passwordHash === expectedHash
  );

  return user || null;
}

export async function getUserById(userId: string): Promise<UserAccount | null> {
  loadStore();
  const user = memoryStore.users[userId];
  if (!user) return null;

  // Sync user's games from master games collection
  const userGames = Object.values(memoryStore.games).filter(
    (g) => g.authorId === userId
  );
  user.myGames = userGames;

  return user;
}

export function getUserByIdSync(userId: string): UserAccount | null {
  loadStore();
  const user = memoryStore.users[userId];
  if (!user) return null;

  const userGames = Object.values(memoryStore.games).filter(
    (g) => g.authorId === userId
  );
  user.myGames = userGames;

  return user;
}

export async function updateUserDNA(
  userId: string,
  updatedDNA: Partial<PlayerBehavioralDNA>
): Promise<UserAccount | null> {
  loadStore();
  const user = memoryStore.users[userId];
  if (!user) return null;

  user.dna = {
    ...user.dna,
    ...updatedDNA,
    lastUpdated: new Date().toISOString()
  };

  persistStore();
  return user;
}

// ==========================================
// 2. إدارة الألعاب المحفوظة ومكتبة المجتمع
// ==========================================

export async function saveCustomGame(params: {
  authorId: string;
  authorName?: string;
  pack: GeneratedSessionPack;
  visibility: "PRIVATE" | "PUBLIC";
}): Promise<SavedCustomGame> {
  loadStore();

  const user = memoryStore.users[params.authorId];
  const authorName = params.authorName || (user ? user.username : "صانع ألعاب مجهول");

  const gameId = `gm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const savedGame: SavedCustomGame = {
    id: gameId,
    authorId: params.authorId,
    authorName,
    visibility: params.visibility,
    likesCount: 0,
    playsCount: 0,
    createdAt: new Date().toISOString(),
    pack: params.pack
  };

  memoryStore.games[gameId] = savedGame;

  if (user) {
    user.myGames.push(savedGame);
  }

  persistStore();
  return savedGame;
}

export async function getPublicCommunityGames(): Promise<SavedCustomGame[]> {
  loadStore();
  return Object.values(memoryStore.games)
    .filter((g) => g.visibility === "PUBLIC")
    .sort((a, b) => (b.playsCount + b.likesCount * 2) - (a.playsCount + a.likesCount * 2));
}

export async function getUserGames(userId: string): Promise<SavedCustomGame[]> {
  loadStore();
  return Object.values(memoryStore.games).filter((g) => g.authorId === userId);
}

export async function remixCommunityGame(
  gameId: string,
  newAuthorId: string
): Promise<SavedCustomGame | null> {
  loadStore();

  const original = memoryStore.games[gameId];
  if (!original) return null;

  const user = memoryStore.users[newAuthorId];
  const authorName = user ? user.username : "صانع ألعاب";

  const remixedPack: GeneratedSessionPack = JSON.parse(JSON.stringify(original.pack));
  remixedPack.themeTitle = `${remixedPack.themeTitle} (ريمكس ${authorName})`;

  const remixedGame = await saveCustomGame({
    authorId: newAuthorId,
    pack: remixedPack,
    visibility: "PRIVATE"
  });

  return remixedGame;
}

export async function recordGamePlay(gameId: string): Promise<SavedCustomGame | null> {
  loadStore();
  const game = memoryStore.games[gameId];
  if (!game) return null;

  game.playsCount += 1;
  persistStore();
  return game;
}

export async function toggleGameLike(gameId: string): Promise<SavedCustomGame | null> {
  loadStore();
  const game = memoryStore.games[gameId];
  if (!game) return null;

  game.likesCount += 1;
  persistStore();
  return game;
}
