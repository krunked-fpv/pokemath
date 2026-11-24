/**
 * PokéMath Procedural Web Audio DSP & Voice Synthesis (`js/core/audio.js`)
 *
 * Pure zero-dependency Web Audio synthesizer + Web Speech API wrapper.
 * Zero square-wave buzzers, zero external audio assets, 100% Node-import-safe.
 */

const AMBIENT_STEP_MS = 420;

const PENTATONIC_SCALE = [
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
  1046.50, // C6
  1174.66, // D6
  1318.51, // E6
  1567.98, // G6
  1760.00, // A6
  2093.00 // C7
];

const CLICK_VARIANTS = {
  tap: [{ freq: 523.25, harmonicGain: 0.24, decay: 0.065, gain: 0.16, delay: 0 }],
  key: [{ freq: 659.25, harmonicGain: 0.22, decay: 0.052, gain: 0.14, delay: 0 }],
  keypad: [{ freq: 659.25, harmonicGain: 0.22, decay: 0.052, gain: 0.14, delay: 0 }],
  confirm: [
    { freq: 523.25, harmonicGain: 0.22, decay: 0.075, gain: 0.16, delay: 0 },
    { freq: 783.99, harmonicGain: 0.26, decay: 0.095, gain: 0.15, delay: 0.048 }
  ],
  submit: [
    { freq: 523.25, harmonicGain: 0.22, decay: 0.075, gain: 0.16, delay: 0 },
    { freq: 783.99, harmonicGain: 0.26, decay: 0.095, gain: 0.15, delay: 0.048 }
  ],
  back: [
    { freq: 440.00, harmonicGain: 0.16, decay: 0.065, gain: 0.13, delay: 0 },
    { freq: 349.23, harmonicGain: 0.14, decay: 0.08, gain: 0.12, delay: 0.04 }
  ],
  cancel: [
    { freq: 440.00, harmonicGain: 0.16, decay: 0.065, gain: 0.13, delay: 0 },
    { freq: 349.23, harmonicGain: 0.14, decay: 0.08, gain: 0.12, delay: 0.04 }
  ],
  close: [
    { freq: 440.00, harmonicGain: 0.16, decay: 0.065, gain: 0.13, delay: 0 },
    { freq: 349.23, harmonicGain: 0.14, decay: 0.08, gain: 0.12, delay: 0.04 }
  ],
  toggle: [
    { freq: 587.33, endFreq: 698.46, harmonicGain: 0.25, decay: 0.07, gain: 0.15, delay: 0 }
  ],
  switch: [
    { freq: 587.33, endFreq: 698.46, harmonicGain: 0.25, decay: 0.07, gain: 0.15, delay: 0 }
  ],
  hint: [
    { freq: 698.46, harmonicGain: 0.26, decay: 0.075, gain: 0.14, delay: 0 },
    { freq: 880.00, harmonicGain: 0.30, decay: 0.11, gain: 0.15, delay: 0.055 }
  ],
  rotom: [
    { freq: 698.46, harmonicGain: 0.26, decay: 0.075, gain: 0.14, delay: 0 },
    { freq: 880.00, harmonicGain: 0.30, decay: 0.11, gain: 0.15, delay: 0.055 }
  ],
  coin: [
    { freq: 987.77, harmonicGain: 0.28, decay: 0.07, gain: 0.13, delay: 0 },
    { freq: 1318.51, harmonicGain: 0.32, decay: 0.14, gain: 0.14, delay: 0.055 }
  ],
  buy: [
    { freq: 987.77, harmonicGain: 0.28, decay: 0.07, gain: 0.13, delay: 0 },
    { freq: 1318.51, harmonicGain: 0.32, decay: 0.14, gain: 0.14, delay: 0.055 }
  ],
  berry: [
    { freq: 392.00, endFreq: 587.33, harmonicGain: 0.22, decay: 0.095, gain: 0.16, delay: 0 }
  ],
  // Crisp two-note PokéNav chime (D6 -> G6, bright and short)
  select: [
    { freq: 1174.66, harmonicGain: 0.30, decay: 0.055, gain: 0.12, delay: 0 },
    { freq: 1567.98, harmonicGain: 0.34, decay: 0.10, gain: 0.13, delay: 0.052 }
  ],
  // Warm rising heart-bell duet: C5+E5 glow, then G5+C6 bells lifting above
  love: [
    { freq: 523.25, harmonicGain: 0.20, decay: 0.16, gain: 0.12, delay: 0 },
    { freq: 659.25, harmonicGain: 0.20, decay: 0.16, gain: 0.10, delay: 0.012 },
    { freq: 783.99, bell: true, decay: 0.34, gain: 0.085, delay: 0.11 },
    { freq: 1046.50, bell: true, decay: 0.42, gain: 0.08, delay: 0.17 }
  ]
};

// 32-step relaxing kalimba daydream loop in C / Fmaj7 pentatonic colors
const AMBIENT_PATTERN = [
  // Bar 1: Fmaj7
  { bass: 174.61, note: 523.25, vel: 0.095 },
  { note: 659.25, vel: 0.07 },
  { note: 880.00, vel: 0.085 },
  { note: null },
  { note: 783.99, vel: 0.075 },
  { note: 659.25, vel: 0.065 },
  { note: 523.25, vel: 0.075 },
  { note: null },
  // Bar 2: Cmaj7
  { bass: 130.81, note: 659.25, vel: 0.095 },
  { note: 783.99, vel: 0.07 },
  { note: 1046.50, vel: 0.085 },
  { note: null },
  { note: 783.99, vel: 0.075 },
  { note: 587.33, vel: 0.065 },
  { note: 523.25, vel: 0.07 },
  { note: null },
  // Bar 3: Am7
  { bass: 220.00, note: 659.25, vel: 0.095 },
  { note: 783.99, vel: 0.07 },
  { note: 1046.50, vel: 0.085 },
  { note: 880.00, vel: 0.07 },
  { note: 783.99, vel: 0.075 },
  { note: 659.25, vel: 0.065 },
  { note: 587.33, vel: 0.07 },
  { note: null },
  // Bar 4: G6sus4
  { bass: 196.00, note: 587.33, vel: 0.09 },
  { note: 783.99, vel: 0.07 },
  { note: 880.00, vel: 0.085 },
  { note: 1174.66, vel: 0.07 },
  { note: 880.00, vel: 0.075 },
  { note: 783.99, vel: 0.065 },
  { note: 659.25, vel: 0.065 },
  { note: null }
];

