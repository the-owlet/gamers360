import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { MIN_WITHDRAWAL_POINTS, POINTS_PER_NAIRA } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount, bankAccountId } = await req.json();

  if (!amount || !bankAccountId) {
    return NextResponse.json({ error: "Amount and bank account are required" }, { status: 400 });
  }

  const bankAccount = await prisma.bankAccount.findFirst({
    where: { id: bankAccountId, userId: user.id },
  });

  if (!bankAccount) {
    return NextResponse.json({ error: "Bank account not found. Please add one first." }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { fullName: true },
  });

  if (dbUser?.fullName && bankAccount.accountName.toLowerCase().trim() !== dbUser.fullName.toLowerCase().trim()) {
    return NextResponse.json(
      { error: "Your account name must match your registered name. Update your bank account or contact support." },
      { status: 400 }
    );
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId: user.id },
  });

  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  if (wallet.balance < MIN_WITHDRAWAL_POINTS) {
    return NextResponse.json(
      { error: `Minimum withdrawal is ${MIN_WITHDRAWAL_POINTS} points (₦${MIN_WITHDRAWAL_POINTS / POINTS_PER_NAIRA})` },
      { status: 400 }
    );
  }

  if (amount > wallet.balance) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  if (amount < MIN_WITHDRAWAL_POINTS) {
    return NextResponse.json(
      { error: `Minimum withdrawal is ${MIN_WITHDRAWAL_POINTS} points` },
      { status: 400 }
    );
  }

  const accountDetails = {
    bankName: bankAccount.bankName,
    accountNumber: bankAccount.accountNumber,
    accountName: bankAccount.accountName,
  };

  const [withdrawal] = await prisma.$transaction([
    prisma.withdrawal.create({
      data: {
        userId: user.id,
        amount,
        method: "bank",
        accountDetails: JSON.stringify(accountDetails),
      },
    }),
    prisma.wallet.update({
      where: { userId: user.id },
      data: {
        balance: { decrement: amount },
        totalWithdrawn: { increment: amount },
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    withdrawal: withdrawal.id,
    nairaAmount: amount / POINTS_PER_NAIRA,
    bankName: bankAccount.bankName,
    accountName: bankAccount.accountName,
  });
}
