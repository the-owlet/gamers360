"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function PidginPuzzlePage() {
  return (
    <GameWrapper gameSlug="pidgin-puzzle" gameName="Pidgin Puzzle" gameIcon="🗣️">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

interface Puzzle { sentence: string; options: string[]; answer: number; }

const ALL_PUZZLES: Puzzle[] = [
  { sentence: "I no ___ wetin you dey talk", options: ["sabi", "chop", "run", "sleep"], answer: 0 },
  { sentence: "Abeg make you ___ me that thing", options: ["chop", "give", "drink", "wash"], answer: 1 },
  { sentence: "The thing don ___ finish", options: ["come", "go", "spoil", "fly"], answer: 2 },
  { sentence: "Na ___ dey cause problem for here", options: ["water", "money", "wahala", "food"], answer: 2 },
  { sentence: "E don ___ o! We don reach", options: ["tey", "go", "come", "die"], answer: 0 },
  { sentence: "Make we ___ before night catch us", options: ["sleep", "comot", "chop", "dance"], answer: 1 },
  { sentence: "My guy, you too ___!", options: ["sabi", "dull", "tall", "small"], answer: 0 },
  { sentence: "The ___ too much for this area", options: ["sun", "wahala", "water", "money"], answer: 0 },
  { sentence: "I wan ___ food, hunger dey kill me", options: ["cook", "wash", "chop", "sell"], answer: 2 },
  { sentence: "No ___ me that kind thing", options: ["tell", "give", "show", "bring"], answer: 0 },
  { sentence: "Oya make we ___! Time don go", options: ["shine", "waka", "sleep", "cry"], answer: 1 },
  { sentence: "E be like say this boy don ___", options: ["craze", "sleep", "eat", "grow"], answer: 0 },
  { sentence: "I no get ___ to buy that one", options: ["hand", "kobo", "eye", "head"], answer: 1 },
  { sentence: "Na only God fit ___ us", options: ["save", "chop", "beat", "carry"], answer: 0 },
  { sentence: "Wetin ___ you come here?", options: ["carry", "bring", "make", "give"], answer: 1 },
  { sentence: "This matter no ___ me at all", options: ["sweet", "concern", "pain", "touch"], answer: 1 },
  { sentence: "If you ___ again, I go vex", options: ["try", "talk", "come", "go"], answer: 0 },
  { sentence: "Person wey no ___ go suffer", options: ["hustle", "sleep", "eat", "talk"], answer: 0 },
  { sentence: "Dem don ___ all the food finish", options: ["cook", "chop", "wash", "sell"], answer: 1 },
  { sentence: "You dey ___ yourself, nobody send you", options: ["deceive", "help", "stress", "love"], answer: 2 },
  { sentence: "Na ___ go show who be boss", options: ["time", "money", "food", "war"], answer: 0 },
  { sentence: "I ___ tire, make I rest small", options: ["don", "no", "dey", "go"], answer: 0 },
];

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [pIdx, setPIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<number | null>(null);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const totalP = 15;

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
        const shuffled = [...ALL_PUZZLES];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(gameRandom() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            setPuzzles(shuffled.slice(0, totalP));
            setScore(0); scoreRef.current = 0;
            setCorrect(0); correctRef.current = 0;
            setStreak(0); setPIdx(0);
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

  function pick(idx: number) {
    if (phase !== "playing" || feedback !== null) return;
    const p = puzzles[pIdx];
    setFeedback(idx);

    if (idx === p.answer) {
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
      if (pIdx + 1 >= totalP) {
        cleanup();
        setPhase("done");
        setTimeout(() => {
          const final = Math.min(95, scoreRef.current);
          onGameComplete({ score: final, won: correctRef.current >= 8 });
        }, 500);
      } else {
        setPIdx(pIdx + 1);
      }
    }, 700);
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🗣️</div>
        <p className="text-gray-400 mb-2">You sabi Pidgin? Complete the sentence if you bad!</p>
        <p className="text-gray-500 text-sm mb-6">15 sentences, 60 seconds. Show say you be real Naija person!</p>
        <button onClick={begin} className="bg-gradient-to-r from-green-500 to-yellow-500 text-black font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-green-500/20 text-lg">
          🗣️ Start Talking
        </button>
      </div>
    );
  }

  const p = puzzles[pIdx];

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">Q: <span className="text-green-400 font-bold">{pIdx + 1}/{totalP}</span></div>
        <div className="text-sm text-gray-400">Time: <span className={`font-bold ${timeLeft <= 8 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span></div>
        <div className="text-sm text-gray-400">Score: <span className="text-yellow-400 font-bold">{score}</span></div>
      </div>

      {streak >= 2 && <div className="text-center text-xs text-orange-400 font-bold mb-2">🔥 {streak} streak!</div>}

      {phase === "playing" && p && (
        <div>
          <div className="bg-gray-800/50 border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-white font-bold text-center text-lg">
              {p.sentence.split("___").map((part, i) => (
                <span key={i}>
                  {part}
                  {i === 0 && <span className="text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded mx-1">____</span>}
                </span>
              ))}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {p.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={feedback !== null}
                className={`py-3 px-4 rounded-xl font-bold text-center transition-all ${
                  feedback !== null && i === p.answer ? "bg-green-500 text-white" :
                  feedback === i && i !== p.answer ? "bg-red-500 text-white" :
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
          <div className="text-3xl font-black text-yellow-400 mb-1">{correct >= 8 ? "Pidgin Master!" : "You Need Practice!"}</div>
          <div className="text-gray-400 text-sm">Correct: {correct}/{totalP} | Score: {Math.min(95, score)}</div>
        </div>
      )}
    </div>
  );
}
