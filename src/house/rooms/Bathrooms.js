import * as THREE from 'three';
import {
  getStoneTileTextures,
  getTimberTextures,
  getFabricTextures,
} from '../../assets/procedural/TextureGenerator.js';
import { ShowerParticles } from './ShowerParticles.js';
import {
  createChamferedBoxGeo,
  createLatheGeo,
  createGooseneckFaucet,
  createFoldedTowelStack,
} from './RoomProps.js';
import { gameStore } from '../../state/gameStore.js';

/**
 * BathroomsBuilder: Furnishes Ensuite Bathroom 1 (Ground Floor) and
 * Ensuite Bathroom 2 (Upper Floor) per PRD §10.5, §10.9, Features F25 & F27.
 *
 * Includes:
 * - Floating walnut vanities (0.90m W x 0.55m D x 0.85m H) with Lathe ceramic vessel basins & backlit mirrors
 * - Wall-hung porcelain commodes with sculpted oval bowls, dual-flush actuator plates, & roll holders
 * - Frameless walk-in glass shower stalls (1.20m x 0.90m) with overhead rain head (2.20m above floor; 6.15m upper),
 *   handheld shower wand + braided hose, backlit wall niches with bottles, linear floor drains & Splash ShowerParticles
 * - Heated ladder towel rails with folded towels & woven cotton bath mats
 */
export class BathroomsBuilder {
  constructor(options = {}) {
    this.options = options;
    this.group = new THREE.Group();
    this.group.name = 'furniture-bathrooms';
    this.colliders = [];
    this.interactables = [];
    this.showers = {};
    this.materials = this.createMaterials();
  }

  createMaterials() {
    const bathStone = getStoneTileTextures('bathFloor', 2, 2);
    const walnut = getTimberTextures('walnut', 2, 2);
    const towelWhite = getFabricTextures('#F6F3EC', 2, 2);
    const towelSage = getFabricTextures('#879480', 2, 2);

    return {
      bathStone: new THREE.MeshStandardMaterial({
        map: bathStone.map,
        normalMap: bathStone.normalMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughness: 0.45,
      }),
      vanityWood: new THREE.MeshStandardMaterial({
        map: walnut.map,
        normalMap: walnut.normalMap,
        normalScale: new THREE.Vector2(0.65, 0.65),
        roughness: 0.55,
      }),
      porcelainWhite: new THREE.MeshStandardMaterial({
        color: 0xf6f6f4,
        roughness: 0.18,
        metalness: 0.04,
      }),
      chromeMetal: new THREE.MeshStandardMaterial({
        color: 0xe6e8eb,
        roughness: 0.18,
        metalness: 0.95,
      }),
      glassScreen: new THREE.MeshPhysicalMaterial({
        color: 0xe4f1f8,
        transmission: 0.92,
        opacity: 0.35,
        transparent: true,
        roughness: 0.06,
        ior: 1.52,
        depthWrite: false,
      }),
      mirror: new THREE.MeshStandardMaterial({
        color: 0xdce4ea,
        roughness: 0.04,
        metalness: 0.98,
        envMapIntensity: 1.6,
      }),
      mirrorBacklight: new THREE.MeshStandardMaterial({
        color: 0xfff0d6,
        emissive: 0xffd296,
        emissiveIntensity: 0.85,
        roughness: 0.4,
      }),
      bottleAmber: new THREE.MeshPhysicalMaterial({
        color: 0x6e3d19,
        roughness: 0.15,
        transmission: 0.45,
        transparent: true,
        opacity: 0.92,
      }),
      bottleCream: new THREE.MeshStandardMaterial({
        color: 0xece6db,
        roughness: 0.35,
      }),
      towelWhite: new THREE.MeshStandardMaterial({
        map: towelWhite.map,
        normalMap: towelWhite.normalMap,
        roughness: 0.92,
      }),
      towelSage: new THREE.MeshStandardMaterial({
        map: towelSage.map,
        normalMap: towelSage.normalMap,
        roughness: 0.92,
      }),
      nicheDark: new THREE.MeshStandardMaterial({
        color: 0x686259,
        roughness: 0.72,
      }),
    };
  }

  build() {
    this.buildBathroom1();
    this.buildBathroom2();

    this.group.userData = {
      zoneId: 'bathrooms',
      colliders: this.colliders,
      interactables: this.interactables,
      showers: this.showers,
    };

    return this.group;
  }

