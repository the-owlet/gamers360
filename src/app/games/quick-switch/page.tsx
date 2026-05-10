"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

export default function QuickSwitchPage() {
  return (
    <GameWrapper gameSlug="quick-switch" gameName="Quick Switch" gameIcon="🔄">
      {({ onGameComplete, isPlaying, startGame }) => (
        <Game onGameComplete={onGameComplete} isPlaying={isPlaying} startGame={startGame} />
      )}
    </GameWrapper>
  );
}

const GAME_TIME = 60;

const COLOR_WORDS = [
  { word: "RED", colors: ["#ef4444", "#3b82f6", "#22c55e", "#eab308"] },
  { word: "BLUE", colors: ["#3b82f6", "#ef4444", "#22c55e", "#a855f7"] },
  { word: "GREEN", colors: ["#22c55e", "#ef4444", "#3b82f6", "#eab308"] },
  { word: "YELLOW", colors: ["#eab308", "#ef4444", "#3b82f6", "#22c55e"] },
  { word: "PURPLE", colors: ["#a855f7", "#ef4444", "#22c55e", "#3b82f6"] },
];

const COLOR_NAMES: Record<string, string> = {
  "#ef4444": "Red",
  "#3b82f6": "Blue",
  "#22c55e": "Green",
  "#eab308": "Yellow",
  "#a855f7": "Purple",
};

const INK_OPTIONS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7"];

type TaskType = "COLOR" | "NUMBER";

interface Task {
  type: TaskType;
  // COLOR task
  word?: string;
  inkColor?: string;
  options?: string[];
  correctAnswer?: string;
  // NUMBER task
  number?: number;
  isEven?: boolean;
}

