"use client";

import { useState, useEffect, useCallback } from "react";
import { useSound } from "@/hooks/useSound";
import { useToast } from "@/components/Toast";

const MAX_DAILY = 5;

export default function RewardedAd() {
  const { play } = useSound();
  const { showToast } = useToast();
  const [remaining, setRemaining] = useState(MAX_DAILY);
  const [watching, setWatching] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetch("/api/ad-reward")
      .then((r) => r.json())
      .then((d) => setRemaining(d.remainingToday ?? MAX_DAILY))
      .catch(() => {});
  }, []);

  const claimReward = useCallback(async () => {
    setClaiming(true);
    try {
      const res = await fetch("/api/ad-reward", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setRemaining(data.remainingToday);
        play("coin");
        showToast(`+${data.pointsEarned} ad reward points!`, "🎬", "success");
      } else {
        showToast(data.error || "Failed to claim", "❌", "error");
      }
    } catch {
      showToast("Something went wrong", "❌", "error");
    } finally {
      setClaiming(false);
      setWatching(false);
    }
  }, [play, showToast]);

  useEffect(() => {
    if (!watching || countdown <= 0) return;
    const timer = setTimeout(() => {
      if (countdown === 1) {
        claimReward();
      }
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [watching, countdown, claimReward]);

  function startAd() {
    if (remaining <= 0) return;
    setWatching(true);
    setCountdown(5);
  }

  const progress = watching ? ((5 - countdown) / 5) * 100 : 0;

  return (
    <div className="glass rounded-2xl p-6 border border-purple-400/20 bg-gradient-to-r from-purple-400/5 to-pink-400/5">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">🎬</span>
        <div>
          <h3 className="font-bold text-sm">Watch Ad & Earn</h3>
          <p className="text-gray-500 text-xs">
            {remaining} / {MAX_DAILY} rewards left today
          </p>
        </div>
      </div>

      {watching ? (
        <div className="space-y-3">
          <div className="bg-gray-800/80 rounded-xl p-6 text-center border border-gray-700/50">
            <div className="text-gray-400 text-sm mb-2">Ad playing...</div>
            <div className="text-3xl font-black text-purple-400 mb-3">
              {claiming ? "..." : countdown}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={startAd}
          disabled={remaining <= 0 || claiming}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition shadow-lg shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>🎁</span>
          <span>
            {remaining <= 0
              ? "All rewards claimed today"
              : "Watch Ad → +50 pts"}
          </span>
        </button>
      )}
    </div>
  );
}
