"use client";

import { useState } from "react";

interface ShareEarningsProps {
  points: number;
  level: number;
  gamesPlayed: number;
  totalWins: number;
}

export default function ShareEarnings({ points, level, gamesPlayed, totalWins }: ShareEarningsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const naira = Math.floor(points / 10);

  const shareText = `🎮 I've earned ₦${naira.toLocaleString()} playing games on Gamers360! 🔥\n\n💰 ${points.toLocaleString()} points earned\n🏆 Level ${level} player\n🎯 ${totalWins} wins out of ${gamesPlayed} games\n\nJoin free and start earning 👉 gamers360.com`;

  const shareUrl = "https://gamers360.com";

  function shareTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
    setShowMenu(false);
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`, "_blank");
    setShowMenu(false);
  }

  function shareTikTok() {
    navigator.clipboard.writeText(shareText + "\n" + shareUrl);
    alert("Caption copied! Open TikTok and paste it in your video caption.");
    setShowMenu(false);
  }

  function shareInstagram() {
    navigator.clipboard.writeText(shareText + "\n" + shareUrl);
    alert("Caption copied! Open Instagram and paste it in your story or post.");
    setShowMenu(false);
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(shareText + "\n" + shareUrl);
    alert("Copied to clipboard!");
    setShowMenu(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition flex items-center gap-2 shadow-lg shadow-purple-500/20"
      >
        📢 Flaunt Earnings
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute bottom-full mb-2 right-0 z-50 w-56 glass rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-3 border-b border-white/5">
              <p className="text-xs text-gray-400">Share your earnings</p>
              <p className="text-yellow-400 font-bold text-sm">₦{naira.toLocaleString()} earned!</p>
            </div>

            <button onClick={shareTwitter}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white hover:bg-white/5 transition">
              <span className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-lg">𝕏</span>
              <span className="font-medium">Twitter / X</span>
            </button>

            <button onClick={shareWhatsApp}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white hover:bg-white/5 transition">
              <span className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-lg">💬</span>
              <span className="font-medium">WhatsApp</span>
            </button>

            <button onClick={shareTikTok}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white hover:bg-white/5 transition">
              <span className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-lg">🎵</span>
              <span className="font-medium">TikTok</span>
            </button>

            <button onClick={shareInstagram}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white hover:bg-white/5 transition">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center text-lg">📸</span>
              <span className="font-medium">Instagram</span>
            </button>

            <button onClick={copyToClipboard}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white hover:bg-white/5 transition border-t border-white/5">
              <span className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-lg">📋</span>
              <span className="font-medium">Copy Text</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
