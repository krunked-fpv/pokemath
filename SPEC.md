# PokéMath — Frozen Engineering Specification & Module Contracts (`SPEC.md`)

All module exports, schemas, constants, and CSS tokens below are **frozen contracts** for parallel swarm workers. Workers MUST implement these exact export signatures and data shapes without modifying files outside their assigned slice.

---

## 1. PWA & Deployment Constants

- `SHELL_CACHE = 'pokemath-shell-v1'`
- `SPRITE_CACHE = 'pokemath-sprites-v1'`
- **Relative Path Rule**: Every path in `index.html`, `manifest.json`, `sw.js`, CSS, and JS MUST be relative (`./...`), compatible with `https://krunked-fpv.github.io/pokemath/`.
- **`manifest.json` Required Fields**:
  - `"name": "PokéMath — PokéNav Math Adventure"`
  - `"short_name": "PokéMath"`
  - `"description": "Zero-backend Pokémon math workbench with adaptive hints, interactive manipulatives, and offline PokéNav camp."`
  - `"display": "standalone"`
  - `"background_color": "#FFF9F0"`
  - `"theme_color": "#E3350D"`
  - `"start_url": "./"`
  - `"scope": "./"`
  - `"icons"`:
    - `{ "src": "./assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" }`
    - `{ "src": "./assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }`
- **PNG Icons Required on Disk**:
  - `assets/icons/icon-192.png` (`192x192`, magic bytes `89 50 4E 47 0D 0A 1A 0A`)
  - `assets/icons/icon-512.png` (`512x512`, magic bytes `89 50 4E 47 0D 0A 1A 0A`)
  - `assets/icons/apple-touch-icon.png` (`180x180`, magic bytes `89 50 4E 47 0D 0A 1A 0A`)

---

## 2. `js/core/state.js` Contract

### Named Exports
- `export const VAULT_COOKIE_NAME = 'krunked-cookie-vault-v1';`
- `export const STORAGE_KEY = 'pokemath-state-v1';`
- `export function initState(env = {})` -> returns `RootState`. `env` optionally accepts `{ storage, cookieDoc, protocol, now }` for deterministic Node testing.
- `export function getState()` -> returns deep/safe snapshot of `RootState`.
- `export function getActiveProfile()` -> returns active `TrainerProfile` or `null` if onboarding not completed.
- `export function switchProfile(profileId)` -> switches `activeProfileId`, persists & notifies subscribers.
- `export function createProfile(data)` -> creates new `TrainerProfile` (`{ name, tier, starterId, avatarColor }`), sets it active, persists & notifies.
- `export function deleteProfile(profileId)` -> deletes profile safely (if active deleted, selects remaining or `null`), persists & notifies.
- `export function updateProfile(mutatorFn)` -> calls `mutatorFn(draftProfile)`, stamps `updatedAt`, handles calendar-day streak checks, persists to `localStorage` + `krunked-cookie-vault-v1`, notifies subscribers, returns updated profile.
- `export function subscribe(listenerFn)` -> registers `(state, activeProfile) => void`, returns `unsubscribe()` function.
- `export function exportSaveJSON()` -> returns formatted JSON string of full state.
- `export function exportSaveCode()` -> returns compact base64url-encoded string (`PM1.<payload>`) suitable for copy/paste transfer.
- `export function importSaveJSON(raw)` -> accepts either JSON string or `PM1.*` save code, validates structure, hydrates state, syncs both storage & cookie vault, returns `{ ok, profileCount, error }`.
- `export function healFromCookieVault()` -> parses `krunked-cookie-vault-v1` and reconstructs full `RootState` into `localStorage`; returns `boolean` (`true` if healed).
- `export function getLastHealSource()` -> returns `'cookie-vault' | 'storage-regenerated' | null` from the latest `initState()`.
- `export function syncCookieVault()` -> serializes compact representation strictly `< 3600` bytes into `document.cookie` using `krunked-cookie-vault-v1=<encoded>; path=/; max-age=31536000; SameSite=Lax` plus `; Secure` ONLY when `protocol === 'https:'` (never on `http:`).

