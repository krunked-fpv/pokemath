/**
 * PokéMath Visual Effects, Chibi Elemental Fallback Sprites & Biome Backdrops
 */

import { ACCESSORIES } from '../data/items.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const ACCESSORY_BY_ID = Object.fromEntries(ACCESSORIES.map((a) => [a.id, a]));

const TYPE_COLORS = {
  grass: { main: '#38B000', glow: '#86EFAC' },
  poison: { main: '#9333EA', glow: '#D8B4FE' },
  fire: { main: '#F97316', glow: '#FDE047' },
  flying: { main: '#60A5FA', glow: '#E0F2FE' },
  water: { main: '#0284C7', glow: '#7DD3FC' },
  bug: { main: '#84CC16', glow: '#D9F99D' },
  electric: { main: '#EAB308', glow: '#FEF08A' },
  fairy: { main: '#EC4899', glow: '#FBCFE8' },
  fighting: { main: '#DC2626', glow: '#FCA5A5' },
  psychic: { main: '#DB2777', glow: '#F9A8D4' },
  rock: { main: '#A16207', glow: '#FDE68A' },
  ground: { main: '#CA8A04', glow: '#FEF08A' },
  steel: { main: '#64748B', glow: '#CBD5E1' },
  ghost: { main: '#6D28D9', glow: '#C4B5FD' },
  ice: { main: '#06B6D4', glow: '#A5F3FC' },
  normal: { main: '#78716C', glow: '#E7E5E4' },
  dark: { main: '#334155', glow: '#94A3B8' },
  dragon: { main: '#4F46E5', glow: '#A5B4FC' }
};

