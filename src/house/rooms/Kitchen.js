import * as THREE from 'three';
import {
  getTimberTextures,
  getStoneTileTextures,
} from '../../assets/procedural/TextureGenerator.js';
import {
  createChamferedBoxGeo,
  createLatheGeo,
  createGooseneckFaucet,
} from './RoomProps.js';

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
 * Coordinates keep `win-kitchen-west` (Z=5.95..7.35, Y=1.45..2.65) unobstructed so natural
 * daylight washes the sink & waterfall island, with open crockery hutch against north wall.
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
    const limestone = getStoneTileTextures('limestone', 3, 2);
    const backsplashStone = getStoneTileTextures('bathFloor', 4, 2);

    return {
      lowerCabinet: new THREE.MeshStandardMaterial({
        color: 0x80583b,
        map: walnut.map,
        normalMap: walnut.normalMap,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughness: 0.6,
        metalness: 0.05,
      }),
      cabinetDoorTrim: new THREE.MeshStandardMaterial({
        color: 0x6f4a30,
        map: walnut.map,
        normalMap: walnut.normalMap,
        roughness: 0.56,
        metalness: 0.05,
      }),
      upperCabinet: new THREE.MeshStandardMaterial({
        color: 0xede5d7,
        roughness: 0.7,
        metalness: 0.02,
      }),
      worktop: new THREE.MeshStandardMaterial({
        color: 0xe3dacb,
        map: limestone.map,
        normalMap: limestone.normalMap,
        normalScale: new THREE.Vector2(0.5, 0.5),
        roughness: 0.34,
        metalness: 0.04,
      }),
      backsplash: new THREE.MeshStandardMaterial({
        color: 0xe6dfd3,
        map: backsplashStone.map,
        normalMap: backsplashStone.normalMap,
        roughness: 0.45,
        metalness: 0.03,
      }),
      stainless: new THREE.MeshStandardMaterial({
        color: 0xdcdddf,
        roughness: 0.24,
        metalness: 0.92,
      }),
      darkSteel: new THREE.MeshStandardMaterial({
        color: 0x2c2e32,
        roughness: 0.42,
        metalness: 0.78,
      }),
      brushedBrass: new THREE.MeshStandardMaterial({
        color: 0xc8a265,
        roughness: 0.3,
        metalness: 0.88,
      }),
      cooktopBlack: new THREE.MeshStandardMaterial({
        color: 0x151618,
        roughness: 0.14,
        metalness: 0.45,
      }),
      burnerGrate: new THREE.MeshStandardMaterial({
        color: 0x2e2e30,
        roughness: 0.6,
        metalness: 0.7,
      }),
      porcelainWhite: new THREE.MeshStandardMaterial({
        color: 0xf6f4ef,
        roughness: 0.2,
        metalness: 0.04,
      }),
      stonewareSage: new THREE.MeshStandardMaterial({
        color: 0x6f7f6e,
        roughness: 0.4,
        metalness: 0.05,
      }),
      glassClear: new THREE.MeshPhysicalMaterial({
        color: 0xf4fafc,
        transmission: 0.88,
        opacity: 0.42,
        transparent: true,
        roughness: 0.08,
        ior: 1.5,
        depthWrite: false,
      }),
      ovenGlass: new THREE.MeshPhysicalMaterial({
        color: 0x16191e,
        roughness: 0.08,
        metalness: 0.25,
        reflectivity: 0.9,
      }),
      woodBeech: new THREE.MeshStandardMaterial({
        map: sandalwood.map,
        normalMap: sandalwood.normalMap,
        roughness: 0.65,
      }),
      castIron: new THREE.MeshStandardMaterial({
        color: 0x202124,
        roughness: 0.68,
        metalness: 0.65,
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
   * L-shaped cabinetry: West prep/cook/sink counter (Z=4.75..7.72, clear before Fridge at 8.22)
   * + North open crockery hutch & glass-front upper display (X=-10.35..-7.45, Z=8.35).
   */
  buildMainCabinetRun(floorY) {
    const cabGroup = new THREE.Group();
    cabGroup.name = 'kitchen-counter-run';

    const counterH = 0.9;
    const counterD = 0.65;
    const topThick = 0.04;
    const kickH = 0.09;

    // 1. West wall lower counter run (Z from 4.75 to 7.72, stops cleanly before Refrigerator)
    const westRunL = 2.97;
    const westX = -11.75 + counterD * 0.5 + 0.01;
    const westZ = 4.75 + westRunL * 0.5;

    // Recessed plinth toe-kick
    const toeKick = new THREE.Mesh(
      new THREE.BoxGeometry(counterD - 0.06, kickH, westRunL - 0.04),
      this.materials.darkSteel
    );
    toeKick.position.set(westX - 0.02, kickH * 0.5, westZ);
    cabGroup.add(toeKick);

    // Lower walnut cabinet carcass
    const westBase = new THREE.Mesh(
      new THREE.BoxGeometry(counterD, counterH - topThick - kickH, westRunL),
      this.materials.lowerCabinet
    );
    westBase.position.set(westX, kickH + (counterH - topThick - kickH) * 0.5, westZ);
    westBase.castShadow = true;
    westBase.receiveShadow = true;
    cabGroup.add(westBase);

    // Shaker cabinet fronts aligned around the stainless oven bay (cookZ = 5.35, width = 0.60)
    const lowerBays = [
      { z: 4.89, w: 0.26, isDishwasher: false },
      { z: 6.00, w: 0.58, isDishwasher: false },
      { z: 6.66, w: 0.60, isDishwasher: false },
      { z: 7.38, w: 0.56, isDishwasher: true },
    ];
    for (const bay of lowerBays) {
      const { z: dz, w: dw, isDishwasher } = bay;
      const panel = new THREE.Mesh(
        createChamferedBoxGeo(0.022, 0.72, dw, 0.006),
        isDishwasher ? this.materials.stainless : this.materials.cabinetDoorTrim
      );
      panel.position.set(westX + counterD * 0.5 + 0.008, kickH + 0.38, dz);
      panel.castShadow = true;
      cabGroup.add(panel);

      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.007, isDishwasher ? 0.34 : 0.16, 8),
        this.materials.brushedBrass
      );
      if (isDishwasher) {
        handle.rotation.x = Math.PI / 2;
        handle.position.set(westX + counterD * 0.5 + 0.026, kickH + 0.68, dz);
      } else {
        handle.position.set(westX + counterD * 0.5 + 0.026, kickH + 0.56, dz - dw * 0.3);
      }
      cabGroup.add(handle);
    }

    // Chamfered Limestone worktop slab
    const westTop = new THREE.Mesh(
      createChamferedBoxGeo(counterD + 0.03, topThick, westRunL + 0.02, 0.012),
      this.materials.worktop
    );
    westTop.position.set(westX + 0.015, counterH - topThick * 0.5, westZ);
    westTop.castShadow = true;
    westTop.receiveShadow = true;
    cabGroup.add(westTop);

    // Tiled Stone Backsplash along West wall (Y=0.90..1.45, splitting under window 5.95..7.35)
    const bsSouth = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.75, 1.2), this.materials.backsplash);
    bsSouth.position.set(-11.735, counterH + 0.375, 5.35);
    cabGroup.add(bsSouth);
    const bsMidLow = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.25, 1.42), this.materials.backsplash);
    bsMidLow.position.set(-11.735, counterH + 0.125, 6.65); // Stops well below win-kitchen-west sill (1.15m)
    cabGroup.add(bsMidLow);
    const bsNorth = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.75, 0.38), this.materials.backsplash);
    bsNorth.position.set(-11.735, counterH + 0.375, 7.55);
    cabGroup.add(bsNorth);

    // 2. North Wall Companion Credenza & Open Crockery Hutch (X = -10.50..-7.35, Z = 8.40)
    const nW = 2.9;
    const nD = 0.54;
    const nX = -8.85;
    const nZ = 8.75 - nD * 0.5 - 0.01;

    const northBase = new THREE.Mesh(
      new THREE.BoxGeometry(nW, counterH - topThick - kickH, nD),
      this.materials.lowerCabinet
    );
    northBase.position.set(nX, kickH + (counterH - topThick - kickH) * 0.5, nZ);
    northBase.castShadow = true;
    northBase.receiveShadow = true;
    cabGroup.add(northBase);

    const northTop = new THREE.Mesh(
      createChamferedBoxGeo(nW + 0.02, topThick, nD + 0.02, 0.012),
      this.materials.worktop
    );
    northTop.position.set(nX, counterH - topThick * 0.5, nZ - 0.01);
    northTop.castShadow = true;
    northTop.receiveShadow = true;
    cabGroup.add(northTop);

    // North Backsplash
    const northSplash = new THREE.Mesh(new THREE.BoxGeometry(nW, 0.56, 0.022), this.materials.backsplash);
    northSplash.position.set(nX, counterH + 0.28, 8.735);
    cabGroup.add(northSplash);

    // Open Crockery Display Shelving & Built-in Upper Glass Hutch on North wall (completely visible!)
    const shelfD = 0.34;
    const shelfZ = 8.75 - shelfD * 0.5 - 0.01;
    // Lower crockery shelf at Y = 1.46m (plates, bowls, tumblers sit visibly here!)
    const hutchShelfLow = new THREE.Mesh(
      createChamferedBoxGeo(nW, 0.03, shelfD, 0.008),
      this.materials.lowerCabinet
    );
    hutchShelfLow.position.set(nX, 1.46, shelfZ);
    hutchShelfLow.castShadow = true;
    hutchShelfLow.receiveShadow = true;
    cabGroup.add(hutchShelfLow);

    // Upper hutch shelf + crown cabinet at Y = 1.88m
    const hutchShelfMid = new THREE.Mesh(
      createChamferedBoxGeo(nW, 0.03, shelfD, 0.008),
      this.materials.lowerCabinet
    );
    hutchShelfMid.position.set(nX, 1.88, shelfZ);
    hutchShelfMid.castShadow = true;
    cabGroup.add(hutchShelfMid);

    // Three vertical walnut hutch uprights stopping cleanly below upperClosedTop (no Z-fighting)
    for (const ux of [nX - nW * 0.5 + 0.02, nX - 0.05, nX + nW * 0.5 - 0.02]) {
      const stile = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.41, shelfD - 0.006), this.materials.lowerCabinet);
      stile.position.set(ux, 1.67, shelfZ);
      stile.castShadow = true;
      cabGroup.add(stile);
    }
    const upperClosedTop = new THREE.Mesh(
      new THREE.BoxGeometry(nW, 0.44, shelfD),
      this.materials.upperCabinet
    );
    upperClosedTop.position.set(nX, 2.13, shelfZ);
    upperClosedTop.castShadow = true;
    cabGroup.add(upperClosedTop);

    // Distinct proud Shaker upper doors + brass pulls on upperClosedTop
    for (let u = 0; u < 4; u++) {
      const doorW = nW / 4 - 0.02;
      const dx = nX - nW * 0.5 + (u + 0.5) * (nW / 4);
      const uDoor = new THREE.Mesh(
        createChamferedBoxGeo(doorW, 0.4, 0.018, 0.005),
        this.materials.cabinetDoorTrim
      );
      uDoor.position.set(dx, 2.13, shelfZ - shelfD * 0.5 - 0.01);
      uDoor.castShadow = true;
      cabGroup.add(uDoor);

      const uKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.09, 8), this.materials.brushedBrass);
      uKnob.position.set(dx + (u % 2 === 0 ? doorW * 0.34 : -doorW * 0.34), 2.02, shelfZ - shelfD * 0.5 - 0.024);
      cabGroup.add(uKnob);
    }

    // Frameless glass doors across the East half of the crockery hutch
    const hutchGlass = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.4, 0.012), this.materials.glassClear);
    hutchGlass.position.set(nX + 0.72, 1.67, shelfZ - shelfD * 0.5);
    cabGroup.add(hutchGlass);

    // Under-cabinet 3000K warm LED strip recessed cleanly inside lower shelf
    const ledStrip = new THREE.Mesh(
      new THREE.BoxGeometry(nW - 0.14, 0.012, 0.024),
      new THREE.MeshBasicMaterial({ color: 0xffe8c8 })
    );
    ledStrip.position.set(nX, 1.442, shelfZ - shelfD * 0.25);
    cabGroup.add(ledStrip);

    cabGroup.position.set(0, floorY, 0);
    this.group.add(cabGroup);

    this.colliders.push({
      id: 'collider-kitchen-west-counter',
      min: new THREE.Vector3(-11.75, floorY, 4.75),
      max: new THREE.Vector3(-11.75 + counterD + 0.05, floorY + counterH, 4.75 + westRunL),
      type: 'furniture',
    });

    this.colliders.push({
      id: 'collider-kitchen-north-counter',
      min: new THREE.Vector3(nX - nW * 0.5, floorY, 8.75 - nD - 0.04),
      max: new THREE.Vector3(nX + nW * 0.5, floorY + counterH, 8.75),
      type: 'furniture',
    });
  }

  /**
   * Breakfast bar waterfall island counter (X=-8.95, Z=6.25) with 3 contoured barstools.
   */
  buildIslandAndBarstools(floorY) {
    const islandGroup = new THREE.Group();
    islandGroup.name = 'kitchen-island-breakfast-bar';

    const islandL = 2.25;
    const islandW = 0.92;
    const islandH = 0.9;
    const topThick = 0.05;

    const ix = -8.95;
    const iz = 6.25;

    // Island base cabinetry + waterfall leg sides
    const islandBase = new THREE.Mesh(
      new THREE.BoxGeometry(islandW - 0.24, islandH - topThick, islandL - 0.12),
      this.materials.lowerCabinet
    );
    islandBase.position.set(-0.12, (islandH - topThick) * 0.5, 0);
    islandBase.castShadow = true;
    islandBase.receiveShadow = true;
    islandGroup.add(islandBase);

    // Chamfered limestone breakfast bar waterfall countertop
    const islandTop = new THREE.Mesh(
      createChamferedBoxGeo(islandW, topThick, islandL, 0.015),
      this.materials.worktop
    );
    islandTop.position.set(0, islandH - topThick * 0.5, 0);
    islandTop.castShadow = true;
    islandTop.receiveShadow = true;
    islandGroup.add(islandTop);

    for (const wz of [-islandL * 0.5 + 0.025, islandL * 0.5 - 0.025]) {
      const waterfallSide = new THREE.Mesh(
        createChamferedBoxGeo(islandW, islandH - topThick, 0.048, 0.01),
        this.materials.worktop
      );
      waterfallSide.position.set(0, (islandH - topThick) * 0.5, wz);
      waterfallSide.castShadow = true;
      islandGroup.add(waterfallSide);
    }

    // 3 Contoured Saddle Breakfast Barstools (seat height = 0.65m per PRD test spec)
    const stoolSeatH = 0.65;
    const stoolZOffsets = [-0.62, 0.0, 0.62];

    for (let s = 0; s < 3; s++) {
      const stoolGroup = new THREE.Group();
      stoolGroup.name = `kitchen-barstool-${s + 1}`;

      // Sculpted ergonomic walnut saddle seat (top surface at Y = 0.65m)
      const seatMesh = new THREE.Mesh(
        createChamferedBoxGeo(0.34, 0.055, 0.42, 0.045),
        this.materials.lowerCabinet
      );
      seatMesh.position.set(0, stoolSeatH - 0.028, 0);
      seatMesh.castShadow = true;
      seatMesh.receiveShadow = true;
      stoolGroup.add(seatMesh);

      // Low contoured backrest rail
      const backMesh = new THREE.Mesh(
        createChamferedBoxGeo(0.045, 0.14, 0.36, 0.015),
        this.materials.lowerCabinet
      );
      backMesh.position.set(0.15, stoolSeatH + 0.09, 0);
      backMesh.castShadow = true;
      stoolGroup.add(backMesh);

      // Brass footrest ring & 4 splayed tapered legs
      const ringMesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.145, 0.011, 8, 20),
        this.materials.brushedBrass
      );
      ringMesh.rotateX(Math.PI / 2);
      ringMesh.position.set(0, 0.22, 0);
      stoolGroup.add(ringMesh);

      const stoolLegGeo = new THREE.CylinderGeometry(0.015, 0.01, stoolSeatH - 0.04, 10);
      for (let l = 0; l < 4; l++) {
        const ang = (l / 4) * Math.PI * 2 + Math.PI / 4;
        const leg = new THREE.Mesh(stoolLegGeo, this.materials.brushedBrass);
        leg.position.set(Math.cos(ang) * 0.125, (stoolSeatH - 0.04) * 0.5, Math.sin(ang) * 0.145);
        leg.rotation.x = -Math.sin(ang) * 0.08;
        leg.rotation.z = Math.cos(ang) * 0.08;
        leg.castShadow = true;
        stoolGroup.add(leg);
      }

      const stoolX = islandW * 0.5 + 0.3;
      const stoolZ = stoolZOffsets[s];
      stoolGroup.position.set(stoolX, 0, stoolZ);
      islandGroup.add(stoolGroup);

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
   * Under-mount stainless sink bowl centered beneath `win-kitchen-west` (Z=6.65)
   * with sculpted brushed-brass gooseneck faucet (0.35m high).
   */
  buildSinkAndFaucet(floorY) {
    const sinkGroup = new THREE.Group();
    sinkGroup.name = 'kitchen-sink-station';

    const sW = 0.55;
    const sD = 0.45;
    const sDepth = 0.2;
    const counterH = 0.9;

    const rimMesh = new THREE.Mesh(
      createChamferedBoxGeo(sD + 0.06, 0.015, sW + 0.06, 0.015),
      this.materials.stainless
    );
    rimMesh.position.set(0, counterH + 0.004, 0);
    sinkGroup.add(rimMesh);

    const bowlMesh = new THREE.Mesh(
      createChamferedBoxGeo(sD, sDepth, sW, 0.02),
      this.materials.stainless
    );
    bowlMesh.position.set(0, counterH - sDepth * 0.5, 0);
    sinkGroup.add(bowlMesh);

    const drainMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.012, 16),
      this.materials.stainless
    );
    drainMesh.position.set(0, counterH - sDepth + 0.008, 0);
    sinkGroup.add(drainMesh);

    // Curved TubeGeometry gooseneck faucet (0.35m height, brushed-brass)
    const tap = createGooseneckFaucet(this.materials.brushedBrass, 0.35, 0.16);
    tap.position.set(-sD * 0.5 + 0.02, counterH + 0.008, 0);
    sinkGroup.add(tap);

    // Ceramic dish soap pump beside faucet
    const soapPump = new THREE.Mesh(
      createLatheGeo([[0.032, 0], [0.038, 0.04], [0.034, 0.12], [0.014, 0.14], [0.006, 0.165]], 14),
      this.materials.stonewareSage
    );
    soapPump.position.set(-sD * 0.5 + 0.03, counterH + 0.01, -0.18);
    sinkGroup.add(soapPump);

    // Centered right beneath `win-kitchen-west` (Z = 6.65)
    sinkGroup.position.set(-11.75 + 0.65 * 0.5 + 0.01, floorY, 6.65);
    this.group.add(sinkGroup);
  }

  /**
   * Kitchen appliances: 4-burner induction cooktop + built-in oven + hood (Z=5.35, south of window),
   * French-door stainless Refrigerator (Z=8.22), and Built-in Microwave on North credenza.
   */
  buildAppliances(floorY) {
    const appGroup = new THREE.Group();
    appGroup.name = 'kitchen-appliances';

    const counterH = 0.9;
    const westX = -11.75 + 0.65 * 0.5 + 0.01;
    const cookZ = 5.35;

    // 1. 4-Burner Induction Cooktop: 0.75m x 0.52m
    const cooktop = new THREE.Mesh(
      createChamferedBoxGeo(0.52, 0.014, 0.75, 0.01),
      this.materials.cooktopBlack
    );
    cooktop.position.set(westX, counterH + 0.006, cookZ);
    cooktop.castShadow = true;
    appGroup.add(cooktop);

    const ringGeo = new THREE.RingGeometry(0.065, 0.088, 20);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x565a62 });
    const burnerOffsets = [
      [-0.12, -0.19],
      [-0.12, 0.19],
      [0.12, -0.19],
      [0.12, 0.19],
    ];
    for (const [bx, bz] of burnerOffsets) {
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(westX + bx, counterH + 0.014, cookZ + bz);
      appGroup.add(ring);
    }

    // 2. Built-in Oven beneath cooktop: stainless trim + reflective black oven window + bar handle
    const ovenFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.62, 0.6),
      this.materials.stainless
    );
    ovenFrame.position.set(westX, 0.45, cookZ);
    appGroup.add(ovenFrame);

    const ovenGlass = new THREE.Mesh(
      createChamferedBoxGeo(0.02, 0.4, 0.48, 0.01),
      this.materials.ovenGlass
    );
    ovenGlass.position.set(westX + 0.315, 0.42, cookZ);
    appGroup.add(ovenGlass);

    const ovenHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.5, 10),
      this.materials.stainless
    );
    ovenHandle.rotation.x = Math.PI / 2;
    ovenHandle.position.set(westX + 0.35, 0.64, cookZ);
    appGroup.add(ovenHandle);

    // 3. Sculpted Canopy Extractor Range Hood above cooktop (south of window)
    const hoodCanopy = new THREE.Mesh(
      createChamferedBoxGeo(0.56, 0.1, 0.82, 0.012),
      this.materials.stainless
    );
    hoodCanopy.position.set(westX, 1.72, cookZ);
    hoodCanopy.castShadow = true;
    appGroup.add(hoodCanopy);

    const flue = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 1.38, 0.34),
      this.materials.stainless
    );
    flue.position.set(westX, 2.46, cookZ);
    appGroup.add(flue);

    // 4. Built-in Stainless Microwave Oven on North Hutch Counter (X=-7.78, Z=8.46)
    const mwBody = new THREE.Mesh(
      createChamferedBoxGeo(0.52, 0.32, 0.38, 0.012),
      this.materials.stainless
    );
    mwBody.position.set(-7.78, counterH + 0.16, 8.46);
    mwBody.castShadow = true;
    appGroup.add(mwBody);
    const mwBezel = new THREE.Mesh(
      createChamferedBoxGeo(0.49, 0.28, 0.014, 0.008),
      this.materials.darkSteel
    );
    mwBezel.position.set(-7.78, counterH + 0.16, 8.268);
    appGroup.add(mwBezel);
    const mwDoor = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.014), this.materials.ovenGlass);
    mwDoor.position.set(-7.84, counterH + 0.16, 8.26);
    appGroup.add(mwDoor);
    const mwHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, 0.2, 8),
      this.materials.stainless
    );
    mwHandle.position.set(-7.68, counterH + 0.16, 8.25);
    appGroup.add(mwHandle);

    // 5. French-Door Stainless Refrigerator / Freezer at NW corner (Z = 8.22)
    const frW = 0.9;
    const frD = 0.74;
    const frH = 2.02;
    const frZ = 8.22;
    const frX = -11.75 + frD * 0.5 + 0.01;

    const fridge = new THREE.Mesh(
      createChamferedBoxGeo(frD, frH, frW, 0.018),
      this.materials.stainless
    );
    fridge.position.set(frX, frH * 0.5, frZ);
    fridge.castShadow = true;
    fridge.receiveShadow = true;
    appGroup.add(fridge);

    // Recessed ice/water dispenser niche & center vertical door gap strip
    const fridgeSeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, frH * 0.65, 0.012),
      this.materials.darkSteel
    );
    fridgeSeam.position.set(frX + frD * 0.5 + 0.002, frH * 0.66, frZ);
    appGroup.add(fridgeSeam);

    const dispenser = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.28, 0.16),
      this.materials.cooktopBlack
    );
    dispenser.position.set(frX + frD * 0.5 + 0.002, 1.24, frZ - 0.22);
    appGroup.add(dispenser);

    // French door handles
    for (const hZ of [frZ - 0.08, frZ + 0.08]) {
      const fHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.011, 0.78, 10),
        this.materials.stainless
      );
      fHandle.position.set(frX + frD * 0.5 + 0.032, 1.32, hZ);
      appGroup.add(fHandle);
    }

    appGroup.position.set(0, floorY, 0);
    this.group.add(appGroup);

    this.colliders.push({
      id: 'collider-kitchen-fridge',
      min: new THREE.Vector3(-11.75, floorY, frZ - frW * 0.5),
      max: new THREE.Vector3(-11.75 + frD + 0.05, floorY + frH, frZ + frW * 0.5),
      type: 'furniture',
    });
  }

  /**
   * Sculpted Cutlery & Prep Utensil Inventory (EXACTLY 37 items per PRD §10.6 & Tier 1 Spec).
   */
  buildUtensilInventory(floorY) {
    const utGroup = new THREE.Group();
    utGroup.name = 'kitchen-utensil-inventory';

    const counterH = 0.9;
    const trayBaseX = -8.95;
    const trayBaseZ = 5.65;

    // 1. Slotted Beechwood Cutlery Organizer Tray on island counter
    const trayMesh = new THREE.Mesh(
      createChamferedBoxGeo(0.44, 0.04, 0.66, 0.008),
      this.materials.woodBeech
    );
    trayMesh.position.set(trayBaseX, counterH + 0.02, trayBaseZ);
    trayMesh.castShadow = true;
    utGroup.add(trayMesh);

    const makeSpoonGroup = (len, widthScale = 1.0) => {
      const g = new THREE.Group();
      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.008 * widthScale, 0.004, len * 0.72),
        this.materials.stainless
      );
      handle.position.z = -len * 0.14;
      const bowl = new THREE.Mesh(
        new THREE.SphereGeometry(0.015 * widthScale, 10, 6),
        this.materials.stainless
      );
      bowl.scale.set(1, 0.35, 1.45);
      bowl.position.z = len * 0.34;
      g.add(handle, bowl);
      return g;
    };

    const makeForkGroup = (len) => {
      const g = new THREE.Group();
      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.009, 0.004, len * 0.65),
        this.materials.stainless
      );
      handle.position.z = -len * 0.16;
      const neck = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.004, 0.018),
        this.materials.stainless
      );
      neck.position.z = len * 0.18;
      g.add(handle, neck);
      for (const tx of [-0.007, 0, 0.007]) {
        const tine = new THREE.Mesh(
          new THREE.BoxGeometry(0.0025, 0.003, len * 0.25),
          this.materials.stainless
        );
        tine.position.set(tx, 0, len * 0.31);
        g.add(tine);
      }
      return g;
    };

    // 6 Teaspoons (0.14m)
    for (let i = 0; i < 6; i++) {
      const spoon = makeSpoonGroup(0.14, 0.78);
      spoon.position.set(trayBaseX - 0.15, counterH + 0.044, trayBaseZ - 0.19 + i * 0.028);
      spoon.userData = { type: 'utensil', name: 'Teaspoon', length: 0.14 };
      utGroup.add(spoon);
      this.utensilMeshes.push(spoon);
    }

    // 6 Tablespoons (0.19m)
    for (let i = 0; i < 6; i++) {
      const spoon = makeSpoonGroup(0.19, 1.0);
      spoon.position.set(trayBaseX - 0.05, counterH + 0.044, trayBaseZ - 0.18 + i * 0.03);
      spoon.userData = { type: 'utensil', name: 'Tablespoon', length: 0.19 };
      utGroup.add(spoon);
      this.utensilMeshes.push(spoon);
    }

    // 6 Dinner Forks (0.20m)
    for (let i = 0; i < 6; i++) {
      const fork = makeForkGroup(0.2);
      fork.position.set(trayBaseX + 0.05, counterH + 0.044, trayBaseZ - 0.18 + i * 0.03);
      fork.userData = { type: 'utensil', name: 'Dinner Fork', length: 0.2 };
      utGroup.add(fork);
      this.utensilMeshes.push(fork);
    }

    // 6 Dinner Knives (0.22m)
    for (let i = 0; i < 6; i++) {
      const knife = new THREE.Group();
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.006, 0.1, 8),
        this.materials.lowerCabinet
      );
      handle.rotation.x = Math.PI / 2;
      handle.position.z = -0.055;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.0025, 0.015, 0.12), this.materials.stainless);
      blade.position.z = 0.055;
      knife.add(handle, blade);
      knife.position.set(trayBaseX + 0.15, counterH + 0.044, trayBaseZ - 0.18 + i * 0.03);
      knife.userData = { type: 'utensil', name: 'Dinner Knife', length: 0.22 };
      utGroup.add(knife);
      this.utensilMeshes.push(knife);
    }

    // 2. Sculpted Ceramic Utensil Crock beside Cooktop (Z = 4.92)
    const crockX = -11.35;
    const crockZ = 4.92;
    const crockMesh = new THREE.Mesh(
      createLatheGeo([[0.068, 0], [0.078, 0.08], [0.072, 0.18], [0.062, 0.18], [0.06, 0.02]], 18),
      this.materials.porcelainWhite
    );
    crockMesh.position.set(crockX, counterH, crockZ);
    crockMesh.castShadow = true;
    utGroup.add(crockMesh);

    // 4 Beechwood Cooking Spoons (0.30m)
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      const g = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.007, 0.24, 8), this.materials.woodBeech);
      const scoop = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), this.materials.woodBeech);
      scoop.scale.set(1.0, 1.35, 0.35);
      scoop.position.y = 0.13;
      g.add(shaft, scoop);
      g.position.set(crockX + Math.cos(ang) * 0.028, counterH + 0.17, crockZ + Math.sin(ang) * 0.028);
      g.rotation.z = Math.cos(ang) * 0.18;
      g.rotation.x = Math.sin(ang) * 0.18;
      g.userData = { type: 'utensil', name: 'Cooking Spoon', length: 0.3 };
      utGroup.add(g);
      this.utensilMeshes.push(g);
    }

    // 2 Wooden Spatulas (0.30m)
    for (let i = 0; i < 2; i++) {
      const ang = i * Math.PI + Math.PI / 4;
      const g = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.21, 8), this.materials.woodBeech);
      const blade = new THREE.Mesh(createChamferedBoxGeo(0.052, 0.09, 0.008, 0.008), this.materials.woodBeech);
      blade.position.y = 0.125;
      g.add(shaft, blade);
      g.position.set(crockX + Math.cos(ang) * 0.032, counterH + 0.17, crockZ + Math.sin(ang) * 0.032);
      g.rotation.z = Math.cos(ang) * 0.16;
      g.userData = { type: 'utensil', name: 'Wooden Spatula', length: 0.3 };
      utGroup.add(g);
      this.utensilMeshes.push(g);
    }

    // 1 Ladle (0.32m)
    const ladle = new THREE.Group();
    const lShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.007, 0.28, 8), this.materials.stainless);
    const lCup = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 8, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), this.materials.stainless);
    lCup.position.y = -0.14;
    ladle.add(lShaft, lCup);
    ladle.position.set(crockX - 0.018, counterH + 0.19, crockZ - 0.015);
    ladle.rotation.z = 0.14;
    ladle.userData = { type: 'utensil', name: 'Ladle', length: 0.32 };
    utGroup.add(ladle);
    this.utensilMeshes.push(ladle);

    // 1 Slotted Spoon (0.30m)
    const slotted = makeSpoonGroup(0.3, 1.4);
    slotted.rotation.x = Math.PI / 2 - 0.14;
    slotted.position.set(crockX + 0.018, counterH + 0.18, crockZ + 0.018);
    slotted.userData = { type: 'utensil', name: 'Slotted Spoon', length: 0.3 };
    utGroup.add(slotted);
    this.utensilMeshes.push(slotted);

    // 1 Balloon Whisk (0.28m)
    const whisk = new THREE.Group();
    const wHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.01, 0.13, 10), this.materials.stainless);
    wHandle.position.y = 0.08;
    whisk.add(wHandle);
    for (let w = 0; w < 3; w++) {
      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0022, 6, 16), this.materials.stainless);
      loop.rotation.y = (w * Math.PI) / 3;
      loop.scale.set(0.8, 1.65, 0.8);
      loop.position.y = -0.03;
      whisk.add(loop);
    }
    whisk.position.set(crockX, counterH + 0.17, crockZ + 0.03);
    whisk.rotation.z = -0.14;
    whisk.userData = { type: 'utensil', name: 'Whisk', length: 0.28 };
    utGroup.add(whisk);
    this.utensilMeshes.push(whisk);

    // 1 Tongs (0.25m) beside cooktop at Z = 5.95
    const tongs = new THREE.Group();
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.014, 0.25), this.materials.stainless);
      arm.position.x = side * 0.01;
      arm.rotation.y = side * -0.05;
      tongs.add(arm);
    }
    tongs.position.set(-11.28, counterH + 0.012, 5.95);
    tongs.rotation.y = 0.25;
    tongs.userData = { type: 'utensil', name: 'Tongs', length: 0.25 };
    utGroup.add(tongs);
    this.utensilMeshes.push(tongs);

    // 1 Vegetable Peeler (0.16m)
    const peeler = new THREE.Mesh(
      createChamferedBoxGeo(0.024, 0.014, 0.16, 0.006),
      this.materials.stainless
    );
    peeler.position.set(-11.32, counterH + 0.01, 6.18);
    peeler.rotation.y = -0.3;
    peeler.userData = { type: 'utensil', name: 'Vegetable Peeler', length: 0.16 };
    utGroup.add(peeler);
    this.utensilMeshes.push(peeler);

    // 2 Acacia Chopping Boards (0.38m) leaning neatly in stand against west backsplash
    for (let i = 0; i < 2; i++) {
      const board = new THREE.Mesh(
        createChamferedBoxGeo(0.022, 0.26, 0.38, 0.018),
        this.materials.lowerCabinet
      );
      board.position.set(-11.66 + i * 0.032, counterH + 0.135, 5.98);
      board.rotation.z = -0.06;
      board.userData = { type: 'utensil', name: 'Chopping Board', length: 0.38 };
      board.castShadow = true;
      utGroup.add(board);
      this.utensilMeshes.push(board);
    }

    utGroup.position.set(0, floorY, 0);
    this.group.add(utGroup);
  }

  /**
   * Sculpted Domestic Cookware & Crockery Inventory (EXACTLY 41 items, 37 core non-Mug).
   */
  buildCookwareInventory(floorY) {
    const cwGroup = new THREE.Group();
    cwGroup.name = 'kitchen-cookware-inventory';

    const counterH = 0.9;
    const westX = -11.42;

    const makePanGroup = (rad, h, mat, handleLen = 0.18, doubleLoop = false) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        createLatheGeo([[0.001, 0], [rad * 0.88, 0], [rad, h * 0.95], [rad * 1.04, h], [rad * 0.92, h * 0.92], [rad * 0.82, 0.01]], 18),
        mat
      );
      body.castShadow = true;
      g.add(body);
      if (doubleLoop) {
        for (const s of [-1, 1]) {
          const ear = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.006, 6, 12), mat);
          ear.rotation.x = Math.PI / 2;
          ear.position.set(s * (rad + 0.015), h * 0.72, 0);
          g.add(ear);
        }
        const lid = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.96, 0.032, 18), this.materials.glassClear);
        lid.position.y = h + 0.014;
        const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.022, 10), this.materials.brushedBrass);
        knob.position.y = h + 0.035;
        g.add(lid, knob);
      } else {
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, handleLen, 8), mat);
        handle.rotation.z = Math.PI / 2 - 0.18;
        handle.position.set(rad + handleLen * 0.45, h * 0.78, 0);
        g.add(handle);
      }
      return g;
    };

    // 1. 2 Saucepans
    for (let i = 0; i < 2; i++) {
      const pan = makePanGroup(0.095, 0.105, this.materials.stainless, 0.16);
      pan.position.set(westX + 0.12, counterH + 0.014, 5.16 + i * 0.36);
      pan.rotation.y = 0.2 * (i === 0 ? 1 : -1);
      pan.userData = { type: 'cookware', name: 'Saucepan' };
      cwGroup.add(pan);
      this.cookwareMeshes.push(pan);
    }

    // 2. 1 Stockpot with glass lid & brass knob on burner
    const stockpot = makePanGroup(0.135, 0.17, this.materials.stainless, 0, true);
    stockpot.position.set(westX - 0.11, counterH + 0.014, 5.54);
    stockpot.userData = { type: 'cookware', name: 'Stockpot' };
    cwGroup.add(stockpot);
    this.cookwareMeshes.push(stockpot);

    // 3. 1 Cast-Iron Frying Pan on burner
    const fryingPan = makePanGroup(0.13, 0.048, this.materials.castIron, 0.18);
    fryingPan.position.set(westX - 0.11, counterH + 0.014, 5.16);
    fryingPan.rotation.y = -0.35;
    fryingPan.userData = { type: 'cookware', name: 'Frying Pan' };
    cwGroup.add(fryingPan);
    this.cookwareMeshes.push(fryingPan);

    // 4. 1 Deep Pan on North credenza
    const deepPan = makePanGroup(0.115, 0.075, this.materials.castIron, 0.17);
    deepPan.position.set(-9.75, counterH, 8.44);
    deepPan.rotation.y = Math.PI * 0.4;
    deepPan.userData = { type: 'cookware', name: 'Deep Pan' };
    cwGroup.add(deepPan);
    this.cookwareMeshes.push(deepPan);

    // 5. 2 Baking Trays leaning against North wall rack
    for (let i = 0; i < 2; i++) {
      const tray = new THREE.Mesh(
        createChamferedBoxGeo(0.32, 0.022, 0.42, 0.012),
        this.materials.darkSteel
      );
      tray.position.set(-10.12 + i * 0.04, counterH + 0.18, 8.58);
      tray.rotation.z = Math.PI / 2 - 0.08;
      tray.castShadow = true;
      tray.userData = { type: 'cookware', name: 'Baking Tray' };
      cwGroup.add(tray);
      this.cookwareMeshes.push(tray);
    }

    // 6. 1 Pressure Cooker on North counter
    const pressureCooker = makePanGroup(0.12, 0.16, this.materials.stainless, 0, true);
    pressureCooker.position.set(-9.3, counterH, 8.44);
    pressureCooker.userData = { type: 'cookware', name: 'Pressure Cooker' };
    cwGroup.add(pressureCooker);
    this.cookwareMeshes.push(pressureCooker);

    // 7. 1 Matte-Black Gooseneck Kettle on North counter
    const kettle = new THREE.Group();
    const kBody = new THREE.Mesh(
      createLatheGeo([[0.08, 0], [0.095, 0.02], [0.068, 0.14], [0.052, 0.16], [0.018, 0.18]], 16),
      this.materials.cooktopBlack
    );
    const kSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.014, 0.13, 10), this.materials.cooktopBlack);
    kSpout.position.set(0.085, 0.085, 0);
    kSpout.rotation.z = -0.68;
    const kHandle = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.009, 6, 14, Math.PI * 1.15), this.materials.woodBeech);
    kHandle.position.set(-0.075, 0.09, 0);
    kHandle.rotation.z = Math.PI * 0.45;
    kettle.add(kBody, kSpout, kHandle);
    kettle.position.set(-8.62, counterH, 8.44);
    kettle.userData = { type: 'cookware', name: 'Kettle' };
    cwGroup.add(kettle);
    this.cookwareMeshes.push(kettle);

    // 8-11: Open North Crockery Display Shelf at Y = 1.48, Z = 8.58 (fully unobstructed!)
    const shelfY = 1.478;
    const shelfZ = 8.56;
    const plateGeo = createLatheGeo([[0.001, 0], [0.09, 0.002], [0.13, 0.016], [0.125, 0.02], [0.085, 0.006]], 18);
    for (let i = 0; i < 6; i++) {
      const plate = new THREE.Mesh(plateGeo, this.materials.porcelainWhite);
      plate.position.set(-10.0, shelfY + i * 0.017, shelfZ);
      plate.castShadow = true;
      plate.userData = { type: 'cookware', name: 'Dinner Plate' };
      cwGroup.add(plate);
      this.cookwareMeshes.push(plate);
    }

    const sidePlateGeo = createLatheGeo([[0.001, 0], [0.068, 0.002], [0.095, 0.014], [0.092, 0.018], [0.065, 0.005]], 18);
    for (let i = 0; i < 6; i++) {
      const sp = new THREE.Mesh(sidePlateGeo, this.materials.porcelainWhite);
      sp.position.set(-9.65, shelfY + i * 0.015, shelfZ);
      sp.castShadow = true;
      sp.userData = { type: 'cookware', name: 'Side Plate' };
      cwGroup.add(sp);
      this.cookwareMeshes.push(sp);
    }

    const bowlGeo = createLatheGeo([[0.001, 0], [0.044, 0.003], [0.078, 0.052], [0.074, 0.055], [0.04, 0.008]], 16);
    for (let i = 0; i < 6; i++) {
      const bowl = new THREE.Mesh(bowlGeo, this.materials.porcelainWhite);
      bowl.position.set(-9.3, shelfY + i * 0.03, shelfZ);
      bowl.castShadow = true;
      bowl.userData = { type: 'cookware', name: 'Bowl' };
      cwGroup.add(bowl);
      this.cookwareMeshes.push(bowl);
    }

    const glassGeo = createLatheGeo([[0.028, 0], [0.032, 0.05], [0.035, 0.1], [0.032, 0.1], [0.026, 0.008]], 14);
    for (let i = 0; i < 6; i++) {
      const glass = new THREE.Mesh(glassGeo, this.materials.glassClear);
      glass.position.set(-8.65 + (i % 3) * 0.1, shelfY + Math.floor(i / 3) * 0.001, shelfZ - 0.04 + Math.floor(i / 3) * 0.09);
      glass.userData = { type: 'cookware', name: 'Drinking Glass' };
      cwGroup.add(glass);
      this.cookwareMeshes.push(glass);
    }

    // 12. 4 Ceramic Coffee Mugs with handles on island coffee corner
    const mugBodyGeo = createLatheGeo([[0.036, 0], [0.038, 0.088], [0.034, 0.09], [0.032, 0.008]], 14);
    for (let i = 0; i < 4; i++) {
      const mug = new THREE.Group();
      const body = new THREE.Mesh(mugBodyGeo, i % 2 === 0 ? this.materials.porcelainWhite : this.materials.stonewareSage);
      const ear = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.005, 6, 12, Math.PI), i % 2 === 0 ? this.materials.porcelainWhite : this.materials.stonewareSage);
      ear.rotation.z = -Math.PI / 2;
      ear.position.set(0.036, 0.045, 0);
      mug.add(body, ear);
      mug.position.set(-8.82 + (i % 2) * 0.11, counterH, 5.26 + Math.floor(i / 2) * 0.11);
      mug.castShadow = true;
      mug.userData = { type: 'cookware', name: 'Mug' };
      cwGroup.add(mug);
      this.cookwareMeshes.push(mug);
    }

    // 13. 2 Flared Ceramic Serving Bowls on Island center
    const sbGeo = createLatheGeo([[0.001, 0], [0.075, 0.005], [0.145, 0.075], [0.14, 0.08], [0.07, 0.012]], 18);
    for (let i = 0; i < 2; i++) {
      const sBowl = new THREE.Mesh(sbGeo, i === 0 ? this.materials.stonewareSage : this.materials.porcelainWhite);
      sBowl.position.set(-9.05, counterH, 6.45 + i * 0.34);
      sBowl.castShadow = true;
      sBowl.userData = { type: 'cookware', name: 'Serving Bowl' };
      cwGroup.add(sBowl);
      this.cookwareMeshes.push(sBowl);
    }

    // 14. 1 Sculpted Ceramic Teapot (Lathe belly + spout + arched handle + finial knob)
    const teapot = new THREE.Group();
    const tPotBody = new THREE.Mesh(
      createLatheGeo([[0.055, 0], [0.095, 0.06], [0.085, 0.12], [0.045, 0.14], [0.048, 0.148], [0.018, 0.165]], 18),
      this.materials.porcelainWhite
    );
    const tSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.016, 0.11, 10), this.materials.porcelainWhite);
    tSpout.position.set(0.088, 0.088, 0);
    tSpout.rotation.z = -0.68;
    const tHandle = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.009, 8, 14, Math.PI * 1.15), this.materials.porcelainWhite);
    tHandle.position.set(-0.078, 0.08, 0);
    tHandle.rotation.z = Math.PI * 0.45;
    teapot.add(tPotBody, tSpout, tHandle);
    teapot.position.set(-8.8, counterH, 6.95);
    teapot.userData = { type: 'cookware', name: 'Teapot' };
    cwGroup.add(teapot);
    this.cookwareMeshes.push(teapot);

    // 15. 1 Glass Water Jug Carafe
    const waterJug = new THREE.Group();
    const jBody = new THREE.Mesh(
      createLatheGeo([[0.058, 0], [0.072, 0.08], [0.045, 0.16], [0.052, 0.22], [0.049, 0.22], [0.042, 0.16]], 16),
      this.materials.glassClear
    );
    const jHandle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.007, 6, 14, Math.PI), this.materials.glassClear);
    jHandle.position.set(-0.054, 0.115, 0);
    jHandle.rotation.z = Math.PI * 0.5;
    waterJug.add(jBody, jHandle);
    waterJug.position.set(-8.78, counterH, 6.62);
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
