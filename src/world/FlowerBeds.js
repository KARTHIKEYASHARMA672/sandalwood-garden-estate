import * as THREE from 'three';
import { getTerrainHeight } from '../house/HouseArchitecture.js';
import { getSoilTexture, getTimberTextures } from '../assets/procedural/TextureGenerator.js';

/**
 * Botanical Flower Varieties configuration per PRD Section 4.2
 */
export const FLOWER_VARIETIES = {
  daisy: {
    id: 'daisy',
    name: 'Daisy',
    minHeight: 0.28,
    maxHeight: 0.42,
    headDiameter: 0.08,
    petalCount: 12,
    petalDimensions: { length: 0.035, width: 0.012, thickness: 0.002 },
    petalColors: ['#FFF4D6'],
    centerColor: '#E7B63D',
    stemColor: '#3D7545',
    stemRadius: 0.003,
  },
  rose: {
    id: 'rose',
    name: 'Rose',
    minHeight: 0.35,
    maxHeight: 0.65,
    headDiameter: 0.09,
    petalCount: 24,
    petalDimensions: { length: 0.04, width: 0.025, thickness: 0.0025 },
    petalColors: ['#D9899C', '#A83D52'],
    centerColor: '#8B3448',
    stemColor: '#315F3D',
    stemRadius: 0.004,
  },
  tulip: {
    id: 'tulip',
    name: 'Tulip',
    minHeight: 0.3,
    maxHeight: 0.5,
    headDiameter: 0.07,
    petalCount: 6,
    petalDimensions: { length: 0.075, width: 0.035, thickness: 0.002 },
    petalColors: ['#F07863', '#F3C84B', '#9477C6'],
    centerColor: '#E06B58',
    stemColor: '#47764A',
    stemRadius: 0.004,
  },
  sunflower: {
    id: 'sunflower',
    name: 'Sunflower',
    minHeight: 0.7,
    maxHeight: 1.2,
    headDiameter: 0.22,
    petalCount: 24,
    petalDimensions: { length: 0.1, width: 0.028, thickness: 0.003 },
    petalColors: ['#F4C542'],
    centerColor: '#68452C',
    stemColor: '#376C3D',
    stemRadius: 0.012,
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender',
    minHeight: 0.35,
    maxHeight: 0.55,
    headDiameter: 0.035,
    floretCount: 28,
    floretColor: '#8D75B8',
    centerColor: '#8D75B8',
    stemColor: '#4B7047',
    stemRadius: 0.003,
  },
  hydrangea: {
    id: 'hydrangea',
    name: 'Hydrangea',
    minHeight: 0.35,
    maxHeight: 0.6,
    headDiameter: 0.14,
    floretCount: 26,
    petalColors: ['#7EA8D8', '#DFA5B6'],
    centerColor: '#6D97C7',
    stemColor: '#3F7048',
    stemRadius: 0.005,
  },
  marigold: {
    id: 'marigold',
    name: 'Marigold',
    minHeight: 0.25,
    maxHeight: 0.45,
    headDiameter: 0.07,
    petalCount: 32,
    petalDimensions: { length: 0.03, width: 0.015, thickness: 0.002 },
    petalColors: ['#E98732'],
    centerColor: '#A94D21',
    stemColor: '#3B6B3D',
    stemRadius: 0.004,
  },
};

/**
 * 12 Principal Flower Bed Layouts per PRD Section 4.1:
 * - 4 beds left of main path
 * - 4 beds right of main path
 * - 2 beds near arrival / start area
 * - 2 beds around outer garden perimeter
 */
