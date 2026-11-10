import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { WORLD_DIMENSIONS, getTerrainHeight, POOL_SPEC } from '../house/HouseArchitecture.js';
import { getLawnTexture, getStoneTileTextures, getTimberTextures } from '../assets/procedural/TextureGenerator.js';
import { createFlowerBeds, FLOWER_BED_LAYOUTS } from './FlowerBeds.js';
import { createTreesAndProps } from './TreesAndProps.js';
import { createPoolTerrace } from './PoolTerrace.js';

/**
 * Builds a realistic 3-blade arching grass tuft geometry merged for single-draw-call instancing.
 */
function buildGrassTuftGeometry() {
  const blades = [];
  for (let i = 0; i < 3; i++) {
    const seg = new THREE.PlaneGeometry(0.028, 0.125, 1, 3);
    const pos = seg.getAttribute('position');
    const colArr = new Float32Array(pos.count * 3);
    for (let v = 0; v < pos.count; v++) {
      const lx = pos.getX(v);
      const ly = pos.getY(v) + 0.0625; // shift root to Y = 0
      const t = Math.max(0, Math.min(1, ly / 0.125));
      const taper = 1.0 - t * 0.88;
      const arch = t * t * 0.038;
      pos.setXYZ(v, lx * taper, ly, pos.getZ(v) + arch);
      // Root-to-tip ambient occlusion so tufts ground softly on the turf
      const shade = 0.62 + 0.38 * t;
      colArr[v * 3] = shade * 0.94;
      colArr[v * 3 + 1] = shade * 1.02;
      colArr[v * 3 + 2] = shade * 0.88;
    }
    seg.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
    seg.rotateY((i / 3) * Math.PI * 2 + i * 0.25);
    seg.translate(Math.cos(i * 2.1) * 0.018, 0, Math.sin(i * 2.1) * 0.018);
    seg.computeVertexNormals();
    blades.push(seg);
  }
  const merged = mergeGeometries(blades, false);
  blades.forEach((b) => b.dispose());
  return merged;
}

