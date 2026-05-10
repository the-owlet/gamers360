import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") || "open";

  // Expire old waiting matches
  await prisma.multiplayerMatch.updateMany({
    where: { status: "waiting", expiresAt: { lt: new Date() } },
    data: { status: "expired" },
  });

  // Also expire active matches past their deadline and refund
  const expiredActive = await prisma.multiplayerMatch.findMany({
    where: { status: "active", expiresAt: { lt: new Date() } },
  });
  for (const m of expiredActive) {
    await prisma.$transaction(async (tx) => {
      await tx.multiplayerMatch.update({
        where: { id: m.id },
        data: { status: "expired" },
      });
      // Refund both players
      await tx.wallet.update({
        where: { userId: m.challengerId },
        data: { balance: { increment: m.betAmount } },
      });
      if (m.opponentId) {
        await tx.wallet.update({
          where: { userId: m.opponentId },
          data: { balance: { increment: m.betAmount } },
        });
      }
    });
  }

  if (filter === "open") {
    // Available challenges from other players
    const matches = await prisma.multiplayerMatch.findMany({
      where: {
        status: "waiting",
        challengerId: { not: user.id },
        expiresAt: { gt: new Date() },
      },
      include: {
        challenger: { select: { username: true, level: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ matches });
  }

  if (filter === "mine") {
    // User's own challenges (sent + received, active + waiting)
    const matches = await prisma.multiplayerMatch.findMany({
      where: {
        OR: [
          { challengerId: user.id },
          { opponentId: user.id },
        ],
        status: { in: ["waiting", "active", "completed"] },
      },
      include: {
        challenger: { select: { id: true, username: true, level: true, avatarUrl: true } },
        opponent: { select: { id: true, username: true, level: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json({ matches, userId: user.id });
  }

  if (filter === "match") {
    const matchId = url.searchParams.get("id");
    if (!matchId) {
      return NextResponse.json({ error: "Match ID required" }, { status: 400 });
    }

    const match = await prisma.multiplayerMatch.findUnique({
      where: { id: matchId },
      include: {
        challenger: { select: { id: true, username: true, level: true, avatarUrl: true } },
        opponent: { select: { id: true, username: true, level: true, avatarUrl: true } },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ match, userId: user.id });
  }

  return NextResponse.json({ error: "Invalid filter" }, { status: 400 });
}
