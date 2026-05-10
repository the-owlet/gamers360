"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";
import AdBanner from "@/components/AdBanner";
import GameCard from "@/components/GameCard";
import { GAMES, GAME_CATEGORIES } from "@/lib/constants";
import type { GameTag } from "@/lib/constants";

const FAVORITES_KEY = "gamers360_favorites";

function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch { return []; }
}

function toggleFavorite(slug: string): string[] {
  const favs = getFavorites();
  const next = favs.includes(slug) ? favs.filter(s => s !== slug) : [...favs, slug];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/games", label: "Games", icon: "🎮" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/contact", label: "Support", icon: "💬" },
];

export default function GamesPage() {
  const [activeTag, setActiveTag] = useState<GameTag | "all" | "favorites">("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(24);
  const pathname = usePathname();

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const filtered = useMemo(() => {
    if (activeTag === "all") return GAMES;
    if (activeTag === "favorites") return GAMES.filter(g => favorites.includes(g.slug));
    return GAMES.filter(g => g.tags?.includes(activeTag));
  }, [activeTag, favorites]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const skillCount = GAMES.filter(g => g.category === "skill").length;
  const luckCount = GAMES.filter(g => g.category === "luck").length;

  function handleFavorite(e: React.MouseEvent, slug: string) {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(toggleFavorite(slug));
  }

  return (
    <>
      <ParticleBackground />
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 relative z-10 pb-24 lg:pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-black mb-2" style={{ fontFamily: "var(--font-orbitron)" }}>
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent">Game Arena</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Play games, stack points, withdraw real cash. No cap.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="bg-yellow-400/10 text-yellow-400 px-3 py-1 rounded-full font-bold text-xs">{GAMES.length} Games</span>
            <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full font-bold text-xs">{skillCount} Skill</span>
            <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full font-bold text-xs">{luckCount} Luck</span>
            <span className="text-gray-500 text-xs">10 pts = ₦1</span>
          </div>
        </div>

        {/* How it Works */}
        <div className="glass rounded-2xl p-4 sm:p-5 mb-6 border border-white/5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="text-2xl mb-1">🎮</div>
              <div className="text-xs sm:text-sm font-bold text-white">Play Any Game</div>
              <div className="text-[10px] sm:text-xs text-gray-500">You earn min 5 pts per game</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">💰</div>
              <div className="text-xs sm:text-sm font-bold text-white">Win = Big Bag</div>
              <div className="text-[10px] sm:text-xs text-gray-500">Up to 100 pts when you win</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">📈</div>
              <div className="text-xs sm:text-sm font-bold text-white">Level Up</div>
              <div className="text-[10px] sm:text-xs text-gray-500">Higher level = 5x multiplier</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🏧</div>
              <div className="text-xs sm:text-sm font-bold text-white">Cash Out Anytime</div>
              <div className="text-[10px] sm:text-xs text-gray-500">Withdraw to bank or crypto</div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-6 overflow-x-auto hide-scrollbar">
          <div className="flex gap-1.5 min-w-max pb-2">
            <button
              onClick={() => { setActiveTag("all"); setVisibleCount(24); }}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${activeTag === "all" ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-lg shadow-yellow-500/20" : "glass text-gray-400 hover:text-white"}`}
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              🎯 All
            </button>
            <button
              onClick={() => { setActiveTag("favorites"); setVisibleCount(24); }}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${activeTag === "favorites" ? "bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg shadow-pink-500/20" : "glass text-gray-400 hover:text-white"}`}
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              ❤️ Faves{favorites.length > 0 ? ` (${favorites.length})` : ""}
            </button>
            {GAME_CATEGORIES.map(cat => (
              <button
                key={cat.tag}
                onClick={() => { setActiveTag(cat.tag); setVisibleCount(24); }}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${activeTag === cat.tag ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-lg shadow-yellow-500/20" : "glass text-gray-400 hover:text-white"}`}
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                {cat.icon}{cat.label}
              </button>
            ))}
          </div>
        </div>

        <AdBanner slot="games-top" className="mb-6" />

        {/* Games Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">{activeTag === "favorites" ? "❤️" : "🎮"}</div>
            <p className="text-gray-400 text-lg font-bold mb-2">
              {activeTag === "favorites" ? "No faves yet" : "Nothing here"}
            </p>
            <p className="text-gray-600 text-sm">
              {activeTag === "favorites" ? "Tap the heart on any game to save it!" : "Try another category fam"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
            {visible.map((game) => (
              <GameCard
                key={game.slug}
                slug={game.slug}
                name={game.name}
                description={game.description}
                icon={game.icon}
                color={game.color}
                maxPoints={game.maxPoints}
                multiplier={game.multiplier}
                isFavorite={favorites.includes(game.slug)}
                onFavorite={(e) => handleFavorite(e, game.slug)}
                isHot={game.tags?.includes("hot") ?? false}
                tags={game.tags}
                difficulty={game.difficulty}
                category={game.category}
                playTime={game.playTime}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={() => setVisibleCount(v => v + 24)}
              className="glass px-8 py-3 rounded-xl text-yellow-400 font-bold hover:bg-white/5 transition border border-yellow-400/10"
            >
              Show More ({filtered.length - visibleCount} left)
            </button>
          </div>
        )}

        <AdBanner slot="games-bottom" className="mt-8" />
      </main>

      {/* Bottom Navigation Bar (mobile only) */}
      <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden">
        <div className="bg-gray-900/80 backdrop-blur-xl border-t border-white/10">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors ${
                    isActive ? "text-yellow-400" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <span className="text-xl leading-none">{item.icon}</span>
                  <span className={`text-[10px] font-bold ${isActive ? "text-yellow-400" : ""}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-1 w-6 h-0.5 rounded-full bg-yellow-400" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
