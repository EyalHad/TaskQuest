export type AmbiencePreset = "off" | "rain" | "campfire" | "dungeon" | "lofi";

let audioCtx: AudioContext | null = null;
let activeNodes: AudioNode[] = [];

function getCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function startAmbience(preset: AmbiencePreset) {
  stopAmbience();
  if (preset === "off") return;
  const ctx = getCtx();
  switch (preset) {
    case "rain": createRain(ctx); break;
    case "campfire": createCrackle(ctx); break;
    case "dungeon": createDrone(ctx); break;
    case "lofi": createLofi(ctx); break;
  }
}

export function stopAmbience() {
  for (const n of activeNodes) { try { n.disconnect(); } catch {} }
  activeNodes = [];
}

function brownNoise(ctx: AudioContext, freq: number, q: number, vol: number) {
  const size = 2 * ctx.sampleRate;
  const buf = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < size; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (last + 0.02 * white) / 1.02;
    last = data[i];
    data[i] *= 3.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass"; filter.frequency.value = freq; filter.Q.value = q;
  const gain = ctx.createGain(); gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start();
  activeNodes.push(src, filter, gain);
}

function createRain(ctx: AudioContext) { brownNoise(ctx, 1000, 0.5, 0.25); }
function createCrackle(ctx: AudioContext) { brownNoise(ctx, 400, 1.5, 0.2); }
function createDrone(ctx: AudioContext) { brownNoise(ctx, 120, 2, 0.15); }
function createLofi(ctx: AudioContext) { brownNoise(ctx, 800, 0.8, 0.18); }
