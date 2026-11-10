import * as THREE from 'three';
import { POOL_SPEC } from '../house/HouseArchitecture.js';
import {
  getStoneTileTextures,
  getFabricTextures,
  getTimberTextures,
  getBrushedMetalTextures,
} from '../assets/procedural/TextureGenerator.js';

/**
 * GLSL Shaders for Animated Pool Water & Moving Underwater Caustics
 */
const WaterShader = {
  vertexShader: `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Multi-frequency gentle surface ripples (0.008 - 0.024 m amplitude)
      float ripple1 = sin(pos.x * 2.4 + uTime * 1.75) * 0.013;
      float ripple2 = cos(pos.y * 3.1 + uTime * 1.35) * 0.010;
      float ripple3 = sin((pos.x * 0.8 + pos.y * 1.3) * 2.1 - uTime * 2.1) * 0.007;
      pos.z += ripple1 + ripple2 + ripple3;

      float dx = 2.4 * cos(pos.x * 2.4 + uTime * 1.75) * 0.013 + 1.68 * cos((pos.x * 0.8 + pos.y * 1.3) * 2.1 - uTime * 2.1) * 0.007;
      float dy = -3.1 * sin(pos.y * 3.1 + uTime * 1.35) * 0.010 + 2.73 * cos((pos.x * 0.8 + pos.y * 1.3) * 2.1 - uTime * 2.1) * 0.007;

      vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
      vNormal = normalize(normalMatrix * vec3(-dx * 2.2, -dy * 2.2, 1.0));
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uBaseColor;
    uniform vec3 uDepthColor;
    uniform vec3 uSunDirection;
    uniform float uNightFactor;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    // Dual-layer procedural wave interference caustics
    float computeCaustic(vec2 p, float t) {
      vec2 uv = p * 9.0;
      float c1 = sin(uv.x * 1.45 + t * 1.95) + sin(uv.y * 1.25 - t * 1.75);
      float c2 = sin(uv.x * -1.15 + uv.y * 1.55 + t * 2.35);
      float c3 = sin(length(uv - vec2(4.5)) * 2.1 - t * 1.55);
      float v = clamp((c1 + c2 + c3 + 3.0) / 6.0, 0.0, 1.0);
      return pow(v, 3.6) * 1.6;
    }

    void main() {
      // Depth absorption gradient across stepped east end vs deeper west end
      float depthGrad = clamp(1.0 - vUv.x * 0.72 + vUv.y * 0.18, 0.0, 1.0);
      vec3 bodyColor = mix(uBaseColor, uDepthColor, depthGrad);

      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 N = normalize(vNormal);

      // Schlick-style Fresnel sky reflection term
      float cosTheta = clamp(dot(N, viewDir), 0.0, 1.0);
      float fresnel = clamp(pow(1.0 - cosTheta, 3.2) * 0.68 + 0.08, 0.08, 0.86);

      vec3 daySky = vec3(0.68, 0.85, 0.96);
      vec3 nightSky = vec3(0.10, 0.18, 0.30);
      vec3 skyRefl = mix(daySky, nightSky, clamp(uNightFactor, 0.0, 1.0));

      vec3 waterColor = mix(bodyColor, skyRefl, fresnel * 0.55);

      // Subtle sun caustics & crisp specular glints
      float caustic = computeCaustic(vUv, uTime);
      waterColor += vec3(caustic * 0.22 * (1.0 - uNightFactor * 0.75));

      vec3 halfVec = normalize(uSunDirection + viewDir);
      float spec = pow(max(dot(N, halfVec), 0.0), 72.0);
      waterColor += mix(vec3(1.0, 0.96, 0.88), vec3(0.7, 0.85, 1.0), uNightFactor) * spec * 0.58;

      // Nighttime sub-surface cyan LED scatter
      vec3 nightGlow = vec3(0.18, 0.78, 0.86) * uNightFactor * 0.38;
      waterColor += nightGlow;

      float alpha = mix(0.66, 0.90, fresnel);
      gl_FragColor = vec4(waterColor, alpha);
    }
  `,
};

/**
 * Custom underwater floor shader with projected animated caustics and mosaic normal relief.
 */
