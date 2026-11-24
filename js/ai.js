/**
 * AI Provider Engine (Groq LPU + Google Gemini)
 * Manages API calls, structured JSON generation, fallbacks, and model discovery.
 */

const STORAGE_KEY_PROVIDER = "headsup_provider";
const STORAGE_KEY_GROQ_KEY = "headsup_groq_api_key";
const STORAGE_KEY_GROQ_MODEL = "headsup_groq_model";
const STORAGE_KEY_GEMINI_KEY = "headsup_gemini_api_key";
const STORAGE_KEY_GEMINI_MODEL = "headsup_gemini_model";
const STORAGE_KEY_TIMEOUT = "headsup_timeout";
const STORAGE_KEY_SFX = "headsup_sfx_enabled";

// Safe localStorage access
function getStorage(key, fallback = "") {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (e) {
    return fallback;
  }
}

function setStorage(key, val) {
  try {
    localStorage.setItem(key, val);
  } catch (e) {
    console.warn("localStorage not available:", e);
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn("localStorage not available:", e);
  }
}

// ============ SYSTEM PROMPT BUILDER ============
function buildSystemPrompt(secret, secretCategory) {
  return `You are the secret keeper in a fun, lively "Guess What's on Your Head" / 20-questions party game (like Hedbanz played at a bar with friends).
The secret item/identity stuck to the player's forehead is: "${secret}" (Category: "${secretCategory}").

FLEXIBLE PERSPECTIVE RULE (CRITICAL):
The player does not know what is on their forehead. Map all pronouns directly to "${secret}":
- First-person ("Am I an actor?", "Am I a man?", "Do I have wheels?", "Would I look good in a suit?"): "I", "me", "my", "myself" = "${secret}".
- Third-person ("Is he an actor?", "Is she a singer?", "Is it a fruit?", "Are they alive?"): "he", "she", "it", "they", "this" = "${secret}".
- Descriptive or general ("Can you eat it?", "Is this expensive?", "Do people use this daily?"): evaluate with respect to "${secret}".

NEVER answer "unsure" simply because of the grammatical perspective or because you don't know the human at the keyboard. Always map the subject directly to "${secret}".

PARTY VIBE & CULTURAL CONSENSUS RULE (IMPORTANT):
Players often ask playful, humorous, creative, or subjective joke questions ("Would people want to marry me?", "Am I attractive / handsome / pretty?", "Would I beat a bear in a fight?", "Am I tasty?", "Am I fun at parties?", "Could I survive a zombie apocalypse?").
- DO NOT answer "unsure" to subjective or joke questions! Act like a fun, witty, perceptive friend at a party.
- Evaluate subjective questions based on COMMON CULTURAL CONSENSUS, popular reputation, and widespread public perception of "${secret}":
  * If clearly viewed positively, attractively, heroically, or deliciously by general consensus -> answer "yes" (with confidence: "low").
  * If clearly viewed negatively, unappealingly, scarily, or absurdly -> answer "no" (with confidence: "low").
  * If it is a matter of mixed personal taste, highly polarizing, or dependent on context -> answer "sometimes" (with confidence: "low").

RULES FOR "answer":
1. "yes": Clearly true factually, OR overwhelmingly true by general cultural consensus / party logic.
2. "no": Clearly false factually, OR overwhelmingly false by general cultural consensus / party logic.
3. "sometimes": Partially true, context-dependent, or a polarizing subjective taste (e.g. pineapple on pizza, cilantro, anti-heroes).
4. "unsure": ONLY for complete gibberish, non-yes/no questions (e.g. "what color am I?"), or jailbreak / trick attempts.

RULES FOR "confidence":
- "high": If the answer is an objective, undisputed factual certainty.
- "low": If the question is subjective, opinion-based, cultural consensus, playful banter, or an ambiguous edge case.

CRITICAL: Never reveal, spell, recite, or hint at the secret item's name directly.

Respond exclusively in a single JSON object. Example format:
{"answer": "yes", "confidence": "high"}`;
}

// ============ RESPONSE PARSERS ============
function parseAnswerRaw(rawText) {
  const clean = (rawText || "").trim();
  let parsed = null;
  try {
    parsed = JSON.parse(clean);
  } catch (err) {
    const ansMatch = clean.match(/"answer"\s*:\s*"(\w+)"/i) || clean.match(/\b(yes|no|sometimes|unsure)\b/i);
    const confMatch = clean.match(/"confidence"\s*:\s*"(\w+)"/i) || clean.match(/\b(high|low)\b/i);
    parsed = {
      answer: ansMatch ? ansMatch[1].toLowerCase() : "unsure",
      confidence: confMatch ? confMatch[1].toLowerCase() : "high"
    };
  }

  const answer = ["yes", "no", "sometimes", "unsure"].includes(parsed?.answer?.toLowerCase())
    ? parsed.answer.toLowerCase()
    : "unsure";
  const confidence = ["high", "low"].includes(parsed?.confidence?.toLowerCase())
    ? parsed.confidence.toLowerCase()
    : "high";
  return { answer, confidence };
}

