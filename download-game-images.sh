#!/bin/bash
DIR="/c/Users/oluse/GAMERS 360/gamers360/public/games"
BASE="https://image.pollinations.ai/prompt"
W=400
H=500
COUNT=0

download() {
  local slug="$1"
  local prompt="$2"

  # Skip if already downloaded successfully (>5KB = real image)
  if [ -f "$DIR/$slug.jpg" ] && [ $(stat -c%s "$DIR/$slug.jpg" 2>/dev/null || echo 0) -gt 5000 ]; then
    echo "SKIP: $slug (already exists)"
    return
  fi

  local encoded=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$prompt'))" 2>/dev/null || echo "$prompt" | sed 's/ /%20/g')

  echo -n "[$COUNT] $slug... "
  curl -L -s -o "$DIR/$slug.jpg" "$BASE/$encoded?width=$W&height=$H&nologo=true&seed=$((RANDOM + COUNT))" --max-time 60 2>/dev/null

  local size=$(stat -c%s "$DIR/$slug.jpg" 2>/dev/null || echo 0)
  if [ "$size" -gt 5000 ]; then
    echo "OK (${size} bytes)"
  else
    echo "FAIL (${size} bytes) - retrying..."
    sleep 3
    curl -L -s -o "$DIR/$slug.jpg" "$BASE/$encoded?width=$W&height=$H&nologo=true&seed=$((RANDOM + COUNT + 100))" --max-time 60 2>/dev/null
    size=$(stat -c%s "$DIR/$slug.jpg" 2>/dev/null || echo 0)
    echo "  Retry: ${size} bytes"
  fi
  COUNT=$((COUNT + 1))
  sleep 2
}

echo "=== Starting sequential downloads ==="

