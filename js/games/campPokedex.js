import * as defaultState from '../core/state.js';
import * as defaultAudio from '../core/audio.js';
import * as defaultPokemonData from '../data/pokemon.js';
import * as defaultItemsData from '../data/items.js';

const STYLE_ID = 'pokemath-camp-pokedex-styles';
const PET_COOLDOWN_MS = 6000;

const TYPE_COLORS = {
  grass: '#22c55e',
  poison: '#a855f7',
  fire: '#f97316',
  flying: '#38bdf8',
  water: '#3b82f6',
  electric: '#eab308',
  normal: '#94a3b8',
  psychic: '#ec4899',
  fairy: '#f472b6',
  rock: '#a16207',
  ground: '#d97706',
  fighting: '#dc2626',
  ghost: '#7e22ce',
  ice: '#06b6d4',
  dragon: '#4f46e5',
  steel: '#64748b',
  bug: '#84cc16',
  dark: '#334155'
};

const CAMP_CSS = `
.pm-camp {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 100%;
  padding: 16px;
  border-radius: 22px;
  background: linear-gradient(180deg, #fffdf7 0%, #fef5e7 100%);
  color: #1e293b;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  box-sizing: border-box;
}
.pm-camp *, .pm-camp *::before, .pm-camp *::after { box-sizing: border-box; }
.pm-camp-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.22;
  z-index: 0;
}
.pm-camp-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pm-camp-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.pm-camp-tab {
  min-height: 52px;
  padding: 10px 14px;
  border-radius: 16px;
  border: 2px solid #e2d5bf;
  border-bottom-width: 5px;
  background: #ffffff;
  color: #334155;
  font-size: 0.95rem;
  font-weight: 900;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.pm-camp-tab.is-active {
  background: #3b4cca;
  border-color: #1e3a8a;
  color: #ffffff;
}
.pm-camp-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}
.pm-camp-card {
  background: rgba(255, 255, 255, 0.96);
  border: 2px solid #efe2cc;
  border-radius: 20px;
  padding: 15px;
  box-shadow: 0 6px 18px rgba(140, 95, 45, 0.08);
}
.pm-buddy-stage {
  position: relative;
  min-height: 220px;
  border-radius: 18px;
  background: radial-gradient(circle at 50% 60%, #dcfce7 0%, #fef9c3 65%, #ffedd5 100%);
  border: 2px solid #d9f99d;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  overflow: hidden;
}
.pm-buddy-stage:active { transform: scale(0.99); }
.pm-heart-burst {
  position: absolute;
  font-size: 1.35rem;
  pointer-events: none;
  animation: pmHeartFloat 0.9s ease-out forwards;
}
.pm-type-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 999px;
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.pm-meter-track {
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}
.pm-meter-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #38b000 0%, #ffcb05 100%);
  transition: width 0.3s ease;
}
.pm-meter-fill.is-evo {
  background: linear-gradient(90deg, #38bdf8 0%, #a855f7 55%, #ffcb05 100%);
}
.pm-evo-ready-btn {
  width: 100%;
  min-height: 52px;
  margin-top: 10px;
  border-radius: 14px;
  border: 2px solid #b45309;
  border-bottom-width: 5px;
  background: linear-gradient(135deg, #ffcb05 0%, #f59e0b 100%);
  color: #422006;
  font-weight: 900;
  font-size: 1rem;
  cursor: pointer;
  animation: pmReadyGlow 1.6s ease-in-out infinite alternate;
}
.pm-feed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  gap: 8px;
  margin-top: 10px;
}
.pm-feed-btn {
  min-height: 82px;
  padding: 8px;
  border-radius: 14px;
  border: 2px solid #e2e8f0;
  border-bottom-width: 4px;
  background: #ffffff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-align: center;
}
.pm-feed-btn:disabled { opacity: 0.48; cursor: not-allowed; }
.pm-feed-btn svg { width: 30px; height: 30px; }
.pm-closet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
  margin-top: 10px;
}
.pm-closet-item {
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  padding: 10px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
}
.pm-closet-item.is-equipped {
  border-color: #38b000;
  background: #f0fdf4;
}
.pm-closet-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}
.pm-closet-icon svg { width: 100%; height: 100%; }
.pm-egg-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  gap: 10px;
  margin-top: 10px;
}
.pm-egg-card {
  border: 2px solid #fde68a;
  background: #fffbeb;
  border-radius: 16px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}
.pm-btn-action {
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 2px solid #15803d;
  border-bottom-width: 4px;
  background: #38b000;
  color: #ffffff;
  font-weight: 800;
  cursor: pointer;
}
.pm-btn-ghost {
  min-height: 40px;
  padding: 6px 12px;
  border-radius: 12px;
  border: 2px solid #cbd5e1;
  border-bottom-width: 4px;
  background: #ffffff;
  color: #334155;
  font-weight: 800;
  cursor: pointer;
}
.pm-dex-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pm-dex-top-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.pm-dex-search {
  flex: 1 1 200px;
  min-height: 46px;
  padding: 8px 14px;
  border-radius: 14px;
  border: 2px solid #cbd5e1;
  font-size: 0.95rem;
  font-weight: 700;
  background: #ffffff;
  color: #0f172a;
}
.pm-dex-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pm-pill-toggle {
  min-height: 42px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 2px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  font-weight: 800;
  font-size: 0.82rem;
  cursor: pointer;
}
.pm-pill-toggle.is-active {
  background: #e3350d;
  border-color: #991b1b;
  color: #ffffff;
}
.pm-pill-toggle.is-shiny.is-active {
  background: #ffcb05;
  border-color: #b45309;
  color: #422006;
}
.pm-type-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pm-type-filter {
  min-height: 34px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 2px solid #e2e8f0;
  background: #ffffff;
  color: #334155;
  font-weight: 800;
  font-size: 0.76rem;
  text-transform: capitalize;
  cursor: pointer;
}
.pm-type-filter.is-active {
  background: #1e293b;
  border-color: #0f172a;
  color: #ffffff;
}
.pm-dex-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
}
.pm-dex-layout.has-detail {
  grid-template-columns: minmax(0, 1.35fr) minmax(270px, 0.9fr);
  align-items: start;
}
.pm-dex-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  gap: 8px;
  max-height: 620px;
  overflow-y: auto;
  padding-right: 4px;
}
.pm-dex-card {
  position: relative;
  border: 2px solid #e2e8f0;
  border-bottom-width: 4px;
  border-radius: 16px;
  padding: 10px 8px;
  background: #ffffff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}
.pm-dex-card.is-uncaught {
  background: #f8fafc;
  opacity: 0.76;
}
.pm-dex-card.is-selected {
  border-color: #3b4cca;
  background: #eff6ff;
}
.pm-dex-drawer {
  background: #ffffff;
  border: 2px solid #cbd5e1;
  border-radius: 18px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: sticky;
  top: 8px;
}
.pm-evo-chain {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.pm-chain-btn {
  padding: 5px 10px;
  border-radius: 10px;
  border: 2px solid #cbd5e1;
  background: #f8fafc;
  font-weight: 800;
  font-size: 0.78rem;
  cursor: pointer;
}
.pm-chain-btn.is-current {
  border-color: #3b4cca;
  background: #dbeafe;
  color: #1e3a8a;
}
.pm-hatch-banner {
  border: 2px solid #ffcb05;
  background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
  border-radius: 18px;
  padding: 12px 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
@keyframes pmHeartFloat {
  0% { transform: translateY(0) scale(0.8); opacity: 1; }
  100% { transform: translateY(-54px) scale(1.25); opacity: 0; }
}
@keyframes pmReadyGlow {
  0% { transform: scale(1); }
  100% { transform: scale(1.02); }
}
@media (max-width: 860px) {
  .pm-camp-grid { grid-template-columns: 1fr; }
  .pm-dex-layout.has-detail { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .pm-heart-burst, .pm-evo-ready-btn { animation: none !important; }
  .pm-meter-fill { transition: none !important; }
}
[data-reduced-motion="true"] .pm-heart-burst,
[data-reduced-motion="true"] .pm-evo-ready-btn { animation: none !important; }
[data-reduced-motion="true"] .pm-meter-fill { transition: none !important; }
`;

