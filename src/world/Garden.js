import * as THREE from 'three';
import { WORLD_DIMENSIONS, getTerrainHeight, POOL_SPEC } from '../house/HouseArchitecture.js';
import { getLawnTexture, getStoneTileTextures, getTimberTextures } from '../assets/procedural/TextureGenerator.js';
import { createFlowerBeds } from './FlowerBeds.js';
import { createTreesAndProps } from './TreesAndProps.js';
import { createPoolTerrace } from './PoolTerrace.js';

/**
 * Creates the Central Sandstone Paver Pathway per PRD Section 3.2:
 * - 2.4 m wide continuous route from Arrival Plaza (Z = 40.0 m) to Front Porch (Z = 12.0 m).
 * - Centered at X = 3.5 m aligning with front porch steps and right-aligned main door.
 * - Beige natural stone pavers (0.6 x 0.3 m) with 0.12 m dark border strips.
 * - Raised +0.03 m above garden soil.
 * - 100% obstacle clearance: strictly no flower clusters or colliders within path.
 */
function buildCentralPathway() {
  const pathGroup = new THREE.Group();
  pathGroup.name = 'central-stone-pathway';

  const pWidth = WORLD_DIMENSIONS.pathwayWidth; // 2.4 m
  const pStart = WORLD_DIMENSIONS.pathwayStartZ; // 40.0 m
  const pEnd = WORLD_DIMENSIONS.pathwayEndZ; // 12.0 m
  const pLength = pStart - pEnd; // 28.0 m
  const pCenterZ = (pStart + pEnd) * 0.5; // 26.0 m
  const pCenterX = WORLD_DIMENSIONS.pathwayCenterX; // 3.5 m
  const pElev = 0.03; // +0.03 m elevation

  const stoneTex = typeof document !== 'undefined'
    ? getStoneTileTextures('paver', 4, 16)
    : { map: null, bumpMap: null };

  const paverMat = new THREE.MeshStandardMaterial({
    map: stoneTex.map,
    bumpMap: stoneTex.bumpMap,
    bumpScale: 0.02,
    color: '#D8CAB3',
    roughness: 0.78,
  });

  // Dark stone edge border material (0.12 m wide strips)
  const borderMat = new THREE.MeshStandardMaterial({
    color: '#7D705C',
    roughness: 0.82,
  });

  // 1. Main paver corridor (2.16 m wide between 0.12 m borders)
  const innerW = pWidth - 0.24; // 2.16 m
  const paverMesh = new THREE.Mesh(new THREE.BoxGeometry(innerW, 0.04, pLength), paverMat);
  paverMesh.position.set(pCenterX, pElev * 0.5, pCenterZ);
  paverMesh.receiveShadow = true;
  pathGroup.add(paverMesh);

  // 2. Left & Right 0.12 m dark stone borders
  const borderL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.045, pLength), borderMat);
  borderL.position.set(pCenterX - innerW * 0.5 - 0.06, pElev * 0.5 + 0.002, pCenterZ);
  borderL.receiveShadow = true;
  pathGroup.add(borderL);

  const borderR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.045, pLength), borderMat);
  borderR.position.set(pCenterX + innerW * 0.5 + 0.06, pElev * 0.5 + 0.002, pCenterZ);
  borderR.receiveShadow = true;
  pathGroup.add(borderR);

  // 3. Arrival Plaza / Character Start Platform (6.0 m W x 4.0 m D at Z = 39.5..43.5 m)
  const plazaW = 6.0;
  const plazaD = 4.0;
  const plazaZ = 41.5;
  const plazaMesh = new THREE.Mesh(new THREE.BoxGeometry(plazaW, 0.04, plazaD), paverMat);
  plazaMesh.position.set(pCenterX, pElev * 0.5, plazaZ);
  plazaMesh.receiveShadow = true;
  pathGroup.add(plazaMesh);

  // Plaza border rim
  const plazaRimMat = borderMat;
  const rimNorth = new THREE.Mesh(new THREE.BoxGeometry(plazaW + 0.24, 0.045, 0.12), plazaRimMat);
  rimNorth.position.set(pCenterX, pElev * 0.5 + 0.002, plazaZ - plazaD * 0.5 - 0.06);
  pathGroup.add(rimNorth);

  const rimSouth = new THREE.Mesh(new THREE.BoxGeometry(plazaW + 0.24, 0.045, 0.12), plazaRimMat);
  rimSouth.position.set(pCenterX, pElev * 0.5 + 0.002, plazaZ + plazaD * 0.5 + 0.06);
  pathGroup.add(rimSouth);

  const rimWest = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.045, plazaD), plazaRimMat);
  rimWest.position.set(pCenterX - plazaW * 0.5 - 0.06, pElev * 0.5 + 0.002, plazaZ);
  pathGroup.add(rimWest);

  const rimEast = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.045, plazaD), plazaRimMat);
  rimEast.position.set(pCenterX + plazaW * 0.5 + 0.06, pElev * 0.5 + 0.002, plazaZ);
  pathGroup.add(rimEast);

  return pathGroup;
}

