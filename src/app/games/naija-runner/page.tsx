"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

const OBSTACLES = [
  { emoji: "🚌", name: "Danfo", damage: 1 },
  { emoji: "🏍️", name: "Okada", damage: 1 },
  { emoji: "🕳️", name: "Pothole", damage: 1 },
  { emoji: "🐐", name: "Goat", damage: 1 },
];

const COLLECTIBLES = [
  { emoji: "💵", name: "Naira", points: 5 },
  { emoji: "🍗", name: "Suya", points: 8 },
  { emoji: "💎", name: "Diamond", points: 15 },
  { emoji: "👑", name: "Crown", points: 25 },
];

type Lane = 0 | 1 | 2;
type ItemType = "obstacle" | "collectible";

interface RunnerItem {
  id: number;
  lane: Lane;
  y: number;
  type: ItemType;
  subIdx: number;
}

export default function NaijaRunnerPage() {
  return (
    <GameWrapper gameSlug="naija-runner" gameName="Naija Runner" gameIcon="🏃">
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
  const [lane, setLane] = useState<Lane>(1);
  const [items, setItems] = useState<RunnerItem[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(100);
  const [lastHit, setLastHit] = useState("");
  const [flash, setFlash] = useState<"green" | "red" | null>(null);

  const idRef = useRef(0);
  const frameRef = useRef<number>(undefined);
  const spawnRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const itemsRef = useRef<RunnerItem[]>([]);
  const speedRef = useRef(100);
  const distRef = useRef(0);
  const laneRef = useRef<Lane>(1);

  const cleanup = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  useEffect(() => { laneRef.current = lane; }, [lane]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (phase !== "playing") return;
      if (e.key === "ArrowLeft" || e.key === "a") setLane(l => Math.max(0, l - 1) as Lane);
      if (e.key === "ArrowRight" || e.key === "d") setLane(l => Math.min(2, l + 1) as Lane);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase]);

  function endGame() {
    cleanup();
    setPhase("done");
    setTimeout(() => {
      const final = Math.min(95, Math.max(0, scoreRef.current));
      onGameComplete({ score: final, won: final >= 20 });
    }, 500);
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
            setLives(3); livesRef.current = 3;
            setDistance(0); distRef.current = 0;
            setSpeed(100); speedRef.current = 100;
            setItems([]); itemsRef.current = [];
            setLane(1); laneRef.current = 1;
            setLastHit(""); setFlash(null);
            setPhase("playing");
            idRef.current = 0;
        
            spawnRef.current = setInterval(() => {
              const r = gameRandom();
              const laneChoice = Math.floor(gameRandom() * 3) as Lane;
              let item: RunnerItem;
        
              if (r < 0.45) {
                item = { id: ++idRef.current, lane: laneChoice, y: -10, type: "obstacle", subIdx: Math.floor(gameRandom() * OBSTACLES.length) };
              } else {
                item = { id: ++idRef.current, lane: laneChoice, y: -10, type: "collectible", subIdx: Math.floor(gameRandom() * COLLECTIBLES.length) };
              }
              itemsRef.current = [...itemsRef.current, item];
              setItems([...itemsRef.current]);
            }, 450);
        
            let lastTime = performance.now();
            const loop = (now: number) => {
              const dt = (now - lastTime) / 1000;
              lastTime = now;
        
              distRef.current += dt * speedRef.current;
              setDistance(Math.floor(distRef.current));
        
              if (distRef.current > 500) speedRef.current = 180;
              else if (distRef.current > 300) speedRef.current = 150;
              else if (distRef.current > 150) speedRef.current = 120;
              setSpeed(speedRef.current);
        
              const caught: number[] = [];
              itemsRef.current = itemsRef.current
                .map(item => ({ ...item, y: item.y + dt * speedRef.current * 0.8 }))
                .filter(item => {
                  if (item.y >= 80 && item.y <= 92 && item.lane === laneRef.current) {
                    caught.push(item.id);
                    if (item.type === "obstacle") {
                      livesRef.current -= 1;
                      setLives(livesRef.current);
                      setLastHit(`${OBSTACLES[item.subIdx].emoji} Hit ${OBSTACLES[item.subIdx].name}!`);
                      setFlash("red");
                      setTimeout(() => setFlash(null), 200);
                      if (livesRef.current <= 0) endGame();
                    } else {
                      const pts = COLLECTIBLES[item.subIdx].points;
                      scoreRef.current += pts;
                      setScore(scoreRef.current);
                      setLastHit(`${COLLECTIBLES[item.subIdx].emoji} +${pts}`);
                      setFlash("green");
                      setTimeout(() => setFlash(null), 200);
                    }
                    return false;
                  }
                  return item.y < 110;
                });
        
              setItems([...itemsRef.current]);
        
              if (distRef.current >= 800) {
                const bonus = livesRef.current * 5;
                scoreRef.current += bonus;
                setScore(scoreRef.current);
                endGame();
                return;
              }
        
              frameRef.current = requestAnimationFrame(loop);
            };
            frameRef.current = requestAnimationFrame(loop);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🏃</div>
        <p className="text-gray-400 mb-2">Run through Lagos traffic! Dodge danfo, okada & potholes!</p>
        <p className="text-gray-500 text-sm mb-6">Collect naira, suya & gems. 3 lives. Speed increases!</p>
        <button
          onClick={begin}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-green-500/20 text-lg"
        >
          🏃 Start Running!
        </button>
      </div>
    );
  }

  const progressPct = Math.min(100, (distance / 800) * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="text-sm text-gray-400">
          Lives: <span className="text-red-400 font-bold">{"❤️".repeat(lives)}{"🖤".repeat(Math.max(0, 3 - lives))}</span>
        </div>
        <div className="text-sm text-gray-400">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
        <div className="bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-600 mb-2 px-1">
        <span>Lagos</span>
        <span>{Math.floor(distance)}m</span>
        <span>Finish 800m</span>
      </div>

      {lastHit && (
        <div className="text-center mb-2">
          <span className={`text-xs font-bold ${lastHit.includes("+") ? "text-green-400" : "text-red-400"}`}>{lastHit}</span>
        </div>
      )}

      <div className={`relative w-full h-64 bg-gray-800/50 rounded-2xl border overflow-hidden transition-colors ${
        flash === "green" ? "border-green-500" : flash === "red" ? "border-red-500" : "border-white/10"
      }`}>
        <div className="absolute inset-0 opacity-10">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="absolute w-full border-t border-dashed border-white/20"
              style={{ top: `${((i * 50 + (distance * 2) % 50) / 300) * 100}%` }} />
          ))}
        </div>

        {[0, 1, 2].map(l => (
          <div key={l} className="absolute top-0 bottom-0 border-x border-white/5"
            style={{ left: `${(l / 3) * 100}%`, width: "33.33%" }} />
        ))}

        {items.map(item => (
          <div key={item.id} className="absolute text-2xl"
            style={{ left: `${(item.lane / 3) * 100 + 16.66}%`, top: `${item.y}%`, transform: "translate(-50%, -50%)" }}>
            {item.type === "obstacle" ? OBSTACLES[item.subIdx].emoji : COLLECTIBLES[item.subIdx].emoji}
          </div>
        ))}

        <div className="absolute text-3xl transition-all duration-100"
          style={{ left: `${(lane / 3) * 100 + 16.66}%`, bottom: "6%", transform: "translateX(-50%)" }}>
          🏃
        </div>

        {phase === "done" && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-black text-yellow-400 mb-1">
                {lives > 0 ? "You Made It!" : "Wasted!"}
              </div>
              <div className="text-gray-400 text-sm">
                Distance: {Math.floor(distance)}m | Score: {Math.min(95, Math.max(0, score))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {[0, 1, 2].map(l => (
          <button key={l} onClick={() => setLane(l as Lane)}
            className={`py-3 rounded-xl font-bold text-sm transition ${
              lane === l ? "bg-green-500 text-white" : "bg-gray-700 text-gray-400 hover:bg-gray-600"
            }`}>
            {l === 0 ? "← Left" : l === 1 ? "Center" : "Right →"}
          </button>
        ))}
      </div>
    </div>
  );
}
