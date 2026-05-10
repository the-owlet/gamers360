"use client";

import { useEffect, useRef } from "react";

interface ConfettiProps {
  active: boolean;
  duration?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  opacity: number;
  shape: "rect" | "circle";
}

const COLORS = ["#facc15", "#f97316", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#06b6d4"];

export default function Confetti({ active, duration = 3000 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 4 + 2,
        size: Math.random() * 8 + 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      });
    }

    let animId: number;
    const startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.vy += 0.1;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.vx *= 0.99;

        if (elapsed > duration * 0.6) {
          p.opacity = Math.max(0, p.opacity - 0.02);
        }

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.globalAlpha = p.opacity;
        ctx!.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.restore();
      });

      if (elapsed < duration) {
        animId = requestAnimationFrame(animate);
      }
    }

    animate();
    return () => cancelAnimationFrame(animId);
  }, [active, duration]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
    />
  );
}
