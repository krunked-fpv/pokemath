/**
 * PokéMath Items, Berries, Poké Balls, Buddy Accessories, Poké-Mart & Mini-Quests.
 */

export const COIN_DENOMINATIONS = [1, 5, 10, 25, 100];

export const BERRIES = [
  {
    id: 'oran',
    name: 'Oran Berry',
    flavor: 'sweet',
    color: '#3B82F6',
    accentColor: '#93C5FD',
    xpBoost: 15,
    healHp: 20,
    catchBoost: 0.1,
    evolutionBoost: 10,
    rarity: 'common',
    costCoins: 1,
    description: 'A crisp blue berry that restores 20 HP and gives +15 Buddy XP.',
    svgMarkup: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M32 10c6 0 11 4 11 9-5 0-9-3-11-9Z" fill="#22C55E"/><path d="M32 10c-6 0-11 4-11 9 5 0 9-3 11-9Z" fill="#4ADE80"/><circle cx="32" cy="37" r="18" fill="#3B82F6" stroke="#1D4ED8" stroke-width="2.5"/><ellipse cx="26" cy="30" rx="5" ry="3.5" fill="#93C5FD" opacity="0.7"/><circle cx="32" cy="37" r="4" fill="#1E3A8A" opacity="0.25"/></svg>'
  },
  {
    id: 'pecha',
    name: 'Pecha Berry',
    flavor: 'tart',
    color: '#EC4899',
    accentColor: '#FBCFE8',
    xpBoost: 20,
    healHp: 25,
    catchBoost: 0.12,
    evolutionBoost: 15,
    rarity: 'common',
    costCoins: 5,
    description: 'A rosy heart-shaped treat boosting calm focus (+20 Buddy XP, +15% Evo Meter).',
    svgMarkup: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M32 12c4-5 11-5 13 0-4 2-9 2-13 0Z" fill="#22C55E"/><path d="M32 54C19 46 13 36 13 27c0-7 5-12 11-12 3.8 0 6.5 2 8 4.8C33.5 17 36.2 15 40 15c6 0 11 5 11 12 0 9-6 19-19 27Z" fill="#EC4899" stroke="#BE185D" stroke-width="2.5"/><ellipse cx="23" cy="24" rx="4" ry="2.5" fill="#FBCFE8" opacity="0.75"/></svg>'
  },
  {
    id: 'sitrus',
    name: 'Sitrus Berry',
    flavor: 'citrus',
    color: '#F59E0B',
    accentColor: '#FEF08A',
    xpBoost: 30,
    healHp: 45,
    catchBoost: 0.15,
    evolutionBoost: 20,
    rarity: 'uncommon',
    costCoins: 10,
    description: 'A sunny golden berry packed with juice (+45 HP, +30 Buddy XP).',
    svgMarkup: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M32 9c6 1 10 5 10 10-5 0-9-4-10-10Z" fill="#16A34A"/><path d="M32 17c10 0 18 8 18 19s-8 19-18 19-18-8-18-19 8-19 18-19Z" fill="#F59E0B" stroke="#B45309" stroke-width="2.5"/><ellipse cx="25" cy="29" rx="5" ry="3.5" fill="#FEF08A" opacity="0.8"/></svg>'
  },
  {
    id: 'lum',
    name: 'Lum Berry',
    flavor: 'herbal',
    color: '#22C55E',
    accentColor: '#BBF7D0',
    xpBoost: 40,
    healHp: 60,
    catchBoost: 0.2,
    evolutionBoost: 25,
    rarity: 'rare',
    costCoins: 25,
    description: 'A vibrant emerald berry that refreshes any buddy (+60 HP, +40 Buddy XP).',
    svgMarkup: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M32 11c5-4 11-2 12 3-4 2-8 1-12-3Z" fill="#15803D"/><path d="M32 11c-5-4-11-2-12 3 4 2 8 1 12-3Z" fill="#4ADE80"/><path d="M32 17c11 0 19 9 19 20 0 10-8 18-19 18S13 47 13 37c0-11 8-20 19-20Z" fill="#22C55E" stroke="#15803D" stroke-width="2.5"/><path d="M22 36c3-4 7-4 10 0 3 4 7 4 10 0" fill="none" stroke="#BBF7D0" stroke-width="2.5" stroke-linecap="round"/></svg>'
  },
  {
    id: 'starf',
    name: 'Starf Berry',
    flavor: 'cosmic',
    color: '#A855F7',
    accentColor: '#E9D5FF',
    xpBoost: 60,
    healHp: 50,
    catchBoost: 0.25,
    evolutionBoost: 40,
    rarity: 'rare',
    costCoins: 50,
    description: 'A five-pointed cosmic berry supercharging Evolution Meter (+40%) and XP (+60).',
    svgMarkup: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M32 10l6.2 12.6 13.8 2-10 9.8 2.4 13.8L32 41.6l-12.4 6.6 2.4-13.8-10-9.8 13.8-2Z" fill="#A855F7" stroke="#6B21A8" stroke-width="2.5" stroke-linejoin="round"/><circle cx="32" cy="31" r="6" fill="#E9D5FF" opacity="0.85"/></svg>'
  },
  {
    id: 'goldenrazz',
    name: 'Golden Razz Berry',
    flavor: 'golden',
    color: '#EAB308',
    accentColor: '#FEF9C3',
    xpBoost: 50,
    healHp: 80,
    catchBoost: 0.35,
    evolutionBoost: 35,
    rarity: 'legendary',
    costCoins: 100,
    description: 'Dazzling golden berry maximizing Safari Catch rate (+35%) and restoring 80 HP.',
    svgMarkup: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M32 9l4 6h7l-4 5c-4-1-10-1-14 0l-4-5h7Z" fill="#22C55E"/><circle cx="25" cy="30" r="8" fill="#FACC15" stroke="#A16207" stroke-width="2"/><circle cx="39" cy="30" r="8" fill="#FACC15" stroke="#A16207" stroke-width="2"/><circle cx="32" cy="40" r="9" fill="#EAB308" stroke="#A16207" stroke-width="2"/><circle cx="32" cy="30" r="7" fill="#FEF08A" stroke="#CA8A04" stroke-width="2"/></svg>'
  }
];

