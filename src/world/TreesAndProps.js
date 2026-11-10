import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { getTerrainHeight } from '../house/HouseArchitecture.js';
import {
  getTreeBarkTextures,
  getFoliageTexture,
  getTimberTextures,
  getStoneTileTextures,
  getBrushedMetalTextures,
} from '../assets/procedural/TextureGenerator.js';

function prepForMerge(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal' && name !== 'uv' && name !== 'color') {
      g.deleteAttribute(name);
    }
  }
  return g;
}

function safeMerge(parts) {
  if (!parts || parts.length === 0) return null;
  const clean = parts.map(prepForMerge);
  const hasColor = clean.every((g) => Boolean(g.getAttribute('color')));
  if (!hasColor) {
    clean.forEach((g) => g.deleteAttribute('color'));
  }
  const merged = mergeGeometries(clean, false);
  for (let i = 0; i < clean.length; i++) {
    if (clean[i] !== parts[i]) clean[i].dispose();
  }
  return merged;
}

function createFoliageBlobGeo(rx, ry, rz, cx, cy, cz, seed = 1, detail = 2) {
  // Multi-harmonic serrated leaf-cluster geometry with deep canopy core AO so branches read leafy
  const segW = detail >= 2 ? 12 : detail === 1 ? 9 : 7;
  const segH = detail >= 2 ? 9 : detail === 1 ? 7 : 5;
  const base = new THREE.SphereGeometry(1, segW, segH);
  const pos = base.getAttribute('position');
  const colArr = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const macro =
      0.16 * Math.sin(x * 4.2 + y * 3.1 + seed) +
      0.12 * Math.cos(z * 4.7 - y * 3.4 + seed * 1.7);
    const leafSerration =
      0.09 * Math.sin(x * 11.4 + seed * 2.3) * Math.cos(z * 10.6 - y * 8.2);
    const n = 1 + macro + leafSerration;
    pos.setXYZ(i, x * rx * n, y * ry * n, z * rz * n);
    // Dappled crown interior core shadow to sunlit upper foliage crest
    const yNorm = Math.max(0, Math.min(1, y * 0.5 + 0.5));
    const microAO = 0.92 + 0.08 * Math.sin((x + z) * 9.0 + seed);
    const ao = (0.56 + 0.54 * yNorm) * microAO;
    colArr[i * 3] = ao * 0.96;
    colArr[i * 3 + 1] = ao * 1.05;
    colArr[i * 3 + 2] = ao * 0.91;
  }
  base.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
  base.computeVertexNormals();
  base.translate(cx, cy, cz);
  return base;
}

/**
 * Builds an arching spear-leaf rosette cluster whose leaves rise from inside the pot soil
 * cleanly above `rimY` without clipping the outer pot wall.
 */
function buildAgaveLeafBladeGeometry(length, width, tipRise, reachRadius) {
  const geo = new THREE.PlaneGeometry(width, length, 2, 4);
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i);
    const t = Math.max(0, Math.min(1, (pos.getY(i) + length * 0.5) / length));
    const taper = Math.sin(Math.min(1, t * 0.85 + 0.12) * Math.PI) * (1 - t * 0.72);
    const forward = t * reachRadius;
    const upward = Math.sin(t * Math.PI * 0.65) * tipRise + t * 0.08;
    const midRibCurve = (1 - Math.abs(lx) / Math.max(0.001, width * 0.5)) * -0.008;
    pos.setXYZ(i, lx * taper, upward, forward + midRibCurve);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Procedural Tree Silhouettes and Specifications per PRD Section 5.1:
 * - Broad-canopy shade tree (Oak / Mature Sandalwood)
 * - Slender ornamental tree (Orchard / Cypress)
 * - Flowering tree (Blossoming Sandalwood / Cherry)
 */
export const TREE_SPECS = [
  // 4 Broad-canopy shade trees
  { id: 'tree-shade-nw', type: 'shade', x: -28.0, z: 18.0, height: 6.5, trunkRadius: 0.22, crownRadius: 2.2, leafColor: '#3D7047' },
  { id: 'tree-shade-ne', type: 'shade', x: 28.0, z: 18.0, height: 6.8, trunkRadius: 0.24, crownRadius: 2.4, leafColor: '#56824C' },
  { id: 'tree-shade-sw', type: 'shade', x: -32.0, z: -12.0, height: 6.2, trunkRadius: 0.20, crownRadius: 2.1, leafColor: '#3D7047' },
  { id: 'tree-shade-se', type: 'shade', x: 28.0, z: -8.0, height: 6.4, trunkRadius: 0.22, crownRadius: 2.3, leafColor: '#56824C' },

  // 3 Slender ornamental trees
  { id: 'tree-orn-nw', type: 'ornamental', x: -22.0, z: 36.0, height: 5.6, trunkRadius: 0.16, crownRadius: 1.6, leafColor: '#78965B' },
  { id: 'tree-orn-ne', type: 'ornamental', x: 24.0, z: 38.0, height: 5.8, trunkRadius: 0.17, crownRadius: 1.7, leafColor: '#56824C' },
  { id: 'tree-orn-pool', type: 'ornamental', x: -18.0, z: -16.0, height: 5.4, trunkRadius: 0.15, crownRadius: 1.5, leafColor: '#78965B' },

  // 3 Flowering trees with subtle blossom accents
  { id: 'tree-flower-w', type: 'flowering', x: -16.0, z: 28.0, height: 5.2, trunkRadius: 0.16, crownRadius: 1.8, leafColor: '#56824C', blossomColor: '#D99AA5' },
  { id: 'tree-flower-e', type: 'flowering', x: 18.0, z: 26.0, height: 5.4, trunkRadius: 0.17, crownRadius: 1.9, leafColor: '#3D7047', blossomColor: '#E2A8B5' },
  { id: 'tree-flower-rear', type: 'flowering', x: 14.0, z: -18.0, height: 5.0, trunkRadius: 0.15, crownRadius: 1.7, leafColor: '#56824C', blossomColor: '#D99AA5' },
];

