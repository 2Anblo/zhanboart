"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { memoryStripConfig } from "@/config";

gsap.registerPlugin(ScrollTrigger);

export default function MemoryStrip() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.innerWidth < 721) return;

    const context = gsap.context(() => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: { trigger: section, start: "top top", end: () => `+=${distance() * 1.25}`, pin: true, scrub: 0.8, invalidateOnRefresh: true },
      });
    }, section);
    return () => context.revert();
  }, []);

  return (
    <section ref={sectionRef} className="memory-strip" aria-label="记忆片段">
      <div ref={trackRef} className="memory-strip__track">
        <p className="memory-strip__marker">02 / MEMORY</p>
        {memoryStripConfig.map((fragment, index) => {
          if (fragment.kind === "image") return <figure key={index} className={`memory-fragment ${fragment.className}`}><img src={fragment.src} alt={fragment.alt} width={640} height={480} loading="lazy" /></figure>;
          if (fragment.kind === "text") return <p key={index} className={`memory-fragment memory-fragment--text ${fragment.className}`}><span>{fragment.eyebrow}</span>{fragment.text}</p>;
          return <p key={index} className={`memory-fragment memory-fragment--trace ${fragment.className}`}><span>{fragment.label}</span>{fragment.value}</p>;
        })}
      </div>
    </section>
  );
}