export const FLOWER_BED_LAYOUTS = [
  // 4 beds left of main path (path is at X = 3.5, width 2.4, so left clear zone is X <= 2.0)
  {
    id: 'bed-left-1',
    x: -1.2,
    z: 16.5,
    width: 3.0,
    depth: 1.5,
    rotY: 0.05,
    varieties: ['rose', 'daisy', 'lavender'],
  },
  {
    id: 'bed-left-2',
    x: -1.5,
    z: 22.8,
    width: 3.0,
    depth: 1.5,
    rotY: -0.04,
    varieties: ['tulip', 'hydrangea', 'marigold'],
  },
  {
    id: 'bed-left-3',
    x: -1.3,
    z: 29.2,
    width: 3.0,
    depth: 1.5,
    rotY: 0.03,
    varieties: ['daisy', 'rose', 'marigold'],
  },
  {
    id: 'bed-left-4',
    x: -1.6,
    z: 35.5,
    width: 3.0,
    depth: 1.5,
    rotY: -0.06,
    varieties: ['lavender', 'tulip', 'hydrangea'],
  },

  // 4 beds right of main path (path right edge is X = 4.7, right clear zone is X >= 5.0)
  {
    id: 'bed-right-1',
    x: 8.2,
    z: 16.5,
    width: 3.0,
    depth: 1.5,
    rotY: -0.05,
    varieties: ['rose', 'marigold', 'daisy'],
  },
  {
    id: 'bed-right-2',
    x: 8.5,
    z: 22.8,
    width: 3.0,
    depth: 1.5,
    rotY: 0.04,
    varieties: ['hydrangea', 'lavender', 'tulip'],
  },
  {
    id: 'bed-right-3',
    x: 8.3,
    z: 29.2,
    width: 3.0,
    depth: 1.5,
    rotY: -0.03,
    varieties: ['tulip', 'rose', 'daisy'],
  },
  {
    id: 'bed-right-4',
    x: 8.6,
    z: 35.5,
    width: 3.0,
    depth: 1.5,
    rotY: 0.06,
    varieties: ['marigold', 'hydrangea', 'lavender'],
  },

  // 2 beds near arrival / character start area (Z = 41.5..43.5)
  {
    id: 'bed-start-left',
    x: -2.2,
    z: 42.0,
    width: 3.2,
    depth: 1.6,
    rotY: 0.12,
    varieties: ['rose', 'daisy', 'tulip'],
  },
  {
    id: 'bed-start-right',
    x: 9.2,
    z: 42.0,
    width: 3.2,
    depth: 1.6,
    rotY: -0.12,
    varieties: ['lavender', 'marigold', 'hydrangea'],
  },

  // 2 beds around outer garden perimeter (sunflower feature beds, clear of path view)
  {
    id: 'bed-perim-west',
    x: -22.0,
    z: 26.0,
    width: 3.4,
    depth: 1.8,
    rotY: 0.25,
    varieties: ['sunflower', 'marigold', 'hydrangea'],
  },
  {
    id: 'bed-perim-east',
    x: 24.0,
    z: 26.0,
    width: 3.4,
    depth: 1.8,
    rotY: -0.22,
    varieties: ['sunflower', 'rose', 'tulip'],
  },
];

/**
 * Creates curved petal geometry with gentle parabolic curvature (PRD Section 4.3).
 */
function createCurvedPetalGeometry(length, width, thickness = 0.002, curveDepth = 0.008) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(width * 0.5, length * 0.4, width * 0.4, length * 0.85);
  shape.quadraticCurveTo(width * 0.2, length, 0, length);
  shape.quadraticCurveTo(-width * 0.2, length, -width * 0.4, length * 0.85);
  shape.quadraticCurveTo(-width * 0.5, length * 0.4, 0, 0);

  const extrudeSettings = {
    steps: 2,
    depth: thickness,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.0008,
    bevelThickness: 0.0008,
  };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();

  // Apply subtle parabolic longitudinal curve so petals curve gently upwards
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const normY = (y + length * 0.5) / length;
    const curveZ = Math.sin(normY * Math.PI * 0.8) * curveDepth;
    pos.setZ(i, pos.getZ(i) + curveZ);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Procedural model builders for each of the 7 flower varieties.
 */
