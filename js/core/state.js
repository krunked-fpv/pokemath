export const VAULT_COOKIE_NAME = 'krunked-cookie-vault-v1';
export const STORAGE_KEY = 'pokemath-state-v1';

const STATE_VERSION = 1;
const MAX_COOKIE_ENCODED_BYTES = 3599; // Strictly < 3600 bytes
const DEFAULT_AVATAR_COLOR = '#E3350D';
const DEFAULT_STARTER_ID = 'pikachu';

const TIERS = ['starter', 'explorer', 'ace', 'champion'];

const DEFAULT_OPERATIONS = [
  'add',
  'sub',
  'mul',
  'div',
  'placeValue',
  'comparison',
  'fraction',
  'word'
];

const INVENTORY_KEYS = [
  'pokeball',
  'greatball',
  'ultraball',
  'premierball',
  'oran',
  'sitrus',
  'pecha',
  'lum',
  'starf',
  'goldenrazz',
  'rarecandy'
];

const DEFAULT_INVENTORY = {
  pokeball: 5,
  greatball: 1,
  ultraball: 0,
  premierball: 0,
  oran: 3,
  sitrus: 1,
  pecha: 2,
  lum: 0,
  starf: 0,
  goldenrazz: 0,
  rarecandy: 1
};

const ROUTE_IDS = [
  'route-1',
  'route-2',
  'route-3',
  'route-4',
  'route-5',
  'route-6'
];

const DEFAULT_QUEST_TEMPLATES = [
  {
    templateId: 'solve-5',
    title: 'Solve 5 Math Challenges',
    metric: 'solve_total',
    target: 5,
    rewardStardust: 15
  },
  {
    templateId: 'streak-3',
    title: 'Reach a 3-Answer Streak',
    metric: 'solve_streak',
    target: 3,
    rewardStardust: 20
  },
  {
    templateId: 'catch-1',
    title: 'Befriend 1 Wild Pokémon',
    metric: 'catch_pokemon',
    target: 1,
    rewardStardust: 25
  }
];

// Legacy quest metric names -> canonical names used by items.js templates.
const LEGACY_QUEST_METRICS = {
  totalSolved: 'solve_total',
  sessionStreak: 'solve_streak',
  catches: 'catch_pokemon'
};

function normalizeQuestMetric(metric, fallback) {
  if (typeof metric !== 'string' || !metric) return fallback;
  return Object.hasOwn(LEGACY_QUEST_METRICS, metric) ? LEGACY_QUEST_METRICS[metric] : metric;
}

const QUEST_TEMPLATE_BY_ID = Object.fromEntries(
  DEFAULT_QUEST_TEMPLATES.map((q) => [q.templateId, q])
);

const DEFAULT_SETTINGS = {
  sfx: true,
  ambient: false,
  speech: false,
  speedBlitz: false,
  reducedMotion: false
};

const SETTING_KEYS = [
  'sfx',
  'ambient',
  'speech',
  'speedBlitz',
  'reducedMotion'
];

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

let _env = {
  storage: null,
  cookieDoc: null,
  protocol: 'http:',
  now: null
};

let _state = createEmptyRootState();
let _initialized = false;
let _idCounter = 0;
let _lastHealSource = null;
const _subscribers = new Set();

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepClone(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item));
  }
  const out = {};
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    out[key] = deepClone(value[key]);
  }
  return out;
}

function safeGetGlobalStorage() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // Accessing localStorage can throw SecurityError in restricted frames.
  }
  return null;
}

function safeGetGlobalDocument() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.document) {
      return globalThis.document;
    }
  } catch {
    // Ignore restricted document access.
  }
  return null;
}

function safeGetGlobalProtocol() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.location && typeof globalThis.location.protocol === 'string') {
      return globalThis.location.protocol;
    }
  } catch {
    // Ignore restricted location access.
  }
  return 'http:';
}

function getNow() {
  if (typeof _env.now === 'function') {
    const val = Number(_env.now());
    if (Number.isFinite(val)) return Math.floor(val);
  } else if (typeof _env.now === 'number' && Number.isFinite(_env.now)) {
    return Math.floor(_env.now);
  }
  return Date.now();
}

function toFiniteInt(value, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const floored = Math.floor(num);
  if (floored < min) return min;
  if (floored > max) return max;
  return floored;
}

function toFiniteNumber(value, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  if (num < min) return min;
  if (num > max) return max;
  return num;
}

