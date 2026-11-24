# PokéMath — Architecture & Design Blueprint

## 1. System Overview

PokéMath is a zero-backend, zero-bundler, offline-capable Installable Progressive Web App (WebAPK) built entirely with semantic HTML5, modern CSS3, native ES Modules (`./js/...`), SVG/Canvas VFX, and procedural Web Audio DSP. All file, manifest, module, and service worker references use strictly relative `./` paths so the static bundle runs identically on localhost and GitHub Pages subpath hosting (`https://krunked-fpv.github.io/pokemath/`), keeping total repository weight well under `5 MB`.

---

## 2. Legacy PokéMath DNA & Tribute Registry

Inspection of the local repository at commit `b1f5041` (`Initial commit`, containing only `.gitattributes` and no prior remote branches or legacy HTML/CSS/JS files) confirmed a greenfield baseline. To ground the reimagined PokéNav Workbench in classic web-era PokéMath and 1996–2004 handheld adventure nostalgia, three concrete tributes are woven into the core experience:

1. **Classic Kanto Starter Spotlight & Palette Accents**: First-time Starter Selection opens with the nostalgic Kanto Starter Quartet (**Bulbasaur**, **Charmander**, **Squirtle**, and **Pikachu**) framed by heritage `#E3350D` (Poké Ball Red), `#FFCB05` (Pikachu Gold), and `#3B4CCA` (Classic Indigo) trim tokens alongside warm Nintendo storybook parchment surfaces (`#FFF9F0`).
2. **"Classic Trainer 1996" Enamel Emblem & Starter Cap**: Every Trainer starts with the **Classic Trainer 1996** heritage badge slot visible in the Badge Case (unlockable on first completed adventure milestone) and owns the classic red-and-white **Classic Trainer Cap** (`classic-cap`) ready to equip in Buddy Camp.
3. **Retro PokéNav Rotom-Dex Greetings**: Rotom-Dex echoes classic handheld adventure phrasing (*"Bzzzt! Your math journey is about to unfold!"*, *"Super effective thinking, Trainer!"*, *"It's super cozy in the PokéNav!"*) inside greeting bubbles and victory banners.

---

## 3. 3-Pane PokéNav Workbench Spatial Topology

- **Top Trainer Ribbon (`64px` fixed bar)**: PokéMath emblem (honoring Classic 1996 trim), Active Trainer Profile switcher pill, Grade Tier + Parent/Coach Custom Operation Filter trigger, Daily Streak Flame, Poké-Coins & Stardust counters, Audio SFX / Ambient Kalimba / Read-Aloud toggles, Camp & Pokédex quick-jump button, and a conditional dismissible **`Install PokéNav`** pill surfaced only when `beforeinstallprompt` fires outside `(display-mode: standalone)`.
- **Desktop & Landscape Tablet (`>= 1024px`, `100dvh` framed workbench)**:
  - **Left Expedition Rail (`290px`)**: Active Buddy Card (live idle bobbing animation, equipped accessories overlaid on sprite/SVG, type pills, Level, XP progress, clickable glowing **Evolution Meter**), scrollable vertical 6-Route stepping-stone map (1–3 star badges + Gym Leader Boss Gates), and a gleaming 6-slot **Gym Badge Case** (+ Classic 1996 Emblem).
  - **Center Interactive Play Stage (`1fr`)**: Distraction-free parallax biome arena hosting the Starter Selection Ceremony and all 6 gameplay modes (Wild Encounter Battle, Poké Ball Catch Safari, Berry Mixing Lab & Poké-Mart, Evolution Forge, Gym Boss Gauntlet, and Cozy Buddy Camp / Pokédex Vault), paired with a compact Mode Switcher strip and optional Speed Blitz timer bar.
  - **Right Rotom-Dex Field Guide (`335px`)**: Animated floating Rotom-Dex face with 5 emotional expressions (`curious`, `cheering`, `encouraging`, `thinking`, `starry`), 1-tap Web Speech Read-Aloud button, **3-Tier Progressive Hint Accordion**, live clickable visual manipulatives (**Ten-Frames**, **SVG Number Line**, **Base-10 Poké-Blocks**, **Berry Array Grid**, **Part-Whole Bond**, and **Comparison Scale**), Combo & Charge Meter, 3 claimable Mini-Quests, and rolling Skill Mastery bars.
- **Portrait Tablet & Mobile (`< 1024px`)**: Center Play Stage expands to `100vw` with `>= 52px` tactile touch targets. A persistent bottom PokéNav tab bar (`Map & Buddy`, `Adventure Stage`, `Rotom-Dex` with pulsing hint badge) slides the Left and Right drawers smoothly over a blurred backdrop with zero horizontal overflow.

---

## 4. Bidirectional `krunked-cookie-vault-v1` Persistence Flow

```
  User Action (XP / Catch / Coins / Badge / Quests)
                       |
                       v
        [ js/core/state.js Store ]
         |                      |
         v (Primary)            v (Compact Vault < 3.6 KB)
  localStorage               document.cookie
  ['pokemath-state-v1']      ['krunked-cookie-vault-v1']
         ^                      ^
         |                      |
         +--- initState() ------+
              * Both valid     -> Reconcile newest updatedAt & sync both
              * Storage wiped  -> Heal full state from cookie & rewrite localStorage
              * Cookie wiped   -> Re-stamp compact cookie from localStorage
              * Manual backup  -> Export/Import JSON file & copyable Save Code
```

---

## 5. Installable WebAPK PWA & Offline Resilience

- **Manifest (`./manifest.json`)**: Subpath-scoped (`start_url: "./"`, `scope: "./"`, `display: "standalone"`) with verified binary PNG icons (`192x192`, `512x512` `any maskable`, and `180x180` Apple touch icon).
- **Service Worker (`./sw.js`)**:
  - Same-origin HTML/CSS/JS/JSON/icons use **Network-First** with deterministic fallback to `pokemath-shell-v1`, plus automatic pruning of superseded caches on `activate`.
  - External PokeAPI/GitHub official-artwork sprites use **Stale-While-Revalidate / Cache-First** into `pokemath-sprites-v1`.
  - If offline or an external sprite 404s, `js/ui/vfx.js` seamlessly switches the `<img>` container to a bespoke inline `<svg>` chibi elemental crest so broken image placeholders never appear.
