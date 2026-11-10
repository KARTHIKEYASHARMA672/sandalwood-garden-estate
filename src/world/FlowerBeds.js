import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
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
 * Builds a delicate parabolic curved botanical petal ribbon (y in [0..length], base anchored at 0)
 * using 18 triangles per petal instead of heavy beveled ExtrudeGeometry.
 */
function createCurvedPetalGeometry(length, width, curveDepth = 0.008) {
  const segX = 2;
  const segY = 3;
  const geo = new THREE.PlaneGeometry(width, length, segX, segY);
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const rawX = pos.getX(i);
    const rawY = pos.getY(i) + length * 0.5; // shift base to Y = 0
    const v = Math.max(0, Math.min(1, rawY / Math.max(0.001, length)));
    const uNorm = Math.abs(rawX) / Math.max(0.0005, width * 0.5);

    // Taper smoothly from narrow pedicel attachment to lush rounded upper lobe
    const widthEnvelope =
      v < 0.25
        ? 0.25 + (v / 0.25) * 0.55
        : v < 0.72
          ? 0.8 + Math.sin(((v - 0.25) / 0.47) * Math.PI) * 0.24
          : Math.max(0.08, Math.cos(((v - 0.72) / 0.28) * Math.PI * 0.48) * 0.82);

    const cupZ = Math.sin(v * Math.PI * 0.85) * curveDepth + (1 - uNorm * uNorm) * width * 0.14;
    pos.setXYZ(i, rawX * widthEnvelope, rawY, cupZ);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Attaches coherent GLSL spatial breeze sway (2 - 4 deg angular bend anchored at stem root).
 */
function attachFlowerWindShader(material, uniformTime, maxHeight) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniformTime;
    shader.uniforms.uMaxH = { value: maxHeight };
    shader.vertexShader = `uniform float uTime;\nuniform float uMaxH;\nattribute float aPhase;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float stemFrac = clamp(position.y / max(0.08, uMaxH), 0.0, 1.0);
       #ifdef USE_INSTANCING
         vec4 instOrigin = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
         float windWave = (instOrigin.x * 0.12 + instOrigin.z * 0.16) + uTime * 1.25 + aPhase;
         // World sway deltas (~3 deg avg bend) projected into local instance XZ frame
         float wx = sin(windWave) * 0.052;
         float wz = cos(windWave * 0.85) * 0.028;
         float scaleSq = max(0.01, dot(instanceMatrix[0].xz, instanceMatrix[0].xz));
         float bendFactor = position.y * (0.35 + 0.65 * stemFrac) / scaleSq;
         transformed.x += dot(vec2(wx, wz), instanceMatrix[0].xz) * bendFactor;
         transformed.z += dot(vec2(wx, wz), instanceMatrix[2].xz) * bendFactor;
       #endif
      `
    );
  };
  return material;
}

/**
 * Merges static sibling meshes inside `container` that share a material into single draw calls.
 */
function consolidateStaticGroup(container) {
  const buckets = new Map();
  const children = [...container.children];
  for (const child of children) {
    if (!child.isMesh || Array.isArray(child.material)) continue;
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
      list = [];
      buckets.set(child.material, list);
    }
    list.push(geo);
    container.remove(child);
  }
  for (const [mat, geos] of buckets.entries()) {
    if (!geos.length) continue;
    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    container.add(mesh);
  }
}

/**
 * Extracts merged per-material geometry layers across a hierarchical template Group in template root coords.
 * Returns array of `{ geometry, material, castShadow }` ready for GPU InstancedMesh batching.
 */
