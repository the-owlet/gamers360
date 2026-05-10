"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function SnapMatchPage() {
  return (
    <GameWrapper gameSlug="snap-match" gameName="Snap Match" gameIcon="⚡">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

const CARD_EMOJIS = ["🎮", "🎯", "🔥", "💎", "⭐", "🌙", "🎵", "🍀"];

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentCard, setCurrentCard] = useState("");
  const [prevCard, setPrevCard] = useState("");
  const [snaps, setSnaps] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falseSnaps, setFalseSnaps] = useState(0);
  const [feedback, setFeedback] = useState<"snap" | "miss" | "false" | null>(null);
  const [cardIdx, setCardIdx] = useState(0);
  const scoreRef = useRef(0);
  const snapsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const cardTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const deckRef = useRef<string[]>([]);
  const cardIdxRef = useRef(0);
  const prevRef = useRef("");
  const canSnapRef = useRef(false);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (cardTimerRef.current) clearInterval(cardTimerRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  function buildDeck(): string[] {
    const deck: string[] = [];
    for (let i = 0; i < 40; i++) {
      deck.push(CARD_EMOJIS[Math.floor(gameRandom() * CARD_EMOJIS.length)]);
    }
    for (let i = 0; i < 10; i++) {
      const pos = Math.floor(gameRandom() * 20) + 2;
      if (pos < deck.length) deck[pos] = deck[pos - 1];
    }
    return deck;
  }

  function begin() {
      startGame();
    }

    // Auto-start game when isPlaying becomes true (after bet selection)
    const _hasStarted = useRef(false);
    useEffect(() => {
      if (isPlaying && !_hasStarted.current) {
        _hasStarted.current = true;
        const deck = buildDeck();
            deckRef.current = deck;
            setScore(0); scoreRef.current = 0;
            setSnaps(0); snapsRef.current = 0;
            setMisses(0);
            setFalseSnaps(0);
            setTimeLeft(60);
            setCardIdx(0); cardIdxRef.current = 0;
            setCurrentCard(deck[0]);
            setPrevCard(""); prevRef.current = "";
            canSnapRef.current = false;
            setFeedback(null);
            setPhase("playing");
        
            cardTimerRef.current = setInterval(() => {
              cardIdxRef.current += 1;
              const idx = cardIdxRef.current;
              if (idx >= deckRef.current.length) {
                cardIdxRef.current = 0;
                deckRef.current = buildDeck();
              }
              const prev = deckRef.current[Math.max(0, cardIdxRef.current - 1)];
              const curr = deckRef.current[cardIdxRef.current];
              prevRef.current = prev;
              setPrevCard(prev);
              setCurrentCard(curr);
              setCardIdx(cardIdxRef.current);
              canSnapRef.current = curr === prev;
              if (curr === prev) {
                setTimeout(() => {
                  if (canSnapRef.current) {
                    setMisses(m => m + 1);
                    canSnapRef.current = false;
                  }
                }, 1100);
              }
            }, 1200);
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  cleanup();
                  setPhase("done");
                  setTimeout(() => {
                    const final = Math.min(95, Math.max(0, scoreRef.current));
                    onGameComplete({ score: final, won: snapsRef.current >= 5 });
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

  function handleSnap() {
    if (phase !== "playing" || feedback) return;
    if (canSnapRef.current) {
      canSnapRef.current = false;
      scoreRef.current += 15;
      snapsRef.current += 1;
      setScore(scoreRef.current);
      setSnaps(snapsRef.current);
      setFeedback("snap");
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - 10);
      setScore(scoreRef.current);
      setFalseSnaps(f => f + 1);
      setFeedback("false");
    }
    setTimeout(() => setFeedback(null), 400);
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">⚡</div>
        <p className="text-gray-400 mb-2">Cards dey flip one by one — SNAP when two match!</p>
        <p className="text-gray-500 text-sm mb-6">60 seconds. Quick eye, quick hand. False snaps cost you!</p>
        <button onClick={begin} className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-yellow-500/20 text-lg">
          ⚡ Start Snapping
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">Snaps: <span className="text-green-400 font-bold">{snaps}</span></div>
        <div className="text-sm text-gray-400">Time: <span className={`font-bold ${timeLeft <= 8 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span></div>
        <div className="text-sm text-gray-400">Score: <span className="text-yellow-400 font-bold">{score}</span></div>
      </div>

      {phase === "playing" && (
        <div className="text-center">
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="w-20 h-28 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-3xl opacity-50">
              {prevCard || "?"}
            </div>
            <div className="text-gray-600">→</div>
            <div className="w-24 h-32 rounded-xl bg-gray-700 border-2 border-yellow-500/30 flex items-center justify-center text-5xl shadow-lg shadow-yellow-500/10 transition-all">
              {currentCard}
            </div>
          </div>

          <button
            onClick={handleSnap}
            className={`px-12 py-5 rounded-2xl font-black text-2xl transition-all active:scale-90 ${
              feedback === "snap" ? "bg-green-500 text-white scale-110" :
              feedback === "false" ? "bg-red-500 text-white" :
              "bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:scale-105"
            }`}
          >
            {feedback === "snap" ? "MATCH! ✓" : feedback === "false" ? "NOPE! ✗" : "⚡ SNAP!"}
          </button>

          <div className="mt-4 text-gray-600 text-xs">Tap SNAP when current card matches previous!</div>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center py-8">
          <div className="text-3xl font-black text-yellow-400 mb-1">{snaps >= 5 ? "Sharp Eye!" : "Too Slow!"}</div>
          <div className="text-gray-400 text-sm">Snaps: {snaps} | False: {falseSnaps} | Score: {Math.min(95, Math.max(0, score))}</div>
        </div>
      )}
    </div>
  );
}
