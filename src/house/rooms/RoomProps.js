import * as THREE from 'three';
import { getArtworkTexture } from '../../assets/procedural/TextureGenerator.js';

/**
 * Loads procedural gallery artwork with an offline/headless canvas fallback and wraps it in a matte material.
 */
export function createSafeArtworkMaterial(theme, fallbackHex = '#5F7762', roughness = 0.78) {
  let mapTex;
  try {
    mapTex = getArtworkTexture(theme);
  } catch {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = fallbackHex;
      ctx.fillRect(0, 0, 512, 640);
    }
    mapTex = new THREE.CanvasTexture(canvas);
    mapTex.colorSpace = THREE.SRGBColorSpace;
  }
  return new THREE.MeshStandardMaterial({
    map: mapTex,
    roughness,
    metalness: 0.0,
  });
}

/**
 * Creates a smoothly contoured rounded-corner box geometry via 2D chamfered extrusion
 * centered at local origin — eliminates razor-sharp cube edges on upholstery, tables & mattresses.
 */
export function createChamferedBoxGeo(w, h, d, r = 0.03) {
  const rad = Math.min(r, w * 0.28, d * 0.28);
  const hw = w * 0.5;
  const hd = d * 0.5;
  const shape = new THREE.Shape();
  shape.moveTo(-hw + rad, -hd);
  shape.lineTo(hw - rad, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + rad);
  shape.lineTo(hw, hd - rad);
  shape.quadraticCurveTo(hw, hd, hw - rad, hd);
  shape.lineTo(-hw + rad, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - rad);
  shape.lineTo(-hw, -hd + rad);
  shape.quadraticCurveTo(-hw, -hd, -hw + rad, -hd);

  const bevel = Math.min(rad * 0.45, h * 0.22);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.004, h - bevel * 2),
    bevelEnabled: bevel > 0.001,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 4,
  });
  geo.rotateX(-Math.PI / 2);
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates a soft pinched, plump pillow geometry for sofas, armchairs, and beds.
 */
