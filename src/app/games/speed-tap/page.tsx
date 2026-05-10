"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function SpeedTapPage() {
  return (
    <GameWrapper gameSlug="speed-tap" gameName="Speed Tap" gameIcon="⚡">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

const TARGETS = [
  { emoji: "🎯", points: 10, color: "bg-red-500" },
  { emoji: "⭐", points: 15, color: "bg-yellow-500" },
  { emoji: "💎", points: 20, color: "bg-cyan-500" },
  { emoji: "👑", points: 25, color: "bg-purple-500" },
  { emoji: "💣", points: -15, color: "bg-gray-600" },
];

interface Target {
  id: number;
  type: number;
  x: number;
  y: number;
  spawned: number;
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [targets, setTargets] = useState<Target[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [tapped, setTapped] = useState(0);
  const [missed, setMissed] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lastHit, setLastHit] = useState("");
  const idRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const spawnRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const scoreRef = useRef(0);

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
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
            setTapped(0);
            setMissed(0);
            setCombo(0);
            setTargets([]);
            setTimeLeft(60);
            setLastHit("");
            setPhase("playing");
            idRef.current = 0;
        
            intervalRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  cleanup();
                  setPhase("done");
                  setTimeout(() => {
                    const final = Math.min(90, Math.max(0, scoreRef.current));
                    onGameComplete({ score: final, won: final >= 20 });
                  }, 500);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
        
            spawnRef.current = setInterval(() => {
              const typeIdx = gameRandom() < 0.15 ? 4 : Math.floor(gameRandom() * 4);
              const t: Target = {
                id: ++idRef.current,
                type: typeIdx,
                x: 10 + gameRandom() * 75,
                y: 10 + gameRandom() * 70,
                spawned: Date.now(),
              };
              setTargets(prev => {
                const now = Date.now();
                const alive = prev.filter(t => now - t.spawned < 2000);
                return [...alive, t].slice(-8);
              });
            }, 600);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  function tapTarget(id: number, typeIdx: number) {
    if (phase !== "playing") return;
    const t = TARGETS[typeIdx];

    setTargets(prev => prev.filter(t => t.id !== id));

    if (typeIdx === 4) {
      const newCombo = 0;
      const pts = t.points;
      const newScore = Math.max(0, scoreRef.current + pts);
      scoreRef.current = newScore;
      setScore(newScore);
      setCombo(newCombo);
      setLastHit("💣 Bomb! -15");
    } else {
      const newCombo = combo + 1;
      const comboMult = Math.min(3, 1 + (newCombo - 1) * 0.3);
      const pts = Math.round(t.points * comboMult);
      const newScore = scoreRef.current + pts;
      scoreRef.current = newScore;
      setScore(newScore);
      setCombo(newCombo);
      setTapped(prev => prev + 1);
      setLastHit(`${t.emoji} +${pts}${newCombo > 2 ? ` (${newCombo}x!)` : ""}`);
    }
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">⚡</div>
        <p className="text-gray-400 mb-2">Tap targets as fast as you can!</p>
        <p className="text-gray-500 text-sm mb-6">60 seconds — avoid bombs, build combos for bonus points</p>
        <button
          onClick={begin}
          className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-orange-500/20 text-lg"
        >
          ⚡ Start Tapping!
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">
          Time: <span className={`font-bold ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span>
        </div>
        <div className="text-sm text-gray-400">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
        {combo > 2 && (
          <div className="text-xs text-orange-400 font-bold animate-pulse">{combo}x combo!</div>
        )}
      </div>

      {lastHit && (
        <div className="text-center mb-2">
          <span className="text-xs font-bold text-green-400 animate-bounce">{lastHit}</span>
        </div>
      )}

      <div className="relative w-full h-72 bg-gray-800/50 rounded-2xl border border-white/10 overflow-hidden">
        {targets.map(t => (
          <button
            key={t.id}
            onClick={() => tapTarget(t.id, t.type)}
            className={`absolute w-12 h-12 rounded-full ${TARGETS[t.type].color} flex items-center justify-center
              text-xl transition-transform hover:scale-110 active:scale-90 shadow-lg animate-pulse cursor-pointer`}
            style={{ left: `${t.x}%`, top: `${t.y}%`, transform: "translate(-50%, -50%)" }}
          >
            {TARGETS[t.type].emoji}
          </button>
        ))}

        {phase === "done" && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-black text-yellow-400 mb-1">Time's Up!</div>
              <div className="text-gray-400 text-sm">Targets hit: {tapped} | Score: {Math.min(90, Math.max(0, score))}</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
        <span>🎯 10pts</span>
        <span>⭐ 15pts</span>
        <span>💎 20pts</span>
        <span>👑 25pts</span>
        <span>💣 -15pts</span>
      </div>
    </div>
  );
}
