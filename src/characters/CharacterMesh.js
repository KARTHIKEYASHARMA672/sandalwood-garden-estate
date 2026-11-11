import * as THREE from 'three';
import { getFabricTextures, getHairTextures } from '../assets/procedural/TextureGenerator.js';

/**
 * Generates an anatomical contoured LatheGeometry along local Y in [0, length]
 * (or shifted by offsetY) with optional X/Z oval scaling for natural human silhouettes.
 */
function createContouredLathe(profilePairs, radialSegs = 16, scaleX = 1, scaleZ = 1, offsetY = 0) {
  const pts = profilePairs.map(([r, y]) => new THREE.Vector2(Math.max(0.001, r), y + offsetY));
  const geo = new THREE.LatheGeometry(pts, radialSegs);
  if (scaleX !== 1 || scaleZ !== 1) {
    geo.scale(scaleX, 1, scaleZ);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Articulated, anatomically contoured procedural character rig.
 * - Male: 1.78 m tall, shoulder 0.46 m, skin #A96F4F, cream linen shirt #E9DFC9 (rolled sleeves),
 *   deep olive trousers #46533E, dark brown shoes #4B3428, dark-strap wristwatch.
 * - Female: 1.66 m tall, shoulder 0.40 m, skin #B77D5C, long wavy dark hair #211916,
 *   dusty-rose #C9828B & cream #F0E5D2 outfit, tan flats #9B704F, understated earrings.
 * Supports idle breathing, periodic blinking, walk/fast-walk cycle, smooth sit/stand blend, and door gesture.
 */
export function createCharacterRig(variant = 'female') {
  const isMale = variant === 'male';
  const root = new THREE.Group();
  root.name = `character-${variant}`;

  const totalHeight = isMale ? 1.78 : 1.66;
  const shoulderW = isMale ? 0.46 : 0.40;
  const skinHex = isMale ? '#A96F4F' : '#B77D5C';
  const hairHex = isMale ? '#211B19' : '#211916';
  const eyeHex = isMale ? '#34231D' : '#35231E';

  const skinMat = new THREE.MeshStandardMaterial({
    color: skinHex,
    roughness: 0.5,
    metalness: 0.02,
    envMapIntensity: 0.32,
  });
  const lipMat = new THREE.MeshStandardMaterial({
    color: isMale ? '#945B4B' : '#A65D5A',
    roughness: 0.46,
  });
  const hairTex = getHairTextures(hairHex, 3, 3);
  const hairMat = new THREE.MeshStandardMaterial({
    map: hairTex.map,
    normalMap: hairTex.normalMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: hairTex.roughnessMap,
    roughness: 0.72,
    metalness: 0.02,
    envMapIntensity: 0.25,
  });
  const scleraMat = new THREE.MeshStandardMaterial({ color: '#F5F1EB', roughness: 0.22 });
  const irisMat = new THREE.MeshStandardMaterial({ color: eyeHex, roughness: 0.16 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: '#110C0A', roughness: 0.08 });
  const catchlightMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
  const lashMat = new THREE.MeshStandardMaterial({ color: '#1A1310', roughness: 0.7 });

  const linenTex = getFabricTextures(isMale ? '#EAE1CF' : '#C49088', 3, 3);
  const topMat = new THREE.MeshStandardMaterial({
    map: linenTex.map,
    normalMap: linenTex.normalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughnessMap: linenTex.roughnessMap,
    roughness: 0.86,
    envMapIntensity: 0.2,
  });

  const accentTex = getFabricTextures(isMale ? '#4F5B46' : '#F1E7D6', 3, 3);
  const bottomOrAccentMat = new THREE.MeshStandardMaterial({
    map: accentTex.map,
    normalMap: accentTex.normalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughnessMap: accentTex.roughnessMap,
    roughness: 0.88,
    envMapIntensity: 0.2,
  });

  const beltMat = new THREE.MeshStandardMaterial({ color: '#3B281E', roughness: 0.5, metalness: 0.08 });
  const buckleMat = new THREE.MeshStandardMaterial({ color: '#C8A265', roughness: 0.26, metalness: 0.88 });

  const shoeMat = new THREE.MeshStandardMaterial({
    color: isMale ? '#3E2A20' : '#D2BA9A',
    roughness: 0.44,
    metalness: 0.06,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: isMale ? '#2B221D' : '#8C6543',
    roughness: 0.82,
  });

  // Vertical rig scale from canonical 1.78 / 1.66 proportions
  const hipHeight = isMale ? 0.90 : 0.84;
  const torsoH = isMale ? 0.50 : 0.46;
  const headCenterOffset = isMale ? 0.160 : 0.150;

  const pelvis = new THREE.Group();
  pelvis.position.y = hipHeight;
  root.add(pelvis);

  // Contoured Pelvis & Waistblock
  const pelvisProfile = isMale
    ? [[0.115, -0.09], [0.145, -0.02], [0.148, 0.03], [0.135, 0.08]]
    : [[0.125, -0.09], [0.152, -0.02], [0.144, 0.03], [0.118, 0.08]];
  const hipsGeo = createContouredLathe(pelvisProfile, 20, 1.08, 0.72);
  const hipsMesh = new THREE.Mesh(hipsGeo, isMale ? bottomOrAccentMat : topMat);
  hipsMesh.castShadow = true;
  hipsMesh.receiveShadow = true;
  pelvis.add(hipsMesh);

  if (isMale) {
    const belt = new THREE.Mesh(createContouredLathe([[0.139, 0.055], [0.141, 0.082]], 20, 1.09, 0.73), beltMat);
    pelvis.add(belt);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.032, 0.015), buckleMat);
    buckle.position.set(0, 0.068, 0.104);
    pelvis.add(buckle);
  }

  // Contoured Ribcage / Shoulders (natural linen shirt / draped bodice)
  const torso = new THREE.Group();
  torso.position.y = 0.07;
  pelvis.add(torso);

  const chestProfile = isMale
    ? [
        [0.132, 0.0],
        [0.137, torsoH * 0.18],
        [0.152, torsoH * 0.48],
        [0.163, torsoH * 0.76],
        [0.156, torsoH * 0.91],
        [0.118, torsoH * 0.97],
        [0.068, torsoH + 0.008],
      ]
    : [
        [0.112, 0.0],
        [0.117, torsoH * 0.22],
        [0.134, torsoH * 0.54],
        [0.138, torsoH * 0.74],
        [0.130, torsoH * 0.90],
        [0.098, torsoH * 0.97],
        [0.060, torsoH + 0.005],
      ];
  const chestGeo = createContouredLathe(chestProfile, 22, 1.14, 0.68);
  const chestMesh = new THREE.Mesh(chestGeo, topMat);
  chestMesh.castShadow = true;
  chestMesh.receiveShadow = true;
  torso.add(chestMesh);

  // Folded linen collar / V-placket + pocket (Male) OR Dusty-Rose Wrap Midi Dress (Female)
  let femaleSkirt = null;
  let ribbonGroup = null;
  let skirtGeoRef = null;
  let baseSkirtPos = null;
  const skirtH = 0.51;
  let lastSkirtSitBlend = -1;
  if (isMale) {
    // Open-front linen collar stand (back + sides only, leaving center V-opening clear)
    const collarMat = topMat.clone();
    collarMat.side = THREE.DoubleSide;
    const standPts = [
      new THREE.Vector2(0.070, -0.024),
      new THREE.Vector2(0.064, 0.012),
      new THREE.Vector2(0.056, 0.036),
    ];
    const collarStandGeo = new THREE.LatheGeometry(standPts, 20, Math.PI * 0.22, Math.PI * 1.56);
    collarStandGeo.scale(1.06, 1, 0.94);
    const collarStand = new THREE.Mesh(collarStandGeo, collarMat);
    collarStand.position.set(0, torsoH - 0.016, -0.008);
    torso.add(collarStand);

    // Rolled collar fold wrapping back & sides (-Z), gap centered squarely on front (+Z)
    const collarBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.059, 0.0105, 10, 22, Math.PI * 1.56),
      topMat
    );
    collarBand.rotation.set(Math.PI * 0.5 + 0.08, 0, Math.PI * 0.72);
    collarBand.scale.set(1.06, 0.94, 1);
    collarBand.position.set(0, torsoH + 0.001, -0.003);
    torso.add(collarBand);

    // Unobstructed warm sternum V-opening sitting cleanly between collar lapels
    const chestSkin = new THREE.Mesh(new THREE.ConeGeometry(0.030, 0.074, 3), skinMat);
    chestSkin.rotation.x = Math.PI - 0.24;
    chestSkin.scale.set(0.92, 1.0, 0.24);
    chestSkin.position.set(0, torsoH - 0.024, 0.079);
    torso.add(chestSkin);

    for (const side of [-1, 1]) {
      const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.034, 0.012), topMat);
      lapel.position.set(side * 0.036, torsoH - 0.014, 0.062);
      lapel.rotation.z = side * -0.44;
      lapel.rotation.y = side * 0.32;
      lapel.rotation.x = -0.22;
      torso.add(lapel);
    }

    const placket = new THREE.Mesh(new THREE.BoxGeometry(0.024, torsoH * 0.72, 0.01), topMat);
    placket.position.set(0, torsoH * 0.40, 0.104);
    torso.add(placket);

    for (let b = 0; b < 4; b++) {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.004, 8), bottomOrAccentMat);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(0, torsoH * (0.24 + b * 0.14), 0.111);
      torso.add(btn);
    }

    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.068, 0.007), topMat);
    pocket.position.set(-0.072, torsoH * 0.62, 0.098);
    torso.add(pocket);
  } else {
    // Tailored wrap V-neckline sitting proud on chest contour
    const vNeckSkin = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.088, 3), skinMat);
    vNeckSkin.rotation.x = Math.PI - 0.26;
    vNeckSkin.scale.set(1.0, 1.0, 0.26);
    vNeckSkin.position.set(0, torsoH - 0.038, 0.080);
    torso.add(vNeckSkin);

    for (const side of [-1, 1]) {
      const wrapCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.052, torsoH - 0.004, 0.046),
        new THREE.Vector3(side * 0.034, torsoH - 0.068, 0.092),
        new THREE.Vector3(side * 0.004, torsoH - 0.155, 0.104),
      ]);
      const wrapLapel = new THREE.Mesh(
        new THREE.TubeGeometry(wrapCurve, 10, 0.011, 6, false),
        bottomOrAccentMat
      );
      wrapLapel.scale.set(1.05, 1.0, 0.45);
      torso.add(wrapLapel);
    }

    // Softly draped matching dusty-rose belt tie at waist (subtle self-belt matching ref_characters_1794388261286)
    const sash = new THREE.Mesh(
      createContouredLathe([[0.118, 0.0], [0.116, 0.03], [0.12, 0.06]], 22, 1.15, 0.74),
      topMat
    );
    sash.position.y = 0.022;
    torso.add(sash);

    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.019, 12, 10), topMat);
    knot.scale.set(1.1, 0.85, 0.65);
    knot.position.set(-0.058, 0.046, 0.095);
    torso.add(knot);

    ribbonGroup = new THREE.Group();
    ribbonGroup.position.set(-0.052, 0.112, 0.098);

    const ribbonLong = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.30, 0.01), topMat);
    ribbonLong.position.set(-0.010, -0.15, 0.008);
    ribbonLong.rotation.z = -0.05;
    ribbonLong.rotation.x = -0.06;
    const ribbonShort = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.20, 0.01), topMat);
    ribbonShort.position.set(0.018, -0.10, 0.006);
    ribbonShort.rotation.z = 0.06;
    ribbonShort.rotation.x = -0.06;
    ribbonGroup.add(ribbonLong, ribbonShort);
    pelvis.add(ribbonGroup);

    // Flowing fluted pleated midi skirt pivoted cleanly at the top waistband (local y in [-skirtH, 0])
    const skirtGeo = new THREE.CylinderGeometry(0.146, 0.258, skirtH, 28, 8, true);
    const sPos = skirtGeo.getAttribute('position');
    for (let i = 0; i < sPos.count; i++) {
      const x = sPos.getX(i);
      const y = sPos.getY(i);
      const z = sPos.getZ(i);
      const drop = Math.max(0, (skirtH * 0.5 - y) / skirtH);
      const ang = Math.atan2(z, x);
      const pleat = Math.sin(ang * 10.0 + 0.4) * 0.016 * drop;
      const radScale = 1.0 + pleat * 4.5;
      sPos.setXYZ(i, x * radScale * 1.06, y, z * radScale * 0.86);
    }
    skirtGeo.translate(0, -skirtH * 0.5, 0);
    skirtGeo.computeVertexNormals();
    skirtGeoRef = skirtGeo;
    baseSkirtPos = new Float32Array(sPos.array);

    const skirtMat = topMat.clone();
    skirtMat.side = THREE.DoubleSide;
    femaleSkirt = new THREE.Mesh(skirtGeo, skirtMat);
    femaleSkirt.position.y = 0.035;
    femaleSkirt.castShadow = true;
    femaleSkirt.receiveShadow = true;

    const frontPlacketTrim = new THREE.Mesh(new THREE.BoxGeometry(0.022, skirtH - 0.04, 0.008), topMat);
    frontPlacketTrim.position.set(-0.036, -skirtH * 0.5 - 0.005, 0.17);
    frontPlacketTrim.rotation.x = -0.19;
    femaleSkirt.add(frontPlacketTrim);
    femaleSkirt.userData.frontPlacketTrim = frontPlacketTrim;
    pelvis.add(femaleSkirt);
  }

  // Sculpted Neck (overlaps deeply into collarbase & jawbase so zero head/neck air slit ever occurs)
  const neckGeo = createContouredLathe(
    [[0.058, -0.035], [0.050, 0.024], [0.047, 0.065], [0.050, 0.108]],
    16,
    0.94,
    0.90
  );
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.y = torsoH - 0.018;
  neck.castShadow = true;
  torso.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.y = torsoH + headCenterOffset;
  torso.add(headGroup);

  // Single continuous contoured head & jawline LatheGeometry (eliminates cranium/jaw seam Z-fighting)
  const headProfile = [
    [0.018, -0.095],
    [0.044, -0.088],
    [0.068, -0.066],
    [0.086, -0.034],
    [0.095, 0.006],
    [0.096, 0.044],
    [0.085, 0.082],
    [0.056, 0.108],
    [0.018, 0.118],
  ];
  const headGeo = createContouredLathe(headProfile, 26, 0.92, 0.99);
  const hPos = headGeo.getAttribute('position');
  for (let i = 0; i < hPos.count; i++) {
    const vx = hPos.getX(i);
    const vy = hPos.getY(i);
    const vz = hPos.getZ(i);
    // Gentle forward chin and cheek definition in -0.09..0.01 band without overlapping meshes
    if (vz > 0 && vy < 0.015) {
      const chinFactor = Math.max(0, 1 - Math.abs(vy + 0.068) / 0.055);
      hPos.setZ(i, vz + chinFactor * 0.007 * (1 - Math.min(1, Math.abs(vx) / 0.06)));
    }
  }
  headGeo.computeVertexNormals();
  const cranium = new THREE.Mesh(headGeo, skinMat);
  cranium.castShadow = true;
  headGroup.add(cranium);

  // Contoured Nose (tapered dorsal bridge + tip + nostrils)
  const noseBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0082, 0.036, 10), skinMat);
  noseBridge.position.set(0, 0.004, 0.097);
  noseBridge.rotation.x = -0.24;
  headGroup.add(noseBridge);

  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.0105, 12, 10), skinMat);
  noseTip.scale.set(1.06, 0.82, 1.0);
  noseTip.position.set(0, -0.014, 0.105);
  headGroup.add(noseTip);

  for (const nx of [-0.0075, 0.0075]) {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.0052, 8, 8), skinMat);
    wing.position.set(nx, -0.017, 0.1);
    headGroup.add(wing);
  }

  // Contoured upper/lower lips with gentle warm calm smile line
  const smileCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.019, -0.044, 0.086),
    new THREE.Vector3(-0.008, -0.0465, 0.092),
    new THREE.Vector3(0.0, -0.047, 0.093),
    new THREE.Vector3(0.008, -0.0465, 0.092),
    new THREE.Vector3(0.019, -0.044, 0.086),
  ]);
  headGroup.add(new THREE.Mesh(new THREE.TubeGeometry(smileCurve, 12, 0.0042, 6, false), lipMat));

  const lowerLip = new THREE.Mesh(new THREE.SphereGeometry(0.0135, 12, 8), lipMat);
  lowerLip.scale.set(1.18, 0.34, 0.48);
  lowerLip.position.set(0, -0.052, 0.088);
  headGroup.add(lowerLip);

  // Closely sculpted matte beard hugging Male lower mandible/chin + tapered hairlines
  if (isMale) {
    const jawProfile = [
      [0.015, -0.096],
      [0.046, -0.088],
      [0.070, -0.065],
      [0.088, -0.032],
      [0.094, -0.008],
    ];
    const beardGeo = createContouredLathe(jawProfile, 24, 0.93, 1.01);
    const bPos = beardGeo.getAttribute('position');
    for (let i = 0; i < bPos.count; i++) {
      const bx = bPos.getX(i);
      const by = bPos.getY(i);
      const bz = bPos.getZ(i);
      // Trim upper cheek/back slightly & pull chin smoothly forward over headGeo contour
      const chinF = bz > 0 ? Math.max(0, 1 - Math.abs(by + 0.068) / 0.055) : 0;
      const sideF = Math.abs(bx) > 0.04 && bz > -0.01 && by > -0.035 ? -0.006 : 0.0018;
      bPos.setXYZ(
        i,
        bx * 1.015,
        by,
        bz > -0.01 ? bz + chinF * 0.008 + sideF : bz * 0.85
      );
    }
    beardGeo.computeVertexNormals();
    const beardShell = new THREE.Mesh(beardGeo, hairMat);
    headGroup.add(beardShell);

    const chinPatch = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), hairMat);
    chinPatch.scale.set(1.22, 0.82, 0.65);
    chinPatch.position.set(0, -0.068, 0.068);
    headGroup.add(chinPatch);

    const stacheCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.022, -0.036, 0.086),
      new THREE.Vector3(-0.008, -0.033, 0.094),
      new THREE.Vector3(0.0, -0.034, 0.095),
      new THREE.Vector3(0.008, -0.033, 0.094),
      new THREE.Vector3(0.022, -0.036, 0.086),
    ]);
    headGroup.add(new THREE.Mesh(new THREE.TubeGeometry(stacheCurve, 12, 0.0038, 6, false), hairMat));
  }

  // Ears & delicate gold hoop earrings
  const earringMat = new THREE.MeshStandardMaterial({
    color: '#D7B46E',
    roughness: 0.25,
    metalness: 0.88,
  });
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.021, 12, 10), skinMat);
    ear.scale.set(0.42, 0.96, 0.72);
    ear.position.set(side * 0.091, -0.006, -0.008);
    headGroup.add(ear);
    if (!isMale) {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.0095, 0.0018, 8, 16), earringMat);
      hoop.rotation.y = Math.PI / 2;
      hoop.position.set(side * 0.095, -0.031, -0.004);
      headGroup.add(hoop);
    }
  }

  // Calm Almond Eyes + Subtle Catchlights + Soft Relaxed Arched Brows + Blinking Eyelids
  const eyelids = [];
  for (const side of [-1, 1]) {
    const eyePivot = new THREE.Group();
    eyePivot.position.set(side * 0.032, 0.015, 0.084);
    headGroup.add(eyePivot);

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.0132, 12, 10), scleraMat);
    sclera.scale.set(1.12, 0.72, 0.52);
    eyePivot.add(sclera);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0086, 12, 10), irisMat);
    iris.scale.set(1, 0.95, 0.48);
    iris.position.z = 0.0048;
    eyePivot.add(iris);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0042, 10, 8), pupilMat);
    pupil.position.z = 0.0074;
    eyePivot.add(pupil);

    const catchlight = new THREE.Mesh(new THREE.SphereGeometry(0.0015, 6, 6), catchlightMat);
    catchlight.position.set(side * 0.0022, 0.002, 0.0082);
    eyePivot.add(catchlight);

    const lashArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.0124, 0.0015, 6, 12, Math.PI * 0.85),
      lashMat
    );
    lashArc.rotation.z = Math.PI * 0.08;
    lashArc.position.set(0, 0.0018, 0.0052);
    eyePivot.add(lashArc);

    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(0.0144, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.44),
      skinMat
    );
    lid.rotation.x = -0.22;
    lid.scale.set(1.12, 0.78, 0.6);
    eyePivot.add(lid);
    eyelids.push(lid);

    // Calm natural gently-arched eyebrow following orbital ridge
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.017, 0.032, 0.091),
      new THREE.Vector3(side * 0.032, 0.0355, 0.090),
      new THREE.Vector3(side * 0.048, 0.0335, 0.084),
    ]);
    headGroup.add(new THREE.Mesh(new THREE.TubeGeometry(browCurve, 10, 0.0021, 6, false), hairMat));
  }

  // Sculpted Curved Hair Locks & Waves (seamless full scalp coverage + natural hairline)
  const hairGroup = new THREE.Group();
  headGroup.add(hairGroup);

  const scalpUnderCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.099, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.43),
    hairMat
  );
  scalpUnderCap.scale.set(0.97, 0.96, 1.04);
  scalpUnderCap.rotation.x = -0.06;
  scalpUnderCap.position.set(0, 0.032, -0.003);
  hairGroup.add(scalpUnderCap);

  const hairCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.103, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.45),
    hairMat
  );
  hairCrown.scale.set(0.97, 0.98, 1.03);
  hairCrown.rotation.x = isMale ? -0.14 : -0.16;
  hairCrown.position.set(0, 0.032, -0.008);
  hairCrown.castShadow = true;
  hairGroup.add(hairCrown);

  if (isMale) {
    // Rich dense short wavy top curls following natural curved hairline without corner horns
    for (let i = 0; i < 15; i++) {
      const tNorm = (i - 7) / 7;
      const xOff = tNorm * 0.068;
      const arch = tNorm * tNorm * 0.022;
      const curlWave = Math.sin(i * 1.9) * 0.004;
      const lockCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xOff * 0.85, 0.072 - arch * 0.4, 0.060 - arch + curlWave),
        new THREE.Vector3(xOff * 0.92, 0.114 - arch * 0.5, 0.008),
        new THREE.Vector3(xOff * 0.86, 0.066 - arch * 0.4, -0.084),
      ]);
      const lock = new THREE.Mesh(new THREE.TubeGeometry(lockCurve, 12, 0.010, 7, false), hairMat);
      lock.castShadow = true;
      hairGroup.add(lock);
    }
    for (const side of [-1, 1]) {
      const sideburn = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.036, 0.015), hairMat);
      sideburn.position.set(side * 0.087, -0.002, 0.014);
      hairGroup.add(sideburn);
    }
    const backHair = new THREE.Mesh(
      new THREE.CylinderGeometry(0.088, 0.068, 0.095, 18),
      hairMat
    );
    backHair.scale.set(0.95, 1, 0.92);
    backHair.position.set(0, -0.014, -0.028);
    hairGroup.add(backHair);
  } else {
    // Silky center-parted dark wavy cascade flowing in tapered soft layers past shoulder blades
    const backCascade = new THREE.Group();
    backCascade.position.set(0, 0.034, -0.032);
    hairGroup.add(backCascade);

    const capeGeo = new THREE.CylinderGeometry(0.088, 0.106, 0.38, 20, 10, false, Math.PI * 0.56, Math.PI * 0.88);
    const capePos = capeGeo.getAttribute('position');
    for (let i = 0; i < capePos.count; i++) {
      const vx = capePos.getX(i);
      const vy = capePos.getY(i);
      const vz = capePos.getZ(i);
      const u = Math.max(0, Math.min(1, (0.19 - vy) / 0.38));
      const xNorm = Math.min(1, Math.abs(vx) / 0.11);
      const uDip = u > 0.65 ? ((u - 0.65) / 0.35) * ((1 - xNorm * xNorm) * -0.045 + Math.sin(vx * 36) * 0.008) : 0;
      const waveZ = -Math.sin(u * Math.PI * 2.4) * 0.012 - u * 0.022;
      const uTaper = 1.0 - Math.max(0, (u - 0.55) / 0.45) * 0.24;
      capePos.setXYZ(i, vx * uTaper, vy + uDip, vz * 0.82 + waveZ);
    }
    capeGeo.computeVertexNormals();
    const capeMat = hairMat.clone();
    capeMat.side = THREE.DoubleSide;
    const hairCape = new THREE.Mesh(capeGeo, capeMat);
    hairCape.position.set(0, -0.165, -0.016);
    hairCape.castShadow = true;
    backCascade.add(hairCape);

    for (let s = -6; s <= 6; s++) {
      const tx = s * 0.0138;
      const edgeT = (s / 6) * (s / 6);
      const waveLen = 0.43 - edgeT * 0.105 + Math.sin(s * 2.1) * 0.012;
      const zCurve = -0.035 + edgeT * 0.014;
      const strandCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(tx * 0.66, 0.032, zCurve + 0.018),
        new THREE.Vector3(tx * 1.02, -waveLen * 0.34, zCurve - 0.014),
        new THREE.Vector3(tx * 1.08, -waveLen * 0.68, zCurve - 0.004),
        new THREE.Vector3(tx * 0.88, -waveLen, zCurve - 0.024),
      ]);
      const strand = new THREE.Mesh(new THREE.TubeGeometry(strandCurve, 14, 0.0115, 7, false), hairMat);
      strand.castShadow = true;
      backCascade.add(strand);

      const lockTip = new THREE.Mesh(new THREE.ConeGeometry(0.0115, 0.046, 7), hairMat);
      lockTip.rotation.x = Math.PI + 0.14;
      lockTip.position.set(tx * 0.88, -waveLen - 0.02, zCurve - 0.027);
      backCascade.add(lockTip);
    }

    // Center-parted soft framing waves sweeping from center forehead part over temples onto collarbones
    for (const side of [-1, 1]) {
      const fCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.008, 0.095, 0.056),
        new THREE.Vector3(side * 0.054, 0.072, 0.054),
        new THREE.Vector3(side * 0.084, 0.020, 0.032),
        new THREE.Vector3(side * 0.088, -0.052, 0.028),
        new THREE.Vector3(side * 0.082, -0.118, 0.044),
      ]);
      const shoulderLock = new THREE.Mesh(new THREE.TubeGeometry(fCurve, 14, 0.012, 7, false), hairMat);
      shoulderLock.castShadow = true;
      hairGroup.add(shoulderLock);

      const outerCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.028, 0.092, 0.038),
        new THREE.Vector3(side * 0.090, 0.018, 0.010),
        new THREE.Vector3(side * 0.098, -0.095, 0.018),
      ]);
      hairGroup.add(new THREE.Mesh(new THREE.TubeGeometry(outerCurve, 12, 0.011, 7, false), hairMat));
    }
    hairGroup.userData.backCascade = backCascade;
  }

  // Contoured Arms tucked seamlessly into torso shoulders with Articulated Palm & Fingers
  function createArm(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * (shoulderW * 0.375), torsoH - 0.072, 0);
    torso.add(pivot);

    // Subtle integrated shoulder deltoid transition blending cleanly into torso
    const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(isMale ? 0.036 : 0.030, 14, 12), topMat);
    shoulderCap.scale.set(0.76, 0.72, 0.84);
    pivot.add(shoulderCap);

    // Tapered upper sleeve / upper arm (short flared sleeve on Female wrap dress; 3/4 rolled cuff on Male)
    const sleeveLen = isMale ? 0.25 : 0.18;
    const upperProfile = isMale
      ? [
          [0.04, -sleeveLen],
          [0.042, -sleeveLen * 0.55],
          [0.041, -0.02],
          [0.036, 0.0],
        ]
      : [
          [0.045, -sleeveLen],
          [0.04, -sleeveLen * 0.55],
          [0.036, -0.02],
          [0.03, 0.0],
        ];
    const upperArm = new THREE.Mesh(createContouredLathe(upperProfile, 14), topMat);
    upperArm.castShadow = true;
    pivot.add(upperArm);

    if (isMale) {
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.042, 0.032, 14), topMat);
      cuff.position.y = -sleeveLen;
      pivot.add(cuff);
    }

    const elbow = new THREE.Group();
    elbow.position.y = -(isMale ? 0.25 : 0.21) + 0.01;
    pivot.add(elbow);

    if (!isMale) {
      // Bare upper arm extending cleanly up inside short wrap-dress sleeve (seamless at all angles)
      const bareUpper = new THREE.Mesh(
        createContouredLathe([[0.029, 0], [0.034, 0.072]], 12),
        skinMat
      );
      elbow.add(bareUpper);
    }

    const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(isMale ? 0.034 : 0.028, 10, 8), skinMat);
    elbow.add(elbowJoint);

    const forearmProfile = [
      [isMale ? 0.025 : 0.022, -0.24],
      [isMale ? 0.031 : 0.027, -0.14],
      [isMale ? 0.036 : 0.03, -0.04],
      [isMale ? 0.034 : 0.028, 0.0],
    ];
    const forearm = new THREE.Mesh(createContouredLathe(forearmProfile, 14), skinMat);
    forearm.castShadow = true;
    elbow.add(forearm);

    // Delicate brushed gold bangle bracelet on Female left wrist
    if (!isMale && side === -1) {
      const bangle = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0026, 8, 16), earringMat);
      bangle.rotation.x = Math.PI / 2;
      bangle.position.y = -0.21;
      elbow.add(bangle);
    }

    // Articulated Hand: palm + angled thumb + 3 finger groups
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.235, 0);
    elbow.add(handGroup);

    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.068, 0.048), skinMat);
    palm.position.y = -0.032;
    handGroup.add(palm);

    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.007, 0.028, 4, 6), skinMat);
    thumb.position.set(side * -0.008, -0.028, 0.028);
    thumb.rotation.x = 0.55;
    handGroup.add(thumb);

    for (let f = 0; f < 3; f++) {
      const fLen = 0.044 - Math.abs(f - 1) * 0.005;
      const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.0065, fLen, 4, 6), skinMat);
      finger.position.set(0, -0.072 - fLen * 0.25, -0.014 + f * 0.014);
      handGroup.add(finger);
    }

    // Dark-strap wristwatch on male left arm
    if (isMale && side === -1) {
      const strap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.024, 14),
        new THREE.MeshStandardMaterial({ color: '#2B211B', roughness: 0.7 })
      );
      strap.position.y = -0.205;
      elbow.add(strap);
      const face = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.008, 12),
        new THREE.MeshStandardMaterial({ color: '#D6C4A4', roughness: 0.3, metalness: 0.65 })
      );
      face.rotation.z = Math.PI * 0.5;
      face.position.set(-0.028, -0.205, 0.006);
      elbow.add(face);
    }

    return { pivot, elbow };
  }

  const leftArm = createArm(-1);
  const rightArm = createArm(1);

  // Contoured Legs + Structured Leather Shoes / Flats
  function createLeg(side) {
    const hip = new THREE.Group();
    hip.position.set(side * (isMale ? 0.094 : 0.084), -0.02, 0);
    pelvis.add(hip);

    const legMat = isMale ? bottomOrAccentMat : skinMat;
    const thighLen = hipHeight * 0.45;
    const thighProfile = isMale
      ? [[0.058, -thighLen - 0.015], [0.068, -thighLen * 0.5], [0.076, -0.02], [0.068, 0.02]]
      : [[0.045, -thighLen - 0.015], [0.056, -thighLen * 0.5], [0.066, -0.02], [0.058, 0.02]];
    const thigh = new THREE.Mesh(createContouredLathe(thighProfile, 16), legMat);
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -thighLen;
    hip.add(knee);

    const kneeJoint = new THREE.Mesh(new THREE.SphereGeometry(isMale ? 0.056 : 0.044, 12, 10), legMat);
    knee.add(kneeJoint);

    const calfLen = hipHeight * 0.43;
    const calfProfile = isMale
      ? [[0.046, -calfLen], [0.054, -calfLen * 0.45], [0.058, -0.08], [0.056, 0.022]]
      : [[0.032, -calfLen], [0.045, -calfLen * 0.42], [0.047, -0.08], [0.045, 0.022]];
    const calf = new THREE.Mesh(createContouredLathe(calfProfile, 16), legMat);
    calf.castShadow = true;
    knee.add(calf);

    // Sculpted Penny Loafers (Male) or Tan Two-Strap Flat Sandals (Female)
    const footLen = isMale ? 0.27 : 0.24;
    const footGroup = new THREE.Group();
    footGroup.position.set(0, -calfLen - 0.03, 0.038);
    knee.add(footGroup);

    if (isMale) {
      const vamp = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.044, footLen * 0.45, 6, 12),
        shoeMat
      );
      vamp.rotation.x = Math.PI / 2;
      vamp.scale.set(1.02, 0.65, 1.0);
      vamp.position.set(0, 0.032, 0.01);
      vamp.castShadow = true;
      footGroup.add(vamp);

      const pennyStrap = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.01, 0.026), shoeMat);
      pennyStrap.position.set(0, 0.056, 0.015);
      footGroup.add(pennyStrap);

      const heelBlock = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.02, 0.068), soleMat);
      heelBlock.position.set(0, 0.01, -0.065);
      footGroup.add(heelBlock);
    } else {
      const bareFoot = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.036, footLen * 0.42, 6, 12),
        skinMat
      );
      bareFoot.rotation.x = Math.PI / 2;
      bareFoot.scale.set(0.98, 0.56, 1.0);
      bareFoot.position.set(0, 0.028, 0.01);
      bareFoot.castShadow = true;
      footGroup.add(bareFoot);

      for (const sz of [0.032, -0.018]) {
        const strap = new THREE.Mesh(new THREE.TorusGeometry(0.037, 0.0085, 6, 14, Math.PI), shoeMat);
        strap.rotation.z = 0;
        strap.scale.set(1.06, 0.68, 1.25);
        strap.position.set(0, 0.026, sz);
        footGroup.add(strap);
      }
    }

    const sole = new THREE.Mesh(
      new THREE.CapsuleGeometry(isMale ? 0.046 : 0.041, footLen * 0.48, 4, 12),
      soleMat
    );
    sole.rotation.x = Math.PI / 2;
    sole.scale.set(1.04, 0.24, 1.0);
    sole.position.set(0, 0.011, 0.01);
    footGroup.add(sole);

    return { hip, knee, footGroup };
  }

  const leftLeg = createLeg(-1);
  const rightLeg = createLeg(1);

  // Selection ground ring (antique brass halo on start screen)
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.36, 0.43, 36),
    new THREE.MeshBasicMaterial({
      color: '#C59B57',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.015;
  root.add(halo);

  let walkPhase = 0;
  let sitBlend = 0;
  let doorGestureTimer = 0;
  let blinkTimer = 2.0 + Math.random() * 2.5;

  function triggerDoorGesture() {
    doorGestureTimer = 0.52;
  }

  function update(dt, optionsOrElapsed = 0, speedParam = 0, seatedParam = false) {
    let speed = 0;
    let seated = false;
    let highlighted = false;
    let hideHalo = false;
    let time = 0;

    if (optionsOrElapsed && typeof optionsOrElapsed === 'object') {
      speed = optionsOrElapsed.speed ?? 0;
      seated = optionsOrElapsed.seated ?? false;
      highlighted = optionsOrElapsed.highlighted ?? false;
      hideHalo = optionsOrElapsed.hideHalo ?? false;
      time = optionsOrElapsed.time ?? 0;
      if (optionsOrElapsed.doorGesture) triggerDoorGesture();
    } else {
      time = typeof optionsOrElapsed === 'number' ? optionsOrElapsed : 0;
      speed = typeof speedParam === 'number' ? speedParam : 0;
      seated = Boolean(seatedParam);
      hideHalo = true;
    }

    if (hideHalo) {
      halo.material.opacity = 0;
      halo.visible = false;
    } else {
      halo.material.opacity = THREE.MathUtils.lerp(
        halo.material.opacity,
        highlighted ? 0.62 : 0.0,
        Math.min(1, dt * 8)
      );
      halo.visible = halo.material.opacity > 0.01;
    }

    // Periodic natural blinking
    blinkTimer -= dt;
    let blinkAmt = 0;
    if (blinkTimer <= 0) {
      if (blinkTimer > -0.14) {
        blinkAmt = Math.sin(((0.14 + blinkTimer) / 0.14) * Math.PI);
      } else {
        blinkTimer = 3.2 + Math.random() * 2.8;
      }
    }
    for (const lid of eyelids) {
      lid.rotation.x = -0.22 + blinkAmt * 0.62;
      lid.scale.y = 0.78 + blinkAmt * 0.34;
    }

    // Idle breathing + gentle head micro-motion
    const breath = Math.sin(time * 2.1) * 0.008;
    torso.position.y = 0.07 + breath;
    headGroup.rotation.y = Math.sin(time * 0.75) * 0.06;
    headGroup.rotation.x = Math.sin(time * 0.55) * 0.03;

    if (hairGroup.userData.backCascade) {
      hairGroup.userData.backCascade.rotation.x =
        0.04 + Math.sin(time * 1.8) * 0.025 + Math.min(0.18, speed * 0.04);
    }

    // Smooth Sit / Stand Transition Blend
    sitBlend = THREE.MathUtils.lerp(sitBlend, seated ? 1 : 0, Math.min(1, dt * 10));

    let targetPelvisY = hipHeight;
    let targetHipL = 0;
    let targetHipR = 0;
    let targetKneeL = 0;
    let targetKneeR = 0;
    let targetArmL = Math.sin(time * 1.4) * 0.03;
    let targetArmR = -Math.sin(time * 1.4) * 0.03;
    let targetElbowL = -0.14;
    let targetElbowR = -0.14;
    let targetTorsoTwist = 0;

    if (speed > 0.2 && sitBlend < 0.35) {
      // Walk & faster walk gait scaled smoothly by displacement speed
      const strideRate = speed > 3.0 ? 3.55 : 3.25;
      walkPhase += dt * speed * strideRate;
      const amp = Math.min(0.62, 0.25 + speed * 0.11);
      const swing = Math.sin(walkPhase) * amp;
      const bob = Math.abs(Math.cos(walkPhase)) * 0.024;
      targetPelvisY = hipHeight + bob;
      targetHipL = swing;
      targetHipR = -swing;
      targetKneeL = Math.max(0, -Math.cos(walkPhase) * (0.42 + speed * 0.04));
      targetKneeR = Math.max(0, Math.cos(walkPhase) * (0.42 + speed * 0.04));
      targetArmL = -swing * 0.74;
      targetArmR = swing * 0.74;
      targetElbowL = -0.26 - Math.max(0, swing * 0.18);
      targetElbowR = -0.26 + Math.max(0, -swing * 0.18);
      targetTorsoTwist = swing * 0.08;
    }

    if (sitBlend > 0.001) {
      targetPelvisY = THREE.MathUtils.lerp(targetPelvisY, hipHeight * 0.56, sitBlend);
      targetHipL = THREE.MathUtils.lerp(targetHipL, -Math.PI * 0.48, sitBlend);
      targetHipR = THREE.MathUtils.lerp(targetHipR, -Math.PI * 0.48, sitBlend);
      targetKneeL = THREE.MathUtils.lerp(targetKneeL, Math.PI * 0.48, sitBlend);
      targetKneeR = THREE.MathUtils.lerp(targetKneeR, Math.PI * 0.48, sitBlend);
      targetArmL = THREE.MathUtils.lerp(targetArmL, -0.35, sitBlend);
      targetArmR = THREE.MathUtils.lerp(targetArmR, -0.35, sitBlend);
      targetElbowL = THREE.MathUtils.lerp(targetElbowL, -0.58, sitBlend);
      targetElbowR = THREE.MathUtils.lerp(targetElbowR, -0.58, sitBlend);
    }

    // Optional door lever reach gesture on right arm
    if (doorGestureTimer > 0) {
      doorGestureTimer = Math.max(0, doorGestureTimer - dt);
      const reach = Math.sin((doorGestureTimer / 0.52) * Math.PI);
      targetArmR = THREE.MathUtils.lerp(targetArmR, -0.95, reach);
      targetElbowR = THREE.MathUtils.lerp(targetElbowR, -0.55, reach);
    }

    const blendRate = Math.min(1, dt * 12);
    pelvis.position.y = THREE.MathUtils.lerp(pelvis.position.y, targetPelvisY, blendRate);
    torso.rotation.y = THREE.MathUtils.lerp(torso.rotation.y, targetTorsoTwist, blendRate);
    leftLeg.hip.rotation.x = THREE.MathUtils.lerp(leftLeg.hip.rotation.x, targetHipL, blendRate);
    rightLeg.hip.rotation.x = THREE.MathUtils.lerp(rightLeg.hip.rotation.x, targetHipR, blendRate);
    leftLeg.knee.rotation.x = THREE.MathUtils.lerp(leftLeg.knee.rotation.x, targetKneeL, blendRate);
    rightLeg.knee.rotation.x = THREE.MathUtils.lerp(rightLeg.knee.rotation.x, targetKneeR, blendRate);
    leftArm.pivot.rotation.x = THREE.MathUtils.lerp(leftArm.pivot.rotation.x, targetArmL, blendRate);
    rightArm.pivot.rotation.x = THREE.MathUtils.lerp(rightArm.pivot.rotation.x, targetArmR, blendRate);
    if (femaleSkirt && skirtGeoRef && baseSkirtPos) {
      if (Math.abs(sitBlend - lastSkirtSitBlend) > 0.002) {
        lastSkirtSitBlend = sitBlend;
        const posAttr = skirtGeoRef.getAttribute('position');
        for (let i = 0; i < posAttr.count; i++) {
          const i3 = i * 3;
          const bx = baseSkirtPos[i3];
          const by = baseSkirtPos[i3 + 1];
          const bz = baseSkirtPos[i3 + 2];
          if (sitBlend <= 0.001) {
            posAttr.setXYZ(i, bx, by, bz);
            continue;
          }
          const drop = Math.max(0, Math.min(1, -by / skirtH));
          const thighPhase = Math.min(1, drop / 0.68);
          const shinPhase = Math.max(0, (drop - 0.68) / 0.32);

          // Bend skirt smoothly over horizontal thighs & shins while keeping waistband pinned at y=0
          const pitch = Math.sin(Math.min(1, drop / 0.85) * Math.PI) * 1.44;
          const sitCenterY = -0.052 * thighPhase - 0.18 * shinPhase;
          const sitCenterZ = 0.38 * Math.sin(thighPhase * Math.PI * 0.5) + 0.045 * shinPhase;
          const sitX = bx * (1 + 0.06 * thighPhase);
          const sitY = Math.max(-0.105 - shinPhase * 0.18, sitCenterY + Math.sin(pitch) * bz * 0.42);
          const sitZ = sitCenterZ + Math.cos(pitch) * bz;

          posAttr.setXYZ(
            i,
            THREE.MathUtils.lerp(bx, sitX, sitBlend),
            THREE.MathUtils.lerp(by, sitY, sitBlend),
            THREE.MathUtils.lerp(bz, sitZ, sitBlend)
          );
        }
        posAttr.needsUpdate = true;
        skirtGeoRef.computeVertexNormals();
      }
      // Subtle walking billow around the pinned waistband without detaching from sash
      femaleSkirt.rotation.x = THREE.MathUtils.lerp(
        femaleSkirt.rotation.x,
        -Math.min(0.14, speed * 0.025) * (1 - sitBlend),
        blendRate
      );
      if (femaleSkirt.userData.frontPlacketTrim) {
        femaleSkirt.userData.frontPlacketTrim.visible = sitBlend < 0.35;
      }
    }
    if (ribbonGroup) {
      ribbonGroup.rotation.x = THREE.MathUtils.lerp(
        ribbonGroup.rotation.x,
        -sitBlend * 1.18 - Math.min(0.18, speed * 0.03) * (1 - sitBlend),
        blendRate
      );
    }
    leftArm.elbow.rotation.x = THREE.MathUtils.lerp(leftArm.elbow.rotation.x, targetElbowL, blendRate);
    rightArm.elbow.rotation.x = THREE.MathUtils.lerp(rightArm.elbow.rotation.x, targetElbowR, blendRate);
  }

  return {
    root,
    totalHeight,
    update,
    triggerDoorGesture,
  };
}
