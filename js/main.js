/**
 * PokéMath Application Entrypoint, Router, Starter Ceremony & PWA Boot (`js/main.js`)
 * Coordinates 3-Pane PokéNav Workbench, 6 Adventure Modes, Rotom-Dex Field Guide,
 * Speed Blitz Pace Bar, Global Keyboard Shortcuts, and Service Worker / WebAPK Install.
 */

import * as state from './core/state.js';
import * as mathEngine from './core/mathEngine.js';
import * as hintEngine from './core/hintEngine.js';
import * as adaptive from './core/adaptive.js';
import * as audio from './core/audio.js';
import * as pokemonData from './data/pokemon.js';
import * as routesData from './data/routes.js';
import * as itemsData from './data/items.js';
import * as vfx from './ui/vfx.js';
import { createRotomPane } from './ui/rotomPane.js';
import { createShell } from './ui/shell.js';
import * as battleMode from './games/battleMode.js';
import * as catchMode from './games/catchMode.js';
import * as berryLabMode from './games/berryLabMode.js';
import * as evolutionForge from './games/evolutionForge.js';
import * as campPokedex from './games/campPokedex.js';

const MODES = [
  {
    id: 'battle',
    label: 'Wild Battle',
    icon: '⚔️',
    controller: battleMode,
    routeAware: true,
    extraParams: { mode: 'battle' }
  },
  {
    id: 'catch',
    label: 'Catch Safari',
    icon: '🔴',
    controller: catchMode,
    routeAware: true
  },
  {
    id: 'berry-lab',
    label: 'Berry Lab & Mart',
    icon: '🫐',
    controller: berryLabMode,
    routeAware: false
  },
  {
    id: 'evolution-forge',
    label: 'Evolution Forge',
    icon: '⚡',
    controller: evolutionForge,
    routeAware: false
  },
  {
    id: 'gym',
    label: 'Gym Gauntlet',
    icon: '🏆',
    controller: battleMode,
    routeAware: true,
    extraParams: { mode: 'gym' }
  },
  {
    id: 'camp',
    label: 'Buddy Camp & Dex',
    icon: '⛺',
    controller: campPokedex,
    routeAware: false
  }
];

const ROUTE_AWARE_MODES = new Set(MODES.filter((m) => m.routeAware).map((m) => m.id));

const STARTER_TIER_OPTIONS = [
  { id: 'starter', title: 'Starter', ages: 'Ages 6–7', summary: 'Making 10, Sums & Differences' },
  { id: 'explorer', title: 'Explorer', ages: 'Ages 7–8', summary: 'Place Value, < = > & Stories' },
  { id: 'ace', title: 'Ace', ages: 'Ages 8–10', summary: 'Arrays, Division & Fractions' },
  { id: 'champion', title: 'Champion', ages: 'Ages 10+', summary: 'Multi-Step & Order of Ops' }
];

const AVATAR_SWATCHES = ['#E3350D', '#3B4CCA', '#38B000', '#F59E0B', '#EC4899', '#8B5CF6'];
const SPEED_BLITZ_PACE_MS = 15000;
const SPEED_BLITZ_BONUS_COINS = 2;
const SPEED_BLITZ_BONUS_STARDUST = 2;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getFilterSignature(profile) {
  if (!profile) return '';
  return JSON.stringify({
    tier: profile.tier || 'starter',
    customFilter: profile.customFilter || null
  });
}

function resolveValidRouteId(profile, candidateRouteId) {
  const validCandidate =
    typeof candidateRouteId === 'string' && routesData.getRouteById(candidateRouteId)
      ? candidateRouteId
      : null;

  if (validCandidate) {
    if (!profile?.routeProgress || profile.routeProgress[validCandidate]?.unlocked) {
      return validCandidate;
    }
  }
  return 'route-1';
}

