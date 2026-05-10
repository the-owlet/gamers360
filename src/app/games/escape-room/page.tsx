"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

type PuzzleType = "pattern" | "math" | "sequence" | "memory" | "decode";

interface Puzzle {
  type: PuzzleType;
  question: string;
  display: string[];
  answer: number;
  options: number[];
  points: number;
}

function generatePatternPuzzle(diff: number): Puzzle {
  const start = Math.floor(gameRandom() * 5) + 1;
  const step = Math.floor(gameRandom() * (3 + diff)) + 2;
  const seq = [start, start + step, start + step * 2, start + step * 3];
  const answer = start + step * 4;
  const options = [answer];
  while (options.length < 4) {
    const w = answer + Math.floor(gameRandom() * 8) - 4;
    if (w !== answer && !options.includes(w) && w > 0) options.push(w);
  }
  for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(gameRandom() * (i + 1)); [options[i], options[j]] = [options[j], options[i]]; }
  return { type: "pattern", question: "What comes next?", display: [...seq.map(String), "?"], answer, options, points: 10 + diff * 3 };
}

function generateMathPuzzle(diff: number): Puzzle {
  const a = Math.floor(gameRandom() * (10 + diff * 5)) + 3;
  const b = Math.floor(gameRandom() * (8 + diff * 3)) + 2;
  const ops = ["+", "-", "×"];
  const op = ops[Math.floor(gameRandom() * (diff > 1 ? 3 : 2))];
  let answer: number;
  if (op === "+") answer = a + b; else if (op === "-") answer = Math.abs(a - b); else answer = a * b;
  const options = [answer];
  while (options.length < 4) {
    const w = answer + Math.floor(gameRandom() * 10) - 5;
    if (w !== answer && !options.includes(w) && w >= 0) options.push(w);
  }
  for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(gameRandom() * (i + 1)); [options[i], options[j]] = [options[j], options[i]]; }
  return { type: "math", question: "Solve to unlock!", display: [`${a} ${op} ${b} = ?`], answer, options, points: 8 + diff * 3 };
}

function generateSequencePuzzle(diff: number): Puzzle {
  const shapes = ["🔴", "🔵", "🟢", "🟡", "🟣"];
  const len = 3 + Math.min(diff, 2);
  const pattern: number[] = [];
  for (let i = 0; i < len; i++) pattern.push(Math.floor(gameRandom() * (3 + Math.min(diff, 2))));
  const answerIdx = Math.floor(gameRandom() * len);
  const answer = pattern[answerIdx];
  const display = pattern.map((p, i) => i === answerIdx ? "❓" : shapes[p]);

  const options = [answer];
  while (options.length < 4) {
    const w = Math.floor(gameRandom() * (3 + Math.min(diff, 2)));
    if (!options.includes(w)) options.push(w);
  }
  for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(gameRandom() * (i + 1)); [options[i], options[j]] = [options[j], options[i]]; }

  return {
    type: "sequence", question: "Which shape is missing?",
    display, answer, options: options.map(o => o),
    points: 12 + diff * 2,
  };
}

