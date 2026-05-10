"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function BubblePopPage() {
  return (
    <GameWrapper gameSlug="bubble-pop" gameName="Bubble Pop" gameIcon="🫧">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

const GAME_TIME = 60;
const BUBBLE_COUNT = 12;
const AREA_W = 300;
const AREA_H = 360;
const BUBBLE_SIZE = 52;

const BUBBLE_COLORS = [
  "from-cyan-400 to-blue-500",
  "from-pink-400 to-rose-500",
  "from-green-400 to-emerald-500",
  "from-purple-400 to-violet-500",
  "from-yellow-400 to-orange-500",
  "from-teal-400 to-cyan-500",
  "from-red-400 to-pink-500",
  "from-indigo-400 to-blue-500",
  "from-lime-400 to-green-500",
  "from-amber-400 to-yellow-500",
  "from-fuchsia-400 to-purple-500",
  "from-sky-400 to-blue-500",
];

interface Bubble {
  id: number;
  num: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  popped: boolean;
  color: string;
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [combo, setCombo] = useState(0);
  const [correctPops, setCorrectPops] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; correct: boolean } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const bubblesRef = useRef<Bubble[]>([]);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { correctRef.current = correctPops; }, [correctPops]);
  useEffect(() => { bubblesRef.current = bubbles; }, [bubbles]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const createBubbles = useCallback((): Bubble[] => {
    const arr: Bubble[] = [];
    for (let i = 1; i <= BUBBLE_COUNT; i++) {
      arr.push({
        id: i,
        num: i,
        x: gameRandom() * (AREA_W - BUBBLE_SIZE),
        y: gameRandom() * (AREA_H - BUBBLE_SIZE),
        vx: (gameRandom() - 0.5) * 1.5,
        vy: (gameRandom() - 0.5) * 1.5,
        popped: false,
        color: BUBBLE_COLORS[(i - 1) % BUBBLE_COLORS.length],
      });
    }
    return arr;
  }, []);

  const startAnimation = useCallback(() => {
    const animate = () => {
      setBubbles((prev) =>
        prev.map((b) => {
          if (b.popped) return b;
          let nx = b.x + b.vx;
          let ny = b.y + b.vy;
          let nvx = b.vx;
          let nvy = b.vy;
          if (nx < 0 || nx > AREA_W - BUBBLE_SIZE) nvx = -nvx;
          if (ny < 0 || ny > AREA_H - BUBBLE_SIZE) nvy = -nvy;
          nx = Math.max(0, Math.min(AREA_W - BUBBLE_SIZE, nx));
          ny = Math.max(0, Math.min(AREA_H - BUBBLE_SIZE, ny));
          return { ...b, x: nx, y: ny, vx: nvx, vy: nvy };
        })
      );
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
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
        const newBubbles = createBubbles();
            setBubbles(newBubbles);
            bubblesRef.current = newBubbles;
            setNextNumber(1);
            setScore(0);
            scoreRef.current = 0;
            setCorrectPops(0);
            correctRef.current = 0;
            setCombo(0);
            setTimeLeft(GAME_TIME);
            setFeedback(null);
            setPhase("playing");
        
            startAnimation();
        
            timerRef.current = setInterval(() => {
              setTimeLeft((t) => {
                if (t <= 1) {
                  if (timerRef.current) clearInterval(timerRef.current);
                  if (animRef.current) cancelAnimationFrame(animRef.current);
                  const finalScore = Math.min(95, scoreRef.current);
                  setPhase("done");
                  onGameComplete({ score: finalScore, won: correctRef.current >= 6 });
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

  function popBubble(bubble: Bubble) {
    if (phase !== "playing" || bubble.popped) return;

    if (bubble.num === nextNumber) {
      const comboBonus = combo >= 2 ? combo * 2 : 0;
      const pts = 7 + comboBonus;
      const newScore = scoreRef.current + pts;
      setScore(newScore);
      scoreRef.current = newScore;
      setCombo((c) => c + 1);
      setCorrectPops((c) => c + 1);
      correctRef.current += 1;
      setNextNumber((n) => n + 1);
      setBubbles((prev) => prev.map((b) => b.id === bubble.id ? { ...b, popped: true } : b));
      showFeedback(`+${pts}${comboBonus > 0 ? " Combo!" : ""}`, true);

      // Check if all popped
      if (nextNumber >= BUBBLE_COUNT) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (animRef.current) cancelAnimationFrame(animRef.current);
        const finalScore = Math.min(95, newScore);
        setPhase("done");
        onGameComplete({ score: finalScore, won: true });
      }
    } else {
      const newScore = Math.max(0, scoreRef.current - 5);
      setScore(newScore);
      scoreRef.current = newScore;
      setCombo(0);
      showFeedback("-5 Wrong order!", false);
    }
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">🫧</div>
        <p className="text-gray-400 text-center max-w-xs">
          Pop the bubbles in order! Start with 1, then 2, then 3... Wrong order costs points!
        </p>
        <button
          onClick={init}
          className="px-8 py-3 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/30"
        >
          Start Popping
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Stats */}
      <div className="flex justify-between w-full max-w-xs text-sm">
        <span className="text-gray-400">Next: <span className="text-cyan-400 font-bold">{nextNumber}</span></span>
        <span className={`font-bold ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-gray-300"}`}>
          {timeLeft}s
        </span>
        <span className="text-yellow-400 font-bold">Score: {score}</span>
      </div>

      {/* Timer bar */}
      <div className="w-full max-w-xs h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000"
          style={{ width: `${(timeLeft / GAME_TIME) * 100}%` }}
        />
      </div>

      {/* Combo */}
      {combo >= 2 && (
        <div className="text-sm text-orange-400 font-bold animate-pulse">{combo}x Combo!</div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className={`text-lg font-bold animate-pulse ${feedback.correct ? "text-green-400" : "text-red-400"}`}>
          {feedback.text}
        </div>
      )}

      {/* Bubble area */}
      <div
        className="relative bg-gray-900/80 rounded-xl border border-gray-700 overflow-hidden"
        style={{ width: AREA_W, height: AREA_H }}
      >
        {bubbles.filter((b) => !b.popped).map((b) => (
          <button
            key={b.id}
            onClick={() => popBubble(b)}
            className={`absolute rounded-full bg-gradient-to-br ${b.color} flex items-center justify-center font-bold text-white text-lg shadow-lg hover:scale-110 transition-transform border-2 border-white/30`}
            style={{
              left: b.x,
              top: b.y,
              width: BUBBLE_SIZE,
              height: BUBBLE_SIZE,
            }}
          >
            {b.num}
          </button>
        ))}
      </div>

      {/* Done */}
      {phase === "done" && (
        <div className="text-center space-y-3">
          <p className="text-lg font-bold text-white">
            {correctPops >= 6 ? "Great popping!" : "Keep trying!"}
          </p>
          <p className="text-gray-400">{correctPops} bubbles popped correctly</p>
          <button
            onClick={init}
            className="px-6 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 transition-all"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
