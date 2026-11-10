import * as THREE from 'three';

/**
 * Procedural PBR Texture Generator for Sandalwood Garden Estate.
 * Generates cached, deterministic CanvasTextures for wood grains, stone pavers,
 * ceramic/mosaic tiles, woven linen, bark, petals, and curated wall artworks.
 */

const cache = new Map();

function seededRand(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
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
 * Generates paired albedo + bump maps for planked timber surfaces.
 */
export function getTimberTextures(variant = 'sandalwood', repeatX = 2, repeatY = 2) {
  const key = `timber:${variant}:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const palettes = {
    sandalwood: { base: '#B88755', sec: '#95683F', hi: '#D3AD7B', gap: '#69472F', planks: 7 },
    walnut: { base: '#68472F', sec: '#553B2A', hi: '#825B3E', gap: '#392517', planks: 6 },
    oak: { base: '#B88A5A', sec: '#9E7447', hi: '#CE9F6E', gap: '#6E4C2E', planks: 8 },
    teak: { base: '#986B45', sec: '#7E5736', hi: '#AE8057', gap: '#4E341F', planks: 9 },
    slats: { base: '#A8794D', sec: '#8A603E', hi: '#C29364', gap: '#472E1B', planks: 16 },
  };
  const pal = palettes[variant] || palettes.sandalwood;
  const size = 512;
  const colorCanvas = makeCanvas(size, size);
  const bumpCanvas = makeCanvas(size, size);
  const ctx = colorCanvas.getContext('2d');
  const btx = bumpCanvas.getContext('2d');
  const rand = seededRand(variant.length * 917 + 13);

  ctx.fillStyle = pal.base;
  ctx.fillRect(0, 0, size, size);
  btx.fillStyle = '#c8c8c8';
  btx.fillRect(0, 0, size, size);

  const plankH = size / pal.planks;
  for (let p = 0; p < pal.planks; p++) {
    const y0 = p * plankH;
    const toneMix = rand();
    ctx.fillStyle = toneMix > 0.6 ? pal.hi : toneMix < 0.3 ? pal.sec : pal.base;
    ctx.globalAlpha = 0.25 + rand() * 0.22;
    ctx.fillRect(0, y0, size, plankH);

    // Subtle wood grain waves along plank length
    for (let g = 0; g < 22; g++) {
      const gy = y0 + 3 + rand() * (plankH - 6);
      ctx.strokeStyle = rand() > 0.5 ? pal.sec : pal.hi;
      ctx.globalAlpha = 0.08 + rand() * 0.14;
      ctx.lineWidth = 0.8 + rand() * 1.4;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      const amp = 1.5 + rand() * 2.5;
      const freq = 0.012 + rand() * 0.015;
      for (let x = 0; x <= size; x += 24) {
        ctx.lineTo(x, gy + Math.sin(x * freq + g) * amp);
      }
      ctx.stroke();

      btx.strokeStyle = rand() > 0.5 ? '#b2b2b2' : '#dedede';
      btx.globalAlpha = 0.18;
      btx.lineWidth = 1;
      btx.beginPath();
      btx.moveTo(0, gy);
      for (let x = 0; x <= size; x += 32) {
        btx.lineTo(x, gy + Math.sin(x * freq + g) * amp);
      }
      btx.stroke();
    }

    // Plank groove (4-8 mm visual shadow gap)
    ctx.globalAlpha = 1;
    ctx.fillStyle = pal.gap;
    ctx.fillRect(0, y0, size, 3);
    btx.globalAlpha = 1;
    btx.fillStyle = '#383838';
    btx.fillRect(0, y0, size, 3);

    // Occasional plank end butt-joint
    const jointX = ((p * 173 + 85) % (size - 40)) + 20;
    ctx.fillRect(jointX, y0, 2, plankH);
    btx.fillRect(jointX, y0, 2, plankH);
  }

  const pair = {
    map: configureTexture(colorCanvas, { repeatX, repeatY, srgb: true }),
    bumpMap: configureTexture(bumpCanvas, { repeatX, repeatY, srgb: false }),
  };
  cache.set(key, pair);
  return pair;
}

/**
 * Generates stone paver or tile textures with subtle low-contrast veining & grout lines.
 */
export function getStoneTileTextures(variant = 'paver', repeatX = 2, repeatY = 2) {
  const key = `stone:${variant}:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const configs = {
    paver: { bg: '#D4C6B0', alt: '#C5B69E', grout: '#8D806C', cols: 2, rows: 4, groutPx: 4 },
    foyer: { bg: '#C9B99F', alt: '#BFB096', grout: '#9C8E78', cols: 2, rows: 2, groutPx: 3 },
    limestone: { bg: '#C8BDAA', alt: '#BFB3A0', grout: '#9B907E', cols: 2, rows: 2, groutPx: 2 },
    bathWall: { bg: '#D5D0C5', alt: '#BEB4A4', grout: '#A39D91', cols: 2, rows: 1, groutPx: 2 },
    bathFloor: { bg: '#B9B3A8', alt: '#AFA99E', grout: '#8E887E', cols: 2, rows: 2, groutPx: 3 },
    laundry: { bg: '#AAA398', alt: '#9E978C', grout: '#7D776D', cols: 2, rows: 2, groutPx: 3 },
    poolMosaic: { bg: '#67B8D1', alt: '#4E9FC0', grout: '#8BD1E3', cols: 12, rows: 12, groutPx: 2 },
  };
  const cfg = configs[variant] || configs.paver;
  const size = 512;
  const colorCanvas = makeCanvas(size, size);
  const bumpCanvas = makeCanvas(size, size);
  const ctx = colorCanvas.getContext('2d');
  const btx = bumpCanvas.getContext('2d');
  const rand = seededRand(variant.length * 431 + 7);

  ctx.fillStyle = cfg.bg;
  ctx.fillRect(0, 0, size, size);
  btx.fillStyle = '#d4d4d4';
  btx.fillRect(0, 0, size, size);

  const cellW = size / cfg.cols;
  const cellH = size / cfg.rows;
  for (let r = 0; r < cfg.rows; r++) {
    const offset = variant === 'paver' && r % 2 === 1 ? cellW * 0.5 : 0;
    for (let c = -1; c <= cfg.cols; c++) {
      const x = c * cellW + offset;
      const y = r * cellH;
      ctx.fillStyle = rand() > 0.5 ? cfg.bg : cfg.alt;
      ctx.globalAlpha = 0.28 + rand() * 0.35;
      ctx.fillRect(x, y, cellW, cellH);

      // Mineral specks / subtle marble vein
      for (let s = 0; s < 14; s++) {
        ctx.fillStyle = rand() > 0.5 ? '#ffffff' : '#6c6458';
        ctx.globalAlpha = 0.04 + rand() * 0.05;
        const sx = x + rand() * cellW;
        const sy = y + rand() * cellH;
        ctx.fillRect(sx, sy, 2 + rand() * 6, 1 + rand() * 3);
      }

      ctx.globalAlpha = 1;
      ctx.strokeStyle = cfg.grout;
      ctx.lineWidth = cfg.groutPx;
      ctx.strokeRect(x, y, cellW, cellH);

      btx.strokeStyle = '#505050';
      btx.lineWidth = cfg.groutPx;
      btx.strokeRect(x, y, cellW, cellH);
    }
  }

  const pair = {
    map: configureTexture(colorCanvas, { repeatX, repeatY, srgb: true }),
    bumpMap: configureTexture(bumpCanvas, { repeatX, repeatY, srgb: false }),
  };
  cache.set(key, pair);
  return pair;
}

/**
 * Generates woven linen / fabric bump & diffuse texture for upholstery, curtains, clothing, and bedding.
 */
export function getFabricTextures(hexColor = '#B7A797', repeatX = 4, repeatY = 4) {
  const key = `fabric:${hexColor}:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const size = 256;
  const colorCanvas = makeCanvas(size, size);
  const bumpCanvas = makeCanvas(size, size);
  const ctx = colorCanvas.getContext('2d');
  const btx = bumpCanvas.getContext('2d');
  const rand = seededRand(hexColor.charCodeAt(1) * 53 + 19);

  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, size, size);
  btx.fillStyle = '#999999';
  btx.fillRect(0, 0, size, size);

  for (let i = 0; i < size; i += 4) {
    ctx.fillStyle = i % 8 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, i, size, 2);
    ctx.fillRect(i, 0, 2, size);

    btx.fillStyle = i % 8 === 0 ? '#cfcfcf' : '#767676';
    btx.fillRect(0, i, size, 2);
    btx.fillRect(i, 0, 2, size);
  }

  for (let i = 0; i < 450; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(20,15,10,0.04)';
    ctx.fillRect(rand() * size, rand() * size, 3, 2);
  }

  const pair = {
    map: configureTexture(colorCanvas, { repeatX, repeatY, srgb: true }),
    bumpMap: configureTexture(bumpCanvas, { repeatX, repeatY, srgb: false }),
  };
  cache.set(key, pair);
  return pair;
}

/**
 * Garden lawn texture combining deep, medium, and light greens (no flat solid green).
 */
export function getLawnTexture(repeatX = 16, repeatY = 14) {
  const key = `lawn:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const size = 512;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const rand = seededRand(8831);

  ctx.fillStyle = '#3D6843';
  ctx.fillRect(0, 0, size, size);

  const greens = ['#315B3A', '#4F7948', '#7C9B5A', '#3B6440'];
  for (let i = 0; i < 4200; i++) {
    ctx.fillStyle = greens[Math.floor(rand() * greens.length)];
    ctx.globalAlpha = 0.22 + rand() * 0.35;
    const x = rand() * size;
    const y = rand() * size;
    const w = 2 + rand() * 8;
    const h = 2 + rand() * 8;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
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

  const size = 256;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const rand = seededRand(3347);

  ctx.fillStyle = '#3E2E22';
  ctx.fillRect(0, 0, size, size);

  const tones = ['#2E2118', '#4E3B2B', '#5E4735', '#271B13'];
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = tones[Math.floor(rand() * tones.length)];
    ctx.globalAlpha = 0.45;
    ctx.fillRect(rand() * size, rand() * size, 2 + rand() * 5, 2 + rand() * 4);
  }

  const tex = configureTexture(canvas, { repeatX, repeatY, srgb: true });
  cache.set(key, tex);
  return tex;
}

/**
 * Curated framed botanical/architectural artwork canvas for bedrooms & dining hall.
 */
export function getArtworkTexture(theme = 'botanical') {
  const key = `art:${theme}`;
  if (cache.has(key)) return cache.get(key);

  const w = 384;
  const h = 512;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');

  // Warm linen paper ground
  ctx.fillStyle = '#F2EAD9';
  ctx.fillRect(0, 0, w, h);

  if (theme === 'botanical') {
    ctx.fillStyle = '#E5D9C3';
    ctx.fillRect(28, 28, w - 56, h - 56);
    ctx.strokeStyle = '#3F6B4B';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.85);
    ctx.quadraticCurveTo(w * 0.45, h * 0.5, w * 0.54, h * 0.2);
    ctx.stroke();
    const leaves = [
      [0.48, 0.65, -0.7],
      [0.52, 0.56, 0.75],
      [0.47, 0.44, -0.6],
      [0.54, 0.35, 0.65],
      [0.52, 0.24, -0.2],
    ];
    for (const [lx, ly, ang] of leaves) {
      ctx.save();
      ctx.translate(w * lx, h * ly);
      ctx.rotate(ang);
      ctx.fillStyle = '#52794E';
      ctx.beginPath();
      ctx.ellipse(32, 0, 36, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (theme === 'landscape') {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#E9D5BD');
    grad.addColorStop(0.5, '#D2A87E');
    grad.addColorStop(1, '#5F7762');
    ctx.fillStyle = grad;
    ctx.fillRect(24, 24, w - 48, h - 48);
    ctx.fillStyle = '#4B6353';
    ctx.beginPath();
    ctx.moveTo(24, h * 0.64);
    ctx.quadraticCurveTo(w * 0.35, h * 0.48, w * 0.68, h * 0.62);
    ctx.lineTo(w - 24, h * 0.55);
    ctx.lineTo(w - 24, h - 24);
    ctx.lineTo(24, h - 24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#F7E7C8';
    ctx.beginPath();
    ctx.arc(w * 0.7, h * 0.28, 34, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Dining warm abstract horizon
    ctx.fillStyle = '#EFE6D5';
    ctx.fillRect(24, 24, w - 48, h - 48);
    ctx.fillStyle = '#B8755F';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.43, 88, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7C593D';
    ctx.fillRect(58, h * 0.66, w - 116, 48);
  }

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

  // Misty mountain ridge silhouette
  ctx.fillStyle = 'rgba(20, 34, 38, 0.55)';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.72);
  ctx.quadraticCurveTo(w * 0.28, h * 0.42, w * 0.56, h * 0.66);
  ctx.quadraticCurveTo(w * 0.78, h * 0.5, w, h * 0.68);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(244, 238, 224, 0.85)';
  ctx.font = '500 26px Georgia, serif';
  ctx.fillText('SANDALWOOD GALLERY', 42, 68);
  ctx.fillStyle = 'rgba(244, 238, 224, 0.62)';
  ctx.font = '300 13px sans-serif';
  ctx.fillText('QUIET AMBIENT ARCHITECTURE · 4K OLED', 42, 94);

  const tex = configureTexture(canvas, { repeatX: 1, repeatY: 1, srgb: true });
  cache.set(key, tex);
  return tex;
}

export function getTreeBarkTexture() {
  const key = 'bark';
  if (cache.has(key)) return cache.get(key);

  const size = 256;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const rand = seededRand(5151);

  ctx.fillStyle = '#6D503A';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 160; i++) {
    ctx.strokeStyle = rand() > 0.45 ? '#553D2A' : '#816249';
    ctx.lineWidth = 1.5 + rand() * 3.5;
    ctx.globalAlpha = 0.45;
    const x = rand() * size;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (rand() - 0.5) * 14, size);
    ctx.stroke();
  }

  const tex = configureTexture(canvas, { repeatX: 2, repeatY: 4, srgb: true });
  cache.set(key, tex);
  return tex;
}