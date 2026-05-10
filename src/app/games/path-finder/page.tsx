"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function PathFinderPage() {
  return (
    <GameWrapper gameSlug="path-finder" gameName="Path Finder" gameIcon="🗺️">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

type Cell = "path" | "wall" | "start" | "end";
type MazeGrid = Cell[][];

function generateMaze(): { grid: MazeGrid; start: [number, number]; end: [number, number] } {
  const SIZE = 6;
  const grid: MazeGrid = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => "path" as Cell)
  );

  // Place start and end
  const start: [number, number] = [0, 0];
  const end: [number, number] = [SIZE - 1, SIZE - 1];
  grid[start[0]][start[1]] = "start";
  grid[end[0]][end[1]] = "end";

  // Create a guaranteed path from start to end using random walk
  const pathCells = new Set<string>();
  pathCells.add(`${start[0]},${start[1]}`);
  pathCells.add(`${end[0]},${end[1]}`);

  let cr = 0, cc = 0;
  while (cr !== SIZE - 1 || cc !== SIZE - 1) {
    if (cr < SIZE - 1 && cc < SIZE - 1) {
      if (gameRandom() < 0.5) cr++;
      else cc++;
    } else if (cr < SIZE - 1) {
      cr++;
    } else {
      cc++;
    }
    pathCells.add(`${cr},${cc}`);
  }

  // Add walls randomly (not on path cells)
  const wallCount = Math.floor(gameRandom() * 4) + 6;
  let placed = 0;
  let attempts = 0;
  while (placed < wallCount && attempts < 100) {
    const r = Math.floor(gameRandom() * SIZE);
    const c = Math.floor(gameRandom() * SIZE);
    if (!pathCells.has(`${r},${c}`) && grid[r][c] === "path") {
      grid[r][c] = "wall";
      placed++;
    }
    attempts++;
  }

  return { grid, start, end };
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [maze, setMaze] = useState<MazeGrid>([]);
  const [playerPos, setPlayerPos] = useState<[number, number]>([0, 0]);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [mazeIndex, setMazeIndex] = useState(0);
  const [mazesSolved, setMazesSolved] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  const scoreRef = useRef(0);
  const solvedRef = useRef(0);
  const mazeIndexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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
    onGameComplete({ score: finalScore, won: solvedRef.current >= 3 });
  }, [onGameComplete]);

  const loadMaze = useCallback(() => {
    const { grid, start } = generateMaze();
    setMaze(grid);
    setPlayerPos(start);
    setVisited(new Set([`${start[0]},${start[1]}`]));
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
      mazeIndexRef.current = 0;
      startTimeRef.current = Date.now();
      setScore(0);
      setMazesSolved(0);
      setMazeIndex(0);
      setTimeLeft(60);
      loadMaze();
      setPhase("playing");

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
  }, [isPlaying, loadMaze, finishGame]);

  const handleCellTap = useCallback((r: number, c: number) => {
    if (phase !== "playing") return;
    if (maze[r]?.[c] === "wall") return;

    // Check adjacency
    const [pr, pc] = playerPos;
    const dr = Math.abs(r - pr);
    const dc = Math.abs(c - pc);
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      setPlayerPos([r, c]);
      setVisited(prev => {
        const next = new Set(prev);
        next.add(`${r},${c}`);
        return next;
      });

      // Check if reached end
      if (maze[r][c] === "end") {
        const speedBonus = Math.max(0, Math.floor(timeLeft / 5));
        const points = 15 + speedBonus;
        scoreRef.current += points;
        solvedRef.current += 1;
        setScore(scoreRef.current);
        setMazesSolved(solvedRef.current);

        if (mazeIndexRef.current < 4) {
          mazeIndexRef.current += 1;
          setMazeIndex(mazeIndexRef.current);
          loadMaze();
        } else {
          finishGame();
        }
      }
    }
  }, [phase, maze, playerPos, timeLeft, loadMaze, finishGame]);

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">🗺️</div>
        <h2 className="text-2xl font-bold text-white">Path Finder</h2>
        <p className="text-gray-400 text-center max-w-xs">
          Navigate from 🟩 to 🟥 through the maze! Tap adjacent cells to move.
          5 mazes, 45 seconds. Avoid the walls!
        </p>
        <button
          onClick={handleStart}
          className="px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl text-lg hover:scale-105 transition-transform"
        >
          Start Exploring
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="text-5xl">{mazesSolved >= 3 ? "🏆" : "🗺️"}</div>
        <h2 className="text-2xl font-bold text-white">
          {mazesSolved >= 3 ? "Expert Navigator!" : "Keep Exploring!"}
        </h2>
        <p className="text-gray-400">{mazesSolved}/5 mazes solved</p>
        <p className="text-3xl font-bold text-yellow-400">{Math.min(95, score)} pts</p>
        <button
          onClick={handleStart}
          className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2 w-full max-w-xs mx-auto">
      <div className="flex justify-between w-full px-2">
        <span className="text-gray-400">Maze {mazeIndex + 1}/5</span>
        <span className={`font-bold ${timeLeft <= 10 ? "text-red-400" : "text-white"}`}>
          {timeLeft}s
        </span>
        <span className="text-yellow-400">{score} pts</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-6 gap-1">
        {maze.map((row, r) =>
          row.map((cell, c) => {
            const isPlayer = playerPos[0] === r && playerPos[1] === c;
            const isVisited = visited.has(`${r},${c}`);
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellTap(r, c)}
                className={`w-11 h-11 rounded-md flex items-center justify-center text-lg font-bold transition-all active:scale-90
                  ${cell === "wall"
                    ? "bg-gray-900 border border-gray-700"
                    : cell === "start"
                      ? "bg-green-700/60 border border-green-500"
                      : cell === "end"
                        ? "bg-red-700/60 border border-red-500"
                        : isVisited
                          ? "bg-amber-900/30 border border-amber-700/50"
                          : "bg-gray-800 border border-gray-600 hover:bg-gray-700"
                  }`}
              >
                {isPlayer ? "😀" : cell === "start" ? "🟩" : cell === "end" ? "🟥" : cell === "wall" ? "🧱" : ""}
              </button>
            );
          })
        )}
      </div>

      <p className="text-gray-500 text-xs">Tap an adjacent cell to move</p>
    </div>
  );
}
