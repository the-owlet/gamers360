#!/bin/bash
DIR="/c/Users/oluse/GAMERS 360/gamers360/public/games"
BASE="https://image.pollinations.ai/prompt"
SUCCESS=0
FAIL=0

dl() {
  local slug="$1"
  local prompt="$2"

  # Skip if already valid
  if [ -f "$DIR/$slug.jpg" ]; then
    local existing=$(stat -c%s "$DIR/$slug.jpg" 2>/dev/null || echo 0)
    if [ "$existing" -gt 5000 ]; then
      echo "SKIP: $slug (already ${existing}b)"
      SUCCESS=$((SUCCESS + 1))
      return
    fi
  fi

  local encoded=$(echo "$prompt" | sed 's/ /%20/g')
  echo -n "DL: $slug... "
  curl -L -s -o "$DIR/$slug.jpg" "$BASE/$encoded?width=400&height=500&nologo=true&seed=$((RANDOM))" --max-time 90 2>/dev/null

  local size=$(stat -c%s "$DIR/$slug.jpg" 2>/dev/null || echo 0)
  if [ "$size" -gt 5000 ]; then
    echo "OK (${size}b)"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "FAIL (${size}b)"
    FAIL=$((FAIL + 1))
  fi
  sleep 15
}

echo "=== Sequential download (15s gaps) ==="

dl "rock-paper-scissors" "casino slot game art epic battle showdown fists clash red neon arena vibrant"
dl "wheel-of-fortune" "casino slot game golden fortune wheel spinning bright lights coins vibrant art"
dl "lucky-7" "casino slot game lucky seven neon vegas dice red cherry vibrant art"
dl "bingo-blitz" "casino slot game bingo card golden balls numbers pink neon vibrant art"
dl "treasure-map" "casino slot game pirate treasure map gold coins compass adventure vibrant"
dl "slots" "casino slot game jackpot machine 777 gold coins dynasty vibrant art"
dl "higher-lower" "casino slot game stock chart arrows teal neon trading vibrant art"
dl "plinko" "casino slot game plinko board golden ball purple neon lights vibrant"
dl "mine-field" "casino slot game diamond gems emerald mine vault heist vibrant art"
dl "crash" "casino slot game rocket moon crash orange chart space vibrant art"
dl "scratch-card" "casino slot game golden scratch card lottery ticket sparkle vibrant"
dl "mystery-box" "casino slot game glowing mystery box purple magic rays vibrant art"
dl "balloon-pop" "casino slot game red balloon cash money flying pink vibrant art"
dl "coin-flip" "casino slot game golden coin flipping heads tails vibrant art"
dl "tower-climb" "casino slot game tower reaching sky blue neon lights vibrant art"
dl "lucky-cards" "casino slot game poker royal flush ace hearts chips vibrant art"
dl "treasure-dive" "casino slot game underwater treasure chest gold fish ocean vibrant"
dl "dice-battle" "casino slot game dice battle crossed swords medieval dark vibrant"
dl "lucky-roulette" "casino slot game roulette wheel red black luxury vibrant art"
dl "keno-draw" "casino slot game keno lottery balls numbers blue purple vibrant"
dl "lottery-pick" "casino slot game mega millions lottery golden balls vibrant art"
dl "power-ball" "casino slot game thunderball lightning bolt electric yellow vibrant"
dl "lucky-dice" "casino slot game five dice rolling yahtzee green glow vibrant"
dl "triple-sevens" "casino slot game cherry bomb classic slot 777 fruits red vibrant"
dl "golden-egg" "casino slot game dragon egg cracking golden light fire vibrant"
dl "lucky-envelope" "casino slot game chinese red envelope lucky money gold vibrant"
dl "pirate-chest" "casino slot game pirate treasure chest skull gold doubloons vibrant"
dl "gift-grab" "casino slot game birthday gifts opening sparkle confetti purple vibrant"
dl "lucky-star" "casino slot game shooting stars golden sky fantasy vibrant art"
dl "diamond-rush" "casino slot game crystal diamond mine blue gems sparkling vibrant"
dl "hot-potato" "casino slot game ticking bomb explosive orange fire vibrant art"
dl "ice-walk" "casino slot game frozen ice bridge crystal blue winter vibrant art"
dl "bomb-defuser" "casino slot game bomb with wires mission impossible timer vibrant"
dl "rocket-launch" "casino slot game spacex rocket launching purple space stars vibrant"
dl "lightning-strike" "casino slot game thor lightning bolt golden storm purple vibrant"
dl "ace-chase" "casino slot game ace spades playing card green casino vibrant"
dl "color-match" "casino slot game colorful cards matching rainbow neon vibrant art"
dl "dice-duel" "casino slot game street dice duel neon orange urban vibrant art"
dl "war-cards" "casino slot game card wars battle anime red explosion vibrant art"
dl "blackjack-luck" "casino slot game blackjack 21 ace king green felt vibrant art"
dl "raffle-draw" "casino slot game golden ticket raffle draw purple magic vibrant"
dl "number-crush" "casino slot game numbers typhoon raining digits teal vibrant art"
dl "lucky-wheel-mini" "casino slot game quick spin wheel target pink neon vibrant art"
dl "fortune-cookie" "casino slot game mystic fortune cookie golden cracking vibrant art"
dl "lotto-scratch" "casino slot game scratch fever lottery winning green gold vibrant"
dl "fish-catch" "casino slot game ocean king golden fish underwater net vibrant art"
dl "space-asteroid" "casino slot game galaxy spaceship asteroid stars purple vibrant art"
dl "gem-cascade" "casino slot game infinity gems cascade jewels purple pink vibrant"
dl "gold-rush" "casino slot game el dorado gold rush mining treasure vibrant art"
dl "neon-spin" "casino slot game neon nights tokyo spin wheel purple city vibrant"
dl "cash-claw" "casino slot game claw machine grabbing money cash arcade vibrant"
dl "pharaoh-tomb" "casino slot game pharaoh gold pyramid egypt ancient tomb vibrant"
dl "candy-pop" "casino slot game candy matching sweets lollipop pink vibrant art"
dl "wild-west" "casino slot game wild west bounty hunter cowboy sunset vibrant"
dl "mega-wheel" "casino slot game billionaire mega wheel purple gold luxury vibrant"
dl "lucky-cat" "casino slot game maneki neko golden lucky cat fortune red vibrant"
dl "thunder-crash" "casino slot game zeus lightning crash storm dark purple vibrant"
dl "money-tree" "casino slot game money tree cash garden falling dollars vibrant art"
dl "zodiac-wheel" "casino slot game zodiac fortune wheel astrology stars purple vibrant"
dl "ninja-blade" "casino slot game shadow ninja warrior katana blade dark vibrant art"
dl "treasure-vault" "casino slot game vault door safe gold bars security vibrant art"
dl "lava-run" "casino slot game volcano erupting lava escape fire red vibrant art"
dl "fruit-frenzy" "casino slot game fruit fiesta watermelon cherry banana vibrant art"
dl "deep-sea" "casino slot game kraken deep sea octopus treasure pearls vibrant"
dl "coin-tower" "casino slot game golden coin tower stack rising money vibrant art"
dl "magic-lamp" "casino slot game genie magic lamp wish golden smoke vibrant art"
dl "super-keno" "casino slot game super keno lottery balls numbers blue vibrant art"

echo ""
echo "=== DONE: $SUCCESS succeeded, $FAIL failed ==="
