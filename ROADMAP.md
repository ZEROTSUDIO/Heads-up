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
  - Party Banter Reactions: Amused Laughing (XD eyes & chuckling bounce), Flushed Romance (Heart eyes & glowing cheeks), Shocked Outrage (Bug eyes & gaping O mouth), Smug Bravado (Raised brow & swagger smirk), Side-Eye (Darting pupils & skeptical mouth)
- [x] Visual confidence meter & latency telemetry gauge animated below the character
- [x] 20-Question segmented progress track bar
- [x] Web Audio API 8-bit synthesized mechanical sound effects (clicks, pings, major-triad yes chimes, buzzers, victory fanfare) with toggle in Settings
- [x] Mobile responsive layout optimized for handheld screen play

---

## Phase 3: Gameplay Depth & Feedback (v0.4)
**Goal**: Add replayability, gamification, and rich feedback loops. Broken down into bite-sized sub-phases:

### Phase 3.1: Dossier / Known Facts Matrix (Evidence Board)
- [x] Collapsible or tabbed "EVIDENCE DOSSIER" panel summarizing all answered questions
- [x] Category-sorted matrix chips:
  - 🟢 **CONFIRMED (YES)**: Traits confirmed true
  - 🔴 **RULED OUT (NO)**: Traits confirmed false
  - 🟣 **CONDITIONAL (SOMETIMES)** & ⚪ **AMBIGUOUS (UNSURE)**
- [x] Saves player from scrolling through long chat logs
- [x] Live telemetry summary counters (`RECORDED`, `YES`, `NO`, `SOMETIMES`)
- [x] Seamless view switching (`INQUIRY FEED` vs `EVIDENCE DOSSIER`) with persistent command bar

### Phase 3.2: Per-Session Arcade Scoring & Performance Ranks
- [x] Dynamic scoring formula: Base clear bonus (1000) + Inquiry efficiency bonus (remaining questions * 50) + Speed bonus (elapsed time)
- [x] Retro arcade Rank system (**RANK S**, **A**, **B**, **C**, **D**) displayed on end-game card
- [x] Detailed session breakdown scorecard (Inquiries used, Time elapsed, Efficiency bonus, Speed bonus, Final score)
- [x] Lightweight & self-contained per round (persistent streaks/records deferred to future phases as requested)

### Phase 3.3: Satellite Intel / AI Cryptic Clue System
- [x] "📡 INTEL (-2Q)" button consuming 2 inquiry slots for classified guidance (1 use per round)
- [x] Specialized system prompt instruction to generate a cryptic, high-flavor clue without giving away the name
- [x] Context-aware prompt incorporating confirmed and ruled out traits from the Dossier
- [x] Dedicated styled transmission bubble (`.intel-bubble`) and avatar reactive state (`state-intel`)
- [x] Retro 8-bit satellite transmission audio chime synthesized via Web Audio API
- [x] Auto-recorded into the Evidence Dossier matrix as classified intel

### Phase 3.4: Question Rewind (Undo) [CANCELLED]
- ~~"Undo Last Question" button~~ (Cancelled per user decision — pure arcade commitment)

---

## Phase 4: Content Pools & Difficulty Modes (v0.5)
**Goal**: Expand the secret pool and introduce skill tiers.

### Phase 4.1: Modular Word Engine & Schema (`data/words.json`)
- [x] Externalized word dictionary into standalone schema-structured `data/words.json`
- [x] Rich metadata per item: `name`, `difficulty` ("easy", "normal", "hard"), `aliases`, `type` ("real_person", "living_organism", "geography", "inanimate_object"), and `hints`
- [x] Async dictionary loader with zero-network bundled fallback (resilient to `file://` CORS restrictions or offline play)
- [x] Alias-aware guess normalization (e.g. matching "Taylor" or "T-Swift" to "Taylor Swift", "Neo" to "Keanu Reeves")
- [x] Result card integration displaying secret difficulty rating

