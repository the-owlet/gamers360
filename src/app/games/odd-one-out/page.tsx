"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function OddOneOutPage() {
  return (
    <GameWrapper gameSlug="odd-one-out" gameName="Odd One Out" gameIcon="👁️">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

// Pairs of similar-looking emojis [normal, odd]
const EMOJI_PAIRS = [
  ["😀","😃"],
  ["🐶","🐕"],
  ["🌸","🌺"],
  ["⭐","🌟"],
  ["❤️","💗"],
  ["🔵","🫧"],
  ["🍎","🍒"],
  ["🐱","😺"],
  ["🌙","🌛"],
  ["🟢","🟩"],
  ["🔴","🟥"],
  ["🟡","🟨"],
  ["📱","📲"],
  ["✏️","🖊️"],
  ["🏠","🏡"],
];

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "feedback" | "done">("idle");
  const [grid, setGrid] = useState<{ emoji: string; isOdd: boolean }[]>([]);
  const [gridSize, setGridSize] = useState(3);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [found, setFound] = useState(0);
  const foundRef = useRef(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [streak, setStreak] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [tappedIdx, setTappedIdx] = useState(-1);
  const [oddIdx, setOddIdx] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const roundTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const roundStartRef = useRef(0);
  const maxRounds = 15;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    };
  }, []);

  const setupRound = useCallback((roundNum: number) => {
    // Grid grows: rounds 1-4 = 3x3, 5-9 = 4x4, 10-15 = 5x5
    const size = roundNum <= 4 ? 3 : roundNum <= 9 ? 4 : 5;
    const total = size * size;

    const pairIdx = Math.floor(gameRandom() * EMOJI_PAIRS.length);
    const [normal, odd] = EMOJI_PAIRS[pairIdx];

    // Place odd one at random position
    const oddPosition = Math.floor(gameRandom() * total);

    const cells = Array.from({ length: total }, (_, i) => ({
      emoji: i === oddPosition ? odd : normal,
      isOdd: i === oddPosition,
    }));

    setGrid(cells);
    setGridSize(size);
    setRound(roundNum);
    setFeedbackType(null);
    setTappedIdx(-1);
    setOddIdx(oddPosition);
    roundStartRef.current = Date.now();
    setPhase("playing");
  }, []);

  function begin() {
      startGame();
    }

    // Auto-start game when isPlaying becomes true (after bet selection)
    const _hasStarted = useRef(false);
    useEffect(() => {
      if (isPlaying && !_hasStarted.current) {
        _hasStarted.current = true;
        setScore(0);
            scoreRef.current = 0;
            setFound(0);
            foundRef.current = 0;
            setStreak(0);
            setTimeLeft(60);
            setPhase("playing");
        
            setupRound(1);
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  clearInterval(timerRef.current!);
                  if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
                  const finalScore = Math.min(95, scoreRef.current);
                  setPhase("done");
                  onGameComplete({ score: finalScore, won: foundRef.current >= 8 });
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  function handleTap(idx: number) {
    if (phase !== "playing") return;
    setTappedIdx(idx);

    const isCorrect = grid[idx].isOdd;

    if (isCorrect) {
      const elapsed = (Date.now() - roundStartRef.current) / 1000;
      const speedBonus = Math.max(0, Math.floor((3 - elapsed) * 2));
      const newStreak = streak + 1;
      const streakBonus = newStreak > 2 ? newStreak : 0;
      const points = 8 + speedBonus + streakBonus;
      const newScore = scoreRef.current + points;
      const newFound = foundRef.current + 1;
      scoreRef.current = newScore;
      foundRef.current = newFound;
      setScore(newScore);
      setFound(newFound);
      setStreak(newStreak);
      setFeedbackType("correct");
    } else {
      setStreak(0);
      setFeedbackType("wrong");
    }

    setPhase("feedback");

    if (round >= maxRounds) {
      roundTimerRef.current = setTimeout(() => {
        clearInterval(timerRef.current!);
        const finalScore = Math.min(95, scoreRef.current);
        setPhase("done");
        onGameComplete({ score: finalScore, won: foundRef.current >= 8 });
      }, 700);
    } else {
      roundTimerRef.current = setTimeout(() => {
        setupRound(round + 1);
      }, 700);
    }
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">👁️</div>
        <h2 className="text-2xl font-bold text-white">Odd One Out</h2>
        <p className="text-gray-400 text-center max-w-xs">
          Find the different emoji in the grid! Grids get bigger as you progress. 60 seconds, 15 rounds!
        </p>
        <button
          onClick={begin}
          className="px-8 py-3 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 transform hover:scale-105 transition-all shadow-lg"
        >
          Start Game
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const finalScore = Math.min(95, score);
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="text-5xl">{found >= 8 ? "🎉" : "😔"}</div>
        <h2 className="text-2xl font-bold text-white">
          {found >= 8 ? "Eagle Eyes!" : "Keep Looking!"}
        </h2>
        <p className="text-gray-300">Found: {found}/{maxRounds}</p>
        <p className="text-yellow-400 text-xl font-bold">Score: {finalScore}</p>
      </div>
    );
  }

  const cellSize = gridSize <= 3 ? "w-16 h-16 text-3xl" : gridSize <= 4 ? "w-14 h-14 text-2xl" : "w-11 h-11 text-xl";

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="flex justify-between w-full max-w-xs text-sm">
        <span className="text-gray-300">Round {round}/{maxRounds}</span>
        <span className="text-yellow-400 font-bold">Score: {score}</span>
        <span className="text-gray-300">⏱️ {timeLeft}s</span>
      </div>

      <div className="flex gap-4 text-sm">
        <span className="text-gray-400">Found: {found}</span>
        {streak > 2 && (
          <span className="text-orange-400 font-bold animate-pulse">🔥 {streak}x</span>
        )}
      </div>

      <p className="text-gray-300 text-sm">Find the odd emoji!</p>

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {grid.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleTap(i)}
            disabled={phase === "feedback"}
            className={`${cellSize} rounded-xl flex items-center justify-center transition-all transform active:scale-90 ${
              phase === "feedback" && i === oddIdx
                ? "bg-green-800/50 border-2 border-green-400 scale-110 shadow-lg shadow-green-500/30"
                : phase === "feedback" && i === tappedIdx && !cell.isOdd
                ? "bg-red-800/50 border-2 border-red-400 scale-90 opacity-70"
                : "bg-gray-800 border-2 border-gray-700 hover:border-gray-500"
            }`}
          >
            {cell.emoji}
          </button>
        ))}
      </div>

      {feedbackType && (
        <div className={`text-sm font-bold ${feedbackType === "correct" ? "text-green-400" : "text-red-400"}`}>
          {feedbackType === "correct" ? "✓ Found it!" : "✗ Wrong one!"}
        </div>
      )}
    </div>
  );
}
