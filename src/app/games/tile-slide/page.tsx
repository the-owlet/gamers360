"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

type Board = (number | null)[];

function isSolvable(board: Board): boolean {
  const tiles = board.filter(t => t !== null) as number[];
  let inversions = 0;
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i] > tiles[j]) inversions++;
    }
  }
  return inversions % 2 === 0;
}

function generateBoard(shuffleMoves: number): Board {
  // Start solved, then shuffle by making valid moves
  const board: Board = [1, 2, 3, 4, 5, 6, 7, 8, null];
  let emptyIdx = 8;

  for (let i = 0; i < shuffleMoves; i++) {
    const row = Math.floor(emptyIdx / 3);
    const col = emptyIdx % 3;
    const neighbors: number[] = [];

    if (row > 0) neighbors.push(emptyIdx - 3);
    if (row < 2) neighbors.push(emptyIdx + 3);
    if (col > 0) neighbors.push(emptyIdx - 1);
    if (col < 2) neighbors.push(emptyIdx + 1);

    const pick = neighbors[Math.floor(gameRandom() * neighbors.length)];
    board[emptyIdx] = board[pick];
    board[pick] = null;
    emptyIdx = pick;
  }

  // Ensure not already solved
  const solved = [1, 2, 3, 4, 5, 6, 7, 8, null];
  if (JSON.stringify(board) === JSON.stringify(solved)) {
    // Swap two tiles
    [board[0], board[1]] = [board[1], board[0]];
    if (!isSolvable(board)) {
      [board[0], board[1]] = [board[1], board[0]];
      [board[2], board[3]] = [board[3], board[2]];
    }
  }

  return board;
}

function isSolved(board: Board): boolean {
  for (let i = 0; i < 8; i++) {
    if (board[i] !== i + 1) return false;
  }
  return board[8] === null;
}

