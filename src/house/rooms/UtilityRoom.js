import * as THREE from 'three';
import {
  getStoneSlabTextures,
  getFurnitureWoodTextures,
  getFabricTextures,
} from '../../assets/procedural/TextureGenerator.js';
import {
  createChamferedBoxGeo,
  createLatheGeo,
  createGooseneckFaucet,
  createFoldedTowelStack,
  createContactAoMesh,
} from './RoomProps.js';
import { gameStore } from '../../state/gameStore.js';

/**
 * UtilityRoomBuilder: Furnishes the Dedicated Laundry & Utility Room
 * (PRD §10.10, §14.2, Feature F28).
 *
 * Space bounds: minX: 4.95, maxX: 7.15, minZ: -8.75, maxZ: -6.35, floorY: 0.30.
 * Mandatory PRD Rule & Tier 5 Invariant:
 * - SEPARATE washing machine (`z: -7.2`) AND SEPARATE tumble dryer (`z: -7.95`)!
 */
export class UtilityRoomBuilder {
  constructor(options = {}) {
    this.options = options;
    this.group = new THREE.Group();
    this.group.name = 'furniture-laundry-utility';
    this.colliders = [];
    this.interactables = [];
    this.materials = this.createMaterials();
  }

  createMaterials() {
    const slab = getStoneSlabTextures('limestone', 1, 1);
    const walnut = getFurnitureWoodTextures('walnut', 2, 2);
    const towelCream = getFabricTextures('#F2ECE1', 2, 2);
    const towelOlive = getFabricTextures('#7E8C75', 2, 2);

    return {
      tileTop: new THREE.MeshStandardMaterial({
        map: slab.map,
        normalMap: slab.normalMap,
        normalScale: new THREE.Vector2(0.42, 0.42),
        roughnessMap: slab.roughnessMap,
        roughness: 0.36,
        metalness: 0.03,
      }),
      cabinetWood: new THREE.MeshStandardMaterial({
        map: walnut.map,
        normalMap: walnut.normalMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughnessMap: walnut.roughnessMap,
        roughness: 0.54,
      }),
      applianceWhite: new THREE.MeshStandardMaterial({
        color: 0xf4f4f2,
        roughness: 0.22,
        metalness: 0.1,
      }),
      drumMetal: new THREE.MeshStandardMaterial({
        color: 0x5c6066,
        roughness: 0.35,
        metalness: 0.85,
      }),
      glassDoor: new THREE.MeshPhysicalMaterial({
        color: 0x1a2630,
        transmission: 0.58,
        transparent: true,
        opacity: 0.72,
        roughness: 0.12,
      }),
      chromeMetal: new THREE.MeshStandardMaterial({
        color: 0xdcdce0,
        roughness: 0.2,
        metalness: 0.92,
      }),
      basketWicker: new THREE.MeshStandardMaterial({
        color: 0x9b8062,
        roughness: 0.88,
      }),
      detergentBlue: new THREE.MeshStandardMaterial({
        color: 0x456e87,
        roughness: 0.4,
      }),
      detergentCream: new THREE.MeshStandardMaterial({
        color: 0xe8dfd0,
        roughness: 0.42,
      }),
      towelCream: new THREE.MeshStandardMaterial({
        map: towelCream.map,
        roughness: 0.92,
        envMapIntensity: 0.2,
      }),
      towelOlive: new THREE.MeshStandardMaterial({
        map: towelOlive.map,
        roughness: 0.92,
        envMapIntensity: 0.2,
      }),
    };
  }

  build() {
    const floorY = 0.3; // Ground plinth datum

    this.buildAppliances(floorY);
    this.buildCountersAndSink(floorY);
    this.buildStorageCabinets(floorY);

    this.group.userData = {
      zoneId: 'laundry-room',
      colliders: this.colliders,
      interactables: this.interactables,
    };

    return this.group;
  }