const BIOME_CONFIGS = {
  meadow: {
    sky: '#BAE6FD',
    farHill: '#86EFAC',
    nearHill: '#4ADE80',
    particleColors: ['#FEF08A', '#F9A8D4', '#FFFFFF', '#BBF7D0'],
    accentSvg: `
      <circle cx="90" cy="46" r="22" fill="#FEF08A" opacity="0.9"/>
      <path d="M0 130 Q140 82 280 120 T560 112 T800 125 L800 200 L0 200 Z" fill="#86EFAC"/>
      <path d="M0 148 Q190 105 400 145 T800 138 L800 200 L0 200 Z" fill="#4ADE80"/>
      <circle cx="140" cy="158" r="5" fill="#FFCB05"/>
      <circle cx="290" cy="166" r="4" fill="#FB7185"/>
      <circle cx="520" cy="156" r="5" fill="#FFFFFF"/>
      <circle cx="670" cy="164" r="4" fill="#FFCB05"/>
    `
  },
  cavern: {
    sky: '#312E81',
    farHill: '#4338CA',
    nearHill: '#57534E',
    particleColors: ['#C4B5FD', '#67E8F9', '#FDE047'],
    accentSvg: `
      <polygon points="80,200 115,92 152,200" fill="#4338CA" opacity="0.65"/>
      <polygon points="220,200 262,74 306,200" fill="#6366F1" opacity="0.55"/>
      <polygon points="560,200 605,86 655,200" fill="#4338CA" opacity="0.65"/>
      <polygon points="150,0 172,58 194,0" fill="#818CF8" opacity="0.5"/>
      <polygon points="480,0 500,48 520,0" fill="#38BDF8" opacity="0.45"/>
      <path d="M0 155 Q200 132 420 156 T800 148 L800 200 L0 200 Z" fill="#57534E"/>
    `
  },
  harbor: {
    sky: '#7DD3FC',
    farHill: '#38BDF8',
    nearHill: '#0284C7',
    particleColors: ['#FFFFFF', '#E0F2FE', '#BAE6FD'],
    accentSvg: `
      <circle cx="640" cy="48" r="24" fill="#FEF9C3" opacity="0.92"/>
      <rect x="112" y="64" width="22" height="72" rx="4" fill="#FFFFFF" stroke="#E3350D" stroke-width="3"/>
      <polygon points="108,64 123,46 138,64" fill="#E3350D"/>
      <polygon points="134,56 320,24 320,90" fill="#FEF08A" opacity="0.28"/>
      <path d="M0 136 Q100 118 200 136 T400 136 T600 136 T800 136 L800 200 L0 200 Z" fill="#0EA5E9"/>
      <path d="M0 156 Q120 142 240 156 T480 156 T720 156 T800 156 L800 200 L0 200 Z" fill="#0284C7"/>
    `
  },
  ridge: {
    sky: '#FEF08A',
    farHill: '#A8A29E',
    nearHill: '#78716C',
    particleColors: ['#FFCB05', '#FEF08A', '#38BDF8'],
    accentSvg: `
      <polygon points="0,200 140,86 280,200" fill="#A8A29E"/>
      <polygon points="210,200 390,62 560,200" fill="#78716C"/>
      <polygon points="480,200 660,78 800,190 800,200" fill="#57534E"/>
      <polyline points="370,18 350,52 380,52 356,92" fill="none" stroke="#F59E0B" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="620,26 604,54 628,54 610,82" fill="none" stroke="#EAB308" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    `
  },
  rapids: {
    sky: '#A5F3FC',
    farHill: '#22D3EE',
    nearHill: '#0284C7',
    particleColors: ['#FFFFFF', '#CFFAFE', '#A5F3FC'],
    accentSvg: `
      <path d="M0 124 Q180 90 360 126 T800 118 L800 200 L0 200 Z" fill="#22D3EE" opacity="0.6"/>
      <rect x="330" y="64" width="120" height="136" rx="18" fill="#E0F2FE" opacity="0.55"/>
      <path d="M352 72 Q360 130 348 188 M388 68 Q396 128 386 188 M424 72 Q430 130 420 188" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
      <path d="M0 155 Q160 135 320 155 T640 155 T800 155 L800 200 L0 200 Z" fill="#0284C7"/>
    `
  },
  summit: {
    sky: '#1E1B4B',
    farHill: '#4C1D95',
    nearHill: '#7C3AED',
    particleColors: ['#FFCB05', '#FEF9C3', '#E9D5FF', '#F472B6'],
    accentSvg: `
      <circle cx="120" cy="40" r="2.5" fill="#FEF9C3"/>
      <circle cx="240" cy="28" r="3" fill="#FFCB05"/>
      <circle cx="460" cy="36" r="2.5" fill="#FFFFFF"/>
      <circle cx="680" cy="44" r="3" fill="#FEF08A"/>
      <path d="M40 70 Q280 18 520 62 T780 34" fill="none" stroke="#FDE047" stroke-width="10" stroke-linecap="round" opacity="0.22"/>
      <polygon points="0,200 180,84 360,200" fill="#4C1D95"/>
      <polygon points="240,200 440,56 640,200" fill="#5B21B6"/>
      <polygon points="480,200 660,92 800,190 800,200" fill="#3B0764"/>
      <polygon points="440,56 404,96 438,88 456,102 476,96" fill="#FFFFFF" opacity="0.88"/>
    `
  }
};

