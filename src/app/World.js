import * as THREE from 'three';
import { createGarden } from '../world/Garden.js';
import { buildHouse } from '../house/HouseMeshBuilder.js';
import { buildAllRooms } from '../house/FurnitureFactory.js';
import { createDayNightController } from '../world/DayNightController.js';
import { gameStore, QUALITY_PROFILES } from '../state/gameStore.js';
import { audioEngine } from '../assets/procedural/AudioEngine.js';

/**
 * World: Master 3D scene assembler uniting the landscape, architectural shell,
 * interior furnishings, day/night lighting rig, and environmental effects.
 */
export class World {
  constructor({
    scene,
    renderer,
    collisionSystem,
    interactionManager,
    playerController = null,
  }) {
    this.scene = scene;
    this.renderer = renderer;
    this.collision = collisionSystem;
    this.interaction = interactionManager;
    this.playerController = playerController;

    this.group = new THREE.Group();
    this.group.name = 'sandalwood-estate-master-world';
    this.scene.add(this.group);

    // 1. Day / Night / Weather controller & sky dome
    this.dayNight = createDayNightController(this.scene, this.renderer);

    // 2. Garden landscape (lawns, 12 flower beds, trees, pool terrace, perimeter walls, central path)
    this.garden = createGarden(this.group);
    if (this.garden.colliders && this.collision) {
      this.collision.registerColliders(this.garden.colliders);
    }
    if (this.garden.pathwayLights) {
      for (const lightObj of this.garden.pathwayLights) {
        if (lightObj.userData && lightObj.userData.pointLight) {
          this.dayNight.registerExteriorLight(
            lightObj.userData.pointLight,
            lightObj.userData.pointLight.intensity || 1.0,
            lightObj.userData.emissiveMat || null,
            1.2
          );
        }
      }
    }
    if (this.garden.poolTerrace && this.garden.poolTerrace.poolLights) {
      for (const pl of this.garden.poolTerrace.poolLights) {
        if (pl.userData && pl.userData.light) {
          this.dayNight.registerPoolLight(pl.userData.light, pl.userData.light.intensity || 0.85);
        }
      }
    }

    // 3. Architectural shell & fenestration (façade asymmetry, 12 windows, 13 doors, staircase, balconies)
    this.house = buildHouse({
      scene: this.group,
      collisionSystem: this.collision,
      interactionManager: this.interaction,
    });
    if (this.house.userData) {
      if (this.house.userData.colliders && this.collision) {
        this.collision.registerColliders(this.house.userData.colliders);
      }
      if (Array.isArray(this.house.userData.exteriorLights)) {
        for (const ext of this.house.userData.exteriorLights) {
          this.dayNight.registerExteriorLight(
            ext.light,
            ext.baseIntensity,
            ext.emissiveMat || null,
            ext.baseEmissive ?? 1.1
          );
        }
      }
      if (Array.isArray(this.house.userData.interiorLights)) {
        for (const intLight of this.house.userData.interiorLights) {
          this.dayNight.registerInteriorLight(
            intLight.light,
            intLight.baseIntensity,
            intLight.emissiveMat || null,
            intLight.baseEmissive ?? 1.0
          );
        }
      }
    }

    // 4. Interior domestic furnishings (all 12 zones, 37 utensils, 37 cookware, washer/dryer, showers)
    this.furnishings = buildAllRooms(this.house, {
      collisionSystem: this.collision,
      interactionManager: this.interaction,
    });

    if (this.furnishings && Array.isArray(this.furnishings.interiorLights)) {
      for (const intLight of this.furnishings.interiorLights) {
        this.dayNight.registerInteriorLight(
          intLight.light,
          intLight.baseIntensity,
          intLight.emissiveMat || null,
          intLight.baseEmissive ?? 1.0
        );
      }
    }

    // Apply initial lighting & weather profile across both architecture and furnishings
    const initState = gameStore.getState();
    this.dayNight.applyState(initState.timeOfDay, initState.weather);

    // 5. Register seating interactables with player locomotion sit/stand
    this._registerSeatingInteractables();

    // 6. Connect reactive gameStore subscriptions
    this._unsubscribeStore = this._setupStoreSubscriptions();
  }

