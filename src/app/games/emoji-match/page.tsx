"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function EmojiMatchPage() {
  return (
    <GameWrapper gameSlug="emoji-match" gameName="Emoji Match" gameIcon="🃏">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

const EMOJIS = ["😀","😎","🥳","😍","🤩","😇","🤗","😺","🐶","🐱","🦊","🐸","🐵","🐷","🐻","🦁"];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [streak, setStreak] = useState(0);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const lockRef = useRef(false);
  const matchesRef = useRef(0);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const generateCards = useCallback(() => {
    const shuffled = [...EMOJIS].sort(() => gameRandom() - 0.5).slice(0, 8);
    const pairs = [...shuffled, ...shuffled];
    const deck = pairs.sort(() => gameRandom() - 0.5).map((emoji, i) => ({
      id: i,
      emoji,
      flipped: false,
      matched: false,
    }));
    return deck;
  }, []);

  function begin() {
      startGame();
    }

    // Auto-start game when isPlaying becomes true (after bet selection)
    const _hasStarted = useRef(false);
    useEffect(() => {
      if (isPlaying && !_hasStarted.current) {
        _hasStarted.current = true;
        const deck = generateCards();
            setCards(deck);
            setFlippedIds([]);
            setMatches(0);
            matchesRef.current = 0;
            setScore(0);
            scoreRef.current = 0;
            setTimeLeft(60);
            setStreak(0);
            setLastResult(null);
            lockRef.current = false;
            setPhase("playing");
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  clearInterval(timerRef.current!);
                  const finalScore = Math.min(95, scoreRef.current);
                  setPhase("done");
                  onGameComplete({ score: finalScore, won: matchesRef.current >= 4 });
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

  function handleCardClick(id: number) {
    if (phase !== "playing" || lockRef.current) return;
    const card = cards[id];
    if (card.flipped || card.matched) return;
    if (flippedIds.includes(id)) return;

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));

    if (newFlipped.length === 2) {
      lockRef.current = true;
      const [first, second] = newFlipped;
      const c1 = cards[first];
      const c2 = cards[id];

      if (c1.emoji === c2.emoji) {
        const newStreak = streak + 1;
        const streakBonus = newStreak > 1 ? newStreak * 2 : 0;
        const points = 10 + streakBonus;
        const newScore = scoreRef.current + points;
        const newMatches = matchesRef.current + 1;

        scoreRef.current = newScore;
        matchesRef.current = newMatches;
        setScore(newScore);
        setMatches(newMatches);
        setStreak(newStreak);
        setLastResult("correct");

        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === first || c.id === second ? { ...c, matched: true, flipped: true } : c
          ));
          setFlippedIds([]);
          lockRef.current = false;
          setLastResult(null);

          if (newMatches === 8) {
            clearInterval(timerRef.current!);
            const timeBonus = Math.floor(timeLeft * 0.5);
            const finalScore = Math.min(95, newScore + timeBonus);
            scoreRef.current = finalScore;
            setScore(finalScore);
            setPhase("done");
            onGameComplete({ score: finalScore, won: true });
          }
        }, 500);
      } else {
        setStreak(0);
        setLastResult("wrong");
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === first || c.id === second ? { ...c, flipped: false } : c
          ));
          setFlippedIds([]);
          lockRef.current = false;
          setLastResult(null);
        }, 800);
      }
    }
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">🃏</div>
        <h2 className="text-2xl font-bold text-white">Emoji Match</h2>
        <p className="text-gray-400 text-center max-w-xs">
          Flip cards to find matching emoji pairs! Match as many as you can in 60 seconds.
        </p>
        <button
          onClick={begin}
          className="px-8 py-3 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transform hover:scale-105 transition-all shadow-lg"
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
        <div className="text-5xl">{matches >= 4 ? "🎉" : "😔"}</div>
        <h2 className="text-2xl font-bold text-white">
          {matches >= 4 ? "Great Job!" : "Try Again!"}
        </h2>
        <p className="text-gray-300 text-lg">Matches: {matches}/8</p>
        <p className="text-yellow-400 text-xl font-bold">Score: {finalScore}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex justify-between w-full max-w-xs text-sm">
        <span className="text-gray-300">⏱️ {timeLeft}s</span>
        <span className="text-yellow-400 font-bold">Score: {score}</span>
        <span className="text-gray-300">🃏 {matches}/8</span>
      </div>

      {lastResult && (
        <div className={`text-sm font-bold ${lastResult === "correct" ? "text-green-400" : "text-red-400"}`}>
          {lastResult === "correct" ? "✓ Match!" : "✗ Try again!"}
        </div>
      )}

      {streak > 1 && (
        <div className="text-orange-400 text-xs font-bold animate-pulse">
          🔥 {streak}x Streak!
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`aspect-square rounded-xl text-3xl flex items-center justify-center transition-all duration-300 transform ${
              card.matched
                ? "bg-green-800/50 border-2 border-green-500 scale-95"
                : card.flipped
                ? "bg-gray-700 border-2 border-purple-400 scale-105"
                : "bg-gray-800 border-2 border-gray-600 hover:border-purple-400 hover:scale-105"
            }`}
          >
            {card.flipped || card.matched ? card.emoji : "❓"}
          </button>
        ))}
      </div>
    </div>
  );
}
