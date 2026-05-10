"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface Notification {
  type: "challenge_accepted" | "match_ready" | "match_completed";
  message: string;
  matchId: string;
  gameSlug: string;
  createdAt: string;
}

const typeIcons: Record<Notification["type"], string> = {
  challenge_accepted: "⚔️",
  match_ready: "🎮",
  match_completed: "🏆",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch {
      // silent fail
    }
  }, []);

  // Poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unreadCount = notifications.filter(
    (n) => !seen.has(n.matchId + n.type)
  ).length;

  function handleOpen() {
    setOpen((prev) => !prev);
    // Mark all current notifications as seen
    if (!open) {
      const newSeen = new Set(seen);
      notifications.forEach((n) => newSeen.add(n.matchId + n.type));
      setSeen(newSeen);
    }
  }

  function getLinkHref(n: Notification): string {
    if (n.type === "match_completed") return "/multiplayer";
    return `/games/${n.gameSlug}?matchId=${n.matchId}`;
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-gray-900 border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-50 animate-slide-up">
          <div className="px-4 py-3 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((n, i) => (
                <Link
                  key={`${n.matchId}-${n.type}-${i}`}
                  href={getLinkHref(n)}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                >
                  <span className="text-lg mt-0.5 shrink-0">
                    {typeIcons[n.type]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-200 group-hover:text-white transition-colors leading-snug">
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
