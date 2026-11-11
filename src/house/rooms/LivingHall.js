import * as THREE from 'three';
import {
  getFurnitureWoodTextures,
  getPlasterTextures,
  getFabricTextures,
  getTvScreenTexture,
  getStoneSlabTextures,
  getRugTextures,
  getFoliageTexture,
  getSoilTexture,
} from '../../assets/procedural/TextureGenerator.js';
import {
  createChamferedBoxGeo,
  createPlushPillowGeo,
  createLatheGeo,
  createPottedPlant,
  createDrapedThrowGeo,
  createCuratedFramedArt,
  createSafeArtworkMaterial,
  createContactAoMesh,
  createFlutedPanel,
  createCurvedChairBackGeo,
} from './RoomProps.js';
import { gameStore } from '../../state/gameStore.js';

/**
 * LivingHall: Furnishes the double-height Main Living Hall (PRD §9 & §10.1, Feature F20).
 *
 * Includes:
 * - Low modular sectional sofa (0.80m H, 0.42m seat H) with linen upholstery, piping & contoured throw
 * - Front bay upholstered window banquette bench beneath win-front-left
 * - Sandalwood coffee table (1.30m L x 0.75m W, 0.40m H) with decorative tray and coasters
 * - Interactive TV remote (0.18m x 0.045m x 0.018m)
 * - 75-inch OLED 4K TV (1.68m W x 0.96m H) on feature wall with reactive screen canvas
 * - TV credenza console (2.40m W x 0.48m H x 0.42m D) with soundbar and ceramic flower vase
 * - Full-height architectural stone & lime-plaster chimney breast hearth anchored flush to stair wall
 * - Sandalwood library showcase / bookshelf (1.80m W x 2.10m H x 0.42m D) with rows of books
 * - Woven wool area rug (3.6m x 2.7m)
 * - Matted landscape wall art canvas with walnut frame & warm gallery picture light
 */
export class LivingHallBuilder {
  constructor(options = {}) {
    this.options = options;
    this.group = new THREE.Group();
    this.group.name = 'furniture-living-hall';
    this.colliders = [];
    this.interactables = [];
    this.seats = [];
    this.interiorLights = [];
    this.materials = this.createMaterials();
  }

