import * as THREE from 'three';
import { getTerrainHeight } from '../house/HouseArchitecture.js';
import { getTreeBarkTexture, getTimberTextures, getStoneTileTextures } from '../assets/procedural/TextureGenerator.js';

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
  { id: 'bench-arrival', x: 3.5, z: 42.5, rotY: 0, label: 'Arrival Garden Bench' },
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
 * Procedural Tree Builder creating branching trunks and tiered organic canopies.
 */
function buildTreeMesh(spec) {
  const treeGroup = new THREE.Group();
  treeGroup.name = spec.id;

  const barkTex = typeof document !== 'undefined' ? getTreeBarkTexture() : null;
  const barkMat = new THREE.MeshStandardMaterial({
    map: barkTex,
    color: '#6D503A',
    roughness: 0.82,
    metalness: 0.05,
  });

  const leafMat = new THREE.MeshStandardMaterial({
    color: spec.leafColor,
    roughness: 0.72,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const trunkH = spec.height * 0.42; // trunk before branches ~1.8 - 2.5 m
  const trunkGeo = new THREE.CylinderGeometry(spec.trunkRadius * 0.75, spec.trunkRadius * 1.25, trunkH, 10);
  trunkGeo.translate(0, trunkH * 0.5, 0);

  const trunk = new THREE.Mesh(trunkGeo, barkMat);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  treeGroup.add(trunk);

  // Primary fork branches
  const branchCount = spec.type === 'shade' ? 4 : 3;
  for (let b = 0; b < branchCount; b++) {
    const ang = (b / branchCount) * Math.PI * 2 + b * 0.2;
    const bLen = spec.height * 0.28;
    const bGeo = new THREE.CylinderGeometry(spec.trunkRadius * 0.35, spec.trunkRadius * 0.6, bLen, 6);
    bGeo.translate(0, bLen * 0.5, 0);

    const branch = new THREE.Mesh(bGeo, barkMat);
    branch.position.set(0, trunkH * 0.9, 0);
    branch.rotation.y = ang;
    branch.rotation.z = spec.type === 'shade' ? 0.48 : 0.32;
    branch.castShadow = true;
    treeGroup.add(branch);
  }

  // Tiered foliage clusters
  const crownGroup = new THREE.Group();
  crownGroup.position.y = trunkH * 0.95;

  if (spec.type === 'shade') {
    // Broad spreading canopy with 6 overlapping organic cluster domes
    const clusters = [
      { x: 0, y: spec.height * 0.35, z: 0, r: spec.crownRadius * 0.95, sy: 0.75 },
      { x: -spec.crownRadius * 0.5, y: spec.height * 0.22, z: spec.crownRadius * 0.3, r: spec.crownRadius * 0.75, sy: 0.7 },
      { x: spec.crownRadius * 0.5, y: spec.height * 0.24, z: -spec.crownRadius * 0.25, r: spec.crownRadius * 0.78, sy: 0.7 },
      { x: spec.crownRadius * 0.25, y: spec.height * 0.28, z: spec.crownRadius * 0.45, r: spec.crownRadius * 0.7, sy: 0.72 },
      { x: -spec.crownRadius * 0.35, y: spec.height * 0.25, z: -spec.crownRadius * 0.4, r: spec.crownRadius * 0.72, sy: 0.7 },
      { x: 0, y: spec.height * 0.48, z: 0, r: spec.crownRadius * 0.65, sy: 0.65 },
    ];

    clusters.forEach((c) => {
      const geo = new THREE.DodecahedronGeometry(c.r, 1);
      geo.scale(1, c.sy, 1);
      const mesh = new THREE.Mesh(geo, leafMat);
      mesh.position.set(c.x, c.y, c.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      crownGroup.add(mesh);
    });
  } else if (spec.type === 'ornamental') {
    // Slender tiered conical canopy
    const tiers = 4;
    for (let t = 0; t < tiers; t++) {
      const r = spec.crownRadius * (1.0 - t * 0.18);
      const ty = t * (spec.height * 0.16);
      const geo = new THREE.ConeGeometry(r, spec.height * 0.28, 8);
      geo.translate(0, spec.height * 0.14, 0);
      const mesh = new THREE.Mesh(geo, leafMat);
      mesh.position.y = ty;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      crownGroup.add(mesh);
    }
  } else {
    // Flowering tree with blossom clusters
    const clusters = [
      { x: 0, y: spec.height * 0.28, z: 0, r: spec.crownRadius * 0.85 },
      { x: -spec.crownRadius * 0.4, y: spec.height * 0.2, z: 0.2, r: spec.crownRadius * 0.65 },
      { x: spec.crownRadius * 0.4, y: spec.height * 0.22, z: -0.2, r: spec.crownRadius * 0.65 },
    ];
    clusters.forEach((c) => {
      const geo = new THREE.IcosahedronGeometry(c.r, 1);
      const mesh = new THREE.Mesh(geo, leafMat);
      mesh.position.set(c.x, c.y, c.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      crownGroup.add(mesh);
    });

    if (spec.blossomColor) {
      const blossomMat = new THREE.MeshStandardMaterial({
        color: spec.blossomColor,
        roughness: 0.65,
      });
      // Small decorative blossom accents scattered on outer crown
      for (let i = 0; i < 18; i++) {
        const bGeo = new THREE.SphereGeometry(0.08, 4, 4);
        const bMesh = new THREE.Mesh(bGeo, blossomMat);
        const ang = i * 1.35;
        const dist = spec.crownRadius * (0.6 + (i % 3) * 0.15);
        bMesh.position.set(
          Math.cos(ang) * dist,
          spec.height * (0.18 + (i % 4) * 0.08),
          Math.sin(ang) * dist
        );
        crownGroup.add(bMesh);
      }
    }
  }

  treeGroup.add(crownGroup);
  treeGroup.userData.crown = crownGroup;

  return treeGroup;
}

/**
 * Builds a carved stone & sandalwood timber bench (1.50 m W x 0.55 m D x 0.85 m H).
 */
function buildBenchMesh(config) {
  const benchGroup = new THREE.Group();
  benchGroup.name = config.id;

  const stoneTex = typeof document !== 'undefined' ? getStoneTileTextures('foyer', 2, 2) : { map: null };
  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex.map,
    color: '#D4C6B0',
    roughness: 0.85,
  });

  const timberPair = typeof document !== 'undefined'
    ? getTimberTextures('sandalwood', 2, 1)
    : { map: null, bumpMap: null };
  const woodMat = new THREE.MeshStandardMaterial({
    map: timberPair.map,
    bumpMap: timberPair.bumpMap,
    bumpScale: 0.02,
    color: '#A8794D',
    roughness: 0.75,
  });

  // 1. Dual carved stone pedestal legs
  const legW = 0.12;
  const legD = 0.48;
  const legH = 0.42;

  const legLeft = new THREE.Mesh(new THREE.BoxGeometry(legW, legH, legD), stoneMat);
  legLeft.position.set(-0.62, legH * 0.5, 0);
  legLeft.castShadow = true;
  legLeft.receiveShadow = true;
  benchGroup.add(legLeft);

  const legRight = new THREE.Mesh(new THREE.BoxGeometry(legW, legH, legD), stoneMat);
  legRight.position.set(0.62, legH * 0.5, 0);
  legRight.castShadow = true;
  legRight.receiveShadow = true;
  benchGroup.add(legRight);

  // 2. Sandalwood timber slatted seat (1.50 m W x 0.52 m D)
  const seatSlats = 5;
  const slatW = 1.5;
  const slatD = 0.085;
  const slatH = 0.035;

  for (let s = 0; s < seatSlats; s++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(slatW, slatH, slatD), woodMat);
    const sz = -0.2 + s * (slatD + 0.015);
    slat.position.set(0, legH + slatH * 0.5, sz);
    slat.castShadow = true;
    slat.receiveShadow = true;
    benchGroup.add(slat);
  }

  // 3. Slatted Backrest (up to 0.85 m total height)
  const backSlats = 3;
  for (let b = 0; b < backSlats; b++) {
    const bSlat = new THREE.Mesh(new THREE.BoxGeometry(slatW, 0.08, 0.03), woodMat);
    const by = legH + 0.15 + b * 0.11;
    bSlat.position.set(0, by, -0.24);
    bSlat.rotation.x = -0.08; // gentle ergonomic back tilt
    bSlat.castShadow = true;
    benchGroup.add(bSlat);
  }

  // 4. Backrest support posts
  const postGeo = new THREE.BoxGeometry(0.04, 0.45, 0.04);
  postGeo.rotateX(-0.08);
  const postL = new THREE.Mesh(postGeo, woodMat);
  postL.position.set(-0.62, legH + 0.22, -0.22);
  benchGroup.add(postL);

  const postR = new THREE.Mesh(postGeo, woodMat);
  postR.position.set(0.62, legH + 0.22, -0.22);
  benchGroup.add(postR);

  // Interaction user data for sitting
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
 * Builds a low pathway bollard luminaire (0.45 m tall, bronze base, warm glowing core).
 */
function buildPathLantern(config) {
  const lanternGroup = new THREE.Group();
  lanternGroup.name = config.id;

  // Dark bronze metal stanchion
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: '#2B241E',
    metalness: 0.82,
    roughness: 0.38,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 0.25, 8), bronzeMat);
  base.position.y = 0.125;
  base.castShadow = true;
  lanternGroup.add(base);

  // Warm luminous glass core (2700 K warm amber)
  const glowMat = new THREE.MeshStandardMaterial({
    color: '#FFD488',
    emissive: '#FFB850',
    emissiveIntensity: 0.85,
    roughness: 0.2,
  });

  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 8), glowMat);
  core.position.y = 0.32;
  lanternGroup.add(core);

  // Top bronze protective hood
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.07, 8), bronzeMat);
  cap.position.y = 0.42;
  cap.castShadow = true;
  lanternGroup.add(cap);

  lanternGroup.userData = {
    glowMat,
    setIntensity: (val) => {
      glowMat.emissiveIntensity = val;
    },
  };

  return lanternGroup;
}

