"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface GameCardProps {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  maxPoints: number;
  multiplier: string;
  isFavorite: boolean;
  onFavorite: (e: React.MouseEvent) => void;
  isHot: boolean;
  tags?: string[];
  difficulty?: string;
  category?: string;
  playTime?: string;
}

const CARD_COLORS: Record<string, { bg: string; accent: string }> = {
  "memory-matrix":    { bg: "#4c1d95", accent: "#a78bfa" },
  "speed-tap":        { bg: "#78350f", accent: "#fbbf24" },
  "math-blitz":       { bg: "#0c4a6e", accent: "#38bdf8" },
  "pattern-recall":   { bg: "#701a75", accent: "#e879f9" },
  "word-scramble":    { bg: "#064e3b", accent: "#6ee7b7" },
  "reaction-rush":    { bg: "#7f1d1d", accent: "#fca5a5" },
  "color-sequence":   { bg: "#831843", accent: "#f9a8d4" },
  "naija-runner":     { bg: "#14532d", accent: "#86efac" },
  "jollof-wars":      { bg: "#9a3412", accent: "#fdba74" },
  "treasure-hunter":  { bg: "#78350f", accent: "#fcd34d" },
  "beat-drop":        { bg: "#831843", accent: "#f0abfc" },
  "escape-room":      { bg: "#7f1d1d", accent: "#fda4af" },
  "code-breaker":     { bg: "#0f172a", accent: "#94a3b8" },
  "naija-trivia":     { bg: "#064e3b", accent: "#4ade80" },
  "typing-race":      { bg: "#0c4a6e", accent: "#38bdf8" },
  "emoji-match":      { bg: "#78350f", accent: "#fbbf24" },
  "number-memory":    { bg: "#1e1b4b", accent: "#818cf8" },
  "emoji-chain":      { bg: "#701a75", accent: "#e879f9" },
  "shadow-match":     { bg: "#1c1917", accent: "#d6d3d1" },
  "mirror-draw":      { bg: "#0c4a6e", accent: "#22d3ee" },
  "odd-one-out":      { bg: "#9d174d", accent: "#f9a8d4" },
  "whack-a-mole":     { bg: "#713f12", accent: "#fde047" },
  "reflex-test":      { bg: "#14532d", accent: "#86efac" },
  "aim-trainer":      { bg: "#7f1d1d", accent: "#f87171" },
  "arrow-dash":       { bg: "#3b0764", accent: "#a78bfa" },
  "speed-sort":       { bg: "#134e4a", accent: "#5eead4" },
  "snap-match":       { bg: "#9a3412", accent: "#fb923c" },
  "sequence-surge":   { bg: "#0c4a6e", accent: "#60a5fa" },
  "grid-fill":        { bg: "#064e3b", accent: "#34d399" },
  "path-finder":      { bg: "#78350f", accent: "#fbbf24" },
  "rapid-fire":       { bg: "#7f1d1d", accent: "#fca5a5" },
  "connect-dots":     { bg: "#1e1b4b", accent: "#a5b4fc" },
  "tower-stack":      { bg: "#78350f", accent: "#fcd34d" },
  "bubble-pop":       { bg: "#831843", accent: "#fb7185" },
  "cargo-sort":       { bg: "#1c1917", accent: "#a8a29e" },
  "color-spy":        { bg: "#701a75", accent: "#c084fc" },
  "quick-switch":     { bg: "#7f1d1d", accent: "#fb7185" },
  "pidgin-puzzle":    { bg: "#713f12", accent: "#fde047" },
  "afro-beats":       { bg: "#831843", accent: "#f0abfc" },
  "suya-stack":       { bg: "#9a3412", accent: "#fdba74" },
  "market-rush":      { bg: "#14532d", accent: "#86efac" },
  "flag-quiz":        { bg: "#0c4a6e", accent: "#7dd3fc" },
  "word-chain":       { bg: "#064e3b", accent: "#6ee7b7" },
  "math-grid":        { bg: "#1e1b4b", accent: "#818cf8" },
  "emoji-decoder":    { bg: "#78350f", accent: "#fbbf24" },
  "tile-slide":       { bg: "#134e4a", accent: "#5eead4" },
  "memory-sprint":    { bg: "#3b0764", accent: "#c084fc" },
  "rhythm-tap":       { bg: "#831843", accent: "#f9a8d4" },
  "color-flood":      { bg: "#14532d", accent: "#86efac" },
  "digit-dash":       { bg: "#0c4a6e", accent: "#38bdf8" },
  "word-hunt":        { bg: "#713f12", accent: "#fde047" },
  "reaction-chain":   { bg: "#7f1d1d", accent: "#f87171" },
};

