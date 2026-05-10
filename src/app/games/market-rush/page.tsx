"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function MarketRushPage() {
  return (
    <GameWrapper gameSlug="market-rush" gameName="Market Rush" gameIcon="🛒">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

const ALL_ITEMS = [
  { name: "Tomato", emoji: "🍅", price: 200 },
  { name: "Onion", emoji: "🧅", price: 150 },
  { name: "Pepper", emoji: "🌶️", price: 100 },
  { name: "Rice", emoji: "🍚", price: 500 },
  { name: "Beans", emoji: "🫘", price: 300 },
  { name: "Yam", emoji: "🍠", price: 400 },
  { name: "Plantain", emoji: "🍌", price: 250 },
  { name: "Fish", emoji: "🐟", price: 600 },
  { name: "Chicken", emoji: "🍗", price: 800 },
  { name: "Egg", emoji: "🥚", price: 100 },
  { name: "Bread", emoji: "🍞", price: 350 },
  { name: "Oil", emoji: "🫗", price: 450 },
  { name: "Garri", emoji: "🥣", price: 200 },
  { name: "Milk", emoji: "🥛", price: 300 },
  { name: "Sugar", emoji: "🧂", price: 150 },
  { name: "Banana", emoji: "🍌", price: 100 },
];

interface RoundData {
  shoppingList: { name: string; emoji: string; price: number }[];
  market: { name: string; emoji: string; price: number }[];
  budget: number;
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(65);
  const [round, setRound] = useState(1);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [roundsWon, setRoundsWon] = useState(0);
  const scoreRef = useRef(0);
  const roundsWonRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const totalRounds = 7;

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  function generateRound(): RoundData {
    const shuffled = [...ALL_ITEMS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(gameRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const listSize = 3;
    const shoppingList = shuffled.slice(0, listSize);
    const distractors = shuffled.slice(listSize, listSize + 5);
    const market = [...shoppingList, ...distractors];
    for (let i = market.length - 1; i > 0; i--) {
      const j = Math.floor(gameRandom() * (i + 1));
      [market[i], market[j]] = [market[j], market[i]];
    }
    const budget = shoppingList.reduce((s, item) => s + item.price, 0) + 200;
    return { shoppingList, market, budget };
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
            setRoundsWon(0); roundsWonRef.current = 0;
            setTimeLeft(65); setRound(1);
            setSelected([]); setFeedback(null);
            setRoundData(generateRound());
            setPhase("playing");
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  cleanup();
                  setPhase("done");
                  setTimeout(() => {
                    const final = Math.min(95, scoreRef.current);
                    onGameComplete({ score: final, won: roundsWonRef.current >= 4 });
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

  function toggleItem(idx: number) {
    if (phase !== "playing" || !roundData || feedback) return;
    setSelected(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  }

  function submitRound() {
    if (!roundData || feedback) return;
    const selectedItems = selected.map(i => roundData.market[i]);
    const listNames = roundData.shoppingList.map(i => i.name);
    const totalCost = selectedItems.reduce((s, item) => s + item.price, 0);
    const allCorrect = selectedItems.length === roundData.shoppingList.length &&
      selectedItems.every(item => listNames.includes(item.name)) &&
      totalCost <= roundData.budget;

    if (allCorrect) {
      scoreRef.current += 12;
      roundsWonRef.current += 1;
      setScore(scoreRef.current);
      setRoundsWon(roundsWonRef.current);
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }

    setTimeout(() => {
      setFeedback(null);
      setSelected([]);
      if (round >= totalRounds) {
        cleanup();
        setPhase("done");
        setTimeout(() => {
          const final = Math.min(95, scoreRef.current);
          onGameComplete({ score: final, won: roundsWonRef.current >= 4 });
        }, 500);
      } else {
        setRound(r => r + 1);
        setRoundData(generateRound());
      }
    }, 800);
  }

  const spent = roundData ? selected.reduce((s, i) => s + roundData.market[i].price, 0) : 0;

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🛒</div>
        <p className="text-gray-400 mb-2">Mama send you market — buy the right items before time finish!</p>
        <p className="text-gray-500 text-sm mb-6">7 rounds, 65 seconds. Pick correct items, stay under budget!</p>
        <button onClick={begin} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-green-500/20 text-lg">
          🛒 Enter Market
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">Round: <span className="text-green-400 font-bold">{round}/{totalRounds}</span></div>
        <div className="text-sm text-gray-400">Time: <span className={`font-bold ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span></div>
        <div className="text-sm text-gray-400">Score: <span className="text-yellow-400 font-bold">{score}</span></div>
      </div>

      {phase === "playing" && roundData && (
        <div>
          <div className="bg-gray-800/50 border border-white/10 rounded-xl p-3 mb-3">
            <div className="text-xs text-gray-500 mb-1">📝 Shopping List:</div>
            <div className="flex flex-wrap gap-2">
              {roundData.shoppingList.map((item, i) => (
                <span key={i} className="bg-yellow-400/10 text-yellow-400 px-2 py-1 rounded-lg text-xs font-bold">
                  {item.emoji} {item.name} ₦{item.price}
                </span>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-gray-500">Budget: <span className="text-green-400 font-bold">₦{roundData.budget}</span></span>
              <span className={`font-bold ${spent > roundData.budget ? "text-red-400" : "text-gray-400"}`}>Spent: ₦{spent}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            {roundData.market.map((item, i) => (
              <button
                key={i}
                onClick={() => toggleItem(i)}
                className={`p-2 rounded-xl text-center transition-all active:scale-95 ${
                  selected.includes(i)
                    ? "bg-green-500/20 border-2 border-green-500 text-white"
                    : "bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <div className="text-xl">{item.emoji}</div>
                <div className="text-[10px] font-bold">{item.name}</div>
                <div className="text-[9px] text-gray-500">₦{item.price}</div>
              </button>
            ))}
          </div>

          <button
            onClick={submitRound}
            disabled={selected.length === 0}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white disabled:opacity-30 hover:opacity-90 transition"
          >
            ✓ Done Shopping
          </button>

          {feedback === "correct" && <div className="mt-3 text-center text-green-400 font-bold text-sm animate-bounce">Correct items!</div>}
          {feedback === "wrong" && <div className="mt-3 text-center text-red-400 font-bold text-sm">Wrong items or over budget!</div>}
        </div>
      )}

      {phase === "done" && (
        <div className="text-center py-8">
          <div className="text-3xl font-black text-yellow-400 mb-1">{roundsWon >= 4 ? "Market Queen!" : "Mama Go Vex!"}</div>
          <div className="text-gray-400 text-sm">Rounds won: {roundsWon}/{totalRounds} | Score: {Math.min(95, score)}</div>
        </div>
      )}
    </div>
  );
}
