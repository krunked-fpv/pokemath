import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  TIERS,
  resetHistory,
  generateProblem,
  validateAnswer,
  generateMoveSetProblems,
  formatSkillTag,
} from '../js/core/mathEngine.js';
import { buildHintBundle } from '../js/core/hintEngine.js';
import { recordAttempt, getRecommendedProblemConfig } from '../js/core/adaptive.js';
import {
  VAULT_COOKIE_NAME,
  STORAGE_KEY,
  BUDDY_NICKNAME_MAX_LEN,
  initState,
  getState,
  getActiveProfile,
  switchProfile,
  createProfile,
  deleteProfile,
  updateProfile,
  setBuddyNickname,
  subscribe,
  exportSaveJSON,
  exportSaveCode,
  importSaveJSON,
  healFromCookieVault,
  getLastHealSource,
  syncCookieVault,
} from '../js/core/state.js';
import * as audio from '../js/core/audio.js';
import { renderPokemonVisual } from '../js/ui/vfx.js';
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

function createMockDomElement(tagName, namespaceURI = 'http://www.w3.org/1999/xhtml') {
  const classSet = new Set();
  const attributes = new Map();
  const listeners = new Map();
  const children = [];
  const style = {
    setProperty(prop, value) {
      this[String(prop)] = String(value);
    },
    getPropertyValue(prop) {
      return this[String(prop)] ?? '';
    },
  };

  const el = {
    tagName:
      namespaceURI === 'http://www.w3.org/2000/svg'
        ? String(tagName)
        : String(tagName).toUpperCase(),
    namespaceURI,
    children,
    parentNode: null,
    dataset: {},
    style,
    innerHTML: '',
    get className() {
      return [...classSet].join(' ');
    },
    set className(val) {
      classSet.clear();
      for (const token of String(val ?? '').trim().split(/\s+/)) {
        if (token) classSet.add(token);
      }
    },
    classList: {
      add(...tokens) {
        for (const token of tokens) {
          if (token) classSet.add(String(token));
        }
      },
      remove(...tokens) {
        for (const token of tokens) {
          classSet.delete(String(token));
        }
      },
      contains(token) {
        return classSet.has(String(token));
      },
      toggle(token, force) {
        const key = String(token);
        if (force === undefined) {
          if (classSet.has(key)) {
            classSet.delete(key);
            return false;
          }
          classSet.add(key);
          return true;
        }
        if (force) {
          classSet.add(key);
          return true;
        }
        classSet.delete(key);
        return false;
      },
    },
    setAttribute(name, value) {
      const key = String(name);
      const val = String(value);
      if (key === 'class') {
        el.className = val;
        return;
      }
      attributes.set(key, val);
    },
    getAttribute(name) {
      const key = String(name);
      if (key === 'class') return el.className;
      return attributes.has(key) ? attributes.get(key) : null;
    },
    appendChild(child) {
      child.parentNode = el;
      children.push(child);
      return child;
    },
    addEventListener(type, listener) {
      const key = String(type);
      if (!listeners.has(key)) listeners.set(key, []);
      listeners.get(key).push(listener);
    },
    removeEventListener(type, listener) {
      const list = listeners.get(String(type));
      if (!list) return;
      const idx = list.indexOf(listener);
      if (idx >= 0) list.splice(idx, 1);
    },
    dispatchEvent(event) {
      const evt = typeof event === 'string' ? { type: event } : event;
      const list = [...(listeners.get(String(evt.type)) || [])];
      for (const listener of list) {
        listener.call(el, evt);
      }
      return true;
    },
    querySelector(selector) {
      const matchesSingle = (node, sel) => {
        const trimmed = sel.trim();
        if (!trimmed) return false;
        const dotIdx = trimmed.indexOf('.');
        if (dotIdx === 0) {
          return node.classList.contains(trimmed.slice(1));
        }
        if (dotIdx > 0) {
          const expectedTag = trimmed.slice(0, dotIdx).toLowerCase();
          const expectedClass = trimmed.slice(dotIdx + 1);
          return (
            node.tagName.toLowerCase() === expectedTag &&
            node.classList.contains(expectedClass)
          );
        }
        return node.tagName.toLowerCase() === trimmed.toLowerCase();
      };

      for (const child of children) {
        if (matchesSingle(child, selector)) return child;
        const nested = child.querySelector(selector);
        if (nested) return nested;
      }
      return null;
    },
    get outerHTML() {
      const tag = el.tagName.toLowerCase();
      const attrs = [];
      if (el.className) attrs.push(`class="${el.className}"`);
      for (const [k, v] of attributes.entries()) {
        attrs.push(`${k}="${v}"`);
      }
      if (el.src) attrs.push(`src="${el.src}"`);
      if (el.alt) attrs.push(`alt="${el.alt}"`);
      const attrStr = attrs.length > 0 ? ` ${attrs.join(' ')}` : '';
      if (tag === 'img') return `<img${attrStr}>`;
      const body =
        children.length > 0
          ? children.map((c) => c.outerHTML).join('')
          : String(el.innerHTML || '');
      return `<${tag}${attrStr}>${body}</${tag}>`;
    },
  };

  return el;
}