function bakeTemplateLayers(templateGroup, uniformTime, maxHeight) {
  templateGroup.updateMatrixWorld(true);
  const layers = new Map();
  const stemMaterialsSeen = new Set();

  templateGroup.traverse((child) => {
    if (!child.isMesh) return;
    let geo = child.geometry.clone();
    if (geo.index !== null) geo = geo.toNonIndexed();
    for (const key of Object.keys(geo.attributes)) {
      if (key !== 'position' && key !== 'normal' && key !== 'uv') {
        geo.deleteAttribute(key);
      }
    }
    geo.applyMatrix4(child.matrixWorld);

    let bucket = layers.get(child.material);
    if (!bucket) {
      bucket = { material: child.material, geos: [], castShadow: false };
      layers.set(child.material, bucket);
    }
    if (child.castShadow) bucket.castShadow = true;
    bucket.geos.push(geo);
  });

  const baked = [];
  for (const { material, geos, castShadow } of layers.values()) {
    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    if (!stemMaterialsSeen.has(material)) {
      attachFlowerWindShader(material, uniformTime, maxHeight);
      stemMaterialsSeen.add(material);
    }
    baked.push({ geometry: merged, material, castShadow });
  }
  return baked;
}

/**
 * Procedural model builders for each of the 7 flower varieties returning baked GPU instancing layers.
 */
