"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function ReactionRushPage() {
  return (
    <GameWrapper gameSlug="reaction-rush" gameName="Reaction Rush" gameIcon="🏎️">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

type LaneItem = {
  id: number;
  lane: number;
  y: number;
  type: "coin" | "gem" | "bomb";
  points: number;
};

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [playerLane, setPlayerLane] = useState(1);
  const [items, setItems] = useState<LaneItem[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [collected, setCollected] = useState(0);
  const [lastHit, setLastHit] = useState("");
  const [flash, setFlash] = useState<"green" | "red" | null>(null);
  const idRef = useRef(0);
  const frameRef = useRef<number>(undefined);
  const spawnRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const itemsRef = useRef<LaneItem[]>([]);

  const cleanup = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (phase !== "playing") return;
      if (e.key === "ArrowLeft" || e.key === "a") setPlayerLane(l => Math.max(0, l - 1));
      if (e.key === "ArrowRight" || e.key === "d") setPlayerLane(l => Math.min(2, l + 1));
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase]);

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
            livesRef.current = 3;
            setItems([]);
            itemsRef.current = [];
            setPlayerLane(1);
            setCollected(0);
            setTimeLeft(60);
            setLastHit("");
            setFlash(null);
            setPhase("playing");
            idRef.current = 0;
        
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
        
            spawnRef.current = setInterval(() => {
              const lane = Math.floor(gameRandom() * 3);
              const r = gameRandom();
              const type = r < 0.2 ? "bomb" : r < 0.4 ? "gem" : "coin";
              const item: LaneItem = {
                id: ++idRef.current,
                lane,
                y: -10,
                type,
                points: type === "coin" ? 5 : type === "gem" ? 15 : -20,
              };
              itemsRef.current = [...itemsRef.current, item];
              setItems([...itemsRef.current]);
            }, 500);
        
            let lastTime = performance.now();
            const gameLoop = (now: number) => {
              const dt = (now - lastTime) / 1000;
              lastTime = now;
        
              itemsRef.current = itemsRef.current
                .map(item => ({ ...item, y: item.y + dt * 120 }))
                .filter(item => item.y < 110);
        
              setItems([...itemsRef.current]);
              frameRef.current = requestAnimationFrame(gameLoop);
            };
            frameRef.current = requestAnimationFrame(gameLoop);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  useEffect(() => {
    if (phase !== "playing") return;

    const catchZone = 85;
    const caught: number[] = [];

    itemsRef.current.forEach(item => {
      if (item.y >= catchZone - 5 && item.y <= catchZone + 5 && item.lane === playerLane) {
        caught.push(item.id);
        if (item.type === "bomb") {
          const nl = livesRef.current - 1;
          livesRef.current = nl;
          setLives(nl);
          setLastHit("💣 -1 life!");
          setFlash("red");
          if (nl <= 0) {
            cleanup();
            setPhase("done");
            setTimeout(() => {
              const final = Math.min(90, Math.max(0, scoreRef.current));
              onGameComplete({ score: final, won: final >= 20 });
            }, 500);
          }
        } else {
          const ns = scoreRef.current + item.points;
          scoreRef.current = ns;
          setScore(ns);
          setCollected(c => c + 1);
          setLastHit(`${item.type === "gem" ? "💎" : "🪙"} +${item.points}`);
          setFlash("green");
        }
      }
    });

    if (caught.length > 0) {
      itemsRef.current = itemsRef.current.filter(i => !caught.includes(i.id));
      setItems([...itemsRef.current]);
      setTimeout(() => setFlash(null), 200);
    }
  }, [items, playerLane, phase, cleanup, onGameComplete]);

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🏎️</div>
        <p className="text-gray-400 mb-2">Dodge bombs, collect coins and gems!</p>
        <p className="text-gray-500 text-sm mb-6">60 seconds — tap lanes or use arrow keys. 3 lives.</p>
        <button
          onClick={begin}
          className="bg-gradient-to-r from-red-500 to-orange-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-red-500/20 text-lg"
        >
          🏎️ Start Rush!
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">
          Time: <span className={`font-bold ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span>
        </div>
        <div className="text-sm text-gray-400">
          Lives: <span className="text-red-400 font-bold">{"❤️".repeat(lives)}{"🖤".repeat(Math.max(0, 3 - lives))}</span>
        </div>
        <div className="text-sm text-gray-400">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
      </div>

      {lastHit && (
        <div className="text-center mb-2">
          <span className={`text-xs font-bold ${lastHit.includes("+") ? "text-green-400" : "text-red-400"}`}>{lastHit}</span>
        </div>
      )}

      <div className={`relative w-full h-72 bg-gray-800/50 rounded-2xl border overflow-hidden transition-colors ${
        flash === "green" ? "border-green-500" : flash === "red" ? "border-red-500" : "border-white/10"
      }`}>
        {[0, 1, 2].map(lane => (
          <div key={lane} className="absolute top-0 bottom-0 border-x border-white/5"
            style={{ left: `${(lane / 3) * 100}%`, width: "33.33%" }}
          />
        ))}

        {items.map(item => (
          <div
            key={item.id}
            className="absolute text-2xl transition-none"
            style={{
              left: `${(item.lane / 3) * 100 + 16.66}%`,
              top: `${item.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {item.type === "coin" ? "🪙" : item.type === "gem" ? "💎" : "💣"}
          </div>
        ))}

        <div
          className="absolute text-3xl transition-all duration-100"
          style={{
            left: `${(playerLane / 3) * 100 + 16.66}%`,
            bottom: "8%",
            transform: "translateX(-50%)",
          }}
        >
          🏎️
        </div>

        {phase === "done" && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-black text-yellow-400 mb-1">
                {lives > 0 ? "Time's Up!" : "Crashed!"}
              </div>
              <div className="text-gray-400 text-sm">
                Collected: {collected} | Score: {Math.min(90, Math.max(0, score))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {[0, 1, 2].map(lane => (
          <button
            key={lane}
            onClick={() => setPlayerLane(lane)}
            className={`py-3 rounded-xl font-bold text-sm transition ${
              playerLane === lane
                ? "bg-cyan-500 text-white"
                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
            }`}
          >
            {lane === 0 ? "← Left" : lane === 1 ? "Center" : "Right →"}
          </button>
        ))}
      </div>
    </div>
  );
}
