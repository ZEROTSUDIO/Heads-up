/**
 * Heads-Up Party Game - Main Controller
 * Orchestrates game flow, normalization & guess matching, audio synthesis, and UI bindings.
 */

(function () {
  'use strict';

  // ============ CONSTANTS & DATA ============
  const MAX_QUESTIONS = 20;

  const categories = {
    celebrities: [
      "Taylor Swift", "Keanu Reeves", "Beyoncé", "Tom Hanks", "Oprah Winfrey",
      "Cristiano Ronaldo", "Albert Einstein", "Leonardo DiCaprio", "Lady Gaga", "Elon Musk"
    ],
    animals: [
      "elephant", "penguin", "giraffe", "octopus", "kangaroo",
      "dolphin", "chameleon", "tiger", "sloth", "flamingo"
    ],
    countries: [
      "Japan", "Brazil", "Indonesia", "Egypt", "Canada",
      "Iceland", "Australia", "France", "Mexico", "Italy"
    ],
    food: [
      "pizza", "sushi", "nasi goreng", "tacos", "ramen",
      "croissant", "guacamole", "hamburger", "spaghetti", "cheesecake"
    ],
    objects: [
      "umbrella", "bicycle", "telescope", "refrigerator", "guitar",
      "compass", "sunglasses", "microwave", "typewriter", "skateboard"
    ]
  };

  // ============ STATE ============
  let secret = null;
  let secretCategory = null;
  let questionCount = 0;
  let gameOver = false;
  let busy = false;
  let guessMode = false;
  let activeCategory = null;
  let sfxEnabled = true;

  // Avatar controller instance
  let avatar = null;

  // ============ DOM ELEMENTS ============
  const chatFeed = document.getElementById("chatFeed");
  const gameInput = document.getElementById("gameInput");
  const askBtn = document.getElementById("askBtn");
  const guessBtn = document.getElementById("guessBtn");
  const giveUpBtn = document.getElementById("giveUpBtn");
  const commandDeck = document.getElementById("commandDeck");
  const counterText = document.getElementById("counterText");
  const trackerSlots = document.getElementById("trackerSlots");
  const activeSecretBadge = document.getElementById("activeSecretBadge");
  const secretCategoryLabel = document.getElementById("secretCategoryLabel");
  const headerActiveCategory = document.getElementById("headerActiveCategory");

  // Settings Modal Elements
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const providerSelect = document.getElementById("providerSelect");
  const groqSettingsBlock = document.getElementById("groqSettingsBlock");
  const geminiSettingsBlock = document.getElementById("geminiSettingsBlock");
  const groqApiKeyInput = document.getElementById("groqApiKey");
  const groqKeyStatus = document.getElementById("groqKeyStatus");
  const groqModelSelect = document.getElementById("groqModelSelect");
  const geminiApiKeyInput = document.getElementById("geminiApiKey");
  const geminiKeyStatus = document.getElementById("geminiKeyStatus");
  const geminiModelSelect = document.getElementById("geminiModelSelect");
  const timeoutSelect = document.getElementById("timeoutSelect");
  const sfxToggle = document.getElementById("sfxToggle");
  const testKeyBtn = document.getElementById("testKeyBtn");
  const testKeyResult = document.getElementById("testKeyResult");
  const refreshGroqModelsBtn = document.getElementById("refreshGroqModelsBtn");

  // ============ WEB AUDIO API SYNTHESIZER ============
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
  }

  function playTone(freq, type = "sine", duration = 0.1, delay = 0, gainLevel = 0.1) {
    if (!sfxEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === "suspended") audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);

      gain.gain.setValueAtTime(gainLevel, audioCtx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(audioCtx.currentTime + delay);
      osc.stop(audioCtx.currentTime + delay + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  function playSfx(name) {
    if (!sfxEnabled) return;
    switch (name) {
      case "click":
        playTone(600, "sine", 0.04, 0, 0.08);
        break;
      case "think":
        playTone(440, "sine", 0.06, 0, 0.06);
        playTone(660, "sine", 0.08, 0.06, 0.06);
        break;
      case "yes":
        playTone(523.25, "triangle", 0.12, 0, 0.1);   // C5
        playTone(659.25, "triangle", 0.14, 0.08, 0.1); // E5
        playTone(783.99, "triangle", 0.22, 0.16, 0.1); // G5
        break;
      case "no":
        playTone(280, "sawtooth", 0.15, 0, 0.08);
        playTone(220, "sawtooth", 0.22, 0.12, 0.08);
        break;
      case "unsure":
        playTone(330, "triangle", 0.1, 0, 0.08);
        playTone(310, "triangle", 0.12, 0.08, 0.08);
        playTone(350, "triangle", 0.18, 0.16, 0.08);
        break;
      case "win":
        playTone(523.25, "square", 0.12, 0, 0.08);
        playTone(659.25, "square", 0.12, 0.1, 0.08);
        playTone(783.99, "square", 0.12, 0.2, 0.08);
        playTone(1046.50, "square", 0.35, 0.3, 0.1);
        break;
      case "lose":
        playTone(400, "sawtooth", 0.18, 0, 0.08);
        playTone(360, "sawtooth", 0.18, 0.14, 0.08);
        playTone(300, "sawtooth", 0.3, 0.28, 0.08);
        break;
    }
  }

  // ============ NORMALIZATION & GUESS MATCHING ============
  function cleanString(text) {
    return (text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // strip diacritics / accents
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "") // strip punctuation
      .replace(/^(a|an|the)\s+/, "") // strip leading articles
      .replace(/\s+/g, " ")
      .trim();
  }

  function singularize(word) {
    if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
    if (word.endsWith("es") && (word.endsWith("shes") || word.endsWith("ches") || word.endsWith("xes") || word.endsWith("sses"))) {
      return word.slice(0, -2);
    }
    if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) {
      return word.slice(0, -1);
    }
    return word;
  }

  function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  function isCorrectGuess(guess, target) {
    const g = cleanString(guess);
    const a = cleanString(target);
    if (!g || !a) return false;

    // 1. Exact match
    if (g === a) return true;

    // 2. Singular/plural match
    if (singularize(g) === singularize(a)) return true;

    // 3. Multi-word individual name match (e.g. "Taylor" or "Swift" for "Taylor Swift")
    const aWords = a.split(" ").filter(w => w.length >= 3);
    const gWords = g.split(" ").filter(w => w.length >= 3);
    if (aWords.length > 1 && gWords.length === 1) {
      if (aWords.includes(gWords[0])) return true;
    }

    // 4. Substring inclusion if sufficiently descriptive
    if (g.length >= 4 && a.includes(g)) return true;
    if (a.length >= 4 && g.includes(a)) return true;

    // 5. Minor typo tolerance (Levenshtein)
    const maxDist = a.length >= 8 ? 2 : a.length >= 5 ? 1 : 0;
    if (maxDist > 0 && Math.abs(g.length - a.length) <= maxDist) {
      if (levenshtein(g, a) <= maxDist) return true;
    }

    return false;
  }

  // ============ UI HELPERS & FEED RENDERING ============
  function addBubble(text, type, extraClass = "") {
    const div = document.createElement("div");
    div.className = `bubble ${type} ${extraClass}`.trim();
    div.textContent = text;
    chatFeed.appendChild(div);
    chatFeed.scrollTop = chatFeed.scrollHeight;
    return div;
  }

  function addAnswerBubble(answer, confidence = "high", latencyMs = null) {
    const div = document.createElement("div");
    div.className = "bubble bot";

    const wrap = document.createElement("div");
    wrap.className = "answer-tag-wrap";

    const key = (answer || "unsure").toLowerCase();
    const validKey = ["yes", "no", "sometimes", "unsure"].includes(key) ? key : "unsure";

    const badge = document.createElement("span");
    badge.className = `badge-answer ${validKey}`;
    badge.textContent = validKey.toUpperCase();
    wrap.appendChild(badge);

    if (confidence === "low") {
      const hesBadge = document.createElement("span");
      hesBadge.className = "badge-hesitant";
      hesBadge.textContent = "HESITANT";
      hesBadge.title = "The AI considers this answer borderline or context-dependent";
      wrap.appendChild(hesBadge);
    }

    if (latencyMs) {
      const pingBadge = document.createElement("span");
      pingBadge.className = "badge-dark";
      pingBadge.style.fontSize = "9px";
      pingBadge.textContent = `${latencyMs}ms`;
      wrap.appendChild(pingBadge);
    }

    div.appendChild(wrap);
    chatFeed.appendChild(div);
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }

  function updateTracker() {
    if (counterText) {
      counterText.textContent = gameOver
        ? `TERMINATED // ${questionCount} / ${MAX_QUESTIONS} QUESTIONS`
        : `QUESTION ${questionCount} / ${MAX_QUESTIONS}`;
    }

    if (trackerSlots) {
      const slots = trackerSlots.querySelectorAll(".tracker-slot");
      slots.forEach((slot, idx) => {
        slot.className = "tracker-slot";
        if (idx < questionCount) {
          slot.classList.add("used");
        } else if (idx === questionCount && !gameOver) {
          slot.classList.add("active");
        }
      });
    }
  }

  function setInputEnabled(enabled) {
    gameInput.disabled = !enabled;
    askBtn.disabled = !enabled;
    guessBtn.disabled = !enabled;
    giveUpBtn.disabled = !enabled;
  }

  function setBusy(state) {
    busy = state;
    setInputEnabled(!state && !gameOver && secret !== null);
  }

  function setGuessMode(on) {
    guessMode = on;
    commandDeck.classList.toggle("guess-active", on);
    gameInput.placeholder = on
      ? "TYPE YOUR FINAL GUESS (e.g. Taylor Swift)..."
      : "Ask a yes/no question (e.g. Am I an actor? Can I fly?)...";
    guessBtn.textContent = on ? "SUBMIT GUESS" : "GUESS";
    askBtn.disabled = on;
    if (on) playSfx("click");
  }

  function setActiveCategoryChip(name) {
    document.querySelectorAll(".category-chip-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.category === name);
    });
    if (headerActiveCategory) {
      headerActiveCategory.textContent = name.toUpperCase();
    }
  }

  // ============ GAME LOOP ============
  function startRound(name, silent = false) {
    const list = categories[name];
    if (!list || list.length === 0) return;

    if (!silent) playSfx("click");
    const index = Math.floor(Math.random() * list.length);
    secret = list[index];
    secretCategory = name;
    questionCount = 0;
    gameOver = false;
    activeCategory = name;

    chatFeed.innerHTML = "";
    addBubble(`PROTOCOL ENGAGED: Target category "${name.toUpperCase()}". The secret identity has been mounted to your forehead. Ask yes/no questions, or press "GUESS" when ready.`, "system");

    if (activeSecretBadge) {
      activeSecretBadge.textContent = "?? [CLASSIFIED] ??";
      activeSecretBadge.style.background = "var(--paper-dim)";
      activeSecretBadge.style.color = "var(--ink)";
    }
    if (secretCategoryLabel) secretCategoryLabel.textContent = `CATEGORY: ${name.toUpperCase()}`;

    setActiveCategoryChip(name);
    setGuessMode(false);
    setInputEnabled(true);
    updateTracker();
    avatar.setState("idle");
    gameInput.focus();
  }

  function endGame(won) {
    gameOver = true;
    setInputEnabled(false);
    setGuessMode(false);
    updateTracker();

    if (won) {
      playSfx("win");
      avatar.setState("win");
    } else {
      playSfx("lose");
      avatar.setState("lose");
    }

    if (activeSecretBadge) {
      activeSecretBadge.textContent = secret;
      activeSecretBadge.style.background = won ? "#4EE085" : "#FF5C5C";
      activeSecretBadge.style.color = "#0A090D";
    }

    const card = document.createElement("div");
    card.className = `game-result-card ${won ? "won" : "lost"}`;

    card.innerHTML = `
      <div class="result-headline ${won ? "won" : "lost"}">
        ${won ? "★ TARGET IDENTIFIED! ★" : "✖ MISSION FAILED ✖"}
      </div>
      <div class="result-secret-reveal">
        SECRET: <strong>${secret.toUpperCase()}</strong> (${secretCategory.toUpperCase()})
      </div>
      <button id="playAgainBtn" class="header-btn btn-active-purple" style="padding: 12px 24px; font-size: 13px;">
        START NEXT ROUND →
      </button>
    `;

    chatFeed.appendChild(card);
    chatFeed.scrollTop = chatFeed.scrollHeight;

    const btn = card.querySelector("#playAgainBtn");
    btn.addEventListener("click", () => startRound(secretCategory));
  }

  async function handleAsk() {
    const question = gameInput.value.trim();
    if (!question || busy || gameOver || secret === null) return;

    gameInput.value = "";
    addBubble(question, "user");
    questionCount++;
    updateTracker();
    setBusy(true);

    playSfx("think");
    avatar.setState("thinking");

    const thinking = addBubble("EVALUATING QUESTION... (0s)", "thinking");
    let elapsed = 0;
    const ticker = setInterval(() => {
      elapsed++;
      thinking.textContent = `EVALUATING QUESTION... (${elapsed}s)`;
    }, 1000);

    try {
      const result = await askAI(question, secret, secretCategory);
      clearInterval(ticker);
      thinking.remove();

      addAnswerBubble(result.answer, result.confidence, result.latencyMs);

      // Play audio cue
      const key = (result.answer || "").toLowerCase();
      if (key === "yes") playSfx("yes");
      else if (key === "no") playSfx("no");
      else playSfx("unsure");

      // Update avatar facial state
      avatar.respondToAnswer(result.answer, result.confidence, result.latencyMs);

    } catch (err) {
      clearInterval(ticker);
      thinking.remove();
      console.error("Ask error:", err);
      addBubble(`ERROR: ${err.message}`, "system");
      avatar.setState("unsure");
      questionCount--; // Don't penalize player on API/network errors
      updateTracker();
    } finally {
      clearInterval(ticker);
      thinking?.remove();
      setBusy(false);
    }

    if (!gameOver && questionCount >= MAX_QUESTIONS) {
      endGame(false);
    } else {
      gameInput.focus();
    }
  }

  function handleGuess() {
    const guess = gameInput.value.trim();
    if (!guessMode) {
      setGuessMode(true);
      gameInput.focus();
      return;
    }
    if (!guess || busy || gameOver) return;

    gameInput.value = "";
    setGuessMode(false);
    addBubble(guess, "user", "guess-bubble");

    if (isCorrectGuess(guess, secret)) {
      endGame(true);
    } else {
      playSfx("no");
      avatar.setState("no-high");
      addBubble(`NEGATIVE: "${guess}" is incorrect. Continue questioning.`, "bot");
      if (questionCount >= MAX_QUESTIONS) {
        endGame(false);
      }
      gameInput.focus();
    }
  }

  function handleGiveUp() {
    if (!gameOver && secret !== null) {
      playSfx("click");
      endGame(false);
    }
  }

  // ============ SETTINGS CONTROLLER ============
  window.updateProviderUI = function () {
    const provider = providerSelect.value;
    groqSettingsBlock.style.display = provider === "groq" ? "flex" : "none";
    geminiSettingsBlock.style.display = provider === "gemini" ? "flex" : "none";
  };

  function loadSettings() {
    const savedProvider = getStorage(STORAGE_KEY_PROVIDER, "groq");
    providerSelect.value = savedProvider;
    window.updateProviderUI();

    // Groq Key & Model
    const savedGroqKey = getStorage(STORAGE_KEY_GROQ_KEY, "");
    let savedGroqModel = getStorage(STORAGE_KEY_GROQ_MODEL, "openai/gpt-oss-20b");
    if (savedGroqModel.includes("llama") || !savedGroqModel) {
      savedGroqModel = "openai/gpt-oss-20b";
      setStorage(STORAGE_KEY_GROQ_MODEL, savedGroqModel);
    }
    if (savedGroqKey) {
      groqApiKeyInput.value = savedGroqKey;
      groqKeyStatus.textContent = "✓ Key saved in localStorage";
      groqKeyStatus.className = "key-status-indicator saved";
      populateGroqModels(savedGroqKey);
    } else {
      groqKeyStatus.textContent = "No Groq key set (free at console.groq.com/keys)";
      groqKeyStatus.className = "key-status-indicator empty";
    }
    groqModelSelect.value = savedGroqModel;

    // Gemini Key & Model
    const savedGeminiKey = getStorage(STORAGE_KEY_GEMINI_KEY, "");
    const savedGeminiModel = getStorage(STORAGE_KEY_GEMINI_MODEL, "gemini-3.8-flash");
    if (savedGeminiKey) {
      geminiApiKeyInput.value = savedGeminiKey;
      geminiKeyStatus.textContent = "✓ Key saved in localStorage";
      geminiKeyStatus.className = "key-status-indicator saved";
    } else {
      geminiKeyStatus.textContent = "No Gemini key set";
      geminiKeyStatus.className = "key-status-indicator empty";
    }
    geminiModelSelect.value = savedGeminiModel;

    // Timeout
    const savedTimeout = getStorage(STORAGE_KEY_TIMEOUT, "15");
    if (timeoutSelect) timeoutSelect.value = savedTimeout;

    // SFX
    const savedSfx = getStorage(STORAGE_KEY_SFX, "true");
    sfxEnabled = savedSfx !== "false";
    if (sfxToggle) sfxToggle.checked = sfxEnabled;
  }

  async function populateGroqModels(apiKey) {
    if (!apiKey) return;
    const models = await fetchGroqModels(apiKey);
    if (models.length > 0) {
      const currentSelected = groqModelSelect.value || getStorage(STORAGE_KEY_GROQ_MODEL, "openai/gpt-oss-20b");
      groqModelSelect.innerHTML = "";
      models.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = m === "openai/gpt-oss-20b" ? `${m} (Fast ~200ms & Recommended)` : m;
        groqModelSelect.appendChild(opt);
      });
      if (models.includes(currentSelected)) {
        groqModelSelect.value = currentSelected;
      } else if (models.includes("openai/gpt-oss-20b")) {
        groqModelSelect.value = "openai/gpt-oss-20b";
      } else {
        groqModelSelect.value = models[0];
      }
      setStorage(STORAGE_KEY_GROQ_MODEL, groqModelSelect.value);
    }
  }

  // ============ EVENT BINDINGS ============
  function bindEvents() {
    // Category chips
    document.querySelectorAll(".category-chip-btn").forEach(btn => {
      btn.addEventListener("click", () => startRound(btn.dataset.category));
    });

    // Action buttons
    askBtn.addEventListener("click", handleAsk);
    guessBtn.addEventListener("click", handleGuess);
    giveUpBtn.addEventListener("click", handleGiveUp);

    // Keyboard navigation
    gameInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        guessMode ? handleGuess() : handleAsk();
      } else if (e.key === "Escape" && guessMode) {
        setGuessMode(false);
      }
    });

    // Settings Modal Open/Close
    settingsBtn.addEventListener("click", () => {
      playSfx("click");
      settingsModal.classList.add("open");
    });

    closeSettingsBtn.addEventListener("click", () => {
      playSfx("click");
      settingsModal.classList.remove("open");
    });

    settingsModal.addEventListener("click", e => {
      if (e.target === settingsModal) {
        settingsModal.classList.remove("open");
      }
    });

    // Provider settings listeners
    providerSelect.addEventListener("change", () => {
      setStorage(STORAGE_KEY_PROVIDER, providerSelect.value);
      window.updateProviderUI();
    });

    groqApiKeyInput.addEventListener("input", () => {
      const val = groqApiKeyInput.value.trim();
      if (val) {
        setStorage(STORAGE_KEY_GROQ_KEY, val);
        groqKeyStatus.textContent = "✓ Key saved in localStorage";
        groqKeyStatus.className = "key-status-indicator saved";
        populateGroqModels(val);
      } else {
        removeStorage(STORAGE_KEY_GROQ_KEY);
        groqKeyStatus.textContent = "No Groq key set (free at console.groq.com/keys)";
        groqKeyStatus.className = "key-status-indicator empty";
      }
    });

    groqModelSelect.addEventListener("change", () => {
      setStorage(STORAGE_KEY_GROQ_MODEL, groqModelSelect.value);
    });

    if (refreshGroqModelsBtn) {
      refreshGroqModelsBtn.addEventListener("click", async () => {
        playSfx("click");
        const key = groqApiKeyInput.value.trim();
        if (!key) return;
        refreshGroqModelsBtn.textContent = "Refreshing...";
        await populateGroqModels(key);
        refreshGroqModelsBtn.textContent = "Refreshed!";
        setTimeout(() => refreshGroqModelsBtn.textContent = "Refresh Models", 1500);
      });
    }

    geminiApiKeyInput.addEventListener("input", () => {
      const val = geminiApiKeyInput.value.trim();
      if (val) {
        setStorage(STORAGE_KEY_GEMINI_KEY, val);
        geminiKeyStatus.textContent = "✓ Key saved in localStorage";
        geminiKeyStatus.className = "key-status-indicator saved";
      } else {
        removeStorage(STORAGE_KEY_GEMINI_KEY);
        geminiKeyStatus.textContent = "No Gemini key set";
        geminiKeyStatus.className = "key-status-indicator empty";
      }
    });

    geminiModelSelect.addEventListener("change", () => {
      setStorage(STORAGE_KEY_GEMINI_MODEL, geminiModelSelect.value);
    });

    timeoutSelect.addEventListener("change", () => {
      setStorage(STORAGE_KEY_TIMEOUT, timeoutSelect.value);
    });

    if (sfxToggle) {
      sfxToggle.addEventListener("change", () => {
        sfxEnabled = sfxToggle.checked;
        setStorage(STORAGE_KEY_SFX, sfxEnabled ? "true" : "false");
        if (sfxEnabled) playSfx("click");
      });
    }

    // Diagnostic Test Key Button
    testKeyBtn.addEventListener("click", async () => {
      playSfx("click");
      const provider = providerSelect.value;
      testKeyResult.textContent = "Testing...";
      testKeyResult.style.color = "#DDD6FE";

      if (provider === "groq") {
        const key = groqApiKeyInput.value.trim();
        if (!key) {
          testKeyResult.textContent = "✗ No Groq key entered";
          testKeyResult.style.color = "#FF5C5C";
          return;
        }
        try {
          const res = await fetch("https://api.groq.com/openai/v1/models", {
            headers: { "Authorization": `Bearer ${key}` }
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error?.message || `HTTP ${res.status}`);
          }
          testKeyResult.textContent = "✓ Groq Key Valid!";
          testKeyResult.style.color = "#4EE085";
        } catch (err) {
          testKeyResult.textContent = `✗ ${err.message}`;
          testKeyResult.style.color = "#FF5C5C";
        }
      } else {
        const key = geminiApiKeyInput.value.trim();
        if (!key) {
          testKeyResult.textContent = "✗ No Gemini key entered";
          testKeyResult.style.color = "#FF5C5C";
          return;
        }
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
          if (!res.ok) {
            const t = await res.text();
            throw new Error(`HTTP ${res.status}: ${t.slice(0, 80)}`);
          }
          testKeyResult.textContent = "✓ Gemini Key Valid!";
          testKeyResult.style.color = "#4EE085";
        } catch (err) {
          testKeyResult.textContent = `✗ ${err.message}`;
          testKeyResult.style.color = "#FF5C5C";
        }
      }
    });
  }

  // ============ INITIALIZATION ============
  function initGame() {
    avatar = new OracleAvatar("oracleAvatarContainer");
    loadSettings();
    bindEvents();
    startRound("celebrities", true);
  }

  document.addEventListener("DOMContentLoaded", initGame);
})();
