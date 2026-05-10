"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function ReflexTestPage() {
  return (
    <GameWrapper gameSlug="reflex-test" gameName="Reflex Test" gameIcon="🎯">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

type RoundPhase = "waiting" | "ready" | "green" | "result" | "too-early";

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [roundPhase, setRoundPhase] = useState<RoundPhase>("waiting");
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [penalties, setPenalties] = useState(0);

  const greenTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const timesRef = useRef<number[]>([]);
  const penaltiesRef = useRef(0);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
        setRound(0);
            setTimes([]);
            timesRef.current = [];
            setPenalties(0);
            penaltiesRef.current = 0;
            setCurrentTime(0);
            setPhase("playing");
            startRound(0);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  function startRound(r: number) {
    if (r >= 5) {
      finishGame();
      return;
    }
    setRound(r + 1);
    setRoundPhase("ready");

    const delay = 2000 + gameRandom() * 3000;
    timeoutRef.current = setTimeout(() => {
      greenTimeRef.current = Date.now();
      setRoundPhase("green");
    }, delay);
  }

  function handleTap() {
    if (phase !== "playing") return;

    if (roundPhase === "ready") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      penaltiesRef.current += 1;
      setPenalties(penaltiesRef.current);
      setRoundPhase("too-early");
      timeoutRef.current = setTimeout(() => {
        startRound(round);
      }, 1500);
      return;
    }

    if (roundPhase === "green") {
      const reaction = Date.now() - greenTimeRef.current;
      setCurrentTime(reaction);
      timesRef.current = [...timesRef.current, reaction];
      setTimes(timesRef.current);
      setRoundPhase("result");

      timeoutRef.current = setTimeout(() => {
        startRound(round);
      }, 1500);
    }
  }

  function finishGame() {
    cleanup();
    setPhase("done");
    const validTimes = timesRef.current;
    const avg = validTimes.length > 0
      ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length
      : 9999;

    let totalScore = 0;
    validTimes.forEach(t => {
      if (t < 200) totalScore += 19;
      else if (t < 300) totalScore += 15;
      else if (t < 400) totalScore += 12;
      else if (t < 500) totalScore += 10;
      else if (t < 600) totalScore += 7;
      else if (t < 800) totalScore += 4;
      else totalScore += 2;
    });
    totalScore = Math.max(0, totalScore - penaltiesRef.current * 5);
    const final = Math.min(95, totalScore);

    setTimeout(() => {
      onGameComplete({ score: final, won: avg < 600 });
    }, 500);
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">🎯</div>
        <p className="text-gray-400 text-center max-w-xs">
          Wait for the screen to turn green, then tap as fast as you can! 5 rounds. Don&apos;t tap too early!
        </p>
        <button
          onClick={begin}
          className="px-8 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg transition-all"
        >
          Start Game
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const avg = times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : 9999;
    const won = avg < 600;
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="text-5xl">{won ? "⚡" : "🐌"}</div>
        <p className="text-2xl font-bold text-white">{won ? "Lightning Reflexes!" : "Keep Practicing!"}</p>
        <p className="text-4xl font-bold text-green-400">{avg}ms avg</p>
        <div className="flex gap-2 flex-wrap justify-center">
          {times.map((t, i) => (
            <span key={i} className={`px-2 py-1 rounded text-sm font-mono ${t < 400 ? "bg-green-900 text-green-300" : t < 600 ? "bg-yellow-900 text-yellow-300" : "bg-red-900 text-red-300"}`}>
              {t}ms
            </span>
          ))}
        </div>
        {penalties > 0 && <p className="text-red-400 text-sm">Too early: {penalties} times</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex justify-between w-full max-w-xs text-sm">
        <span className="text-green-400 font-bold">Round {round}/5</span>
        {penalties > 0 && <span className="text-red-400">Penalties: {penalties}</span>}
      </div>

      <button
        onClick={handleTap}
        className={`w-full max-w-xs aspect-[4/3] rounded-2xl flex flex-col items-center justify-center text-2xl font-bold transition-all duration-200 ${
          roundPhase === "ready"
            ? "bg-red-600 hover:bg-red-500 text-white cursor-pointer"
            : roundPhase === "green"
            ? "bg-green-500 hover:bg-green-400 text-white cursor-pointer animate-pulse"
            : roundPhase === "too-early"
            ? "bg-yellow-600 text-white cursor-default"
            : "bg-gray-800 text-gray-300 cursor-default"
        }`}
      >
        {roundPhase === "ready" && (
          <>
            <span className="text-5xl mb-2">🔴</span>
            <span>Wait for green...</span>
          </>
        )}
        {roundPhase === "green" && (
          <>
            <span className="text-5xl mb-2">🟢</span>
            <span>TAP NOW!</span>
          </>
        )}
        {roundPhase === "too-early" && (
          <>
            <span className="text-5xl mb-2">⚠️</span>
            <span>Too early!</span>
          </>
        )}
        {roundPhase === "result" && (
          <>
            <span className="text-5xl mb-2">{currentTime < 300 ? "⚡" : currentTime < 500 ? "👍" : "🐢"}</span>
            <span className="text-3xl">{currentTime}ms</span>
          </>
        )}
        {roundPhase === "waiting" && <span>Get ready...</span>}
      </button>

      <div className="flex gap-2 mt-2">
        {times.map((t, i) => (
          <span key={i} className={`px-2 py-1 rounded text-xs font-mono ${t < 400 ? "bg-green-900/50 text-green-400" : "bg-yellow-900/50 text-yellow-400"}`}>
            {t}ms
          </span>
        ))}
      </div>
    </div>
  );
}