function buildFlowerVarietyModel(varietyId) {
  const spec = FLOWER_VARIETIES[varietyId];
  const flowerGroup = new THREE.Group();
  flowerGroup.name = `flower-template-${varietyId}`;

  // Shared stem material
  const stemMat = new THREE.MeshStandardMaterial({
    color: spec.stemColor,
    roughness: 0.72,
    metalness: 0.04,
  });

  const avgHeight = (spec.minHeight + spec.maxHeight) * 0.5;

  if (varietyId === 'daisy') {
    // 1. Stem
    const stemGeo = new THREE.CylinderGeometry(spec.stemRadius, spec.stemRadius * 1.3, avgHeight, 5);
    stemGeo.translate(0, avgHeight * 0.5, 0);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    flowerGroup.add(stem);

    // Leaves on stem
    const leafGeo = new THREE.ConeGeometry(0.012, 0.06, 4);
    leafGeo.rotateZ(0.6);
    leafGeo.translate(0.015, avgHeight * 0.4, 0);
    const leaf = new THREE.Mesh(leafGeo, stemMat);
    flowerGroup.add(leaf);

    // Head group (anchored at top of stem)
    const head = new THREE.Group();
    head.name = 'flower-head';
    head.position.y = avgHeight;

    // Center disc
    const centerMat = new THREE.MeshStandardMaterial({
      color: spec.centerColor,
      roughness: 0.85,
    });
    const centerGeo = new THREE.CylinderGeometry(0.018, 0.015, 0.008, 8);
    const centerMesh = new THREE.Mesh(centerGeo, centerMat);
    head.add(centerMesh);

    // 12 Ivory petals radiating outward
    const petalMat = new THREE.MeshStandardMaterial({
      color: spec.petalColors[0],
      roughness: 0.65,
      side: THREE.DoubleSide,
    });
    const petalGeo = createCurvedPetalGeometry(0.035, 0.012, 0.0018, 0.005);
    petalGeo.rotateX(Math.PI / 2);

    for (let p = 0; p < spec.petalCount; p++) {
      const angle = (p / spec.petalCount) * Math.PI * 2 + (p % 2 === 0 ? 0.03 : -0.03);
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(Math.cos(angle) * 0.02, 0.002, Math.sin(angle) * 0.02);
      petal.rotation.y = -angle;
      petal.rotation.x = 0.12; // gentle upward tilt
      head.add(petal);
    }
    flowerGroup.add(head);
    flowerGroup.userData.head = head;
  } else if (varietyId === 'rose') {
    // 2. Rose with layered curved petals
    const stemGeo = new THREE.CylinderGeometry(spec.stemRadius, spec.stemRadius * 1.4, avgHeight, 6);
    stemGeo.translate(0, avgHeight * 0.5, 0);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    flowerGroup.add(stem);

    // Sparse small thorns on stem
    for (let t = 0; t < 3; t++) {
      const thorn = new THREE.Mesh(new THREE.ConeGeometry(0.003, 0.008, 3), stemMat);
      thorn.position.set(0.004, avgHeight * (0.25 + t * 0.2), 0);
      thorn.rotation.z = -1.2;
      flowerGroup.add(thorn);
    }

    const head = new THREE.Group();
    head.name = 'flower-head';
    head.position.y = avgHeight;

    const roseMatOuter = new THREE.MeshStandardMaterial({
      color: spec.petalColors[0],
      roughness: 0.68,
      side: THREE.DoubleSide,
    });
    const roseMatInner = new THREE.MeshStandardMaterial({
      color: spec.petalColors[1] || spec.petalColors[0],
      roughness: 0.72,
      side: THREE.DoubleSide,
    });
    const centerMat = new THREE.MeshStandardMaterial({
      color: spec.centerColor,
      roughness: 0.85,
    });

    const core = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), centerMat);
    core.scale.set(1, 0.8, 1);
    head.add(core);

    const petalGeo = createCurvedPetalGeometry(0.036, 0.024, 0.002, 0.01);
    petalGeo.rotateX(Math.PI / 2);

    // Inner ring (8 petals)
    for (let p = 0; p < 8; p++) {
      const angle = (p / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, roseMatInner);
      petal.scale.set(0.7, 0.7, 0.7);
      petal.position.set(Math.cos(angle) * 0.012, 0.005, Math.sin(angle) * 0.012);
      petal.rotation.y = -angle;
      petal.rotation.x = 0.55;
      head.add(petal);
    }

    // Outer ring (16 petals)
    for (let p = 0; p < 16; p++) {
      const angle = (p / 16) * Math.PI * 2 + 0.2;
      const petal = new THREE.Mesh(petalGeo, roseMatOuter);
      petal.position.set(Math.cos(angle) * 0.024, 0.002, Math.sin(angle) * 0.024);
      petal.rotation.y = -angle;
      petal.rotation.x = 0.28;
      head.add(petal);
    }
    flowerGroup.add(head);
    flowerGroup.userData.head = head;
  } else if (varietyId === 'tulip') {
    // 3. Tulip with 6 cupped upright petals
    const stemGeo = new THREE.CylinderGeometry(spec.stemRadius, spec.stemRadius * 1.3, avgHeight, 5);
    stemGeo.translate(0, avgHeight * 0.5, 0);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    flowerGroup.add(stem);

    // Broad upright leaf
    const leafGeo = new THREE.BoxGeometry(0.02, 0.16, 0.003);
    leafGeo.translate(0, 0.08, 0);
    const leaf = new THREE.Mesh(leafGeo, stemMat);
    leaf.position.set(0.01, avgHeight * 0.2, 0);
    leaf.rotation.z = -0.25;
    flowerGroup.add(leaf);

    const head = new THREE.Group();
    head.name = 'flower-head';
    head.position.y = avgHeight;

    const tulipColor = spec.petalColors[Math.floor(Math.random() * spec.petalColors.length)];
    const tulipMat = new THREE.MeshStandardMaterial({
      color: tulipColor,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });

    const petalGeo = createCurvedPetalGeometry(0.065, 0.032, 0.002, 0.014);
    petalGeo.rotateX(Math.PI * 0.45);

    for (let p = 0; p < 6; p++) {
      const angle = (p / 6) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, tulipMat);
      const isInner = p % 2 === 0;
      const r = isInner ? 0.015 : 0.022;
      petal.position.set(Math.cos(angle) * r, 0.02, Math.sin(angle) * r);
      petal.rotation.y = -angle;
      petal.rotation.x = isInner ? 0.75 : 0.65;
      head.add(petal);
    }
    flowerGroup.add(head);
    flowerGroup.userData.head = head;
  } else if (varietyId === 'sunflower') {
    // 4. Tall Sunflower with large brown seed disc and 24 golden yellow ray petals
    const stemGeo = new THREE.CylinderGeometry(spec.stemRadius, spec.stemRadius * 1.5, avgHeight, 6);
    stemGeo.translate(0, avgHeight * 0.5, 0);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    flowerGroup.add(stem);

    // 4 broad leaves along stem
    for (let l = 0; l < 4; l++) {
      const leafGeo = new THREE.ConeGeometry(0.045, 0.16, 4);
      leafGeo.rotateX(Math.PI / 2);
      const leaf = new THREE.Mesh(leafGeo, stemMat);
      const ang = l * 1.7;
      leaf.position.set(Math.cos(ang) * 0.03, avgHeight * (0.2 + l * 0.18), Math.sin(ang) * 0.03);
      leaf.rotation.y = ang;
      leaf.rotation.x = 0.4;
      flowerGroup.add(leaf);
    }

    const head = new THREE.Group();
    head.name = 'flower-head';
    head.position.y = avgHeight;
    head.rotation.x = 0.25; // sunflower tilts gently toward the sun

    // Large dark brown center disc
    const centerMat = new THREE.MeshStandardMaterial({
      color: spec.centerColor,
      roughness: 0.92,
    });
    const centerGeo = new THREE.CylinderGeometry(0.065, 0.06, 0.02, 12);
    centerGeo.rotateX(Math.PI / 2);
    const centerMesh = new THREE.Mesh(centerGeo, centerMat);
    head.add(centerMesh);

    // 24 Ray petals
    const petalMat = new THREE.MeshStandardMaterial({
      color: spec.petalColors[0],
      roughness: 0.58,
      side: THREE.DoubleSide,
    });
    const petalGeo = createCurvedPetalGeometry(0.085, 0.022, 0.0025, 0.008);
    petalGeo.rotateX(Math.PI / 2);

    for (let p = 0; p < spec.petalCount; p++) {
      const angle = (p / spec.petalCount) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(Math.cos(angle) * 0.07, Math.sin(angle) * 0.07, 0.005);
      petal.rotation.z = angle - Math.PI / 2;
      petal.rotation.y = 0.1;
      head.add(petal);
    }
    flowerGroup.add(head);
    flowerGroup.userData.head = head;
  } else if (varietyId === 'lavender') {
    // 5. Lavender with dense floret spikes
    const stemGeo = new THREE.CylinderGeometry(spec.stemRadius, spec.stemRadius * 1.2, avgHeight, 4);
    stemGeo.translate(0, avgHeight * 0.5, 0);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    flowerGroup.add(stem);

    // Slender leaves at base
    for (let l = 0; l < 4; l++) {
      const leafGeo = new THREE.BoxGeometry(0.006, 0.08, 0.002);
      leafGeo.translate(0, 0.04, 0);
      const leaf = new THREE.Mesh(leafGeo, stemMat);
      leaf.position.set(0, avgHeight * 0.15, 0);
      leaf.rotation.y = l * 1.57;
      leaf.rotation.z = 0.45;
      flowerGroup.add(leaf);
    }

    const head = new THREE.Group();
    head.name = 'flower-head';
    head.position.y = avgHeight * 0.65;

    const floretMat = new THREE.MeshStandardMaterial({
      color: spec.floretColor,
      roughness: 0.75,
    });

    // Tiered floret rings along spike
    const spikeH = avgHeight * 0.35;
    const tiers = 7;
    for (let t = 0; t < tiers; t++) {
      const ty = (t / tiers) * spikeH;
      const r = 0.016 * (1.0 - t * 0.08);
      const floretsInTier = 4;
      for (let f = 0; f < floretsInTier; f++) {
        const ang = (f / floretsInTier) * Math.PI * 2 + t * 0.6;
        const floret = new THREE.Mesh(new THREE.SphereGeometry(0.007, 4, 4), floretMat);
        floret.scale.set(1, 1.4, 1);
        floret.position.set(Math.cos(ang) * r, ty, Math.sin(ang) * r);
        head.add(floret);
      }
    }
    flowerGroup.add(head);
    flowerGroup.userData.head = head;
  } else if (varietyId === 'hydrangea') {
    // 6. Hydrangea with domed spherical head of small florets
    const stemGeo = new THREE.CylinderGeometry(spec.stemRadius, spec.stemRadius * 1.3, avgHeight, 5);
    stemGeo.translate(0, avgHeight * 0.5, 0);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    flowerGroup.add(stem);

    // 2 Broad serrated leaves
    const leafGeo = new THREE.ConeGeometry(0.04, 0.12, 4);
    leafGeo.rotateZ(0.7);
    leafGeo.translate(0.04, avgHeight * 0.4, 0);
    flowerGroup.add(new THREE.Mesh(leafGeo, stemMat));

    const head = new THREE.Group();
    head.name = 'flower-head';
    head.position.y = avgHeight;

    const col = spec.petalColors[Math.floor(Math.random() * spec.petalColors.length)];
    const floretMat = new THREE.MeshStandardMaterial({
      color: col,
      roughness: 0.65,
    });

    // Domed florets cluster
    const clusterGeo = new THREE.SphereGeometry(0.012, 4, 4);
    const radius = 0.065;
    for (let i = 0; i < spec.floretCount; i++) {
      // Golden spiral distribution over upper hemisphere
      const phi = Math.acos(1 - (i / spec.floretCount) * 0.85);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) * 0.7;
      const z = radius * Math.sin(phi) * Math.sin(theta);

      const floret = new THREE.Mesh(clusterGeo, floretMat);
      floret.position.set(x, y, z);
      head.add(floret);
    }
    flowerGroup.add(head);
    flowerGroup.userData.head = head;
  } else {
    // 7. Marigold with dense ruffled petals
    const stemGeo = new THREE.CylinderGeometry(spec.stemRadius, spec.stemRadius * 1.3, avgHeight, 5);
    stemGeo.translate(0, avgHeight * 0.5, 0);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    flowerGroup.add(stem);

    const head = new THREE.Group();
    head.name = 'flower-head';
    head.position.y = avgHeight;

    const marigoldMat = new THREE.MeshStandardMaterial({
      color: spec.petalColors[0],
      roughness: 0.65,
    });
    const coreMat = new THREE.MeshStandardMaterial({
      color: spec.centerColor,
      roughness: 0.8,
    });

    const core = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 5), coreMat);
    head.add(core);

    const petalGeo = new THREE.BoxGeometry(0.012, 0.024, 0.002);
    petalGeo.translate(0, 0.012, 0);

    for (let p = 0; p < spec.petalCount; p++) {
      const angle = (p / spec.petalCount) * Math.PI * 4;
      const r = 0.012 + (p / spec.petalCount) * 0.022;
      const petal = new THREE.Mesh(petalGeo, marigoldMat);
      petal.position.set(Math.cos(angle) * r, (p / spec.petalCount) * 0.015, Math.sin(angle) * r);
      petal.rotation.y = -angle;
      petal.rotation.x = 0.4 + (p % 3) * 0.15;
      head.add(petal);
    }
    flowerGroup.add(head);
    flowerGroup.userData.head = head;
  }

  // Optimize templates: enable shadow casting for larger varieties
  flowerGroup.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = avgHeight > 0.45;
      child.receiveShadow = true;
    }
  });

  return flowerGroup;
}

