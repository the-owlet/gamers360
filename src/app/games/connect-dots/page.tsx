"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function ConnectDotsPage() {
  return (
    <GameWrapper gameSlug="connect-dots" gameName="Connect Dots" gameIcon="🔵">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

interface Dot {
  id: number;
  x: number;
  y: number;
}

function generateDots(): Dot[] {
  const dots: Dot[] = [];
  const DOT_COUNT = 8;
  const MIN_DIST = 50;

  for (let i = 1; i <= DOT_COUNT; i++) {
    let x: number, y: number;
    let attempts = 0;
    do {
      x = Math.floor(gameRandom() * 260) + 20;
      y = Math.floor(gameRandom() * 260) + 20;
      attempts++;
    } while (
      attempts < 50 &&
      dots.some(d => Math.hypot(d.x - x, d.y - y) < MIN_DIST)
    );
    dots.push({ id: i, x, y });
  }
  return dots;
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [dots, setDots] = useState<Dot[]>([]);
  const [nextDot, setNextDot] = useState(1);
  const [connectedDots, setConnectedDots] = useState<number[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [shakeWrong, setShakeWrong] = useState(false);

  const scoreRef = useRef(0);
  const completedRef = useRef(0);
  const roundRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const shakeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying && phase === "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      finishGame();
    }
  }, [isPlaying, phase]);

  const finishGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalScore = Math.min(95, scoreRef.current);
    setScore(finalScore);
    setPhase("done");
    onGameComplete({ score: finalScore, won: completedRef.current >= 3 });
  }, [onGameComplete]);

  const loadRound = useCallback(() => {
    setDots(generateDots());
    setNextDot(1);
    setConnectedDots([]);
  }, []);

  const handleStart = useCallback(() => {
    startGame();
  }, [startGame]);

  const _hasStarted = useRef(false);
  useEffect(() => {
    if (isPlaying && !_hasStarted.current) {
      _hasStarted.current = true;
      scoreRef.current = 0;
      completedRef.current = 0;
      roundRef.current = 0;
      setScore(0);
      setRoundsCompleted(0);
      setRoundIndex(0);
      setTimeLeft(60);
      loadRound();
      setPhase("playing");

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    if (!isPlaying) _hasStarted.current = false;
  }, [isPlaying, loadRound, finishGame]);

  const handleDotTap = useCallback((dotId: number) => {
    if (phase !== "playing") return;

    if (dotId === nextDot) {
      const newConnected = [...connectedDots, dotId];
      setConnectedDots(newConnected);
      setNextDot(dotId + 1);

      if (dotId === 8) {
        // Round complete
        const speedBonus = Math.max(0, Math.floor(timeLeft / 4));
        const points = 12 + speedBonus;
        scoreRef.current += points;
        completedRef.current += 1;
        setScore(scoreRef.current);
        setRoundsCompleted(completedRef.current);

        if (roundRef.current < 4) {
          roundRef.current += 1;
          setRoundIndex(roundRef.current);
          loadRound();
        } else {
          finishGame();
        }
      }
    } else {
      // Wrong tap - restart round
      setShakeWrong(true);
      shakeTimerRef.current = setTimeout(() => setShakeWrong(false), 400);
      setNextDot(1);
      setConnectedDots([]);
    }
  }, [phase, nextDot, connectedDots, timeLeft, loadRound, finishGame]);

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">🔵</div>
        <h2 className="text-2xl font-bold text-white">Connect Dots</h2>
        <p className="text-gray-400 text-center max-w-xs">
          Tap numbered dots in order: 1, 2, 3... up to 8!
          Wrong tap restarts the round. 5 rounds, 40 seconds.
        </p>
        <button
          onClick={handleStart}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-lg hover:scale-105 transition-transform"
        >
          Start Connecting
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="text-5xl">{roundsCompleted >= 3 ? "🌟" : "🔵"}</div>
        <h2 className="text-2xl font-bold text-white">
          {roundsCompleted >= 3 ? "Dot Master!" : "Keep Trying!"}
        </h2>
        <p className="text-gray-400">{roundsCompleted}/5 rounds completed</p>
        <p className="text-3xl font-bold text-yellow-400">{Math.min(95, score)} pts</p>
        <button
          onClick={handleStart}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2 w-full max-w-sm mx-auto">
      {/* Header */}
      <div className="flex justify-between w-full px-2">
        <span className="text-gray-400">Round {roundIndex + 1}/5</span>
        <span className={`font-bold ${timeLeft <= 8 ? "text-red-400 animate-pulse" : "text-white"}`}>
          {timeLeft}s
        </span>
        <span className="text-yellow-400">{score} pts</span>
      </div>

      <div className="text-sm text-gray-500">
        Next: <span className="text-blue-400 font-bold">{nextDot}</span>
      </div>

      {/* Dot field */}
      <div
        className={`relative w-[300px] h-[300px] bg-gray-900 rounded-2xl border-2 border-gray-700 overflow-hidden transition-all
          ${shakeWrong ? "animate-pulse border-red-500" : ""}`}
      >
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {connectedDots.length >= 2 &&
            connectedDots.slice(1).map((dotId, i) => {
              const from = dots.find(d => d.id === connectedDots[i]);
              const to = dots.find(d => d.id === dotId);
              if (!from || !to) return null;
              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              );
            })}
        </svg>

        {/* Dots */}
        {dots.map(dot => {
          const isConnected = connectedDots.includes(dot.id);
          const isNext = dot.id === nextDot;
          return (
            <button
              key={dot.id}
              onClick={() => handleDotTap(dot.id)}
              className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center text-sm font-bold transition-all active:scale-90
                ${isConnected
                  ? "bg-blue-600 text-white scale-90"
                  : isNext
                    ? "bg-blue-500 text-white ring-2 ring-blue-300 animate-pulse shadow-lg shadow-blue-500/50"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              style={{ left: dot.x, top: dot.y }}
            >
              {dot.id}
            </button>
          );
        })}
      </div>

      {shakeWrong && (
        <p className="text-red-400 text-sm font-bold">Wrong dot! Restarting round...</p>
      )}
    </div>
  );
}
