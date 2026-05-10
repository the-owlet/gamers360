"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "support";
}

const QUICK_QUESTIONS: Record<string, string> = {
  "How do I withdraw?":
    "Go to Dashboard → Bank Accounts, save your details, then click Withdraw. Processing takes 1-12 hours!",
  "How do points work?":
    "Every game earns points. 10 points = ₦1. Win bonus gives extra points. Level up for multipliers up to 5x!",
  "My game didn't save":
    "Make sure you're logged in before playing. Points only save for logged-in users. Try logging out and back in.",
  "How to earn more?":
    "Play more games, claim daily rewards, complete challenges, refer friends (200pts each), and watch rewarded ads!",
};

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const addMessage = (text: string, sender: "user" | "support") => {
    idRef.current += 1;
    setMessages((prev) => [...prev, { id: idRef.current, text, sender }]);
  };

  const handleQuickQuestion = (question: string) => {
    addMessage(question, "user");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage(QUICK_QUESTIONS[question], "support");
    }, 1000);
  };

  const handleCustomMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    addMessage(trimmed, "user");
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage(
        "Thanks for reaching out! Our team will respond within 24hrs. For faster help, try one of the quick questions above.",
        "support"
      );
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCustomMessage();
    }
  };

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-gray-700/50"
          style={{
            width: "min(400px, calc(100vw - 2rem))",
            height: "min(500px, calc(100vh - 8rem))",
            background: "rgba(17, 24, 39, 0.95)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center text-lg">
                💬
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">
                  Live Support
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 text-xs">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm mb-4">
                  Hi there! How can we help you today?
                </p>
              </div>
            )}

            {/* Quick questions (always visible at top when no messages) */}
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">
                  Quick questions
                </p>
                {Object.keys(QUICK_QUESTIONS).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuickQuestion(q)}
                    className="block w-full text-left px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-yellow-400 text-sm transition-colors border border-gray-700/50 hover:border-yellow-500/30"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    msg.sender === "user"
                      ? "bg-yellow-500/90 text-gray-900 rounded-br-md"
                      : "bg-gray-800 text-gray-200 rounded-bl-md border border-gray-700/50"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-700/50 px-4 py-2.5 rounded-2xl rounded-bl-md flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                    style={{ animation: "typingDot 1.4s infinite 0s" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                    style={{ animation: "typingDot 1.4s infinite 0.2s" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                    style={{ animation: "typingDot 1.4s infinite 0.4s" }}
                  />
                </div>
              </div>
            )}

            {/* Quick questions after conversation started */}
            {messages.length > 0 && !isTyping && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.keys(QUICK_QUESTIONS).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuickQuestion(q)}
                    className="text-xs px-2.5 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-yellow-400/80 hover:text-yellow-400 transition-colors border border-gray-700/50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="px-4 py-3 border-t border-gray-700/50 bg-gray-800/50">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 bg-gray-900 border border-gray-700 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-yellow-500/50 transition-colors"
              />
              <button
                onClick={handleCustomMessage}
                disabled={!input.trim()}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 transition-colors font-bold text-sm"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-transform hover:scale-110 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          animation: isOpen ? "none" : "chatBounce 2s ease-in-out infinite",
          boxShadow: "0 4px 20px rgba(245, 158, 11, 0.4)",
        }}
      >
        {isOpen ? "✕" : "💬"}
        {/* Notification badge */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            1
          </span>
        )}
      </button>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes chatBounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        @keyframes typingDot {
          0%,
          60%,
          100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }
      `}</style>
    </>
  );
}
