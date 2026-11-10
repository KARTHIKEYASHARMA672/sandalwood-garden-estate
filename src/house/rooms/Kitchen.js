import * as THREE from 'three';
import {
  getTimberTextures,
  getStoneTileTextures,
} from '../../assets/procedural/TextureGenerator.js';

/**
 * PRD §10.6 & Tier 1 Test Spec: Domestic Kitchen Utensils (Exactly 37 items).
 */
export const KITCHEN_UTENSIL_INVENTORY = [
  { name: 'Teaspoon', count: 6, length: 0.14, type: 'cutlery', finish: 'stainless' },
  { name: 'Tablespoon', count: 6, length: 0.19, type: 'cutlery', finish: 'stainless' },
  { name: 'Dinner Fork', count: 6, length: 0.2, type: 'cutlery', finish: 'stainless' },
  { name: 'Dinner Knife', count: 6, length: 0.22, type: 'cutlery', finish: 'stainless' },
  { name: 'Cooking Spoon', count: 4, length: 0.3, type: 'prep', finish: 'beechwood' },
  { name: 'Wooden Spatula', count: 2, length: 0.3, type: 'prep', finish: 'beechwood' },
  { name: 'Ladle', count: 1, length: 0.32, type: 'prep', finish: 'stainless' },
  { name: 'Slotted Spoon', count: 1, length: 0.3, type: 'prep', finish: 'stainless' },
  { name: 'Whisk', count: 1, length: 0.28, type: 'prep', finish: 'stainless-wire' },
  { name: 'Tongs', count: 1, length: 0.25, type: 'prep', finish: 'stainless' },
  { name: 'Vegetable Peeler', count: 1, length: 0.16, type: 'prep', finish: 'stainless' },
  { name: 'Chopping Board', count: 2, length: 0.38, type: 'prep', finish: 'acacia' },
];

/**
 * PRD §10.7 & Tier 1 Test Spec: Domestic Vessels and Cookware (41 items total, 37 core setting).
 */
export const KITCHEN_COOKWARE_INVENTORY = [
  { name: 'Saucepan', count: 2, finish: 'stainless' },
  { name: 'Stockpot', count: 1, finish: 'stainless' },
  { name: 'Frying Pan', count: 1, finish: 'cast-iron' },
  { name: 'Deep Pan', count: 1, finish: 'non-stick' },
  { name: 'Baking Tray', count: 2, finish: 'dark-steel' },
  { name: 'Pressure Cooker', count: 1, finish: 'brushed-aluminum' },
  { name: 'Kettle', count: 1, finish: 'matte-black' },
  { name: 'Dinner Plate', count: 6, finish: 'porcelain' },
  { name: 'Side Plate', count: 6, finish: 'porcelain' },
  { name: 'Bowl', count: 6, finish: 'porcelain' },
  { name: 'Drinking Glass', count: 6, finish: 'clear-glass' },
  { name: 'Mug', count: 4, finish: 'ceramic' },
  { name: 'Serving Bowl', count: 2, finish: 'ceramic' },
  { name: 'Teapot', count: 1, finish: 'ceramic' },
  { name: 'Water Jug', count: 1, finish: 'clear-glass' },
];

/**
 * KitchenBuilder: Furnishes the Kitchen & Breakfast Bar (PRD §10, Features F21 & F22).
 */
export class KitchenBuilder {
  constructor(options = {}) {
    this.options = options;
    this.group = new THREE.Group();
    this.group.name = 'furniture-kitchen';
    this.colliders = [];
    this.interactables = [];
    this.seats = [];
    this.utensilMeshes = [];
    this.cookwareMeshes = [];
    this.materials = this.createMaterials();
  }

