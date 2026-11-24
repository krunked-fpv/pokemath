# PokéMath Sprint 2 Handoff — Polish & Craftsmanship

## Sprint 2 Upgrades Completed

- **Curriculum & Hints (`js/core/mathEngine.js`, `hintEngine.js`)**: Fixed spoken fraction ordinals (denominators up to 99), `.replaceAll` spoken operators (`+`, `-`, `×`, `÷`, parentheses), singular/plural place-value and coin grammar, and `askPlace === 'value'` hints. Added **Bridge Back to 10** subtraction hints, expanded Champion 2-step `genWord` to 6 Pokémon story templates, removed `equivFraction`/`partWhole` answer leaks, and exported `formatSkillTag()`.
- **State Vault & Audio (`js/core/state.js`, `audio.js`)**: Packed last-10 rolling mastery booleans inside `krunked-cookie-vault-v1` (`< 3600` bytes) so cold-reload healing restores rolling accuracy. Aligned quest metrics (`solve_total`, `solve_streak`, `catch_pokemon`) with legacy normalization, added `setBuddyNickname()` (16-char cap, clearable), and dropped duplicate `deepClone`. Added `'select'`/`'love'` click chimes, idempotent ambient looping, and Node-safe `visibilitychange` pause/resume.
- **Offline PWA & CI (`sw.js`, `manifest.json`, `.github/workflows/deploy-pages.yml`)**: Precached all 4 CSS and 17 JS files with relative `./` paths, split `manifest.json` icons into separate `any` and `maskable` 192px/512px entries, added a Node 22 test gate in CI, and staged a clean `_site` artifact excluding `.agents/`, `tests/`, and docs.
- **UI & Anti-Spoiler Manipulatives (`css/*.css`, `js/ui/*.js`)**: Eliminated initial-open answer spoilers across Tier 2 `tenFrame`, `base10`, `berryArray`, and `comparisonScale`. Stabilized Left Rail sprite nodes and `#left-rail`/`#rotom-pane` scroll positions, fixed exact-multiple Buddy XP fill, trapped `Tab`/`Escape` focus in Profile & Parent modals, styled all 11 `spawnFloatingText` variants, and lifted shared `.pokenav-*` primitives into `css/components.css`.
- **Game Modes & Speed Blitz (`js/main.js`, `js/games/*.js`)**: Fixed 0-frame VFX/confetti wipes across all 6 modes via post-render and in-place updates, unified `context.speedBlitz` (single bar, `+2 Coins` & `+2 Stardust`, hidden in Camp), added auto Read-Aloud, global `r`/`R` voice shortcut, fraction `/` input, Number Line arrows, inline Buddy Nicknames, egg-warming cooldowns, warm Starter Ceremony copy, and strict `.pm-<mode>-*` CSS scoping with `unmount()` cleanup.

## Verification

- **Automated Tests**: `node --test tests/engine.test.mjs` passes **37/37 tests across 13 suites** (`0` failures), verifying 2,750+ speech/grammar problems, anti-spoiler hints, cold-reload vault rolling recovery, full `sw.js` precache parity, zero CSS collisions, and audio visibility lifecycle.
- **Live Browser QA**: **20/20** checks passed across `1440×900`, `1024×768`, and `390×844` (Starter Ceremony, all 6 modes, Shiny Radar/Charge, anti-spoiler Tier 2, Speed Blitz, Buddy Nickname, modal focus traps) with `0` console errors, `0` local 404s, and `0` horizontal overflow.

## Next Priorities

1. Push `main` and verify live HTTPS PWA install on mobile devices.
2. Add optional printable Trainer Progress Certificates and local Pass-and-Play Gym Relay.
