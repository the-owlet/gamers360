"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function FlagQuizPage() {
  return (
    <GameWrapper gameSlug="flag-quiz" gameName="Flag Quiz" gameIcon="🏁">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

const FLAGS = [
  { flag: "🇳🇬", name: "Nigeria" }, { flag: "🇬🇭", name: "Ghana" }, { flag: "🇰🇪", name: "Kenya" },
  { flag: "🇿🇦", name: "South Africa" }, { flag: "🇪🇬", name: "Egypt" }, { flag: "🇪🇹", name: "Ethiopia" },
  { flag: "🇹🇿", name: "Tanzania" }, { flag: "🇨🇲", name: "Cameroon" }, { flag: "🇸🇳", name: "Senegal" },
  { flag: "🇨🇮", name: "Ivory Coast" }, { flag: "🇲🇦", name: "Morocco" }, { flag: "🇩🇿", name: "Algeria" },
  { flag: "🇺🇸", name: "United States" }, { flag: "🇬🇧", name: "United Kingdom" }, { flag: "🇫🇷", name: "France" },
  { flag: "🇩🇪", name: "Germany" }, { flag: "🇮🇹", name: "Italy" }, { flag: "🇪🇸", name: "Spain" },
  { flag: "🇧🇷", name: "Brazil" }, { flag: "🇦🇷", name: "Argentina" }, { flag: "🇲🇽", name: "Mexico" },
  { flag: "🇯🇵", name: "Japan" }, { flag: "🇨🇳", name: "China" }, { flag: "🇮🇳", name: "India" },
  { flag: "🇰🇷", name: "South Korea" }, { flag: "🇦🇺", name: "Australia" }, { flag: "🇨🇦", name: "Canada" },
  { flag: "🇷🇺", name: "Russia" }, { flag: "🇹🇷", name: "Turkey" }, { flag: "🇸🇦", name: "Saudi Arabia" },
  { flag: "🇦🇪", name: "UAE" }, { flag: "🇵🇹", name: "Portugal" }, { flag: "🇳🇱", name: "Netherlands" },
  { flag: "🇧🇪", name: "Belgium" }, { flag: "🇸🇪", name: "Sweden" },
];

interface Question { flag: string; correct: string; options: string[]; }

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const totalQ = 15;

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
        const shuffled = [...FLAGS];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(gameRandom() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
        
            const qs: Question[] = shuffled.slice(0, totalQ).map(item => {
              const wrongs: string[] = [];
              while (wrongs.length < 3) {
                const r = FLAGS[Math.floor(gameRandom() * FLAGS.length)];
                if (r.name !== item.name && !wrongs.includes(r.name)) wrongs.push(r.name);
              }
              const options = [item.name, ...wrongs];
              for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(gameRandom() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
              }
              return { flag: item.flag, correct: item.name, options };
            });
        
            setQuestions(qs);
            setScore(0); scoreRef.current = 0;
            setCorrect(0); correctRef.current = 0;
            setStreak(0); setQIdx(0);
            setTimeLeft(60); setFeedback(null);
            setPhase("playing");
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  cleanup();
                  setPhase("done");
                  setTimeout(() => {
                    const final = Math.min(95, scoreRef.current);
                    onGameComplete({ score: final, won: correctRef.current >= 8 });
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

  function pick(name: string) {
    if (phase !== "playing" || feedback !== null) return;
    const q = questions[qIdx];
    setFeedback(name);

    if (name === q.correct) {
      const bonus = streak >= 3 ? 4 : streak >= 2 ? 2 : 0;
      scoreRef.current += 8 + bonus;
      correctRef.current += 1;
      setScore(scoreRef.current);
      setCorrect(correctRef.current);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      setFeedback(null);
      if (qIdx + 1 >= totalQ) {
        cleanup();
        setPhase("done");
        setTimeout(() => {
          const final = Math.min(95, scoreRef.current);
          onGameComplete({ score: final, won: correctRef.current >= 8 });
        }, 500);
      } else {
        setQIdx(qIdx + 1);
      }
    }, 700);
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🏁</div>
        <p className="text-gray-400 mb-2">See the flag, name the country — how well you know the world?</p>
        <p className="text-gray-500 text-sm mb-6">15 flags, 60 seconds. Streaks = bonus points!</p>
        <button onClick={begin} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-blue-500/20 text-lg">
          🏁 Start Quiz
        </button>
      </div>
    );
  }

  const q = questions[qIdx];

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">Flag: <span className="text-blue-400 font-bold">{qIdx + 1}/{totalQ}</span></div>
        <div className="text-sm text-gray-400">Time: <span className={`font-bold ${timeLeft <= 8 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span></div>
        <div className="text-sm text-gray-400">Score: <span className="text-yellow-400 font-bold">{score}</span></div>
      </div>

      {streak >= 2 && <div className="text-center text-xs text-orange-400 font-bold mb-2">🔥 {streak} streak!</div>}

      {phase === "playing" && q && (
        <div className="text-center">
          <div className="text-8xl mb-6">{q.flag}</div>
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => pick(opt)}
                disabled={feedback !== null}
                className={`py-3 px-4 rounded-xl font-bold transition-all ${
                  feedback !== null && opt === q.correct ? "bg-green-500 text-white" :
                  feedback === opt && opt !== q.correct ? "bg-red-500 text-white" :
                  feedback !== null ? "bg-gray-800 text-gray-600" :
                  "bg-gray-700 hover:bg-gray-600 text-white active:scale-95"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center py-8">
          <div className="text-3xl font-black text-yellow-400 mb-1">{correct >= 8 ? "Globe Trotter!" : "Study More Maps!"}</div>
          <div className="text-gray-400 text-sm">Correct: {correct}/{totalQ} | Score: {Math.min(95, score)}</div>
        </div>
      )}
    </div>
  );
}