function createCausticFloorMaterial(mosaicTex) {
  const mat = new THREE.MeshStandardMaterial({
    map: mosaicTex.map,
    normalMap: mosaicTex.normalMap,
    normalScale: new THREE.Vector2(0.5, 0.5),
    roughnessMap: mosaicTex.roughnessMap,
    color: '#5BAEC8',
    roughness: 0.3,
    metalness: 0.08,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uNightFactor = { value: 0.0 };
    shader.fragmentShader = `
      uniform float uTime;
      uniform float uNightFactor;
      float getFloorCaustic(vec2 p, float t) {
        vec2 uv = p * 11.0;
        float c1 = sin(uv.x * 1.4 + t * 2.05) + sin(uv.y * 1.15 - t * 1.85);
        float c2 = sin(uv.x * -1.1 + uv.y * 1.5 + t * 2.25);
        float c3 = sin(length(uv - vec2(5.2)) * 2.0 - t * 1.65);
        float v = clamp((c1 + c2 + c3 + 3.0) / 6.0, 0.0, 1.0);
        return pow(v, 3.2) * 1.45;
      }
    ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
       float caustic = getFloorCaustic(vMapUv, uTime);
       gl_FragColor.rgb += vec3(caustic * 0.24 * (1.0 - uNightFactor * 0.72));
       gl_FragColor.rgb += vec3(0.12, 0.65, 0.78) * uNightFactor * 0.38;
      `
    );
    mat.userData.shader = shader;
  };

  return mat;
}

/**
 * Builds the 12.0 m x 8.0 m Sandstone Terrace Deck and Step Transitions.
 */
