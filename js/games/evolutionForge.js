import * as defaultState from '../core/state.js';
import * as defaultMathEngine from '../core/mathEngine.js';
import * as defaultHintEngine from '../core/hintEngine.js';
import * as defaultAdaptive from '../core/adaptive.js';
import * as defaultAudio from '../core/audio.js';
import * as defaultPokemonData from '../data/pokemon.js';

const STYLE_ID = 'pokemath-evolution-forge-styles';

const FORGE_CSS = `
.pm-forge {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 100%;
  padding: 16px;
  border-radius: 22px;
  background: radial-gradient(circle at 50% 0%, #1e1b4b 0%, #0f172a 65%, #090d1a 100%);
  color: #f8fafc;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  box-sizing: border-box;
}
.pm-forge.is-glowing {
  box-shadow: inset 0 0 0 3px rgba(255, 203, 5, 0.72), 0 0 32px rgba(255, 203, 5, 0.25);
}
.pm-forge *, .pm-forge *::before, .pm-forge *::after { box-sizing: border-box; }
.pm-forge-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.3;
  z-index: 0;
}
.pm-forge-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pm-forge-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(30, 41, 59, 0.85);
  border: 2px solid rgba(148, 163, 184, 0.28);
  border-radius: 18px;
  padding: 12px 16px;
}
.pm-forge-title {
  margin: 0;
  font-size: 1.18rem;
  font-weight: 900;
  color: #ffcb05;
}
.pm-forge-sub {
  margin: 2px 0 0;
  font-size: 0.82rem;
  color: #cbd5e1;
}
.pm-forge-seals {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pm-forge-seal {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  border: 2px solid #475569;
  font-weight: 800;
  font-size: 0.82rem;
  color: #94a3b8;
}
.pm-forge-seal.is-active {
  border-color: #38bdf8;
  color: #e0f2fe;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.35);
}
.pm-forge-seal.is-done {
  border-color: #ffcb05;
  background: rgba(234, 179, 8, 0.2);
  color: #fef08a;
}
.pm-forge-pedestal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  background: rgba(30, 41, 59, 0.78);
  border: 2px solid rgba(255, 203, 5, 0.3);
  border-radius: 18px;
  padding: 12px 16px;
}
.pm-forge-pair {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.pm-forge-buddy-slot {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(15, 23, 42, 0.7);
  border: 1.5px solid rgba(148, 163, 184, 0.25);
  border-radius: 14px;
  padding: 6px 12px;
}
.pm-forge-meter-wrap {
  flex: 1 1 200px;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pm-forge-meter-bar {
  height: 14px;
  border-radius: 999px;
  background: #0f172a;
  border: 1.5px solid #475569;
  overflow: hidden;
}
.pm-forge-meter-fill {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8 0%, #a855f7 55%, #ffcb05 100%);
  transition: width 0.35s ease;
}
.pm-forge-branch-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}
.pm-forge-branch-pill {
  min-height: 36px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 2px solid #475569;
  background: #0f172a;
  color: #e2e8f0;
  font-weight: 800;
  font-size: 0.8rem;
  cursor: pointer;
}
.pm-forge-branch-pill.is-selected {
  border-color: #ffcb05;
  background: #422006;
  color: #fef08a;
}
.pm-forge-stage {
  background: rgba(255, 249, 240, 0.97);
  color: #0f172a;
  border-radius: 20px;
  border: 3px solid #cbd5e1;
  padding: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
}
.pm-forge-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 16px;
  align-items: center;
}
.pm-forge-triangle-arena {
  position: relative;
  min-height: 250px;
  border-radius: 18px;
  background: radial-gradient(circle at 50% 40%, #1e1b4b 0%, #0f172a 100%);
  color: #ffffff;
  padding: 18px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.pm-forge-triangle-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.45;
}
.pm-forge-stone-row {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  gap: 36px;
  width: 100%;
}
.pm-forge-evo-stone {
  min-width: 92px;
  min-height: 78px;
  padding: 10px 14px;
  border-radius: 20px;
  border: 3px solid #38bdf8;
  background: radial-gradient(circle at 30% 25%, #334155 0%, #0f172a 90%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  box-shadow: 0 0 18px rgba(56, 189, 248, 0.35);
}
.pm-forge-evo-stone.is-missing {
  border-color: #ffcb05;
  background: radial-gradient(circle at 30% 25%, #713f12 0%, #1e1b4b 90%);
  box-shadow: 0 0 24px rgba(255, 203, 5, 0.6);
  animation: pmForgeStonePulse 1.6s ease-in-out infinite;
}
.pm-forge-stone-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: 800; }
.pm-forge-stone-val { font-size: 1.55rem; font-weight: 900; color: #ffffff; }
.pm-forge-scale-arena {
  border-radius: 18px;
  background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
  border: 2px solid #93c5fd;
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.pm-forge-scale-beam-wrap {
  width: 100%;
  max-width: 360px;
  transition: transform 0.35s ease;
  transform-origin: 50% 28px;
}
.pm-forge-scale-pans {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
}
.pm-forge-scale-pan {
  min-height: 74px;
  border-radius: 16px;
  background: #ffffff;
  border: 3px solid #3b4cca;
  border-bottom-width: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  font-weight: 900;
  color: #1e293b;
}
.pm-forge-choices { margin: 0; }
.pm-forge-keypad { max-width: none; }
.pm-forge-keypad-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #0f172a;
  border-color: #0f172a;
  color: #ffcb05;
  text-align: left;
}
.pm-forge-keypad-label { font-size: 0.78rem; color: #94a3b8; font-weight: 700; }
.pm-forge-submit { width: 100%; min-height: 52px; font-size: 1.02rem; }
.pm-forge-btn-ghost {
  min-height: 44px;
  padding: 8px 14px;
  border-color: rgba(148, 163, 184, 0.45);
  background: rgba(15, 23, 42, 0.75);
  color: #f8fafc;
}
.pm-forge-nudge { margin-top: 10px; }
.pm-forge-overlay {
  position: absolute;
  inset: 0;
  z-index: 25;
  background: radial-gradient(circle at 50% 45%, #1e1b4b 0%, #020617 88%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  text-align: center;
  color: #ffffff;
}
.pm-forge-evo-stage-ring {
  position: relative;
  width: 190px;
  height: 190px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255, 203, 5, 0.35) 0%, rgba(56, 189, 248, 0.14) 55%, transparent 74%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.pm-forge-evo-morph {
  transition: transform 0.55s ease, opacity 0.45s ease, filter 0.45s ease;
}
.pm-forge-evo-morph.is-silhouette {
  filter: brightness(0) invert(1) drop-shadow(0 0 22px #ffcb05);
  animation: pmForgeEvoFlash 0.55s ease-in-out infinite alternate;
}
.pm-forge-evo-banner {
  background: rgba(15, 23, 42, 0.88);
  border: 2px solid #ffcb05;
  border-radius: 18px;
  padding: 14px 20px;
  max-width: 480px;
}
@keyframes pmForgeStonePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}
@keyframes pmForgeEvoFlash {
  0% { transform: scale(0.95); opacity: 0.72; }
  100% { transform: scale(1.1); opacity: 1; }
}
@media (max-width: 820px) {
  .pm-forge-grid { grid-template-columns: 1fr; }
  .pm-forge-stone-row { gap: 16px; }
}
@media (prefers-reduced-motion: reduce) {
  .pm-forge-evo-stone.is-missing, .pm-forge-evo-morph.is-silhouette { animation: none !important; }
  .pm-forge-scale-beam-wrap, .pm-forge-meter-fill, .pm-forge-evo-morph { transition: none !important; }
}
[data-reduced-motion="true"] .pm-forge-evo-stone.is-missing,
[data-reduced-motion="true"] .pm-forge-evo-morph.is-silhouette { animation: none !important; }
[data-reduced-motion="true"] .pm-forge-scale-beam-wrap,
[data-reduced-motion="true"] .pm-forge-meter-fill,
[data-reduced-motion="true"] .pm-forge-evo-morph { transition: none !important; }
`;

