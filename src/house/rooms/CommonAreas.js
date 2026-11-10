import * as THREE from 'three';
import {
  getTimberTextures,
  getFabricTextures,
  getRugTextures,
  getArtworkTexture,
} from '../../assets/procedural/TextureGenerator.js';
import {
  createChamferedBoxGeo,
  createPlushPillowGeo,
  createLatheGeo,
  createPottedPlant,
  createFoldedTowelStack,
} from './RoomProps.js';

/**
 * CommonAreasBuilder: Furnishes Entrance Foyer, Upper Gallery Mezzanine,
 * Upper Linen Storage Closet, and Both Upper Balconies (PRD §7.8, §10.11, §10.12, Feature F29).
 */
export class CommonAreasBuilder {
  constructor(options = {}) {
    this.options = options;
    this.group = new THREE.Group();
    this.group.name = 'furniture-common-areas';
    this.colliders = [];
    this.interactables = [];
    this.seats = [];
    this.materials = this.createMaterials();
  }

  createMaterials() {
    const oak = getTimberTextures('oak', 2, 2);
    const walnut = getTimberTextures('walnut', 2, 2);
    const sandalwood = getTimberTextures('sandalwood', 2, 2);
    const teak = getTimberTextures('teak', 2, 2);
    const benchFabric = getFabricTextures('#D4C7B7', 2, 2);
    const linenWhite = getFabricTextures('#FAF7F0', 3, 3);
    const linenBeige = getFabricTextures('#E2D8C7', 3, 3);
    const oliveThrow = getFabricTextures('#7B8970', 2, 2);
    const galleryRugTex = getRugTextures('gallery');
    const foyerRugTex = getRugTextures('dining');

    return {
      woodOak: new THREE.MeshStandardMaterial({
        map: oak.map,
        normalMap: oak.normalMap,
        roughness: 0.55,
      }),
      woodWalnut: new THREE.MeshStandardMaterial({
        map: walnut.map,
        normalMap: walnut.normalMap,
        roughness: 0.58,
      }),
      woodSandalwood: new THREE.MeshStandardMaterial({
        map: sandalwood.map,
        normalMap: sandalwood.normalMap,
        roughness: 0.55,
      }),
      woodTeak: new THREE.MeshStandardMaterial({
        map: teak.map,
        normalMap: teak.normalMap,
        roughness: 0.65,
      }),
      benchCushion: new THREE.MeshStandardMaterial({
        map: benchFabric.map,
        normalMap: benchFabric.normalMap,
        roughness: 0.88,
      }),
      foldedLinenWhite: new THREE.MeshStandardMaterial({
        map: linenWhite.map,
        roughness: 0.9,
      }),
      foldedLinenBeige: new THREE.MeshStandardMaterial({
        map: linenBeige.map,
        roughness: 0.9,
      }),
      oliveAccent: new THREE.MeshStandardMaterial({
        map: oliveThrow.map,
        roughness: 0.88,
      }),
      dustyRose: new THREE.MeshStandardMaterial({
        color: 0xc2988d,
        roughness: 0.86,
      }),
      brassMetal: new THREE.MeshStandardMaterial({
        color: 0xc8a265,
        roughness: 0.3,
        metalness: 0.88,
      }),
      darkBronze: new THREE.MeshStandardMaterial({
        color: 0x322822,
        roughness: 0.45,
        metalness: 0.78,
      }),
      terracotta: new THREE.MeshStandardMaterial({
        color: 0xb86646,
        roughness: 0.82,
      }),
      ceramicIvory: new THREE.MeshStandardMaterial({
        color: 0xede6da,
        roughness: 0.36,
      }),
      planterFoliage: new THREE.MeshStandardMaterial({
        color: 0x3d6b42,
        roughness: 0.68,
      }),
      soilDark: new THREE.MeshStandardMaterial({
        color: 0x2e2116,
        roughness: 0.96,
      }),
      lampLight: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffe0b2,
        emissiveIntensity: 0.9,
        roughness: 0.25,
      }),
      artBotanical: new THREE.MeshStandardMaterial({
        map: getArtworkTexture('botanical'),
        roughness: 0.78,
      }),
      artLandscape: new THREE.MeshStandardMaterial({
        map: getArtworkTexture('landscape'),
        roughness: 0.78,
      }),
      foyerRug: new THREE.MeshStandardMaterial({
        map: foyerRugTex.map,
        normalMap: foyerRugTex.normalMap,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughnessMap: foyerRugTex.roughnessMap,
        roughness: 0.94,
      }),
      galleryRug: new THREE.MeshStandardMaterial({
        map: galleryRugTex.map,
        normalMap: galleryRugTex.normalMap,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughnessMap: galleryRugTex.roughnessMap,
        roughness: 0.94,
      }),
    };
  }

  build() {
    this.buildEntranceFoyer();
    this.buildUpperGallery();
    this.buildUpperRearLounge();
    this.buildWalkInWardrobe();
    this.buildEastGalleryHall();
    this.buildLinenCloset();
    this.buildBalconyFurnishings();

    this.group.userData = {
      zoneId: 'common-areas',
      colliders: this.colliders,
      interactables: this.interactables,
      seats: this.seats,
    };

    return this.group;
  }

  /**
   * Builds a contoured leather shoe silhouette (sole + vamp + heel collar) rather than a cube.
   */
  createShoeMesh(mat) {
    const shoe = new THREE.Group();
    const sole = new THREE.Mesh(
      createChamferedBoxGeo(0.24, 0.018, 0.095, 0.032),
      this.materials.darkBronze
    );
    sole.position.y = 0.009;
    const upper = new THREE.Mesh(
      createChamferedBoxGeo(0.21, 0.055, 0.084, 0.032),
      mat
    );
    upper.position.set(-0.008, 0.04, 0);
    const vamp = new THREE.Mesh(
      createChamferedBoxGeo(0.11, 0.025, 0.078, 0.02),
      mat
    );
    vamp.position.set(0.05, 0.028, 0);
    shoe.add(sole, upper, vamp);
    shoe.castShadow = true;
    return shoe;
  }

  /**
   * Entrance Foyer (Ground Floor: minX: 2.2, maxX: 4.8, minZ: 5.95, maxZ: 8.75, floorY: 0.30).
   */
  buildEntranceFoyer() {
    const foyerGroup = new THREE.Group();
    foyerGroup.name = 'furniture-entrance-foyer';

    const floorY = 0.3;
    const bW = 1.2;
    const bD = 0.45;
    const bSeatH = 0.45;

    // Woven Foyer Welcome Runner Rug centered inside doorway
    const foyerRug = new THREE.Mesh(
      createChamferedBoxGeo(1.4, 0.012, 2.2, 0.01),
      this.materials.foyerRug
    );
    foyerRug.position.set(3.5, floorY + 0.008, 7.25);
    foyerRug.receiveShadow = true;
    foyerGroup.add(foyerRug);

    // 1. Sculpted Walnut & Tufted Linen Shoe Bench along East foyer edge (X = 4.45, Z = 7.15)
    const benchGroup = new THREE.Group();
    benchGroup.name = 'foyer-shoe-bench';

    // Slatted walnut lower shoe rack
    for (let sl = -1; sl <= 1; sl++) {
      const slat = new THREE.Mesh(
        createChamferedBoxGeo(0.09, 0.022, bW - 0.08, 0.006),
        this.materials.woodWalnut
      );
      slat.position.set(sl * 0.13, 0.12, 0);
      slat.castShadow = true;
      benchGroup.add(slat);
    }

    // Two sculpted pairs of shoes
    const shoeMatTan = new THREE.MeshStandardMaterial({ color: 0x9b704f, roughness: 0.52 });
    const shoeMatDark = new THREE.MeshStandardMaterial({ color: 0x262423, roughness: 0.48 });
    for (let pair = 0; pair < 2; pair++) {
      for (const offset of [0, 0.12]) {
        const sMesh = this.createShoeMesh(pair === 0 ? shoeMatTan : shoeMatDark);
        sMesh.position.set(-0.02, 0.132, -0.34 + offset + pair * 0.46);
        sMesh.rotation.y = pair === 0 ? 0.08 : -0.06;
        benchGroup.add(sMesh);
      }
    }

    // Tufted cream linen bench seat cushion (exact top = 0.45m)
    const cushionBase = new THREE.Mesh(
      createChamferedBoxGeo(bD, 0.035, bW, 0.01),
      this.materials.woodWalnut
    );
    cushionBase.position.set(0, bSeatH - 0.08, 0);
    benchGroup.add(cushionBase);

    const seatMesh = new THREE.Mesh(
      createChamferedBoxGeo(bD, 0.068, bW, 0.026),
      this.materials.benchCushion
    );
    seatMesh.position.set(0, bSeatH - 0.034, 0);
    seatMesh.castShadow = true;
    seatMesh.receiveShadow = true;
    benchGroup.add(seatMesh);

    const legGeo = new THREE.CylinderGeometry(0.024, 0.016, bSeatH - 0.08, 10);
    for (const lx of [-bD * 0.5 + 0.045, bD * 0.5 - 0.045]) {
      for (const lz of [-bW * 0.5 + 0.05, bW * 0.5 - 0.05]) {
        const leg = new THREE.Mesh(legGeo, this.materials.woodWalnut);
        leg.position.set(lx, (bSeatH - 0.08) * 0.5, lz);
        leg.castShadow = true;
        benchGroup.add(leg);
      }
    }

    benchGroup.position.set(4.45, floorY, 7.15);
    foyerGroup.add(benchGroup);

    this.seats.push({
      id: 'foyer-shoe-bench',
      label: 'Entrance Shoe Bench',
      x: 4.45,
      y: floorY + bSeatH,
      z: 7.15,
      heading: -Math.PI / 2,
    });

    this.colliders.push({
      id: 'collider-foyer-bench',
      min: new THREE.Vector3(4.45 - bD * 0.5, floorY, 7.15 - bW * 0.5),
      max: new THREE.Vector3(4.45 + bD * 0.5, floorY + bSeatH, 7.15 + bW * 0.5),
      type: 'furniture',
    });

    // 2. Sculpted Standing Coat Rack & Ceramic Umbrella Stand (X=4.48, Z=8.35 & Z=7.98)
    const rackGroup = new THREE.Group();
    rackGroup.name = 'foyer-coat-rack';
    const rackBase = new THREE.Mesh(
      createLatheGeo([[0.22, 0], [0.2, 0.035], [0.06, 0.06], [0.025, 0.08]], 18),
      this.materials.darkBronze
    );
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.028, 1.85, 12),
      this.materials.darkBronze
    );
    pole.position.set(0, 0.925, 0);
    rackGroup.add(rackBase, pole);

    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      const hook = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.009, 0.14, 8),
        this.materials.brassMetal
      );
      hook.position.set(Math.cos(ang) * 0.065, 1.66, Math.sin(ang) * 0.065);
      hook.rotation.z = Math.cos(ang) * 0.45;
      hook.rotation.x = -Math.sin(ang) * 0.45;
      rackGroup.add(hook);
    }

    rackGroup.position.set(4.48, floorY, 8.38);
    foyerGroup.add(rackGroup);

    // Ceramic umbrella stand + folded umbrella beside coat rack
    const standMesh = new THREE.Mesh(
      createLatheGeo([[0.11, 0], [0.13, 0.25], [0.125, 0.48], [0.11, 0.48], [0.105, 0.02]], 16),
      this.materials.ceramicIvory
    );
    standMesh.position.set(4.48, floorY, 7.98);
    standMesh.castShadow = true;
    foyerGroup.add(standMesh);

    const umbShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.008, 0.72, 10),
      this.materials.oliveAccent
    );
    umbShaft.position.set(4.46, floorY + 0.38, 7.98);
    umbShaft.rotation.z = 0.08;
    foyerGroup.add(umbShaft);

    // 3. Architectural Open-Leg Sandalwood Console Table + Stone Vessel & Tray (X=2.55, Z=6.85)
    const consoleG = new THREE.Group();
    const cTop = new THREE.Mesh(
      createChamferedBoxGeo(0.36, 0.04, 1.15, 0.012),
      this.materials.woodSandalwood
    );
    cTop.position.set(0, 0.83, 0);
    cTop.castShadow = true;
    consoleG.add(cTop);

    const cLower = new THREE.Mesh(
      createChamferedBoxGeo(0.32, 0.024, 1.05, 0.008),
      this.materials.woodSandalwood
    );
    cLower.position.set(0, 0.2, 0);
    consoleG.add(cLower);

    for (const cx of [-0.14, 0.14]) {
      for (const cz of [-0.52, 0.52]) {
        const cLeg = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.82, 0.036), this.materials.woodSandalwood);
        cLeg.position.set(cx, 0.41, cz);
        cLeg.castShadow = true;
        consoleG.add(cLeg);
      }
    }

    // Sculpted ceramic vessel & stone catchall dish on console top
    const cVase = new THREE.Mesh(
      createLatheGeo([[0.05, 0], [0.09, 0.09], [0.075, 0.19], [0.035, 0.24], [0.042, 0.26]], 16),
      this.materials.terracotta
    );
    cVase.position.set(0, 0.85, -0.32);
    const cDish = new THREE.Mesh(
      createLatheGeo(
        [[0.001, 0], [0.065, 0], [0.11, 0.024], [0.102, 0.028], [0.06, 0.007], [0.001, 0.007]],
        18
      ),
      this.materials.ceramicIvory
    );
    cDish.position.set(0, 0.85, 0.24);
    consoleG.add(cVase, cDish);

    consoleG.position.set(2.55, floorY, 6.85);
    foyerGroup.add(consoleG);

    this.group.add(foyerGroup);
  }

  /**
   * Upper Landing & Gallery Mezzanine (minX: -6.6, maxX: 3.95, minZ: -8.75, maxZ: 1.7, floorY: 3.95).
   */
  buildUpperGallery() {
    const galGroup = new THREE.Group();
    galGroup.name = 'furniture-upper-gallery';

    const floorY = 3.95;
    const gx = 2.2;
    const gz = -2.0;

    // 1. Bordered Gallery Reading Nook Woven Rug
    const galRug = new THREE.Mesh(
      createChamferedBoxGeo(2.3, 0.012, 2.5, 0.015),
      this.materials.galleryRug
    );
    galRug.position.set(gx, floorY + 0.007, gz);
    galRug.receiveShadow = true;
    galGroup.add(galRug);

    // 2. Sculpted Contoured Boucle & Walnut Reading Lounge Chair
    const chairGroup = new THREE.Group();
    chairGroup.name = 'gallery-reading-armchair';

    const frame = new THREE.Mesh(
      createChamferedBoxGeo(0.8, 0.06, 0.8, 0.016),
      this.materials.woodWalnut
    );
    frame.position.set(0, 0.25, 0);
    frame.castShadow = true;
    chairGroup.add(frame);

    const seatCushion = new THREE.Mesh(
      createChamferedBoxGeo(0.76, 0.16, 0.76, 0.038),
      this.materials.benchCushion
    );
    seatCushion.position.set(0, 0.36, -0.02);
    seatCushion.castShadow = true;
    seatCushion.receiveShadow = true;
    chairGroup.add(seatCushion);

    const backMesh = new THREE.Mesh(
      createChamferedBoxGeo(0.76, 0.44, 0.16, 0.042),
      this.materials.benchCushion
    );
    backMesh.position.set(0, 0.58, 0.31);
    backMesh.rotation.x = 0.12;
    backMesh.castShadow = true;
    chairGroup.add(backMesh);

    const lumbarPillow = new THREE.Mesh(
      createPlushPillowGeo(0.46, 0.28, 0.12),
      this.materials.oliveAccent
    );
    lumbarPillow.position.set(0, 0.51, 0.19);
    lumbarPillow.rotation.x = -0.22;
    chairGroup.add(lumbarPillow);

    for (const sx of [-0.39, 0.39]) {
      const armRest = new THREE.Mesh(
        createChamferedBoxGeo(0.08, 0.055, 0.72, 0.016),
        this.materials.woodWalnut
      );
      armRest.position.set(sx, 0.56, 0.02);
      armRest.castShadow = true;
      chairGroup.add(armRest);

      for (const sz of [-0.32, 0.32]) {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.015, 0.25, 8),
          this.materials.woodWalnut
        );
        leg.position.set(sx * 0.92, 0.125, sz);
        leg.castShadow = true;
        chairGroup.add(leg);
      }
    }

    chairGroup.position.set(gx, floorY, gz);
    chairGroup.rotation.y = -Math.PI / 4;
    galGroup.add(chairGroup);

    this.seats.push({
      id: 'gallery-reading-chair',
      label: 'Upper Gallery Reading Chair',
      x: gx,
      y: floorY + 0.44,
      z: gz,
      heading: (3 * Math.PI) / 4,
    });

    // 3. Turned Oak Bistro Side Table + Open Magazine
    const sideTableG = new THREE.Group();
    const topDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.028, 22),
      this.materials.woodOak
    );
    topDisc.position.y = 0.52;
    topDisc.castShadow = true;
    const pedStem = new THREE.Mesh(
      createLatheGeo([[0.18, 0], [0.16, 0.02], [0.032, 0.1], [0.032, 0.46], [0.07, 0.51]], 16),
      this.materials.woodOak
    );
    const mag = new THREE.Mesh(createChamferedBoxGeo(0.24, 0.018, 0.31, 0.005), this.materials.ceramicIvory);
    mag.position.set(0.02, 0.542, 0);
    mag.rotation.y = 0.25;
    sideTableG.add(topDisc, pedStem, mag);
    sideTableG.position.set(gx - 0.72, floorY, gz - 0.28);
    galGroup.add(sideTableG);

    // 4. Tall Brass Reading Floor Lamp with warm PointLight
    const lampGroup = new THREE.Group();
    const lBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.17, 0.03, 18), this.materials.brassMetal);
    lBase.position.y = 0.015;
    const lampPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.016, 1.56, 10),
      this.materials.brassMetal
    );
    lampPole.position.set(0, 0.79, 0);
    const lampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.24, 0.28, 20, 1, false),
      this.materials.lampLight
    );
    lampShade.position.set(0, 1.52, 0);
    const lampGlow = new THREE.PointLight(0xffcf94, 0.85, 5.5, 2);
    lampGlow.position.set(0, 1.44, 0);
    lampGroup.add(lBase, lampPole, lampShade, lampGlow);
    lampGroup.position.set(gx + 0.65, floorY, gz + 0.42);
    galGroup.add(lampGroup);

    // Potted botanical plant anchoring gallery corner
    const galPlant = createPottedPlant({
      potMat: this.materials.ceramicIvory,
      leafMat: this.materials.planterFoliage,
      stemMat: this.materials.woodSandalwood,
      soilMat: this.materials.soilDark,
      potRadius: 0.2,
      potHeight: 0.36,
      leafCount: 12,
      scale: 1.0,
    });
    galPlant.position.set(3.45, floorY, -1.1);
    galGroup.add(galPlant);

    this.group.add(galGroup);
  }

  /**
   * Builds a bronze-framed artwork canvas sized [width, height] proud of the beveled frame.
   */
  createFramedArt(artMat, width = 1.05, height = 0.85) {
    const artG = new THREE.Group();
    const frameDepth = 0.024;
    const frame = new THREE.Mesh(
      createChamferedBoxGeo(width + 0.08, height + 0.08, frameDepth, 0.008),
      this.materials.darkBronze
    );
    const canvas = new THREE.Mesh(new THREE.PlaneGeometry(width, height), artMat);
    // ExtrudeGeometry chamfer bevel adds ~0.0036 m around Z; place canvas cleanly proud of front face
    canvas.position.z = frameDepth * 0.5 + 0.007;
    artG.add(frame, canvas);
    return artG;
  }

  /**
   * Builds a sculpted 2-seat linen & walnut lounge sofa centered at local (0, 0, 0) facing +Z.
   */
  createTwoSeatSofa(width = 1.72, cushionMat = this.materials.benchCushion) {
    const sofa = new THREE.Group();
    const plinth = new THREE.Mesh(
      createChamferedBoxGeo(width, 0.08, 0.8, 0.015),
      this.materials.woodWalnut
    );
    plinth.position.set(0, 0.22, 0);
    plinth.castShadow = true;
    sofa.add(plinth);

    for (const lx of [-width * 0.5 + 0.08, width * 0.5 - 0.08]) {
      for (const lz of [-0.32, 0.32]) {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.015, 0.18, 8),
          this.materials.woodWalnut
        );
        leg.position.set(lx, 0.09, lz);
        leg.castShadow = true;
        sofa.add(leg);
      }
    }

    const seatW = (width - 0.16) * 0.5;
    for (const sx of [-seatW * 0.5 - 0.008, seatW * 0.5 + 0.008]) {
      const seat = new THREE.Mesh(
        createChamferedBoxGeo(seatW, 0.16, 0.72, 0.035),
        cushionMat
      );
      seat.position.set(sx, 0.34, 0.03);
      seat.castShadow = true;
      seat.receiveShadow = true;
      sofa.add(seat);
    }

    const back = new THREE.Mesh(
      createChamferedBoxGeo(width - 0.1, 0.44, 0.16, 0.04),
      cushionMat
    );
    back.position.set(0, 0.62, -0.31);
    back.rotation.x = -0.1;
    back.castShadow = true;
    sofa.add(back);

    for (const ax of [-width * 0.5 + 0.055, width * 0.5 - 0.055]) {
      const arm = new THREE.Mesh(
        createChamferedBoxGeo(0.11, 0.36, 0.78, 0.028),
        cushionMat
      );
      arm.position.set(ax, 0.44, 0);
      arm.castShadow = true;
      sofa.add(arm);
    }

    for (const [px, rotZ] of [
      [-width * 0.34, 0.12],
      [width * 0.34, -0.14],
    ]) {
      const pillow = new THREE.Mesh(
        createPlushPillowGeo(0.38, 0.34, 0.12),
        this.materials.oliveAccent
      );
      pillow.position.set(px, 0.54, -0.17);
      pillow.rotation.set(-0.22, 0, rotZ);
      sofa.add(pillow);
    }

    return sofa;
  }

  /**
   * NW Upper Rear Lounge (X in [-11.75, -6.6], Z in [-8.75, -1.5], floorY: 3.95).
   */
  buildUpperRearLounge() {
    const g = new THREE.Group();
    g.name = 'furniture-upper-rear-lounge';
    const floorY = 3.95;

    const rug = new THREE.Mesh(
      createChamferedBoxGeo(2.6, 0.012, 2.9, 0.015),
      this.materials.galleryRug
    );
    rug.position.set(-9.65, floorY + 0.007, -5.65);
    rug.receiveShadow = true;
    g.add(rug);

    // 2-Seat Linen Sofa facing East (+X) along West wall
    const sofa = this.createTwoSeatSofa(1.72, this.materials.benchCushion);
    sofa.position.set(-11.18, floorY, -5.65);
    sofa.rotation.y = Math.PI / 2;
    g.add(sofa);

    this.seats.push({
      id: 'upper-lounge-sofa',
      label: 'Upper Lounge Sofa',
      x: -11.12,
      y: floorY + 0.43,
      z: -5.65,
      heading: -Math.PI / 2,
    });
    this.colliders.push({
      id: 'collider-upper-lounge-sofa',
      min: new THREE.Vector3(-11.6, floorY, -6.54),
      max: new THREE.Vector3(-10.75, floorY + 0.84, -4.76),
      type: 'furniture',
    });

    // Sculpted Round Walnut & Stone Cocktail Table + Tray + Art Books
    const tableG = new THREE.Group();
    const tTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.44, 0.036, 26),
      this.materials.ceramicIvory
    );
    tTop.position.y = 0.41;
    tTop.castShadow = true;
    const tStem = new THREE.Mesh(
      createLatheGeo([[0.22, 0], [0.16, 0.04], [0.06, 0.2], [0.12, 0.39]], 18),
      this.materials.woodWalnut
    );
    const tray = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.15, 0.018, 20),
      this.materials.woodSandalwood
    );
    tray.position.set(0.08, 0.436, 0.05);
    const cup = new THREE.Mesh(
      createLatheGeo([[0.03, 0], [0.04, 0.075], [0.036, 0.085]], 14),
      this.materials.terracotta
    );
    cup.position.set(0.08, 0.445, 0.05);
    const book = new THREE.Mesh(
      createChamferedBoxGeo(0.24, 0.026, 0.18, 0.005),
      this.materials.oliveAccent
    );
    book.position.set(-0.14, 0.44, -0.1);
    book.rotation.y = 0.32;
    tableG.add(tTop, tStem, tray, cup, book);
    tableG.position.set(-9.55, floorY, -5.65);
    g.add(tableG);

    this.colliders.push({
      id: 'collider-upper-lounge-table',
      min: new THREE.Vector3(-10.02, floorY, -6.12),
      max: new THREE.Vector3(-9.08, floorY + 0.44, -5.18),
      type: 'furniture',
    });

    // Olive Boucle Lounge Armchair facing center of conversation group
    const accentChair = new THREE.Group();
    const acBase = new THREE.Mesh(
      createChamferedBoxGeo(0.76, 0.06, 0.76, 0.016),
      this.materials.woodWalnut
    );
    acBase.position.set(0, 0.25, 0);
    const acSeat = new THREE.Mesh(
      createChamferedBoxGeo(0.72, 0.16, 0.72, 0.035),
      this.materials.oliveAccent
    );
    acSeat.position.set(0, 0.36, -0.02);
    acSeat.castShadow = true;
    const acBack = new THREE.Mesh(
      createChamferedBoxGeo(0.72, 0.42, 0.15, 0.038),
      this.materials.oliveAccent
    );
    acBack.position.set(0, 0.57, 0.3);
    acBack.rotation.x = 0.12;
    accentChair.add(acBase, acSeat, acBack);
    for (const ax of [-0.36, 0.36]) {
      const arm = new THREE.Mesh(
        createChamferedBoxGeo(0.07, 0.05, 0.68, 0.014),
        this.materials.woodWalnut
      );
      arm.position.set(ax, 0.54, 0.02);
      accentChair.add(arm);
      for (const az of [-0.3, 0.3]) {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.014, 0.25, 8),
          this.materials.woodWalnut
        );
        leg.position.set(ax * 0.9, 0.125, az);
        accentChair.add(leg);
      }
    }
    accentChair.position.set(-9.25, floorY, -7.25);
    accentChair.rotation.y = Math.PI * 0.85;
    g.add(accentChair);

    this.seats.push({
      id: 'upper-lounge-armchair',
      label: 'Upper Lounge Accent Chair',
      x: -9.25,
      y: floorY + 0.44,
      z: -7.25,
      heading: Math.PI - 0.18,
    });

    // Brass Floor Lamp beside sofa
    const lampG = new THREE.Group();
    const lBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.16, 0.028, 18),
      this.materials.brassMetal
    );
    lBase.position.y = 0.014;
    const lPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.015, 1.54, 10),
      this.materials.brassMetal
    );
    lPole.position.y = 0.78;
    const lShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.22, 0.26, 18),
      this.materials.lampLight
    );
    lShade.position.y = 1.5;
    lampG.add(lBase, lPole, lShade);
    lampG.position.set(-11.24, floorY, -6.92);
    g.add(lampG);

    // NW Corner Potted Plant (clear of win-upper-lounge-rear)
    const nwPlant = createPottedPlant({
      potMat: this.materials.terracotta,
      leafMat: this.materials.planterFoliage,
      stemMat: this.materials.woodSandalwood,
      soilMat: this.materials.soilDark,
      potRadius: 0.21,
      potHeight: 0.36,
      leafCount: 12,
      scale: 1.05,
    });
    nwPlant.position.set(-11.22, floorY, -8.18);
    g.add(nwPlant);

    // Framed Botanical Art on West wall above sofa
    const westArt = this.createFramedArt(this.materials.artBotanical, 0.92, 1.12);
    westArt.position.set(-11.73, floorY + 1.56, -5.65);
    westArt.rotation.y = Math.PI / 2;
    g.add(westArt);

    this.group.add(g);
  }

  /**
   * Walk-in Wardrobe (X in [-9.125, -7.25], Z in [4.55, 7.25], floorY: 3.95).
   */
  buildWalkInWardrobe() {
    const wGroup = new THREE.Group();
    wGroup.name = 'furniture-walkin-wardrobe';
    const floorY = 3.95;

    const rug = new THREE.Mesh(
      createChamferedBoxGeo(0.95, 0.01, 1.55, 0.012),
      this.materials.galleryRug
    );
    rug.position.set(-8.18, floorY + 0.006, 5.82);
    rug.receiveShadow = true;
    wGroup.add(rug);

    // Open-Front Bespoke Oak Wardrobe Carcass along North Partition (Z = 6.96)
    const wW = 1.44;
    const wD = 0.44;
    const wH = 2.24;
    const cx = -8.18;
    const cz = 6.98;

    const back = new THREE.Mesh(new THREE.BoxGeometry(wW, wH, 0.024), this.materials.woodOak);
    back.position.set(cx, floorY + wH * 0.5, cz + wD * 0.5 - 0.012);
    wGroup.add(back);

    for (const sx of [cx - wW * 0.5 + 0.016, cx, cx + wW * 0.5 - 0.016]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.028, wH, wD), this.materials.woodOak);
      panel.position.set(sx, floorY + wH * 0.5, cz);
      panel.castShadow = true;
      wGroup.add(panel);
    }

    for (const sy of [0.06, 0.52, 1.88, 2.22]) {
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(wW - 0.03, 0.026, wD),
        this.materials.woodOak
      );
      shelf.position.set(cx, floorY + sy, cz);
      shelf.receiveShadow = true;
      wGroup.add(shelf);
    }

    // Brushed Brass Hanging Rail + Hung Tailored Garments
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, wW - 0.06, 12),
      this.materials.brassMetal
    );
    rail.rotation.z = Math.PI / 2;
    rail.position.set(cx, floorY + 1.72, cz);
    wGroup.add(rail);

    const garmentMats = [
      this.materials.foldedLinenWhite,
      this.materials.dustyRose,
      this.materials.oliveAccent,
      this.materials.foldedLinenBeige,
      this.materials.dustyRose,
      this.materials.oliveAccent,
    ];
    for (let i = 0; i < garmentMats.length; i++) {
      const gx = cx - 0.54 + i * 0.21;
      if (Math.abs(gx - cx) < 0.06) continue;
      const gLen = i % 2 === 0 ? 0.92 : 0.72;
      const robe = new THREE.Mesh(
        createChamferedBoxGeo(0.055, gLen, 0.34, 0.02),
        garmentMats[i]
      );
      robe.position.set(gx, floorY + 1.66 - gLen * 0.5, cz);
      robe.castShadow = true;
      wGroup.add(robe);
    }

    // Folded linen sweater stacks on top shelf
    for (const sx of [cx - 0.36, cx + 0.36]) {
      const stack = createFoldedTowelStack(
        [this.materials.foldedLinenWhite, this.materials.foldedLinenBeige, this.materials.oliveAccent],
        [0.32, 0.29, 0.27],
        [0.065, 0.06, 0.055],
        0.32
      );
      stack.position.set(sx, floorY + 1.895, cz);
      wGroup.add(stack);
    }

    this.colliders.push({
      id: 'collider-walkin-wardrobe',
      min: new THREE.Vector3(cx - wW * 0.5, floorY, cz - wD * 0.5),
      max: new THREE.Vector3(cx + wW * 0.5, floorY + wH, cz + wD * 0.5),
      type: 'furniture',
    });

    this.group.add(wGroup);
  }

  /**
   * Ground East Corridor & Rear-East Conservatory Hall (X in [3.3, 11.75], Z in [-8.75, 4.5], floorY: 0.30).
   */
  buildEastGalleryHall() {
    const eGroup = new THREE.Group();
    eGroup.name = 'furniture-east-gallery-hall';
    const floorY = 0.3;

    // 1. East Corridor Console Table & Art Vignette on Bedroom 1 outer wall (X = 7.16, Z = 3.15)
    const consoleG = new THREE.Group();
    const cTop = new THREE.Mesh(
      createChamferedBoxGeo(0.38, 0.04, 1.28, 0.012),
      this.materials.woodWalnut
    );
    cTop.position.set(0, 0.84, 0);
    cTop.castShadow = true;
    consoleG.add(cTop);

    const cLower = new THREE.Mesh(
      createChamferedBoxGeo(0.34, 0.025, 1.18, 0.008),
      this.materials.woodWalnut
    );
    cLower.position.set(0, 0.22, 0);
    consoleG.add(cLower);

    for (const cx of [-0.15, 0.15]) {
      for (const cz of [-0.58, 0.58]) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.036, 0.83, 0.036),
          this.materials.brassMetal
        );
        leg.position.set(cx, 0.415, cz);
        leg.castShadow = true;
        consoleG.add(leg);
      }
    }

    const amphora = new THREE.Mesh(
      createLatheGeo([[0.055, 0], [0.1, 0.11], [0.08, 0.24], [0.036, 0.3], [0.044, 0.32]], 18),
      this.materials.terracotta
    );
    amphora.position.set(0, 0.86, -0.34);
    const cLampBase = new THREE.Mesh(
      createLatheGeo([[0.075, 0], [0.06, 0.08], [0.04, 0.24], [0.025, 0.32]], 14),
      this.materials.ceramicIvory
    );
    cLampBase.position.set(0, 0.86, 0.34);
    const cShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.14, 0.18, 16),
      this.materials.lampLight
    );
    cShade.position.set(0, 1.24, 0.34);
    consoleG.add(amphora, cLampBase, cShade);

    consoleG.position.set(7.16, floorY, 3.15);
    eGroup.add(consoleG);

    this.colliders.push({
      id: 'collider-east-corridor-console',
      min: new THREE.Vector3(6.95, floorY, 2.5),
      max: new THREE.Vector3(7.38, floorY + 0.88, 3.82),
      type: 'furniture',
    });

    const hallArt = this.createFramedArt(this.materials.artLandscape, 1.05, 0.82);
    hallArt.position.set(7.38, floorY + 1.56, 3.15);
    hallArt.rotation.y = -Math.PI / 2;
    eGroup.add(hallArt);

    const hallCornerPlant = createPottedPlant({
      potMat: this.materials.ceramicIvory,
      leafMat: this.materials.planterFoliage,
      stemMat: this.materials.woodSandalwood,
      soilMat: this.materials.soilDark,
      potRadius: 0.2,
      potHeight: 0.36,
      leafCount: 12,
      scale: 1.0,
    });
    hallCornerPlant.position.set(7.05, floorY, 2.15);
    eGroup.add(hallCornerPlant);

    // 2. Woven East Corridor Runner
    const runner = new THREE.Mesh(
      createChamferedBoxGeo(1.45, 0.012, 3.6, 0.012),
      this.materials.foyerRug
    );
    runner.position.set(5.35, floorY + 0.007, 0.35);
    runner.receiveShadow = true;
    eGroup.add(runner);

    // 3. Rear-East Conservatory Lounge Alcove (X in [7.35, 11.75], Z in [-8.75, 1.85])
    const alcoveRug = new THREE.Mesh(
      createChamferedBoxGeo(2.8, 0.012, 2.5, 0.014),
      this.materials.galleryRug
    );
    alcoveRug.position.set(9.65, floorY + 0.007, -7.25);
    alcoveRug.receiveShadow = true;
    eGroup.add(alcoveRug);

    const settee = this.createTwoSeatSofa(1.75, this.materials.benchCushion);
    settee.position.set(9.65, floorY, -8.12);
    eGroup.add(settee);

    this.seats.push({
      id: 'east-hall-settee',
      label: 'East Conservatory Settee',
      x: 9.65,
      y: floorY + 0.43,
      z: -8.12,
      heading: Math.PI,
    });
    this.colliders.push({
      id: 'collider-east-hall-settee',
      min: new THREE.Vector3(8.75, floorY, -8.56),
      max: new THREE.Vector3(10.55, floorY + 0.84, -7.68),
      type: 'furniture',
    });

    // Side Table + Botanical Plant + Wall Art
    const bistro = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.028, 20),
      this.materials.woodOak
    );
    bistro.position.set(8.42, floorY + 0.52, -8.05);
    const bStem = new THREE.Mesh(
      createLatheGeo([[0.16, 0], [0.032, 0.1], [0.032, 0.48], [0.06, 0.51]], 14),
      this.materials.woodOak
    );
    bStem.position.set(8.42, floorY, -8.05);
    eGroup.add(bistro, bStem);

    const nePlant = createPottedPlant({
      potMat: this.materials.terracotta,
      leafMat: this.materials.planterFoliage,
      stemMat: this.materials.woodSandalwood,
      soilMat: this.materials.soilDark,
      potRadius: 0.22,
      potHeight: 0.38,
      leafCount: 12,
      scale: 1.05,
    });
    nePlant.position.set(11.15, floorY, -8.18);
    eGroup.add(nePlant);

    const rearArt = this.createFramedArt(this.materials.artBotanical, 0.96, 1.1);
    rearArt.position.set(9.65, floorY + 1.56, -8.73);
    eGroup.add(rearArt);

    const bathNorthArt = this.createFramedArt(this.materials.artLandscape, 1.15, 0.86);
    bathNorthArt.position.set(9.6, floorY + 1.56, 1.83);
    bathNorthArt.rotation.y = Math.PI;
    eGroup.add(bathNorthArt);

    this.group.add(eGroup);
  }

  /**
   * Upper Linen Storage Closet (minX: -1.8, maxX: -0.6, minZ: -1.7, maxZ: -0.2, floorY: 3.95):
   * Open-front oak shelving carcass so folded towel and blanket stacks are cleanly visible.
   */
  buildLinenCloset() {
    const linenGroup = new THREE.Group();
    linenGroup.name = 'furniture-upper-linen';

    const floorY = 3.95;
    const lx = -1.2;
    const lz = -0.95;
    const sW = 1.1;
    const sD = 0.44;
    const sH = 2.2;

    // Back panel & two open vertical side uprights (leaves -Z front open toward door-linen-upper!)
    const backPanel = new THREE.Mesh(
      new THREE.BoxGeometry(sW, sH, 0.025),
      this.materials.woodOak
    );
    backPanel.position.set(lx, floorY + sH * 0.5, lz + sD * 0.5 - 0.015);
    linenGroup.add(backPanel);

    for (const sx of [lx - sW * 0.5 + 0.015, lx + sW * 0.5 - 0.015]) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, sH, sD),
        this.materials.woodOak
      );
      stile.position.set(sx, floorY + sH * 0.5, lz);
      stile.castShadow = true;
      linenGroup.add(stile);
    }

    const shelfLevels = [0.4, 0.85, 1.3, 1.75, 2.18];
    for (let s = 0; s < shelfLevels.length; s++) {
      const sy = shelfLevels[s];
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(sW - 0.04, 0.026, sD),
        this.materials.woodOak
      );
      board.position.set(lx, floorY + sy, lz);
      board.castShadow = true;
      board.receiveShadow = true;
      linenGroup.add(board);

      if (s === shelfLevels.length - 1) continue;
      for (let i = 0; i < 3; i++) {
        const stack = createFoldedTowelStack(
          [
            i % 2 === 0 ? this.materials.foldedLinenWhite : this.materials.foldedLinenBeige,
            this.materials.oliveAccent,
          ],
          [0.26, 0.24],
          [0.068, 0.058],
          0.32
        );
        stack.position.set(lx - 0.32 + i * 0.32, floorY + sy + 0.013, lz);
        linenGroup.add(stack);
      }
    }

    this.group.add(linenGroup);
  }

  /**
   * Furnishes BOTH Balcony 1 (Main Rear, Z=-10.6..-9.0) AND Balcony 2 (Secondary West, X=-13.4..-12.0).
   */
  buildBalconyFurnishings() {
    const balGroup = new THREE.Group();
    balGroup.name = 'furniture-balconies';

    const floorY = 3.95;

    // 1. Main Balcony 1 (X in [-5.5, -0.5], Z in [-10.6, -9.0]; door-balcony-1 is at X=-3.0)
    // Two slatted teak lounge chairs flanking a stone bistro table East of the doorway (X = -1.65 & -4.35)
    for (const cx of [-4.45, -1.55]) {
      const chair = new THREE.Group();
      for (let s = 0; s < 4; s++) {
        const slat = new THREE.Mesh(
          createChamferedBoxGeo(0.56, 0.024, 0.095, 0.006),
          this.materials.woodTeak
        );
        slat.position.set(0, 0.38, -0.16 + s * 0.11);
        slat.castShadow = true;
        chair.add(slat);
      }
      const seatPad = new THREE.Mesh(
        createChamferedBoxGeo(0.54, 0.065, 0.5, 0.024),
        this.materials.benchCushion
      );
      seatPad.position.set(0, 0.425, 0.01);
      seatPad.castShadow = true;
      chair.add(seatPad);

      const back = new THREE.Mesh(
        createChamferedBoxGeo(0.56, 0.44, 0.045, 0.012),
        this.materials.woodTeak
      );
      back.position.set(0, 0.62, 0.25);
      back.rotation.x = 0.16;
      back.castShadow = true;
      chair.add(back);

      for (const lx of [-0.26, 0.26]) {
        const arm = new THREE.Mesh(
          createChamferedBoxGeo(0.05, 0.036, 0.54, 0.01),
          this.materials.woodTeak
        );
        arm.position.set(lx, 0.58, 0.01);
        chair.add(arm);
        for (const lz of [-0.22, 0.22]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.58, 0.045), this.materials.woodTeak);
          leg.position.set(lx, 0.29, lz);
          leg.castShadow = true;
          chair.add(leg);
        }
      }
      chair.position.set(cx, floorY, -9.85);
      chair.rotation.y = cx < -3 ? 0.25 : -0.25;
      balGroup.add(chair);
    }

    // Small teak bistro table & bronze lantern on West side of Main Balcony 1
    const b1Table = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.025, 18),
      this.materials.woodTeak
    );
    b1Table.position.set(-1.05, floorY + 0.5, -10.15);
    const b1Stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.04, 0.48, 12),
      this.materials.darkBronze
    );
    b1Stem.position.set(-1.05, floorY + 0.24, -10.15);
    balGroup.add(b1Table, b1Stem);

    const b1Plant = createPottedPlant({
      potMat: this.materials.terracotta,
      leafMat: this.materials.planterFoliage,
      stemMat: this.materials.woodSandalwood,
      soilMat: this.materials.soilDark,
      potRadius: 0.17,
      potHeight: 0.34,
      leafCount: 10,
      scale: 0.85,
    });
    b1Plant.position.set(-5.05, floorY, -10.22);
    balGroup.add(b1Plant);

    // 2. Balcony 2 (Secondary West: minX: -13.4, maxX: -12.0, minZ: 0.8, maxZ: 3.8)
    const b2x = -12.7;
    const b2z = 2.4;

    // Slatted Teak Outdoor Sun Lounger (replaces primitive box)
    const loungerG = new THREE.Group();
    for (const lx of [-0.28, 0.28]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.07, 1.48), this.materials.woodTeak);
      rail.position.set(lx, 0.24, 0);
      loungerG.add(rail);
      for (const lz of [-0.62, 0.62]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.05), this.materials.woodTeak);
        leg.position.set(lx, 0.12, lz);
        leg.castShadow = true;
        loungerG.add(leg);
      }
    }
    for (let s = 0; s < 10; s++) {
      const slat = new THREE.Mesh(
        createChamferedBoxGeo(0.6, 0.022, 0.11, 0.005),
        this.materials.woodTeak
      );
      slat.position.set(0, 0.285, -0.62 + s * 0.135);
      slat.castShadow = true;
      loungerG.add(slat);
    }
    const loungerPad = new THREE.Mesh(
      createChamferedBoxGeo(0.58, 0.065, 1.05, 0.025),
      this.materials.benchCushion
    );
    loungerPad.position.set(0, 0.33, -0.18);
    const loungerBack = new THREE.Mesh(
      createChamferedBoxGeo(0.58, 0.065, 0.45, 0.025),
      this.materials.benchCushion
    );
    loungerBack.position.set(0, 0.46, 0.48);
    loungerBack.rotation.x = 0.48;
    loungerG.add(loungerPad, loungerBack);
    loungerG.position.set(b2x, floorY, b2z);
    balGroup.add(loungerG);

    // Botanical Potted Plant in Terracotta Planter (replaces primitive sphere foliage)
    const b2Plant = createPottedPlant({
      potMat: this.materials.terracotta,
      leafMat: this.materials.planterFoliage,
      stemMat: this.materials.woodSandalwood,
      soilMat: this.materials.soilDark,
      potRadius: 0.18,
      potHeight: 0.36,
      leafCount: 10,
      scale: 0.85,
    });
    b2Plant.position.set(b2x, floorY, 1.15);
    balGroup.add(b2Plant);

    this.group.add(balGroup);
  }
}

export function buildCommonAreas(options = {}) {
  const builder = new CommonAreasBuilder(options);
  return builder.build();
}
