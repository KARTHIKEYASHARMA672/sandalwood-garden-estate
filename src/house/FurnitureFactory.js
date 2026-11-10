import * as THREE from 'three';
import { buildLivingHall } from './rooms/LivingHall.js';
import {
  buildKitchen,
  KITCHEN_UTENSIL_INVENTORY,
  KITCHEN_COOKWARE_INVENTORY,
} from './rooms/Kitchen.js';
import { buildDiningHall } from './rooms/DiningHall.js';
import { buildBedrooms } from './rooms/Bedrooms.js';
import { buildBathrooms } from './rooms/Bathrooms.js';
import { buildUtilityRoom } from './rooms/UtilityRoom.js';
import { buildCommonAreas } from './rooms/CommonAreas.js';

/**
 * FurnitureFactory: Master aggregate interior furnishing builder for
 * Sandalwood Garden Estate (Milestone 3, Features F20 - F29, F31).
 *
 * Furnishes all 12 interior zones across ground and upper floors:
 * 1. Living Hall (low modular sofa, coffee table, OLED TV canvas, stone fireplace, bookshelf)
 * 2. Kitchen & Breakfast Bar (cabinetry, island with 3 barstools, sink, stove, 37 utensils, 37 cookware)
 * 3. Dining & Family Hall (long table, 8 chairs, sideboard credenza, chandelier)
 * 4. Master Bedroom 1 (King bed, nightstands, reactive lamps, wardrobe, dresser)
 * 5. Ensuite Bathroom 1 (floating vanity, vessel basin, toilet, walk-in shower with ShowerParticles)
 * 6. Guest Bedroom 2 (Queen bed, nightstands, study desk with chair, wardrobe)
 * 7. Ensuite Bathroom 2 (full suite, walk-in shower with ShowerParticles at Y = 6.15m)
 * 8. Dedicated Laundry & Utility Room (separate washer AND separate tumble dryer, counter, sink)
 * 9. Entrance Foyer (entrance shoe bench with shoes, hall tree coat rack, console table)
 * 10. Upper Landing & Gallery Mezzanine (reading chair, floor lamp)
 * 11. Upper Linen Storage Closet (oak shelving with folded bed linens)
 * 12. Outdoor Balconies (teak loungers, planters with foliage)
 */
export class FurnitureFactory {
  constructor(options = {}) {
    this.options = options;
    this.group = new THREE.Group();
    this.group.name = 'estate-interior-furnishings';
    this.colliders = [];
    this.interactables = [];
    this.seats = [];
    this.rooms = new Map();
    this.showers = {};
  }

  /**
   * Builds and attaches all interior furnishings to the house group or returns a master group.
   * @param {THREE.Group} [houseGroup] Optional parent house scene group
   * @returns {Object} Furnishing result bundle
   */
  build(houseGroup = null) {
    // 1. Build Main Living Hall
    const livingHall = buildLivingHall(this.options);
    this.registerRoom('living-hall', livingHall);

    // 2. Build Kitchen & Breakfast Bar (with 37 utensils and 37 cookware items)
    const kitchen = buildKitchen(this.options);
    this.registerRoom('kitchen', kitchen);

    // 3. Build Secondary Dining & Family Hall
    const diningHall = buildDiningHall(this.options);
    this.registerRoom('dining-hall', diningHall);

    // 4. Build Master Bedroom 1 & Guest Bedroom 2
    const bedrooms = buildBedrooms(this.options);
    this.registerRoom('bedrooms', bedrooms);

    // 5. Build Ensuite Bathroom 1 & Ensuite Bathroom 2 (with animated ShowerParticles)
    const bathrooms = buildBathrooms(this.options);
    this.registerRoom('bathrooms', bathrooms);
    if (bathrooms.userData && bathrooms.userData.showers) {
      this.showers = bathrooms.userData.showers;
    }

    // 6. Build Dedicated Laundry & Utility Room (with separate washer & dryer)
    const utilityRoom = buildUtilityRoom(this.options);
    this.registerRoom('laundry-room', utilityRoom);

    // 7. Build Common Areas (Foyer, Gallery, Linen Closet, Balconies)
    const commonAreas = buildCommonAreas(this.options);
    this.registerRoom('common-areas', commonAreas);

    // Attach to houseGroup if provided
    if (houseGroup) {
      houseGroup.add(this.group);
      if (!houseGroup.userData) houseGroup.userData = {};

      houseGroup.userData.furnishings = {
        group: this.group,
        rooms: this.rooms,
        colliders: this.colliders,
        interactables: this.interactables,
        seats: this.seats,
        showers: this.showers,
        utensils: KITCHEN_UTENSIL_INVENTORY,
        cookware: KITCHEN_COOKWARE_INVENTORY,
        totalUtensils: 37,
        coreCookware: 37,
        totalCookware: 41,
      };
    }

    // Register with collision system if provided
    if (this.options.collisionSystem) {
      for (const col of this.colliders) {
        this.options.collisionSystem.addBox(
          col.min.x,
          col.min.y,
          col.min.z,
          col.max.x,
          col.max.y,
          col.max.z,
          col.id
        );
      }
    }

    // Register interactables with interaction manager if provided
    if (this.options.interactionManager) {
      for (const item of this.interactables) {
        this.options.interactionManager.register(item);
      }
    }

    return {
      group: this.group,
      rooms: this.rooms,
      colliders: this.colliders,
      interactables: this.interactables,
      seats: this.seats,
      showers: this.showers,
      utensilInventory: KITCHEN_UTENSIL_INVENTORY,
      cookwareInventory: KITCHEN_COOKWARE_INVENTORY,
      update: (delta, time) => this.update(delta, time),
    };
  }

  /**
   * Helper to aggregate room furnishings, colliders, seats, and interactables.
   */
  registerRoom(id, roomGroup) {
    this.rooms.set(id, roomGroup);
    this.group.add(roomGroup);

    if (roomGroup.userData) {
      if (roomGroup.userData.colliders) {
        this.colliders.push(...roomGroup.userData.colliders);
      }
      if (roomGroup.userData.interactables) {
        this.interactables.push(...roomGroup.userData.interactables);
      }
      if (roomGroup.userData.seats) {
        this.seats.push(...roomGroup.userData.seats);
      }
    }
  }

  /**
   * Frame update loop: steps animated shower particles and dynamic effects.
   */
  update(delta = 0.016, time = 0) {
    if (this.showers) {
      if (this.showers.bath1 && typeof this.showers.bath1.update === 'function') {
        this.showers.bath1.update(delta, time);
      }
      if (this.showers.bath2 && typeof this.showers.bath2.update === 'function') {
        this.showers.bath2.update(delta, time);
      }
    }
  }

  dispose() {
    if (this.showers) {
      if (this.showers.bath1 && typeof this.showers.bath1.dispose === 'function') {
        this.showers.bath1.dispose();
      }
      if (this.showers.bath2 && typeof this.showers.bath2.dispose === 'function') {
        this.showers.bath2.dispose();
      }
    }
  }
}

/**
 * Standard factory function: buildAllRooms(houseGroup, options)
 */
export function buildAllRooms(houseGroup = null, options = {}) {
  const factory = new FurnitureFactory(options);
  const result = factory.build(houseGroup);
  result.factory = factory;
  return result;
}
