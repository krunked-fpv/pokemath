import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TIERS,
  resetHistory,
  generateProblem,
  validateAnswer,
  generateMoveSetProblems,
} from '../js/core/mathEngine.js';
import { buildHintBundle } from '../js/core/hintEngine.js';
import { recordAttempt, getRecommendedProblemConfig } from '../js/core/adaptive.js';
import {
  VAULT_COOKIE_NAME,
  STORAGE_KEY,
  initState,
  getState,
  getActiveProfile,
  switchProfile,
  createProfile,
  deleteProfile,
  updateProfile,
  subscribe,
  exportSaveJSON,
  exportSaveCode,
  importSaveJSON,
  healFromCookieVault,
  syncCookieVault,
} from '../js/core/state.js';
import * as audio from '../js/core/audio.js';
import {
  STARTER_IDS,
  POKEMON_ROSTER,
  POKEMON_BY_ID,
  getPokemonById,
  getEvolutionChain,
} from '../js/data/pokemon.js';
import { ROUTES, getRouteById } from '../js/data/routes.js';
import {
  BERRIES,
  POKEBALLS,
  ACCESSORIES,
  MART_CATALOG,
  QUEST_TEMPLATES,
} from '../js/data/items.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const VALID_MANIPULATIVES = new Set([
  'tenFrame',
  'numberLine',
  'base10',
  'berryArray',
  'partWhole',
  'comparisonScale',
]);

const ROUTE_IDS = ['route-1', 'route-2', 'route-3', 'route-4', 'route-5', 'route-6'];

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertNoDivideByZero(problem) {
  const exprFields = [problem.expression, problem.leftExpr, problem.rightExpr].filter(Boolean);
  for (const expr of exprFields) {
    assert.equal(
      /[÷/]\s*0(?:\b|$)/.test(String(expr)),
      false,
      `Divide-by-zero pattern found in expression "${expr}" (${problem.key})`
    );
  }

  if (problem.operation === 'div') {
    assert.ok(Array.isArray(problem.operands) && problem.operands.length >= 2);
    const dividend = problem.operands[0];
    const second = problem.operands[1];
    assert.ok(second > 0, `Division operand[1] must be > 0, got ${second} (${problem.key})`);

    if (problem.format === 'missing') {
      assert.ok(Number.isInteger(problem.answer) && problem.answer > 0);
      assert.equal(dividend % problem.answer, 0);
      assert.equal(dividend / problem.answer, second);
    } else {
      assert.equal(dividend % second, 0, `Non-exact division ${dividend} / ${second}`);
      assert.equal(problem.answer, dividend / second);
      assert.ok(Number.isInteger(problem.answer), `Expected integer quotient, got ${problem.answer}`);
    }
  }
}

function assertHintBundleValid(problem, bundle, contextLabel) {
  assert.ok(bundle && typeof bundle === 'object', `${contextLabel}: hint bundle must be object`);

  // Tier 1
  assert.ok(bundle.tier1 && typeof bundle.tier1 === 'object', `${contextLabel}: missing tier1`);
  for (const field of ['headline', 'nudgeText', 'spokenText']) {
    assert.equal(typeof bundle.tier1[field], 'string', `${contextLabel}: tier1.${field} must be string`);
    assert.ok(bundle.tier1[field].trim().length > 0, `${contextLabel}: tier1.${field} non-empty`);
  }

  // Tier 2
  assert.ok(bundle.tier2 && typeof bundle.tier2 === 'object', `${contextLabel}: missing tier2`);
  assert.ok(
    VALID_MANIPULATIVES.has(bundle.tier2.type),
    `${contextLabel}: invalid tier2.type "${bundle.tier2.type}"`
  );
  assert.ok(
    bundle.tier2.config !== null &&
      typeof bundle.tier2.config === 'object' &&
      !Array.isArray(bundle.tier2.config),
    `${contextLabel}: tier2.config must be plain object`
  );

  // Tier 3
  assert.ok(bundle.tier3 && typeof bundle.tier3 === 'object', `${contextLabel}: missing tier3`);
  assert.ok(
    Array.isArray(bundle.tier3.steps) && bundle.tier3.steps.length >= 1,
    `${contextLabel}: tier3.steps must have >= 1 step`
  );

  for (let i = 0; i < bundle.tier3.steps.length; i += 1) {
    const step = bundle.tier3.steps[i];
    assert.equal(typeof step.label, 'string');
    assert.ok(step.label.trim().length > 0, `${contextLabel}: step[${i}].label empty`);
    assert.equal(typeof step.highlight, 'string');
    assert.ok(step.highlight.trim().length > 0, `${contextLabel}: step[${i}].highlight empty`);
    assert.equal(typeof step.formula, 'string');
    assert.ok(step.formula.trim().length > 0, `${contextLabel}: step[${i}].formula empty`);
  }

  const lastFormula = bundle.tier3.steps[bundle.tier3.steps.length - 1].formula;
  const ansStr = String(problem.answer);

  assert.ok(
    lastFormula.includes('?'),
    `${contextLabel}: last step formula "${lastFormula}" must stop 1 tap short with '?'`
  );
  assert.notEqual(
    lastFormula.trim(),
    ansStr,
    `${contextLabel}: last step formula "${lastFormula}" leaked bare answer "${ansStr}"`
  );
  assert.equal(
    lastFormula.endsWith(`= ${ansStr}`),
    false,
    `${contextLabel}: last step formula "${lastFormula}" ended with "= ${ansStr}"`
  );

  if (lastFormula.includes('=')) {
    const rhs = lastFormula.split('=').pop().trim();
    assert.ok(rhs.includes('?'), `${contextLabel}: formula RHS "${rhs}" should contain '?'`);
    assert.notEqual(rhs, ansStr, `${contextLabel}: formula RHS "${rhs}" leaked answer "${ansStr}"`);
  }

  if (problem.format === 'fraction') {
    assert.equal(
      lastFormula.includes(ansStr),
      false,
      `${contextLabel}: fraction formula "${lastFormula}" leaked "${ansStr}"`
    );
  }

  if (problem.format === 'comparison') {
    const solvedCmpRegex = new RegExp(`\\d+\\s*${escapeRegExp(ansStr)}\\s*\\d+`);
    assert.equal(
      solvedCmpRegex.test(lastFormula),
      false,
      `${contextLabel}: comparison formula "${lastFormula}" leaked solved operator "${ansStr}"`
    );
  }
}

