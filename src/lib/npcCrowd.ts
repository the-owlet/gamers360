const FIRST_NAMES = [
  "Blaze", "Luna", "Ace", "Nova", "Kai", "Zara", "Rex", "Mika", "Jett", "Cleo",
  "Dash", "Rune", "Ivy", "Storm", "Cruz", "Nyx", "Sage", "Vex", "Echo", "Finn",
  "Riot", "Kira", "Ajax", "Suki", "Bolt", "Zion", "Aria", "Onyx", "Jade", "Cash",
  "Lux", "Pike", "Wren", "Taz", "Sly", "Dex", "Faye", "Odin", "Yuki", "Knox",
];

const TAGS = [
  "360", "Pro", "YT", "TV", "x", "_gg", "FN", "Boss", "King", "Queen",
  "Jr", "OG", "VIP", "TTV", "Goat", "MVP", "Lit", "Ice", "God", "Wave",
];

export function generateNpcName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const tag = TAGS[Math.floor(Math.random() * TAGS.length)];
  const num = Math.random() < 0.5 ? Math.floor(Math.random() * 99) : "";
  return `${first}${tag}${num}`;
}

export function generateViewerCount(): number {
  return Math.floor(Math.random() * 180) + 20;
}

const IDLE_MESSAGES = [
  "waiting for the next game 👀",
  "let's goooo",
  "who's betting big?",
  "this player is cracked 🔥",
  "I got 50 on this one",
  "free money if they win lol",
  "last game was insane",
  "gg last round",
  "anyone else watching?",
  "🍿🍿🍿",
  "bout to be crazy",
  "what's the play?",
];

const BET_REACTIONS = [
  (name: string, amt: number) => `${name} bet ${amt} coins! 💰`,
  (name: string, amt: number) => `${name} dropped ${amt} on this 🔥`,
  (name: string, amt: number) => `${name} is going ${amt >= 50 ? "ALL IN" : "in"} with ${amt}!`,
  (name: string, amt: number) => `${amt} coins from ${name}! ${amt >= 100 ? "👑" : "🪙"}`,
];

const START_MESSAGES = [
  "here we go! 🎮",
  "LET'S GO!!!",
  "this is it 🔥",
  "clutch time",
  "don't choke 😂",
  "easy dub incoming",
  "I believe 🙏",
  "watch this",
  "big play energy ⚡",
  "LESSGOOO",
];

const WIN_REACTIONS = [
  "WWWWW 🏆",
  "LETSGOOOO 🔥🔥🔥",
  "called it! easy money",
  "PAY UP 💰💰",
  "that was clean 🧹",
  "NO WAY they hit that",
  "GG WP 👏",
  "SHEEEESH 🥶",
  "absolute legend",
  "my coins 📈📈",
  "CLUTCH GOD",
  "I KNEW IT 🧠",
  "winner winner 🍗",
  "they're different fr",
];

const LOSE_REACTIONS = [
  "oof 💀",
  "noooo my coins 😭",
  "that hurts",
  "unlucky fr",
  "pain. just pain.",
  "there goes my bet lol",
  "RIP 🪦",
  "next time for sure",
  "so close tho",
  "I felt that 😔",
  "down bad",
  "it's rigged /s",
  "the house always wins smh",
  "better luck next game",
];

const MID_GAME_MESSAGES = [
  "oh this is getting intense",
  "👀👀👀",
  "hold on...",
  "wait for it...",
  "no way",
  "this could go either way",
  "I'm sweating 😅",
  "come onnn",
  "stay focused!",
  "the pressure 🫣",
  "clutch or kick",
  "📈 or 📉?",
];

const EMOTE_REACTIONS = ["🔥", "👀", "💀", "😂", "🤯", "👑", "🎯", "⚡", "🫡", "🙏"];

export interface CrowdMessage {
  id: number;
  name: string;
  text: string;
  type: "chat" | "bet" | "reaction" | "emote" | "system";
  timestamp: number;
}

let msgId = 0;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateIdleMessage(): CrowdMessage {
  return {
    id: ++msgId,
    name: generateNpcName(),
    text: pick(IDLE_MESSAGES),
    type: "chat",
    timestamp: Date.now(),
  };
}

export function generateBetMessage(playerBet: number): CrowdMessage {
  const name = generateNpcName();
  const npcBet = [10, 25, 25, 50, 50, 100][Math.floor(Math.random() * 6)];
  const template = pick(BET_REACTIONS);
  return {
    id: ++msgId,
    name,
    text: template(name, npcBet),
    type: "bet",
    timestamp: Date.now(),
  };
}

export function generateStartMessage(): CrowdMessage {
  return {
    id: ++msgId,
    name: generateNpcName(),
    text: pick(START_MESSAGES),
    type: "chat",
    timestamp: Date.now(),
  };
}

export function generateWinReaction(): CrowdMessage {
  return {
    id: ++msgId,
    name: generateNpcName(),
    text: pick(WIN_REACTIONS),
    type: "reaction",
    timestamp: Date.now(),
  };
}

export function generateLoseReaction(): CrowdMessage {
  return {
    id: ++msgId,
    name: generateNpcName(),
    text: pick(LOSE_REACTIONS),
    type: "reaction",
    timestamp: Date.now(),
  };
}

export function generateMidGameMessage(): CrowdMessage {
  return {
    id: ++msgId,
    name: generateNpcName(),
    text: pick(MID_GAME_MESSAGES),
    type: "chat",
    timestamp: Date.now(),
  };
}

export function generateEmoteReaction(): CrowdMessage {
  return {
    id: ++msgId,
    name: generateNpcName(),
    text: pick(EMOTE_REACTIONS),
    type: "emote",
    timestamp: Date.now(),
  };
}

export function generateNpcBettors(playerBet: number): { name: string; amount: number; forPlayer: boolean }[] {
  const count = 3 + Math.floor(Math.random() * 5);
  const bettors: { name: string; amount: number; forPlayer: boolean }[] = [];
  for (let i = 0; i < count; i++) {
    const forPlayer = Math.random() < 0.6;
    const amounts = [10, 10, 25, 25, 50, 50, 100];
    bettors.push({
      name: generateNpcName(),
      amount: amounts[Math.floor(Math.random() * amounts.length)],
      forPlayer,
    });
  }
  return bettors;
}
