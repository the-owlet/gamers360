"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function EmojiChainPage() {
  return (
    <GameWrapper gameSlug="emoji-chain" gameName="Emoji Chain" gameIcon="🔗">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

const POOL_EMOJIS = ["🍎","🍊","🍋","🍇","🍓","🫐","🍑","🍒","🥝","🍌","🍉","🥭","🍍","🥥","🍈","🫒"];

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "showing" | "input" | "feedback" | "done">("idle");
  const [chain, setChain] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [playerInput, setPlayerInput] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const [chainLength, setChainLength] = useState(2);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const roundsRef = useRef(0);
  const [showingIndex, setShowingIndex] = useState(-1);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const maxRounds = 8;

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const buildChain = useCallback((length: number) => {
    const shuffled = [...POOL_EMOJIS].sort(() => gameRandom() - 0.5);
    return shuffled.slice(0, length);
  }, []);

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
            setLives(3);
            setRound(1);
            setChainLength(2);
            setRoundsCompleted(0);
            roundsRef.current = 0;
            startRound(2);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  function startRound(length: number) {
    const newChain = buildChain(length);
    setChain(newChain);
    setPlayerInput([]);
    setFeedbackType(null);
    setShowingIndex(-1);
    setPhase("showing");

    // Show emojis one by one
    let i = 0;
    const showNext = () => {
      if (i < newChain.length) {
        setShowingIndex(i);
        i++;
        timerRef.current = setTimeout(showNext, 900);
      } else {
        setShowingIndex(-1);
        timerRef.current = setTimeout(() => {
          // Build options: chain emojis + some extras, shuffled
          const extras = POOL_EMOJIS.filter(e => !newChain.includes(e))
            .sort(() => gameRandom() - 0.5)
            .slice(0, Math.max(4, length));
          const allOptions = [...new Set([...newChain, ...extras])].sort(() => gameRandom() - 0.5);
          setOptions(allOptions);
          setPhase("input");
        }, 500);
      }
    };
    timerRef.current = setTimeout(showNext, 600);
  }

  function handleEmojiTap(emoji: string) {
    if (phase !== "input") return;

    const nextIndex = playerInput.length;
    const newInput = [...playerInput, emoji];
    setPlayerInput(newInput);

    if (emoji !== chain[nextIndex]) {
      // Wrong
      const newLives = lives - 1;
      setLives(newLives);
      setFeedbackType("wrong");
      setPhase("feedback");

      if (newLives <= 0 || round >= maxRounds) {
        timerRef.current = setTimeout(() => {
          const finalScore = Math.min(95, scoreRef.current);
          setPhase("done");
          onGameComplete({ score: finalScore, won: roundsRef.current >= 4 });
        }, 1200);
      } else {
        timerRef.current = setTimeout(() => {
          setRound(prev => prev + 1);
          startRound(chainLength);
        }, 1500);
      }
      return;
    }

    if (newInput.length === chain.length) {
      // Completed the chain!
      const lengthBonus = Math.max(0, (chainLength - 2) * 3);
      const points = 10 + lengthBonus;
      const newScore = scoreRef.current + points;
      const newRounds = roundsRef.current + 1;
      scoreRef.current = newScore;
      roundsRef.current = newRounds;
      setScore(newScore);
      setRoundsCompleted(newRounds);
      setFeedbackType("correct");
      setPhase("feedback");

      if (round >= maxRounds) {
        timerRef.current = setTimeout(() => {
          const finalScore = Math.min(95, newScore);
          setPhase("done");
          onGameComplete({ score: finalScore, won: newRounds >= 4 });
        }, 1200);
        return;
      }

      timerRef.current = setTimeout(() => {
        const newLength = chainLength + 1;
        setChainLength(newLength);
        setRound(prev => prev + 1);
        startRound(newLength);
      }, 1200);
    }
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">🔗</div>
        <h2 className="text-2xl font-bold text-white">Emoji Chain</h2>
        <p className="text-gray-400 text-center max-w-xs">
          Watch the emoji chain, then repeat it in order! The chain grows each round. You have 3 lives.
        </p>
        <button
          onClick={begin}
          className="px-8 py-3 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 transform hover:scale-105 transition-all shadow-lg"
        >
          Start Game
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const finalScore = Math.min(95, score);
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="text-5xl">{roundsCompleted >= 4 ? "🎉" : "😔"}</div>
        <h2 className="text-2xl font-bold text-white">
          {roundsCompleted >= 4 ? "Great Memory!" : "Keep Trying!"}
        </h2>
        <p className="text-gray-300">Rounds completed: {roundsCompleted}/{maxRounds}</p>
        <p className="text-gray-300">Max chain length: {chainLength}</p>
        <p className="text-yellow-400 text-xl font-bold">Score: {finalScore}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="flex justify-between w-full max-w-xs text-sm">
        <span className="text-gray-300">Round {round}/{maxRounds}</span>
        <span className="text-yellow-400 font-bold">Score: {score}</span>
        <span className="text-red-400">{"❤️".repeat(lives)}{"🖤".repeat(3 - lives)}</span>
      </div>

      <div className="text-gray-400 text-sm">Chain length: {chainLength}</div>

      {phase === "showing" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-300 text-sm animate-pulse">Watch the chain...</p>
          <div className="flex gap-2 flex-wrap justify-center">
            {chain.map((emoji, i) => (
              <div
                key={i}
                className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-all duration-300 ${
                  i === showingIndex
                    ? "bg-yellow-600/50 border-2 border-yellow-400 scale-125 shadow-lg shadow-yellow-500/30"
                    : i < showingIndex
                    ? "bg-gray-700 border-2 border-gray-500 opacity-50"
                    : "bg-gray-800 border-2 border-gray-700"
                }`}
              >
                {i <= showingIndex ? emoji : "?"}
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "input" && (
        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-gray-300 text-sm">Repeat the chain! ({playerInput.length}/{chain.length})</p>

          <div className="flex gap-2 flex-wrap justify-center min-h-[3.5rem]">
            {chain.map((_, i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 transition-all ${
                  i < playerInput.length
                    ? "bg-green-800/50 border-green-500"
                    : i === playerInput.length
                    ? "bg-gray-700 border-yellow-400 animate-pulse"
                    : "bg-gray-800 border-gray-700"
                }`}
              >
                {i < playerInput.length ? playerInput[i] : "?"}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
            {options.map((emoji, i) => (
              <button
                key={i}
                onClick={() => handleEmojiTap(emoji)}
                className="aspect-square rounded-xl text-2xl flex items-center justify-center bg-gray-800 border-2 border-gray-600 hover:border-orange-400 hover:bg-gray-700 active:scale-95 transition-all"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "feedback" && (
        <div className="flex flex-col items-center gap-3">
          <div className={`text-5xl ${feedbackType === "correct" ? "animate-bounce" : "animate-pulse"}`}>
            {feedbackType === "correct" ? "✅" : "❌"}
          </div>
          <p className={`text-lg font-bold ${feedbackType === "correct" ? "text-green-400" : "text-red-400"}`}>
            {feedbackType === "correct" ? "Perfect Chain!" : "Wrong Order!"}
          </p>
          {feedbackType === "wrong" && (
            <div className="flex gap-1">
              <span className="text-gray-400 text-sm">Correct chain:</span>
              {chain.map((e, i) => <span key={i} className="text-xl">{e}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
