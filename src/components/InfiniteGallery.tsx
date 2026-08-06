"use client";

import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import type { ContentEntry } from "@/lib/content";
import { generateScatterLayout, getScatterLayoutHeight, CANVAS_W } from "./galleryLayout";
import type { GalleryItem } from "./galleryLayout";
import "./InfiniteGallery.css";

const FRICTION = 0.93;
const VELOCITY_THRESHOLD = 0.05;
const PARALLAX_STRENGTH_X = 8;
const PARALLAX_STRENGTH_Y = 5;
const DEPTH_Z = 0.06;
const ROTATE_Y_FACTOR = 0.004;
const ROTATE_X_FACTOR = 0.003;
const SCALE_MIN = 0.85;
const SCALE_DIST_FACTOR = 0.0002;
const OPACITY_MIN = 0.3;
const OPACITY_DIST_FACTOR = 1000;
const BLUR_MAX = 3;
const BLUR_DIST_FACTOR = 400;
const NEAREST_DIST_THRESHOLD = 160;

interface InfiniteGalleryProps {
  entries: ContentEntry[];
  galleryImages?: string[];
}

function wrap(value: number, range: number) {
  const half = range / 2;
  let result = value % range;
  if (result > half) result -= range;
  if (result < -half) result += range;
  return result;
}

