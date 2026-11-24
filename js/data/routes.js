/**
 * PokéMath Adventure Routes, Biome Encounters & Gym Leader Trials.
 */

export const ROUTES = [
  {
    id: 'route-1',
    number: 1,
    name: 'Sprout Meadow',
    subtitle: 'Addition, Making 10 & Number Bonds',
    biomeKey: 'meadow',
    mathDomains: ['add', 'word'],
    recommendedTier: 'starter',
    starThresholds: [3, 6, 10],
    wildPool: [
      'bulbasaur', 'pikachu', 'caterpie', 'oddish', 'chikorita',
      'togepi', 'azurill', 'sprigatito', 'eevee', 'treecko', 'rowlet'
    ],
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
  },
  {
    id: 'route-2',
    number: 2,
    name: 'Pebble Cavern',
    subtitle: 'Subtraction, Difference & Missing Addends',
    biomeKey: 'cavern',
    mathDomains: ['sub', 'add', 'word'],
    recommendedTier: 'starter',
    starThresholds: [4, 8, 12],
    wildPool: [
      'charmander', 'geodude', 'cleffa', 'clefairy', 'machop',
      'vulpix', 'gastly', 'cyndaquil', 'fuecoco', 'riolu', 'tinkatink'
    ],
    gymLeader: {
      id: 'rocco',
      name: 'Cavern Leader Rocco',
      title: 'Surveyor of Stones',
      badgeId: 'geode-badge',
      badgeName: 'Geode Badge',
      badgeColor: '#8D6E63',
      badgeSvgKey: 'geode',
      introQuote: 'Crack open the difference between two numbers like a sparkling geode!',
      victoryQuote: 'Rock-solid subtraction! The Geode Badge shines for you!',
      teamIds: ['geodude', 'machop', 'graveler']
    }
  },
  {
    id: 'route-3',
    number: 3,
    name: 'Harbor Lighthouse',
    subtitle: 'Place Value (100s/10s/1s), < = > & Skip Counting',
    biomeKey: 'harbor',
    mathDomains: ['placeValue', 'comparison', 'add', 'sub'],
    recommendedTier: 'explorer',
    starThresholds: [5, 10, 15],
    wildPool: [
      'squirtle', 'poliwag', 'magnemite', 'marill', 'totodile',
      'mudkip', 'froakie', 'quaxly', 'ponyta', 'magikarp', 'lapras'
    ],
    gymLeader: {
      id: 'marina',
      name: 'Harbor Captain Marina',
      title: 'Navigator of Place Value',
      badgeId: 'beacon-badge',
      badgeName: 'Beacon Badge',
      badgeColor: '#0096C7',
      badgeSvgKey: 'beacon',
      introQuote: 'Compare tides and steer by hundreds, tens, and ones—full steam ahead!',
      victoryQuote: 'Steady course and sharp eyes! Claim the Beacon Badge!',
      teamIds: ['wartortle', 'marill', 'lapras']
    }
  },
  {
    id: 'route-4',
    number: 4,
    name: 'Volt Ridge',
    subtitle: 'Multiplication Arrays, Equal Groups & Times Tables',
    biomeKey: 'ridge',
    mathDomains: ['mul', 'word'],
    recommendedTier: 'ace',
    starThresholds: [5, 10, 15],
    wildPool: [
      'pichu', 'pikachu', 'mareep', 'flaaffy', 'shinx', 'luxio',
      'pawmi', 'pawmo', 'magnemite', 'magneton', 'jolteon', 'charmeleon', 'tinkatuff'
    ],
    gymLeader: {
      id: 'sparks',
      name: 'Volt Leader Sparks',
      title: 'Architect of Arrays',
      badgeId: 'dynamo-badge',
      badgeName: 'Dynamo Badge',
      badgeColor: '#FFB703',
      badgeSvgKey: 'dynamo',
      introQuote: 'Equal rows and electric groups generate unstoppable power! Let us charge up!',
      victoryQuote: 'Shockingly brilliant multiplication! The Dynamo Badge is yours!',
      teamIds: ['flaaffy', 'luxio', 'raichu']
    }
  },
  {
    id: 'route-5',
    number: 5,
    name: 'Mystic Rapids',
    subtitle: 'Division Sharing, Fact Families & Intro Fractions',
    biomeKey: 'rapids',
    mathDomains: ['div', 'fraction', 'mul'],
    recommendedTier: 'ace',
    starThresholds: [6, 12, 18],
    wildPool: [
      'abra', 'kadabra', 'ralts', 'kirlia', 'gastly', 'haunter',
      'dratini', 'dragonair', 'vaporeon', 'espeon', 'azumarill',
      'poliwhirl', 'frogadier', 'quaxwell', 'gyarados'
    ],
    gymLeader: {
      id: 'brook',
      name: 'Rapids Sage Brook',
      title: 'Keeper of Equal Shares',
      badgeId: 'cascade-badge',
      badgeName: 'Cascade Badge',
      badgeColor: '#6366F1',
      badgeSvgKey: 'cascade',
      introQuote: 'Like twin rivers sharing the current, every fraction and quotient seeks balance.',
      victoryQuote: 'Serene mastery of division and parts! Receive the Cascade Badge!',
      teamIds: ['vaporeon', 'kirlia', 'gardevoir']
    }
  },
  {
    id: 'route-6',
    number: 6,
    name: 'Victory Summit',
    subtitle: 'Multi-Step Word Problems, Mixed Ops & Champion Trial',
    biomeKey: 'summit',
    mathDomains: ['word', 'orderOfOps', 'balanced', 'fraction', 'mul', 'div'],
    recommendedTier: 'champion',
    starThresholds: [6, 12, 20],
    wildPool: [
      'gible', 'gabite', 'dragonite', 'lucario', 'tinkaton', 'magnezone',
      'alakazam', 'gengar', 'togekiss', 'ampharos', 'luxray', 'pawmot',
      'greninja', 'meowscarada', 'skeledirge', 'quaquaval', 'decidueye',
      'umbreon', 'sylveon', 'ninetales'
    ],
    gymLeader: {
      id: 'astra',
      name: 'Grand Champion Astra',
      title: 'Sovereign of the Summit',
      badgeId: 'infinity-badge',
      badgeName: 'Infinity Crest Badge',
      badgeColor: '#9333EA',
      badgeSvgKey: 'infinity',
      introQuote: 'At the summit of PokéMath, every equation unites. Show me your champion heart!',
      victoryQuote: 'Extraordinary wisdom across every realm of numbers! Hail the new Champion!',
      teamIds: ['lucario', 'gardevoir', 'dragonite', 'garchomp']
    }
  }
];

export function getRouteById(id) {
  if (!id || typeof id !== 'string') return null;
  return ROUTES.find((route) => route.id === id) || null;
}
