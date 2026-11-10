import * as THREE from 'three';
import {
  getStoneTileTextures,
  getTimberTextures,
} from '../../assets/procedural/TextureGenerator.js';
import { ShowerParticles } from './ShowerParticles.js';
import { gameStore } from '../../state/gameStore.js';

/**
 * BathroomsBuilder: Furnishes Ensuite Bathroom 1 (Ground Floor) and
 * Ensuite Bathroom 2 (Upper Floor) per PRD §10.5, §10.9, Features F25 & F27.
 *
 * Implements:
 * - Floating vanity counters (0.90m W x 0.55m D x 0.85m H) with vessel washbasins
 * - Concealed cistern wall-hung toilets (0.40m W x 0.65m D, seat height 0.42m)
 * - Walk-in glass shower stalls (1.20m x 0.90m) with rain showerhead at 2.20m above floor datum
 * - Shower toggle state synchronized with reactive gameStore (`bath1` & `bath2`)
 * - Integrated animated shower water particle spray simulation (ShowerParticles)
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

    return {
      bathStone: new THREE.MeshStandardMaterial({
        map: bathStone.map,
        bumpMap: bathStone.bumpMap,
        bumpScale: 0.03,
        roughness: 0.5,
      }),
      vanityWood: new THREE.MeshStandardMaterial({
        map: walnut.map,
        bumpMap: walnut.bumpMap,
        bumpScale: 0.03,
        roughness: 0.55,
      }),
      porcelainWhite: new THREE.MeshStandardMaterial({
        color: 0xf6f6f4,
        roughness: 0.22,
        metalness: 0.05,
      }),
      chromeMetal: new THREE.MeshStandardMaterial({
        color: 0xe6e6e8,
        roughness: 0.2,
        metalness: 0.95,
      }),
      glassScreen: new THREE.MeshPhysicalMaterial({
        color: 0xeaf2f8,
        transmission: 0.94,
        opacity: 1,
        transparent: true,
        roughness: 0.08,
        ior: 1.52,
      }),
      mirror: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.05,
        metalness: 0.98,
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
   * Ensuite Bathroom 1 (Ground Floor: minX: 9.35, maxX: 11.75, minZ: 2.0, maxZ: 4.6, floorY: 0.30).
   */
  buildBathroom1() {
    const b1Group = new THREE.Group();
    b1Group.name = 'furniture-bathroom-1';

    const floorY = 0.3;

    // 1. Floating Vanity Counter: 0.90m W x 0.55m D x 0.85m H
    const vW = 0.9;
    const vD = 0.55;
    const vH = 0.85;

    // Suspended vanity drawer cabinet
    const vanityCabinet = new THREE.Mesh(
      new THREE.BoxGeometry(vD, 0.45, vW),
      this.materials.vanityWood
    );
    vanityCabinet.position.set(11.75 - vD * 0.5 - 0.02, floorY + 0.55, 2.5);
    vanityCabinet.castShadow = true;
    b1Group.add(vanityCabinet);

    // Stone vanity countertop slab
    const vanityTop = new THREE.Mesh(
      new THREE.BoxGeometry(vD + 0.02, 0.04, vW + 0.02),
      this.materials.bathStone
    );
    vanityTop.position.set(11.75 - vD * 0.5 - 0.01, floorY + vH - 0.02, 2.5);
    vanityTop.castShadow = true;
    b1Group.add(vanityTop);

    // Vessel washbasin: oval ceramic bowl on top
    const basinMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.16, 0.12, 16),
      this.materials.porcelainWhite
    );
    basinMesh.position.set(11.75 - vD * 0.5, floorY + vH + 0.06, 2.5);
    basinMesh.castShadow = true;
    b1Group.add(basinMesh);

    // Chrome mixer faucet
    const faucet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.22, 12),
      this.materials.chromeMetal
    );
    faucet.position.set(11.75 - 0.12, floorY + vH + 0.11, 2.5);
    b1Group.add(faucet);

    // Backlit Vanity Mirror: 0.80m W x 0.90m H
    const mirrorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.9, 0.8),
      this.materials.mirror
    );
    mirrorMesh.position.set(11.75 - 0.02, floorY + 1.5, 2.5);
    b1Group.add(mirrorMesh);

    // 2. Wall-hung toilet with concealed cistern: 0.40m W x 0.65m D, seat height 0.42m
    const tW = 0.4;
    const tD = 0.65;
    const tSeatH = 0.42;

    const toiletBody = new THREE.Mesh(
      new THREE.BoxGeometry(tD, tSeatH - 0.08, tW),
      this.materials.porcelainWhite
    );
    toiletBody.position.set(11.75 - tD * 0.5 - 0.02, floorY + 0.08 + (tSeatH - 0.08) * 0.5, 3.4);
    toiletBody.castShadow = true;
    b1Group.add(toiletBody);

    const toiletLid = new THREE.Mesh(
      new THREE.BoxGeometry(tD, 0.03, tW),
      this.materials.porcelainWhite
    );
    toiletLid.position.set(11.75 - tD * 0.5 - 0.02, floorY + tSeatH - 0.015, 3.4);
    b1Group.add(toiletLid);

    // Concealed cistern flush actuator plate on wall
    const flushPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.14, 0.2),
      this.materials.chromeMetal
    );
    flushPlate.position.set(11.75 - 0.01, floorY + 0.85, 3.4);
    b1Group.add(flushPlate);

    // 3. Walk-in Shower Stall (1.20m x 0.90m) with overhead rain showerhead (2.20m H)
    const sL = 1.2;
    const sW = 0.9;
    const sHeadH = 2.2; // above floorY (total Y = 0.3 + 2.2 = 2.5m)
    const showerX = 10.1;
    const showerZ = 4.1;

    // Shower tray plinth
    const trayGeo = new THREE.BoxGeometry(sW, 0.03, sL);
    const trayMesh = new THREE.Mesh(trayGeo, this.materials.bathStone);
    trayMesh.position.set(showerX, floorY + 0.015, showerZ);
    trayMesh.receiveShadow = true;
    b1Group.add(trayMesh);

    // Frameless tempered glass enclosure screen (2.0m high, 0.8m wide)
    const glassScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 2.0, 0.85),
      this.materials.glassScreen
    );
    glassScreen.position.set(showerX - sW * 0.5, floorY + 1.0, showerZ - 0.15);
    glassScreen.castShadow = true;
    b1Group.add(glassScreen);

    // Chrome shower column riser and overhead rain disc
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, sHeadH, 8),
      this.materials.chromeMetal
    );
    pipe.position.set(showerX, floorY + sHeadH * 0.5, showerZ + sL * 0.5 - 0.03);
    b1Group.add(pipe);

    // Arm extending forward: 0.35m
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.35, 8),
      this.materials.chromeMetal
    );
    arm.rotation.x = Math.PI / 2;
    arm.position.set(showerX, floorY + sHeadH, showerZ + sL * 0.5 - 0.18);
    b1Group.add(arm);

    // Rain showerhead disc: 0.24m diameter at Y = 2.2m above floor
    const showerHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.02, 16),
      this.materials.chromeMetal
    );
    showerHead.position.set(showerX, floorY + sHeadH - 0.01, showerZ + sL * 0.5 - 0.35);
    b1Group.add(showerHead);

    // Chrome mixer valve handle (clickable to toggle shower)
    const mixerHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.12, 0.08),
      this.materials.chromeMetal
    );
    mixerHandle.position.set(showerX, floorY + 1.1, showerZ + sL * 0.5 - 0.02);
    b1Group.add(mixerHandle);

    // Register mixer handle interactable
    this.interactables.push({
      id: 'shower-valve-bath1',
      label: 'Ensuite 1 Rain Shower Valve',
      mesh: mixerHandle,
      x: showerX,
      y: floorY + 1.1,
      z: showerZ + sL * 0.5,
      range: 2.2,
      prompt: 'Toggle Shower Water',
      onInteract: () => {
        const next = gameStore.toggleShower('bath1');
        if (this.showers.bath1) this.showers.bath1.setActive(next);
      },
    });

    // Attach ShowerParticles system for Bath 1
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
        minZ: -0.60,
        maxZ: 0.60,
        minY: floorY + 0.03,
        maxY: floorY + sHeadH,
      },
    });
    particlesBath1.group.position.set(showerX, 0, showerZ + sL * 0.5 - 0.35);
    b1Group.add(particlesBath1.group);
    this.showers.bath1 = particlesBath1;

    this.group.add(b1Group);

    this.colliders.push({
      id: 'collider-bath-1-vanity',
      min: new THREE.Vector3(11.75 - vD - 0.04, floorY, 2.5 - vW * 0.5),
      max: new THREE.Vector3(11.75, floorY + vH, 2.5 + vW * 0.5),
      type: 'furniture',
    });
  }

  /**
   * Ensuite Bathroom 2 (Upper Floor: minX: -11.75, maxX: -9.25, minZ: 4.55, maxZ: 7.25, floorY: 3.95).
   */
  buildBathroom2() {
    const b2Group = new THREE.Group();
    b2Group.name = 'furniture-bathroom-2';

    const floorY = 3.95;

    // 1. Floating Vanity Counter: 0.90m W x 0.55m D x 0.85m H along north wall
    const vW = 0.9;
    const vD = 0.55;
    const vH = 0.85;

    const vanityCabinet = new THREE.Mesh(
      new THREE.BoxGeometry(vW, 0.45, vD),
      this.materials.vanityWood
    );
    vanityCabinet.position.set(-10.5, floorY + 0.55, 7.25 - vD * 0.5 - 0.02);
    vanityCabinet.castShadow = true;
    b2Group.add(vanityCabinet);

    const vanityTop = new THREE.Mesh(
      new THREE.BoxGeometry(vW + 0.02, 0.04, vD + 0.02),
      this.materials.bathStone
    );
    vanityTop.position.set(-10.5, floorY + vH - 0.02, 7.25 - vD * 0.5 - 0.01);
    vanityTop.castShadow = true;
    b2Group.add(vanityTop);

    const basinMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.15, 0.12, 16),
      this.materials.porcelainWhite
    );
    basinMesh.position.set(-10.5, floorY + vH + 0.06, 7.25 - vD * 0.5);
    basinMesh.castShadow = true;
    b2Group.add(basinMesh);

    const mirrorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.85, 0.02),
      this.materials.mirror
    );
    mirrorMesh.position.set(-10.5, floorY + 1.5, 7.25 - 0.02);
    b2Group.add(mirrorMesh);

    // 2. Wall-hung commode: 0.40m W x 0.65m D, seat height 0.42m
    const toiletBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.34, 0.65),
      this.materials.porcelainWhite
    );
    toiletBody.position.set(-9.6, floorY + 0.25, 6.0);
    toiletBody.castShadow = true;
    b2Group.add(toiletBody);

    // 3. Walk-in Shower Stall (1.20m x 0.90m) with overhead rain showerhead (head height 2.2m above floor)
    // Absolute showerhead height: Y = 3.95 + 2.20 = 6.15m per test
    const sW = 1.2;
    const sD = 0.9;
    const sHeadH = 2.2;
    const showerX = -11.0;
    const showerZ = 5.0;

    const trayMesh = new THREE.Mesh(
      new THREE.BoxGeometry(sD, 0.03, sW),
      this.materials.bathStone
    );
    trayMesh.position.set(showerX, floorY + 0.015, showerZ);
    b2Group.add(trayMesh);

    const glassScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 2.0, 0.01),
      this.materials.glassScreen
    );
    glassScreen.position.set(showerX, floorY + 1.0, showerZ + sW * 0.5);
    b2Group.add(glassScreen);

    // Chrome overhead rain shower fixture
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, sHeadH, 8),
      this.materials.chromeMetal
    );
    pipe.position.set(-11.75 + 0.04, floorY + sHeadH * 0.5, showerZ);
    b2Group.add(pipe);

    const showerHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.02, 16),
      this.materials.chromeMetal
    );
    showerHead.position.set(-11.75 + 0.35, floorY + sHeadH - 0.01, showerZ);
    b2Group.add(showerHead);

    // Chrome mixer valve
    const mixerHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.12, 0.04),
      this.materials.chromeMetal
    );
    mixerHandle.position.set(-11.75 + 0.03, floorY + 1.1, showerZ);
    b2Group.add(mixerHandle);

    this.interactables.push({
      id: 'shower-valve-bath2',
      label: 'Ensuite 2 Rain Shower Valve',
      mesh: mixerHandle,
      x: -11.75 + 0.05,
      y: floorY + 1.1,
      z: showerZ,
      range: 2.2,
      prompt: 'Toggle Shower Water',
      onInteract: () => {
        const next = gameStore.toggleShower('bath2');
        if (this.showers.bath2) this.showers.bath2.setActive(next);
      },
    });

    // Attach ShowerParticles system for Bath 2
    const particlesBath2 = new ShowerParticles({
      count: 600,
      headY: floorY + sHeadH - 0.02, // 3.95 + 2.2 - 0.02 = 6.13m
      floorY: floorY + 0.03, // 3.95 + 0.03 = 3.98m
      speed: 2.5,
      sprayRadius: 0.2,
      bathKey: 'bath2',
      stallBounds: {
        minX: -0.45,
        maxX: 0.45,
        minZ: -0.60,
        maxZ: 0.60,
        minY: floorY + 0.03,
        maxY: floorY + sHeadH,
      },
    });
    particlesBath2.group.position.set(-11.75 + 0.35, 0, showerZ);
    b2Group.add(particlesBath2.group);
    this.showers.bath2 = particlesBath2;

    this.group.add(b2Group);

    this.colliders.push({
      id: 'collider-bath-2-vanity',
      min: new THREE.Vector3(-10.5 - vW * 0.5, floorY, 7.25 - vD - 0.04),
      max: new THREE.Vector3(-10.5 + vW * 0.5, floorY + vH, 7.25),
      type: 'furniture',
    });
  }
}

export function buildBathrooms(options = {}) {
  const builder = new BathroomsBuilder(options);
  return builder.build();
}
