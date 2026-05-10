"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";

const FAQS = [
  {
    q: "Is Gamers360 really free?",
    a: "Yes, 100% free. You never need to deposit money or pay anything. All games are free to play and all earnings are real.",
  },
  {
    q: "How do I earn money?",
    a: "Play any game to earn points. Points convert to real money (10 points = ₦1). Once you reach 5,000 points (₦500), you can withdraw to your bank account or crypto wallet.",
  },
  {
    q: "How does Gamers360 make money?",
    a: "We're ad-supported. When you play games, ads are displayed. That ad revenue funds your earnings. The more you play, the more everyone earns.",
  },
  {
    q: "Are the games fair?",
    a: "Every game is purely luck-based with random outcomes generated on our servers. No skill advantage, no manipulation. Everyone has an equal chance of winning.",
  },
  {
    q: "How long do withdrawals take?",
    a: "Withdrawals are typically processed within 1-3 business days. Bank transfers (NGN) and crypto (USDT) are both supported.",
  },
  {
    q: "What is the minimum withdrawal?",
    a: "The minimum withdrawal is 5,000 points, which equals ₦500. This ensures efficient processing for both you and us.",
  },
  {
    q: "What are levels and XP?",
    a: "As you play, you earn XP and level up from Rookie (Level 1) to God (Level 10). Higher levels earn more points per game — up to 5x at max level. Leveling up rewards loyalty.",
  },
  {
    q: "What are daily challenges?",
    a: "Every day you get 3 challenges (like 'Play 3 games' or 'Win 2 games'). Completing them earns bonus points. They reset daily at midnight.",
  },
  {
    q: "What is the referral program?",
    a: "Share your referral link with friends. When they sign up and start playing, you both get 200 bonus points. There's no limit to how many friends you can refer.",
  },
  {
    q: "Can I use multiple accounts?",
    a: "No. One account per person. Creating multiple accounts to exploit the points system will result in permanent suspension and forfeiture of all points.",
  },
  {
    q: "Can I use bots or scripts?",
    a: "Absolutely not. We monitor gameplay patterns and any automated or suspicious activity will result in account suspension. Play fair, earn fair.",
  },
  {
    q: "What happens to my points if I don't play for a while?",
    a: "Your points never expire. Your account and balance remain intact. However, your login streak will reset if you miss a day.",
  },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <ParticleBackground />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 relative z-10">
        <h1 className="text-4xl font-black mb-2">
          Frequently Asked <span className="text-yellow-400">Questions</span>
        </h1>
        <p className="text-gray-500 mb-8">Everything you need to know about Gamers360.</p>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition"
              >
                <span className="font-bold text-white pr-4">{faq.q}</span>
                <span className={`text-yellow-400 text-xl transition-transform ${open === i ? "rotate-45" : ""}`}>+</span>
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-gray-400 text-sm leading-relaxed animate-slide-up">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
