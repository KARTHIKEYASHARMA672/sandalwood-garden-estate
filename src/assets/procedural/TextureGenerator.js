import * as THREE from 'three';

/**
 * Procedural PBR Texture Generator for Sandalwood Garden Estate.
 * Generates cached, deterministic multi-map PBR texture suites
 * (`map`, `bumpMap`, `normalMap`, `roughnessMap`) for timber grains, stonework,
 * plastered walls, roof shingles, textiles, foliage, bark, and curated artwork.
 */

const cache = new Map();
const baseCanvasCache = new Map();

function seededRand(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function mixRgb(a, b, t) {
  const k = clamp01(t);
  return [
    Math.round(a.r + (b.r - a.r) * k),
    Math.round(a.g + (b.g - a.g) * k),
    Math.round(a.b + (b.b - a.b) * k),
  ];
}

function hash2d(ix, iy, seed = 13) {
  let n = ix * 374761393 + iy * 668265263 + seed * 1442695041;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

function valueNoise2d(x, y, seed = 13, period = 64) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const p0x = ((x0 % period) + period) % period;
  const p1x = (((x0 + 1) % period) + period) % period;
  const p0y = ((y0 % period) + period) % period;
  const p1y = (((y0 + 1) % period) + period) % period;

  const n00 = hash2d(p0x, p0y, seed);
  const n10 = hash2d(p1x, p0y, seed);
  const n01 = hash2d(p0x, p1y, seed);
  const n11 = hash2d(p1x, p1y, seed);
  const nx0 = n00 + (n10 - n00) * u;
  const nx1 = n01 + (n11 - n01) * u;
  return nx0 + (nx1 - nx0) * v;
}

function fbmTileable(u, v, seed = 17, baseFreq = 6) {
  let sum = 0;
  let amp = 0.55;
  let freq = baseFreq;
  for (let o = 0; o < 3; o++) {
    sum += amp * valueNoise2d(u * freq, v * freq, seed + o * 31, freq);
    freq *= 2;
    amp *= 0.45;
  }
  return clamp01(sum / 0.89);
}

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function configureTexture(canvas, { repeatX = 1, repeatY = 1, srgb = true } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Converts a scalar height buffer [0..1] into tangent-space RGB normalMap and grayscale roughnessMap canvases.
 * Safe for both browser Canvas2D and headless MockCanvasContext2D.
 */
function buildNormalAndRoughnessCanvases(heightBuf, roughBuf, size, strength = 2.4) {
  const normCanvas = makeCanvas(size, size);
  const roughCanvas = makeCanvas(size, size);
  const ntx = normCanvas.getContext('2d');
  const rtx = roughCanvas.getContext('2d');

  const nImg = ntx.getImageData(0, 0, size, size);
  const rImg = rtx.getImageData(0, 0, size, size);
  const nData = nImg.data;
  const rData = rImg.data;

  for (let y = 0; y < size; y++) {
    const ym = (y - 1 + size) % size;
    const yp = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;

      const idx = y * size + x;
      const hL = heightBuf[y * size + xm];
      const hR = heightBuf[y * size + xp];
      const hU = heightBuf[ym * size + x];
      const hD = heightBuf[yp * size + x];

      const dx = (hL - hR) * strength;
      const dy = (hU - hD) * strength;
      const invLen = 1 / Math.sqrt(dx * dx + dy * dy + 1);

      const off = idx * 4;
      nData[off] = Math.round((dx * invLen * 0.5 + 0.5) * 255);
      nData[off + 1] = Math.round((dy * invLen * 0.5 + 0.5) * 255);
      nData[off + 2] = Math.round((invLen * 0.5 + 0.5) * 255);
      nData[off + 3] = 255;

      const rv = Math.round(clamp01(roughBuf[idx]) * 255);
      rData[off] = rv;
      rData[off + 1] = rv;
      rData[off + 2] = rv;
      rData[off + 3] = 255;
    }
  }

  ntx.putImageData(nImg, 0, 0);
  rtx.putImageData(rImg, 0, 0);
  return { normCanvas, roughCanvas };
}

/**
 * Generates seamless cathedral/quarter-sawn cabinet-grade furniture wood textures
 * (`map`, `normalMap`, `roughnessMap`) with ZERO brick-grid plank grooves or butt joints.
 */
export function getFurnitureWoodTextures(variant = 'walnut', repeatX = 1, repeatY = 1) {
  const key = `furniture-wood:${variant}:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const baseKey = `furniture-wood-base:${variant}`;
  let baseCanvases = baseCanvasCache.get(baseKey);
  if (!baseCanvases) {
    const palettes = {
      walnut: { base: '#6F4B32', sec: '#543622', hi: '#8C6242', pore: '#3D2516', roughBase: 0.44 },
      sandalwood: { base: '#C1905D', sec: '#9D6D42', hi: '#DAA974', pore: '#7B512D', roughBase: 0.48 },
      oak: { base: '#C59A6B', sec: '#A87D50', hi: '#DAB487', pore: '#865E37', roughBase: 0.46 },
      teak: { base: '#9B6C45', sec: '#7F5634', hi: '#B5855B', pore: '#5D3C22', roughBase: 0.56 },
    };
    const pal = palettes[variant] || palettes.walnut;
    const size = 256;
    const colorCanvas = makeCanvas(size, size);
    const ctx = colorCanvas.getContext('2d');

    const cBase = hexToRgb(pal.base);
    const cSec = hexToRgb(pal.sec);
    const cHi = hexToRgb(pal.hi);
    const cPore = hexToRgb(pal.pore);

    const cImg = ctx.getImageData(0, 0, size, size);
    const heightBuf = new Float32Array(size * size);
    const roughBuf = new Float32Array(size * size);
    const seed = variant.length * 1307 + 79;

    for (let y = 0; y < size; y++) {
      const v = y / size;
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const idx = y * size + x;
        const off = idx * 4;

        // Smooth organic cabinet-grade wood grain flowing continuously with subtle cathedral crown figure
        const warp = (fbmTileable(u * 1.6, v * 0.55, seed, 4) - 0.5) * 0.45;
        const grainU = u + warp * 0.22;
        const cathedral = Math.sin(
          (Math.hypot((grainU - 0.5) * 1.15, (v - 0.5) * 0.22) * 8.5 + warp * 2.2) * Math.PI
        );
        const silkFiber = fbmTileable(u * 12.0, v * 0.45, seed + 137, 5) - 0.5;
        const finePore = fbmTileable(u * 8.0, v * 1.1, seed + 193, 6);
        const tonalSweep = (fbmTileable(u * 0.9, v * 0.9, seed + 251, 3) - 0.5) * 0.12;

        const figure = cathedral * 0.36 + silkFiber * 0.64;
        const tGrain = clamp01(0.5 + figure * 0.16 + (finePore - 0.5) * 0.18 + tonalSweep);

        let rgb = tGrain < 0.5
          ? mixRgb(cSec, cBase, tGrain * 2.0)
          : mixRgb(cBase, cHi, (tGrain - 0.5) * 2.0);

        if (finePore < 0.24) {
          const poreMix = (0.24 - finePore) * 1.25;
          rgb = mixRgb({ r: rgb[0], g: rgb[1], b: rgb[2] }, cPore, poreMix * 0.3);
        }

        cImg.data[off] = rgb[0];
        cImg.data[off + 1] = rgb[1];
        cImg.data[off + 2] = rgb[2];
        cImg.data[off + 3] = 255;

        const hVal = clamp01(0.52 + figure * 0.04 + (finePore - 0.5) * 0.08);
        heightBuf[idx] = hVal;
        roughBuf[idx] = clamp01(pal.roughBase + (1 - hVal) * 0.07);
      }
    }

    ctx.putImageData(cImg, 0, 0);
    const { normCanvas, roughCanvas } = buildNormalAndRoughnessCanvases(heightBuf, roughBuf, size, 0.62);
    baseCanvases = { colorCanvas, normCanvas, roughCanvas };
    baseCanvasCache.set(baseKey, baseCanvases);
  }

  const pair = {
    map: configureTexture(baseCanvases.colorCanvas, { repeatX, repeatY, srgb: true }),
    normalMap: configureTexture(baseCanvases.normCanvas, { repeatX, repeatY, srgb: false }),
    roughnessMap: configureTexture(baseCanvases.roughCanvas, { repeatX, repeatY, srgb: false }),
    isContinuousFurnitureWood: true,
  };
  cache.set(key, pair);
  return pair;
}

/**
 * Generates paired albedo + bump + normal + roughness maps for planked timber surfaces.
 */
export function getTimberTextures(variant = 'sandalwood', repeatX = 2, repeatY = 2) {
  const key = `timber:${variant}:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const baseKey = `timber-base:${variant}`;
  let baseCanvases = baseCanvasCache.get(baseKey);
  if (!baseCanvases) {
    const palettes = {
      sandalwood: { base: '#B88755', sec: '#91633B', hi: '#D4AF7C', gap: '#5C3C26', planks: 7, roughBase: 0.62, groovePx: 2.2, buttPx: 1.3, contrast: 0.24, shadeMin: 0.86, normStrength: 2.8 },
      walnut: { base: '#7E5A3E', sec: '#66462E', hi: '#967052', gap: '#4C3320', planks: 5, roughBase: 0.54, groovePx: 1.1, buttPx: 0.8, contrast: 0.14, shadeMin: 0.93, normStrength: 1.25 },
      oak: { base: '#CAA376', sec: '#B68D5F', hi: '#DDC098', gap: '#AC865C', planks: 5, roughBase: 0.52, groovePx: 1.0, buttPx: 0.7, contrast: 0.11, shadeMin: 0.94, normStrength: 1.05 },
      teak: { base: '#966944', sec: '#7C5435', hi: '#B08259', gap: '#4C321D', planks: 9, roughBase: 0.65, groovePx: 2.0, buttPx: 1.1, contrast: 0.22, shadeMin: 0.88, normStrength: 2.4 },
      slats: { base: '#A6774B', sec: '#855C3B', hi: '#C49567', gap: '#392313', planks: 16, roughBase: 0.58, groovePx: 2.2, buttPx: 1.3, contrast: 0.24, shadeMin: 0.86, normStrength: 2.8 },
    };
    const pal = palettes[variant] || palettes.sandalwood;
    const groovePx = pal.groovePx ?? 2.2;
    const buttPx = pal.buttPx ?? 1.3;
    const contrast = pal.contrast ?? 0.24;
    const shadeMin = pal.shadeMin ?? 0.86;
    const normStrength = pal.normStrength ?? 2.8;
    const size = 256;
    const colorCanvas = makeCanvas(size, size);
    const bumpCanvas = makeCanvas(size, size);
    const ctx = colorCanvas.getContext('2d');
    const btx = bumpCanvas.getContext('2d');

    const cBase = hexToRgb(pal.base);
    const cSec = hexToRgb(pal.sec);
    const cHi = hexToRgb(pal.hi);
    const cGap = hexToRgb(pal.gap);

    const cImg = ctx.getImageData(0, 0, size, size);
    const bImg = btx.getImageData(0, 0, size, size);
    const heightBuf = new Float32Array(size * size);
    const roughBuf = new Float32Array(size * size);
    const seed = variant.length * 917 + 13;

    const plankPx = size / pal.planks;
    for (let y = 0; y < size; y++) {
      const v = y / size;
      const pIdx = Math.floor(y / plankPx);
      const localY = (y - pIdx * plankPx) / plankPx;
      const isGroove = y - pIdx * plankPx < groovePx;
      const plankTone = hash2d(pIdx, 7, seed);
      const plankShift = (plankTone - 0.5) * contrast;
      const jointX = (((pIdx * 97 + 43) % (size - 24)) + 12);

      for (let x = 0; x < size; x++) {
        const u = x / size;
        const idx = y * size + x;
        const off = idx * 4;
        const isButt = Math.abs(x - jointX) < buttPx;

        if (isGroove || isButt) {
          cImg.data[off] = cGap.r;
          cImg.data[off + 1] = cGap.g;
          cImg.data[off + 2] = cGap.b;
          cImg.data[off + 3] = 255;

          bImg.data[off] = 52;
          bImg.data[off + 1] = 52;
          bImg.data[off + 2] = 52;
          bImg.data[off + 3] = 255;

          heightBuf[idx] = 0.08;
          roughBuf[idx] = 0.94;
          continue;
        }

        // Elongated wood-grain value noise stretched along X (grain direction)
        const warp = fbmTileable(u, v * 3.0, seed + pIdx * 19, 4) * 3.8;
        const grainWave = Math.sin((localY * 18.0 + warp + pIdx * 2.3) * Math.PI);
        const fineFiber = fbmTileable(u * 2.0, v * 8.0, seed + 101, 8);
        const grainWeight = variant === 'oak' || variant === 'walnut' ? 0.22 : 0.34;
        const tGrain = clamp01(0.5 + grainWave * grainWeight + (fineFiber - 0.5) * 0.24 + plankShift);

        const rgb = tGrain < 0.5
          ? mixRgb(cSec, cBase, tGrain * 2.0)
          : mixRgb(cBase, cHi, (tGrain - 0.5) * 2.0);

        // Subtle bevel edge brightening/darkening near plank groove
        const bevel = Math.min(1, Math.min(localY, 1 - localY) * 14);
        const shade = shadeMin + (1 - shadeMin) * bevel;

        cImg.data[off] = Math.round(rgb[0] * shade);
        cImg.data[off + 1] = Math.round(rgb[1] * shade);
        cImg.data[off + 2] = Math.round(rgb[2] * shade);
        cImg.data[off + 3] = 255;

        const hVal = clamp01(0.45 + grainWave * 0.14 + (fineFiber - 0.5) * 0.16 + bevel * 0.1);
        heightBuf[idx] = hVal;
        roughBuf[idx] = clamp01(pal.roughBase + (1 - hVal) * 0.16);

        const bv = Math.round(145 + hVal * 85);
        bImg.data[off] = bv;
        bImg.data[off + 1] = bv;
        bImg.data[off + 2] = bv;
        bImg.data[off + 3] = 255;
      }
    }

    ctx.putImageData(cImg, 0, 0);
    btx.putImageData(bImg, 0, 0);
    const { normCanvas, roughCanvas } = buildNormalAndRoughnessCanvases(heightBuf, roughBuf, size, normStrength);
    baseCanvases = { colorCanvas, bumpCanvas, normCanvas, roughCanvas };
    baseCanvasCache.set(baseKey, baseCanvases);
  }

  const pair = {
    map: configureTexture(baseCanvases.colorCanvas, { repeatX, repeatY, srgb: true }),
    bumpMap: configureTexture(baseCanvases.bumpCanvas, { repeatX, repeatY, srgb: false }),
    normalMap: configureTexture(baseCanvases.normCanvas, { repeatX, repeatY, srgb: false }),
    roughnessMap: configureTexture(baseCanvases.roughCanvas, { repeatX, repeatY, srgb: false }),
  };
  cache.set(key, pair);
  return pair;
}

/**
 * Generates seamless vertical acoustic sandalwood slat textures (no horizontal grooves or butt seams)
 * with continuous vertical wood grain and recessed shadow reveals between vertical battens.
 */
export function getVerticalSlatsTextures(repeatX = 1, repeatY = 1) {
  const key = `vertical-slats:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const baseKey = 'vertical-slats-base';
  let baseCanvases = baseCanvasCache.get(baseKey);
  if (!baseCanvases) {
    const size = 256;
    const battens = 6;
    const colorCanvas = makeCanvas(size, size);
    const ctx = colorCanvas.getContext('2d');
    const cImg = ctx.getImageData(0, 0, size, size);
    const heightBuf = new Float32Array(size * size);
    const roughBuf = new Float32Array(size * size);

    const cBase = hexToRgb('#AA7A4E');
    const cSec = hexToRgb('#8A5F39');
    const cHi = hexToRgb('#C8986B');
    const cShadow = hexToRgb('#2A1A0E');
    const battenPx = size / battens;

    for (let y = 0; y < size; y++) {
      const v = y / size;
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const idx = y * size + x;
        const off = idx * 4;

        const bIdx = Math.floor(x / battenPx);
        const localX = (x - bIdx * battenPx) / battenPx;
        const isGap = localX < 0.14;
        const toneShift = (hash2d(bIdx, 19, 1741) - 0.5) * 0.16;

        if (isGap) {
          cImg.data[off] = cShadow.r;
          cImg.data[off + 1] = cShadow.g;
          cImg.data[off + 2] = cShadow.b;
          cImg.data[off + 3] = 255;
          heightBuf[idx] = 0.08;
          roughBuf[idx] = 0.94;
          continue;
        }

        const faceU = (localX - 0.14) / 0.86;
        const silk = fbmTileable(u * 10.0, v * 0.9, 1741 + bIdx * 31, 5) - 0.5;
        const fine = fbmTileable(u * 16.0, v * 1.4, 2111, 5) - 0.5;
        const crown = Math.sin(faceU * Math.PI);
        const tGrain = clamp01(0.5 + silk * 0.34 + fine * 0.22 + toneShift);

        const rgb = tGrain < 0.5
          ? mixRgb(cSec, cBase, tGrain * 2.0)
          : mixRgb(cBase, cHi, (tGrain - 0.5) * 2.0);
        const shade = 0.86 + 0.14 * crown;

        cImg.data[off] = Math.round(rgb[0] * shade);
        cImg.data[off + 1] = Math.round(rgb[1] * shade);
        cImg.data[off + 2] = Math.round(rgb[2] * shade);
        cImg.data[off + 3] = 255;

        const hVal = clamp01(0.55 + crown * 0.32 + silk * 0.08);
        heightBuf[idx] = hVal;
        roughBuf[idx] = clamp01(0.54 + (1 - crown) * 0.16);
      }
    }

    ctx.putImageData(cImg, 0, 0);
    const { normCanvas, roughCanvas } = buildNormalAndRoughnessCanvases(heightBuf, roughBuf, size, 2.2);
    baseCanvases = { colorCanvas, normCanvas, roughCanvas };
    baseCanvasCache.set(baseKey, baseCanvases);
  }

  const pair = {
    map: configureTexture(baseCanvases.colorCanvas, { repeatX, repeatY, srgb: true }),
    normalMap: configureTexture(baseCanvases.normCanvas, { repeatX, repeatY, srgb: false }),
    roughnessMap: configureTexture(baseCanvases.roughCanvas, { repeatX, repeatY, srgb: false }),
  };
  cache.set(key, pair);
  return pair;
}

/**
 * Generates stone paver or tile textures with subtle sedimentary veining, recessed joints,
 * tangent-space normal maps, and matte-vs-honed roughness variation.
 */
export function getStoneTileTextures(variant = 'paver', repeatX = 2, repeatY = 2) {
  const key = `stone:${variant}:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const baseKey = `stone-base:${variant}`;
  let baseCanvases = baseCanvasCache.get(baseKey);
  if (!baseCanvases) {
    const configs = {
      paver: { bg: '#D4C6B0', alt: '#C1B299', grout: '#877B67', cols: 2, rows: 4, groutPx: 2.6, roughBase: 0.78 },
      foyer: { bg: '#CBBBA1', alt: '#BDB096', grout: '#948772', cols: 2, rows: 2, groutPx: 2.0, roughBase: 0.62 },
      limestone: { bg: '#C9BEAC', alt: '#BBB09D', grout: '#938977', cols: 2, rows: 2, groutPx: 1.8, roughBase: 0.68 },
      bathWall: { bg: '#D7D2C8', alt: '#C5BCAD', grout: '#A39D91', cols: 2, rows: 1, groutPx: 1.8, roughBase: 0.56 },
      bathFloor: { bg: '#BBB5AA', alt: '#AEA79C', grout: '#878177', cols: 2, rows: 2, groutPx: 2.2, roughBase: 0.72 },
      laundry: { bg: '#ACA59B', alt: '#9D968B', grout: '#777167', cols: 2, rows: 2, groutPx: 2.2, roughBase: 0.76 },
      poolMosaic: { bg: '#67B8D1', alt: '#4E9FC0', grout: '#9ADAE8', cols: 8, rows: 8, groutPx: 1.5, roughBase: 0.34 },
    };
    const cfg = configs[variant] || configs.paver;
    const size = 256;
    const colorCanvas = makeCanvas(size, size);
    const bumpCanvas = makeCanvas(size, size);
    const ctx = colorCanvas.getContext('2d');
    const btx = bumpCanvas.getContext('2d');

    const cBg = hexToRgb(cfg.bg);
    const cAlt = hexToRgb(cfg.alt);
    const cGrout = hexToRgb(cfg.grout);

    const cImg = ctx.getImageData(0, 0, size, size);
    const bImg = btx.getImageData(0, 0, size, size);
    const heightBuf = new Float32Array(size * size);
    const roughBuf = new Float32Array(size * size);
    const seed = variant.length * 431 + 7;

    const cellW = size / cfg.cols;
    const cellH = size / cfg.rows;

    for (let y = 0; y < size; y++) {
      const v = y / size;
      const rIdx = Math.floor(y / cellH);
      const ly = y - rIdx * cellH;
      const xOffset = variant === 'paver' && rIdx % 2 === 1 ? cellW * 0.5 : 0;

      for (let x = 0; x < size; x++) {
        const u = x / size;
        const sx = (x + xOffset) % size;
        const cIdx = Math.floor(sx / cellW);
        const lx = sx - cIdx * cellW;
        const idx = y * size + x;
        const off = idx * 4;

        const isGrout =
          lx < cfg.groutPx ||
          ly < cfg.groutPx ||
          lx > cellW - cfg.groutPx * 0.5 ||
          ly > cellH - cfg.groutPx * 0.5;

        if (isGrout) {
          cImg.data[off] = cGrout.r;
          cImg.data[off + 1] = cGrout.g;
          cImg.data[off + 2] = cGrout.b;
          cImg.data[off + 3] = 255;

          bImg.data[off] = 68;
          bImg.data[off + 1] = 68;
          bImg.data[off + 2] = 68;
          bImg.data[off + 3] = 255;

          heightBuf[idx] = 0.14;
          roughBuf[idx] = 0.94;
          continue;
        }

        const tileTone = hash2d(cIdx, rIdx, seed);
        const mineral = fbmTileable(u * 1.4, v * 1.4, seed + 59, 6);
        const vein = Math.sin((u * 9.0 + mineral * 4.5 + tileTone * 3.1) * Math.PI);
        const tMix = clamp01(tileTone * 0.55 + (mineral - 0.5) * 0.45 + vein * 0.08);
        const rgb = mixRgb(cBg, cAlt, tMix);

        const chamferDist = Math.min(lx, ly, cellW - lx, cellH - ly);
        const chamfer = clamp01(chamferDist / (cfg.groutPx + 2.5));
        const shade = 0.93 + 0.07 * chamfer;

        cImg.data[off] = Math.round(rgb[0] * shade);
        cImg.data[off + 1] = Math.round(rgb[1] * shade);
        cImg.data[off + 2] = Math.round(rgb[2] * shade);
        cImg.data[off + 3] = 255;

        const hVal = clamp01(0.55 + (mineral - 0.5) * 0.25 + chamfer * 0.18);
        heightBuf[idx] = hVal;
        roughBuf[idx] = clamp01(cfg.roughBase + (0.6 - hVal) * 0.16);

        const bv = Math.round(160 + hVal * 70);
        bImg.data[off] = bv;
        bImg.data[off + 1] = bv;
        bImg.data[off + 2] = bv;
        bImg.data[off + 3] = 255;
      }
    }

    ctx.putImageData(cImg, 0, 0);
    btx.putImageData(bImg, 0, 0);
    const { normCanvas, roughCanvas } = buildNormalAndRoughnessCanvases(heightBuf, roughBuf, size, 2.4);
    baseCanvases = { colorCanvas, bumpCanvas, normCanvas, roughCanvas };
    baseCanvasCache.set(baseKey, baseCanvases);
  }

  const pair = {
    map: configureTexture(baseCanvases.colorCanvas, { repeatX, repeatY, srgb: true }),
    bumpMap: configureTexture(baseCanvases.bumpCanvas, { repeatX, repeatY, srgb: false }),
    normalMap: configureTexture(baseCanvases.normCanvas, { repeatX, repeatY, srgb: false }),
    roughnessMap: configureTexture(baseCanvases.roughCanvas, { repeatX, repeatY, srgb: false }),
  };
  cache.set(key, pair);
  return pair;
}

/**
 * Generates seamless monolithic veined stone slab textures (Calacatta marble, honed travertine, limestone)
 * with zero grout lines or rectangular tile grids for waterfall islands, counters, hearths, and tables.
 * Excludes bumpMap so PBR materials with normalMap remain strictly contract-clean.
 */
export function getStoneSlabTextures(variant = 'travertine', repeatX = 1, repeatY = 1) {
  const key = `stone-slab:${variant}:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const baseKey = `stone-slab-base:${variant}`;
  let baseCanvases = baseCanvasCache.get(baseKey);
  if (!baseCanvases) {
    const configs = {
      travertine: { base: '#E4DAC9', vein: '#CBBAA3', hi: '#F1EAE0', pore: '#B7A68F', roughBase: 0.54, layered: true },
      calacatta: { base: '#F3EFE9', vein: '#B7A896', hi: '#FAF8F4', pore: '#D8CEBF', roughBase: 0.28, layered: false },
      limestone: { base: '#DBD2C4', vein: '#C1B5A3', hi: '#EBE4D7', pore: '#A89B87', roughBase: 0.58, layered: true },
    };
    const cfg = configs[variant] || configs.travertine;
    const size = 256;
    const colorCanvas = makeCanvas(size, size);
    const ctx = colorCanvas.getContext('2d');
    const cImg = ctx.getImageData(0, 0, size, size);
    const heightBuf = new Float32Array(size * size);
    const roughBuf = new Float32Array(size * size);

    const cBase = hexToRgb(cfg.base);
    const cVein = hexToRgb(cfg.vein);
    const cHi = hexToRgb(cfg.hi);
    const cPore = hexToRgb(cfg.pore);
    const seed = variant.length * 613 + 41;

    for (let y = 0; y < size; y++) {
      const v = y / size;
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const idx = y * size + x;
        const off = idx * 4;

        const cloud = fbmTileable(u * 1.4, v * 1.4, seed, 4);
        const fine = fbmTileable(u * 4.0, v * 4.0, seed + 83, 6);

        let rgb;
        let veinMask = 0;
        if (cfg.layered) {
          // Sedimentary horizontal bands with gentle organic wave & travertine pit softness
          const strata = Math.sin((v * 7.5 + (cloud - 0.5) * 1.65) * Math.PI);
          const subStrata = Math.cos((v * 18.0 + fine * 2.2) * Math.PI);
          const tBand = clamp01(0.5 + strata * 0.24 + subStrata * 0.1 + (cloud - 0.5) * 0.26);
          rgb = tBand < 0.5
            ? mixRgb(cVein, cBase, tBand * 2.0)
            : mixRgb(cBase, cHi, (tBand - 0.5) * 2.0);
          if (fine < 0.26 && strata < 0.1) {
            veinMask = (0.26 - fine) * 1.8;
            rgb = mixRgb({ r: rgb[0], g: rgb[1], b: rgb[2] }, cPore, Math.min(0.45, veinMask));
          }
        } else {
          // Bold yet soft organic diagonal Calacatta marble veins over luminous ivory stone
          const warp = (cloud - 0.5) * 0.95 + (fine - 0.5) * 0.22;
          const dist1 = Math.abs(Math.sin((u * 1.6 - v * 2.1 + warp) * Math.PI));
          const dist2 = Math.abs(Math.cos((u * 2.9 + v * 1.4 - warp * 0.7) * Math.PI));
          const mainVein = Math.pow(clamp01(1.0 - dist1 * 2.8), 2.4);
          const branchVein = Math.pow(clamp01(1.0 - dist2 * 3.6), 2.8) * 0.55;
          veinMask = clamp01(mainVein + branchVein);

          const baseMarble = mixRgb(cBase, cHi, clamp01(cloud * 0.8 + fine * 0.2));
          rgb = mixRgb({ r: baseMarble[0], g: baseMarble[1], b: baseMarble[2] }, cVein, veinMask * 0.72);
          if (veinMask > 0.35) {
            rgb = mixRgb({ r: rgb[0], g: rgb[1], b: rgb[2] }, cPore, (veinMask - 0.35) * 0.4);
          }
        }

        cImg.data[off] = rgb[0];
        cImg.data[off + 1] = rgb[1];
        cImg.data[off + 2] = rgb[2];
        cImg.data[off + 3] = 255;

        const hVal = clamp01(0.56 + (cloud - 0.5) * 0.14 - veinMask * 0.08);
        heightBuf[idx] = hVal;
        roughBuf[idx] = clamp01(cfg.roughBase + veinMask * 0.14 + (fine - 0.5) * 0.06);
      }
    }

    ctx.putImageData(cImg, 0, 0);
    const { normCanvas, roughCanvas } = buildNormalAndRoughnessCanvases(heightBuf, roughBuf, size, 0.78);
    baseCanvases = { colorCanvas, normCanvas, roughCanvas };
    baseCanvasCache.set(baseKey, baseCanvases);
  }

  const pair = {
    map: configureTexture(baseCanvases.colorCanvas, { repeatX, repeatY, srgb: true }),
    normalMap: configureTexture(baseCanvases.normCanvas, { repeatX, repeatY, srgb: false }),
    roughnessMap: configureTexture(baseCanvases.roughCanvas, { repeatX, repeatY, srgb: false }),
    isSeamlessSlab: true,
  };
  cache.set(key, pair);
  return pair;
}

/**
 * Generates warm architectural Venetian lime-plaster maps for all interior wall & ceiling faces.
 */
export function getPlasterTextures(hexColor = '#F3EBDC', repeatX = 4, repeatY = 3) {
  const key = `plaster:${hexColor}:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const baseKey = `plaster-base:${hexColor}`;
  let baseCanvases = baseCanvasCache.get(baseKey);
  if (!baseCanvases) {
    const size = 256;
    const colorCanvas = makeCanvas(size, size);
    const ctx = colorCanvas.getContext('2d');
    const cImg = ctx.getImageData(0, 0, size, size);
    const base = hexToRgb(hexColor);
    const warm = mixRgb(base, { r: 235, g: 222, b: 198 }, 0.32);
    const cWarm = { r: warm[0], g: warm[1], b: warm[2] };

    const heightBuf = new Float32Array(size * size);
    const roughBuf = new Float32Array(size * size);
    const seed = hexColor.charCodeAt(1) * 71 + 29;

    for (let y = 0; y < size; y++) {
      const v = y / size;
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const idx = y * size + x;
        const off = idx * 4;

        const trowel = fbmTileable(u, v, seed, 4);
        const sand = fbmTileable(u * 4.0, v * 4.0, seed + 17, 8);
        const mixT = clamp01((trowel - 0.3) * 0.75 + (sand - 0.5) * 0.22);
        const rgb = mixRgb(base, cWarm, mixT * 0.55);

        cImg.data[off] = rgb[0];
        cImg.data[off + 1] = rgb[1];
        cImg.data[off + 2] = rgb[2];
        cImg.data[off + 3] = 255;

        const hVal = clamp01(0.5 + (trowel - 0.5) * 0.35 + (sand - 0.5) * 0.25);
        heightBuf[idx] = hVal;
        roughBuf[idx] = clamp01(0.84 + (0.5 - trowel) * 0.1);
      }
    }

    ctx.putImageData(cImg, 0, 0);
    const { normCanvas, roughCanvas } = buildNormalAndRoughnessCanvases(heightBuf, roughBuf, size, 0.95);
    baseCanvases = { colorCanvas, normCanvas, roughCanvas };
    baseCanvasCache.set(baseKey, baseCanvases);
  }

  const set = {
    map: configureTexture(baseCanvases.colorCanvas, { repeatX, repeatY, srgb: true }),
    normalMap: configureTexture(baseCanvases.normCanvas, { repeatX, repeatY, srgb: false }),
    roughnessMap: configureTexture(baseCanvases.roughCanvas, { repeatX, repeatY, srgb: false }),
  };
  cache.set(key, set);
  return set;
}

