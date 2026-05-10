"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gameRandom } from "@/lib/clientRng";
import GameWrapper from "@/components/GameWrapper";

const COMMON_WORDS = [
  "apple","eagle","elite","enter","error","event","every","extra",
  "about","above","after","again","along","anger","angle","arena",
  "badge","basic","begin","below","black","blade","blame","blank",
  "brain","brave","bread","break","bring","broad","brush","build",
  "cabin","camel","candy","cargo","carry","catch","cause","chain",
  "chair","chalk","charm","chase","cheap","check","chess","chief",
  "child","china","civil","claim","clash","class","clean","clear",
  "climb","clock","close","cloud","coach","coast","color","comic",
  "dance","death","debug","decay","delta","demon","dense","depth",
  "digit","dirty","disco","doubt","draft","drain","drama","dream",
  "dress","drift","drill","drink","drive","drone","eagle","early",
  "earth","eight","ember","empty","enemy","enjoy","equal","erase",
  "exile","exist","fable","faith","false","fancy","favor","feast",
  "fence","fiber","field","final","flame","flash","fleet","flesh",
  "float","flood","floor","flour","fluid","flute","focus","force",
  "frame","fresh","front","frost","fruit","funny","ghost","giant",
  "given","glass","globe","gloom","glory","grace","grade","grain",
  "grand","grant","grape","grasp","grass","grave","great","green",
  "grind","groan","gross","group","grove","grown","guard","guess",
  "guide","happy","heart","heavy","horse","hotel","house","human",
  "humor","hyper","ideal","image","inbox","index","inner","input",
  "irish","ivory","juice","knife","known","label","labor","large",
  "laser","later","laugh","layer","learn","legal","lemon","level",
  "light","limit","linux","liver","llama","local","logic","loose",
  "lower","lucky","lunar","lunch","magic","major","manor","maple",
  "march","match","maybe","medal","media","mercy","metal","meter",
  "might","minor","minus","model","money","month","moral","motor",
  "mount","mouse","mouth","movie","music","naive","nerve","never",
  "night","noble","noise","north","noted","novel","nurse","nylon",
  "ocean","offer","olive","onset","opera","orbit","order","organ",
  "other","outer","owner","oxide","ozone","paint","panel","panic",
  "party","paste","patch","pause","peace","pearl","penny","phase",
  "phone","photo","piano","piece","pilot","pitch","pixel","pizza",
  "place","plain","plane","plant","plate","plaza","plead","plumb",
  "plume","point","polar","pound","power","press","price","pride",
  "prime","print","prior","prize","probe","proof","prose","proud",
  "prove","proxy","pulse","punch","pupil","queen","quest","queue",
  "quick","quiet","quote","radar","radio","raise","rally","range",
  "rapid","ratio","reach","ready","realm","rebel","reign","relax",
  "rider","ridge","rifle","right","rigid","river","roast","robot",
  "rocky","roman","rough","round","route","royal","rugby","ruler",
  "rural","saint","sauce","scale","scene","scope","score","sense",
  "serve","seven","shade","shake","shall","shame","shape","share",
  "shark","sharp","sheep","sheer","sheet","shelf","shell","shift",
  "shine","shirt","shock","shoot","shore","short","shout","sight",
  "sigma","since","sixth","sixty","skill","skull","slash","slate",
  "sleep","slice","slide","slope","small","smart","smell","smile",
  "smoke","snake","solar","solid","solve","sonic","sorry","south",
  "space","spare","speak","speed","spend","spice","spine","spite",
  "split","sport","spray","squad","stack","staff","stage","stain",
  "stake","stale","stand","stare","start","state","stays","steam",
  "steel","steep","steer","stick","still","stock","stone","store",
  "storm","story","stove","strip","stuck","study","stuff","style",
  "sugar","suite","sunny","super","surge","swamp","swear","sweep",
  "sweet","swept","swing","sword","table","taste","teach","teeth",
  "theme","there","thick","thing","think","third","throw","thumb",
  "tiger","tight","tired","title","today","token","total","touch",
  "tough","tower","toxic","trace","track","trade","trail","train",
  "trait","trash","treat","trend","trial","tribe","trick","tried",
  "truck","truly","trump","trunk","trust","truth","tumor","tunes",
  "twist","tyler","ultra","under","union","unite","unity","until",
  "upper","upset","urban","usage","usual","valid","value","vapor",
  "vault","verse","video","vigor","vinyl","viral","virus","visit",
  "vista","vital","vivid","vocal","voice","voter","wages","waste",
  "watch","water","whale","wheat","wheel","where","which","while",
  "white","whole","whose","wider","woman","women","world","worry",
  "worse","worst","worth","would","wound","write","wrong","yacht",
  "yield","young","youth","zebra","zones",
];