let _container = null;
let _ctx = null;
let _tab = 'camp';
let _lastPetXpAt = 0;
let _hatchedNotice = null; // { pokemon, shiny }
let _searchQuery = '';
let _typeFilter = 'all';
let _caughtOnly = false;
let _shinyPreview = false;
let _selectedDexId = null;
let _detailShiny = false;
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
  style.textContent = CAMP_CSS;
  document.head.appendChild(style);
}

function removeStyles() {
  if (typeof document === 'undefined') return;
  document.getElementById(STYLE_ID)?.remove();
}

function renderVisualSafe(vfx, pokemon, options = {}) {
  if (vfx?.renderPokemonVisual && pokemon) {
    return vfx.renderPokemonVisual(pokemon, options);
  }
  const el = document.createElement('div');
  const size = options.size || 96;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.borderRadius = '50%';
  el.style.background = pokemon?.fallbackPalette?.primary || '#6BCB77';
  el.style.fontWeight = '900';
  el.textContent = pokemon?.name?.slice(0, 2) || 'PM';
  return el;
}

function applyCampQuestProgress(draft, increments) {
  if (!Array.isArray(draft.activeQuests)) return;
  for (const q of draft.activeQuests) {
    if (!q || q.claimed) continue;
    let next = q.progress || 0;
    if (q.metric === 'catches' || q.metric === 'catch_pokemon') next += increments.catches || 0;
    else if (q.metric === 'feed_berries') next += increments.feedBerries || 0;
    else if (q.metric === 'earn_xp') next += increments.xp || 0;
    q.progress = Math.min(q.target || 1, next);
  }
}

function spawnHeartParticles(stageEl) {
  if (!stageEl || typeof document === 'undefined') return;
  const symbols = ['💖', '💕', '✨'];
  for (let i = 0; i < 4; i += 1) {
    const heart = document.createElement('span');
    heart.className = 'pm-heart-burst';
    heart.textContent = symbols[i % symbols.length];
    heart.style.left = `${30 + Math.random() * 40}%`;
    heart.style.top = `${35 + Math.random() * 25}%`;
    stageEl.appendChild(heart);
    scheduleTimer(() => heart.remove(), 950);
  }
}

function handlePetBuddy() {
  const { state, audio, vfx, rotomPane, shell } = getApis();
  const profile = state.getActiveProfile();
  if (!profile) return;

  const stageEl = _container?.querySelector('[data-buddy-stage]');
  spawnHeartParticles(stageEl);
  audio?.playClick?.('love');

  const now = Date.now();
  if (now - _lastPetXpAt >= PET_COOLDOWN_MS) {
    _lastPetXpAt = now;
    const updated = state.updateProfile((draft) => {
      draft.buddyXp = (draft.buddyXp || 0) + 5;
      draft.buddyLevel = Math.max(draft.buddyLevel || 1, 1 + Math.floor(draft.buddyXp / 100));
      draft.evolutionMeter = Math.min(100, (draft.evolutionMeter || 0) + 3);
      applyCampQuestProgress(draft, { xp: 5 });
    });
    if (stageEl) {
      vfx?.spawnFloatingText?.(stageEl, '+5 Buddy XP! ♥', 'love');
    }
    rotomPane?.updateMetrics?.({
      buddyXp: updated?.buddyXp || 0,
      evolutionMeter: updated?.evolutionMeter || 0
    });
    rotomPane?.render?.(updated);
    shell?.render?.(state.getState());
    render();
  } else if (stageEl) {
    vfx?.spawnFloatingText?.(stageEl, '♥ Happy!', 'love');
  }
}