/**
 * Creates the Central Sandstone Paver Pathway per PRD Section 3.2:
 * - 2.4 m wide continuous route from Arrival Plaza (Z = 40.0 m) to Front Porch (Z = 12.0 m).
 * - Centered at X = 3.5 m aligning with front porch steps and right-aligned main door.
 * - Beige natural stone pavers with normal/roughness relief, granite curb joints & 0.12 m dark border strips.
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
    ? getStoneTileTextures('paver', 4, 18)
    : { map: null, normalMap: null, roughnessMap: null };

  const paverMat = new THREE.MeshStandardMaterial({
    map: stoneTex.map,
    normalMap: stoneTex.normalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: stoneTex.roughnessMap,
    color: '#DDD0BA',
    roughness: 0.78,
  });

  // Dark carved basalt/granite curb border material (0.12 m wide strips)
  const borderTex = typeof document !== 'undefined'
    ? getStoneTileTextures('foyer', 1, 20)
    : { normalMap: null, roughnessMap: null };
  const borderMat = new THREE.MeshStandardMaterial({
    normalMap: borderTex.normalMap,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughnessMap: borderTex.roughnessMap,
    color: '#736654',
    roughness: 0.82,
  });

  // 1. Main paver corridor (2.16 m wide between 0.12 m borders)
  const innerW = pWidth - 0.24; // 2.16 m
  const paverMesh = new THREE.Mesh(new THREE.BoxGeometry(innerW, 0.04, pLength), paverMat);
  paverMesh.position.set(pCenterX, pElev * 0.5, pCenterZ);
  paverMesh.receiveShadow = true;
  pathGroup.add(paverMesh);

  // 2. Left & Right 0.12 m dark stone borders + subtle granite expansion joint strips every 2.0 m
  const borderL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.048, pLength), borderMat);
  borderL.position.set(pCenterX - innerW * 0.5 - 0.06, pElev * 0.5 + 0.004, pCenterZ);
  borderL.receiveShadow = true;
  pathGroup.add(borderL);

  const borderR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.048, pLength), borderMat);
  borderR.position.set(pCenterX + innerW * 0.5 + 0.06, pElev * 0.5 + 0.004, pCenterZ);
  borderR.receiveShadow = true;
  pathGroup.add(borderR);

  const jointGeo = new THREE.BoxGeometry(innerW, 0.042, 0.045);
  for (let jz = pEnd + 1.5; jz <= pStart - 1.5; jz += 2.2) {
    const joint = new THREE.Mesh(jointGeo, borderMat);
    joint.position.set(pCenterX, pElev * 0.5 + 0.001, jz);
    joint.receiveShadow = true;
    pathGroup.add(joint);
  }

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
  const rimNorth = new THREE.Mesh(new THREE.BoxGeometry(plazaW + 0.24, 0.048, 0.12), plazaRimMat);
  rimNorth.position.set(pCenterX, pElev * 0.5 + 0.004, plazaZ - plazaD * 0.5 - 0.06);
  pathGroup.add(rimNorth);

  const rimSouth = new THREE.Mesh(new THREE.BoxGeometry(plazaW + 0.24, 0.048, 0.12), plazaRimMat);
  rimSouth.position.set(pCenterX, pElev * 0.5 + 0.004, plazaZ + plazaD * 0.5 + 0.06);
  pathGroup.add(rimSouth);

  const rimWest = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.048, plazaD), plazaRimMat);
  rimWest.position.set(pCenterX - plazaW * 0.5 - 0.06, pElev * 0.5 + 0.004, plazaZ);
  pathGroup.add(rimWest);

  const rimEast = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.048, plazaD), plazaRimMat);
  rimEast.position.set(pCenterX + plazaW * 0.5 + 0.06, pElev * 0.5 + 0.004, plazaZ);
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

  const stoneTex = typeof document !== 'undefined'
    ? getStoneTileTextures('foyer', 10, 1)
    : { map: null, normalMap: null, roughnessMap: null };

  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex.map,
    normalMap: stoneTex.normalMap,
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughnessMap: stoneTex.roughnessMap,
    color: '#AEA088',
    roughness: 0.85,
  });

  const timberPair = typeof document !== 'undefined'
    ? getTimberTextures('sandalwood', 10, 2)
    : { map: null, normalMap: null, roughnessMap: null };

  const timberMat = new THREE.MeshStandardMaterial({
    map: timberPair.map,
    normalMap: timberPair.normalMap,
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughnessMap: timberPair.roughnessMap,
    color: '#91633E',
    roughness: 0.78,
  });

  const copingMat = new THREE.MeshStandardMaterial({
    normalMap: stoneTex.normalMap,
    normalScale: new THREE.Vector2(0.5, 0.5),
    color: '#C7BA9F',
    roughness: 0.74,
  });

  // Helper to build a composite wall segment (stone plinth + timber panel + stone coping + pilasters)
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

    // Periodic stone structural pilasters along long boundary runs
    const isLongX = w > d;
    const span = isLongX ? w : d;
    const pilCount = Math.floor(span / 12);
    if (pilCount >= 1) {
      const pilGeo = new THREE.BoxGeometry(0.48, wallH + 0.08, 0.48);
      for (let i = 1; i < pilCount; i++) {
        const off = -span * 0.5 + (i / pilCount) * span;
        const pil = new THREE.Mesh(pilGeo, stoneMat);
        pil.position.set(isLongX ? cx + off : cx, (wallH + 0.08) * 0.5, isLongX ? cz : cz + off);
        pil.castShadow = true;
        pil.receiveShadow = true;
        segGroup.add(pil);
      }
    }

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
  const leftW = 41.25; // from X = -40.0 to X = 1.25
  const leftX = (-40.0 + 1.25) * 0.5;
  addWallSegment(leftX, 44.8, leftW, plinthW, 'wall-south-left');

  const rightW = 34.25; // from X = 5.75 to X = 40.0
  const rightX = (5.75 + 40.0) * 0.5;
  addWallSegment(rightX, 44.8, rightW, plinthW, 'wall-south-right');

  // 5. Two Grand Entrance Gate Piers + Swung-Open Bronze Estate Gate Leaves
  const pierPositions = [
    { x: 1.25, z: 44.8, id: 'gate-pier-west', swingSign: -1 },
    { x: 5.75, z: 44.8, id: 'gate-pier-east', swingSign: 1 },
  ];

  const bronzeGateMat = new THREE.MeshStandardMaterial({
    color: '#2B241E',
    metalness: 0.85,
    roughness: 0.34,
  });

  pierPositions.forEach((pier) => {
    const pGroup = new THREE.Group();
    pGroup.name = pier.id;

    // Pillar base collar
    const baseCollar = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.32, 0.86), copingMat);
    baseCollar.position.set(pier.x, 0.16, pier.z);
    pGroup.add(baseCollar);

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
    const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.24), bronzeGateMat);
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

    // Architectural wrought-bronze open gate wing pinned along entrance plaza edge (completely clear of X=[1.8,5.2])
    const leafW = 1.65;
    const leafGroup = new THREE.Group();
    leafGroup.position.set(pier.x - pier.swingSign * 0.28, 0, pier.z - 0.25);
    leafGroup.rotation.y = pier.swingSign * -1.42;

    const topRail = new THREE.Mesh(new THREE.BoxGeometry(leafW, 0.05, 0.04), bronzeGateMat);
    topRail.position.set(-pier.swingSign * leafW * 0.5, 1.55, 0);
    leafGroup.add(topRail);

    const botRail = new THREE.Mesh(new THREE.BoxGeometry(leafW, 0.06, 0.045), bronzeGateMat);
    botRail.position.set(-pier.swingSign * leafW * 0.5, 0.22, 0);
    leafGroup.add(botRail);

    for (let k = 0; k <= 7; k++) {
      const px = -pier.swingSign * (0.08 + (k / 7) * (leafW - 0.16));
      const picket = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.48, 6), bronzeGateMat);
      picket.position.set(px, 0.88, 0);
      picket.castShadow = true;
      leafGroup.add(picket);
    }
    pGroup.add(leafGroup);

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
  const segX = 64;
  const segZ = 56;
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
  // High-key seasonal moisture/sunlight modulation colors (multiplied onto lawnTex)
  const cDeep = new THREE.Color('#B5C89E');
  const cMid = new THREE.Color('#DCEEC0');
  const cLight = new THREE.Color('#F3F8D2');
  const cWarm = new THREE.Color('#D5E1AA');
  const tmpCol = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const wx = pos.getX(i);
    const wz = pos.getZ(i) + centerZ;
    const wy = getTerrainHeight(wx, wz);
    pos.setY(i, wy);

    const wave1 = 0.5 + 0.5 * Math.sin(wx * 0.17 + wz * 0.13);
    const wave2 = 0.5 + 0.5 * Math.cos(wx * 0.09 - wz * 0.19);
    if (wave1 > 0.72) {
      tmpCol.copy(cMid).lerp(cLight, (wave1 - 0.72) * 1.45);
    } else {
      tmpCol.copy(cDeep).lerp(cMid, wave1);
    }
    if (wave2 > 0.65) {
      tmpCol.lerp(cWarm, (wave2 - 0.65) * 0.45);
    }
    colors[i * 3] = tmpCol.r;
    colors[i * 3 + 1] = tmpCol.g;
    colors[i * 3 + 2] = tmpCol.b;
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

  // 4. Instanced 3-Blade Arching Grass Tufts (9600 tufts with GLSL gentle breeze wave, excluding beds/path/pool)
  const MAX_GRASS = 9600;
  const tuftGeo = buildGrassTuftGeometry();
  const bladeMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    vertexColors: true,
    roughness: 0.84,
    side: THREE.DoubleSide,
  });
  bladeMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float tipFactor = clamp(position.y / 0.125, 0.0, 1.0);
       #ifdef USE_INSTANCING
         vec4 instCenter = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
         float breeze = sin(uTime * 1.85 + instCenter.x * 0.35 + instCenter.z * 0.28) * 0.024 * tipFactor * tipFactor;
         transformed.x += breeze;
         transformed.z += breeze * 0.55;
       #endif
      `
    );
    bladeMat.userData.shader = shader;
  };

  const grassInst = new THREE.InstancedMesh(tuftGeo, bladeMat, MAX_GRASS);
  grassInst.name = 'instanced-grass';
  grassInst.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const palette = [
    new THREE.Color('#568A49'),
    new THREE.Color('#6B9E55'),
    new THREE.Color('#7EB05E'),
    new THREE.Color('#90BC68'),
  ];

  let seed = 4099;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const isInsideFlowerBed = (x, z) => {
    for (let i = 0; i < FLOWER_BED_LAYOUTS.length; i++) {
      const b = FLOWER_BED_LAYOUTS[i];
      if (Math.abs(x - b.x) < b.width * 0.55 && Math.abs(z - b.z) < b.depth * 0.6) {
        return true;
      }
    }
    return false;
  };

  let placed = 0;
  let attempts = 0;
  while (placed < MAX_GRASS && attempts < MAX_GRASS * 5) {
    attempts++;
    // Bias ~35% of tufts onto front lawn corridor & flower bed borders for rich close-up density
    const focusFront = placed < MAX_GRASS * 0.35;
    const gx = focusFront ? -14 + rand() * 32 : (rand() - 0.5) * 76;
    const gz = focusFront ? 10 + rand() * 32 : -22 + rand() * 64;

    if (gx > -12.6 && gx < 12.6 && gz > -9.6 && gz < 12.4) continue;
    if (Math.abs(gx - WORLD_DIMENSIONS.pathwayCenterX) < 1.85 && gz >= 11.5 && gz <= 43.5) continue;
    if (
      gx >= POOL_SPEC.terraceMinX - 0.5 &&
      gx <= POOL_SPEC.terraceMaxX + 0.5 &&
      gz >= POOL_SPEC.terraceMinZ - 0.5 &&
      gz <= POOL_SPEC.terraceMaxZ + 0.5
    ) {
      continue;
    }
    if (gx >= 3.2 && gx <= 8.8 && gz >= -13.2 && gz <= -8.8) continue;
    if (isInsideFlowerBed(gx, gz)) continue;

    const gy = getTerrainHeight(gx, gz);
    const scaleH = 0.72 + rand() * 0.64;
    const rotY = rand() * Math.PI * 2;
    const tilt = (rand() - 0.5) * 0.18;

    dummy.position.set(gx, gy - 0.008, gz);
    dummy.rotation.set(tilt, rotY, (rand() - 0.5) * 0.14);
    dummy.scale.set(0.95 + rand() * 0.45, scaleH, 0.95 + rand() * 0.45);
    dummy.updateMatrix();
    grassInst.setMatrixAt(placed, dummy.matrix);

    const pick = rand();
    const col = pick < 0.35 ? palette[0] : pick < 0.7 ? palette[1] : pick < 0.9 ? palette[2] : palette[3];
    grassInst.setColorAt(placed, col);
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

  // Master animation update loop driving grass wind uniform, flower wind sway, tree canopy sway, and pool caustics
  function update(delta, elapsed = 0) {
    const time = elapsed || 0;

    if (bladeMat.userData && bladeMat.userData.shader) {
      bladeMat.userData.shader.uniforms.uTime.value = time;
    }

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
