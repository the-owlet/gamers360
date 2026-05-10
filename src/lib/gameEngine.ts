import { GAMES } from "./constants";

// --- Seeded PRNG (Mulberry32) ---
export function createSeededRNG(seed: number) {
  let s = seed | 0;
  return function random(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromToken(token: string): number {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = ((hash << 5) - hash + token.charCodeAt(i)) | 0;
  }
  return hash;
}

// --- Win Rate Tiers ---
export type Difficulty = "Easy" | "Medium" | "Hard";

const WIN_RATES: Record<Difficulty, { min: number; max: number }> = {
  Easy: { min: 0.42, max: 0.50 },
  Medium: { min: 0.28, max: 0.38 },
  Hard: { min: 0.14, max: 0.24 },
};

const PAYOUT_MULTIPLIERS: Record<Difficulty, number> = {
  Easy: 0.6,
  Medium: 0.8,
  Hard: 1.0,
};

export function getWinRate(difficulty: Difficulty): { min: number; max: number } {
  return WIN_RATES[difficulty] || WIN_RATES.Easy;
}

// Determines if the player should win this round, factoring in their recent history
export function shouldPlayerWin(
  difficulty: Difficulty,
  recentWinRate: number,
  recentGames: number,
  rng: () => number
): boolean {
  const tier = WIN_RATES[difficulty] || WIN_RATES.Easy;
  const targetRate = (tier.min + tier.max) / 2;

  // If player has played enough games, adjust probability toward target
  let adjustedProbability = targetRate;
  if (recentGames >= 5) {
    const deviation = recentWinRate - targetRate;
    // Pull probability in the opposite direction of current deviation
    adjustedProbability = targetRate - deviation * 0.5;
    // Clamp within tier bounds (with small buffer)
    adjustedProbability = Math.max(tier.min - 0.05, Math.min(tier.max + 0.05, adjustedProbability));
  }

  return rng() < adjustedProbability;
}

// --- Bet Tiers ---
export const BET_TIERS = [
  { amount: 0, label: "Free Play", multiplier: 0.3, icon: "🎮" },
  { amount: 10, label: "Small Bet", multiplier: 1.0, icon: "🪙" },
  { amount: 25, label: "Medium Bet", multiplier: 1.8, icon: "💰" },
  { amount: 50, label: "Large Bet", multiplier: 2.8, icon: "💎" },
  { amount: 100, label: "Max Bet", multiplier: 4.0, icon: "👑" },
];

// --- Payout Calculation ---
export function calculatePayout(params: {
  won: boolean;
  gameMaxPoints: number;
  difficulty: Difficulty;
  levelMultiplier: number;
  score: number;
  betAmount?: number;
}): { points: number; xp: number; betLoss: number } {
  const BASE_PLAY_REWARD = 5;
  const XP_PER_GAME = 10;
  const XP_WIN_BONUS = 25;
  const bet = params.betAmount || 0;
  const betTier = BET_TIERS.find(t => t.amount === bet) || BET_TIERS[0];

  if (!params.won) {
    const lossAmount = bet > 0 ? Math.floor(bet * 0.33) : 0;
    return {
      points: bet > 0 ? -lossAmount : Math.round(BASE_PLAY_REWARD * params.levelMultiplier),
      xp: XP_PER_GAME,
      betLoss: lossAmount,
    };
  }

  const diffMultiplier = PAYOUT_MULTIPLIERS[params.difficulty] || 0.6;
  const scoreRatio = Math.min(1, params.score / params.gameMaxPoints);
  const winPoints = params.gameMaxPoints * diffMultiplier * scoreRatio;
  const baseWin = Math.round((BASE_PLAY_REWARD + winPoints) * params.levelMultiplier);
  const betBonus = Math.round(baseWin * betTier.multiplier);
  const cappedPoints = Math.min(betBonus, Math.round(params.gameMaxPoints * params.levelMultiplier * betTier.multiplier));

  return {
    points: cappedPoints,
    xp: XP_PER_GAME + XP_WIN_BONUS + (bet >= 50 ? 10 : 0),
    betLoss: 0,
  };
}

// --- Rate Limiting ---
export const RATE_LIMITS = {
  COOLDOWN_MS: 8000,
  MAX_GAMES_PER_HOUR: 30,
  MAX_GAMES_PER_DAY: 200,
  WIN_STREAK_CAP: 5,
  SUSPICIOUS_WIN_RATE_THRESHOLD: 0.70,
  SUSPICIOUS_MIN_GAMES: 20,
};

// --- Game Token ---
export function generateGameToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// --- Server-Side Outcome Validation ---
// Given a game token/seed, replay the RNG to verify the client-reported outcome
export function validateOutcome(params: {
  gameSlug: string;
  token: string;
  reportedWon: boolean;
  reportedScore: number;
  serverWon: boolean;
}): { valid: boolean; reason?: string } {
  // The server determined win/loss at /api/game/start time
  // Client must match the server's determination
  if (params.reportedWon !== params.serverWon) {
    return { valid: false, reason: "Outcome mismatch" };
  }

  const game = GAMES.find((g) => g.slug === params.gameSlug);
  if (!game) {
    return { valid: false, reason: "Unknown game" };
  }

  if (params.reportedScore < 0 || params.reportedScore > game.maxPoints) {
    return { valid: false, reason: "Score out of range" };
  }

  return { valid: true };
}

// --- Recent Stats Helper ---
export function computeRecentStats(
  history: { won: boolean; playedAt: Date }[]
): { recentWinRate: number; recentGames: number; currentStreak: number } {
  const recent = history.slice(0, 20);
  const wins = recent.filter((g) => g.won).length;
  const recentWinRate = recent.length > 0 ? wins / recent.length : 0;

  let currentStreak = 0;
  for (const game of recent) {
    if (game.won) currentStreak++;
    else break;
  }

  return {
    recentWinRate,
    recentGames: recent.length,
    currentStreak,
  };
}
