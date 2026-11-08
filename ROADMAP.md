# Guess What's on Your Head: Roadmap

A browser game where the player asks yes/no questions about a secret, and an AI answers "yes", "no", "sometimes", or "unsure" until the player guesses it.

## Current state (v0.1)

- Single file: `index.html`
- Five static categories: celebrities, animals, countries, food, objects
- Secret picked at random from a hardcoded list
- AI answers via the Anthropic API, called directly from the browser
- Guess checking with normalization and close-match matching
- 20-question limit, give up button, play again
- Not yet tested in a real browser

---

## Phase 1: Stabilize (v0.2)

Goal: make the current version reliable before adding features.

- [ ] Test in Chrome, Safari, and Firefox, plus a phone browser
- [ ] Fix any bugs found in testing
- [ ] Verify the API call works with a real key and that error messages are clear
- [ ] Check the model answers consistently across a full round
- [ ] Tune the system prompt if the model reveals the secret, answers inconsistently, or says "sometimes" too often
- [ ] Improve guess matching for edge cases (typos, "the" prefixes, plural forms like "dogs" vs "dog")

## Phase 2: Better gameplay (v0.3)

Goal: make each round more fun and engaging.

- [ ] Question counter with a score (fewer questions = higher score)
- [ ] Hint button after a set number of questions (for example, after 15), with a limited number of uses
- [ ] Question history panel to review past answers
- [ ] Undo last question
- [ ] Difficulty levels: easy (more hints), normal, hard (secret is less common)
- [ ] Sound effects or small animations on win and lose

## Phase 3: Content (v0.4)

Goal: make the secret pool large and varied.

- [ ] Move word lists into a separate `words.json` file for easier editing
- [ ] Expand each category to 50+ entries
- [ ] Add more categories: movies, books, places, professions, historical figures
- [ ] Add difficulty tags to each entry so easy and hard modes use different pools
- [ ] Avoid repeats within a session (shuffle and track what's been used)

## Phase 4: Dynamic secrets (v0.5)

Goal: pull secrets from the internet instead of a fixed list.

- [ ] Fetch category lists from Wikidata or Wikipedia when the game loads
- [ ] Cache the fetched lists in localStorage so the game works offline after the first load
- [ ] Filter out junk entries (disambiguation pages, obscure names, very long titles)
- [ ] Add a "refresh list" option in settings
- [ ] Handle fetch failures by falling back to the static list

## Phase 5: Security and sharing (v0.6)

Goal: make the game fair and safe to share.

- [ ] Move the API call to a small backend server so the key isn't exposed in the browser
- [ ] Keep the secret on the server, so players can't read it from the page source
- [ ] Store the current round on the server, tied to a session ID
- [ ] Add rate limiting to prevent abuse of the API
- [ ] Add a privacy note explaining what's stored

## Phase 6: Multiplayer and social (v0.7)

Goal: let people play with friends, including when friends aren't around to answer.

- [ ] "Ask a friend" mode: one player picks a secret, others ask questions
- [ ] Share a round by link
- [ ] Simple leaderboard for best scores per category
- [ ] Optional user accounts to track history and stats

## Phase 7: Expressive AI character (v0.8)

Goal: give the AI a face so answers feel like a friend's reaction, and show uncertainty instead of hiding it behind a flat "yes" or "no".

**Character design**
- [ ] Cartoon character face (not realistic, not an abstract orb)
- [ ] Idle state: relaxed, waiting for a question
- [ ] Thinking state: visible while the request is in progress
- [ ] Answer states: sure yes, unsure yes, sure no, unsure no, sometimes, confused (for "unsure" answers)
- [ ] Smooth transitions between states (short fade or blink, not a hard swap)

**Thinking pause**
- [ ] Enforce a minimum thinking time (around 1 to 1.5 seconds) even when the API responds faster, so the reaction feels considered
- [ ] Keep the pause short enough that it never feels slow on a long question

**Confidence signal**
- [ ] Change the model output from one word to a short structured format, such as `yes|high`, `yes|low`, `no|high`, `no|low`, `sometimes`, or `unsure`
- [ ] Update the system prompt to require that format exactly
- [ ] Parse the output safely, falling back to `unsure` if the format is wrong
- [ ] Treat confidence as a rough signal, not a calibrated probability. Test whether "low" matches cases that really are ambiguous (for example, "Is it useful?" or "Am I a man?" for a non-binary secret)

**Confidence meter**
- [ ] Small meter below the character showing how sure the answer is (for example, three segments: low, medium, high)
- [ ] Meter animates along with the face

**Layout**
- [ ] Character sits at the top of the chat area, with the meter below it
- [ ] Chat bubbles stay as they are, so the history remains readable
- [ ] On phones, the character shrinks but stays visible

**Testing**
- [ ] Run a full round for each category and check that faces match answers
- [ ] Check ambiguous questions specifically to see whether "low" confidence and the face appear as expected

## Phase 8: Polish and release (v1.0)

Goal: a finished product ready for others to use.

- [ ] Clean UI with a proper design pass (the current one is minimal)
- [ ] Dark mode
- [ ] Accessibility: keyboard navigation, screen reader labels, sufficient color contrast
- [ ] Localization (Indonesian and English)
- [ ] Onboarding screen explaining the rules
- [ ] Analytics on which categories and questions are most popular (anonymous, opt-in)
- [ ] Hosting, domain, and a basic landing page

---

## Open questions

- Should the game stay free, or will it need a paid tier to cover API costs?
- Is the target audience just you and friends, or the public?
- Which language should the secrets and answers use by default?

## Notes

- Each phase should be playable on its own. Don't start Phase 5 until the game works well locally.
- The expressive face (Phase 7) changes the answer format, so do it after the core loop is stable. Changing the format early would make Phases 1 to 3 harder to test.
- The biggest technical risk is answer consistency. Test it often as the prompt and model change.
- Keep `index.html` working at every step, so you always have something playable.