function buildTerraceDeck() {
  const deckGroup = new THREE.Group();
  deckGroup.name = 'terrace-deck-platform';

  const tW = POOL_SPEC.terraceMaxX - POOL_SPEC.terraceMinX; // 12 m
  const tH = POOL_SPEC.terraceY; // 0.25 m

  const stoneTex = typeof document !== 'undefined'
    ? getStoneTileTextures('paver', 6, 4)
    : { map: null, normalMap: null, roughnessMap: null };

  const deckMat = new THREE.MeshStandardMaterial({
    map: stoneTex.map,
    normalMap: stoneTex.normalMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: stoneTex.roughnessMap,
    color: '#D4C6B0',
    roughness: 0.75, // Non-slip poolside stone finish
    metalness: 0.04,
  });

  // Solid perimeter deck sections surrounding the 8x4m central pool cutout
  // Terrace bounds: X in [-13.0, -1.0], Z in [-17.5, -9.5]
  // Pool cutout: X in [-11.0, -3.0], Z in [-15.5, -11.5]

  // North deck strip (between house rear and pool cutout)
  const northW = tW;
  const northD = POOL_SPEC.terraceMaxZ - POOL_SPEC.poolMaxZ; // -9.5 - (-11.5) = 2.0 m
  const northDeck = new THREE.Mesh(new THREE.BoxGeometry(northW, tH, northD), deckMat);
  northDeck.position.set(
    (POOL_SPEC.terraceMinX + POOL_SPEC.terraceMaxX) * 0.5,
    tH * 0.5,
    POOL_SPEC.poolMaxZ + northD * 0.5
  );
  northDeck.receiveShadow = true;
  deckGroup.add(northDeck);

  // Teak hardwood poolside deck boardwalk inlay beneath the loungers
  const teakPbr = typeof document !== 'undefined'
    ? getTimberTextures('teak', 5, 2)
    : { map: null, normalMap: null, roughnessMap: null };
  const teakBoardMat = new THREE.MeshStandardMaterial({
    map: teakPbr.map,
    normalMap: teakPbr.normalMap,
    normalScale: new THREE.Vector2(0.65, 0.65),
    roughnessMap: teakPbr.roughnessMap,
    color: '#A57549',
    roughness: 0.62,
  });
  const boardwalk = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.022, 1.55), teakBoardMat);
  boardwalk.position.set(-7.3, tH + 0.008, -10.4);
  boardwalk.receiveShadow = true;
  deckGroup.add(boardwalk);

  // South deck strip (between pool cutout and rear boundary)
  const southW = tW;
  const southD = POOL_SPEC.poolMinZ - POOL_SPEC.terraceMinZ; // -15.5 - (-17.5) = 2.0 m
  const southDeck = new THREE.Mesh(new THREE.BoxGeometry(southW, tH, southD), deckMat);
  southDeck.position.set(
    (POOL_SPEC.terraceMinX + POOL_SPEC.terraceMaxX) * 0.5,
    tH * 0.5,
    POOL_SPEC.terraceMinZ + southD * 0.5
  );
  southDeck.receiveShadow = true;
  deckGroup.add(southDeck);

  // West deck strip (between outer edge and pool cutout)
  const westW = POOL_SPEC.poolMinX - POOL_SPEC.terraceMinX; // -11.0 - (-13.0) = 2.0 m
  const midD = POOL_SPEC.poolMaxZ - POOL_SPEC.poolMinZ; // 4.0 m
  const westDeck = new THREE.Mesh(new THREE.BoxGeometry(westW, tH, midD), deckMat);
  westDeck.position.set(
    POOL_SPEC.terraceMinX + westW * 0.5,
    tH * 0.5,
    (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5
  );
  westDeck.receiveShadow = true;
  deckGroup.add(westDeck);

  // East deck strip (between pool cutout and house gallery edge)
  const eastW = POOL_SPEC.terraceMaxX - POOL_SPEC.poolMaxX; // -1.0 - (-3.0) = 2.0 m
  const eastDeck = new THREE.Mesh(new THREE.BoxGeometry(eastW, tH, midD), deckMat);
  eastDeck.position.set(
    POOL_SPEC.poolMaxX + eastW * 0.5,
    tH * 0.5,
    (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5
  );
  eastDeck.receiveShadow = true;
  deckGroup.add(eastDeck);

  // Transition steps connecting terrace deck to house rear sliding door (Z = -9.5 to -9.0)
  const stepMat = deckMat;
  const stepGeo = new THREE.BoxGeometry(3.6, 0.05, 0.5);
  const stepMesh = new THREE.Mesh(stepGeo, stepMat);
  stepMesh.position.set(-6.0, tH + 0.025, -9.25);
  stepMesh.receiveShadow = true;
  deckGroup.add(stepMesh);

  return deckGroup;
}

/**
 * Builds the 8.0 m x 4.0 m x 1.35 m Swimming Pool Basin, Coping, and Underwater Steps.
 */
function buildPoolBasin() {
  const basinGroup = new THREE.Group();
  basinGroup.name = 'pool-basin';

  const pW = POOL_SPEC.poolMaxX - POOL_SPEC.poolMinX;
  const pD = POOL_SPEC.poolMaxZ - POOL_SPEC.poolMinZ;
  const depth = POOL_SPEC.waterDepth;
  const floorY = POOL_SPEC.terraceY - depth;

  const mosaicTex = typeof document !== 'undefined'
    ? getStoneTileTextures('poolMosaic', 8, 8)
    : { map: null, normalMap: null, roughnessMap: null };

  const floorMat = createCausticFloorMaterial(mosaicTex);

  // 1. Pool Floor
  const floorGeo = new THREE.PlaneGeometry(pW, pD, 16, 8);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.position.set(
    (POOL_SPEC.poolMinX + POOL_SPEC.poolMaxX) * 0.5,
    floorY,
    (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5
  );
  floorMesh.receiveShadow = true;
  basinGroup.add(floorMesh);

  // 2. Basin Interior Walls (mosaic tiled)
  const wallMat = floorMat;
  const wallThick = 0.12;

  const wNorth = new THREE.Mesh(new THREE.BoxGeometry(pW, depth, wallThick), wallMat);
  wNorth.position.set(
    (POOL_SPEC.poolMinX + POOL_SPEC.poolMaxX) * 0.5,
    floorY + depth * 0.5,
    POOL_SPEC.poolMaxZ + wallThick * 0.5
  );
  basinGroup.add(wNorth);

  const wSouth = new THREE.Mesh(new THREE.BoxGeometry(pW, depth, wallThick), wallMat);
  wSouth.position.set(
    (POOL_SPEC.poolMinX + POOL_SPEC.poolMaxX) * 0.5,
    floorY + depth * 0.5,
    POOL_SPEC.poolMinZ - wallThick * 0.5
  );
  basinGroup.add(wSouth);

  const wWest = new THREE.Mesh(new THREE.BoxGeometry(wallThick, depth, pD), wallMat);
  wWest.position.set(
    POOL_SPEC.poolMinX - wallThick * 0.5,
    floorY + depth * 0.5,
    (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5
  );
  basinGroup.add(wWest);

  const wEast = new THREE.Mesh(new THREE.BoxGeometry(wallThick, depth, pD), wallMat);
  wEast.position.set(
    POOL_SPEC.poolMaxX + wallThick * 0.5,
    floorY + depth * 0.5,
    (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5
  );
  basinGroup.add(wEast);

  // 3. Bullnose Beige Sandstone Coping Rim (0.25 m wide)
  const stoneTex = typeof document !== 'undefined'
    ? getStoneTileTextures('foyer', 4, 1)
    : { map: null, normalMap: null, roughnessMap: null };
  const copingMat = new THREE.MeshStandardMaterial({
    map: stoneTex.map,
    normalMap: stoneTex.normalMap,
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughnessMap: stoneTex.roughnessMap,
    color: '#E3D7C4',
    roughness: 0.62,
  });
  const cW = POOL_SPEC.copingWidth;
  const cH = 0.055;

  const cNorth = new THREE.Mesh(new THREE.BoxGeometry(pW + cW * 2, cH, cW), copingMat);
  cNorth.position.set((POOL_SPEC.poolMinX + POOL_SPEC.poolMaxX) * 0.5, POOL_SPEC.terraceY + cH * 0.5, POOL_SPEC.poolMaxZ + cW * 0.5);
  cNorth.castShadow = true;
  basinGroup.add(cNorth);

  const cSouth = new THREE.Mesh(new THREE.BoxGeometry(pW + cW * 2, cH, cW), copingMat);
  cSouth.position.set((POOL_SPEC.poolMinX + POOL_SPEC.poolMaxX) * 0.5, POOL_SPEC.terraceY + cH * 0.5, POOL_SPEC.poolMinZ - cW * 0.5);
  cSouth.castShadow = true;
  basinGroup.add(cSouth);

  const cWest = new THREE.Mesh(new THREE.BoxGeometry(cW, cH, pD), copingMat);
  cWest.position.set(POOL_SPEC.poolMinX - cW * 0.5, POOL_SPEC.terraceY + cH * 0.5, (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5);
  cWest.castShadow = true;
  basinGroup.add(cWest);

  const cEast = new THREE.Mesh(new THREE.BoxGeometry(cW, cH, pD), copingMat);
  cEast.position.set(POOL_SPEC.poolMaxX + cW * 0.5, POOL_SPEC.terraceY + cH * 0.5, (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5);
  cEast.castShadow = true;
  basinGroup.add(cEast);

  const bullN = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, pW, 10), copingMat);
  bullN.rotation.z = Math.PI / 2;
  bullN.position.set((POOL_SPEC.poolMinX + POOL_SPEC.poolMaxX) * 0.5, POOL_SPEC.terraceY + 0.028, POOL_SPEC.poolMaxZ);
  basinGroup.add(bullN);

  const bullS = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, pW, 10), copingMat);
  bullS.rotation.z = Math.PI / 2;
  bullS.position.set((POOL_SPEC.poolMinX + POOL_SPEC.poolMaxX) * 0.5, POOL_SPEC.terraceY + 0.028, POOL_SPEC.poolMinZ);
  basinGroup.add(bullS);

  // 4. Stepped Entry into Pool (3 submerged wide steps at east end)
  const stepCount = 3;
  const stepRun = 0.35;
  for (let s = 0; s < stepCount; s++) {
    const sWidth = 2.4;
    const sDepth = stepRun;
    const sHeight = depth / (stepCount + 1);
    const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(sDepth, sHeight * (stepCount - s), sWidth), wallMat);
    stepMesh.position.set(
      POOL_SPEC.poolMaxX - (s + 0.5) * stepRun,
      floorY + sHeight * (stepCount - s) * 0.5,
      (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5
    );
    stepMesh.receiveShadow = true;
    basinGroup.add(stepMesh);
  }

  // 5. Curved U-Shaped Brushed Stainless Steel Grab Rails & Submerged Ladder Rungs
  const steelPbr = typeof document !== 'undefined'
    ? getBrushedMetalTextures('#DCDCDC', 2, 2)
    : { normalMap: null, roughnessMap: null };
  const chromeMat = new THREE.MeshStandardMaterial({
    normalMap: steelPbr.normalMap,
    normalScale: new THREE.Vector2(0.3, 0.3),
    roughnessMap: steelPbr.roughnessMap,
    color: '#E2E4E6',
    metalness: 0.94,
    roughness: 0.16,
  });

  const baseY = POOL_SPEC.terraceY + cH;
  const ladderZEdge = POOL_SPEC.poolMaxZ + 0.03;
  for (const lx of [POOL_SPEC.poolMinX + 0.42, POOL_SPEC.poolMinX + 0.88]) {
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.048, 0.02, 12), chromeMat);
    flange.position.set(lx, baseY + 0.01, ladderZEdge + 0.18);
    basinGroup.add(flange);

    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(lx, baseY, ladderZEdge + 0.18),
      new THREE.Vector3(lx, baseY + 0.56, ladderZEdge + 0.16),
      new THREE.Vector3(lx, baseY + 0.66, ladderZEdge - 0.02),
      new THREE.Vector3(lx, baseY + 0.44, ladderZEdge - 0.1),
      new THREE.Vector3(lx, baseY - 0.95, ladderZEdge - 0.1),
    ]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(archCurve, 24, 0.021, 10, false), chromeMat);
    tube.castShadow = true;
    basinGroup.add(tube);
  }

  for (let r = 0; r < 3; r++) {
    const rung = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.022, 0.06), chromeMat);
    rung.position.set(POOL_SPEC.poolMinX + 0.65, baseY - 0.25 - r * 0.28, ladderZEdge - 0.1);
    basinGroup.add(rung);
  }

  basinGroup.userData.floorMaterial = floorMat;

  return basinGroup;
}

