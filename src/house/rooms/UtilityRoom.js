import * as THREE from 'three';
import {
  getStoneTileTextures,
  getTimberTextures,
} from '../../assets/procedural/TextureGenerator.js';
import { gameStore } from '../../state/gameStore.js';

/**
 * UtilityRoomBuilder: Furnishes the Dedicated Laundry & Utility Room
 * (PRD §10.10, §14.2, Feature F28).
 *
 * Space bounds: minX: 4.95, maxX: 7.15, minZ: -8.75, maxZ: -6.35, floorY: 0.30.
 * Mandatory PRD Rule: SEPARATE washing machine AND SEPARATE tumble dryer!
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
    const tile = getStoneTileTextures('laundry', 2, 2);
    const walnut = getTimberTextures('walnut', 2, 2);

    return {
      tileTop: new THREE.MeshStandardMaterial({
        map: tile.map,
        bumpMap: tile.bumpMap,
        bumpScale: 0.03,
        roughness: 0.45,
      }),
      cabinetWood: new THREE.MeshStandardMaterial({
        map: walnut.map,
        bumpMap: walnut.bumpMap,
        bumpScale: 0.03,
        roughness: 0.6,
      }),
      applianceWhite: new THREE.MeshStandardMaterial({
        color: 0xf4f4f4,
        roughness: 0.25,
        metalness: 0.1,
      }),
      glassDoor: new THREE.MeshPhysicalMaterial({
        color: 0x1a2630,
        transmission: 0.6,
        transparent: true,
        opacity: 0.8,
        roughness: 0.15,
      }),
      chromeMetal: new THREE.MeshStandardMaterial({
        color: 0xdcdce0,
        roughness: 0.2,
        metalness: 0.9,
      }),
      basketWicker: new THREE.MeshStandardMaterial({
        color: 0x987d60,
        roughness: 0.9,
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
   * Builds separate front-loading washing machine AND separate tumble dryer.
   */
  buildAppliances(floorY) {
    const appGroup = new THREE.Group();
    appGroup.name = 'laundry-appliances';

    const unitW = 0.6; // 0.6m W per unit
    const unitD = 0.6; // 0.6m D
    const unitH = 0.85; // 0.85m standard under-counter height

    // Placed side-by-side along the west interior wall of laundry room
    const baseX = 5.35;
    const washerZ = -7.2;
    const dryerZ = -7.95;

    // 1. Separate Washing Machine (width: 0.6m)
    const washerGroup = new THREE.Group();
    washerGroup.name = 'washing-machine-unit';

    const washerBody = new THREE.Mesh(
      new THREE.BoxGeometry(unitD, unitH, unitW),
      this.materials.applianceWhite
    );
    washerBody.position.set(0, unitH * 0.5, 0);
    washerBody.castShadow = true;
    washerGroup.add(washerBody);

    // Front-loading circular tinted glass porthole door
    const wDoorMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.03, 24),
      this.materials.glassDoor
    );
    wDoorMesh.rotation.z = Math.PI / 2;
    wDoorMesh.position.set(unitD * 0.5 + 0.015, 0.42, 0);
    washerGroup.add(wDoorMesh);

    // Chrome door trim ring
    const wDoorRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.015, 8, 24),
      this.materials.chromeMetal
    );
    wDoorRing.rotation.y = Math.PI / 2;
    wDoorRing.position.set(unitD * 0.5 + 0.02, 0.42, 0);
    washerGroup.add(wDoorRing);

    // Program control rotary dial
    const wDial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16),
      this.materials.chromeMetal
    );
    wDial.rotation.z = Math.PI / 2;
    wDial.position.set(unitD * 0.5 + 0.01, 0.76, 0.12);
    washerGroup.add(wDial);

    // Status LED indicator
    const wLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 8, 8),
      new THREE.MeshBasicMaterial({
        color: gameStore.getState().appliances.washerRunning ? 0x00ff66 : 0x444444,
      })
    );
    wLed.position.set(unitD * 0.5 + 0.01, 0.76, -0.15);
    washerGroup.add(wLed);

    washerGroup.position.set(baseX, floorY, washerZ);
    appGroup.add(washerGroup);

    // Reactive listener for washer running state
    gameStore.subscribe((state) => {
      wLed.material.color.setHex(state.appliances.washerRunning ? 0x00ff66 : 0x444444);
    });

    // Make washing machine interactive
    this.interactables.push({
      id: 'appliance-washing-machine',
      label: 'Front-Loading Washing Machine',
      mesh: wDoorMesh,
      x: baseX + unitD * 0.5,
      y: floorY + 0.42,
      z: washerZ,
      range: 2.2,
      prompt: 'Toggle Washing Machine',
      onInteract: () => {
        gameStore.toggleAppliance('washerRunning');
      },
    });

    // 2. Separate Tumble Dryer (width: 0.6m)
    const dryerGroup = new THREE.Group();
    dryerGroup.name = 'tumble-dryer-unit';

    const dryerBody = new THREE.Mesh(
      new THREE.BoxGeometry(unitD, unitH, unitW),
      this.materials.applianceWhite
    );
    dryerBody.position.set(0, unitH * 0.5, 0);
    dryerBody.castShadow = true;
    dryerGroup.add(dryerBody);

    const dDoorMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.03, 24),
      this.materials.glassDoor
    );
    dDoorMesh.rotation.z = Math.PI / 2;
    dDoorMesh.position.set(unitD * 0.5 + 0.015, 0.42, 0);
    dryerGroup.add(dDoorMesh);

    const dDoorRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.015, 8, 24),
      this.materials.chromeMetal
    );
    dDoorRing.rotation.y = Math.PI / 2;
    dDoorRing.position.set(unitD * 0.5 + 0.02, 0.42, 0);
    dryerGroup.add(dDoorRing);

    const dDial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16),
      this.materials.chromeMetal
    );
    dDial.rotation.z = Math.PI / 2;
    dDial.position.set(unitD * 0.5 + 0.01, 0.76, 0.12);
    dryerGroup.add(dDial);

    const dLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 8, 8),
      new THREE.MeshBasicMaterial({
        color: gameStore.getState().appliances.dryerRunning ? 0xffaa00 : 0x444444,
      })
    );
    dLed.position.set(unitD * 0.5 + 0.01, 0.76, -0.15);
    dryerGroup.add(dLed);

    dryerGroup.position.set(baseX, floorY, dryerZ);
    appGroup.add(dryerGroup);

    gameStore.subscribe((state) => {
      dLed.material.color.setHex(state.appliances.dryerRunning ? 0xffaa00 : 0x444444);
    });

    this.interactables.push({
      id: 'appliance-tumble-dryer',
      label: 'Tumble Dryer Unit',
      mesh: dDoorMesh,
      x: baseX + unitD * 0.5,
      y: floorY + 0.42,
      z: dryerZ,
      range: 2.2,
      prompt: 'Toggle Tumble Dryer',
      onInteract: () => {
        gameStore.toggleAppliance('dryerRunning');
      },
    });

    this.group.add(appGroup);

    this.colliders.push({
      id: 'collider-laundry-appliances',
      min: new THREE.Vector3(baseX - unitD * 0.5, floorY, dryerZ - unitW * 0.5),
      max: new THREE.Vector3(baseX + unitD * 0.5 + 0.05, floorY + unitH, washerZ + unitW * 0.5),
      type: 'furniture',
    });
  }

  /**
   * Folding worktop, utility sink basin, and laundry hampers.
   */
  buildCountersAndSink(floorY) {
    const counterGroup = new THREE.Group();
    counterGroup.name = 'laundry-counters';

    const cntW = 0.65;
    const cntH = 0.9;
    const cntL = 1.6;

    // Continuous quartz countertop over folding station
    const topMesh = new THREE.Mesh(
      new THREE.BoxGeometry(cntW, 0.04, cntL),
      this.materials.tileTop
    );
    topMesh.position.set(6.75 - cntW * 0.5, cntH - 0.02, -7.5);
    topMesh.castShadow = true;
    counterGroup.add(topMesh);

    // Lower storage base
    const baseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(cntW, cntH - 0.04, cntL),
      this.materials.cabinetWood
    );
    baseMesh.position.set(6.75 - cntW * 0.5, (cntH - 0.04) * 0.5, -7.5);
    baseMesh.castShadow = true;
    counterGroup.add(baseMesh);

    // Utility deep stainless sink bowl
    const sinkMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.22, 0.45),
      this.materials.chromeMetal
    );
    sinkMesh.position.set(6.75 - cntW * 0.5, cntH - 0.11, -7.8);
    counterGroup.add(sinkMesh);

    // Chrome utility gooseneck tap
    const tapMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8),
      this.materials.chromeMetal
    );
    tapMesh.position.set(6.75 - 0.12, cntH + 0.15, -7.8);
    counterGroup.add(tapMesh);

    // Wicker laundry basket
    const basketMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.2, 0.55, 12),
      this.materials.basketWicker
    );
    basketMesh.position.set(6.75 - cntW * 0.5, 0.275, -6.6);
    basketMesh.castShadow = true;
    counterGroup.add(basketMesh);

    counterGroup.position.set(0, floorY, 0);
    this.group.add(counterGroup);

    this.colliders.push({
      id: 'collider-laundry-counter',
      min: new THREE.Vector3(6.75 - cntW, floorY, -8.3),
      max: new THREE.Vector3(6.75, floorY + cntH, -6.35),
      type: 'furniture',
    });
  }

  buildStorageCabinets(floorY) {
    const cabGroup = new THREE.Group();
    cabGroup.name = 'laundry-upper-cabinets';

    // Upper cabinetry above washing machines: Y = 1.55m to 2.25m
    const cabMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.7, 1.4),
      this.materials.cabinetWood
    );
    cabMesh.position.set(5.35, 1.9, -7.55);
    cabMesh.castShadow = true;
    cabGroup.add(cabMesh);

    cabGroup.position.set(0, floorY, 0);
    this.group.add(cabGroup);
  }
}

export function buildUtilityRoom(options = {}) {
  const builder = new UtilityRoomBuilder(options);
  return builder.build();
}