function buildFlowerVarietyLayers(varietyId, colorVariantIdx, uniformTime) {
  const spec = FLOWER_VARIETIES[varietyId];
  const flowerGroup = new THREE.Group();
  flowerGroup.name = `flower-template-${varietyId}-${colorVariantIdx}`;

  const stemMat = new THREE.MeshStandardMaterial({
    color: spec.stemColor,
    roughness: 0.72,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });

  const avgHeight = (spec.minHeight + spec.maxHeight) * 0.5;
  const pickPetalColor = (idx = 0) =>
    spec.petalColors[(colorVariantIdx + idx) % spec.petalColors.length];

  if (varietyId === 'daisy') {
    const stemGeo = new THREE.CylinderGeometry(spec.stemRadius, spec.stemRadius * 1.35, avgHeight, 5);
    stemGeo.translate(0, avgHeight * 0.5, 0);
    flowerGroup.add(new THREE.Mesh(stemGeo, stemMat));

    for (let l = 0; l < 4; l++) {
      const ang = (l / 4) * Math.PI * 2 + 0.3;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.09, 4), stemMat);
      leaf.position.set(Math.cos(ang) * 0.022, avgHeight * (0.14 + (l % 2) * 0.14), Math.sin(ang) * 0.022);
      leaf.rotation.z = Math.cos(ang) * -0.78;
      leaf.rotation.x = Math.sin(ang) * 0.78;
      flowerGroup.add(leaf);
    }

    const head = new THREE.Group();
    head.position.y = avgHeight;

    const centerMat = new THREE.MeshStandardMaterial({ color: spec.centerColor, roughness: 0.85 });
    head.add(new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.015, 0.01, 10), centerMat));

    const petalMat = new THREE.MeshStandardMaterial({
      color: pickPetalColor(0),
      roughness: 0.54,
      side: THREE.DoubleSide,
    });
    const petalGeo = createCurvedPetalGeometry(0.038, 0.013, 0.0055);
    petalGeo.rotateX(Math.PI / 2);

    for (let p = 0; p < spec.petalCount; p++) {
      const angle = (p / spec.petalCount) * Math.PI * 2 + (p % 2 === 0 ? 0.03 : -0.03);
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(Math.cos(angle) * 0.014, 0.002, Math.sin(angle) * 0.014);
      petal.rotation.y = Math.PI / 2 - angle;
      petal.rotation.x = 0.14;
      head.add(petal);
    }
    flowerGroup.add(head);
  } else if (varietyId === 'rose') {
    const stemGeo = new THREE.CylinderGeometry(spec.stemRadius, spec.stemRadius * 1.4, avgHeight, 6);
    stemGeo.translate(0, avgHeight * 0.5, 0);
    flowerGroup.add(new THREE.Mesh(stemGeo, stemMat));

    for (let t = 0; t < 3; t++) {
      const ang = t * 2.1;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.085, 4), stemMat);
      leaf.position.set(Math.cos(ang) * 0.024, avgHeight * (0.28 + t * 0.18), Math.sin(ang) * 0.024);
      leaf.rotation.z = Math.cos(ang) * -0.82;
      leaf.rotation.x = Math.sin(ang) * 0.82;
      flowerGroup.add(leaf);
    }

    const calyx = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.022, 5), stemMat);
    calyx.rotation.x = Math.PI;
    calyx.position.y = avgHeight - 0.006;
    flowerGroup.add(calyx);

    const head = new THREE.Group();
    head.position.y = avgHeight;

    const roseMatOuter = new THREE.MeshStandardMaterial({
      color: pickPetalColor(0),
      roughness: 0.58,
      side: THREE.DoubleSide,
    });
    const roseMatInner = new THREE.MeshStandardMaterial({
      color: pickPetalColor(1),
      roughness: 0.64,
      side: THREE.DoubleSide,
    });
    const centerMat = new THREE.MeshStandardMaterial({ color: spec.centerColor, roughness: 0.82 });

    const core = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), centerMat);
    core.scale.set(1, 0.85, 1);
    head.add(core);

    const petalGeo = createCurvedPetalGeometry(0.04, 0.028, 0.01);
    petalGeo.rotateX(Math.PI / 2);

    for (let p = 0; p < 8; p++) {
      const angle = (p / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, roseMatInner);
      petal.scale.set(0.7, 0.7, 0.7);
      petal.position.set(Math.cos(angle) * 0.008, 0.004, Math.sin(angle) * 0.008);
      petal.rotation.y = Math.PI / 2 - angle;
      petal.rotation.x = -0.68;
      head.add(petal);
    }

    for (let p = 0; p < 14; p++) {
      const angle = (p / 14) * Math.PI * 2 + 0.2;
      const petal = new THREE.Mesh(petalGeo, roseMatOuter);
      petal.position.set(Math.cos(angle) * 0.012, 0.001, Math.sin(angle) * 0.012);
      petal.rotation.y = Math.PI / 2 - angle;
      petal.rotation.x = -0.34;
      head.add(petal);
    }
    flowerGroup.add(head);
  } else if (varietyId === 'tulip') {
    const stemGeo = new THREE.CylinderGeometry(spec.stemRadius, spec.stemRadius * 1.35, avgHeight, 5);
    stemGeo.translate(0, avgHeight * 0.5, 0);
    flowerGroup.add(new THREE.Mesh(stemGeo, stemMat));

    const leafGeo = new THREE.ConeGeometry(0.022, 0.2, 4);
    leafGeo.scale(1.2, 1, 0.35);
    for (const side of [-1, 1]) {
      const leaf = new THREE.Mesh(leafGeo, stemMat);
      leaf.position.set(side * 0.016, avgHeight * 0.28, 0);
      leaf.rotation.z = side * -0.26;
      flowerGroup.add(leaf);
    }

    const head = new THREE.Group();
    head.position.y = avgHeight;

    const tulipMat = new THREE.MeshStandardMaterial({
      color: pickPetalColor(0),
      roughness: 0.52,
      side: THREE.DoubleSide,
    });

    const petalGeo = createCurvedPetalGeometry(0.068, 0.036, 0.014);
    petalGeo.rotateX(Math.PI / 2);

    for (let p = 0; p < 6; p++) {
      const angle = (p / 6) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, tulipMat);
      const isInner = p % 2 === 0;
      const r = isInner ? 0.01 : 0.015;
      petal.position.set(Math.cos(angle) * r, 0.0, Math.sin(angle) * r);
      petal.rotation.y = Math.PI / 2 - angle;
      petal.rotation.x = isInner ? -1.08 : -0.94;
      head.add(petal);
    }
    flowerGroup.add(head);
  } else if (varietyId === 'sunflower') {
    const stemGeo = new THREE.CylinderGeometry(spec.stemRadius, spec.stemRadius * 1.5, avgHeight, 6);
    stemGeo.translate(0, avgHeight * 0.5, 0);
    flowerGroup.add(new THREE.Mesh(stemGeo, stemMat));

    for (let l = 0; l < 5; l++) {
      const leafGeo = new THREE.ConeGeometry(0.048, 0.18, 4);
      leafGeo.rotateX(Math.PI / 2);
      const leaf = new THREE.Mesh(leafGeo, stemMat);
      const ang = l * 1.65;
      leaf.position.set(Math.cos(ang) * 0.032, avgHeight * (0.18 + l * 0.15), Math.sin(ang) * 0.032);
      leaf.rotation.y = ang;
      leaf.rotation.x = 0.42;
      flowerGroup.add(leaf);
    }

    const head = new THREE.Group();
    head.position.y = avgHeight;
    head.rotation.x = 0.25;

    const centerMat = new THREE.MeshStandardMaterial({ color: spec.centerColor, roughness: 0.92 });
    const centerGeo = new THREE.CylinderGeometry(0.068, 0.062, 0.022, 12);
    centerGeo.rotateX(Math.PI / 2);
    head.add(new THREE.Mesh(centerGeo, centerMat));

    const petalMat = new THREE.MeshStandardMaterial({
      color: pickPetalColor(0),
      roughness: 0.54,
      side: THREE.DoubleSide,
    });
    const petalGeo = createCurvedPetalGeometry(0.095, 0.026, 0.008);

    for (let p = 0; p < spec.petalCount; p++) {
      const angle = (p / spec.petalCount) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(Math.cos(angle) * 0.056, Math.sin(angle) * 0.056, 0.005);
      petal.rotation.z = angle - Math.PI / 2;
      petal.rotation.x = -0.14;
      head.add(petal);
    }
    flowerGroup.add(head);
  } else if (varietyId === 'lavender') {
    const stemGeo = new THREE.CylinderGeometry(spec.stemRadius, spec.stemRadius * 1.2, avgHeight, 4);
    stemGeo.translate(0, avgHeight * 0.5, 0);
    flowerGroup.add(new THREE.Mesh(stemGeo, stemMat));

    for (let l = 0; l < 6; l++) {
      const leafGeo = new THREE.ConeGeometry(0.005, 0.1, 3);
      leafGeo.translate(0, 0.05, 0);
      const leaf = new THREE.Mesh(leafGeo, stemMat);
      leaf.position.set(0, avgHeight * 0.12, 0);
      leaf.rotation.y = (l / 6) * Math.PI * 2;
      leaf.rotation.z = 0.48;
      flowerGroup.add(leaf);
    }

    const head = new THREE.Group();
    head.position.y = avgHeight * 0.65;

    const floretMat = new THREE.MeshStandardMaterial({ color: spec.floretColor, roughness: 0.7 });
    const spikeH = avgHeight * 0.35;
    const tiers = 7;
    const floretGeo = new THREE.SphereGeometry(0.0075, 4, 4);
    floretGeo.scale(1, 1.45, 1);
    for (let t = 0; t < tiers; t++) {
      const ty = (t / tiers) * spikeH;
      const r = 0.017 * (1.0 - t * 0.08);
      for (let f = 0; f < 4; f++) {
        const ang = (f / 4) * Math.PI * 2 + t * 0.6;
        const floret = new THREE.Mesh(floretGeo, floretMat);
        floret.position.set(Math.cos(ang) * r, ty, Math.sin(ang) * r);
        head.add(floret);
      }
    }
    flowerGroup.add(head);
  } else if (varietyId === 'hydrangea') {
    const stemGeo = new THREE.CylinderGeometry(spec.stemRadius, spec.stemRadius * 1.3, avgHeight, 5);
    stemGeo.translate(0, avgHeight * 0.5, 0);
    flowerGroup.add(new THREE.Mesh(stemGeo, stemMat));

    for (let l = 0; l < 3; l++) {
      const ang = (l / 3) * Math.PI * 2 + 0.5;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.14, 4), stemMat);
      leaf.position.set(Math.cos(ang) * 0.04, avgHeight * (0.28 + l * 0.08), Math.sin(ang) * 0.04);
      leaf.rotation.z = Math.cos(ang) * -0.8;
      leaf.rotation.x = Math.sin(ang) * 0.8;
      flowerGroup.add(leaf);
    }

    const head = new THREE.Group();
    head.position.y = avgHeight;

    const floretMat = new THREE.MeshStandardMaterial({ color: pickPetalColor(0), roughness: 0.6 });
    const clusterGeo = new THREE.SphereGeometry(0.014, 5, 4);
    const radius = 0.068;
    for (let i = 0; i < spec.floretCount; i++) {
      const phi = Math.acos(1 - (i / spec.floretCount) * 0.85);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) * 0.72;
      const z = radius * Math.sin(phi) * Math.sin(theta);

      const floret = new THREE.Mesh(clusterGeo, floretMat);
      floret.position.set(x, y, z);
      head.add(floret);
    }
    flowerGroup.add(head);
  } else {
    // Marigold with layered curved pompom petals
    const stemGeo = new THREE.CylinderGeometry(spec.stemRadius, spec.stemRadius * 1.35, avgHeight, 5);
    stemGeo.translate(0, avgHeight * 0.5, 0);
    flowerGroup.add(new THREE.Mesh(stemGeo, stemMat));

    for (let l = 0; l < 4; l++) {
      const ang = (l / 4) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.095, 4), stemMat);
      leaf.position.set(Math.cos(ang) * 0.025, avgHeight * 0.25, Math.sin(ang) * 0.025);
      leaf.rotation.z = Math.cos(ang) * -0.82;
      leaf.rotation.x = Math.sin(ang) * 0.82;
      flowerGroup.add(leaf);
    }

    const head = new THREE.Group();
    head.position.y = avgHeight;

    const marigoldMat = new THREE.MeshStandardMaterial({
      color: pickPetalColor(0),
      roughness: 0.58,
      side: THREE.DoubleSide,
    });
    const coreMat = new THREE.MeshStandardMaterial({ color: spec.centerColor, roughness: 0.8 });
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 5), coreMat));

    const petalGeo = createCurvedPetalGeometry(0.028, 0.014, 0.005);
    petalGeo.rotateX(Math.PI / 2);
    for (let p = 0; p < 24; p++) {
      const angle = (p / 24) * Math.PI * 4;
      const ring = p / 24;
      const r = 0.008 + ring * 0.018;
      const petal = new THREE.Mesh(petalGeo, marigoldMat);
      petal.position.set(Math.cos(angle) * r, (1 - ring) * 0.014, Math.sin(angle) * r);
      petal.rotation.y = Math.PI / 2 - angle;
      petal.rotation.x = -0.3 - (1 - ring) * 0.65;
      head.add(petal);
    }
    flowerGroup.add(head);
  }

  flowerGroup.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = avgHeight > 0.48;
      child.receiveShadow = true;
    }
  });

  return bakeTemplateLayers(flowerGroup, uniformTime, spec.maxHeight);
}

