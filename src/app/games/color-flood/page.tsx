"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function ColorFloodPage() {
  return (
    <GameWrapper gameSlug="color-flood" gameName="Color Flood" gameIcon="🌊">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

const FLOOD_COLORS = [
  { color: "#ef4444", emoji: "🔴", label: "Red" },
  { color: "#3b82f6", emoji: "🔵", label: "Blue" },
  { color: "#22c55e", emoji: "🟢", label: "Green" },
  { color: "#eab308", emoji: "🟡", label: "Yellow" },
  { color: "#a855f7", emoji: "🟣", label: "Purple" },
];

const GRID_SIZE = 6;
const MAX_MOVES = 20;

function generateGrid(): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: number[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      row.push(Math.floor(gameRandom() * 5));
    }
    grid.push(row);
  }
  return grid;
}

function floodFill(grid: number[][], newColor: number): number[][] {
  const newGrid = grid.map(r => [...r]);
  const oldColor = newGrid[0][0];
  if (oldColor === newColor) return newGrid;

  const queue: [number, number][] = [[0, 0]];
  const visited = new Set<string>();
  visited.add("0,0");

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    if (newGrid[r][c] !== oldColor) continue;
    newGrid[r][c] = newColor;

    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && !visited.has(key)) {
        visited.add(key);
        if (newGrid[nr][nc] === oldColor) {
          queue.push([nr, nc]);
        }
      }
    }
  }
  return newGrid;
}

function getFloodedCount(grid: number[][]): number {
  const color = grid[0][0];
  const visited = new Set<string>();
  const queue: [number, number][] = [[0, 0]];
  visited.add("0,0");
  let count = 0;

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    if (grid[r][c] !== color) continue;
    count++;
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && !visited.has(key)) {
        visited.add(key);
        if (grid[nr][nc] === color) queue.push([nr, nc]);
      }
    }
  }
  return count;
}