/**
 * Generates layered architectural cedar/slate roof shingle maps.
 */
export function getRoofShingleTextures(repeatX = 10, repeatY = 6) {
  const key = `shingle:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const baseKey = 'shingle-base';
  let baseCanvases = baseCanvasCache.get(baseKey);
  if (!baseCanvases) {
    const size = 256;
    const colorCanvas = makeCanvas(size, size);
    const bumpCanvas = makeCanvas(size, size);
    const ctx = colorCanvas.getContext('2d');
    const btx = bumpCanvas.getContext('2d');
    const cImg = ctx.getImageData(0, 0, size, size);
    const bImg = btx.getImageData(0, 0, size, size);
    const heightBuf = new Float32Array(size * size);
    const roughBuf = new Float32Array(size * size);

    const cBase = hexToRgb('#473427');
    const cAlt = hexToRgb('#39281D');
    const cHi = hexToRgb('#594232');
    const rows = 8;
    const cols = 4;
    const rowH = size / rows;
    const colW = size / cols;

    for (let y = 0; y < size; y++) {
      const v = y / size;
      const r = Math.floor(y / rowH);
      const ly = (y - r * rowH) / rowH;
      const rowShift = r % 2 === 1 ? colW * 0.5 : 0;

      for (let x = 0; x < size; x++) {
        const u = x / size;
        const sx = (x + rowShift) % size;
        const c = Math.floor(sx / colW);
        const lx = sx - c * colW;
        const idx = y * size + x;
        const off = idx * 4;

        const isGap = lx < 1.8 || ly < 0.08;
        const tileVar = hash2d(c, r, 733);
        const grain = fbmTileable(u * 2.0, v * 1.5, 739, 8);
        const slopeHeight = clamp01(ly * 0.72 + (grain - 0.5) * 0.18 + (isGap ? -0.35 : 0));

        const baseRgb = tileVar > 0.55 ? mixRgb(cBase, cHi, (tileVar - 0.55) * 1.8) : mixRgb(cAlt, cBase, tileVar * 1.8);
        const lapShadow = isGap ? 0.62 : 0.85 + ly * 0.18;

        cImg.data[off] = Math.round(baseRgb[0] * lapShadow);
        cImg.data[off + 1] = Math.round(baseRgb[1] * lapShadow);
        cImg.data[off + 2] = Math.round(baseRgb[2] * lapShadow);
        cImg.data[off + 3] = 255;

        const bv = Math.round(clamp01(slopeHeight) * 235);
        bImg.data[off] = bv;
        bImg.data[off + 1] = bv;
        bImg.data[off + 2] = bv;
        bImg.data[off + 3] = 255;

        heightBuf[idx] = clamp01(slopeHeight);
        roughBuf[idx] = isGap ? 0.96 : clamp01(0.76 + (1 - slopeHeight) * 0.18);
      }
    }

    ctx.putImageData(cImg, 0, 0);
    btx.putImageData(bImg, 0, 0);
    const { normCanvas, roughCanvas } = buildNormalAndRoughnessCanvases(heightBuf, roughBuf, size, 3.0);
    baseCanvases = { colorCanvas, bumpCanvas, normCanvas, roughCanvas };
    baseCanvasCache.set(baseKey, baseCanvases);
  }

  const set = {
    map: configureTexture(baseCanvases.colorCanvas, { repeatX, repeatY, srgb: true }),
    bumpMap: configureTexture(baseCanvases.bumpCanvas, { repeatX, repeatY, srgb: false }),
    normalMap: configureTexture(baseCanvases.normCanvas, { repeatX, repeatY, srgb: false }),
    roughnessMap: configureTexture(baseCanvases.roughCanvas, { repeatX, repeatY, srgb: false }),
  };
  cache.set(key, set);
  return set;
}

/**
 * Generates woven linen / fabric PBR maps (map, bumpMap, normalMap, roughnessMap)
 * for upholstery, curtains, clothing, and bedding.
 */
export function getFabricTextures(hexColor = '#B7A797', repeatX = 4, repeatY = 4) {
  const key = `fabric:${hexColor}:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const baseKey = `fabric-base:${hexColor}`;
  let baseCanvases = baseCanvasCache.get(baseKey);
  if (!baseCanvases) {
    const size = 256;
    const colorCanvas = makeCanvas(size, size);
    const bumpCanvas = makeCanvas(size, size);
    const ctx = colorCanvas.getContext('2d');
    const btx = bumpCanvas.getContext('2d');

    const base = hexToRgb(hexColor);
    const cImg = ctx.getImageData(0, 0, size, size);
    const bImg = btx.getImageData(0, 0, size, size);
    const heightBuf = new Float32Array(size * size);
    const roughBuf = new Float32Array(size * size);
    const seed = hexColor.charCodeAt(1) * 53 + 19;

    for (let y = 0; y < size; y++) {
      const v = y / size;
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const idx = y * size + x;
        const off = idx * 4;

        const warp = Math.sin(x * Math.PI * 0.5);
        const weft = Math.sin(y * Math.PI * 0.5);
        const weave = 0.5 + 0.25 * (warp * weft) + 0.12 * (warp + weft);
        const slub = (fbmTileable(u * 2.0, v * 2.0, seed, 8) - 0.5) * 0.14;
        const shade = clamp01(0.92 + (weave - 0.5) * 0.14 + slub);

        cImg.data[off] = Math.round(clamp01((base.r * shade) / 255) * 255);
        cImg.data[off + 1] = Math.round(clamp01((base.g * shade) / 255) * 255);
        cImg.data[off + 2] = Math.round(clamp01((base.b * shade) / 255) * 255);
        cImg.data[off + 3] = 255;

        const hVal = clamp01(weave + slub * 0.6);
        heightBuf[idx] = hVal;
        roughBuf[idx] = clamp01(0.84 + (0.6 - hVal) * 0.12);

        const bv = Math.round(90 + hVal * 135);
        bImg.data[off] = bv;
        bImg.data[off + 1] = bv;
        bImg.data[off + 2] = bv;
        bImg.data[off + 3] = 255;
      }
    }

    ctx.putImageData(cImg, 0, 0);
    btx.putImageData(bImg, 0, 0);
    const { normCanvas, roughCanvas } = buildNormalAndRoughnessCanvases(heightBuf, roughBuf, size, 1.5);
    baseCanvases = { colorCanvas, bumpCanvas, normCanvas, roughCanvas };
    baseCanvasCache.set(baseKey, baseCanvases);
  }

  const pair = {
    map: configureTexture(baseCanvases.colorCanvas, { repeatX, repeatY, srgb: true }),
    bumpMap: configureTexture(baseCanvases.bumpCanvas, { repeatX, repeatY, srgb: false }),
    normalMap: configureTexture(baseCanvases.normCanvas, { repeatX, repeatY, srgb: false }),
    roughnessMap: configureTexture(baseCanvases.roughCanvas, { repeatX, repeatY, srgb: false }),
  };
  cache.set(key, pair);
  return pair;
}