let _container = null;
let _ctx = null;
let _puzzleIndex = 0;
let _problems = [];
let _selectedBranchId = null;
let _trainingOnly = false;
let _keypadValue = '';
let _feedback = null;
let _scaleTiltDeg = -6;
let _evoState = null; // null | { phase: 'morphing'|'complete'|'trainingComplete', oldBuddy, newBuddy, shiny, rewards }
let _timers = new Set();

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getApis() {
  const ctx = _ctx || {};
  return {
    state: ctx.state || defaultState,
    mathEngine: ctx.mathEngine || defaultMathEngine,
    hintEngine: ctx.hintEngine || defaultHintEngine,
    adaptive: ctx.adaptive || defaultAdaptive,
    audio: ctx.audio || defaultAudio,
    pokemonData: ctx.pokemonData || defaultPokemonData,
    vfx: ctx.vfx || null,
    rotomPane: ctx.rotomPane || null,
    shell: ctx.shell || null,
    onNavigate: ctx.onNavigate || null
  };
}

function scheduleTimer(fn, delayMs) {
  const id = setTimeout(() => {
    _timers.delete(id);
    fn();
  }, delayMs);
  _timers.add(id);
  return id;
}

function clearTimers() {
  for (const id of _timers) {
    clearTimeout(id);
  }
  _timers.clear();
}

function ensureStyles() {
  if (typeof document === 'undefined' || !document.head) return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = FORGE_CSS;
  document.head.appendChild(style);
}

function removeStyles() {
  if (typeof document === 'undefined') return;
  document.getElementById(STYLE_ID)?.remove();
}

function renderVisualSafe(vfx, pokemon, options = {}) {
  if (vfx?.renderPokemonVisual && pokemon) {
    return vfx.renderPokemonVisual(pokemon, options);
  }
  const el = document.createElement('div');
  const size = options.size || 96;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.borderRadius = '50%';
  el.style.background = pokemon?.fallbackPalette?.primary || '#FFCB05';
  el.style.fontWeight = '900';
  el.textContent = pokemon?.name?.slice(0, 2) || 'PM';
  return el;
}

function buildTrialProblems(profile) {
  const { mathEngine, adaptive } = getApis();
  const tier = profile?.tier || 'starter';
  const rec = adaptive.getRecommendedProblemConfig(profile || { tier }, 'route-5');
  const custom = profile?.customFilter?.enabled ? profile.customFilter : null;

  // Fact-family triangles print the two given stones, so retry (a few times) when a tight custom
  // filter hands us a puzzle whose layout can't be trusted or whose given stone IS the answer.
  const generateTriangle = (operation, difficultyAdjustment) => {
    let candidate = null;
    let trustedFallback = null;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      candidate = mathEngine.generateProblem({
        tier,
        operation,
        format: 'missing',
        customFilter: custom,
        difficultyAdjustment
      });
      const resolved = resolveTriangleStones(candidate);
      if (resolved.trusted && !resolved.showsAnswer) return candidate;
      if (resolved.trusted && !trustedFallback) trustedFallback = candidate;
    }
    return trustedFallback || candidate;
  };

  // Puzzle 1: Fact-family triangle (addition/multiplication missing)
  const op1 = tier === 'ace' || tier === 'champion' ? 'mul' : 'add';
  const p1 = generateTriangle(op1, rec.difficultyAdjustment);

  // Puzzle 2: Two-pan Legendary Balance Scale
  const p2 = mathEngine.generateProblem({
    tier,
    operation: 'balanced',
    format: 'missing',
    customFilter: custom,
    difficultyAdjustment: rec.difficultyAdjustment
  });

  // Puzzle 3: Fact-family triangle (subtraction/division missing)
  const op3 = tier === 'ace' || tier === 'champion' ? 'div' : 'sub';
  const p3 = generateTriangle(op3, 1);

  return [p1, p2, p3];
}

