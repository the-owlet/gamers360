import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const STREAK_REWARDS = [50, 75, 100, 150, 200, 300, 500];

export async function POST() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  if (user.lastRewardDate === today) {
    return NextResponse.json(
      { error: "Already claimed today's reward" },
      { status: 400 }
    );
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const isConsecutive = user.lastRewardDate === yesterday;
  const newStreak = isConsecutive ? user.loginStreak + 1 : 1;
  const streakIndex = Math.min(newStreak - 1, STREAK_REWARDS.length - 1);
  const reward = STREAK_REWARDS[streakIndex];

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        loginStreak: newStreak,
        lastLoginDate: today,
        lastRewardDate: today,
        xp: { increment: 15 },
      },
    }),
    prisma.wallet.update({
      where: { userId: user.id },
      data: {
        balance: { increment: reward },
        totalEarned: { increment: reward },
      },
    }),
  ]);

  return NextResponse.json({
    reward,
    streak: newStreak,
    streakRewards: STREAK_REWARDS,
  });
}