function assertProblemAndHintValid(problem, contextLabel) {
  assert.ok(problem && typeof problem === 'object', `${contextLabel}: problem must be object`);

  for (const field of ['id', 'key', 'skillTag', 'promptText', 'spokenPrompt', 'expression']) {
    assert.equal(typeof problem[field], 'string', `${contextLabel}: ${field} must be string`);
    assert.ok(problem[field].trim().length > 0, `${contextLabel}: ${field} must be non-empty`);
  }

  assert.notEqual(problem.answer, null, `${contextLabel}: answer must not be null`);
  assert.notEqual(problem.answer, undefined, `${contextLabel}: answer must not be undefined`);
  assert.ok(Array.isArray(problem.choices), `${contextLabel}: choices must be array`);

  if (problem.format === 'comparison') {
    assert.ok(
      ['<', '=', '>'].includes(problem.answer),
      `${contextLabel}: comparison answer invalid: ${problem.answer}`
    );
    assert.equal(problem.choices.length, 3, `${contextLabel}: comparison choices length must be 3`);
    for (const sym of ['<', '=', '>']) {
      assert.ok(problem.choices.includes(sym), `${contextLabel}: choices missing ${sym}`);
    }
  } else if (problem.format === 'fraction') {
    assert.equal(typeof problem.answer, 'string', `${contextLabel}: fraction answer must be string`);
    assert.match(problem.answer, /^\d+\/\d+$/, `${contextLabel}: invalid fraction "${problem.answer}"`);
    const [n, d] = problem.answer.split('/').map(Number);
    assert.ok(Number.isFinite(n) && Number.isFinite(d) && d > 0);
    assert.equal(problem.choices.length, 4, `${contextLabel}: fraction choices length must be 4`);
    assert.ok(problem.choices.includes(problem.answer), `${contextLabel}: choices missing answer`);
    // Ensure no mathematically equivalent fraction duplicates
    const parsedChoices = problem.choices.map((c) => c.split('/').map(Number));
    for (let i = 0; i < parsedChoices.length; i += 1) {
      for (let j = i + 1; j < parsedChoices.length; j += 1) {
        const [n1, d1] = parsedChoices[i];
        const [n2, d2] = parsedChoices[j];
        assert.notEqual(
          n1 * d2,
          n2 * d1,
          `${contextLabel}: equivalent fraction distractors ${n1}/${d1} and ${n2}/${d2}`
        );
      }
    }
  } else {
    assert.equal(typeof problem.answer, 'number', `${contextLabel}: numeric answer expected`);
    assert.ok(Number.isFinite(problem.answer), `${contextLabel}: answer must be finite`);
    assert.ok(Number.isInteger(problem.answer), `${contextLabel}: answer must be integer`);
    assert.ok(problem.answer >= 0, `${contextLabel}: negative answer ${problem.answer} (${problem.key})`);
    if (problem.tier === 'starter' || problem.tier === 'explorer') {
      assert.ok(problem.answer >= 0, `${contextLabel}: starter/explorer must never be negative`);
    }
    assert.equal(problem.choices.length, 4, `${contextLabel}: choices length must be 4`);
    assert.ok(
      problem.choices.includes(problem.answer),
      `${contextLabel}: choices [${problem.choices}] missing answer ${problem.answer}`
    );
    for (const c of problem.choices) {
      assert.ok(typeof c === 'number' && Number.isFinite(c) && c >= 0);
    }
  }

  // Zero duplicate stringified choices
  assert.equal(
    new Set(problem.choices.map(String)).size,
    problem.choices.length,
    `${contextLabel}: duplicate choices in [${problem.choices}]`
  );

  // Exact answer validation + negative validation checks
  assert.equal(validateAnswer(problem, problem.answer), true, `${contextLabel}: validateAnswer exact failed`);
  assert.equal(
    validateAnswer(problem, String(problem.answer)),
    true,
    `${contextLabel}: validateAnswer string failed`
  );
  assert.equal(validateAnswer(problem, null), false);
  assert.equal(validateAnswer(problem, undefined), false);
  assert.equal(validateAnswer(problem, ''), false);
  assert.equal(validateAnswer(problem, true), false);

  assertNoDivideByZero(problem);

  // Ace division must be integer quotient
  if (problem.tier === 'ace' && problem.operation === 'div') {
    assert.ok(Number.isInteger(problem.answer), `${contextLabel}: ace div must yield integer`);
  }

  // 100% Hint Bundle Coverage check
  const bundle = buildHintBundle(problem);
  assertHintBundleValid(problem, bundle, contextLabel);
  return bundle;
}

function createMockStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, val) {
      store.set(String(key), String(val));
    },
    removeItem(key) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    },
    size() {
      return store.size;
    },
  };
}

