/**
 * Synthesized Web Audio API Sound Engine (zero external MP3 dependencies).
 * Starts strictly after user interaction and supports mute + volume settings.
 */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambienceGain = null;
    this.showerGain = null;
    this.poolGain = null;
    this.started = false;
    this.muted = false;
    this.volume = 0.55;
    this.birdTimer = null;
    this.noiseBuffer = null;
  }

  unlock() {
    if (this.started) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : this.volume;
    this.masterGain.connect(this.ctx.destination);

    // Pre-generate 2s pink-ish noise buffer
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.09;
    }

    this._setupGardenAmbience();
    this._setupShowerLoop();
    this._setupPoolLoop();
    this._scheduleBirdChirp();

    this.started = true;
  }

  _setupGardenAmbience() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;

    this.ambienceGain = this.ctx.createGain();
    this.ambienceGain.gain.value = 0.12;

    src.connect(filter);
    filter.connect(this.ambienceGain);
    this.ambienceGain.connect(this.masterGain);
    src.start();
  }

  _setupShowerLoop() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 2100;
    bandpass.Q.value = 0.65;

    this.showerGain = this.ctx.createGain();
    this.showerGain.gain.value = 0.0;

    src.connect(bandpass);
    bandpass.connect(this.showerGain);
    this.showerGain.connect(this.masterGain);
    src.start();
  }

  _setupPoolLoop() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 780;
    filter.Q.value = 1.2;

    this.poolGain = this.ctx.createGain();
    this.poolGain.gain.value = 0.0;

    src.connect(filter);
    filter.connect(this.poolGain);
    this.poolGain.connect(this.masterGain);
    src.start();
  }

  _scheduleBirdChirp() {
    if (this.birdTimer) clearTimeout(this.birdTimer);
    const delayMs = 4200 + Math.random() * 5800;
    this.birdTimer = setTimeout(() => {
      if (this.ctx && !this.muted && this.ambienceGain && this.ambienceGain.gain.value > 0.04) {
        this._playBirdChirp();
      }
      this._scheduleBirdChirp();
    }, delayMs);
  }

  _playBirdChirp() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 2100 + Math.random() * 900;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.32, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.92, now + 0.14);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.025, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  setVolume(vol, muted) {
    this.volume = vol;
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : vol, this.ctx.currentTime, 0.05);
    }
  }

  updateSpatialLevels({ indoors, showerActive, showerDistance, poolDistance }) {
    if (!this.started || !this.ctx) return;
    const now = this.ctx.currentTime;

    const targetAmbience = indoors ? 0.03 : 0.13;
    this.ambienceGain.gain.setTargetAtTime(targetAmbience, now, 0.25);

    const showerFactor = showerActive
      ? Math.max(0, 1 - showerDistance / 6.5) * 0.34
      : 0;
    this.showerGain.gain.setTargetAtTime(showerFactor, now, 0.18);

    const poolFactor = !indoors ? Math.max(0, 1 - poolDistance / 14) * 0.08 : 0;
    this.poolGain.gain.setTargetAtTime(poolFactor, now, 0.25);
  }

  playFootstep(surface = 'grass') {
    if (!this.started || !this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    if (surface === 'grass') {
      filter.type = 'lowpass';
      filter.frequency.value = 380;
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    } else if (surface === 'stone') {
      filter.type = 'bandpass';
      filter.frequency.value = 1250;
      filter.Q.value = 1.4;
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    } else if (surface === 'timber') {
      filter.type = 'lowpass';
      filter.frequency.value = 640;
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      const thump = this.ctx.createOscillator();
      const thumpGain = this.ctx.createGain();
      thump.type = 'triangle';
      thump.frequency.setValueAtTime(145, now);
      thump.frequency.exponentialRampToValueAtTime(72, now + 0.08);
      thumpGain.gain.setValueAtTime(0.055, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      thump.connect(thumpGain);
      thumpGain.connect(this.masterGain);
      thump.start(now);
      thump.stop(now + 0.1);
    } else {
      // tile
      filter.type = 'highpass';
      filter.frequency.value = 950;
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    }

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now, Math.random() * 0.8, 0.14);
  }

  playDoorToggle(opening = true) {
    if (!this.started || !this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(opening ? 190 : 250, now);
    osc.frequency.exponentialRampToValueAtTime(opening ? 260 : 165, now + 0.16);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.18);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playInteract() {
    if (!this.started || !this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.09);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.14);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  dispose() {
    if (this.birdTimer) clearTimeout(this.birdTimer);
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.started = false;
  }
}

export const audioEngine = new AudioEngine();
