"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function AimTrainerPage() {
  return (
    <GameWrapper gameSlug="aim-trainer" gameName="Aim Trainer" gameIcon="🎯">
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
  const [target, setTarget] = useState<{ x: number; y: number; size: number; id: number } | null>(null);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<{ x: number; y: number; type: "hit" | "miss" } | null>(null);
  const scoreRef = useRef(0);
  const hitsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const targetRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const idRef = useRef(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (targetRef.current) clearTimeout(targetRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  function spawnTarget() {
    const x = 10 + gameRandom() * 80;
    const y = 10 + gameRandom() * 80;
    const size = 40 + gameRandom() * 20;
    setTarget({ x, y, size, id: ++idRef.current });
    targetRef.current = setTimeout(() => {
      setTarget(null);
      setTimeout(spawnTarget, 200);
    }, 1500);
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
            setHits(0); hitsRef.current = 0;
            setMisses(0);
            setTimeLeft(60);
            setPhase("playing");
            setTimeout(spawnTarget, 500);
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  cleanup();
                  setTarget(null);
                  setPhase("done");
                  setTimeout(() => {
                    const final = Math.min(95, scoreRef.current);
                    onGameComplete({ score: final, won: hitsRef.current >= 8 });
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

  function handleHit(e: React.MouseEvent) {
    e.stopPropagation();
    if (!target) return;
    const pts = target.size < 45 ? 12 : 10;
    scoreRef.current += pts;
    hitsRef.current += 1;
    setScore(scoreRef.current);
    setHits(hitsRef.current);
    setFeedback({ x: target.x, y: target.y, type: "hit" });
    setTimeout(() => setFeedback(null), 400);
    if (targetRef.current) clearTimeout(targetRef.current);
    setTarget(null);
    setTimeout(spawnTarget, 300);
  }

  function handleMiss(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMisses(m => m + 1);
    setFeedback({ x, y, type: "miss" });
    setTimeout(() => setFeedback(null), 400);
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🎯</div>
        <p className="text-gray-400 mb-2">Targets dey pop up — click am before dem vanish!</p>
        <p className="text-gray-500 text-sm mb-6">60 seconds. Smaller targets = more points. How sharp your eye be?</p>
        <button onClick={begin} className="bg-gradient-to-r from-red-500 to-orange-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-red-500/20 text-lg">
          🎯 Start Training
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">Hits: <span className="text-green-400 font-bold">{hits}</span></div>
        <div className="text-sm text-gray-400">Time: <span className={`font-bold ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span></div>
        <div className="text-sm text-gray-400">Score: <span className="text-yellow-400 font-bold">{score}</span></div>
      </div>

      {phase === "playing" && (
        <div
          className="relative bg-gray-800/50 border border-white/10 rounded-2xl overflow-hidden cursor-crosshair"
          style={{ height: 320 }}
          onClick={handleMiss}
        >
          {target && (
            <div
              className="absolute rounded-full bg-red-500 hover:bg-red-400 transition-all cursor-pointer animate-pulse border-2 border-red-300/50"
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
                width: target.size,
                height: target.size,
                transform: "translate(-50%, -50%)",
              }}
              onClick={handleHit}
            >
              <div className="absolute inset-1/4 rounded-full bg-red-300/50" />
              <div className="absolute inset-[40%] rounded-full bg-white/60" />
            </div>
          )}
          {feedback && (
            <div
              className={`absolute text-sm font-bold pointer-events-none ${feedback.type === "hit" ? "text-green-400" : "text-red-400"}`}
              style={{ left: `${feedback.x}%`, top: `${feedback.y}%`, transform: "translate(-50%, -50%)" }}
            >
              {feedback.type === "hit" ? "✓" : "✗"}
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="text-center py-8">
          <div className="text-3xl font-black text-yellow-400 mb-1">{hits >= 8 ? "Sharp Eye!" : "Keep Practicing!"}</div>
          <div className="text-gray-400 text-sm">Hits: {hits} | Misses: {misses} | Score: {Math.min(95, score)}</div>
        </div>
      )}
    </div>
  );
}
