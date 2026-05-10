"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function ReactionChainPage() {
  return (
    <GameWrapper gameSlug="reaction-chain" gameName="Reaction Chain" gameIcon="⚡">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

const ROUND_COUNTS = [6, 8, 10, 12, 15];

interface CirclePos {
  num: number;
  x: number;
  y: number;
}

function generateCircles(count: number): CirclePos[] {
  const circles: CirclePos[] = [];
  const minDist = 55;

  for (let i = 1; i <= count; i++) {
    let attempts = 0;
    let x: number, y: number;

    do {
      x = 30 + gameRandom() * 240;
      y = 30 + gameRandom() * 240;
      attempts++;
    } while (
      attempts < 50 &&
      circles.some(c => Math.sqrt((c.x - x) ** 2 + (c.y - y) ** 2) < minDist)
    );

    circles.push({ num: i, x, y });
  }

  return circles;
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [score, setScore] = useState(0);
  const scoreRef = useRef<number>(0);
  const [timeLeft, setTimeLeft] = useState(75);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const [roundNum, setRoundNum] = useState(0);
  const [circles, setCircles] = useState<CirclePos[]>([]);
  const [nextNum, setNextNum] = useState(1);
  const [visibleNums, setVisibleNums] = useState<Set<number>>(new Set());
  const [clickedNums, setClickedNums] = useState<Set<number>>(new Set());
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const roundsCompletedRef = useRef<number>(0);
  const [roundStartTime, setRoundStartTime] = useState(0);
  const [wrongClick, setWrongClick] = useState(false);
  const [lastClickPos, setLastClickPos] = useState<{ x: number; y: number } | null>(null);
  const [feedback, setFeedback] = useState<string>("");

  const wrongTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startRound = useCallback((num: number) => {
    const count = ROUND_COUNTS[num - 1] || 15;
    const newCircles = generateCircles(count);
    setCircles(newCircles);
    setRoundNum(num);
    setNextNum(1);
    setClickedNums(new Set());
    setVisibleNums(new Set([1])); // Only show #1 initially
    setRoundStartTime(Date.now());
    setWrongClick(false);
    setLastClickPos(null);
    setFeedback("");
  }, []);

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
            setTimeLeft(75);
            setRoundsCompleted(0);
            roundsCompletedRef.current = 0;
            setPhase("playing");
            startRound(1);
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  cleanup();
                  setPhase("done");
                  setTimeout(() => {
                    const final = Math.min(95, Math.max(0, scoreRef.current));
                    onGameComplete({ score: final, won: roundsCompletedRef.current >= 3 });
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

  function clickCircle(num: number, x: number, y: number) {
    if (phase !== "playing") return;

    setLastClickPos({ x, y });

    if (num !== nextNum) {
      // Wrong order!
      setWrongClick(true);
      if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current);
      wrongTimeoutRef.current = setTimeout(() => setWrongClick(false), 400);
      return;
    }

    // Correct click
    const newClicked = new Set(clickedNums);
    newClicked.add(num);
    setClickedNums(newClicked);

    const totalCount = ROUND_COUNTS[roundNum - 1] || 15;
    const newNext = num + 1;
    setNextNum(newNext);

    // Reveal next number
    if (newNext <= totalCount) {
      setVisibleNums(prev => new Set([...prev, newNext]));
    }

    // Check if round complete
    if (newClicked.size >= totalCount) {
      const elapsed = (Date.now() - roundStartTime) / 1000;
      const speedBonus = Math.max(0, Math.round((30 - elapsed) * 0.5));
      const basePts = 8 + roundNum * 2;
      const pts = basePts + speedBonus;
      const newScore = scoreRef.current + pts;
      scoreRef.current = newScore;
      setScore(newScore);

      const newCompleted = roundsCompleted + 1;
      setRoundsCompleted(newCompleted);
      roundsCompletedRef.current = newCompleted;

      setFeedback(`Round done in ${elapsed.toFixed(1)}s! ${speedBonus > 0 ? `+${speedBonus} speed bonus!` : ""}`);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);

      if (roundNum < 5) {
        feedbackTimeoutRef.current = setTimeout(() => {
          startRound(roundNum + 1);
        }, 1200);
      } else {
        // All 5 rounds done
        cleanup();
        setPhase("done");
        setTimeout(() => {
          const final = Math.min(95, Math.max(0, scoreRef.current));
          onGameComplete({ score: final, won: newCompleted >= 3 });
        }, 500);
      }
    }
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">⚡</div>
        <p className="text-gray-400 mb-2">Click numbered circles in order as fast as possible!</p>
        <p className="text-gray-500 text-sm mb-6">5 rounds, 75 seconds. Complete 3+ rounds to win!</p>
        <button
          onClick={begin}
          className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-yellow-500/20 text-lg"
        >
          ⚡ Start Chain!
        </button>
      </div>
    );
  }

  const totalCount = ROUND_COUNTS[roundNum - 1] || 15;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">
          Time: <span className={`font-bold ${timeLeft <= 15 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span>
        </div>
        <div className="text-sm text-gray-400">
          Round: <span className="text-white font-bold">{roundNum}/5</span>
          <span className="text-gray-600 text-xs ml-1">({totalCount} circles)</span>
        </div>
        <div className="text-sm text-gray-400">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2 px-2">
        <div className="text-xs text-gray-500">
          {roundsCompleted} round{roundsCompleted !== 1 ? "s" : ""} completed
        </div>
        <div className="text-xs text-gray-500">
          Next: <span className="text-cyan-400 font-bold">{nextNum <= totalCount ? nextNum : "Done!"}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-2 mb-4 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 transition-all duration-200"
          style={{ width: `${(clickedNums.size / totalCount) * 100}%` }}
        />
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="text-center text-sm font-bold text-green-400 mb-2 animate-pulse">
          {feedback}
        </div>
      )}

      {wrongClick && (
        <div className="text-center text-sm font-bold text-red-400 mb-2">
          Wrong order! Find #{nextNum} first!
        </div>
      )}

      {/* Game area */}
      {phase === "playing" && (
        <div
          className="relative mx-auto bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden"
          style={{ width: 300, height: 300 }}
        >
          {/* Grid lines for visual effect */}
          <div className="absolute inset-0 opacity-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`h-${i}`} className="absolute w-full border-t border-gray-500" style={{ top: `${(i + 1) * 20}%` }} />
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`v-${i}`} className="absolute h-full border-l border-gray-500" style={{ left: `${(i + 1) * 20}%` }} />
            ))}
          </div>

          {circles.map(circle => {
            const isClicked = clickedNums.has(circle.num);
            const isVisible = visibleNums.has(circle.num);
            const isNext = circle.num === nextNum;

            if (!isVisible && !isClicked) return null;

            return (
              <button
                key={circle.num}
                onClick={() => clickCircle(circle.num, circle.x, circle.y)}
                disabled={isClicked}
                className={`absolute flex items-center justify-center rounded-full font-bold text-sm transition-all duration-200 ${
                  isClicked
                    ? "w-8 h-8 bg-green-500/20 text-green-400/40 border border-green-500/30 cursor-default"
                    : isNext
                    ? "w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 text-black border-2 border-yellow-300 hover:scale-110 active:scale-95 cursor-pointer shadow-lg shadow-yellow-500/30 animate-pulse"
                    : "w-10 h-10 bg-gray-600 text-gray-300 border-2 border-gray-500 hover:scale-105 active:scale-95 cursor-pointer hover:bg-gray-500"
                }`}
                style={{
                  left: circle.x - (isClicked ? 16 : isNext ? 24 : 20),
                  top: circle.y - (isClicked ? 16 : isNext ? 24 : 20),
                }}
              >
                {circle.num}
              </button>
            );
          })}

          {/* Click ripple effect */}
          {lastClickPos && !wrongClick && (
            <div
              className="absolute w-6 h-6 rounded-full border-2 border-cyan-400 animate-ping pointer-events-none"
              style={{
                left: lastClickPos.x - 12,
                top: lastClickPos.y - 12,
              }}
            />
          )}
        </div>
      )}

      {/* Round info boxes */}
      {phase === "playing" && (
        <div className="flex justify-center gap-2 mt-4">
          {ROUND_COUNTS.map((count, i) => (
            <div
              key={i}
              className={`text-xs px-2 py-1 rounded-lg ${
                i + 1 < roundNum
                  ? "bg-green-500/20 text-green-400"
                  : i + 1 === roundNum
                  ? "bg-yellow-500/20 text-yellow-400 font-bold"
                  : "bg-gray-700 text-gray-500"
              }`}
            >
              R{i + 1}: {count}
            </div>
          ))}
        </div>
      )}

      {phase === "done" && (
        <div className="text-center py-8">
          <div className="text-3xl font-black text-yellow-400 mb-2">
            {roundsCompleted >= 3 ? "Lightning speed! ⚡🔥" : "Not fast enough! 💨"}
          </div>
          <div className="text-gray-400 text-sm">
            {roundsCompleted}/5 rounds completed | Score: {Math.min(95, Math.max(0, score))}
          </div>
        </div>
      )}
    </div>
  );
}
