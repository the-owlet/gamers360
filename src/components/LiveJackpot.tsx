"use client";

import { useEffect, useState, useRef } from "react";

export default function LiveJackpot() {
  const [jackpot, setJackpot] = useState(2847391);
  const [displayDigits, setDisplayDigits] = useState<string[]>([]);
  const prevDigitsRef = useRef<string[]>([]);
  const [changedIndices, setChangedIndices] = useState<Set<number>>(new Set());

  // Format number into digit array
  useEffect(() => {
    const formatted = jackpot.toLocaleString("en-US");
    const digits = formatted.split("");
    const prevDigits = prevDigitsRef.current;

    // Find which digits changed
    const changed = new Set<number>();
    digits.forEach((d, i) => {
      if (prevDigits[i] !== d) changed.add(i);
    });

    setChangedIndices(changed);
    setDisplayDigits(digits);
    prevDigitsRef.current = digits;

    // Clear changed state after animation
    const timeout = setTimeout(() => setChangedIndices(new Set()), 300);
    return () => clearTimeout(timeout);
  }, [jackpot]);

  // Increment jackpot randomly
  useEffect(() => {
    const tick = () => {
      const increment = Math.floor(Math.random() * 47) + 3; // 3-49
      setJackpot((prev) => prev + increment);
    };

    const scheduleNext = () => {
      const delay = Math.floor(Math.random() * 150) + 50; // 50-200ms
      return setTimeout(() => {
        tick();
        timerRef = scheduleNext();
      }, delay);
    };

    let timerRef = scheduleNext();
    return () => clearTimeout(timerRef);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #1a1a2e 100%)",
        }}
      />

      {/* Animated shimmer overlay */}
      <div className="absolute inset-0 opacity-20 animate-shimmer" />

      <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 px-4 sm:px-8 py-4">
        {/* LIVE badge + label */}
        <div className="flex items-center gap-3">
          {/* LIVE badge */}
          <span className="flex items-center gap-1.5 bg-red-600/90 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <span
              className="w-2 h-2 bg-red-300 rounded-full animate-live-pulse"
            />
            LIVE
          </span>
          <span className="text-yellow-400 font-bold text-sm sm:text-base tracking-wide">
            🏆 JACKPOT
          </span>
        </div>

        {/* Big number */}
        <div
          className="flex items-baseline gap-0.5 animate-jackpot"
        >
          <span className="text-yellow-400 font-bold text-2xl sm:text-3xl mr-1">
            ₦
          </span>
          <div className="flex">
            {displayDigits.map((digit, i) => (
              <span
                key={i}
                className={`inline-block font-bold text-2xl sm:text-4xl font-mono transition-all duration-300 ${
                  digit === ","
                    ? "text-yellow-400/60 text-xl sm:text-2xl mx-0.5"
                    : changedIndices.has(i)
                    ? "text-yellow-300 scale-110"
                    : "text-yellow-400"
                }`}
                style={{
                  textShadow: changedIndices.has(i)
                    ? "0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.4)"
                    : "0 0 10px rgba(255,215,0,0.4)",
                  transform: changedIndices.has(i)
                    ? "translateY(-2px) scale(1.05)"
                    : "translateY(0) scale(1)",
                  transition: "all 0.3s ease-out",
                }}
              >
                {digit}
              </span>
            ))}
          </div>
        </div>

        {/* Subtext */}
        <span className="text-yellow-400/50 text-xs sm:text-sm italic">
          Growing every second...
        </span>
      </div>

    </div>
  );
}