/**
 * Builds the Animated Translucent Water Surface Mesh with Custom Shader.
 */
function buildWaterSurface() {
  const pW = POOL_SPEC.poolMaxX - POOL_SPEC.poolMinX; // 8.0 m
  const pD = POOL_SPEC.poolMaxZ - POOL_SPEC.poolMinZ; // 4.0 m

  const geo = new THREE.PlaneGeometry(pW, pD, 32, 16);
  geo.rotateX(-Math.PI / 2);

  const uniforms = {
    uTime: { value: 0 },
    uBaseColor: { value: new THREE.Color('#4F9FC4') }, // Clear blue shallow
    uDepthColor: { value: new THREE.Color('#287FA8') }, // Deep turquoise
    uSunDirection: { value: new THREE.Vector3(0.5, 0.8, 0.3).normalize() },
    uNightFactor: { value: 0.0 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: WaterShader.vertexShader,
    fragmentShader: WaterShader.fragmentShader,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const waterMesh = new THREE.Mesh(geo, mat);
  waterMesh.name = 'pool-water-surface';
  waterMesh.position.set(
    (POOL_SPEC.poolMinX + POOL_SPEC.poolMaxX) * 0.5,
    POOL_SPEC.waterLevelY,
    (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5
  );

  return { waterMesh, uniforms };
}

/**
 * Builds the Pool Terrace Furnishings per PRD Section 15.4:
 * - 2 Teak Sun Loungers (1.90 x 0.65 m) with cream cushions & folded towels
 * - 1 Small Side Table (0.45 m dia)
 * - 1 Cantilever Patio Umbrella (2.50 m dia)
 * - 2 Large Terracotta Planters with dwarf palms
 */
function buildTerraceFurnishings() {
  const group = new THREE.Group();
  group.name = 'terrace-furnishings';
  const seats = [];

  const teakPbr = typeof document !== 'undefined'
    ? getTimberTextures('teak', 2, 1)
    : { map: null, normalMap: null, roughnessMap: null };
  const teakMat = new THREE.MeshStandardMaterial({
    map: teakPbr.map,
    normalMap: teakPbr.normalMap,
    normalScale: new THREE.Vector2(0.65, 0.65),
    roughnessMap: teakPbr.roughnessMap,
    color: '#91623D',
    roughness: 0.68,
  });

  const cushionTex = typeof document !== 'undefined'
    ? getFabricTextures('#F0EAD6', 4, 4)
    : { map: null, normalMap: null, roughnessMap: null };
  const cushionMat = new THREE.MeshStandardMaterial({
    map: cushionTex.map,
    normalMap: cushionTex.normalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughnessMap: cushionTex.roughnessMap,
    color: '#F0EAD6',
    roughness: 0.88,
  });

  const towelTex = typeof document !== 'undefined'
    ? getFabricTextures('#3B82A6', 4, 4)
    : { map: null, normalMap: null, roughnessMap: null };
  const towelMat = new THREE.MeshStandardMaterial({
    map: towelTex.map,
    normalMap: towelTex.normalMap,
    normalScale: new THREE.Vector2(0.6, 0.6),
    color: '#3B82A6',
    roughness: 0.92,
  });

  // 1. Two Slatted Teak Sun Loungers facing south (-Z) toward the pool
  const loungerConfigs = [
    { id: 'lounger-1', x: -8.8, z: -10.4 },
    { id: 'lounger-2', x: -6.8, z: -10.4 },
  ];

  loungerConfigs.forEach((cfg) => {
    const lGroup = new THREE.Group();
    lGroup.name = cfg.id;
    lGroup.position.set(cfg.x, POOL_SPEC.terraceY + 0.018, cfg.z);

    // Side rails & slatted frame
    for (const rx of [-0.305, 0.305]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.065, 1.9), teakMat);
      rail.position.set(rx, 0.27, 0);
      rail.castShadow = true;
      lGroup.add(rail);
    }
    for (let s = 0; s < 12; s++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.022, 0.12), teakMat);
      slat.position.set(0, 0.285, -0.84 + s * 0.152);
      lGroup.add(slat);
    }

    // Tapered teak legs
    for (const lx of [-0.28, 0.28]) {
      for (const lz of [-0.84, 0.84]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.022, 0.27, 8), teakMat);
        leg.position.set(lx, 0.135, lz);
        leg.castShadow = true;
        lGroup.add(leg);
      }
    }

    // Articulated cream deck pad + reclined backrest pad + rolled headrest bolster
    const baseCushion = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.075, 1.24), cushionMat);
    baseCushion.position.set(0, 0.34, -0.28);
    baseCushion.castShadow = true;
    lGroup.add(baseCushion);

    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.075, 0.62), cushionMat);
    headrest.position.set(0, 0.445, 0.59);
    headrest.rotation.x = 0.34; // leans upper edge up on north side so feet point south (-Z) over pool
    headrest.castShadow = true;
    lGroup.add(headrest);

    const bolster = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.46, 12), cushionMat);
    bolster.rotation.z = Math.PI / 2;
    bolster.position.set(0, 0.555, 0.72);
    bolster.castShadow = true;
    lGroup.add(bolster);

    // Rolled poolside terry towel
    const towelFold = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.038, 0.36), towelMat);
    towelFold.position.set(0, 0.395, -0.52);
    towelFold.castShadow = true;
    lGroup.add(towelFold);

    const towelRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.42, 12), towelMat);
    towelRoll.rotation.z = Math.PI / 2;
    towelRoll.position.set(0, 0.43, -0.68);
    lGroup.add(towelRoll);

    const seatMeta = {
      id: cfg.id,
      label: 'Poolside Teak Sun Lounger',
      x: cfg.x,
      y: POOL_SPEC.terraceY + 0.42,
      z: cfg.z - 0.18,
      yaw: 0,
    };
    seats.push(seatMeta);

    lGroup.userData = {
      id: cfg.id,
      type: 'lounger',
      label: 'Poolside Teak Sun Lounger',
      interactable: true,
      prompt: '[E] Relax on Sun Lounger',
      sitPosition: new THREE.Vector3(cfg.x, POOL_SPEC.terraceY + 0.42, cfg.z - 0.18),
    };

    group.add(lGroup);
  });

  // 2. Small Slatted Teak Side Table between Loungers (0.45 m dia)
  const tableGroup = new THREE.Group();
  tableGroup.name = 'pool-drinks-table';
  tableGroup.position.set(-7.8, POOL_SPEC.terraceY + 0.018, -10.4);

  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.036, 18), teakMat);
  tableTop.position.y = 0.43;
  tableTop.castShadow = true;
  tableGroup.add(tableTop);

  const tableCol = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.055, 0.41, 10), teakMat);
  tableCol.position.y = 0.205;
  tableCol.castShadow = true;
  tableGroup.add(tableCol);

  const tableFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.025, 14), teakMat);
  tableFoot.position.y = 0.012;
  tableGroup.add(tableFoot);

  const glassMat = new THREE.MeshStandardMaterial({
    color: '#DCF7FA',
    roughness: 0.08,
    metalness: 0.1,
    transparent: true,
    opacity: 0.72,
  });
  const drinkLiquidMat = new THREE.MeshStandardMaterial({
    color: '#F4A652',
    roughness: 0.15,
    transparent: true,
    opacity: 0.85,
  });
  for (const [gx, gz] of [[-0.07, 0.04], [0.08, -0.05]]) {
    const gShell = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.024, 0.11, 12), glassMat);
    gShell.position.set(gx, 0.503, gz);
    tableGroup.add(gShell);

    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.021, 0.075, 10), drinkLiquidMat);
    liquid.position.set(gx, 0.49, gz);
    tableGroup.add(liquid);
  }

  group.add(tableGroup);

  // 3. Cantilever Patio Umbrella (2.50 m dia ribbed canopy, positioned beside loungers leaving patio slider open)
  const umbrellaGroup = new THREE.Group();
  umbrellaGroup.name = 'cantilever-umbrella';
  umbrellaGroup.position.set(-7.3, POOL_SPEC.terraceY, -10.25);
  umbrellaGroup.rotation.y = -0.18;

  const metalMat = new THREE.MeshStandardMaterial({ color: '#2B241E', metalness: 0.85, roughness: 0.34 });
  const baseSlab = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.07, 0.68), metalMat);
  baseSlab.position.y = 0.035;
  baseSlab.castShadow = true;
  umbrellaGroup.add(baseSlab);

  const mastCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.07, 0),
    new THREE.Vector3(0.05, 1.35, 0),
    new THREE.Vector3(-0.32, 2.52, 0),
  ]);
  const mast = new THREE.Mesh(new THREE.TubeGeometry(mastCurve, 16, 0.036, 10, false), metalMat);
  mast.castShadow = true;
  umbrellaGroup.add(mast);

  const canopyTex = typeof document !== 'undefined'
    ? getFabricTextures('#EFE8D8', 6, 6)
    : { map: null, normalMap: null };
  const canopyMat = new THREE.MeshStandardMaterial({
    map: canopyTex.map,
    normalMap: canopyTex.normalMap,
    normalScale: new THREE.Vector2(0.4, 0.4),
    color: '#EFE8D8',
    roughness: 0.86,
    side: THREE.DoubleSide,
  });
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.26, 0.44, 8, 1, true), canopyMat);
  canopy.position.set(-0.4, 2.38, 0);
  canopy.castShadow = true;
  umbrellaGroup.add(canopy);

  const ventCap = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.14, 8), canopyMat);
  ventCap.position.set(-0.4, 2.61, 0);
  umbrellaGroup.add(ventCap);

  // 8 visible ribs under canopy
  for (let r = 0; r < 8; r++) {
    const ra = (r / 8) * Math.PI * 2;
    const ribCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.4, 2.48, 0),
      new THREE.Vector3(-0.4 + Math.cos(ra) * 1.24, 2.17, Math.sin(ra) * 1.24),
    ]);
    umbrellaGroup.add(new THREE.Mesh(new THREE.TubeGeometry(ribCurve, 4, 0.01, 5, false), metalMat));
  }

  group.add(umbrellaGroup);

  // 4. Two Turned Terracotta Planters with Arching Tropical Palms at Terrace Corners
  const terraMat = new THREE.MeshStandardMaterial({ color: '#C56747', roughness: 0.82 });
  const palmMat = new THREE.MeshStandardMaterial({ color: '#35633A', roughness: 0.72, side: THREE.DoubleSide });
  const potProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.18, 0.0),
    new THREE.Vector2(0.25, 0.25),
    new THREE.Vector2(0.28, 0.42),
    new THREE.Vector2(0.3, 0.48),
    new THREE.Vector2(0.24, 0.49),
    new THREE.Vector2(0.22, 0.41),
  ];
  const potGeo = new THREE.LatheGeometry(potProfile, 16);

  const planterCoords = [
    { x: -12.4, z: -16.8 },
    { x: -1.6, z: -16.8 },
  ];

  planterCoords.forEach((p, idx) => {
    const plGroup = new THREE.Group();
    plGroup.name = `pool-planter-${idx + 1}`;
    plGroup.position.set(p.x, POOL_SPEC.terraceY, p.z);

    const pot = new THREE.Mesh(potGeo, terraMat);
    pot.castShadow = true;
    pot.receiveShadow = true;
    plGroup.add(pot);

    for (let f = 0; f < 9; f++) {
      const ang = (f / 9) * Math.PI * 2 + idx * 0.5;
      const tier = f % 2;
      const arc = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.43, 0),
        new THREE.Vector3(Math.cos(ang) * 0.16, 0.76 + tier * 0.12, Math.sin(ang) * 0.16),
        new THREE.Vector3(Math.cos(ang) * (0.44 + tier * 0.1), 0.72 - tier * 0.14, Math.sin(ang) * (0.44 + tier * 0.1)),
      ]);
      const frondGeo = new THREE.TubeGeometry(arc, 7, 0.025, 4, false);
      frondGeo.scale(1, 0.42, 1.35);
      const frond = new THREE.Mesh(frondGeo, palmMat);
      frond.castShadow = true;
      plGroup.add(frond);
    }
    group.add(plGroup);
  });

  return { group, seats };
}

