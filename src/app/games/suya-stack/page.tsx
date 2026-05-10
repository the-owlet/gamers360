"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function SuyaStackPage() {
  return (
    <GameWrapper gameSlug="suya-stack" gameName="Suya Stack" gameIcon="🥩">
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
  const [stack, setStack] = useState<{ width: number; x: number }[]>([]);
  const [currentX, setCurrentX] = useState(50);
  const [currentWidth, setCurrentWidth] = useState(80);
  const [direction, setDirection] = useState(1);
  const [speed, setSpeed] = useState(2);
  const [stacked, setStacked] = useState(0);
  const [perfectStreak, setPerfectStreak] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<"perfect" | "good" | "miss" | null>(null);
  const scoreRef = useRef(0);
  const stackedRef = useRef(0);
  const animRef = useRef<number>(undefined);
  const xRef = useRef(50);
  const dirRef = useRef(1);
  const speedRef = useRef(2);
  const widthRef = useRef(80);
  const maxPieces = 10;

  const cleanup = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  function animate() {
    xRef.current += dirRef.current * speedRef.current;
    if (xRef.current > 95) { xRef.current = 95; dirRef.current = -1; }
    if (xRef.current < 5) { xRef.current = 5; dirRef.current = 1; }
    setCurrentX(xRef.current);
    animRef.current = requestAnimationFrame(animate);
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
            setStack([{ width: 80, x: 50 }]);
            setCurrentWidth(80); widthRef.current = 80;
            setCurrentX(50); xRef.current = 50;
            setDirection(1); dirRef.current = 1;
            setSpeed(2); speedRef.current = 2;
            setStacked(0); stackedRef.current = 0;
            setPerfectStreak(0);
            setLastFeedback(null);
            setPhase("playing");
            animRef.current = requestAnimationFrame(animate);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  function drop() {
    if (phase !== "playing") return;
    cleanup();

    const topPiece = stack[stack.length - 1];
    const overlapLeft = Math.max(xRef.current - widthRef.current / 2, topPiece.x - topPiece.width / 2);
    const overlapRight = Math.min(xRef.current + widthRef.current / 2, topPiece.x + topPiece.width / 2);
    const overlap = overlapRight - overlapLeft;

    if (overlap <= 0) {
      setLastFeedback("miss");
      setPhase("done");
      setTimeout(() => {
        const final = Math.min(95, Math.max(0, scoreRef.current));
        onGameComplete({ score: final, won: stackedRef.current >= 6 });
      }, 500);
      return;
    }

    const newWidth = overlap;
    const newX = (overlapLeft + overlapRight) / 2;
    const accuracy = overlap / widthRef.current;
    const isPerfect = accuracy > 0.9;

    let pts: number;
    if (isPerfect) {
      pts = 10;
      setPerfectStreak(s => s + 1);
      setLastFeedback("perfect");
    } else {
      pts = Math.round(accuracy * 8);
      setPerfectStreak(0);
      setLastFeedback("good");
    }

    scoreRef.current += pts;
    stackedRef.current += 1;
    setScore(scoreRef.current);
    setStacked(stackedRef.current);
    setStack(s => [...s, { width: newWidth, x: newX }]);

    if (stackedRef.current >= maxPieces) {
      scoreRef.current += 10;
      setScore(scoreRef.current);
      setPhase("done");
      setTimeout(() => {
        const final = Math.min(95, scoreRef.current);
        onGameComplete({ score: final, won: true });
      }, 500);
      return;
    }

    widthRef.current = newWidth;
    setCurrentWidth(newWidth);
    speedRef.current = Math.min(5, 2 + stackedRef.current * 0.3);
    xRef.current = gameRandom() > 0.5 ? 10 : 90;
    dirRef.current = xRef.current < 50 ? 1 : -1;
    setCurrentX(xRef.current);

    setTimeout(() => {
      setLastFeedback(null);
      animRef.current = requestAnimationFrame(animate);
    }, 300);
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🥩</div>
        <p className="text-gray-400 mb-2">Stack the suya on the skewer — perfect alignment = max points!</p>
        <p className="text-gray-500 text-sm mb-6">10 pieces. Tap at the right time. Miss completely and game done!</p>
        <button onClick={begin} className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-orange-500/20 text-lg">
          🥩 Start Stacking
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">Stacked: <span className="text-orange-400 font-bold">{stacked}/{maxPieces}</span></div>
        <div className="text-sm text-gray-400">
          {perfectStreak >= 2 && <span className="text-yellow-400 font-bold">🔥 {perfectStreak}x Perfect! </span>}
        </div>
        <div className="text-sm text-gray-400">Score: <span className="text-yellow-400 font-bold">{score}</span></div>
      </div>

      <div className="relative bg-gray-800/50 border border-white/10 rounded-2xl overflow-hidden" style={{ height: 300 }}>
        {/* Stacked pieces */}
        {stack.map((piece, i) => (
          <div
            key={i}
            className="absolute rounded-sm"
            style={{
              left: `${piece.x - piece.width / 2}%`,
              bottom: `${i * 24}px`,
              width: `${piece.width}%`,
              height: 22,
              background: `linear-gradient(135deg, hsl(${20 + i * 8}, 80%, ${50 - i * 2}%), hsl(${10 + i * 8}, 90%, ${40 - i * 2}%))`,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
        ))}

        {/* Moving piece */}
        {phase === "playing" && (
          <div
            className="absolute rounded-sm transition-none"
            style={{
              left: `${currentX - currentWidth / 2}%`,
              bottom: `${stack.length * 24}px`,
              width: `${currentWidth}%`,
              height: 22,
              background: `linear-gradient(135deg, hsl(${20 + stack.length * 8}, 80%, 55%), hsl(${10 + stack.length * 8}, 90%, 45%))`,
              border: "2px solid rgba(255,255,255,0.3)",
            }}
          />
        )}

        {/* Feedback */}
        {lastFeedback && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`text-2xl font-black animate-bounce ${
              lastFeedback === "perfect" ? "text-yellow-400" :
              lastFeedback === "good" ? "text-green-400" : "text-red-400"
            }`}>
              {lastFeedback === "perfect" ? "PERFECT! 🔥" : lastFeedback === "good" ? "Nice!" : "MISSED! 💀"}
            </div>
          </div>
        )}
      </div>

      {phase === "playing" && (
        <div className="text-center mt-4">
          <button
            onClick={drop}
            className="bg-gradient-to-r from-orange-400 to-red-500 text-white font-black px-12 py-4 rounded-xl text-xl hover:opacity-90 active:scale-95 transition shadow-lg shadow-orange-500/20"
          >
            🥩 DROP!
          </button>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center py-6">
          <div className="text-3xl font-black text-yellow-400 mb-1">
            {stacked >= maxPieces ? "Perfect Stack!" : stacked >= 6 ? "Nice Stack!" : "Stack Collapsed!"}
          </div>
          <div className="text-gray-400 text-sm">Stacked: {stacked}/{maxPieces} | Score: {Math.min(95, Math.max(0, score))}</div>
        </div>
      )}
    </div>
  );
}
