import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
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
  getPlasterTextures,
  getRoofShingleTextures,
  getBrushedMetalTextures,
} from '../assets/procedural/TextureGenerator.js';
import { gameStore } from '../state/gameStore.js';

/**
 * Builds a 6-face material array for BoxGeometry where ONLY the inward cardinal face
 * opposite `exteriorFace` uses `interiorMat` (lime plaster), while the outward face and
 * thickness edge caps use `exteriorMat` (siding) to eliminate bright ivory edge bleed at wall seams.
 */
function createOrientedWallMaterials(exteriorFace, exteriorMat, interiorMat) {
  const oppositeMap = { '+X': 1, '-X': 0, '+Y': 3, '-Y': 2, '+Z': 5, '-Z': 4 };
  const interiorIdx = oppositeMap[exteriorFace];
  if (interiorIdx === undefined) return interiorMat;
  return [0, 1, 2, 3, 4, 5].map((i) => (i === interiorIdx ? interiorMat : exteriorMat));
}

/**
 * Projects continuous world-space UVs onto BoxGeometry faces so adjacent wall piers,
 * sills, lintels, and floor spandrel bands align planks & plaster with zero tiling seams.
 */
function applyWorldBoxUVs(geo, cx, cy, cz, spanU = 24.0, spanV = 6.75) {
  const pos = geo.getAttribute('position');
  const norm = geo.getAttribute('normal');
  const uv = geo.getAttribute('uv');
  if (!pos || !norm || !uv) return;
  for (let i = 0; i < pos.count; i++) {
    const wx = pos.getX(i) + cx;
    const wy = pos.getY(i) + cy;
    const wz = pos.getZ(i) + cz;
    const nx = Math.abs(norm.getX(i));
    const ny = Math.abs(norm.getY(i));
    const nz = Math.abs(norm.getZ(i));
    if (nz >= nx && nz >= ny) {
      uv.setXY(i, (wx + 12.0) / spanU, (wy - 0.3) / spanV);
    } else if (nx >= ny) {
      uv.setXY(i, (wz + 9.0) / spanU, (wy - 0.3) / spanV);
    } else {
      uv.setXY(i, (wx + 12.0) / spanU, (wz + 9.0) / spanU);
    }
  }
  uv.needsUpdate = true;
}

/**
 * Generates a fluted 3D linen curtain panel with natural vertical folds.
 */
