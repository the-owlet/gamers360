"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function WordHuntPage() {
  return (
    <GameWrapper gameSlug="word-hunt" gameName="Word Hunt" gameIcon="🔍">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

const WORD_POOLS = [
  // 3-letter words
  ["CAT", "DOG", "RUN", "SIT", "HAT", "BAT", "CUT", "FUN", "GUM", "HIT", "JAM", "KIT", "LET", "MAP", "NET", "OWL", "PEN", "RED", "SUN", "TEN", "VAN", "WAR", "YAM", "ZAP", "ACE", "BIG", "COP", "DIG"],
  // 4-letter words
  ["GAME", "PLAY", "FIRE", "GOLD", "HERO", "JUMP", "KING", "LAMP", "MOON", "NEST", "OPEN", "PARK", "QUIZ", "RAIN", "STAR", "TREE", "VINE", "WAVE", "YEAR", "ZONE", "BLUE", "COOL", "DARK", "FAST"],
  // 5-letter words
  ["BRAIN", "CHASE", "DANCE", "EAGLE", "FLAME", "GRAPE", "HOUSE", "IVORY", "JOLLY", "KNIFE", "LIGHT", "MANGO", "NIGHT", "OCEAN", "PEARL", "QUEEN", "RIDER", "SNAKE", "TIGER", "UNITY", "VIGOR", "WATER"],
];

const GRID_SIZE = 5;

interface PlacedWord {
  word: string;
  row: number;
  col: number;
  direction: "horizontal" | "vertical";
}

interface GridData {
  grid: string[][];
  words: PlacedWord[];
}

function generateWordGrid(): GridData {
  const grid: string[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => "")
  );

  const placed: PlacedWord[] = [];
  const targetWords = 6 + Math.floor(gameRandom() * 3); // 6-8 words
  let attempts = 0;

  while (placed.length < targetWords && attempts < 200) {
    attempts++;

    // Pick a word length category
    const catIdx = Math.floor(gameRandom() * 3);
    const pool = WORD_POOLS[catIdx];
    const word = pool[Math.floor(gameRandom() * pool.length)];

    if (word.length > GRID_SIZE) continue;
    if (placed.some(p => p.word === word)) continue;

    const dir: "horizontal" | "vertical" = gameRandom() < 0.5 ? "horizontal" : "vertical";

    const maxRow = dir === "vertical" ? GRID_SIZE - word.length : GRID_SIZE - 1;
    const maxCol = dir === "horizontal" ? GRID_SIZE - word.length : GRID_SIZE - 1;

    if (maxRow < 0 || maxCol < 0) continue;

    const row = Math.floor(gameRandom() * (maxRow + 1));
    const col = Math.floor(gameRandom() * (maxCol + 1));

    // Check if word fits without conflict
    let fits = true;
    for (let i = 0; i < word.length; i++) {
      const r = dir === "vertical" ? row + i : row;
      const c = dir === "horizontal" ? col + i : col;
      if (grid[r][c] !== "" && grid[r][c] !== word[i]) {
        fits = false;
        break;
      }
    }

    if (fits) {
      for (let i = 0; i < word.length; i++) {
        const r = dir === "vertical" ? row + i : row;
        const c = dir === "horizontal" ? col + i : col;
        grid[r][c] = word[i];
      }
      placed.push({ word, row, col, direction: dir });
    }
  }

  // Fill empty cells with random letters
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === "") {
        grid[r][c] = letters[Math.floor(gameRandom() * 26)];
      }
    }
  }

  return { grid, words: placed };
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [score, setScore] = useState(0);
  const scoreRef = useRef<number>(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const [gridData, setGridData] = useState<GridData | null>(null);
  const [gridNum, setGridNum] = useState(1);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [totalFound, setTotalFound] = useState(0);
  const totalFoundRef = useRef<number>(0);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<{ type: "found" | "invalid" | "duplicate"; word: string } | null>(null);
  const [highlightCells, setHighlightCells] = useState<Set<string>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
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
            setTimeLeft(60);
            setFoundWords([]);
            setTotalFound(0);
            totalFoundRef.current = 0;
            setGridNum(1);
            setUserInput("");
            setFeedback(null);
            setHighlightCells(new Set());
            setGridData(generateWordGrid());
            setPhase("playing");
        
            setTimeout(() => inputRef.current?.focus(), 200);
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  cleanup();
                  setPhase("done");
                  setTimeout(() => {
                    const final = Math.min(95, Math.max(0, scoreRef.current));
                    onGameComplete({ score: final, won: totalFoundRef.current >= 6 });
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

  function submitWord() {
    if (phase !== "playing" || !gridData) return;

    const word = userInput.trim().toUpperCase();
    setUserInput("");

    if (word.length < 3) return;

    // Check if already found
    if (foundWords.includes(word)) {
      setFeedback({ type: "duplicate", word });
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 1000);
      return;
    }

    // Check if word is in the grid
    const placed = gridData.words.find(w => w.word === word);
    if (placed) {
      // Found a word!
      const pts = word.length * 3;
      const newScore = scoreRef.current + pts;
      scoreRef.current = newScore;
      setScore(newScore);
      const newFound = [...foundWords, word];
      setFoundWords(newFound);
      const newTotal = totalFound + 1;
      setTotalFound(newTotal);
      totalFoundRef.current = newTotal;

      // Highlight cells
      const cells = new Set<string>();
      for (let i = 0; i < word.length; i++) {
        const r = placed.direction === "vertical" ? placed.row + i : placed.row;
        const c = placed.direction === "horizontal" ? placed.col + i : placed.col;
        cells.add(`${r},${c}`);
      }
      setHighlightCells(prev => new Set([...prev, ...cells]));

      setFeedback({ type: "found", word });
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 1200);

      // Check if all words found on this grid
      if (newFound.length >= gridData.words.length) {
        if (gridNum < 2) {
          // Next grid
          setTimeout(() => {
            setGridNum(2);
            setFoundWords([]);
            setHighlightCells(new Set());
            setGridData(generateWordGrid());
            setTimeout(() => inputRef.current?.focus(), 100);
          }, 1000);
        } else {
          // All grids done
          cleanup();
          setPhase("done");
          setTimeout(() => {
            const final = Math.min(95, Math.max(0, scoreRef.current));
            onGameComplete({ score: final, won: totalFoundRef.current >= 6 });
          }, 500);
        }
      }
    } else {
      setFeedback({ type: "invalid", word });
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 1000);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") submitWord();
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-gray-400 mb-2">Find hidden words in the letter grid!</p>
        <p className="text-gray-500 text-sm mb-6">2 grids, 60 seconds. Find 6+ words total to win!</p>
        <button
          onClick={begin}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-green-500/20 text-lg"
        >
          🔍 Start Hunting!
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
          Grid: <span className="text-white font-bold">{gridNum}/2</span>
        </div>
        <div className="text-sm text-gray-400">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 px-2">
        <div className="text-xs text-gray-500">
          Found: <span className="text-green-400 font-bold">{foundWords.length}</span>
          {gridData && <span className="text-gray-600">/{gridData.words.length} this grid</span>}
        </div>
        <div className="text-xs text-gray-500">
          Total: <span className="text-cyan-400 font-bold">{totalFound} words</span>
        </div>
      </div>

      {/* Letter Grid */}
      {gridData && phase === "playing" && (
        <div className="flex justify-center mb-4">
          <div className="grid grid-cols-5 gap-1 p-2 bg-gray-800 rounded-xl">
            {gridData.grid.map((row, r) =>
              row.map((letter, c) => {
                const key = `${r},${c}`;
                const isHighlighted = highlightCells.has(key);
                return (
                  <div
                    key={key}
                    className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg font-bold text-lg transition-all duration-300 ${
                      isHighlighted
                        ? "bg-green-500/30 text-green-400 border-2 border-green-500/50"
                        : "bg-gray-700 text-white border border-gray-600"
                    }`}
                  >
                    {letter}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className={`text-center text-sm font-bold mb-2 ${
          feedback.type === "found" ? "text-green-400" :
          feedback.type === "duplicate" ? "text-yellow-400" :
          "text-red-400"
        }`}>
          {feedback.type === "found" && `✅ Found "${feedback.word}"! Nice one!`}
          {feedback.type === "duplicate" && `🔄 You already found "${feedback.word}"`}
          {feedback.type === "invalid" && `❌ "${feedback.word}" no dey this grid o`}
        </div>
      )}

      {/* Input */}
      {phase === "playing" && (
        <div className="max-w-xs mx-auto mb-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              className="flex-1 text-center text-lg font-bold bg-gray-700 border-2 border-gray-600 rounded-xl py-3 text-white focus:border-green-400 focus:outline-none uppercase"
              placeholder="Type a word..."
              autoFocus
            />
            <button
              onClick={submitWord}
              className="bg-green-500 text-white font-bold px-4 rounded-xl hover:bg-green-600 transition"
            >
              GO
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            Words go horizontal or vertical (3-5 letters)
          </div>
        </div>
      )}

      {/* Found words list */}
      {phase === "playing" && foundWords.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 px-2 mb-2">
          {foundWords.map(w => (
            <span key={w} className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
              {w}
            </span>
          ))}
        </div>
      )}

      {phase === "done" && (
        <div className="text-center py-8">
          <div className="text-3xl font-black text-yellow-400 mb-2">
            {totalFound >= 6 ? "Word master! 📖🔥" : "Keep hunting! 🔍"}
          </div>
          <div className="text-gray-400 text-sm">
            {totalFound} words found | Score: {Math.min(95, Math.max(0, score))}
          </div>
        </div>
      )}
    </div>
  );
}
