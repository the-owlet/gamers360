"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function ShadowMatchPage() {
  return (
    <GameWrapper gameSlug="shadow-match" gameName="Shadow Match" gameIcon="🔮">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

// Groups of similar emojis - first is the target, rest are distractors
const EMOJI_GROUPS = [
  ["🐶","🐕","🐩","🐺"],
  ["🐱","🐈","😺","🐯"],
  ["🌸","🌺","🌹","🌷"],
  ["🍎","🍒","🍅","🫑"],
  ["⭐","🌟","✨","💫"],
  ["🔵","🫧","🔷","💎"],
  ["🟢","🍀","🥒","🥝"],
  ["🔴","🔺","❤️","♦️"],
  ["🌙","🌛","🌜","⭐"],
  ["🐻","🧸","🐼","🐨"],
  ["🏠","🏡","🏘️","🏰"],
  ["🚗","🚕","🏎️","🚙"],
  ["🎵","🎶","🎼","🎤"],
  ["🍕","🥧","🧁","🍰"],
  ["📱","💻","🖥️","📟"],
];

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "feedback" | "done">("idle");
  const [target, setTarget] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [correct, setCorrect] = useState(0);
  const correctRef = useRef(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const roundTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const maxRounds = 15;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    };
  }, []);

  const setupRound = useCallback((roundNum: number) => {
    const groupIdx = Math.floor(gameRandom() * EMOJI_GROUPS.length);
    const group = [...EMOJI_GROUPS[groupIdx]];
    const targetEmoji = group[0];

    // Shuffle the group for choices
    const shuffled = group.sort(() => gameRandom() - 0.5);
    const correctIdx = shuffled.indexOf(targetEmoji);

    setTarget(targetEmoji);
    setChoices(shuffled);
    setCorrectIndex(correctIdx);
    setRound(roundNum);
    setFeedbackType(null);
    setSelectedIdx(-1);
    setPhase("playing");
  }, []);

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
            setCorrect(0);
            correctRef.current = 0;
            setStreak(0);
            setTimeLeft(60);
            setPhase("playing");
        
            setupRound(1);
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  clearInterval(timerRef.current!);
                  if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
                  const finalScore = Math.min(95, scoreRef.current);
                  setPhase("done");
                  onGameComplete({ score: finalScore, won: correctRef.current >= 8 });
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

  function handleChoice(idx: number) {
    if (phase !== "playing") return;
    setSelectedIdx(idx);

    const isCorrect = idx === correctIndex;

    if (isCorrect) {
      const newStreak = streak + 1;
      const streakBonus = newStreak > 2 ? newStreak * 2 : 0;
      const points = 8 + streakBonus;
      const newScore = scoreRef.current + points;
      const newCorrect = correctRef.current + 1;
      scoreRef.current = newScore;
      correctRef.current = newCorrect;
      setScore(newScore);
      setCorrect(newCorrect);
      setStreak(newStreak);
      setFeedbackType("correct");
    } else {
      setStreak(0);
      setFeedbackType("wrong");
    }

    setPhase("feedback");

    if (round >= maxRounds) {
      roundTimerRef.current = setTimeout(() => {
        clearInterval(timerRef.current!);
        const finalScore = Math.min(95, scoreRef.current);
        setPhase("done");
        onGameComplete({ score: finalScore, won: correctRef.current >= 8 });
      }, 800);
    } else {
      roundTimerRef.current = setTimeout(() => {
        setupRound(round + 1);
      }, 800);
    }
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">🔮</div>
        <h2 className="text-2xl font-bold text-white">Shadow Match</h2>
        <p className="text-gray-400 text-center max-w-xs">
          Match the emoji to its shadow! Pick the correct one from 4 similar options. 60 seconds, 15 rounds!
        </p>
        <button
          onClick={begin}
          className="px-8 py-3 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transform hover:scale-105 transition-all shadow-lg"
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
        <div className="text-5xl">{correct >= 8 ? "🎉" : "😔"}</div>
        <h2 className="text-2xl font-bold text-white">
          {correct >= 8 ? "Sharp Eyes!" : "Keep Trying!"}
        </h2>
        <p className="text-gray-300">Correct: {correct}/{maxRounds}</p>
        <p className="text-yellow-400 text-xl font-bold">Score: {finalScore}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex justify-between w-full max-w-xs text-sm">
        <span className="text-gray-300">Round {round}/{maxRounds}</span>
        <span className="text-yellow-400 font-bold">Score: {score}</span>
        <span className="text-gray-300">⏱️ {timeLeft}s</span>
      </div>

      {streak > 2 && (
        <div className="text-orange-400 text-xs font-bold animate-pulse">
          🔥 {streak}x Streak!
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        <p className="text-gray-400 text-sm">Find the match for:</p>
        <div className="text-6xl p-4 bg-gray-800 rounded-2xl border-2 border-purple-500 shadow-lg shadow-purple-500/20 grayscale contrast-200 brightness-50">
          {target}
        </div>
        <p className="text-gray-500 text-xs">(shadow version)</p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {choices.map((emoji, i) => (
          <button
            key={i}
            onClick={() => handleChoice(i)}
            disabled={phase === "feedback"}
            className={`text-4xl py-5 rounded-xl border-2 transition-all transform active:scale-95 ${
              phase === "feedback" && i === correctIndex
                ? "bg-green-800/50 border-green-400 scale-105"
                : phase === "feedback" && i === selectedIdx && i !== correctIndex
                ? "bg-red-800/50 border-red-400 scale-95 opacity-70"
                : "bg-gray-800 border-gray-600 hover:border-purple-400 hover:bg-gray-700"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {feedbackType && (
        <div className={`text-sm font-bold ${feedbackType === "correct" ? "text-green-400" : "text-red-400"}`}>
          {feedbackType === "correct" ? "✓ Correct!" : "✗ Wrong!"}
        </div>
      )}
    </div>
  );
}
