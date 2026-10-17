# AI-Powered Party Board Game (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete real-time, cross-platform party board game MVP that combines a 20-tile shared screen board game with secret mobile controllers and generative AI prompt-to-board customization.

**Architecture:** The game uses a server-authoritative Atomic Effects System where LLM outputs are strictly constrained via Zod schemas into 8 deterministic action primitives and 6 target selectors. Rooms run as Finite State Machines (LOBBY, TURN_START, RESOLVING_TILE, VOTING, GAME_OVER) managed over WebSockets with mobile-safe reconnection and secret hand sanitization. The frontend provides a 16:9 shared screen ring layout using Framer Motion step hopping alongside a 100dvh one-thumb mobile controller.

**Tech Stack:** Next.js 15 (React 19), TypeScript, Tailwind CSS, Framer Motion, Node.js `ws` WebSocket Server, Zod, Google Gemini 2.5 Flash / Vercel AI SDK, Lucide Icons, qrcode.react.

**Spec:** `docs/superpowers/specs/2026-10-16-boardgame-mvp-design.md`

## Global Constraints

- Full-stack TypeScript with strict mode enabled in `tsconfig.json`.
- Zero raw LLM code execution: all game logic executes via predefined atomic action primitives.
- Mobile controller must fit in `100dvh` with `overflow: hidden` and zero vertical scrolling required for primary actions.
- Board path consists of exactly 20 tiles (Index 0 to 19) in a 7x5 CSS Grid perimeter around a 5x3 Center Stage.
- Balance economics: coin balance can never drop below 0; steal amounts cannot exceed victim's current balance; circular movement formula must safely wrap positive and negative steps: `((pos % 20) + 20) % 20`.
- Private state isolation: `secretHand` cards must never be sent to the shared board screen or to opponent players.

## Review Focus

1. **Negative Coin Underflow:** A player with 10 coins hit with a -50 penalty or theft must stay at exactly 0 coins without going negative or awarding unowned coins to a thief.
2. **Circular Modulo Boundary Inversion:** A player at index 1 stepping back 3 spaces (`-3`) must cleanly land on index 18, and stepping forward past index 19 must award the +100 start bonus exactly once.
3. **Private Hand Leakage:** Inspecting the WebSocket network payload on the host screen or opponent phone must show `secretHand: []` and only `secretHandCount: number`.
4. **Voting Disconnect Deadlock:** If a player disconnects during a 15s voting window, the room must either tally available connected votes or cleanly resolve at timeout without freezing the room machine.
5. **LLM Schema Hallucination Fallback:** When Gemini is unavailable, offline, or returns a malformed response, the system must transparently fall back to the pre-balanced default session pack without crashing.

---

### Task 1: Core Game Schemas & Enums

**Files:**
- Create: `src/game/schema.ts`
- Test: `tests/game/schema.test.ts`

**Interfaces:**
- Produces: `TileTypeEnum`, `ActionTypeEnum`, `TargetTypeEnum`, `AtomicEffectSchema`, `GameCardSchema`, `BoardTileSchema`, `GeneratedSessionPackSchema`, and corresponding TypeScript types `TileType`, `ActionType`, `TargetType`, `AtomicEffect`, `GameCard`, `BoardTile`, `GeneratedSessionPack`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/game/schema.test.ts
import { describe, it, expect } from "vitest";
import {
  TileTypeEnum,
  ActionTypeEnum,
  TargetTypeEnum,
  AtomicEffectSchema,
  GameCardSchema,
  BoardTileSchema,
  GeneratedSessionPackSchema
} from "../../src/game/schema";