function isBoardSolved(grid: number[][]): boolean {
  return getFloodedCount(grid) === GRID_SIZE * GRID_SIZE;
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [score, setScore] = useState(0);
  const scoreRef = useRef<number>(0);
  const [timeLeft, setTimeLeft] = useState(75);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const [grid, setGrid] = useState<number[][]>([]);
  const [moves, setMoves] = useState(0);
  const [boardNum, setBoardNum] = useState(1);
  const [boardsCleared, setBoardsCleared] = useState(0);
  const [totalMovesSaved, setTotalMovesSaved] = useState(0);
  const [lastPickFlash, setLastPickFlash] = useState<number>(-1);
  const boardsClearedRef = useRef<number>(0);

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
            boardsClearedRef.current = 0;
            setTimeLeft(75);
            setBoardsCleared(0);
            setTotalMovesSaved(0);
            setBoardNum(1);
            setMoves(0);
            setGrid(generateGrid());
            setPhase("playing");
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  cleanup();
                  setPhase("done");
                  setTimeout(() => {
                    const final = Math.min(95, Math.max(0, scoreRef.current));
                    onGameComplete({ score: final, won: boardsClearedRef.current >= 2 });
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

  function pickColor(colorIdx: number) {
    if (phase !== "playing") return;
    if (grid[0][0] === colorIdx) return; // Same color, no-op

    setLastPickFlash(colorIdx);
    setTimeout(() => setLastPickFlash(-1), 200);

    const newGrid = floodFill(grid, colorIdx);
    const newMoves = moves + 1;
    setGrid(newGrid);
    setMoves(newMoves);

    if (isBoardSolved(newGrid)) {
      // Board cleared!
      const movesLeft = MAX_MOVES - newMoves;
      const boardPts = 15 + movesLeft * 2;
      const newScore = scoreRef.current + boardPts;
      scoreRef.current = newScore;
      setScore(newScore);
      const newCleared = boardsCleared + 1;
      setBoardsCleared(newCleared);
      boardsClearedRef.current = newCleared;
      setTotalMovesSaved(prev => prev + movesLeft);

      if (boardNum < 3) {
        // Next board
        setTimeout(() => {
          setBoardNum(prev => prev + 1);
          setMoves(0);
          setGrid(generateGrid());
        }, 800);
      } else {
        // All boards done
        cleanup();
        setPhase("done");
        setTimeout(() => {
          const final = Math.min(95, Math.max(0, scoreRef.current));
          onGameComplete({ score: final, won: newCleared >= 2 });
        }, 500);
      }
    } else if (newMoves >= MAX_MOVES) {
      // Out of moves for this board
      const partialPts = Math.round((getFloodedCount(newGrid) / (GRID_SIZE * GRID_SIZE)) * 8);
      const newScore = scoreRef.current + partialPts;
      scoreRef.current = newScore;
      setScore(newScore);

      if (boardNum < 3) {
        setTimeout(() => {
          setBoardNum(prev => prev + 1);
          setMoves(0);
          setGrid(generateGrid());
        }, 800);
      } else {
        cleanup();
        setPhase("done");
        setTimeout(() => {
          const final = Math.min(95, Math.max(0, scoreRef.current));
          onGameComplete({ score: final, won: boardsClearedRef.current >= 2 });
        }, 500);
      }
    }
  }

  const floodedPct = grid.length > 0
    ? Math.round((getFloodedCount(grid) / (GRID_SIZE * GRID_SIZE)) * 100)
    : 0;

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🌊</div>
        <p className="text-gray-400 mb-2">Flood the board with one color from the top-left!</p>
        <p className="text-gray-500 text-sm mb-6">3 boards, 20 moves each, 75 seconds. Clear 2+ boards to win!</p>
        <button
          onClick={begin}
          className="bg-gradient-to-r from-blue-500 to-teal-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-blue-500/20 text-lg"
        >
          🌊 Start Flooding!
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
          Board: <span className="text-white font-bold">{boardNum}/3</span>
        </div>
        <div className="text-sm text-gray-400">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 px-2">
        <div className="text-xs text-gray-500">
          Moves: <span className={`font-bold ${moves >= MAX_MOVES - 3 ? "text-red-400" : "text-white"}`}>{moves}/{MAX_MOVES}</span>
        </div>
        <div className="text-xs text-gray-500">
          {boardsCleared} board{boardsCleared !== 1 ? "s" : ""} cleared
        </div>
        <div className="text-xs text-gray-500">
          Flooded: <span className="text-cyan-400 font-bold">{floodedPct}%</span>
        </div>
      </div>

      {/* Flood progress bar */}
      <div className="mx-2 mb-4 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-green-400 transition-all duration-300"
          style={{ width: `${floodedPct}%` }}
        />
      </div>

      {/* Grid */}
      {phase === "playing" && (
        <div className="flex justify-center mb-6">
          <div
            className="grid gap-1 p-2 bg-gray-800 rounded-xl"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg transition-all duration-300"
                  style={{
                    backgroundColor: FLOOD_COLORS[cell].color,
                    boxShadow: r === 0 && c === 0 ? `0 0 8px ${FLOOD_COLORS[cell].color}80` : "none",
                    border: r === 0 && c === 0 ? "2px solid white" : "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Color picker */}
      {phase === "playing" && (
        <div className="flex justify-center gap-3 mb-4">
          {FLOOD_COLORS.map((fc, i) => {
            const isCurrent = grid.length > 0 && grid[0][0] === i;
            return (
              <button
                key={i}
                onClick={() => pickColor(i)}
                disabled={isCurrent}
                className={`w-12 h-12 rounded-xl transition-all ${
                  isCurrent
                    ? "opacity-30 cursor-not-allowed scale-90"
                    : lastPickFlash === i
                    ? "scale-110 ring-2 ring-white"
                    : "hover:scale-110 active:scale-95"
                }`}
                style={{
                  backgroundColor: fc.color,
                  boxShadow: lastPickFlash === i ? `0 0 15px ${fc.color}` : "none",
                }}
              >
                <span className="text-lg">{fc.emoji}</span>
              </button>
            );
          })}
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center text-xs text-gray-500">
          Pick a color to flood from the top-left corner 👆
        </div>
      )}

      {phase === "done" && (
        <div className="text-center py-8">
          <div className="text-3xl font-black text-yellow-400 mb-2">
            {boardsCleared >= 2 ? "Boss move! 🌊🔥" : "Almost there! 💪"}
          </div>
          <div className="text-gray-400 text-sm">
            {boardsCleared}/3 boards cleared | Score: {Math.min(95, Math.max(0, score))}
          </div>
          {totalMovesSaved > 0 && (
            <div className="text-xs text-cyan-400 mt-1">{totalMovesSaved} moves saved as bonus!</div>
          )}
        </div>
      )}
    </div>
  );
}
