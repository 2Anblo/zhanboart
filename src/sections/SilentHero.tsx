"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTheme } from "@/components/ThemeProvider";
import { heroConfig } from "@/config";

gsap.registerPlugin(ScrollTrigger);

export default function SilentHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLHeadingElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const { theme } = useTheme();

  const isLight = theme === "light";
  const videoSrc = isLight
    ? heroConfig.videoSrcLight ?? heroConfig.videoSrc
    : heroConfig.videoSrc;
  const posterSrc = isLight
    ? heroConfig.posterSrcLight ?? heroConfig.posterSrc
    : heroConfig.posterSrc;

  useEffect(() => {
    const section = sectionRef.current;
    const media = mediaRef.current;
    const line = lineRef.current;
    const veil = veilRef.current;
    if (!section || !media || !line || !veil) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const context = gsap.context(() => {
      gsap.set(media, { scale: 1.075 });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: 0.65,
        },
      });

      timeline
        .to(
          line,
          {
            opacity: 0,
            y: -42,
            filter: "blur(10px)",
            ease: "power1.in",
          },
          0,
        )
        .to(
          media,
          {
            scale: 1,
            opacity: 0.62,
            ease: "none",
          },
          0,
        )
        .to(
          veil,
          {
            opacity: 1,
            ease: "none",
          },
          0,
        );
    }, section);

    return () => context.revert();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const canTrackPointer = window.matchMedia("(pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canTrackPointer || reduceMotion) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (pointerFrameRef.current !== null) return;

      pointerFrameRef.current = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        section.style.setProperty("--hero-pointer-x", `${x.toFixed(2)}%`);
        section.style.setProperty("--hero-pointer-y", `${y.toFixed(2)}%`);
        pointerFrameRef.current = null;
      });
    };

    section.addEventListener("pointermove", handlePointerMove);

    return () => {
      section.removeEventListener("pointermove", handlePointerMove);
      if (pointerFrameRef.current !== null) {
        cancelAnimationFrame(pointerFrameRef.current);
      }
    };
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="silent-hero"
      aria-label={heroConfig.ariaLabel}
    >
      <div className="silent-hero__viewport">
        <div ref={mediaRef} className="silent-hero__media" aria-hidden="true">
          {videoSrc ? (
            <video
              key={videoSrc}
              className="silent-hero__asset"
              poster={posterSrc}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              style={{ objectPosition: heroConfig.objectPosition }}
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          ) : (
            <img
              className="silent-hero__asset"
              src={posterSrc}
              alt=""
              width={1248}
              height={752}
              loading="eager"
              fetchPriority="high"
              style={{ objectPosition: heroConfig.objectPosition }}
            />
          )}
        </div>

        <div className="silent-hero__exposure" aria-hidden="true" />
        <div className="silent-hero__pointer-light" aria-hidden="true" />
        <div ref={veilRef} className="silent-hero__exit-veil" aria-hidden="true" />

        <div className="silent-hero__copy">
          <h1 ref={lineRef}>{heroConfig.line}</h1>
        </div>
      </div>
    </section>
  );
}
