import * as defaultState from '../core/state.js';
import * as defaultMathEngine from '../core/mathEngine.js';
import * as defaultHintEngine from '../core/hintEngine.js';
import * as defaultAdaptive from '../core/adaptive.js';
import * as defaultAudio from '../core/audio.js';
import * as defaultPokemonData from '../data/pokemon.js';
import * as defaultItemsData from '../data/items.js';

const STYLE_ID = 'pokemath-berry-lab-styles';

const STATIONS = [
  { id: 'recipes', label: 'Potion & Poffin Recipes', icon: '🍲' },
  { id: 'arrays', label: 'Berry Patch Arrays', icon: '🍓' },
  { id: 'mart', label: 'Poké-Mart Checkout', icon: '🏪' }
];

const MART_CATEGORIES = [
  { id: 'all', label: 'All Goods' },
  { id: 'pokeball', label: 'Poké Balls' },
  { id: 'berry', label: 'Berries' },
  { id: 'boost', label: 'Boosts' },
  { id: 'accessory', label: 'Accessories' }
];

const CAULDRON_BERRIES = [
  { id: 'oran', label: 'Oran', value: 1 },
  { id: 'pecha', label: 'Pecha', value: 5 },
  { id: 'sitrus', label: 'Sitrus', value: 10 },
  { id: 'starf', label: 'Starf', value: 25 }
];

const LAB_CSS = `
.pm-lab {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 100%;
  padding: 16px;
  border-radius: 22px;
  background: linear-gradient(180deg, #fffdf7 0%, #fff6e8 100%);
  color: #1e293b;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  box-sizing: border-box;
}
.pm-lab *, .pm-lab *::before, .pm-lab *::after { box-sizing: border-box; }
.pm-lab-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.24;
  z-index: 0;
}
.pm-lab-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pm-lab-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: rgba(255, 255, 255, 0.92);
  border: 2px solid #f1e4cc;
  border-radius: 18px;
  padding: 12px 14px;
  box-shadow: 0 4px 14px rgba(180, 130, 60, 0.08);
}
.pm-lab-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pm-lab-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #1e293b;
}
.pm-lab-sub {
  margin: 2px 0 0;
  font-size: 0.82rem;
  color: #64748b;
}
.pm-lab-wallets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.pm-lab-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #fff9f0;
  border: 2px solid #f2dec0;
  font-weight: 800;
  font-size: 0.88rem;
  font-variant-numeric: tabular-nums;
}
.pm-lab-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.pm-lab-tab {
  min-height: 52px;
  padding: 10px 12px;
  border: 2px solid #e2d5bf;
  border-bottom-width: 5px;
  border-radius: 16px;
  background: #ffffff;
  color: #334155;
  font-weight: 800;
  font-size: 0.92rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.12s ease, background-color 0.15s ease, border-color 0.15s ease;
}
.pm-lab-tab:hover { transform: translateY(-1px); border-color: #cbd5e1; }
.pm-lab-tab.is-active {
  background: #e3350d;
  border-color: #991b1b;
  color: #ffffff;
}
.pm-lab-card {
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #efe2cc;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 6px 18px rgba(140, 95, 45, 0.08);
}
.pm-lab-story-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
}
.pm-lab-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  background: #fef3c7;
  color: #92400e;
  border: 1.5px solid #fde68a;
}
.pm-lab-prompt {
  font-size: 1.12rem;
  font-weight: 700;
  line-height: 1.45;
  color: #0f172a;
  margin: 6px 0 0;
}
.pm-lab-speak-btn { min-height: 44px; }
.pm-lab-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 14px;
  align-items: start;
}
.pm-lab-cauldron-box {
  background: linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%);
  border: 2px solid #fed7aa;
  border-radius: 18px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pm-lab-cauldron-pot {
  position: relative;
  min-height: 126px;
  border-radius: 18px;
  background: radial-gradient(circle at 50% 25%, #475569 0%, #1e293b 85%);
  border: 4px solid #334155;
  padding: 12px;
  color: #fff9f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.pm-lab-cauldron-bubbles {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
  max-height: 62px;
  overflow: hidden;
}
.pm-lab-cauldron-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 0.78rem;
  font-weight: 800;
}
.pm-lab-cauldron-total {
  font-size: 1.55rem;
  font-weight: 900;
  color: #ffcb05;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.4);
}
.pm-lab-berry-tray {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.pm-lab-berry-btn {
  min-height: 58px;
  padding: 6px;
  border-radius: 14px;
  border: 2px solid #e2e8f0;
  border-bottom-width: 4px;
  background: #ffffff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-weight: 800;
  font-size: 0.82rem;
  color: #1e293b;
}
.pm-lab-berry-btn svg { width: 26px; height: 26px; }
.pm-lab-berry-btn:active { transform: translateY(2px); }
.pm-lab-input-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pm-lab-choices-grid { margin: 0; }
.pm-lab-keypad { max-width: none; }
.pm-lab-keypad-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #0f172a;
  border-color: #0f172a;
  color: #ffcb05;
  text-align: left;
}
.pm-lab-keypad-label { font-size: 0.78rem; color: #94a3b8; font-weight: 700; }
.pm-lab-submit { width: 100%; min-height: 52px; font-size: 1rem; }
.pm-lab-feedback {
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
}
.pm-lab-mode-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.pm-lab-garden-grid {
  display: grid;
  gap: 5px;
  padding: 12px;
  border-radius: 16px;
  background: #ecfccb;
  border: 2px solid #bef264;
  max-width: 100%;
  overflow-x: auto;
}
.pm-lab-plot-cell {
  min-width: 34px;
  min-height: 38px;
  border-radius: 10px;
  border: 2px solid #a3e635;
  background: #d9f99d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  transition: transform 0.1s ease, background-color 0.12s ease;
}
.pm-lab-plot-cell.is-planted {
  background: #fde047;
  border-color: #eab308;
  transform: scale(1.03);
}
.pm-lab-baskets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  gap: 8px;
}
.pm-lab-basket-card {
  min-height: 82px;
  border-radius: 14px;
  border: 2px solid #d97706;
  border-bottom-width: 5px;
  background: #fef3c7;
  padding: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-weight: 800;
}
.pm-lab-coin-tray {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pm-lab-coin-btn {
  min-width: 58px;
  min-height: 58px;
  border-radius: 999px;
  border: 3px solid #b45309;
  border-bottom-width: 5px;
  background: radial-gradient(circle at 35% 30%, #fef08a 0%, #ffcb05 60%, #eab308 100%);
  color: #78350f;
  font-weight: 900;
  font-size: 0.95rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.pm-lab-counter-coins {
  min-height: 58px;
  border-radius: 14px;
  border: 2px dashed #cbd5e1;
  background: #f8fafc;
  padding: 8px 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.pm-lab-placed-coin {
  padding: 4px 10px;
  border-radius: 999px;
  background: #fef08a;
  border: 2px solid #eab308;
  color: #713f12;
  font-weight: 900;
  font-size: 0.85rem;
  cursor: pointer;
}
.pm-lab-mart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(195px, 1fr));
  gap: 10px;
  margin-top: 10px;
}
.pm-lab-mart-item {
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 12px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}
.pm-lab-mart-item-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pm-lab-mart-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  background: #fff9f0;
  border: 1.5px solid #f1e4cc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}
.pm-lab-mart-icon svg { width: 100%; height: 100%; }
.pm-lab-mart-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pm-lab-cat-pill {
  min-height: 38px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 2px solid #e2e8f0;
  background: #ffffff;
  font-weight: 800;
  font-size: 0.82rem;
  cursor: pointer;
}
.pm-lab-cat-pill.is-active {
  background: #3b4cca;
  border-color: #1e3a8a;
  color: #ffffff;
}
@media (max-width: 820px) {
  .pm-lab-tabs { grid-template-columns: 1fr; }
  .pm-lab-workspace { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .pm-lab-tab, .pm-lab-choice-tile, .pm-lab-plot-cell { transition: none !important; }
}
[data-reduced-motion="true"] .pm-lab-tab,
[data-reduced-motion="true"] .pm-lab-choice-tile,
[data-reduced-motion="true"] .pm-lab-plot-cell { transition: none !important; }
`;

