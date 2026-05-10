const fs = require("fs");
const path = require("path");

const games = [
  { slug: "memory-matrix", c: ["#7c3aed","#2e1065","#a78bfa","#c4b5fd","#ddd6fe"], art: "matrix" },
  { slug: "math-blitz", c: ["#0ea5e9","#082f49","#38bdf8","#7dd3fc","#bae6fd"], art: "math" },
  { slug: "naija-runner", c: ["#22c55e","#052e16","#4ade80","#86efac","#bbf7d0"], art: "runner" },
  { slug: "jollof-wars", c: ["#f97316","#431407","#fb923c","#fdba74","#fed7aa"], art: "flames" },
  { slug: "treasure-hunter", c: ["#eab308","#422006","#facc15","#fde047","#fef08a"], art: "treasure" },
  { slug: "beat-drop", c: ["#d946ef","#4a044e","#e879f9","#f0abfc","#f5d0fe"], art: "equalizer" },
  { slug: "escape-room", c: ["#ef4444","#450a0a","#f87171","#fca5a5","#fecaca"], art: "lock" },
  { slug: "code-breaker", c: ["#06b6d4","#083344","#22d3ee","#67e8f9","#a5f3fc"], art: "code" },
  { slug: "naija-trivia", c: ["#22c55e","#052e16","#4ade80","#86efac","#bbf7d0"], art: "question" },
  { slug: "typing-race", c: ["#3b82f6","#172554","#60a5fa","#93c5fd","#bfdbfe"], art: "keyboard" },
  { slug: "speed-tap", c: ["#f59e0b","#451a03","#fbbf24","#fde047","#fef9c3"], art: "lightning" },
  { slug: "reaction-rush", c: ["#ef4444","#450a0a","#f87171","#fca5a5","#fecaca"], art: "speedlines" },
  { slug: "pattern-recall", c: ["#a855f7","#3b0764","#c084fc","#d8b4fe","#ede9fe"], art: "circles" },
  { slug: "word-scramble", c: ["#10b981","#022c22","#34d399","#6ee7b7","#a7f3d0"], art: "letters" },
  { slug: "color-sequence", c: ["#ec4899","#500724","#f472b6","#f9a8d4","#fbcfe8"], art: "colorwave" },
  { slug: "emoji-match", c: ["#f59e0b","#451a03","#fbbf24","#fde047","#fef9c3"], art: "cards" },
  { slug: "whack-a-mole", c: ["#84cc16","#1a2e05","#a3e635","#bef264","#d9f99d"], art: "holes" },
  { slug: "tower-stack", c: ["#3b82f6","#172554","#60a5fa","#93c5fd","#bfdbfe"], art: "tower" },
  { slug: "suya-stack", c: ["#ea580c","#431407","#fb923c","#fdba74","#fed7aa"], art: "flames" },
  { slug: "afro-beats", c: ["#d946ef","#4a044e","#e879f9","#f0abfc","#f5d0fe"], art: "equalizer" },
  { slug: "pidgin-puzzle", c: ["#eab308","#422006","#facc15","#fde047","#fef08a"], art: "puzzle" },
  { slug: "number-memory", c: ["#6366f1","#1e1b4b","#818cf8","#a5b4fc","#c7d2fe"], art: "digits" },
  { slug: "emoji-chain", c: ["#d946ef","#4a044e","#e879f9","#f0abfc","#f5d0fe"], art: "chain" },
  { slug: "aim-trainer", c: ["#ef4444","#450a0a","#f87171","#fca5a5","#fecaca"], art: "crosshair" },
  { slug: "arrow-dash", c: ["#8b5cf6","#2e1065","#a78bfa","#c4b5fd","#ddd6fe"], art: "arrows" },
  { slug: "color-spy", c: ["#a855f7","#3b0764","#c084fc","#d8b4fe","#ede9fe"], art: "eye" },
  { slug: "rapid-fire", c: ["#ef4444","#450a0a","#f87171","#fca5a5","#fecaca"], art: "explosion" },
  { slug: "market-rush", c: ["#22c55e","#052e16","#4ade80","#86efac","#bbf7d0"], art: "cart" },
  { slug: "flag-quiz", c: ["#3b82f6","#172554","#60a5fa","#93c5fd","#bfdbfe"], art: "globe" },
  { slug: "shadow-match", c: ["#6b7280","#111827","#9ca3af","#d1d5db","#e5e7eb"], art: "shadows" },
  { slug: "sequence-surge", c: ["#06b6d4","#083344","#22d3ee","#67e8f9","#a5f3fc"], art: "wave" },
  { slug: "speed-sort", c: ["#14b8a6","#042f2e","#2dd4bf","#5eead4","#99f6e4"], art: "bars" },
  { slug: "snap-match", c: ["#f97316","#431407","#fb923c","#fdba74","#fed7aa"], art: "cards" },
  { slug: "odd-one-out", c: ["#ec4899","#500724","#f472b6","#f9a8d4","#fbcfe8"], art: "eye" },
  { slug: "grid-fill", c: ["#10b981","#022c22","#34d399","#6ee7b7","#a7f3d0"], art: "gridSquares" },
  { slug: "reflex-test", c: ["#22c55e","#052e16","#4ade80","#86efac","#bbf7d0"], art: "lightning" },
  { slug: "mirror-draw", c: ["#06b6d4","#083344","#22d3ee","#67e8f9","#a5f3fc"], art: "mirror" },
  { slug: "bubble-pop", c: ["#f43f5e","#4c0519","#fb7185","#fda4af","#fecdd3"], art: "bubbles" },
  { slug: "cargo-sort", c: ["#f97316","#431407","#fb923c","#fdba74","#fed7aa"], art: "boxes" },
  { slug: "path-finder", c: ["#eab308","#422006","#facc15","#fde047","#fef08a"], art: "maze" },
  { slug: "connect-dots", c: ["#6366f1","#1e1b4b","#818cf8","#a5b4fc","#c7d2fe"], art: "constellation" },
  { slug: "quick-switch", c: ["#ef4444","#450a0a","#f87171","#fca5a5","#fecaca"], art: "switchArrows" },
  { slug: "word-chain", c: ["#10b981","#022c22","#34d399","#6ee7b7","#a7f3d0"], art: "chain" },
  { slug: "math-grid", c: ["#6366f1","#1e1b4b","#818cf8","#a5b4fc","#c7d2fe"], art: "math" },
  { slug: "emoji-decoder", c: ["#f59e0b","#451a03","#fbbf24","#fde047","#fef9c3"], art: "code" },
  { slug: "tile-slide", c: ["#14b8a6","#042f2e","#2dd4bf","#5eead4","#99f6e4"], art: "gridSquares" },
  { slug: "memory-sprint", c: ["#a855f7","#3b0764","#c084fc","#d8b4fe","#ede9fe"], art: "speedlines" },
  { slug: "rhythm-tap", c: ["#ec4899","#500724","#f472b6","#f9a8d4","#fbcfe8"], art: "equalizer" },
  { slug: "color-flood", c: ["#22c55e","#052e16","#4ade80","#86efac","#bbf7d0"], art: "colorwave" },
  { slug: "digit-dash", c: ["#06b6d4","#083344","#22d3ee","#67e8f9","#a5f3fc"], art: "digits" },
  { slug: "word-hunt", c: ["#eab308","#422006","#facc15","#fde047","#fef08a"], art: "magnifier" },
  { slug: "reaction-chain", c: ["#ef4444","#450a0a","#f87171","#fca5a5","#fecaca"], art: "explosion" },
];