### `TrainerProfile` Schema
```js
{
  id: 'trainer-...',
  name: 'Red',
  avatarColor: '#E3350D',
  tier: 'starter', // 'starter' | 'explorer' | 'ace' | 'champion'
  customFilter: {
    enabled: false,
    operations: ['add', 'sub', 'mul', 'div', 'placeValue', 'comparison', 'fraction', 'word'],
    maxNumber: null
  },
  activeBuddyId: 'pikachu',
  buddyXp: 0,
  buddyLevel: 1,
  evolutionMeter: 0, // 0..100
  caught: {
    pikachu: { count: 1, shiny: false, firstCaughtAt: 1700000000000, nickname: null }
  },
  equippedAccessories: ['classic-cap'],
  ownedAccessories: ['classic-cap'],
  inventory: {
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
  },
  mysteryEggs: [], // [{ id, warmth: 0..3, source, tierHint }]
  routeProgress: {
    'route-1': { unlocked: true, stars: 0, solvedCount: 0, bossDefeated: false },
    'route-2': { unlocked: false, stars: 0, solvedCount: 0, bossDefeated: false },
    'route-3': { unlocked: false, stars: 0, solvedCount: 0, bossDefeated: false },
    'route-4': { unlocked: false, stars: 0, solvedCount: 0, bossDefeated: false },
    'route-5': { unlocked: false, stars: 0, solvedCount: 0, bossDefeated: false },
    'route-6': { unlocked: false, stars: 0, solvedCount: 0, bossDefeated: false }
  },
  badges: [], // array of badge ids e.g. 'sprout-badge'
  classicEmblemUnlocked: false,
  coins: 50,
  stardust: 20,
  shinyCharmBoost: 0,
  streak: { current: 1, best: 1, lastActiveDay: 'YYYY-MM-DD' },
  sessionStreak: 0,
  totalSolved: 0,
  totalAttempts: 0,
  skillMastery: {}, // { [skillTag]: { attempts, correct, rolling: boolean[], consecutiveMisses, level } }
  activeQuests: [], // [{ id, templateId, title, metric, target, progress, rewardStardust, claimed }]
  settings: {
    sfx: true,
    ambient: false,
    speech: false,
    speedBlitz: false,
    reducedMotion: false
  },
  createdAt: 1700000000000,
  updatedAt: 1700000000000
}
```

### Cookie Vault Size Invariant
`encodeURIComponent(compactPayload)` in `krunked-cookie-vault-v1` MUST remain strictly under `3600` bytes by storing compact keys (`v`, `ap`, `ts`, `p[]` with abbreviated field codes and compact caught arrays `[id, count, shiny01]` or compacted dex entries) and cleanly expanding back into full `TrainerProfile` objects on `healFromCookieVault()` with all defaults filled.

---

## 3. `js/core/mathEngine.js`, `hintEngine.js`, `adaptive.js` Contracts