function syncCurrentProblemToRotom() {
  const { hintEngine, rotomPane } = getApis();
  const problem = _problems[_puzzleIndex];
  if (!problem) return;
  const bundle = hintEngine.buildHintBundle(problem);
  rotomPane?.setProblem?.(problem, bundle);
  rotomPane?.setMood?.('thinking', `Forge Seal ${_puzzleIndex + 1} of 3! Use the Stones or Balance Scale.`);
  _ctx?.speedBlitz?.resetForProblem?.();
  autoReadAloud(problem);
}

/** SPEC §7.7: when the speech setting is on, a newly shown problem is read aloud automatically. */
function autoReadAloud(problem) {
  const { state, audio } = getApis();
  if (state.getActiveProfile()?.settings?.speech !== true || !problem) return;
  audio?.speakText?.(problem.spokenPrompt || problem.promptText, false);
}

/** Effects live inside the container, so they must be spawned AFTER render() rebuilds the DOM. */
function getFxHost() {
  return _container?.querySelector?.('.pm-forge') || _container;
}

function captureFocusSelector() {
  if (!_container || typeof document === 'undefined') return null;
  const el = document.activeElement;
  if (!el || el === document.body || !_container.contains(el)) return null;
  const parts = Object.entries(el.dataset || {}).map(([key, value]) => {
    const attr = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    return `[data-${attr}="${String(value).replace(/["\\]/g, '\\$&')}"]`;
  });
  return parts.length > 0 ? `${el.tagName.toLowerCase()}${parts.join('')}` : null;
}

function restoreFocus(selector) {
  if (!selector || !_container) return;
  try {
    _container.querySelector(selector)?.focus?.({ preventScroll: true });
  } catch {
    /* selector no longer valid; ignore */
  }
}

function applyForgeQuestProgress(draft, increments) {
  if (!Array.isArray(draft.activeQuests)) return;
  for (const q of draft.activeQuests) {
    if (!q || q.claimed) continue;
    let next = q.progress || 0;
    if (q.metric === 'totalSolved' || q.metric === 'solve_total') next += increments.solved || 0;
    else if (q.metric === 'sessionStreak' || q.metric === 'solve_streak') next = Math.max(next, increments.streak || 0);
    else if (q.metric === 'solve_no_hints') next += increments.noHints || 0;
    else if (q.metric === 'earn_xp') next += increments.xp || 0;
    q.progress = Math.min(q.target || 1, next);
  }
}

function resolveTargetEvolution(buddy) {
  const { pokemonData } = getApis();
  if (!buddy || !buddy.evolvesTo) return null;
  if (Array.isArray(buddy.evolvesToOptions) && buddy.evolvesToOptions.length > 0) {
    const id = buddy.evolvesToOptions.includes(_selectedBranchId)
      ? _selectedBranchId
      : buddy.evolvesToOptions[0];
    return pokemonData.getPokemonById(id);
  }
  return pokemonData.getPokemonById(buddy.evolvesTo);
}

function triggerTrialCompletion() {
  const { state, audio, vfx, pokemonData, rotomPane, shell } = getApis();
  const profile = state.getActiveProfile();
  if (!profile) return;

  const oldBuddy = pokemonData.getPokemonById(profile.activeBuddyId);
  const targetEvo = !_trainingOnly ? resolveTargetEvolution(oldBuddy) : null;
  const buddyWasShiny = Boolean(profile.caught?.[oldBuddy?.id]?.shiny);

  if (targetEvo) {
    _evoState = {
      phase: 'morphing',
      oldBuddy,
      newBuddy: targetEvo,
      shiny: buddyWasShiny
    };
    audio?.playEvolutionSymphony?.();
    render();

    scheduleTimer(() => {
      if (!_container || !_evoState) return;
      const now = Date.now();
      const updated = state.updateProfile((draft) => {
        draft.activeBuddyId = targetEvo.id;
        const prev = draft.caught?.[targetEvo.id];
        draft.caught[targetEvo.id] = {
          count: (prev?.count || 0) + 1,
          shiny: Boolean(prev?.shiny || buddyWasShiny),
          firstCaughtAt: prev?.firstCaughtAt || now,
          nickname: prev?.nickname || null
        };
        draft.evolutionMeter = 0;
        draft.buddyLevel = (draft.buddyLevel || 1) + 1;
        draft.buddyXp = (draft.buddyXp || 0) + 50;
        draft.stardust = (draft.stardust || 0) + 30;
        draft.coins = (draft.coins || 0) + 25;
        applyForgeQuestProgress(draft, { xp: 50 });
      });

      _evoState = {
        phase: 'complete',
        oldBuddy,
        newBuddy: targetEvo,
        shiny: Boolean(updated?.caught?.[targetEvo.id]?.shiny || buddyWasShiny)
      };
      render();

      const overlay = _container?.querySelector('[data-evo-overlay]');
      if (overlay) {
        vfx?.burstConfetti?.(overlay);
      }
      rotomPane?.setMood?.('starry', `Amazing! ${oldBuddy?.name} evolved into ${targetEvo.name}!`);
      shell?.showToast?.(`${oldBuddy?.name} evolved into ${targetEvo.name}!`, 'success');
    }, 1700);
  } else {
    // Final-stage or training-shrine completion rewards
    const updated = state.updateProfile((draft) => {
      draft.stardust = (draft.stardust || 0) + 40;
      draft.coins = (draft.coins || 0) + 25;
      draft.inventory.rarecandy = (draft.inventory.rarecandy || 0) + 1;
      if (Array.isArray(draft.mysteryEggs)) {
        for (const egg of draft.mysteryEggs) {
          egg.warmth = Math.min(3, (egg.warmth || 0) + 1);
        }
      }
    });

    _evoState = {
      phase: 'trainingComplete',
      oldBuddy,
      newBuddy: oldBuddy,
      shiny: buddyWasShiny,
      eggsWarmed: updated?.mysteryEggs?.length || 0
    };

    audio?.playBadgeFanfare?.();
    render();
    const overlay = _container?.querySelector('[data-evo-overlay]');
    if (overlay) {
      vfx?.burstConfetti?.(overlay);
    }
    rotomPane?.setMood?.('cheering', 'Forge Shrine cleared! +40 Stardust & +1 Rare Candy!');
  }
}

