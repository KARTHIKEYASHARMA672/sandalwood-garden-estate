# 🧪 Test Infrastructure Specification

> **Sandalwood Garden Estate — 3D Interactive Architectural Exploration**  
> Comprehensive Automated Test Framework, 4-Tier Opaque-Box Suite & Headless Harness Architecture  
> Authoritative Specifications: `Sandalwood_Garden_Estate_Detailed_PRD.md` & `PROJECT.md`

---

## 📌 Metadata & Environment Properties

| Property | Value | Notes |
| :--- | :--- | :--- |
| **Project Name** | `sandalwood-garden-estate` | Registered in `package.json` |
| **Runtime Platform** | Node.js (ESM / Pure JavaScript) | Target: Zero TypeScript (`.ts` / `.tsx`) files |
| **Test Runner** | Vitest `v3.2.7` | Configured in `vite.config.js` (`environment: 'node'`) |
| **Linter** | ESLint `v9.39.5` (Flat Config) | Target dirs: `src/` and `tests/` |
| **Core 3D Engine** | Three.js `v0.175.0` | Math, geometries, vectors, matrices, raycasters |
| **Audio Subsystem** | Web Audio API | Procedurally synthesized, zero external audio clips |
| **Test Directory Root** | `tests/` | Co-located with project root |
| **Integrity Mode** | Strict Genuine Verification | Zero hardcoded mocks, zero facade tests |

---

