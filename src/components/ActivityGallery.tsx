"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";

export default function ActivityGallery({ images, caption }: { images: string[]; caption?: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const count = images.length;
  const multiple = count > 1;

  function move(direction: number) { setActive((index) => (index + direction + count) % count); }

  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => {
      element?.close();
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
      <dialog ref={dialog} className="activity-lightbox" aria-label="查看动态大图" onClose={() => {
        setOpen(false);
        dialog.current?.parentElement?.querySelector<HTMLButtonElement>(".activity-card.is-center")?.focus({ preventScroll: true });
      }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button");
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}
        onPointerDown={() => { suppressClick.current = false; }}
        onClick={(event) => {
          if (suppressClick.current) { suppressClick.current = false; return; }
          const target = event.target;
          if (!(target instanceof Element) || target.closest("button")) return;
          if (target instanceof HTMLImageElement) {
            // object-fit leaves empty space inside the img element; only the photo itself stays open.
            if (!target.naturalWidth || !target.naturalHeight) return;
            const rect = target.getBoundingClientRect();
            const scale = Math.min(rect.width / target.naturalWidth, rect.height / target.naturalHeight);
            const width = target.naturalWidth * scale;
            const height = target.naturalHeight * scale;
            const left = rect.left + (rect.width - width) / 2;
            const top = rect.top + (rect.height - height) / 2;
            if (event.clientX >= left && event.clientX <= left + width && event.clientY >= top && event.clientY <= top + height) return;
          }
          setOpen(false);
        }}>
        {open ? <>
          <div className="activity-lightbox-toolbar">
            <span role="status" aria-live="polite">{active + 1} / {count}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="关闭大图" autoFocus>×</button>
          </div>
          <div className="activity-lightbox-stage" onTouchStart={startTouch} onTouchEnd={endTouch}
            onTouchCancel={() => { touch.current = null; }}>
            <img key={active} src={images[active]} alt={caption || `动态配图 ${active + 1}`} width={1600} height={1200} draggable={false} />
          </div>
          {multiple ? <div className="activity-lightbox-controls">
            <button type="button" aria-label="上一张大图" onClick={() => move(-1)}>←</button>
            <button type="button" aria-label="下一张大图" onClick={() => move(1)}>→</button>
          </div> : null}
        </> : null}
      </dialog>
    </section>
  );
}