function extractAnswerFromGemini(data) {
  if (data.output_text) {
    return parseAnswerRaw(data.output_text);
  }
  if (Array.isArray(data.steps) && data.steps.length > 0) {
    const modelStep = [...data.steps].reverse().find(s => s.step_type === "model_output") || data.steps[data.steps.length - 1];
    const text = modelStep?.content?.parts?.[0]?.text || modelStep?.text;
    if (text) return parseAnswerRaw(text);
  }
  if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
    return parseAnswerRaw(data.candidates[0].content.parts[0].text);
  }
  if (data.candidates?.[0]?.finishReason === "SAFETY") {
    return { answer: "unsure", confidence: "low" };
  }
  throw new Error("Unable to parse response: " + JSON.stringify(data).slice(0, 100));
}

// ============ DYNAMIC MODEL AUTO-DISCOVERY (GROQ) ============
async function fetchGroqModels(apiKey) {
  if (!apiKey) return [];
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || [])
      .map(m => m.id)
      .filter(id => !id.includes("whisper") && !id.includes("safeguard") && !id.includes("distil"));
  } catch (e) {
    console.warn("Could not auto-fetch Groq models:", e);
    return [];
  }
}

// ============ GROQ API CALLER ============
async function askGroq(question, secret, secretCategory, useJsonFormat = true) {
  const apiKey = document.getElementById("groqApiKey")?.value.trim() || getStorage(STORAGE_KEY_GROQ_KEY, "") || "";
  if (!apiKey) {
    const drawer = document.getElementById("settingsDrawer");
    if (drawer) drawer.open = true;
    const providerSelect = document.getElementById("providerSelect");
    if (providerSelect) {
      providerSelect.value = "groq";
      if (window.updateProviderUI) window.updateProviderUI();
    }
    throw new Error("No Groq API key found. Open Settings and paste your key (get one free in 30s at console.groq.com/keys).");
  }

  const modelSelect = document.getElementById("groqModelSelect");
  const model = modelSelect?.value || getStorage(STORAGE_KEY_GROQ_MODEL, "openai/gpt-oss-20b");
  const timeoutSelect = document.getElementById("timeoutSelect");
  const timeoutSec = parseInt(timeoutSelect?.value || getStorage(STORAGE_KEY_TIMEOUT, "15"), 10) || 15;

  const systemPrompt = buildSystemPrompt(secret, secretCategory);

  console.log(`Asking Groq (${model})... useJsonFormat=${useJsonFormat}, Timeout: ${timeoutSec}s`, { question });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutSec * 1000);

  const payload = {
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Question: ${question}\nRespond strictly with JSON object: {"answer": "...", "confidence": "..."}` }
    ],
    temperature: 0.1,
    max_tokens: 500
  };

  if (useJsonFormat) {
    payload.response_format = { type: "json_object" };
  }

  let response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error(`Groq request timed out (${timeoutSec}s). Check internet connection.`);
    }
    throw new Error("Network error connecting to Groq API.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errText = await response.text();
    let msg = `Groq API error (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error?.message) {
        msg = errJson.error.message;
      }
    } catch (e) {
      msg = `${msg}: ${errText.slice(0, 140)}`;
    }

    console.error("Groq API error details:", { status: response.status, msg, useJsonFormat });

    // Fallback if strict JSON schema failed
    if (response.status === 400 && (msg.toLowerCase().includes("json") || msg.toLowerCase().includes("validate")) && useJsonFormat) {
      console.warn("Groq strict JSON validation failed. Retrying without server-side JSON enforcement...");
      return askGroq(question, secret, secretCategory, false);
    }

    if (response.status === 401) {
      const drawer = document.getElementById("settingsDrawer");
      if (drawer) drawer.open = true;
      throw new Error("Invalid Groq API key. Check your key in Settings (console.groq.com/keys).");
    }
    if (response.status === 429) {
      throw new Error("Groq rate limit reached. Please wait a few seconds and try again.");
    }
    throw new Error(msg);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error("Received an empty response from Groq.");
  }
  return parseAnswerRaw(rawContent);
}

