/**
 * Measured architectural specifications (1 world unit = 1 metre).
 * Coordinate convention:
 *   +X: Right when facing the front facade from the garden
 *   +Y: Vertical height
 *   +Z: Forward toward the garden / main pathway (front wall at Z = +9.0)
 */

export const WORLD_DIMENSIONS = {
  gardenWidth: 80,
  gardenDepth: 70,
  gardenMinX: -40,
  gardenMaxX: 40,
  gardenMinZ: -25,
  gardenMaxZ: 45,

  houseWidth: 24,
  houseDepth: 18,
  houseMinX: -12,
  houseMaxX: 12,
  houseMinZ: -9,
  houseMaxZ: 9,

  groundSlabTop: 0.3,
  groundSlabThickness: 0.25,
  groundWallHeight: 3.4,
  upperSlabThickness: 0.25,
  upperFloorY: 3.95, // 0.30 + 3.40 + 0.25
  upperWallHeight: 3.1,
  upperCeilingY: 7.05, // 3.95 + 3.10
  roofRidgeHeight: 2.4, // 9.45 m above terrain (~9.8-10 m peak)

  extWallThickness: 0.25,
  intWallThickness: 0.15,

  pathwayWidth: 2.4,
  pathwayCenterX: 3.5,
  pathwayStartZ: 40.0,
  pathwayEndZ: 12.0,

  porchWidth: 6.0,
  porchDepth: 3.0,
  porchMinX: 0.5,
  porchMaxX: 6.5,
  porchMinZ: 9.0,
  porchMaxZ: 12.0,

  playerRadius: 0.32,
  playerHeight: 1.8,
  eyeHeightMale: 1.65,
  eyeHeightFemale: 1.56,
};

export const START_POSITION = {
  x: 3.5,
  y: 0.03,
  z: 39.2,
  yaw: 0, // facing -Z toward the house front facade
};

export const COMPANION_START = {
  male: { x: 2.65, y: 0.03, z: 39.1, rotY: 0.12 },
  female: { x: 4.35, y: 0.03, z: 39.1, rotY: -0.14 },
};

/**
 * Ground and Upper floor room definitions (internal coordinates).
 * Dimensions match PRD Section 8.2 & 8.3 within +/- 5%.
 */
