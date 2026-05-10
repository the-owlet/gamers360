import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLevelInfo } from "@/lib/constants";

export async function GET() {
  const topPlayers = await prisma.user.findMany({
    orderBy: { xp: "desc" },
    take: 50,
    select: {
      id: true,
      username: true,
      xp: true,
      totalGamesPlayed: true,
      totalWins: true,
      loginStreak: true,
      wallet: { select: { totalEarned: true } },
    },
  });

  const leaderboard = topPlayers.map((p, i) => {
    const levelInfo = getLevelInfo(p.xp);
    return {
      rank: i + 1,
      username: p.username,
      level: levelInfo.level,
      levelName: levelInfo.name,
      xp: p.xp,
      totalGamesPlayed: p.totalGamesPlayed,
      totalWins: p.totalWins,
      totalEarned: p.wallet?.totalEarned ?? 0,
      streak: p.loginStreak,
    };
  });

  return NextResponse.json({ leaderboard });
}
