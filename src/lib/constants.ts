export const LEVELS = [
  { level: 1, name: "Rookie", xpRequired: 0, earningMultiplier: 1, color: "from-gray-400 to-gray-500" },
  { level: 2, name: "Player", xpRequired: 500, earningMultiplier: 1.2, color: "from-green-400 to-green-500" },
  { level: 3, name: "Gamer", xpRequired: 1500, earningMultiplier: 1.5, color: "from-blue-400 to-blue-500" },
  { level: 4, name: "Pro", xpRequired: 4000, earningMultiplier: 1.8, color: "from-purple-400 to-purple-500" },
  { level: 5, name: "Elite", xpRequired: 8000, earningMultiplier: 2.0, color: "from-yellow-400 to-yellow-500" },
  { level: 6, name: "Master", xpRequired: 15000, earningMultiplier: 2.5, color: "from-orange-400 to-orange-500" },
  { level: 7, name: "Legend", xpRequired: 30000, earningMultiplier: 3.0, color: "from-red-400 to-red-500" },
  { level: 8, name: "Champion", xpRequired: 60000, earningMultiplier: 3.5, color: "from-pink-400 to-pink-500" },
  { level: 9, name: "Titan", xpRequired: 100000, earningMultiplier: 4.0, color: "from-cyan-400 to-cyan-500" },
  { level: 10, name: "God", xpRequired: 200000, earningMultiplier: 5.0, color: "from-yellow-300 to-red-500" },
];

export const POINTS_PER_NAIRA = 10;
export const MIN_WITHDRAWAL_POINTS = 5000;
export const XP_PER_GAME = 10;
export const XP_PER_WIN = 25;
export const BASE_POINTS_PER_GAME = 5;
export const WIN_BONUS_POINTS = 20;

