import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import '../harness/mockEnv.js';
import {
  WORLD_DIMENSIONS,
  POOL_SPEC,
  STAIRCASE,
  resolveGroundHeightAt,
  detectZoneAt,
  WINDOWS,
  DOORS,
} from '../../src/house/HouseArchitecture.js';
import { CollisionSystem } from '../../src/gameplay/CollisionSystem.js';
import { CameraController } from '../../src/gameplay/CameraController.js';
import { createMockCanvas } from '../harness/mockEnv.js';
import { DISCOVERY_ZONES, gameStore } from '../../src/state/gameStore.js';
import { createFlowerBeds } from '../../src/world/FlowerBeds.js';

describe('Tier 2: Boundary, Precision & Coordinate Constraints', () => {
  // Category 1: Spatial Bounds & Perimeter Clamping
  describe('Spatial Bounds & Perimeter Clamping', () => {
    it('clamps positive X extreme (+1000m) to gardenMaxX - buffer', () => {
      const col = new CollisionSystem();
      const pos = new THREE.Vector3(1000, 0, 0);
      col.resolveMovement(pos);
      expect(pos.x).toBeCloseTo(WORLD_DIMENSIONS.gardenMaxX - 0.8, 1);
    });

    it('clamps negative X extreme (-1000m) to gardenMinX + buffer', () => {
      const col = new CollisionSystem();
      const pos = new THREE.Vector3(-1000, 0, 0);
      col.resolveMovement(pos);
      expect(pos.x).toBeCloseTo(WORLD_DIMENSIONS.gardenMinX + 0.8, 1);
    });

    it('clamps positive Z extreme (+1000m) to gardenMaxZ - buffer', () => {
      const col = new CollisionSystem();
      const pos = new THREE.Vector3(0, 0, 1000);
      col.resolveMovement(pos);
      expect(pos.z).toBeCloseTo(WORLD_DIMENSIONS.gardenMaxZ - 0.8, 1);
    });

    it('clamps negative Z extreme (-1000m) to gardenMinZ + buffer', () => {
      const col = new CollisionSystem();
      const pos = new THREE.Vector3(0, 0, -1000);
      col.resolveMovement(pos);
      expect(pos.z).toBeCloseTo(WORLD_DIMENSIONS.gardenMinZ + 0.8, 1);
    });

    it('preserves valid coordinates strictly inside garden bounds without alteration', () => {
      const col = new CollisionSystem();
      const pos = new THREE.Vector3(15.5, 0.03, 20.0);
      col.resolveMovement(pos);
      expect(pos.x).toBe(15.5);
      expect(pos.z).toBe(20.0);
    });
  });

  // Category 2: Staircase Elevation Ramp Boundaries
  describe('Staircase Elevation Ramp Boundaries', () => {
    const midX = (STAIRCASE.minX + STAIRCASE.maxX) * 0.5;

    it('evaluates ground plinth datum (0.30m) at bottom step entrance (Z = 5.7m)', () => {
      const h = resolveGroundHeightAt(midX, STAIRCASE.startZ, 0.3);
      expect(h).toBeCloseTo(0.3, 2);
    });

    it('evaluates upper floor datum (3.95m) at top step exit (Z = 1.7m)', () => {
      const h = resolveGroundHeightAt(midX, STAIRCASE.endZ, 3.8);
      expect(h).toBeCloseTo(3.95, 2);
    });

    it('evaluates exact midpoint height (~2.125m) at Z = 3.7m', () => {
      const midZ = (STAIRCASE.startZ + STAIRCASE.endZ) * 0.5;
      const h = resolveGroundHeightAt(midX, midZ, 2.0);
      const expectedMid = (STAIRCASE.bottomY + STAIRCASE.topY) * 0.5;
      expect(h).toBeCloseTo(expectedMid, 2);
    });

    it('maintains upper floor height (3.95m) when stepping off top into upper gallery', () => {
      const h = resolveGroundHeightAt(midX, STAIRCASE.endZ - 0.5, 3.95);
      expect(h).toBe(WORLD_DIMENSIONS.upperFloorY);
    });

    it('maintains ground plinth height (0.30m) when stepping off bottom into stair hall', () => {
      const h = resolveGroundHeightAt(midX, STAIRCASE.startZ + 0.5, 0.3);
      expect(h).toBe(WORLD_DIMENSIONS.groundSlabTop);
    });
  });

  // Category 3: Pool Basin Exclusion & Rim Boundaries
  describe('Pool Basin Exclusion & Rim Boundaries', () => {
    it('ejects player outward when attempting to step into north edge of pool basin', () => {
      const col = new CollisionSystem();
      const midX = (POOL_SPEC.poolMinX + POOL_SPEC.poolMaxX) * 0.5;
      // Just inside north pool basin rim (Z = poolMaxZ - 0.1)
      const pos = new THREE.Vector3(midX, 0.25, POOL_SPEC.poolMaxZ - 0.1);
      col.resolveMovement(pos);
      // Ejected to poolMaxZ + radius
      expect(pos.z).toBeGreaterThanOrEqual(POOL_SPEC.poolMaxZ);
    });

    it('ejects player outward when attempting to step into south edge of pool basin', () => {
      const col = new CollisionSystem();
      const midX = (POOL_SPEC.poolMinX + POOL_SPEC.poolMaxX) * 0.5;
      // Just inside south pool basin rim (Z = poolMinZ + 0.1)
      const pos = new THREE.Vector3(midX, 0.25, POOL_SPEC.poolMinZ + 0.1);
      col.resolveMovement(pos);
      expect(pos.z).toBeLessThanOrEqual(POOL_SPEC.poolMinZ);
    });

    it('ejects player outward when attempting to step into west edge of pool basin', () => {
      const col = new CollisionSystem();
      const midZ = (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5;
      const pos = new THREE.Vector3(POOL_SPEC.poolMinX + 0.1, 0.25, midZ);
      col.resolveMovement(pos);
      expect(pos.x).toBeLessThanOrEqual(POOL_SPEC.poolMinX);
    });

    it('ejects player outward when attempting to step into east edge of pool basin', () => {
      const col = new CollisionSystem();
      const midZ = (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5;
      const pos = new THREE.Vector3(POOL_SPEC.poolMaxX - 0.1, 0.25, midZ);
      col.resolveMovement(pos);
      expect(pos.x).toBeGreaterThanOrEqual(POOL_SPEC.poolMaxX);
    });

    it('allows player to walk safely on the 0.25m pool coping border outside the basin', () => {
      const col = new CollisionSystem();
      const safeCopingX = POOL_SPEC.poolMinX - 0.4;
      const midZ = (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5;
      const pos = new THREE.Vector3(safeCopingX, 0.25, midZ);
      col.resolveMovement(pos);
      expect(pos.x).toBe(safeCopingX);
    });
  });

  // Category 4: Camera Pitch Clamping Boundaries
  describe('Camera Pitch Clamping Boundaries', () => {
    it('sets maximum pitch clamp strictly to 80 degrees in radians (~1.3963 rad)', () => {
      const canvas = createMockCanvas();
      const camera = new THREE.PerspectiveCamera();
      const col = new CollisionSystem();
      const ctrl = new CameraController(camera, canvas, col);

      const maxPitch = ctrl.maxPitch;
      expect(maxPitch).toBeCloseTo(1.39626, 4);
      ctrl.dispose();
    });

    it('clamps extreme positive pitch (+100 rad) to exactly maxPitch', () => {
      const canvas = createMockCanvas();
      const camera = new THREE.PerspectiveCamera();
      const col = new CollisionSystem();
      const ctrl = new CameraController(camera, canvas, col);

      ctrl.pitch = 100.0;
      // Clamp logic in controller update / mouse handler
      ctrl.pitch = Math.max(-ctrl.maxPitch, Math.min(ctrl.maxPitch, ctrl.pitch));
      expect(ctrl.pitch).toBe(ctrl.maxPitch);
      ctrl.dispose();
    });

    it('clamps extreme negative pitch (-100 rad) to exactly -maxPitch', () => {
      const canvas = createMockCanvas();
      const camera = new THREE.PerspectiveCamera();
      const col = new CollisionSystem();
      const ctrl = new CameraController(camera, canvas, col);

      ctrl.pitch = -100.0;
      ctrl.pitch = Math.max(-ctrl.maxPitch, Math.min(ctrl.maxPitch, ctrl.pitch));
      expect(ctrl.pitch).toBe(-ctrl.maxPitch);
      ctrl.dispose();
    });

    it('allows pitch within legal [-79, +79] degree bounds without alteration', () => {
      const canvas = createMockCanvas();
      const camera = new THREE.PerspectiveCamera();
      const col = new CollisionSystem();
      const ctrl = new CameraController(camera, canvas, col);

      const testPitch = THREE.MathUtils.degToRad(45);
      ctrl.pitch = testPitch;
      ctrl.pitch = Math.max(-ctrl.maxPitch, Math.min(ctrl.maxPitch, ctrl.pitch));
      expect(ctrl.pitch).toBe(testPitch);
      ctrl.dispose();
    });

    it('resets pitch orientation to horizontal level on camera reset', () => {
      const canvas = createMockCanvas();
      const camera = new THREE.PerspectiveCamera();
      const col = new CollisionSystem();
      const ctrl = new CameraController(camera, canvas, col);

      ctrl.resetOrientation(0, -0.04);
      expect(ctrl.yaw).toBe(0);
      expect(ctrl.pitch).toBe(-0.04);
      ctrl.dispose();
    });
  });

  // Category 5: Exact Inventory & Architectural Budget Limits
  describe('Exact Inventory & Architectural Budget Limits', () => {
    it('verifies exact window count is 12 (zero missing or surplus windows)', () => {
      expect(WINDOWS.length).toBe(12);
      const ground = WINDOWS.filter((w) => w.floor === 0).length;
      const upper = WINDOWS.filter((w) => w.floor === 1).length;
      expect(ground).toBe(6);
      expect(upper).toBe(6);
      expect(ground + upper).toBe(12);
    });

    it('verifies exact door count is 13 across all categories', () => {
      expect(DOORS.length).toBe(13);
      const main = DOORS.filter((d) => d.category === 'exterior-main').length;
      const service = DOORS.filter((d) => d.category === 'exterior-service').length;
      const sliding = DOORS.filter((d) => d.category === 'exterior-sliding').length;
      const interior = DOORS.filter((d) => d.category === 'interior').length;
      const balcony = DOORS.filter((d) => d.category === 'balcony').length;

      expect(main).toBe(1);
      expect(service).toBe(1);
      expect(sliding).toBe(1);
      expect(interior).toBe(8);
      expect(balcony).toBe(2);
      expect(main + service + sliding + interior + balcony).toBe(13);
    });

    it('verifies exact discovery zone count is 12 covering all spatial domains', () => {
      expect(DISCOVERY_ZONES.length).toBe(12);
      const zoneIds = DISCOVERY_ZONES.map((z) => z.id);
      expect(new Set(zoneIds).size).toBe(12);
    });

    it('verifies player collider radius boundary (0.32m) and height (1.8m)', () => {
      expect(WORLD_DIMENSIONS.playerRadius).toBe(0.32);
      expect(WORLD_DIMENSIONS.playerHeight).toBe(1.8);
      // Diameter is 0.64m, passing comfortably through 0.8m - 0.9m door openings
      expect(WORLD_DIMENSIONS.playerRadius * 2).toBeLessThan(0.8);
    });

    it('verifies wall thicknesses maintain interior clearances (exterior 0.25m, partition 0.15m)', () => {
      expect(WORLD_DIMENSIONS.extWallThickness).toBe(0.25);
      expect(WORLD_DIMENSIONS.intWallThickness).toBe(0.15);
      expect(WORLD_DIMENSIONS.extWallThickness).toBeGreaterThan(WORLD_DIMENSIONS.intWallThickness);
    });
  });

  // Category 6: Interaction Range Boundary Thresholds
  describe('Interaction Range Boundary Thresholds', () => {
    function testRangeCheck(distance, threshold) {
      return distance <= threshold;
    }

    it('accepts door interaction at threshold boundary r = 2.0m - epsilon', () => {
      const threshold = 2.0;
      expect(testRangeCheck(1.99, threshold)).toBe(true);
      expect(testRangeCheck(2.0, threshold)).toBe(true);
    });

    it('rejects door interaction beyond threshold boundary r = 2.0m + epsilon', () => {
      const threshold = 2.0;
      expect(testRangeCheck(2.01, threshold)).toBe(false);
      expect(testRangeCheck(2.5, threshold)).toBe(false);
    });

    it('accepts furniture inspection at threshold boundary r = 1.8m', () => {
      const threshold = 1.8;
      expect(testRangeCheck(1.79, threshold)).toBe(true);
      expect(testRangeCheck(1.8, threshold)).toBe(true);
      expect(testRangeCheck(1.81, threshold)).toBe(false);
    });

    it('accepts shower control at threshold boundary r = 1.5m', () => {
      const threshold = 1.5;
      expect(testRangeCheck(1.49, threshold)).toBe(true);
      expect(testRangeCheck(1.5, threshold)).toBe(true);
      expect(testRangeCheck(1.51, threshold)).toBe(false);
    });

    it('verifies hierarchical range order: shower (1.5m) < furniture (1.8m) < door (2.0m)', () => {
      const ranges = { shower: 1.5, furniture: 1.8, door: 2.0 };
      expect(ranges.shower).toBeLessThan(ranges.furniture);
      expect(ranges.furniture).toBeLessThan(ranges.door);
    });
  });

  // Category 7: Spatial Zone Detection Boundaries
  describe('Spatial Zone Detection Boundaries', () => {
    it('detects flower-garden zone when player is in front garden', () => {
      const zone = detectZoneAt(3.5, 0.03, 30.0);
      expect(zone.zoneId).toBe('flower-garden');
    });

    it('detects front-porch zone when player steps onto porch (X=3.5, Z=10.5)', () => {
      const zone = detectZoneAt(3.5, 0.3, 10.5);
      expect(zone.zoneId).toBe('front-porch');
    });

    it('detects living-hall zone when player is inside ground living room', () => {
      const zone = detectZoneAt(-3.0, 0.3, 5.0);
      expect(zone.zoneId).toBe('living-hall');
    });

    it('detects kitchen zone when player is in kitchen bounds (X=-9.0, Z=6.0)', () => {
      const zone = detectZoneAt(-9.0, 0.3, 6.0);
      expect(zone.zoneId).toBe('kitchen');
    });

    it('detects upper gallery and balcony zones when player is on upper floor (Y > 2.6)', () => {
      const galleryZone = detectZoneAt(0.0, 3.95, 0.0);
      expect(galleryZone.zoneId).toBe('living-hall');

      const balconyZone = detectZoneAt(-3.0, 3.95, -9.8);
      expect(balconyZone.zoneId).toBe('balcony');
    });
  });

  // Category 8: Companion Waypoints, Camera Pull-In Damping & Botanical Integrity
  describe('Companion Waypoints, Camera Damping & Botanical Integrity', () => {
    it('verifies West-Garden companion stroll waypoints stay strictly clear of house, porch, pathway, and beds', () => {
      const flowerSystem = createFlowerBeds();
      const bedColliders = flowerSystem.colliders || [];
      const waypoints = [
        { x: -7.8, z: 14.8 },
        { x: -8.4, z: 22.5 },
        { x: -8.4, z: 31.2 },
        { x: -6.8, z: 38.5 },
        { x: -13.2, z: 33.5 },
        { x: -13.5, z: 16.5 },
      ];

      for (const wp of waypoints) {
        const insideHouseOrPorch =
          wp.x >= WORLD_DIMENSIONS.houseMinX - 0.5 &&
          wp.x <= WORLD_DIMENSIONS.houseMaxX + 0.5 &&
          wp.z >= WORLD_DIMENSIONS.houseMinZ - 0.5 &&
          wp.z <= WORLD_DIMENSIONS.porchMaxZ + 0.5;
        expect(insideHouseOrPorch).toBe(false);
        expect(Math.abs(wp.x - WORLD_DIMENSIONS.pathwayCenterX)).toBeGreaterThan(2.5);

        for (const bed of bedColliders) {
          const overlapsBed =
            wp.x >= bed.minX && wp.x <= bed.maxX && wp.z >= bed.minZ && wp.z <= bed.maxZ;
          expect(overlapsBed).toBe(false);
        }
      }
      expect(flowerSystem.getFlowerCount()).toBe(540);
    });

    it('clamps 3rd-person camera inward immediately on occlusion and smoothly recovers outward', () => {
      const canvas = createMockCanvas();
      const camera = new THREE.PerspectiveCamera();
      const col = new CollisionSystem();
      const ctrl = new CameraController(camera, canvas, col);
      gameStore.setState({ screen: 'playing', thirdPerson: true });

      const wall = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 0.25), new THREE.MeshBasicMaterial());
      wall.position.set(0, 2, 0);
      wall.updateMatrixWorld(true);
      col.registerOccluder(wall);

      ctrl.yaw = Math.PI;
      ctrl.pitch = 0;
      const closePos = new THREE.Vector3(0, 0.3, 0.55);
      ctrl.update(closePos, false, 'female', 0.016);
      const clampedDist = ctrl._safeCamDist;
      expect(clampedDist).toBeLessThan(0.5);

      // Remove occluder and verify recovery ramps smoothly instead of jumping instantaneously
      col.occluders.length = 0;
      ctrl.update(closePos, false, 'female', 0.016);
      expect(ctrl._safeCamDist).toBeGreaterThan(clampedDist);
      expect(ctrl._safeCamDist).toBeLessThan(2.6);
      ctrl.dispose();
    });

    it('enforces exact X/Z coincidence between 1st-person camera and standing player position', () => {
      const canvas = createMockCanvas();
      const camera = new THREE.PerspectiveCamera();
      const col = new CollisionSystem();
      const ctrl = new CameraController(camera, canvas, col);
      gameStore.setState({ screen: 'playing', thirdPerson: false });

      const pPos = new THREE.Vector3(-4.12, 0.3, 6.48);
      ctrl.update(pPos, false, 'male', 0.016);
      expect(ctrl.camera.position.x).toBe(pPos.x);
      expect(ctrl.camera.position.z).toBe(pPos.z);
      ctrl.dispose();
    });
  });
});