export function createPlushPillowGeo(w = 0.44, h = 0.36, d = 0.14) {
  const geo = new THREE.BoxGeometry(w, h, d, 6, 5, 3);
  const pos = geo.getAttribute('position');
  const hw = w * 0.5;
  const hh = h * 0.5;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const nx = x / hw;
    const ny = y / hh;
    const belly = Math.max(0, (1 - nx * nx * 0.85) * (1 - ny * ny * 0.85));
    const cornerPinch = 1.0 - 0.14 * Math.abs(nx * ny);
    const pz = z * (0.45 + belly * 0.85) * cornerPinch;
    pos.setXYZ(i, x * (1.0 - 0.06 * ny * ny), y * (1.0 - 0.06 * nx * nx), pz);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a radially symmetric LatheGeometry from `[radius, y]` pairs.
 */
export function createLatheGeo(pairs, segs = 18) {
  const pts = pairs.map(([r, y]) => new THREE.Vector2(Math.max(0.001, r), y));
  const geo = new THREE.LatheGeometry(pts, segs);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds an articulated indoor potted plant with multi-branched stems and arched pointed leaves
 * in a sculpted ceramic planter — zero primitive spheres or boxes.
 */
export function createPottedPlant({
  potMat,
  leafMat,
  stemMat,
  soilMat,
  potRadius = 0.2,
  potHeight = 0.34,
  leafCount = 12,
  scale = 1.0,
  flutedPot = false,
} = {}) {
  const group = new THREE.Group();
  const potGeo = createLatheGeo([
    [potRadius * 0.62, 0],
    [potRadius * 0.88, potHeight * 0.55],
    [potRadius, potHeight * 0.94],
    [potRadius * 0.92, potHeight],
    [potRadius * 0.78, potHeight * 0.94],
  ], 16);
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.castShadow = true;
  pot.receiveShadow = true;
  group.add(pot);

  const soil = new THREE.Mesh(new THREE.CircleGeometry(potRadius * 0.8, 12), soilMat);
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = potHeight * 0.92;
  group.add(soil);

  // Tapered curved leaf card
  const leafLen = 0.36 * scale;
  const leafW = 0.14 * scale;
  const leafGeo = new THREE.PlaneGeometry(leafW, leafLen, 2, 4);
  const lp = leafGeo.getAttribute('position');
  for (let i = 0; i < lp.count; i++) {
    const lx = lp.getX(i);
    const t = Math.max(0, Math.min(1, (lp.getY(i) + leafLen * 0.5) / leafLen));
    const widthScale = Math.sin(t * Math.PI) * (1 - t * 0.25);
    const droopZ = t * t * 0.18 * scale;
    const archY = Math.sin(t * Math.PI * 0.72) * (0.28 * scale) + t * 0.1 * scale;
    lp.setXYZ(i, lx * widthScale, archY, droopZ + t * 0.12 * scale);
  }
  leafGeo.computeVertexNormals();

  const doubleLeafMat = leafMat.clone();
  doubleLeafMat.side = THREE.DoubleSide;

  if (flutedPot) {
    const fluteCount = 16;
    for (let f = 0; f < fluteCount; f++) {
      const ang = (f / fluteCount) * Math.PI * 2;
      const rMid = potRadius * 0.9;
      const flute = new THREE.Mesh(
        new THREE.CylinderGeometry(potRadius * 0.055, potRadius * 0.042, potHeight * 0.88, 6),
        potMat
      );
      flute.position.set(Math.cos(ang) * rMid, potHeight * 0.46, Math.sin(ang) * rMid);
      group.add(flute);
    }
  }

  if (scale >= 1.35) {
    // Organic multi-branched indoor olive / ficus tree with irregular crooked boughs & clustered canopy
    const trunkBaseY = potHeight * 0.88;
    const hScale = scale * 0.72;
    const mainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, trunkBaseY, 0),
      new THREE.Vector3(0.03 * scale, trunkBaseY + 0.34 * hScale, -0.02 * scale),
      new THREE.Vector3(-0.02 * scale, trunkBaseY + 0.68 * hScale, 0.03 * scale),
      new THREE.Vector3(0.01 * scale, trunkBaseY + 0.96 * hScale, 0.0),
    ]);
    const mainTrunk = new THREE.Mesh(new THREE.TubeGeometry(mainCurve, 12, 0.024 * scale, 7, false), stemMat);
    mainTrunk.castShadow = true;
    group.add(mainTrunk);

    const branchDefs = [
      { startY: 0.56, dx: -0.24, dy: 0.58, dz: 0.16, r: 0.014 },
      { startY: 0.64, dx: 0.26, dy: 0.52, dz: -0.14, r: 0.013 },
      { startY: 0.74, dx: -0.08, dy: 0.64, dz: -0.22, r: 0.012 },
      { startY: 0.82, dx: 0.14, dy: 0.54, dz: 0.22, r: 0.011 },
    ];
    const crownCenters = [];
    for (const b of branchDefs) {
      const sy = trunkBaseY + b.startY * hScale;
      const bCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, sy, 0),
        new THREE.Vector3(b.dx * 0.18 * scale, sy + b.dy * 0.32 * hScale, b.dz * 0.18 * scale),
        new THREE.Vector3(b.dx * 0.52 * scale, sy + b.dy * 0.65 * hScale, b.dz * 0.52 * scale),
      ]);
      const bMesh = new THREE.Mesh(new THREE.TubeGeometry(bCurve, 8, b.r * scale, 6, false), stemMat);
      bMesh.castShadow = true;
      group.add(bMesh);
      crownCenters.push([b.dx * 0.52 * scale, sy + b.dy * 0.65 * hScale, b.dz * 0.52 * scale]);
    }
    crownCenters.push([0.01 * scale, trunkBaseY + 0.98 * hScale, 0]);

    const twigLeaves = Math.max(24, leafCount * 2);
    for (let i = 0; i < twigLeaves; i++) {
      const c = crownCenters[i % crownCenters.length];
      const ang = i * 2.39996;
      const rad = 0.04 + ((i % 5) / 5) * 0.14 * scale;
      const lf = new THREE.Mesh(leafGeo, doubleLeafMat);
      lf.position.set(
        c[0] + Math.cos(ang) * rad * 0.45,
        c[1] + ((i % 3) - 1) * 0.065 * scale,
        c[2] + Math.sin(ang) * rad * 0.45
      );
      lf.rotation.y = Math.PI / 2 - ang;
      lf.rotation.x = -0.24 + (i % 4) * 0.16;
      lf.scale.setScalar((0.52 + ((i % 3) * 0.14)) / Math.max(1, scale * 0.55));
      lf.castShadow = true;
      group.add(lf);
    }
  } else {
    for (let i = 0; i < leafCount; i++) {
      const ang = i * 2.39996;
      const tier = i / Math.max(1, leafCount - 1);
      const stemH = potHeight * 0.9 + tier * 0.38 * scale;
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008 * scale, 0.013 * scale, stemH - potHeight * 0.8 + 0.08, 6),
        stemMat
      );
      const reach = (0.04 + (1 - tier) * 0.06) * scale;
      stem.position.set(Math.cos(ang) * reach * 0.5, potHeight * 0.82 + (stemH - potHeight * 0.8) * 0.45, Math.sin(ang) * reach * 0.5);
      stem.rotation.z = -Math.cos(ang) * 0.22;
      stem.rotation.x = Math.sin(ang) * 0.22;
      group.add(stem);

      const leaf = new THREE.Mesh(leafGeo, doubleLeafMat);
      leaf.position.set(Math.cos(ang) * reach, stemH, Math.sin(ang) * reach);
      leaf.rotation.y = Math.PI / 2 - ang;
      leaf.rotation.x = -0.18 + tier * 0.28;
      leaf.scale.setScalar(0.85 + (1 - Math.abs(tier - 0.5)) * 0.3);
      leaf.castShadow = true;
      group.add(leaf);
    }
  }

  return group;
}

