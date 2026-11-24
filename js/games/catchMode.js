/**
 * PokéMath Mode 2: Poké Ball Catch Safari & Number Line Launch
 * Exports uniform controller interface: { mount, unmount, handleKey }
 */

const STYLE_ELEMENT_ID = 'pm-catch-mode-styles';
const CHALLENGE_ORDER = ['numberLine', 'placeValue', 'comparison'];

const PRACTICE_BALL = {
  id: 'practiceball',
  name: 'Practice Ball',
  catchMultiplier: 1.0,
  shinyBonus: 0,
  primaryColor: '#E3350D',
  accentColor: '#FFFFFF',
  description: 'Free unlimited practice sphere so adventures never stall!',
  svgMarkup: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="32" cy="32" r="24" fill="#FFFFFF" stroke="#1E293B" stroke-width="3"/><path d="M8 32a24 24 0 0 1 48 0Z" fill="#FB7185" stroke="#1E293B" stroke-width="3"/><line x1="8" y1="32" x2="56" y2="32" stroke="#1E293B" stroke-width="4"/><circle cx="32" cy="32" r="8" fill="#FFFFFF" stroke="#1E293B" stroke-width="3.5"/><circle cx="32" cy="32" r="3" fill="#38BDF8"/></svg>',
};

const TYPE_COLORS = {
  normal: '#94A3B8',
  fire: '#F97316',
  water: '#3B82F6',
  grass: '#22C55E',
  electric: '#EAB308',
  ice: '#38BDF8',
  fighting: '#DC2626',
  poison: '#A855F7',
  ground: '#D97706',
  flying: '#60A5FA',
  psychic: '#EC4899',
  bug: '#84CC16',
  rock: '#78716C',
  ghost: '#7C3AED',
  dragon: '#4F46E5',
  dark: '#475569',
  steel: '#64748B',
  fairy: '#F472B6',
};

let mounted = false;
let sessionToken = 0;
let container = null;
let ctx = null;
let stateSession = null;

const activeTimeouts = new Set();
const activeListeners = [];

function trackTimeout(fn, delayMs) {
  const token = sessionToken;
  const id = setTimeout(() => {
    activeTimeouts.delete(id);
    if (!mounted || token !== sessionToken) return;
    fn();
  }, delayMs);
  activeTimeouts.add(id);
  return id;
}

function trackListener(target, type, handler, options) {
  if (!target || typeof target.addEventListener !== 'function') return;
  target.addEventListener(type, handler, options);
  activeListeners.push({ target, type, handler, options });
}