export const POKEBALLS = [
  {
    id: 'pokeball',
    name: 'Poké Ball',
    catchMultiplier: 1.0,
    shinyBonus: 0,
    primaryColor: '#E3350D',
    accentColor: '#FFFFFF',
    costCoins: 5,
    description: 'Classic red-and-white sphere for catching wild math buddies.',
    svgMarkup: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="32" cy="32" r="24" fill="#FFFFFF" stroke="#1E293B" stroke-width="3"/><path d="M8 32a24 24 0 0 1 48 0Z" fill="#E3350D" stroke="#1E293B" stroke-width="3"/><line x1="8" y1="32" x2="56" y2="32" stroke="#1E293B" stroke-width="4"/><circle cx="32" cy="32" r="8" fill="#FFFFFF" stroke="#1E293B" stroke-width="3.5"/><circle cx="32" cy="32" r="3.5" fill="#E2E8F0"/></svg>'
  },
  {
    id: 'greatball',
    name: 'Great Ball',
    catchMultiplier: 1.5,
    shinyBonus: 0.01,
    primaryColor: '#2563EB',
    accentColor: '#EF4444',
    costCoins: 15,
    description: 'High-performance cobalt sphere with 1.5x catch reliability.',
    svgMarkup: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="32" cy="32" r="24" fill="#FFFFFF" stroke="#1E293B" stroke-width="3"/><path d="M8 32a24 24 0 0 1 48 0Z" fill="#2563EB" stroke="#1E293B" stroke-width="3"/><path d="M13 18l9 7-4 5-9-6Z" fill="#EF4444"/><path d="M51 18l-9 7 4 5 9-6Z" fill="#EF4444"/><line x1="8" y1="32" x2="56" y2="32" stroke="#1E293B" stroke-width="4"/><circle cx="32" cy="32" r="8" fill="#FFFFFF" stroke="#1E293B" stroke-width="3.5"/></svg>'
  },
  {
    id: 'ultraball',
    name: 'Ultra Ball',
    catchMultiplier: 2.2,
    shinyBonus: 0.02,
    primaryColor: '#1E293B',
    accentColor: '#FFCB05',
    costCoins: 35,
    description: 'Ace-grade dark gold sphere offering 2.2x catch power for rare species.',
    svgMarkup: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="32" cy="32" r="24" fill="#FFFFFF" stroke="#1E293B" stroke-width="3"/><path d="M8 32a24 24 0 0 1 48 0Z" fill="#1E293B" stroke="#1E293B" stroke-width="3"/><path d="M18 13v13h6V11M40 11v15h6V13" fill="#FFCB05"/><line x1="8" y1="32" x2="56" y2="32" stroke="#1E293B" stroke-width="4"/><circle cx="32" cy="32" r="8" fill="#FFFFFF" stroke="#1E293B" stroke-width="3.5"/></svg>'
  },
  {
    id: 'premierball',
    name: 'Premier Ball',
    catchMultiplier: 1.8,
    shinyBonus: 0.05,
    primaryColor: '#F8FAFC',
    accentColor: '#E3350D',
    costCoins: 25,
    description: 'Gleaming pearl collector sphere that adds +5% Shiny encounter sparkle!',
    svgMarkup: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="32" cy="32" r="24" fill="#F8FAFC" stroke="#334155" stroke-width="3"/><line x1="8" y1="32" x2="56" y2="32" stroke="#E3350D" stroke-width="4.5"/><circle cx="32" cy="32" r="8" fill="#FFFFFF" stroke="#E3350D" stroke-width="3.5"/><circle cx="32" cy="32" r="3.5" fill="#FFCB05"/></svg>'
  }
];

