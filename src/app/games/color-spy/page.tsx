"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function ColorSpyPage() {
  return (
    <GameWrapper gameSlug="color-spy" gameName="Color Spy" gameIcon="🎨">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

const GAME_TIME = 60;
const TOTAL_ROUNDS = 20;

function getGridSize(round: number): number {
  if (round <= 3) return 3;
  if (round <= 6) return 4;
  return 5;
}

function getDifference(round: number): number {
  // Lightness difference gets smaller each round
  const base = 25;
  const min = 6;
  return Math.max(min, base - round * 2);
}

function generateColor(): { h: number; s: number; l: number } {
  return {
    h: Math.floor(gameRandom() * 360),
    s: 50 + Math.floor(gameRandom() * 30),
    l: 35 + Math.floor(gameRandom() * 25),
  };
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [found, setFound] = useState(0);
  const [grid, setGrid] = useState<{ color: string; isOdd: boolean }[]>([]);
  const [gridSize, setGridSize] = useState(3);
  const [feedback, setFeedback] = useState<{ text: string; correct: boolean } | null>(null);
  const [roundStartTime, setRoundStartTime] = useState(0);
  const [tappedIndex, setTappedIndex] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreRef = useRef(0);
  const foundRef = useRef(0);
  const roundRef = useRef(1);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { foundRef.current = found; }, [found]);
  useEffect(() => { roundRef.current = round; }, [round]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const generateGrid = useCallback((r: number) => {
    const size = getGridSize(r);
    const diff = getDifference(r);
    const baseColor = generateColor();
    const total = size * size;
    const oddIndex = Math.floor(gameRandom() * total);

    const cells = [];
    for (let i = 0; i < total; i++) {
      if (i === oddIndex) {
        // Odd one: shift lightness
        const oddL = baseColor.l + (gameRandom() > 0.5 ? diff : -diff);
        cells.push({
          color: hsl(baseColor.h, baseColor.s, Math.max(10, Math.min(90, oddL))),
          isOdd: true,
        });
      } else {
        cells.push({
          color: hsl(baseColor.h, baseColor.s, baseColor.l),
          isOdd: false,
        });
      }
    }

    setGrid(cells);
    setGridSize(size);
    setTappedIndex(null);
    setRoundStartTime(Date.now());
  }, []);

  function showFeedback(text: string, correct: boolean) {
    setFeedback({ text, correct });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 500);
  }

  function init() {
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
            setRound(1);
            roundRef.current = 1;
            setTimeLeft(GAME_TIME);
            setFeedback(null);
            setPhase("playing");
            generateGrid(1);
        
            timerRef.current = setInterval(() => {
              setTimeLeft((t) => {
                if (t <= 1) {
                  if (timerRef.current) clearInterval(timerRef.current);
                  const finalScore = Math.min(95, scoreRef.current);
                  setPhase("done");
                  onGameComplete({ score: finalScore, won: foundRef.current >= 5 });
                  return 0;
                }
                return t - 1;
              });
            }, 1000);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  function handleCellClick(index: number, isOdd: boolean) {
    if (phase !== "playing") return;

    setTappedIndex(index);

    if (isOdd) {
      const elapsed = (Date.now() - roundStartTime) / 1000;
      const speedBonus = elapsed < 1.5 ? 4 : elapsed < 2.5 ? 2 : 0;
      const pts = 8 + speedBonus;
      const newScore = scoreRef.current + pts;
      setScore(newScore);
      scoreRef.current = newScore;
      setFound((f) => f + 1);
      foundRef.current += 1;
      showFeedback(`+${pts}${speedBonus > 0 ? " Fast!" : ""}`, true);

      const nextRound = roundRef.current + 1;
      if (nextRound > TOTAL_ROUNDS) {
        if (timerRef.current) clearInterval(timerRef.current);
        const finalScore = Math.min(95, newScore);
        setPhase("done");
        onGameComplete({ score: finalScore, won: foundRef.current >= 5 });
        return;
      }

      setRound(nextRound);
      roundRef.current = nextRound;
      setTimeout(() => generateGrid(nextRound), 400);
    } else {
      showFeedback("Wrong cell!", false);
    }
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">🎨</div>
        <p className="text-gray-400 text-center max-w-xs">
          Find the one cell with a different shade! The grid grows bigger and differences get subtler each round.
        </p>
        <button
          onClick={init}
          className="px-8 py-3 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 transition-all shadow-lg shadow-pink-500/30"
        >
          Start Spotting
        </button>
      </div>
    );
  }

  const cellSize = Math.floor(280 / gridSize);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Stats */}
      <div className="flex justify-between w-full max-w-xs text-sm">
        <span className="text-gray-400">Round {Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</span>
        <span className={`font-bold ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-gray-300"}`}>
          {timeLeft}s
        </span>
        <span className="text-yellow-400 font-bold">Score: {score}</span>
      </div>

      {/* Timer bar */}
      <div className="w-full max-w-xs h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-1000"
          style={{ width: `${(timeLeft / GAME_TIME) * 100}%` }}
        />
      </div>

      {/* Found counter */}
      <div className="text-sm text-gray-400">
        Found: <span className="text-pink-400 font-bold">{found}</span>/{TOTAL_ROUNDS}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`text-lg font-bold animate-pulse ${feedback.correct ? "text-green-400" : "text-red-400"}`}>
          {feedback.text}
        </div>
      )}

      {/* Grid */}
      {phase === "playing" && (
        <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-700">
          <div
            className="grid gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
            }}
          >
            {grid.map((cell, i) => (
              <button
                key={i}
                onClick={() => handleCellClick(i, cell.isOdd)}
                className={`rounded-lg hover:scale-105 active:scale-95 transition-all ${
                  tappedIndex === i
                    ? cell.isOdd
                      ? "ring-2 ring-green-400"
                      : "ring-2 ring-red-400"
                    : ""
                }`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: cell.color,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Done */}
      {phase === "done" && (
        <div className="text-center space-y-3">
          <p className="text-lg font-bold text-white">
            {found >= 5 ? "Sharp eyes!" : "Keep looking!"}
          </p>
          <p className="text-gray-400">{found} odd colors found</p>
          <button
            onClick={init}
            className="px-6 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 transition-all"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