const PREFERRED_VOICE_PATTERNS = [
  /natural/i,
  /aria/i,
  /jenny/i,
  /samantha/i,
  /ava/i,
  /karen/i,
  /daniel/i,
  /google\s+us\s+english/i,
  /google\s+uk\s+english/i,
  /premium/i,
  /enhanced/i,
  /zira/i
];

const AVOID_VOICE_PATTERNS = [
  /albert|bad\s+news|bahh|bells|boing|bubbles|cellos|deranged|good\s+news|hysterical|jester|organ|superstar|trinoids|whisper|zarvox|fred|junior/i
];

const settings = {
  sfx: true,
  ambient: false,
  speech: false
};

let audioCtx = null;
let masterCompressor = null;
let masterGain = null;
let sfxBus = null;
let ambientFilter = null;
let ambientBus = null;
let pinkNoiseBuffer = null;
let whiteNoiseBuffer = null;
let warmBrassWave = null;
let ambientTimerId = null;
let ambientStepIndex = 0;
let ambientOpened = false;
let ambientHiddenPause = false;
let visibilityHooked = false;
let unlockedOnce = false;

function getWindowRef() {
  if (typeof window !== 'undefined') return window;
  if (typeof globalThis !== 'undefined') return globalThis;
  return null;
}

function getAudioContextCtor() {
  const win = getWindowRef();
  if (!win) return null;
  if (typeof win.AudioContext === 'function') return win.AudioContext;
  if (typeof win.webkitAudioContext === 'function') return win.webkitAudioContext;
  if (typeof AudioContext === 'function') return AudioContext;
  if (typeof webkitAudioContext === 'function') return webkitAudioContext;
  return null;
}

function getSpeechAPI() {
  const win = getWindowRef();
  if (!win) return { synth: null, Utterance: null };
  const synth = win.speechSynthesis || (typeof speechSynthesis !== 'undefined' ? speechSynthesis : null);
  const Utterance =
    win.SpeechSynthesisUtterance ||
    (typeof SpeechSynthesisUtterance !== 'undefined' ? SpeechSynthesisUtterance : null);
  if (!synth || typeof synth.speak !== 'function' || typeof Utterance !== 'function') {
    return { synth: null, Utterance: null };
  }
  return { synth, Utterance };
}

function clampFreq(hz) {
  const n = Number(hz);
  if (!Number.isFinite(n)) return 440;
  return Math.max(24, Math.min(18000, n));
}

function clampGain(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return 0.0001;
  return Math.max(0.0001, Math.min(1, n));
}

function createNoiseBuffers(ctx) {
  const sampleRate = ctx.sampleRate || 44100;
  const length = Math.max(1024, Math.floor(sampleRate * 1.5));

  const whiteBuf = ctx.createBuffer(1, length, sampleRate);
  const whiteData = whiteBuf.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    whiteData[i] = Math.random() * 2 - 1;
  }

  // Paul Kellet's warm pink noise filter
  const pinkBuf = ctx.createBuffer(1, length, sampleRate);
  const pinkData = pinkBuf.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < length; i += 1) {
    const white = whiteData[i];
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    const sample = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
    pinkData[i] = Math.max(-1, Math.min(1, sample));
  }

  whiteNoiseBuffer = whiteBuf;
  pinkNoiseBuffer = pinkBuf;
}

function createWarmBrassWave(ctx) {
  if (typeof ctx.createPeriodicWave !== 'function') return null;
  // Soft rounded horn harmonics: warm body with gentle high-partial rolloff (no buzzer edge)
  const real = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0]);
  const imag = new Float32Array([0, 1.0, 0.56, 0.34, 0.19, 0.10, 0.045, 0.02]);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

function ensureAudioGraph() {
  if (audioCtx && audioCtx.state !== 'closed') {
    return audioCtx;
  }

  const Ctor = getAudioContextCtor();
  if (!Ctor) return null;

  try {
    const ctx = new Ctor();
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-16, ctx.currentTime);
    compressor.knee.setValueAtTime(18, ctx.currentTime);
    compressor.ratio.setValueAtTime(4, ctx.currentTime);
    compressor.attack.setValueAtTime(0.004, ctx.currentTime);
    compressor.release.setValueAtTime(0.18, ctx.currentTime);

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.8, ctx.currentTime);

    const sfx = ctx.createGain();
    sfx.gain.setValueAtTime(0.92, ctx.currentTime);

    const ambFilter = ctx.createBiquadFilter();
    ambFilter.type = 'lowpass';
    ambFilter.frequency.setValueAtTime(2400, ctx.currentTime);
    ambFilter.Q.setValueAtTime(0.6, ctx.currentTime);

    const amb = ctx.createGain();
    amb.gain.setValueAtTime(settings.ambient ? 0.22 : 0.0001, ctx.currentTime);

    sfx.connect(compressor);
    amb.connect(ambFilter);
    ambFilter.connect(compressor);
    compressor.connect(master);
    master.connect(ctx.destination);

    audioCtx = ctx;
    masterCompressor = compressor;
    masterGain = master;
    sfxBus = sfx;
    ambientFilter = ambFilter;
    ambientBus = amb;

    createNoiseBuffers(ctx);
    warmBrassWave = createWarmBrassWave(ctx);
    return ctx;
  } catch {
    audioCtx = null;
    masterCompressor = null;
    masterGain = null;
    sfxBus = null;
    ambientFilter = null;
    ambientBus = null;
    return null;
  }
}

function getActiveSfxContext() {
  if (!settings.sfx) return null;
  const ctx = ensureAudioGraph();
  if (!ctx) return null;
  if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function playTone(ctx, dest, opts) {
  const {
    freq = 440,
    endFreq = null,
    type = 'sine',
    periodicWave = null,
    gain = 0.15,
    startTime = ctx.currentTime,
    attack = 0.008,
    decay = 0.18,
    filterFreq = null,
    filterEndFreq = null,
    filterQ = 1.0,
    detune = 0
  } = opts;

  const t0 = Math.max(ctx.currentTime, startTime);
  const atk = Math.max(0.003, attack);
  const dur = Math.max(0.02, decay);
  const peak = clampGain(gain);

  const osc = ctx.createOscillator();
  if (periodicWave && typeof osc.setPeriodicWave === 'function') {
    osc.setPeriodicWave(periodicWave);
  } else {
    osc.type = type === 'square' || type === 'sawtooth' ? 'triangle' : type;
  }

  osc.frequency.setValueAtTime(clampFreq(freq), t0);
  if (endFreq !== null && endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(clampFreq(endFreq), t0 + dur);
  }
  if (detune && osc.detune) {
    osc.detune.setValueAtTime(detune, t0);
  }

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.linearRampToValueAtTime(peak, t0 + atk);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + atk + dur);

  if (filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(Math.max(0.2, filterQ), t0);
    filter.frequency.setValueAtTime(clampFreq(filterFreq), t0);
    if (filterEndFreq) {
      filter.frequency.exponentialRampToValueAtTime(clampFreq(filterEndFreq), t0 + dur);
    }
    osc.connect(filter);
    filter.connect(env);
  } else {
    osc.connect(env);
  }

  env.connect(dest);
  osc.start(t0);
  osc.stop(t0 + atk + dur + 0.025);
}

