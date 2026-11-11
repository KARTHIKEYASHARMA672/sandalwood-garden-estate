import * as THREE from 'three';

/**
 * Day / Sunset / Night Lighting, Sky Dome Shader, and Optional Weather Rig.
 * - Day: 35-60 deg sun elevation, neutral daylight, crisp soft shadows
 * - Sunset: warm low-angle sunlight, peach/dusty rose/muted orange/blue sky gradient
 * - Night: deep navy sky (never pitch black), cool moonlight fill, 2700K/3000K lamps active
 */

const SKY_VERTEX = `
  varying vec3 vWorldPos;
  void main() {
    vWorldPos = position;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const SKY_FRAGMENT = `
  uniform vec3 uTopColor;
  uniform vec3 uMidColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uStarIntensity;
  uniform float uCloudFactor;
  uniform float uTime;
  varying vec3 vWorldPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec3 dir = normalize(vWorldPos);
    float h = clamp(dir.y, 0.0, 1.0);
    vec3 col = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.28, h));
    col = mix(col, uTopColor, smoothstep(0.24, 0.85, h));

    // Soft solar/lunar glow
    float sunAmt = max(dot(dir, normalize(uSunDir)), 0.0);
    col += uSunColor * pow(sunAmt, 16.0) * 0.42;
    col += uSunColor * smoothstep(0.996, 0.9995, sunAmt) * 0.9;

    // Gentle clouds
    if (h > 0.03) {
      vec2 uv = dir.xz / (h + 0.18) * 1.4 + vec2(uTime * 0.008, uTime * 0.003);
      float c = noise(uv * 2.2) * 0.65 + noise(uv * 4.7) * 0.35;
      float cloudMask = smoothstep(0.55 - uCloudFactor * 0.16, 0.82, c) * smoothstep(0.03, 0.22, h);
      vec3 cloudCol = mix(uHorizonColor * 1.12, vec3(0.98, 0.96, 0.93), 0.55);
      col = mix(col, cloudCol, cloudMask * (0.28 + uCloudFactor * 0.35));
    }

    // Crisp circular anti-aliased pinpoint stars on night dome (isotropic spherical grid)
    if (uStarIntensity > 0.01 && h > 0.06) {
      float az = atan(dir.z, dir.x);
      float el = asin(clamp(dir.y, -1.0, 1.0));
      vec2 starGridPos = vec2(az * cos(el) * 38.0, el * 38.0);
      vec2 cellId = floor(starGridPos);
      vec2 cellUv = fract(starGridPos);
      float s = hash(cellId);
      if (s > 0.968) {
        vec2 jitter = vec2(
          0.24 + 0.52 * fract(s * 73.1),
          0.24 + 0.52 * fract(s * 139.7)
        );
        float dist = length(cellUv - jitter);
        float pointRadius = mix(0.055, 0.11, fract(s * 31.3));
        float starMask = smoothstep(pointRadius, pointRadius * 0.15, dist);
        float twinkle = 0.65 + 0.35 * sin(uTime * 2.4 + s * 80.0);
        vec3 starTint = mix(vec3(0.84, 0.90, 1.0), vec3(1.0, 0.93, 0.82), fract(s * 17.7));
        col += starTint * starMask * uStarIntensity * twinkle * smoothstep(0.06, 0.24, h) * 1.15;
      }
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createDayNightController(scene, renderer) {
  const skyUniforms = {
    uTopColor: { value: new THREE.Color('#5A8EC2') },
    uMidColor: { value: new THREE.Color('#9EC5E6') },
    uHorizonColor: { value: new THREE.Color('#E3ECEF') },
    uSunDir: { value: new THREE.Vector3(0.55, 0.72, 0.42).normalize() },
    uSunColor: { value: new THREE.Color('#FFF7E6') },
    uStarIntensity: { value: 0.0 },
    uCloudFactor: { value: 0.2 },
    uTime: { value: 0.0 },
  };

  // Keep sky radius strictly within camera.far (150 m) and follow viewer position cleanly
  const skyGeo = new THREE.SphereGeometry(95, 32, 24);
  const skyMat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERTEX,
    fragmentShader: SKY_FRAGMENT,
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  skyDome.frustumCulled = false;
  scene.add(skyDome);

  scene.fog = new THREE.FogExp2('#DCE7EA', 0.0048);

  const hemiLight = new THREE.HemisphereLight('#F4EFE6', '#CBBAA2', 0.85);
  scene.add(hemiLight);

  // Omnidirectional indirect interior/exterior bounce light so ceilings & recessed walls stay warm
  const ambientBounce = new THREE.AmbientLight('#FFF7EA', 0.36);
  scene.add(ambientBounce);

  const sunLight = new THREE.DirectionalLight('#FFF5E4', 2.0);
  sunLight.position.set(28, 36, 24);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 2;
  sunLight.shadow.camera.far = 110;
  sunLight.shadow.camera.left = -38;
  sunLight.shadow.camera.right = 38;
  sunLight.shadow.camera.top = 38;
  sunLight.shadow.camera.bottom = -38;
  sunLight.shadow.bias = -0.00035;
  sunLight.shadow.normalBias = 0.022;
  sunLight.shadow.radius = 2.4;
  scene.add(sunLight);

  // Subtle fill bounce light so interior shadows stay soft & architectural
  const bounceLight = new THREE.DirectionalLight('#EDE3D2', 0.35);
  bounceLight.position.set(-20, 12, -22);
  scene.add(bounceLight);

  // Procedural PMREM studio-sky IBL environment for realistic PBR metallic/glass/stone reflections
  const canUsePMREM =
    renderer &&
    typeof renderer.getContext === 'function' &&
    typeof THREE.PMREMGenerator === 'function';
  const pmremEnvCache = new Map();
  let pmremGenerator = null;

  function applyEnvironmentIBL(timeOfDay, isRain) {
    if (!canUsePMREM) return;
    const envKey = `${timeOfDay}:${isRain ? 'rain' : 'clear'}`;
    if (!pmremEnvCache.has(envKey)) {
      if (!pmremGenerator) {
        pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
      }
      const envScene = new THREE.Scene();
      const envSkyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
      const envSphere = new THREE.Mesh(new THREE.SphereGeometry(20, 24, 16), envSkyMat);
      // Tint spherical probe using current sky gradient + warm horizon + muted earth floor
      const topCol = skyUniforms.uTopColor.value.clone();
      const horizCol = skyUniforms.uHorizonColor.value.clone();
      const gndCol = hemiLight.groundColor.clone();
      const envGeo = envSphere.geometry;
      const posAttr = envGeo.getAttribute('position');
      const vCols = new Float32Array(posAttr.count * 3);
      for (let i = 0; i < posAttr.count; i++) {
        const ny = posAttr.getY(i) / 20.0;
        const c = ny >= 0
          ? horizCol.clone().lerp(topCol, Math.min(1, ny * 1.15))
          : horizCol.clone().lerp(gndCol, Math.min(1, -ny * 1.6));
        vCols[i * 3] = c.r;
        vCols[i * 3 + 1] = c.g;
        vCols[i * 3 + 2] = c.b;
      }
      envGeo.setAttribute('color', new THREE.BufferAttribute(vCols, 3));
      envSkyMat.vertexColors = true;
      envScene.add(envSphere);

      // Warm solar/moon highlight disc in probe so water/glass/brass catch directional gleam
      const sunDisc = new THREE.Mesh(
        new THREE.SphereGeometry(2.6, 12, 12),
        new THREE.MeshBasicMaterial({ color: skyUniforms.uSunColor.value })
      );
      sunDisc.position.copy(skyUniforms.uSunDir.value).multiplyScalar(17);
      envScene.add(sunDisc);

      const rt = pmremGenerator.fromScene(envScene, 0.04);
      envGeo.dispose();
      envSkyMat.dispose();
      sunDisc.geometry.dispose();
      sunDisc.material.dispose();
      pmremEnvCache.set(envKey, rt);
    }
    const target = pmremEnvCache.get(envKey);
    if (target && target.texture) {
      scene.environment = target.texture;
      scene.environmentIntensity =
        timeOfDay === 'day' ? (isRain ? 0.56 : 0.72) : timeOfDay === 'sunset' ? 0.58 : 0.3;
    }
  }

  // Registry of night/sunset-responsive lamps & emissive materials
  const exteriorLights = []; // { light, baseIntensity, emissiveMat, baseEmissive }
  const interiorLights = []; // { light, baseIntensity, emissiveMat, baseEmissive }
  const poolLights = []; // { light, baseIntensity }

  // Optional gentle rain particles (strictly outside house footprint)
  const rainCount = 900;
  const rainPositions = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    let rx = (Math.random() - 0.5) * 76;
    let rz = -22 + Math.random() * 64;
    if (rx > -12.8 && rx < 12.8 && rz > -9.8 && rz < 9.8) {
      rx += rx >= 0 ? 14 : -14;
    }
    rainPositions[i * 3] = rx;
    rainPositions[i * 3 + 1] = Math.random() * 18;
    rainPositions[i * 3 + 2] = rz;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainMat = new THREE.PointsMaterial({
    color: '#E6F2FA',
    size: 0.14,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const rainPoints = new THREE.Points(rainGeo, rainMat);
  rainPoints.visible = false;
  scene.add(rainPoints);

  function registerExteriorLight(light, baseIntensity, emissiveMat = null, baseEmissive = 1.2) {
    exteriorLights.push({ light, baseIntensity, emissiveMat, baseEmissive });
  }

  function registerInteriorLight(light, baseIntensity, emissiveMat = null, baseEmissive = 1.0) {
    interiorLights.push({ light, baseIntensity, emissiveMat, baseEmissive });
  }

  function registerPoolLight(light, baseIntensity) {
    poolLights.push({ light, baseIntensity });
  }

  let currentMode = 'day';
  let currentWeather = 'clear';

  function applyState(timeOfDay = 'day', weather = 'clear') {
    currentMode = timeOfDay;
    currentWeather = weather;

    const isCloudy = weather === 'cloud' || weather === 'rain';
    const isRain = weather === 'rain';
    skyUniforms.uCloudFactor.value = isRain ? 0.92 : isCloudy ? 0.6 : 0.2;
    rainPoints.visible = isRain;

    if (timeOfDay === 'day') {
      skyUniforms.uTopColor.value.set(isRain ? '#4C647D' : isCloudy ? '#5F84AC' : '#558BC1');
      skyUniforms.uMidColor.value.set(isRain ? '#748BA0' : isCloudy ? '#92B0C9' : '#9DC4E6');
      skyUniforms.uHorizonColor.value.set(isRain ? '#A2B0B9' : isCloudy ? '#D4DEE2' : '#E7EFEF');
      skyUniforms.uSunDir.value.set(0.55, 0.72, 0.42).normalize();
      skyUniforms.uSunColor.value.set('#FFF8E7');
      skyUniforms.uStarIntensity.value = 0.0;

      sunLight.position.set(28, 38, 24);
      sunLight.color.set(isRain ? '#DAE4EE' : '#FFF6E5');
      sunLight.intensity = isRain ? 0.98 : isCloudy ? 1.35 : 2.05;
      hemiLight.color.set(isRain ? '#C8D2DC' : '#F4EFE6');
      hemiLight.groundColor.set(isRain ? '#9B968D' : '#CBBAA2');
      hemiLight.intensity = isRain ? 0.72 : 0.88;
      ambientBounce.color.set(isRain ? '#DAE2EA' : '#FFF7EA');
      ambientBounce.intensity = isRain ? 0.28 : 0.38;
      bounceLight.intensity = 0.42;
      scene.fog.color.set(isRain ? '#9BA8B2' : isCloudy ? '#CBD6DB' : '#DCE7EA');
      scene.fog.density = isRain ? 0.0085 : isCloudy ? 0.0068 : 0.0044;
      renderer.toneMappingExposure = 1.04;

      for (const l of exteriorLights) {
        if (l.light) l.light.intensity = 0;
        if (l.emissiveMat) l.emissiveMat.emissiveIntensity = 0.05;
      }
      for (const l of interiorLights) {
        if (l.light) l.light.intensity = l.baseIntensity * 0.38;
        if (l.emissiveMat) l.emissiveMat.emissiveIntensity = 0.32;
      }
      for (const l of poolLights) {
        if (l.light) l.light.intensity = 0;
      }
    } else if (timeOfDay === 'sunset') {
      skyUniforms.uTopColor.value.set('#3A537B');
      skyUniforms.uMidColor.value.set('#D2848B');
      skyUniforms.uHorizonColor.value.set('#F4A579');
      skyUniforms.uSunDir.value.set(-0.78, 0.2, 0.58).normalize();
      skyUniforms.uSunColor.value.set('#FFB066');
      skyUniforms.uStarIntensity.value = 0.0;

      sunLight.position.set(-40, 11, 28);
      sunLight.color.set('#FFA964');
      sunLight.intensity = isCloudy ? 1.1 : 1.7;
      hemiLight.color.set('#E9B39E');
      hemiLight.groundColor.set('#6E5B49');
      hemiLight.intensity = 0.68;
      ambientBounce.color.set('#FFE6CC');
      ambientBounce.intensity = 0.24;
      bounceLight.intensity = 0.28;
      scene.fog.color.set('#D89B82');
      scene.fog.density = 0.0056;
      renderer.toneMappingExposure = 1.06;

      for (const l of exteriorLights) {
        if (l.light) l.light.intensity = l.baseIntensity * 0.78;
        if (l.emissiveMat) l.emissiveMat.emissiveIntensity = l.baseEmissive * 0.85;
      }
      for (const l of interiorLights) {
        if (l.light) l.light.intensity = l.baseIntensity * 0.78;
        if (l.emissiveMat) l.emissiveMat.emissiveIntensity = l.baseEmissive * 0.85;
      }
      for (const l of poolLights) {
        if (l.light) l.light.intensity = l.baseIntensity * 0.55;
      }
    } else {
      // Night: rich navy sky, cool moonlight fill, warm 2700K-3000K interior/exterior lamps
      skyUniforms.uTopColor.value.set('#0F1A30');
      skyUniforms.uMidColor.value.set('#182947');
      skyUniforms.uHorizonColor.value.set('#263B59');
      skyUniforms.uSunDir.value.set(0.42, 0.62, -0.52).normalize();
      skyUniforms.uSunColor.value.set('#B9D2F2');
      skyUniforms.uStarIntensity.value = isCloudy ? 0.15 : 0.9;

      sunLight.position.set(20, 30, -24);
      sunLight.color.set('#9CB8DF');
      sunLight.intensity = 0.42;
      hemiLight.color.set('#3E587D');
      hemiLight.groundColor.set('#272926');
      hemiLight.intensity = 0.52;
      ambientBounce.color.set('#9DB5D8');
      ambientBounce.intensity = 0.12;
      bounceLight.intensity = 0.16;
      scene.fog.color.set('#1C2D47');
      scene.fog.density = 0.0062;
      renderer.toneMappingExposure = 1.15;

      for (const l of exteriorLights) {
        if (l.light) l.light.intensity = l.baseIntensity;
        if (l.emissiveMat) l.emissiveMat.emissiveIntensity = l.baseEmissive;
      }
      for (const l of interiorLights) {
        if (l.light) l.light.intensity = l.baseIntensity;
        if (l.emissiveMat) l.emissiveMat.emissiveIntensity = l.baseEmissive;
      }
      for (const l of poolLights) {
        if (l.light) l.light.intensity = l.baseIntensity;
      }
    }

    applyEnvironmentIBL(timeOfDay, isRain);
  }

  function applyQuality(shadowSize) {
    if (sunLight.shadow.mapSize.width !== shadowSize) {
      sunLight.shadow.mapSize.set(shadowSize, shadowSize);
      if (sunLight.shadow.map) {
        sunLight.shadow.map.dispose();
        sunLight.shadow.map = null;
      }
    }
  }

  function update(dt, elapsed, cameraPos = null) {
    skyUniforms.uTime.value = elapsed;
    if (cameraPos) {
      skyDome.position.set(cameraPos.x, 0, cameraPos.z);
    }
    if (rainPoints.visible) {
      const posAttr = rainGeo.getAttribute('position');
      for (let i = 0; i < rainCount; i++) {
        let y = posAttr.getY(i) - dt * 15.0;
        let x = posAttr.getX(i) + dt * 1.4;
        if (y < 0.05) {
          y = 17.5 + Math.random() * 2;
          x = (Math.random() - 0.5) * 76;
          const z = posAttr.getZ(i);
          if (x > -12.8 && x < 12.8 && z > -9.8 && z < 9.8) {
            x += x >= 0 ? 14 : -14;
          }
        }
        posAttr.setXY(i, x, y);
      }
      posAttr.needsUpdate = true;
    }
  }

  function dispose() {
    for (const rt of pmremEnvCache.values()) {
      if (rt && typeof rt.dispose === 'function') rt.dispose();
    }
    pmremEnvCache.clear();
    if (pmremGenerator && typeof pmremGenerator.dispose === 'function') {
      pmremGenerator.dispose();
      pmremGenerator = null;
    }
  }

  applyState('day', 'clear');

  return {
    sunLight,
    registerExteriorLight,
    registerInteriorLight,
    registerPoolLight,
    applyState,
    applyQuality,
    update,
    dispose,
    getState: () => ({ timeOfDay: currentMode, weather: currentWeather }),
  };
}
