import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

const REFERRAL_BONUS = 200;

export async function POST(req: NextRequest) {
  try {
    const { fullName, username, email, password, referralCode } = await req.json();

    if (!fullName || !username || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (fullName.trim().length < 3) {
      return NextResponse.json({ error: "Full name must be at least 3 characters" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: "Username must be 3-20 characters" }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: "Username can only contain letters, numbers, and underscores" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { username }] },
    });

    if (existing) {
      return NextResponse.json({ error: "Username or email already taken" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email: email.toLowerCase(),
        passwordHash,
        fullName: fullName.trim(),
        referredBy: referralCode || null,
        wallet: { create: {} },
      },
    });

    // Handle referral bonus
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
      });
      if (referrer) {
        await prisma.$transaction([
          prisma.wallet.update({
            where: { userId: referrer.id },
            data: { balance: { increment: REFERRAL_BONUS }, totalEarned: { increment: REFERRAL_BONUS } },
          }),
          prisma.wallet.update({
            where: { userId: user.id },
            data: { balance: { increment: REFERRAL_BONUS }, totalEarned: { increment: REFERRAL_BONUS } },
          }),
          prisma.user.update({
            where: { id: referrer.id },
            data: { referralCount: { increment: 1 } },
          }),
        ]);
      }
    }

    await createSession(user.id);

    return NextResponse.json({ success: true, user: { id: user.id, username: user.username } });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