function playMarimbaNote(ctx, dest, freq, startTime, { decay = 0.14, gain = 0.16, harmonicGain = 0.24, endFreq = null } = {}) {
  const base = clampFreq(freq);
  // Fundamental wooden sine resonance
  playTone(ctx, dest, {
    freq: base,
    endFreq,
    type: 'sine',
    gain,
    startTime,
    attack: 0.004,
    decay
  });
  // Brief octave harmonic ping (classic kalimba / marimba bar shimmer)
  playTone(ctx, dest, {
    freq: clampFreq(base * 2),
    endFreq: endFreq ? clampFreq(endFreq * 2) : null,
    type: 'sine',
    gain: gain * harmonicGain,
    startTime,
    attack: 0.003,
    decay: Math.max(0.025, decay * 0.42)
  });
  // Soft rounded mallet transient
  playTone(ctx, dest, {
    freq: clampFreq(base * 3.1),
    type: 'triangle',
    gain: gain * 0.1,
    startTime,
    attack: 0.002,
    decay: 0.018
  });
}

function playBellVoice(ctx, dest, freq, startTime, { decay = 0.45, gain = 0.12 } = {}) {
  const base = clampFreq(freq);
  playTone(ctx, dest, { freq: base, type: 'sine', gain, startTime, attack: 0.006, decay, detune: -4 });
  playTone(ctx, dest, { freq: base, type: 'sine', gain: gain * 0.72, startTime, attack: 0.006, decay, detune: 4 });
  playTone(ctx, dest, { freq: base * 2, type: 'sine', gain: gain * 0.28, startTime, attack: 0.004, decay: decay * 0.65 });
  playTone(ctx, dest, { freq: base * 3, type: 'sine', gain: gain * 0.08, startTime, attack: 0.004, decay: decay * 0.35 });
}

function playBrassVoice(ctx, dest, freq, startTime, { sustain = 0.36, gain = 0.13 } = {}) {
  const base = clampFreq(freq);
  const t0 = Math.max(ctx.currentTime, startTime);
  const atk = 0.032;
  const total = Math.max(0.12, sustain);

  const osc = ctx.createOscillator();
  if (warmBrassWave && typeof osc.setPeriodicWave === 'function') {
    osc.setPeriodicWave(warmBrassWave);
  } else {
    osc.type = 'triangle';
  }
  osc.frequency.setValueAtTime(base, t0);

  const sub = ctx.createOscillator();
  sub.type = 'triangle';
  sub.frequency.setValueAtTime(base, t0);
  if (sub.detune) sub.detune.setValueAtTime(-5, t0);

  const peakAt = t0 + Math.min(total * 0.52, atk + 0.05);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.setValueAtTime(0.85, t0);
  filter.frequency.setValueAtTime(clampFreq(base * 1.4), t0);
  filter.frequency.exponentialRampToValueAtTime(clampFreq(base * 4.0), peakAt);
  filter.frequency.exponentialRampToValueAtTime(clampFreq(base * 2.1), t0 + total);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.linearRampToValueAtTime(clampGain(gain), t0 + atk);
  env.gain.setValueAtTime(clampGain(gain * 0.85), t0 + total * 0.62);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + total);

  osc.connect(filter);
  sub.connect(filter);
  filter.connect(env);
  env.connect(dest);

  osc.start(t0);
  sub.start(t0);
  osc.stop(t0 + total + 0.03);
  sub.stop(t0 + total + 0.03);
}

