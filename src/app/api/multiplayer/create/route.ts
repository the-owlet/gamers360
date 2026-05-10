import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { GAMES } from "@/lib/constants";
import { generateGameToken, seedFromToken } from "@/lib/gameEngine";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameSlug, betAmount } = await req.json();

  const game = GAMES.find((g) => g.slug === gameSlug);
  if (!game) {
    return NextResponse.json({ error: "Invalid game" }, { status: 400 });
  }

  const validBets = [10, 25, 50, 100, 200];
  if (!validBets.includes(betAmount)) {
    return NextResponse.json({ error: "Invalid bet amount" }, { status: 400 });
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet || wallet.balance < betAmount) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  // Check user doesn't have too many active challenges
  const activeCount = await prisma.multiplayerMatch.count({
    where: { challengerId: user.id, status: { in: ["waiting", "active"] } },
  });
  if (activeCount >= 3) {
    return NextResponse.json(
      { error: "Max 3 active challenges. Complete or cancel existing ones." },
      { status: 400 }
    );
  }

  const token = generateGameToken();
  const seed = seedFromToken(token);

  // Escrow: deduct bet from challenger
  const match = await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { userId: user.id },
      data: { balance: { decrement: betAmount } },
    });

    return tx.multiplayerMatch.create({
      data: {
        gameSlug,
        betAmount,
        seed,
        challengerId: user.id,
        status: "waiting",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min to find opponent
      },
    });
  });

  return NextResponse.json({
    matchId: match.id,
    gameSlug,
    betAmount,
    status: "waiting",
  });
}