/**
 * Creates the complete Swimming Pool & Terrace Subsystem (PRD Section 15).
 * Returns group, waterMesh, colliders, and update handlers.
 */
export function createPoolTerrace() {
  const masterGroup = new THREE.Group();
  masterGroup.name = 'swimming-pool-terrace';

  // 1. Terrace deck platform
  const deck = buildTerraceDeck();
  masterGroup.add(deck);

  // 2. Pool basin geometry
  const basin = buildPoolBasin();
  masterGroup.add(basin);

  // 3. Water surface mesh with procedural shader
  const { waterMesh, uniforms } = buildWaterSurface();
  masterGroup.add(waterMesh);

  // 4. Pool terrace furnishings
  const { group: furnishings, seats } = buildTerraceFurnishings();
  masterGroup.add(furnishings);

  // 5. 2 Recessed Underwater Pool Lights with real underwater cyan PointLights
  const underwaterLightGroup = new THREE.Group();
  underwaterLightGroup.name = 'underwater-lights';
  const lightMat = new THREE.MeshStandardMaterial({
    color: '#4AD9D9',
    emissive: '#4AD9D9',
    emissiveIntensity: 0.1,
    roughness: 0.2,
  });

  const uLight1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12), lightMat);
  uLight1.position.set(POOL_SPEC.poolMinX + 0.05, -0.4, -13.5);
  uLight1.rotation.z = Math.PI / 2;
  const pLight1 = new THREE.PointLight('#4AD9D9', 0.95, 9.5, 1.6);
  pLight1.position.set(0, 0.25, 0);
  uLight1.add(pLight1);
  uLight1.userData.light = pLight1;
  underwaterLightGroup.add(uLight1);

  const uLight2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12), lightMat);
  uLight2.position.set(POOL_SPEC.poolMaxX - 0.05, -0.4, -13.5);
  uLight2.rotation.z = -Math.PI / 2;
  const pLight2 = new THREE.PointLight('#4AD9D9', 0.95, 9.5, 1.6);
  pLight2.position.set(0, 0.25, 0);
  uLight2.add(pLight2);
  uLight2.userData.light = pLight2;
  underwaterLightGroup.add(uLight2);

  masterGroup.add(underwaterLightGroup);

  // 6. Solid perimeter colliders around pool rim to prevent accidental walking into water
  const colliders = [
    // Pool Rim North Barrier
    {
      id: 'pool-rim-north',
      type: 'box',
      minX: POOL_SPEC.poolMinX - 0.15,
      maxX: POOL_SPEC.poolMaxX + 0.15,
      minZ: POOL_SPEC.poolMaxZ - 0.15,
      maxZ: POOL_SPEC.poolMaxZ + 0.15,
      minY: 0.0,
      maxY: 1.4,
    },
    // Pool Rim South Barrier
    {
      id: 'pool-rim-south',
      type: 'box',
      minX: POOL_SPEC.poolMinX - 0.15,
      maxX: POOL_SPEC.poolMaxX + 0.15,
      minZ: POOL_SPEC.poolMinZ - 0.15,
      maxZ: POOL_SPEC.poolMinZ + 0.15,
      minY: 0.0,
      maxY: 1.4,
    },
    // Pool Rim West Barrier
    {
      id: 'pool-rim-west',
      type: 'box',
      minX: POOL_SPEC.poolMinX - 0.15,
      maxX: POOL_SPEC.poolMinX + 0.15,
      minZ: POOL_SPEC.poolMinZ - 0.15,
      maxZ: POOL_SPEC.poolMaxZ + 0.15,
      minY: 0.0,
      maxY: 1.4,
    },
    // Pool Rim East Barrier
    {
      id: 'pool-rim-east',
      type: 'box',
      minX: POOL_SPEC.poolMaxX - 0.15,
      maxX: POOL_SPEC.poolMaxX + 0.15,
      minZ: POOL_SPEC.poolMinZ - 0.15,
      maxZ: POOL_SPEC.poolMaxZ + 0.15,
      minY: 0.0,
      maxY: 1.4,
    },
    // Terrace West Edge Drop-off Barrier
    {
      id: 'terrace-edge-west',
      type: 'box',
      minX: POOL_SPEC.terraceMinX - 0.1,
      maxX: POOL_SPEC.terraceMinX + 0.1,
      minZ: POOL_SPEC.terraceMinZ,
      maxZ: POOL_SPEC.terraceMaxZ,
      minY: 0.0,
      maxY: 0.9,
    },
  ];

  // Day/Night transition handler
  function setNightFactor(factor = 0.0) {
    uniforms.uNightFactor.value = factor;
    const floorShader = basin.userData.floorMaterial.userData.shader;
    if (floorShader) {
      floorShader.uniforms.uNightFactor.value = factor;
    }
    // Boost underwater LED glow at night
    lightMat.emissiveIntensity = factor > 0.4 ? 1.4 : 0.1;
  }

  // Animation update loop driving water surface ripples & floor caustics
  function update(delta, elapsed = 0) {
    const time = elapsed || 0;
    uniforms.uTime.value = time;

    const floorShader = basin.userData.floorMaterial.userData.shader;
    if (floorShader) {
      floorShader.uniforms.uTime.value = time;
    }
  }

  return {
    group: masterGroup,
    waterMesh,
    colliders,
    seats,
    underwaterLights: underwaterLightGroup,
    poolLights: [uLight1, uLight2],
    setNightFactor,
    update,
  };
}

export const PoolTerrace = {
  createPoolTerrace,
  POOL_SPEC,
};