### Phase 4.2: Dynamic AI Secret Synthesizer (Instant On-the-Fly Generation)
- [x] Real-time zero-shot AI secret generation on round start (~200ms via Groq LPU or Google Gemini)
- [x] Dynamically generates `name`, `category`, `difficulty`, `aliases`, `type`, and `hints` on demand (no static secret bounds)
- [x] Anti-repetition session tracker (`sessionPlayedSecrets`) preventing duplicate entities within a play session
- [x] Custom Theme Synthesizer: UI input allowing players to enter *any* custom theme (e.g. "90s Cartoon Villains", "Video Games", "Marvel", "Mythological Gods")
- [x] Graceful zero-network offline fallback to `data/words.json` if API is unreachable

### Phase 4.3: Tiered Difficulty Modes & Mechanics [CANCELLED]
- ~~3-Tier difficulty selector (🟢 Rookie / 🟡 Detective / 🔴 Cyber-Sleuth) in Deck Selection modal~~ (Cancelled per user decision)
- ~~Tier-based inquiry limits (20 questions for Rookie/Detective, 15 questions for Cyber-Sleuth)~~
- ~~Tier-scaled satellite intel costs (1 inquiry for Rookie, 2 for Detective, 3 for Cyber-Sleuth)~~
- ~~Scorecard difficulty multiplier bonus (+500 PTS for Cyber-Sleuth)~~

### Phase 4.4: Context Disambiguation Prompts (Fiction vs Reality)
- [x] Standardize ontological `type` taxonomy in dynamic secret generation (`real_person`, `fictional_character`, `mythological_entity`, `living_organism`, `geography`, `fictional_location`, `inanimate_object`, `fictional_object`, `media_or_brand`, `concept_or_event`)
- [x] Pass `secretMeta` (`type` and disambiguating `hints`) from `js/game.js` (`handleAsk`, `handleRequestIntel`) into `js/ai.js` (`askAI`, `askAIClue`)
- [x] Inject **Ontological Disambiguation (Fiction vs Reality)** rules into `buildSystemPrompt` & `buildCluePrompt` to cleanly separate real-world existence questions ("Am I real?", "Am I from a movie?") from in-universe canon questions ("Am I human?", "Am I alive?", "Do I have powers?")
- [x] Add homonym/category anchor disambiguation (e.g. "Mercury" planet vs element vs god, "Titanic" ship vs film) using `category` + `type` + `hints`

### Phase 4.5: Optional Player Profile & Relational Perspective
- [x] Optional Player Profile UI in Settings (`name`, `age`, `gender`, `country`, plus optional taste/preference tags) stored locally in `localStorage` with a Clear Profile option
- [x] Revamp `FLEXIBLE PERSPECTIVE RULE` in `buildSystemPrompt` into a 2-way perspective split:
  - Single-subject deduction questions (`"Am I..."`, `"Is he/it..."`) continue evaluating the forehead secret directly
  - Two-subject / relational questions (`"Would I marry this person?"`, `"Would I like this food?"`, `"Is this famous in my country?"`, `"Did this exist when I was born?"`) map `"I/my"` to the Player Profile and `"this/it/this person"` to the secret (with `confidence: "low"` on subjective taste)
- [x] Contextual command-deck hint when a Player Profile is active, suggesting `"this/it/this person"` for personal comparison questions without breaking classic `"Am I..."` play

---

## Phase 5: The Daily Oracle Challenge (Daily Trivia Web Game) (v0.6)
**Goal**: Transform Heads-Up into a synchronized daily trivia event (Wordle/Contexto style) when ready to share with friends.

- [ ] Daily Mystery Challenge: Universally synchronized secret seeded by calendar date (`YYYY-MM-DD`)
- [ ] Daily lockout & midnight countdown timer (`NEXT PUZZLE IN 04h 12m 30s`)
- [ ] Daily Streak & Performance Statistics tracking (`Current Streak`, `Max Streak`, `Win %`)
- [ ] Wordle-style spoiler-free shareable emoji matrix (1-click clipboard copypasta for Discord, Twitter, WhatsApp)

---

## Phase 6: Sharing & Lightweight Deployment (v0.7)
**Goal**: Enable social play and seamless public hosting.

- [ ] Challenge links: share a game round with friends via URL hash/query seed (`?seed=...`)
- [ ] Optional serverless proxy (Cloudflare Worker / Vercel Edge Function) to mask API key for public production deployment without user key entry
- [ ] Onboarding tutorial modal for first-time players
- [ ] Offline PWA capability (cache static assets for instant load)