export const ROOMS = [
  // Ground floor (floorY = 0.30)
  {
    id: 'entrance-foyer',
    zoneId: 'living-hall',
    name: 'Entrance Foyer',
    floor: 0,
    minX: 2.2,
    maxX: 4.8,
    minZ: 5.95,
    maxZ: 8.75,
    floorY: 0.3,
    ceilingY: 3.7,
    floorFinish: 'stone-foyer',
  },
  {
    id: 'living-hall',
    zoneId: 'living-hall',
    name: 'Main Living Hall',
    floor: 0,
    minX: -6.6,
    maxX: 0.4,
    minZ: 2.75,
    maxZ: 8.75,
    floorY: 0.3,
    ceilingY: 6.1, // double-height showcase bay
    floorFinish: 'oak',
  },
  {
    id: 'kitchen',
    zoneId: 'kitchen',
    name: 'Kitchen',
    floor: 0,
    minX: -11.75,
    maxX: -7.25,
    minZ: 4.55,
    maxZ: 8.75,
    floorY: 0.3,
    ceilingY: 3.7,
    floorFinish: 'limestone',
  },
  {
    id: 'dining-hall',
    zoneId: 'dining-hall',
    name: 'Dining & Family Hall',
    floor: 0,
    minX: -11.75,
    maxX: -6.75,
    minZ: 0.2,
    maxZ: 4.4,
    floorY: 0.3,
    ceilingY: 3.7,
    floorFinish: 'oak',
  },
  {
    id: 'rear-pool-gallery',
    zoneId: 'dining-hall',
    name: 'Garden & Pool Gallery',
    floor: 0,
    minX: -11.75,
    maxX: 3.3,
    minZ: -8.75,
    maxZ: 0.05,
    floorY: 0.3,
    ceilingY: 3.7,
    floorFinish: 'oak',
  },
  {
    id: 'stair-hall',
    zoneId: 'living-hall',
    name: 'Stair & Circulation Hall',
    floor: 0,
    minX: 0.55,
    maxX: 3.15,
    minZ: 1.7,
    maxZ: 5.7,
    floorY: 0.3,
    ceilingY: 7.05,
    floorFinish: 'oak',
  },
  {
    id: 'bedroom-1',
    zoneId: 'bedroom-1',
    name: 'Bedroom 1',
    floor: 0,
    minX: 7.55,
    maxX: 11.75,
    minZ: 4.75,
    maxZ: 8.75,
    floorY: 0.3,
    ceilingY: 3.7,
    floorFinish: 'walnut-honey',
  },
  {
    id: 'bathroom-1',
    zoneId: 'bathroom-1',
    name: 'Ensuite Bathroom 1',
    floor: 0,
    minX: 9.35,
    maxX: 11.75,
    minZ: 2.0,
    maxZ: 4.6,
    floorY: 0.3,
    ceilingY: 3.7,
    floorFinish: 'bath-stone',
  },
  {
    id: 'laundry-room',
    zoneId: 'laundry-room',
    name: 'Laundry & Utility Room',
    floor: 0,
    minX: 4.95,
    maxX: 7.15,
    minZ: -8.75,
    maxZ: -6.35,
    floorY: 0.3,
    ceilingY: 3.7,
    floorFinish: 'laundry-tile',
  },
  {
    id: 'ground-storage',
    zoneId: 'laundry-room',
    name: 'Storage Closet',
    floor: 0,
    minX: 3.45,
    maxX: 4.65,
    minZ: -8.75,
    maxZ: -7.25,
    floorY: 0.3,
    ceilingY: 3.7,
    floorFinish: 'laundry-tile',
  },

  // Upper floor (floorY = 3.95)
  {
    id: 'upper-gallery',
    zoneId: 'living-hall',
    name: 'Upper Landing & Gallery',
    floor: 1,
    minX: -6.6,
    maxX: 3.95,
    minZ: -8.75,
    maxZ: 1.7,
    floorY: 3.95,
    ceilingY: 7.05,
    floorFinish: 'oak',
  },
  {
    id: 'bedroom-2',
    zoneId: 'bedroom-2',
    name: 'Bedroom 2',
    floor: 1,
    minX: -11.75,
    maxX: -7.25,
    minZ: 0.2,
    maxZ: 4.4,
    floorY: 3.95,
    ceilingY: 7.05,
    floorFinish: 'walnut-honey',
  },
  {
    id: 'bathroom-2',
    zoneId: 'bathroom-2',
    name: 'Ensuite Bathroom 2',
    floor: 1,
    minX: -11.75,
    maxX: -9.25,
    minZ: 4.55,
    maxZ: 7.25,
    floorY: 3.95,
    ceilingY: 7.05,
    floorFinish: 'bath-stone',
  },
  {
    id: 'walkin-wardrobe',
    zoneId: 'bedroom-2',
    name: 'Walk-in Wardrobe',
    floor: 1,
    minX: -9.1,
    maxX: -7.1,
    minZ: 4.55,
    maxZ: 7.25,
    floorY: 3.95,
    ceilingY: 7.05,
    floorFinish: 'walnut-honey',
  },
  {
    id: 'upper-linen',
    zoneId: 'bedroom-2',
    name: 'Upper Linen Storage',
    floor: 1,
    minX: -1.8,
    maxX: -0.6,
    minZ: -1.7,
    maxZ: -0.2,
    floorY: 3.95,
    ceilingY: 7.05,
    floorFinish: 'oak',
  },
  {
    id: 'balcony-1',
    zoneId: 'balcony',
    name: 'Main Balcony',
    floor: 1,
    minX: -5.5,
    maxX: -0.5,
    minZ: -10.6,
    maxZ: -9.0,
    floorY: 3.95,
    ceilingY: 7.05,
    floorFinish: 'teak-deck',
  },
  {
    id: 'balcony-2',
    zoneId: 'balcony',
    name: 'Secondary Balcony',
    floor: 1,
    minX: -13.4,
    maxX: -12.0,
    minZ: 0.8,
    maxZ: 3.8,
    floorY: 3.95,
    ceilingY: 7.05,
    floorFinish: 'teak-deck',
  },
];

/**
 * Exact counts per PRD Section 7.5:
 * - 12 windows total (6 ground + 6 upper)
 * - 1 main exterior entrance door
 * - 1 rear/service exterior door
 * - 1 pool terrace sliding glass door
 * - 8 interior hinged doors
 * - 2 balcony access doors
 */