function submitForgeAnswer(rawVal) {
  const problem = _problems[_puzzleIndex];
  if (!problem || _evoState) return;
  const { state, mathEngine, adaptive, audio, vfx, rotomPane } = getApis();
  const profile = state.getActiveProfile();
  if (!profile) return;

  const isCorrect = mathEngine.validateAnswer(problem, rawVal);
  const hintsUsed = rotomPane?.getCurrentHintTier?.() || 0;
  let adaptiveRes = null;

  if (isCorrect) {
    _scaleTiltDeg = 0;
    const isFinalPuzzle = _puzzleIndex >= 2;
    const chargeBoost = 34;

    const updated = state.updateProfile((draft) => {
      adaptiveRes = adaptive.recordAttempt(draft, problem.skillTag, true, hintsUsed);
      draft.totalSolved = (draft.totalSolved || 0) + 1;
      draft.totalAttempts = (draft.totalAttempts || 0) + 1;
      draft.stardust = (draft.stardust || 0) + 10;
      draft.buddyXp = (draft.buddyXp || 0) + 15;
      draft.buddyLevel = Math.max(draft.buddyLevel || 1, 1 + Math.floor(draft.buddyXp / 100));
      draft.evolutionMeter = Math.min(100, (draft.evolutionMeter || 0) + chargeBoost);
      applyForgeQuestProgress(draft, {
        solved: 1,
        streak: adaptiveRes?.streak || draft.sessionStreak || 1,
        noHints: hintsUsed === 0 ? 1 : 0,
        xp: 15
      });
    });

    audio?.playCorrectChime?.(adaptiveRes?.streak || 1);
    _ctx?.speedBlitz?.consumeBonus?.();
    const sealMessage = `Seal ${_puzzleIndex + 1} Lit! +34% Charge!`;

    rotomPane?.updateMetrics?.({
      streak: updated?.sessionStreak || 0,
      totalSolved: updated?.totalSolved || 0
    });

    if (isFinalPuzzle) {
      triggerTrialCompletion();
      vfx?.spawnFloatingText?.(getFxHost(), sealMessage, 'success');
      return;
    }

    _puzzleIndex += 1;
    _keypadValue = '';
    _feedback = null;
    _scaleTiltDeg = -6;
    syncCurrentProblemToRotom();
    render();
    vfx?.spawnFloatingText?.(getFxHost(), sealMessage, 'success');
  } else {
    const numVal = Number(rawVal);
    if (_puzzleIndex === 1 && Number.isFinite(numVal)) {
      _scaleTiltDeg = numVal < Number(problem.answer) ? 8 : -8;
    }

    const updated = state.updateProfile((draft) => {
      adaptiveRes = adaptive.recordAttempt(draft, problem.skillTag, false, hintsUsed);
      draft.totalAttempts = (draft.totalAttempts || 0) + 1;
    });

    audio?.playGentleNudge?.();
    const msg = adaptiveRes?.encouragementMessage || 'Keep balancing the stones—Rotom-Dex can help!';
    _feedback = msg;
    rotomPane?.setMood?.('encouraging', msg);
    if ((adaptiveRes?.autoOpenHintTier || 0) >= 1) {
      rotomPane?.openHintTier?.(adaptiveRes.autoOpenHintTier);
    }
    rotomPane?.updateMetrics?.({
      streak: updated?.sessionStreak || 0,
      totalSolved: updated?.totalSolved || 0
    });
    render();
  }
}

/**
 * Works out which stone is hidden and which stones are safe to print for a fact-family triangle.
 * Tight custom filters can degrade a 'missing' puzzle into a plain numeric equation whose meta
 * already holds all 3 numbers (including the answer), so we resolve the unknown slot algebraically
 * against problem.answer and never blindly default to hiding 'whole'. If the shape does not match,
 * every stone stays masked as '?'.
 */