## 📑 Table of Contents
1. [Test Framework Architecture](#1-test-framework-architecture)
2. [Directory & Suite Layout](#2-directory--suite-layout)
3. [Headless Test Harness](#3-headless-test-harness)
4. [4-Tier Test Hierarchy & Feature Mapping](#4-4-tier-test-hierarchy--feature-mapping)
   - [Tier 1: Feature Unit & Functional Coverage](#tier-1-feature-unit--functional-coverage)
   - [Tier 2: Boundary, Precision & Coordinate Constraints](#tier-2-boundary-precision--coordinate-constraints)
   - [Tier 3: Pairwise Cross-Feature Combinations](#tier-3-pairwise-cross-feature-combinations)
   - [Tier 4: Real-World Player Walkthrough Scenarios](#tier-4-real-world-player-walkthrough-scenarios)
5. [Execution Commands & Validation Workflow](#5-execution-commands--validation-workflow)
6. [Adversarial & Edge Verification Checklist](#6-adversarial--edge-verification-checklist)
7. [Integrity & Anti-Facade Guarantees](#7-integrity--anti-facade-guarantees)

---

## 1. Test Framework Architecture

The test suite is built on **Vitest** in pure ES module JavaScript, executing in headless Node.js. Because the client application interacts with WebGL, Canvas 2D contexts, Pointer Lock, and the Web Audio API, the test framework includes a lightweight, zero-dependency environment shim (`tests/harness/mockEnv.js`).

```
                    [ vitest run ]
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
   [ tests/harness/ ]          [ ESLint Check ]
   - mockEnv.js (DOM/Audio)    (eslint src tests)
   - testFixtures.js
             │
   ┌─────────┼─────────┬─────────┐
   ▼         ▼         ▼         ▼
[ Tier 1 ] [ Tier 2 ] [ Tier 3 ] [ Tier 4 ]
Feature    Boundary  Pairwise  Walkthrough
Coverage   Cases     Coupling  Scenarios
```

### Key Architectural Tenets:
1. **Pure JavaScript**: 100% of test files use `.js` extension. No `.ts` or `.tsx` files are introduced.
2. **Deterministic Execution**: Tests execute without asynchronous timeouts or network dependencies.
3. **Requirement Traceability**: Every assertion correlates to a numbered section in `Sandalwood_Garden_Estate_Detailed_PRD.md` and feature in `PROJECT.md`.
4. **Opaque-Box Verification**: Tests evaluate observable outputs (coordinates, velocities, store states, audio levels, raycast hits, bounding boxes) rather than private internal implementation details.

---

## 2. Directory & Suite Layout

```
L:\pr 3(house)\tests\
├── harness\
│   ├── mockEnv.js                 # Headless DOM, Canvas 2D, and Web Audio API environment shim
│   └── testFixtures.js            # Reusable mock scene graph, camera, and collision builders
├── tier1\
│   ├── architecture.test.js       # Features F02, F11, F12, F13, F14, F15, F16, F17, F18, F19
│   ├── garden.test.js             # Features F03, F04, F05, F06, F07, F08, F09, F10, F30
│   ├── furnishings.test.js        # Features F20, F21, F22, F23, F24, F25, F26, F27, F28, F29, F31
│   └── gameplay.test.js           # Features F01, F32, F33, F34, F35, F36, F37, F38, F39, F40, F41, F42
├── tier2\
│   └── boundaries.test.js         # Extreme coordinates, collider radii, audio frequencies, inventories
├── tier3\
│   └── pairwise.test.js           # Cross-feature interactions (movement+collision, door+sound, day/night)
└── tier4\
    └── walkthrough.test.js        # End-to-end player journey from garden gate to upper balcony
```

---

## 3. Headless Test Harness

The headless test harness in `tests/harness/mockEnv.js` guarantees that all Three.js procedural textures, materials, state management, and Web Audio synthesizer methods function seamlessly in Node.js without requiring a browser window or external display server.

### Shimmed Capabilities:
- **`document.createElement('canvas')`**: Implements a Canvas2D rendering mock recording drawing calls (`fillRect`, `createLinearGradient`, `arc`, `getImageData`, `putImageData`).
- **`window.AudioContext`**: Implements standard Web Audio nodes (`GainNode`, `AudioBufferSourceNode`, `BiquadFilterNode`, `OscillatorNode`, `AudioBuffer`) with proper param ramp stubs (`setValueAtTime`, `exponentialRampToValueAtTime`, `setTargetAtTime`).
- **Window & Document Event Listeners**: Tracks registered event handlers (`keydown`, `keyup`, `mousemove`, `pointerlockchange`, `click`) and supports programmatic event dispatching for input testing.
- **Pointer Lock Emulation**: Supports `requestPointerLock()` and `document.pointerLockElement` state tracking.

---

## 4. 4-Tier Test Hierarchy & Feature Mapping

### Tier 1: Feature Unit & Functional Coverage
Validates the functional correctness of all 42 inventory features defined in `PROJECT.md` and `Sandalwood_Garden_Estate_Detailed_PRD.md`:
- **Architecture & Structure**: Footprint ($24 \times 18\text{ m}$), ground height ($Y=0.30\text{ m}$), upper height ($Y=3.95\text{ m}$), staircase climb ($18\text{ steps}$), 12 windows, 13 doors, asymmetrical front façade (large window on left, door on right).
- **Garden & Exterior**: $80 \times 70\text{ m}$ grounds, $2.4\text{ m}$ sandstone pathway, 12 flower beds, 7 botanical flower varieties, procedural wind sway, tree placements, perimeter wall, swimming pool & terrace ($12 \times 8\text{ m}$).
- **Interior Furnishings**: 12 furnished rooms, Living Hall OLED TV & coffee table, Kitchen with exactly 37 utensils and 37 cookware items, dual bedrooms, dual ensuite bathrooms, utility room with washer AND dryer, animated shower particle system.
- **Locomotion, Controls & Audio**: Walk speed $2.2\text{ m/s}$, sprint speed $3.8\text{ m/s}$, indoor speed clamp $2.0\text{ m/s}$, camera pitch clamping $[-80^\circ, +80^\circ]$, capsule-AABB collision, interactive raycasting, procedural Web Audio frequencies, day/night lighting rig, HUD discovery zones.

### Tier 2: Boundary, Precision & Coordinate Constraints
Tests extreme edge cases, mathematical limits, and boundary conditions:
- **Spatial Bounds Clamping**: Player coordinates clamped to garden perimeter $X \in [-39.2, +39.2]$, $Z \in [-24.2, +44.2]$.
- **Pool Rim Exclusion**: Collision push-out prevents falling into pool basin $X \in [-11.0, -3.0], Z \in [-15.5, -11.5]$.
- **Staircase Height Ramp**: Linear progression between $Z=5.7$ ($Y=0.30$) and $Z=1.7$ ($Y=3.95$). Boundary checks at $Z > 5.7$ and $Z < 1.7$.
- **Exact Inventory Counts**: Windows ($12$), doors ($13 = 1\text{ main} + 1\text{ service} + 1\text{ sliding} + 8\text{ interior} + 2\text{ balcony}$), utensils ($37$), cookware ($37$), flower beds ($12$), flower varieties ($7$), discovery zones ($12$).
- **Interaction Ranges**: Furniture distance threshold ($1.8\text{ m}$), door threshold ($2.0\text{ m}$), shower threshold ($1.5\text{ m}$). Boundary tolerance test at $r - \epsilon$ (accepted) and $r + \epsilon$ (rejected).
- **Audio Frequencies & Timing**: Footstep filters (grass 380 Hz, stone 1250 Hz, timber 640 Hz, tile 950 Hz), door pitch ramps ($190 \to 260\text{ Hz}$ opening, $250 \to 165\text{ Hz}$ closing).

### Tier 3: Pairwise Cross-Feature Combinations
Validates interdependent subsystem behaviors:
- **Locomotion + Collision Sliding**: Diagonal velocity against a solid wall resolves into tangential sliding motion without sticky clipping.
- **Door Interaction + Dynamic Collision + Sound**: Toggling a door in `InteractionManager` updates `gameStore.doors`, deactivates its collision AABB in `CollisionSystem`, and triggers audio playback.
- **Day/Night Cycle + Lighting Rig + Sky Dome**: Switching state between Day, Sunset, and Night adjusts sun angle, sky dome uniforms, ambient intensity, and activates warm bedside/pendant lamps.
- **Shower State + Spatial Audio + Particle Emission**: Activating shower in `gameStore` adjusts spatial audio gain inversely proportional to player distance and sets shower emitter active flag.
- **Sit / Stand + Locomotion + HUD Prompt**: Sitting locks player movement, aligns camera yaw to seat orientation, and updates reticle prompt to "Stand up". Standing restores previous coordinates.
- **Raycast Interaction + Wall Occlusion**: When a solid wall occludes the line of sight between the player camera and an interactable object, the reticle prompt is suppressed.

### Tier 4: Real-World Player Walkthrough Scenarios
Executes continuous, end-to-end player journeys through the estate:
1. **Garden Arrival**: Spawning at garden gate $(X=3.5, Z=39.2)$, navigating north along sandstone path, footstep audio resolving to `'stone'`.
2. **Porch & Entry**: Ascending entrance porch steps, facing front entrance door on right half ($X=3.5, Z=8.875$), interacting to swing open door, entering Entrance Foyer.
3. **Ground Floor Tour**: Exploring Living Hall, inspecting OLED TV, walking to Kitchen, verifying 37 utensils and 37 cookware items, visiting Bedroom 1 and ensuite Bathroom 1, toggling shower water spray.
4. **Vertical Exploration**: Walking to Central Staircase ($X=1.85, Z=5.7$), climbing 18 steps to Upper Gallery ($Y=3.95$), exiting through sliding/hinged balcony door onto Main Balcony.
5. **Estate Completion**: Tracking discovery of all 12 zones, toggling day/night cycle, adjusting audio volume and mute settings, executing `resetExperience()`.

---

## 5. Execution Commands & Validation Workflow

### Running the Test Suite
```bash
# Execute full Vitest suite once
npm test
# Equivalent direct command:
npx vitest run
```

### Running Linter on Source & Tests
```bash
# Execute ESLint across both src/ and tests/
npm run lint
# Equivalent direct command:
npx eslint src tests
```

### Full Verification Pipeline
```powershell
# In PowerShell:
npm run lint; if ($?) { npm test }
```

---

## 6. Adversarial & Edge Verification Checklist

- [x] **Zero TypeScript**: All files end in `.js`, no TypeScript syntax or tsconfig required.
- [x] **Headless Execution**: Vitest runs cleanly under Node without browser window popups or display drivers.
- [x] **No Hardcoded Cheats**: All test assertions check genuine calculations, vector maths, store states, and collision results.
- [x] **Negative Boundary Tests**: Out-of-bounds positions, reverse door angles, excessive sprint speeds, and occluded raycasts are explicitly tested for rejection.
- [x] **Memory & Leak Safety**: All event listeners, timers, and Web Audio nodes have teardown and cleanup logic verified.

---

## 7. Integrity & Anti-Facade Guarantees

Every test in this suite is an **opaque-box requirement verification**. The tests do not mock out the units under test; rather, they import the actual source modules (`HouseArchitecture.js`, `CollisionSystem.js`, `InteractionManager.js`, `PlayerController.js`, `CameraController.js`, `AudioEngine.js`, `gameStore.js`, `CharacterMesh.js`, `DayNightController.js`, `Garden.js`, `TextureGenerator.js`), pass genuine inputs, and verify real outputs against the strict mathematical specifications of `Sandalwood_Garden_Estate_Detailed_PRD.md`.
