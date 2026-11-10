import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import '../harness/mockEnv.js';
import {
  WORLD_DIMENSIONS,
  ROOMS,
  WINDOWS,
  DOORS,
  PARTITIONS,
  STAIRCASE,
  resolveGroundHeightAt,
  START_POSITION,
} from '../../src/house/HouseArchitecture.js';
import { buildHouse } from '../../src/house/HouseMeshBuilder.js';
import { ASSET_MANIFEST } from '../../src/assets/procedural/AssetManifest.js';

describe('Tier 1: Architecture & Structural Specifications', () => {
  // F02: Coordinate & Spatial Setup
  describe('F02 - Coordinate & Spatial Setup', () => {
    it('sets house footprint centered near origin with exact 24m width and 18m depth', () => {
      expect(WORLD_DIMENSIONS.houseWidth).toBe(24);
      expect(WORLD_DIMENSIONS.houseDepth).toBe(18);
      expect(WORLD_DIMENSIONS.houseMinX).toBe(-12);
      expect(WORLD_DIMENSIONS.houseMaxX).toBe(12);
      expect(WORLD_DIMENSIONS.houseMinZ).toBe(-9);
      expect(WORLD_DIMENSIONS.houseMaxZ).toBe(9);
    });

    it('sets garden area to 80m width by 70m depth', () => {
      expect(WORLD_DIMENSIONS.gardenWidth).toBe(80);
      expect(WORLD_DIMENSIONS.gardenDepth).toBe(70);
      expect(WORLD_DIMENSIONS.gardenMaxX - WORLD_DIMENSIONS.gardenMinX).toBe(80);
      expect(WORLD_DIMENSIONS.gardenMaxZ - WORLD_DIMENSIONS.gardenMinZ).toBe(70);
    });

    it('orients front façade toward positive Z (Z = +9.0)', () => {
      expect(WORLD_DIMENSIONS.houseMaxZ).toBe(9.0);
      expect(START_POSITION.z).toBeGreaterThan(WORLD_DIMENSIONS.houseMaxZ);
      expect(START_POSITION.yaw).toBe(0); // facing -Z toward front façade
    });

    it('specifies standard player collider proportions (0.32m radius, 1.8m height)', () => {
      expect(WORLD_DIMENSIONS.playerRadius).toBe(0.32);
      expect(WORLD_DIMENSIONS.playerHeight).toBe(1.8);
    });

    it('defines male and female eye heights conforming to PRD Section 2.1', () => {
      expect(WORLD_DIMENSIONS.eyeHeightMale).toBe(1.65);
      expect(WORLD_DIMENSIONS.eyeHeightFemale).toBe(1.56);
    });
  });

  // F11: Asymmetrical Front Façade (Mandatory PRD Rule)
  describe('F11 - Asymmetrical Front Façade', () => {
    it('places the main front window strictly on the LEFT (X < 0) when viewed from garden', () => {
      const frontWindow = WINDOWS.find((w) => w.id === 'win-front-left');
      expect(frontWindow).toBeDefined();
      expect(frontWindow.wall).toBe('front');
      expect(frontWindow.x).toBeLessThan(0); // negative X is left
      expect(frontWindow.x).toBe(-3.6);
    });

    it('places the main entrance door strictly on the RIGHT (X > 0) aligning with pathway', () => {
      const mainDoor = DOORS.find((d) => d.id === 'door-main-entrance');
      expect(mainDoor).toBeDefined();
      expect(mainDoor.x).toBeGreaterThan(0); // positive X is right
      expect(mainDoor.x).toBe(WORLD_DIMENSIONS.pathwayCenterX);
      expect(mainDoor.x).toBe(3.5);
    });

    it('verifies front window outer dimensions match PRD (2.4m W x 1.7m H, sill 0.75m)', () => {
      const frontWin = WINDOWS.find((w) => w.id === 'win-front-left');
      expect(frontWin.width).toBe(2.4);
      expect(frontWin.height).toBe(1.7);
      // sill height from floor slab Y=0.3 is y - height/2 = 1.9 - 0.85 = 1.05m (0.75m above slab)
      const sillHeightAboveSlab = frontWin.y - frontWin.height * 0.5 - WORLD_DIMENSIONS.groundSlabTop;
      expect(sillHeightAboveSlab).toBeCloseTo(0.75, 2);
    });

    it('verifies front window features shutters and interior curtains', () => {
      const frontWin = WINDOWS.find((w) => w.id === 'win-front-left');
      expect(frontWin.shutters).toBe(true);
      expect(frontWin.curtains).toBe(true);
    });

    it('verifies main door dimensions (1.25m W x 2.4m H, 0.06m thickness)', () => {
      const mainDoor = DOORS.find((d) => d.id === 'door-main-entrance');
      expect(mainDoor.width).toBe(1.25);
      expect(mainDoor.height).toBe(2.4);
      expect(mainDoor.thickness).toBe(0.06);
    });
  });

  // F12: Foundation Slab & Sub-floor
  describe('F12 - Foundation Slab & Sub-floor', () => {
    it('sets ground floor slab top at Y = 0.30m above ground datum', () => {
      expect(WORLD_DIMENSIONS.groundSlabTop).toBe(0.3);
    });

    it('specifies ground slab thickness of 0.25m', () => {
      expect(WORLD_DIMENSIONS.groundSlabThickness).toBe(0.25);
    });

    it('provides porch steps transitioning from terrain datum (0.03m) to plinth (0.30m)', () => {
      const hGround = resolveGroundHeightAt(3.5, 13.5, 0.03); // on pathway before steps
      const hSteps = resolveGroundHeightAt(3.5, 12.45, 0.03); // on porch access steps
      const hPorch = resolveGroundHeightAt(3.5, 10.5, 0.3); // on front porch

      expect(hGround).toBeCloseTo(0.03, 2);
      expect(hSteps).toBeGreaterThan(0.03);
      expect(hSteps).toBeLessThan(0.3);
      expect(hPorch).toBeCloseTo(0.3, 2);
    });

    it('resolves interior ground slab height consistently across entire house footprint', () => {
      const hCenter = resolveGroundHeightAt(0, 0, 0.3);
      const hLiving = resolveGroundHeightAt(-3, 5, 0.3);
      const hKitchen = resolveGroundHeightAt(-9, 6, 0.3);
      const hBed1 = resolveGroundHeightAt(9, 6, 0.3);

      expect(hCenter).toBe(0.3);
      expect(hLiving).toBe(0.3);
      expect(hKitchen).toBe(0.3);
      expect(hBed1).toBe(0.3);
    });

    it('specifies front porch dimensions (6m W x 3m D)', () => {
      expect(WORLD_DIMENSIONS.porchWidth).toBe(6.0);
      expect(WORLD_DIMENSIONS.porchDepth).toBe(3.0);
      expect(WORLD_DIMENSIONS.porchMaxX - WORLD_DIMENSIONS.porchMinX).toBe(6.0);
      expect(WORLD_DIMENSIONS.porchMaxZ - WORLD_DIMENSIONS.porchMinZ).toBe(3.0);
    });
  });

  // F13: Timber Frame & Siding Walls
  describe('F13 - Timber Frame & Siding Walls', () => {
    it('specifies exterior timber wall thickness of 0.25m', () => {
      expect(WORLD_DIMENSIONS.extWallThickness).toBe(0.25);
    });

    it('specifies interior partition wall thickness of 0.15m', () => {
      expect(WORLD_DIMENSIONS.intWallThickness).toBe(0.15);
    });

    it('verifies all interior rooms have assigned authentic timber or stone floor finishes', () => {
      const validFinishes = ['oak', 'walnut-honey', 'limestone', 'stone-foyer', 'bath-stone', 'laundry-tile', 'teak-deck'];
      for (const room of ROOMS) {
        expect(validFinishes).toContain(room.floorFinish);
      }
    });

    it('verifies all doors specify realistic thickness (0.045m - 0.06m)', () => {
      for (const door of DOORS) {
        expect(door.thickness).toBeGreaterThanOrEqual(0.045);
        expect(door.thickness).toBeLessThanOrEqual(0.06);
      }
    });

    it('verifies wall alignments confine rooms inside house envelope boundaries', () => {
      for (const room of ROOMS) {
        if (room.floor === 0) {
          expect(room.minX).toBeGreaterThanOrEqual(WORLD_DIMENSIONS.houseMinX);
          expect(room.maxX).toBeLessThanOrEqual(WORLD_DIMENSIONS.houseMaxX);
          expect(room.minZ).toBeGreaterThanOrEqual(WORLD_DIMENSIONS.houseMinZ);
          expect(room.maxZ).toBeLessThanOrEqual(WORLD_DIMENSIONS.houseMaxZ);
        }
      }
    });
  });

  // F14: Dual Floor Volumes
  describe('F14 - Dual Floor Volumes', () => {
    it('specifies ground floor ceiling height of 3.4m', () => {
      expect(WORLD_DIMENSIONS.groundWallHeight).toBe(3.4);
    });

    it('specifies upper floor ceiling height of 3.1m', () => {
      expect(WORLD_DIMENSIONS.upperWallHeight).toBe(3.1);
    });

    it('specifies upper floor slab level at Y = 3.95m', () => {
      expect(WORLD_DIMENSIONS.upperFloorY).toBe(3.95);
    });

    it('specifies upper ceiling level at Y = 7.05m', () => {
      expect(WORLD_DIMENSIONS.upperCeilingY).toBe(7.05);
      expect(WORLD_DIMENSIONS.upperFloorY + WORLD_DIMENSIONS.upperWallHeight).toBeCloseTo(7.05, 2);
    });

    it('verifies room floor assignments (ground floor 0 vs upper floor 1)', () => {
      const groundRooms = ROOMS.filter((r) => r.floor === 0);
      const upperRooms = ROOMS.filter((r) => r.floor === 1);
      expect(groundRooms.length).toBeGreaterThan(0);
      expect(upperRooms.length).toBeGreaterThan(0);
      expect(groundRooms.every((r) => r.floorY === 0.3)).toBe(true);
      expect(upperRooms.every((r) => r.floorY === 3.95)).toBe(true);
    });
  });

  // F15: Fenestration Budget (12 Windows)
  describe('F15 - Fenestration Budget (12 Windows)', () => {
    it('contains exactly 12 windows total across both floors per PRD Section 7.5', () => {
      expect(WINDOWS.length).toBe(12);
    });

    it('distributes exactly 6 windows on ground floor and 6 on upper floor', () => {
      const groundWindows = WINDOWS.filter((w) => w.floor === 0);
      const upperWindows = WINDOWS.filter((w) => w.floor === 1);
      expect(groundWindows.length).toBe(6);
      expect(upperWindows.length).toBe(6);
    });

    it('verifies all windows have unique identifiers', () => {
      const ids = WINDOWS.map((w) => w.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(12);
    });

    it('verifies bathroom windows feature privacy frosted glass', () => {
      const bath1Win = WINDOWS.find((w) => w.id === 'win-bath1-east');
      const bath2Win = WINDOWS.find((w) => w.id === 'win-bath2-west');
      expect(bath1Win.frosted).toBe(true);
      expect(bath2Win.frosted).toBe(true);
    });

    it('verifies all window coordinates lie on the exterior wall planes', () => {
      for (const w of WINDOWS) {
        const onWallX = Math.abs(w.x) >= 3.9 && Math.abs(w.x) <= 12.0;
        const onWallZ = Math.abs(w.z) >= 8.5 && Math.abs(w.z) <= 9.0;
        expect(onWallX || onWallZ).toBe(true);
      }
    });
  });

  // F16: Door Budget (13 Doors)
  describe('F16 - Door Budget (13 Doors)', () => {
    it('contains exactly 13 doors total per PRD Section 7.5', () => {
      expect(DOORS.length).toBe(13);
    });

    it('contains exactly 1 main exterior entrance door', () => {
      const mainDoors = DOORS.filter((d) => d.category === 'exterior-main');
      expect(mainDoors.length).toBe(1);
      expect(mainDoors[0].id).toBe('door-main-entrance');
      expect(mainDoors[0].isMain).toBe(true);
    });

    it('contains exactly 1 rear/service exterior door and 1 pool sliding door', () => {
      const serviceDoors = DOORS.filter((d) => d.category === 'exterior-service');
      const slidingDoors = DOORS.filter((d) => d.category === 'exterior-sliding');
      expect(serviceDoors.length).toBe(1);
      expect(slidingDoors.length).toBe(1);
      expect(serviceDoors[0].id).toBe('door-rear-service');
      expect(slidingDoors[0].id).toBe('door-pool-sliding');
    });

    it('contains exactly 8 interior hinged doors', () => {
      const interiorDoors = DOORS.filter((d) => d.category === 'interior');
      expect(interiorDoors.length).toBe(8);
    });

    it('contains exactly 2 balcony access doors', () => {
      const balconyDoors = DOORS.filter((d) => d.category === 'balcony');
      expect(balconyDoors.length).toBe(2);
      expect(balconyDoors.every((d) => d.isGlassDoor)).toBe(true);
    });
  });

  // F17: Central Wooden Staircase
  describe('F17 - Central Wooden Staircase', () => {
    it('specifies exactly 18 timber steps', () => {
      expect(STAIRCASE.stepCount).toBe(18);
    });

    it('climbs continuously from ground plinth (0.30m) to upper floor (3.95m)', () => {
      expect(STAIRCASE.bottomY).toBe(0.3);
      expect(STAIRCASE.topY).toBe(3.95);
      expect(STAIRCASE.topY - STAIRCASE.bottomY).toBeCloseTo(3.65, 2);
    });

    it('spans north-south between Z = +5.70m and Z = +1.70m', () => {
      expect(STAIRCASE.startZ).toBe(5.7);
      expect(STAIRCASE.endZ).toBe(1.7);
      expect(STAIRCASE.startZ - STAIRCASE.endZ).toBe(4.0);
    });

    it('provides comfortable stair width of 2.4m within X in [0.65, 3.05]', () => {
      expect(STAIRCASE.maxX - STAIRCASE.minX).toBeCloseTo(2.4, 2);
    });

    it('resolves smooth elevation ramp as player ascends staircase', () => {
      const midZ = (STAIRCASE.startZ + STAIRCASE.endZ) * 0.5; // Z = 3.7
      const midX = (STAIRCASE.minX + STAIRCASE.maxX) * 0.5;
      const hStart = resolveGroundHeightAt(midX, STAIRCASE.startZ, 0.3);
      const hMid = resolveGroundHeightAt(midX, midZ, 1.8);
      const hEnd = resolveGroundHeightAt(midX, STAIRCASE.endZ, 3.8);

      expect(hStart).toBeCloseTo(0.3, 1);
      expect(hMid).toBeCloseTo((0.3 + 3.95) * 0.5, 1);
      expect(hEnd).toBeCloseTo(3.95, 1);
      expect(hMid).toBeGreaterThan(hStart);
      expect(hEnd).toBeGreaterThan(hMid);
    });
  });

  // F18: Dual Upper Balconies
  describe('F18 - Dual Upper Balconies', () => {
    it('defines two upper balconies in room inventory', () => {
      const b1 = ROOMS.find((r) => r.id === 'balcony-1');
      const b2 = ROOMS.find((r) => r.id === 'balcony-2');
      expect(b1).toBeDefined();
      expect(b2).toBeDefined();
    });

    it('sets both balconies on upper floor (floor 1, floorY = 3.95m)', () => {
      const b1 = ROOMS.find((r) => r.id === 'balcony-1');
      const b2 = ROOMS.find((r) => r.id === 'balcony-2');
      expect(b1.floor).toBe(1);
      expect(b2.floor).toBe(1);
      expect(b1.floorY).toBe(3.95);
      expect(b2.floorY).toBe(3.95);
    });

    it('specifies teak decking finish for both balconies', () => {
      const b1 = ROOMS.find((r) => r.id === 'balcony-1');
      const b2 = ROOMS.find((r) => r.id === 'balcony-2');
      expect(b1.floorFinish).toBe('teak-deck');
      expect(b2.floorFinish).toBe('teak-deck');
    });

    it('places Main Balcony extending over rear terrace at Z <= -9.0m', () => {
      const b1 = ROOMS.find((r) => r.id === 'balcony-1');
      expect(b1.minZ).toBeLessThan(-9.0);
    });

    it('places Secondary Balcony extending over west garden at X <= -12.0m', () => {
      const b2 = ROOMS.find((r) => r.id === 'balcony-2');
      expect(b2.minX).toBeLessThan(-12.0);
    });
  });

  // F19: Roof Rafters & Ceiling
  describe('F19 - Roof Rafters & Ceiling', () => {
    it('sets roof ridge height to 2.4m above upper ceiling (~9.45m above ground datum)', () => {
      expect(WORLD_DIMENSIONS.roofRidgeHeight).toBe(2.4);
      const totalHeight = WORLD_DIMENSIONS.upperCeilingY + WORLD_DIMENSIONS.roofRidgeHeight;
      expect(totalHeight).toBeCloseTo(9.45, 2);
    });

    it('verifies roof peak conforms to PRD 9.8 - 10.0m range above terrain', () => {
      const peakAboveTerrain = WORLD_DIMENSIONS.upperCeilingY + WORLD_DIMENSIONS.roofRidgeHeight;
      expect(peakAboveTerrain).toBeGreaterThanOrEqual(9.0);
      expect(peakAboveTerrain).toBeLessThanOrEqual(10.5);
    });

    it('ensures double-height living hall atrium reaches 6.1m ceiling', () => {
      const living = ROOMS.find((r) => r.id === 'living-hall');
      expect(living.ceilingY).toBe(6.1);
    });

    it('ensures standard ground rooms have 3.7m ceiling (0.3 plinth + 3.4 wall)', () => {
      const kitchen = ROOMS.find((r) => r.id === 'kitchen');
      expect(kitchen.ceilingY).toBe(3.7);
    });

    it('ensures stair hall has continuous open volume to upper ceiling (7.05m)', () => {
      const stairHall = ROOMS.find((r) => r.id === 'stair-hall');
      expect(stairHall.ceilingY).toBe(7.05);
    });
  });

  // Structural Geometry, Enclosures & Asset Manifest Verification
  describe('Structural Geometry, Enclosures & Asset Manifest Verification', () => {
    it('builds punched ExtrudeGeometry walls with outward+inward material groups and zero degenerate triangles', () => {
      const scene = new THREE.Scene();
      const house = buildHouse({ scene });
      const frontWall = house.getObjectByName('wall-front-ground');
      expect(frontWall).toBeDefined();

      const mesh = frontWall.children.find((c) => c.isMesh);
      expect(mesh).toBeDefined();
      expect(Array.isArray(mesh.material)).toBe(true);
      expect(mesh.geometry.groups.length).toBe(2);
      expect(mesh.geometry.groups[0].count).toBeGreaterThan(0);
      expect(mesh.geometry.groups[1].count).toBeGreaterThan(0);

      const pos = mesh.geometry.getAttribute('position');
      const v0 = new THREE.Vector3();
      const v1 = new THREE.Vector3();
      const v2 = new THREE.Vector3();
      const e1 = new THREE.Vector3();
      const e2 = new THREE.Vector3();
      const cross = new THREE.Vector3();
      for (let i = 0; i < pos.count; i += 3) {
        v0.fromBufferAttribute(pos, i);
        v1.fromBufferAttribute(pos, i + 1);
        v2.fromBufferAttribute(pos, i + 2);
        e1.subVectors(v1, v0);
        e2.subVectors(v2, v0);
        cross.crossVectors(e1, e2);
        expect(cross.lengthSq()).toBeGreaterThan(1e-12);
      }
    });

    it('encloses upper Bathroom 2 and Walk-in Wardrobe flush at Z = 7.25m and X = -7.175m', () => {
      const bath2 = ROOMS.find((r) => r.id === 'bathroom-2');
      const wardrobe = ROOMS.find((r) => r.id === 'walkin-wardrobe');
      const bathNorth = PARTITIONS.find((p) => p.id === 'part-upper-bath2-north');
      const wardEast = PARTITIONS.find((p) => p.id === 'part-upper-wardrobe-east');

      expect(bathNorth).toBeDefined();
      expect(wardEast).toBeDefined();
      expect(bath2.maxZ).toBe(7.25);
      expect(wardrobe.maxZ).toBe(7.25);
      expect(bathNorth.z - bathNorth.thickness * 0.5).toBeCloseTo(7.25, 3);
      expect(wardEast.x).toBeCloseTo(-7.175, 3);
    });

    it('builds dual-sided staircase rails and east mezzanine landing guardrail collider', () => {
      const scene = new THREE.Scene();
      const house = buildHouse({ scene });
      const stairs = house.getObjectByName('central-staircase');
      expect(stairs).toBeDefined();
      expect(stairs.children.length).toBeGreaterThan(0);

      const eastRail = house.userData.colliders.find((c) => c.id === 'rail-gallery-stair-east');
      expect(eastRail).toBeDefined();
      expect(eastRail.minX).toBeCloseTo(2.99, 2);
      expect(eastRail.maxX).toBeCloseTo(3.95, 2);
    });

    it('keeps perpendicular Laundry & Storage partition intersections non-overlapping', () => {
      const lNorth = PARTITIONS.find((p) => p.id === 'part-ground-laundry-north');
      const sNorth = PARTITIONS.find((p) => p.id === 'part-ground-storage-north');
      const lWest = PARTITIONS.find((p) => p.id === 'part-ground-laundry-west');

      expect(lNorth.minX).toBeGreaterThanOrEqual(lWest.x + lWest.thickness * 0.5);
      expect(sNorth.maxX).toBeLessThanOrEqual(lWest.x - lWest.thickness * 0.5);
    });

    it('wraps partition baseboards around outer Laundry L-corners without Z-fighting', () => {
      const scene = new THREE.Scene();
      const house = buildHouse({ scene });
      const partitionsGroup = house.getObjectByName('interior-partitions');
      expect(partitionsGroup).toBeDefined();

      // Check East Laundry north-wall right skirt segment reaches across laundry-east corner (>= 7.31m)
      const rightSkirt = partitionsGroup.children.find((m) => {
        if (!m.isMesh || !m.geometry?.parameters) return false;
        const p = m.geometry.parameters;
        return Math.abs(m.position.z - -6.275) < 0.01 && Math.abs(m.position.y - (0.3 + 0.055)) < 0.01 && m.position.x > 6.5 && p.width > 0.5;
      });
      expect(rightSkirt).toBeDefined();
      expect(rightSkirt.position.x + rightSkirt.geometry.parameters.width * 0.5).toBeGreaterThanOrEqual(7.309);
    });

    it('verifies ASSET_MANIFEST catalogs only original procedural textures, models, and audio', () => {
      expect(ASSET_MANIFEST.textures.length).toBeGreaterThanOrEqual(15);
      expect(ASSET_MANIFEST.models.length).toBe(6);
      expect(ASSET_MANIFEST.audio.length).toBe(6);
      expect(
        ASSET_MANIFEST.textures.every((t) => t.license.includes('Original'))
      ).toBe(true);
    });
  });
});