/**
 * Creates the 1.8 m Perimeter Stone & Sandalwood Timber Boundary Wall
 * with Grand Entrance Gate Piers per PRD Section 4.8 & 5.1 (F10).
 */
function buildPerimeterWalls(centerZ) {
  const wallGroup = new THREE.Group();
  wallGroup.name = 'estate-perimeter-walls';
  const colliders = [];

  const wallH = 1.8; // 1.8 m total height
  const plinthH = 0.45; // 0.45 m stone base
  const plinthW = 0.35; // 0.35 m thick
  const timberH = 1.15; // 1.15 m timber infill
  const copingH = 0.2; // 0.2 m stone cap

  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#A79982',
    roughness: 0.85,
  });

  const timberPair = typeof document !== 'undefined'
    ? getTimberTextures('sandalwood', 8, 2)
    : { map: null, bumpMap: null };

  const timberMat = new THREE.MeshStandardMaterial({
    map: timberPair.map,
    bumpMap: timberPair.bumpMap,
    bumpScale: 0.02,
    color: '#8A5D3B',
    roughness: 0.78,
  });

  const copingMat = new THREE.MeshStandardMaterial({
    color: '#C5B8A3',
    roughness: 0.75,
  });

  // Helper to build a composite wall segment (stone plinth + timber panel + stone coping)
  function addWallSegment(cx, cz, w, d, id) {
    const segGroup = new THREE.Group();
    segGroup.name = id;

    // Stone plinth
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(w, plinthH, d), stoneMat);
    plinth.position.set(cx, plinthH * 0.5, cz);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    segGroup.add(plinth);

    // Sandalwood timber infill
    const timberThick = w > d ? Math.min(d * 0.7, 0.2) : w;
    const timberW = w > d ? w : Math.min(w * 0.7, 0.2);
    const timberD = w > d ? timberThick : d;
    const timber = new THREE.Mesh(new THREE.BoxGeometry(timberW, timberH, timberD), timberMat);
    timber.position.set(cx, plinthH + timberH * 0.5, cz);
    timber.castShadow = true;
    timber.receiveShadow = true;
    segGroup.add(timber);

    // Stone coping cap
    const coping = new THREE.Mesh(new THREE.BoxGeometry(w, copingH, d), copingMat);
    coping.position.set(cx, plinthH + timberH + copingH * 0.5, cz);
    coping.castShadow = true;
    segGroup.add(coping);

    wallGroup.add(segGroup);

    // Register AABB collider
    colliders.push({
      id: `collider-${id}`,
      type: 'box',
      minX: cx - w * 0.5,
      maxX: cx + w * 0.5,
      minZ: cz - d * 0.5,
      maxZ: cz + d * 0.5,
      minY: 0,
      maxY: wallH + 0.5,
    });
  }

  // 1. North Rear Boundary Wall (80 m wide at Z = -25.0)
  addWallSegment(0, -24.8, 80, plinthW, 'wall-north-rear');

  // 2. West Boundary Wall (70 m deep at X = -40.0)
  addWallSegment(-39.8, centerZ, plinthW, 70, 'wall-west');

  // 3. East Boundary Wall (70 m deep at X = 40.0)
  addWallSegment(39.8, centerZ, plinthW, 70, 'wall-east');

  // 4. South Front Boundary Wall with Gate Opening (Z = 44.8 m)
  // Total span 80 m, with 4.5 m opening for central pathway at X = 3.5 m (X in [1.25, 5.75])
  const leftW = 41.25; // from X = -40.0 to X = 1.25
  const leftX = (-40.0 + 1.25) * 0.5;
  addWallSegment(leftX, 44.8, leftW, plinthW, 'wall-south-left');

  const rightW = 34.25; // from X = 5.75 to X = 40.0
  const rightX = (5.75 + 40.0) * 0.5;
  addWallSegment(rightX, 44.8, rightW, plinthW, 'wall-south-right');

  // 5. Two Grand Entrance Gate Piers (2.4 m high stone pillars at X = 1.25 and X = 5.75)
  const pierPositions = [
    { x: 1.25, z: 44.8, id: 'gate-pier-west' },
    { x: 5.75, z: 44.8, id: 'gate-pier-east' },
  ];

  pierPositions.forEach((pier) => {
    const pGroup = new THREE.Group();
    pGroup.name = pier.id;

    // Pillar shaft (0.75 x 0.75 x 2.2 m)
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.2, 0.75), stoneMat);
    shaft.position.set(pier.x, 1.1, pier.z);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    pGroup.add(shaft);

    // Pyramidal stone cap
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.35, 4), copingMat);
    cap.position.set(pier.x, 2.375, pier.z);
    cap.rotation.y = Math.PI / 4;
    cap.castShadow = true;
    pGroup.add(cap);

    // Bronze carriage coach lantern on pier top
    const lanternMat = new THREE.MeshStandardMaterial({
      color: '#2B241E',
      metalness: 0.85,
    });
    const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.24), lanternMat);
    lantern.position.set(pier.x, 2.65, pier.z);
    pGroup.add(lantern);

    // Emissive lantern core
    const coreMat = new THREE.MeshStandardMaterial({
      color: '#FFE29A',
      emissive: '#FFB240',
      emissiveIntensity: 0.8,
    });
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.16), coreMat);
    core.position.set(pier.x, 2.65, pier.z);
    pGroup.add(core);

    wallGroup.add(pGroup);

    colliders.push({
      id: `collider-${pier.id}`,
      type: 'box',
      minX: pier.x - 0.45,
      maxX: pier.x + 0.45,
      minZ: pier.z - 0.45,
      maxZ: pier.z + 0.45,
      minY: 0,
      maxY: 2.8,
    });
  });

  return { wallGroup, colliders };
}

