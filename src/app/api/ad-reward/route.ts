import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const MAX_DAILY_REWARDS = 5;
const REWARD_POINTS = 50;

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const claimedToday = await prisma.gameHistory.count({
    where: {
      userId: user.id,
      gameSlug: "ad-reward",
      playedAt: { gte: todayStart },
    },
  });

  return NextResponse.json({
    claimedToday,
    remainingToday: Math.max(0, MAX_DAILY_REWARDS - claimedToday),
    maxDaily: MAX_DAILY_REWARDS,
  });
}

export async function POST() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const claimedToday = await prisma.gameHistory.count({
    where: {
      userId: user.id,
      gameSlug: "ad-reward",
      playedAt: { gte: todayStart },
    },
  });

  if (claimedToday >= MAX_DAILY_REWARDS) {
    return NextResponse.json(
      { error: "Daily ad reward limit reached", remainingToday: 0 },
      { status: 429 }
    );
  }

  await prisma.$transaction([
    prisma.gameHistory.create({
      data: {
        userId: user.id,
        gameSlug: "ad-reward",
        score: REWARD_POINTS,
        pointsEarned: REWARD_POINTS,
        won: true,
      },
    }),
    prisma.wallet.update({
      where: { userId: user.id },
      data: {
        balance: { increment: REWARD_POINTS },
        totalEarned: { increment: REWARD_POINTS },
      },
    }),
  ]);

  const remaining = MAX_DAILY_REWARDS - claimedToday - 1;

  return NextResponse.json({
    success: true,
    pointsEarned: REWARD_POINTS,
    remainingToday: remaining,
  });
}
