"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AdBanner from "./AdBanner";
import ParticleBackground from "./ParticleBackground";
import Confetti from "./Confetti";
import { useSound } from "@/hooks/useSound";
import { useToast } from "@/components/Toast";
import { ACHIEVEMENTS, GAMES } from "@/lib/constants";
import { initGameRng, resetGameRng } from "@/lib/clientRng";
import HowToPlay from "./HowToPlay";
import {
  generateViewerCount,
  generateIdleMessage,
  generateBetMessage,
  generateStartMessage,
  generateWinReaction,
  generateLoseReaction,
  generateMidGameMessage,
  generateEmoteReaction,
  generateNpcBettors,
  type CrowdMessage,
} from "@/lib/npcCrowd";

interface GameResult {
  score: number;
  won: boolean;
}

interface GameWrapperProps {
  gameSlug: string;
  gameName: string;
  gameIcon: string;
  children: (props: {
    onGameComplete: (result: GameResult) => void;
    isPlaying: boolean;
    startGame: () => void;
  }) => React.ReactNode;
}

const BET_TIERS = [
  { amount: 0, label: "Free Play", multiplier: "0.3x", icon: "🎮", color: "from-gray-600 to-gray-700", textColor: "text-gray-300" },
  { amount: 10, label: "Small", multiplier: "1x", icon: "🪙", color: "from-blue-500 to-blue-600", textColor: "text-blue-300" },
  { amount: 25, label: "Medium", multiplier: "1.8x", icon: "💰", color: "from-purple-500 to-purple-600", textColor: "text-purple-300" },
  { amount: 50, label: "Large", multiplier: "2.8x", icon: "💎", color: "from-yellow-500 to-amber-500", textColor: "text-yellow-300" },
  { amount: 100, label: "MAX", multiplier: "4x", icon: "👑", color: "from-red-500 to-pink-600", textColor: "text-red-300" },
];