/**
 * Builds a stack of rounded folded cotton towels or throws.
 */
export function createFoldedTowelStack(materials, widths = [0.34, 0.31], heights = [0.065, 0.055], depth = 0.24) {
  const stack = new THREE.Group();
  let curY = 0;
  for (let i = 0; i < widths.length; i++) {
    const w = widths[i];
    const h = heights[i];
    const towel = new THREE.Mesh(createChamferedBoxGeo(w, h, depth, 0.02), materials[i % materials.length]);
    towel.position.set(0, curY + h * 0.5, 0);
    towel.rotation.y = (i % 2 === 0 ? 1 : -1) * 0.04;
    towel.castShadow = true;
    towel.receiveShadow = true;
    stack.add(towel);
    curY += h - 0.004;
  }
  return stack;
}

/**
 * Shared sculptural brushed-brass or chrome gooseneck faucet (height ~0.28-0.35m).
 */
export function createGooseneckFaucet(metalMat, height = 0.28, reach = 0.14) {
  const faucet = new THREE.Group();
  const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.015, 14), metalMat);
  basePlate.position.y = 0.0075;
  faucet.add(basePlate);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.01, 0),
    new THREE.Vector3(0, height * 0.72, 0),
    new THREE.Vector3(reach * 0.45, height, 0),
    new THREE.Vector3(reach * 0.92, height * 0.92, 0),
    new THREE.Vector3(reach, height * 0.66, 0),
  ]);
  const spout = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.011, 10, false), metalMat);
  spout.castShadow = true;
  faucet.add(spout);

  const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.006, 0.075, 8), metalMat);
  lever.position.set(0.01, 0.07, 0.042);
  lever.rotation.x = Math.PI * 0.35;
  faucet.add(lever);

  return faucet;
}

/**
 * Generates a contoured woven throw blanket geometry that drapes softly over a sofa armrest
 * or bed foot instead of sitting as a sharp box.
 */
