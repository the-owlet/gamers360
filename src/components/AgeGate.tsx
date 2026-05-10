"use client";

import { useState, useEffect } from "react";

const AGE_VERIFIED_KEY = "g360_age_verified";

export default function AgeGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(AGE_VERIFIED_KEY)) {
      setShow(true);
    }
  }, []);

  function confirm() {
    localStorage.setItem(AGE_VERIFIED_KEY, "1");
    setShow(false);
  }

  function decline() {
    window.location.href = "https://www.google.com";
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass max-w-md w-full rounded-2xl p-8 border border-white/10 text-center">
        <div className="text-5xl mb-4">🎮</div>
        <h2 className="text-2xl font-black text-white mb-2">Age Verification</h2>
        <p className="text-gray-400 text-sm mb-4">
          Gamers360 is a play-to-earn entertainment platform with simulated betting mechanics.
          You must be <span className="text-yellow-400 font-bold">16 years or older</span> to use this platform.
        </p>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6 text-xs text-yellow-400/80">
          No real money is required to play. Virtual coins are earned through gameplay and can be redeemed for rewards.
          This is not a gambling service.
        </div>
        <div className="flex gap-3">
          <button
            onClick={decline}
            className="flex-1 bg-gray-700 text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-600 transition text-sm"
          >
            I'm Under 16
          </button>
          <button
            onClick={confirm}
            className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 rounded-xl hover:opacity-90 transition text-sm"
          >
            I'm 16 or Older
          </button>
        </div>
        <p className="text-[10px] text-gray-600 mt-4">
          By continuing, you agree to our Terms of Service and confirm you meet the minimum age requirement.
        </p>
      </div>
    </div>
  );
}