export const ACCESSORIES = [
  {
    id: 'classic-cap',
    name: 'Classic Trainer Cap',
    costCoins: 25,
    slot: 'head',
    description: 'The iconic 1996 red-and-white League cap with a green Poké-arc emblem.',
    svgMarkup: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 36c0-13 9-22 20-22s20 9 20 22Z" fill="#E3350D" stroke="#1E293B" stroke-width="2.5"/><path d="M21 35c0-9 5-16 11-16s11 7 11 16Z" fill="#FFFFFF"/><path d="M25 29c3-4 11-4 14 0" fill="none" stroke="#38B000" stroke-width="3" stroke-linecap="round"/><path d="M9 36h46c2 0 3 5-5 6H14c-7-1-7-6-5-6Z" fill="#B91C1C" stroke="#1E293B" stroke-width="2.5"/></svg>'
  },
  {
    id: 'explorer-hat',
    name: 'Safari Explorer Hat',
    costCoins: 35,
    slot: 'head',
    description: 'A sun-ready adventurer brim built for counting trails in Pebble Cavern.',
    svgMarkup: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M18 35c1-12 6-18 14-18s13 6 14 18Z" fill="#D4A373" stroke="#5C4033" stroke-width="2.5"/><rect x="17" y="30" width="30" height="5" rx="2" fill="#4D7C0F"/><ellipse cx="32" cy="37" rx="26" ry="6" fill="#E9C46A" stroke="#5C4033" stroke-width="2.5"/><circle cx="32" cy="32.5" r="2.5" fill="#FFCB05"/></svg>'
  },
  {
    id: 'star-glasses',
    name: 'Starlight Glasses',
    costCoins: 50,
    slot: 'eyes',
    description: 'Golden star-shaped frames for spotting hidden number patterns.',
    svgMarkup: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M18 18l3.5 7 7.5 1-5.5 5.3 1.3 7.7-6.8-3.6-6.8 3.6 1.3-7.7L7 26l7.5-1Z" fill="#FFCB05" stroke="#B45309" stroke-width="2"/><path d="M46 18l3.5 7 7.5 1-5.5 5.3 1.3 7.7-6.8-3.6-6.8 3.6 1.3-7.7L35 26l7.5-1Z" fill="#FFCB05" stroke="#B45309" stroke-width="2"/><line x1="27" y1="28" x2="37" y2="28" stroke="#B45309" stroke-width="3"/></svg>'
  },
  {
    id: 'silk-ribbon',
    name: 'Silk Contest Ribbon',
    costCoins: 30,
    slot: 'neck',
    description: 'A shimmering rose-pink bow that celebrates neat math streaks.',
    svgMarkup: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M32 32L12 20c-3 6-3 18 0 24Z" fill="#EC4899" stroke="#9D174D" stroke-width="2.5" stroke-linejoin="round"/><path d="M32 32l20-12c3 6 3 18 0 24Z" fill="#EC4899" stroke="#9D174D" stroke-width="2.5" stroke-linejoin="round"/><path d="M27 36l-6 16 7-3M37 36l6 16-7-3" fill="#F472B6" stroke="#9D174D" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="32" r="6" fill="#FFCB05" stroke="#9D174D" stroke-width="2.5"/></svg>'
  },
  {
    id: 'champion-crown',
    name: 'Champion Crown',
    costCoins: 100,
    slot: 'head',
    description: 'Gleaming Victory Summit diadem forged with elemental math gems.',
    svgMarkup: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M10 44L14 20l10 10 8-14 8 14 10-10 4 24Z" fill="#FFCB05" stroke="#B45309" stroke-width="2.5" stroke-linejoin="round"/><rect x="10" y="42" width="44" height="7" rx="3" fill="#F59E0B" stroke="#B45309" stroke-width="2"/><circle cx="32" cy="34" r="3.5" fill="#E3350D"/><circle cx="20" cy="37" r="2.8" fill="#3B4CCA"/><circle cx="44" cy="37" r="2.8" fill="#38B000"/></svg>'
  },
  {
    id: 'cozy-scarf',
    name: 'Cozy PokéNav Scarf',
    costCoins: 25,
    slot: 'neck',
    description: 'A warm crimson-and-gold knit scarf perfect for Buddy Camp naps.',
    svgMarkup: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M14 24c0-5 36-5 36 0v8c0 5-36 5-36 0Z" fill="#E3350D" stroke="#7F1D1D" stroke-width="2.5"/><path d="M22 33h10l-3 20H18Z" fill="#E3350D" stroke="#7F1D1D" stroke-width="2.5" stroke-linejoin="round"/><path d="M34 33h10l4 16H36Z" fill="#DC2626" stroke="#7F1D1D" stroke-width="2.5" stroke-linejoin="round"/><line x1="20" y1="45" x2="29" y2="45" stroke="#FFCB05" stroke-width="3"/></svg>'
  }
];

