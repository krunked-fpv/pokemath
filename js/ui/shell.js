/**
 * PokéMath Shell Controller (`js/ui/shell.js`)
 * Manages Top Trainer Ribbon, Left Expedition Rail (Buddy, 6-Route Map, Badge Case),
 * Profile Switcher & krunked-cookie-vault-v1 Modal, Parent/Coach Filter Modal,
 * Mobile Drawers, Install PokéNav Pill, and Toast Notifications.
 */

import * as defaultPokemonData from '../data/pokemon.js';
import * as defaultRoutesData from '../data/routes.js';
import * as defaultVfx from './vfx.js';

const TIER_META = [
  { id: 'starter', label: 'Starter (Ages 6–7)' },
  { id: 'explorer', label: 'Explorer (Ages 7–8)' },
  { id: 'ace', label: 'Ace (Ages 8–10)' },
  { id: 'champion', label: 'Champion (Ages 10+)' }
];

const OPERATION_LABELS = [
  { id: 'add', label: 'Addition (+)' },
  { id: 'sub', label: 'Subtraction (−)' },
  { id: 'mul', label: 'Multiplication (×)' },
  { id: 'div', label: 'Division (÷)' },
  { id: 'placeValue', label: 'Place Value (100s/10s/1s)' },
  { id: 'comparison', label: 'Comparisons (< = >)' },
  { id: 'fraction', label: 'Fractions (a/b)' },
  { id: 'word', label: 'Story Problems' }
];

const AVATAR_SWATCHES = ['#E3350D', '#3B4CCA', '#38B000', '#F59E0B', '#EC4899', '#8B5CF6'];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildBadgeSvg(svgKey, color, earned) {
  const fill = earned ? color : '#94A3B8';
  let emblem = '<circle cx="24" cy="24" r="9" fill="#FFFFFF"/>';
  if (svgKey === 'sprout') {
    emblem = '<path d="M24 10 C32 14, 34 25, 24 34 C14 25, 16 14, 24 10 Z" fill="#FFFFFF"/>';
  } else if (svgKey === 'geode') {
    emblem = '<polygon points="24,10 35,20 31,34 17,34 13,20" fill="#FFFFFF"/>';
  } else if (svgKey === 'beacon') {
    emblem = '<polygon points="24,9 28,22 38,24 28,26 24,39 20,26 10,24 20,22" fill="#FFFFFF"/>';
  } else if (svgKey === 'dynamo') {
    emblem = '<polyline points="26,9 17,24 25,24 21,39 32,22 24,22" fill="#FFCB05" stroke="#1E293B" stroke-width="1.5"/>';
  } else if (svgKey === 'cascade') {
    emblem = '<path d="M24 10 C31 20, 35 28, 24 37 C13 28, 17 20, 24 10 Z" fill="#FFFFFF"/>';
  } else if (svgKey === 'infinity') {
    emblem = '<path d="M14 24 C14 18, 21 18, 24 24 C27 30, 34 30, 34 24 C34 18, 27 18, 24 24 C21 30, 14 30, 14 24 Z" fill="none" stroke="#FFCB05" stroke-width="3.5"/>';
  }
  return `
    <svg viewBox="0 0 48 48" width="32" height="32" aria-hidden="true">
      <circle cx="24" cy="24" r="20" fill="${escapeHtml(fill)}" stroke="#1E293B" stroke-width="2.5"/>
      ${emblem}
    </svg>
  `;
}

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  const mediaMatch = typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
  return Boolean(mediaMatch || window.navigator?.standalone === true);
}

function readCookieVaultStats(cookieName) {
  if (typeof document === 'undefined' || typeof document.cookie !== 'string') {
    return { synced: false, bytes: 0 };
  }
  const parts = document.cookie.split(';');
  const prefix = `${cookieName}=`;
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      const val = trimmed.slice(prefix.length);
      return { synced: val.length > 0, bytes: val.length };
    }
  }
  return { synced: false, bytes: 0 };
}

/**
 * Creates and manages the PokéNav Shell UI.
 */
