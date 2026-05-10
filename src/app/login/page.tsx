"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      router.push("/dashboard");
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  }

  return (
    <>
      <ParticleBackground />
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16 relative z-10">
        <div className="w-full max-w-md">
          <div className="glass rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">👋</div>
              <h1 className="text-2xl font-black">Welcome Back</h1>
              <p className="text-gray-500 text-sm mt-1">Login to continue your earning streak</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 mb-6">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input type="email" required
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition"
                  placeholder="you@example.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input type="password" required
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition"
                  placeholder="Your password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3.5 rounded-lg hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-orange-500/20">
                {loading ? "Logging in..." : "Login & Play"}
              </button>
            </form>

            <p className="text-center text-gray-600 text-sm mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-yellow-400 hover:underline font-medium">Sign Up Free</Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
