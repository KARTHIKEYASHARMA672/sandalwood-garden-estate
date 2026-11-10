import * as THREE from 'three';

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