/**
 * Creates the mitered timber border frame, corner stakes, and dark mounded soil for a flower bed.
 */
function createBedMoundAndBorder(bedLayout, shared) {
  const group = new THREE.Group();
  group.name = `bed-mound-${bedLayout.id}`;

  const w = bedLayout.width;
  const d = bedLayout.depth;
  const moundH = 0.085;

  // Rectangular mound that fits cleanly inside all 4 mitered corners with gentle crown swell
  const soilW = w - 0.08;
  const soilD = d - 0.08;
  const soilGeo = new THREE.BoxGeometry(soilW, moundH, soilD, 10, 1, 6);
  const sPos = soilGeo.getAttribute('position');
  for (let i = 0; i < sPos.count; i++) {
    const sy = sPos.getY(i);
    if (sy > 0) {
      const nx = sPos.getX(i) / (soilW * 0.5);
      const nz = sPos.getZ(i) / (soilD * 0.5);
      const radial = Math.max(0, 1 - (nx * nx * 0.72 + nz * nz * 0.72));
      sPos.setY(i, sy + radial * 0.068);
    }
  }
  soilGeo.translate(0, moundH * 0.5, 0);
  soilGeo.computeVertexNormals();

  const soilMesh = new THREE.Mesh(soilGeo, shared.soilMat);
  soilMesh.receiveShadow = true;
  group.add(soilMesh);

  const borderH = 0.15;
  const halfW = w * 0.5;
  const halfD = d * 0.5;
  const beamT = 0.1;

  const frameGroup = new THREE.Group();
  for (const [bx, bz, bw, bd] of [
    [0, halfD, w, beamT],
    [0, -halfD, w, beamT],
    [halfW, 0, beamT, d],
    [-halfW, 0, beamT, d],
  ]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(bw, borderH, bd), shared.borderMat);
    beam.position.set(bx, borderH * 0.5, bz);
    frameGroup.add(beam);
  }

  for (const [cx, cz] of [[-halfW, -halfD], [halfW, -halfD], [-halfW, halfD], [halfW, halfD]]) {
    const cornerPost = new THREE.Mesh(shared.cornerGeo, shared.postMat);
    cornerPost.position.set(cx, (borderH + 0.035) * 0.5, cz);
    frameGroup.add(cornerPost);
  }

  consolidateStaticGroup(frameGroup);
  group.add(frameGroup);
  return group;
}

