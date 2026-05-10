"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const { user, loading, mutate } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    mutate();
    router.push("/");
  }

  const navLinks = [
    { href: "/games", label: "Games", icon: "🎮" },
    { href: "/multiplayer", label: "Multiplayer", icon: "⚔️" },
    { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  ];

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-black font-bold text-sm group-hover:scale-110 transition-transform" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>
              G3
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent hidden sm:block" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>
              GAMERS360
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? "bg-yellow-400/10 text-yellow-400"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="mr-1.5">{link.icon}</span>
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/dashboard"
                    ? "bg-yellow-400/10 text-yellow-400"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="mr-1.5">📊</span>
                Dashboard
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-24 h-9 bg-gray-800 rounded-lg animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <NotificationBell />

                {/* Points badge */}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 bg-gray-800/80 hover:bg-gray-700/80 px-3 py-1.5 rounded-full transition-all"
                >
                  <span className="text-yellow-400 text-sm">💰</span>
                  <span className="text-sm font-bold text-yellow-400">
                    {(user.wallet?.balance ?? 0).toLocaleString()}
                  </span>
                </Link>

                {/* Level badge */}
                <Link
                  href="/dashboard"
                  className="hidden sm:flex items-center gap-1.5 animate-pulse-glow rounded-full"
                >
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2.5 py-1 rounded-full">
                    LV {user.level}
                  </div>
                </Link>

                {/* Streak */}
                {user.loginStreak > 0 && (
                  <div className="hidden sm:flex items-center gap-1 text-sm">
                    <span className="animate-streak">🔥</span>
                    <span className="text-orange-400 font-bold">{user.loginStreak}</span>
                  </div>
                )}

                {/* User menu */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300 hidden lg:block">{user.username}</span>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-gray-500 hover:text-white transition px-2 py-1 rounded hover:bg-white/5"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm text-gray-300 hover:text-white transition px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="text-sm bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-4 py-2 rounded-lg hover:opacity-90 transition shadow-lg shadow-orange-500/20"
                >
                  Sign Up Free
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-white/5 mt-2 animate-slide-up">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition"
              >
                <span className="mr-2">{link.icon}</span>
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition"
              >
                <span className="mr-2">📊</span>
                Dashboard
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
