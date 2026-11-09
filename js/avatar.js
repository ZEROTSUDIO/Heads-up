/**
 * OracleAvatar - Expressive Neobrutalist AI Mascot Controller
 * Manages reactive facial expressions, SVG state changes, animations, and confidence telemetry.
 */

class OracleAvatar {
  constructor(containerId = "oracleAvatarContainer") {
    this.container = document.getElementById(containerId);
    this.idleTimer = null;
    this.currentState = "idle";
    this.init();
  }

  init() {
    if (!this.container) return;
    this.container.innerHTML = this.getSvgMarkup();
    this.faceEl = document.getElementById("oracleSvgFace");
    this.statusTextEl = document.getElementById("avatarStatusText");
    this.confBarEl = document.getElementById("avatarConfBar");
    this.confLabelEl = document.getElementById("avatarConfLabel");
    this.latencyEl = document.getElementById("avatarLatency");
    this.setState("idle");
  }

  getSvgMarkup() {
    return `
      <div class="avatar-stage">
        <svg id="oracleSvgFace" class="oracle-svg state-idle" viewBox="0 0 160 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="inkShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="3" dy="3" stdDeviation="0" flood-color="#0A090D" />
            </filter>
            <linearGradient id="violetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#C06BF0" />
              <stop offset="100%" stop-color="#7C3AED" />
            </linearGradient>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FCD34D" />
              <stop offset="100%" stop-color="#F59E0B" />
            </linearGradient>
          </defs>

          <!-- Floating decorative telemetry badges -->
          <g class="avatar-decorations">
            <rect x="8" y="10" width="22" height="6" fill="#0A090D" rx="1"/>
            <text x="10" y="15" fill="#FFFFFF" font-family="'Space Mono', monospace" font-size="4" font-weight="700">01</text>
            <circle cx="146" cy="14" r="3" fill="#7C3AED" stroke="#0A090D" stroke-width="1.2"/>
            <circle cx="146" cy="14" r="1.2" fill="#FFFFFF" class="decor-ping"/>
          </g>

          <!-- Antenna Mast & Glowing Orb -->
          <g class="avatar-antenna" id="avatarAntenna">
            <line x1="80" y1="36" x2="80" y2="18" stroke="#0A090D" stroke-width="3" stroke-linecap="round"/>
            <circle cx="80" cy="14" r="7" fill="#7C3AED" stroke="#0A090D" stroke-width="2.5" class="antenna-bulb"/>
            <circle cx="80" cy="14" r="2.8" fill="#FFFFFF" class="antenna-core"/>
            <!-- Antenna pulse ring -->
            <circle cx="80" cy="14" r="10" fill="none" stroke="#C06BF0" stroke-width="1.5" class="antenna-ring" opacity="0"/>
          </g>

          <!-- Head Chassis with Neobrutalist Shadow -->
          <g class="avatar-head-chassis">
            <!-- Shadow plate -->
            <rect x="29" y="39" width="102" height="92" rx="20" fill="#0A090D" />
            <!-- Main chassis box -->
            <rect x="26" y="36" width="102" height="92" rx="20" fill="#FFFFFF" stroke="#0A090D" stroke-width="3" />
            <!-- Top brand strip -->
            <path d="M 27 52 L 127 52" stroke="#0A090D" stroke-width="2" />
            <rect x="36" y="42" width="20" height="5" fill="#0A090D" rx="1"/>
            <text x="38" y="46" fill="#C06BF0" font-family="'Space Mono', monospace" font-size="3.5" font-weight="700">ORACLE</text>
            <!-- Ears / Side bolts -->
            <rect x="18" y="68" width="8" height="26" rx="2" fill="#F4F1FA" stroke="#0A090D" stroke-width="2.5" />
            <line x1="22" y1="74" x2="22" y2="88" stroke="#0A090D" stroke-width="2" />
            <rect x="128" y="68" width="8" height="26" rx="2" fill="#F4F1FA" stroke="#0A090D" stroke-width="2.5" />
            <line x1="132" y1="74" x2="132" y2="88" stroke="#0A090D" stroke-width="2" />
          </g>

          <!-- Electronic Screen Visor (Midnight Ink) -->
          <g class="avatar-visor">
            <rect x="36" y="58" width="82" height="60" rx="12" fill="#0A0812" stroke="#0A090D" stroke-width="2.5" />
            <!-- Visor Scanlines Grid (Subtle) -->
            <line x1="38" y1="70" x2="116" y2="70" stroke="#1F1535" stroke-width="1" />
            <line x1="38" y1="82" x2="116" y2="82" stroke="#1F1535" stroke-width="1" />
            <line x1="38" y1="94" x2="116" y2="94" stroke="#1F1535" stroke-width="1" />
            <line x1="38" y1="106" x2="116" y2="106" stroke="#1F1535" stroke-width="1" />
          </g>

          <!-- Facial Features Group (Swapped via CSS & Classes) -->
          <g class="avatar-face-elements" id="avatarFaceGroup">
            <!-- 1. Eyebrows -->
            <g class="face-brows" id="faceBrows">
              <!-- Left Brow -->
              <path id="browLeft" class="brow" d="M 46 69 Q 55 68 64 69" stroke="#DDD6FE" stroke-width="2.8" stroke-linecap="round" fill="none"/>
              <!-- Right Brow -->
              <path id="browRight" class="brow" d="M 90 69 Q 99 68 108 69" stroke="#DDD6FE" stroke-width="2.8" stroke-linecap="round" fill="none"/>
            </g>

            <!-- 2. Eyes -->
            <g class="face-eyes" id="faceEyes">
              <!-- Left Eye Group -->
              <g id="eyeLeftGroup" class="eye-group">
                <!-- Standard Eye (Idle / Normal) -->
                <rect class="eye-standard eye-left" x="50" y="74" width="14" height="18" rx="7" fill="#C06BF0" stroke="#FFFFFF" stroke-width="1"/>
                <circle class="eye-pupil eye-left-pupil" cx="57" cy="80" r="3" fill="#0A0812"/>
                <!-- Curved Happy Eye (^ shape) -->
                <path class="eye-happy eye-left-happy" d="M 48 84 Q 57 73 66 84" stroke="#4EE085" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0"/>
                <!-- Angled Stern Eye (\ shape) -->
                <line class="eye-stern eye-left-stern" x1="48" y1="77" x2="66" y2="83" stroke="#FF5C5C" stroke-width="3.5" stroke-linecap="round" opacity="0"/>
                <!-- Confused Spiral/Question Eye -->
                <text class="eye-unsure eye-left-unsure" x="51" y="88" fill="#FCD34D" font-family="'Space Mono', monospace" font-size="16" font-weight="700" opacity="0">?</text>
                <!-- Dizzy X Eye -->
                <g class="eye-dead eye-left-dead" opacity="0">
                  <line x1="50" y1="75" x2="64" y2="89" stroke="#FF5C5C" stroke-width="3" stroke-linecap="round"/>
                  <line x1="64" y1="75" x2="50" y2="89" stroke="#FF5C5C" stroke-width="3" stroke-linecap="round"/>
                </g>
                <!-- Star Eyes (Victory) -->
                <polygon class="eye-star eye-left-star" points="57,74 59,79 64,79 60,82 62,87 57,84 52,87 54,82 50,79 55,79" fill="#FCD34D" opacity="0"/>
              </g>

              <!-- Right Eye Group -->
              <g id="eyeRightGroup" class="eye-group">
                <!-- Standard Eye (Idle / Normal) -->
                <rect class="eye-standard eye-right" x="90" y="74" width="14" height="18" rx="7" fill="#C06BF0" stroke="#FFFFFF" stroke-width="1"/>
                <circle class="eye-pupil eye-right-pupil" cx="97" cy="80" r="3" fill="#0A0812"/>
                <!-- Curved Happy Eye (^ shape) -->
                <path class="eye-happy eye-right-happy" d="M 88 84 Q 97 73 106 84" stroke="#4EE085" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0"/>
                <!-- Angled Stern Eye (/ shape) -->
                <line class="eye-stern eye-right-stern" x1="88" y1="83" x2="106" y2="77" stroke="#FF5C5C" stroke-width="3.5" stroke-linecap="round" opacity="0"/>
                <!-- Confused Spiral/Question Eye -->
                <text class="eye-unsure eye-right-unsure" x="91" y="88" fill="#FCD34D" font-family="'Space Mono', monospace" font-size="16" font-weight="700" opacity="0">?</text>
                <!-- Dizzy X Eye -->
                <g class="eye-dead eye-right-dead" opacity="0">
                  <line x1="90" y1="75" x2="104" y2="89" stroke="#FF5C5C" stroke-width="3" stroke-linecap="round"/>
                  <line x1="104" y1="75" x2="90" y2="89" stroke="#FF5C5C" stroke-width="3" stroke-linecap="round"/>
                </g>
                <!-- Star Eyes (Victory) -->
                <polygon class="eye-star eye-right-star" points="97,74 99,79 104,79 100,82 102,87 97,84 92,87 94,82 90,79 95,79" fill="#FCD34D" opacity="0"/>
              </g>
            </g>

            <!-- 3. Cheek Lights (LED indicators) -->
            <g class="face-cheeks">
              <circle id="cheekLeft" cx="44" cy="98" r="3.5" fill="#38225C" stroke="#0A090D" stroke-width="1"/>
              <circle id="cheekRight" cx="110" cy="98" r="3.5" fill="#38225C" stroke="#0A090D" stroke-width="1"/>
            </g>

            <!-- 4. Mouths (Swapped based on state) -->
            <g class="face-mouths" id="faceMouth">
              <!-- Neutral / Idle Mouth -->
              <rect class="mouth-idle" x="66" y="102" width="22" height="4" rx="2" fill="#DDD6FE" />
              <!-- Wide Happy Grin (Yes / Win) -->
              <path class="mouth-happy" d="M 64 100 Q 77 114 90 100 Z" fill="#4EE085" stroke="#FFFFFF" stroke-width="1" opacity="0" />
              <!-- Stern Frown (No) -->
              <path class="mouth-frown" d="M 64 108 Q 77 97 90 108" stroke="#FF5C5C" stroke-width="3" stroke-linecap="round" fill="none" opacity="0" />
              <!-- Thinking Sine Wave (Analyzing) -->
              <path class="mouth-thinking" d="M 62 103 Q 69 98 77 103 T 92 103" stroke="#C06BF0" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0" />
              <!-- Zigzag Squiggle (Unsure / Confused) -->
              <path class="mouth-unsure" d="M 63 104 L 70 99 L 77 105 L 84 100 L 91 104" stroke="#FCD34D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0" />
              <!-- Dead Flat Line (Lose) -->
              <line class="mouth-dead" x1="65" y1="105" x2="89" y2="105" stroke="#FF5C5C" stroke-width="3" stroke-linecap="round" opacity="0" />
            </g>
          </g>
        </svg>

        <!-- Live Telemetry readout under character -->
        <div class="avatar-telemetry-bar">
          <div class="telemetry-item">
            <span class="telemetry-label">STATUS</span>
            <span id="avatarStatusText" class="telemetry-value">ONLINE // IDLE</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">CONFIDENCE</span>
            <div class="telemetry-gauge-wrap">
              <div id="avatarConfBar" class="telemetry-gauge-fill" style="width: 100%;"></div>
            </div>
            <span id="avatarConfLabel" class="telemetry-subval">100% HIGH</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">PING</span>
            <span id="avatarLatency" class="telemetry-value">--ms</span>
          </div>
        </div>
      </div>
    `;
  }

