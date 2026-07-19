"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

// Theme-aware fluid cursor trail — canvas 2D, pointer-driven
// Dark mode: cool indigo/violet glow (night room)
// Light mode: warm amber/gold glow (daydream)
// Gated by first pointer move, capped DPR, respects reduced motion.

type PaletteName = "cool" | "warm";

interface FluidNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  radius: number;
  stretch: number;
  rotation: number;
  drift: number;
  alpha: number;
  kind: 0 | 1;
}

interface Palette {
  inner: string;
  mid: string;
  outer: string;
  shadow: string;
}

// rgba factories keep color channels fixed, alpha is multiplied per-node
const PALETTES: Record<PaletteName, [Palette, Palette]> = {
  // Dark mode — two tones: indigo moonlight + soft violet
  cool: [
    { inner: "177, 188, 216", mid: "94, 114, 170", outer: "37, 50, 74", shadow: "120, 148, 210" },
    { inner: "196, 174, 216", mid: "120, 99, 148", outer: "59, 49, 71", shadow: "160, 130, 190" },
  ],
  // Light mode — two tones: warm gold + rose dust
  warm: [
    { inner: "255, 233, 178", mid: "216, 177, 94", outer: "180, 130, 60", shadow: "230, 190, 110" },
    { inner: "255, 214, 190", mid: "233, 200, 183", outer: "170, 120, 90", shadow: "240, 200, 170" },
  ],
};

const MAX_NODES = 70;
const SPAWN_INTERVAL = 14; // ms between emissions while moving
const MIN_STEP = 3; // px pointer must move to emit

export default function FluidCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const paletteRef = useRef<PaletteName>(theme === "light" ? "warm" : "cool");

  // Keep palette in ref so render loop reads live value without restart
  useEffect(() => {
    paletteRef.current = theme === "light" ? "warm" : "cool";
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    // Coarse pointer (touch, pen) — skip fluid trail
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!finePointer) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const nodes: FluidNode[] = [];
    const pointer = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      px: window.innerWidth * 0.5,
      py: window.innerHeight * 0.5,
      lastEmit: 0,
      active: false,
    };
    let rafId = 0;
    let booted = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const pushNode = (x: number, y: number, vx: number, vy: number, weight = 1) => {
      const speed = Math.min(1, Math.hypot(vx, vy) / 26);
      if (nodes.length >= MAX_NODES) nodes.shift();
      nodes.push({
        x,
        y,
        vx: vx * 0.038,
        vy: vy * 0.038,
        life: 1,
        decay: 0.028 - speed * 0.004,
        radius: 22 + speed * 16 + weight * 3 + Math.random() * 8,
        stretch: 1.14 + speed * 0.26,
        rotation: Math.atan2(vy || 0.01, vx || 0.01),
        drift: (Math.random() - 0.5) * 0.02,
        alpha: 0.04 + speed * 0.034 + weight * 0.008,
        kind: Math.random() > 0.5 ? 0 : 1,
      });
    };

    const handlePointer = (e: PointerEvent) => {
      if (!booted) {
        booted = true;
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.px = e.clientX;
        pointer.py = e.clientY;
      }

      const now = performance.now();
      const dx = e.clientX - pointer.x;
      const dy = e.clientY - pointer.y;
      const dist = Math.hypot(dx, dy);

      pointer.px = pointer.x;
      pointer.py = pointer.y;
      pointer.x = e.clientX;
      pointer.y = e.clientY;

      if (dist < MIN_STEP || now - pointer.lastEmit < SPAWN_INTERVAL) return;
      pointer.lastEmit = now;

      const steps = Math.min(5, Math.max(2, Math.ceil(dist / 18)));
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        pushNode(
          pointer.px + dx * t + (Math.random() - 0.5) * 4,
          pointer.py + dy * t + (Math.random() - 0.5) * 4,
          dx,
          dy,
          1 - t * 0.3,
        );
      }
    };

    const handleDown = (e: PointerEvent) => {
      pushNode(e.clientX, e.clientY, 0, 0, 1.6);
    };

    const drawNode = (n: FluidNode) => {
      const palette = PALETTES[paletteRef.current][n.kind];
      const grad = ctx.createRadialGradient(0, 0, n.radius * 0.08, 0, 0, n.radius);
      grad.addColorStop(0, `rgba(${palette.inner}, ${(n.alpha * 0.6).toFixed(3)})`);
      grad.addColorStop(0.28, `rgba(${palette.mid}, ${(n.alpha * 0.42).toFixed(3)})`);
      grad.addColorStop(0.78, `rgba(${palette.outer}, ${(n.alpha * 0.16).toFixed(3)})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate(n.rotation);
      ctx.scale(n.stretch, 1 / n.stretch);
      ctx.globalCompositeOperation = "lighter";
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgba(${palette.shadow}, ${(n.alpha * 0.5).toFixed(3)})`;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, n.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        n.life -= n.decay;
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= 0.99;
        n.vy *= 0.99;
        n.radius *= 1.012;
        n.rotation += n.drift;
        n.alpha *= 0.978;

        if (n.life <= 0.02 || n.alpha <= 0.008) {
          nodes.splice(i, 1);
          continue;
        }
        drawNode(n);
      }
      rafId = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointer, { passive: true });
    window.addEventListener("pointerdown", handleDown, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointer);
      window.removeEventListener("pointerdown", handleDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fluid-cursor"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 5,
      }}
    />
  );
}
