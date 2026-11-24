/**
 * PokéMath Mode 1 (Wild Encounter Battle) & Mode 5 (Gym Leader Boss Gauntlet)
 * Exports uniform controller interface: { mount, unmount, handleKey }
 */

const STYLE_ELEMENT_ID = 'pm-battle-mode-styles';

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

const MOVE_META = {
  quick: { label: 'Quick Move', tag: 'Warm-Up', dmgRatio: 0.30, xp: 12, meter: 10, coins: 3, stardust: 1, keyHint: '1' },
  power: { label: 'Power Move', tag: 'Target', dmgRatio: 0.45, xp: 20, meter: 16, coins: 5, stardust: 2, keyHint: '2' },
  charge: { label: 'Charge Move', tag: 'Stretch', dmgRatio: 0.68, xp: 32, meter: 25, coins: 10, stardust: 4, keyHint: '3' },
};

const GYM_PHASES = [
  {
    key: 'shield',
    label: 'Phase 1: Shield Break',
    subtitle: 'Land a 2-hit accuracy combo to crack the Gym Barrier!',
    stepsRequired: 2,
    xpPerHit: 18,
    meterPerHit: 14,
    coinsPerHit: 5,
    stardustPerHit: 2,
  },
  {
    key: 'switch',
    label: 'Phase 2: Tactical Switch',
    subtitle: 'Outsmart the Gym Leader in comparison & story tactics!',
    stepsRequired: 2,
    xpPerHit: 22,
    meterPerHit: 16,
    coinsPerHit: 7,
    stardustPerHit: 3,
  },
  {
    key: 'finisher',
    label: 'Phase 3: Final Finisher',
    subtitle: 'Unleash the signature stretch equation for the Gym Badge!',
    stepsRequired: 1,
    xpPerHit: 36,
    meterPerHit: 25,
    coinsPerHit: 15,
    stardustPerHit: 5,
  },
];

let mounted = false;
let sessionToken = 0;
let container = null;
let ctx = null;
let stateSession = null;
let clickHandler = null;

const activeTimeouts = new Set();

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

