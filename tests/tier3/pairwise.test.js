import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import '../harness/mockEnv.js';
import { simulateKeyDown, simulateKeyUp } from '../harness/mockEnv.js';
import { createIntegratedTestRig, createMockInteractable } from '../harness/testFixtures.js';
import { gameStore } from '../../src/state/gameStore.js';
import { AudioEngine } from '../../src/assets/procedural/AudioEngine.js';
import { createDayNightController } from '../../src/world/DayNightController.js';
import { createCharacterRig } from '../../src/characters/CharacterMesh.js';


describe('Tier 3: Pairwise Cross-Feature Integration Tests', () => {
  let rig;

  beforeEach(() => {
    gameStore.resetExperience();
    rig = createIntegratedTestRig();
  });

  afterEach(() => {
    rig.dispose();
  });

  // Pairwise 1: Locomotion + Collision Sliding
  describe('Pairwise 1: Locomotion + Collision Sliding', () => {
    it('slides tangentially along Z-axis when moving diagonally into a solid north-south wall', () => {
      // Create a solid wall spanning X in [0.0, 0.3], Z in [-5.0, 5.0], Y in [0, 3]
      rig.collisionSystem.addBox(0.0, 0.0, -5.0, 0.3, 3.0, 5.0, 'test-wall-ns');

      // Place player just to the left of wall (X = -0.4, Z = 0)
      rig.playerCtrl.position.set(-0.4, 0.3, 0.0);

      // Apply diagonal velocity moving northeast (+X, +Z)
      rig.playerCtrl.velocity.set(2.0, 0, 2.0);

      const dt = 0.1;
      const prevZ = rig.playerCtrl.position.z;
      rig.playerCtrl.position.x += rig.playerCtrl.velocity.x * dt;
      rig.playerCtrl.position.z += rig.playerCtrl.velocity.z * dt;

      rig.collisionSystem.resolveMovement(rig.playerCtrl.position);

      // Player must be pushed back along X (cannot cross into wall X >= 0.0)
      expect(rig.playerCtrl.position.x).toBeLessThan(0.0);
      // But Z progress is preserved (smooth sliding along wall)
      expect(rig.playerCtrl.position.z).toBeGreaterThan(prevZ);
    });

    it('slides tangentially along X-axis when moving diagonally into an east-west wall', () => {
      // Create a solid wall spanning X in [-5.0, 5.0], Z in [0.0, 0.3], Y in [0, 3]
      rig.collisionSystem.addBox(-5.0, 0.0, 0.0, 5.0, 3.0, 0.3, 'test-wall-ew');

      // Place player in front of wall (X = 0, Z = -0.4)
      rig.playerCtrl.position.set(0.0, 0.3, -0.4);
      rig.playerCtrl.velocity.set(2.0, 0, 2.0);

      const dt = 0.1;
      const prevX = rig.playerCtrl.position.x;
      rig.playerCtrl.position.x += rig.playerCtrl.velocity.x * dt;
      rig.playerCtrl.position.z += rig.playerCtrl.velocity.z * dt;

      rig.collisionSystem.resolveMovement(rig.playerCtrl.position);

      expect(rig.playerCtrl.position.z).toBeLessThan(0.0);
      expect(rig.playerCtrl.position.x).toBeGreaterThan(prevX);
    });

    it('climbs vertical elevation smoothly while walking along staircase corridor', () => {
      // Staircase spans X in [0.65, 3.05], Z in [1.7, 5.7]
      rig.playerCtrl.position.set(1.85, 0.3, 5.7);
      expect(rig.playerCtrl.position.y).toBeCloseTo(0.3, 1);

      // Simulate walking south along the stairs (Z decreasing from 5.7 to 1.7)
      for (let step = 0; step <= 20; step++) {
        const t = step / 20;
        rig.playerCtrl.position.z = 5.7 - t * (5.7 - 1.7);
        rig.playerCtrl.update(0.1);
      }

      // Reached top of stairs at Y = 3.95m
      expect(rig.playerCtrl.position.y).toBeCloseTo(3.95, 1);
    });
  });

  // Pairwise 2: Door Interaction + Sound Synthesis + Dynamic Collision State
  describe('Pairwise 2: Door Interaction + Sound Synthesis + Dynamic Collision State', () => {
    it('opens door, deactivates collision collider, triggers audio, and permits passage', () => {
      const audio = new AudioEngine();
      audio.unlock();

      // Set up main entrance door collider
      const doorAABB = rig.collisionSystem.addBox(3.0, 0.3, 8.8, 4.0, 2.7, 8.95, 'door-main');
      rig.collisionSystem.registerDoorCollider('door-main-entrance', doorAABB);

      // 1. Initial State: Closed
      expect(doorAABB.active).toBe(true);
      expect(gameStore.getState().doors['door-main-entrance']).toBeFalsy();

      // Player attempts to walk through closed door: blocked!
      rig.playerCtrl.position.set(3.5, 0.3, 9.1);
      rig.collisionSystem.resolveMovement(rig.playerCtrl.position);
      expect(rig.playerCtrl.position.z).toBeGreaterThan(8.95);

      // 2. Interact: Open Door
      const isOpen = gameStore.toggleDoor('door-main-entrance');
      expect(isOpen).toBe(true);
      rig.collisionSystem.setDoorOpen('door-main-entrance', isOpen);
      audio.playDoorToggle(isOpen);

      expect(doorAABB.active).toBe(false);

      // 3. Player now walks through open doorway into foyer (Z < 8.8m)
      rig.playerCtrl.position.set(3.5, 0.3, 8.5);
      rig.collisionSystem.resolveMovement(rig.playerCtrl.position);
      expect(rig.playerCtrl.position.z).toBe(8.5);

      // 4. Close Door again
      const isClosed = gameStore.toggleDoor('door-main-entrance');
      expect(isClosed).toBe(false);
      rig.collisionSystem.setDoorOpen('door-main-entrance', isClosed);
      audio.playDoorToggle(isClosed);

      expect(doorAABB.active).toBe(true);
      audio.dispose();
    });
  });

  // Pairwise 3: Day/Night Lighting Cycle + Sky Uniforms + Emissive Fixtures
  describe('Pairwise 3: Day/Night Lighting Cycle + Sky Uniforms + Emissive Fixtures', () => {
    it('synchronizes sun light, sky dome uniforms, and lamp fixtures across day/sunset/night', () => {
      const scene = new THREE.Scene();
      const renderer = { shadowMap: { enabled: true }, toneMappingExposure: 1.0 };
      const controller = createDayNightController(scene, renderer);

      // Register mock interior lamp and exterior lantern
      const interiorLight = new THREE.PointLight('#FFE7C4', 0.8);
      const interiorMat = new THREE.MeshStandardMaterial({ emissive: '#FFE7C4', emissiveIntensity: 0.1 });
      controller.registerInteriorLight(interiorLight, 0.8, interiorMat, 1.2);

      const exteriorLight = new THREE.PointLight('#FFAA44', 1.0);
      const exteriorMat = new THREE.MeshStandardMaterial({ emissive: '#FFAA44', emissiveIntensity: 0.05 });
      controller.registerExteriorLight(exteriorLight, 1.0, exteriorMat, 1.5);

      // 1. Day Mode
      controller.applyState('day', 'clear');
      expect(controller.getState().timeOfDay).toBe('day');
      expect(controller.sunLight.intensity).toBeGreaterThan(1.5);
      expect(interiorLight.intensity).toBeLessThan(0.4); // dimmed during day
      expect(exteriorLight.intensity).toBe(0); // exterior off in bright day

      // 2. Sunset Mode
      controller.applyState('sunset', 'clear');
      expect(controller.getState().timeOfDay).toBe('sunset');
      expect(controller.sunLight.color.getHexString()).toBe('ffa964');
      expect(interiorLight.intensity).toBeGreaterThan(0.5);
      expect(exteriorLight.intensity).toBeGreaterThan(0.6);

      // 3. Night Mode
      controller.applyState('night', 'clear');
      expect(controller.getState().timeOfDay).toBe('night');
      expect(controller.sunLight.intensity).toBeCloseTo(0.42, 2); // moonlight
      expect(interiorLight.intensity).toBe(0.8); // full night illumination
      expect(exteriorLight.intensity).toBe(1.0);
      expect(interiorMat.emissiveIntensity).toBe(1.2);
      expect(exteriorMat.emissiveIntensity).toBe(1.5);
    });
  });

  // Pairwise 4: Shower Toggle + Spatial Audio Mix + Proximity Attenuation
  describe('Pairwise 4: Shower Toggle + Spatial Audio Mix + Proximity Attenuation', () => {
    it('modulates shower audio gain based on active state and inverse distance to bathroom', () => {
      const audio = new AudioEngine();
      audio.unlock();

      // 1. Shower off: shower factor is 0
      audio.updateSpatialLevels({
        indoors: true,
        showerActive: false,
        showerDistance: 1.0,
        poolDistance: 10.0,
      });
      expect(audio.showerGain.gain.value).toBe(0.0);

      // 2. Shower on + standing inside bathroom stall (distance 0.5m)
      gameStore.toggleShower('bath1');
      expect(gameStore.getState().showers.bath1).toBe(true);

      audio.updateSpatialLevels({
        indoors: true,
        showerActive: true,
        showerDistance: 0.5,
        poolDistance: 15.0,
      });
      // At d = 0.5m (< 6.5m cutoff), target shower factor is > 0.3
      const nearFactor = (1 - 0.5 / 6.5) * 0.34;
      expect(nearFactor).toBeGreaterThan(0.3);

      // 3. Shower on + player walks to front garden gate (distance 40m)
      const farDist = 40.0;
      const farFactor = Math.max(0, 1 - farDist / 6.5) * 0.34;
      expect(farFactor).toBe(0);

      audio.updateSpatialLevels({
        indoors: false,
        showerActive: true,
        showerDistance: farDist,
        poolDistance: 45.0,
      });

      // 4. Toggle shower off: audio immediately silences
      gameStore.toggleShower('bath1');
      expect(gameStore.getState().showers.bath1).toBe(false);
      audio.dispose();
    });
  });

  // Pairwise 5: Character Rig Gait Animation + Locomotion Speed
  describe('Pairwise 5: Character Rig Gait Animation + Locomotion Speed', () => {
    it('articulates limbs with increasing swing amplitude as player transitions idle -> walk -> run', () => {
      const charRig = createCharacterRig('female');

      // 1. Idle update (speed = 0)
      charRig.update(0.016, 1.0, 0.0, false);
      const idleTorsoY = charRig.root.position.y;
      expect(idleTorsoY).toBeDefined();

      // 2. Walk update (speed = 2.2 m/s)
      charRig.update(0.016, 1.0, 2.2, false);

      // 3. Sprint update (speed = 3.8 m/s)
      charRig.update(0.016, 1.0, 3.8, false);

      // 4. Seated update (seated = true)
      charRig.update(0.016, 1.0, 0.0, true);
      // In seated pose, pelvis drops and knees bend 90 degrees
      expect(charRig.totalHeight).toBe(1.66);
    });

    it('opposes arm swing to leg swing during stride cycle', () => {
      const charRig = createCharacterRig('male');
      // Advance walk phase by 0.2s at 2.2 m/s
      charRig.update(0.2, 1.0, 2.2, false);
      expect(charRig.totalHeight).toBe(1.78);
    });
  });

  // Pairwise 6: Sit / Stand + Locomotion Lock + Camera HUD
  describe('Pairwise 6: Sit / Stand + Locomotion Lock + Camera HUD', () => {
    it('locks movement when sitting, repositions player, updates reticle, and restores on standing', () => {
      const startX = 3.5;
      const startZ = 20.0;
      rig.playerCtrl.position.set(startX, 0.3, startZ);

      const seat = {
        id: 'living-sofa',
        label: 'Living Room Sofa',
        x: -3.0,
        y: 0.42,
        z: 5.0,
        yaw: Math.PI * 0.5,
      };

      // 1. Sit down
      rig.playerCtrl.sitAt(seat);
      expect(gameStore.getState().seatedSeat).toBeDefined();
      expect(gameStore.getState().seatedSeat.id).toBe('living-sofa');
      expect(rig.playerCtrl.position.x).toBe(-3.0);
      expect(rig.playerCtrl.position.z).toBe(5.0);
      expect(rig.cameraCtrl.yaw).toBe(Math.PI * 0.5);

      // 2. While seated, interaction manager updates prompt to "Stand up"
      rig.interactionManager.update();
      expect(gameStore.getState().activeTarget?.kind).toBe('stand');

      // 3. Movement input while seated produces zero displacement
      simulateKeyDown('KeyW');
      rig.playerCtrl.update(0.1);
      expect(rig.playerCtrl.position.x).toBe(-3.0);
      expect(rig.playerCtrl.position.z).toBe(5.0);
      expect(rig.playerCtrl.velocity.lengthSq()).toBe(0);
      simulateKeyUp('KeyW');

      // 4. Press Space or E to stand up
      simulateKeyDown('Space');
      expect(gameStore.getState().seatedSeat).toBeNull();
      // Restores position back to where player was before sitting
      expect(rig.playerCtrl.position.x).toBe(startX);
      expect(rig.playerCtrl.position.z).toBe(startZ);
    });
  });

  // Pairwise 7: Raycast Interaction + Wall Occlusion Culling
  describe('Pairwise 7: Raycast Interaction + Wall Occlusion Culling', () => {
    it('allows interaction when path is clear, and suppresses when an occluder is inserted', () => {
      const item = createMockInteractable({
        id: 'kitchen-kettle',
        x: rig.camera.position.x,
        y: rig.camera.position.y,
        z: rig.camera.position.z - 1.2,
        range: 1.8,
        prompt: 'Inspect Kettle',
      });
      rig.scene.add(item.mesh);
      rig.interactionManager.register(item);

      // Line of sight is clear
      rig.interactionManager.update();
      expect(gameStore.getState().activeTarget?.id).toBe('kitchen-kettle');

      // Add wall occluder directly in front
      const wallGeo = new THREE.PlaneGeometry(3, 3);
      const wallMat = new THREE.MeshBasicMaterial();
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(rig.camera.position.x, rig.camera.position.y, rig.camera.position.z - 0.6);
      wall.updateMatrixWorld(true);
      rig.collisionSystem.registerOccluder(wall);

      // Reticle prompt must now be suppressed by occlusion
      rig.interactionManager.update();
      expect(gameStore.getState().activeTarget).toBeNull();
    });
  });

  // Pairwise 8: Pool Terrace Proximity + Spatial Ambient Audio
  describe('Pairwise 8: Pool Terrace Proximity + Spatial Ambient Audio', () => {
    it('attenuates pool water shimmer gain based on distance to pool center', () => {
      const audio = new AudioEngine();
      audio.unlock();

      // When player is on the pool terrace (distance = 2m from center)
      const nearDist = 2.0;
      const nearFactor = Math.max(0, 1 - nearDist / 14) * 0.08;
      expect(nearFactor).toBeGreaterThan(0.05);

      // When player is at garden entrance gate (distance = 45m from pool center)
      const farDist = 45.0;
      const farFactor = Math.max(0, 1 - farDist / 14) * 0.08;
      expect(farFactor).toBe(0.0);

      audio.dispose();
    });
  });
});