function resolveTriangleStones(problem) {
  const toStone = (value) => (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))
    ? null
    : Number(value));
  const parts = Array.isArray(problem?.meta?.parts) ? problem.meta.parts : [];
  const stones = {
    whole: toStone(problem?.meta?.whole),
    left: toStone(parts[0]),
    right: toStone(parts[1])
  };
  const answer = Number(problem?.answer);
  const op = problem?.operation;
  const isMulDiv = op === 'mul' || op === 'div';
  const isAddSub = op === 'add' || op === 'sub';
  const hidden = Object.keys(stones).filter((slot) => stones[slot] === null);

  let missingSlot = null;
  if (Number.isFinite(answer) && (isMulDiv || isAddSub)) {
    const matchesAnswer = (slot) => {
      if (slot === 'whole') {
        return (isMulDiv ? stones.left * stones.right : stones.left + stones.right) === answer;
      }
      const other = slot === 'left' ? stones.right : stones.left;
      if (isMulDiv) return other !== 0 && stones.whole / other === answer;
      return stones.whole - other === answer;
    };

    if (hidden.length === 1) {
      if (matchesAnswer(hidden[0])) missingSlot = hidden[0];
    } else if (hidden.length === 0) {
      // Numeric fallback (e.g. tight customFilter): hide the slot that actually equals problem.answer.
      const candidateSlot = (op === 'add' || op === 'mul') ? 'whole' : 'right';
      if (stones[candidateSlot] === answer && matchesAnswer(candidateSlot)) {
        missingSlot = candidateSlot;
      }
    }
  }

  const trusted = missingSlot !== null;
  return {
    trusted,
    missingSlot,
    stones,
    isMulDiv,
    // True when a printed (given) stone already equals the answer, e.g. "2 + ? = 4" or "4 × 1 = ?".
    showsAnswer: trusted
      ? Object.entries(stones).some(([slot, value]) => slot !== missingSlot && value === answer)
      : false
  };
}

function renderTrianglePuzzle(problem) {
  const resolved = resolveTriangleStones(problem);
  const { trusted, missingSlot, stones, isMulDiv } = resolved;
  const whole = trusted ? stones.whole : null;
  const leftPart = trusted ? stones.left : null;
  const rightPart = trusted ? stones.right : null;
  const maskedExpression = !trusted && typeof problem?.expression === 'string' && problem.expression.includes('?')
    ? problem.expression
    : '';
  const relationLabel = isMulDiv ? 'Factor × Factor = Product' : 'Part + Part = Whole';
  const stoneValue = (slot, value) => escapeHtml(!trusted ? '?' : slot === missingSlot ? (_keypadValue || '?') : value);

  return `
    <div class="pm-forge-triangle-arena">
      <svg class="pm-forge-triangle-svg" viewBox="0 0 320 220" preserveAspectRatio="none" aria-hidden="true">
        <line x1="160" y1="48" x2="78" y2="170" stroke="#38bdf8" stroke-width="4" stroke-dasharray="7 5" />
        <line x1="160" y1="48" x2="242" y2="170" stroke="#38bdf8" stroke-width="4" stroke-dasharray="7 5" />
        <line x1="78" y1="170" x2="242" y2="170" stroke="#a855f7" stroke-width="4" stroke-dasharray="7 5" />
      </svg>

      <div style="position:relative; z-index:1; font-size:0.8rem; font-weight:800; color:#bae6fd; letter-spacing:0.04em;">
        ✨ ${escapeHtml(relationLabel)}
      </div>
      ${maskedExpression ? `<div style="position:relative; z-index:1; font-size:1.05rem; font-weight:900; color:#fef08a;">${escapeHtml(maskedExpression)}</div>` : ''}

      <div class="pm-forge-stone-row">
        <div class="pm-forge-evo-stone ${missingSlot === 'whole' ? 'is-missing' : ''}">
          <span class="pm-forge-stone-label">${isMulDiv ? 'Product' : 'Whole'}</span>
          <span class="pm-forge-stone-val">${stoneValue('whole', whole)}</span>
        </div>
      </div>

      <div class="pm-forge-stone-row">
        <div class="pm-forge-evo-stone ${missingSlot === 'left' ? 'is-missing' : ''}">
          <span class="pm-forge-stone-label">${isMulDiv ? 'Factor A' : 'Part A'}</span>
          <span class="pm-forge-stone-val">${stoneValue('left', leftPart)}</span>
        </div>
        <div class="pm-forge-evo-stone ${missingSlot === 'right' ? 'is-missing' : ''}">
          <span class="pm-forge-stone-label">${isMulDiv ? 'Factor B' : 'Part B'}</span>
          <span class="pm-forge-stone-val">${stoneValue('right', rightPart)}</span>
        </div>
      </div>
    </div>
  `;
}

function renderBalancePuzzle(problem) {
  const leftDisplay = _keypadValue
    ? String(problem.leftExpr || '?').replace('?', _keypadValue)
    : String(problem.leftExpr || '?');

  return `
    <div class="pm-forge-scale-arena">
      <div style="font-size:0.85rem; font-weight:800; color:#1e40af;">⚖️ Legendary Balance Scale</div>
      <div class="pm-forge-scale-beam-wrap" style="transform: rotate(${_scaleTiltDeg}deg);">
        <svg viewBox="0 0 320 60" width="100%" height="56" aria-hidden="true">
          <rect x="20" y="22" width="280" height="8" rx="4" fill="#1e3a8a" />
          <circle cx="160" cy="26" r="11" fill="#ffcb05" stroke="#b45309" stroke-width="3" />
          <line x1="50" y1="30" x2="50" y2="56" stroke="#64748b" stroke-width="3" />
          <line x1="270" y1="30" x2="270" y2="56" stroke="#64748b" stroke-width="3" />
        </svg>
        <div class="pm-forge-scale-pans">
          <div class="pm-forge-scale-pan">
            <span style="font-size:0.72rem; color:#64748b;">LEFT PAN</span>
            <span style="font-size:1.3rem;">${escapeHtml(leftDisplay)}</span>
          </div>
          <div class="pm-forge-scale-pan">
            <span style="font-size:0.72rem; color:#64748b;">RIGHT PAN</span>
            <span style="font-size:1.3rem;">${escapeHtml(problem.rightExpr || '')}</span>
          </div>
        </div>
      </div>
      <div style="font-size:0.82rem; font-weight:700; color:#334155;">
        Make both sides equal so the golden beam levels!
      </div>
    </div>
  `;
}