const GAME_INSTRUCTIONS: Record<string, { steps: string[]; tips?: string[] }> = {
  // ── Existing skill games ──
  "memory-matrix": { steps: ["Tiles go flash on the grid — watch sharp!", "Remember which ones were glowing", "Tap them back correct — 5 rounds, no dulling"], tips: ["E get harder every round o", "Get 50%+ right and you move forward"] },
  "speed-tap": { steps: ["Targets pop up everywhere — tap am fast!", "You get 60 seconds, make every tap count", "Dodge the bombs! Stack combos for bigger points"], tips: ["Back-to-back hits = combo multiplier 🔥", "Bomb go reset your combo and minus 15 pts"] },
  "math-blitz": { steps: ["Maths questions dey fly — pick the right answer", "60 seconds on the clock, no slack", "Correct streak = your score go multiply!"], tips: ["Questions get harder as you dey go", "One wrong answer resets your streak sha"] },
  "pattern-recall": { steps: ["Watch the colored pads as dem light up", "Copy the exact sequence — tap am back", "Every round adds one more to remember"], tips: ["You get 3 lives, use am well", "Finish all 10 rounds = big bonus bag"] },
  "word-scramble": { steps: ["Letters dey scattered — arrange am to form word", "Type the correct word before time finish", "60 seconds — longer words = more cash"], tips: ["Hint dey but e go halve your points", "Skip if you stuck, next word fit easier"] },
  "reaction-rush": { steps: ["Things dey fall down 3 lanes — coins, gems, bombs", "Move your whip to catch the good stuff", "Dodge bombs o! 3 lives, 60 seconds"], tips: ["Gems worth 3x more than coins", "Use arrow keys or tap the lane buttons"] },
  "color-sequence": { steps: ["Watch the colored tiles flash one by one", "Repeat the exact order you saw", "8 rounds — sequences get longer and faster"], tips: ["Streaks multiply your bag 💰", "More colors appear for later rounds"] },
  "naija-runner": { steps: ["Run through Lagos streets — danfo and okada dey come!", "Collect naira, suya, diamonds & crowns", "Reach 800m to finish — speed go increase!"], tips: ["Arrow keys or tap lanes to dodge", "3 lives — reach 800m for bonus points"] },
  "jollof-wars": { steps: ["See the ingredients for the dish — memorize am quick!", "Pick the right ingredients from the grid", "5 dishes total — perfect recipe = bonus bag"], tips: ["Ingredients disappear after 2-3 seconds o", "Wrong picks go cost you points"] },
  "treasure-hunter": { steps: ["Pick 1 of 3 doors every floor — wahala or treasure?", "Treasure = points, Puzzle = solve for cash, Trap = lose life", "5 floors deep with a boss waiting for you"], tips: ["Boss puzzle hard but worth 25 pts", "Only 3 lives — choose wisely fam"] },
  "beat-drop": { steps: ["Beats dey fall in 4 lanes — catch the rhythm!", "Tap the lane when beats reach the line (D/F/J/K keys)", "60 seconds — Perfect, Great, or Good timing"], tips: ["Combos multiply your points up to 3x", "Miss a beat and your combo resets"] },
  "escape-room": { steps: ["3 puzzles per room — solve am to escape!", "Pattern locks, math codes & shape puzzles dey wait", "3 rooms, 60 seconds total — speed = extra points"], tips: ["Fast solves earn time bonus 🔥", "Wrong answers no cost lives, just time"] },

  // ── NEW: Batch 1 ──
  "word-chain": { steps: ["Type a word — next word must start with the last letter!", "Keep the chain going for 60 seconds", "Longer words = more points, streaks = bonus!"], tips: ["Think ahead — some letters harder to start with", "8+ valid words = you win big"] },
  "math-grid": { steps: ["3x3 grid — fill empty cells so each row hits the target sum", "3 puzzles total, 75 seconds on the clock", "Correct cells + speed = your final bag"], tips: ["Start with rows that only need one number", "Check your sums before submitting o"] },
  "emoji-decoder": { steps: ["Emoji sequence represents a phrase — decode am!", "Pick the right answer from 4 options", "12 questions, 60 seconds — streak bonus after 2 correct"], tips: ["Think about what each emoji represents literally", "Some phrases are common sayings — you know dem!"] },
  "tile-slide": { steps: ["Classic sliding puzzle — arrange tiles in order!", "Click a tile next to the empty space to slide am", "3 puzzles, 90 seconds — fewer moves = more points"], tips: ["Work on one row at a time, top to bottom", "Don't rush — plan your moves carefully"] },
  "memory-sprint": { steps: ["Items flash on screen briefly — memorize which ones!", "Pick the correct items from a larger set", "8 rounds, 60 seconds — items increase each round"], tips: ["Group items mentally to remember more", "Later rounds show 6 items among 12 choices 😱"] },

  // ── NEW: Brain / Memory games ──
  "emoji-match": { steps: ["4x4 grid of hidden emoji cards — flip two at a time", "Match pairs from memory before time runs out", "45 seconds — clear all 8 pairs for max bag"], tips: ["First flip = free info, use am well", "Remember positions — rushing go scatter you"] },
  "number-memory": { steps: ["Numbers flash on screen — memorize the sequence!", "Type am back exactly as you saw am", "Sequence gets longer every round — 8 rounds total"], tips: ["Start with 3 digits, ends with 10 😱", "Say the numbers in your head as dem show"] },
  "emoji-chain": { steps: ["Watch the emoji chain grow one by one", "Repeat the full chain from memory each round", "Chain grows longer every time — 8 rounds"], tips: ["Build a story with the emojis to remember", "One mistake = game over, no second chance"] },
  "shadow-match": { steps: ["See the emoji shadow — pick which emoji matches!", "15 shadows, 60 seconds on the clock", "Streak bonus kicks in after 2 correct"], tips: ["Look at the shape outline carefully", "Some emojis look similar — don't rush!"] },
  "mirror-draw": { steps: ["See a pattern on one side of the 4x4 grid", "Recreate the mirror image on the other side", "6 rounds, 40 seconds — accuracy matters!"], tips: ["Think of am like reflection in water", "Start from the edges, work inward"] },
  "odd-one-out": { steps: ["Grid of emojis — one no be like the others!", "Spot the different one and tap am fast", "15 rounds, 60 seconds — speed = bonus points"], tips: ["Grid gets bigger as rounds go on", "Sometimes the difference dey very subtle o"] },

  // ── NEW: Speed / Reflex games ──
  "whack-a-mole": { steps: ["Targets pop up on the 3x3 grid — smash am!", "Regular targets = 5pts, golden = 15pts, bombs = -10pts", "60 seconds — tap as fast as your fingers allow"], tips: ["Golden moles stay shorter — catch am quick!", "Bombs flash red — avoid at all costs"] },
  "reflex-test": { steps: ["Screen go turn green — tap am the SECOND it changes!", "5 rounds to test your reaction speed", "Faster reaction = more points per round"], tips: ["Don't tap early or e count as false start!", "Under 200ms reaction = you be superhuman"] },
  "aim-trainer": { steps: ["Circles appear on screen — click am before dem shrink!", "Targets keep coming for 60 seconds", "Accuracy + speed = your final score"], tips: ["Aim for center of the circle for bonus", "Targets shrink fast — no time to dull"] },
  "arrow-dash": { steps: ["Arrows flash on screen — tap the right direction!", "Up, Down, Left, Right — match am fast", "60 seconds of arrows — wrong tap = minus points"], tips: ["Build streak for combo multiplier 🔥", "Don't panic — wrong answers cost more than slow ones"] },
  "speed-sort": { steps: ["Numbers scatter on screen — tap am in order!", "Start from 1, go up — ascending order", "60 seconds, 15 rounds — numbers increase each round"], tips: ["Scan the whole grid before you start tapping", "Numbers get more as rounds go on"] },
  "snap-match": { steps: ["Cards flip one by one — watch the sequence!", "When two consecutive cards match, shout SNAP!", "60 seconds — miss the snap or false alarm = penalty"], tips: ["Stay focused — matches come when you least expect", "Get 5+ correct snaps to win"] },

  // ── NEW: Puzzle / Logic games ──
  "code-breaker": { steps: ["Secret 4-color code dey hidden — crack am!", "After each guess, you get clues: 🟢 = right color right spot, 🟡 = right color wrong spot", "8 attempts to break the code — think sharp!"], tips: ["Use process of elimination like detective", "Green clues confirm position — lock those in"] },
  "sequence-surge": { steps: ["Number pattern dey — figure out what comes next!", "15 sequences, 60 seconds to solve as many as you can", "Harder sequences = more points per answer"], tips: ["Look for addition, multiplication, or alternating patterns", "Skip hard ones — easy ones still pay"] },
  "grid-fill": { steps: ["4x4 mini grid — fill am so no row or column repeats!", "Numbers 1-4 only, each must appear once per line", "3 puzzles, 50 seconds — like mini Sudoku!"], tips: ["Start with rows that already have 3 numbers", "If you stuck, try the columns instead"] },
  "path-finder": { steps: ["Find the path from start to finish on the 6x6 grid!", "Navigate around walls — only up/down/left/right", "3 mazes, 60 seconds total — shortest path = bonus"], tips: ["Plan your route before you start moving", "Dead ends waste precious time o"] },
  "rapid-fire": { steps: ["Statements flash — TRUE or FALSE, answer sharp sharp!", "60 seconds of non-stop questions — no time to think twice", "Streak bonus after 3 correct in a row"], tips: ["Trust your first instinct — overthinking kills", "Mix of maths, facts, and trick questions"] },
  "connect-dots": { steps: ["Numbered dots scattered on screen — connect am in order!", "Tap 1, then 2, then 3... all the way to the end", "3 rounds, 60 seconds — more dots each round"], tips: ["Scan for the next number before you tap current", "Wrong tap resets your sequence — be careful!"] },

  // ── NEW: Action / Skill games ──
  "tower-stack": { steps: ["Blocks slide left and right — tap to drop am!", "Stack perfectly for max points — overhang gets trimmed", "10 blocks total — miss completely and game done!"], tips: ["Perfect alignment = 10 pts + streak bonus 🔥", "Speed increases every block — timing is key"] },
  "typing-race": { steps: ["Words appear — type am fast before time runs out!", "60 seconds on the clock, every word counts", "Longer words = more points per word"], tips: ["Accuracy matters — typos waste time", "Short common words come first, then wahala begins"] },
  "bubble-pop": { steps: ["Numbered bubbles floating around — pop am in order!", "Start from 1, go ascending — skip none", "3 rounds, 60 seconds — bubbles move faster each round"], tips: ["Scan for the next number while popping current", "Wrong bubble = time penalty, be patient"] },
  "cargo-sort": { steps: ["Colored boxes falling — sort am into the right bins!", "Match box color to bin color — drag or tap", "60 seconds — wrong bin = minus points"], tips: ["Speed matters but accuracy matters more", "Boxes fall faster as time goes — stay ready"] },
  "color-spy": { steps: ["Grid of colored squares — one shade dey different!", "Spot the odd one out and tap am fast", "20 rounds, 60 seconds — colors get closer each round"], tips: ["Squint your eyes small — the difference go show", "Later rounds = nearly identical shades 😱"] },
  "quick-switch": { steps: ["Rules keep changing — sometimes tap color, sometimes tap word!", "Stroop test vibes — your brain go try confuse you", "60 seconds of pure brain chaos — stay sharp!"], tips: ["Read the instruction FIRST before answering", "Wrong answers break your streak and cost points"] },

  // ── NEW: Naija Special games ──
  "naija-trivia": { steps: ["Naija knowledge quiz — how well you know your country?", "15 questions about culture, states, food, football & more", "60 seconds — streak bonus after 3 correct!"], tips: ["Questions cover everything from jollof to geography", "Real 9ja heads go smash this easy"] },
  "pidgin-puzzle": { steps: ["Pidgin sentence with one word missing — fill am!", "Pick the correct word from 4 options", "15 rounds, 60 seconds — you sabi pidgin?"], tips: ["Read the full sentence before you pick", "Some words sound similar but meaning different o"] },
  "afro-beats": { steps: ["Emoji clues describe an Afrobeats artist — guess who!", "12 rounds of pure music knowledge", "60 seconds — streaks multiply your bag"], tips: ["Clues combine emojis with album/song hints", "Only real music heads go ace this one"] },
  "suya-stack": { steps: ["Stack suya pieces on the skewer — time your drop!", "Piece slides left and right — tap to drop am", "Perfect alignment = max points, miss = game over!"], tips: ["Speed increases every piece — stay focused", "10 pieces total — stack am all for bonus"] },
  "market-rush": { steps: ["Mama send you market — buy the right items!", "See the shopping list, pick correct items from the stall", "7 rounds, 65 seconds — stay under budget!"], tips: ["Check prices carefully — budget is tight o", "Wrong items or over budget = no points for that round"] },
  "flag-quiz": { steps: ["Flag emoji appears — name the country!", "15 flags from around the world, 60 seconds", "Streak bonus kicks in after 2 correct"], tips: ["Mix of African, European, Asian & American flags", "Some flags look alike — watch the colors carefully"] },

  // ── NEW: Skill games batch 2 ──
  "rhythm-tap": { steps: ["Watch the colored beat pattern light up", "Tap the pads back in the exact same order", "8 rounds — patterns get longer (3 to 7 beats)"], tips: ["Build streaks for multiplier bonus 🔥", "Get 5+ patterns correct to win"] },
  "color-flood": { steps: ["Start from the top-left corner of the 6x6 grid", "Pick colors to flood-fill from the corner outward", "Clear the whole board in 20 moves or less!"], tips: ["3 boards, 75 seconds — clear 2+ to win", "Plan 2-3 moves ahead for max coverage"] },
  "digit-dash": { steps: ["A number appears, then math operations flash one by one", "Keep a running total in your head — no calculator!", "Type the final answer after each chain of operations"], tips: ["8 chains, 70 seconds — get 5+ correct to win", "Chains get harder with bigger numbers and more ops"] },
  "word-hunt": { steps: ["5x5 letter grid with hidden words (3-5 letters)", "Type words you spot — they go horizontal or vertical", "2 grids, 60 seconds — find 6+ words total to win!"], tips: ["Scan rows first, then columns", "Short 3-letter words are easiest to spot"] },
  "reaction-chain": { steps: ["Numbered circles appear — click them in order (1, 2, 3...)", "Each click reveals where the next number is hiding", "5 rounds with increasing circles (6 to 15)"], tips: ["Speed = bonus points — go fast!", "Complete 3+ rounds to win"] },
};

