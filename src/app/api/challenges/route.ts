import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const CHALLENGE_POOL = [
  { id: "play_any", name: "Play 3 games", icon: "🎮", target: 3, reward: 100 },
  { id: "play_5", name: "Play 5 games", icon: "🔥", target: 5, reward: 150 },
  { id: "play_luck", name: "Play 2 luck games", icon: "🍀", target: 2, reward: 80 },
  { id: "win_any", name: "Win 2 games", icon: "🏆", target: 2, reward: 150 },
  { id: "win_3", name: "Win 3 games", icon: "👑", target: 3, reward: 200 },
];

function getTodayChallenges(userId: string): typeof CHALLENGE_POOL {
  const seed = userId + new Date().toISOString().split("T")[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const shuffled = [...CHALLENGE_POOL].sort((a, b) => {
    const ha = ((hash * 31 + a.id.charCodeAt(0)) | 0) % 100;
    const hb = ((hash * 31 + b.id.charCodeAt(0)) | 0) % 100;
    return ha - hb;
  });
  return shuffled.slice(0, 3);
}

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  const todayChallenges = getTodayChallenges(user.id);

  // Create today's challenges if they don't exist
  const existing = await prisma.userDailyChallenge.findMany({
    where: { userId: user.id, date: today },
  });

  if (existing.length === 0) {
    await prisma.userDailyChallenge.createMany({
      data: todayChallenges.map((c) => ({
        userId: user.id,
        challengeId: c.id,
        date: today,
        target: c.target,
        reward: c.reward,
      })),
    });
  }

  const challenges = await prisma.userDailyChallenge.findMany({
    where: { userId: user.id, date: today },
  });

  const enriched = challenges.map((c) => {
    const template = CHALLENGE_POOL.find((p) => p.id === c.challengeId);
    return {
      ...c,
      name: template?.name ?? c.challengeId,
      icon: template?.icon ?? "🎯",
    };
  });

  return NextResponse.json({ challenges: enriched });
}
