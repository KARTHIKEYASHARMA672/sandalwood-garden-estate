/**
 * Zero-dependency headless DOM, Canvas2D, and Web Audio API environment shim for Node.js / Vitest.
 * Enables Three.js procedural texture generation, Web Audio synthesis, and player controls
 * to execute genuinely in Node.js test environments.
 */

class MockCanvasContext2D {
  constructor(canvas) {
    this.canvas = canvas;
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.globalAlpha = 1.0;
    this.shadowColor = 'transparent';
    this.shadowBlur = 0;
  }

  fillRect(_x, _y, _w, _h) {}
  strokeRect(_x, _y, _w, _h) {}
  clearRect(_x, _y, _w, _h) {}

  beginPath() {}
  closePath() {}
  moveTo(_x, _y) {}
  lineTo(_x, _y) {}
  arc(_x, _y, _r, _startAngle, _endAngle) {}
  ellipse(_x, _y, _rx, _ry, _rot, _start, _end) {}
  fill() {}
  stroke() {}
  save() {}
  restore() {}
  translate(_x, _y) {}
  rotate(_angle) {}
  scale(_x, _y) {}

  createLinearGradient(_x0, _y0, _x1, _y1) {
    return {
      addColorStop: (_offset, _color) => {},
    };
  }

  createRadialGradient(_x0, _y0, _r0, _x1, _y1, _r1) {
    return {
      addColorStop: (_offset, _color) => {},
    };
  }

  getImageData(_x, _y, w, h) {
    return {
      width: w,
      height: h,
      data: new Uint8ClampedArray(w * h * 4),
    };
  }

  putImageData(_imgData, _x, _y) {}
}

class MockCanvasElement {
  constructor(width = 512, height = 512) {
    this.width = width;
    this.height = height;
    this.style = {};
    this._listeners = new Map();
    this._ctx2d = new MockCanvasContext2D(this);
  }

  getContext(type) {
    if (type === '2d') {
      return this._ctx2d;
    }
    return null;
  }

  addEventListener(type, listener) {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type).add(listener);
  }

  removeEventListener(type, listener) {
    if (this._listeners.has(type)) {
      this._listeners.get(type).delete(listener);
    }
  }

  dispatchEvent(event) {
    const set = this._listeners.get(event.type);
    if (set) {
      for (const listener of set) {
        listener(event);
      }
    }
    return true;
  }

  requestPointerLock() {
    if (globalThis.document) {
      globalThis.document.pointerLockElement = this;
      globalThis.document.dispatchEvent({ type: 'pointerlockchange' });
    }
    return Promise.resolve();
  }
}

class MockAudioParam {
  constructor(val = 0) {
    this.value = val;
  }
  setValueAtTime(v, _time) {
    this.value = v;
  }
  linearRampToValueAtTime(v, _time) {
    this.value = v;
  }
  exponentialRampToValueAtTime(v, _time) {
    this.value = v;
  }
  setTargetAtTime(v, _time, _constant) {
    this.value = v;
  }
}

class MockGainNode {
  constructor() {
    this.gain = new MockAudioParam(1.0);
  }
  connect(_dest) {}
  disconnect() {}
}

class MockOscillatorNode {
  constructor() {
    this.type = 'sine';
    this.frequency = new MockAudioParam(440);
  }
  connect(_dest) {}
  disconnect() {}
  start(_time) {}
  stop(_time) {}
}

class MockBiquadFilterNode {
  constructor() {
    this.type = 'lowpass';
    this.frequency = new MockAudioParam(1000);
    this.Q = new MockAudioParam(1);
  }
  connect(_dest) {}
  disconnect() {}
}

class MockAudioBufferSourceNode {
  constructor() {
    this.buffer = null;
    this.loop = false;
  }
  connect(_dest) {}
  disconnect() {}
  start(_time, _offset, _duration) {}
  stop(_time) {}
}

class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.sampleRate = 44100;
    this.currentTime = 0.0;
    this.destination = new MockGainNode();
  }

  createGain() {
    return new MockGainNode();
  }

  createOscillator() {
    return new MockOscillatorNode();
  }

  createBiquadFilter() {
    return new MockBiquadFilterNode();
  }

  createBufferSource() {
    return new MockAudioBufferSourceNode();
  }

  createBuffer(channels, length, sampleRate) {
    const bufferData = new Float32Array(length);
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      getChannelData: (_ch) => bufferData,
    };
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

const windowListeners = new Map();
const documentListeners = new Map();

export function setupMockEnv() {
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = globalThis;
  }

  globalThis.window.addEventListener = (type, listener) => {
    if (!windowListeners.has(type)) {
      windowListeners.set(type, new Set());
    }
    windowListeners.get(type).add(listener);
  };

  globalThis.window.removeEventListener = (type, listener) => {
    if (windowListeners.has(type)) {
      windowListeners.get(type).delete(listener);
    }
  };

  globalThis.window.dispatchEvent = (event) => {
    const set = windowListeners.get(event.type);
    if (set) {
      for (const listener of set) {
        listener(event);
      }
    }
    return true;
  };

  globalThis.window.AudioContext = MockAudioContext;
  globalThis.window.webkitAudioContext = MockAudioContext;
  globalThis.AudioContext = MockAudioContext;

  if (typeof globalThis.document === 'undefined') {
    globalThis.document = {};
  }

  globalThis.document.createElement = (tag) => {
    if (tag.toLowerCase() === 'canvas') {
      return new MockCanvasElement();
    }
    return {
      tagName: tag.toUpperCase(),
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  };

  globalThis.document.addEventListener = (type, listener) => {
    if (!documentListeners.has(type)) {
      documentListeners.set(type, new Set());
    }
    documentListeners.get(type).add(listener);
  };

  globalThis.document.removeEventListener = (type, listener) => {
    if (documentListeners.has(type)) {
      documentListeners.get(type).delete(listener);
    }
  };

  globalThis.document.dispatchEvent = (event) => {
    const set = documentListeners.get(event.type);
    if (set) {
      for (const listener of set) {
        listener(event);
      }
    }
    return true;
  };

  globalThis.document.exitPointerLock = () => {
    globalThis.document.pointerLockElement = null;
    globalThis.document.dispatchEvent({ type: 'pointerlockchange' });
  };

  globalThis.document.pointerLockElement = null;
}

export function teardownMockEnv() {
  windowListeners.clear();
  documentListeners.clear();
  if (globalThis.document) {
    globalThis.document.pointerLockElement = null;
  }
}

export function simulateKeyDown(code, extra = {}) {
  const event = {
    type: 'keydown',
    code,
    preventDefault: () => {},
    ...extra,
  };
  globalThis.window.dispatchEvent(event);
}

export function simulateKeyUp(code, extra = {}) {
  const event = {
    type: 'keyup',
    code,
    preventDefault: () => {},
    ...extra,
  };
  globalThis.window.dispatchEvent(event);
}

export function simulateMouseMove(movementX, movementY) {
  const event = {
    type: 'mousemove',
    movementX,
    movementY,
  };
  globalThis.document.dispatchEvent(event);
}

export function createMockCanvas(width = 800, height = 600) {
  return new MockCanvasElement(width, height);
}

// Automatically setup on module load
setupMockEnv();
