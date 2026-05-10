"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";
import { GAMES } from "@/lib/constants";
import { useUser } from "@/hooks/useUser";

const VALID_BETS = [10, 25, 50, 100, 200];
const BET_OPTIONS = [
  { amount: 10, label: "10", icon: "🪙", color: "from-blue-500 to-blue-600" },
  { amount: 25, label: "25", icon: "💰", color: "from-purple-500 to-purple-600" },
  { amount: 50, label: "50", icon: "💎", color: "from-yellow-500 to-amber-500" },
  { amount: 100, label: "100", icon: "👑", color: "from-red-500 to-pink-600" },
  { amount: 200, label: "200", icon: "🏆", color: "from-orange-500 to-red-600" },
];

interface MatchData {
  id: string;
  gameSlug: string;
  betAmount: number;
  seed: number;
  challengerId: string;
  opponentId: string | null;
  challengerScore: number | null;
  opponentScore: number | null;
  challengerDone: boolean;
  opponentDone: boolean;
  winnerId: string | null;
  status: string;
  payout: number;
  expiresAt: string;
  createdAt: string;
  completedAt: string | null;
  challenger: { id?: string; username: string; level: number; avatarUrl: string };
  opponent?: { id?: string; username: string; level: number; avatarUrl: string } | null;
}