const RARE_CANDY_SVG = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 18l10 8-6 10-8-4ZM52 46l-10-8 6-10 8 4Z" fill="#60A5FA" stroke="#1D4ED8" stroke-width="2.5" stroke-linejoin="round"/><circle cx="32" cy="32" r="14" fill="#38BDF8" stroke="#1D4ED8" stroke-width="2.5"/><path d="M27 26l10 12M37 26l-10 12" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/></svg>';

export const MART_CATALOG = [
  ...POKEBALLS.map((ball) => ({
    id: ball.id,
    itemId: ball.id,
    category: 'pokeball',
    name: ball.name,
    costCoins: ball.costCoins,
    quantity: 1,
    description: ball.description,
    svgMarkup: ball.svgMarkup
  })),
  ...BERRIES.map((berry) => ({
    id: berry.id,
    itemId: berry.id,
    category: 'berry',
    name: berry.name,
    costCoins: berry.costCoins,
    quantity: 1,
    description: berry.description,
    svgMarkup: berry.svgMarkup
  })),
  {
    id: 'rarecandy',
    itemId: 'rarecandy',
    category: 'boost',
    name: 'Rare Candy',
    costCoins: 75,
    quantity: 1,
    description: 'Sparkling energy sweet that surges Buddy XP (+80) and fills Evolution Meter!',
    svgMarkup: RARE_CANDY_SVG
  },
  ...ACCESSORIES.map((acc) => ({
    id: acc.id,
    itemId: acc.id,
    category: 'accessory',
    name: acc.name,
    costCoins: acc.costCoins,
    quantity: 1,
    description: acc.description,
    svgMarkup: acc.svgMarkup
  }))
];