  createMaterials() {
    const oak = getFurnitureWoodTextures('oak', 2, 2);
    const walnut = getFurnitureWoodTextures('walnut', 2, 2);
    const sandalwood = getFurnitureWoodTextures('sandalwood', 2, 2);
    const fabricLinen = getFabricTextures('#EFE8DC', 3, 3);
    const travertine = getStoneSlabTextures('travertine', 1, 1);
    const limestone = getStoneSlabTextures('limestone', 1, 2);
    const plaster = getPlasterTextures('#F2EAD9', 2, 3);
    const foliagePbr = getFoliageTexture(2, 2);

    return {
      sofaFabric: new THREE.MeshStandardMaterial({
        map: fabricLinen.map,
        normalMap: fabricLinen.normalMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughnessMap: fabricLinen.roughnessMap,
        roughness: 0.92,
        metalness: 0.0,
        envMapIntensity: 0.2,
      }),
      cushionCream: new THREE.MeshStandardMaterial({
        color: 0xf4ede0,
        roughness: 0.92,
        envMapIntensity: 0.2,
      }),
      cushionOlive: new THREE.MeshStandardMaterial({
        color: 0x5c694e,
        roughness: 0.92,
        envMapIntensity: 0.2,
      }),
      cushionRust: new THREE.MeshStandardMaterial({
        color: 0xb8755f,
        roughness: 0.9,
        envMapIntensity: 0.2,
      }),
      woodSandalwood: new THREE.MeshStandardMaterial({
        map: sandalwood.map,
        normalMap: sandalwood.normalMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughnessMap: sandalwood.roughnessMap,
        roughness: 0.54,
        metalness: 0.04,
      }),
      woodWalnut: new THREE.MeshStandardMaterial({
        map: walnut.map,
        normalMap: walnut.normalMap,
        normalScale: new THREE.Vector2(0.58, 0.58),
        roughnessMap: walnut.roughnessMap,
        roughness: 0.56,
        metalness: 0.04,
      }),
      woodOak: new THREE.MeshStandardMaterial({
        map: oak.map,
        normalMap: oak.normalMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughnessMap: oak.roughnessMap,
        roughness: 0.52,
      }),
      tableStone: new THREE.MeshStandardMaterial({
        map: travertine.map,
        normalMap: travertine.normalMap,
        normalScale: new THREE.Vector2(0.48, 0.48),
        roughnessMap: travertine.roughnessMap,
        roughness: 0.42,
      }),
      chimneyPlaster: new THREE.MeshStandardMaterial({
        map: plaster.map,
        normalMap: plaster.normalMap,
        normalScale: new THREE.Vector2(0.45, 0.45),
        roughnessMap: plaster.roughnessMap,
        roughness: 0.9,
        envMapIntensity: 0.22,
      }),
      brassMetal: new THREE.MeshStandardMaterial({
        color: 0xc8a265,
        roughness: 0.32,
        metalness: 0.86,
      }),
      darkMetal: new THREE.MeshStandardMaterial({
        color: 0x222224,
        roughness: 0.5,
        metalness: 0.8,
      }),
      ceramicWhite: new THREE.MeshStandardMaterial({
        color: 0xede5d7,
        roughness: 0.42,
        metalness: 0.02,
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
        roughness: 0.66,
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
        map: limestone.map,
        normalMap: limestone.normalMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughnessMap: limestone.roughnessMap,
        color: 0xe6ddd0,
        roughness: 0.72,
      }),
    };
  }

