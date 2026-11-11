import * as THREE from 'three';
import { WORLD_DIMENSIONS, POOL_SPEC } from '../house/HouseArchitecture.js';

/**
 * Lightweight AABB + Cylinder collision system with dynamic door colliders
 * and wall-occlusion raycasting.
 */
export class CollisionSystem {
  constructor() {
    this.boxes = []; // { minX, minY, minZ, maxX, maxY, maxZ, active, id }
    this.cylinders = []; // { x, z, minY, maxY, radius, id }
    this.dynamicDoorColliders = new Map();
    this.occluders = []; // wall/floor meshes checked for interaction line-of-sight
    this._raycaster = new THREE.Raycaster();
  }

  clear() {
    this.boxes.length = 0;
    this.cylinders.length = 0;
    this.dynamicDoorColliders.clear();
    this.occluders.length = 0;
  }

  addBox(minX, minY, minZ, maxX, maxY, maxZ, id = '') {
    const box = { minX, minY, minZ, maxX, maxY, maxZ, active: true, id };
    this.boxes.push(box);
    return box;
  }

  addWallBox(cx, baseY, cz, width, height, depth, id = '') {
    return this.addBox(
      cx - width * 0.5,
      baseY,
      cz - depth * 0.5,
      cx + width * 0.5,
      baseY + height,
      cz + depth * 0.5,
      id
    );
  }

  addCylinder(x, z, minY, maxY, radius, id = '') {
    const cyl = { x, z, minY, maxY, radius, id };
    this.cylinders.push(cyl);
    return cyl;
  }

  registerDoorCollider(doorId, box) {
    this.dynamicDoorColliders.set(doorId, box);
  }

  registerColliders(colliders) {
    if (!Array.isArray(colliders)) return;
    for (const c of colliders) {
      if (!c) continue;
      if (c.min && c.max) {
        this.addBox(c.min.x, c.min.y, c.min.z, c.max.x, c.max.y, c.max.z, c.id || '');
      } else if (typeof c.minX === 'number') {
        this.addBox(c.minX, c.minY, c.minZ, c.maxX, c.maxY, c.maxZ, c.id || '');
      }
    }
  }

  setDoorOpen(doorId, isOpen) {
    const box = this.dynamicDoorColliders.get(doorId);
    if (box) {
      box.active = !isOpen;
    }
  }

  registerOccluder(object3d) {
    this.occluders.push(object3d);
  }

  /**
   * Checks if any opaque wall/floor occluder blocks the line between camera and target point.
   */
  isOccluded(origin, targetPoint, maxDistance) {
    const dir = new THREE.Vector3().subVectors(targetPoint, origin);
    const dist = dir.length();
    if (dist < 0.01) return false;
    dir.normalize();

    this._raycaster.set(origin, dir);
    this._raycaster.near = 0.05;
    this._raycaster.far = Math.min(dist - 0.06, maxDistance);

    const hits = this._raycaster.intersectObjects(this.occluders, true);
    return hits.length > 0;
  }

  /**
   * Resolve horizontal movement of a vertical capsule [y, y + height] with radius r.
   * Performs sliding against AABBs, cylinders, pool rim, and estate boundary.
   */
  resolveMovement(pos, radius = WORLD_DIMENSIONS.playerRadius, height = WORLD_DIMENSIONS.playerHeight) {
    let x = pos.x;
    let z = pos.z;
    const minY = pos.y + 0.15; // step clearance for stairs/plinth
    const maxY = pos.y + height;

    // 1. Keep inside 80x70m playable garden
    x = Math.max(WORLD_DIMENSIONS.gardenMinX + 0.8, Math.min(WORLD_DIMENSIONS.gardenMaxX - 0.8, x));
    z = Math.max(WORLD_DIMENSIONS.gardenMinZ + 0.8, Math.min(WORLD_DIMENSIONS.gardenMaxZ - 0.8, z));

    // 2. Prevent accidental walking into the pool basin
    if (pos.y < 1.2) {
      const pMinX = POOL_SPEC.poolMinX - radius;
      const pMaxX = POOL_SPEC.poolMaxX + radius;
      const pMinZ = POOL_SPEC.poolMinZ - radius;
      const pMaxZ = POOL_SPEC.poolMaxZ + radius;
      if (x > pMinX && x < pMaxX && z > pMinZ && z < pMaxZ) {
        const dLeft = Math.abs(x - pMinX);
        const dRight = Math.abs(pMaxX - x);
        const dBack = Math.abs(z - pMinZ);
        const dFront = Math.abs(pMaxZ - z);
        const minD = Math.min(dLeft, dRight, dBack, dFront);
        if (minD === dLeft) x = pMinX;
        else if (minD === dRight) x = pMaxX;
        else if (minD === dBack) z = pMinZ;
        else z = pMaxZ;
      }
    }

    // 3. Two-pass AABB push-out for clean corner sliding
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < this.boxes.length; i++) {
        const b = this.boxes[i];
        if (!b.active) continue;
        if (maxY <= b.minY || minY >= b.maxY) continue;

        const closestX = Math.max(b.minX, Math.min(x, b.maxX));
        const closestZ = Math.max(b.minZ, Math.min(z, b.maxZ));
        const dx = x - closestX;
        const dz = z - closestZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < radius * radius) {
          if (distSq > 1e-7) {
            const dist = Math.sqrt(distSq);
            const push = radius - dist;
            x += (dx / dist) * push;
            z += (dz / dist) * push;
          } else {
            // Center inside box: eject along shallowest axis
            const oxLeft = Math.abs(x - b.minX);
            const oxRight = Math.abs(b.maxX - x);
            const ozMin = Math.abs(z - b.minZ);
            const ozMax = Math.abs(b.maxZ - z);
            const m = Math.min(oxLeft, oxRight, ozMin, ozMax);
            if (m === oxLeft) x = b.minX - radius;
            else if (m === oxRight) x = b.maxX + radius;
            else if (m === ozMin) z = b.minZ - radius;
            else z = b.maxZ + radius;
          }
        }
      }

      // 4. Cylinder colliders (trees, columns, planters)
      for (let i = 0; i < this.cylinders.length; i++) {
        const c = this.cylinders[i];
        if (maxY <= c.minY || minY >= c.maxY) continue;
        const dx = x - c.x;
        const dz = z - c.z;
        const minDist = radius + c.radius;
        const distSq = dx * dx + dz * dz;
        if (distSq < minDist * minDist && distSq > 1e-7) {
          const dist = Math.sqrt(distSq);
          const push = minDist - dist;
          x += (dx / dist) * push;
          z += (dz / dist) * push;
        }
      }
    }

    pos.x = x;
    pos.z = z;
  }
}