function createPleatedCurtainGeometry(width, height) {
  const geo = new THREE.PlaneGeometry(width, height, 18, 6);
  const pos = geo.getAttribute('position');
  const normY = (y) => (height * 0.5 - y) / Math.max(0.01, height);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = (x + width * 0.5) / Math.max(0.01, width);
    const drop = normY(y);
    const pleatZ = Math.sin(u * Math.PI * 7.0) * (0.018 + drop * 0.012);
    const swayX = Math.sin(drop * Math.PI) * -0.012 * Math.sign(x || 1);
    pos.setZ(i, pos.getZ(i) + pleatZ);
    pos.setX(i, x + swayX);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates an arching tapered planter frond emerging from soil without clipping pot walls.
 */
function createUrnFrondGeometry(length = 0.34, width = 0.055, rise = 0.28, reach = 0.18) {
  const geo = new THREE.PlaneGeometry(width, length, 2, 4);
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i);
    const t = Math.max(0, Math.min(1, (pos.getY(i) + length * 0.5) / length));
    const taper = Math.sin(Math.min(1, t * 0.85 + 0.12) * Math.PI) * (1 - t * 0.72);
    const upward = Math.sin(t * Math.PI * 0.65) * rise + t * 0.08;
    const forward = t * reach;
    pos.setXYZ(i, lx * taper, upward, forward);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Consolidates unnamed single-material static child meshes inside a group into merged batches
 * to cut GPU draw calls cleanly while preserving named entities and colliders.
 */
function consolidateStaticGroup(container) {
  const buckets = new Map();
  const children = [...container.children];
  for (const child of children) {
    if (!child.isMesh || child.name || Array.isArray(child.material)) continue;
    let geo = child.geometry.clone();
    if (geo.index !== null) geo = geo.toNonIndexed();
    for (const key of Object.keys(geo.attributes)) {
      if (key !== 'position' && key !== 'normal' && key !== 'uv') {
        geo.deleteAttribute(key);
      }
    }
    child.updateMatrix();
    geo.applyMatrix4(child.matrix);
    let list = buckets.get(child.material);
    if (!list) {
      list = { mat: child.material, geos: [], castShadow: false, receiveShadow: false };
      buckets.set(child.material, list);
    }
    if (child.castShadow) list.castShadow = true;
    if (child.receiveShadow) list.receiveShadow = true;
    list.geos.push(geo);
    container.remove(child);
  }
  for (const entry of buckets.values()) {
    if (!entry.geos.length) continue;
    const merged = entry.geos.length === 1 ? entry.geos[0] : mergeGeometries(entry.geos, false);
    entry.geos.forEach((g) => g.dispose());
    const mesh = new THREE.Mesh(merged, entry.mat);
    mesh.castShadow = entry.castShadow;
    mesh.receiveShadow = entry.receiveShadow;
    container.add(mesh);
  }
}

/**
 * HouseMeshBuilder: Procedural 3D Architectural Shell and Fenestration Builder
 * for Sandalwood Garden Estate.
 */
export class HouseMeshBuilder {
  constructor(options = {}) {
    this.options = options;
    this.materials = this.createMaterials();
    this.colliders = [];
    this.doorsMap = new Map();
    this.animatedDoors = [];
    this.windowsMap = new Map();
    this.interactables = [];
    this.seats = [];
    this.exteriorLights = [];
    this.interiorLights = [];
  }

  /**
   * Initializes procedural PBR materials using multi-map CanvasTextures from TextureGenerator.
   */
  createMaterials() {
    // 1. Exterior sandalwood timber siding
    const sidingTex = getTimberTextures('sandalwood', 8, 4);
    const sidingMaterial = new THREE.MeshStandardMaterial({
      map: sidingTex.map,
      normalMap: sidingTex.normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: sidingTex.roughnessMap,
      roughness: 0.78,
      metalness: 0.04,
    });

    // 2. Interior warm ivory lime-plaster walls
    const plasterTex = getPlasterTextures('#F3EBDC', 4, 3);
    const interiorWallMaterial = new THREE.MeshStandardMaterial({
      map: plasterTex.map,
      normalMap: plasterTex.normalMap,
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughnessMap: plasterTex.roughnessMap,
      roughness: 0.92,
      metalness: 0.0,
    });

    // 3. Vertical walnut/sandalwood slats for media feature walls
    const slatsTex = getTimberTextures('slats', 3, 2);
    const slatsMaterial = new THREE.MeshStandardMaterial({
      map: slatsTex.map,
      normalMap: slatsTex.normalMap,
      normalScale: new THREE.Vector2(0.95, 0.95),
      roughnessMap: slatsTex.roughnessMap,
      roughness: 0.72,
      metalness: 0.04,
    });

    // 4. Foundation plinth stone
    const plinthTex = getStoneTileTextures('foyer', 12, 1);
    const plinthMaterial = new THREE.MeshStandardMaterial({
      map: plinthTex.map,
      normalMap: plinthTex.normalMap,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughnessMap: plinthTex.roughnessMap,
      roughness: 0.85,
      metalness: 0.0,
    });

    // 5. Room flooring materials
    const foyerTex = getStoneTileTextures('foyer', 3, 3);
    const foyerFloorMat = new THREE.MeshStandardMaterial({
      map: foyerTex.map,
      normalMap: foyerTex.normalMap,
      normalScale: new THREE.Vector2(0.75, 0.75),
      roughnessMap: foyerTex.roughnessMap,
      roughness: 0.78,
    });

    const oakTex = getTimberTextures('oak', 6, 6);
    const oakFloorMat = new THREE.MeshStandardMaterial({
      map: oakTex.map,
      normalMap: oakTex.normalMap,
      normalScale: new THREE.Vector2(0.7, 0.7),
      roughnessMap: oakTex.roughnessMap,
      roughness: 0.65,
    });

    const limestoneTex = getStoneTileTextures('limestone', 4, 4);
    const kitchenFloorMat = new THREE.MeshStandardMaterial({
      map: limestoneTex.map,
      normalMap: limestoneTex.normalMap,
      normalScale: new THREE.Vector2(0.65, 0.65),
      roughnessMap: limestoneTex.roughnessMap,
      roughness: 0.76,
    });

    const walnutTex = getTimberTextures('walnut', 4, 4);
    const bedroomFloorMat = new THREE.MeshStandardMaterial({
      map: walnutTex.map,
      normalMap: walnutTex.normalMap,
      normalScale: new THREE.Vector2(0.7, 0.7),
      roughnessMap: walnutTex.roughnessMap,
      roughness: 0.66,
    });

    const bathFloorTex = getStoneTileTextures('bathFloor', 2, 2);
    const bathFloorMat = new THREE.MeshStandardMaterial({
      map: bathFloorTex.map,
      normalMap: bathFloorTex.normalMap,
      normalScale: new THREE.Vector2(0.75, 0.75),
      roughnessMap: bathFloorTex.roughnessMap,
      roughness: 0.72,
    });

    const laundryTex = getStoneTileTextures('laundry', 2, 2);
    const laundryFloorMat = new THREE.MeshStandardMaterial({
      map: laundryTex.map,
      normalMap: laundryTex.normalMap,
      normalScale: new THREE.Vector2(0.75, 0.75),
      roughnessMap: laundryTex.roughnessMap,
      roughness: 0.78,
    });

    const teakTex = getTimberTextures('teak', 4, 4);
    const balconyDeckMat = new THREE.MeshStandardMaterial({
      map: teakTex.map,
      normalMap: teakTex.normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: teakTex.roughnessMap,
      roughness: 0.72,
    });

    // 6. Architectural timber framing (posts, beams, frames, stairs, railings) with wood grain
    const trimWalnutTex = getTimberTextures('walnut', 2, 2);
    const timberDarkMat = new THREE.MeshStandardMaterial({
      map: trimWalnutTex.map,
      normalMap: trimWalnutTex.normalMap,
      normalScale: new THREE.Vector2(0.65, 0.65),
      roughnessMap: trimWalnutTex.roughnessMap,
      color: 0xdccbb9,
      roughness: 0.68,
      metalness: 0.04,
    });

    const trimHoneyTex = getTimberTextures('sandalwood', 2, 2);
    const timberHoneyMat = new THREE.MeshStandardMaterial({
      map: trimHoneyTex.map,
      normalMap: trimHoneyTex.normalMap,
      normalScale: new THREE.Vector2(0.65, 0.65),
      roughnessMap: trimHoneyTex.roughnessMap,
      color: 0xeedcc5,
      roughness: 0.62,
      metalness: 0.04,
    });

    // 7. Physical Glass materials (sky-reflective Fresnel clear & privacy frosted)
    const clearGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xeaf5f8,
      roughness: 0.05,
      metalness: 0.06,
      ior: 1.5,
      reflectivity: 0.92,
      envMapIntensity: 1.5,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const frostedGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xdcedea,
      roughness: 0.58,
      metalness: 0.04,
      reflectivity: 0.6,
      envMapIntensity: 0.9,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // 8. Brushed antique brass & bronze hardware
    const metalGrain = getBrushedMetalTextures('#C5A059', 2, 2);
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xc5a059,
      normalMap: metalGrain.normalMap,
      normalScale: new THREE.Vector2(0.4, 0.4),
      roughnessMap: metalGrain.roughnessMap,
      metalness: 0.88,
      roughness: 0.34,
      envMapIntensity: 1.35,
    });

    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0x2e2722,
      normalMap: metalGrain.normalMap,
      normalScale: new THREE.Vector2(0.4, 0.4),
      roughnessMap: metalGrain.roughnessMap,
      metalness: 0.78,
      roughness: 0.42,
      envMapIntensity: 1.15,
    });

    // 9. Layered cedar/slate roof shingles & warm ceiling plaster
    const shingleTex = getRoofShingleTextures(10, 6);
    const roofShingleMat = new THREE.MeshStandardMaterial({
      map: shingleTex.map,
      normalMap: shingleTex.normalMap,
      normalScale: new THREE.Vector2(1.05, 1.05),
      roughnessMap: shingleTex.roughnessMap,
      roughness: 0.88,
      metalness: 0.04,
    });

    const ceilPlasterTex = getPlasterTextures('#EAE0CD', 4, 4);
    const ceilingDeckMat = new THREE.MeshStandardMaterial({
      map: ceilPlasterTex.map,
      normalMap: ceilPlasterTex.normalMap,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: 0.84,
      metalness: 0.0,
    });

    // 10. Warm cream linen curtains
    const fabricTex = getFabricTextures('#EFE8DC', 2, 2);
    const curtainMat = new THREE.MeshStandardMaterial({
      map: fabricTex.map,
      normalMap: fabricTex.normalMap,
      normalScale: new THREE.Vector2(0.6, 0.6),
      roughnessMap: fabricTex.roughnessMap,
      color: 0xf2ece0,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });

    // 11. Planter terracotta & foliage accents
    const terracottaMat = new THREE.MeshStandardMaterial({
      color: 0xc26c4d,
      roughness: 0.82,
    });
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x3b6840,
      roughness: 0.72,
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
      terracotta: terracottaMat,
      foliage: foliageMat,
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

    // 2b. Continuous finished oak base floor covering corridors & thresholds so concrete plinth never peeks through
    const groundOakGeo = new THREE.PlaneGeometry(23.5, 17.5);
    groundOakGeo.rotateX(-Math.PI / 2);
    const groundOakMesh = new THREE.Mesh(groundOakGeo, this.materials.floors.oak);
    groundOakMesh.name = 'floor-base-ground';
    groundOakMesh.position.set(0, WORLD_DIMENSIONS.groundSlabTop + 0.001, 0);
    groundOakMesh.receiveShadow = true;
    fGroup.add(groundOakMesh);

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

    // Continuous exterior spandrel / slab-edge siding bands (Y = 3.70..3.95) with plaster inside
    const rimBands = [
      { pos: [-3.9, 3.825, 8.875], size: [16.2, 0.25, 0.25], extFace: '+Z' },
      { pos: [-3.9, 3.825, -8.875], size: [16.2, 0.25, 0.25], extFace: '-Z' },
      { pos: [-11.875, 3.825, 0], size: [0.25, 0.25, 17.5], extFace: '-X' },
      { pos: [4.075, 3.895, 0], size: [0.25, 0.11, 17.5], extFace: '+X' },
    ];
    for (const band of rimBands) {
      const mat = createOrientedWallMaterials(
        band.extFace,
        this.materials.siding,
        this.materials.interiorWall
      );
      const bandGeo = new THREE.BoxGeometry(band.size[0], band.size[1], band.size[2]);
      applyWorldBoxUVs(bandGeo, band.pos[0], band.pos[1], band.pos[2]);
      const rimMesh = new THREE.Mesh(bandGeo, mat);
      rimMesh.position.set(band.pos[0], band.pos[1], band.pos[2]);
      rimMesh.castShadow = true;
      rimMesh.receiveShadow = true;
      fGroup.add(rimMesh);
    }

    // Exterior horizontal architectural belly-band timber trim separating storeys
    const bellyTrims = [
      [-3.9, 3.74, 9.01, 16.3, 0.08, 0.05],
      [-3.9, 3.74, -9.01, 16.3, 0.08, 0.05],
      [-12.01, 3.74, 0, 0.05, 0.08, 18.06],
    ];
    for (const [bx, by, bz, bw, bh, bd] of bellyTrims) {
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), this.materials.timberDark);
      bMesh.position.set(bx, by, bz);
      bMesh.castShadow = true;
      fGroup.add(bMesh);
    }

    // Interior mezzanine walnut spandrel band across open double-height front atrium (hides Y=3.70/3.95 joints)
    const atriumSpandrel = new THREE.Mesh(
      new THREE.BoxGeometry(10.55, 0.3, 0.024),
      this.materials.timberDark
    );
    atriumSpandrel.position.set(-1.325, 3.825, 8.742);
    atriumSpandrel.receiveShadow = true;
    fGroup.add(atriumSpandrel);

    // Single-story East Wing insulated ceiling slab extending continuously inside East Wing walls (X = 3.95..11.75)
    const eastWingCeiling = new THREE.Mesh(
      new THREE.BoxGeometry(7.8, 0.14, 17.5),
      this.materials.ceilingDeck
    );
    eastWingCeiling.name = 'east-wing-ceiling-slab';
    eastWingCeiling.position.set(7.85, 3.77, 0);
    eastWingCeiling.castShadow = true;
    eastWingCeiling.receiveShadow = true;
    fGroup.add(eastWingCeiling);

    // 5. Upper floor continuous oak base under unfloored West-wing / North strips + per-room finishes
    const upperBaseSpecs = [
      { name: 'floor-base-upper-west', x: -9.175, z: 0.0, w: 5.15, d: 17.5 },
      { name: 'floor-base-upper-gallery', x: -1.325, z: -3.525, w: 10.55, d: 10.45 },
    ];
    for (const ub of upperBaseSpecs) {
      const ubGeo = new THREE.PlaneGeometry(ub.w, ub.d);
      ubGeo.rotateX(-Math.PI / 2);
      const ubMesh = new THREE.Mesh(ubGeo, this.materials.floors.oak);
      ubMesh.name = ub.name;
      ubMesh.position.set(ub.x, WORLD_DIMENSIONS.upperFloorY + 0.001, ub.z);
      ubMesh.receiveShadow = true;
      fGroup.add(ubMesh);
    }

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

    // 2. Sandstone entry steps with bullnose overhanging stone treads (Z = 12.0 to 12.8 m)
    const step1 = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.1, 0.42),
      this.materials.floors.foyer
    );
    step1.position.set(3.5, 0.2, 12.2);
    step1.receiveShadow = true;
    pGroup.add(step1);

    const step1Cap = new THREE.Mesh(new THREE.BoxGeometry(3.66, 0.03, 0.45), this.materials.plinth);
    step1Cap.position.set(3.5, 0.255, 12.21);
    step1Cap.castShadow = true;
    pGroup.add(step1Cap);

    const step2 = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.1, 0.42),
      this.materials.floors.foyer
    );
    step2.position.set(3.5, 0.1, 12.6);
    step2.receiveShadow = true;
    pGroup.add(step2);

    const step2Cap = new THREE.Mesh(new THREE.BoxGeometry(3.66, 0.03, 0.45), this.materials.plinth);
    step2Cap.position.set(3.5, 0.155, 12.61);
    step2Cap.castShadow = true;
    pGroup.add(step2Cap);

    // 3. Structural sandalwood timber columns on stone bases with capitals & angled knee braces
    const colGeo = new THREE.BoxGeometry(0.22, 2.86, 0.22);
    const basePlinthGeo = new THREE.BoxGeometry(0.34, 0.24, 0.34);
    const capGeo = new THREE.BoxGeometry(0.32, 0.08, 0.32);
    const braceGeo = new THREE.BoxGeometry(0.1, 0.58, 0.12);

    for (const cx of [1.0, 6.0]) {
      const pBase = new THREE.Mesh(basePlinthGeo, this.materials.plinth);
      pBase.position.set(cx, 0.3 + 0.12, 11.8);
      pBase.castShadow = true;
      pBase.receiveShadow = true;
      pGroup.add(pBase);

      const col = new THREE.Mesh(colGeo, this.materials.timberHoney);
      col.position.set(cx, 0.3 + 0.24 + 1.43, 11.8);
      col.castShadow = true;
      col.receiveShadow = true;
      pGroup.add(col);

      const colCap = new THREE.Mesh(capGeo, this.materials.timberDark);
      colCap.position.set(cx, 3.28, 11.8);
      colCap.castShadow = true;
      pGroup.add(colCap);

      // Inward diagonal timber knee brace into front lintel beam
      const brace = new THREE.Mesh(braceGeo, this.materials.timberDark);
      const signX = cx < 3.5 ? 1 : -1;
      brace.position.set(cx + signX * 0.22, 3.12, 11.8);
      brace.rotation.z = signX * (Math.PI / 4);
      brace.castShadow = true;
      pGroup.add(brace);
    }

    // 4. Porch roof beam, decorative fascia & slatted cedar ceiling ribs
    const beamGeo = new THREE.BoxGeometry(pw + 0.4, 0.24, 0.28);
    const beamMesh = new THREE.Mesh(beamGeo, this.materials.timberDark);
    beamMesh.position.set(px, 3.4, 11.8);
    beamMesh.castShadow = true;
    pGroup.add(beamMesh);

    const porchCeilingGeo = new THREE.BoxGeometry(pw + 0.4, 0.1, pd + 0.4);
    const porchCeilingMesh = new THREE.Mesh(porchCeilingGeo, this.materials.ceilingDeck);
    porchCeilingMesh.position.set(px, 3.48, pz + 0.1);
    pGroup.add(porchCeilingMesh);

    const slatGeo = new THREE.BoxGeometry(pw + 0.2, 0.035, 0.06);
    for (let s = 0; s < 9; s++) {
      const sz = 9.2 + s * 0.32;
      const slat = new THREE.Mesh(slatGeo, this.materials.timberHoney);
      slat.position.set(px, 3.41, sz);
      pGroup.add(slat);
    }

    // 5. Slatted timber porch bench (1.6 m wide) with backrest & armrests on west side
    const benchGroup = new THREE.Group();
    benchGroup.name = 'porch-bench';

    for (let s = 0; s < 4; s++) {
      const sMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.032, 1.56), this.materials.timberHoney);
      sMesh.position.set(0.98 + s * 0.115, 0.3 + 0.44, 10.4);
      sMesh.castShadow = true;
      benchGroup.add(sMesh);
    }
    for (let b = 0; b < 3; b++) {
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.09, 1.56), this.materials.timberHoney);
      bMesh.position.set(0.94, 0.3 + 0.56 + b * 0.115, 10.4);
      bMesh.rotation.z = 0.08;
      bMesh.castShadow = true;
      benchGroup.add(bMesh);
    }
    for (const lz of [9.68, 11.12]) {
      const legF = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.44, 0.06), this.materials.timberDark);
      legF.position.set(1.36, 0.3 + 0.22, lz);
      legF.castShadow = true;
      benchGroup.add(legF);

      const legB = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.88, 0.06), this.materials.timberDark);
      legB.position.set(0.94, 0.3 + 0.44, lz);
      legB.castShadow = true;
      benchGroup.add(legB);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.07), this.materials.timberHoney);
      arm.position.set(1.15, 0.3 + 0.62, lz);
      arm.castShadow = true;
      benchGroup.add(arm);
    }
    pGroup.add(benchGroup);

    this.seats.push({
      id: 'porch-bench',
      label: 'Front Porch Bench',
      x: 1.28,
      y: 0.75,
      z: 10.4,
      yaw: -Math.PI / 2,
    });

    // 6. Two exterior bronze carriage wall sconces flanking entrance
    const sconcePositions = [2.4, 4.6];
    for (const sx of sconcePositions) {
      const sconceGroup = new THREE.Group();
      sconceGroup.position.set(sx, 2.1, 9.02);

      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.2, 0.06), this.materials.bronze);
      sconceGroup.add(bracket);

      const hood = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.06, 6), this.materials.bronze);
      hood.position.set(0, 0.11, 0.08);
      sconceGroup.add(hood);

      const lanternMat = new THREE.MeshStandardMaterial({
        color: 0xffd199,
        emissive: 0xff8c3b,
        emissiveIntensity: 0.65,
        roughness: 0.35,
      });
      const lantern = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.045, 0.16, 8),
        lanternMat
      );
      lantern.position.set(0, 0, 0.08);
      sconceGroup.add(lantern);

      const sconceLight = new THREE.PointLight(0xffa858, 1.1, 6.5, 1.8);
      sconceLight.position.set(0, 0, 0.2);
      sconceGroup.add(sconceLight);

      this.exteriorLights.push({
        light: sconceLight,
        baseIntensity: 1.1,
        emissiveMat: lanternMat,
        baseEmissive: 1.15,
      });

      pGroup.add(sconceGroup);
    }

    // 7. Sculpted terracotta/stone porch urn planters with multi-leaf ornamental foliage
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x322419, roughness: 0.95 });
    const urnFrondGeo = createUrnFrondGeometry(0.34, 0.056, 0.28, 0.18);
    for (const [pxPos, pzPos] of [[0.9, 11.48], [6.1, 11.48]]) {
      const planterG = new THREE.Group();
      planterG.position.set(pxPos, 0.3, pzPos);

      const potBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.17, 0.44, 14),
        this.materials.terracotta
      );
      potBody.position.y = 0.22;
      potBody.castShadow = true;
      potBody.receiveShadow = true;
      planterG.add(potBody);

      const potRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.24, 0.028, 8, 16),
        this.materials.terracotta
      );
      potRim.rotation.x = Math.PI / 2;
      potRim.position.y = 0.44;
      planterG.add(potRim);

      const soil = new THREE.Mesh(new THREE.CircleGeometry(0.21, 12), soilMat);
      soil.rotation.x = -Math.PI / 2;
      soil.position.y = 0.43;
      planterG.add(soil);

      for (let f = 0; f < 10; f++) {
        const ang = (f / 10) * Math.PI * 2;
        const leaf = new THREE.Mesh(urnFrondGeo, this.materials.foliage);
        leaf.position.set(Math.cos(ang) * 0.055, 0.44, Math.sin(ang) * 0.055);
        leaf.rotation.y = Math.PI / 2 - ang;
        leaf.rotation.x = -(f % 2) * 0.12;
        leaf.castShadow = true;
        planterG.add(leaf);
      }

      consolidateStaticGroup(planterG);
      pGroup.add(planterG);
    }

    houseGroup.add(pGroup);
  }

  /**
   * Helper to construct a wall with rectangular apertures (windows or doors).
   * Generates solid rectangular blocks around the openings to ensure genuine physical voids.
   * When `exteriorFace` is provided, only that outward cardinal face uses exterior siding while
   * reveals and inner faces render in interior lime-plaster.
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
    exteriorFace = null,
    name = 'wall',
  }) {
    const wallGroup = new THREE.Group();
    wallGroup.name = name;

    const wallMat =
      exteriorFace && !Array.isArray(material)
        ? createOrientedWallMaterials(exteriorFace, material, this.materials.interiorWall)
        : material;

    const spanLength = spanEnd - spanStart;
    if (spanLength <= 0.001 || topY <= baseY + 0.001) return wallGroup;

    // Sort openings by span position
    const sorted = [...openings].sort((a, b) => a.pos - b.pos);

    // 1. Register exact physical colliders for solid piers, sills, and lintels
    let curPos = spanStart;
    for (const op of sorted) {
      const opStart = op.pos - op.width * 0.5;
      const opEnd = op.pos + op.width * 0.5;
      const opBottom = op.bottomY;
      const opTop = op.bottomY + op.height;

      if (opStart > curPos + 0.005) {
        const segLen = opStart - curPos;
        const segCenter = curPos + segLen * 0.5;
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

      if (opBottom > baseY + 0.005) {
        const sillLen = op.width;
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

      if (topY > opTop + 0.005) {
        const lintelLen = op.width;
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

      curPos = Math.max(curPos, opEnd);
    }

    if (spanEnd > curPos + 0.005) {
      const segLen = spanEnd - curPos;
      const segCenter = curPos + segLen * 0.5;
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

    // 2. Construct a single continuous ExtrudeGeometry punched wall slab (eliminates T-junction seams)
    const shape = new THREE.Shape();
    shape.moveTo(spanStart, baseY);
    const windowHoles = [];
    let notchCursor = spanStart;

    for (const op of sorted) {
      const oS = Math.max(notchCursor + 0.002, Math.max(spanStart + 0.002, op.pos - op.width * 0.5));
      const oE = Math.min(spanEnd - 0.002, op.pos + op.width * 0.5);
      const oB = Math.max(baseY, op.bottomY);
      const oT = Math.min(topY - 0.002, op.bottomY + op.height);
      if (oE <= oS + 0.004 || oT <= oB + 0.004) continue;

      if (oB <= baseY + 0.008) {
        shape.lineTo(oS, baseY);
        shape.lineTo(oS, oT);
        shape.lineTo(oE, oT);
        shape.lineTo(oE, baseY);
        notchCursor = oE;
      } else {
        windowHoles.push({ oS, oE, oB, oT });
      }
    }

    shape.lineTo(spanEnd, baseY);
    shape.lineTo(spanEnd, topY);
    shape.lineTo(spanStart, topY);
    shape.closePath();

    for (const h of windowHoles) {
      const hole = new THREE.Path();
      hole.moveTo(h.oS, h.oB);
      hole.lineTo(h.oS, h.oT);
      hole.lineTo(h.oE, h.oT);
      hole.lineTo(h.oE, h.oB);
      hole.closePath();
      shape.holes.push(hole);
    }

    // Workaround for Three r0.175 ExtrudeGeometry bug where bevelEnabled:false skips cap triangulation
    const extruded = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 0,
      bevelThickness: 0,
      steps: 1,
      curveSegments: 1,
    });
    extruded.translate(0, 0, -thickness * 0.5);
    if (!isAlongX) {
      extruded.rotateY(-Math.PI / 2);
      extruded.translate(fixedCoord, 0, 0);
    } else {
      extruded.translate(0, 0, fixedCoord);
    }

    const wallGeo = extruded.index !== null ? extruded.toNonIndexed() : extruded;
    if (extruded !== wallGeo) extruded.dispose();
    applyWorldBoxUVs(wallGeo, 0, 0, 0, exteriorFace ? 24.0 : 12.0, exteriorFace ? 6.75 : 4.5);

    const posAttr = wallGeo.getAttribute('position');
    const uvAttr = wallGeo.getAttribute('uv');
    const triCount = Math.floor(posAttr.count / 3);

    const v0 = new THREE.Vector3();
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const e1 = new THREE.Vector3();
    const e2 = new THREE.Vector3();
    const cross = new THREE.Vector3();

    const isInwardNormal = (nx, ny, nz) => {
      if (exteriorFace === '+Z') return nz < -0.5;
      if (exteriorFace === '-Z') return nz > 0.5;
      if (exteriorFace === '+X') return nx < -0.5;
      if (exteriorFace === '-X') return nx > 0.5;
      return false;
    };

    const outIndices = [];
    const inIndices = [];

    for (let t = 0; t < triCount; t++) {
      const i0 = t * 3;
      v0.fromBufferAttribute(posAttr, i0);
      v1.fromBufferAttribute(posAttr, i0 + 1);
      v2.fromBufferAttribute(posAttr, i0 + 2);
      e1.subVectors(v1, v0);
      e2.subVectors(v2, v0);
      cross.crossVectors(e1, e2);
      // Drop zero-area degenerate triangles emitted by zero-size bevel rings
      if (cross.lengthSq() <= 1e-12) continue;
      cross.normalize();

      if (exteriorFace && !Array.isArray(material) && isInwardNormal(cross.x, cross.y, cross.z)) {
        inIndices.push(i0, i0 + 1, i0 + 2);
      } else {
        outIndices.push(i0, i0 + 1, i0 + 2);
      }
    }

    const ordered = exteriorFace && !Array.isArray(material) ? [...outIndices, ...inIndices] : outIndices;
    const newPos = new Float32Array(ordered.length * 3);
    const newUv = new Float32Array(ordered.length * 2);

    for (let k = 0; k < ordered.length; k++) {
      const src = ordered[k];
      newPos[k * 3] = posAttr.getX(src);
      newPos[k * 3 + 1] = posAttr.getY(src);
      newPos[k * 3 + 2] = posAttr.getZ(src);
      newUv[k * 2] = uvAttr.getX(src);
      newUv[k * 2 + 1] = uvAttr.getY(src);
    }

    wallGeo.setAttribute('position', new THREE.BufferAttribute(newPos, 3));
    wallGeo.setAttribute('uv', new THREE.BufferAttribute(newUv, 2));
    wallGeo.computeVertexNormals();
    wallGeo.clearGroups();

    if (exteriorFace && !Array.isArray(material)) {
      wallGeo.addGroup(0, outIndices.length, 0);
      wallGeo.addGroup(outIndices.length, inIndices.length, 1);

      const wallMesh = new THREE.Mesh(wallGeo, [material, this.materials.interiorWall]);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      wallGroup.add(wallMesh);
    } else {
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      wallGroup.add(wallMesh);
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
      exteriorFace: '+Z',
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
      exteriorFace: '+Z',
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
      exteriorFace: '-Z',
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
      exteriorFace: '-Z',
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
      spanStart: -8.75,
      spanEnd: 8.75,
      baseY: gBase,
      topY: gTop,
      thickness: t,
      openings: westGroundOpenings,
      material: this.materials.siding,
      exteriorFace: '-X',
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
      spanStart: -8.75,
      spanEnd: 8.75,
      baseY: uBase,
      topY: uTop,
      thickness: t,
      openings: westUpperOpenings,
      material: this.materials.siding,
      exteriorFace: '-X',
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
      spanStart: -8.75,
      spanEnd: 8.75,
      baseY: gBase,
      topY: gTop,
      thickness: t,
      openings: eastGroundOpenings,
      material: this.materials.siding,
      exteriorFace: '+X',
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
      spanStart: -8.75,
      spanEnd: 8.75,
      baseY: uBase,
      topY: uTop,
      thickness: t,
      openings: eastUpperOpenings,
      material: this.materials.siding,
      exteriorFace: '+X',
      name: 'wall-east-upper-clerestory',
    });
    extGroup.add(eastUpperWall);

    // ---------------------------------------------------------
    // 6. ARCHITECTURAL STRUCTURAL CORNER & BAY TIMBER PILASTERS
    // Creates handcrafted timber-frame depth on exterior corners without narrowing rooms.
    // ---------------------------------------------------------
    const fullH = uTop - gBase;
    const fullCenterY = gBase + fullH * 0.5;
    const eastWingH = gTop - gBase;
    const eastWingCenterY = gBase + eastWingH * 0.5;

    const pilasters = [
      [-11.96, fullCenterY, 8.96, 0.22, fullH, 0.22],
      [-11.96, fullCenterY, -8.96, 0.22, fullH, 0.22],
      [4.16, fullCenterY, 8.96, 0.22, fullH, 0.22],
      [4.16, fullCenterY, -8.96, 0.22, fullH, 0.22],
      [11.96, eastWingCenterY, 8.96, 0.22, eastWingH, 0.22],
      [11.96, eastWingCenterY, -8.96, 0.22, eastWingH, 0.22],
      // Intermediate bay express columns proud by 3cm outside exterior face
      [-7.0, fullCenterY, 9.02, 0.16, fullH, 0.06],
      [-0.4, fullCenterY, 9.02, 0.16, fullH, 0.06],
      [7.48, eastWingCenterY, 9.02, 0.16, eastWingH, 0.06],
      [-7.5, fullCenterY, -9.02, 0.16, fullH, 0.06],
      [-12.02, fullCenterY, 0.0, 0.06, fullH, 0.16],
      [12.02, eastWingCenterY, 0.0, 0.06, eastWingH, 0.16],
    ];
    for (const [px, py, pz, pw, ph, pd] of pilasters) {
      const pilMesh = new THREE.Mesh(
        new THREE.BoxGeometry(pw, ph, pd),
        this.materials.timberDark
      );
      pilMesh.position.set(px, py, pz);
      pilMesh.castShadow = true;
      pilMesh.receiveShadow = true;
      extGroup.add(pilMesh);
    }

    houseGroup.add(extGroup);
  }

  /**
   * Builds the interior partition walls defining all 12 zones across both floors,
   * including walnut perimeter skirting baseboards and the Living Hall TV media feature wall.
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

      const isAlongX = part.axis === 'z';
      const fixedCoord = isAlongX ? part.z : part.x;
      const spanStart = isAlongX ? part.minX : part.minZ;
      const spanEnd = isAlongX ? part.maxX : part.maxZ;

      const wallMesh = this.createWallWithApertures({
        isAlongX,
        fixedCoord,
        spanStart,
        spanEnd,
        baseY: part.baseY,
        topY: part.baseY + part.height,
        thickness: part.thickness,
        openings,
        material: this.materials.interiorWall,
        name: part.id,
      });

      partGroup.add(wallMesh);

      // Architectural dark walnut skirting baseboards along solid non-door partition intervals
      const sortedOps = [...openings].sort((a, b) => a.pos - b.pos);
      let curPos = spanStart;
      // 1mm X-vs-Z height offset prevents coplanar top-face Z-fighting at right-angle corners
      const baseH = isAlongX ? 0.11 : 0.109;
      const baseY = part.baseY + baseH * 0.5;
      const skirtThick = part.thickness + 0.022;
      const halfT = part.thickness * 0.5;

      const skirtExtent = (coord, dir) => {
        if (isAlongX) {
          if (coord <= -11.7 + 0.01) return 0;
          const eastInner = part.floor === 1 ? 3.9 : 11.7;
          if (coord >= eastInner) return 0;
        } else if (coord <= -8.7 + 0.01 || coord >= 8.7) {
          return 0;
        }

        const otherAxis = isAlongX ? 'x' : 'z';
        const abutted = PARTITIONS.find((o) => {
          if (o.id === part.id || o.floor !== part.floor || o.axis !== otherAxis) return false;
          const oFixed = isAlongX ? o.x : o.z;
          const oStart = isAlongX ? o.minZ : o.minX;
          const oEnd = isAlongX ? o.maxZ : o.maxX;
          return (
            Math.abs(oFixed - coord) <= halfT + o.thickness * 0.5 + 0.02 &&
            fixedCoord >= oStart - halfT - 0.05 &&
            fixedCoord <= oEnd + halfT + 0.05
          );
        });

        if (!abutted) return 0.011;
        const oFixed = isAlongX ? abutted.x : abutted.z;
        const oStart = isAlongX ? abutted.minZ : abutted.minX;
        const oEnd = isAlongX ? abutted.maxZ : abutted.maxX;
        const oHalf = abutted.thickness * 0.5;
        const cornerMargin = halfT + 0.09;
        const isLCorner = fixedCoord <= oStart + cornerMargin || fixedCoord >= oEnd - cornerMargin;
        if (!isLCorner) return 0;
        return Math.max(0, dir * (oFixed + dir * (oHalf + 0.011) - coord));
      };

      const startExt = skirtExtent(spanStart, -1);
      const endExt = skirtExtent(spanEnd, 1);

      const addSkirtingSpan = (s0, s1, ext0 = 0, ext1 = 0) => {
        const adj0 = s0 - ext0;
        const adj1 = s1 + ext1;
        const len = adj1 - adj0;
        if (len <= 0.04) return;
        const center = (adj0 + adj1) * 0.5;
        const geo = isAlongX
          ? new THREE.BoxGeometry(len, baseH, skirtThick)
          : new THREE.BoxGeometry(skirtThick, baseH, len);
        const m = new THREE.Mesh(geo, this.materials.timberDark);
        if (isAlongX) m.position.set(center, baseY, fixedCoord);
        else m.position.set(fixedCoord, baseY, center);
        m.receiveShadow = true;
        partGroup.add(m);
      };

      for (const op of sortedOps) {
        const opStart = op.pos - op.width * 0.5;
        addSkirtingSpan(curPos, opStart, curPos === spanStart ? startExt : 0, 0);
        curPos = op.pos + op.width * 0.5;
      }
      addSkirtingSpan(curPos, spanEnd, sortedOps.length === 0 ? startExt : 0, endExt);
    }

    // Freestanding Living Hall TV Media Feature Wall (X = -3.0, Z = 2.80)
    // Leaves >= 1.9 m clear passage on both East and West sides and sits behind the console at Z = 3.15
    const mediaGroup = new THREE.Group();
    mediaGroup.name = 'living-tv-media-feature-wall';

    const mwW = 3.0;
    const mwH = 3.3;
    const mwCoreD = 0.14;
    const mwY = 0.3 + mwH * 0.5;

    const mediaCore = new THREE.Mesh(
      new THREE.BoxGeometry(mwW, mwH, mwCoreD),
      this.materials.interiorWall
    );
    mediaCore.position.set(-3.0, mwY, 2.8);
    mediaCore.castShadow = true;
    mediaCore.receiveShadow = true;
    mediaGroup.add(mediaCore);

    // Central honed stone backdrop behind 75" TV (+Z face)
    const stoneBack = new THREE.Mesh(
      new THREE.BoxGeometry(1.76, mwH - 0.12, 0.04),
      this.materials.plinth
    );
    stoneBack.position.set(-3.0, mwY, 2.89);
    stoneBack.castShadow = true;
    stoneBack.receiveShadow = true;
    mediaGroup.add(stoneBack);

    // Vertical fluted timber slat wings flanking the stone centrepiece
    for (const side of [-1, 1]) {
      const slatFront = new THREE.Mesh(
        new THREE.BoxGeometry(0.58, mwH - 0.12, 0.035),
        this.materials.slats
      );
      slatFront.position.set(-3.0 + side * 1.19, mwY, 2.888);
      slatFront.castShadow = true;
      mediaGroup.add(slatFront);

      const brassInlay = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, mwH - 0.12, 0.044),
        this.materials.brass
      );
      brassInlay.position.set(-3.0 + side * 0.89, mwY, 2.892);
      mediaGroup.add(brassInlay);
    }

    // Rear gallery face of media wall clad in warm vertical sandalwood slats
    const rearSlats = new THREE.Mesh(
      new THREE.BoxGeometry(mwW - 0.08, mwH - 0.12, 0.03),
      this.materials.slats
    );
    rearSlats.position.set(-3.0, mwY, 2.715);
    rearSlats.castShadow = true;
    mediaGroup.add(rearSlats);

    // Baseboard & crown cap on feature pier
    const mwPlinth = new THREE.Mesh(
      new THREE.BoxGeometry(mwW + 0.04, 0.11, mwCoreD + 0.08),
      this.materials.timberDark
    );
    mwPlinth.position.set(-3.0, 0.3 + 0.055, 2.8);
    mediaGroup.add(mwPlinth);

    const mwCap = new THREE.Mesh(
      new THREE.BoxGeometry(mwW + 0.04, 0.07, mwCoreD + 0.08),
      this.materials.timberDark
    );
    mwCap.position.set(-3.0, 0.3 + mwH + 0.035, 2.8);
    mediaGroup.add(mwCap);

    partGroup.add(mediaGroup);

    this.addColliderBox(-4.5, 0.3, 2.7, -1.5, 3.65, 2.91, 'feature-wall-living-tv');

    houseGroup.add(partGroup);
  }

  /**
   * Builds the exact budget of 12 double-hung/casement windows with timber frames,
   * exterior/interior sills, outer casing trim, glass, louvered shutters, and pleated curtains.
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
      const frameD = 0.12;
      const frameW = 0.07;
      // Three.js +Z rotates outward on front (0) & rear (PI), inward on west (+PI/2) & east (-PI/2)
      const extDir = win.wall === 'west' || win.wall === 'east' ? -1 : 1;
      const intDir = -extDir;

      // 1. Timber outer frame + interior casing surround
      const frameMat = this.materials.timberDark;
      const casingMat = this.materials.timberHoney;

      const topRail = new THREE.Mesh(new THREE.BoxGeometry(w, frameW, frameD), frameMat);
      topRail.position.set(0, h * 0.5 - frameW * 0.5, 0);
      wSub.add(topRail);

      const bottomRail = new THREE.Mesh(new THREE.BoxGeometry(w, frameW, frameD), frameMat);
      bottomRail.position.set(0, -h * 0.5 + frameW * 0.5, 0);
      wSub.add(bottomRail);

      const sideH = h - frameW * 2;
      const leftStile = new THREE.Mesh(new THREE.BoxGeometry(frameW, sideH, frameD), frameMat);
      leftStile.position.set(-w * 0.5 + frameW * 0.5, 0, 0);
      wSub.add(leftStile);

      const rightStile = new THREE.Mesh(new THREE.BoxGeometry(frameW, sideH, frameD), frameMat);
      rightStile.position.set(w * 0.5 - frameW * 0.5, 0, 0);
      wSub.add(rightStile);

      // Exterior proud architrave trim & lintel drip cap
      const extHeader = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.16, 0.07, 0.045),
        casingMat
      );
      extHeader.position.set(0, h * 0.5 + 0.025, extDir * 0.13);
      extHeader.castShadow = true;
      wSub.add(extHeader);

      // 2. Projecting exterior timber sill + interior timber stool & apron
      const extSill = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.18, 0.05, 0.16),
        casingMat
      );
      extSill.position.set(0, -h * 0.5 - 0.02, extDir * 0.1);
      extSill.castShadow = true;
      wSub.add(extSill);

      const intStool = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.16, 0.036, 0.12),
        casingMat
      );
      intStool.position.set(0, -h * 0.5 - 0.012, intDir * 0.09);
      wSub.add(intStool);

      // 3. Vertical mullion & horizontal double-hung meeting rail (on taller windows)
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.035, sideH, 0.04), frameMat);
      mullion.position.set(0, 0, 0);
      wSub.add(mullion);

      if (h >= 1.4) {
        const meetingRail = new THREE.Mesh(
          new THREE.BoxGeometry(w - frameW * 2, 0.03, 0.035),
          frameMat
        );
        meetingRail.position.set(0, 0.08, 0);
        wSub.add(meetingRail);
      }

      // 4. Double-sided Fresnel glass pane
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

      // 5. Louvered timber shutters on win-front-left mounted proud of outer siding
      if (win.shutters) {
        const shutterW = 0.52;
        const shutterH = h + 0.04;
        const slatCount = 13;
        const slatStep = (shutterH - 0.12) / slatCount;

        for (const side of [-1, 1]) {
          const sGroup = new THREE.Group();
          sGroup.position.set(side * (w * 0.5 + shutterW * 0.5 + 0.06), 0, extDir * 0.155);

          const stL = new THREE.Mesh(new THREE.BoxGeometry(0.055, shutterH, 0.04), frameMat);
          stL.position.x = -shutterW * 0.5 + 0.028;
          stL.castShadow = true;
          sGroup.add(stL);

          const stR = new THREE.Mesh(new THREE.BoxGeometry(0.055, shutterH, 0.04), frameMat);
          stR.position.x = shutterW * 0.5 - 0.028;
          stR.castShadow = true;
          sGroup.add(stR);

          const topR = new THREE.Mesh(new THREE.BoxGeometry(shutterW, 0.06, 0.04), frameMat);
          topR.position.y = shutterH * 0.5 - 0.03;
          sGroup.add(topR);

          const midR = new THREE.Mesh(new THREE.BoxGeometry(shutterW, 0.05, 0.04), frameMat);
          sGroup.add(midR);

          const botR = new THREE.Mesh(new THREE.BoxGeometry(shutterW, 0.06, 0.04), frameMat);
          botR.position.y = -shutterH * 0.5 + 0.03;
          sGroup.add(botR);

          const louverGeo = new THREE.BoxGeometry(shutterW - 0.1, 0.018, 0.032);
          for (let l = 0; l < slatCount; l++) {
            const ly = -shutterH * 0.5 + 0.08 + l * slatStep;
            if (Math.abs(ly) < 0.03) continue;
            const louver = new THREE.Mesh(louverGeo, casingMat);
            louver.position.set(0, ly, extDir * 0.004);
            louver.rotation.x = extDir * 0.45;
            louver.castShadow = true;
            sGroup.add(louver);
          }

          wSub.add(sGroup);
        }
      }

      // 6. Sculpted pleated cream linen curtains inside the room behind brass rod & finials
      if (win.curtains) {
        const curtainW = w * 0.25;
        const curtainH = h * 0.96;
        const curtainGeo = createPleatedCurtainGeometry(curtainW, curtainH);
        const curZ = intDir * 0.135;

        const cLeft = new THREE.Mesh(curtainGeo, this.materials.curtains);
        cLeft.position.set(-w * 0.37, -0.01, curZ);
        cLeft.castShadow = true;
        wSub.add(cLeft);

        const cRight = new THREE.Mesh(curtainGeo, this.materials.curtains);
        cRight.position.set(w * 0.37, -0.01, curZ);
        cRight.castShadow = true;
        wSub.add(cRight);

        const rodMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.013, 0.013, w + 0.28, 10),
          this.materials.brass
        );
        rodMesh.rotation.z = Math.PI / 2;
        rodMesh.position.set(0, h * 0.5 + 0.05, curZ);
        wSub.add(rodMesh);

        for (const fx of [-(w * 0.5 + 0.15), w * 0.5 + 0.15]) {
          const finial = new THREE.Mesh(
            new THREE.SphereGeometry(0.024, 8, 8),
            this.materials.brass
          );
          finial.position.set(fx, h * 0.5 + 0.05, curZ);
          wSub.add(finial);
        }
      }

      this.windowsMap.set(win.id, wSub);
      winGroup.add(wSub);
    }

    houseGroup.add(winGroup);
  }

  /**
   * Builds the exact budget of 13 interactive doors with pivot groups, stile-and-rail panels,
   * brass escutcheons/levers, hinge barrels, dynamic colliders, and smooth animated interaction.
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
      const frameD = 0.14;
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

      // Low brass/bronze threshold sill
      const thresh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.025, frameD), this.materials.brass);
      thresh.position.set(0, 0.0125, 0);
      dSub.add(thresh);

      // 2. Door Pivot Group
      const pivot = new THREE.Group();
      pivot.name = `pivot-${d.id}`;

      let doorSlab;
      const isSliding = Boolean(d.isSliding);

      if (isSliding) {
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

        addFramedGlassPanel(dSub, w * 0.25, -0.025);

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
        const hingeOnRight = d.hingeSide === 'right';
        const hingeX = hingeOnRight ? w * 0.5 : -w * 0.5;
        pivot.position.set(hingeX, 0, 0);

        doorSlab = new THREE.Group();
        const centerOffsetX = hingeOnRight ? -w * 0.5 : w * 0.5;

        if (d.isGlassDoor) {
          // Framed French Balcony Glass Door
          const railW = 0.085;
          const pane = new THREE.Mesh(
            new THREE.PlaneGeometry(w - railW * 2, h - 0.28),
            this.materials.clearGlass
          );
          pane.position.set(centerOffsetX, h * 0.5 + 0.06, 0);
          doorSlab.add(pane);

          const botKick = new THREE.Mesh(
            new THREE.BoxGeometry(w, 0.22, thick),
            this.materials.bronze
          );
          botKick.position.set(centerOffsetX, 0.11, 0);
          botKick.castShadow = true;
          doorSlab.add(botKick);

          const topRail = new THREE.Mesh(
            new THREE.BoxGeometry(w, railW, thick),
            this.materials.bronze
          );
          topRail.position.set(centerOffsetX, h - railW * 0.5, 0);
          doorSlab.add(topRail);

          for (const sx of [-w * 0.5 + railW * 0.5, w * 0.5 - railW * 0.5]) {
            const stile = new THREE.Mesh(
              new THREE.BoxGeometry(railW, h - 0.22 - railW, thick),
              this.materials.bronze
            );
            stile.position.set(centerOffsetX + sx, 0.22 + (h - 0.22 - railW) * 0.5, 0);
            stile.castShadow = true;
            doorSlab.add(stile);
          }

          const midBar = new THREE.Mesh(
            new THREE.BoxGeometry(w - railW * 2, 0.032, thick * 0.8),
            this.materials.bronze
          );
          midBar.position.set(centerOffsetX, h * 0.54, 0);
          doorSlab.add(midBar);
        } else {
          // Stile-and-rail handcrafted timber door with recessed dual panels
          const stileW = Math.min(0.11, w * 0.13);
          const insetW = w - stileW * 2;
          const innerMat = this.materials.timberHoney;
          const railMat = d.isMain ? this.materials.timberDark : this.materials.timberHoney;

          // Recessed center panel core
          const corePanel = new THREE.Mesh(
            new THREE.BoxGeometry(insetW, h - 0.26, thick * 0.65),
            innerMat
          );
          corePanel.position.set(centerOffsetX, h * 0.5, 0);
          corePanel.castShadow = true;
          corePanel.receiveShadow = true;
          doorSlab.add(corePanel);

          // Left & right full stiles
          for (const sx of [-w * 0.5 + stileW * 0.5, w * 0.5 - stileW * 0.5]) {
            const stile = new THREE.Mesh(
              new THREE.BoxGeometry(stileW, h, thick),
              railMat
            );
            stile.position.set(centerOffsetX + sx, h * 0.5, 0);
            stile.castShadow = true;
            doorSlab.add(stile);
          }

          // Bottom, mid-lock & top rails
          const botRail = new THREE.Mesh(new THREE.BoxGeometry(insetW, 0.18, thick), railMat);
          botRail.position.set(centerOffsetX, 0.09, 0);
          botRail.castShadow = true;
          doorSlab.add(botRail);

          const lockRail = new THREE.Mesh(new THREE.BoxGeometry(insetW, 0.14, thick), railMat);
          lockRail.position.set(centerOffsetX, 0.96, 0);
          lockRail.castShadow = true;
          doorSlab.add(lockRail);

          const topRail = new THREE.Mesh(new THREE.BoxGeometry(insetW, 0.14, thick), railMat);
          topRail.position.set(centerOffsetX, h - 0.07, 0);
          topRail.castShadow = true;
          doorSlab.add(topRail);

          // Brass bottom kickplate on Main Entrance Door
          if (d.isMain) {
            const kickplate = new THREE.Mesh(
              new THREE.BoxGeometry(w - 0.04, 0.16, thick + 0.008),
              this.materials.brass
            );
            kickplate.position.set(centerOffsetX, 0.085, 0);
            doorSlab.add(kickplate);
          }
        }

        // Brass hinge barrels along hinge edge
        for (const hy of [0.35, h * 0.5, h - 0.35]) {
          const hingePin = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.01, 0.07, 8),
            this.materials.brass
          );
          hingePin.position.set(0, hy, 0);
          doorSlab.add(hingePin);
        }

        // Brass escutcheon rosettes & ergonomic L-lever handles on interior and exterior faces
        const handleX = hingeOnRight ? -w + 0.12 : w - 0.12;
        const handleY = 0.98;
        const dirToHinge = hingeOnRight ? 1 : -1;

        for (const side of [-1, 1]) {
          const zSurface = side * (thick * 0.5 + 0.004);
          const rosette = new THREE.Mesh(
            new THREE.CylinderGeometry(0.026, 0.026, 0.01, 12),
            this.materials.brass
          );
          rosette.rotation.x = Math.PI / 2;
          rosette.position.set(handleX, handleY, zSurface);
          doorSlab.add(rosette);

          const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.01, 0.04, 8),
            this.materials.brass
          );
          stem.rotation.x = Math.PI / 2;
          stem.position.set(handleX, handleY, side * (thick * 0.5 + 0.022));
          doorSlab.add(stem);

          const leverLen = d.isMain ? 0.14 : 0.12;
          const lever = new THREE.Mesh(
            new THREE.CylinderGeometry(0.009, 0.009, leverLen, 8),
            this.materials.brass
          );
          lever.rotation.z = Math.PI / 2;
          lever.position.set(
            handleX + dirToHinge * (leverLen * 0.4),
            handleY,
            side * (thick * 0.5 + 0.042)
          );
          doorSlab.add(lever);
        }

        pivot.add(doorSlab);
      }

      // Animation tracker & Metadata for InteractionManager and gameStore
      const animState = {
        pivot,
        isSliding,
        openAngle: d.openAngle || Math.PI * 0.5,
        slideDistance: d.slideDistance || 1.25,
        currentProgress: 0,
        targetProgress: 0,
      };
      this.animatedDoors.push(animState);

      dSub.userData = {
        id: d.id,
        type: 'door',
        label: d.label,
        category: d.category,
        isOpen: false,
        openAngle: animState.openAngle,
        isSliding,
        slideDistance: animState.slideDistance,
        isMain: Boolean(d.isMain),
        pivot,
      };

      // Instant synchronous toggle (preserves deterministic rapid-fire physics & test contracts)
      dSub.toggle = (forceState) => {
        const nextState = forceState !== undefined ? forceState : !dSub.userData.isOpen;
        dSub.userData.isOpen = nextState;
        animState.currentProgress = nextState ? 1 : 0;
        animState.targetProgress = animState.currentProgress;

        if (isSliding) {
          pivot.position.x = nextState ? dSub.userData.slideDistance : 0;
        } else {
          pivot.rotation.y = nextState ? dSub.userData.openAngle : 0;
        }

        if (this.options.collisionSystem) {
          this.options.collisionSystem.setDoorOpen(d.id, nextState);
        }
        gameStore.setState({
          doors: { ...gameStore.getState().doors, [d.id]: nextState },
        });
        return nextState;
      };

      // Smooth animated toggle for interactive player gameplay
      dSub.toggleAnimated = (forceState) => {
        const nextState = forceState !== undefined ? forceState : !dSub.userData.isOpen;
        dSub.userData.isOpen = nextState;
        animState.targetProgress = nextState ? 1 : 0;

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
        animState.currentProgress = 0;
        animState.targetProgress = 0;
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

      if (this.options.collisionSystem) {
        const colBox = this.options.collisionSystem.addWallBox(
          d.x,
          d.y,
          d.z,
          w,
          h,
          0.12,
          `door-col-${d.id}`
        );
        this.options.collisionSystem.registerDoorCollider(d.id, colBox);
      }

      if (this.options.interactionManager) {
        this.options.interactionManager.register({
          id: d.id,
          mesh: dSub,
          kind: 'door',
          label: d.label,
          prompt: () => (dSub.userData.isOpen ? 'E — Close Door' : 'E — Open Door'),
          range: d.isMain ? 2.4 : 2.0,
          onInteract: () => dSub.toggleAnimated(),
        });
      }

      this.doorsMap.set(d.id, dSub);
      doorsGroup.add(dSub);
    }

    houseGroup.add(doorsGroup);
  }

  /**
   * Builds the central 18-step timber staircase connecting ground floor (Y = 0.30)
   * to upper gallery mezzanine (Y = 3.95) with slim structural stringers,
   * bullnose oak treads, chamfered newel caps, and dual handrails.
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
    // +rotation.x raises -Z (endZ top) and lowers +Z (startZ bottom) in Three.js right-hand coords
    const stringerRotX = Math.atan2(rise, run);
    const slopeHypot = Math.hypot(run, rise);
    const midY = (s.bottomY + s.topY) * 0.5;
    const midZ = (s.startZ + s.endZ) * 0.5;

    // 1. Individual 18 steps with bullnose oak treads, risers, and slender turned balusters
    const nosingGeo = new THREE.CylinderGeometry(0.018, 0.018, w, 10);
    nosingGeo.rotateZ(Math.PI / 2);

    for (let i = 0; i < count; i++) {
      const stepZ = s.startZ - (i + 0.5) * stepDepth;
      const stepY = s.bottomY + (i + 1) * stepHeight;

      const treadMesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.036, stepDepth + 0.024),
        this.materials.floors.oak
      );
      treadMesh.position.set(centerX, stepY, stepZ);
      treadMesh.castShadow = true;
      treadMesh.receiveShadow = true;
      stairGroup.add(treadMesh);

      // Rounded bullnose front lip
      const nosing = new THREE.Mesh(nosingGeo, this.materials.floors.oak);
      nosing.position.set(centerX, stepY, stepZ + (stepDepth + 0.024) * 0.5);
      nosing.castShadow = true;
      stairGroup.add(nosing);

      const riserMesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, stepHeight - 0.02, 0.024),
        this.materials.timberHoney
      );
      riserMesh.position.set(centerX, stepY - stepHeight * 0.5, stepZ + stepDepth * 0.5);
      riserMesh.receiveShadow = true;
      stairGroup.add(riserMesh);

      // Sleek tapered dark timber balusters + brass collars along BOTH open staircase edges
      const slopeRailY = s.bottomY + (i + 0.5) * stepHeight + 1.04;
      const balLen = Math.max(0.55, slopeRailY - stepY);
      for (const railX of [s.minX + 0.06, s.maxX - 0.06]) {
        const baluster = new THREE.Mesh(
          new THREE.CylinderGeometry(0.014, 0.018, balLen, 8),
          this.materials.timberDark
        );
        baluster.position.set(railX, stepY + balLen * 0.5, stepZ);
        baluster.castShadow = true;
        stairGroup.add(baluster);

        const collar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.025, 8),
          this.materials.brass
        );
        collar.position.set(railX, stepY + 0.03, stepZ);
        stairGroup.add(collar);
      }
    }

    // 2. Refined under-tuck stringer carriages along left and right edges (clean slim architectural silhouette)
    const stringerGeo = new THREE.BoxGeometry(0.055, 0.16, slopeHypot);
    for (const sx of [s.minX - 0.02, s.maxX + 0.02]) {
      const stringer = new THREE.Mesh(stringerGeo, this.materials.timberDark);
      stringer.position.set(sx, midY - 0.12, midZ);
      stringer.rotation.x = stringerRotX;
      stringer.castShadow = true;
      stairGroup.add(stringer);
    }

    // 3. Matching newel posts with pyramidal chamfered brass caps on BOTH left and right runs
    const postGeo = new THREE.BoxGeometry(0.09, 1.12, 0.09);
    const capGeo = new THREE.BoxGeometry(0.11, 0.04, 0.11);
    for (const railX of [s.minX + 0.06, s.maxX - 0.06]) {
      for (const [py, pz] of [
        [s.bottomY + 0.56, s.startZ],
        [s.topY + 0.56, s.endZ],
      ]) {
        const post = new THREE.Mesh(postGeo, this.materials.timberDark);
        post.position.set(railX, py, pz);
        post.castShadow = true;
        stairGroup.add(post);

        const cap = new THREE.Mesh(capGeo, this.materials.brass);
        cap.position.set(railX, py + 0.58, pz);
        stairGroup.add(cap);
      }
    }

    // 4. Sculpted twin oak handrails supported on left and right balustrades
    const handrailGeo = new THREE.CylinderGeometry(0.026, 0.026, slopeHypot, 10);
    handrailGeo.rotateX(Math.PI / 2);

    const railOffsetY = midY + 1.04;
    for (const railX of [s.minX + 0.06, s.maxX - 0.06]) {
      const handrail = new THREE.Mesh(handrailGeo, this.materials.timberHoney);
      handrail.position.set(railX, railOffsetY, midZ);
      handrail.rotation.x = stringerRotX;
      handrail.castShadow = true;
      stairGroup.add(handrail);
    }

    consolidateStaticGroup(stairGroup);
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

    // Helper for uniform gallery guardrail segments along X at Z = 1.70
    const addXGuardrail = (startX, endX) => {
      const len = endX - startX;
      const cx = (startX + endX) * 0.5;
      const topR = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.06), this.materials.timberHoney);
      topR.position.set(cx, railY + railH - 0.03, 1.7);
      topR.castShadow = true;
      mGroup.add(topR);

      const botR = new THREE.Mesh(new THREE.BoxGeometry(len, 0.04, 0.04), this.materials.timberDark);
      botR.position.set(cx, railY + 0.06, 1.7);
      mGroup.add(botR);

      const balCount = Math.floor(len / 0.15);
      for (let i = 0; i <= balCount; i++) {
        const bx = startX + i * 0.15;
        const bMesh = new THREE.Mesh(new THREE.BoxGeometry(0.025, railH - 0.1, 0.025), this.materials.timberDark);
        bMesh.position.set(bx, railY + railH * 0.5, 1.7);
        bMesh.castShadow = true;
        mGroup.add(bMesh);
      }
    };

    // 1. Guardrail along Z = 1.70 m from X = -6.6 m to X = 0.65 m (overlooking living hall)
    addXGuardrail(-6.6, 0.65);

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

    // 3. East landing guardrail connecting top-right stair newel (X = 2.99) to East clerestory wall (X = 3.95)
    addXGuardrail(2.99, 3.95);

    // Newel post at junction
    const postMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, railH + 0.08, 0.09), this.materials.timberHoney);
    postMesh.position.set(0.65, railY + (railH + 0.08) * 0.5, 1.7);
    postMesh.castShadow = true;
    mGroup.add(postMesh);

    // Prevent walking off the mezzanine balustrade overlook or stairwell opening
    this.addColliderBox(-6.6, railY, 1.65, 0.65, railY + railH, 1.75, 'rail-gallery-living');
    this.addColliderBox(0.62, railY, 1.7, 0.68, railY + railH, 5.7, 'rail-gallery-stair');
    this.addColliderBox(2.99, railY, 1.65, 3.95, railY + railH, 1.75, 'rail-gallery-stair-east');

    consolidateStaticGroup(mGroup);
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

      // 4. Sculpted teak balcony lounge chairs, slatted tea table & lush terracotta planters
      const buildTeakLoungeChair = () => {
        const chair = new THREE.Group();
        for (const [lx, lz] of [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]]) {
          const leg = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.36, 0.05),
            this.materials.timberDark
          );
          leg.position.set(lx, 0.18, lz);
          leg.castShadow = true;
          chair.add(leg);
        }
        for (let s = 0; s < 4; s++) {
          const slat = new THREE.Mesh(
            new THREE.BoxGeometry(0.52, 0.03, 0.1),
            this.materials.timberHoney
          );
          slat.position.set(0, 0.365, -0.18 + s * 0.12);
          slat.castShadow = true;
          chair.add(slat);
        }
        const cushion = new THREE.Mesh(
          new THREE.BoxGeometry(0.48, 0.055, 0.48),
          this.materials.curtains
        );
        cushion.position.set(0, 0.408, 0.01);
        cushion.castShadow = true;
        chair.add(cushion);

        for (const ax of [-0.26, 0.26]) {
          const arm = new THREE.Mesh(
            new THREE.BoxGeometry(0.055, 0.035, 0.52),
            this.materials.timberHoney
          );
          arm.position.set(ax, 0.56, 0);
          arm.castShadow = true;
          chair.add(arm);

          const st = new THREE.Mesh(
            new THREE.BoxGeometry(0.045, 0.2, 0.045),
            this.materials.timberDark
          );
          st.position.set(ax, 0.46, 0.22);
          chair.add(st);

          const bPost = new THREE.Mesh(
            new THREE.BoxGeometry(0.045, 0.46, 0.045),
            this.materials.timberDark
          );
          bPost.position.set(ax, 0.6, -0.24);
          bPost.rotation.x = -0.14;
          chair.add(bPost);
        }

        for (let b = 0; b < 3; b++) {
          const backSlat = new THREE.Mesh(
            new THREE.BoxGeometry(0.48, 0.09, 0.03),
            this.materials.timberHoney
          );
          backSlat.position.set(0, 0.52 + b * 0.12, -0.23 - b * 0.016);
          backSlat.rotation.x = -0.14;
          backSlat.castShadow = true;
          chair.add(backSlat);
        }
        return chair;
      };

      const buildBalconyPlanter = (radius = 0.2) => {
        const planterG = new THREE.Group();
        const pot = new THREE.Mesh(
          new THREE.CylinderGeometry(radius, radius * 0.72, 0.42, 12),
          this.materials.terracotta
        );
        pot.position.y = 0.21;
        pot.castShadow = true;
        planterG.add(pot);

        const rim = new THREE.Mesh(
          new THREE.TorusGeometry(radius, 0.024, 8, 14),
          this.materials.terracotta
        );
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.42;
        planterG.add(rim);

        const frondGeo = createUrnFrondGeometry(0.32, 0.05, 0.26, 0.16);
        for (let f = 0; f < 9; f++) {
          const ang = (f / 9) * Math.PI * 2;
          const frond = new THREE.Mesh(frondGeo, this.materials.foliage);
          frond.position.set(Math.cos(ang) * 0.045, 0.42, Math.sin(ang) * 0.045);
          frond.rotation.y = Math.PI / 2 - ang;
          frond.castShadow = true;
          planterG.add(frond);
        }
        consolidateStaticGroup(planterG);
        return planterG;
      };

      if (b.id === 'balcony-1') {
        const chair1 = buildTeakLoungeChair();
        chair1.name = 'balcony1-chair-1';
        chair1.position.set(b.minX + 0.95, bY, bz);
        chair1.rotation.y = Math.PI - 0.30;
        bSub.add(chair1);

        const chair2 = buildTeakLoungeChair();
        chair2.name = 'balcony1-chair-2';
        chair2.position.set(b.maxX - 0.95, bY, bz);
        chair2.rotation.y = Math.PI + 0.30;
        bSub.add(chair2);

        this.seats.push(
          {
            id: 'balcony1-chair-1',
            label: 'Main Balcony Lounge Chair',
            x: b.minX + 0.95,
            y: bY + 0.42,
            z: bz,
            yaw: -0.30,
          },
          {
            id: 'balcony1-chair-2',
            label: 'Main Balcony Lounge Chair',
            x: b.maxX - 0.95,
            y: bY + 0.42,
            z: bz,
            yaw: 0.30,
          }
        );

        // Slatted round teak table & ceramic teacup
        const tGroup = new THREE.Group();
        tGroup.position.set(bx, bY, bz);
        const tTop = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.28, 0.035, 16),
          this.materials.timberHoney
        );
        tTop.position.y = 0.46;
        tTop.castShadow = true;
        tGroup.add(tTop);
        const tPed = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.055, 0.44, 10),
          this.materials.timberDark
        );
        tPed.position.y = 0.22;
        tGroup.add(tPed);
        const tBase = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.2, 0.03, 14),
          this.materials.timberDark
        );
        tBase.position.y = 0.015;
        tGroup.add(tBase);
        const cup = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.028, 0.075, 10),
          this.materials.curtains
        );
        cup.position.set(0.05, 0.515, -0.02);
        tGroup.add(cup);
        bSub.add(tGroup);

        const p1 = buildBalconyPlanter(0.2);
        p1.position.set(b.minX + 0.32, bY, b.minZ + 0.32);
        bSub.add(p1);

        const p2 = buildBalconyPlanter(0.2);
        p2.position.set(b.maxX - 0.32, bY, b.minZ + 0.32);
        bSub.add(p2);
      } else if (b.id === 'balcony-2') {
        const b2Chair = buildTeakLoungeChair();
        b2Chair.name = 'balcony2-chair';
        b2Chair.position.set(bx, bY, b.minZ + 0.55);
        b2Chair.rotation.y = -Math.PI * 0.58;
        bSub.add(b2Chair);

        this.seats.push({
          id: 'balcony2-chair',
          label: 'West Balcony Chair',
          x: bx,
          y: bY + 0.42,
          z: b.minZ + 0.55,
          yaw: Math.PI * 0.42,
        });

        const pWest = buildBalconyPlanter(0.18);
        pWest.position.set(b.minX + 0.28, bY, b.maxZ - 0.32);
        bSub.add(pWest);
      }

      consolidateStaticGroup(bSub);
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
    gableShape.moveTo(-8.75, 0.0);
    gableShape.lineTo(8.75, 0.0);
    gableShape.lineTo(8.75, 0.31);
    gableShape.lineTo(0, rise + 0.04);
    gableShape.lineTo(-8.75, 0.31);
    gableShape.closePath();

    const gableGeo = new THREE.ExtrudeGeometry(gableShape, {
      depth: 0.25,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 0,
      bevelThickness: 0,
    });
    normalizeWallExtrudeUV(gableGeo, 17.5, 3.1);
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

    // Interior warm lime-plaster gable skins overlapping below Y=7.05 so vaulted rooms never expose hairline seams
    const gableInnerShape = new THREE.Shape();
    gableInnerShape.moveTo(-8.75, -0.04);
    gableInnerShape.lineTo(8.75, -0.04);
    gableInnerShape.lineTo(8.75, 0.31);
    gableInnerShape.lineTo(0, rise + 0.04);
    gableInnerShape.lineTo(-8.75, 0.31);
    gableInnerShape.closePath();

    const westGableInnerGeo = new THREE.ShapeGeometry(gableInnerShape);
    normalizeWallExtrudeUV(westGableInnerGeo, 17.5, 3.1);
    westGableInnerGeo.rotateY(Math.PI / 2);
    const westGableInner = new THREE.Mesh(westGableInnerGeo, this.materials.interiorWall);
    westGableInner.position.set(-11.747, eaveY, 0);
    westGableInner.receiveShadow = true;
    rGroup.add(westGableInner);

    const eastGableInnerGeo = new THREE.ShapeGeometry(gableInnerShape);
    normalizeWallExtrudeUV(eastGableInnerGeo, 17.5, 3.1);
    eastGableInnerGeo.rotateY(-Math.PI / 2);
    const eastGableInner = new THREE.Mesh(eastGableInnerGeo, this.materials.interiorWall);
    eastGableInner.position.set(3.947, eaveY, 0);
    eastGableInner.receiveShadow = true;
    rGroup.add(eastGableInner);

    // Interior walnut eave wall-plate tie beams carrying sloped rafters (seals Y=7.05 wall/gable joints cleanly)
    const wallPlates = [
      [-3.9, eaveY, 8.73, 15.7, 0.12, 0.07],
      [-3.9, eaveY, -8.73, 15.7, 0.12, 0.07],
      [-11.73, eaveY, 0, 0.07, 0.12, 17.5],
      [3.93, eaveY, 0, 0.07, 0.12, 17.5],
    ];
    for (const [wx, wy, wz, ww, wh, wd] of wallPlates) {
      const wpMesh = new THREE.Mesh(new THREE.BoxGeometry(ww, wh, wd), rafterMat);
      wpMesh.position.set(wx, wy, wz);
      wpMesh.receiveShadow = true;
      rGroup.add(wpMesh);
    }

    // Front & Rear eave top-plate closure boards sealing wall tops cleanly from Y=7.05 into raised soffits (zero Z-fighting)
    const eaveClosureW = 16.2; // X = -12.0..+4.2
    const eaveClosureCenterX = -3.9;
    for (const [zCoord, extFace] of [
      [8.875, '+Z'],
      [-8.875, '-Z'],
    ]) {
      const friezeMat = createOrientedWallMaterials(
        extFace,
        this.materials.siding,
        this.materials.interiorWall
      );
      const friezeGeo = new THREE.BoxGeometry(eaveClosureW, 0.28, 0.25);
      applyWorldBoxUVs(friezeGeo, eaveClosureCenterX, eaveY + 0.14, zCoord);
      const frieze = new THREE.Mesh(friezeGeo, friezeMat);
      frieze.position.set(eaveClosureCenterX, eaveY + 0.14, zCoord);
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

    // Interior plaster skins on East Wing roof cheek walls
    const eastFrontMirror = new THREE.Shape();
    eastFrontMirror.moveTo(-4.2, 3.7);
    eastFrontMirror.lineTo(-4.2, 4.59);
    eastFrontMirror.lineTo(-12.0, 3.79);
    eastFrontMirror.lineTo(-12.0, 3.7);
    eastFrontMirror.closePath();
    const eastFrontInnerGeo = new THREE.ShapeGeometry(eastFrontMirror);
    eastFrontInnerGeo.rotateY(Math.PI);
    const eastFrontInner = new THREE.Mesh(eastFrontInnerGeo, this.materials.interiorWall);
    eastFrontInner.position.set(0, 0, 8.747);
    rGroup.add(eastFrontInner);

    const eastRearInner = new THREE.Mesh(
      new THREE.ShapeGeometry(eastWedgeShape),
      this.materials.interiorWall
    );
    eastRearInner.position.set(0, 0, -8.747);
    rGroup.add(eastRearInner);

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
   * Advances smooth door swing and slide animations each frame.
   */
  update(dt = 0.016) {
    const step = Math.min(0.1, Math.max(0.001, dt || 0.016)) / 0.65;
    for (let i = 0; i < this.animatedDoors.length; i++) {
      const d = this.animatedDoors[i];
      if (Math.abs(d.currentProgress - d.targetProgress) < 0.0005) {
        d.currentProgress = d.targetProgress;
      } else {
        const dir = Math.sign(d.targetProgress - d.currentProgress);
        const next = d.currentProgress + dir * step;
        d.currentProgress =
          dir > 0 ? Math.min(d.targetProgress, next) : Math.max(d.targetProgress, next);
      }

      // Smooth cubic ease-in-out
      const t = d.currentProgress;
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      if (d.isSliding) {
        d.pivot.position.x = eased * d.slideDistance;
      } else {
        d.pivot.rotation.y = eased * d.openAngle;
      }
    }
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
      seats: this.seats,
      exteriorLights: this.exteriorLights,
      interiorLights: this.interiorLights,
      update: (dt) => this.update(dt),
    };
    houseGroup.update = (dt) => this.update(dt);

    if (scene) {
      scene.add(houseGroup);
    }

    // Register all opaque wall and floor meshes as occluders if collisionSystem provided
    if (this.options.collisionSystem) {
      houseGroup.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        const isOpaque = Array.isArray(child.material)
          ? child.material.some((m) => !m.transparent)
          : !child.material.transparent;
        if (isOpaque) {
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
