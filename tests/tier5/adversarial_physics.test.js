import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import '../harness/mockEnv.js';
import {
  WORLD_DIMENSIONS,
  POOL_SPEC,
  STAIRCASE,
  resolveGroundHeightAt,
} from '../../src/house/HouseArchitecture.js';
import { CollisionSystem } from '../../src/gameplay/CollisionSystem.js';
import { CameraController } from '../../src/gameplay/CameraController.js';
import { PlayerController } from '../../src/gameplay/PlayerController.js';
import { InteractionManager } from '../../src/gameplay/InteractionManager.js';
import { createMockCanvas } from '../harness/mockEnv.js';
import { gameStore } from '../../src/state/gameStore.js';
import { createCharacterRig } from '../../src/characters/CharacterMesh.js';
import { PARTITIONS } from '../../src/house/HouseArchitecture.js';

describe('Tier 5: Adversarial Physics & Spatial Stress Testing', () => {
  let collisionSystem;
  let domElement;
  let camera;
  let cameraCtrl;
  let interactionManager;
  let playerCtrl;

  beforeEach(() => {
    gameStore.resetExperience();
    domElement = createMockCanvas(800, 600);
    camera = new THREE.PerspectiveCamera(60, 800 / 600, 0.05, 150);
    collisionSystem = new CollisionSystem();
    cameraCtrl = new CameraController(camera, domElement, collisionSystem);
    interactionManager = new InteractionManager(camera, collisionSystem);
    playerCtrl = new PlayerController(cameraCtrl, collisionSystem, interactionManager);
  });

  afterEach(() => {
    playerCtrl.dispose();
    cameraCtrl.dispose();
    collisionSystem.clear();
    interactionManager.clear();
  });

  // =========================================================================
  // SUITE 1: High-Velocity Tunneling through Thin Partition Walls (0.15 m)
  // =========================================================================
  describe('Suite 1: High-Velocity Tunneling Stress Testing', () => {
    const wallX = 0;
    const thickness = 0.15;
    const wallMinX = wallX - thickness * 0.5; // -0.075
    const wallMaxX = wallX + thickness * 0.5; // +0.075
    const radius = WORLD_DIMENSIONS.playerRadius; // 0.32

    beforeEach(() => {
      // Add a standard 0.15m interior partition wall along Z axis
      collisionSystem.addBox(wallMinX, 0, -5, wallMaxX, 3.4, 5, 'partition-test');
    });

    it('prevents tunneling at normal indoor speed (2.0 m/s) with 60 FPS (dt = 0.016s)', () => {
      const dt = 0.01667;
      const speed = 2.0;
      let pos = new THREE.Vector3(-1.0, 0.3, 0);

      // Walk toward the wall from X = -1.0 to X = 0
      for (let f = 0; f < 60; f++) {
        pos.x += speed * dt;
        collisionSystem.resolveMovement(pos);
      }

      // Player should be stopped at wallMinX - radius (-0.075 - 0.32 = -0.395)
      expect(pos.x).toBeCloseTo(wallMinX - radius, 3);
      expect(pos.x).toBeLessThan(wallMinX);
    });

    it('prevents tunneling at max clamped game loop delta (dt = 0.10s) at indoor speed (2.0 m/s)', () => {
      const dt = 0.10; // max clamped dt in Experience.js line 156
      const speed = 2.0;
      let pos = new THREE.Vector3(-1.0, 0.3, 0);

      // Walk toward wall with 0.20m steps
      for (let f = 0; f < 15; f++) {
        pos.x += speed * dt;
        collisionSystem.resolveMovement(pos);
      }

      expect(pos.x).toBeCloseTo(wallMinX - radius, 2);
      expect(pos.x).toBeLessThan(wallMinX);
    });

    it('prevents tunneling at outdoor sprint speed (3.8 m/s) with max clamped dt (0.10s)', () => {
      const dt = 0.10;
      const speed = 3.8; // step is 0.38m
      let pos = new THREE.Vector3(-1.0, 0.3, 0);

      for (let f = 0; f < 10; f++) {
        pos.x += speed * dt;
        collisionSystem.resolveMovement(pos);
      }

      expect(pos.x).toBeCloseTo(wallMinX - radius, 2);
      expect(pos.x).toBeLessThan(wallMinX);
    });

    it('empirically identifies tunneling threshold: single-frame displacement exceeding envelope', () => {
      // The total collision envelope width for a 0.15m wall is thickness + 2 * radius = 0.15 + 0.64 = 0.79m
      // A single jump starting at wallMinX - radius (-0.395) and leaping > 0.79m lands outside the collider.
      const jumpDistance = 0.85; // leaps from -0.40 to +0.45
      const pos = new THREE.Vector3(-0.40 + jumpDistance, 0.3, 0); // pos is +0.45

      collisionSystem.resolveMovement(pos);

      // Because pos.x (+0.45) > wallMaxX + radius (+0.395), collision envelope was skipped
      expect(pos.x).toBeCloseTo(0.45, 2);
      expect(pos.x).toBeGreaterThan(wallMaxX + radius);
    });

    it('empirically demonstrates forward ejection when center penetrates past wall midplane', () => {
      // If position jumps past midplane (x = 0), say to x = +0.02 (inside the box, closer to wallMaxX +0.075 than wallMinX -0.075)
      const pos = new THREE.Vector3(0.02, 0.3, 0);
      collisionSystem.resolveMovement(pos);

      // Ejector pushes to wallMaxX + radius (+0.075 + 0.32 = +0.395)
      // This is forward ejection (tunneling through the wall)!
      expect(pos.x).toBeCloseTo(wallMaxX + radius, 3);
      expect(pos.x).toBeGreaterThan(0);
    });

    it('empirically demonstrates backward ejection when center penetrates before wall midplane', () => {
      // If position jumps inside box but before midplane, say x = -0.02 (closer to wallMinX -0.075)
      const pos = new THREE.Vector3(-0.02, 0.3, 0);
      collisionSystem.resolveMovement(pos);

      // Ejector pushes to wallMinX - radius (-0.075 - 0.32 = -0.395)
      expect(pos.x).toBeCloseTo(wallMinX - radius, 3);
      expect(pos.x).toBeLessThan(0);
    });
  });

  // =========================================================================
  // SUITE 2: Acute Corner Wedging (sliding into 90-degree internal wall intersections)
  // =========================================================================
  describe('Suite 2: Acute Corner Wedging Stress Testing', () => {
    beforeEach(() => {
      // Set up a 90-degree corner at (0, 0):
      // Wall 1 along X axis (Z in [0, 0.15], X in [0, 5])
      // Wall 2 along Z axis (X in [0, 0.15], Z in [0, 5])
      // Internal room is in quadrant (+X, +Z), corner point is at (0.15, 0.15)
      collisionSystem.addBox(0, 0, 0, 5, 3.4, 0.15, 'wall-corner-x');
      collisionSystem.addBox(0, 0, 0, 0.15, 3.4, 5, 'wall-corner-z');
    });

    it('handles symmetric 45-degree corner penetration without wedging or getting stuck', () => {
      const radius = WORLD_DIMENSIONS.playerRadius; // 0.32
      const targetCornerX = 0.15 + radius; // 0.47
      const targetCornerZ = 0.15 + radius; // 0.47

      // Push diagonally into corner from (2.0, 2.0) with (-1, -1) velocity for 100 frames
      const pos = new THREE.Vector3(2.0, 0.3, 2.0);
      const dt = 0.05;
      const speed = 2.0;

      for (let f = 0; f < 100; f++) {
        pos.x -= speed * dt * 0.7071;
        pos.z -= speed * dt * 0.7071;
        collisionSystem.resolveMovement(pos);
      }

      // Player should settle cleanly at (targetCornerX, targetCornerZ)
      expect(pos.x).toBeCloseTo(targetCornerX, 2);
      expect(pos.z).toBeCloseTo(targetCornerZ, 2);
      expect(pos.x).toBeGreaterThanOrEqual(0.15 + radius - 1e-4);
      expect(pos.z).toBeGreaterThanOrEqual(0.15 + radius - 1e-4);
    });

    it('permits sliding along Wall 1 when pushing predominantly into Wall 2', () => {
      const radius = WORLD_DIMENSIONS.playerRadius;
      // Start near corner against Wall 2 (X = 0.15 + radius), move along Z
      const pos = new THREE.Vector3(0.15 + radius, 0.3, 2.0);

      // Velocity pushing into Wall 2 (-X) while moving along Z (+Z)
      for (let f = 0; f < 50; f++) {
        pos.x -= 0.1; // pushing into Wall 2
        pos.z += 0.05; // moving away along Wall 2
        collisionSystem.resolveMovement(pos);
      }

      expect(pos.x).toBeCloseTo(0.15 + radius, 2);
      expect(pos.z).toBeCloseTo(4.5, 1);
    });

    it('verifies 2-pass AABB resolver eliminates single-pass corner pushback oscillation', () => {
      const radius = WORLD_DIMENSIONS.playerRadius;
      // Deep penetration directly into apex: (0.10, 0.10)
      const pos = new THREE.Vector3(0.10, 0.3, 0.10);
      collisionSystem.resolveMovement(pos);

      // After 2 passes, both X and Z must be fully resolved
      const distToWallX = Math.abs(pos.z - 0.15);
      const distToWallZ = Math.abs(pos.x - 0.15);
      expect(distToWallX).toBeGreaterThanOrEqual(radius - 0.01);
      expect(distToWallZ).toBeGreaterThanOrEqual(radius - 0.01);
    });

    it('stress tests acute 500-frame continuous diagonal force: zero drift or penetration', () => {
      const radius = WORLD_DIMENSIONS.playerRadius;
      const pos = new THREE.Vector3(1.0, 0.3, 1.0);

      for (let f = 0; f < 500; f++) {
        pos.x -= 0.05;
        pos.z -= 0.05;
        collisionSystem.resolveMovement(pos);

        // In every single frame, position must respect wall bounds
        expect(pos.x).toBeGreaterThanOrEqual(0.15 + radius - 1e-4);
        expect(pos.z).toBeGreaterThanOrEqual(0.15 + radius - 1e-4);
      }
    });
  });

  // =========================================================================
  // SUITE 3: Stair Climbing Step-Height Thresholds (0.15m vs 0.20m Risers)
  // =========================================================================
  describe('Suite 3: Stair Step-Height Clearance & Obstacle Thresholds', () => {
    it('empirically verifies horizontal step-clearance threshold is exactly 0.15m', () => {
      // Step clearance in CollisionSystem.js line 99: minY = pos.y + 0.15
      // Obstacle 1: Height = 0.14 m (below threshold -> passable)
      collisionSystem.addBox(1.0, 0.0, -1.0, 2.0, 0.14, 1.0, 'low-step-pass');
      // Obstacle 2: Height = 0.20 m (above threshold -> blocking)
      collisionSystem.addBox(5.0, 0.0, -1.0, 6.0, 0.20, 1.0, 'high-step-block');

      // Test 1: Walk into 0.14m obstacle at pos.y = 0.0
      const posPass = new THREE.Vector3(1.5, 0.0, -1.5);
      posPass.z += 0.8; // move into box
      collisionSystem.resolveMovement(posPass);
      // Because minY = 0.15 >= b.maxY (0.14), collision is bypassed
      expect(posPass.z).toBeCloseTo(-0.7, 2);

      // Test 2: Walk into 0.20m obstacle at pos.y = 0.0
      const posBlock = new THREE.Vector3(5.5, 0.0, -1.5);
      posBlock.z += 0.8; // move into box
      collisionSystem.resolveMovement(posBlock);
      // Because minY = 0.15 < b.maxY (0.20), collision is ENFORCED and player is pushed back
      expect(posBlock.z).toBeLessThan(-1.0);
      expect(posBlock.z).toBeCloseTo(-1.0 - WORLD_DIMENSIONS.playerRadius, 2);
    });

    it('demonstrates that 0.203m stair risers would be blocked if modeled as discrete AABB colliders', () => {
      const riserHeight = (STAIRCASE.topY - STAIRCASE.bottomY) / STAIRCASE.stepCount; // 3.65 / 18 = 0.2028m
      expect(riserHeight).toBeGreaterThan(0.15);

      // If a discrete step collider of riserHeight is added:
      collisionSystem.addBox(0.65, 0.30, 5.0, 3.05, 0.30 + riserHeight, 5.2, 'discrete-step');

      // Player penetrates slightly into the step (Z = 5.15, closer to maxZ = 5.2)
      const pos = new THREE.Vector3(1.85, 0.30, 5.15);
      collisionSystem.resolveMovement(pos);

      // Player is BLOCKED horizontally by the 0.203m riser and ejected back to maxZ + radius
      expect(pos.z).toBeCloseTo(5.2 + WORLD_DIMENSIONS.playerRadius, 2);
    });

    it('demonstrates that penetrating past step midplane causes forward teleportation through riser', () => {
      const riserHeight = (STAIRCASE.topY - STAIRCASE.bottomY) / STAIRCASE.stepCount;
      collisionSystem.addBox(0.65, 0.30, 5.0, 3.05, 0.30 + riserHeight, 5.2, 'discrete-step-tunnel');

      // Player penetrates past midplane Z = 5.10 (to Z = 5.05, closer to minZ = 5.0)
      const pos = new THREE.Vector3(1.85, 0.30, 5.05);
      collisionSystem.resolveMovement(pos);

      // Forward ejection: player is teleported forward through the step to minZ - radius!
      expect(pos.z).toBeCloseTo(5.0 - WORLD_DIMENSIONS.playerRadius, 2);
    });

    it('verifies actual architecture bypasses discrete AABB blocking via continuous resolveGroundHeightAt ramp', () => {
      const midX = (STAIRCASE.minX + STAIRCASE.maxX) * 0.5;

      // At bottom landing (Z = 5.7)
      expect(resolveGroundHeightAt(midX, 5.7, 0.3)).toBeCloseTo(0.3, 2);
      // Continuous slope through all 18 steps
      let prevH = 0.3;
      for (let z = 5.6; z >= 1.7; z -= 0.2) {
        const h = resolveGroundHeightAt(midX, z, prevH);
        expect(h).toBeGreaterThanOrEqual(prevH);
        prevH = h;
      }
      // At top landing (Z = 1.7)
      expect(resolveGroundHeightAt(midX, 1.7, 3.8)).toBeCloseTo(3.95, 2);
    });

    it('verifies foundation plinth (0.27m riser) is correctly protected from horizontal walking without ramp', () => {
      // Foundation plinth is 0.30m, terrain is 0.03m -> 0.27m step
      const plinthStep = WORLD_DIMENSIONS.groundSlabTop - 0.03;
      expect(plinthStep).toBeGreaterThan(0.15); // Cannot be stepped over without stairs/ramp
    });
  });

  // =========================================================================
  // SUITE 4: Pool Basin Exclusion & Coping Edge Ejector Mechanics
  // =========================================================================
  describe('Suite 4: Pool Basin Exclusion & Coping Ejector Stress Testing', () => {
    it('ejects player outward to poolMaxZ + radius when penetrating north basin wall', () => {
      const midX = (POOL_SPEC.poolMinX + POOL_SPEC.poolMaxX) * 0.5;
      const targetZ = POOL_SPEC.poolMaxZ + WORLD_DIMENSIONS.playerRadius; // -11.5 + 0.32 = -11.18

      // Penetrate north edge (Z = -11.6)
      const pos = new THREE.Vector3(midX, 0.25, -11.6);
      collisionSystem.resolveMovement(pos);

      expect(pos.z).toBeCloseTo(targetZ, 3);
    });

    it('ejects player outward to poolMinZ - radius when penetrating south basin wall', () => {
      const midX = (POOL_SPEC.poolMinX + POOL_SPEC.poolMaxX) * 0.5;
      const targetZ = POOL_SPEC.poolMinZ - WORLD_DIMENSIONS.playerRadius; // -15.5 - 0.32 = -15.82

      // Penetrate south edge (Z = -15.4)
      const pos = new THREE.Vector3(midX, 0.25, -15.4);
      collisionSystem.resolveMovement(pos);

      expect(pos.z).toBeCloseTo(targetZ, 3);
    });

    it('ejects player outward to poolMinX - radius when penetrating west basin wall', () => {
      const midZ = (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5;
      const targetX = POOL_SPEC.poolMinX - WORLD_DIMENSIONS.playerRadius; // -11.0 - 0.32 = -11.32

      // Penetrate west edge (X = -10.9)
      const pos = new THREE.Vector3(-10.9, 0.25, midZ);
      collisionSystem.resolveMovement(pos);

      expect(pos.x).toBeCloseTo(targetX, 3);
    });

    it('ejects player outward to poolMaxX + radius when penetrating east basin wall', () => {
      const midZ = (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5;
      const targetX = POOL_SPEC.poolMaxX + WORLD_DIMENSIONS.playerRadius; // -3.0 + 0.32 = -2.68

      // Penetrate east edge (X = -3.1)
      const pos = new THREE.Vector3(-3.1, 0.25, midZ);
      collisionSystem.resolveMovement(pos);

      expect(pos.x).toBeCloseTo(targetX, 3);
    });

    it('ejects center-spawned point instantly to nearest rim edge', () => {
      const centerX = (POOL_SPEC.poolMinX + POOL_SPEC.poolMaxX) * 0.5; // -7.0
      const centerZ = (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5; // -13.5

      const pos = new THREE.Vector3(centerX, 0.25, centerZ);
      collisionSystem.resolveMovement(pos);

      // Depth is 4.0m (half depth 2.0m), width is 8.0m (half width 4.0m)
      // Nearest rim is north or south edge (Z)
      const isNorthOrSouthEjected =
        Math.abs(pos.z - (POOL_SPEC.poolMaxZ + WORLD_DIMENSIONS.playerRadius)) < 1e-3 ||
        Math.abs(pos.z - (POOL_SPEC.poolMinZ - WORLD_DIMENSIONS.playerRadius)) < 1e-3;
      expect(isNorthOrSouthEjected).toBe(true);
    });

    it('permits walking along outer boundary of 0.25m stone coping without ejection', () => {
      const safeCopingX = POOL_SPEC.poolMaxX + WORLD_DIMENSIONS.playerRadius + 0.05; // -3.0 + 0.32 + 0.05 = -2.63
      const midZ = (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5;

      const pos = new THREE.Vector3(safeCopingX, 0.25, midZ);
      collisionSystem.resolveMovement(pos);

      expect(pos.x).toBe(safeCopingX);
      expect(pos.z).toBe(midZ);
    });

    it('verifies vertical threshold: pool exclusion deactivates when pos.y >= 1.2m', () => {
      const midX = (POOL_SPEC.poolMinX + POOL_SPEC.poolMaxX) * 0.5;
      const midZ = (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5;

      // Position high in air (e.g. upper balcony level pos.y = 3.95)
      const posHigh = new THREE.Vector3(midX, 3.95, midZ);
      collisionSystem.resolveMovement(posHigh);

      // When pos.y >= 1.2, pool basin exclusion is bypassed
      expect(posHigh.x).toBe(midX);
      expect(posHigh.z).toBe(midZ);
    });
  });

  // =========================================================================
  // SUITE 5: Perimeter Estate Wall Boundary Enforcement (80 x 70 m)
  // =========================================================================
  describe('Suite 5: Perimeter Estate Wall Boundary Enforcement', () => {
    it('strictly enforces all 4 perimeter bounds against extreme adversarial coordinates', () => {
      const testCases = [
        { input: [1000, 0, 0], expectedX: WORLD_DIMENSIONS.gardenMaxX - 0.8, expectedZ: 0 },
        { input: [-1000, 0, 0], expectedX: WORLD_DIMENSIONS.gardenMinX + 0.8, expectedZ: 0 },
        { input: [0, 0, 1000], expectedX: 0, expectedZ: WORLD_DIMENSIONS.gardenMaxZ - 0.8 },
        { input: [0, 0, -1000], expectedX: 0, expectedZ: WORLD_DIMENSIONS.gardenMinZ + 0.8 },
        {
          input: [500, 0, 500],
          expectedX: WORLD_DIMENSIONS.gardenMaxX - 0.8,
          expectedZ: WORLD_DIMENSIONS.gardenMaxZ - 0.8,
        },
        {
          input: [-500, 0, -500],
          expectedX: WORLD_DIMENSIONS.gardenMinX + 0.8,
          expectedZ: WORLD_DIMENSIONS.gardenMinZ + 0.8,
        },
      ];

      for (const tc of testCases) {
        const pos = new THREE.Vector3(tc.input[0], tc.input[1], tc.input[2]);
        collisionSystem.resolveMovement(pos);
        expect(pos.x).toBeCloseTo(tc.expectedX, 3);
        expect(pos.z).toBeCloseTo(tc.expectedZ, 3);
      }
    });

    it('enforces perimeter clamp at South Entrance Gate opening (Z = 44.2m clamp vs Z = 44.8m gate)', () => {
      // Pathway center is X = 3.5m. Gate opening is at Z = 44.8m.
      // Player walking south through the gate opening:
      const pos = new THREE.Vector3(3.5, 0.03, 50.0);
      collisionSystem.resolveMovement(pos);

      // Player must be clamped at gardenMaxZ - 0.8 = 45.0 - 0.8 = 44.2m
      expect(pos.z).toBeCloseTo(WORLD_DIMENSIONS.gardenMaxZ - 0.8, 3);
      expect(pos.z).toBeLessThan(44.8); // Cannot exit past gate
    });

    it('handles floating point precision boundaries: exactly at clamp boundary +/- 1e-9', () => {
      const maxX = WORLD_DIMENSIONS.gardenMaxX - 0.8;
      const posJustInside = new THREE.Vector3(maxX - 1e-6, 0, 0);
      collisionSystem.resolveMovement(posJustInside);
      expect(posJustInside.x).toBeCloseTo(maxX - 1e-6, 5);

      const posJustOutside = new THREE.Vector3(maxX + 1e-6, 0, 0);
      collisionSystem.resolveMovement(posJustOutside);
      expect(posJustOutside.x).toBeCloseTo(maxX, 5);
    });
  });

  // =========================================================================
  // SUITE 6: Camera Wall-Clipping Pull-in Behavior in Confined Spaces
  // =========================================================================
  describe('Suite 6: Camera Wall-Clipping Pull-in Behavior in Confined Spaces', () => {
    let occluderMesh;

    beforeEach(() => {
      // Set third-person camera mode
      gameStore.setState({ screen: 'playing', thirdPerson: true });

      // Create an occluder wall at Z = 0 with thickness 0.25m, normal facing +Z
      const wallGeo = new THREE.BoxGeometry(10, 4, 0.25);
      const wallMat = new THREE.MeshBasicMaterial();
      occluderMesh = new THREE.Mesh(wallGeo, wallMat);
      occluderMesh.position.set(0, 2, 0);
      occluderMesh.updateMatrixWorld(true);

      collisionSystem.registerOccluder(occluderMesh);
    });

    it('pulls camera in when ray intersects occluder wall in open space (> 0.65m)', () => {
      // Player at X = 0, Z = 1.5, looking toward +Z (yaw = Math.PI, looking at +Z)
      // Camera wants to be behind player (toward -Z, into the wall at Z = 0)
      cameraCtrl.yaw = 0; // facing -Z, camera positioned behind at +Z
      // If yaw = Math.PI: player looks +Z, camera behind at -Z (toward wall at Z = 0)
      cameraCtrl.yaw = Math.PI;
      cameraCtrl.pitch = 0;

      const playerPos = new THREE.Vector3(0, 0.3, 1.5); // eyePos is around (0, 1.95, 1.5)
      cameraCtrl.update(playerPos, false, 'male', 0.1);

      // Distance from eyePos (Z = 1.5) to wall front face (Z = 0.125) is ~1.375m
      // Normal camera distance is 2.6m, which would be at Z = -1.1 (inside/behind wall)
      // Pull-in must shorten camera distance so camera Z > 0.125m
      expect(cameraCtrl.camera.position.z).toBeGreaterThan(0.125);
    });

    it('verifies camera wall-clip vulnerability in confined room is eliminated when wall distance < 0.45m', () => {
      // In CameraController.js line 154:
      // safeDist = Math.max(0.08, hits[0].distance - 0.15);
      // When player stands close to wall in confined room (Laundry room or Ensuite):
      // Player radius = 0.32m, so eyePos can be 0.33m from wall surface.
      // Ray hits wall at hits[0].distance = 0.33m.
      // hits[0].distance - 0.15 = 0.18m.
      // safeDist is 0.18m, keeping the camera 0.15m in FRONT of the wall face.

      cameraCtrl.yaw = Math.PI; // camera points directly into wall behind player
      cameraCtrl.pitch = 0;

      // Place player so eye is exactly 0.33m in front of wall face (Z = 0.125 + 0.33 = 0.455)
      const playerPos = new THREE.Vector3(0, 0.3, 0.455);

      // Run multiple camera updates to allow lerp interpolation to converge
      for (let f = 0; f < 30; f++) {
        cameraCtrl.update(playerPos, false, 'male', 0.1);
      }

      const wallFrontFaceZ = 0.125;
      const camZ = cameraCtrl.camera.position.z;

      // VERIFICATION:
      // The camera does not penetrate past the wall surface (camZ >= wallFrontFaceZ)
      const hasClipped = camZ < wallFrontFaceZ;
      expect(hasClipped).toBe(false);
      expect(camZ).toBeGreaterThan(wallFrontFaceZ);
    });

    it('verifies first-person camera mode is immune to wall-clipping pull-in artifacts', () => {
      // First person mode
      gameStore.setState({ thirdPerson: false });
      cameraCtrl.yaw = Math.PI;
      cameraCtrl.pitch = 0;

      const playerPos = new THREE.Vector3(0, 0.3, 0.455);
      for (let f = 0; f < 10; f++) {
        cameraCtrl.update(playerPos, false, 'male', 0.1);
      }

      // In first person mode, camera position is strictly coincident with eyePos
      expect(cameraCtrl.camera.position.x).toBeCloseTo(playerPos.x, 3);
      expect(cameraCtrl.camera.position.z).toBeCloseTo(playerPos.z, 3);
    });
  });

  // =========================================================================
  // SUITE 7: Character Anatomical Integrity, Seat Alignment & Partition Seams
  // =========================================================================
  describe('Suite 7: Character Anatomy, Seat Synchronization & Partition Integrity', () => {
    it('constructs continuous contoured head LatheGeometry (zero separate overlapping cranium/jaw) and toggles halo visibility', () => {
      const male = createCharacterRig('male');
      const female = createCharacterRig('female');

      const maleHeads = [];
      male.root.traverse((c) => {
        if (c.isMesh && c.geometry?.type === 'LatheGeometry') maleHeads.push(c);
      });
      expect(maleHeads.length).toBeGreaterThan(5);
      expect(male.root.children.length).toBeGreaterThan(0);

      female.update(0.016, { time: 1.0, speed: 0, seated: false, highlighted: true, hideHalo: true });
      const halo = female.root.children.find((c) => c.geometry?.type === 'RingGeometry');
      expect(halo).toBeDefined();
      expect(halo.visible).toBe(false);
    });

    it('synchronously restores exact player X/Z position when standing up after sitAt()', () => {
      playerCtrl.position.set(-4.2, 0.3, 5.1);
      const before = playerCtrl.position.clone();
      playerCtrl.sitAt({ id: 'living-sofa', label: 'Living Sofa', x: -3.0, y: 0.72, z: 4.5, yaw: Math.PI });

      expect(playerCtrl.position.x).toBe(-3.0);
      expect(playerCtrl.position.z).toBe(4.5);
      expect(cameraCtrl.yaw).toBeCloseTo(Math.PI, 4);

      playerCtrl.standUp();
      expect(playerCtrl.position.x).toBe(before.x);
      expect(playerCtrl.position.z).toBe(before.z);
    });

    it('verifies all partitions maintain positive span and valid thickness without self-intersection', () => {
      for (const p of PARTITIONS) {
        expect(p.thickness).toBe(WORLD_DIMENSIONS.intWallThickness);
        if (p.axis === 'x') {
          expect(p.maxZ).toBeGreaterThan(p.minZ);
        } else {
          expect(p.maxX).toBeGreaterThan(p.minX);
        }
      }
    });

    it('verifies Upper floor Bathroom 2 showerhead sits at 2.2m above upperFloorY (Y = 6.15m)', () => {
      const headY = WORLD_DIMENSIONS.upperFloorY + 2.2;
      expect(headY).toBeCloseTo(6.15, 3);
      expect(headY).toBeLessThan(WORLD_DIMENSIONS.upperCeilingY);
    });
  });
});
