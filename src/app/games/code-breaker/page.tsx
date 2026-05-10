"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function CodeBreakerPage() {
  return (
    <GameWrapper gameSlug="code-breaker" gameName="Code Breaker" gameIcon="🔓">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

const COLORS = ["🔴", "🔵", "🟢", "🟡", "🟣", "🟠"];
const CODE_LENGTH = 4;
const MAX_ATTEMPTS = 8;

interface Guess {
  code: string[];
  feedback: string[];
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [secretCode, setSecretCode] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [message, setMessage] = useState("");
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);

  useEffect(() => {
    if (!isPlaying && phase === "playing") {
      setPhase("done");
    }
  }, [isPlaying, phase]);

  const generateCode = useCallback(() => {
    const code: string[] = [];
    for (let i = 0; i < CODE_LENGTH; i++) {
      code.push(COLORS[Math.floor(gameRandom() * COLORS.length)]);
    }
    return code;
  }, []);

  const handleStart = useCallback(() => {
    startGame();
  }, [startGame]);

  const _hasStarted = useRef(false);
  useEffect(() => {
    if (isPlaying && !_hasStarted.current) {
      _hasStarted.current = true;
      setSecretCode(generateCode());
      setCurrentGuess([]);
      setGuesses([]);
      setMessage("");
      setScore(0);
      scoreRef.current = 0;
      setPhase("playing");
    }
    if (!isPlaying) _hasStarted.current = false;
  }, [isPlaying, generateCode]);

  const addColor = useCallback((color: string) => {
    if (phase !== "playing") return;
    if (currentGuess.length < CODE_LENGTH) {
      setCurrentGuess(prev => [...prev, color]);
    }
  }, [phase, currentGuess.length]);

  const removeLastColor = useCallback(() => {
    setCurrentGuess(prev => prev.slice(0, -1));
  }, []);

  const getFeedback = useCallback((guess: string[], secret: string[]): string[] => {
    const feedback: string[] = [];
    const secretCopy = [...secret];
    const guessCopy = [...guess];

    // First pass: exact matches
    for (let i = 0; i < CODE_LENGTH; i++) {
      if (guessCopy[i] === secretCopy[i]) {
        feedback.push("🟢");
        secretCopy[i] = "X";
        guessCopy[i] = "Y";
      }
    }

    // Second pass: right color wrong spot
    for (let i = 0; i < CODE_LENGTH; i++) {
      if (guessCopy[i] !== "Y") {
        const idx = secretCopy.indexOf(guessCopy[i]);
        if (idx !== -1) {
          feedback.push("🟡");
          secretCopy[idx] = "X";
        } else {
          feedback.push("⚫");
        }
      }
    }

    // Sort feedback so it doesn't reveal positions
    feedback.sort();
    return feedback;
  }, []);

  const submitGuess = useCallback(() => {
    if (phase !== "playing" || currentGuess.length !== CODE_LENGTH) return;

    const feedback = getFeedback(currentGuess, secretCode);
    const newGuesses = [...guesses, { code: [...currentGuess], feedback }];
    setGuesses(newGuesses);
    setCurrentGuess([]);

    const isCorrect = feedback.every(f => f === "🟢");
    const attemptsUsed = newGuesses.length;

    if (isCorrect) {
      // Score based on attempts: fewer = better
      const points = Math.min(95, Math.max(10, 95 - (attemptsUsed - 1) * 12));
      setScore(points);
      scoreRef.current = points;
      setMessage(`Cracked in ${attemptsUsed} attempt${attemptsUsed > 1 ? "s" : ""}!`);
      setPhase("done");
      onGameComplete({ score: points, won: true });
    } else if (attemptsUsed >= MAX_ATTEMPTS) {
      setMessage(`Out of attempts! Code was: ${secretCode.join("")}`);
      setPhase("done");
      onGameComplete({ score: 0, won: false });
    }
  }, [phase, currentGuess, secretCode, guesses, getFeedback, onGameComplete]);

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">🔓</div>
        <h2 className="text-2xl font-bold text-white">Code Breaker</h2>
        <p className="text-gray-400 text-center max-w-xs">
          Crack the secret 4-color code! You have 8 attempts.
          🟢 = right color & spot, 🟡 = right color wrong spot, ⚫ = wrong.
        </p>
        <button
          onClick={handleStart}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl text-lg hover:scale-105 transition-transform"
        >
          Start Cracking
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="text-5xl">{score > 0 ? "🎉" : "😞"}</div>
        <h2 className="text-2xl font-bold text-white">{message}</h2>
        <p className="text-3xl font-bold text-yellow-400">{score} pts</p>
        <button
          onClick={handleStart}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2 w-full max-w-sm mx-auto">
      <div className="text-sm text-gray-400">
        Attempt {guesses.length + 1} / {MAX_ATTEMPTS}
      </div>

      {/* Previous guesses */}
      <div className="w-full space-y-1 max-h-48 overflow-y-auto">
        {guesses.map((g, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-1.5">
            <div className="flex gap-1 text-xl">{g.code.map((c, j) => <span key={j}>{c}</span>)}</div>
            <div className="flex gap-1 text-sm">{g.feedback.map((f, j) => <span key={j}>{f}</span>)}</div>
          </div>
        ))}
      </div>

      {/* Current guess */}
      <div className="flex gap-2 bg-gray-800 rounded-xl px-4 py-3 min-h-[52px]">
        {Array.from({ length: CODE_LENGTH }).map((_, i) => (
          <div
            key={i}
            className="w-10 h-10 rounded-lg border-2 border-gray-600 flex items-center justify-center text-xl"
          >
            {currentGuess[i] || ""}
          </div>
        ))}
      </div>

      {/* Color picker */}
      <div className="grid grid-cols-6 gap-2">
        {COLORS.map((color, i) => (
          <button
            key={i}
            onClick={() => addColor(color)}
            className="w-11 h-11 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-2xl transition-colors active:scale-90"
          >
            {color}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={removeLastColor}
          disabled={currentGuess.length === 0}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-40 hover:bg-gray-600 transition-colors"
        >
          Undo
        </button>
        <button
          onClick={submitGuess}
          disabled={currentGuess.length !== CODE_LENGTH}
          className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg disabled:opacity-40 hover:scale-105 transition-transform"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