  /**
   * Builds a sculpted oval ceramic vessel washbasin via LatheGeometry.
   */
  createVesselBasin() {
    const profile = [
      [0.001, 0],
      [0.11, 0.004],
      [0.18, 0.055],
      [0.2, 0.12],
      [0.186, 0.122],
      [0.16, 0.045],
      [0.08, 0.016],
      [0.022, 0.015],
    ];
    const basin = new THREE.Mesh(createLatheGeo(profile, 22), this.materials.porcelainWhite);
    basin.scale.set(0.95, 1.0, 1.2);
    basin.castShadow = true;
    basin.receiveShadow = true;
    return basin;
  }

  /**
   * Builds a sculpted wall-hung porcelain commode facing local `+X` or `-Z`.
   */
  createSculptedCommode(faceDirX = -1) {
    const g = new THREE.Group();
    // Tapered rear shroud + skirted oval ceramic pedestal bowl
    const pedestal = new THREE.Mesh(
      createChamferedBoxGeo(0.32, 0.28, 0.3, 0.08),
      this.materials.porcelainWhite
    );
    pedestal.position.set(-faceDirX * 0.16, 0.22, 0);
    pedestal.castShadow = true;
    g.add(pedestal);

    const bowl = new THREE.Mesh(
      createLatheGeo([
        [0.08, 0.1],
        [0.16, 0.18],
        [0.195, 0.34],
        [0.185, 0.37],
        [0.155, 0.35],
        [0.06, 0.22],
      ], 20),
      this.materials.porcelainWhite
    );
    bowl.scale.set(1.25, 1.0, 0.95);
    bowl.position.set(faceDirX * 0.04, 0, 0);
    bowl.castShadow = true;
    bowl.receiveShadow = true;
    g.add(bowl);

    // Ergonomic sculpted seat ring & soft-close lid (at 0.42m seat height)
    const lid = new THREE.Mesh(
      createChamferedBoxGeo(0.46, 0.032, 0.38, 0.14),
      this.materials.porcelainWhite
    );
    lid.position.set(faceDirX * 0.03, 0.405, 0);
    lid.castShadow = true;
    g.add(lid);

    return g;
  }

