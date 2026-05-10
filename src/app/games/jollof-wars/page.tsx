"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

const RECIPES = [
  {
    name: "Jollof Rice",
    ingredients: ["🍅", "🌶️", "🍚", "🧅", "🫑"],
    bonus: 5,
  },
  {
    name: "Egusi Soup",
    ingredients: ["🥬", "🫘", "🍖", "🌶️", "🧅"],
    bonus: 8,
  },
  {
    name: "Suya Platter",
    ingredients: ["🥩", "🌶️", "🧅", "🥜", "🫑"],
    bonus: 10,
  },
  {
    name: "Pepper Soup",
    ingredients: ["🐟", "🌶️", "🍅", "🧅", "🌿"],
    bonus: 12,
  },
  {
    name: "Puff Puff",
    ingredients: ["🌾", "🥚", "🧈", "🍬", "🫗"],
    bonus: 15,
  },
];

const ALL_INGREDIENTS = ["🍅", "🌶️", "🍚", "🧅", "🫑", "🥬", "🫘", "🍖", "🥩", "🥜", "🐟", "🌿", "🌾", "🥚", "🧈", "🍬", "🫗"];

export default function JollofWarsPage() {
  return (
    <GameWrapper gameSlug="jollof-wars" gameName="Jollof Wars" gameIcon="🍚">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(gameRandom() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "memorize" | "cooking" | "result" | "done">("idle");
  const [round, setRound] = useState(0);
  const [recipe, setRecipe] = useState(RECIPES[0]);
  const [options, setOptions] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(8);
  const [feedback, setFeedback] = useState("");
  const [dishesCooked, setDishesCooked] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const scoreRef = useRef(0);
  const totalRounds = 5;

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  function startRound(roundNum: number) {
    const r = RECIPES[roundNum - 1];
    setRecipe(r);
    setRound(roundNum);
    setPicked([]);
    setFeedback("");

    setPhase("memorize");
    setTimeout(() => {
      const extras = ALL_INGREDIENTS.filter(i => !r.ingredients.includes(i));
      const shuffledExtras = shuffle(extras).slice(0, 4);
      const allOptions = shuffle([...r.ingredients, ...shuffledExtras]);
      setOptions(allOptions);

      const timeForRound = Math.max(5, 10 - roundNum);
      setTimeLeft(timeForRound);
      setPhase("cooking");

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            finishRound(roundNum);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 2000 + roundNum * 300);
  }

  function finishRound(roundNum: number) {
    cleanup();
    const correct = picked.filter(p => recipe.ingredients.includes(p)).length;
    const wrong = picked.filter(p => !recipe.ingredients.includes(p)).length;
    const accuracy = Math.max(0, correct - wrong);
    const pts = accuracy * 3 + (accuracy === recipe.ingredients.length ? recipe.bonus : 0);
    const newScore = scoreRef.current + pts;
    scoreRef.current = newScore;
    setScore(newScore);

    const perfect = correct === recipe.ingredients.length && wrong === 0;
    setFeedback(perfect ? `Perfect ${recipe.name}! +${pts} pts` : `${correct}/${recipe.ingredients.length} correct. +${pts} pts`);
    if (correct >= 3) setDishesCooked(prev => prev + 1);
    setPhase("result");

    setTimeout(() => {
      if (roundNum >= totalRounds) {
        setPhase("done");
        const finalScore = Math.min(95, Math.max(0, newScore));
        setTimeout(() => onGameComplete({ score: finalScore, won: finalScore >= 20 }), 500);
      } else {
        startRound(roundNum + 1);
      }
    }, 1500);
  }

  function pickIngredient(ing: string) {
    if (phase !== "cooking") return;
    if (picked.includes(ing)) {
      setPicked(prev => prev.filter(p => p !== ing));
    } else if (picked.length < recipe.ingredients.length) {
      const newPicked = [...picked, ing];
      setPicked(newPicked);
      if (newPicked.length === recipe.ingredients.length) {
        cleanup();
        finishRound(round);
      }
    }
  }

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
            setDishesCooked(0);
            startRound(1);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🍚</div>
        <p className="text-gray-400 mb-2">Cook 5 Nigerian dishes from memory!</p>
        <p className="text-gray-500 text-sm mb-6">Memorize ingredients, then pick them fast. Perfect dishes earn bonus!</p>
        <button
          onClick={begin}
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-orange-500/20 text-lg"
        >
          🍚 Start Cooking!
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">
          Dish: <span className="text-orange-400 font-bold">{round}/{totalRounds}</span>
        </div>
        <div className="text-sm text-gray-400">
          Cooked: <span className="text-green-400 font-bold">{dishesCooked}</span>
        </div>
        <div className="text-sm text-gray-400">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="text-2xl font-black text-white mb-1">{recipe.name}</div>

        {phase === "memorize" && (
          <>
            <div className="text-sm text-yellow-400 animate-pulse font-bold mb-3">Memorize the ingredients!</div>
            <div className="flex justify-center gap-3 mb-2">
              {recipe.ingredients.map((ing, i) => (
                <div key={i} className="w-14 h-14 bg-orange-500/20 border border-orange-500/40 rounded-xl flex items-center justify-center text-2xl animate-bounce"
                  style={{ animationDelay: `${i * 100}ms` }}>
                  {ing}
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500">{recipe.ingredients.length} ingredients to remember</div>
          </>
        )}

        {phase === "cooking" && (
          <>
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-sm text-cyan-400 font-bold">Pick the right ingredients!</span>
              <span className={`text-sm font-bold ${timeLeft <= 3 ? "text-red-400 animate-pulse" : "text-gray-400"}`}>
                {timeLeft}s
              </span>
            </div>

            <div className="flex justify-center gap-2 mb-4">
              {Array.from({ length: recipe.ingredients.length }).map((_, i) => (
                <div key={i} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl ${
                  picked[i] ? "bg-green-500/20 border-green-500/50" : "bg-gray-800 border-gray-600 border-dashed"
                }`}>
                  {picked[i] || "?"}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {options.map((ing, i) => {
                const isPicked = picked.includes(ing);
                return (
                  <button key={i} onClick={() => pickIngredient(ing)}
                    className={`py-3 rounded-xl text-xl transition-all hover:scale-105 active:scale-95 ${
                      isPicked ? "bg-green-500/30 border-2 border-green-500 scale-95" : "bg-gray-700 hover:bg-gray-600 border-2 border-gray-600"
                    }`}>
                    {ing}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {phase === "result" && feedback && (
          <div className={`text-lg font-bold mt-4 ${feedback.includes("Perfect") ? "text-green-400 animate-bounce" : "text-yellow-400"}`}>
            {feedback}
          </div>
        )}

        {phase === "done" && (
          <div className="mt-4">
            <div className="text-3xl font-black text-yellow-400 mb-1">Kitchen Closed!</div>
            <div className="text-gray-400 text-sm">
              Dishes cooked: {dishesCooked}/{totalRounds} | Score: {Math.min(95, Math.max(0, score))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
