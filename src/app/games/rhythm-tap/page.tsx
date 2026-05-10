"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function RhythmTapPage() {
  return (
    <GameWrapper gameSlug="rhythm-tap" gameName="Rhythm Tap" gameIcon="🥁">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

const BEAT_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316", "#06b6d4"];

interface Round {
  pattern: number[];
  length: number;
}

function generateRound(roundNum: number): Round {
  const length = Math.min(7, 3 + Math.floor(roundNum / 2));
  const numPads = Math.min(6, 4 + Math.floor(roundNum / 3));
  const pattern: number[] = [];
  for (let i = 0; i < length; i++) {
    pattern.push(Math.floor(gameRandom() * numPads));
  }
  return { pattern, length };
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [score, setScore] = useState(0);
  const scoreRef = useRef<number>(0);
  const [timeLeft, setTimeLeft] = useState(70);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const [roundNum, setRoundNum] = useState(0);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [subPhase, setSubPhase] = useState<"watch" | "replay" | "feedback">("watch");
  const [showingIdx, setShowingIdx] = useState(-1);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [flashPad, setFlashPad] = useState<number>(-1);

  const showTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const numPads = 6;

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const showPattern = useCallback((round: Round) => {
    setSubPhase("watch");
    setShowingIdx(-1);
    let i = 0;
    const show = () => {
      if (i < round.pattern.length) {
        setShowingIdx(round.pattern[i]);
        showTimeoutRef.current = setTimeout(() => {
          setShowingIdx(-1);
          showTimeoutRef.current = setTimeout(() => {
            i++;
            show();
          }, 200);
        }, 500);
      } else {
        showTimeoutRef.current = setTimeout(() => {
          setSubPhase("replay");
          setPlayerInput([]);
        }, 400);
      }
    };
    showTimeoutRef.current = setTimeout(show, 600);
  }, []);

  const startRound = useCallback((num: number) => {
    const round = generateRound(num);
    setCurrentRound(round);
    setRoundNum(num);
    setFeedback(null);
    showPattern(round);
  }, [showPattern]);

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
            setTimeLeft(70);
            setCorrectCount(0);
            setStreak(0);
            setFeedback(null);
            setPhase("playing");
        
            startRound(1);
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  cleanup();
                  setPhase("done");
                  setTimeout(() => {
                    const final = Math.min(95, Math.max(0, scoreRef.current));
                    onGameComplete({ score: final, won: scoreRef.current >= 30 });
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

  function tapPad(padIdx: number) {
    if (phase !== "playing" || subPhase !== "replay" || !currentRound) return;

    const newInput = [...playerInput, padIdx];
    setPlayerInput(newInput);
    setFlashPad(padIdx);
    setTimeout(() => setFlashPad(-1), 150);

    const pos = newInput.length - 1;

    if (padIdx !== currentRound.pattern[pos]) {
      // Wrong tap - round failed
      setStreak(0);
      setFeedback("wrong");
      setSubPhase("feedback");
      feedbackTimeoutRef.current = setTimeout(() => {
        if (roundNum < 8) {
          startRound(roundNum + 1);
        } else {
          cleanup();
          setPhase("done");
          setTimeout(() => {
            const final = Math.min(95, Math.max(0, scoreRef.current));
            onGameComplete({ score: final, won: correctCount >= 5 });
          }, 500);
        }
      }, 1200);
      return;
    }

    if (newInput.length === currentRound.pattern.length) {
      // Pattern complete!
      const newStreak = streak + 1;
      const streakBonus = Math.min(3, 1 + (newStreak - 1) * 0.4);
      const pts = Math.round((5 + currentRound.length * 2) * streakBonus);
      const newScore = scoreRef.current + pts;
      scoreRef.current = newScore;
      setScore(newScore);
      setStreak(newStreak);
      setCorrectCount(prev => prev + 1);
      setFeedback("correct");
      setSubPhase("feedback");

      feedbackTimeoutRef.current = setTimeout(() => {
        if (roundNum < 8) {
          startRound(roundNum + 1);
        } else {
          cleanup();
          setPhase("done");
          setTimeout(() => {
            const final = Math.min(95, Math.max(0, scoreRef.current));
            onGameComplete({ score: final, won: correctCount + 1 >= 5 });
          }, 500);
        }
      }, 1200);
    }
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🥁</div>
        <p className="text-gray-400 mb-2">Watch the beat pattern, then tap it back!</p>
        <p className="text-gray-500 text-sm mb-6">8 rounds — patterns get longer. Get 5+ correct to win!</p>
        <button
          onClick={begin}
          className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-purple-500/20 text-lg"
        >
          🥁 Start Vibing!
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">
          Time: <span className={`font-bold ${timeLeft <= 15 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span>
        </div>
        <div className="text-sm text-gray-400">
          Round: <span className="text-white font-bold">{roundNum}/8</span>
        </div>
        <div className="text-sm text-gray-400">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 px-2">
        <div className="text-xs text-gray-500">{correctCount} patterns correct</div>
        {streak > 1 && (
          <div className="text-xs text-orange-400 font-bold animate-pulse">🔥 {streak}x streak!</div>
        )}
      </div>

      {/* Status */}
      {phase === "playing" && (
        <div className="text-center mb-4">
          {subPhase === "watch" && (
            <div className="text-lg font-bold text-purple-400 animate-pulse">👀 Watch the pattern...</div>
          )}
          {subPhase === "replay" && (
            <div className="text-lg font-bold text-cyan-400">
              🎯 Your turn! Tap it back ({playerInput.length}/{currentRound?.pattern.length})
            </div>
          )}
          {subPhase === "feedback" && feedback === "correct" && (
            <div className="text-lg font-bold text-green-400">✅ Correct! Nice one fam!</div>
          )}
          {subPhase === "feedback" && feedback === "wrong" && (
            <div className="text-lg font-bold text-red-400">❌ Wrong pattern! E no match o</div>
          )}
        </div>
      )}

      {/* Beat Pads */}
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-6">
        {Array.from({ length: numPads }).map((_, i) => {
          const isActive = showingIdx === i || flashPad === i;
          const color = BEAT_COLORS[i % BEAT_COLORS.length];
          return (
            <button
              key={i}
              onClick={() => tapPad(i)}
              disabled={subPhase !== "replay" || phase !== "playing"}
              className={`aspect-square rounded-2xl border-2 transition-all duration-150 ${
                subPhase === "replay" && phase === "playing"
                  ? "hover:scale-105 active:scale-95 cursor-pointer"
                  : "cursor-default"
              }`}
              style={{
                backgroundColor: isActive ? color : "#374151",
                borderColor: isActive ? color : "#4b5563",
                boxShadow: isActive ? `0 0 20px ${color}80, 0 0 40px ${color}40` : "none",
                transform: isActive ? "scale(1.1)" : undefined,
              }}
            >
              <div
                className="w-full h-full rounded-xl"
                style={{
                  background: isActive
                    ? `radial-gradient(circle, ${color}ff, ${color}aa)`
                    : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Pattern progress dots */}
      {subPhase === "replay" && currentRound && (
        <div className="flex justify-center gap-2 mb-4">
          {currentRound.pattern.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i < playerInput.length
                  ? playerInput[i] === currentRound.pattern[i]
                    ? "bg-green-400 scale-110"
                    : "bg-red-400"
                  : "bg-gray-600"
              }`}
            />
          ))}
        </div>
      )}

      {phase === "done" && (
        <div className="text-center py-8">
          <div className="text-3xl font-black text-yellow-400 mb-2">
            {correctCount >= 5 ? "You killed it! 🔥" : "Not bad sha! 💪"}
          </div>
          <div className="text-gray-400 text-sm">
            {correctCount}/8 patterns correct | Score: {Math.min(95, Math.max(0, score))}
          </div>
        </div>
      )}
    </div>
  );
}
