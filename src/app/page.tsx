import Link from "next/link";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";
import AdBanner from "@/components/AdBanner";
import LiveJackpot from "@/components/LiveJackpot";
import HomeGameCards from "@/components/HomeGameCards";

import { GAMES, POINTS_PER_NAIRA } from "@/lib/constants";

export default function Home() {
  const featuredGames = GAMES.slice(0, 12);

  return (
    <>
      <ParticleBackground />
      <Navbar />
      <main className="flex-1 relative z-10">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(250,204,21,0.08),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.06),transparent_60%)]" />
          <div className="max-w-7xl mx-auto px-4 py-20 sm:py-32 relative">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-4 py-1.5 mb-8 text-sm text-yellow-400">
                <span className="animate-streak">🔥</span>
                Free to play &bull; Real cash rewards
              </div>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black mb-6 tracking-tight" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>
                <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
                  Play. Win.
                </span>
                <br />
                <span className="text-white">
                  Get Paid.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                The ultimate gaming playground where every game earns you real money.
                Level up, unlock higher earnings, and cash out anytime.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  href="/signup"
                  className="group relative bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-8 py-4 rounded-xl text-lg hover:opacity-90 transition shadow-2xl shadow-orange-500/30 overflow-hidden"
                >
                  <span className="relative z-10" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>Start Earning Free</span>
                  <div className="absolute inset-0 animate-shimmer" />
                </Link>
                <Link
                  href="/games"
                  className="border border-gray-700 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-white/5 hover:border-gray-500 transition"
                >
                  🎮 Browse Games
                </Link>
              </div>

              {/* Live stats ticker */}
              <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="glass rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-yellow-400" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>{GAMES.length}</div>
                  <div className="text-xs text-gray-500 mt-1">Games</div>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-orange-400" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>10</div>
                  <div className="text-xs text-gray-500 mt-1">Levels</div>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-green-400" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>5x</div>
                  <div className="text-xs text-gray-500 mt-1">Max Multiplier</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Jackpot Ticker */}
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <LiveJackpot />
        </div>

        <div className="max-w-7xl mx-auto px-4">
          <AdBanner slot="homepage-top" className="mb-12" />
        </div>

        {/* How It Works */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-4" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>
            How It <span className="text-yellow-400">Works</span>
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-md mx-auto">
            From zero to earning in under 60 seconds
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Sign Up Free", desc: "Create your account instantly. Zero cost, zero hassle.", icon: "✨", glow: "shadow-yellow-500/20" },
              { step: "02", title: "Play Games", desc: "Choose from 50 pure-luck games. No skill needed, just fortune!", icon: "🎮", glow: "shadow-blue-500/20" },
              { step: "03", title: "Earn Points", desc: "Every game earns points. Win bonuses multiply your earnings.", icon: "💰", glow: "shadow-green-500/20" },
              { step: "04", title: "Cash Out", desc: "Withdraw to your bank account or crypto wallet anytime.", icon: "🏦", glow: "shadow-purple-500/20" },
            ].map((item) => (
              <div
                key={item.step}
                className={`glass rounded-2xl p-6 text-center card-hover shadow-lg ${item.glow}`}
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-xs font-mono text-gray-600 mb-2">{item.step}</div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Games — Hot */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🔥</span>
            <h2 className="text-2xl font-black" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>Hot Games</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-gray-800 to-transparent" />
            <Link href="/games" className="text-yellow-400 text-sm font-bold hover:underline">View All {GAMES.length} →</Link>
          </div>
          <HomeGameCards games={featuredGames} />
        </section>

        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/games"
            className="block glass rounded-2xl p-6 text-center card-hover border border-yellow-400/10"
          >
            <span className="text-lg font-bold text-yellow-400">🎮 Browse All {GAMES.length} Games →</span>
            <p className="text-gray-500 text-sm mt-1">Slots, Cards, Dice, Adventure & more</p>
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          <AdBanner slot="homepage-mid" className="my-8" />
        </div>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-12" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>
            Why <span className="text-yellow-400">Gamers360</span>?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "🎯", title: "Daily Rewards", desc: "Login every day to claim free bonus points. Build your streak for bigger rewards!", color: "border-orange-500/20" },
              { icon: "📈", title: "Level Up System", desc: "10 levels from Rookie to God. Higher levels earn up to 5x more points per game.", color: "border-purple-500/20" },
              { icon: "🏆", title: "Leaderboards", desc: "Compete with players worldwide. Top players earn exclusive bonuses and recognition.", color: "border-cyan-500/20" },
              { icon: "🏅", title: "Achievements", desc: "Unlock badges as you play. Each achievement earns bonus XP to level up faster.", color: "border-green-500/20" },
              { icon: "💳", title: "Easy Withdrawals", desc: "Cash out to your bank account (NGN) or crypto wallet (USDT). Fast processing.", color: "border-yellow-500/20" },
              { icon: "🔒", title: "100% Free", desc: "Never spend your own money. All earnings come from gameplay. Risk-free gaming.", color: "border-blue-500/20" },
            ].map((f) => (
              <div key={f.title} className={`glass rounded-2xl p-6 border ${f.color} card-hover`}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4">
          <AdBanner slot="homepage-bottom" className="my-8" />
        </div>

        {/* CTA */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="glass rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-orange-400/5 to-red-400/5" />
            <div className="relative">
              <h2 className="text-3xl sm:text-5xl font-black mb-4" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>
                Ready to <span className="text-yellow-400">Earn</span>?
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Join thousands of gamers already earning real money. It takes 30 seconds to start.
              </p>
              <Link
                href="/signup"
                className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-10 py-4 rounded-xl text-lg hover:opacity-90 transition shadow-2xl shadow-orange-500/30"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="glass border-t border-white/5 py-8 relative z-10 pb-20 lg:pb-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-black font-bold text-xs">
                G3
              </div>
              <span className="font-bold text-sm bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                GAMERS360
              </span>
            </div>
            <div className="flex gap-4 flex-wrap justify-center text-sm text-gray-500">
              <Link href="/games" className="hover:text-white transition">Games</Link>
              <Link href="/leaderboard" className="hover:text-white transition">Leaderboard</Link>
              <Link href="/about" className="hover:text-white transition">About</Link>
              <Link href="/faq" className="hover:text-white transition">FAQ</Link>
              <Link href="/contact" className="hover:text-white transition">Contact</Link>
              <Link href="/terms" className="hover:text-white transition">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            </div>
            <p className="text-gray-600 text-xs">&copy; 2025 Gamers360</p>
          </div>
        </div>
      </footer>

      {/* Bottom Nav - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 lg:hidden">
        <div className="flex items-center justify-around py-2">
          <Link href="/" className="flex flex-col items-center gap-0.5 text-yellow-400">
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-bold">Home</span>
          </Link>
          <Link href="/games" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white transition">
            <span className="text-xl">🎮</span>
            <span className="text-[10px] font-bold">Games</span>
          </Link>
          <Link href="/dashboard" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white transition">
            <span className="text-xl">💰</span>
            <span className="text-[10px] font-bold">Wallet</span>
          </Link>
          <Link href="/contact" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white transition">
            <span className="text-xl">💬</span>
            <span className="text-[10px] font-bold">Support</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
