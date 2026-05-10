"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function DigitDashPage() {
  return (
    <GameWrapper gameSlug="digit-dash" gameName="Digit Dash" gameIcon="🔢">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

interface Operation {
  label: string;
  apply: (n: number) => number;
}

interface Chain {
  startNum: number;
  operations: Operation[];
  answer: number;
}

function generateChain(chainNum: number): Chain {
  const difficulty = Math.min(4, Math.floor(chainNum / 2) + 1);
  const opCount = Math.min(5, 3 + Math.floor(chainNum / 3));

  let maxStart = 10;
  let maxAdd = 8;
  let maxMul = 3;

  if (difficulty >= 2) { maxStart = 20; maxAdd = 12; maxMul = 4; }
  if (difficulty >= 3) { maxStart = 30; maxAdd = 15; maxMul = 5; }
  if (difficulty >= 4) { maxStart = 50; maxAdd = 20; maxMul = 6; }

  const startNum = Math.floor(gameRandom() * maxStart) + 2;
  const operations: Operation[] = [];
  let current = startNum;

  for (let i = 0; i < opCount; i++) {
    const roll = gameRandom();
    let op: Operation;

    if (roll < 0.35) {
      const val = Math.floor(gameRandom() * maxAdd) + 1;
      op = { label: `+ ${val}`, apply: (n) => n + val };
    } else if (roll < 0.65) {
      const val = Math.floor(gameRandom() * Math.min(current - 1, maxAdd)) + 1;
      op = { label: `- ${val}`, apply: (n) => n - val };
    } else if (roll < 0.85) {
      const val = Math.floor(gameRandom() * (maxMul - 1)) + 2;
      op = { label: `× ${val}`, apply: (n) => n * val };
    } else {
      // Division - pick a divisor that works cleanly
      const divisors = [2, 3, 4, 5].filter(d => current % d === 0 && current / d >= 1);
      if (divisors.length > 0) {
        const val = divisors[Math.floor(gameRandom() * divisors.length)];
        op = { label: `÷ ${val}`, apply: (n) => Math.floor(n / val) };
      } else {
        const val = Math.floor(gameRandom() * maxAdd) + 1;
        op = { label: `+ ${val}`, apply: (n) => n + val };
      }
    }

    current = op.apply(current);
    // Keep numbers reasonable
    if (current > 500) {
      const sub = Math.floor(gameRandom() * 100) + 50;
      const fixOp: Operation = { label: `- ${sub}`, apply: (n) => n - sub };
      current = fixOp.apply(current);
      operations.push(fixOp);
    } else if (current < 0) {
      const add = Math.floor(gameRandom() * 20) + 10;
      const fixOp: Operation = { label: `+ ${add}`, apply: (n) => n + add };
      current = fixOp.apply(current);
      operations.push(fixOp);
    } else {
      operations.push(op);
    }
  }

  return { startNum, operations: operations.slice(0, opCount), answer: current };
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

  const [chainNum, setChainNum] = useState(0);
  const [chain, setChain] = useState<Chain | null>(null);
  const [showingOpIdx, setShowingOpIdx] = useState(-1);
  const [subPhase, setSubPhase] = useState<"showing" | "answer" | "feedback">("showing");
  const [userAnswer, setUserAnswer] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const correctCountRef = useRef<number>(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [streak, setStreak] = useState(0);

  const showTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const showChainOps = useCallback((ch: Chain) => {
    setSubPhase("showing");
    setShowingOpIdx(-1);
    let i = 0;

    const showNext = () => {
      if (i < ch.operations.length) {
        setShowingOpIdx(i);
        i++;
        showTimeoutRef.current = setTimeout(showNext, 1200);
      } else {
        showTimeoutRef.current = setTimeout(() => {
          setSubPhase("answer");
          setUserAnswer("");
          setTimeout(() => inputRef.current?.focus(), 100);
        }, 600);
      }
    };

    // Show start number first
    showTimeoutRef.current = setTimeout(showNext, 1000);
  }, []);

  const startChain = useCallback((num: number) => {
    const ch = generateChain(num);
    setChain(ch);
    setChainNum(num);
    setFeedback(null);
    showChainOps(ch);
  }, [showChainOps]);

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
            correctCountRef.current = 0;
            setStreak(0);
            setFeedback(null);
            setPhase("playing");
            startChain(1);
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  cleanup();
                  setPhase("done");
                  setTimeout(() => {
                    const final = Math.min(95, Math.max(0, scoreRef.current));
                    onGameComplete({ score: final, won: correctCountRef.current >= 5 });
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

  function submitAnswer() {
    if (phase !== "playing" || subPhase !== "answer" || !chain) return;

    const parsed = parseInt(userAnswer.trim());
    if (isNaN(parsed)) return;

    const isCorrect = parsed === chain.answer;

    if (isCorrect) {
      const newStreak = streak + 1;
      const streakMult = Math.min(3, 1 + (newStreak - 1) * 0.3);
      const pts = Math.round((8 + chainNum * 2) * streakMult);
      const newScore = scoreRef.current + pts;
      scoreRef.current = newScore;
      setScore(newScore);
      setStreak(newStreak);
      setCorrectCount(prev => prev + 1);
      correctCountRef.current = correctCountRef.current + 1;
      setFeedback("correct");
    } else {
      setStreak(0);
      setFeedback("wrong");
    }

    setSubPhase("feedback");

    feedbackTimeoutRef.current = setTimeout(() => {
      if (chainNum < 8) {
        startChain(chainNum + 1);
      } else {
        cleanup();
        setPhase("done");
        setTimeout(() => {
          const final = Math.min(95, Math.max(0, scoreRef.current));
          onGameComplete({ score: final, won: correctCountRef.current >= 5 });
        }, 500);
      }
    }, 1500);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") submitAnswer();
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🔢</div>
        <p className="text-gray-400 mb-2">Mental math chain — keep track in your head!</p>
        <p className="text-gray-500 text-sm mb-6">8 chains, 70 seconds. Get 5+ correct to win!</p>
        <button
          onClick={begin}
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-orange-500/20 text-lg"
        >
          🔢 Start Crunching!
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
          Chain: <span className="text-white font-bold">{chainNum}/8</span>
        </div>
        <div className="text-sm text-gray-400">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 px-2">
        <div className="text-xs text-gray-500">{correctCount} correct</div>
        {streak > 1 && (
          <div className="text-xs text-orange-400 font-bold animate-pulse">🔥 {streak}x streak!</div>
        )}
      </div>

      {chain && phase === "playing" && (
        <div className="text-center">
          {/* Start number */}
          <div className="text-lg text-gray-400 mb-2">Start with:</div>
          <div className="text-5xl font-black text-white mb-6">{chain.startNum}</div>

          {/* Operations */}
          <div className="flex flex-col items-center gap-2 mb-6">
            {chain.operations.map((op, i) => (
              <div
                key={i}
                className={`text-2xl font-bold px-6 py-2 rounded-xl transition-all duration-500 ${
                  subPhase === "showing" && i === showingOpIdx
                    ? "bg-yellow-400/20 text-yellow-400 scale-110 animate-pulse"
                    : subPhase === "showing" && i > showingOpIdx
                    ? "opacity-0"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {(subPhase === "showing" && i > showingOpIdx) ? "?" : op.label}
              </div>
            ))}
          </div>

          {/* Waiting message during showing */}
          {subPhase === "showing" && (
            <div className="text-gray-500 text-sm animate-pulse">
              Calculate in your head... no calculator o! 🧠
            </div>
          )}

          {/* Answer input */}
          {subPhase === "answer" && (
            <div className="max-w-xs mx-auto">
              <div className="text-lg text-cyan-400 font-bold mb-3">What&apos;s the final answer?</div>
              <input
                ref={inputRef}
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full text-center text-3xl font-bold bg-gray-700 border-2 border-gray-600 rounded-xl py-3 text-white focus:border-cyan-400 focus:outline-none"
                placeholder="?"
                autoFocus
              />
              <button
                onClick={submitAnswer}
                className="mt-3 w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition"
              >
                Submit Answer ✅
              </button>
            </div>
          )}

          {/* Feedback */}
          {subPhase === "feedback" && (
            <div className="py-4">
              {feedback === "correct" ? (
                <div>
                  <div className="text-2xl font-black text-green-400 mb-1">Correct! 🔥</div>
                  <div className="text-gray-400 text-sm">Sharp brain fam!</div>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-black text-red-400 mb-1">Wrong! 😬</div>
                  <div className="text-gray-400 text-sm">
                    The answer was <span className="text-white font-bold">{chain.answer}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="text-center py-8">
          <div className="text-3xl font-black text-yellow-400 mb-2">
            {correctCount >= 5 ? "Maths wizard! 🧙‍♂️" : "Keep practicing! 💪"}
          </div>
          <div className="text-gray-400 text-sm">
            {correctCount}/8 chains correct | Score: {Math.min(95, Math.max(0, score))}
          </div>
        </div>
      )}
    </div>
  );
}