  setState(stateName, details = {}) {
    this.currentState = stateName;
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    if (!this.faceEl) return;

    // Reset base classes
    this.faceEl.className = `oracle-svg state-${stateName}`;

    // Update Telemetry Display
    const { answer, confidence, latencyMs } = details;

    switch (stateName) {
      case "thinking":
        if (this.statusTextEl) this.statusTextEl.textContent = "EVALUATING...";
        if (this.confLabelEl) this.confLabelEl.textContent = "CALCULATING...";
        if (this.confBarEl) {
          this.confBarEl.style.width = "40%";
          this.confBarEl.className = "telemetry-gauge-fill pulse-violet";
        }
        break;

      case "yes-high":
        if (this.statusTextEl) this.statusTextEl.textContent = "AFFIRMATIVE [YES]";
        if (this.confLabelEl) this.confLabelEl.textContent = "100% HIGH";
        if (this.confBarEl) {
          this.confBarEl.style.width = "100%";
          this.confBarEl.className = "telemetry-gauge-fill fill-green";
        }
        this.scheduleIdleReset(4500);
        break;

      case "yes-low":
        if (this.statusTextEl) this.statusTextEl.textContent = "HESITANT YES";
        if (this.confLabelEl) this.confLabelEl.textContent = "50% LOW";
        if (this.confBarEl) {
          this.confBarEl.style.width = "50%";
          this.confBarEl.className = "telemetry-gauge-fill fill-amber";
        }
        this.scheduleIdleReset(4500);
        break;

      case "no-high":
        if (this.statusTextEl) this.statusTextEl.textContent = "NEGATIVE [NO]";
        if (this.confLabelEl) this.confLabelEl.textContent = "100% HIGH";
        if (this.confBarEl) {
          this.confBarEl.style.width = "100%";
          this.confBarEl.className = "telemetry-gauge-fill fill-red";
        }
        this.scheduleIdleReset(4500);
        break;

      case "no-low":
        if (this.statusTextEl) this.statusTextEl.textContent = "HESITANT NO";
        if (this.confLabelEl) this.confLabelEl.textContent = "50% LOW";
        if (this.confBarEl) {
          this.confBarEl.style.width = "50%";
          this.confBarEl.className = "telemetry-gauge-fill fill-amber";
        }
        this.scheduleIdleReset(4500);
        break;

      case "sometimes":
        if (this.statusTextEl) this.statusTextEl.textContent = "SOMETIMES // CONDITIONAL";
        if (this.confLabelEl) this.confLabelEl.textContent = confidence === "high" ? "85% CERTAIN" : "40% PARTIAL";
        if (this.confBarEl) {
          this.confBarEl.style.width = "70%";
          this.confBarEl.className = "telemetry-gauge-fill fill-lilac";
        }
        this.scheduleIdleReset(4500);
        break;

      case "unsure":
        if (this.statusTextEl) this.statusTextEl.textContent = "UNSURE // AMBIGUOUS";
        if (this.confLabelEl) this.confLabelEl.textContent = "0% LOW";
        if (this.confBarEl) {
          this.confBarEl.style.width = "15%";
          this.confBarEl.className = "telemetry-gauge-fill fill-amber";
        }
        this.scheduleIdleReset(4500);
        break;

      case "win":
        if (this.statusTextEl) this.statusTextEl.textContent = "VICTORY // TARGET CONFIRMED!";
        if (this.confLabelEl) this.confLabelEl.textContent = "100% ACCURACY";
        if (this.confBarEl) {
          this.confBarEl.style.width = "100%";
          this.confBarEl.className = "telemetry-gauge-fill fill-green";
        }
        break;

      case "lose":
        if (this.statusTextEl) this.statusTextEl.textContent = "SESSION TERMINATED";
        if (this.confLabelEl) this.confLabelEl.textContent = "0% REMAINING";
        if (this.confBarEl) {
          this.confBarEl.style.width = "0%";
          this.confBarEl.className = "telemetry-gauge-fill";
        }
        break;

      case "idle":
      default:
        if (this.statusTextEl) this.statusTextEl.textContent = "ONLINE // READY";
        if (this.confLabelEl) this.confLabelEl.textContent = "STANDBY";
        if (this.confBarEl) {
          this.confBarEl.style.width = "100%";
          this.confBarEl.className = "telemetry-gauge-fill fill-purple";
        }
        break;
    }

    if (latencyMs && this.latencyEl) {
      this.latencyEl.textContent = `${latencyMs}ms`;
    }
  }

  scheduleIdleReset(delayMs = 4000) {
    this.idleTimer = setTimeout(() => {
      this.setState("idle");
    }, delayMs);
  }

  respondToAnswer(answer, confidence = "high", latencyMs = null) {
    const ansKey = (answer || "unsure").toLowerCase();
    const isHigh = confidence === "high";

    if (ansKey === "yes") {
      this.setState(isHigh ? "yes-high" : "yes-low", { answer, confidence, latencyMs });
    } else if (ansKey === "no") {
      this.setState(isHigh ? "no-high" : "no-low", { answer, confidence, latencyMs });
    } else if (ansKey === "sometimes") {
      this.setState("sometimes", { answer, confidence, latencyMs });
    } else {
      this.setState("unsure", { answer, confidence, latencyMs });
    }
  }
}

// Global Avatar Singleton
window.OracleAvatar = OracleAvatar;