export const WINDOWS = [
  // Ground floor (6)
  { id: 'win-front-left', floor: 0, wall: 'front', x: -3.6, y: 1.9, z: 8.875, width: 2.4, height: 1.7, rotY: 0, shutters: true, curtains: true },
  { id: 'win-kitchen-west', floor: 0, wall: 'west', x: -11.875, y: 2.05, z: 6.65, width: 1.4, height: 1.2, rotY: Math.PI / 2, curtains: false },
  { id: 'win-dining-west', floor: 0, wall: 'west', x: -11.875, y: 1.9, z: 2.3, width: 2.0, height: 1.5, rotY: Math.PI / 2, curtains: true },
  { id: 'win-rear-gallery', floor: 0, wall: 'rear', x: 0.5, y: 1.9, z: -8.875, width: 2.2, height: 1.6, rotY: Math.PI, curtains: true },
  { id: 'win-bed1-east', floor: 0, wall: 'east', x: 11.875, y: 1.9, z: 6.75, width: 1.8, height: 1.5, rotY: -Math.PI / 2, curtains: true },
  { id: 'win-bath1-east', floor: 0, wall: 'east', x: 11.875, y: 2.15, z: 3.3, width: 0.9, height: 1.0, rotY: -Math.PI / 2, frosted: true },

  // Upper floor (6)
  { id: 'win-upper-living-left', floor: 1, wall: 'front', x: -3.6, y: 5.2, z: 8.875, width: 2.4, height: 1.5, rotY: 0, curtains: false },
  { id: 'win-upper-gallery-east', floor: 1, wall: 'east', x: 4.075, y: 5.5, z: 3.75, width: 1.6, height: 1.4, rotY: -Math.PI / 2, curtains: false },
  { id: 'win-upper-gallery-rear', floor: 1, wall: 'rear', x: 1.6, y: 5.5, z: -8.875, width: 1.8, height: 1.4, rotY: Math.PI, curtains: true },
  { id: 'win-upper-lounge-rear', floor: 1, wall: 'rear', x: -9.5, y: 5.5, z: -8.875, width: 2.0, height: 1.5, rotY: Math.PI, curtains: true },
  { id: 'win-bath2-west', floor: 1, wall: 'west', x: -11.875, y: 5.65, z: 5.9, width: 0.9, height: 1.0, rotY: Math.PI / 2, frosted: true },
  { id: 'win-upper-stair-east', floor: 1, wall: 'east', x: 4.075, y: 5.5, z: 7.0, width: 1.4, height: 1.4, rotY: -Math.PI / 2, curtains: false },
];

export const DOORS = [
  // 1. Main Exterior Entrance Door (front right, opens inward toward -Z)
  {
    id: 'door-main-entrance',
    category: 'exterior-main',
    label: 'Main Entrance Door',
    floor: 0,
    x: 3.5,
    y: 0.3,
    z: 8.875,
    width: 1.25,
    height: 2.4,
    thickness: 0.06,
    rotY: 0,
    openAngle: -Math.PI * 0.52,
    hingeSide: 'right',
    isMain: true,
  },
  // 2. Rear / Service Exterior Door
  {
    id: 'door-rear-service',
    category: 'exterior-service',
    label: 'Service Court Door',
    floor: 0,
    x: 6.05,
    y: 0.3,
    z: -8.875,
    width: 0.9,
    height: 2.1,
    thickness: 0.05,
    rotY: Math.PI,
    openAngle: Math.PI * 0.52,
    hingeSide: 'left',
  },
  // 3. Pool Terrace Sliding Glass Door
  {
    id: 'door-pool-sliding',
    category: 'exterior-sliding',
    label: 'Pool Terrace Sliding Glass Door',
    floor: 0,
    x: -5.5,
    y: 0.3,
    z: -8.875,
    width: 2.6,
    height: 2.3,
    thickness: 0.045,
    rotY: 0,
    isSliding: true,
    slideDistance: 1.25,
  },
  // 4-11: 8 Interior Hinged Doors
  {
    id: 'door-bedroom-1',
    category: 'interior',
    label: 'Bedroom 1 Door',
    floor: 0,
    x: 7.475,
    y: 0.3,
    z: 5.6,
    width: 0.9,
    height: 2.1,
    thickness: 0.045,
    rotY: Math.PI / 2,
    openAngle: -Math.PI * 0.5,
    hingeSide: 'left',
  },
  {
    id: 'door-bathroom-1',
    category: 'interior',
    label: 'Bathroom 1 Door',
    floor: 0,
    x: 10.2,
    y: 0.3,
    z: 4.675,
    width: 0.8,
    height: 2.1,
    thickness: 0.045,
    rotY: 0,
    openAngle: -Math.PI * 0.5,
    hingeSide: 'left',
  },
  {
    id: 'door-laundry',
    category: 'interior',
    label: 'Laundry Room Door',
    floor: 0,
    x: 6.05,
    y: 0.3,
    z: -6.275,
    width: 0.8,
    height: 2.1,
    thickness: 0.045,
    rotY: 0,
    openAngle: -Math.PI * 0.5,
    hingeSide: 'left',
  },
  {
    id: 'door-storage-ground',
    category: 'interior',
    label: 'Storage Closet Door',
    floor: 0,
    x: 4.05,
    y: 0.3,
    z: -7.175,
    width: 0.8,
    height: 2.1,
    thickness: 0.045,
    rotY: 0,
    openAngle: Math.PI * 0.5,
    hingeSide: 'left',
  },
  {
    id: 'door-bedroom-2',
    category: 'interior',
    label: 'Bedroom 2 Door',
    floor: 1,
    x: -7.175,
    y: 3.95,
    z: 1.1,
    width: 0.9,
    height: 2.1,
    thickness: 0.045,
    rotY: Math.PI / 2,
    openAngle: Math.PI * 0.5,
    hingeSide: 'left',
  },
  {
    id: 'door-bathroom-2',
    category: 'interior',
    label: 'Bathroom 2 Door',
    floor: 1,
    x: -10.5,
    y: 3.95,
    z: 4.475,
    width: 0.8,
    height: 2.1,
    thickness: 0.045,
    rotY: 0,
    openAngle: Math.PI * 0.5,
    hingeSide: 'left',
  },
  {
    id: 'door-wardrobe',
    category: 'interior',
    label: 'Walk-in Wardrobe Door',
    floor: 1,
    x: -8.1,
    y: 3.95,
    z: 4.475,
    width: 0.8,
    height: 2.1,
    thickness: 0.045,
    rotY: 0,
    openAngle: -Math.PI * 0.5,
    hingeSide: 'right',
  },
  {
    id: 'door-linen-upper',
    category: 'interior',
    label: 'Upper Linen Closet Door',
    floor: 1,
    x: -1.2,
    y: 3.95,
    z: -1.775,
    width: 0.8,
    height: 2.1,
    thickness: 0.045,
    rotY: 0,
    openAngle: Math.PI * 0.5,
    hingeSide: 'left',
  },
  // 12-13: 2 Balcony Access Doors
  {
    id: 'door-balcony-1',
    category: 'balcony',
    label: 'Main Balcony Door',
    floor: 1,
    x: -3.0,
    y: 3.95,
    z: -8.875,
    width: 1.5,
    height: 2.25,
    thickness: 0.05,
    rotY: Math.PI,
    openAngle: -Math.PI * 0.5,
    hingeSide: 'left',
    isGlassDoor: true,
  },
  {
    id: 'door-balcony-2',
    category: 'balcony',
    label: 'Bedroom 2 Balcony Door',
    floor: 1,
    x: -11.875,
    y: 3.95,
    z: 2.3,
    width: 1.4,
    height: 2.25,
    thickness: 0.05,
    rotY: Math.PI / 2,
    openAngle: -Math.PI * 0.5,
    hingeSide: 'left',
    isGlassDoor: true,
  },
];

