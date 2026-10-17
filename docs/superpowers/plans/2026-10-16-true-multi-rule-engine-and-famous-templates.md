# True Multi-Rule Engine & Famous Board Game Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the board game platform into a true multi-rule engine supporting real gameplay mechanics (Monopoly buy/rent property ownership, Risk territory conquest without dice, Uno card shedding, Mafia/Spy social discussion, Snakes & Ladders jumps), with 6 world-famous presets, an adaptive UI, and an in-studio AI Co-Pilot remixer.

**Architecture:** Extend Zod schemas with `GameRulesConfigSchema` (`turnMechanism`, `cardVisibility`, `ownershipSystem`) and tile property fields (`price`, `rent`, `ownerId`, `armies`, `jumpToIndex`). Update `BoardGameRoomMachine` to execute real property purchases, automated rent collection, territory commands, and instant jumps. Adapt `SharedBoardScreen` and `PlayerControllerScreen` to dynamically render distinct UI modes based on rules. Integrate AI Co-Pilot in `/studio` for direct prompt-based pack remixing and one-click play launching.

**Tech Stack:** Next.js 15.3 (React 19), TypeScript, Zod, Tailwind CSS, Framer Motion, WebSocket (`ws`), Vercel AI SDK (`@ai-sdk/google`).

**Spec:** User prompt for Phase 1: True Multi-Rule Engine & Famous Board Game Templates.

## Global Constraints
- Preserve 100% Arabic RTL layout and typography.
- Retain backward compatibility: packs without explicit `rulesConfig` default to `turnMechanism: "DICE_AND_MOVE"`, `cardVisibility: "SECRET_PHONE_ONLY"`, `ownershipSystem: "NONE"`.
- Zero-regression policy: existing 9 test suites must continue passing.
- Keep in-session direct execution without heavy background dev server processes to respect container RAM constraints.

## Review Focus
1. Property purchase (`BUY_PROPERTY`) edge case: insufficient funds or property already owned by another player.
2. Rent collection (`RENT_PAID`) edge case: victim has fewer coins than the rent amount (must clamp at 0 and transfer actual available coins).
3. Territory attack edge case: attacking own territory or invalid tile index.
4. Card visibility privacy: `OPEN_PUBLIC_CARDS` must send cards to all connections, whereas `SECRET_PHONE_ONLY` must strictly sanitize and hide opponent cards from opponents and host.
5. Instant jump (`jumpToIndex`): circular loop prevention (jump destination must not immediately re-trigger another jump).

---

### Task 1: Expand `src/game/schema.ts` with `GameRulesConfigSchema` & Tile Fields

**Files:**
- Modify: `src/game/schema.ts`
- Modify: `src/components/PlayerControllerScreen.tsx` (remove mandatory `promptIdea` in lobby)
- Create: `test-multi-genre-schema.ts`

**Interfaces:**
- Produces:
  - `TurnMechanismEnum`: `"DICE_AND_MOVE" | "TERRITORY_COMMAND" | "CARD_PLAY_ONLY" | "SOCIAL_DISCUSSION_VOTE"`
  - `CardVisibilityEnum`: `"SECRET_PHONE_ONLY" | "OPEN_PUBLIC_CARDS" | "NO_HAND_CARDS"`
  - `OwnershipSystemEnum`: `"NONE" | "BUY_AND_RENT" | "CONQUER_REGIONS"`
  - `GameRulesConfigSchema`: object with `turnMechanism`, `cardVisibility`, `ownershipSystem`
  - Updated `BoardTileSchema`: adds `price?: number`, `rent?: number`, `ownerId?: string | null`, `armies?: number`, `jumpToIndex?: number`
  - Updated `GeneratedSessionPackSchema`: adds `rulesConfig: GameRulesConfigSchema.default(...)`

- [ ] **Step 1: Write failing test in `test-multi-genre-schema.ts`**

```typescript
import {
  GameRulesConfigSchema,
  TurnMechanismEnum,
  CardVisibilityEnum,
  OwnershipSystemEnum,
  BoardTileSchema,
  GeneratedSessionPackSchema
} from "./src/game/schema";

// Test schema parses new fields and defaults
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx test-multi-genre-schema.ts`
Expected: FAIL (types not defined yet)

- [ ] **Step 3: Implement new enums and schemas in `src/game/schema.ts`**

