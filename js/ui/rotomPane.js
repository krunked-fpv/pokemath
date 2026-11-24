/**
 * PokéMath Right Rotom-Dex Field Guide Pane
 * Animated Rotom-Dex SVG companion, Read-Aloud trigger, 3-Tier Hint Accordion,
 * 6 Live Interactive Visual Manipulatives, Combo/Charge Meter, Quests & Mastery.
 */

import { buildHintBundle } from '../core/hintEngine.js';

const VALID_MOODS = new Set(['curious', 'cheering', 'encouraging', 'thinking', 'starry']);

const QUEST_ICONS = {
  totalSolved: '🧮',
  solve_total: '🧮',
  sessionStreak: '🔥',
  solve_streak: '🔥',
  catches: '🔴',
  catch_pokemon: '🔴',
  solve_no_hints: '💡',
  battle_wins: '⚔️',
  feed_berries: '🫐',
  use_manipulative: '📐',
  mart_purchases: '🛒',
  solve_word: '📖',
  earn_xp: '⭐',
  critical_solve: '⚡',
  solve_explorer_plus: '🧭'
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatSkillName(tag) {
  return String(tag || 'general')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function isFiniteNumber(value) {
  return typeof value === 'number' ? Number.isFinite(value) : value !== null && value !== '' && value !== undefined && Number.isFinite(Number(value));
}

/** Combo charge: 4-answer streak fills the meter (matches adaptive critical threshold). */
function deriveChargePct(streak) {
  const s = Math.max(0, Number(streak) || 0);
  return clamp(Math.round((s / 4) * 100), 0, 100);
}

/** Shiny Radar bonus %: mirrors adaptive.recordAttempt shinyRollBonus (0..15%). */
function deriveShinyBonusPct(streak) {
  const s = Math.max(0, Number(streak) || 0);
  if (s < 4) return 0;
  return Math.round(Math.min(0.15, 0.04 + (s - 4) * 0.02) * 100);
}

function cssAttrValue(value) {
  return String(value).replace(/["\\]/g, '\\$&');
}

/** Captures a stable selector for the focused element inside `container` so it can be re-focused after innerHTML re-renders. */
function captureFocusSelector(container) {
  if (typeof document === 'undefined' || !container) return null;
  const el = document.activeElement;
  if (!el || el === document.body || !container.contains(el)) return null;
  if (el.id) return `#${cssAttrValue(el.id)}`;
  const attrs = Array.from(el.attributes || [])
    .filter((a) => a.name.startsWith('data-') && a.value !== '')
    .map((a) => `[${a.name}="${cssAttrValue(a.value)}"]`);
  return attrs.length ? `${el.tagName.toLowerCase()}${attrs.join('')}` : null;
}

function restoreFocusSelector(container, selector) {
  if (!selector || !container) return;
  try {
    const el = container.querySelector(selector);
    if (el && typeof el.focus === 'function') el.focus({ preventScroll: true });
  } catch {
    // Ignore invalid selectors
  }
}

function buildRotomFaceSvg(mood = 'curious') {
  const safeMood = VALID_MOODS.has(mood) ? mood : 'curious';
  let eyes = '';
  let mouth = '';
  let aura = '#FB923C';

  if (safeMood === 'cheering') {
    aura = '#38B000';
    eyes = `
      <path d="M23 33 Q28 26 33 33" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      <path d="M47 33 Q52 26 57 33" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
    `;
    mouth = `<path d="M31 44 Q40 54 49 44 Z" fill="#FFFFFF"/>`;
  } else if (safeMood === 'encouraging') {
    aura = '#0EA5E9';
    eyes = `
      <ellipse cx="28" cy="33" rx="4.5" ry="5.5" fill="#38BDF8"/>
      <ellipse cx="52" cy="33" rx="4.5" ry="5.5" fill="#38BDF8"/>
      <circle cx="29" cy="31" r="1.8" fill="#FFFFFF"/>
      <circle cx="53" cy="31" r="1.8" fill="#FFFFFF"/>
    `;
    mouth = `<path d="M33 46 Q40 50 47 46" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>`;
  } else if (safeMood === 'thinking') {
    aura = '#8B5CF6';
    eyes = `
      <ellipse cx="28" cy="32" rx="4.5" ry="4.5" fill="#FDE047"/>
      <line x1="47" y1="33" x2="57" y2="31" stroke="#FDE047" stroke-width="3" stroke-linecap="round"/>
    `;
    mouth = `<circle cx="43" cy="46" r="3" fill="#FFFFFF"/>`;
  } else if (safeMood === 'starry') {
    aura = '#FFCB05';
    eyes = `
      <polygon points="28,26 30,31 35,31 31,34 32,39 28,36 24,39 25,34 21,31 26,31" fill="#FFCB05"/>
      <polygon points="52,26 54,31 59,31 55,34 56,39 52,36 48,39 49,34 45,31 50,31" fill="#FFCB05"/>
    `;
    mouth = `<path d="M30 44 Q40 53 50 44" fill="none" stroke="#FFCB05" stroke-width="3" stroke-linecap="round"/>`;
  } else {
    // curious
    eyes = `
      <ellipse cx="28" cy="33" rx="4.8" ry="6" fill="#38BDF8"/>
      <ellipse cx="52" cy="33" rx="4.8" ry="6" fill="#38BDF8"/>
      <circle cx="29.5" cy="31" r="2" fill="#FFFFFF"/>
      <circle cx="53.5" cy="31" r="2" fill="#FFFFFF"/>
    `;
    mouth = `<path d="M34 45 Q40 49 46 45" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>`;
  }

  return `
    <svg id="rotom-face-svg" viewBox="0 0 80 76" width="66" height="66" aria-label="Rotom-Dex feeling ${safeMood}">
      <polyline points="40,3 35,14 43,14 39,22" fill="none" stroke="#38BDF8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 24 L20 18 L20 34 Z" fill="#38BDF8" opacity="0.85"/>
      <path d="M68 24 L60 18 L60 34 Z" fill="#38BDF8" opacity="0.85"/>
      <rect x="16" y="16" width="48" height="46" rx="14" fill="#EF4444" stroke="#991B1B" stroke-width="3"/>
      <rect x="21" y="21" width="38" height="33" rx="9" fill="#0F172A" stroke="${aura}" stroke-width="2"/>
      ${eyes}
      ${mouth}
      <circle cx="40" cy="58" r="3" fill="#FFCB05"/>
    </svg>
  `;
}

function createInitialManipState(hintBundle) {
  const type = hintBundle?.tier2?.type || 'partWhole';
  const cfg = hintBundle?.tier2?.config || {};

  if (type === 'tenFrame') {
    const mode = cfg.mode || 'add';
    const rawA = clamp(Number(cfg.filledA) || 0, 0, 20);
    const rawB = clamp(Number(cfg.filledB) || 0, 0, 20);
    let target = Number(cfg.target) > 10 ? 20 : 10;
    if (rawA > 10 || (mode === 'add' && rawA + rawB > 10)) target = 20;
    const filledA = Math.min(rawA, target);
    const cells = Array.from({ length: target }, () => 'empty');
    for (let i = 0; i < filledA; i += 1) {
      cells[i] = 'a';
    }
    // Anti-Spoiler: Group A starts filled. The student places Group B (addition)
    // or crosses out the take-away amount (subtraction) themselves.
    return {
      type,
      target,
      mode,
      cells,
      startA: filledA,
      goalB: mode === 'sub' ? 0 : Math.min(rawB, target - filledA),
      goalCross: mode === 'sub' ? Math.min(rawB, filledA) : 0
    };
  }

  if (type === 'numberLine') {
    const min = Number.isFinite(Number(cfg.min)) ? Number(cfg.min) : 0;
    const rawMax = Number.isFinite(Number(cfg.max)) ? Number(cfg.max) : 20;
    const max = Math.max(min + 5, rawMax);
    const step = Math.max(1, Number(cfg.step) || 1);
    const start = clamp(Number(cfg.start) || min, min, max);
    return { type, min, max, step, start, pos: start, hops: [] };
  }

  if (type === 'base10') {
    return {
      type,
      h: clamp(Number(cfg.hundreds) || 0, 0, 12),
      t: clamp(Number(cfg.tens) || 0, 0, 19),
      o: clamp(Number(cfg.ones) || 0, 0, 19),
      addedSecond: false,
      secondH: clamp(Number(cfg.secondHundreds) || 0, 0, 9),
      secondT: clamp(Number(cfg.secondTens) || 0, 0, 9),
      secondO: clamp(Number(cfg.secondOnes) || 0, 0, 9),
      op: cfg.op || 'placeValue',
      askPlace: ['hundreds', 'tens', 'ones', 'value', 'compose'].includes(cfg.askPlace) ? cfg.askPlace : null,
      touched: false
    };
  }

  if (type === 'berryArray') {
    const rows = clamp(Number(cfg.rows) || 2, 1, 12);
    const cols = clamp(Number(cfg.cols) || 3, 1, 12);
    const mode = cfg.mode || 'mul';
    const total = clamp(Number(cfg.total) || rows * cols, 1, 144);
    const highlightedRows = mode === 'mul' && rows > 1 ? [0] : [];
    const shadedCells = [];
    let baseNum = 0;
    if (mode === 'fraction') {
      // The golden parts are the GIVEN picture; the student counts them by tapping.
      const shaded = clamp(Number(cfg.shaded) || 0, 0, Math.min(total, rows * cols));
      for (let i = 0; i < shaded; i += 1) shadedCells.push(i);
    } else if (mode === 'equivFraction') {
      // Anti-Spoiler: only the known base fraction (first row) is pre-shaded,
      // never the unknown equivalent numerator.
      baseNum = clamp(Number(cfg.baseNum ?? cfg.shaded) || 0, 0, cols);
      for (let i = 0; i < baseNum; i += 1) shadedCells.push(i);
    }
    return {
      type,
      rows,
      cols,
      mode,
      total,
      highlightedRows,
      shadedCells,
      countedCells: [],
      baseNum,
      initialShaded: shadedCells.join(',')
    };
  }

  if (type === 'comparisonScale') {
    return {
      type,
      leftExpr: String(cfg.leftExpr ?? '0'),
      leftVal: Number(cfg.leftVal) || 0,
      rightExpr: String(cfg.rightExpr ?? '0'),
      rightVal: Number(cfg.rightVal) || 0,
      weighedLeft: false,
      weighedRight: false
    };
  }

  // partWhole
  return {
    type: 'partWhole',
    whole: cfg.whole !== undefined && cfg.whole !== null ? Number(cfg.whole) : null,
    left: cfg.left !== undefined && cfg.left !== null ? Number(cfg.left) : null,
    right: cfg.right !== undefined && cfg.right !== null ? Number(cfg.right) : null,
    unknown: cfg.unknown || 'whole',
    probeValue: 0,
    highlightedNode: null
  };
}

/**
 * Mounts and controls the Right Rotom-Dex Field Guide Pane.
 */
export function createRotomPane(containerEl, context = {}) {
  const audio = context?.audio || null;
  const onQuestClaim = typeof context?.onQuestClaim === 'function' ? context.onQuestClaim : null;
  const onManipulativeInteract =
    typeof context?.onManipulativeInteract === 'function' ? context.onManipulativeInteract : null;

  let currentProfile = null;
  let currentProblem = null;
  let currentHintBundle = null;
  let currentHintTier = 0; // 0 = collapsed, 1 | 2 | 3 = open
  let currentMood = 'curious';
  let currentMessage = 'Bzzzt! Your math journey is about to unfold!';
  let currentMetrics = {
    streak: 0,
    chargePct: 0,
    criticalReady: false,
    shinyBonusPct: 0,
    totalSolved: 0,
    sessionAccuracy: 100
  };
  let explicitMetrics = {};
  let manipState = null;

  function notifyManipInteract(detail) {
    audio?.playClick?.('tap');
    if (onManipulativeInteract && manipState) {
      onManipulativeInteract(manipState.type, detail);
    }
  }

  function updateMobileHintBadge() {
    if (typeof document === 'undefined') return;
    const badge = document.getElementById('mobile-hint-badge');
    if (!badge) return;
    if (currentHintTier > 0) {
      badge.textContent = `T${currentHintTier}`;
      badge.classList.add('is-pulsing');
      badge.hidden = false;
    } else if (currentHintBundle) {
      badge.textContent = '!';
      badge.classList.remove('is-pulsing');
      badge.hidden = false;
    } else {
      badge.textContent = '0';
      badge.classList.remove('is-pulsing');
      badge.hidden = true;
    }
  }

  function renderTenFrameHtml(state) {
    const frames = state.target > 10 ? [0, 10] : [0];
    let countA = 0;
    let countB = 0;
    let countCrossed = 0;
    for (const c of state.cells) {
      if (c === 'a') countA += 1;
      else if (c === 'b') countB += 1;
      else if (c === 'crossed') countCrossed += 1;
    }

    // Anti-Spoiler: never print the solved total / difference — only the parts
    // the student has built, plus a nudge to count.
    let readout = '';
    if (state.mode === 'sub') {
      const goal = Number(state.goalCross) || 0;
      readout = `Start: ${state.startA} | Crossed out: ${countCrossed}`;
      readout += goal > 0 && countCrossed < goal
        ? ` of ${goal} — tap Red tokens to cross them out!`
        : ' — count the Red tokens left!';
    } else if (state.mode === 'makeTen') {
      readout = `Red: ${countA} | Gold: ${countB}`;
      readout += countA + countB >= 10 ? ' — frame full! Count the Gold tokens.' : ' — add Gold to fill the frame to 10!';
    } else if (state.mode === 'missing') {
      readout = `Red: ${countA} | Gold: ${countB} | Total: ${countA + countB} — add Gold until you reach the total!`;
    } else {
      const goal = Number(state.goalB) || 0;
      readout = `Red: ${countA} | Gold: ${countB}`;
      readout += goal > 0 && countB < goal ? ` of ${goal} — tap empty slots to place Gold!` : ' — count total!';
    }
    const isSub = state.mode === 'sub';

    const framesHtml = frames
      .map((offset) => {
        const cellsHtml = state.cells
          .slice(offset, offset + 10)
          .map((cell, localIdx) => {
            const idx = offset + localIdx;
            const cls =
              cell === 'a'
                ? 'is-a'
                : cell === 'b'
                ? 'is-b'
                : cell === 'crossed'
                ? 'is-a is-crossed'
                : 'is-empty';
            const label =
              cell === 'a'
                ? 'Red token'
                : cell === 'b'
                ? 'Gold token'
                : cell === 'crossed'
                ? 'Crossed out token'
                : 'Empty slot';
            return `
              <button type="button" class="tenframe-cell ${cls}" data-manip="tenframe-cell" data-idx="${idx}" aria-label="Slot ${idx + 1}: ${label}">
                ${cell !== 'empty' ? '<span class="tenframe-token" aria-hidden="true"></span>' : ''}
              </button>
            `;
          })
          .join('');
        return `<div class="manip-tenframe-grid">${cellsHtml}</div>`;
      })
      .join('');

    return `
      <div class="manip-box manip-tenframe" data-mode="${escapeHtml(state.mode)}">
        <div class="manip-tenframe-stack">${framesHtml}</div>
        <div class="manip-readout tabular-nums" aria-live="polite">${escapeHtml(readout)}</div>
        <div class="manip-controls-row">
          ${isSub
            ? `<button type="button" class="btn-3d btn-sm btn-secondary" data-manip="tenframe-sub">✗ Cross Out 1</button>
               <button type="button" class="btn-3d btn-sm btn-secondary" data-manip="tenframe-add">↺ Undo 1</button>`
            : `<button type="button" class="btn-3d btn-sm btn-secondary" data-manip="tenframe-add">+1 Gold</button>
               <button type="button" class="btn-3d btn-sm btn-secondary" data-manip="tenframe-sub">−1 Gold</button>`}
          <button type="button" class="btn-3d btn-sm btn-ghost" data-manip="manip-reset">Reset</button>
        </div>
      </div>
    `;
  }

  function renderNumberLineHtml(state) {
    const { min, max, start, pos, hops } = state;
    const span = Math.max(1, max - min);
    const padX = 24;
    const trackW = 252;
    const baseY = 64;
    const toX = (val) => padX + ((clamp(val, min, max) - min) / span) * trackW;

    const tickStep = span <= 20 ? 1 : span <= 50 ? 5 : span <= 200 ? 20 : 100;
    const labelStep = span <= 12 ? 1 : span <= 25 ? 5 : span <= 100 ? 20 : 200;

    const ticks = [];
    for (let v = min; v <= max; v += tickStep) {
      const x = toX(v).toFixed(1);
      const showLbl = v === min || v === max || (v - min) % labelStep === 0;
      ticks.push(`
        <g data-manip="nl-tick" data-val="${v}" style="cursor:pointer;">
          <line x1="${x}" y1="${baseY - 6}" x2="${x}" y2="${baseY + 6}" stroke="#475569" stroke-width="${showLbl ? 2 : 1.2}"/>
          ${showLbl ? `<text x="${x}" y="${baseY + 20}" text-anchor="middle" font-size="10" font-weight="700" fill="#334155">${v}</text>` : ''}
        </g>
      `);
    }

    const arcs = hops
      .slice(-8)
      .map((hop) => {
        const x1 = toX(hop.from);
        const x2 = toX(hop.to);
        const mx = (x1 + x2) / 2;
        const height = clamp(Math.abs(x2 - x1) * 0.42 + 12, 14, 40);
        const cy = baseY - height;
        const color = hop.delta >= 0 ? '#16A34A' : '#E3350D';
        const lbl = hop.delta >= 0 ? `+${hop.delta}` : `${hop.delta}`;
        return `
          <path d="M ${x1.toFixed(1)} ${baseY - 4} Q ${mx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${baseY - 4}" fill="none" stroke="${color}" stroke-width="2.4" stroke-dasharray="4 2"/>
          <text x="${mx.toFixed(1)}" y="${Math.max(11, cy + 4).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="800" fill="${color}">${lbl}</text>
        `;
      })
      .join('');

    const startX = toX(start).toFixed(1);
    const posX = toX(pos).toFixed(1);
    const net = pos - start;

    return `
      <div class="manip-box manip-numberline">
        <svg class="manip-nl-svg" viewBox="0 0 300 94" aria-label="Interactive Number Line">
          <line x1="${padX}" y1="${baseY}" x2="${padX + trackW}" y2="${baseY}" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/>
          ${ticks.join('')}
          ${arcs}
          <circle cx="${startX}" cy="${baseY}" r="4.5" fill="#94A3B8" stroke="#1E293B" stroke-width="1.5"/>
          <circle cx="${posX}" cy="${baseY}" r="7.5" fill="#FFCB05" stroke="#B45309" stroke-width="2.5"/>
        </svg>
        <div class="manip-readout tabular-nums">Start: ${start} &nbsp;|&nbsp; Now: ${pos} &nbsp;|&nbsp; Total: ${net >= 0 ? `+${net}` : net}</div>
        <div class="manip-controls-row">
          <button type="button" class="nl-hop-btn is-neg tabular-nums" data-manip="nl-hop" data-delta="-10">-10</button>
          <button type="button" class="nl-hop-btn is-neg tabular-nums" data-manip="nl-hop" data-delta="-5">-5</button>
          <button type="button" class="nl-hop-btn is-neg tabular-nums" data-manip="nl-hop" data-delta="-1">-1</button>
          <button type="button" class="nl-hop-btn is-pos tabular-nums" data-manip="nl-hop" data-delta="1">+1</button>
          <button type="button" class="nl-hop-btn is-pos tabular-nums" data-manip="nl-hop" data-delta="5">+5</button>
          <button type="button" class="nl-hop-btn is-pos tabular-nums" data-manip="nl-hop" data-delta="10">+10</button>
          <button type="button" class="nl-hop-btn" data-manip="manip-reset">Reset</button>
        </div>
      </div>
    `;
  }

  function renderBase10Html(state) {
    const flats = Array.from({ length: Math.min(state.h, 9) }, () => '<span class="b10-flat" title="100 Flat"></span>').join('');
    const rods = Array.from({ length: Math.min(state.t, 12) }, () => '<span class="b10-rod" title="10 Rod"></span>').join('');
    const cubes = Array.from({ length: Math.min(state.o, 12) }, () => '<span class="b10-cube" title="1 Cube"></span>').join('');
    const secondTotal = state.secondH * 100 + state.secondT * 10 + state.secondO;

    // Anti-Spoiler: digit questions ("what digit is in the tens place?") hide the
    // asked column's count until the student starts working with the blocks.
    const hiddenPlace = !state.touched && ['hundreds', 'tens', 'ones'].includes(state.askPlace)
      ? state.askPlace
      : null;
    const colCount = (place, n) => (hiddenPlace === place ? '?' : String(n));
    const placeWord = { hundreds: 'Hundreds flats', tens: 'Tens rods', ones: 'Ones cubes' };

    let readout = '';
    if (hiddenPlace) {
      readout = `Count the ${placeWord[hiddenPlace]} — how many are there?`;
    } else {
      // Block counts only (e.g. '4 Hundreds, 3 Tens, 2 Ones'), never the composed total.
      const parts = [];
      if (state.h > 0) parts.push(`${state.h} ${state.h === 1 ? 'Hundred' : 'Hundreds'}`);
      parts.push(`${state.t} ${state.t === 1 ? 'Ten' : 'Tens'}`);
      parts.push(`${state.o} ${state.o === 1 ? 'One' : 'Ones'}`);
      readout = parts.join(', ');
      if (state.o >= 10) readout += ' — trade 10 Ones for 1 Ten!';
      else if (state.t >= 10) readout += ' — trade 10 Tens for 1 Hundred!';
    }

    return `
      <div class="manip-box manip-base10">
        <div class="manip-base10-cols">
          <div class="b10-col">
            <span class="b10-col-title tabular-nums">100s (${colCount('hundreds', state.h)})</span>
            <div class="b10-pieces-wrap">${flats || '<span class="sr-only">0</span>'}</div>
            <div class="manip-controls-row">
              <button type="button" class="btn-3d btn-sm btn-secondary" data-manip="b10-adj" data-place="h" data-delta="-1" aria-label="Remove a Hundreds flat">-</button>
              <button type="button" class="btn-3d btn-sm btn-secondary" data-manip="b10-adj" data-place="h" data-delta="1" aria-label="Add a Hundreds flat">+</button>
            </div>
          </div>
          <div class="b10-col">
            <span class="b10-col-title tabular-nums">10s (${colCount('tens', state.t)})</span>
            <div class="b10-pieces-wrap">${rods || '<span class="sr-only">0</span>'}</div>
            <div class="manip-controls-row">
              <button type="button" class="btn-3d btn-sm btn-secondary" data-manip="b10-adj" data-place="t" data-delta="-1" aria-label="Remove a Tens rod">-</button>
              <button type="button" class="btn-3d btn-sm btn-secondary" data-manip="b10-adj" data-place="t" data-delta="1" aria-label="Add a Tens rod">+</button>
            </div>
          </div>
          <div class="b10-col">
            <span class="b10-col-title tabular-nums">1s (${colCount('ones', state.o)})</span>
            <div class="b10-pieces-wrap">${cubes || '<span class="sr-only">0</span>'}</div>
            <div class="manip-controls-row">
              <button type="button" class="btn-3d btn-sm btn-secondary" data-manip="b10-adj" data-place="o" data-delta="-1" aria-label="Remove a Ones cube">-</button>
              <button type="button" class="btn-3d btn-sm btn-secondary" data-manip="b10-adj" data-place="o" data-delta="1" aria-label="Add a Ones cube">+</button>
            </div>
          </div>
        </div>
        <div class="manip-readout tabular-nums">${escapeHtml(readout)}</div>
        <div class="manip-controls-row">
          ${state.op === 'add' && secondTotal > 0 && !state.addedSecond
            ? `<button type="button" class="btn-3d btn-sm btn-indigo tabular-nums" data-manip="b10-add-second">+ Join ${secondTotal}</button>`
            : ''}
          <button type="button" class="btn-3d btn-sm btn-ghost" data-manip="manip-reset">Reset</button>
        </div>
      </div>
    `;
  }

  function renderBerryArrayHtml(state) {
    const isFraction = state.mode === 'fraction' || state.mode === 'equivFraction';
    const rowSet = new Set(state.highlightedRows);
    const shadedSet = new Set(state.shadedCells);
    const countedSet = new Set(state.countedCells || []);
    // Show the full array (state is clamped to 12×12) so the model matches the problem.
    const visualRows = Math.min(state.rows, 12);
    const visualCols = Math.min(state.cols, 12);

    const rowsHtml = Array.from({ length: visualRows }, (_, r) => {
      const isRowActive = rowSet.has(r);
      const cellsHtml = Array.from({ length: visualCols }, (_, c) => {
        const idx = r * state.cols + c;
        const isLit = isFraction ? shadedSet.has(idx) : isRowActive;
        const isCounted = state.mode === 'fraction' && countedSet.has(idx);
        const berryColor = isLit ? '#E3350D' : '#3B82F6';
        const stateLabel = state.mode === 'fraction'
          ? `${isLit ? 'golden' : 'plain'}${isCounted ? ', counted' : ''}`
          : isLit ? 'shaded' : 'plain';
        return `
          <button type="button" class="berry-cell ${isLit ? 'is-highlighted' : ''} ${isCounted ? 'is-counted' : ''}" data-manip="berry-cell" data-row="${r}" data-idx="${idx}" aria-label="Berry row ${r + 1} column ${c + 1}, ${stateLabel}" aria-pressed="${state.mode === 'fraction' ? isCounted : isLit}">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M12 3c3 0 5 2 5 4-3 0-4-1-5-4Z" fill="#22C55E"/>
              <circle cx="12" cy="14" r="7" fill="${berryColor}"/>
            </svg>
          </button>
        `;
      }).join('');

      return `
        <div class="berry-row">
          ${!isFraction ? `<button type="button" class="berry-row-btn tabular-nums ${isRowActive ? 'is-active' : ''}" data-manip="berry-row" data-row="${r}" title="Toggle row ${r + 1}" aria-pressed="${isRowActive}">R${r + 1}</button>` : ''}
          ${cellsHtml}
        </div>
      `;
    }).join('');

    // Anti-Spoiler: readouts report only what the student has tapped/counted,
    // never 'a/b' fractions or solved products.
    let readout = '';
    if (state.mode === 'fraction') {
      let countedGolden = 0;
      for (const idx of countedSet) if (shadedSet.has(idx)) countedGolden += 1;
      readout = countedSet.size === 0
        ? 'Tap each golden berry to count it, then count every berry!'
        : `Golden counted: ${countedGolden} | Berries counted: ${countedSet.size}`;
    } else if (state.mode === 'equivFraction') {
      const untouched = state.shadedCells.slice().sort((a, b) => a - b).join(',') === state.initialShaded;
      readout = untouched
        ? `Row 1 shows ${state.baseNum} shaded of ${state.cols}. Shade the same in every row, then count!`
        : `Shaded so far: ${shadedSet.size} — make every row match Row 1, then count!`;
    } else if (state.mode === 'div') {
      readout = `Groups lit: ${rowSet.size} of ${state.rows} | Berries lit: ${rowSet.size * state.cols}`;
    } else if (rowSet.size === 0) {
      readout = 'Tap a row button to light it up!';
    } else if (rowSet.size < state.rows) {
      readout = `${rowSet.size} of ${state.rows} rows lit = ${rowSet.size * state.cols} berries so far`;
    } else {
      readout = 'All rows lit — count every berry!';
    }

    return `
      <div class="manip-box manip-berry-array" data-mode="${escapeHtml(state.mode)}">
        <div class="manip-berry-grid">${rowsHtml}</div>
        <div class="manip-readout tabular-nums">${escapeHtml(readout)}</div>
        <div class="manip-controls-row">
          ${!isFraction ? '<button type="button" class="btn-3d btn-sm btn-secondary" data-manip="berry-all">Highlight All Rows</button>' : ''}
          <button type="button" class="btn-3d btn-sm btn-ghost" data-manip="manip-reset">Reset</button>
        </div>
      </div>
    `;
  }

  function renderPartWholeHtml(state) {
    const wholeDisp = state.unknown === 'whole'
      ? (state.probeValue > 0 ? `${state.probeValue}?` : '?')
      : String(state.whole ?? '?');
    const leftDisp = state.unknown === 'left'
      ? (state.probeValue > 0 ? `${state.probeValue}?` : '?')
      : String(state.left ?? '?');
    const rightDisp = state.unknown === 'right'
      ? (state.probeValue > 0 ? `${state.probeValue}?` : '?')
      : String(state.right ?? '?');

    const leftVal = state.unknown === 'left' ? state.probeValue : Number(state.left) || 0;
    const rightVal = state.unknown === 'right' ? state.probeValue : Number(state.right) || 0;
    const wholeVal = state.unknown === 'whole' ? state.probeValue : Number(state.whole) || 0;
    const partsSum = leftVal + rightVal;
    const statusText = state.probeValue > 0
      ? (partsSum === wholeVal ? `Balanced! ${leftVal} + ${rightVal} = ${wholeVal}` : `${leftVal} + ${rightVal} = ${partsSum} (Whole: ${wholeVal})`)
      : 'Tap +1 or +5 to test the missing bond!';

    return `
      <div class="manip-box manip-partwhole">
        <div class="manip-pw-wrap">
          <button type="button" class="pw-node-btn ${state.highlightedNode === 'whole' ? 'is-highlighted' : ''}" data-manip="pw-node" data-node="whole">
            <span style="font-size:0.68rem;color:var(--text-secondary);">WHOLE</span>
            <span class="tabular-nums" style="font-size:1.15rem;">${escapeHtml(wholeDisp)}</span>
          </button>
          <svg width="160" height="24" viewBox="0 0 160 24" aria-hidden="true">
            <line x1="80" y1="2" x2="36" y2="22" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
            <line x1="80" y1="2" x2="124" y2="22" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
          </svg>
          <div class="pw-parts-row">
            <button type="button" class="pw-node-btn ${state.highlightedNode === 'left' ? 'is-highlighted' : ''}" data-manip="pw-node" data-node="left">
              <span style="font-size:0.68rem;color:var(--text-secondary);">PART</span>
              <span class="tabular-nums" style="font-size:1.1rem;">${escapeHtml(leftDisp)}</span>
            </button>
            <button type="button" class="pw-node-btn ${state.highlightedNode === 'right' ? 'is-highlighted' : ''}" data-manip="pw-node" data-node="right">
              <span style="font-size:0.68rem;color:var(--text-secondary);">PART</span>
              <span class="tabular-nums" style="font-size:1.1rem;">${escapeHtml(rightDisp)}</span>
            </button>
          </div>
        </div>
        <div class="manip-readout tabular-nums">${escapeHtml(statusText)}</div>
        <div class="manip-controls-row">
          <button type="button" class="btn-3d btn-sm btn-secondary tabular-nums" data-manip="pw-step" data-delta="-1">-1</button>
          <button type="button" class="btn-3d btn-sm btn-secondary tabular-nums" data-manip="pw-step" data-delta="1">+1</button>
          <button type="button" class="btn-3d btn-sm btn-secondary tabular-nums" data-manip="pw-step" data-delta="5">+5</button>
          <button type="button" class="btn-3d btn-sm btn-ghost" data-manip="manip-reset">Reset</button>
        </div>
      </div>
    `;
  }

  function renderComparisonScaleHtml(state) {
    let tiltDeg = 0;
    if (state.weighedLeft && state.weighedRight) {
      if (state.leftVal > state.rightVal) tiltDeg = -10;
      else if (state.rightVal > state.leftVal) tiltDeg = 10;
    } else if (state.weighedLeft) {
      tiltDeg = -7;
    } else if (state.weighedRight) {
      tiltDeg = 7;
    }

    const panText = (expr, val, weighed) => {
      if (!weighed) return expr;
      return String(expr).trim() === String(val) ? `${val} ✓` : `${expr} → ${val}`;
    };
    const leftText = panText(state.leftExpr, state.leftVal, state.weighedLeft);
    const rightText = panText(state.rightExpr, state.rightVal, state.weighedRight);
    // Anti-Spoiler: the scale tilts, but the readout never prints < = >.
    let readout = 'Tap Left Pan or Right Pan to weigh both sides!';
    if (state.weighedLeft && state.weighedRight) {
      readout = 'Both pans weighed! Look at the tilt — which sign fits?';
    } else if (state.weighedLeft) {
      readout = 'Left pan weighed — now weigh the Right pan!';
    } else if (state.weighedRight) {
      readout = 'Right pan weighed — now weigh the Left pan!';
    }

    return `
      <div class="manip-box manip-scale">
        <svg class="manip-scale-svg" viewBox="0 0 280 120" aria-label="Interactive Comparison Balance Scale">
          <polygon points="122,112 158,112 140,86" fill="#64748B"/>
          <rect x="136" y="42" width="8" height="50" rx="4" fill="#475569"/>
          <g transform="rotate(${tiltDeg} 140 44)">
            <line x1="48" y1="44" x2="232" y2="44" stroke="#1E293B" stroke-width="5" stroke-linecap="round"/>
            <line x1="56" y1="44" x2="40" y2="74" stroke="#94A3B8" stroke-width="2"/>
            <line x1="56" y1="44" x2="72" y2="74" stroke="#94A3B8" stroke-width="2"/>
            <path d="M30 74 Q56 88 82 74 Z" fill="${state.weighedLeft ? '#FFCB05' : '#E2E8F0'}" stroke="#1E293B" stroke-width="2"/>
            <text x="56" y="68" text-anchor="middle" font-size="11" font-weight="900" fill="#1E293B">${escapeHtml(state.weighedLeft ? state.leftVal : '?')}</text>

            <line x1="224" y1="44" x2="208" y2="74" stroke="#94A3B8" stroke-width="2"/>
            <line x1="224" y1="44" x2="240" y2="74" stroke="#94A3B8" stroke-width="2"/>
            <path d="M198 74 Q224 88 250 74 Z" fill="${state.weighedRight ? '#38BDF8' : '#E2E8F0'}" stroke="#1E293B" stroke-width="2"/>
            <text x="224" y="68" text-anchor="middle" font-size="11" font-weight="900" fill="#1E293B">${escapeHtml(state.weighedRight ? state.rightVal : '?')}</text>
          </g>
          <circle cx="140" cy="44" r="6" fill="#E3350D" stroke="#FFFFFF" stroke-width="2"/>
        </svg>
        <div class="scale-pan-group">
          <button type="button" class="btn-3d btn-sm ${state.weighedLeft ? 'btn-gold' : 'btn-secondary'} tabular-nums" data-manip="scale-left">Weigh: ${escapeHtml(leftText)}</button>
          <button type="button" class="btn-3d btn-sm ${state.weighedRight ? 'btn-indigo' : 'btn-secondary'} tabular-nums" data-manip="scale-right">Weigh: ${escapeHtml(rightText)}</button>
        </div>
        <div class="manip-readout tabular-nums">${escapeHtml(readout)}</div>
      </div>
    `;
  }

  function renderTier2ManipulativeHtml() {
    if (!manipState) return '';
    switch (manipState.type) {
      case 'tenFrame':
        return renderTenFrameHtml(manipState);
      case 'numberLine':
        return renderNumberLineHtml(manipState);
      case 'base10':
        return renderBase10Html(manipState);
      case 'berryArray':
        return renderBerryArrayHtml(manipState);
      case 'comparisonScale':
        return renderComparisonScaleHtml(manipState);
      case 'partWhole':
      default:
        return renderPartWholeHtml(manipState);
    }
  }

  function renderHintAccordionHtml() {
    if (!currentHintBundle) {
      return `
        <div class="pokenav-card">
          <h3 class="section-heading">Rotom-Dex Field Guide</h3>
          <p style="margin:0;font-size:0.84rem;color:var(--text-secondary);">Start any math challenge and I will prepare 3 hint tiers &amp; a live interactive model right here!</p>
        </div>
      `;
    }

    const t1 = currentHintBundle.tier1 || {};
    const t2 = currentHintBundle.tier2 || {};
    const t3 = currentHintBundle.tier3 || {};
    const steps = Array.isArray(t3.steps) ? t3.steps : [];

    return `
      <div class="hint-accordion" role="region" aria-label="3-Tier Progressive Hints">
        <div class="hint-tier-item ${currentHintTier === 1 ? 'is-open' : ''}">
          <button type="button" class="hint-tier-btn" data-hint-tier="1" aria-expanded="${currentHintTier === 1}">
            <span><span class="hint-tier-badge">Tier 1</span> Mental Nudge</span>
            <span>${currentHintTier === 1 ? '▲' : '▼'}</span>
          </button>
          ${currentHintTier === 1 ? `
            <div class="hint-tier-panel">
              <strong>${escapeHtml(t1.headline || 'Strategy Tip')}</strong>
              <p style="margin:0;">${escapeHtml(t1.nudgeText || '')}</p>
            </div>
          ` : ''}
        </div>

        <div class="hint-tier-item ${currentHintTier === 2 ? 'is-open' : ''}">
          <button type="button" class="hint-tier-btn" data-hint-tier="2" aria-expanded="${currentHintTier === 2}">
            <span><span class="hint-tier-badge">Tier 2</span> Live Visual Model</span>
            <span>${currentHintTier === 2 ? '▲' : '▼'}</span>
          </button>
          ${currentHintTier === 2 ? `
            <div class="hint-tier-panel">
              <p style="margin:0;font-weight:700;">${escapeHtml(t2.interactivePrompt || 'Explore the model below!')}</p>
              ${renderTier2ManipulativeHtml()}
            </div>
          ` : ''}
        </div>

        <div class="hint-tier-item ${currentHintTier === 3 ? 'is-open' : ''}">
          <button type="button" class="hint-tier-btn" data-hint-tier="3" aria-expanded="${currentHintTier === 3}">
            <span><span class="hint-tier-badge">Tier 3</span> Step-by-Step Guide</span>
            <span>${currentHintTier === 3 ? '▲' : '▼'}</span>
          </button>
          ${currentHintTier === 3 ? `
            <div class="hint-tier-panel">
              ${steps.map((s) => `
                <div class="hint-step-card">
                  <span style="font-size:0.74rem;font-weight:900;color:var(--text-secondary);">${escapeHtml(s.label || 'Step')}</span>
                  <span>${escapeHtml(s.highlight || '')}</span>
                  <div class="hint-step-formula tabular-nums">${escapeHtml(s.formula || '')}</div>
                </div>
              `).join('')}
              <p style="margin:2px 0 0;font-size:0.78rem;font-weight:800;color:var(--poke-indigo-dark);">${escapeHtml(t3.finalPrompt || 'Now enter your answer!')}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  function renderMetricsHtml() {
    const streak = Math.max(0, Number(currentMetrics.streak) || 0);
    const chargePct = clamp(Math.round(Number(currentMetrics.chargePct) || 0), 0, 100);
    const shinyPct = clamp(Math.round(Number(currentMetrics.shinyBonusPct) || 0), 0, 100);
    const solved = Math.max(0, Number(currentMetrics.totalSolved) || 0);
    const critical = Boolean(currentMetrics.criticalReady) || chargePct >= 100;

    return `
      <div class="charge-meter-card ${critical ? 'is-critical' : ''}" data-rotom-metrics>
        <div class="section-heading" style="margin-bottom:2px;">
          <span>Combo &amp; Charge Meter</span>
          <span class="tabular-nums" style="font-size:0.76rem;color:${critical ? 'var(--poke-red)' : 'var(--poke-indigo)'};">
            ${critical ? '⚡ CRITICAL READY' : `${chargePct}%`}
          </span>
        </div>
        <div class="meter-track" role="progressbar" aria-label="Combo charge" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${chargePct}">
          <div class="meter-fill evo-bar-fill" style="width:${chargePct}%;"></div>
        </div>
        <div class="metrics-grid">
          <div class="metric-chip">
            <div class="metric-chip-val tabular-nums">${streak}</div>
            <div class="metric-chip-lbl">Streak</div>
          </div>
          <div class="metric-chip">
            <div class="metric-chip-val tabular-nums">+${shinyPct}%</div>
            <div class="metric-chip-lbl">Shiny Radar</div>
          </div>
          <div class="metric-chip">
            <div class="metric-chip-val tabular-nums">${solved}</div>
            <div class="metric-chip-lbl">Solved</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderQuestsHtml() {
    const quests = Array.isArray(currentProfile?.activeQuests) ? currentProfile.activeQuests : [];
    if (quests.length === 0) return '';

    return `
      <div class="pokenav-card">
        <h3 class="section-heading">Mini-Quests</h3>
        <div class="quest-list">
          ${quests.map((q) => {
            const target = Math.max(1, Number(q.target) || 1);
            const progress = Math.min(target, Math.max(0, Number(q.progress) || 0));
            const pct = Math.round((progress / target) * 100);
            const ready = progress >= target && !q.claimed;
            const icon = QUEST_ICONS[q.metric] || '⭐';
            return `
              <div class="quest-item ${ready ? 'is-ready' : ''}">
                <div class="quest-head">
                  <span>${icon} ${escapeHtml(q.title)}</span>
                  <span class="quest-progress-text tabular-nums">${progress}/${target}</span>
                </div>
                <div class="meter-track" style="height:7px;">
                  <div class="meter-fill xp-bar-fill" style="width:${pct}%;"></div>
                </div>
                ${q.claimed
                  ? `<span style="font-size:0.72rem;font-weight:800;color:var(--poke-green-dark);">✓ Claimed +${q.rewardStardust} Stardust</span>`
                  : ready
                  ? `<button type="button" class="quest-claim-btn tabular-nums" data-quest-claim="${escapeHtml(q.id)}">Claim +${q.rewardStardust} ✨ Stardust</button>`
                  : `<span style="font-size:0.72rem;color:var(--text-muted);">Reward: +${q.rewardStardust} ✨ Stardust</span>`}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderMasteryHtml() {
    const masteryObj = currentProfile?.skillMastery || {};
    const entries = Object.entries(masteryObj)
      .sort((a, b) => (b[1]?.attempts || 0) - (a[1]?.attempts || 0))
      .slice(0, 5);

    if (entries.length === 0) return '';

    return `
      <div class="pokenav-card">
        <h3 class="section-heading">Skill Mastery</h3>
        <div class="mastery-list">
          ${entries.map(([tag, m]) => {
            const rolling = Array.isArray(m.rolling) && m.rolling.length > 0
              ? Math.round((m.rolling.filter(Boolean).length / m.rolling.length) * 100)
              : (m.attempts > 0 ? Math.round((m.correct / m.attempts) * 100) : 0);
            const level = Number(m.level) || 1;
            return `
              <div class="mastery-item">
                <div class="mastery-head">
                  <span>${escapeHtml(formatSkillName(tag))}</span>
                  <span class="mastery-pct tabular-nums">Lv.${level} • ${rolling}%</span>
                </div>
                <div class="meter-track" style="height:7px;">
                  <div class="meter-fill hp-bar-fill" style="width:${clamp(rolling, 6, 100)}%;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function paint() {
    if (!containerEl) return;

    // Stability: keep the pane's scroll position and keyboard focus across re-renders.
    const prevScrollTop = containerEl.scrollTop || 0;
    const focusSelector = captureFocusSelector(containerEl);

    containerEl.innerHTML = `
      <div class="rotom-header-card">
        <div class="rotom-face-row">
          <div class="rotom-avatar-frame">${buildRotomFaceSvg(currentMood)}</div>
          <div class="rotom-speech-wrap">
            <div class="rotom-speech-bubble" role="status" aria-live="polite">${escapeHtml(currentMessage)}</div>
            <div class="rotom-actions-row">
              <span style="font-size:0.72rem;font-weight:900;color:#9A3412;">ROTOM-DEX</span>
              <button type="button" id="rotom-read-aloud-btn" class="read-aloud-btn" aria-label="Read question and clue aloud">
                🔊 Read Aloud
              </button>
            </div>
          </div>
        </div>
      </div>

      ${renderHintAccordionHtml()}
      ${renderMetricsHtml()}
      ${renderQuestsHtml()}
      ${renderMasteryHtml()}
    `;

    if (prevScrollTop > 0) {
      containerEl.scrollTop = prevScrollTop;
    }
    restoreFocusSelector(containerEl, focusSelector);
    updateMobileHintBadge();
  }

  function handleManipAction(target) {
    const action = target.dataset.manip;
    if (!action || !manipState) return;

    if (action === 'manip-reset') {
      manipState = createInitialManipState(currentHintBundle);
      notifyManipInteract({ action: 'reset' });
      paint();
      return;
    }

    if (manipState.type === 'tenFrame') {
      const cells = manipState.cells;
      const isSub = manipState.mode === 'sub';
      if (action === 'tenframe-cell') {
        const idx = Number(target.dataset.idx);
        const cur = cells[idx];
        if (isSub) {
          // Subtraction: tap Red tokens to cross out / restore them.
          if (cur === 'a') cells[idx] = 'crossed';
          else if (cur === 'crossed') cells[idx] = 'a';
        } else if (cur === 'empty') {
          cells[idx] = 'b';
        } else if (cur === 'b') {
          cells[idx] = 'empty';
        }
        notifyManipInteract({ idx });
      } else if (action === 'tenframe-add') {
        if (isSub) {
          const idx = cells.indexOf('crossed');
          if (idx !== -1) cells[idx] = 'a';
        } else {
          const emptyIdx = cells.indexOf('empty');
          if (emptyIdx !== -1) cells[emptyIdx] = 'b';
        }
        notifyManipInteract({ add: 1 });
      } else if (action === 'tenframe-sub') {
        if (isSub) {
          const idx = cells.lastIndexOf('a');
          if (idx !== -1) cells[idx] = 'crossed';
        } else {
          const idx = cells.lastIndexOf('b');
          if (idx !== -1) cells[idx] = 'empty';
        }
        notifyManipInteract({ sub: 1 });
      }
      paint();
      return;
    }

    if (manipState.type === 'numberLine') {
      if (action === 'nl-hop') {
        const delta = Number(target.dataset.delta) || 0;
        const nextPos = clamp(manipState.pos + delta, manipState.min, manipState.max);
        if (nextPos !== manipState.pos) {
          manipState.hops.push({ from: manipState.pos, to: nextPos, delta: nextPos - manipState.pos });
          manipState.pos = nextPos;
          notifyManipInteract({ pos: nextPos, delta });
          paint();
        }
      } else if (action === 'nl-tick') {
        const val = clamp(Number(target.dataset.val) || manipState.min, manipState.min, manipState.max);
        if (val !== manipState.pos) {
          manipState.hops.push({ from: manipState.pos, to: val, delta: val - manipState.pos });
          manipState.pos = val;
          notifyManipInteract({ pos: val });
          paint();
        }
      }
      return;
    }

    if (manipState.type === 'base10') {
      if (action === 'b10-adj') {
        const place = target.dataset.place;
        const delta = Number(target.dataset.delta) || 0;
        if (place === 'h') manipState.h = clamp(manipState.h + delta, 0, 12);
        if (place === 't') manipState.t = clamp(manipState.t + delta, 0, 19);
        if (place === 'o') manipState.o = clamp(manipState.o + delta, 0, 19);
        manipState.touched = true;
        notifyManipInteract({ place, delta });
        paint();
      } else if (action === 'b10-add-second') {
        manipState.h = clamp(manipState.h + manipState.secondH, 0, 12);
        manipState.t = clamp(manipState.t + manipState.secondT, 0, 19);
        manipState.o = clamp(manipState.o + manipState.secondO, 0, 19);
        manipState.addedSecond = true;
        manipState.touched = true;
        notifyManipInteract({ joinedSecond: true });
        paint();
      }
      return;
    }

    if (manipState.type === 'berryArray') {
      if (action === 'berry-row' || (action === 'berry-cell' && manipState.mode !== 'fraction' && manipState.mode !== 'equivFraction')) {
        const row = Number(target.dataset.row);
        const set = new Set(manipState.highlightedRows);
        if (set.has(row)) set.delete(row);
        else set.add(row);
        manipState.highlightedRows = [...set].sort((a, b) => a - b);
        notifyManipInteract({ row });
        paint();
      } else if (action === 'berry-cell' && manipState.mode === 'fraction') {
        // Fraction pictures: tapping counts a berry (golden parts stay as given).
        const idx = Number(target.dataset.idx);
        const set = new Set(manipState.countedCells);
        if (set.has(idx)) set.delete(idx);
        else set.add(idx);
        manipState.countedCells = [...set];
        notifyManipInteract({ idx, counted: set.has(idx) });
        paint();
      } else if (action === 'berry-cell') {
        const idx = Number(target.dataset.idx);
        const set = new Set(manipState.shadedCells);
        if (set.has(idx)) set.delete(idx);
        else set.add(idx);
        manipState.shadedCells = [...set];
        notifyManipInteract({ idx });
        paint();
      } else if (action === 'berry-all') {
        manipState.highlightedRows = Array.from({ length: manipState.rows }, (_, i) => i);
        notifyManipInteract({ all: true });
        paint();
      }
      return;
    }

    if (manipState.type === 'partWhole') {
      if (action === 'pw-node') {
        manipState.highlightedNode = target.dataset.node;
        notifyManipInteract({ node: target.dataset.node });
        paint();
      } else if (action === 'pw-step') {
        const delta = Number(target.dataset.delta) || 0;
        manipState.probeValue = Math.max(0, manipState.probeValue + delta);
        notifyManipInteract({ probeValue: manipState.probeValue });
        paint();
      }
      return;
    }

    if (manipState.type === 'comparisonScale') {
      if (action === 'scale-left') {
        manipState.weighedLeft = true;
        notifyManipInteract({ side: 'left' });
        paint();
      } else if (action === 'scale-right') {
        manipState.weighedRight = true;
        notifyManipInteract({ side: 'right' });
        paint();
      }
    }
  }

  if (containerEl) {
    containerEl.addEventListener('click', (event) => {
      const target = event.target?.closest?.('button, [data-manip], [data-hint-tier], [data-quest-claim]');
      if (!target) return;

      if (target.id === 'rotom-read-aloud-btn') {
        const tier1Spoken = currentHintTier === 1 ? currentHintBundle?.tier1?.spokenText : '';
        const text = [
          currentProblem?.spokenPrompt || currentProblem?.promptText || currentMessage,
          tier1Spoken
        ]
          .filter(Boolean)
          .join('. ');
        audio?.speakText?.(text, true);
        return;
      }

      if (target.dataset.hintTier) {
        const tier = Number(target.dataset.hintTier);
        openHintTier(currentHintTier === tier ? 0 : tier);
        audio?.playClick?.('hint');
        return;
      }

      if (target.dataset.questClaim) {
        const questId = target.dataset.questClaim;
        audio?.playClick?.('coin');
        if (onQuestClaim) {
          const quest = currentProfile?.activeQuests?.find((q) => q.id === questId) || null;
          onQuestClaim(questId, quest);
        }
        return;
      }

      if (target.dataset.manip) {
        handleManipAction(target);
      }
    });
  }

  function render(profile) {
    currentProfile = profile || null;
    if (profile) {
      applyMetrics({
        streak: profile.sessionStreak ?? currentMetrics.streak ?? 0,
        totalSolved: profile.totalSolved ?? currentMetrics.totalSolved ?? 0
      }, { keepExplicit: true });
    }
    paint();
  }

  function setProblem(problemSpec, hintBundle) {
    const prevId = currentProblem?.id;
    currentProblem = problemSpec || null;
    currentHintBundle = hintBundle || (problemSpec ? buildHintBundle(problemSpec) : null);
    if (!prevId || prevId !== problemSpec?.id || !manipState) {
      currentHintTier = 0;
      manipState = currentHintBundle ? createInitialManipState(currentHintBundle) : null;
    }
    paint();
  }

  function openHintTier(tierNum) {
    const next = [0, 1, 2, 3].includes(Number(tierNum)) ? Number(tierNum) : 0;
    currentHintTier = next;
    paint();
    return currentHintTier;
  }

  function cycleHintTier() {
    const next = currentHintTier >= 3 ? 0 : currentHintTier + 1;
    currentHintTier = next;
    audio?.playClick?.('hint');
    paint();
    return currentHintTier;
  }

  function setMood(mood, message) {
    if (VALID_MOODS.has(mood)) {
      currentMood = mood;
    }
    if (typeof message === 'string' && message.trim()) {
      currentMessage = message.trim();
    }
    paint();
  }

  /**
   * Canonical metrics payload: { streak, chargePct, criticalReady, shinyBonusPct, totalSolved }.
   * chargePct / shinyBonusPct / criticalReady are derived from `streak` whenever omitted.
   * Explicit values are remembered only while the streak they were sent with is unchanged.
   */
  function applyMetrics(input = {}, { keepExplicit = false } = {}) {
    const src = input && typeof input === 'object' ? input : {};
    const prevStreak = Math.max(0, Number(currentMetrics.streak) || 0);
    const streak = isFiniteNumber(src.streak) ? Math.max(0, Math.round(Number(src.streak))) : prevStreak;
    const streakChanged = streak !== prevStreak;

    if (!keepExplicit || streakChanged) {
      explicitMetrics = {};
    }
    if (!keepExplicit) {
      if (isFiniteNumber(src.chargePct)) explicitMetrics.chargePct = clamp(Number(src.chargePct), 0, 100);
      if (isFiniteNumber(src.shinyBonusPct)) explicitMetrics.shinyBonusPct = clamp(Number(src.shinyBonusPct), 0, 100);
      if (typeof src.criticalReady === 'boolean') explicitMetrics.criticalReady = src.criticalReady;
    }

    const chargePct = explicitMetrics.chargePct ?? deriveChargePct(streak);
    const shinyBonusPct = explicitMetrics.shinyBonusPct ?? deriveShinyBonusPct(streak);
    const criticalReady = explicitMetrics.criticalReady ?? chargePct >= 100;
    const totalSolved = isFiniteNumber(src.totalSolved)
      ? Math.max(0, Number(src.totalSolved))
      : Math.max(0, Number(currentMetrics.totalSolved) || 0);

    currentMetrics = { ...currentMetrics, streak, chargePct, shinyBonusPct, criticalReady, totalSolved };
  }

  function updateMetrics(metrics = {}) {
    applyMetrics(metrics);
    const existing = containerEl?.querySelector?.('[data-rotom-metrics]');
    if (existing && typeof document !== 'undefined') {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = renderMetricsHtml().trim();
      if (wrapper.firstElementChild) {
        existing.replaceWith(wrapper.firstElementChild);
        return;
      }
    }
    paint();
  }

  function getCurrentHintTier() {
    return currentHintTier;
  }

  paint();

  return {
    render,
    setProblem,
    openHintTier,
    cycleHintTier,
    setMood,
    updateMetrics,
    getCurrentHintTier
  };
}