  build() {
    const floorY = 0.3; // Ground floor level

    this.buildAreaRug(floorY);
    this.buildSofaSet(floorY);
    this.buildWindowBench(floorY);
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
      interiorLights: this.interiorLights,
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
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughnessMap: rugTex.roughnessMap,
      roughness: 0.95,
      metalness: 0.0,
      envMapIntensity: 0.18,
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

    // 3 sculpted chamfered individual seat cushions (seat top strictly = 0.42m) + tailored piping seams
    const cushionSpan = sofaBaseW - 0.44;
    const seatSlotW = cushionSpan / 3 - 0.012;
    const seatGeo = createChamferedBoxGeo(seatSlotW, sofaSeatH - 0.16, sofaBaseD - 0.22, 0.045);
    const pipingGeo = new THREE.BoxGeometry(seatSlotW - 0.06, 0.012, 0.014);
    for (let s = -1; s <= 1; s++) {
      const cxSlot = s * (cushionSpan / 3);
      const cm = new THREE.Mesh(seatGeo, this.materials.sofaFabric);
      cm.position.set(cxSlot, 0.16 + (sofaSeatH - 0.16) * 0.5, -0.05);
      cm.castShadow = true;
      cm.receiveShadow = true;
      sofaGroup.add(cm);

      const welt = new THREE.Mesh(pipingGeo, this.materials.cushionCream);
      welt.position.set(cxSlot, sofaSeatH - 0.01, -0.05 - (sofaBaseD - 0.22) * 0.5 + 0.01);
      sofaGroup.add(welt);
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

    // Softly contoured draped olive throw blanket across right armrest
    const throwMesh = new THREE.Mesh(
      createDrapedThrowGeo(0.22, 0.34, 0.48),
      this.materials.cushionOlive
    );
    throwMesh.position.set(sofaBaseW * 0.5 - 0.105, 0.625, -0.04);
    throwMesh.castShadow = true;
    throwMesh.receiveShadow = true;
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

    // Contact shadow anchor + Position entire sofa at (-3.0, floorY, 5.8) facing north toward TV
    sofaGroup.add(createContactAoMesh(sofaBaseW + 0.25, sofaBaseD + 0.2, 0.3));
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

  /**
   * Furnishes the sunlit south bay beneath win-front-left (sill Y=1.05m) with a tailored
   * walnut & bouclé banquette bench, open art-book shelf, bolster pillows & vase.
   */
  buildWindowBench(floorY) {
    const benchGroup = new THREE.Group();
    benchGroup.name = 'living-window-bench';

    const bW = 2.24;
    const bD = 0.54;
    const frameTopH = 0.36;
    const bx = -3.6;
    const bz = 8.28;

    const topFrame = new THREE.Mesh(
      createChamferedBoxGeo(bW, 0.045, bD, 0.02),
      this.materials.woodWalnut
    );
    topFrame.position.set(0, frameTopH - 0.022, 0);
    topFrame.castShadow = true;
    topFrame.receiveShadow = true;
    benchGroup.add(topFrame);

    const lowShelf = new THREE.Mesh(
      createChamferedBoxGeo(bW - 0.24, 0.024, bD - 0.12, 0.015),
      this.materials.woodSandalwood
    );
    lowShelf.position.set(0, 0.14, 0);
    lowShelf.receiveShadow = true;
    benchGroup.add(lowShelf);

    const legGeo = new THREE.CylinderGeometry(0.022, 0.016, frameTopH - 0.04, 10);
    for (const lx of [-bW * 0.5 + 0.1, 0, bW * 0.5 - 0.1]) {
      for (const lz of [-bD * 0.5 + 0.07, bD * 0.5 - 0.07]) {
        const leg = new THREE.Mesh(legGeo, this.materials.woodWalnut);
        leg.position.set(lx, (frameTopH - 0.04) * 0.5, lz);
        leg.castShadow = true;
        benchGroup.add(leg);
      }
    }

    // Boucle seat pad (total seat height 0.45m -> well below 1.05m window sill)
    const seatPad = new THREE.Mesh(
      createChamferedBoxGeo(bW - 0.06, 0.095, bD - 0.04, 0.035),
      this.materials.cushionCream
    );
    seatPad.position.set(0, frameTopH + 0.045, 0);
    seatPad.castShadow = true;
    benchGroup.add(seatPad);

    // Side bolsters & throw pillows tucked cleanly inside window piers
    const pGeo = createPlushPillowGeo(0.38, 0.28, 0.12);
    for (const [px, mat, rot] of [
      [-bW * 0.5 + 0.24, this.materials.cushionOlive, -0.35],
      [bW * 0.5 - 0.24, this.materials.cushionRust, 0.35],
    ]) {
      const p = new THREE.Mesh(pGeo, mat);
      p.position.set(px, frameTopH + 0.18, 0.05);
      p.rotation.y = rot;
      p.rotation.x = 0.18;
      p.castShadow = true;
      benchGroup.add(p);
    }

    // Coffee-table art books stacked neatly on open lower shelf
    for (const [sx, w, d, mat] of [
      [-0.5, 0.28, 0.22, this.materials.cushionRust],
      [-0.5, 0.24, 0.19, this.materials.sofaFabric],
      [0.45, 0.26, 0.2, this.materials.cushionOlive],
    ]) {
      const bk = new THREE.Mesh(new THREE.BoxGeometry(w, 0.032, d), mat);
      bk.position.set(sx, 0.168 + (mat === this.materials.sofaFabric ? 0.032 : 0), 0);
      bk.castShadow = true;
      benchGroup.add(bk);
    }

    benchGroup.position.set(bx, floorY, bz);
    this.group.add(benchGroup);

    this.seats.push({
      id: 'living-window-bench',
      label: 'Living Hall Window Bench',
      x: bx,
      y: floorY + 0.45,
      z: bz,
      heading: 0,
    });

    this.colliders.push({
      id: 'collider-living-window-bench',
      min: new THREE.Vector3(bx - bW * 0.5, floorY, bz - bD * 0.5),
      max: new THREE.Vector3(bx + bW * 0.5, floorY + 0.55, bz + bD * 0.5),
      type: 'furniture',
    });
  }

  buildAccentChairAndLamp(floorY) {
    const nook = new THREE.Group();
    nook.name = 'living-accent-chair-nook';

    // Sculpted Organic Modern accent lounge chair with curved olive bouclé barrel back & walnut frame
    const chair = new THREE.Group();
    chair.name = 'living-accent-chair';
    const baseFrame = new THREE.Mesh(
      createChamferedBoxGeo(0.76, 0.055, 0.78, 0.03),
      this.materials.woodWalnut
    );
    baseFrame.position.y = 0.24;
    chair.add(baseFrame);

    const legGeo = new THREE.CylinderGeometry(0.022, 0.015, 0.23, 10);
    for (const lx of [-0.3, 0.3]) {
      for (const lz of [-0.3, 0.3]) {
        const leg = new THREE.Mesh(legGeo, this.materials.woodWalnut);
        leg.position.set(lx, 0.115, lz);
        leg.castShadow = true;
        chair.add(leg);
      }
    }

    const seatCush = new THREE.Mesh(
      createChamferedBoxGeo(0.66, 0.16, 0.68, 0.055),
      this.materials.cushionOlive
    );
    seatCush.position.y = 0.35;
    seatCush.castShadow = true;
    seatCush.receiveShadow = true;
    chair.add(seatCush);

    const barrelBack = new THREE.Mesh(
      createCurvedChairBackGeo(0.36, 0.42, 0.095, Math.PI * 0.94),
      this.materials.cushionOlive
    );
    barrelBack.position.set(0, 0.38, -0.02);
    barrelBack.castShadow = true;
    barrelBack.receiveShadow = true;
    chair.add(barrelBack);

    for (const ax of [-0.35, 0.35]) {
      const armSupport = new THREE.Mesh(
        createChamferedBoxGeo(0.055, 0.048, 0.54, 0.018),
        this.materials.woodWalnut
      );
      armSupport.position.set(ax, 0.56, 0.02);
      armSupport.rotation.x = 0.05;
      armSupport.castShadow = true;
      chair.add(armSupport);
    }

    const lumPillow = new THREE.Mesh(
      createPlushPillowGeo(0.42, 0.27, 0.12),
      this.materials.cushionCream
    );
    lumPillow.position.set(0, 0.51, -0.15);
    lumPillow.rotation.x = -0.22;
    lumPillow.castShadow = true;
    chair.add(lumPillow);

    chair.add(createContactAoMesh(0.95, 0.95, 0.28));

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
    const lampLight = new THREE.PointLight(0xffdfb0, 1.05, 7.0, 1.55);
    lampLight.position.set(0, 1.58, 0);
    lamp.add(lampLight);
    lamp.position.set(-5.35, floorY, 6.45);
    nook.add(lamp);

    this.interiorLights.push({
      light: lampLight,
      baseIntensity: 1.05,
      emissiveMat: this.materials.lampShade,
      baseEmissive: 0.78,
    });

    // Mature branching Mediterranean Olive Tree in fluted travertine planter at South-West window bay
    const plant = createPottedPlant({
      potMat: this.materials.tableStone,
      leafMat: this.materials.foliage,
      stemMat: this.materials.stemBark,
      soilMat: this.materials.soil,
      potRadius: 0.24,
      potHeight: 0.42,
      leafCount: 18,
      scale: 1.8,
      flutedPot: true,
    });
    plant.name = 'potted-plant-living';
    plant.add(createContactAoMesh(0.7, 0.7, 0.25));
    plant.position.set(-5.65, floorY, 7.85);
    nook.add(plant);

    this.group.add(nook);
  }

  buildCoffeeTable(floorY) {
    const tableGroup = new THREE.Group();
    tableGroup.name = 'living-coffee-table';

    // Spec: 1.30m L x 0.75m W, 0.40m H — monolithic honed travertine plinth coffee table
    const tableL = 1.3;
    const tableW = 0.75;
    const tableH = 0.4;
    const topThickness = 0.056;

    // Beveled slab tabletop in seamless honed travertine
    const topGeo = createChamferedBoxGeo(tableL, topThickness, tableW, 0.08);
    const topMesh = new THREE.Mesh(topGeo, this.materials.tableStone);
    topMesh.position.set(0, tableH - topThickness * 0.5, 0);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    tableGroup.add(topMesh);

    // Monolithic recessed fluted oval/rounded travertine plinth pedestal base
    const pedH = tableH - topThickness;
    const plinthBase = new THREE.Mesh(
      createChamferedBoxGeo(0.7, pedH, 0.36, 0.1),
      this.materials.tableStone
    );
    plinthBase.position.set(0, pedH * 0.5, 0);
    plinthBase.castShadow = true;
    plinthBase.receiveShadow = true;
    tableGroup.add(plinthBase);

    tableGroup.add(createContactAoMesh(tableL + 0.15, tableW + 0.15, 0.3));

    // Decorative elements on table:
    // 1. Hammered brushed-brass round tray with coasters & stoneware espresso cups
    const trayMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.18, 0.016, 24),
      this.materials.brassMetal
    );
    trayMesh.position.set(-0.25, tableH + 0.008, 0.05);
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

    remoteGroup.position.set(-0.25, tableH + 0.017, 0.05);
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

    // 1. Floating Fluted Walnut TV Console Credenza: 2.40m W x 0.48m H x 0.42m D
    const conW = 2.4;
    const conH = 0.48;
    const conD = 0.42;

    const conBody = new THREE.Mesh(
      createChamferedBoxGeo(conW, conH - 0.12, conD, 0.022),
      this.materials.woodWalnut
    );
    conBody.position.set(0, 0.12 + (conH - 0.12) * 0.5, 0);
    conBody.castShadow = true;
    conBody.receiveShadow = true;
    consoleGroup.add(conBody);

    // Recessed architectural shadow plinth + slim legs lifting credenza cleanly
    const recessedBase = new THREE.Mesh(
      new THREE.BoxGeometry(conW - 0.36, 0.12, conD - 0.12),
      this.materials.darkMetal
    );
    recessedBase.position.set(0, 0.06, -0.02);
    consoleGroup.add(recessedBase);

    // Full-span 3D vertical fluted walnut fascia doors & brushed brass pulls
    const conFlutes = createFlutedPanel(
      conW - 0.08,
      conH - 0.16,
      0.022,
      34,
      this.materials.woodWalnut,
      this.materials.woodSandalwood
    );
    conFlutes.position.set(0, 0.12 + (conH - 0.12) * 0.5, conD * 0.5 + 0.004);
    consoleGroup.add(conFlutes);

    const pullGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.12, 8);
    pullGeo.rotateZ(Math.PI / 2);
    for (const px of [-0.78, 0.0, 0.78]) {
      const pull = new THREE.Mesh(pullGeo, this.materials.brassMetal);
      pull.position.set(px, conH * 0.68, conD * 0.5 + 0.02);
      consoleGroup.add(pull);
    }
    consoleGroup.add(createContactAoMesh(conW + 0.12, conD + 0.15, 0.26));

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