### `js/core/mathEngine.js`
- `export const TIERS = ['starter', 'explorer', 'ace', 'champion'];`
- `export function resetHistory()` -> clears internal 30-problem anti-repeat ring buffer.
- `export function generateProblem(options = {})`
  - `options`: `{ tier = 'starter', routeId = null, operation = null, format = null, customFilter = null, difficultyAdjustment = 0, criticalChallenge = false }`
  - Returns normalized **`ProblemSpec`**:
    ```js
    {
      id: 'prob-...',
      key: 'add:7+5',
      tier: 'starter',
      skillTag: 'add_within_20',
      operation: 'add', // 'add'|'sub'|'mul'|'div'|'placeValue'|'comparison'|'fraction'|'word'|'orderOfOps'|'balanced'
      format: 'numeric', // 'numeric'|'missing'|'comparison'|'fraction'|'word'|'array'|'placeValue'|'numberLine'
      promptText: 'What is 7 + 5?',
      spokenPrompt: 'What is 7 plus 5?',
      expression: '7 + 5 = ?',
      leftExpr: '7 + 5',
      rightExpr: null,
      answer: 12, // finite number, or '<'|'='|'>' for comparison, or string fraction e.g. '3/4' when format === 'fraction' (or numeric numerator/value — see note below!)
      choices: [10, 12, 13, 15], // 3 items ['<','=','>'] for comparison; 4 unique choices always containing exact answer
      manipulativeType: 'tenFrame', // 'tenFrame'|'numberLine'|'base10'|'berryArray'|'partWhole'|'comparisonScale'
      operands: [7, 5],
      targetRange: [0, 20],
      meta: { storyEmoji: null, storyItems: null, rows: null, cols: null, whole: 10, parts: [7, 5], fractionData: null, placeDigits: null }
    }
    ```
  - **Answer Consistency Rule**: To guarantee clean keyboard `Poké-Keypad` entry (`0-9`) as well as multiple-choice tiles:
    - All `'numeric'`, `'missing'`, `'word'`, `'array'`, `'placeValue'`, `'numberLine'`, `'orderOfOps'`, `'balanced'` problems have **finite non-negative integer `answer`** (and for missing fraction numerator like `2/3 = ?/6`, `format: 'missing'`, `answer` is an integer!).
    - `'comparison'` problems have `answer` in `['<', '=', '>']` and `choices: ['<', '=', '>']`.
    - `'fraction'` problems either use string `'a/b'` (`choices` of 4 distinct `'a/b'` fractions) OR missing integer numerator; `validateAnswer` cleanly accepts exact match (normalized trimmed string or numeric equality).
  - **Hard Mathematical Invariants**:
    - ZERO `NaN`, `Infinity`, or `undefined` answers.
    - ZERO negative answers in `starter` and `explorer` tiers (`a >= b` always for subtraction).
    - ZERO divide-by-zero in any tier.
    - ZERO non-integer/remainder division answers in `ace` tier (unless explicitly `remainder` word/tag in `champion` with integer quotient/remainder question asking for one unambiguous integer).
    - `choices` ALWAYS contains `answer` and has ZERO duplicate values (`new Set(choices.map(String)).size === choices.length`).
    - 30-problem anti-repeat ring buffer with deterministic cap of 25 generation retries so it never loops infinitely even under narrow custom filters.
- `export function validateAnswer(problem, userAnswer)` -> returns `boolean` (`true` if mathematically equivalent / exact match).
- `export function generateMoveSetProblems(tier, filterConfig, adaptiveState, routeId)` -> returns `{ quick: ProblemSpec, power: ProblemSpec, charge: ProblemSpec }` matched to easier warm-up, grade-level target, and stretch challenge.

### `js/core/hintEngine.js`
- `export function buildHintBundle(problemSpec)` -> returns **`HintBundle`**:
  ```js
  {
    tier1: {
      headline: 'Make a Ten!',
      nudgeText: 'Split 5 into 3 and 2 so 7 + 3 makes 10 first.',
      spokenText: 'Try splitting 5 into 3 and 2 to make 10 first.'
    },
    tier2: {
      type: 'tenFrame', // 'tenFrame'|'numberLine'|'base10'|'berryArray'|'partWhole'|'comparisonScale'
      interactivePrompt: 'Tap tokens to fill the first Ten-Frame, then count the extras!',
      config: { /* manipulative-specific structured data */ }
    },
    tier3: {
      steps: [
        { label: 'Step 1', highlight: '7 + 3 = 10', formula: '7 + 3 = 10' },
        { label: 'Step 2', highlight: 'Add the leftover 2', formula: '10 + 2 = ?' }
      ],
      finalPrompt: 'Now enter the total into your PokéNav!'
    }
  }
  ```
