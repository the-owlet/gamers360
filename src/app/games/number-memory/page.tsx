"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function NumberMemoryPage() {
  return (
    <GameWrapper gameSlug="number-memory" gameName="Number Memory" gameIcon="🔢">
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
  const [phase, setPhase] = useState<"idle" | "showing" | "input" | "feedback" | "done">("idle");
  const [currentNumber, setCurrentNumber] = useState("");
  const [userInput, setUserInput] = useState("");
  const [round, setRound] = useState(0);
  const [digits, setDigits] = useState(3);
  const [lives, setLives] = useState(2);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const roundsRef = useRef(0);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const maxRounds = 8;

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const generateNumber = useCallback((numDigits: number) => {
    let num = "";
    for (let i = 0; i < numDigits; i++) {
      const d = i === 0 ? Math.floor(gameRandom() * 9) + 1 : Math.floor(gameRandom() * 10);
      num += d.toString();
    }
    return num;
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
            setLives(2);
            setRound(1);
            setDigits(3);
            setRoundsCompleted(0);
            roundsRef.current = 0;
            showNumber(3);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  function showNumber(numDigits: number) {
    const num = generateNumber(numDigits);
    setCurrentNumber(num);
    setUserInput("");
    setFeedbackType(null);
    setPhase("showing");

    const showTime = numDigits <= 4 ? 2000 : 3000;
    timerRef.current = setTimeout(() => {
      setPhase("input");
    }, showTime);
  }

  function handleSubmit() {
    if (phase !== "input") return;

    const isCorrect = userInput === currentNumber;

    if (isCorrect) {
      const lengthBonus = Math.max(0, (digits - 3) * 3);
      const points = 8 + lengthBonus;
      const newScore = scoreRef.current + points;
      const newRounds = roundsRef.current + 1;
      scoreRef.current = newScore;
      roundsRef.current = newRounds;
      setScore(newScore);
      setRoundsCompleted(newRounds);
      setFeedbackType("correct");
      setPhase("feedback");

      if (round >= maxRounds) {
        timerRef.current = setTimeout(() => {
          const finalScore = Math.min(95, newScore);
          setPhase("done");
          onGameComplete({ score: finalScore, won: newRounds >= 4 });
        }, 1000);
        return;
      }

      timerRef.current = setTimeout(() => {
        const newDigits = digits + 1;
        setDigits(newDigits);
        setRound(prev => prev + 1);
        showNumber(newDigits);
      }, 1200);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setFeedbackType("wrong");
      setPhase("feedback");

      if (newLives <= 0 || round >= maxRounds) {
        timerRef.current = setTimeout(() => {
          const finalScore = Math.min(95, scoreRef.current);
          setPhase("done");
          onGameComplete({ score: finalScore, won: roundsRef.current >= 4 });
        }, 1200);
      } else {
        timerRef.current = setTimeout(() => {
          setRound(prev => prev + 1);
          showNumber(digits);
        }, 1200);
      }
    }
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">🔢</div>
        <h2 className="text-2xl font-bold text-white">Number Memory</h2>
        <p className="text-gray-400 text-center max-w-xs">
          Memorize the number, then type it back! Numbers get longer each round. You have 2 lives.
        </p>
        <button
          onClick={begin}
          className="px-8 py-3 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transform hover:scale-105 transition-all shadow-lg"
        >
          Start Game
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const finalScore = Math.min(95, score);
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="text-5xl">{roundsCompleted >= 4 ? "🎉" : "😔"}</div>
        <h2 className="text-2xl font-bold text-white">
          {roundsCompleted >= 4 ? "Amazing Memory!" : "Keep Practicing!"}
        </h2>
        <p className="text-gray-300">Rounds completed: {roundsCompleted}/{maxRounds}</p>
        <p className="text-gray-300">Max digits: {digits}</p>
        <p className="text-yellow-400 text-xl font-bold">Score: {finalScore}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex justify-between w-full max-w-xs text-sm">
        <span className="text-gray-300">Round {round}/{maxRounds}</span>
        <span className="text-yellow-400 font-bold">Score: {score}</span>
        <span className="text-red-400">{"❤️".repeat(lives)}{"🖤".repeat(2 - lives)}</span>
      </div>

      <div className="text-gray-400 text-sm">{digits} digits</div>

      {phase === "showing" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-400 text-sm">Memorize this number!</p>
          <div className="text-5xl font-mono font-bold text-white tracking-widest bg-gray-800 px-8 py-6 rounded-2xl border-2 border-blue-500 shadow-lg shadow-blue-500/20 animate-pulse">
            {currentNumber}
          </div>
        </div>
      )}

      {phase === "input" && (
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <p className="text-gray-300 text-sm">What was the number?</p>
          <input
            type="number"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            autoFocus
            className="w-full text-center text-3xl font-mono font-bold bg-gray-800 text-white border-2 border-gray-600 focus:border-blue-500 rounded-xl px-4 py-4 outline-none transition-colors"
            placeholder="???"
          />
          <button
            onClick={handleSubmit}
            className="w-full px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-all"
          >
            Submit
          </button>
        </div>
      )}

      {phase === "feedback" && (
        <div className="flex flex-col items-center gap-3">
          <div className={`text-5xl ${feedbackType === "correct" ? "animate-bounce" : "animate-pulse"}`}>
            {feedbackType === "correct" ? "✅" : "❌"}
          </div>
          <p className={`text-lg font-bold ${feedbackType === "correct" ? "text-green-400" : "text-red-400"}`}>
            {feedbackType === "correct" ? "Correct!" : "Wrong!"}
          </p>
          {feedbackType === "wrong" && (
            <p className="text-gray-400 text-sm">
              The number was: <span className="text-white font-mono font-bold">{currentNumber}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