function clearAllTimersAndListeners() {
  for (const id of activeTimeouts) clearTimeout(id);
  activeTimeouts.clear();
  for (const entry of activeListeners) {
    try {
      entry.target.removeEventListener(entry.type, entry.handler, entry.options);
    } catch {
      // Ignore cleanup errors on detached targets
    }
  }
  activeListeners.length = 0;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTypeColor(type) {
  return TYPE_COLORS[String(type || 'normal').toLowerCase()] || TYPE_COLORS.normal;
}

function injectCatchStyles() {
  if (typeof document === 'undefined' || !document.head) return;
  if (document.getElementById(STYLE_ELEMENT_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = `
    .pm-catch-root {
      display: flex;
      flex-direction: column;
      gap: 14px;
      width: 100%;
      color: var(--text-main, #1E293B);
      font-family: var(--font-sans, "Nunito", "Quicksand", "Segoe UI", system-ui, sans-serif);
    }
    .pm-catch-root .pm-catch-num {
      font-variant-numeric: tabular-nums;
    }
    .pm-catch-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 16px;
      background: var(--bg-card, rgba(255, 255, 255, 0.94));
      border: 2px solid var(--border-warm, #E8DEC8);
      border-radius: 18px;
      box-shadow: 0 4px 14px rgba(30, 41, 59, 0.06);
    }
    .pm-catch-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 999px;
      background: #FEF2F2;
      border: 1.5px solid #E3350D;
      color: #991B1B;
      font-size: 0.78rem;
      font-weight: 800;
    }
    .pm-catch-pill.is-weakened {
      background: #DCFCE7;
      border-color: #16A34A;
      color: #166534;
    }
    .pm-catch-pill.is-shiny {
      background: linear-gradient(135deg, #FEF08A, #F59E0B);
      border-color: #B45309;
      color: #78350F;
    }
    .pm-catch-arena {
      position: relative;
      overflow: hidden;
      min-height: 250px;
      border-radius: 22px;
      border: 2.5px solid var(--border-warm, #DFD3BC);
      background: linear-gradient(180deg, #DBEAFE 0%, #FFF9F0 100%);
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 10px;
      box-shadow: 0 10px 24px rgba(30, 41, 59, 0.10);
    }
    .pm-catch-bg {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }
    .pm-catch-stage-row {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .pm-catch-encounter-card {
      background: rgba(255, 255, 255, 0.93);
      border: 2px solid #E2D5BE;
      border-radius: 16px;
      padding: 10px 14px;
      min-width: 210px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
    }
    .pm-catch-encounter-visual-box {
      position: relative;
      z-index: 2;
      min-height: 145px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
    }
    .pm-catch-wild-target {
      transition: transform 280ms ease, opacity 260ms ease;
    }
    .pm-catch-wild-target.is-absorbed {
      transform: scale(0.15) translateY(-14px);
      opacity: 0;
    }
    .pm-catch-wild-target.is-hopped {
      animation: pm-catch-hop 360ms ease;
    }
    .pm-catch-capture-ball-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 5;
    }
    .pm-catch-thrown-ball {
      width: 64px;
      height: 64px;
      transform-origin: 50% 80%;
    }
    .pm-catch-thrown-ball.is-launching {
      animation: pm-catch-ball-launch 520ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    .pm-catch-thrown-ball.is-wobble-0,
    .pm-catch-thrown-ball.is-wobble-1,
    .pm-catch-thrown-ball.is-wobble-2 {
      animation: pm-catch-ball-wobble 420ms ease-in-out;
    }
    .pm-catch-thrown-ball.is-caught {
      filter: drop-shadow(0 0 14px rgba(250, 204, 21, 0.9));
      transform: scale(1.08);
    }
    .pm-catch-ball-tray {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 8px;
    }
    .pm-catch-ball-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 54px;
      padding: 8px 10px;
      border-radius: 14px;
      border: 2px solid #CBD5E1;
      border-bottom-width: 4px;
      background: #FFFFFF;
      font-family: inherit;
      cursor: pointer;
      text-align: left;
      color: #0F172A;
    }
    .pm-catch-ball-btn.is-selected {
      border-color: #E3350D;
      background: #FFF1F2;
      box-shadow: 0 4px 12px rgba(227, 53, 13, 0.14);
    }
    .pm-catch-ball-btn:disabled {
      opacity: 0.48;
      cursor: not-allowed;
    }
    .pm-catch-ball-icon {
      width: 34px;
      height: 34px;
      flex-shrink: 0;
    }
    .pm-catch-ball-icon svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .pm-catch-challenge-tabs {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .pm-catch-tab-btn {
      min-height: 52px;
      padding: 8px 10px;
      border-radius: 14px;
      border: 2px solid #CBD5E1;
      border-bottom-width: 4px;
      background: #F8FAFC;
      font-family: inherit;
      font-weight: 800;
      font-size: 0.88rem;
      color: #475569;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .pm-catch-tab-btn.is-active {
      background: #EEF2FF;
      border-color: #3B4CCA;
      color: #1E1B4B;
    }
    .pm-catch-console-card {
      background: var(--bg-card, #FFFFFF);
      border: 2.5px solid var(--border-warm, #DFD3BC);
      border-radius: 20px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: 0 8px 22px rgba(30, 41, 59, 0.08);
    }
    .pm-catch-console-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pm-catch-prompt-text {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 900;
      color: #0F172A;
      line-height: 1.35;
    }
    .pm-catch-nl-wrap {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      border-radius: 16px;
      background: #F8FAFC;
      border: 2px solid #E2E8F0;
    }
    .pm-catch-nl-svg {
      width: 100%;
      height: auto;
      display: block;
      cursor: pointer;
      touch-action: none;
      user-select: none;
    }
    .pm-catch-nl-controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .pm-catch-nl-slider {
      flex: 1;
      min-width: 180px;
      height: 36px;
      accent-color: #E3350D;
      cursor: pointer;
    }
    .pm-catch-tumblers-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .pm-catch-tumbler-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px 10px;
      border-radius: 18px;
      background: #FFF9F0;
      border: 2px solid #E2D5BE;
    }
    .pm-catch-tumbler-digit {
      width: 66px;
      height: 62px;
      border-radius: 14px;
      background: #0F172A;
      color: #FFCB05;
      display: grid;
      place-items: center;
      font-size: 1.9rem;
      font-weight: 900;
      border: 2px solid #334155;
    }
    .pm-catch-scale-stage {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 16px;
      background: #F8FAFC;
      border: 2px solid #E2E8F0;
    }
    .pm-catch-cmp-buttons {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      width: 100%;
    }
    .pm-catch-region {
      display: contents;
    }
    .pm-catch-dial-btn {
      width: 100%;
      min-height: 52px;
      font-size: 1.3rem;
    }
    .pm-catch-cmp-btn {
      flex-direction: column;
      min-height: 62px;
      font-size: 1.45rem;
      gap: 2px;
    }
    .pm-catch-caught-summary {
      padding: 18px;
      border-radius: 20px;
      background: linear-gradient(135deg, #FEF9C3, #ECFDF5);
      border: 3px solid #22C55E;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    @keyframes pm-catch-ball-launch {
      0% { transform: translate3d(-90px, 70px, 0) scale(0.85) rotate(0deg); opacity: 0.7; }
      50% { transform: translate3d(-15px, -52px, 0) scale(1.12) rotate(220deg); opacity: 1; }
      100% { transform: translate3d(0, 0, 0) scale(1) rotate(360deg); opacity: 1; }
    }
    @keyframes pm-catch-ball-wobble {
      0%, 100% { transform: rotate(0deg) translate3d(0, 0, 0); }
      25% { transform: rotate(-18deg) translate3d(-6px, 0, 0); }
      75% { transform: rotate(18deg) translate3d(6px, 0, 0); }
    }
    @keyframes pm-catch-hop {
      0%, 100% { transform: translate3d(0, 0, 0); }
      40% { transform: translate3d(0, -18px, 0); }
    }
    @media (max-width: 720px) {
      .pm-catch-challenge-tabs {
        grid-template-columns: 1fr;
      }
      .pm-catch-tumblers-grid {
        gap: 8px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .pm-catch-thrown-ball,
      .pm-catch-wild-target {
        animation: none !important;
        transition: none !important;
      }
    }
    [data-reduced-motion="true"] .pm-catch-thrown-ball,
    [data-reduced-motion="true"] .pm-catch-wild-target {
      animation: none !important;
      transition: none !important;
    }
  `;
  document.head.appendChild(style);
}

function removeCatchStyles() {
  if (typeof document === 'undefined') return;
  document.getElementById(STYLE_ELEMENT_ID)?.remove();
}

function resolveRoute(profile) {
  const routesData = ctx?.routesData;
  const requestedId = ctx?.modeParams?.routeId;
  if (requestedId && routesData?.getRouteById) {
    const found = routesData.getRouteById(requestedId);
    if (found) return found;
  }
  const rp = profile?.routeProgress || {};
  const list = routesData?.ROUTES || [];
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (rp[list[i].id]?.unlocked) return list[i];
  }
  return list[0] || {
    id: 'route-1',
    number: 1,
    name: 'Sprout Meadow',
    subtitle: 'Addition, Making 10 & Number Bonds',
    biomeKey: 'meadow',
    recommendedTier: 'starter',
    starThresholds: [3, 6, 10],
    wildPool: ['bulbasaur', 'pikachu'],
  };
}

function resolvePokemon(id, fallbackId = 'pikachu') {
  const getById = ctx?.pokemonData?.getPokemonById;
  const roster = ctx?.pokemonData?.POKEMON_ROSTER || [];
  return (
    (id && getById?.(id)) ||
    (fallbackId && getById?.(fallbackId)) ||
    roster[0] || {
      id: 'pikachu',
      name: 'Pikachu',
      types: ['electric'],
      baseHp: 92,
      fallbackPalette: { primary: '#FFCB05', secondary: '#FFE45E', accent: '#B45309', eye: '#1E293B' },
    }
  );
}

function pickWildEncounter(route, excludeId = null) {
  const pool = Array.isArray(route?.wildPool) && route.wildPool.length > 0 ? route.wildPool : ['pikachu'];
  const filtered = pool.length > 1 && excludeId ? pool.filter((id) => id !== excludeId) : pool;
  const chosenId = filtered[Math.floor(Math.random() * filtered.length)] || pool[0];
  return resolvePokemon(chosenId);
}

function getAvailableBalls(profile) {
  const list = Array.isArray(ctx?.itemsData?.POKEBALLS) ? ctx.itemsData.POKEBALLS : [];
  const inv = profile?.inventory || {};
  const mapped = list.map((b) => ({
    ...b,
    owned: Math.max(0, Number(inv[b.id]) || 0),
  }));
  mapped.push({ ...PRACTICE_BALL, owned: Infinity, isPractice: true });
  return mapped;
}

function pickDefaultBallId(profile) {
  const inv = profile?.inventory || {};
  const order = ['pokeball', 'greatball', 'premierball', 'ultraball'];
  for (const id of order) {
    if ((inv[id] || 0) > 0) return id;
  }
  return 'practiceball';
}

function getBallDef(ballId, profile) {
  const list = getAvailableBalls(profile);
  return list.find((b) => b.id === ballId) || list[0] || PRACTICE_BALL;
}

function rollShiny(profile, selectedBallId) {
  const ball = getBallDef(selectedBallId, profile);
  const base = 0.03;
  const charm = Number(profile?.shinyCharmBoost) || 0;
  const streakBonus = (profile?.sessionStreak || 0) >= 4 ? 0.06 : 0;
  const ballBonus = Number(ball?.shinyBonus) || 0;
  return Math.random() < Math.min(0.4, base + charm + streakBonus + ballBonus);
}

function generateChallengeProblem(challengeType, profile, route) {
  const tier = profile?.tier || route?.recommendedTier || 'starter';
  const customFilter = profile?.customFilter || null;
  const adaptiveCfg = ctx?.adaptive?.getRecommendedProblemConfig?.(profile, route.id) || {
    difficultyAdjustment: 0,
    criticalChallenge: false,
  };

  if (challengeType === 'numberLine') {
    const p = ctx.mathEngine.generateProblem({
      tier,
      routeId: route.id,
      format: 'numberLine',
      customFilter,
      difficultyAdjustment: adaptiveCfg.difficultyAdjustment || 0,
    });
    const nl = p.meta?.numberLine || {};
    const ans = Number(p.answer) || 0;
    const rawMin = Number.isFinite(Number(nl.min)) ? Number(nl.min) : 0;
    const rawMax = Number.isFinite(Number(nl.max)) ? Number(nl.max) : Math.max(20, ans + 5);
    const min = Math.min(rawMin, ans);
    const max = Math.max(rawMax, ans + (nl.step || 2));
    const span = max - min;
    const snapStep = span > 40 && (ans - min) % 5 === 0 && span % 5 === 0 ? 5 : 1;
    const majorStep = Math.max(snapStep, Number(nl.step) || (span <= 25 ? 2 : 10));
    const startAim = Math.max(min, Math.min(max, Number.isFinite(Number(nl.start)) ? Number(nl.start) : min));
    return {
      problem: p,
      nlConfig: { min, max, snapStep, majorStep, start: startAim },
    };
  }

  if (challengeType === 'placeValue') {
    let best = null;
    for (let i = 0; i < 12; i += 1) {
      const cand = ctx.mathEngine.generateProblem({
        tier,
        routeId: route.id,
        operation: 'placeValue',
        customFilter,
        difficultyAdjustment: adaptiveCfg.difficultyAdjustment || 0,
      });
      best = cand;
      const ask = cand.meta?.placeDigits?.askPlace;
      if (ask === 'compose' || ask === 'ones') break;
    }
    return { problem: best, nlConfig: null };
  }

  const cmp = ctx.mathEngine.generateProblem({
    tier,
    routeId: route.id,
    operation: 'comparison',
    customFilter,
    difficultyAdjustment: adaptiveCfg.difficultyAdjustment || 0,
  });
  return { problem: cmp, nlConfig: null };
}

function syncRotomToProblem(problem) {
  if (!problem || !ctx?.rotomPane) return;
  const hintBundle = ctx?.hintEngine?.buildHintBundle?.(problem) || null;
  ctx.rotomPane.setProblem?.(problem, hintBundle);
  ctx.rotomPane.setMood?.('curious', 'Line up your math throw to catch this Pokémon!');
}

function formatSkillLabel(problem, fallback) {
  const friendly = ctx?.mathEngine?.formatSkillTag?.(problem?.skillTag);
  return friendly || fallback || 'Math Adventure';
}

/** Called whenever a brand-new problem is put in front of the learner. */
function onNewProblem(problem) {
  if (!problem || !ctx) return;
  ctx.speedBlitz?.resetForProblem?.();
  const profile = ctx.state?.getActiveProfile?.() || stateSession?.profile;
  if (profile?.settings?.speech) {
    ctx.audio?.speakText?.(problem.spokenPrompt || problem.promptText, false);
  }
}

function buildRotomMetrics(profile, adaptiveRes, forceStreak = null) {
  const streak = forceStreak !== null
    ? forceStreak
    : Math.max(0, Number(adaptiveRes?.streak ?? profile?.sessionStreak) || 0);
  const metrics = {
    streak,
    criticalReady: streak >= 4 || Boolean(adaptiveRes?.triggerCriticalChallenge),
    totalSolved: Math.max(0, Number(profile?.totalSolved) || 0),
  };
  const shinyRollBonus = Number(adaptiveRes?.shinyRollBonus) || 0;
  if (shinyRollBonus > 0) metrics.shinyBonusPct = Math.round(shinyRollBonus * 100);
  return metrics;
}

function hideHundredsTumbler(problem) {
  const max = Array.isArray(problem?.targetRange) ? Number(problem.targetRange[1]) : NaN;
  return Number.isFinite(max) && max < 100;
}

function placeValueTotal(s) {
  return s.dials.h * 100 + s.dials.t * 10 + s.dials.o;
}

function initCatchEncounter(challengeIdx = 0, useParams = false) {
  const profile = ctx.state.getActiveProfile();
  const route = resolveRoute(profile);
  const selectedBallId = stateSession?.selectedBallId && getBallDef(stateSession.selectedBallId, profile).owned > 0
    ? stateSession.selectedBallId
    : pickDefaultBallId(profile);

  let wild;
  if (useParams && ctx?.modeParams?.encounterPokemonId) {
    wild = resolvePokemon(ctx.modeParams.encounterPokemonId, route.wildPool?.[0]);
  } else {
    wild = pickWildEncounter(route, stateSession?.wildPokemon?.id || null);
  }

  const isShiny = useParams && typeof ctx?.modeParams?.shiny === 'boolean'
    ? ctx.modeParams.shiny
    : rollShiny(profile, selectedBallId);

  const challengeType = CHALLENGE_ORDER[challengeIdx % CHALLENGE_ORDER.length];
  const { problem, nlConfig } = generateChallengeProblem(challengeType, profile, route);

  stateSession = {
    route,
    profile,
    wildPokemon: wild,
    isShiny,
    isWeakened: Boolean(useParams && ctx?.modeParams?.weakened),
    selectedBallId,
    challengeIdx: challengeIdx % CHALLENGE_ORDER.length,
    challengeType,
    problem,
    nlConfig,
    aimValue: nlConfig ? nlConfig.start : 0,
    dials: { h: 0, t: 0, o: 0 },
    typedBuffer: '',
    scaleChoice: null,
    missesThisEncounter: 0,
    hintsOpenedAtStart: 0,
    animating: false,
    ballPhase: null, // 'launch' | 'wobble-0' | 'wobble-1' | 'wobble-2' | 'caught'
    wildState: 'idle', // 'idle' | 'absorbed' | 'hopped'
    caughtComplete: false,
    catchResult: null,
    statusMessage: `A wild ${wild.name} appeared! Solve the Safari Challenge to throw your Poké Ball!`,
    statusVariant: 'info',
  };
}

function switchChallengeTab(nextType) {
  if (!stateSession || stateSession.animating || stateSession.caughtComplete) return;
  if (!CHALLENGE_ORDER.includes(nextType)) return;
  ctx.audio?.unlockAudio?.();
  ctx.audio?.playClick?.('tap');

  const idx = CHALLENGE_ORDER.indexOf(nextType);
  const { problem, nlConfig } = generateChallengeProblem(nextType, stateSession.profile, stateSession.route);
  stateSession.challengeIdx = idx;
  stateSession.challengeType = nextType;
  stateSession.problem = problem;
  stateSession.nlConfig = nlConfig;
  stateSession.aimValue = nlConfig ? nlConfig.start : 0;
  stateSession.dials = { h: 0, t: 0, o: 0 };
  stateSession.typedBuffer = '';
  stateSession.scaleChoice = null;
  stateSession.hintsOpenedAtStart = 0;

  syncRotomToProblem(problem);
  render({ keepArena: true });
  onNewProblem(problem);
}

function renderPokemonVisualSlot(slotEl, pokemon, options) {
  if (!slotEl) return;
  slotEl.innerHTML = '';
  if (ctx?.vfx?.renderPokemonVisual) {
    const node = ctx.vfx.renderPokemonVisual(pokemon, options);
    if (node) {
      slotEl.appendChild(node);
      return;
    }
  }
  const fallback = document.createElement('div');
  fallback.style.width = `${options?.size || 126}px`;
  fallback.style.height = `${options?.size || 126}px`;
  fallback.style.display = 'grid';
  fallback.style.placeItems = 'center';
  fallback.style.borderRadius = '50%';
  fallback.style.background = pokemon?.fallbackPalette?.primary || '#FFCB05';
  fallback.style.border = '3px solid #1E293B';
  fallback.style.fontWeight = '900';
  fallback.textContent = pokemon?.name || 'Wild';
  slotEl.appendChild(fallback);
}

function computeThrowGrade(misses, hintsUsed) {
  if (misses === 0 && hintsUsed === 0) return { label: 'Excellent Throw!', bonusXp: 15, bonusCoins: 6, bonusStardust: 6 };
  if (misses <= 1) return { label: 'Great Throw!', bonusXp: 8, bonusCoins: 4, bonusStardust: 3 };
  return { label: 'Nice Throw!', bonusXp: 4, bonusCoins: 2, bonusStardust: 1 };
}

function computeStars(solvedCount, thresholds = [3, 6, 10]) {
  let stars = 0;
  for (const t of thresholds) {
    if (solvedCount >= t) stars += 1;
  }
  return Math.min(3, stars);
}

function updateCatchQuests(quests, {
  isNoHints = false,
  isHigherTier = false,
  streak = 0,
  xpGain = 0,
}) {
  if (!Array.isArray(quests)) return;
  for (const q of quests) {
    if (!q || q.claimed) continue;
    const m = q.metric;
    if (m === 'catches' || m === 'catch_pokemon') {
      q.progress = Math.min(q.target, (q.progress || 0) + 1);
    } else if (m === 'totalSolved' || m === 'solve_total') {
      q.progress = Math.min(q.target, (q.progress || 0) + 1);
    } else if (m === 'sessionStreak' || m === 'solve_streak') {
      q.progress = Math.min(q.target, Math.max(q.progress || 0, streak));
    } else if (m === 'solve_no_hints' && isNoHints) {
      q.progress = Math.min(q.target, (q.progress || 0) + 1);
    } else if (m === 'solve_explorer_plus' && isHigherTier) {
      q.progress = Math.min(q.target, (q.progress || 0) + 1);
    } else if (m === 'earn_xp' && xpGain > 0) {
      q.progress = Math.min(q.target, (q.progress || 0) + xpGain);
    }
  }
}

function ballPhaseClass(phase) {
  switch (phase) {
    case 'launch': return 'is-launching';
    case 'wobble-0': return 'is-wobble-0';
    case 'wobble-1': return 'is-wobble-1';
    case 'wobble-2': return 'is-wobble-2';
    case 'caught': return 'is-caught';
    default: return '';
  }
}

function statusIcon(variant) {
  return variant === 'nudge' ? '💡' : variant === 'success' ? '🌟' : '🎯';
}

function statusClassName(variant) {
  return `pokenav-feedback ${variant === 'nudge' ? 'is-nudge' : variant === 'success' ? 'is-correct' : 'is-info'}`;
}

function statusInnerHtml(s) {
  if (!s?.statusMessage) return '';
  return `<span>${statusIcon(s.statusVariant)}</span><span>${escapeHtml(s.statusMessage)}</span>`;
}

function replayClass(el, className) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

function getArenaEl() {
  return container?.querySelector('.pm-catch-arena') || null;
}

/** Updates the feedback banner in place. */
function patchStatus() {
  const el = container?.querySelector('[data-catch-region="status"]');
  if (!el || !stateSession) return;
  el.className = statusClassName(stateSession.statusVariant);
  el.innerHTML = statusInnerHtml(stateSession);
}

/**
 * Syncs wild-target state and the Poké Ball overlay in place so the sprite and
 * biome backdrop never reload while the hop / launch / wobble animations play.
 */
function patchArena() {
  const s = stateSession;
  if (!container || !s) return;

  const target = container.querySelector('.pm-catch-wild-target');
  if (target) {
    target.classList.toggle('is-absorbed', s.wildState === 'absorbed');
    if (s.wildState === 'hopped') {
      replayClass(target, 'is-hopped');
    } else {
      target.classList.remove('is-hopped');
    }
  }

  const host = container.querySelector('[data-ball-host]');
  if (host) {
    if (!s.ballPhase) {
      host.innerHTML = '';
    } else {
      let ball = host.querySelector('.pm-catch-thrown-ball');
      if (!ball) {
        const selectedBall = getBallDef(s.selectedBallId, s.profile);
        host.innerHTML = `
          <div class="pm-catch-capture-ball-overlay">
            <div class="pm-catch-thrown-ball ${ballPhaseClass(s.ballPhase)}" data-phase="${escapeHtml(s.ballPhase)}">${selectedBall.svgMarkup}</div>
          </div>
        `;
      } else if (ball.getAttribute('data-phase') !== s.ballPhase) {
        ball.classList.remove('is-launching', 'is-wobble-0', 'is-wobble-1', 'is-wobble-2', 'is-caught');
        void ball.offsetWidth; // restart the CSS animation for the next wobble
        ball.classList.add(ballPhaseClass(s.ballPhase));
        ball.setAttribute('data-phase', s.ballPhase);
      }
    }
  }

  const meta = container.querySelector('[data-encounter-meta]');
  if (meta) meta.textContent = encounterMetaText();
}

function encounterMetaText() {
  const s = stateSession;
  const wild = s.wildPokemon;
  const caught = s.profile?.caught?.[wild.id];
  return `Pokédex #${String(wild.dexNumber || 25).padStart(3, '0')} • ${caught ? `Caught ×${caught.count}` : 'New Species!'}`;
}

function attemptCatchSubmission(submittedValue) {
  if (!mounted || !stateSession || stateSession.animating || stateSession.caughtComplete) return;
  const problem = stateSession.problem;
  if (!problem) return;

  ctx.audio?.unlockAudio?.();
  const isCorrect = Boolean(ctx.mathEngine?.validateAnswer?.(problem, submittedValue));
  const currentHintTier = Number(ctx.rotomPane?.getCurrentHintTier?.() || 0);
  const hintsUsed = Math.max(stateSession.hintsOpenedAtStart || 0, currentHintTier);
  const isComparison = stateSession.challengeType === 'comparison';

  if (!isCorrect) {
    stateSession.missesThisEncounter += 1;
    let adaptiveRes = null;
    const updatedProfile = ctx.state.updateProfile((draft) => {
      adaptiveRes = ctx.adaptive.recordAttempt(draft, problem.skillTag, false, hintsUsed);
      draft.totalAttempts = (draft.totalAttempts || 0) + 1;
      return draft;
    });
    stateSession.profile = updatedProfile || stateSession.profile;

    if (isComparison) {
      stateSession.scaleChoice = String(submittedValue);
    }
    stateSession.wildState = 'hopped';
    stateSession.statusMessage = `Whoa, it hopped loose! Try Rotom-Dex's hint! ${adaptiveRes?.encouragementMessage || ''}`.trim();
    stateSession.statusVariant = 'nudge';

    ctx.audio?.playGentleNudge?.();
    if (adaptiveRes?.autoOpenHintTier >= 1) {
      ctx.rotomPane?.openHintTier?.(adaptiveRes.autoOpenHintTier);
    }
    ctx.rotomPane?.setMood?.('encouraging', adaptiveRes?.encouragementMessage || 'Check Rotom-Dex for a helpful clue!');
    ctx.rotomPane?.updateMetrics?.(buildRotomMetrics(stateSession.profile, adaptiveRes, 0));

    // In-place hop + graze; then float text on the still-mounted arena.
    patchStatus();
    patchArena();
    if (isComparison) {
      refreshChallenge();
    } else {
      replayClass(container?.querySelector('[data-action="submit-catch"]'), 'pokenav-graze');
    }
    const arenaEl = getArenaEl();
    if (arenaEl) {
      ctx.vfx?.spawnFloatingText?.(arenaEl, 'Hopped loose!', 'nudge');
    }

    trackTimeout(() => {
      if (!stateSession) return;
      stateSession.wildState = 'idle';
      stateSession.scaleChoice = null;
      patchArena();
      if (isComparison) refreshChallenge();
    }, 380);
    return;
  }

  // Correct answer -> Launch full Poké Ball capture sequence!
  if (isComparison) {
    stateSession.scaleChoice = String(submittedValue);
  }
  // main.js owns the Speed Blitz window and awards +2 Coins & +2 Stardust itself.
  stateSession.blitzBonus = ctx.speedBlitz?.consumeBonus?.() || false;
  stateSession.animating = true;
  stateSession.ballPhase = 'launch';
  stateSession.wildState = 'absorbed';
  const grade = computeThrowGrade(stateSession.missesThisEncounter, hintsUsed);
  stateSession.statusMessage = `${grade.label} Launching ${getBallDef(stateSession.selectedBallId, stateSession.profile).name}…`;
  stateSession.statusVariant = 'info';

  ctx.audio?.playPokeballThrow?.();
  patchStatus();
  patchArena();
  if (isComparison) refreshChallenge();

  const setWobble = (phase, message, wobbleIdx) => {
    if (!stateSession) return;
    stateSession.ballPhase = phase;
    stateSession.statusMessage = message;
    ctx.audio?.playPokeballWobble?.(wobbleIdx);
    patchStatus();
    patchArena();
  };

  trackTimeout(() => setWobble('wobble-0', 'Wobble… 1!', 0), 550);
  trackTimeout(() => setWobble('wobble-1', 'Wobble… 2!', 1), 1100);
  trackTimeout(() => setWobble('wobble-2', 'Almost… 3!', 2), 1650);

  trackTimeout(() => {
    if (!stateSession) return;
    finalizeSuccessfulCatch(problem, hintsUsed, grade);
  }, 2250);
}

function finalizeSuccessfulCatch(problem, hintsUsed, grade) {
  if (!stateSession) return;
  const wild = stateSession.wildPokemon;
  const isShiny = Boolean(stateSession.isShiny);
  const ballId = stateSession.selectedBallId;
  const wasNewSpecies = !stateSession.profile?.caught?.[wild.id];

  const xpGain = 18 + grade.bonusXp;
  const meterGain = 14;
  const coinGain = 6 + grade.bonusCoins;
  const stardustGain = 8 + grade.bonusStardust;

  let adaptiveRes = null;
  let unlockedEmblemNow = false;

  const updatedProfile = ctx.state.updateProfile((draft) => {
    adaptiveRes = ctx.adaptive.recordAttempt(draft, problem.skillTag, true, hintsUsed);
    draft.totalAttempts = (draft.totalAttempts || 0) + 1;
    draft.totalSolved = (draft.totalSolved || 0) + 1;
    draft.buddyXp = (draft.buddyXp || 0) + xpGain;
    draft.buddyLevel = Math.max(draft.buddyLevel || 1, 1 + Math.floor(draft.buddyXp / 100));
    draft.evolutionMeter = Math.min(100, (draft.evolutionMeter || 0) + meterGain);
    draft.coins = (draft.coins || 0) + coinGain;
    draft.stardust = (draft.stardust || 0) + stardustGain;

    if (!draft.caught || typeof draft.caught !== 'object') draft.caught = {};
    const existing = draft.caught[wild.id];
    if (existing) {
      existing.count = (existing.count || 1) + 1;
      existing.shiny = Boolean(existing.shiny || isShiny);
    } else {
      draft.caught[wild.id] = {
        count: 1,
        shiny: isShiny,
        firstCaughtAt: Date.now(),
        nickname: null,
      };
    }

    if (ballId !== 'practiceball' && draft.inventory && (draft.inventory[ballId] || 0) > 0) {
      draft.inventory[ballId] -= 1;
    }

    const rp = draft.routeProgress?.[stateSession.route.id];
    if (rp) {
      rp.solvedCount = (rp.solvedCount || 0) + 1;
      rp.stars = Math.max(
        rp.stars || 0,
        computeStars(rp.solvedCount, stateSession.route.starThresholds)
      );
      if (!draft.classicEmblemUnlocked && (rp.stars >= 1 || draft.totalSolved >= 3)) {
        draft.classicEmblemUnlocked = true;
        unlockedEmblemNow = true;
      }
    } else if (!draft.classicEmblemUnlocked) {
      draft.classicEmblemUnlocked = true;
      unlockedEmblemNow = true;
    }

    updateCatchQuests(draft.activeQuests, {
      isNoHints: hintsUsed === 0,
      isHigherTier: problem.tier !== 'starter',
      streak: adaptiveRes?.streak || 1,
      xpGain,
    });
    return draft;
  });

  stateSession.profile = updatedProfile || stateSession.profile;
  stateSession.animating = false;
  stateSession.ballPhase = 'caught';
  stateSession.caughtComplete = true;
  stateSession.catchResult = {
    gradeLabel: grade.label,
    wasNewSpecies,
    xpGain,
    coinGain,
    stardustGain,
  };
  stateSession.statusMessage = `Gotcha! ${wild.name} was caught with ${grade.label}`;
  stateSession.statusVariant = 'success';

  ctx.audio?.playCatchFanfare?.();
  if (unlockedEmblemNow) {
    ctx.shell?.showToast?.('Classic Trainer 1996 Heritage Emblem unlocked!', 'success');
  }
  ctx.rotomPane?.setMood?.('starry', `Click! ${wild.name} joined your Pokédex!`);
  ctx.rotomPane?.updateMetrics?.(buildRotomMetrics(stateSession.profile, adaptiveRes));

  // Swap the console for the caught summary; arena (sprite + backdrop) is patched in place.
  render({ keepArena: true });

  const arenaEl = getArenaEl();
  if (arenaEl) {
    ctx.vfx?.burstConfetti?.(arenaEl);
    ctx.vfx?.spawnFloatingText?.(arenaEl, 'Gotcha!', 'crit');
    if (stateSession.blitzBonus) {
      const bonus = stateSession.blitzBonus;
      const coins = typeof bonus === 'object' && Number.isFinite(Number(bonus.coins)) ? Number(bonus.coins) : 2;
      ctx.vfx?.spawnFloatingText?.(arenaEl, `⚡ Speed Blitz +${coins}c`, 'coins');
    }
  }
}

function renderNumberLineSvgMarkup() {
  const s = stateSession;
  const cfg = s.nlConfig || { min: 0, max: 20, snapStep: 1, majorStep: 2, start: 0 };
  const span = Math.max(1, cfg.max - cfg.min);
  const padX = 36;
  const width = 600;
  const trackW = width - padX * 2;
  const yTrack = 82;

  const valToX = (val) => {
    const clamped = Math.max(cfg.min, Math.min(cfg.max, val));
    return padX + ((clamped - cfg.min) / span) * trackW;
  };

  const aimClamped = Math.max(cfg.min, Math.min(cfg.max, Number(s.aimValue) || cfg.min));
  const aimX = valToX(aimClamped);
  const startX = valToX(cfg.start);
  const midX = (startX + aimX) / 2;
  const arcTopY = Math.max(18, yTrack - Math.min(54, Math.abs(aimX - startX) * 0.25 + 22));

  const ticks = [];
  const step = Math.max(1, cfg.majorStep);
  const seenTicks = new Set();
  for (let v = cfg.min; v <= cfg.max; v += step) {
    seenTicks.add(v);
  }
  seenTicks.add(cfg.min);
  seenTicks.add(cfg.max);
  const sortedTicks = Array.from(seenTicks).sort((a, b) => a - b);

  // Thin tick labels if too dense
  const maxLabels = 14;
  const labelStride = sortedTicks.length > maxLabels ? Math.ceil(sortedTicks.length / maxLabels) : 1;

  for (let i = 0; i < sortedTicks.length; i += 1) {
    const v = sortedTicks[i];
    const x = valToX(v);
    const showLabel = i % labelStride === 0 || v === cfg.max || v === cfg.min;
    ticks.push(`
      <line x1="${x.toFixed(1)}" y1="${yTrack - 10}" x2="${x.toFixed(1)}" y2="${yTrack + 10}" stroke="#334155" stroke-width="2.5" stroke-linecap="round"/>
      ${showLabel ? `<text x="${x.toFixed(1)}" y="${yTrack + 28}" text-anchor="middle" font-size="13" font-weight="800" fill="#334155" style="font-variant-numeric:tabular-nums;">${v}</text>` : ''}
    `);
  }

  return `
    <svg class="pm-catch-nl-svg" viewBox="0 0 ${width} 125" role="img" aria-label="Interactive number line from ${cfg.min} to ${cfg.max}">
      <rect x="0" y="0" width="${width}" height="125" rx="12" fill="#FFFFFF"/>
      <line x1="${padX}" y1="${yTrack}" x2="${width - padX}" y2="${yTrack}" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
      ${ticks.join('')}
      <path d="M ${startX.toFixed(1)} ${yTrack} Q ${midX.toFixed(1)} ${arcTopY.toFixed(1)} ${aimX.toFixed(1)} ${yTrack - 12}" fill="none" stroke="#E3350D" stroke-width="3" stroke-dasharray="6 5" opacity="0.75"/>
      <circle cx="${aimX.toFixed(1)}" cy="${yTrack}" r="14" fill="#E3350D" stroke="#FFFFFF" stroke-width="3"/>
      <rect x="${(aimX - 24).toFixed(1)}" y="${Math.max(4, yTrack - 46)}" width="48" height="24" rx="8" fill="#1E293B"/>
      <text x="${aimX.toFixed(1)}" y="${Math.max(20, yTrack - 30)}" text-anchor="middle" font-size="13" font-weight="900" fill="#FFCB05" style="font-variant-numeric:tabular-nums;">${aimClamped}</text>
    </svg>
  `;
}

function renderChallengeMarkup() {
  const s = stateSession;
  const p = s.problem;

  if (s.challengeType === 'numberLine') {
    const cfg = s.nlConfig || { min: 0, max: 20, snapStep: 1, majorStep: 2 };
    const displayAim = nlDisplayAim(s);
    return `
      <div class="pm-catch-nl-wrap">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <span style="font-weight:800;font-size:0.86rem;color:#475569;">
            Tap or drag on the Number Line, slide, type, or use ← → keys to aim!
          </span>
          <span class="pm-catch-stat-chip pm-catch-num" data-nl-aim style="padding:4px 12px;border-radius:999px;background:#0F172A;color:#FFCB05;font-weight:900;">Aim: ${escapeHtml(displayAim)}</span>
        </div>
        ${renderNumberLineSvgMarkup()}
        <div class="pm-catch-nl-controls">
          <button type="button" class="btn-3d" data-nl-nudge="${-cfg.snapStep}" aria-label="Move aim left by ${cfg.snapStep}">-${cfg.snapStep}</button>
          <input type="range" class="pm-catch-nl-slider" min="${cfg.min}" max="${cfg.max}" step="${cfg.snapStep}" value="${Math.max(cfg.min, Math.min(cfg.max, Number(s.aimValue) || cfg.min))}" aria-label="Number line aim slider" />
          <button type="button" class="btn-3d" data-nl-nudge="${cfg.snapStep}" aria-label="Move aim right by ${cfg.snapStep}">+${cfg.snapStep}</button>
        </div>
        <button type="button" class="btn-3d btn-primary" data-action="submit-catch" data-nl-throw style="width:100%;">
          Throw Poké Ball at ${escapeHtml(displayAim)}! 🎯
        </button>
      </div>
    `;
  }

  if (s.challengeType === 'placeValue') {
    const cols = placeColumns(p);
    return `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="pm-catch-tumblers-grid" style="grid-template-columns:repeat(${cols.length}, minmax(0, 1fr));">
          ${cols.map((col) => `
            <div class="pm-catch-tumbler-col">
              <div style="font-size:0.8rem;font-weight:900;color:#64748B;">${col.label}</div>
              <button type="button" class="pokenav-keypad-btn pm-catch-dial-btn" data-dial="${col.key}" data-delta="1" aria-label="Increase ${col.label}">+</button>
              <div class="pm-catch-tumbler-digit pm-catch-num" data-dial-digit="${col.key}">${s.dials[col.key]}</div>
              <button type="button" class="pokenav-keypad-btn pm-catch-dial-btn" data-dial="${col.key}" data-delta="-1" aria-label="Decrease ${col.label}">−</button>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:10px 14px;border-radius:14px;background:#FFF9F0;border:2px solid #E2D5BE;">
          <span class="pm-catch-num" data-pv-eq style="font-weight:900;font-size:1.05rem;">${placeValueEquationHtml(s)}</span>
          <span style="font-size:0.8rem;font-weight:700;color:#64748B;">Tip: You can also type digits 0–9 + Enter!</span>
        </div>
        <button type="button" class="btn-3d btn-primary" data-action="submit-catch" data-pv-throw style="width:100%;">
          Unlock (${placeValueTotal(s)}) &amp; Throw Poké Ball! 🔐
        </button>
      </div>
    `;
  }

  // Comparison Power Scale (<, =, >)
  const cmp = p.meta?.comparison || {};
  let tiltDeg = 0;
  if (s.scaleChoice && Number.isFinite(Number(cmp.leftVal)) && Number.isFinite(Number(cmp.rightVal))) {
    if (s.scaleChoice === '>') tiltDeg = -8;
    else if (s.scaleChoice === '<') tiltDeg = 8;
  }
  const cmpTile = (val, symbolHtml, label) => {
    const state = s.scaleChoice === val
      ? (s.wildState === 'hopped' ? 'is-graze' : (s.animating || s.caughtComplete) ? 'is-correct' : '')
      : '';
    return `
        <button type="button" class="pokenav-choice-tile pm-catch-cmp-btn ${state}" data-cmp-val="${escapeHtml(val)}">
          <span>${symbolHtml}</span>
          <span style="font-size:0.74rem;color:#64748B;">${label}</span>
        </button>`;
  };

  return `
    <div class="pm-catch-scale-stage">
      <svg viewBox="0 0 420 155" width="100%" style="max-width:420px;height:auto;" aria-label="Power comparison balance scale">
        <polygon points="196,144 224,144 210,110" fill="#64748B" stroke="#1E293B" stroke-width="2.5"/>
        <rect x="172" y="142" width="76" height="9" rx="4" fill="#334155"/>
        <g transform="rotate(${tiltDeg} 210 58)">
          <line x1="72" y1="58" x2="348" y2="58" stroke="#1E293B" stroke-width="6" stroke-linecap="round"/>
          <circle cx="210" cy="58" r="18" fill="#FFCB05" stroke="#1E293B" stroke-width="3"/>
          <text x="210" y="65" text-anchor="middle" font-size="20" font-weight="900" fill="#1E293B">${escapeHtml(s.scaleChoice || '?')}</text>
          <rect x="24" y="72" width="118" height="44" rx="12" fill="#FFFFFF" stroke="#3B4CCA" stroke-width="3"/>
          <text x="83" y="100" text-anchor="middle" font-size="16" font-weight="900" fill="#0F172A" style="font-variant-numeric:tabular-nums;">${escapeHtml(p.leftExpr || '')}</text>
          <rect x="278" y="72" width="118" height="44" rx="12" fill="#FFFFFF" stroke="#E3350D" stroke-width="3"/>
          <text x="337" y="100" text-anchor="middle" font-size="16" font-weight="900" fill="#0F172A" style="font-variant-numeric:tabular-nums;">${escapeHtml(p.rightExpr || '')}</text>
        </g>
      </svg>
      <div class="pokenav-choice-grid pm-catch-cmp-buttons">
        ${cmpTile('<', '&lt;', 'Less Than')}
        ${cmpTile('=', '=', 'Equal To')}
        ${cmpTile('>', '&gt;', 'Greater Than')}
      </div>
    </div>
  `;
}

function nlDisplayAim(s) {
  return s.typedBuffer ? s.typedBuffer : String(s.aimValue);
}

function placeColumns(problem) {
  const cols = [
    { key: 'h', label: 'Hundreds (100s)' },
    { key: 't', label: 'Tens (10s)' },
    { key: 'o', label: 'Ones (1s)' },
  ];
  return hideHundredsTumbler(problem) ? cols.slice(1) : cols;
}

function placeValueEquationHtml(s) {
  const total = placeValueTotal(s);
  const parts = hideHundredsTumbler(s.problem)
    ? `${s.dials.t * 10} + ${s.dials.o}`
    : `${s.dials.h * 100} + ${s.dials.t * 10} + ${s.dials.o}`;
  return `${parts} = <strong style="color:#E3350D;font-size:1.2rem;">${total}</strong>`;
}

function renderArenaMarkup() {
  const s = stateSession;
  const wild = s.wildPokemon;
  const wildType = wild?.types?.[0] || 'normal';
  const selectedBall = getBallDef(s.selectedBallId, s.profile);
  const wildTargetCls = s.wildState === 'absorbed' ? 'is-absorbed' : s.wildState === 'hopped' ? 'is-hopped' : '';

  return `
      <div class="pm-catch-arena" aria-live="polite">
        <div class="pm-catch-bg"></div>
        <div class="pm-catch-stage-row">
          <div class="pm-catch-encounter-card">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <strong style="font-size:1.02rem;">${escapeHtml(wild.name)}</strong>
              <span style="padding:2px 8px;border-radius:999px;background:${getTypeColor(wildType)};color:#fff;font-size:0.7rem;font-weight:800;text-transform:uppercase;">
                ${escapeHtml(wildType)}
              </span>
            </div>
            <div class="pm-catch-num" data-encounter-meta style="font-size:0.8rem;font-weight:700;color:#475569;margin-top:4px;">${escapeHtml(encounterMetaText())}</div>
          </div>

          <div class="pm-catch-encounter-visual-box">
            <div class="pm-catch-wild-target ${wildTargetCls}" data-slot="wild"></div>
            <div class="pm-catch-region" data-ball-host>${s.ballPhase ? `
              <div class="pm-catch-capture-ball-overlay">
                <div class="pm-catch-thrown-ball ${ballPhaseClass(s.ballPhase)}" data-phase="${escapeHtml(s.ballPhase)}">${selectedBall.svgMarkup}</div>
              </div>` : ''}</div>
          </div>
        </div>
      </div>
  `;
}

function renderControlsMarkup() {
  const s = stateSession;
  const wild = s.wildPokemon;

  if (s.caughtComplete) {
    return `
        <div class="pm-catch-caught-summary">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span class="pm-catch-pill is-weakened">${escapeHtml(s.catchResult?.gradeLabel || 'Caught!')}</span>
            ${s.catchResult?.wasNewSpecies ? '<span class="pm-catch-pill is-shiny">📖 New Pokédex Entry!</span>' : ''}
            ${s.isShiny ? '<span class="pm-catch-pill is-shiny">✨ Shiny Logged!</span>' : ''}
          </div>
          <h3 style="margin:0;font-size:1.18rem;font-weight:900;">${escapeHtml(wild.name)} was added to your Pokédex Vault!</h3>
          <div class="pm-catch-num" style="font-weight:800;color:#166534;">
            +${s.catchResult?.stardustGain || 8} Stardust • +${s.catchResult?.xpGain || 18} Buddy XP • +${s.catchResult?.coinGain || 6} Coins
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button type="button" class="btn-3d btn-success" data-action="catch-another">
              Catch Another Pokémon →
            </button>
            <button type="button" class="btn-3d btn-gold" data-action="go-pokedex">
              View in Pokédex 📖
            </button>
            <button type="button" class="btn-3d" data-action="back-battle">
              Back to Battle
            </button>
          </div>
        </div>
    `;
  }

  const balls = getAvailableBalls(s.profile);
  return `
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="font-size:0.84rem;font-weight:800;color:#475569;">Select Your Poké Ball</div>
          <div class="pm-catch-ball-tray">
            ${balls.map((ball) => {
              const isSelected = ball.id === s.selectedBallId;
              const disabled = !ball.isPractice && ball.owned <= 0;
              return `
                <button type="button" class="pokenav-tactile pm-catch-ball-btn ${isSelected ? 'is-selected' : ''}" data-ball-id="${escapeHtml(ball.id)}" ${disabled ? 'disabled' : ''}>
                  <span class="pm-catch-ball-icon">${ball.svgMarkup}</span>
                  <span>
                    <div style="font-weight:900;font-size:0.86rem;">${escapeHtml(ball.name)}</div>
                    <div class="pm-catch-num" style="font-size:0.75rem;font-weight:800;color:#64748B;">
                      ${ball.isPractice ? 'Free ∞' : `×${ball.owned}`} • ${ball.catchMultiplier}×
                    </div>
                  </span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <div class="pm-catch-challenge-tabs" role="tablist" aria-label="Catch Challenge Modes">
          <button type="button" class="pokenav-tactile pm-catch-tab-btn ${s.challengeType === 'numberLine' ? 'is-active' : ''}" data-tab="numberLine">
            🎯 Number Line Throw
          </button>
          <button type="button" class="pokenav-tactile pm-catch-tab-btn ${s.challengeType === 'placeValue' ? 'is-active' : ''}" data-tab="placeValue">
            🔐 Place-Value Poké-Lock
          </button>
          <button type="button" class="pokenav-tactile pm-catch-tab-btn ${s.challengeType === 'comparison' ? 'is-active' : ''}" data-tab="comparison">
            ⚖️ Power Scale (&lt; = &gt;)
          </button>
        </div>

        <div class="pm-catch-console-card">
          <div class="pm-catch-console-top">
            <span class="pm-catch-pill">${escapeHtml(formatSkillLabel(s.problem, s.challengeType))}</span>
            <button type="button" class="btn-3d btn-sm" data-action="speak">
              🔊 Read Aloud
            </button>
          </div>
          <p class="pm-catch-prompt-text">${escapeHtml(s.problem.promptText)}</p>
          <div class="pm-catch-region" data-catch-region="challenge">${renderChallengeMarkup()}</div>
        </div>
  `;
}

function setRegion(name, html) {
  const el = container?.querySelector(`[data-catch-region="${name}"]`);
  if (el) el.innerHTML = html;
}

/** Re-renders only the challenge widget (never the arena, sprite or backdrop). */
function refreshChallenge() {
  if (!stateSession || stateSession.caughtComplete) return;
  setRegion('challenge', renderChallengeMarkup());
}

/**
 * Full render rebuilds the shell (reloading the sprite and backdrop). Pass keepArena to
 * refresh the header/controls regions and patch the arena in place instead.
 */
function render({ keepArena = false } = {}) {
  if (!mounted || !container || !stateSession) return;
  const s = stateSession;
  const route = s.route;
  const wild = s.wildPokemon;

  const existingRoot = container.querySelector('.pm-catch-root');
  if (keepArena && existingRoot && existingRoot.querySelector('.pm-catch-arena')) {
    setRegion('controls', renderControlsMarkup());
    patchStatus();
    patchArena();
    return;
  }

  container.innerHTML = `
    <div class="pm-catch-root">
      <div class="pm-catch-header" data-catch-region="header">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="pm-catch-pill">Safari Catch • Route ${route.number}</span>
            ${s.isWeakened ? '<span class="pm-catch-pill is-weakened">Weakened! +Catch Boost</span>' : ''}
            ${s.isShiny ? '<span class="pm-catch-pill is-shiny">✨ SHINY ENCOUNTER</span>' : ''}
          </div>
          <h2 style="margin:4px 0 0;font-size:1.08rem;font-weight:900;">${escapeHtml(route.name)} Safari Zone</h2>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn-3d btn-sm" data-action="back-battle">
            ← Wild Battle
          </button>
          <button type="button" class="btn-3d btn-sm" data-action="next-wild">
            🔄 New Encounter
          </button>
        </div>
      </div>

      ${renderArenaMarkup()}

      <div class="${statusClassName(s.statusVariant)}" data-catch-region="status" aria-live="polite">${statusInnerHtml(s)}</div>

      <div class="pm-catch-region" data-catch-region="controls">${renderControlsMarkup()}</div>
    </div>
  `;

  const bgEl = container.querySelector('.pm-catch-bg');
  if (bgEl) {
    ctx.vfx?.mountBiomeBackdrop?.(bgEl, route.biomeKey);
  }
  const wildSlot = container.querySelector('[data-slot="wild"]');
  renderPokemonVisualSlot(wildSlot, wild, {
    shiny: s.isShiny,
    size: 132,
    animate: true,
  });
}

/** Keeps the Number Line widget in sync without recreating the range input. */
function syncNumberLine() {
  const s = stateSession;
  const wrap = container?.querySelector('.pm-catch-nl-wrap');
  if (!wrap || !s?.nlConfig) return;
  const cfg = s.nlConfig;
  const aim = nlDisplayAim(s);

  const chip = wrap.querySelector('[data-nl-aim]');
  if (chip) chip.textContent = `Aim: ${aim}`;
  const throwBtn = wrap.querySelector('[data-nl-throw]');
  if (throwBtn) throwBtn.textContent = `Throw Poké Ball at ${aim}! 🎯`;
  const svg = wrap.querySelector('.pm-catch-nl-svg');
  if (svg) svg.outerHTML = renderNumberLineSvgMarkup();
  const slider = wrap.querySelector('.pm-catch-nl-slider');
  const clampedAim = Math.max(cfg.min, Math.min(cfg.max, Number(s.aimValue) || cfg.min));
  if (slider && Number(slider.value) !== clampedAim) slider.value = String(clampedAim);
}

/** Keeps the Place-Value Poké-Lock tumblers in sync in place. */
function syncPlaceValue() {
  const s = stateSession;
  if (!container || !s) return;
  container.querySelectorAll('[data-dial-digit]').forEach((el) => {
    const key = el.getAttribute('data-dial-digit');
    el.textContent = String(s.dials[key] ?? 0);
  });
  const eq = container.querySelector('[data-pv-eq]');
  if (eq) eq.innerHTML = placeValueEquationHtml(s);
  const throwBtn = container.querySelector('[data-pv-throw]');
  if (throwBtn) throwBtn.textContent = `Unlock (${placeValueTotal(s)}) & Throw Poké Ball! 🔐`;
}

function updateNumberLineVisual(nextVal) {
  if (!stateSession || !stateSession.nlConfig) return;
  const cfg = stateSession.nlConfig;
  const clamped = Math.max(cfg.min, Math.min(cfg.max, Math.round(nextVal)));
  const snapped = cfg.snapStep > 1
    ? Math.max(cfg.min, Math.min(cfg.max, cfg.min + Math.round((clamped - cfg.min) / cfg.snapStep) * cfg.snapStep))
    : clamped;
  stateSession.aimValue = snapped;
  stateSession.typedBuffer = '';
  syncNumberLine();
}

function nudgeAim(direction) {
  const s = stateSession;
  if (!s?.nlConfig) return;
  const base = s.typedBuffer ? Number(s.typedBuffer) : s.aimValue;
  updateNumberLineVisual(base + direction * s.nlConfig.snapStep);
}

function submitCurrentChallenge() {
  const s = stateSession;
  if (!s) return;
  if (s.challengeType === 'numberLine') {
    const val = s.typedBuffer ? Number(s.typedBuffer) : s.aimValue;
    attemptCatchSubmission(val);
  } else if (s.challengeType === 'placeValue') {
    attemptCatchSubmission(placeValueTotal(s));
  }
}

function startNextEncounter() {
  const nextIdx = ((stateSession?.challengeIdx || 0) + 1) % CHALLENGE_ORDER.length;
  initCatchEncounter(nextIdx, false);
  syncRotomToProblem(stateSession.problem);
  render();
  onNewProblem(stateSession.problem);
}

function onContainerClick(e) {
  if (!container || !stateSession) return;
  const target = e.target?.closest?.('[data-ball-id], [data-tab], [data-action], [data-nl-nudge], [data-dial], [data-cmp-val]');
  if (!target || !container.contains(target)) return;

  const ballId = target.getAttribute('data-ball-id');
  if (ballId) {
    if (stateSession.animating || stateSession.caughtComplete) return;
    const ball = getBallDef(ballId, stateSession.profile);
    if (!ball.isPractice && ball.owned <= 0) return;
    ctx.audio?.unlockAudio?.();
    ctx.audio?.playClick?.('select');
    stateSession.selectedBallId = ball.id;
    render({ keepArena: true });
    return;
  }

  const tab = target.getAttribute('data-tab');
  if (tab) {
    switchChallengeTab(tab);
    return;
  }

  const nudge = target.getAttribute('data-nl-nudge');
  if (nudge !== null) {
    if (stateSession.animating) return;
    ctx.audio?.playClick?.('tap');
    nudgeAim(Math.sign(Number(nudge)) || 0);
    return;
  }

  const dialKey = target.getAttribute('data-dial');
  if (dialKey) {
    if (stateSession.animating) return;
    ctx.audio?.unlockAudio?.();
    ctx.audio?.playClick?.('tap');
    const delta = Number(target.getAttribute('data-delta')) || 0;
    stateSession.typedBuffer = '';
    stateSession.dials[dialKey] = (stateSession.dials[dialKey] + delta + 10) % 10;
    syncPlaceValue();
    return;
  }

  const cmpVal = target.getAttribute('data-cmp-val');
  if (cmpVal) {
    attemptCatchSubmission(cmpVal);
    return;
  }

  switch (target.getAttribute('data-action')) {
    case 'speak': {
      const p = stateSession.problem;
      if (p) ctx.audio?.speakText?.(p.spokenPrompt || p.promptText, true);
      break;
    }
    case 'submit-catch':
      submitCurrentChallenge();
      break;
    case 'catch-another':
      ctx.audio?.playClick?.('select');
      startNextEncounter();
      break;
    case 'next-wild':
      ctx.audio?.playClick?.('tap');
      startNextEncounter();
      break;
    case 'back-battle':
      ctx.audio?.playClick?.('tap');
      ctx.onNavigate?.('battle', { mode: 'battle', routeId: stateSession?.route?.id });
      break;
    case 'go-pokedex':
      ctx.audio?.playClick?.('select');
      ctx.onNavigate?.('camp', { tab: 'pokedex' });
      break;
    default:
      break;
  }
}

function onContainerInput(e) {
  const slider = e.target;
  if (!slider?.classList?.contains('pm-catch-nl-slider')) return;
  if (!stateSession || stateSession.animating) return;
  stateSession.aimValue = Number(slider.value);
  stateSession.typedBuffer = '';
  syncNumberLine();
}

function onContainerPointerDown(e) {
  const svg = e.target?.closest?.('.pm-catch-nl-svg');
  if (!svg || !container?.contains(svg) || !stateSession?.nlConfig || stateSession.animating) return;
  if (e.button !== undefined && e.button !== 0) return;
  ctx.audio?.unlockAudio?.();
  ctx.audio?.playClick?.('tap');

  const rect = svg.getBoundingClientRect();
  if (!rect || rect.width <= 0) return;
  const padRatio = 36 / 600;
  const leftPx = rect.left + rect.width * padRatio;
  const trackPx = rect.width * (1 - padRatio * 2);
  const ratio = Math.max(0, Math.min(1, (e.clientX - leftPx) / Math.max(1, trackPx)));
  const cfg = stateSession.nlConfig;
  updateNumberLineVisual(cfg.min + ratio * (cfg.max - cfg.min));
}

function applyTypedPlaceValueDigits(buf) {
  const hidden = hideHundredsTumbler(stateSession.problem);
  const clean = buf.slice(hidden ? -2 : -3).padStart(3, '0');
  stateSession.dials.h = hidden ? 0 : Number(clean[0]) || 0;
  stateSession.dials.t = Number(clean[1]) || 0;
  stateSession.dials.o = Number(clean[2]) || 0;
}

export function mount(containerEl, context) {
  unmount();
  if (!containerEl || !context) return;

  mounted = true;
  sessionToken += 1;
  container = containerEl;
  ctx = context;

  injectCatchStyles();
  trackListener(container, 'click', onContainerClick);
  trackListener(container, 'input', onContainerInput);
  trackListener(container, 'pointerdown', onContainerPointerDown);

  initCatchEncounter(0, true);
  syncRotomToProblem(stateSession.problem);
  render();
  onNewProblem(stateSession.problem);
}

export function unmount() {
  mounted = false;
  sessionToken += 1;
  clearAllTimersAndListeners();
  if (container) {
    container.innerHTML = '';
  }
  removeCatchStyles();
  container = null;
  ctx = null;
  stateSession = null;
}

export function handleKey(event) {
  if (!mounted || !stateSession || !event) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  if (stateSession.animating || stateSession.caughtComplete) return false;

  const targetTag = event.target?.tagName;
  if (targetTag === 'TEXTAREA' || targetTag === 'SELECT') return false;
  const isRangeTarget = targetTag === 'INPUT' && event.target?.type === 'range';
  if (targetTag === 'INPUT' && !isRangeTarget) return false;

  const key = event.key;

  if (stateSession.challengeType === 'comparison') {
    if (key === '<' || key === '=' || key === '>') {
      attemptCatchSubmission(key);
      return true;
    }
    return false;
  }

  if (stateSession.challengeType === 'numberLine') {
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      // A focused slider already steps natively (and fires 'input'); don't double-nudge.
      if (isRangeTarget) return false;
      event.preventDefault?.();
      ctx?.audio?.playClick?.('tap');
      nudgeAim(key === 'ArrowRight' ? 1 : -1);
      return true;
    }
    if (key >= '0' && key <= '9' && key.length === 1) {
      ctx?.audio?.unlockAudio?.();
      ctx?.audio?.playClick?.('tap');
      stateSession.typedBuffer = (stateSession.typedBuffer + key).slice(0, 4);
      const parsed = Number(stateSession.typedBuffer);
      if (Number.isFinite(parsed) && stateSession.nlConfig) {
        const cfg = stateSession.nlConfig;
        stateSession.aimValue = Math.max(cfg.min, Math.min(cfg.max, parsed));
      }
      syncNumberLine();
      return true;
    }
    if (key === 'Backspace') {
      ctx?.audio?.playClick?.('tap');
      stateSession.typedBuffer = stateSession.typedBuffer.slice(0, -1);
      if (stateSession.typedBuffer && stateSession.nlConfig) {
        const cfg = stateSession.nlConfig;
        stateSession.aimValue = Math.max(cfg.min, Math.min(cfg.max, Number(stateSession.typedBuffer)));
      }
      syncNumberLine();
      return true;
    }
    if (key === 'Enter') {
      const val = stateSession.typedBuffer ? Number(stateSession.typedBuffer) : stateSession.aimValue;
      attemptCatchSubmission(val);
      return true;
    }
    return false;
  }

  if (stateSession.challengeType === 'placeValue') {
    if (key >= '0' && key <= '9' && key.length === 1) {
      ctx?.audio?.unlockAudio?.();
      ctx?.audio?.playClick?.('tap');
      const keep = hideHundredsTumbler(stateSession.problem) ? -2 : -3;
      stateSession.typedBuffer = (stateSession.typedBuffer + key).slice(keep);
      applyTypedPlaceValueDigits(stateSession.typedBuffer);
      syncPlaceValue();
      return true;
    }
    if (key === 'Backspace') {
      ctx?.audio?.playClick?.('tap');
      stateSession.typedBuffer = stateSession.typedBuffer.slice(0, -1);
      applyTypedPlaceValueDigits(stateSession.typedBuffer || '0');
      syncPlaceValue();
      return true;
    }
    if (key === 'Enter') {
      attemptCatchSubmission(placeValueTotal(stateSession));
      return true;
    }
    return false;
  }

  return false;
}