export function getLevelInfo(xp: number) {
  let currentLevel = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.xpRequired) {
      currentLevel = level;
    } else {
      break;
    }
  }
  const nextLevel = LEVELS.find((l) => l.level === currentLevel.level + 1);
  const xpToNext = nextLevel ? nextLevel.xpRequired - xp : 0;
  const progress = nextLevel
    ? ((xp - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100
    : 100;

  return { ...currentLevel, nextLevel, xpToNext, progress };
}

export type GameTag = "hot" | "brain" | "speed" | "adventure" | "naija" | "puzzle" | "reflex" | "classic";

export const GAME_CATEGORIES: { tag: GameTag; label: string; icon: string }[] = [
  { tag: "hot", label: "Hot Games", icon: "🔥" },
  { tag: "brain", label: "Brain Games", icon: "🧠" },
  { tag: "speed", label: "Speed Games", icon: "⚡" },
  { tag: "naija", label: "Naija Special", icon: "🇳🇬" },
  { tag: "puzzle", label: "Puzzle Games", icon: "🧩" },
  { tag: "reflex", label: "Reflex Games", icon: "🎯" },
  { tag: "adventure", label: "Adventure", icon: "🗺️" },
  { tag: "classic", label: "Classics", icon: "🎮" },
];

export const GAMES: {
  slug: string; name: string; description: string; icon: string; color: string;
  maxPoints: number; multiplier: string; category: string; tags: GameTag[];
  difficulty: string; playTime: string;
}[] = [
  // ========== SKILL GAMES ==========
  { slug: "memory-matrix", name: "Memory Matrix", description: "How sharp your brain be? Remember the pattern, cash out big! 🧠", icon: "🧠", color: "from-purple-500 to-indigo-700", maxPoints: 95, multiplier: "900X", category: "skill", tags: ["hot", "brain"], difficulty: "Medium", playTime: "2min" },
  { slug: "math-blitz", name: "Math Blitz", description: "Numbers dey fly! Solve am quick quick, streaks go make your score mad 🔥", icon: "🧮", color: "from-blue-500 to-cyan-600", maxPoints: 95, multiplier: "900X", category: "skill", tags: ["hot", "brain"], difficulty: "Medium", playTime: "1min" },
  { slug: "naija-runner", name: "Naija Runner", description: "Dodge danfo and okada for Lagos streets! Grab naira and suya as you run 🏃", icon: "🏃", color: "from-green-500 to-emerald-700", maxPoints: 95, multiplier: "900X", category: "skill", tags: ["hot", "speed", "adventure", "naija"], difficulty: "Medium", playTime: "1min" },
  { slug: "jollof-wars", name: "Jollof Wars", description: "You think you sabi cook? Memorize the ingredients, pick fast, don't burn am! 🍚", icon: "🍚", color: "from-orange-500 to-red-700", maxPoints: 95, multiplier: "900X", category: "skill", tags: ["hot", "brain", "adventure", "naija"], difficulty: "Medium", playTime: "2min" },
  { slug: "treasure-hunter", name: "Treasure Hunter", description: "5 floors of wahala — puzzles, traps, and one big boss at the top. You ready? 🏰", icon: "🏰", color: "from-amber-600 to-yellow-800", maxPoints: 95, multiplier: "950X", category: "skill", tags: ["hot", "brain", "adventure"], difficulty: "Hard", playTime: "2min" },
  { slug: "beat-drop", name: "Beat Drop", description: "Catch the beat as e drop! Build combos, vibe hard, score massive 🎵", icon: "🎵", color: "from-pink-500 to-purple-700", maxPoints: 95, multiplier: "900X", category: "skill", tags: ["hot", "speed"], difficulty: "Medium", playTime: "1min" },
  { slug: "escape-room", name: "Escape Room", description: "3 locked rooms, time dey go! Crack the codes or stay trapped forever 🔐", icon: "🔐", color: "from-red-600 to-rose-800", maxPoints: 95, multiplier: "950X", category: "skill", tags: ["hot", "brain", "adventure"], difficulty: "Hard", playTime: "1min" },
  { slug: "code-breaker", name: "Code Breaker", description: "Crack the 4-color code — green = right spot, yellow = wrong spot. Mastermind vibes! 🔓", icon: "🔓", color: "from-gray-600 to-slate-800", maxPoints: 95, multiplier: "900X", category: "skill", tags: ["hot", "puzzle", "brain"], difficulty: "Hard", playTime: "2min" },
  { slug: "naija-trivia", name: "Naija Trivia", description: "How well you know Naija? States, food, slang, history — prove yourself! 🇳🇬", icon: "🇳🇬", color: "from-green-600 to-green-800", maxPoints: 95, multiplier: "850X", category: "skill", tags: ["hot", "naija", "brain"], difficulty: "Medium", playTime: "1min" },
  { slug: "typing-race", name: "Typing Race", description: "Words dey fly — type am fast before time catch you! Speed fingers only ⌨️", icon: "⌨️", color: "from-cyan-500 to-blue-700", maxPoints: 95, multiplier: "850X", category: "skill", tags: ["hot", "speed"], difficulty: "Medium", playTime: "1min" },
  { slug: "speed-tap", name: "Speed Tap", description: "Tap the targets sharp sharp! Dodge the bombs, stack those combos ⚡", icon: "⚡", color: "from-yellow-500 to-orange-600", maxPoints: 90, multiplier: "800X", category: "skill", tags: ["hot", "speed", "reflex"], difficulty: "Easy", playTime: "1min" },
  { slug: "reaction-rush", name: "Reaction Rush", description: "Swerve bombs, grab coins — this lane runner no dey wait for anybody! 🏎️", icon: "🏎️", color: "from-red-500 to-orange-700", maxPoints: 90, multiplier: "800X", category: "skill", tags: ["hot", "speed"], difficulty: "Medium", playTime: "1min" },
  { slug: "pattern-recall", name: "Pattern Recall", description: "Watch the colors, play am back. Easy at first, then e go scatter your brain 🔮", icon: "🔮", color: "from-fuchsia-500 to-purple-700", maxPoints: 90, multiplier: "800X", category: "skill", tags: ["brain"], difficulty: "Medium", playTime: "2min" },
  { slug: "word-scramble", name: "Word Scramble", description: "Unscramble the word before time finish you! Longer words, bigger bags 📝", icon: "📝", color: "from-emerald-500 to-teal-600", maxPoints: 90, multiplier: "750X", category: "skill", tags: ["brain", "puzzle"], difficulty: "Medium", playTime: "1min" },
  { slug: "color-sequence", name: "Color Sequence", description: "The colors keep growing and the speed dey increase — how far you go reach? 🌈", icon: "🌈", color: "from-pink-500 to-violet-600", maxPoints: 90, multiplier: "800X", category: "skill", tags: ["brain", "speed"], difficulty: "Hard", playTime: "2min" },
  { slug: "emoji-match", name: "Emoji Match", description: "Flip the cards, find the pairs — your memory go decide your bag! 🃏", icon: "🃏", color: "from-indigo-500 to-purple-600", maxPoints: 90, multiplier: "800X", category: "skill", tags: ["hot", "brain"], difficulty: "Easy", playTime: "1min" },
  { slug: "whack-a-mole", name: "Whack-a-Mole", description: "Moles dey pop up everywhere — whack am fast but dodge the skulls! 🔨", icon: "🔨", color: "from-amber-500 to-orange-700", maxPoints: 90, multiplier: "800X", category: "skill", tags: ["hot", "speed", "reflex"], difficulty: "Easy", playTime: "1min" },
  { slug: "tower-stack", name: "Tower Stack", description: "Stack the blocks perfect — one wrong timing and your tower crumble! 🏗️", icon: "🏗️", color: "from-blue-500 to-indigo-700", maxPoints: 90, multiplier: "800X", category: "skill", tags: ["hot", "reflex"], difficulty: "Medium", playTime: "1min" },
  { slug: "suya-stack", name: "Suya Stack", description: "Stack the suya on the skewer — perfect drop = maximum points! 🥩", icon: "🥩", color: "from-orange-600 to-red-700", maxPoints: 90, multiplier: "800X", category: "skill", tags: ["hot", "naija", "reflex"], difficulty: "Medium", playTime: "1min" },
  { slug: "afro-beats", name: "Afro Beats Quiz", description: "You sabi Afrobeats? Guess the artist from the clues — only real fans pass! 🎶", icon: "🎶", color: "from-purple-500 to-pink-600", maxPoints: 90, multiplier: "800X", category: "skill", tags: ["hot", "naija", "brain"], difficulty: "Medium", playTime: "1min" },
  { slug: "pidgin-puzzle", name: "Pidgin Puzzle", description: "Complete the Pidgin sentence — you sabi talk or you go fail? 🗣️", icon: "🗣️", color: "from-green-500 to-yellow-500", maxPoints: 90, multiplier: "750X", category: "skill", tags: ["naija", "brain", "puzzle"], difficulty: "Easy", playTime: "1min" },
  { slug: "number-memory", name: "Number Memory", description: "See the number, remember am, type am back. Digits keep growing! 🔢", icon: "🔢", color: "from-teal-500 to-cyan-700", maxPoints: 90, multiplier: "750X", category: "skill", tags: ["brain"], difficulty: "Medium", playTime: "2min" },
  { slug: "emoji-chain", name: "Emoji Chain", description: "Chain dey grow — memorize the emojis in order or lose your mind! 🔗", icon: "🔗", color: "from-violet-500 to-fuchsia-600", maxPoints: 90, multiplier: "750X", category: "skill", tags: ["brain"], difficulty: "Medium", playTime: "2min" },
  { slug: "aim-trainer", name: "Aim Trainer", description: "Targets dey pop up — click am before dem vanish! Smaller = more points 🎯", icon: "🎯", color: "from-red-500 to-rose-700", maxPoints: 90, multiplier: "750X", category: "skill", tags: ["speed", "reflex"], difficulty: "Easy", playTime: "1min" },
  { slug: "arrow-dash", name: "Arrow Dash", description: "Arrow dey show — tap the right direction fast fast! Combos = bonus 💨", icon: "➡️", color: "from-blue-500 to-cyan-600", maxPoints: 90, multiplier: "750X", category: "skill", tags: ["speed", "reflex"], difficulty: "Easy", playTime: "1min" },
  { slug: "color-spy", name: "Color Spy", description: "One color different from the rest — spot am before time finish! 🎨", icon: "🎨", color: "from-pink-400 to-rose-600", maxPoints: 90, multiplier: "750X", category: "skill", tags: ["brain", "reflex"], difficulty: "Medium", playTime: "1min" },
  { slug: "rapid-fire", name: "Rapid Fire", description: "True or false? Answer sharp sharp — wrong answers go cost you! ⚡", icon: "⚡", color: "from-yellow-400 to-red-500", maxPoints: 90, multiplier: "750X", category: "skill", tags: ["speed", "brain"], difficulty: "Easy", playTime: "1min" },
  { slug: "market-rush", name: "Market Rush", description: "Mama send you market — buy the right items before time run out! 🛒", icon: "🛒", color: "from-green-500 to-emerald-700", maxPoints: 85, multiplier: "700X", category: "skill", tags: ["naija", "brain", "puzzle"], difficulty: "Medium", playTime: "1min" },
  { slug: "flag-quiz", name: "Flag Quiz", description: "See the flag, name the country — how well you sabi the world? 🏁", icon: "🏁", color: "from-blue-500 to-indigo-600", maxPoints: 85, multiplier: "700X", category: "skill", tags: ["brain"], difficulty: "Easy", playTime: "1min" },
  { slug: "shadow-match", name: "Shadow Match", description: "Match the shape to the right shadow — your eye must sharp well! 🔮", icon: "🔮", color: "from-gray-600 to-purple-800", maxPoints: 85, multiplier: "700X", category: "skill", tags: ["brain", "puzzle"], difficulty: "Easy", playTime: "1min" },
  { slug: "sequence-surge", name: "Sequence Surge", description: "What number comes next? Patterns dey — find am fast! 🔢", icon: "🔢", color: "from-cyan-500 to-blue-600", maxPoints: 85, multiplier: "700X", category: "skill", tags: ["brain", "puzzle"], difficulty: "Medium", playTime: "1min" },
  { slug: "speed-sort", name: "Speed Sort", description: "Numbers scattered — tap am from smallest to biggest sharp sharp! 📊", icon: "📊", color: "from-green-500 to-teal-600", maxPoints: 85, multiplier: "700X", category: "skill", tags: ["speed", "brain"], difficulty: "Easy", playTime: "1min" },
  { slug: "snap-match", name: "Snap Match", description: "Cards dey flip — SNAP when two match! Quick eye, quick hand ⚡", icon: "⚡", color: "from-yellow-500 to-amber-600", maxPoints: 85, multiplier: "700X", category: "skill", tags: ["speed", "reflex"], difficulty: "Easy", playTime: "1min" },
  { slug: "odd-one-out", name: "Odd One Out", description: "Grid of same emojis but one dey different — find am! 👁️", icon: "👁️", color: "from-emerald-500 to-green-700", maxPoints: 85, multiplier: "700X", category: "skill", tags: ["brain", "reflex"], difficulty: "Easy", playTime: "1min" },
  { slug: "grid-fill", name: "Grid Fill", description: "Fill the grid — no row or column fit repeat! Mini sudoku vibes 🧩", icon: "🧩", color: "from-indigo-500 to-blue-700", maxPoints: 85, multiplier: "700X", category: "skill", tags: ["puzzle", "brain"], difficulty: "Hard", playTime: "2min" },
  { slug: "reflex-test", name: "Reflex Test", description: "Wait for green... NOW! How fast your reflexes be? 🚦", icon: "🚦", color: "from-red-500 to-green-600", maxPoints: 85, multiplier: "700X", category: "skill", tags: ["reflex", "speed"], difficulty: "Easy", playTime: "1min" },
  { slug: "mirror-draw", name: "Mirror Draw", description: "See the pattern, recreate the mirror — your brain fit handle am? 🪞", icon: "🪞", color: "from-cyan-400 to-blue-600", maxPoints: 85, multiplier: "700X", category: "skill", tags: ["brain", "puzzle"], difficulty: "Medium", playTime: "2min" },
  { slug: "bubble-pop", name: "Bubble Pop", description: "Pop the bubbles in order — 1, 2, 3... wrong order = wahala! 🫧", icon: "🫧", color: "from-blue-400 to-purple-500", maxPoints: 85, multiplier: "700X", category: "skill", tags: ["speed", "brain"], difficulty: "Easy", playTime: "1min" },
  { slug: "cargo-sort", name: "Cargo Sort", description: "Colored boxes falling — sort am into the right bins fast fast! 📦", icon: "📦", color: "from-orange-500 to-red-600", maxPoints: 85, multiplier: "700X", category: "skill", tags: ["speed", "reflex"], difficulty: "Easy", playTime: "1min" },
  { slug: "path-finder", name: "Path Finder", description: "Find your way through the maze — wrong turn waste your time! 🗺️", icon: "🗺️", color: "from-green-600 to-emerald-800", maxPoints: 85, multiplier: "700X", category: "skill", tags: ["puzzle", "brain"], difficulty: "Medium", playTime: "1min" },
  { slug: "connect-dots", name: "Connect Dots", description: "Tap the dots in order — 1, 2, 3... simple but the pressure real! 🔵", icon: "🔵", color: "from-blue-500 to-indigo-600", maxPoints: 80, multiplier: "650X", category: "skill", tags: ["speed", "puzzle"], difficulty: "Easy", playTime: "1min" },
  { slug: "quick-switch", name: "Quick Switch", description: "Tasks dey switch — colors then numbers! Your brain fit keep up? 🔄", icon: "🔄", color: "from-purple-500 to-pink-600", maxPoints: 80, multiplier: "650X", category: "skill", tags: ["brain", "speed"], difficulty: "Hard", playTime: "1min" },
  // ── NEW: Batch 1 ──
  { slug: "word-chain", name: "Word Chain", description: "New word must start with the last letter — how long your chain go reach? 🔤", icon: "🔤", color: "from-emerald-500 to-green-700", maxPoints: 90, multiplier: "750X", category: "skill", tags: ["brain", "puzzle"], difficulty: "Medium", playTime: "1min" },
  { slug: "math-grid", name: "Math Grid", description: "Fill the grid so every row hits the target sum — maths on another level! 🔢", icon: "🔢", color: "from-blue-600 to-indigo-700", maxPoints: 90, multiplier: "800X", category: "skill", tags: ["brain", "puzzle"], difficulty: "Hard", playTime: "75s" },
  { slug: "emoji-decoder", name: "Emoji Decoder", description: "Decode the emoji sequence into the right phrase — your emoji IQ go show! 🧩", icon: "🧩", color: "from-pink-500 to-purple-600", maxPoints: 90, multiplier: "750X", category: "skill", tags: ["brain", "puzzle"], difficulty: "Easy", playTime: "1min" },
  { slug: "tile-slide", name: "Tile Slide", description: "Classic sliding puzzle — arrange the tiles in order before time catch you! 🧊", icon: "🧊", color: "from-cyan-500 to-blue-600", maxPoints: 90, multiplier: "800X", category: "skill", tags: ["puzzle", "brain"], difficulty: "Hard", playTime: "90s" },
  { slug: "memory-sprint", name: "Memory Sprint", description: "Items flash on screen — remember which ones you saw! Brain speed test 🏃", icon: "🏃", color: "from-violet-500 to-purple-700", maxPoints: 90, multiplier: "750X", category: "skill", tags: ["brain"], difficulty: "Medium", playTime: "1min" },
  // ── NEW: Batch 2 ──
  { slug: "rhythm-tap", name: "Rhythm Tap", description: "Watch the beat pattern, tap it back — your rhythm sharp? 🥁", icon: "🥁", color: "from-purple-500 to-pink-600", maxPoints: 90, multiplier: "750X", category: "skill", tags: ["reflex", "brain"], difficulty: "Medium", playTime: "70s" },
  { slug: "color-flood", name: "Color Flood", description: "Flood the grid one color at a time — can you clear it all? 🌊", icon: "🌊", color: "from-blue-500 to-teal-600", maxPoints: 90, multiplier: "750X", category: "skill", tags: ["puzzle", "brain"], difficulty: "Medium", playTime: "75s" },
  { slug: "digit-dash", name: "Digit Dash", description: "Mental math chain — keep the total in your head or lose am! 🔢", icon: "🔢", color: "from-orange-500 to-red-600", maxPoints: 90, multiplier: "750X", category: "skill", tags: ["brain", "speed"], difficulty: "Hard", playTime: "70s" },
  { slug: "word-hunt", name: "Word Hunt", description: "Hidden words in the grid — find am all before time finish! 🔍", icon: "🔍", color: "from-green-500 to-emerald-600", maxPoints: 85, multiplier: "700X", category: "skill", tags: ["brain", "puzzle"], difficulty: "Medium", playTime: "1min" },
  { slug: "reaction-chain", name: "Reaction Chain", description: "Click numbered circles in order — speed is everything! ⚡", icon: "⚡", color: "from-yellow-500 to-orange-600", maxPoints: 90, multiplier: "750X", category: "skill", tags: ["speed", "reflex"], difficulty: "Medium", playTime: "75s" },
];

export const ACHIEVEMENTS = [
  { id: "first_game", name: "First Steps", description: "Play your first game", icon: "🎮", xpReward: 50 },
  { id: "ten_games", name: "Getting Warmed Up", description: "Play 10 games", icon: "🔥", xpReward: 100 },
  { id: "fifty_games", name: "Hardcore Gamer", description: "Play 50 games", icon: "💪", xpReward: 250 },
  { id: "hundred_games", name: "Unstoppable", description: "Play 100 games", icon: "🏆", xpReward: 500 },
  { id: "first_win", name: "Winner!", description: "Win your first game", icon: "⭐", xpReward: 50 },
  { id: "ten_wins", name: "On a Roll", description: "Win 10 games", icon: "🎯", xpReward: 150 },
  { id: "streak_3", name: "Hot Streak", description: "3-day login streak", icon: "🔥", xpReward: 100 },
  { id: "streak_7", name: "Dedicated", description: "7-day login streak", icon: "💎", xpReward: 300 },
  { id: "streak_30", name: "Legendary", description: "30-day login streak", icon: "👑", xpReward: 1000 },
  { id: "level_5", name: "Going Pro", description: "Reach level 5", icon: "🌟", xpReward: 200 },
  { id: "level_10", name: "Ascended", description: "Reach level 10", icon: "⚡", xpReward: 1000 },
  { id: "first_withdrawal", name: "Ca$h Out", description: "Make your first withdrawal", icon: "💰", xpReward: 100 },
];