/**
 * Generates warm bordered woven wool area rug maps.
 */
export function getRugTextures(variant = 'living', repeatX = 1, repeatY = 1) {
  const key = `rug:${variant}:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const baseKey = `rug-base:${variant}`;
  let baseCanvases = baseCanvasCache.get(baseKey);
  if (!baseCanvases) {
    const palettes = {
      living: { body: '#E5DDD0', border: '#BBA992', accent: '#758268' },
      dining: { body: '#E3DBD0', border: '#B29F88', accent: '#707C64' },
      bed1: { body: '#EAE2D6', border: '#C4AB91', accent: '#9B765B' },
      bed2: { body: '#E4E7DF', border: '#8CA08A', accent: '#C2CBB7' },
      gallery: { body: '#E1D7C8', border: '#AA9379', accent: '#78846D' },
    };
    const pal = palettes[variant] || palettes.living;
    const size = 256;
    const colorCanvas = makeCanvas(size, size);
    const ctx = colorCanvas.getContext('2d');
    const cImg = ctx.getImageData(0, 0, size, size);
    const heightBuf = new Float32Array(size * size);
    const roughBuf = new Float32Array(size * size);

    const cBody = hexToRgb(pal.body);
    const cBorder = hexToRgb(pal.border);
    const cAccent = hexToRgb(pal.accent);

    for (let y = 0; y < size; y++) {
      const v = y / size;
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const idx = y * size + x;
        const off = idx * 4;
        const edgeDist = Math.min(u, 1 - u, v, 1 - v);

        let col = cBody;
        if (edgeDist < 0.045) col = cAccent;
        else if (edgeDist < 0.115) col = cBorder;
        else if (edgeDist < 0.13) col = cAccent;

        const loop = Math.sin(x * 1.1) * Math.sin(y * 1.1);
        const slub = (fbmTileable(u * 2.0, v * 2.0, 991, 8) - 0.5) * 0.16;
        const shade = clamp01(0.95 + loop * 0.045 + slub);

        cImg.data[off] = Math.round(col.r * shade);
        cImg.data[off + 1] = Math.round(col.g * shade);
        cImg.data[off + 2] = Math.round(col.b * shade);
        cImg.data[off + 3] = 255;

        heightBuf[idx] = clamp01(0.5 + loop * 0.25 + slub);
        roughBuf[idx] = clamp01(0.92 + loop * 0.05);
      }
    }

    ctx.putImageData(cImg, 0, 0);
    const { normCanvas, roughCanvas } = buildNormalAndRoughnessCanvases(heightBuf, roughBuf, size, 1.8);
    baseCanvases = { colorCanvas, normCanvas, roughCanvas };
    baseCanvasCache.set(baseKey, baseCanvases);
  }

  const pair = {
    map: configureTexture(baseCanvases.colorCanvas, { repeatX, repeatY, srgb: true }),
    normalMap: configureTexture(baseCanvases.normCanvas, { repeatX, repeatY, srgb: false }),
    roughnessMap: configureTexture(baseCanvases.roughCanvas, { repeatX, repeatY, srgb: false }),
  };
  cache.set(key, pair);
  return pair;
}

/**
 * Generates directional brushed metal normal + roughness maps for brass/bronze/steel hardware.
 */
export function getBrushedMetalTextures(hexColor = '#C5A059', repeatX = 2, repeatY = 2) {
  const key = `metal:${hexColor}:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const baseKey = 'metal-base';
  let baseCanvases = baseCanvasCache.get(baseKey);
  if (!baseCanvases) {
    const size = 128;
    const heightBuf = new Float32Array(size * size);
    const roughBuf = new Float32Array(size * size);

    for (let y = 0; y < size; y++) {
      const streak = hash2d(0, y, 421);
      for (let x = 0; x < size; x++) {
        const fine = fbmTileable(x / size, (y / size) * 6.0, 433, 8);
        const idx = y * size + x;
        const hVal = clamp01(0.5 + (streak - 0.5) * 0.35 + (fine - 0.5) * 0.15);
        heightBuf[idx] = hVal;
        roughBuf[idx] = clamp01(0.24 + (1 - hVal) * 0.14);
      }
    }

    baseCanvases = buildNormalAndRoughnessCanvases(heightBuf, roughBuf, size, 0.9);
    baseCanvasCache.set(baseKey, baseCanvases);
  }

  const pair = {
    normalMap: configureTexture(baseCanvases.normCanvas, { repeatX, repeatY, srgb: false }),
    roughnessMap: configureTexture(baseCanvases.roughCanvas, { repeatX, repeatY, srgb: false }),
  };
  cache.set(key, pair);
  return pair;
}

