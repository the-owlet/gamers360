"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

const WORD_POOLS = [
  { words: ["GAME", "PLAY", "COIN", "LUCK", "DICE", "CARD", "SPIN", "GOLD", "CASH", "STAR"], pts: 8 },
  { words: ["BONUS", "PRIZE", "WHEEL", "TOWER", "VAULT", "CROWN", "FLAME", "POWER", "LUCKY", "BLAST"], pts: 12 },
  { words: ["JACKPOT", "DIAMOND", "FORTUNE", "THUNDER", "MYSTERY", "PHARAOH", "CRYSTAL", "WARRIOR"], pts: 18 },
  { words: ["TREASURE", "CHAMPION", "MYSTICAL", "VOLCANIC", "GEMSTONE", "ROULETTE", "FIRESTORM"], pts: 24 },
];

function scrambleWord(word: string): string {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(gameRandom() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join("");
  if (result === word && word.length > 2) return scrambleWord(word);
  return result;
}

export default function WordScramblePage() {
  return (
    <GameWrapper gameSlug="word-scramble" gameName="Word Scramble" gameIcon="📝">
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
  const [word, setWord] = useState("");
  const [scrambled, setScrambled] = useState("");
  const [guess, setGuess] = useState("");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | "skip" | null>(null);
  const [solved, setSolved] = useState(0);
  const [pool, setPool] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [hint, setHint] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const scoreRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  function nextWord(roundNum: number) {
    const poolIdx = Math.min(3, Math.floor(roundNum / 3));
    const p = WORD_POOLS[poolIdx];
    const w = p.words[Math.floor(gameRandom() * p.words.length)];
    setWord(w);
    setScrambled(scrambleWord(w));
    setGuess("");
    setPool(poolIdx);
    setHintUsed(false);
    setHint("");
    setFeedback(null);
    setTimeout(() => inputRef.current?.focus(), 100);
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
            setRound(1);
            setSolved(0);
            setTimeLeft(60);
            setPhase("playing");
            nextWord(1);
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  cleanup();
                  setPhase("done");
                  setTimeout(() => {
                    const final = Math.min(90, Math.max(0, scoreRef.current));
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

  function submitGuess() {
    if (phase !== "playing" || feedback) return;
    if (guess.toUpperCase() === word) {
      const pts = hintUsed ? Math.floor(WORD_POOLS[pool].pts / 2) : WORD_POOLS[pool].pts;
      const newScore = scoreRef.current + pts;
      scoreRef.current = newScore;
      setScore(newScore);
      setSolved(prev => prev + 1);
      setFeedback("correct");

      setTimeout(() => {
        const next = round + 1;
        setRound(next);
        nextWord(next);
      }, 600);
    } else {
      setFeedback("wrong");
      setTimeout(() => setFeedback(null), 500);
    }
  }

  function skipWord() {
    if (phase !== "playing") return;
    setFeedback("skip");
    setTimeout(() => {
      const next = round + 1;
      setRound(next);
      nextWord(next);
    }, 400);
  }

  function useHint() {
    if (hintUsed || phase !== "playing") return;
    setHintUsed(true);
    setHint(word[0] + "..." + word[word.length - 1]);
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📝</div>
        <p className="text-gray-400 mb-2">Unscramble words as fast as you can!</p>
        <p className="text-gray-500 text-sm mb-6">60 seconds — longer words earn more. Use hints at half points.</p>
        <button
          onClick={begin}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-emerald-500/20 text-lg"
        >
          📝 Start Scrambling!
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">
          Time: <span className={`font-bold ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span>
        </div>
        <div className="text-sm text-gray-400">
          Solved: <span className="text-green-400 font-bold">{solved}</span>
        </div>
        <div className="text-sm text-gray-400">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
      </div>

      {phase === "playing" && (
        <div className="text-center">
          <div className="flex justify-center gap-2 mb-6">
            {scrambled.split("").map((letter, i) => (
              <div
                key={i}
                className="w-10 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-xl font-black text-yellow-400 border border-gray-600"
              >
                {letter}
              </div>
            ))}
          </div>

          {hint && (
            <div className="text-xs text-purple-400 mb-3">Hint: {hint}</div>
          )}

          <div className="max-w-xs mx-auto mb-4">
            <input
              ref={inputRef}
              type="text"
              value={guess}
              onChange={e => setGuess(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && submitGuess()}
              placeholder="Type your answer..."
              maxLength={word.length}
              className={`w-full px-4 py-3 bg-gray-800 border-2 rounded-xl text-center text-lg font-bold text-white
                focus:outline-none transition ${
                  feedback === "correct" ? "border-green-500" :
                  feedback === "wrong" ? "border-red-500" :
                  "border-gray-600 focus:border-cyan-500"
                }`}
            />
          </div>

          <div className="flex justify-center gap-2">
            <button
              onClick={submitGuess}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition text-sm"
            >
              Submit
            </button>
            <button
              onClick={useHint}
              disabled={hintUsed}
              className="bg-purple-500/20 text-purple-400 font-bold px-4 py-2.5 rounded-xl border border-purple-500/30 disabled:opacity-30 text-sm"
            >
              💡 Hint
            </button>
            <button
              onClick={skipWord}
              className="bg-gray-700 text-gray-300 font-bold px-4 py-2.5 rounded-xl hover:bg-gray-600 transition text-sm"
            >
              Skip →
            </button>
          </div>

          {feedback === "correct" && (
            <div className="mt-3 text-green-400 font-bold text-sm animate-bounce">Correct! +{hintUsed ? Math.floor(WORD_POOLS[pool].pts / 2) : WORD_POOLS[pool].pts} pts</div>
          )}
          {feedback === "wrong" && (
            <div className="mt-3 text-red-400 font-bold text-sm">Try again!</div>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="text-center py-8">
          <div className="text-3xl font-black text-yellow-400 mb-2">Time's Up!</div>
          <div className="text-gray-400 text-sm">
            Solved {solved} words | Score: {Math.min(90, Math.max(0, score))}
          </div>
        </div>
      )}
    </div>
  );
}
