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

        if (isDay) {
          // Day: larger, softer motes — sunlight-through-dust feel
          this.size = 1.8 + Math.random() * 4.2;
          this.drift = 0.03 + Math.random() * 0.12;
          this.tone = Math.random() > 0.62
            ? "gold"
            : Math.random() > 0.38
              ? "blue"
              : Math.random() > 0.22
                ? "pearl"
                : "violet";
        } else {
          this.size = 0.55 + Math.random() * 2.05;
          this.drift = 0.08 + Math.random() * 0.28;
          this.tone = Math.random() > 0.72
            ? "gold"
            : Math.random() > 0.48
              ? "blue"
              : "violet";
        }

        this.phase = Math.random() * Math.PI * 2;
      }

      update(time: number, w: number, h: number) {
        const speed = this.drift * (0.35 + this.depth);
        this.x += Math.cos(time * (isDay ? 0.0001 : 0.00018) + this.phase) * speed;
        this.y += Math.sin(time * (isDay ? 0.00008 : 0.00015) + this.phase) * speed - (isDay ? 0.018 : 0.045) * this.depth;

        if (this.x < -60) this.x = w + 60;
        if (this.x > w + 60) this.x = -60;
        if (this.y < -60) this.y = h + 60;
        if (this.y > h + 60) this.y = -60;
      }

      color(alpha: number) {
        if (isDay) {
          // Day: warm gold, cool blue-gray, neutral pearl, soft violet
          if (this.tone === "gold") return `rgba(168,138,72,${alpha})`;
          if (this.tone === "blue") return `rgba(92,128,178,${alpha})`;
          if (this.tone === "pearl") return `rgba(168,162,152,${alpha})`;
          return `rgba(128,118,168,${alpha})`;
        }

        if (this.tone === "gold") return `rgba(240,192,96,${alpha})`;
        if (this.tone === "blue") return `rgba(111,158,255,${alpha})`;
        return `rgba(166,122,255,${alpha})`;
      }

      draw(context: CanvasRenderingContext2D, time: number) {
        const pulse = isDay
          ? 0.68 + Math.abs(Math.sin(time * 0.0008 + this.phase)) * 0.32
          : 0.58 + Math.abs(Math.sin(time * 0.0012 + this.phase)) * 0.42;

        if (isDay) {
          // Day: soft, blurred dust motes — no hard edges
          const alpha = 0.06 + this.depth * 0.14;
          const glowSize = this.size * (3.2 + this.depth * 2.4);

          // Outer glow
          context.beginPath();
          context.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
          context.fillStyle = this.color(alpha * pulse * 0.4);
          context.fill();

          // Core
          context.beginPath();
          context.arc(this.x, this.y, this.size * (0.9 + this.depth * 0.5), 0, Math.PI * 2);
          context.fillStyle = this.color(alpha * pulse);
          context.fill();
        } else {
          // Night: sharp stars with bloom
          const alpha = 0.26 + this.depth * 0.54;

          context.beginPath();
          context.arc(this.x, this.y, this.size * (0.8 + this.depth), 0, Math.PI * 2);
          context.fillStyle = this.color(alpha * pulse);
          context.fill();

          if (this.depth > 0.5) {
            context.beginPath();
            context.arc(this.x, this.y, this.size * 6.2, 0, Math.PI * 2);
            context.fillStyle = this.color(alpha * 0.13);
            context.fill();
          }
        }
      }
    }

    const createParticles = () => {
      const count = Math.min(
        isDay ? 96 : 140,
        Math.max(isDay ? 52 : 80, Math.floor((width * height) / (isDay ? 22000 : 14000))),
      );
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
      ctx.save();
      ctx.globalCompositeOperation = isDay ? "source-over" : "screen";

      if (isDay) {
        // Day: soft, warm floating ribbons — sunlight haze bands
        const bands = [
          { y: height * 0.32, color: "rgba(168,148,118,", shift: 1.2 },
          { y: height * 0.58, color: "rgba(128,148,182,", shift: 2.8 },
          { y: height * 0.8, color: "rgba(178,162,138,", shift: 4.4 },
        ];

        for (const band of bands) {
          ctx.beginPath();
          const startY = band.y + Math.sin(time * 0.0003 + band.shift) * 8;
          ctx.moveTo(-80, startY);
          for (let x = -80; x <= width + 120; x += 90) {
            const y = band.y + Math.sin(x * 0.004 + time * 0.00035 + band.shift) * 16;
            ctx.lineTo(x, y);
          }
          const gradient = ctx.createLinearGradient(0, band.y - 70, 0, band.y + 70);
          gradient.addColorStop(0, `${band.color}0)`);
          gradient.addColorStop(0.5, `${band.color}0.06)`);
          gradient.addColorStop(1, `${band.color}0)`);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 42;
          ctx.shadowBlur = 28;
          ctx.shadowColor = `${band.color}0.04)`;
          ctx.stroke();
        }
      } else {
        // Night: vivid aurora bands
        const bands = [
          { y: height * 0.18, color: "rgba(91,141,239,", shift: 0 },
          { y: height * 0.42, color: "rgba(212,168,83,", shift: 1.8 },
          { y: height * 0.68, color: "rgba(139,92,246,", shift: 3.4 },
        ];

        for (const band of bands) {
          ctx.beginPath();
          const startY = band.y + Math.sin(time * 0.00045 + band.shift) * 20;
          ctx.moveTo(-80, startY);
          for (let x = -80; x <= width + 120; x += 90) {
            const y = band.y + Math.sin(x * 0.006 + time * 0.00055 + band.shift) * 42;
            ctx.lineTo(x, y);
          }
          const gradient = ctx.createLinearGradient(0, band.y - 90, 0, band.y + 90);
          gradient.addColorStop(0, `${band.color}0)`);
          gradient.addColorStop(0.5, `${band.color}0.13)`);
          gradient.addColorStop(1, `${band.color}0)`);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 76;
          ctx.shadowBlur = 34;
          ctx.shadowColor = `${band.color}0.22)`;
          ctx.stroke();
        }
      }

      ctx.restore();
    };

    const drawFilaments = (time: number) => {
      ctx.save();
      ctx.globalCompositeOperation = isDay ? "source-over" : "screen";
      const depthThreshold = isDay ? 0.58 : 0.48;
      const maxDist = isDay ? 130 : 118;

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        if (a.depth < depthThreshold) continue;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          if (b.depth < depthThreshold + 0.02) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > maxDist) continue;
          const alpha = (1 - dist / maxDist) * (isDay ? 0.035 : 0.08) * (0.6 + Math.sin(time * 0.001 + a.phase) * 0.4);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = isDay
            ? `rgba(168,158,142,${Math.max(0, alpha)})`
            : `rgba(144,170,255,${Math.max(0, alpha)})`;
          ctx.lineWidth = isDay ? 0.45 : 0.7;
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
        gradient.addColorStop(0.56, "rgba(245,243,240,0.02)");
        gradient.addColorStop(1, "rgba(215,210,202,0.16)");
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

      const base = ctx.createLinearGradient(0, 0, width, height);

      if (isDay) {
        base.addColorStop(0, "rgba(252,250,248,1)");
        base.addColorStop(0.46, "rgba(247,245,243,0.98)");
        base.addColorStop(1, "rgba(240,238,235,0.98)");
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

      // Scan line
      const scanSpeed = isDay ? 0.02 : 0.035;
      const scanX = ((time * scanSpeed) % (width + 360)) - 180;
      const scan = ctx.createLinearGradient(scanX - 180, 0, scanX + 180, 0);
      scan.addColorStop(0, "rgba(255,255,255,0)");
      if (isDay) {
        scan.addColorStop(0.5, "rgba(208,188,138,0.04)");
      } else {
        scan.addColorStop(0.5, "rgba(240,192,96,0.075)");
      }
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