export default function InfiniteGallery({ entries, galleryImages }: InfiniteGalleryProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [items, setItems] = useState<GalleryItem[]>(() => generateScatterLayout(entries, galleryImages));
  const canvasH = useMemo(() => getScatterLayoutHeight(items), [items]);

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number>(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const offsetX = useRef(0);
  const offsetY = useRef(items.length > 0 ? items[0].baseY - 120 : 0);
  const velocityX = useRef(0);
  const velocityY = useRef(0);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragMoved = useRef(0);
  const parallaxX = useRef(0);
  const parallaxY = useRef(0);
  const bgIdx = useRef(0);

  const [isDragging, setIsDragging] = useState(false);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [mobileFlipped, setMobileFlipped] = useState<string | null>(null);
  const [bgImages, setBgImages] = useState<[string, string]>(() => {
    const first = items[0]?.image || "";
    return [first, ""];
  });
  const [bgFront, setBgFront] = useState(0);
  const [hudText, setHudText] = useState(() => {
    const first = items[0];
    return first ? { id: first.id, year: first.year } : { id: "", year: "" };
  });

  const handleImageLoad = useCallback((id: string, event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (!naturalWidth || !naturalHeight) return;

    setItems((current) => {
      let changed = false;
      const next = current.map((item) => {
        if (item.id !== id) return item;
        const width = Math.round(item.height * (naturalWidth / naturalHeight));
        if (item.width === width) return item;
        changed = true;
        return { ...item, width };
      });
      return changed ? next : current;
    });
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const setBackground = useCallback(
    (image: string) => {
      if (!image || image === bgImages[bgIdx.current]) return;
      const next = bgIdx.current === 0 ? 1 : 0;
      const nextArr: [string, string] = [...bgImages];
      nextArr[next] = image;
      setBgImages(nextArr);
      bgIdx.current = next;
      setBgFront(next);
    },
    [bgImages]
  );

  // Physics loop inside effect to avoid lint errors about refs during render
  useEffect(() => {
    if (isMobile) return;

    const loop = () => {
      velocityX.current *= FRICTION;
      velocityY.current *= FRICTION;
      if (Math.abs(velocityX.current) < VELOCITY_THRESHOLD) velocityX.current = 0;
      if (Math.abs(velocityY.current) < VELOCITY_THRESHOLD) velocityY.current = 0;

      offsetX.current += velocityX.current;
      offsetY.current += velocityY.current;
      offsetX.current = wrap(offsetX.current, CANVAS_W);
      offsetY.current = wrap(offsetY.current, canvasH);

      const scene = sceneRef.current;
      if (!scene || items.length === 0) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const sceneW = scene.clientWidth;
      const sceneH = scene.clientHeight;
      const centerX = sceneW / 2;
      const centerY = sceneH / 2;

      let nearestDist = Infinity;
      let nearestIdx = 0;
      let nearestScreenX = 0;
      let nearestScreenY = 0;
      let nearestW = 0;
      let nearestH = 0;

      items.forEach((item, idx) => {
        const card = cardRefs.current[idx];
        if (!card) return;

        const rawX = item.baseX - offsetX.current + parallaxX.current * PARALLAX_STRENGTH_X;
        const rawY = item.baseY - offsetY.current + parallaxY.current * PARALLAX_STRENGTH_Y;
        const wrappedX = wrap(rawX, CANVAS_W);
        const wrappedY = wrap(rawY, canvasH);
        const screenX = wrappedX + centerX - item.width / 2;
        const screenY = wrappedY + centerY - item.height / 2;

        const dx = wrappedX;
        const dy = wrappedY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = idx;
          nearestScreenX = screenX;
          nearestScreenY = screenY;
          nearestW = item.width;
          nearestH = item.height;
        }

        const isNearest = dist < NEAREST_DIST_THRESHOLD;
        const z = -dist * DEPTH_Z;
        const rotateY = dx * ROTATE_Y_FACTOR;
        const rotateX = -dy * ROTATE_X_FACTOR;
        const scale = isNearest ? 1.03 : Math.max(SCALE_MIN, 1 - dist * SCALE_DIST_FACTOR);
        const opacity = isNearest ? 1 : Math.min(1, Math.max(OPACITY_MIN, 1 - dist / OPACITY_DIST_FACTOR));
        const blur = isNearest ? 0 : Math.min(BLUR_MAX, dist / BLUR_DIST_FACTOR);

        card.style.transform = `translate3d(${screenX}px, ${screenY}px, ${z}px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${scale})`;
        card.style.opacity = String(opacity);
        card.style.filter = blur > 0.3 ? `blur(${blur}px)` : "none";
        card.style.zIndex = isNearest ? "100" : String(Math.round(80 - dist * 0.05));
      });

      if (hudRef.current) {
        hudRef.current.style.transform = `translate(${nearestScreenX - 15}px, ${nearestScreenY - 15}px)`;
        hudRef.current.style.width = `${nearestW + 30}px`;
        hudRef.current.style.height = `${nearestH + 30}px`;
      }

      const item = items[nearestIdx];
      if (item) {
        if (item.image) setBackground(item.image);
        if (counterRef.current) {
          counterRef.current.textContent = `${nearestIdx + 1} / ${items.length}`;
        }
        setHudText({ id: item.id, year: item.year });
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [canvasH, isMobile, items, setBackground]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isMobile) return;
      setIsDragging(true);
      dragMoved.current = 0;
      dragStartX.current = e.clientX;
      dragStartY.current = e.clientY;
      velocityX.current = 0;
      velocityY.current = 0;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [isMobile]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isMobile) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        parallaxX.current = (e.clientX - rect.left) / rect.width - 0.5;
        parallaxY.current = (e.clientY - rect.top) / rect.height - 0.5;
      }

      if (!isDragging) return;
      const dx = e.clientX - dragStartX.current;
      const dy = e.clientY - dragStartY.current;
      offsetX.current -= dx;
      offsetY.current += dy; // match wheel direction: drag down → view moves down
      velocityX.current = -dx;
      velocityY.current = dy;
      dragMoved.current += Math.abs(dx) + Math.abs(dy);
      dragStartX.current = e.clientX;
      dragStartY.current = e.clientY;
    },
    [isMobile, isDragging]
  );

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      const dy = e.shiftKey ? 0 : e.deltaY;
      offsetX.current += dx;
      offsetY.current += dy;
      velocityX.current += dx * 0.3;
      velocityY.current += dy * 0.3;
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [isMobile]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") velocityX.current -= 80;
      if (e.key === "ArrowRight") velocityX.current += 80;
      if (e.key === "ArrowUp") velocityY.current -= 80;
      if (e.key === "ArrowDown") velocityY.current += 80;
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleCardClick = useCallback(
    (id: string) => {
      if (dragMoved.current > 10) return;
      setFlippedId((prev) => (prev === id ? null : id));
    },
    []
  );

  const mobileStripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isMobile) return;
    const el = mobileStripRef.current;
    if (!el) return;
    const onScroll = () => {
      const scrollLeft = el.scrollLeft;
      const cardW = el.querySelector(".ig-mob-card")?.clientWidth || 260;
      const gap = 16;
      const idx = Math.round(scrollLeft / (cardW + gap));
      setMobileIndex(Math.min(idx, items.length - 1));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [isMobile, items.length]);

  if (items.length === 0) {
    return (
      <section className="ig-section" id="gallery">
        <div className="ig-empty">暂无照片</div>
      </section>
    );
  }

  if (isMobile) {
    return (
      <section className="ig-section ig-mobile" id="gallery">
        <div className="ig-bg-layer">
          <div
            className={`ig-bg-image ${bgFront === 0 ? "ig-bg-front" : ""}`}
            style={bgImages[0] ? { backgroundImage: `url(${bgImages[0]})` } : undefined}
          />
          <div
            className={`ig-bg-image ${bgFront === 1 ? "ig-bg-front" : ""}`}
            style={bgImages[1] ? { backgroundImage: `url(${bgImages[1]})` } : undefined}
          />
          <div className="ig-bg-tint" />
        </div>
        <div className="ig-grain" />
        <div className="ig-header">
          <span className="ig-eyebrow">[ PHOTOS ]</span>
          <h2 className="ig-title">照片</h2>
          <p className="ig-subtitle">Light archive</p>
        </div>
        <div className="ig-counter">
          <span>
            {mobileIndex + 1} / {items.length}
          </span>
        </div>
        <div className="ig-mob-strip" ref={mobileStripRef}>
          {items.map((item) => (
            <div
              key={item.id}
              className={`ig-mob-card ${mobileFlipped === item.id ? "flipped" : ""}`}
              style={{ "--card-ratio": `${item.width} / ${item.height}` } as CSSProperties}
              onClick={() => setMobileFlipped((p) => (p === item.id ? null : item.id))}
            >
              <div className="ig-mob-card-inner">
                <div className="ig-mob-front">
                  <img src={item.image} alt={item.title} draggable={false} loading="lazy" decoding="async" onLoad={(event) => handleImageLoad(item.id, event)} />
                </div>
                <div className="ig-mob-back">
                  <span className="ig-back-year">{item.year}</span>
                  <div className="ig-back-divider" />
                  <h3 className="ig-back-title">{item.title}</h3>
                  {item.caption && <p className="ig-back-caption">{item.caption}</p>}
                  <div className="ig-back-divider" />
                  {item.slug && (
                    <Link href={`/photos/${item.slug}`} className="ig-back-link">
                      查看详情 →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="ig-mob-dots">
          {items.map((_, i) => (
            <div key={i} className={`ig-mob-dot ${i === mobileIndex ? "active" : ""}`} />
          ))}
        </div>
        <div className="ig-hint">
          <span>滑动浏览 · 点击查看</span>
        </div>
      </section>
    );
  }

  return (
    <section className={`ig-section ${isLight ? "ig-light" : ""}`} id="gallery">
      <div className="ig-bg-layer">
        <div
          className={`ig-bg-image ${bgFront === 0 ? "ig-bg-front" : ""}`}
          style={bgImages[0] ? { backgroundImage: `url(${bgImages[0]})` } : undefined}
        />
        <div
          className={`ig-bg-image ${bgFront === 1 ? "ig-bg-front" : ""}`}
          style={bgImages[1] ? { backgroundImage: `url(${bgImages[1]})` } : undefined}
        />
        <div className="ig-bg-tint" />
      </div>

      <div className="ig-grain" />
      <div className="ig-vignette" />

      <div className="ig-header">
        <span className="ig-eyebrow">[ PHOTOS ]</span>
        <h2 className="ig-title">照片</h2>
        <p className="ig-subtitle">Light archive</p>
      </div>

      <div className="ig-counter">
        <span ref={counterRef}>
          1 / {items.length}
        </span>
      </div>

      <div
        className={`ig-container ${isDragging ? "ig-dragging" : ""}`}
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="ig-scene" ref={sceneRef}>
          <div className="ig-hud" ref={hudRef}>
            <div className="ig-hud-corner tl" />
            <div className="ig-hud-corner tr" />
            <div className="ig-hud-corner bl" />
            <div className="ig-hud-corner br" />
            <div className="ig-hud-ruler-v" />
            <div className="ig-hud-ruler-h" />
            <div className="ig-hud-info">
              <span className="ig-hud-coords">
                #{String(hudText.id).padStart(2, "0")} — {hudText.year}
              </span>
            </div>
          </div>

          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`ig-card ${flippedId === item.id ? "flipped" : ""}`}
              ref={(el) => { cardRefs.current[idx] = el; }}
              onClick={() => handleCardClick(item.id)}
              role="button"
              aria-label={`${item.title}，点击翻转`}
              style={{ width: item.width, height: item.height }}
            >
              <div className="ig-card-face ig-front">
                <img src={item.image} alt={item.title} className="ig-card-img" loading="lazy" draggable={false} onLoad={(event) => handleImageLoad(item.id, event)} />
                <div className="ig-card-grain" />
              </div>
              <div className="ig-card-face ig-back">
                <div className="ig-back-content">
                  <span className="ig-back-year">{item.year}</span>
                  <div className="ig-back-divider" />
                  <h3 className="ig-back-title">{item.title}</h3>
                  {item.caption && (
                    <>
                      <div className="ig-back-divider" />
                      <p className="ig-back-caption">{item.caption}</p>
                    </>
                  )}
                  <div className="ig-back-footer">
                    <span className="ig-back-id">#{String(idx + 1).padStart(2, "0")}</span>
                    {item.slug && (
                      <Link href={`/photos/${item.slug}`} className="ig-back-arrow" onClick={(e) => e.stopPropagation()}>
                        查看 →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ig-hint">
        <span>拖拽浏览 · 滚轮缩放 · 点击查看</span>
      </div>
    </section>
  );
}