export function createDrapedThrowGeo(spanWidth = 0.28, dropHeight = 0.34, depth = 0.46) {
  const segX = 14;
  const segZ = 8;
  const geo = new THREE.BoxGeometry(spanWidth + dropHeight * 1.15, 0.022, depth, segX, 2, segZ);
  const pos = geo.getAttribute('position');
  const halfArch = spanWidth * 0.5;

  for (let i = 0; i < pos.count; i++) {
    const ux = pos.getX(i);
    const uy = pos.getY(i);
    const uz = pos.getZ(i);
    const pleat = Math.sin((uz / Math.max(0.05, depth)) * Math.PI * 5.0) * 0.006;

    let nx = ux;
    let ny = uy;
    if (Math.abs(ux) <= halfArch) {
      // Gentle convex crown over armrest/cushion top
      const t = ux / Math.max(0.01, halfArch);
      ny = uy + (1 - t * t) * 0.014 + pleat;
    } else {
      // Natural vertical drape cascade down sides
      const side = Math.sign(ux);
      const excess = Math.abs(ux) - halfArch;
      const curveR = 0.032;
      if (excess <= curveR) {
        const ang = (excess / curveR) * (Math.PI * 0.5);
        nx = side * (halfArch + Math.sin(ang) * curveR) + (uy * Math.sin(ang));
        ny = Math.cos(ang) * curveR - curveR + uy * Math.cos(ang) + pleat;
      } else {
        const drop = excess - curveR;
        nx = side * (halfArch + curveR + drop * 0.08 + pleat * 0.6);
        ny = -curveR - drop + uy * 0.15;
      }
    }
    pos.setXYZ(i, nx, ny, uz);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a high-craft gallery framed artwork assembly with architectural depth:
 * - child[0]: recessed dark backing block (`frameMaxZ = 0.009` for strict test contract)
 * - child[1]: recessed artwork canvas (`z = 0.018 > frameMaxZ + 0.002`)
 * - child[2..]: 4 outer projecting mitered molding rails, linen matboard reveal,
 *   brass inner fillet, satin protective glass glaze, and optional 2700K brass picture light bar.
 */
export function createCuratedFramedArt({
  artMat,
  width = 0.96,
  height = 1.1,
  frameMat,
  matMat,
  brassMat,
  glassMat,
  withPictureLight = false,
  lightIntensity = 0.45,
} = {}) {
  const artGroup = new THREE.Group();
  const railW = 0.042;
  const matPad = 0.065;
  const innerW = Math.max(0.24, width - matPad * 2);
  const innerH = Math.max(0.24, height - matPad * 2);

  // [0] Recessed backing frame so frameMaxZ = 0.009
  const backFrameMesh = new THREE.Mesh(
    new THREE.BoxGeometry(width + railW * 1.4, height + railW * 1.4, 0.018),
    frameMat
  );
  backFrameMesh.position.set(0, 0, 0);
  backFrameMesh.castShadow = true;
  artGroup.add(backFrameMesh);

  // [1] Recessed textured artwork canvas proud of backing
  const canvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(innerW, innerH), artMat);
  canvasMesh.position.set(0, 0, 0.018);
  artGroup.add(canvasMesh);

  // [2] Linen matboard behind canvas border + fine inner brass fillet surround
  const matBoardColor =
    matMat ||
    new THREE.MeshStandardMaterial({
      color: 0xf3ece0,
      roughness: 0.9,
    });
  const matBoard = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.005),
    matBoardColor
  );
  matBoard.position.set(0, 0, 0.013);
  artGroup.add(matBoard);

  if (brassMat) {
    const filletT = 0.007;
    const fZ = 0.017;
    for (const fy of [innerH * 0.5 + filletT * 0.5, -(innerH * 0.5 + filletT * 0.5)]) {
      const hf = new THREE.Mesh(new THREE.BoxGeometry(innerW + filletT * 2, filletT, 0.004), brassMat);
      hf.position.set(0, fy, fZ);
      artGroup.add(hf);
    }
    for (const fx of [-(innerW * 0.5 + filletT * 0.5), innerW * 0.5 + filletT * 0.5]) {
      const vf = new THREE.Mesh(new THREE.BoxGeometry(filletT, innerH, 0.004), brassMat);
      vf.position.set(fx, 0, fZ);
      artGroup.add(vf);
    }
  }

  // [3] 4 projecting outer frame moldings creating a real shadowbox lip ahead of glass
  const railD = 0.028;
  const railZ = 0.014;
  const fullOuterW = width + railW * 2;
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(fullOuterW, railW, railD), frameMat);
  topRail.position.set(0, height * 0.5 + railW * 0.5, railZ);
  topRail.castShadow = true;
  artGroup.add(topRail);

  const botRail = new THREE.Mesh(new THREE.BoxGeometry(fullOuterW, railW, railD), frameMat);
  botRail.position.set(0, -(height * 0.5 + railW * 0.5), railZ);
  botRail.castShadow = true;
  artGroup.add(botRail);

  for (const sx of [-1, 1]) {
    const sideRail = new THREE.Mesh(new THREE.BoxGeometry(railW, height, railD), frameMat);
    sideRail.position.set(sx * (width * 0.5 + railW * 0.5), 0, railZ);
    sideRail.castShadow = true;
    artGroup.add(sideRail);
  }

  // [4] Subtle gallery anti-glare glass glaze
  const glaze =
    glassMat ||
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.08,
      metalness: 0.02,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
  const glassMesh = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.004, height - 0.004), glaze);
  glassMesh.position.set(0, 0, 0.022);
  artGroup.add(glassMesh);

  // [5] Optional brushed-brass warm gallery picture light bar
  if (withPictureLight && brassMat) {
    const picLightBarW = Math.min(0.62, width * 0.52);
    const topY = height * 0.5 + railW + 0.055;
    const armZ = 0.095;

    const backplate = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.042, 0.014), brassMat);
    backplate.position.set(0, topY, 0.006);
    artGroup.add(backplate);

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, armZ, 8), brassMat);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(0, topY, armZ * 0.5);
    artGroup.add(arm);

    const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, picLightBarW, 12), brassMat);
    hood.rotation.z = Math.PI / 2;
    hood.position.set(0, topY - 0.008, armZ + 0.012);
    hood.castShadow = true;
    artGroup.add(hood);

    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfff1d6,
      emissive: 0xffd089,
      emissiveIntensity: 0.55,
      roughness: 0.3,
    });
    const diffuser = new THREE.Mesh(
      new THREE.BoxGeometry(picLightBarW - 0.04, 0.008, 0.016),
      bulbMat
    );
    diffuser.position.set(0, topY - 0.022, armZ + 0.012);
    artGroup.add(diffuser);

    const light = new THREE.PointLight(0xffe0b2, lightIntensity, 3.2, 1.7);
    light.position.set(0, topY - 0.08, armZ + 0.05);
    artGroup.add(light);

    artGroup.userData.pictureLight = {
      light,
      baseIntensity: lightIntensity,
      emissiveMat: bulbMat,
      baseEmissive: 0.9,
    };
  }

  return artGroup;
}

