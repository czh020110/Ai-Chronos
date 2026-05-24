"use client";

import { useEffect, useRef } from "react";
import { ThemeMode } from "@/lib/types";

export function StarField({ theme }: { theme: ThemeMode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resizeTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    const isDay = theme === "day";

    class Particle {
      x: number;
      y: number;
      depth: number;
      size: number;
      drift: number;
      phase: number;
      tone: "gold" | "blue" | "violet" | "pearl";

      constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.depth = Math.random();
        this.size = (isDay ? 0.65 : 0.55) + Math.random() * (isDay ? 1.75 : 2.05);
        this.drift = (isDay ? 0.045 : 0.08) + Math.random() * (isDay ? 0.16 : 0.28);
        this.phase = Math.random() * Math.PI * 2;
        this.tone = isDay
          ? Math.random() > 0.78
            ? "gold"
            : Math.random() > 0.46
              ? "blue"
              : Math.random() > 0.18
                ? "pearl"
                : "violet"
          : Math.random() > 0.72
            ? "gold"
            : Math.random() > 0.48
              ? "blue"
              : "violet";
      }

      update(time: number, w: number, h: number) {
        const speed = this.drift * (0.35 + this.depth);
        this.x += Math.cos(time * 0.00018 + this.phase) * speed;
        this.y += Math.sin(time * 0.00015 + this.phase) * speed - 0.045 * this.depth;

        if (this.x < -40) this.x = w + 40;
        if (this.x > w + 40) this.x = -40;
        if (this.y < -40) this.y = h + 40;
        if (this.y > h + 40) this.y = -40;
      }

      color(alpha: number) {
        if (isDay) {
          if (this.tone === "gold") return `rgba(126,82,25,${alpha})`;
          if (this.tone === "blue") return `rgba(53,92,164,${alpha})`;
          if (this.tone === "pearl") return `rgba(116,103,84,${alpha})`;
          return `rgba(94,80,146,${alpha})`;
        }

        if (this.tone === "gold") return `rgba(240,192,96,${alpha})`;
        if (this.tone === "blue") return `rgba(111,158,255,${alpha})`;
        return `rgba(166,122,255,${alpha})`;
      }

      draw(context: CanvasRenderingContext2D, time: number) {
        const pulse = 0.58 + Math.abs(Math.sin(time * 0.0012 + this.phase)) * 0.42;
        const alpha = (isDay ? 0.22 : 0.26) + this.depth * (isDay ? 0.38 : 0.54);

        context.beginPath();
        context.arc(this.x, this.y, this.size * (0.8 + this.depth), 0, Math.PI * 2);
        context.fillStyle = this.color(alpha * pulse);
        context.fill();

        if (!isDay && this.depth > 0.5) {
          context.beginPath();
          context.arc(this.x, this.y, this.size * 6.2, 0, Math.PI * 2);
          context.fillStyle = this.color(alpha * 0.13);
          context.fill();
        }

        if (isDay && this.depth > 0.52) {
          context.beginPath();
          context.arc(this.x, this.y, this.size * 3.6, 0, Math.PI * 2);
          context.fillStyle = this.color(alpha * 0.11);
          context.fill();
        }
      }
    }

    const createParticles = () => {
      const count = Math.min(isDay ? 132 : 140, Math.max(isDay ? 76 : 80, Math.floor((width * height) / (isDay ? 15000 : 14000))));
      particles = Array.from({ length: count }, () => new Particle(width, height));
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles();
    };

    const debouncedResize = () => {
      clearTimeout(resizeTimer.current);
      resizeTimer.current = setTimeout(resize, 160);
    };

    const drawBands = (time: number) => {
      const bands = isDay
        ? [
            { y: height * 0.38, color: "rgba(104,145,210,", shift: 1.8 },
            { y: height * 0.68, color: "rgba(134,124,112,", shift: 3.2 },
          ]
        : [
            { y: height * 0.18, color: "rgba(91,141,239,", shift: 0 },
            { y: height * 0.42, color: "rgba(212,168,83,", shift: 1.8 },
            { y: height * 0.68, color: "rgba(139,92,246,", shift: 3.4 },
          ];

      ctx.save();
      ctx.globalCompositeOperation = isDay ? "source-over" : "screen";
      for (const band of bands) {
        ctx.beginPath();
        const startY = band.y + Math.sin(time * 0.00045 + band.shift) * (isDay ? 12 : 20);
        ctx.moveTo(-80, startY);
        for (let x = -80; x <= width + 120; x += 90) {
          const y = band.y + Math.sin(x * 0.006 + time * 0.00055 + band.shift) * (isDay ? 24 : 42);
          ctx.lineTo(x, y);
        }
        const gradient = ctx.createLinearGradient(0, band.y - 90, 0, band.y + 90);
        gradient.addColorStop(0, `${band.color}0)`);
        gradient.addColorStop(0.5, `${band.color}${isDay ? 0.095 : 0.13})`);
        gradient.addColorStop(1, `${band.color}0)`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = isDay ? 34 : 76;
        ctx.shadowBlur = isDay ? 18 : 34;
        ctx.shadowColor = `${band.color}${isDay ? 0.08 : 0.22})`;
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawFilaments = (time: number) => {
      ctx.save();
      ctx.globalCompositeOperation = isDay ? "source-over" : "screen";
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        if (a.depth < (isDay ? 0.68 : 0.48)) continue;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          if (b.depth < (isDay ? 0.7 : 0.5)) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > (isDay ? 112 : 118)) continue;
          const alpha = (1 - dist / (isDay ? 112 : 118)) * (isDay ? 0.055 : 0.08) * (0.6 + Math.sin(time * 0.001 + a.phase) * 0.4);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = isDay
            ? `rgba(154,170,196,${Math.max(0, alpha)})`
            : `rgba(144,170,255,${Math.max(0, alpha)})`;
          ctx.lineWidth = isDay ? 0.55 : 0.7;
          ctx.stroke();
        }
      }
      ctx.restore();
    };

    const drawVignette = () => {
      const gradient = isDay
        ? ctx.createRadialGradient(width * 0.52, height * 0.42, 0, width * 0.52, height * 0.42, Math.max(width, height) * 0.78)
        : ctx.createRadialGradient(width * 0.5, height * 0.46, 0, width * 0.5, height * 0.46, Math.max(width, height) * 0.74);

      if (isDay) {
        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(0.56, "rgba(238,236,230,0.02)");
        gradient.addColorStop(1, "rgba(202,196,186,0.22)");
      } else {
        gradient.addColorStop(0, "rgba(3,4,10,0)");
        gradient.addColorStop(0.62, "rgba(3,4,10,0.18)");
        gradient.addColorStop(1, "rgba(3,4,10,0.88)");
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const base = isDay
        ? ctx.createLinearGradient(0, 0, width, height)
        : ctx.createLinearGradient(0, 0, width, height);

      if (isDay) {
        base.addColorStop(0, "rgba(249,247,242,1)");
        base.addColorStop(0.46, "rgba(242,240,235,0.98)");
        base.addColorStop(1, "rgba(232,229,222,0.98)");
      } else {
        base.addColorStop(0, "rgba(4,5,14,0.92)");
        base.addColorStop(0.45, "rgba(6,8,19,0.72)");
        base.addColorStop(1, "rgba(3,4,10,0.94)");
      }

      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      drawBands(time);
      drawFilaments(time);

      for (const particle of particles) {
        particle.update(time, width, height);
        particle.draw(ctx, time);
      }

      const scanX = ((time * (isDay ? 0.026 : 0.035)) % (width + 360)) - 180;
      const scan = ctx.createLinearGradient(scanX - 180, 0, scanX + 180, 0);
      scan.addColorStop(0, "rgba(255,255,255,0)");
      scan.addColorStop(0.5, isDay ? "rgba(225,178,92,0.065)" : "rgba(240,192,96,0.075)");
      scan.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = scan;
      ctx.fillRect(scanX - 180, 0, 360, height);

      drawVignette();
      animationId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", debouncedResize);
    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(resizeTimer.current);
      window.removeEventListener("resize", debouncedResize);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden="true" />;
}