function playNoiseBurst(ctx, dest, opts) {
  const {
    startTime = ctx.currentTime,
    duration = 0.2,
    filterType = 'bandpass',
    startFreq = 800,
    endFreq = 1600,
    q = 1.4,
    gain = 0.12,
    attack = 0.015,
    pink = true
  } = opts;

  const buf = pink ? pinkNoiseBuffer : whiteNoiseBuffer;
  if (!buf) return;

  const t0 = Math.max(ctx.currentTime, startTime);
  const dur = Math.max(0.025, duration);
  const atk = Math.min(dur * 0.5, Math.max(0.004, attack));

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.Q.setValueAtTime(Math.max(0.3, q), t0);
  filter.frequency.setValueAtTime(clampFreq(startFreq), t0);
  filter.frequency.exponentialRampToValueAtTime(clampFreq(endFreq), t0 + dur);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.linearRampToValueAtTime(clampGain(gain), t0 + atk);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  src.connect(filter);
  filter.connect(env);
  env.connect(dest);

  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

function playFMSpark(ctx, dest, carrierFreq, modFreq, modDepth, startTime, duration, gain) {
  const t0 = Math.max(ctx.currentTime, startTime);
  const dur = Math.max(0.04, duration);

  const carrier = ctx.createOscillator();
  carrier.type = 'sine';
  carrier.frequency.setValueAtTime(clampFreq(carrierFreq), t0);

  const mod = ctx.createOscillator();
  mod.type = 'sine';
  mod.frequency.setValueAtTime(clampFreq(modFreq), t0);

  const modGain = ctx.createGain();
  modGain.gain.setValueAtTime(Math.max(1, modDepth), t0);
  modGain.gain.exponentialRampToValueAtTime(1, t0 + dur);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.linearRampToValueAtTime(clampGain(gain), t0 + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  mod.connect(modGain);
  modGain.connect(carrier.frequency);
  carrier.connect(env);
  env.connect(dest);

  mod.start(t0);
  carrier.start(t0);
  mod.stop(t0 + dur + 0.02);
  carrier.stop(t0 + dur + 0.02);
}

const ATTACK_SYNTHS = {
  fire(ctx, dest, t, scale) {
    playNoiseBurst(ctx, dest, {
      startTime: t,
      duration: 0.34 * scale.dur,
      filterType: 'bandpass',
      startFreq: 380,
      endFreq: 1650,
      q: 1.1,
      gain: 0.2 * scale.gain
    });
    playTone(ctx, dest, {
      freq: 170,
      endFreq: 68,
      type: 'triangle',
      gain: 0.2 * scale.gain,
      startTime: t,
      decay: 0.22 * scale.dur
    });
    const pops = [0.05, 0.12, 0.19];
    pops.forEach((offset, idx) => {
      playTone(ctx, dest, {
        freq: 1700 + idx * 420,
        endFreq: 950,
        type: 'sine',
        gain: 0.08 * scale.gain,
        startTime: t + offset,
        attack: 0.003,
        decay: 0.055
      });
    });
  },

  water(ctx, dest, t, scale) {
    playNoiseBurst(ctx, dest, {
      startTime: t,
      duration: 0.32 * scale.dur,
      filterType: 'bandpass',
      startFreq: 1100,
      endFreq: 420,
      q: 1.5,
      gain: 0.18 * scale.gain
    });
    const bubbles = [
      [480, 920, 0.02],
      [620, 1180, 0.08],
      [760, 1420, 0.15],
      [920, 1680, 0.22]
    ];
    bubbles.forEach(([f1, f2, offset]) => {
      playTone(ctx, dest, {
        freq: f1,
        endFreq: f2,
        type: 'sine',
        gain: 0.11 * scale.gain,
        startTime: t + offset,
        attack: 0.005,
        decay: 0.075 * scale.dur
      });
    });
  },

  grass(ctx, dest, t, scale) {
    playNoiseBurst(ctx, dest, {
      startTime: t,
      duration: 0.26 * scale.dur,
      filterType: 'bandpass',
      startFreq: 1400,
      endFreq: 2600,
      q: 1.2,
      gain: 0.13 * scale.gain
    });
    [587.33, 783.99, 1046.50].forEach((freq, i) => {
      playMarimbaNote(ctx, dest, freq, t + i * 0.065, {
        decay: 0.16 * scale.dur,
        gain: 0.15 * scale.gain
      });
    });
  },

  electric(ctx, dest, t, scale) {
    playFMSpark(ctx, dest, 920, 210, 420, t, 0.16 * scale.dur, 0.15 * scale.gain);
    playFMSpark(ctx, dest, 1280, 310, 520, t + 0.08, 0.18 * scale.dur, 0.14 * scale.gain);
    playTone(ctx, dest, {
      freq: 640,
      endFreq: 1920,
      type: 'triangle',
      gain: 0.11 * scale.gain,
      startTime: t,
      attack: 0.004,
      decay: 0.12 * scale.dur,
      filterFreq: 3200
    });
    playNoiseBurst(ctx, dest, {
      startTime: t + 0.02,
      duration: 0.14 * scale.dur,
      filterType: 'highpass',
      startFreq: 2800,
      endFreq: 4800,
      q: 1.0,
      gain: 0.09 * scale.gain,
      pink: false
    });
  },

  psychic(ctx, dest, t, scale) {
    [523.25, 783.99, 1174.66, 1567.98].forEach((freq, i) => {
      playTone(ctx, dest, {
        freq,
        endFreq: freq * 1.06,
        type: 'sine',
        gain: 0.1 * scale.gain,
        startTime: t + i * 0.055,
        attack: 0.02,
        decay: 0.28 * scale.dur,
        detune: i % 2 === 0 ? -7 : 7
      });
    });
    playBellVoice(ctx, dest, 1046.50, t + 0.08, {
      decay: 0.42 * scale.dur,
      gain: 0.09 * scale.gain
    });
  },

  fairy(ctx, dest, t, scale) {
    [880.00, 1046.50, 1318.51, 1567.98, 2093.00].forEach((freq, i) => {
      playBellVoice(ctx, dest, freq, t + i * 0.05, {
        decay: 0.34 * scale.dur,
        gain: 0.085 * scale.gain
      });
    });
    playNoiseBurst(ctx, dest, {
      startTime: t,
      duration: 0.28 * scale.dur,
      filterType: 'highpass',
      startFreq: 2400,
      endFreq: 4200,
      q: 0.8,
      gain: 0.06 * scale.gain
    });
  },

  rock(ctx, dest, t, scale) {
    [0, 0.09, 0.17].forEach((offset, i) => {
      playTone(ctx, dest, {
        freq: 140 - i * 18,
        endFreq: 46,
        type: 'triangle',
        gain: (0.24 - i * 0.04) * scale.gain,
        startTime: t + offset,
        attack: 0.004,
        decay: 0.16 * scale.dur
      });
    });
    playNoiseBurst(ctx, dest, {
      startTime: t,
      duration: 0.28 * scale.dur,
      filterType: 'lowpass',
      startFreq: 1100,
      endFreq: 220,
      q: 1.2,
      gain: 0.2 * scale.gain
    });
  },

  ground(ctx, dest, t, scale) {
    playTone(ctx, dest, {
      freq: 98,
      endFreq: 40,
      type: 'sine',
      gain: 0.28 * scale.gain,
      startTime: t,
      attack: 0.012,
      decay: 0.38 * scale.dur
    });
    playTone(ctx, dest, {
      freq: 124,
      endFreq: 52,
      type: 'triangle',
      gain: 0.16 * scale.gain,
      startTime: t + 0.04,
      attack: 0.01,
      decay: 0.32 * scale.dur,
      filterFreq: 300
    });
    playNoiseBurst(ctx, dest, {
      startTime: t,
      duration: 0.36 * scale.dur,
      filterType: 'lowpass',
      startFreq: 420,
      endFreq: 110,
      q: 0.9,
      gain: 0.22 * scale.gain
    });
  },

  dragon(ctx, dest, t, scale) {
    playBrassVoice(ctx, dest, 146.83, t, { sustain: 0.36 * scale.dur, gain: 0.16 * scale.gain });
    playBrassVoice(ctx, dest, 220.00, t + 0.06, { sustain: 0.34 * scale.dur, gain: 0.13 * scale.gain });
    playNoiseBurst(ctx, dest, {
      startTime: t,
      duration: 0.35 * scale.dur,
      filterType: 'bandpass',
      startFreq: 550,
      endFreq: 1700,
      q: 1.1,
      gain: 0.15 * scale.gain
    });
  },

  ghost(ctx, dest, t, scale) {
    playTone(ctx, dest, {
      freq: 659.25,
      endFreq: 440.00,
      type: 'sine',
      gain: 0.14 * scale.gain,
      startTime: t,
      attack: 0.025,
      decay: 0.36 * scale.dur
    });
    playTone(ctx, dest, {
      freq: 523.25,
      endFreq: 698.46,
      type: 'sine',
      gain: 0.11 * scale.gain,
      startTime: t + 0.09,
      attack: 0.02,
      decay: 0.32 * scale.dur,
      detune: -9
    });
    playBellVoice(ctx, dest, 783.99, t + 0.12, { decay: 0.38 * scale.dur, gain: 0.08 * scale.gain });
  },

  ice(ctx, dest, t, scale) {
    [1567.98, 2093.00, 2637.02, 3135.96].forEach((freq, i) => {
      playTone(ctx, dest, {
        freq,
        type: 'sine',
        gain: 0.09 * scale.gain,
        startTime: t + i * 0.04,
        attack: 0.003,
        decay: 0.24 * scale.dur
      });
    });
    playNoiseBurst(ctx, dest, {
      startTime: t,
      duration: 0.22 * scale.dur,
      filterType: 'highpass',
      startFreq: 3200,
      endFreq: 6200,
      q: 1.5,
      gain: 0.08 * scale.gain,
      pink: false
    });
  },

  fighting(ctx, dest, t, scale) {
    playNoiseBurst(ctx, dest, {
      startTime: t,
      duration: 0.14 * scale.dur,
      filterType: 'bandpass',
      startFreq: 600,
      endFreq: 2200,
      q: 1.3,
      gain: 0.16 * scale.gain
    });
    playTone(ctx, dest, {
      freq: 210,
      endFreq: 58,
      type: 'sine',
      gain: 0.26 * scale.gain,
      startTime: t + 0.055,
      attack: 0.003,
      decay: 0.14 * scale.dur
    });
    playTone(ctx, dest, {
      freq: 460,
      endFreq: 140,
      type: 'triangle',
      gain: 0.15 * scale.gain,
      startTime: t + 0.055,
      attack: 0.003,
      decay: 0.09 * scale.dur
    });
  },

  steel(ctx, dest, t, scale) {
    const f0 = 587.33;
    playFMSpark(ctx, dest, f0, f0 * 1.414, 340, t, 0.38 * scale.dur, 0.15 * scale.gain);
    playTone(ctx, dest, {
      freq: f0 * 2.756,
      type: 'sine',
      gain: 0.08 * scale.gain,
      startTime: t,
      attack: 0.003,
      decay: 0.28 * scale.dur
    });
    playNoiseBurst(ctx, dest, {
      startTime: t,
      duration: 0.12 * scale.dur,
      filterType: 'bandpass',
      startFreq: 3400,
      endFreq: 1600,
      q: 2.2,
      gain: 0.09 * scale.gain
    });
  },

  normal(ctx, dest, t, scale) {
    playNoiseBurst(ctx, dest, {
      startTime: t,
      duration: 0.15 * scale.dur,
      filterType: 'bandpass',
      startFreq: 700,
      endFreq: 1500,
      q: 1.2,
      gain: 0.12 * scale.gain
    });
    playTone(ctx, dest, {
      freq: 270,
      endFreq: 95,
      type: 'triangle',
      gain: 0.2 * scale.gain,
      startTime: t + 0.03,
      attack: 0.004,
      decay: 0.13 * scale.dur
    });
    playMarimbaNote(ctx, dest, 523.25, t + 0.04, {
      endFreq: 659.25,
      decay: 0.12 * scale.dur,
      gain: 0.13 * scale.gain
    });
  },

  poison(ctx, dest, t, scale) {
    [420, 560, 710].forEach((freq, i) => {
      playTone(ctx, dest, {
        freq,
        endFreq: freq * 1.35,
        type: 'sine',
        gain: 0.11 * scale.gain,
        startTime: t + i * 0.06,
        attack: 0.005,
        decay: 0.09 * scale.dur
      });
    });
    playNoiseBurst(ctx, dest, {
      startTime: t,
      duration: 0.24 * scale.dur,
      filterType: 'bandpass',
      startFreq: 650,
      endFreq: 1350,
      q: 2.2,
      gain: 0.1 * scale.gain
    });
  },

  flying(ctx, dest, t, scale) {
    playNoiseBurst(ctx, dest, {
      startTime: t,
      duration: 0.28 * scale.dur,
      filterType: 'bandpass',
      startFreq: 520,
      endFreq: 2300,
      q: 1.1,
      gain: 0.16 * scale.gain
    });
    playTone(ctx, dest, {
      freq: 659.25,
      endFreq: 1174.66,
      type: 'sine',
      gain: 0.11 * scale.gain,
      startTime: t + 0.03,
      attack: 0.015,
      decay: 0.22 * scale.dur
    });
  },

  bug(ctx, dest, t, scale) {
    [880, 1046.5, 1174.66, 987.77].forEach((freq, i) => {
      playMarimbaNote(ctx, dest, freq, t + i * 0.045, {
        decay: 0.09 * scale.dur,
        gain: 0.11 * scale.gain
      });
    });
  },

  dark(ctx, dest, t, scale) {
    playTone(ctx, dest, {
      freq: 196,
      endFreq: 110,
      type: 'triangle',
      gain: 0.2 * scale.gain,
      startTime: t,
      attack: 0.012,
      decay: 0.32 * scale.dur,
      filterFreq: 520
    });
    playBellVoice(ctx, dest, 440, t + 0.06, { decay: 0.35 * scale.dur, gain: 0.09 * scale.gain });
    playBellVoice(ctx, dest, 622.25, t + 0.1, { decay: 0.35 * scale.dur, gain: 0.075 * scale.gain });
  }
};

function stopAmbientTimer() {
  if (ambientTimerId !== null) {
    clearInterval(ambientTimerId);
    ambientTimerId = null;
  }
  ambientOpened = false;
}

function getDocumentRef() {
  if (typeof document === 'undefined' || !document) return null;
  return document;
}

function isDocumentHidden() {
  const doc = getDocumentRef();
  return Boolean(doc && (doc.visibilityState === 'hidden' || doc.hidden === true));
}

function fadeAmbientOut(timeConstant) {
  if (audioCtx && ambientBus && audioCtx.state !== 'closed') {
    const now = audioCtx.currentTime;
    ambientBus.gain.cancelScheduledValues(now);
    ambientBus.gain.setTargetAtTime(0.0001, now, timeConstant);
  }
}

function handleVisibilityChange() {
  if (isDocumentHidden()) {
    if (settings.ambient) {
      ambientHiddenPause = true;
      stopAmbientTimer();
      fadeAmbientOut(0.12);
    }
    return;
  }
  if (ambientHiddenPause) {
    ambientHiddenPause = false;
    if (settings.ambient) startAmbientLoop();
  }
}

function installVisibilityListener() {
  if (visibilityHooked) return;
  const doc = getDocumentRef();
  if (!doc || typeof doc.addEventListener !== 'function') return;
  try {
    doc.addEventListener('visibilitychange', handleVisibilityChange);
    visibilityHooked = true;
  } catch {
    // Ignore environments without a usable document event target
  }
}
function scheduleAmbientTick() {
  if (!settings.ambient || !audioCtx || audioCtx.state !== 'running' || !ambientBus) {
    return;
  }

  const step = AMBIENT_PATTERN[ambientStepIndex % AMBIENT_PATTERN.length];
  ambientStepIndex = (ambientStepIndex + 1) % AMBIENT_PATTERN.length;

  const t = audioCtx.currentTime + 0.035;
  if (step.bass) {
    playTone(audioCtx, ambientBus, {
      freq: step.bass,
      type: 'sine',
      gain: 0.11,
      startTime: t,
      attack: 0.025,
      decay: 1.15
    });
  }
  if (step.note) {
    playMarimbaNote(audioCtx, ambientBus, step.note, t, {
      decay: 0.62,
      gain: step.vel || 0.08,
      harmonicGain: 0.14
    });
  }
}

/**
 * Strictly idempotent: repeated calls never create a second interval or a
 * second opening note. Defers while the page is hidden (resumed on visible).
 */
function startAmbientLoop() {
  if (!settings.ambient) return;
  installVisibilityListener();
  if (isDocumentHidden()) {
    ambientHiddenPause = true;
    return;
  }

  const ctx = ensureAudioGraph();
  if (!ctx || !ambientBus) return;
  ambientHiddenPause = false;

  if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
    ctx.resume().then(() => {
      if (settings.ambient && !isDocumentHidden()) startAmbientLoop();
    }).catch(() => {});
  }

  const now = ctx.currentTime;
  ambientBus.gain.cancelScheduledValues(now);
  ambientBus.gain.setTargetAtTime(0.22, now, 0.18);

  if (ambientTimerId === null) {
    ambientTimerId = setInterval(scheduleAmbientTick, AMBIENT_STEP_MS);
  }
  if (!ambientOpened && ctx.state === 'running') {
    ambientOpened = true;
    scheduleAmbientTick();
  }
}
function pickFriendlyVoice(synth) {
  let voices = [];
  try {
    voices = typeof synth.getVoices === 'function' ? synth.getVoices() : [];
  } catch {
    return null;
  }
  if (!Array.isArray(voices) || voices.length === 0) return null;

  const englishVoices = voices.filter((v) => typeof v?.lang === 'string' && v.lang.toLowerCase().startsWith('en'));
  const pool = englishVoices.length > 0 ? englishVoices : voices;

  let bestVoice = pool[0];
  let bestScore = -100;

  for (const voice of pool) {
    const name = String(voice?.name || '');
    const lang = String(voice?.lang || '');
    let score = 0;

    if (/^en[-_]us$/i.test(lang)) score += 12;
    else if (/^en[-_](gb|au|ca)$/i.test(lang)) score += 8;
    else if (/^en/i.test(lang)) score += 4;

    if (voice?.localService) score += 2;
    if (voice?.default) score += 2;

    for (let i = 0; i < PREFERRED_VOICE_PATTERNS.length; i += 1) {
      if (PREFERRED_VOICE_PATTERNS[i].test(name)) {
        score += 25 - i;
        break;
      }
    }
    for (const bad of AVOID_VOICE_PATTERNS) {
      if (bad.test(name)) {
        score -= 40;
        break;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  }

  return bestVoice || null;
}

/**
 * Initializes and unlocks the Web Audio graph on user interaction.
 * @returns {boolean} True if an AudioContext is initialized.
 */
export function unlockAudio() {
  const ctx = ensureAudioGraph();
  if (!ctx) return false;

  if (!unlockedOnce && sfxBus) {
    unlockedOnce = true;
    try {
      playTone(ctx, sfxBus, { freq: 440, type: 'sine', gain: 0.0001, startTime: ctx.currentTime, decay: 0.02 });
    } catch {
      // Ignore silent unlock pulse failure on non-standard contexts
    }
  }

  if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
    ctx.resume().then(() => {
      if (settings.ambient) startAmbientLoop();
    }).catch(() => {});
  } else if (settings.ambient) {
    startAmbientLoop();
  }

  const { synth } = getSpeechAPI();
  if (synth && typeof synth.getVoices === 'function') {
    try {
      synth.getVoices();
    } catch {
      // Ignore lazy voice preload errors
    }
  }

  return true;
}

/**
 * Updates audio preference flags (`sfx`, `ambient`, `speech`).
 * @param {{ sfx?: boolean, ambient?: boolean, speech?: boolean }} [config]
 */
export function setAudioSettings(config = {}) {
  if (!config || typeof config !== 'object') return;

  if (typeof config.sfx === 'boolean') {
    settings.sfx = config.sfx;
  }

  if (typeof config.speech === 'boolean') {
    const wasSpeaking = settings.speech;
    settings.speech = config.speech;
    if (wasSpeaking && !settings.speech) {
      const { synth } = getSpeechAPI();
      if (synth && typeof synth.cancel === 'function') {
        try {
          synth.cancel();
        } catch {
          // Ignore speech cancellation errors
        }
      }
    }
  }

  if (typeof config.ambient === 'boolean') {
    toggleAmbientMusic(config.ambient);
  }
}

/**
 * Plays a warm wooden marimba/kalimba UI click for tactile feedback.
 * @param {string} [variant='tap']
 */
export function playClick(variant = 'tap') {
  const ctx = getActiveSfxContext();
  if (!ctx || !sfxBus) return;

  const key = typeof variant === 'string' ? variant.trim().toLowerCase() : 'tap';
  const notes = CLICK_VARIANTS[key] || CLICK_VARIANTS.tap;
  const now = ctx.currentTime;

  for (const note of notes) {
    if (note.bell) {
      playBellVoice(ctx, sfxBus, note.freq, now + (note.delay || 0), {
        decay: note.decay,
        gain: note.gain
      });
      continue;
    }
    playMarimbaNote(ctx, sfxBus, note.freq, now + (note.delay || 0), {
      endFreq: note.endFreq || null,
      decay: note.decay,
      gain: note.gain,
      harmonicGain: note.harmonicGain
    });
  }
}

/**
 * Plays an ascending major-pentatonic celebration chime scaling with `streakCount` (1..8).
 * @param {number} [streakCount=1]
 */
export function playCorrectChime(streakCount = 1) {
  const ctx = getActiveSfxContext();
  if (!ctx || !sfxBus) return;

  const clamped = Math.max(1, Math.min(8, Math.round(Number(streakCount) || 1)));
  const baseIdx = clamped - 1;
  const now = ctx.currentTime;

  const f1 = PENTATONIC_SCALE[baseIdx];
  const f2 = PENTATONIC_SCALE[Math.min(PENTATONIC_SCALE.length - 1, baseIdx + 2)];
  const f3 = PENTATONIC_SCALE[Math.min(PENTATONIC_SCALE.length - 1, baseIdx + 4)];

  playMarimbaNote(ctx, sfxBus, f1, now, { decay: 0.16, gain: 0.15, harmonicGain: 0.25 });
  playMarimbaNote(ctx, sfxBus, f2, now + 0.065, { decay: 0.18, gain: 0.16, harmonicGain: 0.28 });
  playBellVoice(ctx, sfxBus, f3, now + 0.13, { decay: 0.34, gain: 0.13 });

  if (clamped >= 4) {
    const sparkle = PENTATONIC_SCALE[Math.min(PENTATONIC_SCALE.length - 1, baseIdx + 5)];
    playBellVoice(ctx, sfxBus, sparkle, now + 0.2, { decay: 0.36, gain: 0.09 });
  }
}

/**
 * Plays a gentle, non-punitive damped low woodblock double-tap on a missed answer.
 */
export function playGentleNudge() {
  const ctx = getActiveSfxContext();
  if (!ctx || !sfxBus) return;

  const now = ctx.currentTime;
  // First soft wooden knock
  playTone(ctx, sfxBus, {
    freq: 196.00,
    endFreq: 180.00,
    type: 'sine',
    gain: 0.18,
    startTime: now,
    attack: 0.005,
    decay: 0.075
  });
  playTone(ctx, sfxBus, {
    freq: 392.00,
    endFreq: 350.00,
    type: 'triangle',
    gain: 0.05,
    startTime: now,
    attack: 0.003,
    decay: 0.03,
    filterFreq: 750
  });

  // Second lower warm response knock
  playTone(ctx, sfxBus, {
    freq: 164.81,
    endFreq: 150.00,
    type: 'sine',
    gain: 0.17,
    startTime: now + 0.115,
    attack: 0.005,
    decay: 0.09
  });
  playTone(ctx, sfxBus, {
    freq: 329.63,
    endFreq: 295.00,
    type: 'triangle',
    gain: 0.045,
    startTime: now + 0.115,
    attack: 0.003,
    decay: 0.032,
    filterFreq: 680
  });
}

/**
 * Plays distinct procedural elemental synthesis for Pokémon attacks.
 * @param {string} [pokemonType='normal']
 * @param {string} [movePower='power'] - 'quick' | 'power' | 'charge'
 */
export function playAttackSFX(pokemonType = 'normal', movePower = 'power') {
  const ctx = getActiveSfxContext();
  if (!ctx || !sfxBus) return;

  const rawType = typeof pokemonType === 'string' ? pokemonType.trim().toLowerCase() : 'normal';
  const synthFn = ATTACK_SYNTHS[rawType] || ATTACK_SYNTHS.normal;

  const powerKey = typeof movePower === 'string' ? movePower.trim().toLowerCase() : 'power';
  const scale =
    powerKey === 'quick'
      ? { dur: 0.78, gain: 0.85 }
      : powerKey === 'charge'
        ? { dur: 1.25, gain: 1.12 }
        : { dur: 1.0, gain: 1.0 };

  const now = ctx.currentTime;
  synthFn(ctx, sfxBus, now, scale);

  if (powerKey === 'charge') {
    playBellVoice(ctx, sfxBus, 1046.50, now + 0.04, { decay: 0.28, gain: 0.07 });
  }
}

/**
 * Plays the rising whistle-whoosh and latch click for a Poké Ball throw.
 */
export function playPokeballThrow() {
  const ctx = getActiveSfxContext();
  if (!ctx || !sfxBus) return;

  const now = ctx.currentTime;
  playNoiseBurst(ctx, sfxBus, {
    startTime: now,
    duration: 0.26,
    filterType: 'bandpass',
    startFreq: 380,
    endFreq: 1950,
    q: 1.3,
    gain: 0.15
  });
  playTone(ctx, sfxBus, {
    freq: 440,
    endFreq: 987.77,
    type: 'sine',
    gain: 0.13,
    startTime: now,
    attack: 0.015,
    decay: 0.21
  });
  playMarimbaNote(ctx, sfxBus, 1174.66, now + 0.23, {
    decay: 0.075,
    gain: 0.13,
    harmonicGain: 0.3
  });
}

/**
 * Plays a pitched suspense wobble for Poké Ball shake steps (`stepIndex` 0..2).
 * @param {number} [stepIndex=0]
 */
export function playPokeballWobble(stepIndex = 0) {
  const ctx = getActiveSfxContext();
  if (!ctx || !sfxBus) return;

  const idx = Math.max(0, Math.min(3, Math.round(Number(stepIndex) || 0)));
  const wobblePitches = [329.63, 392.00, 466.16, 523.25]; // E4, G4, Bb4, C5
  const baseFreq = wobblePitches[idx];
  const now = ctx.currentTime;

  playTone(ctx, sfxBus, {
    freq: baseFreq,
    endFreq: baseFreq * 1.18,
    type: 'triangle',
    gain: 0.15,
    startTime: now,
    attack: 0.008,
    decay: 0.08,
    filterFreq: 1400
  });
  playTone(ctx, sfxBus, {
    freq: baseFreq * 1.14,
    endFreq: baseFreq * 0.94,
    type: 'sine',
    gain: 0.14,
    startTime: now + 0.085,
    attack: 0.006,
    decay: 0.095
  });
  playNoiseBurst(ctx, sfxBus, {
    startTime: now + 0.01,
    duration: 0.055,
    filterType: 'bandpass',
    startFreq: 1300 + idx * 180,
    endFreq: 900,
    q: 2.0,
    gain: 0.06
  });
}

/**
 * Plays a sparkling 4-voice brass, bass, bell, and celesta catch fanfare.
 */
export function playCatchFanfare() {
  const ctx = getActiveSfxContext();
  if (!ctx || !sfxBus) return;

  const now = ctx.currentTime;
  // Crisp Poké Ball lock sparkle
  playTone(ctx, sfxBus, { freq: 240, endFreq: 140, type: 'sine', gain: 0.16, startTime: now, decay: 0.08 });
  playBellVoice(ctx, sfxBus, 1567.98, now + 0.02, { decay: 0.22, gain: 0.11 });

  // 4-voice celebratory motif
  const pickup = [
    [392.00, 0.14, 0.14], // G4
    [523.25, 0.26, 0.14], // C5
    [659.25, 0.38, 0.14]  // E5
  ];
  for (const [freq, offset, sustain] of pickup) {
    playBrassVoice(ctx, sfxBus, freq, now + offset, { sustain, gain: 0.11 });
    playBellVoice(ctx, sfxBus, freq * 2, now + offset, { decay: 0.22, gain: 0.07 });
  }

  // Final 4-voice C major chord
  const chordAt = now + 0.52;
  playTone(ctx, sfxBus, { freq: 130.81, type: 'triangle', gain: 0.18, startTime: chordAt, attack: 0.02, decay: 0.85, filterFreq: 600 }); // Voice 1: Bass C3
  playBrassVoice(ctx, sfxBus, 523.25, chordAt, { sustain: 0.78, gain: 0.12 }); // Voice 2: Brass C5
  playBrassVoice(ctx, sfxBus, 659.25, chordAt, { sustain: 0.78, gain: 0.10 }); // Voice 3: Brass E5
  playBellVoice(ctx, sfxBus, 783.99, chordAt, { decay: 0.82, gain: 0.10 }); // Voice 4: Bell G5
  playBellVoice(ctx, sfxBus, 1046.50, chordAt + 0.08, { decay: 0.78, gain: 0.09 });
  playBellVoice(ctx, sfxBus, 1567.98, chordAt + 0.16, { decay: 0.72, gain: 0.07 });
}

/**
 * Plays a lush multi-phase harmonic brass & bell evolution symphony.
 */
export function playEvolutionSymphony() {
  const ctx = getActiveSfxContext();
  if (!ctx || !sfxBus) return;

  const now = ctx.currentTime;
  // Ascending metamorphosis shimmer cascade
  const cascade = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
  cascade.forEach((freq, i) => {
    playBellVoice(ctx, sfxBus, freq, now + i * 0.075, {
      decay: 0.42,
      gain: 0.085
    });
  });

  // Swelling warm Fmaj7 pre-chord
  playBrassVoice(ctx, sfxBus, 349.23, now + 0.08, { sustain: 0.56, gain: 0.10 });
  playBrassVoice(ctx, sfxBus, 440.00, now + 0.14, { sustain: 0.50, gain: 0.09 });

  // Grand Cmaj9 resolution chord
  const resolveAt = now + 0.66;
  playTone(ctx, sfxBus, { freq: 130.81, type: 'triangle', gain: 0.20, startTime: resolveAt, attack: 0.03, decay: 1.15, filterFreq: 680 });
  playBrassVoice(ctx, sfxBus, 392.00, resolveAt, { sustain: 1.05, gain: 0.11 });
  playBrassVoice(ctx, sfxBus, 523.25, resolveAt, { sustain: 1.05, gain: 0.12 });
  playBrassVoice(ctx, sfxBus, 659.25, resolveAt, { sustain: 1.05, gain: 0.10 });
  playBellVoice(ctx, sfxBus, 587.33, resolveAt + 0.04, { decay: 1.05, gain: 0.09 }); // 9th shimmer D5
  playBellVoice(ctx, sfxBus, 1046.50, resolveAt + 0.12, { decay: 0.98, gain: 0.09 });
  playBellVoice(ctx, sfxBus, 1567.98, resolveAt + 0.24, { decay: 0.90, gain: 0.075 });
  playBellVoice(ctx, sfxBus, 2093.00, resolveAt + 0.36, { decay: 0.85, gain: 0.065 });
}

/**
 * Plays a triumphant ceremonial brass & bell Gym Badge victory fanfare.
 */
export function playBadgeFanfare() {
  const ctx = getActiveSfxContext();
  if (!ctx || !sfxBus) return;

  const now = ctx.currentTime;

  // IV (F major) -> V (G major) -> I (C major) heroic badge anthem
  const steps = [
    { at: 0.0, root: 174.61, voices: [349.23, 440.00, 523.25], sustain: 0.22 },
    { at: 0.22, root: 196.00, voices: [392.00, 493.88, 587.33], sustain: 0.22 },
    { at: 0.44, root: 130.81, voices: [523.25, 659.25, 783.99], sustain: 0.96 }
  ];

  for (const step of steps) {
    const t = now + step.at;
    playTone(ctx, sfxBus, {
      freq: step.root,
      type: 'triangle',
      gain: 0.18,
      startTime: t,
      attack: 0.018,
      decay: step.sustain,
      filterFreq: 700
    });
    for (const v of step.voices) {
      playBrassVoice(ctx, sfxBus, v, t, { sustain: step.sustain, gain: 0.105 });
      playBellVoice(ctx, sfxBus, v * 2, t, { decay: step.sustain * 0.9, gain: 0.065 });
    }
  }

  // Crowning high badge sparkle
  playBellVoice(ctx, sfxBus, 1318.51, now + 0.56, { decay: 0.72, gain: 0.08 });
  playBellVoice(ctx, sfxBus, 1567.98, now + 0.66, { decay: 0.74, gain: 0.08 });
  playBellVoice(ctx, sfxBus, 2093.00, now + 0.78, { decay: 0.82, gain: 0.07 });
}

/**
 * Enables or cleanly stops the gentle kalimba daydream ambient loop.
 * @param {boolean} enabled
 * @returns {boolean} Current ambient enabled flag.
 */
export function toggleAmbientMusic(enabled) {
  settings.ambient = Boolean(enabled);

  if (settings.ambient) {
    startAmbientLoop();
    return true;
  }

  ambientHiddenPause = false;
  stopAmbientTimer();
  fadeAmbientOut(0.04);
  return false;
}

/**
 * Speaks text aloud via `window.speechSynthesis` using a friendly voice.
 * Cancels any prior utterance cleanly and no-ops safely when muted unless `force === true`.
 * @param {string} text
 * @param {boolean} [force=false]
 * @returns {boolean} True if utterance was dispatched to speechSynthesis.
 */
export function speakText(text, force = false) {
  if (!force && !settings.speech) return false;
  if (typeof text !== 'string') return false;

  const cleanText = text.replace(/\s+/g, ' ').trim();
  if (!cleanText) return false;

  const { synth, Utterance } = getSpeechAPI();
  if (!synth || !Utterance) return false;

  try {
    if (typeof synth.cancel === 'function') {
      synth.cancel();
    }
    const utterance = new Utterance(cleanText);
    const voice = pickFriendlyVoice(synth);
    if (voice) {
      utterance.voice = voice;
      if (voice.lang) utterance.lang = voice.lang;
    } else {
      utterance.lang = 'en-US';
    }
    utterance.rate = 0.96;
    utterance.pitch = 1.08;
    utterance.volume = 0.95;

    synth.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
