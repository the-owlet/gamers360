import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-24">
      <div className="text-center">
        <div className="text-8xl mb-4">🕹️</div>
        <h1 className="text-6xl font-black text-yellow-400 mb-2">404</h1>
        <p className="text-xl text-gray-400 mb-8">This page doesn&apos;t exist — but our games do!</p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/games"
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 transition shadow-lg shadow-orange-500/20"
          >
            Play Games
          </Link>
          <Link
            href="/"
            className="glass px-6 py-3 rounded-xl hover:bg-white/10 transition font-medium"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
