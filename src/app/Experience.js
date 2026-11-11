import * as THREE from 'three';
import { CameraController } from '../gameplay/CameraController.js';
import { CollisionSystem } from '../gameplay/CollisionSystem.js';
import { InteractionManager } from '../gameplay/InteractionManager.js';
import { PlayerController } from '../gameplay/PlayerController.js';
import { createCharacterRig } from '../characters/CharacterMesh.js';
import { COMPANION_START, getTerrainHeight } from '../house/HouseArchitecture.js';
import { World } from './World.js';
import { UIManager } from '../ui/UIManager.js';
import { gameStore, QUALITY_PROFILES } from '../state/gameStore.js';
import { audioEngine } from '../assets/procedural/AudioEngine.js';

/**
 * Experience: Central engine orchestrator managing the Three.js viewport,
 * renderer, camera choreography, gameplay controllers, procedural character rigs,
 * scene world, DOM HUD UI, and animation loop.
 */
export class Experience {
  constructor(canvasContainer = null, uiContainer = null) {
    this.canvasContainer =
      canvasContainer ||
      (typeof document !== 'undefined'
        ? document.getElementById('webgl-container') || document.body
        : null);

    this.uiContainer =
      uiContainer ||
      (typeof document !== 'undefined'
        ? document.getElementById('ui-root') || document.body
        : null);

    this.running = false;
    this.rafId = null;

    this._onResize = this._onResize.bind(this);
    this._loop = this._loop.bind(this);

    this.init();
  }