  _registerSeatingInteractables() {
    if (!this.interaction || !this.playerController) return;

    // Interior seats from FurnitureFactory (sofa, barstools, dining chairs, desk chairs, loungers)
    if (this.furnishings && this.furnishings.seats) {
      for (const seat of this.furnishings.seats) {
        const dummyGeo = new THREE.BoxGeometry(0.5, 0.45, 0.5);
        const dummyMat = new THREE.MeshBasicMaterial({ visible: false });
        const seatMesh = new THREE.Mesh(dummyGeo, dummyMat);
        seatMesh.position.set(seat.x, seat.y, seat.z);
        this.group.add(seatMesh);

        this.interaction.register({
          id: `seat-${seat.id}`,
          mesh: seatMesh,
          kind: 'sit',
          label: seat.label || 'Seat',
          prompt: () => 'E — Sit',
          range: 2.2,
          onInteract: () => this.playerController.sitAt(seat),
        });
      }
    }

    // Outdoor stone benches from TreesAndProps
    if (this.garden && this.garden.treesAndProps && this.garden.treesAndProps.benches) {
      for (const bench of this.garden.treesAndProps.benches) {
        const benchId = bench.userData?.id || bench.name || `bench-${bench.id}`;
        const benchLabel = bench.userData?.label || 'Garden Bench';
        this.interaction.register({
          id: `seat-${benchId}`,
          mesh: bench,
          kind: 'sit',
          label: benchLabel,
          prompt: () => 'E — Sit',
          range: 2.2,
          onInteract: () =>
            this.playerController.sitAt({
              id: benchId,
              label: benchLabel,
              x: bench.position.x,
              y: bench.position.y + 0.45,
              z: bench.position.z,
              yaw: bench.rotation.y + Math.PI,
            }),
        });
      }
    }

    // Porch, Balcony, and Pool Terrace sun lounger seats
    const extraSeats = [
      ...(this.house?.userData?.seats || []),
      ...(this.garden?.poolTerrace?.seats || []),
    ];
    for (const seat of extraSeats) {
      const dummyGeo = new THREE.BoxGeometry(0.55, 0.45, 0.55);
      const dummyMat = new THREE.MeshBasicMaterial({ visible: false });
      const seatMesh = new THREE.Mesh(dummyGeo, dummyMat);
      seatMesh.position.set(seat.x, seat.y, seat.z);
      this.group.add(seatMesh);

      this.interaction.register({
        id: `seat-${seat.id}`,
        mesh: seatMesh,
        kind: 'sit',
        label: seat.label || 'Lounge Seat',
        prompt: () => 'E — Sit',
        range: 2.2,
        onInteract: () => this.playerController.sitAt(seat),
      });
    }
  }

  _setupStoreSubscriptions() {
    let prevDoors = { ...gameStore.getState().doors };
    let prevTime = gameStore.getState().timeOfDay;
    let prevWeather = gameStore.getState().weather;
    let prevQuality = gameStore.getState().quality;
    let prevResetNonce = gameStore.getState().resetNonce;

    return gameStore.subscribe((state) => {
      // 0. Full reset cleanup (re-close open doors and restore lighting)
      if (state.resetNonce !== prevResetNonce) {
        prevResetNonce = state.resetNonce;
        prevDoors = {};
        if (this.house?.userData?.doors) {
          for (const doorSub of this.house.userData.doors.values()) {
            if (typeof doorSub.resetClosed === 'function') {
              doorSub.resetClosed();
            }
          }
        }
      }

      // 1. Audio squeak on door state change
      for (const [id, open] of Object.entries(state.doors)) {
        if (prevDoors[id] !== open) {
          audioEngine.playDoorToggle(open);
        }
      }
      prevDoors = { ...state.doors };

      // 2. Day / Night and Weather transitions
      if (state.timeOfDay !== prevTime || state.weather !== prevWeather) {
        prevTime = state.timeOfDay;
        prevWeather = state.weather;
        this.dayNight.applyState(state.timeOfDay, state.weather);

        const nightFactor =
          state.timeOfDay === 'day' ? 0.0 : state.timeOfDay === 'sunset' ? 0.5 : 1.0;
        if (this.garden && typeof this.garden.setNightFactor === 'function') {
          this.garden.setNightFactor(nightFactor);
        }
      }

      // 3. Quality profile scaling (shadow resolution, foliage density)
      if (state.quality !== prevQuality) {
        prevQuality = state.quality;
        const profile = QUALITY_PROFILES[state.quality] || QUALITY_PROFILES.medium;
        this.dayNight.applyQuality(profile.shadowMapSize);
        if (this.garden && typeof this.garden.setDensity === 'function') {
          this.garden.setDensity(profile.flowerDensity);
        }
      }

      // 4. Shower water particles active state sync
      if (this.furnishings && this.furnishings.showers) {
        if (
          this.furnishings.showers.bath1 &&
          typeof this.furnishings.showers.bath1.setActive === 'function'
        ) {
          this.furnishings.showers.bath1.setActive(Boolean(state.showers.bath1));
        }
        if (
          this.furnishings.showers.bath2 &&
          typeof this.furnishings.showers.bath2.setActive === 'function'
        ) {
          this.furnishings.showers.bath2.setActive(Boolean(state.showers.bath2));
        }
      }
    });
  }

  update(dt, elapsed, cameraPos = null) {
    if (this.dayNight && typeof this.dayNight.update === 'function') {
      this.dayNight.update(dt, elapsed, cameraPos);
    }
    if (this.house && typeof this.house.update === 'function') {
      this.house.update(dt);
    }
    if (this.garden && typeof this.garden.update === 'function') {
      this.garden.update(dt, elapsed);
    }
    if (this.furnishings && typeof this.furnishings.update === 'function') {
      this.furnishings.update(dt, elapsed);
    }
  }

  dispose() {
    if (this._unsubscribeStore) {
      this._unsubscribeStore();
      this._unsubscribeStore = null;
    }
    if (this.dayNight && typeof this.dayNight.dispose === 'function') {
      this.dayNight.dispose();
    }
    if (this.furnishings && typeof this.furnishings.dispose === 'function') {
      this.furnishings.dispose();
    }
    this.scene.remove(this.group);
  }
}
