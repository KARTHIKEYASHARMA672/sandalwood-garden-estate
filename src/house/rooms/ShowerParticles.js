import * as THREE from 'three';
import { gameStore } from '../../state/gameStore.js';

/**
 * Animated Shower Water Particle System (PRD §10.5, §19.3, Feature F31).
 *
 * Simulates a fine conical rain shower droplet spray with gravity-driven
 * downward velocity, floor splash resets, and reactive gameStore binding.
 */
export class ShowerParticles {
  /**
   * @param {Object} options
   * @param {number} [options.count=600] Droplet particle budget (PRD: 400 - 800)
   * @param {number} [options.headY=2.2] Emission datum height above floor
   * @param {number} [options.floorY=0.0] Floor datum height where droplets terminate
   * @param {number} [options.speed=2.5] Downward trajectory speed in m/s
   * @param {number} [options.sprayRadius=0.18] Conical dispersal radius at floor
   * @param {string} [options.bathKey='bath1'] Reactive shower key in gameStore ('bath1' | 'bath2')
   * @param {Object} [options.stallBounds] Stall enclosure bounds { minX, maxX, minZ, maxZ, minY, maxY }
   */
  constructor(options = {}) {
    this.count = options.count || 600;
    this.headY = options.headY !== undefined ? options.headY : 2.2;
    this.floorY = options.floorY !== undefined ? options.floorY : 0.0;
    this.speed = options.speed || 2.5;
    this.sprayRadius = options.sprayRadius || 0.18;
    this.bathKey = options.bathKey || null;

    this.stallBounds = options.stallBounds || {
      minX: -0.6,
      maxX: 0.6,
      minZ: -0.45,
      maxZ: 0.45,
      minY: this.floorY + 0.02,
      maxY: this.headY,
    };

    this.active = false;
    this.group = new THREE.Group();
    this.group.name = `shower-particles-${this.bathKey || 'custom'}`;

    this.initParticles();

    // Bind to gameStore if a bathKey is designated
    if (this.bathKey) {
      const state = gameStore.getState();
      if (state && state.showers && state.showers[this.bathKey] !== undefined) {
        this.setActive(Boolean(state.showers[this.bathKey]));
      }

      this.unsubscribe = gameStore.subscribe((nextState) => {
        if (nextState.showers && nextState.showers[this.bathKey] !== undefined) {
          const shouldBeActive = Boolean(nextState.showers[this.bathKey]);
          if (shouldBeActive !== this.active) {
            this.setActive(shouldBeActive);
          }
        }
      });
    }
  }

  /**
   * Builds the particle geometry and procedural soft-droplet circular texture.
   */
  initParticles() {
    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.lifetimes = new Float32Array(this.count);

    const fallDistance = Math.max(0.2, this.headY - this.floorY);

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      // Stagger initial drop heights evenly along the column
      const frac = Math.random();
      const currentY = this.floorY + frac * fallDistance;
      const progress = (this.headY - currentY) / fallDistance;
      const spread = progress * this.sprayRadius;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * spread;

      this.positions[i3] = Math.cos(angle) * r;
      this.positions[i3 + 1] = currentY;
      this.positions[i3 + 2] = Math.sin(angle) * r;

      // Downward velocity with subtle natural variation (+/- 10%)
      this.velocities[i3] = (Math.random() - 0.5) * 0.08;
      this.velocities[i3 + 1] = -(this.speed * (0.92 + Math.random() * 0.16));
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.08;

      this.lifetimes[i] = frac;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    // Generate soft circular droplet texture on canvas
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
    grad.addColorStop(0, 'rgba(235, 245, 255, 0.95)');
    grad.addColorStop(0.3, 'rgba(195, 225, 250, 0.6)');
    grad.addColorStop(0.7, 'rgba(160, 205, 240, 0.2)');
    grad.addColorStop(1, 'rgba(140, 190, 235, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    this.material = new THREE.PointsMaterial({
      size: 0.038,
      map: texture,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.NormalBlending,
      vertexColors: false,
      color: 0xcee7f8,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.visible = this.active;
    this.points.frustumCulled = false;
    this.group.add(this.points);

    // Subtle water floor impact mist ring
    const mistGeo = new THREE.RingGeometry(0.04, this.sprayRadius * 0.95, 24);
    mistGeo.rotateX(-Math.PI / 2);
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0xdff0fc,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.mistMesh = new THREE.Mesh(mistGeo, mistMat);
    this.mistMesh.position.y = this.floorY + 0.01;
    this.mistMesh.visible = this.active;
    this.group.add(this.mistMesh);
  }

  /**
   * Toggles active state of particle emitter.
   * @param {boolean} active
   */
  setActive(active) {
    this.active = Boolean(active);
    if (this.points) this.points.visible = this.active;
    if (this.mistMesh) this.mistMesh.visible = this.active;
  }

  /**
   * Steps particle positions down by gravity velocity.
   * @param {number} delta Seconds since last frame
   */
  update(delta = 0.016) {
    if (!this.active) return;

    const clampedDt = Math.min(0.1, Math.max(0.001, delta));
    const pos = this.geometry.attributes.position.array;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      // Downward trajectory integration
      pos[i3] += this.velocities[i3] * clampedDt;
      pos[i3 + 1] += this.velocities[i3 + 1] * clampedDt;
      pos[i3 + 2] += this.velocities[i3 + 2] * clampedDt;

      // Reset droplet when hitting shower tray floor
      if (pos[i3 + 1] <= this.floorY + 0.02) {
        pos[i3 + 1] = this.headY;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * 0.06; // emitter disc size
        pos[i3] = Math.cos(angle) * r;
        pos[i3 + 2] = Math.sin(angle) * r;

        // Dispersal velocity expanding gently outwards as it falls
        const outwardAngle = Math.random() * Math.PI * 2;
        const outwardSpeed = 0.03 + Math.random() * 0.04;
        this.velocities[i3] = Math.cos(outwardAngle) * outwardSpeed;
        this.velocities[i3 + 1] = -(this.speed * (0.94 + Math.random() * 0.12));
        this.velocities[i3 + 2] = Math.sin(outwardAngle) * outwardSpeed;
      }

      // Clamp within stall enclosure bounds after movement or reset
      if (pos[i3] < this.stallBounds.minX) pos[i3] = this.stallBounds.minX;
      if (pos[i3] > this.stallBounds.maxX) pos[i3] = this.stallBounds.maxX;
      if (pos[i3 + 2] < this.stallBounds.minZ) pos[i3 + 2] = this.stallBounds.minZ;
      if (pos[i3 + 2] > this.stallBounds.maxZ) pos[i3 + 2] = this.stallBounds.maxZ;
    }

    this.geometry.attributes.position.needsUpdate = true;

    // Pulsate subtle splash mist ring
    if (this.mistMesh) {
      const pulse = 1.0 + Math.sin(Date.now() * 0.008) * 0.05;
      this.mistMesh.scale.set(pulse, 1, pulse);
    }
  }

  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
  }
}

export function createShowerParticles(options = {}) {
  return new ShowerParticles(options);
}
