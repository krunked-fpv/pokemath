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
    .pm-catch-root .pm-num {
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
    .pm-encounter-card {
      background: rgba(255, 255, 255, 0.93);
      border: 2px solid #E2D5BE;
      border-radius: 16px;
      padding: 10px 14px;
      min-width: 210px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
    }
    .pm-encounter-visual-box {
      position: relative;
      z-index: 2;
      min-height: 145px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
    }
    .pm-wild-target {
      transition: transform 280ms ease, opacity 260ms ease;
    }
    .pm-wild-target.is-absorbed {
      transform: scale(0.15) translateY(-14px);
      opacity: 0;
    }
    .pm-wild-target.is-hopped {
      animation: pm-catch-hop 360ms ease;
    }
    .pm-capture-ball-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 5;
    }
    .pm-thrown-ball {
      width: 64px;
      height: 64px;
      transform-origin: 50% 80%;
    }
    .pm-thrown-ball.is-launching {
      animation: pm-ball-launch 520ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    .pm-thrown-ball.is-wobble-0,
    .pm-thrown-ball.is-wobble-1,
    .pm-thrown-ball.is-wobble-2 {
      animation: pm-ball-wobble 420ms ease-in-out;
    }
    .pm-thrown-ball.is-caught {
      filter: drop-shadow(0 0 14px rgba(250, 204, 21, 0.9));
      transform: scale(1.08);
    }
    .pm-ball-tray {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 8px;
    }
    .pm-ball-btn {
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
    .pm-ball-btn.is-selected {
      border-color: #E3350D;
      background: #FFF1F2;
      box-shadow: 0 4px 12px rgba(227, 53, 13, 0.14);
    }
    .pm-ball-btn:disabled {
      opacity: 0.48;
      cursor: not-allowed;
    }
    .pm-ball-icon {
      width: 34px;
      height: 34px;
      flex-shrink: 0;
    }
    .pm-ball-icon svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .pm-challenge-tabs {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .pm-tab-btn {
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
    .pm-tab-btn.is-active {
      background: #EEF2FF;
      border-color: #3B4CCA;
      color: #1E1B4B;
    }
    .pm-console-card {
      background: var(--bg-card, #FFFFFF);
      border: 2.5px solid var(--border-warm, #DFD3BC);
      border-radius: 20px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: 0 8px 22px rgba(30, 41, 59, 0.08);
    }
    .pm-console-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pm-prompt-text {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 900;
      color: #0F172A;
      line-height: 1.35;
    }
    .pm-nl-wrap {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      border-radius: 16px;
      background: #F8FAFC;
      border: 2px solid #E2E8F0;
    }
    .pm-nl-svg {
      width: 100%;
      height: auto;
      display: block;
      cursor: pointer;
      touch-action: none;
      user-select: none;
    }
    .pm-nl-controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .pm-nl-slider {
      flex: 1;
      min-width: 180px;
      height: 36px;
      accent-color: #E3350D;
      cursor: pointer;
    }
    .pm-tumblers-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .pm-tumbler-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px 10px;
      border-radius: 18px;
      background: #FFF9F0;
      border: 2px solid #E2D5BE;
    }
    .pm-tumbler-digit {
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
    .pm-dial-btn {
      width: 100%;
      min-height: 52px;
      border-radius: 12px;
      border: 2px solid #CBD5E1;
      border-bottom-width: 4px;
      background: #FFFFFF;
      font-family: inherit;
      font-size: 1.3rem;
      font-weight: 900;
      color: #1E293B;
      cursor: pointer;
    }
    .pm-dial-btn:active {
      transform: translateY(2px);
      border-bottom-width: 2px;
    }
    .pm-scale-stage {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 16px;
      background: #F8FAFC;
      border: 2px solid #E2E8F0;
    }
    .pm-cmp-buttons {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      width: 100%;
    }
    .pm-cmp-btn {
      min-height: 62px;
      border-radius: 16px;
      border: 2.5px solid #CBD5E1;
      border-bottom-width: 6px;
      background: #FFFFFF;
      font-family: inherit;
      font-size: 1.45rem;
      font-weight: 900;
      color: #0F172A;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
    }
    .pm-cmp-btn:hover {
      border-color: #3B4CCA;
      background: #EEF2FF;
    }
    .pm-cmp-btn:active {
      transform: translateY(2px);
      border-bottom-width: 2px;
    }
    .pm-btn-3d {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 52px;
      padding: 10px 18px;
      border-radius: 15px;
      border: 2px solid #1E293B;
      border-bottom-width: 5px;
      font-family: inherit;
      font-weight: 900;
      font-size: 0.96rem;
      cursor: pointer;
      background: #FFFFFF;
      color: #1E293B;
    }
    .pm-btn-3d:active {
      transform: translateY(2px);
      border-bottom-width: 2px;
    }
    .pm-btn-throw {
      background: linear-gradient(180deg, #EF4444, #E3350D);
      border-color: #991B1B;
      color: #FFFFFF;
    }
    .pm-btn-emerald {
      background: linear-gradient(180deg, #22C55E, #16A34A);
      border-color: #14532D;
      color: #FFFFFF;
    }
    .pm-btn-gold {
      background: linear-gradient(180deg, #FDE047, #F59E0B);
      border-color: #92400E;
      color: #451A03;
    }
    .pm-feedback-banner {
      padding: 10px 14px;
      border-radius: 14px;
      font-weight: 800;
      font-size: 0.92rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pm-feedback-banner.is-success {
      background: #DCFCE7;
      border: 2px solid #22C55E;
      color: #166534;
    }
    .pm-feedback-banner.is-nudge {
      background: #FEF3C7;
      border: 2px solid #F59E0B;
      color: #92400E;
    }
    .pm-caught-summary {
      padding: 18px;
      border-radius: 20px;
      background: linear-gradient(135deg, #FEF9C3, #ECFDF5);
      border: 3px solid #22C55E;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    @keyframes pm-ball-launch {
      0% { transform: translate3d(-90px, 70px, 0) scale(0.85) rotate(0deg); opacity: 0.7; }
      50% { transform: translate3d(-15px, -52px, 0) scale(1.12) rotate(220deg); opacity: 1; }
      100% { transform: translate3d(0, 0, 0) scale(1) rotate(360deg); opacity: 1; }
    }
    @keyframes pm-ball-wobble {
      0%, 100% { transform: rotate(0deg) translate3d(0, 0, 0); }
      25% { transform: rotate(-18deg) translate3d(-6px, 0, 0); }
      75% { transform: rotate(18deg) translate3d(6px, 0, 0); }
    }
    @keyframes pm-catch-hop {
      0%, 100% { transform: translate3d(0, 0, 0); }
      40% { transform: translate3d(0, -18px, 0); }
    }
    @media (max-width: 720px) {
      .pm-challenge-tabs {
        grid-template-columns: 1fr;
      }
      .pm-tumblers-grid {
        gap: 8px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .pm-thrown-ball,
      .pm-wild-target {
        animation: none !important;
        transition: none !important;
      }
    }
    [data-reduced-motion="true"] .pm-thrown-ball,
    [data-reduced-motion="true"] .pm-wild-target {
      animation: none !important;
      transition: none !important;
    }
  `;
  document.head.appendChild(style);
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
  render();
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

function attemptCatchSubmission(submittedValue) {
  if (!mounted || !stateSession || stateSession.animating || stateSession.caughtComplete) return;
  const problem = stateSession.problem;
  if (!problem) return;

  ctx.audio?.unlockAudio?.();
  const isCorrect = Boolean(ctx.mathEngine?.validateAnswer?.(problem, submittedValue));
  const currentHintTier = Number(ctx.rotomPane?.getCurrentHintTier?.() || 0);
  const hintsUsed = Math.max(stateSession.hintsOpenedAtStart || 0, currentHintTier);

  if (!isCorrect) {
    stateSession.missesThisEncounter += 1;
    let adaptiveRes = null;
    const updatedProfile = ctx.state.updateProfile((draft) => {
      adaptiveRes = ctx.adaptive.recordAttempt(draft, problem.skillTag, false, hintsUsed);
      draft.totalAttempts = (draft.totalAttempts || 0) + 1;
      return draft;
    });
    stateSession.profile = updatedProfile || stateSession.profile;

    if (stateSession.challengeType === 'comparison') {
      stateSession.scaleChoice = String(submittedValue);
    }
    stateSession.wildState = 'hopped';
    stateSession.statusMessage = `Whoa, it hopped loose! Try Rotom-Dex's hint! ${adaptiveRes?.encouragementMessage || ''}`.trim();
    stateSession.statusVariant = 'nudge';

    ctx.audio?.playGentleNudge?.();
    const arenaEl = container?.querySelector('.pm-catch-arena');
    if (arenaEl) {
      ctx.vfx?.spawnFloatingText?.(arenaEl, 'Hopped loose!', 'nudge');
    }
    if (adaptiveRes?.autoOpenHintTier >= 1) {
      ctx.rotomPane?.openHintTier?.(adaptiveRes.autoOpenHintTier);
    }
    ctx.rotomPane?.setMood?.('encouraging', adaptiveRes?.encouragementMessage || 'Check Rotom-Dex for a helpful clue!');
    ctx.rotomPane?.updateMetrics?.({
      streak: 0,
      consecutiveMisses: adaptiveRes?.consecutiveMisses || 1,
      shinyRollBonus: 0,
    });
    ctx.rotomPane?.render?.(stateSession.profile);
    render();

    trackTimeout(() => {
      if (!stateSession) return;
      stateSession.wildState = 'idle';
      stateSession.scaleChoice = null;
      render();
    }, 380);
    return;
  }

  // Correct answer -> Launch full Poké Ball capture sequence!
  if (stateSession.challengeType === 'comparison') {
    stateSession.scaleChoice = String(submittedValue);
  }
  stateSession.animating = true;
  stateSession.ballPhase = 'launch';
  stateSession.wildState = 'absorbed';
  const grade = computeThrowGrade(stateSession.missesThisEncounter, hintsUsed);
  stateSession.statusMessage = `${grade.label} Launching ${getBallDef(stateSession.selectedBallId, stateSession.profile).name}…`;
  stateSession.statusVariant = 'info';

  ctx.audio?.playPokeballThrow?.();
  render();

  trackTimeout(() => {
    if (!stateSession) return;
    stateSession.ballPhase = 'wobble-0';
    stateSession.statusMessage = 'Wobble… 1!';
    ctx.audio?.playPokeballWobble?.(0);
    render();
  }, 550);

  trackTimeout(() => {
    if (!stateSession) return;
    stateSession.ballPhase = 'wobble-1';
    stateSession.statusMessage = 'Wobble… 2!';
    ctx.audio?.playPokeballWobble?.(1);
    render();
  }, 1100);

  trackTimeout(() => {
    if (!stateSession) return;
    stateSession.ballPhase = 'wobble-2';
    stateSession.statusMessage = 'Almost… 3!';
    ctx.audio?.playPokeballWobble?.(2);
    render();
  }, 1650);

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
  ctx.rotomPane?.updateMetrics?.({
    streak: adaptiveRes?.streak || 1,
    consecutiveMisses: 0,
    shinyRollBonus: adaptiveRes?.shinyRollBonus || 0,
    chargePercent: stateSession.profile?.evolutionMeter || 0,
  });
  ctx.rotomPane?.render?.(stateSession.profile);

  render();

  const arenaEl = container?.querySelector('.pm-catch-arena');
  if (arenaEl) {
    ctx.vfx?.burstConfetti?.(arenaEl);
    ctx.vfx?.spawnFloatingText?.(arenaEl, 'Gotcha!', 'crit');
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
    <svg class="pm-nl-svg" viewBox="0 0 ${width} 125" role="img" aria-label="Interactive number line from ${cfg.min} to ${cfg.max}">
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
    const displayAim = s.typedBuffer ? s.typedBuffer : String(s.aimValue);
    return `
      <div class="pm-nl-wrap">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <span style="font-weight:800;font-size:0.86rem;color:#475569;">
            Tap or drag on the Number Line, slide, or type your aim!
          </span>
          <span class="pm-stat-chip pm-num" style="padding:4px 12px;border-radius:999px;background:#0F172A;color:#FFCB05;font-weight:900;">
            Aim: ${escapeHtml(displayAim)}
          </span>
        </div>
        ${renderNumberLineSvgMarkup()}
        <div class="pm-nl-controls">
          <button type="button" class="pm-btn-3d" data-nl-nudge="${-cfg.snapStep}" style="min-height:46px;padding:6px 14px;">-${cfg.snapStep}</button>
          <input type="range" class="pm-nl-slider" min="${cfg.min}" max="${cfg.max}" step="${cfg.snapStep}" value="${Math.max(cfg.min, Math.min(cfg.max, Number(s.aimValue) || cfg.min))}" aria-label="Number line aim slider" />
          <button type="button" class="pm-btn-3d" data-nl-nudge="${cfg.snapStep}" style="min-height:46px;padding:6px 14px;">+${cfg.snapStep}</button>
        </div>
        <button type="button" class="pm-btn-3d pm-btn-throw" data-action="submit-catch" style="width:100%;">
          Throw Poké Ball at ${escapeHtml(displayAim)}! 🎯
        </button>
      </div>
    `;
  }

  if (s.challengeType === 'placeValue') {
    const total = s.dials.h * 100 + s.dials.t * 10 + s.dials.o;
    return `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="pm-tumblers-grid">
          ${[
            { key: 'h', label: 'Hundreds (100s)' },
            { key: 't', label: 'Tens (10s)' },
            { key: 'o', label: 'Ones (1s)' },
          ].map((col) => `
            <div class="pm-tumbler-col">
              <div style="font-size:0.8rem;font-weight:900;color:#64748B;">${col.label}</div>
              <button type="button" class="pm-dial-btn" data-dial="${col.key}" data-delta="1" aria-label="Increase ${col.label}">+</button>
              <div class="pm-tumbler-digit pm-num">${s.dials[col.key]}</div>
              <button type="button" class="pm-dial-btn" data-dial="${col.key}" data-delta="-1" aria-label="Decrease ${col.label}">−</button>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:10px 14px;border-radius:14px;background:#FFF9F0;border:2px solid #E2D5BE;">
          <span class="pm-num" style="font-weight:900;font-size:1.05rem;">
            ${s.dials.h * 100} + ${s.dials.t * 10} + ${s.dials.o} = <strong style="color:#E3350D;font-size:1.2rem;">${total}</strong>
          </span>
          <span style="font-size:0.8rem;font-weight:700;color:#64748B;">Tip: You can also type digits 0–9 + Enter!</span>
        </div>
        <button type="button" class="pm-btn-3d pm-btn-throw" data-action="submit-catch" style="width:100%;">
          Unlock (${total}) & Throw Poké Ball! 🔐
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

  return `
    <div class="pm-scale-stage">
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
      <div class="pm-cmp-buttons">
        <button type="button" class="pm-cmp-btn" data-cmp-val="<">
          <span>&lt;</span>
          <span style="font-size:0.74rem;color:#64748B;">Less Than</span>
        </button>
        <button type="button" class="pm-cmp-btn" data-cmp-val="=">
          <span>=</span>
          <span style="font-size:0.74rem;color:#64748B;">Equal To</span>
        </button>
        <button type="button" class="pm-cmp-btn" data-cmp-val=">">
          <span>&gt;</span>
          <span style="font-size:0.74rem;color:#64748B;">Greater Than</span>
        </button>
      </div>
    </div>
  `;
}

function render() {
  if (!mounted || !container || !stateSession) return;
  const s = stateSession;
  const route = s.route;
  const wild = s.wildPokemon;
  const wildType = wild?.types?.[0] || 'normal';
  const balls = getAvailableBalls(s.profile);
  const selectedBall = getBallDef(s.selectedBallId, s.profile);

  const wildTargetCls = s.wildState === 'absorbed'
    ? 'is-absorbed'
    : s.wildState === 'hopped'
      ? 'is-hopped'
      : '';

  const ballOverlayCls = s.ballPhase === 'launch'
    ? 'is-launching'
    : s.ballPhase === 'wobble-0'
      ? 'is-wobble-0'
      : s.ballPhase === 'wobble-1'
        ? 'is-wobble-1'
        : s.ballPhase === 'wobble-2'
          ? 'is-wobble-2'
          : s.ballPhase === 'caught'
            ? 'is-caught'
            : '';

  container.innerHTML = `
    <div class="pm-catch-root">
      <div class="pm-catch-header">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="pm-catch-pill">Safari Catch • Route ${route.number}</span>
            ${s.isWeakened ? '<span class="pm-catch-pill is-weakened">Weakened! +Catch Boost</span>' : ''}
            ${s.isShiny ? '<span class="pm-catch-pill is-shiny">✨ SHINY ENCOUNTER</span>' : ''}
          </div>
          <h2 style="margin:4px 0 0;font-size:1.08rem;font-weight:900;">${escapeHtml(route.name)} Safari Zone</h2>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="pm-btn-3d" data-action="back-battle" style="min-height:42px;padding:6px 12px;font-size:0.84rem;">
            ← Wild Battle
          </button>
          <button type="button" class="pm-btn-3d" data-action="next-wild" style="min-height:42px;padding:6px 12px;font-size:0.84rem;">
            🔄 New Encounter
          </button>
        </div>
      </div>

      <div class="pm-catch-arena" aria-live="polite">
        <div class="pm-catch-bg"></div>
        <div class="pm-catch-stage-row">
          <div class="pm-encounter-card">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <strong style="font-size:1.02rem;">${escapeHtml(wild.name)}</strong>
              <span style="padding:2px 8px;border-radius:999px;background:${getTypeColor(wildType)};color:#fff;font-size:0.7rem;font-weight:800;text-transform:uppercase;">
                ${escapeHtml(wildType)}
              </span>
            </div>
            <div class="pm-num" style="font-size:0.8rem;font-weight:700;color:#475569;margin-top:4px;">
              Pokédex #${String(wild.dexNumber || 25).padStart(3, '0')} • ${s.profile?.caught?.[wild.id] ? `Caught ×${s.profile.caught[wild.id].count}` : 'New Species!'}
            </div>
          </div>

          <div class="pm-encounter-visual-box">
            <div class="pm-wild-target ${wildTargetCls}" data-slot="wild"></div>
            ${s.ballPhase ? `
              <div class="pm-capture-ball-overlay">
                <div class="pm-thrown-ball ${ballOverlayCls}">${selectedBall.svgMarkup}</div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <div class="pm-feedback-banner ${s.statusVariant === 'nudge' ? 'is-nudge' : s.statusVariant === 'success' ? 'is-success' : ''}"
           style="${s.statusVariant === 'info' ? 'background:#FFFFFF;border:2px solid #E2D5BE;color:#334155;' : ''}">
        <span>${s.statusVariant === 'nudge' ? '💡' : s.statusVariant === 'success' ? '🌟' : '🎯'}</span>
        <span>${escapeHtml(s.statusMessage)}</span>
      </div>

      ${s.caughtComplete ? `
        <div class="pm-caught-summary">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span class="pm-catch-pill is-weakened">${escapeHtml(s.catchResult?.gradeLabel || 'Caught!')}</span>
            ${s.catchResult?.wasNewSpecies ? '<span class="pm-catch-pill is-shiny">📖 New Pokédex Entry!</span>' : ''}
            ${s.isShiny ? '<span class="pm-catch-pill is-shiny">✨ Shiny Logged!</span>' : ''}
          </div>
          <h3 style="margin:0;font-size:1.18rem;font-weight:900;">${escapeHtml(wild.name)} was added to your Pokédex Vault!</h3>
          <div class="pm-num" style="font-weight:800;color:#166534;">
            +${s.catchResult?.stardustGain || 8} Stardust • +${s.catchResult?.xpGain || 18} Buddy XP • +${s.catchResult?.coinGain || 6} Coins
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button type="button" class="pm-btn-3d pm-btn-emerald" data-action="catch-another">
              Catch Another Pokémon →
            </button>
            <button type="button" class="pm-btn-3d pm-btn-gold" data-action="go-pokedex">
              View in Pokédex 📖
            </button>
            <button type="button" class="pm-btn-3d" data-action="back-battle">
              Back to Battle
            </button>
          </div>
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="font-size:0.84rem;font-weight:800;color:#475569;">Select Your Poké Ball</div>
          <div class="pm-ball-tray">
            ${balls.map((ball) => {
              const isSelected = ball.id === s.selectedBallId;
              const disabled = !ball.isPractice && ball.owned <= 0;
              return `
                <button type="button" class="pm-ball-btn ${isSelected ? 'is-selected' : ''}" data-ball-id="${escapeHtml(ball.id)}" ${disabled ? 'disabled' : ''}>
                  <span class="pm-ball-icon">${ball.svgMarkup}</span>
                  <span>
                    <div style="font-weight:900;font-size:0.86rem;">${escapeHtml(ball.name)}</div>
                    <div class="pm-num" style="font-size:0.75rem;font-weight:800;color:#64748B;">
                      ${ball.isPractice ? 'Free ∞' : `×${ball.owned}`} • ${ball.catchMultiplier}×
                    </div>
                  </span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <div class="pm-challenge-tabs" role="tablist" aria-label="Catch Challenge Modes">
          <button type="button" class="pm-tab-btn ${s.challengeType === 'numberLine' ? 'is-active' : ''}" data-tab="numberLine">
            🎯 Number Line Throw
          </button>
          <button type="button" class="pm-tab-btn ${s.challengeType === 'placeValue' ? 'is-active' : ''}" data-tab="placeValue">
            🔐 Place-Value Poké-Lock
          </button>
          <button type="button" class="pm-tab-btn ${s.challengeType === 'comparison' ? 'is-active' : ''}" data-tab="comparison">
            ⚖️ Power Scale (&lt; = &gt;)
          </button>
        </div>

        <div class="pm-console-card">
          <div class="pm-console-top">
            <span class="pm-catch-pill">${escapeHtml(s.problem.skillTag || s.challengeType)}</span>
            <button type="button" class="pm-btn-3d" data-action="speak" style="min-height:42px;padding:6px 12px;font-size:0.84rem;">
              🔊 Read Aloud
            </button>
          </div>
          <p class="pm-prompt-text">${escapeHtml(s.problem.promptText)}</p>
          ${renderChallengeMarkup()}
        </div>
      `}
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

  bindEvents();
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
  render();
}

function bindEvents() {
  if (!container || !stateSession) return;

  container.querySelectorAll('[data-ball-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!stateSession || stateSession.animating || stateSession.caughtComplete) return;
      const ballId = btn.getAttribute('data-ball-id');
      const ball = getBallDef(ballId, stateSession.profile);
      if (!ball.isPractice && ball.owned <= 0) return;
      ctx.audio?.unlockAudio?.();
      ctx.audio?.playClick?.('select');
      stateSession.selectedBallId = ball.id;
      render();
    });
  });

  container.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) switchChallengeTab(tab);
    });
  });

  container.querySelector('[data-action="speak"]')?.addEventListener('click', () => {
    const p = stateSession?.problem;
    if (p) ctx.audio?.speakText?.(p.spokenPrompt || p.promptText, true);
  });

  container.querySelector('[data-action="submit-catch"]')?.addEventListener('click', () => {
    if (!stateSession) return;
    if (stateSession.challengeType === 'numberLine') {
      const val = stateSession.typedBuffer ? Number(stateSession.typedBuffer) : stateSession.aimValue;
      attemptCatchSubmission(val);
    } else if (stateSession.challengeType === 'placeValue') {
      const val = stateSession.dials.h * 100 + stateSession.dials.t * 10 + stateSession.dials.o;
      attemptCatchSubmission(val);
    }
  });

  container.querySelectorAll('[data-nl-nudge]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!stateSession || stateSession.animating) return;
      ctx.audio?.playClick?.('tap');
      const delta = Number(btn.getAttribute('data-nl-nudge')) || 0;
      const base = stateSession.typedBuffer ? Number(stateSession.typedBuffer) : stateSession.aimValue;
      updateNumberLineVisual(base + delta);
    });
  });

  const slider = container.querySelector('.pm-nl-slider');
  if (slider) {
    slider.addEventListener('input', (e) => {
      if (!stateSession || stateSession.animating) return;
      stateSession.aimValue = Number(e.target.value);
      stateSession.typedBuffer = '';
      // Lightweight DOM sync without recreating the range input while dragging
      const chip = container?.querySelector('.pm-nl-wrap .pm-stat-chip');
      if (chip) chip.textContent = `Aim: ${stateSession.aimValue}`;
      const throwBtn = container?.querySelector('[data-action="submit-catch"]');
      if (throwBtn) throwBtn.textContent = `Throw Poké Ball at ${stateSession.aimValue}! 🎯`;
      const svgHost = container?.querySelector('.pm-nl-svg');
      if (svgHost) {
        svgHost.outerHTML = renderNumberLineSvgMarkup();
        bindSvgNumberLinePointer();
      }
    });
  }

  bindSvgNumberLinePointer();

  container.querySelectorAll('[data-dial]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!stateSession || stateSession.animating) return;
      ctx.audio?.unlockAudio?.();
      ctx.audio?.playClick?.('tap');
      const key = btn.getAttribute('data-dial');
      const delta = Number(btn.getAttribute('data-delta')) || 0;
      stateSession.typedBuffer = '';
      stateSession.dials[key] = (stateSession.dials[key] + delta + 10) % 10;
      render();
    });
  });

  container.querySelectorAll('[data-cmp-val]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-cmp-val');
      if (val) attemptCatchSubmission(val);
    });
  });

  container.querySelector('[data-action="catch-another"]')?.addEventListener('click', () => {
    ctx.audio?.playClick?.('select');
    const nextIdx = ((stateSession?.challengeIdx || 0) + 1) % CHALLENGE_ORDER.length;
    initCatchEncounter(nextIdx, false);
    syncRotomToProblem(stateSession.problem);
    render();
  });

  container.querySelector('[data-action="next-wild"]')?.addEventListener('click', () => {
    ctx.audio?.playClick?.('tap');
    const nextIdx = ((stateSession?.challengeIdx || 0) + 1) % CHALLENGE_ORDER.length;
    initCatchEncounter(nextIdx, false);
    syncRotomToProblem(stateSession.problem);
    render();
  });

  container.querySelector('[data-action="back-battle"]')?.addEventListener('click', () => {
    ctx.audio?.playClick?.('tap');
    ctx.onNavigate?.('battle', { mode: 'battle', routeId: stateSession?.route?.id });
  });

  container.querySelector('[data-action="go-pokedex"]')?.addEventListener('click', () => {
    ctx.audio?.playClick?.('select');
    ctx.onNavigate?.('camp', { tab: 'pokedex' });
  });
}

function bindSvgNumberLinePointer() {
  const svg = container?.querySelector('.pm-nl-svg');
  if (!svg || !stateSession?.nlConfig) return;

  const applyClientX = (clientX) => {
    if (!stateSession || !stateSession.nlConfig || stateSession.animating) return;
    const rect = svg.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    const padRatio = 36 / 600;
    const leftPx = rect.left + rect.width * padRatio;
    const trackPx = rect.width * (1 - padRatio * 2);
    const ratio = Math.max(0, Math.min(1, (clientX - leftPx) / Math.max(1, trackPx)));
    const cfg = stateSession.nlConfig;
    const rawVal = cfg.min + ratio * (cfg.max - cfg.min);
    updateNumberLineVisual(rawVal);
  };

  svg.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    ctx.audio?.unlockAudio?.();
    ctx.audio?.playClick?.('tap');
    applyClientX(e.clientX);
  });
}

function applyTypedPlaceValueDigits(buf) {
  const clean = buf.slice(-3).padStart(3, '0');
  stateSession.dials.h = Number(clean[0]) || 0;
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
  initCatchEncounter(0, true);
  syncRotomToProblem(stateSession.problem);
  render();

  if (typeof window !== 'undefined') {
    trackListener(window, 'blur', () => {
      // Defensive hook registered via trackListener to guarantee zero stray listeners
    });
  }
}

export function unmount() {
  mounted = false;
  sessionToken += 1;
  clearAllTimersAndListeners();
  if (container) {
    container.innerHTML = '';
  }
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
  if (targetTag === 'INPUT' && event.target?.type !== 'range') return false;

  const key = event.key;

  if (stateSession.challengeType === 'comparison') {
    if (key === '<' || key === '=' || key === '>') {
      attemptCatchSubmission(key);
      return true;
    }
    return false;
  }

  if (stateSession.challengeType === 'numberLine') {
    if (key >= '0' && key <= '9') {
      ctx?.audio?.unlockAudio?.();
      ctx?.audio?.playClick?.('tap');
      stateSession.typedBuffer = (stateSession.typedBuffer + key).slice(0, 4);
      const parsed = Number(stateSession.typedBuffer);
      if (Number.isFinite(parsed) && stateSession.nlConfig) {
        const cfg = stateSession.nlConfig;
        stateSession.aimValue = Math.max(cfg.min, Math.min(cfg.max, parsed));
      }
      render();
      return true;
    }
    if (key === 'Backspace') {
      ctx?.audio?.playClick?.('tap');
      stateSession.typedBuffer = stateSession.typedBuffer.slice(0, -1);
      if (stateSession.typedBuffer && stateSession.nlConfig) {
        const cfg = stateSession.nlConfig;
        stateSession.aimValue = Math.max(cfg.min, Math.min(cfg.max, Number(stateSession.typedBuffer)));
      }
      render();
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
    if (key >= '0' && key <= '9') {
      ctx?.audio?.unlockAudio?.();
      ctx?.audio?.playClick?.('tap');
      stateSession.typedBuffer = (stateSession.typedBuffer + key).slice(-3);
      applyTypedPlaceValueDigits(stateSession.typedBuffer);
      render();
      return true;
    }
    if (key === 'Backspace') {
      ctx?.audio?.playClick?.('tap');
      stateSession.typedBuffer = stateSession.typedBuffer.slice(0, -1);
      applyTypedPlaceValueDigits(stateSession.typedBuffer || '0');
      render();
      return true;
    }
    if (key === 'Enter') {
      const val = stateSession.dials.h * 100 + stateSession.dials.t * 10 + stateSession.dials.o;
      attemptCatchSubmission(val);
      return true;
    }
    return false;
  }

  return false;
}