function Game({ onGameComplete, isPlaying, startGame }: {
  onGameComplete: (r: { score: number; won: boolean }) => void;
  isPlaying: boolean;
  startGame: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [task, setTask] = useState<Task | null>(null);
  const [taskType, setTaskType] = useState<TaskType>("COLOR");
  const [questionsInMode, setQuestionsInMode] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; correct: boolean } | null>(null);
  const [switchAlert, setSwitchAlert] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const answeredRef = useRef(0);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const switchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { streakRef.current = streak; }, [streak]);
  useEffect(() => { answeredRef.current = answered; }, [answered]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      if (switchTimer.current) clearTimeout(switchTimer.current);
    };
  }, []);

  const generateColorTask = useCallback((): Task => {
    const entry = COLOR_WORDS[Math.floor(gameRandom() * COLOR_WORDS.length)];
    // Pick an ink color different from the word
    const otherColors = INK_OPTIONS.filter((c) => COLOR_NAMES[c]?.toUpperCase() !== entry.word);
    const ink = otherColors[Math.floor(gameRandom() * otherColors.length)];

    // Generate 4 options including the correct one (ink color)
    const opts = new Set<string>([ink]);
    while (opts.size < 4) {
      opts.add(INK_OPTIONS[Math.floor(gameRandom() * INK_OPTIONS.length)]);
    }
    const optArr = Array.from(opts).sort(() => gameRandom() - 0.5);

    return {
      type: "COLOR",
      word: entry.word,
      inkColor: ink,
      options: optArr,
      correctAnswer: ink,
    };
  }, []);

  const generateNumberTask = useCallback((): Task => {
    const num = 1 + Math.floor(gameRandom() * 99);
    return {
      type: "NUMBER",
      number: num,
      isEven: num % 2 === 0,
    };
  }, []);

  const nextTask = useCallback((type: TaskType, qCount: number) => {
    // Check if we should switch modes
    const switchThreshold = 3 + Math.floor(gameRandom() * 2); // 3-4 questions
    if (qCount >= switchThreshold) {
      const newType = type === "COLOR" ? "NUMBER" : "COLOR";
      setTaskType(newType);
      setQuestionsInMode(0);
      setSwitchAlert(true);
      if (switchTimer.current) clearTimeout(switchTimer.current);
      switchTimer.current = setTimeout(() => setSwitchAlert(false), 1000);

      if (newType === "COLOR") {
        setTask(generateColorTask());
      } else {
        setTask(generateNumberTask());
      }
    } else {
      setQuestionsInMode(qCount);
      if (type === "COLOR") {
        setTask(generateColorTask());
      } else {
        setTask(generateNumberTask());
      }
    }
  }, [generateColorTask, generateNumberTask]);

  function showFeedback(text: string, correct: boolean) {
    setFeedback({ text, correct });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 400);
  }

  function init() {
      startGame();
    }

    // Auto-start game when isPlaying becomes true (after bet selection)
    const _hasStarted = useRef(false);
    useEffect(() => {
      if (isPlaying && !_hasStarted.current) {
        _hasStarted.current = true;
        setScore(0);
            scoreRef.current = 0;
            setStreak(0);
            streakRef.current = 0;
            setAnswered(0);
            answeredRef.current = 0;
            setTimeLeft(GAME_TIME);
            setFeedback(null);
            setSwitchAlert(false);
            setTaskType("COLOR");
            setQuestionsInMode(0);
            setPhase("playing");
            setTask(generateColorTask());
        
            timerRef.current = setInterval(() => {
              setTimeLeft((t) => {
                if (t <= 1) {
                  if (timerRef.current) clearInterval(timerRef.current);
                  const finalScore = Math.min(95, scoreRef.current);
                  setPhase("done");
                  onGameComplete({ score: finalScore, won: scoreRef.current >= 30 });
                  return 0;
                }
                return t - 1;
              });
            }, 1000);
      }
      if (!isPlaying) {
        _hasStarted.current = false;
      }
    }, [isPlaying]);

  function handleColorAnswer(color: string) {
    if (phase !== "playing" || !task || task.type !== "COLOR") return;

    const correct = color === task.correctAnswer;
    if (correct) {
      const streakBonus = streakRef.current >= 3 ? 3 : 0;
      const pts = 8 + streakBonus;
      const newScore = scoreRef.current + pts;
      setScore(newScore);
      scoreRef.current = newScore;
      setStreak((s) => s + 1);
      streakRef.current += 1;
      showFeedback(`+${pts}${streakBonus > 0 ? " Streak!" : ""}`, true);
    } else {
      const newScore = Math.max(0, scoreRef.current - 3);
      setScore(newScore);
      scoreRef.current = newScore;
      setStreak(0);
      streakRef.current = 0;
      showFeedback("-3", false);
    }

    setAnswered((a) => a + 1);
    answeredRef.current += 1;
    nextTask(taskType, questionsInMode + 1);
  }

  function handleNumberAnswer(even: boolean) {
    if (phase !== "playing" || !task || task.type !== "NUMBER") return;

    const correct = even === task.isEven;
    if (correct) {
      const streakBonus = streakRef.current >= 3 ? 3 : 0;
      const pts = 8 + streakBonus;
      const newScore = scoreRef.current + pts;
      setScore(newScore);
      scoreRef.current = newScore;
      setStreak((s) => s + 1);
      streakRef.current += 1;
      showFeedback(`+${pts}${streakBonus > 0 ? " Streak!" : ""}`, true);
    } else {
      const newScore = Math.max(0, scoreRef.current - 3);
      setScore(newScore);
      scoreRef.current = newScore;
      setStreak(0);
      streakRef.current = 0;
      showFeedback("-3", false);
    }

    setAnswered((a) => a + 1);
    answeredRef.current += 1;
    nextTask(taskType, questionsInMode + 1);
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="text-7xl">🔄</div>
        <p className="text-gray-400 text-center max-w-xs">
          Two tasks, one brain! Tap the INK color of words, or judge if numbers are even/odd. The task switches every few questions!
        </p>
        <button
          onClick={init}
          className="px-8 py-3 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 transition-all shadow-lg shadow-violet-500/30"
        >
          Start Switching
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
      {/* Stats */}
      <div className="flex justify-between w-full text-sm">
        <span className="text-gray-400">Answered: {answered}</span>
        <span className={`font-bold ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-gray-300"}`}>
          {timeLeft}s
        </span>
        <span className="text-yellow-400 font-bold">Score: {score}</span>
      </div>

      {/* Timer bar */}
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-1000"
          style={{ width: `${(timeLeft / GAME_TIME) * 100}%` }}
        />
      </div>

      {/* Streak */}
      {streak >= 3 && (
        <div className="text-sm text-orange-400 font-bold animate-pulse">{streak}x Streak!</div>
      )}

      {/* Switch alert */}
      {switchAlert && (
        <div className="text-lg font-bold text-fuchsia-400 animate-bounce">
          SWITCH! Now: {taskType === "COLOR" ? "Tap the INK color" : "Even or Odd?"}
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className={`text-lg font-bold animate-pulse ${feedback.correct ? "text-green-400" : "text-red-400"}`}>
          {feedback.text}
        </div>
      )}

      {/* Task mode label */}
      <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${
        taskType === "COLOR"
          ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
          : "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30"
      }`}>
        {taskType === "COLOR" ? "🎨 Tap the INK color" : "🔢 Even or Odd?"}
      </div>

      {/* Task area */}
      {phase === "playing" && task && (
        <div className="bg-gray-900/80 rounded-2xl p-6 w-full border border-gray-700">
          {task.type === "COLOR" && (
            <>
              {/* Word in colored ink */}
              <div className="text-center mb-6">
                <p className="text-5xl font-black tracking-wider" style={{ color: task.inkColor }}>
                  {task.word}
                </p>
                <p className="text-xs text-gray-500 mt-2">What color is the INK?</p>
              </div>

              {/* Color options */}
              <div className="grid grid-cols-2 gap-3">
                {task.options?.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorAnswer(color)}
                    className="py-3 rounded-xl font-bold text-white text-sm hover:scale-105 active:scale-95 transition-all border border-white/20 shadow-lg"
                    style={{ backgroundColor: color }}
                  >
                    {COLOR_NAMES[color]}
                  </button>
                ))}
              </div>
            </>
          )}

          {task.type === "NUMBER" && (
            <>
              {/* Number display */}
              <div className="text-center mb-6">
                <p className="text-6xl font-black text-white">{task.number}</p>
                <p className="text-xs text-gray-500 mt-2">Is this number even or odd?</p>
              </div>

              {/* Even/Odd buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleNumberAnswer(true)}
                  className="py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 active:scale-95 transition-all shadow-lg"
                >
                  Even
                </button>
                <button
                  onClick={() => handleNumberAnswer(false)}
                  className="py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 active:scale-95 transition-all shadow-lg"
                >
                  Odd
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Done */}
      {phase === "done" && (
        <div className="text-center space-y-3">
          <p className="text-lg font-bold text-white">
            {score >= 30 ? "Quick thinker!" : "Keep switching!"}
          </p>
          <p className="text-gray-400">{answered} questions answered</p>
          <button
            onClick={init}
            className="px-6 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 transition-all"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