/**
 * Builds decorative garden props: natural granite boulders, planters, bird baths, hose reel.
 */
function buildDecorativeGardenProps() {
  const group = new THREE.Group();
  group.name = 'decorative-props';

  // 1. 7 Natural Granite Boulders (0.25 - 0.55 m across)
  const rockMat = new THREE.MeshStandardMaterial({
    color: '#8E887E',
    roughness: 0.88,
    metalness: 0.05,
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
    const geo = new THREE.DodecahedronGeometry(r.scale, 1);
    geo.scale(1.0, 0.7, 0.85);
    const mesh = new THREE.Mesh(geo, rockMat);
    const ty = getTerrainHeight(r.x, r.z);
    mesh.position.set(r.x, ty + r.scale * 0.35, r.z);
    mesh.rotation.set(idx * 0.7, idx * 1.2, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  // 2. 3 Large Outdoor Terracotta Planters (0.45 m H x 0.50 m dia) with dwarf boxwood foliage
  const terraMat = new THREE.MeshStandardMaterial({
    color: '#C86A4B',
    roughness: 0.85,
  });
  const bushMat = new THREE.MeshStandardMaterial({
    color: '#3B6B3D',
    roughness: 0.75,
  });

  const planterCoords = [
    { x: 0.9, z: 12.3 }, // Left of front porch entry
    { x: 6.1, z: 12.3 }, // Right of front porch entry
    { x: 1.2, z: 40.5 }, // Arrival plaza accent
  ];

  planterCoords.forEach((p, idx) => {
    const pGroup = new THREE.Group();
    pGroup.name = `planter-${idx + 1}`;
    const ty = getTerrainHeight(p.x, p.z);
    pGroup.position.set(p.x, ty, p.z);

    // Terracotta pot
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.18, 0.45, 12), terraMat);
    pot.position.y = 0.225;
    pot.castShadow = true;
    pot.receiveShadow = true;
    pGroup.add(pot);

    // Trimmed sphere boxwood
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), bushMat);
    bush.position.y = 0.52;
    bush.castShadow = true;
    pGroup.add(bush);

    group.add(pGroup);
  });

  // 3. 2 Carved Stone Bird Baths / Sculptural Water Basins (0.85 m H)
  const bathCoords = [
    { x: -10.5, z: 20.0 },
    { x: 15.5, z: 32.0 },
  ];

  bathCoords.forEach((b, idx) => {
    const bGroup = new THREE.Group();
    bGroup.name = `bird-bath-${idx + 1}`;
    const ty = getTerrainHeight(b.x, b.z);
    bGroup.position.set(b.x, ty, b.z);

    // Stone pedestal & fluted base
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 0.75, 8), rockMat);
    ped.position.y = 0.375;
    ped.castShadow = true;
    bGroup.add(ped);

    // Shallow circular basin
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.22, 0.12, 16), rockMat);
    basin.position.y = 0.78;
    basin.castShadow = true;
    bGroup.add(basin);

    // Water reflective disc
    const waterDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.32, 16),
      new THREE.MeshStandardMaterial({
        color: '#4FA2C8',
        roughness: 0.08,
        metalness: 0.1,
      })
    );
    waterDisc.rotateX(-Math.PI / 2);
    waterDisc.position.y = 0.82;
    bGroup.add(waterDisc);

    group.add(bGroup);
  });

  // 4. Garden Hose Reel near Service Court (PRD Section 5.3)
  const hoseGroup = new THREE.Group();
  hoseGroup.name = 'service-hose-reel';
  const hoseY = 0.6;
  const hoseStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.65, 6),
    new THREE.MeshStandardMaterial({ color: '#2B2E2A', metalness: 0.7 })
  );
  hoseStand.position.set(7.4, 0.325, -10.5);
  hoseGroup.add(hoseStand);

  // Circular hose drum with coiled green hose
  const drum = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.045, 8, 16),
    new THREE.MeshStandardMaterial({ color: '#2E663B', roughness: 0.6 })
  );
  drum.position.set(7.4, hoseY, -10.5);
  drum.rotation.y = Math.PI / 2;
  hoseGroup.add(drum);
  group.add(hoseGroup);

  // 5. Potting Station: Watering Can and neat gardening tool set
  const pottingGroup = new THREE.Group();
  pottingGroup.name = 'potting-tools-station';
  const py = getTerrainHeight(7.6, -12.0);
  pottingGroup.position.set(7.6, py, -12.0);

  // Zinc watering can
  const canMat = new THREE.MeshStandardMaterial({ color: '#7E8A7F', metalness: 0.65, roughness: 0.35 });
  const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.24, 10), canMat);
  canBody.position.y = 0.12;
  pottingGroup.add(canBody);

  const canSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.26, 6), canMat);
  canSpout.position.set(0.14, 0.18, 0);
  canSpout.rotation.z = -0.7;
  pottingGroup.add(canSpout);

  // Wooden potting crate
  const crateMat = new THREE.MeshStandardMaterial({ color: '#886241', roughness: 0.8 });
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.15, 0.3), crateMat);
  crate.position.set(0.35, 0.075, 0);
  pottingGroup.add(crate);

  group.add(pottingGroup);

  return group;
}

