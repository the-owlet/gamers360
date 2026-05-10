import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getLevelInfo } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const levelInfo = getLevelInfo(user.xp);

  const achievements = await prisma.userAchievement.findMany({
    where: { userId: user.id },
    select: { achievementId: true },
  });

  const recentGames = await prisma.gameHistory.findMany({
    where: { userId: user.id },
    orderBy: { playedAt: "desc" },
    take: 10,
    select: { gameSlug: true, score: true, pointsEarned: true, won: true, playedAt: true },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      level: levelInfo.level,
      levelName: levelInfo.name,
      levelColor: levelInfo.color,
      xp: user.xp,
      xpToNext: levelInfo.xpToNext,
      progress: levelInfo.progress,
      totalGamesPlayed: user.totalGamesPlayed,
      totalWins: user.totalWins,
      loginStreak: user.loginStreak,
      lastRewardDate: user.lastRewardDate,
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      achievements: achievements.map((a) => a.achievementId),
      recentGames,
      wallet: user.wallet
        ? {
            balance: user.wallet.balance,
            totalEarned: user.wallet.totalEarned,
            totalWithdrawn: user.wallet.totalWithdrawn,
          }
        : null,
    },
  });
}