function clearAllTimers() {
  for (const id of activeTimeouts) clearTimeout(id);
  activeTimeouts.clear();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPrimaryType(pokemon) {
  const t = pokemon?.types?.[0];
  return typeof t === 'string' && t ? t.toLowerCase() : 'normal';
}

function getTypeColor(type) {
  return TYPE_COLORS[String(type || 'normal').toLowerCase()] || TYPE_COLORS.normal;
}

function injectBattleStyles() {
  if (typeof document === 'undefined' || !document.head) return;
  if (document.getElementById(STYLE_ELEMENT_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = `
    .pm-battle-root {
      display: flex;
      flex-direction: column;
      gap: 14px;
      width: 100%;
      color: var(--text-main, #1E293B);
      font-family: var(--font-sans, "Nunito", "Quicksand", "Segoe UI", system-ui, sans-serif);
    }
    .pm-battle-root .pm-battle-num {
      font-variant-numeric: tabular-nums;
    }
    .pm-battle-banner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 16px;
      background: var(--bg-card, rgba(255, 255, 255, 0.94));
      border: 2px solid var(--border-warm, #E8DEC8);
      border-radius: var(--radius-lg, 18px);
      box-shadow: 0 4px 14px rgba(30, 41, 59, 0.06);
    }
    .pm-battle-banner-title {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .pm-battle-route-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      background: #FFF3D6;
      border: 1.5px solid #F59E0B;
      color: #92400E;
      font-weight: 800;
      font-size: 0.78rem;
      letter-spacing: 0.02em;
    }
    .pm-battle-route-name {
      margin: 0;
      font-size: 1.08rem;
      font-weight: 800;
      color: var(--text-main, #1E293B);
    }
    .pm-battle-route-sub {
      margin: 2px 0 0;
      font-size: 0.82rem;
      color: var(--text-muted, #64748B);
      font-weight: 600;
    }
    .pm-battle-stats {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pm-battle-stat-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border-radius: 999px;
      background: #FFF9F0;
      border: 1.5px solid #E2D5BE;
      font-size: 0.82rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }
    .pm-battle-stat-chip.is-crit {
      background: linear-gradient(135deg, #FEF3C7, #FDE68A);
      border-color: #D97706;
      color: #92400E;
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.35);
    }
    .pm-battle-gym-header {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 14px 16px;
      background: linear-gradient(135deg, #FFFFFF, #FFF7E6);
      border: 2px solid #F59E0B;
      border-radius: 18px;
      box-shadow: 0 6px 18px rgba(245, 158, 11, 0.14);
    }
    .pm-battle-gym-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .pm-battle-gym-leader-card {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .pm-battle-gym-crest {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      background: #FFF9F0;
      border: 2px solid #E2D5BE;
      flex-shrink: 0;
    }
    .pm-battle-gym-quote {
      margin: 0;
      padding: 8px 12px;
      border-radius: 12px;
      background: #FFF9F0;
      border-left: 4px solid var(--poke-red, #E3350D);
      font-size: 0.9rem;
      font-weight: 700;
      color: #334155;
    }
    .pm-battle-gym-phases {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .pm-battle-phase-step {
      padding: 8px 10px;
      border-radius: 12px;
      background: #F8FAFC;
      border: 2px solid #E2E8F0;
      font-size: 0.78rem;
      font-weight: 800;
      color: #64748B;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .pm-battle-phase-step.is-active {
      background: #FEF3C7;
      border-color: #F59E0B;
      color: #92400E;
    }
    .pm-battle-phase-step.is-done {
      background: #DCFCE7;
      border-color: #22C55E;
      color: #166534;
    }
    .pm-battle-arena {
      position: relative;
      overflow: hidden;
      border-radius: 22px;
      border: 2.5px solid var(--border-warm, #DFD3BC);
      background: linear-gradient(180deg, #E0F2FE 0%, #FFF9F0 100%);
      min-height: 290px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 10px 26px rgba(30, 41, 59, 0.10);
    }
    .pm-battle-arena-bg {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }
    .pm-battle-arena-grid {
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      align-items: center;
    }
    .pm-battle-fighter {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .pm-battle-fighter.is-opponent {
      align-items: flex-end;
    }
    .pm-battle-fighter.is-buddy {
      align-items: flex-start;
    }
    .pm-battle-hud-card {
      width: 100%;
      max-width: 270px;
      background: rgba(255, 255, 255, 0.93);
      backdrop-filter: blur(6px);
      border: 2px solid #E2D5BE;
      border-radius: 16px;
      padding: 10px 12px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
    }
    .pm-battle-hud-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      margin-bottom: 6px;
    }
    .pm-battle-hud-name {
      font-weight: 900;
      font-size: 0.96rem;
      color: #0F172A;
      display: flex;
      align-items: center;
      gap: 5px;
      flex-wrap: wrap;
    }
    .pm-battle-type-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      color: #FFFFFF;
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .pm-battle-shiny-tag {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 2px 7px;
      border-radius: 999px;
      background: linear-gradient(135deg, #FEF08A, #F59E0B);
      color: #78350F;
      font-size: 0.68rem;
      font-weight: 900;
    }
    .pm-battle-hp-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.78rem;
      font-weight: 800;
      color: #475569;
      margin-bottom: 4px;
    }
    .pm-battle-hp-track {
      width: 100%;
      height: 13px;
      border-radius: 999px;
      background: #E2E8F0;
      border: 1.5px solid #CBD5E1;
      overflow: hidden;
    }
    .pm-battle-hp-fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, #22C55E, #4ADE80);
      transition: width 320ms cubic-bezier(0.22, 1, 0.36, 1), background-color 240ms ease;
    }
    .pm-battle-hp-fill.is-mid {
      background: linear-gradient(90deg, #F59E0B, #FBBF24);
    }
    .pm-battle-hp-fill.is-low {
      background: linear-gradient(90deg, #EF4444, #F87171);
    }
    .pm-battle-sprite-stage {
      position: relative;
      min-height: 130px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      max-width: 240px;
    }
    .pm-battle-platform-shadow {
      position: absolute;
      bottom: 6px;
      width: 130px;
      height: 24px;
      border-radius: 50%;
      background: radial-gradient(ellipse at center, rgba(15, 23, 42, 0.22), rgba(15, 23, 42, 0));
      z-index: 0;
    }
    .pm-battle-sprite-wrap {
      position: relative;
      z-index: 1;
      transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .pm-battle-sprite-wrap.is-lunging {
      transform: translate3d(26px, -10px, 0) scale(1.08);
    }
    .pm-battle-sprite-wrap.is-hit {
      animation: pm-battle-hit 420ms ease;
    }
    .pm-battle-catch-ready-pill {
      margin-top: 4px;
      padding: 3px 9px;
      border-radius: 999px;
      background: #FEF2F2;
      border: 1.5px solid #E3350D;
      color: #B91C1C;
      font-size: 0.72rem;
      font-weight: 900;
      animation: pm-battle-pulse 1.4s ease-in-out infinite;
    }
    .pm-battle-impact-bar-wrap {
      position: relative;
      z-index: 2;
      background: rgba(255, 255, 255, 0.9);
      border: 2px solid #E2D5BE;
      border-radius: 14px;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .pm-battle-impact-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 0.84rem;
      font-weight: 800;
      color: #1E293B;
    }
    .pm-battle-impact-track {
      height: 10px;
      border-radius: 999px;
      background: #E2E8F0;
      overflow: hidden;
    }
    .pm-battle-impact-fill {
      height: 100%;
      width: 0%;
      border-radius: 999px;
      background: linear-gradient(90deg, #3B4CCA, #E3350D, #FFCB05);
      transition: width 360ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .pm-battle-catch-cta-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 18px;
      background: linear-gradient(135deg, #FFF1F2, #FEF9C3);
      border: 2.5px solid #E3350D;
      box-shadow: 0 8px 22px rgba(227, 53, 13, 0.16);
    }
    .pm-battle-btn-glow {
      animation: pm-battle-pulse 1.3s ease-in-out infinite;
    }
    .pm-battle-moves-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .pm-battle-move-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      min-height: 112px;
      padding: 14px;
      border-radius: 18px;
      border: 2.5px solid #CBD5E1;
      border-bottom-width: 6px;
      background: #FFFFFF;
      text-align: left;
      cursor: pointer;
      font-family: inherit;
      color: #0F172A;
      transition: transform 140ms ease, box-shadow 140ms ease;
    }
    .pm-battle-move-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.10);
    }
    .pm-battle-move-card:active {
      transform: translateY(2px);
      border-bottom-width: 3px;
    }
    .pm-battle-move-card.is-charge-crit {
      border-color: #D97706;
      background: linear-gradient(135deg, #FFFBEB, #FEF3C7);
      box-shadow: 0 0 18px rgba(245, 158, 11, 0.25);
    }
    .pm-battle-move-name {
      font-size: 1.04rem;
      font-weight: 900;
    }
    .pm-battle-move-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      font-size: 0.78rem;
      font-weight: 800;
      color: #475569;
    }
    .pm-battle-problem-deck {
      background: var(--bg-card, #FFFFFF);
      border: 2.5px solid var(--border-warm, #DFD3BC);
      border-radius: 20px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: 0 8px 22px rgba(30, 41, 59, 0.08);
    }
    .pm-battle-problem-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pm-battle-problem-prompt {
      font-size: 1.24rem;
      font-weight: 900;
      color: #0F172A;
      margin: 0;
      line-height: 1.35;
    }
    .pm-battle-problem-expr {
      display: inline-flex;
      align-items: center;
      padding: 8px 14px;
      border-radius: 14px;
      background: #FFF9F0;
      border: 2px solid #E2D5BE;
      font-size: 1.4rem;
      font-weight: 900;
      color: #1E293B;
      margin-top: 6px;
    }
    .pm-battle-solver-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 14px;
      align-items: start;
    }
    .pm-battle-choices-grid.is-cmp {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .pm-battle-region {
      display: contents;
    }
    .pm-battle-keypad {
      justify-self: center;
    }
    .pm-battle-keypad .pm-battle-keypad-wide {
      grid-column: 1 / -1;
    }
    .pm-battle-keypad-help {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px;
      border-radius: 16px;
      border: 2px solid #CBD5E1;
      background: #F8FAFC;
      font-size: 0.9rem;
      font-weight: 700;
      color: #1E293B;
    }
    .pm-battle-victory-card {
      padding: 20px;
      border-radius: 22px;
      background: linear-gradient(135deg, #FEF9C3, #FFFBEB 45%, #ECFDF5);
      border: 3px solid #F59E0B;
      box-shadow: 0 12px 28px rgba(245, 158, 11, 0.22);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .pm-battle-victory-top {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .pm-battle-victory-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    @keyframes pm-battle-hit {
      0%, 100% { transform: translate3d(0, 0, 0); }
      25% { transform: translate3d(-10px, -4px, 0); }
      55% { transform: translate3d(10px, 3px, 0); }
      80% { transform: translate3d(-5px, 0, 0); }
    }
    @keyframes pm-battle-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.03); }
    }
    @media (max-width: 780px) {
      .pm-battle-moves-grid {
        grid-template-columns: 1fr;
      }
      .pm-battle-solver-grid {
        grid-template-columns: 1fr;
      }
      .pm-battle-gym-phases {
        grid-template-columns: 1fr;
      }
      .pm-battle-arena-grid {
        gap: 8px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .pm-battle-sprite-wrap.is-hit,
      .pm-battle-catch-ready-pill,
      .pm-battle-btn-glow {
        animation: none !important;
      }
      .pm-battle-hp-fill,
      .pm-battle-impact-fill,
      .pm-battle-sprite-wrap {
        transition: none !important;
      }
    }
    [data-reduced-motion="true"] .pm-battle-sprite-wrap.is-hit,
    [data-reduced-motion="true"] .pm-battle-catch-ready-pill,
    [data-reduced-motion="true"] .pm-battle-btn-glow {
      animation: none !important;
    }
    [data-reduced-motion="true"] .pm-battle-hp-fill,
    [data-reduced-motion="true"] .pm-battle-impact-fill,
    [data-reduced-motion="true"] .pm-battle-sprite-wrap {
      transition: none !important;
    }
  `;
  document.head.appendChild(style);
}

function removeBattleStyles() {
  if (typeof document === 'undefined') return;
  document.getElementById(STYLE_ELEMENT_ID)?.remove();
}

function getGymBadgeSvg(badgeColor = '#38B000', badgeSvgKey = 'sprout') {
  const c = escapeHtml(badgeColor);
  const symbolMap = {
    sprout: '<path d="M32 46V26M32 30c-7-1-12-6-12-12 7 0 12 4 12 12Zm0-4c7-1 12-6 12-12-7 0-12 4-12 12Z" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>',
    geode: '<polygon points="32,14 47,26 42,46 22,46 17,26" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linejoin="round"/><polyline points="24,27 32,33 40,27" fill="none" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round"/>',
    beacon: '<circle cx="32" cy="24" r="7" fill="#FFFFFF"/><path d="M22 48l4-16h12l4 16Z" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round"/>',
    dynamo: '<polygon points="35,14 21,34 31,34 28,50 43,29 33,29" fill="#FFFFFF"/>',
    cascade: '<path d="M32 15c8 10 12 16 12 22a12 12 0 1 1-24 0c0-6 4-12 12-22Z" fill="none" stroke="#FFFFFF" stroke-width="3.2"/>',
    infinity: '<path d="M20 32c0-5.5 4.2-9.5 9-9.5 5 0 8 4.5 11 9.5 3 5 6 9.5 11 9.5 4.8 0 9-4 9-9.5s-4.2-9.5-9-9.5c-5 0-8 4.5-11 9.5-3 5-6 9.5-11 9.5-4.8 0-9-4-9-9.5Z" transform="translate(-8,0)" fill="none" stroke="#FFFFFF" stroke-width="3.2"/>',
  };
  const inner = symbolMap[badgeSvgKey] || symbolMap.sprout;
  return `<svg viewBox="0 0 64 64" width="44" height="44" aria-hidden="true">
    <circle cx="32" cy="32" r="27" fill="${c}" stroke="#1E293B" stroke-width="3"/>
    <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2"/>
    ${inner}
  </svg>`;
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
  fallback.className = 'pkmn-visual-fallback';
  fallback.style.width = `${options?.size || 120}px`;
  fallback.style.height = `${options?.size || 120}px`;
  fallback.style.display = 'grid';
  fallback.style.placeItems = 'center';
  fallback.style.borderRadius = '50%';
  fallback.style.background = pokemon?.fallbackPalette?.primary || '#FFCB05';
  fallback.style.border = '3px solid #1E293B';
  fallback.style.fontWeight = '900';
  fallback.textContent = pokemon?.name || 'Buddy';
  slotEl.appendChild(fallback);
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
    gymLeader: {
      id: 'fern',
      name: 'Meadow Leader Fern',
      title: 'Botanist of Bonds',
      badgeId: 'sprout-badge',
      badgeName: 'Sprout Badge',
      badgeColor: '#38B000',
      badgeSvgKey: 'sprout',
      introQuote: 'Every flower blooms when parts join into ten! Ready to grow?',
      victoryQuote: 'What a radiant sum! Wear the Sprout Badge with pride!',
      teamIds: ['bulbasaur', 'chikorita', 'ivysaur'],
    },
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
      moveNames: { quick: 'Quick Spark', power: 'Thunder Ten', charge: 'Volt Combo' },
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

function rollShiny(profile, adaptiveCfg) {
  const base = 0.03;
  const charm = Number(profile?.shinyCharmBoost) || 0;
  const streakBonus = adaptiveCfg?.criticalChallenge ? 0.06 : 0;
  const chance = Math.min(0.35, base + charm + streakBonus);
  return Math.random() < chance;
}

function computeStars(solvedCount, thresholds = [3, 6, 10]) {
  let stars = 0;
  for (const t of thresholds) {
    if (solvedCount >= t) stars += 1;
  }
  return Math.min(3, stars);
}

function updateQuestListProgress(quests, {
  isBattleWin = false,
  isNoHints = false,
  isWord = false,
  isHigherTier = false,
  isCritical = false,
  streak = 0,
  xpGain = 0,
}) {
  if (!Array.isArray(quests)) return;
  for (const q of quests) {
    if (!q || q.claimed) continue;
    const m = q.metric;
    if (m === 'totalSolved' || m === 'solve_total') {
      q.progress = Math.min(q.target, (q.progress || 0) + 1);
    } else if (m === 'sessionStreak' || m === 'solve_streak') {
      q.progress = Math.min(q.target, Math.max(q.progress || 0, streak));
    } else if (m === 'solve_no_hints' && isNoHints) {
      q.progress = Math.min(q.target, (q.progress || 0) + 1);
    } else if (m === 'battle_wins' && isBattleWin) {
      q.progress = Math.min(q.target, (q.progress || 0) + 1);
    } else if (m === 'solve_word' && isWord) {
      q.progress = Math.min(q.target, (q.progress || 0) + 1);
    } else if (m === 'solve_explorer_plus' && isHigherTier) {
      q.progress = Math.min(q.target, (q.progress || 0) + 1);
    } else if (m === 'critical_solve' && isCritical) {
      q.progress = Math.min(q.target, (q.progress || 0) + 1);
    } else if (m === 'earn_xp' && xpGain > 0) {
      q.progress = Math.min(q.target, (q.progress || 0) + xpGain);
    }
  }
}

function generateWildMoves(profile, route) {
  const tier = profile?.tier || route?.recommendedTier || 'starter';
  const adaptiveConfig = ctx?.adaptive?.getRecommendedProblemConfig?.(profile, route.id) || {
    tier,
    routeId: route.id,
    difficultyAdjustment: 0,
    criticalChallenge: false,
  };
  const moveSet = ctx?.mathEngine?.generateMoveSetProblems?.(
    tier,
    profile?.customFilter || null,
    adaptiveConfig,
    route.id
  );
  return { moveSet, adaptiveConfig };
}

function generateGymPhaseProblem(profile, route, phaseIdx) {
  const tier = profile?.tier || route?.recommendedTier || 'starter';
  const customFilter = profile?.customFilter || null;
  const adaptiveConfig = ctx?.adaptive?.getRecommendedProblemConfig?.(profile, route.id) || {
    tier,
    routeId: route.id,
    difficultyAdjustment: 0,
    criticalChallenge: false,
  };

  if (phaseIdx === 0) {
    return ctx.mathEngine.generateProblem({
      tier,
      routeId: route.id,
      customFilter,
      difficultyAdjustment: Math.min(0, adaptiveConfig.difficultyAdjustment || 0),
      criticalChallenge: false,
    });
  }

  if (phaseIdx === 1) {
    const allowedOps = customFilter?.enabled && Array.isArray(customFilter.operations)
      ? customFilter.operations
      : null;
    const wantsCmp = stateSession.phaseStep % 2 === 0;
    let forcedOp = wantsCmp ? 'comparison' : 'word';
    if (allowedOps && !allowedOps.includes(forcedOp)) {
      forcedOp = allowedOps.includes('word')
        ? 'word'
        : allowedOps.includes('comparison')
          ? 'comparison'
          : null;
    }
    return ctx.mathEngine.generateProblem({
      tier,
      routeId: route.id,
      operation: forcedOp,
      customFilter,
      difficultyAdjustment: adaptiveConfig.difficultyAdjustment || 0,
      criticalChallenge: false,
    });
  }

  return ctx.mathEngine.generateProblem({
    tier,
    routeId: route.id,
    customFilter,
    difficultyAdjustment: 1,
    criticalChallenge: true,
  });
}

function syncRotomToProblem(problem) {
  if (!problem || !ctx?.rotomPane) return;
  const hintBundle = ctx?.hintEngine?.buildHintBundle?.(problem) || null;
  ctx.rotomPane.setProblem?.(problem, hintBundle);
  const mood = stateSession?.isGym
    ? 'thinking'
    : (stateSession?.adaptiveConfig?.criticalChallenge ? 'starry' : 'curious');
  const msg = stateSession?.isGym
    ? `${stateSession.route.gymLeader.name} awaits your answer!`
    : 'Check the numbers and unleash your Buddy move!';
  ctx.rotomPane.setMood?.(mood, msg);
}

function formatSkillLabel(problem) {
  const friendly = ctx?.mathEngine?.formatSkillTag?.(problem?.skillTag);
  return friendly || problem?.operation || 'Math Adventure';
}

function isFractionProblem(problem) {
  return problem?.format === 'fraction' || String(problem?.answer ?? '').includes('/');
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

function startWildSession(preserveEncounter = false) {
  const profile = ctx.state.getActiveProfile();
  const route = resolveRoute(profile);
  const buddy = resolvePokemon(profile?.activeBuddyId, 'pikachu');
  const buddyEntry = profile?.caught?.[buddy.id];
  const { moveSet, adaptiveConfig } = generateWildMoves(profile, route);

  let wild;
  if (!preserveEncounter && ctx?.modeParams?.encounterPokemonId && !stateSession?.initializedFromParams) {
    wild = resolvePokemon(ctx.modeParams.encounterPokemonId, route.wildPool?.[0]);
  } else {
    wild = pickWildEncounter(route, stateSession?.wildPokemon?.id || null);
  }

  const isShiny = !preserveEncounter && !stateSession?.initializedFromParams && typeof ctx?.modeParams?.shiny === 'boolean'
    ? ctx.modeParams.shiny
    : rollShiny(profile, adaptiveConfig);

  const wildMaxHp = Math.max(60, wild.baseHp || 80);
  const ratio = !preserveEncounter && !stateSession?.initializedFromParams && typeof ctx?.modeParams?.hpRatio === 'number'
    ? ctx.modeParams.hpRatio
    : 1;
  const wildHp = Math.max(1, Math.min(wildMaxHp, Math.round(wildMaxHp * ratio)));

  stateSession = {
    isGym: false,
    initializedFromParams: true,
    route,
    profile,
    buddyPokemon: buddy,
    buddyShiny: Boolean(buddyEntry?.shiny),
    buddyMaxHp: Math.max(70, buddy.baseHp || 90),
    buddyHp: Math.max(70, buddy.baseHp || 90),
    wildPokemon: wild,
    isShiny,
    wildMaxHp,
    wildHp,
    moveSet,
    adaptiveConfig,
    selectedMoveKey: null,
    activeProblem: null,
    awaitingAnswer: false,
    animating: false,
    typedInput: '',
    nudgedChoices: new Set(),
    hintsOpenedAtStart: ctx?.rotomPane?.getCurrentHintTier?.() || 0,
    encounterVictoryRecorded: wildHp <= 1,
    impactPercent: 0,
    impactLabel: 'Ready for command!',
    statusMessage: isShiny
      ? `Whoa! A sparkling Shiny ${wild.name} appeared! Choose a move!`
      : `A wild ${wild.name} appeared in ${route.name}! Choose a Tactical Move!`,
    statusVariant: 'info',
  };
}

function startGymSession() {
  const profile = ctx.state.getActiveProfile();
  const route = resolveRoute(profile);
  const buddy = resolvePokemon(profile?.activeBuddyId, 'pikachu');
  const buddyEntry = profile?.caught?.[buddy.id];
  const gymLeader = route.gymLeader;
  const teamIds = Array.isArray(gymLeader?.teamIds) && gymLeader.teamIds.length > 0
    ? gymLeader.teamIds
    : ['pikachu', 'raichu', 'dragonite'];

  stateSession = {
    isGym: true,
    initializedFromParams: true,
    route,
    gymLeader,
    teamIds,
    phaseIdx: 0,
    phaseStep: 0,
    gymWon: false,
    gymVictoryRewards: null,
    profile,
    buddyPokemon: buddy,
    buddyShiny: Boolean(buddyEntry?.shiny),
    buddyMaxHp: Math.max(70, buddy.baseHp || 90),
    buddyHp: Math.max(70, buddy.baseHp || 90),
    wildPokemon: resolvePokemon(teamIds[0]),
    isShiny: false,
    wildMaxHp: 100,
    wildHp: 100,
    activeProblem: null,
    awaitingAnswer: true,
    animating: false,
    typedInput: '',
    nudgedChoices: new Set(),
    hintsOpenedAtStart: ctx?.rotomPane?.getCurrentHintTier?.() || 0,
    impactPercent: 0,
    impactLabel: GYM_PHASES[0].label,
    statusMessage: `${gymLeader.name}: "${gymLeader.introQuote}"`,
    statusVariant: 'info',
  };

  stateSession.activeProblem = generateGymPhaseProblem(profile, route, 0);
}

function selectWildMove(moveKey) {
  if (!stateSession || stateSession.isGym || stateSession.animating) return;
  const problem = stateSession.moveSet?.[moveKey];
  if (!problem) return;

  ctx.audio?.unlockAudio?.();
  ctx.audio?.playClick?.('select');

  stateSession.selectedMoveKey = moveKey;
  stateSession.activeProblem = problem;
  stateSession.awaitingAnswer = true;
  stateSession.typedInput = '';
  stateSession.nudgedChoices = new Set();
  stateSession.hintsOpenedAtStart = 0;

  const moveName = stateSession.buddyPokemon?.moveNames?.[moveKey] || MOVE_META[moveKey].label;
  stateSession.statusMessage = `Solving for ${moveName}! Pick a tile or use the Poké-Keypad!`;
  stateSession.statusVariant = 'info';

  syncRotomToProblem(problem);
  render({ keepArena: true });
  onNewProblem(problem);
}

function getArenaEl() {
  return container?.querySelector('.pm-battle-arena') || null;
}

function triggerVisualAttack(buddyType, moveKey, damageText, isCrit) {
  const arenaEl = getArenaEl();
  const buddySprite = container?.querySelector('.pm-battle-fighter.is-buddy .pm-battle-sprite-wrap');
  const wildSprite = container?.querySelector('.pm-battle-fighter.is-opponent .pm-battle-sprite-wrap');

  if (buddySprite) buddySprite.classList.add('is-lunging');
  if (wildSprite) wildSprite.classList.add('is-hit');

  if (arenaEl) {
    ctx.vfx?.playElementalAttackVFX?.(arenaEl, buddyType, moveKey);
    ctx.vfx?.spawnFloatingText?.(arenaEl, damageText, isCrit ? 'crit' : 'damage');
  }

  trackTimeout(() => {
    buddySprite?.classList.remove('is-lunging');
    wildSprite?.classList.remove('is-hit');
  }, 460);
}

function statusIcon(variant) {
  return variant === 'nudge' ? '💡' : variant === 'success' ? '✨' : '🧭';
}

function statusClassName(variant) {
  return `pokenav-feedback ${variant === 'nudge' ? 'is-nudge' : variant === 'success' ? 'is-correct' : 'is-info'}`;
}

function statusInnerHtml(s) {
  if (!s?.statusMessage) return '';
  return `<span>${statusIcon(s.statusVariant)}</span><span>${escapeHtml(s.statusMessage)}</span>`;
}

/** Updates the feedback banner in place (no sprite/backdrop reload). */
function patchStatus() {
  const el = container?.querySelector('[data-battle-region="status"]');
  if (!el || !stateSession) return;
  el.className = statusClassName(stateSession.statusVariant);
  el.innerHTML = statusInnerHtml(stateSession);
}

/** Updates HP bars, impact meter and the catch-ready pill in place. */
function patchArena() {
  const s = stateSession;
  if (!container || !s) return;
  const setText = (sel, value) => {
    const el = container.querySelector(sel);
    if (el) el.textContent = value;
  };
  for (const who of ['wild', 'buddy']) {
    const hp = who === 'wild' ? s.wildHp : s.buddyHp;
    const maxHp = who === 'wild' ? s.wildMaxHp : s.buddyMaxHp;
    const info = renderHpPercent(hp, maxHp);
    const fill = container.querySelector(`[data-hp-fill="${who}"]`);
    if (fill) {
      fill.style.width = `${info.pct}%`;
      fill.classList.toggle('is-low', info.cls === 'is-low');
      fill.classList.toggle('is-mid', info.cls === 'is-mid');
    }
    setText(`[data-hp-text="${who}"]`, `${hp} / ${maxHp}`);
  }
  setText('[data-impact-label]', s.impactLabel);
  setText('[data-impact-pct]', `${s.impactPercent}%`);
  const impactFill = container.querySelector('[data-impact-fill]');
  if (impactFill) impactFill.style.width = `${s.impactPercent}%`;
  const pillHost = container.querySelector('[data-catch-pill]');
  if (pillHost) {
    const ready = !s.isGym && s.wildHp <= Math.ceil(s.wildMaxHp * 0.35);
    pillHost.innerHTML = ready
      ? '<div class="pm-battle-catch-ready-pill">Weakened! Ready for Poké Ball!</div>'
      : '';
  }
}

function findChoiceTile(rawAnswer) {
  if (rawAnswer === undefined || rawAnswer === null || !container) return null;
  const want = String(rawAnswer);
  return Array.from(container.querySelectorAll('[data-choice-val]'))
    .find((el) => el.getAttribute('data-choice-val') === want) || null;
}

function replayClass(el, className) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

function submitAnswer(rawAnswer) {
  if (!mounted || !stateSession || !stateSession.awaitingAnswer || stateSession.animating) return;
  const problem = stateSession.activeProblem;
  if (!problem) return;

  ctx.audio?.unlockAudio?.();
  const isCorrect = Boolean(ctx.mathEngine?.validateAnswer?.(problem, rawAnswer));
  const currentHintTier = Number(ctx.rotomPane?.getCurrentHintTier?.() || 0);
  const hintsUsed = Math.max(stateSession.hintsOpenedAtStart || 0, currentHintTier);
  const buddyType = getPrimaryType(stateSession.buddyPokemon);

  if (!isCorrect) {
    let adaptiveRes = null;
    const updatedProfile = ctx.state.updateProfile((draft) => {
      adaptiveRes = ctx.adaptive.recordAttempt(draft, problem.skillTag, false, hintsUsed);
      draft.totalAttempts = (draft.totalAttempts || 0) + 1;
      return draft;
    });

    stateSession.profile = updatedProfile || stateSession.profile;
    stateSession.typedInput = '';
    if (rawAnswer !== undefined && rawAnswer !== null) {
      stateSession.nudgedChoices.add(String(rawAnswer));
    }
    stateSession.statusMessage = `Attack grazed! Rotom-Dex spotted a trick! ${adaptiveRes?.encouragementMessage || ''}`.trim();
    stateSession.statusVariant = 'nudge';
    stateSession.impactPercent = 18;
    stateSession.impactLabel = 'Graze — adjust and fire again!';

    ctx.audio?.playGentleNudge?.();
    if (adaptiveRes?.autoOpenHintTier >= 1) {
      ctx.rotomPane?.openHintTier?.(adaptiveRes.autoOpenHintTier);
    }
    ctx.rotomPane?.setMood?.('encouraging', adaptiveRes?.encouragementMessage || 'Take another calm look!');
    ctx.rotomPane?.updateMetrics?.(buildRotomMetrics(stateSession.profile, adaptiveRes, 0));

    // In-place nudge: sprites, backdrop and problem deck stay mounted.
    patchStatus();
    patchArena();
    updateKeypadScreen();
    const tile = findChoiceTile(rawAnswer);
    if (tile) {
      tile.classList.add('is-graze');
      replayClass(tile, 'pokenav-graze');
    } else {
      replayClass(container?.querySelector('.pm-battle-keypad-screen'), 'pokenav-graze');
    }
    const arenaEl = getArenaEl();
    if (arenaEl) {
      ctx.vfx?.spawnFloatingText?.(arenaEl, 'Graze! Try again!', 'nudge');
    }
    return;
  }

  // Correct answer!
  stateSession.awaitingAnswer = false;
  stateSession.animating = true;

  // main.js owns the Speed Blitz window and awards +2 Coins & +2 Stardust itself.
  const blitzBonus = ctx.speedBlitz?.consumeBonus?.() || false;

  const tile = findChoiceTile(rawAnswer);
  if (tile) {
    tile.classList.add('is-correct');
    replayClass(tile, 'pokenav-celebrate');
  } else {
    replayClass(container?.querySelector('.pm-battle-keypad-screen'), 'pokenav-celebrate');
  }

  if (!stateSession.isGym) {
    handleWildCorrect(problem, hintsUsed, buddyType, blitzBonus);
  } else {
    handleGymCorrect(problem, hintsUsed, buddyType, blitzBonus);
  }
}

function showBlitzBonus(blitzBonus) {
  if (!blitzBonus) return;
  const coins = typeof blitzBonus === 'object' && Number.isFinite(Number(blitzBonus.coins))
    ? Number(blitzBonus.coins)
    : 2;
  const arenaEl = getArenaEl();
  if (arenaEl) ctx.vfx?.spawnFloatingText?.(arenaEl, `⚡ Speed Blitz +${coins}c`, 'coins');
}

function handleWildCorrect(problem, hintsUsed, buddyType, blitzBonus) {
  const moveKey = stateSession.selectedMoveKey || 'power';
  const meta = MOVE_META[moveKey] || MOVE_META.power;
  const streakBefore = stateSession.profile?.sessionStreak || 0;
  const nextStreakEstimate = streakBefore + 1;
  const isCrit = nextStreakEstimate >= 4 || moveKey === 'charge';

  const baseDmg = Math.max(12, Math.round(stateSession.wildMaxHp * meta.dmgRatio));
  const critBonus = nextStreakEstimate >= 4 ? 8 : 0;
  const damage = baseDmg + critBonus;
  const nextWildHp = Math.max(1, stateSession.wildHp - damage);
  const isNewBattleWin = nextWildHp <= 1 && !stateSession.encounterVictoryRecorded;

  const xpGain = meta.xp + (nextStreakEstimate >= 4 ? 5 : 0);
  const meterGain = meta.meter;
  const coinGain = meta.coins + (isNewBattleWin ? 10 : 0);
  const stardustGain = meta.stardust + (isNewBattleWin ? 3 : 0);

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
    } else if (!draft.classicEmblemUnlocked && draft.totalSolved >= 3) {
      draft.classicEmblemUnlocked = true;
      unlockedEmblemNow = true;
    }

    updateQuestListProgress(draft.activeQuests, {
      isBattleWin: isNewBattleWin,
      isNoHints: hintsUsed === 0,
      isWord: problem.operation === 'word' || problem.format === 'word',
      isHigherTier: problem.tier !== 'starter',
      isCritical: Boolean(adaptiveRes?.triggerCriticalChallenge || moveKey === 'charge'),
      streak: adaptiveRes?.streak || 1,
      xpGain,
    });
    return draft;
  });

  stateSession.profile = updatedProfile || stateSession.profile;
  stateSession.wildHp = nextWildHp;
  if (isNewBattleWin) stateSession.encounterVictoryRecorded = true;

  const moveName = stateSession.buddyPokemon?.moveNames?.[moveKey] || meta.label;
  stateSession.impactPercent = moveKey === 'charge' || isCrit ? 100 : moveKey === 'power' ? 76 : 54;
  stateSession.impactLabel = `${moveName}! ${isCrit ? 'SUPER IMPACT!' : 'DIRECT HIT!'} (-${damage} HP)`;
  stateSession.statusMessage = nextWildHp <= Math.ceil(stateSession.wildMaxHp * 0.35)
    ? `${moveName} hit for ${damage} DMG! Wild ${stateSession.wildPokemon.name} is weakened and ready for a Poké Ball!`
    : `${moveName} hit for ${damage} DMG! +${xpGain} XP & +${coinGain} Coins!`;
  stateSession.statusVariant = 'success';

  ctx.audio?.playAttackSFX?.(buddyType, moveKey);
  ctx.audio?.playCorrectChime?.(adaptiveRes?.streak || 1);
  if (unlockedEmblemNow) {
    ctx.shell?.showToast?.('Classic Trainer 1996 Heritage Emblem unlocked!', 'success');
  }

  ctx.rotomPane?.setMood?.(
    (adaptiveRes?.streak || 0) >= 4 ? 'starry' : 'cheering',
    adaptiveRes?.encouragementMessage || 'Super effective thinking, Trainer!'
  );
  ctx.rotomPane?.updateMetrics?.(buildRotomMetrics(stateSession.profile, adaptiveRes));

  // Patch HUD in place, then fire VFX on the still-mounted sprites.
  patchArena();
  patchStatus();
  triggerVisualAttack(buddyType, moveKey, isCrit ? `CRIT -${damage}!` : `-${damage} HP`, isCrit);
  const arenaEl = getArenaEl();
  if (arenaEl) {
    ctx.vfx?.spawnFloatingText?.(arenaEl, `+${xpGain} XP  +${coinGain}c`, 'xp');
  }
  showBlitzBonus(blitzBonus);

  trackTimeout(() => {
    if (!stateSession) return;
    const refreshed = generateWildMoves(stateSession.profile, stateSession.route);
    stateSession.moveSet = refreshed.moveSet;
    stateSession.adaptiveConfig = refreshed.adaptiveConfig;
    stateSession.selectedMoveKey = null;
    stateSession.activeProblem = null;
    stateSession.awaitingAnswer = false;
    stateSession.animating = false;
    stateSession.typedInput = '';
    render({ keepArena: true });
  }, 1000);
}

function handleGymCorrect(problem, hintsUsed, buddyType, blitzBonus) {
  const phaseIdx = stateSession.phaseIdx;
  const phase = GYM_PHASES[phaseIdx];
  const nextStep = stateSession.phaseStep + 1;
  const phaseCompleted = nextStep >= phase.stepsRequired;
  const isFinalPhaseVictory = phaseCompleted && phaseIdx >= GYM_PHASES.length - 1;

  const xpGain = phase.xpPerHit + (isFinalPhaseVictory ? 35 : 0);
  const meterGain = phase.meterPerHit + (isFinalPhaseVictory ? 20 : 0);
  const coinGain = phase.coinsPerHit + (isFinalPhaseVictory ? 40 : 0);
  const stardustGain = phase.stardustPerHit + (isFinalPhaseVictory ? 25 : 0);

  let adaptiveRes = null;
  let nextRouteUnlockedId = null;

  const updatedProfile = ctx.state.updateProfile((draft) => {
    adaptiveRes = ctx.adaptive.recordAttempt(draft, problem.skillTag, true, hintsUsed);
    draft.totalAttempts = (draft.totalAttempts || 0) + 1;
    draft.totalSolved = (draft.totalSolved || 0) + 1;
    draft.buddyXp = (draft.buddyXp || 0) + xpGain;
    draft.buddyLevel = Math.max(draft.buddyLevel || 1, 1 + Math.floor(draft.buddyXp / 100));
    draft.evolutionMeter = Math.min(100, (draft.evolutionMeter || 0) + meterGain);
    draft.coins = (draft.coins || 0) + coinGain;
    draft.stardust = (draft.stardust || 0) + stardustGain;

    const rp = draft.routeProgress?.[stateSession.route.id];
    if (rp) {
      rp.solvedCount = (rp.solvedCount || 0) + 1;
      rp.stars = Math.max(
        rp.stars || 0,
        computeStars(rp.solvedCount, stateSession.route.starThresholds)
      );
      if (isFinalPhaseVictory) {
        rp.bossDefeated = true;
      }
    }

    if (isFinalPhaseVictory) {
      const badgeId = stateSession.gymLeader?.badgeId;
      if (badgeId && !draft.badges.includes(badgeId)) {
        draft.badges.push(badgeId);
      }
      draft.classicEmblemUnlocked = true;

      const nextNum = (stateSession.route?.number || 1) + 1;
      const nextId = `route-${nextNum}`;
      if (nextNum <= 6 && draft.routeProgress?.[nextId]) {
        draft.routeProgress[nextId].unlocked = true;
        nextRouteUnlockedId = nextId;
      }

      if (!Array.isArray(draft.mysteryEggs)) draft.mysteryEggs = [];
      draft.mysteryEggs.push({
        id: `egg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        warmth: 0,
        source: stateSession.route.id,
        tierHint: stateSession.route.recommendedTier || draft.tier || 'starter',
      });

      draft.shinyCharmBoost = Number(Math.min(0.25, (draft.shinyCharmBoost || 0) + 0.02).toFixed(2));
    }

    updateQuestListProgress(draft.activeQuests, {
      isBattleWin: isFinalPhaseVictory,
      isNoHints: hintsUsed === 0,
      isWord: problem.operation === 'word' || problem.format === 'word',
      isHigherTier: problem.tier !== 'starter',
      isCritical: Boolean(adaptiveRes?.triggerCriticalChallenge || phaseIdx === 2),
      streak: adaptiveRes?.streak || 1,
      xpGain,
    });
    return draft;
  });

  stateSession.profile = updatedProfile || stateSession.profile;

  const totalSteps = GYM_PHASES.reduce((acc, p) => acc + p.stepsRequired, 0);
  const completedTotal =
    GYM_PHASES.slice(0, phaseIdx).reduce((acc, p) => acc + p.stepsRequired, 0) + nextStep;
  const dmgDisplay = Math.round(100 / phase.stepsRequired);

  stateSession.wildHp = isFinalPhaseVictory
    ? 0
    : phaseCompleted
      ? 100
      : Math.max(1, 100 - nextStep * dmgDisplay);
  stateSession.impactPercent = Math.round((completedTotal / totalSteps) * 100);
  stateSession.impactLabel = isFinalPhaseVictory
    ? `FINAL FINISHER! ${stateSession.gymLeader.badgeName} Earned!`
    : phaseCompleted
      ? `${phase.label} Cleared! Next challenger approaches!`
      : `Shield cracked! (${nextStep}/${phase.stepsRequired})`;
  stateSession.statusVariant = 'success';

  ctx.audio?.playAttackSFX?.(buddyType, phaseIdx === 2 ? 'charge' : 'power');
  ctx.audio?.playCorrectChime?.(adaptiveRes?.streak || 1);

  ctx.rotomPane?.setMood?.(
    isFinalPhaseVictory || (adaptiveRes?.streak || 0) >= 4 ? 'starry' : 'cheering',
    isFinalPhaseVictory
      ? stateSession.gymLeader.victoryQuote
      : adaptiveRes?.encouragementMessage || 'Brilliant Gym Battle tactics!'
  );
  ctx.rotomPane?.updateMetrics?.(buildRotomMetrics(stateSession.profile, adaptiveRes));

  patchArena();
  patchStatus();
  triggerVisualAttack(buddyType, phaseIdx === 2 ? 'charge' : 'power', isFinalPhaseVictory ? 'FINISHER!' : `HIT!`, phaseIdx === 2);
  showBlitzBonus(blitzBonus);

  if (isFinalPhaseVictory) {
    stateSession.gymWon = true;
    stateSession.gymVictoryRewards = {
      badgeName: stateSession.gymLeader.badgeName,
      nextRouteId: nextRouteUnlockedId,
      shinyCharmBoost: stateSession.profile?.shinyCharmBoost || 0.02,
      coins: coinGain,
      stardust: stardustGain,
    };
    stateSession.statusMessage = stateSession.gymLeader.victoryQuote;
    trackTimeout(() => {
      if (!stateSession) return;
      stateSession.animating = false;
      ctx.audio?.playBadgeFanfare?.();
      render({ keepArena: true });
      const arenaEl = getArenaEl();
      if (arenaEl) ctx.vfx?.burstConfetti?.(arenaEl);
      ctx.shell?.showToast?.(`Earned ${stateSession.gymLeader.badgeName} + Mystery Egg!`, 'success');
    }, 650);
    return;
  }

  trackTimeout(() => {
    if (!stateSession) return;
    if (phaseCompleted) {
      stateSession.phaseIdx = phaseIdx + 1;
      stateSession.phaseStep = 0;
      const teamIdx = stateSession.phaseIdx >= GYM_PHASES.length - 1
        ? stateSession.teamIds.length - 1
        : Math.min(stateSession.phaseIdx, stateSession.teamIds.length - 1);
      stateSession.wildPokemon = resolvePokemon(stateSession.teamIds[teamIdx]);
      stateSession.wildHp = 100;
      stateSession.wildMaxHp = 100;
      stateSession.statusMessage = `${GYM_PHASES[stateSession.phaseIdx].label}: ${stateSession.gymLeader.name} sends out ${stateSession.wildPokemon.name}!`;
    } else {
      stateSession.phaseStep = nextStep;
      stateSession.statusMessage = `Awesome hit! One more solve to break ${phase.label}!`;
    }
    stateSession.activeProblem = generateGymPhaseProblem(
      stateSession.profile,
      stateSession.route,
      stateSession.phaseIdx
    );
    stateSession.awaitingAnswer = true;
    stateSession.animating = false;
    stateSession.typedInput = '';
    stateSession.nudgedChoices = new Set();
    stateSession.hintsOpenedAtStart = 0;
    syncRotomToProblem(stateSession.activeProblem);
    // A new Gym ace needs a fresh sprite; otherwise keep the arena mounted.
    render({ keepArena: !phaseCompleted });
    onNewProblem(stateSession.activeProblem);
  }, 1000);
}

function renderHpPercent(hp, maxHp) {
  const pct = Math.max(0, Math.min(100, Math.round((hp / Math.max(1, maxHp)) * 100)));
  const cls = pct <= 35 ? 'is-low' : pct <= 65 ? 'is-mid' : '';
  return { pct, cls };
}

function renderArenaMarkup() {
  const s = stateSession;
  const wildHpInfo = renderHpPercent(s.wildHp, s.wildMaxHp);
  const buddyHpInfo = renderHpPercent(s.buddyHp, s.buddyMaxHp);
  const wildType = getPrimaryType(s.wildPokemon);
  const buddyType = getPrimaryType(s.buddyPokemon);
  const isCatchReady = !s.isGym && s.wildHp <= Math.ceil(s.wildMaxHp * 0.35);

  return `
    <div class="pm-battle-arena" aria-live="polite">
      <div class="pm-battle-arena-bg"></div>
      <div class="pm-battle-arena-grid">
        <div class="pm-battle-fighter is-buddy">
          <div class="pm-battle-hud-card">
            <div class="pm-battle-hud-top">
              <div class="pm-battle-hud-name">
                <span>${escapeHtml(s.buddyPokemon.name)}</span>
                <span class="pm-battle-type-badge" style="background:${getTypeColor(buddyType)}">${escapeHtml(buddyType)}</span>
              </div>
              <span class="pm-battle-num" style="font-weight:800;font-size:0.82rem;color:#334155;">Lv.${s.profile?.buddyLevel || 1}</span>
            </div>
            <div class="pm-battle-hp-row">
              <span>Buddy HP</span>
              <span class="pm-battle-num" data-hp-text="buddy">${s.buddyHp} / ${s.buddyMaxHp}</span>
            </div>
            <div class="pm-battle-hp-track">
              <div class="pm-battle-hp-fill ${buddyHpInfo.cls}" data-hp-fill="buddy" style="width:${buddyHpInfo.pct}%"></div>
            </div>
          </div>
          <div class="pm-battle-sprite-stage">
            <div class="pm-battle-platform-shadow"></div>
            <div class="pm-battle-sprite-wrap" data-slot="buddy"></div>
          </div>
        </div>

        <div class="pm-battle-fighter is-opponent">
          <div class="pm-battle-hud-card">
            <div class="pm-battle-hud-top">
              <div class="pm-battle-hud-name">
                <span>${escapeHtml(s.wildPokemon.name)}</span>
                ${s.isShiny ? '<span class="pm-battle-shiny-tag">✨ SHINY</span>' : ''}
                <span class="pm-battle-type-badge" style="background:${getTypeColor(wildType)}">${escapeHtml(wildType)}</span>
              </div>
              <span style="font-weight:800;font-size:0.78rem;color:#475569;">${s.isGym ? 'Gym Ace' : 'Wild'}</span>
            </div>
            <div class="pm-battle-hp-row">
              <span>${s.isGym ? 'Phase HP' : 'Wild HP'}</span>
              <span class="pm-battle-num" data-hp-text="wild">${s.wildHp} / ${s.wildMaxHp}</span>
            </div>
            <div class="pm-battle-hp-track">
              <div class="pm-battle-hp-fill ${wildHpInfo.cls}" data-hp-fill="wild" style="width:${wildHpInfo.pct}%"></div>
            </div>
            <div data-catch-pill>${isCatchReady ? '<div class="pm-battle-catch-ready-pill">Weakened! Ready for Poké Ball!</div>' : ''}</div>
          </div>
          <div class="pm-battle-sprite-stage">
            <div class="pm-battle-platform-shadow"></div>
            <div class="pm-battle-sprite-wrap" data-slot="wild"></div>
          </div>
        </div>
      </div>

      <div class="pm-battle-impact-bar-wrap">
        <div class="pm-battle-impact-head">
          <span data-impact-label>${escapeHtml(s.impactLabel)}</span>
          <span class="pm-battle-num" data-impact-pct>${s.impactPercent}%</span>
        </div>
        <div class="pm-battle-impact-track">
          <div class="pm-battle-impact-fill" data-impact-fill style="width:${s.impactPercent}%"></div>
        </div>
      </div>
    </div>
  `;
}

function renderMoveCardsMarkup() {
  const s = stateSession;
  const buddyType = getPrimaryType(s.buddyPokemon);
  const buddyColor = getTypeColor(buddyType);
  const moveNames = s.buddyPokemon?.moveNames || { quick: 'Quick Spark', power: 'Thunder Ten', charge: 'Volt Combo' };
  const keys = ['quick', 'power', 'charge'];

  return `
    <div class="pm-battle-moves-grid">
      ${keys.map((key) => {
        const meta = MOVE_META[key];
        const moveName = moveNames[key] || meta.label;
        const estDmg = Math.max(12, Math.round(s.wildMaxHp * meta.dmgRatio));
        const isCritHighlight = key === 'charge' && s.adaptiveConfig?.criticalChallenge;
        return `
          <button type="button" class="pm-battle-move-card ${isCritHighlight ? 'is-charge-crit' : ''}" data-move-key="${key}">
            <div class="pm-battle-move-meta">
              <span class="pm-battle-type-badge" style="background:${buddyColor}">${escapeHtml(buddyType)} • ${meta.tag}</span>
              <span class="pm-battle-num">[${meta.keyHint}]</span>
            </div>
            <div class="pm-battle-move-name">${escapeHtml(moveName)}</div>
            <div class="pm-battle-move-meta">
              <span class="pm-battle-num">~${estDmg} DMG</span>
              <span class="pm-battle-num">+${meta.xp} XP • +${meta.coins}c</span>
            </div>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function renderProblemDeckMarkup() {
  const s = stateSession;
  const p = s.activeProblem;
  const isCmp = p.format === 'comparison';
  const isFraction = isFractionProblem(p);
  const moveBadge = s.isGym
    ? GYM_PHASES[s.phaseIdx].label
    : `${s.buddyPokemon?.moveNames?.[s.selectedMoveKey] || 'Move'} (${MOVE_META[s.selectedMoveKey]?.tag || 'Math'})`;

  const storyHeader = p.meta?.storyEmoji
    ? `<span style="font-size:1.15rem;margin-right:6px;">${escapeHtml(p.meta.storyEmoji)}</span>`
    : '';

  const choicesHtml = (p.choices || []).map((choice) => {
    const valStr = String(choice);
    const nudged = s.nudgedChoices.has(valStr) ? 'is-graze' : '';
    return `<button type="button" class="pokenav-choice-tile pm-battle-num ${nudged}" data-choice-val="${escapeHtml(valStr)}">${escapeHtml(valStr)}</button>`;
  }).join('');

  const keypadHtml = isCmp
    ? `
      <div class="pm-battle-keypad-help">
        <div style="font-size:0.84rem;font-weight:800;color:#475569;">Keyboard Shortcuts</div>
        <div>Press <strong>&lt;</strong>, <strong>=</strong>, or <strong>&gt;</strong> on your keyboard, or tap a symbol tile!</div>
      </div>
    `
    : `
      <div class="pokenav-keypad pm-battle-keypad" aria-label="Poké-Keypad">
        <div class="pokenav-keypad-display pm-battle-keypad-screen pm-battle-num">${escapeHtml(s.typedInput || 'Enter answer…')}</div>
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button type="button" class="pokenav-keypad-btn pm-battle-num" data-key="${d}">${d}</button>`).join('')}
        <button type="button" class="pokenav-keypad-btn is-action" data-key="clear">Clear</button>
        <button type="button" class="pokenav-keypad-btn pm-battle-num" data-key="0">0</button>
        <button type="button" class="pokenav-keypad-btn is-action" data-key="back" aria-label="Backspace">⌫</button>
        ${isFraction ? '<button type="button" class="pokenav-keypad-btn is-action pm-battle-keypad-wide" data-key="/">Fraction bar ( / )</button>' : ''}
        <button type="button" class="btn-3d btn-primary pm-battle-keypad-wide" data-key="attack">
          Attack! ⚡
        </button>
      </div>
    `;

  return `
    <div class="pm-battle-problem-deck">
      <div class="pm-battle-problem-header">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="pm-battle-route-pill">${escapeHtml(moveBadge)}</span>
          <span class="pm-battle-stat-chip">${escapeHtml(formatSkillLabel(p))}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn-3d btn-sm" data-action="speak">
            🔊 Read Aloud
          </button>
          ${!s.isGym ? `
            <button type="button" class="btn-3d btn-sm" data-action="back-moves">
              ← Switch Move
            </button>
          ` : ''}
        </div>
      </div>

      <div>
        <p class="pm-battle-problem-prompt">${storyHeader}${escapeHtml(p.promptText)}</p>
        ${p.expression ? `<div class="pm-battle-problem-expr pm-battle-num">${escapeHtml(p.expression)}</div>` : ''}
      </div>

      <div class="pm-battle-solver-grid">
        <div>
          <div style="font-size:0.8rem;font-weight:800;color:#64748B;margin-bottom:6px;">
            Tap a Choice Tile
          </div>
          <div class="pokenav-choice-grid pm-battle-choices-grid ${isCmp ? 'is-cmp' : ''}">
            ${choicesHtml}
          </div>
        </div>
        ${keypadHtml}
      </div>
    </div>
  `;
}

function renderGymVictoryMarkup() {
  const s = stateSession;
  const r = s.gymVictoryRewards || {};
  const leader = s.gymLeader;
  const nextRoute = r.nextRouteId && ctx?.routesData?.getRouteById?.(r.nextRouteId);

  return `
    <div class="pm-battle-victory-card">
      <div class="pm-battle-victory-top">
        <div class="pm-battle-gym-crest">${getGymBadgeSvg(leader.badgeColor, leader.badgeSvgKey)}</div>
        <div>
          <div class="pm-battle-route-pill">GYM VICTORY!</div>
          <h3 style="margin:4px 0 2px;font-size:1.22rem;font-weight:900;">${escapeHtml(leader.badgeName)} Earned!</h3>
          <p style="margin:0;font-weight:700;color:#334155;">"${escapeHtml(leader.victoryQuote)}"</p>
        </div>
      </div>

      <div class="pm-battle-stats">
        <span class="pm-battle-stat-chip">🥚 Mystery Egg Received!</span>
        <span class="pm-battle-stat-chip">✨ Shiny Charm +${Math.round((r.shinyCharmBoost || 0.02) * 100)}%</span>
        <span class="pm-battle-stat-chip pm-battle-num">+${r.coins || 40} Coins • +${r.stardust || 25} Stardust</span>
        ${nextRoute ? `<span class="pm-battle-stat-chip">🗺️ Unlocked: ${escapeHtml(nextRoute.name)}!</span>` : ''}
      </div>

      <div class="pm-battle-victory-actions">
        ${nextRoute ? `
          <button type="button" class="btn-3d btn-success" data-action="next-route" data-route-id="${escapeHtml(nextRoute.id)}">
            Explore ${escapeHtml(nextRoute.name)} →
          </button>
        ` : ''}
        <button type="button" class="btn-3d btn-gold" data-action="go-camp">
          Hatch Mystery Egg in Camp 🥚
        </button>
        <button type="button" class="btn-3d" data-action="rematch-gym">
          Rematch Gym Leader
        </button>
      </div>
    </div>
  `;
}

function setRegion(name, html) {
  const el = container?.querySelector(`[data-battle-region="${name}"]`);
  if (el) el.innerHTML = html;
}

/**
 * Full render rebuilds the shell (and reloads sprites/backdrop). Pass keepArena to
 * refresh only the banner/controls regions and patch the arena in place.
 */
function render({ keepArena = false } = {}) {
  if (!mounted || !container || !stateSession) return;
  const s = stateSession;
  const route = s.route;
  const rp = s.profile?.routeProgress?.[route.id] || { stars: 0, solvedCount: 0 };
  const streak = s.profile?.sessionStreak || 0;
  const isCritReady = streak >= 4;
  const starsText = '★'.repeat(rp.stars || 0) + '☆'.repeat(3 - (rp.stars || 0));
  const isCatchReady = !s.isGym && s.wildHp <= Math.ceil(s.wildMaxHp * 0.35);

  let topBannerHtml = '';
  if (s.isGym) {
    const leader = s.gymLeader;
    topBannerHtml = `
      <div class="pm-battle-gym-header">
        <div class="pm-battle-gym-top">
          <div class="pm-battle-gym-leader-card">
            <div class="pm-battle-gym-crest">${getGymBadgeSvg(leader.badgeColor, leader.badgeSvgKey)}</div>
            <div>
              <div class="pm-battle-route-pill">GYM BOSS GAUNTLET • ${escapeHtml(leader.badgeName)}</div>
              <h2 class="pm-battle-route-name">${escapeHtml(leader.name)}</h2>
              <p class="pm-battle-route-sub">${escapeHtml(leader.title)} • ${escapeHtml(route.name)}</p>
            </div>
          </div>
          <div class="pm-battle-stats">
            <span class="pm-battle-stat-chip ${isCritReady ? 'is-crit' : ''}">🔥 Streak ${streak}</span>
            <button type="button" class="btn-3d btn-sm" data-action="back-wild">
              ← Wild Route
            </button>
          </div>
        </div>
        <p class="pm-battle-gym-quote">"${escapeHtml(s.gymWon ? leader.victoryQuote : leader.introQuote)}"</p>
        <div class="pm-battle-gym-phases">
          ${GYM_PHASES.map((ph, idx) => {
            const cls = s.gymWon || idx < s.phaseIdx ? 'is-done' : idx === s.phaseIdx ? 'is-active' : '';
            const stepProgress = s.gymWon || idx < s.phaseIdx
              ? '✓'
              : idx === s.phaseIdx
                ? `${s.phaseStep}/${ph.stepsRequired}`
                : `0/${ph.stepsRequired}`;
            return `<div class="pm-battle-phase-step ${cls}"><span>${escapeHtml(ph.label)}</span><span class="pm-battle-num">${stepProgress}</span></div>`;
          }).join('')}
        </div>
      </div>
    `;
  } else {
    topBannerHtml = `
      <div class="pm-battle-banner">
        <div>
          <div class="pm-battle-banner-title">
            <span class="pm-battle-route-pill">Route ${route.number}</span>
            <h2 class="pm-battle-route-name">${escapeHtml(route.name)}</h2>
          </div>
          <p class="pm-battle-route-sub">${escapeHtml(route.subtitle)}</p>
        </div>
        <div class="pm-battle-stats">
          <span class="pm-battle-stat-chip" title="Route Stars">${starsText}</span>
          <span class="pm-battle-stat-chip pm-battle-num">Solved: ${rp.solvedCount || 0}</span>
          <span class="pm-battle-stat-chip ${isCritReady ? 'is-crit' : ''}">
            ${isCritReady ? '⚡ CRITICAL READY' : `🔥 Streak ${streak}`}
          </span>
        </div>
      </div>
    `;
  }

  const catchCtaHtml = isCatchReady ? `
    <div class="pm-battle-catch-cta-bar">
      <div>
        <div style="font-weight:900;font-size:1rem;color:#991B1B;">
          ${s.wildHp <= 1 ? `${escapeHtml(s.wildPokemon.name)} hung on with 1 HP!` : `${escapeHtml(s.wildPokemon.name)} is weakened!`}
        </div>
        <div style="font-size:0.84rem;font-weight:700;color:#7F1D1D;">
          Throw a Poké Ball now for a boosted catch chance, or keep training!
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button type="button" class="btn-3d btn-primary pm-battle-btn-glow" data-action="throw-pokeball">
          Throw Poké Ball! →
        </button>
        <button type="button" class="btn-3d" data-action="next-encounter">
          Next Encounter
        </button>
      </div>
    </div>
  ` : '';


  let controlsHtml = '';
  if (s.isGym && s.gymWon) {
    controlsHtml = renderGymVictoryMarkup();
  } else if (s.activeProblem) {
    controlsHtml = renderProblemDeckMarkup();
  } else {
    controlsHtml = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <div style="font-weight:900;font-size:1rem;">Choose Your Buddy's Tactical Move</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" class="btn-3d btn-sm" data-action="next-encounter">
              🔄 Next Encounter
            </button>
            <button type="button" class="btn-3d btn-sm btn-gold" data-action="challenge-gym">
              🏆 Challenge Gym Leader
            </button>
          </div>
        </div>
        ${renderMoveCardsMarkup()}
      </div>
    `;
  }

  const existingRoot = container.querySelector('.pm-battle-root');
  if (keepArena && existingRoot && existingRoot.querySelector('[data-battle-region="arena"]')) {
    setRegion('banner', topBannerHtml);
    setRegion('catch', catchCtaHtml);
    setRegion('controls', controlsHtml);
    patchStatus();
    patchArena();
    return;
  }

  container.innerHTML = `
    <div class="pm-battle-root">
      <div class="pm-battle-region" data-battle-region="banner">${topBannerHtml}</div>
      <div class="pm-battle-region" data-battle-region="arena">${renderArenaMarkup()}</div>
      <div class="pm-battle-region" data-battle-region="catch">${catchCtaHtml}</div>
      <div class="${statusClassName(s.statusVariant)}" data-battle-region="status" aria-live="polite">${statusInnerHtml(s)}</div>
      <div class="pm-battle-region" data-battle-region="controls">${controlsHtml}</div>
    </div>
  `;

  // Mount parallax biome backdrop and live Pokémon visuals
  const arenaBg = container.querySelector('.pm-battle-arena-bg');
  if (arenaBg) {
    ctx.vfx?.mountBiomeBackdrop?.(arenaBg, route.biomeKey);
  }
  const buddySlot = container.querySelector('[data-slot="buddy"]');
  const wildSlot = container.querySelector('[data-slot="wild"]');
  renderPokemonVisualSlot(buddySlot, s.buddyPokemon, {
    shiny: s.buddyShiny,
    size: 124,
    accessories: s.profile?.equippedAccessories || [],
    animate: true,
  });
  renderPokemonVisualSlot(wildSlot, s.wildPokemon, {
    shiny: s.isShiny,
    size: 122,
    animate: true,
  });
}

function nudgeEmptyInput(message) {
  if (!stateSession) return;
  ctx.audio?.playGentleNudge?.();
  stateSession.statusMessage = message;
  stateSession.statusVariant = 'nudge';
  patchStatus();
  replayClass(container?.querySelector('.pm-battle-keypad-screen'), 'pokenav-graze');
}

function typeKeypadChar(ch) {
  const s = stateSession;
  if (!s) return false;
  if (ch === '/') {
    if (!isFractionProblem(s.activeProblem) || !s.typedInput || s.typedInput.includes('/')) return false;
  }
  if (s.typedInput.length >= 8) return false;
  s.typedInput += ch;
  updateKeypadScreen();
  return true;
}

function onContainerClick(e) {
  if (!container || !stateSession) return;
  const target = e.target?.closest?.('[data-move-key], [data-choice-val], [data-key], [data-action]');
  if (!target || !container.contains(target)) return;

  const moveKey = target.getAttribute('data-move-key');
  if (moveKey) {
    selectWildMove(moveKey);
    return;
  }

  const choiceVal = target.getAttribute('data-choice-val');
  if (choiceVal !== null) {
    submitAnswer(choiceVal);
    return;
  }

  const k = target.getAttribute('data-key');
  if (k) {
    if (!stateSession.awaitingAnswer || stateSession.animating) return;
    ctx.audio?.unlockAudio?.();
    if (k === 'clear') {
      ctx.audio?.playClick?.('cancel');
      stateSession.typedInput = '';
      updateKeypadScreen();
    } else if (k === 'back') {
      ctx.audio?.playClick?.('tap');
      stateSession.typedInput = stateSession.typedInput.slice(0, -1);
      updateKeypadScreen();
    } else if (k === 'attack') {
      if (stateSession.typedInput.length > 0) {
        submitAnswer(stateSession.typedInput);
      } else {
        nudgeEmptyInput('Enter digits on the Poké-Keypad or tap a Choice Tile!');
      }
    } else {
      ctx.audio?.playClick?.('tap');
      typeKeypadChar(k);
    }
    return;
  }

  const action = target.getAttribute('data-action');
  switch (action) {
    case 'speak': {
      const p = stateSession.activeProblem;
      if (p) ctx.audio?.speakText?.(p.spokenPrompt || p.promptText, true);
      break;
    }
    case 'back-moves':
      if (stateSession.animating) return;
      ctx.audio?.playClick?.('tap');
      stateSession.selectedMoveKey = null;
      stateSession.activeProblem = null;
      stateSession.awaitingAnswer = false;
      stateSession.typedInput = '';
      render({ keepArena: true });
      break;
    case 'throw-pokeball':
      ctx.audio?.playClick?.('select');
      ctx.onNavigate?.('catch', {
        routeId: stateSession.route.id,
        encounterPokemonId: stateSession.wildPokemon.id,
        shiny: stateSession.isShiny,
        weakened: true,
      });
      break;
    case 'next-encounter':
      ctx.audio?.playClick?.('tap');
      startWildSession(true);
      render();
      break;
    case 'challenge-gym':
      ctx.audio?.playClick?.('select');
      ctx.onNavigate?.('gym', { mode: 'gym', routeId: stateSession.route.id });
      break;
    case 'back-wild':
      ctx.audio?.playClick?.('tap');
      ctx.onNavigate?.('battle', { mode: 'battle', routeId: stateSession.route.id });
      break;
    case 'rematch-gym':
      ctx.audio?.playClick?.('select');
      startGymSession();
      syncRotomToProblem(stateSession.activeProblem);
      render();
      onNewProblem(stateSession.activeProblem);
      break;
    case 'next-route':
      ctx.audio?.playClick?.('select');
      ctx.onNavigate?.('battle', { mode: 'battle', routeId: target.getAttribute('data-route-id') });
      break;
    case 'go-camp':
      ctx.audio?.playClick?.('select');
      ctx.onNavigate?.('camp', { tab: 'camp' });
      break;
    default:
      break;
  }
}

function updateKeypadScreen() {
  const screen = container?.querySelector('.pm-battle-keypad-screen');
  if (screen && stateSession) {
    screen.textContent = stateSession.typedInput || 'Enter answer…';
  }
}

export function mount(containerEl, context) {
  unmount();
  if (!containerEl || !context) return;

  mounted = true;
  sessionToken += 1;
  container = containerEl;
  ctx = context;

  injectBattleStyles();
  clickHandler = onContainerClick;
  container.addEventListener('click', clickHandler);

  const isGym = ctx.modeParams?.mode === 'gym';
  if (isGym) {
    startGymSession();
    syncRotomToProblem(stateSession.activeProblem);
    render();
    onNewProblem(stateSession.activeProblem);
  } else {
    startWildSession(false);
    const defaultMove = stateSession.moveSet?.power || stateSession.moveSet?.quick;
    if (defaultMove) {
      const hintBundle = ctx.hintEngine?.buildHintBundle?.(defaultMove) || null;
      ctx.rotomPane?.setProblem?.(defaultMove, hintBundle);
      ctx.rotomPane?.setMood?.('curious', 'Pick Quick, Power, or Charge move to battle!');
    }
    render();
  }
}

export function unmount() {
  mounted = false;
  sessionToken += 1;
  clearAllTimers();
  if (container) {
    if (clickHandler) container.removeEventListener('click', clickHandler);
    container.innerHTML = '';
  }
  clickHandler = null;
  removeBattleStyles();
  container = null;
  ctx = null;
  stateSession = null;
}

export function handleKey(event) {
  if (!mounted || !stateSession || !event) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;

  const targetTag = event.target?.tagName;
  if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') {
    return false;
  }

  const key = event.key;

  // Move selection shortcuts when on Wild Move Cards screen
  if (!stateSession.isGym && !stateSession.activeProblem && !stateSession.animating) {
    if (key === '1') {
      selectWildMove('quick');
      return true;
    }
    if (key === '2') {
      selectWildMove('power');
      return true;
    }
    if (key === '3') {
      selectWildMove('charge');
      return true;
    }
    return false;
  }

  if (!stateSession.awaitingAnswer || stateSession.animating || !stateSession.activeProblem) {
    return false;
  }

  const problem = stateSession.activeProblem;

  if (problem.format === 'comparison') {
    if (key === '<' || key === '=' || key === '>') {
      submitAnswer(key);
      return true;
    }
    return false;
  }

  if (key >= '0' && key <= '9' && key.length === 1) {
    ctx?.audio?.unlockAudio?.();
    ctx?.audio?.playClick?.('tap');
    typeKeypadChar(key);
    return true;
  }

  if (key === '/' && isFractionProblem(problem)) {
    event.preventDefault?.();
    ctx?.audio?.unlockAudio?.();
    if (typeKeypadChar('/')) ctx?.audio?.playClick?.('tap');
    else ctx?.audio?.playGentleNudge?.();
    return true;
  }

  if (key === 'Backspace') {
    ctx?.audio?.playClick?.('tap');
    stateSession.typedInput = stateSession.typedInput.slice(0, -1);
    updateKeypadScreen();
    return true;
  }

  if (key === 'Enter') {
    if (stateSession.typedInput.length > 0) {
      submitAnswer(stateSession.typedInput);
    } else {
      nudgeEmptyInput('Type digits first or click one of the Choice Tiles!');
    }
    return true;
  }

  return false;
}