  /**
   * Builds sculpted separate front-loading washing machine (z=-7.2)
   * AND separate tumble dryer (z=-7.95) with continuous worktop bridge above.
   */
  buildAppliances(floorY) {
    const appGroup = new THREE.Group();
    appGroup.name = 'laundry-appliances';

    const unitW = 0.6;
    const unitD = 0.6;
    const unitH = 0.85;

    const baseX = 5.3;
    const washerZ = -7.2;
    const dryerZ = -7.95;

    const addFrontLoaderUnit = ({ name, z, hasDrawer, ledColorOn, isActive }) => {
      const unitGroup = new THREE.Group();
      unitGroup.name = name;

      const body = new THREE.Mesh(
        createChamferedBoxGeo(unitD, unitH, unitW, 0.015),
        this.materials.applianceWhite
      );
      body.position.set(0, unitH * 0.5, 0);
      body.castShadow = true;
      body.receiveShadow = true;
      unitGroup.add(body);

      // Internal stainless drum cavity + clothes paddles visible behind porthole
      const drumRim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.185, 0.185, 0.04, 20),
        this.materials.drumMetal
      );
      drumRim.rotation.z = Math.PI / 2;
      drumRim.position.set(unitD * 0.5 - 0.015, 0.42, 0);
      unitGroup.add(drumRim);