export function createShell(rootEls = {}, context = {}) {
  const {
    ribbonEl = null,
    leftRailEl = null,
    modalRootEl = null,
    toastRootEl = null,
    mobileNavEl = null,
    backdropEl = null
  } = rootEls;

  const stateStore = context.state || null;
  const audio = context.audio || null;
  const vfx = context.vfx || defaultVfx;
  const routesData = context.routesData || defaultRoutesData;
  const pokemonData = context.pokemonData || defaultPokemonData;

  const onSelectRoute = typeof context.onSelectRoute === 'function' ? context.onSelectRoute : null;
  const onNavigate = typeof context.onNavigate === 'function' ? context.onNavigate : null;
  const onFilterChange = typeof context.onFilterChange === 'function' ? context.onFilterChange : null;
  const onProfileChanged = typeof context.onProfileChanged === 'function' ? context.onProfileChanged : null;

  let latestRootState = stateStore?.getState ? stateStore.getState() : { activeProfileId: null, profiles: [] };
  let selectedRouteId = 'route-1';
  let openDrawerSide = null; // null | 'left' | 'right'
  let activeModal = null; // null | 'profile' | 'parent'
  let confirmDeleteProfileId = null;
  let installHandler = null;
  let installDismissed = false;
  let shownAutoHealToast = false;

  function getActiveProfileFrom(rootState) {
    if (!rootState || !Array.isArray(rootState.profiles) || !rootState.activeProfileId) return null;
    return rootState.profiles.find((p) => p.id === rootState.activeProfileId) || null;
  }

  function getRotomDrawerEl() {
    if (rootEls.rotomEl) return rootEls.rotomEl;
    if (rootEls.rotomPaneEl) return rootEls.rotomPaneEl;
    if (typeof document !== 'undefined') return document.getElementById('rotom-pane');
    return null;
  }

  function syncReducedMotionAttr(profile) {
    if (typeof document === 'undefined' || !document.documentElement) return;
    const enabled = Boolean(profile?.settings?.reducedMotion);
    if (enabled) {
      document.documentElement.dataset.reducedMotion = 'true';
    } else {
      delete document.documentElement.dataset.reducedMotion;
    }
  }

  function showToast(msg, variant = 'info') {
    if (!toastRootEl || typeof document === 'undefined') return;
    const toast = document.createElement('div');
    toast.className = `pokenav-toast toast-${variant}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    const textSpan = document.createElement('span');
    textSpan.textContent = String(msg ?? '');

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-ghost';
    closeBtn.style.cssText = 'color:inherit;padding:2px 6px;min-height:24px;border:none;font-weight:900;';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Dismiss notification');
    closeBtn.addEventListener('click', () => toast.remove());

    toast.appendChild(textSpan);
    toast.appendChild(closeBtn);
    toastRootEl.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3600);
  }

  function renderRibbon(profile) {
    if (!ribbonEl) return;
    const tierLabel = profile?.tier ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1) : 'Starter';
    const filterOn = Boolean(profile?.customFilter?.enabled);
    const streakDays = profile?.streak?.current ?? 1;
    const bestStreak = profile?.streak?.best ?? 1;
    const coins = profile?.coins ?? 0;
    const stardust = profile?.stardust ?? 0;
    const sfxOn = profile ? Boolean(profile.settings?.sfx) : true;
    const ambientOn = profile ? Boolean(profile.settings?.ambient) : false;
    const speechOn = profile ? Boolean(profile.settings?.speech) : false;
    const showInstall = Boolean(installHandler && !installDismissed && !isStandaloneMode());

    ribbonEl.innerHTML = `
      <div class="ribbon-group ribbon-left">
        <button type="button" class="ribbon-brand" data-shell-action="go-home" title="Return to Wild Battle Stage">
          <svg class="ribbon-brand-logo" viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="16" fill="#FFFFFF" stroke="#1E293B" stroke-width="2.5"/>
            <path d="M2 18 A16 16 0 0 1 34 18 Z" fill="#E3350D" stroke="#1E293B" stroke-width="2.5"/>
            <line x1="2" y1="18" x2="34" y2="18" stroke="#1E293B" stroke-width="3"/>
            <circle cx="18" cy="18" r="5" fill="#FFCB05" stroke="#1E293B" stroke-width="2"/>
          </svg>
          <span>PokéMath</span>
        </button>
        <span class="classic-1996-badge" tabindex="0" data-tooltip="Classic Trainer 1996 Heritage Edition — honoring red, gold & indigo PokéMath nostalgia." aria-label="Classic 1996 Heritage Tooltip">1996</span>
        <button type="button" class="ribbon-pill" data-shell-action="open-profile" aria-label="Switch or manage trainer profile">
          <span class="trainer-avatar-dot" style="background:${escapeHtml(profile?.avatarColor || '#E3350D')};"></span>
          <span>${escapeHtml(profile?.name || 'New Trainer')}</span>
          <span aria-hidden="true">▾</span>
        </button>
        <button type="button" class="ribbon-pill" data-shell-action="open-parent" aria-label="Grade tier and Parent custom filter settings">
          <span class="tier-chip">${escapeHtml(tierLabel)}</span>
          ${filterOn ? '<span class="filter-active-dot">Filter ON</span>' : '<span class="ribbon-label-hide-compact" style="font-size:0.74rem;color:var(--text-secondary);">Coach</span>'}
        </button>
      </div>

      <div class="ribbon-group ribbon-center">
        <span class="currency-pill streak-flame tabular-nums" title="Daily Streak (Best: ${bestStreak} days)">🔥 ${streakDays}d</span>
        <span class="currency-pill tabular-nums" title="Poké-Coins">🪙 ${coins}</span>
        <span class="currency-pill tabular-nums" title="Stardust">✨ ${stardust}</span>
      </div>

      <div class="ribbon-group ribbon-right">
        <button type="button" class="ribbon-toggle-btn ${sfxOn ? 'is-on' : ''}" data-setting-toggle="sfx" aria-pressed="${sfxOn}" title="Toggle sound effects">
          <span>${sfxOn ? '🔊' : '🔇'}</span>
          <span class="ribbon-label-hide-compact">SFX</span>
        </button>
        <button type="button" class="ribbon-toggle-btn ${ambientOn ? 'is-on' : ''}" data-setting-toggle="ambient" aria-pressed="${ambientOn}" title="Toggle cozy ambient kalimba music">
          <span>🎵</span>
          <span class="ribbon-label-hide-compact">Music</span>
        </button>
        <button type="button" class="ribbon-toggle-btn ${speechOn ? 'is-on' : ''}" data-setting-toggle="speech" aria-pressed="${speechOn}" title="Toggle automatic read-aloud">
          <span>🗣️</span>
          <span class="ribbon-label-hide-compact">Voice</span>
        </button>
        <button type="button" class="ribbon-pill" data-shell-action="go-camp" title="Open Buddy Camp & Pokédex">
          <span>⛺</span>
          <span class="ribbon-label-hide-compact">Camp &amp; Dex</span>
        </button>
        ${showInstall ? `
          <span class="install-pokenav-wrap">
            <button type="button" id="install-pwa-btn">📲 Install PokéNav</button>
            <button type="button" class="install-dismiss-btn" data-install-dismiss="true" aria-label="Dismiss install prompt">×</button>
          </span>
        ` : ''}
      </div>
    `;
  }

  function renderLeftRail(profile) {
    if (!leftRailEl) return;
    const routes = Array.isArray(routesData?.ROUTES) ? routesData.ROUTES : [];
    const buddyId = profile?.activeBuddyId || 'pikachu';
    const buddy = pokemonData?.getPokemonById?.(buddyId) || pokemonData?.POKEMON_BY_ID?.[buddyId] || {
      id: buddyId,
      dexNumber: 25,
      name: 'Pikachu',
      types: ['electric'],
      evolvesTo: 'raichu',
      evolutionXpRequired: 120,
      fallbackPalette: { primary: '#FFCB05', secondary: '#FFE45E', accent: '#B45309', eye: '#1E293B' },
      emblemShape: 'bolt'
    };

    const isShiny = Boolean(profile?.caught?.[buddy.id]?.shiny);
    const xpReq = Math.max(50, Number(buddy.evolutionXpRequired) || 100);
    const xpVal = Number(profile?.buddyXp) || 0;
    const xpPct = Math.min(100, Math.round(((xpVal % xpReq) / xpReq) * 100));
    const evoPct = Math.min(100, Math.max(0, Math.round(Number(profile?.evolutionMeter) || 0)));
    const evoReady = evoPct >= 100 && Boolean(buddy.evolvesTo);

    const routeCardsHtml = routes.map((route) => {
      const rp = profile?.routeProgress?.[route.id] || {
        unlocked: route.id === 'route-1',
        stars: 0,
        solvedCount: 0,
        bossDefeated: false
      };
      const isActive = route.id === selectedRouteId;
      const starsFilled = '★'.repeat(rp.stars || 0);
      const starsEmpty = '☆'.repeat(Math.max(0, 3 - (rp.stars || 0)));
      return `
        <div class="route-stone ${isActive ? 'is-active' : ''} ${rp.unlocked ? '' : 'is-locked'}">
          <button type="button" class="route-stone-select" data-route-select="${escapeHtml(route.id)}" ${rp.unlocked ? '' : 'disabled'}>
            <span class="route-stone-num tabular-nums">${route.number}</span>
            <span class="route-stone-info">
              <span class="route-stone-title">
                <span>${escapeHtml(route.name)}</span>
                ${rp.unlocked ? '' : '<span aria-label="Locked">🔒</span>'}
              </span>
              <span class="route-stone-sub">${escapeHtml(route.subtitle)}</span>
            </span>
          </button>
          <div class="route-stars-row">
            <span class="route-stars" aria-label="${rp.stars || 0} of 3 stars">${starsFilled}${starsEmpty}</span>
            <span class="route-stars-count tabular-nums">${rp.solvedCount || 0} solved</span>
          </div>
          ${rp.unlocked ? `
            <button type="button" class="gym-gate-btn ${rp.bossDefeated ? 'is-defeated' : ''}" data-gym-route="${escapeHtml(route.id)}">
              <span>${rp.bossDefeated ? '✓' : '⚔️'}</span>
              <span>${rp.bossDefeated ? `Rematch ${escapeHtml(route.gymLeader.name)}` : `Challenge ${escapeHtml(route.gymLeader.name)}`}</span>
            </button>
          ` : `
            <span style="font-size:0.7rem;color:var(--text-muted);font-weight:700;">Defeat Route ${route.number - 1} Gym Leader to unlock</span>
          `}
        </div>
      `;
    }).join('');

    const earnedBadges = new Set(Array.isArray(profile?.badges) ? profile.badges : []);
    const classicUnlocked = Boolean(profile?.classicEmblemUnlocked);

    const badgeSlotsHtml = routes.map((route) => {
      const gl = route.gymLeader;
      const earned = earnedBadges.has(gl.badgeId);
      return `
        <div class="badge-slot ${earned ? 'is-earned' : 'is-locked'}" title="${escapeHtml(gl.badgeName)} (${earned ? 'Earned' : 'Locked'})">
          ${buildBadgeSvg(gl.badgeSvgKey, gl.badgeColor, earned)}
          <span class="badge-slot-label">${escapeHtml(gl.badgeName.replace(' Badge', ''))}</span>
        </div>
      `;
    }).join('');

    leftRailEl.innerHTML = `
      <div class="buddy-card">
        <div class="buddy-card-top">
          <button type="button" class="buddy-stage" id="left-rail-buddy-stage" title="Visit Buddy Camp" aria-label="Visit Buddy Camp with ${escapeHtml(buddy.name)}"></button>
          <div class="buddy-meta">
            <div class="buddy-name-row">
              <h2 class="buddy-name">${escapeHtml(buddy.name)}</h2>
              <span class="buddy-level-badge tabular-nums">Lv.${profile?.buddyLevel ?? 1}</span>
            </div>
            <div class="dex-number tabular-nums" style="font-size:0.74rem;font-weight:800;color:var(--text-secondary);">
              #${String(buddy.dexNumber).padStart(3, '0')} ${isShiny ? '✨ Shiny' : ''}
            </div>
            <div class="buddy-types">
              ${(buddy.types || []).map((t) => `<span class="type-pill type-${escapeHtml(t)}">${escapeHtml(t)}</span>`).join('')}
            </div>
          </div>
        </div>

        <div class="meter-row">
          <div class="meter-label-row">
            <span>Buddy XP</span>
            <span class="xp-readout tabular-nums">${xpVal} XP</span>
          </div>
          <div class="xp-bar-track">
            <div class="xp-bar-fill" style="width:${xpPct}%;"></div>
          </div>
        </div>

        <button type="button" id="evo-meter-btn" class="evo-meter-btn ${evoReady ? 'is-ready' : ''}" data-shell-action="go-evolution">
          <div class="meter-label-row" style="width:100%;">
            <span>${evoReady ? '✨ Ready to Evolve!' : '⚡ Evolution Forge'}</span>
            <span class="tabular-nums">${evoPct}%</span>
          </div>
          <div class="meter-track">
            <div class="meter-fill evo-bar-fill" style="width:${evoPct}%;"></div>
          </div>
        </button>
      </div>

      <div class="pokenav-card">
        <h3 class="section-heading">Expedition Routes</h3>
        <div class="route-map-list">${routeCardsHtml}</div>
      </div>

      <div class="pokenav-card">
        <h3 class="section-heading">
          <span>Gym Badge Case</span>
          <span class="tabular-nums" style="font-size:0.74rem;color:var(--text-secondary);">${earnedBadges.size}/6</span>
        </h3>
        <div class="badge-case-grid">
          ${badgeSlotsHtml}
          <div class="badge-slot classic-1996-slot ${classicUnlocked ? 'is-earned' : 'is-locked'}" title="Classic Trainer 1996 Heritage Emblem">
            <svg viewBox="0 0 40 40" width="28" height="28" aria-hidden="true">
              <circle cx="20" cy="20" r="17" fill="${classicUnlocked ? '#FFCB05' : '#94A3B8'}" stroke="#3B4CCA" stroke-width="3"/>
              <path d="M5 20 A15 15 0 0 1 35 20 Z" fill="${classicUnlocked ? '#E3350D' : '#CBD5E1'}"/>
              <circle cx="20" cy="20" r="5" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
            </svg>
            <span class="badge-slot-label" style="text-align:left;">Classic<br/>1996</span>
          </div>
        </div>
      </div>
    `;

    const buddyStage = leftRailEl.querySelector('#left-rail-buddy-stage');
    if (buddyStage && vfx?.renderPokemonVisual) {
      const visual = vfx.renderPokemonVisual(buddy, {
        shiny: isShiny,
        size: 78,
        accessories: profile?.equippedAccessories || [],
        animate: true
      });
      buddyStage.appendChild(visual);
    }
  }

  function renderMobileNav() {
    if (!mobileNavEl) return;
    const prevBadge = typeof document !== 'undefined' ? document.getElementById('mobile-hint-badge') : null;
    const badgeVal = prevBadge ? prevBadge.textContent : '0';
    const badgeHidden = prevBadge ? prevBadge.hidden : true;
    const badgePulsing = prevBadge ? prevBadge.classList.contains('is-pulsing') : false;

    mobileNavEl.innerHTML = `
      <button type="button" class="mobile-nav-btn ${openDrawerSide === 'left' ? 'is-active' : ''}" data-drawer-toggle="left" aria-expanded="${openDrawerSide === 'left'}">
        <span aria-hidden="true">🗺️</span>
        <span>Map &amp; Buddy</span>
      </button>
      <button type="button" class="mobile-nav-btn ${openDrawerSide === null ? 'is-active' : ''}" data-drawer-toggle="stage">
        <span aria-hidden="true">🎮</span>
        <span>Adventure Stage</span>
      </button>
      <button type="button" class="mobile-nav-btn ${openDrawerSide === 'right' ? 'is-active' : ''}" data-drawer-toggle="right" aria-expanded="${openDrawerSide === 'right'}">
        <span id="mobile-hint-badge" class="${badgePulsing ? 'is-pulsing' : ''}" ${badgeHidden ? 'hidden' : ''}>${escapeHtml(badgeVal)}</span>
        <span aria-hidden="true">📱</span>
        <span>Rotom-Dex</span>
      </button>
    `;
  }

  function openDrawer(side) {
    const rotomEl = getRotomDrawerEl();
    if (side === 'left') {
      openDrawerSide = 'left';
      leftRailEl?.classList.add('is-open');
      rotomEl?.classList.remove('is-open');
      backdropEl?.classList.add('is-visible');
    } else if (side === 'right') {
      openDrawerSide = 'right';
      rotomEl?.classList.add('is-open');
      leftRailEl?.classList.remove('is-open');
      backdropEl?.classList.add('is-visible');
    } else {
      closeDrawers();
      return;
    }
    renderMobileNav();
  }

  function closeDrawers() {
    openDrawerSide = null;
    leftRailEl?.classList.remove('is-open');
    getRotomDrawerEl()?.classList.remove('is-open');
    backdropEl?.classList.remove('is-visible');
    renderMobileNav();
  }

  function closeModal() {
    activeModal = null;
    confirmDeleteProfileId = null;
    if (modalRootEl) modalRootEl.innerHTML = '';
  }

  function openProfileModal() {
    if (!modalRootEl) return;
    activeModal = 'profile';
    confirmDeleteProfileId = null;

    const rootState = stateStore?.getState ? stateStore.getState() : latestRootState;
    const profiles = Array.isArray(rootState?.profiles) ? rootState.profiles : [];
    const activeId = rootState?.activeProfileId;
    const vaultName = stateStore?.VAULT_COOKIE_NAME || 'krunked-cookie-vault-v1';
    const vaultStats = readCookieVaultStats(vaultName);

    modalRootEl.innerHTML = `
      <div class="pokenav-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
        <div class="modal-header">
          <h2 id="profile-modal-title" class="modal-title">Trainer Profiles &amp; Cookie Vault</h2>
          <button type="button" class="modal-close-btn" data-modal-close="true" aria-label="Close modal">×</button>
        </div>

        <div class="vault-badge ${vaultStats.synced ? '' : 'is-warn'}">
          <span>
            🛡️ <strong>${escapeHtml(vaultName)}</strong>:
            <span class="tabular-nums">${vaultStats.synced ? `Vault Synced (${vaultStats.bytes} / 3,600 B Safe)` : 'Ready to Sync'}</span>
          </span>
          <button type="button" class="btn-3d btn-sm btn-secondary" data-profile-action="sync-vault">Sync Vault</button>
        </div>

        <div class="modal-section">
          <h3 class="section-heading">Switch Trainer (${profiles.length})</h3>
          <div class="profile-list">
            ${profiles.length === 0 ? '<p style="margin:0;color:var(--text-secondary);font-size:0.86rem;">No profiles yet. Create your first Trainer below!</p>' : profiles.map((p) => {
              const isAct = p.id === activeId;
              const caughtCnt = Object.keys(p.caught || {}).length;
              const buddyName = pokemonData?.getPokemonById?.(p.activeBuddyId)?.name || p.activeBuddyId;
              return `
                <div class="profile-row ${isAct ? 'is-active' : ''}">
                  <div style="display:flex;align-items:center;gap:10px;min-width:0;">
                    <span class="trainer-avatar-dot" style="width:22px;height:22px;background:${escapeHtml(p.avatarColor || '#E3350D')};"></span>
                    <div style="min-width:0;">
                      <div style="font-weight:900;">${escapeHtml(p.name)} ${isAct ? '<span class="tier-chip">Active</span>' : ''}</div>
                      <div class="tabular-nums" style="font-size:0.74rem;color:var(--text-secondary);">
                        ${escapeHtml(p.tier)} • Buddy: ${escapeHtml(buddyName)} • ${caughtCnt} caught • ${p.totalSolved || 0} solved
                      </div>
                    </div>
                  </div>
                  <div style="display:flex;gap:6px;flex-shrink:0;">
                    ${!isAct ? `<button type="button" class="btn-3d btn-sm btn-indigo" data-profile-switch="${escapeHtml(p.id)}">Switch</button>` : ''}
                    ${profiles.length > 1 ? `<button type="button" class="btn-3d btn-sm btn-secondary" data-profile-delete="${escapeHtml(p.id)}">${confirmDeleteProfileId === p.id ? 'Confirm?' : 'Delete'}</button>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <form id="create-profile-form" class="modal-section">
          <h3 class="section-heading">Create New Trainer</h3>
          <div class="form-grid">
            <label style="display:flex;flex-direction:column;gap:4px;font-size:0.82rem;font-weight:800;">
              Trainer Name
              <input type="text" name="name" class="pokenav-input" placeholder="e.g. Ash or Misty" maxlength="24" required />
            </label>
            <label style="display:flex;flex-direction:column;gap:4px;font-size:0.82rem;font-weight:800;">
              Grade Tier
              <select name="tier" class="pokenav-select">
                ${TIER_META.map((t) => `<option value="${t.id}">${escapeHtml(t.label)}</option>`).join('')}
              </select>
            </label>
            <label style="display:flex;flex-direction:column;gap:4px;font-size:0.82rem;font-weight:800;">
              Kanto Starter
              <select name="starterId" class="pokenav-select">
                <option value="pikachu">Pikachu (Electric)</option>
                <option value="bulbasaur">Bulbasaur (Grass)</option>
                <option value="charmander">Charmander (Fire)</option>
                <option value="squirtle">Squirtle (Water)</option>
              </select>
            </label>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
            <div class="swatch-row" role="radiogroup" aria-label="Avatar color">
              ${AVATAR_SWATCHES.map((hex, i) => `
                <button type="button" class="swatch-btn ${i === 0 ? 'is-selected' : ''}" data-avatar-swatch="${hex}" style="background:${hex};" aria-label="Select color ${hex}"></button>
              `).join('')}
              <input type="hidden" name="avatarColor" value="${AVATAR_SWATCHES[0]}" />
            </div>
            <button type="submit" class="btn-3d btn-primary">+ Create Trainer</button>
          </div>
        </form>

        <div class="modal-section">
          <h3 class="section-heading">Backup, Export &amp; Import Save</h3>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            <button type="button" class="btn-3d btn-sm btn-secondary" data-profile-action="export-json">⬇ Export JSON</button>
            <button type="button" class="btn-3d btn-sm btn-gold" data-profile-action="copy-code">📋 Copy PM1 Save Code</button>
            <button type="button" class="btn-3d btn-sm btn-indigo" data-profile-action="test-vault-heal">🛡️ Verify Vault Auto-Heal (Clear Cache &amp; Reload)</button>
          </div>
          <label style="display:flex;flex-direction:column;gap:4px;font-size:0.78rem;font-weight:800;">
            Current Save Code / Paste Import (JSON or PM1...)
            <textarea id="save-code-io" class="pokenav-textarea" rows="3" placeholder="Paste JSON or PM1... save code here to restore"></textarea>
          </label>
          <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;">
            <input type="file" id="import-json-file" accept=".json,.txt" style="font-size:0.78rem;" />
            <button type="button" class="btn-3d btn-sm btn-success" data-profile-action="import-raw">Restore Save</button>
          </div>
        </div>
      </div>
    `;
  }

  function openParentModal() {
    if (!modalRootEl) return;
    activeModal = 'parent';
    const rootState = stateStore?.getState ? stateStore.getState() : latestRootState;
    const profile = getActiveProfileFrom(rootState);
    if (!profile) {
      showToast('Create a Trainer profile first!', 'warning');
      return;
    }

    const cf = profile.customFilter || { enabled: false, operations: OPERATION_LABELS.map((o) => o.id), maxNumber: null };
    const selectedOps = new Set(Array.isArray(cf.operations) ? cf.operations : []);
    const settings = profile.settings || {};

    modalRootEl.innerHTML = `
      <form id="parent-filter-form" class="pokenav-modal" role="dialog" aria-modal="true" aria-labelledby="parent-modal-title">
        <div class="modal-header">
          <h2 id="parent-modal-title" class="modal-title">Grade Tier &amp; Parent/Coach Filter</h2>
          <button type="button" class="modal-close-btn" data-modal-close="true" aria-label="Close modal">×</button>
        </div>

        <div class="modal-section">
          <h3 class="section-heading">Curriculum Grade Tier</h3>
          <div class="filter-op-grid">
            ${TIER_META.map((t) => `
              <label class="op-check-pill">
                <input type="radio" name="tier" value="${t.id}" ${profile.tier === t.id ? 'checked' : ''} />
                <span>${escapeHtml(t.label)}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="modal-section">
          <div class="section-heading">
            <span>Custom Operation Lock</span>
            <label style="display:inline-flex;align-items:center;gap:6px;font-size:0.82rem;cursor:pointer;">
              <input type="checkbox" name="customEnabled" ${cf.enabled ? 'checked' : ''} />
              <span>Enable Lock</span>
            </label>
          </div>
          <div class="filter-op-grid">
            ${OPERATION_LABELS.map((op) => `
              <label class="op-check-pill">
                <input type="checkbox" name="operations" value="${op.id}" ${selectedOps.has(op.id) ? 'checked' : ''} />
                <span>${escapeHtml(op.label)}</span>
              </label>
            `).join('')}
          </div>
          <label style="display:flex;flex-direction:column;gap:4px;font-size:0.82rem;font-weight:800;max-width:220px;">
            Max Number Cap (optional)
            <input type="number" name="maxNumber" class="pokenav-input tabular-nums" min="5" max="9999" placeholder="Tier default" value="${cf.maxNumber ?? ''}" />
          </label>
        </div>

        <div class="modal-section">
          <h3 class="section-heading">Play Pace &amp; Accessibility</h3>
          <div class="filter-op-grid">
            <label class="op-check-pill">
              <input type="checkbox" name="speedBlitz" ${settings.speedBlitz ? 'checked' : ''} />
              <span>⚡ Speed Blitz Timer</span>
            </label>
            <label class="op-check-pill">
              <input type="checkbox" name="reducedMotion" ${settings.reducedMotion ? 'checked' : ''} />
              <span>🌿 Reduced Motion</span>
            </label>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:10px;">
          <button type="button" class="btn-3d btn-secondary" data-modal-close="true">Cancel</button>
          <button type="submit" class="btn-3d btn-primary">Save Settings</button>
        </div>
      </form>
    `;
  }

  function render(rootState, routeIdOverride = null) {
    latestRootState = rootState || (stateStore?.getState ? stateStore.getState() : latestRootState);
    if (routeIdOverride) {
      selectedRouteId = routeIdOverride;
    }
    const profile = getActiveProfileFrom(latestRootState);
    if (profile && profile.routeProgress && !profile.routeProgress[selectedRouteId]?.unlocked) {
      selectedRouteId = 'route-1';
    }
    syncReducedMotionAttr(profile);
    renderRibbon(profile);
    renderLeftRail(profile);
    renderMobileNav();
    if (!shownAutoHealToast && stateStore?.getLastHealSource?.() === 'cookie-vault') {
      shownAutoHealToast = true;
      showToast('🛡️ Trainer progress auto-healed from krunked-cookie-vault-v1!', 'success');
    }
  }

  function setInstallAvailable(handler) {
    installHandler = typeof handler === 'function' ? handler : null;
    if (installHandler) installDismissed = false;
    renderRibbon(getActiveProfileFrom(latestRootState));
  }

  // Event Wiring
  if (ribbonEl) {
    ribbonEl.addEventListener('click', (event) => {
      const btn = event.target?.closest?.('button');
      if (!btn) return;

      if (btn.id === 'install-pwa-btn' && installHandler) {
        audio?.playClick?.('confirm');
        installHandler();
        return;
      }

      if (btn.dataset.installDismiss) {
        installDismissed = true;
        renderRibbon(getActiveProfileFrom(latestRootState));
        return;
      }

      const action = btn.dataset.shellAction;
      if (action === 'open-profile') {
        audio?.playClick?.('tap');
        openProfileModal();
      } else if (action === 'open-parent') {
        audio?.playClick?.('tap');
        openParentModal();
      } else if (action === 'go-home') {
        audio?.playClick?.('tap');
        closeDrawers();
        onNavigate?.('battle', { routeId: selectedRouteId });
      } else if (action === 'go-camp') {
        audio?.playClick?.('tap');
        closeDrawers();
        onNavigate?.('camp', { tab: 'camp' });
      } else if (action === 'go-pokedex') {
        audio?.playClick?.('tap');
        closeDrawers();
        onNavigate?.('camp', { tab: 'pokedex' });
      }

      const settingKey = btn.dataset.settingToggle;
      if (settingKey && stateStore?.updateProfile) {
        const updated = stateStore.updateProfile((draft) => {
          draft.settings[settingKey] = !draft.settings[settingKey];
        });
        if (updated) {
          audio?.setAudioSettings?.(updated.settings);
          if (settingKey === 'ambient') {
            audio?.toggleAmbientMusic?.(updated.settings.ambient);
          }
          audio?.playClick?.('toggle');
          render(stateStore.getState());
        }
      }
    });
  }

  if (leftRailEl) {
    leftRailEl.addEventListener('click', (event) => {
      if (event.target?.closest?.('#left-rail-buddy-stage')) {
        audio?.playClick?.('tap');
        closeDrawers();
        onNavigate?.('camp', { tab: 'camp' });
        return;
      }

      const btn = event.target?.closest?.('button');
      if (!btn) return;

      if (btn.dataset.shellAction === 'go-evolution') {
        audio?.playClick?.('confirm');
        closeDrawers();
        onNavigate?.('evolution-forge');
        return;
      }

      if (btn.dataset.routeSelect) {
        const routeId = btn.dataset.routeSelect;
        selectedRouteId = routeId;
        audio?.playClick?.('tap');
        closeDrawers();
        renderLeftRail(getActiveProfileFrom(latestRootState));
        onSelectRoute?.(routeId);
        return;
      }

      if (btn.dataset.gymRoute) {
        const routeId = btn.dataset.gymRoute;
        selectedRouteId = routeId;
        audio?.playClick?.('confirm');
        closeDrawers();
        onNavigate?.('gym', { routeId });
      }
    });
  }

  if (mobileNavEl) {
    mobileNavEl.addEventListener('click', (event) => {
      const btn = event.target?.closest?.('[data-drawer-toggle]');
      if (!btn) return;
      const target = btn.dataset.drawerToggle;
      audio?.playClick?.('tap');
      if (target === 'stage') {
        closeDrawers();
      } else if (openDrawerSide === target) {
        closeDrawers();
      } else {
        openDrawer(target);
      }
    });
  }

  if (backdropEl) {
    backdropEl.addEventListener('click', () => {
      closeDrawers();
    });
  }

  if (modalRootEl) {
    modalRootEl.addEventListener('click', (event) => {
      if (event.target === modalRootEl) {
        closeModal();
        return;
      }

      const closeBtn = event.target?.closest?.('[data-modal-close]');
      if (closeBtn) {
        audio?.playClick?.('close');
        closeModal();
        return;
      }

      const swatchBtn = event.target?.closest?.('[data-avatar-swatch]');
      if (swatchBtn) {
        const form = modalRootEl.querySelector('#create-profile-form');
        if (form) {
          form.querySelectorAll('[data-avatar-swatch]').forEach((el) => el.classList.remove('is-selected'));
          swatchBtn.classList.add('is-selected');
          const hidden = form.querySelector('input[name="avatarColor"]');
          if (hidden) hidden.value = swatchBtn.dataset.avatarSwatch;
        }
        return;
      }

      const switchBtn = event.target?.closest?.('[data-profile-switch]');
      if (switchBtn && stateStore?.switchProfile) {
        const id = switchBtn.dataset.profileSwitch;
        stateStore.switchProfile(id);
        audio?.playClick?.('confirm');
        closeModal();
        const nextState = stateStore.getState();
        render(nextState);
        onProfileChanged?.(getActiveProfileFrom(nextState), nextState);
        showToast('Switched Trainer profile!', 'success');
        return;
      }

      const deleteBtn = event.target?.closest?.('[data-profile-delete]');
      if (deleteBtn && stateStore?.deleteProfile) {
        const id = deleteBtn.dataset.profileDelete;
        if (confirmDeleteProfileId !== id) {
          confirmDeleteProfileId = id;
          openProfileModal();
          return;
        }
        stateStore.deleteProfile(id);
        confirmDeleteProfileId = null;
        audio?.playClick?.('back');
        openProfileModal();
        const nextState = stateStore.getState();
        render(nextState);
        onProfileChanged?.(getActiveProfileFrom(nextState), nextState);
        showToast('Trainer profile removed.', 'info');
        return;
      }

      const actionBtn = event.target?.closest?.('[data-profile-action]');
      if (actionBtn) {
        const action = actionBtn.dataset.profileAction;
        if (action === 'sync-vault') {
          const ok = stateStore?.syncCookieVault?.();
          openProfileModal();
          showToast(ok ? 'Cookie Vault synced!' : 'Vault saved in memory.', ok ? 'success' : 'info');
        } else if (action === 'export-json' && stateStore?.exportSaveJSON) {
          const json = stateStore.exportSaveJSON();
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `pokemath-save-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          showToast('Exported PokéMath JSON backup!', 'success');
        } else if (action === 'copy-code' && stateStore?.exportSaveCode) {
          const code = stateStore.exportSaveCode();
          const textarea = modalRootEl.querySelector('#save-code-io');
          if (textarea) textarea.value = code;
          if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(code).then(
              () => showToast('Copied PM1 save code to clipboard!', 'success'),
              () => showToast('Save code ready in box below!', 'info')
            );
          } else {
            showToast('Save code ready in box below!', 'info');
          }
        } else if (action === 'import-raw' && stateStore?.importSaveJSON) {
          const raw = modalRootEl.querySelector('#save-code-io')?.value || '';
          const res = stateStore.importSaveJSON(raw);
          if (res.ok) {
            audio?.playClick?.('confirm');
            closeModal();
            const nextState = stateStore.getState();
            render(nextState);
            onProfileChanged?.(getActiveProfileFrom(nextState), nextState);
            showToast(`Restored ${res.profileCount} trainer profile(s)!`, 'success');
          } else {
            showToast(res.error || 'Invalid save data.', 'error');
          }
        } else if (action === 'test-vault-heal') {
          stateStore?.syncCookieVault?.();
          if (typeof window !== 'undefined') {
            try {
              window.localStorage?.clear?.();
            } catch {
              // Ignore storage access errors in restricted frames
            }
          }
          showToast('Local cache cleared — reloading to heal from krunked-cookie-vault-v1...', 'info');
          if (typeof window !== 'undefined') {
            window.location?.reload?.();
          }
        }
      }
    });

    modalRootEl.addEventListener('change', (event) => {
      if (event.target?.id === 'import-json-file') {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const box = modalRootEl.querySelector('#save-code-io');
          if (box && typeof reader.result === 'string') {
            box.value = reader.result;
          }
        };
        reader.readAsText(file);
      }
    });

    modalRootEl.addEventListener('submit', (event) => {
      event.preventDefault();
      if (event.target?.id === 'create-profile-form' && stateStore?.createProfile) {
        const fd = new FormData(event.target);
        const name = String(fd.get('name') || '').trim();
        if (!name) return;
        const tier = String(fd.get('tier') || 'starter');
        const starterId = String(fd.get('starterId') || 'pikachu');
        const avatarColor = String(fd.get('avatarColor') || '#E3350D');
        stateStore.createProfile({ name, tier, starterId, avatarColor });
        audio?.playClick?.('confirm');
        closeModal();
        const nextState = stateStore.getState();
        render(nextState);
        onProfileChanged?.(getActiveProfileFrom(nextState), nextState);
        showToast(`Welcome, Trainer ${name}!`, 'success');
        return;
      }

      if (event.target?.id === 'parent-filter-form' && stateStore?.updateProfile) {
        const fd = new FormData(event.target);
        const tier = String(fd.get('tier') || 'starter');
        const customEnabled = fd.get('customEnabled') === 'on';
        const ops = fd.getAll('operations').map(String);
        const maxNumRaw = String(fd.get('maxNumber') || '').trim();
        const maxNumber = maxNumRaw && Number.isFinite(Number(maxNumRaw)) && Number(maxNumRaw) > 0
          ? Math.floor(Number(maxNumRaw))
          : null;
        const speedBlitz = fd.get('speedBlitz') === 'on';
        const reducedMotion = fd.get('reducedMotion') === 'on';

        const updated = stateStore.updateProfile((draft) => {
          draft.tier = tier;
          draft.customFilter = {
            enabled: customEnabled,
            operations: ops.length > 0 ? ops : OPERATION_LABELS.map((o) => o.id),
            maxNumber
          };
          draft.settings.speedBlitz = speedBlitz;
          draft.settings.reducedMotion = reducedMotion;
        });

        audio?.playClick?.('confirm');
        closeModal();
        const nextState = stateStore.getState();
        render(nextState);
        onFilterChange?.(updated, nextState);
        showToast('Coach & accessibility settings saved!', 'success');
      }
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (activeModal) {
          closeModal();
        } else if (openDrawerSide) {
          closeDrawers();
        }
      }
    });
  }

  return {
    render,
    openProfileModal,
    openParentModal,
    openDrawer,
    closeDrawers,
    showToast,
    setInstallAvailable
  };
}
