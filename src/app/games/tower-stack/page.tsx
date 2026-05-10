"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function TowerStackPage() {
  return (
    <GameWrapper gameSlug="tower-stack" gameName="Tower Stack" gameIcon="🏗️">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

const COLORS = [
  "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
  "bg-purple-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500",
  "bg-teal-500", "bg-indigo-500",
];

const GAME_WIDTH = 300;
const BLOCK_HEIGHT = 28;
const MAX_BLOCKS = 10;
const SPEED_BASE = 2;

interface StackBlock {
  x: number;
  width: number;
  color: string;
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [stack, setStack] = useState<StackBlock[]>([]);
  const [currentBlock, setCurrentBlock] = useState<{ x: number; width: number; direction: number } | null>(null);
  const [score, setScore] = useState(0);
  const [blockIndex, setBlockIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [cutPiece, setCutPiece] = useState<{ x: number; width: number; side: "left" | "right" } | null>(null);

  const animRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const blockRef = useRef(currentBlock);
  const stackRef = useRef(stack);
  const blockIndexRef = useRef(0);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { blockRef.current = currentBlock; }, [currentBlock]);
  useEffect(() => { stackRef.current = stack; }, [stack]);
  useEffect(() => { blockIndexRef.current = blockIndex; }, [blockIndex]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const getSpeed = useCallback((idx: number) => SPEED_BASE + idx * 0.4, []);

  const spawnBlock = useCallback((width: number, idx: number) => {
    const dir = gameRandom() > 0.5 ? 1 : -1;
    const startX = dir === 1 ? -width : GAME_WIDTH;
    setCurrentBlock({ x: startX, width, direction: dir });

    const speed = getSpeed(idx);
    let x = startX;
    let d = dir;

    const animate = () => {
      x += d * speed;
      if (x + width > GAME_WIDTH) { x = GAME_WIDTH - width; d = -1; }
      if (x < 0) { x = 0; d = 1; }
      setCurrentBlock({ x, width, direction: d });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  }, [getSpeed]);

  function init() {
      startGame();
    }

    // Auto-start game when isPlaying becomes true (after bet selection)
    const _hasStarted = useRef(false);
    useEffect(() => {
      if (isPlaying && !_hasStarted.current) {
        _hasStarted.current = true;
        const baseWidth = GAME_WIDTH * 0.5;
            const baseBlock: StackBlock = {
              x: (GAME_WIDTH - baseWidth) / 2,
              width: baseWidth,
              color: COLORS[0],
            };
            setStack([baseBlock]);
            setScore(0);
            scoreRef.current = 0;
            setBlockIndex(1);
            blockIndexRef.current = 1;
            setFeedback(null);
            setCutPiece(null);
            setPhase("playing");
        
            spawnBlock(baseWidth, 1);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  function showFeedback(text: string) {
    setFeedback(text);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 800);
  }

  function dropBlock() {
    if (phase !== "playing" || !blockRef.current) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const cur = blockRef.current;
    const stk = stackRef.current;
    const top = stk[stk.length - 1];

    const overlapStart = Math.max(cur.x, top.x);
    const overlapEnd = Math.min(cur.x + cur.width, top.x + top.width);
    const overlapWidth = overlapEnd - overlapStart;

    if (overlapWidth <= 0) {
      // Completely missed
      showFeedback("Miss!");
      setCutPiece({ x: cur.x, width: cur.width, side: cur.x < top.x ? "left" : "right" });
      setCurrentBlock(null);
      const finalScore = Math.min(95, scoreRef.current);
      setPhase("done");
      onGameComplete({ score: finalScore, won: stk.length - 1 >= 6 });
      return;
    }

    const accuracy = overlapWidth / top.width;
    let pts: number;

    if (accuracy > 0.95) {
      // Perfect placement
      pts = 10;
      showFeedback("Perfect! +10");
      const newBlock: StackBlock = {
        x: top.x,
        width: top.width,
        color: COLORS[blockIndexRef.current % COLORS.length],
      };
      const newStack = [...stk, newBlock];
      setStack(newStack);
    } else {
      pts = Math.round(accuracy * 10);
      showFeedback(`+${pts}`);

      // Show cut piece
      if (cur.x < top.x) {
        setCutPiece({ x: cur.x, width: top.x - cur.x, side: "left" });
      } else {
        const cutStart = top.x + top.width;
        setCutPiece({ x: cutStart, width: cur.x + cur.width - cutStart, side: "right" });
      }

      const newBlock: StackBlock = {
        x: overlapStart,
        width: overlapWidth,
        color: COLORS[blockIndexRef.current % COLORS.length],
      };
      const newStack = [...stk, newBlock];
      setStack(newStack);
    }

    const newScore = scoreRef.current + pts;
    setScore(newScore);
    scoreRef.current = newScore;
    setCurrentBlock(null);

    const nextIdx = blockIndexRef.current + 1;
    setBlockIndex(nextIdx);
    blockIndexRef.current = nextIdx;

    if (nextIdx > MAX_BLOCKS) {
      const finalScore = Math.min(95, newScore);
      setPhase("done");
      onGameComplete({ score: finalScore, won: stk.length >= 6 });
      return;
    }

    // Clear cut piece after animation
    setTimeout(() => setCutPiece(null), 500);

    // Spawn next block with the overlap width
    const nextWidth = accuracy > 0.95 ? top.width : overlapWidth;
    setTimeout(() => {
      spawnBlock(nextWidth, nextIdx);
    }, 400);
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl animate-bounce">🏗️</div>
        <p className="text-gray-400 text-center max-w-xs">
          Stack blocks by tapping at the right time! Misaligned parts get cut off. Stack 10 blocks to win!
        </p>
        <button
          onClick={init}
          className="px-8 py-3 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 transition-all shadow-lg shadow-orange-500/30"
        >
          Start Stacking
        </button>
      </div>
    );
  }

  const towerHeight = stack.length * BLOCK_HEIGHT;
  const gameHeight = 340;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex justify-between w-full max-w-xs text-sm">
        <span className="text-gray-400">Block {Math.min(blockIndex, MAX_BLOCKS)}/{MAX_BLOCKS}</span>
        <span className="text-yellow-400 font-bold">Score: {score}</span>
      </div>

      {feedback && (
        <div className="text-xl font-bold text-green-400 animate-pulse">{feedback}</div>
      )}

      <div
        className="relative bg-gray-900 rounded-xl overflow-hidden border border-gray-700 cursor-pointer"
        style={{ width: GAME_WIDTH, height: gameHeight }}
        onClick={dropBlock}
      >
        {/* Stack */}
        {stack.map((block, i) => (
          <div
            key={i}
            className={`absolute ${block.color} rounded-sm border border-white/20`}
            style={{
              left: block.x,
              bottom: i * BLOCK_HEIGHT,
              width: block.width,
              height: BLOCK_HEIGHT,
            }}
          />
        ))}

        {/* Moving block */}
        {currentBlock && (
          <div
            className={`absolute ${COLORS[blockIndex % COLORS.length]} rounded-sm border-2 border-white/40 shadow-lg`}
            style={{
              left: currentBlock.x,
              bottom: stack.length * BLOCK_HEIGHT,
              width: currentBlock.width,
              height: BLOCK_HEIGHT,
            }}
          />
        )}

        {/* Cut piece falling */}
        {cutPiece && (
          <div
            className="absolute bg-gray-500 rounded-sm opacity-60 animate-ping"
            style={{
              left: cutPiece.x,
              bottom: (stack.length - 1) * BLOCK_HEIGHT,
              width: cutPiece.width,
              height: BLOCK_HEIGHT,
            }}
          />
        )}

        {/* Tap hint */}
        {phase === "playing" && currentBlock && (
          <div className="absolute inset-x-0 top-2 text-center text-gray-500 text-xs">
            Tap to drop!
          </div>
        )}
      </div>

      {phase === "done" && (
        <div className="text-center space-y-3">
          <p className="text-lg font-bold text-white">
            {stack.length - 1 >= 6 ? "Great tower!" : "Tower collapsed!"}
          </p>
          <p className="text-gray-400">{stack.length - 1} blocks stacked</p>
          <button
            onClick={init}
            className="px-6 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 transition-all"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
