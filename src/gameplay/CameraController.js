import * as THREE from 'three';
import { gameStore } from '../state/gameStore.js';
import { WORLD_DIMENSIONS } from '../house/HouseArchitecture.js';

/**
 * First- and Third-Person Camera Controller.
 * - 75 deg horizontal/vertical balanced FOV, near 0.05 m, far 150 m
 * - Vertical pitch clamped strictly to [-80, +80] degrees
 * - Pointer lock on canvas click while playing; Esc releases cleanly
 * - C toggles First-Person <-> Third-Person with wall-clip pull-in
 */
export class CameraController {
  constructor(camera, domElement, collisionSystem, interactionManager = null) {
    this.camera = camera;
    this.domElement = domElement;
    this.collision = collisionSystem;
    this.interaction = interactionManager;

    this.yaw = 0;
    this.pitch = -0.04;
    this.camera.fov = 60; // ~75-85 deg horizontal on 16:9 viewport
    this.camera.near = 0.05;
    this.camera.far = 150;
    this.camera.updateProjectionMatrix();

    this.maxPitch = THREE.MathUtils.degToRad(80);
    this._currentPos = new THREE.Vector3(1.65, 1.95, 43.6);
    this._lookTarget = new THREE.Vector3(0.9, 1.85, 18.0);
    this.camera.position.copy(this._currentPos);
    this.camera.lookAt(this._lookTarget);
    this._rayDir = new THREE.Vector3();
    this._raycaster = new THREE.Raycaster();
    this._eyePos = new THREE.Vector3();
    this._desired = new THREE.Vector3();
    this._startCamPos = new THREE.Vector3();
    this._startLookTarget = new THREE.Vector3(0.9, 1.85, 18.0);
    this._finalCam = new THREE.Vector3();
    this._safeCamDist = 2.6;

    this._onMouseMove = this._onMouseMove.bind(this);
    this._onPointerLockChange = this._onPointerLockChange.bind(this);
    this._onCanvasClick = this._onCanvasClick.bind(this);

    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    this.domElement.addEventListener('click', this._onCanvasClick);
  }

  setInteractionManager(interactionManager) {
    this.interaction = interactionManager;
  }

  _onCanvasClick() {
    const state = gameStore.getState();
    if (state.screen !== 'playing' || state.activeOverlay || state.inspectionItem) {
      return;
    }
    if (document.pointerLockElement === this.domElement) {
      this.interaction?.triggerActive();
      return;
    }
    this.requestLock();
  }

  requestLock() {
    if (this.domElement.requestPointerLock) {
      try {
        const res = this.domElement.requestPointerLock();
        if (res && typeof res.catch === 'function') {
          res.catch(() => {});
        }
      } catch {
        // Ignore headless / denied lock requests gracefully
      }
    }
  }

  releaseLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  _onPointerLockChange() {
    const locked = document.pointerLockElement === this.domElement;
    gameStore.setState({ pointerLocked: locked });
  }

  _onMouseMove(e) {
    const state = gameStore.getState();
    if (state.screen !== 'playing' || state.activeOverlay || state.inspectionItem) return;
    if (document.pointerLockElement !== this.domElement && e.buttons !== 1) return;

    const sens = 0.0021 * state.mouseSensitivity;
    const ySign = state.invertY ? 1 : -1;

    this.yaw -= e.movementX * sens;
    this.pitch = THREE.MathUtils.clamp(
      this.pitch + e.movementY * sens * ySign,
      -this.maxPitch,
      this.maxPitch
    );
  }

  resetOrientation(yaw = 0, pitch = -0.04) {
    this.yaw = yaw;
    this.pitch = pitch;
  }

  /**
   * Computes camera transform from player world position, eye height, and 1st/3rd person mode.
   */
  update(playerPos, isSeated, selectedCharacter, dt) {
    const state = gameStore.getState();

    // Start screen peaceful panoramic framing placing companions + house center-right of the left card
    if (state.screen === 'start' || state.screen === 'loading') {
      const t = performance.now() * 0.00018;
      this._startCamPos.set(1.65 + Math.sin(t) * 0.45, 1.95, 43.6);
      this.camera.position.lerp(this._startCamPos, Math.min(1, dt * 4));
      this.camera.lookAt(this._startLookTarget);
      return;
    }

    const baseEye =
      selectedCharacter === 'male'
        ? WORLD_DIMENSIONS.eyeHeightMale
        : WORLD_DIMENSIONS.eyeHeightFemale;
    const eyeHeight = isSeated ? 1.15 : baseEye;
    this._eyePos.set(playerPos.x, playerPos.y + eyeHeight, playerPos.z);

    if (!state.thirdPerson || isSeated) {
      // Smooth 100ms sit glide when seated; keep strict X/Z coincidence when standing in 1st-person
      if (isSeated) {
        this._currentPos.lerp(this._eyePos, Math.min(1, dt * 18));
      } else {
        this._currentPos.x = this._eyePos.x;
        this._currentPos.z = this._eyePos.z;
        this._currentPos.y = THREE.MathUtils.lerp(this._currentPos.y, this._eyePos.y, Math.min(1, dt * 16));
      }
      this._safeCamDist = 2.6;

      this.camera.position.copy(this._currentPos);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
      this.camera.rotation.z = 0;
    } else {
      // Third-person over-shoulder camera with immediate inward wall-clip clamp and damped outward recovery
      const camDist = 2.6;
      const dirX = Math.sin(this.yaw) * Math.cos(this.pitch);
      const dirY = -Math.sin(this.pitch);
      const dirZ = Math.cos(this.yaw) * Math.cos(this.pitch);

      this._desired.set(
        this._eyePos.x + dirX * camDist + Math.cos(this.yaw) * 0.35,
        this._eyePos.y + 0.25 + dirY * camDist,
        this._eyePos.z + dirZ * camDist - Math.sin(this.yaw) * 0.35
      );

      this._rayDir.subVectors(this._desired, this._eyePos);
      const fullDist = this._rayDir.length();
      let targetDist = fullDist;
      if (fullDist > 0.05 && this.collision.occluders.length > 0) {
        this._rayDir.normalize();
        this._raycaster.set(this._eyePos, this._rayDir);
        this._raycaster.near = 0.1;
        this._raycaster.far = fullDist;
        const hits = this._raycaster.intersectObjects(this.collision.occluders, true);
        if (hits.length > 0) {
          targetDist = Math.max(0.08, hits[0].distance - 0.15);
        }
      }

      if (targetDist < this._safeCamDist) {
        this._safeCamDist = targetDist;
      } else {
        this._safeCamDist = THREE.MathUtils.lerp(this._safeCamDist, targetDist, Math.min(1, dt * 6.5));
      }

      this._finalCam.copy(this._eyePos).addScaledVector(this._rayDir, this._safeCamDist);
      this._currentPos.lerp(this._finalCam, Math.min(1, dt * 14));
      this.camera.position.copy(this._currentPos);

      this._lookTarget.set(
        this._eyePos.x - Math.sin(this.yaw) * 4.0,
        this._eyePos.y + Math.sin(this.pitch) * 4.0,
        this._eyePos.z - Math.cos(this.yaw) * 4.0
      );
      this.camera.lookAt(this._lookTarget);
    }
  }

  dispose() {
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    this.domElement.removeEventListener('click', this._onCanvasClick);
  }
}
