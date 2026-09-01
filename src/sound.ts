/**
 * Synthesized sound effects. Everything is generated with the Web Audio API so
 * there are no audio files to download, and the context is created lazily on
 * the first effect because browsers refuse to start audio before a gesture.
 */

const STORAGE_KEY = "battleship.muted";

let ctx: AudioContext | null = null;
let muted = readMuted();

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Private browsing: the preference just does not persist.
  }
}

function audio(): AudioContext | null {
  if (muted) return null;
  const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface ToneOptions {
  type: OscillatorType;
  from: number;
  to: number;
  duration: number;
  gain?: number;
  delay?: number;
}

/** A single pitch-swept oscillator with an exponential fade-out. */
function tone(ac: AudioContext, { type, from, to, duration, gain = 0.2, delay = 0 }: ToneOptions): void {
  const start = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + duration);
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration);
}

/** Filtered white noise — the body of splashes and explosions. */
function noise(
  ac: AudioContext,
  { duration, gain = 0.2, delay = 0, filter = "lowpass", frequency = 1000 }: {
    duration: number;
    gain?: number;
    delay?: number;
    filter?: BiquadFilterType;
    frequency?: number;
  },
): void {
  const start = ac.currentTime + delay;
  const frames = Math.floor(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

  const source = ac.createBufferSource();
  source.buffer = buffer;
  const band = ac.createBiquadFilter();
  band.type = filter;
  band.frequency.setValueAtTime(frequency, start);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(band).connect(amp).connect(ac.destination);
  source.start(start);
}

/** Cannon report, played as a shot leaves the tube. */
export function playFire(): void {
  const ac = audio();
  if (!ac) return;
  tone(ac, { type: "square", from: 180, to: 60, duration: 0.12, gain: 0.12 });
  noise(ac, { duration: 0.18, gain: 0.1, frequency: 700 });
}

/** Water splash for a shot that hits nothing. */
export function playMiss(): void {
  const ac = audio();
  if (!ac) return;
  noise(ac, { duration: 0.35, gain: 0.14, filter: "highpass", frequency: 900 });
  tone(ac, { type: "sine", from: 320, to: 140, duration: 0.2, gain: 0.06 });
}

/** Explosion for a shot that lands on a hull. */
export function playHit(level = 0): void {
  const ac = audio();
  if (!ac) return;
  noise(ac, { duration: 0.5, gain: 0.25 + level * 0.02, frequency: 1400 });
  tone(ac, { type: "sawtooth", from: 240, to: 40, duration: 0.4, gain: 0.18 + level * 0.015 });
}

/** Short whoosh as a torpedo leaves the tube. */
export function playLaunch(): void {
  const ac = audio();
  if (!ac) return;
  noise(ac, { duration: 0.28, gain: 0.09, filter: "bandpass", frequency: 500 });
  tone(ac, { type: "sine", from: 240, to: 70, duration: 0.24, gain: 0.08 });
}

/** Two pings for a sonar contact. */
export function playSonar(): void {
  const ac = audio();
  if (!ac) return;
  tone(ac, { type: "sine", from: 880, to: 880, duration: 0.1, gain: 0.08 });
  tone(ac, { type: "sine", from: 880, to: 880, duration: 0.1, gain: 0.08, delay: 0.16 });
}

/** Brief radio squelch before a Commander Voss transmission. */
export function playRadio(): void {
  const ac = audio();
  if (!ac) return;
  noise(ac, { duration: 0.12, gain: 0.06, filter: "bandpass", frequency: 1600 });
}

/** Deeper, longer groan when a whole ship goes down. */
export function playSunk(): void {
  const ac = audio();
  if (!ac) return;
  noise(ac, { duration: 0.9, gain: 0.28, frequency: 900 });
  tone(ac, { type: "sawtooth", from: 180, to: 28, duration: 0.85, gain: 0.22 });
  tone(ac, { type: "triangle", from: 90, to: 30, duration: 1, gain: 0.16, delay: 0.1 });
}

/** Rising fanfare on a win. */
export function playWin(): void {
  const ac = audio();
  if (!ac) return;
  [392, 523, 659, 784].forEach((hz, i) => {
    tone(ac, { type: "triangle", from: hz, to: hz, duration: 0.22, gain: 0.16, delay: i * 0.14 });
  });
}

/** Falling horn on a loss. */
export function playLose(): void {
  const ac = audio();
  if (!ac) return;
  [392, 311, 233].forEach((hz, i) => {
    tone(ac, { type: "sawtooth", from: hz, to: hz * 0.94, duration: 0.36, gain: 0.14, delay: i * 0.22 });
  });
}