/**
 * Garden lawn texture combining deep, medium, and light moss greens without harsh tiling.
 */
export function getLawnTexture(repeatX = 16, repeatY = 14) {
  const key = `lawn:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const baseKey = 'lawn-base';
  let canvas = baseCanvasCache.get(baseKey);
  if (!canvas) {
    const size = 256;
    canvas = makeCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const cImg = ctx.getImageData(0, 0, size, size);

    const cDeep = hexToRgb('#4A7B42');
    const cMid = hexToRgb('#699B53');
    const cLight = hexToRgb('#8CB668');

    for (let y = 0; y < size; y++) {
      const v = y / size;
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const idx = (y * size + x) * 4;
        const macro = fbmTileable(u, v, 8831, 4);
        const micro = fbmTileable(u * 4.0, v * 4.0, 8849, 8);
        const tuft = hash2d(x, y, 8861);
        const mixT = clamp01(macro * 0.56 + micro * 0.30 + (tuft - 0.5) * 0.16);
        const rgb = mixT < 0.52
          ? mixRgb(cDeep, cMid, mixT / 0.52)
          : mixRgb(cMid, cLight, (mixT - 0.52) / 0.48);
        cImg.data[idx] = rgb[0];
        cImg.data[idx + 1] = rgb[1];
        cImg.data[idx + 2] = rgb[2];
        cImg.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(cImg, 0, 0);
    baseCanvasCache.set(baseKey, canvas);
  }

  const tex = configureTexture(canvas, { repeatX, repeatY, srgb: true });
  cache.set(key, tex);
  return tex;
}

/**
 * Rich garden soil / mulch texture under flower beds.
 */
export function getSoilTexture(repeatX = 3, repeatY = 2) {
  const key = `soil:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const baseKey = 'soil-base';
  let canvas = baseCanvasCache.get(baseKey);
  if (!canvas) {
    const size = 256;
    canvas = makeCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const rand = seededRand(3347);

    ctx.fillStyle = '#4B3626';
    ctx.fillRect(0, 0, size, size);

    const tones = ['#39281B', '#5A412F', '#6B4F39', '#2E1F14'];
    for (let i = 0; i < 1600; i++) {
      ctx.fillStyle = tones[Math.floor(rand() * tones.length)];
      ctx.globalAlpha = 0.48;
      ctx.fillRect(rand() * size, rand() * size, 2 + rand() * 5, 2 + rand() * 4);
    }
    baseCanvasCache.set(baseKey, canvas);
  }

  const tex = configureTexture(canvas, { repeatX, repeatY, srgb: true });
  cache.set(key, tex);
  return tex;
}

