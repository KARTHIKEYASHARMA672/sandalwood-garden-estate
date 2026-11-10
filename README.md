# 🏡 Sandalwood Garden Estate

> **Interactive 3D First- & Third-Person Architectural Exploration**  
> Built strictly in **Pure ES2024 JavaScript (zero `.ts` / `.tsx` / `.jsx`)** with **Three.js `0.175.0`**, procedural PBR textures, dynamic Web Audio synthesis, and an automated 5-tier Vitest suite (`338 / 338` passing).

---

## 📌 Project Properties

| Property | Value | Details |
| :--- | :--- | :--- |
| **Project Name** | `sandalwood-garden-estate` | Version `1.0.0` (`package.json`) |
| **Repository** | `https://github.com/KARTHIKEYASHARMA672/sandalwood-garden-estate` | Public · Branch `main` |
| **Live Deployment** | `https://sandalwood-garden-estate.netlify.app` | Netlify (`netlify.toml`) |
| **Netlify Dashboard** | `https://app.netlify.com/projects/sandalwood-garden-estate` | Team `praneethsharma672` |
| **Language Policy** | **100% Pure JavaScript (`.js`) + HTML/CSS** | Zero TypeScript/JSX files across `src/` and `tests/` |
| **3D Engine** | `three` `^0.175.0` | Procedural architectural mesh builder, IBL environment & shaders |
| **Bundler / Dev Server** | Vite `^6.2.0` | Production bundle in `dist/` |
| **Automated Tests** | Vitest `^3.0.8` (`338 / 338` passed, `9` files) | Tiers 1–5 + headless DOM/Web Audio harness |
| **Linter** | ESLint `^9.21.0` (`eslint src tests`) | `0` errors, `0` warnings |
| **Authoritative Specs** | [`Sandalwood_Garden_Estate_Detailed_PRD.md`](./Sandalwood_Garden_Estate_Detailed_PRD.md) | 1 world unit = 1 metre architectural scale |

---

## 📑 Table of Contents