      const doorGlass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.195, 0.195, 0.025, 24),
        this.materials.glassDoor
      );
      doorGlass.rotation.z = Math.PI / 2;
      doorGlass.position.set(unitD * 0.5 + 0.012, 0.42, 0);
      unitGroup.add(doorGlass);

      const doorRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.2, 0.016, 10, 24),
        this.materials.chromeMetal
      );
      doorRing.rotation.y = Math.PI / 2;
      doorRing.position.set(unitD * 0.5 + 0.02, 0.42, 0);
      unitGroup.add(doorRing);

      // Door latch handle & top control fascia band
      const latch = new THREE.Mesh(
        createChamferedBoxGeo(0.02, 0.1, 0.028, 0.005),
        this.materials.chromeMetal
      );
      latch.position.set(unitD * 0.5 + 0.025, 0.42, 0.21);
      unitGroup.add(latch);

      if (hasDrawer) {
        const soapDrawer = new THREE.Mesh(
          createChamferedBoxGeo(0.015, 0.095, 0.16, 0.004),
          this.materials.applianceWhite
        );
        soapDrawer.position.set(unitD * 0.5 + 0.006, 0.76, -0.17);
        unitGroup.add(soapDrawer);
      }

      // Control panel fascia trim bezel separating dispenser drawer & cycle selector dial
      const fasciaBand = new THREE.Mesh(
        createChamferedBoxGeo(0.012, 0.11, unitW - 0.04, 0.004),
        this.materials.drumMetal
      );
      fasciaBand.position.set(unitD * 0.5 + 0.002, 0.76, 0);
      unitGroup.add(fasciaBand);

      const dial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.034, 0.024, 16),
        this.materials.chromeMetal
      );
      dial.rotation.z = Math.PI / 2;
      dial.position.set(unitD * 0.5 + 0.014, 0.76, 0.08);
      unitGroup.add(dial);

      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.009, 10, 8),
        new THREE.MeshBasicMaterial({ color: isActive ? ledColorOn : 0x444444 })
      );
      led.position.set(unitD * 0.5 + 0.014, 0.76, -0.02);
      unitGroup.add(led);

      unitGroup.position.set(baseX, floorY, z);
      appGroup.add(unitGroup);

      return { doorGlass, led };
    };

    const washerParts = addFrontLoaderUnit({
      name: 'washing-machine-unit',
      z: washerZ,
      hasDrawer: true,
      ledColorOn: 0x00ff66,
      isActive: gameStore.getState().appliances.washerRunning,
    });
    gameStore.subscribe((state) => {
      washerParts.led.material.color.setHex(state.appliances.washerRunning ? 0x00ff66 : 0x444444);
    });

    this.interactables.push({
      id: 'appliance-washing-machine',
      label: 'Front-Loading Washing Machine',
      mesh: washerParts.doorGlass,
      x: baseX + unitD * 0.5,
      y: floorY + 0.42,
      z: washerZ,
      range: 2.2,
      prompt: 'Toggle Washing Machine',
      onInteract: () => {
        gameStore.toggleAppliance('washerRunning');
      },
    });

    const dryerParts = addFrontLoaderUnit({
      name: 'tumble-dryer-unit',
      z: dryerZ,
      hasDrawer: false,
      ledColorOn: 0xffaa00,
      isActive: gameStore.getState().appliances.dryerRunning,
    });
    gameStore.subscribe((state) => {
      dryerParts.led.material.color.setHex(state.appliances.dryerRunning ? 0xffaa00 : 0x444444);
    });

    this.interactables.push({
      id: 'appliance-tumble-dryer',
      label: 'Tumble Dryer Unit',
      mesh: dryerParts.doorGlass,
      x: baseX + unitD * 0.5,
      y: floorY + 0.42,
      z: dryerZ,
      range: 2.2,
      prompt: 'Toggle Tumble Dryer',
      onInteract: () => {
        gameStore.toggleAppliance('dryerRunning');
      },
    });

    // Continuous Quartz Folding Countertop above Washer & Dryer
    const overTop = new THREE.Mesh(
      createChamferedBoxGeo(unitD + 0.04, 0.036, 1.48, 0.01),
      this.materials.tileTop
    );
    overTop.position.set(baseX + 0.01, floorY + unitH + 0.02, -7.575);
    overTop.castShadow = true;
    overTop.receiveShadow = true;
    appGroup.add(overTop);

    // Folded cotton towel stack & detergent bottle resting neatly on top of counter
    const counterTowels = createFoldedTowelStack([this.materials.towelCream, this.materials.towelOlive]);
    counterTowels.position.set(baseX + 0.02, floorY + unitH + 0.038, -7.2);
    appGroup.add(counterTowels);

    this.group.add(appGroup);

    this.colliders.push({
      id: 'collider-laundry-appliances',
      min: new THREE.Vector3(baseX - unitD * 0.5, floorY, dryerZ - unitW * 0.5),
      max: new THREE.Vector3(baseX + unitD * 0.5 + 0.05, floorY + unitH + 0.04, washerZ + unitW * 0.5),
      type: 'furniture',
    });
  }

  /**
   * East folding worktop (X = 6.72..7.14), deep utility sink + gooseneck faucet, and woven hamper.
   */
  buildCountersAndSink(floorY) {
    const counterGroup = new THREE.Group();
    counterGroup.name = 'laundry-counters';

    const cntW = 0.58;
    const cntH = 0.9;
    const cntL = 1.55;
    const cntX = 7.12 - cntW * 0.5;
    const cntZ = -7.65;

    const topMesh = new THREE.Mesh(
      createChamferedBoxGeo(cntW + 0.02, 0.04, cntL, 0.01),
      this.materials.tileTop
    );
    topMesh.position.set(cntX - 0.01, cntH - 0.02, cntZ);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    counterGroup.add(topMesh);

    const baseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(cntW, cntH - 0.04, cntL),
      this.materials.cabinetWood
    );
    baseMesh.position.set(cntX, (cntH - 0.04) * 0.5, cntZ);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    counterGroup.add(baseMesh);

    // Deep stainless utility sink + curved gooseneck tap
    const sinkMesh = new THREE.Mesh(
      createChamferedBoxGeo(0.42, 0.22, 0.46, 0.015),
      this.materials.chromeMetal
    );
    sinkMesh.position.set(cntX, cntH - 0.105, -7.85);
    counterGroup.add(sinkMesh);

    const tap = createGooseneckFaucet(this.materials.chromeMetal, 0.28, 0.13);
    tap.rotation.y = Math.PI;
    tap.position.set(7.12 - 0.08, cntH, -7.85);
    counterGroup.add(tap);

    // Woven Wicker Laundry Hamper with folded garments inside at Z = -6.62
    const basketG = new THREE.Group();
    const basketBody = new THREE.Mesh(
      createLatheGeo([[0.18, 0], [0.22, 0.25], [0.24, 0.52], [0.22, 0.52], [0.20, 0.25], [0.16, 0.02]], 16),
      this.materials.basketWicker
    );
    basketBody.castShadow = true;
    const basketRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.23, 0.018, 8, 20),
      this.materials.basketWicker
    );
    basketRim.rotation.x = Math.PI / 2;
    basketRim.position.y = 0.52;
    const linenPile = new THREE.Mesh(
      createChamferedBoxGeo(0.32, 0.14, 0.3, 0.04),
      this.materials.towelCream
    );
    linenPile.position.y = 0.45;
    linenPile.rotation.y = 0.25;
    basketG.add(basketBody, basketRim, linenPile);
    basketG.add(createContactAoMesh(0.56, 0.56, 0.24));
    basketG.position.set(cntX, 0, -6.62);
    counterGroup.add(basketG);

    counterGroup.position.set(0, floorY, 0);
    this.group.add(counterGroup);

    this.colliders.push({
      id: 'collider-laundry-counter',
      min: new THREE.Vector3(cntX - cntW * 0.5 - 0.02, floorY, -8.45),
      max: new THREE.Vector3(7.14, floorY + cntH, -6.4),
      type: 'furniture',
    });
  }

  /**
   * Open walnut storage shelving above machines with detergent jugs + louvered exhaust vent grille.
   */
  buildStorageCabinets(floorY) {
    const cabGroup = new THREE.Group();
    cabGroup.name = 'laundry-upper-cabinets';

    const sx = 5.15;
    const sz = -7.58;
    const shelfW = 0.32;
    const shelfL = 1.45;

    // Open carcass: two open shelves + side stiles + top shelf
    for (const sy of [1.48, 1.88, 2.26]) {
      const board = new THREE.Mesh(
        createChamferedBoxGeo(shelfW, 0.032, shelfL, 0.008),
        this.materials.cabinetWood
      );
      board.position.set(sx, sy, sz);
      board.castShadow = true;
      cabGroup.add(board);
    }
    for (const sOffset of [-shelfL * 0.48, shelfL * 0.48]) {
      const stile = new THREE.Mesh(new THREE.BoxGeometry(shelfW, 0.82, 0.032), this.materials.cabinetWood);
      stile.position.set(sx, 1.87, sz + sOffset);
      stile.castShadow = true;
      cabGroup.add(stile);
    }

    // Detergent bottles & folded linen stack visibly displayed on open lower shelf (Y=1.50)
    const detJug = new THREE.Mesh(
      createLatheGeo([[0.055, 0], [0.068, 0.08], [0.062, 0.2], [0.025, 0.23], [0.022, 0.26]], 14),
      this.materials.detergentBlue
    );
    detJug.position.set(sx + 0.03, 1.495, sz - 0.45);
    const softJug = new THREE.Mesh(
      createLatheGeo([[0.048, 0], [0.058, 0.07], [0.052, 0.17], [0.02, 0.2]], 14),
      this.materials.detergentCream
    );
    softJug.position.set(sx + 0.03, 1.495, sz - 0.25);
    cabGroup.add(detJug, softJug);

    const shelfTowels = createFoldedTowelStack(
      [this.materials.towelCream, this.materials.towelOlive, this.materials.towelCream],
      [0.24, 0.22, 0.2],
      [0.055, 0.05, 0.045],
      0.34
    );
    shelfTowels.position.set(sx + 0.02, 1.495, sz + 0.28);
    cabGroup.add(shelfTowels);

    // Louvered exhaust vent grille high on East wall
    const ventGroup = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.24, 0.34), this.materials.chromeMetal);
    ventGroup.add(frame);
    for (let v = 0; v < 5; v++) {
      const louver = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.012, 0.3), this.materials.drumMetal);
      louver.position.set(-0.005, -0.08 + v * 0.04, 0);
      louver.rotation.z = 0.35;
      ventGroup.add(louver);
    }
    ventGroup.position.set(7.135, 2.55, -7.6);
    cabGroup.add(ventGroup);

    cabGroup.position.set(0, floorY, 0);
    this.group.add(cabGroup);
  }
}

export function buildUtilityRoom(options = {}) {
  const builder = new UtilityRoomBuilder(options);
  return builder.build();
}