  /**
   * Builds handheld shower wand + curved hose, recessed backlit niche with bottles,
   * and linear floor drain inside a walk-in shower corner.
   */
  buildShowerDetails(group, {
    floorY,
    nichePos,
    nicheRotY = 0,
    wandPos,
    wandDir = 1,
    drainPos,
  }) {
    // 1. Slotted linear stainless drain flush in shower tray
    const drain = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.008, 0.65),
      this.materials.chromeMetal
    );
    drain.position.set(drainPos.x, floorY + 0.031, drainPos.z);
    group.add(drain);

    // 2. Chrome slide bar + handheld shower wand + curved braided hose
    const wandGroup = new THREE.Group();
    const slideBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.65, 8),
      this.materials.chromeMetal
    );
    slideBar.position.set(0, floorY + 1.42, 0);
    wandGroup.add(slideBar);

    const handset = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.011, 0.19, 10),
      this.materials.chromeMetal
    );
    handset.position.set(wandDir * 0.04, floorY + 1.5, 0.02);
    handset.rotation.z = wandDir * -0.25;
    wandGroup.add(handset);

    const hoseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(wandDir * 0.03, floorY + 1.41, 0.02),
      new THREE.Vector3(wandDir * 0.1, floorY + 1.05, 0.05),
      new THREE.Vector3(wandDir * 0.04, floorY + 0.9, 0.03),
      new THREE.Vector3(0, floorY + 1.1, 0.02),
    ]);
    const hose = new THREE.Mesh(
      new THREE.TubeGeometry(hoseCurve, 14, 0.006, 6, false),
      this.materials.chromeMetal
    );
    wandGroup.add(hose);
    wandGroup.position.set(wandPos.x, 0, wandPos.z);
    group.add(wandGroup);

    // 3. Recessed Backlit Shower Niche with Shampoo & Body Wash Bottles
    const niche = new THREE.Group();
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.04), this.materials.nicheDark);
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.02, 0.12), this.materials.bathStone);
    shelf.position.set(0, -0.17, 0.04);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.015, 0.02), this.materials.mirrorBacklight);
    led.position.set(0, 0.15, 0.03);
    niche.add(back, shelf, led);

    // Amber pump shampoo & cream conditioner bottles + olive bar soap
    const b1 = new THREE.Mesh(
      createLatheGeo([[0.028, 0], [0.032, 0.04], [0.03, 0.15], [0.012, 0.17], [0.005, 0.195]], 12),
      this.materials.bottleAmber
    );
    b1.position.set(-0.1, -0.16, 0.045);
    const b2 = new THREE.Mesh(
      createLatheGeo([[0.025, 0], [0.028, 0.04], [0.026, 0.13], [0.01, 0.15]], 12),
      this.materials.bottleCream
    );
    b2.position.set(0.01, -0.16, 0.045);
    const soap = new THREE.Mesh(createChamferedBoxGeo(0.075, 0.024, 0.05, 0.01), this.materials.bottleCream);
    soap.position.set(0.11, -0.148, 0.045);
    niche.add(b1, b2, soap);

    niche.position.set(nichePos.x, floorY + 1.38, nichePos.z);
    niche.rotation.y = nicheRotY;
    group.add(niche);
  }

  /**
   * Builds a heated chrome ladder towel rail with folded cotton towels.
   */
  createTowelRail(floorY, x, z, rotY = 0) {
    const railGroup = new THREE.Group();
    const frameW = 0.5;
    for (const sx of [-frameW * 0.5, frameW * 0.5]) {
      const stile = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.05, 8), this.materials.chromeMetal);
      stile.position.set(sx, 0, 0);
      railGroup.add(stile);
    }
    for (let r = 0; r < 6; r++) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, frameW, 8), this.materials.chromeMetal);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, -0.4 + r * 0.16, 0);
      railGroup.add(bar);
    }
    const drapedTowel = new THREE.Mesh(
      createChamferedBoxGeo(0.36, 0.42, 0.04, 0.015),
      this.materials.towelSage
    );
    drapedTowel.position.set(0, 0.15, 0.015);
    drapedTowel.castShadow = true;
    railGroup.add(drapedTowel);

    railGroup.position.set(x, floorY + 1.25, z);
    railGroup.rotation.y = rotY;
    return railGroup;
  }

  /**
   * Ensuite Bathroom 1 (Ground Floor: minX: 9.35, maxX: 11.75, minZ: 2.0, maxZ: 4.6, floorY: 0.30).
   * Arranged cleanly to keep door-bathroom-1 swing zone (x=10.2, z=4.675) & win-bath1-east (z=3.3) clear.
   */
  buildBathroom1() {
    const b1Group = new THREE.Group();
    b1Group.name = 'furniture-bathroom-1';

    const floorY = 0.3;

    // 1. Floating Walnut Vanity (0.86m W x 0.54m D x 0.85m H) along North-East wall (Z=4.15)
    const vW = 0.86;
    const vD = 0.54;
    const vH = 0.85;
    const vX = 11.75 - vD * 0.5 - 0.02;
    const vZ = 4.14;

    const vanityCabinet = new THREE.Mesh(
      createChamferedBoxGeo(vD, 0.44, vW, 0.012),
      this.materials.vanityWood
    );
    vanityCabinet.position.set(vX, floorY + 0.55, vZ);
    vanityCabinet.castShadow = true;
    b1Group.add(vanityCabinet);

    const vanityTop = new THREE.Mesh(
      createChamferedBoxGeo(vD + 0.02, 0.04, vW + 0.02, 0.01),
      this.materials.bathStone
    );
    vanityTop.position.set(vX - 0.01, floorY + vH - 0.02, vZ);
    vanityTop.castShadow = true;
    b1Group.add(vanityTop);

    const basinMesh = this.createVesselBasin();
    basinMesh.position.set(11.75 - vD * 0.52, floorY + vH, vZ);
    b1Group.add(basinMesh);

    const faucet = createGooseneckFaucet(this.materials.chromeMetal, 0.26, 0.13);
    faucet.rotation.y = Math.PI;
    faucet.position.set(11.75 - 0.09, floorY + vH, vZ);
    b1Group.add(faucet);

    const soapBottle = new THREE.Mesh(
      createLatheGeo([[0.03, 0], [0.036, 0.05], [0.032, 0.12], [0.01, 0.145]], 12),
      this.materials.bottleAmber
    );
    soapBottle.position.set(11.75 - 0.18, floorY + vH, vZ - 0.28);
    b1Group.add(soapBottle);

    // Backlit Floating Mirror (glowing halo behind reflective glass)
    const backlight = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.94, 0.84), this.materials.mirrorBacklight);
    backlight.position.set(11.735, floorY + 1.5, vZ);
    const mirrorMesh = new THREE.Mesh(createChamferedBoxGeo(0.022, 0.88, 0.78, 0.02), this.materials.mirror);
    mirrorMesh.position.set(11.715, floorY + 1.5, vZ);
    b1Group.add(backlight, mirrorMesh);

    // 2. Wall-hung Porcelain Commode beneath frosted East window (Z = 3.16; sill height = 1.35m)
    const toilet = this.createSculptedCommode(-1);
    toilet.position.set(11.42, floorY, 3.16);
    b1Group.add(toilet);

    const flushPlate = new THREE.Mesh(
      createChamferedBoxGeo(0.016, 0.14, 0.22, 0.008),
      this.materials.chromeMetal
    );
    flushPlate.position.set(11.738, floorY + 0.88, 3.16);
    b1Group.add(flushPlate);

    // 3. Walk-in Glass Shower Stall (1.20m x 0.90m) in SW corner (X=9.95, Z=2.68)
    const sL = 1.2;
    const sW = 0.9;
    const sHeadH = 2.2;
    const showerX = 9.95;
    const showerZ = 2.68;

    const trayMesh = new THREE.Mesh(
      createChamferedBoxGeo(sW, 0.03, sL, 0.01),
      this.materials.bathStone
    );
    trayMesh.position.set(showerX, floorY + 0.015, showerZ);
    trayMesh.receiveShadow = true;
    b1Group.add(trayMesh);

    // Frameless tempered glass partition screen along East edge (leaving entry north Z=3.0..3.3 open)
    const glassScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 2.0, 0.88),
      this.materials.glassScreen
    );
    glassScreen.position.set(showerX + sW * 0.5, floorY + 1.0, showerZ - 0.15);
    b1Group.add(glassScreen);

    for (const cz of [showerZ - 0.54, showerZ + 0.22]) {
      const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.05), this.materials.chromeMetal);
      clamp.position.set(showerX + sW * 0.5, floorY + 0.05, cz);
      b1Group.add(clamp);
    }

    // Overhead rain shower fixture mounted on West wall extending +X into stall
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, sHeadH, 10), this.materials.chromeMetal);
    pipe.position.set(9.48, floorY + sHeadH * 0.5, showerZ);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.45, 10), this.materials.chromeMetal);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(9.71, floorY + sHeadH, showerZ);
    const showerHead = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 20), this.materials.chromeMetal);
    showerHead.position.set(showerX, floorY + sHeadH - 0.01, showerZ);
    b1Group.add(pipe, arm, showerHead);

    // Chrome thermostatic mixer handle (clickable)
    const mixerHandle = new THREE.Mesh(
      createChamferedBoxGeo(0.045, 0.13, 0.18, 0.01),
      this.materials.chromeMetal
    );
    mixerHandle.position.set(9.5, floorY + 1.1, showerZ);
    b1Group.add(mixerHandle);

    this.buildShowerDetails(b1Group, {
      floorY,
      nichePos: { x: 9.95, z: 2.04 },
      nicheRotY: 0,
      wandPos: { x: 9.5, z: showerZ - 0.28 },
      wandDir: 1,
      drainPos: { x: 9.6, z: showerZ },
    });

    // Heated Towel Rail & Bath Mat
    b1Group.add(this.createTowelRail(floorY, 10.92, 2.04, 0));
    const bathMat = new THREE.Mesh(
      createChamferedBoxGeo(0.55, 0.018, 0.85, 0.012),
      this.materials.towelWhite
    );
    bathMat.position.set(10.75, floorY + 0.009, 3.05);
    bathMat.receiveShadow = true;
    b1Group.add(bathMat);

    // Slatted walnut under-vanity storage shelf supporting folded towel stack
    const underShelf = new THREE.Mesh(
      createChamferedBoxGeo(vD - 0.04, 0.024, vW - 0.06, 0.008),
      this.materials.vanityWood
    );
    underShelf.position.set(vX, floorY + 0.16, vZ);
    underShelf.castShadow = true;
    underShelf.receiveShadow = true;
    b1Group.add(underShelf);
    for (const sx of [vX - vD * 0.4, vX + vD * 0.4]) {
      for (const sz of [vZ - vW * 0.4, vZ + vW * 0.4]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.16, 8), this.materials.chromeMetal);
        leg.position.set(sx, floorY + 0.08, sz);
        b1Group.add(leg);
      }
    }

    const underTowels = createFoldedTowelStack([this.materials.towelWhite, this.materials.towelSage]);
    underTowels.position.set(vX, floorY + 0.172, vZ);
    b1Group.add(underTowels);

    this.interactables.push({
      id: 'shower-valve-bath1',
      label: 'Ensuite 1 Rain Shower Valve',
      mesh: mixerHandle,
      x: 9.54,
      y: floorY + 1.1,
      z: showerZ,
      range: 2.3,
      prompt: 'Toggle Shower Water',
      onInteract: () => {
        const next = gameStore.toggleShower('bath1');
        if (this.showers.bath1) this.showers.bath1.setActive(next);
      },
    });

    const particlesBath1 = new ShowerParticles({
      count: 600,
      headY: floorY + sHeadH - 0.02,
      floorY: floorY + 0.03,
      speed: 2.5,
      sprayRadius: 0.2,
      bathKey: 'bath1',
      stallBounds: {
        minX: -0.45,
        maxX: 0.45,
        minZ: -0.6,
        maxZ: 0.6,
        minY: floorY + 0.03,
        maxY: floorY + sHeadH,
      },
    });
    particlesBath1.group.position.set(showerX, 0, showerZ);
    b1Group.add(particlesBath1.group);
    this.showers.bath1 = particlesBath1;

    this.group.add(b1Group);

    this.colliders.push({
      id: 'collider-bath-1-vanity',
      min: new THREE.Vector3(11.75 - vD - 0.04, floorY, vZ - vW * 0.5),
      max: new THREE.Vector3(11.75, floorY + vH, vZ + vW * 0.5),
      type: 'furniture',
    });
  }

  /**
   * Ensuite Bathroom 2 (Upper Floor: minX: -11.75, maxX: -9.25, minZ: 4.55, maxZ: 7.25, floorY: 3.95).
   * Preserves exact upper showerhead datum `Y = 6.15m` (`3.95 + 2.20`), clear of door-bathroom-2 & win-bath2-west.
   */
  buildBathroom2() {
    const b2Group = new THREE.Group();
    b2Group.name = 'furniture-bathroom-2';

    const floorY = 3.95;

    // 1. Floating Walnut Vanity (0.90m W x 0.55m D x 0.85m H) along East partition (X=-9.55, Z=6.52)
    const vW = 0.9;
    const vD = 0.55;
    const vH = 0.85;
    const vX = -9.25 - vD * 0.5 - 0.02;
    const vZ = 6.52;

    const vanityCabinet = new THREE.Mesh(
      createChamferedBoxGeo(vD, 0.44, vW, 0.012),
      this.materials.vanityWood
    );
    vanityCabinet.position.set(vX, floorY + 0.55, vZ);
    vanityCabinet.castShadow = true;
    b2Group.add(vanityCabinet);

    const vanityTop = new THREE.Mesh(
      createChamferedBoxGeo(vD + 0.02, 0.04, vW + 0.02, 0.01),
      this.materials.bathStone
    );
    vanityTop.position.set(vX + 0.01, floorY + vH - 0.02, vZ);
    vanityTop.castShadow = true;
    b2Group.add(vanityTop);

    const basinMesh = this.createVesselBasin();
    basinMesh.position.set(vX, floorY + vH, vZ);
    b2Group.add(basinMesh);

    const faucet = createGooseneckFaucet(this.materials.chromeMetal, 0.26, 0.13);
    faucet.rotation.y = Math.PI;
    faucet.position.set(-9.25 - 0.09, floorY + vH, vZ);
    b2Group.add(faucet);

    const soapBottle = new THREE.Mesh(
      createLatheGeo([[0.03, 0], [0.036, 0.05], [0.032, 0.12], [0.01, 0.145]], 12),
      this.materials.bottleCream
    );
    soapBottle.position.set(-9.42, floorY + vH, vZ + 0.28);
    b2Group.add(soapBottle);

    const backlight = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.9, 0.84), this.materials.mirrorBacklight);
    backlight.position.set(-9.27, floorY + 1.5, vZ);
    const mirrorMesh = new THREE.Mesh(createChamferedBoxGeo(0.022, 0.84, 0.78, 0.02), this.materials.mirror);
    mirrorMesh.position.set(-9.29, floorY + 1.5, vZ);
    b2Group.add(backlight, mirrorMesh);

    // 2. Sculpted Wall-Hung Porcelain Commode along East partition South (Z = 5.34)
    const toilet = this.createSculptedCommode(-1);
    toilet.position.set(-9.58, floorY, 5.34);
    b2Group.add(toilet);

    const flushPlate = new THREE.Mesh(
      createChamferedBoxGeo(0.016, 0.14, 0.22, 0.008),
      this.materials.chromeMetal
    );
    flushPlate.position.set(-9.27, floorY + 0.88, 5.34);
    b2Group.add(flushPlate);

    // 3. Walk-in Glass Shower Stall (1.20m x 0.90m) in NW corner (North of frosted window!)
    // Showerhead height Y = 3.95 + 2.20 = 6.15m per PRD & Tier 1 spec
    const sW = 1.2;
    const sD = 0.9;
    const sHeadH = 2.2;
    const showerX = -11.12;
    const showerZ = 6.76;

    const trayMesh = new THREE.Mesh(
      createChamferedBoxGeo(sW, 0.03, sD, 0.01),
      this.materials.bathStone
    );
    trayMesh.position.set(showerX, floorY + 0.015, showerZ);
    trayMesh.receiveShadow = true;
    b2Group.add(trayMesh);

    // Frameless tempered glass partition screen on South edge (leaving East side open to walk in)
    const glassScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 2.0, 0.012),
      this.materials.glassScreen
    );
    glassScreen.position.set(-11.29, floorY + 1.0, showerZ - sD * 0.5);
    b2Group.add(glassScreen);

    for (const cx of [-11.65, -10.92]) {
      const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.035), this.materials.chromeMetal);
      clamp.position.set(cx, floorY + 0.05, showerZ - sD * 0.5);
      b2Group.add(clamp);
    }

    // Chrome rain shower riser + arm + 0.26m disc (at Y = 6.14m; emission at 6.13m)
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, sHeadH, 10), this.materials.chromeMetal);
    pipe.position.set(-11.71, floorY + sHeadH * 0.5, showerZ);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 10), this.materials.chromeMetal);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(-11.53, floorY + sHeadH, showerZ);
    const showerHead = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 20), this.materials.chromeMetal);
    showerHead.position.set(-11.38, floorY + sHeadH - 0.01, showerZ);
    b2Group.add(pipe, arm, showerHead);

    const mixerHandle = new THREE.Mesh(
      createChamferedBoxGeo(0.045, 0.13, 0.18, 0.01),
      this.materials.chromeMetal
    );
    mixerHandle.position.set(-11.71, floorY + 1.1, showerZ);
    b2Group.add(mixerHandle);

    this.buildShowerDetails(b2Group, {
      floorY,
      nichePos: { x: -11.15, z: 7.21 },
      nicheRotY: Math.PI,
      wandPos: { x: -11.71, z: showerZ + 0.25 },
      wandDir: 1,
      drainPos: { x: -11.62, z: showerZ },
    });

    b2Group.add(this.createTowelRail(floorY, -11.71, 5.02, Math.PI / 2));
    const bathMat = new THREE.Mesh(
      createChamferedBoxGeo(0.8, 0.018, 0.55, 0.012),
      this.materials.towelWhite
    );
    bathMat.position.set(-10.55, floorY + 0.009, 5.95);
    bathMat.receiveShadow = true;
    b2Group.add(bathMat);

    this.interactables.push({
      id: 'shower-valve-bath2',
      label: 'Ensuite 2 Rain Shower Valve',
      mesh: mixerHandle,
      x: -11.65,
      y: floorY + 1.1,
      z: showerZ,
      range: 2.3,
      prompt: 'Toggle Shower Water',
      onInteract: () => {
        const next = gameStore.toggleShower('bath2');
        if (this.showers.bath2) this.showers.bath2.setActive(next);
      },
    });

    const particlesBath2 = new ShowerParticles({
      count: 600,
      headY: floorY + sHeadH - 0.02, // 3.95 + 2.2 - 0.02 = 6.13m
      floorY: floorY + 0.03,
      speed: 2.5,
      sprayRadius: 0.2,
      bathKey: 'bath2',
      stallBounds: {
        minX: -0.45,
        maxX: 0.45,
        minZ: -0.6,
        maxZ: 0.6,
        minY: floorY + 0.03,
        maxY: floorY + sHeadH,
      },
    });
    particlesBath2.group.position.set(-11.38, 0, showerZ);
    b2Group.add(particlesBath2.group);
    this.showers.bath2 = particlesBath2;

    this.group.add(b2Group);

    this.colliders.push({
      id: 'collider-bath-2-vanity',
      min: new THREE.Vector3(-9.25 - vD - 0.04, floorY, vZ - vW * 0.5),
      max: new THREE.Vector3(-9.25, floorY + vH, vZ + vW * 0.5),
      type: 'furniture',
    });
  }
}

export function buildBathrooms(options = {}) {
  const builder = new BathroomsBuilder(options);
  return builder.build();
}