Add `TurnMechanismEnum`, `CardVisibilityEnum`, `OwnershipSystemEnum`, `GameRulesConfigSchema`, update `BoardTileSchema` and `GeneratedSessionPackSchema`. In `PlayerControllerScreen.tsx`, make `promptIdea` completely optional and simplify the lobby join form to name and color.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx test-multi-genre-schema.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/schema.ts src/components/PlayerControllerScreen.tsx test-multi-genre-schema.ts
git commit -m "feat(schema): add GameRulesConfigSchema, tile property fields, and simplify lobby join"
```

---

### Task 2: Implement Real Multi-Rule Mechanics in `src/game/gameRoom.ts` & `standalone.ts`

**Files:**
- Modify: `src/game/gameRoom.ts`
- Modify: `src/server/standalone.ts`
- Create: `test-multi-genre.ts`

**Interfaces:**
- Consumes: `GameRulesConfigSchema`, `rulesConfig`, `BoardTile`
- Produces:
  - New Machine Actions:
    - `buyProperty(playerId: string, tileIndex?: number): void`
    - `claimOrAttackTile(playerId: string, targetTileIndex: number): void`
  - Automated Rent Collection: In `resolveLandedTile`, if `rulesConfig.ownershipSystem === "BUY_AND_RENT"`, tile is owned by another player (`tile.ownerId && tile.ownerId !== player.id`), automatically transfer `tile.rent` with event `RENT_PAID`.
  - Snakes & Ladders: If tile has `jumpToIndex !== undefined`, immediately move player to `jumpToIndex` with event `LADDER_OR_SNAKE_JUMP`.
  - Non-dice turn mechanisms: In `TERRITORY_COMMAND`, `CARD_PLAY_ONLY`, and `SOCIAL_DISCUSSION_VOTE`, advance turns upon action completion without requiring dice rolls.
  - Privacy filter in `standalone.ts`: If `rulesConfig.cardVisibility === "OPEN_PUBLIC_CARDS"`, send all cards openly; otherwise filter.

- [ ] **Step 1: Write comprehensive integration test `test-multi-genre.ts`**

Tests:
1. Monopoly buy property and automatic rent deduction.
2. Territory command claiming and attacking without dice.
3. Card play only advancing turn.
4. Snakes & ladders jump tile.
5. Card visibility public vs secret.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx test-multi-genre.ts`
Expected: FAIL

- [ ] **Step 3: Implement mechanics in `gameRoom.ts` and `standalone.ts`**

Implement `buyProperty`, `claimOrAttackTile`, rent triggers in `resolveLandedTile`, jump handling, and update `sendSanitizedState` to check `cardVisibility`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx test-multi-genre.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/gameRoom.ts src/server/standalone.ts test-multi-genre.ts
git commit -m "feat(engine): implement buy-and-rent, territory conquest, instant jumps, and public cards"
```

---

### Task 3: Build 6 World-Famous Game Presets in `src/game/aiPackGenerator.ts`

**Files:**
- Modify: `src/game/aiPackGenerator.ts`
- Create: `test-famous-presets.ts`

**Interfaces:**
- Produces:
  - `PRESET_PACKS.MONOPOLY_CLASSIC`: `turnMechanism: "DICE_AND_MOVE"`, `ownershipSystem: "BUY_AND_RENT"`, `cardVisibility: "SECRET_PHONE_ONLY"`. Real street tiles with prices & rents, taxes, and community chest cards.
  - `PRESET_PACKS.WORLD_CONQUEST_RISK`: `turnMechanism: "TERRITORY_COMMAND"`, `ownershipSystem: "CONQUER_REGIONS"`, `cardVisibility: "NO_HAND_CARDS"`. 20 strategic countries with defense armies.
  - `PRESET_PACKS.TACTICAL_CARDS_UNO`: `turnMechanism: "CARD_PLAY_ONLY"`, `ownershipSystem: "NONE"`, `cardVisibility: "SECRET_PHONE_ONLY"`. Fast card shedding, reverse, skips, and steals.
  - `PRESET_PACKS.SOCIAL_MAFIA_SPY`: `turnMechanism: "SOCIAL_DISCUSSION_VOTE"`, `ownershipSystem: "NONE"`, `cardVisibility: "OPEN_PUBLIC_CARDS"`. Spy questions and elimination voting.
  - `PRESET_PACKS.SNAKES_AND_LADDERS_RPG`: `turnMechanism: "DICE_AND_MOVE"`, `winCondition: "FIRST_TO_FINISH"`. Tiles with positive and negative `jumpToIndex`.
  - `PRESET_PACKS.SULTANATE_MERCHANTS`: Historic bazaar trading and trade routes with buy & rent.
  - Export `FAMOUS_GAME_PRESETS` and update `getMatchingPresetPack`.

- [ ] **Step 1: Write test `test-famous-presets.ts`**

Verifies all 6 presets strictly adhere to `GeneratedSessionPackSchema`, each has 20 tiles, valid cards, and their respective `rulesConfig`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx test-famous-presets.ts`
Expected: FAIL