function pickNextQuestTemplate(activeQuests, claimedQuest) {
  const templates = Array.isArray(itemsData.QUEST_TEMPLATES) ? itemsData.QUEST_TEMPLATES : [];
  if (templates.length === 0) return null;

  const otherQuests = (Array.isArray(activeQuests) ? activeQuests : []).filter(
    (q) => q && q.id !== claimedQuest?.id
  );
  const usedTemplateIds = new Set(otherQuests.map((q) => q.templateId));
  const usedMetrics = new Set(otherQuests.map((q) => q.metric));
  if (claimedQuest?.templateId) usedTemplateIds.add(claimedQuest.templateId);

  const freshBoth = templates.filter(
    (tpl) => !usedTemplateIds.has(tpl.templateId) && !usedMetrics.has(tpl.metric)
  );
  if (freshBoth.length > 0) {
    return freshBoth[Math.floor(Math.random() * freshBoth.length)];
  }

  const freshTemplate = templates.filter((tpl) => !usedTemplateIds.has(tpl.templateId));
  if (freshTemplate.length > 0) {
    return freshTemplate[Math.floor(Math.random() * freshTemplate.length)];
  }

  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Speed Blitz pace bar (single bar, owned by main.js) + the `context.speedBlitz` contract
 * (SPEC.md §7 item 4). Modes call `consumeBonus()` on a correct answer and
 * `resetForProblem()` when a fresh problem appears; the bar itself awards the
 * +2 Coins / +2 Stardust bonus, so modes never pay it (or render a timer) themselves.
 */
function createSpeedBlitzBarController(hostEl, deps = {}) {
  const getProfile = typeof deps.getProfile === 'function' ? deps.getProfile : () => null;
  const awardBonus = typeof deps.awardBonus === 'function' ? deps.awardBonus : () => false;
  const onBonusGranted = typeof deps.onBonusGranted === 'function' ? deps.onBonusGranted : null;

  let timerId = null;
  let enabled = false; // profile.settings.speedBlitz
  let visible = false; // enabled AND on a math screen (hidden on Camp / Pokédex / ceremony)
  let deadline = 0; // epoch ms when the bonus window closes
  let bonusConsumed = false;
  let modeManaged = false; // true once the mounted mode calls resetForProblem()
  let lastSolvedCount = 0;
  let lastAttemptCount = 0;
  let lastLabel = '';
  let lastPct = -1;

  function remainingMs() {
    return Math.max(0, deadline - Date.now());
  }

  function stopTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function updateVisuals() {
    if (!hostEl || !visible) return;
    const fillEl = hostEl.querySelector('[data-blitz-fill]');
    const labelEl = hostEl.querySelector('[data-blitz-status]');
    const left = remainingMs();
    const live = !bonusConsumed && left > 0;
    const pct = bonusConsumed ? 100 : Math.max(0, Math.min(100, Math.round((left / SPEED_BLITZ_PACE_MS) * 100)));
    if (fillEl && pct !== lastPct) {
      lastPct = pct;
      fillEl.style.width = `${pct}%`;
      fillEl.style.background = live || bonusConsumed
        ? 'linear-gradient(90deg, var(--poke-green), var(--poke-gold))'
        : 'linear-gradient(90deg, var(--poke-sky), var(--poke-indigo))';
    }
    if (labelEl) {
      const label = bonusConsumed
        ? 'Bonus collected! +2 🪙 +2 ✨'
        : live
          ? `${Math.ceil(left / 1000)}s Bonus Spark`
          : 'Take your time — full XP ready!';
      if (label !== lastLabel) {
        lastLabel = label;
        labelEl.textContent = label;
      }
    }
  }

  function ensureMarkup() {
    if (!hostEl || hostEl.querySelector('[data-speed-blitz-bar]')) return;
    lastLabel = '';
    lastPct = -1;
    hostEl.innerHTML = `
      <div data-speed-blitz-bar style="display:flex;flex-direction:column;gap:5px;padding:8px 12px;border-radius:var(--radius-md);background:var(--bg-glass);border:2px solid var(--border-warm);box-shadow:var(--shadow-card);">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:0.78rem;font-weight:800;color:var(--text-secondary);">
          <span>⚡ Speed Blitz Pace <span style="font-weight:700;color:var(--text-muted);">(bonus coins &amp; stardust — zero penalty)</span></span>
          <span data-blitz-status class="tabular-nums" style="color:var(--poke-indigo-dark);font-weight:900;">15s Bonus Spark</span>
        </div>
        <div class="meter-track" style="height:8px;">
          <div data-blitz-fill style="height:100%;width:100%;border-radius:var(--radius-pill);transition:width 0.2s linear;"></div>
        </div>
      </div>
    `;
  }

  function hideBar() {
    visible = false;
    stopTimer();
    if (hostEl) {
      hostEl.innerHTML = '';
      hostEl.style.display = 'none';
    }
    lastLabel = '';
    lastPct = -1;
  }

  function startWindow() {
    stopTimer();
    deadline = Date.now() + SPEED_BLITZ_PACE_MS;
    bonusConsumed = false;
    if (!visible) return;
    ensureMarkup();
    lastPct = -1;
    updateVisuals();
    timerId = setInterval(() => {
      if (!visible) {
        stopTimer();
        return;
      }
      updateVisuals();
      if (remainingMs() <= 0) stopTimer();
    }, 250);
  }

  /** Applies profile settings + screen kind; (re)starts the window only when the bar first appears. */
  function sync(profile, { mathScreen = true } = {}) {
    enabled = Boolean(profile?.settings?.speedBlitz);
    if (!enabled || !mathScreen) {
      hideBar();
      return;
    }

    const nextSolved = Number(profile.totalSolved) || 0;
    const nextAttempts = Number(profile.totalAttempts) || 0;
    // Modes that predate resetForProblem() still get a fresh window after each answer.
    const counterReset = !modeManaged && (nextSolved !== lastSolvedCount || nextAttempts !== lastAttemptCount);
    lastSolvedCount = nextSolved;
    lastAttemptCount = nextAttempts;

    const wasVisible = visible;
    visible = true;
    hostEl.style.display = 'block';
    if (!wasVisible || counterReset) {
      startWindow();
    } else {
      ensureMarkup();
      updateVisuals();
    }
  }

  /** Called by navigate() before a mode mounts: fresh window, mode not yet in charge of pacing. */
  function beginMode(profile, { mathScreen = true } = {}) {
    modeManaged = false;
    lastSolvedCount = Number(profile?.totalSolved) || 0;
    lastAttemptCount = Number(profile?.totalAttempts) || 0;
    sync(profile, { mathScreen });
    if (visible) startWindow();
  }

  function isEnabled() {
    return Boolean(getProfile()?.settings?.speedBlitz);
  }

  function isBonusActive() {
    return isEnabled() && visible && !bonusConsumed && remainingMs() > 0;
  }

  /** Awards +2 Coins & +2 Stardust once per problem while the window is open. Never penalizes. */
  function consumeBonus() {
    if (!isBonusActive()) return false;
    bonusConsumed = true;
    stopTimer();
    let granted = false;
    try {
      granted = Boolean(awardBonus());
    } catch {
      granted = false;
    }
    updateVisuals();
    if (granted && onBonusGranted) onBonusGranted();
    return granted;
  }

  /** Called by modes whenever a brand-new problem appears. */
  function resetForProblem() {
    modeManaged = true;
    const profile = getProfile();
    lastSolvedCount = Number(profile?.totalSolved) || 0;
    lastAttemptCount = Number(profile?.totalAttempts) || 0;
    if (!isEnabled()) {
      hideBar();
      return false;
    }
    if (!visible) return false; // Camp / Pokédex / ceremony: no pacing window
    startWindow();
    return true;
  }

  function destroy() {
    stopTimer();
    visible = false;
  }

  return {
    sync,
    beginMode,
    destroy,
    api: { isEnabled, isBonusActive, consumeBonus, resetForProblem }
  };
}

let _lastBootInstance = null;

export function bootApp() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  const ribbonEl = document.getElementById('trainer-ribbon');
  const leftRailEl = document.getElementById('left-rail');
  const modeSwitcherEl = document.getElementById('mode-switcher');
  const speedBlitzHostEl = document.getElementById('speed-blitz-host');
  const stageContentEl = document.getElementById('stage-content');
  const rotomEl = document.getElementById('rotom-pane');
  const mobileNavEl = document.getElementById('mobile-nav-bar');
  const backdropEl = document.getElementById('drawer-backdrop');
  const modalRootEl = document.getElementById('modal-root');
  const toastRootEl = document.getElementById('toast-root');

  if (!stageContentEl || !ribbonEl || !leftRailEl || !rotomEl) {
    return null;
  }

  if (stageContentEl.dataset?.pokemathBooted === 'true' && _lastBootInstance) {
    return _lastBootInstance;
  }
  if (stageContentEl.dataset) {
    stageContentEl.dataset.pokemathBooted = 'true';
  }

  const listenerAbort = typeof AbortController === 'function' ? new AbortController() : null;
  const listenerOpts = listenerAbort ? { signal: listenerAbort.signal } : undefined;

  // 1. Initialize state (auto-heals from krunked-cookie-vault-v1 if localStorage was wiped)
  state.initState();

  // 2. Unlock Web Audio & speech voice cache on first user gesture
  const handleFirstGesture = () => {
    audio.unlockAudio();
    window.removeEventListener('pointerdown', handleFirstGesture);
    window.removeEventListener('keydown', handleFirstGesture);
  };
  window.addEventListener('pointerdown', handleFirstGesture, { once: true, passive: true });
  window.addEventListener('keydown', handleFirstGesture, { once: true, passive: true });

  // 3. Register Service Worker safely with relative ./ scope
  if ('serviceWorker' in navigator && typeof navigator.serviceWorker.register === 'function') {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
      // Continue cleanly if offline or SW registration is restricted
    });
  }

  let currentModeId = 'battle';
  let currentRouteId = 'route-1';
  let activeController = null;
  let deferredInstallPrompt = null;
  let isRoutingProfileChange = false;
  let navigatedThisTick = false;
  let knownProfileId = state.getActiveProfile()?.id || null;
  let lastFilterSignature = getFilterSignature(state.getActiveProfile());
  let lastAudioConfig = { sfx: null, ambient: null, speech: null };
  let lastChromeKey = null;
  let lastModeSwitcherKey = null;

  // Single Speed Blitz bar; its `.api` is handed to every mode as context.speedBlitz.
  const speedBlitzBar = createSpeedBlitzBarController(speedBlitzHostEl, {
    getProfile: () => state.getActiveProfile(),
    awardBonus() {
      const updated = state.updateProfile((draft) => {
        draft.coins = (Number(draft.coins) || 0) + SPEED_BLITZ_BONUS_COINS;
        draft.stardust = (Number(draft.stardust) || 0) + SPEED_BLITZ_BONUS_STARDUST;
      });
      return Boolean(updated);
    },
    onBonusGranted() {
      audio.playClick?.('select');
      vfx.spawnFloatingText?.(stageContentEl, `+${SPEED_BLITZ_BONUS_COINS} 🪙 +${SPEED_BLITZ_BONUS_STARDUST} ✨ Speed Blitz!`, 'coins');
      shell?.showToast?.(`⚡ Speed Blitz! +${SPEED_BLITZ_BONUS_COINS} Coins & +${SPEED_BLITZ_BONUS_STARDUST} Stardust`, 'success');
    }
  });

  const isMathScreen = (modeId) => modeId !== 'camp';

  /**
   * Paints ribbon / left rail / mobile nav + Rotom-Dex once per distinct (route, state) snapshot,
   * so back-to-back notifications (state subscriber + shell callbacks) never re-render twice.
   */
  function renderChrome(rootState, profile, { force = false } = {}) {
    let key = null;
    try {
      key = `${currentRouteId}|${JSON.stringify(rootState ?? null)}`;
    } catch {
      key = null;
    }
    if (!force && key !== null && key === lastChromeKey) return false;
    lastChromeKey = key;
    shell.render(rootState, currentRouteId);
    rotomPane.render(profile ?? null);
    return true;
  }

  function syncAudioSettingsIfChanged(profileSettings) {
    if (!profileSettings) return;
    const patch = {};
    if (typeof profileSettings.sfx === 'boolean' && profileSettings.sfx !== lastAudioConfig.sfx) {
      patch.sfx = profileSettings.sfx;
      lastAudioConfig.sfx = profileSettings.sfx;
    }
    if (typeof profileSettings.ambient === 'boolean' && profileSettings.ambient !== lastAudioConfig.ambient) {
      patch.ambient = profileSettings.ambient;
      lastAudioConfig.ambient = profileSettings.ambient;
    }
    if (typeof profileSettings.speech === 'boolean' && profileSettings.speech !== lastAudioConfig.speech) {
      patch.speech = profileSettings.speech;
      lastAudioConfig.speech = profileSettings.speech;
    }
    if (Object.keys(patch).length > 0) {
      audio.setAudioSettings(patch);
    }
  }

  // 5. Initialize Rotom-Dex Field Guide & PokéNav Shell
  const rotomPane = createRotomPane(rotomEl, {
    audio,
    onQuestClaim(questId) {
      let claimedTitle = '';
      let rewardEarned = 0;

      const updated = state.updateProfile((draft) => {
        if (!Array.isArray(draft.activeQuests)) return;
        const idx = draft.activeQuests.findIndex((q) => q && q.id === questId);
        if (idx === -1) return;
        const quest = draft.activeQuests[idx];
        const target = Math.max(1, Number(quest.target) || 1);
        if (quest.claimed || (Number(quest.progress) || 0) < target) return;

        rewardEarned = Math.max(0, Number(quest.rewardStardust) || 15);
        claimedTitle = quest.title || 'Mini-Quest';
        draft.stardust = (draft.stardust || 0) + rewardEarned;

        const nextTemplate = pickNextQuestTemplate(draft.activeQuests, quest);
        if (nextTemplate) {
          draft.activeQuests[idx] = {
            id: `quest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            templateId: nextTemplate.templateId,
            title: nextTemplate.title,
            metric: nextTemplate.metric,
            target: nextTemplate.target,
            progress: 0,
            rewardStardust: nextTemplate.rewardStardust,
            claimed: false
          };
        } else {
          quest.claimed = true;
        }
      });

      if (rewardEarned > 0 && updated) {
        audio.playCorrectChime(3);
        shell.showToast(`Quest cleared: ${claimedTitle}! +${rewardEarned} ✨ Stardust!`, 'success');
        rotomPane.setMood('cheering', `Bzzzt! +${rewardEarned} Stardust! Fresh quest loaded!`);
      }
    },
    onManipulativeInteract() {
      const profile = state.getActiveProfile();
      if (!profile) return;
      const hasOpenManipQuest = (profile.activeQuests || []).some(
        (q) =>
          q &&
          !q.claimed &&
          q.metric === 'use_manipulative' &&
          (Number(q.progress) || 0) < (Number(q.target) || 1)
      );
      if (!hasOpenManipQuest) return;

      state.updateProfile((draft) => {
        if (!Array.isArray(draft.activeQuests)) return;
        for (const q of draft.activeQuests) {
          if (!q || q.claimed || q.metric !== 'use_manipulative') continue;
          const target = Math.max(1, Number(q.target) || 1);
          q.progress = Math.min(target, (Number(q.progress) || 0) + 1);
        }
      });
    }
  });

  function renderModeSwitcher(activeModeId) {
    if (!modeSwitcherEl) return;
    modeSwitcherEl.style.display = '';
    modeSwitcherEl.removeAttribute('aria-hidden');
    const existingTabs = modeSwitcherEl.querySelectorAll?.('[data-mode-id]');
    if (existingTabs && existingTabs.length === MODES.length) {
      if (lastModeSwitcherKey === activeModeId) return;
      existingTabs.forEach((tab) => {
        const isActive = tab.dataset.modeId === activeModeId;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-current', isActive ? 'page' : 'false');
      });
      lastModeSwitcherKey = activeModeId;
      return;
    }
    lastModeSwitcherKey = activeModeId;
    modeSwitcherEl.innerHTML = MODES.map((m) => {
      const isActive = m.id === activeModeId;
      return `
        <button
          type="button"
          class="mode-tab ${isActive ? 'is-active' : ''}"
          data-mode-id="${escapeHtml(m.id)}"
          aria-current="${isActive ? 'page' : 'false'}"
        >
          <span aria-hidden="true">${m.icon}</span>
          <span>${escapeHtml(m.label)}</span>
        </button>
      `;
    }).join('');
  }

  function unmountActiveController() {
    if (activeController && typeof activeController.unmount === 'function') {
      activeController.unmount();
    }
    activeController = null;
  }

  function renderStarterCeremony() {
    unmountActiveController();
    knownProfileId = null;
    lastFilterSignature = '';

    if (modeSwitcherEl) {
      modeSwitcherEl.style.display = 'none';
      modeSwitcherEl.setAttribute('aria-hidden', 'true');
      modeSwitcherEl.innerHTML = '';
    }
    lastModeSwitcherKey = null;

    speedBlitzBar.sync(null);
    currentRouteId = 'route-1';
    renderChrome(state.getState(), null, { force: true });
    rotomPane.setMood('curious', 'Bzzzt! Your math journey is about to unfold! Pick a Kanto Starter!');

    const starterIds = Array.isArray(pokemonData.STARTER_IDS) && pokemonData.STARTER_IDS.length > 0
      ? pokemonData.STARTER_IDS
      : ['bulbasaur', 'charmander', 'squirtle', 'pikachu'];

    let selectedStarterId = starterIds.includes('pikachu') ? 'pikachu' : starterIds[0];
    let selectedTier = 'starter';
    let selectedAvatarColor = AVATAR_SWATCHES[0];

    stageContentEl.innerHTML = `
      <div class="starter-ceremony-overlay" role="region" aria-label="Starter Pokémon Selection Ceremony">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
              <span class="classic-1996-badge">Classic 1996</span>
              <span style="font-size:0.78rem;font-weight:900;color:var(--poke-indigo-dark);text-transform:uppercase;letter-spacing:0.04em;">
                PokéNav Starter Ceremony
              </span>
            </div>
            <h1 style="margin:0;font-family:var(--font-display);font-size:clamp(1.25rem,2.4vw,1.65rem);font-weight:900;color:var(--text-primary);">
              Welcome to PokéMath! Choose Your Partner
            </h1>
            <p style="margin:4px 0 0;font-size:0.9rem;font-weight:700;color:var(--text-secondary);">
              Pick a classic Kanto Starter, choose your grade path, and begin your adventure in two clicks!
            </p>
          </div>
        </div>

        <form id="starter-ceremony-form" style="display:flex;flex-direction:column;gap:14px;">
          <div>
            <div style="font-size:0.84rem;font-weight:900;color:var(--text-primary);margin-bottom:8px;">
              1. Spotlight Kanto Starter Quartet
            </div>
            <div class="starter-grid" role="radiogroup" aria-label="Choose your starter Pokémon">
              ${starterIds.map((id) => {
                const p = pokemonData.getPokemonById(id);
                if (!p) return '';
                const isSelected = id === selectedStarterId;
                const typesHtml = (p.types || [])
                  .map((t) => `<span class="type-pill type-${escapeHtml(t)}">${escapeHtml(t)}</span>`)
                  .join('');
                return `
                  <button
                    type="button"
                    class="starter-card ${isSelected ? 'is-selected' : ''}"
                    data-starter-id="${escapeHtml(p.id)}"
                    role="radio"
                    aria-checked="${isSelected}"
                  >
                    <div class="starter-visual-slot" data-starter-visual="${escapeHtml(p.id)}" style="min-height:96px;display:flex;align-items:center;justify-content:center;"></div>
                    <div style="font-family:var(--font-display);font-size:1.05rem;font-weight:900;color:var(--text-primary);">
                      ${escapeHtml(p.name)}
                    </div>
                    <div style="display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap;">
                      <span class="dex-number" style="font-size:0.74rem;font-weight:800;color:var(--text-secondary);">#${String(p.dexNumber).padStart(3, '0')}</span>
                      ${typesHtml}
                    </div>
                    <p style="margin:0;font-size:0.74rem;font-weight:700;color:var(--text-secondary);line-height:1.3;">
                      ${escapeHtml(p.mathLore)}
                    </p>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <div class="form-grid" style="align-items:end;">
            <label style="display:flex;flex-direction:column;gap:5px;font-size:0.84rem;font-weight:900;color:var(--text-primary);">
              2. Trainer Name
              <input
                type="text"
                id="starter-trainer-name"
                name="name"
                class="pokenav-input"
                placeholder="Red"
                maxlength="24"
                autocomplete="nickname"
              />
            </label>

            <div style="display:flex;flex-direction:column;gap:5px;">
              <span style="font-size:0.84rem;font-weight:900;color:var(--text-primary);">Badge Color</span>
              <div class="swatch-row" role="radiogroup" aria-label="Trainer badge color">
                ${AVATAR_SWATCHES.map((hex, idx) => `
                  <button
                    type="button"
                    class="swatch-btn ${idx === 0 ? 'is-selected' : ''}"
                    data-starter-swatch="${hex}"
                    style="background:${hex};"
                    aria-label="Select badge color ${hex}"
                    aria-checked="${idx === 0}"
                  ></button>
                `).join('')}
              </div>
            </div>
          </div>

          <div>
            <div style="font-size:0.84rem;font-weight:900;color:var(--text-primary);margin-bottom:8px;">
              3. Grade Tier Path
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px;" role="radiogroup" aria-label="Select math grade tier">
              ${STARTER_TIER_OPTIONS.map((t) => {
                const isActive = t.id === selectedTier;
                return `
                  <button
                    type="button"
                    class="btn-3d btn-touch ${isActive ? 'btn-indigo' : 'btn-secondary'}"
                    data-starter-tier="${escapeHtml(t.id)}"
                    role="radio"
                    aria-checked="${isActive}"
                    style="flex-direction:column;align-items:flex-start;text-align:left;padding:9px 12px;gap:2px;"
                  >
                    <span style="font-size:0.92rem;font-weight:900;">${escapeHtml(t.title)} • ${escapeHtml(t.ages)}</span>
                    <span style="font-size:0.72rem;font-weight:700;opacity:0.88;">${escapeHtml(t.summary)}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding-top:4px;">
            <span style="font-size:0.8rem;font-weight:700;color:var(--text-secondary);">
              Includes your Classic Trainer Cap &amp; automatic save protection!
            </span>
            <button type="submit" id="begin-adventure-btn" class="btn-3d btn-primary btn-touch" style="min-height:54px;padding:12px 24px;font-size:1.06rem;">
              Begin Adventure! →
            </button>
          </div>
        </form>
      </div>
    `;

    // Mount resilient Poké-visuals (official artwork with automatic chibi SVG fallback)
    for (const id of starterIds) {
      const p = pokemonData.getPokemonById(id);
      const slot = stageContentEl.querySelector(`[data-starter-visual="${id}"]`);
      if (p && slot) {
        slot.appendChild(vfx.renderPokemonVisual(p, { size: 96, animate: true }));
      }
    }

    const formEl = stageContentEl.querySelector('#starter-ceremony-form');
    if (!formEl) return;

    formEl.addEventListener('click', (event) => {
      const starterCard = event.target?.closest?.('[data-starter-id]');
      if (starterCard) {
        audio.unlockAudio();
        audio.playClick('tap');
        selectedStarterId = starterCard.dataset.starterId;
        formEl.querySelectorAll('[data-starter-id]').forEach((el) => {
          const active = el.dataset.starterId === selectedStarterId;
          el.classList.toggle('is-selected', active);
          el.setAttribute('aria-checked', String(active));
        });
        const picked = pokemonData.getPokemonById(selectedStarterId);
        if (picked) {
          rotomPane.setMood('cheering', `${picked.name}! ${picked.mathLore}`);
        }
        return;
      }

      const tierBtn = event.target?.closest?.('[data-starter-tier]');
      if (tierBtn) {
        audio.unlockAudio();
        audio.playClick('tap');
        selectedTier = tierBtn.dataset.starterTier;
        formEl.querySelectorAll('[data-starter-tier]').forEach((el) => {
          const active = el.dataset.starterTier === selectedTier;
          el.classList.toggle('btn-indigo', active);
          el.classList.toggle('btn-secondary', !active);
          el.setAttribute('aria-checked', String(active));
        });
        return;
      }

      const swatchBtn = event.target?.closest?.('[data-starter-swatch]');
      if (swatchBtn) {
        audio.unlockAudio();
        audio.playClick('tap');
        selectedAvatarColor = swatchBtn.dataset.starterSwatch;
        formEl.querySelectorAll('[data-starter-swatch]').forEach((el) => {
          const active = el.dataset.starterSwatch === selectedAvatarColor;
          el.classList.toggle('is-selected', active);
          el.setAttribute('aria-checked', String(active));
        });
      }
    });

    formEl.addEventListener('submit', (event) => {
      event.preventDefault();
      audio.unlockAudio();

      const rawName = formEl.querySelector('#starter-trainer-name')?.value || '';
      const trainerName = rawName.trim() || 'Red';

      isRoutingProfileChange = true;
      let createdProfile = null;
      try {
        createdProfile = state.createProfile({
          name: trainerName,
          tier: selectedTier,
          starterId: selectedStarterId,
          avatarColor: selectedAvatarColor
        });
        knownProfileId = createdProfile?.id || null;
        lastFilterSignature = getFilterSignature(createdProfile);
        currentRouteId = 'route-1';
      } finally {
        isRoutingProfileChange = false;
      }

      audio.playCatchFanfare();
      navigate('battle', { routeId: 'route-1' });
      vfx.burstConfetti(stageContentEl);
      shell.showToast(
        `Welcome, Trainer ${createdProfile?.name || trainerName}! Classic Trainer 1996 heritage awaits!`,
        'badge'
      );
    });
  }

  function navigate(modeId = 'battle', params = {}) {
    const profile = state.getActiveProfile();
    if (!profile) {
      renderStarterCeremony();
      return;
    }

    const modeEntry = MODES.find((m) => m.id === modeId) || MODES[0];
    if (params?.routeId) {
      currentRouteId = resolveValidRouteId(profile, params.routeId);
    } else {
      currentRouteId = resolveValidRouteId(profile, currentRouteId);
    }

    unmountActiveController();
    currentModeId = modeEntry.id;

    renderModeSwitcher(currentModeId);
    renderChrome(state.getState(), profile);
    syncAudioSettingsIfChanged(profile.settings);
    // Fresh pacing window (hidden on Camp / Pokédex); the mounting mode may restart it per problem.
    speedBlitzBar.beginMode(profile, { mathScreen: isMathScreen(currentModeId) });

    const modeParams = {
      ...(params || {}),
      ...(modeEntry.extraParams || {}),
      routeId: currentRouteId
    };

    const context = {
      state,
      mathEngine,
      hintEngine,
      adaptive,
      audio,
      vfx,
      rotomPane,
      shell,
      pokemonData,
      routesData,
      itemsData,
      onNavigate: navigate,
      speedBlitz: speedBlitzBar.api,
      modeParams
    };

    stageContentEl.scrollTop = 0;
    activeController = modeEntry.controller;
    activeController.mount(stageContentEl, context);
  }

  const shell = createShell(
    {
      ribbonEl,
      leftRailEl,
      rotomEl,
      modalRootEl,
      toastRootEl,
      mobileNavEl,
      backdropEl
    },
    {
      state,
      audio,
      vfx,
      routesData,
      pokemonData,
      itemsData,
      onSelectRoute(routeId) {
        const profile = state.getActiveProfile();
        if (!profile) return;
        const resolved = resolveValidRouteId(profile, routeId);
        currentRouteId = resolved;
        const nextMode = ROUTE_AWARE_MODES.has(currentModeId) ? currentModeId : 'battle';
        navigate(nextMode, { routeId: resolved });
      },
      onNavigate: navigate,
      onFilterChange(updatedProfile) {
        if (!updatedProfile) return;
        syncAudioSettingsIfChanged(updatedProfile.settings);
        const nextSig = getFilterSignature(updatedProfile);
        if (nextSig !== lastFilterSignature) {
          lastFilterSignature = nextSig;
          if (currentModeId !== 'camp') {
            navigate(currentModeId, { routeId: currentRouteId });
            return;
          }
        }
        speedBlitzBar.sync(updatedProfile, { mathScreen: isMathScreen(currentModeId) });
        renderChrome(state.getState(), updatedProfile);
      },
      onProfileChanged(activeProfile) {
        if (!activeProfile) {
          if (knownProfileId !== null) {
            renderStarterCeremony();
          }
          return;
        }
        if (navigatedThisTick && knownProfileId === activeProfile.id) {
          return;
        }
        isRoutingProfileChange = true;
        try {
          knownProfileId = activeProfile.id;
          lastFilterSignature = getFilterSignature(activeProfile);
          currentRouteId = resolveValidRouteId(activeProfile, currentRouteId);
          syncAudioSettingsIfChanged(activeProfile.settings);
        } finally {
          isRoutingProfileChange = false;
        }
        navigate('battle', { routeId: currentRouteId });
      }
    }
  );

  // 4. WebAPK beforeinstallprompt handling
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    shell.setInstallAvailable(async () => {
      if (!deferredInstallPrompt) return;
      try {
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
      } catch {
        // Ignore cancelled prompt errors
      } finally {
        deferredInstallPrompt = null;
        shell.setInstallAvailable(null);
      }
    });
  }, listenerOpts);

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    shell.setInstallAvailable(null);
    shell.showToast('PokéNav installed on your device!', 'success');
  }, listenerOpts);

  // Mode Switcher click navigation
  if (modeSwitcherEl) {
    modeSwitcherEl.addEventListener('click', (event) => {
      const tabBtn = event.target?.closest?.('[data-mode-id]');
      if (!tabBtn) return;
      const targetMode = tabBtn.dataset.modeId;
      if (!targetMode) return;
      audio.unlockAudio();
      audio.playClick('tap');
      shell.closeDrawers();
      navigate(targetMode, { routeId: currentRouteId });
    }, listenerOpts);
  }

  // Keep UI synchronized on profile updates without infinite render loops
  const unsubscribeState = state.subscribe((rootState, activeProfile) => {
    if (isRoutingProfileChange) return;

    if (activeProfile) {
      syncAudioSettingsIfChanged(activeProfile.settings);
      if (knownProfileId !== activeProfile.id) {
        // Profile switch: navigate() renders the chrome itself, so skip the pre-render.
        knownProfileId = activeProfile.id;
        lastFilterSignature = getFilterSignature(activeProfile);
        currentRouteId = resolveValidRouteId(activeProfile, currentRouteId);
        navigatedThisTick = true;
        queueMicrotask(() => {
          navigatedThisTick = false;
        });
        navigate('battle', { routeId: currentRouteId });
        return;
      }
      renderChrome(rootState, activeProfile);
      speedBlitzBar.sync(activeProfile, { mathScreen: isMathScreen(currentModeId) });
    } else if (knownProfileId !== null || !stageContentEl.querySelector('.starter-ceremony-overlay')) {
      navigatedThisTick = true;
      queueMicrotask(() => {
        navigatedThisTick = false;
      });
      renderStarterCeremony(); // renders the chrome itself
    } else {
      renderChrome(rootState, null);
      speedBlitzBar.sync(null);
    }
  });

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    // Ignore when any modal is open (#modal-root non-empty; Escape handled by shell.js)
    if (modalRootEl && (modalRootEl.children.length > 0 || modalRootEl.textContent.trim().length > 0)) {
      return;
    }

    const activeEl = document.activeElement;
    const tag = activeEl?.tagName || '';
    const isInputFocused =
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      Boolean(activeEl?.isContentEditable);

    if (isInputFocused && event.key !== 'Escape') {
      return;
    }

    if (activeController && typeof activeController.handleKey === 'function') {
      if (activeController.handleKey(event) === true) {
        event.preventDefault();
        return;
      }
    }

    if ((event.key === 'r' || event.key === 'R') && !event.repeat && state.getActiveProfile()) {
      // Read the active prompt (plus open Tier 1 clue) aloud via the Rotom-Dex read-aloud button.
      const readBtn = rotomEl.querySelector('#rotom-read-aloud-btn');
      if (readBtn) {
        event.preventDefault();
        audio.unlockAudio();
        readBtn.click();
        return;
      }
    }

    if ((event.key === 'h' || event.key === 'H') && state.getActiveProfile()) {
      event.preventDefault();
      audio.unlockAudio();
      rotomPane.cycleHintTier();
      audio.playClick('tap');
    }
  }, listenerOpts);

  // Initial mount
  const initialProfile = state.getActiveProfile();
  if (!initialProfile) {
    renderStarterCeremony();
  } else {
    syncAudioSettingsIfChanged(initialProfile.settings);
    navigate('battle', { routeId: 'route-1' });
  }

  _lastBootInstance = {
    navigate,
    shell,
    rotomPane,
    destroy() {
      speedBlitzBar.destroy();
      unmountActiveController();
      unsubscribeState();
      listenerAbort?.abort();
      if (stageContentEl.dataset) {
        delete stageContentEl.dataset.pokemathBooted;
      }
      _lastBootInstance = null;
    }
  };
  return _lastBootInstance;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bootApp(), { once: true });
  } else {
    bootApp();
  }
}