function toDayKey(timestampMs) {
  const d = new Date(Number.isFinite(timestampMs) ? timestampMs : getNow());
  const y = String(d.getFullYear()).padStart(4, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isValidDayKey(dayKey) {
  if (typeof dayKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
    return false;
  }
  const [y, m, d] = dayKey.split('-').map(Number);
  const check = new Date(Date.UTC(y, m - 1, d));
  return (
    check.getUTCFullYear() === y &&
    check.getUTCMonth() === m - 1 &&
    check.getUTCDate() === d
  );
}

function diffCalendarDays(fromDay, toDay) {
  const [fy, fm, fd] = fromDay.split('-').map(Number);
  const [ty, tm, td] = toDay.split('-').map(Number);
  const fromUtc = Date.UTC(fy, fm - 1, fd);
  const toUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((toUtc - fromUtc) / 86400000);
}

function createEmptyRootState(updatedAt = 0) {
  return {
    version: STATE_VERSION,
    activeProfileId: null,
    profiles: [],
    updatedAt
  };
}

function createDefaultCustomFilter() {
  return {
    enabled: false,
    operations: [...DEFAULT_OPERATIONS],
    maxNumber: null
  };
}

function createDefaultRouteProgress() {
  const progress = {};
  for (let i = 0; i < ROUTE_IDS.length; i += 1) {
    const routeId = ROUTE_IDS[i];
    progress[routeId] = {
      unlocked: i === 0,
      stars: 0,
      solvedCount: 0,
      bossDefeated: false
    };
  }
  return progress;
}

function createDefaultQuests() {
  return DEFAULT_QUEST_TEMPLATES.map((tpl, index) => ({
    id: `quest-${index + 1}`,
    templateId: tpl.templateId,
    title: tpl.title,
    metric: tpl.metric,
    target: tpl.target,
    progress: 0,
    rewardStardust: tpl.rewardStardust,
    claimed: false
  }));
}

function normalizeCustomFilter(raw) {
  if (!isPlainObject(raw)) {
    return createDefaultCustomFilter();
  }
  const ops = Array.isArray(raw.operations)
    ? raw.operations.filter((op) => typeof op === 'string' && DEFAULT_OPERATIONS.includes(op))
    : [...DEFAULT_OPERATIONS];
  const uniqueOps = [...new Set(ops)];
  let maxNumber = null;
  if (raw.maxNumber !== null && raw.maxNumber !== undefined && raw.maxNumber !== '') {
    const parsedMax = Number(raw.maxNumber);
    if (Number.isFinite(parsedMax) && parsedMax > 0) {
      maxNumber = Math.floor(parsedMax);
    }
  }
  return {
    enabled: Boolean(raw.enabled),
    operations: uniqueOps.length > 0 ? uniqueOps : [...DEFAULT_OPERATIONS],
    maxNumber
  };
}

function normalizeInventory(raw) {
  const inv = { ...DEFAULT_INVENTORY };
  if (!isPlainObject(raw)) {
    return inv;
  }
  for (const key of INVENTORY_KEYS) {
    if (Object.hasOwn(raw, key)) {
      inv[key] = toFiniteInt(raw[key], DEFAULT_INVENTORY[key], 0);
    }
  }
  for (const key of Object.keys(raw)) {
    if (FORBIDDEN_KEYS.has(key) || Object.hasOwn(inv, key)) continue;
    inv[key] = toFiniteInt(raw[key], 0, 0);
  }
  return inv;
}

function normalizeRouteProgress(raw) {
  const routes = createDefaultRouteProgress();
  if (!isPlainObject(raw)) {
    return routes;
  }
  for (let i = 0; i < ROUTE_IDS.length; i += 1) {
    const routeId = ROUTE_IDS[i];
    const entry = raw[routeId];
    if (isPlainObject(entry)) {
      routes[routeId] = {
        unlocked: typeof entry.unlocked === 'boolean' ? entry.unlocked : i === 0,
        stars: toFiniteInt(entry.stars, 0, 0, 3),
        solvedCount: toFiniteInt(entry.solvedCount, 0, 0),
        bossDefeated: Boolean(entry.bossDefeated)
      };
    }
  }
  return routes;
}

function normalizeCaught(raw, fallbackTimestamp) {
  const caught = {};
  if (!isPlainObject(raw)) {
    return caught;
  }
  for (const speciesId of Object.keys(raw)) {
    if (FORBIDDEN_KEYS.has(speciesId) || !speciesId) continue;
    const entry = raw[speciesId];
    if (!isPlainObject(entry)) continue;
    caught[speciesId] = {
      count: toFiniteInt(entry.count, 1, 1),
      shiny: Boolean(entry.shiny),
      firstCaughtAt: toFiniteInt(entry.firstCaughtAt, fallbackTimestamp, 0),
      nickname: typeof entry.nickname === 'string' && entry.nickname.trim()
        ? entry.nickname.trim()
        : null
    };
  }
  return caught;
}

function normalizeMysteryEggs(raw) {
  if (!Array.isArray(raw)) return [];
  const eggs = [];
  for (let i = 0; i < raw.length; i += 1) {
    const egg = raw[i];
    if (!isPlainObject(egg)) continue;
    eggs.push({
      id: typeof egg.id === 'string' && egg.id ? egg.id : `egg-${i + 1}`,
      warmth: toFiniteInt(egg.warmth, 0, 0, 3),
      source: typeof egg.source === 'string' ? egg.source : 'route-1',
      tierHint: typeof egg.tierHint === 'string' && TIERS.includes(egg.tierHint) ? egg.tierHint : 'starter'
    });
  }
  return eggs;
}

function normalizeSkillMastery(raw) {
  const mastery = {};
  if (!isPlainObject(raw)) return mastery;
  for (const tag of Object.keys(raw)) {
    if (FORBIDDEN_KEYS.has(tag) || !tag) continue;
    const entry = raw[tag];
    if (!isPlainObject(entry)) continue;
    const rolling = Array.isArray(entry.rolling)
      ? entry.rolling.slice(-20).map(Boolean)
      : [];
    mastery[tag] = {
      attempts: toFiniteInt(entry.attempts, 0, 0),
      correct: toFiniteInt(entry.correct, 0, 0),
      rolling,
      consecutiveMisses: toFiniteInt(entry.consecutiveMisses, 0, 0),
      level: toFiniteInt(entry.level, 1, 0, 10)
    };
  }
  return mastery;
}

function normalizeQuests(raw) {
  if (!Array.isArray(raw)) {
    return createDefaultQuests();
  }
  const quests = [];
  for (let i = 0; i < raw.length; i += 1) {
    const q = raw[i];
    if (!isPlainObject(q)) continue;
    const templateId = typeof q.templateId === 'string' && q.templateId ? q.templateId : `custom-${i + 1}`;
    const template = QUEST_TEMPLATE_BY_ID[templateId];
    const target = toFiniteInt(q.target, template?.target ?? 5, 1);
    quests.push({
      id: typeof q.id === 'string' && q.id ? q.id : `quest-${i + 1}`,
      templateId,
      title: typeof q.title === 'string' && q.title.trim()
        ? q.title.trim()
        : (template?.title ?? 'Complete Challenge'),
      metric: normalizeQuestMetric(q.metric, template?.metric ?? 'solve_total'),
      target,
      progress: toFiniteInt(q.progress, 0, 0),
      rewardStardust: toFiniteInt(q.rewardStardust, template?.rewardStardust ?? 15, 0),
      claimed: Boolean(q.claimed)
    });
  }
  return quests;
}

function normalizeSettings(raw) {
  if (!isPlainObject(raw)) {
    return { ...DEFAULT_SETTINGS };
  }
  return {
    sfx: typeof raw.sfx === 'boolean' ? raw.sfx : DEFAULT_SETTINGS.sfx,
    ambient: typeof raw.ambient === 'boolean' ? raw.ambient : DEFAULT_SETTINGS.ambient,
    speech: typeof raw.speech === 'boolean' ? raw.speech : DEFAULT_SETTINGS.speech,
    speedBlitz: typeof raw.speedBlitz === 'boolean' ? raw.speedBlitz : DEFAULT_SETTINGS.speedBlitz,
    reducedMotion: typeof raw.reducedMotion === 'boolean' ? raw.reducedMotion : DEFAULT_SETTINGS.reducedMotion
  };
}

function normalizeStreak(raw, fallbackTimestamp) {
  const defaultDay = toDayKey(fallbackTimestamp);
  if (!isPlainObject(raw)) {
    return { current: 1, best: 1, lastActiveDay: defaultDay };
  }
  const current = toFiniteInt(raw.current, 1, 1);
  const best = Math.max(current, toFiniteInt(raw.best, 1, 1));
  const lastActiveDay = isValidDayKey(raw.lastActiveDay) ? raw.lastActiveDay : defaultDay;
  return { current, best, lastActiveDay };
}

function normalizeStringArray(raw, fallback = []) {
  if (!Array.isArray(raw)) return [...fallback];
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    if (typeof item === 'string' && item.trim() && !seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

function generateProfileId(nowTs) {
  _idCounter += 1;
  const tsPart = Math.max(0, Math.floor(nowTs)).toString(36);
  const seqPart = _idCounter.toString(36);
  const randPart = Math.random().toString(36).slice(2, 6);
  return `trainer-${tsPart}-${seqPart}${randPart}`;
}

function normalizeProfile(raw, nowTs = getNow()) {
  const src = isPlainObject(raw) ? raw : {};
  const createdAt = toFiniteInt(src.createdAt, nowTs, 0);
  const updatedAt = Math.max(createdAt, toFiniteInt(src.updatedAt, createdAt, 0));
  const activeBuddyId = typeof src.activeBuddyId === 'string' && src.activeBuddyId.trim()
    ? src.activeBuddyId.trim()
    : DEFAULT_STARTER_ID;

  const ownedAccessories = Array.isArray(src.ownedAccessories)
    ? normalizeStringArray(src.ownedAccessories, [])
    : ['classic-cap'];
  if (!ownedAccessories.includes('classic-cap')) {
    ownedAccessories.unshift('classic-cap');
  }

  const equippedAccessories = Array.isArray(src.equippedAccessories)
    ? normalizeStringArray(src.equippedAccessories, [])
    : ['classic-cap'];

  const caught = normalizeCaught(src.caught, createdAt);
  if (Object.keys(caught).length === 0 && activeBuddyId) {
    caught[activeBuddyId] = {
      count: 1,
      shiny: false,
      firstCaughtAt: createdAt,
      nickname: null
    };
  }

  return {
    id: typeof src.id === 'string' && src.id.trim() ? src.id.trim() : generateProfileId(createdAt),
    name: typeof src.name === 'string' && src.name.trim() ? src.name.trim() : 'Trainer',
    avatarColor: typeof src.avatarColor === 'string' && src.avatarColor.trim()
      ? src.avatarColor.trim()
      : DEFAULT_AVATAR_COLOR,
    tier: typeof src.tier === 'string' && TIERS.includes(src.tier) ? src.tier : 'starter',
    customFilter: normalizeCustomFilter(src.customFilter),
    activeBuddyId,
    buddyXp: toFiniteInt(src.buddyXp, 0, 0),
    buddyLevel: toFiniteInt(src.buddyLevel, 1, 1),
    evolutionMeter: toFiniteNumber(src.evolutionMeter, 0, 0, 100),
    caught,
    equippedAccessories,
    ownedAccessories,
    inventory: normalizeInventory(src.inventory),
    mysteryEggs: normalizeMysteryEggs(src.mysteryEggs),
    routeProgress: normalizeRouteProgress(src.routeProgress),
    badges: normalizeStringArray(src.badges, []),
    classicEmblemUnlocked: Boolean(src.classicEmblemUnlocked),
    coins: toFiniteInt(src.coins, 50, 0),
    stardust: toFiniteInt(src.stardust, 20, 0),
    shinyCharmBoost: toFiniteNumber(src.shinyCharmBoost, 0, 0),
    streak: normalizeStreak(src.streak, updatedAt),
    sessionStreak: toFiniteInt(src.sessionStreak, 0, 0),
    totalSolved: toFiniteInt(src.totalSolved, 0, 0),
    totalAttempts: toFiniteInt(src.totalAttempts, 0, 0),
    skillMastery: normalizeSkillMastery(src.skillMastery),
    activeQuests: normalizeQuests(src.activeQuests),
    settings: normalizeSettings(src.settings),
    createdAt,
    updatedAt
  };
}

function normalizeRootState(raw, nowTs = getNow()) {
  if (!isPlainObject(raw) || !Array.isArray(raw.profiles)) {
    return null;
  }
  const seenIds = new Set();
  const profiles = [];
  for (const item of raw.profiles) {
    if (!isPlainObject(item)) return null;
    if (typeof item.id !== 'string' && typeof item.name !== 'string') return null;
    const profile = normalizeProfile(item, nowTs);
    if (seenIds.has(profile.id)) {
      profile.id = generateProfileId(nowTs);
    }
    seenIds.add(profile.id);
    profiles.push(profile);
  }

  let activeProfileId = typeof raw.activeProfileId === 'string' ? raw.activeProfileId : null;
  if (profiles.length === 0) {
    activeProfileId = null;
  } else if (!activeProfileId || !seenIds.has(activeProfileId)) {
    activeProfileId = profiles[0].id;
  }

  const maxProfileTs = profiles.reduce((acc, p) => Math.max(acc, p.updatedAt || 0), 0);
  const updatedAt = Math.max(toFiniteInt(raw.updatedAt, 0, 0), maxProfileTs);

  return {
    version: STATE_VERSION,
    activeProfileId,
    profiles,
    updatedAt
  };
}

function computeStateTimestamp(state) {
  if (!state) return 0;
  let maxTs = toFiniteInt(state.updatedAt, 0, 0);
  if (Array.isArray(state.profiles)) {
    for (const p of state.profiles) {
      if (p && Number.isFinite(p.updatedAt) && p.updatedAt > maxTs) {
        maxTs = p.updatedAt;
      }
    }
  }
  return maxTs;
}

// ============================================================================
// Storage & Cookie Vault I/O
// ============================================================================

function readStorageState(nowTs) {
  const storage = _env.storage;
  if (!storage || typeof storage.getItem !== 'function') {
    return null;
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw || typeof raw !== 'string') return null;
    const parsed = JSON.parse(raw);
    return normalizeRootState(parsed, nowTs);
  } catch {
    return null;
  }
}

function writeStorageState(state) {
  const storage = _env.storage;
  if (!storage || typeof storage.setItem !== 'function') {
    return false;
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function readVaultCookieRaw(cookieDoc) {
  if (!cookieDoc) return null;
  let cookieStr = '';
  try {
    cookieStr = typeof cookieDoc.cookie === 'string' ? cookieDoc.cookie : '';
  } catch {
    return null;
  }
  if (!cookieStr) return null;
  const prefix = `${VAULT_COOKIE_NAME}=`;
  const parts = cookieStr.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      const value = trimmed.slice(prefix.length).trim();
      return value.length > 0 ? value : null;
    }
  }
  return null;
}

function writeVaultCookieRaw(cookieDoc, encodedPayload, protocol) {
  if (!cookieDoc) return false;
  const secureAttr = protocol === 'https:' ? '; Secure' : '';
  const cookieLine = `${VAULT_COOKIE_NAME}=${encodedPayload}; path=/; max-age=31536000; SameSite=Lax${secureAttr}`;
  try {
    cookieDoc.cookie = cookieLine;
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Compact Cookie Vault Serialization (< 3600 bytes)
// ============================================================================

function encodeSettingsMask(settings) {
  let mask = 0;
  for (let i = 0; i < SETTING_KEYS.length; i += 1) {
    if (settings?.[SETTING_KEYS[i]]) {
      mask |= (1 << i);
    }
  }
  return mask;
}

function decodeSettingsMask(mask) {
  const num = toFiniteInt(mask, 1, 0, 31);
  const out = {};
  for (let i = 0; i < SETTING_KEYS.length; i += 1) {
    out[SETTING_KEYS[i]] = Boolean(num & (1 << i));
  }
  return out;
}

// Pack the last ROLLING_PACK_LEN mastery booleans into one integer with a leading
// sentinel 1-bit (oldest first): [] -> 1, [true,false] -> 0b110. Max 2047.
const ROLLING_PACK_LEN = 10;

function packRolling(rolling) {
  if (!Array.isArray(rolling)) return 1;
  let packed = 1;
  for (const hit of rolling.slice(-ROLLING_PACK_LEN)) {
    packed = (packed << 1) | (hit ? 1 : 0);
  }
  return packed;
}

function unpackRolling(packed) {
  // Also accept a [len, bitmask] pair (bit 0 = most recent answer).
  if (Array.isArray(packed)) {
    const len = toFiniteInt(packed[0], 0, 0, ROLLING_PACK_LEN);
    const mask = toFiniteInt(packed[1], 0, 0);
    const out = [];
    for (let i = len - 1; i >= 0; i -= 1) out.push(Boolean((mask >> i) & 1));
    return out;
  }
  const value = toFiniteInt(packed, 1, 1, (1 << (ROLLING_PACK_LEN + 1)) - 1);
  const len = 31 - Math.clz32(value);
  const out = [];
  for (let i = len - 1; i >= 0; i -= 1) out.push(Boolean((value >> i) & 1));
  return out;
}

function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function encodeProfileCompact(profile, options = {}) {
  const {
    includeNicknames = true,
    maxSkillTags = Infinity,
    includeQuests = true,
    dropKnownQuestTitles = false,
    includeEggs = true,
    includeSkillMastery = true,
    droppedCaughtIds = null,
    maxNameLen = 64
  } = options;

  const compact = {
    i: profile.id,
    n: String(profile.name || 'Trainer').slice(0, maxNameLen)
  };

  if (profile.avatarColor && profile.avatarColor !== DEFAULT_AVATAR_COLOR) {
    compact.ac = profile.avatarColor;
  }
  const tierIdx = TIERS.indexOf(profile.tier);
  if (tierIdx > 0) {
    compact.t = tierIdx;
  }

  const cf = profile.customFilter;
  if (
    cf &&
    (cf.enabled ||
      cf.maxNumber !== null ||
      !arraysEqual(cf.operations, DEFAULT_OPERATIONS))
  ) {
    compact.cf = [
      cf.enabled ? 1 : 0,
      cf.operations,
      cf.maxNumber === null ? null : cf.maxNumber
    ];
  }

  if (profile.activeBuddyId && profile.activeBuddyId !== DEFAULT_STARTER_ID) {
    compact.b = profile.activeBuddyId;
  }
  if (profile.buddyXp > 0) compact.bx = profile.buddyXp;
  if (profile.buddyLevel > 1) compact.bl = profile.buddyLevel;
  if (profile.evolutionMeter > 0) compact.em = profile.evolutionMeter;

  // Compact caught entries: [id, count, shiny01, nickname?]
  const caughtEntries = [];
  for (const speciesId of Object.keys(profile.caught || {})) {
    if (droppedCaughtIds && droppedCaughtIds.has(speciesId)) continue;
    const entry = profile.caught[speciesId];
    if (!entry) continue;
    const row = [speciesId, entry.count || 1, entry.shiny ? 1 : 0];
    if (includeNicknames && entry.nickname) {
      row.push(String(entry.nickname).slice(0, 24));
    }
    caughtEntries.push(row);
  }
  if (caughtEntries.length > 0) {
    compact.c = caughtEntries;
  }

  if (!arraysEqual(profile.equippedAccessories, ['classic-cap'])) {
    compact.ea = profile.equippedAccessories;
  }
  if (!arraysEqual(profile.ownedAccessories, ['classic-cap'])) {
    compact.oa = profile.ownedAccessories;
  }

  const invArr = INVENTORY_KEYS.map((k) => toFiniteInt(profile.inventory?.[k], DEFAULT_INVENTORY[k], 0));
  const defaultInvArr = INVENTORY_KEYS.map((k) => DEFAULT_INVENTORY[k]);
  if (!arraysEqual(invArr, defaultInvArr)) {
    compact.inv = invArr;
  }

  if (includeEggs && Array.isArray(profile.mysteryEggs) && profile.mysteryEggs.length > 0) {
    compact.egg = profile.mysteryEggs.map((e) => [e.id, e.warmth, e.source, e.tierHint]);
  }

  const rpArr = ROUTE_IDS.map((id, idx) => {
    const r = profile.routeProgress?.[id] || {
      unlocked: idx === 0,
      stars: 0,
      solvedCount: 0,
      bossDefeated: false
    };
    return [r.unlocked ? 1 : 0, r.stars || 0, r.solvedCount || 0, r.bossDefeated ? 1 : 0];
  });
  const isDefaultRp = rpArr.every(
    (r, idx) => r[0] === (idx === 0 ? 1 : 0) && r[1] === 0 && r[2] === 0 && r[3] === 0
  );
  if (!isDefaultRp) {
    compact.rp = rpArr;
  }

  if (Array.isArray(profile.badges) && profile.badges.length > 0) {
    compact.bg = profile.badges;
  }
  if (profile.classicEmblemUnlocked) {
    compact.ce = 1;
  }
  if (profile.coins !== 50) compact.co = profile.coins;
  if (profile.stardust !== 20) compact.sd = profile.stardust;
  if (profile.shinyCharmBoost > 0) compact.sc = profile.shinyCharmBoost;

  if (profile.streak) {
    compact.st = [
      profile.streak.current || 1,
      profile.streak.best || 1,
      profile.streak.lastActiveDay
    ];
  }
  if (profile.sessionStreak > 0) compact.ss = profile.sessionStreak;
  if (profile.totalSolved > 0) compact.sv = profile.totalSolved;
  if (profile.totalAttempts > 0) compact.at = profile.totalAttempts;

  if (includeSkillMastery && isPlainObject(profile.skillMastery)) {
    const tags = Object.keys(profile.skillMastery)
      .sort((a, b) => (profile.skillMastery[b]?.attempts || 0) - (profile.skillMastery[a]?.attempts || 0))
      .slice(0, maxSkillTags);
    if (tags.length > 0) {
      const sm = {};
      for (const tag of tags) {
        const m = profile.skillMastery[tag];
        if (!m) continue;
        const row = [m.attempts || 0, m.correct || 0, m.consecutiveMisses || 0, m.level ?? 1];
        const packed = packRolling(m.rolling);
        if (packed > 1) row.push(packed);
        sm[tag] = row;
      }
      compact.sm = sm;
    }
  }

  if (includeQuests && Array.isArray(profile.activeQuests)) {
    const isExactDefaultQuests =
      profile.activeQuests.length === DEFAULT_QUEST_TEMPLATES.length &&
      profile.activeQuests.every((q, idx) => {
        const tpl = DEFAULT_QUEST_TEMPLATES[idx];
        return (
          q.id === `quest-${idx + 1}` &&
          q.templateId === tpl.templateId &&
          q.progress === 0 &&
          !q.claimed &&
          q.target === tpl.target
        );
      });
    if (!isExactDefaultQuests) {
      compact.aq = profile.activeQuests.map((q) => {
        const knownTpl = QUEST_TEMPLATE_BY_ID[q.templateId];
        const title = dropKnownQuestTitles && knownTpl && q.title === knownTpl.title
          ? ''
          : q.title;
        return [
          q.id,
          q.templateId,
          title,
          q.metric,
          q.target,
          q.progress,
          q.rewardStardust,
          q.claimed ? 1 : 0
        ];
      });
    }
  }

  const mask = encodeSettingsMask(profile.settings);
  if (mask !== 1) {
    compact.cfg = mask;
  }

  if (profile.createdAt !== profile.updatedAt) {
    compact.ca = profile.createdAt;
  }
  compact.ua = profile.updatedAt;

  return compact;
}

function decodeProfileCompact(c, fallbackTs) {
  if (!isPlainObject(c) || typeof c.i !== 'string') {
    return null;
  }
  const updatedAt = toFiniteInt(c.ua, fallbackTs, 0);
  const createdAt = toFiniteInt(c.ca, updatedAt, 0);

  const tierIdx = toFiniteInt(c.t, 0, 0, TIERS.length - 1);
  const tier = TIERS[tierIdx] || 'starter';

  let customFilter = createDefaultCustomFilter();
  if (Array.isArray(c.cf)) {
    customFilter = normalizeCustomFilter({
      enabled: Boolean(c.cf[0]),
      operations: c.cf[1],
      maxNumber: c.cf[2]
    });
  }

  const activeBuddyId = typeof c.b === 'string' && c.b ? c.b : DEFAULT_STARTER_ID;

  const caught = {};
  if (Array.isArray(c.c)) {
    for (const row of c.c) {
      if (!Array.isArray(row) || typeof row[0] !== 'string' || !row[0]) continue;
      if (FORBIDDEN_KEYS.has(row[0])) continue;
      caught[row[0]] = {
        count: toFiniteInt(row[1], 1, 1),
        shiny: Boolean(row[2]),
        firstCaughtAt: createdAt,
        nickname: typeof row[3] === 'string' && row[3].trim() ? row[3].trim() : null
      };
    }
  }

  const inventory = { ...DEFAULT_INVENTORY };
  if (Array.isArray(c.inv)) {
    for (let i = 0; i < INVENTORY_KEYS.length; i += 1) {
      if (c.inv[i] !== undefined) {
        inventory[INVENTORY_KEYS[i]] = toFiniteInt(c.inv[i], DEFAULT_INVENTORY[INVENTORY_KEYS[i]], 0);
      }
    }
  }

  const mysteryEggs = Array.isArray(c.egg)
    ? c.egg
        .filter((e) => Array.isArray(e))
        .map((e, idx) => ({
          id: typeof e[0] === 'string' && e[0] ? e[0] : `egg-${idx + 1}`,
          warmth: toFiniteInt(e[1], 0, 0, 3),
          source: typeof e[2] === 'string' ? e[2] : 'route-1',
          tierHint: typeof e[3] === 'string' && TIERS.includes(e[3]) ? e[3] : 'starter'
        }))
    : [];

  const routeProgress = createDefaultRouteProgress();
  if (Array.isArray(c.rp)) {
    for (let i = 0; i < ROUTE_IDS.length; i += 1) {
      const row = c.rp[i];
      if (!Array.isArray(row)) continue;
      routeProgress[ROUTE_IDS[i]] = {
        unlocked: Boolean(row[0]),
        stars: toFiniteInt(row[1], 0, 0, 3),
        solvedCount: toFiniteInt(row[2], 0, 0),
        bossDefeated: Boolean(row[3])
      };
    }
  }

  const skillMastery = {};
  if (isPlainObject(c.sm)) {
    for (const tag of Object.keys(c.sm)) {
      if (FORBIDDEN_KEYS.has(tag)) continue;
      const row = c.sm[tag];
      if (!Array.isArray(row)) continue;
      skillMastery[tag] = {
        attempts: toFiniteInt(row[0], 0, 0),
        correct: toFiniteInt(row[1], 0, 0),
        rolling: unpackRolling(row[4]),
        consecutiveMisses: toFiniteInt(row[2], 0, 0),
        level: toFiniteInt(row[3], 1, 0, 10)
      };
    }
  }

  let activeQuests;
  if (Array.isArray(c.aq)) {
    activeQuests = c.aq
      .filter((q) => Array.isArray(q))
      .map((q, idx) => {
        const templateId = typeof q[1] === 'string' && q[1] ? q[1] : `custom-${idx + 1}`;
        const tpl = QUEST_TEMPLATE_BY_ID[templateId];
        return {
          id: typeof q[0] === 'string' && q[0] ? q[0] : `quest-${idx + 1}`,
          templateId,
          title: typeof q[2] === 'string' && q[2].trim()
            ? q[2].trim()
            : (tpl?.title ?? 'Complete Challenge'),
          metric: normalizeQuestMetric(q[3], tpl?.metric ?? 'solve_total'),
          target: toFiniteInt(q[4], tpl?.target ?? 5, 1),
          progress: toFiniteInt(q[5], 0, 0),
          rewardStardust: toFiniteInt(q[6], tpl?.rewardStardust ?? 15, 0),
          claimed: Boolean(q[7])
        };
      });
  } else {
    activeQuests = createDefaultQuests();
  }

  const streak = Array.isArray(c.st)
    ? {
        current: toFiniteInt(c.st[0], 1, 1),
        best: toFiniteInt(c.st[1], 1, 1),
        lastActiveDay: isValidDayKey(c.st[2]) ? c.st[2] : toDayKey(updatedAt)
      }
    : { current: 1, best: 1, lastActiveDay: toDayKey(updatedAt) };

  return normalizeProfile(
    {
      id: c.i,
      name: c.n,
      avatarColor: c.ac ?? DEFAULT_AVATAR_COLOR,
      tier,
      customFilter,
      activeBuddyId,
      buddyXp: c.bx ?? 0,
      buddyLevel: c.bl ?? 1,
      evolutionMeter: c.em ?? 0,
      caught,
      equippedAccessories: Array.isArray(c.ea) ? c.ea : ['classic-cap'],
      ownedAccessories: Array.isArray(c.oa) ? c.oa : ['classic-cap'],
      inventory,
      mysteryEggs,
      routeProgress,
      badges: Array.isArray(c.bg) ? c.bg : [],
      classicEmblemUnlocked: Boolean(c.ce),
      coins: c.co ?? 50,
      stardust: c.sd ?? 20,
      shinyCharmBoost: c.sc ?? 0,
      streak,
      sessionStreak: c.ss ?? 0,
      totalSolved: c.sv ?? 0,
      totalAttempts: c.at ?? 0,
      skillMastery,
      activeQuests,
      settings: c.cfg !== undefined ? decodeSettingsMask(c.cfg) : { ...DEFAULT_SETTINGS },
      createdAt,
      updatedAt
    },
    updatedAt
  );
}

function encodeVaultJson(payload) {
  const json = JSON.stringify(payload);
  const encoded = encodeURIComponent(json);
  return { json, encoded, bytes: encoded.length };
}

function buildCompactVaultEncoded(rootState) {
  const buildFromProfiles = (profiles, perProfileOptions) => {
    const p = profiles.map((prof, idx) =>
      encodeProfileCompact(prof, typeof perProfileOptions === 'function' ? perProfileOptions(prof, idx) : perProfileOptions)
    );
    return {
      v: STATE_VERSION,
      ap: rootState.activeProfileId,
      ts: computeStateTimestamp(rootState),
      p
    };
  };

  // Stage 0: full compact fidelity
  let attempt = encodeVaultJson(buildFromProfiles(rootState.profiles, {}));
  if (attempt.bytes <= MAX_COOKIE_ENCODED_BYTES) {
    return attempt.encoded;
  }

  // Stage 1: trim nicknames, known quest titles, and secondary mastery tags
  const stage1Opts = {
    includeNicknames: false,
    dropKnownQuestTitles: true,
    maxSkillTags: 8
  };
  attempt = encodeVaultJson(buildFromProfiles(rootState.profiles, stage1Opts));
  if (attempt.bytes <= MAX_COOKIE_ENCODED_BYTES) {
    return attempt.encoded;
  }

  // Build ordered list of droppable caught items (oldest non-shiny excess first,
  // inactive profiles before active profile; activeBuddyId and shinies protected longest).
  const collectDroppables = (profiles, includeShinyAndBuddy) => {
    const list = [];
    for (let idx = 0; idx < profiles.length; idx += 1) {
      const prof = profiles[idx];
      const isActive = prof.id === rootState.activeProfileId;
      for (const speciesId of Object.keys(prof.caught || {})) {
        const entry = prof.caught[speciesId];
        if (!entry) continue;
        const isBuddy = speciesId === prof.activeBuddyId;
        const isShiny = Boolean(entry.shiny);
        if (!includeShinyAndBuddy && (isBuddy || isShiny)) continue;
        let tierPriority = 0;
        if (isActive) tierPriority += 10;
        if (isShiny) tierPriority += 20;
        if (isBuddy) tierPriority += 40;
        list.push({
          profileId: prof.id,
          speciesId,
          tierPriority,
          firstCaughtAt: entry.firstCaughtAt || 0
        });
      }
    }
    list.sort((a, b) => {
      if (a.tierPriority !== b.tierPriority) return a.tierPriority - b.tierPriority;
      return a.firstCaughtAt - b.firstCaughtAt;
    });
    return list;
  };

  const tryBinaryTrim = (profiles, baseOpts, droppables) => {
    const buildWithDropCount = (dropCount) => {
      const droppedByProfile = new Map();
      for (let i = 0; i < dropCount; i += 1) {
        const item = droppables[i];
        let set = droppedByProfile.get(item.profileId);
        if (!set) {
          set = new Set();
          droppedByProfile.set(item.profileId, set);
        }
        set.add(item.speciesId);
      }
      const payload = buildFromProfiles(profiles, (prof) => ({
        ...baseOpts,
        droppedCaughtIds: droppedByProfile.get(prof.id) || null
      }));
      return encodeVaultJson(payload);
    };

    const maxTest = buildWithDropCount(droppables.length);
    if (maxTest.bytes > MAX_COOKIE_ENCODED_BYTES) {
      return null;
    }

    let lo = 0;
    let hi = droppables.length;
    let best = maxTest;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const res = buildWithDropCount(mid);
      if (res.bytes <= MAX_COOKIE_ENCODED_BYTES) {
        best = res;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
    return best;
  };

  // Stage 2: binary-trim oldest non-shiny excess while preserving shinies & buddies
  const nonShinyDroppables = collectDroppables(rootState.profiles, false);
  const stage2Res = tryBinaryTrim(rootState.profiles, stage1Opts, nonShinyDroppables);
  if (stage2Res) {
    return stage2Res.encoded;
  }

  // Stage 3: shed secondary metadata (skillMastery, quests, eggs) + allow trimming excess shinies if needed
  const stage3Opts = {
    includeNicknames: false,
    dropKnownQuestTitles: true,
    includeSkillMastery: false,
    includeQuests: false,
    includeEggs: false
  };
  const allDroppables = collectDroppables(rootState.profiles, true);
  const stage3Res = tryBinaryTrim(rootState.profiles, stage3Opts, allDroppables);
  if (stage3Res) {
    return stage3Res.encoded;
  }

  // Stage 4: keep active profile + most recently updated profiles that fit
  const orderedProfiles = [...rootState.profiles].sort((a, b) => {
    if (a.id === rootState.activeProfileId) return -1;
    if (b.id === rootState.activeProfileId) return 1;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });

  for (let count = orderedProfiles.length - 1; count >= 1; count -= 1) {
    const subset = orderedProfiles.slice(0, count);
    const subsetDroppables = collectDroppables(subset, true);
    const subsetRes = tryBinaryTrim(subset, stage3Opts, subsetDroppables);
    if (subsetRes) {
      return subsetRes.encoded;
    }
  }

  // Stage 5: ultra-minimal active profile fallback (guaranteed < 3600 bytes)
  const activeOnly = orderedProfiles.slice(0, 1);
  const minimal = {
    v: STATE_VERSION,
    ap: activeOnly[0]?.id ?? null,
    ts: computeStateTimestamp(rootState),
    p: activeOnly.map((prof) =>
      encodeProfileCompact(prof, {
        ...stage3Opts,
        maxNameLen: 24,
        droppedCaughtIds: new Set(Object.keys(prof.caught || {}))
      })
    )
  };
  const minimalRes = encodeVaultJson(minimal);
  if (minimalRes.bytes <= MAX_COOKIE_ENCODED_BYTES) {
    return minimalRes.encoded;
  }

  // Final emergency guard: empty profile shell preserving active id/timestamp
  return encodeVaultJson({
    v: STATE_VERSION,
    ap: null,
    ts: computeStateTimestamp(rootState),
    p: []
  }).encoded;
}

function expandCompactVault(parsed) {
  if (!isPlainObject(parsed) || parsed.v !== STATE_VERSION || !Array.isArray(parsed.p)) {
    return null;
  }
  const fallbackTs = toFiniteInt(parsed.ts, 0, 0);
  const profiles = [];
  const seenIds = new Set();
  for (const compactProfile of parsed.p) {
    const expanded = decodeProfileCompact(compactProfile, fallbackTs);
    if (!expanded) return null;
    if (seenIds.has(expanded.id)) continue;
    seenIds.add(expanded.id);
    profiles.push(expanded);
  }
  let activeProfileId = typeof parsed.ap === 'string' ? parsed.ap : null;
  if (profiles.length === 0) {
    activeProfileId = null;
  } else if (!activeProfileId || !seenIds.has(activeProfileId)) {
    activeProfileId = profiles[0].id;
  }
  const maxProfileTs = profiles.reduce((acc, p) => Math.max(acc, p.updatedAt || 0), 0);
  return {
    version: STATE_VERSION,
    activeProfileId,
    profiles,
    updatedAt: Math.max(fallbackTs, maxProfileTs)
  };
}

function parseCookieVault(rawEncoded) {
  if (!rawEncoded || typeof rawEncoded !== 'string') {
    return null;
  }
  try {
    const jsonStr = decodeURIComponent(rawEncoded);
    const parsed = JSON.parse(jsonStr);
    return expandCompactVault(parsed);
  } catch {
    return null;
  }
}

// ============================================================================
// UTF-8 Base64URL Save Code Helpers
// ============================================================================

function utf8ToBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  const b64 = typeof globalThis.btoa === 'function'
    ? globalThis.btoa(binary)
    : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToUtf8(b64url) {
  if (typeof b64url !== 'string' || !b64url || !/^[A-Za-z0-9\-_]+$/.test(b64url)) {
    throw new Error('Invalid save code encoding.');
  }
  const normalized = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLen);
  let bytes;
  if (typeof globalThis.atob === 'function') {
    const binary = globalThis.atob(padded);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
  } else {
    bytes = new Uint8Array(Buffer.from(padded, 'base64'));
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

// ============================================================================
// Internal Persistence & Subscriber Notification
// ============================================================================

function ensureInitialized() {
  if (!_initialized) {
    initState();
  }
}

function writeCurrentCookieVault() {
  if (!_env.cookieDoc) {
    return false;
  }
  const encoded = buildCompactVaultEncoded(_state);
  return writeVaultCookieRaw(_env.cookieDoc, encoded, _env.protocol);
}

function persistBoth() {
  writeStorageState(_state);
  syncCookieVault();
}

function notifySubscribers() {
  const snapshot = getState();
  const active = getActiveProfile();
  for (const listener of [..._subscribers]) {
    try {
      listener(snapshot, active);
    } catch {
      // Isolate subscriber errors so state persistence never aborts.
    }
  }
}

// ============================================================================
// Public Exported API
// ============================================================================

export function initState(env = {}) {
  _lastHealSource = null;
  _env = {
    storage: Object.hasOwn(env, 'storage') ? env.storage : safeGetGlobalStorage(),
    cookieDoc: Object.hasOwn(env, 'cookieDoc') ? env.cookieDoc : safeGetGlobalDocument(),
    protocol: Object.hasOwn(env, 'protocol') ? env.protocol : safeGetGlobalProtocol(),
    now: Object.hasOwn(env, 'now') ? env.now : null
  };

  const nowTs = getNow();
  const storageState = readStorageState(nowTs);
  const rawCookie = readVaultCookieRaw(_env.cookieDoc);
  const cookieState = parseCookieVault(rawCookie);

  if (storageState && cookieState) {
    const storageTs = computeStateTimestamp(storageState);
    const cookieTs = computeStateTimestamp(cookieState);
    if (cookieTs > storageTs) {
      _state = cookieState;
      _initialized = true;
      _lastHealSource = 'cookie-vault';
      writeStorageState(_state);
    } else {
      _state = storageState;
      _initialized = true;
      writeCurrentCookieVault();
    }
  } else if (!storageState && cookieState) {
    _state = cookieState;
    _initialized = true;
    _lastHealSource = 'cookie-vault';
    writeStorageState(_state);
  } else if (storageState && !cookieState) {
    _state = storageState;
    _initialized = true;
    _lastHealSource = 'storage-regenerated';
    writeCurrentCookieVault();
  } else {
    _state = createEmptyRootState(0);
    _initialized = true;
  }

  return getState();
}

export function getState() {
  ensureInitialized();
  return deepClone(_state);
}

export function getActiveProfile() {
  ensureInitialized();
  if (!_state.activeProfileId || !Array.isArray(_state.profiles) || _state.profiles.length === 0) {
    return null;
  }
  const found = _state.profiles.find((p) => p.id === _state.activeProfileId);
  return found ? deepClone(found) : null;
}

export function switchProfile(profileId) {
  ensureInitialized();
  if (typeof profileId !== 'string' || !profileId) {
    return null;
  }
  const found = _state.profiles.find((p) => p.id === profileId);
  if (!found) {
    return null;
  }
  _state.activeProfileId = found.id;
  _state.updatedAt = getNow();
  persistBoth();
  notifySubscribers();
  return deepClone(found);
}

export function createProfile({
  name,
  tier = 'starter',
  starterId = 'pikachu',
  avatarColor = '#E3350D'
} = {}) {
  ensureInitialized();
  const nowTs = getNow();
  const safeStarter = typeof starterId === 'string' && starterId.trim()
    ? starterId.trim()
    : DEFAULT_STARTER_ID;

  const profile = normalizeProfile(
    {
      id: generateProfileId(nowTs),
      name: typeof name === 'string' && name.trim() ? name.trim() : 'Trainer',
      avatarColor: typeof avatarColor === 'string' && avatarColor.trim() ? avatarColor.trim() : DEFAULT_AVATAR_COLOR,
      tier: TIERS.includes(tier) ? tier : 'starter',
      activeBuddyId: safeStarter,
      caught: {
        [safeStarter]: {
          count: 1,
          shiny: false,
          firstCaughtAt: nowTs,
          nickname: null
        }
      },
      equippedAccessories: ['classic-cap'],
      ownedAccessories: ['classic-cap'],
      routeProgress: createDefaultRouteProgress(),
      activeQuests: createDefaultQuests(),
      streak: {
        current: 1,
        best: 1,
        lastActiveDay: toDayKey(nowTs)
      },
      createdAt: nowTs,
      updatedAt: nowTs
    },
    nowTs
  );

  _state.profiles.push(profile);
  _state.activeProfileId = profile.id;
  _state.updatedAt = nowTs;
  persistBoth();
  notifySubscribers();
  return deepClone(profile);
}

export function deleteProfile(profileId) {
  ensureInitialized();
  if (typeof profileId !== 'string' || !profileId) {
    return false;
  }
  const idx = _state.profiles.findIndex((p) => p.id === profileId);
  if (idx === -1) {
    return false;
  }
  _state.profiles.splice(idx, 1);
  if (_state.activeProfileId === profileId || !_state.profiles.some((p) => p.id === _state.activeProfileId)) {
    _state.activeProfileId = _state.profiles.length > 0 ? _state.profiles[0].id : null;
  }
  _state.updatedAt = getNow();
  persistBoth();
  notifySubscribers();
  return true;
}

export function updateProfile(mutatorFn) {
  ensureInitialized();
  if (typeof mutatorFn !== 'function') {
    throw new TypeError('updateProfile expects a mutator function');
  }
  if (!_state.activeProfileId) {
    return null;
  }
  const idx = _state.profiles.findIndex((p) => p.id === _state.activeProfileId);
  if (idx === -1) {
    return null;
  }

  const nowTs = getNow();
  const current = _state.profiles[idx];
  const draft = deepClone(current);
  const result = mutatorFn(draft);
  const nextRaw = isPlainObject(result) && result !== draft ? result : draft;
  nextRaw.id = current.id;

  const normalized = normalizeProfile(nextRaw, nowTs);
  normalized.updatedAt = nowTs;

  // Calendar-day streak rollover (YYYY-MM-DD)
  const today = toDayKey(nowTs);
  const prevDay = normalized.streak?.lastActiveDay;
  if (!prevDay || !isValidDayKey(prevDay)) {
    const cur = Math.max(1, toFiniteInt(normalized.streak?.current, 1, 1));
    normalized.streak = {
      current: cur,
      best: Math.max(cur, toFiniteInt(normalized.streak?.best, 1, 1)),
      lastActiveDay: today
    };
  } else {
    const dayDiff = diffCalendarDays(prevDay, today);
    if (dayDiff === 1) {
      const nextCurrent = toFiniteInt(normalized.streak.current, 0, 0) + 1;
      normalized.streak = {
        current: nextCurrent,
        best: Math.max(nextCurrent, toFiniteInt(normalized.streak.best, 1, 1)),
        lastActiveDay: today
      };
    } else if (dayDiff > 1) {
      normalized.streak = {
        current: 1,
        best: Math.max(1, toFiniteInt(normalized.streak.best, 1, 1)),
        lastActiveDay: today
      };
    } else if (dayDiff === 0) {
      const cur = Math.max(1, toFiniteInt(normalized.streak.current, 1, 1));
      normalized.streak = {
        current: cur,
        best: Math.max(cur, toFiniteInt(normalized.streak.best, 1, 1)),
        lastActiveDay: today
      };
    }
  }

  _state.profiles[idx] = normalized;
  _state.updatedAt = nowTs;
  persistBoth();
  notifySubscribers();
  return deepClone(normalized);
}

export const BUDDY_NICKNAME_MAX_LEN = 16;

// Set (or clear with null/empty) the nickname of a caught Pok�mon on the active profile.
// Returns the updated caught entry, or null when the profile/species is missing.
export function setBuddyNickname(speciesId, nickname) {
  ensureInitialized();
  if (typeof speciesId !== 'string' || !speciesId || FORBIDDEN_KEYS.has(speciesId)) {
    return null;
  }
  const clean = typeof nickname === 'string'
    ? nickname.replace(/\s+/g, ' ').trim().slice(0, BUDDY_NICKNAME_MAX_LEN).trim()
    : '';
  let found = false;
  const updated = updateProfile((draft) => {
    if (!isPlainObject(draft.caught) || !isPlainObject(draft.caught[speciesId])) return draft;
    found = true;
    draft.caught[speciesId].nickname = clean || null;
    return draft;
  });
  return found && updated ? updated.caught[speciesId] : null;
}

export function subscribe(listenerFn) {
  if (typeof listenerFn !== 'function') {
    throw new TypeError('subscribe expects a listener function');
  }
  _subscribers.add(listenerFn);
  return () => {
    _subscribers.delete(listenerFn);
  };
}

export function exportSaveJSON() {
  ensureInitialized();
  return JSON.stringify(getState(), null, 2);
}

export function exportSaveCode() {
  ensureInitialized();
  const payload = JSON.stringify(_state);
  return `PM1.${utf8ToBase64Url(payload)}`;
}

export function importSaveJSON(raw) {
  ensureInitialized();
  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, profileCount: 0, error: 'Save data is empty or invalid.' };
  }

  const trimmed = raw.trim();
  let jsonText = trimmed;
  if (trimmed.startsWith('PM1.')) {
    try {
      jsonText = base64UrlToUtf8(trimmed.slice(4).trim());
    } catch (err) {
      return { ok: false, profileCount: 0, error: err.message || 'Invalid PM1 save code.' };
    }
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, profileCount: 0, error: 'Save data is not valid JSON.' };
  }

  const nowTs = getNow();
  let hydrated = null;
  if (isPlainObject(parsed) && parsed.v === STATE_VERSION && Array.isArray(parsed.p)) {
    hydrated = expandCompactVault(parsed);
  } else {
    hydrated = normalizeRootState(parsed, nowTs);
  }

  if (!hydrated) {
    return {
      ok: false,
      profileCount: 0,
      error: 'Invalid PokéMath save structure: expected profiles array.'
    };
  }

  hydrated.updatedAt = Math.max(nowTs, hydrated.updatedAt || 0);
  _state = hydrated;
  persistBoth();
  notifySubscribers();
  return {
    ok: true,
    profileCount: _state.profiles.length,
    error: null
  };
}

export function getLastHealSource() {
  return _lastHealSource;
}

export function healFromCookieVault() {
  if (!_initialized) {
    _env = {
      storage: safeGetGlobalStorage(),
      cookieDoc: safeGetGlobalDocument(),
      protocol: safeGetGlobalProtocol(),
      now: null
    };
  }
  const rawCookie = readVaultCookieRaw(_env.cookieDoc);
  const healed = parseCookieVault(rawCookie);
  if (!healed) {
    return false;
  }
  _state = healed;
  _initialized = true;
  writeStorageState(_state);
  notifySubscribers();
  return true;
}

export function syncCookieVault() {
  ensureInitialized();
  return writeCurrentCookieVault();
}
