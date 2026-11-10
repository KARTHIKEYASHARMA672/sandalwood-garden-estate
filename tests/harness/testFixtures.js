import * as THREE from 'three';
import { CollisionSystem } from '../../src/gameplay/CollisionSystem.js';
import { InteractionManager } from '../../src/gameplay/InteractionManager.js';
import { CameraController } from '../../src/gameplay/CameraController.js';
import { PlayerController } from '../../src/gameplay/PlayerController.js';
import { createMockCanvas } from './mockEnv.js';

/**
 * Creates an integrated test rig with PlayerController, CameraController,
 * CollisionSystem, and InteractionManager for end-to-end and integration tests.
 */
export function createIntegratedTestRig() {
  const domElement = createMockCanvas(800, 600);
  const camera = new THREE.PerspectiveCamera(60, 800 / 600, 0.05, 150);
  const scene = new THREE.Scene();

  const collisionSystem = new CollisionSystem();
  const cameraCtrl = new CameraController(camera, domElement, collisionSystem);
  const interactionManager = new InteractionManager(camera, collisionSystem);
  const playerCtrl = new PlayerController(cameraCtrl, collisionSystem, interactionManager);

  return {
    domElement,
    camera,
    scene,
    collisionSystem,
    cameraCtrl,
    interactionManager,
    playerCtrl,
    dispose: () => {
      playerCtrl.dispose();
      cameraCtrl.dispose();
      collisionSystem.clear();
      interactionManager.clear();
    },
  };
}

/**
 * Creates a simple mock interactable object for raycast and interaction tests.
 */
export function createMockInteractable({
  id = 'test-item',
  x = 0,
  y = 1.0,
  z = 0,
  size = 0.5,
  prompt = 'Press E to interact',
  label = 'Test Item',
  range = 1.8,
  onInteract = () => {},
} = {}) {
  const geo = new THREE.BoxGeometry(size, size, size);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.updateMatrixWorld(true);

  return {
    id,
    mesh,
    kind: 'inspect',
    label,
    prompt,
    range,
    onInteract,
  };
}
