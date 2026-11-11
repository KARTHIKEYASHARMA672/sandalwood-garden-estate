import * as THREE from 'three';
import { gameStore } from '../state/gameStore.js';
import {
  START_POSITION,
  WORLD_DIMENSIONS,
  resolveGroundHeightAt,
  detectZoneAt,
  POOL_SPEC,
} from '../house/HouseArchitecture.js';
import { audioEngine } from '../assets/procedural/AudioEngine.js';

/**
 * First- & Third-Person Player Controller:
 * - WASD / Arrow Keys movement
 * - Walk 2.2 m/s, Run (Shift) 3.8 m/s, Indoor limit 2.0 m/s
 * - Smooth accel (0.18s) / decel (0.15s)
 * - Sit / Stand on sofas, accent chairs, balcony chairs
 * - Footstep cadence synced to surface material
 */
export class PlayerController {
  constructor(cameraController, collisionSystem, interactionManager) {
    this.cameraCtrl = cameraController;
    this.collision = collisionSystem;
    this.interaction = interactionManager;

    this.position = new THREE.Vector3(START_POSITION.x, START_POSITION.y, START_POSITION.z);
    this.velocity = new THREE.Vector3();
    this.keys = new Set();
    this.distanceMoved = 0;
    this.stepAccum = 0;
    this.currentSpeed = 0;
    this.isMoving = false;
    this.isRunning = false;

    this._seatRestorePos = null;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  reset() {
    this.position.set(START_POSITION.x, START_POSITION.y, START_POSITION.z);
    this.velocity.set(0, 0, 0);
    this._seatRestorePos = null;
    this.cameraCtrl.resetOrientation(START_POSITION.yaw, -0.04);
  }

  sitAt(seatConfig) {
    this._seatRestorePos = this.position.clone();
    this.position.set(seatConfig.x, seatConfig.y, seatConfig.z);
    this.velocity.set(0, 0, 0);
    const targetYaw =
      typeof seatConfig.yaw === 'number'
        ? seatConfig.yaw
        : typeof seatConfig.heading === 'number'
          ? seatConfig.heading
          : null;
    if (targetYaw !== null) {
      this.cameraCtrl.yaw = targetYaw;
      this.cameraCtrl.pitch = -0.05;
    }
    gameStore.setState({
      seatedSeat: {
        id: seatConfig.id,
        label: seatConfig.label,
      },
    });
    audioEngine.playInteract();
  }

  standUp() {
    const state = gameStore.getState();
    if (!state.seatedSeat) return;
    if (this._seatRestorePos) {
      this.position.copy(this._seatRestorePos);
      this._seatRestorePos = null;
    }
    gameStore.setState({ seatedSeat: null });
    audioEngine.playInteract();
  }

  _onKeyDown(e) {
    const code = e.code;
    this.keys.add(code);

    const state = gameStore.getState();

    // Global audio unlock on any interaction
    audioEngine.unlock();

    if (code === 'KeyM') {
      const nextMuted = !state.muted;
      gameStore.setState({ muted: nextMuted });
      audioEngine.setVolume(state.audioVolume, nextMuted);
      return;
    }

    if (code === 'Escape') {
      if (state.inspectionItem) {
        gameStore.setState({ inspectionItem: null });
        return;
      }
      if (state.activeOverlay) {
        gameStore.setState({ activeOverlay: null });
        return;
      }
      if (state.screen === 'playing') {
        this.cameraCtrl.releaseLock();
        gameStore.setState({ screen: 'paused' });
        return;
      }
      if (state.screen === 'paused') {
        gameStore.setState({ screen: 'playing' });
        this.cameraCtrl.requestLock();
        return;
      }
    }

    if (state.screen !== 'playing' || state.activeOverlay) return;

    if (state.inspectionItem && (code === 'KeyE' || code === 'Space')) {
      gameStore.setState({ inspectionItem: null });
      return;
    }

    if (code === 'KeyC' || code === 'KeyV') {
      gameStore.setState({ thirdPerson: !state.thirdPerson });
      return;
    }

    if (code === 'KeyL') {
      const lamps = state.bedsideLamps;
      const allOn = lamps.b1Left && lamps.b1Right && lamps.b2Left && lamps.b2Right;
      gameStore.setState({
        bedsideLamps: {
          b1Left: !allOn,
          b1Right: !allOn,
          b2Left: !allOn,
          b2Right: !allOn,
        },
      });
      audioEngine.playInteract();
      return;
    }

    if (code === 'KeyT') {
      const times = ['day', 'sunset', 'night'];
      const nextIdx = (times.indexOf(state.timeOfDay) + 1) % times.length;
      gameStore.setState({ timeOfDay: times[nextIdx] });
      audioEngine.playInteract();
      return;
    }

    if (code === 'KeyH') {
      gameStore.setState({ hudHidden: !state.hudHidden });
      return;
    }

    if (state.seatedSeat && (code === 'Space' || code === 'KeyE')) {
      e.preventDefault();
      this.standUp();
      return;
    }

    if (code === 'KeyE') {
      this.interaction.triggerActive();
    }
  }

  _onKeyUp(e) {
    this.keys.delete(e.code);
  }

  _getSurfaceAt(x, y, z) {
    if (y > 2.6) {
      if (x < -12 || z < -9) return 'timber';
      if (x >= -11.9 && x <= -9.15 && z >= 4.45 && z <= 7.4) return 'tile';
      return 'timber';
    }
    if (x >= -12 && x <= 12 && z >= -9 && z <= 9) {
      if (x >= -11.9 && x <= -7.05 && z >= 4.45 && z <= 8.9) return 'tile'; // kitchen limestone
      if (x >= 9.25 && x <= 11.9 && z >= 1.85 && z <= 4.7) return 'tile'; // bath 1
      if (x >= 3.4 && x <= 7.3 && z >= -8.9 && z <= -6.2) return 'tile'; // laundry
      if (x >= 2.2 && x <= 4.8 && z >= 5.95 && z <= 8.85) return 'stone'; // foyer
      return 'timber';
    }
    if (
      (x >= WORLD_DIMENSIONS.porchMinX &&
        x <= WORLD_DIMENSIONS.porchMaxX &&
        z >= WORLD_DIMENSIONS.porchMinZ &&
        z <= WORLD_DIMENSIONS.porchMaxZ + 1.0) ||
      (Math.abs(x - WORLD_DIMENSIONS.pathwayCenterX) <= 1.35 && z >= 12 && z <= 41.5) ||
      (x >= POOL_SPEC.terraceMinX &&
        x <= POOL_SPEC.terraceMaxX &&
        z >= POOL_SPEC.terraceMinZ &&
        z <= POOL_SPEC.terraceMaxZ)
    ) {
      return 'stone';
    }
    return 'grass';
  }

  update(dt) {
    const state = gameStore.getState();
    if (state.screen !== 'playing' || state.activeOverlay || state.inspectionItem) {
      this.velocity.set(0, 0, 0);
      this.isMoving = false;
      this.currentSpeed = 0;
      return;
    }

    if (state.seatedSeat) {
      this.velocity.set(0, 0, 0);
      this.isMoving = false;
      this.currentSpeed = 0;
      return;
    }

    const forwardInput =
      (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) -
      (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0);
    const strafeInput =
      (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) -
      (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);

    const indoors =
      this.position.x >= -12.0 &&
      this.position.x <= 12.0 &&
      this.position.z >= -9.0 &&
      this.position.z <= 9.0;

    const shiftHeld = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const maxSpeed = indoors ? 2.0 : shiftHeld ? 3.8 : 2.2;
    this.isRunning = !indoors && shiftHeld;

    const yaw = this.cameraCtrl.yaw;
    const fwdX = -Math.sin(yaw);
    const fwdZ = -Math.cos(yaw);
    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);

    let moveX = fwdX * forwardInput + rightX * strafeInput;
    let moveZ = fwdZ * forwardInput + rightZ * strafeInput;
    const len = Math.hypot(moveX, moveZ);
    if (len > 0.001) {
      moveX /= len;
      moveZ /= len;
    }

    const targetVx = moveX * maxSpeed;
    const targetVz = moveZ * maxSpeed;

    // Acceleration (~0.18s) vs Deceleration (~0.15s)
    const rate = len > 0.001 ? 1 / 0.18 : 1 / 0.15;
    const alpha = Math.min(1, dt * rate * 2.2);
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVx, alpha);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVz, alpha);

    const prevX = this.position.x;
    const prevZ = this.position.z;

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    this.collision.resolveMovement(this.position);

    const targetY = resolveGroundHeightAt(this.position.x, this.position.z, this.position.y);
    this.position.y = THREE.MathUtils.lerp(this.position.y, targetY, Math.min(1, dt * 15));

    const movedStep = Math.hypot(this.position.x - prevX, this.position.z - prevZ);
    this.currentSpeed = dt > 0 ? movedStep / dt : 0;
    this.isMoving = this.currentSpeed > 0.25;

    if (this.isMoving) {
      this.distanceMoved += movedStep;
      this.stepAccum += movedStep;
      if (this.stepAccum >= 0.78) {
        this.stepAccum = 0;
        const surface = this._getSurfaceAt(this.position.x, this.position.y, this.position.z);
        audioEngine.playFootstep(surface);
      }
    } else {
      this.stepAccum = 0.45; // prompt immediate first step on resume
    }

    // Room & zone discovery tracking
    const zone = detectZoneAt(this.position.x, this.position.y, this.position.z);
    gameStore.discoverZone(zone.zoneId, zone.label);

    // Spatial audio mix (indoors, pool distance, active shower)
    const poolCenterX = (POOL_SPEC.poolMinX + POOL_SPEC.poolMaxX) * 0.5;
    const poolCenterZ = (POOL_SPEC.poolMinZ + POOL_SPEC.poolMaxZ) * 0.5;
    const poolDist = Math.hypot(this.position.x - poolCenterX, this.position.z - poolCenterZ);

    const dBath1 = Math.hypot(this.position.x - 10.6, this.position.z - 2.6) + Math.abs(this.position.y - 0.3);
    const dBath2 = Math.hypot(this.position.x + 10.6, this.position.z - 6.4) + Math.abs(this.position.y - 3.95);
    const showerActive = state.showers.bath1 || state.showers.bath2;
    const showerDist = Math.min(
      state.showers.bath1 ? dBath1 : 99,
      state.showers.bath2 ? dBath2 : 99
    );

    audioEngine.updateSpatialLevels({
      indoors,
      showerActive,
      showerDistance: showerDist,
      poolDistance: poolDist,
    });
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
