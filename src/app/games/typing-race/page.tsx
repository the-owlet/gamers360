"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function TypingRacePage() {
  return (
    <GameWrapper gameSlug="typing-race" gameName="Typing Race" gameIcon="⌨️">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

const WORDS = [
  "cat", "dog", "run", "jump", "fast", "cool", "play", "game",
  "fire", "star", "moon", "rain", "tree", "rock", "fish", "bird",
  "lamp", "book", "cake", "ship", "gold", "wave", "lake", "home",
  "king", "dark", "wind", "storm", "light", "dream", "magic", "sword",
  "brave", "quest", "flame", "spark", "flash", "power", "stone", "steel",
  "river", "cloud", "blade", "drift", "frost", "globe", "heart", "jewel",
];

const GAME_TIME = 60;

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [currentWord, setCurrentWord] = useState("");
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [score, setScore] = useState(0);
  const [wordsTyped, setWordsTyped] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; correct: boolean } | null>(null);
  const [wordStartTime, setWordStartTime] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreRef = useRef(0);
  const wordsRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { wordsRef.current = wordsTyped; }, [wordsTyped]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const pickWord = useCallback(() => {
    const word = WORDS[Math.floor(gameRandom() * WORDS.length)];
    setCurrentWord(word);
    setInput("");
    setWordStartTime(Date.now());
  }, []);

  function init() {
      startGame();
    }

    // Auto-start game when isPlaying becomes true (after bet selection)
    const _hasStarted = useRef(false);
    useEffect(() => {
      if (isPlaying && !_hasStarted.current) {
        _hasStarted.current = true;
        setScore(0);
            scoreRef.current = 0;
            setWordsTyped(0);
            wordsRef.current = 0;
            setStreak(0);
            setTimeLeft(GAME_TIME);
            setFeedback(null);
            setPhase("playing");
            pickWord();
        
            setTimeout(() => inputRef.current?.focus(), 100);
        
            timerRef.current = setInterval(() => {
              setTimeLeft((t) => {
                if (t <= 1) {
                  if (timerRef.current) clearInterval(timerRef.current);
                  const finalScore = Math.min(95, scoreRef.current);
                  setPhase("done");
                  onGameComplete({ score: finalScore, won: wordsRef.current >= 5 });
                  return 0;
                }
                return t - 1;
              });
            }, 1000);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  function showFeedback(text: string, correct: boolean) {
    setFeedback({ text, correct });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 600);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (phase !== "playing") return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      checkWord();
    }
  }

  function checkWord() {
    if (input.trim().toLowerCase() === currentWord.toLowerCase()) {
      const elapsed = (Date.now() - wordStartTime) / 1000;
      const speedBonus = elapsed < 1.5 ? 4 : elapsed < 2.5 ? 2 : 0;
      const pts = 8 + speedBonus;
      const newScore = scoreRef.current + pts;
      setScore(newScore);
      scoreRef.current = newScore;
      setWordsTyped((w) => w + 1);
      wordsRef.current += 1;
      setStreak((s) => s + 1);
      showFeedback(`+${pts}${speedBonus > 0 ? " Fast!" : ""}`, true);
      pickWord();
    } else {
      setStreak(0);
      showFeedback("Wrong!", false);
      setInput("");
    }
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">⌨️</div>
        <p className="text-gray-400 text-center max-w-xs">
          Type the words as fast as you can! Press Enter or Space to submit. 30 seconds on the clock!
        </p>
        <button
          onClick={init}
          className="px-8 py-3 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 transition-all shadow-lg shadow-blue-500/30"
        >
          Start Typing
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
      {/* Stats bar */}
      <div className="flex justify-between w-full text-sm">
        <span className="text-gray-400">Words: {wordsTyped}</span>
        <span className={`font-bold ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-gray-300"}`}>
          {timeLeft}s
        </span>
        <span className="text-yellow-400 font-bold">Score: {score}</span>
      </div>

      {/* Timer bar */}
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
          style={{ width: `${(timeLeft / GAME_TIME) * 100}%` }}
        />
      </div>

      {/* Streak */}
      {streak >= 2 && (
        <div className="text-sm text-orange-400 font-bold animate-pulse">
          {streak} streak!
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className={`text-xl font-bold animate-pulse ${feedback.correct ? "text-green-400" : "text-red-400"}`}>
          {feedback.text}
        </div>
      )}

      {/* Word display */}
      {phase === "playing" && (
        <div className="bg-gray-800 rounded-2xl p-8 w-full text-center border border-gray-700">
          <p className="text-sm text-gray-500 mb-2">Type this word:</p>
          <p className="text-4xl font-mono font-bold text-white tracking-wider">
            {currentWord.split("").map((char, i) => {
              const typed = input[i];
              let color = "text-gray-400";
              if (typed !== undefined) {
                color = typed.toLowerCase() === char.toLowerCase() ? "text-green-400" : "text-red-400";
              }
              return <span key={i} className={color}>{char}</span>;
            })}
          </p>
        </div>
      )}

      {/* Input */}
      {phase === "playing" && (
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-600 text-white text-center text-xl font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Type here..."
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
        />
      )}

      {/* Submit button for mobile */}
      {phase === "playing" && (
        <button
          onClick={checkWord}
          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 transition-all"
        >
          Submit
        </button>
      )}

      {/* Done */}
      {phase === "done" && (
        <div className="text-center space-y-3">
          <p className="text-lg font-bold text-white">
            {wordsTyped >= 5 ? "Great typing!" : "Keep practicing!"}
          </p>
          <p className="text-gray-400">{wordsTyped} words typed correctly</p>
          <button
            onClick={init}
            className="px-6 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 transition-all"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
