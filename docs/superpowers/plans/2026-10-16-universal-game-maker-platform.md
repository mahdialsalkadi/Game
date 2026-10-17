# Universal Board & Card Game Platform & Maker (V2.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the board game MVP into an extensible, multi-game Tabletop Platform & Maker Studio where hosts and creators can generate, customize, remix, and play custom board and card games using an AI Co-Designer and a visual web studio.

**Architecture:** Abstract the existing state machine and atomic effect engine into a multi-rule archetype system (`GameRuleEngine` supporting races, economic battles, voting tribunals, and secret-objective card games). Build a `/studio` visual editor and prompt-based AI Co-Designer that exports schema-validated game packs (`GameSessionPack`), paired with the universal multi-screen protocol (Host Shared Board + Mobile Phone Controllers).

**Tech Stack:** Next.js 15, TypeScript 5.7, Node.js `ws`, Zod 3.24, Google Generative AI (`@ai-sdk/google` Gemini 2.5), Framer Motion 11, Tailwind CSS.

**Spec:** [`brain/c4645e6a-4f7f-4222-8b20-25f156ee117a/boardgame-architecture-and-ux-deepdive.md`](file:///root/.gemini/antigravity-cli/brain/c4645e6a-4f7f-4222-8b20-25f156ee117a/boardgame-architecture-and-ux-deepdive.md)

## Global Constraints
- TypeScript strict mode must pass with 0 errors (`npx tsc --noEmit`).
- All existing 150+ regression tests in `test-engine.ts`, `test-room-security.ts`, `test-game-settings.ts`, and `test-mechanics-edge-cases.ts` must pass.
- Production build (`npm run build`) must compile cleanly with 0 errors.
- Game packs must strictly validate against Zod schemas (`GameSessionPackSchema`) before entering runtime.
- Maintain client privacy projection (secret cards masked `[]` on host and opponents).
- Preserves Arabic RTL language and responsive mobile-first controller UX.

## Review Focus
1. **Pack Schema Backward-Compatibility:** Older packs lacking custom win-conditions must default gracefully to `MOST_COINS_AFTER_ROUNDS`.
2. **AI Co-Designer Hallucination Guard:** Pack generator must sanitize and clamp atomic effect values and ensure tile quotas even if the LLM invents invalid attributes.
3. **Multi-Resource Balance:** Custom currency names and stats (e.g. Health vs Coins) must safely prevent division by zero or negative infinite loops.
4. **Studio Live-Test Sandbox:** The `/studio` editor must allow instant single-player sandbox preview without requiring 2-4 real phones connected.
5. **Memory & CPU Safety in Sandbox:** Prevent large pack generation or frequent preview re-renders from causing node container OOM restarts.

---

### Task 1: Generalized Game Archetypes & Multi-Win Condition Rule Engine

**Files:**
- Modify: `src/game/schema.ts`
- Modify: `src/game/effectEngine.ts`
- Modify: `src/game/gameRoom.ts`
- Test: `test-universal-archetypes.ts`

**Interfaces:**
- Consumes: `BoardGameRoomMachine`, `FullRoomState`
- Produces:
  - `WinConditionSchema = z.enum(["MOST_COINS", "FIRST_TO_FINISH", "LAST_SURVIVOR", "TARGET_SCORE"])`
  - `GameArchetypeSchema = z.enum(["BOARD_RACE", "PARTY_ECONOMY", "SOCIAL_DEDUCTION", "DECK_BATTLER"])`
  - `GameSessionPack` with flexible `winCondition`, `targetScore?`, and `playerResources`
  - `BoardGameRoomMachine.checkVictoryCondition(): { isOver: boolean, winner?: PlayerState, reasonAr: string }`

- [ ] **Step 1: Write the failing test for Generalized Archetypes & Win Conditions**

Create `test-universal-archetypes.ts`:
```typescript
// Tests:
// 1. FIRST_TO_FINISH: Player reaching tile 19 or passing start N times triggers immediate victory.
// 2. TARGET_SCORE: Player reaching 500 coins triggers instant economic victory before maxRounds.
// 3. LAST_SURVIVOR: Deducting health/coins to 0 eliminates player; last player standing wins.
// 4. Backward-compatibility: Pack without explicit winCondition defaults to MOST_COINS.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx test-universal-archetypes.ts`
Expected: FAIL (`checkVictoryCondition` or custom winCondition types not implemented)

- [ ] **Step 3: Implement Win Condition & Archetype logic in `schema.ts` and `gameRoom.ts`**

1. In `src/game/schema.ts`:
   - Export `WinConditionEnum`, `GameArchetypeEnum`, and extend `GeneratedSessionPackSchema` with `archetype` and `winCondition`.
2. In `src/game/gameRoom.ts`:
   - In `advanceTurn()`: call `checkVictoryCondition()` after every player move/action.
   - Support `TARGET_SCORE` (instant win when `player.coins >= targetScore`).
   - Support `FIRST_TO_FINISH` (instant win when player completes N laps or lands on goal).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx test-universal-archetypes.ts`
Expected: PASS

- [ ] **Step 5: Verify engine regression**

Run: `npx tsx test-engine.ts`
Expected: PASS (all tests pass)

---

### Task 2: AI Co-Designer Engine (Prompt-to-Complete-Game Pipeline)

**Files:**
- Modify: `src/game/aiPackGenerator.ts`
- Create: `src/app/api/studio/generate/route.ts`
- Test: `test-ai-co-designer.ts`

**Interfaces:**
- Consumes: `generateAISessionPack`, `@ai-sdk/google`
- Produces:
  - `POST /api/studio/generate` accepting `{ prompt: string, archetype?: string, playerNames?: string[] }` -> returns validated `GeneratedSessionPack`.
  - Preset library in `aiPackGenerator.ts`:
    - `CYBERPUNK_HEIST` (Deck Battler / Steal focused)
    - `ANCIENT_SULTANATE` (Trade & Tax / Courtroom drama)
    - `OFFICE_MAYHEM` (Social deduction & hilarious office politics)

- [ ] **Step 1: Write the failing test for AI Co-Designer & Presets**

Create `test-ai-co-designer.ts`:
```typescript
// Tests:
// 1. generateFromPrompt creates valid pack for custom themes ("قرصنة فضاء", "تحقيق بوليسي")
// 2. Fallback presets validate 100% against GeneratedSessionPackSchema
// 3. Sanitizer corrects invalid action targets and maintains mathematical game balance
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx test-ai-co-designer.ts`
Expected: FAIL

- [ ] **Step 3: Implement AI Co-Designer and Preset packs**

1. In `src/game/aiPackGenerator.ts`:
   - Implement `generateGameFromTheme(themePrompt: string, archetype?: GameArchetype)` with specialized prompts.
   - Export 3 built-in crafted game archetypes (`PRESET_PACKS`).
2. In `src/app/api/studio/generate/route.ts`:
   - Add Next.js Route Handler validating input and returning generated or fallback pack JSON.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx test-ai-co-designer.ts`
Expected: PASS

---

### Task 3: Visual Studio Interface (`/studio` Route) - Deck & Board Maker

**Files:**
- Create: `src/app/studio/page.tsx`
- Create: `src/components/studio/BoardEditor.tsx`
- Create: `src/components/studio/CardDeckEditor.tsx`
- Create: `src/components/studio/GamePackExporter.tsx`
- Test: `npx tsc --noEmit` and component rendering tests

**Interfaces:**
- Consumes: `GeneratedSessionPack`, `BoardTile`, `GameCard`
- Produces:
  - Visual interactive board tile editor (change tile types, modify coin values, rename tiles).
  - Visual card editor (edit flavor text, choose atomic effect, set targets).
  - One-click "Playtest Game" button that launches an instant private room with this pack.
  - JSON Export/Import buttons to save/load `.json` pack files.

- [ ] **Step 1: Build the `/studio` layout and tabbed navigation**

In `src/app/studio/page.tsx`:
- Header: Game Title, Archetype badge, AI Co-Designer Prompt Bar ("اوصف سهرتك والذكاء الاصطناعي يبنيها").
- Tabs: 🗺️ لوحة اللعب (Board) | 🃏 كومة البطاقات (Deck) | ⚙️ قواعد الفوز والعملة (Rules & Economy) | 🧪 تجربة سريعة (Playtest).

- [ ] **Step 2: Build `BoardEditor.tsx` and `CardDeckEditor.tsx`**

- Interactive 20-tile track visualizer with color-coded badges and click-to-edit modal.
- Card grid with filter by category (`SECRET_HAND`, `PUBLIC_DRAMA`, `VOTE_CARD`) and live effect builder.

- [ ] **Step 3: Implement Direct Playtest & Export**

- "العب هذه الحزمة الآن" creates room with the customized pack stored in `sessionStorage` or server cache.
- "تصدير الحزمة JSON" downloads the file. "استيراد حزمة" uploads and validates via Zod.

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

---

### Task 4: In-Lobby Game Archetype & Pack Selector

**Files:**
- Modify: `src/components/SharedBoardScreen.tsx`
- Modify: `src/server/standalone.ts`
- Modify: `src/hooks/useGameRoom.ts`
- Test: `test-lobby-pack-selection.ts`

**Interfaces:**
- Consumes: `PRESET_PACKS`, `UPDATE_SETTINGS`
- Produces:
  - Host can select in the lobby:
    1. "ابتكار بالذكاء الاصطناعي" (Custom AI Prompt)
    2. "حزمة استوديو مخصصة" (Imported Studio Pack)
    3. "حزم كلاسيكية جاهزة" (Office Mayhem, Space Pirates, Royal Court)
  - Message `START_CUSTOM_GAME`: `{ type: "START_CUSTOM_GAME", pack: GeneratedSessionPack }`

- [x] **Step 1: Write test for Lobby custom pack launching**

Create `test-lobby-pack-selection.ts`:
- Verifies server accepts `START_CUSTOM_GAME` with validated custom pack and initializes board accordingly.

- [x] **Step 2: Run test to verify it fails**

Run: `npx tsx test-lobby-pack-selection.ts`
Expected: FAIL

- [x] **Step 3: Implement Custom Game startup in `standalone.ts` and `SharedBoardScreen.tsx`**

- Update `standalone.ts` to handle `START_CUSTOM_GAME`.
- Add archetype carousel/selector on host screen during `LOBBY` phase.

- [x] **Step 4: Run test to verify it passes**

Run: `npx tsx test-lobby-pack-selection.ts`
Expected: PASS

---

### Task 5: Live Action Breaking News Ticker & Particle Effects

**Files:**
- Modify: `src/components/SharedBoardScreen.tsx`
- Modify: `src/components/PlayerControllerScreen.tsx`
- Create: `src/components/LiveEventTicker.tsx`
- Test: `npx tsc --noEmit` and visual build check

**Interfaces:**
- Consumes: `lastAnimation`, `AnimationEvent`
- Produces:
  - Breaking news marquee ticker at bottom of Shared Board.
  - Floating emoji reactions with physical trajectories on Shared Board.
  - Golden winner confetti on `GAME_OVER`.

- [x] **Step 1: Create `LiveEventTicker.tsx` with animated event history queue**
- [x] **Step 2: Add floating reaction physics for live emojis on Host Screen**
- [x] **Step 3: Add celebratory confetti particles on Game Over**
- [x] **Step 4: Run TypeScript typecheck (`npx tsc --noEmit`)**

---

### Task 6: Full Regression, Production Dockerfile & Deployment Verification

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Run: Comprehensive test runner (`test-all-suites.ts`) and `npm run build`

**Interfaces:**
- Produces: Single lightweight container running WebSocket server + Next.js app on ports 1999/3000 consuming < 250MB RAM.

- [x] **Step 1: Run comprehensive regression test suite**
- [x] **Step 2: Run production build (`npm run build`)**
- [x] **Step 3: Create optimized multi-stage `Dockerfile`**
- [x] **Step 4: Document one-click deployment instructions (Railway, Fly.io, Render, VPS)**