export default function TileSlidePage() {
  return (
    <GameWrapper gameSlug="tile-slide" gameName="Tile Slide" gameIcon="🧩">
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
  const [board, setBoard] = useState<Board>([]);
  const [moves, setMoves] = useState(0);
  const [puzzleNum, setPuzzleNum] = useState(1);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const puzzlesSolvedRef = useRef<number>(0);
  const [score, setScore] = useState(0);
  const scoreRef = useRef<number>(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [slideAnim, setSlideAnim] = useState<number | null>(null);
  const [totalMoves, setTotalMoves] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const difficulties = [20, 35, 50]; // shuffle moves per puzzle

  function loadPuzzle(num: number) {
    const shuffleMoves = difficulties[num - 1] || 50;
    setBoard(generateBoard(shuffleMoves));
    setMoves(0);
    setFeedback(null);
    setSlideAnim(null);
  }

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
            setPuzzlesSolved(0);
            puzzlesSolvedRef.current = 0;
            setPuzzleNum(1);
            setTimeLeft(90);
            setTotalMoves(0);
            setPhase("playing");
            loadPuzzle(1);
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  clearInterval(timerRef.current!);
                  const finalScore = Math.min(95, scoreRef.current);
                  const won = puzzlesSolvedRef.current >= 2;
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

  function handleTileClick(idx: number) {
    if (board[idx] === null) return;

    const emptyIdx = board.indexOf(null);
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    const emptyRow = Math.floor(emptyIdx / 3);
    const emptyCol = emptyIdx % 3;

    const isAdjacent =
      (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
      (col === emptyCol && Math.abs(row - emptyRow) === 1);

    if (!isAdjacent) return;

    setSlideAnim(idx);

    setTimeout(() => {
      const newBoard = [...board];
      newBoard[emptyIdx] = newBoard[idx];
      newBoard[idx] = null;
      setBoard(newBoard);
      setMoves(prev => prev + 1);
      setTotalMoves(prev => prev + 1);
      setSlideAnim(null);

      if (isSolved(newBoard)) {
        const movesUsed = moves + 1;
        const moveBonus = movesUsed <= 30 ? 15 : movesUsed <= 50 ? 10 : 5;
        const puzzleScore = 15 + moveBonus;
        const newScore = Math.min(95, score + puzzleScore);
        const newSolved = puzzlesSolved + 1;

        setScore(newScore);
        scoreRef.current = newScore;
        setPuzzlesSolved(newSolved);
        puzzlesSolvedRef.current = newSolved;
        setFeedback(`Puzzle solved in ${movesUsed} moves! +${puzzleScore} pts 🎉`);

        if (puzzleNum < 3) {
          setTimeout(() => {
            const nextNum = puzzleNum + 1;
            setPuzzleNum(nextNum);
            loadPuzzle(nextNum);
          }, 1500);
        } else {
          setTimeout(() => {
            clearInterval(timerRef.current!);
            const finalScore = Math.min(95, scoreRef.current);
            const won = puzzlesSolvedRef.current >= 2;
            setPhase("done");
            onGameComplete({ score: finalScore, won });
          }, 1500);
        }
      }
    }, 100);
  }

  const tileColors = [
    "", // placeholder for null
    "from-blue-500 to-blue-600",
    "from-green-500 to-green-600",
    "from-purple-500 to-purple-600",
    "from-orange-500 to-orange-600",
    "from-pink-500 to-pink-600",
    "from-teal-500 to-teal-600",
    "from-red-500 to-red-600",
    "from-yellow-500 to-yellow-600",
  ];

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      {phase === "idle" && (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-2">🧩</div>
          <h2 className="text-2xl font-bold text-white">Tile Slide</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Classic sliding puzzle! Arrange tiles 1-8 in order.
            <br />3 puzzles, 90 seconds. Solve 2+ to win!
          </p>
          <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-300">
            <p>Click a tile next to the empty space to slide it.</p>
            <p className="text-yellow-400 mt-1">Fewer moves = more points!</p>
          </div>
          <button
            onClick={begin}
            className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-lg"
          >
            Start Sliding! 🧩
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="w-full space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="bg-gray-700 px-3 py-2 rounded-lg">
              <span className="text-gray-400 text-xs">PUZZLE</span>
              <p className="text-white font-bold">{puzzleNum}/3</p>
            </div>
            <div className="bg-gray-700 px-3 py-2 rounded-lg">
              <span className="text-gray-400 text-xs">MOVES</span>
              <p className="text-blue-400 font-bold">{moves}</p>
            </div>
            <div className={`px-3 py-2 rounded-lg ${timeLeft <= 15 ? "bg-red-900 animate-pulse" : "bg-gray-700"}`}>
              <span className="text-gray-400 text-xs">TIME</span>
              <p className={`font-bold ${timeLeft <= 15 ? "text-red-400" : "text-white"}`}>{timeLeft}s</p>
            </div>
            <div className="bg-gray-700 px-3 py-2 rounded-lg">
              <span className="text-gray-400 text-xs">SCORE</span>
              <p className="text-yellow-400 font-bold">{score}</p>
            </div>
          </div>

          {/* Puzzle progress */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className={`w-8 h-2 rounded-full transition-colors ${
                i < puzzlesSolved ? "bg-green-500" : i === puzzleNum - 1 ? "bg-yellow-500" : "bg-gray-600"
              }`} />
            ))}
          </div>

          {/* Board */}
          <div className="bg-gray-800 rounded-2xl p-3 mx-auto" style={{ width: "fit-content" }}>
            <div className="grid grid-cols-3 gap-2">
              {board.map((tile, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTileClick(idx)}
                  disabled={tile === null}
                  className={`w-20 h-20 rounded-xl text-2xl font-black transition-all duration-150 ${
                    tile === null
                      ? "bg-gray-900/50 cursor-default"
                      : `bg-gradient-to-br ${tileColors[tile]} text-white shadow-lg hover:scale-105 active:scale-95 cursor-pointer ${
                          slideAnim === idx ? "scale-90 opacity-70" : ""
                        } ${tile === idx + 1 ? "ring-2 ring-green-400/30" : ""}`
                  }`}
                >
                  {tile}
                </button>
              ))}
            </div>
          </div>

          {/* Target */}
          <div className="text-center text-gray-400 text-xs">
            Goal: <span className="text-gray-300 font-mono">1 2 3 | 4 5 6 | 7 8 _</span>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className="text-center text-sm py-2 px-3 rounded-lg bg-green-900/50 text-green-300">
              {feedback}
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="text-center space-y-4">
          <div className="text-6xl">{puzzlesSolved >= 2 ? "🏆" : "🧩"}</div>
          <h2 className="text-2xl font-bold text-white">
            {puzzlesSolved >= 2 ? "Puzzle Master! You sharp well well!" : "Good effort! Try again make you level up!"}
          </h2>
          <div className="bg-gray-700 rounded-xl p-4 space-y-2">
            <p className="text-gray-300">Puzzles Solved: <span className="text-green-400 font-bold">{puzzlesSolved}/3</span></p>
            <p className="text-gray-300">Total Moves: <span className="text-blue-400 font-bold">{totalMoves}</span></p>
            <p className="text-gray-300">Final Score: <span className="text-yellow-400 font-bold">{Math.min(95, score)}</span></p>
          </div>
          <button
            onClick={begin}
            className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
          >
            Try Again 🔄
          </button>
        </div>
      )}
    </div>
  );
}
