"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";

interface LeaderboardEntry {
  rank: number;
  username: string;
  level: number;
  levelName: string;
  xp: number;
  totalGamesPlayed: number;
  totalWins: number;
  totalEarned: number;
  streak: number;
}

const RANK_STYLES: Record<number, { badge: string; color: string }> = {
  1: { badge: "👑", color: "from-yellow-400 to-amber-500" },
  2: { badge: "🥈", color: "from-gray-300 to-gray-400" },
  3: { badge: "🥉", color: "from-orange-400 to-orange-500" },
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <ParticleBackground />
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black mb-2" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>
            🏆 <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Leaderboard</span>
          </h1>
          <p className="text-gray-500">Top players ranked by XP</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass rounded-xl h-16 animate-pulse" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">🎮</div>
            <h2 className="text-xl font-bold mb-2">No players yet!</h2>
            <p className="text-gray-500">Be the first to sign up and claim the #1 spot.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((player) => {
              const style = RANK_STYLES[player.rank];
              return (
                <div
                  key={player.rank}
                  className={`glass rounded-xl p-4 flex items-center gap-4 transition-all hover:bg-white/5 ${
                    player.rank <= 3 ? "border border-yellow-400/10" : ""
                  }`}
                >
                  {/* Rank */}
                  <div className="w-10 text-center">
                    {style ? (
                      <span className="text-2xl">{style.badge}</span>
                    ) : (
                      <span className="text-gray-500 font-bold">#{player.rank}</span>
                    )}
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold truncate ${player.rank <= 3 ? "text-yellow-400" : "text-white"}`}>
                        {player.username}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${
                        style?.color || "from-gray-600 to-gray-700"
                      } text-black font-bold`}>
                        LV {player.level}
                      </span>
                      {player.streak >= 3 && (
                        <span className="text-xs">🔥{player.streak}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {player.levelName} &bull; {player.totalGamesPlayed} games &bull; {player.totalWins} wins
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right">
                    <div className="font-bold text-cyan-400">{player.xp.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">XP</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