function createMockCookieDoc() {
  const jar = new Map();
  const writes = [];
  return {
    writes,
    get cookie() {
      return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
    },
    set cookie(line) {
      const str = String(line);
      writes.push(str);
      if (str.trim() === '') {
        jar.clear();
        return;
      }
      const firstPart = str.split(';')[0];
      const eqIdx = firstPart.indexOf('=');
      if (eqIdx > 0) {
        const name = firstPart.slice(0, eqIdx).trim();
        const val = firstPart.slice(eqIdx + 1).trim();
        if (val === '' || /max-age=0\b/i.test(str)) {
          jar.delete(name);
        } else {
          jar.set(name, val);
        }
      }
    },
    clear() {
      jar.clear();
    },
    getValue(name) {
      return jar.get(name) ?? null;
    },
  };
}

/* ============================================================================
 * 1 & 2. 5,000+ Problem Adversarial Stress Suite + 100% Hint Bundle Coverage
 * ============================================================================ */

describe('1 & 2. Math Engine 5,000+ Adversarial Stress & 100% Hint Bundle Coverage', () => {
  beforeEach(() => {
    resetHistory();
  });

  it('generates 1,250 problems per tier across all 4 tiers (5,000 base) with 100% valid math & hints', () => {
    let totalGenerated = 0;
    for (const tier of TIERS) {
      for (let i = 0; i < 1250; i += 1) {
        const p = generateProblem({ tier });
        assert.equal(p.tier, tier);
        assertProblemAndHintValid(p, `tier=${tier}#${i}`);
        totalGenerated += 1;
      }
    }
    assert.equal(totalGenerated, 5000);
  });

  it('handles narrow Parent/Coach customFilter configurations across all tiers cleanly', () => {
    const narrowFilters = [
      { label: 'add<=12', filter: { enabled: true, operations: ['add'], maxNumber: 12 }, expectedOp: 'add', maxAns: 12 },
      { label: 'div-only', filter: { enabled: true, operations: ['div'], maxNumber: null }, expectedOp: 'div', maxAns: null },
      { label: 'cmp-only', filter: { enabled: true, operations: ['comparison'], maxNumber: null }, expectedOp: 'comparison', maxAns: null },
    ];

    let customCount = 0;
    for (const cfg of narrowFilters) {
      for (const tier of TIERS) {
        for (let i = 0; i < 60; i += 1) {
          const p = generateProblem({ tier, customFilter: cfg.filter });
          assert.equal(p.operation, cfg.expectedOp, `${cfg.label} (${tier}) unexpected op ${p.operation}`);
          if (cfg.maxAns !== null && typeof p.answer === 'number') {
            assert.ok(p.answer <= cfg.maxAns, `${cfg.label} answer ${p.answer} exceeded ${cfg.maxAns}`);
          }
          assertProblemAndHintValid(p, `custom=${cfg.label}:${tier}#${i}`);
          customCount += 1;
        }
      }
    }
    assert.equal(customCount, 720);
  });

  it('generates valid problems & hints across all 6 routes and generateMoveSetProblems', () => {
    let routeCount = 0;
    let moveSetCount = 0;

    for (const routeId of ROUTE_IDS) {
      for (const tier of TIERS) {
        for (let i = 0; i < 30; i += 1) {
          const p = generateProblem({ tier, routeId });
          assertProblemAndHintValid(p, `route=${routeId}:${tier}#${i}`);
          routeCount += 1;
        }

        const moveSet = generateMoveSetProblems(tier, null, { difficultyAdjustment: 0 }, routeId);
        assert.ok(moveSet.quick && moveSet.power && moveSet.charge);
        for (const moveType of ['quick', 'power', 'charge']) {
          assertProblemAndHintValid(moveSet[moveType], `moveset=${routeId}:${tier}:${moveType}`);
          moveSetCount += 1;
        }
      }
    }

    assert.equal(routeCount, 720);
    assert.equal(moveSetCount, 72);
  });

  it('validateAnswer handles numeric strings, equivalent fractions, comparisons, and rejects bad inputs', () => {
    const fracProb = { format: 'fraction', answer: '1/2' };
    assert.equal(validateAnswer(fracProb, '1/2'), true);
    assert.equal(validateAnswer(fracProb, ' 2 / 4 '), true);
    assert.equal(validateAnswer(fracProb, '3/6'), true);
    assert.equal(validateAnswer(fracProb, '1/3'), false);
    assert.equal(validateAnswer(fracProb, '1/0'), false);

    const cmpProb = { format: 'comparison', answer: '<' };
    assert.equal(validateAnswer(cmpProb, '<'), true);
    assert.equal(validateAnswer(cmpProb, '>'), false);
    assert.equal(validateAnswer(cmpProb, '='), false);

    const numProb = { format: 'numeric', answer: 14 };
    assert.equal(validateAnswer(numProb, 14), true);
    assert.equal(validateAnswer(numProb, ' 14 '), true);
    assert.equal(validateAnswer(numProb, '14.0'), true);
    assert.equal(validateAnswer(numProb, 'NaN'), false);
    assert.equal(validateAnswer(numProb, '15'), false);
  });

  it('enforces non-negative subtraction in starter/explorer and anti-repeat ring buffer via resetHistory()', () => {
    for (const tier of ['starter', 'explorer']) {
      for (let i = 0; i < 150; i += 1) {
        const subProb = generateProblem({ tier, operation: 'sub' });
        assert.equal(subProb.operation, 'sub');
        assert.ok(subProb.answer >= 0, `${tier} subtraction produced negative ${subProb.answer}`);
        assertProblemAndHintValid(subProb, `sub-check=${tier}#${i}`);
      }
    }

    resetHistory();
    const seenKeys = new Set();
    for (let i = 0; i < 30; i += 1) {
      const p = generateProblem({ tier: 'ace' });
      assert.equal(seenKeys.has(p.key), false, `Repeated key "${p.key}" within 30-problem ring buffer`);
      seenKeys.add(p.key);
    }
  });
});