    // Anchored flush against part-ground-living-stair West face (X = 0.40) at Z = 4.65
    // Leaves Z <= 5.55 cleanly clear of stair entrance corner (Z = 5.70)
    const fpW = 1.8;
    const fpH = 1.38;
    const fpD = 0.44;
    const chimneyCenterX = 0.18; // flush back face at X = +0.40, front face at X = -0.04
    const fpZ = 4.65;

    // Stone hearth plinth on floor projecting into living room
    const hearthGeo = new THREE.BoxGeometry(fpW + 0.28, 0.09, fpD + 0.28);
    const hearthMesh = new THREE.Mesh(hearthGeo, this.materials.hearthStone);
    hearthMesh.position.set(0, 0.045, 0.08);
    hearthMesh.castShadow = true;
    hearthMesh.receiveShadow = true;
    fireGroup.add(hearthMesh);

    // Lower honed-stone surround framing a true recessed open firebox cavity (0.94m W x 0.70m H)
    const cavityW = 0.94;
    const cavityH = 0.7;
    const jambW = (fpW - cavityW) * 0.5;
    for (const jSign of [-1, 1]) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(jambW, fpH, fpD),
        this.materials.hearthStone
      );
      jamb.position.set(jSign * (cavityW * 0.5 + jambW * 0.5), fpH * 0.5 + 0.09, 0);
      jamb.castShadow = true;
      jamb.receiveShadow = true;
      fireGroup.add(jamb);
    }

    const lintelH = fpH - cavityH - 0.08;
    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(cavityW, lintelH, fpD),
      this.materials.hearthStone
    );
    lintel.position.set(0, 0.09 + 0.08 + cavityH + lintelH * 0.5, 0);
    lintel.castShadow = true;
    lintel.receiveShadow = true;
    fireGroup.add(lintel);

    const cavityFloor = new THREE.Mesh(
      new THREE.BoxGeometry(cavityW, 0.08, fpD),
      this.materials.fireBrick
    );
    cavityFloor.position.set(0, 0.09 + 0.04, 0);
    cavityFloor.receiveShadow = true;
    fireGroup.add(cavityFloor);

    // Recessed dark firebrick back wall & inner jamb cheeks opening forward to +fpD * 0.5
    const backLiner = new THREE.Mesh(
      new THREE.BoxGeometry(cavityW, cavityH, 0.06),
      this.materials.fireBrick
    );
    backLiner.position.set(0, 0.09 + 0.08 + cavityH * 0.5, -fpD * 0.5 + 0.04);
    fireGroup.add(backLiner);

    for (const jSign of [-1, 1]) {
      const cheek = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, cavityH, fpD - 0.06),
        this.materials.fireBrick
      );
      cheek.position.set(jSign * (cavityW * 0.5 - 0.015), 0.09 + 0.08 + cavityH * 0.5, 0.02);
      fireGroup.add(cheek);
    }

    // Glowing timber embers, wrought-iron grate, split logs & subtle amber flames inside open cavity
    const logMat = new THREE.MeshStandardMaterial({
      color: 0x3d2716,
      roughness: 0.9,
    });
    const emberMat = new THREE.MeshStandardMaterial({
      color: 0xeb5e1e,
      emissive: 0xff4800,
      emissiveIntensity: 0.9,
      roughness: 0.7,
    });
    const grateMat = new THREE.MeshStandardMaterial({
      color: 0x1e1d1c,
      roughness: 0.48,
      metalness: 0.75,
    });

    const emberBed = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.055, 0.2), emberMat);
    emberBed.position.set(0, 0.19, 0.03);
    fireGroup.add(emberBed);

    for (let g = -2; g <= 2; g++) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.24, 6), grateMat);
      bar.rotation.x = Math.PI / 2;
      bar.position.set(g * 0.14, 0.215, 0.035);
      fireGroup.add(bar);
    }

    const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.56, 10), logMat);
    log1.rotation.z = Math.PI / 2 + 0.05;
    log1.position.set(-0.02, 0.26, 0.04);
    fireGroup.add(log1);

    const log2 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.48, 10), logMat);
    log2.rotation.z = Math.PI / 2 - 0.18;
    log2.rotation.y = 0.22;
    log2.position.set(0.05, 0.305, 0.02);
    fireGroup.add(log2);

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffa83b,
      transparent: true,
      opacity: 0.78,
    });
    for (const [fx, fh, fr] of [[-0.12, 0.14, 0.032], [0.02, 0.19, 0.038], [0.16, 0.13, 0.028]]) {
      const flame = new THREE.Mesh(new THREE.ConeGeometry(fr, fh, 8), flameMat);
      flame.position.set(fx, 0.28 + fh * 0.45, 0.035);
      fireGroup.add(flame);
    }

    const hearthGlowLight = new THREE.PointLight(0xff9248, 1.05, 4.8, 1.6);
    hearthGlowLight.position.set(0, 0.44, 0.28);
    fireGroup.add(hearthGlowLight);

    this.interiorLights.push({
      light: hearthGlowLight,
      baseIntensity: 1.05,
      emissiveMat: emberMat,
      baseEmissive: 1.05,
    });

    // Solid sandalwood floating beam mantel shelf
    const mantelGeo = createChamferedBoxGeo(fpW + 0.16, 0.095, fpD + 0.14, 0.018);
    const mantelMesh = new THREE.Mesh(mantelGeo, this.materials.woodSandalwood);
    mantelMesh.position.set(0, fpH + 0.09 + 0.045, 0.04);
    mantelMesh.castShadow = true;
    mantelMesh.receiveShadow = true;
    fireGroup.add(mantelMesh);

    // Tapered monolithic lime-plaster upper chimney breast rising continuously to 6.10m atrium ceiling
    const upperBreastH = 6.1 - (floorY + fpH + 0.18); // ~4.24m
    const upperBreastD = 0.59; // local -Z connects back to X = +0.55 on stair hall side, front face at X = -0.04
    const upperBreast = new THREE.Mesh(
      new THREE.BoxGeometry(fpW - 0.08, upperBreastH, upperBreastD),
      this.materials.chimneyPlaster
    );
    upperBreast.position.set(0, fpH + 0.18 + upperBreastH * 0.5, -0.075);
    upperBreast.castShadow = true;
    upperBreast.receiveShadow = true;
    fireGroup.add(upperBreast);

    // Decorative brass candle tapers & sculptural stone vessel on mantel
    for (const [cx, cy] of [[-0.68, 0.22], [-0.56, 0.17]]) {
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.022, cy, 10), this.materials.brassMetal);
      stick.position.set(cx, fpH + 0.18 + cy * 0.5, 0.06);
      stick.castShadow = true;
      fireGroup.add(stick);
    }

    fireGroup.position.set(chimneyCenterX, floorY, fpZ);
    fireGroup.rotation.y = -Math.PI / 2; // facing west toward sofa
    this.group.add(fireGroup);

    this.colliders.push({
      id: 'collider-living-fireplace',
      min: new THREE.Vector3(-0.2, floorY, fpZ - fpW * 0.5 - 0.1),
      max: new THREE.Vector3(0.4, floorY + fpH + 0.4, fpZ + fpW * 0.5 + 0.1),
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
    shelfGroup.add(createContactAoMesh(1.9, 0.55, 0.25));
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
    // Matted & framed landscape artwork mounted flush onto overmantel chimney breast (X = -0.04 face)
    const artMat = createSafeArtworkMaterial('landscape', '#5F7762', 0.68);

    const artGroup = createCuratedFramedArt({
      artMat,
      width: 1.32,
      height: 0.94,
      frameMat: this.materials.woodWalnut,
      matMat: this.materials.cushionCream,
      brassMat: this.materials.brassMetal,
      glassMat: this.materials.showcaseGlass,
      withPictureLight: true,
      lightIntensity: 0.55,
    });
    artGroup.name = 'living-wall-art';
    // Chimney breast front face sits at X = -0.04; frame backing thickness 0.018 => center X = -0.049
    artGroup.position.set(-0.049, floorY + 2.38, 4.65);
    artGroup.rotation.y = -Math.PI / 2;
    this.group.add(artGroup);

    if (artGroup.userData.pictureLight) {
      this.interiorLights.push(artGroup.userData.pictureLight);
    }
  }
}

export function buildLivingHall(options = {}) {
  const builder = new LivingHallBuilder(options);
  return builder.build();
}