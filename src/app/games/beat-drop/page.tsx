"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

const LANES = [
  { color: "bg-red-500", active: "bg-red-300", glow: "shadow-red-500/50", key: "D" },
  { color: "bg-blue-500", active: "bg-blue-300", glow: "shadow-blue-500/50", key: "F" },
  { color: "bg-green-500", active: "bg-green-300", glow: "shadow-green-500/50", key: "J" },
  { color: "bg-yellow-500", active: "bg-yellow-300", glow: "shadow-yellow-500/50", key: "K" },
];

interface Beat {
  id: number;
  lane: number;
  y: number;
  hit: boolean;
}

export default function BeatDropPage() {
  return (
    <GameWrapper gameSlug="beat-drop" gameName="Beat Drop" gameIcon="🎵">
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
  const [beats, setBeats] = useState<Beat[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [flashLane, setFlashLane] = useState(-1);
  const [lastHit, setLastHit] = useState("");
  const [rating, setRating] = useState("");

  const idRef = useRef(0);
  const frameRef = useRef<number>(undefined);
  const spawnRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const beatsRef = useRef<Beat[]>([]);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);

  const cleanup = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const hitBeat = useCallback((laneIdx: number) => {
    if (phase !== "playing") return;
    setFlashLane(laneIdx);
    setTimeout(() => setFlashLane(-1), 100);

    const hitZoneMin = 78;
    const hitZoneMax = 95;
    const target = beatsRef.current.find(b => b.lane === laneIdx && !b.hit && b.y >= hitZoneMin && b.y <= hitZoneMax);

    if (target) {
      target.hit = true;
      beatsRef.current = beatsRef.current.filter(b => b.id !== target.id);
      hitsRef.current++;
      setHits(hitsRef.current);

      comboRef.current++;
      setCombo(comboRef.current);
      if (comboRef.current > maxComboRef.current) {
        maxComboRef.current = comboRef.current;
        setMaxCombo(maxComboRef.current);
      }

      const dist = Math.abs(target.y - 88);
      let hitRating: string;
      let pts: number;
      if (dist < 3) { hitRating = "PERFECT!"; pts = 8; }
      else if (dist < 6) { hitRating = "Great!"; pts = 5; }
      else { hitRating = "Good"; pts = 3; }

      const comboMult = Math.min(3, 1 + (comboRef.current - 1) * 0.2);
      pts = Math.round(pts * comboMult);
      scoreRef.current += pts;
      setScore(scoreRef.current);
      setRating(hitRating);
      setLastHit(`+${pts}${comboRef.current > 2 ? ` (${comboRef.current}x)` : ""}`);
    } else {
      comboRef.current = 0;
      setCombo(0);
      missesRef.current++;
      setMisses(missesRef.current);
      setRating("Miss!");
      setLastHit("");
    }
  }, [phase]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const key = e.key.toUpperCase();
      const idx = LANES.findIndex(l => l.key === key);
      if (idx >= 0) hitBeat(idx);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [hitBeat]);

  function begin() {
      startGame();
    }

    // Auto-start game when isPlaying becomes true (after bet selection)
    const _hasStarted = useRef(false);
    useEffect(() => {
      if (isPlaying && !_hasStarted.current) {
        _hasStarted.current = true;
        setScore(0); scoreRef.current = 0;
            setCombo(0); comboRef.current = 0;
            setMaxCombo(0); maxComboRef.current = 0;
            setHits(0); hitsRef.current = 0;
            setMisses(0); missesRef.current = 0;
            setBeats([]); beatsRef.current = [];
            setTimeLeft(60);
            setLastHit(""); setRating(""); setFlashLane(-1);
            setPhase("playing");
            idRef.current = 0;
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  cleanup();
                  setPhase("done");
                  setTimeout(() => {
                    const final = Math.min(95, Math.max(0, scoreRef.current));
                    onGameComplete({ score: final, won: final >= 20 });
                  }, 500);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
        
            spawnRef.current = setInterval(() => {
              const lane = Math.floor(gameRandom() * 4);
              const beat: Beat = { id: ++idRef.current, lane, y: -5, hit: false };
              beatsRef.current = [...beatsRef.current, beat];
            }, 400);
        
            let lastTime = performance.now();
            const loop = (now: number) => {
              const dt = (now - lastTime) / 1000;
              lastTime = now;
        
              beatsRef.current = beatsRef.current
                .map(b => ({ ...b, y: b.y + dt * 80 }))
                .filter(b => {
                  if (b.y > 100 && !b.hit) {
                    comboRef.current = 0;
                    setCombo(0);
                    missesRef.current++;
                    setMisses(missesRef.current);
                    return false;
                  }
                  return b.y < 100;
                });
        
              setBeats([...beatsRef.current]);
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
        <div className="text-6xl mb-4">🎵</div>
        <p className="text-gray-400 mb-2">Hit the beats as they reach the line!</p>
        <p className="text-gray-500 text-sm mb-6">60 seconds — tap lanes or use D/F/J/K keys. Build combos!</p>
        <button
          onClick={begin}
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-pink-500/20 text-lg"
        >
          🎵 Drop the Beat!
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="text-sm text-gray-400">
          Time: <span className={`font-bold ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span>
        </div>
        <div className="text-sm">
          {rating && (
            <span className={`font-bold ${
              rating === "PERFECT!" ? "text-yellow-400" :
              rating === "Great!" ? "text-green-400" :
              rating === "Good" ? "text-blue-400" : "text-red-400"
            }`}>{rating}</span>
          )}
        </div>
        <div className="text-sm text-gray-400">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
      </div>

      {combo > 2 && (
        <div className="text-center mb-1">
          <span className="text-xs text-orange-400 font-bold animate-pulse">{combo}x Combo! {lastHit}</span>
        </div>
      )}

      <div className="relative w-full h-64 bg-gray-900/80 rounded-2xl border border-white/10 overflow-hidden">
        {LANES.map((_, i) => (
          <div key={i} className="absolute top-0 bottom-0 border-x border-white/5"
            style={{ left: `${(i / 4) * 100}%`, width: "25%" }} />
        ))}

        <div className="absolute w-full border-t-2 border-white/30" style={{ bottom: "12%" }}>
          <div className="absolute -top-1 left-0 right-0 h-2 bg-white/5" />
        </div>

        {beats.map(beat => (
          <div key={beat.id}
            className={`absolute w-[22%] h-5 rounded-full ${LANES[beat.lane].color} opacity-90 shadow-lg`}
            style={{ left: `${(beat.lane / 4) * 100 + 1.5}%`, top: `${beat.y}%` }} />
        ))}

        {phase === "done" && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-black text-yellow-400 mb-1">Track Complete!</div>
              <div className="text-gray-400 text-sm">
                {hitsRef.current} hits | Max combo: {maxComboRef.current}x | Score: {Math.min(95, Math.max(0, score))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3">
        {LANES.map((l, i) => (
          <button key={i} onClick={() => hitBeat(i)}
            className={`py-4 rounded-xl font-bold text-sm transition-all active:scale-90 ${
              flashLane === i
                ? `${l.active} shadow-xl ${l.glow} scale-105`
                : `${l.color} opacity-60 hover:opacity-80`
            }`}>
            {l.key}
          </button>
        ))}
      </div>
    </div>
  );
}
