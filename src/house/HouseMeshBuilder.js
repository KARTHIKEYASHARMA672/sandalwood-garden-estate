import * as THREE from 'three';
import {
  WORLD_DIMENSIONS,
  ROOMS,
  WINDOWS,
  DOORS,
  STAIRCASE,
  BALCONIES,
  PARTITIONS,
} from './HouseArchitecture.js';
import {
  getTimberTextures,
  getStoneTileTextures,
  getFabricTextures,
} from '../assets/procedural/TextureGenerator.js';
import { gameStore } from '../state/gameStore.js';

/**
 * HouseMeshBuilder: Procedural 3D Architectural Shell and Fenestration Builder
 * for Sandalwood Garden Estate (Milestone 2).
 *
 * Implements:
 * - Foundation slab (24 x 18 m, 0.25 m thick, raised 0.3 m) with porch steps
 * - Exterior timber siding walls (0.25 m thick) with sandalwood clapboard textures
 * - Interior partition walls (0.15 m thick) defining all 12 zones across 2 floors
 * - Mandatory Asymmetric Front Façade: large window on LEFT (X < 0), main entrance on RIGHT (X = 3.5 m)
 * - Exact aperture budget: 12 windows (double-sided glass, frames, sills) + 13 interactive doors with pivot groups
 * - 18-step central wooden staircase (Y=0.30 to Y=3.95) with handrails, newels, and balusters
 * - Upper gallery mezzanine overlooking double-height foyer/living hall with wooden safety balustrades
 * - Dual cantilevered upper balconies (Main rear balcony and Secondary west balcony)
 * - Sloped timber roof structure with rafters, sandalwood ceiling panels, and fascia
 */
export class HouseMeshBuilder {
  constructor(options = {}) {
    this.options = options;
    this.materials = this.createMaterials();
    this.colliders = [];
    this.doorsMap = new Map();
    this.windowsMap = new Map();
    this.interactables = [];
    this.exteriorLights = [];
    this.interiorLights = [];
  }