/**
 * Staircase span: climbs from north side (Z = +5.70, Y = 0.30) toward south side (Z = +1.70, Y = 3.95)
 */
export const STAIRCASE = {
  minX: 0.65,
  maxX: 3.05,
  startZ: 5.7,
  endZ: 1.7,
  bottomY: 0.3,
  topY: 3.95,
  stepCount: 18,
};

/**
 * Pool and Service Court coordinates
 */
export const POOL_SPEC = {
  terraceMinX: -13.0,
  terraceMaxX: -1.0,
  terraceMinZ: -17.5,
  terraceMaxZ: -9.5,
  terraceY: 0.25,

  // 8.0 m long x 4.0 m wide rectangular pool inside the 12x8 m terrace
  poolMinX: -11.0,
  poolMaxX: -3.0,
  poolMinZ: -15.5,
  poolMaxZ: -11.5,
  waterLevelY: 0.2,
  waterDepth: 1.35,
  copingWidth: 0.25,
};

export const SERVICE_COURT_SPEC = {
  minX: 3.5,
  maxX: 8.5,
  minZ: -13.0,
  maxZ: -9.0,
  floorY: 0.04,
};

export const BALCONIES = [
  {
    id: 'balcony-1',
    name: 'Main Balcony',
    floor: 1,
    minX: -5.5,
    maxX: -0.5,
    minZ: -10.6,
    maxZ: -9.0,
    width: 5.0,
    depth: 1.6,
    floorY: 3.95,
    balustradeHeight: 1.05,
    floorFinish: 'teak-deck',
    orientation: 'rear',
  },
  {
    id: 'balcony-2',
    name: 'Secondary Balcony',
    floor: 1,
    minX: -13.4,
    maxX: -12.0,
    minZ: 0.8,
    maxZ: 3.8,
    width: 1.4,
    depth: 3.0,
    floorY: 3.95,
    balustradeHeight: 1.05,
    floorFinish: 'teak-deck',
    orientation: 'west',
  },
];

