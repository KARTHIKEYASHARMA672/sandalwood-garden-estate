import * as THREE from 'three';
import { POOL_SPEC } from '../house/HouseArchitecture.js';
import { getStoneTileTextures, getFabricTextures } from '../assets/procedural/TextureGenerator.js';

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

      // Gentle surface ripples (0.01 - 0.03 m amplitude, 2 - 5s period)
      float ripple1 = sin(pos.x * 2.5 + uTime * 1.8) * 0.016;
      float ripple2 = cos(pos.y * 3.2 + uTime * 1.4) * 0.012;
      float ripple3 = sin((pos.x + pos.y) * 2.0 - uTime * 2.2) * 0.008;
      pos.z += ripple1 + ripple2 + ripple3;

      vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
      vNormal = normalize(normalMatrix * vec3(-ripple1 * 3.0, -ripple2 * 3.0, 1.0));
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

    // Procedural cellular/wave interference caustics
    float computeCaustic(vec2 p, float t) {
      vec2 uv = p * 8.0;
      float c1 = sin(uv.x * 1.5 + t * 2.0) + sin(uv.y * 1.2 - t * 1.8);
      float c2 = sin(uv.x * -1.2 + uv.y * 1.6 + t * 2.4);
      float c3 = sin(length(uv - vec2(4.0)) * 2.2 - t * 1.6);
      float v = clamp((c1 + c2 + c3 + 3.0) / 6.0, 0.0, 1.0);
      return pow(v, 3.5) * 1.8;
    }

    void main() {
      // Shallows to depth color gradient
      float depthGrad = clamp((vUv.x + vUv.y * 0.5) * 0.8, 0.0, 1.0);
      vec3 waterColor = mix(uBaseColor, uDepthColor, depthGrad);

      // Moving surface caustic highlights
      float caustic = computeCaustic(vUv, uTime);
      waterColor += vec3(caustic * 0.28 * (1.0 - uNightFactor * 0.7));

      // Specular highlight from directional sun/moon
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 halfVec = normalize(uSunDirection + viewDir);
      float spec = pow(max(dot(vNormal, halfVec), 0.0), 48.0);
      waterColor += vec3(spec * 0.45);

      // Night underwater illumination tint
      vec3 nightGlow = vec3(0.18, 0.75, 0.85) * uNightFactor * 0.4;
      waterColor += nightGlow;

      gl_FragColor = vec4(waterColor, 0.82);
    }
  `,
};

/**
 * Custom underwater floor shader with projected animated caustics.
 */
function createCausticFloorMaterial(mosaicTexture) {
  const mat = new THREE.MeshStandardMaterial({
    map: mosaicTexture,
    color: '#5BAEC8',
    roughness: 0.25,
    metalness: 0.1,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uNightFactor = { value: 0.0 };
    shader.fragmentShader = `
      uniform float uTime;
      uniform float uNightFactor;
      float getFloorCaustic(vec2 p, float t) {
        vec2 uv = p * 10.0;
        float c1 = sin(uv.x * 1.4 + t * 2.1) + sin(uv.y * 1.1 - t * 1.9);
        float c2 = sin(uv.x * -1.1 + uv.y * 1.5 + t * 2.3);
        float c3 = sin(length(uv - vec2(5.0)) * 2.0 - t * 1.7);
        float v = clamp((c1 + c2 + c3 + 3.0) / 6.0, 0.0, 1.0);
        return pow(v, 3.2) * 1.4;
      }
    ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
       float caustic = getFloorCaustic(vMapUv, uTime);
       gl_FragColor.rgb += vec3(caustic * 0.22 * (1.0 - uNightFactor * 0.75));
       gl_FragColor.rgb += vec3(0.12, 0.65, 0.75) * uNightFactor * 0.35;
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
    : { map: null, bumpMap: null };

  const deckMat = new THREE.MeshStandardMaterial({
    map: stoneTex.map,
    bumpMap: stoneTex.bumpMap,
    bumpScale: 0.02,
    color: '#D4C6B0',
    roughness: 0.75, // Non-slip poolside stone finish
    metalness: 0.05,
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

  const pW = POOL_SPEC.poolMaxX - POOL_SPEC.poolMinX; // 8.0 m
  const pD = POOL_SPEC.poolMaxZ - POOL_SPEC.poolMinZ; // 4.0 m
  const depth = POOL_SPEC.waterDepth; // 1.35 m
  const floorY = POOL_SPEC.terraceY - depth; // -1.10 m

  const mosaicTex = typeof document !== 'undefined'
    ? getStoneTileTextures('poolMosaic', 8, 8).map
    : null;

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

  // North wall
  const wNorth = new THREE.Mesh(new THREE.BoxGeometry(pW, depth, wallThick), wallMat);
  wNorth.position.set(
    (POOL_SPEC.poolMinX + POOL_SPEC.poolMaxX) * 0.5,
    floorY + depth * 0.5,
    POOL_SPEC.poolMaxZ + wallThick * 0.5
  );
  basinGroup.add(wNorth);

  // South wall
  const wSouth = new THREE.Mesh(new THREE.BoxGeometry(pW, depth, wallThick), wallMat);
  wSouth.position.set(
    (POOL_SPEC.poolMinX + POOL_SPEC.poolMaxX) * 0.5,
    floorY + depth * 0.5,
    POOL_SPEC.poolMinZ - wallThick * 0.5
  );
  basinGroup.add(wSouth);

  // West wall
  const wWest = new THREE.Mesh(new THREE.BoxGeometry(wallThick, depth, pD), wallMat);
  wWest.position.set(
    POOL_SPEC.poolMinX - wallThick * 0.5,
    floorY + depth * 0.5,
    (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5
  );
  basinGroup.add(wWest);

  // East wall
  const wEast = new THREE.Mesh(new THREE.BoxGeometry(wallThick, depth, pD), wallMat);
  wEast.position.set(
    POOL_SPEC.poolMaxX + wallThick * 0.5,
    floorY + depth * 0.5,
    (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5
  );
  basinGroup.add(wEast);

  // 3. Rounded Beige Coping Rim (0.25 m wide around edge per PRD Section 15.1)
  const copingMat = new THREE.MeshStandardMaterial({
    color: '#E0D4C1',
    roughness: 0.65,
  });
  const cW = POOL_SPEC.copingWidth;
  const cH = 0.05;

  // Coping perimeter frames
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

  // 4. Stepped Entry into Pool (3 submerged wide steps at east end)
  const stepCount = 3;
  const stepRun = 0.35;
  for (let s = 0; s < stepCount; s++) {
    const sWidth = 2.4;
    const sDepth = stepRun;
    const sHeight = (depth / (stepCount + 1));
    const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(sDepth, sHeight * (stepCount - s), sWidth), wallMat);
    stepMesh.position.set(
      POOL_SPEC.poolMaxX - (s + 0.5) * stepRun,
      floorY + sHeight * (stepCount - s) * 0.5,
      (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5
    );
    stepMesh.receiveShadow = true;
    basinGroup.add(stepMesh);
  }

  // 5. Stainless Steel Grab Rail / Ladder at NW corner
  const chromeMat = new THREE.MeshStandardMaterial({
    color: '#D8D8D8',
    metalness: 0.95,
    roughness: 0.15,
  });
  const railGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.95, 8);
  const rail1 = new THREE.Mesh(railGeo, chromeMat);
  rail1.position.set(POOL_SPEC.poolMinX + 0.4, POOL_SPEC.terraceY + 0.35, POOL_SPEC.poolMaxZ + 0.05);
  rail1.castShadow = true;
  basinGroup.add(rail1);

  const rail2 = new THREE.Mesh(railGeo, chromeMat);
  rail2.position.set(POOL_SPEC.poolMinX + 0.7, POOL_SPEC.terraceY + 0.35, POOL_SPEC.poolMaxZ + 0.05);
  rail2.castShadow = true;
  basinGroup.add(rail2);

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

  const teakMat = new THREE.MeshStandardMaterial({
    color: '#8A5D3B',
    roughness: 0.75,
  });

  const cushionTex = typeof document !== 'undefined'
    ? getFabricTextures('#F0EAD6', 4, 4)
    : { map: null };
  const cushionMat = new THREE.MeshStandardMaterial({
    map: cushionTex.map,
    color: '#F0EAD6',
    roughness: 0.85,
  });

  const towelMat = new THREE.MeshStandardMaterial({
    color: '#3B82A6',
    roughness: 0.9,
  });

  // 1. Two Sun Loungers placed north of the pool facing south
  const loungerConfigs = [
    { id: 'lounger-1', x: -8.8, z: -10.4 },
    { id: 'lounger-2', x: -6.8, z: -10.4 },
  ];

  loungerConfigs.forEach((cfg) => {
    const lGroup = new THREE.Group();
    lGroup.name = cfg.id;
    lGroup.position.set(cfg.x, POOL_SPEC.terraceY, cfg.z);

    // Teak frame (1.90 m L x 0.65 m W x 0.32 m H)
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 1.9), teakMat);
    frame.position.y = 0.28;
    frame.castShadow = true;
    lGroup.add(frame);

    // 4 Teak legs
    for (let lx = -0.28; lx <= 0.28; lx += 0.56) {
      for (let lz = -0.85; lz <= 0.85; lz += 1.7) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 6), teakMat);
        leg.position.set(lx, 0.14, lz);
        leg.castShadow = true;
        lGroup.add(leg);
      }
    }

    // Weather-resistant cream cushion (0.08 m thick)
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 1.85), cushionMat);
    cushion.position.y = 0.36;
    cushion.castShadow = true;
    lGroup.add(cushion);

    // Inclined headrest
    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.55), cushionMat);
    headrest.position.set(0, 0.44, 0.65);
    headrest.rotation.x = -0.32;
    headrest.castShadow = true;
    lGroup.add(headrest);

    // Folded pool towel
    const towel = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.35), towelMat);
    towel.position.set(0, 0.42, -0.4);
    towel.castShadow = true;
    lGroup.add(towel);

    // Interaction metadata
    lGroup.userData = {
      id: cfg.id,
      type: 'lounger',
      label: 'Poolside Teak Sun Lounger',
      interactable: true,
      prompt: '[E] Relax on Sun Lounger',
      sitPosition: new THREE.Vector3(cfg.x, POOL_SPEC.terraceY + 0.4, cfg.z),
    };

    group.add(lGroup);
  });

  // 2. Small Round Teak Drinks Table between loungers (0.45 m dia, 0.45 m H)
  const tableGroup = new THREE.Group();
  tableGroup.name = 'pool-drinks-table';
  tableGroup.position.set(-7.8, POOL_SPEC.terraceY, -10.4);

  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.04, 16), teakMat);
  tableTop.position.y = 0.42;
  tableTop.castShadow = true;
  tableGroup.add(tableTop);

  const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.4, 8), teakMat);
  tableLeg.position.y = 0.2;
  tableLeg.castShadow = true;
  tableGroup.add(tableLeg);

  // Chilled drinks glass on table
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#E0F7FA',
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.7,
  });
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.025, 0.1, 8), glassMat);
  glass.position.set(0.06, 0.49, 0.04);
  tableGroup.add(glass);

  group.add(tableGroup);

  // 3. Cantilever Patio Umbrella (2.50 m dia octagonal canopy per PRD Section 15.4)
  const umbrellaGroup = new THREE.Group();
  umbrellaGroup.name = 'cantilever-umbrella';
  umbrellaGroup.position.set(-5.2, POOL_SPEC.terraceY, -10.2);

  const metalMat = new THREE.MeshStandardMaterial({ color: '#2B241E', metalness: 0.85, roughness: 0.35 });
  const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.08, 12), metalMat);
  baseMesh.position.y = 0.04;
  baseMesh.castShadow = true;
  umbrellaGroup.add(baseMesh);

  // Offset cantilever curved mast
  const mastGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8);
  const mast = new THREE.Mesh(mastGeo, metalMat);
  mast.position.set(0, 1.25, 0);
  mast.rotation.z = -0.12;
  mast.castShadow = true;
  umbrellaGroup.add(mast);

  // Octagonal fabric canopy (2.5 m dia)
  const canopyMat = new THREE.MeshStandardMaterial({
    color: '#EFE8D8',
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
  const canopyGeo = new THREE.ConeGeometry(1.25, 0.45, 8);
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(-0.4, 2.45, 0);
  canopy.castShadow = true;
  umbrellaGroup.add(canopy);

  group.add(umbrellaGroup);

  // 4. Two Terracotta Planters with dwarf palms at terrace corners
  const terraMat = new THREE.MeshStandardMaterial({ color: '#C86A4B', roughness: 0.85 });
  const palmMat = new THREE.MeshStandardMaterial({ color: '#35633A', roughness: 0.75, side: THREE.DoubleSide });

  const planterCoords = [
    { x: -12.4, z: -16.8 },
    { x: -1.6, z: -16.8 },
  ];

  planterCoords.forEach((p, idx) => {
    const plGroup = new THREE.Group();
    plGroup.name = `pool-planter-${idx + 1}`;
    plGroup.position.set(p.x, POOL_SPEC.terraceY, p.z);

    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.48, 12), terraMat);
    pot.position.y = 0.24;
    pot.castShadow = true;
    plGroup.add(pot);

    // Palm fronds
    for (let f = 0; f < 6; f++) {
      const frondGeo = new THREE.ConeGeometry(0.08, 0.55, 4);
      frondGeo.rotateX(Math.PI / 2);
      const frond = new THREE.Mesh(frondGeo, palmMat);
      const ang = (f / 6) * Math.PI * 2;
      frond.position.set(Math.cos(ang) * 0.1, 0.48, Math.sin(ang) * 0.1);
      frond.rotation.y = ang;
      frond.rotation.x = 0.65;
      frond.castShadow = true;
      plGroup.add(frond);
    }
    group.add(plGroup);
  });

  return group;
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
  const furnishings = buildTerraceFurnishings();
  masterGroup.add(furnishings);

  // 5. 2 Recessed Underwater Pool Lights
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
  underwaterLightGroup.add(uLight1);

  const uLight2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12), lightMat);
  uLight2.position.set(POOL_SPEC.poolMaxX - 0.05, -0.4, -13.5);
  uLight2.rotation.z = -Math.PI / 2;
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
    underwaterLights: underwaterLightGroup,
    setNightFactor,
    update,
  };
}

export const PoolTerrace = {
  createPoolTerrace,
  POOL_SPEC,
};