describe("Game Schema Definitions", () => {
  it("validates valid atomic effects", () => {
    const validEffect = {
      actionType: "MODIFY_COINS",
      targetType: "SELF",
      value: 50
    };
    expect(AtomicEffectSchema.parse(validEffect)).toEqual(validEffect);
  });

  it("rejects invalid action types", () => {
    expect(() =>
      AtomicEffectSchema.parse({
        actionType: "INVALID_ACTION",
        targetType: "SELF",
        value: 10
      })
    ).toThrow();
  });

  it("validates full session pack with exactly 20 tiles", () => {
    const samplePack = {
      themeTitle: "سهرة التحدي",
      visualStyle: "CARTOON_OFFICE",
      currencyName: "دينار",
      narratorIntro: "مرحباً بكم!",
      tiles: Array.from({ length: 20 }, (_, i) => ({
        index: i,
        tileType: i === 0 ? "START" : "RESOURCE",
        name: `مربع ${i}`,
        description: `وصف ${i}`
      })),
      cardsDeck: Array.from({ length: 18 }, (_, i) => ({
        id: `card_${i + 1}`,
        title: `بطاقة ${i + 1}`,
        category: "PUBLIC_DRAMA",
        flavorText: "حدث كوميدي",
        effects: [{ actionType: "MODIFY_COINS", targetType: "SELF", value: 30 }]
      }))
    };
    expect(GeneratedSessionPackSchema.parse(samplePack)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/game/schema.test.ts`
Expected: FAIL with "Cannot find module '../../src/game/schema'" or parsing failure.

- [ ] **Step 3: Implement schemas in `src/game/schema.ts`**

Define `TileTypeEnum`, `ActionTypeEnum`, `TargetTypeEnum`, `AtomicEffectSchema`, `GameCardSchema`, `BoardTileSchema`, and `GeneratedSessionPackSchema` with strict Zod constraints matching the specification.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/game/schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/schema.ts tests/game/schema.test.ts
git commit -m "feat(game): define Zod schemas and enums for game primitives"
```

---

### Task 2: Atomic Effects Engine & Safeguards

**Files:**
- Create: `src/game/effectEngine.ts`
- Test: `tests/game/effectEngine.test.ts`

**Interfaces:**
- Consumes: `AtomicEffect` from `src/game/schema.ts`
- Produces: `PlayerState`, `GameRoomState`, `ExecutionContext`, `AnimationEvent`, `executeCardEffects()`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/game/effectEngine.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { executeCardEffects, GameRoomState } from "../../src/game/effectEngine";

describe("Atomic Effect Engine", () => {
  let state: GameRoomState;

  beforeEach(() => {
    state = {
      roomId: "TEST",
      boardSize: 20,
      passStartBonus: 100,
      currencyName: "ذهبة",
      players: {
        p1: {
          id: "p1",
          name: "أحمد",
          color: "#EF4444",
          coins: 50,
          position: 18,
          hasShield: false,
          skipNextTurn: false,
          stats: { coinsStolen: 0, timesBetrayedBy: {}, shieldsTriggered: 0 }
        },
        p2: {
          id: "p2",
          name: "خالد",
          color: "#3B82F6",
          coins: 20,
          position: 5,
          hasShield: true,
          skipNextTurn: false,
          stats: { coinsStolen: 0, timesBetrayedBy: {}, shieldsTriggered: 0 }
        }
      }
    };
  });

  it("prevents negative coin balance when deducting more than balance", () => {
    executeCardEffects(
      state,
      [{ actionType: "MODIFY_COINS", targetType: "SELF", value: -100 }],
      { sourcePlayerId: "p1" }
    );
    expect(state.players.p1.coins).toBe(0);
  });

  it("caps stolen coins to the victim's current balance", () => {
    executeCardEffects(
      state,
      [{ actionType: "STEAL_COINS", targetType: "CHOSEN_PLAYER", value: 50 }],
      { sourcePlayerId: "p1", chosenTargetId: "p2" }
    );
    // Khaled has shield! Khaled's shield blocks the steal
    expect(state.players.p2.hasShield).toBe(false);
    expect(state.players.p2.coins).toBe(20);
    expect(state.players.p1.coins).toBe(50);

    // Second steal without shield: Khaled has 20, so Ahmed can only steal 20, not 50
    executeCardEffects(
      state,
      [{ actionType: "STEAL_COINS", targetType: "CHOSEN_PLAYER", value: 50 }],
      { sourcePlayerId: "p1", chosenTargetId: "p2" }
    );
    expect(state.players.p2.coins).toBe(0);
    expect(state.players.p1.coins).toBe(70);
  });

  it("handles circular movement and awards passStartBonus", () => {
    executeCardEffects(
      state,
      [{ actionType: "MOVE_STEPS", targetType: "SELF", value: 4 }],
      { sourcePlayerId: "p1" }
    );
    // Position 18 + 4 = 22 => 2. Passed 20, so coins += 100
    expect(state.players.p1.position).toBe(2);
    expect(state.players.p1.coins).toBe(150);
  });

  it("handles negative movement wrapping correctly", () => {
    state.players.p1.position = 1;
    executeCardEffects(
      state,
      [{ actionType: "MOVE_STEPS", targetType: "SELF", value: -3 }],
      { sourcePlayerId: "p1" }
    );
    // 1 - 3 = -2 => ((-2 % 20) + 20) % 20 = 18
    expect(state.players.p1.position).toBe(18);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/game/effectEngine.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `effectEngine.ts`**

Implement `resolveTargets`, `tryConsumeShield`, and `executeCardEffects` covering all 8 action types, boundary guards, and stats logging.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/game/effectEngine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/effectEngine.ts tests/game/effectEngine.test.ts
git commit -m "feat(game): implement atomic effects execution engine and mathematical safeguards"
```

---

### Task 3: Room Finite State Machine (FSM)

**Files:**
- Create: `src/game/gameRoom.ts`
- Test: `tests/game/gameRoom.test.ts`

**Interfaces:**
- Consumes: `BoardTile`, `GameCard`, `GeneratedSessionPack` from `schema.ts`, `executeCardEffects` from `effectEngine.ts`
- Produces: `BoardGameRoomMachine`, `RoomPhase`, `FullRoomState`, `ExtendedPlayerState`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/game/gameRoom.test.ts
import { describe, it, expect, vi } from "vitest";
import { BoardGameRoomMachine } from "../../src/game/gameRoom";

describe("BoardGameRoomMachine FSM", () => {
  it("manages player join and turn advancement", () => {
    const broadcast = vi.fn();
    const machine = new BoardGameRoomMachine("ROOM1", broadcast);

    expect(machine.state.phase).toBe("LOBBY");
    machine.joinPlayer("p1", "أحمد", "#EF4444");
    machine.joinPlayer("p2", "خالد", "#3B82F6");

    expect(machine.state.turnOrder).toEqual(["p1", "p2"]);
    expect(machine.getActivePlayerId()).toBe("p1");
  });

  it("handles turn skipping when player has skipNextTurn flag", () => {
    const broadcast = vi.fn();
    const machine = new BoardGameRoomMachine("ROOM1", broadcast);
    machine.joinPlayer("p1", "أحمد", "#EF4444");
    machine.joinPlayer("p2", "خالد", "#3B82F6");
    machine.joinPlayer("p3", "سارة", "#22C55E");

    machine.state.phase = "TURN_START";
    machine.state.players.p2.skipNextTurn = true;

    // Simulate advancing turn from p1
    // @ts-ignore - access private advanceTurn for test verification
    machine.advanceTurn();

    // p2 was skipped, active should be p3!
    expect(machine.getActivePlayerId()).toBe("p3");
    expect(machine.state.players.p2.skipNextTurn).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/game/gameRoom.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `BoardGameRoomMachine` in `src/game/gameRoom.ts`**

Implement room machine phases (`LOBBY`, `TURN_START`, `RESOLVING_TILE`, `VOTING`, `GAME_OVER`), dice rolling, card playing, voting timer with early conclusion, and end-game wrapped titles generator.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/game/gameRoom.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/gameRoom.ts tests/game/gameRoom.test.ts
git commit -m "feat(game): implement room finite state machine and turn cycling"
```

---

### Task 4: AI Pack Generator, System Prompt & Post-Sanitization

**Files:**
- Create: `src/game/aiPackGenerator.ts`
- Test: `tests/game/aiPackGenerator.test.ts`

**Interfaces:**
- Consumes: `GeneratedSessionPackSchema`, `GeneratedSessionPack` from `schema.ts`
- Produces: `BOARD_GAME_SYSTEM_PROMPT`, `generateAISessionPack()`, `getDefaultSessionPack()`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/game/aiPackGenerator.test.ts
import { describe, it, expect } from "vitest";
import { getDefaultSessionPack, BOARD_GAME_SYSTEM_PROMPT } from "../../src/game/aiPackGenerator";

describe("AI Pack Generator & Fallback", () => {
  it("provides balanced default session pack with 20 tiles and 18 cards", () => {
    const pack = getDefaultSessionPack(["أحمد", "خالد", "سارة", "فهد"]);
    expect(pack.tiles).toHaveLength(20);
    expect(pack.tiles[0].tileType).toBe("START");
    expect(pack.cardsDeck.length).toBeGreaterThanOrEqual(15);
  });

  it("contains strict anti-clumping and quota rules in system prompt", () => {
    expect(BOARD_GAME_SYSTEM_PROMPT).toContain("20 مربعاً بالضبط");
    expect(BOARD_GAME_SYSTEM_PROMPT).toContain("SECRET_HAND");
    expect(BOARD_GAME_SYSTEM_PROMPT).toContain("PUBLIC_DRAMA");
    expect(BOARD_GAME_SYSTEM_PROMPT).toContain("VOTE_CARD");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/game/aiPackGenerator.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/game/aiPackGenerator.ts`**

Implement `BOARD_GAME_SYSTEM_PROMPT`, `buildUserPrompt`, `sanitizeGeneratedPack`, `generateAISessionPack` with Gemini 2.5 Flash, and `getDefaultSessionPack` for offline environments.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/game/aiPackGenerator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/aiPackGenerator.ts tests/game/aiPackGenerator.test.ts
git commit -m "feat(ai): implement structured session pack generator and fallback deck"
```

---

### Task 5: Real-time Multi-room WebSocket Server

**Files:**
- Create: `src/server/standalone.ts`
- Test: `tests/server/standalone.test.ts`

**Interfaces:**
- Consumes: `BoardGameRoomMachine`, `generateAISessionPack`, `getDefaultSessionPack`
- Produces: Standalone HTTP/WS server on port 1999 handling room lifecycles and sanitized client broadcasts.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/server/standalone.test.ts
import { describe, it, expect } from "vitest";
import http from "http";

describe("Standalone Server Health", () => {
  it("responds with 200 OK on HTTP health check endpoint", async () => {
    const res = await new Promise<{ status: string }>((resolve, reject) => {
      http.get("http://127.0.0.1:1999/", (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(JSON.parse(data)));
      }).on("error", reject);
    });
    expect(res.status).toBe("ok");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/server/standalone.test.ts`
Expected: FAIL (server not running or file missing).

- [ ] **Step 3: Implement `src/server/standalone.ts`**

Set up `http.createServer` and `ws.WebSocketServer` parsing `/party/:roomId` paths, handling reconnects via stable `playerId`, and ensuring `secretHand` is stripped from non-owner connections.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run server &` then `npx vitest run tests/server/standalone.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/standalone.ts tests/server/standalone.test.ts
git commit -m "feat(server): implement multi-room WebSocket server with privacy filtering"
```

---

### Task 6: Client Room Connection Hook & State Sync

**Files:**
- Create: `src/hooks/useGameRoom.ts`
- Test: `tests/hooks/useGameRoom.test.ts`

**Interfaces:**
- Produces: `useGameRoom(roomId, role, partyHost)` returning `{ gameState, lastAnimation, errorToast, isConnected, sendAction, clearError }`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/hooks/useGameRoom.test.ts
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameRoom } from "../../src/hooks/useGameRoom";

describe("useGameRoom Hook", () => {
  it("initializes with default disconnected state and stable player ID", () => {
    const { result } = renderHook(() => useGameRoom("TEST_ROOM", "PLAYER"));
    expect(result.current.gameState).toBeNull();
    expect(typeof result.current.sendAction).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/hooks/useGameRoom.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/hooks/useGameRoom.ts`**

Build `useGameRoom` supporting automatic reconnection, localStorage `playerId` persistence, dynamic hostname resolution (`${window.location.hostname}:1999`), and action messaging.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/hooks/useGameRoom.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGameRoom.ts tests/hooks/useGameRoom.test.ts
git commit -m "feat(client): implement useGameRoom hook with automatic reconnection"
```

---

### Task 7: Shared Board Screen UI & Animation Pipeline

**Files:**
- Create: `src/components/SharedBoardScreen.tsx`
- Test: `tests/components/SharedBoardScreen.test.tsx`

**Interfaces:**
- Consumes: `FullRoomState`, `BoardTile`, `GameCard`
- Produces: `SharedBoardScreen` component rendering 7x5 perimeter grid, center stage dice/card popups, and bottom player docks.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/SharedBoardScreen.test.tsx
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SharedBoardScreen from "../../src/components/SharedBoardScreen";

describe("SharedBoardScreen", () => {
  it("renders 20 tiles in perimeter grid", () => {
    const mockState: any = {
      roomId: "ABCD",
      currentRound: 1,
      maxRounds: 10,
      boardSize: 20,
      currencyName: "ذهبة",
      turnOrder: ["p1"],
      currentTurnIndex: 0,
      players: {
        p1: { id: "p1", name: "أحمد", color: "#EF4444", coins: 150, position: 0 }
      },
      tiles: Array.from({ length: 20 }, (_, i) => ({
        index: i,
        tileType: i === 0 ? "START" : "RESOURCE",
        name: `خانة ${i}`
      }))
    };

    render(<SharedBoardScreen gameState={mockState} lastAnimation={null} joinUrl="http://test/join" />);
    expect(screen.getByText("ABCD")).toBeDefined();
    expect(screen.getByText("خانة 0")).toBeDefined();
    expect(screen.getByText("خانة 19")).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/SharedBoardScreen.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `src/components/SharedBoardScreen.tsx`**

Implement 7x5 CSS Grid coordinate mapping `getTileGridPosition`, Framer Motion tile-by-tile hopping with `visualPositions`, animated center stage modal, and HUD.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/SharedBoardScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/SharedBoardScreen.tsx tests/components/SharedBoardScreen.test.tsx
git commit -m "feat(ui): implement shared board screen with 7x5 grid and hopping animation"
```

---

### Task 8: Mobile Controller Screen & Secret Hand UI

**Files:**
- Create: `src/components/PlayerControllerScreen.tsx`
- Test: `tests/components/PlayerControllerScreen.test.tsx`

**Interfaces:**
- Consumes: `FullRoomState`, `GameCard`
- Produces: `PlayerControllerScreen` component with one-thumb 100dvh layout, lobby registration, active turn roll/play actions, secret hand carousel, and voting prompt.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/PlayerControllerScreen.test.tsx
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PlayerControllerScreen from "../../src/components/PlayerControllerScreen";

describe("PlayerControllerScreen", () => {
  it("renders lobby join form when player has not joined yet", () => {
    const mockState: any = {
      phase: "LOBBY",
      players: {},
      turnOrder: []
    };

    render(
      <PlayerControllerScreen
        gameState={mockState}
        lastAnimation={null}
        errorToast={null}
        sendAction={() => {}}
        playerId="unregistered"
      />
    );
    expect(screen.getByPlaceholderText("اسمك في اللعبة")).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/PlayerControllerScreen.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `src/components/PlayerControllerScreen.tsx`**

Implement the 4 responsive states (Lobby Join, Active Turn with vibration and huge roll button, Spectator soundboard, and Voting modal).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/PlayerControllerScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/PlayerControllerScreen.tsx tests/components/PlayerControllerScreen.test.tsx
git commit -m "feat(ui): implement mobile player controller with secret hand and voting"
```

---

### Task 9: App Pages, QR Code Join Flow & Navigation

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/app/host/[roomId]/page.tsx`
- Create: `src/app/join/page.tsx`
- Create: `src/app/layout.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/app/navigation.test.tsx
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "../../src/app/page";

describe("HomePage Routing", () => {
  it("renders room creation and join inputs", () => {
    render(<HomePage />);
    expect(screen.getByText("🏠 أنشئ غرفة جديدة")).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/app/navigation.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement pages**

Implement `src/app/page.tsx` with 4-letter room code generation, `src/app/host/[roomId]/page.tsx` with QR code display during lobby and board during play, and `src/app/join/page.tsx` with room query param extraction.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/app/navigation.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/ tests/app/
git commit -m "feat(app): configure Next.js pages and QR code join routing"
```

---

### Task 10: End-to-End Test Suite & Verification

**Files:**
- Create: `tests/e2e/game-flow.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write full game loop test**

```typescript
// tests/e2e/game-flow.test.ts
import { describe, it, expect } from "vitest";
import { BoardGameRoomMachine } from "../../src/game/gameRoom";
import { getDefaultSessionPack } from "../../src/game/aiPackGenerator";

describe("Complete Game Loop", () => {
  it("plays a full round with 2 players and finishes game", () => {
    const events: any[] = [];
    const machine = new BoardGameRoomMachine("E2E_ROOM", (type, payload) => {
      events.push({ type, payload });
    });

    // 1. Join players
    machine.joinPlayer("p1", "أحمد", "#EF4444");
    machine.joinPlayer("p2", "خالد", "#3B82F6");

    // 2. Start game with default pack
    const pack = getDefaultSessionPack(["أحمد", "خالد"]);
    machine.startGameWithAIPack(pack);
    expect(machine.state.phase).toBe("TURN_START");

    // 3. Roll dice for p1
    machine.rollDiceAndMove("p1");
    // Turn advances to p2
    expect(machine.getActivePlayerId()).toBe("p2");

    // 4. Roll dice for p2
    machine.rollDiceAndMove("p2");
    // Round increments
    expect(machine.state.currentRound).toBe(2);
  });
});
```

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: All unit, component, and E2E tests pass.

- [ ] **Step 3: Verify TypeScript build**

Run: `npx tsc --noEmit`
Expected: Code 0, zero errors.

- [ ] **Step 4: Verify Next.js build**

Run: `npm run build`
Expected: Successful production build.

- [ ] **Step 5: Final Commit**

```bash
git add tests/ package.json
git commit -m "test(e2e): verify end-to-end game flow and production build integrity"
```
