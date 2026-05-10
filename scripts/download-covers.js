const https = require("https");
const fs = require("fs");
const path = require("path");

const API_KEY = process.env.PIXABAY_KEY || process.argv[2];
if (!API_KEY) {
  console.error("Usage: node scripts/download-covers.js YOUR_KEY");
  process.exit(1);
}

const outDir = path.join(__dirname, "..", "public", "games", "covers");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const games = [
  { slug: "memory-matrix",    q: "brain puzzle game neon" },
  { slug: "math-blitz",       q: "mathematics calculator numbers" },
  { slug: "naija-runner",     q: "running game character" },
  { slug: "jollof-wars",      q: "cooking game food" },
  { slug: "treasure-hunter",  q: "treasure chest gold coins" },
  { slug: "beat-drop",        q: "music headphones dj neon" },
  { slug: "escape-room",      q: "lock key escape mystery" },
  { slug: "code-breaker",     q: "hacker code digital matrix" },
  { slug: "naija-trivia",     q: "quiz question mark game" },
  { slug: "typing-race",      q: "keyboard computer typing" },
  { slug: "speed-tap",        q: "lightning bolt energy speed" },
  { slug: "reaction-rush",    q: "speed fast lightning timer" },
  { slug: "pattern-recall",   q: "geometric pattern neon abstract" },
  { slug: "word-scramble",    q: "alphabet letters word game" },
  { slug: "color-sequence",   q: "rainbow colors neon abstract" },
  { slug: "emoji-match",      q: "emoji smiley face game" },
  { slug: "whack-a-mole",     q: "arcade game retro fun" },
  { slug: "tower-stack",      q: "tower blocks building game" },
  { slug: "suya-stack",       q: "barbecue grill food fire" },
  { slug: "afro-beats",       q: "music drums beat rhythm" },
  { slug: "pidgin-puzzle",    q: "jigsaw puzzle pieces game" },
  { slug: "number-memory",    q: "numbers digits brain memory" },
  { slug: "emoji-chain",      q: "chain link connection game" },
  { slug: "aim-trainer",      q: "target crosshair bullseye aim" },
  { slug: "arrow-dash",       q: "arrow direction game neon" },
  { slug: "color-spy",        q: "magnifying glass detective search" },
  { slug: "rapid-fire",       q: "fire flames explosion game" },
  { slug: "market-rush",      q: "shopping cart market store" },
  { slug: "flag-quiz",        q: "world flags globe countries" },
  { slug: "shadow-match",     q: "shadow silhouette dark mystery" },
  { slug: "sequence-surge",   q: "sequence pattern digital tech" },
  { slug: "speed-sort",       q: "sorting organize categories" },
  { slug: "snap-match",       q: "playing cards game match" },
  { slug: "odd-one-out",      q: "different unique standout game" },
  { slug: "grid-fill",        q: "grid blocks puzzle tetris" },
  { slug: "reflex-test",      q: "reflex reaction speed timer" },
  { slug: "mirror-draw",      q: "mirror reflection symmetry" },
  { slug: "bubble-pop",       q: "bubbles colorful pop game" },
  { slug: "cargo-sort",       q: "cargo boxes container shipping" },
  { slug: "path-finder",      q: "maze labyrinth path puzzle" },
  { slug: "connect-dots",     q: "constellation stars connect dots" },
  { slug: "quick-switch",     q: "switch toggle button speed" },
  { slug: "word-chain",       q: "word letters chain link" },
  { slug: "math-grid",        q: "math numbers grid puzzle" },
  { slug: "emoji-decoder",    q: "decode cipher secret code" },
  { slug: "tile-slide",       q: "sliding puzzle tiles game" },
  { slug: "memory-sprint",    q: "brain memory speed game" },
  { slug: "rhythm-tap",       q: "music rhythm beat neon" },
  { slug: "color-flood",      q: "paint splash color flood" },
  { slug: "digit-dash",       q: "digits numbers speed race" },
  { slug: "word-hunt",        q: "word search magnifying glass" },
  { slug: "reaction-chain",   q: "chain reaction domino effect" },
];

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const follow = (url, redirects = 0) => {
      if (redirects > 5) return reject(new Error("Too many redirects"));
      const mod = url.startsWith("https") ? https : require("http");
      mod.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return follow(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
      }).on("error", reject);
    };
    follow(url);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (url, redirects = 0) => {
      if (redirects > 5) return reject(new Error("Too many redirects"));
      const mod = url.startsWith("https") ? https : require("http");
      mod.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let loc = res.headers.location;
          if (loc.startsWith("/")) { const u = new URL(url); loc = u.origin + loc; }
          return follow(loc, redirects + 1);
        }
        if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on("finish", () => { file.close(); resolve(); });
      }).on("error", reject);
    };
    follow(url);
  });
}

async function searchPixabay(query, imageType = "illustration") {
  const q = encodeURIComponent(query);
  const url = `https://pixabay.com/api/?key=${API_KEY}&q=${q}&image_type=${imageType}&orientation=vertical&min_width=300&min_height=400&per_page=10&safesearch=true`;
  const data = await fetchJSON(url);
  return data.hits || [];
}

async function run() {
  // Clear old covers
  const existing = fs.readdirSync(outDir);
  for (const f of existing) {
    if (f.endsWith(".jpg") || f.endsWith(".svg")) fs.unlinkSync(path.join(outDir, f));
  }
  console.log(`Cleared ${existing.length} old covers\n`);

  let ok = 0, fail = 0;
  for (const game of games) {
    const dest = path.join(outDir, `${game.slug}.jpg`);

    try {
      // Try illustration first
      let hits = await searchPixabay(game.q, "illustration");

      // Fallback to vector art
      if (hits.length === 0) {
        hits = await searchPixabay(game.q, "vector");
      }

      // Fallback to simpler query with illustration
      if (hits.length === 0) {
        const simpler = game.q.split(" ").slice(0, 2).join(" ");
        hits = await searchPixabay(simpler, "illustration");
      }

      // Last resort: photo
      if (hits.length === 0) {
        hits = await searchPixabay(game.q, "photo");
      }

      if (hits.length === 0) {
        console.log(`✗ ${game.slug}: no results`);
        fail++;
        continue;
      }

      // Pick best by engagement
      const best = hits.sort((a, b) => (b.likes + b.downloads) - (a.likes + a.downloads))[0];
      await downloadFile(best.webformatURL, dest);
      const sz = fs.statSync(dest).size;
      console.log(`✓ ${game.slug} (${Math.round(sz / 1024)}KB) [${best.type}] — "${game.q}"`);
      ok++;
    } catch (e) {
      console.log(`✗ ${game.slug}: ${e.message}`);
      fail++;
    }

    await new Promise((r) => setTimeout(r, 600));
  }
  console.log(`\nDone: ${ok} OK, ${fail} failed`);
}

run();
