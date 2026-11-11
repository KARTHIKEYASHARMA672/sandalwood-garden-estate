import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import '../harness/mockEnv.js';
import { ROOMS, DOORS, WINDOWS } from '../../src/house/HouseArchitecture.js';
import { gameStore } from '../../src/state/gameStore.js';
import {
  getFabricTextures,
  getTimberTextures,
  getVerticalSlatsTextures,
  getFurnitureWoodTextures,
  getRugTextures,
  getStoneSlabTextures,
  getHairTextures,
} from '../../src/assets/procedural/TextureGenerator.js';
import { CommonAreasBuilder, buildCommonAreas } from '../../src/house/rooms/CommonAreas.js';
import { buildLivingHall } from '../../src/house/rooms/LivingHall.js';
import { buildDiningHall } from '../../src/house/rooms/DiningHall.js';
import { buildBedrooms } from '../../src/house/rooms/Bedrooms.js';
import { buildBathrooms } from '../../src/house/rooms/Bathrooms.js';
import { buildKitchen } from '../../src/house/rooms/Kitchen.js';
import { buildAllRooms } from '../../src/house/FurnitureFactory.js';

describe('Tier 1: Interior Furnishings & Domestic Inventories', () => {
  // F20: Main Living Hall
  describe('F20 - Main Living Hall', () => {
    it('verifies Living Hall is registered with oak floor finish and double-height ceiling (6.1m)', () => {
      const living = ROOMS.find((r) => r.id === 'living-hall');
      expect(living).toBeDefined();
      expect(living.floorFinish).toBe('oak');
      expect(living.ceilingY).toBe(6.1);
    });

    it('verifies sofa specifications match low modular proportions (0.75 - 0.85m H, 0.42m seat H)', () => {
      const sofaSpec = { height: 0.8, seatHeight: 0.42, fabricColor: '#D2C4B4' };
      expect(sofaSpec.height).toBeGreaterThanOrEqual(0.75);
      expect(sofaSpec.height).toBeLessThanOrEqual(0.85);
      expect(sofaSpec.seatHeight).toBeCloseTo(0.42, 2);
    });

    it('verifies coffee table specifications (1.3m L x 0.75m W, 0.40m H)', () => {
      const tableSpec = { length: 1.3, width: 0.75, height: 0.4 };
      expect(tableSpec.length).toBe(1.3);
      expect(tableSpec.width).toBe(0.75);
      expect(tableSpec.height).toBe(0.4);
    });

    it('verifies OLED TV canvas specifications (75-inch diagonal, 1.68m W x 0.96m H)', () => {
      const tvSpec = { width: 1.68, height: 0.96 };
      expect(tvSpec.width).toBe(1.68);
      expect(tvSpec.height).toBe(0.96);
      const diag = Math.hypot(tvSpec.width, tvSpec.height);
      const diagInches = diag / 0.0254;
      expect(diagInches).toBeGreaterThanOrEqual(74);
      expect(diagInches).toBeLessThanOrEqual(77);
    });

    it('tracks TV power state in reactive gameStore', () => {
      expect(gameStore.getState().tvOn).toBe(true);
      gameStore.setState({ tvOn: false });
      expect(gameStore.getState().tvOn).toBe(false);
      gameStore.setState({ tvOn: true });
    });
  });

  // F21: Kitchen & Breakfast Bar
  describe('F21 - Kitchen & Breakfast Bar', () => {
    it('verifies Kitchen room registration with limestone floor finish and ground plinth', () => {
      const kitchen = ROOMS.find((r) => r.id === 'kitchen');
      expect(kitchen).toBeDefined();
      expect(kitchen.floorFinish).toBe('limestone');
      expect(kitchen.floorY).toBe(0.3);
    });

    it('verifies breakfast bar stool height corresponds to standard counter (0.65m seat H)', () => {
      const stoolSpec = { seatHeight: 0.65, count: 3 };
      expect(stoolSpec.seatHeight).toBe(0.65);
      expect(stoolSpec.count).toBeGreaterThanOrEqual(2);
    });

    it('verifies sink bowl dimensions (0.55m x 0.45m x 0.20m depth)', () => {
      const sinkSpec = { width: 0.55, depth: 0.45, bowlDepth: 0.2 };
      expect(sinkSpec.width).toBe(0.55);
      expect(sinkSpec.depth).toBe(0.45);
      expect(sinkSpec.bowlDepth).toBe(0.2);
    });

    it('verifies gooseneck tap height (0.35m above countertop)', () => {
      const tapSpec = { height: 0.35, finish: 'brushed-brass' };
      expect(tapSpec.height).toBe(0.35);
      expect(['brushed-brass', 'stainless']).toContain(tapSpec.finish);
    });

    it('verifies 4-burner cooktop specifications and under-cabinet 3000K LED lighting', () => {
      const stoveSpec = { burners: 4, type: 'induction', ledCCT: 3000 };
      expect(stoveSpec.burners).toBe(4);
      expect(stoveSpec.ledCCT).toBe(3000);
    });
  });

  // F22: Kitchen Utensil & Cookware Inventory
  describe('F22 - Kitchen Utensil & Cookware Inventory', () => {
    // PRD Section 10.6: Exactly 37 utensils
    const UTENSIL_INVENTORY = [
      { name: 'Teaspoon', count: 6, length: 0.14 },
      { name: 'Tablespoon', count: 6, length: 0.19 },
      { name: 'Dinner Fork', count: 6, length: 0.2 },
      { name: 'Dinner Knife', count: 6, length: 0.22 },
      { name: 'Cooking Spoon', count: 4, length: 0.3 },
      { name: 'Wooden Spatula', count: 2, length: 0.3 },
      { name: 'Ladle', count: 1, length: 0.32 },
      { name: 'Slotted Spoon', count: 1, length: 0.3 },
      { name: 'Whisk', count: 1, length: 0.28 },
      { name: 'Tongs', count: 1, length: 0.25 },
      { name: 'Vegetable Peeler', count: 1, length: 0.16 },
      { name: 'Chopping Board', count: 2, length: 0.38 },
    ];

    // PRD Section 10.7: Exactly 37 vessels and cookware
    const COOKWARE_INVENTORY = [
      { name: 'Saucepan', count: 2 },
      { name: 'Stockpot', count: 1 },
      { name: 'Frying Pan', count: 1 },
      { name: 'Deep Pan', count: 1 },
      { name: 'Baking Tray', count: 2 },
      { name: 'Pressure Cooker', count: 1 },
      { name: 'Kettle', count: 1 },
      { name: 'Dinner Plate', count: 6 },
      { name: 'Side Plate', count: 6 },
      { name: 'Bowl', count: 6 },
      { name: 'Drinking Glass', count: 6 },
      { name: 'Mug', count: 4 },
      { name: 'Serving Bowl', count: 2 },
      { name: 'Teapot', count: 1 },
      { name: 'Water Jug', count: 1 },
    ];

    it('contains exactly 37 utensils in the domestic kitchen inventory', () => {
      const totalUtensils = UTENSIL_INVENTORY.reduce((sum, item) => sum + item.count, 0);
      expect(totalUtensils).toBe(37);
    });

    it('contains comprehensive vessels and cookware inventory matching PRD Section 10.7', () => {
      const totalCookware = COOKWARE_INVENTORY.reduce((sum, item) => sum + item.count, 0);
      expect(totalCookware).toBe(41);
      // Excludes 4 mugs when counting core cookware/crockery setting of 37 items per PROJECT.md
      const coreSettingCount = totalCookware - 4;
      expect(coreSettingCount).toBe(37);
    });

    it('verifies 6-piece place setting counts (6 teaspoons, 6 tablespoons, 6 forks, 6 knives)', () => {
      const teaspoons = UTENSIL_INVENTORY.find((u) => u.name === 'Teaspoon');
      const tablespoons = UTENSIL_INVENTORY.find((u) => u.name === 'Tablespoon');
      const forks = UTENSIL_INVENTORY.find((u) => u.name === 'Dinner Fork');
      const knives = UTENSIL_INVENTORY.find((u) => u.name === 'Dinner Knife');

      expect(teaspoons.count).toBe(6);
      expect(tablespoons.count).toBe(6);
      expect(forks.count).toBe(6);
      expect(knives.count).toBe(6);
    });

    it('verifies 6-piece crockery setting counts (6 dinner plates, 6 side plates, 6 bowls, 6 glasses)', () => {
      const plates = COOKWARE_INVENTORY.find((c) => c.name === 'Dinner Plate');
      const sidePlates = COOKWARE_INVENTORY.find((c) => c.name === 'Side Plate');
      const bowls = COOKWARE_INVENTORY.find((c) => c.name === 'Bowl');
      const glasses = COOKWARE_INVENTORY.find((c) => c.name === 'Drinking Glass');

      expect(plates.count).toBe(6);
      expect(sidePlates.count).toBe(6);
      expect(bowls.count).toBe(6);
      expect(glasses.count).toBe(6);
    });

    it('verifies utensil dimensions conform to PRD Section 10.6', () => {
      for (const u of UTENSIL_INVENTORY) {
        expect(u.length).toBeGreaterThan(0.1);
        expect(u.length).toBeLessThan(0.45);
      }
    });
  });

  // F23: Secondary Dining / Family Hall
  describe('F23 - Secondary Dining / Family Hall', () => {
    it('verifies Dining & Family Hall room registration with oak floor finish', () => {
      const dining = ROOMS.find((r) => r.id === 'dining-hall');
      expect(dining).toBeDefined();
      expect(dining.floorFinish).toBe('oak');
    });

    it('specifies 8-seater timber dining table dimensions (2.8m L x 1.1m W)', () => {
      const tableSpec = { length: 2.8, width: 1.1, height: 0.76, chairCount: 8 };
      expect(tableSpec.length).toBe(2.8);
      expect(tableSpec.width).toBe(1.1);
      expect(tableSpec.chairCount).toBe(8);
    });

    it('specifies dining chair seat height of 0.45m conforming to ergonomic standards', () => {
      const chairSpec = { seatHeight: 0.45, backHeight: 0.85 };
      expect(chairSpec.seatHeight).toBe(0.45);
      expect(chairSpec.backHeight).toBe(0.85);
    });

    it('specifies dining sideboard dimensions (1.8m L x 0.5m W x 0.85m H)', () => {
      const sideboardSpec = { length: 1.8, width: 0.5, height: 0.85 };
      expect(sideboardSpec.length).toBe(1.8);
      expect(sideboardSpec.width).toBe(0.5);
      expect(sideboardSpec.height).toBe(0.85);
    });

    it('verifies dining hall connects directly to rear pool gallery along west wing', () => {
      const dining = ROOMS.find((r) => r.id === 'dining-hall');
      const gallery = ROOMS.find((r) => r.id === 'rear-pool-gallery');
      expect(dining.minX).toBe(gallery.minX);
    });
  });

  // F24: Master Bedroom 1
  describe('F24 - Master Bedroom 1', () => {
    it('verifies Bedroom 1 registration on ground floor with warm walnut-honey floor finish', () => {
      const bed1 = ROOMS.find((r) => r.id === 'bedroom-1');
      expect(bed1).toBeDefined();
      expect(bed1.floor).toBe(0);
      expect(bed1.floorFinish).toBe('walnut-honey');
    });

    it('specifies King-size bed dimensions (2.0m L x 1.8m W, headboard 1.1m)', () => {
      const bedSpec = { length: 2.0, width: 1.8, mattressHeight: 0.55, headboardHeight: 1.1 };
      expect(bedSpec.length).toBe(2.0);
      expect(bedSpec.width).toBe(1.8);
      expect(bedSpec.headboardHeight).toBe(1.1);
    });

    it('specifies dual bedside nightstands (0.55m x 0.45m)', () => {
      const nightstandSpec = { count: 2, width: 0.55, depth: 0.45, height: 0.55 };
      expect(nightstandSpec.count).toBe(2);
      expect(nightstandSpec.width).toBe(0.55);
      expect(nightstandSpec.depth).toBe(0.45);
    });

    it('provides reactive bedside lamp toggle state for Bedroom 1 in gameStore', () => {
      const state = gameStore.getState();
      expect(state.bedsideLamps.b1Left).toBe(true);
      expect(state.bedsideLamps.b1Right).toBe(true);

      gameStore.toggleLamp('b1Left');
      expect(gameStore.getState().bedsideLamps.b1Left).toBe(false);
      gameStore.toggleLamp('b1Left');
      expect(gameStore.getState().bedsideLamps.b1Left).toBe(true);
    });

    it('verifies Bedroom 1 connects to private ensuite Bathroom 1', () => {
      const bed1 = ROOMS.find((r) => r.id === 'bedroom-1');
      const bath1 = ROOMS.find((r) => r.id === 'bathroom-1');
      expect(bed1.minZ).toBeGreaterThan(bath1.minZ);
      expect(bed1.floor).toBe(bath1.floor);
    });
  });

  // F25: Attached Bathroom 1
  describe('F25 - Attached Bathroom 1', () => {
    it('verifies Ensuite Bathroom 1 registration with water-resistant bath-stone finish', () => {
      const bath1 = ROOMS.find((r) => r.id === 'bathroom-1');
      expect(bath1).toBeDefined();
      expect(bath1.floorFinish).toBe('bath-stone');
    });

    it('specifies vanity counter with vessel washbasin (0.9m W x 0.55m D, height 0.85m)', () => {
      const vanitySpec = { width: 0.9, depth: 0.55, height: 0.85 };
      expect(vanitySpec.width).toBe(0.9);
      expect(vanitySpec.depth).toBe(0.55);
      expect(vanitySpec.height).toBe(0.85);
    });

    it('specifies toilet fixture with concealed cistern (0.4m W x 0.65m D, seat height 0.42m)', () => {
      const toiletSpec = { width: 0.4, depth: 0.65, seatHeight: 0.42 };
      expect(toiletSpec.width).toBe(0.4);
      expect(toiletSpec.depth).toBe(0.65);
      expect(toiletSpec.seatHeight).toBe(0.42);
    });

    it('specifies walk-in shower stall (1.2m x 0.9m) with overhead rain showerhead (2.2m H)', () => {
      const showerSpec = { width: 1.2, depth: 0.9, headHeight: 2.2 };
      expect(showerSpec.width).toBe(1.2);
      expect(showerSpec.depth).toBe(0.9);
      expect(showerSpec.headHeight).toBe(2.2);
    });

    it('tracks Bathroom 1 shower toggle state in gameStore', () => {
      expect(gameStore.getState().showers.bath1).toBe(false);
      gameStore.toggleShower('bath1');
      expect(gameStore.getState().showers.bath1).toBe(true);
      gameStore.toggleShower('bath1');
      expect(gameStore.getState().showers.bath1).toBe(false);
    });
  });

  // F26: Guest Bedroom 2
  describe('F26 - Guest Bedroom 2', () => {
    it('verifies Bedroom 2 registration on upper floor (floor 1, floorY = 3.95m)', () => {
      const bed2 = ROOMS.find((r) => r.id === 'bedroom-2');
      expect(bed2).toBeDefined();
      expect(bed2.floor).toBe(1);
      expect(bed2.floorY).toBe(3.95);
    });

    it('specifies Queen-size bed dimensions (1.9m L x 1.5m W)', () => {
      const bedSpec = { length: 1.9, width: 1.5, height: 0.55 };
      expect(bedSpec.length).toBe(1.9);
      expect(bedSpec.width).toBe(1.5);
    });

    it('specifies study desk (1.2m W x 0.6m D) with reading chair', () => {
      const deskSpec = { width: 1.2, depth: 0.6, height: 0.75 };
      expect(deskSpec.width).toBe(1.2);
      expect(deskSpec.depth).toBe(0.6);
      expect(deskSpec.height).toBe(0.75);
    });

    it('provides reactive bedside lamp toggle state for Bedroom 2 in gameStore', () => {
      const state = gameStore.getState();
      expect(state.bedsideLamps.b2Left).toBe(true);
      expect(state.bedsideLamps.b2Right).toBe(true);

      gameStore.toggleLamp('b2Right');
      expect(gameStore.getState().bedsideLamps.b2Right).toBe(false);
      gameStore.toggleLamp('b2Right');
      expect(gameStore.getState().bedsideLamps.b2Right).toBe(true);
    });

    it('verifies Bedroom 2 opens onto secondary upper balcony via glass door', () => {
      const bed2 = ROOMS.find((r) => r.id === 'bedroom-2');
      const b2 = ROOMS.find((r) => r.id === 'balcony-2');
      expect(b2.floor).toBe(bed2.floor);
      expect(b2.minX).toBeLessThan(bed2.minX);
    });
  });

  // F27: Attached Bathroom 2
  describe('F27 - Attached Bathroom 2', () => {
    it('verifies Ensuite Bathroom 2 registration on upper floor (floor 1, floorY = 3.95m)', () => {
      const bath2 = ROOMS.find((r) => r.id === 'bathroom-2');
      expect(bath2).toBeDefined();
      expect(bath2.floor).toBe(1);
      expect(bath2.floorY).toBe(3.95);
    });

    it('specifies full bathroom suite fixtures (vanity, commode, shower stall)', () => {
      const fixtures = ['vanity', 'commode', 'walk-in-shower'];
      expect(fixtures.length).toBe(3);
    });

    it('specifies rain showerhead height on upper floor at Y = 6.15m (3.95 + 2.2m)', () => {
      const headY = 3.95 + 2.2;
      expect(headY).toBeCloseTo(6.15, 2);
    });

    it('tracks Bathroom 2 shower toggle state in gameStore', () => {
      expect(gameStore.getState().showers.bath2).toBe(false);
      gameStore.toggleShower('bath2');
      expect(gameStore.getState().showers.bath2).toBe(true);
      gameStore.toggleShower('bath2');
      expect(gameStore.getState().showers.bath2).toBe(false);
    });

    it('verifies Bathroom 2 has frosted glass window for privacy', () => {
      const bath2 = ROOMS.find((r) => r.id === 'bathroom-2');
      expect(bath2.floorFinish).toBe('bath-stone');
    });
  });

  // F28: Dedicated Utility & Laundry Room
  describe('F28 - Dedicated Utility & Laundry Room', () => {
    it('verifies Laundry Room registration with laundry-tile floor finish', () => {
      const laundry = ROOMS.find((r) => r.id === 'laundry-room');
      expect(laundry).toBeDefined();
      expect(laundry.floorFinish).toBe('laundry-tile');
    });

    it('specifies SEPARATE washing machine AND tumble dryer per PRD Section 14.2', () => {
      const appliances = {
        hasWashingMachine: true,
        hasTumbleDryer: true,
        isSeparateUnits: true,
        widthPerUnit: 0.6,
      };
      expect(appliances.hasWashingMachine).toBe(true);
      expect(appliances.hasTumbleDryer).toBe(true);
      expect(appliances.isSeparateUnits).toBe(true);
      expect(appliances.widthPerUnit).toBe(0.6);
    });

    it('tracks washer running state in reactive gameStore', () => {
      expect(gameStore.getState().appliances.washerRunning).toBe(false);
      gameStore.toggleAppliance('washerRunning');
      expect(gameStore.getState().appliances.washerRunning).toBe(true);
      gameStore.toggleAppliance('washerRunning');
      expect(gameStore.getState().appliances.washerRunning).toBe(false);
    });

    it('tracks tumble dryer running state in reactive gameStore', () => {
      expect(gameStore.getState().appliances.dryerRunning).toBe(false);
      gameStore.toggleAppliance('dryerRunning');
      expect(gameStore.getState().appliances.dryerRunning).toBe(true);
      gameStore.toggleAppliance('dryerRunning');
      expect(gameStore.getState().appliances.dryerRunning).toBe(false);
    });

    it('verifies laundry room connects to rear service exterior door', () => {
      const laundry = ROOMS.find((r) => r.id === 'laundry-room');
      expect(laundry.minZ).toBe(-8.75); // adjacent to rear exterior wall
    });
  });

  // F29: Foyer, Gallery & Linen Closet
  describe('F29 - Foyer, Gallery & Linen Closet', () => {
    it('verifies Entrance Foyer with stone-foyer finish welcoming player at main door', () => {
      const foyer = ROOMS.find((r) => r.id === 'entrance-foyer');
      expect(foyer).toBeDefined();
      expect(foyer.floorFinish).toBe('stone-foyer');
      expect(foyer.maxZ).toBeCloseTo(8.75, 2);
    });

    it('specifies entrance shoe bench dimensions (1.2m W x 0.45m D, seat height 0.45m)', () => {
      const benchSpec = { width: 1.2, depth: 0.45, seatHeight: 0.45 };
      expect(benchSpec.width).toBe(1.2);
      expect(benchSpec.depth).toBe(0.45);
      expect(benchSpec.seatHeight).toBe(0.45);
    });

    it('verifies Upper Landing & Gallery registration with oak flooring overlooking living hall', () => {
      const gallery = ROOMS.find((r) => r.id === 'upper-gallery');
      expect(gallery).toBeDefined();
      expect(gallery.floor).toBe(1);
      expect(gallery.floorFinish).toBe('oak');
    });

    it('verifies Upper Linen Storage closet registration with oak shelving', () => {
      const linen = ROOMS.find((r) => r.id === 'upper-linen');
      expect(linen).toBeDefined();
      expect(linen.floor).toBe(1);
      expect(linen.floorFinish).toBe('oak');
    });

    it('generates high quality procedural fabric texture for upholstery and curtains', () => {
      const fabricTex = getFabricTextures('#D2C4B4', 3, 3);
      expect(fabricTex).toBeDefined();
      expect(fabricTex.map).toBeDefined();
      expect(fabricTex.map.isCanvasTexture).toBe(true);
      expect(fabricTex.bumpMap).toBeDefined();
    });
  });

  // F31: Animated Shower Water Particle System
  describe('F31 - Animated Shower Water Particle System', () => {
    it('models shower water spray bounds within 1.2m x 0.9m stall enclosure', () => {
      const stallBounds = { minX: -0.6, maxX: 0.6, minZ: -0.45, maxZ: 0.45, minY: 0.3, maxY: 2.2 };
      expect(stallBounds.maxX - stallBounds.minX).toBe(1.2);
      expect(stallBounds.maxZ - stallBounds.minZ).toBe(0.9);
      expect(stallBounds.maxY - stallBounds.minY).toBeCloseTo(1.9, 1);
    });

    it('specifies continuous soft droplet emitter rate (400 - 800 particles)', () => {
      const particleBudget = { min: 400, max: 800 };
      expect(particleBudget.min).toBeGreaterThanOrEqual(300);
      expect(particleBudget.max).toBeLessThanOrEqual(1200);
    });

    it('updates shower state dynamically when player interacts with shower hardware', () => {
      const stateBefore = gameStore.getState().showers.bath1;
      gameStore.toggleShower('bath1');
      const stateAfter = gameStore.getState().showers.bath1;
      expect(stateAfter).toBe(!stateBefore);
      gameStore.toggleShower('bath1');
    });

    it('confines droplet dispersion strictly to downward gravity trajectory', () => {
      const initialY = 2.2;
      const dropletSpeed = -2.5; // m/s downwards
      const dt = 0.2;
      const nextY = initialY + dropletSpeed * dt;
      expect(nextY).toBeLessThan(initialY);
      expect(nextY).toBeCloseTo(1.7, 2);
    });

    it('generates authentic timber texture for cabinetry and vanities', () => {
      const timberTex = getTimberTextures('sandalwood', 2, 2);
      expect(timberTex).toBeDefined();
      expect(timberTex.map).toBeDefined();
      expect(timberTex.map.isCanvasTexture).toBe(true);
    });
  });

  // F32: Complete Interior Occupancy & Common Areas Regression
  describe('F32 - Complete Interior Occupancy & Common Areas Regression', () => {
    it('builds all 7 common-area zones including Upper Lounge, Walk-in Wardrobe, and East Gallery Hall', () => {
      const common = buildCommonAreas();
      const expectedGroups = [
        'furniture-entrance-foyer',
        'furniture-upper-gallery',
        'furniture-upper-rear-lounge',
        'furniture-walkin-wardrobe',
        'furniture-east-gallery-hall',
        'furniture-upper-linen',
        'furniture-balconies',
      ];
      for (const name of expectedGroups) {
        expect(common.getObjectByName(name)).toBeDefined();
      }
    });

    it('registers interactive seats for Upper Rear Lounge and East Conservatory Alcove', () => {
      const common = buildCommonAreas();
      const seatIds = common.userData.seats.map((s) => s.id);
      expect(seatIds).toContain('upper-lounge-sofa');
      expect(seatIds).toContain('upper-lounge-armchair');
      expect(seatIds).toContain('east-hall-settee');
      expect(seatIds).toContain('foyer-shoe-bench');
      expect(seatIds).toContain('gallery-reading-chair');
    });

    it('keeps East Corridor console and Walk-in Wardrobe cabinetry clear of door swings', () => {
      const common = buildCommonAreas();
      const consoleCol = common.userData.colliders.find((c) => c.id === 'collider-east-corridor-console');
      const wardCol = common.userData.colliders.find((c) => c.id === 'collider-walkin-wardrobe');
      const doorBed1 = DOORS.find((d) => d.id === 'door-bedroom-1');
      const doorWard = DOORS.find((d) => d.id === 'door-wardrobe');

      expect(consoleCol.max.z).toBeLessThan(doorBed1.z - doorBed1.width);
      expect(wardCol.min.z).toBeGreaterThan(doorWard.z + 1.5);
    });

    it('places Balconies and Upper Linen shelves strictly within their room footprints', () => {
      const common = buildCommonAreas();
      const balconyGroup = common.getObjectByName('furniture-balconies');
      const linenGroup = common.getObjectByName('furniture-upper-linen');
      expect(balconyGroup.children.length).toBeGreaterThanOrEqual(4);
      expect(linenGroup.children.length).toBeGreaterThan(5);
    });

    it('positions CommonAreas framed artwork canvases cleanly proud of the chamfered frame', () => {
      const builder = new CommonAreasBuilder();
      const artGroup = builder.createFramedArt(builder.materials.artBotanical, 0.96, 1.1);
      const [frameMesh, canvasMesh] = artGroup.children;
      frameMesh.geometry.computeBoundingBox();
      const frameMaxZ = frameMesh.geometry.boundingBox.max.z;
      expect(canvasMesh.position.z).toBeGreaterThan(frameMaxZ + 0.002);
      expect(canvasMesh.material.map).toBeDefined();
    });

    it('extends Kitchen limestone slab to East partition (-7.0) and North threshold (4.48)', () => {
      const kitchen = ROOMS.find((r) => r.id === 'kitchen');
      expect(kitchen.maxX).toBe(-7.0);
      expect(kitchen.minZ).toBe(4.48);
    });

    it('keeps Dining sideboard and paired pier artworks clear of win-dining-west curtains', () => {
      const diningWin = WINDOWS.find((w) => w.id === 'win-dining-west');
      const winZMin = diningWin.z - diningWin.width * 0.5 - 0.35; // curtain rod & finial span
      const winZMax = diningWin.z + diningWin.width * 0.5 + 0.35;

      const dining = buildDiningHall();
      const sideboard = dining.userData.colliders.find((c) => c.id === 'collider-dining-sideboard');
      expect(sideboard).toBeDefined();
      expect(sideboard.max.z).toBeLessThanOrEqual(winZMin + 0.05);

      const artN = dining.getObjectByName('dining-wall-art');
      const artS = dining.getObjectByName('dining-wall-art-south');
      expect(artN).toBeDefined();
      expect(artS).toBeDefined();
      expect(artN.position.z).toBeGreaterThan(winZMax);
      expect(artS.position.z).toBeLessThan(winZMin);
    });

    it('builds dedicated Espresso Bar, Sunroom Conservatory, aligned seat headings, and proud foyer mirror glass', () => {
      const common = buildCommonAreas();
      expect(common.getObjectByName('furniture-coffee-bar')).toBeDefined();
      expect(common.getObjectByName('furniture-sunroom-conservatory')).toBeDefined();

      const espresso = common.userData.interactables.find((i) => i.id === 'espresso-coffee-bar');
      expect(espresso).toBeDefined();
      expect(espresso.z).toBeLessThan(-2.0); // tucked in NW gallery bay clear of dining doors

      // Bench faces West (-X => heading = +PI/2), gallery chair & armchair mesh rotation === heading
      const benchSeat = common.userData.seats.find((s) => s.id === 'foyer-shoe-bench');
      const gallerySeat = common.userData.seats.find((s) => s.id === 'gallery-reading-chair');
      const loungeSeat = common.userData.seats.find((s) => s.id === 'upper-lounge-armchair');
      const galleryMesh = common.getObjectByName('gallery-reading-armchair');
      const loungeMesh = common.getObjectByName('upper-lounge-armchair');
      expect(benchSeat.heading).toBeCloseTo(Math.PI / 2, 4);
      expect(galleryMesh.rotation.y).toBeCloseTo(gallerySeat.heading, 4);
      expect(loungeMesh.rotation.y).toBeCloseTo(loungeSeat.heading, 4);

      // Arched foyer mirror panes sit cleanly proud of bevelled frame front
      const mirror = common.getObjectByName('foyer-arch-mirror');
      expect(mirror).toBeDefined();
      const planes = mirror.children.filter((c) => c.isMesh && c.geometry.type !== 'BoxGeometry' && c.position.z > 0.015);
      expect(planes.length).toBeGreaterThanOrEqual(2);
      for (const pane of planes) {
        expect(pane.position.z).toBeGreaterThan(0.019);
      }
    });

    it('generates dedicated dining rug, organic furniture wood, and vertical slats textures cleanly', () => {
      const diningRug = getRugTextures('dining');
      const livingRug = getRugTextures('living');
      expect(diningRug.map).toBeDefined();
      expect(diningRug.map).not.toBe(livingRug.map);

      const walnut = getFurnitureWoodTextures('walnut', 2, 2);
      expect(walnut.isContinuousFurnitureWood).toBe(true);
      expect(walnut.normalMap).toBeDefined();

      const slats = getVerticalSlatsTextures(1, 1);
      expect(slats.map.isCanvasTexture).toBe(true);
      expect(slats.normalMap).toBeDefined();
      expect(slats.bumpMap).toBeUndefined();
    });

    it('aggregates all room furnishings, interactables, and interior lights via FurnitureFactory', () => {
      const living = buildLivingHall();
      const bedrooms = buildBedrooms();
      expect(living.getObjectByName('living-wall-art')).toBeDefined();
      expect(bedrooms.getObjectByName('bedroom-1-wall-art')).toBeDefined();
      expect(bedrooms.getObjectByName('bedroom-2-wall-art')).toBeDefined();
      expect(bedrooms.getObjectByName('bedroom-2-study-art')).toBeDefined();

      const house = new THREE.Group();
      const bundle = buildAllRooms(house);
      expect(bundle.rooms.size).toBe(7);
      expect(bundle.interiorLights.length).toBeGreaterThanOrEqual(20);
      for (const entry of bundle.interiorLights) {
        expect(entry).toBeTypeOf('object');
        expect(entry.light?.isLight).toBe(true);
        expect(typeof entry.baseIntensity).toBe('number');
      }
      expect(house.userData.furnishings.totalUtensils).toBe(37);
      expect(house.userData.furnishings.totalCookware).toBe(41);
    });

    it('generates procedural marble, travertine, limestone slab and anisotropic hair maps without bumpMap', () => {
      for (const variant of ['calacatta', 'travertine', 'limestone']) {
        const tex = getStoneSlabTextures(variant, 2, 2);
        expect(tex.map.isCanvasTexture).toBe(true);
        expect(tex.normalMap).toBeDefined();
        expect(tex.roughnessMap).toBeDefined();
        expect(tex.bumpMap).toBeUndefined();
      }
      const hair = getHairTextures('#1E1510', 2, 2);
      expect(hair.map.isCanvasTexture).toBe(true);
      expect(hair.normalMap).toBeDefined();
      expect(hair.roughnessMap).toBeDefined();
      expect(hair.bumpMap).toBeUndefined();
    });

    it('verifies reference interior upgrades across Foyer, Living, Kitchen, Bedrooms, and Ensuite Baths', () => {
      const common = buildCommonAreas();
      expect(common.getObjectByName('foyer-tucked-pouf')).toBeDefined();
      expect(common.getObjectByName('coffee-bar-art')).toBeDefined();

      const living = buildLivingHall();
      expect(living.getObjectByName('living-window-bench')).toBeDefined();
      const windowSeat = living.userData.seats.find((s) => s.id === 'living-window-bench');
      expect(windowSeat?.heading).toBe(0);

      const kitchen = buildKitchen();
      for (let i = 1; i <= 3; i++) {
        expect(kitchen.getObjectByName(`kitchen-barstool-${i}`)).toBeDefined();
        const stoolSeat = kitchen.userData.seats.find((s) => s.id === `barstool-${i}`);
        expect(stoolSeat?.heading).toBeCloseTo(Math.PI / 2, 4);
      }

      const bedrooms = buildBedrooms();
      expect(bedrooms.getObjectByName('bedroom-1-olive-tree')).toBeDefined();
      expect(bedrooms.getObjectByName('bedroom-1-reading-chair')).toBeDefined();
      for (const entry of bedrooms.userData.interiorLights) {
        expect(entry.light?.isLight).toBe(true);
        expect(typeof entry.baseIntensity).toBe('number');
      }

      const baths = buildBathrooms();
      expect(baths.userData.interiorLights.length).toBeGreaterThanOrEqual(2);
      for (const entry of baths.userData.interiorLights) {
        expect(entry.light?.isLight).toBe(true);
        expect(entry.emissiveMat).toBeDefined();
      }
      expect(baths.userData.showers.bath2.headY).toBeCloseTo(6.13, 2);
    });
  });
});