  createMaterials() {
    const walnut = getTimberTextures('walnut', 2, 2);
    const sandalwood = getTimberTextures('sandalwood', 2, 2);
    const limestone = getStoneTileTextures('limestone', 2, 2);

    return {
      lowerCabinet: new THREE.MeshStandardMaterial({
        color: 0x80583b,
        map: walnut.map,
        bumpMap: walnut.bumpMap,
        bumpScale: 0.03,
        roughness: 0.65,
        metalness: 0.05,
      }),
      upperCabinet: new THREE.MeshStandardMaterial({
        color: 0xe8dfd0,
        roughness: 0.75,
        metalness: 0.02,
      }),
      worktop: new THREE.MeshStandardMaterial({
        color: 0xd8cdbb,
        map: limestone.map,
        bumpMap: limestone.bumpMap,
        bumpScale: 0.03,
        roughness: 0.4,
        metalness: 0.05,
      }),
      stainless: new THREE.MeshStandardMaterial({
        color: 0xd8dadc,
        roughness: 0.28,
        metalness: 0.9,
      }),
      brushedBrass: new THREE.MeshStandardMaterial({
        color: 0xc8a265,
        roughness: 0.32,
        metalness: 0.85,
      }),
      cooktopBlack: new THREE.MeshStandardMaterial({
        color: 0x1a1a1c,
        roughness: 0.2,
        metalness: 0.4,
      }),
      burnerGrate: new THREE.MeshStandardMaterial({
        color: 0x2e2e30,
        roughness: 0.6,
        metalness: 0.7,
      }),
      porcelainWhite: new THREE.MeshStandardMaterial({
        color: 0xf5f3ee,
        roughness: 0.25,
        metalness: 0.05,
      }),
      glassClear: new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.92,
        opacity: 1,
        transparent: true,
        roughness: 0.1,
        ior: 1.5,
      }),
      woodBeech: new THREE.MeshStandardMaterial({
        map: sandalwood.map,
        roughness: 0.7,
      }),
      castIron: new THREE.MeshStandardMaterial({
        color: 0x222224,
        roughness: 0.75,
        metalness: 0.6,
      }),
    };
  }

  build() {
    const floorY = 0.3; // Kitchen ground plinth datum

    this.buildMainCabinetRun(floorY);
    this.buildIslandAndBarstools(floorY);
    this.buildAppliances(floorY);
    this.buildSinkAndFaucet(floorY);
    this.buildUtensilInventory(floorY);
    this.buildCookwareInventory(floorY);

    // Compute total inventory stats
    const totalUtensilCount = KITCHEN_UTENSIL_INVENTORY.reduce((s, u) => s + u.count, 0);
    const totalCookwareCount = KITCHEN_COOKWARE_INVENTORY.reduce((s, c) => s + c.count, 0);
    const coreCookwareCount = totalCookwareCount - 4; // Excludes 4 mugs

    this.group.userData = {
      zoneId: 'kitchen',
      colliders: this.colliders,
      interactables: this.interactables,
      seats: this.seats,
      utensils: KITCHEN_UTENSIL_INVENTORY,
      cookware: KITCHEN_COOKWARE_INVENTORY,
      totalUtensilCount,
      totalCookwareCount,
      coreCookwareCount,
      utensilMeshes: this.utensilMeshes,
      cookwareMeshes: this.cookwareMeshes,
    };

    return this.group;
  }

  /**
   * Main L-shaped counter and cabinetry along north & west walls of Kitchen.
   * Kitchen internal bounds: minX: -11.75, maxX: -7.25, minZ: 4.55, maxZ: 8.75.
   */
  buildMainCabinetRun(floorY) {
    const cabGroup = new THREE.Group();
    cabGroup.name = 'kitchen-counter-run';

    const counterH = 0.9;
    const counterD = 0.65;
    const topThick = 0.04;

    // 1. West wall lower counter run (spanning Z from 4.75 to 8.55, length ~3.8m)
    const westRunL = 3.8;
    const westX = -11.75 + counterD * 0.5 + 0.02;
    const westZ = 4.75 + westRunL * 0.5;

    // Lower walnut cabinet body
    const westBase = new THREE.Mesh(
      new THREE.BoxGeometry(counterD, counterH - topThick, westRunL),
      this.materials.lowerCabinet
    );
    westBase.position.set(westX, (counterH - topThick) * 0.5, westZ);
    westBase.castShadow = true;
    westBase.receiveShadow = true;
    cabGroup.add(westBase);

    // Granite worktop slab
    const westTop = new THREE.Mesh(
      new THREE.BoxGeometry(counterD + 0.02, topThick, westRunL),
      this.materials.worktop
    );
    westTop.position.set(westX + 0.01, counterH - topThick * 0.5, westZ);
    westTop.castShadow = true;
    westTop.receiveShadow = true;
    cabGroup.add(westTop);

    // 2. Upper wall cabinets above west counter (underside height 1.45m above floor)
    const upperH = 0.8;
    const upperD = 0.35;
    const upperY = 1.45 + upperH * 0.5;
    const upperX = -11.75 + upperD * 0.5 + 0.02;

    const upperWest = new THREE.Mesh(
      new THREE.BoxGeometry(upperD, upperH, westRunL - 0.9), // leave space for fridge
      this.materials.upperCabinet
    );
    upperWest.position.set(upperX, upperY, westZ - 0.45);
    upperWest.castShadow = true;
    cabGroup.add(upperWest);

    // Under-cabinet 3000K warm LED lighting strip
    const ledStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.015, westRunL - 0.9),
      new THREE.MeshBasicMaterial({ color: 0xffe8c8 })
    );
    ledStrip.position.set(upperX + upperD * 0.4, 1.44, westZ - 0.45);
    cabGroup.add(ledStrip);

    cabGroup.position.set(0, floorY, 0);
    this.group.add(cabGroup);

    this.colliders.push({
      id: 'collider-kitchen-west-counter',
      min: new THREE.Vector3(-11.75, floorY, 4.75),
      max: new THREE.Vector3(-11.75 + counterD + 0.04, floorY + counterH, 4.75 + westRunL),
      type: 'furniture',
    });
  }

  /**
   * Breakfast bar island counter with 3 ergonomic barstools.
   */
  buildIslandAndBarstools(floorY) {
    const islandGroup = new THREE.Group();
    islandGroup.name = 'kitchen-island-breakfast-bar';

    const islandL = 2.4;
    const islandW = 0.95;
    const islandH = 0.9;
    const topThick = 0.05;

    // Island position in center of kitchen: X = -9.2, Z = 6.4
    const ix = -9.2;
    const iz = 6.4;

    // Island base cabinetry
    const islandBase = new THREE.Mesh(
      new THREE.BoxGeometry(islandW - 0.2, islandH - topThick, islandL - 0.2),
      this.materials.lowerCabinet
    );
    islandBase.position.set(-0.1, (islandH - topThick) * 0.5, 0);
    islandBase.castShadow = true;
    islandBase.receiveShadow = true;
    islandGroup.add(islandBase);

    // Cantilevered granite breakfast bar countertop
    const islandTop = new THREE.Mesh(
      new THREE.BoxGeometry(islandW, topThick, islandL),
      this.materials.worktop
    );
    islandTop.position.set(0, islandH - topThick * 0.5, 0);
    islandTop.castShadow = true;
    islandTop.receiveShadow = true;
    islandGroup.add(islandTop);

    // 3 Breakfast Barstools (seat height = 0.65m per test)
    const stoolSeatH = 0.65;
    const stoolZOffsets = [-0.65, 0.0, 0.65];

    for (let s = 0; s < 3; s++) {
      const stoolGroup = new THREE.Group();
      stoolGroup.name = `kitchen-barstool-${s + 1}`;

      // Curved upholstered saddle seat
      const seatMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.17, 0.06, 16),
        this.materials.lowerCabinet
      );
      seatMesh.position.set(0, stoolSeatH, 0);
      seatMesh.castShadow = true;
      stoolGroup.add(seatMesh);

      // Footrest ring
      const ringMesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.14, 0.012, 8, 16),
        this.materials.brushedBrass
      );
      ringMesh.rotateX(Math.PI / 2);
      ringMesh.position.set(0, 0.22, 0);
      stoolGroup.add(ringMesh);

      // 4 Tapered brass legs
      const stoolLegGeo = new THREE.CylinderGeometry(0.015, 0.01, stoolSeatH, 8);
      for (let l = 0; l < 4; l++) {
        const ang = (l / 4) * Math.PI * 2 + Math.PI / 4;
        const leg = new THREE.Mesh(stoolLegGeo, this.materials.brushedBrass);
        leg.position.set(Math.cos(ang) * 0.12, stoolSeatH * 0.5, Math.sin(ang) * 0.12);
        leg.rotation.x = -Math.sin(ang) * 0.08;
        leg.rotation.z = Math.cos(ang) * 0.08;
        leg.castShadow = true;
        stoolGroup.add(leg);
      }

      // Position along east overhang of island
      const stoolX = islandW * 0.5 + 0.28;
      const stoolZ = stoolZOffsets[s];
      stoolGroup.position.set(stoolX, 0, stoolZ);
      islandGroup.add(stoolGroup);

      // Register seat interactable
      this.seats.push({
        id: `barstool-${s + 1}`,
        label: `Kitchen Barstool ${s + 1}`,
        x: ix + stoolX,
        y: floorY + stoolSeatH,
        z: iz + stoolZ,
        heading: -Math.PI / 2,
      });
    }

    islandGroup.position.set(ix, floorY, iz);
    this.group.add(islandGroup);

    this.colliders.push({
      id: 'collider-kitchen-island',
      min: new THREE.Vector3(ix - islandW * 0.5, floorY, iz - islandL * 0.5),
      max: new THREE.Vector3(ix + islandW * 0.5, floorY + islandH, iz + islandL * 0.5),
      type: 'furniture',
    });
  }

  /**
   * Stainless steel sink bowl and gooseneck tap on west counter.
   */
  buildSinkAndFaucet(floorY) {
    const sinkGroup = new THREE.Group();
    sinkGroup.name = 'kitchen-sink-station';

    // Sink bowl spec: 0.55m W x 0.45m D x 0.20m depth
    const sW = 0.55;
    const sD = 0.45;
    const sDepth = 0.2;
    const counterH = 0.9;

    // Outer sink rim
    const rimMesh = new THREE.Mesh(
      new THREE.BoxGeometry(sD + 0.06, 0.015, sW + 0.06),
      this.materials.stainless
    );
    rimMesh.position.set(0, counterH + 0.005, 0);
    sinkGroup.add(rimMesh);

    // Inner bowl basin
    const bowlMesh = new THREE.Mesh(
      new THREE.BoxGeometry(sD, sDepth, sW),
      this.materials.stainless
    );
    bowlMesh.position.set(0, counterH - sDepth * 0.5, 0);
    sinkGroup.add(bowlMesh);

    // Drain strainer
    const drainMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.01, 16),
      this.materials.stainless
    );
    drainMesh.position.set(0, counterH - sDepth + 0.005, 0);
    sinkGroup.add(drainMesh);

    // Gooseneck tap: 0.35m height above countertop, brushed-brass finish
    const tapGroup = new THREE.Group();
    tapGroup.name = 'kitchen-gooseneck-tap';

    // Tap vertical riser: 0.24m H
    const riserGeo = new THREE.CylinderGeometry(0.018, 0.02, 0.24, 12);
    const riser = new THREE.Mesh(riserGeo, this.materials.brushedBrass);
    riser.position.set(-sD * 0.5 + 0.04, counterH + 0.12, 0);
    riser.castShadow = true;
    tapGroup.add(riser);

    // Gooseneck curve
    const curveGeo = new THREE.TorusGeometry(0.08, 0.016, 8, 16, Math.PI);
    const curveMesh = new THREE.Mesh(curveGeo, this.materials.brushedBrass);
    curveMesh.position.set(-sD * 0.5 + 0.12, counterH + 0.27, 0);
    curveMesh.rotation.z = -Math.PI / 2;
    curveMesh.castShadow = true;
    tapGroup.add(curveMesh);

    // Spout nozzle extending down: 0.07m
    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.012, 0.07, 12),
      this.materials.brushedBrass
    );
    nozzle.position.set(-sD * 0.5 + 0.2, counterH + 0.23, 0);
    nozzle.castShadow = true;
    tapGroup.add(nozzle);

    // Dual mixer lever handle
    const lever = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.08, 8),
      this.materials.brushedBrass
    );
    lever.position.set(-sD * 0.5 + 0.04, counterH + 0.16, 0.05);
    lever.rotation.x = Math.PI / 4;
    tapGroup.add(lever);

    sinkGroup.add(tapGroup);

    // Position sink along west counter at Z = 5.7m
    sinkGroup.position.set(-11.75 + 0.65 * 0.5 + 0.02, floorY, 5.7);
    this.group.add(sinkGroup);
  }

  /**
   * Kitchen appliances: 4-burner cooktop, built-in oven, range hood, and refrigerator.
   */
  buildAppliances(floorY) {
    const appGroup = new THREE.Group();
    appGroup.name = 'kitchen-appliances';

    const counterH = 0.9;
    const westX = -11.75 + 0.65 * 0.5 + 0.02;

    // 1. 4-Burner Induction Cooktop: 0.75m x 0.52m at Z = 7.2m
    const cookZ = 7.2;
    const cooktop = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.012, 0.75),
      this.materials.cooktopBlack
    );
    cooktop.position.set(westX, counterH + 0.006, cookZ);
    cooktop.castShadow = true;
    appGroup.add(cooktop);

    // 4 induction burner zone rings
    const ringGeo = new THREE.RingGeometry(0.065, 0.085, 16);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x444448 });
    const burnerOffsets = [
      [-0.12, -0.2],
      [-0.12, 0.2],
      [0.12, -0.2],
      [0.12, 0.2],
    ];
    for (const [bx, bz] of burnerOffsets) {
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(westX + bx, counterH + 0.013, cookZ + bz);
      appGroup.add(ring);
    }

    // 2. Built-in Oven beneath cooktop: 0.60m W x 0.60m H
    const oven = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.6, 0.6),
      this.materials.stainless
    );
    oven.position.set(westX, counterH * 0.5 - 0.08, cookZ);
    appGroup.add(oven);

    // 3. Extractor Range Hood above cooktop at Y = 1.65m
    const hoodGeo = new THREE.BoxGeometry(0.55, 0.12, 0.8);
    const hood = new THREE.Mesh(hoodGeo, this.materials.stainless);
    hood.position.set(westX, 1.7, cookZ);
    hood.castShadow = true;
    appGroup.add(hood);

    // Hood chimney flue rising to ceiling
    const flue = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 1.4, 0.35),
      this.materials.stainless
    );
    flue.position.set(westX, 2.45, cookZ);
    appGroup.add(flue);

    // 4. Large Refrigerator / Freezer: 0.90m W x 0.75m D x 1.90m H at Z = 8.2m
    const frW = 0.9;
    const frD = 0.75;
    const frH = 1.9;
    const frZ = 8.2;

    const fridge = new THREE.Mesh(
      new THREE.BoxGeometry(frD, frH, frW),
      this.materials.stainless
    );
    fridge.position.set(-11.75 + frD * 0.5 + 0.02, frH * 0.5, frZ);
    fridge.castShadow = true;
    fridge.receiveShadow = true;
    appGroup.add(fridge);

    // Stainless handles on fridge
    const fHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.7, 8),
      this.materials.brushedBrass
    );
    fHandle.position.set(-11.75 + frD + 0.04, 1.2, frZ - 0.15);
    appGroup.add(fHandle);

    appGroup.position.set(0, floorY, 0);
    this.group.add(appGroup);

    this.colliders.push({
      id: 'collider-kitchen-fridge',
      min: new THREE.Vector3(-11.75, floorY, frZ - frW * 0.5),
      max: new THREE.Vector3(-11.75 + frD + 0.04, floorY + frH, frZ + frW * 0.5),
      type: 'furniture',
    });
  }

  /**
   * Full Domestic Utensil Inventory (Exactly 37 items per PRD §10.6 & Feature F22).
   */
  buildUtensilInventory(floorY) {
    const utGroup = new THREE.Group();
    utGroup.name = 'kitchen-utensil-inventory';

    const counterH = 0.9;
    const trayBaseX = -9.2;
    const trayBaseZ = 6.0;

    // 1. Cutlery Organizer Tray on island counter: holds 24 place-setting utensils
    const trayGeo = new THREE.BoxGeometry(0.42, 0.04, 0.65);
    const trayMesh = new THREE.Mesh(trayGeo, this.materials.woodBeech);
    trayMesh.position.set(trayBaseX, counterH + 0.02, trayBaseZ);
    trayMesh.castShadow = true;
    utGroup.add(trayMesh);

    // Layout 6 Teaspoons (0.14m)
    for (let i = 0; i < 6; i++) {
      const spoon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.14, 8),
        this.materials.stainless
      );
      spoon.rotation.x = Math.PI / 2;
      spoon.position.set(trayBaseX - 0.15, counterH + 0.035, trayBaseZ - 0.2 + i * 0.025);
      spoon.userData = { type: 'utensil', name: 'Teaspoon', length: 0.14 };
      utGroup.add(spoon);
      this.utensilMeshes.push(spoon);
    }

    // Layout 6 Tablespoons (0.19m)
    for (let i = 0; i < 6; i++) {
      const spoon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.007, 0.19, 8),
        this.materials.stainless
      );
      spoon.rotation.x = Math.PI / 2;
      spoon.position.set(trayBaseX - 0.05, counterH + 0.035, trayBaseZ - 0.18 + i * 0.03);
      spoon.userData = { type: 'utensil', name: 'Tablespoon', length: 0.19 };
      utGroup.add(spoon);
      this.utensilMeshes.push(spoon);
    }

    // Layout 6 Dinner Forks (0.20m)
    for (let i = 0; i < 6; i++) {
      const fork = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.2, 8),
        this.materials.stainless
      );
      fork.rotation.x = Math.PI / 2;
      fork.position.set(trayBaseX + 0.05, counterH + 0.035, trayBaseZ - 0.18 + i * 0.03);
      fork.userData = { type: 'utensil', name: 'Dinner Fork', length: 0.2 };
      utGroup.add(fork);
      this.utensilMeshes.push(fork);
    }

    // Layout 6 Dinner Knives (0.22m)
    for (let i = 0; i < 6; i++) {
      const knife = new THREE.Mesh(
        new THREE.BoxGeometry(0.004, 0.015, 0.22),
        this.materials.stainless
      );
      knife.position.set(trayBaseX + 0.15, counterH + 0.035, trayBaseZ - 0.18 + i * 0.03);
      knife.userData = { type: 'utensil', name: 'Dinner Knife', length: 0.22 };
      utGroup.add(knife);
      this.utensilMeshes.push(knife);
    }

    // 2. Utensil Crock (Jar) near cooktop holding cooking & prep tools
    const crockX = -11.75 + 0.65 * 0.5 + 0.15;
    const crockZ = 6.6;

    const crockGeo = new THREE.CylinderGeometry(0.07, 0.065, 0.18, 16);
    const crockMesh = new THREE.Mesh(crockGeo, this.materials.porcelainWhite);
    crockMesh.position.set(crockX, counterH + 0.09, crockZ);
    crockMesh.castShadow = true;
    utGroup.add(crockMesh);

    // 4 Cooking Spoons (0.30m)
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      const spoon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.008, 0.3, 8),
        this.materials.woodBeech
      );
      spoon.position.set(crockX + Math.cos(ang) * 0.03, counterH + 0.18, crockZ + Math.sin(ang) * 0.03);
      spoon.rotation.z = Math.cos(ang) * 0.2;
      spoon.rotation.x = Math.sin(ang) * 0.2;
      spoon.userData = { type: 'utensil', name: 'Cooking Spoon', length: 0.3 };
      utGroup.add(spoon);
      this.utensilMeshes.push(spoon);
    }

    // 2 Wooden Spatulas (0.30m)
    for (let i = 0; i < 2; i++) {
      const ang = i * Math.PI + Math.PI / 4;
      const spat = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.3, 0.045),
        this.materials.woodBeech
      );
      spat.position.set(crockX + Math.cos(ang) * 0.035, counterH + 0.18, crockZ + Math.sin(ang) * 0.035);
      spat.rotation.z = Math.cos(ang) * 0.18;
      spat.userData = { type: 'utensil', name: 'Wooden Spatula', length: 0.3 };
      utGroup.add(spat);
      this.utensilMeshes.push(spat);
    }

    // 1 Ladle (0.32m)
    const ladle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, 0.32, 8),
      this.materials.stainless
    );
    ladle.position.set(crockX - 0.02, counterH + 0.19, crockZ - 0.02);
    ladle.rotation.z = 0.15;
    ladle.userData = { type: 'utensil', name: 'Ladle', length: 0.32 };
    utGroup.add(ladle);
    this.utensilMeshes.push(ladle);

    // 1 Slotted Spoon (0.30m)
    const slotted = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, 0.3, 8),
      this.materials.stainless
    );
    slotted.position.set(crockX + 0.02, counterH + 0.18, crockZ + 0.02);
    slotted.rotation.x = 0.16;
    slotted.userData = { type: 'utensil', name: 'Slotted Spoon', length: 0.3 };
    utGroup.add(slotted);
    this.utensilMeshes.push(slotted);

    // 1 Whisk (0.28m)
    const whisk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.02, 0.28, 8),
      this.materials.stainless
    );
    whisk.position.set(crockX, counterH + 0.17, crockZ + 0.035);
    whisk.rotation.z = -0.15;
    whisk.userData = { type: 'utensil', name: 'Whisk', length: 0.28 };
    utGroup.add(whisk);
    this.utensilMeshes.push(whisk);

    // 1 Pair of Tongs (0.25m) on counter beside stove
    const tongs = new THREE.Mesh(
      new THREE.BoxGeometry(0.015, 0.02, 0.25),
      this.materials.stainless
    );
    tongs.position.set(-11.75 + 0.65 * 0.5 + 0.12, counterH + 0.01, 7.7);
    tongs.rotation.y = 0.2;
    tongs.userData = { type: 'utensil', name: 'Tongs', length: 0.25 };
    utGroup.add(tongs);
    this.utensilMeshes.push(tongs);

    // 1 Vegetable Peeler (0.16m)
    const peeler = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.012, 0.16),
      this.materials.stainless
    );
    peeler.position.set(-11.75 + 0.65 * 0.5 - 0.1, counterH + 0.01, 5.2);
    peeler.rotation.y = -0.3;
    peeler.userData = { type: 'utensil', name: 'Vegetable Peeler', length: 0.16 };
    utGroup.add(peeler);
    this.utensilMeshes.push(peeler);

    // 2 Chopping Boards (0.38m length) standing in acacia stand against wall
    for (let i = 0; i < 2; i++) {
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.26, 0.38),
        this.materials.lowerCabinet
      );
      board.position.set(-11.75 + 0.08 + i * 0.03, counterH + 0.13, 5.0);
      board.userData = { type: 'utensil', name: 'Chopping Board', length: 0.38 };
      board.castShadow = true;
      utGroup.add(board);
      this.utensilMeshes.push(board);
    }

    utGroup.position.set(0, floorY, 0);
    this.group.add(utGroup);
  }

  /**
   * Full Domestic Cookware & Crockery Inventory (41 items total, 37 core setting per PRD §10.7).
   */
  buildCookwareInventory(floorY) {
    const cwGroup = new THREE.Group();
    cwGroup.name = 'kitchen-cookware-inventory';

    const counterH = 0.9;
    const westX = -11.75 + 0.65 * 0.5 + 0.02;

    // 1. 2 Saucepan on cooktop / prep counter
    for (let i = 0; i < 2; i++) {
      const pan = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.09, 0.11, 16),
        this.materials.stainless
      );
      pan.position.set(westX - 0.1, counterH + 0.055, 7.0 + i * 0.35);
      pan.castShadow = true;
      pan.userData = { type: 'cookware', name: 'Saucepan' };
      cwGroup.add(pan);
      this.cookwareMeshes.push(pan);
    }

    // 2. 1 Stockpot on rear cooktop burner
    const stockpot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.13, 0.18, 16),
      this.materials.stainless
    );
    stockpot.position.set(westX + 0.12, counterH + 0.09, 7.4);
    stockpot.castShadow = true;
    stockpot.userData = { type: 'cookware', name: 'Stockpot' };
    cwGroup.add(stockpot);
    this.cookwareMeshes.push(stockpot);

    // 3. 1 Frying Pan (cast iron skillet) on front cooktop burner
    const fryingPan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.11, 0.05, 16),
      this.materials.castIron
    );
    fryingPan.position.set(westX + 0.12, counterH + 0.025, 7.0);
    fryingPan.castShadow = true;
    fryingPan.userData = { type: 'cookware', name: 'Frying Pan' };
    cwGroup.add(fryingPan);
    this.cookwareMeshes.push(fryingPan);

    // 4. 1 Deep Pan on prep rack
    const deepPan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.1, 0.08, 16),
      this.materials.castIron
    );
    deepPan.position.set(westX, counterH + 0.04, 6.3);
    deepPan.castShadow = true;
    deepPan.userData = { type: 'cookware', name: 'Deep Pan' };
    cwGroup.add(deepPan);
    this.cookwareMeshes.push(deepPan);

    // 5. 2 Baking Tray in oven slot / counter rack
    for (let i = 0; i < 2; i++) {
      const tray = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.02, 0.44),
        this.materials.castIron
      );
      tray.position.set(-11.75 + 0.12 + i * 0.03, counterH + 0.18, 6.1);
      tray.rotation.x = Math.PI / 2;
      tray.userData = { type: 'cookware', name: 'Baking Tray' };
      cwGroup.add(tray);
      this.cookwareMeshes.push(tray);
    }

    // 6. 1 Pressure Cooker on prep station
    const pressureCooker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.11, 0.16, 16),
      this.materials.stainless
    );
    pressureCooker.position.set(westX - 0.12, counterH + 0.08, 6.3);
    pressureCooker.castShadow = true;
    pressureCooker.userData = { type: 'cookware', name: 'Pressure Cooker' };
    cwGroup.add(pressureCooker);
    this.cookwareMeshes.push(pressureCooker);

    // 7. 1 Kettle on island counter
    const kettle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.11, 0.15, 16),
      this.materials.castIron
    );
    kettle.position.set(-9.2 - 0.28, counterH + 0.075, 7.1);
    kettle.castShadow = true;
    kettle.userData = { type: 'cookware', name: 'Kettle' };
    cwGroup.add(kettle);
    this.cookwareMeshes.push(kettle);

    // 8. 6 Dinner Plates (stack of 6 porcelain plates on open upper shelf)
    const plateGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.012, 16);
    const shelfX = -11.75 + 0.35 * 0.5 + 0.02;
    for (let i = 0; i < 6; i++) {
      const plate = new THREE.Mesh(plateGeo, this.materials.porcelainWhite);
      plate.position.set(shelfX, 1.48 + i * 0.016, 5.2);
      plate.castShadow = true;
      plate.userData = { type: 'cookware', name: 'Dinner Plate' };
      cwGroup.add(plate);
      this.cookwareMeshes.push(plate);
    }

    // 9. 6 Side Plates (stack of 6 porcelain side plates)
    const sidePlateGeo = new THREE.CylinderGeometry(0.095, 0.08, 0.01, 16);
    for (let i = 0; i < 6; i++) {
      const sp = new THREE.Mesh(sidePlateGeo, this.materials.porcelainWhite);
      sp.position.set(shelfX, 1.48 + i * 0.014, 5.55);
      sp.castShadow = true;
      sp.userData = { type: 'cookware', name: 'Side Plate' };
      cwGroup.add(sp);
      this.cookwareMeshes.push(sp);
    }

    // 10. 6 Bowls (stack of 6 ceramic soup/salad bowls)
    const bowlGeo = new THREE.CylinderGeometry(0.08, 0.05, 0.05, 16);
    for (let i = 0; i < 6; i++) {
      const bowl = new THREE.Mesh(bowlGeo, this.materials.porcelainWhite);
      bowl.position.set(shelfX, 1.48 + i * 0.035, 5.9);
      bowl.castShadow = true;
      bowl.userData = { type: 'cookware', name: 'Bowl' };
      cwGroup.add(bowl);
      this.cookwareMeshes.push(bowl);
    }

    // 11. 6 Drinking Glasses (row of 6 clear tumblers on upper shelf)
    const glassGeo = new THREE.CylinderGeometry(0.035, 0.03, 0.1, 12);
    for (let i = 0; i < 6; i++) {
      const glass = new THREE.Mesh(glassGeo, this.materials.glassClear);
      glass.position.set(shelfX, 1.5 + 0.05, 6.25 + i * 0.08);
      glass.userData = { type: 'cookware', name: 'Drinking Glass' };
      cwGroup.add(glass);
      this.cookwareMeshes.push(glass);
    }

    // 12. 4 Coffee Mugs (on island counter or breakfast station)
    const mugGeo = new THREE.CylinderGeometry(0.04, 0.038, 0.09, 12);
    for (let i = 0; i < 4; i++) {
      const mug = new THREE.Mesh(mugGeo, this.materials.porcelainWhite);
      mug.position.set(-9.2 + 0.15, counterH + 0.045, 5.3 + i * 0.11);
      mug.castShadow = true;
      mug.userData = { type: 'cookware', name: 'Mug' };
      cwGroup.add(mug);
      this.cookwareMeshes.push(mug);
    }

    // 13. 2 Serving Bowls on island center
    for (let i = 0; i < 2; i++) {
      const sBowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.09, 0.08, 16),
        this.materials.porcelainWhite
      );
      sBowl.position.set(-9.2 - 0.1, counterH + 0.04, 6.7 + i * 0.35);
      sBowl.castShadow = true;
      sBowl.userData = { type: 'cookware', name: 'Serving Bowl' };
      cwGroup.add(sBowl);
      this.cookwareMeshes.push(sBowl);
    }

    // 14. 1 Ceramic Teapot
    const teapot = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 10),
      this.materials.porcelainWhite
    );
    teapot.position.set(-9.2 + 0.2, counterH + 0.08, 7.1);
    teapot.castShadow = true;
    teapot.userData = { type: 'cookware', name: 'Teapot' };
    cwGroup.add(teapot);
    this.cookwareMeshes.push(teapot);

    // 15. 1 Glass Water Jug
    const waterJug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.06, 0.22, 12),
      this.materials.glassClear
    );
    waterJug.position.set(-9.2 + 0.22, counterH + 0.11, 6.7);
    waterJug.castShadow = true;
    waterJug.userData = { type: 'cookware', name: 'Water Jug' };
    cwGroup.add(waterJug);
    this.cookwareMeshes.push(waterJug);

    cwGroup.position.set(0, floorY, 0);
    this.group.add(cwGroup);
  }
}

export function buildKitchen(options = {}) {
  const builder = new KitchenBuilder(options);
  return builder.build();
}
