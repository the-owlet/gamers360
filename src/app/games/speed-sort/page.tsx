"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function SpeedSortPage() {
  return (
    <GameWrapper gameSlug="speed-sort" gameName="Speed Sort" gameIcon="📊">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [nextExpected, setNextExpected] = useState(0);
  const [round, setRound] = useState(1);
  const [tapped, setTapped] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [roundsWon, setRoundsWon] = useState(0);
  const scoreRef = useRef(0);
  const roundsWonRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const totalRounds = 15;

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  function generateRound() {
    const count = 5;
    const nums: number[] = [];
    while (nums.length < count) {
      const n = Math.floor(gameRandom() * 50) + 1;
      if (!nums.includes(n)) nums.push(n);
    }
    setNumbers(nums);
    const sorted = [...nums].sort((a, b) => a - b);
    setNextExpected(0);
    setTapped([]);
    return sorted;
  }

  const sortedRef = useRef<number[]>([]);

  function begin() {
      startGame();
    }

    // Auto-start game when isPlaying becomes true (after bet selection)
    const _hasStarted = useRef(false);
    useEffect(() => {
      if (isPlaying && !_hasStarted.current) {
        _hasStarted.current = true;
        setScore(0); scoreRef.current = 0;
            setTimeLeft(60);
            setRound(1);
            setRoundsWon(0); roundsWonRef.current = 0;
            setFeedback(null);
            setPhase("playing");
            const sorted = generateRound();
            sortedRef.current = sorted;
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  cleanup();
                  setPhase("done");
                  setTimeout(() => {
                    const final = Math.min(95, scoreRef.current);
                    onGameComplete({ score: final, won: roundsWonRef.current >= 5 });
                  }, 500);
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

  function tapNumber(n: number) {
    if (phase !== "playing" || feedback || tapped.includes(n)) return;
    if (n === sortedRef.current[nextExpected]) {
      const newTapped = [...tapped, n];
      setTapped(newTapped);
      setNextExpected(nextExpected + 1);
      if (newTapped.length === numbers.length) {
        scoreRef.current += 8;
        setScore(scoreRef.current);
        roundsWonRef.current += 1;
        setRoundsWon(roundsWonRef.current);
        setFeedback("correct");
        setTimeout(() => {
          setFeedback(null);
          if (round >= totalRounds) {
            cleanup();
            setPhase("done");
            setTimeout(() => {
              const final = Math.min(95, scoreRef.current);
              onGameComplete({ score: final, won: roundsWonRef.current >= 5 });
            }, 500);
          } else {
            setRound(r => r + 1);
            const sorted = generateRound();
            sortedRef.current = sorted;
          }
        }, 500);
      }
    } else {
      setFeedback("wrong");
      setTimeout(() => {
        setFeedback(null);
        if (round >= totalRounds) {
          cleanup();
          setPhase("done");
          setTimeout(() => {
            const final = Math.min(95, scoreRef.current);
            onGameComplete({ score: final, won: roundsWonRef.current >= 5 });
          }, 500);
        } else {
          setRound(r => r + 1);
          const sorted = generateRound();
          sortedRef.current = sorted;
        }
      }, 500);
    }
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-gray-400 mb-2">Numbers scattered everywhere — tap am from smallest to biggest!</p>
        <p className="text-gray-500 text-sm mb-6">15 rounds, 60 seconds. Sort fast, score big!</p>
        <button onClick={begin} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-green-500/20 text-lg">
          📊 Start Sorting
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">Round: <span className="text-purple-400 font-bold">{round}/{totalRounds}</span></div>
        <div className="text-sm text-gray-400">Time: <span className={`font-bold ${timeLeft <= 8 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span></div>
        <div className="text-sm text-gray-400">Score: <span className="text-yellow-400 font-bold">{score}</span></div>
      </div>

      {phase === "playing" && (
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-4">Tap from smallest → biggest</p>
          <div className="flex flex-wrap justify-center gap-3">
            {numbers.map((n) => (
              <button
                key={n}
                onClick={() => tapNumber(n)}
                disabled={tapped.includes(n)}
                className={`w-16 h-16 rounded-xl font-black text-xl transition-all ${
                  tapped.includes(n)
                    ? "bg-green-500/20 text-green-400 scale-90 border border-green-500/30"
                    : "bg-gray-700 hover:bg-gray-600 text-white hover:scale-105 active:scale-95 border border-gray-600"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {feedback === "correct" && <div className="mt-4 text-green-400 font-bold text-sm animate-bounce">Sorted!</div>}
          {feedback === "wrong" && <div className="mt-4 text-red-400 font-bold text-sm">Wrong order!</div>}
        </div>
      )}

      {phase === "done" && (
        <div className="text-center py-8">
          <div className="text-3xl font-black text-yellow-400 mb-1">{roundsWon >= 5 ? "Sort Master!" : "Keep Practicing!"}</div>
          <div className="text-gray-400 text-sm">Rounds won: {roundsWon}/{totalRounds} | Score: {Math.min(95, score)}</div>
        </div>
      )}
    </div>
  );
}
