# Phase 2 (V1.5) Implementation Plan: Technical Hardening, Room Security & Dynamic Settings

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Phase 2 / V1.5 to eliminate all architectural debt identified in the technical audit: server-authoritative collision-free room codes, host authentication tokens, customizable game settings (rounds/coins) in the lobby, fair voting tie-breaking, secret hand overflow handling, and mobile audio synthesizer activation.

**Architecture:** Add a server-side room creation endpoint with cryptographic host tokens to prevent session hijacking and code collisions. Update `BoardGameRoomMachine` to accept dynamic `GameSettings` and handle voting ties and hand overflows with explicit events. Wire host lobby settings and mobile audio opt-in, verified with comprehensive automated test scripts and production build validation.

**Tech Stack:** Next.js 15, TypeScript 5.7, Node.js `ws`, Zod 3.24, Web Audio API, Framer Motion 11.

**Spec:** [`brain/c4645e6a-4f7f-4222-8b20-25f156ee117a/boardgame-mvp-technical-audit.md`](file:///root/.gemini/antigravity-cli/brain/c4645e6a-4f7f-4222-8b20-25f156ee117a/boardgame-mvp-technical-audit.md)

## Global Constraints
- TypeScript strict mode must pass with 0 errors (`npx tsc --noEmit`).
- All existing tests in `test-engine.ts`, `test-ai-pack.ts`, and `test-server-protocol.ts` must continue passing 100%.
- Next.js production build (`npm run build`) must compile cleanly with 0 type or hydration errors.
- WebSocket port remains 1999, Next.js port remains 3000.
- Preserves Arabic RTL language and existing dark theme design tokens.

## Review Focus
1. **Unauthorized Host Control:** A client connecting with `?role=HOST` without a valid `hostToken` must be rejected or downgraded to `SPECTATOR`.
2. **Room Code Collision:** `POST /api/rooms` must guarantee a unique 4-character code not currently active in `standalone.ts`.
3. **Voting Ties:** When two or more candidates tie with equal highest votes, the engine must select fairly and emit a clear narrative announcement.
4. **Secret Hand Overflow:** When a player with 4 cards lands on `SECRET_CARD`, the engine must notify the player with an event rather than failing silently.
5. **Custom Settings Clamping:** Custom `maxRounds` must be clamped between 3 and 30, and `startingCoins` between 50 and 500.

---

### Task 1: Server-Authoritative Room Creation API & Host Authentication Token

**Files:**
- Create: `src/app/api/rooms/route.ts`
- Modify: `src/server/standalone.ts`
- Modify: `src/hooks/useGameRoom.ts`
- Modify: `src/app/page.tsx`
- Test: `test-room-security.ts`

**Interfaces:**
- Consumes: `rooms: Map<string, RoomInstance>` in `standalone.ts`
- Produces:
  - `POST /api/rooms` -> `{ success: true, roomId: string, hostToken: string }`
  - `standalone.ts` accepts query param `hostToken` and validates it against `room.hostToken` for `role=HOST`.

- [ ] **Step 1: Write the failing test for Room Creation & Host Token**

Create `test-room-security.ts`:
```typescript
import WebSocket from "ws";
import http from "http";

// Tests:
// 1. POST /api/rooms creates room and returns roomId + hostToken
// 2. Connecting as HOST with valid hostToken is accepted
// 3. Connecting as HOST with invalid/missing hostToken is downgraded or rejected with ACTION_REJECTED
// 4. Duplicate room creation does not collide
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx test-room-security.ts`
Expected: FAIL (route /api/rooms does not exist or hostToken not validated)

- [ ] **Step 3: Implement Host Token validation in `src/server/standalone.ts` and `POST /api/rooms` in `src/app/api/rooms/route.ts`**

1. In `src/server/standalone.ts`:
   - Add `hostToken: string` to `RoomInstance`.
   - In `getOrCreateRoom(roomId, incomingHostToken?)`: assign or verify `hostToken`.
   - In connection handler: if `role === "HOST"`:
     - If room has no `hostToken` yet, set `room.hostToken = incomingHostToken || randomToken`.
     - If room has `hostToken`, verify `incomingHostToken === room.hostToken`. If mismatch, reject or set role to `SPECTATOR`.
2. In `src/app/api/rooms/route.ts`:
   - Implement `POST` handler generating 4-character uppercase code and random 16-character `hostToken`.
3. In `src/app/page.tsx`:
   - Call `POST /api/rooms` on "أنشئ غرفة جديدة", save `hostToken` in `sessionStorage`/`localStorage`, and navigate to `/host/${code}`.
4. In `src/hooks/useGameRoom.ts`:
   - If `role === "HOST"`, read `hostToken` from storage and append `&hostToken=${token}` to `wsUrl`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx test-room-security.ts`
Expected: PASS (all checks green)

- [ ] **Step 5: Verify server regression**

Run: `npx tsx test-server-protocol.ts`
Expected: PASS (54/54 tests)

---

### Task 2: Configurable Game Settings in Lobby & Engine (Max Rounds & Starting Coins)

**Files:**
- Modify: `src/game/schema.ts`
- Modify: `src/game/gameRoom.ts`
- Modify: `src/server/standalone.ts`
- Modify: `src/components/SharedBoardScreen.tsx`
- Test: `test-game-settings.ts`

**Interfaces:**
- Consumes: `AtomicEffectSchema`, `FullRoomState`
- Produces:
  - `GameSettingsSchema = z.object({ maxRounds: z.number().int().min(3).max(30).default(10), startingCoins: z.number().int().min(50).max(500).default(150), passStartBonus: z.number().int().min(50).max(300).default(100) })`
  - `BoardGameRoomMachine.constructor(roomId, broadcastCallback, settings?: Partial<GameSettings>)`
  - `BoardGameRoomMachine.updateSettings(settings: Partial<GameSettings>): void`
  - Message `UPDATE_SETTINGS`: `{ type: "UPDATE_SETTINGS", settings: Partial<GameSettings> }`

- [ ] **Step 1: Write the failing test for Game Settings**

Create `test-game-settings.ts`:
```typescript
import { BoardGameRoomMachine } from "./src/game/gameRoom";

// Tests:
// 1. Initialized with custom maxRounds (5) and startingCoins (200)
// 2. Player joins with 200 coins instead of 150
// 3. Game ends after round 5 instead of 10
// 4. Host updates settings during LOBBY phase
// 5. Settings update rejected if game already started
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx test-game-settings.ts`
Expected: FAIL (`updateSettings` or dynamic `settings` not defined)

- [ ] **Step 3: Implement Game Settings in `schema.ts`, `gameRoom.ts`, `standalone.ts`, and `SharedBoardScreen.tsx`**

1. In `src/game/schema.ts`:
   - Define and export `GameSettingsSchema` and `type GameSettings`.
2. In `src/game/gameRoom.ts`:
   - Store `settings: GameSettings` in `FullRoomState`.
   - Apply `settings.startingCoins` in `joinPlayer`.
   - Apply `settings.maxRounds` in `advanceTurn`.
   - Implement `public updateSettings(newSettings: Partial<GameSettings>): void`.
3. In `src/server/standalone.ts`:
   - Handle client message `UPDATE_SETTINGS`: verify sender is `HOST`, call `room.machine.updateSettings(msg.settings)`.
4. In `src/components/SharedBoardScreen.tsx`:
   - Add lobby controls for Host to choose 5, 10, or 15 rounds, and 100, 150, or 200 coins.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx test-game-settings.ts`
Expected: PASS

- [ ] **Step 5: Verify engine regression**

Run: `npx tsx test-engine.ts`
Expected: PASS (58/58 tests)

---

### Task 3: Fair Tie-Breaking & Secret Hand Overflow Handling

**Files:**
- Modify: `src/game/gameRoom.ts`
- Modify: `src/game/effectEngine.ts`
- Test: `test-mechanics-edge-cases.ts`

**Interfaces:**
- Consumes: `pendingVote`, `ExtendedPlayerState`
- Produces:
  - `VOTE_SESSION_ENDED` event with `isTie: boolean, tiedCandidates?: string[], loserId: string`
  - `SECRET_CARD_DRAWN` or `SECRET_HAND_FULL` event with `playerId, messageAr`

- [ ] **Step 1: Write the failing test for edge cases**

Create `test-mechanics-edge-cases.ts`:
```typescript
// Tests:
// 1. 2 players receive 1 vote each in voting -> engine detects tie, selects fairly, and announces tie in narrative.
// 2. Player with 4 secret cards lands on SECRET_CARD -> engine does not push 5th card, emits SECRET_HAND_FULL event.
// 3. Player with <4 cards lands on SECRET_CARD -> normal SECRET_CARD_DRAWN emitted.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx test-mechanics-edge-cases.ts`
Expected: FAIL

- [ ] **Step 3: Implement Tie-Breaking & Hand Overflow in `gameRoom.ts`**

1. In `finalizeVoteSession()`:
   - Identify all candidates matching `maxVotes`.
   - If multiple candidates tie:
     - Mark `isTie = true`.
     - Pick a random candidate from the tied group using pseudo-random seed.
     - Include tie context in `VOTE_SESSION_ENDED` broadcast: `تعادل في الأصوات! وقعت القرعة على ${loser.name}`.
2. In `resolveLandedTile()` for `SECRET_CARD`:
   - If `player.secretHand.length >= 4`:
     - Broadcast `SECRET_HAND_FULL`: `يد ${player.name} ممتلئة بالبطاقات السرية (الحد الأقصى 4)!`.
   - Else:
     - Normal draw and broadcast `SECRET_CARD_DRAWN`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx test-mechanics-edge-cases.ts`
Expected: PASS

- [ ] **Step 5: Verify all engine tests**

Run: `npx tsx test-engine.ts`
Expected: PASS (58/58 tests)

---

### Task 4: Mobile Audio Synthesizer Integration & Haptic Polish

**Files:**
- Modify: `src/components/PlayerControllerScreen.tsx`
- Modify: `src/utils/soundEffects.ts`
- Test: `tsc --noEmit` and browser component inspection

**Interfaces:**
- Consumes: `sfx` from `src/utils/soundEffects.ts`
- Produces: Mobile audio feedback on dice roll, card play, and turn notification.

- [ ] **Step 1: Ensure safe AudioContext unlocking on touch in `src/utils/soundEffects.ts`**

Verify `ensureContext()` resumes on `touchstart`/`pointerdown` events on mobile browsers.

- [ ] **Step 2: Wire audio triggers in `src/components/PlayerControllerScreen.tsx`**

1. When player presses "انضم للغرفة" or taps screen: unlock audio.
2. When player rolls dice: trigger `sfx.playDiceRoll()`.
3. When player's turn arrives: trigger haptic pulse + subtle chime.
4. When error toast appears: trigger alert tone.

- [ ] **Step 3: Run TypeScript typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

---

### Task 5: Full Regression Testing & Production Build Verification

**Files:**
- Run: All test suites and Next.js build

- [ ] **Step 1: Run comprehensive test suite**

Run commands sequentially:
```bash
npx tsx test-engine.ts
npx tsx test-ai-pack.ts
npx tsx test-server-protocol.ts
npx tsx test-room-security.ts
npx tsx test-game-settings.ts
npx tsx test-mechanics-edge-cases.ts
```
Expected: 100% PASS on all suites.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Exit code 0, all routes static/dynamic compiled cleanly.

- [ ] **Step 3: Verify running background servers**

Confirm `task-344` (standalone server) and `task-248` (Next.js server) are healthy and responding.
