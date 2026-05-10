"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function MirrorDrawPage() {
  return (
    <GameWrapper gameSlug="mirror-draw" gameName="Mirror Draw" gameIcon="🪞">
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
  const [phase, setPhase] = useState<"idle" | "playing" | "feedback" | "done">("idle");
  const [original, setOriginal] = useState<boolean[]>(Array(16).fill(false));
  const [mirrored, setMirrored] = useState<boolean[]>(Array(16).fill(false));
  const [playerGrid, setPlayerGrid] = useState<boolean[]>(Array(16).fill(false));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [roundsCorrect, setRoundsCorrect] = useState(0);
  const roundsCorrectRef = useRef(0);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [accuracy, setAccuracy] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const maxRounds = 5;

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const generatePattern = useCallback((roundNum: number) => {
    const grid = Array(16).fill(false);
    // More filled cells in later rounds
    const fillCount = Math.min(3 + roundNum, 8);
    const indices: number[] = [];
    while (indices.length < fillCount) {
      const idx = Math.floor(gameRandom() * 16);
      if (!indices.includes(idx)) indices.push(idx);
    }
    indices.forEach(i => grid[i] = true);
    return grid;
  }, []);

  const mirrorGrid = useCallback((grid: boolean[]) => {
    // Horizontal mirror (flip left to right)
    const result = Array(16).fill(false);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        result[row * 4 + (3 - col)] = grid[row * 4 + col];
      }
    }
    return result;
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
            setRoundsCorrect(0);
            roundsCorrectRef.current = 0;
            setupRound(1);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  function setupRound(roundNum: number) {
    const pattern = generatePattern(roundNum);
    const mirror = mirrorGrid(pattern);
    setOriginal(pattern);
    setMirrored(mirror);
    setPlayerGrid(Array(16).fill(false));
    setRound(roundNum);
    setFeedbackType(null);
    setAccuracy(0);
    setPhase("playing");
  }

  function toggleCell(index: number) {
    if (phase !== "playing") return;
    setPlayerGrid(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  function submitAnswer() {
    if (phase !== "playing") return;

    // Calculate accuracy
    let correctCells = 0;
    for (let i = 0; i < 16; i++) {
      if (playerGrid[i] === mirrored[i]) correctCells++;
    }
    const acc = Math.round((correctCells / 16) * 100);
    setAccuracy(acc);

    const isGood = acc >= 60;
    const points = Math.floor(acc * 0.18); // max ~18 per round
    const newScore = scoreRef.current + points;
    scoreRef.current = newScore;
    setScore(newScore);

    if (isGood) {
      const newRoundsCorrect = roundsCorrectRef.current + 1;
      roundsCorrectRef.current = newRoundsCorrect;
      setRoundsCorrect(newRoundsCorrect);
      setFeedbackType("correct");
    } else {
      setFeedbackType("wrong");
    }

    setPhase("feedback");

    if (round >= maxRounds) {
      timerRef.current = setTimeout(() => {
        const finalScore = Math.min(95, newScore);
        setPhase("done");
        onGameComplete({ score: finalScore, won: roundsCorrectRef.current >= 3 });
      }, 1500);
    } else {
      timerRef.current = setTimeout(() => {
        setupRound(round + 1);
      }, 1500);
    }
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">🪞</div>
        <h2 className="text-2xl font-bold text-white">Mirror Draw</h2>
        <p className="text-gray-400 text-center max-w-xs">
          See a pattern on the left, draw its mirror image on the right! Flip it horizontally. 5 rounds.
        </p>
        <button
          onClick={begin}
          className="px-8 py-3 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 transform hover:scale-105 transition-all shadow-lg"
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
        <div className="text-5xl">{roundsCorrect >= 3 ? "🎉" : "😔"}</div>
        <h2 className="text-2xl font-bold text-white">
          {roundsCorrect >= 3 ? "Mirror Master!" : "Keep Practicing!"}
        </h2>
        <p className="text-gray-300">Rounds passed (60%+): {roundsCorrect}/{maxRounds}</p>
        <p className="text-yellow-400 text-xl font-bold">Score: {finalScore}</p>
      </div>
    );
  }

  const renderGrid = (grid: boolean[], interactive: boolean, label: string) => (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <div className="grid grid-cols-4 gap-1">
        {grid.map((filled, i) => (
          <button
            key={i}
            onClick={() => interactive && toggleCell(i)}
            disabled={!interactive}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-md transition-all ${
              filled
                ? interactive
                  ? "bg-emerald-500 border-2 border-emerald-400 shadow-md shadow-emerald-500/30"
                  : "bg-cyan-500 border-2 border-cyan-400 shadow-md shadow-cyan-500/30"
                : interactive
                ? "bg-gray-800 border-2 border-gray-600 hover:border-emerald-400"
                : "bg-gray-800 border-2 border-gray-700"
            }`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="flex justify-between w-full max-w-sm text-sm">
        <span className="text-gray-300">Round {round}/{maxRounds}</span>
        <span className="text-yellow-400 font-bold">Score: {score}</span>
        <span className="text-gray-300">✓ {roundsCorrect}</span>
      </div>

      <div className="flex items-center gap-4">
        {renderGrid(original, false, "Original")}

        <div className="text-2xl text-gray-500">🪞</div>

        {phase === "feedback" ? (
          renderGrid(mirrored, false, "Correct Mirror")
        ) : (
          renderGrid(playerGrid, true, "Your Mirror")
        )}
      </div>

      {phase === "playing" && (
        <div className="flex gap-3">
          <button
            onClick={() => setPlayerGrid(Array(16).fill(false))}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={submitAnswer}
            className="px-6 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 transition-all"
          >
            Submit
          </button>
        </div>
      )}

      {phase === "feedback" && (
        <div className="flex flex-col items-center gap-2">
          <div className={`text-lg font-bold ${feedbackType === "correct" ? "text-green-400" : "text-red-400"}`}>
            {feedbackType === "correct" ? "✓ Good Mirror!" : "✗ Not quite!"}
          </div>
          <p className="text-gray-400 text-sm">Accuracy: {accuracy}%</p>
          <div className="w-32 bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${accuracy >= 60 ? "bg-green-500" : "bg-red-500"}`}
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