let cachedAoTex = null;

function getContactAoTexture() {
  if (cachedAoTex) return cachedAoTex;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.14, size * 0.5, size * 0.5, size * 0.5);
    grad.addColorStop(0, 'rgba(32, 24, 18, 0.72)');
    grad.addColorStop(0.55, 'rgba(32, 24, 18, 0.32)');
    grad.addColorStop(1, 'rgba(32, 24, 18, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  cachedAoTex = tex;
  return tex;
}

/**
 * Creates a soft baked contact-ambient-occlusion floor shadow plane anchoring furniture silhouettes
 * to wide-plank wood and travertine surfaces without extra shadow-casting overhead.
 */
export function createContactAoMesh(width = 1.4, depth = 0.85, opacity = 0.28) {
  const geo = new THREE.PlaneGeometry(width, depth);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: getContactAoTexture(),
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.003;
  return mesh;
}

/**
 * Creates a vertical reeded / fluted wood or travertine architectural front panel
 * with crisp half-round vertical flutes that catch directional light & shadow grooves.
 */
export function createFlutedPanel(width, height, depth = 0.02, strips = 18, mat, recessMat = null) {
  const g = new THREE.Group();
  const backD = depth * 0.45;
  const back = new THREE.Mesh(new THREE.BoxGeometry(width, height, backD), recessMat || mat);
  back.position.z = -backD * 0.25;
  g.add(back);

  const spacing = width / Math.max(2, strips);
  const fluteR = Math.min(spacing * 0.42, depth * 0.65);
  const fluteGeo = new THREE.CylinderGeometry(fluteR, fluteR, height - 0.006, 6);
  for (let i = 0; i < strips; i++) {
    const fx = -width * 0.5 + (i + 0.5) * spacing;
    const reed = new THREE.Mesh(fluteGeo, mat);
    reed.position.set(fx, 0, backD * 0.25);
    reed.scale.z = 0.55;
    reed.castShadow = true;
    reed.receiveShadow = true;
    g.add(reed);
  }
  return g;
}