download "snake-ladders" "casino slot game art mystical green serpent golden ladder emerald background vibrant illustrated"
download "ludo-roll" "casino slot game art royal golden dice purple velvet kingdom crown vibrant illustrated"
download "rock-paper-scissors" "casino slot game art epic battle showdown fists clash red neon arena vibrant illustrated"
download "wheel-of-fortune" "casino slot game art golden fortune wheel spinning lights gold coins flying vibrant"
download "lucky-7" "casino slot game art lucky seven neon vegas dice red cherry slot machine vibrant"
download "bingo-blitz" "casino slot game art bingo card golden balls numbers pink neon vibrant illustrated"
download "treasure-map" "casino slot game art pirate treasure map gold coins compass adventure vibrant"
download "slots" "casino slot game art jackpot machine 777 gold coins raining dynasty vibrant illustrated"
download "higher-lower" "casino slot game art stock chart arrows teal neon trading risk vibrant illustrated"
download "plinko" "casino slot game art plinko board golden ball bouncing purple neon prize vibrant"
download "mine-field" "casino slot game art diamond gems emerald mine vault heist green vibrant illustrated"
download "crash" "casino slot game art rocket moon crash orange chart space stars vibrant illustrated"
download "scratch-card" "casino slot game art golden scratch card lottery ticket winning sparkle vibrant"
download "mystery-box" "casino slot game art glowing mystery box purple magic rays opening vibrant illustrated"
download "balloon-pop" "casino slot game art red balloon cash money flying pink explosion vibrant illustrated"
download "coin-flip" "casino slot game art golden coin flipping heads tails shining vibrant illustrated"
download "tower-climb" "casino slot game art tower reaching sky blue neon climbing adventure vibrant"
download "lucky-cards" "casino slot game art poker royal flush ace hearts chips green table vibrant"
download "treasure-dive" "casino slot game art underwater treasure chest gold fish ocean blue vibrant"
download "dice-battle" "casino slot game art dice battle crossed swords medieval throne dark vibrant"
download "lucky-roulette" "casino slot game art roulette wheel red black monte carlo luxury vibrant"
download "keno-draw" "casino slot game art keno lottery balls numbers blue purple neon vibrant"
download "lottery-pick" "casino slot game art mega millions lottery golden balls purple stars vibrant"
download "power-ball" "casino slot game art thunderball lightning bolt electric yellow power vibrant"
download "lucky-dice" "casino slot game art five dice rolling yahtzee combo green glow vibrant"
download "triple-sevens" "casino slot game art cherry bomb classic slot 777 fruits retro red vibrant"
download "golden-egg" "casino slot game art dragon egg cracking golden light fire fantasy vibrant"
download "lucky-envelope" "casino slot game art chinese red envelope lucky money gold fortune vibrant"
download "pirate-chest" "casino slot game art pirate treasure chest skull gold doubloons ocean vibrant"
download "gift-grab" "casino slot game art birthday gifts opening sparkle confetti purple magic vibrant"
download "lucky-star" "casino slot game art shooting stars golden sky night fantasy magical vibrant"
download "diamond-rush" "casino slot game art crystal diamond mine blue gems sparkling cavern vibrant"
download "hot-potato" "casino slot game art ticking bomb explosive orange red fire countdown vibrant"
download "ice-walk" "casino slot game art frozen ice bridge crystal blue winter dangerous vibrant"
download "bomb-defuser" "casino slot game art bomb wires mission impossible red timer dark vibrant"
download "rocket-launch" "casino slot game art spacex rocket launching purple space stars vibrant"
download "lightning-strike" "casino slot game art thor lightning bolt golden hammer storm purple vibrant"
download "ace-chase" "casino slot game art ace spades playing card hunting deck green vibrant"
download "color-match" "casino slot game art colorful cards matching pairs rainbow neon memory vibrant"
download "dice-duel" "casino slot game art street dice duel back alley neon orange vibrant illustrated"
download "war-cards" "casino slot game art card wars battle anime red explosion epic vibrant illustrated"
download "blackjack-luck" "casino slot game art blackjack 21 ace king green felt luxury vibrant"
download "raffle-draw" "casino slot game art golden ticket raffle draw factory purple magic vibrant"
download "number-crush" "casino slot game art numbers typhoon raining digits teal cascade vibrant"
download "lucky-wheel-mini" "casino slot game art quick spin wheel target bullseye pink neon vibrant"
download "fortune-cookie" "casino slot game art mystic fortune cookie golden cracking destiny vibrant"
download "lotto-scratch" "casino slot game art scratch card fever lottery winning green gold vibrant"
download "fish-catch" "casino slot game art ocean king golden fish underwater net treasure vibrant"
download "space-asteroid" "casino slot game art galaxy spaceship asteroid stars purple nebula vibrant"
download "gem-cascade" "casino slot game art infinity gems cascade jewels purple pink diamond vibrant"
download "dragon-fire" "casino slot game art fortune tiger golden dragon fire chinese red vibrant"
download "gold-rush" "casino slot game art el dorado gold rush mining pickaxe treasure vibrant"
download "neon-spin" "casino slot game art neon nights tokyo spin wheel purple pink city vibrant"
download "cash-claw" "casino slot game art claw machine grabbing money cash bills arcade vibrant"
download "pharaoh-tomb" "casino slot game art pharaoh gold pyramid egypt ancient tomb horus vibrant"
download "candy-pop" "casino slot game art candy matching sweets lollipop pink colorful vibrant"
download "wild-west" "casino slot game art wild west bounty hunter cowboy gunslinger sunset vibrant"
download "mega-wheel" "casino slot game art billionaire mega wheel purple gold luxury jackpot vibrant"
download "lucky-cat" "casino slot game art maneki neko golden lucky cat waving fortune red vibrant"
download "thunder-crash" "casino slot game art zeus lightning crash storm dark purple electric vibrant"
download "money-tree" "casino slot game art money tree cash garden falling dollars green vibrant"
download "zodiac-wheel" "casino slot game art zodiac fortune wheel astrology stars purple mystical vibrant"
download "ninja-blade" "casino slot game art shadow ninja warrior katana blade dark action vibrant"
download "treasure-vault" "casino slot game art vault door safe gold bars security metal vibrant"
download "lava-run" "casino slot game art volcano erupting lava escape fire red orange vibrant"
download "fruit-frenzy" "casino slot game art fruit fiesta slot watermelon cherry banana colorful vibrant"
download "deep-sea" "casino slot game art kraken deep sea octopus treasure pearls dark vibrant"
download "coin-tower" "casino slot game art golden coin tower stack rising money shining vibrant"
download "magic-lamp" "casino slot game art genie magic lamp wish golden smoke purple vibrant"
download "super-keno" "casino slot game art super keno lottery balls numbers blue neon vibrant"

echo ""
echo "=== Download complete ==="
GOOD=$(find "$DIR" -name "*.jpg" -size +5k | wc -l)
echo "$GOOD valid images downloaded"
