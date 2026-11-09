# Guess What's on Your Head: Roadmap

A lightweight browser-based 20-questions game where the player asks yes/no questions about a secret, and an AI (powered by Groq LPU or Google Gemini) answers "yes", "no", "sometimes", or "unsure" until the player guesses it.

---

## Current State (v0.2 - Multi-Provider Stabilized)
- Tech stack: Lightweight frontend (Vanilla JS / HTML5 / CSS)
- AI Engines:
  - **Groq LPU (Primary / Recommended)**: `openai/gpt-oss-20b` (~200ms latency, high free quota, native JSON) & `openai/gpt-oss-120b`
  - **Google Gemini (Secondary)**: Gemini 3.8 Flash
- Structured output: `answer` ("yes", "no", "sometimes", "unsure") + `confidence` ("high", "low")
- LocalStorage persistence for user API keys & provider selection
- Sane 15s timeout with live timer & guess normalization (plural, typo, article tolerance)

---

## Phase 1: AI Engine & Core Stabilization (v0.2)
**Goal**: Make the core game loop ultra-fast, reliable, and immune to single-provider rate limits without needing a backend server.

- [x] Migrate AI caller from single provider to Multi-Provider Architecture (Groq + Google Gemini)
- [x] Enforce strict JSON output schemas (`answer: yes|no|sometimes|unsure`, `confidence: high|low`) to prevent secret leakage
- [x] Persist provider selection and individual API keys independently in `localStorage`
- [x] Added "Test Key" diagnostic tool to verify API keys instantly in-browser
- [x] Sane 15s timeout with real-time second-by-second countdown in UI
- [x] Improve guess matching for edge cases (articles, plurals, minor typos/fuzzy matching)
- [x] Flexible perspective prompt: automatically maps first-person ("Am I an actor?"), third-person ("Is he an actor?"), and descriptive ("Can you eat it?") questions directly to the secret item without answering "unsure"

---

## Phase 2: Neobrutalist UI & Expressive AI Face (v0.3)
**Goal**: Elevate the visual identity with Zerotsudios UI styling and give the AI character an expressive reactive face.

- [x] Separated codebase into clean modular files (`index.html`, `css/zerotsudios.css`, `css/game.css`, `js/ai.js`, `js/avatar.js`, `js/game.js`, `js/zerotsudios.js`)
- [x] Apply Zerotsudios neobrutalist aesthetic: Canvas Paper, Midnight Ink borders (`1.5px/2px`), 0-blur mechanical drop shadows, Anton display headlines, and Space Mono telemetry
- [x] Interactive SVG AI Character Face ("ORACLE-ZERO") with reactive animated states:
  - Idle / Waiting (gentle floating breathing & blinking)
  - Thinking / Evaluating (pupil darting, glowing antenna, wavy voice wave)
  - Confident Yes (green grinning nod & sparkles) / Hesitant Yes (half-smirk)
  - Firm No (red stern frown & head shake) / Hesitant No (wavy mouth)
  - Confused / Unsure (yellow question mark eyes, zigzag mouth, head wobble)
  - Victory (star eyes & celebration bounce) / Defeat (dizzy X eyes)
- [x] Visual confidence meter & latency telemetry gauge animated below the character
- [x] 20-Question segmented progress track bar
- [x] Web Audio API 8-bit synthesized mechanical sound effects (clicks, pings, major-triad yes chimes, buzzers, victory fanfare) with toggle in Settings
- [x] Mobile responsive layout optimized for handheld screen play

---

## Phase 3: Gameplay Depth & Feedback (v0.4)
**Goal**: Add replayability, gamification, and rich feedback loops.

- [ ] Scoring system: reward fewer questions asked and bonus for speed
- [ ] Clue/Hint system: unlockable after question 10 or 15 with limited uses
- [ ] Collapsible question history drawer with color-coded answer chips (`YES`, `NO`, `SOMETIMES`, `UNSURE`)
- [ ] Web Audio API synthesized sound effects (click, thinking chime, correct guess fanfare, game over buzz)
- [ ] Undo last question option

---

## Phase 4: Content Pools & Difficulty Modes (v0.5)
**Goal**: Expand the secret pool and introduce skill tiers.

- [ ] Extract secret categories into a dedicated modular data file (`words.json`)
- [ ] Difficulty modes: Easy (common/iconic), Normal, Hard (obscure/niche)
- [ ] New categories: Movies, Video Games, Historical Figures, Pop Culture, Tech
- [ ] Session history tracking to guarantee no duplicate secrets within a play session

---

## Phase 5: Sharing & Lightweight Deployment (v0.6)
**Goal**: Enable social play and seamless public hosting.

- [ ] Challenge links: share a game round with friends via URL hash/query seed (`?seed=...`)
- [ ] Optional serverless proxy (Cloudflare Worker / Vercel Edge Function) to mask API key for public production deployment without user key entry
- [ ] Onboarding tutorial modal for first-time players
- [ ] Offline PWA capability (cache static assets for instant load)