- **Invariant**: NEVER throws on ANY `ProblemSpec` emitted by `generateProblem`; `tier3.steps` always has `>= 1` step and NEVER prints the solved final answer in the last step's formula (stops 1 tap short with `?`).

### `js/core/adaptive.js`
- `export function recordAttempt(profileState, skillTag, isCorrect, hintsUsed = 0)`
  - Mutates/returns fresh adaptive summary:
    ```js
    {
      updatedMastery, // { attempts, correct, rolling, consecutiveMisses, level }
      consecutiveMisses,
      streak,
      autoOpenHintTier, // 0 | 1 | 2 (1 on 2 consecutive misses, 2 on >=3 consecutive misses)
      difficultyAdjustment, // -1 | 0 | 1
      triggerCriticalChallenge, // boolean (true when session streak >= 4)
      shinyRollBonus, // number (0 to 0.15)
      encouragementMessage // warm non-punitive string
    }
    ```
- `export function getRecommendedProblemConfig(profileState, routeId)` -> returns `{ tier, routeId, difficultyAdjustment, criticalChallenge, focusSkillTag }`.

---

## 4. `js/core/audio.js` Contract

### Named Exports (100% Node-import-safe — guard `window` / `AudioContext` / `speechSynthesis`)
- `export function unlockAudio()`
- `export function setAudioSettings({ sfx, ambient, speech })`
- `export function playClick(variant = 'tap')`
- `export function playCorrectChime(streakCount = 1)`
- `export function playGentleNudge()`
- `export function playAttackSFX(pokemonType = 'normal', movePower = 'power')`
- `export function playPokeballThrow()`
- `export function playPokeballWobble(stepIndex = 0)`
- `export function playCatchFanfare()`
- `export function playEvolutionSymphony()`
- `export function playBadgeFanfare()`
- `export function toggleAmbientMusic(enabled)`
- `export function speakText(text, force = false)`

---

## 5. `js/data/` Contracts

### `js/data/pokemon.js`
- `export const STARTER_IDS = ['bulbasaur', 'charmander', 'squirtle', 'pikachu'];`
- `export const POKEMON_ROSTER = [ ... ]` (>= 108 entries across >= 36 multi-stage families, targeting 115 species across 38 families).
- `export const POKEMON_BY_ID = Object.fromEntries(...)`
- `export function getPokemonById(id)`
- `export function getEvolutionChain(id)` -> ordered array of species objects in that family.
- Entry Shape:
  ```js
  {
    id: 'bulbasaur',
    dexNumber: 1,
    name: 'Bulbasaur',
    familyId: 'bulbasaur-line',
    stage: 1,
    evolvesTo: 'ivysaur', // string id or null
    evolvesToOptions: null, // e.g. ['vaporeon', 'jolteon', 'flareon', 'espeon', 'umbreon', 'sylveon'] for Eevee
    evolutionXpRequired: 100, // 0 if final stage
    types: ['grass', 'poison'],
    baseHp: 80,
    moveNames: { quick: 'Vine Count', power: 'Razor Sum', charge: 'Solar Bond' },
    mathLore: 'Bulbasaur sunbathes in neat 2x5 rows so its bulb can count 10 sunbeams at once!',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
    shinySpriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/1.png',
    fallbackPalette: { primary: '#6BCB77', secondary: '#4D96FF', accent: '#2D6A4F', eye: '#E3350D' },
    emblemShape: 'leaf'
  }
  ```

### `js/data/routes.js`
- `export const ROUTES = [ ... ]` (6 routes: `'route-1'` through `'route-6'`).
- `export function getRouteById(id)`
- Route Shape:
  ```js
  {
    id: 'route-1',
    number: 1,
    name: 'Sprout Meadow',
    subtitle: 'Addition, Making 10 & Number Bonds',
    biomeKey: 'meadow', // 'meadow'|'cavern'|'harbor'|'ridge'|'rapids'|'summit'
    mathDomains: ['add', 'word'],
    recommendedTier: 'starter',
    starThresholds: [3, 6, 10],
    wildPool: ['bulbasaur', 'pikachu', 'chikorita', 'marill', 'togepi', 'sprigatito'],
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
      teamIds: ['bulbasaur', 'chikorita', 'ivysaur']
    }
  }
  ```

