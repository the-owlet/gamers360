import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await req.json();
  if (!matchId) {
    return NextResponse.json({ error: "Match ID required" }, { status: 400 });
  }

  const match = await prisma.multiplayerMatch.findUnique({ where: { id: matchId } });
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (match.status !== "waiting") {
    return NextResponse.json({ error: "Match no longer available" }, { status: 400 });
  }

  if (match.challengerId === user.id) {
    return NextResponse.json({ error: "You can't accept your own challenge" }, { status: 400 });
  }

  if (new Date() > match.expiresAt) {
    await prisma.multiplayerMatch.update({
      where: { id: matchId },
      data: { status: "expired" },
    });
    return NextResponse.json({ error: "Challenge has expired" }, { status: 400 });
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet || wallet.balance < match.betAmount) {
    return NextResponse.json({ error: "Insufficient balance to match this bet" }, { status: 400 });
  }

  // Escrow opponent's bet and activate match
  const updated = await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { userId: user.id },
      data: { balance: { decrement: match.betAmount } },
    });

    return tx.multiplayerMatch.update({
      where: { id: matchId },
      data: {
        opponentId: user.id,
        status: "active",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min to both play
      },
    });
  });

  return NextResponse.json({
    matchId: updated.id,
    gameSlug: updated.gameSlug,
    betAmount: updated.betAmount,
    seed: updated.seed,
    status: "active",
  });
}
