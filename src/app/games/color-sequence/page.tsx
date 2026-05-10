"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

const TILES = [
  { color: "bg-red-500", active: "bg-red-300", glow: "shadow-red-500/60", label: "Red" },
  { color: "bg-blue-500", active: "bg-blue-300", glow: "shadow-blue-500/60", label: "Blue" },
  { color: "bg-green-500", active: "bg-green-300", glow: "shadow-green-500/60", label: "Green" },
  { color: "bg-yellow-500", active: "bg-yellow-300", glow: "shadow-yellow-500/60", label: "Yellow" },
  { color: "bg-purple-500", active: "bg-purple-300", glow: "shadow-purple-500/60", label: "Purple" },
  { color: "bg-orange-500", active: "bg-orange-300", glow: "shadow-orange-500/60", label: "Orange" },
];

export default function ColorSequencePage() {
  return (
    <GameWrapper gameSlug="color-sequence" gameName="Color Sequence" gameIcon="🌈">
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
  const [phase, setPhase] = useState<"idle" | "countdown" | "showing" | "input" | "result">("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [tileCount, setTileCount] = useState(4);
  const [showSpeed, setShowSpeed] = useState(500);
  const [feedback, setFeedback] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const totalRounds = 8;

  const playSequence = useCallback((seq: number[], speed: number) => {
    setPhase("showing");
    let i = 0;
    const play = () => {
      if (i < seq.length) {
        setActiveIdx(seq[i]);
        timerRef.current = setTimeout(() => {
          setActiveIdx(-1);
          i++;
          timerRef.current = setTimeout(play, 150);
        }, speed);
      } else {
        setActiveIdx(-1);
        setPlayerInput([]);
        setPhase("input");
      }
    };
    timerRef.current = setTimeout(play, 400);
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
            setStreak(0);
            setRound(1);
            setTileCount(4);
            setShowSpeed(500);
            setFeedback("");
        
            const seqLen = 3;
            const seq: number[] = [];
            for (let i = 0; i < seqLen; i++) {
              seq.push(Math.floor(gameRandom() * 4));
            }
            setSequence(seq);
            playSequence(seq, 500);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  function tapTile(idx: number) {
    if (phase !== "input") return;
    setActiveIdx(idx);
    setTimeout(() => setActiveIdx(-1), 120);

    const newInput = [...playerInput, idx];
    setPlayerInput(newInput);
    const pos = newInput.length - 1;

    if (sequence[pos] !== idx) {
      setStreak(0);
      setFeedback("Wrong sequence!");

      if (round >= totalRounds) {
        setPhase("result");
        const finalScore = Math.min(90, score);
        setTimeout(() => onGameComplete({ score: finalScore, won: finalScore >= 20 }), 800);
        return;
      }

      const nextRound = round + 1;
      setRound(nextRound);
      const numTiles = Math.min(6, 4 + Math.floor(nextRound / 3));
      setTileCount(numTiles);
      const seqLen = 3 + Math.floor(nextRound / 2);
      const seq: number[] = [];
      for (let i = 0; i < seqLen; i++) {
        seq.push(Math.floor(gameRandom() * numTiles));
      }
      setSequence(seq);

      timerRef.current = setTimeout(() => {
        setFeedback("");
        playSequence(seq, showSpeed);
      }, 1000);
      return;
    }

    if (newInput.length === sequence.length) {
      const newStreak = streak + 1;
      const streakMult = Math.min(2.5, 1 + (newStreak - 1) * 0.25);
      const basePts = 5 + sequence.length * 2;
      const pts = Math.round(basePts * streakMult);
      const newScore = score + pts;
      setScore(newScore);
      setStreak(newStreak);
      setFeedback(`+${pts} pts${newStreak > 1 ? ` (${newStreak}x streak!)` : ""}`);

      if (round >= totalRounds) {
        setPhase("result");
        const finalScore = Math.min(90, newScore);
        setTimeout(() => onGameComplete({ score: finalScore, won: true }), 800);
        return;
      }

      const nextRound = round + 1;
      setRound(nextRound);
      const numTiles = Math.min(6, 4 + Math.floor(nextRound / 3));
      setTileCount(numTiles);
      const speed = Math.max(250, 500 - nextRound * 25);
      setShowSpeed(speed);
      const seqLen = 3 + Math.floor(nextRound / 2);
      const seq: number[] = [];
      for (let i = 0; i < seqLen; i++) {
        seq.push(Math.floor(gameRandom() * numTiles));
      }
      setSequence(seq);

      timerRef.current = setTimeout(() => {
        setFeedback("");
        playSequence(seq, speed);
      }, 1000);
    }
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🌈</div>
        <p className="text-gray-400 mb-2">Watch the color sequence and repeat it!</p>
        <p className="text-gray-500 text-sm mb-6">8 rounds — sequences get longer and faster</p>
        <button
          onClick={begin}
          className="bg-gradient-to-r from-pink-500 to-violet-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-pink-500/20 text-lg"
        >
          🌈 Start Game
        </button>
      </div>
    );
  }

  const tiles = TILES.slice(0, tileCount);

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">
          Round: <span className="text-pink-400 font-bold">{round}/{totalRounds}</span>
        </div>
        {streak > 1 && (
          <div className="text-xs text-orange-400 font-bold animate-pulse">{streak}x streak!</div>
        )}
        <div className="text-sm text-gray-400">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
      </div>

      {phase === "showing" && (
        <div className="text-center mb-4">
          <span className="text-sm text-yellow-400 animate-pulse font-bold">Watch carefully...</span>
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

      <div className={`grid gap-3 max-w-sm mx-auto ${tileCount <= 4 ? "grid-cols-2" : "grid-cols-3"}`}>
        {tiles.map((tile, i) => {
          const isActive = activeIdx === i;
          return (
            <button
              key={i}
              onClick={() => tapTile(i)}
              disabled={phase !== "input"}
              className={`aspect-square rounded-2xl transition-all duration-150 ${
                isActive
                  ? `${tile.active} scale-110 shadow-xl ${tile.glow}`
                  : `${tile.color} opacity-50 hover:opacity-75`
              } ${phase === "input" ? "cursor-pointer hover:scale-105 active:scale-95" : ""}`}
            >
              <span className="text-white/80 text-xs font-bold">{tile.label}</span>
            </button>
          );
        })}
      </div>

      {phase === "result" && (
        <div className="text-center mt-6">
          <div className="text-2xl font-black text-yellow-400 mb-1">
            {streak > 0 ? "Great Memory!" : "Game Over!"}
          </div>
          <div className="text-gray-400 text-sm">
            Score: {Math.min(90, score)}
          </div>
        </div>
      )}
    </div>
  );
}
