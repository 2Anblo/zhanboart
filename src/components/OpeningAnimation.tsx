"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useTheme } from "@/components/ThemeProvider";

export default function OpeningAnimation({ onComplete }: { onComplete?: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const [shouldPlay, setShouldPlay] = useState(false);
  const { theme } = useTheme();
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      onCompleteRef.current?.();
      return;
    }
    const hasPlayed = sessionStorage.getItem("zhanbo-opening-played");
    if (hasPlayed) {
      onCompleteRef.current?.();
      return;
    }
    const id = requestAnimationFrame(() => {
      setShouldPlay(true);
      sessionStorage.setItem("zhanbo-opening-played", "true");
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!shouldPlay) return;

    const overlay = overlayRef.current;
    const title = titleRef.current;
    const line = lineRef.current;
    const subtitle = subtitleRef.current;
    if (!overlay || !title || !line || !subtitle) return;

    const letters = title.querySelectorAll<HTMLElement>(".opening-letter");
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(overlay, { display: "none" });
        onCompleteRef.current?.();
      },
    });

    gsap.set(overlay, { clipPath: "inset(0 0 0 0)" });
    gsap.set(letters, { opacity: 0, y: 16, filter: "blur(5px)" });
    gsap.set(line, { scaleX: 0 });
    gsap.set(subtitle, { opacity: 0, y: 8 });

    tl.to(letters, {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.65,
      stagger: 0.05,
      ease: "power3.out",
      delay: 0.25,
    })
      .to(line, { scaleX: 1, duration: 0.7, ease: "power2.inOut" }, "-=0.25")
      .to(subtitle, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.35")
      .to({}, { duration: 0.7 }) // hold
      .to(overlay, {
        clipPath: "inset(0 0 100% 0)",
        duration: 1.0,
        ease: "power3.inOut",
      });

    return () => {
      tl.kill();
    };
  }, [shouldPlay]);

  if (!shouldPlay) return null;

  const isLight = theme === "light";
  const bg = isLight ? "var(--day-bg)" : "var(--night-bg)";
  const textColor = isLight ? "var(--day-text)" : "var(--night-text)";
  const mutedColor = isLight ? "rgba(42,41,38,0.55)" : "rgba(230,225,216,0.55)";
  const lineColor = isLight ? "rgba(42,41,38,0.22)" : "rgba(230,225,216,0.22)";

  const titleText = "zhanbo.art";

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
      }}
    >
      <div
        ref={titleRef}
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(2.2rem, 5.5vw, 4rem)",
          fontWeight: 400,
          letterSpacing: "0.42em",
          color: textColor,
          lineHeight: 1,
          display: "flex",
          paddingLeft: "0.42em",
        }}
      >
        {titleText.split("").map((char, i) => (
          <span
            key={i}
            className="opening-letter"
            style={{ display: "inline-block", whiteSpace: char === " " ? "pre" : undefined }}
          >
            {char}
          </span>
        ))}
      </div>

      <div
        ref={lineRef}
        style={{
          width: "100px",
          height: "1px",
          background: lineColor,
          marginTop: "1.6rem",
          transformOrigin: "center",
        }}
      />

      <div
        ref={subtitleRef}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "clamp(0.78rem, 1.1vw, 0.92rem)",
          fontWeight: 300,
          letterSpacing: "0.1em",
          color: mutedColor,
          marginTop: "1.1rem",
        }}
      >
        一些不需要被总结的东西
      </div>
    </div>
  );
}