function isReducedMotionPreferred() {
  if (typeof document !== 'undefined' && document.documentElement?.dataset?.reducedMotion === 'true') {
    return true;
  }
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildChibiShapeDetails(emblemShape, palette) {
  const { primary, secondary, accent, eye } = palette;
  switch (emblemShape) {
    case 'leaf':
      return `
        <path d="M60 14 C72 14, 82 24, 76 35 C65 36, 56 26, 60 14 Z" fill="${accent}" stroke="#1E293B" stroke-width="2.5"/>
        <path d="M60 14 C48 16, 40 26, 46 35 C55 36, 62 27, 60 14 Z" fill="${secondary}" stroke="#1E293B" stroke-width="2.5"/>
        <circle cx="34" cy="40" r="10" fill="${primary}" stroke="#1E293B" stroke-width="2.5"/>
        <circle cx="86" cy="40" r="10" fill="${primary}" stroke="#1E293B" stroke-width="2.5"/>
      `;
    case 'flame':
      return `
        <path d="M60 10 C68 20, 74 28, 68 38 C64 33, 56 33, 52 38 C46 28, 52 18, 60 10 Z" fill="${secondary}" stroke="${accent}" stroke-width="2.5"/>
        <polygon points="34,42 42,24 52,36" fill="${primary}" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
        <polygon points="86,42 78,24 68,36" fill="${primary}" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
      `;
    case 'droplet':
      return `
        <path d="M60 12 C68 23, 72 30, 60 36 C48 30, 52 23, 60 12 Z" fill="${secondary}" stroke="${accent}" stroke-width="2.5"/>
        <path d="M28 50 Q20 34 36 36 Z" fill="${secondary}" stroke="#1E293B" stroke-width="2.5"/>
        <path d="M92 50 Q100 34 84 36 Z" fill="${secondary}" stroke="#1E293B" stroke-width="2.5"/>
      `;
    case 'bolt':
      return `
        <polygon points="32,42 22,16 46,32" fill="${primary}" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
        <polygon points="22,16 32,23 27,27" fill="${accent}"/>
        <polygon points="88,42 98,16 74,32" fill="${primary}" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
        <polygon points="98,16 88,23 93,27" fill="${accent}"/>
        <polygon points="62,16 54,28 62,28 57,38 69,24 61,24" fill="${secondary}" stroke="${accent}" stroke-width="1.5"/>
      `;
    case 'wing':
      return `
        <path d="M28 56 Q10 34 26 28 Q36 34 40 46 Z" fill="${secondary}" stroke="#1E293B" stroke-width="2.5"/>
        <path d="M92 56 Q110 34 94 28 Q84 34 80 46 Z" fill="${secondary}" stroke="#1E293B" stroke-width="2.5"/>
        <circle cx="60" cy="24" r="6" fill="${accent}"/>
      `;
    case 'shield':
      return `
        <path d="M36 28 L60 16 L84 28 L80 42 L40 42 Z" fill="${secondary}" stroke="${accent}" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="60" cy="28" r="5" fill="${eye}"/>
      `;
    case 'gem':
      return `
        <polygon points="60,12 72,26 60,38 48,26" fill="${secondary}" stroke="${accent}" stroke-width="2.5"/>
        <polygon points="32,42 40,26 50,36" fill="${accent}" stroke="#1E293B" stroke-width="2"/>
        <polygon points="88,42 80,26 70,36" fill="${accent}" stroke="#1E293B" stroke-width="2"/>
      `;
    case 'crescent':
      return `
        <path d="M52 14 A14 14 0 1 0 72 30 A10 10 0 1 1 52 14 Z" fill="${secondary}" stroke="${accent}" stroke-width="2"/>
        <ellipse cx="36" cy="34" rx="7" ry="14" transform="rotate(-18 36 34)" fill="${primary}" stroke="#1E293B" stroke-width="2.5"/>
        <ellipse cx="84" cy="34" rx="7" ry="14" transform="rotate(18 84 34)" fill="${primary}" stroke="#1E293B" stroke-width="2.5"/>
      `;
    case 'paw':
      return `
        <ellipse cx="36" cy="34" rx="9" ry="15" transform="rotate(-22 36 34)" fill="${primary}" stroke="#1E293B" stroke-width="2.5"/>
        <ellipse cx="84" cy="34" rx="9" ry="15" transform="rotate(22 84 34)" fill="${primary}" stroke="#1E293B" stroke-width="2.5"/>
        <circle cx="60" cy="25" r="5" fill="${secondary}"/>
      `;
    case 'star':
    default:
      return `
        <polygon points="60,10 65,22 78,23 68,31 71,44 60,37 49,44 52,31 42,23 55,22" fill="${secondary}" stroke="${accent}" stroke-width="2" stroke-linejoin="round"/>
      `;
  }
}

function buildFallbackSvgElement(pokemon, size) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'pkmn-fallback-svg');
  svg.setAttribute('viewBox', '0 0 120 120');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-hidden', 'true');

  const palette = {
    primary: pokemon?.fallbackPalette?.primary || '#FFCB05',
    secondary: pokemon?.fallbackPalette?.secondary || '#FFFFFF',
    accent: pokemon?.fallbackPalette?.accent || '#E3350D',
    eye: pokemon?.fallbackPalette?.eye || '#1E293B'
  };
  const shape = pokemon?.emblemShape || 'star';
  const details = buildChibiShapeDetails(shape, palette);

  svg.innerHTML = `
    <circle cx="60" cy="64" r="46" fill="${escapeHtml(palette.secondary)}" opacity="0.32"/>
    <circle cx="60" cy="64" r="40" fill="none" stroke="${escapeHtml(palette.accent)}" stroke-width="2.5" stroke-dasharray="6 5" opacity="0.65"/>
    ${details}
    <ellipse cx="60" cy="68" rx="31" ry="28" fill="${escapeHtml(palette.primary)}" stroke="#1E293B" stroke-width="3"/>
    <ellipse cx="60" cy="78" rx="19" ry="13" fill="${escapeHtml(palette.secondary)}" opacity="0.72"/>
    <circle cx="46" cy="63" r="5.5" fill="${escapeHtml(palette.eye)}"/>
    <circle cx="74" cy="63" r="5.5" fill="${escapeHtml(palette.eye)}"/>
    <circle cx="47.5" cy="61" r="2" fill="#FFFFFF"/>
    <circle cx="75.5" cy="61" r="2" fill="#FFFFFF"/>
    <circle cx="38" cy="71" r="4.5" fill="#FB7185" opacity="0.65"/>
    <circle cx="82" cy="71" r="4.5" fill="#FB7185" opacity="0.65"/>
    <path d="M53 73 Q60 80 67 73" fill="none" stroke="#1E293B" stroke-width="2.8" stroke-linecap="round"/>
  `;
  return svg;
}