function handleFeedItem(itemId) {
  const { state, itemsData, pokemonData, audio, vfx, rotomPane, shell } = getApis();
  const profile = state.getActiveProfile();
  if (!profile || (profile.inventory?.[itemId] || 0) <= 0) return;

  const berry = (itemsData.BERRIES || []).find((b) => b.id === itemId);
  const isCandy = itemId === 'rarecandy';
  if (!berry && !isCandy) return;

  const xpGain = isCandy ? 80 : berry.xpBoost || 15;
  const evoGain = isCandy ? 50 : berry.evolutionBoost || 10;
  const prevMeter = profile.evolutionMeter || 0;

  const updated = state.updateProfile((draft) => {
    draft.inventory[itemId] = Math.max(0, (draft.inventory[itemId] || 0) - 1);
    draft.buddyXp = (draft.buddyXp || 0) + xpGain;
    const xpLevel = 1 + Math.floor(draft.buddyXp / 100);
    draft.buddyLevel = Math.max((draft.buddyLevel || 1) + (isCandy ? 1 : 0), xpLevel);
    draft.evolutionMeter = Math.min(100, (draft.evolutionMeter || 0) + evoGain);
    applyCampQuestProgress(draft, {
      feedBerries: 1,
      xp: xpGain
    });
  });

  const buddy = pokemonData.getPokemonById(updated?.activeBuddyId);
  const hitMax = prevMeter < 100 && (updated?.evolutionMeter || 0) >= 100 && Boolean(buddy?.evolvesTo);

  if (isCandy || hitMax) {
    audio?.playCorrectChime?.(6);
    if (_container) vfx?.burstConfetti?.(_container);
  } else {
    audio?.playClick?.('berry');
  }
  if (_container) {
    vfx?.spawnFloatingText?.(_container, `+${xpGain} XP! +${evoGain}% Evo`, 'success');
  }
  if (hitMax) {
    shell?.showToast?.(`${buddy?.name} is Ready to Evolve! Visit the Evolution Forge!`, 'success');
  }

  rotomPane?.updateMetrics?.({
    buddyXp: updated?.buddyXp || 0,
    evolutionMeter: updated?.evolutionMeter || 0
  });
  rotomPane?.render?.(updated);
  shell?.render?.(state.getState());
  render();
}

function handleToggleAccessory(accId) {
  const { state, itemsData, audio, shell, rotomPane } = getApis();
  const profile = state.getActiveProfile();
  const acc = (itemsData.ACCESSORIES || []).find((a) => a.id === accId);
  if (!profile || !acc) return;

  if (!profile.ownedAccessories?.includes(accId)) {
    if ((profile.coins || 0) < acc.costCoins) {
      audio?.playGentleNudge?.();
      shell?.showToast?.(`Need ${acc.costCoins - (profile.coins || 0)} more Coins for ${acc.name}!`, 'warning');
      return;
    }
    const updated = state.updateProfile((draft) => {
      draft.coins = Math.max(0, (draft.coins || 0) - acc.costCoins);
      draft.ownedAccessories.push(accId);
      const filtered = (draft.equippedAccessories || []).filter((id) => {
        const existing = (itemsData.ACCESSORIES || []).find((a) => a.id === id);
        return existing ? existing.slot !== acc.slot : true;
      });
      filtered.push(accId);
      draft.equippedAccessories = filtered;
    });
    audio?.playClick?.('buy');
    shell?.showToast?.(`Unlocked & equipped ${acc.name}!`, 'success');
    shell?.render?.(state.getState());
    rotomPane?.render?.(updated);
    render();
    return;
  }

  const isEquipped = profile.equippedAccessories?.includes(accId);
  const updated = state.updateProfile((draft) => {
    if (isEquipped) {
      draft.equippedAccessories = draft.equippedAccessories.filter((id) => id !== accId);
    } else {
      const sameSlotRemoved = draft.equippedAccessories.filter((id) => {
        const existing = (itemsData.ACCESSORIES || []).find((a) => a.id === id);
        return existing ? existing.slot !== acc.slot : true;
      });
      sameSlotRemoved.push(accId);
      draft.equippedAccessories = sameSlotRemoved;
    }
  });

  audio?.playClick?.('switch');
  shell?.render?.(state.getState());
  rotomPane?.render?.(updated);
  render();
}

function pickHatchSpecies(profile, pokemonData) {
  const roster = pokemonData.POKEMON_ROSTER || [];
  const caught = profile.caught || {};
  const unownedStage1 = roster.filter((p) => p.stage === 1 && !caught[p.id]);
  const pool = unownedStage1.length > 0
    ? unownedStage1
    : roster.filter((p) => p.stage === 1);
  const chosen = pool[Math.floor(Math.random() * pool.length)] || roster[0];
  return chosen;
}