/* ============================================================================
 * 3. Adaptive Scaffolding (`js/core/adaptive.js`)
 * ============================================================================ */

describe('3. Adaptive Scaffolding Engine', () => {
  it('triggers hint tiers, difficulty adjustment, critical challenges, and shiny bonuses accurately', () => {
    const profile = {
      tier: 'explorer',
      sessionStreak: 0,
      skillMastery: {},
    };

    // 1st miss -> hint 0, adjustment 0
    const m1 = recordAttempt(profile, 'arrays_5x5', false, 0);
    assert.equal(m1.consecutiveMisses, 1);
    assert.equal(m1.autoOpenHintTier, 0);
    assert.equal(m1.difficultyAdjustment, 0);
    assert.equal(m1.streak, 0);
    assert.equal(m1.triggerCriticalChallenge, false);
    assert.equal(m1.shinyRollBonus, 0);

    // 2nd consecutive miss -> autoOpenHintTier === 1, difficultyAdjustment === -1
    const m2 = recordAttempt(profile, 'arrays_5x5', false, 0);
    assert.equal(m2.consecutiveMisses, 2);
    assert.equal(m2.autoOpenHintTier, 1);
    assert.equal(m2.difficultyAdjustment, -1);
    assert.equal(m2.streak, 0);

    // 3rd consecutive miss -> autoOpenHintTier === 2, difficultyAdjustment === -1
    const m3 = recordAttempt(profile, 'arrays_5x5', false, 1);
    assert.equal(m3.consecutiveMisses, 3);
    assert.equal(m3.autoOpenHintTier, 2);
    assert.equal(m3.difficultyAdjustment, -1);
    assert.equal(m3.streak, 0);

    // 4th consecutive miss -> still autoOpenHintTier === 2, difficultyAdjustment === -1
    const m4 = recordAttempt(profile, 'arrays_5x5', false, 2);
    assert.equal(m4.consecutiveMisses, 4);
    assert.equal(m4.autoOpenHintTier, 2);
    assert.equal(m4.difficultyAdjustment, -1);

    // Build streak from 1 to 3 (no critical challenge yet)
    for (let s = 1; s <= 3; s += 1) {
      const hit = recordAttempt(profile, 'arrays_5x5', true, 0);
      assert.equal(hit.consecutiveMisses, 0);
      assert.equal(hit.streak, s);
      assert.equal(hit.triggerCriticalChallenge, false);
      assert.equal(hit.shinyRollBonus, 0);
      assert.equal(hit.autoOpenHintTier, 0);
    }

    // 4+ streak triggers criticalChallenge & shinyRollBonus > 0
    const crit4 = recordAttempt(profile, 'arrays_5x5', true, 0);
    assert.equal(crit4.streak, 4);
    assert.equal(crit4.triggerCriticalChallenge, true);
    assert.ok(crit4.shinyRollBonus > 0 && crit4.shinyRollBonus <= 0.15);
    assert.equal(crit4.difficultyAdjustment, 1);

    // Higher streaks keep bonus bounded <= 0.15
    for (let s = 5; s <= 12; s += 1) {
      const crit = recordAttempt(profile, 'arrays_5x5', true, 0);
      assert.equal(crit.streak, s);
      assert.equal(crit.triggerCriticalChallenge, true);
      assert.ok(crit.shinyRollBonus > 0 && crit.shinyRollBonus <= 0.15);
    }
  });

  it('getRecommendedProblemConfig returns valid tier, route, adjustment, and focusSkillTag', () => {
    const strugglingProfile = {
      tier: 'ace',
      sessionStreak: 0,
      skillMastery: {
        div_exact_12: { attempts: 3, correct: 1, rolling: [true, false, false], consecutiveMisses: 2, level: 1 },
        mul_tables_12: { attempts: 6, correct: 6, rolling: [true, true, true, true, true, true], consecutiveMisses: 0, level: 4 },
      },
    };
    const recStruggle = getRecommendedProblemConfig(strugglingProfile, 'route-5');
    assert.equal(recStruggle.tier, 'ace');
    assert.equal(recStruggle.routeId, 'route-5');
    assert.equal(recStruggle.difficultyAdjustment, -1);
    assert.equal(recStruggle.criticalChallenge, false);
    assert.equal(recStruggle.focusSkillTag, 'div_exact_12');

    const hotStreakProfile = {
      tier: 'champion',
      sessionStreak: 5,
      skillMastery: {
        order_of_operations: { attempts: 8, correct: 8, rolling: [true, true, true, true, true, true, true, true], consecutiveMisses: 0, level: 5 },
      },
    };
    const recHot = getRecommendedProblemConfig(hotStreakProfile, 'route-6');
    assert.equal(recHot.tier, 'champion');
    assert.equal(recHot.routeId, 'route-6');
    assert.equal(recHot.difficultyAdjustment, 1);
    assert.equal(recHot.criticalChallenge, true);
    assert.equal(recHot.focusSkillTag, 'order_of_operations');
  });
});

/* ============================================================================
 * 4. Bidirectional `krunked-cookie-vault-v1` & Multi-Profile State
 * ============================================================================ */

