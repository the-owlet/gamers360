import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.bankAccount.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bankName, accountNumber, accountName } = await req.json();

  if (!bankName || !accountNumber || !accountName) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (accountNumber.length < 10 || accountNumber.length > 10) {
    return NextResponse.json({ error: "Account number must be 10 digits" }, { status: 400 });
  }

  const existing = await prisma.bankAccount.count({ where: { userId: user.id } });
  if (existing >= 3) {
    return NextResponse.json({ error: "Maximum 3 bank accounts allowed" }, { status: 400 });
  }

  const duplicate = await prisma.bankAccount.findFirst({
    where: { userId: user.id, accountNumber },
  });
  if (duplicate) {
    return NextResponse.json({ error: "This account number is already saved" }, { status: 400 });
  }

  const isFirst = existing === 0;

  const account = await prisma.bankAccount.create({
    data: {
      userId: user.id,
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
      isDefault: isFirst,
    },
  });

  return NextResponse.json({ account });
}

export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  const account = await prisma.bankAccount.findFirst({
    where: { id, userId: user.id },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  await prisma.bankAccount.delete({ where: { id } });

  if (account.isDefault) {
    const next = await prisma.bankAccount.findFirst({ where: { userId: user.id } });
    if (next) {
      await prisma.bankAccount.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  await prisma.bankAccount.updateMany({
    where: { userId: user.id },
    data: { isDefault: false },
  });

  await prisma.bankAccount.update({
    where: { id },
    data: { isDefault: true },
  });

  return NextResponse.json({ success: true });
}
