const fs = require("fs");
const path = require("path");

const gamesDir = path.join(__dirname, "..", "src", "app", "games");
const gameDirs = fs.readdirSync(gamesDir).filter(d => {
  const p = path.join(gamesDir, d, "page.tsx");
  return fs.existsSync(p);
});

let fixed = 0, skipped = 0;

for (const gameDir of gameDirs) {
  const filePath = path.join(gamesDir, gameDir, "page.tsx");
  let code = fs.readFileSync(filePath, "utf-8");

  // Find the function that calls startGame() - could be begin() or init()
  // Pattern: function begin() { startGame(); ... } or function init() { startGame(); ... }
  const fnMatch = code.match(/function\s+(begin|init|start)\s*\(\)\s*\{[^}]*startGame\(\);/);
  if (!fnMatch) {
    console.log(`⏭ ${gameDir} — no begin/init with startGame()`);
    skipped++;
    continue;
  }

  const fnName = fnMatch[1];

  // Find the full function body by tracking braces
  const fnStartIdx = code.indexOf(`function ${fnName}()`);
  if (fnStartIdx === -1) { skipped++; continue; }

  // Find the opening brace
  const braceStart = code.indexOf("{", fnStartIdx);
  let depth = 0;
  let braceEnd = -1;
  for (let i = braceStart; i < code.length; i++) {
    if (code[i] === "{") depth++;
    if (code[i] === "}") {
      depth--;
      if (depth === 0) { braceEnd = i; break; }
    }
  }

  if (braceEnd === -1) {
    console.log(`✗ ${gameDir} — couldn't find end of ${fnName}()`);
    skipped++;
    continue;
  }

  const fnBody = code.substring(braceStart + 1, braceEnd).trim();

  // Split at startGame(); line
  const startGameIdx = fnBody.indexOf("startGame();");
  if (startGameIdx === -1) { skipped++; continue; }

  const afterStartGame = fnBody.substring(startGameIdx + "startGame();".length).trim();

  if (!afterStartGame) {
    console.log(`⏭ ${gameDir} — ${fnName}() already only has startGame()`);
    skipped++;
    continue;
  }

  // Get the indentation of the function
  const lineStart = code.lastIndexOf("\n", fnStartIdx) + 1;
  const indent = code.substring(lineStart, fnStartIdx).match(/^\s*/)[0];

  // Replace the function body: keep only startGame()
  const newFnBody = `function ${fnName}() {\n${indent}    startGame();\n${indent}  }`;
  const oldFn = code.substring(fnStartIdx, braceEnd + 1);
  code = code.replace(oldFn, newFnBody);

  // Now add useEffect for isPlaying after the function
  // Find where the new function ends to insert after it
  const newFnEndIdx = code.indexOf(newFnBody) + newFnBody.length;

  // Build the useEffect
  const initFnName = `_startGamePlay`;
  const useEffectBlock = `

${indent}  // Auto-start game when isPlaying becomes true (after bet selection)
${indent}  const _hasStarted = useRef(false);
${indent}  useEffect(() => {
${indent}    if (isPlaying && !_hasStarted.current) {
${indent}      _hasStarted.current = true;
${indent}      ${afterStartGame.split("\n").join("\n" + indent + "      ")}
${indent}    }
${indent}    if (!isPlaying) {
${indent}      _hasStarted.current = false;
${indent}    }
${indent}  }, [isPlaying]);`;

  code = code.substring(0, newFnEndIdx) + useEffectBlock + code.substring(newFnEndIdx);

  // Make sure useRef is imported
  if (!code.includes("useRef")) {
    code = code.replace(
      /from "react";/,
      (match) => {
        // Check what's already imported
        const importLine = code.substring(0, code.indexOf(match) + match.length);
        if (importLine.includes("useRef")) return match;
        return match.replace("from \"react\"", "useRef, } from \"react\"")
          .replace("{ useRef, }", "useRef }");
      }
    );
    // Simpler: just add useRef to the import
    if (!code.includes("useRef")) {
      code = code.replace(
        /import \{([^}]+)\} from "react"/,
        (match, imports) => {
          if (imports.includes("useRef")) return match;
          return `import {${imports}, useRef} from "react"`;
        }
      );
    }
  }

  fs.writeFileSync(filePath, code);
  console.log(`✓ ${gameDir} — split ${fnName}() + added useEffect`);
  fixed++;
}

console.log(`\nDone: ${fixed} fixed, ${skipped} skipped`);
