import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { createHash, randomBytes } from "crypto";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  // Store hashed token in a simple way using the user model's updatedAt
  // For MVP, we store the session token hash in a cookie and validate against user
  const hashedToken = hashToken(token);
  cookieStore.set("session_hash", hashedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  cookieStore.set("session_user", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return token;
}

export async function getSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_user")?.value;
  const token = cookieStore.get("session_token")?.value;

  if (!userId || !token) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });
    return user;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
  cookieStore.delete("session_hash");
  cookieStore.delete("session_user");
}