export default function EscapeRoomPage() {
  return (
    <GameWrapper gameSlug="escape-room" gameName="Escape Room" gameIcon="🔐">
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
  const [phase, setPhase] = useState<"idle" | "playing" | "solved" | "done">("idle");
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [solved, setSolved] = useState(0);
  const [roomNum, setRoomNum] = useState(1);
  const [totalSolved, setTotalSolved] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const scoreRef = useRef(0);
  const totalRooms = 3;
  const puzzlesPerRoom = 3;
  const shapes = ["🔴", "🔵", "🟢", "🟡", "🟣"];

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  function generateRoom(room: number): Puzzle[] {
    const generators = [generatePatternPuzzle, generateMathPuzzle, generateSequencePuzzle];
    const shuffled = [...generators];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(gameRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.map(gen => gen(room));
  }

  function begin() {
      startGame();
    }

    // Auto-start game when isPlaying becomes true (after bet selection)
    const _hasStarted = useRef(false);
    useEffect(() => {
      if (isPlaying && !_hasStarted.current) {
        _hasStarted.current = true;
        setScore(0); scoreRef.current = 0;
            setTimeLeft(60);
            setSolved(0);
            setTotalSolved(0);
            setRoomNum(1);
            setCurrentIdx(0);
            setFeedback(null);
            const room = generateRoom(1);
            setPuzzles(room);
            setPhase("playing");
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  cleanup();
                  setPhase("done");
                  setTimeout(() => {
                    const final = Math.min(95, Math.max(0, scoreRef.current));
                    onGameComplete({ score: final, won: final >= 20 });
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

  function pickAnswer(val: number) {
    if (phase !== "playing" || feedback) return;
    const puzzle = puzzles[currentIdx];

    if (val === puzzle.answer) {
      const timeBonus = timeLeft > 40 ? 5 : timeLeft > 20 ? 3 : 0;
      const pts = puzzle.points + timeBonus;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      setFeedback("correct");
      const newSolved = solved + 1;
      setSolved(newSolved);
      setTotalSolved(prev => prev + 1);

      setTimeout(() => {
        setFeedback(null);
        if (newSolved >= puzzlesPerRoom) {
          if (roomNum >= totalRooms) {
            cleanup();
            const bonus = 10;
            scoreRef.current += bonus;
            setScore(scoreRef.current);
            setPhase("done");
            setTimeout(() => {
              const final = Math.min(95, Math.max(0, scoreRef.current));
              onGameComplete({ score: final, won: true });
            }, 500);
          } else {
            setPhase("solved");
            setTimeout(() => {
              const next = roomNum + 1;
              setRoomNum(next);
              setSolved(0);
              setCurrentIdx(0);
              setPuzzles(generateRoom(next));
              setPhase("playing");
            }, 1200);
          }
        } else {
          setCurrentIdx(currentIdx + 1);
        }
      }, 500);
    } else {
      setFeedback("wrong");
      setTimeout(() => setFeedback(null), 500);
    }
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🔐</div>
        <p className="text-gray-400 mb-2">Escape 3 rooms by solving 3 puzzles each!</p>
        <p className="text-gray-500 text-sm mb-6">60 seconds total — patterns, math & sequences. Speed = bonus points!</p>
        <button
          onClick={begin}
          className="bg-gradient-to-r from-red-500 to-rose-700 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-red-500/20 text-lg"
        >
          🔐 Enter Room 1
        </button>
      </div>
    );
  }

  const puzzle = puzzles[currentIdx];

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">
          Room: <span className="text-red-400 font-bold">{roomNum}/{totalRooms}</span>
        </div>
        <div className="text-sm text-gray-400">
          Time: <span className={`font-bold ${timeLeft <= 15 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span>
        </div>
        <div className="text-sm text-gray-400">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
      </div>

      <div className="flex gap-1 justify-center mb-4">
        {Array.from({ length: puzzlesPerRoom }).map((_, i) => (
          <div key={i} className={`w-8 h-2 rounded-full ${i < solved ? "bg-green-500" : i === solved ? "bg-yellow-500 animate-pulse" : "bg-gray-700"}`} />
        ))}
      </div>

      {phase === "solved" && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2 animate-bounce">🚪</div>
          <div className="text-xl font-black text-green-400">Room {roomNum} Escaped!</div>
          <div className="text-gray-500 text-sm">Entering room {roomNum + 1}...</div>
        </div>
      )}

      {phase === "playing" && puzzle && (
        <div className="text-center">
          <div className="bg-gray-800/50 border border-white/10 rounded-2xl p-6 mb-4">
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
              {puzzle.type === "pattern" ? "🔢 Pattern Lock" : puzzle.type === "math" ? "🧮 Code Lock" : "🎨 Shape Lock"}
            </div>
            <div className="text-sm text-gray-400 mb-4">{puzzle.question}</div>

            <div className="flex justify-center gap-3 mb-2">
              {puzzle.display.map((d, i) => (
                <div key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                  d === "?" || d === "❓"
                    ? "bg-yellow-500/20 border-2 border-yellow-500/50 text-yellow-400 animate-pulse"
                    : "bg-gray-700 border border-gray-600 text-white"
                }`}>
                  {d}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            {puzzle.options.map((opt, i) => (
              <button key={i} onClick={() => pickAnswer(opt)}
                disabled={feedback !== null}
                className={`py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 ${
                  feedback === "correct" && opt === puzzle.answer ? "bg-green-500 text-white" :
                  feedback === "wrong" && opt === puzzle.answer ? "bg-green-500/30 text-green-400" :
                  feedback ? "bg-gray-700 text-gray-500" :
                  "bg-gray-700 hover:bg-gray-600 text-white"
                }`}>
                {puzzle.type === "sequence" ? shapes[opt] : opt}
              </button>
            ))}
          </div>

          {feedback === "correct" && <div className="mt-3 text-green-400 font-bold text-sm animate-bounce">Unlocked!</div>}
          {feedback === "wrong" && <div className="mt-3 text-red-400 font-bold text-sm">Wrong code!</div>}
        </div>
      )}

      {phase === "done" && (
        <div className="text-center py-8">
          <div className="text-3xl font-black text-yellow-400 mb-1">
            {totalSolved >= puzzlesPerRoom * totalRooms ? "Full Escape!" : timeLeft <= 0 ? "Time's Up!" : "Game Over!"}
          </div>
          <div className="text-gray-400 text-sm">
            Puzzles solved: {totalSolved}/{puzzlesPerRoom * totalRooms} | Score: {Math.min(95, Math.max(0, score))}
          </div>
        </div>
      )}
    </div>
  );
}
