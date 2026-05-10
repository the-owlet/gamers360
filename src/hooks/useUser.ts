"use client";

import { useCallback, useEffect, useState } from "react";

export interface UserData {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  level: number;
  levelName: string;
  levelColor: string;
  xp: number;
  xpToNext: number;
  progress: number;
  totalGamesPlayed: number;
  totalWins: number;
  loginStreak: number;
  lastRewardDate: string | null;
  referralCode: string;
  referralCount: number;
  achievements: string[];
  recentGames: {
    gameSlug: string;
    score: number;
    pointsEarned: number;
    won: boolean;
    playedAt: string;
  }[];
  wallet: {
    balance: number;
    totalEarned: number;
    totalWithdrawn: number;
  } | null;
}

export function useUser() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, loading, mutate: fetchUser };
}