describe('4. State Engine, Multi-Profile, Streak Rollover & Cookie Vault Torture', () => {
  it('supports multi-profile creation, switching, deletion, subscriptions, and calendar streak rollover', () => {
    const storage = createMockStorage();
    const cookieDoc = createMockCookieDoc();
    let clock = new Date(2026, 2, 10, 12, 0, 0).getTime(); // 2026-03-10 local noon

    const root = initState({ storage, cookieDoc, protocol: 'http:', now: () => clock });
    assert.equal(root.profiles.length, 0);
    assert.equal(getActiveProfile(), null);

    let subCalls = 0;
    const unsubscribe = subscribe(() => {
      subCalls += 1;
    });

    const p1 = createProfile({ name: 'Red', tier: 'starter', starterId: 'charmander', avatarColor: '#E3350D' });
    const p2 = createProfile({ name: 'Misty', tier: 'explorer', starterId: 'squirtle', avatarColor: '#2563EB' });
    assert.equal(getState().profiles.length, 2);
    assert.equal(getActiveProfile().id, p2.id);

    const switched = switchProfile(p1.id);
    assert.equal(switched.id, p1.id);
    assert.equal(getActiveProfile().id, p1.id);

    // Same-day update keeps streak at 1
    clock = new Date(2026, 2, 10, 18, 0, 0).getTime();
    let updated = updateProfile((draft) => {
      draft.buddyXp += 50;
      draft.evolutionMeter = 40;
    });
    assert.equal(updated.streak.current, 1);
    assert.equal(updated.streak.best, 1);
    assert.equal(updated.streak.lastActiveDay, '2026-03-10');

    // Next calendar day increments streak
    clock = new Date(2026, 2, 11, 12, 0, 0).getTime();
    updated = updateProfile((draft) => {
      draft.buddyXp += 50;
      draft.buddyLevel = 2;
      draft.evolutionMeter = 100;
    });
    assert.equal(updated.streak.current, 2);
    assert.equal(updated.streak.best, 2);
    assert.equal(updated.streak.lastActiveDay, '2026-03-11');

    // Consecutive day 3
    clock = new Date(2026, 2, 12, 12, 0, 0).getTime();
    updated = updateProfile((draft) => {
      draft.coins += 25;
    });
    assert.equal(updated.streak.current, 3);
    assert.equal(updated.streak.best, 3);

    // Missing >1 day resets current to 1 while preserving best = 3
    clock = new Date(2026, 2, 15, 12, 0, 0).getTime();
    updated = updateProfile((draft) => {
      draft.totalSolved += 1;
    });
    assert.equal(updated.streak.current, 1);
    assert.equal(updated.streak.best, 3);
    assert.equal(updated.streak.lastActiveDay, '2026-03-15');

    // Delete active profile falls back to remaining profile, then null when empty
    assert.equal(deleteProfile(p1.id), true);
    assert.equal(getActiveProfile().id, p2.id);
    assert.equal(deleteProfile(p2.id), true);
    assert.equal(getActiveProfile(), null);
    assert.ok(subCalls >= 6);

    unsubscribe();
  });

  it('round-trips exportSaveJSON() and exportSaveCode() (PM1.) through importSaveJSON()', () => {
    const storage = createMockStorage();
    const cookieDoc = createMockCookieDoc();
    let clock = new Date(2026, 4, 1, 12, 0, 0).getTime();

    initState({ storage, cookieDoc, protocol: 'http:', now: () => clock });
    createProfile({ name: 'Ash', tier: 'ace', starterId: 'pikachu' });
    updateProfile((draft) => {
      draft.coins = 315;
      draft.stardust = 88;
      draft.badges = ['sprout-badge', 'geode-badge'];
      draft.caught.charizard = { count: 2, shiny: true, firstCaughtAt: clock, nickname: 'Blaze' };
    });

    const jsonSave = exportSaveJSON();
    const codeSave = exportSaveCode();
    assert.ok(codeSave.startsWith('PM1.'));

    // Reset into clean empty environment
    const cleanStorage = createMockStorage();
    const cleanCookie = createMockCookieDoc();
    initState({ storage: cleanStorage, cookieDoc: cleanCookie, protocol: 'http:', now: () => clock + 1000 });
    assert.equal(getActiveProfile(), null);

    const resCode = importSaveJSON(codeSave);
    assert.equal(resCode.ok, true);
    assert.equal(resCode.profileCount, 1);
    assert.equal(getActiveProfile().name, 'Ash');
    assert.equal(getActiveProfile().coins, 315);
    assert.equal(getActiveProfile().caught.charizard.shiny, true);
    assert.equal(getActiveProfile().caught.charizard.nickname, 'Blaze');

    // Import JSON string into fresh state
    cleanStorage.clear();
    cleanCookie.clear();
    initState({ storage: cleanStorage, cookieDoc: cleanCookie, protocol: 'http:', now: () => clock + 2000 });
    assert.equal(getActiveProfile(), null);

    const resJson = importSaveJSON(jsonSave);
    assert.equal(resJson.ok, true);
    assert.equal(resJson.profileCount, 1);
    assert.deepEqual(getActiveProfile().badges, ['sprout-badge', 'geode-badge']);
    assert.equal(getActiveProfile().stardust, 88);

    // Invalid payloads fail gracefully
    assert.equal(importSaveJSON('').ok, false);
    assert.equal(importSaveJSON('PM1.!!!invalid!!!').ok, false);
    assert.equal(importSaveJSON('{"not":"valid"}').ok, false);
  });

  it('survives Storage Wipe Torture and Cookie Wipe Torture bidirectionally', () => {
    const storage = createMockStorage();
    const cookieDoc = createMockCookieDoc();
    let clock = new Date(2026, 5, 15, 12, 0, 0).getTime();

    initState({ storage, cookieDoc, protocol: 'http:', now: () => clock });
    createProfile({ name: 'Dawn', tier: 'explorer', starterId: 'squirtle' });
    updateProfile((draft) => {
      draft.activeBuddyId = 'ivysaur';
      draft.buddyXp = 420;
      draft.buddyLevel = 5;
      draft.evolutionMeter = 88;
      draft.coins = 640;
      draft.stardust = 120;
      draft.badges = ['sprout-badge', 'geode-badge', 'beacon-badge'];
      draft.caught.ivysaur = { count: 1, shiny: false, firstCaughtAt: clock, nickname: 'Sprout' };
      draft.caught.pikachu = { count: 3, shiny: true, firstCaughtAt: clock, nickname: 'Sparky' };
      draft.routeProgress['route-2'].unlocked = true;
      draft.routeProgress['route-2'].stars = 3;
      draft.routeProgress['route-2'].bossDefeated = true;
    });

    // 1) STORAGE WIPE TORTURE: wipe localStorage, re-run initState -> heals from cookie vault & repopulates localStorage
    storage.clear();
    assert.equal(storage.getItem(STORAGE_KEY), null);

    initState({ storage, cookieDoc, protocol: 'http:', now: () => clock + 5000 });
    const healed = getActiveProfile();
    assert.ok(healed !== null);
    assert.equal(healed.name, 'Dawn');
    assert.equal(healed.activeBuddyId, 'ivysaur');
    assert.equal(healed.buddyXp, 420);
    assert.equal(healed.buddyLevel, 5);
    assert.equal(healed.evolutionMeter, 88);
    assert.equal(healed.coins, 640);
    assert.equal(healed.stardust, 120);
    assert.deepEqual(healed.badges, ['sprout-badge', 'geode-badge', 'beacon-badge']);
    assert.equal(healed.caught.pikachu.shiny, true);
    assert.equal(healed.caught.ivysaur.count, 1);
    assert.equal(healed.routeProgress['route-2'].bossDefeated, true);
    assert.ok(storage.getItem(STORAGE_KEY) !== null, 'localStorage must be repopulated after cookie heal');

    // Direct healFromCookieVault() check after wiping storage again
    storage.clear();
    assert.equal(healFromCookieVault(), true);
    assert.ok(storage.getItem(STORAGE_KEY) !== null);

    // 2) COOKIE WIPE TORTURE: wipe document.cookie, re-run initState -> regenerates krunked-cookie-vault-v1 from localStorage
    cookieDoc.clear();
    assert.equal(cookieDoc.getValue(VAULT_COOKIE_NAME), null);

    initState({ storage, cookieDoc, protocol: 'http:', now: () => clock + 10000 });
    const regeneratedCookie = cookieDoc.getValue(VAULT_COOKIE_NAME);
    assert.ok(typeof regeneratedCookie === 'string' && regeneratedCookie.length > 0);
    assert.equal(getActiveProfile().coins, 640);
    assert.equal(getActiveProfile().buddyXp, 420);
  });

  it('enforces < 3600-byte encoded cookie ceiling even with 100+ caught Pokémon and respects http: vs https: Secure flag', () => {
    const storage = createMockStorage();
    const cookieDoc = createMockCookieDoc();
    let clock = new Date(2026, 6, 1, 12, 0, 0).getTime();

    initState({ storage, cookieDoc, protocol: 'http:', now: () => clock });
    createProfile({ name: 'ChampionCynthia', tier: 'champion', starterId: 'gible' });

    // Load 45 caught first and verify ceiling
    updateProfile((draft) => {
      draft.coins = 999;
      draft.buddyXp = 1500;
      draft.badges = ['sprout-badge', 'geode-badge', 'beacon-badge', 'dynamo-badge'];
      for (let i = 0; i < 45; i += 1) {
        const sp = POKEMON_ROSTER[i];
        draft.caught[sp.id] = {
          count: (i % 4) + 1,
          shiny: i % 7 === 0,
          firstCaughtAt: clock + i * 100,
          nickname: i % 5 === 0 ? `Buddy${i}` : null,
        };
      }
    });

    const payload45 = cookieDoc.getValue(VAULT_COOKIE_NAME);
    assert.ok(payload45 && payload45.length < 3600, `45 caught cookie payload was ${payload45?.length} bytes`);
    assert.equal(
      cookieDoc.writes[cookieDoc.writes.length - 1].includes('; Secure'),
      false,
      'http: protocol must omit ; Secure'
    );

    // Load 115 caught Pokémon + 25 mastery tags across full roster!
    updateProfile((draft) => {
      for (let i = 0; i < POKEMON_ROSTER.length; i += 1) {
        const sp = POKEMON_ROSTER[i];
        draft.caught[sp.id] = {
          count: (i % 5) + 1,
          shiny: i % 10 === 0,
          firstCaughtAt: clock + i * 100,
          nickname: `Pal-${sp.name}`,
        };
      }
      for (let t = 0; t < 25; t += 1) {
        draft.skillMastery[`skill_tag_${t}`] = {
          attempts: 10 + t,
          correct: 9 + t,
          rolling: [true, true, false, true],
          consecutiveMisses: 0,
          level: 4,
        };
      }
    });

    const payload115 = cookieDoc.getValue(VAULT_COOKIE_NAME);
    assert.ok(payload115 && payload115.length < 3600, `115 caught cookie payload was ${payload115?.length} bytes`);

    // Verify storage wipe still heals core trainer state + active buddy even after trimming
    storage.clear();
    initState({ storage, cookieDoc, protocol: 'https:', now: () => clock + 5000 });
    const recovered = getActiveProfile();
    assert.equal(recovered.name, 'ChampionCynthia');
    assert.equal(recovered.activeBuddyId, 'gible');
    assert.equal(recovered.coins, 999);
    assert.equal(recovered.buddyXp, 1500);
    assert.deepEqual(recovered.badges, ['sprout-badge', 'geode-badge', 'beacon-badge', 'dynamo-badge']);

    // Verify https: appends '; Secure'
    syncCookieVault();
    const lastHttpsWrite = cookieDoc.writes[cookieDoc.writes.length - 1];
    assert.ok(lastHttpsWrite.includes('; Secure'), 'https: protocol must append ; Secure');
    assert.ok(lastHttpsWrite.includes('SameSite=Lax'));
    assert.ok(cookieDoc.getValue(VAULT_COOKIE_NAME).length < 3600);
  });
});

