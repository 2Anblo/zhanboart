"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { CSSProperties, RefObject } from "react";
import Link from "next/link";
import type Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { landingConfig, navigationConfig } from "@/config";
import { useTheme } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import HalftoneCanvas from "@/components/HalftoneCanvas";
import type { HalftoneHandle } from "@/components/HalftoneCanvas";

gsap.registerPlugin(ScrollTrigger);

export interface LandingEntry {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  location?: string;
  image?: string;
}

interface LandingStageProps {
  journal: LandingEntry[];
  photos: LandingEntry[];
  lenisRef: RefObject<Lenis | null>;
}

// Scroll length of each scene, in viewport heights.
const SCENES = [
  { key: "hero", weight: 1.3, chapter: -1 },
  { key: "journal", weight: 1.9, chapter: 0 },
  { key: "photos", weight: 3.2, chapter: 1 },
  { key: "music", weight: 1.9, chapter: 2 },
  { key: "fragments", weight: 3.4, chapter: 3 },
  { key: "finale", weight: 1.4, chapter: -1 },
] as const;

const STARTS = SCENES.reduce<number[]>((acc, scene, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + SCENES[i - 1].weight);
  return acc;
}, []);
const TOTAL = STARTS[STARTS.length - 1] + SCENES[SCENES.length - 1].weight;
// How much scroll the ink transition into a scene takes.
const REVEAL = 0.6;

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v: number) => {
  const c = clamp(v);
  return c * c * (3 - 2 * c);
};

function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0Q13.1 10.9 24 12Q13.1 13.1 12 24Q10.9 13.1 0 12Q10.9 10.9 12 0Z" />
    </svg>
  );
}

// Lines that rise out of their own mask as the scene's --in goes 0 → 1.
function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line, i) => (
        <span key={i} className="ln" style={{ "--i": i } as CSSProperties}>
          <i>{line}</i>
        </span>
      ))}
    </>
  );
}

function Arrow() {
  return (
    <span className="stage-arrow" aria-hidden="true">
      <svg viewBox="0 0 12 12">
        <path d="M2 6h8M6.5 2.5 10 6l-3.5 3.5" />
      </svg>
    </span>
  );
}

// Keep Chinese clauses whole when a line has to wrap.
function clauses(text: string) {
  return text.match(/[^，、。；]+[，、。；]?/g) ?? [text];
}

function formatDate(date: string) {
  return date.replaceAll("-", ".");
}

