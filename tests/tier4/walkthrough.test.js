import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../harness/mockEnv.js';
import { simulateKeyDown } from '../harness/mockEnv.js';
import { createIntegratedTestRig, createMockInteractable } from '../harness/testFixtures.js';
import { gameStore } from '../../src/state/gameStore.js';
import { AudioEngine } from '../../src/assets/procedural/AudioEngine.js';
import {
  START_POSITION,
  WORLD_DIMENSIONS,
  resolveGroundHeightAt,
  detectZoneAt,
} from '../../src/house/HouseArchitecture.js';

describe('Tier 4: Real-World Player Walkthrough Scenarios', () => {
  let rig;
  let audio;

  beforeEach(() => {
    gameStore.resetExperience();
    rig = createIntegratedTestRig();
    audio = new AudioEngine();
    audio.unlock();
  });

  afterEach(() => {
    rig.dispose();
    audio.dispose();
  });

  it('executes full end-to-end architectural exploration from garden gate to upper balconies', () => {
    // -------------------------------------------------------------------------
    // STAGE 1: Arrival at Garden Gate & Central Sandstone Pathway
    // -------------------------------------------------------------------------
    // 1.1 Verify initial spawn position at Arrival Plaza (Z = 39.2m)
    expect(rig.playerCtrl.position.x).toBe(START_POSITION.x);
    expect(rig.playerCtrl.position.z).toBe(START_POSITION.z);
    expect(rig.playerCtrl.position.y).toBeCloseTo(0.03, 2);

    // 1.2 Verify starting zone is Flower Garden
    let zone = detectZoneAt(rig.playerCtrl.position.x, rig.playerCtrl.position.y, rig.playerCtrl.position.z);
    expect(zone.zoneId).toBe('flower-garden');
    expect(gameStore.getState().discoveredZones).toContain('flower-garden');

    // 1.3 Walk along the central sandstone pathway toward porch landing (Z = 39.2 -> 13.0m)
    for (let step = 0; step <= 25; step++) {
      const t = step / 25;
      rig.playerCtrl.position.z = 39.2 - t * (39.2 - 13.0);
      rig.playerCtrl.position.x = 3.5;
      rig.playerCtrl.update(0.05);
    }

    // Footstep surface on pathway resolves to 'stone'
    const surfaceOnPath = rig.playerCtrl._getSurfaceAt(
      rig.playerCtrl.position.x,
      rig.playerCtrl.position.y,
      rig.playerCtrl.position.z
    );
    expect(surfaceOnPath).toBe('stone');
    expect(rig.playerCtrl.position.z).toBeCloseTo(13.0, 1);

    // -------------------------------------------------------------------------
    // STAGE 2: Front Porch Ascent & Main Entrance Door
    // -------------------------------------------------------------------------
    // 2.1 Ascend porch steps (Z = 12.9 -> 11.0m) onto ground slab plinth (Y = 0.30m)
    for (let step = 0; step <= 10; step++) {
      const t = step / 10;
      rig.playerCtrl.position.z = 12.9 - t * (12.9 - 11.0);
      rig.playerCtrl.update(0.1);
    }
    expect(rig.playerCtrl.position.y).toBeCloseTo(WORLD_DIMENSIONS.groundSlabTop, 2);

    // 2.2 Verify zone transitions to Front Porch
    zone = detectZoneAt(rig.playerCtrl.position.x, rig.playerCtrl.position.y, rig.playerCtrl.position.z);
    expect(zone.zoneId).toBe('front-porch');
    gameStore.discoverZone(zone.zoneId, zone.label);
    expect(gameStore.getState().discoveredZones).toContain('front-porch');

    // 2.3 Approach main entrance door at (X = 3.5, Z = 8.875)
    // Register door collider and interactable
    const mainDoorCollider = rig.collisionSystem.addBox(3.0, 0.3, 8.8, 4.0, 2.7, 8.95, 'door-main');
    rig.collisionSystem.registerDoorCollider('door-main-entrance', mainDoorCollider);

    const doorItem = createMockInteractable({
      id: 'door-main-entrance',
      x: 3.5,
      y: 1.5,
      z: 8.875,
      range: 2.0,
      prompt: 'Open Entrance Door',
      onInteract: () => {
        const nextState = gameStore.toggleDoor('door-main-entrance');
        rig.collisionSystem.setDoorOpen('door-main-entrance', nextState);
        audio.playDoorToggle(nextState);
      },
    });
    rig.scene.add(doorItem.mesh);
    rig.interactionManager.register(doorItem);

    // Move player in front of door at Z = 9.5m, looking at door
    rig.playerCtrl.position.set(3.5, 0.3, 9.5);
    rig.camera.position.set(3.5, 1.65, 9.5);
    rig.camera.lookAt(3.5, 1.65, 8.875);
    rig.camera.updateMatrixWorld(true);

    rig.interactionManager.update();
    expect(gameStore.getState().activeTarget?.id).toBe('door-main-entrance');

    // 2.4 Press E to open door
    simulateKeyDown('KeyE');
    expect(gameStore.getState().doors['door-main-entrance']).toBe(true);
    expect(mainDoorCollider.active).toBe(false);

    // 2.5 Walk through open doorway into Entrance Foyer (Z = 7.5m)
    rig.playerCtrl.position.set(3.5, 0.3, 7.5);
    rig.collisionSystem.resolveMovement(rig.playerCtrl.position);
    expect(rig.playerCtrl.position.z).toBe(7.5);

    // -------------------------------------------------------------------------
    // STAGE 3: Ground Floor Exploration & Domestic Inspection
    // -------------------------------------------------------------------------
    // 3.1 Navigate into Main Living Hall (X = -3.0, Z = 5.0)
    rig.playerCtrl.position.set(-3.0, 0.3, 5.0);
    zone = detectZoneAt(rig.playerCtrl.position.x, rig.playerCtrl.position.y, rig.playerCtrl.position.z);
    expect(zone.zoneId).toBe('living-hall');
    gameStore.discoverZone(zone.zoneId, zone.label);
    expect(gameStore.getState().discoveredZones).toContain('living-hall');

    // Footstep surface inside living hall is timber (oak)
    const livingSurface = rig.playerCtrl._getSurfaceAt(-3.0, 0.3, 5.0);
    expect(livingSurface).toBe('timber');

    // 3.2 Sit on sofa and verify interaction state
    const sofaSeat = { id: 'living-sofa', label: 'Living Room Sofa', x: -3.0, y: 0.42, z: 5.0 };
    rig.playerCtrl.sitAt(sofaSeat);
    expect(gameStore.getState().seatedSeat?.id).toBe('living-sofa');

    // Stand up from sofa
    simulateKeyDown('Space');
    expect(gameStore.getState().seatedSeat).toBeNull();

    // 3.3 Walk into Kitchen (X = -9.0, Z = 6.5)
    rig.playerCtrl.position.set(-9.0, 0.3, 6.5);
    zone = detectZoneAt(rig.playerCtrl.position.x, rig.playerCtrl.position.y, rig.playerCtrl.position.z);
    expect(zone.zoneId).toBe('kitchen');
    gameStore.discoverZone(zone.zoneId, zone.label);
    expect(gameStore.getState().discoveredZones).toContain('kitchen');

    // Surface in kitchen is limestone tile
    const kitchenSurface = rig.playerCtrl._getSurfaceAt(-9.0, 0.3, 6.5);
    expect(kitchenSurface).toBe('tile');

    // 3.4 Walk into Dining & Family Hall (X = -9.0, Z = 2.0)
    rig.playerCtrl.position.set(-9.0, 0.3, 2.0);
    zone = detectZoneAt(rig.playerCtrl.position.x, rig.playerCtrl.position.y, rig.playerCtrl.position.z);
    expect(zone.zoneId).toBe('dining-hall');
    gameStore.discoverZone(zone.zoneId, zone.label);
    expect(gameStore.getState().discoveredZones).toContain('dining-hall');

    // 3.5 Visit Dedicated Laundry & Utility Room (X = 6.0, Z = -7.5)
    rig.playerCtrl.position.set(6.0, 0.3, -7.5);
    zone = detectZoneAt(rig.playerCtrl.position.x, rig.playerCtrl.position.y, rig.playerCtrl.position.z);
    expect(zone.zoneId).toBe('laundry-room');
    gameStore.discoverZone(zone.zoneId, zone.label);
    expect(gameStore.getState().discoveredZones).toContain('laundry-room');

    // Start washing machine and tumble dryer
    gameStore.toggleAppliance('washerRunning');
    gameStore.toggleAppliance('dryerRunning');
    expect(gameStore.getState().appliances.washerRunning).toBe(true);
    expect(gameStore.getState().appliances.dryerRunning).toBe(true);

    // 3.6 Visit Ground Bedroom 1 (X = 9.5, Z = 6.5)
    rig.playerCtrl.position.set(9.5, 0.3, 6.5);
    zone = detectZoneAt(rig.playerCtrl.position.x, rig.playerCtrl.position.y, rig.playerCtrl.position.z);
    expect(zone.zoneId).toBe('bedroom-1');
    gameStore.discoverZone(zone.zoneId, zone.label);
    expect(gameStore.getState().discoveredZones).toContain('bedroom-1');

    // 3.7 Enter Ensuite Bathroom 1 (X = 10.5, Z = 3.5)
    rig.playerCtrl.position.set(10.5, 0.3, 3.5);
    zone = detectZoneAt(rig.playerCtrl.position.x, rig.playerCtrl.position.y, rig.playerCtrl.position.z);
    expect(zone.zoneId).toBe('bathroom-1');
    gameStore.discoverZone(zone.zoneId, zone.label);
    expect(gameStore.getState().discoveredZones).toContain('bathroom-1');

    // Toggle shower on
    gameStore.toggleShower('bath1');
    expect(gameStore.getState().showers.bath1).toBe(true);

    // -------------------------------------------------------------------------
    // STAGE 4: Central Wooden Staircase Vertical Ascent
    // -------------------------------------------------------------------------
    // 4.1 Walk to stair hall base (X = 1.85, Z = 5.7, Y = 0.30m)
    rig.playerCtrl.position.set(1.85, 0.3, 5.7);
    expect(rig.playerCtrl.position.y).toBeCloseTo(0.3, 2);

    // 4.2 Ascend 18 steps from Z = 5.7 to Z = 1.7
    for (let step = 0; step <= 20; step++) {
      const t = step / 20;
      rig.playerCtrl.position.z = 5.7 - t * (5.7 - 1.7);
      rig.playerCtrl.update(0.1);
    }

    // 4.3 Reached top of stairs at Upper Floor datum (Y = 3.95m)
    expect(rig.playerCtrl.position.y).toBeCloseTo(3.95, 1);

    // -------------------------------------------------------------------------
    // STAGE 5: Upper Level Exploration & Balconies
    // -------------------------------------------------------------------------
    // 5.1 Upper Gallery Landing (X = 0.0, Z = 0.0, Y = 3.95m)
    rig.playerCtrl.position.set(0.0, 3.95, 0.0);
    const upperFloorH = resolveGroundHeightAt(0.0, 0.0, 3.95);
    expect(upperFloorH).toBe(WORLD_DIMENSIONS.upperFloorY);

    // 5.2 Visit Guest Bedroom 2 (X = -9.5, Z = 2.0, Y = 3.95m)
    rig.playerCtrl.position.set(-9.5, 3.95, 2.0);
    zone = detectZoneAt(rig.playerCtrl.position.x, rig.playerCtrl.position.y, rig.playerCtrl.position.z);
    expect(zone.zoneId).toBe('bedroom-2');
    gameStore.discoverZone(zone.zoneId, zone.label);
    expect(gameStore.getState().discoveredZones).toContain('bedroom-2');

    // 5.3 Visit Ensuite Bathroom 2 (X = -10.5, Z = 5.5, Y = 3.95m)
    rig.playerCtrl.position.set(-10.5, 3.95, 5.5);
    zone = detectZoneAt(rig.playerCtrl.position.x, rig.playerCtrl.position.y, rig.playerCtrl.position.z);
    expect(zone.zoneId).toBe('bathroom-2');
    gameStore.discoverZone(zone.zoneId, zone.label);
    expect(gameStore.getState().discoveredZones).toContain('bathroom-2');

    // 5.4 Step out onto Main Balcony (X = -3.0, Z = -9.8, Y = 3.95m)
    rig.playerCtrl.position.set(-3.0, 3.95, -9.8);
    zone = detectZoneAt(rig.playerCtrl.position.x, rig.playerCtrl.position.y, rig.playerCtrl.position.z);
    expect(zone.zoneId).toBe('balcony');
    gameStore.discoverZone(zone.zoneId, zone.label);
    expect(gameStore.getState().discoveredZones).toContain('balcony');

    // Surface on balcony is teak timber decking
    const balconySurface = rig.playerCtrl._getSurfaceAt(-3.0, 3.95, -9.8);
    expect(balconySurface).toBe('timber');

    // -------------------------------------------------------------------------
    // STAGE 6: Visit Pool Terrace & Verify Discovery Completeness
    // -------------------------------------------------------------------------
    // 6.1 Move to Pool Terrace (X = -7.0, Z = -13.5)
    rig.playerCtrl.position.set(-7.0, 0.25, -10.0); // terrace apron outside pool basin
    zone = detectZoneAt(rig.playerCtrl.position.x, rig.playerCtrl.position.y, rig.playerCtrl.position.z);
    expect(zone.zoneId).toBe('pool-terrace');
    gameStore.discoverZone(zone.zoneId, zone.label);
    expect(gameStore.getState().discoveredZones).toContain('pool-terrace');

    // 6.2 Verify extensive discovery zone progress across the estate
    const discovered = gameStore.getState().discoveredZones;
    expect(discovered.length).toBeGreaterThanOrEqual(10);

    // 6.3 Test audio mute toggle
    expect(gameStore.getState().muted).toBe(false);
    simulateKeyDown('KeyM');
    expect(gameStore.getState().muted).toBe(true);
    simulateKeyDown('KeyM');
    expect(gameStore.getState().muted).toBe(false);

    // 6.4 Reset Experience
    gameStore.resetExperience();
    expect(gameStore.getState().currentZoneId).toBe('flower-garden');
    expect(gameStore.getState().discoveredZones.length).toBe(1);
    expect(gameStore.getState().showers.bath1).toBe(false);
  });
});