- [ ] **Step 3: Implement presets in `src/game/aiPackGenerator.ts`**

Add all 6 presets with complete 20 tiles (including prices, rents, jumpToIndex) and decks.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx test-famous-presets.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/aiPackGenerator.ts test-famous-presets.ts
git commit -m "feat(presets): add 6 world-famous game presets (Monopoly, Risk, Uno, Mafia, Snakes & Ladders, Sultanate)"
```

---

### Task 4: Adapt Host TV Board and Mobile Controller (`SharedBoardScreen.tsx` & `PlayerControllerScreen.tsx`)

**Files:**
- Modify: `src/components/SharedBoardScreen.tsx`
- Modify: `src/components/PlayerControllerScreen.tsx`

**Interfaces:**
- Consumes: `gameState.rulesConfig`, `BoardTile.ownerId`, `BoardTile.price`, `BoardTile.rent`
- Produces:
  - Mobile Controller:
    - Shows "شراء العقار 🏠" when landing on purchasable property.
    - Shows territory conquest command selector when `turnMechanism === "TERRITORY_COMMAND"`.
    - Hides dice when not in `DICE_AND_MOVE`.
    - Shows discussion / vote trigger in `SOCIAL_DISCUSSION_VOTE`.
    - Hides secret hand section cleanly if `cardVisibility === "NO_HAND_CARDS"`.
  - Host TV Board:
    - Renders ownership badges and owner player color on tiles.
    - Displays prices/rents on property tiles.
    - Displays jump ladder/snake indicator on tiles with `jumpToIndex`.
    - Lobby grid showcases all 6 famous presets with "العبها الآن" and "عدّل في الاستوديو (Remix)".

- [ ] **Step 1: Update `PlayerControllerScreen.tsx` to dynamically switch control zones**
- [ ] **Step 2: Update `SharedBoardScreen.tsx` with tile ownership indicators and 6-preset lobby grid**
- [ ] **Step 3: Run TypeScript check (`npx tsc --noEmit`)**
- [ ] **Step 4: Commit**

```bash
git add src/components/SharedBoardScreen.tsx src/components/PlayerControllerScreen.tsx
git commit -m "feat(ui): adapt TV board and mobile controller to active game rules and display ownership"
```

---

### Task 5: Upgrade Visual Studio (`/studio`) with AI Co-Pilot Remix Engine

**Files:**
- Modify: `src/app/studio/page.tsx`
- Modify: `src/components/studio/presets.ts`
- Modify: `src/components/studio/BoardEditor.tsx`
- Modify: `src/components/studio/GamePackExporter.tsx`
- Modify: `src/app/api/studio/generate/route.ts`

**Interfaces:**
- Produces:
  - Preset Loader: Select any of the 6 famous games as a base template to Remix.
  - Rules Config Editor: Edit `turnMechanism`, `ownershipSystem`, `cardVisibility`, `winCondition`, `targetScore`.
  - Tile Editor Enhancement: Edit `price`, `rent`, `jumpToIndex` on individual tiles.
  - AI Co-Pilot Assistant: Interactive text input where users type remix instructions (e.g., "حول هذه اللعبة إلى صراع قبائل في الجاهلية" or "ارفع الإيجارات وأضف بطاقات سرقة"), sending current pack + prompt to `/api/studio/generate` to return remixed pack in-place.
  - "احفظ والعب فوراً في غرفة جديدة": creates a room and launches the customized game immediately.

- [ ] **Step 1: Update `/api/studio/generate/route.ts` to support remixing existing packs**
- [ ] **Step 2: Update `presets.ts` to export all 6 famous templates**
- [ ] **Step 3: Add Rules Config tab and tile property inputs in Studio components**
- [ ] **Step 4: Add AI Co-Pilot assistant and One-Click Play in `studio/page.tsx`**
- [ ] **Step 5: Run TypeScript check (`npx tsc --noEmit`)**
- [ ] **Step 6: Commit**

```bash
git add src/app/studio/page.tsx src/components/studio/ src/app/api/studio/generate/route.ts
git commit -m "feat(studio): add 6 preset remix loader, rules config editor, AI co-pilot, and one-click play launch"
```

---

### Task 6: Comprehensive Regression & Production Build Verification

**Files:**
- Modify: `test-all-suites.ts`
- Run: Full suite run & Next.js production build

**Interfaces:**
- Produces: 100% green test suites and zero-error production build.

- [ ] **Step 1: Add new test suites to `test-all-suites.ts`**
- [ ] **Step 2: Run `npx tsx test-all-suites.ts`**
- [ ] **Step 3: Run `npx tsc --noEmit`**
- [ ] **Step 4: Run `npm run build`**
- [ ] **Step 5: Commit and hand off to user**
