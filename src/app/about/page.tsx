import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";
import Link from "next/link";

export const metadata = { title: "About — Gamers360" };

export default function AboutPage() {
  return (
    <>
      <ParticleBackground />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 relative z-10">
        <h1 className="text-4xl font-black mb-2">
          About <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Gamers360</span>
        </h1>
        <p className="text-gray-500 mb-8">The gaming platform where everyone wins.</p>

        <div className="space-y-6">
          <div className="glass rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-3">Our Mission</h2>
            <p className="text-gray-300 leading-relaxed">
              Gamers360 was built on a simple idea: gaming should reward you. We created a platform where you can play fun,
              luck-based games and earn real money — completely free. No deposits, no hidden fees, no catch.
            </p>
          </div>

          <div className="glass rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-3">How It Works</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Our platform is ad-supported. When you play games, you see ads. That ad revenue funds your earnings.
              The more people play, the more ad revenue we generate, and the more we can pay out. It&apos;s a win-win.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="glass rounded-xl p-4">
                <div className="text-3xl mb-2">🎮</div>
                <div className="text-sm font-bold text-white">You Play</div>
                <div className="text-xs text-gray-500 mt-1">Fun luck-based games</div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="text-3xl mb-2">📺</div>
                <div className="text-sm font-bold text-white">Ads Run</div>
                <div className="text-xs text-gray-500 mt-1">Revenue is generated</div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-sm font-bold text-white">You Earn</div>
                <div className="text-xs text-gray-500 mt-1">Withdraw real money</div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-3">Why Luck-Based?</h2>
            <p className="text-gray-300 leading-relaxed">
              Every game on Gamers360 is based purely on luck — no skill advantage, no AI cheating, no unfair edges.
              Whether you&apos;re a first-time player or a veteran, everyone has the same chance of winning.
              That&apos;s fairness by design.
            </p>
          </div>

          <div className="glass rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-3">Our Numbers</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { value: "20+", label: "Games" },
                { value: "10", label: "Levels" },
                { value: "5x", label: "Max Multiplier" },
                { value: "₦500", label: "Min Withdrawal" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-black text-yellow-400">{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pt-4">
            <Link
              href="/signup"
              className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-8 py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-orange-500/20 text-lg"
            >
              Join Gamers360 — It&apos;s Free
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
