"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import { createPortal } from "react-dom";

export default function ActivityGallery({ images, caption }: { images: string[]; caption?: string }) {
  const [active, setActive] = useState(0);
  const [preview, setPreview] = useState<"idle" | "holding" | "releasing">("idle");
  const releaseTimer = useRef<number | undefined>(undefined);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const count = images.length;
  const multiple = count > 1;

  function move(direction: number) { setActive((index) => (index + direction + count) % count); }
  function beginPreview() {
    window.clearTimeout(releaseTimer.current);
    setPreview("holding");
  }
  function releasePreview() {
    setPreview((current) => current === "holding" ? "releasing" : current);
    window.clearTimeout(releaseTimer.current);
    releaseTimer.current = window.setTimeout(() => setPreview("idle"), 320);
  }

  useEffect(() => {
    return () => window.clearTimeout(releaseTimer.current);
  }, []);

  function startTouch(event: TouchEvent) {
    suppressClick.current = false;
    touch.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }

  function endTouch(event: TouchEvent) {
    if (!touch.current) return;
    const dx = event.changedTouches[0].clientX - touch.current.x;
    const dy = event.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (multiple && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      suppressClick.current = true;
      move(dx < 0 ? 1 : -1);
      window.setTimeout(() => { suppressClick.current = false; }, 250);
    }
  }

  function position(index: number) {
    if (index === active) return "center";
    if (count === 2) return index > active ? "right" : "left";
    if (index === (active + 1) % count) return "right";
    if (index === (active - 1 + count) % count) return "left";
    return "hidden";
  }

  return (
    <section className={`activity-gallery ${multiple ? "has-stack" : "is-single"}`} aria-label="动态图片" aria-roledescription="轮播图"
      onKeyDown={(event) => {
        if (!multiple) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}>
      <div className="activity-deck" onTouchStart={startTouch} onTouchEnd={endTouch} onTouchCancel={() => { touch.current = null; }}>
        {images.map((src, index) => {
          const slot = position(index);
          return <button key={`${src}-${index}`} type="button" className={`activity-card is-${slot}`}
            aria-label={slot === "center" ? `按住预览图片 ${index + 1}` : `切换到图片 ${index + 1}`}
            aria-hidden={slot === "hidden"} tabIndex={slot === "center" ? 0 : -1}
            onPointerDown={(event) => {
              if (event.pointerType === "mouse") suppressClick.current = false;
              if (index !== active || event.pointerType === "touch" || event.button !== 0) return;
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              beginPreview();
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
              releasePreview();
            }}
            onPointerCancel={releasePreview}
            onKeyDown={(event) => {
              if (index === active && event.key === " " && !event.repeat) { event.preventDefault(); beginPreview(); }
            }}
            onKeyUp={(event) => {
              if (index === active && event.key === " ") { event.preventDefault(); releasePreview(); }
            }}
            onClick={() => {
              if (suppressClick.current) { suppressClick.current = false; return; }
              if (index !== active) setActive(index);
            }}>
            <img src={src} alt={caption || `动态配图 ${index + 1}`} width={960} height={720} loading="lazy" draggable={false} />
          </button>;
        })}
      </div>
      {multiple ? <div className="activity-gallery-controls">
        <span role="status" aria-live="polite" aria-atomic="true">{active + 1} / {count}</span>
      </div> : null}
      {preview !== "idle" ? createPortal(
        <div className={`activity-hold-preview is-${preview}`} aria-hidden="true">
          <img key={active} src={images[active]} alt={caption || `动态配图 ${active + 1}`}
            width={1600} height={1200} draggable={false} />
        </div>, document.body) : null}
    </section>
  );
}
