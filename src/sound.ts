/**
 * Synthesized sound effects. Everything is generated with the Web Audio API so
 * there are no audio files to download, and the context is created lazily on
 * the first effect because browsers refuse to start audio before a gesture.
 */

import type { TheatreId } from "./theatre.js";

const STORAGE_KEY = "battleship.muted";

/**
 * How a theatre's ordnance sounds. Same synthesis, different powder: black
 * powder booms low with a long rolling tail, 1940s naval guns crack higher and
 * drier, and river patrols carry rotor noise.
 */
interface SoundProfile {
  fireType: OscillatorType;
  fireFrom: number;
  fireTo: number;
  /** Centre frequency of the muzzle blast noise. */
  fireBody: number;
  /** Centre frequency of the water splash on a miss. */
  splash: number;
  /** Centre frequency of the explosion on a hit. */
  blast: number;
  hitType: OscillatorType;
  tail: "none" | "rumble" | "rotor";
  /** Adds a returning sonar ping after a miss. */
  ping: boolean;
}

const PROFILES: Readonly<Record<TheatreId, SoundProfile>> = {
  pacific: {
    fireType: "square",
    fireFrom: 180,
    fireTo: 60,
    fireBody: 700,
    splash: 900,
    blast: 1400,
    hitType: "sawtooth",
    tail: "none",
    ping: false,
  },
  sail: {
    fireType: "triangle",
    fireFrom: 120,
    fireTo: 34,
    fireBody: 380,
    splash: 700,
    blast: 800,
    hitType: "triangle",
    tail: "rumble",
    ping: false,
  },
  atlantic: {
    fireType: "square",
    fireFrom: 200,
    fireTo: 70,
    fireBody: 620,
    splash: 1100,
    blast: 1200,
    hitType: "sawtooth",
    tail: "none",
    ping: true,
  },
  mekong: {
    fireType: "sawtooth",
    fireFrom: 240,
    fireTo: 90,
    fireBody: 900,
    splash: 1300,
    blast: 1600,
    hitType: "sawtooth",
    tail: "rotor",
    ping: false,
  },
};

let ctx: AudioContext | null = null;
let muted = readMuted();
let profile: SoundProfile = PROFILES.pacific;

/** Switches the era the effects are synthesized for. */
export function setSoundTheatre(id: TheatreId): void {
  profile = PROFILES[id];
}

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

/** Gun report, played as a shot leaves the tube. */
export function playFire(): void {
  const ac = audio();
  if (!ac) return;
  const { fireType, fireFrom, fireTo, fireBody } = profile;
  tone(ac, { type: fireType, from: fireFrom, to: fireTo, duration: 0.12, gain: 0.12 });
  noise(ac, { duration: 0.18, gain: 0.1, frequency: fireBody });
  // Powder-era guns are followed by rolling smoke and rigging noise; the modern
  // theatres get a short mechanical tail instead.
  if (profile.tail === "rumble") {
    noise(ac, { duration: 0.6, gain: 0.06, frequency: 260, delay: 0.1 });
  } else if (profile.tail === "rotor") {
    tone(ac, { type: "square", from: 60, to: 44, duration: 0.5, gain: 0.05, delay: 0.05 });
  }
}

/** Water splash for a shot that hits nothing. */
export function playMiss(): void {
  const ac = audio();
  if (!ac) return;
  noise(ac, { duration: 0.35, gain: 0.14, filter: "highpass", frequency: profile.splash });
  tone(ac, { type: "sine", from: 320, to: 140, duration: 0.2, gain: 0.06 });
  // A returning sonar ping is what a miss sounds like on a 1941 escort.
  if (profile.ping) {
    tone(ac, { type: "sine", from: 1180, to: 1180, duration: 0.22, gain: 0.07, delay: 0.18 });
  }
}

/** Explosion for a shot that lands on a hull. */
export function playHit(): void {
  const ac = audio();
  if (!ac) return;
  noise(ac, { duration: 0.5, gain: 0.25, frequency: profile.blast });
  tone(ac, { type: profile.hitType, from: 240, to: 40, duration: 0.4, gain: 0.18 });
}

/** Deeper, longer groan when a whole ship goes down. */
export function playSunk(): void {
  const ac = audio();
  if (!ac) return;
  noise(ac, { duration: 0.9, gain: 0.28, frequency: profile.blast * 0.65 });
  tone(ac, { type: profile.hitType, from: 180, to: 28, duration: 0.85, gain: 0.22 });
  tone(ac, { type: "triangle", from: 90, to: 30, duration: 1, gain: 0.16, delay: 0.1 });
  // Timber hulls go down groaning rather than tearing.
  if (profile.tail === "rumble") {
    tone(ac, { type: "sine", from: 140, to: 52, duration: 1.1, gain: 0.12, delay: 0.2 });
  }
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