let _container = null;
let _ctx = null;
let _station = 'recipes';
let _martCategory = 'all';
let _arrayOp = 'mul';
let _checkoutMode = 'exact';
let _problem = null;
let _hintBundle = null;
let _solved = false;
let _feedback = null;
let _keypadValue = '';
let _cauldronItems = [];
let _plantedCells = new Set();
let _basketCounts = [];
let _placedCoins = [];
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
    itemsData: ctx.itemsData || defaultItemsData,
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
  style.textContent = LAB_CSS;
  document.head.appendChild(style);
}

function removeStyles() {
  if (typeof document === 'undefined') return;
  document.getElementById(STYLE_ID)?.remove();
}

function applyQuestProgress(draft, increments) {
  if (!Array.isArray(draft.activeQuests)) return;
  for (const q of draft.activeQuests) {
    if (!q || q.claimed) continue;
    let next = q.progress || 0;
    if (q.metric === 'totalSolved' || q.metric === 'solve_total') {
      next += increments.solved || 0;
    } else if (q.metric === 'sessionStreak' || q.metric === 'solve_streak') {
      next = Math.max(next, increments.streak || 0);
    } else if (q.metric === 'solve_word') {
      next += increments.wordSolved || 0;
    } else if (q.metric === 'solve_no_hints') {
      next += increments.noHints || 0;
    } else if (q.metric === 'solve_explorer_plus') {
      next += increments.explorerPlus || 0;
    } else if (q.metric === 'feed_berries') {
      next += increments.feedBerries || 0;
    } else if (q.metric === 'mart_purchases') {
      next += increments.martPurchases || 0;
    } else if (q.metric === 'earn_xp') {
      next += increments.xp || 0;
    }
    q.progress = Math.min(q.target || 1, next);
  }
}