function buildShinyStarsLayer() {
  const layer = document.createElement('div');
  layer.className = 'pkmn-shiny-stars';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 1; i <= 3; i += 1) {
    const star = document.createElementNS(SVG_NS, 'svg');
    star.setAttribute('class', `pkmn-shiny-star star-${i}`);
    star.setAttribute('viewBox', '0 0 24 24');
    star.innerHTML = `<path d="M12 2 L14.6 9.4 L22 12 L14.6 14.6 L12 22 L9.4 14.6 L2 12 L9.4 9.4 Z" fill="#FFCB05" stroke="#B45309" stroke-width="1.5"/>`;
    layer.appendChild(star);
  }
  return layer;
}

/**
 * Renders a resilient Pokémon visual container with official sprite,
 * automatic chibi elemental SVG fallback on error/forceSvg,
 * equipped Camp accessories, and optional Shiny sparkle stars.
 */
export function renderPokemonVisual(pokemon, options = {}) {
  const {
    shiny = false,
    size = 120,
    accessories = [],
    forceSvg = false,
    className = '',
    animate = true
  } = options || {};

  const safeSize = Math.max(24, Math.round(Number(size) || 120));
  const name = pokemon?.name || 'Mystery Buddy';
  const spriteUrl = shiny
    ? (pokemon?.shinySpriteUrl || pokemon?.spriteUrl || '')
    : (pokemon?.spriteUrl || '');
  const useFallback = Boolean(forceSvg || !spriteUrl);

  const wrapper = document.createElement('div');
  const classes = ['pkmn-visual'];
  if (animate) classes.push('is-animated');
  if (shiny) classes.push('is-shiny');
  if (useFallback) classes.push('is-fallback');
  if (className) classes.push(className);
  wrapper.className = classes.join(' ');
  wrapper.style.setProperty('--pkmn-size', `${safeSize}px`);
  wrapper.style.width = `${safeSize}px`;
  wrapper.style.height = `${safeSize}px`;
  if (pokemon?.id) wrapper.dataset.pokemonId = pokemon.id;

  const fallbackSvg = buildFallbackSvgElement(pokemon, safeSize);

  if (!forceSvg && spriteUrl) {
    const img = document.createElement('img');
    img.className = 'pkmn-sprite';
    img.alt = shiny ? `Shiny ${name}` : name;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.width = safeSize;
    img.height = safeSize;

    const activateFallback = () => {
      wrapper.classList.add('is-fallback');
      img.style.display = 'none';
      fallbackSvg.style.display = 'block';
    };

    img.addEventListener('error', activateFallback);
    img.addEventListener('load', () => {
      if (img.naturalWidth === 0) activateFallback();
    });
    img.src = spriteUrl;
    wrapper.appendChild(img);
  } else {
    fallbackSvg.style.display = 'block';
  }

  wrapper.appendChild(fallbackSvg);

  if (Array.isArray(accessories) && accessories.length > 0) {
    const accLayer = document.createElement('div');
    accLayer.className = 'pkmn-accessory-layer';
    accLayer.setAttribute('aria-hidden', 'true');
    for (const accRef of accessories) {
      const acc = typeof accRef === 'string' ? ACCESSORY_BY_ID[accRef] : accRef;
      if (!acc || !acc.svgMarkup) continue;
      const itemEl = document.createElement('span');
      itemEl.className = `pkmn-acc-item pkmn-acc-slot-${acc.slot || 'head'}`;
      itemEl.dataset.accessoryId = acc.id;
      itemEl.title = acc.name || '';
      itemEl.innerHTML = acc.svgMarkup;
      accLayer.appendChild(itemEl);
    }
    if (accLayer.children.length > 0) {
      wrapper.appendChild(accLayer);
    }
  }

  if (shiny) {
    wrapper.appendChild(buildShinyStarsLayer());
  }

  return wrapper;
}