/**
 * 4 Carved Stone & Sandalwood Timber Benches per PRD Section 5.3
 * 1.50 m W x 0.55 m D x 0.85 m H
 */
export const BENCH_CONFIGS = [
  { id: 'bench-path-left', x: -4.5, z: 24.0, rotY: Math.PI / 2, label: 'West Path Garden Bench' },
  { id: 'bench-path-right', x: 11.5, z: 24.0, rotY: -Math.PI / 2, label: 'East Path Garden Bench' },
  { id: 'bench-arrival', x: 3.5, z: 42.5, rotY: Math.PI, label: 'Arrival Garden Bench' },
  { id: 'bench-pool-side', x: -15.5, z: -13.5, rotY: Math.PI / 2, label: 'Pool View Garden Bench' },
];

/**
 * 10 Pathway Bollard Lanterns along the 2.4 m pathway per PRD Section 3.2
 * 0.45 m tall, dark bronze base, warm 2700 K light.
 */
export const PATH_LANTERN_CONFIGS = [
  { id: 'lantern-1', x: 2.1, z: 14.0 },
  { id: 'lantern-2', x: 4.9, z: 17.0 },
  { id: 'lantern-3', x: 2.1, z: 20.0 },
  { id: 'lantern-4', x: 4.9, z: 23.0 },
  { id: 'lantern-5', x: 2.1, z: 26.0 },
  { id: 'lantern-6', x: 4.9, z: 29.0 },
  { id: 'lantern-7', x: 2.1, z: 32.0 },
  { id: 'lantern-8', x: 4.9, z: 35.0 },
  { id: 'lantern-9', x: 2.1, z: 38.0 },
  { id: 'lantern-10', x: 4.9, z: 40.5 },
];

/**
 * Procedural Tree Builder creating gnarled curved trunks, branching limbs, and multi-layered organic leaf canopies.
 */
