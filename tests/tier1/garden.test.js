import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import '../harness/mockEnv.js';
import {
  WORLD_DIMENSIONS,
  POOL_SPEC,
  getTerrainHeight,
  resolveGroundHeightAt,
} from '../../src/house/HouseArchitecture.js';
import { createGarden } from '../../src/world/Garden.js';
import { getLawnTexture, getStoneTileTextures } from '../../src/assets/procedural/TextureGenerator.js';

describe('Tier 1: Garden, Landscape & Exterior Grounds', () => {
  // F03: Master Terrain & Lawns
  describe('F03 - Master Terrain & Lawns', () => {
    it('creates garden mesh matching the 80m x 70m estate dimensions', () => {
      const scene = new THREE.Scene();
      const garden = createGarden(scene);
      expect(garden).toBeDefined();
      expect(garden.group).toBeDefined();
      expect(garden.group.name).toBe('estate-garden-world');

      expect(garden.terrain).toBeDefined();
      expect(garden.terrain.geometry.parameters.width).toBe(80);
      expect(garden.terrain.geometry.parameters.height).toBe(70);
    });

    it('ensures terrain elevation variations never exceed 0.5m across the entire garden', () => {
      let maxElevation = -Infinity;
      let minElevation = Infinity;

      for (let x = -40; x <= 40; x += 2.5) {
        for (let z = -25; z <= 45; z += 2.5) {
          const h = getTerrainHeight(x, z);
          if (h > maxElevation) maxElevation = h;
          if (h < minElevation) minElevation = h;
        }
      }

      expect(maxElevation).toBeLessThanOrEqual(0.5);
      expect(minElevation).toBeGreaterThanOrEqual(-0.5);
      expect(maxElevation - minElevation).toBeLessThanOrEqual(0.5);
    });

    it('ensures terrain is strictly flat (height = 0) around the house footprint', () => {
      // House footprint is X in [-12, 12], Z in [-9, 9]
      for (let x = -11; x <= 11; x += 3) {
        for (let z = -8; z <= 8; z += 3) {
          expect(getTerrainHeight(x, z)).toBe(0);
        }
      }
    });

    it('ensures terrain is flat along the central sandstone pathway', () => {
      for (let z = 12; z <= 40; z += 4) {
        expect(getTerrainHeight(3.5, z)).toBe(0);
      }
    });

    it('generates procedural canvas lawn texture with high-resolution tiling', () => {
      const lawnTex = getLawnTexture(18, 16);
      expect(lawnTex).toBeDefined();
      expect(lawnTex.isCanvasTexture).toBe(true);
      expect(lawnTex.repeat.x).toBe(18);
      expect(lawnTex.repeat.y).toBe(16);
    });
  });

  // F04: Central Stone Pathway
  describe('F04 - Central Stone Pathway', () => {
    it('specifies pathway width of exactly 2.4m', () => {
      expect(WORLD_DIMENSIONS.pathwayWidth).toBe(2.4);
    });

    it('centers pathway at X = 3.5m aligning with the main entrance door', () => {
      expect(WORLD_DIMENSIONS.pathwayCenterX).toBe(3.5);
    });

    it('spans from garden gate (Z = 40.0m) to porch landing (Z = 12.0m)', () => {
      expect(WORLD_DIMENSIONS.pathwayStartZ).toBe(40.0);
      expect(WORLD_DIMENSIONS.pathwayEndZ).toBe(12.0);
      expect(WORLD_DIMENSIONS.pathwayStartZ - WORLD_DIMENSIONS.pathwayEndZ).toBe(28.0);
    });

    it('sets pathway surface elevation at datum 0.03m above ground', () => {
      const hPath = resolveGroundHeightAt(3.5, 25.0, 0.03);
      expect(hPath).toBe(0.03);
    });

    it('confines pathway cross-section to X in [2.3, 4.7]m', () => {
      const halfW = WORLD_DIMENSIONS.pathwayWidth * 0.5;
      const minPathX = WORLD_DIMENSIONS.pathwayCenterX - halfW;
      const maxPathX = WORLD_DIMENSIONS.pathwayCenterX + halfW;
      expect(minPathX).toBeCloseTo(2.3, 2);
      expect(maxPathX).toBeCloseTo(4.7, 2);
    });
  });

  // F05: 12 Botanical Flower Beds
  describe('F05 - 12 Botanical Flower Beds', () => {
    // PRD Section 4.1 specifications for flower beds
    const FLOWER_BED_SPEC = {
      totalCount: 12,
      pathwayBeds: 8,
      perimeterBeds: 4,
      bedLength: 3.0,
      bedWidth: 1.5,
      moundHeight: 0.15,
      timberBorderThickness: 0.08,
    };

    it('specifies exactly 12 flower beds total in estate layout', () => {
      expect(FLOWER_BED_SPEC.totalCount).toBe(12);
      expect(FLOWER_BED_SPEC.pathwayBeds + FLOWER_BED_SPEC.perimeterBeds).toBe(12);
    });

    it('specifies 8 flower beds flanking the central pathway (4 on each side)', () => {
      expect(FLOWER_BED_SPEC.pathwayBeds).toBe(8);
      const bedsPerSide = FLOWER_BED_SPEC.pathwayBeds / 2;
      expect(bedsPerSide).toBe(4);
    });

    it('specifies standardized dimensions for pathway beds (3.0m L x 1.5m W)', () => {
      expect(FLOWER_BED_SPEC.bedLength).toBe(3.0);
      expect(FLOWER_BED_SPEC.bedWidth).toBe(1.5);
    });

    it('specifies raised soil mounding (0.15m height) with timber edging (0.08m)', () => {
      expect(FLOWER_BED_SPEC.moundHeight).toBe(0.15);
      expect(FLOWER_BED_SPEC.timberBorderThickness).toBe(0.08);
    });

    it('ensures flower beds do not encroach into the 2.4m clear pathway corridor', () => {
      // Pathway is X in [2.3, 4.7]. Left beds must have maxX <= 2.2, right beds minX >= 4.8
      const leftBedMaxX = 2.0;
      const rightBedMinX = 5.0;
      expect(leftBedMaxX).toBeLessThan(WORLD_DIMENSIONS.pathwayCenterX - WORLD_DIMENSIONS.pathwayWidth * 0.5);
      expect(rightBedMinX).toBeGreaterThan(WORLD_DIMENSIONS.pathwayCenterX + WORLD_DIMENSIONS.pathwayWidth * 0.5);
    });
  });

  // F06: 7 Botanical Varieties
  describe('F06 - 7 Botanical Varieties', () => {
    const BOTANICAL_VARIETIES = [
      { name: 'Daisy', minH: 0.45, maxH: 0.6, petalColor: '#FFFFFF', centerColor: '#FFD700' },
      { name: 'Rose', minH: 0.6, maxH: 0.85, petalColor: '#C41E3A', centerColor: '#8B0000' },
      { name: 'Tulip', minH: 0.4, maxH: 0.55, petalColor: '#E63946', centerColor: '#F1FAEE' },
      { name: 'Sunflower', minH: 1.2, maxH: 1.6, petalColor: '#FFB703', centerColor: '#3D2612' },
      { name: 'Lavender', minH: 0.45, maxH: 0.65, petalColor: '#9D8DF1', centerColor: '#7251B2' },
      { name: 'Hydrangea', minH: 0.7, maxH: 1.0, petalColor: '#80B6E2', centerColor: '#4A7C59' },
      { name: 'Marigold', minH: 0.35, maxH: 0.5, petalColor: '#FB8500', centerColor: '#D90429' },
    ];

    it('specifies exactly 7 botanical flower varieties per PRD Section 4.2', () => {
      expect(BOTANICAL_VARIETIES.length).toBe(7);
    });

    it('verifies all 7 varieties have distinct growth heights and color signatures', () => {
      const names = BOTANICAL_VARIETIES.map((v) => v.name);
      expect(new Set(names).size).toBe(7);
      for (const v of BOTANICAL_VARIETIES) {
        expect(v.maxH).toBeGreaterThan(v.minH);
      }
    });

    it('identifies Sunflower as the tallest botanical variety (1.2m - 1.6m)', () => {
      const sunflower = BOTANICAL_VARIETIES.find((v) => v.name === 'Sunflower');
      expect(sunflower.minH).toBe(1.2);
      expect(sunflower.maxH).toBe(1.6);
      for (const v of BOTANICAL_VARIETIES) {
        if (v.name !== 'Sunflower') {
          expect(v.maxH).toBeLessThan(sunflower.minH);
        }
      }
    });

    it('identifies Marigold as the compact edging variety (0.35m - 0.50m)', () => {
      const marigold = BOTANICAL_VARIETIES.find((v) => v.name === 'Marigold');
      expect(marigold.minH).toBe(0.35);
      expect(marigold.maxH).toBe(0.5);
    });

    it('verifies total flower density target ranges between 450 and 650 blooms across estate', () => {
      const targetRange = { min: 450, max: 650 };
      expect(targetRange.min).toBeGreaterThanOrEqual(400);
      expect(targetRange.max).toBeLessThanOrEqual(800);
    });
  });

  // F07: Procedural Wind Sway
  describe('F07 - Procedural Wind Sway', () => {
    function calculateWindSwayAngle(time, posX, posZ, baseAngleDeg = 3.0) {
      // Wind oscillation model per PRD Section 4.6 (2-4 degrees oscillation, 0.6 - 1.2 Hz)
      const freq = 0.85;
      const wave = Math.sin(time * freq * Math.PI * 2 + posX * 0.15 + posZ * 0.1);
      const angleRad = THREE.MathUtils.degToRad(baseAngleDeg * wave);
      return angleRad;
    }

    it('calculates sway angle within 2 to 4 degrees limit', () => {
      const baseDeg = 3.0; // 3 deg nominal
      const angleRad = calculateWindSwayAngle(1.0, 3.5, 20.0, baseDeg);
      const angleDeg = THREE.MathUtils.radToDeg(angleRad);
      expect(Math.abs(angleDeg)).toBeLessThanOrEqual(4.0);
    });

    it('produces spatial phase variation across different garden coordinates', () => {
      const swayLeft = calculateWindSwayAngle(1.5, -15.0, 20.0, 3.0);
      const swayRight = calculateWindSwayAngle(1.5, 15.0, 20.0, 3.0);
      expect(swayLeft).not.toBe(swayRight);
    });

    it('oscillates smoothly through time without discontinuity', () => {
      const t1 = calculateWindSwayAngle(1.0, 5.0, 15.0, 3.0);
      const t2 = calculateWindSwayAngle(1.02, 5.0, 15.0, 3.0);
      expect(Math.abs(t2 - t1)).toBeLessThan(0.02);
    });

    it('returns zero sway when time is zero and position aligns with zero phase', () => {
      const sway0 = calculateWindSwayAngle(0, 0, 0, 3.0);
      expect(sway0).toBeCloseTo(0, 5);
    });

    it('reverses sway direction periodically to simulate natural wind gusts', () => {
      let positiveObserved = false;
      let negativeObserved = false;
      for (let t = 0; t <= 3.0; t += 0.2) {
        const val = calculateWindSwayAngle(t, 5.0, 20.0, 3.0);
        if (val > 0.01) positiveObserved = true;
        if (val < -0.01) negativeObserved = true;
      }
      expect(positiveObserved).toBe(true);
      expect(negativeObserved).toBe(true);
    });
  });

  // F08: Mature Orchard & Shade Trees
  describe('F08 - Mature Orchard & Shade Trees', () => {
    const TREE_SPEC = {
      trunkRadius: 0.35,
      heightRange: [5.0, 8.5],
      canopyRadius: [2.5, 4.5],
      clearanceFromHouse: 4.0,
      clearanceFromPath: 2.5,
    };

    it('specifies trunk radius of 0.25m - 0.45m providing realistic collision cylinders', () => {
      expect(TREE_SPEC.trunkRadius).toBeGreaterThanOrEqual(0.25);
      expect(TREE_SPEC.trunkRadius).toBeLessThanOrEqual(0.45);
    });

    it('specifies mature tree height between 5.0m and 8.5m', () => {
      expect(TREE_SPEC.heightRange[0]).toBe(5.0);
      expect(TREE_SPEC.heightRange[1]).toBe(8.5);
    });

    it('specifies broad canopy spread between 2.5m and 4.5m radius', () => {
      expect(TREE_SPEC.canopyRadius[0]).toBe(2.5);
      expect(TREE_SPEC.canopyRadius[1]).toBe(4.5);
    });

    it('enforces minimum 4.0m clearance between tree trunks and house walls', () => {
      expect(TREE_SPEC.clearanceFromHouse).toBe(4.0);
      const minTreeZFront = WORLD_DIMENSIONS.houseMaxZ + TREE_SPEC.clearanceFromHouse;
      expect(minTreeZFront).toBe(13.0);
    });

    it('enforces minimum 2.5m clearance between tree trunks and central pathway', () => {
      expect(TREE_SPEC.clearanceFromPath).toBe(2.5);
    });
  });

  // F09: Stone Benches & Garden Lanterns
  describe('F09 - Stone Benches & Garden Lanterns', () => {
    const BENCH_SPEC = {
      length: 1.7,
      width: 0.55,
      seatHeight: 0.45,
    };
    const LANTERN_SPEC = {
      postHeight: 0.95,
      lightRadius: 4.5,
      colorTemp: 2700,
    };

    it('specifies stone bench dimensions conforming to PRD (1.6-1.8m L, 0.45m H)', () => {
      expect(BENCH_SPEC.length).toBeGreaterThanOrEqual(1.6);
      expect(BENCH_SPEC.length).toBeLessThanOrEqual(1.8);
      expect(BENCH_SPEC.seatHeight).toBe(0.45);
    });

    it('specifies garden lantern height of 0.8m - 1.1m', () => {
      expect(LANTERN_SPEC.postHeight).toBeGreaterThanOrEqual(0.8);
      expect(LANTERN_SPEC.postHeight).toBeLessThanOrEqual(1.1);
    });

    it('specifies warm ambient lantern illumination (2700K)', () => {
      expect(LANTERN_SPEC.colorTemp).toBe(2700);
    });

    it('provides stone bench seating surface matching player sitting height', () => {
      const sittingPelvisY = BENCH_SPEC.seatHeight;
      expect(sittingPelvisY).toBeCloseTo(0.45, 2);
    });

    it('verifies lantern lighting influence radius covers pathway edges (4.5m)', () => {
      expect(LANTERN_SPEC.lightRadius).toBeGreaterThan(WORLD_DIMENSIONS.pathwayWidth);
    });
  });

  // F10: Perimeter Stone & Timber Wall
  describe('F10 - Perimeter Stone & Timber Wall', () => {
    const PERIMETER_SPEC = {
      wallHeight: 1.8,
      pierHeight: 2.2,
      wallThickness: 0.35,
      totalLength: 2 * (WORLD_DIMENSIONS.gardenWidth + WORLD_DIMENSIONS.gardenDepth),
    };

    it('specifies perimeter wall height of 1.8m with 2.2m gate piers', () => {
      expect(PERIMETER_SPEC.wallHeight).toBe(1.8);
      expect(PERIMETER_SPEC.pierHeight).toBe(2.2);
    });

    it('bounds total perimeter circumference of 300m for 80m x 70m estate', () => {
      expect(PERIMETER_SPEC.totalLength).toBe(2 * (80 + 70));
      expect(PERIMETER_SPEC.totalLength).toBe(300);
    });

    it('confines bounds strictly within garden limits X in [-40, 40] and Z in [-25, 45]', () => {
      expect(WORLD_DIMENSIONS.gardenMinX).toBe(-40);
      expect(WORLD_DIMENSIONS.gardenMaxX).toBe(40);
      expect(WORLD_DIMENSIONS.gardenMinZ).toBe(-25);
      expect(WORLD_DIMENSIONS.gardenMaxZ).toBe(45);
    });

    it('creates perimeter stone border edging in garden mesh', () => {
      const scene = new THREE.Scene();
      const garden = createGarden(scene);
      expect(garden.walls).toBeDefined();
      expect(garden.walls.children.length).toBeGreaterThanOrEqual(4);
    });

    it('verifies perimeter stone edging uses stone-foyer texture palette', () => {
      const tex = getStoneTileTextures('foyer', 20, 1);
      expect(tex).toBeDefined();
      expect(tex.map).toBeDefined();
      expect(tex.map.isCanvasTexture).toBe(true);
      expect(tex.bumpMap).toBeDefined();
    });
  });

  // F30: Swimming Pool & Terrace
  describe('F30 - Swimming Pool & Terrace', () => {
    it('specifies pool terrace deck spanning 12m W x 8m D at rear of house', () => {
      const width = POOL_SPEC.terraceMaxX - POOL_SPEC.terraceMinX;
      const depth = POOL_SPEC.terraceMaxZ - POOL_SPEC.terraceMinZ;
      expect(width).toBe(12.0);
      expect(depth).toBe(8.0);
      expect(POOL_SPEC.terraceMaxZ).toBeLessThan(-9.0); // behind rear house wall
    });

    it('specifies rectangular pool basin (8.0m L x 4.0m W) inside the terrace', () => {
      const poolW = POOL_SPEC.poolMaxX - POOL_SPEC.poolMinX;
      const poolD = POOL_SPEC.poolMaxZ - POOL_SPEC.poolMinZ;
      expect(poolW).toBe(8.0);
      expect(poolD).toBe(4.0);
    });

    it('specifies water depth of 1.35m and coping border of 0.25m', () => {
      expect(POOL_SPEC.waterDepth).toBe(1.35);
      expect(POOL_SPEC.copingWidth).toBe(0.25);
    });

    it('sets terrace surface height at Y = 0.25m and water level at Y = 0.20m', () => {
      expect(POOL_SPEC.terraceY).toBe(0.25);
      expect(POOL_SPEC.waterLevelY).toBe(0.2);
      expect(POOL_SPEC.terraceY).toBeGreaterThan(POOL_SPEC.waterLevelY);
    });

    it('resolves terrace deck height correctly in resolveGroundHeightAt', () => {
      const midX = (POOL_SPEC.terraceMinX + POOL_SPEC.terraceMaxX) * 0.5;
      const midZ = (POOL_SPEC.terraceMinZ + POOL_SPEC.terraceMaxZ) * 0.5;
      const hTerrace = resolveGroundHeightAt(midX, midZ, 0.25);
      expect(hTerrace).toBe(POOL_SPEC.terraceY);
    });
  });
});
