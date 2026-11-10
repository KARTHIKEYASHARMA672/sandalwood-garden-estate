import * as THREE from 'three';
import { gameStore } from '../state/gameStore.js';

/**
 * Center-screen raycasting and distance-gated interaction manager.
 * Guarantees only one target is active at a time and no prompts leak through walls.
 */
export class InteractionManager {
  constructor(camera, collisionSystem) {
    this.camera = camera;
    this.collision = collisionSystem;
    this.items = []; // { id, mesh, kind, label, prompt, range, onInteract }
    this.raycaster = new THREE.Raycaster();
    this._ndc = new THREE.Vector2(0, 0);
    this._targetWorld = new THREE.Vector3();
    this.currentItem = null;
  }

  clear() {
    this.items.length = 0;
    this.currentItem = null;
  }

  register({ id, mesh, kind = 'inspect', label, prompt, range = 1.8, onInteract }) {
    if (!mesh) return;
    mesh.traverse((child) => {
      child.userData.interactId = id;
    });
    this.items.push({ id, mesh, kind, label, prompt, range, onInteract });
  }

  update() {
    const state = gameStore.getState();
    if (state.screen !== 'playing' || state.inspectionItem) {
      if (state.activeTarget !== null) {
        this.currentItem = null;
        gameStore.setState({ activeTarget: null });
      }
      return;
    }

    if (state.seatedSeat) {
      const seatTarget = {
        id: state.seatedSeat.id,
        kind: 'stand',
        label: state.seatedSeat.label,
        prompt: 'E or Space — Stand up',
      };
      if (state.activeTarget?.id !== seatTarget.id || state.activeTarget?.kind !== 'stand') {
        gameStore.setState({ activeTarget: seatTarget });
      }
      this.currentItem = null;
      return;
    }

    this.raycaster.setFromCamera(this._ndc, this.camera);
    this.raycaster.near = 0.08;
    this.raycaster.far = 3.5;

    const meshes = this.items.map((item) => item.mesh);
    const hits = this.raycaster.intersectObjects(meshes, true);

    let chosen = null;
    for (const hit of hits) {
      let obj = hit.object;
      let interactId = obj.userData?.interactId;
      while (!interactId && obj.parent) {
        obj = obj.parent;
        interactId = obj.userData?.interactId;
      }
      if (!interactId) continue;

      const candidate = this.items.find((item) => item.id === interactId);
      if (!candidate) continue;
      if (hit.distance > candidate.range) continue;

      // Occlusion check: ensure no solid wall is strictly in front of the hit point
      this._targetWorld.copy(hit.point);
      if (this.collision.isOccluded(this.camera.position, this._targetWorld, hit.distance)) {
        continue;
      }
      chosen = candidate;
      break;
    }

    if (chosen) {
      this.currentItem = chosen;
      const nextPrompt = typeof chosen.prompt === 'function' ? chosen.prompt() : chosen.prompt;
      if (
        !state.activeTarget ||
        state.activeTarget.id !== chosen.id ||
        state.activeTarget.prompt !== nextPrompt
      ) {
        gameStore.setState({
          activeTarget: {
            id: chosen.id,
            kind: chosen.kind,
            label: chosen.label,
            prompt: nextPrompt,
          },
        });
      }
    } else {
      this.currentItem = null;
      if (state.activeTarget !== null) {
        gameStore.setState({ activeTarget: null });
      }
    }
  }

  triggerActive() {
    if (!this.currentItem) return false;
    this.currentItem.onInteract(this.currentItem);
    return true;
  }
}