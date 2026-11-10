import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import '../harness/mockEnv.js';
import { HouseMeshBuilder } from '../../src/house/HouseMeshBuilder.js';
import { DOORS } from '../../src/house/HouseArchitecture.js';
import { CollisionSystem } from '../../src/gameplay/CollisionSystem.js';
import { InteractionManager } from '../../src/gameplay/InteractionManager.js';
import { AudioEngine } from '../../src/assets/procedural/AudioEngine.js';
import { ShowerParticles } from '../../src/house/rooms/ShowerParticles.js';
import { createDayNightController } from '../../src/world/DayNightController.js';
import {
  KITCHEN_UTENSIL_INVENTORY,
  KITCHEN_COOKWARE_INVENTORY,
  KitchenBuilder,
} from '../../src/house/rooms/Kitchen.js';
import { UtilityRoomBuilder } from '../../src/house/rooms/UtilityRoom.js';
import { gameStore } from '../../src/state/gameStore.js';

describe('Tier 5: Adversarial Interaction, Audio, State & Particle Stress Testing', () => {
  beforeEach(() => {
    gameStore.resetExperience();
  });

  // =========================================================================
  // SUITE 1: Rapid-Fire Door Toggling & Swing State Synchronization
  // =========================================================================
  describe('Suite 1: Rapid-Fire Door Toggling & Swing State Synchronization', () => {
    let houseGroup;
    let collisionSystem;
    let interactionManager;
    let camera;
    let builder;

    beforeEach(() => {
      houseGroup = new THREE.Group();
      collisionSystem = new CollisionSystem();
      camera = new THREE.PerspectiveCamera(60, 1.33, 0.05, 150);
      interactionManager = new InteractionManager(camera, collisionSystem);
      builder = new HouseMeshBuilder({
        collisionSystem,
        interactionManager,
      });
      builder.buildDoors(houseGroup);
    });

    afterEach(() => {
      collisionSystem.clear();
      interactionManager.clear();
    });

    it('verifies all 13 doors are registered with correct initial closed states', () => {
      expect(builder.doorsMap.size).toBe(13);
      expect(DOORS.length).toBe(13);

      for (const d of DOORS) {
        const doorObj = builder.doorsMap.get(d.id);
        expect(doorObj).toBeDefined();
        expect(doorObj.userData.isOpen).toBe(false);
        expect(doorObj.userData.pivot).toBeDefined();
        if (doorObj.userData.isSliding) {
          expect(doorObj.userData.pivot.position.x).toBe(0);
        } else {
          expect(doorObj.userData.pivot.rotation.y).toBe(0);
        }
      }
    });

    it('handles 100 rapid-fire toggle cycles on hinged front door without state desync', () => {
      const doorId = 'door-main-entrance';
      const doorObj = builder.doorsMap.get(doorId);
      const openAngle = doorObj.userData.openAngle;

      for (let i = 1; i <= 100; i++) {
        const res = doorObj.toggle();
        const expectedOpen = i % 2 === 1;

        expect(res).toBe(expectedOpen);
        expect(doorObj.userData.isOpen).toBe(expectedOpen);
        expect(gameStore.getState().doors[doorId]).toBe(expectedOpen);

        // Physical pivot verification
        if (expectedOpen) {
          expect(doorObj.userData.pivot.rotation.y).toBeCloseTo(openAngle, 4);
        } else {
          expect(doorObj.userData.pivot.rotation.y).toBe(0);
        }
      }

      // After 100 toggles, it must be closed
      expect(doorObj.userData.isOpen).toBe(false);
      expect(doorObj.userData.pivot.rotation.y).toBe(0);
      expect(gameStore.getState().doors[doorId]).toBe(false);
    });

    it('handles 100 rapid-fire toggle cycles on sliding pool door without coordinate runaway', () => {
      const doorId = 'door-pool-sliding';
      const doorObj = builder.doorsMap.get(doorId);
      expect(doorObj.userData.isSliding).toBe(true);
      const slideDist = doorObj.userData.slideDistance;

      for (let i = 1; i <= 100; i++) {
        const res = doorObj.toggle();
        const expectedOpen = i % 2 === 1;

        expect(res).toBe(expectedOpen);
        expect(doorObj.userData.isOpen).toBe(expectedOpen);
        expect(gameStore.getState().doors[doorId]).toBe(expectedOpen);

        if (expectedOpen) {
          expect(doorObj.userData.pivot.position.x).toBeCloseTo(slideDist, 4);
        } else {
          expect(doorObj.userData.pivot.position.x).toBe(0);
        }
      }

      expect(doorObj.userData.isOpen).toBe(false);
      expect(doorObj.userData.pivot.position.x).toBe(0);
    });

    it('interleaves rapid toggling across all 13 doors without cross-talk or race conditions', () => {
      const doorIds = DOORS.map((d) => d.id);
      const toggleCounts = {};
      doorIds.forEach((id) => (toggleCounts[id] = 0));

      // 650 interleaved toggles
      for (let cycle = 0; cycle < 50; cycle++) {
        for (const id of doorIds) {
          const doorObj = builder.doorsMap.get(id);
          doorObj.toggle();
          toggleCounts[id]++;

          const expectedOpen = toggleCounts[id] % 2 === 1;
          expect(doorObj.userData.isOpen).toBe(expectedOpen);
          expect(gameStore.getState().doors[id]).toBe(expectedOpen);
        }
      }

      // All 13 doors toggled exactly 50 times (even count) -> all must be closed
      for (const id of doorIds) {
        const doorObj = builder.doorsMap.get(id);
        expect(doorObj.userData.isOpen).toBe(false);
        expect(gameStore.getState().doors[id]).toBe(false);
        if (doorObj.userData.isSliding) {
          expect(doorObj.userData.pivot.position.x).toBe(0);
        } else {
          expect(doorObj.userData.pivot.rotation.y).toBe(0);
        }
      }
    });

    it('synchronizes CollisionSystem door collider states dynamically during rapid toggles', () => {
      const doorId = 'door-main-entrance';
      const doorObj = builder.doorsMap.get(doorId);
      const colliderBox = collisionSystem.dynamicDoorColliders.get(doorId);
      expect(colliderBox).toBeDefined();

      // Closed initially -> collider active in collision detection
      expect(colliderBox.active).toBe(true);

      // Open -> collider deactivated
      doorObj.toggle();
      expect(colliderBox.active).toBe(false);

      // Rapidly toggle 20 times and verify box active strictly matches !isOpen
      for (let i = 0; i < 20; i++) {
        doorObj.toggle();
        const isOpen = doorObj.userData.isOpen;
        expect(colliderBox.active).toBe(!isOpen);
      }
    });

    it('dynamically updates interaction prompts when toggled via InteractionManager', () => {
      const doorItem = interactionManager.items.find((item) => item.id === 'door-main-entrance');
      expect(doorItem).toBeDefined();

      const doorObj = builder.doorsMap.get('door-main-entrance');

      expect(doorItem.prompt()).toBe('E — Open Door');
      doorObj.toggle();
      expect(doorItem.prompt()).toBe('E — Close Door');
      doorObj.toggle();
      expect(doorItem.prompt()).toBe('E — Open Door');
    });
  });

  // =========================================================================
  // SUITE 2: AudioContext Unlock Timing & Concurrent Audio Stress
  // =========================================================================
  describe('Suite 2: AudioContext Unlock Timing & Concurrent Audio Playback', () => {
    let engine;

    beforeEach(() => {
      engine = new AudioEngine();
    });

    afterEach(() => {
      engine.dispose();
    });

    it('safely no-ops all sound trigger methods before unlock() is called', () => {
      expect(engine.started).toBe(false);
      expect(engine.ctx).toBeNull();

      expect(() => {
        engine.playFootstep('grass');
        engine.playFootstep('stone');
        engine.playFootstep('timber');
        engine.playFootstep('tile');
        engine.playDoorToggle(true);
        engine.playDoorToggle(false);
        engine.playInteract();
        engine.updateSpatialLevels({
          indoors: false,
          showerActive: true,
          showerDistance: 2.0,
          poolDistance: 5.0,
        });
      }).not.toThrow();
    });

    it('safely handles idempotent unlock() calls and suspended state resume', () => {
      engine.unlock();
      expect(engine.started).toBe(true);
      expect(engine.ctx).toBeDefined();
      expect(engine.masterGain).toBeDefined();
      const firstCtx = engine.ctx;

      // Repeated unlock calls must not re-create context
      for (let i = 0; i < 5; i++) {
        engine.unlock();
        expect(engine.ctx).toBe(firstCtx);
      }

      // Suspended state recovery
      engine.ctx.state = 'suspended';
      engine.unlock();
      expect(engine.ctx.state).toBe('running');
    });

    it('survives 1,000 rapid concurrent audio triggers under unmuted conditions', () => {
      engine.unlock();
      engine.setVolume(0.7, false);

      const surfaces = ['grass', 'stone', 'timber', 'tile'];
      expect(() => {
        for (let i = 0; i < 1000; i++) {
          const surf = surfaces[i % surfaces.length];
          engine.playFootstep(surf);
          if (i % 5 === 0) engine.playDoorToggle(i % 2 === 0);
          if (i % 10 === 0) engine.playInteract();
        }
      }).not.toThrow();
    });

    it('early-returns and prevents audio node allocation when muted is true', () => {
      engine.unlock();
      engine.setVolume(0.55, true);
      expect(engine.muted).toBe(true);

      expect(() => {
        for (let i = 0; i < 500; i++) {
          engine.playFootstep('timber');
          engine.playDoorToggle(true);
          engine.playInteract();
        }
      }).not.toThrow();

      // Master gain must be 0
      expect(engine.masterGain.gain.value).toBe(0);
    });

    it('robustly handles extreme, negative, and infinite spatial audio distances', () => {
      engine.unlock();

      const testCases = [
        { indoors: true, showerActive: false, showerDistance: 0, poolDistance: 0 },
        { indoors: false, showerActive: true, showerDistance: -100, poolDistance: -50 },
        { indoors: false, showerActive: true, showerDistance: 1e9, poolDistance: 1e9 },
        { indoors: true, showerActive: true, showerDistance: Infinity, poolDistance: Infinity },
        { indoors: false, showerActive: true, showerDistance: 0.0001, poolDistance: 0.0001 },
      ];

      for (const tc of testCases) {
        expect(() => engine.updateSpatialLevels(tc)).not.toThrow();
        expect(Number.isFinite(engine.ambienceGain.gain.value)).toBe(true);
        expect(Number.isFinite(engine.showerGain.gain.value)).toBe(true);
        expect(Number.isFinite(engine.poolGain.gain.value)).toBe(true);

        expect(engine.ambienceGain.gain.value).toBeGreaterThanOrEqual(0);
        expect(engine.showerGain.gain.value).toBeGreaterThanOrEqual(0);
        expect(engine.poolGain.gain.value).toBeGreaterThanOrEqual(0);
      }
    });

    it('gracefully disposes and handles calls post-disposal', () => {
      engine.unlock();
      engine.dispose();

      expect(engine.started).toBe(false);
      expect(engine.ctx).toBeNull();

      expect(() => {
        engine.playFootstep('grass');
        engine.playDoorToggle(true);
        engine.updateSpatialLevels({ indoors: false, showerActive: false, showerDistance: 10, poolDistance: 10 });
      }).not.toThrow();
    });
  });

  // =========================================================================
  // SUITE 3: Long-Running ShowerParticles Memory Stability & Physics Clamping
  // =========================================================================
  describe('Suite 3: Long-Running ShowerParticles Simulation Stability', () => {
    let shower;

    beforeEach(() => {
      shower = new ShowerParticles({
        count: 600,
        headY: 2.5,
        floorY: 0.33,
        speed: 2.5,
        sprayRadius: 0.2,
        bathKey: 'bath1',
        stallBounds: {
          minX: -0.6,
          maxX: 0.6,
          minZ: -0.45,
          maxZ: 0.45,
          minY: 0.35,
          maxY: 2.5,
        },
      });
    });

    afterEach(() => {
      shower.dispose();
    });

    it('verifies initial buffer sizing and reactive binding', () => {
      expect(shower.count).toBe(600);
      expect(shower.positions.length).toBe(1800); // 600 * 3
      expect(shower.velocities.length).toBe(1800);
      expect(shower.lifetimes.length).toBe(600);
      expect(shower.active).toBe(false);
      expect(shower.points.visible).toBe(false);
    });

    it('reacts dynamically to gameStore shower state changes', () => {
      expect(shower.active).toBe(false);

      gameStore.toggleShower('bath1');
      expect(shower.active).toBe(true);
      expect(shower.points.visible).toBe(true);

      gameStore.toggleShower('bath1');
      expect(shower.active).toBe(false);
      expect(shower.points.visible).toBe(false);
    });

    it('executes 10,000 continuous simulation ticks without buffer reallocation, memory leak, or NaN', () => {
      shower.setActive(true);
      const initialBuffer = shower.positions.buffer;
      const initialGeomAttrArray = shower.geometry.attributes.position.array;

      const dt = 0.016; // 60 FPS tick
      for (let frame = 0; frame < 10000; frame++) {
        shower.update(dt);
      }

      // Memory stability: zero reallocations or array detachments
      expect(shower.positions.buffer).toBe(initialBuffer);
      expect(shower.geometry.attributes.position.array).toBe(initialGeomAttrArray);

      // Coordinate sanity check across all 600 droplets
      const pos = shower.positions;
      const bounds = shower.stallBounds;

      for (let i = 0; i < shower.count; i++) {
        const i3 = i * 3;
        const x = pos[i3];
        const y = pos[i3 + 1];
        const z = pos[i3 + 2];

        // Zero NaNs or Infinities
        expect(Number.isFinite(x)).toBe(true);
        expect(Number.isFinite(y)).toBe(true);
        expect(Number.isFinite(z)).toBe(true);

        // Boundary containment with Float32 single-precision tolerance
        expect(x).toBeGreaterThanOrEqual(bounds.minX - 1e-4);
        expect(x).toBeLessThanOrEqual(bounds.maxX + 1e-4);
        expect(z).toBeGreaterThanOrEqual(bounds.minZ - 1e-4);
        expect(z).toBeLessThanOrEqual(bounds.maxZ + 1e-4);
        expect(y).toBeGreaterThanOrEqual(shower.floorY + 0.01);
        expect(y).toBeLessThanOrEqual(shower.headY + 0.05);
      }
    });

    it('handles 1,000 rapid active/inactive toggles without state corruption', () => {
      for (let i = 0; i < 1000; i++) {
        const shouldActive = i % 2 === 1;
        shower.setActive(shouldActive);
        expect(shower.active).toBe(shouldActive);
        expect(shower.points.visible).toBe(shouldActive);
        shower.update(0.016);
      }
    });

    it('early-returns and skips array iteration when inactive', () => {
      shower.setActive(false);
      const pos0 = shower.positions[1]; // y of droplet 0

      // Run 50 ticks while inactive
      for (let i = 0; i < 50; i++) {
        shower.update(0.016);
      }

      // Position should be completely unchanged
      expect(shower.positions[1]).toBe(pos0);
    });

    it('cleans up store subscription and WebGL resources on dispose()', () => {
      shower.dispose();
      expect(shower.unsubscribe).toBeNull();

      // Post-disposal update call must safely no-op
      expect(() => shower.update(0.016)).not.toThrow();
    });

    it('empirically reveals stallBounds coordinate frame defect when passed world coordinates (Bathrooms.js pattern)', () => {
      // In Bathrooms.js, stallBounds is passed using world coordinates (showerX +/- sW*0.5 => [9.65, 10.55])
      // while ShowerParticles emits locally around (0, 0)
      const worldBoundedShower = new ShowerParticles({
        count: 100,
        headY: 2.5,
        floorY: 0.33,
        stallBounds: {
          minX: 9.65,
          maxX: 10.55,
          minZ: 3.5,
          maxZ: 4.7,
          minY: 0.35,
          maxY: 2.5,
        },
      });
      worldBoundedShower.setActive(true);

      // Run 1 tick: droplets emitted near 0 get clamped to minX = 9.65 in local space
      worldBoundedShower.update(0.016);
      const pos = worldBoundedShower.positions;

      // Because stallBounds.minX = 9.65 is treated as local space, local pos[0] is forced to 9.65
      expect(pos[0]).toBeCloseTo(9.65, 2);

      worldBoundedShower.dispose();
    });
  });

  // =========================================================================
  // SUITE 4: Day/Night Clock Overflow & Midnight Boundary Progression
  // =========================================================================
  describe('Suite 4: Day/Night Clock Overflow & Midnight Boundary Progression', () => {
    let scene;
    let renderer;
    let dayNight;

    beforeEach(() => {
      scene = new THREE.Scene();
      renderer = { toneMappingExposure: 1.0 };
      dayNight = createDayNightController(scene, renderer);
    });

    it('cycles cleanly through 3,000 day/sunset/night state transitions without drift', () => {
      const times = ['day', 'sunset', 'night'];

      for (let i = 0; i < 3000; i++) {
        const cur = gameStore.getState().timeOfDay;
        const next = times[(times.indexOf(cur) + 1) % times.length];
        gameStore.setState({ timeOfDay: next });

        dayNight.applyState(next, 'clear');
        const state = dayNight.getState();
        expect(state.timeOfDay).toBe(next);
      }

      // 3000 % 3 === 0 -> must return to 'day'
      expect(gameStore.getState().timeOfDay).toBe('day');
    });

    it('sustains extreme elapsed time values (10,000,000 seconds) in dayNight update loop without crash', () => {
      dayNight.applyState('night', 'rain');

      // Simulate ~115 days of continuous execution
      const hugeElapsed = 10000000.0;
      const dt = 0.016;

      expect(() => {
        for (let step = 0; step < 500; step++) {
          dayNight.update(dt, hugeElapsed + step * dt);
        }
      }).not.toThrow();
    });

    it('maintains non-negative, finite light intensities across all modes and weather conditions', () => {
      const modes = ['day', 'sunset', 'night'];
      const weathers = ['clear', 'cloud', 'rain'];

      for (const m of modes) {
        for (const w of weathers) {
          dayNight.applyState(m, w);

          expect(dayNight.sunLight.intensity).toBeGreaterThanOrEqual(0);
          expect(Number.isFinite(dayNight.sunLight.intensity)).toBe(true);
          expect(renderer.toneMappingExposure).toBeGreaterThan(0);
          expect(Number.isFinite(renderer.toneMappingExposure)).toBe(true);
        }
      }
    });

    it('gracefully handles invalid/adverse timeOfDay inputs without crashing', () => {
      const adverseInputs = [null, undefined, '', 'eclipse', 'morning', 123, NaN];

      for (const bad of adverseInputs) {
        expect(() => dayNight.applyState(bad, 'clear')).not.toThrow();
        expect(dayNight.sunLight.intensity).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // =========================================================================
  // SUITE 5: Exactness of Domestic Kitchen Inventory (37 + 37)
  // =========================================================================
  describe('Suite 5: Exactness of Domestic Kitchen Inventory (37 Utensils + 37 Cookware)', () => {
    let kitchen;

    beforeEach(() => {
      const builder = new KitchenBuilder();
      kitchen = builder.build();
    });

    it('verifies KITCHEN_UTENSIL_INVENTORY data structure sums to exactly 37 items', () => {
      const total = KITCHEN_UTENSIL_INVENTORY.reduce((sum, item) => sum + item.count, 0);
      expect(total).toBe(37);

      // Verify place-setting counts
      const teaspoons = KITCHEN_UTENSIL_INVENTORY.find((u) => u.name === 'Teaspoon');
      const tablespoons = KITCHEN_UTENSIL_INVENTORY.find((u) => u.name === 'Tablespoon');
      const forks = KITCHEN_UTENSIL_INVENTORY.find((u) => u.name === 'Dinner Fork');
      const knives = KITCHEN_UTENSIL_INVENTORY.find((u) => u.name === 'Dinner Knife');

      expect(teaspoons.count).toBe(6);
      expect(tablespoons.count).toBe(6);
      expect(forks.count).toBe(6);
      expect(knives.count).toBe(6);

      // Verify prep tool counts
      const cookingSpoons = KITCHEN_UTENSIL_INVENTORY.find((u) => u.name === 'Cooking Spoon');
      const spatulas = KITCHEN_UTENSIL_INVENTORY.find((u) => u.name === 'Wooden Spatula');
      const ladle = KITCHEN_UTENSIL_INVENTORY.find((u) => u.name === 'Ladle');
      const slotted = KITCHEN_UTENSIL_INVENTORY.find((u) => u.name === 'Slotted Spoon');
      const whisk = KITCHEN_UTENSIL_INVENTORY.find((u) => u.name === 'Whisk');
      const tongs = KITCHEN_UTENSIL_INVENTORY.find((u) => u.name === 'Tongs');
      const peeler = KITCHEN_UTENSIL_INVENTORY.find((u) => u.name === 'Vegetable Peeler');
      const boards = KITCHEN_UTENSIL_INVENTORY.find((u) => u.name === 'Chopping Board');

      expect(cookingSpoons.count).toBe(4);
      expect(spatulas.count).toBe(2);
      expect(ladle.count).toBe(1);
      expect(slotted.count).toBe(1);
      expect(whisk.count).toBe(1);
      expect(tongs.count).toBe(1);
      expect(peeler.count).toBe(1);
      expect(boards.count).toBe(2);
    });

    it('verifies kitchen scene graph contains exactly 37 physical utensil meshes', () => {
      const meshes = kitchen.userData.utensilMeshes;
      expect(meshes).toBeDefined();
      expect(meshes.length).toBe(37);

      for (const m of meshes) {
        expect(m.userData.type).toBe('utensil');
        expect(m.userData.name).toBeDefined();
        expect(m.userData.length).toBeGreaterThan(0.1);
        expect(m.userData.length).toBeLessThan(0.45);

        // Verify position coordinates are finite
        expect(Number.isFinite(m.position.x)).toBe(true);
        expect(Number.isFinite(m.position.y)).toBe(true);
        expect(Number.isFinite(m.position.z)).toBe(true);
      }
    });

    it('verifies KITCHEN_COOKWARE_INVENTORY data structure contains 41 items and exactly 37 core setting', () => {
      const total = KITCHEN_COOKWARE_INVENTORY.reduce((sum, item) => sum + item.count, 0);
      expect(total).toBe(41);

      // Core setting excludes 4 mugs per PROJECT.md Feature F22
      const coreCount = total - 4;
      expect(coreCount).toBe(37);

      // Verify place crockery (6 dinner plates, 6 side plates, 6 bowls, 6 glasses)
      const plates = KITCHEN_COOKWARE_INVENTORY.find((c) => c.name === 'Dinner Plate');
      const sidePlates = KITCHEN_COOKWARE_INVENTORY.find((c) => c.name === 'Side Plate');
      const bowls = KITCHEN_COOKWARE_INVENTORY.find((c) => c.name === 'Bowl');
      const glasses = KITCHEN_COOKWARE_INVENTORY.find((c) => c.name === 'Drinking Glass');
      const mugs = KITCHEN_COOKWARE_INVENTORY.find((c) => c.name === 'Mug');

      expect(plates.count).toBe(6);
      expect(sidePlates.count).toBe(6);
      expect(bowls.count).toBe(6);
      expect(glasses.count).toBe(6);
      expect(mugs.count).toBe(4);
    });

    it('verifies kitchen scene graph contains exactly 41 cookware meshes (37 core setting)', () => {
      const meshes = kitchen.userData.cookwareMeshes;
      expect(meshes).toBeDefined();
      expect(meshes.length).toBe(41);

      const nonMugs = meshes.filter((m) => m.userData.name !== 'Mug');
      expect(nonMugs.length).toBe(37);

      for (const m of meshes) {
        expect(m.userData.type).toBe('cookware');
        expect(m.userData.name).toBeDefined();
        expect(Number.isFinite(m.position.x)).toBe(true);
        expect(Number.isFinite(m.position.y)).toBe(true);
        expect(Number.isFinite(m.position.z)).toBe(true);
      }
    });
  });

  // =========================================================================
  // SUITE 6: Independent State Management of Washer & Tumble Dryer
  // =========================================================================
  describe('Suite 6: Independent State Management of Laundry Appliances', () => {
    let utilityGroup;

    beforeEach(() => {
      const builder = new UtilityRoomBuilder();
      utilityGroup = builder.build();
    });

    it('verifies distinct physical units and interactables for washing machine and dryer', () => {
      const interactables = utilityGroup.userData.interactables;
      expect(interactables.length).toBeGreaterThanOrEqual(2);

      const washer = interactables.find((i) => i.id === 'appliance-washing-machine');
      const dryer = interactables.find((i) => i.id === 'appliance-tumble-dryer');

      expect(washer).toBeDefined();
      expect(dryer).toBeDefined();

      // Physically distinct positions along Z axis (washer at Z=-7.2, dryer at Z=-7.95)
      expect(washer.z).toBeCloseTo(-7.2, 1);
      expect(dryer.z).toBeCloseTo(-7.95, 1);
      expect(Math.abs(washer.z - dryer.z)).toBeGreaterThanOrEqual(0.6);
    });

    it('verifies washing machine and dryer toggle strictly independently in gameStore', () => {
      const initialState = gameStore.getState().appliances;
      expect(initialState.washerRunning).toBe(false);
      expect(initialState.dryerRunning).toBe(false);

      // 1. Turn on washer
      const resW1 = gameStore.toggleAppliance('washerRunning');
      expect(resW1).toBe(true);
      expect(gameStore.getState().appliances.washerRunning).toBe(true);
      expect(gameStore.getState().appliances.dryerRunning).toBe(false); // Dryer unaffected

      // 2. Turn on dryer
      const resD1 = gameStore.toggleAppliance('dryerRunning');
      expect(resD1).toBe(true);
      expect(gameStore.getState().appliances.washerRunning).toBe(true); // Washer unaffected
      expect(gameStore.getState().appliances.dryerRunning).toBe(true);

      // 3. Turn off washer
      const resW2 = gameStore.toggleAppliance('washerRunning');
      expect(resW2).toBe(false);
      expect(gameStore.getState().appliances.washerRunning).toBe(false);
      expect(gameStore.getState().appliances.dryerRunning).toBe(true); // Dryer still running

      // 4. Turn off dryer
      const resD2 = gameStore.toggleAppliance('dryerRunning');
      expect(resD2).toBe(false);
      expect(gameStore.getState().appliances.washerRunning).toBe(false);
      expect(gameStore.getState().appliances.dryerRunning).toBe(false);
    });

    it('maintains strict independence under 1,000 randomized interleaved toggles', () => {
      let expectedWasher = false;
      let expectedDryer = false;

      for (let i = 0; i < 1000; i++) {
        if (Math.random() < 0.5) {
          expectedWasher = !expectedWasher;
          gameStore.toggleAppliance('washerRunning');
        } else {
          expectedDryer = !expectedDryer;
          gameStore.toggleAppliance('dryerRunning');
        }

        const current = gameStore.getState().appliances;
        expect(current.washerRunning).toBe(expectedWasher);
        expect(current.dryerRunning).toBe(expectedDryer);
      }
    });
  });
});
