"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function CargoSortPage() {
  return (
    <GameWrapper gameSlug="cargo-sort" gameName="Cargo Sort" gameIcon="📦">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

const GAME_TIME = 60;
const BIN_COLORS = [
  { name: "Red", bg: "bg-red-500", border: "border-red-400", key: "red" },
  { name: "Blue", bg: "bg-blue-500", border: "border-blue-400", key: "blue" },
  { name: "Green", bg: "bg-green-500", border: "border-green-400", key: "green" },
];

const BOX_STYLES: Record<string, { bg: string; border: string; emoji: string }> = {
  red: { bg: "bg-red-400", border: "border-red-300", emoji: "🔴" },
  blue: { bg: "bg-blue-400", border: "border-blue-300", emoji: "🔵" },
  green: { bg: "bg-green-400", border: "border-green-300", emoji: "🟢" },
};

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [currentBox, setCurrentBox] = useState<string>("red");
  const [boxY, setBoxY] = useState(0);
  const [combo, setCombo] = useState(0);
  const [sorted, setSorted] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; correct: boolean } | null>(null);
  const [speed, setSpeed] = useState(1.5);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const phaseRef = useRef<"idle" | "playing" | "done">("idle");
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(1.5);
  const sortedRef = useRef(0);

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { sortedRef.current = sorted; }, [sorted]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const pickBox = useCallback(() => {
    const colors = ["red", "blue", "green"];
    return colors[Math.floor(gameRandom() * colors.length)];
  }, []);

  const spawnBox = useCallback(() => {
    setCurrentBox(pickBox());
    setBoxY(0);
  }, [pickBox]);

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
            setCombo(0);
            comboRef.current = 0;
            setSorted(0);
            sortedRef.current = 0;
            setTimeLeft(GAME_TIME);
            setFeedback(null);
            setSpeed(1.5);
            speedRef.current = 1.5;
            setPhase("playing");
            phaseRef.current = "playing";
            spawnBox();
        
            // Falling animation
            let y = 0;
            const fall = () => {
              if (phaseRef.current !== "playing") return;
              y += speedRef.current;
              if (y >= 260) {
                // Missed - box hit bottom
                const newScore = Math.max(0, scoreRef.current - 3);
                setScore(newScore);
                scoreRef.current = newScore;
                setCombo(0);
                comboRef.current = 0;
                y = 0;
                setCurrentBox(pickBox());
              }
              setBoxY(y);
              animRef.current = requestAnimationFrame(fall);
            };
            animRef.current = requestAnimationFrame(fall);
        
            timerRef.current = setInterval(() => {
              setTimeLeft((t) => {
                if (t <= 1) {
                  if (timerRef.current) clearInterval(timerRef.current);
                  if (animRef.current) cancelAnimationFrame(animRef.current);
                  phaseRef.current = "done";
                  const finalScore = Math.min(95, scoreRef.current);
                  setPhase("done");
                  onGameComplete({ score: finalScore, won: scoreRef.current >= 30 });
                  return 0;
                }
                // Speed up over time
                const elapsed = GAME_TIME - t + 1;
                const newSpeed = 1.5 + elapsed * 0.12;
                setSpeed(newSpeed);
                speedRef.current = newSpeed;
                return t - 1;
              });
            }, 1000);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  function sortBox(binColor: string) {
    if (phase !== "playing") return;

    if (binColor === currentBox) {
      const comboBonus = comboRef.current >= 3 ? 3 : 0;
      const pts = 5 + comboBonus;
      const newScore = scoreRef.current + pts;
      setScore(newScore);
      scoreRef.current = newScore;
      setCombo((c) => c + 1);
      comboRef.current += 1;
      setSorted((s) => s + 1);
      sortedRef.current += 1;
      showFeedback(`+${pts}${comboBonus > 0 ? " Combo!" : ""}`, true);
    } else {
      const newScore = Math.max(0, scoreRef.current - 5);
      setScore(newScore);
      scoreRef.current = newScore;
      setCombo(0);
      comboRef.current = 0;
      showFeedback("-5 Wrong!", false);
    }

    setBoxY(0);
    setCurrentBox(pickBox());
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">📦</div>
        <p className="text-gray-400 text-center max-w-xs">
          Sort colored boxes into matching bins! Tap the correct bin before the box falls. Boxes come faster over time!
        </p>
        <button
          onClick={init}
          className="px-8 py-3 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/30"
        >
          Start Sorting
        </button>
      </div>
    );
  }

  const boxStyle = BOX_STYLES[currentBox];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Stats */}
      <div className="flex justify-between w-full max-w-xs text-sm">
        <span className="text-gray-400">Sorted: {sorted}</span>
        <span className={`font-bold ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-gray-300"}`}>
          {timeLeft}s
        </span>
        <span className="text-yellow-400 font-bold">Score: {score}</span>
      </div>

      {/* Timer bar */}
      <div className="w-full max-w-xs h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
          style={{ width: `${(timeLeft / GAME_TIME) * 100}%` }}
        />
      </div>

      {/* Combo */}
      {combo >= 3 && (
        <div className="text-sm text-orange-400 font-bold animate-pulse">{combo}x Combo!</div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className={`text-lg font-bold animate-pulse ${feedback.correct ? "text-green-400" : "text-red-400"}`}>
          {feedback.text}
        </div>
      )}

      {/* Game area */}
      <div className="relative bg-gray-900/80 rounded-xl border border-gray-700 overflow-hidden"
        style={{ width: 300, height: 340 }}
      >
        {/* Falling box */}
        {phase === "playing" && (
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-14 h-14 ${boxStyle.bg} rounded-lg border-2 ${boxStyle.border} flex items-center justify-center text-2xl shadow-lg transition-none`}
            style={{ top: boxY }}
          >
            {boxStyle.emoji}
          </div>
        )}

        {/* Bins at bottom */}
        <div className="absolute bottom-0 inset-x-0 flex justify-around p-2">
          {BIN_COLORS.map((bin) => (
            <button
              key={bin.key}
              onClick={() => sortBox(bin.key)}
              className={`w-20 h-20 ${bin.bg} rounded-xl border-2 ${bin.border} flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-transform shadow-lg`}
            >
              <span className="text-2xl">🗑️</span>
              <span className="text-xs font-bold text-white/90">{bin.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Done */}
      {phase === "done" && (
        <div className="text-center space-y-3">
          <p className="text-lg font-bold text-white">
            {score >= 30 ? "Great sorting!" : "Keep sorting!"}
          </p>
          <p className="text-gray-400">{sorted} boxes sorted correctly</p>
          <button
            onClick={init}
            className="px-6 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 transition-all"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
