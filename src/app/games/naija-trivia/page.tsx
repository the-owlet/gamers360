"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function NaijaTriviaPage() {
  return (
    <GameWrapper gameSlug="naija-trivia" gameName="Naija Trivia" gameIcon="🇳🇬">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

interface Question { q: string; options: string[]; answer: number; }

const ALL_QUESTIONS: Question[] = [
  { q: "What is the capital of Nigeria?", options: ["Lagos", "Abuja", "Kano", "Port Harcourt"], answer: 1 },
  { q: "Which Nigerian city is known as 'Centre of Excellence'?", options: ["Abuja", "Calabar", "Lagos", "Ibadan"], answer: 2 },
  { q: "Jollof rice originated from which region?", options: ["East Africa", "West Africa", "South Africa", "North Africa"], answer: 1 },
  { q: "What currency does Nigeria use?", options: ["Cedi", "Naira", "Rand", "Shilling"], answer: 1 },
  { q: "Which Nigerian won the Nobel Prize in Literature?", options: ["Chinua Achebe", "Wole Soyinka", "Chimamanda Adichie", "Ben Okri"], answer: 1 },
  { q: "How many states does Nigeria have?", options: ["30", "36", "24", "48"], answer: 1 },
  { q: "What does 'Oga' mean in Nigerian slang?", options: ["Friend", "Boss", "Money", "Food"], answer: 1 },
  { q: "Which river is the longest in Nigeria?", options: ["Benue", "Ogun", "Niger", "Cross"], answer: 2 },
  { q: "Nollywood is based primarily in which city?", options: ["Abuja", "Kano", "Lagos", "Enugu"], answer: 2 },
  { q: "What sport is Nigeria most famous for internationally?", options: ["Basketball", "Football", "Athletics", "Cricket"], answer: 1 },
  { q: "Which Nigerian artist sang 'Ye'?", options: ["Wizkid", "Davido", "Burna Boy", "Olamide"], answer: 2 },
  { q: "What is 'Suya'?", options: ["A drink", "Spiced grilled meat", "A dessert", "A soup"], answer: 1 },
  { q: "Which state is known as 'The Food Basket of the Nation'?", options: ["Lagos", "Benue", "Kano", "Oyo"], answer: 1 },
  { q: "Pidgin English 'Wahala' means?", options: ["Happiness", "Money", "Trouble", "Food"], answer: 2 },
  { q: "What year did Nigeria gain independence?", options: ["1963", "1957", "1960", "1970"], answer: 2 },
  { q: "Which Nigerian footballer is known as 'Jay-Jay'?", options: ["Kanu Nwankwo", "Austin Okocha", "Mikel Obi", "Rashidi Yekini"], answer: 1 },
  { q: "What color is NOT on the Nigerian flag?", options: ["Green", "White", "Red", "Both colors are on it"], answer: 2 },
  { q: "Which tribe is the largest in Nigeria?", options: ["Igbo", "Yoruba", "Hausa", "Ijaw"], answer: 2 },
  { q: "What is 'Garri' made from?", options: ["Rice", "Yam", "Cassava", "Corn"], answer: 2 },
  { q: "Which Nigerian city hosted the 2003 All Africa Games?", options: ["Lagos", "Abuja", "Ibadan", "Benin"], answer: 1 },
  { q: "'Sapa' in Nigerian slang means?", options: ["Rich", "Broke/Poverty", "Happy", "Angry"], answer: 1 },
  { q: "What is Amala typically served with?", options: ["Jollof rice", "Ewedu & Gbegiri", "Bread", "Indomie"], answer: 1 },
  { q: "Which state is the largest by area?", options: ["Lagos", "Kano", "Niger", "Borno"], answer: 2 },
  { q: "What does 'NEPA' stand for?", options: ["National Electric Power Authority", "Nigerian Energy Program Agency", "New Electricity Plan Act", "None of the above"], answer: 0 },
  { q: "Who was Nigeria's first president?", options: ["Obafemi Awolowo", "Nnamdi Azikiwe", "Tafawa Balewa", "Yakubu Gowon"], answer: 1 },
  { q: "Which Nigerian city is called 'The Garden City'?", options: ["Calabar", "Jos", "Port Harcourt", "Benin"], answer: 2 },
  { q: "Egusi soup is made primarily from?", options: ["Palm leaves", "Melon seeds", "Groundnut", "Beans"], answer: 1 },
  { q: "Which artist is known as 'Wizzy'?", options: ["Davido", "Burna Boy", "Wizkid", "Rema"], answer: 2 },
  { q: "What is the meaning of 'Abi'?", options: ["No", "Yes", "Right?/Isn't it?", "Maybe"], answer: 2 },
  { q: "Which state is Yankari Game Reserve in?", options: ["Plateau", "Bauchi", "Taraba", "Adamawa"], answer: 1 },
];

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
  const [feedback, setFeedback] = useState<number | null>(null);
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
        const shuffled = [...ALL_QUESTIONS];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(gameRandom() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            setQuestions(shuffled.slice(0, totalQ));
            setScore(0); scoreRef.current = 0;
            setCorrect(0); correctRef.current = 0;
            setStreak(0);
            setQIdx(0);
            setTimeLeft(60);
            setFeedback(null);
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
    const q = questions[qIdx];
    setFeedback(idx);

    if (idx === q.answer) {
      const streakBonus = streak >= 3 ? 4 : streak >= 2 ? 2 : 0;
      scoreRef.current += 8 + streakBonus;
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
    }, 800);
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🇳🇬</div>
        <p className="text-gray-400 mb-2">How well you know Naija? Test your knowledge fam!</p>
        <p className="text-gray-500 text-sm mb-6">15 questions, 60 seconds. Streaks = bonus points!</p>
        <button onClick={begin} className="bg-gradient-to-r from-green-600 to-green-800 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-green-500/20 text-lg">
          🇳🇬 Test Your Knowledge
        </button>
      </div>
    );
  }

  const q = questions[qIdx];

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">Q: <span className="text-purple-400 font-bold">{qIdx + 1}/{totalQ}</span></div>
        <div className="text-sm text-gray-400">Time: <span className={`font-bold ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span></div>
        <div className="text-sm text-gray-400">Score: <span className="text-yellow-400 font-bold">{score}</span></div>
      </div>

      {streak >= 2 && <div className="text-center text-xs text-orange-400 font-bold mb-2">🔥 {streak} streak!</div>}

      {phase === "playing" && q && (
        <div>
          <div className="bg-gray-800/50 border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-white font-bold text-center">{q.q}</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={feedback !== null}
                className={`py-3 px-4 rounded-xl font-bold text-left transition-all ${
                  feedback !== null && i === q.answer ? "bg-green-500 text-white" :
                  feedback === i && i !== q.answer ? "bg-red-500 text-white" :
                  feedback !== null ? "bg-gray-800 text-gray-600" :
                  "bg-gray-700 hover:bg-gray-600 text-white active:scale-[0.98]"
                }`}
              >
                <span className="text-gray-500 mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center py-8">
          <div className="text-3xl font-black text-yellow-400 mb-1">{correct >= 8 ? "Naija Expert!" : "Study More!"}</div>
          <div className="text-gray-400 text-sm">Correct: {correct}/{totalQ} | Score: {Math.min(95, score)}</div>
        </div>
      )}
    </div>
  );
}
