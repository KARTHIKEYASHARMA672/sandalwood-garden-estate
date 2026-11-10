import * as THREE from 'three';
import {
  getTimberTextures,
  getFabricTextures,
  getArtworkTexture,
} from '../../assets/procedural/TextureGenerator.js';
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
   * Features:
   * - King-size bed (2.0m L x 1.8m W, mattress H = 0.55m, headboard H = 1.10m)
   * - Dual nightstands (0.55m W x 0.45m D x 0.55m H)
   * - Reactive bedside lamps (b1Left & b1Right)
   * - Freestanding wardrobe & vanity dresser with mirror
   */
  buildMasterBedroom1() {
    const b1Group = new THREE.Group();
    b1Group.name = 'furniture-bedroom-1';

    const floorY = 0.3;
    // Bed center position along east wall: X = 9.8, Z = 6.6
    const bedX = 9.8;
    const bedZ = 6.6;

    // 1. King-size Bed: 2.0m L x 1.8m W, mattress H 0.55m, headboard H 1.1m
    const bedL = 2.0;
    const bedW = 1.8;
    const matH = 0.55;
    const hbH = 1.1;

    // Timber bed frame base
    const frameGeo = new THREE.BoxGeometry(bedL, 0.22, bedW);
    const frameMesh = new THREE.Mesh(frameGeo, this.materials.woodWalnut);
    frameMesh.position.set(0, 0.11, 0);
    frameMesh.castShadow = true;
    b1Group.add(frameMesh);

    // Mattress (recessed into frame, top height 0.55m)
    const matGeo = new THREE.BoxGeometry(bedL - 0.06, matH - 0.2, bedW - 0.06);
    const matMesh = new THREE.Mesh(matGeo, this.materials.sheetCream);
    matMesh.position.set(0, 0.2 + (matH - 0.2) * 0.5, 0);
    matMesh.castShadow = true;
    matMesh.receiveShadow = true;
    b1Group.add(matMesh);

    // Folded duvet quilt over lower two thirds
    const duvetGeo = new THREE.BoxGeometry((bedL - 0.08) * 0.65, 0.04, bedW - 0.04);
    const duvetMesh = new THREE.Mesh(duvetGeo, this.materials.duvetMaster);
    duvetMesh.position.set(-(bedL - 0.08) * 0.16, matH + 0.02, 0);
    duvetMesh.castShadow = true;
    b1Group.add(duvetMesh);

    // Slatted/upholstered timber headboard at east edge: X = bedL * 0.5 - 0.04
    const hbGeo = new THREE.BoxGeometry(0.08, hbH, bedW + 0.1);
    const hbMesh = new THREE.Mesh(hbGeo, this.materials.woodWalnut);
    hbMesh.position.set(bedL * 0.5 - 0.04, hbH * 0.5, 0);
    hbMesh.castShadow = true;
    b1Group.add(hbMesh);

    // 4 Fluffy pillows against headboard
    const pillowGeo = new THREE.BoxGeometry(0.38, 0.16, 0.44);
    for (let pz of [-0.44, 0.44]) {
      // Lower row
      const p1 = new THREE.Mesh(pillowGeo, this.materials.pillowWhite);
      p1.position.set(bedL * 0.5 - 0.26, matH + 0.08, pz);
      p1.rotation.z = -0.25;
      p1.castShadow = true;
      b1Group.add(p1);

      // Upper accent pillow
      const p2 = new THREE.Mesh(pillowGeo, this.materials.duvetMaster);
      p2.position.set(bedL * 0.5 - 0.42, matH + 0.12, pz);
      p2.rotation.z = -0.35;
      p2.castShadow = true;
      b1Group.add(p2);
    }

    // 2. Dual Bedside Nightstands: 0.55m W x 0.45m D x 0.55m H
    const nsW = 0.55;
    const nsD = 0.45;
    const nsH = 0.55;

    // Left Nightstand (north of bed: Z = +1.28)
    const nsLeft = new THREE.Mesh(
      new THREE.BoxGeometry(nsD, nsH, nsW),
      this.materials.woodWalnut
    );
    nsLeft.position.set(bedL * 0.5 - nsD * 0.5, nsH * 0.5, bedW * 0.5 + nsW * 0.5 + 0.05);
    nsLeft.castShadow = true;
    b1Group.add(nsLeft);

    // Right Nightstand (south of bed: Z = -1.28)
    const nsRight = new THREE.Mesh(
      new THREE.BoxGeometry(nsD, nsH, nsW),
      this.materials.woodWalnut
    );
    nsRight.position.set(bedL * 0.5 - nsD * 0.5, nsH * 0.5, -bedW * 0.5 - nsW * 0.5 - 0.05);
    nsRight.castShadow = true;
    b1Group.add(nsRight);

    // 3. Bedside Lamps on each nightstand (reactive to gameStore b1Left & b1Right)
    const lampB1Left = this.createBedsideLamp('b1Left', 'Master Bed Lamp Left');
    lampB1Left.position.set(bedL * 0.5 - nsD * 0.5, nsH, bedW * 0.5 + nsW * 0.5 + 0.05);
    b1Group.add(lampB1Left);

    const lampB1Right = this.createBedsideLamp('b1Right', 'Master Bed Lamp Right');
    lampB1Right.position.set(bedL * 0.5 - nsD * 0.5, nsH, -bedW * 0.5 - nsW * 0.5 - 0.05);
    b1Group.add(lampB1Right);

    // 4. Wardrobe & Dresser Vanity on west wall of Bedroom 1
    const wardGeo = new THREE.BoxGeometry(0.6, 2.2, 1.8);
    const wardMesh = new THREE.Mesh(wardGeo, this.materials.woodWalnut);
    wardMesh.position.set(-bedL * 0.5 - 0.8, 1.1, 0);
    wardMesh.castShadow = true;
    b1Group.add(wardMesh);

    // 5. Framed botanical artwork canvas above headboard
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
    artMesh.rotation.y = -Math.PI / 2;
    artMesh.position.set(bedL * 0.5 + 0.05, 1.75, 0);
    b1Group.add(artMesh);

    b1Group.position.set(bedX, floorY, bedZ);
    this.group.add(b1Group);

    this.colliders.push({
      id: 'collider-bedroom-1-bed',
      min: new THREE.Vector3(bedX - bedL * 0.5, floorY, bedZ - bedW * 0.5 - nsW),
      max: new THREE.Vector3(bedX + bedL * 0.5, floorY + hbH, bedZ + bedW * 0.5 + nsW),
      type: 'furniture',
    });
  }

  /**
   * Guest Bedroom 2 (Upper Floor: minX: -11.75, maxX: -7.25, minZ: 0.2, maxZ: 4.4, floorY: 3.95).
   * Features:
   * - Queen-size bed (1.9m L x 1.5m W, height 0.55m)
   * - Study desk (1.2m W x 0.6m D x 0.75m H) with reading chair
   * - Dual nightstands with reactive bedside lamps (b2Left & b2Right)
   * - Connects to Balcony 2, Ensuite 2, and Walk-in Wardrobe
   */
  buildGuestBedroom2() {
    const b2Group = new THREE.Group();
    b2Group.name = 'furniture-bedroom-2';

    const floorY = 3.95;
    // Bed center in Bedroom 2: X = -9.5, Z = 2.2
    const bedX = -9.5;
    const bedZ = 2.2;

    // 1. Queen-size Bed: 1.90m L x 1.50m W x 0.55m H
    const bedL = 1.9;
    const bedW = 1.5;
    const bedH = 0.55;

    // Timber frame
    const frameMesh = new THREE.Mesh(
      new THREE.BoxGeometry(bedL, 0.2, bedW),
      this.materials.woodSandalwood
    );
    frameMesh.position.set(0, 0.1, 0);
    frameMesh.castShadow = true;
    b2Group.add(frameMesh);

    // Mattress
    const matMesh = new THREE.Mesh(
      new THREE.BoxGeometry(bedL - 0.05, bedH - 0.2, bedW - 0.05),
      this.materials.sheetCream
    );
    matMesh.position.set(0, 0.2 + (bedH - 0.2) * 0.5, 0);
    matMesh.castShadow = true;
    matMesh.receiveShadow = true;
    b2Group.add(matMesh);

    // Dusty-rose quilted duvet per PRD character companion palette
    const duvetMesh = new THREE.Mesh(
      new THREE.BoxGeometry(bedL * 0.65, 0.035, bedW - 0.04),
      this.materials.duvetGuest
    );
    duvetMesh.position.set(-bedL * 0.16, bedH + 0.018, 0);
    duvetMesh.castShadow = true;
    b2Group.add(duvetMesh);

    // Headboard at west edge: X = -bedL * 0.5 + 0.04
    const hbMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.95, bedW + 0.1),
      this.materials.woodSandalwood
    );
    hbMesh.position.set(-bedL * 0.5 + 0.04, 0.475, 0);
    hbMesh.castShadow = true;
    b2Group.add(hbMesh);

    // 2. Dual Bedside Nightstands: 0.50m x 0.45m
    const nsW = 0.5;
    const nsD = 0.45;
    const nsH = 0.5;

    const nsLeft = new THREE.Mesh(
      new THREE.BoxGeometry(nsD, nsH, nsW),
      this.materials.woodSandalwood
    );
    nsLeft.position.set(-bedL * 0.5 + nsD * 0.5, nsH * 0.5, bedW * 0.5 + nsW * 0.5 + 0.04);
    nsLeft.castShadow = true;
    b2Group.add(nsLeft);

    const nsRight = new THREE.Mesh(
      new THREE.BoxGeometry(nsD, nsH, nsW),
      this.materials.woodSandalwood
    );
    nsRight.position.set(-bedL * 0.5 + nsD * 0.5, nsH * 0.5, -bedW * 0.5 - nsW * 0.5 - 0.04);
    nsRight.castShadow = true;
    b2Group.add(nsRight);

    // Reactive Bedside Lamps (b2Left & b2Right)
    const lampB2Left = this.createBedsideLamp('b2Left', 'Guest Bed Lamp Left');
    lampB2Left.position.set(-bedL * 0.5 + nsD * 0.5, nsH, bedW * 0.5 + nsW * 0.5 + 0.04);
    b2Group.add(lampB2Left);

    const lampB2Right = this.createBedsideLamp('b2Right', 'Guest Bed Lamp Right');
    lampB2Right.position.set(-bedL * 0.5 + nsD * 0.5, nsH, -bedW * 0.5 - nsW * 0.5 - 0.04);
    b2Group.add(lampB2Right);

    // 3. Study Desk: 1.20m W x 0.60m D x 0.75m H with reading chair
    const deskGroup = new THREE.Group();
    deskGroup.name = 'guest-study-desk';

    const dW = 1.2;
    const dD = 0.6;
    const dH = 0.75;

    // Desk top in sandalwood
    const deskTop = new THREE.Mesh(
      new THREE.BoxGeometry(dW, 0.04, dD),
      this.materials.woodSandalwood
    );
    deskTop.position.set(0, dH - 0.02, 0);
    deskTop.castShadow = true;
    deskGroup.add(deskTop);

    // 4 Desk legs
    const legGeo = new THREE.CylinderGeometry(0.02, 0.015, dH - 0.04, 8);
    for (const lx of [-dW * 0.5 + 0.06, dW * 0.5 - 0.06]) {
      for (const lz of [-dD * 0.5 + 0.06, dD * 0.5 - 0.06]) {
        const leg = new THREE.Mesh(legGeo, this.materials.woodSandalwood);
        leg.position.set(lx, (dH - 0.04) * 0.5, lz);
        leg.castShadow = true;
        deskGroup.add(leg);
      }
    }

    // Reading chair at desk: seat height 0.45m
    const chairGroup = new THREE.Group();
    const cSeat = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.05, 0.44),
      this.materials.woodSandalwood
    );
    cSeat.position.set(0, 0.45, 0);
    cSeat.castShadow = true;
    chairGroup.add(cSeat);

    const cBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.4, 0.04),
      this.materials.woodSandalwood
    );
    cBack.position.set(0, 0.65, 0.2);
    chairGroup.add(cBack);

    chairGroup.position.set(0, 0, 0.5);
    chairGroup.rotation.y = Math.PI;
    deskGroup.add(chairGroup);

    // Position study desk along north interior wall
    deskGroup.position.set(0.4, 0, 1.4);
    b2Group.add(deskGroup);

    // Register desk chair seat interactable
    this.seats.push({
      id: 'bedroom-2-desk-chair',
      label: 'Bedroom 2 Study Desk Chair',
      x: bedX + 0.4,
      y: floorY + 0.45,
      z: bedZ + 1.4 + 0.5,
      heading: 0,
    });

    b2Group.position.set(bedX, floorY, bedZ);
    this.group.add(b2Group);

    this.colliders.push({
      id: 'collider-bedroom-2-bed',
      min: new THREE.Vector3(bedX - bedL * 0.5, floorY, bedZ - bedW * 0.5 - nsW),
      max: new THREE.Vector3(bedX + bedL * 0.5, floorY + 0.95, bedZ + bedW * 0.5 + nsW),
      type: 'furniture',
    });
  }

  /**
   * Helper to create a toggleable bedside lamp.
   */
  createBedsideLamp(lampKey, label) {
    const lampGroup = new THREE.Group();
    lampGroup.name = `lamp-${lampKey}`;

    // Brass stem & circular base
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

    // Warm fabric conical lampshade
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

    // Warm point light inside shade
    const pointLight = new THREE.PointLight(0xffecc4, 1.2, 3.5, 1.5);
    pointLight.position.set(0, 0.26, 0);
    pointLight.visible = Boolean(gameStore.getState().bedsideLamps[lampKey]);
    lampGroup.add(pointLight);

    // Bind to gameStore reactive state
    gameStore.subscribe((state) => {
      const isOn = Boolean(state.bedsideLamps[lampKey]);
      pointLight.visible = isOn;
      shadeMat.emissiveIntensity = isOn ? 0.75 : 0.0;
      shadeMat.needsUpdate = true;
    });

    // Make lamp interactable
    this.interactables.push({
      id: `lamp-switch-${lampKey}`,
      label,
      mesh: shade,
      x: 0, // updated when attached
      y: 0,
      z: 0,
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
