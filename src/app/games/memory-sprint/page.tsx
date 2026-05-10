"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

const ALL_ITEMS = [
  "🍎", "🍌", "🍇", "🍊", "🍋", "🍓", "🍑", "🍒",
  "🥑", "🥕", "🌽", "🍕", "🍔", "🌮", "🍦", "🍩",
  "🎸", "🎹", "🎺", "🥁", "🎮", "🎯", "🎲", "🎳",
  "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏓", "🥊",
  "🐶", "🐱", "🐸", "🐵", "🦊", "🐷", "🐻", "🦁",
  "🌸", "🌺", "🌻", "🌹", "💐", "🌷", "🌼", "🪻",
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(gameRandom() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface RoundConfig {
  showCount: number;
  optionCount: number;
  showTime: number; // ms
}

const ROUND_CONFIGS: RoundConfig[] = [
  { showCount: 3, optionCount: 6, showTime: 3000 },
  { showCount: 3, optionCount: 7, showTime: 3000 },
  { showCount: 4, optionCount: 7, showTime: 3000 },
  { showCount: 4, optionCount: 8, showTime: 2500 },
  { showCount: 5, optionCount: 8, showTime: 2500 },
  { showCount: 5, optionCount: 9, showTime: 2500 },
  { showCount: 6, optionCount: 10, showTime: 2000 },
  { showCount: 6, optionCount: 10, showTime: 2000 },
];

export default function MemorySprintPage() {
  return (
    <GameWrapper gameSlug="memory-sprint" gameName="Memory Sprint" gameIcon="🧠">
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
  const [roundPhase, setRoundPhase] = useState<"showing" | "picking" | "result">("showing");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const scoreRef = useRef<number>(0);
  const [correctRounds, setCorrectRounds] = useState(0);
  const correctRoundsRef = useRef<number>(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [shownItems, setShownItems] = useState<string[]>([]);
  const [allOptions, setAllOptions] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [roundResult, setRoundResult] = useState<"correct" | "wrong" | null>(null);
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const showTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  function startRound(roundNum: number) {
    const config = ROUND_CONFIGS[roundNum] || ROUND_CONFIGS[ROUND_CONFIGS.length - 1];
    const shuffled = shuffleArray(ALL_ITEMS);
    const shown = shuffled.slice(0, config.showCount);
    const distractors = shuffled.slice(config.showCount, config.optionCount);
    const options = shuffleArray([...shown, ...distractors]);

    setShownItems(shown);
    setAllOptions(options);
    setSelectedItems(new Set());
    setRoundResult(null);
    setRoundPhase("showing");
    setCountdown(Math.ceil(config.showTime / 1000));

    // Countdown during showing phase
    let remaining = Math.ceil(config.showTime / 1000);
    const countdownInterval = setInterval(() => {
      remaining--;
      setCountdown(remaining);
      if (remaining <= 0) clearInterval(countdownInterval);
    }, 1000);

    showTimerRef.current = setTimeout(() => {
      clearInterval(countdownInterval);
      setRoundPhase("picking");
    }, config.showTime);
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
            setCorrectRounds(0);
            correctRoundsRef.current = 0;
            setRound(0);
            setTimeLeft(60);
            setPhase("playing");
        
            startRound(0);
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  clearInterval(timerRef.current!);
                  if (showTimerRef.current) clearTimeout(showTimerRef.current);
                  const finalScore = Math.min(95, scoreRef.current);
                  const won = correctRoundsRef.current >= 5;
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

  function toggleItem(item: string) {
    if (roundPhase !== "picking") return;
    const newSelected = new Set(selectedItems);
    if (newSelected.has(item)) {
      newSelected.delete(item);
    } else {
      if (newSelected.size >= shownItems.length) return; // Can't select more than needed
      newSelected.add(item);
    }
    setSelectedItems(newSelected);
  }

  function submitSelection() {
    if (selectedItems.size !== shownItems.length) return;

    const shownSet = new Set(shownItems);
    let allCorrect = true;
    for (const item of selectedItems) {
      if (!shownSet.has(item)) {
        allCorrect = false;
        break;
      }
    }

    if (allCorrect) {
      const roundScore = 10 + round;
      const newScore = Math.min(95, score + roundScore);
      const newCorrect = correctRounds + 1;

      setScore(newScore);
      scoreRef.current = newScore;
      setCorrectRounds(newCorrect);
      correctRoundsRef.current = newCorrect;
      setRoundResult("correct");
    } else {
      setRoundResult("wrong");
    }

    setRoundPhase("result");

    setTimeout(() => {
      const nextRound = round + 1;
      if (nextRound >= 8) {
        clearInterval(timerRef.current!);
        const finalScore = Math.min(95, scoreRef.current);
        const won = correctRoundsRef.current >= 5;
        setPhase("done");
        onGameComplete({ score: finalScore, won });
      } else {
        setRound(nextRound);
        startRound(nextRound);
      }
    }, 1500);
  }

  const config = ROUND_CONFIGS[round] || ROUND_CONFIGS[ROUND_CONFIGS.length - 1];

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      {phase === "idle" && (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-2">🧠</div>
          <h2 className="text-2xl font-bold text-white">Memory Sprint</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Items flash on screen briefly, then you must pick which ones you saw!
            <br />8 rounds, 60 seconds. Get 5+ rounds right to win!
          </p>
          <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-300">
            <p>Watch the items carefully, then select them from the options.</p>
            <p className="text-yellow-400 mt-1">Difficulty increases each round!</p>
          </div>
          <button
            onClick={begin}
            className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-lg"
          >
            Start Sprint! 🧠
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="w-full space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="bg-gray-700 px-3 py-2 rounded-lg">
              <span className="text-gray-400 text-xs">ROUND</span>
              <p className="text-white font-bold">{round + 1}/8</p>
            </div>
            <div className="bg-gray-700 px-3 py-2 rounded-lg">
              <span className="text-gray-400 text-xs">CORRECT</span>
              <p className="text-green-400 font-bold">{correctRounds}/8</p>
            </div>
            <div className={`px-3 py-2 rounded-lg ${timeLeft <= 10 ? "bg-red-900 animate-pulse" : "bg-gray-700"}`}>
              <span className="text-gray-400 text-xs">TIME</span>
              <p className={`font-bold ${timeLeft <= 10 ? "text-red-400" : "text-white"}`}>{timeLeft}s</p>
            </div>
            <div className="bg-gray-700 px-3 py-2 rounded-lg">
              <span className="text-gray-400 text-xs">SCORE</span>
              <p className="text-yellow-400 font-bold">{score}</p>
            </div>
          </div>

          {/* Round progress */}
          <div className="flex justify-center gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${
                i < round ? (
                  i < correctRounds ? "bg-green-500" : "bg-red-500"
                ) : i === round ? "bg-yellow-400 scale-125 animate-pulse" : "bg-gray-600"
              }`} />
            ))}
          </div>

          {/* Showing phase */}
          {roundPhase === "showing" && (
            <div className="text-center space-y-4">
              <div className="bg-amber-900/30 border border-amber-700 rounded-xl px-4 py-2">
                <p className="text-amber-300 text-sm font-medium">Memorize these items! ({countdown}s)</p>
              </div>

              <div className="bg-gray-800 rounded-2xl p-6 min-h-[160px] flex items-center justify-center">
                <div className="flex flex-wrap justify-center gap-4">
                  {shownItems.map((item, i) => (
                    <div key={i} className="text-5xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(countdown / Math.ceil((config.showTime) / 1000)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Picking phase */}
          {roundPhase === "picking" && (
            <div className="space-y-4">
              <div className="bg-blue-900/30 border border-blue-700 rounded-xl px-4 py-2 text-center">
                <p className="text-blue-300 text-sm font-medium">
                  Which {shownItems.length} items did you see? Pick them!
                  <span className="ml-2 text-blue-400">({selectedItems.size}/{shownItems.length} selected)</span>
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {allOptions.map((item, i) => {
                  const isSelected = selectedItems.has(item);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleItem(item)}
                      className={`text-3xl p-3 rounded-xl border-2 transition-all duration-150 active:scale-90 ${
                        isSelected
                          ? "bg-blue-800 border-blue-400 scale-105 shadow-lg shadow-blue-500/30"
                          : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={submitSelection}
                disabled={selectedItems.size !== shownItems.length}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                Confirm Selection ✅
              </button>
            </div>
          )}

          {/* Result phase */}
          {roundPhase === "result" && (
            <div className="text-center space-y-4">
              <div className={`rounded-2xl p-6 ${
                roundResult === "correct" ? "bg-green-900/50 border border-green-700" : "bg-red-900/50 border border-red-700"
              }`}>
                <div className="text-5xl mb-2">{roundResult === "correct" ? "✅" : "❌"}</div>
                <p className={`font-bold text-lg ${roundResult === "correct" ? "text-green-300" : "text-red-300"}`}>
                  {roundResult === "correct" ? "Correct! You remember well!" : "Not quite! See the right items:"}
                </p>
                {roundResult === "wrong" && (
                  <div className="flex justify-center gap-2 mt-3">
                    {shownItems.map((item, i) => (
                      <span key={i} className="text-3xl">{item}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="text-center space-y-4">
          <div className="text-6xl">{correctRounds >= 5 ? "🏆" : "🧠"}</div>
          <h2 className="text-2xl font-bold text-white">
            {correctRounds >= 5 ? "Sharp Memory! Your brain dey fire!" : "Good try! Keep training your memory!"}
          </h2>
          <div className="bg-gray-700 rounded-xl p-4 space-y-2">
            <p className="text-gray-300">Rounds Correct: <span className="text-green-400 font-bold">{correctRounds}/8</span></p>
            <p className="text-gray-300">Final Score: <span className="text-yellow-400 font-bold">{Math.min(95, score)}</span></p>
            <p className="text-gray-300">Accuracy: <span className="text-blue-400 font-bold">{Math.round((correctRounds / 8) * 100)}%</span></p>
          </div>
          <button
            onClick={begin}
            className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
          >
            Try Again 🔄
          </button>
        </div>
      )}
    </div>
  );
}
