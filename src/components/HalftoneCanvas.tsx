"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface HalftoneHandle {
  setProgress: (progress: number) => void;
}

interface HalftoneCanvasProps {
  src: string;
  /** Dot color. */
  color: string;
  /** "light": highlights print as dots (glow on a dark ground). "dark": shadows do (ink on paper). */
  ink?: "light" | "dark";
  className?: string;
  label?: string;
}

interface Dots {
  x: Float32Array;
  y: Float32Array;
  r: Float32Array;
  seed: Float32Array;
  count: number;
}

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Renders an image as a halftone dot field. Dots assemble as progress goes 0 → 1,
 * so a scroll-driven parent can "print" the picture in.
 */
const HalftoneCanvas = forwardRef<HalftoneHandle, HalftoneCanvasProps>(function HalftoneCanvas(
  { src, color, ink = "dark", className, label },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dots | null>(null);
  const progressRef = useRef(1);
  const colorRef = useRef(color);
  const drawRef = useRef<() => void>(() => {});

  useImperativeHandle(ref, () => ({
    setProgress(progress: number) {
      const next = clamp(progress);
      if (Math.abs(next - progressRef.current) < 0.002) return;
      progressRef.current = next;
      drawRef.current();
    },
  }));

  useEffect(() => {
    colorRef.current = color;
    drawRef.current();
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let image: HTMLImageElement | null = null;
    let cancelled = false;

    const draw = () => {
      const dots = dotsRef.current;
      if (!dots) return;
      const p = progressRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = colorRef.current;
      ctx.beginPath();
      for (let i = 0; i < dots.count; i++) {
        // Each dot has its own moment to arrive; the field prints in unevenly.
        const local = clamp((p * 1.35 - dots.seed[i] * 0.35) / 1);
        if (local <= 0) continue;
        const radius = dots.r[i] * (local * local * (3 - 2 * local));
        if (radius < 0.35) continue;
        const drift = (1 - local) * 28 * dots.seed[i];
        ctx.moveTo(dots.x[i] + radius, dots.y[i] - drift);
        ctx.arc(dots.x[i], dots.y[i] - drift, radius, 0, Math.PI * 2);
      }
      ctx.fill();
    };
    drawRef.current = draw;

    const build = () => {
      if (!image) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);

      const cell = (window.innerWidth < 720 ? 7 : 8.5) * dpr;
      // object-fit: cover
      const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
      const drawW = image.naturalWidth * scale;
      const drawH = image.naturalHeight * scale;
      const offX = (canvas.width - drawW) / 2;
      const offY = (canvas.height - drawH) / 2;

      const cols = Math.ceil(canvas.width / cell);
      const rows = Math.ceil(canvas.height / cell);
      const sample = document.createElement("canvas");
      sample.width = cols;
      sample.height = rows;
      const sctx = sample.getContext("2d", { willReadFrequently: true });
      if (!sctx) return;
      sctx.drawImage(image, offX / cell, offY / cell, drawW / cell, drawH / cell);
      const data = sctx.getImageData(0, 0, cols, rows).data;
      const lums = new Float32Array(cols * rows);
      for (let i = 0; i < lums.length; i++) {
        lums[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) / 255;
      }
      // Stretch contrast between the 4th and 96th percentile so flat photos still read.
      const sorted = Float32Array.from(lums).sort();
      const lo = sorted[Math.floor(sorted.length * 0.04)];
      const hi = sorted[Math.floor(sorted.length * 0.96)];
      const span = Math.max(hi - lo, 0.05);

      const total = cols * rows;
      const dots: Dots = {
        x: new Float32Array(total),
        y: new Float32Array(total),
        r: new Float32Array(total),
        seed: new Float32Array(total),
        count: 0,
      };
      const maxR = cell * 0.56;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const lum = clamp((lums[row * cols + col] - lo) / span);
          // Soft elliptical vignette so the field dissolves at its edges.
          const nx = (col + 0.5) / cols - 0.5;
          const ny = (row + 0.5) / rows - 0.5;
          const edge = clamp(1.4 - Math.sqrt(nx * nx * 3.4 + ny * ny * 2.4) * 1.5);
          const tone = Math.pow(ink === "light" ? lum : 1 - lum, 1.6) * edge;
          if (tone < 0.08) continue;
          const i = dots.count++;
          // Staggered rows, like a printed screen.
          dots.x[i] = (col + 0.5 + (row % 2) * 0.5) * cell;
          dots.y[i] = (row + 0.5) * cell;
          dots.r[i] = maxR * Math.sqrt(tone);
          dots.seed[i] = Math.random();
        }
      }
      dotsRef.current = dots;
      draw();
    };

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (cancelled) return;
      image = img;
      build();
    };
    img.src = src;

    let resizeFrame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(build);
    });
    observer.observe(canvas);

    return () => {
      cancelled = true;
      observer.disconnect();
      cancelAnimationFrame(resizeFrame);
      dotsRef.current = null;
      drawRef.current = () => {};
    };
  }, [src, ink]);

  return <canvas ref={canvasRef} className={className} role={label ? "img" : undefined} aria-label={label} />;
});

export default HalftoneCanvas;
