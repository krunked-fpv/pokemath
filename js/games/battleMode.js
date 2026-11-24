/**
 * PokéMath Mode 1 (Wild Encounter Battle) & Mode 5 (Gym Leader Boss Gauntlet)
 * Exports uniform controller interface: { mount, unmount, handleKey }
 */

const STYLE_ELEMENT_ID = 'pm-battle-mode-styles';
const SPEED_BLITZ_MS = 15000;

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

const activeTimeouts = new Set();
const activeIntervals = new Set();

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

function trackInterval(fn, intervalMs) {
  const token = sessionToken;
  const id = setInterval(() => {
    if (!mounted || token !== sessionToken) {
      clearInterval(id);
      activeIntervals.delete(id);
      return;
    }
    fn();
  }, intervalMs);
  activeIntervals.add(id);
  return id;
}

function clearAllTimers() {
  for (const id of activeTimeouts) clearTimeout(id);
  activeTimeouts.clear();
  for (const id of activeIntervals) clearInterval(id);
  activeIntervals.clear();
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
    .pm-battle-root .pm-num {
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
    .pm-stat-chip {
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
    .pm-stat-chip.is-crit {
      background: linear-gradient(135deg, #FEF3C7, #FDE68A);
      border-color: #D97706;
      color: #92400E;
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.35);
    }
    .pm-gym-header {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 14px 16px;
      background: linear-gradient(135deg, #FFFFFF, #FFF7E6);
      border: 2px solid #F59E0B;
      border-radius: 18px;
      box-shadow: 0 6px 18px rgba(245, 158, 11, 0.14);
    }
    .pm-gym-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .pm-gym-leader-card {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .pm-gym-crest {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      background: #FFF9F0;
      border: 2px solid #E2D5BE;
      flex-shrink: 0;
    }
    .pm-gym-quote {
      margin: 0;
      padding: 8px 12px;
      border-radius: 12px;
      background: #FFF9F0;
      border-left: 4px solid var(--poke-red, #E3350D);
      font-size: 0.9rem;
      font-weight: 700;
      color: #334155;
    }
    .pm-gym-phases {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .pm-phase-step {
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
    .pm-phase-step.is-active {
      background: #FEF3C7;
      border-color: #F59E0B;
      color: #92400E;
    }
    .pm-phase-step.is-done {
      background: #DCFCE7;
      border-color: #22C55E;
      color: #166534;
    }
    .pm-arena {
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
    .pm-arena-bg {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }
    .pm-arena-grid {
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      align-items: center;
    }
    .pm-fighter {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .pm-fighter.is-opponent {
      align-items: flex-end;
    }
    .pm-fighter.is-buddy {
      align-items: flex-start;
    }
    .pm-hud-card {
      width: 100%;
      max-width: 270px;
      background: rgba(255, 255, 255, 0.93);
      backdrop-filter: blur(6px);
      border: 2px solid #E2D5BE;
      border-radius: 16px;
      padding: 10px 12px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
    }
    .pm-hud-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      margin-bottom: 6px;
    }
    .pm-hud-name {
      font-weight: 900;
      font-size: 0.96rem;
      color: #0F172A;
      display: flex;
      align-items: center;
      gap: 5px;
      flex-wrap: wrap;
    }
    .pm-type-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      color: #FFFFFF;
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .pm-shiny-tag {
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
    .pm-hp-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.78rem;
      font-weight: 800;
      color: #475569;
      margin-bottom: 4px;
    }
    .pm-hp-track {
      width: 100%;
      height: 13px;
      border-radius: 999px;
      background: #E2E8F0;
      border: 1.5px solid #CBD5E1;
      overflow: hidden;
    }
    .pm-hp-fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, #22C55E, #4ADE80);
      transition: width 320ms cubic-bezier(0.22, 1, 0.36, 1), background-color 240ms ease;
    }
    .pm-hp-fill.is-mid {
      background: linear-gradient(90deg, #F59E0B, #FBBF24);
    }
    .pm-hp-fill.is-low {
      background: linear-gradient(90deg, #EF4444, #F87171);
    }
    .pm-sprite-stage {
      position: relative;
      min-height: 130px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      max-width: 240px;
    }
    .pm-platform-shadow {
      position: absolute;
      bottom: 6px;
      width: 130px;
      height: 24px;
      border-radius: 50%;
      background: radial-gradient(ellipse at center, rgba(15, 23, 42, 0.22), rgba(15, 23, 42, 0));
      z-index: 0;
    }
    .pm-sprite-wrap {
      position: relative;
      z-index: 1;
      transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .pm-sprite-wrap.is-lunging {
      transform: translate3d(26px, -10px, 0) scale(1.08);
    }
    .pm-sprite-wrap.is-hit {
      animation: pm-battle-hit 420ms ease;
    }
    .pm-catch-ready-pill {
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
    .pm-impact-bar-wrap {
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
    .pm-impact-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 0.84rem;
      font-weight: 800;
      color: #1E293B;
    }
    .pm-impact-track {
      height: 10px;
      border-radius: 999px;
      background: #E2E8F0;
      overflow: hidden;
    }
    .pm-impact-fill {
      height: 100%;
      width: 0%;
      border-radius: 999px;
      background: linear-gradient(90deg, #3B4CCA, #E3350D, #FFCB05);
      transition: width 360ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .pm-catch-cta-bar {
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
      transition: transform 120ms ease, filter 120ms ease;
      user-select: none;
    }
    .pm-btn-3d:hover {
      filter: brightness(1.03);
      transform: translateY(-1px);
    }
    .pm-btn-3d:active {
      transform: translateY(2px);
      border-bottom-width: 2px;
    }
    .pm-btn-primary {
      background: linear-gradient(180deg, #EF4444, #E3350D);
      border-color: #991B1B;
      color: #FFFFFF;
    }
    .pm-btn-gold {
      background: linear-gradient(180deg, #FDE047, #F59E0B);
      border-color: #92400E;
      color: #451A03;
    }
    .pm-btn-indigo {
      background: linear-gradient(180deg, #4F46E5, #3B4CCA);
      border-color: #1E1B4B;
      color: #FFFFFF;
    }
    .pm-btn-emerald {
      background: linear-gradient(180deg, #22C55E, #16A34A);
      border-color: #14532D;
      color: #FFFFFF;
    }
    .pm-btn-glow {
      animation: pm-battle-pulse 1.3s ease-in-out infinite;
    }
    .pm-moves-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .pm-move-card {
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
    .pm-move-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.10);
    }
    .pm-move-card:active {
      transform: translateY(2px);
      border-bottom-width: 3px;
    }
    .pm-move-card.is-charge-crit {
      border-color: #D97706;
      background: linear-gradient(135deg, #FFFBEB, #FEF3C7);
      box-shadow: 0 0 18px rgba(245, 158, 11, 0.25);
    }
    .pm-move-name {
      font-size: 1.04rem;
      font-weight: 900;
    }
    .pm-move-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      font-size: 0.78rem;
      font-weight: 800;
      color: #475569;
    }
    .pm-problem-deck {
      background: var(--bg-card, #FFFFFF);
      border: 2.5px solid var(--border-warm, #DFD3BC);
      border-radius: 20px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: 0 8px 22px rgba(30, 41, 59, 0.08);
    }
    .pm-problem-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pm-problem-prompt {
      font-size: 1.24rem;
      font-weight: 900;
      color: #0F172A;
      margin: 0;
      line-height: 1.35;
    }
    .pm-problem-expr {
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
    .pm-blitz-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .pm-blitz-track {
      height: 8px;
      border-radius: 999px;
      background: #E2E8F0;
      overflow: hidden;
    }
    .pm-blitz-fill {
      height: 100%;
      background: linear-gradient(90deg, #22C55E, #F59E0B);
      transition: width 180ms linear;
    }
    .pm-solver-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 14px;
      align-items: start;
    }
    .pm-choices-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .pm-choices-grid.is-cmp {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .pm-choice-tile {
      min-height: 62px;
      padding: 12px;
      border-radius: 16px;
      border: 2.5px solid #CBD5E1;
      border-bottom-width: 6px;
      background: #FFFDF9;
      font-family: inherit;
      font-size: 1.35rem;
      font-weight: 900;
      color: #0F172A;
      cursor: pointer;
      transition: transform 110ms ease, border-color 110ms ease, background-color 110ms ease;
    }
    .pm-choice-tile:hover {
      border-color: #3B4CCA;
      background: #EEF2FF;
      transform: translateY(-1px);
    }
    .pm-choice-tile:active {
      transform: translateY(2px);
      border-bottom-width: 2px;
    }
    .pm-choice-tile.is-nudged {
      border-color: #F59E0B;
      background: #FEF3C7;
      animation: pm-battle-wobble 320ms ease;
    }
    .pm-keypad {
      background: #F8FAFC;
      border: 2px solid #CBD5E1;
      border-radius: 18px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .pm-keypad-screen {
      min-height: 48px;
      padding: 8px 14px;
      border-radius: 12px;
      background: #0F172A;
      color: #F8FAFC;
      font-size: 1.45rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      letter-spacing: 0.04em;
    }
    .pm-keypad-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .pm-key-btn {
      min-height: 52px;
      border-radius: 12px;
      border: 2px solid #CBD5E1;
      border-bottom-width: 4px;
      background: #FFFFFF;
      font-family: inherit;
      font-size: 1.15rem;
      font-weight: 900;
      color: #1E293B;
      cursor: pointer;
    }
    .pm-key-btn:active {
      transform: translateY(2px);
      border-bottom-width: 2px;
    }
    .pm-key-btn.is-action {
      background: #F1F5F9;
      font-size: 0.92rem;
    }
    .pm-victory-card {
      padding: 20px;
      border-radius: 22px;
      background: linear-gradient(135deg, #FEF9C3, #FFFBEB 45%, #ECFDF5);
      border: 3px solid #F59E0B;
      box-shadow: 0 12px 28px rgba(245, 158, 11, 0.22);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .pm-victory-top {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .pm-victory-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
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
    @keyframes pm-battle-hit {
      0%, 100% { transform: translate3d(0, 0, 0); }
      25% { transform: translate3d(-10px, -4px, 0); }
      55% { transform: translate3d(10px, 3px, 0); }
      80% { transform: translate3d(-5px, 0, 0); }
    }
    @keyframes pm-battle-wobble {
      0%, 100% { transform: translate3d(0, 0, 0); }
      30% { transform: translate3d(-6px, 0, 0); }
      65% { transform: translate3d(6px, 0, 0); }
    }
    @keyframes pm-battle-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.03); }
    }
    @media (max-width: 780px) {
      .pm-moves-grid {
        grid-template-columns: 1fr;
      }
      .pm-solver-grid {
        grid-template-columns: 1fr;
      }
      .pm-gym-phases {
        grid-template-columns: 1fr;
      }
      .pm-arena-grid {
        gap: 8px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .pm-sprite-wrap.is-hit,
      .pm-choice-tile.is-nudged,
      .pm-catch-ready-pill,
      .pm-btn-glow {
        animation: none !important;
      }
      .pm-hp-fill,
      .pm-impact-fill,
      .pm-sprite-wrap,
      .pm-btn-3d {
        transition: none !important;
      }
    }
    [data-reduced-motion="true"] .pm-sprite-wrap.is-hit,
    [data-reduced-motion="true"] .pm-choice-tile.is-nudged,
    [data-reduced-motion="true"] .pm-catch-ready-pill,
    [data-reduced-motion="true"] .pm-btn-glow {
      animation: none !important;
    }
    [data-reduced-motion="true"] .pm-hp-fill,
    [data-reduced-motion="true"] .pm-impact-fill,
    [data-reduced-motion="true"] .pm-sprite-wrap,
    [data-reduced-motion="true"] .pm-btn-3d {
      transition: none !important;
    }
  `;
  document.head.appendChild(style);
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

function stopSpeedBlitzTimer() {
  for (const id of activeIntervals) {
    clearInterval(id);
  }
  activeIntervals.clear();
  if (stateSession) {
    stateSession.blitzRemainingMs = 0;
    stateSession.blitzBonusActive = false;
  }
}

function startSpeedBlitzIfEnabled(profile) {
  stopSpeedBlitzTimer();
  if (!profile?.settings?.speedBlitz || !stateSession?.activeProblem) return;
  stateSession.blitzRemainingMs = SPEED_BLITZ_MS;
  stateSession.blitzBonusActive = true;
  trackInterval(() => {
    if (!stateSession || !stateSession.awaitingAnswer) {
      stopSpeedBlitzTimer();
      return;
    }
    stateSession.blitzRemainingMs = Math.max(0, stateSession.blitzRemainingMs - 200);
    const fillEl = container?.querySelector('.pm-blitz-fill');
    const labelEl = container?.querySelector('.pm-blitz-label');
    if (fillEl) {
      const pct = Math.round((stateSession.blitzRemainingMs / SPEED_BLITZ_MS) * 100);
      fillEl.style.width = `${pct}%`;
    }
    if (stateSession.blitzRemainingMs <= 0) {
      stateSession.blitzBonusActive = false;
      if (labelEl) {
        labelEl.textContent = 'Speed Blitz window ended — take your time, full attack still ready!';
      }
      stopSpeedBlitzTimer();
    } else if (labelEl) {
      labelEl.textContent = `Speed Blitz Bonus: ${Math.ceil(stateSession.blitzRemainingMs / 1000)}s (+2 Coins)`;
    }
  }, 200);
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
    blitzRemainingMs: 0,
    blitzBonusActive: false,
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
    blitzRemainingMs: 0,
    blitzBonusActive: false,
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
  render();
  startSpeedBlitzIfEnabled(stateSession.profile);
}

function getArenaEl() {
  return container?.querySelector('.pm-arena') || null;
}

function triggerVisualAttack(buddyType, moveKey, damageText, isCrit) {
  const arenaEl = getArenaEl();
  const buddySprite = container?.querySelector('.pm-fighter.is-buddy .pm-sprite-wrap');
  const wildSprite = container?.querySelector('.pm-fighter.is-opponent .pm-sprite-wrap');

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
    const arenaEl = getArenaEl();
    if (arenaEl) {
      ctx.vfx?.spawnFloatingText?.(arenaEl, 'Graze! Try again!', 'nudge');
    }
    if (adaptiveRes?.autoOpenHintTier >= 1) {
      ctx.rotomPane?.openHintTier?.(adaptiveRes.autoOpenHintTier);
    }
    ctx.rotomPane?.setMood?.('encouraging', adaptiveRes?.encouragementMessage || 'Take another calm look!');
    ctx.rotomPane?.updateMetrics?.({
      streak: 0,
      consecutiveMisses: adaptiveRes?.consecutiveMisses || 1,
      shinyRollBonus: 0,
      chargePercent: 0,
    });
    ctx.rotomPane?.render?.(stateSession.profile);

    render();
    return;
  }

  // Correct answer!
  stateSession.awaitingAnswer = false;
  stateSession.animating = true;
  const hadBlitzBonus = Boolean(stateSession.blitzBonusActive);
  stopSpeedBlitzTimer();

  if (!stateSession.isGym) {
    handleWildCorrect(problem, hintsUsed, buddyType, hadBlitzBonus);
  } else {
    handleGymCorrect(problem, hintsUsed, buddyType, hadBlitzBonus);
  }
}

function handleWildCorrect(problem, hintsUsed, buddyType, hadBlitzBonus) {
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
  const coinGain = meta.coins + (hadBlitzBonus ? 2 : 0) + (isNewBattleWin ? 10 : 0);
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
  ctx.rotomPane?.updateMetrics?.({
    streak: adaptiveRes?.streak || 1,
    consecutiveMisses: 0,
    shinyRollBonus: adaptiveRes?.shinyRollBonus || 0,
    chargePercent: stateSession.profile?.evolutionMeter || 0,
    triggerCriticalChallenge: Boolean(adaptiveRes?.triggerCriticalChallenge),
  });
  ctx.rotomPane?.render?.(stateSession.profile);

  render();
  triggerVisualAttack(buddyType, moveKey, isCrit ? `CRIT -${damage}!` : `-${damage} HP`, isCrit);
  const arenaEl = getArenaEl();
  if (arenaEl) {
    ctx.vfx?.spawnFloatingText?.(arenaEl, `+${xpGain} XP  +${coinGain}c`, 'xp');
  }

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
    render();
  }, 850);
}

function handleGymCorrect(problem, hintsUsed, buddyType, hadBlitzBonus) {
  const phaseIdx = stateSession.phaseIdx;
  const phase = GYM_PHASES[phaseIdx];
  const nextStep = stateSession.phaseStep + 1;
  const phaseCompleted = nextStep >= phase.stepsRequired;
  const isFinalPhaseVictory = phaseCompleted && phaseIdx >= GYM_PHASES.length - 1;

  const xpGain = phase.xpPerHit + (isFinalPhaseVictory ? 35 : 0);
  const meterGain = phase.meterPerHit + (isFinalPhaseVictory ? 20 : 0);
  const coinGain = phase.coinsPerHit + (hadBlitzBonus ? 2 : 0) + (isFinalPhaseVictory ? 40 : 0);
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
  ctx.rotomPane?.updateMetrics?.({
    streak: adaptiveRes?.streak || 1,
    consecutiveMisses: 0,
    shinyRollBonus: adaptiveRes?.shinyRollBonus || 0,
    chargePercent: stateSession.profile?.evolutionMeter || 0,
    triggerCriticalChallenge: Boolean(adaptiveRes?.triggerCriticalChallenge),
  });
  ctx.rotomPane?.render?.(stateSession.profile);

  render();
  triggerVisualAttack(buddyType, phaseIdx === 2 ? 'charge' : 'power', isFinalPhaseVictory ? 'FINISHER!' : `HIT!`, phaseIdx === 2);

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
      const arenaEl = getArenaEl();
      if (arenaEl) ctx.vfx?.burstConfetti?.(arenaEl);
      ctx.shell?.showToast?.(`Earned ${stateSession.gymLeader.badgeName} + Mystery Egg!`, 'success');
      render();
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
    render();
    startSpeedBlitzIfEnabled(stateSession.profile);
  }, 850);
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
    <div class="pm-arena" aria-live="polite">
      <div class="pm-arena-bg"></div>
      <div class="pm-arena-grid">
        <div class="pm-fighter is-buddy">
          <div class="pm-hud-card">
            <div class="pm-hud-top">
              <div class="pm-hud-name">
                <span>${escapeHtml(s.buddyPokemon.name)}</span>
                <span class="pm-type-badge" style="background:${getTypeColor(buddyType)}">${escapeHtml(buddyType)}</span>
              </div>
              <span class="pm-num" style="font-weight:800;font-size:0.82rem;color:#334155;">Lv.${s.profile?.buddyLevel || 1}</span>
            </div>
            <div class="pm-hp-row">
              <span>Buddy HP</span>
              <span class="pm-num">${s.buddyHp} / ${s.buddyMaxHp}</span>
            </div>
            <div class="pm-hp-track">
              <div class="pm-hp-fill ${buddyHpInfo.cls}" style="width:${buddyHpInfo.pct}%"></div>
            </div>
          </div>
          <div class="pm-sprite-stage">
            <div class="pm-platform-shadow"></div>
            <div class="pm-sprite-wrap" data-slot="buddy"></div>
          </div>
        </div>

        <div class="pm-fighter is-opponent">
          <div class="pm-hud-card">
            <div class="pm-hud-top">
              <div class="pm-hud-name">
                <span>${escapeHtml(s.wildPokemon.name)}</span>
                ${s.isShiny ? '<span class="pm-shiny-tag">✨ SHINY</span>' : ''}
                <span class="pm-type-badge" style="background:${getTypeColor(wildType)}">${escapeHtml(wildType)}</span>
              </div>
              <span style="font-weight:800;font-size:0.78rem;color:#475569;">${s.isGym ? 'Gym Ace' : 'Wild'}</span>
            </div>
            <div class="pm-hp-row">
              <span>${s.isGym ? 'Phase HP' : 'Wild HP'}</span>
              <span class="pm-num">${s.wildHp} / ${s.wildMaxHp}</span>
            </div>
            <div class="pm-hp-track">
              <div class="pm-hp-fill ${wildHpInfo.cls}" style="width:${wildHpInfo.pct}%"></div>
            </div>
            ${isCatchReady ? '<div class="pm-catch-ready-pill">Weakened! Ready for Poké Ball!</div>' : ''}
          </div>
          <div class="pm-sprite-stage">
            <div class="pm-platform-shadow"></div>
            <div class="pm-sprite-wrap" data-slot="wild"></div>
          </div>
        </div>
      </div>

      <div class="pm-impact-bar-wrap">
        <div class="pm-impact-head">
          <span>${escapeHtml(s.impactLabel)}</span>
          <span class="pm-num">${s.impactPercent}%</span>
        </div>
        <div class="pm-impact-track">
          <div class="pm-impact-fill" style="width:${s.impactPercent}%"></div>
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
    <div class="pm-moves-grid">
      ${keys.map((key) => {
        const meta = MOVE_META[key];
        const moveName = moveNames[key] || meta.label;
        const estDmg = Math.max(12, Math.round(s.wildMaxHp * meta.dmgRatio));
        const isCritHighlight = key === 'charge' && s.adaptiveConfig?.criticalChallenge;
        return `
          <button type="button" class="pm-move-card ${isCritHighlight ? 'is-charge-crit' : ''}" data-move-key="${key}">
            <div class="pm-move-meta">
              <span class="pm-type-badge" style="background:${buddyColor}">${escapeHtml(buddyType)} • ${meta.tag}</span>
              <span class="pm-num">[${meta.keyHint}]</span>
            </div>
            <div class="pm-move-name">${escapeHtml(moveName)}</div>
            <div class="pm-move-meta">
              <span class="pm-num">~${estDmg} DMG</span>
              <span class="pm-num">+${meta.xp} XP • +${meta.coins}c</span>
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
  const isFraction = p.format === 'fraction';
  const showSpeedBlitz = Boolean(s.profile?.settings?.speedBlitz && s.blitzRemainingMs > 0);
  const moveBadge = s.isGym
    ? GYM_PHASES[s.phaseIdx].label
    : `${s.buddyPokemon?.moveNames?.[s.selectedMoveKey] || 'Move'} (${MOVE_META[s.selectedMoveKey]?.tag || 'Math'})`;

  const storyHeader = p.meta?.storyEmoji
    ? `<span style="font-size:1.15rem;margin-right:6px;">${escapeHtml(p.meta.storyEmoji)}</span>`
    : '';

  const choicesHtml = (p.choices || []).map((choice) => {
    const valStr = String(choice);
    const nudged = s.nudgedChoices.has(valStr) ? 'is-nudged' : '';
    return `<button type="button" class="pm-choice-tile pm-num ${nudged}" data-choice-val="${escapeHtml(valStr)}">${escapeHtml(valStr)}</button>`;
  }).join('');

  const keypadHtml = isCmp
    ? `
      <div class="pm-keypad">
        <div style="font-size:0.84rem;font-weight:800;color:#475569;">Keyboard Shortcuts</div>
        <div style="font-size:0.9rem;font-weight:700;color:#1E293B;">Press <strong>&lt;</strong>, <strong>=</strong>, or <strong>&gt;</strong> on your keyboard, or tap a symbol tile!</div>
      </div>
    `
    : `
      <div class="pm-keypad" aria-label="Poké-Keypad">
        <div class="pm-keypad-screen pm-num">${escapeHtml(s.typedInput || 'Enter answer…')}</div>
        <div class="pm-keypad-grid">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button type="button" class="pm-key-btn pm-num" data-key="${d}">${d}</button>`).join('')}
          <button type="button" class="pm-key-btn is-action" data-key="clear">Clear</button>
          <button type="button" class="pm-key-btn pm-num" data-key="0">0</button>
          <button type="button" class="pm-key-btn is-action" data-key="back">⌫</button>
        </div>
        ${isFraction ? '<button type="button" class="pm-key-btn is-action" data-key="/">Slash ( / )</button>' : ''}
        <button type="button" class="pm-btn-3d pm-btn-primary" data-key="attack" style="width:100%;">
          Attack! ⚡
        </button>
      </div>
    `;

  return `
    <div class="pm-problem-deck">
      <div class="pm-problem-header">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="pm-battle-route-pill">${escapeHtml(moveBadge)}</span>
          <span class="pm-stat-chip">${escapeHtml(p.skillTag || p.operation)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <button type="button" class="pm-btn-3d" data-action="speak" style="min-height:42px;padding:6px 12px;font-size:0.85rem;">
            🔊 Read Aloud
          </button>
          ${!s.isGym ? `
            <button type="button" class="pm-btn-3d" data-action="back-moves" style="min-height:42px;padding:6px 12px;font-size:0.85rem;">
              ← Switch Move
            </button>
          ` : ''}
        </div>
      </div>

      ${showSpeedBlitz ? `
        <div class="pm-blitz-wrap">
          <div class="pm-blitz-label pm-num" style="font-size:0.78rem;font-weight:800;color:#B45309;">
            Speed Blitz Bonus: ${Math.ceil(s.blitzRemainingMs / 1000)}s (+2 Coins)
          </div>
          <div class="pm-blitz-track">
            <div class="pm-blitz-fill" style="width:${Math.round((s.blitzRemainingMs / SPEED_BLITZ_MS) * 100)}%"></div>
          </div>
        </div>
      ` : ''}

      <div>
        <p class="pm-problem-prompt">${storyHeader}${escapeHtml(p.promptText)}</p>
        ${p.expression ? `<div class="pm-problem-expr pm-num">${escapeHtml(p.expression)}</div>` : ''}
      </div>

      <div class="pm-solver-grid">
        <div>
          <div style="font-size:0.8rem;font-weight:800;color:#64748B;margin-bottom:6px;">
            Tap a Choice Tile
          </div>
          <div class="pm-choices-grid ${isCmp ? 'is-cmp' : ''}">
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
    <div class="pm-victory-card">
      <div class="pm-victory-top">
        <div class="pm-gym-crest">${getGymBadgeSvg(leader.badgeColor, leader.badgeSvgKey)}</div>
        <div>
          <div class="pm-battle-route-pill">GYM VICTORY!</div>
          <h3 style="margin:4px 0 2px;font-size:1.22rem;font-weight:900;">${escapeHtml(leader.badgeName)} Earned!</h3>
          <p style="margin:0;font-weight:700;color:#334155;">"${escapeHtml(leader.victoryQuote)}"</p>
        </div>
      </div>

      <div class="pm-battle-stats">
        <span class="pm-stat-chip">🥚 Mystery Egg Received!</span>
        <span class="pm-stat-chip">✨ Shiny Charm +${Math.round((r.shinyCharmBoost || 0.02) * 100)}%</span>
        <span class="pm-stat-chip pm-num">+${r.coins || 40} Coins • +${r.stardust || 25} Stardust</span>
        ${nextRoute ? `<span class="pm-stat-chip">🗺️ Unlocked: ${escapeHtml(nextRoute.name)}!</span>` : ''}
      </div>

      <div class="pm-victory-actions">
        ${nextRoute ? `
          <button type="button" class="pm-btn-3d pm-btn-emerald" data-action="next-route" data-route-id="${escapeHtml(nextRoute.id)}">
            Explore ${escapeHtml(nextRoute.name)} →
          </button>
        ` : ''}
        <button type="button" class="pm-btn-3d pm-btn-gold" data-action="go-camp">
          Hatch Mystery Egg in Camp 🥚
        </button>
        <button type="button" class="pm-btn-3d" data-action="rematch-gym">
          Rematch Gym Leader
        </button>
      </div>
    </div>
  `;
}

function render() {
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
      <div class="pm-gym-header">
        <div class="pm-gym-top">
          <div class="pm-gym-leader-card">
            <div class="pm-gym-crest">${getGymBadgeSvg(leader.badgeColor, leader.badgeSvgKey)}</div>
            <div>
              <div class="pm-battle-route-pill">GYM BOSS GAUNTLET • ${escapeHtml(leader.badgeName)}</div>
              <h2 class="pm-battle-route-name">${escapeHtml(leader.name)}</h2>
              <p class="pm-battle-route-sub">${escapeHtml(leader.title)} • ${escapeHtml(route.name)}</p>
            </div>
          </div>
          <div class="pm-battle-stats">
            <span class="pm-stat-chip ${isCritReady ? 'is-crit' : ''}">🔥 Streak ${streak}</span>
            <button type="button" class="pm-btn-3d" data-action="back-wild" style="min-height:42px;padding:6px 12px;font-size:0.84rem;">
              ← Wild Route
            </button>
          </div>
        </div>
        <p class="pm-gym-quote">"${escapeHtml(s.gymWon ? leader.victoryQuote : leader.introQuote)}"</p>
        <div class="pm-gym-phases">
          ${GYM_PHASES.map((ph, idx) => {
            const cls = s.gymWon || idx < s.phaseIdx ? 'is-done' : idx === s.phaseIdx ? 'is-active' : '';
            const stepProgress = s.gymWon || idx < s.phaseIdx
              ? '✓'
              : idx === s.phaseIdx
                ? `${s.phaseStep}/${ph.stepsRequired}`
                : `0/${ph.stepsRequired}`;
            return `<div class="pm-phase-step ${cls}"><span>${escapeHtml(ph.label)}</span><span class="pm-num">${stepProgress}</span></div>`;
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
          <span class="pm-stat-chip" title="Route Stars">${starsText}</span>
          <span class="pm-stat-chip pm-num">Solved: ${rp.solvedCount || 0}</span>
          <span class="pm-stat-chip ${isCritReady ? 'is-crit' : ''}">
            ${isCritReady ? '⚡ CRITICAL READY' : `🔥 Streak ${streak}`}
          </span>
        </div>
      </div>
    `;
  }

  const catchCtaHtml = isCatchReady ? `
    <div class="pm-catch-cta-bar">
      <div>
        <div style="font-weight:900;font-size:1rem;color:#991B1B;">
          ${s.wildHp <= 1 ? `${escapeHtml(s.wildPokemon.name)} hung on with 1 HP!` : `${escapeHtml(s.wildPokemon.name)} is weakened!`}
        </div>
        <div style="font-size:0.84rem;font-weight:700;color:#7F1D1D;">
          Throw a Poké Ball now for a boosted catch chance, or keep training!
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button type="button" class="pm-btn-3d pm-btn-primary pm-btn-glow" data-action="throw-pokeball">
          Throw Poké Ball! →
        </button>
        <button type="button" class="pm-btn-3d" data-action="next-encounter">
          Next Encounter
        </button>
      </div>
    </div>
  ` : '';

  const statusFeedbackHtml = s.statusMessage ? `
    <div class="pm-feedback-banner ${s.statusVariant === 'nudge' ? 'is-nudge' : s.statusVariant === 'success' ? 'is-success' : ''}"
         style="${s.statusVariant === 'info' ? 'background:#FFFFFF;border:2px solid #E2D5BE;color:#334155;' : ''}">
      <span>${s.statusVariant === 'nudge' ? '💡' : s.statusVariant === 'success' ? '✨' : '🧭'}</span>
      <span>${escapeHtml(s.statusMessage)}</span>
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
            <button type="button" class="pm-btn-3d" data-action="next-encounter" style="min-height:42px;padding:6px 12px;font-size:0.85rem;">
              🔄 Next Encounter
            </button>
            <button type="button" class="pm-btn-3d pm-btn-gold" data-action="challenge-gym" style="min-height:42px;padding:6px 12px;font-size:0.85rem;">
              🏆 Challenge Gym Leader
            </button>
          </div>
        </div>
        ${renderMoveCardsMarkup()}
      </div>
    `;
  }

  container.innerHTML = `
    <div class="pm-battle-root">
      ${topBannerHtml}
      ${renderArenaMarkup()}
      ${catchCtaHtml}
      ${statusFeedbackHtml}
      ${controlsHtml}
    </div>
  `;

  // Mount parallax biome backdrop and live Pokémon visuals
  const arenaBg = container.querySelector('.pm-arena-bg');
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

  bindContainerEvents();
}

function bindContainerEvents() {
  if (!container || !stateSession) return;

  container.querySelectorAll('[data-move-key]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-move-key');
      if (key) selectWildMove(key);
    });
  });

  container.querySelectorAll('[data-choice-val]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-choice-val');
      if (val !== null) submitAnswer(val);
    });
  });

  container.querySelectorAll('[data-key]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!stateSession?.awaitingAnswer || stateSession.animating) return;
      ctx.audio?.unlockAudio?.();
      const k = btn.getAttribute('data-key');
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
          ctx.audio?.playGentleNudge?.();
          stateSession.statusMessage = 'Enter digits on the Poké-Keypad or tap a Choice Tile!';
          stateSession.statusVariant = 'nudge';
          render();
        }
      } else if (k) {
        ctx.audio?.playClick?.('tap');
        if (stateSession.typedInput.length < 8) {
          stateSession.typedInput += k;
          updateKeypadScreen();
        }
      }
    });
  });

  container.querySelector('[data-action="speak"]')?.addEventListener('click', () => {
    const p = stateSession?.activeProblem;
    if (p) ctx.audio?.speakText?.(p.spokenPrompt || p.promptText, true);
  });

  container.querySelector('[data-action="back-moves"]')?.addEventListener('click', () => {
    if (!stateSession || stateSession.animating) return;
    ctx.audio?.playClick?.('tap');
    stopSpeedBlitzTimer();
    stateSession.selectedMoveKey = null;
    stateSession.activeProblem = null;
    stateSession.awaitingAnswer = false;
    stateSession.typedInput = '';
    render();
  });

  container.querySelector('[data-action="throw-pokeball"]')?.addEventListener('click', () => {
    if (!stateSession) return;
    ctx.audio?.playClick?.('select');
    ctx.onNavigate?.('catch', {
      routeId: stateSession.route.id,
      encounterPokemonId: stateSession.wildPokemon.id,
      shiny: stateSession.isShiny,
      weakened: true,
    });
  });

  container.querySelector('[data-action="next-encounter"]')?.addEventListener('click', () => {
    ctx.audio?.playClick?.('tap');
    startWildSession(true);
    render();
  });

  container.querySelector('[data-action="challenge-gym"]')?.addEventListener('click', () => {
    ctx.audio?.playClick?.('select');
    ctx.onNavigate?.('gym', { mode: 'gym', routeId: stateSession.route.id });
  });

  container.querySelector('[data-action="back-wild"]')?.addEventListener('click', () => {
    ctx.audio?.playClick?.('tap');
    ctx.onNavigate?.('battle', { mode: 'battle', routeId: stateSession.route.id });
  });

  container.querySelector('[data-action="rematch-gym"]')?.addEventListener('click', () => {
    ctx.audio?.playClick?.('select');
    startGymSession();
    syncRotomToProblem(stateSession.activeProblem);
    render();
    startSpeedBlitzIfEnabled(stateSession.profile);
  });

  container.querySelector('[data-action="next-route"]')?.addEventListener('click', (e) => {
    const nextId = e.currentTarget.getAttribute('data-route-id');
    ctx.audio?.playClick?.('select');
    ctx.onNavigate?.('battle', { mode: 'battle', routeId: nextId });
  });

  container.querySelector('[data-action="go-camp"]')?.addEventListener('click', () => {
    ctx.audio?.playClick?.('select');
    ctx.onNavigate?.('camp', { tab: 'camp' });
  });
}

function updateKeypadScreen() {
  const screen = container?.querySelector('.pm-keypad-screen');
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

  const isGym = ctx.modeParams?.mode === 'gym';
  if (isGym) {
    startGymSession();
    syncRotomToProblem(stateSession.activeProblem);
    render();
    startSpeedBlitzIfEnabled(stateSession.profile);
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
    container.innerHTML = '';
  }
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

  if (key >= '0' && key <= '9') {
    ctx?.audio?.unlockAudio?.();
    ctx?.audio?.playClick?.('tap');
    if (stateSession.typedInput.length < 8) {
      stateSession.typedInput += key;
      updateKeypadScreen();
    }
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
      ctx?.audio?.playGentleNudge?.();
      stateSession.statusMessage = 'Type digits first or click one of the Choice Tiles!';
      stateSession.statusVariant = 'nudge';
      render();
    }
    return true;
  }

  return false;
}