function createMockDomDocument() {
  return {
    documentElement: { dataset: {} },
    createElement(tagName) {
      return createMockDomElement(tagName, 'http://www.w3.org/1999/xhtml');
    },
    createElementNS(ns, tagName) {
      return createMockDomElement(tagName, ns);
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

  it('reloads cold state module via subprocess without RangeError and heals from cookie vault', () => {
    const seedStorage = createMockStorage();
    const seedCookieDoc = createMockCookieDoc();
    const seedClock = new Date(2026, 7, 10, 12, 0, 0).getTime();

    initState({ storage: seedStorage, cookieDoc: seedCookieDoc, protocol: 'http:', now: () => seedClock });
    const created = createProfile({ name: 'RedReload', tier: 'ace', starterId: 'bulbasaur' });
    updateProfile((draft) => {
      draft.coins = 777;
      draft.stardust = 45;
      draft.badges = ['sprout-badge', 'geode-badge'];
      draft.caught.pikachu = { count: 2, shiny: true, firstCaughtAt: seedClock, nickname: 'Volt' };
    });

    const seededStorageJson = seedStorage.getItem(STORAGE_KEY);
    const seededCookieVal = seedCookieDoc.getValue(VAULT_COOKIE_NAME);
    assert.ok(seededStorageJson && seededCookieVal);

    const stateModuleUrl = pathToFileURL(path.join(ROOT_DIR, 'js/core/state.js')).href;
    const coldChildScript = [
      "import assert from 'node:assert/strict';",
      'const modUrl = process.env.POKEMATH_STATE_URL;',
      'const mode = process.env.POKEMATH_COLD_MODE;',
      "const seedStorage = process.env.POKEMATH_SEED_STORAGE || '';",
      "const seedCookie = process.env.POKEMATH_SEED_COOKIE || '';",
      'const { initState, getActiveProfile, getLastHealSource, STORAGE_KEY, VAULT_COOKIE_NAME } = await import(modUrl);',
      'const store = new Map();',
      "if (mode === 'both' && seedStorage) store.set(STORAGE_KEY, seedStorage);",
      'const storage = {',
      '  getItem: (k) => (store.has(k) ? store.get(k) : null),',
      '  setItem: (k, v) => { store.set(String(k), String(v)); },',
      '  removeItem: (k) => { store.delete(String(k)); },',
      '  clear: () => { store.clear(); },',
      '};',
      'const jar = new Map();',
      'if (seedCookie) jar.set(VAULT_COOKIE_NAME, seedCookie);',
      'const cookieDoc = {',
      '  get cookie() {',
      "    return [...jar.entries()].map(([k, v]) => k + '=' + v).join('; ');",
      '  },',
      '  set cookie(line) {',
      "    const first = String(line).split(';')[0];",
      "    const eq = first.indexOf('=');",
      '    if (eq > 0) {',
      '      const name = first.slice(0, eq).trim();',
      '      const val = first.slice(eq + 1).trim();',
      '      if (!val || /max-age=0\\b/i.test(String(line))) jar.delete(name);',
      '      else jar.set(name, val);',
      '    }',
      '  },',
      '};',
      'const root = initState({',
      '  storage,',
      '  cookieDoc,',
      "  protocol: 'http:',",
      '  now: () => Number(process.env.POKEMATH_TEST_NOW),',
      '});',
      'const active = getActiveProfile();',
      'const healSource = getLastHealSource();',
      'const repopulatedRaw = storage.getItem(STORAGE_KEY);',
      'assert.equal(root.profiles.length, 1);',
      'assert.ok(active !== null);',
      'process.stdout.write(JSON.stringify({',
      '  profileCount: root.profiles.length,',
      '  active,',
      '  healSource,',
      "  storageRepopulated: typeof repopulatedRaw === 'string' && repopulatedRaw.length > 0,",
      '  repopulatedRaw,',
      '}));',
    ].join('\n');

    const runColdCase = (mode) => {
      const stdout = execFileSync(
        process.execPath,
        ['--input-type=module', '-e', coldChildScript],
        {
          cwd: ROOT_DIR,
          encoding: 'utf8',
          env: {
            ...process.env,
            POKEMATH_STATE_URL: stateModuleUrl,
            POKEMATH_COLD_MODE: mode,
            POKEMATH_SEED_STORAGE: seededStorageJson,
            POKEMATH_SEED_COOKIE: seededCookieVal,
            POKEMATH_TEST_NOW: String(seedClock + 5000),
          },
        }
      );
      return JSON.parse(stdout);
    };

    const assertReloadedProfileIntact = (res, expectedHealSource) => {
      assert.equal(res.profileCount, 1);
      assert.equal(res.healSource, expectedHealSource);
      assert.equal(res.active.id, created.id);
      assert.equal(res.active.name, 'RedReload');
      assert.equal(res.active.tier, 'ace');
      assert.equal(res.active.activeBuddyId, 'bulbasaur');
      assert.equal(res.active.coins, 777);
      assert.equal(res.active.stardust, 45);
      assert.deepEqual(res.active.badges, ['sprout-badge', 'geode-badge']);
      assert.equal(res.active.caught.pikachu.shiny, true);
      assert.equal(res.active.caught.pikachu.nickname, 'Volt');
    };

    // Case A: Both localStorage and krunked-cookie-vault-v1 populated with matching timestamps -> zero recursion
    const caseA = runColdCase('both');
    assertReloadedProfileIntact(caseA, null);

    // Case B: Empty localStorage + populated krunked-cookie-vault-v1 -> cold heal & repopulate localStorage
    const caseB = runColdCase('cookie-only');
    assertReloadedProfileIntact(caseB, 'cookie-vault');
    assert.equal(caseB.storageRepopulated, true);
    assert.equal(JSON.parse(caseB.repopulatedRaw).profiles[0].coins, 777);
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

/* ============================================================================
 * 8. Visual Effects & Offline SVG Fallback (`js/ui/vfx.js`)
 * ============================================================================ */

describe('8. Visual Effects & Offline SVG Fallback', () => {
  it('activates .is-fallback SVG on sprite error and renders immediately with forceSvg: true', () => {
    const bulbasaur = POKEMON_ROSTER[0];
    assert.equal(bulbasaur.id, 'bulbasaur');

    const prevDocument = globalThis.document;
    globalThis.document = createMockDomDocument();
    try {
      // 1) Offline image error fallback
      const visual = renderPokemonVisual(bulbasaur);
      assert.equal(visual.classList.contains('pkmn-visual'), true);
      assert.equal(visual.classList.contains('is-fallback'), false);

      const spriteImg = visual.querySelector('img.pkmn-sprite');
      assert.ok(spriteImg, 'Expected <img class="pkmn-sprite"> child');
      assert.equal(spriteImg.src, bulbasaur.spriteUrl);

      spriteImg.dispatchEvent(new Event('error'));

      assert.equal(visual.classList.contains('is-fallback'), true);
      assert.equal(spriteImg.style.display, 'none');

      const fallbackSvg = visual.querySelector('.pkmn-fallback-svg');
      assert.ok(fallbackSvg, 'Expected .pkmn-fallback-svg child');
      assert.equal(fallbackSvg.tagName.toLowerCase(), 'svg');
      assert.equal(fallbackSvg.style.display, 'block');
      assert.ok(fallbackSvg.outerHTML.includes('<svg'), 'Expected <svg markup in fallback');
      assert.ok(fallbackSvg.innerHTML.includes('<circle') && fallbackSvg.innerHTML.includes('<path'));
      assert.ok(visual.outerHTML.includes('<svg'));

      // 2) forceSvg: true renders .is-fallback immediately without an <img>
      const forcedVisual = renderPokemonVisual(bulbasaur, { forceSvg: true });
      assert.equal(forcedVisual.classList.contains('pkmn-visual'), true);
      assert.equal(forcedVisual.classList.contains('is-fallback'), true);
      assert.equal(forcedVisual.querySelector('img'), null, 'forceSvg: true must omit <img>');
      assert.equal(forcedVisual.querySelector('.pkmn-sprite'), null);

      const forcedSvg = forcedVisual.querySelector('.pkmn-fallback-svg');
      assert.ok(forcedSvg, 'forceSvg: true must include .pkmn-fallback-svg');
      assert.equal(forcedSvg.tagName.toLowerCase(), 'svg');
      assert.equal(forcedSvg.style.display, 'block');
      assert.ok(forcedSvg.outerHTML.includes('<svg'));
      assert.ok(forcedSvg.innerHTML.includes('<circle') && forcedSvg.innerHTML.includes('<path'));
    } finally {
      if (prevDocument === undefined) {
        delete globalThis.document;
      } else {
        globalThis.document = prevDocument;
      }
    }
  });
});

/* ============================================================================
 * 9. Sprint 2 — Speech & Grammar Audit (`mathEngine.js` & `hintEngine.js`)
 * ============================================================================ */

const ALL_OPERATIONS = [
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
];

const ALL_FORMATS = [
  'numeric',
  'missing',
  'comparison',
  'fraction',
  'word',
  'array',
  'placeValue',
  'numberLine',
];

const FORBIDDEN_SPEECH_PATTERNS = [
  { label: 'fourthsths', regex: /fourthsths/i },
  { label: 'overths', regex: /overths/i },
  { label: '1 tens', regex: /\b1 tens\b/i },
  { label: '1 ones', regex: /\b1 ones\b/i },
  { label: '1 25-Coin tokens', regex: /\b1 25-Coin tokens\b/i },
  { label: '1 10-Coin tokens', regex: /\b1 10-Coin tokens\b/i },
  { label: '1 5-Coin tokens', regex: /\b1 5-Coin tokens\b/i },
  { label: '1 crates', regex: /\b1 crates\b/i },
  { label: 'requested value value', regex: /requested value value/i },
  { label: 'value = ?', regex: /\bvalue\s*=\s*\?/i },
  { label: 'raw multiplication sign ×', regex: /×/ },
  { label: 'raw division sign ÷', regex: /÷/ },
];

function assertCleanSpeechText(text, label) {
  assert.equal(typeof text, 'string', `${label}: expected string`);
  assert.ok(text.trim().length > 0, `${label}: expected non-empty speech text`);
  for (const rule of FORBIDDEN_SPEECH_PATTERNS) {
    assert.equal(
      rule.regex.test(text),
      false,
      `${label}: forbidden pattern "${rule.label}" found in "${text}"`
    );
  }
}

function assertCleanHintCopy(bundle, label) {
  assertCleanSpeechText(bundle.tier1.spokenText, `${label}:tier1.spokenText`);

  const nonSpeechTexts = [
    ['tier1.headline', bundle.tier1.headline],
    ['tier1.nudgeText', bundle.tier1.nudgeText],
    ...bundle.tier3.steps.flatMap((s, idx) => [
      [`tier3.steps[${idx}].highlight`, s.highlight],
      [`tier3.steps[${idx}].formula`, s.formula],
    ]),
  ];

  for (const [field, value] of nonSpeechTexts) {
    assert.equal(
      /requested value value/i.test(value),
      false,
      `${label}:${field} contains "requested value value": "${value}"`
    );
    assert.equal(
      /\bvalue\s*=\s*\?/i.test(value),
      false,
      `${label}:${field} contains "value = ?": "${value}"`
    );
  }
}

describe('9. Sprint 2 — Speech & Grammar Audit', () => {
  beforeEach(() => {
    resetHistory();
  });

  it('audits 2,000+ generated problems across all 4 tiers, operations & formats for clean spokenPrompt and hint speech', () => {
    const seenSkillTags = new Set();
    let totalAudited = 0;
    let sawPlaceValueAskValue = false;
    let sawEquivFraction = false;
    let sawParenthesizedSpeech = false;

    const auditProblem = (problem, label) => {
      assertProblemAndHintValid(problem, label);
      assertCleanSpeechText(problem.spokenPrompt, `${label}:spokenPrompt`);

      const bundle = buildHintBundle(problem);
      assertCleanHintCopy(bundle, label);

      seenSkillTags.add(problem.skillTag);
      totalAudited += 1;

      if (problem.meta?.placeDigits?.askPlace === 'value') {
        sawPlaceValueAskValue = true;
      }
      if (problem.operation === 'fraction' && problem.format === 'missing') {
        sawEquivFraction = true;
      }
      if (
        (problem.operation === 'orderOfOps' || problem.operation === 'comparison') &&
        ((problem.leftExpr && problem.leftExpr.includes('(')) ||
          (problem.rightExpr && problem.rightExpr.includes('(')))
      ) {
        sawParenthesizedSpeech = true;
        assert.ok(
          problem.spokenPrompt.includes('the group '),
          `${label}: parenthesized expression should use natural group phrasing in "${problem.spokenPrompt}"`
        );
        assert.equal(
          /[()]/.test(problem.spokenPrompt),
          false,
          `${label}: raw parentheses leaked into spokenPrompt "${problem.spokenPrompt}"`
        );
      }
    };

    // 1) 500 general problems per tier (2,000 base)
    for (const tier of TIERS) {
      for (let i = 0; i < 500; i += 1) {
        const p = generateProblem({ tier });
        auditProblem(p, `speech-tier=${tier}#${i}`);
      }
    }

    // 2) Targeted sweep across every operation x every tier (400 problems)
    for (const tier of TIERS) {
      for (const operation of ALL_OPERATIONS) {
        for (let i = 0; i < 10; i += 1) {
          const p = generateProblem({ tier, operation });
          auditProblem(p, `speech-op=${tier}:${operation}#${i}`);
        }
      }
    }

    // 3) Targeted sweep across every format x every tier (320 problems)
    for (const tier of TIERS) {
      for (const format of ALL_FORMATS) {
        for (let i = 0; i < 10; i += 1) {
          const p = generateProblem({ tier, format });
          auditProblem(p, `speech-fmt=${tier}:${format}#${i}`);
        }
      }
    }

    // 4) Explicitly exercise singular place-value ('1 ten and 1 one') and askPlace === 'value'
    const narrowPvFilter = { enabled: true, operations: ['placeValue'], maxNumber: 11 };
    for (let i = 0; i < 30; i += 1) {
      const p = generateProblem({ tier: 'starter', operation: 'placeValue', customFilter: narrowPvFilter });
      auditProblem(p, `speech-pv11#${i}`);
    }

    const explicitValueHint = buildHintBundle({
      id: 'pv-val-explicit',
      key: 'pv-val3:345',
      tier: 'explorer',
      skillTag: 'place_value_1000',
      operation: 'placeValue',
      format: 'placeValue',
      promptText: 'What is the value of the 4 in 345?',
      spokenPrompt: 'What is the value of the 4 in 345?',
      expression: 'Value of 4 (tens place) in 345 = ?',
      answer: 40,
      choices: [4, 40, 400, 50],
      manipulativeType: 'base10',
      operands: [345, 4],
      meta: { placeDigits: { number: 345, hundreds: 3, tens: 4, ones: 5, askPlace: 'value' } },
    });
    assertCleanHintCopy(explicitValueHint, 'explicit-pv-value');
    assert.equal(explicitValueHint.tier3.steps[explicitValueHint.tier3.steps.length - 1].formula, '4 × 10 = ?');

    assert.ok(totalAudited >= 2750, `Expected >= 2,750 audited problems, got ${totalAudited}`);
    assert.equal(sawPlaceValueAskValue, true, 'Expected sweep to cover placeValue askPlace === "value"');
    assert.equal(sawEquivFraction, true, 'Expected sweep to cover equivalent fraction prompts');
    assert.equal(sawParenthesizedSpeech, true, 'Expected sweep to cover parenthesized expressions');

    // Every emitted skillTag formats into a warm, non-underscore label
    assert.ok(seenSkillTags.size >= 15);
    for (const tag of seenSkillTags) {
      const label = formatSkillTag(tag);
      assert.equal(typeof label, 'string');
      assert.ok(label.trim().length > 0);
      assert.equal(label.includes('_'), false, `formatSkillTag("${tag}") left raw underscore in "${label}"`);
    }
  });

  it('formats known and unknown skill tags via mathEngine.formatSkillTag()', () => {
    assert.equal(formatSkillTag('add_within_20'), 'Addition to 20');
    assert.equal(formatSkillTag('word_2step_champion'), 'Champion Story');
    assert.equal(formatSkillTag('make_ten'), 'Make a Ten');
    assert.equal(formatSkillTag('equivalent_fractions'), 'Matching Fractions');
    assert.equal(formatSkillTag('skip_counting_5s'), 'Skip Counting by 5s');
    assert.equal(formatSkillTag('skip_counting_25s'), 'Skip Counting by 25s');

    // Unknown tag fallbacks are cleanly humanized instead of raw snake_case
    assert.equal(formatSkillTag('mystery_boss_challenge'), 'Mystery Boss Challenge');
    assert.equal(formatSkillTag('mul_within_50'), 'Multiplication to 50');
    assert.equal(formatSkillTag(''), 'Math Adventure');
    assert.equal(formatSkillTag('   '), 'Math Adventure');
    assert.equal(formatSkillTag(null), 'Math Adventure');
    assert.equal(formatSkillTag(undefined), 'Math Adventure');
  });

  it('exercises all 6 distinct Champion 2-step story templates in genWord', () => {
    const expectedTemplates = [
      'martChange',
      'gymRelay',
      'berryHarvest',
      'stadiumTrek',
      'crateShip',
      'stardustForge',
    ];
    const seenTemplates = new Set();
    const samplePrompts = new Map();

    for (let i = 0; i < 240; i += 1) {
      if (i % 25 === 0) resetHistory();
      const p = generateProblem({ tier: 'champion', operation: 'word' });
      assert.equal(p.tier, 'champion');
      assert.equal(p.operation, 'word');
      assert.equal(p.skillTag, 'word_2step_champion');
      assertProblemAndHintValid(p, `champ-word#${i}`);
      assertCleanSpeechText(p.spokenPrompt, `champ-word#${i}:spokenPrompt`);

      const bundle = buildHintBundle(p);
      assertCleanHintCopy(bundle, `champ-word#${i}`);

      const tpl = p.meta?.championTemplate;
      assert.ok(typeof tpl === 'string' && tpl.length > 0, `Missing meta.championTemplate on ${p.key}`);
      assert.ok(p.key.startsWith(`word-champ:${tpl}:`), `Unexpected champion key "${p.key}"`);
      assert.ok(p.meta?.orderSteps?.step1Expr, `Missing orderSteps.step1Expr on ${tpl}`);
      assert.ok(Number.isFinite(p.meta?.orderSteps?.step1Val), `Missing orderSteps.step1Val on ${tpl}`);
      assert.ok(p.meta?.orderSteps?.step2Op, `Missing orderSteps.step2Op on ${tpl}`);

      seenTemplates.add(tpl);
      if (!samplePrompts.has(tpl)) samplePrompts.set(tpl, p.promptText);
    }

    assert.equal(
      seenTemplates.size,
      6,
      `Expected 6 distinct Champion word templates, saw [${[...seenTemplates].join(', ')}]`
    );
    for (const tpl of expectedTemplates) {
      assert.ok(seenTemplates.has(tpl), `Champion word template "${tpl}" was never generated`);
    }
    // Verify distinct story copy across all 6 templates
    assert.equal(new Set(samplePrompts.values()).size, 6);
  });
});

/* ============================================================================
 * 10. Sprint 2 — Anti-Spoiler Manipulative & Hint Audit (`hintEngine.js`)
 * ============================================================================ */

describe('10. Sprint 2 — Anti-Spoiler Manipulative & Hint Audit', () => {
  beforeEach(() => {
    resetHistory();
  });

  it('never leaks equivFraction unknown answer in tier2.config.shaded', () => {
    for (let i = 0; i < 120; i += 1) {
      if (i % 25 === 0) resetHistory();
      const p = generateProblem({ tier: 'champion', operation: 'fraction', format: 'missing' });
      assert.equal(p.operation, 'fraction');
      assert.equal(p.format, 'missing');
      const fd = p.meta.fractionData;
      assert.ok(fd && fd.multiplier >= 2 && fd.leftNum >= 1);

      const bundle = buildHintBundle(p);
      assert.equal(bundle.tier2.type, 'berryArray');
      assert.equal(bundle.tier2.config.mode, 'equivFraction');
      assert.equal(
        bundle.tier2.config.shaded,
        fd.leftNum,
        `equivFraction shaded (${bundle.tier2.config.shaded}) must equal known leftNum (${fd.leftNum})`
      );
      assert.notEqual(
        bundle.tier2.config.shaded,
        p.answer,
        `equivFraction tier2.config.shaded leaked unknown answer ${p.answer} for ${p.expression}`
      );
    }

    // Adversarial spec: even if fractionData.shaded was pre-populated with the answer (4),
    // buildHintBundle must still shade only the known base numerator (2).
    const adversarialBundle = buildHintBundle({
      id: 'equiv-adversarial',
      key: 'frac-eq:2/3=?/6',
      tier: 'champion',
      skillTag: 'equivalent_fractions',
      operation: 'fraction',
      format: 'missing',
      promptText: 'Find the missing numerator for an equivalent fraction: 2/3 = ?/6',
      spokenPrompt: 'Find the missing numerator: 2 thirds equals how many sixths?',
      expression: '2/3 = ?/6',
      answer: 4,
      choices: [2, 3, 4, 5],
      manipulativeType: 'berryArray',
      operands: [2, 3, 6],
      meta: {
        rows: 2,
        cols: 3,
        fractionData: { leftNum: 2, leftDen: 3, rightNum: null, rightDen: 6, multiplier: 2, shaded: 4, total: 6 },
      },
    });
    assert.equal(adversarialBundle.tier2.config.mode, 'equivFraction');
    assert.equal(adversarialBundle.tier2.config.shaded, 2);
    assert.notEqual(adversarialBundle.tier2.config.shaded, 4);
  });

  it('never leaks the solved answer in partWhole unknown slot across generated and crafted specs', () => {
    let generatedPartWholeCount = 0;
    for (const tier of TIERS) {
      for (const operation of ['add', 'sub', 'div', 'word', 'orderOfOps']) {
        for (let i = 0; i < 20; i += 1) {
          const p = generateProblem({ tier, operation });
          const bundle = buildHintBundle(p);
          if (bundle.tier2.type === 'partWhole') {
            const cfg = bundle.tier2.config;
            assert.ok(
              ['whole', 'left', 'right'].includes(cfg.unknown),
              `Invalid partWhole unknown "${cfg.unknown}" for ${p.key}`
            );
            assert.equal(
              cfg[cfg.unknown],
              null,
              `partWhole leaked value ${cfg[cfg.unknown]} in unknown slot "${cfg.unknown}" for ${p.key}`
            );
            generatedPartWholeCount += 1;
          }
        }
      }
    }
    assert.ok(generatedPartWholeCount >= 40, `Expected >= 40 partWhole bundles audited, got ${generatedPartWholeCount}`);

    // Explicit crafted specs where meta.whole or meta.parts contains the solved answer
    const craftedCases = [
      {
        label: 'sub numeric (14 - 6 = 8)',
        spec: {
          operation: 'sub',
          format: 'numeric',
          operands: [14, 6],
          answer: 8,
          expression: '14 - 6 = ?',
          manipulativeType: 'partWhole',
          meta: { whole: 14, parts: [6, 8] },
        },
        expectedUnknown: 'right',
        expectedKnown: { whole: 14, left: 6 },
      },
      {
        label: 'missing addend (7 + ? = 15)',
        spec: {
          operation: 'add',
          format: 'missing',
          operands: [7, 15],
          answer: 8,
          expression: '7 + ? = 15',
          manipulativeType: 'partWhole',
          meta: { whole: 15, parts: [7, 8], missingSide: 'right' },
        },
        expectedUnknown: 'right',
        expectedKnown: { whole: 15, left: 7 },
      },
      {
        label: 'missing subtrahend (15 - ? = 9)',
        spec: {
          operation: 'sub',
          format: 'missing',
          operands: [15, 9],
          answer: 6,
          expression: '15 - ? = 9',
          manipulativeType: 'partWhole',
          meta: { whole: 15, parts: [6, 9], missingSide: 'subtrahend' },
        },
        expectedUnknown: 'left',
        expectedKnown: { whole: 15, right: 9 },
      },
      {
        label: 'take-away word problem (18 - 5 = 13)',
        spec: {
          operation: 'word',
          format: 'word',
          operands: [18, 5],
          answer: 13,
          expression: '18 - 5 = ?',
          manipulativeType: 'partWhole',
          meta: { whole: 18, parts: [5, 13], partUnknown: 'right' },
        },
        expectedUnknown: 'right',
        expectedKnown: { whole: 18, left: 5 },
      },
      {
        label: 'division sharing (48 ÷ 6 = 8)',
        spec: {
          operation: 'div',
          format: 'numeric',
          operands: [48, 6],
          answer: 8,
          expression: '48 ÷ 6 = ?',
          manipulativeType: 'partWhole',
          meta: { whole: 48, parts: [6, 8] },
        },
        expectedUnknown: 'right',
        expectedKnown: { whole: 48, left: 6 },
      },
      {
        label: 'addition whole unknown (9 + 6 = 15)',
        spec: {
          operation: 'add',
          format: 'numeric',
          operands: [9, 6],
          answer: 15,
          expression: '9 + 6 = ?',
          manipulativeType: 'partWhole',
          meta: { whole: 15, parts: [9, 6] },
        },
        expectedUnknown: 'whole',
        expectedKnown: { left: 9, right: 6 },
      },
    ];

    for (const tc of craftedCases) {
      const bundle = buildHintBundle(tc.spec);
      assert.equal(bundle.tier2.type, 'partWhole', tc.label);
      const cfg = bundle.tier2.config;
      assert.equal(cfg.unknown, tc.expectedUnknown, `${tc.label}: unexpected unknown slot`);
      assert.equal(cfg[cfg.unknown], null, `${tc.label}: unknown slot must be null (no spoiler)`);
      for (const [k, v] of Object.entries(tc.expectedKnown)) {
        assert.equal(cfg[k], v, `${tc.label}: expected ${k} = ${v}`);
      }
    }
  });

  it('uses Bridge Back to 10 strategy in buildSubHints for crossing-10 subtraction', () => {
    const sub14Minus6 = buildHintBundle({
      id: 'sub-bridge-14-6',
      key: 'sub:14-6',
      tier: 'starter',
      skillTag: 'sub_within_20',
      operation: 'sub',
      format: 'numeric',
      promptText: 'What is 14 - 6?',
      spokenPrompt: 'What is 14 minus 6?',
      expression: '14 - 6 = ?',
      answer: 8,
      choices: [6, 7, 8, 9],
      manipulativeType: 'numberLine',
      operands: [14, 6],
    });

    assert.equal(sub14Minus6.tier1.headline, 'Bridge Back to 10!');
    assert.ok(sub14Minus6.tier1.nudgeText.includes('4') && sub14Minus6.tier1.nudgeText.includes('2'));
    assert.ok(sub14Minus6.tier1.spokenText.includes('10'));
    assert.equal(sub14Minus6.tier3.steps.length, 2);
    assert.equal(sub14Minus6.tier3.steps[0].formula, '14 - 4 = 10');
    assert.equal(sub14Minus6.tier3.steps[1].formula, '10 - 2 = ?');
    assert.equal(sub14Minus6.tier3.steps[1].formula.endsWith('?'), true);

    // Higher ten boundary (23 - 7 -> 23 - 3 = 20, 20 - 4 = ?)
    const sub23Minus7 = buildHintBundle({
      operation: 'sub',
      format: 'numeric',
      operands: [23, 7],
      answer: 16,
      expression: '23 - 7 = ?',
      manipulativeType: 'numberLine',
    });
    assert.equal(sub23Minus7.tier1.headline, 'Bridge Back to 20!');
    assert.equal(sub23Minus7.tier3.steps[0].formula, '23 - 3 = 20');
    assert.equal(sub23Minus7.tier3.steps[1].formula, '20 - 4 = ?');

    // Non-crossing subtraction (17 - 4) must NOT falsely trigger Bridge Back to 10
    const sub17Minus4 = buildHintBundle({
      operation: 'sub',
      format: 'numeric',
      operands: [17, 4],
      answer: 13,
      expression: '17 - 4 = ?',
      manipulativeType: 'numberLine',
    });
    assert.equal(sub17Minus4.tier1.headline, 'Hop Backwards!');
    assert.equal(sub17Minus4.tier3.steps[sub17Minus4.tier3.steps.length - 1].formula, '17 - 4 = ?');
  });

  it('guarantees Tier 3 final step always ends short with "?" without revealing the final answer', () => {
    let checked = 0;
    for (const tier of TIERS) {
      for (const operation of ALL_OPERATIONS) {
        for (let i = 0; i < 12; i += 1) {
          const p = generateProblem({ tier, operation });
          const bundle = buildHintBundle(p);
          const steps = bundle.tier3.steps;
          assert.ok(Array.isArray(steps) && steps.length >= 1);
          const lastFormula = steps[steps.length - 1].formula.trim();
          const ansStr = String(p.answer);

          assert.ok(lastFormula.includes('?'), `${p.key}: last step "${lastFormula}" missing '?'`);
          assert.notEqual(lastFormula, ansStr, `${p.key}: last step leaked bare answer "${ansStr}"`);
          assert.equal(
            lastFormula.endsWith(`= ${ansStr}`),
            false,
            `${p.key}: last step ended with "= ${ansStr}"`
          );

          if (p.format !== 'comparison' && p.format !== 'fraction') {
            assert.equal(
              lastFormula.endsWith('?'),
              true,
              `${p.key} (${p.operation}/${p.format}): expected final step "${lastFormula}" to end with '?'`
            );
          } else if (p.format === 'fraction') {
            assert.equal(
              lastFormula.includes(ansStr),
              false,
              `${p.key}: visual fraction final step "${lastFormula}" leaked "${ansStr}"`
            );
          } else if (p.format === 'comparison') {
            const solvedCmpRegex = new RegExp(`\\d+\\s*${escapeRegExp(ansStr)}\\s*\\d+`);
            assert.equal(
              solvedCmpRegex.test(lastFormula),
              false,
              `${p.key}: comparison final step "${lastFormula}" leaked "${ansStr}"`
            );
          }
          checked += 1;
        }
      }
    }
    assert.equal(checked, 480);
  });
});

/* ============================================================================
 * 11. Sprint 2 — Cookie Vault Rolling Recovery & State Polish (`state.js`)
 * ============================================================================ */

describe('11. Sprint 2 — Cookie Vault Rolling Accuracy Recovery & State Polish', () => {
  it('preserves skillMastery[tag].rolling booleans across localStorage wipe, healFromCookieVault(), and cold reload while staying < 3600 bytes', () => {
    const storage = createMockStorage();
    const cookieDoc = createMockCookieDoc();
    const clock = new Date(2026, 8, 12, 12, 0, 0).getTime();

    initState({ storage, cookieDoc, protocol: 'http:', now: () => clock });
    createProfile({ name: 'Lucas', tier: 'ace', starterId: 'pikachu' });

    const rollingPatterns = {
      add_within_20: [true, false, true, true, false, false, true, true, true, false],
      sub_within_20: [false, false, true, false],
      mul_tables_12: [false, false, false],
      div_exact_12: [true, true, true, true, true],
      make_ten: [],
      word_2step_champion: [true, false, true, false, true, true, false, true, false, false, true, true],
    };

    updateProfile((draft) => {
      draft.skillMastery = {
        add_within_20: { attempts: 14, correct: 10, rolling: rollingPatterns.add_within_20, consecutiveMisses: 1, level: 3 },
        sub_within_20: { attempts: 4, correct: 1, rolling: rollingPatterns.sub_within_20, consecutiveMisses: 1, level: 1 },
        mul_tables_12: { attempts: 3, correct: 0, rolling: rollingPatterns.mul_tables_12, consecutiveMisses: 3, level: 1 },
        div_exact_12: { attempts: 5, correct: 5, rolling: rollingPatterns.div_exact_12, consecutiveMisses: 0, level: 3 },
        make_ten: { attempts: 0, correct: 0, rolling: rollingPatterns.make_ten, consecutiveMisses: 0, level: 1 },
        word_2step_champion: { attempts: 12, correct: 7, rolling: rollingPatterns.word_2step_champion, consecutiveMisses: 0, level: 2 },
      };
    });

    const cookiePayload = cookieDoc.getValue(VAULT_COOKIE_NAME);
    assert.ok(typeof cookiePayload === 'string' && cookiePayload.length > 0);
    assert.ok(cookiePayload.length < 3600, `Cookie vault exceeded 3600 bytes: ${cookiePayload.length}`);

    const assertRollingIntact = (profile, label) => {
      assert.deepEqual(profile.skillMastery.add_within_20.rolling, rollingPatterns.add_within_20, `${label}: add_within_20`);
      assert.deepEqual(profile.skillMastery.sub_within_20.rolling, rollingPatterns.sub_within_20, `${label}: sub_within_20`);
      assert.deepEqual(profile.skillMastery.mul_tables_12.rolling, rollingPatterns.mul_tables_12, `${label}: mul_tables_12`);
      assert.deepEqual(profile.skillMastery.div_exact_12.rolling, rollingPatterns.div_exact_12, `${label}: div_exact_12`);
      assert.deepEqual(profile.skillMastery.make_ten.rolling, [], `${label}: make_ten`);
      // >10 history packs the most recent 10 booleans accurately
      assert.deepEqual(
        profile.skillMastery.word_2step_champion.rolling,
        rollingPatterns.word_2step_champion.slice(-10),
        `${label}: word_2step_champion last 10`
      );
      assert.equal(profile.skillMastery.add_within_20.attempts, 14);
      assert.equal(profile.skillMastery.add_within_20.correct, 10);
      assert.equal(profile.skillMastery.mul_tables_12.consecutiveMisses, 3);
    };

    // 1) Direct localStorage wipe + healFromCookieVault()
    storage.clear();
    assert.equal(storage.getItem(STORAGE_KEY), null);
    assert.equal(healFromCookieVault(), true);
    assertRollingIntact(getActiveProfile(), 'healFromCookieVault');

    // 2) Storage wipe + initState() cold recovery
    const wipedStorage = createMockStorage();
    initState({ storage: wipedStorage, cookieDoc, protocol: 'http:', now: () => clock + 5000 });
    assert.equal(getLastHealSource(), 'cookie-vault');
    assertRollingIntact(getActiveProfile(), 'initState-cookie-heal');

    // 3) Subprocess cold reload with empty storage + seeded cookie vault
    const stateModuleUrl = pathToFileURL(path.join(ROOT_DIR, 'js/core/state.js')).href;
    const coldRollingScript = [
      'const { initState, getActiveProfile, getLastHealSource, VAULT_COOKIE_NAME } = await import(process.env.POKEMATH_STATE_URL);',
      'const store = new Map();',
      'const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(String(k), String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };',
      'const cookieDoc = { cookie: `${VAULT_COOKIE_NAME}=${process.env.POKEMATH_SEED_COOKIE}` };',
      'initState({ storage, cookieDoc, protocol: "http:", now: () => Number(process.env.POKEMATH_TEST_NOW) });',
      'process.stdout.write(JSON.stringify({ healSource: getLastHealSource(), active: getActiveProfile() }));',
    ].join('\n');

    const childOut = execFileSync(
      process.execPath,
      ['--input-type=module', '-e', coldRollingScript],
      {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        env: {
          ...process.env,
          POKEMATH_STATE_URL: stateModuleUrl,
          POKEMATH_SEED_COOKIE: cookiePayload,
          POKEMATH_TEST_NOW: String(clock + 10000),
        },
      }
    );
    const parsedChild = JSON.parse(childOut);
    assert.equal(parsedChild.healSource, 'cookie-vault');
    assertRollingIntact(parsedChild.active, 'subprocess-cold-reload');

    // 4) Stress ceiling check: heavy roster + 15 packed rolling mastery tags still < 3600 bytes
    updateProfile((draft) => {
      for (let i = 0; i < 80; i += 1) {
        const sp = POKEMON_ROSTER[i];
        draft.caught[sp.id] = { count: 2, shiny: i % 8 === 0, firstCaughtAt: clock + i, nickname: `Ace${i}` };
      }
      for (let t = 0; t < 15; t += 1) {
        draft.skillMastery[`tag_stress_${t}`] = {
          attempts: 20 + t,
          correct: 15 + (t % 5),
          rolling: [true, false, true, true, false, true, false, true, true, true],
          consecutiveMisses: t % 3,
          level: 4,
        };
      }
    });
    const heavyCookie = cookieDoc.getValue(VAULT_COOKIE_NAME);
    assert.ok(heavyCookie && heavyCookie.length < 3600, `Heavy rolling cookie vault was ${heavyCookie?.length} bytes`);
  });

  it('validates setBuddyNickname(speciesId, name): max 16 chars, collapses whitespace, clearable to null', () => {
    const storage = createMockStorage();
    const cookieDoc = createMockCookieDoc();
    const clock = new Date(2026, 8, 15, 12, 0, 0).getTime();

    assert.equal(BUDDY_NICKNAME_MAX_LEN, 16);

    initState({ storage, cookieDoc, protocol: 'http:', now: () => clock });
    createProfile({ name: 'May', tier: 'starter', starterId: 'pikachu' });

    // Collapses surrounding & internal whitespace
    const res1 = setBuddyNickname('pikachu', '   Sparky   Bolt  \t ');
    assert.ok(res1 !== null);
    assert.equal(res1.nickname, 'Sparky Bolt');
    assert.equal(getActiveProfile().caught.pikachu.nickname, 'Sparky Bolt');

    // Survives storage wipe + cookie vault heal
    storage.clear();
    assert.equal(healFromCookieVault(), true);
    assert.equal(getActiveProfile().caught.pikachu.nickname, 'Sparky Bolt');

    // Enforces max 16 chars
    const resLong = setBuddyNickname('pikachu', 'SuperMegaElectricPikachu');
    assert.equal(resLong.nickname, 'SuperMegaElectri');
    assert.equal(resLong.nickname.length, 16);

    // Trims trailing space if truncation boundary lands on whitespace
    const resBoundary = setBuddyNickname('pikachu', '123456789012345 999');
    assert.equal(resBoundary.nickname, '123456789012345');
    assert.ok(resBoundary.nickname.length <= 16);

    // Clearable to null via null, empty string, and whitespace-only string
    assert.equal(setBuddyNickname('pikachu', null).nickname, null);
    assert.equal(getActiveProfile().caught.pikachu.nickname, null);

    setBuddyNickname('pikachu', 'Pika');
    assert.equal(setBuddyNickname('pikachu', '').nickname, null);
    assert.equal(getActiveProfile().caught.pikachu.nickname, null);

    setBuddyNickname('pikachu', 'Pika');
    assert.equal(setBuddyNickname('pikachu', '     ').nickname, null);
    assert.equal(getActiveProfile().caught.pikachu.nickname, null);

    // Rejects uncaught species, empty speciesId, and forbidden keys safely
    assert.equal(setBuddyNickname('mewtwo', 'Psychic'), null);
    assert.equal(getActiveProfile().caught.mewtwo, undefined);
    assert.equal(setBuddyNickname('', 'Invalid'), null);
    assert.equal(setBuddyNickname('__proto__', 'Pollute'), null);
  });

  it('uses canonical quest metrics (solve_total, solve_streak, catch_pokemon) and normalizes legacy metrics', () => {
    const storage = createMockStorage();
    const cookieDoc = createMockCookieDoc();
    const clock = new Date(2026, 8, 20, 12, 0, 0).getTime();

    initState({ storage, cookieDoc, protocol: 'http:', now: () => clock });
    const created = createProfile({ name: 'Brendan', tier: 'explorer', starterId: 'bulbasaur' });

    const defaultMetrics = created.activeQuests.map((q) => q.metric);
    assert.deepEqual(defaultMetrics, ['solve_total', 'solve_streak', 'catch_pokemon']);

    // Verify canonical quest metrics align with items.js QUEST_TEMPLATES
    const itemQuestMetrics = new Set(QUEST_TEMPLATES.map((q) => q.metric));
    for (const m of defaultMetrics) {
      assert.ok(itemQuestMetrics.has(m), `Default quest metric "${m}" missing from items.js QUEST_TEMPLATES`);
    }

    // 1) Legacy metrics normalized through importSaveJSON()
    const legacySave = {
      version: 1,
      activeProfileId: 'trainer-legacy-1',
      updatedAt: clock,
      profiles: [
        {
          id: 'trainer-legacy-1',
          name: 'LegacyRed',
          tier: 'starter',
          activeBuddyId: 'charmander',
          activeQuests: [
            { id: 'q-1', templateId: 'solve-5', title: 'Solve 5', metric: 'totalSolved', target: 5, progress: 3, rewardStardust: 15, claimed: false },
            { id: 'q-2', templateId: 'streak-3', title: 'Streak 3', metric: 'sessionStreak', target: 3, progress: 2, rewardStardust: 20, claimed: false },
            { id: 'q-3', templateId: 'catch-1', title: 'Catch 1', metric: 'catches', target: 1, progress: 1, rewardStardust: 25, claimed: true },
          ],
          createdAt: clock,
          updatedAt: clock,
        },
      ],
    };

    const imported = importSaveJSON(JSON.stringify(legacySave));
    assert.equal(imported.ok, true);
    const afterImport = getActiveProfile();
    assert.deepEqual(
      afterImport.activeQuests.map((q) => q.metric),
      ['solve_total', 'solve_streak', 'catch_pokemon']
    );
    assert.deepEqual(
      afterImport.activeQuests.map((q) => [q.progress, q.claimed]),
      [
        [3, false],
        [2, false],
        [1, true],
      ]
    );

    // 2) Legacy metrics in raw localStorage hydrated via initState()
    const legacyStorage = createMockStorage();
    const emptyCookie = createMockCookieDoc();
    legacyStorage.setItem(STORAGE_KEY, JSON.stringify(legacySave));
    initState({ storage: legacyStorage, cookieDoc: emptyCookie, protocol: 'http:', now: () => clock + 1000 });
    assert.deepEqual(
      getActiveProfile().activeQuests.map((q) => q.metric),
      ['solve_total', 'solve_streak', 'catch_pokemon']
    );

    // 3) Legacy metrics in compact cookie vault normalized via healFromCookieVault()
    const legacyCompactCookie = createMockCookieDoc();
    const legacyCompactPayload = {
      v: 1,
      ap: 'trainer-legacy-cookie',
      ts: clock + 2000,
      p: [
        {
          i: 'trainer-legacy-cookie',
          n: 'CookieLegacy',
          b: 'squirtle',
          aq: [
            ['q-1', 'solve-5', 'Solve 5', 'totalSolved', 5, 4, 15, 0],
            ['q-2', 'streak-3', 'Streak 3', 'sessionStreak', 3, 3, 20, 1],
            ['q-3', 'catch-1', 'Catch 1', 'catches', 1, 0, 25, 0],
          ],
          ua: clock + 2000,
        },
      ],
    };
    legacyCompactCookie.cookie = `${VAULT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(legacyCompactPayload))}; path=/`;
    const blankStorage = createMockStorage();
    initState({ storage: blankStorage, cookieDoc: legacyCompactCookie, protocol: 'http:', now: () => clock + 3000 });
    assert.equal(getLastHealSource(), 'cookie-vault');
    assert.deepEqual(
      getActiveProfile().activeQuests.map((q) => q.metric),
      ['solve_total', 'solve_streak', 'catch_pokemon']
    );
  });
});

/* ============================================================================
 * 12. Sprint 2 — Full Offline SW Precache, Manifest & CI Audit
 * ============================================================================ */

function collectFilesRecursive(dirAbs, ext, out = []) {
  for (const entry of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    const full = path.join(dirAbs, entry.name);
    if (entry.isDirectory()) {
      collectFilesRecursive(full, ext, out);
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      const relPosix = path.relative(ROOT_DIR, full).split(path.sep).join('/');
      out.push(`./${relPosix}`);
    }
  }
  return out;
}

describe('12. Sprint 2 — Full Offline SW Precache, Manifest & CI Audit', () => {
  it('precaches EVERY .css and .js file on disk in sw.js CORE_SHELL_URLS with ./ prefix', () => {
    const swJs = fs.readFileSync(path.join(ROOT_DIR, 'sw.js'), 'utf8');
    const shellArrayMatch = swJs.match(/const\s+CORE_SHELL_URLS\s*=\s*\[([\s\S]*?)\]/);
    assert.ok(shellArrayMatch, 'sw.js missing CORE_SHELL_URLS array');

    const listedUrls = [...shellArrayMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
    assert.equal(
      new Set(listedUrls).size,
      listedUrls.length,
      'sw.js CORE_SHELL_URLS contains duplicate entries'
    );
    const listedSet = new Set(listedUrls);

    const diskCss = collectFilesRecursive(path.join(ROOT_DIR, 'css'), '.css');
    const diskJs = collectFilesRecursive(path.join(ROOT_DIR, 'js'), '.js');

    assert.ok(diskCss.length >= 4, `Expected >= 4 CSS files on disk, found ${diskCss.length}`);
    assert.ok(diskJs.length >= 17, `Expected >= 17 JS files on disk, found ${diskJs.length}`);

    for (const rel of [...diskCss, ...diskJs]) {
      assert.ok(rel.startsWith('./'), `Expected ./ prefix for ${rel}`);
      assert.ok(
        listedSet.has(rel),
        `Offline precache gap: "${rel}" exists on disk but is missing from sw.js CORE_SHELL_URLS`
      );
    }

    // Also ensure no stale css/ or js/ URLs in CORE_SHELL_URLS
    for (const url of listedUrls) {
      if (url.startsWith('./css/') || url.startsWith('./js/')) {
        const diskPath = path.join(ROOT_DIR, url.slice(2));
        assert.equal(fs.existsSync(diskPath), true, `Stale CORE_SHELL_URLS entry missing on disk: ${url}`);
      }
    }
  });

  it('splits manifest.json icons into separate "any" and "maskable" entries for 192x192 and 512x512', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'manifest.json'), 'utf8'));
    assert.ok(Array.isArray(manifest.icons), 'manifest.json missing icons array');

    for (const icon of manifest.icons) {
      assert.equal(typeof icon.purpose, 'string', `Icon ${icon.src} (${icon.sizes}) missing purpose`);
      assert.equal(
        /any\s+maskable|maskable\s+any/i.test(icon.purpose),
        false,
        `manifest.json icon ${icon.src} (${icon.sizes}) must not combine "any maskable"`
      );
      assert.equal(
        icon.purpose.trim().split(/\s+/).length,
        1,
        `manifest.json icon ${icon.src} (${icon.sizes}) purpose "${icon.purpose}" must be a single token`
      );
    }

    const requiredPairs = [
      ['192x192', 'any', './assets/icons/icon-192.png'],
      ['192x192', 'maskable', './assets/icons/icon-192.png'],
      ['512x512', 'any', './assets/icons/icon-512.png'],
      ['512x512', 'maskable', './assets/icons/icon-512.png'],
    ];

    for (const [sizes, purpose, expectedSrc] of requiredPairs) {
      const matches = manifest.icons.filter((i) => i.sizes === sizes && i.purpose === purpose);
      assert.equal(
        matches.length,
        1,
        `Expected exactly 1 manifest icon entry for sizes="${sizes}" purpose="${purpose}", got ${matches.length}`
      );
      assert.equal(matches[0].src, expectedSrc);
      assert.equal(matches[0].type, 'image/png');
    }
  });

  it('gates GitHub Pages CI deploy on node --test tests/engine.test.mjs and excludes non-site files', () => {
    const workflowPath = path.join(ROOT_DIR, '.github', 'workflows', 'deploy-pages.yml');
    assert.equal(fs.existsSync(workflowPath), true, 'Missing .github/workflows/deploy-pages.yml');
    const yaml = fs.readFileSync(workflowPath, 'utf8');

    assert.match(yaml, /node-version:\s*['"]?22['"]?/, 'deploy-pages.yml must configure Node 22');
    const testCmdIdx = yaml.indexOf('node --test tests/engine.test.mjs');
    const uploadIdx = yaml.indexOf('actions/upload-pages-artifact');
    assert.ok(testCmdIdx !== -1, 'deploy-pages.yml must run node --test tests/engine.test.mjs');
    assert.ok(uploadIdx !== -1, 'deploy-pages.yml missing upload-pages-artifact step');
    assert.ok(testCmdIdx < uploadIdx, 'Test step must run BEFORE upload-pages-artifact');

    // Verify clean _site staging and required exclusions
    assert.match(yaml, /path:\s*_site\b/, 'upload-pages-artifact must upload staged _site directory');
    for (const excluded of ['.agents/', 'tests/', 'ARCHITECTURE.md', 'SPEC.md', 'HANDOFF.md']) {
      assert.ok(
        yaml.includes(`--exclude='${excluded}'`) || yaml.includes(`--exclude="${excluded}"`) || yaml.includes(`--exclude=${excluded}`),
        `deploy-pages.yml staging must exclude "${excluded}"`
      );
    }
  });
});

/* ============================================================================
 * 13. Sprint 2 — Zero Cross-Module CSS Collisions & Style Cleanup
 * ============================================================================ */

function parseCssBlock(cssText) {
  const stripped = String(cssText || '').replace(/\/\*[\s\S]*?\*\//g, '');
  const pmClasses = new Set();
  const keyframes = new Set();
  const ruleSelectors = [];

  const stack = [];
  let buf = '';
  for (let i = 0; i < stripped.length; i += 1) {
    const ch = stripped[i];
    if (ch === '{') {
      const header = buf.trim();
      buf = '';
      if (/^@(?:media|supports|layer|container)\b/i.test(header)) {
        stack.push('container');
      } else if (/^@keyframes\b/i.test(header)) {
        const kfMatch = header.match(/^@keyframes\s+([a-zA-Z_-][a-zA-Z0-9_-]*)/i);
        if (kfMatch) keyframes.add(kfMatch[1]);
        stack.push('keyframes');
      } else {
        const insideKeyframes = stack.includes('keyframes');
        if (!insideKeyframes && header && !header.startsWith('@')) {
          const parts = header
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          for (const sel of parts) {
            ruleSelectors.push(sel);
            for (const cm of sel.matchAll(/\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g)) {
              if (cm[1].startsWith('pm-')) {
                pmClasses.add(cm[1]);
              }
            }
          }
        }
        stack.push('rule');
      }
    } else if (ch === '}') {
      buf = '';
      stack.pop();
    } else {
      buf += ch;
    }
  }

  return { pmClasses, keyframes, ruleSelectors };
}

function createStyleAwareMockDocument() {
  const makeNode = (tagName, ns = 'http://www.w3.org/1999/xhtml') => {
    const base = createMockDomElement(tagName, ns);
    base.id = '';
    base.textContent = '';
    base.removeChild = (child) => {
      const idx = base.children.indexOf(child);
      if (idx >= 0) base.children.splice(idx, 1);
      child.parentNode = null;
      return child;
    };
    base.remove = () => {
      if (base.parentNode && typeof base.parentNode.removeChild === 'function') {
        base.parentNode.removeChild(base);
      }
    };
    base.querySelectorAll = () => [];
    base.closest = () => null;
    const origSetAttr = base.setAttribute;
    base.setAttribute = (name, value) => {
      if (String(name) === 'id') base.id = String(value);
      origSetAttr(name, value);
    };
    return base;
  };

  const head = makeNode('head');
  const body = makeNode('body');
  const findById = (node, id) => {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = findById(child, id);
      if (found) return found;
    }
    return null;
  };

  return {
    head,
    body,
    documentElement: { dataset: {} },
    createElement: (tag) => makeNode(tag, 'http://www.w3.org/1999/xhtml'),
    createElementNS: (ns, tag) => makeNode(tag, ns),
    getElementById: (id) => findById(head, id) || findById(body, id),
  };
}

describe('13. Sprint 2 — Zero Cross-Module CSS Collisions & Style Cleanup', () => {
  const GAME_MODULES = [
    { file: 'battleMode.js', prefix: 'pm-battle' },
    { file: 'catchMode.js', prefix: 'pm-catch' },
    { file: 'berryLabMode.js', prefix: 'pm-lab' },
    { file: 'evolutionForge.js', prefix: 'pm-forge' },
    { file: 'campPokedex.js', prefix: 'pm-camp' },
  ];

  it('mounts and unmounts every js/games/*.js module cleanly, removing its injected <style> element in unmount()', async () => {
    // Ensure our audited list matches every .js file in js/games/ on disk
    const diskGameFiles = fs
      .readdirSync(path.join(ROOT_DIR, 'js/games'))
      .filter((f) => f.endsWith('.js'))
      .sort();
    assert.deepEqual(
      diskGameFiles,
      GAME_MODULES.map((m) => m.file).sort(),
      'Expected GAME_MODULES audit list to cover every file in js/games/'
    );

    const prevDocument = globalThis.document;
    const mockDoc = createStyleAwareMockDocument();
    globalThis.document = mockDoc;

    // Seed isolated state for game module mounts
    const storage = createMockStorage();
    const cookieDoc = createMockCookieDoc();
    initState({ storage, cookieDoc, protocol: 'http:', now: () => 1775000000000 });
    createProfile({ name: 'StyleTester', tier: 'starter', starterId: 'pikachu' });

    const [stateMod, mathMod, hintMod, adaptiveMod, vfxMod, pokemonMod, routesMod, itemsMod] =
      await Promise.all([
        import('../js/core/state.js'),
        import('../js/core/mathEngine.js'),
        import('../js/core/hintEngine.js'),
        import('../js/core/adaptive.js'),
        import('../js/ui/vfx.js'),
        import('../js/data/pokemon.js'),
        import('../js/data/routes.js'),
        import('../js/data/items.js'),
      ]);

    const sharedCtx = {
      state: stateMod,
      mathEngine: mathMod,
      hintEngine: hintMod,
      adaptive: adaptiveMod,
      audio,
      vfx: vfxMod,
      pokemonData: pokemonMod,
      routesData: routesMod,
      itemsData: itemsMod,
      rotomPane: { setProblem() {}, setMood() {}, updateMetrics() {}, openHintTier() {}, render() {} },
      shell: { showToast() {}, render() {} },
      speedBlitz: { isEnabled: () => false, isBonusActive: () => false, consumeBonus: () => false, resetForProblem() {} },
      onNavigate() {},
      modeParams: {},
    };

    const seenStyleIds = new Set();

    try {
      for (const spec of GAME_MODULES) {
        const modUrl = pathToFileURL(path.join(ROOT_DIR, 'js/games', spec.file)).href;
        const mod = await import(modUrl);
        assert.equal(typeof mod.mount, 'function', `${spec.file} missing mount()`);
        assert.equal(typeof mod.unmount, 'function', `${spec.file} missing unmount()`);

        const container = mockDoc.createElement('div');
        try {
          assert.equal(mockDoc.head.children.length, 0, `${spec.file}: head should be clean before mount`);
          mod.mount(container, sharedCtx);

          const styleNodes = mockDoc.head.children.filter((n) => n.tagName === 'STYLE');
          assert.equal(
            styleNodes.length,
            1,
            `${spec.file}: expected exactly 1 injected <style> element on mount, got ${styleNodes.length}`
          );
          const styleEl = styleNodes[0];
          assert.ok(styleEl.id && styleEl.id.length > 0, `${spec.file}: injected <style> missing id`);
          assert.equal(
            seenStyleIds.has(styleEl.id),
            false,
            `${spec.file}: duplicate <style> id "${styleEl.id}"`
          );
          seenStyleIds.add(styleEl.id);
          assert.ok(
            typeof styleEl.textContent === 'string' && styleEl.textContent.trim().length > 100,
            `${spec.file}: injected <style> textContent unexpectedly empty`
          );
        } finally {
          mod.unmount();
        }

        const remainingStyles = mockDoc.head.children.filter((n) => n.tagName === 'STYLE');
        assert.equal(
          remainingStyles.length,
          0,
          `${spec.file}: unmount() left ${remainingStyles.length} <style> element(s) in document.head`
        );
      }
    } finally {
      if (prevDocument === undefined) {
        delete globalThis.document;
      } else {
        globalThis.document = prevDocument;
      }
    }
  });

  it('enforces exclusive mode CSS prefixes (.pm-battle-*, .pm-catch-*, .pm-lab-*, .pm-forge-*, .pm-camp-*) with zero cross-module collisions', () => {
    const ownerByClass = new Map();
    const ownerByKeyframe = new Map();

    for (const spec of GAME_MODULES) {
      const src = fs.readFileSync(path.join(ROOT_DIR, 'js/games', spec.file), 'utf8');
      const cssMatch = src.match(/(?:style\.textContent\s*=\s*|const\s+[A-Z_]+_CSS\s*=\s*)`([\s\S]*?)`/);
      assert.ok(cssMatch, `${spec.file}: failed to locate injected <style> template block`);

      const { pmClasses, keyframes, ruleSelectors } = parseCssBlock(cssMatch[1]);
      assert.ok(
        pmClasses.size >= 20,
        `${spec.file}: expected >= 20 .pm-* class selectors, found ${pmClasses.size}`
      );

      // 1) Every .pm-* class belongs exclusively to this mode's prefix & never overlaps another mode
      for (const cls of pmClasses) {
        const matchesOwnPrefix = cls === spec.prefix || cls.startsWith(`${spec.prefix}-`);
        assert.equal(
          matchesOwnPrefix,
          true,
          `${spec.file}: class ".${cls}" violates exclusive prefix ".${spec.prefix}*"`
        );
        assert.equal(
          ownerByClass.has(cls),
          false,
          `CSS collision: ".${cls}" declared in both ${ownerByClass.get(cls)} and ${spec.file}`
        );
        ownerByClass.set(cls, spec.file);
      }

      // 2) Zero unscoped rule selectors: every selector must be scoped under this mode's .pm-<mode> prefix
      const ownPrefixRegex = new RegExp(`\\.${escapeRegExp(spec.prefix)}(?:-[a-zA-Z0-9_-]+)?(?![a-zA-Z0-9_-])`);
      for (const sel of ruleSelectors) {
        assert.match(
          sel,
          ownPrefixRegex,
          `${spec.file}: unscoped CSS selector "${sel}" must be scoped to .${spec.prefix}*`
        );
      }

      // 3) Zero overlapping @keyframes across modules
      for (const kf of keyframes) {
        assert.equal(
          ownerByKeyframe.has(kf),
          false,
          `@keyframes collision: "${kf}" declared in both ${ownerByKeyframe.get(kf)} and ${spec.file}`
        );
        ownerByKeyframe.set(kf, spec.file);
      }
    }
  });
});

/* ============================================================================
 * 14. Sprint 2 — Audio Polish & Visibility Lifecycle (`js/core/audio.js`)
 * ============================================================================ */

function createMockAudioEnv() {
  const oscillators = [];
  const gainNodes = [];
  const intervals = new Map();
  let nextIntervalId = 1;
  let totalIntervalsCreated = 0;

  const makeAudioParam = (initial = 0) => {
    const events = [];
    return {
      value: initial,
      events,
      setValueAtTime(val, t) {
        this.value = val;
        events.push({ op: 'setValueAtTime', val, t });
      },
      linearRampToValueAtTime(val, t) {
        this.value = val;
        events.push({ op: 'linearRampToValueAtTime', val, t });
      },
      exponentialRampToValueAtTime(val, t) {
        this.value = val;
        events.push({ op: 'exponentialRampToValueAtTime', val, t });
      },
      setTargetAtTime(val, t, tc) {
        this.value = val;
        events.push({ op: 'setTargetAtTime', val, t, tc });
      },
      cancelScheduledValues(t) {
        events.push({ op: 'cancelScheduledValues', t });
      },
    };
  };

  class MockAudioContext {
    constructor() {
      this.sampleRate = 44100;
      this.currentTime = 1.0;
      this.state = 'running';
      this.destination = { kind: 'destination' };
    }
    resume() {
      this.state = 'running';
      return Promise.resolve();
    }
    createBuffer(_ch, len) {
      const data = new Float32Array(len);
      return { getChannelData: () => data };
    }
    createPeriodicWave(real, imag, opts) {
      return { real, imag, opts };
    }
    createDynamicsCompressor() {
      return {
        threshold: makeAudioParam(-16),
        knee: makeAudioParam(18),
        ratio: makeAudioParam(4),
        attack: makeAudioParam(0.004),
        release: makeAudioParam(0.18),
        connect() {},
      };
    }
    createGain() {
      const node = { gain: makeAudioParam(1), connect() {} };
      gainNodes.push(node);
      return node;
    }
    createBiquadFilter() {
      return {
        type: 'lowpass',
        frequency: makeAudioParam(1000),
        Q: makeAudioParam(1),
        connect() {},
      };
    }
    createOscillator() {
      const osc = {
        type: 'sine',
        frequency: makeAudioParam(440),
        detune: makeAudioParam(0),
        periodicWave: null,
        startedAt: null,
        stoppedAt: null,
        setPeriodicWave(w) {
          this.periodicWave = w;
        },
        connect() {},
        start(t) {
          this.startedAt = t;
        },
        stop(t) {
          this.stoppedAt = t;
        },
      };
      oscillators.push(osc);
      return osc;
    }
    createBufferSource() {
      return { buffer: null, connect() {}, start() {}, stop() {} };
    }
  }

  const visListeners = [];
  const mockDoc = {
    visibilityState: 'visible',
    hidden: false,
    addEventListener(type, fn) {
      if (type === 'visibilitychange') visListeners.push(fn);
    },
    removeEventListener(type, fn) {
      if (type !== 'visibilitychange') return;
      const idx = visListeners.indexOf(fn);
      if (idx >= 0) visListeners.splice(idx, 1);
    },
    emitVisibility(state) {
      this.visibilityState = state;
      this.hidden = state === 'hidden';
      for (const fn of [...visListeners]) {
        fn({ type: 'visibilitychange' });
      }
    },
  };

  const mockSetInterval = (fn, ms) => {
    const id = nextIntervalId;
    nextIntervalId += 1;
    totalIntervalsCreated += 1;
    intervals.set(id, { fn, ms });
    return id;
  };
  const mockClearInterval = (id) => {
    intervals.delete(id);
  };

  return {
    MockAudioContext,
    mockDoc,
    oscillators,
    gainNodes,
    intervals,
    visListeners,
    mockSetInterval,
    mockClearInterval,
    getTotalIntervalsCreated: () => totalIntervalsCreated,
  };
}

describe('14. Sprint 2 — Audio Polish & Visibility Lifecycle', () => {
  it('exercises playClick("select"), playClick("love"), and ambient toggles safely in Node without AudioContext', () => {
    assert.doesNotThrow(() => {
      audio.setAudioSettings({ sfx: true, ambient: false, speech: false });
      audio.playClick('select');
      audio.playClick('love');
      audio.setAudioSettings({ ambient: true });
      assert.equal(audio.toggleAmbientMusic(true), true);
      assert.equal(audio.toggleAmbientMusic(false), false);
    });
  });

  it('verifies select/love synthesis, strictly idempotent ambient loop, and clean visibilitychange hide/show', async () => {
    const env = createMockAudioEnv();
    const prevAudioContext = globalThis.AudioContext;
    const prevDocument = globalThis.document;
    const prevSetInterval = globalThis.setInterval;
    const prevClearInterval = globalThis.clearInterval;

    globalThis.AudioContext = env.MockAudioContext;
    globalThis.document = env.mockDoc;
    globalThis.setInterval = env.mockSetInterval;
    globalThis.clearInterval = env.mockClearInterval;

    // Import an isolated instance of audio.js so Suite 7's Node-only import remains untouched
    const audioUrl = `${pathToFileURL(path.join(ROOT_DIR, 'js/core/audio.js')).href}?sprint2-mock=1`;
    const mockedAudio = await import(audioUrl);

    try {
      assert.equal(mockedAudio.unlockAudio(), true);
      mockedAudio.setAudioSettings({ sfx: true, ambient: false, speech: false });

      // 1) playClick('select') — crisp 2-note PokéNav chime (2 marimba notes = 6 oscillators)
      const beforeSelect = env.oscillators.length;
      mockedAudio.playClick('select');
      const selectOscs = env.oscillators.slice(beforeSelect);
      assert.equal(selectOscs.length, 6, `Expected 6 oscillators for "select", got ${selectOscs.length}`);
      assert.ok(selectOscs.some((o) => Math.abs(o.frequency.value - 1174.66) < 0.1));
      assert.ok(selectOscs.some((o) => Math.abs(o.frequency.value - 1567.98) < 0.1));

      // 2) playClick('love') — warm 4-note heart-bell duet (2 marimba + 2 bell = 14 oscillators)
      const beforeLove = env.oscillators.length;
      mockedAudio.playClick('love');
      const loveOscs = env.oscillators.slice(beforeLove);
      assert.equal(loveOscs.length, 14, `Expected 14 oscillators for "love", got ${loveOscs.length}`);
      assert.ok(loveOscs.some((o) => Math.abs(o.frequency.value - 523.25) < 0.1));
      assert.ok(loveOscs.some((o) => Math.abs(o.frequency.value - 1046.5) < 0.1));

      // Zero square/sawtooth buzzer waveforms
      for (const osc of [...selectOscs, ...loveOscs]) {
        assert.notEqual(osc.type, 'square', 'Audio must never use square wave buzzers');
        assert.notEqual(osc.type, 'sawtooth', 'Audio must never use sawtooth wave buzzers');
      }

      // 3) Back-to-back setAudioSettings({ ambient: true }) + toggleAmbientMusic(true) is strictly idempotent
      const oscCountBeforeAmbient = env.oscillators.length;
      mockedAudio.setAudioSettings({ ambient: true });
      const oscCountAfterFirstEnable = env.oscillators.length;
      assert.equal(env.intervals.size, 1, 'Expected exactly 1 ambient interval after setAudioSettings({ ambient: true })');
      assert.equal(env.visListeners.length, 1, 'Expected exactly 1 visibilitychange listener');
      assert.ok(oscCountAfterFirstEnable > oscCountBeforeAmbient, 'Expected opening ambient note to play');

      // Back-to-back calls must NOT create a second interval or play a duplicate opening note
      assert.equal(mockedAudio.toggleAmbientMusic(true), true);
      mockedAudio.setAudioSettings({ ambient: true });
      assert.equal(env.intervals.size, 1, 'Back-to-back ambient enable must keep a single interval');
      assert.equal(env.getTotalIntervalsCreated(), 1, 'Back-to-back ambient enable must not re-create interval');
      assert.equal(env.visListeners.length, 1, 'Visibility listener must only be attached once');
      assert.equal(
        env.oscillators.length,
        oscCountAfterFirstEnable,
        'Back-to-back ambient enable must not play a double opening note'
      );

      // Ambient bus is the 3rd created GainNode (master, sfx, ambient)
      const ambientBus = env.gainNodes[2];
      assert.ok(ambientBus, 'Expected ambientBus gain node');

      // 4) Hidden visibility pauses interval cleanly and fades ambientBus gain down
      env.mockDoc.emitVisibility('hidden');
      assert.equal(env.intervals.size, 0, 'Hiding document must clear ambient interval');
      const lastHideTarget = [...ambientBus.gain.events]
        .reverse()
        .find((e) => e.op === 'setTargetAtTime');
      assert.ok(lastHideTarget && lastHideTarget.val <= 0.001, 'Hiding document must fade ambient gain down');

      // 5) Returning to visible resumes cleanly with a single interval and fades gain back up
      const oscBeforeResume = env.oscillators.length;
      env.mockDoc.emitVisibility('visible');
      assert.equal(env.intervals.size, 1, 'Showing document must resume a single ambient interval');
      assert.ok(env.oscillators.length > oscBeforeResume, 'Resuming visible should play ambient step');
      const lastShowTarget = [...ambientBus.gain.events]
        .reverse()
        .find((e) => e.op === 'setTargetAtTime');
      assert.ok(lastShowTarget && lastShowTarget.val >= 0.2, 'Showing document must fade ambient gain back up');

      // 6) Disabling ambient while hidden prevents restart on becoming visible again
      env.mockDoc.emitVisibility('hidden');
      assert.equal(env.intervals.size, 0);
      assert.equal(mockedAudio.toggleAmbientMusic(false), false);
      env.mockDoc.emitVisibility('visible');
      assert.equal(env.intervals.size, 0, 'Ambient disabled while hidden must not restart on visible');

      // 7) Enabling ambient while already hidden defers interval until visible
      env.mockDoc.emitVisibility('hidden');
      mockedAudio.setAudioSettings({ ambient: true });
      mockedAudio.toggleAmbientMusic(true);
      assert.equal(env.intervals.size, 0, 'Ambient enabled while hidden must defer interval');
      env.mockDoc.emitVisibility('visible');
      assert.equal(env.intervals.size, 1, 'Deferred ambient must start cleanly with 1 interval once visible');

      // Final clean shutdown
      assert.equal(mockedAudio.toggleAmbientMusic(false), false);
      assert.equal(env.intervals.size, 0);
    } finally {
      mockedAudio.toggleAmbientMusic(false);
      if (prevAudioContext === undefined) delete globalThis.AudioContext;
      else globalThis.AudioContext = prevAudioContext;
      if (prevDocument === undefined) delete globalThis.document;
      else globalThis.document = prevDocument;
      globalThis.setInterval = prevSetInterval;
      globalThis.clearInterval = prevClearInterval;
    }
  });
});