/**
 * Creates the rounded timber border frame and dark mounded soil for a single flower bed.
 */
function createBedMoundAndBorder(bedLayout) {
  const group = new THREE.Group();
  group.name = `bed-mound-${bedLayout.id}`;

  const w = bedLayout.width;
  const d = bedLayout.depth;
  const moundH = 0.14;

  // 1. Dark soil mound (elliptical dome)
  const soilGeo = new THREE.CylinderGeometry(w * 0.46, w * 0.5, moundH, 24, 2);
  soilGeo.scale(1, 1, d / w);
  soilGeo.translate(0, moundH * 0.5, 0);

  const soilTex = typeof document !== 'undefined' ? getSoilTexture(3, 2) : null;
  const soilMat = new THREE.MeshStandardMaterial({
    map: soilTex,
    color: '#34261C',
    roughness: 0.95,
    metalness: 0.0,
  });
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.receiveShadow = true;
  group.add(soilMesh);

  // 2. Sandalwood / dark timber border (0.12 m wide, 0.15 m high timber edging)
  const borderH = 0.15;
  const timberPair = typeof document !== 'undefined'
    ? getTimberTextures('sandalwood', 4, 1)
    : { map: null, bumpMap: null };
  const borderMat = new THREE.MeshStandardMaterial({
    map: timberPair.map,
    bumpMap: timberPair.bumpMap,
    bumpScale: 0.03,
    color: '#8A5D3B',
    roughness: 0.8,
  });

  // 4 perimeter timber beams with mitred/rounded corners
  const halfW = w * 0.5;
  const halfD = d * 0.5;
  const beamT = 0.1;

  const bNorth = new THREE.Mesh(new THREE.BoxGeometry(w, borderH, beamT), borderMat);
  bNorth.position.set(0, borderH * 0.5, halfD);
  bNorth.castShadow = true;
  bNorth.receiveShadow = true;
  group.add(bNorth);

  const bSouth = new THREE.Mesh(new THREE.BoxGeometry(w, borderH, beamT), borderMat);
  bSouth.position.set(0, borderH * 0.5, -halfD);
  bSouth.castShadow = true;
  bSouth.receiveShadow = true;
  group.add(bSouth);

  const bEast = new THREE.Mesh(new THREE.BoxGeometry(beamT, borderH, d), borderMat);
  bEast.position.set(halfW, borderH * 0.5, 0);
  bEast.castShadow = true;
  bEast.receiveShadow = true;
  group.add(bEast);

  const bWest = new THREE.Mesh(new THREE.BoxGeometry(beamT, borderH, d), borderMat);
  bWest.position.set(-halfW, borderH * 0.5, 0);
  bWest.castShadow = true;
  bWest.receiveShadow = true;
  group.add(bWest);

  return group;
}