export const EXTERIOR_WALLS = [
  {
    id: 'wall-ext-front',
    name: 'Front Façade Wall',
    orientation: 'front',
    normal: [0, 0, 1],
    thickness: 0.25,
    center: { x: 0, z: 8.875 },
    minX: -12.0,
    maxX: 12.0,
    minZ: 8.75,
    maxZ: 9.0,
    groundBaseY: 0.3,
    groundHeight: 3.4,
    upperBaseY: 3.95,
    upperHeight: 3.1,
    openings: {
      windows: ['win-front-left', 'win-upper-living-left'],
      doors: ['door-main-entrance'],
    },
  },
  {
    id: 'wall-ext-rear',
    name: 'Rear Façade Wall',
    orientation: 'rear',
    normal: [0, 0, -1],
    thickness: 0.25,
    center: { x: 0, z: -8.875 },
    minX: -12.0,
    maxX: 12.0,
    minZ: -9.0,
    maxZ: -8.75,
    groundBaseY: 0.3,
    groundHeight: 3.4,
    upperBaseY: 3.95,
    upperHeight: 3.1,
    openings: {
      windows: ['win-rear-gallery', 'win-upper-lounge-rear', 'win-upper-gallery-rear'],
      doors: ['door-pool-sliding', 'door-rear-service', 'door-balcony-1'],
    },
  },
  {
    id: 'wall-ext-west',
    name: 'West Façade Wall',
    orientation: 'west',
    normal: [-1, 0, 0],
    thickness: 0.25,
    center: { x: -11.875, z: 0 },
    minX: -12.0,
    maxX: -11.75,
    minZ: -9.0,
    maxZ: 9.0,
    groundBaseY: 0.3,
    groundHeight: 3.4,
    upperBaseY: 3.95,
    upperHeight: 3.1,
    openings: {
      windows: ['win-kitchen-west', 'win-dining-west', 'win-bath2-west'],
      doors: ['door-balcony-2'],
    },
  },
  {
    id: 'wall-ext-east-ground',
    name: 'East Façade Wall (Ground)',
    orientation: 'east',
    normal: [1, 0, 0],
    thickness: 0.25,
    center: { x: 11.875, z: 0 },
    minX: 11.75,
    maxX: 12.0,
    minZ: -9.0,
    maxZ: 9.0,
    groundBaseY: 0.3,
    groundHeight: 3.4,
    openings: {
      windows: ['win-bed1-east', 'win-bath1-east'],
      doors: [],
    },
  },
  {
    id: 'wall-ext-east-upper',
    name: 'East Façade Wall (Upper Clerestory / Gallery)',
    orientation: 'east',
    normal: [1, 0, 0],
    thickness: 0.25,
    center: { x: 4.075, z: 5.375 },
    minX: 3.95,
    maxX: 4.2,
    minZ: 1.7,
    maxZ: 8.75,
    upperBaseY: 3.95,
    upperHeight: 3.1,
    openings: {
      windows: ['win-upper-gallery-east', 'win-upper-stair-east'],
      doors: [],
    },
  },
];

