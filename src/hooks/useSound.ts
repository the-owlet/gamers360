"use client";

import { useCallback, useRef } from "react";

type SoundType = "click" | "win" | "lose" | "coin" | "levelup" | "spin" | "match" | "error" | "whoosh" | "pop" | "streak";

const audioCtxRef = { current: null as AudioContext | null };

function getCtx(): AudioContext {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new AudioContext();
  }
  if (audioCtxRef.current.state === "suspended") {
    audioCtxRef.current.resume();
  }
  return audioCtxRef.current;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.1) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

const SOUNDS: Record<SoundType, () => void> = {
  click: () => {
    playTone(800, 0.08, "square", 0.15);
  },
  win: () => {
    playTone(523, 0.15, "sine", 0.25);
    setTimeout(() => playTone(659, 0.15, "sine", 0.25), 100);
    setTimeout(() => playTone(784, 0.15, "sine", 0.25), 200);
    setTimeout(() => playTone(1047, 0.3, "sine", 0.3), 300);
  },
  lose: () => {
    playTone(400, 0.2, "sawtooth", 0.15);
    setTimeout(() => playTone(300, 0.3, "sawtooth", 0.15), 150);
  },
  coin: () => {
    playTone(1200, 0.1, "square", 0.2);
    setTimeout(() => playTone(1600, 0.15, "square", 0.2), 60);
  },
  levelup: () => {
    const notes = [523, 659, 784, 1047, 1319, 1568];
    notes.forEach((n, i) => {
      setTimeout(() => playTone(n, 0.2, "sine", 0.2), i * 80);
    });
  },
  spin: () => {
    playTone(200, 0.05, "square", 0.1);
  },
  match: () => {
    playTone(880, 0.1, "sine", 0.2);
    setTimeout(() => playTone(1100, 0.15, "sine", 0.2), 80);
  },
  error: () => {
    playTone(200, 0.15, "sawtooth", 0.2);
  },
  whoosh: () => {
    playNoise(0.2, 0.08);
  },
  pop: () => {
    playTone(600, 0.06, "sine", 0.25);
  },
  streak: () => {
    playTone(700, 0.1, "triangle", 0.2);
    setTimeout(() => playTone(900, 0.1, "triangle", 0.2), 80);
    setTimeout(() => playTone(1100, 0.15, "triangle", 0.25), 160);
  },
};

export function useSound() {
  const enabled = useRef(true);

  const play = useCallback((sound: SoundType) => {
    if (!enabled.current) return;
    try {
      SOUNDS[sound]();
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    enabled.current = !enabled.current;
    return enabled.current;
  }, []);

  return { play, toggle, enabled };
}
