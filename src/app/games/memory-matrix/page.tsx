"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function MemoryMatrixPage() {
  return (
    <GameWrapper gameSlug="memory-matrix" gameName="Memory Matrix" gameIcon="🧠">
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
  const [phase, setPhase] = useState<"idle" | "showing" | "input" | "result">("idle");
  const [gridSize, setGridSize] = useState(4);
  const [pattern, setPattern] = useState<boolean[]>([]);
  const [playerInput, setPlayerInput] = useState<boolean[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null);
  const [tilesCount, setTilesCount] = useState(3);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const totalRounds = 5;

  const startRound = useCallback((roundNum: number, currentScore: number, tiles: number) => {
    const size = roundNum <= 2 ? 4 : roundNum <= 4 ? 5 : 5;
    const total = size * size;
    const newPattern = Array(total).fill(false);
    const numTiles = tiles;
    const indices: number[] = [];
    while (indices.length < numTiles) {
      const idx = Math.floor(gameRandom() * total);
      if (!indices.includes(idx)) indices.push(idx);
    }
    indices.forEach(i => newPattern[i] = true);

    setGridSize(size);
    setPattern(newPattern);
    setPlayerInput(Array(total).fill(false));
    setRound(roundNum);
    setScore(currentScore);
    setTilesCount(numTiles);
    setShowResult(null);
    setPhase("showing");

    timerRef.current = setTimeout(() => {
      setPhase("input");
    }, 1500 + roundNum * 200);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  function begin() {
      startGame();
    }

    // Auto-start game when isPlaying becomes true (after bet selection)
    const _hasStarted = useRef(false);
    useEffect(() => {
      if (isPlaying && !_hasStarted.current) {
        _hasStarted.current = true;
        startRound(1, 0, 3);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  function toggleTile(index: number) {
    if (phase !== "input") return;
    setPlayerInput(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  function submitAnswer() {
    if (phase !== "input") return;
    let correct = 0;
    let wrong = 0;
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] && playerInput[i]) correct++;
      if (!pattern[i] && playerInput[i]) wrong++;
    }
    const accuracy = Math.max(0, correct - wrong) / tilesCount;
    const roundScore = Math.round(accuracy * (10 + round * 5));
    const newScore = score + roundScore;

    if (accuracy >= 0.5) {
      setShowResult("correct");
      if (round >= totalRounds) {
        setScore(newScore);
        setPhase("result");
        const bonus = accuracy === 1 ? 15 : 0;
        const finalScore = Math.min(95, newScore + bonus);
        setTimeout(() => onGameComplete({ score: finalScore, won: finalScore >= 25 }), 1000);
      } else {
        timerRef.current = setTimeout(() => {
          startRound(round + 1, newScore, Math.min(tilesCount + 1, 10));
        }, 800);
      }
    } else {
      setShowResult("wrong");
      if (round >= totalRounds) {
        setScore(newScore);
        setPhase("result");
        setTimeout(() => onGameComplete({ score: Math.min(95, newScore), won: newScore >= 25 }), 1000);
      } else {
        timerRef.current = setTimeout(() => {
          startRound(round + 1, newScore, tilesCount);
        }, 800);
      }
    }
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🧠</div>
        <p className="text-gray-400 mb-2">Memorize the glowing tiles, then recreate the pattern!</p>
        <p className="text-gray-500 text-sm mb-6">5 rounds — patterns get harder each round</p>
        <button
          onClick={begin}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-purple-500/20 text-lg"
        >
          🧠 Start Game
        </button>
      </div>
    );
  }

  const selectedCount = playerInput.filter(Boolean).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">
          Round: <span className="text-purple-400 font-bold">{round}/{totalRounds}</span>
        </div>
        <div className="text-sm text-gray-400">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
      </div>

      {phase === "showing" && (
        <div className="text-center mb-3">
          <span className="text-sm text-yellow-400 animate-pulse font-bold">Memorize the pattern!</span>
        </div>
      )}
      {phase === "input" && (
        <div className="text-center mb-3">
          <span className="text-sm text-cyan-400 font-bold">Tap the tiles! ({selectedCount}/{tilesCount})</span>
        </div>
      )}

      <div className="grid gap-1.5 max-w-xs mx-auto" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
        {pattern.map((lit, i) => {
          const isShowing = phase === "showing" && lit;
          const isSelected = playerInput[i];
          const isResult = showResult !== null;

          let bg = "bg-gray-700 hover:bg-gray-600";
          if (isShowing) bg = "bg-purple-500 shadow-lg shadow-purple-500/50";
          else if (isResult && pattern[i] && playerInput[i]) bg = "bg-green-500";
          else if (isResult && pattern[i] && !playerInput[i]) bg = "bg-red-500/50";
          else if (isResult && !pattern[i] && playerInput[i]) bg = "bg-red-500";
          else if (isSelected) bg = "bg-cyan-500 shadow-lg shadow-cyan-500/30";

          return (
            <button
              key={i}
              onClick={() => toggleTile(i)}
              disabled={phase !== "input"}
              className={`aspect-square rounded-lg transition-all duration-200 ${bg} ${
                phase === "input" ? "cursor-pointer hover:scale-105" : ""
              }`}
            />
          );
        })}
      </div>

      {phase === "input" && (
        <div className="text-center mt-4">
          <button
            onClick={submitAnswer}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition text-sm"
          >
            Submit Pattern
          </button>
        </div>
      )}

      {showResult && (
        <div className="text-center mt-3">
          <span className={`text-sm font-bold ${showResult === "correct" ? "text-green-400" : "text-red-400"}`}>
            {showResult === "correct" ? "Nice recall!" : "Not quite..."}
          </span>
        </div>
      )}
    </div>
  );
}
