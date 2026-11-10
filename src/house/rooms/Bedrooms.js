import * as THREE from 'three';
import {
  getTimberTextures,
  getFabricTextures,
  getArtworkTexture,
  getRugTextures,
} from '../../assets/procedural/TextureGenerator.js';
import {
  createChamferedBoxGeo,
  createPlushPillowGeo,
  createFoldedTowelStack,
} from './RoomProps.js';
import { gameStore } from '../../state/gameStore.js';

/**
 * BedroomsBuilder: Furnishes Master Bedroom 1 and Guest Bedroom 2 (PRD §10.4, §10.8, Features F24 & F26).
 */
export class BedroomsBuilder {
  constructor(options = {}) {
    this.options = options;
    this.group = new THREE.Group();
    this.group.name = 'furniture-bedrooms';
    this.colliders = [];
    this.interactables = [];
    this.seats = [];
    this.materials = this.createMaterials();
  }

  createMaterials() {
    const walnut = getTimberTextures('walnut', 2, 2);
    const sandalwood = getTimberTextures('sandalwood', 2, 2);
    const bedLinenCream = getFabricTextures('#F2ECE1', 4, 4);
    const duvetTaupe = getFabricTextures('#B7A797', 3, 3);
    const duvetDustyRose = getFabricTextures('#C9828B', 3, 3);

    return {
      woodWalnut: new THREE.MeshStandardMaterial({
        map: walnut.map,
        bumpMap: walnut.bumpMap,
        bumpScale: 0.03,
        roughness: 0.58,
        metalness: 0.04,
      }),
      woodSandalwood: new THREE.MeshStandardMaterial({
        map: sandalwood.map,
        bumpMap: sandalwood.bumpMap,
        bumpScale: 0.03,
        roughness: 0.55,
        metalness: 0.04,
      }),
      sheetCream: new THREE.MeshStandardMaterial({
        map: bedLinenCream.map,
        bumpMap: bedLinenCream.bumpMap,
        bumpScale: 0.02,
        roughness: 0.92,
      }),
      duvetMaster: new THREE.MeshStandardMaterial({
        map: duvetTaupe.map,
        bumpMap: duvetTaupe.bumpMap,
        bumpScale: 0.04,
        roughness: 0.9,
      }),
      duvetGuest: new THREE.MeshStandardMaterial({
        map: duvetDustyRose.map,
        bumpMap: duvetDustyRose.bumpMap,
        bumpScale: 0.04,
        roughness: 0.9,
      }),
      pillowWhite: new THREE.MeshStandardMaterial({
        color: 0xfaf7f2,
        roughness: 0.95,
      }),
      lampShade: new THREE.MeshStandardMaterial({
        color: 0xfffaed,
        roughness: 0.8,
        emissive: 0xffdfaa,
        emissiveIntensity: 0.7,
      }),
      brassMetal: new THREE.MeshStandardMaterial({
        color: 0xc8a265,
        roughness: 0.32,
        metalness: 0.85,
      }),
      mirrorGlass: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.05,
        metalness: 0.95,
      }),
      oliveAccent: new THREE.MeshStandardMaterial({
        color: 0x6f7b62,
        roughness: 0.9,
      }),
      laptopBody: new THREE.MeshStandardMaterial({
        color: 0x2b2d30,
        roughness: 0.35,
        metalness: 0.7,
      }),
      laptopScreen: new THREE.MeshStandardMaterial({
        color: 0x1e3545,
        emissive: 0x294a5e,
        emissiveIntensity: 0.35,
        roughness: 0.15,
      }),
    };
  }

  build() {
    this.buildMasterBedroom1();
    this.buildGuestBedroom2();

    this.group.userData = {
      zoneId: 'bedrooms',
      colliders: this.colliders,
      interactables: this.interactables,
      seats: this.seats,
    };

    return this.group;
  }

  /**
   * Master Bedroom 1 (Ground Floor: minX: 7.55, maxX: 11.75, minZ: 4.75, maxZ: 8.75, floorY: 0.3).
   * Headboard backed flush onto solid North wall (Z=8.75) so win-bed1-east & both doors remain 100% unobstructed.
   */
  buildMasterBedroom1() {
    const b1Group = new THREE.Group();
    b1Group.name = 'furniture-bedroom-1';

    const floorY = 0.3;
    const bedX = 10.1;
    const bedZ = 7.68;

    // 1. King-size Bed: 2.0m L (along Z) x 1.8m W (along X), mattress H 0.55m, headboard H 1.1m
    const bedL = 2.0;
    const bedW = 1.8;
    const matH = 0.55;
    const hbH = 1.1;

    // Wool area rug beneath bed
    const rug1Tex = getRugTextures('bed1', 1, 1);
    const rug1Geo = new THREE.PlaneGeometry(2.7, 2.35);
    rug1Geo.rotateX(-Math.PI / 2);
    const rug1 = new THREE.Mesh(
      rug1Geo,
      new THREE.MeshStandardMaterial({
        map: rug1Tex.map,
        normalMap: rug1Tex.normalMap,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughnessMap: rug1Tex.roughnessMap,
        roughness: 0.94,
      })
    );
    rug1.position.set(0, 0.004, -0.2);
    rug1.receiveShadow = true;
    b1Group.add(rug1);

    // Tapered bed feet + beveled walnut platform frame
    const footGeo = new THREE.CylinderGeometry(0.026, 0.018, 0.1, 8);
    for (const fx of [-bedW * 0.5 + 0.08, bedW * 0.5 - 0.08]) {
      for (const fz of [-bedL * 0.5 + 0.08, bedL * 0.5 - 0.08]) {
        const foot = new THREE.Mesh(footGeo, this.materials.woodWalnut);
        foot.position.set(fx, 0.05, fz);
        b1Group.add(foot);
      }
    }
    const frameMesh = new THREE.Mesh(
      createChamferedBoxGeo(bedW, 0.14, bedL, 0.03),
      this.materials.woodWalnut
    );
    frameMesh.position.set(0, 0.17, 0);
    frameMesh.castShadow = true;
    b1Group.add(frameMesh);

    // Chamfered sprung mattress (top at 0.55m)
    const matMesh = new THREE.Mesh(
      createChamferedBoxGeo(bedW - 0.06, matH - 0.22, bedL - 0.06, 0.045),
      this.materials.sheetCream
    );
    matMesh.position.set(0, 0.22 + (matH - 0.22) * 0.5, -0.02);
    matMesh.castShadow = true;
    matMesh.receiveShadow = true;
    b1Group.add(matMesh);

    // Quilted chamfered duvet over lower two thirds + folded muted-olive throw blanket at foot
    const duvetMesh = new THREE.Mesh(
      createChamferedBoxGeo(bedW + 0.02, 0.055, (bedL - 0.08) * 0.65, 0.035),
      this.materials.duvetMaster
    );
    duvetMesh.position.set(0, matH + 0.02, -bedL * 0.16);
    duvetMesh.castShadow = true;
    b1Group.add(duvetMesh);

    const footThrow = new THREE.Mesh(
      createChamferedBoxGeo(bedW + 0.04, 0.035, 0.42, 0.02),
      this.materials.oliveAccent
    );
    footThrow.position.set(0, matH + 0.048, -bedL * 0.36);
    footThrow.castShadow = true;
    b1Group.add(footThrow);

    // Upholstered walnut-framed headboard at North edge: Z = +bedL * 0.5 - 0.04
    const hbFrame = new THREE.Mesh(
      createChamferedBoxGeo(bedW + 0.14, hbH, 0.08, 0.025),
      this.materials.woodWalnut
    );
    hbFrame.position.set(0, hbH * 0.5, bedL * 0.5 - 0.04);
    hbFrame.castShadow = true;
    b1Group.add(hbFrame);

    const hbPad = new THREE.Mesh(
      createChamferedBoxGeo(bedW - 0.04, hbH - 0.28, 0.05, 0.03),
      this.materials.duvetMaster
    );
    hbPad.position.set(0, hbH * 0.5 + 0.1, bedL * 0.5 - 0.075);
    b1Group.add(hbPad);

    // 4 Plump pillows against headboard
    const pillowGeo = createPlushPillowGeo(0.56, 0.34, 0.14);
    for (const px of [-0.42, 0.42]) {
      const p1 = new THREE.Mesh(pillowGeo, this.materials.pillowWhite);
      p1.position.set(px, matH + 0.11, bedL * 0.5 - 0.24);
      p1.rotation.x = 0.24;
      p1.castShadow = true;
      b1Group.add(p1);

      const p2 = new THREE.Mesh(
        createPlushPillowGeo(0.46, 0.28, 0.12),
        this.materials.duvetMaster
      );
      p2.position.set(px, matH + 0.09, bedL * 0.5 - 0.38);
      p2.rotation.x = 0.34;
      p2.castShadow = true;
      b1Group.add(p2);
    }

    // Upholstered foot-of-bed bench
    const bench = new THREE.Group();
    const benchPad = new THREE.Mesh(
      createChamferedBoxGeo(1.35, 0.12, 0.42, 0.03),
      this.materials.duvetMaster
    );
    benchPad.position.y = 0.39;
    benchPad.castShadow = true;
    bench.add(benchPad);
    for (const lx of [-0.58, 0.58]) {
      for (const lz of [-0.15, 0.15]) {
        const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.014, 0.33, 8), this.materials.woodWalnut);
        l.position.set(lx, 0.165, lz);
        bench.add(l);
      }
    }
    bench.position.set(0, 0, -bedL * 0.5 - 0.42);
    b1Group.add(bench);

    this.seats.push({
      id: 'bedroom-1-bench',
      label: 'Bedroom 1 Bench',
      x: bedX,
      y: floorY + 0.45,
      z: bedZ - bedL * 0.5 - 0.42,
      heading: Math.PI,
    });

    // 2. Dual Bedside Nightstands: 0.55m W x 0.45m D x 0.55m H with brass pulls
    const nsW = 0.55;
    const nsD = 0.45;
    const nsH = 0.55;
    const nsOffsetX = bedW * 0.5 + nsW * 0.5 + 0.08;
    const nsZ = bedL * 0.5 - nsD * 0.5;

    for (const [sign, key, label] of [
      [-1, 'b1Left', 'Master Bed Lamp Left'],
      [1, 'b1Right', 'Master Bed Lamp Right'],
    ]) {
      const ns = new THREE.Mesh(
        createChamferedBoxGeo(nsW, nsH - 0.1, nsD, 0.02),
        this.materials.woodWalnut
      );
      ns.position.set(sign * nsOffsetX, 0.1 + (nsH - 0.1) * 0.5, nsZ);
      ns.castShadow = true;
      b1Group.add(ns);

      for (const flx of [-0.2, 0.2]) {
        for (const flz of [-0.16, 0.16]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.011, 0.1, 8), this.materials.brassMetal);
          leg.position.set(sign * nsOffsetX + flx, 0.05, nsZ + flz);
          b1Group.add(leg);
        }
      }
      const pull = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.012, 0.018), this.materials.brassMetal);
      pull.position.set(sign * nsOffsetX, nsH * 0.72, nsZ - nsD * 0.5 - 0.01);
      b1Group.add(pull);

      const lamp = this.createBedsideLamp(key, label, {
        x: bedX + sign * nsOffsetX,
        y: floorY + nsH + 0.26,
        z: bedZ + nsZ,
      });
      lamp.position.set(sign * nsOffsetX, nsH, nsZ);
      b1Group.add(lamp);
    }

    // 3. Wardrobe cleanly along West wall North of door-bedroom-1 (Z=7.90, clear of door swing Z∈[5.15..6.05])
    const ward = new THREE.Group();
    ward.name = 'bedroom-1-wardrobe';
    const wBox = new THREE.Mesh(
      createChamferedBoxGeo(0.58, 2.15, 1.32, 0.02),
      this.materials.woodWalnut
    );
    wBox.position.set(0, 1.075, 0);
    wBox.castShadow = true;
    ward.add(wBox);
    for (const wz of [-0.3, 0.3]) {
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.34, 8), this.materials.brassMetal);
      h.position.set(0.305, 1.15, wz);
      ward.add(h);
    }
    ward.position.set(-bedX + 7.86, 0, -bedZ + 7.92);
    b1Group.add(ward);

    // 4. Vanity Dresser & oval brass mirror along East wall South of win-bed1-east
    const dresser = new THREE.Group();
    dresser.name = 'bedroom-1-dresser';
    const dBox = new THREE.Mesh(
      createChamferedBoxGeo(0.42, 0.76, 1.1, 0.02),
      this.materials.woodSandalwood
    );
    dBox.position.set(0, 0.38, 0);
    dBox.castShadow = true;
    dresser.add(dBox);
    const mirrorBack = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.018, 24), this.materials.woodWalnut);
    mirrorBack.rotation.z = Math.PI / 2;
    mirrorBack.scale.set(1.25, 1, 1);
    mirrorBack.position.set(0.195, 1.32, 0);
    dresser.add(mirrorBack);
    const ovalMirror = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.02, 24), this.materials.mirrorGlass);
    ovalMirror.rotation.z = Math.PI / 2;
    ovalMirror.scale.set(1.25, 1, 1);
    ovalMirror.position.set(0.18, 1.32, 0);
    dresser.add(ovalMirror);
    const ovalRing = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.015, 8, 24), this.materials.brassMetal);
    ovalRing.rotation.y = Math.PI / 2;
    ovalRing.scale.set(1, 1.25, 1);
    ovalRing.position.set(0.18, 1.32, 0);
    dresser.add(ovalRing);
    dresser.position.set(-bedX + 11.48, 0, -bedZ + 5.36);
    b1Group.add(dresser);

    // 5. Framed botanical artwork canvas on North wall above headboard
    let artTex;
    try {
      artTex = getArtworkTexture('botanical');
    } catch {
      const canvas = document.createElement('canvas');
      canvas.width = 384;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#52794E';
        ctx.fillRect(0, 0, 384, 512);
      }
      artTex = new THREE.CanvasTexture(canvas);
      artTex.colorSpace = THREE.SRGBColorSpace;
    }
    const artMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.85),
      new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.8 })
    );
    artMesh.rotation.y = Math.PI;
    artMesh.position.set(0, 1.75, bedL * 0.5 + 0.04);
    b1Group.add(artMesh);

    const artFrame = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.91, 0.025), this.materials.brassMetal);
    artFrame.position.set(0, 1.75, bedL * 0.5 + 0.055);
    b1Group.add(artFrame);

    b1Group.position.set(bedX, floorY, bedZ);
    this.group.add(b1Group);

    this.colliders.push({
      id: 'collider-bedroom-1-bed',
      min: new THREE.Vector3(bedX - nsOffsetX - nsW * 0.5, floorY, bedZ - bedL * 0.5),
      max: new THREE.Vector3(bedX + nsOffsetX + nsW * 0.5, floorY + hbH, bedZ + bedL * 0.5),
      type: 'furniture',
    });
    this.colliders.push({
      id: 'collider-bedroom-1-wardrobe',
      min: new THREE.Vector3(7.57, floorY, 7.26),
      max: new THREE.Vector3(8.16, floorY + 2.15, 8.58),
      type: 'furniture',
    });
  }

  /**
   * Guest Bedroom 2 (Upper Floor: minX: -11.75, maxX: -7.25, minZ: 0.2, maxZ: 4.4, floorY: 3.95).
   * Queen Bed backed against solid East partition wall (X=-7.25) so Balcony 2 door, Bedroom 2 door,
   * Bathroom 2 door, and Walk-in Wardrobe door stay 100% open & unobstructed.
   */
  buildGuestBedroom2() {
    const b2Group = new THREE.Group();
    b2Group.name = 'furniture-bedroom-2';

    const floorY = 3.95;
    const bedX = -8.25;
    const bedZ = 2.92;

    // 1. Queen-size Bed: 1.90m L (along X) x 1.50m W (along Z) x 0.55m H
    const bedL = 1.9;
    const bedW = 1.5;
    const bedH = 0.55;

    // Sage wool area rug under bed
    const rug2Tex = getRugTextures('bed2', 1, 1);
    const rug2Geo = new THREE.PlaneGeometry(2.3, 2.2);
    rug2Geo.rotateX(-Math.PI / 2);
    const rug2 = new THREE.Mesh(
      rug2Geo,
      new THREE.MeshStandardMaterial({
        map: rug2Tex.map,
        normalMap: rug2Tex.normalMap,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughnessMap: rug2Tex.roughnessMap,
        roughness: 0.94,
      })
    );
    rug2.position.set(-0.2, 0.004, 0);
    rug2.receiveShadow = true;
    b2Group.add(rug2);

    // Chamfered sandalwood bed frame
    const frameMesh = new THREE.Mesh(
      createChamferedBoxGeo(bedL, 0.16, bedW, 0.03),
      this.materials.woodSandalwood
    );
    frameMesh.position.set(0, 0.14, 0);
    frameMesh.castShadow = true;
    b2Group.add(frameMesh);

    const footGeo = new THREE.CylinderGeometry(0.022, 0.015, 0.07, 8);
    for (const fx of [-bedL * 0.5 + 0.08, bedL * 0.5 - 0.08]) {
      for (const fz of [-bedW * 0.5 + 0.08, bedW * 0.5 - 0.08]) {
        const foot = new THREE.Mesh(footGeo, this.materials.woodSandalwood);
        foot.position.set(fx, 0.035, fz);
        b2Group.add(foot);
      }
    }

    // Chamfered mattress
    const matMesh = new THREE.Mesh(
      createChamferedBoxGeo(bedL - 0.05, bedH - 0.2, bedW - 0.05, 0.045),
      this.materials.sheetCream
    );
    matMesh.position.set(-0.02, 0.2 + (bedH - 0.2) * 0.5, 0);
    matMesh.castShadow = true;
    matMesh.receiveShadow = true;
    b2Group.add(matMesh);

    // Dusty-rose quilted duvet + folded cream blanket at foot
    const duvetMesh = new THREE.Mesh(
      createChamferedBoxGeo(bedL * 0.65, 0.05, bedW + 0.02, 0.035),
      this.materials.duvetGuest
    );
    duvetMesh.position.set(-bedL * 0.16, bedH + 0.018, 0);
    duvetMesh.castShadow = true;
    b2Group.add(duvetMesh);

    const b2Throw = createFoldedTowelStack(
      [this.materials.sheetCream, this.materials.oliveAccent],
      [0.36, 0.3],
      [0.045, 0.03],
      bedW - 0.1
    );
    b2Throw.position.set(-bedL * 0.35, bedH + 0.035, 0);
    b2Group.add(b2Throw);

    // Upholstered sandalwood headboard at East edge: X = +bedL * 0.5 - 0.04
    const hbMesh = new THREE.Mesh(
      createChamferedBoxGeo(0.08, 1.0, bedW + 0.12, 0.025),
      this.materials.woodSandalwood
    );
    hbMesh.position.set(bedL * 0.5 - 0.04, 0.5, 0);
    hbMesh.castShadow = true;
    b2Group.add(hbMesh);

    // 4 Plump pillows reclining back cleanly against East headboard (+X)
    const pGeo = createPlushPillowGeo(0.42, 0.3, 0.13);
    for (const pz of [-0.36, 0.36]) {
      const p1 = new THREE.Mesh(pGeo, this.materials.pillowWhite);
      p1.rotation.order = 'YXZ';
      p1.rotation.y = -Math.PI / 2;
      p1.rotation.x = -0.25;
      p1.position.set(bedL * 0.5 - 0.24, bedH + 0.1, pz);
      b2Group.add(p1);

      const p2 = new THREE.Mesh(
        createPlushPillowGeo(0.36, 0.25, 0.11),
        this.materials.duvetGuest
      );
      p2.rotation.order = 'YXZ';
      p2.rotation.y = -Math.PI / 2;
      p2.rotation.x = -0.35;
      p2.position.set(bedL * 0.5 - 0.37, bedH + 0.08, pz);
      b2Group.add(p2);
    }

    // 2. Dual Bedside Nightstands: 0.50m x 0.45m (Z = 1.88 South, Z = 3.96 North)
    const nsW = 0.5;
    const nsD = 0.45;
    const nsH = 0.5;
    const nsOffZ = bedW * 0.5 + nsW * 0.5 + 0.04;
    const nsX = bedL * 0.5 - nsD * 0.5;

    for (const [sign, key, label] of [
      [-1, 'b2Left', 'Guest Bed Lamp Left'],
      [1, 'b2Right', 'Guest Bed Lamp Right'],
    ]) {
      const ns = new THREE.Mesh(
        createChamferedBoxGeo(nsD, nsH, nsW, 0.02),
        this.materials.woodSandalwood
      );
      ns.position.set(nsX, nsH * 0.5, sign * nsOffZ);
      ns.castShadow = true;
      b2Group.add(ns);

      const lamp = this.createBedsideLamp(key, label, {
        x: bedX + nsX,
        y: floorY + nsH + 0.26,
        z: bedZ + sign * nsOffZ,
      });
      lamp.position.set(nsX, nsH, sign * nsOffZ);
      b2Group.add(lamp);
    }

    // 3. Study Desk (1.20m W x 0.60m D x 0.75m H) & Chair along South-West wall (clear of Balcony 2 door Z∈[1.6..3.0])
    const deskGroup = new THREE.Group();
    deskGroup.name = 'guest-study-desk';

    const dW = 1.2;
    const dD = 0.6;
    const dH = 0.75;

    const deskTop = new THREE.Mesh(
      createChamferedBoxGeo(dD, 0.04, dW, 0.025),
      this.materials.woodSandalwood
    );
    deskTop.position.set(0, dH - 0.02, 0);
    deskTop.castShadow = true;
    deskGroup.add(deskTop);

    const legGeo = new THREE.CylinderGeometry(0.02, 0.014, dH - 0.04, 8);
    for (const lx of [-dD * 0.5 + 0.06, dD * 0.5 - 0.06]) {
      for (const lz of [-dW * 0.5 + 0.06, dW * 0.5 - 0.06]) {
        const leg = new THREE.Mesh(legGeo, this.materials.woodWalnut);
        leg.position.set(lx, (dH - 0.04) * 0.5, lz);
        leg.castShadow = true;
        deskGroup.add(leg);
      }
    }

    // Open laptop & brass task lamp + notebook on desk
    const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.012, 0.34), this.materials.laptopBody);
    laptopBase.position.set(0.04, dH + 0.006, 0);
    deskGroup.add(laptopBase);
    const laptopLid = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.22, 0.34), this.materials.laptopScreen);
    laptopLid.position.set(-0.08, dH + 0.11, 0);
    laptopLid.rotation.z = 0.2;
    deskGroup.add(laptopLid);

    const notebook = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.016, 0.15), this.materials.duvetGuest);
    notebook.position.set(0.05, dH + 0.008, -0.35);
    notebook.rotation.y = 0.22;
    deskGroup.add(notebook);

    // Ergonomic desk chair (seat height 0.45m) facing West desk
    const chairGroup = new THREE.Group();
    const cSeat = new THREE.Mesh(
      createChamferedBoxGeo(0.44, 0.065, 0.44, 0.025),
      this.materials.sheetCream
    );
    cSeat.position.set(0, 0.45, 0);
    cSeat.castShadow = true;
    chairGroup.add(cSeat);

    const cBack = new THREE.Mesh(
      createChamferedBoxGeo(0.05, 0.38, 0.42, 0.02),
      this.materials.woodSandalwood
    );
    cBack.position.set(0.2, 0.65, 0);
    cBack.rotation.z = -0.08;
    chairGroup.add(cBack);

    const cLegGeo = new THREE.CylinderGeometry(0.014, 0.011, 0.42, 8);
    for (const cx of [-0.17, 0.17]) {
      for (const cz of [-0.17, 0.17]) {
        const l = new THREE.Mesh(cLegGeo, this.materials.woodWalnut);
        l.position.set(cx, 0.21, cz);
        chairGroup.add(l);
      }
    }

    chairGroup.position.set(0.54, 0, 0);
    deskGroup.add(chairGroup);

    const deskWorldX = -11.42;
    const deskWorldZ = 0.85;
    deskGroup.position.set(deskWorldX - bedX, 0, deskWorldZ - bedZ);
    b2Group.add(deskGroup);

    this.seats.push({
      id: 'bedroom-2-desk-chair',
      label: 'Bedroom 2 Study Desk Chair',
      x: deskWorldX + 0.54,
      y: floorY + 0.45,
      z: deskWorldZ,
      heading: Math.PI / 2,
    });

    // Artwork above East headboard
    let art2Tex;
    try {
      art2Tex = getArtworkTexture('abstract');
    } catch {
      art2Tex = null;
    }
    if (art2Tex) {
      const aMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.95, 0.72),
        new THREE.MeshStandardMaterial({ map: art2Tex, roughness: 0.78 })
      );
      aMesh.rotation.y = -Math.PI / 2;
      aMesh.position.set(bedL * 0.5 + 0.02, 1.55, 0);
      b2Group.add(aMesh);
    }

    b2Group.position.set(bedX, floorY, bedZ);
    this.group.add(b2Group);

    this.colliders.push({
      id: 'collider-bedroom-2-bed',
      min: new THREE.Vector3(bedX - bedL * 0.5, floorY, bedZ - nsOffZ - nsW * 0.5),
      max: new THREE.Vector3(bedX + bedL * 0.5, floorY + 1.0, bedZ + nsOffZ + nsW * 0.5),
      type: 'furniture',
    });
    this.colliders.push({
      id: 'collider-bedroom-2-desk',
      min: new THREE.Vector3(deskWorldX - dD * 0.5, floorY, deskWorldZ - dW * 0.5),
      max: new THREE.Vector3(deskWorldX + dD * 0.5, floorY + dH, deskWorldZ + dW * 0.5),
      type: 'furniture',
    });
  }

  /**
   * Helper to create a toggleable bedside lamp.
   */
  createBedsideLamp(lampKey, label, worldPos = { x: 0, y: 0, z: 0 }) {
    const lampGroup = new THREE.Group();
    lampGroup.name = `lamp-${lampKey}`;

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.09, 0.02, 16),
      this.materials.brassMetal
    );
    base.position.set(0, 0.01, 0);
    lampGroup.add(base);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.24, 8),
      this.materials.brassMetal
    );
    stem.position.set(0, 0.13, 0);
    lampGroup.add(stem);

    const shadeGeo = new THREE.CylinderGeometry(0.09, 0.14, 0.18, 16, 1, true);
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0xfffaed,
      roughness: 0.8,
      emissive: 0xffd999,
      emissiveIntensity: gameStore.getState().bedsideLamps[lampKey] ? 0.75 : 0.0,
      side: THREE.DoubleSide,
    });
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.set(0, 0.26, 0);
    lampGroup.add(shade);

    const pointLight = new THREE.PointLight(0xffecc4, 1.2, 3.5, 1.5);
    pointLight.position.set(0, 0.26, 0);
    pointLight.visible = Boolean(gameStore.getState().bedsideLamps[lampKey]);
    lampGroup.add(pointLight);

    gameStore.subscribe((state) => {
      const isOn = Boolean(state.bedsideLamps[lampKey]);
      pointLight.visible = isOn;
      shadeMat.emissiveIntensity = isOn ? 0.75 : 0.0;
      shadeMat.needsUpdate = true;
    });

    this.interactables.push({
      id: `lamp-switch-${lampKey}`,
      label,
      mesh: shade,
      x: worldPos.x,
      y: worldPos.y,
      z: worldPos.z,
      range: 2.2,
      prompt: 'Toggle Bedside Lamp',
      onInteract: () => {
        gameStore.toggleLamp(lampKey);
      },
    });

    return lampGroup;
  }
}

export function buildBedrooms(options = {}) {
  const builder = new BedroomsBuilder(options);
  return builder.build();
}