function art(type, p, d, l1, l2, l3, i) {
  const s = (n) => ((i * 137 + n * 53) % 360);
  switch(type) {

case "matrix": {
  let r = '';
  for (let row = 0; row < 8; row++) for (let col = 0; col < 7; col++) {
    const x = 10 + col * 56, y = 10 + row * 60;
    const on = ((i*7+row*7+col)%3) !== 0;
    r += `<rect x="${x}" y="${y}" width="48" height="52" rx="8" fill="${on ? p : d}" opacity="${on ? 0.6 : 0.15}" stroke="${l1}" stroke-width="${on ? 2 : 0.5}" stroke-opacity="${on ? 0.7 : 0.15}"/>`;
    if (on) r += `<rect x="${x+8}" y="${y+8}" width="32" height="36" rx="4" fill="${l1}" opacity="0.15"/>`;
  }
  return r;
}

case "math": {
  const syms = ['+','−','×','÷','=','∑','π','%','√','∞','∫','≠','≥','±','Δ'];
  let r = '';
  for (let j = 0; j < 20; j++) {
    const x = (s(j*3) + j * 47) % 380 + 10;
    const y = (s(j*5) + j * 31) % 460 + 20;
    const sz = 30 + (j * 13) % 50;
    const rot = -40 + (j * 27) % 80;
    r += `<text x="${x}" y="${y}" font-family="Georgia,serif" font-size="${sz}" font-weight="bold" fill="${j%4===0?l1:j%4===1?p:j%4===2?l2:l3}" opacity="${0.15 + (j%5)*0.08}" transform="rotate(${rot} ${x} ${y})">${syms[j%syms.length]}</text>`;
  }
  return r;
}

case "runner": {
  // City skyline + road
  let r = '';
  const buildings = [[20,180,50],[80,120,40],[130,200,35],[175,90,55],[240,150,40],[290,100,50],[350,170,45]];
  buildings.forEach(([x,h,w],j) => {
    const y = 350 - h;
    r += `<rect x="${x}" y="${y}" width="${w}" height="${h+150}" rx="3" fill="${j%2===0?p:l1}" opacity="${0.25+j*0.04}"/>`;
    // windows
    for (let wr = 0; wr < Math.floor(h/25); wr++) for (let wc = 0; wc < Math.floor(w/15); wc++) {
      r += `<rect x="${x+5+wc*15}" y="${y+8+wr*25}" width="8" height="12" rx="1" fill="${l2}" opacity="${((wr+wc+j)%3===0)?0.5:0.1}"/>`;
    }
  });
  r += `<rect x="0" y="350" width="400" height="150" fill="${d}"/>`;
  r += `<rect x="0" y="348" width="400" height="4" fill="${p}" opacity="0.6"/>`;
  // road lines
  for (let j = 0; j < 8; j++) r += `<rect x="${20+j*55}" y="400" width="30" height="4" rx="2" fill="${l1}" opacity="0.3"/>`;
  // running figure silhouette
  r += `<g transform="translate(180,280) scale(1.8)" fill="${l1}" opacity="0.6">
    <circle cx="0" cy="-22" r="7"/><rect x="-5" y="-15" width="10" height="18" rx="3"/>
    <line x1="-3" y1="3" x2="-14" y2="22" stroke="${l1}" stroke-width="4" stroke-linecap="round"/>
    <line x1="3" y1="3" x2="16" y2="20" stroke="${l1}" stroke-width="4" stroke-linecap="round"/>
    <line x1="-5" y1="-10" x2="-20" y2="-2" stroke="${l1}" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="5" y1="-10" x2="16" y2="-20" stroke="${l1}" stroke-width="3.5" stroke-linecap="round"/>
  </g>`;
  return r;
}

case "flames": {
  let r = '';
  // Large background flames
  r += `<path d="M0 500 Q30 350 60 380 Q80 280 120 340 Q140 200 180 300 Q200 120 230 250 Q260 80 290 220 Q310 150 340 280 Q360 200 380 320 Q400 280 400 500 Z" fill="${p}" opacity="0.5"/>`;
  r += `<path d="M0 500 Q40 380 80 400 Q100 320 140 370 Q160 250 200 330 Q230 180 260 300 Q280 220 320 340 Q350 260 370 360 Q400 300 400 500 Z" fill="${l1}" opacity="0.35"/>`;
  r += `<path d="M30 500 Q60 400 100 420 Q130 340 170 390 Q200 280 240 360 Q270 300 300 380 Q340 320 370 400 Q400 370 400 500 Z" fill="${l2}" opacity="0.25"/>`;
  // Embers
  for (let j = 0; j < 25; j++) {
    const x = 20 + (s(j*3))%360, y = 30 + (s(j*7))%300;
    const sz = 2 + j%4;
    r += `<circle cx="${x}" cy="${y}" r="${sz}" fill="${j%3===0?l2:l1}" opacity="${0.2+j%5*0.1}"/>`;
  }
  return r;
}

case "treasure": {
  let r = '';
  // Mountains
  r += `<path d="M-20 350 L60 100 L100 180 L180 40 L260 180 L310 80 L400 300 L420 350 Z" fill="${p}" opacity="0.35"/>`;
  r += `<path d="M-20 350 L80 160 L140 230 L220 80 L300 220 L370 130 L420 350 Z" fill="${d}" opacity="0.5"/>`;
  // Snow caps
  r += `<path d="M170 40 L180 40 L195 75 L185 65 L175 80 L165 70 Z" fill="${l3}" opacity="0.5"/>`;
  // Stars
  for (let j = 0; j < 20; j++) {
    const x = 10+(s(j*9))%380, y = 10+(s(j*7))%120;
    r += `<circle cx="${x}" cy="${y}" r="${1+j%2}" fill="${l2}" opacity="${0.3+j%3*0.15}"/>`;
  }
  // Treasure chest
  r += `<g transform="translate(140,360)" opacity="0.7">
    <rect x="0" y="15" width="100" height="60" rx="6" fill="${p}" stroke="${l1}" stroke-width="2.5"/>
    <path d="M0 15 Q50 -10 100 15" fill="${p}" stroke="${l1}" stroke-width="2.5"/>
    <rect x="40" y="30" width="20" height="15" rx="4" fill="${l2}"/>
    <circle cx="50" cy="37" r="4" fill="${l1}"/>
  </g>`;
  // Coins
  for (let j = 0; j < 6; j++) {
    const cx = 120+(j*30)%160, cy = 430+(j*11)%30;
    r += `<circle cx="${cx}" cy="${cy}" r="10" fill="${l1}" opacity="0.5" stroke="${l2}" stroke-width="1.5"/>`;
  }
  return r;
}

case "equalizer": {
  let r = '';
  const heights = [45,90,65,130,100,155,80,140,50,120,95,160,70,135,110,150,60,125,85,145];
  for (let j = 0; j < 20; j++) {
    const x = 5 + j * 20;
    const h = heights[j] * 2.5;
    const y = 480 - h;
    const fill = j%4===0?p:j%4===1?l1:j%4===2?l2:l3;
    r += `<rect x="${x}" y="${y}" width="14" height="${h}" rx="5" fill="${fill}" opacity="${0.3 + (j%4)*0.1}"/>`;
    // Glow top
    r += `<circle cx="${x+7}" cy="${y}" r="5" fill="${l1}" opacity="0.15"/>`;
  }
  // Sound waves
  for (let j = 1; j <= 5; j++) {
    r += `<circle cx="200" cy="100" r="${30+j*40}" fill="none" stroke="${l2}" stroke-width="1.5" opacity="${0.06+j*0.02}" stroke-dasharray="8 12"/>`;
  }
  return r;
}

case "lock": {
  let r = '';
  // Large lock
  r += `<g transform="translate(120,80) scale(1.2)">
    <path d="M40 120 L40 70 A60 60 0 0 1 160 70 L160 120" fill="none" stroke="${l1}" stroke-width="12" stroke-linecap="round" opacity="0.5"/>
    <rect x="20" y="120" width="160" height="130" rx="16" fill="${p}" opacity="0.5" stroke="${l1}" stroke-width="3"/>
    <circle cx="100" cy="175" r="18" fill="${d}" stroke="${l1}" stroke-width="3"/>
    <rect x="94" y="185" width="12" height="30" rx="4" fill="${d}" stroke="${l1}" stroke-width="2"/>
  </g>`;
  // Warning stripes
  for (let j = 0; j < 12; j++) {
    r += `<rect x="${j*40-10}" y="380" width="20" height="120" fill="${p}" opacity="0.08" transform="skewX(-20)"/>`;
  }
  // Key particles
  for (let j = 0; j < 8; j++) {
    const x = 40+(s(j*9))%320, y = 350+(s(j*7))%100;
    r += `<circle cx="${x}" cy="${y}" r="${3+j%3}" fill="${l2}" opacity="0.15"/>`;
  }
  return r;
}

case "code": {
  let r = '';
  const chars = '01ABCDEF10CE47FA9B';
  for (let row = 0; row < 16; row++) for (let col = 0; col < 14; col++) {
    const x = 5 + col * 29, y = 18 + row * 30;
    const ch = chars[(i*3+row*14+col)%chars.length];
    const bright = ((row+col+i)%5) === 0;
    r += `<text x="${x}" y="${y}" font-family="'Courier New',monospace" font-size="20" font-weight="bold" fill="${bright?l1:p}" opacity="${bright?0.5:0.12}">${ch}</text>`;
  }
  // Scan line
  r += `<rect x="0" y="200" width="400" height="2" fill="${l1}" opacity="0.15"/>`;
  r += `<rect x="0" y="198" width="400" height="6" fill="${l1}" opacity="0.03"/>`;
  return r;
}

case "question": {
  let r = '';
  // Big question mark
  r += `<g transform="translate(130,60) scale(2.5)" opacity="0.5">
    <path d="M20 0 Q-5 0 -5 25 Q-5 45 20 55 L20 70" fill="none" stroke="${p}" stroke-width="14" stroke-linecap="round"/>
    <circle cx="20" cy="90" r="8" fill="${p}"/>
  </g>`;
  r += `<g transform="translate(134,64) scale(2.5)" opacity="0.3">
    <path d="M20 0 Q-5 0 -5 25 Q-5 45 20 55 L20 70" fill="none" stroke="${l1}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="20" cy="90" r="5" fill="${l1}"/>
  </g>`;
  // Small question marks scattered
  for (let j = 0; j < 8; j++) {
    const x = 20+(s(j*11))%360, y = 20+(s(j*17))%350;
    const sz = 20+j*5;
    r += `<text x="${x}" y="${y}" font-family="Impact,sans-serif" font-size="${sz}" fill="${l2}" opacity="${0.08+j*0.02}" transform="rotate(${-30+j*15} ${x} ${y})">?</text>`;
  }
  // Nigerian flag colors as accents
  r += `<rect x="20" y="420" width="100" height="6" rx="3" fill="#008751" opacity="0.3"/>`;
  r += `<rect x="140" y="420" width="100" height="6" rx="3" fill="white" opacity="0.15"/>`;
  r += `<rect x="260" y="420" width="100" height="6" rx="3" fill="#008751" opacity="0.3"/>`;
  return r;
}

case "keyboard": {
  let r = '';
  const rows = [10, 10, 9, 7];
  const rowOffset = [0, 12, 24, 60];
  for (let row = 0; row < 4; row++) {
    const count = rows[row];
    const off = rowOffset[row];
    for (let col = 0; col < count; col++) {
      const x = off + col * 38 + 5, y = 60 + row * 50;
      const bright = (row===1&&col===4)||(row===0&&(col===2||col===7))||(row===2&&col===6);
      r += `<rect x="${x}" y="${y}" width="32" height="40" rx="6" fill="${bright?p:'none'}" stroke="${bright?l1:p}" stroke-width="${bright?2.5:1.5}" opacity="${bright?0.7:0.3}"/>`;
      if (bright) r += `<rect x="${x}" y="${y}" width="32" height="40" rx="6" fill="${l1}" opacity="0.1"/>`;
    }
  }
  // Spacebar
  r += `<rect x="80" y="270" width="220" height="40" rx="8" fill="none" stroke="${p}" stroke-width="2" opacity="0.25"/>`;
  // Flying letters
  const flyLetters = 'TYPEFAST';
  for (let j = 0; j < 8; j++) {
    const x = 30 + j * 45, y = 360 + (j%3)*30;
    r += `<text x="${x}" y="${y}" font-family="'Courier New',monospace" font-size="40" font-weight="900" fill="${l1}" opacity="${0.1+j*0.03}">${flyLetters[j]}</text>`;
  }
  return r;
}

case "lightning": {
  let r = '';
  // Main bolt
  r += `<path d="M200 0 L150 180 L220 165 L140 380 L180 380 L250 200 L180 215 L240 0 Z" fill="${p}" opacity="0.4"/>`;
  r += `<path d="M205 10 L160 175 L215 165 L150 360" fill="none" stroke="${l1}" stroke-width="4" opacity="0.5"/>`;
  // Secondary bolts
  r += `<path d="M320 30 L290 130 L315 125 L280 240" fill="none" stroke="${p}" stroke-width="6" opacity="0.25" stroke-linecap="round"/>`;
  r += `<path d="M80 60 L60 150 L85 145 L60 260" fill="none" stroke="${l2}" stroke-width="4" opacity="0.2" stroke-linecap="round"/>`;
  // Electric particles
  for (let j = 0; j < 20; j++) {
    const x = 20+(s(j*9))%360, y = 20+(s(j*7))%440;
    r += `<circle cx="${x}" cy="${y}" r="${2+j%4}" fill="${l1}" opacity="${0.1+j%5*0.06}"/>`;
  }
  // Glow
  r += `<ellipse cx="200" cy="200" rx="120" ry="200" fill="${l1}" opacity="0.06"/>`;
  return r;
}

case "speedlines": {
  let r = '';
  for (let j = 0; j < 25; j++) {
    const y = 10 + j * 19;
    const w = 60 + (s(j*3))%250;
    const x = -20 + (s(j*5))%180;
    const thick = 3 + (j%4)*2;
    r += `<rect x="${x}" y="${y}" width="${w}" height="${thick}" rx="${thick/2}" fill="${j%3===0?p:j%3===1?l1:l2}" opacity="${0.12+j%4*0.08}" transform="skewX(-20)"/>`;
  }
  // Central burst
  r += `<ellipse cx="300" cy="250" rx="80" ry="150" fill="${p}" opacity="0.1" transform="rotate(-20 300 250)"/>`;
  return r;
}

case "circles": {
  let r = '';
  const positions = [[200,200,110],[120,130,80],[300,170,70],[160,320,90],[320,350,60],[80,380,70],[350,80,50]];
  positions.forEach(([cx,cy,rad],j) => {
    r += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="${j%3===0?p:j%3===1?l1:l2}" stroke-width="${4-j*0.3}" opacity="${0.25-j*0.02}"/>`;
    r += `<circle cx="${cx}" cy="${cy}" r="${rad-15}" fill="${p}" opacity="0.04"/>`;
    r += `<circle cx="${cx}" cy="${cy}" r="${rad+10}" fill="none" stroke="${l3}" stroke-width="1" opacity="0.06"/>`;
  });
  return r;
}

case "letters": {
  let r = '';
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let j = 0; j < 25; j++) {
    const x = 10+(s(j*9))%370, y = 20+(s(j*13))%450;
    const sz = 30 + (j*11)%50;
    const rot = -35 + (j*23)%70;
    r += `<text x="${x}" y="${y}" font-family="Impact,sans-serif" font-size="${sz}" font-weight="900" fill="${j%4===0?p:j%4===1?l1:j%4===2?l2:l3}" opacity="${0.1+j%5*0.06}" transform="rotate(${rot} ${x} ${y})">${alpha[j]}</text>`;
  }
  return r;
}

case "colorwave": {
  let r = '';
  const colors = [p, l1, l2, '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', l3];
  for (let j = 0; j < 8; j++) {
    const yBase = 50 + j * 55;
    let d = `M0 ${yBase}`;
    for (let x = 0; x <= 400; x += 5) {
      d += ` L${x} ${yBase + Math.sin((x + j*40)*0.025) * (30+j*8)}`;
    }
    d += ` L400 500 L0 500 Z`;
    r += `<path d="${d}" fill="${colors[j]}" opacity="${0.12+j*0.02}"/>`;
  }
  return r;
}

case "cards": {
  let r = '';
  const cardPositions = [[-25,50,200],[15,80,180],[-10,30,160],[5,60,140]];
  cardPositions.forEach(([rot,x,y],j) => {
    r += `<g transform="translate(${x+100},${y+50}) rotate(${rot})">
      <rect x="0" y="0" width="100" height="140" rx="10" fill="${j===3?p:d}" stroke="${j===3?l1:p}" stroke-width="${j===3?3:2}" opacity="${j===3?0.7:0.3}"/>
      ${j===3?`<text x="50" y="80" text-anchor="middle" font-family="serif" font-size="50" fill="${l1}" opacity="0.7">?</text>`:''}
      <circle cx="15" cy="20" r="8" fill="${l2}" opacity="${j===3?0.5:0.15}"/>
      <circle cx="85" cy="120" r="8" fill="${l2}" opacity="${j===3?0.5:0.15}"/>
    </g>`;
  });
  return r;
}

case "holes": {
  let r = '';
  // Ground
  r += `<rect x="0" y="250" width="400" height="250" fill="${p}" opacity="0.15"/>`;
  // Mole holes
  const holePos = [[60,300],[200,280],[340,310],[130,380],[270,400],[60,440],[340,450]];
  holePos.forEach(([cx,cy],j) => {
    r += `<ellipse cx="${cx}" cy="${cy}" rx="55" ry="20" fill="${d}" opacity="0.6"/>`;
    r += `<ellipse cx="${cx}" cy="${cy}" rx="55" ry="20" fill="none" stroke="${p}" stroke-width="3" opacity="0.3"/>`;
    if (j < 3) {
      // Mole peeking out
      r += `<ellipse cx="${cx}" cy="${cy-25}" rx="25" ry="30" fill="${l1}" opacity="0.35"/>`;
      r += `<circle cx="${cx-8}" cy="${cy-32}" r="4" fill="${d}" opacity="0.5"/>`;
      r += `<circle cx="${cx+8}" cy="${cy-32}" r="4" fill="${d}" opacity="0.5"/>`;
    }
  });
  // Hammer
  r += `<g transform="translate(280,100) rotate(25)" opacity="0.5">
    <rect x="-6" y="0" width="12" height="100" rx="4" fill="${l2}"/>
    <rect x="-30" y="-20" width="60" height="35" rx="6" fill="${p}" stroke="${l1}" stroke-width="2"/>
  </g>`;
  return r;
}

case "tower": {
  let r = '';
  const widths = [180,170,155,140,125,110,95,80,65,50,40,30];
  widths.forEach((w,j) => {
    const x = (200 - w/2), y = 460 - j * 38;
    const fill = j%3===0?p:j%3===1?l1:l2;
    r += `<rect x="${x}" y="${y}" width="${w}" height="32" rx="5" fill="${fill}" opacity="${0.35+j*0.03}" stroke="${l1}" stroke-width="1.5" stroke-opacity="0.3"/>`;
    r += `<rect x="${x+4}" y="${y+4}" width="${w-8}" height="24" rx="3" fill="${l3}" opacity="0.05"/>`;
  });
  // Arrow indicator
  r += `<path d="M200 50 L185 80 L195 80 L195 110 L205 110 L205 80 L215 80 Z" fill="${l1}" opacity="0.3"/>`;
  return r;
}

case "puzzle": {
  let r = '';
  r += `<g transform="translate(50,50) scale(1.6)" opacity="0.4">
    <path d="M0 50 h50 v-18 a22 22 0 0 1 35 0 v18 h50 v50 h18 a22 22 0 0 1 0 35 h-18 v50 h-50 v-18 a22 22 0 0 0 -35 0 v18 h-50 z" fill="${p}" stroke="${l1}" stroke-width="3"/>
  </g>`;
  r += `<g transform="translate(180,220) scale(1.3) rotate(15)" opacity="0.25">
    <path d="M0 50 h50 v-18 a22 22 0 0 1 35 0 v18 h50 v50 h18 a22 22 0 0 1 0 35 h-18 v50 h-50 v-18 a22 22 0 0 0 -35 0 v18 h-50 z" fill="${l1}" stroke="${l2}" stroke-width="2"/>
  </g>`;
  return r;
}

case "digits": {
  let r = '';
  for (let col = 0; col < 12; col++) {
    const numRows = 4 + (col*3)%8;
    for (let row = 0; row < numRows; row++) {
      const x = 10 + col * 34, y = 20 + row * 40;
      const n = (i*3+col+row*7)%10;
      const bright = row === 0;
      r += `<text x="${x}" y="${y}" font-family="'Courier New',monospace" font-size="30" font-weight="900" fill="${bright?l1:p}" opacity="${bright?0.5:Math.max(0.05, 0.35-row*0.05)}">${n}</text>`;
    }
  }
  return r;
}

case "chain": {
  let r = '';
  for (let j = 0; j < 10; j++) {
    const x = 30 + (j%5) * 75, y = 40 + Math.floor(j/5) * 180 + (j%2)*60;
    const rx = 28, ry = 42;
    const rot = j%2 === 0 ? 35 : -35;
    r += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="${j%3===0?p:j%3===1?l1:l2}" stroke-width="8" opacity="0.3" transform="rotate(${rot} ${x} ${y})"/>`;
  }
  return r;
}

case "crosshair": {
  let r = '';
  const cx = 200, cy = 220;
  [120,90,60,30].forEach((rad,j) => {
    r += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="${j%2===0?p:l1}" stroke-width="${4-j}" opacity="${0.3+j*0.05}"/>`;
  });
  r += `<line x1="${cx}" y1="${cy-140}" x2="${cx}" y2="${cy-35}" stroke="${p}" stroke-width="3" opacity="0.4"/>`;
  r += `<line x1="${cx}" y1="${cy+35}" x2="${cx}" y2="${cy+140}" stroke="${p}" stroke-width="3" opacity="0.4"/>`;
  r += `<line x1="${cx-140}" y1="${cy}" x2="${cx-35}" y2="${cy}" stroke="${p}" stroke-width="3" opacity="0.4"/>`;
  r += `<line x1="${cx+35}" y1="${cy}" x2="${cx+140}" y2="${cy}" stroke="${p}" stroke-width="3" opacity="0.4"/>`;
  r += `<circle cx="${cx}" cy="${cy}" r="6" fill="${l1}" opacity="0.6"/>`;
  // Hit markers in corners
  [[50,60],[330,80],[60,400],[340,420]].forEach(([x,y]) => {
    r += `<g opacity="0.2"><line x1="${x-15}" y1="${y}" x2="${x+15}" y2="${y}" stroke="${l2}" stroke-width="2"/><line x1="${x}" y1="${y-15}" x2="${x}" y2="${y+15}" stroke="${l2}" stroke-width="2"/></g>`;
  });
  return r;
}

case "arrows": {
  let r = '';
  const arrowData = [[80,120,0,1.5],[200,80,0,1.2],[150,250,180,1.3],[300,200,0,1],[100,380,0,0.9],[280,350,180,1.1],[50,200,0,0.8],[350,100,180,0.7]];
  arrowData.forEach(([x,y,rot,sc],j) => {
    r += `<g transform="translate(${x},${y}) rotate(${rot}) scale(${sc})" opacity="${0.2+j*0.04}">
      <path d="M0 0 L60 0 L60 -15 L90 10 L60 35 L60 20 L0 20 Z" fill="${j%3===0?p:j%3===1?l1:l2}"/>
    </g>`;
  });
  return r;
}

case "eye": {
  let r = '';
  r += `<g transform="translate(200,200)">
    <path d="M-160 0 Q-80 -100 0 -100 Q80 -100 160 0 Q80 100 0 100 Q-80 100 -160 0 Z" fill="none" stroke="${p}" stroke-width="5" opacity="0.35"/>
    <path d="M-160 0 Q-80 -100 0 -100 Q80 -100 160 0 Q80 100 0 100 Q-80 100 -160 0 Z" fill="${p}" opacity="0.06"/>
    <circle cx="0" cy="0" r="55" fill="none" stroke="${l1}" stroke-width="4" opacity="0.35"/>
    <circle cx="0" cy="0" r="45" fill="${p}" opacity="0.2"/>
    <circle cx="0" cy="0" r="25" fill="${d}" opacity="0.6"/>
    <circle cx="0" cy="0" r="12" fill="${l1}" opacity="0.4"/>
    <circle cx="12" cy="-12" r="8" fill="${l3}" opacity="0.4"/>
  </g>`;
  // Scan lines
  for (let j = 0; j < 5; j++) r += `<rect x="0" y="${80+j*80}" width="400" height="1" fill="${l2}" opacity="0.06"/>`;
  return r;
}

case "explosion": {
  let r = '';
  // Starburst
  for (let j = 0; j < 24; j++) {
    const a = (j*15)*Math.PI/180;
    const r1 = 20, r2 = 60+(j*11)%80;
    const x1 = 200+Math.cos(a)*r1, y1 = 220+Math.sin(a)*r1;
    const x2 = 200+Math.cos(a)*r2, y2 = 220+Math.sin(a)*r2;
    r += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${j%3===0?p:j%3===1?l1:l2}" stroke-width="${4-j%3}" opacity="${0.2+j%4*0.06}" stroke-linecap="round"/>`;
  }
  r += `<circle cx="200" cy="220" r="35" fill="${p}" opacity="0.35"/>`;
  r += `<circle cx="200" cy="220" r="20" fill="${l1}" opacity="0.2"/>`;
  // Debris particles
  for (let j = 0; j < 15; j++) {
    const a = (j*24)*Math.PI/180;
    const dist = 100+j*15;
    r += `<circle cx="${200+Math.cos(a)*dist}" cy="${220+Math.sin(a)*dist}" r="${3+j%4}" fill="${l2}" opacity="${0.15+j%3*0.1}"/>`;
  }
  return r;
}

case "cart": {
  let r = '';
  // Market stalls background
  for (let j = 0; j < 4; j++) {
    const x = 10 + j * 100;
    r += `<path d="M${x} 150 L${x+20} 80 L${x+80} 80 L${x+100} 150 Z" fill="${p}" opacity="0.15" stroke="${l1}" stroke-width="1" stroke-opacity="0.1"/>`;
    r += `<rect x="${x+10}" y="150" width="80" height="100" fill="${d}" opacity="0.3" stroke="${p}" stroke-width="1" stroke-opacity="0.2"/>`;
  }
  // Shopping cart large
  r += `<g transform="translate(100,260) scale(1.6)" opacity="0.5">
    <path d="M0 50 L15 0 L130 0 L115 60 L10 60 Z" fill="${p}" stroke="${l1}" stroke-width="3" stroke-linejoin="round"/>
    <line x1="0" y1="50" x2="-15" y2="75" stroke="${l1}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="30" cy="75" r="10" fill="none" stroke="${l1}" stroke-width="3"/>
    <circle cx="100" cy="75" r="10" fill="none" stroke="${l1}" stroke-width="3"/>
  </g>`;
  return r;
}

case "globe": {
  let r = '';
  const cx=200,cy=200,R=130;
  r += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${p}" opacity="0.1" stroke="${p}" stroke-width="3" opacity="0.35"/>`;
  r += `<ellipse cx="${cx}" cy="${cy}" rx="${R*0.6}" ry="${R}" fill="none" stroke="${l1}" stroke-width="2" opacity="0.2"/>`;
  r += `<ellipse cx="${cx}" cy="${cy}" rx="${R*0.25}" ry="${R}" fill="none" stroke="${l2}" stroke-width="1" opacity="0.12"/>`;
  [-50,-20,20,50].forEach(offset => {
    r += `<ellipse cx="${cx}" cy="${cy+offset}" rx="${Math.sqrt(R*R-offset*offset)}" ry="12" fill="none" stroke="${l2}" stroke-width="1.5" opacity="0.15"/>`;
  });
  r += `<circle cx="${cx}" cy="${cy}" r="${R+15}" fill="none" stroke="${l3}" stroke-width="1" opacity="0.08" stroke-dasharray="6 8"/>`;
  // Orbit dots
  for (let j = 0; j < 8; j++) {
    const a = j*45*Math.PI/180;
    r += `<circle cx="${cx+Math.cos(a)*(R+15)}" cy="${cy+Math.sin(a)*(R+15)}" r="3" fill="${l1}" opacity="0.2"/>`;
  }
  return r;
}

case "shadows": {
  let r = '';
  // Geometric shapes with shadows
  const shapes = [
    `<circle cx="120" cy="150" r="60"/>`, `<rect x="250" y="90" width="90" height="90" rx="8"/>`,
    `<polygon points="100,350 150,260 200,350"/>`, `<polygon points="300,320 350,280 350,360 300,360"/>`,
  ];
  shapes.forEach((shape, j) => {
    r += `<g fill="${j%2===0?p:l1}" opacity="0.25">${shape}</g>`;
    r += `<g fill="${d}" opacity="0.3" transform="translate(8,8)">${shape}</g>`;
  });
  return r;
}

case "wave": {
  let r = '';
  for (let j = 0; j < 8; j++) {
    const yBase = 60 + j * 55;
    let d = `M0 ${yBase}`;
    for (let x = 0; x <= 400; x += 5) {
      d += ` L${x} ${yBase + Math.sin((x+j*50)*0.02)*(25+j*10) + Math.cos((x+j*30)*0.035)*15}`;
    }
    d += ` L400 500 L0 500 Z`;
    r += `<path d="${d}" fill="${j%3===0?p:j%3===1?l1:l2}" opacity="${0.06+j*0.02}"/>`;
  }
  return r;
}

case "bars": {
  let r = '';
  for (let j = 0; j < 16; j++) {
    const h = 30 + j * 25;
    const x = 10 + j * 24, y = 480 - h;
    r += `<rect x="${x}" y="${y}" width="18" height="${h}" rx="4" fill="${j%3===0?p:j%3===1?l1:l2}" opacity="${0.25+j*0.03}"/>`;
    r += `<rect x="${x+3}" y="${y+3}" width="12" height="8" rx="2" fill="${l3}" opacity="0.15"/>`;
  }
  return r;
}

case "gridSquares": {
  let r = '';
  for (let row = 0; row < 8; row++) for (let col = 0; col < 7; col++) {
    const x = 8 + col * 56, y = 8 + row * 60;
    const filled = ((row*7+col+i)%4) < 2;
    r += `<rect x="${x}" y="${y}" width="48" height="52" rx="8" fill="${filled?p:'none'}" stroke="${filled?l1:p}" stroke-width="${filled?2:1}" opacity="${filled?0.4:0.12}"/>`;
  }
  return r;
}

case "mirror": {
  let r = '';
  r += `<line x1="200" y1="0" x2="200" y2="500" stroke="${l2}" stroke-width="3" opacity="0.15" stroke-dasharray="8 6"/>`;
  // Left shapes
  r += `<polygon points="60,180 120,100 120,260" fill="${p}" opacity="0.3"/>`;
  r += `<rect x="70" y="300" width="80" height="80" rx="10" fill="${l1}" opacity="0.2"/>`;
  r += `<circle cx="110" cy="80" r="30" fill="${l2}" opacity="0.15"/>`;
  // Mirrored right shapes
  r += `<polygon points="340,180 280,100 280,260" fill="${p}" opacity="0.2"/>`;
  r += `<rect x="250" y="300" width="80" height="80" rx="10" fill="${l1}" opacity="0.12"/>`;
  r += `<circle cx="290" cy="80" r="30" fill="${l2}" opacity="0.1"/>`;
  return r;
}

case "bubbles": {
  let r = '';
  const bubs = [[80,80,55],[250,120,45],[170,230,65],[320,70,35],[60,340,50],[280,300,60],[150,420,40],[350,400,45],[100,180,30],[320,200,25],[200,50,20],[40,450,35]];
  bubs.forEach(([cx,cy,rad],j) => {
    r += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${j%3===0?p:j%3===1?l1:l2}" opacity="${0.08+j*0.025}"/>`;
    r += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="${l1}" stroke-width="2.5" opacity="${0.2+j*0.03}"/>`;
    r += `<circle cx="${cx-rad*0.3}" cy="${cy-rad*0.3}" r="${rad*0.12}" fill="${l3}" opacity="0.35"/>`;
  });
  return r;
}

case "boxes": {
  let r = '';
  [[130,120,70],[260,100,60],[100,260,55],[280,250,65],[200,370,50],[60,380,45],[340,370,55]].forEach(([x,y,s],j) => {
    r += `<g transform="translate(${x},${y})">
      <path d="M0 ${-s/3} L${s/2} 0 L0 ${s/3} L${-s/2} 0 Z" fill="${j%2===0?p:l1}" opacity="0.3"/>
      <path d="M0 ${s/3} L${s/2} 0 L${s/2} ${s/3} L0 ${s*2/3} Z" fill="${p}" opacity="0.2"/>
      <path d="M0 ${s/3} L${-s/2} 0 L${-s/2} ${s/3} L0 ${s*2/3} Z" fill="${l1}" opacity="0.12"/>
    </g>`;
  });
  return r;
}

case "maze": {
  let r = '<g fill="none" stroke-linecap="round" stroke-linejoin="round">';
  r += `<path d="M30 30 h100 v80 h80 v-50 h100 v130 h-80 v60 h-100 v-80 h-60 v100 h140 v-40" stroke="${p}" stroke-width="5" opacity="0.3"/>`;
  r += `<path d="M280 30 v100 h-50 v80 h100 v-50 h60 v130" stroke="${l1}" stroke-width="4" opacity="0.2"/>`;
  r += `<path d="M30 310 h80 v-50 h100 v100 h80 v-70 h80 v120" stroke="${p}" stroke-width="4" opacity="0.25"/>`;
  r += `<path d="M30 420 h60 v-40 h80 v80 h120 v-60 h80" stroke="${l2}" stroke-width="3" opacity="0.15"/>`;
  r += '</g>';
  r += `<circle cx="45" cy="45" r="8" fill="${l1}" opacity="0.5"/>`;
  r += `<circle cx="370" cy="460" r="8" fill="${p}" opacity="0.5"/>`;
  return r;
}

case "constellation": {
  let r = '';
  const stars = [[60,60],[180,40],[320,70],[100,160],[260,140],[180,240],[340,220],[80,320],[240,340],[350,380],[140,400],[60,200],[300,300],[200,140]];
  const links = [[0,1],[1,2],[0,3],[3,4],[4,2],[3,5],[4,6],[5,7],[5,8],[6,8],[7,10],[8,9],[10,7],[1,13],[13,5]];
  links.forEach(([a,b]) => {
    r += `<line x1="${stars[a][0]}" y1="${stars[a][1]}" x2="${stars[b][0]}" y2="${stars[b][1]}" stroke="${l2}" stroke-width="1.5" opacity="0.2"/>`;
  });
  stars.forEach(([x,y],j) => {
    const big = j%4===0;
    r += `<circle cx="${x}" cy="${y}" r="${big?6:3}" fill="${j%3===0?l1:j%3===1?p:l2}" opacity="${big?0.6:0.4}"/>`;
    if (big) r += `<circle cx="${x}" cy="${y}" r="12" fill="${l1}" opacity="0.08"/>`;
  });
  return r;
}

case "switchArrows": {
  let r = '';
  r += `<g transform="translate(200,220)" opacity="0.45">
    <path d="M-90 -30 A95 95 0 0 1 90 -30" fill="none" stroke="${p}" stroke-width="10" stroke-linecap="round"/>
    <path d="M90 30 A95 95 0 0 1 -90 30" fill="none" stroke="${l1}" stroke-width="10" stroke-linecap="round"/>
    <polygon points="90,-30 115,-50 110,-15" fill="${p}"/>
    <polygon points="-90,30 -115,50 -110,15" fill="${l1}"/>
  </g>`;
  for (let j = 0; j < 6; j++) {
    const x = 40+(s(j*11))%320, y = 40+(s(j*17))%120;
    r += `<circle cx="${x}" cy="${y}" r="${4+j%3}" fill="${l2}" opacity="0.12"/>`;
  }
  return r;
}

case "magnifier": {
  let r = '';
  r += `<g transform="translate(170,170)" opacity="0.45">
    <circle cx="0" cy="0" r="85" fill="${p}" opacity="0.15"/>
    <circle cx="0" cy="0" r="85" fill="none" stroke="${p}" stroke-width="8"/>
    <circle cx="0" cy="0" r="70" fill="none" stroke="${l1}" stroke-width="2" opacity="0.3"/>
    <line x1="60" y1="60" x2="130" y2="130" stroke="${p}" stroke-width="14" stroke-linecap="round"/>
    <line x1="60" y1="60" x2="130" y2="130" stroke="${l1}" stroke-width="5" stroke-linecap="round" opacity="0.3"/>
    <circle cx="-20" cy="-25" r="25" fill="none" stroke="${l3}" stroke-width="2" opacity="0.15"/>
  </g>`;
  // Letters in lens
  'FIND'.split('').forEach((ch,j) => {
    r += `<text x="${130+j*28}" y="185" font-family="Impact,sans-serif" font-size="28" fill="${l1}" opacity="0.2">${ch}</text>`;
  });
  return r;
}

  default: return '';
  }
}

function generate(game, idx) {
  const [p, d, l1, l2, l3] = game.c;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <radialGradient id="g${idx}" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="${p}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${d}" stop-opacity="0"/>
    </radialGradient>
    <filter id="artGlow_${idx}"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <rect width="400" height="500" fill="${d}"/>
  <rect width="400" height="500" fill="url(#g${idx})"/>
  ${art(game.art, p, d, l1, l2, l3, idx)}
</svg>`;
}

const outDir = path.join(__dirname, "..", "public", "games", "covers");
fs.mkdirSync(outDir, { recursive: true });
// Remove old files
fs.readdirSync(outDir).forEach(f => fs.unlinkSync(path.join(outDir, f)));

games.forEach((g, i) => {
  fs.writeFileSync(path.join(outDir, `${g.slug}.svg`), generate(g, i));
  console.log(`✓ ${g.slug}`);
});
console.log(`\n${games.length} covers`);
