import * as THREE from 'three';
import {
  getFurnitureWoodTextures,
  getFabricTextures,
  getRugTextures,
  getStoneSlabTextures,
  getFoliageTexture,
  getSoilTexture,
} from '../../assets/procedural/TextureGenerator.js';
import {
  createChamferedBoxGeo,
  createPlushPillowGeo,
  createLatheGeo,
  createPottedPlant,
  createFoldedTowelStack,
  createCuratedFramedArt,
  createDrapedThrowGeo,
  createSafeArtworkMaterial,
  createContactAoMesh,
  createFlutedPanel,
  createCurvedChairBackGeo,
} from './RoomProps.js';
import { gameStore } from '../../state/gameStore.js';
import { audioEngine } from '../../assets/procedural/AudioEngine.js';

/**
 * CommonAreasBuilder: Furnishes Entrance Foyer, Dedicated Espresso Bar, Sunroom Conservatory,
 * Upper Gallery Mezzanine & Study, East Gallery Parlour, Walk-in Wardrobe, Upper Linen Closet,
 * and Both Upper Balconies (PRD §7.8, §10.11, §10.12, Feature F29).
 */
export class CommonAreasBuilder {
  constructor(options = {}) {
    this.options = options;
    this.group = new THREE.Group();
    this.group.name = 'furniture-common-areas';
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
    const teak = getFurnitureWoodTextures('teak', 2, 2);
    const stone = getStoneSlabTextures('calacatta', 1, 1);
    const benchFabric = getFabricTextures('#E8DFD1', 3, 3);
    const boucleCream = getFabricTextures('#EDE5D8', 3, 3);
    const linenWhite = getFabricTextures('#FAF7F0', 3, 3);
    const linenBeige = getFabricTextures('#E2D8C7', 3, 3);
    const oliveThrow = getFabricTextures('#7B8970', 2, 2);
    const foliageTex = getFoliageTexture(3, 3);
    const soilTex = getSoilTexture(2, 2);
    const galleryRugTex = getRugTextures('gallery');
    const foyerRugTex = getRugTextures('dining');

    return {
      woodOak: new THREE.MeshStandardMaterial({
        map: oak.map,
        normalMap: oak.normalMap,
        normalScale: new THREE.Vector2(0.5, 0.5),
        roughnessMap: oak.roughnessMap,
        roughness: 0.52,
      }),
      woodWalnut: new THREE.MeshStandardMaterial({
        map: walnut.map,
        normalMap: walnut.normalMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughnessMap: walnut.roughnessMap,
        roughness: 0.55,
      }),
      woodSandalwood: new THREE.MeshStandardMaterial({
        map: sandalwood.map,
        normalMap: sandalwood.normalMap,
        normalScale: new THREE.Vector2(0.52, 0.52),
        roughnessMap: sandalwood.roughnessMap,
        roughness: 0.52,
      }),
      woodTeak: new THREE.MeshStandardMaterial({
        map: teak.map,
        normalMap: teak.normalMap,
        normalScale: new THREE.Vector2(0.52, 0.52),
        roughnessMap: teak.roughnessMap,
        roughness: 0.62,
      }),
      calacattaMarble: new THREE.MeshStandardMaterial({
        map: stone.map,
        normalMap: stone.normalMap,
        normalScale: new THREE.Vector2(0.32, 0.32),
        roughnessMap: stone.roughnessMap,
        roughness: 0.34,
        metalness: 0.04,
      }),
      benchCushion: new THREE.MeshStandardMaterial({
        map: benchFabric.map,
        normalMap: benchFabric.normalMap,
        normalScale: new THREE.Vector2(0.5, 0.5),
        roughnessMap: benchFabric.roughnessMap,
        roughness: 0.9,
        envMapIntensity: 0.2,
      }),
      boucleCream: new THREE.MeshStandardMaterial({
        map: boucleCream.map,
        normalMap: boucleCream.normalMap,
        normalScale: new THREE.Vector2(0.52, 0.52),
        roughnessMap: boucleCream.roughnessMap,
        roughness: 0.91,
        metalness: 0.0,
        envMapIntensity: 0.2,
      }),
      foldedLinenWhite: new THREE.MeshStandardMaterial({
        map: linenWhite.map,
        roughness: 0.9,
        envMapIntensity: 0.2,
      }),
      foldedLinenBeige: new THREE.MeshStandardMaterial({
        map: linenBeige.map,
        roughness: 0.9,
        envMapIntensity: 0.2,
      }),
      oliveAccent: new THREE.MeshStandardMaterial({
        map: oliveThrow.map,
        roughness: 0.88,
        envMapIntensity: 0.2,
      }),
      dustyRose: new THREE.MeshStandardMaterial({
        color: 0xc2988d,
        roughness: 0.86,
        envMapIntensity: 0.2,
      }),
      brassMetal: new THREE.MeshStandardMaterial({
        color: 0xc8a265,
        roughness: 0.3,
        metalness: 0.88,
      }),
      espressoSteel: new THREE.MeshStandardMaterial({
        color: 0xdcdddf,
        roughness: 0.22,
        metalness: 0.92,
      }),
      espressoBlack: new THREE.MeshStandardMaterial({
        color: 0x1e2022,
        roughness: 0.36,
        metalness: 0.45,
      }),
      leatherBlotter: new THREE.MeshStandardMaterial({
        color: 0x5c4636,
        roughness: 0.7,
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
      matCream: new THREE.MeshStandardMaterial({
        color: 0xf2ece0,
        roughness: 0.9,
      }),
      artGlass: new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.08,
        metalness: 0.02,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      }),
      mirrorGlass: new THREE.MeshStandardMaterial({
        color: 0xe3dfd7,
        roughness: 0.14,
        metalness: 0.72,
        envMapIntensity: 0.55,
      }),
      planterFoliage: new THREE.MeshStandardMaterial({
        map: foliageTex.map,
        normalMap: foliageTex.normalMap,
        normalScale: new THREE.Vector2(0.58, 0.58),
        roughnessMap: foliageTex.roughnessMap,
        roughness: 0.72,
      }),
      soilDark: new THREE.MeshStandardMaterial({
        map: soilTex,
        roughness: 0.96,
      }),
      stemBark: new THREE.MeshStandardMaterial({
        color: 0x5c4432,
        roughness: 0.86,
      }),
      lampLight: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffe0b2,
        emissiveIntensity: 0.9,
        roughness: 0.25,
      }),
      artBotanical: createSafeArtworkMaterial('botanical', '#52794E', 0.78),
      artLandscape: createSafeArtworkMaterial('landscape', '#5F7762', 0.78),
      artCoffee: createSafeArtworkMaterial('coffee', '#8C6242', 0.78),
      artAbstract: createSafeArtworkMaterial('abstract', '#B8755F', 0.78),
      foyerRug: new THREE.MeshStandardMaterial({
        map: foyerRugTex.map,
        normalMap: foyerRugTex.normalMap,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughnessMap: foyerRugTex.roughnessMap,
        roughness: 0.94,
        envMapIntensity: 0.2,
      }),
      galleryRug: new THREE.MeshStandardMaterial({
        map: galleryRugTex.map,
        normalMap: galleryRugTex.normalMap,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughnessMap: galleryRugTex.roughnessMap,
        roughness: 0.94,
        envMapIntensity: 0.2,
      }),
    };
  }

  build() {
    this.buildEntranceFoyer();
    this.buildCoffeeBarZone();
    this.buildSunroomConservatory();
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
      interiorLights: this.interiorLights,
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

    benchGroup.add(createContactAoMesh(bD + 0.22, bW + 0.22, 0.22));
    benchGroup.position.set(4.45, floorY, 7.15);
    foyerGroup.add(benchGroup);

    this.seats.push({
      id: 'foyer-shoe-bench',
      label: 'Entrance Shoe Bench',
      x: 4.45,
      y: floorY + bSeatH,
      z: 7.15,
      heading: Math.PI / 2,
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

    // Ceramic umbrella stand + folded canopy umbrella with curved oak handle
    const standMesh = new THREE.Mesh(
      createLatheGeo([[0.11, 0], [0.13, 0.25], [0.125, 0.48], [0.11, 0.48], [0.105, 0.02]], 16),
      this.materials.ceramicIvory
    );
    standMesh.position.set(4.48, floorY, 7.98);
    standMesh.castShadow = true;
    foyerGroup.add(standMesh);

    const umbGroup = new THREE.Group();
    const umbCanopy = new THREE.Mesh(
      createLatheGeo([[0.008, 0], [0.028, 0.18], [0.038, 0.44], [0.012, 0.54]], 12),
      this.materials.oliveAccent
    );
    const umbRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, 0.72, 8),
      this.materials.woodOak
    );
    umbRod.position.y = 0.36;
    const umbHandle = new THREE.Mesh(
      new THREE.TorusGeometry(0.028, 0.009, 8, 12, Math.PI),
      this.materials.woodWalnut
    );
    umbHandle.position.set(0.028, 0.72, 0);
    const umbTip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.004, 0.04, 8),
      this.materials.brassMetal
    );
    umbTip.position.y = -0.02;
    umbGroup.add(umbCanopy, umbRod, umbHandle, umbTip);
    umbGroup.position.set(4.46, floorY + 0.08, 7.98);
    umbGroup.rotation.z = 0.09;
    foyerGroup.add(umbGroup);

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

    // 4. Front-East Foyer Alcove Walnut Waterfall Console, Arched Brass Mirror & Twin Wall Sconces (X = 6.08, Z = 8.48)
    const alcoveCon = new THREE.Group();
    alcoveCon.name = 'foyer-east-alcove';
    alcoveCon.add(createContactAoMesh(1.48, 0.58, 0.22));
    const acTop = new THREE.Mesh(
      createChamferedBoxGeo(1.32, 0.042, 0.42, 0.014),
      this.materials.calacattaMarble
    );
    acTop.position.y = 0.84;
    acTop.castShadow = true;
    acTop.receiveShadow = true;
    alcoveCon.add(acTop);

    const acApronFlutes = createFlutedPanel(1.2, 0.14, 0.02, 24, this.materials.woodWalnut, this.materials.darkBronze);
    acApronFlutes.rotation.y = Math.PI; // Flutes face -Z into foyer
    acApronFlutes.position.set(0, 0.75, -0.18);
    alcoveCon.add(acApronFlutes);

    for (const ax of [-0.62, 0.62]) {
      const sideSlab = new THREE.Mesh(
        createChamferedBoxGeo(0.042, 0.82, 0.4, 0.01),
        this.materials.woodWalnut
      );
      sideSlab.position.set(ax, 0.41, 0);
      sideSlab.castShadow = true;
      sideSlab.receiveShadow = true;
      alcoveCon.add(sideSlab);
    }

    const urn = new THREE.Mesh(
      createLatheGeo([[0.06, 0], [0.11, 0.12], [0.095, 0.28], [0.042, 0.34], [0.052, 0.36]], 18),
      this.materials.terracotta
    );
    urn.position.set(-0.34, 0.86, 0);
    urn.castShadow = true;
    for (let t = 0; t < 5; t++) {
      const spread = (t - 2) * 0.14;
      const twig = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.007, 0.34 + (t % 2) * 0.06, 6),
        this.materials.stemBark
      );
      twig.position.set(Math.sin(spread) * 0.09, 0.49, ((t % 3) - 1) * 0.04);
      twig.rotation.z = -spread;
      twig.rotation.x = ((t % 2) - 0.5) * 0.16;
      urn.add(twig);
    }

    const bookStack1 = new THREE.Mesh(
      createChamferedBoxGeo(0.28, 0.026, 0.22, 0.006),
      this.materials.oliveAccent
    );
    bookStack1.position.set(0.28, 0.873, 0.02);
    const bookStack2 = new THREE.Mesh(
      createChamferedBoxGeo(0.24, 0.022, 0.19, 0.006),
      this.materials.ceramicIvory
    );
    bookStack2.position.set(0.28, 0.897, 0.02);
    bookStack2.rotation.y = 0.15;

    // Sculpted bouclé cube pouf tucked neatly beneath open walnut waterfall console bay
    const poufGroup = new THREE.Group();
    poufGroup.name = 'foyer-tucked-pouf';
    poufGroup.add(createContactAoMesh(0.56, 0.52, 0.22));
    const poufPlinth = new THREE.Mesh(
      createChamferedBoxGeo(0.39, 0.032, 0.35, 0.008),
      this.materials.woodWalnut
    );
    poufPlinth.position.y = 0.016;
    const poufBody = new THREE.Mesh(
      createChamferedBoxGeo(0.42, 0.36, 0.38, 0.038),
      this.materials.boucleCream
    );
    poufBody.position.y = 0.2;
    poufBody.castShadow = true;
    poufBody.receiveShadow = true;
    poufGroup.add(poufPlinth, poufBody);
    poufGroup.position.set(0, 0, 0);

    alcoveCon.add(urn, bookStack1, bookStack2, poufGroup);
    alcoveCon.position.set(6.08, floorY, 8.48);
    foyerGroup.add(alcoveCon);

    this.colliders.push({
      id: 'collider-foyer-alcove-console',
      min: new THREE.Vector3(5.4, floorY, 8.26),
      max: new THREE.Vector3(6.76, floorY + 0.88, 8.72),
      type: 'furniture',
    });

    // Arched Brushed-Brass Mirror & Twin Pleated Sconces centered above alcove console
    const mirrorGroup = new THREE.Group();
    mirrorGroup.name = 'foyer-arch-mirror';
    const mW = 0.78;
    const mH = 0.88;
    const archR = mW * 0.5;
    const rectFrame = new THREE.Mesh(
      createChamferedBoxGeo(mW + 0.045, mH, 0.026, 0.008),
      this.materials.brassMetal
    );
    rectFrame.position.y = -archR * 0.22;
    const archFrame = new THREE.Mesh(
      new THREE.CylinderGeometry(archR + 0.022, archR + 0.022, 0.032, 24, 1, false, 0, Math.PI),
      this.materials.brassMetal
    );
    archFrame.rotation.z = Math.PI / 2;
    archFrame.rotation.y = Math.PI / 2;
    archFrame.position.y = mH * 0.5 - archR * 0.22;
    const rectGlass = new THREE.Mesh(new THREE.PlaneGeometry(mW, mH - 0.01), this.materials.mirrorGlass);
    rectGlass.position.set(0, -archR * 0.22 + 0.005, 0.022);
    const archGlass = new THREE.Mesh(
      new THREE.CircleGeometry(archR, 24, 0, Math.PI),
      this.materials.mirrorGlass
    );
    archGlass.position.set(0, mH * 0.5 - archR * 0.22, 0.022);
    mirrorGroup.add(rectFrame, archFrame, rectGlass, archGlass);
    mirrorGroup.position.set(6.08, floorY + 1.54, 8.732);
    mirrorGroup.rotation.y = Math.PI;
    foyerGroup.add(mirrorGroup);

    for (const sx of [5.32, 6.84]) {
      const sconce = new THREE.Group();
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.016, 16), this.materials.brassMetal);
      plate.rotation.x = Math.PI / 2;
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.11, 8), this.materials.brassMetal);
      neck.rotation.x = Math.PI / 2;
      neck.position.z = 0.055;
      const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.095, 0.16, 18),
        this.materials.lampLight
      );
      shade.position.set(0, 0.08, 0.105);
      const sLight = new THREE.PointLight(0xffdca8, 0.72, 4.2, 1.8);
      sLight.position.set(0, 0.06, 0.18);
      sconce.add(plate, neck, shade, sLight);
      sconce.position.set(sx, floorY + 1.58, 8.732);
      sconce.rotation.y = Math.PI;
      foyerGroup.add(sconce);
      this.interiorLights.push({
        light: sLight,
        baseIntensity: 0.72,
        emissiveMat: this.materials.lampLight,
        baseEmissive: 0.9,
      });
    }

    // 5. Foyer West Wall Framed Artwork (between Main Entrance Casing >= 2.75 & Window Curtains <= -2.10)
    const foyerWestArt = this.createFramedArt(this.materials.artAbstract, 1.05, 0.86, {
      withPictureLight: true,
      lightIntensity: 0.48,
    });
    foyerWestArt.name = 'foyer-west-art';
    foyerWestArt.position.set(1.15, floorY + 1.56, 8.735);
    foyerWestArt.rotation.y = Math.PI;
    foyerGroup.add(foyerWestArt);

    // 6. East Corridor Wall Botanical Print (solid corridor face >= 1.1m North of door-bedroom-1)
    const corridorArt = this.createFramedArt(this.materials.artBotanical, 0.92, 0.84, {
      withPictureLight: true,
      lightIntensity: 0.44,
    });
    corridorArt.name = 'east-corridor-north-art';
    corridorArt.position.set(7.385, floorY + 1.56, 7.25);
    corridorArt.rotation.y = -Math.PI / 2;
    foyerGroup.add(corridorArt);

    this.group.add(foyerGroup);
  }

  /**
   * Dedicated Espresso / Coffee Bar & Café Bistro Nook in Rear Pool Gallery West Bay
   * (X in [-11.73, -8.2], Z in [-6.2, -2.2], floorY: 0.30).
   */
  buildCoffeeBarZone() {
    const cbGroup = new THREE.Group();
    cbGroup.name = 'furniture-coffee-bar';
    const floorY = 0.3;

    // 1. Woven Bistro Area Rug centering the Café Nook
    const cafeRug = new THREE.Mesh(
      createChamferedBoxGeo(2.25, 0.012, 2.55, 0.014),
      this.materials.foyerRug
    );
    cafeRug.position.set(-9.52, floorY + 0.007, -4.3);
    cafeRug.receiveShadow = true;
    cbGroup.add(cafeRug);

    // 2. Walnut & Calacatta Espresso Backbar Credenza against West solid wall (X = -11.42, Z = -4.3)
    const hW = 0.56;
    const hL = 1.78;
    const hH = 0.9;
    const hx = -11.42;
    const hz = -4.3;

    const cbAo = createContactAoMesh(0.76, 1.96, 0.24);
    cbAo.position.set(hx, floorY + 0.003, hz);
    cbGroup.add(cbAo);

    // Full-height walnut recessed alcove surround & crown header framing the espresso bar
    for (const sideSign of [-1, 1]) {
      const pilaster = new THREE.Mesh(
        createChamferedBoxGeo(0.58, 2.56, 0.06, 0.008),
        this.materials.woodWalnut
      );
      pilaster.position.set(hx, floorY + 1.28, hz + sideSign * 0.94);
      pilaster.castShadow = true;
      cbGroup.add(pilaster);
    }
    const alcoveCrown = new THREE.Mesh(
      createChamferedBoxGeo(0.58, 0.1, 1.94, 0.008),
      this.materials.woodWalnut
    );
    alcoveCrown.position.set(hx, floorY + 2.51, hz);
    alcoveCrown.castShadow = true;
    cbGroup.add(alcoveCrown);

    // Full-height 3D fluted walnut upper panelling behind oak cup shelf
    const upperFlutedBack = createFlutedPanel(1.78, 1.04, 0.024, 34, this.materials.woodWalnut, this.materials.darkBronze);
    upperFlutedBack.rotation.y = Math.PI / 2;
    upperFlutedBack.position.set(-11.73, floorY + 1.94, hz);
    cbGroup.add(upperFlutedBack);

    const kick = new THREE.Mesh(
      new THREE.BoxGeometry(hW - 0.06, 0.08, hL - 0.06),
      this.materials.darkBronze
    );
    kick.position.set(hx - 0.02, floorY + 0.04, hz);
    cbGroup.add(kick);

    const carcass = new THREE.Mesh(
      new THREE.BoxGeometry(hW, hH - 0.12, hL),
      this.materials.woodWalnut
    );
    carcass.position.set(hx, floorY + 0.08 + (hH - 0.12) * 0.5, hz);
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    cbGroup.add(carcass);

    for (let d = 0; d < 3; d++) {
      const dz = hz - 0.56 + d * 0.56;
      const door = createFlutedPanel(0.52, 0.72, 0.02, 12, this.materials.woodWalnut, this.materials.darkBronze);
      door.rotation.y = Math.PI / 2; // Flutes face +X East into room
      door.position.set(hx + hW * 0.5 + 0.008, floorY + 0.44, dz);
      cbGroup.add(door);

      const pull = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.012, 0.12),
        this.materials.brassMetal
      );
      pull.position.set(hx + hW * 0.5 + 0.022, floorY + 0.77, dz);
      cbGroup.add(pull);
    }

    const slabTop = new THREE.Mesh(
      createChamferedBoxGeo(hW + 0.03, 0.042, hL + 0.04, 0.012),
      this.materials.calacattaMarble
    );
    slabTop.position.set(hx + 0.01, floorY + hH - 0.021, hz);
    slabTop.castShadow = true;
    slabTop.receiveShadow = true;
    cbGroup.add(slabTop);

    const backsplash = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.52, hL),
      this.materials.calacattaMarble
    );
    backsplash.position.set(-11.735, floorY + hH + 0.26, hz);
    cbGroup.add(backsplash);

    // Floating Oak Cup Shelf (Y = floorY + 1.44) with concealed warm LED strip & Light
    const oakShelf = new THREE.Mesh(
      createChamferedBoxGeo(0.24, 0.032, 1.76, 0.008),
      this.materials.woodOak
    );
    oakShelf.position.set(-11.61, floorY + 1.44, hz);
    oakShelf.castShadow = true;
    cbGroup.add(oakShelf);

    const shelfLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.01, 1.62),
      this.materials.lampLight
    );
    shelfLed.position.set(-11.62, floorY + 1.422, hz);
    cbGroup.add(shelfLed);

    const shelfLight = new THREE.PointLight(0xffdca8, 0.85, 4.2, 1.8);
    shelfLight.position.set(-11.35, floorY + 1.34, hz);
    cbGroup.add(shelfLight);
    this.interiorLights.push({
      light: shelfLight,
      baseIntensity: 0.85,
      emissiveMat: this.materials.lampLight,
      baseEmissive: 0.9,
    });

    // Stacked espresso cups & bean canisters on oak upper shelf (clear below upper art)
    const cupGeo = createLatheGeo([[0.024, 0], [0.032, 0.052], [0.029, 0.055], [0.022, 0.006]], 12);
    for (let c = 0; c < 4; c++) {
      const sCup = new THREE.Mesh(cupGeo, this.materials.ceramicIvory);
      sCup.position.set(-11.58, floorY + 1.456 + (c % 2) * 0.046, hz - 0.58 + Math.floor(c / 2) * 0.14);
      sCup.castShadow = true;
      cbGroup.add(sCup);
    }
    for (let b = 0; b < 3; b++) {
      const can = new THREE.Mesh(
        new THREE.CylinderGeometry(0.048, 0.048, 0.14 + (b % 2) * 0.03, 14),
        b === 1 ? this.materials.espressoBlack : this.materials.ceramicIvory
      );
      can.position.set(-11.59, floorY + 1.456 + (0.14 + (b % 2) * 0.03) * 0.5, hz + 0.18 + b * 0.18);
      const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.016, 14),
        this.materials.woodOak
      );
      lid.position.set(can.position.x, floorY + 1.456 + 0.14 + (b % 2) * 0.03 + 0.008, can.position.z);
      cbGroup.add(can, lid);
    }

    // Framed Coffee Botanical Art centered proud of upper fluted walnut paneling
    const coffeeArt = this.createFramedArt(this.materials.artCoffee, 0.84, 0.58, {
      withPictureLight: true,
      lightIntensity: 0.45,
    });
    coffeeArt.name = 'coffee-bar-art';
    coffeeArt.position.set(-11.695, floorY + 2.04, hz);
    coffeeArt.rotation.y = Math.PI / 2;
    cbGroup.add(coffeeArt);

    // 3. Interactive Dual-Group Stainless & Brass Espresso Machine (Facing East +X)
    const espGroup = new THREE.Group();
    espGroup.name = 'espresso-machine-unit';
    const eBody = new THREE.Mesh(
      createChamferedBoxGeo(0.38, 0.36, 0.44, 0.018),
      this.materials.espressoSteel
    );
    eBody.position.set(0, 0.18, 0);
    eBody.castShadow = true;
    const eSidePanel = new THREE.Mesh(
      createChamferedBoxGeo(0.32, 0.28, 0.46, 0.012),
      this.materials.woodWalnut
    );
    eSidePanel.position.set(-0.02, 0.17, 0);
    const dripTray = new THREE.Mesh(
      createChamferedBoxGeo(0.14, 0.045, 0.42, 0.01),
      this.materials.espressoBlack
    );
    dripTray.position.set(0.21, 0.022, 0);
    const grate = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.006, 0.39),
      this.materials.espressoSteel
    );
    grate.position.set(0.21, 0.046, 0);
    espGroup.add(eBody, eSidePanel, dripTray, grate);

    // Dual group heads, brass collars & walnut portafilter handles
    for (const gz of [-0.095, 0.095]) {
      const gh = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.036, 0.05, 14), this.materials.brassMetal);
      gh.position.set(0.21, 0.22, gz);
      const pf = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.013, 0.14, 10), this.materials.woodWalnut);
      pf.rotation.z = Math.PI / 2;
      pf.position.set(0.29, 0.2, gz);
      const cup = new THREE.Mesh(cupGeo, this.materials.ceramicIvory);
      cup.position.set(0.21, 0.049, gz);
      espGroup.add(gh, pf, cup);
    }

    // Warming rail & top cups + steam wand + pressure dial + reactive brew LED
    const cupRail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.42, 8),
      this.materials.brassMetal
    );
    cupRail.rotation.x = Math.PI / 2;
    cupRail.position.set(0.15, 0.385, 0);
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.016, 14), this.materials.brassMetal);
    dial.rotation.z = Math.PI / 2;
    dial.position.set(0.195, 0.28, 0);
    const wand = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.004, 0.15, 8), this.materials.espressoSteel);
    wand.position.set(0.22, 0.17, -0.18);
    wand.rotation.z = 0.25;

    const espLedMat = new THREE.MeshStandardMaterial({
      color: 0xffd28a,
      emissive: 0xffa644,
      emissiveIntensity: gameStore.getState().appliances.espressoBrewing ? 1.8 : 0.2,
      roughness: 0.25,
    });
    const espLed = new THREE.Mesh(new THREE.SphereGeometry(0.01, 10, 8), espLedMat);
    espLed.position.set(0.195, 0.28, 0.18);
    const brewLight = new THREE.PointLight(0xffc978, gameStore.getState().appliances.espressoBrewing ? 0.65 : 0.0, 1.5, 2);
    brewLight.position.set(0.22, 0.16, 0);
    espGroup.add(cupRail, dial, wand, espLed, brewLight);

    espGroup.position.set(hx + 0.02, floorY + hH, hz - 0.18);
    cbGroup.add(espGroup);

    gameStore.subscribe((state) => {
      const brewing = Boolean(state.appliances.espressoBrewing);
      espLedMat.emissiveIntensity = brewing ? 1.8 : 0.2;
      brewLight.intensity = brewing ? 0.65 : 0.0;
    });

    this.interactables.push({
      id: 'espresso-coffee-bar',
      label: 'Artisan Espresso Bar',
      mesh: eBody,
      x: hx + 0.02,
      y: floorY + hH + 0.22,
      z: hz - 0.18,
      range: 2.3,
      prompt: () =>
        gameStore.getState().appliances.espressoBrewing
          ? 'E — Stop Espresso Brew'
          : 'E — Brew Artisan Espresso',
      onInteract: () => {
        gameStore.toggleAppliance('espressoBrewing');
        audioEngine.playInteract();
      },
    });

    // Conical Burr Grinder, Brass Bean Canister & Countertop Fern
    const grinderBase = new THREE.Mesh(
      createChamferedBoxGeo(0.14, 0.22, 0.14, 0.014),
      this.materials.espressoBlack
    );
    grinderBase.position.set(hx + 0.02, floorY + hH + 0.11, hz + 0.24);
    const hopper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.032, 0.14, 14),
      this.materials.artGlass
    );
    hopper.position.set(hx + 0.02, floorY + hH + 0.28, hz + 0.24);
    const carafe = new THREE.Mesh(
      createLatheGeo([[0.055, 0], [0.068, 0.07], [0.042, 0.15], [0.048, 0.18]], 14),
      this.materials.artGlass
    );
    carafe.position.set(hx + 0.06, floorY + hH, hz + 0.56);
    const counterFern = createPottedPlant({
      potMat: this.materials.terracotta,
      leafMat: this.materials.planterFoliage,
      stemMat: this.materials.woodSandalwood,
      soilMat: this.materials.soilDark,
      potRadius: 0.1,
      potHeight: 0.16,
      leafCount: 9,
      scale: 0.5,
    });
    counterFern.position.set(hx + 0.04, floorY + hH, hz - 0.72);
    cbGroup.add(grinderBase, hopper, carafe, counterFern);

    // 4. Sculpted Calacatta Pedestal Café Table + Two Curved Bouclé Bistro Chairs (-9.45, floorY, -4.3)
    const tx = -9.45;
    const tz = -4.3;
    const bTableG = new THREE.Group();
    bTableG.add(createContactAoMesh(0.75, 0.75, 0.24));
    const btTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.43, 0.034, 28),
      this.materials.calacattaMarble
    );
    btTop.position.y = 0.74;
    btTop.castShadow = true;
    btTop.receiveShadow = true;
    const btStem = new THREE.Mesh(
      createLatheGeo([[0.24, 0], [0.22, 0.025], [0.042, 0.12], [0.038, 0.68], [0.14, 0.73]], 20),
      this.materials.darkBronze
    );
    bTableG.add(btTop, btStem);
    for (const [cxOff, czOff] of [[-0.14, -0.14], [0.14, 0.14]]) {
      const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.05, 0.012, 14), this.materials.ceramicIvory);
      saucer.position.set(cxOff, 0.763, czOff);
      const tCup = new THREE.Mesh(cupGeo, this.materials.ceramicIvory);
      tCup.position.set(cxOff, 0.768, czOff);
      bTableG.add(saucer, tCup);
    }
    bTableG.position.set(tx, floorY, tz);
    cbGroup.add(bTableG);

    const buildBistroChair = () => {
      const ch = new THREE.Group();
      ch.add(createContactAoMesh(0.62, 0.62, 0.22));
      const chSeat = new THREE.Mesh(
        createChamferedBoxGeo(0.48, 0.08, 0.46, 0.032),
        this.materials.boucleCream
      );
      chSeat.position.y = 0.43;
      chSeat.castShadow = true;
      chSeat.receiveShadow = true;
      // Opens cleanly +Z (matching ch1 & ch2 rotations facing café table)
      const chBack = new THREE.Mesh(
        createCurvedChairBackGeo(0.28, 0.32, 0.072, Math.PI * 1.02),
        this.materials.boucleCream
      );
      chBack.position.set(0, 0.45, 0);
      chBack.castShadow = true;
      chBack.receiveShadow = true;
      ch.add(chSeat, chBack);
      for (const lx of [-0.2, 0.2]) {
        for (const lz of [-0.18, 0.18]) {
          const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.016, 0.012, 0.41, 8),
            this.materials.woodWalnut
          );
          leg.position.set(lx, 0.205, lz);
          leg.castShadow = true;
          ch.add(leg);
        }
      }
      return ch;
    };

    // Chair 1 at (-9.98, -4.85) facing SE (+X,+Z); yaw = -3π/4 makes player forward (+X,+Z)
    const ch1 = buildBistroChair();
    ch1.position.set(-9.98, floorY, -4.85);
    ch1.rotation.y = Math.PI * 0.25;
    cbGroup.add(ch1);
    this.seats.push({
      id: 'coffee-bar-chair-1',
      label: 'Café Bistro Chair West',
      x: -9.98,
      y: floorY + 0.46,
      z: -4.85,
      heading: -Math.PI * 0.75,
    });

    // Chair 2 at (-8.92, -3.75) facing NW (-X,-Z); yaw = +π/4 makes player forward (-X,-Z)
    const ch2 = buildBistroChair();
    ch2.position.set(-8.92, floorY, -3.75);
    ch2.rotation.y = -Math.PI * 0.75;
    cbGroup.add(ch2);
    this.seats.push({
      id: 'coffee-bar-chair-2',
      label: 'Café Bistro Chair East',
      x: -8.92,
      y: floorY + 0.46,
      z: -3.75,
      heading: Math.PI * 0.25,
    });

    this.colliders.push({
      id: 'collider-coffee-bar-hutch',
      min: new THREE.Vector3(-11.73, floorY, hz - hL * 0.5 - 0.02),
      max: new THREE.Vector3(-11.12, floorY + hH + 0.02, hz + hL * 0.5 + 0.02),
      type: 'furniture',
    });
    this.colliders.push({
      id: 'collider-coffee-bistro-table',
      min: new THREE.Vector3(tx - 0.46, floorY, tz - 0.46),
      max: new THREE.Vector3(tx + 0.46, floorY + 0.78, tz + 0.46),
      type: 'furniture',
    });

    // North-West Pool Gallery Accent: Large Botanical Art & Sculpted Indoor Olive Tree (-11.35, -8.2)
    const nwArt = this.createFramedArt(this.materials.artBotanical, 1.05, 0.86, {
      withPictureLight: true,
      lightIntensity: 0.44,
    });
    nwArt.name = 'coffee-north-gallery-art';
    nwArt.position.set(-11.735, floorY + 1.65, -7.0);
    nwArt.rotation.y = Math.PI / 2;
    cbGroup.add(nwArt);
    if (nwArt.userData.pictureLight) {
      this.interiorLights.push(nwArt.userData.pictureLight);
    }

    const nwOlive = createPottedPlant({
      potMat: this.materials.terracotta,
      leafMat: this.materials.planterFoliage,
      stemMat: this.materials.woodSandalwood,
      soilMat: this.materials.soilDark,
      potRadius: 0.2,
      potHeight: 0.36,
      leafCount: 16,
      scale: 1.05,
    });
    nwOlive.name = 'coffee-north-olive-tree';
    nwOlive.position.set(-11.25, floorY, -8.25);
    cbGroup.add(nwOlive);

    this.group.add(cbGroup);
  }

  /**
   * Sunroom Botanical Conservatory Seating in Rear Pool Gallery East
   * (X in [-0.8, 2.85], Z in [-8.2, -5.2], floorY: 0.30, well West of Storage wall X=3.375).
   */
  buildSunroomConservatory() {
    const srGroup = new THREE.Group();
    srGroup.name = 'furniture-sunroom-conservatory';
    const floorY = 0.3;

    const rug = new THREE.Mesh(
      createChamferedBoxGeo(2.65, 0.012, 2.25, 0.014),
      this.materials.galleryRug
    );
    rug.position.set(0.95, floorY + 0.007, -7.05);
    rug.receiveShadow = true;
    srGroup.add(rug);

    // 1. Upholstered Daybed Settee facing South (+Z) safely below win-rear-gallery sill
    const daybed = this.createTwoSeatSofa(1.66, this.materials.benchCushion);
    daybed.position.set(0.95, floorY, -7.88);
    const throwMesh = new THREE.Mesh(
      createDrapedThrowGeo(0.28, 0.32, 0.48),
      this.materials.oliveAccent
    );
    throwMesh.position.set(-0.62, 0.48, 0.04);
    throwMesh.castShadow = true;
    daybed.add(throwMesh);
    srGroup.add(daybed);

    this.seats.push({
      id: 'rear-sunroom-daybed',
      label: 'Sunroom Conservatory Daybed',
      x: 0.95,
      y: floorY + 0.43,
      z: -7.88,
      heading: Math.PI,
    });
    this.colliders.push({
      id: 'collider-sunroom-daybed',
      min: new THREE.Vector3(0.1, floorY, -8.32),
      max: new THREE.Vector3(1.8, floorY + 0.84, -7.44),
      type: 'furniture',
    });

    // 2. Round Calacatta Tea Table with porcelain tea service
    const stX = 0.95;
    const stZ = -6.58;
    const tGroup = new THREE.Group();
    const tTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.35, 0.032, 24),
      this.materials.calacattaMarble
    );
    tTop.position.y = 0.44;
    tTop.castShadow = true;
    const tStem = new THREE.Mesh(
      createLatheGeo([[0.18, 0], [0.16, 0.02], [0.032, 0.08], [0.03, 0.38], [0.09, 0.43]], 16),
      this.materials.brassMetal
    );
    const teapot = new THREE.Mesh(
      createLatheGeo([[0.045, 0], [0.075, 0.05], [0.068, 0.1], [0.035, 0.125]], 16),
      this.materials.ceramicIvory
    );
    teapot.position.set(-0.08, 0.456, 0);
    tGroup.add(tTop, tStem, teapot);
    tGroup.position.set(stX, floorY, stZ);
    srGroup.add(tGroup);

    this.colliders.push({
      id: 'collider-sunroom-table',
      min: new THREE.Vector3(stX - 0.38, floorY, stZ - 0.38),
      max: new THREE.Vector3(stX + 0.38, floorY + 0.48, stZ + 0.38),
      type: 'furniture',
    });

    // 3. Angled Sunroom Accent Armchair at (2.42, floorY, -6.52)
    const accent = this.createAccentArmchair({
      cushionMat: this.materials.oliveAccent,
      width: 0.74,
      seatDepth: 0.72,
    });
    accent.position.set(2.42, floorY, -6.52);
    accent.rotation.y = Math.PI * 0.4;
    srGroup.add(accent);

    this.seats.push({
      id: 'rear-sunroom-armchair',
      label: 'Sunroom Conservatory Chair',
      x: 2.42,
      y: floorY + 0.44,
      z: -6.52,
      heading: Math.PI * 0.4,
    });

    // 4. Warm Brass Floor Lamp & Tall Conservatory Planter
    const lampG = this.createBrassFloorLamp({ intensity: 0.85, distance: 5.2 });
    lampG.position.set(-0.52, floorY, -7.95);
    srGroup.add(lampG);

    const srPlant = createPottedPlant({
      potMat: this.materials.terracotta,
      leafMat: this.materials.planterFoliage,
      stemMat: this.materials.stemBark,
      soilMat: this.materials.soilDark,
      potRadius: 0.22,
      potHeight: 0.38,
      leafCount: 14,
      scale: 1.5,
      flutedPot: false,
    });
    srPlant.add(createContactAoMesh(0.65, 0.65, 0.24));
    srPlant.position.set(2.62, floorY, -8.25);
    srGroup.add(srPlant);

    this.group.add(srGroup);
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
    const chairGroup = this.createAccentArmchair({
      cushionMat: this.materials.benchCushion,
      lumbarMat: this.materials.oliveAccent,
      width: 0.8,
      seatDepth: 0.78,
      name: 'gallery-reading-armchair',
    });
    chairGroup.position.set(gx, floorY, gz);
    chairGroup.rotation.y = (3 * Math.PI) / 4;
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
    const lampGroup = this.createBrassFloorLamp({
      intensity: 0.85,
      distance: 5.5,
      baseR: 0.165,
      shadeRTop: 0.18,
      shadeRBot: 0.24,
      shadeH: 0.28,
    });
    lampGroup.position.set(gx + 0.65, floorY, gz + 0.42);
    galGroup.add(lampGroup);

    // Potted Olive Tree anchoring gallery corner
    const galPlant = createPottedPlant({
      potMat: this.materials.ceramicIvory,
      leafMat: this.materials.planterFoliage,
      stemMat: this.materials.stemBark,
      soilMat: this.materials.soilDark,
      potRadius: 0.21,
      potHeight: 0.37,
      leafCount: 14,
      scale: 1.48,
      flutedPot: true,
    });
    galPlant.add(createContactAoMesh(0.62, 0.62, 0.24));
    galPlant.position.set(3.45, floorY, -1.1);
    galGroup.add(galPlant);

    // 5. Slender Mezzanine Balustrade Console Table overlooking double-height atrium (-3.35, 3.95, 1.42)
    const bConG = new THREE.Group();
    const bTop = new THREE.Mesh(
      createChamferedBoxGeo(1.44, 0.038, 0.34, 0.01),
      this.materials.woodSandalwood
    );
    bTop.position.y = 0.8;
    bTop.castShadow = true;
    bTop.receiveShadow = true;
    const bLow = new THREE.Mesh(
      createChamferedBoxGeo(1.34, 0.022, 0.28, 0.008),
      this.materials.woodSandalwood
    );
    bLow.position.y = 0.22;
    bConG.add(bTop, bLow);
    for (const bx of [-0.64, 0.64]) {
      for (const bz of [-0.12, 0.12]) {
        const bLeg = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.78, 0.032), this.materials.woodSandalwood);
        bLeg.position.set(bx, 0.39, bz);
        bLeg.castShadow = true;
        bConG.add(bLeg);
      }
    }
    const bLampStem = new THREE.Mesh(
      createLatheGeo([[0.065, 0], [0.05, 0.1], [0.032, 0.26], [0.02, 0.32]], 14),
      this.materials.ceramicIvory
    );
    bLampStem.position.set(-0.44, 0.82, 0);
    const bLampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.13, 0.17, 16),
      this.materials.lampLight
    );
    bLampShade.position.set(-0.44, 1.18, 0);
    const bLampGlow = new THREE.PointLight(0xffdca8, 0.72, 4.5, 2);
    bLampGlow.position.set(-0.44, 1.14, 0);
    const bDish = new THREE.Mesh(
      createLatheGeo([[0.001, 0], [0.075, 0], [0.125, 0.026], [0.115, 0.03]], 16),
      this.materials.calacattaMarble
    );
    bDish.position.set(0.32, 0.82, 0);
    bConG.add(bLampStem, bLampShade, bLampGlow, bDish);
    bConG.position.set(-3.35, floorY, 1.42);
    galGroup.add(bConG);
    this.interiorLights.push({
      light: bLampGlow,
      baseIntensity: 0.72,
      emissiveMat: this.materials.lampLight,
      baseEmissive: 0.9,
    });
    this.colliders.push({
      id: 'collider-upper-balustrade-console',
      min: new THREE.Vector3(-4.08, floorY, 1.24),
      max: new THREE.Vector3(-2.62, floorY + 0.85, 1.6),
      type: 'furniture',
    });

    // 6. West Mezzanine Executive Writing Study (-5.45, 3.95, -4.25)
    const studyX = -5.45;
    const studyZ = -4.25;
    const studyG = new THREE.Group();
    studyG.name = 'upper-mezzanine-study';
    const dTop = new THREE.Mesh(
      createChamferedBoxGeo(0.68, 0.04, 1.44, 0.015),
      this.materials.woodSandalwood
    );
    dTop.position.y = 0.74;
    dTop.castShadow = true;
    dTop.receiveShadow = true;
    const blotter = new THREE.Mesh(
      createChamferedBoxGeo(0.42, 0.008, 0.68, 0.006),
      this.materials.leatherBlotter
    );
    blotter.position.set(0, 0.764, 0);
    const lapBase = new THREE.Mesh(
      createChamferedBoxGeo(0.22, 0.01, 0.32, 0.004),
      this.materials.espressoSteel
    );
    lapBase.position.set(0.02, 0.772, 0);
    const lapLid = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.21, 0.32),
      this.materials.espressoBlack
    );
    lapLid.position.set(-0.085, 0.87, 0);
    lapLid.rotation.z = 0.22;
    const tLampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.075, 0.02, 14), this.materials.brassMetal);
    tLampBase.position.set(-0.18, 0.77, 0.48);
    const tLampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.32, 8), this.materials.brassMetal);
    tLampArm.position.set(-0.18, 0.93, 0.48);
    const tLampHead = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.12, 14), this.materials.lampLight);
    tLampHead.position.set(-0.1, 1.07, 0.44);
    const tLampGlow = new THREE.PointLight(0xffdca8, 0.72, 3.8, 2);
    tLampGlow.position.set(-0.06, 1.02, 0.44);
    studyG.add(dTop, blotter, lapBase, lapLid, tLampBase, tLampArm, tLampHead, tLampGlow);
    for (const dx of [-0.28, 0.28]) {
      for (const dz of [-0.64, 0.64]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.72, 8), this.materials.woodWalnut);
        leg.position.set(dx, 0.36, dz);
        leg.castShadow = true;
        studyG.add(leg);
      }
    }
    studyG.position.set(studyX, floorY, studyZ);
    galGroup.add(studyG);
    this.interiorLights.push({
      light: tLampGlow,
      baseIntensity: 0.72,
      emissiveMat: this.materials.lampLight,
      baseEmissive: 0.9,
    });
    this.colliders.push({
      id: 'collider-upper-study-desk',
      min: new THREE.Vector3(studyX - 0.36, floorY, studyZ - 0.74),
      max: new THREE.Vector3(studyX + 0.36, floorY + 0.78, studyZ + 0.74),
      type: 'furniture',
    });

    // Curved Bouclé & Walnut Study Chair at (-4.72, 3.95, -4.25) facing West (-X)
    const scG = new THREE.Group();
    scG.add(createContactAoMesh(0.62, 0.62, 0.22));
    const scSeat = new THREE.Mesh(createChamferedBoxGeo(0.48, 0.07, 0.48, 0.025), this.materials.boucleCream);
    scSeat.position.y = 0.44;
    scSeat.castShadow = true;
    const scBackGeo = createCurvedChairBackGeo(0.27, 0.34, 0.068, Math.PI * 1.04);
    scBackGeo.rotateY(-Math.PI / 2); // Opens -X West toward writing desk
    const scBack = new THREE.Mesh(scBackGeo, this.materials.boucleCream);
    scBack.position.set(0.02, 0.46, 0);
    scBack.castShadow = true;
    scG.add(scSeat, scBack);
    for (const cx of [-0.18, 0.18]) {
      for (const cz of [-0.18, 0.18]) {
        const sLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.011, 0.41, 8), this.materials.woodWalnut);
        sLeg.position.set(cx, 0.205, cz);
        scG.add(sLeg);
      }
    }
    scG.position.set(studyX + 0.73, floorY, studyZ);
    galGroup.add(scG);
    this.seats.push({
      id: 'upper-study-chair',
      label: 'Upper Mezzanine Study Chair',
      x: studyX + 0.73,
      y: floorY + 0.46,
      z: studyZ,
      heading: Math.PI / 2,
    });

    // 7. Rear Upper Gallery Bookcase & Curated Art Diptych (X = -6.05, clear of door-balcony-1 & curtains)
    const bkX = -6.05;
    const bkZ = -8.52;
    const bkG = new THREE.Group();
    const bkCase = new THREE.Mesh(new THREE.BoxGeometry(1.56, 1.18, 0.36), this.materials.woodWalnut);
    bkCase.position.y = 0.59;
    bkCase.castShadow = true;
    bkCase.receiveShadow = true;
    bkG.add(bkCase);
    for (const sy of [0.38, 0.78, 1.16]) {
      const shelf = new THREE.Mesh(createChamferedBoxGeo(1.58, 0.026, 0.38, 0.008), this.materials.woodOak);
      shelf.position.set(0, sy, 0.02);
      bkG.add(shelf);
    }
    const spineMats = [this.materials.oliveAccent, this.materials.dustyRose, this.materials.ceramicIvory, this.materials.woodSandalwood];
    for (let i = 0; i < 8; i++) {
      const bh = 0.2 + (i % 3) * 0.035;
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, bh, 0.2), spineMats[i % spineMats.length]);
      bMesh.position.set(-0.56 + i * 0.055, 0.795 + bh * 0.5, 0.04);
      bkG.add(bMesh);
    }
    bkG.position.set(bkX, floorY, bkZ);
    galGroup.add(bkG);
    this.colliders.push({
      id: 'collider-upper-rear-bookcase',
      min: new THREE.Vector3(bkX - 0.8, floorY, bkZ - 0.2),
      max: new THREE.Vector3(bkX + 0.8, floorY + 1.2, bkZ + 0.2),
      type: 'furniture',
    });

    for (const [idx, [ax, artMat]] of [
      [-6.48, this.materials.artBotanical],
      [-5.62, this.materials.artAbstract],
    ].entries()) {
      const dip = this.createFramedArt(artMat, 0.62, 0.78, {
        withPictureLight: true,
        lightIntensity: 0.38,
      });
      dip.name = `upper-gallery-diptych-${idx + 1}`;
      dip.position.set(ax, floorY + 1.82, -8.735);
      galGroup.add(dip);
    }

    this.group.add(galGroup);
  }

  /**
   * Builds a shared walnut-framed contoured accent armchair centered at (0, 0, 0) facing -Z.
   */
  createAccentArmchair({
    cushionMat = this.materials.boucleCream,
    lumbarMat = null,
    width = 0.76,
    seatDepth = 0.74,
    name = '',
  } = {}) {
    const chair = new THREE.Group();
    if (name) chair.name = name;
    chair.add(createContactAoMesh(width + 0.14, seatDepth + 0.14, 0.22));

    const armX = width * 0.5 - 0.025;
    const backZ = seatDepth * 0.5 - 0.08;
    const legZ = seatDepth * 0.4;

    const frame = new THREE.Mesh(
      createChamferedBoxGeo(width, 0.06, seatDepth + 0.02, 0.022),
      this.materials.woodWalnut
    );
    frame.position.y = 0.25;
    frame.castShadow = true;

    const seat = new THREE.Mesh(
      createChamferedBoxGeo(width - 0.06, 0.16, seatDepth - 0.04, 0.042),
      cushionMat
    );
    seat.position.set(0, 0.36, -0.02);
    seat.castShadow = true;
    seat.receiveShadow = true;

    const backGeo = createCurvedChairBackGeo(width * 0.48, 0.38, 0.078, Math.PI * 1.06);
    backGeo.rotateY(Math.PI); // Opens -Z cleanly
    const back = new THREE.Mesh(backGeo, cushionMat);
    back.position.set(0, 0.36, 0.01);
    back.castShadow = true;
    back.receiveShadow = true;
    chair.add(frame, seat, back);

    if (lumbarMat) {
      const pillow = new THREE.Mesh(
        createPlushPillowGeo(width * 0.54, 0.26, 0.11),
        lumbarMat
      );
      pillow.position.set(0, 0.51, backZ - 0.12);
      pillow.rotation.x = -0.22;
      chair.add(pillow);
    }

    for (const ax of [-armX, armX]) {
      const arm = new THREE.Mesh(
        createChamferedBoxGeo(0.065, 0.048, seatDepth * 0.64, 0.015),
        this.materials.woodWalnut
      );
      arm.position.set(ax, 0.54, -0.06);
      arm.castShadow = true;
      chair.add(arm);

      for (const az of [-legZ, legZ]) {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.021, 0.014, 0.25, 8),
          this.materials.woodWalnut
        );
        leg.position.set(ax * 0.9, 0.125, az);
        leg.castShadow = true;
        chair.add(leg);
      }
    }

    return chair;
  }

  /**
   * Builds a shared tall brushed-brass floor lamp with warm 2700K point light registered in lighting rig.
   */
  createBrassFloorLamp({
    intensity = 0.85,
    distance = 5.2,
    baseR = 0.155,
    shadeRTop = 0.17,
    shadeRBot = 0.22,
    shadeH = 0.26,
  } = {}) {
    const lamp = new THREE.Group();
    const lBase = new THREE.Mesh(
      new THREE.CylinderGeometry(baseR, baseR + 0.01, 0.028, 18),
      this.materials.brassMetal
    );
    lBase.position.y = 0.014;
    const lPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.015, 1.56, 10),
      this.materials.brassMetal
    );
    lPole.position.y = 0.78;
    const lShade = new THREE.Mesh(
      new THREE.CylinderGeometry(shadeRTop, shadeRBot, shadeH, 18),
      this.materials.lampLight
    );
    lShade.position.y = 1.51;
    const glow = new THREE.PointLight(0xffcf94, intensity, distance, 2);
    glow.position.set(0, 1.44, 0);
    lamp.add(lBase, lPole, lShade, glow);
    this.interiorLights.push({
      light: glow,
      baseIntensity: intensity,
      emissiveMat: this.materials.lampLight,
      baseEmissive: 0.9,
    });
    return lamp;
  }

  /**
   * Builds a gallery framed artwork assembly sized [width, height] with canvas proud of child[0] backing.
   */
  createFramedArt(artMat, width = 1.05, height = 0.85, options = {}) {
    const artG = createCuratedFramedArt({
      artMat,
      width,
      height,
      frameMat: options.frameMat || this.materials.darkBronze,
      matMat: this.materials.matCream,
      brassMat: this.materials.brassMetal,
      glassMat: this.materials.artGlass,
      withPictureLight: Boolean(options.withPictureLight),
      lightIntensity: options.lightIntensity ?? 0.45,
    });
    if (artG.userData.pictureLight) {
      this.interiorLights.push(artG.userData.pictureLight);
    }
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
    const accentChair = this.createAccentArmchair({
      cushionMat: this.materials.oliveAccent,
      width: 0.76,
      seatDepth: 0.74,
      name: 'upper-lounge-armchair',
    });
    accentChair.position.set(-9.25, floorY, -7.25);
    accentChair.rotation.y = Math.PI - 0.18;
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
    const lampG = this.createBrassFloorLamp({ intensity: 0.85, distance: 5.2 });
    lampG.position.set(-11.24, floorY, -6.92);
    g.add(lampG);

    // NW Corner Olive Tree (clear of win-upper-lounge-rear)
    const nwPlant = createPottedPlant({
      potMat: this.materials.terracotta,
      leafMat: this.materials.planterFoliage,
      stemMat: this.materials.stemBark,
      soilMat: this.materials.soilDark,
      potRadius: 0.21,
      potHeight: 0.36,
      leafCount: 14,
      scale: 1.48,
      flutedPot: false,
    });
    nwPlant.add(createContactAoMesh(0.62, 0.62, 0.24));
    nwPlant.position.set(-11.22, floorY, -8.18);
    g.add(nwPlant);

    // Framed Botanical Art on West wall above sofa
    const westArt = this.createFramedArt(this.materials.artBotanical, 0.92, 1.12, {
      withPictureLight: true,
      lightIntensity: 0.45,
    });
    westArt.name = 'upper-lounge-west-art';
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
    const consoleLampGlow = new THREE.PointLight(0xffdca8, 0.72, 4.2, 2);
    consoleLampGlow.position.set(0, 1.2, 0.34);
    consoleG.add(amphora, cLampBase, cShade, consoleLampGlow);
    this.interiorLights.push({
      light: consoleLampGlow,
      baseIntensity: 0.72,
      emissiveMat: this.materials.lampLight,
      baseEmissive: 0.9,
    });

    consoleG.position.set(7.16, floorY, 3.15);
    eGroup.add(consoleG);

    this.colliders.push({
      id: 'collider-east-corridor-console',
      min: new THREE.Vector3(6.95, floorY, 2.5),
      max: new THREE.Vector3(7.38, floorY + 0.88, 3.82),
      type: 'furniture',
    });

    const hallArt = this.createFramedArt(this.materials.artLandscape, 1.05, 0.82, {
      withPictureLight: true,
      lightIntensity: 0.44,
    });
    hallArt.name = 'east-corridor-console-art';
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
      stemMat: this.materials.stemBark,
      soilMat: this.materials.soilDark,
      potRadius: 0.22,
      potHeight: 0.38,
      leafCount: 14,
      scale: 1.5,
      flutedPot: false,
    });
    nePlant.add(createContactAoMesh(0.64, 0.64, 0.24));
    nePlant.position.set(11.15, floorY, -8.18);
    eGroup.add(nePlant);

    const rearArt = this.createFramedArt(this.materials.artBotanical, 0.96, 1.1, {
      withPictureLight: true,
      lightIntensity: 0.45,
    });
    rearArt.name = 'east-conservatory-rear-art';
    rearArt.position.set(9.65, floorY + 1.56, -8.73);
    eGroup.add(rearArt);

    const bathNorthArt = this.createFramedArt(this.materials.artLandscape, 1.15, 0.86, {
      withPictureLight: true,
      lightIntensity: 0.45,
    });
    bathNorthArt.name = 'bath1-north-art';
    bathNorthArt.position.set(9.6, floorY + 1.56, 1.83);
    bathNorthArt.rotation.y = Math.PI;
    eGroup.add(bathNorthArt);

    // 4. Low Curio Credenza beneath Bathroom 1 North Wall Art (Z = 1.56)
    const curioG = new THREE.Group();
    const cuTop = new THREE.Mesh(
      createChamferedBoxGeo(1.38, 0.038, 0.42, 0.012),
      this.materials.calacattaMarble
    );
    cuTop.position.y = 0.78;
    cuTop.castShadow = true;
    const cuBody = new THREE.Mesh(
      createChamferedBoxGeo(1.32, 0.56, 0.38, 0.01),
      this.materials.woodWalnut
    );
    cuBody.position.y = 0.48;
    cuBody.castShadow = true;
    curioG.add(cuTop, cuBody);
    for (const cx of [-0.58, 0.58]) {
      for (const cz of [-0.14, 0.14]) {
        const cLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.012, 0.2, 8), this.materials.brassMetal);
        cLeg.position.set(cx, 0.1, cz);
        curioG.add(cLeg);
      }
    }
    const cuBowl = new THREE.Mesh(
      createLatheGeo([[0.001, 0], [0.06, 0], [0.115, 0.035], [0.105, 0.04]], 16),
      this.materials.ceramicIvory
    );
    cuBowl.position.set(-0.34, 0.8, 0);
    const cuLampStem = new THREE.Mesh(
      createLatheGeo([[0.06, 0], [0.045, 0.1], [0.028, 0.26]], 14),
      this.materials.brassMetal
    );
    cuLampStem.position.set(0.36, 0.8, 0);
    const cuLampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.125, 0.16, 16),
      this.materials.lampLight
    );
    cuLampShade.position.set(0.36, 1.12, 0);
    const cuGlow = new THREE.PointLight(0xffdca8, 0.72, 4.2, 2);
    cuGlow.position.set(0.36, 1.08, 0);
    curioG.add(cuBowl, cuLampStem, cuLampShade, cuGlow);
    curioG.position.set(9.6, floorY, 1.56);
    eGroup.add(curioG);
    this.interiorLights.push({
      light: cuGlow,
      baseIntensity: 0.72,
      emissiveMat: this.materials.lampLight,
      baseEmissive: 0.9,
    });
    this.colliders.push({
      id: 'collider-east-curio-credenza',
      min: new THREE.Vector3(8.9, floorY, 1.34),
      max: new THREE.Vector3(10.3, floorY + 0.82, 1.79),
      type: 'furniture',
    });

    // 5. East Gallery Parlour Conversation Group (X = 10.25, Z = -3.15; leaves > 2.2m West aisle)
    const pRug = new THREE.Mesh(
      createChamferedBoxGeo(2.4, 0.012, 3.0, 0.014),
      this.materials.galleryRug
    );
    pRug.position.set(10.25, floorY + 0.007, -3.15);
    pRug.receiveShadow = true;
    eGroup.add(pRug);

    const pChair1 = this.createAccentArmchair({
      cushionMat: this.materials.benchCushion,
      width: 0.76,
      seatDepth: 0.74,
      name: 'east-parlour-chair-1',
    });
    pChair1.position.set(10.25, floorY, -4.15);
    pChair1.rotation.y = Math.PI; // Local front is -Z -> faces +Z South toward table
    eGroup.add(pChair1);
    this.seats.push({
      id: 'east-parlour-chair-1',
      label: 'East Parlour Armchair North',
      x: 10.25,
      y: floorY + 0.44,
      z: -4.15,
      heading: Math.PI,
    });

    const pChair2 = this.createAccentArmchair({
      cushionMat: this.materials.oliveAccent,
      width: 0.76,
      seatDepth: 0.74,
      name: 'east-parlour-chair-2',
    });
    pChair2.position.set(10.25, floorY, -2.15);
    pChair2.rotation.y = 0; // Local front is -Z -> faces -Z North toward table
    eGroup.add(pChair2);
    this.seats.push({
      id: 'east-parlour-chair-2',
      label: 'East Parlour Armchair South',
      x: 10.25,
      y: floorY + 0.44,
      z: -2.15,
      heading: 0,
    });

    const pTableG = new THREE.Group();
    const ptTop = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.35, 0.032, 24), this.materials.calacattaMarble);
    ptTop.position.y = 0.52;
    ptTop.castShadow = true;
    const ptStem = new THREE.Mesh(
      createLatheGeo([[0.18, 0], [0.036, 0.1], [0.034, 0.48], [0.08, 0.51]], 16),
      this.materials.brassMetal
    );
    const ptBook = new THREE.Mesh(createChamferedBoxGeo(0.24, 0.024, 0.18, 0.005), this.materials.ceramicIvory);
    ptBook.position.set(0.02, 0.548, 0);
    ptBook.rotation.y = 0.3;
    pTableG.add(ptTop, ptStem, ptBook);
    pTableG.position.set(10.25, floorY, -3.15);
    eGroup.add(pTableG);
    this.colliders.push({
      id: 'collider-east-parlour-table',
      min: new THREE.Vector3(9.87, floorY, -3.53),
      max: new THREE.Vector3(10.63, floorY + 0.56, -2.77),
      type: 'furniture',
    });

    // Brass Floor Lamp beside Parlour seating + Paired Framed Oils on East solid wall
    const pLamp = this.createBrassFloorLamp({ intensity: 0.88, distance: 5.5 });
    pLamp.position.set(11.32, floorY, -4.45);
    eGroup.add(pLamp);

    for (const [idx, [ez, mat]] of [
      [-3.15, this.materials.artLandscape],
      [-5.85, this.materials.artAbstract],
    ].entries()) {
      const eastOil = this.createFramedArt(mat, 0.98, 1.12, {
        withPictureLight: true,
        lightIntensity: 0.48,
      });
      eastOil.name = `east-parlour-art-${idx + 1}`;
      eastOil.position.set(11.735, floorY + 1.56, ez);
      eastOil.rotation.y = -Math.PI / 2;
      eGroup.add(eastOil);
    }

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
