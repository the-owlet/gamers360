"use client";

import { useState, useEffect } from "react";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("g360_loaded")) {
      setVisible(false);
      return;
    }
    sessionStorage.setItem("g360_loaded", "1");
    const timer = setTimeout(() => setFadeOut(true), 300);
    const remove = setTimeout(() => setVisible(false), 550);
    return () => { clearTimeout(timer); clearTimeout(remove); };
  }, []);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[100] bg-gray-950 flex items-center justify-center transition-opacity duration-300 ${fadeOut ? "opacity-0" : "opacity-100"}`}>
      <div className="text-center">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-black font-black text-lg shadow-lg shadow-orange-500/30">
            G3
          </div>
          <div>
            <div className="text-xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              GAMERS360
            </div>
            <div className="text-xs text-gray-600">Play. Win. Get Paid.</div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
