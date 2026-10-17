# Runtime Hardening & Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate 4 runtime bugs (hydration mismatch, mobile refresh session drop, shared screen host action trigger, and voting state bleed), add an 8-second AI timeout fallback, integrate zero-asset synthesized sound effects, and provide unified `/room/[id]` routing.

**Architecture:** `useGameRoom` becomes the single source of truth for `playerId`, returning it alongside `isGeneratingAI` and `sendAction`. Component conditional rendering relies exclusively on server-authoritative state (`gameState.players[playerId]`) to support seamless mobile page refreshes. An in-browser Web Audio API synthesizer generates real-time audio cues without external assets.

**Tech Stack:** Next.js 15, React 19, TypeScript, Web Audio API, Screen Wake Lock API, WebSockets (`ws`).

**Spec:** `docs/superpowers/specs/2026-10-16-boardgame-mvp-design.md`

## Global Constraints

- Full-stack TypeScript with zero type errors (`npx tsc --noEmit`).
- No external MP3 files: audio effects must use Web Audio API oscillators.
- `useGameRoom` must export `playerId` synchronously initialized or safely rendered to prevent hydration mismatch.
- Mobile controller must remain within `100dvh` and handle Screen Wake Lock API gracefully across all mobile browsers.

## Review Focus

1. **Mobile Refresh Retention:** A player refreshing the browser on turn 5 must reconnect with their same `playerId` and immediately see their secret cards and status without hitting the join lobby.
2. **Subsequent Vote Re-initialization:** The second voting card in round 7 must not inherit the candidate selected in round 3.
3. **AI Timeout Fallback:** Triggering `START_AI_GAME` when offline or when Gemini takes > 8s must seamlessly fall back to `getDefaultSessionPack` within 8 seconds without stalling the lobby.
4. **Host Trigger Safety:** The "صمم اللوحة وابدأ السهرة" button on `SharedBoardScreen` must show a loading spinner and disable further clicks while `isGeneratingAI` is true.
5. **Audio Context Autoplay:** Synthesizer must resume `AudioContext` safely upon user interaction without throwing unhandled browser autoplay policy errors.

---

### Task 1: Hardened `useGameRoom.ts` & Sound Effects Engine

**Files:**
- Modify: `src/hooks/useGameRoom.ts`
- Create: `src/utils/soundEffects.ts`
- Test: `tests/hooks/useGameRoom-hardening.test.ts`

**Interfaces:**
- Produces: `useGameRoom` returning `{ playerId, gameState, lastAnimation, isGeneratingAI, errorToast, isConnected, sendAction, clearError }`, and `sfx` with `playDiceRoll()`, `playCoinChime()`, `playDramaAlert()`.

- [ ] **Step 1: Implement `src/utils/soundEffects.ts`**
- [ ] **Step 2: Update `src/hooks/useGameRoom.ts` with `playerId` state, `isGeneratingAI` tracking, and environment-aware host resolution**
- [ ] **Step 3: Verify TypeScript compilation**

---

### Task 2: Server 8-Second AI Timeout Fallback

**Files:**
- Modify: `src/server/standalone.ts`
- Test: `test-server-timeout.ts`

**Interfaces:**
- Consumes: `getDefaultSessionPack`, `generateAISessionPack`
- Produces: `Promise.race` 8s timeout guard on `START_AI_GAME`.

- [ ] **Step 1: Wrap `generateAISessionPack` in `standalone.ts` with `Promise.race` (8000ms)**
- [ ] **Step 2: Verify fallback pack triggers upon timeout or error**

---

### Task 3: Mobile Controller Screen Session & Voting State Hardening

**Files:**
- Modify: `src/components/PlayerControllerScreen.tsx`

**Interfaces:**
- Consumes: `playerId`, `gameState`, `sendAction`
- Produces: Persistent refresh reconnection (`!me`), Screen Wake Lock API integration, and automatic `selectedVoteTarget` reset on phase change.

- [ ] **Step 1: Remove local `hasJoined` condition in favor of `!me`**
- [ ] **Step 2: Add `useEffect` resetting `selectedVoteTarget(null)` when `gameState?.phase !== 'VOTING'`**
- [ ] **Step 3: Add Screen Wake Lock with `visibilitychange` listener**

---

### Task 4: Shared Board Screen Action Binding, Lobby Button & Audio Cues

**Files:**
- Modify: `src/components/SharedBoardScreen.tsx`
- Modify: `src/app/host/[roomId]/page.tsx`
- Create: `src/app/room/[id]/page.tsx`

**Interfaces:**
- Consumes: `sendAction`, `isGeneratingAI`, `sfx`
- Produces: `SharedBoardScreen` with direct `sendAction({ type: "START_AI_GAME" })`, `isGeneratingAI` visual loading states, real-time sound cues (`sfx.playDiceRoll()`, `sfx.playDramaAlert()`, `sfx.playCoinChime()`), and unified `/room/[id]` routing.

- [ ] **Step 1: Update `SharedBoardScreen.tsx` props and audio triggers**
- [ ] **Step 2: Create unified `src/app/room/[id]/page.tsx`**
- [ ] **Step 3: Update `host/[roomId]/page.tsx` and `join/page.tsx`**

---

### Task 5: End-to-End Verification Across All Hardened Components

**Files:**
- Run: `npx tsc --noEmit`
- Run: `npm run build`
- Run: `npx tsx test-server-protocol.ts`

- [ ] **Step 1: Verify full TypeScript types**
- [ ] **Step 2: Verify Next.js production build**
- [ ] **Step 3: Verify protocol tests**
