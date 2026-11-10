/**
 * Reactive state store for Sandalwood Garden Estate (pure JS pub/sub).
 */

export const DISCOVERY_ZONES = [
  { id: 'flower-garden', label: 'Flower Garden' },
  { id: 'front-porch', label: 'Front Porch' },
  { id: 'living-hall', label: 'Living Hall' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'dining-hall', label: 'Dining & Family Hall' },
  { id: 'bedroom-1', label: 'Bedroom 1' },
  { id: 'bathroom-1', label: 'Bathroom 1' },
  { id: 'bedroom-2', label: 'Bedroom 2' },
  { id: 'bathroom-2', label: 'Bathroom 2' },
  { id: 'laundry-room', label: 'Laundry Room' },
  { id: 'pool-terrace', label: 'Pool Terrace' },
  { id: 'balcony', label: 'Upper Balconies' },
];

export const QUALITY_PROFILES = {
  low: {
    label: 'Low',
    shadowMapSize: 1024,
    flowerDensity: 0.5,
    grassDensity: 0.25,
    pixelRatioCap: 0.85,
    foliageSway: 0.0,
    poolReflections: false,
  },
  medium: {
    label: 'Medium',
    shadowMapSize: 2048,
    flowerDensity: 0.75,
    grassDensity: 0.55,
    pixelRatioCap: 1.0,
    foliageSway: 0.55,
    poolReflections: true,
  },
  high: {
    label: 'High',
    shadowMapSize: 4096,
    flowerDensity: 1.0,
    grassDensity: 1.0,
    pixelRatioCap: 1.25,
    foliageSway: 1.0,
    poolReflections: true,
  },
};

const initialState = () => ({
  screen: 'loading', // 'loading' | 'start' | 'playing' | 'paused'
  loadProgress: 0,
  loadLabel: 'Preparing Sandalwood Estate...',
  selectedCharacter: 'female', // 'female' | 'male'
  timeOfDay: 'day', // 'day' | 'sunset' | 'night'
  weather: 'clear', // 'clear' | 'cloud' | 'rain'
  quality: 'medium', // 'low' | 'medium' | 'high'
  mouseSensitivity: 1.0,
  invertY: false,
  audioVolume: 0.55,
  muted: false,
  hudHidden: false,
  thirdPerson: false,
  pointerLocked: false,

  currentZoneId: 'flower-garden',
  currentZoneLabel: 'Flower Garden',
  discoveredZones: ['flower-garden'],
  estateCompletedShown: false,

  activeTarget: null, // { id, label, prompt, kind }
  seatedSeat: null, // { id, label }
  inspectionItem: null, // { title, category, description, specs, actionLabel, actionId }

  doors: {}, // doorId -> boolean (true = open)
  tvOn: true,
  showers: {
    bath1: false,
    bath2: false,
  },
  bedsideLamps: {
    b1Left: true,
    b1Right: true,
    b2Left: true,
    b2Right: true,
  },
  appliances: {
    washerRunning: false,
    dryerRunning: false,
  },
  activeOverlay: null, // null | 'characters' | 'controls' | 'settings'
  resetNonce: 0,
});

class GameStore {
  constructor() {
    this.state = initialState();
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  setState(updater) {
    const patch = typeof updater === 'function' ? updater(this.state) : updater;
    if (!patch || Object.keys(patch).length === 0) return;
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) {
      listener(this.state, patch);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  discoverZone(zoneId, zoneLabel) {
    const { discoveredZones, currentZoneId } = this.state;
    const alreadyDiscovered = discoveredZones.includes(zoneId);
    const nextDiscovered = alreadyDiscovered
      ? discoveredZones
      : [...discoveredZones, zoneId];

    if (currentZoneId !== zoneId || !alreadyDiscovered) {
      this.setState({
        currentZoneId: zoneId,
        currentZoneLabel: zoneLabel,
        discoveredZones: nextDiscovered,
      });
    }
  }

  toggleDoor(doorId) {
    const prev = Boolean(this.state.doors[doorId]);
    this.setState({
      doors: {
        ...this.state.doors,
        [doorId]: !prev,
      },
    });
    return !prev;
  }

  toggleShower(bathKey) {
    const next = !this.state.showers[bathKey];
    this.setState({
      showers: {
        ...this.state.showers,
        [bathKey]: next,
      },
    });
    return next;
  }

  toggleLamp(lampKey) {
    const next = !this.state.bedsideLamps[lampKey];
    this.setState({
      bedsideLamps: {
        ...this.state.bedsideLamps,
        [lampKey]: next,
      },
    });
    return next;
  }

  toggleAppliance(key) {
    const next = !this.state.appliances[key];
    this.setState({
      appliances: {
        ...this.state.appliances,
        [key]: next,
      },
    });
    return next;
  }

  resetExperience() {
    const keptQuality = this.state.quality;
    const keptMuted = this.state.muted;
    const keptVolume = this.state.audioVolume;
    const keptChar = this.state.selectedCharacter;
    this.setState({
      ...initialState(),
      screen: 'playing',
      loadProgress: 100,
      loadLabel: 'Ready',
      quality: keptQuality,
      muted: keptMuted,
      audioVolume: keptVolume,
      selectedCharacter: keptChar,
      resetNonce: this.state.resetNonce + 1,
    });
  }
}

export const gameStore = new GameStore();