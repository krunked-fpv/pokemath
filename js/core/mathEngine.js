/**
 * PokéMath 4-Tier Adaptive Curriculum & Problem Generator
 * Pure ES Module — zero browser/DOM dependencies (100% Node-safe).
 */

export const TIERS = ['starter', 'explorer', 'ace', 'champion'];

const HISTORY_LIMIT = 30;
const MAX_RETRY_CAP = 25;

const historyRing = [];
let problemSeq = 0;

/**
 * Clears the internal 30-problem anti-repeat ring buffer.
 */
export function resetHistory() {
  historyRing.length = 0;
}

function recordHistoryKey(key) {
  historyRing.push(key);
  if (historyRing.length > HISTORY_LIMIT) {
    historyRing.shift();
  }
}

function randInt(min, max) {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  if (hi <= lo) return lo;
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function normalizeTier(tier) {
  return TIERS.includes(tier) ? tier : 'starter';
}

function getTierDefaultMax(tier) {
  switch (tier) {
    case 'starter':
      return 20;
    case 'explorer':
      return 100;
    case 'ace':
      return 1000;
    case 'champion':
      return 2000;
    default:
      return 20;
  }
}

function getEffectiveCap(tier, customFilter, difficultyAdjustment = 0, criticalChallenge = false) {
  const baseMax = getTierDefaultMax(tier);
  let cap = baseMax;

  if (customFilter && customFilter.enabled && Number.isFinite(Number(customFilter.maxNumber)) && Number(customFilter.maxNumber) > 0) {
    cap = Math.min(cap, Math.max(2, Math.floor(Number(customFilter.maxNumber))));
  } else if (difficultyAdjustment < 0) {
    cap = Math.max(5, Math.round(cap * 0.6));
  } else if (difficultyAdjustment > 0 || criticalChallenge) {
    cap = baseMax;
  }
  return cap;
}

/**
 * Builds 4 unique non-negative integer choices containing exact answer.
 */
function buildNumericChoices(answer, candidateHints = [], minAllowed = 0) {
  const ans = Math.round(Number(answer));
  const safeMin = Math.max(0, minAllowed);
  const pool = new Set([ans]);

  for (const h of candidateHints) {
    const n = Math.round(Number(h));
    if (Number.isFinite(n) && n >= safeMin && n !== ans) {
      pool.add(n);
    }
    if (pool.size >= 4) break;
  }

  const deltas = [1, -1, 2, -2, 3, -3, 5, -5, 10, -10, 4, 6, 8, 12];
  let idx = 0;
  while (pool.size < 4 && idx < deltas.length) {
    const cand = ans + deltas[idx];
    if (cand >= safeMin) pool.add(cand);
    idx++;
  }

  let probe = ans + 1;
  while (pool.size < 4) {
    if (probe >= safeMin) pool.add(probe);
    probe++;
  }

  return Array.from(pool).slice(0, 4).sort((a, b) => a - b);
}

function fractionEqual(n1, d1, n2, d2) {
  return n1 * d2 === n2 * d1;
}

/**
 * Builds 4 unique fraction string choices with no mathematically equivalent distractors.
 */
function buildFractionChoices(ansNum, ansDen) {
  const ansStr = `${ansNum}/${ansDen}`;
  const chosen = [{ n: ansNum, d: ansDen, str: ansStr }];

  const tryAdd = (n, d) => {
    if (d <= 0 || n <= 0 || n > d) return;
    const str = `${n}/${d}`;
    if (chosen.some((c) => c.str === str || fractionEqual(c.n, c.d, n, d))) return;
    chosen.push({ n, d, str });
  };

  // Pedagogical distractors: neighbor numerators, flipped/neighbor denominators
  const neighborNums = [ansNum - 1, ansNum + 1, ansDen - ansNum, 1, 2, 3];
  for (const n of neighborNums) {
    tryAdd(n, ansDen);
    if (chosen.length >= 4) break;
  }

  const neighborDens = [ansDen + 1, ansDen - 1, ansDen + 2, 2, 3, 4, 5, 6, 8];
  for (const d of neighborDens) {
    for (let n = 1; n < d; n++) {
      tryAdd(n, d);
      if (chosen.length >= 4) break;
    }
    if (chosen.length >= 4) break;
  }

  // Guaranteed fallback up to denominator 16
  for (let d = 2; d <= 16 && chosen.length < 4; d++) {
    for (let n = 1; n < d && chosen.length < 4; n++) {
      tryAdd(n, d);
    }
  }

  return chosen
    .slice(0, 4)
    .sort((a, b) => a.n / a.d - b.n / b.d)
    .map((c) => c.str);
}

function makeProblemSpec({
  key,
  tier,
  skillTag,
  operation,
  format,
  promptText,
  spokenPrompt,
  expression,
  leftExpr = null,
  rightExpr = null,
  answer,
  choices,
  manipulativeType,
  operands = [],
  targetRange = [0, 20],
  meta = {},
}) {
  return {
    id: `prob-${++problemSeq}-${Math.random().toString(36).slice(2, 6)}`,
    key,
    tier,
    skillTag,
    operation,
    format,
    promptText,
    spokenPrompt: spokenPrompt || promptText,
    expression,
    leftExpr,
    rightExpr,
    answer,
    choices,
    manipulativeType,
    operands,
    targetRange,
    meta: {
      storyEmoji: null,
      storyItems: null,
      rows: null,
      cols: null,
      whole: null,
      parts: null,
      fractionData: null,
      placeDigits: null,
      ...meta,
    },
  };
}

const STORY_THEMES = [
  { emoji: '🍓', items: 'Oran Berries', place: 'Sprout Meadow' },
  { emoji: '🍋', items: 'Sitrus Berries', place: 'Volt Ridge' },
  { emoji: '🔴', items: 'Poké Balls', place: 'Poké Mart' },
  { emoji: '✨', items: 'Stardust Shards', place: 'Mystic Rapids' },
  { emoji: '🫐', items: 'Pecha Berries', place: 'Harbor Lighthouse' },
  { emoji: '💎', items: 'Gym Badges', place: 'Pebble Cavern' },
];

function fractionWord(n, d) {
  const names = {
    2: 'halves',
    3: 'thirds',
    4: 'fourths',
    5: 'fifths',
    6: 'sixths',
    8: 'eighths',
  };
  if (n === 1) {
    const singular = {
      2: 'half',
      3: 'third',
      4: 'fourth',
      5: 'fifth',
      6: 'sixth',
      8: 'eighth',
    };
    return `1 ${singular[d] || `over ${d}`}`;
  }
  return `${n} ${names[d] || `over ${d}`}`;
}

/* ============================================================================
 * Operation Generators (Tier-Aware + CustomFilter-Safe)
 * ============================================================================ */

function genAdd(ctx) {
  const { tier, cap, difficultyAdjustment, criticalChallenge, preferredFormat } = ctx;

  // Make-10 & Number Bonds in starter (or missing format)
  if (
    preferredFormat === 'missing' ||
    (!preferredFormat && tier === 'starter' && Math.random() < 0.45 && cap >= 6)
  ) {
    const makeTen = tier === 'starter' && cap >= 10 && Math.random() < 0.55 && !criticalChallenge;
    const whole = makeTen
      ? 10
      : randInt(Math.min(6, cap), Math.min(tier === 'starter' ? 20 : cap, cap));
    const a = randInt(1, Math.max(1, whole - 1));
    const ans = whole - a;
    const isBond = !makeTen && Math.random() < 0.5;
    return makeProblemSpec({
      key: `add-missing:${a}+?=${whole}`,
      tier,
      skillTag: makeTen ? 'make_ten' : tier === 'starter' ? 'number_bonds_20' : 'missing_addend',
      operation: 'add',
      format: 'missing',
      promptText: isBond
        ? `Number Bond: ${whole} splits into ${a} and ?`
        : `Find the missing number: ${a} + ? = ${whole}`,
      spokenPrompt: isBond
        ? `Number bond: ${whole} splits into ${a} and what number?`
        : `Find the missing number: ${a} plus what number equals ${whole}?`,
      expression: `${a} + ? = ${whole}`,
      leftExpr: `${a} + ?`,
      rightExpr: `${whole}`,
      answer: ans,
      choices: buildNumericChoices(ans, [ans + 1, ans - 1, whole + a, ans + 2]),
      manipulativeType: makeTen || whole <= 10 ? 'tenFrame' : 'partWhole',
      operands: [a, whole],
      targetRange: [0, whole],
      meta: { whole, parts: [a, null], makeTen, missingSide: 'right' },
    });
  }

  // Skip counting on number line
  if (
    preferredFormat === 'numberLine' ||
    (!preferredFormat && (tier === 'starter' || tier === 'explorer') && Math.random() < 0.28 && cap >= 10)
  ) {
    const stepsPool =
      tier === 'starter'
        ? cap >= 20 ? [2, 5, 10] : [2, 5]
        : cap >= 100 ? [5, 10, 25] : [2, 5, 10];
    const validSteps = stepsPool.filter((s) => s * 3 <= cap);
    const step = validSteps.length ? pick(validSteps) : 2;
    const maxStartMult = Math.max(0, Math.floor((cap - step * 3) / step));
    const startMult = randInt(0, Math.min(4, maxStartMult));
    const n0 = startMult * step;
    const seq = [n0, n0 + step, n0 + step * 2, n0 + step * 3];
    const missingIdx = pick([2, 3]);
    const ans = seq[missingIdx];
    const display = seq.map((v, i) => (i === missingIdx ? '?' : String(v))).join(', ');

    return makeProblemSpec({
      key: `skip:${step}:${n0}:idx${missingIdx}`,
      tier,
      skillTag: `skip_counting_${step}s`,
      operation: 'add',
      format: 'numberLine',
      promptText: `Skip count by ${step}s: ${display}`,
      spokenPrompt: `Skip count by ${step}s: ${seq
        .map((v, i) => (i === missingIdx ? 'what number' : v))
        .join(', ')}`,
      expression: display,
      leftExpr: display,
      rightExpr: null,
      answer: ans,
      choices: buildNumericChoices(ans, [ans + step, ans - step, ans + 1, ans + 2]),
      manipulativeType: 'numberLine',
      operands: [seq[missingIdx - 1], step],
      targetRange: [n0, seq[3] + step],
      meta: {
        whole: ans,
        parts: [seq[missingIdx - 1], step],
        numberLine: {
          min: Math.max(0, n0 - step),
          max: seq[3] + step,
          step,
          start: seq[missingIdx - 1],
          jump: step,
          target: seq[3],
        },
      },
    });
  }

  // Standard addition scaled to tier
  let minSum = 4;
  let maxSum = Math.min(cap, 20);
  let skillTag = 'add_within_20';
  let manip = 'tenFrame';

  if (tier === 'starter') {
    minSum = difficultyAdjustment < 0 ? 3 : 7;
    maxSum = Math.min(cap, difficultyAdjustment < 0 ? 10 : 20);
    skillTag = maxSum <= 10 ? 'add_within_10' : 'add_within_20';
    manip = maxSum <= 20 ? 'tenFrame' : 'numberLine';
  } else if (tier === 'explorer') {
    minSum = Math.min(cap, 15);
    maxSum = Math.min(cap, difficultyAdjustment < 0 ? 50 : 100);
    skillTag = 'add_within_100';
    manip = cap >= 20 ? 'base10' : 'numberLine';
  } else if (tier === 'ace') {
    minSum = Math.min(cap, 120);
    maxSum = Math.min(cap, difficultyAdjustment < 0 ? 500 : 999);
    skillTag = maxSum >= 100 ? 'add_3digit' : 'add_within_100';
    manip = 'base10';
  } else {
    minSum = Math.min(cap, 250);
    maxSum = Math.min(cap, 1999);
    skillTag = 'add_multidigit';
    manip = 'base10';
  }

  const effectiveMax = Math.max(2, maxSum);
  const effectiveMin = Math.min(minSum, effectiveMax);
  let a, b;

  if (tier === 'explorer' && effectiveMax >= 40 && Math.random() < 0.65) {
    // Prefer 2-digit + 2-digit with or without regrouping
    a = randInt(12, Math.max(12, effectiveMax - 12));
    b = randInt(11, Math.max(11, effectiveMax - a));
  } else if ((tier === 'ace' || tier === 'champion') && effectiveMax >= 250) {
    a = randInt(105, Math.max(105, effectiveMax - 105));
    b = randInt(102, Math.max(102, effectiveMax - a));
  } else {
    const targetSum = randInt(effectiveMin, effectiveMax);
    a = randInt(1, Math.max(1, targetSum - 1));
    b = targetSum - a;
  }

  const ans = a + b;
  const wrongSign = Math.abs(a - b);
  return makeProblemSpec({
    key: `add:${a}+${b}`,
    tier,
    skillTag,
    operation: 'add',
    format: 'numeric',
    promptText: `What is ${a} + ${b}?`,
    spokenPrompt: `What is ${a} plus ${b}?`,
    expression: `${a} + ${b} = ?`,
    leftExpr: `${a} + ${b}`,
    rightExpr: null,
    answer: ans,
    choices: buildNumericChoices(ans, [ans + 1, ans - 1, ans + 10, wrongSign]),
    manipulativeType: manip,
    operands: [a, b],
    targetRange: [0, Math.max(effectiveMax, ans)],
    meta: {
      whole: ans,
      parts: [a, b],
      numberLine: { min: 0, max: Math.max(20, ans + 5), step: ans > 40 ? 10 : 1, start: a, jump: b, target: ans },
    },
  });
}

function genSub(ctx) {
  const { tier, cap, difficultyAdjustment, preferredFormat } = ctx;

  if (preferredFormat === 'missing' || (!preferredFormat && tier === 'starter' && Math.random() < 0.28 && cap >= 6)) {
    const a = randInt(Math.min(5, cap), Math.min(tier === 'starter' ? 20 : cap, cap));
    const ans = randInt(1, Math.max(1, a - 1));
    const rem = a - ans;
    return makeProblemSpec({
      key: `sub-missing:${a}-?=${rem}`,
      tier,
      skillTag: tier === 'starter' ? 'sub_missing_20' : 'sub_missing',
      operation: 'sub',
      format: 'missing',
      promptText: `Find the missing number: ${a} - ? = ${rem}`,
      spokenPrompt: `Find the missing number: ${a} minus what number equals ${rem}?`,
      expression: `${a} - ? = ${rem}`,
      leftExpr: `${a} - ?`,
      rightExpr: `${rem}`,
      answer: ans,
      choices: buildNumericChoices(ans, [ans + 1, ans - 1, a + rem, rem]),
      manipulativeType: 'partWhole',
      operands: [a, rem],
      targetRange: [0, a],
      meta: { whole: a, parts: [null, rem], missingSide: 'subtrahend' },
    });
  }

  let maxVal = Math.min(cap, 20);
  let minA = 4;
  let skillTag = 'sub_within_20';
  let manip = 'numberLine';

  if (tier === 'starter') {
    maxVal = Math.min(cap, difficultyAdjustment < 0 ? 10 : 20);
    minA = Math.min(maxVal, 4);
    skillTag = maxVal <= 10 ? 'sub_within_10' : 'sub_within_20';
    manip = Math.random() < 0.5 ? 'numberLine' : 'tenFrame';
  } else if (tier === 'explorer') {
    maxVal = Math.min(cap, difficultyAdjustment < 0 ? 50 : 100);
    minA = Math.min(maxVal, 20);
    skillTag = 'sub_within_100';
    manip = Math.random() < 0.6 ? 'base10' : 'numberLine';
  } else if (tier === 'ace') {
    maxVal = Math.min(cap, difficultyAdjustment < 0 ? 500 : 999);
    minA = Math.min(maxVal, 120);
    skillTag = maxVal >= 100 ? 'sub_3digit' : 'sub_within_100';
    manip = 'base10';
  } else {
    maxVal = Math.min(cap, 1999);
    minA = Math.min(maxVal, 250);
    skillTag = 'sub_multidigit';
    manip = 'base10';
  }

  const hi = Math.max(2, maxVal);
  const lo = Math.min(minA, hi);
  const a = randInt(lo, hi);
  const b = randInt(1, Math.max(1, a - 1)); // Ensures a >= b -> answer >= 1 (never negative!)
  const ans = a - b;

  return makeProblemSpec({
    key: `sub:${a}-${b}`,
    tier,
    skillTag,
    operation: 'sub',
    format: 'numeric',
    promptText: `What is ${a} - ${b}?`,
    spokenPrompt: `What is ${a} minus ${b}?`,
    expression: `${a} - ${b} = ?`,
    leftExpr: `${a} - ${b}`,
    rightExpr: null,
    answer: ans,
    choices: buildNumericChoices(ans, [ans + 1, ans - 1, ans + 10, a + b]),
    manipulativeType: manip,
    operands: [a, b],
    targetRange: [0, a],
    meta: {
      whole: a,
      parts: [b, ans],
      numberLine: { min: 0, max: Math.max(20, a), step: a > 40 ? 10 : 1, start: a, jump: -b, target: ans },
    },
  });
}

function genMul(ctx) {
  const { tier, cap, difficultyAdjustment, criticalChallenge, preferredFormat } = ctx;

  // Intro arrays in explorer (up to 5x5) or when format === 'array'
  if (
    preferredFormat !== 'missing' &&
    (preferredFormat === 'array' ||
      tier === 'starter' ||
      tier === 'explorer' ||
      (tier === 'ace' && Math.random() < 0.3))
  ) {
    const maxFactor =
      tier === 'starter'
        ? Math.min(5, Math.max(2, Math.floor(cap / 2)))
        : tier === 'explorer'
          ? Math.min(5, Math.max(2, Math.floor(cap / 2)))
          : Math.min(10, Math.max(2, Math.floor(cap / 2)));

    let rows = randInt(2, Math.max(2, maxFactor));
    let cols = randInt(2, Math.max(2, maxFactor));
    while (rows * cols > cap && (rows > 1 || cols > 1)) {
      if (rows >= cols && rows > 1) rows--;
      else if (cols > 1) cols--;
    }
    const ans = rows * cols;
    const isArrayFormat = preferredFormat === 'array' || (preferredFormat !== 'numeric' && (tier === 'explorer' || Math.random() < 0.65));

    return makeProblemSpec({
      key: `mul-arr:${rows}x${cols}`,
      tier,
      skillTag: tier === 'explorer' || tier === 'starter' ? 'arrays_5x5' : 'mul_tables_12',
      operation: 'mul',
      format: isArrayFormat ? 'array' : 'numeric',
      promptText: isArrayFormat
        ? `${rows} rows of ${cols} Oran Berries: how many berries in all?`
        : `What is ${rows} × ${cols}?`,
      spokenPrompt: isArrayFormat
        ? `${rows} rows of ${cols} Oran Berries. How many berries in all?`
        : `What is ${rows} times ${cols}?`,
      expression: `${rows} × ${cols} = ?`,
      leftExpr: `${rows} × ${cols}`,
      rightExpr: null,
      answer: ans,
      choices: buildNumericChoices(ans, [rows + cols, (rows + 1) * cols, rows * (cols + 1), ans + 2]),
      manipulativeType: 'berryArray',
      operands: [rows, cols],
      targetRange: [0, Math.max(25, ans)],
      meta: { rows, cols, whole: ans, parts: [rows, cols], storyEmoji: '🍓', storyItems: 'Oran Berries' },
    });
  }

  // Ace (or explicit missing factor): times tables 0..12 + missing factor
  if (tier === 'ace' || preferredFormat === 'missing') {
    const maxTable = Math.min(12, Math.max(2, Math.floor(cap)));
    let a = randInt(difficultyAdjustment < 0 ? 1 : 2, maxTable);
    let b = randInt(difficultyAdjustment < 0 ? 1 : 2, maxTable);
    while (a * b > cap && b > 1) b--;
    while (a * b > cap && a > 1) a--;
    const prod = a * b;

    if ((preferredFormat === 'missing' || (criticalChallenge && Math.random() < 0.5)) && a >= 2 && b >= 2) {
      return makeProblemSpec({
        key: `mul-missing:?x${b}=${prod}`,
        tier,
        skillTag: 'mul_missing_factor',
        operation: 'mul',
        format: 'missing',
        promptText: `Find the missing factor: ? × ${b} = ${prod}`,
        spokenPrompt: `Find the missing factor: what number times ${b} equals ${prod}?`,
        expression: `? × ${b} = ${prod}`,
        leftExpr: `? × ${b}`,
        rightExpr: `${prod}`,
        answer: a,
        choices: buildNumericChoices(a, [a + 1, a - 1, b, a + 2]),
        manipulativeType: 'berryArray',
        operands: [b, prod],
        targetRange: [0, maxTable],
        meta: { rows: a, cols: b, whole: prod, parts: [null, b] },
      });
    }

    return makeProblemSpec({
      key: `mul:${a}x${b}`,
      tier,
      skillTag: 'mul_tables_12',
      operation: 'mul',
      format: 'numeric',
      promptText: `What is ${a} × ${b}?`,
      spokenPrompt: `What is ${a} times ${b}?`,
      expression: `${a} × ${b} = ?`,
      leftExpr: `${a} × ${b}`,
      rightExpr: null,
      answer: prod,
      choices: buildNumericChoices(prod, [a + b, (a + 1) * b, a * Math.max(1, b - 1), prod + a]),
      manipulativeType: 'berryArray',
      operands: [a, b],
      targetRange: [0, Math.max(144, prod)],
      meta: { rows: a, cols: b, whole: prod, parts: [a, b] },
    });
  }

  // Champion: multi-digit multiplication (24 x 6, 15 x 12, etc.)
  let a = randInt(12, Math.min(48, Math.max(12, Math.floor(cap / 2))));
  let b = randInt(4, difficultyAdjustment < 0 ? 9 : 15);
  while (a * b > cap && b > 2) b--;
  while (a * b > cap && a > 2) a--;
  const ans = a * b;

  return makeProblemSpec({
    key: `mul-champ:${a}x${b}`,
    tier,
    skillTag: 'mul_multidigit',
    operation: 'mul',
    format: 'numeric',
    promptText: `What is ${a} × ${b}?`,
    spokenPrompt: `What is ${a} times ${b}?`,
    expression: `${a} × ${b} = ?`,
    leftExpr: `${a} × ${b}`,
    rightExpr: null,
    answer: ans,
    choices: buildNumericChoices(ans, [ans + 10, ans - 10, ans + b, (a + 1) * b]),
    manipulativeType: 'base10',
    operands: [a, b],
    targetRange: [0, Math.max(ans, 500)],
    meta: { rows: Math.min(12, b), cols: Math.min(12, a), whole: ans, parts: [a, b] },
  });
}

function genDiv(ctx) {
  const { tier, cap, difficultyAdjustment, preferredFormat } = ctx;

  // NEVER divide by zero, always exact integer quotient
  const maxDivisor =
    tier === 'starter'
      ? Math.min(5, Math.max(1, cap))
      : tier === 'explorer'
        ? Math.min(5, Math.max(1, cap))
        : tier === 'ace'
          ? Math.min(12, Math.max(1, cap))
          : Math.min(16, Math.max(2, cap));

  const minDivisor = maxDivisor >= 2 ? 2 : 1;
  let divisor = randInt(minDivisor, maxDivisor);

  let maxQuotient =
    tier === 'starter'
      ? 5
      : tier === 'explorer'
        ? 8
        : tier === 'ace'
          ? (difficultyAdjustment < 0 ? 8 : 12)
          : (difficultyAdjustment < 0 ? 15 : 28);

  maxQuotient = Math.min(maxQuotient, Math.floor(cap / divisor));
  if (maxQuotient < 1) {
    divisor = 1;
    maxQuotient = Math.max(1, cap);
  }
  const quotient = randInt(1, maxQuotient);
  const dividend = divisor * quotient;

  // Fact family / missing divisor in ace/champion
  if (preferredFormat === 'missing' || (!preferredFormat && tier === 'ace' && Math.random() < 0.25 && dividend >= 6)) {
    return makeProblemSpec({
      key: `div-missing:${dividend}/?=${quotient}`,
      tier,
      skillTag: 'fact_families_div',
      operation: 'div',
      format: 'missing',
      promptText: `Fact Family: ${dividend} ÷ ? = ${quotient}`,
      spokenPrompt: `Fact family: ${dividend} divided by what number equals ${quotient}?`,
      expression: `${dividend} ÷ ? = ${quotient}`,
      leftExpr: `${dividend} ÷ ?`,
      rightExpr: `${quotient}`,
      answer: divisor,
      choices: buildNumericChoices(divisor, [divisor + 1, divisor - 1, quotient, divisor + 2], 1),
      manipulativeType: 'partWhole',
      operands: [dividend, quotient],
      targetRange: [1, maxDivisor],
      meta: { whole: dividend, parts: [null, quotient], rows: quotient, cols: divisor },
    });
  }

  const useQuotientWord = tier === 'champion' && Math.random() < 0.45;
  return makeProblemSpec({
    key: `div:${dividend}/${divisor}`,
    tier,
    skillTag: tier === 'champion' ? 'div_quotient_multidigit' : 'div_exact_12',
    operation: 'div',
    format: 'numeric',
    promptText: useQuotientWord
      ? `What is the quotient of ${dividend} ÷ ${divisor}?`
      : `What is ${dividend} ÷ ${divisor}?`,
    spokenPrompt: useQuotientWord
      ? `What is the quotient of ${dividend} divided by ${divisor}?`
      : `What is ${dividend} divided by ${divisor}?`,
    expression: `${dividend} ÷ ${divisor} = ?`,
    leftExpr: `${dividend} ÷ ${divisor}`,
    rightExpr: null,
    answer: quotient,
    choices: buildNumericChoices(quotient, [quotient + 1, quotient - 1, divisor, quotient + 2]),
    manipulativeType: divisor <= 10 && quotient <= 10 ? 'berryArray' : 'partWhole',
    operands: [dividend, divisor],
    targetRange: [0, Math.max(12, quotient)],
    meta: { whole: dividend, parts: [divisor, quotient], rows: divisor, cols: quotient },
  });
}

function genPlaceValue(ctx) {
  const { tier, cap } = ctx;

  // Handle tight customFilter maxNumber < 10 safely
  if (cap < 10) {
    const n = randInt(1, cap);
    return makeProblemSpec({
      key: `pv-ones:${n}`,
      tier,
      skillTag: 'place_value_ones',
      operation: 'placeValue',
      format: 'placeValue',
      promptText: `How many ones are in the number ${n}?`,
      spokenPrompt: `How many ones are in the number ${n}?`,
      expression: `${n} = ? ones`,
      leftExpr: `${n}`,
      rightExpr: null,
      answer: n,
      choices: buildNumericChoices(n, [n + 1, n - 1, n + 2]),
      manipulativeType: 'base10',
      operands: [n],
      targetRange: [0, cap],
      meta: { placeDigits: { number: n, hundreds: 0, tens: 0, ones: n, askPlace: 'ones' } },
    });
  }

  if (tier === 'starter' || cap < 100) {
    const maxN = Math.min(99, cap);
    const tens = randInt(1, Math.max(1, Math.floor(maxN / 10)));
    const maxOnes = Math.min(9, maxN - tens * 10);
    const ones = randInt(0, Math.max(0, maxOnes));
    const num = tens * 10 + ones;
    const mode = pick(['compose', 'tensDigit', 'onesDigit']);

    if (mode === 'compose') {
      return makeProblemSpec({
        key: `pv-comp2:${tens}t+${ones}o`,
        tier,
        skillTag: 'place_value_tens_ones',
        operation: 'placeValue',
        format: 'placeValue',
        promptText: `What number has ${tens} tens and ${ones} ones?`,
        spokenPrompt: `What number has ${tens} tens and ${ones} ones?`,
        expression: `${tens} tens + ${ones} ones = ?`,
        leftExpr: `${tens} tens + ${ones} ones`,
        rightExpr: null,
        answer: num,
        choices: buildNumericChoices(num, [ones * 10 + tens, num + 10, num - 10, tens + ones]),
        manipulativeType: 'base10',
        operands: [tens, ones],
        targetRange: [0, 99],
        meta: { placeDigits: { number: num, hundreds: 0, tens, ones, askPlace: 'compose' } },
      });
    }

    const askTens = mode === 'tensDigit';
    const ans = askTens ? tens : ones;
    const other = askTens ? ones : tens;
    return makeProblemSpec({
      key: `pv-digit2:${num}:${mode}`,
      tier,
      skillTag: 'place_value_tens_ones',
      operation: 'placeValue',
      format: 'placeValue',
      promptText: `In ${num}, what digit is in the ${askTens ? 'tens' : 'ones'} place?`,
      spokenPrompt: `In ${num}, what digit is in the ${askTens ? 'tens' : 'ones'} place?`,
      expression: `${num} -> ${askTens ? 'tens' : 'ones'} digit = ?`,
      leftExpr: `${num}`,
      rightExpr: null,
      answer: ans,
      choices: buildNumericChoices(ans, [other, ans * 10, ans + 1, ans - 1]),
      manipulativeType: 'base10',
      operands: [num],
      targetRange: [0, 9],
      meta: { placeDigits: { number: num, hundreds: 0, tens, ones, askPlace: askTens ? 'tens' : 'ones' } },
    });
  }

  // Explorer / Ace / Champion: 3-digit place value to 1,000
  const maxN = Math.min(999, cap);
  const hundreds = randInt(1, Math.max(1, Math.floor(maxN / 100)));
  const remAfterH = maxN - hundreds * 100;
  const tens = randInt(0, Math.min(9, Math.floor(remAfterH / 10)));
  const ones = randInt(0, Math.min(9, remAfterH - tens * 10));
  const num = hundreds * 100 + tens * 10 + ones;
  const variant = pick(['expanded', 'hundredsDigit', 'tensValue', 'tensDigit']);

  if (variant === 'expanded') {
    return makeProblemSpec({
      key: `pv-exp3:${num}`,
      tier,
      skillTag: 'place_value_1000',
      operation: 'placeValue',
      format: 'placeValue',
      promptText: `Combine the place values: ${hundreds * 100} + ${tens * 10} + ${ones} = ?`,
      spokenPrompt: `Combine the place values: ${hundreds * 100} plus ${tens * 10} plus ${ones}`,
      expression: `${hundreds * 100} + ${tens * 10} + ${ones} = ?`,
      leftExpr: `${hundreds * 100} + ${tens * 10} + ${ones}`,
      rightExpr: null,
      answer: num,
      choices: buildNumericChoices(num, [
        hundreds * 100 + ones * 10 + tens,
        num + 10,
        num + 100,
        hundreds + tens + ones,
      ]),
      manipulativeType: 'base10',
      operands: [hundreds * 100, tens * 10, ones],
      targetRange: [100, 999],
      meta: { placeDigits: { number: num, hundreds, tens, ones, askPlace: 'compose' } },
    });
  }

  if (variant === 'tensValue' && tens > 0) {
    const val = tens * 10;
    return makeProblemSpec({
      key: `pv-val3:${num}`,
      tier,
      skillTag: 'place_value_1000',
      operation: 'placeValue',
      format: 'placeValue',
      promptText: `What is the value of the ${tens} in ${num}?`,
      spokenPrompt: `What is the value of the ${tens} in ${num}?`,
      expression: `Value of ${tens} in ${num} = ?`,
      leftExpr: `${num}`,
      rightExpr: null,
      answer: val,
      choices: buildNumericChoices(val, [tens, tens * 100, ones, val + 10]),
      manipulativeType: 'base10',
      operands: [num, tens],
      targetRange: [0, 90],
      meta: { placeDigits: { number: num, hundreds, tens, ones, askPlace: 'value' } },
    });
  }

  const askHundreds = variant === 'hundredsDigit';
  const ans = askHundreds ? hundreds : tens;
  const other = askHundreds ? tens : hundreds;
  return makeProblemSpec({
    key: `pv-dig3:${num}:${variant}`,
    tier,
    skillTag: 'place_value_1000',
    operation: 'placeValue',
    format: 'placeValue',
    promptText: `In ${num}, what digit is in the ${askHundreds ? 'hundreds' : 'tens'} place?`,
    spokenPrompt: `In ${num}, what digit is in the ${askHundreds ? 'hundreds' : 'tens'} place?`,
    expression: `${num} -> ${askHundreds ? 'hundreds' : 'tens'} digit = ?`,
    leftExpr: `${num}`,
    rightExpr: null,
    answer: ans,
    choices: buildNumericChoices(ans, [other, ones, ans + 1, ans * 10]),
    manipulativeType: 'base10',
    operands: [num],
    targetRange: [0, 9],
    meta: { placeDigits: { number: num, hundreds, tens, ones, askPlace: askHundreds ? 'hundreds' : 'tens' } },
  });
}

function genComparison(ctx) {
  const { tier, cap } = ctx;
  let leftExpr, rightExpr, leftVal, rightVal;
  let skillTag = 'comparison_numbers';

  if (tier === 'starter') {
    const maxN = Math.min(20, cap);
    if (maxN >= 6 && Math.random() < 0.4) {
      const a = randInt(1, Math.max(1, maxN - 2));
      const b = randInt(1, Math.max(1, maxN - a));
      leftVal = a + b;
      rightVal = Math.random() < 0.35 ? leftVal : randInt(2, maxN);
      leftExpr = `${a} + ${b}`;
      rightExpr = `${rightVal}`;
    } else {
      leftVal = randInt(1, maxN);
      rightVal = Math.random() < 0.3 ? leftVal : randInt(1, maxN);
      leftExpr = `${leftVal}`;
      rightExpr = `${rightVal}`;
    }
  } else if (tier === 'explorer') {
    const maxN = Math.min(999, Math.max(cap, 2));
    if (maxN >= 100 && Math.random() < 0.65) {
      // Compare tricky close numbers like 452 vs 425
      const h = randInt(1, Math.floor(maxN / 100));
      const t = randInt(1, 8);
      const o = randInt(1, 8);
      leftVal = Math.min(maxN, h * 100 + t * 10 + o);
      const roll = Math.random();
      rightVal =
        roll < 0.3
          ? leftVal
          : roll < 0.65
            ? Math.min(maxN, h * 100 + o * 10 + t)
            : randInt(10, maxN);
      leftExpr = `${leftVal}`;
      rightExpr = `${rightVal}`;
      skillTag = 'comparison_1000';
    } else {
      const a = randInt(1, Math.max(1, Math.floor(maxN / 2)));
      const b = randInt(1, Math.max(1, maxN - a));
      leftVal = a + b;
      rightVal = Math.random() < 0.33 ? leftVal : randInt(2, maxN);
      leftExpr = `${a} + ${b}`;
      rightExpr = `${rightVal}`;
      skillTag = 'comparison_100';
    }
  } else if (tier === 'ace') {
    const maxF = Math.min(12, Math.max(2, Math.floor(Math.sqrt(cap))));
    const a = randInt(2, maxF);
    const b = randInt(2, maxF);
    leftVal = a * b;
    const c = randInt(2, maxF);
    const d = Math.random() < 0.33 ? Math.max(1, Math.round(leftVal / c)) : randInt(2, maxF);
    rightVal = c * d;
    leftExpr = `${a} × ${b}`;
    rightExpr = `${c} × ${d}`;
    skillTag = 'comparison_expressions';
  } else {
    // Champion: multi-step expressions
    const maxF = Math.min(10, Math.max(2, Math.floor(cap / 4)));
    const a = randInt(2, maxF);
    const b = randInt(2, maxF);
    const c = randInt(2, Math.min(6, maxF));
    leftVal = (a + b) * c;
    const d = randInt(2, maxF);
    const e = randInt(2, maxF);
    rightVal = Math.random() < 0.3 ? leftVal : d * e + randInt(1, maxF);
    leftExpr = `(${a} + ${b}) × ${c}`;
    rightExpr = Math.random() < 0.3 && rightVal === leftVal ? `${leftVal}` : `${d} × ${e}`;
    if (rightExpr === `${d} × ${e}`) rightVal = d * e;
    skillTag = 'comparison_champion';
  }

  const answer = leftVal < rightVal ? '<' : leftVal > rightVal ? '>' : '=';

  return makeProblemSpec({
    key: `cmp:${leftExpr}?${rightExpr}`,
    tier,
    skillTag,
    operation: 'comparison',
    format: 'comparison',
    promptText: `Compare the two sides: ${leftExpr}  [?]  ${rightExpr}`,
    spokenPrompt: `Compare ${leftExpr.replace('×', 'times')} and ${rightExpr.replace('×', 'times')}. Choose less than, equal to, or greater than.`,
    expression: `${leftExpr} ? ${rightExpr}`,
    leftExpr,
    rightExpr,
    answer,
    choices: ['<', '=', '>'],
    manipulativeType: 'comparisonScale',
    operands: [leftVal, rightVal],
    targetRange: [0, Math.max(leftVal, rightVal)],
    meta: {
      whole: Math.max(leftVal, rightVal),
      parts: [leftVal, rightVal],
      comparison: { leftVal, rightVal },
    },
  });
}

function genFraction(ctx) {
  const { tier, cap, preferredFormat } = ctx;

  // Champion equivalent fractions: e.g., 2/3 = ?/6 (format: 'missing', integer answer!)
  if (preferredFormat === 'missing' || (tier === 'champion' && preferredFormat !== 'fraction')) {
    const basePairs = [
      [1, 2],
      [1, 3],
      [2, 3],
      [1, 4],
      [3, 4],
      [1, 5],
      [2, 5],
      [3, 5],
      [4, 5],
      [1, 6],
      [5, 6],
    ];
    const [leftNum, leftDen] = pick(basePairs);
    const maxMult = Math.max(2, Math.min(5, Math.floor(Math.max(12, cap) / leftDen)));
    const multiplier = randInt(2, maxMult);
    const rightDen = leftDen * multiplier;
    const ans = leftNum * multiplier;

    return makeProblemSpec({
      key: `frac-eq:${leftNum}/${leftDen}=?/${rightDen}`,
      tier,
      skillTag: 'equivalent_fractions',
      operation: 'fraction',
      format: 'missing',
      promptText: `Find the missing numerator for an equivalent fraction: ${leftNum}/${leftDen} = ?/${rightDen}`,
      spokenPrompt: `Find the missing numerator: ${fractionWord(leftNum, leftDen)} equals how many ${fractionWord(2, rightDen).split(' ')[1] || rightDen}ths?`,
      expression: `${leftNum}/${leftDen} = ?/${rightDen}`,
      leftExpr: `${leftNum}/${leftDen}`,
      rightExpr: `?/${rightDen}`,
      answer: ans,
      choices: buildNumericChoices(ans, [leftNum + (rightDen - leftDen), ans + 1, ans - 1, multiplier], 1),
      manipulativeType: 'berryArray',
      operands: [leftNum, leftDen, rightDen],
      targetRange: [1, rightDen],
      meta: {
        rows: multiplier,
        cols: leftDen,
        whole: rightDen,
        parts: [leftNum, multiplier],
        fractionData: {
          leftNum,
          leftDen,
          rightNum: null,
          rightDen,
          multiplier,
          shaded: ans,
          total: rightDen,
        },
      },
    });
  }

  // Unit & visual fractions (ace, or explicit format === 'fraction')
  const maxDen = Math.min(8, Math.max(2, cap));
  const candidates = [
    [1, 2],
    [1, 3],
    [2, 3],
    [1, 4],
    [2, 4],
    [3, 4],
    [1, 5],
    [2, 5],
    [3, 5],
    [4, 5],
    [1, 6],
    [5, 6],
    [3, 8],
    [5, 8],
  ].filter(([, d]) => d <= maxDen);

  const [num, den] = candidates.length ? pick(candidates) : [1, 2];
  const ans = `${num}/${den}`;
  const theme = pick(STORY_THEMES);

  return makeProblemSpec({
    key: `frac-vis:${num}/${den}`,
    tier,
    skillTag: num === 1 ? 'unit_fractions' : 'visual_fractions',
    operation: 'fraction',
    format: 'fraction',
    promptText: `${num} out of ${den} ${theme.items} are golden! What fraction is golden?`,
    spokenPrompt: `${num} out of ${den} ${theme.items} are golden. What fraction is golden?`,
    expression: `${num} of ${den} = ?`,
    leftExpr: `${num} of ${den}`,
    rightExpr: null,
    answer: ans,
    choices: buildFractionChoices(num, den),
    manipulativeType: 'berryArray',
    operands: [num, den],
    targetRange: [1, den],
    meta: {
      storyEmoji: theme.emoji,
      storyItems: theme.items,
      rows: 1,
      cols: den,
      whole: den,
      parts: [num, den - num],
      fractionData: { numerator: num, denominator: den, shaded: num, total: den },
    },
  });
}

function genOrderOfOps(ctx) {
  const { tier, cap } = ctx;
  const maxBase = Math.min(12, Math.max(2, Math.floor(Math.sqrt(Math.max(4, cap)))));
  const pattern = randInt(0, 2);

  let a, b, c, expr, ans, step1Val, step1Expr, step2Op, distractorNoParens;

  if (pattern === 0) {
    // (a + b) * c
    a = randInt(1, Math.min(8, maxBase));
    b = randInt(1, Math.min(8, maxBase));
    c = randInt(2, Math.min(8, Math.max(2, Math.floor(cap / (a + b)))));
    step1Val = a + b;
    step1Expr = `${a} + ${b}`;
    ans = step1Val * c;
    expr = `(${a} + ${b}) × ${c}`;
    step2Op = `× ${c}`;
    distractorNoParens = a + b * c;
  } else if (pattern === 1 && cap >= 12) {
    // a * (b + c) - d  (ensure >= 0)
    a = randInt(2, Math.min(6, maxBase));
    b = randInt(2, Math.min(6, maxBase));
    c = randInt(1, Math.min(6, maxBase));
    step1Val = b + c;
    step1Expr = `${b} + ${c}`;
    const prod = Math.min(cap, a * step1Val);
    if (prod < a * step1Val) {
      a = 2;
      b = 2;
      c = 1;
      step1Val = 3;
      step1Expr = '2 + 1';
    }
    const d = randInt(1, Math.max(1, a * step1Val - 1));
    ans = a * step1Val - d;
    expr = `${a} × (${b} + ${c}) - ${d}`;
    step2Op = `${a} × ${step1Val} - ${d}`;
    distractorNoParens = Math.max(0, a * b + c - d);
  } else {
    // (dividend / divisor) + c
    const divisor = randInt(2, Math.min(6, Math.max(2, Math.floor(cap / 2))));
    const q = randInt(2, Math.min(8, Math.max(2, Math.floor(cap / divisor))));
    const dividend = divisor * q;
    const extra = randInt(1, Math.max(1, Math.min(15, cap - q)));
    step1Val = q;
    step1Expr = `${dividend} ÷ ${divisor}`;
    ans = q + extra;
    expr = `(${dividend} ÷ ${divisor}) + ${extra}`;
    step2Op = `+ ${extra}`;
    distractorNoParens = dividend + extra;
  }

  return makeProblemSpec({
    key: `ooo:${expr}`,
    tier,
    skillTag: 'order_of_operations',
    operation: 'orderOfOps',
    format: 'numeric',
    promptText: `Evaluate using order of operations: ${expr} = ?`,
    spokenPrompt: `Evaluate: ${expr.replace('×', 'times').replace('÷', 'divided by').replace('-', 'minus').replace('+', 'plus')}`,
    expression: `${expr} = ?`,
    leftExpr: expr,
    rightExpr: null,
    answer: ans,
    choices: buildNumericChoices(ans, [distractorNoParens, ans + 2, ans - 2, step1Val]),
    manipulativeType: 'partWhole',
    operands: [step1Val, ans],
    targetRange: [0, Math.max(cap, ans)],
    meta: {
      whole: ans,
      parts: [step1Val, Math.abs(ans - step1Val)],
      orderSteps: { step1Expr, step1Val, step2Op },
    },
  });
}

function genBalanced(ctx) {
  const { tier, cap } = ctx;
  const maxSide = Math.min(tier === 'starter' ? 18 : 40, Math.max(4, cap));
  const useMul = tier === 'champion' && cap >= 24 && Math.random() < 0.35;

  if (useMul) {
    const a = randInt(2, 6);
    const b = randInt(2, 6);
    const target = a * b;
    // Find a factor c of target
    const factors = [];
    for (let f = 2; f < target; f++) {
      if (target % f === 0 && f !== a) factors.push(f);
    }
    if (factors.length > 0) {
      const c = pick(factors);
      const ans = target / c;
      return makeProblemSpec({
        key: `bal-mul:${c}*?=${a}*${b}`,
        tier,
        skillTag: 'balanced_equations',
        operation: 'balanced',
        format: 'missing',
        promptText: `Balance the scale: ${c} × ? = ${a} × ${b}`,
        spokenPrompt: `Balance the scale: ${c} times what number equals ${a} times ${b}?`,
        expression: `${c} × ? = ${a} × ${b}`,
        leftExpr: `${c} × ?`,
        rightExpr: `${a} × ${b}`,
        answer: ans,
        choices: buildNumericChoices(ans, [target, ans + 1, ans + 2, c]),
        manipulativeType: 'comparisonScale',
        operands: [c, a, b],
        targetRange: [1, target],
        meta: {
          whole: target,
          parts: [c, ans],
          comparison: { leftVal: target, rightVal: target },
          balanced: { rightExpr: `${a} × ${b}`, rightVal: target, knownLeft: c, op: 'mul' },
        },
      });
    }
  }

  // Additive balanced equation: knownLeft + ? = rightA + rightB
  const rightA = randInt(2, Math.max(2, Math.floor(maxSide / 2)));
  const rightB = randInt(2, Math.max(2, maxSide - rightA));
  const targetSum = rightA + rightB;
  const knownLeft = randInt(1, Math.max(1, targetSum - 1));
  const ans = targetSum - knownLeft;

  return makeProblemSpec({
    key: `bal-add:${knownLeft}+?=${rightA}+${rightB}`,
    tier,
    skillTag: 'balanced_equations',
    operation: 'balanced',
    format: 'missing',
    promptText: `Balance the scale: ${knownLeft} + ? = ${rightA} + ${rightB}`,
    spokenPrompt: `Balance the scale: ${knownLeft} plus what number equals ${rightA} plus ${rightB}?`,
    expression: `${knownLeft} + ? = ${rightA} + ${rightB}`,
    leftExpr: `${knownLeft} + ?`,
    rightExpr: `${rightA} + ${rightB}`,
    answer: ans,
    choices: buildNumericChoices(ans, [targetSum, targetSum + knownLeft, ans + 1, ans - 1]),
    manipulativeType: 'comparisonScale',
    operands: [knownLeft, rightA, rightB],
    targetRange: [0, targetSum],
    meta: {
      whole: targetSum,
      parts: [knownLeft, ans],
      comparison: { leftVal: targetSum, rightVal: targetSum },
      balanced: { rightExpr: `${rightA} + ${rightB}`, rightVal: targetSum, knownLeft, op: 'add' },
    },
  });
}

function genWord(ctx) {
  const { tier, cap } = ctx;
  const theme = pick(STORY_THEMES);

  if (tier === 'starter') {
    const maxN = Math.min(20, cap);
    const isAdd = Math.random() < 0.55;
    if (isAdd) {
      const a = randInt(2, Math.max(2, Math.floor(maxN * 0.6)));
      const b = randInt(1, Math.max(1, maxN - a));
      const ans = a + b;
      return makeProblemSpec({
        key: `word-s-add:${a}+${b}:${theme.items}`,
        tier,
        skillTag: 'word_1step_add',
        operation: 'word',
        format: 'word',
        promptText: `Pikachu finds ${a} ${theme.items} in ${theme.place} and ${b} more near camp. How many ${theme.items} in all?`,
        spokenPrompt: `Pikachu finds ${a} ${theme.items} in ${theme.place} and ${b} more near camp. How many ${theme.items} in all?`,
        expression: `${a} + ${b} = ?`,
        leftExpr: `${a} + ${b}`,
        rightExpr: null,
        answer: ans,
        choices: buildNumericChoices(ans, [Math.abs(a - b), ans + 1, ans - 1, ans + 2]),
        manipulativeType: 'tenFrame',
        operands: [a, b],
        targetRange: [0, maxN],
        meta: { storyEmoji: theme.emoji, storyItems: theme.items, whole: ans, parts: [a, b] },
      });
    } else {
      const a = randInt(Math.min(5, maxN), maxN);
      const b = randInt(1, Math.max(1, a - 1));
      const ans = a - b;
      return makeProblemSpec({
        key: `word-s-sub:${a}-${b}:${theme.items}`,
        tier,
        skillTag: 'word_1step_sub',
        operation: 'word',
        format: 'word',
        promptText: `Eevee had ${a} ${theme.items} and shared ${b} with friends. How many ${theme.items} are left?`,
        spokenPrompt: `Eevee had ${a} ${theme.items} and shared ${b} with friends. How many ${theme.items} are left?`,
        expression: `${a} - ${b} = ?`,
        leftExpr: `${a} - ${b}`,
        rightExpr: null,
        answer: ans,
        choices: buildNumericChoices(ans, [a + b, ans + 1, ans - 1, b]),
        manipulativeType: 'partWhole',
        operands: [a, b],
        targetRange: [0, a],
        meta: { storyEmoji: theme.emoji, storyItems: theme.items, whole: a, parts: [b, ans] },
      });
    }
  }

  if (tier === 'explorer') {
    const maxN = Math.min(100, cap);
    // Coin counting or 2-digit 1-step word problem
    if (maxN >= 35 && Math.random() < 0.45) {
      const quarters = randInt(1, Math.min(3, Math.floor(maxN / 25)));
      const remAfterQ = maxN - quarters * 25;
      const dimes = randInt(1, Math.max(1, Math.min(4, Math.floor(remAfterQ / 10))));
      const remAfterD = remAfterQ - dimes * 10;
      const fives = remAfterD >= 5 ? randInt(0, Math.min(2, Math.floor(remAfterD / 5))) : 0;
      const ans = quarters * 25 + dimes * 10 + fives * 5;
      const coinText = fives > 0
        ? `${quarters} 25-Coin tokens, ${dimes} 10-Coin tokens, and ${fives} 5-Coin tokens`
        : `${quarters} 25-Coin tokens and ${dimes} 10-Coin tokens`;

      return makeProblemSpec({
        key: `word-coins:${quarters}q-${dimes}d-${fives}n`,
        tier,
        skillTag: 'coin_counting',
        operation: 'word',
        format: 'word',
        promptText: `At the Poké Mart, Trainer Red counts ${coinText}. How many Poké-Coins total?`,
        spokenPrompt: `At the Poké Mart, Trainer Red counts ${coinText}. How many Poké-Coins total?`,
        expression: `${quarters * 25} + ${dimes * 10}${fives ? ` + ${fives * 5}` : ''} = ?`,
        leftExpr: `${quarters * 25} + ${dimes * 10}${fives ? ` + ${fives * 5}` : ''}`,
        rightExpr: null,
        answer: ans,
        choices: buildNumericChoices(ans, [ans + 5, ans - 5, ans + 10, quarters + dimes + fives]),
        manipulativeType: 'base10',
        operands: [quarters * 25, dimes * 10 + fives * 5],
        targetRange: [0, maxN],
        meta: { storyEmoji: '🪙', storyItems: 'Poké-Coins', whole: ans, parts: [quarters * 25, dimes * 10 + fives * 5] },
      });
    }

    const a = randInt(Math.min(18, maxN), maxN);
    const b = randInt(1, Math.max(1, Math.min(a - 1, maxN - a > 12 ? maxN - a : a - 1)));
    const useAdd = a + b <= maxN && Math.random() < 0.5;
    const ans = useAdd ? a + b : a - b;
    return makeProblemSpec({
      key: `word-e:${useAdd ? 'add' : 'sub'}:${a}:${b}`,
      tier,
      skillTag: 'word_1step_100',
      operation: 'word',
      format: 'word',
      promptText: useAdd
        ? `Trainer Misty collected ${a} ${theme.items} on Monday and ${b} more on Tuesday. How many ${theme.items} does she have now?`
        : `A Ranger had ${a} ${theme.items} in camp and gave ${b} to wild Pokémon. How many ${theme.items} remain?`,
      spokenPrompt: useAdd
        ? `Trainer Misty collected ${a} ${theme.items} on Monday and ${b} more on Tuesday. How many ${theme.items} does she have now?`
        : `A Ranger had ${a} ${theme.items} in camp and gave ${b} to wild Pokémon. How many ${theme.items} remain?`,
      expression: useAdd ? `${a} + ${b} = ?` : `${a} - ${b} = ?`,
      leftExpr: useAdd ? `${a} + ${b}` : `${a} - ${b}`,
      rightExpr: null,
      answer: ans,
      choices: buildNumericChoices(ans, [useAdd ? Math.abs(a - b) : a + b, ans + 10, ans - 10, ans + 1]),
      manipulativeType: 'base10',
      operands: [a, b],
      targetRange: [0, maxN],
      meta: { storyEmoji: theme.emoji, storyItems: theme.items, whole: useAdd ? ans : a, parts: useAdd ? [a, b] : [b, ans] },
    });
  }

  if (tier === 'ace') {
    const groups = randInt(2, Math.min(9, Math.max(2, Math.floor(cap / 2))));
    const perGroup = randInt(2, Math.min(12, Math.max(2, Math.floor(cap / groups))));
    const total = groups * perGroup;
    const isDiv = Math.random() < 0.5;
    const ans = isDiv ? perGroup : total;

    return makeProblemSpec({
      key: `word-ace:${isDiv ? 'div' : 'mul'}:${groups}:${perGroup}`,
      tier,
      skillTag: isDiv ? 'word_equal_sharing' : 'word_equal_groups',
      operation: 'word',
      format: 'word',
      promptText: isDiv
        ? `${total} ${theme.items} are shared equally among ${groups} Pokémon. How many ${theme.items} does each Pokémon get?`
        : `There are ${groups} picnic baskets with ${perGroup} ${theme.items} in each. How many ${theme.items} altogether?`,
      spokenPrompt: isDiv
        ? `${total} ${theme.items} are shared equally among ${groups} Pokémon. How many ${theme.items} does each Pokémon get?`
        : `There are ${groups} picnic baskets with ${perGroup} ${theme.items} in each. How many ${theme.items} altogether?`,
      expression: isDiv ? `${total} ÷ ${groups} = ?` : `${groups} × ${perGroup} = ?`,
      leftExpr: isDiv ? `${total} ÷ ${groups}` : `${groups} × ${perGroup}`,
      rightExpr: null,
      answer: ans,
      choices: buildNumericChoices(ans, [groups + perGroup, ans + 1, ans - 1, isDiv ? groups : total + groups]),
      manipulativeType: 'berryArray',
      operands: isDiv ? [total, groups] : [groups, perGroup],
      targetRange: [0, Math.max(20, total)],
      meta: { storyEmoji: theme.emoji, storyItems: theme.items, rows: groups, cols: perGroup, whole: total, parts: [groups, perGroup] },
    });
  }

  // Champion: 2-step word problems!
  const boxes = randInt(2, Math.min(8, Math.max(2, Math.floor(cap / 6))));
  const perBox = randInt(3, Math.min(12, Math.max(3, Math.floor(cap / (boxes + 1)))));
  const subTotal = boxes * perBox;
  const useSubtractStep = subTotal >= 10 && Math.random() < 0.5;
  const extra = useSubtractStep
    ? randInt(2, Math.max(2, Math.min(15, subTotal - 1)))
    : randInt(2, Math.max(2, Math.min(18, Math.max(2, cap - subTotal))));

  const ans = useSubtractStep ? subTotal - extra : subTotal + extra;
  return makeProblemSpec({
    key: `word-champ:${boxes}x${perBox}${useSubtractStep ? '-' : '+'}${extra}`,
    tier,
    skillTag: 'word_2step_champion',
    operation: 'word',
    format: 'word',
    promptText: useSubtractStep
      ? `Champion Cynthia packs ${boxes} cases of ${perBox} ${theme.items}, then trades away ${extra}. How many ${theme.items} remain?`
      : `Champion Leon packs ${boxes} cases of ${perBox} ${theme.items} and finds ${extra} more on Victory Summit. How many ${theme.items} in total?`,
    spokenPrompt: useSubtractStep
      ? `Champion Cynthia packs ${boxes} cases of ${perBox} ${theme.items}, then trades away ${extra}. How many ${theme.items} remain?`
      : `Champion Leon packs ${boxes} cases of ${perBox} ${theme.items} and finds ${extra} more on Victory Summit. How many ${theme.items} in total?`,
    expression: `(${boxes} × ${perBox}) ${useSubtractStep ? '-' : '+'} ${extra} = ?`,
    leftExpr: `(${boxes} × ${perBox}) ${useSubtractStep ? '-' : '+'} ${extra}`,
    rightExpr: null,
    answer: ans,
    choices: buildNumericChoices(ans, [subTotal, boxes + perBox + extra, ans + 5, useSubtractStep ? subTotal + extra : subTotal - extra]),
    manipulativeType: 'partWhole',
    operands: [boxes, perBox, extra],
    targetRange: [0, Math.max(cap, ans + 10)],
    meta: {
      storyEmoji: theme.emoji,
      storyItems: theme.items,
      rows: boxes,
      cols: perBox,
      whole: ans,
      parts: [subTotal, extra],
      orderSteps: {
        step1Expr: `${boxes} × ${perBox}`,
        step1Val: subTotal,
        step2Op: `${useSubtractStep ? '-' : '+'} ${extra}`,
      },
    },
  });
}

/* ============================================================================
 * Operation Selection & Route Weighting
 * ============================================================================ */

const TIER_DEFAULT_OPS = {
  starter: ['add', 'add', 'sub', 'sub', 'placeValue', 'word'],
  explorer: ['add', 'sub', 'placeValue', 'comparison', 'mul', 'word'],
  ace: ['mul', 'mul', 'div', 'div', 'add', 'sub', 'fraction', 'word'],
  champion: ['mul', 'div', 'orderOfOps', 'fraction', 'balanced', 'word', 'comparison'],
};

const ROUTE_DOMAIN_OPS = {
  'route-1': ['add', 'word'], // Sprout Meadow: Addition, Making 10, Number Bonds
  'route-2': ['sub', 'add', 'word'], // Pebble Cavern: Subtraction & Missing Addends
  'route-3': ['placeValue', 'comparison', 'add'], // Harbor Lighthouse: Place Value, <=>, Skip Counting
  'route-4': ['mul', 'word'], // Volt Ridge: Multiplication Arrays & Times Tables
  'route-5': ['div', 'fraction', 'word'], // Mystic Rapids: Division Sharing, Fact Families, Fractions
  'route-6': ['word', 'orderOfOps', 'balanced', 'mul', 'div', 'fraction'], // Victory Summit
};

const VALID_OPERATIONS = new Set([
  'add',
  'sub',
  'mul',
  'div',
  'placeValue',
  'comparison',
  'fraction',
  'word',
  'orderOfOps',
  'balanced',
]);

const FORMAT_COMPATIBLE_OPS = {
  numeric: ['add', 'sub', 'mul', 'div', 'orderOfOps'],
  missing: ['add', 'sub', 'mul', 'div', 'fraction', 'balanced'],
  comparison: ['comparison'],
  fraction: ['fraction'],
  word: ['word'],
  array: ['mul'],
  placeValue: ['placeValue'],
  numberLine: ['add'],
};

function chooseOperation(tier, routeId, forcedOp, customFilter, criticalChallenge, preferredFormat) {
  if (forcedOp && VALID_OPERATIONS.has(forcedOp)) {
    return forcedOp;
  }

  let allowed = [...TIER_DEFAULT_OPS[tier]];

  if (customFilter && customFilter.enabled && Array.isArray(customFilter.operations)) {
    const filtered = customFilter.operations.filter((op) => VALID_OPERATIONS.has(op));
    if (filtered.length > 0) {
      allowed = filtered;
    }
  }

  if (preferredFormat && FORMAT_COMPATIBLE_OPS[preferredFormat]) {
    const fmtOps = FORMAT_COMPATIBLE_OPS[preferredFormat];
    const fmtAllowed = fmtOps.filter((op) => allowed.includes(op));
    if (fmtAllowed.length > 0) {
      return pick(fmtAllowed);
    }
    if (!customFilter?.enabled) {
      return pick(fmtOps);
    }
  }

  if (routeId && ROUTE_DOMAIN_OPS[routeId]) {
    const routeOps = ROUTE_DOMAIN_OPS[routeId];
    const intersection = routeOps.filter((op) => allowed.includes(op));
    // Weight route operations strongly (75%) when compatible with tier/filter
    if (intersection.length > 0 && Math.random() < 0.75) {
      return pick(intersection);
    }
  }

  if (criticalChallenge) {
    const stretchCandidates = allowed.filter((op) =>
      ['word', 'orderOfOps', 'balanced', 'fraction', 'mul', 'div', 'comparison'].includes(op)
    );
    if (stretchCandidates.length > 0 && Math.random() < 0.7) {
      return pick(stretchCandidates);
    }
  }

  return pick(allowed);
}

function dispatchGenerator(op, ctx) {
  switch (op) {
    case 'add':
      return genAdd(ctx);
    case 'sub':
      return genSub(ctx);
    case 'mul':
      return genMul(ctx);
    case 'div':
      return genDiv(ctx);
    case 'placeValue':
      return genPlaceValue(ctx);
    case 'comparison':
      return genComparison(ctx);
    case 'fraction':
      return genFraction(ctx);
    case 'orderOfOps':
      return genOrderOfOps(ctx);
    case 'balanced':
      return genBalanced(ctx);
    case 'word':
      return genWord(ctx);
    default:
      return genAdd(ctx);
  }
}

function isProblemValid(prob) {
  if (!prob || !prob.choices || !Array.isArray(prob.choices)) return false;

  if (prob.format === 'comparison') {
    if (!['<', '=', '>'].includes(prob.answer)) return false;
    return prob.choices.length === 3 && prob.choices.includes(prob.answer);
  }

  if (prob.format === 'fraction') {
    if (typeof prob.answer !== 'string' || !/^\d+\/\d+$/.test(prob.answer)) return false;
    const [an, ad] = prob.answer.split('/').map(Number);
    if (ad <= 0) return false;
    if (prob.choices.length !== 4 || !prob.choices.includes(prob.answer)) return false;
    return new Set(prob.choices.map(String)).size === 4;
  }

  if (typeof prob.answer !== 'number' || !Number.isFinite(prob.answer) || prob.answer < 0) {
    return false;
  }
  if (!Number.isInteger(prob.answer)) return false;
  if (prob.choices.length !== 4 || !prob.choices.includes(prob.answer)) return false;
  if (prob.choices.some((c) => typeof c !== 'number' || !Number.isFinite(c) || c < 0)) return false;
  return new Set(prob.choices.map(String)).size === 4;
}

/**
 * Generates a normalized, invariant-checked ProblemSpec.
 * @param {Object} options
 */
export function generateProblem(options = {}) {
  const tier = normalizeTier(options.tier);
  const routeId = options.routeId || null;
  const forcedOp = options.operation || null;
  const preferredFormat = options.format || null;
  const customFilter = options.customFilter || null;
  const difficultyAdjustment = Number(options.difficultyAdjustment) || 0;
  const criticalChallenge = Boolean(options.criticalChallenge);

  const cap = getEffectiveCap(tier, customFilter, difficultyAdjustment, criticalChallenge);
  let lastValid = null;

  for (let attempt = 0; attempt < MAX_RETRY_CAP; attempt++) {
    const op = chooseOperation(tier, routeId, forcedOp, customFilter, criticalChallenge, preferredFormat);
    const candidate = dispatchGenerator(op, {
      tier,
      routeId,
      cap,
      customFilter,
      difficultyAdjustment,
      criticalChallenge,
      preferredFormat,
    });

    if (!isProblemValid(candidate)) continue;
    lastValid = candidate;

    if (!historyRing.includes(candidate.key)) {
      recordHistoryKey(candidate.key);
      return candidate;
    }
  }

  // Deterministic fallback if narrow custom filter exhausted unique keys
  if (lastValid) {
    recordHistoryKey(lastValid.key);
    return lastValid;
  }

  const safeFallback = genAdd({
    tier,
    routeId,
    cap: Math.max(2, cap),
    customFilter,
    difficultyAdjustment,
    criticalChallenge,
    preferredFormat: 'numeric',
  });
  recordHistoryKey(safeFallback.key);
  return safeFallback;
}

/**
 * Validates a user's answer against a ProblemSpec.
 * Handles finite numbers, numeric strings, '<'|'='|'>', and fraction strings.
 */
export function validateAnswer(problem, userAnswer) {
  if (!problem || userAnswer === null || userAnswer === undefined || typeof userAnswer === 'boolean') {
    return false;
  }

  const raw = String(userAnswer).trim();
  if (raw === '') return false;

  const expected = problem.answer;

  if (problem.format === 'comparison' || expected === '<' || expected === '=' || expected === '>') {
    return raw === expected;
  }

  if (problem.format === 'fraction' || (typeof expected === 'string' && expected.includes('/'))) {
    const normUser = raw.replace(/\s+/g, '');
    const normExp = String(expected).replace(/\s+/g, '');
    if (normUser === normExp) return true;

    const matchUser = normUser.match(/^(-?\d+)\/(-?\d+)$/);
    const matchExp = normExp.match(/^(-?\d+)\/(-?\d+)$/);
    if (!matchUser || !matchExp) return false;

    const un = Number(matchUser[1]);
    const ud = Number(matchUser[2]);
    const en = Number(matchExp[1]);
    const ed = Number(matchExp[2]);
    if (ud === 0 || ed === 0) return false;
    return un * ed === en * ud;
  }

  if (typeof userAnswer === 'number') {
    return Number.isFinite(userAnswer) && Math.abs(userAnswer - Number(expected)) < 1e-9;
  }

  if (!/^-?\d+(\.\d+)?$/.test(raw)) return false;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && Math.abs(parsed - Number(expected)) < 1e-9;
}

/**
 * Generates a 3-move battle problem set:
 * - quick: easier warm-up
 * - power: grade-level target (honoring adaptive difficultyAdjustment)
 * - charge: stretch challenge
 */
export function generateMoveSetProblems(tier, filterConfig = null, adaptiveState = null, routeId = null) {
  const safeTier = normalizeTier(tier);
  const powerAdj = Number(adaptiveState?.difficultyAdjustment) || 0;

  const quick = generateProblem({
    tier: safeTier,
    routeId,
    customFilter: filterConfig,
    difficultyAdjustment: -1,
    criticalChallenge: false,
  });

  const power = generateProblem({
    tier: safeTier,
    routeId,
    customFilter: filterConfig,
    difficultyAdjustment: powerAdj,
    criticalChallenge: false,
  });

  const charge = generateProblem({
    tier: safeTier,
    routeId,
    customFilter: filterConfig,
    difficultyAdjustment: 1,
    criticalChallenge: true,
  });

  return { quick, power, charge };
}