/**
 * Mounts a layered parallax SVG & particle biome backdrop inside `container`.
 */
export function mountBiomeBackdrop(container, biomeKey = 'meadow') {
  if (!container) return null;
  const key = BIOME_CONFIGS[biomeKey] ? biomeKey : 'meadow';
  const cfg = BIOME_CONFIGS[key];

  for (const prev of container.querySelectorAll('.biome-backdrop')) {
    prev.remove();
  }

  const backdrop = document.createElement('div');
  backdrop.className = `biome-backdrop biome-${key}`;
  backdrop.dataset.biome = key;
  backdrop.setAttribute('aria-hidden', 'true');

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'biome-svg-layer');
  svg.setAttribute('viewBox', '0 0 800 200');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.innerHTML = cfg.accentSvg;
  backdrop.appendChild(svg);

  if (!isReducedMotionPreferred()) {
    const particles = document.createElement('div');
    particles.className = 'biome-particles';
    const count = 10;
    for (let i = 0; i < count; i += 1) {
      const p = document.createElement('span');
      p.className = 'biome-particle';
      const size = 6 + ((i * 3) % 8);
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${(i * 11 + 5) % 94}%`;
      p.style.top = `${15 + ((i * 17) % 65)}%`;
      p.style.background = cfg.particleColors[i % cfg.particleColors.length];
      p.style.setProperty('--px', `${(i % 2 === 0 ? 1 : -1) * (10 + (i % 4) * 5)}px`);
      p.style.setProperty('--py', `${-12 - (i % 3) * 6}px`);
      p.style.setProperty('--dur', `${4.5 + (i % 4) * 1.1}s`);
      p.style.setProperty('--delay', `${(i * 0.35).toFixed(2)}s`);
      particles.appendChild(p);
    }
    backdrop.appendChild(particles);
  }

  container.prepend(backdrop);
  return backdrop;
}

/**
 * Plays a short GPU-composited elemental attack burst overlay on `stageEl`.
 */
export function playElementalAttackVFX(stageEl, elementType = 'normal', intensity = 'power') {
  if (!stageEl || typeof document === 'undefined') return;
  const palette = TYPE_COLORS[elementType] || TYPE_COLORS.normal;
  const isCrit = intensity === 'charge' || intensity === 'critical';
  const ringScale = intensity === 'quick' ? 0.85 : isCrit ? 1.25 : 1;

  const burst = document.createElement('div');
  burst.className = `vfx-attack-burst vfx-type-${elementType}`;
  burst.setAttribute('aria-hidden', 'true');
  burst.innerHTML = `
    <svg width="${Math.round(180 * ringScale)}" height="${Math.round(180 * ringScale)}" viewBox="0 0 180 180">
      <circle cx="90" cy="90" r="62" fill="${palette.glow}" opacity="0.32"/>
      <circle cx="90" cy="90" r="44" fill="none" stroke="${palette.main}" stroke-width="8" stroke-dasharray="18 10"/>
      <path d="M90 12 L104 68 L160 54 L112 92 L152 138 L94 114 L62 162 L70 104 L18 92 L72 72 Z"
        fill="${palette.main}" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round" opacity="0.92"/>
    </svg>
  `;

  stageEl.appendChild(burst);
  const timeout = isReducedMotionPreferred() ? 220 : 760;
  setTimeout(() => {
    burst.remove();
  }, timeout);
}

/**
 * Spawns floating damage, XP, coin, or celebration text inside `stageEl`.
 */
export function spawnFloatingText(stageEl, text, variant = 'damage') {
  if (!stageEl || typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.className = `vfx-floating-text vfx-float-${variant} tabular-nums`;
  el.textContent = String(text ?? '');
  el.setAttribute('aria-live', 'polite');
  stageEl.appendChild(el);
  const timeout = isReducedMotionPreferred() ? 600 : 960;
  setTimeout(() => {
    el.remove();
  }, timeout);
}

/**
 * Fires a GPU-composited celebratory confetti burst inside `stageEl`.
 */
export function burstConfetti(stageEl, palette = ['#E3350D', '#FFCB05', '#3B4CCA', '#38B000']) {
  if (!stageEl || typeof document === 'undefined') return;
  const colors = Array.isArray(palette) && palette.length > 0
    ? palette
    : ['#E3350D', '#FFCB05', '#3B4CCA', '#38B000'];

  const layer = document.createElement('div');
  layer.className = 'vfx-confetti-layer';
  layer.setAttribute('aria-hidden', 'true');

  if (isReducedMotionPreferred()) {
    const badge = document.createElement('div');
    badge.className = 'vfx-floating-text vfx-float-crit';
    badge.textContent = '★ Celebrate! ★';
    layer.appendChild(badge);
    stageEl.appendChild(layer);
    setTimeout(() => layer.remove(), 700);
    return;
  }

  const count = 24;
  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement('span');
    piece.className = 'vfx-confetti-piece';
    const angle = (Math.PI * 2 * i) / count + (i % 3) * 0.14;
    const dist = 70 + (i % 5) * 32;
    const tx = Math.round(Math.cos(angle) * dist);
    const ty = Math.round(Math.sin(angle) * dist + 45);
    const rot = `${(i % 2 === 0 ? 1 : -1) * (240 + i * 24)}deg`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty('--tx', `${tx}px`);
    piece.style.setProperty('--ty', `${ty}px`);
    piece.style.setProperty('--rot', rot);
    piece.style.setProperty('--delay', `${(i % 4) * 0.04}s`);
    layer.appendChild(piece);
  }

  stageEl.appendChild(layer);
  setTimeout(() => {
    layer.remove();
  }, 1550);
}