/**
 * Master Garden Grounds (80 m x 70 m) and Exterior Subsystem Orchestrator.
 * Integrates sculpted terrain, central paver pathway, perimeter walls,
 * 12 botanical flower beds, mature specimen trees, benches, lanterns,
 * and swimming pool terrace with caustics.
 */
export function createGarden(scene) {
  const masterGroup = new THREE.Group();
  masterGroup.name = 'estate-garden-world';

  const allColliders = [];

  // 1. Sculpted master terrain mesh (max height variation <= 0.5 m)
  const segX = 96;
  const segZ = 84;
  const terrainGeo = new THREE.PlaneGeometry(
    WORLD_DIMENSIONS.gardenWidth,
    WORLD_DIMENSIONS.gardenDepth,
    segX,
    segZ
  );
  terrainGeo.rotateX(-Math.PI / 2);

  const centerZ = (WORLD_DIMENSIONS.gardenMinZ + WORLD_DIMENSIONS.gardenMaxZ) * 0.5;
  const pos = terrainGeo.getAttribute('position');
  const colors = new Float32Array(pos.count * 3);
  const cDeep = new THREE.Color('#315B3A');
  const cMid = new THREE.Color('#4F7948');
  const cLight = new THREE.Color('#7C9B5A');

  for (let i = 0; i < pos.count; i++) {
    const wx = pos.getX(i);
    const wz = pos.getZ(i) + centerZ;
    const wy = getTerrainHeight(wx, wz);
    pos.setY(i, wy);

    const mix = 0.5 + 0.5 * Math.sin(wx * 0.18 + wz * 0.14);
    const col = mix > 0.72 ? cMid.clone().lerp(cLight, (mix - 0.72) * 1.4) : cDeep.clone().lerp(cMid, mix);
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const lawnTex = typeof document !== 'undefined' ? getLawnTexture(18, 16) : null;
  const terrainMat = new THREE.MeshStandardMaterial({
    map: lawnTex,
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.0,
  });

  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.position.z = centerZ;
  terrainMesh.receiveShadow = true;
  masterGroup.add(terrainMesh);

  // 2. Central 2.4 m Sandstone Paver Pathway aligning with front porch & right door
  const pathway = buildCentralPathway();
  masterGroup.add(pathway);

  // 3. 1.8 m Perimeter Stone & Timber Boundary Walls with Gate Piers
  const { wallGroup, colliders: wallColliders } = buildPerimeterWalls(centerZ);
  masterGroup.add(wallGroup);
  allColliders.push(...wallColliders);

  // 4. Instanced Low Grass Tufts (quality-scaled, natural lawn texture without spiky cones)
  const MAX_GRASS = 4400;
  const bladeGeo = new THREE.ConeGeometry(0.016, 0.075, 4);
  bladeGeo.scale(1.35, 1.0, 0.45);
  bladeGeo.translate(0, 0.036, 0);
  const bladeMat = new THREE.MeshStandardMaterial({
    color: '#e8eedc',
    roughness: 0.9,
  });

  const grassInst = new THREE.InstancedMesh(bladeGeo, bladeMat, MAX_GRASS);
  grassInst.name = 'instanced-grass';
  grassInst.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const palette = [cDeep, cMid, new THREE.Color('#5E844C')];
  const grassMeta = [];

  let seed = 4099;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  let placed = 0;
  let attempts = 0;
  while (placed < MAX_GRASS && attempts < MAX_GRASS * 4) {
    attempts++;
    const gx = (rand() - 0.5) * 76;
    const gz = -22 + rand() * 64;

    // Exclude house footprint + buffer
    if (gx > -12.6 && gx < 12.6 && gz > -9.6 && gz < 12.4) continue;
    // Exclude central pathway corridor (2.4 m wide + margin)
    if (Math.abs(gx - WORLD_DIMENSIONS.pathwayCenterX) < 1.85 && gz >= 11.5 && gz <= 43.5) continue;
    // Exclude pool terrace
    if (
      gx >= POOL_SPEC.terraceMinX - 0.5 &&
      gx <= POOL_SPEC.terraceMaxX + 0.5 &&
      gz >= POOL_SPEC.terraceMinZ - 0.5 &&
      gz <= POOL_SPEC.terraceMaxZ + 0.5
    ) {
      continue;
    }
    // Exclude service court
    if (gx >= 3.2 && gx <= 8.8 && gz >= -13.2 && gz <= -8.8) continue;

    const gy = getTerrainHeight(gx, gz);
    const scaleH = 0.55 + rand() * 0.55; // 0.04 - 0.08 m natural turf tufts
    const rotY = rand() * Math.PI * 2;
    const tilt = (rand() - 0.5) * 0.28;

    dummy.position.set(gx, gy - 0.008, gz);
    dummy.rotation.set(tilt, rotY, (rand() - 0.5) * 0.16);
    dummy.scale.set(0.85 + rand() * 0.5, scaleH, 0.85 + rand() * 0.5);
    dummy.updateMatrix();
    grassInst.setMatrixAt(placed, dummy.matrix);

    const pick = rand();
    const col = pick < 0.48 ? palette[0] : pick < 0.88 ? palette[1] : palette[2];
    grassInst.setColorAt(placed, col);
    grassMeta.push({ x: gx, y: gy, z: gz, rotY, scaleH, tilt });
    placed++;
  }
  grassInst.count = placed;
  grassInst.instanceMatrix.needsUpdate = true;
  if (grassInst.instanceColor) grassInst.instanceColor.needsUpdate = true;
  masterGroup.add(grassInst);

  // 5. Integrate 12 Botanical Flower Beds (7 varieties, 450-650 instances, wind sway)
  const flowerBeds = createFlowerBeds();
  masterGroup.add(flowerBeds.group);

  // 6. Integrate Mature Trees & Garden Props (10 trees, 4 benches, 10 lanterns, boulders, planters)
  const treesAndProps = createTreesAndProps();
  masterGroup.add(treesAndProps.group);
  allColliders.push(...treesAndProps.colliders);

  // 7. Integrate Swimming Pool & Terrace (12x8m terrace, 8x4m pool, caustics, loungers, umbrella)
  const poolTerrace = createPoolTerrace();
  masterGroup.add(poolTerrace.group);
  allColliders.push(...poolTerrace.colliders);

  if (scene) {
    scene.add(masterGroup);
  }

  // Quality-scaled grass density
  let currentDensity = 1.0;
  function setDensity(densityFactor = 1.0) {
    currentDensity = Math.max(0.1, Math.min(1.0, densityFactor));
    grassInst.count = Math.floor(placed * currentDensity);
    flowerBeds.setDensity(currentDensity);
  }

  // Day/Night luminaire emissive transition
  function setNightFactor(factor = 0.0) {
    treesAndProps.setNightFactor(factor);
    poolTerrace.setNightFactor(factor);
  }

  // Master animation update loop driving grass shimmer, flower wind sway, tree canopy sway, and pool caustics
  function update(delta, elapsed = 0) {
    const time = elapsed || 0;

    // Gentle grass shimmer
    const wave = Math.sin(time * 1.4) * 0.04;
    grassInst.rotation.z = wave * 0.12;

    // Subsystem updates
    flowerBeds.update(delta, time);
    treesAndProps.update(delta, time);
    poolTerrace.update(delta, time);
  }

  masterGroup.userData = {
    flowerBeds,
    treesAndProps,
    poolTerrace,
    colliders: allColliders,
    setDensity,
    setNightFactor,
    update,
  };

  return {
    group: masterGroup,
    terrain: terrainMesh,
    pathway,
    walls: wallGroup,
    flowerBeds,
    treesAndProps,
    poolTerrace,
    colliders: allColliders,
    pathwayLights: treesAndProps.pathLights,
    setDensity,
    setNightFactor,
    update,
    getPlacedCount: () => Math.floor(placed * currentDensity),
  };
}

export const Garden = {
  createGarden,
};
