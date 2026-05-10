"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

type RoomContent = "treasure" | "trap" | "puzzle" | "empty" | "boss";

interface Room {
  id: number;
  content: RoomContent;
  revealed: boolean;
  value: number;
  puzzleAnswer?: number;
  puzzleOptions?: number[];
  puzzleQuestion?: string;
}

function generatePuzzle(difficulty: number): { question: string; answer: number; options: number[] } {
  const a = Math.floor(gameRandom() * (5 + difficulty * 3)) + 2;
  const b = Math.floor(gameRandom() * (5 + difficulty * 2)) + 1;
  const ops = ["+", "-", "×"];
  const op = ops[Math.floor(gameRandom() * (difficulty > 2 ? 3 : 2))];
  let answer: number;
  if (op === "+") answer = a + b;
  else if (op === "-") answer = Math.abs(a - b);
  else answer = a * b;

  const options = [answer];
  while (options.length < 3) {
    const wrong = answer + Math.floor(gameRandom() * 10) - 5;
    if (wrong !== answer && !options.includes(wrong) && wrong >= 0) options.push(wrong);
  }
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(gameRandom() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return { question: `${a} ${op} ${b} = ?`, answer, options };
}

function generateRooms(depth: number): Room[] {
  const rooms: Room[] = [];
  const count = 3;
  const contents: RoomContent[] = [];

  if (depth === 5) {
    contents.push("boss");
    contents.push(gameRandom() < 0.5 ? "treasure" : "puzzle");
    contents.push("trap");
  } else {
    const pool: RoomContent[] = ["treasure", "trap", "puzzle", "empty"];
    for (let i = 0; i < count; i++) {
      contents.push(pool[Math.floor(gameRandom() * pool.length)]);
    }
    if (!contents.includes("treasure") && !contents.includes("puzzle")) {
      contents[Math.floor(gameRandom() * count)] = "treasure";
    }
  }

  for (let i = 0; i < count; i++) {
    const room: Room = {
      id: i,
      content: contents[i],
      revealed: false,
      value: contents[i] === "treasure" ? 8 + depth * 3 : contents[i] === "boss" ? 25 : 0,
    };
    if (contents[i] === "puzzle" || contents[i] === "boss") {
      const p = generatePuzzle(depth);
      room.puzzleQuestion = p.question;
      room.puzzleAnswer = p.answer;
      room.puzzleOptions = p.options;
      room.value = contents[i] === "boss" ? 25 : 5 + depth * 2;
    }
    rooms.push(room);
  }
  return rooms;
}

export default function TreasureHunterPage() {
  return (
    <GameWrapper gameSlug="treasure-hunter" gameName="Treasure Hunter" gameIcon="🏰">
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
  const [phase, setPhase] = useState<"idle" | "choose" | "puzzle" | "result" | "done">("idle");
  const [depth, setDepth] = useState(1);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [feedback, setFeedback] = useState("");
  const [treasuresFound, setTreasuresFound] = useState(0);
  const scoreRef = useRef(0);
  const maxDepth = 5;

  const endGame = useCallback((finalScore: number) => {
    setPhase("done");
    const capped = Math.min(95, Math.max(0, finalScore));
    setTimeout(() => onGameComplete({ score: capped, won: capped >= 20 }), 800);
  }, [onGameComplete]);

  function begin() {
      startGame();
    }

    // Auto-start game when isPlaying becomes true (after bet selection)
    const _hasStarted = useRef(false);
    useEffect(() => {
      if (isPlaying && !_hasStarted.current) {
        _hasStarted.current = true;
        setScore(0); scoreRef.current = 0;
            setLives(3);
            setDepth(1);
            setTreasuresFound(0);
            setFeedback("");
            setCurrentRoom(null);
            setRooms(generateRooms(1));
            setPhase("choose");
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  function enterRoom(room: Room) {
    if (phase !== "choose" || room.revealed) return;

    const newRooms = rooms.map(r => r.id === room.id ? { ...r, revealed: true } : r);
    setRooms(newRooms);
    setCurrentRoom(room);

    if (room.content === "treasure") {
      scoreRef.current += room.value;
      setScore(scoreRef.current);
      setTreasuresFound(prev => prev + 1);
      setFeedback(`💰 Found treasure! +${room.value} pts`);
      advanceAfterDelay();
    } else if (room.content === "trap") {
      const newLives = lives - 1;
      setLives(newLives);
      setFeedback("🪤 It's a trap! -1 life");
      if (newLives <= 0) {
        setTimeout(() => endGame(scoreRef.current), 1000);
      } else {
        advanceAfterDelay();
      }
    } else if (room.content === "empty") {
      setFeedback("🕸️ Empty room... nothing here");
      advanceAfterDelay();
    } else if (room.content === "puzzle" || room.content === "boss") {
      setFeedback(room.content === "boss" ? "👹 Boss room! Solve to defeat!" : "🧩 Puzzle door! Solve to unlock treasure!");
      setPhase("puzzle");
    }
  }

  function advanceAfterDelay() {
    setTimeout(() => {
      if (depth >= maxDepth) {
        endGame(scoreRef.current);
      } else {
        const next = depth + 1;
        setDepth(next);
        setRooms(generateRooms(next));
        setCurrentRoom(null);
        setFeedback("");
        setPhase("choose");
      }
    }, 1200);
  }

  function solvePuzzle(answer: number) {
    if (!currentRoom) return;
    if (answer === currentRoom.puzzleAnswer) {
      scoreRef.current += currentRoom.value;
      setScore(scoreRef.current);
      setTreasuresFound(prev => prev + 1);
      setFeedback(`✅ Correct! +${currentRoom.value} pts`);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setFeedback("❌ Wrong! -1 life");
      if (newLives <= 0) {
        setTimeout(() => endGame(scoreRef.current), 1000);
        return;
      }
    }
    advanceAfterDelay();
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🏰</div>
        <p className="text-gray-400 mb-2">Explore a dungeon — 5 floors, 3 doors each!</p>
        <p className="text-gray-500 text-sm mb-6">Find treasure, solve puzzles, avoid traps. 3 lives. Boss on floor 5!</p>
        <button
          onClick={begin}
          className="bg-gradient-to-r from-amber-600 to-yellow-700 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-amber-500/20 text-lg"
        >
          🏰 Enter Dungeon
        </button>
      </div>
    );
  }

  const roomEmojis: Record<RoomContent, string> = {
    treasure: "💰", trap: "🪤", puzzle: "🧩", empty: "🕸️", boss: "👹"
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">
          Floor: <span className="text-amber-400 font-bold">{depth}/{maxDepth}</span>
        </div>
        <div className="text-sm text-gray-400">
          Lives: <span className="text-red-400 font-bold">{"❤️".repeat(lives)}{"🖤".repeat(Math.max(0, 3 - lives))}</span>
        </div>
        <div className="text-sm text-gray-400">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2 rounded-full transition-all" style={{ width: `${(depth / maxDepth) * 100}%` }} />
      </div>

      {feedback && (
        <div className={`text-center mb-4 text-sm font-bold ${
          feedback.includes("+") || feedback.includes("Correct") ? "text-green-400" :
          feedback.includes("trap") || feedback.includes("Wrong") ? "text-red-400" :
          feedback.includes("Boss") || feedback.includes("Puzzle") ? "text-purple-400" : "text-gray-400"
        }`}>
          {feedback}
        </div>
      )}

      {(phase === "choose") && (
        <>
          <div className="text-center text-sm text-gray-500 mb-3">Choose a door to enter...</div>
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
            {rooms.map(room => (
              <button key={room.id} onClick={() => enterRoom(room)} disabled={room.revealed}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all text-3xl ${
                  room.revealed
                    ? "bg-gray-800 border-2 border-gray-700 opacity-60"
                    : "bg-gradient-to-b from-amber-700 to-amber-900 border-2 border-amber-600 hover:scale-105 hover:border-yellow-400 cursor-pointer shadow-lg"
                }`}>
                {room.revealed ? (
                  <>
                    <span>{roomEmojis[room.content]}</span>
                    <span className="text-[10px] text-gray-500 mt-1">{room.content}</span>
                  </>
                ) : (
                  <>
                    <span>🚪</span>
                    <span className="text-[10px] text-amber-400 mt-1">Door {room.id + 1}</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === "puzzle" && currentRoom && (
        <div className="text-center">
          <div className="text-xl font-black text-white mb-4">{currentRoom.puzzleQuestion}</div>
          <div className="flex justify-center gap-3">
            {currentRoom.puzzleOptions?.map((opt, i) => (
              <button key={i} onClick={() => solvePuzzle(opt)}
                className="w-20 h-16 bg-gray-700 hover:bg-gray-600 rounded-xl text-xl font-bold text-white transition hover:scale-105 active:scale-95">
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center mt-6">
          <div className="text-3xl font-black text-yellow-400 mb-1">
            {lives > 0 ? "Dungeon Cleared!" : "You Perished!"}
          </div>
          <div className="text-gray-400 text-sm">
            Treasures: {treasuresFound} | Floors: {depth}/{maxDepth} | Score: {Math.min(95, Math.max(0, score))}
          </div>
        </div>
      )}
    </div>
  );
}
