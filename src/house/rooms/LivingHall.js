import * as THREE from 'three';
import {
  getTimberTextures,
  getFabricTextures,
  getTvScreenTexture,
  getArtworkTexture,
  getStoneTileTextures,
  getRugTextures,
  getFoliageTexture,
  getSoilTexture,
} from '../../assets/procedural/TextureGenerator.js';
import {
  createChamferedBoxGeo,
  createPlushPillowGeo,
  createLatheGeo,
  createPottedPlant,
} from './RoomProps.js';
import { gameStore } from '../../state/gameStore.js';

/**
 * LivingHall: Furnishes the double-height Main Living Hall (PRD §9 & §10.1, Feature F20).
 *
 * Includes:
 * - Low modular sectional sofa (0.80m H, 0.42m seat H) with linen upholstery and accent cushions
 * - Sandalwood coffee table (1.30m L x 0.75m W, 0.40m H) with decorative tray and coasters
 * - Interactive TV remote (0.18m x 0.045m x 0.018m)
 * - 75-inch OLED 4K TV (1.68m W x 0.96m H) on feature wall with reactive screen canvas
 * - TV credenza console (2.40m W x 0.48m H x 0.42m D) with soundbar and ceramic flower vase
 * - Stone fireplace with sandalwood mantel, recessed firebox, and warm glowing embers
 * - Sandalwood library showcase / bookshelf (1.80m W x 2.10m H x 0.42m D) with rows of books
 * - Woven wool area rug (3.2m x 2.4m)
 * - Framed landscape wall art canvas with bronze frame
 */
export class LivingHallBuilder {
  constructor(options = {}) {
    this.options = options;
    this.group = new THREE.Group();
    this.group.name = 'furniture-living-hall';
    this.colliders = [];
    this.interactables = [];
    this.seats = [];
    this.materials = this.createMaterials();
  }

  createMaterials() {
    const oak = getTimberTextures('oak', 2, 2);
    const walnut = getTimberTextures('walnut', 2, 2);
    const sandalwood = getTimberTextures('sandalwood', 2, 2);
    const fabricLinen = getFabricTextures('#D2C4B4', 3, 3);
    const stone = getStoneTileTextures('foyer', 2, 2);
    const foliagePbr = getFoliageTexture(2, 2);

    return {
      sofaFabric: new THREE.MeshStandardMaterial({
        map: fabricLinen.map,
        bumpMap: fabricLinen.bumpMap,
        bumpScale: 0.04,
        roughness: 0.88,
        metalness: 0.02,
      }),
      cushionCream: new THREE.MeshStandardMaterial({
        color: 0xf0e5d2,
        roughness: 0.9,
      }),
      cushionOlive: new THREE.MeshStandardMaterial({
        color: 0x68735a,
        roughness: 0.9,
      }),
      cushionRust: new THREE.MeshStandardMaterial({
        color: 0xb8755f,
        roughness: 0.9,
      }),
      woodSandalwood: new THREE.MeshStandardMaterial({
        map: sandalwood.map,
        bumpMap: sandalwood.bumpMap,
        bumpScale: 0.03,
        roughness: 0.58,
        metalness: 0.04,
      }),
      woodWalnut: new THREE.MeshStandardMaterial({
        map: walnut.map,
        bumpMap: walnut.bumpMap,
        bumpScale: 0.03,
        roughness: 0.6,
        metalness: 0.04,
      }),
      woodOak: new THREE.MeshStandardMaterial({
        map: oak.map,
        bumpMap: oak.bumpMap,
        bumpScale: 0.03,
        roughness: 0.55,
      }),
      tableStone: new THREE.MeshStandardMaterial({
        map: stone.map,
        bumpMap: stone.bumpMap,
        bumpScale: 0.03,
        roughness: 0.45,
      }),
      brassMetal: new THREE.MeshStandardMaterial({
        color: 0xc8a265,
        roughness: 0.35,
        metalness: 0.85,
      }),
      darkMetal: new THREE.MeshStandardMaterial({
        color: 0x222224,
        roughness: 0.5,
        metalness: 0.8,
      }),
      ceramicWhite: new THREE.MeshStandardMaterial({
        color: 0xeee7db,
        roughness: 0.3,
        metalness: 0.05,
      }),
      showcaseGlass: new THREE.MeshPhysicalMaterial({
        color: 0xf4f7fa,
        transmission: 0.9,
        transparent: true,
        opacity: 1,
        roughness: 0.08,
        ior: 1.5,
      }),
      lampShade: new THREE.MeshStandardMaterial({
        color: 0xf9f1e2,
        emissive: 0xffd79e,
        emissiveIntensity: 0.65,
        roughness: 0.85,
        side: THREE.DoubleSide,
      }),
      foliage: new THREE.MeshStandardMaterial({
        map: foliagePbr.map,
        normalMap: foliagePbr.normalMap,
        roughnessMap: foliagePbr.roughnessMap,
        roughness: 0.62,
        metalness: 0.02,
      }),
      soil: new THREE.MeshStandardMaterial({
        map: getSoilTexture(),
        roughness: 0.95,
      }),
      stemBark: new THREE.MeshStandardMaterial({
        color: 0x5c422c,
        roughness: 0.88,
      }),
      fireBrick: new THREE.MeshStandardMaterial({
        color: 0x28231f,
        roughness: 0.95,
      }),
      hearthStone: new THREE.MeshStandardMaterial({
        color: 0x8a8275,
        roughness: 0.8,
      }),
    };
  }