function renderEvolutionOverlay() {
  if (!_evoState) return '';
  const { phase, oldBuddy, newBuddy } = _evoState;

  if (phase === 'trainingComplete') {
    return `
      <div class="pm-forge-overlay" data-evo-overlay role="dialog" aria-label="Forge Trial Complete">
        <div style="font-size:2.4rem;">🌟</div>
        <div class="pm-forge-evo-stage-ring">
          <div data-evo-sprite></div>
        </div>
        <div class="pm-forge-evo-banner">
          <h3 style="margin:0 0 6px; color:#ffcb05;">Forge Shrine Complete!</h3>
          <p style="margin:0; line-height:1.45;">
            Earned <strong>+40 Stardust</strong>, <strong>+25 Coins</strong>, and <strong>+1 Rare Candy</strong>!
            ${_evoState.eggsWarmed > 0 ? 'Your Mystery Eggs grew warmer too!' : ''}
          </p>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">
          <button type="button" class="btn-3d btn-gold pm-forge-submit" style="width:auto; padding:10px 18px;" data-action="goto-camp">Pick Another Buddy in Camp →</button>
          <button type="button" class="btn-3d pm-forge-btn-ghost" data-action="restart-trial">Play Forge Again</button>
        </div>
      </div>
    `;
  }

  const isMorphing = phase === 'morphing';
  return `
    <div class="pm-forge-overlay" data-evo-overlay role="dialog" aria-label="Evolution Sequence">
      <div style="font-size:0.9rem; font-weight:900; letter-spacing:0.08em; color:#bae6fd;">
        ${isMorphing ? '✨ EVOLUTION ENERGY SURGING...' : '🎉 EVOLUTION COMPLETE!'}
      </div>
      <div class="pm-forge-evo-stage-ring">
        <div class="pm-forge-evo-morph ${isMorphing ? 'is-silhouette' : ''}" data-evo-sprite></div>
      </div>
      <div class="pm-forge-evo-banner">
        ${isMorphing
          ? `<h3 style="margin:0; color:#ffcb05;">What? ${escapeHtml(oldBuddy?.name || 'Buddy')} is evolving!</h3>`
          : `
            <h3 style="margin:0 0 6px; color:#ffcb05;">Congratulations!</h3>
            <p style="margin:0; line-height:1.45;">
              Your <strong>${escapeHtml(oldBuddy?.name || '')}</strong> evolved into <strong>${escapeHtml(newBuddy?.name || '')}</strong>!
              Registered in Pokédex &amp; +1 Buddy Level!
            </p>
          `
        }
      </div>
      ${isMorphing ? '' : `
        <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">
          <button type="button" class="btn-3d btn-gold pm-forge-submit" style="width:auto; padding:10px 18px;" data-action="goto-camp">Celebrate in Buddy Camp →</button>
          <button type="button" class="btn-3d pm-forge-btn-ghost" data-action="restart-trial">New Forge Trial</button>
        </div>
      `}
    </div>
  `;
}

