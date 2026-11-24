/**
 * PokéMath Roster & Evolution Registry (115 species across 39 families / 38 multi-stage lines).
 */

const ARTWORK_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';

export const STARTER_IDS = ['bulbasaur', 'charmander', 'squirtle', 'pikachu'];

function createEntry({
  id,
  dexNumber,
  name,
  familyId,
  stage,
  evolvesTo = null,
  evolvesToOptions = null,
  evolutionXpRequired = 0,
  types,
  baseHp,
  moveNames,
  mathLore,
  fallbackPalette,
  emblemShape
}) {
  return {
    id,
    dexNumber,
    name,
    familyId,
    stage,
    evolvesTo,
    evolvesToOptions,
    evolutionXpRequired,
    types,
    baseHp,
    moveNames,
    mathLore,
    spriteUrl: `${ARTWORK_BASE}/${dexNumber}.png`,
    shinySpriteUrl: `${ARTWORK_BASE}/shiny/${dexNumber}.png`,
    fallbackPalette,
    emblemShape
  };
}

const RAW_ROSTER = [
  // 1. Bulbasaur Line
  {
    id: 'bulbasaur', dexNumber: 1, name: 'Bulbasaur', familyId: 'bulbasaur-line',
    stage: 1, evolvesTo: 'ivysaur', evolutionXpRequired: 100,
    types: ['grass', 'poison'], baseHp: 80,
    moveNames: { quick: 'Vine Count', power: 'Razor Sum', charge: 'Solar Bond' },
    mathLore: 'Bulbasaur sunbathes in neat 2x5 rows so its bulb can count 10 sunbeams at once!',
    fallbackPalette: { primary: '#6BCB77', secondary: '#4D96FF', accent: '#2D6A4F', eye: '#E3350D' },
    emblemShape: 'leaf'
  },
  {
    id: 'ivysaur', dexNumber: 2, name: 'Ivysaur', familyId: 'bulbasaur-line',
    stage: 2, evolvesTo: 'venusaur', evolutionXpRequired: 160,
    types: ['grass', 'poison'], baseHp: 110,
    moveNames: { quick: 'Leaf Tally', power: 'Bud Balance', charge: 'Petal Array' },
    mathLore: 'Each petal unfolding on Ivysaur adds another ten to its sunny energy reserve.',
    fallbackPalette: { primary: '#52B788', secondary: '#FF758F', accent: '#1B4332', eye: '#E3350D' },
    emblemShape: 'leaf'
  },
  {
    id: 'venusaur', dexNumber: 3, name: 'Venusaur', familyId: 'bulbasaur-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['grass', 'poison'], baseHp: 150,
    moveNames: { quick: 'Canopy Skip', power: 'Pollen Product', charge: 'Solar Synthesis' },
    mathLore: 'Venusaur blooms widest when every fraction of sunlight and rain balances evenly.',
    fallbackPalette: { primary: '#40916C', secondary: '#FF4D6D', accent: '#1B4332', eye: '#D90429' },
    emblemShape: 'leaf'
  },

  // 2. Charmander Line
  {
    id: 'charmander', dexNumber: 4, name: 'Charmander', familyId: 'charmander-line',
    stage: 1, evolvesTo: 'charmeleon', evolutionXpRequired: 100,
    types: ['fire'], baseHp: 78,
    moveNames: { quick: 'Ember Spark', power: 'Flame Plus', charge: 'Blaze Equation' },
    mathLore: 'Charmander measures the warmth of its tail flame by counting cheerful sparks in pairs.',
    fallbackPalette: { primary: '#FF7B25', secondary: '#FFD166', accent: '#C92A2A', eye: '#1D4ED8' },
    emblemShape: 'flame'
  },
  {
    id: 'charmeleon', dexNumber: 5, name: 'Charmeleon', familyId: 'charmander-line',
    stage: 2, evolvesTo: 'charizard', evolutionXpRequired: 160,
    types: ['fire'], baseHp: 108,
    moveNames: { quick: 'Cinder Swipe', power: 'Magma Double', charge: 'Flare Cascade' },
    mathLore: 'Charmeleon doubles its fiery determination every time a tough subtraction clicks!',
    fallbackPalette: { primary: '#E63946', secondary: '#FFB703', accent: '#7F1D1D', eye: '#0F766E' },
    emblemShape: 'flame'
  },
  {
    id: 'charizard', dexNumber: 6, name: 'Charizard', familyId: 'charmander-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['fire', 'flying'], baseHp: 152,
    moveNames: { quick: 'Wing Gust', power: 'Inferno Factor', charge: 'Skyline Nova' },
    mathLore: 'Soaring high above Victory Summit, Charizard calculates wind currents in huge multiples of ten.',
    fallbackPalette: { primary: '#F77F00', secondary: '#2A9D8F', accent: '#9B2226', eye: '#1D3557' },
    emblemShape: 'flame'
  },

  // 3. Squirtle Line
  {
    id: 'squirtle', dexNumber: 7, name: 'Squirtle', familyId: 'squirtle-line',
    stage: 1, evolvesTo: 'wartortle', evolutionXpRequired: 100,
    types: ['water'], baseHp: 82,
    moveNames: { quick: 'Bubble Pop', power: 'Shell Skip', charge: 'Hydro Bond' },
    mathLore: 'Squirtle keeps track of tide pools by grouping shiny seashells into neat fives.',
    fallbackPalette: { primary: '#56CFE1', secondary: '#F4D58D', accent: '#1D3557', eye: '#9B2226' },
    emblemShape: 'droplet'
  },
  {
    id: 'wartortle', dexNumber: 8, name: 'Wartortle', familyId: 'squirtle-line',
    stage: 2, evolvesTo: 'blastoise', evolutionXpRequired: 160,
    types: ['water'], baseHp: 112,
    moveNames: { quick: 'Wave Dash', power: 'Current Split', charge: 'Tidal Quotient' },
    mathLore: 'Wartortle steers through harbor currents by comparing wave heights with <, =, and >.',
    fallbackPalette: { primary: '#4361EE', secondary: '#E2E8F0', accent: '#1E1B4B', eye: '#9B2226' },
    emblemShape: 'droplet'
  },
  {
    id: 'blastoise', dexNumber: 9, name: 'Blastoise', familyId: 'squirtle-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['water'], baseHp: 154,
    moveNames: { quick: 'Jet Pulse', power: 'Twin Cannon', charge: 'Oceanic Array' },
    mathLore: 'Blastoise balances twin hydro cannons so both sides always equal the exact same force!',
    fallbackPalette: { primary: '#2563EB', secondary: '#D97706', accent: '#1E3A8A', eye: '#B91C1C' },
    emblemShape: 'droplet'
  },

  // 4. Caterpie Line
  {
    id: 'caterpie', dexNumber: 10, name: 'Caterpie', familyId: 'caterpie-line',
    stage: 1, evolvesTo: 'metapod', evolutionXpRequired: 70,
    types: ['bug'], baseHp: 68,
    moveNames: { quick: 'Leaf Nibble', power: 'Segment Step', charge: 'Silk Wrap' },
    mathLore: 'Caterpie loves counting along leaf veins one cozy hop at a time.',
    fallbackPalette: { primary: '#80ED99', secondary: '#FFD166', accent: '#2D6A4F', eye: '#1E293B' },
    emblemShape: 'leaf'
  },
  {
    id: 'metapod', dexNumber: 11, name: 'Metapod', familyId: 'caterpie-line',
    stage: 2, evolvesTo: 'butterfree', evolutionXpRequired: 110,
    types: ['bug'], baseHp: 94,
    moveNames: { quick: 'Shell Guard', power: 'Harden Hold', charge: 'Cocoon Steady' },
    mathLore: 'Quiet inside its emerald shell, Metapod practices number bonds in peaceful patience.',
    fallbackPalette: { primary: '#57CC99', secondary: '#C7F9CC', accent: '#1B4332', eye: '#0F172A' },
    emblemShape: 'leaf'
  },
  {
    id: 'butterfree', dexNumber: 12, name: 'Butterfree', familyId: 'caterpie-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['bug', 'flying'], baseHp: 122,
    moveNames: { quick: 'Flutter Wing', power: 'Stardust Gust', charge: 'Symmetry Whirl' },
    mathLore: 'Butterfree carries matching spots on left and right wings—a living mirror of symmetry!',
    fallbackPalette: { primary: '#A78BFA', secondary: '#F8FAFC', accent: '#4C1D95', eye: '#DC2626' },
    emblemShape: 'wing'
  },

  // 5. Pichu / Pikachu / Raichu Line
  {
    id: 'pichu', dexNumber: 172, name: 'Pichu', familyId: 'pikachu-line',
    stage: 1, evolvesTo: 'pikachu', evolutionXpRequired: 75,
    types: ['electric'], baseHp: 66,
    moveNames: { quick: 'Tiny Zaps', power: 'Cheek Spark', charge: 'Playful Bolt' },
    mathLore: 'Pichu giggles whenever two small numbers snap together into a bright ten!',
    fallbackPalette: { primary: '#FDE047', secondary: '#1E293B', accent: '#FB7185', eye: '#0F172A' },
    emblemShape: 'bolt'
  },
  {
    id: 'pikachu', dexNumber: 25, name: 'Pikachu', familyId: 'pikachu-line',
    stage: 2, evolvesTo: 'raichu', evolutionXpRequired: 120,
    types: ['electric'], baseHp: 92,
    moveNames: { quick: 'Quick Spark', power: 'Thunder Ten', charge: 'Volt Combo' },
    mathLore: 'Pikachu charges its electric cheeks in multiples of 5 before unleashing a golden bolt!',
    fallbackPalette: { primary: '#FFCB05', secondary: '#FFE45E', accent: '#B45309', eye: '#1E293B' },
    emblemShape: 'bolt'
  },
  {
    id: 'raichu', dexNumber: 26, name: 'Raichu', familyId: 'pikachu-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['electric'], baseHp: 136,
    moveNames: { quick: 'Tail Snap', power: 'Mega Circuit', charge: 'Lightning Array' },
    mathLore: 'Raichu grounds extra voltage through its lightning-bolt tail with razor-sharp accuracy.',
    fallbackPalette: { primary: '#F59E0B', secondary: '#FEF08A', accent: '#78350F', eye: '#1E293B' },
    emblemShape: 'bolt'
  },

  // 6. Cleffa Line
  {
    id: 'cleffa', dexNumber: 173, name: 'Cleffa', familyId: 'cleffa-line',
    stage: 1, evolvesTo: 'clefairy', evolutionXpRequired: 75,
    types: ['fairy'], baseHp: 72,
    moveNames: { quick: 'Star Wink', power: 'Moonlight Hop', charge: 'Wish Ring' },
    mathLore: 'Shaped like a falling star, Cleffa counts constellations before bedtime in Pebble Cavern.',
    fallbackPalette: { primary: '#FBCFE8', secondary: '#9D174D', accent: '#F472B6', eye: '#1E293B' },
    emblemShape: 'star'
  },
  {
    id: 'clefairy', dexNumber: 35, name: 'Clefairy', familyId: 'cleffa-line',
    stage: 2, evolvesTo: 'clefable', evolutionXpRequired: 140,
    types: ['fairy'], baseHp: 104,
    moveNames: { quick: 'Moon Slap', power: 'Metronome Mix', charge: 'Lunar Halo' },
    mathLore: 'Clefairy dances in glowing moonbeam circles, dividing space into equal cozy arcs.',
    fallbackPalette: { primary: '#F9A8D4', secondary: '#FDF2F8', accent: '#BE185D', eye: '#1E293B' },
    emblemShape: 'star'
  },
  {
    id: 'clefable', dexNumber: 36, name: 'Clefable', familyId: 'cleffa-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['fairy'], baseHp: 142,
    moveNames: { quick: 'Soft Step', power: 'Starlight Sum', charge: 'Cosmic Choir' },
    mathLore: 'Clefable hears the quietest rhythm in nature and turns tricky patterns into music.',
    fallbackPalette: { primary: '#F472B6', secondary: '#FDE68A', accent: '#831843', eye: '#1E293B' },
    emblemShape: 'star'
  },

  // 7. Vulpix Line
  {
    id: 'vulpix', dexNumber: 37, name: 'Vulpix', familyId: 'vulpix-line',
    stage: 1, evolvesTo: 'ninetales', evolutionXpRequired: 120,
    types: ['fire'], baseHp: 78,
    moveNames: { quick: 'Fox Dash', power: 'Six-Tail Flick', charge: 'Warm Will-O-Wisp' },
    mathLore: 'Vulpix curls its six warm tails around pebbles to check groups of 2 and 3.',
    fallbackPalette: { primary: '#EA580C', secondary: '#FDE68A', accent: '#7C2D12', eye: '#92400E' },
    emblemShape: 'flame'
  },
  {
    id: 'ninetales', dexNumber: 38, name: 'Ninetales', familyId: 'vulpix-line',
    stage: 2, evolvesTo: null, evolutionXpRequired: 0,
    types: ['fire'], baseHp: 138,
    moveNames: { quick: 'Golden Gleam', power: 'Ninefold Flame', charge: 'Mystic Sunburst' },
    mathLore: 'Each of Ninetales’s nine luminous tails holds a century of clever number riddles.',
    fallbackPalette: { primary: '#FDE047', secondary: '#FEF9C3', accent: '#D97706', eye: '#DC2626' },
    emblemShape: 'flame'
  },

  // 8. Oddish Line
  {
    id: 'oddish', dexNumber: 43, name: 'Oddish', familyId: 'oddish-line',
    stage: 1, evolvesTo: 'gloom', evolutionXpRequired: 85,
    types: ['grass', 'poison'], baseHp: 74,
    moveNames: { quick: 'Sprout Skip', power: 'Moon Root', charge: 'Dewdrop Tally' },
    mathLore: 'Oddish sprouts five tidy leaves on top, making high-five sums in Sprout Meadow.',
    fallbackPalette: { primary: '#3B82F6', secondary: '#4ADE80', accent: '#1E3A8A', eye: '#DC2626' },
    emblemShape: 'leaf'
  },
  {
    id: 'gloom', dexNumber: 44, name: 'Gloom', familyId: 'oddish-line',
    stage: 2, evolvesTo: 'vileplume', evolutionXpRequired: 150,
    types: ['grass', 'poison'], baseHp: 102,
    moveNames: { quick: 'Nectar Drop', power: 'Petal Fold', charge: 'Bloom Burst' },
    mathLore: 'Gloom’s sweet aroma attracts bugs in equal clusters, perfect for sorting sets!',
    fallbackPalette: { primary: '#6366F1', secondary: '#FB7185', accent: '#312E81', eye: '#F59E0B' },
    emblemShape: 'leaf'
  },
  {
    id: 'vileplume', dexNumber: 45, name: 'Vileplume', familyId: 'oddish-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['grass', 'poison'], baseHp: 140,
    moveNames: { quick: 'Petal Spin', power: 'Five-Petal Array', charge: 'Meadow Symphony' },
    mathLore: 'Vileplume balances five giant crimson petals like a giant spinning fraction wheel.',
    fallbackPalette: { primary: '#EF4444', secondary: '#60A5FA', accent: '#7F1D1D', eye: '#F59E0B' },
    emblemShape: 'leaf'
  },

  // 9. Poliwag Line
  {
    id: 'poliwag', dexNumber: 60, name: 'Poliwag', familyId: 'poliwag-line',
    stage: 1, evolvesTo: 'poliwhirl', evolutionXpRequired: 90,
    types: ['water'], baseHp: 74,
    moveNames: { quick: 'Bubble Swirl', power: 'Pond Splash', charge: 'Spiral Count' },
    mathLore: 'The white spiral on Poliwag’s belly spins smoothly like a coiled number line!',
    fallbackPalette: { primary: '#38BDF8', secondary: '#F8FAFC', accent: '#0369A1', eye: '#1E293B' },
    emblemShape: 'droplet'
  },
  {
    id: 'poliwhirl', dexNumber: 61, name: 'Poliwhirl', familyId: 'poliwag-line',
    stage: 2, evolvesTo: 'poliwrath', evolutionXpRequired: 160,
    types: ['water'], baseHp: 108,
    moveNames: { quick: 'Glove Tap', power: 'Ripple Pulse', charge: 'Vortex Tide' },
    mathLore: 'Poliwhirl’s cozy white gloves keep count of every swimming skip-count rhythm.',
    fallbackPalette: { primary: '#2563EB', secondary: '#F8FAFC', accent: '#1E3A8A', eye: '#1E293B' },
    emblemShape: 'droplet'
  },
  {
    id: 'poliwrath', dexNumber: 62, name: 'Poliwrath', familyId: 'poliwag-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['water', 'fighting'], baseHp: 148,
    moveNames: { quick: 'Surge Jab', power: 'Breaker Split', charge: 'Riptide Dynamo' },
    mathLore: 'Poliwrath swims across Mystic Rapids using steady, rhythmic strokes in sets of eight.',
    fallbackPalette: { primary: '#1D4ED8', secondary: '#FFFFFF', accent: '#0F172A', eye: '#DC2626' },
    emblemShape: 'shield'
  },

  // 10. Abra Line
  {
    id: 'abra', dexNumber: 63, name: 'Abra', familyId: 'abra-line',
    stage: 1, evolvesTo: 'kadabra', evolutionXpRequired: 90,
    types: ['psychic'], baseHp: 70,
    moveNames: { quick: 'Mind Blink', power: 'Mental Hop', charge: 'Dream Bond' },
    mathLore: 'Even while napping 18 hours a day, Abra solves mental addition in vivid dreams!',
    fallbackPalette: { primary: '#FACC15', secondary: '#92400E', accent: '#CA8A04', eye: '#1E293B' },
    emblemShape: 'gem'
  },
  {
    id: 'kadabra', dexNumber: 64, name: 'Kadabra', familyId: 'abra-line',
    stage: 2, evolvesTo: 'alakazam', evolutionXpRequired: 160,
    types: ['psychic'], baseHp: 102,
    moveNames: { quick: 'Spoon Gleam', power: 'Psyche Split', charge: 'Star Prism' },
    mathLore: 'Kadabra focuses psychic sparks onto a shiny spoon to compare equations effortlessly.',
    fallbackPalette: { primary: '#EAB308', secondary: '#78350F', accent: '#DC2626', eye: '#1E293B' },
    emblemShape: 'gem'
  },
  {
    id: 'alakazam', dexNumber: 65, name: 'Alakazam', familyId: 'abra-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['psychic'], baseHp: 138,
    moveNames: { quick: 'Twin Spoon', power: 'Logic Beam', charge: 'Infinity Mind' },
    mathLore: 'With twin spoons and an extraordinary memory, Alakazam solves multi-step puzzles in a flash!',
    fallbackPalette: { primary: '#F59E0B', secondary: '#B45309', accent: '#FEF3C7', eye: '#1E293B' },
    emblemShape: 'gem'
  },

  // 11. Machop Line
  {
    id: 'machop', dexNumber: 66, name: 'Machop', familyId: 'machop-line',
    stage: 1, evolvesTo: 'machoke', evolutionXpRequired: 95,
    types: ['fighting'], baseHp: 84,
    moveNames: { quick: 'Pebble Lift', power: 'Karate Count', charge: 'Boulder Push' },
    mathLore: 'Machop trains in Pebble Cavern by lifting rocks in balanced equal sets.',
    fallbackPalette: { primary: '#94A3B8', secondary: '#FEF08A', accent: '#475569', eye: '#DC2626' },
    emblemShape: 'shield'
  },
  {
    id: 'machoke', dexNumber: 67, name: 'Machoke', familyId: 'machop-line',
    stage: 2, evolvesTo: 'machamp', evolutionXpRequired: 165,
    types: ['fighting'], baseHp: 118,
    moveNames: { quick: 'Belt Brace', power: 'Heavy Ratio', charge: 'Titan Press' },
    mathLore: 'Machoke’s champion belt keeps its power balanced cleanly like a mathematical scale.',
    fallbackPalette: { primary: '#64748B', secondary: '#FACC15', accent: '#334155', eye: '#DC2626' },
    emblemShape: 'shield'
  },
  {
    id: 'machamp', dexNumber: 68, name: 'Machamp', familyId: 'machop-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['fighting'], baseHp: 156,
    moveNames: { quick: 'Four-Hand Tap', power: 'Quadruple Strike', charge: 'Summit Slam' },
    mathLore: 'Four nimble arms let Machamp count and stack four equal arrays all at once!',
    fallbackPalette: { primary: '#475569', secondary: '#EAB308', accent: '#1E293B', eye: '#DC2626' },
    emblemShape: 'shield'
  },

  // 12. Geodude Line
  {
    id: 'geodude', dexNumber: 74, name: 'Geodude', familyId: 'geodude-line',
    stage: 1, evolvesTo: 'graveler', evolutionXpRequired: 95,
    types: ['rock', 'ground'], baseHp: 82,
    moveNames: { quick: 'Pebble Toss', power: 'Minus Chip', charge: 'Granite Roll' },
    mathLore: 'Geodude skips along cavern ledges, subtracting pebbles one hop at a time.',
    fallbackPalette: { primary: '#A8A29E', secondary: '#D6D3D1', accent: '#57534E', eye: '#1E293B' },
    emblemShape: 'gem'
  },
  {
    id: 'graveler', dexNumber: 75, name: 'Graveler', familyId: 'geodude-line',
    stage: 2, evolvesTo: 'golem', evolutionXpRequired: 165,
    types: ['rock', 'ground'], baseHp: 116,
    moveNames: { quick: 'Rock Tumble', power: 'Quarry Difference', charge: 'Crag Smash' },
    mathLore: 'Graveler rolls downhill and counts the echoes echoing back from cavern walls.',
    fallbackPalette: { primary: '#78716C', secondary: '#A8A29E', accent: '#44403C', eye: '#1E293B' },
    emblemShape: 'gem'
  },
  {
    id: 'golem', dexNumber: 76, name: 'Golem', familyId: 'geodude-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['rock', 'ground'], baseHp: 154,
    moveNames: { quick: 'Stone Roll', power: 'Basalt Blast', charge: 'Tectonic Core' },
    mathLore: 'Armored in geometric rock plates, Golem stands unshaken against the toughest equations.',
    fallbackPalette: { primary: '#57534E', secondary: '#D97706', accent: '#292524', eye: '#DC2626' },
    emblemShape: 'gem'
  },

  // 13. Ponyta Line
  {
    id: 'ponyta', dexNumber: 77, name: 'Ponyta', familyId: 'ponyta-line',
    stage: 1, evolvesTo: 'rapidash', evolutionXpRequired: 120,
    types: ['fire'], baseHp: 80,
    moveNames: { quick: 'Spark Trot', power: 'Blaze Gallop', charge: 'Hurdle Leap' },
    mathLore: 'Ponyta practices high jumps over glowing hurdles, counting strides by 2s and 5s.',
    fallbackPalette: { primary: '#FEF3C7', secondary: '#FB923C', accent: '#EA580C', eye: '#1E293B' },
    emblemShape: 'flame'
  },
  {
    id: 'rapidash', dexNumber: 78, name: 'Rapidash', familyId: 'ponyta-line',
    stage: 2, evolvesTo: null, evolutionXpRequired: 0,
    types: ['fire'], baseHp: 136,
    moveNames: { quick: 'Flame Stride', power: 'Meteor Canter', charge: 'Solar Sprint' },
    mathLore: 'Rapidash races across open plains, calculating speed and distance in swift mental bursts.',
    fallbackPalette: { primary: '#FFFBEB', secondary: '#EF4444', accent: '#B91C1C', eye: '#1E293B' },
    emblemShape: 'flame'
  },

  // 14. Magnemite Line
  {
    id: 'magnemite', dexNumber: 81, name: 'Magnemite', familyId: 'magnemite-line',
    stage: 1, evolvesTo: 'magneton', evolutionXpRequired: 95,
    types: ['electric', 'steel'], baseHp: 74,
    moveNames: { quick: 'Magnet Snap', power: 'Polar Pair', charge: 'Circuit Hum' },
    mathLore: 'Magnemite pairs its two horseshoe magnets to snap matching numbers together!',
    fallbackPalette: { primary: '#CBD5E1', secondary: '#38BDF8', accent: '#EF4444', eye: '#0F172A' },
    emblemShape: 'bolt'
  },
  {
    id: 'magneton', dexNumber: 82, name: 'Magneton', familyId: 'magnemite-line',
    stage: 2, evolvesTo: 'magnezone', evolutionXpRequired: 170,
    types: ['electric', 'steel'], baseHp: 112,
    moveNames: { quick: 'Tri-Spark', power: 'Triple Factor', charge: 'Magnetic Trio' },
    mathLore: 'Three Magnemite unite as Magneton—a living showcase of multiplying by 3!',
    fallbackPalette: { primary: '#94A3B8', secondary: '#60A5FA', accent: '#DC2626', eye: '#0F172A' },
    emblemShape: 'bolt'
  },
  {
    id: 'magnezone', dexNumber: 462, name: 'Magnezone', familyId: 'magnemite-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['electric', 'steel'], baseHp: 148,
    moveNames: { quick: 'Radar Ping', power: 'Flux Cannon', charge: 'Polar Matrix' },
    mathLore: 'Magnezone scans the skies with magnetic coordinates, solving complex patterns effortlessly.',
    fallbackPalette: { primary: '#64748B', secondary: '#38BDF8', accent: '#DC2626', eye: '#FACC15' },
    emblemShape: 'shield'
  },

  // 15. Gastly Line
  {
    id: 'gastly', dexNumber: 92, name: 'Gastly', familyId: 'gastly-line',
    stage: 1, evolvesTo: 'haunter', evolutionXpRequired: 95,
    types: ['ghost', 'poison'], baseHp: 72,
    moveNames: { quick: 'Mist Wink', power: 'Phantom Odd', charge: 'Shadow Riddle' },
    mathLore: 'Playful Gastly floats through cavern shadows hiding missing numbers for trainers to spot.',
    fallbackPalette: { primary: '#7C3AED', secondary: '#1E1B4B', accent: '#C4B5FD', eye: '#F8FAFC' },
    emblemShape: 'crescent'
  },
  {
    id: 'haunter', dexNumber: 93, name: 'Haunter', familyId: 'gastly-line',
    stage: 2, evolvesTo: 'gengar', evolutionXpRequired: 160,
    types: ['ghost', 'poison'], baseHp: 104,
    moveNames: { quick: 'Spooky Snap', power: 'Specter Split', charge: 'Moonlight Trick' },
    mathLore: 'Haunter juggles glowing orbs between its floating hands to show clever number swaps.',
    fallbackPalette: { primary: '#6D28D9', secondary: '#F43F5E', accent: '#2E1065', eye: '#FDE047' },
    emblemShape: 'crescent'
  },
  {
    id: 'gengar', dexNumber: 94, name: 'Gengar', familyId: 'gastly-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['ghost', 'poison'], baseHp: 140,
    moveNames: { quick: 'Shadow Grin', power: 'Hex Equation', charge: 'Midnight Nova' },
    mathLore: 'Gengar grins ear to ear whenever a trainer cracks a tricky multi-step math puzzle!',
    fallbackPalette: { primary: '#5B21B6', secondary: '#A78BFA', accent: '#1E1B4B', eye: '#EF4444' },
    emblemShape: 'crescent'
  },

  // 16. Magikarp Line
  {
    id: 'magikarp', dexNumber: 129, name: 'Magikarp', familyId: 'magikarp-line',
    stage: 1, evolvesTo: 'gyarados', evolutionXpRequired: 140,
    types: ['water'], baseHp: 64,
    moveNames: { quick: 'Happy Splash', power: 'Ripple Hop', charge: 'Patient Surge' },
    mathLore: 'Every splash of Magikarp adds steady XP toward one of the grandest evolutions in PokéMath!',
    fallbackPalette: { primary: '#F97316', secondary: '#FDE047', accent: '#C2410C', eye: '#1E293B' },
    emblemShape: 'droplet'
  },
  {
    id: 'gyarados', dexNumber: 130, name: 'Gyarados', familyId: 'magikarp-line',
    stage: 2, evolvesTo: null, evolutionXpRequired: 0,
    types: ['water', 'flying'], baseHp: 158,
    moveNames: { quick: 'Cascade Snap', power: 'Dragon Crest', charge: 'Tsunami Surge' },
    mathLore: 'Transformed through patient practice, Gyarados proves small steady steps multiply into might!',
    fallbackPalette: { primary: '#2563EB', secondary: '#FEF3C7', accent: '#DC2626', eye: '#F59E0B' },
    emblemShape: 'crescent'
  },

  // 17. Lapras (Single-Stage Classic)
  {
    id: 'lapras', dexNumber: 131, name: 'Lapras', familyId: 'lapras-line',
    stage: 1, evolvesTo: null, evolutionXpRequired: 0,
    types: ['water', 'ice'], baseHp: 148,
    moveNames: { quick: 'Frost Chime', power: 'Harbor Song', charge: 'Aurora Tide' },
    mathLore: 'Gentle Lapras ferries trainers across Harbor Lighthouse while singing skip-counting melodies.',
    fallbackPalette: { primary: '#38BDF8', secondary: '#FEF3C7', accent: '#0284C7', eye: '#1E293B' },
    emblemShape: 'droplet'
  },

  // 18. Eevee & 6 Eeveelutions
  {
    id: 'eevee', dexNumber: 133, name: 'Eevee', familyId: 'eevee-line',
    stage: 1, evolvesTo: 'vaporeon',
    evolvesToOptions: ['vaporeon', 'jolteon', 'flareon', 'espeon', 'umbreon', 'sylveon'],
    evolutionXpRequired: 120,
    types: ['normal'], baseHp: 82,
    moveNames: { quick: 'Swift Hop', power: 'Adapt Trio', charge: 'Harmony Shift' },
    mathLore: 'Eevee can branch into six elemental paths—like choosing the best strategy to solve a problem!',
    fallbackPalette: { primary: '#D97706', secondary: '#FEF3C7', accent: '#78350F', eye: '#1E293B' },
    emblemShape: 'paw'
  },
  {
    id: 'vaporeon', dexNumber: 134, name: 'Vaporeon', familyId: 'eevee-line',
    stage: 2, evolvesTo: null, evolutionXpRequired: 0,
    types: ['water'], baseHp: 144,
    moveNames: { quick: 'Aqua Veil', power: 'Tide Fraction', charge: 'Mirror Surge' },
    mathLore: 'Vaporeon blends smoothly with clean harbor water, showing how fractions join into one whole.',
    fallbackPalette: { primary: '#38BDF8', secondary: '#FEF9C3', accent: '#0369A1', eye: '#1E293B' },
    emblemShape: 'droplet'
  },
  {
    id: 'jolteon', dexNumber: 135, name: 'Jolteon', familyId: 'eevee-line',
    stage: 2, evolvesTo: null, evolutionXpRequired: 0,
    types: ['electric'], baseHp: 132,
    moveNames: { quick: 'Pin Spark', power: 'Speed Factor', charge: 'Thunder Dash' },
    mathLore: 'Jolteon zips through speed-blitz drills, doubling numbers faster than a lightning flash!',
    fallbackPalette: { primary: '#FACC15', secondary: '#FFFFFF', accent: '#A16207', eye: '#1E293B' },
    emblemShape: 'bolt'
  },
  {
    id: 'flareon', dexNumber: 136, name: 'Flareon', familyId: 'eevee-line',
    stage: 2, evolvesTo: null, evolutionXpRequired: 0,
    types: ['fire'], baseHp: 138,
    moveNames: { quick: 'Warm Cinder', power: 'Hearth Sum', charge: 'Crimson Flare' },
    mathLore: 'Flareon’s fluffy golden collar keeps numbers cozy while blazing through big totals.',
    fallbackPalette: { primary: '#EA580C', secondary: '#FDE68A', accent: '#9A3412', eye: '#1E293B' },
    emblemShape: 'flame'
  },
  {
    id: 'espeon', dexNumber: 196, name: 'Espeon', familyId: 'eevee-line',
    stage: 2, evolvesTo: null, evolutionXpRequired: 0,
    types: ['psychic'], baseHp: 134,
    moveNames: { quick: 'Sun Gem', power: 'Future Guess', charge: 'Daybreak Beam' },
    mathLore: 'The crimson gem on Espeon’s forehead predicts patterns and next terms in any sequence.',
    fallbackPalette: { primary: '#D8B4FE', secondary: '#EF4444', accent: '#7E22CE', eye: '#3B0764' },
    emblemShape: 'star'
  },
  {
    id: 'umbreon', dexNumber: 197, name: 'Umbreon', familyId: 'eevee-line',
    stage: 2, evolvesTo: null, evolutionXpRequired: 0,
    types: ['dark'], baseHp: 144,
    moveNames: { quick: 'Ring Gleam', power: 'Eclipse Balance', charge: 'Moonlit Pulse' },
    mathLore: 'Umbreon’s golden rings glow bright whenever both sides of a balanced equation match!',
    fallbackPalette: { primary: '#1E293B', secondary: '#FACC15', accent: '#0F172A', eye: '#DC2626' },
    emblemShape: 'crescent'
  },
  {
    id: 'sylveon', dexNumber: 700, name: 'Sylveon', familyId: 'eevee-line',
    stage: 2, evolvesTo: null, evolutionXpRequired: 0,
    types: ['fairy'], baseHp: 142,
    moveNames: { quick: 'Ribbon Wave', power: 'Kindness Bond', charge: 'Prism Starlight' },
    mathLore: 'Sylveon wraps playful ribbons into neat equal groups, cheering on every brave learner!',
    fallbackPalette: { primary: '#FBCFE8', secondary: '#60A5FA', accent: '#DB2777', eye: '#2563EB' },
    emblemShape: 'star'
  },

  // 19. Dratini Line
  {
    id: 'dratini', dexNumber: 147, name: 'Dratini', familyId: 'dratini-line',
    stage: 1, evolvesTo: 'dragonair', evolutionXpRequired: 120,
    types: ['dragon'], baseHp: 82,
    moveNames: { quick: 'River Glide', power: 'Scale Count', charge: 'Dragon Ripple' },
    mathLore: 'Dratini glides peacefully beneath waterfalls, learning equal sharing from the current.',
    fallbackPalette: { primary: '#60A5FA', secondary: '#F8FAFC', accent: '#1D4ED8', eye: '#1E293B' },
    emblemShape: 'crescent'
  },
  {
    id: 'dragonair', dexNumber: 148, name: 'Dragonair', familyId: 'dratini-line',
    stage: 2, evolvesTo: 'dragonite', evolutionXpRequired: 200,
    types: ['dragon'], baseHp: 118,
    moveNames: { quick: 'Pearl Shine', power: 'Sky Ribbon', charge: 'Celestial Wave' },
    mathLore: 'Crystal orbs along Dragonair’s neck shimmer when tricky fractions simplify cleanly.',
    fallbackPalette: { primary: '#3B82F6', secondary: '#E0F2FE', accent: '#1E40AF', eye: '#1E293B' },
    emblemShape: 'crescent'
  },
  {
    id: 'dragonite', dexNumber: 149, name: 'Dragonite', familyId: 'dratini-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['dragon', 'flying'], baseHp: 162,
    moveNames: { quick: 'Gale Wing', power: 'Summit Spiral', charge: 'Draconic Harmony' },
    mathLore: 'Kind-hearted Dragonite circles the globe in 16 hours, guiding lost travelers with compass math!',
    fallbackPalette: { primary: '#F59E0B', secondary: '#FEF3C7', accent: '#15803D', eye: '#1E293B' },
    emblemShape: 'wing'
  },

  // 20. Chikorita Line
  {
    id: 'chikorita', dexNumber: 152, name: 'Chikorita', familyId: 'chikorita-line',
    stage: 1, evolvesTo: 'bayleef', evolutionXpRequired: 100,
    types: ['grass'], baseHp: 80,
    moveNames: { quick: 'Leaf Twirl', power: 'Sweet Sum', charge: 'Sunbeam Sprout' },
    mathLore: 'Chikorita’s fragrant leaf gently nods whenever a trainer builds a ten-frame perfectly.',
    fallbackPalette: { primary: '#A3E635', secondary: '#4ADE80', accent: '#3F6212', eye: '#DC2626' },
    emblemShape: 'leaf'
  },
  {
    id: 'bayleef', dexNumber: 153, name: 'Bayleef', familyId: 'chikorita-line',
    stage: 2, evolvesTo: 'meganium', evolutionXpRequired: 160,
    types: ['grass'], baseHp: 112,
    moveNames: { quick: 'Aroma Tap', power: 'Vine Wreath', charge: 'Meadow Boost' },
    mathLore: 'Curled spicy leaves around Bayleef’s neck form a cozy ring of ten bright buds.',
    fallbackPalette: { primary: '#FEF08A', secondary: '#22C55E', accent: '#15803D', eye: '#DC2626' },
    emblemShape: 'leaf'
  },
  {
    id: 'meganium', dexNumber: 154, name: 'Meganium', familyId: 'chikorita-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['grass'], baseHp: 150,
    moveNames: { quick: 'Petal Breeze', power: 'Bloom Array', charge: 'Verdant Revival' },
    mathLore: 'Meganium’s gentle breath restores tired plants—and tired brains—during long math quests!',
    fallbackPalette: { primary: '#4ADE80', secondary: '#FB7185', accent: '#166534', eye: '#F59E0B' },
    emblemShape: 'leaf'
  },

  // 21. Cyndaquil Line
  {
    id: 'cyndaquil', dexNumber: 155, name: 'Cyndaquil', familyId: 'cyndaquil-line',
    stage: 1, evolvesTo: 'quilava', evolutionXpRequired: 100,
    types: ['fire'], baseHp: 78,
    moveNames: { quick: 'Spark Puff', power: 'Backfire Plus', charge: 'Cozy Flame' },
    mathLore: 'Shy Cyndaquil lights up four bright back-flames whenever it solves a warm-up sum.',
    fallbackPalette: { primary: '#FEF3C7', secondary: '#1E3A8A', accent: '#F97316', eye: '#1E293B' },
    emblemShape: 'flame'
  },
  {
    id: 'quilava', dexNumber: 156, name: 'Quilava', familyId: 'cyndaquil-line',
    stage: 2, evolvesTo: 'typhlosion', evolutionXpRequired: 160,
    types: ['fire'], baseHp: 108,
    moveNames: { quick: 'Dash Spark', power: 'Heat Difference', charge: 'Flame Wheel' },
    mathLore: 'Agile Quilava darts around boulders while tracking distances down to the single meter.',
    fallbackPalette: { primary: '#FDE68A', secondary: '#1E40AF', accent: '#EF4444', eye: '#B91C1C' },
    emblemShape: 'flame'
  },
  {
    id: 'typhlosion', dexNumber: 157, name: 'Typhlosion', familyId: 'cyndaquil-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['fire'], baseHp: 150,
    moveNames: { quick: 'Cinder Roar', power: 'Eruption Product', charge: 'Volcanic Surge' },
    mathLore: 'Typhlosion’s blazing collar erupts with peak warmth at the end of a champion streak!',
    fallbackPalette: { primary: '#1E3A8A', secondary: '#FEF08A', accent: '#EA580C', eye: '#DC2626' },
    emblemShape: 'flame'
  },

  // 22. Totodile Line
  {
    id: 'totodile', dexNumber: 158, name: 'Totodile', familyId: 'totodile-line',
    stage: 1, evolvesTo: 'croconaw', evolutionXpRequired: 100,
    types: ['water'], baseHp: 82,
    moveNames: { quick: 'Chomp Tap', power: 'Splash Skip', charge: 'River Snap' },
    mathLore: 'Energetic Totodile chomps rhythmically in twos and fours along sunny riverbanks!',
    fallbackPalette: { primary: '#38BDF8', secondary: '#FEF08A', accent: '#EF4444', eye: '#DC2626' },
    emblemShape: 'droplet'
  },
  {
    id: 'croconaw', dexNumber: 159, name: 'Croconaw', familyId: 'totodile-line',
    stage: 2, evolvesTo: 'feraligatr', evolutionXpRequired: 160,
    types: ['water'], baseHp: 114,
    moveNames: { quick: 'Jaw Crunch', power: 'Scale Compare', charge: 'Rapids Fang' },
    mathLore: 'Croconaw’s speckled crest looks like an adventure map filled with counting stones.',
    fallbackPalette: { primary: '#2563EB', secondary: '#FDE047', accent: '#DC2626', eye: '#DC2626' },
    emblemShape: 'droplet'
  },
  {
    id: 'feraligatr', dexNumber: 160, name: 'Feraligatr', familyId: 'totodile-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['water'], baseHp: 154,
    moveNames: { quick: 'Wave Snap', power: 'Aqua Multiplier', charge: 'Cascade Crush' },
    mathLore: 'Feraligatr charges across fierce currents, splitting waves with unstoppable momentum.',
    fallbackPalette: { primary: '#1D4ED8', secondary: '#FEF08A', accent: '#DC2626', eye: '#EF4444' },
    emblemShape: 'droplet'
  },

  // 23. Togepi Line
  {
    id: 'togepi', dexNumber: 175, name: 'Togepi', familyId: 'togepi-line',
    stage: 1, evolvesTo: 'togetic', evolutionXpRequired: 85,
    types: ['fairy'], baseHp: 74,
    moveNames: { quick: 'Egg Wobble', power: 'Joyful Bond', charge: 'Lucky Charm' },
    mathLore: 'Red and blue triangles on Togepi’s shell make a cheerful geometry pattern!',
    fallbackPalette: { primary: '#FFFBEB', secondary: '#EF4444', accent: '#3B82F6', eye: '#1E293B' },
    emblemShape: 'star'
  },
  {
    id: 'togetic', dexNumber: 176, name: 'Togetic', familyId: 'togepi-line',
    stage: 2, evolvesTo: 'togekiss', evolutionXpRequired: 160,
    types: ['fairy', 'flying'], baseHp: 108,
    moveNames: { quick: 'Wing Flutter', power: 'Fairy Dust', charge: 'Heartlight' },
    mathLore: 'Togetic floats beside trainers who cheer on their buddies after every honest try.',
    fallbackPalette: { primary: '#F8FAFC', secondary: '#EF4444', accent: '#2563EB', eye: '#1E293B' },
    emblemShape: 'wing'
  },
  {
    id: 'togekiss', dexNumber: 468, name: 'Togekiss', familyId: 'togepi-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['fairy', 'flying'], baseHp: 146,
    moveNames: { quick: 'Sky Blessing', power: 'Aura Echo', charge: 'Jubilee Flight' },
    mathLore: 'Togekiss glides through peaceful mountain skies bringing good fortune to curious minds.',
    fallbackPalette: { primary: '#FFFFFF', secondary: '#3B82F6', accent: '#EF4444', eye: '#1E293B' },
    emblemShape: 'wing'
  },

  // 24. Mareep Line
  {
    id: 'mareep', dexNumber: 179, name: 'Mareep', familyId: 'mareep-line',
    stage: 1, evolvesTo: 'flaaffy', evolutionXpRequired: 95,
    types: ['electric'], baseHp: 78,
    moveNames: { quick: 'Wool Puff', power: 'Static Count', charge: 'Amber Glow' },
    mathLore: 'Mareep’s fluffy fleece doubles in warmth—and glow—as you count cozy sheep by 2s!',
    fallbackPalette: { primary: '#FEF08A', secondary: '#1E3A8A', accent: '#F97316', eye: '#1E293B' },
    emblemShape: 'bolt'
  },
  {
    id: 'flaaffy', dexNumber: 180, name: 'Flaaffy', familyId: 'mareep-line',
    stage: 2, evolvesTo: 'ampharos', evolutionXpRequired: 160,
    types: ['electric'], baseHp: 110,
    moveNames: { quick: 'Spark Hop', power: 'Coil Charge', charge: 'Beacon Orb' },
    mathLore: 'Flaaffy stores electricity neatly in its glowing tail sphere like a battery bank.',
    fallbackPalette: { primary: '#F9A8D4', secondary: '#FEF9C3', accent: '#3B82F6', eye: '#1E293B' },
    emblemShape: 'bolt'
  },
  {
    id: 'ampharos', dexNumber: 181, name: 'Ampharos', familyId: 'mareep-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['electric'], baseHp: 148,
    moveNames: { quick: 'Beacon Flash', power: 'Lighthouse Array', charge: 'Solar Volt' },
    mathLore: 'Ampharos’s bright tail shines miles across the harbor, guiding ships with steady counts!',
    fallbackPalette: { primary: '#FACC15', secondary: '#FEF9C3', accent: '#DC2626', eye: '#1E293B' },
    emblemShape: 'bolt'
  },

  // 25. Azurill / Marill / Azumarill Line
  {
    id: 'azurill', dexNumber: 298, name: 'Azurill', familyId: 'marill-line',
    stage: 1, evolvesTo: 'marill', evolutionXpRequired: 75,
    types: ['normal', 'fairy'], baseHp: 72,
    moveNames: { quick: 'Tail Bounce', power: 'Bubble Hop', charge: 'Spring Spin' },
    mathLore: 'Azurill bounces off its giant blue tail orb like a cheerful living number line marker!',
    fallbackPalette: { primary: '#60A5FA', secondary: '#F8FAFC', accent: '#1D4ED8', eye: '#1E293B' },
    emblemShape: 'droplet'
  },
  {
    id: 'marill', dexNumber: 183, name: 'Marill', familyId: 'marill-line',
    stage: 2, evolvesTo: 'azumarill', evolutionXpRequired: 140,
    types: ['water', 'fairy'], baseHp: 108,
    moveNames: { quick: 'Aqua Bob', power: 'Buoy Pair', charge: 'Splash Ring' },
    mathLore: 'Marill’s round tail floats like a bright marker keeping track of fractions on the water.',
    fallbackPalette: { primary: '#3B82F6', secondary: '#F8FAFC', accent: '#FB7185', eye: '#1E293B' },
    emblemShape: 'droplet'
  },
  {
    id: 'azumarill', dexNumber: 184, name: 'Azumarill', familyId: 'marill-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['water', 'fairy'], baseHp: 146,
    moveNames: { quick: 'Bubble Barrage', power: 'Double Power', charge: 'Tidal Bubble' },
    mathLore: 'Azumarill’s bubble pattern doubles its strength—just like mastering your 2x times tables!',
    fallbackPalette: { primary: '#2563EB', secondary: '#FFFFFF', accent: '#F472B6', eye: '#1E293B' },
    emblemShape: 'droplet'
  },

  // 26. Treecko Line
  {
    id: 'treecko', dexNumber: 252, name: 'Treecko', familyId: 'treecko-line',
    stage: 1, evolvesTo: 'grovyle', evolutionXpRequired: 100,
    types: ['grass'], baseHp: 78,
    moveNames: { quick: 'Twig Flick', power: 'Canopy Hop', charge: 'Emerald Bond' },
    mathLore: 'Calm Treecko climbs vertical trunks counting every branch by neat threes.',
    fallbackPalette: { primary: '#4ADE80', secondary: '#EF4444', accent: '#166534', eye: '#FACC15' },
    emblemShape: 'leaf'
  },
  {
    id: 'grovyle', dexNumber: 253, name: 'Grovyle', familyId: 'treecko-line',
    stage: 2, evolvesTo: 'sceptile', evolutionXpRequired: 160,
    types: ['grass'], baseHp: 108,
    moveNames: { quick: 'Leaf Dash', power: 'Branch Factor', charge: 'Forest Blade' },
    mathLore: 'Grovyle leaps from treetop to treetop estimating exact gaps in a heartbeat.',
    fallbackPalette: { primary: '#22C55E', secondary: '#EF4444', accent: '#14532D', eye: '#FACC15' },
    emblemShape: 'leaf'
  },
  {
    id: 'sceptile', dexNumber: 254, name: 'Sceptile', familyId: 'treecko-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['grass'], baseHp: 146,
    moveNames: { quick: 'Swift Blade', power: 'Seed Matrix', charge: 'Jungle Storm' },
    mathLore: 'Golden orbs on Sceptile’s back store sun-ripened energy in symmetrical rows.',
    fallbackPalette: { primary: '#16A34A', secondary: '#FACC15', accent: '#DC2626', eye: '#F59E0B' },
    emblemShape: 'leaf'
  },

  // 27. Torchic Line
  {
    id: 'torchic', dexNumber: 255, name: 'Torchic', familyId: 'torchic-line',
    stage: 1, evolvesTo: 'combusken', evolutionXpRequired: 100,
    types: ['fire'], baseHp: 78,
    moveNames: { quick: 'Chirp Peck', power: 'Feather Spark', charge: 'Sunny Ember' },
    mathLore: 'Fluffy Torchic toddles along behind its trainer counting cheerful little footsteps.',
    fallbackPalette: { primary: '#FB923C', secondary: '#FEF08A', accent: '#EA580C', eye: '#1E293B' },
    emblemShape: 'flame'
  },
  {
    id: 'combusken', dexNumber: 256, name: 'Combusken', familyId: 'torchic-line',
    stage: 2, evolvesTo: 'blaziken', evolutionXpRequired: 160,
    types: ['fire', 'fighting'], baseHp: 110,
    moveNames: { quick: 'Double Kick', power: 'Talon Tally', charge: 'Sky Flare' },
    mathLore: 'Combusken practices ten rapid kicks per second—precision timing meets fiery focus!',
    fallbackPalette: { primary: '#F97316', secondary: '#FDE047', accent: '#B91C1C', eye: '#1E293B' },
    emblemShape: 'flame'
  },
  {
    id: 'blaziken', dexNumber: 257, name: 'Blaziken', familyId: 'torchic-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['fire', 'fighting'], baseHp: 150,
    moveNames: { quick: 'Blaze Kick', power: 'Combo Surge', charge: 'Phoenix Nova' },
    mathLore: 'Blaziken clears towering ledges in a single calculated leap of courage!',
    fallbackPalette: { primary: '#DC2626', secondary: '#FEF3C7', accent: '#F59E0B', eye: '#38BDF8' },
    emblemShape: 'flame'
  },

  // 28. Mudkip Line
  {
    id: 'mudkip', dexNumber: 258, name: 'Mudkip', familyId: 'mudkip-line',
    stage: 1, evolvesTo: 'marshtomp', evolutionXpRequired: 100,
    types: ['water'], baseHp: 82,
    moveNames: { quick: 'Fin Radar', power: 'Muddy Skip', charge: 'Stream Pulse' },
    mathLore: 'The fin atop Mudkip’s head works like a sensor, detecting patterns in gentle ripples.',
    fallbackPalette: { primary: '#38BDF8', secondary: '#FB923C', accent: '#0369A1', eye: '#1E293B' },
    emblemShape: 'droplet'
  },
  {
    id: 'marshtomp', dexNumber: 259, name: 'Marshtomp', familyId: 'mudkip-line',
    stage: 2, evolvesTo: 'swampert', evolutionXpRequired: 160,
    types: ['water', 'ground'], baseHp: 114,
    moveNames: { quick: 'Marsh Step', power: 'Delta Pair', charge: 'Mud Surge' },
    mathLore: 'Marshtomp bridges land and water, linking place-value tens and ones cleanly.',
    fallbackPalette: { primary: '#0EA5E9', secondary: '#F97316', accent: '#1E3A8A', eye: '#1E293B' },
    emblemShape: 'droplet'
  },
  {
    id: 'swampert', dexNumber: 260, name: 'Swampert', familyId: 'mudkip-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['water', 'ground'], baseHp: 156,
    moveNames: { quick: 'River Guard', power: 'Earth Tidal', charge: 'Hydro Anchor' },
    mathLore: 'Mighty Swampert predicts ocean storms miles away using steady atmospheric math.',
    fallbackPalette: { primary: '#0284C7', secondary: '#EA580C', accent: '#0F172A', eye: '#FACC15' },
    emblemShape: 'shield'
  },

  // 29. Ralts Line
  {
    id: 'ralts', dexNumber: 280, name: 'Ralts', familyId: 'ralts-line',
    stage: 1, evolvesTo: 'kirlia', evolutionXpRequired: 95,
    types: ['psychic', 'fairy'], baseHp: 72,
    moveNames: { quick: 'Sense Pulse', power: 'Heart Chime', charge: 'Quiet Prism' },
    mathLore: 'Ralts senses happy breakthroughs whenever a tricky math puzzle suddenly clicks!',
    fallbackPalette: { primary: '#F8FAFC', secondary: '#4ADE80', accent: '#FB7185', eye: '#DC2626' },
    emblemShape: 'gem'
  },
  {
    id: 'kirlia', dexNumber: 281, name: 'Kirlia', familyId: 'ralts-line',
    stage: 2, evolvesTo: 'gardevoir', evolutionXpRequired: 165,
    types: ['psychic', 'fairy'], baseHp: 106,
    moveNames: { quick: 'Twirl Step', power: 'Mirage Arc', charge: 'Ribbon Glow' },
    mathLore: 'Kirlia pirouettes in neat 90-degree turns, making geometry feel like a joyful dance.',
    fallbackPalette: { primary: '#F8FAFC', secondary: '#22C55E', accent: '#F43F5E', eye: '#DC2626' },
    emblemShape: 'star'
  },
  {
    id: 'gardevoir', dexNumber: 282, name: 'Gardevoir', familyId: 'ralts-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['psychic', 'fairy'], baseHp: 146,
    moveNames: { quick: 'Astral Gleam', power: 'Moon Orbit', charge: 'Starlight Shield' },
    mathLore: 'Gardevoir bends space gracefully to protect its trainer through the toughest champion trials.',
    fallbackPalette: { primary: '#F8FAFC', secondary: '#4ADE80', accent: '#E11D48', eye: '#EF4444' },
    emblemShape: 'star'
  },

  // 30. Shinx Line
  {
    id: 'shinx', dexNumber: 403, name: 'Shinx', familyId: 'shinx-line',
    stage: 1, evolvesTo: 'luxio', evolutionXpRequired: 95,
    types: ['electric'], baseHp: 78,
    moveNames: { quick: 'Star Tail', power: 'Spark Pounce', charge: 'Flash Cub' },
    mathLore: 'Shinx’s star-tipped tail flashes brightly whenever you answer on a glowing streak!',
    fallbackPalette: { primary: '#60A5FA', secondary: '#1E293B', accent: '#FACC15', eye: '#FDE047' },
    emblemShape: 'paw'
  },
  {
    id: 'luxio', dexNumber: 404, name: 'Luxio', familyId: 'shinx-line',
    stage: 2, evolvesTo: 'luxray', evolutionXpRequired: 160,
    types: ['electric'], baseHp: 112,
    moveNames: { quick: 'Claw Zap', power: 'Group Surge', charge: 'Volt Pack' },
    mathLore: 'Luxio links tails with friends to multiply electric strength across the whole pack.',
    fallbackPalette: { primary: '#3B82F6', secondary: '#0F172A', accent: '#FACC15', eye: '#FDE047' },
    emblemShape: 'bolt'
  },
  {
    id: 'luxray', dexNumber: 405, name: 'Luxray', familyId: 'shinx-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['electric'], baseHp: 148,
    moveNames: { quick: 'Sight Beam', power: 'X-Ray Factor', charge: 'Thunder Pride' },
    mathLore: 'With glowing golden eyes, Luxray sees straight through disguised number mysteries!',
    fallbackPalette: { primary: '#1E293B', secondary: '#2563EB', accent: '#FACC15', eye: '#F59E0B' },
    emblemShape: 'bolt'
  },

  // 31. Gible Line
  {
    id: 'gible', dexNumber: 443, name: 'Gible', familyId: 'gible-line',
    stage: 1, evolvesTo: 'gabite', evolutionXpRequired: 120,
    types: ['dragon', 'ground'], baseHp: 84,
    moveNames: { quick: 'Sand Snap', power: 'Cavern Bite', charge: 'Pebble Rush' },
    mathLore: 'Curious Gible nibbles shiny quartz rocks and sorts them neatly by size.',
    fallbackPalette: { primary: '#3B82F6', secondary: '#EF4444', accent: '#1E3A8A', eye: '#1E293B' },
    emblemShape: 'crescent'
  },
  {
    id: 'gabite', dexNumber: 444, name: 'Gabite', familyId: 'gible-line',
    stage: 2, evolvesTo: 'garchomp', evolutionXpRequired: 200,
    types: ['dragon', 'ground'], baseHp: 120,
    moveNames: { quick: 'Gem Slash', power: 'Crystal Array', charge: 'Canyon Dive' },
    mathLore: 'Gabite polishes glowing cave gems and arranges its treasure hoard in even rows.',
    fallbackPalette: { primary: '#2563EB', secondary: '#DC2626', accent: '#FACC15', eye: '#F59E0B' },
    emblemShape: 'crescent'
  },
  {
    id: 'garchomp', dexNumber: 445, name: 'Garchomp', familyId: 'gible-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['dragon', 'ground'], baseHp: 164,
    moveNames: { quick: 'Jet Wing', power: 'Mach Multiplier', charge: 'Summit Meteor' },
    mathLore: 'Racing like a jet across Victory Summit, Garchomp masters every champion operation!',
    fallbackPalette: { primary: '#1D4ED8', secondary: '#EF4444', accent: '#FACC15', eye: '#F59E0B' },
    emblemShape: 'crescent'
  },

  // 32. Riolu Line
  {
    id: 'riolu', dexNumber: 447, name: 'Riolu', familyId: 'riolu-line',
    stage: 1, evolvesTo: 'lucario', evolutionXpRequired: 130,
    types: ['fighting'], baseHp: 80,
    moveNames: { quick: 'Aura Tap', power: 'Focus Step', charge: 'Heart Pulse' },
    mathLore: 'Brave Riolu senses aura ripples and stays calm even when a tough equation appears.',
    fallbackPalette: { primary: '#3B82F6', secondary: '#1E293B', accent: '#FDE047', eye: '#DC2626' },
    emblemShape: 'shield'
  },
  {
    id: 'lucario', dexNumber: 448, name: 'Lucario', familyId: 'riolu-line',
    stage: 2, evolvesTo: null, evolutionXpRequired: 0,
    types: ['fighting', 'steel'], baseHp: 148,
    moveNames: { quick: 'Steel Palm', power: 'Aura Balance', charge: 'Sphere of Ten' },
    mathLore: 'Lucario channels glowing Aura Spheres by balancing focus, breath, and clean logic.',
    fallbackPalette: { primary: '#2563EB', secondary: '#FEF3C7', accent: '#1E293B', eye: '#DC2626' },
    emblemShape: 'shield'
  },

  // 33. Froakie Line
  {
    id: 'froakie', dexNumber: 656, name: 'Froakie', familyId: 'froakie-line',
    stage: 1, evolvesTo: 'frogadier', evolutionXpRequired: 100,
    types: ['water'], baseHp: 78,
    moveNames: { quick: 'Foam Hop', power: 'Bubble Skip', charge: 'Frubbles Ring' },
    mathLore: 'Froakie counts springy frubbles around its collar before bounding across harbor docks.',
    fallbackPalette: { primary: '#38BDF8', secondary: '#F8FAFC', accent: '#1D4ED8', eye: '#FACC15' },
    emblemShape: 'droplet'
  },
  {
    id: 'frogadier', dexNumber: 657, name: 'Frogadier', familyId: 'froakie-line',
    stage: 2, evolvesTo: 'greninja', evolutionXpRequired: 165,
    types: ['water'], baseHp: 110,
    moveNames: { quick: 'Swift Bounce', power: 'Foam Factor', charge: 'Tower Leap' },
    mathLore: 'Agile Frogadier scales lighthouse towers in equal measured bounds.',
    fallbackPalette: { primary: '#0EA5E9', secondary: '#F8FAFC', accent: '#1E3A8A', eye: '#FACC15' },
    emblemShape: 'droplet'
  },
  {
    id: 'greninja', dexNumber: 658, name: 'Greninja', familyId: 'froakie-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['water', 'dark'], baseHp: 148,
    moveNames: { quick: 'Mist Dash', power: 'Water Shuriken', charge: 'Starry Surge' },
    mathLore: 'Greninja throws four-pointed water stars in rapid multi-hit math combinations!',
    fallbackPalette: { primary: '#1E3A8A', secondary: '#FB7185', accent: '#FEF08A', eye: '#EF4444' },
    emblemShape: 'star'
  },

  // 34. Rowlet Line
  {
    id: 'rowlet', dexNumber: 722, name: 'Rowlet', familyId: 'rowlet-line',
    stage: 1, evolvesTo: 'dartrix', evolutionXpRequired: 100,
    types: ['grass', 'flying'], baseHp: 82,
    moveNames: { quick: 'Leaf Feather', power: 'Bowtie Tally', charge: 'Silent Swoop' },
    mathLore: 'Cozy Rowlet adjusts its two-leaf bowtie and hoots softly whenever you make a ten!',
    fallbackPalette: { primary: '#FEF3C7', secondary: '#4ADE80', accent: '#92400E', eye: '#1E293B' },
    emblemShape: 'wing'
  },
  {
    id: 'dartrix', dexNumber: 723, name: 'Dartrix', familyId: 'rowlet-line',
    stage: 2, evolvesTo: 'decidueye', evolutionXpRequired: 160,
    types: ['grass', 'flying'], baseHp: 112,
    moveNames: { quick: 'Quill Flick', power: 'Sharp Angle', charge: 'Plume Dart' },
    mathLore: 'Neat Dartrix aligns every feather cleanly before launching pinpoint blade-quills.',
    fallbackPalette: { primary: '#F8FAFC', secondary: '#22C55E', accent: '#78350F', eye: '#1E293B' },
    emblemShape: 'wing'
  },
  {
    id: 'decidueye', dexNumber: 724, name: 'Decidueye', familyId: 'rowlet-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['grass', 'ghost'], baseHp: 148,
    moveNames: { quick: 'Arrow Quiver', power: 'Spirit Shackle', charge: 'Forest Bullseye' },
    mathLore: 'Decidueye calculates wind arcs to hit the exact bullseye on a number line from afar!',
    fallbackPalette: { primary: '#15803D', secondary: '#FEF3C7', accent: '#F97316', eye: '#DC2626' },
    emblemShape: 'wing'
  },

  // 35. Sprigatito Line
  {
    id: 'sprigatito', dexNumber: 906, name: 'Sprigatito', familyId: 'sprigatito-line',
    stage: 1, evolvesTo: 'floragato', evolutionXpRequired: 100,
    types: ['grass'], baseHp: 78,
    moveNames: { quick: 'Clover Paw', power: 'Sweet Leaf', charge: 'Meadow Pounce' },
    mathLore: 'Playful Sprigatito pats soft dewdrop counters with its grassy paws to add smoothly.',
    fallbackPalette: { primary: '#86EFAC', secondary: '#16A34A', accent: '#15803D', eye: '#EC4899' },
    emblemShape: 'paw'
  },
  {
    id: 'floragato', dexNumber: 907, name: 'Floragato', familyId: 'sprigatito-line',
    stage: 2, evolvesTo: 'meowscarada', evolutionXpRequired: 160,
    types: ['grass'], baseHp: 110,
    moveNames: { quick: 'Vine Whip', power: 'Bud Yo-Yo', charge: 'Blossom Spin' },
    mathLore: 'Floragato spins its flower yo-yo in steady loops, counting each orbit cleanly.',
    fallbackPalette: { primary: '#4ADE80', secondary: '#EC4899', accent: '#166534', eye: '#DB2777' },
    emblemShape: 'leaf'
  },
  {
    id: 'meowscarada', dexNumber: 908, name: 'Meowscarada', familyId: 'sprigatito-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['grass', 'dark'], baseHp: 148,
    moveNames: { quick: 'Petal Trick', power: 'Flower Prism', charge: 'Grand Finale' },
    mathLore: 'A master illusionist, Meowscarada reveals hidden missing addends with a flourish!',
    fallbackPalette: { primary: '#22C55E', secondary: '#1E293B', accent: '#EC4899', eye: '#EC4899' },
    emblemShape: 'star'
  },

  // 36. Fuecoco Line
  {
    id: 'fuecoco', dexNumber: 909, name: 'Fuecoco', familyId: 'fuecoco-line',
    stage: 1, evolvesTo: 'crocalor', evolutionXpRequired: 100,
    types: ['fire'], baseHp: 84,
    moveNames: { quick: 'Snack Crunch', power: 'Berry Warmth', charge: 'Toasty Tune' },
    mathLore: 'Cheerful Fuecoco loves counting sweet berries before roasting them to a cozy warmth!',
    fallbackPalette: { primary: '#EF4444', secondary: '#FEF3C7', accent: '#FACC15', eye: '#1E293B' },
    emblemShape: 'flame'
  },
  {
    id: 'crocalor', dexNumber: 910, name: 'Crocalor', familyId: 'fuecoco-line',
    stage: 2, evolvesTo: 'skeledirge', evolutionXpRequired: 160,
    types: ['fire'], baseHp: 116,
    moveNames: { quick: 'Flame Beat', power: 'Sombrero Spark', charge: 'Chorus Flare' },
    mathLore: 'The little fireball bird perched atop Crocalor keeps perfect tempo for counting songs.',
    fallbackPalette: { primary: '#DC2626', secondary: '#FEF08A', accent: '#F97316', eye: '#1E293B' },
    emblemShape: 'flame'
  },
  {
    id: 'skeledirge', dexNumber: 911, name: 'Skeledirge', familyId: 'fuecoco-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['fire', 'ghost'], baseHp: 156,
    moveNames: { quick: 'Torch Song', power: 'Crescendo Sum', charge: 'Symphony Blaze' },
    mathLore: 'Skeledirge’s echoing song powers up step by step—each correct note adds +1 resonance!',
    fallbackPalette: { primary: '#B91C1C', secondary: '#F8FAFC', accent: '#F59E0B', eye: '#F59E0B' },
    emblemShape: 'flame'
  },

  // 37. Quaxly Line
  {
    id: 'quaxly', dexNumber: 912, name: 'Quaxly', familyId: 'quaxly-line',
    stage: 1, evolvesTo: 'quaxwell', evolutionXpRequired: 100,
    types: ['water'], baseHp: 80,
    moveNames: { quick: 'Tide Step', power: 'Neat Crest', charge: 'Harbor Splash' },
    mathLore: 'Tidy Quaxly grooms its wavy blue crest and lines up shiny pebbles in exact order.',
    fallbackPalette: { primary: '#F8FAFC', secondary: '#38BDF8', accent: '#1D4ED8', eye: '#1E293B' },
    emblemShape: 'droplet'
  },
  {
    id: 'quaxwell', dexNumber: 913, name: 'Quaxwell', familyId: 'quaxly-line',
    stage: 2, evolvesTo: 'quaquaval', evolutionXpRequired: 160,
    types: ['water'], baseHp: 112,
    moveNames: { quick: 'Step Rhythm', power: 'Wave Pivot', charge: 'Dockside Spin' },
    mathLore: 'Quaxwell practices disciplined dance steps in crisp 4-beat and 8-beat patterns.',
    fallbackPalette: { primary: '#E0F2FE', secondary: '#2563EB', accent: '#0369A1', eye: '#1E293B' },
    emblemShape: 'droplet'
  },
  {
    id: 'quaquaval', dexNumber: 914, name: 'Quaquaval', familyId: 'quaxly-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['water', 'fighting'], baseHp: 150,
    moveNames: { quick: 'Aqua Step', power: 'Carnival Array', charge: 'Torrent Finale' },
    mathLore: 'Quaquaval swirls water plumes into shimmering fans that showcase dazzling symmetry!',
    fallbackPalette: { primary: '#1D4ED8', secondary: '#F8FAFC', accent: '#EC4899', eye: '#F59E0B' },
    emblemShape: 'wing'
  },

  // 38. Pawmi Line
  {
    id: 'pawmi', dexNumber: 921, name: 'Pawmi', familyId: 'pawmi-line',
    stage: 1, evolvesTo: 'pawmo', evolutionXpRequired: 90,
    types: ['electric'], baseHp: 74,
    moveNames: { quick: 'Cheek Rub', power: 'Pad Spark', charge: 'Cozy Zap' },
    mathLore: 'Pawmi charges its soft paw pads by counting high-fives in sets of two!',
    fallbackPalette: { primary: '#FB923C', secondary: '#FEF08A', accent: '#EA580C', eye: '#1E293B' },
    emblemShape: 'paw'
  },
  {
    id: 'pawmo', dexNumber: 922, name: 'Pawmo', familyId: 'pawmi-line',
    stage: 2, evolvesTo: 'pawmot', evolutionXpRequired: 155,
    types: ['electric', 'fighting'], baseHp: 108,
    moveNames: { quick: 'Hop Jab', power: 'Volt Twin', charge: 'Rally Spark' },
    mathLore: 'Standing tall on two feet, Pawmo claps rhythms to solve times tables with ease.',
    fallbackPalette: { primary: '#F97316', secondary: '#FEF9C3', accent: '#1E293B', eye: '#1E293B' },
    emblemShape: 'paw'
  },
  {
    id: 'pawmot', dexNumber: 923, name: 'Pawmot', familyId: 'pawmi-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['electric', 'fighting'], baseHp: 146,
    moveNames: { quick: 'Double Shock', power: 'Revive Spark', charge: 'Dynamo Pulse' },
    mathLore: 'Pawmot shares overflowing electrical encouragement whenever a buddy needs a fresh start!',
    fallbackPalette: { primary: '#EA580C', secondary: '#FDE047', accent: '#7C2D12', eye: '#1E293B' },
    emblemShape: 'bolt'
  },

  // 39. Tinkatink Line
  {
    id: 'tinkatink', dexNumber: 957, name: 'Tinkatink', familyId: 'tinkatink-line',
    stage: 1, evolvesTo: 'tinkatuff', evolutionXpRequired: 95,
    types: ['fairy', 'steel'], baseHp: 78,
    moveNames: { quick: 'Rattle Tap', power: 'Tiny Hammer', charge: 'Forge Spark' },
    mathLore: 'Tinkatink hammers tiny steel scraps together until every piece adds up just right!',
    fallbackPalette: { primary: '#F9A8D4', secondary: '#94A3B8', accent: '#BE185D', eye: '#1E293B' },
    emblemShape: 'shield'
  },
  {
    id: 'tinkatuff', dexNumber: 958, name: 'Tinkatuff', familyId: 'tinkatink-line',
    stage: 2, evolvesTo: 'tinkaton', evolutionXpRequired: 165,
    types: ['fairy', 'steel'], baseHp: 112,
    moveNames: { quick: 'Anvil Clang', power: 'Steel Balance', charge: 'Craft Smash' },
    mathLore: 'Tinkatuff weighs steel ingots on a giant scale to compare larger and smaller values.',
    fallbackPalette: { primary: '#F472B6', secondary: '#64748B', accent: '#9D174D', eye: '#1E293B' },
    emblemShape: 'shield'
  },
  {
    id: 'tinkaton', dexNumber: 959, name: 'Tinkaton', familyId: 'tinkatink-line',
    stage: 3, evolvesTo: null, evolutionXpRequired: 0,
    types: ['fairy', 'steel'], baseHp: 152,
    moveNames: { quick: 'Hammer Swing', power: 'Gigaton Sum', charge: 'Starlight Anvil' },
    mathLore: 'Wielding a mighty 220-pound hammer, Tinkaton proves heavy math problems can be super fun!',
    fallbackPalette: { primary: '#EC4899', secondary: '#475569', accent: '#831843', eye: '#1E293B' },
    emblemShape: 'shield'
  }
];

export const POKEMON_ROSTER = RAW_ROSTER.map(createEntry);

export const POKEMON_BY_ID = Object.fromEntries(POKEMON_ROSTER.map((p) => [p.id, p]));

export function getPokemonById(id) {
  if (!id || typeof id !== 'string') return null;
  return POKEMON_BY_ID[id] || null;
}

export function getEvolutionChain(id) {
  const entry = getPokemonById(id);
  if (!entry) return [];
  return POKEMON_ROSTER
    .filter((p) => p.familyId === entry.familyId)
    .sort((a, b) => (a.stage - b.stage) || (a.dexNumber - b.dexNumber));
}