function buildTreeMesh(spec, treeMats) {
  const treeGroup = new THREE.Group();
  treeGroup.name = spec.id;

  const { barkMat, getLeafPair, getBlossomMat } = treeMats;
  const { leafMat, deepLeafMat } = getLeafPair(spec.leafColor);

  const seed = Math.abs(Math.round(spec.x * 13 + spec.z * 7)) + 11;
  const trunkH = spec.height * (spec.type === 'ornamental' ? 0.34 : 0.42);
  const leanX = Math.sin(seed * 0.7) * 0.14;
  const leanZ = Math.cos(seed * 1.1) * 0.12;

  // Tapered flared root-collar & slightly twisted main trunk
  const woodParts = [];
  const rootFlare = new THREE.CylinderGeometry(spec.trunkRadius * 0.92, spec.trunkRadius * 1.55, 0.48, 12);
  rootFlare.translate(0, 0.24, 0);
  woodParts.push(rootFlare);

  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.2, 0),
    new THREE.Vector3(leanX * 0.4, trunkH * 0.45, leanZ * 0.4),
    new THREE.Vector3(leanX, trunkH, leanZ),
  ]);
  const trunkTube = new THREE.TubeGeometry(trunkCurve, 10, spec.trunkRadius * 0.82, 10, false);
  // Taper upper trunk smoothly along curve
  const tPos = trunkTube.getAttribute('position');
  for (let i = 0; i < tPos.count; i++) {
    const py = tPos.getY(i);
    const hFrac = Math.max(0, Math.min(1, py / Math.max(0.2, trunkH)));
    const pinch = 1.0 - hFrac * 0.28;
    const cx = leanX * hFrac;
    const cz = leanZ * hFrac;
    tPos.setX(i, cx + (tPos.getX(i) - cx) * pinch);
    tPos.setZ(i, cz + (tPos.getZ(i) - cz) * pinch);
  }
  trunkTube.computeVertexNormals();
  woodParts.push(trunkTube);

  // Forking primary & secondary boughs extending visibly into the crown
  const forkCount = spec.type === 'shade' ? 5 : spec.type === 'flowering' ? 4 : 3;
  const forkEnds = [];
  for (let b = 0; b < forkCount; b++) {
    const ang = (b / forkCount) * Math.PI * 2 + (seed % 7) * 0.25;
    const spread = spec.crownRadius * (spec.type === 'ornamental' ? 0.42 : 0.68);
    const rise = spec.height * (spec.type === 'ornamental' ? 0.34 : 0.27) + (b % 2) * 0.28;
    const sx = leanX + Math.cos(ang) * spread * 0.38;
    const sz = leanZ + Math.sin(ang) * spread * 0.38;
    const ex = leanX + Math.cos(ang) * spread;
    const ez = leanZ + Math.sin(ang) * spread;
    const forkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(leanX, trunkH * 0.88, leanZ),
      new THREE.Vector3(sx, trunkH + rise * 0.55, sz),
      new THREE.Vector3(ex, trunkH + rise, ez),
    ]);
    woodParts.push(new THREE.TubeGeometry(forkCurve, 7, spec.trunkRadius * 0.36, 7, false));
    forkEnds.push({ x: ex, y: trunkH + rise, z: ez, ang });

    // Secondary twig sub-fork
    const twigAng = ang + (b % 2 === 0 ? 0.52 : -0.48);
    const twigEnd = new THREE.Vector3(
      ex + Math.cos(twigAng) * spread * 0.4,
      trunkH + rise + 0.36,
      ez + Math.sin(twigAng) * spread * 0.4
    );
    const twigCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx, trunkH + rise * 0.55, sz),
      twigEnd,
    ]);
    woodParts.push(new THREE.TubeGeometry(twigCurve, 4, spec.trunkRadius * 0.2, 6, false));
  }

  const mergedWoodGeo = safeMerge(woodParts);
  woodParts.forEach((g) => g.dispose());
  const woodMesh = new THREE.Mesh(mergedWoodGeo, barkMat);
  woodMesh.castShadow = true;
  woodMesh.receiveShadow = true;
  treeGroup.add(woodMesh);

  // Layered Multi-Spray Canopy Group (carries sway animation)
  const crownGroup = new THREE.Group();
  crownGroup.position.set(leanX, trunkH * 0.96, leanZ);

  const outerParts = [];
  const innerParts = [];

  if (spec.type === 'shade') {
    const r = spec.crownRadius;
    const hSpan = spec.height * 0.48;
    // Inner shaded bough core clusters (smaller & recessed so limbs glimpse through)
    for (const f of forkEnds) {
      const fx = f.x - leanX;
      const fz = f.z - leanZ;
      const fy = f.y - trunkH * 0.96;
      innerParts.push(createFoliageBlobGeo(r * 0.36, hSpan * 0.28, r * 0.36, fx * 0.65, fy + 0.12, fz * 0.65, seed + f.ang * 7, 1));
      // 3 distinct leaf sprays per primary bough tip
      for (let sub = 0; sub < 3; sub++) {
        const sa = f.ang + (sub - 1) * 0.62;
        const sr = r * (0.28 + (sub % 2) * 0.08);
        const sDist = 0.25 + sub * 0.16;
        outerParts.push(
          createFoliageBlobGeo(
            sr,
            sr * 0.64,
            sr,
            fx + Math.cos(sa) * sDist,
            fy + 0.18 + sub * 0.16,
            fz + Math.sin(sa) * sDist,
            seed + Math.round(f.ang * 10) + sub,
            1
          )
        );
      }
    }
    // High sunlit upper crown sprigs
    for (let u = 0; u < 6; u++) {
      const ua = (u / 6) * Math.PI * 2 + seed * 0.21;
      const uDist = u === 0 ? 0 : r * 0.34;
      const uRad = r * (u === 0 ? 0.38 : 0.30);
      outerParts.push(
        createFoliageBlobGeo(
          uRad,
          uRad * 0.65,
          uRad,
          Math.cos(ua) * uDist,
          hSpan * (u === 0 ? 0.88 : 0.72 + (u % 2) * 0.1),
          Math.sin(ua) * uDist,
          seed + 30 + u,
          1
        )
      );
    }
  } else if (spec.type === 'ornamental') {
    const r = spec.crownRadius;
    const hSpan = spec.height * 0.64;
    const tiers = 8;
    for (let t = 0; t < tiers; t++) {
      const frac = t / (tiers - 1);
      const tr = r * (1.0 - frac * 0.7);
      const ty = hSpan * (0.12 + frac * 0.86);
      innerParts.push(createFoliageBlobGeo(tr * 0.68, tr * 0.5, tr * 0.68, 0, ty, 0, seed + t * 3, 1));
      const tufts = t === tiers - 1 ? 1 : 4;
      for (let k = 0; k < tufts; k++) {
        const ka = (k / tufts) * Math.PI * 2 + t * 0.85;
        const off = t === tiers - 1 ? 0 : tr * 0.44;
        outerParts.push(
          createFoliageBlobGeo(
            tr * 0.46,
            tr * 0.38,
            tr * 0.46,
            Math.cos(ka) * off,
            ty + (k % 2) * 0.09,
            Math.sin(ka) * off,
            seed + 50 + t * 4 + k,
            1
          )
        );
      }
    }
  } else {
    // Flowering ornamental sandalwood/cherry with delicate fork-tip foliage sprays & blossoms
    const r = spec.crownRadius;
    const hSpan = spec.height * 0.45;
    for (const f of forkEnds) {
      const fx = f.x - leanX;
      const fz = f.z - leanZ;
      const fy = f.y - trunkH * 0.96;
      innerParts.push(createFoliageBlobGeo(r * 0.32, hSpan * 0.25, r * 0.32, fx * 0.6, fy + 0.1, fz * 0.6, seed + 5 + f.ang, 1));
      for (let sub = 0; sub < 3; sub++) {
        const sa = f.ang + (sub - 1) * 0.58;
        const sr = r * (0.26 + (sub % 2) * 0.06);
        outerParts.push(
          createFoliageBlobGeo(
            sr,
            sr * 0.66,
            sr,
            fx + Math.cos(sa) * (0.2 + sub * 0.14),
            fy + 0.16 + (sub % 2) * 0.14,
            fz + Math.sin(sa) * (0.2 + sub * 0.14),
            seed + 20 + Math.round(f.ang * 10) + sub,
            1
          )
        );
      }
    }
    for (let u = 0; u < 4; u++) {
      const ua = (u / 4) * Math.PI * 2;
      outerParts.push(
        createFoliageBlobGeo(r * 0.32, hSpan * 0.26, r * 0.32, Math.cos(ua) * r * 0.26, hSpan * 0.78, Math.sin(ua) * r * 0.26, seed + 44 + u, 1)
      );
    }

    if (spec.blossomColor) {
      const blossomMat = getBlossomMat(spec.blossomColor);
      const blossomParts = [];
      for (let i = 0; i < 48; i++) {
        const ang = i * 1.48 + seed * 0.11;
        const layer = i % 4;
        const dist = r * (0.2 + (i % 5) * 0.1);
        const by = hSpan * (0.32 + layer * 0.14);
        const br = 0.055 + (i % 3) * 0.018;
        blossomParts.push(createFoliageBlobGeo(br, br * 0.78, br, Math.cos(ang) * dist, by, Math.sin(ang) * dist, i, 0));
      }
      const bGeo = safeMerge(blossomParts);
      blossomParts.forEach((g) => g.dispose());
      const bMesh = new THREE.Mesh(bGeo, blossomMat);
      bMesh.castShadow = true;
      crownGroup.add(bMesh);
    }
  }

  const innerGeo = safeMerge(innerParts);
  innerParts.forEach((g) => g.dispose());
  const innerMesh = new THREE.Mesh(innerGeo, deepLeafMat);
  innerMesh.castShadow = true;
  innerMesh.receiveShadow = true;
  crownGroup.add(innerMesh);

  const outerGeo = safeMerge(outerParts);
  outerParts.forEach((g) => g.dispose());
  const outerMesh = new THREE.Mesh(outerGeo, leafMat);
  outerMesh.castShadow = true;
  outerMesh.receiveShadow = true;
  crownGroup.add(outerMesh);

  treeGroup.add(crownGroup);
  treeGroup.userData.crown = crownGroup;

  return treeGroup;
}