  build() {
    const floorY = 0.3; // Ground floor level

    this.buildAreaRug(floorY);
    this.buildSofaSet(floorY);
    this.buildAccentChairAndLamp(floorY);
    this.buildCoffeeTable(floorY);
    this.buildTvAndConsole(floorY);
    this.buildFireplace(floorY);
    this.buildBookshelf(floorY);
    this.buildWallArt(floorY);

    this.group.userData = {
      zoneId: 'living-hall',
      colliders: this.colliders,
      interactables: this.interactables,
      seats: this.seats,
    };

    return this.group;
  }

  buildAreaRug(floorY) {
    const rugTex = getRugTextures('living', 1, 1);
    const rugGeo = new THREE.PlaneGeometry(3.6, 2.7);
    rugGeo.rotateX(-Math.PI / 2);
    const rugMat = new THREE.MeshStandardMaterial({
      map: rugTex.map,
      normalMap: rugTex.normalMap,
      normalScale: new THREE.Vector2(0.7, 0.7),
      roughnessMap: rugTex.roughnessMap,
      roughness: 0.94,
      metalness: 0.0,
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.position.set(-3.1, floorY + 0.004, 4.95);
    rug.receiveShadow = true;
    this.group.add(rug);
  }

  buildSofaSet(floorY) {
    const sofaGroup = new THREE.Group();
    sofaGroup.name = 'living-sofa-set';

    // 1. Main 3-seat sofa: 2.70m W x 0.95m D x 0.80m H, seat H = 0.42m
    const sofaBaseW = 2.7;
    const sofaBaseD = 0.95;
    const sofaSeatH = 0.42;
    const sofaTotalH = 0.8;

    // Tapered walnut plinth feet + beveled rail frame
    const baseMesh = new THREE.Mesh(
      createChamferedBoxGeo(sofaBaseW, 0.08, sofaBaseD, 0.03),
      this.materials.woodWalnut
    );
    baseMesh.position.set(0, 0.12, 0);
    baseMesh.castShadow = true;
    sofaGroup.add(baseMesh);

    const footGeo = new THREE.CylinderGeometry(0.028, 0.018, 0.085, 10);
    for (const fx of [-sofaBaseW * 0.5 + 0.12, 0, sofaBaseW * 0.5 - 0.12]) {
      for (const fz of [-sofaBaseD * 0.5 + 0.1, sofaBaseD * 0.5 - 0.1]) {
        const foot = new THREE.Mesh(footGeo, this.materials.woodWalnut);
        foot.position.set(fx, 0.042, fz);
        foot.castShadow = true;
        sofaGroup.add(foot);
      }
    }

    // 3 sculpted chamfered individual seat cushions (seat top strictly = 0.42m)
    const cushionSpan = sofaBaseW - 0.44;
    const seatSlotW = cushionSpan / 3 - 0.012;
    const seatGeo = createChamferedBoxGeo(seatSlotW, sofaSeatH - 0.16, sofaBaseD - 0.22, 0.045);
    for (let s = -1; s <= 1; s++) {
      const cm = new THREE.Mesh(seatGeo, this.materials.sofaFabric);
      cm.position.set(s * (cushionSpan / 3), 0.16 + (sofaSeatH - 0.16) * 0.5, -0.05);
      cm.castShadow = true;
      cm.receiveShadow = true;
      sofaGroup.add(cm);
    }

    // Backrest shell (0.80m top height) + 3 tufted back cushions
    const backH = sofaTotalH - 0.16;
    const backMesh = new THREE.Mesh(
      createChamferedBoxGeo(sofaBaseW, backH, 0.2, 0.04),
      this.materials.sofaFabric
    );
    backMesh.position.set(0, 0.16 + backH * 0.5, sofaBaseD * 0.5 - 0.1);
    backMesh.castShadow = true;
    sofaGroup.add(backMesh);

    const backCushGeo = createPlushPillowGeo(cushionSpan / 3 - 0.02, 0.36, 0.15);
    for (let s = -1; s <= 1; s++) {
      const bc = new THREE.Mesh(backCushGeo, this.materials.sofaFabric);
      bc.position.set(s * (cushionSpan / 3), sofaSeatH + 0.17, sofaBaseD * 0.5 - 0.21);
      bc.rotation.x = -0.14;
      bc.castShadow = true;
      sofaGroup.add(bc);
    }

    // Left and Right rounded bolster armrests
    const armGeo = createChamferedBoxGeo(0.21, 0.5, sofaBaseD, 0.045);
    const leftArm = new THREE.Mesh(armGeo, this.materials.sofaFabric);
    leftArm.position.set(-sofaBaseW * 0.5 + 0.105, 0.37, 0);
    leftArm.castShadow = true;
    sofaGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, this.materials.sofaFabric);
    rightArm.position.set(sofaBaseW * 0.5 - 0.105, 0.37, 0);
    rightArm.castShadow = true;
    sofaGroup.add(rightArm);

    // Draped olive throw blanket across right armrest
    const throwMesh = new THREE.Mesh(
      createChamferedBoxGeo(0.23, 0.32, 0.44, 0.03),
      this.materials.cushionOlive
    );
    throwMesh.position.set(sofaBaseW * 0.5 - 0.105, 0.49, -0.05);
    throwMesh.castShadow = true;
    sofaGroup.add(throwMesh);

    // 5 pinched plush accent pillows (cream, olive, terracotta-rust)
    const pillowGeo = createPlushPillowGeo(0.4, 0.36, 0.13);
    const pillowPositions = [
      { x: -0.96, c: this.materials.cushionCream, rotZ: 0.12, rotY: 0.25 },
      { x: -0.62, c: this.materials.cushionOlive, rotZ: -0.06, rotY: 0.08 },
      { x: 0.02, c: this.materials.cushionCream, rotZ: 0.02, rotY: 0.0 },
      { x: 0.62, c: this.materials.cushionRust, rotZ: 0.08, rotY: -0.08 },
      { x: 0.96, c: this.materials.cushionCream, rotZ: -0.14, rotY: -0.25 },
    ];
    for (const p of pillowPositions) {
      const pm = new THREE.Mesh(pillowGeo, p.c);
      pm.position.set(p.x, sofaSeatH + 0.15, sofaBaseD * 0.5 - 0.29);
      pm.rotation.x = -0.22;
      pm.rotation.y = p.rotY;
      pm.rotation.z = p.rotZ;
      pm.castShadow = true;
      sofaGroup.add(pm);
    }

    // Position entire sofa at (-3.0, floorY, 5.8) facing north toward TV
    sofaGroup.position.set(-3.0, floorY, 5.8);
    this.group.add(sofaGroup);

    // Register seating position
    this.seats.push({
      id: 'living-sofa',
      label: 'Living Room Sofa',
      x: -3.0,
      y: floorY + sofaSeatH,
      z: 5.0,
      heading: 0,
    });

    // Register collider box for sofa
    this.colliders.push({
      id: 'collider-living-sofa',
      min: new THREE.Vector3(-4.4, floorY, 5.3),
      max: new THREE.Vector3(-1.6, floorY + sofaTotalH, 6.3),
      type: 'furniture',
    });
  }

  buildAccentChairAndLamp(floorY) {
    const nook = new THREE.Group();
    nook.name = 'living-accent-chair-nook';

    // Sculpted accent lounge chair angled toward coffee table & fireplace
    const chair = new THREE.Group();
    chair.name = 'living-accent-chair';
    const baseFrame = new THREE.Mesh(
      createChamferedBoxGeo(0.76, 0.06, 0.78, 0.025),
      this.materials.woodWalnut
    );
    baseFrame.position.y = 0.24;
    chair.add(baseFrame);

    const legGeo = new THREE.CylinderGeometry(0.022, 0.014, 0.23, 8);
    for (const lx of [-0.3, 0.3]) {
      for (const lz of [-0.31, 0.31]) {
        const leg = new THREE.Mesh(legGeo, this.materials.woodWalnut);
        leg.position.set(lx, 0.115, lz);
        leg.castShadow = true;
        chair.add(leg);
      }
    }

    const seatCush = new THREE.Mesh(
      createChamferedBoxGeo(0.68, 0.16, 0.7, 0.04),
      this.materials.cushionOlive
    );
    seatCush.position.y = 0.35;
    seatCush.castShadow = true;
    chair.add(seatCush);

    const backCush = new THREE.Mesh(
      createChamferedBoxGeo(0.68, 0.44, 0.15, 0.04),
      this.materials.cushionOlive
    );
    backCush.position.set(0, 0.62, -0.28);
    backCush.rotation.x = -0.18;
    backCush.castShadow = true;
    chair.add(backCush);

    for (const ax of [-0.36, 0.36]) {
      const arm = new THREE.Mesh(
        createChamferedBoxGeo(0.08, 0.32, 0.72, 0.02),
        this.materials.woodWalnut
      );
      arm.position.set(ax, 0.42, 0);
      arm.castShadow = true;
      chair.add(arm);
    }

    const lumPillow = new THREE.Mesh(
      createPlushPillowGeo(0.42, 0.26, 0.11),
      this.materials.cushionCream
    );
    lumPillow.position.set(0, 0.5, -0.16);
    lumPillow.rotation.x = -0.22;
    chair.add(lumPillow);

    const cx = -4.98;
    const cz = 4.45;
    chair.position.set(cx, floorY, cz);
    chair.rotation.y = Math.PI * 0.68;
    nook.add(chair);

    this.seats.push({
      id: 'living-accent-chair',
      label: 'Living Hall Accent Chair',
      x: cx,
      y: floorY + 0.43,
      z: cz,
      heading: -Math.PI * 0.32,
    });

    this.colliders.push({
      id: 'collider-living-accent-chair',
      min: new THREE.Vector3(cx - 0.42, floorY, cz - 0.42),
      max: new THREE.Vector3(cx + 0.42, floorY + 0.85, cz + 0.42),
      type: 'furniture',
    });

    // Tall linen-shaded brass floor lamp behind left side of sofa
    const lamp = new THREE.Group();
    lamp.name = 'living-floor-lamp';
    const lBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.03, 18), this.materials.brassMetal);
    lBase.position.y = 0.015;
    lamp.add(lBase);
    const lStem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 1.56, 10), this.materials.brassMetal);
    lStem.position.y = 0.79;
    lStem.castShadow = true;
    lamp.add(lStem);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.24, 0.3, 18, 1, true), this.materials.lampShade);
    shade.position.y = 1.6;
    lamp.add(shade);
    const lampLight = new THREE.PointLight(0xffdfb0, 0.85, 6.0, 1.6);
    lampLight.position.set(0, 1.58, 0);
    lamp.add(lampLight);
    lamp.position.set(-5.35, floorY, 6.45);
    nook.add(lamp);

    // Sculpted potted Fiddle-leaf Fig plant in South-West living corner
    const plant = createPottedPlant({
      potMat: this.materials.ceramicWhite,
      leafMat: this.materials.foliage,
      stemMat: this.materials.stemBark,
      soilMat: this.materials.soil,
      potRadius: 0.22,
      potHeight: 0.38,
      leafCount: 14,
      scale: 1.35,
    });
    plant.name = 'potted-plant-living';
    plant.position.set(-5.65, floorY, 7.85);
    nook.add(plant);

    this.group.add(nook);
  }

  buildCoffeeTable(floorY) {
    const tableGroup = new THREE.Group();
    tableGroup.name = 'living-coffee-table';

    // Spec: 1.30m L x 0.75m W, 0.40m H
    const tableL = 1.3;
    const tableW = 0.75;
    const tableH = 0.4;
    const topThickness = 0.04;

    // Beveled stone tabletop in honed limestone
    const topGeo = createChamferedBoxGeo(tableL, topThickness, tableW, 0.05);
    const topMesh = new THREE.Mesh(topGeo, this.materials.tableStone);
    topMesh.position.set(0, tableH - topThickness * 0.5, 0);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    tableGroup.add(topMesh);

    // Solid sandalwood apron frame & tapered brass-capped legs
    const legGeo = new THREE.CylinderGeometry(0.032, 0.02, tableH - topThickness, 12);
    const capGeo = new THREE.CylinderGeometry(0.021, 0.019, 0.04, 12);
    const legOffsets = [
      [-tableL * 0.5 + 0.09, -tableW * 0.5 + 0.09],
      [tableL * 0.5 - 0.09, -tableW * 0.5 + 0.09],
      [-tableL * 0.5 + 0.09, tableW * 0.5 - 0.09],
      [tableL * 0.5 - 0.09, tableW * 0.5 - 0.09],
    ];
    for (const [lx, lz] of legOffsets) {
      const legMesh = new THREE.Mesh(legGeo, this.materials.woodSandalwood);
      legMesh.position.set(lx, (tableH - topThickness) * 0.5, lz);
      legMesh.castShadow = true;
      tableGroup.add(legMesh);

      const cap = new THREE.Mesh(capGeo, this.materials.brassMetal);
      cap.position.set(lx, 0.02, lz);
      tableGroup.add(cap);
    }

    // Lower storage shelf
    const shelfGeo = createChamferedBoxGeo(tableL - 0.2, 0.022, tableW - 0.2, 0.03);
    const shelfMesh = new THREE.Mesh(shelfGeo, this.materials.woodSandalwood);
    shelfMesh.position.set(0, 0.12, 0);
    shelfMesh.castShadow = true;
    tableGroup.add(shelfMesh);

    // Decorative elements on table:
    // 1. Chamfered walnut serving tray with two ceramic coasters & stoneware espresso cups
    const trayMesh = new THREE.Mesh(
      createChamferedBoxGeo(0.38, 0.02, 0.26, 0.025),
      this.materials.woodWalnut
    );
    trayMesh.position.set(-0.25, tableH + 0.01, 0.05);
    trayMesh.castShadow = true;
    tableGroup.add(trayMesh);

    for (const [cx, cz] of [[0.08, -0.05], [0.09, 0.07]]) {
      const coaster = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.006, 14), this.materials.brassMetal);
      coaster.position.set(-0.25 + cx, tableH + 0.023, 0.05 + cz);
      tableGroup.add(coaster);

      const cup = new THREE.Mesh(
        createLatheGeo([[0.022, 0], [0.032, 0.025], [0.034, 0.06], [0.029, 0.06], [0.024, 0.015]], 12),
        this.materials.ceramicWhite
      );
      cup.position.set(-0.25 + cx, tableH + 0.026, 0.05 + cz);
      tableGroup.add(cup);
    }

    // 2. Stack of 2 architectural design hardcover books + small brass object
    const book1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.028, 0.19), this.materials.cushionRust);
    book1.position.set(0.26, tableH + 0.014, -0.06);
    book1.rotation.y = 0.15;
    book1.castShadow = true;
    tableGroup.add(book1);

    const book2 = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.024, 0.16), this.materials.cushionCream);
    book2.position.set(0.27, tableH + 0.04, -0.05);
    book2.rotation.y = 0.24;
    book2.castShadow = true;
    tableGroup.add(book2);

    // 3. Sculpted Lathe bud vase on table corner
    const miniVase = new THREE.Mesh(
      createLatheGeo([[0.025, 0], [0.048, 0.05], [0.042, 0.11], [0.02, 0.14], [0.024, 0.16]], 14),
      this.materials.ceramicWhite
    );
    miniVase.position.set(0.45, tableH, 0.16);
    miniVase.castShadow = true;
    tableGroup.add(miniVase);

    // 3. TV Remote: 0.18m L x 0.045m W x 0.018m H per PRD §9.5
    const remoteGroup = new THREE.Group();
    remoteGroup.name = 'tv-remote';
    const remoteBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.018, 0.18),
      this.materials.darkMetal
    );
    remoteBody.position.set(0, 0.009, 0);
    remoteBody.castShadow = true;
    remoteGroup.add(remoteBody);

    // Red power button on top of remote
    const powerBtn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.004, 8),
      new THREE.MeshBasicMaterial({ color: 0xdf2222 })
    );
    powerBtn.position.set(0, 0.019, -0.065);
    remoteGroup.add(powerBtn);

    remoteGroup.position.set(-0.25, tableH + 0.02, 0.05);
    remoteGroup.rotation.y = -0.2;
    tableGroup.add(remoteGroup);

    // Register remote interactable
    const remoteInteractable = {
      id: 'living-tv-remote',
      label: 'TV Remote Control',
      mesh: remoteGroup,
      x: -3.0 - 0.25,
      y: floorY + tableH + 0.05,
      z: 4.8 + 0.05,
      range: 2.2,
      prompt: 'Toggle TV Power',
      onInteract: () => {
        const current = gameStore.getState().tvOn;
        gameStore.setState({ tvOn: !current });
      },
    };
    this.interactables.push(remoteInteractable);

    // Position table between sofa and TV
    tableGroup.position.set(-3.0, floorY, 4.8);
    this.group.add(tableGroup);

    this.colliders.push({
      id: 'collider-living-coffee-table',
      min: new THREE.Vector3(-3.0 - tableL * 0.5, floorY, 4.8 - tableW * 0.5),
      max: new THREE.Vector3(-3.0 + tableL * 0.5, floorY + tableH, 4.8 + tableW * 0.5),
      type: 'furniture',
    });
  }

  buildTvAndConsole(floorY) {
    const consoleGroup = new THREE.Group();
    consoleGroup.name = 'living-tv-and-console';

    // 1. TV Console Credenza: 2.40m W x 0.48m H x 0.42m D
    const conW = 2.4;
    const conH = 0.48;
    const conD = 0.42;

    const conBody = new THREE.Mesh(
      createChamferedBoxGeo(conW, conH - 0.06, conD, 0.025),
      this.materials.woodSandalwood
    );
    conBody.position.set(0, 0.06 + (conH - 0.06) * 0.5, 0);
    conBody.castShadow = true;
    conBody.receiveShadow = true;
    consoleGroup.add(conBody);

    for (const lx of [-conW * 0.5 + 0.12, -0.4, 0.4, conW * 0.5 - 0.12]) {
      for (const lz of [-conD * 0.5 + 0.06, conD * 0.5 - 0.06]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.013, 0.065, 8), this.materials.darkMetal);
        leg.position.set(lx, 0.032, lz);
        consoleGroup.add(leg);
      }
    }

    // Slatted console drawer faces & brushed brass hardware pulls
    for (const px of [-0.78, 0.0, 0.78]) {
      const doorRecess = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, conH - 0.14, 0.014),
        this.materials.woodWalnut
      );
      doorRecess.position.set(px, 0.06 + (conH - 0.06) * 0.5, conD * 0.5 + 0.002);
      consoleGroup.add(doorRecess);
    }
    const pullGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8);
    pullGeo.rotateZ(Math.PI / 2);
    for (const px of [-0.78, 0.0, 0.78]) {
      const pull = new THREE.Mesh(pullGeo, this.materials.brassMetal);
      pull.position.set(px, conH * 0.65, conD * 0.5 + 0.018);
      consoleGroup.add(pull);
    }

    // Soundbar placed on top of console: 1.10m W x 0.06m H x 0.10m D
    const sbar = new THREE.Mesh(
      createChamferedBoxGeo(1.1, 0.06, 0.1, 0.015),
      this.materials.darkMetal
    );
    sbar.position.set(0, conH + 0.03, 0.04);
    sbar.castShadow = true;
    consoleGroup.add(sbar);

    const statusLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.006, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x70e490 })
    );
    statusLed.position.set(0.48, conH + 0.03, 0.092);
    consoleGroup.add(statusLed);

    // Sculpted Lathe ceramic flower vase with decorative botanical stems
    const vaseGroup = new THREE.Group();
    const vaseMesh = new THREE.Mesh(
      createLatheGeo([[0.048, 0], [0.088, 0.09], [0.072, 0.21], [0.038, 0.27], [0.046, 0.29]], 16),
      this.materials.ceramicWhite
    );
    vaseMesh.castShadow = true;
    vaseGroup.add(vaseMesh);

    const stemMat = new THREE.MeshStandardMaterial({ color: 0x47633e, roughness: 0.8 });
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xe6b85c, roughness: 0.7 });
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.004, 0.24, 6), stemMat);
      stem.position.set(Math.cos(ang) * 0.03, 0.34, Math.sin(ang) * 0.03);
      stem.rotation.z = Math.cos(ang) * 0.28;
      stem.rotation.x = Math.sin(ang) * 0.28;
      vaseGroup.add(stem);

      const bloom = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.006, 0.026, 7), flowerMat);
      bloom.position.set(Math.cos(ang) * 0.068, 0.45 + (i % 2) * 0.02, Math.sin(ang) * 0.068);
      bloom.rotation.z = Math.cos(ang) * 0.25;
      vaseGroup.add(bloom);
    }

    vaseGroup.position.set(conW * 0.5 - 0.28, conH, 0);
    consoleGroup.add(vaseGroup);

    // 2. 75-inch OLED Canvas TV: 1.68m W x 0.96m H per PRD §9.4 & Feature F20
    const tvW = 1.68;
    const tvH = 0.96;
    const tvFrameThick = 0.03;

    // Dark graphite chassis
    const tvFrame = new THREE.Mesh(
      new THREE.BoxGeometry(tvW + 0.03, tvH + 0.03, tvFrameThick),
      this.materials.darkMetal
    );
    tvFrame.position.set(0, 1.45, 0.02);
    tvFrame.castShadow = true;
    consoleGroup.add(tvFrame);

    // OLED Screen surface with procedural 16:9 4K canvas texture
    let tvScreenTex;
    try {
      tvScreenTex = getTvScreenTexture();
    } catch {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1D323A';
        ctx.fillRect(0, 0, 640, 360);
      }
      tvScreenTex = new THREE.CanvasTexture(canvas);
      tvScreenTex.colorSpace = THREE.SRGBColorSpace;
    }
    const screenGeo = new THREE.PlaneGeometry(tvW, tvH);
    const tvScreenMat = new THREE.MeshStandardMaterial({
      map: tvScreenTex,
      roughness: 0.15,
      metalness: 0.05,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: tvScreenTex,
      emissiveIntensity: gameStore.getState().tvOn ? 0.45 : 0.0,
    });
    const tvScreenMesh = new THREE.Mesh(screenGeo, tvScreenMat);
    tvScreenMesh.position.set(0, 1.45, 0.02 + tvFrameThick * 0.5 + 0.002);
    consoleGroup.add(tvScreenMesh);

    // Update screen emissive state on gameStore change
    gameStore.subscribe((state) => {
      if (tvScreenMat) {
        tvScreenMat.emissiveIntensity = state.tvOn ? 0.45 : 0.0;
        tvScreenMat.needsUpdate = true;
      }
    });

    // Make TV screen interactive
    this.interactables.push({
      id: 'living-oled-tv',
      label: '75-inch 4K OLED TV',
      mesh: tvScreenMesh,
      x: -3.0,
      y: floorY + 1.45,
      z: 3.15,
      range: 3.0,
      prompt: 'Toggle TV Power',
      onInteract: () => {
        const cur = gameStore.getState().tvOn;
        gameStore.setState({ tvOn: !cur });
      },
    });

    // Position console flush against north slat media wall (Z = 3.12)
    consoleGroup.position.set(-3.0, floorY, 3.12);
    this.group.add(consoleGroup);

    this.colliders.push({
      id: 'collider-living-tv-console',
      min: new THREE.Vector3(-3.0 - conW * 0.5, floorY, 3.12 - conD * 0.5),
      max: new THREE.Vector3(-3.0 + conW * 0.5, floorY + conH, 3.12 + conD * 0.5),
      type: 'furniture',
    });
  }

  buildFireplace(floorY) {
    const fireGroup = new THREE.Group();
    fireGroup.name = 'living-stone-fireplace';

    // Fireplace dimensions: 1.80m W x 1.40m H x 0.45m D
    const fpW = 1.8;
    const fpH = 1.4;
    const fpD = 0.45;

    // Stone hearth plinth on floor
    const hearthGeo = new THREE.BoxGeometry(fpW + 0.3, 0.08, fpD + 0.3);
    const hearthMesh = new THREE.Mesh(hearthGeo, this.materials.hearthStone);
    hearthMesh.position.set(0, 0.04, 0);
    hearthMesh.castShadow = true;
    hearthMesh.receiveShadow = true;
    fireGroup.add(hearthMesh);

    // Main carved stone surround
    const surroundGeo = new THREE.BoxGeometry(fpW, fpH, fpD);
    const surroundMesh = new THREE.Mesh(surroundGeo, this.materials.hearthStone);
    surroundMesh.position.set(0, fpH * 0.5 + 0.08, 0);
    surroundMesh.castShadow = true;
    fireGroup.add(surroundMesh);

    // Recessed dark firebox cavity: 0.90m W x 0.70m H x 0.32m D
    const fireboxGeo = new THREE.BoxGeometry(0.9, 0.7, 0.32);
    const fireboxMesh = new THREE.Mesh(fireboxGeo, this.materials.fireBrick);
    fireboxMesh.position.set(0, 0.08 + 0.35 + 0.1, 0.08);
    fireGroup.add(fireboxMesh);

    // Glowing timber embers and logs
    const logMat = new THREE.MeshStandardMaterial({
      color: 0x3d2716,
      roughness: 0.9,
    });
    const emberMat = new THREE.MeshStandardMaterial({
      color: 0xeb5e1e,
      emissive: 0xff4800,
      emissiveIntensity: 0.85,
      roughness: 0.7,
    });

    const emberBed = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.06, 0.22), emberMat);
    emberBed.position.set(0, 0.18, 0.08);
    fireGroup.add(emberBed);

    const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.55, 8), logMat);
    log1.rotation.z = Math.PI / 2;
    log1.position.set(0, 0.24, 0.08);
    fireGroup.add(log1);

    const log2 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.45, 8), logMat);
    log2.rotation.z = Math.PI / 2 - 0.2;
    log2.position.set(0.05, 0.29, 0.05);
    fireGroup.add(log2);

    // Sandalwood mantel shelf on top
    const mantelGeo = new THREE.BoxGeometry(fpW + 0.2, 0.08, fpD + 0.12);
    const mantelMesh = new THREE.Mesh(mantelGeo, this.materials.woodSandalwood);
    mantelMesh.position.set(0, fpH + 0.08 + 0.04, 0.02);
    mantelMesh.castShadow = true;
    fireGroup.add(mantelMesh);

    // Place fireplace along east boundary partition near living hall center
    fireGroup.position.set(-0.25, floorY, 5.2);
    fireGroup.rotation.y = -Math.PI / 2; // facing west toward sofa
    this.group.add(fireGroup);

    this.colliders.push({
      id: 'collider-living-fireplace',
      min: new THREE.Vector3(-0.55, floorY, 5.2 - fpW * 0.5),
      max: new THREE.Vector3(0.05, floorY + fpH, 5.2 + fpW * 0.5),
      type: 'furniture',
    });
  }

  buildBookshelf(floorY) {
    const shelfGroup = new THREE.Group();
    shelfGroup.name = 'living-bookshelf';

    // Open architectural showcase bookcase: 1.80m W x 2.10m H x 0.42m D
    const sW = 1.8;
    const sH = 2.1;
    const sD = 0.42;

    // Back panel + side stiles + top cap + base plinth (open front carcass!)
    const backPanel = new THREE.Mesh(new THREE.BoxGeometry(sW, sH, 0.03), this.materials.woodWalnut);
    backPanel.position.set(0, sH * 0.5, -sD * 0.5 + 0.015);
    backPanel.castShadow = true;
    shelfGroup.add(backPanel);

    for (const sx of [-sW * 0.5 + 0.025, 0, sW * 0.5 - 0.025]) {
      const stile = new THREE.Mesh(new THREE.BoxGeometry(0.045, sH, sD), this.materials.woodWalnut);
      stile.position.set(sx, sH * 0.5, 0);
      stile.castShadow = true;
      shelfGroup.add(stile);
    }

    const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(sW, 0.08, sD), this.materials.woodWalnut);
    basePlinth.position.set(0, 0.04, 0);
    shelfGroup.add(basePlinth);

    const topCap = new THREE.Mesh(new THREE.BoxGeometry(sW + 0.04, 0.04, sD + 0.02), this.materials.woodWalnut);
    topCap.position.set(0, sH - 0.02, 0.01);
    topCap.castShadow = true;
    shelfGroup.add(topCap);

    // 4 Open interior shelves + glass showcase panes & curated decor + rows of books
    const bookColors = [0x78281f, 0x1f465a, 0x2b4e33, 0x5e452e, 0x856637];
    const shelfYLevels = [0.35, 0.8, 1.25, 1.7];

    for (let si = 0; si < shelfYLevels.length; si++) {
      const sy = shelfYLevels[si];
      const plank = new THREE.Mesh(new THREE.BoxGeometry(sW - 0.06, 0.028, sD - 0.03), this.materials.woodSandalwood);
      plank.position.set(0, sy - 0.014, 0.01);
      plank.castShadow = true;
      shelfGroup.add(plank);

      let curX = -sW * 0.5 + 0.08;
      for (let b = 0; b < 9; b++) {
        if (si >= 2 && b === 4) {
          curX += 0.14; // Leave central bay niche for decorative ceramic vessel
          const vessel = new THREE.Mesh(
            createLatheGeo([[0.035, 0], [0.06, 0.08], [0.042, 0.16], [0.028, 0.2]], 12),
            this.materials.ceramicWhite
          );
          vessel.position.set(curX - 0.05, sy, 0.02);
          shelfGroup.add(vessel);
          continue;
        }
        const bw = 0.035 + (b % 3) * 0.011;
        const bh = 0.21 + (b % 4) * 0.024;
        const bd = 0.24;
        const bMat = new THREE.MeshStandardMaterial({
          color: bookColors[(b + si) % bookColors.length],
          roughness: 0.78,
        });
        const bookMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), bMat);
        bookMesh.position.set(curX + bw * 0.5, sy + bh * 0.5, 0.02);
        bookMesh.castShadow = true;
        shelfGroup.add(bookMesh);
        curX += bw + 0.008;
        if (Math.abs(curX) < 0.08) curX = 0.09;
      }
    }

    // Translucent glass showcase doors on upper two bays
    for (const gx of [-sW * 0.25, sW * 0.25]) {
      const gPane = new THREE.Mesh(new THREE.BoxGeometry(sW * 0.46, 0.86, 0.012), this.materials.showcaseGlass);
      gPane.position.set(gx, 1.65, sD * 0.5 - 0.01);
      shelfGroup.add(gPane);

      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 8), this.materials.brassMetal);
      handle.position.set(gx + (gx < 0 ? 0.16 : -0.16), 1.58, sD * 0.5 + 0.012);
      shelfGroup.add(handle);
    }

    // Position bookshelf along western boundary of living hall
    shelfGroup.position.set(-6.2, floorY, 5.0);
    shelfGroup.rotation.y = Math.PI / 2; // facing east
    this.group.add(shelfGroup);

    this.colliders.push({
      id: 'collider-living-bookshelf',
      min: new THREE.Vector3(-6.45, floorY, 5.0 - sW * 0.5),
      max: new THREE.Vector3(-5.95, floorY + sH, 5.0 + sW * 0.5),
      type: 'furniture',
    });
  }

  buildWallArt(floorY) {
    // Framed landscape canvas mounted cleanly above fireplace mantel (clear of OLED TV!)
    const artGroup = new THREE.Group();
    artGroup.name = 'living-wall-art';

    let artTex;
    try {
      artTex = getArtworkTexture('landscape');
    } catch {
      const canvas = document.createElement('canvas');
      canvas.width = 384;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#5F7762';
        ctx.fillRect(0, 0, 384, 512);
      }
      artTex = new THREE.CanvasTexture(canvas);
      artTex.colorSpace = THREE.SRGBColorSpace;
    }
    const artGeo = new THREE.PlaneGeometry(1.36, 0.96);
    const artMat = new THREE.MeshStandardMaterial({
      map: artTex,
      roughness: 0.7,
      metalness: 0.0,
    });
    const artMesh = new THREE.Mesh(artGeo, artMat);
    artMesh.position.set(0, 0, 0.022);
    artGroup.add(artMesh);

    // Warm bronze frame & recessed off-white matboard
    const matBoard = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.02, 0.025), this.materials.cushionCream);
    matBoard.position.set(0, 0, 0.008);
    artGroup.add(matBoard);

    const frameGeo = new THREE.BoxGeometry(1.5, 1.1, 0.032);
    const frameMesh = new THREE.Mesh(frameGeo, this.materials.brassMetal);
    frameMesh.position.set(0, 0, 0);
    artGroup.add(frameMesh);

    artGroup.position.set(-0.22, floorY + 2.28, 5.2);
    artGroup.rotation.y = -Math.PI / 2;
    this.group.add(artGroup);
  }
}

export function buildLivingHall(options = {}) {
  const builder = new LivingHallBuilder(options);
  return builder.build();
}
