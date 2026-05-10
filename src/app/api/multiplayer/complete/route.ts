import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { GAMES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId, score } = await req.json();
  if (!matchId || score === undefined) {
    return NextResponse.json({ error: "Match ID and score required" }, { status: 400 });
  }

  const match = await prisma.multiplayerMatch.findUnique({ where: { id: matchId } });
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (match.status !== "active") {
    return NextResponse.json({ error: "Match is not active" }, { status: 400 });
  }

  const game = GAMES.find((g) => g.slug === match.gameSlug);
  const cappedScore = Math.min(Math.max(0, score), game?.maxPoints ?? 95);

  const isChallenger = match.challengerId === user.id;
  const isOpponent = match.opponentId === user.id;

  if (!isChallenger && !isOpponent) {
    return NextResponse.json({ error: "You are not in this match" }, { status: 403 });
  }

  if ((isChallenger && match.challengerDone) || (isOpponent && match.opponentDone)) {
    return NextResponse.json({ error: "You already submitted your score" }, { status: 409 });
  }

  // Update the player's score
  const updateData: Record<string, unknown> = {};
  if (isChallenger) {
    updateData.challengerScore = cappedScore;
    updateData.challengerDone = true;
  } else {
    updateData.opponentScore = cappedScore;
    updateData.opponentDone = true;
  }

  // Check if both players are now done
  const otherDone = isChallenger ? match.opponentDone : match.challengerDone;

  if (otherDone) {
    // Both done — resolve the match
    const challengerFinal = isChallenger ? cappedScore : (match.challengerScore ?? 0);
    const opponentFinal = isOpponent ? cappedScore : (match.opponentScore ?? 0);

    let winnerId: string | null = null;
    const totalPot = match.betAmount * 2;
    const houseCut = Math.floor(totalPot * 0.05); // 5% house fee
    const winnerPayout = totalPot - houseCut;

    if (challengerFinal > opponentFinal) {
      winnerId = match.challengerId;
    } else if (opponentFinal > challengerFinal) {
      winnerId = match.opponentId;
    }
    // Tie: both get their bet back

    await prisma.$transaction(async (tx) => {
      await tx.multiplayerMatch.update({
        where: { id: matchId },
        data: {
          ...updateData,
          status: "completed",
          winnerId,
          payout: winnerId ? winnerPayout : match.betAmount,
          completedAt: new Date(),
        },
      });

      if (winnerId) {
        // Winner gets the pot minus house cut
        await tx.wallet.update({
          where: { userId: winnerId },
          data: {
            balance: { increment: winnerPayout },
            totalEarned: { increment: winnerPayout },
          },
        });
      } else {
        // Tie — refund both
        await tx.wallet.update({
          where: { userId: match.challengerId },
          data: { balance: { increment: match.betAmount } },
        });
        if (match.opponentId) {
          await tx.wallet.update({
            where: { userId: match.opponentId },
            data: { balance: { increment: match.betAmount } },
          });
        }
      }
    });

    // Fetch usernames for response
    const challenger = await prisma.user.findUnique({
      where: { id: match.challengerId },
      select: { username: true },
    });
    const opponent = match.opponentId
      ? await prisma.user.findUnique({
          where: { id: match.opponentId },
          select: { username: true },
        })
      : null;

    return NextResponse.json({
      status: "completed",
      yourScore: cappedScore,
      opponentScore: isChallenger ? opponentFinal : challengerFinal,
      won: winnerId === user.id,
      tied: winnerId === null,
      payout: winnerId === user.id ? winnerPayout : winnerId === null ? match.betAmount : 0,
      challenger: { username: challenger?.username, score: challengerFinal },
      opponent: { username: opponent?.username, score: opponentFinal },
    });
  }

  // Other player hasn't finished yet
  await prisma.multiplayerMatch.update({
    where: { id: matchId },
    data: updateData,
  });

  return NextResponse.json({
    status: "waiting_for_opponent",
    yourScore: cappedScore,
    message: "Score submitted! Waiting for opponent to finish...",
  });
}