export default function LandingStage({ journal, photos, lenisRef }: LandingStageProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const inkRef = useRef<SVGFEFuncAElement>(null);
  const warpRef = useRef<SVGFEDisplacementMapElement>(null);
  const halftoneRef = useRef<HalftoneHandle>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);

  const { hero, journal: journalCopy, photos: photoCopy, music, fragments, finale } = landingConfig;
  const latest = journal[0];
  const photoGroups = photoCopy.groups.length + (photos.length ? 1 : 0);

  const scrollToScene = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const range = track.offsetHeight - window.innerHeight;
    const top = track.getBoundingClientRect().top + window.scrollY;
    // Land just after the ink transition has finished.
    const target = top + ((STARTS[index] + 0.12) / TOTAL) * range;
    const lenis = lenisRef.current;
    if (lenis) lenis.scrollTo(target, { duration: 1.8 });
    else window.scrollTo({ top: target, behavior: "smooth" });
  };

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    const scenes = Array.from(stage.querySelectorAll<HTMLElement>(":scope > .scene"));
    const groups = Array.from(stage.querySelectorAll<HTMLElement>(".photos-group"));
    const cards = Array.from(stage.querySelectorAll<HTMLElement>(".fragment-card"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const narrow = () => window.innerWidth < 720;
    let inkScene = -1;
    let activeChapter = -2;

    const setVars = (el: HTMLElement, vars: Record<string, number>) => {
      for (const key in vars) el.style.setProperty(key, vars[key].toFixed(4));
    };

    const update = (t: number) => {
      const useInk = !reduceMotion && !isSafari && !narrow();
      let top = 0;
      const reveals = SCENES.map((_, i) => (i === 0 ? 1 : clamp((t - (STARTS[i] - REVEAL)) / REVEAL)));
      reveals.forEach((r, i) => {
        if (r > 0) top = i;
      });

      let nextInk = -1;
      SCENES.forEach((scene, i) => {
        const el = scenes[i];
        if (!el) return;
        const r = reveals[i];
        // A scene stays drawn until the one above it is fully opaque.
        const covered = i < SCENES.length - 1 && reveals[i + 1] >= 1;
        const visible = r > 0 && !covered;
        el.style.visibility = visible ? "visible" : "hidden";
        if (!visible) return;

        const local = clamp((t - STARTS[i]) / scene.weight);
        // Copy enters as the scene settles, before the hold begins.
        const enter = i === 0 ? 1 : smooth((t - (STARTS[i] - REVEAL * 0.35)) / (REVEAL * 0.9));
        setVars(el, { "--r": r, "--u": local, "--in": enter });

        if (r < 1 && i > 0) {
          if (useInk) nextInk = i;
          else el.style.opacity = reduceMotion ? (r > 0.5 ? "1" : "0") : r.toFixed(3);
        } else {
          el.style.opacity = "1";
        }
      });

      // Only one scene at a time carries the (costly) ink filter.
      if (nextInk !== inkScene) {
        if (inkScene >= 0) {
          const prev = scenes[inkScene];
          if (prev) prev.style.filter = "";
        }
        if (nextInk >= 0) {
          const el = scenes[nextInk];
          if (el) {
            el.style.opacity = "1";
            el.style.filter = "url(#stage-ink)";
          }
        }
        inkScene = nextInk;
      }
      if (inkScene >= 0) {
        const r = reveals[inkScene];
        inkRef.current?.setAttribute("intercept", (-5.4 + 6.8 * r).toFixed(3));
        warpRef.current?.setAttribute("scale", ((1 - r) * 60).toFixed(1));
      }

      // Scene-specific motion.
      const photosIndex = 2;
      if (reveals[photosIndex] > 0) {
        const u = clamp((t - STARTS[photosIndex] + REVEAL * 0.5) / (SCENES[photosIndex].weight * 0.55));
        halftoneRef.current?.setProgress(u);
        const hold = clamp((t - STARTS[photosIndex]) / SCENES[photosIndex].weight);
        if (rulerRef.current) rulerRef.current.style.transform = `translateY(${(-hold * 38).toFixed(2)}%)`;
        if (percentRef.current) percentRef.current.textContent = `${Math.round(hold * 100)}%`;
        const slot = hold * photoGroups;
        groups.forEach((group, k) => {
          if (!group) return;
          // Each group rises in, holds, then lifts away for the next.
          const d = slot - k - 0.5;
          const pinned = (k === 0 && d < 0) || (k === photoGroups - 1 && d > 0);
          const shown = pinned ? 1 : 1 - smooth((Math.abs(d) - 0.28) / 0.22);
          const y = pinned ? 0 : -d * 90;
          group.style.opacity = shown.toFixed(3);
          group.style.transform = `translateY(${y.toFixed(1)}px)`;
          group.style.pointerEvents = shown > 0.5 ? "auto" : "none";
        });
      }

      const fragIndex = 4;
      if (reveals[fragIndex] > 0) {
        const hold = clamp((t - STARTS[fragIndex] + 0.2) / (SCENES[fragIndex].weight - 0.2));
        const count = cards.length;
        const radius = narrow() ? Math.min(window.innerWidth * 0.56, 240) : Math.min(window.innerWidth * 0.3, 420);
        const turn = hold * (count - 1) * (360 / count);
        cards.forEach((card, k) => {
          if (!card) return;
          const angle = k * (360 / count) - turn;
          const rad = (angle * Math.PI) / 180;
          const depth = (Math.cos(rad) + 1) / 2;
          const lift = Math.sin(rad * 2) * 18;
          card.style.transform = `translate(-50%, -50%) translate3d(${(Math.sin(rad) * radius).toFixed(1)}px, ${lift.toFixed(1)}px, ${((depth - 1) * radius).toFixed(1)}px) scale(${(0.62 + 0.38 * depth).toFixed(3)})`;
          card.style.zIndex = String(Math.round(depth * 100));
          card.style.opacity = (0.12 + 0.88 * depth ** 2.5).toFixed(3);
          card.style.filter = reduceMotion || depth > 0.92 ? "none" : `blur(${((1 - depth) * 5).toFixed(2)}px)`;
          card.style.setProperty("--front", smooth((depth - 0.82) / 0.18).toFixed(3));
        });
      }

      // Chapter rail.
      const chapter = SCENES[top].chapter;
      if (chapter !== activeChapter) {
        activeChapter = chapter;
        railRef.current?.querySelectorAll("a").forEach((link, k) => {
          link.classList.toggle("is-on", k === chapter);
          if (k === chapter) link.setAttribute("aria-current", "step");
          else link.removeAttribute("aria-current");
        });
      }
      stage.dataset.scene = SCENES[top].key;
    };

    const trigger = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => update(self.progress * TOTAL),
      onRefresh: (self) => update(self.progress * TOTAL),
    });
    update(trigger.progress * TOTAL);
    const frame = requestAnimationFrame(() => setReady(true));

    // Soft pointer parallax on the hero picture.
    const canTrack = window.matchMedia("(pointer: fine)").matches && !reduceMotion;
    let pointerFrame = 0;
    const onPointer = (event: PointerEvent) => {
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        stage.style.setProperty("--px", ((event.clientX / window.innerWidth) - 0.5).toFixed(3));
        stage.style.setProperty("--py", ((event.clientY / window.innerHeight) - 0.5).toFixed(3));
        pointerFrame = 0;
      });
    };
    if (canTrack) window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      trigger.kill();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(pointerFrame);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [photoGroups]);

  return (
    <div
      ref={trackRef}
      className="stage-track"
      style={{ height: `${(TOTAL + 1) * 100}svh` }}
    >
      <div ref={stageRef} className={`stage${ready ? " is-ready" : ""}`} data-scene="hero">
        <svg className="stage-defs" aria-hidden="true" focusable="false">
          <defs>
            <filter id="stage-ink" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="3" seed="7" result="noise" />
              <feDisplacementMap ref={warpRef} in="SourceGraphic" in2="noise" scale="40" xChannelSelector="R" yChannelSelector="G" result="warp" />
              <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="alpha" />
              <feComponentTransfer in="alpha" result="mask">
                <feFuncA ref={inkRef} type="linear" slope="6" intercept="-5.4" />
              </feComponentTransfer>
              <feComposite in="warp" in2="mask" operator="in" />
            </filter>
          </defs>
        </svg>

        {/* 0 — Hero */}
        <section className="scene scene--hero" aria-label="首页">
          <div className="scene__media scene__media--hero">
            <img
              src={isLight ? hero.image.light : hero.image.dark}
              alt={hero.image.alt}
              width={1248}
              height={832}
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <div className="scene__shade" aria-hidden="true" />
          <div className="hero-copy">
            <h1 className="stage-display">
              {clauses(isLight ? hero.titleLight : hero.title).map((clause, i) => (
                <span key={i} className="stage-clause">{clause}</span>
              ))}
            </h1>
            <p className="stage-sub">
              {hero.subtitle.map((line, i) => (
                <Fragment key={i}>
                  {line}
                  {i < hero.subtitle.length - 1 ? <br /> : null}
                </Fragment>
              ))}
            </p>
            <a
              className="stage-pill"
              href={hero.cta.href}
              onClick={(event) => {
                event.preventDefault();
                scrollToScene(1);
              }}
            >
              {hero.cta.label}
              <Arrow />
            </a>
          </div>
          <div className="stage-baseline" aria-hidden="true">
            <Star className="stage-star" />
          </div>
          <div className="stage-foot">
            <span className="stage-chip">{hero.chip}</span>
            <p className="stage-body">{hero.body}</p>
          </div>
        </section>

        {/* 1 — Journal */}
        <section id="journal" className="scene scene--journal" aria-label="日志">
          <div className="scene__media scene__media--journal">
            <img
              src={isLight ? journalCopy.image.light : journalCopy.image.dark}
              alt={journalCopy.image.alt}
              width={1248}
              height={832}
              loading="lazy"
            />
          </div>
          <h2 className="stage-display journal-title">
            <Lines lines={journalCopy.title} />
          </h2>
          <div className="stage-baseline" aria-hidden="true">
            <Star className="stage-star" />
          </div>
          <div className="stage-foot">
            <span className="stage-chip">{journalCopy.chip}</span>
            <div className="stage-body journal-entry">
              {latest ? (
                <Link href={`/journal/${latest.slug}`} className="journal-entry__link">
                  <span className="journal-entry__meta">
                    {formatDate(latest.date)}
                    {latest.location ? ` · ${latest.location}` : ""}
                  </span>
                  <span className="journal-entry__title">{latest.title}</span>
                  {latest.excerpt ? <span className="journal-entry__excerpt">{latest.excerpt}</span> : null}
                </Link>
              ) : (
                <p>{journalCopy.fallback}</p>
              )}
              <Link href="/journal" className="stage-link">
                {journalCopy.cta} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 2 — Photos */}
        <section id="photos" className="scene scene--photos" aria-label="照片">
          <div className="photos-field">
            <HalftoneCanvas
              ref={halftoneRef}
              className="photos-field__canvas"
              src={isLight ? photoCopy.halftone.light : photoCopy.halftone.dark}
              color={isLight ? "#1c2430" : "#e8e2d2"}
              ink={isLight ? "dark" : "light"}
              label={photoCopy.halftone.alt}
            />
          </div>
          <div className="photos-rule" aria-hidden="true">
            <div ref={rulerRef} className="photos-rule__ticks">
              {Array.from({ length: 48 }, (_, k) => (
                <i key={k} style={{ width: `${k % 6 === 0 ? 18 : 6 + ((k * 7) % 5)}px` }} />
              ))}
            </div>
            <span ref={percentRef} className="photos-rule__pct">0%</span>
          </div>
          <div className="photos-groups">
            {photoCopy.groups.map((group, k) => (
              <div key={k} className="photos-group">
                <span className="stage-chip">{group.chip}</span>
                <h2 className="photos-group__title">
                  {group.title.map((line, i) => (
                    <span key={i} className="block">{line}</span>
                  ))}
                </h2>
                <p className="stage-body">{group.body}</p>
              </div>
            ))}
            {photos.length ? (
              <div className="photos-group">
                <span className="stage-chip">最近的照片</span>
                <ul className="photos-thumbs">
                  {photos.slice(0, 3).map((photo) => (
                    <li key={photo.slug}>
                      <Link href={`/photos/${photo.slug}`}>
                        {photo.image ? (
                          <img src={photo.image} alt={photo.title} width={160} height={160} loading="lazy" />
                        ) : null}
                        <span>{photo.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/photos" className="stage-link">
                  {photoCopy.cta} <span aria-hidden="true">→</span>
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        {/* 3 — Music */}
        <section id="music" className="scene scene--music" aria-label="音乐">
          <div className="scene__media scene__media--music">
            <img
              src={isLight ? music.image.light : music.image.dark}
              alt={music.image.alt}
              width={1248}
              height={832}
              loading="lazy"
            />
          </div>
          <div className="scene__dots" aria-hidden="true" />
          <div className="music-note">
            <span className="stage-chip">{music.chip}</span>
            <p className="stage-body">{music.body}</p>
            <Link href="/music" className="stage-link">
              {music.cta} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <h2 className="music-title">
            <Lines lines={music.title} />
          </h2>
        </section>

        {/* 4 — Fragments */}
        <section id="fragments" className="scene scene--fragments" aria-label="碎片">
          <div className="scene__media scene__media--fragments">
            <img
              src={isLight ? fragments.image.light : fragments.image.dark}
              alt={fragments.image.alt}
              width={1248}
              height={832}
              loading="lazy"
            />
          </div>
          <div className="scene__shade" aria-hidden="true" />
          <h2 className="fragments-title">
            <span className="fragments-title__main">{fragments.title}</span>
            <span className="fragments-title__script" lang="en">{fragments.script}</span>
          </h2>
          <div className="fragments-ring">
            {fragments.items.map((item, k) => (
              <article key={k} className="fragment-card">
                <span className="fragment-card__frame" aria-hidden="true" />
                <Star className="fragment-card__star fragment-card__star--a" />
                <Star className="fragment-card__star fragment-card__star--b" />
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 5 — Finale */}
        <section className="scene scene--finale" aria-label="尾声">
          <img
            className="finale-figure"
            src={isLight ? finale.figure.light : finale.figure.dark}
            alt=""
            width={547}
            height={607}
            loading="lazy"
          />
          <div className="finale-grid" aria-hidden="true">
            <i className="finale-grid__h finale-grid__h--top" />
            <i className="finale-grid__h finale-grid__h--bottom" />
            <i className="finale-grid__v finale-grid__v--left" />
            <i className="finale-grid__v finale-grid__v--right" />
          </div>
          <div className="finale-box">
            <Star className="finale-box__star finale-box__star--a" />
            <Star className="finale-box__star finale-box__star--b" />
            <p className="finale-mark">{finale.wordmark}</p>
            <p className="finale-tag">
              <Lines lines={finale.tagline} />
            </p>
            <div className="finale-meta">
              <span>{finale.meta}</span>
              <nav aria-label="站点">
                {finale.links.map((link) => (
                  <Link key={link.href} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </section>

        {/* Chrome */}
        <div className="stage-grain" aria-hidden="true" />
        <div className="stage-chrome">
          <i className="stage-chrome__v" aria-hidden="true" />
          <i className="stage-chrome__h" aria-hidden="true" />
          <a
            className="stage-mark"
            href="#top"
            aria-label="回到顶部"
            onClick={(event) => {
              event.preventDefault();
              scrollToScene(0);
            }}
          >
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path d="M20.5 4.5a11.5 11.5 0 1 0 7 20.6A12.5 12.5 0 0 1 20.5 4.5Z" />
            </svg>
          </a>
          <Link className="stage-dots" href="/menu" aria-label={navigationConfig.menuLabel}>
            <i /><i /><i /><i />
          </Link>
          <nav ref={railRef} className="stage-rail" aria-label="章节">
            {landingConfig.chapters.map((chapter, k) => (
              <a
                key={chapter.id}
                href={`#${chapter.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToScene(SCENES.findIndex((scene) => scene.chapter === k));
                }}
              >
                <i aria-hidden="true" />
                <em>{chapter.label}</em>
              </a>
            ))}
          </nav>
          <div className="stage-actions">
            <ThemeToggle variant="minimal" />
            <Link className="stage-pill stage-pill--small" href="/menu">
              {navigationConfig.menuLabel}
              <Arrow />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