/**
 * Creates 12 Flower Beds containing 450 to 650 botanical flower instances across 7 varieties.
 * Features procedural wind sway animation (2 - 4 degrees cycle).
 */
export function createFlowerBeds() {
  const masterGroup = new THREE.Group();
  masterGroup.name = 'botanical-flower-beds';

  // Pre-generate template models for each variety
  const templates = {};
  for (const varId of Object.keys(FLOWER_VARIETIES)) {
    templates[varId] = buildFlowerVarietyModel(varId);
  }

  const flowerInstances = [];
  const plantRecords = [];
  let totalFlowerCount = 0;

  // Seeded PRNG for deterministic, reproducible flower placement
  let seed = 71839;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Build each of the 12 beds
  FLOWER_BED_LAYOUTS.forEach((bedConfig, bedIndex) => {
    const bedGroup = new THREE.Group();
    bedGroup.name = `flower-bed-${bedIndex + 1}-${bedConfig.id}`;

    const terrainY = getTerrainHeight(bedConfig.x, bedConfig.z);
    bedGroup.position.set(bedConfig.x, terrainY, bedConfig.z);
    bedGroup.rotation.y = bedConfig.rotY;

    // Add timber border & soil mound
    const mound = createBedMoundAndBorder(bedConfig);
    bedGroup.add(mound);

    // Populate bed with 42 to 48 flower plants (total across 12 beds = ~540 plants, within 450-650 range)
    const plantsInThisBed = 44 + (bedIndex % 3);
    const usableHalfW = bedConfig.width * 0.42;
    const usableHalfD = bedConfig.depth * 0.38;

    for (let p = 0; p < plantsInThisBed; p++) {
      // Pick a variety from this bed's permitted varieties
      const varietyId = bedConfig.varieties[Math.floor(rand() * bedConfig.varieties.length)];
      const template = templates[varietyId];
      if (!template) continue;

      const plantInstance = template.clone(true);

      // Distribute in elliptical mound interior with gentle clustering
      const angle = rand() * Math.PI * 2;
      const radiusFraction = Math.sqrt(rand()) * 0.95;
      const localX = Math.cos(angle) * usableHalfW * radiusFraction;
      const localZ = Math.sin(angle) * usableHalfD * radiusFraction;
      const moundElev = Math.max(0, 0.12 * (1.0 - (localX * localX) / (usableHalfW * usableHalfW) - (localZ * localZ) / (usableHalfD * usableHalfD)));

      // Height and rotation variation
      const scaleVariation = 0.88 + rand() * 0.24;
      const rotY = rand() * Math.PI * 2;

      plantInstance.position.set(localX, moundElev, localZ);
      plantInstance.rotation.y = rotY;
      plantInstance.scale.set(scaleVariation, scaleVariation, scaleVariation);

      // Find head node for wind sway
      const headNode = plantInstance.getObjectByName('flower-head') || null;

      // Record metadata for wind animation and inspection
      const flowerMeta = {
        id: `flower-${totalFlowerCount}`,
        bedId: bedConfig.id,
        varietyId,
        node: plantInstance,
        headNode,
        baseRotX: plantInstance.rotation.x,
        baseRotZ: plantInstance.rotation.z,
        worldX: bedConfig.x + localX,
        worldZ: bedConfig.z + localZ,
        phaseOffset: rand() * Math.PI * 2,
        swaySpeed: 1.1 + rand() * 0.4, // 3.5 - 6.5s cycle period
      };

      flowerInstances.push(flowerMeta);
      plantRecords.push({
        variety: varietyId,
        bed: bedConfig.id,
        worldPos: new THREE.Vector3(flowerMeta.worldX, terrainY + moundElev, flowerMeta.worldZ),
      });

      bedGroup.add(plantInstance);
      totalFlowerCount++;
    }

    masterGroup.add(bedGroup);
  });

  // Track density setting
  let activeDensity = 1.0;
  function setDensity(factor = 1.0) {
    activeDensity = Math.max(0.2, Math.min(1.0, factor));
    const activeCount = Math.floor(flowerInstances.length * activeDensity);
    flowerInstances.forEach((f, idx) => {
      f.node.visible = idx < activeCount;
    });
  }

  /**
   * Procedural wind sway animation:
   * Smoothly oscillates flowers 2 - 4 degrees (0.035 - 0.07 rad) off vertical
   * with spatially coherent phase offsets simulating gentle wind waves.
   */
  function update(delta, elapsed = 0) {
    if (activeDensity <= 0.05) return;
    const time = elapsed || 0;

    for (let i = 0; i < flowerInstances.length; i++) {
      const f = flowerInstances[i];
      if (!f.node.visible) continue;

      // Spatial wind wave moving across garden (+Z and +X)
      const windWave = (f.worldX * 0.12 + f.worldZ * 0.16) + time * f.swaySpeed;
      // 2 - 4 degrees oscillation (~0.045 radians)
      const swayRadX = Math.sin(windWave + f.phaseOffset) * 0.048;
      const swayRadZ = Math.cos(windWave * 0.85 + f.phaseOffset) * 0.026;

      f.node.rotation.x = f.baseRotX + swayRadX;
      f.node.rotation.z = f.baseRotZ + swayRadZ;

      // Flower head sways slightly extra relative to stem
      if (f.headNode && f.headNode.rotation) {
        f.headNode.rotation.x = swayRadX * 0.7;
        f.headNode.rotation.z = swayRadZ * 0.7;
      }
    }
  }

  masterGroup.userData = {
    update,
    setDensity,
    getFlowerCount: () => Math.floor(totalFlowerCount * activeDensity),
    totalCount: totalFlowerCount,
    bedsCount: FLOWER_BED_LAYOUTS.length,
    varietiesCount: Object.keys(FLOWER_VARIETIES).length,
  };

  return {
    group: masterGroup,
    beds: FLOWER_BED_LAYOUTS,
    varieties: FLOWER_VARIETIES,
    plants: plantRecords,
    getFlowerCount: () => Math.floor(totalFlowerCount * activeDensity),
    setDensity,
    update,
  };
}

export const FlowerBeds = {
  createFlowerBeds,
  FLOWER_VARIETIES,
  FLOWER_BED_LAYOUTS,
};
