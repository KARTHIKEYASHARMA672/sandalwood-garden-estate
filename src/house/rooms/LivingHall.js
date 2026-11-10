import * as THREE from 'three';
import {
  getTimberTextures,
  getFabricTextures,
  getTvScreenTexture,
  getArtworkTexture,
  getStoneTileTextures,
} from '../../assets/procedural/TextureGenerator.js';
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
    const rugTex = getFabricTextures('#D9CEBF', 4, 3);
    const rugGeo = new THREE.PlaneGeometry(3.4, 2.6);
    rugGeo.rotateX(-Math.PI / 2);
    const rugMat = new THREE.MeshStandardMaterial({
      map: rugTex.map,
      bumpMap: rugTex.bumpMap,
      bumpScale: 0.05,
      roughness: 0.95,
      metalness: 0.0,
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.position.set(-3.0, floorY + 0.003, 5.0);
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

    // Plinth base frame
    const baseGeo = new THREE.BoxGeometry(sofaBaseW, 0.12, sofaBaseD);
    const baseMesh = new THREE.Mesh(baseGeo, this.materials.woodWalnut);
    baseMesh.position.set(0, 0.06, 0);
    baseMesh.castShadow = true;
    sofaGroup.add(baseMesh);

    // Main seat cushion block
    const cushionGeo = new THREE.BoxGeometry(sofaBaseW - 0.06, sofaSeatH - 0.12, sofaBaseD - 0.06);
    const cushionMesh = new THREE.Mesh(cushionGeo, this.materials.sofaFabric);
    cushionMesh.position.set(0, 0.12 + (sofaSeatH - 0.12) * 0.5, 0.02);
    cushionMesh.castShadow = true;
    cushionMesh.receiveShadow = true;
    sofaGroup.add(cushionMesh);

    // Backrest (0.80m top height)
    const backH = sofaTotalH - sofaSeatH;
    const backGeo = new THREE.BoxGeometry(sofaBaseW, backH, 0.22);
    const backMesh = new THREE.Mesh(backGeo, this.materials.sofaFabric);
    backMesh.position.set(0, sofaSeatH + backH * 0.5, sofaBaseD * 0.5 - 0.11);
    backMesh.castShadow = true;
    sofaGroup.add(backMesh);

    // Left and Right armrests
    const armGeo = new THREE.BoxGeometry(0.2, 0.62, sofaBaseD);
    const leftArm = new THREE.Mesh(armGeo, this.materials.sofaFabric);
    leftArm.position.set(-sofaBaseW * 0.5 + 0.1, 0.31, 0);
    leftArm.castShadow = true;
    sofaGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, this.materials.sofaFabric);
    rightArm.position.set(sofaBaseW * 0.5 - 0.1, 0.31, 0);
    rightArm.castShadow = true;
    sofaGroup.add(rightArm);

    // Decorative throw pillows (5 items: cream, olive, rust)
    const pillowGeo = new THREE.BoxGeometry(0.42, 0.38, 0.14);
    const pillowPositions = [
      { x: -0.85, c: this.materials.cushionCream, rotZ: 0.05 },
      { x: -0.45, c: this.materials.cushionOlive, rotZ: -0.06 },
      { x: 0.0, c: this.materials.cushionCream, rotZ: 0.02 },
      { x: 0.45, c: this.materials.cushionRust, rotZ: 0.08 },
      { x: 0.85, c: this.materials.cushionCream, rotZ: -0.04 },
    ];
    for (const p of pillowPositions) {
      const pm = new THREE.Mesh(pillowGeo, p.c);
      pm.position.set(p.x, sofaSeatH + 0.18, sofaBaseD * 0.5 - 0.24);
      pm.rotation.x = -0.18;
      pm.rotation.z = p.rotZ;
      pm.castShadow = true;
      sofaGroup.add(pm);
    }

    // Position entire sofa at (-3.0, floorY, 5.8) facing north toward TV
    sofaGroup.position.set(-3.0, floorY, 5.8);
    this.group.add(sofaGroup);

    // Register seating position
    const sofaSeat = {
      id: 'living-sofa',
      label: 'Living Room Sofa',
      x: -3.0,
      y: floorY + sofaSeatH,
      z: 5.0,
      heading: 0,
    };
    this.seats.push(sofaSeat);

    // Register collider box for sofa
    this.colliders.push({
      id: 'collider-living-sofa',
      min: new THREE.Vector3(-4.4, floorY, 5.3),
      max: new THREE.Vector3(-1.6, floorY + sofaTotalH, 6.3),
      type: 'furniture',
    });
  }

  buildCoffeeTable(floorY) {
    const tableGroup = new THREE.Group();
    tableGroup.name = 'living-coffee-table';

    // Spec: 1.30m L x 0.75m W, 0.40m H
    const tableL = 1.3;
    const tableW = 0.75;
    const tableH = 0.4;
    const topThickness = 0.04;

    // Tabletop in polished stone / light marble
    const topGeo = new THREE.BoxGeometry(tableL, topThickness, tableW);
    const topMesh = new THREE.Mesh(topGeo, this.materials.tableStone);
    topMesh.position.set(0, tableH - topThickness * 0.5, 0);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    tableGroup.add(topMesh);

    // Timber frame and solid sandalwood legs
    const legGeo = new THREE.CylinderGeometry(0.035, 0.025, tableH - topThickness, 12);
    const legOffsets = [
      [-tableL * 0.5 + 0.08, -tableW * 0.5 + 0.08],
      [tableL * 0.5 - 0.08, -tableW * 0.5 + 0.08],
      [-tableL * 0.5 + 0.08, tableW * 0.5 - 0.08],
      [tableL * 0.5 - 0.08, tableW * 0.5 - 0.08],
    ];
    for (const [lx, lz] of legOffsets) {
      const legMesh = new THREE.Mesh(legGeo, this.materials.woodSandalwood);
      legMesh.position.set(lx, (tableH - topThickness) * 0.5, lz);
      legMesh.castShadow = true;
      tableGroup.add(legMesh);
    }

    // Lower storage shelf
    const shelfGeo = new THREE.BoxGeometry(tableL - 0.16, 0.02, tableW - 0.16);
    const shelfMesh = new THREE.Mesh(shelfGeo, this.materials.woodSandalwood);
    shelfMesh.position.set(0, 0.12, 0);
    shelfMesh.castShadow = true;
    tableGroup.add(shelfMesh);

    // Decorative elements on table:
    // 1. Walnut serving tray with two coasters
    const trayGeo = new THREE.BoxGeometry(0.35, 0.02, 0.25);
    const trayMesh = new THREE.Mesh(trayGeo, this.materials.woodWalnut);
    trayMesh.position.set(-0.25, tableH + 0.01, 0.05);
    trayMesh.castShadow = true;
    tableGroup.add(trayMesh);

    // 2. Stack of architectural design books
    const bookGeo = new THREE.BoxGeometry(0.24, 0.045, 0.18);
    const bookMesh = new THREE.Mesh(bookGeo, this.materials.cushionRust);
    bookMesh.position.set(0.25, tableH + 0.0225, -0.05);
    bookMesh.rotation.y = 0.15;
    bookMesh.castShadow = true;
    tableGroup.add(bookMesh);

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
      new THREE.BoxGeometry(conW, conH, conD),
      this.materials.woodSandalwood
    );
    conBody.position.set(0, conH * 0.5, 0);
    conBody.castShadow = true;
    conBody.receiveShadow = true;
    consoleGroup.add(conBody);

    // Brushed brass cabinet pulls
    const pullGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8);
    pullGeo.rotateZ(Math.PI / 2);
    for (const px of [-0.6, 0.0, 0.6]) {
      const pull = new THREE.Mesh(pullGeo, this.materials.brassMetal);
      pull.position.set(px, conH * 0.65, conD * 0.5 + 0.015);
      consoleGroup.add(pull);
    }

    // Soundbar placed on top of console: 1.10m W x 0.06m H x 0.10m D
    const sbar = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.06, 0.1),
      this.materials.darkMetal
    );
    sbar.position.set(0, conH + 0.03, 0.05);
    sbar.castShadow = true;
    consoleGroup.add(sbar);

    // Ceramic flower vase with decorative stems per PRD §9.6
    const vaseGroup = new THREE.Group();
    const vaseMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 0.28, 16),
      this.materials.ceramicWhite
    );
    vaseMesh.position.set(0, 0.14, 0);
    vaseMesh.castShadow = true;
    vaseGroup.add(vaseMesh);

    // Stems & floral heads inside vase
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x47633e, roughness: 0.8 });
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xe6b85c, roughness: 0.7 });
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.22, 6), stemMat);
      stem.position.set(Math.cos(ang) * 0.03, 0.28 + 0.08, Math.sin(ang) * 0.03);
      stem.rotation.z = Math.cos(ang) * 0.25;
      stem.rotation.x = Math.sin(ang) * 0.25;
      vaseGroup.add(stem);

      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), flowerMat);
      petal.position.set(Math.cos(ang) * 0.06, 0.44, Math.sin(ang) * 0.06);
      vaseGroup.add(petal);
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

    // Position console at north wall of living hall facing south (Z = 3.10)
    consoleGroup.position.set(-3.0, floorY, 3.15);
    this.group.add(consoleGroup);

    this.colliders.push({
      id: 'collider-living-tv-console',
      min: new THREE.Vector3(-3.0 - conW * 0.5, floorY, 3.15 - conD * 0.5),
      max: new THREE.Vector3(-3.0 + conW * 0.5, floorY + conH, 3.15 + conD * 0.5),
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

    // Spec per PRD §9.7: 1.80m W x 2.10m H x 0.42m D
    const sW = 1.8;
    const sH = 2.1;
    const sD = 0.42;

    // Outer timber carcass
    const carcassGeo = new THREE.BoxGeometry(sW, sH, sD);
    const carcassMesh = new THREE.Mesh(carcassGeo, this.materials.woodWalnut);
    carcassMesh.position.set(0, sH * 0.5, 0);
    carcassMesh.castShadow = true;
    shelfGroup.add(carcassMesh);

    // 4 Open interior shelves with books
    const bookColors = [0x78281f, 0x1f465a, 0x2b4e33, 0x5e452e, 0x856637];
    const shelfYLevels = [0.35, 0.8, 1.25, 1.7];

    for (const sy of shelfYLevels) {
      // Books rows on each shelf
      let curX = -sW * 0.5 + 0.18;
      for (let b = 0; b < 10; b++) {
        const bw = 0.035 + (b % 3) * 0.012;
        const bh = 0.22 + (b % 4) * 0.025;
        const bd = 0.24;
        const bMat = new THREE.MeshStandardMaterial({
          color: bookColors[b % bookColors.length],
          roughness: 0.8,
        });
        const bookMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), bMat);
        bookMesh.position.set(curX + bw * 0.5, sy + bh * 0.5, sD * 0.5 - bd * 0.5 - 0.02);
        bookMesh.castShadow = true;
        shelfGroup.add(bookMesh);
        curX += bw + 0.005;
      }
    }

    // Position bookshelf along western partition wall of living hall
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
    // Framed landscape canvas on living hall feature wall
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
    const artGeo = new THREE.PlaneGeometry(1.6, 1.1);
    const artMat = new THREE.MeshStandardMaterial({
      map: artTex,
      roughness: 0.7,
      metalness: 0.0,
    });
    const artMesh = new THREE.Mesh(artGeo, artMat);
    artMesh.position.set(0, 0, 0.02);
    artGroup.add(artMesh);

    // Warm bronze frame
    const frameGeo = new THREE.BoxGeometry(1.68, 1.18, 0.035);
    const frameMesh = new THREE.Mesh(frameGeo, this.materials.brassMetal);
    frameMesh.position.set(0, 0, 0);
    artGroup.add(frameMesh);

    artGroup.position.set(-3.0, floorY + 2.4, 3.12);
    this.group.add(artGroup);
  }
}

export function buildLivingHall(options = {}) {
  const builder = new LivingHallBuilder(options);
  return builder.build();
}