  init() {
    // 1. Three.js Scene, Clock & Sizing
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    const width = this.canvasContainer?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1280);
    const height = this.canvasContainer?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 720);

    // 2. Perspective Camera (PRD §18.2: 60-75 deg FOV, near 0.05m, far 150m)
    this.camera = new THREE.PerspectiveCamera(60, Math.max(0.1, width / height), 0.05, 150);
    this.scene.add(this.camera);

    // 3. WebGLRenderer with soft shadows, ACES Filmic tone mapping, and sRGB color space
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this._applyPixelRatio();
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    if (this.canvasContainer && this.renderer.domElement) {
      this.canvasContainer.innerHTML = '';
      this.canvasContainer.appendChild(this.renderer.domElement);
    }

    // 4. Locomotion & Physics Gameplay Systems
    this.collisionSystem = new CollisionSystem();
    this.interactionManager = new InteractionManager(this.camera, this.collisionSystem);
    this.cameraController = new CameraController(
      this.camera,
      this.renderer.domElement,
      this.collisionSystem,
      this.interactionManager
    );
    this.playerController = new PlayerController(this.cameraController, this.collisionSystem, this.interactionManager);

    // 5. Articulated procedural 3rd-person character rigs (Female & Male)
    this.characterRigFemale = createCharacterRig('female');
    this.characterRigMale = createCharacterRig('male');
    this.characterRigFemale.root.visible = false;
    this.characterRigMale.root.visible = false;
    this.scene.add(this.characterRigFemale.root);
    this.scene.add(this.characterRigMale.root);

    // Curated West Garden exterior stroll waypoints strictly outside house & clear of doors/pathway/beds
    this.companionWaypoints = [
      { x: -7.8, z: 14.8, pause: 3.2, lookYaw: 0.35 },
      { x: -8.4, z: 22.5, pause: 2.8, lookYaw: 1.35 },
      { x: -8.4, z: 31.2, pause: 2.6, lookYaw: 1.45 },
      { x: -6.8, z: 38.5, pause: 3.4, lookYaw: 2.6 },
      { x: -13.2, z: 33.5, pause: 2.5, lookYaw: -1.1 },
      { x: -13.5, z: 16.5, pause: 2.6, lookYaw: -0.7 },
    ];
    this.companionState = {
      variant: 'male',
      x: this.companionWaypoints[0].x,
      y: 0.0,
      z: this.companionWaypoints[0].z,
      yaw: this.companionWaypoints[0].lookYaw,
      speed: 0,
      waypointIndex: 0,
      pauseRemaining: 2.5,
    };

    // 6. Master Scene Assembly (Garden, House, Domestic Furnishings, Lighting)
    this.world = new World({
      scene: this.scene,
      renderer: this.renderer,
      collisionSystem: this.collisionSystem,
      interactionManager: this.interactionManager,
      playerController: this.playerController,
    });

    // Trigger companion/player arm gesture whenever interacting with doors
    this.playerController.onInteractTriggered = (target) => {
      if (target && target.kind === 'door') {
        const isMale = gameStore.getState().selectedCharacter === 'male';
        const rig = isMale ? this.characterRigMale : this.characterRigFemale;
        rig?.triggerDoorGesture?.();
      }
    };

    // 7. Modern DOM HUD Overlay & Notification System
    this.uiManager = new UIManager({
      experience: this,
      container: this.uiContainer,
    });

    // 8. Event Listeners & Store Subscriptions
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this._onResize);
    }

    this._unsubscribeStore = gameStore.subscribe((state, patch) => {
      if (patch && 'quality' in patch) {
        this._applyPixelRatio();
      }
    });

    // Ready state
    gameStore.setState({
      loadProgress: 100,
      loadLabel: 'Ready for exploration',
    });
  }

  _applyPixelRatio() {
    if (!this.renderer || typeof window === 'undefined') return;
    const state = gameStore.getState();
    const profile = QUALITY_PROFILES[state.quality] || QUALITY_PROFILES.medium;
    const dpr = Math.min(window.devicePixelRatio || 1, profile.pixelRatioCap || 1.0);
    this.renderer.setPixelRatio(dpr);
  }

  _onResize() {
    if (!this.canvasContainer || !this.camera || !this.renderer) return;
    const width = this.canvasContainer.clientWidth || window.innerWidth;
    const height = this.canvasContainer.clientHeight || window.innerHeight;

    this.camera.aspect = Math.max(0.1, width / height);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this._applyPixelRatio();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    // Defer initial shader compile/render to first rAF so DOM UI mounts immediately
    if (typeof requestAnimationFrame !== 'undefined') {
      this.rafId = requestAnimationFrame(this._loop);
    }
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _loop() {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this._loop);

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();
    const state = gameStore.getState();

    // 1. Update player physics & movement
    this.playerController.update(dt);

    // 2. Update camera choreography
    const isSeated = Boolean(state.seatedSeat);
    this.cameraController.update(this.playerController.position, isSeated, state.selectedCharacter, dt);

    // 3. Update center-screen raycast reticle
    this.interactionManager.update();

    // 4. Update procedural 3D world (wind sway, trees, pool caustics, shower water, sky)
    this.world.update(dt, elapsed, this.camera.position);

    // 5. Update third-person procedural character rig
    this._updateCharacterMesh(dt, elapsed, isSeated, state);

    // 6. Render final WebGL frame
    this.renderer.render(this.scene, this.camera);
  }

  _updateCharacterMesh(dt, elapsed, isSeated, state) {
    // Showcase both articulated characters at the garden gate on the Start Screen
    if (state.screen === 'start' || state.screen === 'loading') {
      const femStart = COMPANION_START.female;
      const maleStart = COMPANION_START.male;

      this.characterRigFemale.root.visible = true;
      this.characterRigFemale.root.name = 'character-female';
      this.characterRigFemale.root.position.set(femStart.x, femStart.y, femStart.z);
      this.characterRigFemale.root.rotation.y = femStart.rotY;
      this.characterRigFemale.update(dt, {
        time: elapsed,
        speed: 0,
        seated: false,
        highlighted: state.selectedCharacter === 'female',
      });

      this.characterRigMale.root.visible = true;
      this.characterRigMale.root.name = 'character-male';
      this.characterRigMale.root.position.set(maleStart.x, maleStart.y, maleStart.z);
      this.characterRigMale.root.rotation.y = maleStart.rotY;
      this.characterRigMale.update(dt, {
        time: elapsed,
        speed: 0,
        seated: false,
        highlighted: state.selectedCharacter === 'male',
      });
      return;
    }

    const isThirdPerson = state.thirdPerson;
    const isMale = state.selectedCharacter === 'male';
    const activeRig = isMale ? this.characterRigMale : this.characterRigFemale;
    const inactiveRig = isMale ? this.characterRigFemale : this.characterRigMale;

    // Inactive companion NPC roams leisurely outdoors across scenic garden lawn waypoints
    activeRig.root.name = `character-${isMale ? 'male' : 'female'}`;
    this._updateCompanionNpc(inactiveRig, isMale ? 'female' : 'male', dt, elapsed);

    if (!isThirdPerson) {
      activeRig.root.visible = false;
      return;
    }

    activeRig.root.visible = true;
    activeRig.root.position.copy(this.playerController.position);
    if (isSeated) {
      // Seat Y stores cushion top elevation; align character pelvis surface flush with cushion
      activeRig.root.position.y -= isMale ? 0.44 : 0.41;
    }

    // Character faces movement direction or camera yaw
    const yaw = this.cameraController.yaw;
    activeRig.root.rotation.y = yaw + Math.PI;

    activeRig.update(dt, {
      time: elapsed,
      speed: this.playerController.currentSpeed,
      seated: isSeated,
      highlighted: false,
      hideHalo: true,
    });
  }

  _updateCompanionNpc(rig, companionVariant, dt, elapsed) {
    const cs = this.companionState;
    cs.variant = companionVariant;
    const wp = this.companionWaypoints[cs.waypointIndex];
    const stepDt = Math.min(0.1, Math.max(0.001, dt || 0.016));

    if (cs.pauseRemaining > 0) {
      cs.pauseRemaining = Math.max(0, cs.pauseRemaining - stepDt);
      cs.speed = 0;
      let dYaw = wp.lookYaw - cs.yaw;
      while (dYaw > Math.PI) dYaw -= Math.PI * 2;
      while (dYaw < -Math.PI) dYaw += Math.PI * 2;
      cs.yaw += dYaw * Math.min(1, stepDt * 3.5);
      if (cs.pauseRemaining <= 0) {
        cs.waypointIndex = (cs.waypointIndex + 1) % this.companionWaypoints.length;
      }
    } else {
      const dx = wp.x - cs.x;
      const dz = wp.z - cs.z;
      const dist = Math.hypot(dx, dz);
      const walkSpeed = 0.92;
      if (dist <= walkSpeed * stepDt + 0.06) {
        cs.x = wp.x;
        cs.z = wp.z;
        cs.speed = 0;
        cs.pauseRemaining = wp.pause;
      } else {
        cs.x += (dx / dist) * walkSpeed * stepDt;
        cs.z += (dz / dist) * walkSpeed * stepDt;
        cs.speed = walkSpeed;
        const targetYaw = Math.atan2(dx, dz);
        let dYaw = targetYaw - cs.yaw;
        while (dYaw > Math.PI) dYaw -= Math.PI * 2;
        while (dYaw < -Math.PI) dYaw += Math.PI * 2;
        cs.yaw += dYaw * Math.min(1, stepDt * 6.0);
      }
    }

    cs.y = getTerrainHeight(cs.x, cs.z);
    rig.root.visible = true;
    rig.root.name = 'companion-npc';
    rig.root.position.set(cs.x, cs.y, cs.z);
    rig.root.rotation.y = cs.yaw;
    rig.update(stepDt, {
      time: elapsed,
      speed: cs.speed,
      seated: false,
      highlighted: false,
      hideHalo: true,
    });
  }

  reset() {
    this.playerController.reset();
    gameStore.resetExperience();
    audioEngine.playInteract();
  }

  dispose() {
    this.stop();

    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this._onResize);
    }

    if (this._unsubscribeStore) {
      this._unsubscribeStore();
      this._unsubscribeStore = null;
    }

    this.playerController.dispose();
    this.cameraController.dispose();
    this.collisionSystem.clear();
    this.interactionManager.clear();
    this.world.dispose();
    this.uiManager.dispose();
    audioEngine.dispose();

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    }
  }
}
