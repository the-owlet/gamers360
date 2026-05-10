"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function RapidFirePage() {
  return (
    <GameWrapper gameSlug="rapid-fire" gameName="Rapid Fire" gameIcon="⚡">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

interface Statement {
  text: string;
  isTrue: boolean;
}

function generateStatement(): Statement {
  const type = Math.floor(gameRandom() * 4);

  if (type === 0) {
    // Math addition/subtraction
    const a = Math.floor(gameRandom() * 20) + 1;
    const b = Math.floor(gameRandom() * 20) + 1;
    const op = gameRandom() < 0.5 ? "+" : "-";
    const correct = op === "+" ? a + b : a - b;
    const shown = gameRandom() < 0.5 ? correct : correct + (Math.floor(gameRandom() * 4) + 1) * (gameRandom() < 0.5 ? 1 : -1);
    return { text: `${a} ${op} ${b} = ${shown}`, isTrue: shown === correct };
  } else if (type === 1) {
    // Multiplication
    const a = Math.floor(gameRandom() * 12) + 2;
    const b = Math.floor(gameRandom() * 12) + 2;
    const correct = a * b;
    const shown = gameRandom() < 0.5 ? correct : correct + (Math.floor(gameRandom() * 5) + 1) * (gameRandom() < 0.5 ? 1 : -1);
    return { text: `${a} × ${b} = ${shown}`, isTrue: shown === correct };
  } else if (type === 2) {
    // Comparisons
    const a = Math.floor(gameRandom() * 50) + 1;
    const b = Math.floor(gameRandom() * 50) + 1;
    const useGreater = gameRandom() < 0.5;
    const symbol = useGreater ? ">" : "<";
    const isTrue = useGreater ? a > b : a < b;
    return { text: `${a} ${symbol} ${b}`, isTrue };
  } else {
    // General knowledge
    const facts: Statement[] = [
      { text: "A triangle has 3 sides", isTrue: true },
      { text: "A triangle has 4 sides", isTrue: false },
      { text: "A square has 4 equal sides", isTrue: true },
      { text: "A hexagon has 5 sides", isTrue: false },
      { text: "A hexagon has 6 sides", isTrue: true },
      { text: "An octagon has 8 sides", isTrue: true },
      { text: "An octagon has 6 sides", isTrue: false },
      { text: "A pentagon has 5 sides", isTrue: true },
      { text: "A circle has 0 corners", isTrue: true },
      { text: "A cube has 8 faces", isTrue: false },
      { text: "A cube has 6 faces", isTrue: true },
      { text: "Water boils at 100°C", isTrue: true },
      { text: "Water freezes at 10°C", isTrue: false },
      { text: "The Earth has 1 moon", isTrue: true },
      { text: "Mars is closer to the Sun than Earth", isTrue: false },
      { text: "There are 60 seconds in a minute", isTrue: true },
      { text: "There are 100 minutes in an hour", isTrue: false },
      { text: "A year has 365 days", isTrue: true },
      { text: "A leap year has 364 days", isTrue: false },
      { text: "Light travels faster than sound", isTrue: true },
      { text: "Sound travels faster than light", isTrue: false },
      { text: "7 × 8 = 56", isTrue: true },
      { text: "9 × 6 = 52", isTrue: false },
      { text: "12 × 12 = 144", isTrue: true },
      { text: "11 × 11 = 112", isTrue: false },
    ];
    return facts[Math.floor(gameRandom() * facts.length)];
  }
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [statement, setStatement] = useState<Statement | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [answered, setAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const answeredRef = useRef(0);
  const correctRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const statementTimerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (statementTimerRef.current) clearTimeout(statementTimerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying && phase === "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      if (statementTimerRef.current) clearTimeout(statementTimerRef.current);
      finishGame();
    }
  }, [isPlaying, phase]);

  const finishGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (statementTimerRef.current) clearTimeout(statementTimerRef.current);
    const finalScore = Math.min(95, Math.max(0, scoreRef.current));
    setScore(finalScore);
    setPhase("done");
    onGameComplete({ score: finalScore, won: finalScore >= 60 });
  }, [onGameComplete]);

  const nextStatement = useCallback(() => {
    setStatement(generateStatement());
    setFeedback(null);
  }, []);

  const handleStart = useCallback(() => {
    startGame();
  }, [startGame]);

  const _hasStarted = useRef(false);
  useEffect(() => {
    if (isPlaying && !_hasStarted.current) {
      _hasStarted.current = true;
      scoreRef.current = 0;
      streakRef.current = 0;
      answeredRef.current = 0;
      correctRef.current = 0;
      setScore(0);
      setStreak(0);
      setAnswered(0);
      setCorrectCount(0);
      setTimeLeft(60);
      setPhase("playing");
      nextStatement();

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    if (!isPlaying) _hasStarted.current = false;
  }, [isPlaying, nextStatement, finishGame]);

  const handleAnswer = useCallback((answer: boolean) => {
    if (phase !== "playing" || !statement || feedback) return;

    const isCorrect = answer === statement.isTrue;
    setFeedback(isCorrect ? "correct" : "wrong");
    answeredRef.current += 1;
    setAnswered(answeredRef.current);

    if (isCorrect) {
      streakRef.current += 1;
      const streakBonus = streakRef.current >= 4 ? 4 : streakRef.current >= 3 ? 2 : 0;
      const points = 8 + streakBonus;
      scoreRef.current += points;
      correctRef.current += 1;
      setCorrectCount(correctRef.current);
    } else {
      streakRef.current = 0;
      scoreRef.current = Math.max(0, scoreRef.current - 5);
    }
    setScore(scoreRef.current);
    setStreak(streakRef.current);

    feedbackTimerRef.current = setTimeout(() => {
      nextStatement();
    }, 500);
  }, [phase, statement, feedback, nextStatement]);

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">⚡</div>
        <h2 className="text-2xl font-bold text-white">Rapid Fire</h2>
        <p className="text-gray-400 text-center max-w-xs">
          True or False? React fast! Statements fly at you for 60 seconds.
          +8 per correct, -5 per wrong. Streaks earn bonus points!
        </p>
        <button
          onClick={handleStart}
          className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-red-600 text-white font-bold rounded-xl text-lg hover:scale-105 transition-transform"
        >
          Start Firing
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="text-5xl">{score >= 60 ? "⚡" : "💨"}</div>
        <h2 className="text-2xl font-bold text-white">
          {score >= 60 ? "Lightning Fast!" : "Too Slow!"}
        </h2>
        <p className="text-gray-400">{correctCount}/{answered} correct</p>
        <p className="text-3xl font-bold text-yellow-400">{Math.min(95, score)} pts</p>
        <button
          onClick={handleStart}
          className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-red-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4 w-full max-w-sm mx-auto">
      {/* Header */}
      <div className="flex justify-between w-full px-2">
        <span className="text-gray-400">#{answered + 1}</span>
        <span className={`font-bold text-xl ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-white"}`}>
          {timeLeft}s
        </span>
        <span className="text-yellow-400 font-bold">{score} pts</span>
      </div>

      {/* Timer bar */}
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-yellow-500 to-red-500 transition-all duration-1000"
          style={{ width: `${(timeLeft / 60) * 100}%` }}
        />
      </div>

      {/* Streak */}
      {streak >= 3 && (
        <div className="text-orange-400 text-sm font-bold animate-bounce">
          🔥 {streak} streak! +bonus
        </div>
      )}

      {/* Statement */}
      {statement && (
        <div className={`bg-gray-800 rounded-2xl px-6 py-8 w-full text-center transition-all
          ${feedback === "correct" ? "ring-2 ring-green-500" : feedback === "wrong" ? "ring-2 ring-red-500" : ""}`}
        >
          <p className="text-2xl font-bold text-white">{statement.text}</p>
          {feedback && (
            <p className={`mt-2 text-lg font-bold ${feedback === "correct" ? "text-green-400" : "text-red-400"}`}>
              {feedback === "correct" ? "Correct! ✓" : "Wrong! ✗"}
            </p>
          )}
        </div>
      )}

      {/* True / False buttons */}
      <div className="flex gap-4 w-full">
        <button
          onClick={() => handleAnswer(true)}
          disabled={!!feedback}
          className="flex-1 py-5 bg-green-700 hover:bg-green-600 text-white text-2xl font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
        >
          TRUE
        </button>
        <button
          onClick={() => handleAnswer(false)}
          disabled={!!feedback}
          className="flex-1 py-5 bg-red-700 hover:bg-red-600 text-white text-2xl font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
        >
          FALSE
        </button>
      </div>
    </div>
  );
}