export default function MultiplayerPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState<"open" | "mine">("open");
  const [openMatches, setOpenMatches] = useState<MatchData[]>([]);
  const [myMatches, setMyMatches] = useState<MatchData[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createGame, setCreateGame] = useState("");
  const [createBet, setCreateBet] = useState(25);
  const [creating, setCreating] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState("");

  const multiplayerGames = GAMES.filter((g) => g.category === "skill");

  const fetchMatches = useCallback(async () => {
    try {
      const [openRes, mineRes] = await Promise.all([
        fetch("/api/multiplayer/list?filter=open"),
        fetch("/api/multiplayer/list?filter=mine"),
      ]);
      if (openRes.ok) {
        const data = await openRes.json();
        setOpenMatches(data.matches || []);
      }
      if (mineRes.ok) {
        const data = await mineRes.json();
        setMyMatches(data.matches || []);
        if (data.userId) setUserId(data.userId);
      }
    } catch {
      // silent
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && user) {
      fetchMatches();
      const interval = setInterval(fetchMatches, 15000);
      return () => clearInterval(interval);
    }
  }, [userLoading, user, fetchMatches]);

  async function handleCreate() {
    if (!createGame) {
      setError("Select a game first");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/multiplayer/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug: createGame, betAmount: createBet }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create challenge");
        return;
      }
      setShowCreate(false);
      setTab("mine");
      fetchMatches();
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  }

  async function handleAccept(matchId: string) {
    setAccepting(matchId);
    setError("");
    try {
      const res = await fetch("/api/multiplayer/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to accept");
        setAccepting(null);
        return;
      }
      router.push(`/games/${data.gameSlug}?matchId=${data.matchId}`);
    } catch {
      setError("Network error");
      setAccepting(null);
    }
  }

  async function handleCancel(matchId: string) {
    setCancelling(matchId);
    setError("");
    try {
      const res = await fetch("/api/multiplayer/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to cancel");
      }
      fetchMatches();
    } catch {
      setError("Network error");
    } finally {
      setCancelling(null);
    }
  }

  function getGame(slug: string) {
    return GAMES.find((g) => g.slug === slug);
  }

  function timeLeft(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs}s`;
  }

  function getMatchAction(match: MatchData) {
    const isChallenger = match.challengerId === userId;
    const isOpponent = match.opponentId === userId;

    if (match.status === "waiting" && isChallenger) {
      return (
        <button
          onClick={() => handleCancel(match.id)}
          disabled={cancelling === match.id}
          className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
        >
          {cancelling === match.id ? "..." : "Cancel"}
        </button>
      );
    }

    if (match.status === "active") {
      const myDone = isChallenger ? match.challengerDone : match.opponentDone;
      if (!myDone) {
        return (
          <Link
            href={`/games/${match.gameSlug}?matchId=${match.id}`}
            className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold hover:opacity-90 transition"
          >
            Play Now
          </Link>
        );
      }
      return (
        <span className="text-xs text-yellow-400 animate-pulse">Waiting for opponent...</span>
      );
    }

    if (match.status === "completed") {
      const won = match.winnerId === userId;
      const tied = match.winnerId === null;
      return (
        <span className={`text-xs font-bold ${won ? "text-green-400" : tied ? "text-yellow-400" : "text-red-400"}`}>
          {won ? `Won +${match.payout}` : tied ? "Tie - Refunded" : "Lost"}
        </span>
      );
    }

    return null;
  }

  if (userLoading) {
    return (
      <>
        <Navbar />
        <ParticleBackground />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-2xl animate-spin">🎮</div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <ParticleBackground />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="glass rounded-2xl p-8 text-center max-w-md">
            <div className="text-5xl mb-4">🎮</div>
            <h1 className="text-2xl font-black mb-2">Multiplayer Arena</h1>
            <p className="text-gray-400 mb-6">Login to challenge other players and bet your earned points!</p>
            <Link href="/login" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 transition">
              Login to Play
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <ParticleBackground />
      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
              Multiplayer Arena
            </span>
          </h1>
          <p className="text-gray-400 text-sm">Challenge other players, bet your points, winner takes all!</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 bg-gray-800/80 px-3 py-1.5 rounded-full">
              <span className="text-yellow-400 text-sm">💰</span>
              <span className="text-sm font-bold text-yellow-400">{(user.wallet?.balance ?? 0).toLocaleString()}</span>
              <span className="text-xs text-gray-500">pts</span>
            </div>
          </div>
        </div>

        {/* Create Challenge Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowCreate(true)}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 transition shadow-lg shadow-orange-500/20 flex items-center gap-2"
          >
            <span className="text-lg">+</span> Create Challenge
          </button>
        </div>

        {/* Create Challenge Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-black/60" onClick={() => setShowCreate(false)} />
            <div className="glass rounded-2xl p-6 max-w-md w-full relative z-10 animate-slide-up">
              <h2 className="text-xl font-black mb-4 text-center">Create Challenge</h2>

              {/* Game Selection */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Select Game</label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {multiplayerGames.slice(0, 30).map((game) => (
                    <button
                      key={game.slug}
                      onClick={() => setCreateGame(game.slug)}
                      className={`p-2 rounded-lg border-2 transition-all text-center ${
                        createGame === game.slug
                          ? "border-yellow-400 bg-yellow-400/10"
                          : "border-white/5 hover:border-white/20 bg-gray-800/50"
                      }`}
                    >
                      <div className="text-lg">{game.icon}</div>
                      <div className="text-[10px] text-gray-300 truncate">{game.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bet Amount */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Bet Amount</label>
                <div className="grid grid-cols-5 gap-2">
                  {BET_OPTIONS.map((bet) => (
                    <button
                      key={bet.amount}
                      onClick={() => setCreateBet(bet.amount)}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        createBet === bet.amount
                          ? "border-yellow-400 bg-yellow-400/10"
                          : "border-white/5 hover:border-white/20 bg-gray-800/50"
                      }`}
                    >
                      <div className="text-sm">{bet.icon}</div>
                      <div className="text-xs font-bold text-white">{bet.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="bg-gray-800/50 rounded-lg p-3 mb-4 text-xs text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Your bet:</span>
                  <span className="text-yellow-400 font-bold">{createBet} pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Opponent matches:</span>
                  <span className="text-yellow-400 font-bold">{createBet} pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Total pot:</span>
                  <span className="text-green-400 font-bold">{createBet * 2} pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Winner gets (after 5% fee):</span>
                  <span className="text-green-400 font-bold">{createBet * 2 - Math.floor(createBet * 2 * 0.05)} pts</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-2 mb-3 text-center">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCreate(false); setError(""); }}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !createGame}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold hover:opacity-90 transition disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Challenge!"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("open")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
              tab === "open"
                ? "bg-gradient-to-r from-yellow-400/10 to-orange-400/10 text-yellow-400 border border-yellow-400/20"
                : "glass text-gray-400 hover:text-white"
            }`}
          >
            Open Challenges ({openMatches.length})
          </button>
          <button
            onClick={() => setTab("mine")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
              tab === "mine"
                ? "bg-gradient-to-r from-yellow-400/10 to-orange-400/10 text-yellow-400 border border-yellow-400/20"
                : "glass text-gray-400 hover:text-white"
            }`}
          >
            My Matches ({myMatches.length})
          </button>
        </div>

        {/* Error */}
        {error && !showCreate && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 text-center mb-4">
            {error}
          </div>
        )}

        {/* Matches List */}
        {loadingMatches ? (
          <div className="text-center py-12">
            <div className="text-3xl animate-spin inline-block mb-3">🎮</div>
            <div className="text-gray-400 text-sm">Loading matches...</div>
          </div>
        ) : tab === "open" ? (
          openMatches.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">🏟️</div>
              <h3 className="text-lg font-bold mb-2">No Open Challenges</h3>
              <p className="text-gray-400 text-sm mb-4">Be the first to throw down a challenge!</p>
              <button
                onClick={() => setShowCreate(true)}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition"
              >
                Create Challenge
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {openMatches.map((match) => {
                const game = getGame(match.gameSlug);
                return (
                  <div key={match.id} className="glass rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{game?.icon || "🎮"}</div>
                      <div>
                        <div className="font-bold text-sm">{game?.name || match.gameSlug}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{match.challenger.avatarUrl || "🎮"} {match.challenger.username}</span>
                          <span className="text-gray-600">LV{match.challenger.level}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-yellow-400 font-bold text-sm">{match.betAmount} pts</div>
                        <div className="text-[10px] text-gray-500">{timeLeft(match.expiresAt)}</div>
                      </div>
                      <button
                        onClick={() => handleAccept(match.id)}
                        disabled={accepting === match.id}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-400 to-emerald-500 text-black font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
                      >
                        {accepting === match.id ? "..." : `Accept (${match.betAmount} pts)`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : myMatches.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-lg font-bold mb-2">No Matches Yet</h3>
            <p className="text-gray-400 text-sm mb-4">Create a challenge or accept one from the open tab!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myMatches.map((match) => {
              const game = getGame(match.gameSlug);
              const isChallenger = match.challengerId === userId;
              const opponent = isChallenger ? match.opponent : match.challenger;

              return (
                <div key={match.id} className={`glass rounded-xl p-4 ${
                  match.status === "completed" ? "opacity-80" : ""
                }`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{game?.icon || "🎮"}</div>
                      <div>
                        <div className="font-bold text-sm flex items-center gap-2">
                          {game?.name || match.gameSlug}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            match.status === "waiting" ? "bg-yellow-400/10 text-yellow-400" :
                            match.status === "active" ? "bg-green-400/10 text-green-400" :
                            match.status === "completed" ? "bg-gray-400/10 text-gray-400" :
                            "bg-red-400/10 text-red-400"
                          }`}>
                            {match.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {match.status === "waiting" ? (
                            <span>Waiting for opponent...</span>
                          ) : opponent ? (
                            <span>vs {opponent.avatarUrl || "🎮"} {opponent.username} (LV{opponent.level})</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-yellow-400 font-bold text-sm">{match.betAmount} pts</div>
                        {match.status !== "completed" && (
                          <div className="text-[10px] text-gray-500">{timeLeft(match.expiresAt)}</div>
                        )}
                      </div>
                      {getMatchAction(match)}
                    </div>
                  </div>

                  {/* Score display for completed matches */}
                  {match.status === "completed" && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-gray-500">{match.challenger.username}: </span>
                          <span className="font-bold text-white">{match.challengerScore ?? 0}</span>
                        </div>
                        <span className="text-gray-600">vs</span>
                        <div>
                          <span className="text-gray-500">{match.opponent?.username ?? "?"}: </span>
                          <span className="font-bold text-white">{match.opponentScore ?? 0}</span>
                        </div>
                      </div>
                      <div className={`font-bold ${
                        match.winnerId === userId ? "text-green-400" :
                        match.winnerId === null ? "text-yellow-400" :
                        "text-red-400"
                      }`}>
                        {match.winnerId === userId ? `Won +${match.payout}` :
                         match.winnerId === null ? "Tie" :
                         `-${match.betAmount}`}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* How it works */}
        <div className="glass rounded-2xl p-6 mt-8">
          <h3 className="text-lg font-black mb-4 text-center">How Multiplayer Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm">
            <div className="space-y-2">
              <div className="text-2xl">1. Challenge</div>
              <p className="text-gray-400">Pick a game and bet amount. Your bet is locked in escrow.</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">2. Play</div>
              <p className="text-gray-400">Both players play the same game with identical conditions. Highest score wins!</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">3. Win</div>
              <p className="text-gray-400">Winner takes the pot (minus 5% fee). Ties get a full refund.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
