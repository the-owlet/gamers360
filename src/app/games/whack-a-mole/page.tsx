"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function WhackAMolePage() {
  return (
    <GameWrapper gameSlug="whack-a-mole" gameName="Whack-a-Mole" gameIcon="🔨">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

interface Hole {
  type: "empty" | "mole" | "skull";
  whacked: boolean;
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [holes, setHoles] = useState<Hole[]>(Array(9).fill({ type: "empty", whacked: false }));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [combo, setCombo] = useState(0);
  const [lastFeedback, setLastFeedback] = useState("");
  const [hits, setHits] = useState(0);

  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const spawnRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    timeoutRefs.current.forEach(t => clearTimeout(t));
    timeoutRefs.current = [];
  }, []);

  useEffect(() => cleanup, [cleanup]);

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
            setCombo(0);
            comboRef.current = 0;
            setHits(0);
            setTimeLeft(60);
            setLastFeedback("");
            setHoles(Array(9).fill({ type: "empty", whacked: false }));
            setPhase("playing");
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  cleanup();
                  setPhase("done");
                  setTimeout(() => {
                    const final = Math.min(95, Math.max(0, scoreRef.current));
                    onGameComplete({ score: final, won: final >= 30 });
                  }, 500);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
        
            spawnRef.current = setInterval(() => {
              const idx = Math.floor(gameRandom() * 9);
              const isMole = gameRandom() > 0.2;
              const type = isMole ? "mole" : "skull";
              const duration = 800 + gameRandom() * 400;
        
              setHoles(prev => {
                const next = [...prev];
                if (next[idx].type === "empty") {
                  next[idx] = { type, whacked: false };
                }
                return next;
              });
        
              const t = setTimeout(() => {
                setHoles(prev => {
                  const next = [...prev];
                  if (!next[idx].whacked && next[idx].type !== "empty") {
                    next[idx] = { type: "empty", whacked: false };
                  }
                  return next;
                });
              }, duration);
              timeoutRefs.current.push(t);
            }, 600);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  function whack(idx: number) {
    if (phase !== "playing") return;
    const hole = holes[idx];
    if (hole.type === "empty" || hole.whacked) return;

    if (hole.type === "mole") {
      const newCombo = comboRef.current + 1;
      comboRef.current = newCombo;
      setCombo(newCombo);
      const bonus = Math.min(10, (newCombo - 1) * 2);
      const pts = 10 + bonus;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      setHits(h => h + 1);
      setLastFeedback(`+${pts}${newCombo > 1 ? ` x${newCombo}` : ""}`);
    } else {
      comboRef.current = 0;
      setCombo(0);
      scoreRef.current = Math.max(0, scoreRef.current - 10);
      setScore(scoreRef.current);
      setLastFeedback("-10 💀");
    }

    setHoles(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], whacked: true };
      return next;
    });

    const t = setTimeout(() => {
      setHoles(prev => {
        const next = [...prev];
        next[idx] = { type: "empty", whacked: false };
        return next;
      });
    }, 300);
    timeoutRefs.current.push(t);
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">🔨</div>
        <p className="text-gray-400 text-center max-w-xs">
          Whack the moles as they pop up! Avoid the skulls. Build combos for bonus points!
        </p>
        <button
          onClick={begin}
          className="px-8 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg transition-all"
        >
          Start Game
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const final = Math.min(95, Math.max(0, score));
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="text-5xl">{final >= 30 ? "🎉" : "😅"}</div>
        <p className="text-2xl font-bold text-white">{final >= 30 ? "Great Whacking!" : "Try Again!"}</p>
        <p className="text-4xl font-bold text-amber-400">{final} pts</p>
        <p className="text-gray-400">Moles whacked: {hits}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex justify-between w-full max-w-xs text-sm">
        <span className="text-amber-400 font-bold">Score: {score}</span>
        {combo > 1 && <span className="text-orange-400 font-bold">Combo x{combo}</span>}
        <span className="text-gray-400">⏱ {timeLeft}s</span>
      </div>
      {lastFeedback && (
        <div className={`text-lg font-bold ${lastFeedback.startsWith("+") ? "text-green-400" : "text-red-400"} animate-bounce`}>
          {lastFeedback}
        </div>
      )}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {holes.map((hole, i) => (
          <button
            key={i}
            onClick={() => whack(i)}
            className={`aspect-square rounded-2xl flex items-center justify-center text-4xl transition-all duration-150 ${
              hole.whacked
                ? "bg-yellow-500/30 scale-90"
                : hole.type === "mole"
                ? "bg-amber-700/60 hover:bg-amber-600/70 scale-105 cursor-pointer"
                : hole.type === "skull"
                ? "bg-gray-700/60 hover:bg-gray-600/70 scale-105 cursor-pointer"
                : "bg-gray-800/50 border border-gray-700/50"
            }`}
          >
            {hole.whacked ? "💥" : hole.type === "mole" ? "🐹" : hole.type === "skull" ? "💀" : "🕳️"}
          </button>
        ))}
      </div>
    </div>
  );
}
