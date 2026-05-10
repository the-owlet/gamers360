"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <>
      <ParticleBackground />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 relative z-10">
        <h1 className="text-4xl font-black mb-2">
          Contact <span className="text-yellow-400">Us</span>
        </h1>
        <p className="text-gray-500 mb-8">Have a question, issue, or feedback? We&apos;d love to hear from you.</p>

        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-3">
            {sent ? (
              <div className="glass rounded-2xl p-8 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-xl font-bold text-white mb-2">Message Sent!</h2>
                <p className="text-gray-400 text-sm">We&apos;ll get back to you within 24 hours. Check your email for updates.</p>
                <button
                  onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  className="mt-6 glass px-6 py-2 rounded-lg text-sm hover:bg-white/10 transition"
                >
                  Send Another
                </button>
              </div>
            ) : (
              <div className="glass rounded-2xl p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                    <input
                      type="text" required value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input
                      type="email" required value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
                    <select
                      value={form.subject} required
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition"
                    >
                      <option value="">Select a topic</option>
                      <option value="withdrawal">Withdrawal Issue</option>
                      <option value="account">Account Problem</option>
                      <option value="game">Game Bug</option>
                      <option value="suggestion">Suggestion</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Message</label>
                    <textarea
                      required rows={4} value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition resize-none"
                      placeholder="Describe your issue or question..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3.5 rounded-lg hover:opacity-90 transition shadow-lg shadow-orange-500/20"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold text-white mb-3">Quick Links</h3>
              <div className="space-y-3 text-sm">
                {[
                  { icon: "❓", label: "Check our FAQ", href: "/faq" },
                  { icon: "📋", label: "Terms of Service", href: "/terms" },
                  { icon: "🔒", label: "Privacy Policy", href: "/privacy" },
                ].map((link) => (
                  <a key={link.href} href={link.href} className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition">
                    <span>{link.icon}</span>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold text-white mb-3">Email Us</h3>
              <p className="text-gray-400 text-sm">support@gamers360.com</p>
              <p className="text-gray-600 text-xs mt-2">We typically respond within 24 hours</p>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold text-white mb-3">Response Time</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Withdrawal issues</span>
                  <span className="text-yellow-400 font-bold">{'<'} 12h</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Account issues</span>
                  <span className="text-yellow-400 font-bold">{'<'} 24h</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>General inquiries</span>
                  <span className="text-yellow-400 font-bold">{'<'} 48h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