/**
 * Builds a carved limestone & sandalwood timber bench (1.50 m W x 0.55 m D x 0.85 m H).
 */
function buildBenchMesh(config, shared) {
  const benchGroup = new THREE.Group();
  benchGroup.name = config.id;

  const { stoneMat, woodMat, bronzeMat } = shared;

  // 1. Profiled carved stone pedestals with base plinth & top corbel lip
  const legW = 0.13;
  const legD = 0.48;
  const legH = 0.42;

  for (const lx of [-0.6, 0.6]) {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.54), stoneMat);
    pad.position.set(lx, 0.025, 0);
    pad.receiveShadow = true;
    benchGroup.add(pad);

    const leg = new THREE.Mesh(new THREE.BoxGeometry(legW, legH - 0.09, legD - 0.06), stoneMat);
    leg.position.set(lx, 0.05 + (legH - 0.09) * 0.5, 0);
    leg.castShadow = true;
    leg.receiveShadow = true;
    benchGroup.add(leg);

    const corbel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.52), stoneMat);
    corbel.position.set(lx, legH - 0.025, 0);
    corbel.castShadow = true;
    benchGroup.add(corbel);
  }

  // 2. Contoured Sandalwood Timber Slatted Seat (6 ergonomic slats)
  const seatSlats = 6;
  const slatW = 1.54;
  const slatD = 0.07;
  const slatH = 0.032;

  for (let s = 0; s < seatSlats; s++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(slatW, slatH, slatD), woodMat);
    const sz = -0.2 + s * (slatD + 0.012);
    const curveY = s === 0 ? -0.008 : s === seatSlats - 1 ? -0.01 : 0;
    slat.position.set(0, legH + slatH * 0.5 + curveY, sz);
    slat.castShadow = true;
    slat.receiveShadow = true;
    benchGroup.add(slat);
  }

  // 3. Tilted Slatted Backrest with shaped crest rail
  const backSlats = 3;
  for (let b = 0; b < backSlats; b++) {
    const bSlat = new THREE.Mesh(new THREE.BoxGeometry(slatW - 0.04, 0.072, 0.028), woodMat);
    const by = legH + 0.14 + b * 0.105;
    bSlat.position.set(0, by, -0.23 - b * 0.01);
    bSlat.rotation.x = -0.11;
    bSlat.castShadow = true;
    benchGroup.add(bSlat);
  }

  // 4. Armrests, support posts & bronze bolt studs
  const postGeo = new THREE.BoxGeometry(0.045, 0.44, 0.045);
  postGeo.rotateX(-0.11);
  for (const px of [-0.62, 0.62]) {
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(px, legH + 0.21, -0.22);
    post.castShadow = true;
    benchGroup.add(post);

    const armLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.21, 8), bronzeMat);
    armLeg.position.set(px * 1.1, legH + 0.105, 0.15);
    armLeg.castShadow = true;
    benchGroup.add(armLeg);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.036, 0.45), woodMat);
    arm.position.set(px * 1.1, legH + 0.21, -0.02);
    arm.castShadow = true;
    benchGroup.add(arm);
  }

  benchGroup.userData = {
    id: config.id,
    type: 'bench',
    label: config.label,
    interactable: true,
    prompt: '[E] Sit on Bench',
    sitPosition: new THREE.Vector3(config.x, 0.44, config.z),
  };

  return benchGroup;
}

/**
 * Builds a pathway bollard luminaire (0.45 m tall, bronze base, louvered hood, warm 2700 K core).
 */
