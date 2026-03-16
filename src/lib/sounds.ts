type SoundEvent = "quest_complete" | "level_up" | "quest_fail" | "gold_clink" | "purchase";
type WaveType = OscillatorType;

interface SoundConfig {
  waveType: WaveType;
  durationMult: number;
}

const PACKS: Record<string, SoundConfig | null> = {
  silent: null,
  fantasy: { waveType: "sine", durationMult: 1 },
  scifi: { waveType: "sawtooth", durationMult: 1 },
  minimal: { waveType: "triangle", durationMult: 0.6 },
};

let audioCtx: AudioContext | null = null;
let currentPack: string = "silent";

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(freq: number, duration: number, wave: WaveType, startTime: number) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = wave;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.15, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

const SOUNDS: Record<SoundEvent, { freqs: number[]; dur: number }> = {
  quest_complete: { freqs: [523.25, 659.25], dur: 0.1 },
  level_up: { freqs: [523.25, 659.25, 783.99, 1046.5], dur: 0.08 },
  quest_fail: { freqs: [196, 146.83], dur: 0.15 },
  gold_clink: { freqs: [1318.51], dur: 0.05 },
  purchase: { freqs: [1318.51, 1046.5, 880], dur: 0.07 },
};

export function setSoundPack(pack: string) {
  currentPack = pack;
}

export function playSound(event: SoundEvent) {
  const cfg = PACKS[currentPack];
  if (!cfg) return;
  const sound = SOUNDS[event];
  if (!sound) return;
  const ctx = getCtx();
  const dur = sound.dur * cfg.durationMult;
  let t = ctx.currentTime;
  for (const freq of sound.freqs) {
    playTone(freq, dur, cfg.waveType, t);
    t += dur;
  }
}