/**
 * Creates 12 Flower Beds containing 450 to 650 batched InstancedMesh botanical flowers across 7 varieties.
 * Features cohesive GLSL spatial wind sway (2 - 4 degrees cycle).
 */
export function createFlowerBeds() {
  const masterGroup = new THREE.Group();
  masterGroup.name = 'botanical-flower-beds';

  const uniformTime = { value: 0 };

  const soilTex = typeof document !== 'undefined' ? getSoilTexture(3, 2) : null;
  const soilMat = new THREE.MeshStandardMaterial({
    map: soilTex,
    color: '#D8C7B6',
    roughness: 0.94,
    metalness: 0.0,
  });
  const timberPair = typeof document !== 'undefined'
    ? getTimberTextures('sandalwood', 4, 1)
    : { map: null, normalMap: null, roughnessMap: null };
  const borderMat = new THREE.MeshStandardMaterial({
    map: timberPair.map,
    normalMap: timberPair.normalMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: timberPair.roughnessMap,
    color: '#9A6C45',
    roughness: 0.78,
  });
  const postMat = new THREE.MeshStandardMaterial({
    color: '#4B3221',
    roughness: 0.82,
  });
  const sharedBedAssets = {
    soilMat,
    borderMat,
    postMat,
    cornerGeo: new THREE.BoxGeometry(0.125, 0.185, 0.125),
  };

  // Pre-bake consolidated GPU geometry layers for every (varietyId, colorVariantIdx)
  const templateBuckets = new Map();
  for (const [varId, spec] of Object.entries(FLOWER_VARIETIES)) {
    const colorCount = Math.max(1, spec.petalColors ? spec.petalColors.length : 1);
    for (let c = 0; c < colorCount; c++) {
      const key = `${varId}:${c}`;
      templateBuckets.set(key, {
        varId,
        layers: buildFlowerVarietyLayers(varId, c, uniformTime),
        placements: [],
      });
    }
  }

  const plantRecords = [];
  let totalFlowerCount = 0;

  // Seeded PRNG for deterministic placement
  let seed = 71839;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const bedDummy = new THREE.Object3D();
  const localDummy = new THREE.Object3D();
  const bedsCount = FLOWER_BED_LAYOUTS.length;

  FLOWER_BED_LAYOUTS.forEach((bedConfig, bedIndex) => {
    const bedGroup = new THREE.Group();
    bedGroup.name = `flower-bed-${bedIndex + 1}-${bedConfig.id}`;

    const terrainY = getTerrainHeight(bedConfig.x, bedConfig.z);
    bedGroup.position.set(bedConfig.x, terrainY, bedConfig.z);
    bedGroup.rotation.y = bedConfig.rotY;

    bedGroup.add(createBedMoundAndBorder(bedConfig, sharedBedAssets));
    masterGroup.add(bedGroup);

    bedDummy.position.set(bedConfig.x, terrainY, bedConfig.z);
    bedDummy.rotation.set(0, bedConfig.rotY, 0);
    bedDummy.updateMatrixWorld(true);

    // 44 to 46 plants per bed = 540 total across 12 beds
    const plantsInThisBed = 44 + (bedIndex % 3);
    const usableHalfW = bedConfig.width * 0.42;
    const usableHalfD = bedConfig.depth * 0.38;

    for (let p = 0; p < plantsInThisBed; p++) {
      const varietyId = bedConfig.varieties[Math.floor(rand() * bedConfig.varieties.length)];
      const spec = FLOWER_VARIETIES[varietyId];
      const colorCount = Math.max(1, spec.petalColors ? spec.petalColors.length : 1);
      const colorIdx = Math.floor(rand() * colorCount);
      const bucket = templateBuckets.get(`${varietyId}:${colorIdx}`);
      if (!bucket) continue;

      const angle = rand() * Math.PI * 2;
      const radiusFraction = Math.sqrt(rand()) * 0.95;
      const localX = Math.cos(angle) * usableHalfW * radiusFraction;
      const localZ = Math.sin(angle) * usableHalfD * radiusFraction;
      const moundElev = Math.max(
        0,
        0.12 * (1.0 - (localX * localX) / (usableHalfW * usableHalfW) - (localZ * localZ) / (usableHalfD * usableHalfD))
      );

      const scaleVariation = 0.88 + rand() * 0.24;
      const rotY = rand() * Math.PI * 2;

      localDummy.position.set(localX, moundElev, localZ);
      localDummy.rotation.set(0, rotY, 0);
      localDummy.scale.set(scaleVariation, scaleVariation, scaleVariation);
      localDummy.updateMatrix();

      const worldMatrix = new THREE.Matrix4().multiplyMatrices(bedDummy.matrixWorld, localDummy.matrix);
      const worldPos = new THREE.Vector3().setFromMatrixPosition(worldMatrix);

      // Interleaved rank keeps all 12 beds populated proportionally when scaling quality density
      const densityRank = p * bedsCount + bedIndex;

      bucket.placements.push({
        matrix: worldMatrix,
        phase: rand() * Math.PI * 2,
        densityRank,
      });

      plantRecords.push({
        variety: varietyId,
        bed: bedConfig.id,
        worldPos,
      });

      totalFlowerCount++;
    }
  });

  // Normalize densityRanks monotonically 0..totalFlowerCount-1 across placements and materialize InstancedMeshes
  const allEntries = [];
  for (const bucket of templateBuckets.values()) {
    for (const pl of bucket.placements) allEntries.push(pl);
  }
  allEntries.sort((a, b) => a.densityRank - b.densityRank);
  allEntries.forEach((pl, idx) => {
    pl.densityRank = idx;
  });

  const flowerBatchesGroup = new THREE.Group();
  flowerBatchesGroup.name = 'flowers-instanced-batched';
  const instancedBatches = [];

  for (const [key, bucket] of templateBuckets.entries()) {
    const count = bucket.placements.length;
    if (count === 0) continue;

    // Sort bucket placements by densityRank so setDensity adjusts instMesh.count cleanly in O(1)
    bucket.placements.sort((a, b) => a.densityRank - b.densityRank);

    const phases = new Float32Array(count);
    const ranks = new Int32Array(count);
    for (let i = 0; i < count; i++) {
      phases[i] = bucket.placements[i].phase;
      ranks[i] = bucket.placements[i].densityRank;
    }

    const instMeshes = [];
    for (const layer of bucket.layers) {
      const geo = layer.geometry.clone();
      geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
      const inst = new THREE.InstancedMesh(geo, layer.material, count);
      inst.name = `flower-batch-${key}`;
      inst.castShadow = layer.castShadow;
      inst.receiveShadow = true;
      for (let i = 0; i < count; i++) {
        inst.setMatrixAt(i, bucket.placements[i].matrix);
      }
      inst.instanceMatrix.needsUpdate = true;
      inst.frustumCulled = false;
      flowerBatchesGroup.add(inst);
      instMeshes.push(inst);
      layer.geometry.dispose();
    }

    instancedBatches.push({ instMeshes, ranks, count });
  }
  masterGroup.add(flowerBatchesGroup);

  let activeDensity = 1.0;
  function setDensity(factor = 1.0) {
    activeDensity = Math.max(0.2, Math.min(1.0, factor));
    const maxRank = Math.floor(totalFlowerCount * activeDensity);
    for (let b = 0; b < instancedBatches.length; b++) {
      const batch = instancedBatches[b];
      // Binary search for visible count in monotonic ranks array
      let lo = 0;
      let hi = batch.count;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (batch.ranks[mid] < maxRank) lo = mid + 1;
        else hi = mid;
      }
      for (let m = 0; m < batch.instMeshes.length; m++) {
        batch.instMeshes[m].count = lo;
      }
    }
  }

  function update(delta, elapsed = 0) {
    if (activeDensity <= 0.05) return;
    uniformTime.value = elapsed || 0;
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