1. [Architectural Specifications & Spatial Model](#1-architectural-specifications--spatial-model)
2. [Estate Exploration Map (12 Discovery Zones)](#2-estate-exploration-map-12-discovery-zones)
3. [Controls, Camera & Environmental Modes](#3-controls-camera--environmental-modes)
4. [Architecture & Pure-JS Module Layout](#4-architecture--pure-js-module-layout)
5. [Local Development & Quality Checks](#5-local-development--quality-checks)
6. [Deployment & Verification Checklist](#6-deployment--verification-checklist)

---

## 1. Architectural Specifications & Spatial Model

> [!NOTE]
> All dimensions adhere cleanly to a **1 world unit = 1 metre** coordinate convention (`+X` right facing front façade, `+Y` vertical height, `+Z` south toward garden arrival pathway).

- **Grounds & Arrival (`80 x 70 m`)**: Gently contoured lawn (`<= 0.5 m` relief), perimeter stone-and-timber wall, `2.4 m`-wide sandstone arrival walkway (`Z = 40 -> 12 m`) with low bollards, `10` gnarled multi-fork orchard/shade/flowering trees with compact blossom crowns, `4` stone benches, and `12` flower beds showcasing `7` procedural botanical flower species (`540` curved-petal flowers with wind sway).
- **Residence Massing (`24 x 18 m`, Two-Story + Single-Story East Wing)**:
  - Raised stone foundation plinth (`Y = 0.30 m`) with sandstone front porch (`6 x 3 m`) and structural timber columns.
  - **Mandatory Asymmetric Front Façade (`Z = +8.875 m`)**: Large double-hung picture window with shutters on the left (`X = -3.6 m`), timber-framed entrance porch and main door on the right (`X = +3.5 m`).
  - Continuous punched `ExtrudeGeometry` walls with mitered aperture reveals, Venetian lime-plaster interior faces, espresso walnut L-corner-wrapped baseboards, double-height Living Hall atrium with walnut spandrel trim (`Y = 3.825 m`), eave wall-plate tie beam ring (`Y = 7.05 m`), enclosed gable ends, dual-sided `18`-step oak central staircase + East gallery guardrail (`Y = 0.30 -> 3.95 m`), and contoured `1.78 m` / `1.66 m` companion avatars.
- **Exact Fenestration & Doors**:
  - **`12` Windows** (`6` ground + `6` upper, including shutters, linen curtains, and frosted bath glazing).
  - **`13` Interactive Doors** (`1` main entrance, `1` service rear door, `1` pool terrace double sliding glass door, `8` interior hinged doors, `2` cantilevered balcony glass doors) with animated pivot/slide groups, brass handles, dynamic `CollisionSystem` toggling, and synthesized creak/latch audio.
- **Rear Pool Terrace (`12 x 8 m`) & Cantilevered Upper Balconies**:
  - `8.0 x 4.0 m` rectangular pool with ripple water surface, coping colliders, timber loungers, and shade umbrella.
  - Dual cantilevered teak balconies (`Main Rear Balcony` `5.0 x 1.6 m` and `Secondary West Balcony` `1.4 x 3.0 m`) guarded by rail colliders.

---

## 2. Estate Exploration Map (12 Discovery Zones)

| # | Zone ID | Display Label | Level | Key Interactive & Architectural Highlights |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `flower-garden` | Flower Garden | Exterior | Arrival path, companion avatars, `12` flower beds (`7` species), orchard trees |
| 2 | `front-porch` | Front Porch | Ground (`0.30 m`) | Sandstone entry steps, timber columns, bronze sconces, porch bench |
| 3 | `living-hall` | Living Hall | Ground & Mezzanine | Double-height atrium, OLED TV (`[E]` toggle), sofa & accent seating, upper gallery overlook & NW Upper Rear Lounge |
| 4 | `kitchen` | Kitchen | Ground (`0.30 m`) | Breakfast bar, granite counter, range hood, **`37` utensils + `41` cookware items (`37` core setting)** |
| 5 | `dining-hall` | Dining & Family Hall | Ground (`0.30 m`) | 8-seat chamfered dining table, flush sideboard, east gallery hall console & conservatory alcove, sliding pool door (`[E]`) |
| 6 | `bedroom-1` | Bedroom 1 | Ground (`0.30 m`) | Primary suite, timber bed, bedside lamps (`[L]`), wardrobe & garden east view |
| 7 | `bathroom-1` | Bathroom 1 | Ground (`0.30 m`) | Stone tile, frosted window, vanity, interactive rain shower particle system (`[E]`) |
| 8 | `bedroom-2` | Bedroom 2 | Upper (`3.95 m`) | Upper west suite, vaulted rafters, walk-in wardrobe (oak armoire & hanging garments), linen closet, balcony access |
| 9 | `bathroom-2` | Bathroom 2 | Upper (`3.95 m`) | Ensuite bath with frosted west glazing, ceramic fixtures & shower emitter (`[E]`) |
| 10 | `laundry-room` | Laundry Room | Ground (`0.30 m`) | Utility room (`[E]` interactive washer & dryer), adjacent storage closet & service door |
| 11 | `pool-terrace` | Pool Terrace | Exterior (`0.25 m`) | `12 x 8 m` poolside deck, `8 x 4 m` pool with perimeter push-out safety colliders |
| 12 | `balcony` | Upper Balconies | Upper (`3.95 m`) | Main rear teak balcony (`5.0 x 1.6 m`) & west suite balcony (`1.4 x 3.0 m`) |

---

## 3. Controls, Camera & Environmental Modes

| Input | Action | Notes |
| :--- | :--- | :--- |
| `W A S D` / `Arrow Keys` | Move / Navigate | Walk `2.2 m/s` outdoors; clamped to `2.0 m/s` indoors |
| `Shift` | Sprint (outdoors) | `3.8 m/s` garden traversal |
| `Mouse` (Pointer Lock or Drag) | Look Around | Supports Pointer Lock (click viewport) and smooth left-drag fallback |
| `E` | Interact | Open/close doors, toggle OLED TV/appliances/showers, sit/stand, inspect items |
| `V` or `C` | Camera View Toggle | Toggle **1st-Person** (`1.56 m` / `1.65 m` eye height) and **3rd-Person** avatar follow cam |
| `T` | Time of Day | Cycle **Day** -> **Sunset** -> **Night** (updates sky shader, sun rig, interior/porch lights) |
| `L` | Interior Lamps | Toggle warm `2700 K` bedside & interior lamps |
| `M` | Audio Mute | Toggle procedural Web Audio soundscape & surface-aware footsteps |
| `H` | Toggle HUD | Clean screenshot / distraction-free architectural viewing mode |
| `?` / `Esc` | Controls / Settings | View keybindings modal (`?`) or open Pause, Character, Quality (`Low/Med/High`), Weather & Zone Checklist (`Esc`) |

---

## 4. Architecture & Pure-JS Module Layout

```text
sandalwood-garden-estate/
├── index.html                                  # Root viewport & font links
├── vite.config.js                              # Vite build & Vitest (environment: 'node')
├── eslint.config.js                            # ESLint 9 flat config (src + tests)
├── netlify.toml                                # Build, SPA redirect & cache headers
├── src/
│   ├── main.js                                 # Bootstrap & base DOM layout styling
│   ├── app/
│   │   ├── Experience.js                       # Render loop, subsystem orchestration & lifecycle
│   │   └── World.js                            # Terrain, residence shell, pool, garden & furnishings assembly
│   ├── assets/procedural/
│   │   ├── AssetManifest.js                    # Budget metadata & asset manifest registry
│   │   ├── AudioEngine.js                      # Zero-asset Web Audio synthesis (footsteps, wind, rain, latches)
│   │   └── TextureGenerator.js                 # Deterministic CanvasTexture PBR wood, stone, tile & fabric maps
│   ├── characters/
│   │   └── CharacterMesh.js                    # Articulated Male & Female companion rigs & gait animation
│   ├── gameplay/
│   │   ├── CameraController.js                 # Pointer lock, pitch clamp [-80°, +80°] & 1st/3rd person orbit
│   │   ├── CollisionSystem.js                  # Capsule-AABB sliding, dynamic door colliders, pool ejector & occlusion
│   │   ├── InteractionManager.js               # Center-reticle raycaster with solid wall occlusion filtering
│   │   └── PlayerController.js                 # Locomotion physics, stairs ramp, seating & surface footstep cadence
│   ├── house/
│   │   ├── HouseArchitecture.js                # Authoritative 1:1 metre coordinates, rooms, fenestration & zone detection
│   │   ├── HouseMeshBuilder.js                 # Foundation, punched ExtrudeGeometry walls, spandrel/eaves, stairs, balconies & roofs
│   │   ├── FurnitureFactory.js                 # Reusable procedural furniture primitives
│   │   └── rooms/                              # RoomProps + Kitchen (37+41 items), LivingHall, DiningHall, Bedrooms, Bathrooms, CommonAreas, Utility, ShowerParticles
│   ├── state/
│   │   └── gameStore.js                        # Pure JS reactive pub/sub store & quality profiles
│   ├── ui/
│   │   └── UIManager.js                        # Left-docked start card, HUD pills, zone toast, inspection & settings modals
│   └── world/
│       ├── DayNightController.js               # Day / Sunset / Night sky dome shader, sun rig & interior glow
│       ├── FlowerBeds.js                       # 12 beds, 7 curved-petal botanical species & wind shader/sway
│       ├── Garden.js                           # 80x70m lawn, 2.4m sandstone walkway & garden ensemble
│       ├── PoolTerrace.js                      # 12x8m deck, 8x4m animated water basin & loungers
│       └── TreesAndProps.js                    # Orchard/shade trees, perimeter wall, bollards & benches
└── tests/
    ├── harness/                                # Headless Canvas2D, Web Audio & DOM mock shim (`mockEnv.js`, `testFixtures.js`)
    ├── tier1/                                  # Feature coverage (`architecture`, `furnishings`, `garden`, `gameplay`)
    ├── tier2/                                  # Spatial bounds, inventories & audio precision (`boundaries.test.js`)
    ├── tier3/                                  # Cross-feature subsystems (`pairwise.test.js`)
    ├── tier4/                                  # End-to-end arrival-to-balcony journey (`walkthrough.test.js`)
    └── tier5/                                  # Adversarial collision, slope & interaction state (`adversarial_*.test.js`)
```

---

## 5. Local Development & Quality Checks

> [!TIP]
> Requires **Node.js `>= 20`** (`npm`). Zero external CDN binaries or TypeScript compilation steps are required.

```bash
# 1. Install dependencies
npm install

# 2. Start local Vite dev server (http://localhost:5173)
npm run dev

# 3. Run ESLint across src/ and tests/
npm run lint

# 4. Execute all 9 Vitest suites (Tiers 1–5, 338 tests)
npm test

# 5. Build optimized production bundle (outputs dist/)
npm run build

# 6. Preview production build locally
npm run preview
```

> [!NOTE]
> [`TEST_INFRA.md`](./TEST_INFRA.md) and [`TEST_READY.md`](./TEST_READY.md) preserve the original Tiers 1–4 harness milestone report (`7` files, `257` tests). The active test suite now also includes **Tier 5 adversarial suites** (`tests/tier5/adversarial_physics.test.js` and `tests/tier5/adversarial_interaction_state.test.js`) plus structural, material, and occupancy regression suites, bringing total coverage to **`9` test files and `338` passing tests**.

---

## 6. Deployment & Verification Checklist

- [x] **Pure JavaScript Audit**: `0` `.ts`, `.tsx`, `.jsx`, or `.d.ts` files in `src/` or `tests/`.
- [x] **ESLint Check**: `npm run lint` passed (`0` errors, `0` warnings).
- [x] **Vitest Suite**: `npm test` passed (`9 / 9` files, **`338 / 338` tests**).
- [x] **Production Bundle**: `npm run build` outputs clean chunks in `dist/` (`vite build`).
- [x] **Headless WebGL Browser Verification**: Verified in Chromium via Playwright across `24` viewpoints (`slice2` exterior/day/sunset/night/pool + `slice3` every interior zone including Kitchen, Dining, Living Hall, Master & Guest Bedrooms, Baths with live `[E]` shower spray, Laundry, Dual-Sided Staircase, Upper Gallery, NW Upper Rear Lounge, East Gallery Hall & Conservatory Alcove, Walk-in Wardrobe, and Contoured Companion Characters) with `0` console errors, `0` console warnings, and `0` page errors.
- [x] **Netlify Config (`netlify.toml`)**: Builds `dist/` via `npm run build`, sets SPA fallback `/* -> /index.html (200)`, and applies immutable `/assets/*` caching headers.