export const PARTITIONS = [
  // Ground floor partitions
  {
    id: 'part-ground-kitchen-living',
    floor: 0,
    name: 'Kitchen / Living Divider',
    axis: 'x',
    x: -7.0,
    minZ: 4.55,
    maxZ: 8.75,
    thickness: 0.15,
    baseY: 0.3,
    height: 3.4,
    doors: [],
  },
  {
    id: 'part-ground-living-stair',
    floor: 0,
    name: 'Living Hall / Stair Divider',
    axis: 'x',
    x: 0.475,
    minZ: 1.7,
    maxZ: 5.7,
    thickness: 0.15,
    baseY: 0.3,
    height: 3.4,
    doors: [],
  },
  {
    id: 'part-ground-east-corridor',
    floor: 0,
    name: 'East Corridor / Bedroom 1 Wall',
    axis: 'x',
    x: 7.475,
    minZ: 1.85,
    maxZ: 8.75,
    thickness: 0.15,
    baseY: 0.3,
    height: 3.4,
    doors: ['door-bedroom-1'],
  },
  {
    id: 'part-ground-bath1',
    floor: 0,
    name: 'Bedroom 1 / Bathroom 1 Divider',
    axis: 'z',
    z: 4.675,
    minX: 7.475,
    maxX: 11.75,
    thickness: 0.15,
    baseY: 0.3,
    height: 3.4,
    doors: ['door-bathroom-1'],
  },
  {
    id: 'part-ground-bath1-north',
    floor: 0,
    name: 'Bathroom 1 / Rear Corridor Divider',
    axis: 'z',
    z: 1.925,
    minX: 7.475,
    maxX: 11.75,
    thickness: 0.15,
    baseY: 0.3,
    height: 3.4,
    doors: [],
  },
  {
    id: 'part-ground-laundry-north',
    floor: 0,
    name: 'Laundry Room North Divider',
    axis: 'z',
    z: -6.275,
    minX: 4.875,
    maxX: 7.15,
    thickness: 0.15,
    baseY: 0.3,
    height: 3.4,
    doors: ['door-laundry'],
  },
  {
    id: 'part-ground-laundry-east',
    floor: 0,
    name: 'Laundry Room East Wall',
    axis: 'x',
    x: 7.225,
    minZ: -8.75,
    maxZ: -6.2,
    thickness: 0.15,
    baseY: 0.3,
    height: 3.4,
    doors: [],
  },
  {
    id: 'part-ground-laundry-west',
    floor: 0,
    name: 'Laundry / Storage Divider Wall',
    axis: 'x',
    x: 4.8,
    minZ: -8.75,
    maxZ: -6.2,
    thickness: 0.15,
    baseY: 0.3,
    height: 3.4,
    doors: [],
  },
  {
    id: 'part-ground-storage-north',
    floor: 0,
    name: 'Storage Closet North Divider',
    axis: 'z',
    z: -7.175,
    minX: 3.45,
    maxX: 4.725,
    thickness: 0.15,
    baseY: 0.3,
    height: 3.4,
    doors: ['door-storage-ground'],
  },
  {
    id: 'part-ground-storage-west',
    floor: 0,
    name: 'Storage Closet West Wall',
    axis: 'x',
    x: 3.375,
    minZ: -8.75,
    maxZ: -7.1,
    thickness: 0.15,
    baseY: 0.3,
    height: 3.4,
    doors: [],
  },

  // Upper floor partitions
  {
    id: 'part-upper-bed2-corridor',
    floor: 1,
    name: 'Bedroom 2 / Upper Landing Divider',
    axis: 'x',
    x: -7.175,
    minZ: 0.1,
    maxZ: 4.55,
    thickness: 0.15,
    baseY: 3.95,
    height: 3.1,
    doors: ['door-bedroom-2'],
  },
  {
    id: 'part-upper-bath2-south',
    floor: 1,
    name: 'Bedroom 2 / Bathroom 2 & Wardrobe Divider',
    axis: 'z',
    z: 4.475,
    minX: -11.75,
    maxX: -7.1,
    thickness: 0.15,
    baseY: 3.95,
    height: 3.1,
    doors: ['door-bathroom-2', 'door-wardrobe'],
  },
  {
    id: 'part-upper-wardrobe-bath2',
    floor: 1,
    name: 'Bathroom 2 / Walk-in Wardrobe Divider',
    axis: 'x',
    x: -9.2,
    minZ: 4.55,
    maxZ: 7.25,
    thickness: 0.15,
    baseY: 3.95,
    height: 3.1,
    doors: [],
  },
  {
    id: 'part-upper-bath2-north',
    floor: 1,
    name: 'Bathroom 2 & Wardrobe North Wall',
    axis: 'z',
    z: 7.325,
    minX: -11.75,
    maxX: -7.1,
    thickness: 0.15,
    baseY: 3.95,
    height: 3.1,
    doors: [],
  },
  {
    id: 'part-upper-wardrobe-east',
    floor: 1,
    name: 'Walk-in Wardrobe East Divider',
    axis: 'x',
    x: -7.175,
    minZ: 4.55,
    maxZ: 7.25,
    thickness: 0.15,
    baseY: 3.95,
    height: 3.1,
    doors: [],
  },
  {
    id: 'part-upper-linen',
    floor: 1,
    name: 'Upper Linen Closet Wall',
    axis: 'z',
    z: -1.775,
    minX: -1.875,
    maxX: -0.525,
    thickness: 0.15,
    baseY: 3.95,
    height: 3.1,
    doors: ['door-linen-upper'],
  },
  {
    id: 'part-upper-linen-west',
    floor: 1,
    name: 'Upper Linen Closet West Wall',
    axis: 'x',
    x: -1.875,
    minZ: -1.775,
    maxZ: -0.125,
    thickness: 0.15,
    baseY: 3.95,
    height: 3.1,
    doors: [],
  },
  {
    id: 'part-upper-linen-east',
    floor: 1,
    name: 'Upper Linen Closet East Wall',
    axis: 'x',
    x: -0.525,
    minZ: -1.775,
    maxZ: -0.125,
    thickness: 0.15,
    baseY: 3.95,
    height: 3.1,
    doors: [],
  },
  {
    id: 'part-upper-linen-rear',
    floor: 1,
    name: 'Upper Linen Closet Rear Wall',
    axis: 'z',
    z: -0.125,
    minX: -1.875,
    maxX: -0.525,
    thickness: 0.15,
    baseY: 3.95,
    height: 3.1,
    doors: [],
  },
];

