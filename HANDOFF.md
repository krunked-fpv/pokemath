# PokéMath Sprint Handoff

## Completed & Verified

- **Architecture & Legacy DNA**: Reimagined from greenfield commit `b1f5041` into a zero-backend native ES Module PokéNav Workbench (`ARCHITECTURE.md`, `SPEC.md`) honoring 1996 Kanto Starter Quartet spotlight, red/gold/indigo accents, `classic-cap` + Classic 1996 emblem, and nostalgic Rotom-Dex phrases.
- **3-Pane Workbench & Manipulatives**: Framed `100dvh` desktop grid (`>= 1024px`) and slide-drawer mobile shell (`< 1024px`) across `css/*.css`, `js/ui/shell.js`, `js/ui/rotomPane.js`, and `js/ui/vfx.js`. Rotom-Dex delivers 5 moods, Web Speech Read-Aloud, 3-tier progressive hints, and 6 clickable manipulatives (`tenFrame`, `numberLine`, `base10`, `berryArray`, `partWhole`, `comparisonScale`), plus automatic inline `<svg>` chibi crest fallback when sprites fail.
- **6 Game Modes & Data**: `js/data/` curates 115 species across 39 families (38 multi-stage), 6 routes/Gyms, and items. `js/games/` delivers Wild Battle, Catch Safari (Number Line, Poké-Lock, Power Scale), Berry Lab & Poké-Mart, Evolution Forge, 3-phase Gym Boss Gauntlet, and Cozy Buddy Camp + Pokédex Vault.
- **Curriculum, Audio & Vault Persistence**: `js/core/` delivers 4-tier + custom-filter math (`mathEngine.js`), 3-tier hints (`hintEngine.js`), miss/streak scaffolding (`adaptive.js`), procedural Web Audio DSP (`audio.js`), and multi-profile `krunked-cookie-vault-v1` bidirectional auto-healing under 3,600 bytes (`state.js`) with JSON/`PM1.` backup.
- **Installable PWA & Verification**: Relative `./manifest.json`, `./sw.js` (`pokemath-shell-v1`, `pokemath-sprites-v1`), verified PNG icons (`192x192`, `512x512`, `180x180`), and `.github/workflows/deploy-pages.yml`. `node --test tests/engine.test.mjs` passes **20/20** tests across 7 suites (6,792+ problems, cold-reload vault recovery, offline SVG fallback, PNG headers). Live `/browser` QA passed all 6 modes, 5 viewports (zero horizontal overflow), clean reload, and `Verify Vault Auto-Heal` cache wipe + reload recovery with 0 console errors and 0 local 404s.

## Active Technical Debt & Edge Cases

- `webview_browser` blocks arbitrary `page.evaluate()`, so `navigator.serviceWorker.getRegistrations()` and live `requestAnimationFrame` FPS sampling were not measured in-browser; service worker lifecycle and reload/vault recovery were verified via Node tests and live reload flows.
- External PokeAPI artwork loads online and falls back to inline SVG offline (verified via unit test).

## Environment & Deployment State

- Zero build step, zero npm dependencies; Node `v22.14.0` runs `node --test tests/engine.test.mjs`.
- GitHub Actions workflow `.github/workflows/deploy-pages.yml` deploys `.` cleanly to `https://krunked-fpv.github.io/pokemath/`.

## Next Sprint Priorities

1. Push `main` and verify live HTTPS `beforeinstallprompt` + `sw.js` offline install on Android/iOS devices.
2. Expand Champion multi-step word problem templates and optional printable Trainer Progress Certificates.
3. Add optional two-player local Pass-and-Play Gym Relay mode.
