import * as THREE from 'three';
import { getFabricTextures } from '../assets/procedural/TextureGenerator.js';

/**
 * Articulated, stylised-realistic procedural character rig.
 * - Male: 1.78 m tall, shoulder 0.46 m, skin #A96F4F, cream linen shirt #E9DFC9 (rolled sleeves),
 *   deep olive trousers #46533E, dark brown shoes #4B3428, dark-strap wristwatch.
 * - Female: 1.66 m tall, shoulder 0.40 m, skin #B77D5C, long wavy dark hair #211916,
 *   dusty-rose #C9828B & cream #F0E5D2 outfit, tan flats #9B704F, understated earrings.
 * Supports idle breathing, periodic blinking, walk/run cycle, and seated pose.
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
    roughness: 0.58,
    metalness: 0.02,
  });
  const lipMat = new THREE.MeshStandardMaterial({
    color: isMale ? '#8C5242' : '#9E5855',
    roughness: 0.52,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: hairHex,
    roughness: isMale ? 0.72 : 0.76,
    metalness: 0.04,
  });
  const scleraMat = new THREE.MeshStandardMaterial({ color: '#F3EFE9', roughness: 0.28 });
  const irisMat = new THREE.MeshStandardMaterial({ color: eyeHex, roughness: 0.22 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: '#110C0A', roughness: 0.12 });

  const linenTex = getFabricTextures(isMale ? '#E9DFC9' : '#C9828B', 3, 3);
  const topMat = new THREE.MeshStandardMaterial({
    map: linenTex.map,
    bumpMap: linenTex.bumpMap,
    bumpScale: 0.004,
    roughness: 0.82,
  });

  const accentTex = getFabricTextures(isMale ? '#46533E' : '#F0E5D2', 3, 3);
  const bottomOrAccentMat = new THREE.MeshStandardMaterial({
    map: accentTex.map,
    bumpMap: accentTex.bumpMap,
    bumpScale: 0.004,
    roughness: 0.85,
  });

  const shoeMat = new THREE.MeshStandardMaterial({
    color: isMale ? '#4B3428' : '#9B704F',
    roughness: 0.55,
  });
  const soleMat = new THREE.MeshStandardMaterial({ color: '#221E1C', roughness: 0.9 });

  // Vertical rig scale from canonical 1.78 / 1.66 proportions
  const hipHeight = isMale ? 0.90 : 0.84;
  const torsoH = isMale ? 0.50 : 0.46;
  const headCenterOffset = isMale ? 0.21 : 0.20;

  const pelvis = new THREE.Group();
  pelvis.position.y = hipHeight;
  root.add(pelvis);

  // Hips / Waist
  const hipsGeo = new THREE.CylinderGeometry(
    isMale ? 0.145 : 0.135,
    isMale ? 0.14 : 0.148,
    0.16,
    18
  );
  const hipsMesh = new THREE.Mesh(hipsGeo, isMale ? bottomOrAccentMat : topMat);
  hipsMesh.scale.set(1.08, 1, 0.72);
  hipsMesh.castShadow = true;
  pelvis.add(hipsMesh);

  // Upper torso / chest
  const torso = new THREE.Group();
  torso.position.y = 0.07;
  pelvis.add(torso);

  const chestGeo = new THREE.CylinderGeometry(
    isMale ? 0.165 : 0.142,
    isMale ? 0.138 : 0.122,
    torsoH,
    18
  );
  const chestMesh = new THREE.Mesh(chestGeo, topMat);
  chestMesh.position.y = torsoH * 0.5;
  chestMesh.scale.set(1.15, 1, 0.68);
  chestMesh.castShadow = true;
  torso.add(chestMesh);

  // Shirt collar / dress sash accent
  if (isMale) {
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.075, 0.014, 10, 20),
      topMat
    );
    collar.rotation.x = Math.PI * 0.44;
    collar.position.set(0, torsoH - 0.01, 0.01);
    torso.add(collar);
  } else {
    // Cream sash & neckline trim
    const sash = new THREE.Mesh(
      new THREE.CylinderGeometry(0.128, 0.132, 0.055, 18),
      bottomOrAccentMat
    );
    sash.scale.set(1.12, 1, 0.72);
    sash.position.y = 0.07;
    torso.add(sash);

    const collarTrim = new THREE.Mesh(
      new THREE.TorusGeometry(0.072, 0.012, 10, 20),
      bottomOrAccentMat
    );
    collarTrim.rotation.x = Math.PI * 0.42;
    collarTrim.position.set(0, torsoH - 0.015, 0.01);
    torso.add(collarTrim);

    // Flowing pleated midi skirt panel
    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.142, 0.24, 0.48, 22, 1, false),
      topMat
    );
    skirt.scale.set(1.06, 1, 0.85);
    skirt.position.y = -0.22;
    skirt.castShadow = true;
    pelvis.add(skirt);
  }

  // Neck + Head
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.054, 0.1, 14),
    skinMat
  );
  neck.position.y = torsoH + 0.04;
  neck.castShadow = true;
  torso.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.y = torsoH + headCenterOffset - 0.02;
  torso.add(headGroup);

  // Sculpted head + jawline
  const cranium = new THREE.Mesh(
    new THREE.SphereGeometry(0.106, 22, 20),
    skinMat
  );
  cranium.scale.set(0.92, 1.12, 0.98);
  cranium.castShadow = true;
  headGroup.add(cranium);

  // Subtle nose
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.013, 0.038, 8),
    skinMat
  );
  nose.rotation.x = Math.PI * 0.42;
  nose.position.set(0, -0.008, 0.106);
  headGroup.add(nose);

  // Muted natural lips
  const lips = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 12, 8),
    lipMat
  );
  lips.scale.set(1.25, 0.42, 0.55);
  lips.position.set(0, -0.048, 0.092);
  headGroup.add(lips);

  // Ears (+ earrings on female)
  const earringMat = new THREE.MeshStandardMaterial({
    color: '#D7B46E',
    roughness: 0.28,
    metalness: 0.82,
  });
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), skinMat);
    ear.scale.set(0.45, 1.0, 0.72);
    ear.position.set(side * 0.096, -0.008, -0.006);
    headGroup.add(ear);
    if (!isMale) {
      const earring = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 8), earringMat);
      earring.position.set(side * 0.098, -0.032, -0.004);
      headGroup.add(earring);
    }
  }

  // Eyes with sclera, iris, pupil, eyebrows, and animated blinking eyelids
  const eyelids = [];
  for (const side of [-1, 1]) {
    const eyePivot = new THREE.Group();
    eyePivot.position.set(side * 0.035, 0.015, 0.089);
    headGroup.add(eyePivot);

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 10), scleraMat);
    sclera.scale.set(1.05, 0.88, 0.68);
    eyePivot.add(sclera);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 12, 10), irisMat);
    iris.scale.set(1, 1, 0.55);
    iris.position.z = 0.0065;
    eyePivot.add(iris);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0042, 10, 8), pupilMat);
    pupil.position.z = 0.0095;
    eyePivot.add(pupil);

    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(0.0155, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
      skinMat
    );
    lid.rotation.x = -0.35;
    lid.scale.set(1.05, 0.9, 0.75);
    eyePivot.add(lid);
    eyelids.push(lid);

    // Eyebrow
    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.006, 0.008),
      hairMat
    );
    brow.position.set(side * 0.035, 0.037, 0.095);
    brow.rotation.z = side * -0.08;
    headGroup.add(brow);
  }

  // Layered wavy hair (not a flat sphere)
  const hairGroup = new THREE.Group();
  headGroup.add(hairGroup);

  const hairCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.112, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.62),
    hairMat
  );
  hairCrown.scale.set(0.95, 1.08, 1.02);
  hairCrown.position.set(0, 0.015, -0.008);
  hairCrown.castShadow = true;
  hairGroup.add(hairCrown);

  if (isMale) {
    // Textured short wavy crown locks & neat tapered sides
    for (let i = 0; i < 8; i++) {
      const tuft = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.02, 0.045, 4, 8),
        hairMat
      );
      const a = (i / 8) * Math.PI * 1.4 - Math.PI * 0.7;
      tuft.position.set(Math.sin(a) * 0.068, 0.088 + (i % 2) * 0.01, Math.cos(a) * 0.064);
      tuft.rotation.set(0.55, a, 0.22);
      hairGroup.add(tuft);
    }
    const backHair = new THREE.Mesh(
      new THREE.CylinderGeometry(0.096, 0.082, 0.11, 14),
      hairMat
    );
    backHair.position.set(0, -0.02, -0.032);
    hairGroup.add(backHair);
  } else {
    // Long softly wavy layered hair reaching mid-back without clipping shoulders
    const backCascade = new THREE.Group();
    backCascade.position.set(0, 0.01, -0.072);
    hairGroup.add(backCascade);

    for (let s = -3; s <= 3; s++) {
      const strand = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.028, 0.34 - Math.abs(s) * 0.025, 6, 10),
        hairMat
      );
      strand.position.set(s * 0.028, -0.18, -Math.abs(s) * 0.006);
      strand.rotation.x = 0.18;
      strand.rotation.z = s * 0.05;
      strand.castShadow = true;
      backCascade.add(strand);
    }
    // Side framing waves
    for (const side of [-1, 1]) {
      const sideWave = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.022, 0.17, 5, 8),
        hairMat
      );
      sideWave.position.set(side * 0.094, -0.05, 0.02);
      sideWave.rotation.z = side * -0.1;
      hairGroup.add(sideWave);
    }
    hairGroup.userData.backCascade = backCascade;
  }

  // Arms (left/right pivots at shoulder width)
  function createArm(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * (shoulderW * 0.5), torsoH - 0.055, 0);
    torso.add(pivot);

    // Rolled sleeve upper arm
    const sleeveLen = isMale ? 0.24 : 0.20;
    const upperArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(isMale ? 0.044 : 0.037, sleeveLen, 6, 10),
      topMat
    );
    upperArm.position.y = -sleeveLen * 0.55;
    upperArm.castShadow = true;
    pivot.add(upperArm);

    if (isMale) {
      const cuff = new THREE.Mesh(
        new THREE.CylinderGeometry(0.047, 0.045, 0.028, 12),
        topMat
      );
      cuff.position.y = -sleeveLen - 0.01;
      pivot.add(cuff);
    }

    const elbow = new THREE.Group();
    elbow.position.y = -0.26;
    pivot.add(elbow);

    const forearm = new THREE.Mesh(
      new THREE.CapsuleGeometry(isMale ? 0.036 : 0.03, 0.22, 6, 10),
      skinMat
    );
    forearm.position.y = -0.11;
    forearm.castShadow = true;
    elbow.add(forearm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 10), skinMat);
    hand.scale.set(0.85, 1.3, 0.55);
    hand.position.y = -0.25;
    elbow.add(hand);

    // Simple wristwatch on male left arm
    if (isMale && side === -1) {
      const strap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.038, 0.024, 12),
        new THREE.MeshStandardMaterial({ color: '#2B211B', roughness: 0.7 })
      );
      strap.position.y = -0.205;
      elbow.add(strap);
      const face = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.008, 12),
        new THREE.MeshStandardMaterial({ color: '#D6C4A4', roughness: 0.35, metalness: 0.6 })
      );
      face.rotation.z = Math.PI * 0.5;
      face.position.set(-0.036, -0.205, 0.008);
      elbow.add(face);
    }

    return { pivot, elbow };
  }

  const leftArm = createArm(-1);
  const rightArm = createArm(1);

  // Legs
  function createLeg(side) {
    const hip = new THREE.Group();
    hip.position.set(side * (isMale ? 0.095 : 0.085), -0.02, 0);
    pelvis.add(hip);

    const legMat = isMale ? bottomOrAccentMat : skinMat;
    const thighLen = hipHeight * 0.45;
    const thigh = new THREE.Mesh(
      new THREE.CapsuleGeometry(isMale ? 0.062 : 0.052, thighLen, 6, 12),
      legMat
    );
    thigh.position.y = -thighLen * 0.5;
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -thighLen - 0.02;
    hip.add(knee);

    const calfLen = hipHeight * 0.43;
    const calf = new THREE.Mesh(
      new THREE.CapsuleGeometry(isMale ? 0.048 : 0.041, calfLen, 6, 12),
      legMat
    );
    calf.position.y = -calfLen * 0.5;
    calf.castShadow = true;
    knee.add(calf);

    // Foot + sole matching 0.27 m male / 0.24 m female foot length
    const footLen = isMale ? 0.27 : 0.24;
    const footGroup = new THREE.Group();
    footGroup.position.set(0, -calfLen - 0.025, 0.04);
    knee.add(footGroup);

    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.095, 0.055, footLen),
      shoeMat
    );
    shoe.position.y = 0.028;
    shoe.castShadow = true;
    footGroup.add(shoe);

    if (isMale) {
      const sole = new THREE.Mesh(
        new THREE.BoxGeometry(0.098, 0.018, footLen + 0.006),
        soleMat
      );
      sole.position.y = 0.008;
      footGroup.add(sole);
    }

    return { hip, knee, footGroup };
  }

  const leftLeg = createLeg(-1);
  const rightLeg = createLeg(1);

  // Selection ground ring (subtle antique brass halo on start screen)
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
  let blinkTimer = 2.0 + Math.random() * 2.5;

  function update(dt, optionsOrElapsed = 0, speedParam = 0, seatedParam = false) {
    let speed = 0;
    let seated = false;
    let highlighted = false;
    let time = 0;

    if (optionsOrElapsed && typeof optionsOrElapsed === 'object') {
      speed = optionsOrElapsed.speed ?? 0;
      seated = optionsOrElapsed.seated ?? false;
      highlighted = optionsOrElapsed.highlighted ?? false;
      time = optionsOrElapsed.time ?? 0;
    } else {
      time = typeof optionsOrElapsed === 'number' ? optionsOrElapsed : 0;
      speed = typeof speedParam === 'number' ? speedParam : 0;
      seated = Boolean(seatedParam);
    }
    halo.material.opacity = THREE.MathUtils.lerp(
      halo.material.opacity,
      highlighted ? 0.62 : 0.0,
      Math.min(1, dt * 8)
    );

    // Periodic blinking
    blinkTimer -= dt;
    let lidScaleY = 0.08;
    if (blinkTimer <= 0) {
      if (blinkTimer > -0.14) {
        lidScaleY = Math.sin(((0.14 + blinkTimer) / 0.14) * Math.PI) * 1.15;
      } else {
        blinkTimer = 3.2 + Math.random() * 2.8;
      }
    }
    for (const lid of eyelids) {
      lid.scale.y = Math.max(0.08, lidScaleY);
    }

    // Idle breathing + gentle head micro-motion
    const breath = Math.sin(time * 2.1) * 0.008;
    torso.position.y = 0.07 + breath;
    headGroup.rotation.y = Math.sin(time * 0.75) * 0.06;
    headGroup.rotation.x = Math.sin(time * 0.55) * 0.03;

    if (hairGroup.userData.backCascade) {
      hairGroup.userData.backCascade.rotation.x = 0.05 + Math.sin(time * 1.8) * 0.025 + Math.min(0.18, speed * 0.04);
    }

    if (seated) {
      pelvis.position.y = hipHeight * 0.56;
      leftLeg.hip.rotation.x = -Math.PI * 0.48;
      rightLeg.hip.rotation.x = -Math.PI * 0.48;
      leftLeg.knee.rotation.x = Math.PI * 0.48;
      rightLeg.knee.rotation.x = Math.PI * 0.48;
      leftArm.pivot.rotation.x = -0.35;
      rightArm.pivot.rotation.x = -0.35;
      leftArm.elbow.rotation.x = -0.55;
      rightArm.elbow.rotation.x = -0.55;
      return;
    }

    if (speed > 0.2) {
      // Stride synced with player displacement speed
      walkPhase += dt * speed * 3.35;
      const swing = Math.sin(walkPhase) * Math.min(0.55, 0.25 + speed * 0.1);
      const bob = Math.abs(Math.cos(walkPhase)) * 0.025;
      pelvis.position.y = hipHeight + bob;

      leftLeg.hip.rotation.x = swing;
      rightLeg.hip.rotation.x = -swing;
      leftLeg.knee.rotation.x = Math.max(0, -Math.cos(walkPhase) * 0.45);
      rightLeg.knee.rotation.x = Math.max(0, Math.cos(walkPhase) * 0.45);

      leftArm.pivot.rotation.x = -swing * 0.72;
      rightArm.pivot.rotation.x = swing * 0.72;
      leftArm.elbow.rotation.x = -0.25;
      rightArm.elbow.rotation.x = -0.25;
    } else {
      pelvis.position.y = THREE.MathUtils.lerp(pelvis.position.y, hipHeight, Math.min(1, dt * 10));
      leftLeg.hip.rotation.x = THREE.MathUtils.lerp(leftLeg.hip.rotation.x, 0, Math.min(1, dt * 10));
      rightLeg.hip.rotation.x = THREE.MathUtils.lerp(rightLeg.hip.rotation.x, 0, Math.min(1, dt * 10));
      leftLeg.knee.rotation.x = THREE.MathUtils.lerp(leftLeg.knee.rotation.x, 0, Math.min(1, dt * 10));
      rightLeg.knee.rotation.x = THREE.MathUtils.lerp(rightLeg.knee.rotation.x, 0, Math.min(1, dt * 10));

      const idleArm = Math.sin(time * 1.4) * 0.03;
      leftArm.pivot.rotation.x = THREE.MathUtils.lerp(leftArm.pivot.rotation.x, idleArm, Math.min(1, dt * 8));
      rightArm.pivot.rotation.x = THREE.MathUtils.lerp(rightArm.pivot.rotation.x, -idleArm, Math.min(1, dt * 8));
      leftArm.elbow.rotation.x = -0.12;
      rightArm.elbow.rotation.x = -0.12;
    }
  }

  return {
    root,
    totalHeight,
    update,
  };
}