function buildPathLantern(config, idx = 0, shared = null) {
  const lanternGroup = new THREE.Group();
  lanternGroup.name = config.id;

  const bronzeMat = shared.bronzeMat;

  // Plinth collar & fluted stanchion
  const plinth = new THREE.Mesh(shared.plinthGeo, bronzeMat);
  plinth.position.y = 0.02;
  lanternGroup.add(plinth);

  const base = new THREE.Mesh(shared.baseGeo, bronzeMat);
  base.position.y = 0.15;
  base.castShadow = true;
  lanternGroup.add(base);

  // Warm luminous frosted glass cylinder (2700 K warm amber)
  const glowMat = new THREE.MeshStandardMaterial({
    color: '#FFD488',
    emissive: '#FFB850',
    emissiveIntensity: 0.85,
    roughness: 0.22,
  });

  const core = new THREE.Mesh(shared.coreGeo, glowMat);
  core.position.y = 0.33;
  lanternGroup.add(core);

  // Protective vertical bronze bars + louvered protective hood + apex cap
  for (let s = 0; s < 3; s++) {
    const a = (s / 3) * Math.PI * 2;
    const strut = new THREE.Mesh(shared.strutGeo, bronzeMat);
    strut.position.set(Math.cos(a) * 0.062, 0.33, Math.sin(a) * 0.062);
    lanternGroup.add(strut);
  }

  const cap = new THREE.Mesh(shared.capGeo, bronzeMat);
  cap.position.y = 0.43;
  cap.castShadow = true;
  lanternGroup.add(cap);

  // Subtle ground warm pool decal disk for night ambience
  const poolGlowMat = new THREE.MeshBasicMaterial({
    color: '#FFBF68',
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const poolDisc = new THREE.Mesh(shared.poolDiscGeo, poolGlowMat);
  poolDisc.rotation.x = -Math.PI / 2;
  poolDisc.position.y = 0.008;
  lanternGroup.add(poolDisc);

  // Real warm PointLights on staggered pathway bollards (registered with DayNightController via World.js)
  let pointLight = null;
  if (idx === 1 || idx === 5 || idx === 8) {
    pointLight = new THREE.PointLight('#FFB458', 0.95, 9.5, 1.6);
    pointLight.position.y = 0.36;
    lanternGroup.add(pointLight);
  }

  lanternGroup.userData = {
    glowMat,
    emissiveMat: glowMat,
    pointLight,
    setIntensity: (val) => {
      glowMat.emissiveIntensity = val;
      poolGlowMat.opacity = Math.max(0, Math.min(0.24, (val - 0.15) * 0.22));
    },
  };

  return lanternGroup;
}

/**
 * Builds decorative garden props: weathered boulders, amphora planters, turned bird baths, hose reel.
 */
function buildDecorativeGardenProps() {
  const group = new THREE.Group();
  group.name = 'decorative-props';

  const stoneTex = typeof document !== 'undefined'
    ? getStoneTileTextures('foyer', 2, 2)
    : { map: null, normalMap: null, roughnessMap: null };

  // 1. 7 Weathered Natural Granite Boulders
  const rockMat = new THREE.MeshStandardMaterial({
    map: stoneTex.map,
    normalMap: stoneTex.normalMap,
    normalScale: new THREE.Vector2(1.0, 1.0),
    roughnessMap: stoneTex.roughnessMap,
    color: '#8C857A',
    roughness: 0.9,
    metalness: 0.04,
  });

  const rockCoords = [
    { x: -5.5, z: 14.5, scale: 0.38 },
    { x: 12.0, z: 15.0, scale: 0.45 },
    { x: -6.2, z: 32.5, scale: 0.32 },
    { x: 12.8, z: 33.0, scale: 0.42 },
    { x: -14.0, z: 8.5, scale: 0.52 },
    { x: 15.2, z: 9.0, scale: 0.48 },
    { x: 2.0, z: 42.0, scale: 0.35 },
  ];

  rockCoords.forEach((r, idx) => {
    const geo = new THREE.IcosahedronGeometry(r.scale, 2);
    const pos = geo.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const strata = 1 + 0.16 * Math.sin(vx * 7.5 + idx) + 0.12 * Math.cos(vz * 6.2 - vy * 8.1 + idx * 1.4);
      pos.setXYZ(i, vx * strata, vy * 0.68 * strata, vz * 0.88 * strata);
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, rockMat);
    const ty = getTerrainHeight(r.x, r.z);
    mesh.position.set(r.x, ty + r.scale * 0.28, r.z);
    mesh.rotation.set(idx * 0.5, idx * 1.2, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  // 2. 3 Large Outdoor Turned Terracotta Amphora Planters with Arching Ornamental Fronds
  const terraMat = new THREE.MeshStandardMaterial({
    normalMap: stoneTex.normalMap,
    normalScale: new THREE.Vector2(0.45, 0.45),
    color: '#C56747',
    roughness: 0.82,
  });
  const soilMat = new THREE.MeshStandardMaterial({ color: '#332216', roughness: 0.96 });
  const leafDarkMat = new THREE.MeshStandardMaterial({ color: '#315F38', roughness: 0.72, side: THREE.DoubleSide });
  const leafLightMat = new THREE.MeshStandardMaterial({ color: '#4E7D4A', roughness: 0.68, side: THREE.DoubleSide });

  const planterCoords = [
    { x: 0.9, z: 12.3 },
    { x: 6.1, z: 12.3 },
    { x: 1.2, z: 40.5 },
  ];

  const potProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.16, 0.0),
    new THREE.Vector2(0.18, 0.05),
    new THREE.Vector2(0.24, 0.22),
    new THREE.Vector2(0.26, 0.36),
    new THREE.Vector2(0.23, 0.42),
    new THREE.Vector2(0.265, 0.45),
    new THREE.Vector2(0.23, 0.46),
    new THREE.Vector2(0.21, 0.39),
  ];
  const potGeo = new THREE.LatheGeometry(potProfile, 18);

  planterCoords.forEach((p, idx) => {
    const pGroup = new THREE.Group();
    pGroup.name = `planter-${idx + 1}`;
    const ty = getTerrainHeight(p.x, p.z);
    pGroup.position.set(p.x, ty, p.z);

    const pot = new THREE.Mesh(potGeo, terraMat);
    pot.castShadow = true;
    pot.receiveShadow = true;
    pGroup.add(pot);

    const soil = new THREE.Mesh(new THREE.CircleGeometry(0.21, 14), soilMat);
    soil.rotation.x = -Math.PI / 2;
    soil.position.y = 0.41;
    pGroup.add(soil);

    // 14 arching spear-leaf blades emerging cleanly from soil (Y=0.43) up above pot rim (Y=0.46)
    const innerBladeGeo = buildAgaveLeafBladeGeometry(0.32, 0.052, 0.27, 0.16);
    const outerBladeGeo = buildAgaveLeafBladeGeometry(0.34, 0.056, 0.21, 0.24);
    for (let f = 0; f < 14; f++) {
      const a = (f / 14) * Math.PI * 2 + idx * 0.4;
      const tier = f % 2;
      const blade = new THREE.Mesh(tier === 0 ? innerBladeGeo : outerBladeGeo, tier === 0 ? leafDarkMat : leafLightMat);
      blade.position.set(Math.cos(a) * 0.055, 0.43, Math.sin(a) * 0.055);
      blade.rotation.y = Math.PI / 2 - a;
      blade.castShadow = true;
      pGroup.add(blade);
    }

    group.add(pGroup);
  });

  // 3. 2 Carved Turned Limestone Bird Baths (0.85 m H)
  const bathCoords = [
    { x: -10.5, z: 20.0 },
    { x: 15.5, z: 32.0 },
  ];

  const bathProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.22, 0.0),
    new THREE.Vector2(0.2, 0.06),
    new THREE.Vector2(0.11, 0.14),
    new THREE.Vector2(0.085, 0.45),
    new THREE.Vector2(0.11, 0.68),
    new THREE.Vector2(0.39, 0.78),
    new THREE.Vector2(0.41, 0.84),
    new THREE.Vector2(0.35, 0.84),
    new THREE.Vector2(0.28, 0.77),
    new THREE.Vector2(0.0, 0.75),
  ];
  const birdBathGeo = new THREE.LatheGeometry(bathProfile, 20);

  bathCoords.forEach((b, idx) => {
    const bGroup = new THREE.Group();
    bGroup.name = `bird-bath-${idx + 1}`;
    const ty = getTerrainHeight(b.x, b.z);
    bGroup.position.set(b.x, ty, b.z);

    const carved = new THREE.Mesh(birdBathGeo, rockMat);
    carved.castShadow = true;
    carved.receiveShadow = true;
    bGroup.add(carved);

    const waterDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.33, 18),
      new THREE.MeshStandardMaterial({
        color: '#5CAAD0',
        roughness: 0.06,
        metalness: 0.15,
      })
    );
    waterDisc.rotateX(-Math.PI / 2);
    waterDisc.position.y = 0.815;
    bGroup.add(waterDisc);

    group.add(bGroup);
  });

  // 4. Service Court Helical Garden Hose Reel (PRD Section 5.3)
  const hoseGroup = new THREE.Group();
  hoseGroup.name = 'service-hose-reel';
  const metalStandMat = new THREE.MeshStandardMaterial({ color: '#2B2E2A', metalness: 0.78, roughness: 0.36 });
  for (const dz of [-0.14, 0.14]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.68, 8), metalStandMat);
    post.position.set(7.4, 0.34, -10.5 + dz);
    post.castShadow = true;
    hoseGroup.add(post);
  }
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 8), metalStandMat);
  axle.rotation.x = Math.PI / 2;
  axle.position.set(7.4, 0.58, -10.5);
  hoseGroup.add(axle);

  const hoseMat = new THREE.MeshStandardMaterial({ color: '#2E6B3E', roughness: 0.52 });
  const coilPts = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    const ang = t * Math.PI * 10;
    const cz = -10.5 - 0.1 + t * 0.2;
    coilPts.push(new THREE.Vector3(7.4 + Math.cos(ang) * 0.16, 0.58 + Math.sin(ang) * 0.16, cz));
  }
  const coilCurve = new THREE.CatmullRomCurve3(coilPts);
  const hoseCoil = new THREE.Mesh(new THREE.TubeGeometry(coilCurve, 48, 0.018, 6, false), hoseMat);
  hoseCoil.castShadow = true;
  hoseGroup.add(hoseCoil);
  group.add(hoseGroup);

  // 5. Potting Station: Galvanized Watering Can + Slatted Cedar Crate + Spare Terracotta Pots
  const pottingGroup = new THREE.Group();
  pottingGroup.name = 'potting-tools-station';
  const py = getTerrainHeight(7.6, -12.0);
  pottingGroup.position.set(7.6, py, -12.0);

  const canMat = new THREE.MeshStandardMaterial({ color: '#8A948A', metalness: 0.72, roughness: 0.32 });
  const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.12, 0.24, 14), canMat);
  canBody.position.y = 0.12;
  canBody.castShadow = true;
  pottingGroup.add(canBody);

  const canSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.024, 0.26, 8), canMat);
  canSpout.position.set(0.14, 0.18, 0);
  canSpout.rotation.z = -0.72;
  pottingGroup.add(canSpout);

  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, 0.22, 0),
    new THREE.Vector3(-0.15, 0.14, 0),
    new THREE.Vector3(-0.09, 0.05, 0),
  ]);
  pottingGroup.add(new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 8, 0.008, 6, false), canMat));

  const crateTex = typeof document !== 'undefined' ? getTimberTextures('teak', 1, 1) : { map: null };
  const crateMat = new THREE.MeshStandardMaterial({ map: crateTex.map, color: '#8A6442', roughness: 0.78 });
  const crateBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.3), crateMat);
  crateBase.position.set(0.38, 0.015, 0);
  pottingGroup.add(crateBase);
  for (const sy of [0.06, 0.12]) {
    for (const dz of [-0.14, 0.14]) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.02), crateMat);
      slat.position.set(0.38, sy, dz);
      pottingGroup.add(slat);
    }
  }
  const smallPot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.055, 0.13, 12), terraMat);
  smallPot.position.set(0.36, 0.095, 0);
  pottingGroup.add(smallPot);

  group.add(pottingGroup);

  return group;
}

