/**
 * Heads-Up Party Game - Main Controller
 * Orchestrates game flow, normalization & guess matching, audio synthesis, and UI bindings.
 */

(function () {
  'use strict';

  // ============ CONSTANTS & DATA ============
  const MAX_QUESTIONS = 20;

  // Bundled fallback registry in case data/words.json is unavailable (e.g. file:// CORS restrictions)
  const DEFAULT_WORDS_REGISTRY = {
    celebrities: {
      id: "celebrities",
      name: "CELEBRITIES",
      tag: "ICONS & FIGURES",
      icon: "🎭",
      description: "Famous actors, musicians, thinkers & athletes.",
      items: [
        { name: "Taylor Swift", difficulty: "easy", aliases: ["Taylor", "Swift", "T-Swift"], type: "real_person", hints: ["Global pop megastar known for The Eras Tour"] },
        { name: "Keanu Reeves", difficulty: "easy", aliases: ["Keanu", "John Wick", "Neo"], type: "real_person", hints: ["Beloved Hollywood actor renowned for The Matrix and John Wick"] },
        { name: "Beyoncé", difficulty: "easy", aliases: ["Beyonce", "Queen Bey", "Beyonce Knowles"], type: "real_person", hints: ["Grammy-record-breaking cultural icon and vocalist"] },
        { name: "Tom Hanks", difficulty: "easy", aliases: ["Hanks", "Forrest Gump"], type: "real_person", hints: ["Two-time Academy Award winner known as America's dad"] },
        { name: "Oprah Winfrey", difficulty: "easy", aliases: ["Oprah", "Winfrey"], type: "real_person", hints: ["Legendary talk show host, media mogul, and philanthropist"] },
        { name: "Cristiano Ronaldo", difficulty: "easy", aliases: ["Ronaldo", "CR7"], type: "real_person", hints: ["Portuguese football legend with multiple Ballon d'Or trophies"] },
        { name: "Albert Einstein", difficulty: "normal", aliases: ["Einstein"], type: "real_person", hints: ["Nobel laureate physicist who developed the theory of relativity"] },
        { name: "Leonardo DiCaprio", difficulty: "normal", aliases: ["DiCaprio", "Leo DiCaprio"], type: "real_person", hints: ["Oscar-winning actor renowned for Titanic and Inception"] },
        { name: "Lady Gaga", difficulty: "normal", aliases: ["Gaga", "Stefani Germanotta"], type: "real_person", hints: ["Avant-garde pop artist and Oscar-winning actress"] },
        { name: "Elon Musk", difficulty: "normal", aliases: ["Musk"], type: "real_person", hints: ["Tech entrepreneur leading SpaceX and Tesla"] },
        { name: "Marie Curie", difficulty: "hard", aliases: ["Curie", "Madame Curie"], type: "real_person", hints: ["First person to win two Nobel Prizes in physics and chemistry"] },
        { name: "William Shakespeare", difficulty: "normal", aliases: ["Shakespeare", "The Bard"], type: "real_person", hints: ["English playwright and poet widely regarded as the greatest dramatist"] },
        { name: "Lionel Messi", difficulty: "easy", aliases: ["Messi", "Leo Messi", "La Pulga"], type: "real_person", hints: ["World Cup champion footballer from Argentina"] },
        { name: "Marilyn Monroe", difficulty: "normal", aliases: ["Monroe", "Norma Jeane"], type: "real_person", hints: ["Iconic 1950s Hollywood star and cultural symbol"] },
        { name: "Steve Jobs", difficulty: "normal", aliases: ["Jobs"], type: "real_person", hints: ["Co-founder of Apple who pioneered personal computers and smartphones"] }
      ]
    },
    animals: {
      id: "animals",
      name: "ANIMALS",
      tag: "FAUNA & WILDLIFE",
      icon: "🐾",
      description: "Wildlife, marine creatures, predators & birds.",
      items: [
        { name: "Elephant", difficulty: "easy", aliases: ["African elephant", "Asian elephant"], type: "living_organism", hints: ["Largest existing land mammal with a long trunk and tusks"] },
        { name: "Penguin", difficulty: "easy", aliases: ["Emperor penguin"], type: "living_organism", hints: ["Flightless aquatic bird native to the southern hemisphere"] },
        { name: "Giraffe", difficulty: "easy", aliases: [], type: "living_organism", hints: ["Tallest living terrestrial animal known for its extremely long neck"] },
        { name: "Octopus", difficulty: "easy", aliases: ["Octopi", "Octopuses"], type: "living_organism", hints: ["Highly intelligent eight-limbed marine mollusk capable of camouflage"] },
        { name: "Kangaroo", difficulty: "easy", aliases: ["Roo"], type: "living_organism", hints: ["Hopping marsupial with a front pouch indigenous to Australia"] },
        { name: "Dolphin", difficulty: "easy", aliases: ["Bottlenose dolphin"], type: "living_organism", hints: ["Playful aquatic cetacean known for echolocation"] },
        { name: "Chameleon", difficulty: "normal", aliases: [], type: "living_organism", hints: ["Specialized lizard capable of changing skin pigments"] },
        { name: "Tiger", difficulty: "easy", aliases: ["Bengal tiger", "Siberian tiger"], type: "living_organism", hints: ["Apex predator and largest living cat species with orange and black stripes"] },
        { name: "Sloth", difficulty: "normal", aliases: ["Three-toed sloth"], type: "living_organism", hints: ["Slow-moving arboreal mammal native to Central and South America"] },
        { name: "Flamingo", difficulty: "normal", aliases: [], type: "living_organism", hints: ["Wading bird recognizable by pink plumage and one-legged stance"] },
        { name: "Platypus", difficulty: "hard", aliases: ["Duck-billed platypus"], type: "living_organism", hints: ["Semi-aquatic egg-laying mammal with a duck-like bill and beaver tail"] },
        { name: "Komodo Dragon", difficulty: "hard", aliases: ["Komodo"], type: "living_organism", hints: ["Largest living lizard species endemic to Indonesian islands"] },
        { name: "Blue Whale", difficulty: "normal", aliases: [], type: "living_organism", hints: ["Largest animal ever known to have lived on Earth"] },
        { name: "Axolotl", difficulty: "hard", aliases: ["Mexican walking fish"], type: "living_organism", hints: ["Neotenic salamander known for limb regeneration and feathery external gills"] },
        { name: "Honey Badger", difficulty: "hard", aliases: ["Ratel"], type: "living_organism", hints: ["Notoriously fearless carnivorous mammal known for thick defensive skin"] }
      ]
    },
    countries: {
      id: "countries",
      name: "COUNTRIES",
      tag: "GEOGRAPHY",
      icon: "🌍",
      description: "Nations, travel destinations & global territories.",
      items: [
        { name: "Japan", difficulty: "easy", aliases: ["Nippon", "Nihon"], type: "geography", hints: ["East Asian island nation celebrated for cherry blossoms, Tokyo, and high-speed rail"] },
        { name: "Brazil", difficulty: "easy", aliases: ["Brasil"], type: "geography", hints: ["Largest nation in South America, home to the Amazon Rainforest and Carnival"] },
        { name: "Indonesia", difficulty: "normal", aliases: [], type: "geography", hints: ["World's largest archipelago state spanning across Southeast Asia and Oceania"] },
        { name: "Egypt", difficulty: "easy", aliases: [], type: "geography", hints: ["Northeast African country famed for the Nile and ancient pyramids"] },
        { name: "Canada", difficulty: "easy", aliases: [], type: "geography", hints: ["Second-largest country by total area, renowned for maple syrup and Niagara Falls"] },
        { name: "Iceland", difficulty: "normal", aliases: [], type: "geography", hints: ["Nordic island nation defined by volcanoes, geysers, hot springs, and glaciers"] },
        { name: "Australia", difficulty: "easy", aliases: ["Aussie"], type: "geography", hints: ["Continent country surrounded by the Indian and Pacific Oceans"] },
        { name: "France", difficulty: "easy", aliases: [], type: "geography", hints: ["Western European country home to Paris, the Eiffel Tower, and fine wine"] },
        { name: "Mexico", difficulty: "easy", aliases: [], type: "geography", hints: ["North American nation known for rich culinary traditions and Mayan ruins"] },
        { name: "Italy", difficulty: "easy", aliases: ["Italia"], type: "geography", hints: ["Boot-shaped Mediterranean country renowned for Rome, Venice, and Renaissance art"] },
        { name: "Madagascar", difficulty: "normal", aliases: [], type: "geography", hints: ["Island country off the coast of East Africa famous for endemic lemurs and baobabs"] },
        { name: "Switzerland", difficulty: "normal", aliases: ["Swiss"], type: "geography", hints: ["Mountainous Central European country famous for the Alps, watches, and chocolate"] },
        { name: "South Korea", difficulty: "normal", aliases: ["Korea", "ROK"], type: "geography", hints: ["East Asian nation leader in technology, cinema, and K-pop culture"] },
        { name: "Peru", difficulty: "normal", aliases: [], type: "geography", hints: ["South American country home to Machu Picchu and the ancient Inca Empire"] },
        { name: "Norway", difficulty: "normal", aliases: [], type: "geography", hints: ["Scandinavian nation famous for dramatic coastal fjords and northern lights"] }
      ]
    },
    food: {
      id: "food",
      name: "FOOD & DRINK",
      tag: "CUISINE",
      icon: "🍕",
      description: "Popular worldwide dishes, ingredients, treats & snacks.",
      items: [
        { name: "Pizza", difficulty: "easy", aliases: ["Pepperoni pizza", "Cheese pizza"], type: "inanimate_object", hints: ["Italian dish featuring flat baked dough topped with tomato sauce and cheese"] },
        { name: "Sushi", difficulty: "easy", aliases: ["Nigiri", "Maki"], type: "inanimate_object", hints: ["Japanese staple consisting of prepared vinegared rice and raw fish"] },
        { name: "Nasi Goreng", difficulty: "normal", aliases: ["Indonesian fried rice", "Fried rice"], type: "inanimate_object", hints: ["Indonesian stir-fried rice seasoned with sweet soy sauce and shallots"] },
        { name: "Tacos", difficulty: "easy", aliases: ["Taco"], type: "inanimate_object", hints: ["Traditional Mexican dish made of folded corn or wheat tortillas with savory fillings"] },
        { name: "Ramen", difficulty: "easy", aliases: ["Japanese ramen"], type: "inanimate_object", hints: ["Japanese wheat noodle soup served in rich meat or fish broth"] },
        { name: "Croissant", difficulty: "normal", aliases: [], type: "inanimate_object", hints: ["Flaky, buttery crescent-shaped pastry originating in Austrian and French baking"] },
        { name: "Guacamole", difficulty: "normal", aliases: ["Guac"], type: "inanimate_object", hints: ["Mashed avocado-based dip seasoned with lime juice, salt, and cilantro"] },
        { name: "Hamburger", difficulty: "easy", aliases: ["Burger", "Cheeseburger"], type: "inanimate_object", hints: ["Iconic sandwich consisting of a cooked patty placed inside a sliced bun"] },
        { name: "Spaghetti", difficulty: "easy", aliases: ["Spaghetti bolognese", "Pasta"], type: "inanimate_object", hints: ["Long, thin cylindrical pasta of Italian origin"] },
        { name: "Cheesecake", difficulty: "normal", aliases: [], type: "inanimate_object", hints: ["Sweet dessert consisting of soft fresh cheese on a crushed cookie crust"] },
        { name: "Paella", difficulty: "normal", aliases: ["Spanish paella"], type: "inanimate_object", hints: ["Classic Spanish rice dish originating from Valencia seasoned with saffron"] },
        { name: "Baklava", difficulty: "hard", aliases: [], type: "inanimate_object", hints: ["Layered pastry dessert made of filo pastry filled with chopped nuts and sweetened syrup"] },
        { name: "Dim Sum", difficulty: "normal", aliases: ["Dumplings"], type: "inanimate_object", hints: ["Cantonese meal consisting of small dishes served in bamboo steamer baskets"] },
        { name: "Poutine", difficulty: "hard", aliases: [], type: "inanimate_object", hints: ["Quebec dish made of french fries and cheese curds topped with brown gravy"] },
        { name: "Kimchi", difficulty: "normal", aliases: [], type: "inanimate_object", hints: ["Traditional Korean salted and fermented cabbage and radishes seasoned with chili"] }
      ]
    },
    objects: {
      id: "objects",
      name: "OBJECTS",
      tag: "ITEMS & TOOLS",
      icon: "📦",
      description: "Household items, tools, instruments & gadgets.",
      items: [
        { name: "Umbrella", difficulty: "easy", aliases: ["Parasol"], type: "inanimate_object", hints: ["Collapsible canopy designed to shield an individual from rain or sunlight"] },
        { name: "Bicycle", difficulty: "easy", aliases: ["Bike"], type: "inanimate_object", hints: ["Human-powered two-wheeled steerable vehicle propelled by foot pedals"] },
        { name: "Telescope", difficulty: "normal", aliases: [], type: "inanimate_object", hints: ["Optical instrument used to observe distant celestial bodies"] },
        { name: "Refrigerator", difficulty: "easy", aliases: ["Fridge"], type: "inanimate_object", hints: ["Household appliance used to preserve food and beverages at cool temperatures"] },
        { name: "Guitar", difficulty: "easy", aliases: ["Acoustic guitar", "Electric guitar"], type: "inanimate_object", hints: ["Stringed musical instrument with a fretted neck typically played with a pick or fingers"] },
        { name: "Compass", difficulty: "normal", aliases: ["Magnetic compass"], type: "inanimate_object", hints: ["Navigational device pointing toward magnetic north"] },
        { name: "Sunglasses", difficulty: "easy", aliases: ["Shades"], type: "inanimate_object", hints: ["Protective eyewear designed to shield eyes from bright sunlight"] },
        { name: "Microwave", difficulty: "easy", aliases: ["Microwave oven"], type: "inanimate_object", hints: ["Kitchen appliance that cooks or reheats food using dielectric heating"] },
        { name: "Typewriter", difficulty: "normal", aliases: [], type: "inanimate_object", hints: ["Mechanical or electromechanical machine for typing characters on paper"] },
        { name: "Skateboard", difficulty: "easy", aliases: ["Skate"], type: "inanimate_object", hints: ["Narrow board mounted atop four polyurethane wheels used for gliding and tricks"] },
        { name: "Hourglass", difficulty: "normal", aliases: ["Sand timer"], type: "inanimate_object", hints: ["Mechanical timer measuring the passage of time through falling grains of sand"] },
        { name: "Drone", difficulty: "normal", aliases: ["Quadcopter", "UAV"], type: "inanimate_object", hints: ["Unmanned aerial vehicle controlled remotely or autonomously"] },
        { name: "Stethoscope", difficulty: "hard", aliases: [], type: "inanimate_object", hints: ["Acoustic medical device used to listen to internal heart and lung sounds"] },
        { name: "Vinyl Record Player", difficulty: "hard", aliases: ["Record player", "Turntable", "Phonograph"], type: "inanimate_object", hints: ["Analog sound reproduction machine that tracks audio grooves on spinning vinyl discs"] },
        { name: "Hoverboard", difficulty: "normal", aliases: ["Self-balancing scooter"], type: "inanimate_object", hints: ["Self-balancing two-wheeled motorized personal transport board"] }
      ]
    }
  };

  // Active word registry (loaded from data/words.json or fallback)
  let categoriesRegistry = DEFAULT_WORDS_REGISTRY;

  // ============ STATE ============
  let secret = null;
  let currentSecretItem = null;
  let secretCategory = null;
  let questionCount = 0;
  let gameOver = false;
  let busy = false;
  let guessMode = false;
  let activeCategory = null;
  let sfxEnabled = true;
  let roundStartTime = Date.now();
  let clueUsed = false;
  let sessionPlayedSecrets = [];

  // Dossier & View State
  let activeConsoleTab = "chat";
  let dossierFacts = {
    yes: [],
    no: [],
    sometimes: [],
    unsure: []
  };

  // Avatar controller instance
  let avatar = null;

  // ============ DOM ELEMENTS ============
  const chatFeed = document.getElementById("chatFeed");
  const dossierPanel = document.getElementById("dossierPanel");
  const tabChatLog = document.getElementById("tabChatLog");
  const tabDossier = document.getElementById("tabDossier");
  const dossierCountBadge = document.getElementById("dossierCountBadge");

  // Dossier Summary Stats Elements
  const statTotalQuestions = document.getElementById("statTotalQuestions");
  const statYesCount = document.getElementById("statYesCount");
  const statNoCount = document.getElementById("statNoCount");
  const statSometimesCount = document.getElementById("statSometimesCount");

  // Dossier Category Counters & Lists
  const dossierYesCount = document.getElementById("dossierYesCount");
  const dossierNoCount = document.getElementById("dossierNoCount");
  const dossierSometimesCount = document.getElementById("dossierSometimesCount");
  const dossierUnsureCount = document.getElementById("dossierUnsureCount");

  const dossierListYes = document.getElementById("dossierListYes");
  const dossierListNo = document.getElementById("dossierListNo");
  const dossierListSometimes = document.getElementById("dossierListSometimes");
  const dossierListUnsure = document.getElementById("dossierListUnsure");

  const gameInput = document.getElementById("gameInput");
  const askBtn = document.getElementById("askBtn");
  const guessBtn = document.getElementById("guessBtn");
  const giveUpBtn = document.getElementById("giveUpBtn");
  const intelBtn = document.getElementById("intelBtn");
  const commandDeck = document.getElementById("commandDeck");
  const counterText = document.getElementById("counterText");
  const trackerSlots = document.getElementById("trackerSlots");
  const activeSecretBadge = document.getElementById("activeSecretBadge");
  const secretCategoryLabel = document.getElementById("secretCategoryLabel");
  const headerActiveCategory = document.getElementById("headerActiveCategory");

  // Deck Modal & Header Controls
  const startPlayBtn = document.getElementById("startPlayBtn");
  const soundToggleBtn = document.getElementById("soundToggleBtn");
  const soundToggleIcon = document.getElementById("soundToggleIcon");
  const changeDeckBtn = document.getElementById("changeDeckBtn");
  const activeDeckNamePill = document.getElementById("activeDeckNamePill");
  const deckModal = document.getElementById("deckModal");
  const closeDeckModalBtn = document.getElementById("closeDeckModalBtn");
  const deckCards = document.querySelectorAll(".deck-select-card");

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
      case "start":
        playTone(392.00, "square", 0.08, 0, 0.08);    // G4
        playTone(523.25, "square", 0.08, 0.07, 0.08); // C5
        playTone(659.25, "square", 0.08, 0.14, 0.08); // E5
        playTone(783.99, "square", 0.22, 0.21, 0.1);  // G5
        break;
      case "click":
        playTone(600, "sine", 0.04, 0, 0.08);
        break;
      case "think":
        playTone(440, "sine", 0.06, 0, 0.06);
        playTone(660, "sine", 0.08, 0.06, 0.06);
        break;
      case "intel":
        playTone(587.33, "triangle", 0.1, 0, 0.1);    // D5
        playTone(739.99, "triangle", 0.1, 0.08, 0.1); // F#5
        playTone(880.00, "triangle", 0.15, 0.16, 0.1); // A5
        playTone(1174.66, "sine", 0.25, 0.24, 0.12);  // D6
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

  function isCorrectGuess(guess, target, aliases = []) {
    if (checkSingleMatch(guess, target)) return true;
    if (Array.isArray(aliases)) {
      for (const alias of aliases) {
        if (checkSingleMatch(guess, alias)) return true;
      }
    }
    return false;
  }

  function checkSingleMatch(guess, target) {
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

  function addAnswerBubble(answer, confidence = "high", latencyMs = null, reaction = "neutral") {
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

    if (reaction && reaction !== "neutral") {
      const reactBadge = document.createElement("span");
      reactBadge.className = `badge-reaction ${escapeHtml(reaction.toLowerCase())}`;
      const labels = {
        laugh: "😂 AMUSED",
        blush: "♥ FLUSHED",
        shocked: "⚡ SCANDALOUS",
        smug: "😎 SMUG",
        "side-eye": "👀 SUSPICIOUS"
      };
      reactBadge.textContent = labels[reaction.toLowerCase()] || reaction.toUpperCase();
      wrap.appendChild(reactBadge);
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

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function addIncorrectGuessBubble(guess) {
    const div = document.createElement("div");
    div.className = "bubble bot guess-reject";

    const wrap = document.createElement("div");
    wrap.className = "answer-tag-wrap";

    const badge = document.createElement("span");
    badge.className = "badge-answer no";
    badge.textContent = "INCORRECT";

    const hesBadge = document.createElement("span");
    hesBadge.className = "badge-hesitant";
    hesBadge.style.background = "#FF5C5C";
    hesBadge.style.color = "#0A090D";
    hesBadge.textContent = "GUESS REJECTED";

    const desc = document.createElement("div");
    desc.className = "guess-feedback-desc";
    desc.innerHTML = `Target identity is <strong>NOT</strong> &ldquo;${escapeHtml(guess)}&rdquo;. Continue questioning!`;

    wrap.appendChild(badge);
    wrap.appendChild(hesBadge);
    div.appendChild(wrap);
    div.appendChild(desc);

    chatFeed.appendChild(div);
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }

  function addIntelBubble(clueText, latencyMs = null) {
    const div = document.createElement("div");
    div.className = "bubble bot intel-bubble";

    const header = document.createElement("div");
    header.className = "intel-header";

    const tag = document.createElement("span");
    tag.className = "badge-answer sometimes";
    tag.style.fontSize = "11px";
    tag.style.padding = "2px 8px";
    tag.textContent = "📡 SATELLITE INTEL";

    const code = document.createElement("span");
    code.className = "intel-code";
    code.textContent = `COST: 2 INQUIRIES ${latencyMs ? `// ${latencyMs}ms` : ""}`;

    header.appendChild(tag);
    header.appendChild(code);

    const body = document.createElement("div");
    body.className = "intel-body";
    body.innerHTML = `&ldquo;${escapeHtml(clueText)}&rdquo;`;

    div.appendChild(header);
    div.appendChild(body);

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

  function updateIntelButtonState() {
    if (!intelBtn) return;
    if (clueUsed) {
      intelBtn.disabled = true;
      intelBtn.classList.add("intel-spent");
      intelBtn.innerHTML = "<span>📡 INTEL DEPLETED</span>";
      intelBtn.title = "Satellite intel has already been utilized for this session";
    } else {
      intelBtn.classList.remove("intel-spent");
      intelBtn.innerHTML = "<span>📡 INTEL (-2Q)</span>";
      intelBtn.title = "Consumes 2 inquiry slots for a classified satellite clue";
      intelBtn.disabled = busy || gameOver || secret === null;
    }
  }

  function setInputEnabled(enabled) {
    gameInput.disabled = !enabled;
    askBtn.disabled = !enabled;
    guessBtn.disabled = !enabled;
    giveUpBtn.disabled = !enabled;
    updateIntelButtonState();
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
    const formatted = (name || "STANDBY").toUpperCase();
    if (headerActiveCategory) {
      headerActiveCategory.textContent = formatted;
    }
    if (activeDeckNamePill) {
      activeDeckNamePill.textContent = name ? formatted : "STANDBY // NONE";
    }
    document.querySelectorAll(".deck-select-card").forEach(btn => {
      btn.classList.toggle("active-deck", btn.dataset.category === name);
    });
  }

  // ============ EVIDENCE DOSSIER CONTROLLER ============
  function renderDossier() {
    const total = dossierFacts.yes.length + dossierFacts.no.length + dossierFacts.sometimes.length + dossierFacts.unsure.length;

    if (dossierCountBadge) dossierCountBadge.textContent = total;
    if (statTotalQuestions) statTotalQuestions.textContent = total;
    if (statYesCount) statYesCount.textContent = dossierFacts.yes.length;
    if (statNoCount) statNoCount.textContent = dossierFacts.no.length;
    if (statSometimesCount) statSometimesCount.textContent = dossierFacts.sometimes.length;

    if (dossierYesCount) dossierYesCount.textContent = dossierFacts.yes.length;
    if (dossierNoCount) dossierNoCount.textContent = dossierFacts.no.length;
    if (dossierSometimesCount) dossierSometimesCount.textContent = dossierFacts.sometimes.length;
    if (dossierUnsureCount) dossierUnsureCount.textContent = dossierFacts.unsure.length;

    renderDossierSection(dossierListYes, dossierFacts.yes, "✓", "No confirmed traits yet");
    renderDossierSection(dossierListNo, dossierFacts.no, "✕", "No ruled out traits yet");
    renderDossierSection(dossierListSometimes, dossierFacts.sometimes, "◐", "No conditional traits");
    renderDossierSection(dossierListUnsure, dossierFacts.unsure, "?", "None");
  }

  function renderDossierSection(container, list, icon, emptyMsg) {
    if (!container) return;
    if (list.length === 0) {
      container.innerHTML = `<div class="dossier-empty">${emptyMsg}</div>`;
      return;
    }
    container.innerHTML = list.map(item => `
      <div class="dossier-item" title="Question #${item.num}">
        <span class="dossier-item-icon">${icon}</span>
        <div class="dossier-item-text">
          <span class="dossier-item-num">#${item.num}</span>
          <span>${escapeHtml(item.question)}</span>
        </div>
      </div>
    `).join("");
  }

  function setConsoleTab(tabName) {
    activeConsoleTab = tabName;
    if (tabChatLog) tabChatLog.classList.toggle("active", tabName === "chat");
    if (tabDossier) tabDossier.classList.toggle("active", tabName === "dossier");
    if (chatFeed) chatFeed.style.display = tabName === "chat" ? "flex" : "none";
    if (dossierPanel) dossierPanel.style.display = tabName === "dossier" ? "flex" : "none";
    if (tabName === "chat" && chatFeed) {
      chatFeed.scrollTop = chatFeed.scrollHeight;
    }
  }

  // ============ GAME LOOP ============
  function calculateScore(won, questionsUsed, elapsedSec) {
    if (!won) {
      const consolation = questionsUsed * 10;
      return {
        rank: "D",
        rankLabel: "UNRESOLVED",
        baseBonus: 0,
        efficiencyBonus: 0,
        speedBonus: 0,
        totalScore: consolation,
        questionsUsed,
        elapsedSec
      };
    }

    const baseBonus = 1000;
    const remainingQuestions = Math.max(0, MAX_QUESTIONS - questionsUsed);
    const efficiencyBonus = remainingQuestions * 50;

    // Speed bonus: up to 300 points if finished under 2 minutes (120s)
    const speedBonus = Math.max(0, Math.round(Math.max(0, 120 - elapsedSec) * 2.5));
    const totalScore = baseBonus + efficiencyBonus + speedBonus;

    let rank = "C";
    let rankLabel = "PHOTO FINISH";

    if (questionsUsed <= 5) {
      rank = "S";
      rankLabel = "MASTER SLEUTH";
    } else if (questionsUsed <= 10) {
      rank = "A";
      rankLabel = "SHARP DETECTIVE";
    } else if (questionsUsed <= 15) {
      rank = "B";
      rankLabel = "FIELD OPERATIVE";
    }

    return {
      rank,
      rankLabel,
      baseBonus,
      efficiencyBonus,
      speedBonus,
      totalScore,
      questionsUsed,
      elapsedSec
    };
  }

  function openDeckModal() {
    playSfx("click");
    if (deckModal) deckModal.classList.add("open");
  }

  function closeDeckModal() {
    if (deckModal) deckModal.classList.remove("open");
  }

  function showStandbyScreen() {
    secret = null;
    currentSecretItem = null;
    secretCategory = null;
    gameOver = true;
    setInputEnabled(false);
    setGuessMode(false);

    if (activeSecretBadge) {
      activeSecretBadge.textContent = "?? [SELECT DECK TO PLAY] ??";
      activeSecretBadge.style.background = "var(--paper-dim)";
      activeSecretBadge.style.color = "var(--ink)";
    }
    if (secretCategoryLabel) secretCategoryLabel.textContent = "CATEGORY: NONE";
    if (headerActiveCategory) headerActiveCategory.textContent = "STANDBY";
    if (activeDeckNamePill) activeDeckNamePill.textContent = "STANDBY // NONE";
    if (startPlayBtn) startPlayBtn.innerHTML = `<span>▶ PLAY GAME</span>`;

    chatFeed.innerHTML = `
      <div class="deck-welcome-hero">
        <div class="welcome-stamp">ARCADE READY // 20 QUESTIONS</div>
        <div class="welcome-title">ORACLE-ZERO IS ONLINE</div>
        <p class="welcome-desc">
          A classified secret identity will be mounted to your virtual forehead. Interrogate ORACLE-ZERO using 20 yes/no questions to deduce what you are.
        </p>
        <button id="heroStartBtn" class="command-btn btn-ask hero-play-btn" type="button">
          <span>▶ START GAME // CHOOSE DECK</span>
        </button>
      </div>
    `;

    const heroBtn = document.getElementById("heroStartBtn");
    if (heroBtn) {
      heroBtn.addEventListener("click", () => {
        openDeckModal();
      });
    }

    avatar.setState("idle");
  }

  async function startRound(name, silent = false) {
    let selectedCat = name || "random";
    const catKeys = Object.keys(categoriesRegistry);

    if (selectedCat === "random") {
      selectedCat = catKeys[Math.floor(Math.random() * catKeys.length)];
    }

    if (!silent) playSfx("start");
    closeDeckModal();

    // Prepare temporary calibration loading state
    questionCount = 0;
    gameOver = false;
    activeCategory = selectedCat;
    roundStartTime = Date.now();
    setInputEnabled(false);
    setGuessMode(false);
    updateTracker();
    avatar.setState("thinking");

    if (activeSecretBadge) {
      activeSecretBadge.textContent = "?? [SYNTHESIZING SECRET...] ??";
      activeSecretBadge.style.background = "#38225C";
      activeSecretBadge.style.color = "#FFFFFF";
    }
    if (secretCategoryLabel) secretCategoryLabel.textContent = `CATEGORY: ${selectedCat.toUpperCase()}`;
    if (headerActiveCategory) headerActiveCategory.textContent = "SYNTHESIZING...";
    if (activeDeckNamePill) activeDeckNamePill.textContent = selectedCat.toUpperCase();

    // Reset Dossier state
    dossierFacts = { yes: [], no: [], sometimes: [], unsure: [] };
    renderDossier();
    setConsoleTab("chat");

    chatFeed.innerHTML = "";
    const synthBubble = addBubble(`CALIBRATING ORACLE: Conjuring a unique secret identity for category "${selectedCat.toUpperCase()}"...`, "thinking");

    let secretItem = null;
    let isAiGenerated = false;

    try {
      secretItem = await generateAISecret(selectedCat, "normal", sessionPlayedSecrets);
      isAiGenerated = true;
    } catch (err) {
      console.warn("AI Dynamic secret generation unavailable or offline, falling back to local registry:", err.message);
      const catData = categoriesRegistry[selectedCat] || categoriesRegistry.objects;
      if (catData && catData.items && catData.items.length > 0) {
        const available = catData.items.filter(item => {
          const n = typeof item === "string" ? item : item.name;
          return !sessionPlayedSecrets.includes(n);
        });
        const pool = available.length > 0 ? available : catData.items;
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        secretItem = typeof chosen === "string"
          ? { name: chosen, aliases: [], difficulty: "normal", type: "item", hints: [], category: selectedCat }
          : { ...chosen, category: selectedCat };
      }
    }

    synthBubble.remove();

    if (!secretItem) {
      addBubble("ERROR: Unable to initialize secret identity. Please check your API key in Settings.", "system");
      showStandbyScreen();
      return;
    }

    secret = secretItem.name;
    currentSecretItem = secretItem;
    secretCategory = secretItem.category || selectedCat;
    sessionPlayedSecrets.push(secret);

    // Announce protocol engaged
    if (isAiGenerated) {
      addBubble(`PROTOCOL ENGAGED: Target category "${secretCategory.toUpperCase()}". ORACLE-ZERO has dynamically synthesized a fresh secret to your virtual forehead (${secretItem.latencyMs}ms). Ask yes/no questions, or press "GUESS" when ready.`, "system");
    } else {
      addBubble(`PROTOCOL ENGAGED: Target category "${secretCategory.toUpperCase()}". Secret identity mounted from local archive. Ask yes/no questions, or press "GUESS" when ready.`, "system");
    }

    if (activeSecretBadge) {
      activeSecretBadge.textContent = "?? [CLASSIFIED] ??";
      activeSecretBadge.style.background = "var(--paper-dim)";
      activeSecretBadge.style.color = "var(--ink)";
    }
    if (secretCategoryLabel) secretCategoryLabel.textContent = `CATEGORY: ${secretCategory.toUpperCase()}`;
    if (startPlayBtn) startPlayBtn.innerHTML = `<span>🗂 NEW DECK</span>`;

    setActiveCategoryChip(selectedCat);
    setGuessMode(false);
    clueUsed = false;
    setInputEnabled(true);
    updateIntelButtonState();
    updateTracker();
    avatar.setState("idle");
    gameInput.focus();
  }

  function endGame(won) {
    gameOver = true;
    setInputEnabled(false);
    setGuessMode(false);
    updateTracker();

    const elapsedSec = Math.max(1, Math.round((Date.now() - roundStartTime) / 1000));
    const scoreData = calculateScore(won, questionCount, elapsedSec);

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
        ${currentSecretItem?.difficulty ? `<span class="badge-hesitant" style="font-size: 10px; margin-left: 8px;">${currentSecretItem.difficulty.toUpperCase()}</span>` : ""}
      </div>

      <!-- Performance Scorecard -->
      <div class="scorecard-wrap">
        <div class="scorecard-header">
          <span class="scorecard-title">SESSION EVALUATION</span>
          <div class="scorecard-rank-badge rank-${scoreData.rank.toLowerCase()}">
            RANK ${scoreData.rank} // ${scoreData.rankLabel}
          </div>
        </div>
        <div class="scorecard-grid">
          <div class="scorecard-row">
            <span>INQUIRIES USED:</span>
            <span class="scorecard-val-points">${scoreData.questionsUsed} / ${MAX_QUESTIONS}</span>
          </div>
          <div class="scorecard-row">
            <span>TIME ELAPSED:</span>
            <span class="scorecard-val-points">${scoreData.elapsedSec}s</span>
          </div>
          ${won ? `
          <div class="scorecard-row">
            <span>BASE CLEAR BONUS:</span>
            <span class="scorecard-val-points">+${scoreData.baseBonus} PTS</span>
          </div>
          <div class="scorecard-row">
            <span>EFFICIENCY BONUS (${MAX_QUESTIONS - scoreData.questionsUsed} REMAINING):</span>
            <span class="scorecard-val-points">+${scoreData.efficiencyBonus} PTS</span>
          </div>
          <div class="scorecard-row">
            <span>SPEED BONUS:</span>
            <span class="scorecard-val-points">+${scoreData.speedBonus} PTS</span>
          </div>
          ` : `
          <div class="scorecard-row">
            <span>PARTICIPATION CONSOLATION:</span>
            <span class="scorecard-val-points">+${scoreData.totalScore} PTS</span>
          </div>
          `}
          <div class="scorecard-row scorecard-total-row">
            <span>FINAL SCORE:</span>
            <span class="scorecard-total-points">${scoreData.totalScore.toLocaleString()} PTS</span>
          </div>
        </div>
      </div>

      <div class="result-actions-row">
        <button id="rematchBtn" class="header-btn btn-active-purple" style="padding: 12px 20px; font-size: 12px;">
          ↺ PLAY AGAIN (${secretCategory.toUpperCase()})
        </button>
        <button id="chooseDeckAfterGameBtn" class="header-btn" style="padding: 12px 20px; font-size: 12px;">
          🗂 CHOOSE NEW DECK
        </button>
      </div>
    `;

    chatFeed.appendChild(card);
    chatFeed.scrollTop = chatFeed.scrollHeight;

    const rematchBtn = card.querySelector("#rematchBtn");
    if (rematchBtn) rematchBtn.addEventListener("click", () => startRound(secretCategory));

    const chooseDeckBtn = card.querySelector("#chooseDeckAfterGameBtn");
    if (chooseDeckBtn) chooseDeckBtn.addEventListener("click", () => openDeckModal());
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

      addAnswerBubble(result.answer, result.confidence, result.latencyMs, result.reaction);

      // Play audio cue
      const key = (result.answer || "").toLowerCase();
      if (key === "yes") playSfx("yes");
      else if (key === "no") playSfx("no");
      else playSfx("unsure");

      // Update avatar facial state
      avatar.respondToAnswer(result.answer, result.confidence, result.latencyMs, result.reaction);

      // Record to Evidence Dossier
      const normalizedKey = ["yes", "no", "sometimes", "unsure"].includes(key) ? key : "unsure";
      dossierFacts[normalizedKey].push({
        question: question,
        confidence: result.confidence,
        num: questionCount
      });
      renderDossier();

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

    const aliases = currentSecretItem?.aliases || [];
    if (isCorrectGuess(guess, secret, aliases)) {
      endGame(true);
    } else {
      playSfx("no");
      avatar.setState("no-high");
      addIncorrectGuessBubble(guess);
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

  async function handleRequestIntel() {
    if (clueUsed || busy || gameOver || secret === null) return;

    playSfx("intel");
    avatar.setState("intel");

    clueUsed = true;
    // Consumes 2 inquiries
    questionCount = Math.min(MAX_QUESTIONS, questionCount + 2);
    updateTracker();
    updateIntelButtonState();
    setBusy(true);

    const thinking = addBubble("CALIBRATING SATELLITE SCAN... (0s)", "thinking");
    let elapsed = 0;
    const ticker = setInterval(() => {
      elapsed++;
      thinking.textContent = `CALIBRATING SATELLITE SCAN... (${elapsed}s)`;
    }, 1000);

    // Compile summary of known facts to feed the prompt
    const confirmed = (dossierFacts.yes || []).map(f => f.question).join(", ");
    const ruledOut = (dossierFacts.no || []).map(f => f.question).join(", ");
    const summary = `Confirmed: [${confirmed || "None"}]. Ruled Out: [${ruledOut || "None"}].`;

    try {
      const result = await askAIClue(secret, secretCategory, summary);
      clearInterval(ticker);
      thinking.remove();

      addIntelBubble(result.clue, result.latencyMs);

      // Record to Evidence Dossier as classified intel
      dossierFacts.sometimes.push({
        question: `[📡 INTEL] ${result.clue}`,
        confidence: "high",
        num: questionCount
      });
      renderDossier();

    } catch (err) {
      clearInterval(ticker);
      thinking.remove();
      console.error("Intel error:", err);
      addBubble(`INTEL TRANSMISSION FAILED: ${err.message}`, "system");
      // Refund 2 inquiries if API request failed
      questionCount = Math.max(0, questionCount - 2);
      clueUsed = false;
      updateTracker();
      updateIntelButtonState();
      avatar.setState("unsure");
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
    if (soundToggleIcon) soundToggleIcon.textContent = sfxEnabled ? "🔊" : "🔇";
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
    // Console Navigation Tabs (Log vs Dossier)
    if (tabChatLog) {
      tabChatLog.addEventListener("click", () => {
        playSfx("click");
        setConsoleTab("chat");
      });
    }

    if (tabDossier) {
      tabDossier.addEventListener("click", () => {
        playSfx("click");
        setConsoleTab("dossier");
      });
    }

    // Deck Selection Modal Open/Close
    if (startPlayBtn) startPlayBtn.addEventListener("click", openDeckModal);
    if (changeDeckBtn) changeDeckBtn.addEventListener("click", openDeckModal);
    if (closeDeckModalBtn) closeDeckModalBtn.addEventListener("click", closeDeckModal);

    if (deckModal) {
      deckModal.addEventListener("click", e => {
        if (e.target === deckModal) closeDeckModal();
      });
    }

    // Deck Cards selection
    deckCards.forEach(card => {
      card.addEventListener("click", () => {
        const cat = card.dataset.category;
        startRound(cat);
      });
    });

    // Custom Dynamic Topic selection
    const customTopicInput = document.getElementById("customTopicInput");
    const customTopicBtn = document.getElementById("customTopicBtn");

    function handleCustomTopicSubmit() {
      if (!customTopicInput) return;
      const topic = customTopicInput.value.trim();
      if (!topic) return;
      customTopicInput.value = "";
      startRound(topic);
    }

    if (customTopicBtn) {
      customTopicBtn.addEventListener("click", handleCustomTopicSubmit);
    }
    if (customTopicInput) {
      customTopicInput.addEventListener("keydown", e => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleCustomTopicSubmit();
        }
      });
    }

    // Sound quick toggle in header
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener("click", () => {
        sfxEnabled = !sfxEnabled;
        setStorage(STORAGE_KEY_SFX, sfxEnabled ? "true" : "false");
        if (sfxToggle) sfxToggle.checked = sfxEnabled;
        if (soundToggleIcon) soundToggleIcon.textContent = sfxEnabled ? "🔊" : "🔇";
        if (sfxEnabled) playSfx("click");
      });
    }

    // Action buttons
    askBtn.addEventListener("click", handleAsk);
    guessBtn.addEventListener("click", handleGuess);
    giveUpBtn.addEventListener("click", handleGiveUp);
    if (intelBtn) intelBtn.addEventListener("click", handleRequestIntel);

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

  // ============ MODULAR WORD REGISTRY (PHASE 4.1) ============
  async function loadWordRegistry() {
    try {
      const res = await fetch("data/words.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.categories && Object.keys(data.categories).length > 0) {
        categoriesRegistry = data.categories;
        console.log("✓ Modular word pool loaded from data/words.json:", Object.keys(categoriesRegistry).length, "categories");
        return;
      }
      throw new Error("Invalid structure in data/words.json");
    } catch (err) {
      console.warn("Using bundled offline word registry fallback:", err.message);
      categoriesRegistry = DEFAULT_WORDS_REGISTRY;
    }
  }

  // ============ INITIALIZATION ============
  async function initGame() {
    avatar = new OracleAvatar("oracleAvatarContainer");
    loadSettings();
    await loadWordRegistry();
    bindEvents();
    showStandbyScreen();
  }

  document.addEventListener("DOMContentLoaded", initGame);
})();
