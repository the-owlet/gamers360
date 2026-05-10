"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function ArrowDashPage() {
  return (
    <GameWrapper gameSlug="arrow-dash" gameName="Arrow Dash" gameIcon="➡️">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

const DIRS = [
  { arrow: "↑", label: "UP", key: "ArrowUp" },
  { arrow: "↓", label: "DOWN", key: "ArrowDown" },
  { arrow: "←", label: "LEFT", key: "ArrowLeft" },
  { arrow: "→", label: "RIGHT", key: "ArrowRight" },
];

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [current, setCurrent] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [total, setTotal] = useState(0);
  const scoreRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const currentRef = useRef(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  function nextArrow() {
    const idx = Math.floor(gameRandom() * 4);
    setCurrent(idx);
    currentRef.current = idx;
  }

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
            setCombo(0);
            setTotal(0);
            setFeedback(null);
            setPhase("playing");
            nextArrow();
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  cleanup();
                  setPhase("done");
                  setTimeout(() => {
                    const final = Math.min(95, scoreRef.current);
                    onGameComplete({ score: final, won: final >= 30 });
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

  useEffect(() => {
    if (phase !== "playing") return;
    function handleKey(e: KeyboardEvent) {
      const idx = DIRS.findIndex(d => d.key === e.key);
      if (idx >= 0) pick(idx);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  function pick(idx: number) {
    if (phase !== "playing" || feedback) return;
    setTotal(t => t + 1);
    if (idx === currentRef.current) {
      const comboBonus = combo >= 5 ? 3 : combo >= 3 ? 2 : 0;
      const pts = 5 + comboBonus;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      setCombo(c => c + 1);
      setFeedback("correct");
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - 5);
      setScore(scoreRef.current);
      setCombo(0);
      setFeedback("wrong");
    }
    setTimeout(() => {
      setFeedback(null);
      nextArrow();
    }, 300);
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">➡️</div>
        <p className="text-gray-400 mb-2">Arrow dey show — tap the right direction sharp!</p>
        <p className="text-gray-500 text-sm mb-6">60 seconds. Combos = bonus points. Use buttons or arrow keys!</p>
        <button onClick={begin} className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-blue-500/20 text-lg">
          ➡️ Start Dashing
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">Combo: <span className="text-purple-400 font-bold">{combo}x</span></div>
        <div className="text-sm text-gray-400">Time: <span className={`font-bold ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span></div>
        <div className="text-sm text-gray-400">Score: <span className="text-yellow-400 font-bold">{score}</span></div>
      </div>

      {phase === "playing" && (
        <div className="text-center">
          <div className={`text-8xl mb-6 transition-transform ${feedback === "correct" ? "scale-110 text-green-400" : feedback === "wrong" ? "scale-90 text-red-400" : ""}`}>
            {DIRS[current].arrow}
          </div>
          <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
            <div />
            <button onClick={() => pick(0)} className="py-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-2xl font-bold active:scale-95 transition">↑</button>
            <div />
            <button onClick={() => pick(2)} className="py-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-2xl font-bold active:scale-95 transition">←</button>
            <button onClick={() => pick(1)} className="py-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-2xl font-bold active:scale-95 transition">↓</button>
            <button onClick={() => pick(3)} className="py-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-2xl font-bold active:scale-95 transition">→</button>
          </div>
          {feedback === "correct" && <div className="mt-3 text-green-400 font-bold text-sm animate-bounce">Nice!</div>}
          {feedback === "wrong" && <div className="mt-3 text-red-400 font-bold text-sm">Wrong way!</div>}
        </div>
      )}

      {phase === "done" && (
        <div className="text-center py-8">
          <div className="text-3xl font-black text-yellow-400 mb-1">{score >= 30 ? "Lightning Fast!" : "Too Slow!"}</div>
          <div className="text-gray-400 text-sm">Answered: {total} | Score: {Math.min(95, score)}</div>
        </div>
      )}
    </div>
  );
}