/**
 * 16 Multi-Clump Botanical Garden Shrubs scattered naturally in planting zones (0.45 - 0.9 m H).
 */
function buildGardenShrubs(foliagePbr) {
  const shrubGroup = new THREE.Group();
  shrubGroup.name = 'garden-shrubs';

  const shrubCoords = [
    { x: -5.0, z: 18.0, h: 0.65, col: '#4A7A4E', bloom: '#E69EA8' },
    { x: 11.8, z: 18.0, h: 0.72, col: '#69945B' },
    { x: -5.2, z: 26.5, h: 0.58, col: '#69945B', bloom: '#F1DFA0' },
    { x: 12.0, z: 26.5, h: 0.68, col: '#4A7A4E' },
    { x: -5.4, z: 34.0, h: 0.75, col: '#4A7A4E' },
    { x: 12.2, z: 34.0, h: 0.62, col: '#69945B', bloom: '#DF8E99' },
    { x: -1.0, z: 41.5, h: 0.7, col: '#69945B' },
    { x: 8.0, z: 41.5, h: 0.65, col: '#4A7A4E' },
    { x: -16.5, z: 12.0, h: 0.82, col: '#4A7A4E' },
    { x: 16.5, z: 12.0, h: 0.78, col: '#69945B', bloom: '#F5E7CE' },
    { x: -19.0, z: 22.0, h: 0.85, col: '#4A7A4E' },
    { x: 19.0, z: 22.0, h: 0.8, col: '#69945B' },
    { x: -14.5, z: -8.0, h: 0.75, col: '#69945B', bloom: '#8FC0E4' },
    { x: -2.0, z: -18.0, h: 0.7, col: '#4A7A4E' },
    { x: 10.5, z: -16.0, h: 0.68, col: '#69945B' },
    { x: 20.0, z: -12.0, h: 0.82, col: '#4A7A4E', bloom: '#E69EA8' },
  ];

  const leafMatCache = new Map();
  const bloomMatCache = new Map();

  shrubCoords.forEach((s, idx) => {
    const sNode = new THREE.Group();
    const ty = getTerrainHeight(s.x, s.z);
    sNode.position.set(s.x, ty, s.z);
    sNode.rotation.y = idx * 0.7;

    let mat = leafMatCache.get(s.col);
    if (!mat) {
      mat = new THREE.MeshStandardMaterial({
        map: foliagePbr.map,
        normalMap: foliagePbr.normalMap,
        normalScale: new THREE.Vector2(0.75, 0.75),
        roughnessMap: foliagePbr.roughnessMap,
        color: s.col,
        vertexColors: true,
        roughness: 0.82,
      });
      leafMatCache.set(s.col, mat);
    }
    const parts = [createFoliageBlobGeo(s.h * 0.42, s.h * 0.36, s.h * 0.42, 0, s.h * 0.32, 0, idx + 3, 2)];
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + idx * 0.3;
      const dist = s.h * 0.34;
      const rad = s.h * (0.28 + (k % 2) * 0.06);
      parts.push(createFoliageBlobGeo(rad, rad * 0.85, rad, Math.cos(a) * dist, s.h * 0.25, Math.sin(a) * dist, idx * 9 + k, 2));
    }
    const mergedGeo = safeMerge(parts);
    parts.forEach((g) => g.dispose());
    const mesh = new THREE.Mesh(mergedGeo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    sNode.add(mesh);

    if (s.bloom) {
      let bloomMat = bloomMatCache.get(s.bloom);
      if (!bloomMat) {
        bloomMat = new THREE.MeshStandardMaterial({ color: s.bloom, roughness: 0.58 });
        bloomMatCache.set(s.bloom, bloomMat);
      }
      const bParts = [];
      for (let b = 0; b < 9; b++) {
        const a = b * 0.72 + idx;
        bParts.push(
          createFoliageBlobGeo(
            0.036,
            0.03,
            0.036,
            Math.cos(a) * s.h * 0.44,
            s.h * (0.28 + (b % 3) * 0.09),
            Math.sin(a) * s.h * 0.44,
            b,
            0
          )
        );
      }
      const bGeo = safeMerge(bParts);
      bParts.forEach((g) => g.dispose());
      sNode.add(new THREE.Mesh(bGeo, bloomMat));
    }

    shrubGroup.add(sNode);
  });

  return shrubGroup;
}