/**
 * Resolve floor height at world (x, z, currentY) for smooth porch steps,
 * terrace steps, pool boundary protection, and main staircase walking.
 */
export function resolveGroundHeightAt(x, z, currentY) {
  // Staircase ramp when near or on stairs (ground or descending from upper floor)
  if (
    x >= STAIRCASE.minX - 0.1 &&
    x <= STAIRCASE.maxX + 0.1 &&
    z >= STAIRCASE.endZ - 0.2 &&
    z <= STAIRCASE.startZ + 0.2 &&
    currentY >= 0.15
  ) {
    const t = Math.min(
      1,
      Math.max(0, (STAIRCASE.startZ - z) / (STAIRCASE.startZ - STAIRCASE.endZ))
    );
    return STAIRCASE.bottomY + t * (STAIRCASE.topY - STAIRCASE.bottomY);
  }

  // Upper floor footprint (excluding double-height living atrium & stair opening)
  if (currentY > 2.2) {
    const onBalcony1 =
      x >= -5.6 && x <= -0.4 && z >= -10.7 && z <= -8.8;
    const onBalcony2 =
      x >= -13.5 && x <= -11.9 && z >= 0.7 && z <= 3.9;
    const inUpperMain = x >= -12.0 && x <= 4.2 && z >= -9.0 && z <= 9.0;
    if (onBalcony1 || onBalcony2 || inUpperMain) {
      return WORLD_DIMENSIONS.upperFloorY;
    }
  }

  // Inside house footprint (ground floor slab)
  if (x >= -12.0 && x <= 12.0 && z >= -9.0 && z <= 9.0) {
    return WORLD_DIMENSIONS.groundSlabTop;
  }

  // Front Porch (6 x 3 m) + 2 wide entry steps at Z = 12.0..12.8
  if (x >= WORLD_DIMENSIONS.porchMinX && x <= WORLD_DIMENSIONS.porchMaxX) {
    if (z >= WORLD_DIMENSIONS.porchMinZ && z <= WORLD_DIMENSIONS.porchMaxZ) {
      return WORLD_DIMENSIONS.groundSlabTop;
    }
    if (z > 12.0 && z <= 12.9) {
      const t = 1 - (z - 12.0) / 0.9;
      return 0.03 + t * (WORLD_DIMENSIONS.groundSlabTop - 0.03);
    }
  }

  // Pool Terrace deck + steps down to rear garden
  if (
    x >= POOL_SPEC.terraceMinX &&
    x <= POOL_SPEC.terraceMaxX &&
    z >= POOL_SPEC.terraceMinZ &&
    z <= POOL_SPEC.terraceMaxZ
  ) {
    return POOL_SPEC.terraceY;
  }
  if (
    x >= -8.0 &&
    x <= -3.0 &&
    z > POOL_SPEC.terraceMaxZ &&
    z <= -9.0
  ) {
    const t = (-9.0 - z) / 0.5;
    return WORLD_DIMENSIONS.groundSlabTop - t * 0.05;
  }

  // Main pathway height
  if (
    x >= WORLD_DIMENSIONS.pathwayCenterX - WORLD_DIMENSIONS.pathwayWidth * 0.5 - 0.12 &&
    x <= WORLD_DIMENSIONS.pathwayCenterX + WORLD_DIMENSIONS.pathwayWidth * 0.5 + 0.12 &&
    z >= 12.0 &&
    z <= 41.5
  ) {
    return 0.03;
  }

  // Service court pad
  if (
    x >= SERVICE_COURT_SPEC.minX &&
    x <= SERVICE_COURT_SPEC.maxX &&
    z >= SERVICE_COURT_SPEC.minZ &&
    z <= SERVICE_COURT_SPEC.maxZ
  ) {
    return SERVICE_COURT_SPEC.floorY;
  }

  return getTerrainHeight(x, z);
}

/**
 * Gentle garden terrain relief <= 0.5 m max, flattened cleanly around house, path, beds, and pool.
 */
