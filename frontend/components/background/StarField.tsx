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
    let stars: Star[] = [];

    class Star {
      x: number;
      y: number;
      size: number;
      opacity: number;
      speed: number;
      twinklePhase: number;

      constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 1.5 + 0.3;
        this.opacity = Math.random();
        this.speed = Math.random() * 0.003 + 0.001;
        this.twinklePhase = Math.random() * Math.PI * 2;
      }

      update(time: number, w: number, h: number) {
        this.opacity =
          0.3 + 0.7 * Math.abs(Math.sin(time * this.speed + this.twinklePhase));
        this.y -= this.speed * 0.3;
        if (this.y < -5) {
          this.y = h + 5;
          this.x = Math.random() * w;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${this.opacity})`;
        ctx.fill();

        if (this.size > 1.0 && this.opacity > 0.7) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(180,180,220,${this.opacity * 0.08})`;
          ctx.fill();
        }
      }
    }

    const initStars = (w: number, h: number) => {
      stars = [];
      for (let i = 0; i < 200; i++) {
        stars.push(new Star(w, h));
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars(canvas.width, canvas.height);
    };

    const debouncedResize = () => {
      clearTimeout(resizeTimer.current);
      resizeTimer.current = setTimeout(resize, 200);
    };

    resize();
    window.addEventListener("resize", debouncedResize);

    initStars(canvas.width, canvas.height);

    let startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const star of stars) {
        star.update(elapsed, canvas.width, canvas.height);
        star.draw(ctx);
      }

      animationId = requestAnimationFrame(animate);
    };

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
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