/**
 * Creates Trees, Benches, Pathway Lanterns, Shrubs, and Garden Props.
 * Returns group, colliders, pathLights array, and animation update handler.
 */
export function createTreesAndProps() {
  const masterGroup = new THREE.Group();
  masterGroup.name = 'trees-and-props';

  const colliders = [];
  const treeObjects = [];
  const benchObjects = [];
  const pathLights = [];

  // Shared tree materials (avoids rebuilding identical bark & foliage materials across 10 trees)
  const barkPbr = typeof document !== 'undefined'
    ? getTreeBarkTextures(2, 4)
    : { map: null, normalMap: null, roughnessMap: null };
  const foliagePbr = typeof document !== 'undefined'
    ? getFoliageTexture(3, 3)
    : { map: null, normalMap: null, roughnessMap: null };
  const barkMat = new THREE.MeshStandardMaterial({
    map: barkPbr.map,
    normalMap: barkPbr.normalMap,
    normalScale: new THREE.Vector2(1.15, 1.15),
    roughnessMap: barkPbr.roughnessMap,
    color: '#73543E',
    roughness: 0.9,
    metalness: 0.02,
  });
  const leafPairCache = new Map();
  const blossomMatCache = new Map();
  const whiteCol = new THREE.Color('#ffffff');
  const sharedTreeMats = {
    barkMat,
    getLeafPair: (leafColor) => {
      let pair = leafPairCache.get(leafColor);
      if (!pair) {
        // Lift tint slightly toward white so foliagePbr.map + vertex AO keep lush sunlit greens
        const baseLeafCol = new THREE.Color(leafColor).lerp(whiteCol, 0.26);
        const deepLeafCol = baseLeafCol.clone().multiplyScalar(0.8);
        pair = {
          leafMat: new THREE.MeshStandardMaterial({
            map: foliagePbr.map,
            normalMap: foliagePbr.normalMap,
            normalScale: new THREE.Vector2(0.85, 0.85),
            roughnessMap: foliagePbr.roughnessMap,
            color: baseLeafCol,
            vertexColors: true,
            roughness: 0.78,
            metalness: 0.02,
            side: THREE.DoubleSide,
          }),
          deepLeafMat: new THREE.MeshStandardMaterial({
            map: foliagePbr.map,
            normalMap: foliagePbr.normalMap,
            normalScale: new THREE.Vector2(0.75, 0.75),
            roughnessMap: foliagePbr.roughnessMap,
            color: deepLeafCol,
            vertexColors: true,
            roughness: 0.86,
            metalness: 0.02,
            side: THREE.DoubleSide,
          }),
        };
        leafPairCache.set(leafColor, pair);
      }
      return pair;
    },
    getBlossomMat: (blossomColor) => {
      let mat = blossomMatCache.get(blossomColor);
      if (!mat) {
        mat = new THREE.MeshStandardMaterial({
          color: blossomColor,
          vertexColors: true,
          roughness: 0.58,
        });
        blossomMatCache.set(blossomColor, mat);
      }
      return mat;
    },
  };

  // 1. Build and position 10 specimen trees
  TREE_SPECS.forEach((spec) => {
    const tree = buildTreeMesh(spec, sharedTreeMats);
    const ty = getTerrainHeight(spec.x, spec.z);
    tree.position.set(spec.x, ty, spec.z);
    masterGroup.add(tree);
    treeObjects.push(tree);

    // Cylinder trunk collider for player navigation safety
    colliders.push({
      id: `collider-${spec.id}`,
      type: 'cylinder',
      x: spec.x,
      z: spec.z,
      radius: spec.trunkRadius + 0.1,
      minY: ty,
      maxY: ty + spec.height,
    });
  });

  // Shared bench materials across 4 benches
  const benchStoneTex = typeof document !== 'undefined'
    ? getStoneTileTextures('foyer', 2, 2)
    : { map: null, normalMap: null, roughnessMap: null };
  const benchTimberPair = typeof document !== 'undefined'
    ? getTimberTextures('sandalwood', 2, 1)
    : { map: null, normalMap: null, roughnessMap: null };
  const sharedBenchMats = {
    stoneMat: new THREE.MeshStandardMaterial({
      map: benchStoneTex.map,
      normalMap: benchStoneTex.normalMap,
      normalScale: new THREE.Vector2(0.75, 0.75),
      roughnessMap: benchStoneTex.roughnessMap,
      color: '#D4C6B0',
      roughness: 0.82,
    }),
    woodMat: new THREE.MeshStandardMaterial({
      map: benchTimberPair.map,
      normalMap: benchTimberPair.normalMap,
      normalScale: new THREE.Vector2(0.65, 0.65),
      roughnessMap: benchTimberPair.roughnessMap,
      color: '#A8794D',
      roughness: 0.68,
    }),
    bronzeMat: new THREE.MeshStandardMaterial({
      color: '#2B241E',
      metalness: 0.82,
      roughness: 0.35,
    }),
  };

  // 2. Build and position 4 carved garden benches
  BENCH_CONFIGS.forEach((config) => {
    const bench = buildBenchMesh(config, sharedBenchMats);
    const ty = getTerrainHeight(config.x, config.z);
    bench.position.set(config.x, ty, config.z);
    bench.rotation.y = config.rotY;
    masterGroup.add(bench);
    benchObjects.push(bench);

    // AABB collider for each bench
    colliders.push({
      id: `collider-${config.id}`,
      type: 'box',
      minX: config.x - 0.8,
      maxX: config.x + 0.8,
      minZ: config.z - 0.4,
      maxZ: config.z + 0.4,
      minY: ty,
      maxY: ty + 0.9,
    });
  });

  // Shared lantern materials & geometries across 10 pathway bollards
  const lanternMetalPbr = typeof document !== 'undefined'
    ? getBrushedMetalTextures('#2B241E', 2, 2)
    : { normalMap: null, roughnessMap: null };
  const sharedLantern = {
    bronzeMat: new THREE.MeshStandardMaterial({
      normalMap: lanternMetalPbr.normalMap,
      normalScale: new THREE.Vector2(0.4, 0.4),
      roughnessMap: lanternMetalPbr.roughnessMap,
      color: '#2B241E',
      metalness: 0.84,
      roughness: 0.36,
    }),
    plinthGeo: new THREE.CylinderGeometry(0.088, 0.098, 0.04, 12),
    baseGeo: new THREE.CylinderGeometry(0.06, 0.078, 0.22, 12),
    coreGeo: new THREE.CylinderGeometry(0.048, 0.048, 0.14, 12),
    strutGeo: new THREE.CylinderGeometry(0.006, 0.006, 0.15, 6),
    capGeo: new THREE.ConeGeometry(0.095, 0.068, 12),
    poolDiscGeo: new THREE.CircleGeometry(0.68, 16),
  };

  // 3. Build and position 10 pathway bollard lanterns
  PATH_LANTERN_CONFIGS.forEach((cfg, idx) => {
    const lantern = buildPathLantern(cfg, idx, sharedLantern);
    const ty = 0.03; // path elevation is +0.03 m
    lantern.position.set(cfg.x, ty, cfg.z);
    masterGroup.add(lantern);
    pathLights.push(lantern);
  });

  // 4. Decorative garden props (boulders, planters, bird baths, hose, potting tools)
  const decorativeProps = buildDecorativeGardenProps();
  masterGroup.add(decorativeProps);

  // 5. Garden shrubs
  const shrubs = buildGardenShrubs(foliagePbr);
  masterGroup.add(shrubs);

  // Day/Night luminaire emissive transition
  function setNightFactor(factor = 0.0) {
    // factor 0 = day (emissive 0.1), factor 0.5 = sunset (0.6), factor 1 = night (1.2)
    const intensity = factor < 0.2 ? 0.05 : factor < 0.6 ? 0.6 : 1.2;
    pathLights.forEach((l) => {
      if (l.userData && l.userData.setIntensity) {
        l.userData.setIntensity(intensity);
      }
    });
  }

  // Animation update for subtle tree canopy breeze sway
  function update(delta, elapsed = 0) {
    const time = elapsed || 0;
    treeObjects.forEach((tree, idx) => {
      if (tree.userData && tree.userData.crown) {
        const sway = Math.sin(time * 0.8 + idx * 1.1) * 0.015;
        tree.userData.crown.rotation.z = sway;
      }
    });
  }

  return {
    group: masterGroup,
    trees: treeObjects,
    benches: benchObjects,
    pathLights,
    colliders,
    setNightFactor,
    update,
  };
}

export const TreesAndProps = {
  createTreesAndProps,
  TREE_SPECS,
  BENCH_CONFIGS,
  PATH_LANTERN_CONFIGS,
};
