"use client";

import { useState } from "react";

interface HowToPlayProps {
  gameName: string;
  gameIcon: string;
  steps: string[];
  tips?: string[];
  maxPoints: number;
}

export default function HowToPlay({ gameName, gameIcon, steps, tips, maxPoints }: HowToPlayProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 hover:text-yellow-400 transition flex items-center gap-1"
      >
        <span>❓</span> How to Play
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative glass rounded-2xl p-6 max-w-sm w-full animate-slide-up border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition text-lg"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{gameIcon}</span>
              <div>
                <h3 className="font-bold text-white text-lg">{gameName}</h3>
                <div className="text-xs text-yellow-400">Up to {maxPoints} pts</div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-bold text-gray-300 mb-2">How to Play</h4>
              <ol className="space-y-2">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-400">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {tips && tips.length > 0 && (
              <div className="bg-yellow-400/5 rounded-xl p-3 border border-yellow-400/10">
                <h4 className="text-xs font-bold text-yellow-400 mb-1.5">Tips</h4>
                <ul className="space-y-1">
                  {tips.map((tip, i) => (
                    <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                      <span className="text-yellow-400">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => setOpen(false)}
              className="w-full mt-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 rounded-xl hover:opacity-90 transition"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
