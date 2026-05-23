"use client";

import { useEffect, useRef } from "react";

export function StarField() {
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

    class Particle {
      x: number;
      y: number;
      depth: number;
      size: number;
      drift: number;
      phase: number;
      tone: "gold" | "blue" | "violet";

      constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.depth = Math.random();
        this.size = 0.4 + Math.random() * 1.8;
        this.drift = 0.08 + Math.random() * 0.28;
        this.phase = Math.random() * Math.PI * 2;
        this.tone = Math.random() > 0.72 ? "gold" : Math.random() > 0.48 ? "blue" : "violet";
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
        if (this.tone === "gold") return `rgba(240,192,96,${alpha})`;
        if (this.tone === "blue") return `rgba(111,158,255,${alpha})`;
        return `rgba(166,122,255,${alpha})`;
      }

      draw(context: CanvasRenderingContext2D, time: number) {
        const pulse = 0.42 + Math.abs(Math.sin(time * 0.0012 + this.phase)) * 0.58;
        const alpha = (0.18 + this.depth * 0.42) * pulse;

        context.beginPath();
        context.arc(this.x, this.y, this.size * (0.8 + this.depth), 0, Math.PI * 2);
        context.fillStyle = this.color(alpha);
        context.fill();

        if (this.depth > 0.58) {
          context.beginPath();
          context.arc(this.x, this.y, this.size * 5.2, 0, Math.PI * 2);
          context.fillStyle = this.color(alpha * 0.08);
          context.fill();
        }
      }
    }

    const createParticles = () => {
      const count = Math.min(140, Math.max(80, Math.floor((width * height) / 14000)));
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

    const drawAurora = (time: number) => {
      const bands = [
        { y: height * 0.18, color: "rgba(91,141,239,", shift: 0 },
        { y: height * 0.42, color: "rgba(212,168,83,", shift: 1.8 },
        { y: height * 0.68, color: "rgba(139,92,246,", shift: 3.4 },
      ];

      ctx.save();
      ctx.globalCompositeOperation = "screen";
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
      ctx.restore();
    };

    const drawFilaments = (time: number) => {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        if (a.depth < 0.48) continue;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          if (b.depth < 0.5) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 118) continue;
          const alpha = (1 - dist / 118) * 0.08 * (0.6 + Math.sin(time * 0.001 + a.phase) * 0.4);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(144,170,255,${Math.max(0, alpha)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
      ctx.restore();
    };

    const drawVignette = () => {
      const gradient = ctx.createRadialGradient(width * 0.5, height * 0.46, 0, width * 0.5, height * 0.46, Math.max(width, height) * 0.74);
      gradient.addColorStop(0, "rgba(3,4,10,0)");
      gradient.addColorStop(0.62, "rgba(3,4,10,0.18)");
      gradient.addColorStop(1, "rgba(3,4,10,0.88)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const base = ctx.createLinearGradient(0, 0, width, height);
      base.addColorStop(0, "rgba(4,5,14,0.92)");
      base.addColorStop(0.45, "rgba(6,8,19,0.72)");
      base.addColorStop(1, "rgba(3,4,10,0.94)");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      drawAurora(time);
      drawFilaments(time);

      for (const particle of particles) {
        particle.update(time, width, height);
        particle.draw(ctx, time);
      }

      const scanX = ((time * 0.035) % (width + 360)) - 180;
      const scan = ctx.createLinearGradient(scanX - 180, 0, scanX + 180, 0);
      scan.addColorStop(0, "rgba(255,255,255,0)");
      scan.addColorStop(0.5, "rgba(240,192,96,0.075)");
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
