# Guess What's on Your Head: Roadmap

A lightweight browser-based 20-questions game where the player asks yes/no questions about a secret, and an AI powered by Google Gemini answers "yes", "no", "sometimes", or "unsure" until the player guesses it.

---

## Current State (v0.2 - In Progress)
- Tech stack: Lightweight frontend (Vanilla JS / HTML5 / CSS)
- AI Engine: Google Gemini API (Gemini 3.8 Flash)
- Structured output: `answer` ("yes", "no", "sometimes", "unsure") + `confidence` ("high", "low")
- LocalStorage persistence for user API key
- Guess normalization with fuzzy and plural tolerance

---

## Phase 1: Gemini Engine & Core Stabilization (v0.2)
**Goal**: Make the core game loop fast, reliable, and powered by Google Gemini without needing a backend server.

- [x] Migrate AI caller from Anthropic to Google Gemini (`gemini-3.8-flash`)
- [x] Use Gemini structured output (`response_mime_type: "application/json"`) to strictly enforce valid responses and prevent secret leakage
- [x] Persist API key in `localStorage` so players don't have to re-paste on page reload
- [x] Improve guess matching for edge cases (articles, plurals, minor typos/fuzzy matching)
- [x] Clear error handling for missing keys, quota limits, and network drops
- [x] Add answer confidence signal (`high` vs `low`) to prepare for expressive character states

---

## Phase 2: Neobrutalist UI & Expressive AI Face (v0.3)
**Goal**: Elevate the visual identity with Zerotsudios UI styling and give the AI character an expressive reactive face.

- [ ] Apply Zerotsudios neobrutalist aesthetic: Canvas Paper, Midnight Ink borders (`1.5px/2px`), mechanical offset drop shadows, Anton display headlines, and Space Mono telemetry
- [ ] SVG/CSS cartoon character face with reactive states:
  - Idle / Waiting
  - Thinking / Evaluating
  - Confident Yes / Hesitant Yes
  - Firm No / Hesitant No
  - Confused (for "unsure" answers)
- [ ] Visual confidence meter animated below the character
- [ ] Mobile responsive layout optimized for handheld screen play

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
