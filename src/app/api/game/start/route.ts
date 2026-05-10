import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { GAMES } from "@/lib/constants";
import {
  generateGameToken,
  seedFromToken,
  RATE_LIMITS,
} from "@/lib/gameEngine";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameSlug, betAmount = 0 } = await req.json();

  const game = GAMES.find((g) => g.slug === gameSlug);
  if (!game) {
    return NextResponse.json({ error: "Invalid game" }, { status: 400 });
  }

  const validBets = [0, 10, 25, 50, 100];
  const bet = validBets.includes(betAmount) ? betAmount : 0;

  if (bet > 0) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet || wallet.balance < bet) {
      return NextResponse.json(
        { error: "Insufficient balance for this bet" },
        { status: 400 }
      );
    }
  }

  // Cooldown check
  if (user.lastGameAt) {
    const elapsed = Date.now() - new Date(user.lastGameAt).getTime();
    if (elapsed < RATE_LIMITS.COOLDOWN_MS) {
      const wait = Math.ceil((RATE_LIMITS.COOLDOWN_MS - elapsed) / 1000);
      return NextResponse.json(
        { error: `Please wait ${wait}s before playing again` },
        { status: 429 }
      );
    }
  }

  // Hourly rate limit
  const oneHourAgo = new Date(Date.now() - 3600000);
  const hourlyCount = await prisma.gameHistory.count({
    where: { userId: user.id, playedAt: { gte: oneHourAgo } },
  });
  if (hourlyCount >= RATE_LIMITS.MAX_GAMES_PER_HOUR) {
    return NextResponse.json(
      { error: "Hourly game limit reached. Take a break!" },
      { status: 429 }
    );
  }

  // Daily rate limit
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const dailyCount = await prisma.gameHistory.count({
    where: { userId: user.id, playedAt: { gte: todayStart } },
  });
  if (dailyCount >= RATE_LIMITS.MAX_GAMES_PER_DAY) {
    return NextResponse.json(
      { error: "Daily game limit reached. Come back tomorrow!" },
      { status: 429 }
    );
  }

  // Cancel any uncompleted sessions for this user
  await prisma.gameSession.deleteMany({
    where: {
      userId: user.id,
      completed: false,
    },
  });

  const token = generateGameToken();
  const seed = seedFromToken(token);

  // Create game session — win/loss determined at complete time based on actual gameplay
  const session = await prisma.gameSession.create({
    data: {
      userId: user.id,
      gameSlug,
      token,
      seed,
      won: false, // placeholder, updated when game completes
      betAmount: bet,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  return NextResponse.json({
    token: session.token,
    seed: session.seed,
    betAmount: bet,
    expiresAt: session.expiresAt,
  });
}
