"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function MathBlitzPage() {
  return (
    <GameWrapper gameSlug="math-blitz" gameName="Math Blitz" gameIcon="🧮">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

interface Problem {
  question: string;
  answer: number;
  options: number[];
  difficulty: number;
}

function generateProblem(round: number): Problem {
  const diff = Math.min(4, Math.floor(round / 2) + 1);
  let a: number, b: number, op: string, answer: number;

  if (diff <= 1) {
    a = Math.floor(gameRandom() * 10) + 1;
    b = Math.floor(gameRandom() * 10) + 1;
    op = gameRandom() < 0.5 ? "+" : "-";
    answer = op === "+" ? a + b : a - b;
    if (answer < 0) { answer = a + b; op = "+"; }
  } else if (diff <= 2) {
    a = Math.floor(gameRandom() * 12) + 2;
    b = Math.floor(gameRandom() * 12) + 2;
    const ops = ["+", "-", "×"];
    op = ops[Math.floor(gameRandom() * ops.length)];
    if (op === "×") { a = Math.floor(gameRandom() * 8) + 2; b = Math.floor(gameRandom() * 8) + 2; }
    answer = op === "+" ? a + b : op === "-" ? a - b : a * b;
    if (answer < 0) { answer = a + b; op = "+"; }
  } else if (diff <= 3) {
    a = Math.floor(gameRandom() * 20) + 5;
    b = Math.floor(gameRandom() * 15) + 2;
    const ops = ["+", "-", "×"];
    op = ops[Math.floor(gameRandom() * ops.length)];
    if (op === "×") { a = Math.floor(gameRandom() * 12) + 2; b = Math.floor(gameRandom() * 6) + 2; }
    answer = op === "+" ? a + b : op === "-" ? a - b : a * b;
    if (answer < 0) { answer = a + b; op = "+"; }
  } else {
    a = Math.floor(gameRandom() * 30) + 10;
    b = Math.floor(gameRandom() * 20) + 5;
    const ops = ["+", "-", "×"];
    op = ops[Math.floor(gameRandom() * ops.length)];
    if (op === "×") { a = Math.floor(gameRandom() * 15) + 3; b = Math.floor(gameRandom() * 8) + 2; }
    answer = op === "+" ? a + b : op === "-" ? a - b : a * b;
    if (answer < 0) { answer = a + b; op = "+"; }
  }

  const options = [answer];
  while (options.length < 4) {
    const offset = Math.floor(gameRandom() * 10) - 5;
    const wrong = answer + (offset === 0 ? 1 : offset);
    if (!options.includes(wrong)) options.push(wrong);
  }
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(gameRandom() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return { question: `${a} ${op} ${b}`, answer, options, difficulty: diff };
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const scoreRef = useRef(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
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
            setStreak(0);
            setRound(1);
            setTimeLeft(60);
            setCorrect(0);
            setTotal(0);
            setFeedback(null);
            setProblem(generateProblem(1));
            setPhase("playing");
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  cleanup();
                  setPhase("done");
                  setTimeout(() => {
                    const final = Math.min(95, Math.max(0, scoreRef.current));
                    onGameComplete({ score: final, won: final >= 20 });
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

  function pickAnswer(val: number) {
    if (phase !== "playing" || !problem || feedback) return;

    const isCorrect = val === problem.answer;
    setTotal(prev => prev + 1);

    if (isCorrect) {
      const newStreak = streak + 1;
      const streakMult = Math.min(3, 1 + (newStreak - 1) * 0.3);
      const pts = Math.round((5 + problem.difficulty * 3) * streakMult);
      const newScore = scoreRef.current + pts;
      scoreRef.current = newScore;
      setScore(newScore);
      setStreak(newStreak);
      setCorrect(prev => prev + 1);
      setFeedback("correct");
    } else {
      setStreak(0);
      setFeedback("wrong");
    }

    setTimeout(() => {
      const nextRound = round + 1;
      setRound(nextRound);
      setProblem(generateProblem(nextRound));
      setFeedback(null);
    }, 500);
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🧮</div>
        <p className="text-gray-400 mb-2">Solve math problems as fast as you can!</p>
        <p className="text-gray-500 text-sm mb-6">60 seconds — build streaks for combo multipliers</p>
        <button
          onClick={begin}
          className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-blue-500/20 text-lg"
        >
          🧮 Start Solving!
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">
          Time: <span className={`font-bold ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span>
        </div>
        <div className="text-sm text-gray-400">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 px-2">
        <div className="text-xs text-gray-500">
          {correct}/{total} correct
        </div>
        {streak > 1 && (
          <div className="text-xs text-orange-400 font-bold animate-pulse">{streak}x streak!</div>
        )}
      </div>

      {problem && phase === "playing" && (
        <div className="text-center">
          <div className={`text-5xl font-black mb-8 transition-colors ${
            feedback === "correct" ? "text-green-400" : feedback === "wrong" ? "text-red-400" : "text-white"
          }`}>
            {problem.question} = ?
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            {problem.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => pickAnswer(opt)}
                disabled={feedback !== null}
                className={`py-4 rounded-xl font-bold text-xl transition-all hover:scale-105 active:scale-95 ${
                  feedback && opt === problem.answer
                    ? "bg-green-500 text-white"
                    : feedback && opt !== problem.answer
                    ? "bg-gray-700 text-gray-500"
                    : "bg-gray-700 hover:bg-gray-600 text-white"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center py-8">
          <div className="text-3xl font-black text-yellow-400 mb-2">Time's Up!</div>
          <div className="text-gray-400 text-sm">
            {correct}/{total} correct | Score: {Math.min(95, Math.max(0, score))}
          </div>
        </div>
      )}
    </div>
  );
}