/* ============================================================================
 * 5. Data Referential Integrity (`js/data/*.js`)
 * ============================================================================ */

describe('5. Pokémon, Routes & Items Referential Integrity', () => {
  it('verifies >=108 Pokémon, >=36 families, zero duplicate IDs/dexNumbers, and valid evolution links', () => {
    assert.ok(POKEMON_ROSTER.length >= 108, `Expected >=108 Pokémon, got ${POKEMON_ROSTER.length}`);
    const families = new Set(POKEMON_ROSTER.map((p) => p.familyId));
    assert.ok(families.size >= 36, `Expected >=36 families, got ${families.size}`);

    const seenIds = new Set();
    const seenDex = new Set();

    for (const starterId of STARTER_IDS) {
      assert.ok(POKEMON_BY_ID[starterId], `Missing starter ${starterId}`);
    }

    for (const p of POKEMON_ROSTER) {
      assert.equal(seenIds.has(p.id), false, `Duplicate Pokémon ID: ${p.id}`);
      assert.equal(seenDex.has(p.dexNumber), false, `Duplicate dexNumber: ${p.dexNumber}`);
      seenIds.add(p.id);
      seenDex.add(p.dexNumber);

      assert.equal(POKEMON_BY_ID[p.id], p);
      assert.equal(getPokemonById(p.id), p);
      assert.ok(Array.isArray(p.types) && p.types.length >= 1);
      assert.ok(p.baseHp > 0);
      assert.ok(p.moveNames?.quick && p.moveNames?.power && p.moveNames?.charge);
      assert.ok(typeof p.mathLore === 'string' && p.mathLore.length > 0);

      if (p.evolvesTo) {
        assert.ok(POKEMON_BY_ID[p.evolvesTo], `${p.id}.evolvesTo="${p.evolvesTo}" missing`);
      }
      if (Array.isArray(p.evolvesToOptions)) {
        for (const opt of p.evolvesToOptions) {
          assert.ok(POKEMON_BY_ID[opt], `${p.id}.evolvesToOptions entry "${opt}" missing`);
        }
      }

      const chain = getEvolutionChain(p.id);
      assert.ok(Array.isArray(chain) && chain.length >= 1);
      assert.ok(chain.some((member) => member.id === p.id));
    }

    // Spot check Eevee branching chain
    assert.ok(POKEMON_BY_ID.eevee.evolvesToOptions.length >= 3);
    assert.ok(getEvolutionChain('eevee').length >= 4);
  });

  it('verifies all 6 ROUTES have valid wildPool and gymLeader.teamIds in POKEMON_BY_ID', () => {
    assert.equal(ROUTES.length, 6);
    const badgeIds = new Set();

    for (const routeId of ROUTE_IDS) {
      const route = getRouteById(routeId);
      assert.ok(route, `Missing route ${routeId}`);
      assert.ok(Array.isArray(route.wildPool) && route.wildPool.length >= 3);
      for (const wildId of route.wildPool) {
        assert.ok(POKEMON_BY_ID[wildId], `${route.id} wildPool missing ${wildId}`);
      }

      assert.ok(route.gymLeader && typeof route.gymLeader === 'object');
      assert.equal(badgeIds.has(route.gymLeader.badgeId), false, `Duplicate badge ${route.gymLeader.badgeId}`);
      badgeIds.add(route.gymLeader.badgeId);
      assert.ok(Array.isArray(route.gymLeader.teamIds) && route.gymLeader.teamIds.length >= 2);
      for (const teamId of route.gymLeader.teamIds) {
        assert.ok(POKEMON_BY_ID[teamId], `${route.id} gym team missing ${teamId}`);
      }
    }
  });

  it('verifies BERRIES, POKEBALLS, ACCESSORIES, MART_CATALOG, and QUEST_TEMPLATES', () => {
    assert.ok(BERRIES.length >= 6);
    for (const b of BERRIES) {
      assert.ok(b.id && b.name && b.costCoins > 0 && b.svgMarkup.includes('<svg'));
    }

    assert.ok(POKEBALLS.length >= 4);
    for (const ball of POKEBALLS) {
      assert.ok(ball.id && ball.name && ball.catchMultiplier >= 1 && ball.svgMarkup.includes('<svg'));
    }

    assert.ok(ACCESSORIES.length >= 6);
    for (const acc of ACCESSORIES) {
      assert.ok(acc.id && acc.name && acc.costCoins > 0 && acc.slot && acc.svgMarkup.includes('<svg'));
    }

    assert.ok(MART_CATALOG.length >= BERRIES.length + POKEBALLS.length + ACCESSORIES.length);
    for (const item of MART_CATALOG) {
      assert.ok(item.id && item.itemId && item.costCoins > 0 && item.svgMarkup.includes('<svg'));
    }

    assert.ok(QUEST_TEMPLATES.length >= 6);
    for (const q of QUEST_TEMPLATES) {
      assert.ok(q.templateId && q.title && q.metric && q.target > 0 && q.rewardStardust > 0);
    }
  });
});