export const QUEST_TEMPLATES = [
  {
    templateId: 'q-solve-5',
    title: 'Solve 5 Math Challenges',
    metric: 'solve_total',
    target: 5,
    rewardStardust: 15,
    description: 'Answer any 5 PokéMath problems across routes or practice modes.'
  },
  {
    templateId: 'q-streak-4',
    title: 'Reach a 4-Answer Streak',
    metric: 'solve_streak',
    target: 4,
    rewardStardust: 20,
    description: 'Land 4 correct answers in a row to charge your Critical Math Meter.'
  },
  {
    templateId: 'q-no-hints-4',
    title: 'Independent Thinker (4)',
    metric: 'solve_no_hints',
    target: 4,
    rewardStardust: 25,
    description: 'Solve 4 challenges on your own without opening Rotom-Dex hints.'
  },
  {
    templateId: 'q-win-2-battles',
    title: 'Win 2 Wild Battles',
    metric: 'battle_wins',
    target: 2,
    rewardStardust: 20,
    description: 'Defeat 2 wild Pokémon encounters using Quick, Power, or Charge moves.'
  },
  {
    templateId: 'q-catch-2',
    title: 'Catch 2 New Buddies',
    metric: 'catch_pokemon',
    target: 2,
    rewardStardust: 25,
    description: 'Land 2 successful Poké Ball throws in Safari Catch mode.'
  },
  {
    templateId: 'q-feed-berries-2',
    title: 'Mix & Share 2 Berries',
    metric: 'feed_berries',
    target: 2,
    rewardStardust: 15,
    description: 'Treat your active buddy in the Berry Lab or Cozy Buddy Camp.'
  },
  {
    templateId: 'q-manipulative-2',
    title: 'Explore 2 Visual Guides',
    metric: 'use_manipulative',
    target: 2,
    rewardStardust: 15,
    description: 'Tap interactive Ten-Frames, Number Lines, Arrays, or Scales in Rotom-Dex.'
  },
  {
    templateId: 'q-mart-checkout-1',
    title: 'Poké-Mart Coin Checkout',
    metric: 'mart_purchases',
    target: 1,
    rewardStardust: 15,
    description: 'Pay with exact Poké-Coins for any supply in the Poké-Mart.'
  },
  {
    templateId: 'q-word-3',
    title: 'Crack 3 Story Problems',
    metric: 'solve_word',
    target: 3,
    rewardStardust: 20,
    description: 'Solve 3 story-based math adventures with your partner Pokémon.'
  },
  {
    templateId: 'q-earn-xp-60',
    title: 'Earn 60 Buddy XP',
    metric: 'earn_xp',
    target: 60,
    rewardStardust: 25,
    description: 'Train together to gather 60 Buddy XP toward your next evolution.'
  },
  {
    templateId: 'q-critical-1',
    title: 'Land a Critical Charge',
    metric: 'critical_solve',
    target: 1,
    rewardStardust: 20,
    description: 'Complete a streak-powered Critical Math Challenge in battle.'
  },
  {
    templateId: 'q-higher-tier-3',
    title: 'Brave 3 Explorer+ Puzzles',
    metric: 'solve_explorer_plus',
    target: 3,
    rewardStardust: 25,
    description: 'Solve 3 challenges at Explorer, Ace, or Champion tier.'
  }
];
