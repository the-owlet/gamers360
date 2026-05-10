import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { challengeId } = await req.json();
  const today = new Date().toISOString().split("T")[0];

  const challenge = await prisma.userDailyChallenge.findUnique({
    where: { userId_challengeId_date: { userId: user.id, challengeId, date: today } },
  });

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  if (!challenge.completed) {
    return NextResponse.json({ error: "Challenge not completed yet" }, { status: 400 });
  }

  if (challenge.claimed) {
    return NextResponse.json({ error: "Already claimed" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.userDailyChallenge.update({
      where: { id: challenge.id },
      data: { claimed: true },
    }),
    prisma.wallet.update({
      where: { userId: user.id },
      data: {
        balance: { increment: challenge.reward },
        totalEarned: { increment: challenge.reward },
      },
    }),
  ]);

  return NextResponse.json({ success: true, reward: challenge.reward });
}
