"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

const COLORS = [
  { name: "Red", bg: "bg-red-500", glow: "shadow-red-500/50", active: "bg-red-400" },
  { name: "Blue", bg: "bg-blue-500", glow: "shadow-blue-500/50", active: "bg-blue-400" },
  { name: "Green", bg: "bg-green-500", glow: "shadow-green-500/50", active: "bg-green-400" },
  { name: "Yellow", bg: "bg-yellow-500", glow: "shadow-yellow-500/50", active: "bg-yellow-400" },
];

export default function PatternRecallPage() {
  return (
    <GameWrapper gameSlug="pattern-recall" gameName="Pattern Recall" gameIcon="🔮">
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
  const [phase, setPhase] = useState<"idle" | "showing" | "input" | "result">("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState<string>("");
  const [flashPad, setFlashPad] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const showSequence = useCallback((seq: number[]) => {
    setPhase("showing");
    let i = 0;
    const show = () => {
      if (i < seq.length) {
        setActiveIndex(seq[i]);
        timerRef.current = setTimeout(() => {
          setActiveIndex(-1);
          i++;
          timerRef.current = setTimeout(show, 200);
        }, 500);
      } else {
        setActiveIndex(-1);
        setPlayerInput([]);
        setPhase("input");
      }
    };
    timerRef.current = setTimeout(show, 500);
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
            setLives(3);
            setRound(1);
            setFeedback("");
            const first = [Math.floor(gameRandom() * 4), Math.floor(gameRandom() * 4)];
            setSequence(first);
            showSequence(first);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  function tapPad(colorIdx: number) {
    if (phase !== "input") return;

    setFlashPad(colorIdx);
    setTimeout(() => setFlashPad(-1), 150);

    const newInput = [...playerInput, colorIdx];
    setPlayerInput(newInput);
    const pos = newInput.length - 1;

    if (sequence[pos] !== colorIdx) {
      const newLives = lives - 1;
      setLives(newLives);
      setFeedback("Wrong!");

      if (newLives <= 0) {
        setPhase("result");
        const finalScore = Math.min(90, score);
        setTimeout(() => onGameComplete({ score: finalScore, won: finalScore >= 20 }), 800);
        return;
      }

      timerRef.current = setTimeout(() => {
        setFeedback("");
        showSequence(sequence);
      }, 800);
      return;
    }

    if (newInput.length === sequence.length) {
      const pts = 5 + round * 3;
      const newScore = score + pts;
      setScore(newScore);
      setFeedback(`+${pts} pts!`);
      const nextRound = round + 1;
      setRound(nextRound);

      if (nextRound > 10) {
        setPhase("result");
        const bonus = lives === 3 ? 15 : lives === 2 ? 8 : 0;
        const finalScore = Math.min(90, newScore + bonus);
        setTimeout(() => onGameComplete({ score: finalScore, won: true }), 800);
        return;
      }

      const next = Math.floor(gameRandom() * 4);
      const newSeq = [...sequence, next];
      setSequence(newSeq);

      timerRef.current = setTimeout(() => {
        setFeedback("");
        showSequence(newSeq);
      }, 1000);
    }
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🔮</div>
        <p className="text-gray-400 mb-2">Watch the sequence, then repeat it!</p>
        <p className="text-gray-500 text-sm mb-6">Each round adds one more to the pattern. 3 lives.</p>
        <button
          onClick={begin}
          className="bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-purple-500/20 text-lg"
        >
          🔮 Start Game
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">
          Round: <span className="text-purple-400 font-bold">{round}/10</span>
        </div>
        <div className="text-sm text-gray-400">
          Lives: <span className="text-red-400 font-bold">{"❤️".repeat(lives)}{"🖤".repeat(3 - lives)}</span>
        </div>
        <div className="text-sm text-gray-400">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
      </div>

      {phase === "showing" && (
        <div className="text-center mb-4">
          <span className="text-sm text-yellow-400 animate-pulse font-bold">Watch the sequence...</span>
        </div>
      )}
      {phase === "input" && (
        <div className="text-center mb-4">
          <span className="text-sm text-cyan-400 font-bold">Your turn! ({playerInput.length}/{sequence.length})</span>
        </div>
      )}
      {feedback && (
        <div className="text-center mb-2">
          <span className={`text-sm font-bold ${feedback.includes("+") ? "text-green-400" : "text-red-400"}`}>
            {feedback}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
        {COLORS.map((color, i) => {
          const isActive = activeIndex === i || flashPad === i;
          return (
            <button
              key={i}
              onClick={() => tapPad(i)}
              disabled={phase !== "input"}
              className={`aspect-square rounded-2xl transition-all duration-200 ${
                isActive
                  ? `${color.active} scale-105 shadow-xl ${color.glow}`
                  : `${color.bg} opacity-60 hover:opacity-80`
              } ${phase === "input" ? "cursor-pointer hover:scale-105 active:scale-95" : ""}`}
            />
          );
        })}
      </div>

      {phase === "result" && (
        <div className="text-center mt-6">
          <div className="text-2xl font-black text-yellow-400 mb-1">
            {lives > 0 ? "Perfect Recall!" : "Game Over!"}
          </div>
          <div className="text-gray-400 text-sm">
            Reached round {round} | Score: {Math.min(90, score + (lives === 3 ? 15 : lives === 2 ? 8 : 0))}
          </div>
        </div>
      )}
    </div>
  );
}
