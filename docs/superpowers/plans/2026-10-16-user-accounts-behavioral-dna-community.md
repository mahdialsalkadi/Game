# User Accounts, Persistent Behavioral AI DNA & Community Game Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the platform by introducing user accounts with persistent storage (`.data/platform-store.json`), continuous self-learning player behavioral DNA (`PlayerBehavioralDNA`), AI prompt and in-game director adaptation based on behavioral DNA, and a community publishing hub for sharing and remixing games.

**Architecture:**
- Persistence: JSON-backed storage with atomic writes and in-memory cache in `src/game/userStore.ts`.
- Behavioral DNA: `src/game/behavioralDNA.ts` computes dynamic scores (Aggression, Capitalist, Tactical, Social) and title evolutions from real in-game actions.
- Real-time engine integration: `gameRoom.ts` and `standalone.ts` automatically track gameplay actions, update DNA in user accounts, and trigger mid-game adaptive interventions.
- AI Co-Designer: `aiPackGenerator.ts` accepts DNA profiles in prompt building to tailor cards and boards automatically to player personalities.
- Frontend: `UserProfileModal`, AI DNA visual card, Community Hub on `/` and `/host`, and Save Private / Publish Public buttons in `/studio`.

**Tech Stack:** Next.js 15.3 (React 19), TypeScript, Zod, Tailwind CSS, Framer Motion, WebSockets, Node.js `fs/promises`.

---

### Task 1: User Account System, Storage, and API Routes
**Files:**
- Create: `src/game/userStore.ts`
- Create: `src/app/api/auth/route.ts`
- Create: `src/app/api/auth/me/route.ts`
- Create: `src/app/api/community/route.ts`
- Create: `test-user-store.ts`

- [ ] Step 1: Write test `test-user-store.ts` verifying user registration, authentication, private game saving, and public community querying.
- [ ] Step 2: Run test to confirm it fails.
- [ ] Step 3: Implement `src/game/userStore.ts` with file persistence in `.data/platform-store.json` and in-memory caching.
- [ ] Step 4: Implement API routes `/api/auth`, `/api/auth/me`, and `/api/community`.
- [ ] Step 5: Run `test-user-store.ts` to confirm it passes.
- [ ] Step 6: Commit Task 1.

---

### Task 2: Player Behavioral DNA Engine & In-Game Action Tracking
**Files:**
- Create: `src/game/behavioralDNA.ts`
- Modify: `src/game/gameRoom.ts`
- Modify: `src/server/standalone.ts`
- Create: `test-behavioral-dna.ts`

- [ ] Step 1: Write test `test-behavioral-dna.ts` testing DNA score increments for actions and archetype title evolution.
- [ ] Step 2: Run test to confirm it fails.
- [ ] Step 3: Implement `src/game/behavioralDNA.ts` with archetype calculation and update functions.
- [ ] Step 4: Wire action handlers in `gameRoom.ts` and `standalone.ts` (`BUY_PROPERTY`, `CLAIM_OR_ATTACK_TILE`, `PLAY_SECRET_CARD`, `SUBMIT_VOTE`, `GAME_OVER`).
- [ ] Step 5: Run `test-behavioral-dna.ts` to confirm it passes.
- [ ] Step 6: Commit Task 2.

---

### Task 3: AI Prompt Adaptation & Mid-Game Adaptive DNA Director
**Files:**
- Modify: `src/game/aiPackGenerator.ts`
- Modify: `src/game/gameRoom.ts`
- Create: `test-adaptive-ai-director.ts`

- [ ] Step 1: Write test `test-adaptive-ai-director.ts` verifying DNA injection into `buildUserPrompt` and mid-game adaptive reward distribution.
- [ ] Step 2: Run test to confirm it fails.
- [ ] Step 3: Update `aiPackGenerator.ts` to serialize player DNA into prompt.
- [ ] Step 4: Implement Adaptive DNA Director in `gameRoom.ts` at midpoint round.
- [ ] Step 5: Run `test-adaptive-ai-director.ts` to confirm it passes.
- [ ] Step 6: Commit Task 3.

---

### Task 4: Frontend UI (User Profile, AI DNA Card, Community Hub)
**Files:**
- Create: `src/components/profile/UserProfileModal.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/studio/page.tsx`
- Modify: `src/components/SharedBoardScreen.tsx`
- Modify: `src/components/PlayerControllerScreen.tsx`

- [ ] Step 1: Build `UserProfileModal.tsx` with AI DNA card and saved games.
- [ ] Step 2: Add login/profile button to header in `/`, `/studio`, and `PlayerControllerScreen.tsx`.
- [ ] Step 3: Add Save Private and Publish Public in `/studio`.
- [ ] Step 4: Add Community Hub grid on `/` and in `SharedBoardScreen.tsx` lobby.
- [ ] Step 5: Verify TypeScript compiles (`npx tsc --noEmit`).
- [ ] Step 6: Commit Task 4.

---

### Task 5: Comprehensive Verification & Production Build
**Files:**
- Create: `test-accounts-and-dna.ts` (consolidated domain suite)
- Modify: `test-all-suites.ts`

- [ ] Step 1: Create `test-accounts-and-dna.ts`.
- [ ] Step 2: Add suite to `test-all-suites.ts` (13 suites total).
- [ ] Step 3: Run `npx tsx test-all-suites.ts` and confirm 100% pass across all 13 suites.
- [ ] Step 4: Run `npx tsc --noEmit` and confirm 0 errors.
- [ ] Step 5: Run `npm run build` and confirm production build succeeds.
- [ ] Step 6: Commit Task 5 and present final handoff report.