  /**
   * Initializes procedural PBR materials using CanvasTextures from TextureGenerator.
   */
  createMaterials() {
    // 1. Exterior sandalwood timber siding
    const sidingTex = getTimberTextures('sandalwood', 8, 4);
    const sidingMaterial = new THREE.MeshStandardMaterial({
      map: sidingTex.map,
      bumpMap: sidingTex.bumpMap,
      bumpScale: 0.05,
      roughness: 0.65,
      metalness: 0.05,
    });

    // 2. Interior ivory plaster walls
    const interiorWallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1e8d8,
      roughness: 0.85,
      metalness: 0.0,
    });

    // 3. Vertical timber slats for accent/feature walls
    const slatsTex = getTimberTextures('slats', 4, 2);
    const slatsMaterial = new THREE.MeshStandardMaterial({
      map: slatsTex.map,
      bumpMap: slatsTex.bumpMap,
      bumpScale: 0.04,
      roughness: 0.6,
      metalness: 0.05,
    });

    // 4. Foundation plinth stone
    const plinthTex = getStoneTileTextures('foyer', 12, 1);
    const plinthMaterial = new THREE.MeshStandardMaterial({
      map: plinthTex.map,
      bumpMap: plinthTex.bumpMap,
      bumpScale: 0.06,
      roughness: 0.8,
      metalness: 0.0,
    });

    // 5. Room flooring materials
    const foyerTex = getStoneTileTextures('foyer', 3, 3);
    const foyerFloorMat = new THREE.MeshStandardMaterial({
      map: foyerTex.map,
      bumpMap: foyerTex.bumpMap,
      bumpScale: 0.04,
      roughness: 0.78,
    });

    const oakTex = getTimberTextures('oak', 6, 6);
    const oakFloorMat = new THREE.MeshStandardMaterial({
      map: oakTex.map,
      bumpMap: oakTex.bumpMap,
      bumpScale: 0.03,
      roughness: 0.55,
    });

    const limestoneTex = getStoneTileTextures('limestone', 4, 4);
    const kitchenFloorMat = new THREE.MeshStandardMaterial({
      map: limestoneTex.map,
      bumpMap: limestoneTex.bumpMap,
      bumpScale: 0.03,
      roughness: 0.75,
    });

    const walnutTex = getTimberTextures('walnut', 4, 4);
    const bedroomFloorMat = new THREE.MeshStandardMaterial({
      map: walnutTex.map,
      bumpMap: walnutTex.bumpMap,
      bumpScale: 0.03,
      roughness: 0.58,
    });

    const bathFloorTex = getStoneTileTextures('bathFloor', 2, 2);
    const bathFloorMat = new THREE.MeshStandardMaterial({
      map: bathFloorTex.map,
      bumpMap: bathFloorTex.bumpMap,
      bumpScale: 0.04,
      roughness: 0.7,
    });

    const laundryTex = getStoneTileTextures('laundry', 2, 2);
    const laundryFloorMat = new THREE.MeshStandardMaterial({
      map: laundryTex.map,
      bumpMap: laundryTex.bumpMap,
      bumpScale: 0.04,
      roughness: 0.75,
    });

    const teakTex = getTimberTextures('teak', 4, 4);
    const balconyDeckMat = new THREE.MeshStandardMaterial({
      map: teakTex.map,
      bumpMap: teakTex.bumpMap,
      bumpScale: 0.05,
      roughness: 0.65,
    });

    // 6. Architectural timber framing (posts, beams, frames, stairs, railings)
    const timberDarkMat = new THREE.MeshStandardMaterial({
      color: 0x553b2a,
      roughness: 0.6,
      metalness: 0.05,
    });

    const timberHoneyMat = new THREE.MeshStandardMaterial({
      color: 0xb88755,
      roughness: 0.55,
      metalness: 0.05,
    });

    // 7. Glass materials (clear and frosted)
    const clearGlassMat = new THREE.MeshStandardMaterial({
      color: 0xebf5f8,
      roughness: 0.06,
      metalness: 0.1,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const frostedGlassMat = new THREE.MeshStandardMaterial({
      color: 0xdfedea,
      roughness: 0.65,
      metalness: 0.05,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // 8. Brushed antique brass hardware
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xc5a059,
      metalness: 0.85,
      roughness: 0.28,
    });

    // 9. Bronze metal accents (railings, fixtures, downpipes)
    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0x2e2722,
      metalness: 0.75,
      roughness: 0.35,
    });

    // 10. Roof materials
    const roofShingleMat = new THREE.MeshStandardMaterial({
      color: 0x423023,
      roughness: 0.85,
      metalness: 0.05,
    });

    const ceilingDeckMat = new THREE.MeshStandardMaterial({
      color: 0xe6d9c3,
      roughness: 0.78,
      metalness: 0.0,
    });

    // 11. Warm cream linen curtains
    const fabricTex = getFabricTextures('#EFE8DC', 2, 2);
    const curtainMat = new THREE.MeshStandardMaterial({
      map: fabricTex.map,
      bumpMap: fabricTex.bumpMap,
      bumpScale: 0.03,
      color: 0xefe8dc,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });

    return {
      siding: sidingMaterial,
      interiorWall: interiorWallMaterial,
      slats: slatsMaterial,
      plinth: plinthMaterial,
      floors: {
        foyer: foyerFloorMat,
        oak: oakFloorMat,
        kitchen: kitchenFloorMat,
        bedroom: bedroomFloorMat,
        bath: bathFloorMat,
        laundry: laundryFloorMat,
        balcony: balconyDeckMat,
      },
      timberDark: timberDarkMat,
      timberHoney: timberHoneyMat,
      clearGlass: clearGlassMat,
      frostedGlass: frostedGlassMat,
      brass: brassMat,
      bronze: bronzeMat,
      roofShingle: roofShingleMat,
      ceilingDeck: ceilingDeckMat,
      curtains: curtainMat,
    };
  }

  /**
   * Builds the foundation slab, subfloor plinth, and per-room floor surfaces.
   */
  buildFoundation(houseGroup) {
    const fGroup = new THREE.Group();
    fGroup.name = 'foundation-and-floors';

    // 1. Concrete & stone foundation slab: 24 x 18 m, 0.25 m thick, top at Y = 0.30 m
    const slabGeo = new THREE.BoxGeometry(
      WORLD_DIMENSIONS.houseWidth,
      WORLD_DIMENSIONS.groundSlabThickness,
      WORLD_DIMENSIONS.houseDepth
    );
    const slabMesh = new THREE.Mesh(slabGeo, this.materials.plinth);
    slabMesh.name = 'foundation-slab';
    slabMesh.position.set(
      0,
      WORLD_DIMENSIONS.groundSlabTop - WORLD_DIMENSIONS.groundSlabThickness * 0.5,
      0
    );
    slabMesh.receiveShadow = true;
    fGroup.add(slabMesh);

    // 2. Foundation base plinth trim around exterior base perimeter
    const trimHeight = 0.32;
    const trimThickness = 0.08;
    const plinthTrims = [
      // Front & rear trims
      [0, trimHeight * 0.5, WORLD_DIMENSIONS.houseDepth * 0.5 + trimThickness * 0.5, WORLD_DIMENSIONS.houseWidth + trimThickness * 2, trimHeight, trimThickness],
      [0, trimHeight * 0.5, -WORLD_DIMENSIONS.houseDepth * 0.5 - trimThickness * 0.5, WORLD_DIMENSIONS.houseWidth + trimThickness * 2, trimHeight, trimThickness],
      // Left & right trims
      [-WORLD_DIMENSIONS.houseWidth * 0.5 - trimThickness * 0.5, trimHeight * 0.5, 0, trimThickness, trimHeight, WORLD_DIMENSIONS.houseDepth],
      [WORLD_DIMENSIONS.houseWidth * 0.5 + trimThickness * 0.5, trimHeight * 0.5, 0, trimThickness, trimHeight, WORLD_DIMENSIONS.houseDepth],
    ];
    for (const [tx, ty, tz, tw, th, td] of plinthTrims) {
      const trimMesh = new THREE.Mesh(new THREE.BoxGeometry(tw, th, td), this.materials.plinth);
      trimMesh.position.set(tx, ty, tz);
      trimMesh.receiveShadow = true;
      fGroup.add(trimMesh);
    }

    // 3. Ground floor finished room floors
    for (const room of ROOMS) {
      if (room.floor !== 0) continue;
      const rw = room.maxX - room.minX;
      const rd = room.maxZ - room.minZ;
      const rx = (room.minX + room.maxX) * 0.5;
      const rz = (room.minZ + room.maxZ) * 0.5;

      let floorMat = this.materials.floors.oak;
      if (room.floorFinish === 'stone-foyer') floorMat = this.materials.floors.foyer;
      else if (room.floorFinish === 'limestone') floorMat = this.materials.floors.kitchen;
      else if (room.floorFinish === 'walnut-honey') floorMat = this.materials.floors.bedroom;
      else if (room.floorFinish === 'bath-stone') floorMat = this.materials.floors.bath;
      else if (room.floorFinish === 'laundry-tile') floorMat = this.materials.floors.laundry;

      const roomFloorGeo = new THREE.PlaneGeometry(rw, rd);
      roomFloorGeo.rotateX(-Math.PI / 2);
      const roomFloorMesh = new THREE.Mesh(roomFloorGeo, floorMat);
      roomFloorMesh.name = `floor-${room.id}`;
      roomFloorMesh.position.set(rx, WORLD_DIMENSIONS.groundSlabTop + 0.002, rz);
      roomFloorMesh.receiveShadow = true;
      fGroup.add(roomFloorMesh);
    }

    // 4. Upper floor structural slab (0.25 m thick, top at Y = 3.95 m)
    // Slabs cover the upper room sections while keeping the double-height living atrium open
    const upperSlabs = [
      // West wing upper slab (Bedroom 2, Ensuite Bathroom 2, Walk-in Wardrobe & Rear Upper Lounge)
      [-9.3, 3.825, 0.0, 5.4, 0.25, 17.5],
      // Upper landing & gallery slab (wraps along rear and gallery)
      [-1.325, 3.825, -3.525, 10.55, 0.25, 10.45],
    ];
    for (const [ux, uy, uz, uw, uh, ud] of upperSlabs) {
      const uSlabMesh = new THREE.Mesh(new THREE.BoxGeometry(uw, uh, ud), this.materials.ceilingDeck);
      uSlabMesh.position.set(ux, uy, uz);
      uSlabMesh.receiveShadow = true;
      fGroup.add(uSlabMesh);
    }

    // Continuous exterior spandrel / slab-edge siding bands (Y = 3.70..3.95) sealing the 2-story box perimeter
    const rimBands = [
      [-3.9, 3.825, 8.875, 16.2, 0.25, 0.25], // Front
      [-3.9, 3.825, -8.875, 16.2, 0.25, 0.25], // Rear
      [-11.875, 3.825, 0, 0.25, 0.25, 18.0], // West
      [4.075, 3.895, 0, 0.25, 0.11, 18.0], // East upper wall base above continuous ceiling plane
    ];
    for (const [rx, ry, rz, rw, rh, rd] of rimBands) {
      const rimMesh = new THREE.Mesh(new THREE.BoxGeometry(rw, rh, rd), this.materials.siding);
      rimMesh.position.set(rx, ry, rz);
      rimMesh.castShadow = true;
      rimMesh.receiveShadow = true;
      fGroup.add(rimMesh);
    }

    // Single-story East Wing insulated ceiling slab extending continuously from X = 3.95..12.00 (Y = 3.70..3.84)
    const eastWingCeiling = new THREE.Mesh(
      new THREE.BoxGeometry(8.05, 0.14, 18.0),
      this.materials.ceilingDeck
    );
    eastWingCeiling.name = 'east-wing-ceiling-slab';
    eastWingCeiling.position.set(7.975, 3.77, 0);
    eastWingCeiling.castShadow = true;
    eastWingCeiling.receiveShadow = true;
    fGroup.add(eastWingCeiling);

    // 5. Upper floor finished room floor surfaces
    for (const room of ROOMS) {
      if (room.floor !== 1) continue;
      const rw = room.maxX - room.minX;
      const rd = room.maxZ - room.minZ;
      const rx = (room.minX + room.maxX) * 0.5;
      const rz = (room.minZ + room.maxZ) * 0.5;

      let floorMat = this.materials.floors.oak;
      if (room.floorFinish === 'walnut-honey') floorMat = this.materials.floors.bedroom;
      else if (room.floorFinish === 'bath-stone') floorMat = this.materials.floors.bath;
      else if (room.floorFinish === 'teak-deck') floorMat = this.materials.floors.balcony;

      const uRoomFloorGeo = new THREE.PlaneGeometry(rw, rd);
      uRoomFloorGeo.rotateX(-Math.PI / 2);
      const uRoomFloorMesh = new THREE.Mesh(uRoomFloorGeo, floorMat);
      uRoomFloorMesh.name = `floor-${room.id}`;
      uRoomFloorMesh.position.set(rx, WORLD_DIMENSIONS.upperFloorY + 0.002, rz);
      uRoomFloorMesh.receiveShadow = true;
      fGroup.add(uRoomFloorMesh);
    }

    houseGroup.add(fGroup);
  }

  /**
   * Builds the front porch with sandstone entry steps, columns, timber ceiling, bench, and sconces.
   */
  buildPorch(houseGroup) {
    const pGroup = new THREE.Group();
    pGroup.name = 'front-porch-assembly';

    const pw = WORLD_DIMENSIONS.porchWidth;
    const pd = WORLD_DIMENSIONS.porchDepth;
    const px = (WORLD_DIMENSIONS.porchMinX + WORLD_DIMENSIONS.porchMaxX) * 0.5;
    const pz = (WORLD_DIMENSIONS.porchMinZ + WORLD_DIMENSIONS.porchMaxZ) * 0.5;

    // 1. Raised porch deck slab: 6.0 x 3.0 m at Y = 0.30 m
    const porchDeckGeo = new THREE.BoxGeometry(pw, WORLD_DIMENSIONS.groundSlabThickness, pd);
    const porchDeckMesh = new THREE.Mesh(porchDeckGeo, this.materials.floors.foyer);
    porchDeckMesh.name = 'porch-deck';
    porchDeckMesh.position.set(px, WORLD_DIMENSIONS.groundSlabTop - WORLD_DIMENSIONS.groundSlabThickness * 0.5, pz);
    porchDeckMesh.receiveShadow = true;
    pGroup.add(porchDeckMesh);

    // 2. Sandstone entry steps connecting Y = 0.30 m porch to garden path (Z = 12.0 to 12.8 m)
    // Step 1 (upper)
    const step1 = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.1, 0.4),
      this.materials.floors.foyer
    );
    step1.position.set(3.5, 0.2, 12.2);
    step1.receiveShadow = true;
    pGroup.add(step1);

    // Step 2 (lower)
    const step2 = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.1, 0.4),
      this.materials.floors.foyer
    );
    step2.position.set(3.5, 0.1, 12.6);
    step2.receiveShadow = true;
    pGroup.add(step2);

    // 3. Two square structural sandalwood timber columns (0.22 x 0.22 m)
    const colGeo = new THREE.BoxGeometry(0.22, 3.1, 0.22);
    const col1 = new THREE.Mesh(colGeo, this.materials.timberHoney);
    col1.position.set(1.0, 0.3 + 1.55, 11.8);
    col1.castShadow = true;
    col1.receiveShadow = true;
    pGroup.add(col1);

    const col2 = new THREE.Mesh(colGeo, this.materials.timberHoney);
    col2.position.set(6.0, 0.3 + 1.55, 11.8);
    col2.castShadow = true;
    col2.receiveShadow = true;
    pGroup.add(col2);

    // 4. Porch roof beam & slatted ceiling
    const beamGeo = new THREE.BoxGeometry(pw + 0.4, 0.24, 0.28);
    const beamMesh = new THREE.Mesh(beamGeo, this.materials.timberDark);
    beamMesh.position.set(px, 3.4, 11.8);
    beamMesh.castShadow = true;
    pGroup.add(beamMesh);

    const porchCeilingGeo = new THREE.BoxGeometry(pw + 0.4, 0.1, pd + 0.4);
    const porchCeilingMesh = new THREE.Mesh(porchCeilingGeo, this.materials.ceilingDeck);
    porchCeilingMesh.position.set(px, 3.45, pz + 0.1);
    pGroup.add(porchCeilingMesh);

    // 5. Timber porch bench (1.6 m wide) on the left side
    const benchGroup = new THREE.Group();
    benchGroup.name = 'porch-bench';
    const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 1.6), this.materials.timberHoney);
    benchSeat.position.set(1.15, 0.3 + 0.45, 10.4);
    benchSeat.castShadow = true;
    benchGroup.add(benchSeat);

    const benchLeg1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.08), this.materials.timberDark);
    benchLeg1.position.set(1.15, 0.3 + 0.225, 9.8);
    benchLeg1.castShadow = true;
    benchGroup.add(benchLeg1);

    const benchLeg2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.08), this.materials.timberDark);
    benchLeg2.position.set(1.15, 0.3 + 0.225, 11.0);
    benchLeg2.castShadow = true;
    benchGroup.add(benchLeg2);
    pGroup.add(benchGroup);

    // 6. Two exterior bronze wall sconces with warm 2700K point lights flanking the entrance
    const sconcePositions = [2.4, 4.6];
    for (const sx of sconcePositions) {
      const sconceGroup = new THREE.Group();
      sconceGroup.position.set(sx, 2.1, 9.02);

      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.08), this.materials.bronze);
      sconceGroup.add(bracket);

      const lanternMat = new THREE.MeshStandardMaterial({
        color: 0xffd199,
        emissive: 0xff8c3b,
        emissiveIntensity: 0.65,
        roughness: 0.4,
      });
      const lantern = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.05, 0.18, 6),
        lanternMat
      );
      lantern.position.set(0, 0, 0.06);
      sconceGroup.add(lantern);

      const sconceLight = new THREE.PointLight(0xffa858, 1.1, 6.5, 1.8);
      sconceLight.position.set(0, 0, 0.18);
      sconceGroup.add(sconceLight);

      this.exteriorLights.push({
        light: sconceLight,
        baseIntensity: 1.1,
        emissiveMat: lanternMat,
        baseEmissive: 1.15,
      });

      pGroup.add(sconceGroup);
    }

    // 7. Porch planters with low foliage
    const planterGeo = new THREE.BoxGeometry(0.45, 0.5, 0.45);
    const plant1 = new THREE.Mesh(planterGeo, this.materials.floors.foyer);
    plant1.position.set(0.9, 0.3 + 0.25, 11.5);
    plant1.castShadow = true;
    pGroup.add(plant1);

    const plant2 = new THREE.Mesh(planterGeo, this.materials.floors.foyer);
    plant2.position.set(6.1, 0.3 + 0.25, 11.5);
    plant2.castShadow = true;
    pGroup.add(plant2);

    houseGroup.add(pGroup);
  }

  /**
   * Helper to construct a wall with rectangular apertures (windows or doors).
   * Generates solid rectangular blocks around the openings to ensure genuine physical voids.
   */
  createWallWithApertures({
    isAlongX = true,
    fixedCoord = 0,
    spanStart = -12,
    spanEnd = 12,
    baseY = 0.3,
    topY = 3.7,
    thickness = 0.25,
    openings = [],
    material = this.materials.siding,
    name = 'wall',
  }) {
    const wallGroup = new THREE.Group();
    wallGroup.name = name;

    const spanLength = spanEnd - spanStart;
    if (spanLength <= 0.001) return wallGroup;

    // Sort openings by span position
    const sorted = [...openings].sort((a, b) => a.pos - b.pos);

    let curPos = spanStart;
    for (const op of sorted) {
      const opStart = op.pos - op.width * 0.5;
      const opEnd = op.pos + op.width * 0.5;
      const opBottom = op.bottomY;
      const opTop = op.bottomY + op.height;

      // 1. Solid segment before this opening
      if (opStart > curPos + 0.005) {
        const segLen = opStart - curPos;
        const segCenter = curPos + segLen * 0.5;
        const segH = topY - baseY;
        const segCenterY = baseY + segH * 0.5;

        const wGeo = isAlongX
          ? new THREE.BoxGeometry(segLen, segH, thickness)
          : new THREE.BoxGeometry(thickness, segH, segLen);
        const wMesh = new THREE.Mesh(wGeo, material);
        if (isAlongX) wMesh.position.set(segCenter, segCenterY, fixedCoord);
        else wMesh.position.set(fixedCoord, segCenterY, segCenter);

        wMesh.castShadow = true;
        wMesh.receiveShadow = true;
        wallGroup.add(wMesh);

        this.addColliderBox(
          isAlongX ? segCenter - segLen * 0.5 : fixedCoord - thickness * 0.5,
          baseY,
          isAlongX ? fixedCoord - thickness * 0.5 : segCenter - segLen * 0.5,
          isAlongX ? segCenter + segLen * 0.5 : fixedCoord + thickness * 0.5,
          topY,
          isAlongX ? fixedCoord + thickness * 0.5 : segCenter + segLen * 0.5,
          `${name}-seg`
        );
      }

      // 2. Segment below the opening (sill/spandrel wall)
      if (opBottom > baseY + 0.005) {
        const sillH = opBottom - baseY;
        const sillCenterY = baseY + sillH * 0.5;
        const sillLen = op.width;

        const sillGeo = isAlongX
          ? new THREE.BoxGeometry(sillLen, sillH, thickness)
          : new THREE.BoxGeometry(thickness, sillH, sillLen);
        const sillMesh = new THREE.Mesh(sillGeo, material);
        if (isAlongX) sillMesh.position.set(op.pos, sillCenterY, fixedCoord);
        else sillMesh.position.set(fixedCoord, sillCenterY, op.pos);

        sillMesh.castShadow = true;
        sillMesh.receiveShadow = true;
        wallGroup.add(sillMesh);

        this.addColliderBox(
          isAlongX ? op.pos - sillLen * 0.5 : fixedCoord - thickness * 0.5,
          baseY,
          isAlongX ? fixedCoord - thickness * 0.5 : op.pos - sillLen * 0.5,
          isAlongX ? op.pos + sillLen * 0.5 : fixedCoord + thickness * 0.5,
          opBottom,
          isAlongX ? fixedCoord + thickness * 0.5 : op.pos + sillLen * 0.5,
          `${name}-sill`
        );
      }

      // 3. Segment above the opening (header/lintel wall)
      if (topY > opTop + 0.005) {
        const lintelH = topY - opTop;
        const lintelCenterY = opTop + lintelH * 0.5;
        const lintelLen = op.width;

        const lintelGeo = isAlongX
          ? new THREE.BoxGeometry(lintelLen, lintelH, thickness)
          : new THREE.BoxGeometry(thickness, lintelH, lintelLen);
        const lintelMesh = new THREE.Mesh(lintelGeo, material);
        if (isAlongX) lintelMesh.position.set(op.pos, lintelCenterY, fixedCoord);
        else lintelMesh.position.set(fixedCoord, lintelCenterY, op.pos);

        lintelMesh.castShadow = true;
        lintelMesh.receiveShadow = true;
        wallGroup.add(lintelMesh);

        this.addColliderBox(
          isAlongX ? op.pos - lintelLen * 0.5 : fixedCoord - thickness * 0.5,
          opTop,
          isAlongX ? fixedCoord - thickness * 0.5 : op.pos - lintelLen * 0.5,
          isAlongX ? op.pos + lintelLen * 0.5 : fixedCoord + thickness * 0.5,
          topY,
          isAlongX ? fixedCoord + thickness * 0.5 : op.pos + lintelLen * 0.5,
          `${name}-lintel`
        );
      }

      curPos = opEnd;
    }

    // 4. Final solid segment after all openings
    if (spanEnd > curPos + 0.005) {
      const segLen = spanEnd - curPos;
      const segCenter = curPos + segLen * 0.5;
      const segH = topY - baseY;
      const segCenterY = baseY + segH * 0.5;

      const wGeo = isAlongX
        ? new THREE.BoxGeometry(segLen, segH, thickness)
        : new THREE.BoxGeometry(thickness, segH, segLen);
      const wMesh = new THREE.Mesh(wGeo, material);
      if (isAlongX) wMesh.position.set(segCenter, segCenterY, fixedCoord);
      else wMesh.position.set(fixedCoord, segCenterY, segCenter);

      wMesh.castShadow = true;
      wMesh.receiveShadow = true;
      wallGroup.add(wMesh);

      this.addColliderBox(
        isAlongX ? segCenter - segLen * 0.5 : fixedCoord - thickness * 0.5,
        baseY,
        isAlongX ? fixedCoord - thickness * 0.5 : segCenter - segLen * 0.5,
        isAlongX ? segCenter + segLen * 0.5 : fixedCoord + thickness * 0.5,
        topY,
        isAlongX ? fixedCoord + thickness * 0.5 : segCenter + segLen * 0.5,
        `${name}-seg-end`
      );
    }

    return wallGroup;
  }

  /**
   * Adds a bounding box collider to the internal colliders list.
   */
  addColliderBox(minX, minY, minZ, maxX, maxY, maxZ, id = '') {
    this.colliders.push({ minX, minY, minZ, maxX, maxY, maxZ, active: true, id });
  }

  /**
   * Builds the exterior timber siding walls across Ground and Upper floors.
   * Enforces the mandatory asymmetrical façade composition.
   */
  buildExteriorWalls(houseGroup) {
    const extGroup = new THREE.Group();
    extGroup.name = 'exterior-walls';

    const t = WORLD_DIMENSIONS.extWallThickness;
    const gBase = WORLD_DIMENSIONS.groundSlabTop; // 0.30
    const gTop = gBase + WORLD_DIMENSIONS.groundWallHeight; // 3.70
    const uBase = WORLD_DIMENSIONS.upperFloorY; // 3.95
    const uTop = WORLD_DIMENSIONS.upperCeilingY; // 7.05

    // ---------------------------------------------------------
    // 1. FRONT FAÇADE (Z = +8.875 m) — MANDATORY ASYMMETRICAL COMPOSITION
    // Looking from garden (+Z):
    // LEFT (X < 0): win-front-left (x = -3.6, y = 1.9, w = 2.4, h = 1.7)
    // RIGHT (X = 3.5): door-main-entrance (x = 3.5, y = 0.3, w = 1.25, h = 2.4)
    // ---------------------------------------------------------
    const frontGroundOpenings = [
      {
        id: 'win-front-left',
        pos: -3.6,
        width: 2.4,
        bottomY: 1.05, // 1.9 - 1.7/2 = 1.05 (0.75m sill above 0.30m floor)
        height: 1.7,
      },
      {
        id: 'door-main-entrance',
        pos: 3.5,
        width: 1.25,
        bottomY: 0.3,
        height: 2.4,
      },
    ];

    const frontGroundWall = this.createWallWithApertures({
      isAlongX: true,
      fixedCoord: 8.875,
      spanStart: -12.0,
      spanEnd: 12.0,
      baseY: gBase,
      topY: gTop,
      thickness: t,
      openings: frontGroundOpenings,
      material: this.materials.siding,
      name: 'wall-front-ground',
    });
    extGroup.add(frontGroundWall);

    // Front Upper Wall (Upper living / clerestory window at X = -3.6)
    const frontUpperOpenings = [
      {
        id: 'win-upper-living-left',
        pos: -3.6,
        width: 2.4,
        bottomY: 4.45, // 5.2 - 1.5/2
        height: 1.5,
      },
    ];

    const frontUpperWall = this.createWallWithApertures({
      isAlongX: true,
      fixedCoord: 8.875,
      spanStart: -12.0,
      spanEnd: 4.2, // Upper volume extends from west to stair clerestory
      baseY: uBase,
      topY: uTop,
      thickness: t,
      openings: frontUpperOpenings,
      material: this.materials.siding,
      name: 'wall-front-upper',
    });
    extGroup.add(frontUpperWall);

    // ---------------------------------------------------------
    // 2. REAR FAÇADE (Z = -8.875 m)
    // Ground: Pool sliding door (x = -5.5), Rear gallery window (x = 0.5), Service door (x = 6.05)
    // Upper: Balcony 1 door (x = -3.0), Lounge window (x = -9.5), Gallery window (x = 1.6)
    // ---------------------------------------------------------
    const rearGroundOpenings = [
      { id: 'door-pool-sliding', pos: -5.5, width: 2.6, bottomY: 0.3, height: 2.3 },
      { id: 'win-rear-gallery', pos: 0.5, width: 2.2, bottomY: 1.1, height: 1.6 },
      { id: 'door-rear-service', pos: 6.05, width: 0.9, bottomY: 0.3, height: 2.1 },
    ];

    const rearGroundWall = this.createWallWithApertures({
      isAlongX: true,
      fixedCoord: -8.875,
      spanStart: -12.0,
      spanEnd: 12.0,
      baseY: gBase,
      topY: gTop,
      thickness: t,
      openings: rearGroundOpenings,
      material: this.materials.siding,
      name: 'wall-rear-ground',
    });
    extGroup.add(rearGroundWall);

    const rearUpperOpenings = [
      { id: 'win-upper-lounge-rear', pos: -9.5, width: 2.0, bottomY: 4.75, height: 1.5 },
      { id: 'door-balcony-1', pos: -3.0, width: 1.5, bottomY: 3.95, height: 2.25 },
      { id: 'win-upper-gallery-rear', pos: 1.6, width: 1.8, bottomY: 4.8, height: 1.4 },
    ];

    const rearUpperWall = this.createWallWithApertures({
      isAlongX: true,
      fixedCoord: -8.875,
      spanStart: -12.0,
      spanEnd: 4.2,
      baseY: uBase,
      topY: uTop,
      thickness: t,
      openings: rearUpperOpenings,
      material: this.materials.siding,
      name: 'wall-rear-upper',
    });
    extGroup.add(rearUpperWall);

    // ---------------------------------------------------------
    // 3. WEST FAÇADE (X = -11.875 m)
    // Ground: Dining window (z = 2.3), Kitchen window (z = 6.65)
    // Upper: Balcony 2 door (z = 2.3), Bath 2 frosted window (z = 5.9)
    // ---------------------------------------------------------
    const westGroundOpenings = [
      { id: 'win-dining-west', pos: 2.3, width: 2.0, bottomY: 1.15, height: 1.5 },
      { id: 'win-kitchen-west', pos: 6.65, width: 1.4, bottomY: 1.45, height: 1.2 },
    ];

    const westGroundWall = this.createWallWithApertures({
      isAlongX: false,
      fixedCoord: -11.875,
      spanStart: -9.0,
      spanEnd: 9.0,
      baseY: gBase,
      topY: gTop,
      thickness: t,
      openings: westGroundOpenings,
      material: this.materials.siding,
      name: 'wall-west-ground',
    });
    extGroup.add(westGroundWall);

    const westUpperOpenings = [
      { id: 'door-balcony-2', pos: 2.3, width: 1.4, bottomY: 3.95, height: 2.25 },
      { id: 'win-bath2-west', pos: 5.9, width: 0.9, bottomY: 5.15, height: 1.0 },
    ];

    const westUpperWall = this.createWallWithApertures({
      isAlongX: false,
      fixedCoord: -11.875,
      spanStart: -9.0,
      spanEnd: 9.0,
      baseY: uBase,
      topY: uTop,
      thickness: t,
      openings: westUpperOpenings,
      material: this.materials.siding,
      name: 'wall-west-upper',
    });
    extGroup.add(westUpperWall);

    // ---------------------------------------------------------
    // 4. EAST FAÇADE GROUND (X = +11.875 m)
    // Ground: Bath 1 frosted window (z = 3.3), Bedroom 1 window (z = 6.75)
    // ---------------------------------------------------------
    const eastGroundOpenings = [
      { id: 'win-bath1-east', pos: 3.3, width: 0.9, bottomY: 1.65, height: 1.0 },
      { id: 'win-bed1-east', pos: 6.75, width: 1.8, bottomY: 1.15, height: 1.5 },
    ];

    const eastGroundWall = this.createWallWithApertures({
      isAlongX: false,
      fixedCoord: 11.875,
      spanStart: -9.0,
      spanEnd: 9.0,
      baseY: gBase,
      topY: gTop,
      thickness: t,
      openings: eastGroundOpenings,
      material: this.materials.siding,
      name: 'wall-east-ground',
    });
    extGroup.add(eastGroundWall);

    // ---------------------------------------------------------
    // 5. EAST FAÇADE UPPER CLERESTORY WALL (X = +4.075 m)
    // Windows: win-upper-gallery-east (z = 3.75), win-upper-stair-east (z = 7.0)
    // ---------------------------------------------------------
    const eastUpperOpenings = [
      { id: 'win-upper-gallery-east', pos: 3.75, width: 1.6, bottomY: 4.8, height: 1.4 },
      { id: 'win-upper-stair-east', pos: 7.0, width: 1.4, bottomY: 4.8, height: 1.4 },
    ];

    const eastUpperWall = this.createWallWithApertures({
      isAlongX: false,
      fixedCoord: 4.075,
      spanStart: -9.0,
      spanEnd: 9.0,
      baseY: uBase,
      topY: uTop,
      thickness: t,
      openings: eastUpperOpenings,
      material: this.materials.siding,
      name: 'wall-east-upper-clerestory',
    });
    extGroup.add(eastUpperWall);

    houseGroup.add(extGroup);
  }

  /**
   * Builds the interior partition walls defining all 12 zones across both floors.
   */
  buildPartitions(houseGroup) {
    const partGroup = new THREE.Group();
    partGroup.name = 'interior-partitions';

    for (const part of PARTITIONS) {
      const openings = [];
      for (const dId of part.doors) {
        const dObj = DOORS.find((d) => d.id === dId);
        if (dObj) {
          openings.push({
            id: dObj.id,
            pos: part.axis === 'x' ? dObj.z : dObj.x,
            width: dObj.width,
            bottomY: dObj.y,
            height: dObj.height,
          });
        }
      }

      const wallMesh = this.createWallWithApertures({
        isAlongX: part.axis === 'z', // along X if axis is Z
        fixedCoord: part.axis === 'z' ? part.z : part.x,
        spanStart: part.axis === 'z' ? part.minX : part.minZ,
        spanEnd: part.axis === 'z' ? part.maxX : part.maxZ,
        baseY: part.baseY,
        topY: part.baseY + part.height,
        thickness: part.thickness,
        openings,
        material: this.materials.interiorWall,
        name: part.id,
      });

      partGroup.add(wallMesh);
    }

    // Feature slat walls in Living Hall and Bedroom 1
    const featureSlatLiving = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 3.2, 3.2),
      this.materials.slats
    );
    featureSlatLiving.position.set(-6.8, 0.3 + 1.6, 5.75);
    partGroup.add(featureSlatLiving);

    houseGroup.add(partGroup);
  }

  /**
   * Builds the exact budget of 12 double-hung/casement windows with timber frames,
   * sills, double-sided glass, muntins, shutters, and curtains.
   */
  buildWindows(houseGroup) {
    const winGroup = new THREE.Group();
    winGroup.name = 'windows-assembly';

    for (const win of WINDOWS) {
      const wSub = new THREE.Group();
      wSub.name = `window-${win.id}`;
      wSub.position.set(win.x, win.y, win.z);
      wSub.rotation.y = win.rotY || 0;

      const w = win.width;
      const h = win.height;
      const frameD = 0.1;
      const frameW = 0.07;

      // 1. Timber outer frame
      const frameMat = this.materials.timberDark;
      // Top & bottom rails
      const topRail = new THREE.Mesh(new THREE.BoxGeometry(w, frameW, frameD), frameMat);
      topRail.position.set(0, h * 0.5 - frameW * 0.5, 0);
      wSub.add(topRail);

      const bottomRail = new THREE.Mesh(new THREE.BoxGeometry(w, frameW, frameD), frameMat);
      bottomRail.position.set(0, -h * 0.5 + frameW * 0.5, 0);
      wSub.add(bottomRail);

      // Left & right stiles
      const sideH = h - frameW * 2;
      const leftStile = new THREE.Mesh(new THREE.BoxGeometry(frameW, sideH, frameD), frameMat);
      leftStile.position.set(-w * 0.5 + frameW * 0.5, 0, 0);
      wSub.add(leftStile);

      const rightStile = new THREE.Mesh(new THREE.BoxGeometry(frameW, sideH, frameD), frameMat);
      rightStile.position.set(w * 0.5 - frameW * 0.5, 0, 0);
      wSub.add(rightStile);

      // 2. Projecting exterior timber sill (clear of the 0.25m thick exterior wall)
      const sillMesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.18, 0.055, 0.28), this.materials.timberHoney);
      sillMesh.position.set(0, -h * 0.5 - 0.025, 0.07);
      sillMesh.castShadow = true;
      wSub.add(sillMesh);

      // 3. Central vertical mullion / glazing bar
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.035, sideH, 0.04), frameMat);
      mullion.position.set(0, 0, 0);
      wSub.add(mullion);

      // 4. Double-sided glass pane
      const glassMat = win.frosted ? this.materials.frostedGlass : this.materials.clearGlass;
      const glassMesh = new THREE.Mesh(new THREE.PlaneGeometry(w - frameW * 2, sideH), glassMat);
      glassMesh.name = `glass-${win.id}`;
      glassMesh.userData = {
        id: win.id,
        type: 'window',
        width: w,
        height: h,
        floor: win.floor,
        wall: win.wall,
      };
      wSub.add(glassMesh);

      // 5. Decorative timber shutters on win-front-left mounted cleanly proud of outer siding
      if (win.shutters) {
        const shutterW = 0.52;
        const shutterH = h + 0.04;
        const shutterGeo = new THREE.BoxGeometry(shutterW, shutterH, 0.045);

        const leftShutter = new THREE.Mesh(shutterGeo, this.materials.timberHoney);
        leftShutter.position.set(-w * 0.5 - shutterW * 0.5 - 0.06, 0, 0.155);
        leftShutter.castShadow = true;
        wSub.add(leftShutter);

        const rightShutter = new THREE.Mesh(shutterGeo, this.materials.timberHoney);
        rightShutter.position.set(w * 0.5 + shutterW * 0.5 + 0.06, 0, 0.155);
        rightShutter.castShadow = true;
        wSub.add(rightShutter);
      }

      // 6. Warm cream linen curtains tucked gracefully along outer jambs so interior shows through
      if (win.curtains) {
        const curtainW = w * 0.22;
        const curtainGeo = new THREE.PlaneGeometry(curtainW, h * 0.94);
        const cLeft = new THREE.Mesh(curtainGeo, this.materials.curtains);
        cLeft.position.set(-w * 0.37, 0, -0.075);
        wSub.add(cLeft);

        const cRight = new THREE.Mesh(curtainGeo, this.materials.curtains);
        cRight.position.set(w * 0.37, 0, -0.075);
        wSub.add(cRight);

        const rodMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.012, 0.012, w + 0.16, 8),
          this.materials.brass
        );
        rodMesh.rotation.z = Math.PI / 2;
        rodMesh.position.set(0, h * 0.5 + 0.04, -0.075);
        wSub.add(rodMesh);
      }

      this.windowsMap.set(win.id, wSub);
      winGroup.add(wSub);
    }

    houseGroup.add(winGroup);
  }

  /**
   * Builds the exact budget of 13 interactive doors with pivot groups, timber slabs,
   * brass handles, hardware, dynamic colliders, and interaction hooks.
   */
  buildDoors(houseGroup) {
    const doorsGroup = new THREE.Group();
    doorsGroup.name = 'doors-assembly';

    for (const d of DOORS) {
      const dSub = new THREE.Group();
      dSub.name = `door-assembly-${d.id}`;
      dSub.position.set(d.x, d.y, d.z);
      dSub.rotation.y = d.rotY || 0;

      const w = d.width;
      const h = d.height;
      const thick = d.thickness;
      const frameD = 0.12;
      const frameW = 0.06;

      // 1. Timber door frame (jambs + header)
      const frameMat = this.materials.timberDark;
      const topFrame = new THREE.Mesh(new THREE.BoxGeometry(w + frameW * 2, frameW, frameD), frameMat);
      topFrame.position.set(0, h + frameW * 0.5, 0);
      dSub.add(topFrame);

      const leftJamb = new THREE.Mesh(new THREE.BoxGeometry(frameW, h, frameD), frameMat);
      leftJamb.position.set(-w * 0.5 - frameW * 0.5, h * 0.5, 0);
      dSub.add(leftJamb);

      const rightJamb = new THREE.Mesh(new THREE.BoxGeometry(frameW, h, frameD), frameMat);
      rightJamb.position.set(w * 0.5 + frameW * 0.5, h * 0.5, 0);
      dSub.add(rightJamb);

      // Low threshold
      const thresh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.025, frameD), this.materials.brass);
      thresh.position.set(0, 0.0125, 0);
      dSub.add(thresh);

      // 2. Door Pivot Group
      const pivot = new THREE.Group();
      pivot.name = `pivot-${d.id}`;

      let doorSlab;
      const isSliding = Boolean(d.isSliding);

      if (isSliding) {
        // Sliding glass pool terrace door (fixed right glass leaf + hollow-framed sliding left glass leaf)
        pivot.position.set(0, 0, 0);
        const glassDoorMat = this.materials.clearGlass;
        const panelW = w * 0.51;
        const railT = 0.055;

        const addFramedGlassPanel = (targetGroup, offsetX, offsetZ) => {
          const panel = new THREE.Group();
          panel.position.set(offsetX, 0, offsetZ);

          const pane = new THREE.Mesh(
            new THREE.PlaneGeometry(panelW - railT * 2, h - railT * 2),
            glassDoorMat
          );
          pane.position.set(0, h * 0.5, 0);
          panel.add(pane);

          const topB = new THREE.Mesh(new THREE.BoxGeometry(panelW, railT, thick), this.materials.bronze);
          topB.position.set(0, h - railT * 0.5, 0);
          panel.add(topB);

          const botB = new THREE.Mesh(new THREE.BoxGeometry(panelW, railT, thick), this.materials.bronze);
          botB.position.set(0, railT * 0.5, 0);
          panel.add(botB);

          const leftB = new THREE.Mesh(new THREE.BoxGeometry(railT, h - railT * 2, thick), this.materials.bronze);
          leftB.position.set(-panelW * 0.5 + railT * 0.5, h * 0.5, 0);
          panel.add(leftB);

          const rightB = new THREE.Mesh(new THREE.BoxGeometry(railT, h - railT * 2, thick), this.materials.bronze);
          rightB.position.set(panelW * 0.5 - railT * 0.5, h * 0.5, 0);
          panel.add(rightB);

          targetGroup.add(panel);
          return panel;
        };

        // Stationary outer glass panel (+X side)
        addFramedGlassPanel(dSub, w * 0.25, -0.025);

        // Movable sliding leaf (-X side, slides +X over stationary panel when toggled)
        doorSlab = new THREE.Group();
        addFramedGlassPanel(doorSlab, -w * 0.25, 0.025);

        const handleBar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.014, 0.014, 0.36, 8),
          this.materials.brass
        );
        handleBar.position.set(-w * 0.45, 1.05, 0.055);
        doorSlab.add(handleBar);

        pivot.add(doorSlab);
      } else {
        // Hinged door
        const hingeOnRight = d.hingeSide === 'right';
        const hingeX = hingeOnRight ? w * 0.5 : -w * 0.5;
        pivot.position.set(hingeX, 0, 0);

        doorSlab = new THREE.Group();
        const slabMesh = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, thick),
          d.isGlassDoor ? this.materials.clearGlass : this.materials.timberHoney
        );
        slabMesh.castShadow = true;
        slabMesh.receiveShadow = true;
        slabMesh.position.set(hingeOnRight ? -w * 0.5 : w * 0.5, h * 0.5, 0);
        doorSlab.add(slabMesh);

        // Brass handles on interior and exterior
        const handleX = hingeOnRight ? -w + 0.12 : w - 0.12;
        const handleY = 0.98;

        const handleOut = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8), this.materials.brass);
        handleOut.rotation.z = Math.PI / 2;
        handleOut.position.set(handleX, handleY, thick * 0.5 + 0.04);
        doorSlab.add(handleOut);

        const handleIn = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8), this.materials.brass);
        handleIn.rotation.z = Math.PI / 2;
        handleIn.position.set(handleX, handleY, -thick * 0.5 - 0.04);
        doorSlab.add(handleIn);

        pivot.add(doorSlab);
      }

      // Metadata for InteractionManager and gameStore
      dSub.userData = {
        id: d.id,
        type: 'door',
        label: d.label,
        category: d.category,
        isOpen: false,
        openAngle: d.openAngle || Math.PI * 0.5,
        isSliding,
        slideDistance: d.slideDistance || 1.25,
        isMain: Boolean(d.isMain),
        pivot,
      };

      // Built-in toggle method
      dSub.toggle = (forceState) => {
        const nextState = forceState !== undefined ? forceState : !dSub.userData.isOpen;
        dSub.userData.isOpen = nextState;

        if (isSliding) {
          pivot.position.x = nextState ? dSub.userData.slideDistance : 0;
        } else {
          pivot.rotation.y = nextState ? dSub.userData.openAngle : 0;
        }

        // Notify options if hooked
        if (this.options.collisionSystem) {
          this.options.collisionSystem.setDoorOpen(d.id, nextState);
        }
        gameStore.setState({
          doors: { ...gameStore.getState().doors, [d.id]: nextState },
        });
        return nextState;
      };

      dSub.resetClosed = () => {
        dSub.userData.isOpen = false;
        if (isSliding) {
          pivot.position.x = 0;
        } else {
          pivot.rotation.y = 0;
        }
        if (this.options.collisionSystem) {
          this.options.collisionSystem.setDoorOpen(d.id, false);
        }
      };

      dSub.add(pivot);

      // Register collision box for closed door
      if (this.options.collisionSystem) {
        const colBox = this.options.collisionSystem.addWallBox(
          d.x,
          d.y,
          d.z,
          w,
          h,
          frameD,
          `door-col-${d.id}`
        );
        this.options.collisionSystem.registerDoorCollider(d.id, colBox);
      }

      // Register interactable item
      if (this.options.interactionManager) {
        this.options.interactionManager.register({
          id: d.id,
          mesh: dSub,
          kind: 'door',
          label: d.label,
          prompt: () => (dSub.userData.isOpen ? 'E — Close Door' : 'E — Open Door'),
          range: d.isMain ? 2.4 : 2.0,
          onInteract: () => dSub.toggle(),
        });
      }

      this.doorsMap.set(d.id, dSub);
      doorsGroup.add(dSub);
    }

    houseGroup.add(doorsGroup);
  }

  /**
   * Builds the central 18-step timber staircase connecting ground floor (Y = 0.30)
   * to upper gallery mezzanine (Y = 3.95).
   */
  buildStaircase(houseGroup) {
    const stairGroup = new THREE.Group();
    stairGroup.name = 'central-staircase';

    const s = STAIRCASE;
    const count = s.stepCount; // 18 steps
    const w = s.maxX - s.minX; // 2.40 m wide
    const run = s.startZ - s.endZ; // 4.00 m run
    const rise = s.topY - s.bottomY; // 3.65 m rise
    const stepDepth = run / count; // ~0.222 m
    const stepHeight = rise / count; // ~0.203 m
    const centerX = (s.minX + s.maxX) * 0.5;

    // 1. Individual 18 steps with oak treads and sandalwood risers
    for (let i = 0; i < count; i++) {
      const stepZ = s.startZ - (i + 0.5) * stepDepth;
      const stepY = s.bottomY + (i + 1) * stepHeight;

      // Tread (with 0.035 m nosing overhang)
      const treadMesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.04, stepDepth + 0.035),
        this.materials.floors.oak
      );
      treadMesh.position.set(centerX, stepY, stepZ);
      treadMesh.castShadow = true;
      treadMesh.receiveShadow = true;
      stairGroup.add(treadMesh);

      // Riser
      const riserMesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, stepHeight, 0.025),
        this.materials.timberHoney
      );
      riserMesh.position.set(centerX, stepY - stepHeight * 0.5, stepZ + stepDepth * 0.5);
      riserMesh.receiveShadow = true;
      stairGroup.add(riserMesh);

      // Balusters along left edge (X = s.minX + 0.05)
      const baluster = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.88, 0.03),
        this.materials.timberDark
      );
      baluster.position.set(s.minX + 0.06, stepY + 0.44, stepZ);
      baluster.castShadow = true;
      stairGroup.add(baluster);
    }

    // 2. Heavy structural stringer beams along left and right sides
    const stringerGeo = new THREE.BoxGeometry(0.08, 0.28, Math.hypot(run, rise));
    const stringerRotX = -Math.atan2(rise, run);
    const midY = (s.bottomY + s.topY) * 0.5;
    const midZ = (s.startZ + s.endZ) * 0.5;

    const leftStringer = new THREE.Mesh(stringerGeo, this.materials.timberDark);
    leftStringer.position.set(s.minX - 0.04, midY - 0.1, midZ);
    leftStringer.rotation.x = stringerRotX;
    leftStringer.castShadow = true;
    stairGroup.add(leftStringer);

    const rightStringer = new THREE.Mesh(stringerGeo, this.materials.timberDark);
    rightStringer.position.set(s.maxX + 0.04, midY - 0.1, midZ);
    rightStringer.rotation.x = stringerRotX;
    rightStringer.castShadow = true;
    stairGroup.add(rightStringer);

    // 3. Newel posts at bottom and top of staircase
    const postGeo = new THREE.BoxGeometry(0.1, 1.15, 0.1);
    const botPost = new THREE.Mesh(postGeo, this.materials.timberDark);
    botPost.position.set(s.minX + 0.06, s.bottomY + 0.575, s.startZ);
    botPost.castShadow = true;
    stairGroup.add(botPost);

    const topPost = new THREE.Mesh(postGeo, this.materials.timberDark);
    topPost.position.set(s.minX + 0.06, s.topY + 0.575, s.endZ);
    topPost.castShadow = true;
    stairGroup.add(topPost);

    // 4. Sloped handrail connecting bottom and top posts
    const handrailGeo = new THREE.BoxGeometry(0.06, 0.06, Math.hypot(run, rise));
    const handrail = new THREE.Mesh(handrailGeo, this.materials.timberHoney);
    handrail.position.set(s.minX + 0.06, midY + 0.92, midZ);
    handrail.rotation.x = stringerRotX;
    stairGroup.add(handrail);

    houseGroup.add(stairGroup);
  }

  /**
   * Builds the upper gallery mezzanine with wooden safety balustrades overlooking
   * the double-height foyer and living hall.
   */
  buildGalleryMezzanine(houseGroup) {
    const mGroup = new THREE.Group();
    mGroup.name = 'upper-gallery-mezzanine';

    const railH = 1.05;
    const railY = WORLD_DIMENSIONS.upperFloorY; // 3.95

    // 1. Guardrail along Z = 1.70 m from X = -6.6 m to X = 0.65 m (overlooking living hall)
    const len1 = 0.65 - -6.6; // 7.25 m
    const centerX1 = (-6.6 + 0.65) * 0.5;

    // Top handrail
    const topRail1 = new THREE.Mesh(new THREE.BoxGeometry(len1, 0.06, 0.06), this.materials.timberHoney);
    topRail1.position.set(centerX1, railY + railH - 0.03, 1.7);
    topRail1.castShadow = true;
    mGroup.add(topRail1);

    // Bottom rail
    const botRail1 = new THREE.Mesh(new THREE.BoxGeometry(len1, 0.04, 0.04), this.materials.timberDark);
    botRail1.position.set(centerX1, railY + 0.06, 1.7);
    mGroup.add(botRail1);

    // Vertical balusters every 0.15 m
    const balCount1 = Math.floor(len1 / 0.15);
    for (let i = 0; i <= balCount1; i++) {
      const bx = -6.6 + i * 0.15;
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(0.025, railH - 0.1, 0.025), this.materials.timberDark);
      bMesh.position.set(bx, railY + railH * 0.5, 1.7);
      bMesh.castShadow = true;
      mGroup.add(bMesh);
    }

    // 2. Guardrail along stair well opening along X = 0.65 m from Z = 1.70 m to 5.70 m
    const len2 = 5.7 - 1.7; // 4.0 m
    const centerZ2 = (1.7 + 5.7) * 0.5;

    const topRail2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, len2), this.materials.timberHoney);
    topRail2.position.set(0.65, railY + railH - 0.03, centerZ2);
    topRail2.castShadow = true;
    mGroup.add(topRail2);

    const botRail2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, len2), this.materials.timberDark);
    botRail2.position.set(0.65, railY + 0.06, centerZ2);
    mGroup.add(botRail2);

    const balCount2 = Math.floor(len2 / 0.15);
    for (let i = 0; i <= balCount2; i++) {
      const bz = 1.7 + i * 0.15;
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(0.025, railH - 0.1, 0.025), this.materials.timberDark);
      bMesh.position.set(0.65, railY + railH * 0.5, bz);
      bMesh.castShadow = true;
      mGroup.add(bMesh);
    }

    // Newel post at junction
    const postMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, railH + 0.08, 0.09), this.materials.timberHoney);
    postMesh.position.set(0.65, railY + (railH + 0.08) * 0.5, 1.7);
    postMesh.castShadow = true;
    mGroup.add(postMesh);

    // Prevent walking off the mezzanine balustrade overlook or stairwell opening
    this.addColliderBox(-6.6, railY, 1.65, 0.65, railY + railH, 1.75, 'rail-gallery-living');
    this.addColliderBox(0.62, railY, 1.7, 0.68, railY + railH, 5.7, 'rail-gallery-stair');

    houseGroup.add(mGroup);
  }

  /**
   * Builds the dual cantilevered upper balconies (Main rear balcony and Secondary west balcony)
   * with teak decking, cantilever joists, balustrades, and outdoor furniture.
   */
  buildBalconies(houseGroup) {
    const bGroup = new THREE.Group();
    bGroup.name = 'cantilevered-balconies';

    const bY = WORLD_DIMENSIONS.upperFloorY; // 3.95

    for (const b of BALCONIES) {
      const bSub = new THREE.Group();
      bSub.name = b.id;

      const bw = b.maxX - b.minX;
      const bd = b.maxZ - b.minZ;
      const bx = (b.minX + b.maxX) * 0.5;
      const bz = (b.minZ + b.maxZ) * 0.5;
      const railH = b.balustradeHeight || 1.05;

      // 1. Cantilevered floor slab: teak decking
      const deckGeo = new THREE.BoxGeometry(bw, 0.15, bd);
      const deckMesh = new THREE.Mesh(deckGeo, this.materials.floors.balcony);
      deckMesh.position.set(bx, bY - 0.075, bz);
      deckMesh.castShadow = true;
      deckMesh.receiveShadow = true;
      bSub.add(deckMesh);

      // 2. Heavy structural cantilever joist beams underneath (stopping cleanly inside exterior wall shell)
      const joistCount = 4;
      const joistGeo = new THREE.BoxGeometry(
        b.orientation === 'rear' ? 0.12 : bw + 0.18,
        0.24,
        b.orientation === 'rear' ? bd + 0.18 : 0.12
      );
      for (let j = 0; j < joistCount; j++) {
        const jMesh = new THREE.Mesh(joistGeo, this.materials.timberDark);
        if (b.orientation === 'rear') {
          const jx = b.minX + 0.3 + (j / (joistCount - 1)) * (bw - 0.6);
          jMesh.position.set(jx, bY - 0.22, bz + 0.08);
        } else {
          const jz = b.minZ + 0.3 + (j / (joistCount - 1)) * (bd - 0.6);
          jMesh.position.set(bx + 0.08, bY - 0.22, jz);
        }
        jMesh.castShadow = true;
        bSub.add(jMesh);
      }

      // 3. Wooden balustrade on 3 outer edges
      const edges = [];
      if (b.orientation === 'rear') {
        // Outer North edge
        edges.push({ x: bx, z: b.minZ, w: bw, d: 0.06 });
        // West side edge
        edges.push({ x: b.minX, z: bz, w: 0.06, d: bd });
        // East side edge
        edges.push({ x: b.maxX, z: bz, w: 0.06, d: bd });
      } else {
        // Outer West edge
        edges.push({ x: b.minX, z: bz, w: 0.06, d: bd });
        // South edge
        edges.push({ x: bx, z: b.minZ, w: bw, d: 0.06 });
        // North edge
        edges.push({ x: bx, z: b.maxZ, w: bw, d: 0.06 });
      }

      for (const e of edges) {
        // Top rail
        const tRail = new THREE.Mesh(new THREE.BoxGeometry(e.w, 0.06, e.d), this.materials.timberHoney);
        tRail.position.set(e.x, bY + railH - 0.03, e.z);
        tRail.castShadow = true;
        bSub.add(tRail);

        // Bottom rail
        const bRail = new THREE.Mesh(new THREE.BoxGeometry(e.w, 0.04, e.d), this.materials.timberDark);
        bRail.position.set(e.x, bY + 0.06, e.z);
        bSub.add(bRail);

        this.addColliderBox(
          e.x - e.w * 0.5,
          bY,
          e.z - e.d * 0.5,
          e.x + e.w * 0.5,
          bY + railH,
          e.z + e.d * 0.5,
          `${b.id}-rail`
        );

        // Balusters
        const isX = e.w > e.d;
        const len = isX ? e.w : e.d;
        const cnt = Math.floor(len / 0.16);
        for (let k = 0; k <= cnt; k++) {
          const bal = new THREE.Mesh(new THREE.BoxGeometry(0.025, railH - 0.1, 0.025), this.materials.timberDark);
          const pos = -len * 0.5 + k * 0.16;
          bal.position.set(isX ? e.x + pos : e.x, bY + railH * 0.5, isX ? e.z : e.z + pos);
          bal.castShadow = true;
          bSub.add(bal);
        }
      }

      // 4. Balcony Furniture on Main Balcony (Balcony 1): 2 chairs, side table, 2 planters
      if (b.id === 'balcony-1') {
        const chairGeo = new THREE.BoxGeometry(0.55, 0.75, 0.55);
        const chair1 = new THREE.Mesh(chairGeo, this.materials.timberHoney);
        chair1.position.set(b.minX + 0.9, bY + 0.375, bz);
        chair1.castShadow = true;
        bSub.add(chair1);

        const chair2 = new THREE.Mesh(chairGeo, this.materials.timberHoney);
        chair2.position.set(b.maxX - 0.9, bY + 0.375, bz);
        chair2.castShadow = true;
        bSub.add(chair2);

        const tableMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 12), this.materials.timberDark);
        tableMesh.position.set(bx, bY + 0.25, bz);
        tableMesh.castShadow = true;
        bSub.add(tableMesh);

        const planterMesh1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.4), this.materials.floors.foyer);
        planterMesh1.position.set(b.minX + 0.3, bY + 0.225, b.minZ + 0.3);
        bSub.add(planterMesh1);

        const planterMesh2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.4), this.materials.floors.foyer);
        planterMesh2.position.set(b.maxX - 0.3, bY + 0.225, b.minZ + 0.3);
        bSub.add(planterMesh2);
      }

      bGroup.add(bSub);
    }

    houseGroup.add(bGroup);
  }

  /**
   * Builds the dual-massing timber roof structure (2-story main gable over X=[-12, +4.2]
   * and 1-story mono-pitch roof over East Wing X=[+4.2, +12]), under-rafters, cedar soffits,
   * enclosed triangular gable walls, fascias, and bronze gutters.
   */
  buildRoof(houseGroup) {
    const rGroup = new THREE.Group();
    rGroup.name = 'timber-roof-structure';

    const roofOverhang = 0.75;
    const totalD = WORLD_DIMENSIONS.houseDepth + roofOverhang * 2; // 19.5 m
    const halfD = totalD * 0.5; // 9.75 m
    const eaveY = WORLD_DIMENSIONS.upperCeilingY; // 7.05 m
    const ridgePeakY = WORLD_DIMENSIONS.upperCeilingY + WORLD_DIMENSIONS.roofRidgeHeight; // 9.45 m
    const rise = ridgePeakY - eaveY; // 2.40 m
    const pitch = Math.atan2(rise, halfD);
    const slopeLen = Math.hypot(halfD, rise);
    const midY = (ridgePeakY + eaveY) * 0.5;

    // Main 2-story gable spans X from -12.0 to +4.2 (plus 0.75m overhangs -> [-12.75, +4.95])
    const mainMinX = WORLD_DIMENSIONS.houseMinX - roofOverhang; // -12.75
    const mainMaxX = 4.2 + roofOverhang; // +4.95
    const mainW = mainMaxX - mainMinX; // 17.70 m
    const mainCenterX = (mainMinX + mainMaxX) * 0.5; // -3.90 m

    // 1. Exterior shingle slopes using flat-lying BoxGeometry tilted accurately via right-hand rule:
    //    North slope (z < 0): rotation.x = -pitch raises +z (ridge) and lowers -z (eave)
    //    South slope (z > 0): rotation.x = +pitch raises -z (ridge) and lowers +z (eave)
    const shingleThickness = 0.14;
    const northSlopeGeo = new THREE.BoxGeometry(mainW, shingleThickness, slopeLen);
    const northRoofMesh = new THREE.Mesh(northSlopeGeo, this.materials.roofShingle);
    northRoofMesh.position.set(mainCenterX, midY + 0.04, -halfD * 0.5);
    northRoofMesh.rotation.x = -pitch;
    northRoofMesh.castShadow = true;
    northRoofMesh.receiveShadow = true;
    rGroup.add(northRoofMesh);

    const southSlopeGeo = new THREE.BoxGeometry(mainW, shingleThickness, slopeLen);
    const southRoofMesh = new THREE.Mesh(southSlopeGeo, this.materials.roofShingle);
    southRoofMesh.position.set(mainCenterX, midY + 0.04, halfD * 0.5);
    southRoofMesh.rotation.x = pitch;
    southRoofMesh.castShadow = true;
    southRoofMesh.receiveShadow = true;
    rGroup.add(southRoofMesh);

    // 2. Warm sandalwood/cedar vaulted ceiling soffits directly beneath shingles
    const soffitThick = 0.06;
    const northSoffit = new THREE.Mesh(
      new THREE.BoxGeometry(mainW - 0.1, soffitThick, slopeLen - 0.06),
      this.materials.ceilingDeck
    );
    northSoffit.position.set(mainCenterX, midY - 0.05, -halfD * 0.5);
    northSoffit.rotation.x = -pitch;
    northSoffit.receiveShadow = true;
    rGroup.add(northSoffit);

    const southSoffit = new THREE.Mesh(
      new THREE.BoxGeometry(mainW - 0.1, soffitThick, slopeLen - 0.06),
      this.materials.ceilingDeck
    );
    southSoffit.position.set(mainCenterX, midY - 0.05, halfD * 0.5);
    southSoffit.rotation.x = pitch;
    southSoffit.receiveShadow = true;
    rGroup.add(southSoffit);

    // 3. Exposed structural rafters neatly INSIDE/UNDER the roof slopes (zero upper protrusion)
    const rafterCount = 10;
    const rafterMat = this.materials.timberDark;
    const rafterLen = slopeLen - 0.15;
    for (let i = 0; i < rafterCount; i++) {
      const rx = -11.6 + (i / (rafterCount - 1)) * 15.2;

      const rNorth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, rafterLen), rafterMat);
      rNorth.position.set(rx, midY - 0.15, -halfD * 0.5);
      rNorth.rotation.x = -pitch;
      rNorth.castShadow = true;
      rGroup.add(rNorth);

      const rSouth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, rafterLen), rafterMat);
      rSouth.position.set(rx, midY - 0.15, halfD * 0.5);
      rSouth.rotation.x = pitch;
      rSouth.castShadow = true;
      rGroup.add(rSouth);
    }

    // 4. Exterior ridge cap + interior structural ridge beam
    const ridgeCap = new THREE.Mesh(new THREE.BoxGeometry(mainW + 0.08, 0.18, 0.28), rafterMat);
    ridgeCap.position.set(mainCenterX, ridgePeakY + 0.06, 0);
    ridgeCap.castShadow = true;
    rGroup.add(ridgeCap);

    const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(16.0, 0.26, 0.22), rafterMat);
    ridgeBeam.position.set(mainCenterX, ridgePeakY - 0.16, 0);
    ridgeBeam.castShadow = true;
    rGroup.add(ridgeBeam);

    // 5. Enclosed pentagon gable end walls & eave top-plate frieze boards (zero sky gap under soffits)
    // Note: Three r175 ExtrudeGeometry requires bevelSegments >= 1 for cap triangulation,
    // so bevelSize/bevelThickness = 0 keeps sharp architectural edges with both solid faces.
    const normalizeWallExtrudeUV = (geometry, widthScale = 18.0, heightScale = 3.1) => {
      const uv = geometry.attributes.uv;
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, uv.getX(i) / widthScale, uv.getY(i) / heightScale);
      }
      uv.needsUpdate = true;
    };

    const gableShape = new THREE.Shape();
    gableShape.moveTo(-9.0, -0.02);
    gableShape.lineTo(9.0, -0.02);
    gableShape.lineTo(9.0, 0.26);
    gableShape.lineTo(0, rise + 0.04);
    gableShape.lineTo(-9.0, 0.26);
    gableShape.closePath();

    const gableGeo = new THREE.ExtrudeGeometry(gableShape, {
      depth: 0.25,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 0,
      bevelThickness: 0,
    });
    normalizeWallExtrudeUV(gableGeo, 18.0, 3.1);
    gableGeo.translate(0, 0, -0.125);
    gableGeo.rotateY(Math.PI / 2);

    const westGable = new THREE.Mesh(gableGeo, this.materials.siding);
    westGable.name = 'gable-wall-west';
    westGable.position.set(-11.875, eaveY, 0);
    westGable.castShadow = true;
    westGable.receiveShadow = true;
    rGroup.add(westGable);

    const eastGable = new THREE.Mesh(gableGeo, this.materials.siding);
    eastGable.name = 'gable-wall-east';
    eastGable.position.set(4.075, eaveY, 0);
    eastGable.castShadow = true;
    eastGable.receiveShadow = true;
    rGroup.add(eastGable);

    // Front & Rear eave top-plate closure boards sealing wall tops (Y=7.05) into raised soffits (Y=7.28)
    const eaveClosureW = 16.2; // X = -12.0..+4.2
    const eaveClosureCenterX = -3.9;
    const eaveClosureGeo = new THREE.BoxGeometry(eaveClosureW, 0.28, 0.25);
    for (const zCoord of [8.875, -8.875]) {
      const frieze = new THREE.Mesh(eaveClosureGeo, this.materials.siding);
      frieze.position.set(eaveClosureCenterX, eaveY + 0.13, zCoord);
      frieze.castShadow = true;
      frieze.receiveShadow = true;
      rGroup.add(frieze);
    }

    // 6. Sloped walnut bargeboards along the West and East gable overhangs
    for (const bx of [mainMinX, mainMaxX]) {
      const bargeN = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, slopeLen), rafterMat);
      bargeN.position.set(bx, midY, -halfD * 0.5);
      bargeN.rotation.x = -pitch;
      rGroup.add(bargeN);

      const bargeS = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, slopeLen), rafterMat);
      bargeS.position.set(bx, midY, halfD * 0.5);
      bargeS.rotation.x = pitch;
      rGroup.add(bargeS);
    }

    // 7. Dark walnut eave fascia boards and bronze gutters on North & South eaves
    const fasciaH = 0.24;
    const fasciaThick = 0.05;
    const fFront = new THREE.Mesh(new THREE.BoxGeometry(mainW, fasciaH, fasciaThick), rafterMat);
    fFront.position.set(mainCenterX, eaveY - 0.02, halfD);
    rGroup.add(fFront);

    const fRear = new THREE.Mesh(new THREE.BoxGeometry(mainW, fasciaH, fasciaThick), rafterMat);
    fRear.position.set(mainCenterX, eaveY - 0.02, -halfD);
    rGroup.add(fRear);

    const gutterMat = this.materials.bronze;
    const gFront = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, mainW, 8), gutterMat);
    gFront.rotation.z = Math.PI / 2;
    gFront.position.set(mainCenterX, eaveY - 0.1, halfD + 0.06);
    rGroup.add(gFront);

    const gRear = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, mainW, 8), gutterMat);
    gRear.rotation.z = Math.PI / 2;
    gRear.position.set(mainCenterX, eaveY - 0.1, -halfD - 0.06);
    rGroup.add(gRear);

    // Downpipe at front-west main corner
    const dpMain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, eaveY - 0.3, 8),
      gutterMat
    );
    dpMain.position.set(-12.08, (eaveY + 0.3) * 0.5, 9.08);
    rGroup.add(dpMain);

    // ---------------------------------------------------------
    // 8. 1-Story East Wing Sloped Mono-Pitch Roof (X: 4.18..12.75)
    // Clearest below upper east clerestory sills (bottomY = 4.80)
    // ---------------------------------------------------------
    const eastStartX = 4.18;
    const eastEndX = WORLD_DIMENSIONS.houseMaxX + roofOverhang; // 12.75
    const eastRun = eastEndX - eastStartX; // 8.57 m
    const eastHighY = 4.58;
    const eastLowY = 3.68;
    const eastRise = eastHighY - eastLowY; // 0.88 m
    const eastPitch = Math.atan2(eastRise, eastRun);
    const eastSlopeLen = Math.hypot(eastRun, eastRise);
    const eastCenterX = (eastStartX + eastEndX) * 0.5;
    const eastMidY = (eastHighY + eastLowY) * 0.5;
    const eastRoofD = WORLD_DIMENSIONS.houseDepth + 1.1; // 19.1 m

    const eastRoofSlab = new THREE.Mesh(
      new THREE.BoxGeometry(eastSlopeLen, 0.14, eastRoofD),
      this.materials.roofShingle
    );
    eastRoofSlab.name = 'east-wing-sloped-roof';
    eastRoofSlab.position.set(eastCenterX, eastMidY, 0);
    // Right-hand rotation around +Z: negative Z angle lowers +X toward east eave
    eastRoofSlab.rotation.z = -eastPitch;
    eastRoofSlab.castShadow = true;
    eastRoofSlab.receiveShadow = true;
    rGroup.add(eastRoofSlab);

    // East Wing cedar soffit underneath
    const eastSoffit = new THREE.Mesh(
      new THREE.BoxGeometry(eastSlopeLen - 0.1, 0.05, eastRoofD - 0.08),
      this.materials.ceilingDeck
    );
    eastSoffit.position.set(eastCenterX, eastMidY - 0.08, 0);
    eastSoffit.rotation.z = -eastPitch;
    rGroup.add(eastSoffit);

    // Triangular wedge siding cheek walls closing East Wing North (+Z) & South (-Z)
    const eastWedgeShape = new THREE.Shape();
    eastWedgeShape.moveTo(4.2, 3.7);
    eastWedgeShape.lineTo(12.0, 3.7);
    eastWedgeShape.lineTo(12.0, 3.79);
    eastWedgeShape.lineTo(4.2, 4.59);
    eastWedgeShape.closePath();

    const eastWedgeGeo = new THREE.ExtrudeGeometry(eastWedgeShape, {
      depth: 0.25,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 0,
      bevelThickness: 0,
    });
    normalizeWallExtrudeUV(eastWedgeGeo, 7.8, 3.1);
    eastWedgeGeo.translate(0, 0, -0.125);

    const eastFrontCheek = new THREE.Mesh(eastWedgeGeo, this.materials.siding);
    eastFrontCheek.position.set(0, 0, 8.875);
    eastFrontCheek.castShadow = true;
    rGroup.add(eastFrontCheek);

    const eastRearCheek = new THREE.Mesh(eastWedgeGeo, this.materials.siding);
    eastRearCheek.position.set(0, 0, -8.875);
    eastRearCheek.castShadow = true;
    rGroup.add(eastRearCheek);

    // East Wing fascia & gutter
    const fEast = new THREE.Mesh(new THREE.BoxGeometry(fasciaThick, 0.22, eastRoofD), rafterMat);
    fEast.position.set(eastEndX, eastLowY - 0.03, 0);
    rGroup.add(fEast);

    const gEast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, eastRoofD, 8), gutterMat);
    gEast.rotation.x = Math.PI / 2;
    gEast.position.set(eastEndX + 0.05, eastLowY - 0.11, 0);
    rGroup.add(gEast);

    const dpEast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, eastLowY - 0.35, 8),
      gutterMat
    );
    dpEast.position.set(12.08, (eastLowY + 0.3) * 0.5, 9.05);
    rGroup.add(dpEast);

    houseGroup.add(rGroup);
  }

  /**
   * Builds warm 2700K architectural ceiling lights across main interior rooms
   * so Sunset & Night views illuminate windows from within and keep rooms inviting.
   */
  buildInteriorLights(houseGroup) {
    const lGroup = new THREE.Group();
    lGroup.name = 'interior-architectural-lights';

    const fixtures = [
      { id: 'living-hall', x: -3.2, y: 5.85, z: 5.6, intensity: 3.2, distance: 15.0 },
      { id: 'living-front-bay', x: -3.5, y: 3.2, z: 7.4, intensity: 2.5, distance: 11.0 },
      { id: 'foyer-stair', x: 2.6, y: 3.55, z: 6.4, intensity: 2.2, distance: 10.5 },
      { id: 'kitchen-dining', x: -9.2, y: 3.55, z: 4.8, intensity: 2.2, distance: 11.5 },
      { id: 'rear-gallery', x: -1.8, y: 3.55, z: -4.2, intensity: 2.4, distance: 12.5 },
      { id: 'east-corridor', x: 6.0, y: 3.55, z: -1.5, intensity: 2.1, distance: 11.0 },
      { id: 'bedroom-1', x: 9.4, y: 3.55, z: 6.4, intensity: 2.0, distance: 9.5 },
      { id: 'bedroom-2', x: -9.3, y: 6.85, z: 2.3, intensity: 2.1, distance: 9.5 },
      { id: 'upper-gallery', x: -1.8, y: 6.85, z: -3.5, intensity: 2.4, distance: 12.5 },
    ];

    for (const fx of fixtures) {
      const fSub = new THREE.Group();
      fSub.position.set(fx.x, fx.y, fx.z);

      const trim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.16, 0.04, 16),
        this.materials.brass
      );
      fSub.add(trim);

      const diffuserMat = new THREE.MeshStandardMaterial({
        color: 0xfff0d4,
        emissive: 0xffd089,
        emissiveIntensity: 0.2,
        roughness: 0.35,
      });
      const diffuser = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.03, 16),
        diffuserMat
      );
      diffuser.position.y = -0.025;
      fSub.add(diffuser);

      const point = new THREE.PointLight(0xffe1b0, fx.intensity, fx.distance, 1.15);
      point.position.y = -0.22;
      fSub.add(point);

      this.interiorLights.push({
        light: point,
        baseIntensity: fx.intensity,
        emissiveMat: diffuserMat,
        baseEmissive: 1.1,
      });

      lGroup.add(fSub);
    }

    houseGroup.add(lGroup);
  }

  /**
   * Builds the complete house scene graph.
   */
  build(scene) {
    const houseGroup = new THREE.Group();
    houseGroup.name = 'sandalwood-residence';

    // 1. Foundation and floors
    this.buildFoundation(houseGroup);

    // 2. Front porch assembly
    this.buildPorch(houseGroup);

    // 3. Exterior walls (with asymmetrical façade)
    this.buildExteriorWalls(houseGroup);

    // 4. Interior partition walls (12 zones)
    this.buildPartitions(houseGroup);

    // 5. Windows (12 windows)
    this.buildWindows(houseGroup);

    // 6. Doors (13 doors with pivot groups)
    this.buildDoors(houseGroup);

    // 7. Central staircase (18 steps)
    this.buildStaircase(houseGroup);

    // 8. Upper gallery mezzanine & balustrades
    this.buildGalleryMezzanine(houseGroup);

    // 9. Dual cantilevered balconies
    this.buildBalconies(houseGroup);

    // 10. Timber roof structure & rafters
    this.buildRoof(houseGroup);

    // 11. Warm 2700K architectural interior lighting fixtures
    this.buildInteriorLights(houseGroup);

    // Attach metadata and helper collections to the house group
    houseGroup.userData = {
      type: 'house',
      doors: this.doorsMap,
      windows: this.windowsMap,
      colliders: this.colliders,
      exteriorLights: this.exteriorLights,
      interiorLights: this.interiorLights,
    };

    if (scene) {
      scene.add(houseGroup);
    }

    // Register all wall and floor meshes as occluders if collisionSystem provided
    if (this.options.collisionSystem) {
      houseGroup.traverse((child) => {
        if (child.isMesh && child.material && !child.material.transparent) {
          this.options.collisionSystem.registerOccluder(child);
        }
      });
    }

    return houseGroup;
  }
}

/**
 * Standard factory function matching PROJECT.md interface contract:
 * HouseMeshBuilder.buildHouse(options) -> THREE.Group
 */
export function buildHouse(options = {}) {
  const builder = new HouseMeshBuilder(options);
  const houseGroup = builder.build(options.scene);
  houseGroup.builder = builder;
  return houseGroup;
}