/**
 * 16 Sculpted Garden Shrubs scattered naturally in planting zones (0.45 - 0.9 m H).
 */
function buildGardenShrubs() {
  const shrubGroup = new THREE.Group();
  shrubGroup.name = 'garden-shrubs';

  const shrubCoords = [
    { x: -5.0, z: 18.0, h: 0.65, col: '#315B3A' },
    { x: 11.8, z: 18.0, h: 0.72, col: '#52784A' },
    { x: -5.2, z: 26.5, h: 0.58, col: '#52784A' },
    { x: 12.0, z: 26.5, h: 0.68, col: '#315B3A' },
    { x: -5.4, z: 34.0, h: 0.75, col: '#315B3A' },
    { x: 12.2, z: 34.0, h: 0.62, col: '#52784A' },
    { x: -1.0, z: 41.5, h: 0.7, col: '#52784A' },
    { x: 8.0, z: 41.5, h: 0.65, col: '#315B3A' },
    { x: -16.5, z: 12.0, h: 0.82, col: '#315B3A' },
    { x: 16.5, z: 12.0, h: 0.78, col: '#52784A' },
    { x: -19.0, z: 22.0, h: 0.85, col: '#315B3A' },
    { x: 19.0, z: 22.0, h: 0.8, col: '#52784A' },
    { x: -14.5, z: -8.0, h: 0.75, col: '#52784A' },
    { x: -2.0, z: -18.0, h: 0.7, col: '#315B3A' },
    { x: 10.5, z: -16.0, h: 0.68, col: '#52784A' },
    { x: 20.0, z: -12.0, h: 0.82, col: '#315B3A' },
  ];

  shrubCoords.forEach((s, idx) => {
    const mat = new THREE.MeshStandardMaterial({
      color: s.col,
      roughness: 0.8,
    });
    const geo = new THREE.DodecahedronGeometry(s.h * 0.6, 1);
    geo.scale(1.2, 0.85, 1.1);
    const mesh = new THREE.Mesh(geo, mat);
    const ty = getTerrainHeight(s.x, s.z);
    mesh.position.set(s.x, ty + s.h * 0.45, s.z);
    mesh.rotation.y = idx * 0.6;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    shrubGroup.add(mesh);
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

  // 1. Build and position 10 specimen trees
  TREE_SPECS.forEach((spec) => {
    const tree = buildTreeMesh(spec);
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

  // 2. Build and position 4 carved garden benches
  BENCH_CONFIGS.forEach((config) => {
    const bench = buildBenchMesh(config);
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

  // 3. Build and position 10 pathway bollard lanterns
  PATH_LANTERN_CONFIGS.forEach((cfg) => {
    const lantern = buildPathLantern(cfg);
    const ty = 0.03; // path elevation is +0.03 m
    lantern.position.set(cfg.x, ty, cfg.z);
    masterGroup.add(lantern);
    pathLights.push(lantern);
  });

  // 4. Decorative garden props (boulders, planters, bird baths, hose, potting tools)
  const decorativeProps = buildDecorativeGardenProps();
  masterGroup.add(decorativeProps);

  // 5. Garden shrubs
  const shrubs = buildGardenShrubs();
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