/* ============================================================================
 * 6. PNG Binary Header & Dimensions + Subpath PWA Audit
 * ============================================================================ */

describe('6. PNG Binary Verification & Subpath PWA Audit', () => {
  it('validates PNG magic bytes and exact IHDR dimensions for all 3 PWA icons', () => {
    const expectedIcons = [
      { rel: 'assets/icons/icon-192.png', width: 192, height: 192 },
      { rel: 'assets/icons/icon-512.png', width: 512, height: 512 },
      { rel: 'assets/icons/apple-touch-icon.png', width: 180, height: 180 },
    ];
    const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    for (const icon of expectedIcons) {
      const fullPath = path.join(ROOT_DIR, icon.rel);
      assert.equal(fs.existsSync(fullPath), true, `Missing icon ${icon.rel}`);
      const buf = fs.readFileSync(fullPath);
      assert.ok(buf.length >= 24, `${icon.rel} too small to contain PNG IHDR`);
      assert.equal(
        buf.subarray(0, 8).equals(pngMagic),
        true,
        `${icon.rel} invalid PNG signature`
      );
      assert.equal(buf.subarray(12, 16).toString('ascii'), 'IHDR', `${icon.rel} missing IHDR chunk`);
      assert.equal(buf.readUInt32BE(16), icon.width, `${icon.rel} width mismatch`);
      assert.equal(buf.readUInt32BE(20), icon.height, `${icon.rel} height mismatch`);
    }
  });

  it('validates manifest.json subpath config and icon existence', () => {
    const manifestPath = path.join(ROOT_DIR, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    assert.equal(manifest.start_url, './');
    assert.equal(manifest.scope, './');
    assert.equal(manifest.display, 'standalone');
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);

    for (const icon of manifest.icons) {
      assert.ok(typeof icon.src === 'string' && icon.src.startsWith('./'), `Non-relative icon src: ${icon.src}`);
      const diskPath = path.join(ROOT_DIR, icon.src.replace(/^\.\//, ''));
      assert.equal(fs.existsSync(diskPath), true, `Manifest icon missing on disk: ${icon.src}`);
    }
  });

  it('audits index.html and sw.js for zero root-absolute paths and required cache constants', () => {
    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
    const swJs = fs.readFileSync(path.join(ROOT_DIR, 'sw.js'), 'utf8');

    assert.equal(/href="\//.test(indexHtml), false, 'index.html contains root-absolute href="/');
    assert.equal(/src="\//.test(indexHtml), false, 'index.html contains root-absolute src="/');
    assert.equal(/href="\//.test(swJs), false, 'sw.js contains root-absolute href="/');
    assert.equal(/src="\//.test(swJs), false, 'sw.js contains root-absolute src="/');

    // Verify all ./ asset links in index.html exist on disk
    for (const match of indexHtml.matchAll(/(?:href|src)="\.\/([^"]+)"/g)) {
      const relAsset = match[1];
      assert.equal(fs.existsSync(path.join(ROOT_DIR, relAsset)), true, `index.html missing asset ./${relAsset}`);
    }

    assert.match(swJs, /const\s+SHELL_CACHE\s*=\s*['"]pokemath-shell-v1['"]/);
    assert.match(swJs, /const\s+SPRITE_CACHE\s*=\s*['"]pokemath-sprites-v1['"]/);

    // Verify precache shell URLs in sw.js are relative and exist on disk
    const shellArrayMatch = swJs.match(/const\s+CORE_SHELL_URLS\s*=\s*\[([\s\S]*?)\]/);
    assert.ok(shellArrayMatch, 'sw.js missing CORE_SHELL_URLS');
    for (const urlMatch of shellArrayMatch[1].matchAll(/['"]([^'"]+)['"]/g)) {
      const rel = urlMatch[1];
      assert.ok(rel.startsWith('./'), `CORE_SHELL_URLS entry must be relative ./ : ${rel}`);
      if (rel !== './') {
        assert.equal(
          fs.existsSync(path.join(ROOT_DIR, rel.replace(/^\.\//, ''))),
          true,
          `sw.js precache asset missing on disk: ${rel}`
        );
      }
    }
  });
});

/* ============================================================================
 * 7. Audio & Module Syntax Safety (`js/core/audio.js`)
 * ============================================================================ */

describe('7. Audio Module Node-Safety & Export Verification', () => {
  it('exposes all 13 audio exports and executes safely in Node without DOM/AudioContext', () => {
    const expectedExports = [
      'unlockAudio',
      'setAudioSettings',
      'playClick',
      'playCorrectChime',
      'playGentleNudge',
      'playAttackSFX',
      'playPokeballThrow',
      'playPokeballWobble',
      'playCatchFanfare',
      'playEvolutionSymphony',
      'playBadgeFanfare',
      'toggleAmbientMusic',
      'speakText',
    ];

    for (const fnName of expectedExports) {
      assert.equal(typeof audio[fnName], 'function', `Missing export ${fnName} in audio.js`);
    }

    assert.doesNotThrow(() => {
      assert.equal(audio.unlockAudio(), false);
      audio.setAudioSettings({ sfx: true, ambient: false, speech: false });
      audio.playClick('tap');
      audio.playClick('confirm');
      audio.playCorrectChime(4);
      audio.playGentleNudge();
      audio.playAttackSFX('electric', 'charge');
      audio.playAttackSFX('water', 'quick');
      audio.playPokeballThrow();
      audio.playPokeballWobble(1);
      audio.playCatchFanfare();
      audio.playEvolutionSymphony();
      audio.playBadgeFanfare();
      assert.equal(audio.toggleAmbientMusic(true), true);
      assert.equal(audio.toggleAmbientMusic(false), false);
      assert.equal(audio.speakText('Pikachu uses Thunder Ten!', false), false);
      assert.equal(audio.speakText('Pikachu uses Thunder Ten!', true), false);
    });
  });
});