function ShareWinMenu({ gameName, gameIcon, pointsEarned, onShare }: { gameName: string; gameIcon: string; pointsEarned: number; onShare: () => void }) {
  const [open, setOpen] = useState(false);
  const text = `${gameIcon} I just won ${pointsEarned} points playing ${gameName} on Gamers360! 🔥💰\n\nJoin free & start earning 👉 gamers360.com`;
  const url = "https://gamers360.com";

  function share(platform: string) {
    onShare();
    setOpen(false);
    switch (platform) {
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`, "_blank");
        break;
      case "tiktok":
      case "instagram":
        navigator.clipboard.writeText(text + "\n" + url);
        break;
      default:
        navigator.clipboard.writeText(text + "\n" + url);
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="glass px-4 py-3 rounded-xl hover:bg-white/10 transition text-sm">
        📤 Share Win
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 right-0 z-50 w-48 glass rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
            <button onClick={() => share("twitter")} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition">
              <span className="text-base">𝕏</span> Twitter / X
            </button>
            <button onClick={() => share("whatsapp")} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition">
              <span className="text-base">💬</span> WhatsApp
            </button>
            <button onClick={() => share("tiktok")} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition">
              <span className="text-base">🎵</span> TikTok
            </button>
            <button onClick={() => share("instagram")} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition">
              <span className="text-base">📸</span> Instagram
            </button>
            <button onClick={() => share("copy")} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition border-t border-white/5">
              <span className="text-base">📋</span> Copy
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function LiveChat({ messages }: { messages: CrowdMessage[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getNameColor = (name: string) => {
    const colors = ["text-cyan-400", "text-pink-400", "text-green-400", "text-yellow-400", "text-purple-400", "text-orange-400", "text-blue-400", "text-red-400"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div ref={scrollRef} className="h-[140px] overflow-y-auto overflow-x-hidden scrollbar-thin space-y-0.5 px-2 py-1">
      {messages.slice(-20).map((msg) => (
        <div key={msg.id} className="animate-slide-up">
          {msg.type === "system" ? (
            <div className="text-[10px] text-yellow-400/70 text-center py-0.5">{msg.text}</div>
          ) : msg.type === "emote" ? (
            <div className="text-xs">
              <span className={`font-bold ${getNameColor(msg.name)}`}>{msg.name}</span>
              <span className="ml-1">{msg.text}</span>
            </div>
          ) : msg.type === "bet" ? (
            <div className="text-[10px] text-yellow-400/80 bg-yellow-400/5 rounded px-1 py-0.5">{msg.text}</div>
          ) : (
            <div className="text-[11px]">
              <span className={`font-bold ${getNameColor(msg.name)}`}>{msg.name}</span>
              <span className="text-gray-400 ml-1">{msg.text}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function NpcBettorsBar({ bettors, won }: { bettors: { name: string; amount: number; forPlayer: boolean }[]; won: boolean | null }) {
  const forPlayer = bettors.filter(b => b.forPlayer);
  const against = bettors.filter(b => !b.forPlayer);
  const totalFor = forPlayer.reduce((s, b) => s + b.amount, 0);
  const totalAgainst = against.reduce((s, b) => s + b.amount, 0);
  const total = totalFor + totalAgainst;
  const forPct = total > 0 ? (totalFor / total) * 100 : 50;

  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span className="text-green-400 font-bold">{forPlayer.length} betting FOR ({totalFor})</span>
        <span className="text-gray-500">Side Bets</span>
        <span className="text-red-400 font-bold">({totalAgainst}) {against.length} AGAINST</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden flex">
        <div
          className={`h-full transition-all duration-1000 ${won === true ? "bg-green-400" : won === false ? "bg-green-400/30" : "bg-green-400/70"}`}
          style={{ width: `${forPct}%` }}
        />
        <div
          className={`h-full transition-all duration-1000 ${won === false ? "bg-red-400" : won === true ? "bg-red-400/30" : "bg-red-400/70"}`}
          style={{ width: `${100 - forPct}%` }}
        />
      </div>
      {won !== null && (
        <div className={`text-[10px] text-center mt-1 font-bold ${won ? "text-green-400" : "text-red-400"}`}>
          {won ? `✅ ${forPlayer.length} bettors won!` : `${against.length} bettors cashed in`}
        </div>
      )}
    </div>
  );
}

export default function GameWrapper(props: GameWrapperProps) {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <div className="text-2xl animate-spin inline-block">🎮</div>
      </div>
    }>
      <GameWrapperInner {...props} />
    </Suspense>
  );
}

function GameWrapperInner({ gameSlug, gameName, gameIcon, children }: GameWrapperProps) {
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId");

  if (matchId) {
    return (
      <MultiplayerGameWrapper
        gameSlug={gameSlug}
        gameName={gameName}
        gameIcon={gameIcon}
        matchId={matchId}
      >
        {children}
      </MultiplayerGameWrapper>
    );
  }

  return (
    <SoloGameWrapper
      gameSlug={gameSlug}
      gameName={gameName}
      gameIcon={gameIcon}
    >
      {children}
    </SoloGameWrapper>
  );
}

function MultiplayerGameWrapper({ gameSlug, gameName, gameIcon, matchId, children }: GameWrapperProps & { matchId: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<"loading" | "ready" | "playing" | "submitting" | "done">("loading");
  const [matchData, setMatchData] = useState<{
    betAmount: number;
    seed: number;
    gameSlug: string;
    challenger: { username: string };
    opponent: { username: string } | null;
  } | null>(null);
  const [mpResult, setMpResult] = useState<{
    status: string;
    yourScore: number;
    opponentScore?: number;
    won?: boolean;
    tied?: boolean;
    payout?: number;
    challenger?: { username: string; score: number };
    opponent?: { username: string; score: number };
    message?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const { play } = useSound();
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMatch() {
      try {
        const res = await fetch(`/api/multiplayer/list?filter=match&id=${matchId}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to load match");
          return;
        }
        const data = await res.json();
        if (!data.match || data.match.status !== "active") {
          setError("Match is not active");
          return;
        }
        const isChallenger = data.match.challengerId === data.userId;
        const myDone = isChallenger ? data.match.challengerDone : data.match.opponentDone;
        if (myDone) {
          setError("You already submitted your score for this match");
          return;
        }
        setMatchData({
          betAmount: data.match.betAmount,
          seed: data.match.seed,
          gameSlug: data.match.gameSlug,
          challenger: data.match.challenger,
          opponent: data.match.opponent,
        });
        setPhase("ready");
      } catch {
        setError("Network error loading match");
      }
    }
    loadMatch();
  }, [matchId]);

  function startGame() {
    if (!matchData || isPlaying) return;
    initGameRng(matchData.seed);
    setIsPlaying(true);
    setPhase("playing");
    play("click");
  }

  async function onGameComplete({ score }: { score: number; won: boolean }) {
    setIsPlaying(false);
    resetGameRng();
    setPhase("submitting");

    try {
      const res = await fetch("/api/multiplayer/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, score }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit score");
        play("error");
        return;
      }
      const data = await res.json();
      setMpResult(data);
      setPhase("done");

      if (data.status === "completed" && data.won) {
        play("win");
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else if (data.status === "completed") {
        play("coin");
      } else {
        play("coin");
      }
    } catch {
      setError("Failed to submit score");
      play("error");
    }
  }

  return (
    <>
      <ParticleBackground />
      <Confetti active={showConfetti} />
      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        <div className="mb-6">
          <Link href="/multiplayer" className="text-gray-500 hover:text-white text-sm transition inline-flex items-center gap-1">
            ← Back to Multiplayer
          </Link>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{gameIcon}</span>
                <div>
                  <h1 className="text-xl font-black">{gameName}</h1>
                  <div className="text-xs text-orange-400 font-bold">MULTIPLAYER MATCH</div>
                </div>
              </div>
              {matchData && (
                <div className="text-right">
                  <div className="text-yellow-400 font-bold">{matchData.betAmount} pts bet</div>
                  <div className="text-[10px] text-gray-500">Total pot: {matchData.betAmount * 2}</div>
                </div>
              )}
            </div>
            {matchData && (
              <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-white">{matchData.challenger.username}</div>
                  <div className="text-[10px] text-gray-500">Challenger</div>
                </div>
                <div className="text-lg text-yellow-400 font-black">VS</div>
                <div className="text-center">
                  <div className="font-bold text-white">{matchData.opponent?.username || "?"}</div>
                  <div className="text-[10px] text-gray-500">Opponent</div>
                </div>
              </div>
            )}
          </div>

          {/* Game area */}
          <div className="p-6">
            {phase === "loading" && !error && (
              <div className="text-center py-8">
                <div className="text-2xl animate-spin inline-block mb-3">🎮</div>
                <div className="text-gray-400 text-sm">Loading match...</div>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-4">
                  {error}
                </div>
                <Link href="/multiplayer" className="inline-block mt-4 text-sm text-yellow-400 hover:text-yellow-300 transition">
                  Back to Multiplayer
                </Link>
              </div>
            )}

            {phase === "submitting" && (
              <div className="text-center py-8">
                <div className="text-2xl animate-spin inline-block mb-3">📤</div>
                <div className="text-gray-400 text-sm">Submitting your score...</div>
              </div>
            )}

            <div ref={gameContainerRef} className={phase !== "ready" && phase !== "playing" ? "hidden" : ""}>
              {children({ onGameComplete, isPlaying, startGame })}
            </div>
          </div>

          {/* Result */}
          {mpResult && phase === "done" && (
            <div className={`p-6 border-t border-white/5 animate-slide-up ${
              mpResult.status === "completed" && mpResult.won
                ? "bg-gradient-to-r from-green-400/10 via-yellow-400/5 to-green-400/10"
                : mpResult.status === "completed" && mpResult.tied
                ? "bg-gradient-to-r from-yellow-400/10 via-transparent to-yellow-400/10"
                : mpResult.status === "completed"
                ? "bg-gradient-to-r from-red-400/10 via-transparent to-red-400/10"
                : "bg-gradient-to-r from-blue-400/10 via-transparent to-blue-400/10"
            }`}>
              <div className="text-center">
                {mpResult.status === "completed" ? (
                  <>
                    <div className="text-3xl font-black mb-2">
                      {mpResult.won ? (
                        <span className="text-green-400">YOU WIN!</span>
                      ) : mpResult.tied ? (
                        <span className="text-yellow-400">TIE GAME!</span>
                      ) : (
                        <span className="text-red-400">YOU LOST</span>
                      )}
                    </div>

                    {/* Scores */}
                    <div className="flex items-center justify-center gap-8 mb-4">
                      <div>
                        <div className="text-2xl font-black text-white">{mpResult.challenger?.score ?? 0}</div>
                        <div className="text-xs text-gray-500">{mpResult.challenger?.username}</div>
                      </div>
                      <div className="text-gray-600 text-sm">vs</div>
                      <div>
                        <div className="text-2xl font-black text-white">{mpResult.opponent?.score ?? 0}</div>
                        <div className="text-xs text-gray-500">{mpResult.opponent?.username}</div>
                      </div>
                    </div>

                    {/* Payout */}
                    {mpResult.won && mpResult.payout ? (
                      <div className="text-green-400 font-bold text-lg mb-4">+{mpResult.payout} pts won!</div>
                    ) : mpResult.tied ? (
                      <div className="text-yellow-400 font-bold text-sm mb-4">Bet refunded ({mpResult.payout} pts)</div>
                    ) : (
                      <div className="text-red-400 font-bold text-sm mb-4">Bet lost</div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-2xl mb-2">📤</div>
                    <div className="text-lg font-bold text-white mb-1">Score Submitted!</div>
                    <div className="text-yellow-400 font-bold text-2xl mb-2">{mpResult.yourScore} pts</div>
                    <div className="text-gray-400 text-sm animate-pulse">{mpResult.message}</div>
                  </>
                )}

                <div className="mt-4">
                  <Link
                    href="/multiplayer"
                    className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 transition"
                  >
                    Back to Multiplayer
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SoloGameWrapper({ gameSlug, gameName, gameIcon, children }: GameWrapperProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameToken, setGameToken] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [selectedBet, setSelectedBet] = useState(0);
  const [showBetScreen, setShowBetScreen] = useState(false);
  const [result, setResult] = useState<{
    won: boolean;
    pointsEarned: number;
    xpGained: number;
    level: number;
    levelName: string;
    leveledUp: boolean;
    newAchievements: string[];
    cooldown: number;
    betAmount: number;
    betLoss: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [starting, setStarting] = useState(false);
  const { play } = useSound();
  const { showToast } = useToast();

  const [gameKey, setGameKey] = useState(0);
  const [pendingAutoStart, setPendingAutoStart] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const autoStartTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // NPC crowd state
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<CrowdMessage[]>([]);
  const [npcBettors, setNpcBettors] = useState<{ name: string; amount: number; forPlayer: boolean }[]>([]);
  const [crowdMood, setCrowdMood] = useState<"idle" | "hype" | "tense" | "wild" | "sad">("idle");
  const [floatingEmotes, setFloatingEmotes] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const chatIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const emoteIdRef = useRef(0);
  const gameWonRef = useRef<boolean | null>(null);

  useEffect(() => {
    setViewerCount(generateViewerCount());
    setChatMessages([generateIdleMessage(), generateIdleMessage()]);
  }, []);

  // Viewer count fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(v => Math.max(5, v + Math.floor(Math.random() * 11) - 5));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const addChatMessage = useCallback((msg: CrowdMessage) => {
    setChatMessages(prev => [...prev.slice(-30), msg]);
  }, []);

  const spawnFloatingEmote = useCallback((emoji: string) => {
    const id = ++emoteIdRef.current;
    const x = 10 + Math.random() * 80;
    setFloatingEmotes(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingEmotes(prev => prev.filter(e => e.id !== id));
    }, 2000);
  }, []);

  // Idle chat
  useEffect(() => {
    if (isPlaying) return;
    const interval = setInterval(() => {
      addChatMessage(generateIdleMessage());
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [isPlaying, addChatMessage]);

  // Mid-game chat
  useEffect(() => {
    if (!isPlaying) {
      if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
      return;
    }
    chatIntervalRef.current = setInterval(() => {
      if (Math.random() < 0.4) {
        addChatMessage(generateMidGameMessage());
      } else {
        addChatMessage(generateEmoteReaction());
        const emotes = ["🔥", "👀", "😱", "💀", "🤯", "⚡"];
        spawnFloatingEmote(emotes[Math.floor(Math.random() * emotes.length)]);
      }
    }, 2500 + Math.random() * 2000);
    return () => { if (chatIntervalRef.current) clearInterval(chatIntervalRef.current); };
  }, [isPlaying, addChatMessage, spawnFloatingEmote]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-start game after Play Again → bet → API success
  useEffect(() => {
    if (pendingAutoStart && isPlaying && !starting && !showBetScreen && gameContainerRef.current) {
      setPendingAutoStart(false);
      autoStartTimer.current = setTimeout(() => {
        const btn = gameContainerRef.current?.querySelector("button:not([disabled])") as HTMLButtonElement;
        if (btn) btn.click();
      }, 120);
    }
    return () => { if (autoStartTimer.current) clearTimeout(autoStartTimer.current); };
  }, [pendingAutoStart, isPlaying, starting, showBetScreen]);

  function openBetScreen() {
    if (result) {
      setGameKey(k => k + 1);
      setPendingAutoStart(true);
    }
    setShowBetScreen(true);
    setResult(null);
    setError("");
    setCrowdMood("hype");
    setViewerCount(v => v + Math.floor(Math.random() * 20) + 5);
    addChatMessage({ id: Date.now(), name: "", text: "🎲 New game starting — place your bets!", type: "system", timestamp: Date.now() });
  }

  function selectBetAndStart(amount: number) {
    setSelectedBet(amount);
    setShowBetScreen(false);

    // NPC reactions to the bet
    if (amount > 0) {
      const bettors = generateNpcBettors(amount);
      setNpcBettors(bettors);
      bettors.slice(0, 3).forEach((_, i) => {
        setTimeout(() => addChatMessage(generateBetMessage(amount)), i * 600);
      });
    } else {
      setNpcBettors(generateNpcBettors(0));
    }

    setTimeout(() => {
      addChatMessage(generateStartMessage());
      addChatMessage(generateStartMessage());
    }, 800);

    setCrowdMood("tense");
    startGame(amount);
  }

  async function startGame(betAmount = 0) {
    setStarting(true);
    setError("");
    setResult(null);
    gameWonRef.current = null;
    play("click");

    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug, betAmount }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) {
          setError("Please login to play!");
        } else {
          setError(data.error || "Failed to start game");
        }
        play("error");
        setStarting(false);
        setCrowdMood("idle");
        setPendingAutoStart(false);
        return;
      }

      const data = await res.json();
      tokenRef.current = data.token;
      setGameToken(data.token);
      initGameRng(data.seed);
      setIsPlaying(true);
    } catch {
      setError("Network error. Please try again.");
      play("error");
      setCrowdMood("idle");
      setPendingAutoStart(false);
    } finally {
      setStarting(false);
    }
  }

  async function onGameComplete({ score, won }: GameResult) {
    setIsPlaying(false);
    resetGameRng();
    gameWonRef.current = won;

    const token = tokenRef.current;
    tokenRef.current = null;
    setGameToken(null);

    // Crowd reactions
    if (won) {
      setCrowdMood("wild");
      for (let i = 0; i < 4; i++) {
        setTimeout(() => addChatMessage(generateWinReaction()), i * 400);
        setTimeout(() => spawnFloatingEmote(["🔥", "🏆", "💰", "🎉"][i]), i * 300);
      }
    } else {
      setCrowdMood("sad");
      for (let i = 0; i < 3; i++) {
        setTimeout(() => addChatMessage(generateLoseReaction()), i * 500);
      }
      setTimeout(() => spawnFloatingEmote("💀"), 200);
    }

    if (!token) {
      setError("No active game session");
      play("error");
      return;
    }

    try {
      const res = await fetch("/api/game/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug, score, won, token }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) {
          setError("Please login to earn points!");
        } else {
          setError(data.error || "Failed to save game");
        }
        play("error");
        return;
      }

      const data = await res.json();
      setResult(data);
      setCooldown(data.cooldown || 8);

      if (data.won) {
        play("win");
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        play("coin");
      }

      if (data.leveledUp) {
        setTimeout(() => play("levelup"), 500);
        showToast(`Level Up! You're now ${data.levelName}!`, "⭐", "achievement");
      }

      if (data.newAchievements?.length > 0) {
        data.newAchievements.forEach((id: string) => {
          const ach = ACHIEVEMENTS.find((a: { id: string }) => a.id === id);
          if (ach) {
            setTimeout(() => {
              play("streak");
              showToast(`Achievement: ${ach.name}`, ach.icon, "achievement");
            }, 800);
          }
        });
      }
    } catch {
      setError("Failed to save game result");
      play("error");
    }
  }

  const handleStartGame = () => {
    if (isPlaying) return;
    openBetScreen();
  };

  const moodGlow = {
    idle: "",
    hype: "ring-1 ring-yellow-500/20",
    tense: "ring-1 ring-blue-500/20",
    wild: "ring-2 ring-green-400/30 shadow-lg shadow-green-400/10",
    sad: "ring-1 ring-red-500/20",
  };

  return (
    <>
      <ParticleBackground />
      <Confetti active={showConfetti} />

      {/* Floating emotes */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingEmotes.map(e => (
          <div
            key={e.id}
            className="absolute text-2xl animate-bounce"
            style={{
              left: `${e.x}%`,
              bottom: 0,
              animation: "floatUp 2s ease-out forwards",
            }}
          >
            {e.emoji}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-300px) scale(0.5); opacity: 0; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        <div className="mb-6">
          <Link href="/games" className="text-gray-500 hover:text-white text-sm transition inline-flex items-center gap-1">
            ← Back to Games
          </Link>
        </div>

        <div className={`glass rounded-2xl overflow-hidden transition-all duration-500 ${moodGlow[crowdMood]}`}>
          {/* Header with viewer count */}
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{gameIcon}</span>
              <div>
                <h1 className="text-xl font-black">{gameName}</h1>
                {GAME_INSTRUCTIONS[gameSlug] && (
                  <HowToPlay
                    gameName={gameName}
                    gameIcon={gameIcon}
                    steps={GAME_INSTRUCTIONS[gameSlug].steps}
                    tips={GAME_INSTRUCTIONS[gameSlug].tips}
                    maxPoints={GAMES.find(g => g.slug === gameSlug)?.maxPoints ?? 0}
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[11px] text-red-400 font-bold">{viewerCount}</span>
                <span className="text-[10px] text-gray-500">watching</span>
              </div>
              {cooldown > 0 && !isPlaying && (
                <div className="text-xs text-gray-500 bg-gray-800 px-3 py-1.5 rounded-full">
                  <span className="text-yellow-400 font-bold">{cooldown}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="px-5 py-1 bg-gray-900/50 border-b border-white/5 flex items-center justify-center gap-2">
            <span className="text-[9px] text-gray-600">16+ | For entertainment only | No real money wagered | Play-to-earn rewards</span>
          </div>

          {/* Bet selection screen */}
          {showBetScreen && (
            <div className="p-6 animate-slide-up">
              <div className="text-center mb-4">
                <div className="text-sm text-gray-400 mb-1">Place Your Bet</div>
                <div className="text-xs text-gray-600">Higher bets = bigger win multiplier. Lose = forfeit 33% of bet.</div>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-4">
                {BET_TIERS.map((tier) => (
                  <button
                    key={tier.amount}
                    onClick={() => selectBetAndStart(tier.amount)}
                    className={`relative p-3 rounded-xl border-2 transition-all hover:scale-105 group ${
                      selectedBet === tier.amount
                        ? "border-yellow-400 bg-yellow-400/10"
                        : "border-white/10 hover:border-white/30 bg-gray-800/50"
                    }`}
                  >
                    <div className="text-xl mb-1">{tier.icon}</div>
                    <div className="text-[10px] font-bold text-white">{tier.amount === 0 ? "FREE" : tier.amount}</div>
                    <div className={`text-[9px] font-bold ${tier.textColor}`}>{tier.multiplier}</div>
                    <div className="text-[8px] text-gray-600 mt-0.5">{tier.label}</div>
                  </button>
                ))}
              </div>

              {/* NPC bettors hype */}
              <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500">
                <span>🎰 {3 + Math.floor(Math.random() * 5)} players betting on this table</span>
                <span>•</span>
                <span>🔥 {Math.floor(Math.random() * 500) + 200} coins in the pot</span>
              </div>
            </div>
          )}

          {/* Active bet indicator */}
          {(isPlaying || result) && selectedBet > 0 && (
            <div className="px-5 py-1.5 bg-gradient-to-r from-yellow-500/5 via-transparent to-yellow-500/5 border-b border-white/5 flex items-center justify-center gap-2">
              <span className="text-[10px] text-gray-500">Your bet:</span>
              <span className="text-xs font-black text-yellow-400">{selectedBet} coins</span>
              <span className="text-[10px] text-gray-600">•</span>
              <span className="text-[10px] text-gray-500">Win multiplier:</span>
              <span className="text-xs font-bold text-green-400">{BET_TIERS.find(t => t.amount === selectedBet)?.multiplier}</span>
            </div>
          )}

          {/* NPC side bets bar */}
          {npcBettors.length > 0 && (isPlaying || result) && (
            <NpcBettorsBar bettors={npcBettors} won={gameWonRef.current} />
          )}

          {/* Game area */}
          <div className="p-6">
            {starting && (
              <div className="text-center py-8">
                <div className="text-2xl animate-spin inline-block mb-3">🎲</div>
                <div className="text-gray-400 text-sm">Setting up your game...</div>
                {selectedBet > 0 && (
                  <div className="text-xs text-yellow-400 mt-2 animate-pulse">
                    {selectedBet} coins on the line...
                  </div>
                )}
              </div>
            )}
            {!starting && !showBetScreen && (
              <div ref={gameContainerRef} key={gameKey}>
                {children({ onGameComplete, isPlaying, startGame: handleStartGame })}
              </div>
            )}
          </div>

          {/* Result panel */}
          {result && (
            <div className={`p-6 border-t border-white/5 animate-slide-up ${
              result.won
                ? "bg-gradient-to-r from-green-400/10 via-yellow-400/5 to-green-400/10"
                : result.betAmount > 0
                ? "bg-gradient-to-r from-red-400/10 via-transparent to-red-400/10"
                : "bg-gradient-to-r from-yellow-400/5 via-transparent to-orange-400/5"
            }`}>
              <div className="text-center">
                {result.leveledUp && (
                  <div className="mb-4">
                    <div className="text-3xl font-black text-yellow-400 animate-bounce mb-1">LEVEL UP!</div>
                    <div className="text-gray-400">You are now <span className="text-yellow-400 font-bold">{result.levelName}</span>!</div>
                  </div>
                )}

                {/* Win/Loss with bet info */}
                {result.won ? (
                  <div className="mb-4">
                    {result.betAmount > 0 && (
                      <div className="text-xs text-green-400/70 mb-1">
                        🎰 {result.betAmount} coin bet × {BET_TIERS.find(t => t.amount === result.betAmount)?.multiplier} multiplier
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-8">
                      <div className="animate-count-up">
                        <div className="text-3xl font-black text-yellow-400">+{result.pointsEarned}</div>
                        <div className="text-xs text-gray-500 mt-1">Points Won</div>
                      </div>
                      <div className="w-px h-10 bg-gray-700" />
                      <div className="animate-count-up" style={{ animationDelay: "0.2s" }}>
                        <div className="text-3xl font-black text-cyan-400">+{result.xpGained}</div>
                        <div className="text-xs text-gray-500 mt-1">XP</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    {result.betAmount > 0 ? (
                      <>
                        <div className="text-red-400 font-black text-lg mb-1">Game Lost</div>
                        <div className="text-2xl font-black text-red-400">-{result.betLoss} coins</div>
                        <div className="text-xs text-gray-500 mt-1">Lost 33% of your {result.betAmount} bet</div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center gap-8">
                        <div className="animate-count-up">
                          <div className="text-3xl font-black text-yellow-400">+{result.pointsEarned}</div>
                          <div className="text-xs text-gray-500 mt-1">Points</div>
                        </div>
                        <div className="w-px h-10 bg-gray-700" />
                        <div className="animate-count-up" style={{ animationDelay: "0.2s" }}>
                          <div className="text-3xl font-black text-cyan-400">+{result.xpGained}</div>
                          <div className="text-xs text-gray-500 mt-1">XP</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleStartGame}
                    disabled={cooldown > 0 || starting}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 transition shadow-lg shadow-orange-500/20 disabled:opacity-50"
                  >
                    {cooldown > 0 ? `Wait ${cooldown}s` : "Play Again"}
                  </button>
                  {result.won && (
                    <ShareWinMenu
                      gameName={gameName}
                      gameIcon={gameIcon}
                      pointsEarned={result.pointsEarned}
                      onShare={() => play("coin")}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 border-t border-white/5">
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 text-center">
                {error}{" "}
                {error.includes("login") && (
                  <Link href="/login" className="underline font-bold ml-1">Login here</Link>
                )}
                {error.includes("Insufficient") && (
                  <span className="block mt-1 text-xs text-gray-500">Try a smaller bet or play for free!</span>
                )}
              </div>
            </div>
          )}

          {/* Live crowd chat */}
          <div className="border-t border-white/5">
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900/50">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-600">💬 Live Chat</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  crowdMood === "wild" ? "bg-green-400 animate-pulse" :
                  crowdMood === "hype" ? "bg-yellow-400 animate-pulse" :
                  crowdMood === "tense" ? "bg-blue-400 animate-pulse" :
                  crowdMood === "sad" ? "bg-red-400" :
                  "bg-gray-600"
                }`} />
                <span className="text-[9px] text-gray-600 capitalize">{crowdMood}</span>
              </div>
            </div>
            <LiveChat messages={chatMessages} />
          </div>
        </div>

        <AdBanner slot="game-interstitial" className="mt-6" />
      </div>
    </>
  );
}