function handleWarmEgg(eggId) {
  const { state, pokemonData, audio, vfx, shell, rotomPane } = getApis();
  const profile = state.getActiveProfile();
  if (!profile) return;

  const egg = (profile.mysteryEggs || []).find((e) => e.id === eggId);
  if (!egg) return;

  const nextWarmth = (egg.warmth || 0) + 1;
  if (nextWarmth < 3) {
    const updated = state.updateProfile((draft) => {
      const target = (draft.mysteryEggs || []).find((e) => e.id === eggId);
      if (target) target.warmth = nextWarmth;
    });
    audio?.playClick?.('berry');
    if (_container) {
      vfx?.spawnFloatingText?.(_container, `Egg Warmth ${nextWarmth}/3!`, 'info');
    }
    shell?.render?.(state.getState());
    rotomPane?.render?.(updated);
    render();
    return;
  }

  const hatched = pickHatchSpecies(profile, pokemonData);
  const shinyChance = Math.min(0.35, 0.06 + (profile.shinyCharmBoost || 0));
  const isShiny = Math.random() < shinyChance;
  const now = Date.now();

  const updated = state.updateProfile((draft) => {
    draft.mysteryEggs = (draft.mysteryEggs || []).filter((e) => e.id !== eggId);
    if (hatched) {
      const prev = draft.caught?.[hatched.id];
      draft.caught[hatched.id] = {
        count: (prev?.count || 0) + 1,
        shiny: Boolean(prev?.shiny || isShiny),
        firstCaughtAt: prev?.firstCaughtAt || now,
        nickname: prev?.nickname || null
      };
    }
    draft.stardust = (draft.stardust || 0) + 15;
    applyCampQuestProgress(draft, { catches: 1 });
  });

  if (hatched) {
    _hatchedNotice = { pokemon: hatched, shiny: isShiny };
    audio?.playCatchFanfare?.();
    if (_container) vfx?.burstConfetti?.(_container);
    shell?.showToast?.(`Mystery Egg hatched into ${isShiny ? '✨ Shiny ' : ''}${hatched.name}!`, 'success');
  }
  shell?.render?.(state.getState());
  rotomPane?.render?.(updated);
  render();
}

function handleSetActiveBuddy(speciesId) {
  const { state, pokemonData, audio, vfx, shell, rotomPane } = getApis();
  const profile = state.getActiveProfile();
  const pkmn = pokemonData.getPokemonById(speciesId);
  if (!profile || !pkmn || !profile.caught?.[speciesId]) return;

  const updated = state.updateProfile((draft) => {
    draft.activeBuddyId = speciesId;
    draft.evolutionMeter = Math.min(100, draft.evolutionMeter || 0);
  });

  audio?.playClick?.('confirm');
  if (_container) {
    vfx?.spawnFloatingText?.(_container, `${pkmn.name} is your Buddy!`, 'success');
  }
  shell?.showToast?.(`${pkmn.name} joined as your Active Buddy!`, 'success');
  shell?.render?.(state.getState());
  rotomPane?.render?.(updated);
  render();
}