/**
 * Generates a draped quilted linen duvet geometry wrapping organically down over mattress
 * left, right, and foot edges with soft horizontal fold undulations.
 */
export function createDrapedDuvetGeo(bedW = 1.84, duvetL = 1.72, dropSide = 0.14, loftY = 0.06) {
  const overhang = dropSide * 1.15;
  const geo = new THREE.BoxGeometry(bedW + overhang * 2, loftY, duvetL + dropSide, 16, 2, 12);
  const pos = geo.getAttribute('position');
  const halfW = bedW * 0.5;
  const halfL = duvetL * 0.5;

  for (let i = 0; i < pos.count; i++) {
    const ux = pos.getX(i);
    const uy = pos.getY(i);
    const uz = pos.getZ(i);
    const foldWave = Math.sin((uz / Math.max(0.2, duvetL)) * Math.PI * 4.5) * 0.007;

    let nx = ux;
    let ny = uy;
    let nz = uz;

    if (Math.abs(ux) > halfW) {
      const side = Math.sign(ux);
      const excessX = Math.abs(ux) - halfW;
      const turn = Math.min(1, excessX / Math.max(0.02, dropSide));
      nx = side * (halfW + Math.sin(turn * Math.PI * 0.45) * 0.032 + excessX * 0.14);
      ny = uy * (1 - turn * 0.45) - excessX * 1.15 + foldWave;
    } else {
      const crown = (1 - Math.pow(ux / halfW, 2)) * 0.016;
      ny = uy + crown + foldWave;
    }

    if (uz > halfL) {
      const excessZ = uz - halfL;
      const turnZ = Math.min(1, excessZ / Math.max(0.02, dropSide));
      nz = halfL + Math.sin(turnZ * Math.PI * 0.45) * 0.028 + excessZ * 0.14;
      ny -= excessZ * 0.95;
    }

    pos.setXYZ(i, nx, ny, nz);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates an Organic Modern curved crescent barrel chair backrest centered around local origin
 * curving behind Z < 0 and opening cleanly toward local +Z.
 */
export function createCurvedChairBackGeo(outerR = 0.27, height = 0.34, thickness = 0.072, arc = Math.PI * 1.04) {
  const innerR = Math.max(0.08, outerR - thickness);
  const startAngle = Math.PI * 1.5 - arc * 0.5;
  const endAngle = Math.PI * 1.5 + arc * 0.5;
  const segs = 18;
  const shape = new THREE.Shape();

  for (let i = 0; i <= segs; i++) {
    const a = startAngle + (i / segs) * (endAngle - startAngle);
    const px = Math.cos(a) * outerR;
    const py = Math.sin(a) * outerR;
    if (i === 0) shape.moveTo(px, py);
    else shape.lineTo(px, py);
  }
  for (let i = segs; i >= 0; i--) {
    const a = startAngle + (i / segs) * (endAngle - startAngle);
    const px = Math.cos(a) * innerR;
    const py = Math.sin(a) * innerR;
    shape.lineTo(px, py);
  }
  shape.closePath();

  const bevel = Math.min(0.016, thickness * 0.25);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.02, height - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.75,
    bevelSegments: 2,
    curveSegments: 10,
  });
  geo.rotateX(-Math.PI / 2);
  geo.rotateY(Math.PI);
  geo.translate(0, bevel, 0);
  geo.computeVertexNormals();
  return geo;
}
