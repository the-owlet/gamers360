"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function SequenceSurgePage() {
  return (
    <GameWrapper gameSlug="sequence-surge" gameName="Sequence Surge" gameIcon="🔢">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

interface SequenceQuestion {
  display: string[];
  answer: number;
  options: number[];
}

function generateSequence(round: number): SequenceQuestion {
  const type = Math.floor(gameRandom() * 4);
  let sequence: number[] = [];
  let answer: number;

  if (type === 0) {
    // Arithmetic: constant difference
    const start = Math.floor(gameRandom() * 10) + 1;
    const diff = Math.floor(gameRandom() * 5) + 1;
    for (let i = 0; i < 5; i++) sequence.push(start + diff * i);
    answer = sequence[4];
  } else if (type === 1) {
    // Multiply: each term * factor
    const start = Math.floor(gameRandom() * 4) + 1;
    const factor = Math.floor(gameRandom() * 2) + 2;
    sequence = [start];
    for (let i = 1; i < 5; i++) sequence.push(sequence[i - 1] * factor);
    answer = sequence[4];
  } else if (type === 2) {
    // Fibonacci-like: each = sum of previous 2
    const a = Math.floor(gameRandom() * 5) + 1;
    const b = Math.floor(gameRandom() * 5) + 1;
    sequence = [a, b];
    for (let i = 2; i < 5; i++) sequence.push(sequence[i - 1] + sequence[i - 2]);
    answer = sequence[4];
  } else {
    // Square sequence
    const start = Math.floor(gameRandom() * 4) + 1;
    for (let i = 0; i < 5; i++) sequence.push((start + i) * (start + i));
    answer = sequence[4];
  }

  // Show first 4, hide 5th
  const display = sequence.slice(0, 4).map(String);
  display.push("?");

  // Generate wrong options
  const options = [answer];
  while (options.length < 4) {
    const offset = Math.floor(gameRandom() * 20) - 10;
    const wrong = answer + (offset === 0 ? (gameRandom() < 0.5 ? -3 : 3) : offset);
    if (wrong > 0 && !options.includes(wrong)) options.push(wrong);
  }
  // Shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(gameRandom() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return { display, answer, options };
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [question, setQuestion] = useState<SequenceQuestion | null>(null);
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const streakRef = useRef(0);
  const roundRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying && phase === "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      finishGame();
    }
  }, [isPlaying, phase]);

  const finishGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalScore = Math.min(95, scoreRef.current);
    setScore(finalScore);
    setPhase("done");
    onGameComplete({ score: finalScore, won: correctRef.current >= 8 });
  }, [onGameComplete]);

  const nextRound = useCallback(() => {
    const r = roundRef.current;
    if (r >= 15) {
      finishGame();
      return;
    }
    setQuestion(generateSequence(r));
    setFeedback(null);
  }, [finishGame]);

  const handleStart = useCallback(() => {
    startGame();
  }, [startGame]);

  const _hasStarted = useRef(false);
  useEffect(() => {
    if (isPlaying && !_hasStarted.current) {
      _hasStarted.current = true;
      setRound(0);
      setCorrect(0);
      setStreak(0);
      setScore(0);
      setTimeLeft(60);
      scoreRef.current = 0;
      correctRef.current = 0;
      streakRef.current = 0;
      roundRef.current = 0;
      setPhase("playing");

      setQuestion(generateSequence(0));

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
  }, [isPlaying, finishGame]);

  const handleAnswer = useCallback((chosen: number) => {
    if (phase !== "playing" || !question || feedback) return;

    const isCorrect = chosen === question.answer;
    setFeedback(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      const streakBonus = streakRef.current >= 3 ? 4 : streakRef.current >= 2 ? 2 : 0;
      const points = 8 + streakBonus;
      scoreRef.current += points;
      correctRef.current += 1;
      streakRef.current += 1;
      setScore(scoreRef.current);
      setCorrect(correctRef.current);
      setStreak(streakRef.current);
    } else {
      streakRef.current = 0;
      setStreak(0);
    }

    roundRef.current += 1;
    setRound(roundRef.current);

    feedbackTimerRef.current = setTimeout(() => {
      nextRound();
    }, 600);
  }, [phase, question, feedback, nextRound]);

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">🔢</div>
        <h2 className="text-2xl font-bold text-white">Sequence Surge</h2>
        <p className="text-gray-400 text-center max-w-xs">
          Find the missing number in each sequence! 15 rounds, 60 seconds.
          Can you spot the pattern?
        </p>
        <button
          onClick={handleStart}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl text-lg hover:scale-105 transition-transform"
        >
          Start Sequence
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="text-5xl">{correct >= 8 ? "🧠" : "🤔"}</div>
        <h2 className="text-2xl font-bold text-white">
          {correct >= 8 ? "Pattern Master!" : "Keep Practicing!"}
        </h2>
        <p className="text-gray-400">{correct}/15 correct</p>
        <p className="text-3xl font-bold text-yellow-400">{Math.min(95, score)} pts</p>
        <button
          onClick={handleStart}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
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
        <span className="text-gray-400">Round {round + 1}/15</span>
        <span className={`font-bold ${timeLeft <= 5 ? "text-red-400" : "text-white"}`}>
          {timeLeft}s
        </span>
        <span className="text-yellow-400">{score} pts</span>
      </div>

      {/* Streak */}
      {streak >= 2 && (
        <div className="text-orange-400 text-sm font-bold animate-pulse">
          🔥 {streak} streak!
        </div>
      )}

      {/* Sequence display */}
      {question && (
        <>
          <div className="flex gap-2 items-center bg-gray-800 rounded-xl px-4 py-4">
            {question.display.map((item, i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold
                  ${item === "?" ? "bg-yellow-600/30 text-yellow-400 border-2 border-yellow-500 animate-pulse" : "bg-gray-700 text-white"}`}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                disabled={!!feedback}
                className={`py-4 rounded-xl text-xl font-bold transition-all active:scale-95
                  ${feedback
                    ? opt === question.answer
                      ? "bg-green-600 text-white scale-105"
                      : "bg-gray-800 text-gray-500"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`text-lg font-bold ${feedback === "correct" ? "text-green-400" : "text-red-400"}`}>
              {feedback === "correct" ? "Correct! ✓" : "Wrong ✗"}
            </div>
          )}
        </>
      )}
    </div>
  );
}