/**
 * Helper drawing a smooth polyline spline without quadraticCurveTo so it runs identically in MockCanvasContext2D.
 */
function drawPolylineSpline(ctx, points) {
  if (!points || points.length === 0) return;
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
}

/**
 * Curated museum-grade artwork canvas for living hall, dining hall, bedrooms, galleries, and coffee bar.
 */
export function getArtworkTexture(theme = 'botanical') {
  const key = `art-v2:${theme}`;
  if (cache.has(key)) return cache.get(key);

  const w = 512;
  const h = 640;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');

  // Subtle fine-grain cotton rag paper base
  ctx.fillStyle = '#F2ECE0';
  ctx.fillRect(0, 0, w, h);

  const rand = seededRand(theme.length * 733 + 17);
  ctx.fillStyle = '#DED4C2';
  for (let i = 0; i < 480; i++) {
    ctx.globalAlpha = 0.25;
    ctx.fillRect(rand() * w, rand() * h, 2, 2);
  }
  ctx.globalAlpha = 1.0;

  if (theme === 'botanical') {
    const wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, '#EBE3D3');
    wash.addColorStop(1, '#DDD2BD');
    ctx.fillStyle = wash;
    ctx.fillRect(28, 28, w - 56, h - 56);

    // Warm mineral terracotta vase/arch grounding composition
    ctx.fillStyle = 'rgba(182, 118, 86, 0.26)';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.56, w * 0.3, Math.PI, Math.PI * 2);
    ctx.lineTo(w * 0.8, h * 0.86);
    ctx.lineTo(w * 0.2, h * 0.86);
    ctx.closePath();
    ctx.fill();

    // Flowing primary & secondary olive branches
    ctx.strokeStyle = '#475D44';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    drawPolylineSpline(ctx, [
      [w * 0.44, h * 0.86],
      [w * 0.47, h * 0.68],
      [w * 0.5, h * 0.49],
      [w * 0.53, h * 0.32],
      [w * 0.57, h * 0.17],
    ]);
    ctx.stroke();

    ctx.strokeStyle = '#607759';
    ctx.lineWidth = 3;
    ctx.beginPath();
    drawPolylineSpline(ctx, [
      [w * 0.48, h * 0.62],
      [w * 0.38, h * 0.48],
      [w * 0.33, h * 0.34],
    ]);
    ctx.stroke();

    const leaves = [
      [0.46, 0.72, -0.78, 42, 14, '#50724B'],
      [0.49, 0.63, 0.72, 46, 15, '#63865B'],
      [0.48, 0.54, -0.7, 44, 14, '#456740'],
      [0.52, 0.44, 0.65, 42, 13, '#72946A'],
      [0.52, 0.36, -0.6, 38, 12, '#53754E'],
      [0.55, 0.26, 0.5, 34, 11, '#688B60'],
      [0.57, 0.18, -0.35, 30, 10, '#789A70'],
      [0.39, 0.5, -1.1, 36, 12, '#5F8258'],
      [0.36, 0.41, -0.5, 34, 11, '#75976D'],
      [0.34, 0.34, -0.95, 28, 10, '#4E704A'],
    ];
    for (const [lx, ly, ang, rx, ry, col] of leaves) {
      ctx.save();
      ctx.translate(w * lx, h * ly);
      ctx.rotate(ang);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(rx * 0.85, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(242, 236, 224, 0.42)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(rx * 1.65, 0);
      ctx.stroke();
      ctx.restore();
    }
  } else if (theme === 'landscape') {
    const grad = ctx.createLinearGradient(0, 20, 0, h - 20);
    grad.addColorStop(0, '#EFE2C9');
    grad.addColorStop(0.42, '#DDA87A');
    grad.addColorStop(0.68, '#7A8E7A');
    grad.addColorStop(1, '#3D5346');
    ctx.fillStyle = grad;
    ctx.fillRect(24, 24, w - 48, h - 48);

    const sunGlow = ctx.createRadialGradient(w * 0.72, h * 0.28, 8, w * 0.72, h * 0.28, 82);
    sunGlow.addColorStop(0, 'rgba(255, 244, 214, 0.95)');
    sunGlow.addColorStop(0.5, 'rgba(250, 218, 165, 0.45)');
    sunGlow.addColorStop(1, 'rgba(250, 218, 165, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(w * 0.72, h * 0.28, 82, 0, Math.PI * 2);
    ctx.fill();

    // Far ridge
    ctx.fillStyle = '#859684';
    ctx.beginPath();
    drawPolylineSpline(ctx, [
      [24, h * 0.56],
      [w * 0.24, h * 0.46],
      [w * 0.52, h * 0.54],
      [w * 0.8, h * 0.44],
      [w - 24, h * 0.52],
      [w - 24, h - 24],
      [24, h - 24],
    ]);
    ctx.closePath();
    ctx.fill();

    // Mid ridge
    ctx.fillStyle = '#5B7261';
    ctx.beginPath();
    drawPolylineSpline(ctx, [
      [24, h * 0.65],
      [w * 0.34, h * 0.54],
      [w * 0.66, h * 0.64],
      [w - 24, h * 0.58],
      [w - 24, h - 24],
      [24, h - 24],
    ]);
    ctx.closePath();
    ctx.fill();

    // Foreground meadow & warm water ribbon
    ctx.fillStyle = '#384D3F';
    ctx.beginPath();
    drawPolylineSpline(ctx, [
      [24, h * 0.78],
      [w * 0.4, h * 0.7],
      [w * 0.75, h * 0.76],
      [w - 24, h * 0.71],
      [w - 24, h - 24],
      [24, h - 24],
    ]);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(242, 220, 182, 0.55)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    drawPolylineSpline(ctx, [
      [w * 0.18, h * 0.85],
      [w * 0.45, h * 0.82],
      [w * 0.78, h * 0.86],
    ]);
    ctx.stroke();
  } else if (theme === 'coffee') {
    ctx.fillStyle = '#EDE3D2';
    ctx.fillRect(24, 24, w - 48, h - 48);

    // Burnt terracotta arch field behind coffea branch
    ctx.fillStyle = '#C99875';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.42, w * 0.29, Math.PI, Math.PI * 2);
    ctx.lineTo(w * 0.79, h * 0.74);
    ctx.lineTo(w * 0.21, h * 0.74);
    ctx.closePath();
    ctx.fill();

    // Deep espresso timber stem & opposite paired glossy coffee leaves + ruby cherries
    ctx.strokeStyle = '#4A3122';
    ctx.lineWidth = 5;
    ctx.beginPath();
    drawPolylineSpline(ctx, [
      [w * 0.34, h * 0.75],
      [w * 0.45, h * 0.58],
      [w * 0.54, h * 0.42],
      [w * 0.62, h * 0.26],
    ]);
    ctx.stroke();

    const coffeeLeaves = [
      [0.44, 0.59, -0.95, 54, 19, '#3B593B'],
      [0.46, 0.57, 0.35, 52, 18, '#4D6E49'],
      [0.53, 0.44, -0.88, 50, 17, '#345134'],
      [0.55, 0.42, 0.42, 48, 16, '#567850'],
      [0.6, 0.3, -0.78, 40, 14, '#436442'],
    ];
    for (const [lx, ly, ang, rx, ry, col] of coffeeLeaves) {
      ctx.save();
      ctx.translate(w * lx, h * ly);
      ctx.rotate(ang);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(rx * 0.82, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const cherries = [
      [0.46, 0.61, '#8C3328'],
      [0.49, 0.63, '#A64133'],
      [0.55, 0.47, '#8C3328'],
      [0.58, 0.45, '#6F261E'],
      [0.61, 0.33, '#A64133'],
    ];
    for (const [cx, cy, col] of cherries) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(w * cx, h * cy, 11, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#3B281B';
    ctx.fillRect(w * 0.24, h * 0.82, w * 0.52, 2);
    if (typeof ctx.fillText === 'function') {
      ctx.fillStyle = '#4A3425';
      ctx.font = '600 18px Georgia, serif';
      ctx.fillText('COFFEA ARABICA · BOTANICAL STUDY', w * 0.2, h * 0.88);
    }
  } else {
    // Organic Modern Architectural Abstract composition
    ctx.fillStyle = '#EEE6D8';
    ctx.fillRect(24, 24, w - 48, h - 48);

    ctx.fillStyle = '#D8CEBC';
    ctx.fillRect(62, h * 0.14, w - 124, h * 0.58);

    ctx.fillStyle = '#B97358';
    ctx.beginPath();
    ctx.arc(w * 0.48, h * 0.42, 114, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5F715D';
    ctx.beginPath();
    ctx.ellipse(w * 0.62, h * 0.55, 76, 98, 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#332A23';
    ctx.fillRect(w * 0.22, h * 0.64, w * 0.56, 56);

    ctx.fillStyle = '#CFA670';
    ctx.fillRect(w * 0.18, h * 0.56, w * 0.44, 12);
  }

  // Fine gallery plate rule inside paper margin
  ctx.strokeStyle = 'rgba(72, 56, 42, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 24, w - 48, h - 48);

  const tex = configureTexture(canvas, { repeatX: 1, repeatY: 1, srgb: true });
  cache.set(key, tex);
  return tex;
}

/**
 * Generates serene 16:9 screen artwork for the 75-inch Living Hall television.
 */
export function getTvScreenTexture() {
  const key = 'tv-screen';
  if (cache.has(key)) return cache.get(key);

  const w = 640;
  const h = 360;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#1D323A');
  grad.addColorStop(0.55, '#466A67');
  grad.addColorStop(1, '#C59A6B');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Soft warm ambient glow orb
  const sun = ctx.createRadialGradient(w * 0.72, h * 0.34, 6, w * 0.72, h * 0.34, 96);
  sun.addColorStop(0, 'rgba(255, 226, 175, 0.9)');
  sun.addColorStop(1, 'rgba(255, 226, 175, 0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(w * 0.72, h * 0.34, 96, 0, Math.PI * 2);
  ctx.fill();

  // Layered misty mountain silhouettes
  ctx.fillStyle = 'rgba(20, 34, 38, 0.55)';
  ctx.beginPath();
  drawPolylineSpline(ctx, [
    [0, h * 0.72],
    [w * 0.16, h * 0.55],
    [w * 0.31, h * 0.51],
    [w * 0.55, h * 0.66],
    [w * 0.76, h * 0.54],
    [w, h * 0.68],
    [w, h],
    [0, h],
  ]);
  ctx.closePath();
  ctx.fill();

  if (typeof ctx.fillText === 'function') {
    ctx.fillStyle = 'rgba(244, 238, 224, 0.88)';
    ctx.font = '500 26px Georgia, serif';
    ctx.fillText('SANDALWOOD GALLERY', 42, 68);
    ctx.fillStyle = 'rgba(244, 238, 224, 0.65)';
    ctx.font = '300 13px sans-serif';
    ctx.fillText('QUIET AMBIENT ARCHITECTURE · 4K OLED', 42, 94);
  }

  const tex = configureTexture(canvas, { repeatX: 1, repeatY: 1, srgb: true });
  cache.set(key, tex);
  return tex;
}

/**
 * Generates deeply furrowed organic tree bark maps (map, normalMap, roughnessMap).
 */
export function getTreeBarkTextures(repeatX = 2, repeatY = 4) {
  const key = `bark-pbr:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const baseKey = 'bark-pbr-base';
  let baseCanvases = baseCanvasCache.get(baseKey);
  if (!baseCanvases) {
    const size = 256;
    const colorCanvas = makeCanvas(size, size);
    const ctx = colorCanvas.getContext('2d');
    const cImg = ctx.getImageData(0, 0, size, size);
    const heightBuf = new Float32Array(size * size);
    const roughBuf = new Float32Array(size * size);

    const cDark = hexToRgb('#432E20');
    const cMid = hexToRgb('#6E513B');
    const cLight = hexToRgb('#8C6E54');

    for (let y = 0; y < size; y++) {
      const v = y / size;
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const idx = y * size + x;
        const off = idx * 4;

        const fissure = fbmTileable(u * 3.0, v * 0.65, 5151, 8);
        const ridge = Math.sin((u * 14.0 + fissure * 3.5) * Math.PI);
        const lichen = fbmTileable(u * 2.0, v * 2.0, 5199, 6);
        const tH = clamp01(0.5 + ridge * 0.34 + (fissure - 0.5) * 0.28);

        const rgb = tH < 0.5
          ? mixRgb(cDark, cMid, tH * 2.0)
          : mixRgb(cMid, cLight, (tH - 0.5) * 2.0);
        const mossShift = lichen > 0.72 ? (lichen - 0.72) * 0.45 : 0;

        cImg.data[off] = Math.round(rgb[0] * (1 - mossShift * 0.15));
        cImg.data[off + 1] = Math.round(rgb[1] + mossShift * 35);
        cImg.data[off + 2] = Math.round(rgb[2] * (1 - mossShift * 0.25));
        cImg.data[off + 3] = 255;

        heightBuf[idx] = tH;
        roughBuf[idx] = clamp01(0.84 + (1 - tH) * 0.14);
      }
    }

    ctx.putImageData(cImg, 0, 0);
    const { normCanvas, roughCanvas } = buildNormalAndRoughnessCanvases(heightBuf, roughBuf, size, 3.6);
    baseCanvases = { colorCanvas, normCanvas, roughCanvas };
    baseCanvasCache.set(baseKey, baseCanvases);
  }

  const pair = {
    map: configureTexture(baseCanvases.colorCanvas, { repeatX, repeatY, srgb: true }),
    normalMap: configureTexture(baseCanvases.normCanvas, { repeatX, repeatY, srgb: false }),
    roughnessMap: configureTexture(baseCanvases.roughCanvas, { repeatX, repeatY, srgb: false }),
  };
  cache.set(key, pair);
  return pair;
}

export function getTreeBarkTexture() {
  return getTreeBarkTextures(2, 4).map;
}

/**
 * Generates layered botanical leaf-cluster PBR maps (map, normalMap, roughnessMap)
 * so tree canopies and shrubs read as textured dappled foliage rather than smooth blobs.
 */
export function getFoliageTexture(repeatX = 3, repeatY = 3) {
  const key = `foliage-pbr:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const baseKey = 'foliage-pbr-base-v2';
  let baseCanvases = baseCanvasCache.get(baseKey);
  if (!baseCanvases) {
    const size = 256;
    const colorCanvas = makeCanvas(size, size);
    const ctx = colorCanvas.getContext('2d');
    const cImg = ctx.getImageData(0, 0, size, size);
    const heightBuf = new Float32Array(size * size);
    const roughBuf = new Float32Array(size * size);

    // Rich leaf-canopy under-shadow cavity to crisp botanical midtone base
    const cDeep = hexToRgb('#4B6B42');
    const cMid = hexToRgb('#7DA363');
    for (let y = 0; y < size; y++) {
      const v = y / size;
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const idx = y * size + x;
        const off = idx * 4;
        const mac = fbmTileable(u * 2.0, v * 2.0, 6211, 6);
        const hVal = clamp01(0.18 + mac * 0.28);
        const rgb = mixRgb(cDeep, cMid, clamp01(mac * 1.15));
        cImg.data[off] = rgb[0];
        cImg.data[off + 1] = rgb[1];
        cImg.data[off + 2] = rgb[2];
        cImg.data[off + 3] = 255;
        heightBuf[idx] = hVal;
        roughBuf[idx] = 0.86;
      }
    }
    ctx.putImageData(cImg, 0, 0);

    // Paint 420 crisp overlapping elliptical leaf cards (tileable across edges) for organic texture
    const rand = seededRand(6299);
    const leafTones = ['#5A804A', '#6D9658', '#86AE69', '#A3C57E', '#C2DA93'];
    for (let i = 0; i < 420; i++) {
      const lx = rand() * size;
      const ly = rand() * size;
      const lrX = 5 + rand() * 7.5;
      const lrY = 2.4 + rand() * 3.5;
      const ang = rand() * Math.PI * 2;
      const tone = leafTones[Math.floor(rand() * leafTones.length)];
      const elevation = 0.45 + rand() * 0.52;

      for (const ox of [-size, 0, size]) {
        for (const oy of [-size, 0, size]) {
          const cx = lx + ox;
          const cy = ly + oy;
          if (cx < -16 || cx > size + 16 || cy < -16 || cy > size + 16) continue;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(ang);
          ctx.fillStyle = tone;
          ctx.beginPath();
          ctx.ellipse(0, 0, lrX, lrY, 0, 0, Math.PI * 2);
          ctx.fill();

          // Subtle darker midrib crease on larger sunlit leaves
          ctx.strokeStyle = 'rgba(42, 66, 36, 0.35)';
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(-lrX * 0.72, 0);
          ctx.lineTo(lrX * 0.72, 0);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Stamp leaf relief into height/roughness buffers
      const minPx = Math.floor(lx - lrX - 1);
      const maxPx = Math.ceil(lx + lrX + 1);
      const minPy = Math.floor(ly - lrX - 1);
      const maxPy = Math.ceil(ly + lrX + 1);
      const cosA = Math.cos(-ang);
      const sinA = Math.sin(-ang);
      for (let py = minPy; py <= maxPy; py++) {
        const dy = py - ly;
        const sy = ((py % size) + size) % size;
        for (let px = minPx; px <= maxPx; px++) {
          const dx = px - lx;
          const rx = dx * cosA - dy * sinA;
          const ry = dx * sinA + dy * cosA;
          const ell = (rx * rx) / (lrX * lrX) + (ry * ry) / (lrY * lrY);
          if (ell <= 1.0) {
            const sx = ((px % size) + size) % size;
            const bIdx = sy * size + sx;
            const cup = clamp01((1.0 - ell) * 0.85 + 0.15) * elevation;
            if (cup > heightBuf[bIdx]) {
              heightBuf[bIdx] = cup;
              roughBuf[bIdx] = clamp01(0.62 + (1.0 - cup) * 0.24);
            }
          }
        }
      }
    }

    const { normCanvas, roughCanvas } = buildNormalAndRoughnessCanvases(heightBuf, roughBuf, size, 2.9);
    baseCanvases = { colorCanvas, normCanvas, roughCanvas };
    baseCanvasCache.set(baseKey, baseCanvases);
  }

  const pair = {
    map: configureTexture(baseCanvases.colorCanvas, { repeatX, repeatY, srgb: true }),
    normalMap: configureTexture(baseCanvases.normCanvas, { repeatX, repeatY, srgb: false }),
    roughnessMap: configureTexture(baseCanvases.roughCanvas, { repeatX, repeatY, srgb: false }),
  };
  cache.set(key, pair);
  return pair;
}

/**
 * Generates anisotropic silk hair-strand PBR maps (map, normalMap, roughnessMap only)
 * for natural textured curls, waves, and crown volume on characters.
 */
export function getHairTextures(hexColor = '#1E1512', repeatX = 2, repeatY = 2) {
  const key = `hair-pbr:${hexColor}:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const baseKey = `hair-pbr-base:${hexColor}`;
  let baseCanvases = baseCanvasCache.get(baseKey);
  if (!baseCanvases) {
    const size = 256;
    const colorCanvas = makeCanvas(size, size);
    const ctx = colorCanvas.getContext('2d');
    const cImg = ctx.getImageData(0, 0, size, size);
    const heightBuf = new Float32Array(size * size);
    const roughBuf = new Float32Array(size * size);

    const baseRgb = hexToRgb(hexColor);
    const darkRgb = {
      r: Math.max(0, Math.round(baseRgb.r * 0.56)),
      g: Math.max(0, Math.round(baseRgb.g * 0.54)),
      b: Math.max(0, Math.round(baseRgb.b * 0.54)),
    };
    const hiRgb = {
      r: Math.min(255, Math.round(baseRgb.r * 1.48 + 18)),
      g: Math.min(255, Math.round(baseRgb.g * 1.42 + 14)),
      b: Math.min(255, Math.round(baseRgb.b * 1.38 + 12)),
    };
    const seed = hexColor.charCodeAt(1) * 97 + 313;

    for (let y = 0; y < size; y++) {
      const v = y / size;
      // Soft anisotropic silk sheen band across crown mid-curvature
      const sheenBand = Math.exp(-Math.pow((v - 0.36) * 3.8, 2)) * 0.38;
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const idx = y * size + x;
        const off = idx * 4;

        const waveWarp = (fbmTileable(u * 2.0, v * 2.0, seed, 4) - 0.5) * 0.08;
        const lock = Math.sin(((u + waveWarp) * 34.0) * Math.PI);
        const microStrand = fbmTileable(u * 28.0, v * 1.5, seed + 71, 6);
        const ridge = clamp01(0.5 + lock * 0.32 + (microStrand - 0.5) * 0.42);

        let rgb = ridge < 0.5
          ? mixRgb(darkRgb, baseRgb, ridge * 2.0)
          : mixRgb(baseRgb, hiRgb, (ridge - 0.5) * 2.0);
        if (sheenBand > 0.02) {
          rgb = mixRgb({ r: rgb[0], g: rgb[1], b: rgb[2] }, hiRgb, sheenBand * (0.45 + ridge * 0.55));
        }

        cImg.data[off] = rgb[0];
        cImg.data[off + 1] = rgb[1];
        cImg.data[off + 2] = rgb[2];
        cImg.data[off + 3] = 255;

        heightBuf[idx] = ridge;
        roughBuf[idx] = clamp01(0.46 - sheenBand * 0.18 + (1.0 - ridge) * 0.24);
      }
    }

    ctx.putImageData(cImg, 0, 0);
    const { normCanvas, roughCanvas } = buildNormalAndRoughnessCanvases(heightBuf, roughBuf, size, 1.9);
    baseCanvases = { colorCanvas, normCanvas, roughCanvas };
    baseCanvasCache.set(baseKey, baseCanvases);
  }

  const pair = {
    map: configureTexture(baseCanvases.colorCanvas, { repeatX, repeatY, srgb: true }),
    normalMap: configureTexture(baseCanvases.normCanvas, { repeatX, repeatY, srgb: false }),
    roughnessMap: configureTexture(baseCanvases.roughCanvas, { repeatX, repeatY, srgb: false }),
  };
  cache.set(key, pair);
  return pair;
}
