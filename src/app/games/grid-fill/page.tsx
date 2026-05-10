"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function GridFillPage() {
  return (
    <GameWrapper gameSlug="grid-fill" gameName="Grid Fill" gameIcon="🧩">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

type Grid = number[][];

function generateSolvedGrid(): Grid {
  // Generate a valid 4x4 Latin square
  const base = [1, 2, 3, 4];
  const grid: Grid = [];

  // Shuffle base row
  const row0 = [...base];
  for (let i = row0.length - 1; i > 0; i--) {
    const j = Math.floor(gameRandom() * (i + 1));
    [row0[i], row0[j]] = [row0[j], row0[i]];
  }
  grid.push(row0);

  // Generate remaining rows by shifting
  const shifts = [1, 2, 3];
  for (let i = shifts.length - 1; i > 0; i--) {
    const j = Math.floor(gameRandom() * (i + 1));
    [shifts[i], shifts[j]] = [shifts[j], shifts[i]];
  }

  for (const shift of shifts) {
    const row = row0.map((_, idx) => row0[(idx + shift) % 4]);
    grid.push(row);
  }

  // Shuffle rows (keep validity)
  for (let i = grid.length - 1; i > 0; i--) {
    const j = Math.floor(gameRandom() * (i + 1));
    [grid[i], grid[j]] = [grid[j], grid[i]];
  }

  return grid;
}

function generatePuzzle(difficulty: number): { puzzle: Grid; solution: Grid } {
  const solution = generateSolvedGrid();
  const puzzle: Grid = solution.map(row => [...row]);

  // Remove cells based on difficulty
  const cellsToRemove = difficulty === 0 ? 6 : difficulty === 1 ? 8 : 10;
  const positions: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      positions.push([r, c]);
    }
  }

  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(gameRandom() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (let i = 0; i < cellsToRemove; i++) {
    const [r, c] = positions[i];
    puzzle[r][c] = 0;
  }

  return { puzzle, solution };
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [currentGrid, setCurrentGrid] = useState<Grid>([]);
  const [solution, setSolution] = useState<Grid>([]);
  const [givenCells, setGivenCells] = useState<boolean[][]>([]);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [wrongCells, setWrongCells] = useState<boolean[][]>([]);

  const scoreRef = useRef(0);
  const solvedRef = useRef(0);

  useEffect(() => {
    if (!isPlaying && phase === "playing") {
      finishGame();
    }
  }, [isPlaying, phase]);

  const finishGame = useCallback(() => {
    const finalScore = Math.min(95, scoreRef.current);
    setScore(finalScore);
    setPhase("done");
    onGameComplete({ score: finalScore, won: solvedRef.current >= 2 });
  }, [onGameComplete]);

  const loadPuzzle = useCallback((index: number) => {
    const { puzzle, solution: sol } = generatePuzzle(index);
    setCurrentGrid(puzzle.map(row => [...row]));
    setSolution(sol);
    setGivenCells(puzzle.map(row => row.map(v => v !== 0)));
    setWrongCells(Array.from({ length: 4 }, () => Array(4).fill(false)));
    setPuzzleIndex(index);
    setMessage("");
  }, []);

  const handleStart = useCallback(() => {
    startGame();
  }, [startGame]);

  const _hasStarted = useRef(false);
  useEffect(() => {
    if (isPlaying && !_hasStarted.current) {
      _hasStarted.current = true;
      scoreRef.current = 0;
      solvedRef.current = 0;
      setScore(0);
      setPuzzlesSolved(0);
      loadPuzzle(0);
      setPhase("playing");
    }
    if (!isPlaying) _hasStarted.current = false;
  }, [isPlaying, loadPuzzle]);

  const handleCellTap = useCallback((r: number, c: number) => {
    if (phase !== "playing" || givenCells[r]?.[c]) return;
    setCurrentGrid(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = next[r][c] >= 4 ? 0 : next[r][c] + 1;
      return next;
    });
    // Clear wrong highlight
    setWrongCells(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = false;
      return next;
    });
  }, [phase, givenCells]);

  const handleSubmit = useCallback(() => {
    if (phase !== "playing") return;

    // Check if all cells filled
    const allFilled = currentGrid.every(row => row.every(v => v !== 0));
    if (!allFilled) {
      setMessage("Fill all cells first!");
      return;
    }

    // Check against solution
    let allCorrect = true;
    const newWrong = Array.from({ length: 4 }, () => Array(4).fill(false));
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentGrid[r][c] !== solution[r][c]) {
          allCorrect = false;
          newWrong[r][c] = true;
        }
      }
    }

    if (allCorrect) {
      const points = puzzleIndex === 0 ? 25 : puzzleIndex === 1 ? 30 : 35;
      scoreRef.current += points;
      solvedRef.current += 1;
      setScore(scoreRef.current);
      setPuzzlesSolved(solvedRef.current);

      if (puzzleIndex < 2) {
        setMessage(`Puzzle ${puzzleIndex + 1} solved! +${points} pts`);
        setTimeout(() => loadPuzzle(puzzleIndex + 1), 1000);
      } else {
        setMessage("All puzzles solved!");
        setTimeout(() => finishGame(), 800);
      }
    } else {
      setWrongCells(newWrong);
      setMessage("Some cells are wrong! Try again.");
    }
  }, [phase, currentGrid, solution, puzzleIndex, loadPuzzle, finishGame]);

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">🧩</div>
        <h2 className="text-2xl font-bold text-white">Grid Fill</h2>
        <p className="text-gray-400 text-center max-w-xs">
          Fill the 4x4 grid so no row or column repeats a number (1-4).
          Tap cells to cycle through numbers. 3 puzzles to solve!
        </p>
        <button
          onClick={handleStart}
          className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl text-lg hover:scale-105 transition-transform"
        >
          Start Filling
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="text-5xl">{puzzlesSolved >= 2 ? "🏆" : "🧩"}</div>
        <h2 className="text-2xl font-bold text-white">
          {puzzlesSolved >= 2 ? "Grid Master!" : "Nice Try!"}
        </h2>
        <p className="text-gray-400">{puzzlesSolved}/3 puzzles solved</p>
        <p className="text-3xl font-bold text-yellow-400">{Math.min(95, score)} pts</p>
        <button
          onClick={handleStart}
          className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4 w-full max-w-xs mx-auto">
      <div className="flex justify-between w-full px-2">
        <span className="text-gray-400">Puzzle {puzzleIndex + 1}/3</span>
        <span className="text-yellow-400">{score} pts</span>
      </div>

      {message && (
        <div className={`text-sm font-bold ${message.includes("wrong") || message.includes("Fill") ? "text-red-400" : "text-green-400"}`}>
          {message}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {currentGrid.map((row, r) =>
          row.map((val, c) => {
            const isGiven = givenCells[r]?.[c];
            const isWrong = wrongCells[r]?.[c];
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellTap(r, c)}
                disabled={isGiven}
                className={`w-14 h-14 rounded-lg text-xl font-bold flex items-center justify-center transition-all active:scale-90
                  ${isGiven
                    ? "bg-gray-600 text-white cursor-default"
                    : isWrong
                      ? "bg-red-900/50 text-red-300 border-2 border-red-500"
                      : val === 0
                        ? "bg-gray-800 text-gray-500 border-2 border-gray-600 hover:border-gray-400"
                        : "bg-teal-900/50 text-teal-300 border-2 border-teal-600"
                  }`}
              >
                {val || ""}
              </button>
            );
          })
        )}
      </div>

      <button
        onClick={handleSubmit}
        className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
      >
        Check Solution
      </button>
    </div>
  );
}