function render() {
  if (!_container) return;
  const { state, pokemonData, vfx } = getApis();
  const profile = state.getActiveProfile();
  const focusSelector = captureFocusSelector();

  if (!profile) {
    _container.innerHTML = `<div class="pm-forge"><div class="pm-forge-stage">Select a Trainer Profile to enter the Evolution Forge!</div></div>`;
    return;
  }

  const buddy = pokemonData.getPokemonById(profile.activeBuddyId);
  const canEvolve = Boolean(buddy?.evolvesTo);
  const targetEvo = resolveTargetEvolution(buddy);
  const meter = Math.round(profile.evolutionMeter || 0);
  const isGlowing = canEvolve || meter >= 100;
  const problem = _problems[_puzzleIndex];

  const branchOptions = Array.isArray(buddy?.evolvesToOptions) && buddy.evolvesToOptions.length > 0
    ? buddy.evolvesToOptions.map((id) => pokemonData.getPokemonById(id)).filter(Boolean)
    : [];

  const choices = Array.isArray(problem?.choices) ? problem.choices : [];

  _container.innerHTML = `
    <div class="pm-forge ${isGlowing ? 'is-glowing' : ''}">
      <div class="pm-forge-bg" data-forge-bg></div>
      <div class="pm-forge-inner">
        <header class="pm-forge-header">
          <div>
            <h2 class="pm-forge-title">🔮 Evolution Forge Shrine</h2>
            <p class="pm-forge-sub">
              ${canEvolve && !_trainingOnly
                ? `Complete all 3 Forge Seals to evolve ${escapeHtml(buddy?.name || 'Buddy')} into ${escapeHtml(targetEvo?.name || '')}!`
                : `${escapeHtml(buddy?.name || 'Buddy')} is training at the Shrine for Stardust, Rare Candies & Egg Warmth!`}
            </p>
          </div>
          <div class="pm-forge-seals" aria-label="Trial Progress">
            ${[0, 1, 2].map((idx) => {
              const cls = idx < _puzzleIndex ? 'is-done' : idx === _puzzleIndex ? 'is-active' : '';
              return `<span class="pm-forge-seal ${cls}">${idx < _puzzleIndex ? '✓' : `Seal ${idx + 1}`}</span>`;
            }).join('')}
          </div>
        </header>

        <section class="pm-forge-pedestal">
          <div class="pm-forge-pair">
            <div class="pm-forge-buddy-slot">
              <div data-buddy-preview></div>
              <div>
                <div style="font-weight:900;">${escapeHtml(buddy?.name || 'Buddy')}</div>
                <div style="font-size:0.78rem; color:#cbd5e1;">Lv. ${profile.buddyLevel || 1}</div>
              </div>
            </div>
            ${canEvolve && !_trainingOnly && targetEvo ? `
              <span style="font-size:1.3rem; color:#ffcb05; font-weight:900;">→</span>
              <div class="pm-forge-buddy-slot">
                <div data-target-preview></div>
                <div>
                  <div style="font-weight:900; color:#fef08a;">${escapeHtml(targetEvo.name)}</div>
                  <div style="font-size:0.78rem; color:#cbd5e1;">${escapeHtml((targetEvo.types || []).join(' / '))}</div>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="pm-forge-meter-wrap">
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:800;">
              <span>Evolution Forge Charge</span>
              <span>${meter}%</span>
            </div>
            <div class="pm-forge-meter-bar">
              <div class="pm-forge-meter-fill" style="width:${Math.min(100, meter)}%;"></div>
            </div>
            ${branchOptions.length > 0 ? `
              <div class="pm-forge-branch-pills" role="group" aria-label="Evolution branch choices">
                ${branchOptions.map((opt) => `
                  <button type="button" class="pm-forge-branch-pill ${targetEvo?.id === opt.id ? 'is-selected' : ''}" data-action="pick-branch" data-species="${escapeHtml(opt.id)}">
                    ${escapeHtml(opt.name)}
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            ${canEvolve ? `
              <button type="button" class="btn-3d pm-forge-btn-ghost" data-action="toggle-training">
                ${_trainingOnly ? 'Evolution Trial Mode' : 'Shrine Training Mode (No Evolve)'}
              </button>
            ` : ''}
            <button type="button" class="btn-3d pm-forge-btn-ghost" data-action="goto-camp">Switch Buddy in Camp →</button>
          </div>
        </section>

        <section class="pm-forge-stage">
          <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:8px; margin-bottom:12px;">
            <div>
              <span style="font-size:0.78rem; font-weight:900; color:#4338ca; text-transform:uppercase;">
                Seal ${_puzzleIndex + 1} of 3 • ${_puzzleIndex === 1 ? 'Balance Equation' : 'Fact-Family Stones'}
              </span>
              <div style="font-size:1.1rem; font-weight:800; margin-top:2px;">${escapeHtml(problem?.promptText || '')}</div>
            </div>
            <button type="button" class="btn-3d btn-secondary btn-sm" data-action="speak-problem">🔊 Read</button>
          </div>

          <div class="pm-forge-grid">
            ${_puzzleIndex === 1 ? renderBalancePuzzle(problem) : renderTrianglePuzzle(problem)}

            <div style="display:flex; flex-direction:column; gap:10px;">
              <div class="pokenav-choice-grid pm-forge-choices" role="group" aria-label="Answer choices">
                ${choices.map((ch) => `
                  <button type="button" class="pokenav-choice-tile pokenav-tactile pm-forge-choice" data-action="pick-choice" data-value="${escapeHtml(ch)}">${escapeHtml(ch)}</button>
                `).join('')}
              </div>
              <div class="pokenav-keypad pm-forge-keypad">
                <div class="pokenav-keypad-display pm-forge-keypad-display" aria-live="polite">
                  <span class="pm-forge-keypad-label">Stone Input</span>
                  <span>${escapeHtml(_keypadValue || '—')}</span>
                </div>
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `
                  <button type="button" class="pokenav-keypad-btn pm-forge-key" data-action="key-digit" data-digit="${d}">${d}</button>
                `).join('')}
                <button type="button" class="pokenav-keypad-btn is-action pm-forge-key" data-action="key-clear">C</button>
                <button type="button" class="pokenav-keypad-btn pm-forge-key" data-action="key-digit" data-digit="0">0</button>
                <button type="button" class="pokenav-keypad-btn is-action pm-forge-key" data-action="key-back">⌫</button>
              </div>
              <button type="button" class="btn-3d btn-gold pm-forge-submit" data-action="submit-answer" ${_keypadValue === '' ? 'disabled' : ''}>
                Channel Forge Energy!
              </button>
            </div>
          </div>

          ${_feedback ? `<div class="pokenav-feedback is-nudge pm-forge-nudge" role="status">${escapeHtml(_feedback)}</div>` : ''}
        </section>
      </div>
      ${renderEvolutionOverlay()}
    </div>
  `;

  const bgSlot = _container.querySelector('[data-forge-bg]');
  if (bgSlot && vfx?.mountBiomeBackdrop) {
    vfx.mountBiomeBackdrop(bgSlot, 'summit');
  }

  const buddySlot = _container.querySelector('[data-buddy-preview]');
  if (buddySlot && buddy) {
    buddySlot.appendChild(renderVisualSafe(vfx, buddy, {
      shiny: Boolean(profile.caught?.[buddy.id]?.shiny),
      size: 62,
      accessories: profile.equippedAccessories || [],
      animate: true
    }));
  }

  const targetSlot = _container.querySelector('[data-target-preview]');
  if (targetSlot && targetEvo) {
    targetSlot.appendChild(renderVisualSafe(vfx, targetEvo, {
      shiny: Boolean(profile.caught?.[buddy?.id]?.shiny),
      size: 62,
      animate: false
    }));
  }

  const evoSpriteSlot = _container.querySelector('[data-evo-sprite]');
  if (evoSpriteSlot && _evoState) {
    const showSpecies = _evoState.phase === 'morphing' ? _evoState.oldBuddy : _evoState.newBuddy;
    evoSpriteSlot.appendChild(renderVisualSafe(vfx, showSpecies, {
      shiny: _evoState.shiny,
      size: 146,
      accessories: _evoState.phase === 'morphing' ? [] : (profile.equippedAccessories || []),
      animate: true
    }));
  }
  restoreFocus(focusSelector);
}

function resetTrial() {
  const { state } = getApis();
  const profile = state.getActiveProfile();
  _puzzleIndex = 0;
  _evoState = null;
  _feedback = null;
  _keypadValue = '';
  _scaleTiltDeg = -6;
  _problems = buildTrialProblems(profile);
  syncCurrentProblemToRotom();
  render();
}

function handleContainerClick(event) {
  const btn = event.target?.closest?.('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const { audio, onNavigate } = getApis();
  audio?.unlockAudio?.();

  if (action === 'pick-branch') {
    _selectedBranchId = btn.dataset.species;
    audio?.playClick?.('select');
    render();
    return;
  }

  if (action === 'toggle-training') {
    _trainingOnly = !_trainingOnly;
    audio?.playClick?.('toggle');
    render();
    return;
  }

  if (action === 'goto-camp') {
    audio?.playClick?.('confirm');
    onNavigate?.('camp', { tab: 'camp' });
    return;
  }

  if (action === 'restart-trial') {
    audio?.playClick?.('confirm');
    resetTrial();
    return;
  }

  if (action === 'speak-problem') {
    const problem = _problems[_puzzleIndex];
    audio?.playClick?.('tap');
    audio?.speakText?.(problem?.spokenPrompt || problem?.promptText || '', true);
    return;
  }

  if (action === 'pick-choice') {
    audio?.playClick?.('confirm');
    submitForgeAnswer(btn.dataset.value);
    return;
  }

  if (action === 'key-digit') {
    if (_keypadValue.length < 5) {
      _keypadValue += btn.dataset.digit || '';
      audio?.playClick?.('keypad');
      render();
    }
    return;
  }

  if (action === 'key-back') {
    _keypadValue = _keypadValue.slice(0, -1);
    audio?.playClick?.('tap');
    render();
    return;
  }

  if (action === 'key-clear') {
    _keypadValue = '';
    audio?.playClick?.('cancel');
    render();
    return;
  }

  if (action === 'submit-answer' && _keypadValue !== '') {
    audio?.playClick?.('submit');
    submitForgeAnswer(_keypadValue);
  }
}

/**
 * Mounts Mode 4: Evolution Forge into containerEl.
 * @param {HTMLElement} containerEl
 * @param {Object} context
 */
export function mount(containerEl, context = {}) {
  unmount();
  _container = containerEl;
  _ctx = context;

  const { state, pokemonData } = getApis();
  const profile = state.getActiveProfile();
  const buddy = profile ? pokemonData.getPokemonById(profile.activeBuddyId) : null;
  _selectedBranchId = buddy?.evolvesTo || null;
  _trainingOnly = false;
  _puzzleIndex = 0;
  _evoState = null;
  _feedback = null;
  _keypadValue = '';
  _scaleTiltDeg = -6;
  _problems = buildTrialProblems(profile);

  ensureStyles();
  if (_container) {
    _container.addEventListener('click', handleContainerClick);
  }
  syncCurrentProblemToRotom();
  render();
}

/**
 * Cleanly clears all timers, listeners, and DOM state for Evolution Forge.
 */
export function unmount() {
  clearTimers();
  if (_container) {
    _container.removeEventListener('click', handleContainerClick);
    _container.innerHTML = '';
  }
  removeStyles();
  _container = null;
  _ctx = null;
  _problems = [];
  _puzzleIndex = 0;
  _selectedBranchId = null;
  _trainingOnly = false;
  _keypadValue = '';
  _feedback = null;
  _evoState = null;
}

/**
 * Handles keyboard shortcuts for keypad input and submission in Evolution Forge.
 * @param {KeyboardEvent} event
 * @returns {boolean}
 */
export function handleKey(event) {
  if (!_container || !event || _evoState) return false;
  const tag = event.target?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false;

  const { audio } = getApis();
  if (/^[0-9]$/.test(event.key)) {
    if (_keypadValue.length < 5) {
      _keypadValue += event.key;
      audio?.playClick?.('keypad');
      render();
    }
    return true;
  }
  if (event.key === 'Backspace') {
    if (_keypadValue.length > 0) {
      _keypadValue = _keypadValue.slice(0, -1);
      audio?.playClick?.('tap');
      render();
    }
    return true;
  }
  if (event.key === 'Escape') {
    _keypadValue = '';
    audio?.playClick?.('cancel');
    render();
    return true;
  }
  if (event.key === 'Enter' && _keypadValue !== '') {
    if (tag === 'BUTTON') return false;
    audio?.playClick?.('submit');
    submitForgeAnswer(_keypadValue);
    return true;
  }
  return false;
}
