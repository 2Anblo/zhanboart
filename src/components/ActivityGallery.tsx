"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import { createPortal } from "react-dom";

export default function ActivityGallery({ images, caption }: { images: string[]; caption?: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const expanded = useRef<HTMLButtonElement>(null);
  const activeCard = useRef<HTMLButtonElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const count = images.length;
  const multiple = count > 1;

  function move(direction: number) { setActive((index) => (index + direction + count) % count); }
  function closeCanvas(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => activeCard.current?.focus({ preventScroll: true }));
  }

  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    expanded.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

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
            ref={slot === "center" ? activeCard : undefined}
            aria-label={slot === "center" ? `放大图片 ${index + 1}` : `切换到图片 ${index + 1}`}
            aria-hidden={slot === "hidden"} tabIndex={slot === "center" ? 0 : -1}
            onPointerDown={(event) => { if (event.pointerType === "mouse") suppressClick.current = false; }}
            onClick={() => {
              if (suppressClick.current) { suppressClick.current = false; return; }
              if (index === active) setOpen(true); else setActive(index);
            }}>
            <img src={src} alt={caption || `动态配图 ${index + 1}`} width={960} height={720} loading="lazy" draggable={false} />
          </button>;
        })}
      </div>
      {multiple ? <div className="activity-gallery-controls">
        <span role="status" aria-live="polite" aria-atomic="true">{active + 1} / {count}</span>
      </div> : null}
      {open ? createPortal(
        <button ref={expanded} type="button" className="activity-cinema-canvas" aria-label="收起大图"
          onClick={() => {
            if (suppressClick.current) { suppressClick.current = false; return; }
            closeCanvas();
          }} onTouchStart={startTouch} onTouchEnd={(event) => {
            const before = active;
            endTouch(event);
            if (before === active && !suppressClick.current) closeCanvas();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") { event.preventDefault(); closeCanvas(true); }
            if (multiple && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
              event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1);
            }
          }}>
          <img key={active} src={images[active]} alt={caption || `动态配图 ${active + 1}`}
            width={1600} height={1200} draggable={false} />
          {multiple ? <span aria-hidden="true">{active + 1} / {count}</span> : null}
        </button>, document.body) : null}
    </section>
  );
}