const DIFF_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Easy:   { label: "EASY",   color: "#4ade80", bg: "rgba(34,197,94,0.2)" },
  Medium: { label: "MEDIUM", color: "#fbbf24", bg: "rgba(251,191,36,0.2)" },
  Hard:   { label: "HARD",   color: "#f87171", bg: "rgba(248,113,113,0.2)" },
};

export default function GameCard({
  slug,
  name,
  description,
  icon,
  multiplier,
  isFavorite,
  onFavorite,
  isHot,
  difficulty,
  category,
  playTime,
}: GameCardProps) {
  const colors = CARD_COLORS[slug] || { bg: "#1e1b4b", accent: "#818cf8" };
  const diff = difficulty ? DIFF_CONFIG[difficulty] : null;
  const isSkill = category === "skill";
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/games/${slug}`}
      className="group relative block rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.03]"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${colors.accent}44, 0 0 40px ${colors.accent}22`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
      }}
    >
      <div className="relative aspect-[4/5] overflow-hidden" style={{ backgroundColor: colors.bg }}>
        {/* Cover image */}
        {!imgError ? (
          <Image
            src={`/games/covers/${slug}.jpg`}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)}
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl sm:text-5xl">{icon}</span>
          </div>
        )}

        {/* Color tint overlay to blend photo with game theme */}
        <div
          className="absolute inset-0 z-[2] mix-blend-multiply"
          style={{ background: `linear-gradient(135deg, ${colors.bg}cc, ${colors.accent}44)` }}
        />
        <div
          className="absolute inset-0 z-[3]"
          style={{ background: `linear-gradient(to top, ${colors.bg} 0%, transparent 50%)` }}
        />

        {/* Hover shine */}
        <div
          className="absolute inset-0 z-[5] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)" }}
        />

        {/* Top badges */}
        <div className="absolute top-1.5 left-1.5 right-1.5 z-20 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {isHot && (
              <span
                className="text-white text-[6px] leading-none px-1.5 py-[3px] rounded-md font-black tracking-widest shadow-lg backdrop-blur-sm"
                style={{ fontFamily: "var(--font-orbitron)", background: "linear-gradient(90deg, #ef4444, #f97316)" }}
              >
                HOT
              </span>
            )}
            {isSkill && (
              <span
                className="text-[6px] leading-none px-1.5 py-[3px] rounded-md font-black tracking-widest shadow-lg backdrop-blur-sm"
                style={{ fontFamily: "var(--font-orbitron)", background: "linear-gradient(90deg, #8b5cf6, #06b6d4)", color: "#fff" }}
              >
                SKILL
              </span>
            )}
          </div>
          <button
            onClick={onFavorite}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all hover:scale-110"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill={isFavorite ? "#ef4444" : "none"} stroke={isFavorite ? "#ef4444" : "#999"} strokeWidth="2.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-8 p-2">
          {/* Multiplier + Difficulty + Play Time */}
          <div className="flex items-center gap-1 mb-0.5 flex-wrap">
            <span
              className="inline-block text-black font-black px-1.5 py-[1px] rounded-md shadow-md tracking-wider"
              style={{
                fontFamily: "var(--font-orbitron)",
                fontSize: "7px",
                background: `linear-gradient(90deg, ${colors.accent}, #fbbf24)`,
              }}
            >
              {multiplier}
            </span>
            {diff && (
              <span
                className="font-black px-1.5 py-[1px] rounded-md tracking-wider"
                style={{ fontFamily: "var(--font-orbitron)", fontSize: "6px", color: diff.color, background: diff.bg, border: `1px solid ${diff.color}33` }}
              >
                {diff.label}
              </span>
            )}
            {playTime && (
              <span
                className="font-bold px-1.5 py-[1px] rounded-md tracking-wider"
                style={{ fontFamily: "var(--font-orbitron)", fontSize: "6px", color: "#e2e8f0", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {playTime}
              </span>
            )}
          </div>

          <h3
            className="text-white text-[10px] sm:text-xs font-black truncate leading-tight"
            style={{ fontFamily: "var(--font-orbitron)", textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}
          >
            {name}
          </h3>
        </div>
      </div>
    </Link>
  );
}
