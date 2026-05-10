"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "", referralCode: ref });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Signup failed"); return; }
      router.push("/dashboard");
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  }

  return (
    <div className="glass rounded-2xl p-8">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🎮</div>
        <h1 className="text-2xl font-black">Join Gamers360</h1>
        <p className="text-gray-500 text-sm mt-1">Start playing and earning today — 100% free</p>
        {ref && (
          <div className="mt-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-lg px-3 py-2">
            🎁 You were invited! Both you and your friend get 200 bonus points
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Full Name (as on your bank account)</label>
          <input type="text" required minLength={3}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition"
            placeholder="Enter your legal name" value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <p className="text-xs text-gray-500 mt-1">This must match your bank account name for withdrawals</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
          <input type="text" required
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition"
            placeholder="Choose a gamertag" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
          <input type="email" required
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition"
            placeholder="you@example.com" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
          <input type="password" required minLength={6}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition"
            placeholder="Min. 6 characters" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {!ref && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Referral Code <span className="text-gray-600">(optional)</span></label>
            <input type="text"
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition"
              placeholder="Enter a friend's code" value={form.referralCode}
              onChange={(e) => setForm({ ...form, referralCode: e.target.value })} />
          </div>
        )}
        <button type="submit" disabled={loading}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3.5 rounded-lg hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-orange-500/20 relative overflow-hidden">
          <span className="relative z-10">{loading ? "Creating account..." : "Create Account & Play"}</span>
          <div className="absolute inset-0 animate-shimmer" />
        </button>
      </form>

      <p className="text-center text-gray-600 text-sm mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-yellow-400 hover:underline font-medium">Login</Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <>
      <ParticleBackground />
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16 relative z-10">
        <div className="w-full max-w-md">
          <Suspense fallback={<div className="glass rounded-2xl p-8 text-center text-gray-500">Loading...</div>}>
            <SignupForm />
          </Suspense>
        </div>
      </main>
    </>
  );
}
