"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

interface GridCell {
  value: number | null;
  fixed: boolean;
  userValue: string;
}

interface Puzzle {
  grid: GridCell[][];
  targetSums: number[];
}

function generatePuzzle(): Puzzle {
  // Generate a 3x3 grid where each row sums to a target
  const rows: number[][] = [];
  const targets: number[] = [];

  for (let r = 0; r < 3; r++) {
    const a = Math.floor(gameRandom() * 8) + 1;
    const b = Math.floor(gameRandom() * 8) + 1;
    const c = Math.floor(gameRandom() * 8) + 1;
    rows.push([a, b, c]);
    targets.push(a + b + c);
  }

  // Decide which cells to hide (2-3 per row)
  const grid: GridCell[][] = rows.map(row => {
    const hideCount = Math.floor(gameRandom() * 2) + 1; // 1 or 2 hidden
    const indices = [0, 1, 2].sort(() => gameRandom() - 0.5);
    const hideSet = new Set(indices.slice(0, hideCount));

    return row.map((val, i) => ({
      value: val,
      fixed: !hideSet.has(i),
      userValue: hideSet.has(i) ? "" : String(val),
    }));
  });

  return { grid, targetSums: targets };
}

export default function MathGridPage() {
  return (
    <GameWrapper gameSlug="math-grid" gameName="Math Grid" gameIcon="🔢">
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
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [puzzleNum, setPuzzleNum] = useState(1);
  const [gridsCompleted, setGridsCompleted] = useState(0);
  const [score, setScore] = useState(0);
  const scoreRef = useRef<number>(0);
  const gridsRef = useRef<number>(0);
  const [timeLeft, setTimeLeft] = useState(75);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [cellFlash, setCellFlash] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

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
            setGridsCompleted(0);
            gridsRef.current = 0;
            setPuzzleNum(1);
            setTimeLeft(75);
            setFeedback(null);
            setCellFlash(null);
            setPuzzle(generatePuzzle());
            setPhase("playing");
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  clearInterval(timerRef.current!);
                  const finalScore = Math.min(95, scoreRef.current);
                  const won = gridsRef.current >= 2;
                  setPhase("done");
                  onGameComplete({ score: finalScore, won });
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

  function handleCellChange(row: number, col: number, val: string) {
    if (!puzzle) return;
    if (puzzle.grid[row][col].fixed) return;

    const numVal = val.replace(/[^0-9]/g, "").slice(0, 1);
    const newGrid = puzzle.grid.map((r, ri) =>
      r.map((c, ci) => (ri === row && ci === col ? { ...c, userValue: numVal } : c))
    );
    setPuzzle({ ...puzzle, grid: newGrid });
  }

  function checkGrid() {
    if (!puzzle) return;

    let correctCells = 0;
    let totalEditable = 0;
    let allCorrect = true;

    for (let r = 0; r < 3; r++) {
      let rowSum = 0;
      for (let c = 0; c < 3; c++) {
        const cell = puzzle.grid[r][c];
        const uv = parseInt(cell.userValue) || 0;
        rowSum += uv;
        if (!cell.fixed) {
          totalEditable++;
          if (uv === cell.value) {
            correctCells++;
          } else {
            allCorrect = false;
          }
        }
      }
      if (rowSum !== puzzle.targetSums[r]) allCorrect = false;
    }

    const cellScore = correctCells * 5;
    const bonusScore = allCorrect ? 15 : 0;
    const earned = cellScore + bonusScore;
    const newScore = Math.min(95, score + earned);

    setScore(newScore);
    scoreRef.current = newScore;

    if (allCorrect) {
      const newGrids = gridsCompleted + 1;
      setGridsCompleted(newGrids);
      gridsRef.current = newGrids;
      setCellFlash("correct");
      setFeedback(`Correct! 🔥 +${earned} points! ${puzzleNum < 3 ? "Next puzzle loading..." : "All puzzles done!"}`);

      if (puzzleNum < 3) {
        setTimeout(() => {
          setPuzzleNum(prev => prev + 1);
          setPuzzle(generatePuzzle());
          setCellFlash(null);
          setFeedback(null);
        }, 1500);
      } else {
        // All 3 puzzles attempted
        setTimeout(() => {
          clearInterval(timerRef.current!);
          const finalScore = Math.min(95, scoreRef.current);
          const won = gridsRef.current >= 2;
          setPhase("done");
          onGameComplete({ score: finalScore, won });
        }, 1500);
      }
    } else {
      setCellFlash("wrong");
      setFeedback(`Not quite! ${correctCells}/${totalEditable} cells correct. Check your sums! 🤔`);
      setTimeout(() => setCellFlash(null), 800);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      {phase === "idle" && (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-2">🔢</div>
          <h2 className="text-2xl font-bold text-white">Math Grid</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Fill the empty cells so each row adds up to the target sum!
            <br />3 puzzles, 75 seconds. Solve 2+ to win!
          </p>
          <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-300">
            <p>Each row has a target sum on the right →</p>
            <p className="text-yellow-400 mt-1">Fill blanks with correct numbers!</p>
          </div>
          <button
            onClick={begin}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-lg"
          >
            Start Solving! 🧮
          </button>
        </div>
      )}

      {phase === "playing" && puzzle && (
        <div className="w-full space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="bg-gray-700 px-4 py-2 rounded-lg">
              <span className="text-gray-400 text-xs">PUZZLE</span>
              <p className="text-white font-bold text-lg">{puzzleNum}/3</p>
            </div>
            <div className={`px-4 py-2 rounded-lg ${timeLeft <= 15 ? "bg-red-900 animate-pulse" : "bg-gray-700"}`}>
              <span className="text-gray-400 text-xs">TIME</span>
              <p className={`font-bold text-lg ${timeLeft <= 15 ? "text-red-400" : "text-white"}`}>{timeLeft}s</p>
            </div>
            <div className="bg-gray-700 px-4 py-2 rounded-lg">
              <span className="text-gray-400 text-xs">SCORE</span>
              <p className="text-yellow-400 font-bold text-lg">{score}</p>
            </div>
          </div>

          {/* Grids solved indicator */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className={`w-8 h-2 rounded-full ${
                i < gridsCompleted ? "bg-green-500" : i === puzzleNum - 1 ? "bg-yellow-500" : "bg-gray-600"
              }`} />
            ))}
          </div>

          {/* Grid */}
          <div className="bg-gray-800 rounded-xl p-4">
            {puzzle.grid.map((row, ri) => (
              <div key={ri} className="flex items-center gap-2 mb-2 last:mb-0">
                {row.map((cell, ci) => (
                  <input
                    key={`${ri}-${ci}`}
                    type="text"
                    inputMode="numeric"
                    value={cell.userValue}
                    onChange={(e) => handleCellChange(ri, ci, e.target.value)}
                    disabled={cell.fixed}
                    className={`w-16 h-16 text-center text-2xl font-bold rounded-lg border-2 transition-all duration-200 ${
                      cell.fixed
                        ? "bg-gray-600 border-gray-500 text-white cursor-default"
                        : cellFlash === "correct"
                        ? "bg-green-800 border-green-400 text-green-200"
                        : cellFlash === "wrong"
                        ? "bg-red-800 border-red-400 text-red-200"
                        : "bg-gray-700 border-gray-500 text-yellow-400 focus:border-yellow-400 focus:outline-none"
                    }`}
                    maxLength={1}
                  />
                ))}
                <div className="flex items-center gap-1 ml-2">
                  <span className="text-gray-500">=</span>
                  <span className="bg-indigo-900 text-indigo-300 font-bold px-3 py-2 rounded-lg text-lg min-w-[3rem] text-center">
                    {puzzle.targetSums[ri]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`text-center text-sm py-2 px-3 rounded-lg ${
              feedback.includes("Correct") ? "bg-green-900/50 text-green-300" : "bg-orange-900/50 text-orange-300"
            }`}>
              {feedback}
            </div>
          )}

          {/* Check button */}
          <button
            onClick={checkGrid}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-400 hover:to-indigo-500 transition-all shadow-lg"
          >
            Check Answer ✅
          </button>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center space-y-4">
          <div className="text-6xl">{gridsCompleted >= 2 ? "🏆" : "🧮"}</div>
          <h2 className="text-2xl font-bold text-white">
            {gridsCompleted >= 2 ? "Math Boss! You too sharp!" : "Nice try! Practice go perfect am!"}
          </h2>
          <div className="bg-gray-700 rounded-xl p-4 space-y-2">
            <p className="text-gray-300">Grids Solved: <span className="text-green-400 font-bold">{gridsCompleted}/3</span></p>
            <p className="text-gray-300">Final Score: <span className="text-yellow-400 font-bold">{Math.min(95, score)}</span></p>
          </div>
          <button
            onClick={begin}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
          >
            Try Again 🔄
          </button>
        </div>
      )}
    </div>
  );
}
