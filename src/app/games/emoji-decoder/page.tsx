"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

interface EmojiQuestion {
  emojis: string;
  answer: string;
  options: string[];
}

const EMOJI_PUZZLES: { emojis: string; answer: string; decoys: string[] }[] = [
  { emojis: "🏠❤️🏠", answer: "Home Sweet Home", decoys: ["House Party", "Love Nest", "Double House"] },
  { emojis: "🌧️🐱🐕", answer: "Raining Cats and Dogs", decoys: ["Pet Storm", "Animal Weather", "Wet Pets"] },
  { emojis: "⏰💣", answer: "Time Bomb", decoys: ["Clock Explosion", "Alarm Blast", "Late Boom"] },
  { emojis: "🔥🚒", answer: "Fire Truck", decoys: ["Hot Ride", "Burning Engine", "Red Alert"] },
  { emojis: "🌙💡", answer: "Moonlight", decoys: ["Night Lamp", "Dark Glow", "Star Shine"] },
  { emojis: "👁️🍬", answer: "Eye Candy", decoys: ["Sweet Look", "Sugar Vision", "Candy Eyes"] },
  { emojis: "🐝🧵", answer: "Beeline", decoys: ["Bee Thread", "Honey Stitch", "Bug Sew"] },
  { emojis: "🧊🏔️", answer: "Iceberg", decoys: ["Cold Mountain", "Frozen Peak", "Snow Hill"] },
  { emojis: "🌻🛏️", answer: "Sunflower Bed", decoys: ["Garden Sleep", "Flower Rest", "Plant Nap"] },
  { emojis: "🎭😢😂", answer: "Drama Queen", decoys: ["Sad Happy", "Mood Swing", "Theater Cry"] },
  { emojis: "🦋✨", answer: "Butterfly Effect", decoys: ["Sparkle Wing", "Magic Moth", "Fairy Dust"] },
  { emojis: "🧠💪", answer: "Brain Power", decoys: ["Mind Muscle", "Think Strong", "Smart Flex"] },
  { emojis: "🌊🏄", answer: "Surf Wave", decoys: ["Beach Ride", "Ocean Board", "Water Slide"] },
  { emojis: "💎👐", answer: "Diamond Hands", decoys: ["Gem Grip", "Crystal Palm", "Jewel Touch"] },
  { emojis: "🐍🪜", answer: "Snakes and Ladders", decoys: ["Reptile Climb", "Hiss Steps", "Slither Up"] },
  { emojis: "🎯🎪", answer: "Bullseye", decoys: ["Target Circus", "Aim Show", "Hit Ring"] },
  { emojis: "☁️9️⃣", answer: "Cloud Nine", decoys: ["Sky Number", "Heaven Count", "Air Digit"] },
  { emojis: "🐔🥚", answer: "Chicken or Egg", decoys: ["Bird Baby", "Hen Breakfast", "Poultry Puzzle"] },
  { emojis: "🌈🦄", answer: "Unicorn Rainbow", decoys: ["Magic Color", "Fantasy Arc", "Horse Prism"] },
  { emojis: "🔑🎹", answer: "Keyboard", decoys: ["Key Piano", "Lock Music", "Open Song"] },
  { emojis: "🏃💨", answer: "Running Late", decoys: ["Fast Wind", "Speed Dash", "Quick Breeze"] },
  { emojis: "👻👻", answer: "Double Trouble", decoys: ["Ghost Pair", "Scary Two", "Spooky Duo"] },
  { emojis: "🍕⏰", answer: "Pizza Time", decoys: ["Food Clock", "Lunch Hour", "Snack Break"] },
  { emojis: "🦁👑", answer: "Lion King", decoys: ["Beast Crown", "Cat Royal", "Pride Leader"] },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(gameRandom() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestions(): EmojiQuestion[] {
  const shuffled = shuffleArray(EMOJI_PUZZLES).slice(0, 12);
  return shuffled.map(p => {
    const options = shuffleArray([p.answer, ...p.decoys]);
    return { emojis: p.emojis, answer: p.answer, options };
  });
}

export default function EmojiDecoderPage() {
  return (
    <GameWrapper gameSlug="emoji-decoder" gameName="Emoji Decoder" gameIcon="🔮">
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
  const [questions, setQuestions] = useState<EmojiQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const scoreRef = useRef<number>(0);
  const [correct, setCorrect] = useState(0);
  const correctRef = useRef<number>(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
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
        const qs = generateQuestions();
            setQuestions(qs);
            setCurrentQ(0);
            setScore(0);
            scoreRef.current = 0;
            setCorrect(0);
            correctRef.current = 0;
            setStreak(0);
            setBestStreak(0);
            setTimeLeft(60);
            setSelected(null);
            setShowResult(false);
            setPhase("playing");
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  clearInterval(timerRef.current!);
                  const finalScore = Math.min(95, scoreRef.current);
                  const won = correctRef.current >= 6;
                  setPhase("done");
                  onGameComplete({ score: finalScore, won });
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

  function handleAnswer(option: string) {
    if (showResult || !questions[currentQ]) return;

    setSelected(option);
    setShowResult(true);

    const isCorrect = option === questions[currentQ].answer;

    if (isCorrect) {
      const streakBonus = streak >= 2 ? 3 : 0;
      const earned = 7 + streakBonus;
      const newScore = Math.min(95, score + earned);
      const newCorrect = correct + 1;
      const newStreak = streak + 1;

      setScore(newScore);
      scoreRef.current = newScore;
      setCorrect(newCorrect);
      correctRef.current = newCorrect;
      setStreak(newStreak);
      setBestStreak(prev => Math.max(prev, newStreak));
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (currentQ + 1 >= questions.length) {
        clearInterval(timerRef.current!);
        const finalScore = Math.min(95, scoreRef.current);
        const won = correctRef.current >= 6;
        setPhase("done");
        onGameComplete({ score: finalScore, won });
      } else {
        setCurrentQ(prev => prev + 1);
        setSelected(null);
        setShowResult(false);
      }
    }, 1200);
  }

  const q = questions[currentQ];

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      {phase === "idle" && (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-2">🔮</div>
          <h2 className="text-2xl font-bold text-white">Emoji Decoder</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Decode the emoji sequences! Pick the phrase each emoji combo represents.
            <br />12 questions, 60 seconds. Get 6+ right to win!
          </p>
          <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-300">
            <p>Example: <span className="text-2xl">🏠❤️🏠</span> = <span className="text-yellow-400">Home Sweet Home</span></p>
          </div>
          <button
            onClick={begin}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-lg"
          >
            Start Decoding! 🔮
          </button>
        </div>
      )}

      {phase === "playing" && q && (
        <div className="w-full space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="bg-gray-700 px-3 py-2 rounded-lg">
              <span className="text-gray-400 text-xs">Q</span>
              <p className="text-white font-bold">{currentQ + 1}/12</p>
            </div>
            <div className="bg-gray-700 px-3 py-2 rounded-lg">
              {streak >= 2 && (
                <span className="text-orange-400 text-xs font-bold">🔥 x{streak}</span>
              )}
              <p className="text-green-400 font-bold">{correct} correct</p>
            </div>
            <div className={`px-3 py-2 rounded-lg ${timeLeft <= 10 ? "bg-red-900 animate-pulse" : "bg-gray-700"}`}>
              <span className="text-gray-400 text-xs">TIME</span>
              <p className={`font-bold ${timeLeft <= 10 ? "text-red-400" : "text-white"}`}>{timeLeft}s</p>
            </div>
            <div className="bg-gray-700 px-3 py-2 rounded-lg">
              <span className="text-gray-400 text-xs">SCORE</span>
              <p className="text-yellow-400 font-bold">{score}</p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${
                i < currentQ ? "bg-green-500" : i === currentQ ? "bg-yellow-400 scale-125" : "bg-gray-600"
              }`} />
            ))}
          </div>

          {/* Emoji display */}
          <div className="bg-gray-800 rounded-2xl p-6 text-center">
            <p className="text-gray-400 text-sm mb-2">What does this mean?</p>
            <div className="text-5xl tracking-wider py-4 animate-pulse">
              {q.emojis}
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2">
            {q.options.map((option, i) => {
              let btnClass = "bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500";

              if (showResult) {
                if (option === q.answer) {
                  btnClass = "bg-green-800 border-green-500 text-green-200";
                } else if (option === selected && option !== q.answer) {
                  btnClass = "bg-red-800 border-red-500 text-red-200";
                } else {
                  btnClass = "bg-gray-800 border-gray-700 text-gray-500";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(option)}
                  disabled={showResult}
                  className={`w-full py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all duration-200 ${btnClass} ${
                    !showResult ? "active:scale-95" : ""
                  }`}
                >
                  {option}
                  {showResult && option === q.answer && " ✅"}
                  {showResult && option === selected && option !== q.answer && " ❌"}
                </button>
              );
            })}
          </div>

          {/* Streak display */}
          {streak >= 2 && !showResult && (
            <div className="text-center">
              <span className="bg-orange-900/50 text-orange-300 px-3 py-1 rounded-full text-sm">
                🔥 Streak Bonus Active! +3 extra per correct answer
              </span>
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="text-center space-y-4">
          <div className="text-6xl">{correct >= 6 ? "🏆" : "🔮"}</div>
          <h2 className="text-2xl font-bold text-white">
            {correct >= 6 ? "Emoji Master! You sabi decode well!" : "Not bad! You go get am next time!"}
          </h2>
          <div className="bg-gray-700 rounded-xl p-4 space-y-2">
            <p className="text-gray-300">Correct: <span className="text-green-400 font-bold">{correct}/12</span></p>
            <p className="text-gray-300">Best Streak: <span className="text-orange-400 font-bold">{bestStreak} 🔥</span></p>
            <p className="text-gray-300">Final Score: <span className="text-yellow-400 font-bold">{Math.min(95, score)}</span></p>
          </div>
          <button
            onClick={begin}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
          >
            Try Again 🔄
          </button>
        </div>
      )}
    </div>
  );
}
