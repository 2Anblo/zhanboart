"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTheme } from "@/components/ThemeProvider";
import MusicPlayer from "@/components/MusicPlayer";
import { musicSectionConfig } from "@/config";
import type { ContentEntry } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger);

interface MusicSectionProps {
  entries: ContentEntry[];
}

export default function MusicSection({ entries }: MusicSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isLight = theme === "light";

  const featured = entries.find((e) => e.audio) || entries[0];
  const recent = entries.filter((e) => e.slug !== featured?.slug).slice(0, 2);

  useEffect(() => {
    const section = sectionRef.current;
    const text = textRef.current;
    const player = playerRef.current;
    const list = listRef.current;
    if (!section || !text || !player) return;

    const textEls = text.querySelectorAll(".animate-in");
    const listEls = list?.querySelectorAll(".animate-in");

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 80%",
      },
    });

    tl.fromTo(textEls, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.1 });
    tl.fromTo(player, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }, "-=0.4");

    if (listEls && listEls.length > 0) {
      tl.fromTo(listEls, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", stagger: 0.1 }, "-=0.3");
    }

    return () => {
      tl.kill();
    };
  }, []);

  const bgColor = isLight ? "var(--day-bg)" : "var(--night-bg)";
  const textColor = isLight ? "var(--day-text)" : "var(--night-text)";
  const mutedColor = isLight ? "var(--day-muted)" : "var(--night-muted)";
  const borderColor = isLight ? "rgba(42,41,38,0.14)" : "rgba(255,255,255,0.12)";

  if (entries.length === 0) return null;

  return (
    <section
      id="music"
      ref={sectionRef}
      style={{
        background: bgColor,
        padding: "10rem var(--page-padding)",
        transition: "background-color 0.5s ease",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "1200px" }}>
        {/* Two-column: text + player */}
        <div className="flex flex-col md:flex-row gap-12 md:gap-16 items-start">
          {/* Left — Text */}
          <div ref={textRef} className="w-full md:w-1/2">
            {musicSectionConfig.sectionLabel && (
              <div
                className="animate-in"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "11px",
                  fontWeight: 400,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: mutedColor,
                  marginBottom: "2rem",
                  transition: "color 0.5s ease",
                }}
              >
                {musicSectionConfig.sectionLabel}
              </div>
            )}

            {musicSectionConfig.title && (
              <h2
                className="animate-in"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(2rem, 5vw, 3.5rem)",
                  color: textColor,
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                  marginBottom: "2.5rem",
                  transition: "color 0.5s ease",
                }}
              >
                {musicSectionConfig.title}
              </h2>
            )}

            {musicSectionConfig.paragraphs.map((text, i) => (
              <p
                key={i}
                className="animate-in"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 300,
                  fontSize: "16px",
                  color: textColor,
                  lineHeight: 1.7,
                  marginBottom: "1.5rem",
                  transition: "color 0.5s ease",
                }}
              >
                {text}
              </p>
            ))}
          </div>

          {/* Right — Player */}
          <div ref={playerRef} className="w-full md:w-1/2 flex items-center justify-center">
            {featured && (
              <MusicPlayer
                src={featured.audio || ""}
                title={featured.title}
                artist={featured.artist}
                albumArt={featured.albumArt || featured.image}
              />
            )}
          </div>
        </div>

        {/* Recent entries */}
        {recent.length > 0 && (
          <div ref={listRef} className="mt-16">
            <div
              className="animate-in"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: mutedColor,
                marginBottom: "1.5rem",
              }}
            >
              Recent
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recent.map((entry) => (
                <Link
                  key={entry.slug}
                  href={`/music/${entry.slug}`}
                  className="animate-in group block"
                  style={{
                    padding: "1.25rem 0",
                    borderTop: `1px solid ${borderColor}`,
                    color: "inherit",
                    textDecoration: "none",
                    transition: "border-color 0.5s ease",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.72rem",
                      lineHeight: 1.45,
                      color: mutedColor,
                      marginBottom: "0.4rem",
                    }}
                  >
                    {entry.date}
                    {entry.artist ? ` / ${entry.artist}` : ""}
                  </div>
                  <div
                    className="group-hover:opacity-100"
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "clamp(1.2rem, 2vw, 1.5rem)",
                      lineHeight: 1.15,
                      color: textColor,
                      transition: "color 0.3s ease",
                    }}
                  >
                    {entry.title}
                  </div>
                  {entry.excerpt && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                        color: mutedColor,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {entry.excerpt}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12">
          <Link
            href="/music"
            className="animate-in inline-block"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              fontWeight: 400,
              letterSpacing: "0.1em",
              color: textColor,
              textDecoration: "none",
              borderBottom: `1px solid ${borderColor}`,
              paddingBottom: "0.2rem",
              transition: "border-color 0.3s ease, color 0.5s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--color-amber)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = borderColor;
            }}
          >
            {musicSectionConfig.ctaText} →
          </Link>
        </div>
      </div>
    </section>
  );
}
