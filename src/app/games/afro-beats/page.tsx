"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function AfroBeatsPage() {
  return (
    <GameWrapper gameSlug="afro-beats" gameName="Afro Beats Quiz" gameIcon="🎶">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

interface Question { clue: string; options: string[]; answer: number; }

const ALL_QUESTIONS: Question[] = [
  { clue: "🌍🦁 — African Giant album, Grammy winner", options: ["Wizkid", "Davido", "Burna Boy", "Olamide"], answer: 2 },
  { clue: "⭐👦 — 'Made in Lagos' creator, Essence hitmaker", options: ["Rema", "Wizkid", "CKay", "Fireboy"], answer: 1 },
  { clue: "🅾️🅱️🅾️ — '30 Billion Gang' leader, 'Fall' singer", options: ["Burna Boy", "Davido", "Olamide", "Phyno"], answer: 1 },
  { clue: "🦇🏃 — 'Calm Down' went viral on TikTok worldwide", options: ["Asake", "Rema", "BNXN", "Joeboy"], answer: 1 },
  { clue: "🔥🎤 — 'Mr Money', 'Organise', Yoruba rap king", options: ["Olamide", "Naira Marley", "Zlatan", "CDQ"], answer: 0 },
  { clue: "🎵💃 — 'Love Nwantiti' became global No.1 hit", options: ["Joeboy", "Fireboy", "CKay", "Omah Lay"], answer: 2 },
  { clue: "🔥🎸 — 'Peru', 'Playboy', YBNL star", options: ["Asake", "Fireboy DML", "Bella Shmurda", "Zinoleesky"], answer: 1 },
  { clue: "👸🎤 — 'Essence' featured artist, 'Try Me' singer", options: ["Ayra Starr", "Tems", "Tiwa Savage", "Simi"], answer: 1 },
  { clue: "🌟⚡ — 'Rush', 'Joha', YBNL new wave king", options: ["Rema", "Asake", "Seyi Vibez", "BNXN"], answer: 1 },
  { clue: "👑🎵 — 'Somebody's Son', African Queen of pop", options: ["Yemi Alade", "Tiwa Savage", "Tems", "Simi"], answer: 1 },
  { clue: "🌙💫 — 'Bloody Samaritan', 19-year-old star", options: ["Rema", "Ayra Starr", "Tems", "Fireboy"], answer: 1 },
  { clue: "🎤🔊 — 'Soso', 'Holy Father', afro-fusion pioneer", options: ["Omah Lay", "Joeboy", "CKay", "BNXN"], answer: 0 },
  { clue: "🧊💰 — 'Don't Rush' challenge creator", options: ["Darkoo", "Ms Banks", "Young Jonn", "Rema"], answer: 2 },
  { clue: "🎵🇳🇬 — 'Nobody' featuring DJ Neptune", options: ["Joeboy", "Mr Eazi", "Laycon", "Mayorkun"], answer: 1 },
  { clue: "🏆🎤 — 'Ye', 'On the Low', Grammy-winning album", options: ["Burna Boy", "Wizkid", "Davido", "Tems"], answer: 0 },
  { clue: "🎹🎵 — 'Duduke', married to Adekunle Gold", options: ["Tiwa Savage", "Yemi Alade", "Simi", "Waje"], answer: 2 },
  { clue: "🌊🎶 — 'High', 'Something Different', AG Baby", options: ["Adekunle Gold", "Patoranking", "Tekno", "Flavour"], answer: 0 },
  { clue: "💎🎤 — 'Eleko', 'Mama', Mavin queen", options: ["Ayra Starr", "Tiwa Savage", "Teni", "Niniola"], answer: 1 },
  { clue: "🎪🎶 — 'Case', 'Billionaire', Mavin first lady", options: ["Simi", "Teni", "Di'ja", "Waje"], answer: 1 },
  { clue: "🔥🦅 — 'Am I a Yahoo Boy', controversial hitmaker", options: ["Zlatan", "Naira Marley", "Portable", "Mohbad"], answer: 1 },
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
  const totalQ = 12;

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
                    onGameComplete({ score: final, won: correctRef.current >= 6 });
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
      const bonus = streak >= 3 ? 5 : streak >= 2 ? 3 : 0;
      scoreRef.current += 10 + bonus;
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
          onGameComplete({ score: final, won: correctRef.current >= 6 });
        }, 500);
      } else {
        setQIdx(qIdx + 1);
      }
    }, 800);
  }

  if (phase === "idle") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🎶</div>
        <p className="text-gray-400 mb-2">You sabi Afrobeats? Guess the artist from the clues!</p>
        <p className="text-gray-500 text-sm mb-6">12 rounds, 60 seconds. Only real music heads go pass this!</p>
        <button onClick={begin} className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-purple-500/20 text-lg">
          🎶 Start Vibing
        </button>
      </div>
    );
  }

  const q = questions[qIdx];

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="text-sm text-gray-400">Round: <span className="text-pink-400 font-bold">{qIdx + 1}/{totalQ}</span></div>
        <div className="text-sm text-gray-400">Time: <span className={`font-bold ${timeLeft <= 8 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>{timeLeft}s</span></div>
        <div className="text-sm text-gray-400">Score: <span className="text-yellow-400 font-bold">{score}</span></div>
      </div>

      {streak >= 2 && <div className="text-center text-xs text-orange-400 font-bold mb-2">🔥 {streak} streak!</div>}

      {phase === "playing" && q && (
        <div>
          <div className="bg-gray-800/50 border border-white/10 rounded-2xl p-5 mb-4 text-center">
            <div className="text-xs text-gray-500 uppercase mb-2">Who is this artist?</div>
            <p className="text-white font-bold text-lg">{q.clue}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={feedback !== null}
                className={`py-3 px-4 rounded-xl font-bold text-center transition-all ${
                  feedback !== null && i === q.answer ? "bg-green-500 text-white" :
                  feedback === i && i !== q.answer ? "bg-red-500 text-white" :
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
          <div className="text-3xl font-black text-yellow-400 mb-1">{correct >= 6 ? "Music Head!" : "Listen More!"}</div>
          <div className="text-gray-400 text-sm">Correct: {correct}/{totalQ} | Score: {Math.min(95, score)}</div>
        </div>
      )}
    </div>
  );
}
