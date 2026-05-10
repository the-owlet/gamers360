import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { GAMES, getLevelInfo } from "@/lib/constants";
import { calculatePayout, RATE_LIMITS, computeRecentStats, type Difficulty } from "@/lib/gameEngine";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameSlug, score, won: clientWon, token } = await req.json();

  if (!gameSlug || score === undefined || !token) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const game = GAMES.find((g) => g.slug === gameSlug);
  if (!game) {
    return NextResponse.json({ error: "Invalid game" }, { status: 400 });
  }

  // Find and validate game session
  const session = await prisma.gameSession.findUnique({ where: { token } });

  if (!session) {
    return NextResponse.json({ error: "Invalid game session" }, { status: 400 });
  }

  if (session.userId !== user.id) {
    return NextResponse.json({ error: "Session mismatch" }, { status: 403 });
  }

  if (session.completed) {
    return NextResponse.json({ error: "Game already completed" }, { status: 409 });
  }

  if (session.gameSlug !== gameSlug) {
    return NextResponse.json({ error: "Game slug mismatch" }, { status: 400 });
  }

  if (new Date() > session.expiresAt) {
    await prisma.gameSession.update({
      where: { token },
      data: { completed: true },
    });
    return NextResponse.json({ error: "Game session expired" }, { status: 410 });
  }

  // Anti-cheat: game must have taken at least 3 seconds
  const elapsedMs = Date.now() - new Date(session.createdAt).getTime();
  if (elapsedMs < 3000) {
    await prisma.gameSession.update({
      where: { token },
      data: { completed: true },
    });
    return NextResponse.json({ error: "Game completed too quickly" }, { status: 400 });
  }

  // Determine win/loss from actual gameplay
  const cappedScore = Math.min(Math.max(0, score), game.maxPoints);
  let won = clientWon === true && cappedScore > 0;

  // If client says won but score is 0 or negative, override to loss
  if (won && cappedScore <= 0) {
    won = false;
  }

  // Anti-exploit: win streak cap — force a loss if on a long streak
  const recentHistory = await prisma.gameHistory.findMany({
    where: { userId: user.id, gameSlug },
    orderBy: { playedAt: "desc" },
    take: 20,
    select: { won: true, playedAt: true },
  });
  const stats = computeRecentStats(recentHistory);

  if (won && stats.currentStreak >= RATE_LIMITS.WIN_STREAK_CAP) {
    won = false;
  }

  // Anti-exploit: if suspicious win rate over many games, increase loss chance
  if (won && stats.recentGames >= RATE_LIMITS.SUSPICIOUS_MIN_GAMES &&
      stats.recentWinRate >= RATE_LIMITS.SUSPICIOUS_WIN_RATE_THRESHOLD) {
    won = false;
  }

  // Calculate payout with bet
  const levelInfo = getLevelInfo(user.xp);
  const difficulty = (game.difficulty as Difficulty) || "Easy";
  const bet = session.betAmount || 0;
  const payout = calculatePayout({
    won,
    gameMaxPoints: game.maxPoints,
    difficulty,
    levelMultiplier: levelInfo.earningMultiplier,
    score: cappedScore,
    betAmount: bet,
  });

  const today = new Date().toISOString().split("T")[0];
  const balanceChange = payout.points;

  // Atomic transaction: mark session complete, create history, update user + wallet
  const [, gameHistory, updatedUser] = await prisma.$transaction([
    prisma.gameSession.update({
      where: { token },
      data: { completed: true, won },
    }),
    prisma.gameHistory.create({
      data: {
        userId: user.id,
        gameSlug,
        score: cappedScore,
        pointsEarned: balanceChange,
        betAmount: bet,
        won,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        xp: { increment: payout.xp },
        totalGamesPlayed: { increment: 1 },
        totalWins: won ? { increment: 1 } : undefined,
        lastGameAt: new Date(),
      },
    }),
    prisma.wallet.update({
      where: { userId: user.id },
      data: {
        balance: { increment: balanceChange },
        totalEarned: balanceChange > 0 ? { increment: balanceChange } : undefined,
      },
    }),
  ]);

  // Update daily challenges
  const activeChallenges = await prisma.userDailyChallenge.findMany({
    where: { userId: user.id, date: today, completed: false },
  });
  for (const challenge of activeChallenges) {
    const shouldIncrement =
      challenge.challengeId === "play_any" ||
      (challenge.challengeId === "play_brain" && game.category === "brain") ||
      (challenge.challengeId === "play_luck" && game.category === "luck") ||
      (challenge.challengeId === "play_speed" && game.category === "speed") ||
      (challenge.challengeId === "win_any" && won);

    if (shouldIncrement) {
      const newProgress = challenge.progress + 1;
      await prisma.userDailyChallenge.update({
        where: { id: challenge.id },
        data: {
          progress: newProgress,
          completed: newProgress >= challenge.target,
        },
      });
    }
  }

  // Check achievements
  const newAchievements: string[] = [];
  const totalGames = updatedUser.totalGamesPlayed;
  const totalWins = updatedUser.totalWins;
  const achievementChecks = [
    { id: "first_game", condition: totalGames >= 1 },
    { id: "ten_games", condition: totalGames >= 10 },
    { id: "fifty_games", condition: totalGames >= 50 },
    { id: "hundred_games", condition: totalGames >= 100 },
    { id: "first_win", condition: totalWins >= 1 && won },
    { id: "ten_wins", condition: totalWins >= 10 },
  ];

  for (const check of achievementChecks) {
    if (check.condition) {
      const existing = await prisma.userAchievement.findUnique({
        where: { userId_achievementId: { userId: user.id, achievementId: check.id } },
      });
      if (!existing) {
        await prisma.userAchievement.create({
          data: { userId: user.id, achievementId: check.id },
        });
        newAchievements.push(check.id);
      }
    }
  }

  const newLevelInfo = getLevelInfo(updatedUser.xp);

  return NextResponse.json({
    won,
    pointsEarned: payout.points,
    betAmount: bet,
    betLoss: payout.betLoss,
    xpGained: payout.xp,
    newXp: updatedUser.xp,
    level: newLevelInfo.level,
    levelName: newLevelInfo.name,
    leveledUp: newLevelInfo.level > levelInfo.level,
    newAchievements,
    cooldown: 8,
    gameHistory: gameHistory.id,
  });
}