function renderCampTab(profile, pokemonData, itemsData) {
  const buddy = pokemonData.getPokemonById(profile.activeBuddyId);
  const buddyShiny = Boolean(profile.caught?.[buddy?.id]?.shiny);
  const meter = Math.round(profile.evolutionMeter || 0);
  const canEvo = Boolean(buddy?.evolvesTo);
  const xpIntoLevel = (profile.buddyXp || 0) % 100;

  const feedItems = [
    ...(itemsData.BERRIES || []).map((b) => ({
      id: b.id,
      name: b.name,
      svg: b.svgMarkup,
      boost: `+${b.xpBoost} XP / +${b.evolutionBoost}% Evo`
    })),
    {
      id: 'rarecandy',
      name: 'Rare Candy',
      svg: (itemsData.MART_CATALOG || []).find((m) => m.id === 'rarecandy')?.svgMarkup || '🍬',
      boost: '+80 XP / +1 Lv'
    }
  ];

  const eggs = Array.isArray(profile.mysteryEggs) ? profile.mysteryEggs : [];

  return `
    ${_hatchedNotice ? `
      <div class="pm-hatch-banner" role="status">
        <div style="display:flex; align-items:center; gap:12px;">
          <div data-hatched-visual></div>
          <div>
            <div style="font-weight:900; color:#92400e;">🎉 Egg Hatched!</div>
            <div style="font-weight:800; font-size:1.05rem;">
              ${_hatchedNotice.shiny ? '✨ Shiny ' : ''}${escapeHtml(_hatchedNotice.pokemon.name)} joined your Pokédex!
            </div>
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button type="button" class="pm-btn-action" data-action="set-buddy" data-species="${escapeHtml(_hatchedNotice.pokemon.id)}">Set as Active Buddy</button>
          <button type="button" class="pm-btn-ghost" data-action="dismiss-hatch">Dismiss</button>
        </div>
      </div>
    ` : ''}

    <div class="pm-camp-grid">
      <section class="pm-camp-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h3 style="margin:0; font-size:1.05rem;">🏕️ Active Buddy Stage</h3>
          <span style="font-weight:800; font-size:0.85rem; color:#475569;">Lv. ${profile.buddyLevel || 1} • ${profile.buddyXp || 0} XP</span>
        </div>

        <div class="pm-buddy-stage" data-buddy-stage data-action="pet-buddy" role="button" tabindex="0" aria-label="Pet your buddy for hearts and XP">
          <div data-camp-buddy></div>
          <div style="font-weight:900; font-size:1.15rem;">
            ${buddyShiny ? '✨ ' : ''}${escapeHtml(buddy?.name || 'Buddy')}
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:center;">
            ${(buddy?.types || []).map((t) => `
              <span class="pm-type-pill" style="background:${TYPE_COLORS[t] || '#64748b'};">${escapeHtml(t)}</span>
            `).join('')}
          </div>
          <div style="font-size:0.78rem; color:#166534; font-weight:800;">Tap to pet for ♥ &amp; bonus XP!</div>
        </div>

        <div style="margin-top:12px; display:flex; flex-direction:column; gap:8px;">
          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:800; margin-bottom:3px;">
              <span>Buddy Level Progress</span>
              <span>${xpIntoLevel} / 100 XP</span>
            </div>
            <div class="pm-meter-track"><div class="pm-meter-fill" style="width:${xpIntoLevel}%;"></div></div>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:800; margin-bottom:3px;">
              <span>Evolution Meter</span>
              <span>${meter}%</span>
            </div>
            <div class="pm-meter-track"><div class="pm-meter-fill is-evo" style="width:${Math.min(100, meter)}%;"></div></div>
          </div>
        </div>

        ${meter >= 100 && canEvo ? `
          <button type="button" class="pm-evo-ready-btn" data-action="goto-forge">
            ✨ Ready to Evolve! Enter Evolution Forge →
          </button>
        ` : ''}
      </section>

      <section class="pm-camp-card">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <h3 style="margin:0; font-size:1.05rem;">🍓 Feed Berries &amp; Rare Candies</h3>
          <button type="button" class="pm-btn-ghost" data-action="goto-mart">Poké-Mart →</button>
        </div>
        <div class="pm-feed-grid">
          ${feedItems.map((item) => {
            const count = profile.inventory?.[item.id] ?? 0;
            return `
              <button type="button" class="pm-feed-btn" data-action="feed-item" data-item-id="${escapeHtml(item.id)}" ${count <= 0 ? 'disabled' : ''}>
                <div>${item.svg}</div>
                <div style="font-weight:900; font-size:0.84rem;">${escapeHtml(item.name)}</div>
                <div style="font-size:0.74rem; color:#475569; font-weight:700;">${escapeHtml(item.boost)}</div>
                <div style="font-size:0.76rem; font-weight:900; color:${count > 0 ? '#15803d' : '#94a3b8'};">Owned: ${count}</div>
              </button>
            `;
          }).join('')}
        </div>
      </section>
    </div>

    <div class="pm-camp-grid">
      <section class="pm-camp-card">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <h3 style="margin:0; font-size:1.05rem;">🧢 Cosmetic Closet</h3>
          <span style="font-weight:800; font-size:0.85rem;">🪙 ${profile.coins ?? 0} Coins</span>
        </div>
        <div class="pm-closet-grid">
          ${(itemsData.ACCESSORIES || []).map((acc) => {
            const owned = profile.ownedAccessories?.includes(acc.id);
            const equipped = profile.equippedAccessories?.includes(acc.id);
            return `
              <article class="pm-closet-item ${equipped ? 'is-equipped' : ''}">
                <div style="display:flex; align-items:center; gap:8px;">
                  <div class="pm-closet-icon">${acc.svgMarkup || ''}</div>
                  <div>
                    <div style="font-weight:800; font-size:0.86rem;">${escapeHtml(acc.name)}</div>
                    <div style="font-size:0.72rem; color:#64748b; text-transform:capitalize;">Slot: ${escapeHtml(acc.slot)}</div>
                  </div>
                </div>
                ${owned ? `
                  <button type="button" class="${equipped ? 'pm-btn-action' : 'pm-btn-ghost'}" data-action="toggle-acc" data-acc-id="${escapeHtml(acc.id)}">
                    ${equipped ? '✓ Equipped (Tap to Remove)' : 'Equip'}
                  </button>
                ` : `
                  <div style="display:flex; flex-direction:column; gap:5px;">
                    <button type="button" class="pm-btn-ghost" data-action="toggle-acc" data-acc-id="${escapeHtml(acc.id)}">
                      🪙 Unlock (${acc.costCoins}c)
                    </button>
                    <button type="button" class="pm-btn-ghost" style="min-height:32px; font-size:0.76rem;" data-action="goto-mart">
                      Visit Poké-Mart →
                    </button>
                  </div>
                `}
              </article>
            `;
          }).join('')}
        </div>
      </section>

      <section class="pm-camp-card">
        <h3 style="margin:0; font-size:1.05rem;">🥚 Mystery Egg Incubator</h3>
        ${eggs.length === 0 ? `
          <div style="margin-top:12px; padding:16px; border-radius:14px; background:#fffbeb; border:2px dashed #fde68a; text-align:center; color:#92400e; font-weight:700;">
            No Mystery Eggs incubating right now. Defeat Gym Leaders or clear Evolution Forge Shrine trials to discover one!
          </div>
        ` : `
          <div class="pm-egg-list">
            ${eggs.map((egg, idx) => `
              <article class="pm-egg-card">
                <svg viewBox="0 0 64 64" width="54" height="54" aria-hidden="true">
                  <path d="M32 8c12 0 20 18 20 31 0 11-9 18-20 18S12 50 12 39C12 26 20 8 32 8Z" fill="#FEF3C7" stroke="#D97706" stroke-width="3"/>
                  <circle cx="24" cy="30" r="4.5" fill="#F59E0B" opacity="0.7"/>
                  <circle cx="38" cy="40" r="5.5" fill="#38B000" opacity="0.55"/>
                  <circle cx="36" cy="22" r="3" fill="#3B82F6" opacity="0.55"/>
                </svg>
                <div style="font-weight:900;">Mystery Egg #${idx + 1}</div>
                <div style="font-size:0.8rem; color:#92400e; font-weight:800;">Warmth: ${egg.warmth || 0} / 3</div>
                <div class="pm-meter-track">
                  <div class="pm-meter-fill" style="width:${Math.min(100, ((egg.warmth || 0) / 3) * 100)}%;"></div>
                </div>
                <button type="button" class="pm-btn-action" style="width:100%;" data-action="warm-egg" data-egg-id="${escapeHtml(egg.id)}">
                  ${(egg.warmth || 0) >= 2 ? '✨ Hatch Egg!' : '🔥 Warm Egg'}
                </button>
              </article>
            `).join('')}
          </div>
        `}
      </section>
    </div>
  `;
}

