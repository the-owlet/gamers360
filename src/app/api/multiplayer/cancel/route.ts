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

  if (match.challengerId !== user.id) {
    return NextResponse.json({ error: "Only the challenger can cancel" }, { status: 403 });
  }

  if (match.status !== "waiting") {
    return NextResponse.json({ error: "Can only cancel waiting challenges" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.multiplayerMatch.update({
      where: { id: matchId },
      data: { status: "cancelled" },
    });
    await tx.wallet.update({
      where: { userId: user.id },
      data: { balance: { increment: match.betAmount } },
    });
  });

  return NextResponse.json({ success: true, refunded: match.betAmount });
}