function buildCheckoutProblem(tier, mode, itemsData, customFilter) {
  const catalog = (itemsData.MART_CATALOG || []).filter((item) => item.category !== 'accessory');
  const pool = catalog.length > 0 ? catalog : [{ id: 'oran', name: 'Oran Berry', costCoins: 1 }];
  const idOf = (item) => String(item.id || item.itemId || item.name);
  const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const pickFrom = (list) => list[Math.floor(Math.random() * list.length)];

  let maxCost = tier === 'starter' ? 20 : tier === 'explorer' ? 95 : tier === 'ace' ? 180 : 300;
  if (customFilter?.enabled && Number(customFilter.maxNumber) > 0) {
    maxCost = Math.max(2, Math.min(maxCost, Math.floor(Number(customFilter.maxNumber))));
  }

  // Two DIFFERENT items per checkout; the same item is never listed twice.
  let lines = null;
  for (let attempt = 0; attempt < 24 && !lines; attempt += 1) {
    const itemA = pickFrom(pool);
    const others = pool.filter((entry) => idOf(entry) !== idOf(itemA) && entry.name !== itemA.name);
    if (others.length === 0) break;
    const itemB = pickFrom(others);
    const qtyA = tier === 'starter' ? 1 : randInt(1, 2);
    if (itemA.costCoins * qtyA + itemB.costCoins <= maxCost) {
      lines = [{ item: itemA, qty: qtyA }, { item: itemB, qty: 1 }];
    }
  }
  if (!lines) {
    const cheapest = [...pool].sort((a, b) => a.costCoins - b.costCoins);
    const second = cheapest.find((entry) => idOf(entry) !== idOf(cheapest[0]) && entry.name !== cheapest[0].name);
    if (second && cheapest[0].costCoins + second.costCoins <= maxCost) {
      lines = [{ item: cheapest[0], qty: 1 }, { item: second, qty: 1 }];
    } else {
      // Single-item shelf (or tiny budget): merge duplicates into ONE line with a summed quantity.
      const unit = Math.max(1, cheapest[0].costCoins);
      const qty = Math.max(2, Math.min(4, Math.floor(maxCost / unit)));
      lines = [{ item: cheapest[0], qty }];
    }
  }

  const lineCost = (line) => line.item.costCoins * line.qty;
  const totalCost = lines.reduce((sum, line) => sum + lineCost(line), 0);
  const useChange = mode === 'change';

  let paidAmount = totalCost;
  let answer = totalCost;
  let promptText;
  let spokenPrompt;
  let expression;
  let leftExpr;
  let operation = 'word';
  let skillTag = 'mart_exact_checkout';
  let operands = lines.length > 1
    ? lines.map(lineCost)
    : [lines[0].qty, lines[0].item.costCoins];

  const coinWord = (n) => (n === 1 ? 'coin' : 'coins');
  const buyList = lines.map((line) => `${line.qty}× ${line.item.name} (${line.item.costCoins}c${useChange ? '' : ' each'})`).join(' and ');
  const spokenList = lines.map((line) => `${line.qty} ${line.item.name} at ${line.item.costCoins} ${coinWord(line.item.costCoins)}`).join(' and ');

  if (useChange) {
    const bills = [10, 20, 25, 50, 100, 150, 200, 350];
    paidAmount = bills.find((b) => b > totalCost) || totalCost + 25;
    answer = paidAmount - totalCost;
    operation = 'sub';
    skillTag = 'mart_change_checkout';
    operands = [paidAmount, totalCost];
    promptText = `Customer buys ${buyList} for ${totalCost} Coins total, and pays with ${paidAmount} Coins. How much change should you give back?`;
    spokenPrompt = `Total is ${totalCost} ${coinWord(totalCost)}. Customer pays ${paidAmount} ${coinWord(paidAmount)}. How much change should you give back?`;
    expression = `${paidAmount} - ${totalCost} = ?`;
    leftExpr = `${paidAmount} - ${totalCost}`;
  } else if (lines.length === 1) {
    promptText = `Ring up ${buyList}. Place the exact Poké-Coins in the tray!`;
    spokenPrompt = `Ring up ${spokenList} each.`;
    expression = `${lines[0].qty} × ${lines[0].item.costCoins} = ?`;
    leftExpr = `${lines[0].qty} × ${lines[0].item.costCoins}`;
  } else {
    promptText = `Ring up ${buyList.replaceAll(' and ', ' + ')}. Place the exact Poké-Coins in the tray!`;
    spokenPrompt = `Add ${spokenList}.`;
    expression = `${operands.join(' + ')} = ?`;
    leftExpr = operands.join(' + ');
  }

  // Build 4 unique non-negative choices
  const choiceSet = new Set([answer]);
  const offsets = [1, -1, 5, -5, 10, -10, 2, 15];
  for (const off of offsets) {
    if (choiceSet.size >= 4) break;
    if (answer + off >= 0) choiceSet.add(answer + off);
  }
  let probe = answer + 1;
  while (choiceSet.size < 4) {
    choiceSet.add(probe);
    probe += 1;
  }

  return {
    id: `mart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    key: `mart:${useChange ? 'chg' : 'pay'}:${totalCost}:${paidAmount}`,
    tier,
    skillTag,
    operation,
    format: 'word',
    promptText,
    spokenPrompt,
    expression,
    leftExpr,
    rightExpr: null,
    answer,
    choices: Array.from(choiceSet).sort((a, b) => a - b),
    manipulativeType: 'base10',
    operands,
    targetRange: [0, Math.max(20, paidAmount)],
    meta: {
      storyEmoji: '🪙',
      storyItems: 'Poké-Coins',
      whole: useChange ? paidAmount : totalCost,
      parts: useChange ? [totalCost, answer] : operands,
      checkoutItems: lines.map((line) => ({
        name: line.item.name,
        qty: line.qty,
        unitCost: line.item.costCoins
      })),
      paidAmount,
      totalCost
    }
  };
}

function loadNewStationProblem() {
  const { state, mathEngine, hintEngine, adaptive, itemsData, rotomPane } = getApis();
  const profile = state.getActiveProfile();
  const tier = profile?.tier || 'starter';
  const rec = adaptive.getRecommendedProblemConfig(profile || { tier }, 'route-1');

  _solved = false;
  _feedback = null;
  _keypadValue = '';
  _cauldronItems = [];
  _plantedCells = new Set();
  _placedCoins = [];

  if (_station === 'recipes') {
    _problem = mathEngine.generateProblem({
      tier,
      operation: 'word',
      customFilter: profile?.customFilter,
      difficultyAdjustment: rec.difficultyAdjustment
    });
  } else if (_station === 'arrays') {
    if (_arrayOp === 'div') {
      // Every divisor needs its own basket, so keep the divisor within the 12 baskets we can draw.
      for (let attempt = 0; attempt < 12; attempt += 1) {
        _problem = mathEngine.generateProblem({
          tier,
          operation: 'div',
          format: 'numeric',
          customFilter: {
            enabled: true,
            operations: ['div'],
            maxNumber: Math.min(profile?.customFilter?.enabled && profile.customFilter.maxNumber ? profile.customFilter.maxNumber : 60, 60)
          },
          difficultyAdjustment: rec.difficultyAdjustment
        });
        if ((_problem.meta?.rows || _problem.operands?.[1] || 2) <= 12) break;
      }
      const numBaskets = Math.max(2, _problem.operands?.[1] || _problem.meta?.rows || 2);
      _basketCounts = Array.from({ length: numBaskets }, () => 0);
    } else {
      _problem = mathEngine.generateProblem({
        tier,
        operation: 'mul',
        format: 'array',
        customFilter: profile?.customFilter,
        difficultyAdjustment: rec.difficultyAdjustment
      });
      _basketCounts = [];
    }
  } else {
    _problem = buildCheckoutProblem(tier, _checkoutMode, itemsData, profile?.customFilter);
  }

  _hintBundle = hintEngine.buildHintBundle(_problem);
  rotomPane?.setProblem?.(_problem, _hintBundle);
  rotomPane?.setMood?.('curious', 'Tap the manipulatives or enter your answer!');
  _ctx?.speedBlitz?.resetForProblem?.();
  autoReadAloud(profile);
}

/** SPEC §7.7: when the speech setting is on, a new problem is read aloud automatically. */
function autoReadAloud(profile) {
  if (profile?.settings?.speech !== true || !_problem) return;
  const { audio } = getApis();
  audio?.speakText?.(_problem.spokenPrompt || _problem.promptText, false);
}

/** Effects live inside the container, so they must be spawned AFTER render() rebuilds the DOM. */
function getFxHost() {
  return _container?.querySelector?.('.pm-lab') || _container;
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

function submitAnswer(rawValue) {
  if (!_problem || _solved) return;
  const { state, mathEngine, adaptive, audio, vfx, rotomPane, itemsData } = getApis();
  const profile = state.getActiveProfile();
  if (!profile) return;

  const isCorrect = mathEngine.validateAnswer(_problem, rawValue);
  const hintsUsed = rotomPane?.getCurrentHintTier?.() || 0;
  let adaptiveRes = null;
  let celebration = null;

  if (isCorrect) {
    _solved = true;
    const bonusBerries = ['oran', 'pecha', 'sitrus'];
    const awardedBerryId = bonusBerries[Math.floor(Math.random() * bonusBerries.length)];
    const berryDef = (itemsData.BERRIES || []).find((b) => b.id === awardedBerryId);
    const coinsWon = _station === 'mart' ? 14 : 10;
    const xpGain = 12;

    const updated = state.updateProfile((draft) => {
      adaptiveRes = adaptive.recordAttempt(draft, _problem.skillTag, true, hintsUsed);
      draft.coins = (draft.coins || 0) + coinsWon;
      draft.stardust = (draft.stardust || 0) + 4;
      draft.buddyXp = (draft.buddyXp || 0) + xpGain;
      draft.buddyLevel = Math.max(draft.buddyLevel || 1, 1 + Math.floor(draft.buddyXp / 100));
      draft.evolutionMeter = Math.min(100, (draft.evolutionMeter || 0) + 8);
      draft.totalSolved = (draft.totalSolved || 0) + 1;
      draft.totalAttempts = (draft.totalAttempts || 0) + 1;
      if (_station === 'recipes') {
        draft.inventory[awardedBerryId] = (draft.inventory[awardedBerryId] || 0) + 1;
      }
      applyQuestProgress(draft, {
        solved: 1,
        streak: adaptiveRes?.streak || draft.sessionStreak || 1,
        wordSolved: _problem.operation === 'word' ? 1 : 0,
        noHints: hintsUsed === 0 ? 1 : 0,
        explorerPlus: ['explorer', 'ace', 'champion'].includes(draft.tier) ? 1 : 0,
        xp: xpGain
      });
    });

    audio?.playCorrectChime?.(adaptiveRes?.streak || 1);
    _ctx?.speedBlitz?.consumeBonus?.();
    celebration = { coins: coinsWon, xp: xpGain };

    const rewardSummary = _station === 'recipes'
      ? `Delicious brew! Earned +1 ${berryDef?.name || 'Berry'} & +${coinsWon} Coins!`
      : _station === 'arrays'
        ? `Harvest complete! Earned +${coinsWon} Coins & +${xpGain} Buddy XP!`
        : `Checkout balanced! Earned +${coinsWon} Coins & +4 Stardust!`;

    _feedback = {
      type: 'good',
      message: `${rewardSummary} ${adaptiveRes?.encouragementMessage || ''}`.trim()
    };

    rotomPane?.setMood?.(adaptiveRes?.streak >= 4 ? 'starry' : 'cheering', adaptiveRes?.encouragementMessage || rewardSummary);
    rotomPane?.updateMetrics?.({
      streak: updated?.sessionStreak || 0,
      totalSolved: updated?.totalSolved || 0
    });
  } else {
    const updated = state.updateProfile((draft) => {
      adaptiveRes = adaptive.recordAttempt(draft, _problem.skillTag, false, hintsUsed);
      draft.totalAttempts = (draft.totalAttempts || 0) + 1;
    });

    audio?.playGentleNudge?.();
    const msg = adaptiveRes?.encouragementMessage || 'Almost! Try counting the pieces one more time.';
    _feedback = { type: 'nudge', message: msg };

    rotomPane?.setMood?.('encouraging', msg);
    if ((adaptiveRes?.autoOpenHintTier || 0) >= 1) {
      rotomPane?.openHintTier?.(adaptiveRes.autoOpenHintTier);
    }
    rotomPane?.updateMetrics?.({
      streak: updated?.sessionStreak || 0,
      totalSolved: updated?.totalSolved || 0
    });
  }

  render();
  if (celebration) {
    const host = getFxHost();
    vfx?.burstConfetti?.(host);
    vfx?.spawnFloatingText?.(host, `+${celebration.coins} Coins! +${celebration.xp} XP!`, 'success');
  }
}

function handleBuyCatalogItem(itemId) {
  const { state, itemsData, audio, vfx, shell } = getApis();
  const item = (itemsData.MART_CATALOG || []).find((entry) => entry.id === itemId);
  const profile = state.getActiveProfile();
  if (!item || !profile) return;

  if (item.category === 'accessory' && profile.ownedAccessories?.includes(item.itemId)) {
    shell?.showToast?.(`${item.name} is already in your Closet!`, 'info');
    return;
  }

  if ((profile.coins || 0) < item.costCoins) {
    audio?.playGentleNudge?.();
    shell?.showToast?.(`Need ${item.costCoins - (profile.coins || 0)} more Coins! Try a Checkout Drill!`, 'warning');
    return;
  }

  state.updateProfile((draft) => {
    draft.coins = Math.max(0, (draft.coins || 0) - item.costCoins);
    if (item.category === 'accessory') {
      if (!draft.ownedAccessories.includes(item.itemId)) {
        draft.ownedAccessories.push(item.itemId);
      }
    } else {
      draft.inventory[item.itemId] = (draft.inventory[item.itemId] || 0) + (item.quantity || 1);
    }
    applyQuestProgress(draft, { martPurchases: 1 });
  });

  audio?.playClick?.('buy');
  shell?.showToast?.(`Purchased ${item.name}!`, 'success');
  render();
  vfx?.spawnFloatingText?.(getFxHost(), `Bought ${item.name}!`, 'coin');
}

function getCauldronTotal() {
  return _cauldronItems.reduce((sum, item) => sum + item.value, 0);
}

function getCoinTrayTotal() {
  return _placedCoins.reduce((sum, val) => sum + val, 0);
}

function getBasketDividend() {
  return _problem?.meta?.whole || _problem?.operands?.[0] || 0;
}

function areBasketsEven() {
  return _basketCounts.length > 0 && _basketCounts.every((count) => count === _basketCounts[0]);
}

function isBasketDerivedSubmission() {
  return _keypadValue === '' && _station === 'arrays' && _arrayOp === 'div';
}

function getActiveSubmissionValue() {
  if (_keypadValue !== '') return Number(_keypadValue);
  if (_station === 'recipes') return getCauldronTotal();
  if (_station === 'arrays') {
    if (_arrayOp === 'div') {
      return _basketCounts.length > 0 ? _basketCounts[0] : 0;
    }
    return _plantedCells.size;
  }
  if (_station === 'mart') return getCoinTrayTotal();
  return 0;
}

/**
 * Submits whatever the active workspace holds. Basket-derived answers are only accepted once
 * EVERY basket holds the same share and all berries are dealt; otherwise a gentle nudge is
 * shown (no attempt is recorded, no penalty).
 */
function submitActiveWorkspace() {
  if (!_problem || _solved) return;
  const { audio, rotomPane } = getApis();
  if (isBasketDerivedSubmission()) {
    const used = _basketCounts.reduce((sum, count) => sum + count, 0);
    let nudge = null;
    if (used === 0) {
      nudge = 'Deal some berries into the baskets first, then check the share!';
    } else if (!areBasketsEven()) {
      nudge = 'The baskets are not even yet! Deal berries so every basket holds the same amount (or tap Reset to start fresh), then check again.';
    } else if (used < getBasketDividend()) {
      nudge = 'Some berries are still waiting! Keep dealing until none are left, evenly in every basket.';
    }
    if (nudge) {
      audio?.playGentleNudge?.();
      _feedback = { type: 'nudge', message: nudge };
      rotomPane?.setMood?.('encouraging', nudge);
      render();
      return;
    }
  }
  audio?.playClick?.('submit');
  submitAnswer(getActiveSubmissionValue());
}

function renderChoicesAndKeypad(submitLabel) {
  const choices = Array.isArray(_problem?.choices) ? _problem.choices : [];
  let activeVal = _keypadValue !== '' ? _keypadValue : String(getActiveSubmissionValue() || '');
  if (isBasketDerivedSubmission()) {
    const used = _basketCounts.reduce((sum, count) => sum + count, 0);
    if (used > 0 && !areBasketsEven()) {
      activeVal = 'Uneven';
    }
  }
  return `
    <div class="pm-lab-input-panel">
      <div class="pokenav-choice-grid pm-lab-choices-grid" role="group" aria-label="Answer choices">
        ${choices.map((ch) => `
          <button type="button" class="pokenav-choice-tile pokenav-tactile pm-lab-choice-tile" data-action="pick-choice" data-value="${escapeHtml(ch)}" ${_solved ? 'disabled' : ''}>
            ${escapeHtml(ch)}
          </button>
        `).join('')}
      </div>
      <div class="pokenav-keypad pm-lab-keypad">
        <div class="pokenav-keypad-display pm-lab-keypad-display" aria-live="polite">
          <span class="pm-lab-keypad-label">Poké-Keypad</span>
          <span>${escapeHtml(activeVal || '—')}</span>
        </div>
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `
          <button type="button" class="pokenav-keypad-btn pm-lab-key-btn" data-action="key-digit" data-digit="${d}" ${_solved ? 'disabled' : ''}>${d}</button>
        `).join('')}
        <button type="button" class="pokenav-keypad-btn is-action pm-lab-key-btn" data-action="key-clear" ${_solved ? 'disabled' : ''}>C</button>
        <button type="button" class="pokenav-keypad-btn pm-lab-key-btn" data-action="key-digit" data-digit="0" ${_solved ? 'disabled' : ''}>0</button>
        <button type="button" class="pokenav-keypad-btn is-action pm-lab-key-btn" data-action="key-back" ${_solved ? 'disabled' : ''}>⌫</button>
      </div>
      <button type="button" class="btn-3d btn-success pm-lab-btn-primary pm-lab-submit" data-action="submit-answer" ${_solved ? 'disabled' : ''}>
        ${escapeHtml(submitLabel)}
      </button>
    </div>
  `;
}

function renderRecipesStation(itemsData) {
  const berriesById = Object.fromEntries((itemsData.BERRIES || []).map((b) => [b.id, b]));
  const total = getCauldronTotal();
  const emoji = _problem?.meta?.storyEmoji || '🍓';

  return `
    <section class="pm-lab-card">
      <div class="pm-lab-story-head">
        <div>
          <span class="pm-lab-badge">${escapeHtml(emoji)} Poffin &amp; Potion Recipe</span>
          <p class="pm-lab-prompt">${escapeHtml(_problem?.promptText || '')}</p>
        </div>
        <button type="button" class="btn-3d btn-secondary pm-lab-speak-btn" data-action="speak-problem">🔊 Read Recipe</button>
      </div>

      <div class="pm-lab-workspace">
        <div class="pm-lab-cauldron-box">
          <div class="pm-lab-cauldron-pot">
            <div style="font-size:0.82rem; font-weight:800; color:#cbd5e1;">Simmering Cauldron</div>
            <div class="pm-lab-cauldron-total">${total}</div>
            <div class="pm-lab-cauldron-bubbles">
              ${_cauldronItems.slice(-14).map((item) => `
                <span class="pm-lab-cauldron-chip">+${item.value} ${escapeHtml(item.label)}</span>
              `).join('') || '<span style="font-size:0.8rem; color:#94a3b8;">Tap berries below to toss into pot</span>'}
            </div>
          </div>

          <div class="pm-lab-berry-tray">
            ${CAULDRON_BERRIES.map((cb) => {
              const svg = berriesById[cb.id]?.svgMarkup || '🍓';
              return `
                <button type="button" class="pm-lab-berry-btn pokenav-tactile" data-action="add-cauldron" data-berry="${cb.id}" data-value="${cb.value}" ${_solved ? 'disabled' : ''}>
                  ${svg}
                  <span>+${cb.value} ${escapeHtml(cb.label)}</span>
                </button>
              `;
            }).join('')}
          </div>

          <div style="display:flex; gap:8px; justify-content:space-between;">
            <button type="button" class="btn-3d btn-secondary btn-sm pm-lab-btn-secondary" data-action="clear-cauldron" ${_solved ? 'disabled' : ''}>Empty Cauldron</button>
            <span style="font-size:0.82rem; color:#9a3412; font-weight:700; align-self:center;">Equation: ${escapeHtml(_problem?.expression || '')}</span>
          </div>
        </div>

        ${renderChoicesAndKeypad('Brew Treat!')}
      </div>
    </section>
  `;
}

function renderArraysStation() {
  const isDiv = _arrayOp === 'div';
  const targetRows = Math.max(2, _problem?.meta?.rows || _problem?.operands?.[0] || 2);
  const targetCols = Math.max(2, _problem?.meta?.cols || _problem?.operands?.[1] || 3);
  const gridRows = Math.min(10, Math.max(5, targetRows + 1));
  const gridCols = Math.min(10, Math.max(5, targetCols + 1));

  let interactiveLeft = '';
  if (isDiv) {
    const dividend = _problem?.meta?.whole || _problem?.operands?.[0] || 12;
    const used = _basketCounts.reduce((a, b) => a + b, 0);
    const remaining = Math.max(0, dividend - used);
    interactiveLeft = `
      <div class="pm-lab-cauldron-box">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <strong>Remaining Berries: ${remaining} / ${dividend}</strong>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn-3d btn-secondary btn-sm pm-lab-btn-secondary" data-action="deal-all-baskets" ${_solved || remaining < _basketCounts.length ? 'disabled' : ''}>+1 to Each Basket</button>
            <button type="button" class="btn-3d btn-secondary btn-sm pm-lab-btn-secondary" data-action="reset-baskets" ${_solved ? 'disabled' : ''}>Reset</button>
          </div>
        </div>
        <div class="pm-lab-baskets-grid">
          ${_basketCounts.map((cnt, idx) => `
            <button type="button" class="pm-lab-basket-card pokenav-tactile" data-action="add-basket" data-index="${idx}" ${_solved || remaining <= 0 ? 'disabled' : ''}>
              <span>🧺 Basket ${idx + 1}</span>
              <span style="font-size:1.25rem; color:#92400e;">${cnt} 🍓</span>
            </button>
          `).join('')}
        </div>
        <div style="font-size:0.82rem; color:#78350f; font-weight:700;">
          Deal berries evenly into every basket, then check how many berries land in 1 basket!
        </div>
      </div>
    `;
  } else {
    const cells = [];
    for (let r = 1; r <= gridRows; r += 1) {
      for (let c = 1; c <= gridCols; c += 1) {
        const key = `${r},${c}`;
        const planted = _plantedCells.has(key);
        cells.push(`
          <button
            type="button"
            class="pm-lab-plot-cell ${planted ? 'is-planted' : ''}"
            data-action="plant-rect"
            data-row="${r}"
            data-col="${c}"
            aria-label="Plant ${r} rows by ${c} columns"
            ${_solved ? 'disabled' : ''}
          >${planted ? '🍓' : '🌱'}</button>
        `);
      }
    }
    interactiveLeft = `
      <div class="pm-lab-cauldron-box">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <strong>Planted Garden: ${_plantedCells.size} Berries</strong>
          <button type="button" class="btn-3d btn-secondary btn-sm pm-lab-btn-secondary" data-action="clear-garden" ${_solved ? 'disabled' : ''}>Clear Plot</button>
        </div>
        <div class="pm-lab-garden-grid" style="grid-template-columns: repeat(${gridCols}, minmax(${gridCols > 6 ? 28 : 34}px, 1fr));">
          ${cells.join('')}
        </div>
        <div style="font-size:0.82rem; color:#365314; font-weight:700;">
          Tap plot (Row ${targetRows}, Col ${targetCols}) to plant an exact ${targetRows} × ${targetCols} berry patch!
        </div>
      </div>
    `;
  }

  return `
    <section class="pm-lab-card">
      <div class="pm-lab-mode-bar">
        <button type="button" class="pm-lab-cat-pill ${_arrayOp === 'mul' ? 'is-active' : ''}" data-action="set-array-op" data-op="mul">🌱 Planting Arrays (×)</button>
        <button type="button" class="pm-lab-cat-pill ${_arrayOp === 'div' ? 'is-active' : ''}" data-action="set-array-op" data-op="div">🧺 Basket Sharing (÷)</button>
      </div>

      <div class="pm-lab-story-head">
        <div>
          <span class="pm-lab-badge">${isDiv ? '🧺 Berry Division Patch' : '🌱 Berry Array Garden'}</span>
          <p class="pm-lab-prompt">${escapeHtml(_problem?.promptText || '')}</p>
        </div>
        <button type="button" class="btn-3d btn-secondary pm-lab-speak-btn" data-action="speak-problem">🔊 Read</button>
      </div>

      <div class="pm-lab-workspace">
        ${interactiveLeft}
        ${renderChoicesAndKeypad(isDiv ? 'Check Share!' : 'Harvest Patch!')}
      </div>
    </section>
  `;
}

function renderMartStation(profile, itemsData) {
  const coins = profile?.coins ?? 0;
  const denominations = itemsData.COIN_DENOMINATIONS || [1, 5, 10, 25, 100];
  const trayTotal = getCoinTrayTotal();
  const catalog = itemsData.MART_CATALOG || [];
  const filteredCatalog = _martCategory === 'all'
    ? catalog
    : catalog.filter((entry) => entry.category === _martCategory);

  return `
    <section class="pm-lab-card">
      <div class="pm-lab-mode-bar">
        <button type="button" class="pm-lab-cat-pill ${_checkoutMode === 'exact' ? 'is-active' : ''}" data-action="set-checkout-mode" data-mode="exact">🪙 Exact Pay Drill</button>
        <button type="button" class="pm-lab-cat-pill ${_checkoutMode === 'change' ? 'is-active' : ''}" data-action="set-checkout-mode" data-mode="change">🧾 Make Change Drill</button>
      </div>

      <div class="pm-lab-story-head">
        <div>
          <span class="pm-lab-badge">🏪 Poké-Mart Register Drill</span>
          <p class="pm-lab-prompt">${escapeHtml(_problem?.promptText || '')}</p>
        </div>
        <button type="button" class="btn-3d btn-secondary pm-lab-speak-btn" data-action="speak-problem">🔊 Read</button>
      </div>

      <div class="pm-lab-workspace">
        <div class="pm-lab-cauldron-box">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong>Coin Counter Tray: ${trayTotal} Coins</strong>
            <button type="button" class="btn-3d btn-secondary btn-sm pm-lab-btn-secondary" data-action="clear-coins" ${_solved ? 'disabled' : ''}>Clear Tray</button>
          </div>
          <div class="pm-lab-counter-coins">
            ${_placedCoins.map((val, idx) => `
              <button type="button" class="pm-lab-placed-coin" data-action="remove-coin" data-index="${idx}" title="Remove coin" ${_solved ? 'disabled' : ''}>🪙 ${val}</button>
            `).join('') || '<span style="font-size:0.82rem; color:#64748b;">Tap Poké-Coins below to place on counter</span>'}
          </div>
          <div class="pm-lab-coin-tray">
            ${denominations.map((val) => `
              <button type="button" class="pm-lab-coin-btn pokenav-tactile" data-action="add-coin" data-value="${val}" ${_solved ? 'disabled' : ''}>+${val}</button>
            `).join('')}
          </div>
        </div>

        ${renderChoicesAndKeypad('Ring Up Checkout!')}
      </div>
    </section>

    <section class="pm-lab-card">
      <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px;">
        <div>
          <h3 style="margin:0; font-size:1.05rem;">🛍️ Live Poké-Mart Supply Counter</h3>
          <p style="margin:2px 0 0; font-size:0.82rem; color:#64748b;">Spend your earned Poké-Coins on Balls, Berries, Rare Candies &amp; Camp Accessories.</p>
        </div>
        <div class="pm-lab-pill">🪙 Wallet: ${coins} Coins</div>
      </div>

      <div class="pm-lab-mart-cats">
        ${MART_CATEGORIES.map((cat) => `
          <button type="button" class="pm-lab-cat-pill ${_martCategory === cat.id ? 'is-active' : ''}" data-action="set-mart-cat" data-cat="${cat.id}">
            ${escapeHtml(cat.label)}
          </button>
        `).join('')}
      </div>

      <div class="pm-lab-mart-grid">
        ${filteredCatalog.map((item) => {
          const isAcc = item.category === 'accessory';
          const isOwned = isAcc && profile?.ownedAccessories?.includes(item.itemId);
          const ownedCount = !isAcc ? (profile?.inventory?.[item.itemId] ?? 0) : null;
          const canAfford = coins >= item.costCoins;
          return `
            <article class="pm-lab-mart-item">
              <div>
                <div class="pm-lab-mart-item-head">
                  <div class="pm-lab-mart-icon">${item.svgMarkup || '🎁'}</div>
                  <div>
                    <div style="font-weight:800; font-size:0.95rem;">${escapeHtml(item.name)}</div>
                    <div style="font-size:0.78rem; color:#64748b; font-weight:700;">
                      ${isAcc ? (isOwned ? '✓ Owned in Closet' : 'Camp Cosmetic') : `In Bag: ${ownedCount}`}
                    </div>
                  </div>
                </div>
                <p style="margin:8px 0 0; font-size:0.79rem; color:#475569; line-height:1.35;">${escapeHtml(item.description)}</p>
              </div>
              <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                <span style="font-weight:900; color:#b45309;">🪙 ${item.costCoins}</span>
                ${isOwned
                  ? `<button type="button" class="btn-3d btn-secondary btn-sm pm-lab-btn-secondary" data-action="goto-camp">Equip in Camp →</button>`
                  : `<button type="button" class="btn-3d btn-success btn-sm pm-lab-btn-primary" data-action="buy-item" data-item-id="${escapeHtml(item.id)}" ${canAfford ? '' : 'disabled'}>Buy</button>`
                }
              </div>
            </article>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function render() {
  if (!_container) return;
  const { state, itemsData, pokemonData, vfx } = getApis();
  const profile = state.getActiveProfile();
  const focusSelector = captureFocusSelector();

  if (!profile) {
    _container.innerHTML = `<div class="pm-lab"><div class="pm-lab-card">Select or create a Trainer Profile to enter the Berry Lab &amp; Poké-Mart!</div></div>`;
    return;
  }

  const buddy = pokemonData.getPokemonById(profile.activeBuddyId);
  const oranCount = profile.inventory?.oran ?? 0;
  const sitrusCount = profile.inventory?.sitrus ?? 0;

  let stationHtml = '';
  if (_station === 'recipes') stationHtml = renderRecipesStation(itemsData);
  else if (_station === 'arrays') stationHtml = renderArraysStation();
  else stationHtml = renderMartStation(profile, itemsData);

  const feedbackHtml = _feedback
    ? `
      <div class="pokenav-feedback pm-lab-feedback ${_feedback.type === 'good' ? 'is-correct' : 'is-nudge'}" role="status">
        <span>${escapeHtml(_feedback.message)}</span>
        ${_solved ? `<button type="button" class="btn-3d btn-success pm-lab-btn-primary" data-action="next-problem">Next Challenge →</button>` : ''}
      </div>
    `
    : '';

  _container.innerHTML = `
    <div class="pm-lab">
      <div class="pm-lab-backdrop" data-lab-bg></div>
      <div class="pm-lab-inner">
        <header class="pm-lab-header">
          <div class="pm-lab-title-wrap">
            <span style="font-size:1.6rem;">🧪</span>
            <div>
              <h2 class="pm-lab-title">Berry Mixing Lab &amp; Poké-Mart</h2>
              <p class="pm-lab-sub">Cooking with ${escapeHtml(buddy?.name || 'Buddy')} • Grade Tier: ${escapeHtml(profile.tier.toUpperCase())}</p>
            </div>
          </div>
          <div class="pm-lab-wallets">
            <span class="pm-lab-pill">🪙 ${profile.coins ?? 0} Coins</span>
            <span class="pm-lab-pill">🍓 ${oranCount} Oran</span>
            <span class="pm-lab-pill">🍋 ${sitrusCount} Sitrus</span>
          </div>
        </header>

        <nav class="pm-lab-tabs" aria-label="Berry Lab Stations">
          ${STATIONS.map((st) => `
            <button type="button" class="pm-lab-tab ${_station === st.id ? 'is-active' : ''}" data-action="switch-station" data-station="${st.id}">
              <span>${st.icon}</span>
              <span>${escapeHtml(st.label)}</span>
            </button>
          `).join('')}
        </nav>

        ${feedbackHtml}
        ${stationHtml}
      </div>
    </div>
  `;

  const bgSlot = _container.querySelector('[data-lab-bg]');
  if (bgSlot && vfx?.mountBiomeBackdrop) {
    vfx.mountBiomeBackdrop(bgSlot, 'meadow');
  }
  restoreFocus(focusSelector);
}

function handleContainerClick(event) {
  const btn = event.target?.closest?.('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const { audio, onNavigate } = getApis();
  audio?.unlockAudio?.();

  if (action === 'switch-station') {
    const nextStation = btn.dataset.station;
    if (STATIONS.some((s) => s.id === nextStation) && nextStation !== _station) {
      _station = nextStation;
      audio?.playClick?.('switch');
      loadNewStationProblem();
      render();
    }
    return;
  }

  if (action === 'speak-problem') {
    audio?.playClick?.('tap');
    audio?.speakText?.(_problem?.spokenPrompt || _problem?.promptText || '', true);
    return;
  }

  if (action === 'add-cauldron') {
    const value = Number(btn.dataset.value) || 1;
    const label = btn.dataset.berry || 'Berry';
    _cauldronItems.push({ label, value });
    _keypadValue = '';
    audio?.playClick?.('berry');
    render();
    return;
  }

  if (action === 'clear-cauldron') {
    _cauldronItems = [];
    _keypadValue = '';
    audio?.playClick?.('cancel');
    render();
    return;
  }

  if (action === 'set-array-op') {
    _arrayOp = btn.dataset.op === 'div' ? 'div' : 'mul';
    audio?.playClick?.('switch');
    loadNewStationProblem();
    render();
    return;
  }

  if (action === 'plant-rect') {
    const rMax = Number(btn.dataset.row) || 1;
    const cMax = Number(btn.dataset.col) || 1;
    _plantedCells = new Set();
    for (let r = 1; r <= rMax; r += 1) {
      for (let c = 1; c <= cMax; c += 1) {
        _plantedCells.add(`${r},${c}`);
      }
    }
    _keypadValue = '';
    audio?.playClick?.('berry');
    render();
    return;
  }

  if (action === 'clear-garden') {
    _plantedCells = new Set();
    _keypadValue = '';
    audio?.playClick?.('cancel');
    render();
    return;
  }

  if (action === 'deal-all-baskets') {
    const dividend = _problem?.meta?.whole || _problem?.operands?.[0] || 0;
    const used = _basketCounts.reduce((a, b) => a + b, 0);
    if (dividend - used >= _basketCounts.length) {
      _basketCounts = _basketCounts.map((cnt) => cnt + 1);
      _keypadValue = '';
      audio?.playClick?.('berry');
      render();
    }
    return;
  }

  if (action === 'add-basket') {
    const idx = Number(btn.dataset.index);
    const dividend = _problem?.meta?.whole || _problem?.operands?.[0] || 0;
    const used = _basketCounts.reduce((a, b) => a + b, 0);
    if (Number.isInteger(idx) && idx >= 0 && idx < _basketCounts.length && used < dividend) {
      _basketCounts[idx] += 1;
      _keypadValue = '';
      audio?.playClick?.('berry');
      render();
    }
    return;
  }

  if (action === 'reset-baskets') {
    _basketCounts = _basketCounts.map(() => 0);
    _keypadValue = '';
    audio?.playClick?.('cancel');
    render();
    return;
  }

  if (action === 'set-checkout-mode') {
    _checkoutMode = btn.dataset.mode === 'change' ? 'change' : 'exact';
    audio?.playClick?.('switch');
    loadNewStationProblem();
    render();
    return;
  }

  if (action === 'add-coin') {
    const val = Number(btn.dataset.value) || 1;
    _placedCoins.push(val);
    _keypadValue = '';
    audio?.playClick?.('coin');
    render();
    return;
  }

  if (action === 'remove-coin') {
    const idx = Number(btn.dataset.index);
    if (Number.isInteger(idx) && idx >= 0 && idx < _placedCoins.length) {
      _placedCoins.splice(idx, 1);
      _keypadValue = '';
      audio?.playClick?.('tap');
      render();
    }
    return;
  }

  if (action === 'clear-coins') {
    _placedCoins = [];
    _keypadValue = '';
    audio?.playClick?.('cancel');
    render();
    return;
  }

  if (action === 'set-mart-cat') {
    _martCategory = btn.dataset.cat || 'all';
    audio?.playClick?.('select');
    render();
    return;
  }

  if (action === 'buy-item') {
    handleBuyCatalogItem(btn.dataset.itemId);
    return;
  }

  if (action === 'goto-camp') {
    audio?.playClick?.('confirm');
    onNavigate?.('camp', { tab: 'camp' });
    return;
  }

  if (action === 'pick-choice') {
    audio?.playClick?.('confirm');
    submitAnswer(btn.dataset.value);
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

  if (action === 'submit-answer') {
    submitActiveWorkspace();
    return;
  }

  if (action === 'next-problem') {
    audio?.playClick?.('confirm');
    loadNewStationProblem();
    render();
  }
}

/**
 * Mounts Mode 3: Berry Mixing Lab & Poké-Mart into containerEl.
 * @param {HTMLElement} containerEl
 * @param {Object} context
 */
export function mount(containerEl, context = {}) {
  unmount();
  _container = containerEl;
  _ctx = context;

  const requested = context?.modeParams?.station || context?.modeParams?.tab;
  _station = STATIONS.some((s) => s.id === requested) ? requested : 'recipes';
  _martCategory = 'all';
  _arrayOp = 'mul';
  _checkoutMode = 'exact';

  ensureStyles();
  if (_container) {
    _container.addEventListener('click', handleContainerClick);
  }
  loadNewStationProblem();
  render();
}

/**
 * Cleanly tears down listeners, timers, and styles for Berry Lab & Poké-Mart.
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
  _problem = null;
  _hintBundle = null;
  _feedback = null;
  _solved = false;
  _keypadValue = '';
  _cauldronItems = [];
  _plantedCells = new Set();
  _basketCounts = [];
  _placedCoins = [];
}

/**
 * Handles keyboard shortcuts for keypad digits, Clear, Backspace, and Enter.
 * @param {KeyboardEvent} event
 * @returns {boolean}
 */
export function handleKey(event) {
  if (!_container || !event) return false;
  const tag = event.target?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false;

  const { audio } = getApis();
  if (/^[0-9]$/.test(event.key) && !_solved) {
    if (_keypadValue.length < 5) {
      _keypadValue += event.key;
      audio?.playClick?.('keypad');
      render();
    }
    return true;
  }
  if (event.key === 'Backspace' && !_solved) {
    if (_keypadValue.length > 0) {
      _keypadValue = _keypadValue.slice(0, -1);
      audio?.playClick?.('tap');
      render();
    }
    return true;
  }
  if (event.key === 'Escape' && !_solved) {
    _keypadValue = '';
    audio?.playClick?.('cancel');
    render();
    return true;
  }
  if (event.key === 'Enter') {
    if (tag === 'BUTTON') return false;
    if (_solved) {
      audio?.playClick?.('confirm');
      loadNewStationProblem();
      render();
    } else {
      submitActiveWorkspace();
    }
    return true;
  }
  return false;
}