export function getTerrainHeight(x, z) {
  // Flatten inside central estate zone around house, pathway, start plaza, pool & service court
  const distToPath = Math.abs(x - WORLD_DIMENSIONS.pathwayCenterX);
  if (x >= -15.5 && x <= 14.5 && z >= -19.5 && z <= 14.0) return 0;
  if (distToPath < 3.6 && z >= 11.0 && z <= 42.0) return 0;

  // Smooth blend outward into gentle garden undulation (max amplitude 0.22 m, well within 0.5 m limit)
  const edgeFade = Math.min(1, Math.max(0, (Math.hypot(x * 0.04, (z - 12) * 0.03) - 0.55) * 1.4));
  const wave =
    Math.sin(x * 0.11 + 0.4) * Math.cos(z * 0.09 - 0.2) * 0.14 +
    Math.sin(x * 0.05 - z * 0.06) * 0.08;
  return wave * edgeFade;
}

/**
 * Determine which of the 12 discovery zones corresponds to player coordinates (x, y, z).
 */
export function detectZoneAt(x, y, z) {
  if (y > 2.6) {
    if (
      (x >= -5.6 && x <= -0.4 && z >= -10.8 && z <= -8.8) ||
      (x >= -13.6 && x <= -11.9 && z >= 0.6 && z <= 4.0)
    ) {
      return { zoneId: 'balcony', label: 'Upper Balconies' };
    }
    if (x >= -11.9 && x <= -9.15 && z >= 4.45 && z <= 7.4) {
      return { zoneId: 'bathroom-2', label: 'Bathroom 2' };
    }
    if (x >= -11.9 && x <= -7.1 && z >= 0.0 && z <= 6.85) {
      return { zoneId: 'bedroom-2', label: 'Bedroom 2' };
    }
    return { zoneId: 'living-hall', label: 'Upper Gallery' };
  }

  // Front Porch
  if (
    x >= WORLD_DIMENSIONS.porchMinX &&
    x <= WORLD_DIMENSIONS.porchMaxX &&
    z >= WORLD_DIMENSIONS.porchMinZ &&
    z <= WORLD_DIMENSIONS.porchMaxZ
  ) {
    return { zoneId: 'front-porch', label: 'Front Porch' };
  }

  // Pool Terrace
  if (
    x >= POOL_SPEC.terraceMinX - 0.5 &&
    x <= POOL_SPEC.terraceMaxX + 0.5 &&
    z >= POOL_SPEC.terraceMinZ - 0.5 &&
    z <= POOL_SPEC.terraceMaxZ + 0.5
  ) {
    return { zoneId: 'pool-terrace', label: 'Pool Terrace' };
  }

  // Interior ground rooms
  if (x >= -12.0 && x <= 12.0 && z >= -9.0 && z <= 9.0) {
    if (x >= -11.9 && x <= -7.15 && z >= 4.45 && z <= 8.9) {
      return { zoneId: 'kitchen', label: 'Kitchen' };
    }
    if (x >= -11.9 && x <= -6.65 && z >= 0.05 && z <= 4.5) {
      return { zoneId: 'dining-hall', label: 'Dining & Family Hall' };
    }
    if (x >= 9.25 && x <= 11.9 && z >= 1.85 && z <= 4.7) {
      return { zoneId: 'bathroom-1', label: 'Bathroom 1' };
    }
    if (x >= 7.45 && x <= 11.9 && z >= 4.65 && z <= 8.9) {
      return { zoneId: 'bedroom-1', label: 'Bedroom 1' };
    }
    if (x >= 4.85 && x <= 7.25 && z >= -8.9 && z <= -6.25) {
      return { zoneId: 'laundry-room', label: 'Laundry Room' };
    }
    if (x >= -11.9 && x <= -5.0 && z >= -8.9 && z <= 0.1) {
      return { zoneId: 'dining-hall', label: 'Dining & Family Hall' };
    }
    return { zoneId: 'living-hall', label: 'Living Hall' };
  }

  return { zoneId: 'flower-garden', label: 'Flower Garden' };
}

/**
 * Single source of truth floor plan contract per PROJECT.md interface specifications.
 */
export function getFloorPlan() {
  return {
    dimensions: WORLD_DIMENSIONS,
    foundation: {
      width: WORLD_DIMENSIONS.houseWidth,
      depth: WORLD_DIMENSIONS.houseDepth,
      thickness: WORLD_DIMENSIONS.groundSlabThickness,
      topY: WORLD_DIMENSIONS.groundSlabTop,
      minX: WORLD_DIMENSIONS.houseMinX,
      maxX: WORLD_DIMENSIONS.houseMaxX,
      minZ: WORLD_DIMENSIONS.houseMinZ,
      maxZ: WORLD_DIMENSIONS.houseMaxZ,
    },
    exteriorWalls: EXTERIOR_WALLS,
    partitions: PARTITIONS,
    openings: {
      windows: WINDOWS,
      doors: DOORS,
    },
    stairs: STAIRCASE,
    balconies: BALCONIES,
    rooms: ROOMS,
  };
}