### `js/data/items.js`
- `export const BERRIES = [...]` (`oran`, `sitrus`, `pecha`, `lum`, `starf`, `goldenrazz`)
- `export const POKEBALLS = [...]` (`pokeball`, `greatball`, `ultraball`, `premierball`)
- `export const ACCESSORIES = [...]` (`classic-cap`, `explorer-hat`, `star-glasses`, `silk-ribbon`, `champion-crown`, `cozy-scarf` — each with `id`, `name`, `costCoins`, `slot`, `description`, `svgMarkup`)
- `export const MART_CATALOG = [...]`
- `export const QUEST_TEMPLATES = [...]`

---

## 6. `js/ui/` & `js/games/` Contracts

### `js/ui/vfx.js`
- `export function renderPokemonVisual(pokemon, options = {})`
  - `options`: `{ shiny = false, size = 120, accessories = [], forceSvg = false, className = '', animate = true }`
  - Returns an `HTMLElement` (`<div class="pkmn-visual ...">`) containing `<img class="pkmn-sprite">` (unless `forceSvg`) paired with a resilient inline `<svg class="pkmn-fallback-svg">` chibi elemental crest + optional `<div class="pkmn-accessory-layer">` + shiny sparkles. Whenever `img` fires `error` or `forceSvg` is true, `pkmn-visual` toggles `.is-fallback` to display the SVG cleanly with zero broken image state.
- `export function mountBiomeBackdrop(container, biomeKey)`
- `export function playElementalAttackVFX(stageEl, elementType, intensity = 'power')`
- `export function spawnFloatingText(stageEl, text, variant = 'damage')`
- `export function burstConfetti(stageEl, palette = ['#E3350D', '#FFCB05', '#3B4CCA', '#38B000'])`

### `js/ui/rotomPane.js`
- `export function createRotomPane(containerEl, context)`
  - Returns `{ render(profile), setProblem(problemSpec, hintBundle), openHintTier(tierNum), cycleHintTier(), setMood(mood, message), updateMetrics(metrics), getCurrentHintTier() }`.
  - Renders animated Rotom-Dex SVG face, Read-Aloud trigger, 3-Tier Hint Accordion, interactive live manipulatives (`tenFrame`, `numberLine`, `base10`, `berryArray`, `partWhole`, `comparisonScale`), Combo/Charge meter, claimable Mini-Quests, and Skill Mastery bars.

### `js/ui/shell.js`
- `export function createShell(rootEls, context)`
  - Returns `{ render(state), openProfileModal(), openParentModal(), openDrawer(side), closeDrawers(), showToast(msg, variant = 'info'), setInstallAvailable(handler) }`.
  - Manages Top Trainer Ribbon, Left Buddy Card + 6-Route Map + Badge Case, Profile Switcher Modal (including `krunked-cookie-vault-v1` status badge, JSON export/import, Save Code copy/paste), Parent/Coach Custom Filter Modal, and mobile drawer state.

### `js/games/*.js` (`battleMode.js`, `catchMode.js`, `berryLabMode.js`, `evolutionForge.js`, `campPokedex.js`)
- Every game module exports:
  - `export function mount(containerEl, context)`
  - `export function unmount()`
  - `export function handleKey(event)` (optional keyboard action handler returning `true` if handled)
- `context` provided by `main.js`:
  `{ state, mathEngine, hintEngine, adaptive, audio, vfx, rotomPane, shell, pokemonData, routesData, itemsData, onNavigate, modeParams }`
  where `onNavigate(modeId, params)` transitions cleanly among `'battle'`, `'catch'`, `'berry-lab'`, `'evolution-forge'`, `'gym'`, and `'camp'`.
