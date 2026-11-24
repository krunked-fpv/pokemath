/**
 * PokéMath 3-Tier Progressive Hint & Manipulative Configuration Builder
 * Pure ES Module — zero browser/DOM dependencies (100% Node-safe).
 */

const VALID_MANIPULATIVES = new Set([
  'tenFrame',
  'numberLine',
  'base10',
  'berryArray',
  'partWhole',
  'comparisonScale',
]);

function safeNum(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function resolveManipulativeType(problem) {
  if (problem && VALID_MANIPULATIVES.has(problem.manipulativeType)) {
    return problem.manipulativeType;
  }
  const op = problem?.operation;
  if (op === 'comparison' || op === 'balanced') return 'comparisonScale';
  if (op === 'placeValue') return 'base10';
  if (op === 'mul' || op === 'div' || op === 'fraction') return 'berryArray';
  if (problem?.format === 'numberLine') return 'numberLine';
  if (problem?.tier === 'starter' && (op === 'add' || op === 'sub')) return 'tenFrame';
  return 'partWhole';
}

function buildManipulativeConfig(type, problem) {
  const ops = Array.isArray(problem?.operands) ? problem.operands : [];
  const meta = problem?.meta || {};
  const op = problem?.operation || 'add';
  const format = problem?.format || 'numeric';

  if (type === 'tenFrame') {
    const a = Math.max(0, safeNum(ops[0], 5));
    const b = Math.max(0, safeNum(ops[1], 0));
    if (meta.makeTen || (format === 'missing' && op === 'add' && b === 10)) {
      return {
        target: 10,
        filledA: Math.min(10, a),
        filledB: 0,
        mode: 'makeTen',
      };
    }
    if (format === 'missing' && op === 'add') {
      const whole = Math.max(10, safeNum(meta.whole, Math.max(a, b)));
      return {
        target: whole <= 10 ? 10 : 20,
        filledA: Math.min(20, a),
        filledB: 0,
        mode: 'missing',
      };
    }
    if (op === 'sub') {
      return {
        target: a <= 10 ? 10 : 20,
        filledA: Math.min(20, a),
        filledB: Math.min(20, b),
        mode: 'sub',
      };
    }
    const target = a + b <= 10 ? 10 : 20;
    return {
      target,
      filledA: Math.min(20, a),
      filledB: Math.min(20, b),
      mode: 'add',
    };
  }

  if (type === 'numberLine') {
    if (meta.numberLine && typeof meta.numberLine === 'object') {
      const nl = meta.numberLine;
      return {
        min: safeNum(nl.min, 0),
        max: safeNum(nl.max, 20),
        step: Math.max(1, safeNum(nl.step, 1)),
        start: safeNum(nl.start, 0),
        jump: safeNum(nl.jump, 1),
        target: safeNum(nl.target, 10),
      };
    }
    const a = safeNum(ops[0], 0);
    const b = safeNum(ops[1], 1);
    const jump = op === 'sub' ? -Math.abs(b) : b;
    const end = Math.max(0, a + jump);
    const maxBound = Math.max(20, a + Math.abs(jump), end + 2);
    return {
      min: 0,
      max: maxBound,
      step: maxBound > 40 ? 10 : 1,
      start: a,
      jump,
      target: end,
    };
  }

  if (type === 'base10') {
    if (meta.placeDigits && typeof meta.placeDigits === 'object') {
      const pd = meta.placeDigits;
      return {
        hundreds: Math.max(0, safeNum(pd.hundreds, 0)),
        tens: Math.max(0, safeNum(pd.tens, 0)),
        ones: Math.max(0, safeNum(pd.ones, 0)),
        target: Math.max(0, safeNum(pd.number, 0)),
        askPlace: pd.askPlace || 'compose',
      };
    }
    const base = Math.max(0, safeNum(ops[0], 10));
    const second = Math.max(0, safeNum(ops[1], 0));
    const h = Math.floor(base / 100);
    const t = Math.floor((base % 100) / 10);
    const o = base % 10;
    return {
      hundreds: h,
      tens: t,
      ones: o,
      target: base,
      op,
      secondHundreds: Math.floor(second / 100),
      secondTens: Math.floor((second % 100) / 10),
      secondOnes: second % 10,
    };
  }

  if (type === 'berryArray') {
    if (meta.fractionData && typeof meta.fractionData === 'object') {
      const fd = meta.fractionData;
      const cols = Math.max(1, safeNum(meta.cols, safeNum(fd.rightDen || fd.denominator, 4)));
      const rows = Math.max(1, safeNum(meta.rows, safeNum(fd.multiplier, 1)));
      return {
        rows,
        cols,
        mode: fd.multiplier ? 'equivFraction' : 'fraction',
        shaded: Math.max(0, safeNum(fd.shaded, safeNum(fd.numerator, 1))),
        total: Math.max(1, safeNum(fd.total, rows * cols)),
      };
    }
    const rows = Math.max(1, Math.min(12, safeNum(meta.rows, safeNum(ops[0], 2))));
    const cols = Math.max(1, Math.min(12, safeNum(meta.cols, safeNum(ops[1], 3))));
    return {
      rows,
      cols,
      mode: op === 'div' ? 'div' : 'mul',
    };
  }

  if (type === 'comparisonScale') {
    const cmp = meta.comparison || {};
    const leftVal = safeNum(cmp.leftVal, safeNum(ops[0], 0));
    const rightVal = safeNum(cmp.rightVal, safeNum(ops[1], 0));
    return {
      leftExpr: String(problem?.leftExpr || leftVal),
      leftVal,
      rightExpr: String(problem?.rightExpr || rightVal),
      rightVal,
    };
  }

  // partWhole (default fallback)
  const parts = Array.isArray(meta.parts) ? meta.parts : [ops[0] ?? null, ops[1] ?? null];
  const rawWhole = meta.whole !== null && meta.whole !== undefined ? safeNum(meta.whole, null) : null;
  let unknown = 'whole';
  let whole = rawWhole;
  let left = parts[0] !== null && parts[0] !== undefined ? safeNum(parts[0], null) : null;
  let right = parts[1] !== null && parts[1] !== undefined ? safeNum(parts[1], null) : null;

  if (format === 'missing') {
    if (left === null || meta.missingSide === 'left' || meta.missingSide === 'subtrahend') {
      unknown = 'left';
      left = null;
    } else {
      unknown = 'right';
      right = null;
    }
  } else if (op === 'sub' && whole !== null) {
    unknown = 'right';
    left = safeNum(ops[1], left);
    right = null;
  } else {
    unknown = 'whole';
    whole = null;
    if (left === null) left = safeNum(ops[0], 0);
    if (right === null) right = safeNum(ops[1], 0);
  }

  return {
    whole,
    left,
    right,
    unknown,
  };
}

function buildAddHints(problem, config) {
  const ops = Array.isArray(problem.operands) ? problem.operands : [0, 0];
  const a = safeNum(ops[0], 0);
  const b = safeNum(ops[1], 0);
  const meta = problem.meta || {};

  if (problem.format === 'numberLine') {
    const step = config.step || 2;
    const prev = safeNum(ops[0], config.start || 0);
    return {
      tier1: {
        headline: `Count by ${step}s!`,
        nudgeText: `Each hop on the number line adds ${step} from the previous number.`,
        spokenText: `Each hop on the number line adds ${step}.`,
      },
      tier2Prompt: `Tap along the number line in jumps of ${step} starting at ${prev}.`,
      steps: [
        {
          label: 'Step 1',
          highlight: `Notice the pattern jumps by +${step} each step`,
          formula: `Pattern step: +${step}`,
        },
        {
          label: 'Step 2',
          highlight: `Make one jump of ${step} from ${prev}`,
          formula: `${prev} + ${step} = ?`,
        },
      ],
    };
  }

  if (problem.format === 'missing') {
    const whole = safeNum(meta.whole, b || 10);
    const isMakeTen = Boolean(meta.makeTen || whole === 10);
    return {
      tier1: {
        headline: isMakeTen ? 'Fill the Ten-Frame!' : 'Think Part + Part = Whole!',
        nudgeText: isMakeTen
          ? `Start with ${a} counters in the Ten-Frame and see how many spaces remain to reach 10.`
          : `You know the whole (${whole}) and one part (${a}). Count up from ${a} to ${whole}!`,
        spokenText: isMakeTen
          ? `Start with ${a} and count how many spaces remain to reach 10.`
          : `Count up from ${a} to reach ${whole}.`,
      },
      tier2Prompt: isMakeTen
        ? `Tap the empty slots to fill the Ten-Frame from ${a} up to 10.`
        : `Use the Part-Whole bond to find what pairs with ${a} to make ${whole}.`,
      steps: [
        {
          label: 'Step 1',
          highlight: `Identify the total target (${whole}) and known part (${a})`,
          formula: `${a} + ? = ${whole}`,
        },
        {
          label: 'Step 2',
          highlight: `Subtract the known part from the whole`,
          formula: `${whole} - ${a} = ?`,
        },
      ],
    };
  }

  // Bridging 10 for starter single-digit sums > 10
  if (a > 0 && a < 10 && b > 0 && b <= 10 && a + b > 10) {
    const need = 10 - a;
    const leftover = b - need;
    return {
      tier1: {
        headline: 'Make a Ten First!',
        nudgeText: `Split ${b} into ${need} and ${leftover} so ${a} + ${need} completes a full 10 first.`,
        spokenText: `Split ${b} into ${need} and ${leftover} so ${a} plus ${need} makes 10 first.`,
      },
      tier2Prompt: 'Tap tokens to fill the first Ten-Frame to 10, then place the extras!',
      steps: [
        {
          label: 'Step 1',
          highlight: `Fill the first 10 using ${need} from ${b}`,
          formula: `${a} + ${need} = 10`,
        },
        {
          label: 'Step 2',
          highlight: `Now add the leftover ${leftover}`,
          formula: `10 + ${leftover} = ?`,
        },
      ],
    };
  }

  // Multi-digit addition (2-digit or 3-digit)
  if (a >= 10 && b >= 10) {
    const aBig = a >= 100 ? Math.floor(a / 100) * 100 : Math.floor(a / 10) * 10;
    const bBig = b >= 100 ? Math.floor(b / 100) * 100 : Math.floor(b / 10) * 10;
    const aRest = a - aBig;
    const bRest = b - bBig;
    const bigSum = aBig + bBig;
    const restSum = aRest + bRest;

    if (restSum > 0) {
      return {
        tier1: {
          headline: 'Add Place Values Separately!',
          nudgeText: `Add the big parts (${aBig} + ${bBig}) first, then combine the rest (${aRest} + ${bRest}).`,
          spokenText: `Add ${aBig} plus ${bBig} first, then combine ${aRest} plus ${bRest}.`,
        },
        tier2Prompt: 'Group the Base-10 blocks by hundreds, tens, and ones.',
        steps: [
          {
            label: 'Step 1',
            highlight: `Add the larger place values`,
            formula: `${aBig} + ${bBig} = ${bigSum}`,
          },
          {
            label: 'Step 2',
            highlight: `Add the remaining parts`,
            formula: `${aRest} + ${bRest} = ${restSum}`,
          },
          {
            label: 'Step 3',
            highlight: `Combine both subtotals`,
            formula: `${bigSum} + ${restSum} = ?`,
          },
        ],
      };
    }
  }

  return {
    tier1: {
      headline: 'Count On Together!',
      nudgeText: `Start at the larger number ${Math.max(a, b)} and count on ${Math.min(a, b)} more.`,
      spokenText: `Start at ${Math.max(a, b)} and count on ${Math.min(a, b)} more.`,
    },
    tier2Prompt: 'Use the interactive model to join the two groups together.',
    steps: [
      {
        label: 'Step 1',
        highlight: `Start with ${Math.max(a, b)}`,
        formula: `Start: ${Math.max(a, b)}`,
      },
      {
        label: 'Step 2',
        highlight: `Add ${Math.min(a, b)} more`,
        formula: `${Math.max(a, b)} + ${Math.min(a, b)} = ?`,
      },
    ],
  };
}

function buildSubHints(problem) {
  const ops = Array.isArray(problem.operands) ? problem.operands : [10, 4];
  const a = safeNum(ops[0], 10);
  const b = safeNum(ops[1], 4);

  if (problem.format === 'missing') {
    return {
      tier1: {
        headline: 'Compare Whole and Remaining!',
        nudgeText: `Start at ${a} and find how many you take away to land on ${b}.`,
        spokenText: `Start at ${a} and find how many you take away to reach ${b}.`,
      },
      tier2Prompt: `Explore the Part-Whole diagram showing whole ${a} and remaining part ${b}.`,
      steps: [
        {
          label: 'Step 1',
          highlight: `Whole is ${a}, remaining part is ${b}`,
          formula: `${a} - ? = ${b}`,
        },
        {
          label: 'Step 2',
          highlight: `Subtract ${b} from ${a} to find the missing part`,
          formula: `${a} - ${b} = ?`,
        },
      ],
    };
  }

  if (a >= 20 && b >= 11 && b % 10 !== 0) {
    const tens = Math.floor(b / 10) * 10;
    const ones = b % 10;
    const mid = a - tens;
    return {
      tier1: {
        headline: 'Subtract Tens, Then Ones!',
        nudgeText: `Break ${b} into ${tens} and ${ones}. Take away ${tens} first, then take away ${ones}.`,
        spokenText: `Break ${b} into ${tens} and ${ones}. Subtract ${tens} first, then ${ones}.`,
      },
      tier2Prompt: 'Step back on the Number Line or remove Base-10 rods first, then ones.',
      steps: [
        {
          label: 'Step 1',
          highlight: `Subtract the tens (${tens}) from ${a}`,
          formula: `${a} - ${tens} = ${mid}`,
        },
        {
          label: 'Step 2',
          highlight: `Now subtract the remaining ${ones}`,
          formula: `${mid} - ${ones} = ?`,
        },
      ],
    };
  }

  return {
    tier1: {
      headline: 'Hop Backwards!',
      nudgeText: `Start at ${a} and jump back ${b} steps to find what remains.`,
      spokenText: `Start at ${a} and jump back ${b} steps.`,
    },
    tier2Prompt: `Start at ${a} on the model and take away ${b}.`,
    steps: [
      {
        label: 'Step 1',
        highlight: `Place your marker at ${a}`,
        formula: `Start: ${a}`,
      },
      {
        label: 'Step 2',
        highlight: `Take away ${b} from ${a}`,
        formula: `${a} - ${b} = ?`,
      },
    ],
  };
}

function buildMulHints(problem) {
  const ops = Array.isArray(problem.operands) ? problem.operands : [3, 4];
  const meta = problem.meta || {};

  if (problem.format === 'missing') {
    const b = Math.max(1, safeNum(ops[0], 2));
    const prod = safeNum(ops[1], b * 2);
    return {
      tier1: {
        headline: 'Use the Multiplication Array!',
        nudgeText: `Think: how many rows of ${b} make ${prod} total berries?`,
        spokenText: `How many groups of ${b} make ${prod}?`,
      },
      tier2Prompt: `Count how many rows of ${b} berries fill the array to ${prod}.`,
      steps: [
        {
          label: 'Step 1',
          highlight: `Match multiplication with its division fact`,
          formula: `? × ${b} = ${prod}`,
        },
        {
          label: 'Step 2',
          highlight: `Divide ${prod} by ${b}`,
          formula: `${prod} ÷ ${b} = ?`,
        },
      ],
    };
  }

  const a = safeNum(ops[0], safeNum(meta.rows, 2));
  const b = safeNum(ops[1], safeNum(meta.cols, 3));

  // Multi-digit split (e.g. 24 x 6)
  if (a >= 12) {
    const tens = Math.floor(a / 10) * 10;
    const ones = a % 10;
    if (ones > 0) {
      const part1 = tens * b;
      const part2 = ones * b;
      return {
        tier1: {
          headline: 'Break Apart by Tens & Ones!',
          nudgeText: `Split ${a} into ${tens} + ${ones}, multiply each part by ${b}, then add.`,
          spokenText: `Split ${a} into ${tens} and ${ones}, multiply each by ${b}, then add.`,
        },
        tier2Prompt: 'Inspect the Base-10 partial products to combine tens and ones.',
        steps: [
          {
            label: 'Step 1',
            highlight: `Multiply the tens part: ${tens} × ${b}`,
            formula: `${tens} × ${b} = ${part1}`,
          },
          {
            label: 'Step 2',
            highlight: `Multiply the ones part: ${ones} × ${b}`,
            formula: `${ones} × ${b} = ${part2}`,
          },
          {
            label: 'Step 3',
            highlight: `Add both partial products together`,
            formula: `${part1} + ${part2} = ?`,
          },
        ],
      };
    }
  }

  // Split factor > 5 into 5 + remainder for visual arrays
  if (b > 5 && a >= 2 && a <= 12) {
    const rem = b - 5;
    const p1 = a * 5;
    const p2 = a * rem;
    return {
      tier1: {
        headline: 'Friendly Fives Strategy!',
        nudgeText: `Split ${b} into 5 + ${rem}. Find ${a} × 5 first, then add ${a} × ${rem}!`,
        spokenText: `Split ${b} into 5 and ${rem}. Multiply ${a} times 5 first, then add ${a} times ${rem}.`,
      },
      tier2Prompt: `Explore the ${a} × ${b} Berry Array row by row.`,
      steps: [
        {
          label: 'Step 1',
          highlight: `Find 5 columns first`,
          formula: `${a} × 5 = ${p1}`,
        },
        {
          label: 'Step 2',
          highlight: `Find the extra ${rem} columns`,
          formula: `${a} × ${rem} = ${p2}`,
        },
        {
          label: 'Step 3',
          highlight: `Combine both sections`,
          formula: `${p1} + ${p2} = ?`,
        },
      ],
    };
  }

  return {
    tier1: {
      headline: 'Count Equal Rows!',
      nudgeText: `See ${a} × ${b} as ${a} equal rows with ${b} berries in every row.`,
      spokenText: `Think of ${a} equal rows with ${b} berries in each row.`,
    },
    tier2Prompt: `Tap rows in the Berry Array to skip-count by ${b}s.`,
    steps: [
      {
        label: 'Step 1',
        highlight: `${a} equal groups of ${b}`,
        formula: `${a} groups of ${b}`,
      },
      {
        label: 'Step 2',
        highlight: `Multiply rows by columns`,
        formula: `${a} × ${b} = ?`,
      },
    ],
  };
}

function buildDivHints(problem) {
  const ops = Array.isArray(problem.operands) ? problem.operands : [12, 3];
  const dividend = safeNum(ops[0], 12);
  const second = Math.max(1, safeNum(ops[1], 3));

  if (problem.format === 'missing') {
    // dividend / ? = second
    return {
      tier1: {
        headline: 'Flip to Multiplication!',
        nudgeText: `Use the fact family: what number times ${second} equals ${dividend}?`,
        spokenText: `What number times ${second} equals ${dividend}?`,
      },
      tier2Prompt: `Use the Part-Whole fact family connecting ${dividend} and ${second}.`,
      steps: [
        {
          label: 'Step 1',
          highlight: `Rewrite division as a multiplication fact`,
          formula: `? × ${second} = ${dividend}`,
        },
        {
          label: 'Step 2',
          highlight: `Divide total ${dividend} by ${second}`,
          formula: `${dividend} ÷ ${second} = ?`,
        },
      ],
    };
  }

  return {
    tier1: {
      headline: 'Share Equally & Think Multiplication!',
      nudgeText: `Share ${dividend} equally into ${second} groups, or ask: ${second} × ? = ${dividend}.`,
      spokenText: `Share ${dividend} equally into ${second} groups, or ask ${second} times what equals ${dividend}.`,
    },
    tier2Prompt: `Split ${dividend} into ${second} equal rows to see how many land in each group.`,
    steps: [
      {
        label: 'Step 1',
        highlight: `Use the inverse multiplication fact family`,
        formula: `${second} × ? = ${dividend}`,
      },
      {
        label: 'Step 2',
        highlight: `Count the size of each equal group`,
        formula: `${dividend} ÷ ${second} = ?`,
      },
    ],
  };
}

function buildPlaceValueHints(problem) {
  const pd = problem.meta?.placeDigits || {};
  const num = safeNum(pd.number, safeNum(problem.operands?.[0], 42));
  const hundreds = Math.max(0, safeNum(pd.hundreds, Math.floor(num / 100)));
  const tens = Math.max(0, safeNum(pd.tens, Math.floor((num % 100) / 10)));
  const ones = Math.max(0, safeNum(pd.ones, num % 10));
  const askPlace = pd.askPlace || 'compose';

  if (askPlace === 'compose') {
    const parts = [];
    if (hundreds > 0) parts.push(`${hundreds * 100}`);
    if (tens > 0 || hundreds > 0) parts.push(`${tens * 10}`);
    parts.push(`${ones}`);
    return {
      tier1: {
        headline: 'Stack Hundreds, Tens & Ones!',
        nudgeText: 'Line up the place-value blocks from largest to smallest to read the full number.',
        spokenText: 'Line up the hundreds, tens, and ones blocks from largest to smallest.',
      },
      tier2Prompt: 'Inspect the Base-10 flats, rods, and unit cubes.',
      steps: [
        {
          label: 'Step 1',
          highlight: 'Count each place-value block group',
          formula: `${hundreds}H, ${tens}T, ${ones}O`,
        },
        {
          label: 'Step 2',
          highlight: 'Add the place values together',
          formula: `${parts.join(' + ')} = ?`,
        },
      ],
    };
  }

  return {
    tier1: {
      headline: 'Check the Place Column!',
      nudgeText: `Break ${num} into its place columns (Hundreds | Tens | Ones) from right to left.`,
      spokenText: `Break ${num} into hundreds, tens, and ones columns from right to left.`,
    },
    tier2Prompt: 'Examine the Base-10 blocks representing each place column.',
    steps: [
      {
        label: 'Step 1',
        highlight: `Read the columns of ${num} from right (ones) to left`,
        formula: 'Hundreds | Tens | Ones',
      },
      {
        label: 'Step 2',
        highlight: `Focus on the requested ${askPlace} value`,
        formula: `${askPlace} = ?`,
      },
    ],
  };
}

function buildComparisonHints(problem) {
  const cmp = problem.meta?.comparison || {};
  const leftVal = safeNum(cmp.leftVal, safeNum(problem.operands?.[0], 0));
  const rightVal = safeNum(cmp.rightVal, safeNum(problem.operands?.[1], 0));
  const leftExpr = String(problem.leftExpr || leftVal);
  const rightExpr = String(problem.rightExpr || rightVal);

  return {
    tier1: {
      headline: 'Weigh Both Sides of the Scale!',
      nudgeText: 'Find the value on each side first. The open mouth of < or > always faces the larger number!',
      spokenText: 'Find the value on each side first, then point the open mouth toward the larger value.',
    },
    tier2Prompt: 'Watch how the Comparison Scale tilts toward the heavier value.',
    steps: [
      {
        label: 'Step 1',
        highlight: `Check left side (${leftExpr}) and right side (${rightExpr})`,
        formula: `Left: ${leftVal}, Right: ${rightVal}`,
      },
      {
        label: 'Step 2',
        highlight: 'Choose <, =, or > to compare the two values',
        formula: `Compare ${leftVal} [?] ${rightVal}`,
      },
    ],
  };
}

function buildFractionHints(problem) {
  const fd = problem.meta?.fractionData || {};

  if (problem.format === 'missing' && fd.leftDen && fd.rightDen) {
    const mult = Math.max(1, safeNum(fd.multiplier, Math.round(fd.rightDen / fd.leftDen)));
    return {
      tier1: {
        headline: 'Scale Top & Bottom Equally!',
        nudgeText: `Find what multiplies ${fd.leftDen} to become ${fd.rightDen}, then multiply ${fd.leftNum} by that same number!`,
        spokenText: `Find what multiplies ${fd.leftDen} to make ${fd.rightDen}, then multiply ${fd.leftNum} by the same number.`,
      },
      tier2Prompt: 'Look at the Berry Grid rows showing how the fraction scales up equally.',
      steps: [
        {
          label: 'Step 1',
          highlight: `Multiply denominator ${fd.leftDen} to reach ${fd.rightDen}`,
          formula: `${fd.leftDen} × ${mult} = ${fd.rightDen}`,
        },
        {
          label: 'Step 2',
          highlight: `Multiply numerator ${fd.leftNum} by ${mult} as well`,
          formula: `${fd.leftNum} × ${mult} = ?`,
        },
      ],
    };
  }

  const total = Math.max(1, safeNum(fd.total || fd.denominator || problem.operands?.[1], 4));
  return {
    tier1: {
      headline: 'Parts Over Whole!',
      nudgeText: `Count the golden shaded parts for the top number (numerator), and all ${total} equal parts for the bottom (denominator).`,
      spokenText: `Count the shaded parts for the top number, and all ${total} equal parts for the bottom number.`,
    },
    tier2Prompt: 'Inspect the Berry Array fraction bar to count shaded vs. total parts.',
    steps: [
      {
        label: 'Step 1',
        highlight: `Count all ${total} equal parts for the denominator`,
        formula: `Denominator (bottom): ${total}`,
      },
      {
        label: 'Step 2',
        highlight: 'Write shaded parts over total parts',
        formula: `? / ${total}`,
      },
    ],
  };
}

function buildOrderOfOpsHints(problem) {
  const os = problem.meta?.orderSteps;
  if (os && os.step1Expr) {
    return {
      tier1: {
        headline: 'Parentheses Go First!',
        nudgeText: `Always solve inside the parentheses (${os.step1Expr}) before doing anything outside.`,
        spokenText: `Always solve inside the parentheses first, then finish the outside step.`,
      },
      tier2Prompt: 'Follow the two-part breakdown in the Part-Whole diagram.',
      steps: [
        {
          label: 'Step 1',
          highlight: `Solve inside the parentheses: ${os.step1Expr}`,
          formula: `${os.step1Expr} = ${os.step1Val}`,
        },
        {
          label: 'Step 2',
          highlight: 'Apply the remaining operation',
          formula: /^[×+\-÷]/.test(os.step2Op.trim())
            ? `${os.step1Val} ${os.step2Op} = ?`
            : `${os.step2Op} = ?`,
        },
      ],
    };
  }

  const expr = String(problem.leftExpr || problem.expression || 'Expression');
  return {
    tier1: {
      headline: 'Follow Order of Operations!',
      nudgeText: 'Solve parentheses first, then multiplication/division, then addition/subtraction.',
      spokenText: 'Solve parentheses first, then multiply or divide, then add or subtract.',
    },
    tier2Prompt: 'Break the expression into clean parts.',
    steps: [
      {
        label: 'Step 1',
        highlight: 'Identify the innermost group to compute first',
        formula: `${expr} -> ?`,
      },
    ],
  };
}

function buildBalancedHints(problem) {
  const bal = problem.meta?.balanced || {};
  const rightExpr = String(bal.rightExpr || problem.rightExpr || 'right side');
  const rightVal = safeNum(bal.rightVal, safeNum(problem.meta?.whole, 10));
  const knownLeft = safeNum(bal.knownLeft, safeNum(problem.operands?.[0], 1));

  return {
    tier1: {
      headline: 'Balance Both Pans!',
      nudgeText: `First find the total of the complete side (${rightExpr}), then match the left side to that exact value!`,
      spokenText: `First calculate ${rightExpr}, then make the other side equal that same value.`,
    },
    tier2Prompt: 'Use the Comparison Scale to balance both expressions.',
    steps: [
      {
        label: 'Step 1',
        highlight: `Calculate the complete side first`,
        formula: `${rightExpr} = ${rightVal}`,
      },
      {
        label: 'Step 2',
        highlight: `Find what pairs with ${knownLeft} to match ${rightVal}`,
        formula: bal.op === 'mul' ? `${rightVal} ÷ ${knownLeft} = ?` : `${rightVal} - ${knownLeft} = ?`,
      },
    ],
  };
}

function buildWordHints(problem, config, type) {
  const os = problem.meta?.orderSteps;
  if (os && os.step1Expr) {
    return {
      tier1: {
        headline: 'Two-Step Adventure Plan!',
        nudgeText: `First find the group total (${os.step1Expr}), then handle the second change (${os.step2Op}).`,
        spokenText: `Break this story into two steps: first find ${os.step1Expr}, then apply the next step.`,
      },
      tier2Prompt: 'Use the Part-Whole model to track Step 1 and Step 2.',
      steps: [
        {
          label: 'Step 1',
          highlight: `Find the amount in the equal groups`,
          formula: `${os.step1Expr} = ${os.step1Val}`,
        },
        {
          label: 'Step 2',
          highlight: 'Now apply the second step of the story',
          formula: `${os.step1Val} ${os.step2Op} = ?`,
        },
      ],
    };
  }

  const expr = String(problem.leftExpr || problem.expression || '');
  if (expr.includes('÷')) return buildDivHints(problem);
  if (expr.includes('×')) return buildMulHints(problem);
  if (expr.includes('-')) return buildSubHints(problem);
  return buildAddHints(problem, config, type);
}

/**
 * Guarantees the final step formula ALWAYS stops 1 tap short with '?'
 * and never exposes the solved answer.
 */
function sanitizeSteps(steps, problem) {
  const safeSteps = Array.isArray(steps) && steps.length > 0
    ? steps.map((s) => ({
        label: String(s.label || 'Step'),
        highlight: String(s.highlight || 'Check the math model'),
        formula: String(s.formula || '?'),
      }))
    : [{ label: 'Step 1', highlight: 'Look closely at the problem', formula: String(problem?.expression || '?') }];

  const last = safeSteps[safeSteps.length - 1];
  const ansStr = problem?.answer !== undefined && problem?.answer !== null ? String(problem.answer) : '';

  if (ansStr && (last.formula.endsWith(`= ${ansStr}`) || last.formula === ansStr)) {
    last.formula = last.formula.includes('=')
      ? `${last.formula.split('=')[0].trim()} = ?`
      : '?';
  }
  if (!last.formula.includes('?')) {
    last.formula = `${last.formula} -> ?`;
  }
  return safeSteps;
}

/**
 * Builds a guaranteed-safe 3-tier HintBundle for any ProblemSpec.
 * Never throws, always provides >= 1 tier3 step stopping short with '?'.
 */
export function buildHintBundle(problemSpec) {
  const problem = problemSpec && typeof problemSpec === 'object' ? problemSpec : {};
  const type = resolveManipulativeType(problem);
  const config = buildManipulativeConfig(type, problem);
  const op = problem.operation || 'add';

  let built;
  switch (op) {
    case 'sub':
      built = buildSubHints(problem);
      break;
    case 'mul':
      built = buildMulHints(problem);
      break;
    case 'div':
      built = buildDivHints(problem);
      break;
    case 'placeValue':
      built = buildPlaceValueHints(problem);
      break;
    case 'comparison':
      built = buildComparisonHints(problem);
      break;
    case 'fraction':
      built = buildFractionHints(problem);
      break;
    case 'orderOfOps':
      built = buildOrderOfOpsHints(problem);
      break;
    case 'balanced':
      built = buildBalancedHints(problem);
      break;
    case 'word':
      built = buildWordHints(problem, config, type);
      break;
    case 'add':
    default:
      built = buildAddHints(problem, config);
      break;
  }

  return {
    tier1: {
      headline: String(built.tier1?.headline || 'Rotom-Dex Strategy Nudge!'),
      nudgeText: String(built.tier1?.nudgeText || 'Look at the numbers step by step.'),
      spokenText: String(built.tier1?.spokenText || built.tier1?.nudgeText || 'Look at the numbers step by step.'),
    },
    tier2: {
      type,
      interactivePrompt: String(built.tier2Prompt || 'Explore the interactive manipulative below!'),
      config,
    },
    tier3: {
      steps: sanitizeSteps(built.steps, problem),
      finalPrompt: 'Now enter the final answer into your PokéNav!',
    },
  };
}
