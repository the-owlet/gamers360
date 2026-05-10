import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

interface Notification {
  type: "challenge_accepted" | "match_ready" | "match_completed";
  message: string;
  matchId: string;
  gameSlug: string;
  createdAt: string;
}

function formatGameSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications: Notification[] = [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 1. Challenge accepted: user is challenger, status active, user hasn't played yet
  const acceptedChallenges = await prisma.multiplayerMatch.findMany({
    where: {
      challengerId: user.id,
      status: "active",
      challengerDone: false,
    },
    include: {
      opponent: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  for (const match of acceptedChallenges) {
    notifications.push({
      type: "challenge_accepted",
      message: `${match.opponent?.username ?? "Someone"} accepted your ${formatGameSlug(match.gameSlug)} challenge!`,
      matchId: match.id,
      gameSlug: match.gameSlug,
      createdAt: match.createdAt.toISOString(),
    });
  }

  // 2. Match ready: user is opponent, status active, user hasn't played yet
  const readyMatches = await prisma.multiplayerMatch.findMany({
    where: {
      opponentId: user.id,
      status: "active",
      opponentDone: false,
    },
    include: {
      challenger: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  for (const match of readyMatches) {
    notifications.push({
      type: "match_ready",
      message: `Your ${formatGameSlug(match.gameSlug)} match vs ${match.challenger.username} is ready to play!`,
      matchId: match.id,
      gameSlug: match.gameSlug,
      createdAt: match.createdAt.toISOString(),
    });
  }

  // 3. Completed matches in the last 24 hours
  const completedMatches = await prisma.multiplayerMatch.findMany({
    where: {
      status: "completed",
      completedAt: { gte: oneDayAgo },
      OR: [{ challengerId: user.id }, { opponentId: user.id }],
    },
    include: {
      challenger: { select: { id: true, username: true } },
      opponent: { select: { id: true, username: true } },
    },
    orderBy: { completedAt: "desc" },
    take: 10,
  });

  for (const match of completedMatches) {
    const isChallenger = match.challengerId === user.id;
    const opponentName = isChallenger
      ? (match.opponent?.username ?? "opponent")
      : match.challenger.username;
    const userScore = isChallenger ? match.challengerScore : match.opponentScore;
    const won = match.winnerId === user.id;
    const draw = match.winnerId === null;

    let message: string;
    if (draw) {
      message = `Draw vs ${opponentName} in ${formatGameSlug(match.gameSlug)}! Bets refunded.`;
    } else if (won) {
      message = `You won ${match.payout} pts vs ${opponentName} in ${formatGameSlug(match.gameSlug)}!`;
    } else {
      message = `You scored ${userScore ?? 0} vs ${opponentName} in ${formatGameSlug(match.gameSlug)}.`;
    }

    notifications.push({
      type: "match_completed",
      message,
      matchId: match.id,
      gameSlug: match.gameSlug,
      createdAt: (match.completedAt ?? match.createdAt).toISOString(),
    });
  }

  // Sort all notifications by date descending
  notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ notifications });
}