function isValidWord(word: string): boolean {
  return COMMON_WORDS.includes(word.toLowerCase());
}

export default function WordChainPage() {
  return (
    <GameWrapper gameSlug="word-chain" gameName="Word Chain" gameIcon="🔗">
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
  const [chain, setChain] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const scoreRef = useRef<number>(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [lastLetter, setLastLetter] = useState("");
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const chainRef = useRef<string[]>([]);

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
        const startIdx = Math.floor(gameRandom() * COMMON_WORDS.length);
            const startWord = COMMON_WORDS[startIdx].toUpperCase();
            const lastChar = startWord[startWord.length - 1].toUpperCase();
        
            setChain([startWord]);
            chainRef.current = [startWord];
            setLastLetter(lastChar);
            setUsedWords(new Set([startWord.toLowerCase()]));
            setInput("");
            setScore(0);
            scoreRef.current = 0;
            setTimeLeft(60);
            setFeedback(`Start word: ${startWord}. Now type a word starting with "${lastChar}"!`);
            setShake(false);
            setPhase("playing");
        
            setTimeout(() => inputRef.current?.focus(), 100);
        
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  clearInterval(timerRef.current!);
                  const finalScore = Math.min(95, scoreRef.current);
                  const won = chainRef.current.length - 1 >= 8;
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

  function submitWord() {
    const word = input.trim().toUpperCase();
    if (word.length < 3) {
      triggerError("Word too short! Need 3+ letters abeg 😤");
      return;
    }
    if (!word.startsWith(lastLetter)) {
      triggerError(`Word must start with "${lastLetter}"! Na the rule be dat 🙅`);
      return;
    }
    if (usedWords.has(word.toLowerCase())) {
      triggerError("You don use this word before! Try another one 🔄");
      return;
    }
    if (!isValidWord(word)) {
      triggerError("E no dey our dictionary! Try valid English word 📖");
      return;
    }

    const newLastLetter = word[word.length - 1].toUpperCase();
    const wordScore = word.length <= 4 ? 8 : word.length <= 6 ? 12 : 16;
    const newScore = Math.min(95, score + wordScore);

    setScore(newScore);
    scoreRef.current = newScore;
    setChain(prev => {
      const updated = [...prev, word];
      chainRef.current = updated;
      return updated;
    });
    setLastLetter(newLastLetter);
    setUsedWords(prev => new Set([...prev, word.toLowerCase()]));
    setInput("");
    setFeedback(`Nice one! +${wordScore} pts 🔥 Now start with "${newLastLetter}"`);

    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function triggerError(msg: string) {
    setFeedback(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && input.trim()) {
      submitWord();
    }
  }

  const wordsTyped = chain.length - 1;
  const progress = Math.min(100, (wordsTyped / 8) * 100);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      {phase === "idle" && (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-2">🔗</div>
          <h2 className="text-2xl font-bold text-white">Word Chain</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Chain words together! Each word must start with the last letter of the previous word.
            <br />Get 8+ words to win. You get 60 seconds!
          </p>
          <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-300">
            <p>Example: <span className="text-yellow-400">APPLE</span> → <span className="text-green-400">EAGLE</span> → <span className="text-blue-400">EARTH</span></p>
          </div>
          <button
            onClick={begin}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-lg"
          >
            Start Chain! 🔗
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="w-full space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="bg-gray-700 px-4 py-2 rounded-lg">
              <span className="text-gray-400 text-xs">WORDS</span>
              <p className="text-white font-bold text-lg">{wordsTyped}/8</p>
            </div>
            <div className={`px-4 py-2 rounded-lg ${timeLeft <= 10 ? "bg-red-900 animate-pulse" : "bg-gray-700"}`}>
              <span className="text-gray-400 text-xs">TIME</span>
              <p className={`font-bold text-lg ${timeLeft <= 10 ? "text-red-400" : "text-white"}`}>{timeLeft}s</p>
            </div>
            <div className="bg-gray-700 px-4 py-2 rounded-lg">
              <span className="text-gray-400 text-xs">SCORE</span>
              <p className="text-yellow-400 font-bold text-lg">{score}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Current required letter */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">Next word must start with:</p>
            <div className="text-5xl font-black text-yellow-400 my-2 animate-bounce">{lastLetter}</div>
          </div>

          {/* Input */}
          <div className={`flex gap-2 ${shake ? "animate-pulse" : ""}`}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder={`Type a word starting with ${lastLetter}...`}
              className="flex-1 bg-gray-700 border-2 border-gray-600 rounded-xl px-4 py-3 text-white text-lg focus:border-yellow-400 focus:outline-none transition-colors"
              maxLength={15}
              autoComplete="off"
              autoCorrect="off"
            />
            <button
              onClick={submitWord}
              disabled={!input.trim()}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              GO
            </button>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`text-center text-sm py-2 px-3 rounded-lg ${
              feedback.includes("+") || feedback.includes("Nice") ? "bg-green-900/50 text-green-300" :
              feedback.includes("Start") ? "bg-blue-900/50 text-blue-300" :
              "bg-red-900/50 text-red-300"
            }`}>
              {feedback}
            </div>
          )}

          {/* Chain display */}
          <div className="bg-gray-800 rounded-xl p-3 max-h-40 overflow-y-auto">
            <p className="text-gray-500 text-xs mb-2">CHAIN:</p>
            <div className="flex flex-wrap gap-1">
              {chain.map((word, i) => (
                <span key={i} className="inline-flex items-center">
                  <span className={`px-2 py-1 rounded text-sm font-mono ${
                    i === 0 ? "bg-blue-800 text-blue-200" : "bg-green-800 text-green-200"
                  }`}>
                    {word}
                  </span>
                  {i < chain.length - 1 && <span className="text-gray-500 mx-1">→</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center space-y-4">
          <div className="text-6xl">{wordsTyped >= 8 ? "🏆" : "💪"}</div>
          <h2 className="text-2xl font-bold text-white">
            {wordsTyped >= 8 ? "Champion! You dey chain words well!" : "Time Don Finish!"}
          </h2>
          <div className="bg-gray-700 rounded-xl p-4 space-y-2">
            <p className="text-gray-300">Words Chained: <span className="text-yellow-400 font-bold">{wordsTyped}</span></p>
            <p className="text-gray-300">Final Score: <span className="text-green-400 font-bold">{Math.min(95, score)}</span></p>
            <p className="text-gray-300">Longest word: <span className="text-blue-400 font-bold">
              {chain.length > 1 ? chain.slice(1).reduce((a, b) => a.length >= b.length ? a : b) : "—"}
            </span></p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 max-h-32 overflow-y-auto">
            <p className="text-gray-500 text-xs mb-1">Your chain:</p>
            <p className="text-gray-300 text-sm">{chain.join(" → ")}</p>
          </div>
          <button
            onClick={begin}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
          >
            Try Again 🔄
          </button>
        </div>
      )}
    </div>
  );
}