function getFilteredRoster(profile, pokemonData) {
  const roster = pokemonData.POKEMON_ROSTER || [];
  const q = _searchQuery.trim().toLowerCase();
  return roster.filter((p) => {
    if (_caughtOnly && !profile.caught?.[p.id]) return false;
    if (_typeFilter !== 'all' && !(p.types || []).includes(_typeFilter)) return false;
    if (q) {
      const dexStr = String(p.dexNumber).padStart(3, '0');
      const hitName = p.name.toLowerCase().includes(q);
      const hitDex = String(p.dexNumber).includes(q.replace(/^#/, '')) || dexStr.includes(q.replace(/^#/, ''));
      if (!hitName && !hitDex) return false;
    }
    return true;
  });
}

function populateDexResults() {
  if (!_container) return;
  const { state, pokemonData, vfx } = getApis();
  const profile = state.getActiveProfile();
  if (!profile) return;

  const listWrap = _container.querySelector('[data-dex-grid]');
  const countEl = _container.querySelector('[data-dex-count]');
  const layoutEl = _container.querySelector('[data-dex-layout]');
  const detailEl = _container.querySelector('[data-dex-detail]');
  if (!listWrap) return;

  const filtered = getFilteredRoster(profile, pokemonData);
  const totalCount = (pokemonData.POKEMON_ROSTER || []).length;
  const caughtTotal = Object.keys(profile.caught || {}).length;
  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${totalCount} species (${caughtTotal} caught)`;
  }

  listWrap.innerHTML = '';
  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'grid-column: 1 / -1; padding: 24px; text-align:center; color:#64748b; font-weight:700;';
    empty.textContent = 'No Pokémon match your search or type filters.';
    listWrap.appendChild(empty);
  } else {
    for (const p of filtered) {
      const caughtInfo = profile.caught?.[p.id];
      const showShiny = _shinyPreview || Boolean(caughtInfo?.shiny);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `pm-dex-card ${caughtInfo ? '' : 'is-uncaught'} ${_selectedDexId === p.id ? 'is-selected' : ''}`;
      card.dataset.action = 'select-dex';
      card.dataset.species = p.id;

      const topRow = document.createElement('div');
      topRow.style.cssText = 'display:flex; justify-content:space-between; width:100%; font-size:0.72rem; font-weight:800; color:#64748b;';
      topRow.innerHTML = `<span>#${String(p.dexNumber).padStart(3, '0')}</span><span>${caughtInfo ? (caughtInfo.shiny ? '✨' : '🔴') : ''}</span>`;
      card.appendChild(topRow);

      const vis = renderVisualSafe(vfx, p, {
        shiny: showShiny,
        size: 72,
        animate: false
      });
      card.appendChild(vis);

      const nameEl = document.createElement('div');
      nameEl.style.cssText = 'font-weight:900; font-size:0.84rem; color:#0f172a;';
      nameEl.textContent = p.name;
      card.appendChild(nameEl);

      const typesRow = document.createElement('div');
      typesRow.style.cssText = 'display:flex; gap:3px; flex-wrap:wrap; justify-content:center;';
      for (const t of p.types || []) {
        const pill = document.createElement('span');
        pill.className = 'pm-type-pill';
        pill.style.background = TYPE_COLORS[t] || '#64748b';
        pill.style.fontSize = '0.62rem';
        pill.style.padding = '2px 6px';
        pill.textContent = t;
        typesRow.appendChild(pill);
      }
      card.appendChild(typesRow);

      listWrap.appendChild(card);
    }
  }

  if (layoutEl && detailEl) {
    const selected = _selectedDexId ? pokemonData.getPokemonById(_selectedDexId) : null;
    layoutEl.classList.toggle('has-detail', Boolean(selected));
    if (!selected) {
      detailEl.style.display = 'none';
      detailEl.innerHTML = '';
    } else {
      detailEl.style.display = 'flex';
      const caughtInfo = profile.caught?.[selected.id];
      const chain = pokemonData.getEvolutionChain(selected.id) || [selected];
      const isActiveBuddy = profile.activeBuddyId === selected.id;

      const stages = new Map();
      for (const member of chain) {
        const list = stages.get(member.stage) || [];
        list.push(member);
        stages.set(member.stage, list);
      }
      const stageGroupsHtml = Array.from(stages.keys()).sort((a, b) => a - b).map((stageNum, sIdx) => {
        const members = stages.get(stageNum) || [];
        const buttons = members.map((member) => `
          <button type="button" class="pm-chain-btn ${member.id === selected.id ? 'is-current' : ''}" data-action="select-dex" data-species="${escapeHtml(member.id)}">
            ${escapeHtml(member.name)}
          </button>
        `).join('');
        return `${sIdx > 0 ? '<span style="color:#94a3b8; font-weight:900;">→</span>' : ''}<span style="display:inline-flex; flex-wrap:wrap; gap:4px;">${buttons}</span>`;
      }).join('');

      detailEl.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:900; color:#64748b;">#${String(selected.dexNumber).padStart(3, '0')}</span>
          <div style="display:flex; gap:6px;">
            <button type="button" class="pm-pill-toggle is-shiny ${_detailShiny ? 'is-active' : ''}" style="min-height:34px; padding:4px 10px;" data-action="toggle-detail-shiny">
              ✨ Shiny
            </button>
            <button type="button" class="pm-btn-ghost" style="min-height:34px; padding:4px 10px;" data-action="close-detail" aria-label="Close detail">✕</button>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; align-items:center; gap:6px; background:#fff9f0; border-radius:14px; padding:12px;">
          <div data-detail-visual></div>
          <h3 style="margin:0; font-size:1.2rem;">${escapeHtml(selected.name)}</h3>
          <div style="display:flex; gap:5px;">
            ${(selected.types || []).map((t) => `<span class="pm-type-pill" style="background:${TYPE_COLORS[t] || '#64748b'};">${escapeHtml(t)}</span>`).join('')}
          </div>
          <div style="font-size:0.8rem; font-weight:800; color:#475569;">
            Base HP: ${selected.baseHp} • ${caughtInfo ? `Caught ×${caughtInfo.count}` : 'Not Caught Yet'}
          </div>
        </div>

        <div>
          <div style="font-weight:900; font-size:0.82rem; color:#475569; margin-bottom:4px;">Evolution Family Chain</div>
          <div class="pm-evo-chain">${stageGroupsHtml}</div>
        </div>

        <div style="background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:12px; padding:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="font-size:0.82rem; color:#1e3a8a;">📖 Math Pokédex Lore</strong>
            <button type="button" class="pm-btn-ghost" style="min-height:30px; padding:2px 8px; font-size:0.75rem;" data-action="speak-lore">🔊</button>
          </div>
          <p style="margin:0; font-size:0.84rem; line-height:1.45; color:#334155;">${escapeHtml(selected.mathLore)}</p>
        </div>

        <div style="font-size:0.78rem; color:#475569; font-weight:700;">
          Moves: ${escapeHtml(selected.moveNames?.quick || '')} • ${escapeHtml(selected.moveNames?.power || '')} • ${escapeHtml(selected.moveNames?.charge || '')}
        </div>

        ${caughtInfo
          ? `<button type="button" class="pm-btn-action" data-action="set-buddy" data-species="${escapeHtml(selected.id)}" ${isActiveBuddy ? 'disabled' : ''}>
              ${isActiveBuddy ? '✓ Current Active Buddy' : 'Set as Active Buddy'}
            </button>`
          : `<button type="button" class="pm-btn-ghost" disabled>Catch in Battle or Safari to Befriend</button>`
        }
      `;

      const visSlot = detailEl.querySelector('[data-detail-visual]');
      if (visSlot) {
        visSlot.appendChild(renderVisualSafe(vfx, selected, {
          shiny: _detailShiny,
          size: 124,
          animate: true
        }));
      }
    }
  }
}

function renderPokedexTab(profile, pokemonData) {
  const roster = pokemonData.POKEMON_ROSTER || [];
  const allTypes = Array.from(new Set(roster.flatMap((p) => p.types || []))).sort();
  const caughtTotal = Object.keys(profile.caught || {}).length;

  return `
    <section class="pm-camp-card">
      <div class="pm-dex-controls">
        <div class="pm-dex-top-row">
          <input
            type="search"
            class="pm-dex-search"
            data-dex-search
            placeholder="Search Pokémon name or #..."
            value="${escapeHtml(_searchQuery)}"
            aria-label="Search Pokédex"
          />
          <div class="pm-dex-toggles">
            <button type="button" class="pm-pill-toggle ${_caughtOnly ? 'is-active' : ''}" data-action="toggle-caught-only">
              Caught Only (${caughtTotal}/${roster.length})
            </button>
            <button type="button" class="pm-pill-toggle is-shiny ${_shinyPreview ? 'is-active' : ''}" data-action="toggle-shiny-preview">
              ✨ Shiny Preview
            </button>
          </div>
        </div>

        <div class="pm-type-scroll" role="group" aria-label="Filter by Pokémon Type">
          <button type="button" class="pm-type-filter ${_typeFilter === 'all' ? 'is-active' : ''}" data-action="set-type-filter" data-type="all">All Types</button>
          ${allTypes.map((type) => `
            <button type="button" class="pm-type-filter ${_typeFilter === type ? 'is-active' : ''}" data-action="set-type-filter" data-type="${escapeHtml(type)}">
              ${escapeHtml(type)}
            </button>
          `).join('')}
        </div>

        <div data-dex-count style="font-size:0.82rem; font-weight:800; color:#64748b;"></div>
      </div>

      <div class="pm-dex-layout" data-dex-layout style="margin-top:12px;">
        <div class="pm-dex-grid" data-dex-grid></div>
        <aside class="pm-dex-drawer" data-dex-detail style="display:none;" aria-label="Pokémon Details"></aside>
      </div>
    </section>
  `;
}

function render() {
  if (!_container) return;
  const { state, pokemonData, itemsData, vfx } = getApis();
  const profile = state.getActiveProfile();

  if (!profile) {
    _container.innerHTML = `<div class="pm-camp"><div class="pm-camp-card">Select or create a Trainer Profile to enter Buddy Camp &amp; Pokédex!</div></div>`;
    return;
  }

  const bodyHtml = _tab === 'pokedex'
    ? renderPokedexTab(profile, pokemonData)
    : renderCampTab(profile, pokemonData, itemsData);

  _container.innerHTML = `
    <div class="pm-camp">
      <div class="pm-camp-bg" data-camp-bg></div>
      <div class="pm-camp-inner">
        <nav class="pm-camp-tabs" aria-label="Camp and Pokédex Tabs">
          <button type="button" class="pm-camp-tab ${_tab === 'camp' ? 'is-active' : ''}" data-action="switch-tab" data-tab="camp">
            <span>🏕️</span><span>Cozy Buddy Camp</span>
          </button>
          <button type="button" class="pm-camp-tab ${_tab === 'pokedex' ? 'is-active' : ''}" data-action="switch-tab" data-tab="pokedex">
            <span>📖</span><span>Illustrated Pokédex Vault</span>
          </button>
        </nav>
        ${bodyHtml}
      </div>
    </div>
  `;

  const bgSlot = _container.querySelector('[data-camp-bg]');
  if (bgSlot && vfx?.mountBiomeBackdrop) {
    vfx.mountBiomeBackdrop(bgSlot, 'meadow');
  }

  if (_tab === 'camp') {
    const buddy = pokemonData.getPokemonById(profile.activeBuddyId);
    const buddySlot = _container.querySelector('[data-camp-buddy]');
    if (buddySlot && buddy) {
      buddySlot.appendChild(renderVisualSafe(vfx, buddy, {
        shiny: Boolean(profile.caught?.[buddy.id]?.shiny),
        size: 144,
        accessories: profile.equippedAccessories || [],
        animate: true
      }));
    }
    const hatchedSlot = _container.querySelector('[data-hatched-visual]');
    if (hatchedSlot && _hatchedNotice?.pokemon) {
      hatchedSlot.appendChild(renderVisualSafe(vfx, _hatchedNotice.pokemon, {
        shiny: _hatchedNotice.shiny,
        size: 64,
        animate: true
      }));
    }
  } else {
    populateDexResults();
  }
}

function handleContainerClick(event) {
  const btn = event.target?.closest?.('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const { state, pokemonData, audio, onNavigate } = getApis();
  audio?.unlockAudio?.();

  if (action === 'switch-tab') {
    const nextTab = btn.dataset.tab === 'pokedex' ? 'pokedex' : 'camp';
    if (nextTab !== _tab) {
      _tab = nextTab;
      audio?.playClick?.('switch');
      render();
    }
    return;
  }

  if (action === 'pet-buddy') {
    handlePetBuddy();
    return;
  }

  if (action === 'feed-item') {
    handleFeedItem(btn.dataset.itemId);
    return;
  }

  if (action === 'toggle-acc') {
    handleToggleAccessory(btn.dataset.accId);
    return;
  }

  if (action === 'warm-egg') {
    handleWarmEgg(btn.dataset.eggId);
    return;
  }

  if (action === 'set-buddy') {
    handleSetActiveBuddy(btn.dataset.species);
    return;
  }

  if (action === 'dismiss-hatch') {
    _hatchedNotice = null;
    audio?.playClick?.('close');
    render();
    return;
  }

  if (action === 'goto-forge') {
    audio?.playClick?.('confirm');
    onNavigate?.('evolution-forge');
    return;
  }

  if (action === 'goto-mart') {
    audio?.playClick?.('confirm');
    onNavigate?.('berry-lab', { station: 'mart' });
    return;
  }

  if (action === 'toggle-caught-only') {
    _caughtOnly = !_caughtOnly;
    audio?.playClick?.('toggle');
    render();
    return;
  }

  if (action === 'toggle-shiny-preview') {
    _shinyPreview = !_shinyPreview;
    audio?.playClick?.('toggle');
    render();
    return;
  }

  if (action === 'set-type-filter') {
    _typeFilter = btn.dataset.type || 'all';
    audio?.playClick?.('tap');
    render();
    return;
  }

  if (action === 'select-dex') {
    const profile = state.getActiveProfile();
    const id = btn.dataset.species;
    _selectedDexId = id;
    _detailShiny = _shinyPreview || Boolean(profile?.caught?.[id]?.shiny);
    audio?.playClick?.('tap');
    populateDexResults();
    return;
  }

  if (action === 'toggle-detail-shiny') {
    _detailShiny = !_detailShiny;
    audio?.playClick?.('toggle');
    populateDexResults();
    return;
  }

  if (action === 'close-detail') {
    _selectedDexId = null;
    audio?.playClick?.('close');
    populateDexResults();
    return;
  }

  if (action === 'speak-lore') {
    const selected = _selectedDexId ? pokemonData.getPokemonById(_selectedDexId) : null;
    if (selected?.mathLore) {
      audio?.playClick?.('tap');
      audio?.speakText?.(`${selected.name}. ${selected.mathLore}`, true);
    }
  }
}

function handleContainerInput(event) {
  const input = event.target?.closest?.('[data-dex-search]');
  if (!input) return;
  _searchQuery = input.value || '';
  populateDexResults();
}

/**
 * Mounts Mode 6: Buddy Camp & Illustrated Pokédex Vault into containerEl.
 * @param {HTMLElement} containerEl
 * @param {Object} context
 */
export function mount(containerEl, context = {}) {
  unmount();
  _container = containerEl;
  _ctx = context;

  _tab = context?.modeParams?.tab === 'pokedex' ? 'pokedex' : 'camp';
  _searchQuery = '';
  _typeFilter = 'all';
  _caughtOnly = false;
  _shinyPreview = false;
  _selectedDexId = null;
  _hatchedNotice = null;

  ensureStyles();
  if (_container) {
    _container.addEventListener('click', handleContainerClick);
    _container.addEventListener('input', handleContainerInput);
  }

  const { state, rotomPane } = getApis();
  const profile = state.getActiveProfile();
  rotomPane?.setMood?.('cheering', "It's super cozy in the PokéNav! Pet your buddy, warm eggs, or browse the Pokédex!");
  if (profile) {
    rotomPane?.render?.(profile);
  }
  render();
}

/**
 * Cleanly removes listeners, timers, and styles for Buddy Camp & Pokédex.
 */
export function unmount() {
  clearTimers();
  if (_container) {
    _container.removeEventListener('click', handleContainerClick);
    _container.removeEventListener('input', handleContainerInput);
    _container.innerHTML = '';
  }
  removeStyles();
  _container = null;
  _ctx = null;
  _hatchedNotice = null;
  _selectedDexId = null;
}

/**
 * Handles keyboard shortcuts (Escape closes Pokédex detail panel).
 * @param {KeyboardEvent} event
 * @returns {boolean}
 */
export function handleKey(event) {
  if (!_container || !event) return false;
  if (_tab === 'camp' && (event.key === 'Enter' || event.key === ' ') && event.target?.closest?.('[data-buddy-stage]')) {
    event.preventDefault?.();
    handlePetBuddy();
    return true;
  }
  if (_tab === 'pokedex' && _selectedDexId && event.key === 'Escape') {
    const { audio } = getApis();
    _selectedDexId = null;
    audio?.playClick?.('close');
    populateDexResults();
    return true;
  }
  return false;
}
