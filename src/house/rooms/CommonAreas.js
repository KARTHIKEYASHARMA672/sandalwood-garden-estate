import * as THREE from 'three';
import {
  getTimberTextures,
  getFabricTextures,
} from '../../assets/procedural/TextureGenerator.js';

/**
 * CommonAreasBuilder: Furnishes Entrance Foyer, Upper Gallery Mezzanine,
 * Upper Linen Storage Closet, and Outdoor Balconies (PRD §7.8, §10.11, §10.12, Feature F29).
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
    const benchFabric = getFabricTextures('#D2C4B4', 2, 2);
    const linenWhite = getFabricTextures('#FAF7F0', 3, 3);
    const linenBeige = getFabricTextures('#E2D8C7', 3, 3);

    return {
      woodOak: new THREE.MeshStandardMaterial({
        map: oak.map,
        bumpMap: oak.bumpMap,
        bumpScale: 0.03,
        roughness: 0.55,
      }),
      woodWalnut: new THREE.MeshStandardMaterial({
        map: walnut.map,
        bumpMap: walnut.bumpMap,
        bumpScale: 0.03,
        roughness: 0.58,
      }),
      woodSandalwood: new THREE.MeshStandardMaterial({
        map: sandalwood.map,
        bumpMap: sandalwood.bumpMap,
        bumpScale: 0.03,
        roughness: 0.55,
      }),
      woodTeak: new THREE.MeshStandardMaterial({
        map: teak.map,
        bumpMap: teak.bumpMap,
        bumpScale: 0.04,
        roughness: 0.65,
      }),
      benchCushion: new THREE.MeshStandardMaterial({
        map: benchFabric.map,
        bumpMap: benchFabric.bumpMap,
        bumpScale: 0.03,
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
      brassMetal: new THREE.MeshStandardMaterial({
        color: 0xc8a265,
        roughness: 0.32,
        metalness: 0.85,
      }),
      darkBronze: new THREE.MeshStandardMaterial({
        color: 0x322822,
        roughness: 0.5,
        metalness: 0.75,
      }),
      planterFoliage: new THREE.MeshStandardMaterial({
        color: 0x3d6b42,
        roughness: 0.7,
      }),
      lampLight: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffe0b2,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      }),
    };
  }

  build() {
    this.buildEntranceFoyer();
    this.buildUpperGallery();
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
   * Entrance Foyer (Ground Floor: minX: 2.2, maxX: 4.8, minZ: 5.95, maxZ: 8.75, floorY: 0.30).
   * Features:
   * - Entrance shoe bench (1.20m W x 0.45m D, seat height 0.45m) with shoe shelf
   * - Coat rack / wall pegs and umbrella stand
   * - Slim console table with stone dish
   */
  buildEntranceFoyer() {
    const foyerGroup = new THREE.Group();
    foyerGroup.name = 'furniture-entrance-foyer';

    const floorY = 0.3;
    const bW = 1.2;
    const bD = 0.45;
    const bSeatH = 0.45;

    // 1. Entrance Shoe Bench along east wall of foyer: X = 4.45, Z = 7.4
    const benchGroup = new THREE.Group();
    benchGroup.name = 'foyer-shoe-bench';

    // Lower timber shoe shelf
    const shelfMesh = new THREE.Mesh(
      new THREE.BoxGeometry(bD, 0.025, bW),
      this.materials.woodWalnut
    );
    shelfMesh.position.set(0, 0.12, 0);
    shelfMesh.castShadow = true;
    benchGroup.add(shelfMesh);

    // Pairs of shoes on shelf (tan flats `#9B704F` and dark oxford shoes)
    const shoeMatTan = new THREE.MeshStandardMaterial({ color: 0x9b704f, roughness: 0.7 });
    const shoeMatDark = new THREE.MeshStandardMaterial({ color: 0x242426, roughness: 0.6 });
    for (let s = 0; s < 2; s++) {
      const sMesh1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.1), s === 0 ? shoeMatTan : shoeMatDark);
      sMesh1.position.set(0, 0.17, -0.3 + s * 0.4);
      benchGroup.add(sMesh1);

      const sMesh2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.1), s === 0 ? shoeMatTan : shoeMatDark);
      sMesh2.position.set(0, 0.17, -0.16 + s * 0.4);
      benchGroup.add(sMesh2);
    }

    // Upholstered bench seat cushion (seat height = 0.45m)
    const seatMesh = new THREE.Mesh(
      new THREE.BoxGeometry(bD, 0.08, bW),
      this.materials.benchCushion
    );
    seatMesh.position.set(0, bSeatH - 0.04, 0);
    seatMesh.castShadow = true;
    benchGroup.add(seatMesh);

    // 4 Solid walnut bench legs
    const legGeo = new THREE.BoxGeometry(0.04, bSeatH - 0.08, 0.04);
    for (const lx of [-bD * 0.5 + 0.04, bD * 0.5 - 0.04]) {
      for (const lz of [-bW * 0.5 + 0.04, bW * 0.5 - 0.04]) {
        const leg = new THREE.Mesh(legGeo, this.materials.woodWalnut);
        leg.position.set(lx, (bSeatH - 0.08) * 0.5, lz);
        leg.castShadow = true;
        benchGroup.add(leg);
      }
    }

    benchGroup.position.set(4.45, floorY, 7.4);
    foyerGroup.add(benchGroup);

    // Register seating position
    this.seats.push({
      id: 'foyer-shoe-bench',
      label: 'Entrance Shoe Bench',
      x: 4.45,
      y: floorY + bSeatH,
      z: 7.4,
      heading: -Math.PI / 2,
    });

    this.colliders.push({
      id: 'collider-foyer-bench',
      min: new THREE.Vector3(4.45 - bD * 0.5, floorY, 7.4 - bW * 0.5),
      max: new THREE.Vector3(4.45 + bD * 0.5, floorY + bSeatH, 7.4 + bW * 0.5),
      type: 'furniture',
    });

    // 2. Standing Coat Rack / Hall Tree near entrance door
    const rackGroup = new THREE.Group();
    rackGroup.name = 'foyer-coat-rack';
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.03, 1.85, 12),
      this.materials.darkBronze
    );
    pole.position.set(0, 0.925, 0);
    rackGroup.add(pole);

    const rackBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.22, 0.04, 16),
      this.materials.darkBronze
    );
    rackBase.position.set(0, 0.02, 0);
    rackGroup.add(rackBase);

    // 4 Coat hooks
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      const hook = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8),
        this.materials.brassMetal
      );
      hook.position.set(Math.cos(ang) * 0.06, 1.65, Math.sin(ang) * 0.06);
      hook.rotation.z = Math.cos(ang) * 0.4;
      hook.rotation.x = -Math.sin(ang) * 0.4;
      rackGroup.add(hook);
    }

    rackGroup.position.set(4.45, floorY, 8.4);
    foyerGroup.add(rackGroup);

    // 3. Slim Console Table along west boundary of foyer
    const conTable = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.85, 1.1),
      this.materials.woodSandalwood
    );
    conTable.position.set(2.55, floorY + 0.425, 6.7);
    conTable.castShadow = true;
    foyerGroup.add(conTable);

    this.group.add(foyerGroup);
  }

  /**
   * Upper Landing & Gallery Mezzanine (Upper Floor: minX: -6.6, maxX: 3.95, minZ: -8.75, maxZ: 1.7, floorY: 3.95).
   * Features:
   * - Reading nook: comfortable armchair, side table with book, tall arched floor lamp
   */
  buildUpperGallery() {
    const galGroup = new THREE.Group();
    galGroup.name = 'furniture-upper-gallery';

    const floorY = 3.95;
    const gx = 2.2;
    const gz = -2.0;

    // 1. Reading Armchair: 0.82m W x 0.82m D x 0.85m H, seat H = 0.44m
    const chairGroup = new THREE.Group();
    chairGroup.name = 'gallery-reading-armchair';

    const seatMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.44, 0.82),
      this.materials.benchCushion
    );
    seatMesh.position.set(0, 0.22, 0);
    seatMesh.castShadow = true;
    chairGroup.add(seatMesh);

    const backMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.42, 0.18),
      this.materials.benchCushion
    );
    backMesh.position.set(0, 0.44 + 0.21, 0.32);
    backMesh.castShadow = true;
    chairGroup.add(backMesh);

    chairGroup.position.set(gx, floorY, gz);
    chairGroup.rotation.y = -Math.PI / 4;
    galGroup.add(chairGroup);

    this.seats.push({
      id: 'gallery-reading-chair',
      label: 'Upper Gallery Reading Chair',
      x: gx,
      y: floorY + 0.44,
      z: gz,
      heading: 3 * Math.PI / 4,
    });

    // 2. Round side table with design magazine
    const tableMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.52, 16),
      this.materials.woodOak
    );
    tableMesh.position.set(gx - 0.7, floorY + 0.26, gz - 0.3);
    tableMesh.castShadow = true;
    galGroup.add(tableMesh);

    // 3. Tall standing floor lamp with warm illuminated shade
    const lampGroup = new THREE.Group();
    const lampPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.015, 1.6, 8),
      this.materials.brassMetal
    );
    lampPole.position.set(0, 0.8, 0);
    lampGroup.add(lampPole);

    const lampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.24, 0.28, 16, 1, true),
      this.materials.lampLight
    );
    lampShade.position.set(0, 1.5, 0);
    lampGroup.add(lampShade);

    lampGroup.position.set(gx + 0.65, floorY, gz + 0.4);
    galGroup.add(lampGroup);

    this.group.add(galGroup);
  }

  /**
   * Upper Linen Storage Closet (Upper Floor: minX: -1.8, maxX: -0.6, minZ: -1.7, maxZ: -0.2, floorY: 3.95).
   * Features:
   * - Deep oak shelving unit filled with stacks of neatly folded bed linens, towels, and blankets
   */
  buildLinenCloset() {
    const linenGroup = new THREE.Group();
    linenGroup.name = 'furniture-upper-linen';

    const floorY = 3.95;
    const lx = -1.2;
    const lz = -0.95;

    // Oak shelving unit: 1.10m W x 0.45m D x 2.20m H
    const sW = 1.1;
    const sD = 0.45;
    const sH = 2.2;

    const frameMesh = new THREE.Mesh(
      new THREE.BoxGeometry(sW, sH, sD),
      this.materials.woodOak
    );
    frameMesh.position.set(lx, floorY + sH * 0.5, lz);
    frameMesh.castShadow = true;
    linenGroup.add(frameMesh);

    // 4 Shelves filled with folded linens
    const shelfLevels = [0.4, 0.85, 1.3, 1.75];
    for (const sy of shelfLevels) {
      for (let i = 0; i < 3; i++) {
        const stackGeo = new THREE.BoxGeometry(0.28, 0.16, 0.36);
        const stackMesh = new THREE.Mesh(
          stackGeo,
          i % 2 === 0 ? this.materials.foldedLinenWhite : this.materials.foldedLinenBeige
        );
        stackMesh.position.set(lx - 0.32 + i * 0.32, floorY + sy + 0.08, lz);
        stackMesh.castShadow = true;
        linenGroup.add(stackMesh);
      }
    }

    this.group.add(linenGroup);
  }

  /**
   * Furnishings on Main Balcony (Balcony 1) and Secondary Balcony (Balcony 2).
   */
  buildBalconyFurnishings() {
    const balGroup = new THREE.Group();
    balGroup.name = 'furniture-balconies';

    const floorY = 3.95;

    // Balcony 2 (Secondary West: minX: -13.4, maxX: -12.0, minZ: 0.8, maxZ: 3.8)
    const b2x = -12.7;
    const b2z = 2.3;

    // Teak outdoor lounger chair
    const loungerGeo = new THREE.BoxGeometry(0.65, 0.35, 1.4);
    const lounger = new THREE.Mesh(loungerGeo, this.materials.woodTeak);
    lounger.position.set(b2x, floorY + 0.175, b2z);
    lounger.castShadow = true;
    balGroup.add(lounger);

    // Terracotta planter with green shrub
    const planterGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.38, 12);
    const planterMat = new THREE.MeshStandardMaterial({ color: 0xb56345, roughness: 0.85 });
    const planter = new THREE.Mesh(planterGeo, planterMat);
    planter.position.set(b2x, floorY + 0.19, 1.2);
    planter.castShadow = true;
    balGroup.add(planter);

    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 8),
      this.materials.planterFoliage
    );
    foliage.position.set(b2x, floorY + 0.48, 1.2);
    balGroup.add(foliage);

    this.group.add(balGroup);
  }
}

export function buildCommonAreas(options = {}) {
  const builder = new CommonAreasBuilder(options);
  return builder.build();
}