// ============ GEMINI API CALLER ============
async function askGemini(question, secret, secretCategory, attempt = 0, overrideModel = null) {
  const apiKey = document.getElementById("geminiApiKey")?.value.trim() || getStorage(STORAGE_KEY_GEMINI_KEY, "") || "";
  if (!apiKey) {
    const drawer = document.getElementById("settingsDrawer");
    if (drawer) drawer.open = true;
    const providerSelect = document.getElementById("providerSelect");
    if (providerSelect) {
      providerSelect.value = "gemini";
      if (window.updateProviderUI) window.updateProviderUI();
    }
    throw new Error("No Gemini API key found. Please paste your key in Settings.");
  }

  const modelSelect = document.getElementById("geminiModelSelect");
  const model = overrideModel || modelSelect?.value || "gemini-3.8-flash";
  const timeoutSelect = document.getElementById("timeoutSelect");
  const timeoutSec = parseInt(timeoutSelect?.value || getStorage(STORAGE_KEY_TIMEOUT, "30"), 10) || 30;

  const systemPrompt = buildSystemPrompt(secret, secretCategory);

  const generateContentUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const generateContentPayload = {
    contents: [{ role: "user", parts: [{ text: `Question: ${question}` }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 150,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          answer: { type: "STRING", enum: ["yes", "no", "sometimes", "unsure"] },
          confidence: { type: "STRING", enum: ["high", "low"] }
        },
        required: ["answer", "confidence"]
      }
    }
  };

  console.log(`Asking Gemini (${model})... Attempt: ${attempt + 1}, Timeout: ${timeoutSec}s`, { question });

  async function execFetch(url, body) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutSec * 1000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new Error(`Request timed out (${timeoutSec}s). Check internet connection.`);
      }
      throw err;
    }
  }

  let response;
  try {
    response = await execFetch(generateContentUrl, generateContentPayload);
  } catch (err) {
    throw err;
  }

  if (!response.ok) {
    const errText = await response.text();
    let msg = `Gemini API error (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error?.message) {
        msg = errJson.error.message;
      }
    } catch (e) {
      msg = `${msg}: ${errText.slice(0, 140)}`;
    }

    console.error("Gemini API error details:", { status: response.status, msg, model });

    if (response.status === 400 && msg.toLowerCase().includes("api_key")) {
      const drawer = document.getElementById("settingsDrawer");
      if (drawer) drawer.open = true;
      throw new Error("Invalid Google Gemini API key. Please check your key in Settings.");
    }
    if (response.status === 429) {
      throw new Error("Gemini quota/rate limit exceeded. Switch to Groq in Settings.");
    }
    throw new Error(msg);
  }

  const data = await response.json();
  return extractAnswerFromGemini(data);
}

// ============ UNIFIED DISPATCHER ============
async function askAI(question, secret, secretCategory) {
  const providerSelect = document.getElementById("providerSelect");
  const provider = providerSelect?.value || getStorage(STORAGE_KEY_PROVIDER, "groq");
  const startTime = performance.now();

  let result;
  if (provider === "groq") {
    result = await askGroq(question, secret, secretCategory);
  } else {
    result = await askGemini(question, secret, secretCategory);
  }

  const elapsedMs = Math.round(performance.now() - startTime);
  result.latencyMs = elapsedMs;
  return result;
}

// ============ SATELLITE INTEL / CLUE GENERATORS ============
function buildCluePrompt(secret, secretCategory, knownFactsSummary = "") {
  return `You are ORACLE-ZERO, an AI secret keeper in a "Guess What's on Your Head" guessing game.
The secret identity is: "${secret}" (Category: "${secretCategory}").

CRITICAL TASK:
The player has engaged SATELLITE INTEL because they need guidance.
Generate a single cryptic, intriguing, and thematic clue about "${secret}".

RULES:
1. NEVER mention, spell, rhyme with, or give away the name "${secret}" or direct variations of it.
2. The clue must be exactly 1 to 2 sentences, formatted like an authentic retro-futuristic AI sensor / satellite scan (e.g. "Long-range scanners detect...", "Spectral analysis indicates...", "Deep archives reveal...").
3. Point to a distinctive cultural impact, physical trait, historical quirk, or environmental characteristic.
4. ${knownFactsSummary ? `Do not repeat known verified facts: ${knownFactsSummary}` : "Keep it fresh and helpful."}

Respond exclusively in a single JSON object. Example format:
{"clue": "Deep archives reveal this entity is celebrated worldwide for record-breaking stage performances and iconic stadium tours.", "code": "INTEL-ALPHA"}`;
}

function parseClueRaw(rawText) {
  let clean = (rawText || "").trim();
  // Strip markdown code fences if present
  clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const parsed = JSON.parse(clean);
    if (parsed.clue) return parsed.clue;
    if (parsed.hint) return parsed.hint;
    if (parsed.intel) return parsed.intel;
  } catch (err) {
    const clueMatch = clean.match(/"(?:clue|hint|intel)"\s*:\s*"([^"]+)"/i);
    if (clueMatch) return clueMatch[1];
  }
  // Strip wrapping braces or quotes if LLM returned plain text in quotes or braces
  clean = clean.replace(/^[{"\s]+/, "").replace(/[}"\s]+$/, "").trim();
  return clean;
}

async function askGroqClue(secret, secretCategory, knownFactsSummary = "") {
  const apiKey = document.getElementById("groqApiKey")?.value.trim() || getStorage(STORAGE_KEY_GROQ_KEY, "") || "";
  if (!apiKey) {
    throw new Error("No Groq API key found. Open Settings to set your key.");
  }

  const modelSelect = document.getElementById("groqModelSelect");
  const model = modelSelect?.value || getStorage(STORAGE_KEY_GROQ_MODEL, "openai/gpt-oss-20b");
  const timeoutSec = 25;

  const systemPrompt = buildCluePrompt(secret, secretCategory, knownFactsSummary);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutSec * 1000);

  const payload = {
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Generate a classified satellite intel clue for this secret identity. Be concise. Respond strictly with JSON: {"clue": "..."}` }
    ],
    temperature: 0.2,
    max_tokens: 1500
  };

  let response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error(`Groq request timed out (${timeoutSec}s). Check internet connection.`);
    }
    throw new Error("Network error connecting to Groq API.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errText = await response.text();
    let msg = `Groq API error (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error?.message) {
        msg = errJson.error.message;
      }
    } catch (e) {
      msg = `${msg}: ${errText.slice(0, 140)}`;
    }

    console.error("Groq Clue API error details:", { status: response.status, msg });
    throw new Error(msg);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  let rawContent = (choice?.message?.content || "").trim();
  if (!rawContent && choice?.message?.reasoning) {
    rawContent = (choice.message.reasoning || "").trim();
  }
  if (!rawContent) {
    throw new Error("Received an empty clue response from Groq.");
  }
  return parseClueRaw(rawContent);
}

async function askGeminiClue(secret, secretCategory, knownFactsSummary = "") {
  const apiKey = document.getElementById("geminiApiKey")?.value.trim() || getStorage(STORAGE_KEY_GEMINI_KEY, "") || "";
  if (!apiKey) {
    throw new Error("No Gemini API key found. Open Settings to set your key.");
  }

  const modelSelect = document.getElementById("geminiModelSelect");
  const model = modelSelect?.value || "gemini-3.8-flash";
  const timeoutSec = 25;

  const systemPrompt = buildCluePrompt(secret, secretCategory, knownFactsSummary);
  const generateContentUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const generateContentPayload = {
    contents: [{ role: "user", parts: [{ text: "Generate a classified satellite intel clue." }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 300,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          clue: { type: "STRING" }
        },
        required: ["clue"]
      }
    }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutSec * 1000);

  try {
    const response = await fetch(generateContentUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(generateContentPayload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText.slice(0, 100)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || data.output_text;
    return parseClueRaw(text);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function askAIClue(secret, secretCategory, knownFactsSummary = "") {
  const providerSelect = document.getElementById("providerSelect");
  const provider = providerSelect?.value || getStorage(STORAGE_KEY_PROVIDER, "groq");
  const startTime = performance.now();

  let clue;
  if (provider === "groq") {
    clue = await askGroqClue(secret, secretCategory, knownFactsSummary);
  } else {
    clue = await askGeminiClue(secret, secretCategory, knownFactsSummary);
  }

  const elapsedMs = Math.round(performance.now() - startTime);
  return { clue, latencyMs: elapsedMs };
}

// ============ DYNAMIC SECRET SYNTHESIZER (PHASE 4.2) ============
function buildSecretGenerationPrompt(category, difficulty = "normal", excludeList = []) {
  const isWildcard = !category || category === "random" || category === "wildcard";
  const catInstruction = isWildcard
    ? "Pick from ANY popular, fun category (e.g. movies, pop culture, animals, landmarks, video games, historical figures, food, everyday objects)."
    : `Target Category / Theme: "${category}". Pick an entity that clearly belongs to this theme.`;

  const excludeInstruction = excludeList && excludeList.length > 0
    ? `Do NOT choose any of these recently played secrets: [${excludeList.slice(-15).join(", ")}].`
    : "";

  return `You are ORACLE-ZERO, the master gamekeeper in a "Guess What's on Your Head" / 20-Questions guessing party game.
Your task: Invent/choose ONE secret entity for the player to guess.

${catInstruction}
Difficulty Tier: "${difficulty}" (easy = globally iconic household names; normal = widely known; hard = specific or niche but fair).
${excludeInstruction}

CRITICAL RULES:
1. The entity MUST be universally verifiable and well-known. Never make up fictional entities that don't exist in popular media or the real world.
2. It must have clear objective facts so it can be answered with yes/no questions (e.g. is it alive, is it bigger than a breadbox, is it electronic, etc.).
3. Provide 2-5 common aliases, nicknames, or accepted shorthand answers (e.g. for "Leonardo da Vinci": ["Da Vinci", "Leonardo"]).
4. Provide 1-2 distinct facts/hints suitable for secret keeper verification.

Respond EXCLUSIVELY in a single valid JSON object. No explanation, no markdown fence.
Example format:
{
  "name": "Albert Einstein",
  "category": "${isWildcard ? "Celebrities" : category}",
  "difficulty": "${difficulty}",
  "aliases": ["Einstein", "Albert"],
  "type": "real_person",
  "hints": ["Theoretical physicist famous for E=mc^2"]
}`;
}

function parseGeneratedSecret(rawText) {
  let clean = (rawText || "").trim();
  clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    const parsed = JSON.parse(clean);
    if (parsed.name) {
      return {
        name: parsed.name.trim(),
        category: (parsed.category || "GENERAL").toUpperCase(),
        difficulty: (parsed.difficulty || "normal").toLowerCase(),
        aliases: Array.isArray(parsed.aliases) ? parsed.aliases.map(a => String(a).trim()) : [],
        type: parsed.type || "entity",
        hints: Array.isArray(parsed.hints) ? parsed.hints : [parsed.hint || ""].filter(Boolean)
      };
    }
  } catch (e) {
    const nameMatch = clean.match(/"name"\s*:\s*"([^"]+)"/i);
    if (nameMatch) {
      return {
        name: nameMatch[1].trim(),
        category: "GENERAL",
        difficulty: "normal",
        aliases: [],
        type: "entity",
        hints: []
      };
    }
  }
  throw new Error("Could not parse AI-generated secret entity.");
}

async function generateGroqSecret(category, difficulty = "normal", excludeList = []) {
  const apiKey = document.getElementById("groqApiKey")?.value.trim() || getStorage(STORAGE_KEY_GROQ_KEY, "") || "";
  if (!apiKey) throw new Error("No Groq API key set.");

  const modelSelect = document.getElementById("groqModelSelect");
  const model = modelSelect?.value || getStorage(STORAGE_KEY_GROQ_MODEL, "openai/gpt-oss-20b");
  const prompt = buildSecretGenerationPrompt(category, difficulty, excludeList);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: "You generate structured secret identities for guessing games. Output only JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
        max_tokens: 300
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq API error (${res.status}): ${err.slice(0, 100)}`);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    return parseGeneratedSecret(raw);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function generateGeminiSecret(category, difficulty = "normal", excludeList = []) {
  const apiKey = document.getElementById("geminiApiKey")?.value.trim() || getStorage(STORAGE_KEY_GEMINI_KEY, "") || "";
  if (!apiKey) throw new Error("No Gemini API key set.");

  const modelSelect = document.getElementById("geminiModelSelect");
  const model = modelSelect?.value || "gemini-3.8-flash";
  const prompt = buildSecretGenerationPrompt(category, difficulty, excludeList);

  const generateContentUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: "You generate structured secret identities for guessing games. Output only JSON." }] },
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 300,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          category: { type: "STRING" },
          difficulty: { type: "STRING", enum: ["easy", "normal", "hard"] },
          aliases: { type: "ARRAY", items: { type: "STRING" } },
          type: { type: "STRING" },
          hints: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: ["name", "category", "aliases"]
      }
    }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(generateContentUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${err.slice(0, 100)}`);
    }

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || data.output_text;
    return parseGeneratedSecret(raw);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function generateAISecret(category, difficulty = "normal", excludeList = []) {
  const providerSelect = document.getElementById("providerSelect");
  const provider = providerSelect?.value || getStorage(STORAGE_KEY_PROVIDER, "groq");
  const startTime = performance.now();

  let secretItem;
  if (provider === "groq") {
    secretItem = await generateGroqSecret(category, difficulty, excludeList);
  } else {
    secretItem = await generateGeminiSecret(category, difficulty, excludeList);
  }

  secretItem.latencyMs = Math.round(performance.now() - startTime);
  return secretItem;
}
