"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";
import Confetti from "@/components/Confetti";
import AdBanner from "@/components/AdBanner";
import RewardedAd from "@/components/RewardedAd";
import { useUser } from "@/hooks/useUser";
import { useSound } from "@/hooks/useSound";
import { useToast } from "@/components/Toast";
import { POINTS_PER_NAIRA, MIN_WITHDRAWAL_POINTS, ACHIEVEMENTS, GAMES } from "@/lib/constants";
import ShareEarnings from "@/components/ShareEarnings";

interface Challenge {
  id: string;
  challengeId: string;
  name: string;
  icon: string;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  reward: number;
}

export default function DashboardPage() {
  const { user, loading, mutate } = useUser();
  const router = useRouter();
  const { play } = useSound();
  const { showToast } = useToast();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [dailyReward, setDailyReward] = useState<{ reward: number; streak: number } | null>(null);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState<{ nairaAmount: number; bankName: string; accountName: string } | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [calcPoints, setCalcPoints] = useState("");
  const [bankAccounts, setBankAccounts] = useState<{ id: string; bankName: string; accountNumber: string; accountName: string; isDefault: boolean }[]>([]);
  const [showAddBank, setShowAddBank] = useState(false);
  const [bankForm, setBankForm] = useState({ bankName: "", accountNumber: "", accountName: "" });
  const [bankError, setBankError] = useState("");
  const [bankLoading, setBankLoading] = useState(false);
  const [mpMatches, setMpMatches] = useState<any[]>([]);

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const today = new Date().toISOString().split("T")[0];
      setDailyClaimed(user.lastRewardDate === today);
      fetch("/api/challenges").then(r => r.json()).then(d => setChallenges(d.challenges || [])).catch(() => {});
      fetch("/api/multiplayer/list?filter=mine").then(r => r.json()).then(d => {
        setMpMatches(d.matches || []);
      }).catch(() => {});
      fetchBankAccounts();
    }
  }, [user]);

  function fetchBankAccounts() {
    fetch("/api/bank-accounts").then(r => r.json()).then(d => {
      setBankAccounts(d.accounts || []);
      const def = (d.accounts || []).find((a: { isDefault: boolean }) => a.isDefault);
      if (def) setSelectedBankId(def.id);
    }).catch(() => {});
  }

  async function claimDaily() {
    setClaimingDaily(true);
    try {
      const res = await fetch("/api/daily-reward", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setDailyReward(data);
        setDailyClaimed(true);
        setShowConfetti(true);
        play("coin");
        play("streak");
        showToast(`+${data.reward} daily points!`, "🎁", "success");
        setTimeout(() => setShowConfetti(false), 3000);
        mutate();
      }
    } catch {} finally { setClaimingDaily(false); }
  }

  async function claimChallenge(challengeId: string) {
    const res = await fetch("/api/challenges/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId }),
    });
    if (res.ok) {
      const data = await res.json();
      play("win");
      showToast(`+${data.reward} challenge bonus!`, "🏆", "success");
      setChallenges(prev => prev.map(c => c.challengeId === challengeId ? { ...c, claimed: true } : c));
      mutate();
    }
  }

  function copyReferral() {
    if (!user) return;
    const url = `${window.location.origin}/signup?ref=${user.referralCode}`;
    navigator.clipboard.writeText(url);
    setReferralCopied(true);
    play("pop");
    showToast("Referral link copied!", "📋", "success");
    setTimeout(() => setReferralCopied(false), 2000);
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWithdrawError("");
    setWithdrawLoading(true);
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount < MIN_WITHDRAWAL_POINTS) {
      setWithdrawError(`Minimum is ${MIN_WITHDRAWAL_POINTS} pts (₦${MIN_WITHDRAWAL_POINTS / POINTS_PER_NAIRA})`);
      setWithdrawLoading(false); return;
    }
    if (!selectedBankId) {
      setWithdrawError("Please select a bank account or add one first");
      setWithdrawLoading(false); return;
    }
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, bankAccountId: selectedBankId }),
      });
      const data = await res.json();
      if (!res.ok) { setWithdrawError(data.error); return; }
      setWithdrawSuccess({ nairaAmount: data.nairaAmount, bankName: data.bankName, accountName: data.accountName });
      play("coin"); mutate();
    } catch { setWithdrawError("Something went wrong"); }
    finally { setWithdrawLoading(false); }
  }

  async function addBankAccount(e: React.FormEvent) {
    e.preventDefault();
    setBankError("");
    setBankLoading(true);
    try {
      const res = await fetch("/api/bank-accounts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bankForm),
      });
      const data = await res.json();
      if (!res.ok) { setBankError(data.error); return; }
      setBankForm({ bankName: "", accountNumber: "", accountName: "" });
      setShowAddBank(false);
      showToast("Bank account saved!", "🏦", "success");
      play("coin");
      fetchBankAccounts();
    } catch { setBankError("Something went wrong"); }
    finally { setBankLoading(false); }
  }

  async function deleteBankAccount(id: string) {
    const res = await fetch("/api/bank-accounts", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      showToast("Bank account removed", "🗑️", "success");
      fetchBankAccounts();
    }
  }

  async function setDefaultBank(id: string) {
    await fetch("/api/bank-accounts", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchBankAccounts();
    showToast("Default account updated", "✅", "success");
  }

  if (loading || !user) {
    return (<><Navbar /><main className="flex-1 flex items-center justify-center"><div className="text-gray-400 animate-pulse">Loading...</div></main></>);
  }

  const unlockedAchievements = ACHIEVEMENTS.filter(a => user.achievements.includes(a.id));
  const lockedAchievements = ACHIEVEMENTS.filter(a => !user.achievements.includes(a.id));

  return (
    <>
      <ParticleBackground />
      <Confetti active={showConfetti} />
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>
              <span className="text-3xl mr-2">{user.avatarUrl}</span>
              <span className="text-yellow-400">{user.username}</span>
            </h1>
            <p className="text-gray-500">Level {user.level} {user.levelName}</p>
          </div>
          <div className="flex items-center gap-3">
            <ShareEarnings
              points={user.wallet?.totalEarned ?? 0}
              level={user.level}
              gamesPlayed={user.totalGamesPlayed}
              totalWins={user.totalWins}
            />
          {user.loginStreak > 0 && (
            <div className="flex items-center gap-2 glass rounded-full px-4 py-2">
              <span className="animate-streak text-xl">🔥</span>
              <span className="text-orange-400 font-bold">{user.loginStreak} day streak</span>
            </div>
          )}
          </div>
        </div>

        {/* Daily Reward */}
        {!dailyClaimed ? (
          <div className="glass rounded-2xl p-6 mb-6 border border-yellow-400/20 bg-gradient-to-r from-yellow-400/5 to-orange-400/5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl animate-bounce">🎁</div>
                <div><h2 className="font-bold text-lg" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>Daily Reward Available!</h2><p className="text-gray-400 text-sm">Claim your free bonus</p></div>
              </div>
              <button onClick={claimDaily} disabled={claimingDaily}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 transition shadow-lg shadow-orange-500/20 disabled:opacity-50">
                {claimingDaily ? "Claiming..." : "Claim Now"}
              </button>
            </div>
          </div>
        ) : dailyReward ? (
          <div className="glass rounded-2xl p-4 mb-6 border border-green-400/20 text-center animate-slide-up">
            <span className="text-green-400 font-bold">✅ +{dailyReward.reward} pts claimed! Day {dailyReward.streak} streak</span>
          </div>
        ) : null}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Balance", value: (user.wallet?.balance ?? 0).toLocaleString(), sub: `₦${((user.wallet?.balance ?? 0) / POINTS_PER_NAIRA).toLocaleString()}`, icon: "💰", color: "text-yellow-400" },
            { label: "Level", value: `${user.level}`, sub: user.levelName, icon: "⭐", color: "text-orange-400" },
            { label: "Games", value: `${user.totalGamesPlayed}`, sub: `${user.totalWins} wins`, icon: "🎮", color: "text-blue-400" },
            { label: "Earned", value: (user.wallet?.totalEarned ?? 0).toLocaleString(), sub: "lifetime pts", icon: "📈", color: "text-green-400" },
          ].map(s => (
            <div key={s.label} className="glass rounded-2xl p-5 card-hover">
              <div className="flex items-center justify-between mb-2"><span className="text-gray-500 text-sm">{s.label}</span><span className="text-xl">{s.icon}</span></div>
              <div className={`text-2xl sm:text-3xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-gray-600 text-xs mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* XP Bar */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold">⭐ Level {user.level} — {user.levelName}</span>
            <span className="text-gray-400 text-sm font-mono">{user.xp.toLocaleString()} XP</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-4 mb-2 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 h-4 rounded-full transition-all duration-1000 relative" style={{ width: `${Math.min(user.progress, 100)}%` }}>
              <div className="absolute inset-0 animate-shimmer" />
            </div>
          </div>
          <div className="text-gray-600 text-sm">{user.xpToNext > 0 ? `${user.xpToNext.toLocaleString()} XP to Level ${user.level + 1}` : "Max level! 👑"}</div>
        </div>

        {/* Daily Challenges */}
        {challenges.length > 0 && (
          <div className="glass rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>🎯 Daily Challenges</h2>
            <div className="space-y-3">
              {challenges.map(c => (
                <div key={c.id} className={`flex items-center gap-4 p-3 rounded-xl ${c.completed ? "bg-green-400/5 border border-green-400/20" : "bg-gray-800/50"}`}>
                  <span className="text-2xl">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{c.name}</div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1.5">
                      <div className={`h-2 rounded-full transition-all ${c.completed ? "bg-green-400" : "bg-yellow-400"}`} style={{ width: `${Math.min((c.progress / c.target) * 100, 100)}%` }} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{c.progress}/{c.target}</div>
                  </div>
                  <div className="text-right shrink-0">
                    {c.claimed ? (
                      <span className="text-green-400 text-xs font-bold">✅ Claimed</span>
                    ) : c.completed ? (
                      <button onClick={() => claimChallenge(c.challengeId)} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition">
                        Claim {c.reward}pts
                      </button>
                    ) : (
                      <span className="text-yellow-400 text-xs font-bold">{c.reward} pts</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <RewardedAd />

        <AdBanner slot="dashboard-mid" className="mb-8 mt-8" />

        {/* Actions */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Link href="/games" className="glass rounded-2xl p-6 text-center card-hover border border-yellow-400/10 group">
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🎮</div>
            <span className="text-lg font-bold text-yellow-400">Play & Earn</span>
          </Link>
          <Link href="/multiplayer" className="glass rounded-2xl p-6 text-center card-hover border border-purple-400/10 group relative overflow-hidden">
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-purple-500/20 to-orange-500/20 pointer-events-none" />
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">⚔️</div>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">Challenge Friends</span>
          </Link>
          <button onClick={() => setShowWithdraw(!showWithdraw)} disabled={(user.wallet?.balance ?? 0) < MIN_WITHDRAWAL_POINTS}
            className="glass rounded-2xl p-6 text-center card-hover border border-green-400/10 disabled:opacity-40 disabled:cursor-not-allowed group">
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">💳</div>
            <span className="text-lg font-bold text-green-400">
              {(user.wallet?.balance ?? 0) < MIN_WITHDRAWAL_POINTS ? `${(MIN_WITHDRAWAL_POINTS - (user.wallet?.balance ?? 0)).toLocaleString()} pts to withdraw` : "Withdraw"}
            </span>
          </button>
        </div>

        {/* Points to Naira Converter */}
        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>💱 Points to Naira</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-400 mb-3">Conversion Rate</div>
              <div className="flex items-center gap-3 mb-4">
                <div className="glass rounded-xl px-4 py-3 text-center flex-1">
                  <div className="text-xl font-black text-yellow-400">10</div>
                  <div className="text-xs text-gray-500">Points</div>
                </div>
                <span className="text-gray-500 text-xl">=</span>
                <div className="glass rounded-xl px-4 py-3 text-center flex-1">
                  <div className="text-xl font-black text-green-400">₦1</div>
                  <div className="text-xs text-gray-500">Naira</div>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Your Balance</span>
                  <span className="text-yellow-400 font-bold">{(user.wallet?.balance ?? 0).toLocaleString()} pts</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Worth in Naira</span>
                  <span className="text-green-400 font-bold">₦{((user.wallet?.balance ?? 0) / POINTS_PER_NAIRA).toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-700 pt-2 flex justify-between text-sm">
                  <span className="text-gray-400">Min. Withdrawal</span>
                  <span className="text-gray-300">{MIN_WITHDRAWAL_POINTS.toLocaleString()} pts (₦{(MIN_WITHDRAWAL_POINTS / POINTS_PER_NAIRA).toLocaleString()})</span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-3">Quick Calculator</div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Enter Points</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 5000"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                    value={calcPoints}
                    onChange={e => setCalcPoints(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 text-gray-500"><span>↓</span><span className="text-xs">converts to</span></div>
                <div className="bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3 text-center">
                  <div className="text-2xl font-black text-green-400">₦{((parseInt(calcPoints) || 0) / POINTS_PER_NAIRA).toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">Nigerian Naira</div>
                </div>
              </div>
              {(user.wallet?.balance ?? 0) >= MIN_WITHDRAWAL_POINTS && (
                <button
                  onClick={() => setShowWithdraw(true)}
                  className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition shadow-lg shadow-green-500/20"
                >
                  Withdraw ₦{((user.wallet?.balance ?? 0) / POINTS_PER_NAIRA).toLocaleString()} →
                </button>
              )}
              {(user.wallet?.balance ?? 0) < MIN_WITHDRAWAL_POINTS && (
                <div className="mt-4 bg-yellow-400/5 border border-yellow-400/10 rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-400">
                    Need <span className="text-yellow-400 font-bold">{(MIN_WITHDRAWAL_POINTS - (user.wallet?.balance ?? 0)).toLocaleString()}</span> more points to withdraw
                  </div>
                  <Link href="/games" className="text-yellow-400 text-xs font-bold hover:underline mt-1 inline-block">Play games to earn →</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Saved Bank Accounts */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>🏦 Bank Accounts</h2>
            {bankAccounts.length < 3 && (
              <button onClick={() => setShowAddBank(!showAddBank)} className="text-yellow-400 text-sm font-bold hover:underline">
                {showAddBank ? "Cancel" : "+ Add Account"}
              </button>
            )}
          </div>

          {bankAccounts.length === 0 && !showAddBank && (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🏦</div>
              <p className="text-gray-400 text-sm mb-3">No bank accounts saved yet</p>
              <button onClick={() => setShowAddBank(true)} className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition text-sm">
                Add Bank Account
              </button>
            </div>
          )}

          {bankAccounts.length > 0 && (
            <div className="space-y-3 mb-4">
              {bankAccounts.map(acc => (
                <div key={acc.id} className={`flex items-center gap-4 p-4 rounded-xl border transition ${acc.isDefault ? "bg-green-400/5 border-green-400/20" : "bg-gray-800/50 border-gray-700/50"}`}>
                  <div className="text-2xl">🏦</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm flex items-center gap-2">
                      {acc.bankName}
                      {acc.isDefault && <span className="text-[10px] bg-green-400/20 text-green-400 px-2 py-0.5 rounded-full">DEFAULT</span>}
                    </div>
                    <div className="text-gray-400 text-xs">{acc.accountNumber} &middot; {acc.accountName}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!acc.isDefault && (
                      <button onClick={() => setDefaultBank(acc.id)} className="text-xs text-gray-500 hover:text-yellow-400 transition">Set Default</button>
                    )}
                    <button onClick={() => deleteBankAccount(acc.id)} className="text-xs text-gray-500 hover:text-red-400 transition">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showAddBank && (
            <form onSubmit={addBankAccount} className="space-y-3 animate-slide-up">
              <div className="text-sm text-gray-400 mb-1">Add New Bank Account</div>
              <input type="text" required placeholder="Bank Name (e.g. GTBank, Access Bank)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 text-sm" value={bankForm.bankName} onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })} />
              <input type="text" required placeholder="Account Number (10 digits)" maxLength={10} pattern="[0-9]{10}" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 text-sm" value={bankForm.accountNumber} onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })} />
              <input type="text" required placeholder="Account Name (as shown on account)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 text-sm" value={bankForm.accountName} onChange={e => setBankForm({ ...bankForm, accountName: e.target.value })} />
              {bankError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3">{bankError}</div>}
              <button type="submit" disabled={bankLoading} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm">
                {bankLoading ? "Saving..." : "Save Bank Account"}
              </button>
            </form>
          )}

          <p className="text-gray-600 text-xs mt-3">You can save up to 3 bank accounts. Your default account is used for withdrawals.</p>
        </div>

        {/* Withdrawal */}
        {showWithdraw && (
          <div className="glass rounded-2xl p-6 mb-8 animate-slide-up">
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>💳 Withdraw to Bank</h2>
            <p className="text-gray-500 text-sm mb-4">Available: <span className="text-green-400 font-bold">₦{((user.wallet?.balance ?? 0) / POINTS_PER_NAIRA).toLocaleString()}</span> ({(user.wallet?.balance ?? 0).toLocaleString()} pts)</p>
            {withdrawSuccess ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4 animate-bounce">✅</div>
                <h3 className="text-xl font-bold text-green-400 mb-2">Withdrawal Requested!</h3>
                <p className="text-white font-medium mb-1">₦{withdrawSuccess.nairaAmount.toLocaleString()} → {withdrawSuccess.bankName}</p>
                <p className="text-gray-400 text-sm mb-1">{withdrawSuccess.accountName}</p>
                <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3 mt-4 inline-block">
                  <p className="text-yellow-400 text-sm font-bold">⏱ Processing within 1-12 hours</p>
                </div>
                <div className="mt-4">
                  <button onClick={() => { setShowWithdraw(false); setWithdrawSuccess(null); setWithdrawAmount(""); }} className="text-yellow-400 hover:underline text-sm">Close</button>
                </div>
              </div>
            ) : bankAccounts.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">⚠️</div>
                <p className="text-gray-400 text-sm mb-3">Add a bank account first before withdrawing</p>
                <button onClick={() => { setShowWithdraw(false); setShowAddBank(true); }} className="text-yellow-400 font-bold hover:underline text-sm">
                  Add Bank Account ↑
                </button>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Amount (in points)</label>
                  <input type="number" required min={MIN_WITHDRAWAL_POINTS} max={user.wallet?.balance ?? 0} placeholder={`Min ${MIN_WITHDRAWAL_POINTS.toLocaleString()} pts`}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)} />
                  {withdrawAmount && parseInt(withdrawAmount) > 0 && (
                    <div className="text-sm text-green-400 mt-1 ml-1 font-bold">
                      = ₦{(parseInt(withdrawAmount) / POINTS_PER_NAIRA).toLocaleString()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Send to</label>
                  <div className="space-y-2">
                    {bankAccounts.map(acc => (
                      <label key={acc.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${selectedBankId === acc.id ? "bg-green-400/10 border-green-400/30" : "bg-gray-800/50 border-gray-700 hover:border-gray-600"}`}>
                        <input type="radio" name="bankAccount" value={acc.id} checked={selectedBankId === acc.id} onChange={() => setSelectedBankId(acc.id)} className="accent-green-400" />
                        <div className="flex-1">
                          <div className="text-sm font-bold">{acc.bankName}</div>
                          <div className="text-xs text-gray-500">{acc.accountNumber} &middot; {acc.accountName}</div>
                        </div>
                        {acc.isDefault && <span className="text-[10px] bg-green-400/20 text-green-400 px-2 py-0.5 rounded-full">DEFAULT</span>}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-3 text-xs text-gray-400 space-y-1">
                  <div className="flex justify-between"><span>Processing time</span><span className="text-white font-bold">1-12 hours</span></div>
                  <div className="flex justify-between"><span>Fee</span><span className="text-green-400 font-bold">Free</span></div>
                </div>

                {withdrawError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3">{withdrawError}</div>}
                <button type="submit" disabled={withdrawLoading || !selectedBankId} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50">
                  {withdrawLoading ? "Processing..." : `Withdraw${withdrawAmount && parseInt(withdrawAmount) > 0 ? ` ₦${(parseInt(withdrawAmount) / POINTS_PER_NAIRA).toLocaleString()}` : ""}`}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Referral */}
        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>🤝 Invite Friends</h2>
          <p className="text-gray-500 text-sm mb-4">Both you and your friend get <span className="text-yellow-400 font-bold">200 bonus points</span>!</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-800 rounded-lg px-4 py-3 text-sm text-gray-400 truncate font-mono">
              {typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${user.referralCode}` : `...signup?ref=${user.referralCode}`}
            </div>
            <button onClick={copyReferral} className="bg-yellow-400/20 text-yellow-400 font-bold px-4 rounded-lg hover:bg-yellow-400/30 transition text-sm whitespace-nowrap">
              {referralCopied ? "Copied!" : "Copy"}
            </button>
          </div>
          {user.referralCount > 0 && (
            <p className="text-gray-500 text-sm mt-3">👥 {user.referralCount} friends referred</p>
          )}
        </div>

        {/* Recent Games */}
        {user.recentGames && user.recentGames.length > 0 && (
          <div className="glass rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>📜 Recent Games</h2>
            <div className="space-y-2">
              {user.recentGames.map((g: { gameSlug: string; score: number; pointsEarned: number; won: boolean; playedAt: string }, i: number) => {
                const game = GAMES.find(gm => gm.slug === g.gameSlug);
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-800/30">
                    <span className="text-xl">{game?.icon || "🎮"}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{game?.name || g.gameSlug}</span>
                      <span className={`ml-2 text-xs ${g.won ? "text-green-400" : "text-gray-500"}`}>{g.won ? "WIN" : "played"}</span>
                    </div>
                    <span className="text-yellow-400 text-sm font-bold">+{g.pointsEarned}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Multiplayer Matches */}
        {mpMatches.length > 0 && (
          <div className="glass rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>⚔️ Recent Matches</h2>
              <Link href="/multiplayer" className="text-purple-400 text-sm font-bold hover:underline">New Challenge →</Link>
            </div>
            <div className="space-y-2">
              {mpMatches.slice(0, 10).map((m: any) => {
                const game = GAMES.find(gm => gm.slug === m.gameSlug);
                const isChallenger = user.id === m.challengerId;
                const opponent = isChallenger ? m.opponent : m.challenger;
                const myScore = isChallenger ? m.challengerScore : m.opponentScore;
                const theirScore = isChallenger ? m.opponentScore : m.challengerScore;
                const myDone = isChallenger ? m.challengerDone : m.opponentDone;
                const isWinner = m.status === "completed" && m.winnerId === user.id;
                const isLoser = m.status === "completed" && m.winnerId && m.winnerId !== user.id;
                const isTie = m.status === "completed" && !m.winnerId;
                const canPlay = m.status === "active" && !myDone;

                return (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30">
                    <span className="text-xl">{game?.icon || "🎮"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{game?.name || m.gameSlug}</span>
                        <span className="text-xs text-gray-500">vs</span>
                        <span className="text-sm font-medium text-gray-300">{opponent?.username || "???"}</span>
                      </div>
                      {m.status === "completed" && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {myScore} - {theirScore}
                          {m.payout > 0 && (
                            <span className="ml-2 text-yellow-400 font-bold">+{m.payout} pts</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {m.status === "waiting" && (
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-yellow-400/10 text-yellow-400 font-bold">Waiting</span>
                      )}
                      {m.status === "active" && !canPlay && (
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-400/10 text-blue-400 font-bold">Active</span>
                      )}
                      {canPlay && (
                        <Link href={`/games/${m.gameSlug}?match=${m.id}`} className="text-[11px] px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-orange-500 text-white font-bold hover:opacity-90 transition">
                          Play Now
                        </Link>
                      )}
                      {isWinner && (
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-green-400/10 text-green-400 font-bold">Win</span>
                      )}
                      {isLoser && (
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-red-400/10 text-red-400 font-bold">Loss</span>
                      )}
                      {isTie && (
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-400/10 text-gray-400 font-bold">Tie</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>🏅 Achievements <span className="text-gray-500 text-sm font-normal">({unlockedAchievements.length}/{ACHIEVEMENTS.length})</span></h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {unlockedAchievements.map(a => (
              <div key={a.id} className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{a.icon}</div>
                <div className="text-xs font-bold text-yellow-400">{a.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{a.description}</div>
              </div>
            ))}
            {lockedAchievements.map(a => (
              <div key={a.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 text-center opacity-40">
                <div className="text-2xl mb-1">🔒</div>
                <div className="text-xs font-bold text-gray-500">{a.name}</div>
                <div className="text-xs text-gray-600 mt-0.5">{a.description}</div>
              </div>
            ))}
          </div>
        </div>

        <AdBanner slot="dashboard-bottom" className="mb-8" />
      </main>
    </>
  );
}
