# AI-Powered Party Board Game (MVP) - Design Specification

## Overview & Vision
An interactive, cross-platform party board game blending the accessibility of Jackbox Games with generative AI customization and digital board games. 
The system operates on a dual-screen paradigm (80% attention on shared screen / 20% on secret mobile controller). Up to 4 players join via a room code / QR Code from their phones without app installation, input prompts about their group or evening theme, and generative AI produces a custom board with 20 tiles and an 18-card deck tailored specifically to their friendship dynamics.

## Target Architecture
- **Language**: TypeScript across both client and server (Full-stack TS)
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Framer Motion, Lucide Icons, qrcode.react
- **Backend / Real-time**: Node.js WebSocket Server (`ws`), State Machine per room
- **AI Engine**: Vercel AI SDK / Google Gemini 2.5 Flash with Zod Structured Outputs
- **Game Engine**: Atomic Effects System (declarative action primitives evaluated deterministically on the server)

## Subsystems & Components

### 1. Atomic Effects System
Instead of arbitrary code generation by LLMs, the game runs on 8 atomic action types and 6 target primitives:
- **Action Types**:
  - `MODIFY_COINS`: +/- coin adjustments clamped at 0 min.
  - `STEAL_COINS`: transfers coins from target to source up to victim's current balance.
  - `MOVE_STEPS`: advances or steps back with circular modulo wrapping `((pos % 20) + 20) % 20`.
  - `SWAP_POSITIONS`: swaps positions between source and target.
  - `SKIP_TURN`: flags `skipNextTurn: true`.
  - `GRANT_SHIELD`: grants single-use defense against hostile actions.
  - `TAX_PERCENTAGE`: deductions based on target wealth percentage.
  - `VOTE_PENALTY`: opens 15s secret voting session on mobile phones.
- **Target Types**:
  - `SELF`, `CHOSEN_PLAYER`, `RICHEST_PLAYER`, `POOREST_PLAYER`, `RANDOM_OTHER`, `ALL_OTHERS`.

### 2. Board & Deck Specifications
- **Board Layout**: Exactly 20 tiles (Index 0 to 19):
  - Index 0: `START` (+100 pass bonus).
  - Index 7 & 15: `GLOBAL_VOTE`.
  - 6 `RESOURCE` tiles (+45 to +85 coins).
  - 4 `HAZARD` tiles (-25 to -55 coins or negative steps, no two adjacent).
  - 4 `SECRET_CARD` tiles (draws secret card to phone).
  - 3 `DRAMA_EVENT` tiles (triggers public drama on main screen).
- **Deck Structure**: Exactly 18 cards:
  - 6 `SECRET_HAND` (stored on phone, can target `CHOSEN_PLAYER`).
  - 8 `PUBLIC_DRAMA` (public execution on main screen, automatic targets only).
  - 4 `VOTE_CARD` (triggers 15s secret phone poll).

### 3. Room Finite State Machine (FSM)
- `LOBBY`: Gathering players, collecting prompts, generating AI pack.
- `TURN_START`: Active player rolls dice or plays secret hand card.
- `RESOLVING_TILE`: Step-by-step token hop and tile effect resolution.
- `VOTING`: 15s countdown for peer voting or early finish on 100% vote submission.
- `GAME_OVER`: Final standings, wrapped titles (Richest, Most Betrayed, Master Thief, Shield Master).

### 4. Dual-Screen Experience
- **Shared Screen (16:9 Landscape)**:
  - Top HUD: Current round, active turn indicator, AI narrator banner, persistent QR code.
  - 7x5 CSS Grid perimeter with Center Stage for 3D dice roll and card popups.
  - Bottom Docks: 4 player cards with real-time coin counts, shield badges, and hidden card counters.
- **Mobile Controller (9:16 Portrait, 100dvh)**:
  - Top identity banner colored to match token.
  - Secret hand carousel and target selector.
  - Bottom action zone with giant Roll Dice button, turn vibration, and spectator soundboard/reactions.
