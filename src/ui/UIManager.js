import { gameStore, DISCOVERY_ZONES } from '../state/gameStore.js';
import { audioEngine } from '../assets/procedural/AudioEngine.js';

/**
 * UIManager: Modern DOM HUD overlay, left-docked Start Screen, Pause/Settings menu,
 * raycast reticle, discovery notifications, and modal interfaces for Sandalwood Garden Estate.
 */
export class UIManager {
  constructor({ experience = null, container = null } = {}) {
    this.experience = experience;
    this.container =
      container ||
      (typeof document !== 'undefined'
        ? document.getElementById('ui-root') || document.body
        : null);

    this.toastTimer = null;
    this.lastDiscoveredCount = gameStore.getState().discoveredZones.length || 1;
    this.lastResetNonce = gameStore.getState().resetNonce || 0;
    this._lastChecklistKey = '';

    this._onKeyDown = this._onKeyDown.bind(this);
    this._unsubscribe = null;

    if (typeof document !== 'undefined') {
      this._injectStyles();
      this._buildDOM();
      this._bindEvents();
      this._unsubscribe = gameStore.subscribe((state, patch) => this.render(state, patch));
      this.render(gameStore.getState());
    }
  }

  _injectStyles() {
    if (document.getElementById('sandalwood-ui-styles')) return;

    const style = document.createElement('style');
    style.id = 'sandalwood-ui-styles';
    style.textContent = `
      :root {
        --color-bg-panel: rgba(24, 21, 18, 0.78);
        --color-bg-card: rgba(31, 27, 23, 0.86);
        --color-accent: #c49a6c;
        --color-accent-hover: #dfb382;
        --color-text-main: #f5f2eb;
        --color-text-muted: #b5aca0;
        --color-border: rgba(216, 202, 179, 0.24);
        --font-serif: 'Cormorant Garamond', Georgia, serif;
        --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      }

      .sandalwood-ui-root {
        position: fixed;
        inset: 0;
        pointer-events: none;
        user-select: none;
        font-family: var(--font-sans);
        color: var(--color-text-main);
        z-index: 100;
        overflow: hidden;
      }

      /* Left-docked Start / Welcome Overlay preserving crisp 3D garden + companions showcase */
      .sw-start-screen {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        padding: clamp(20px, 4vw, 56px);
        background: linear-gradient(
          90deg,
          rgba(14, 12, 10, 0.84) 0%,
          rgba(14, 12, 10, 0.48) 44%,
          rgba(14, 12, 10, 0.06) 100%
        );
        pointer-events: auto;
        transition: opacity 0.35s ease, visibility 0.35s ease;
      }

      .sw-start-card {
        background: rgba(26, 23, 20, 0.82);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid var(--color-border);
        border-radius: 16px;
        padding: 32px 34px;
        max-width: 452px;
        width: 100%;
        text-align: left;
        box-shadow: 0 24px 56px rgba(0, 0, 0, 0.55);
      }

      .sw-start-kicker {
        font-size: 11px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--color-accent);
        margin-bottom: 6px;
        font-weight: 600;
      }

      .sw-start-title {
        font-family: var(--font-serif);
        font-size: clamp(30px, 3vw, 38px);
        line-height: 1.08;
        font-weight: 600;
        letter-spacing: 0.02em;
        margin: 0 0 12px 0;
        color: #f7f4ed;
      }

      .sw-start-desc {
        font-size: 13.5px;
        line-height: 1.58;
        color: var(--color-text-muted);
        margin-bottom: 20px;
      }

      .sw-field-label {
        font-size: 11px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--color-text-muted);
        margin-bottom: 8px;
        font-weight: 600;
      }

      .sw-options-row {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        gap: 8px;
        margin-bottom: 16px;
      }

      .sw-pill-btn {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid var(--color-border);
        border-radius: 20px;
        padding: 7px 14px;
        font-size: 12.5px;
        color: var(--color-text-muted);
        cursor: pointer;
        transition: all 0.18s ease;
      }

      .sw-pill-btn.active,
      .sw-pill-btn:hover {
        background: rgba(196, 154, 108, 0.24);
        color: #fff;
        border-color: var(--color-accent);
      }

      .sw-btn-primary {
        background: var(--color-accent);
        color: #191512;
        border: none;
        border-radius: 10px;
        padding: 13px 22px;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.04em;
        cursor: pointer;
        width: 100%;
        margin-top: 6px;
        transition: background 0.2s ease, transform 0.15s ease;
      }

      .sw-btn-primary:hover {
        background: var(--color-accent-hover);
        transform: translateY(-1px);
      }

      .sw-btn-secondary {
        background: rgba(255, 255, 255, 0.07);
        color: var(--color-text-main);
        border: 1px solid var(--color-border);
        border-radius: 10px;
        padding: 10px 16px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease;
      }

      .sw-btn-secondary:hover {
        background: rgba(196, 154, 108, 0.2);
        border-color: var(--color-accent);
      }

      .sw-start-hint {
        margin-top: 12px;
        font-size: 11.5px;
        color: var(--color-text-muted);
        display: flex;
        justify-content: space-between;
        align-items: center;
        white-space: nowrap;
        gap: 10px;
      }

      /* Top HUD Bar */
      .sw-hud-top {
        position: absolute;
        top: 18px;
        left: 20px;
        right: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        pointer-events: none;
        transition: opacity 0.25s ease;
      }

      .sw-hud-title-group {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--color-bg-panel);
        border: 1px solid var(--color-border);
        backdrop-filter: blur(10px);
        padding: 8px 16px;
        border-radius: 30px;
        pointer-events: auto;
      }

      .sw-brand-name {
        font-family: var(--font-serif);
        font-size: 18px;
        font-weight: 600;
        letter-spacing: 0.03em;
        color: #f7f4ed;
      }

      .sw-zone-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12.5px;
        color: var(--color-accent);
        font-weight: 500;
        padding-left: 10px;
        border-left: 1px solid rgba(255, 255, 255, 0.16);
      }

      .sw-discovery-chip {
        font-size: 11.5px;
        color: var(--color-text-main);
        background: rgba(196, 154, 108, 0.18);
        border: 1px solid rgba(196, 154, 108, 0.38);
        border-radius: 12px;
        padding: 2px 9px;
      }

      .sw-hud-controls {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        pointer-events: auto;
      }

      .sw-hud-btn {
        background: var(--color-bg-panel);
        border: 1px solid var(--color-border);
        backdrop-filter: blur(10px);
        color: var(--color-text-main);
        padding: 7px 13px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        transition: background 0.18s ease, border-color 0.18s ease;
      }

      .sw-hud-btn:hover {
        background: rgba(48, 42, 36, 0.92);
        border-color: var(--color-accent);
      }

      /* Center Reticle */
      .sw-reticle-wrap {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
      }

      .sw-reticle-dot {
        width: 6px;
        height: 6px;
        background: rgba(255, 255, 255, 0.78);
        border-radius: 50%;
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.65);
        transition: transform 0.15s ease, background 0.15s ease;
      }

      .sw-reticle-dot.active {
        transform: scale(2.2);
        background: var(--color-accent);
        box-shadow: 0 0 10px var(--color-accent);
      }

      .sw-action-bubble {
        margin-top: 14px;
        background: var(--color-bg-panel);
        border: 1px solid var(--color-accent);
        border-radius: 20px;
        padding: 6px 14px;
        font-size: 12.5px;
        font-weight: 500;
        color: #fff;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
        opacity: 0;
        transform: translateY(4px);
        transition: opacity 0.2s ease, transform 0.2s ease;
      }

      .sw-action-bubble.visible {
        opacity: 1;
        transform: translateY(0);
      }

      /* Discovery Notification Toast */
      .sw-toast {
        position: absolute;
        bottom: 34px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: var(--color-bg-card);
        border: 1px solid var(--color-accent);
        border-radius: 12px;
        padding: 13px 24px;
        text-align: center;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease, transform 0.3s ease;
      }

      .sw-toast.visible {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      .sw-toast-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--color-accent);
        margin-bottom: 2px;
      }

      .sw-toast-title {
        font-family: var(--font-serif);
        font-size: 20px;
        font-weight: 600;
        color: #f7f4ed;
      }

      .sw-toast-progress {
        font-size: 12px;
        color: var(--color-text-muted);
        margin-top: 3px;
      }

      /* Modals (Help, Inspection, Pause / Settings) */
      .sw-modal-overlay {
        position: absolute;
        inset: 0;
        background: rgba(12, 10, 9, 0.78);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        pointer-events: auto;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.22s ease, visibility 0.22s ease;
      }

      .sw-modal-overlay.open {
        opacity: 1;
        visibility: visible;
      }

      .sw-modal-card {
        background: var(--color-bg-card);
        border: 1px solid var(--color-border);
        border-radius: 16px;
        padding: 26px 32px;
        max-width: 520px;
        width: 100%;
        max-height: 88vh;
        overflow-y: auto;
        box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6);
      }

      .sw-modal-card.wide {
        max-width: 780px;
      }

      .sw-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 18px;
      }

      .sw-modal-title {
        font-family: var(--font-serif);
        font-size: 26px;
        font-weight: 600;
        margin: 0;
        color: #f7f4ed;
      }

      .sw-close-btn {
        background: none;
        border: none;
        color: var(--color-text-muted);
        font-size: 22px;
        line-height: 1;
        cursor: pointer;
        padding: 4px 8px;
      }

      .sw-close-btn:hover {
        color: #fff;
      }

      .sw-controls-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px 18px;
        font-size: 13px;
        margin-bottom: 20px;
      }

      .sw-ctrl-item {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 6px;
      }

      .sw-key {
        font-weight: 600;
        color: var(--color-accent);
      }

      .sw-desc {
        color: var(--color-text-muted);
        text-align: right;
      }

      .sw-pause-grid {
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        gap: 24px;
      }

      .sw-setting-block {
        margin-bottom: 14px;
      }

      .sw-slider-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .sw-slider-row input[type='range'] {
        flex: 1;
        accent-color: var(--color-accent);
        cursor: pointer;
      }

      .sw-slider-val {
        min-width: 44px;
        font-size: 12px;
        color: var(--color-text-main);
        text-align: right;
      }

      .sw-actions-stack {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 12px;
      }

      .sw-zone-checklist {
        list-style: none;
        display: grid;
        grid-template-columns: 1fr;
        gap: 6px;
        font-size: 12.5px;
      }

      .sw-zone-checklist li {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.03);
        color: var(--color-text-muted);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .sw-zone-checklist li.discovered {
        color: #f7f4ed;
        border-color: rgba(196, 154, 108, 0.35);
        background: rgba(196, 154, 108, 0.12);
      }

      .sw-specs-list {
        list-style: disc;
        padding-left: 18px;
        margin: 0 0 18px 0;
        font-size: 13px;
        color: var(--color-text-muted);
        line-height: 1.5;
      }

      @media (max-width: 780px) {
        .sw-start-screen {
          justify-content: center;
          background: rgba(14, 12, 10, 0.72);
        }
        .sw-start-card {
          max-height: 90vh;
          overflow-y: auto;
          padding: 24px 22px;
        }
        .sw-controls-grid,
        .sw-pause-grid {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }

  _buildDOM() {
    this.root = document.createElement('div');
    this.root.className = 'sandalwood-ui-root';

    // 1. Left-Docked Start Screen
    this.startScreen = document.createElement('div');
    this.startScreen.className = 'sw-start-screen';
    this.startScreen.innerHTML = `
      <div class="sw-start-card">
        <div class="sw-start-kicker">Interactive 3D Architecture</div>
        <h1 class="sw-start-title">Sandalwood Garden Estate</h1>
        <p class="sw-start-desc">
          Explore an asymmetric two-story sandalwood residence set within an 80 &times; 70 m botanical garden,
          pool terrace, central staircase, and 12 furnished domestic zones.
        </p>

        <div class="sw-field-label">Select Companion Avatar</div>
        <div class="sw-options-row" id="sw-character-selector">
          <button class="sw-pill-btn active" data-char="female">Female (1.66 m)</button>
          <button class="sw-pill-btn" data-char="male">Male (1.78 m)</button>
        </div>

        <div class="sw-field-label">Graphics Fidelity</div>
        <div class="sw-options-row" id="sw-quality-selector">
          <button class="sw-pill-btn" data-quality="low">Low</button>
          <button class="sw-pill-btn active" data-quality="medium">Medium</button>
          <button class="sw-pill-btn" data-quality="high">High</button>
        </div>

        <button class="sw-btn-primary" id="sw-start-btn">Begin Architectural Tour</button>
        <div class="sw-start-hint">
          <span>WASD Walk &bull; Mouse Look &bull; E Interact</span>
          <span>? Controls &bull; Esc Settings</span>
        </div>
      </div>
    `;
    this.root.appendChild(this.startScreen);

    // 2. Top HUD Bar
    this.hudTop = document.createElement('div');
    this.hudTop.className = 'sw-hud-top';
    this.hudTop.innerHTML = `
      <div class="sw-hud-title-group">
        <div class="sw-brand-name">Sandalwood Estate</div>
        <div class="sw-zone-badge" id="sw-zone-badge">Flower Garden</div>
        <div class="sw-discovery-chip" id="sw-discovery-chip">1 / 12 Zones</div>
      </div>
      <div class="sw-hud-controls">
        <button class="sw-hud-btn" id="sw-time-btn" title="Cycle Day / Sunset / Night (T)">Day [T]</button>
        <button class="sw-hud-btn" id="sw-camera-btn" title="Toggle 1st / 3rd Person (V or C)">1st Person [V]</button>
        <button class="sw-hud-btn" id="sw-lamp-btn" title="Toggle Bedroom Lamps (L)">Lamps [L]</button>
        <button class="sw-hud-btn" id="sw-mute-btn" title="Mute / Unmute Audio (M)">Audio [M]</button>
        <button class="sw-hud-btn" id="sw-help-btn" title="Controls & Shortcuts (? or F1)">Controls [?]</button>
        <button class="sw-hud-btn" id="sw-settings-btn" title="Pause & Settings (Esc)">Settings [Esc]</button>
      </div>
    `;
    this.root.appendChild(this.hudTop);

    // 3. Center Reticle & Action Bubble
    this.reticleWrap = document.createElement('div');
    this.reticleWrap.className = 'sw-reticle-wrap';
    this.reticleWrap.innerHTML = `
      <div class="sw-reticle-dot" id="sw-reticle-dot"></div>
      <div class="sw-action-bubble" id="sw-action-bubble">E — Open Door</div>
    `;
    this.root.appendChild(this.reticleWrap);

    // 4. Discovery Notification Toast
    this.toast = document.createElement('div');
    this.toast.className = 'sw-toast';
    this.toast.innerHTML = `
      <div class="sw-toast-label" id="sw-toast-label">Area Discovered</div>
      <div class="sw-toast-title" id="sw-toast-title">Living Hall</div>
      <div class="sw-toast-progress" id="sw-toast-progress">1 / 12 zones explored</div>
    `;
    this.root.appendChild(this.toast);

    // 5. Pause & Settings Modal
    this.pauseModal = document.createElement('div');
    this.pauseModal.className = 'sw-modal-overlay';
    this.pauseModal.id = 'sw-pause-modal';
    this.pauseModal.innerHTML = `
      <div class="sw-modal-card wide">
        <div class="sw-modal-header">
          <h2 class="sw-modal-title">Estate Menu &amp; Settings</h2>
          <button class="sw-close-btn" id="sw-close-pause" aria-label="Resume">&times;</button>
        </div>
        <div class="sw-pause-grid">
          <div>
            <div class="sw-setting-block">
              <div class="sw-field-label">Time of Day</div>
              <div class="sw-options-row" id="sw-pause-time">
                <button class="sw-pill-btn" data-time="day">Day</button>
                <button class="sw-pill-btn" data-time="sunset">Sunset</button>
                <button class="sw-pill-btn" data-time="night">Night</button>
              </div>
            </div>

            <div class="sw-setting-block">
              <div class="sw-field-label">Weather Atmosphere</div>
              <div class="sw-options-row" id="sw-pause-weather">
                <button class="sw-pill-btn" data-weather="clear">Clear</button>
                <button class="sw-pill-btn" data-weather="cloud">Overcast</button>
                <button class="sw-pill-btn" data-weather="rain">Rain</button>
              </div>
            </div>

            <div class="sw-setting-block">
              <div class="sw-field-label">Avatar &amp; Graphics</div>
              <div class="sw-options-row" id="sw-pause-char">
                <button class="sw-pill-btn" data-char="female">Female (1.66 m)</button>
                <button class="sw-pill-btn" data-char="male">Male (1.78 m)</button>
              </div>
              <div class="sw-options-row" id="sw-pause-quality">
                <button class="sw-pill-btn" data-quality="low">Low</button>
                <button class="sw-pill-btn" data-quality="medium">Medium</button>
                <button class="sw-pill-btn" data-quality="high">High</button>
              </div>
            </div>

            <div class="sw-setting-block">
              <div class="sw-field-label">Mouse Sensitivity &amp; Y-Axis</div>
              <div class="sw-slider-row">
                <input type="range" id="sw-sens-slider" min="0.4" max="2.5" step="0.1" value="1.0" />
                <span class="sw-slider-val" id="sw-sens-val">1.0x</span>
                <button class="sw-pill-btn" id="sw-invert-y-btn">Invert Y: Off</button>
              </div>
            </div>

            <div class="sw-setting-block">
              <div class="sw-field-label">Ambient Audio Volume</div>
              <div class="sw-slider-row">
                <input type="range" id="sw-vol-slider" min="0" max="1" step="0.05" value="0.55" />
                <span class="sw-slider-val" id="sw-vol-val">55%</span>
                <button class="sw-pill-btn" id="sw-pause-mute-btn">Audio: On</button>
              </div>
            </div>

            <button class="sw-btn-primary" id="sw-resume-btn">Resume Exploration [Esc]</button>
            <div class="sw-actions-stack">
              <button class="sw-btn-secondary" id="sw-open-controls-btn">Controls [?]</button>
              <button class="sw-btn-secondary" id="sw-reset-btn">Reset Spawn</button>
              <button class="sw-btn-secondary" style="grid-column: span 2;" id="sw-title-btn">Return to Start Showcase</button>
            </div>
          </div>

          <div>
            <div class="sw-field-label" id="sw-checklist-heading">Estate Zones (1 / 12)</div>
            <ul class="sw-zone-checklist" id="sw-zone-checklist"></ul>
          </div>
        </div>
      </div>
    `;
    this.root.appendChild(this.pauseModal);

    // 6. Help / Controls Modal
    this.helpModal = document.createElement('div');
    this.helpModal.className = 'sw-modal-overlay';
    this.helpModal.id = 'sw-help-modal';
    this.helpModal.innerHTML = `
      <div class="sw-modal-card">
        <div class="sw-modal-header">
          <h2 class="sw-modal-title">Exploration Controls</h2>
          <button class="sw-close-btn" id="sw-close-help" aria-label="Close Controls">&times;</button>
        </div>
        <div class="sw-controls-grid">
          <div class="sw-ctrl-item"><span class="sw-key">W A S D / Arrows</span><span class="sw-desc">Walk</span></div>
          <div class="sw-ctrl-item"><span class="sw-key">Shift</span><span class="sw-desc">Sprint Outdoors</span></div>
          <div class="sw-ctrl-item"><span class="sw-key">Mouse Look</span><span class="sw-desc">Turn / Aim</span></div>
          <div class="sw-ctrl-item"><span class="sw-key">E / Left Click</span><span class="sw-desc">Interact / Sit</span></div>
          <div class="sw-ctrl-item"><span class="sw-key">V or C</span><span class="sw-desc">1st / 3rd Person</span></div>
          <div class="sw-ctrl-item"><span class="sw-key">Space / E</span><span class="sw-desc">Stand Up</span></div>
          <div class="sw-ctrl-item"><span class="sw-key">L</span><span class="sw-desc">Toggle Bedroom Lamps</span></div>
          <div class="sw-ctrl-item"><span class="sw-key">T</span><span class="sw-desc">Day / Sunset / Night</span></div>
          <div class="sw-ctrl-item"><span class="sw-key">M</span><span class="sw-desc">Mute Audio</span></div>
          <div class="sw-ctrl-item"><span class="sw-key">H</span><span class="sw-desc">Hide / Show HUD</span></div>
          <div class="sw-ctrl-item"><span class="sw-key">? / F1</span><span class="sw-desc">Toggle This Guide</span></div>
          <div class="sw-ctrl-item"><span class="sw-key">Esc</span><span class="sw-desc">Pause &amp; Settings</span></div>
        </div>
        <button class="sw-btn-primary" id="sw-resume-help-btn">Close Guide [Esc]</button>
      </div>
    `;
    this.root.appendChild(this.helpModal);

    // 7. Inspection Modal (TV, Utensils, Appliances)
    this.inspectionModal = document.createElement('div');
    this.inspectionModal.className = 'sw-modal-overlay';
    this.inspectionModal.id = 'sw-inspection-modal';
    this.inspectionModal.innerHTML = `
      <div class="sw-modal-card">
        <div class="sw-modal-header">
          <h2 class="sw-modal-title" id="sw-inspect-title">Item Inspection</h2>
          <button class="sw-close-btn" id="sw-close-inspect" aria-label="Close Inspection">&times;</button>
        </div>
        <div style="font-size: 12px; color: var(--color-accent); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;" id="sw-inspect-category">Furniture</div>
        <p style="font-size: 14px; line-height: 1.6; color: var(--color-text-muted); margin-bottom: 14px;" id="sw-inspect-desc">Description</p>
        <ul class="sw-specs-list" id="sw-inspect-specs"></ul>
        <button class="sw-btn-primary" id="sw-inspect-btn">Close [Esc]</button>
      </div>
    `;
    this.root.appendChild(this.inspectionModal);

    if (this.container) {
      this.container.appendChild(this.root);
    }
  }

  _bindEvents() {
    window.addEventListener('keydown', this._onKeyDown);

    // Start CTA
    this.root.querySelector('#sw-start-btn')?.addEventListener('click', () => {
      audioEngine.unlock();
      gameStore.setState({ screen: 'playing', activeOverlay: null });
      this.experience?.cameraController?.requestLock();
    });

    // Character selectors (Start screen + Pause modal)
    this.root
      .querySelectorAll('#sw-character-selector button, #sw-pause-char button')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const selectedCharacter = btn.getAttribute('data-char');
          if (selectedCharacter) gameStore.setState({ selectedCharacter });
        });
      });

    // Quality selectors (Start screen + Pause modal)
    this.root
      .querySelectorAll('#sw-quality-selector button, #sw-pause-quality button')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const quality = btn.getAttribute('data-quality');
          if (quality) gameStore.setState({ quality });
        });
      });

    // Pause time & weather selectors
    this.root.querySelectorAll('#sw-pause-time button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const timeOfDay = btn.getAttribute('data-time');
        if (timeOfDay) {
          gameStore.setState({ timeOfDay });
          audioEngine.playInteract();
        }
      });
    });

    this.root.querySelectorAll('#sw-pause-weather button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const weather = btn.getAttribute('data-weather');
        if (weather) {
          gameStore.setState({ weather });
          audioEngine.playInteract();
        }
      });
    });

    // Top HUD quick actions
    this.root.querySelector('#sw-time-btn')?.addEventListener('click', () => {
      const times = ['day', 'sunset', 'night'];
      const cur = gameStore.getState().timeOfDay;
      gameStore.setState({ timeOfDay: times[(times.indexOf(cur) + 1) % times.length] });
      audioEngine.playInteract();
    });

    this.root.querySelector('#sw-camera-btn')?.addEventListener('click', () => {
      gameStore.setState({ thirdPerson: !gameStore.getState().thirdPerson });
    });

    this.root.querySelector('#sw-lamp-btn')?.addEventListener('click', () => {
      const lamps = gameStore.getState().bedsideLamps;
      const nextOn = !(lamps.b1Left && lamps.b1Right && lamps.b2Left && lamps.b2Right);
      gameStore.setState({
        bedsideLamps: { b1Left: nextOn, b1Right: nextOn, b2Left: nextOn, b2Right: nextOn },
      });
      audioEngine.playInteract();
    });

    const toggleMute = () => {
      const state = gameStore.getState();
      const muted = !state.muted;
      gameStore.setState({ muted });
      audioEngine.setVolume(state.audioVolume, muted);
    };
    this.root.querySelector('#sw-mute-btn')?.addEventListener('click', toggleMute);
    this.root.querySelector('#sw-pause-mute-btn')?.addEventListener('click', toggleMute);

    // Sensitivity, Invert Y & Audio sliders
    this.root.querySelector('#sw-sens-slider')?.addEventListener('input', (e) => {
      const mouseSensitivity = parseFloat(e.target.value) || 1.0;
      gameStore.setState({ mouseSensitivity });
    });

    this.root.querySelector('#sw-invert-y-btn')?.addEventListener('click', () => {
      gameStore.setState({ invertY: !gameStore.getState().invertY });
    });

    this.root.querySelector('#sw-vol-slider')?.addEventListener('input', (e) => {
      const audioVolume = parseFloat(e.target.value);
      const vol = Number.isFinite(audioVolume) ? audioVolume : 0.55;
      const muted = vol === 0 ? true : gameStore.getState().muted;
      gameStore.setState({ audioVolume: vol, muted });
      audioEngine.setVolume(vol, muted);
    });

    // Help / Controls modal buttons (integrated cleanly into gameStore.activeOverlay)
    const setControlsOpen = (open) => {
      if (open) {
        this.experience?.cameraController?.releaseLock();
        gameStore.setState({ activeOverlay: 'controls' });
      } else {
        gameStore.setState({ activeOverlay: null });
      }
    };
    this.root.querySelector('#sw-help-btn')?.addEventListener('click', () => setControlsOpen(true));
    this.root
      .querySelector('#sw-open-controls-btn')
      ?.addEventListener('click', () => setControlsOpen(true));
    this.root.querySelector('#sw-close-help')?.addEventListener('click', () => setControlsOpen(false));
    this.root
      .querySelector('#sw-resume-help-btn')
      ?.addEventListener('click', () => setControlsOpen(false));

    // Pause / Settings buttons
    this.root.querySelector('#sw-settings-btn')?.addEventListener('click', () => {
      this.experience?.cameraController?.releaseLock();
      gameStore.setState({ screen: 'paused', activeOverlay: null });
    });

    const resumeGame = () => {
      gameStore.setState({ screen: 'playing', activeOverlay: null });
      this.experience?.cameraController?.requestLock();
    };
    this.root.querySelector('#sw-close-pause')?.addEventListener('click', resumeGame);
    this.root.querySelector('#sw-resume-btn')?.addEventListener('click', resumeGame);

    this.root.querySelector('#sw-reset-btn')?.addEventListener('click', () => {
      if (this.experience && typeof this.experience.reset === 'function') {
        this.experience.reset();
      } else {
        gameStore.resetExperience();
      }
      gameStore.setState({ screen: 'playing', activeOverlay: null });
    });

    this.root.querySelector('#sw-title-btn')?.addEventListener('click', () => {
      this.experience?.cameraController?.releaseLock();
      gameStore.setState({ screen: 'start', activeOverlay: null });
    });

    // Inspection modal dismiss
    const dismissInspect = () => gameStore.setState({ inspectionItem: null });
    this.root.querySelector('#sw-close-inspect')?.addEventListener('click', dismissInspect);
    this.root.querySelector('#sw-inspect-btn')?.addEventListener('click', dismissInspect);
  }

  _onKeyDown(e) {
    // Use '?' (Shift+Slash) or F1 for Help/Controls so KeyH cleanly toggles HUD visibility
    const isQuestionKey = e.key === '?' || (e.code === 'Slash' && e.shiftKey) || e.code === 'F1';
    if (!isQuestionKey) return;

    const state = gameStore.getState();
    if (state.screen === 'loading' || state.screen === 'start') return;
    e.preventDefault();

    const nextOverlay = state.activeOverlay === 'controls' ? null : 'controls';
    if (nextOverlay === 'controls') {
      this.experience?.cameraController?.releaseLock();
    }
    gameStore.setState({ activeOverlay: nextOverlay });
  }

  showDiscoveryToast(zoneLabel, count, total, eyebrow = 'Area Discovered') {
    const labelEl = this.root.querySelector('#sw-toast-label');
    const titleEl = this.root.querySelector('#sw-toast-title');
    const progEl = this.root.querySelector('#sw-toast-progress');
    if (labelEl) labelEl.textContent = eyebrow;
    if (titleEl) titleEl.textContent = zoneLabel;
    if (progEl) progEl.textContent = `${count} / ${total} zones explored`;

    this.toast.classList.add('visible');

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toast.classList.remove('visible');
    }, 4000);
  }

  _syncOptionPills(selector, attr, value) {
    this.root.querySelectorAll(selector).forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute(attr) === value);
    });
  }

  render(state) {
    if (!this.root) return;

    const isStartVisible = state.screen === 'start' || state.screen === 'loading';
    const isPlaying = state.screen === 'playing';
    const isControlsOpen = state.activeOverlay === 'controls';
    const isInspectOpen = Boolean(state.inspectionItem);
    const isPauseOpen =
      (state.screen === 'paused' || state.activeOverlay === 'settings') &&
      !isControlsOpen &&
      !isInspectOpen;

    // 1. Start Screen vs Pause vs Controls vs Inspection Modals
    this.startScreen.style.display = isStartVisible ? 'flex' : 'none';
    this.pauseModal.classList.toggle('open', isPauseOpen);
    this.helpModal.classList.toggle('open', isControlsOpen);

    // 2. Top HUD Bar (shown during gameplay unless user toggled HUD via [H])
    const showHud = isPlaying && !state.hudHidden && !isPauseOpen && !isControlsOpen;
    this.hudTop.style.opacity = showHud ? '1' : '0';
    this.hudTop.style.pointerEvents = showHud ? 'auto' : 'none';

    // 3. Center Reticle (strictly hidden on start screen and whenever modals/HUD-hide are active)
    const showReticle = isPlaying && !state.hudHidden && !isPauseOpen && !isControlsOpen && !isInspectOpen;
    this.reticleWrap.style.display = showReticle ? 'flex' : 'none';

    // 4. Zone & Discovery Badge
    const zoneBadge = this.root.querySelector('#sw-zone-badge');
    if (zoneBadge) zoneBadge.textContent = state.currentZoneLabel || 'Flower Garden';

    const discChip = this.root.querySelector('#sw-discovery-chip');
    const discoveredCount = state.discoveredZones.length;
    if (discChip) discChip.textContent = `${discoveredCount} / ${DISCOVERY_ZONES.length} Zones`;

    // 5. HUD Button Labels
    const timeBtn = this.root.querySelector('#sw-time-btn');
    if (timeBtn) {
      const labels = { day: 'Day [T]', sunset: 'Sunset [T]', night: 'Night [T]' };
      timeBtn.textContent = labels[state.timeOfDay] || 'Day [T]';
    }

    const camBtn = this.root.querySelector('#sw-camera-btn');
    if (camBtn) camBtn.textContent = state.thirdPerson ? '3rd Person [V]' : '1st Person [V]';

    const muteBtn = this.root.querySelector('#sw-mute-btn');
    if (muteBtn) muteBtn.textContent = state.muted ? 'Muted [M]' : 'Audio [M]';

    // 6. Sync Pills & Sliders across Start Screen + Pause/Settings Modal
    this._syncOptionPills('#sw-character-selector button, #sw-pause-char button', 'data-char', state.selectedCharacter);
    this._syncOptionPills('#sw-quality-selector button, #sw-pause-quality button', 'data-quality', state.quality);
    this._syncOptionPills('#sw-pause-time button', 'data-time', state.timeOfDay);
    this._syncOptionPills('#sw-pause-weather button', 'data-weather', state.weather);

    const sensSlider = this.root.querySelector('#sw-sens-slider');
    const sensVal = this.root.querySelector('#sw-sens-val');
    if (sensSlider) sensSlider.value = String(state.mouseSensitivity);
    if (sensVal) sensVal.textContent = `${Number(state.mouseSensitivity).toFixed(1)}x`;

    const invertBtn = this.root.querySelector('#sw-invert-y-btn');
    if (invertBtn) {
      invertBtn.textContent = state.invertY ? 'Invert Y: On' : 'Invert Y: Off';
      invertBtn.classList.toggle('active', Boolean(state.invertY));
    }

    const volSlider = this.root.querySelector('#sw-vol-slider');
    const volVal = this.root.querySelector('#sw-vol-val');
    const pauseMuteBtn = this.root.querySelector('#sw-pause-mute-btn');
    if (volSlider) volSlider.value = String(state.audioVolume);
    if (volVal) volVal.textContent = `${Math.round((state.audioVolume || 0) * 100)}%`;
    if (pauseMuteBtn) {
      pauseMuteBtn.textContent = state.muted ? 'Muted' : 'Audio: On';
      pauseMuteBtn.classList.toggle('active', Boolean(state.muted));
    }

    // 7. 12-Zone Exploration Checklist inside Pause/Settings modal (rebuilt only when zones change)
    const checklistKey = state.discoveredZones.join('|');
    if (checklistKey !== this._lastChecklistKey) {
      this._lastChecklistKey = checklistKey;
      const checklistHeading = this.root.querySelector('#sw-checklist-heading');
      if (checklistHeading) {
        checklistHeading.textContent = `Estate Zones (${discoveredCount} / ${DISCOVERY_ZONES.length})`;
      }
      const checklistEl = this.root.querySelector('#sw-zone-checklist');
      if (checklistEl) {
        checklistEl.textContent = '';
        for (const z of DISCOVERY_ZONES) {
          const done = state.discoveredZones.includes(z.id);
          const li = document.createElement('li');
          if (done) li.className = 'discovered';
          const mark = document.createElement('span');
          mark.textContent = done ? '\u2713' : '\u25CB';
          const name = document.createElement('span');
          name.textContent = z.label;
          li.append(mark, name);
          checklistEl.appendChild(li);
        }
      }
    }

    // 8. Reticle Target Highlight
    const reticleDot = this.root.querySelector('#sw-reticle-dot');
    const actionBubble = this.root.querySelector('#sw-action-bubble');
    if (reticleDot && actionBubble) {
      if (state.activeTarget) {
        reticleDot.classList.add('active');
        actionBubble.textContent = state.activeTarget.prompt || 'E — Interact';
        actionBubble.classList.add('visible');
      } else {
        reticleDot.classList.remove('active');
        actionBubble.classList.remove('visible');
      }
    }

    // 9. Zone Discovery & 12/12 Tour Completion Toasts
    if (state.resetNonce !== this.lastResetNonce) {
      this.lastResetNonce = state.resetNonce;
      this.lastDiscoveredCount = discoveredCount;
    } else if (discoveredCount > this.lastDiscoveredCount) {
      this.lastDiscoveredCount = discoveredCount;
      if (discoveredCount === DISCOVERY_ZONES.length && !state.estateCompletedShown) {
        gameStore.setState({ estateCompletedShown: true });
        this.showDiscoveryToast(
          'All 12 Zones Discovered',
          discoveredCount,
          DISCOVERY_ZONES.length,
          'Estate Tour Complete'
        );
      } else {
        this.showDiscoveryToast(state.currentZoneLabel, discoveredCount, DISCOVERY_ZONES.length);
      }
    }

    // 10. Inspection Modal
    this.inspectionModal.classList.toggle('open', isInspectOpen);
    if (isInspectOpen) {
      const t = this.root.querySelector('#sw-inspect-title');
      const c = this.root.querySelector('#sw-inspect-category');
      const d = this.root.querySelector('#sw-inspect-desc');
      const s = this.root.querySelector('#sw-inspect-specs');
      if (t) t.textContent = state.inspectionItem.title || 'Item Inspection';
      if (c) c.textContent = state.inspectionItem.category || 'Inspection';
      if (d) d.textContent = state.inspectionItem.description || '';
      if (s) {
        const specs = Array.isArray(state.inspectionItem.specs) ? state.inspectionItem.specs : [];
        s.textContent = '';
        for (const item of specs) {
          const li = document.createElement('li');
          li.textContent = String(item);
          s.appendChild(li);
        }
        s.style.display = specs.length > 0 ? 'block' : 'none';
      }
    }
  }

  dispose() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this._onKeyDown);
    }
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.root && this.root.parentElement) {
      this.root.parentElement.removeChild(this.root);
    }
  }
}