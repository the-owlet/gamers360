import { createSeededRNG } from "./gameEngine";

let currentRng: (() => number) | null = null;

export function initGameRng(seed: number) {
  currentRng = createSeededRNG(seed);
}

export function gameRandom(): number {
  if (!currentRng) return Math.random();
  return currentRng();
}

export function resetGameRng() {
  currentRng = null;
}
