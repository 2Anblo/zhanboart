"use client";

import { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { footerConfig } from '../config';
import { useTheme } from '@/components/ThemeProvider';

function getRandomChar() {
  const isDigit = Math.random() < 0.3;
  if (isDigit) {
    return String(Math.floor(Math.random() * 10));
  }
  return String.fromCharCode(65 + Math.floor(Math.random() * 26));
}

interface LineState {
  el: HTMLDivElement;
  chars: number;
  word: string;
  wordStart: number;
  rateA: { value: number };
  rateB: { value: number };
  tweens: gsap.core.Tween[];
  timeouts: ReturnType<typeof setTimeout>[];
}

export default function FooterTicker() {
  const tickerRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<LineState[]>([]);
  const rafRef = useRef<number>(0);
  const startLineCycleRef = useRef<((state: LineState, delay: number) => void) | null>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const DICTIONARY = footerConfig.tickerWords;

  const buildLineHTML = useCallback((state: LineState) => {
    const { chars, word, wordStart, rateA, rateB } = state;
    let html = '';
    const wordEnd = wordStart + word.length;
    const NOISE_WIDTH = 30; // noise band around the sweep front

    for (let i = 0; i < chars; i++) {
      const progressA = rateA.value * chars;
      const progressB = rateB.value * chars;

      const invisibleColor = isLight ? '#fbf7ec' : '#0a0a0b';
      if (i < progressB) {
        // Behind rateB: invisible
        html += `<span style="color:${invisibleColor}">_</span>`;
      } else if (i >= wordStart && i < wordEnd && i < progressA) {
        // Word area already swept: show real letter
        const letterIndex = i - wordStart;
        html += word[letterIndex];
      } else if (i < progressA && i > progressA - NOISE_WIDTH) {
        // Narrow noise band at the sweep front
        html += getRandomChar();
      } else if (i < progressA) {
        // Already swept, not word, not in noise band: invisible
        html += `<span style="color:${invisibleColor}">_</span>`;
      } else if (i >= wordStart && i < wordEnd) {
        // Word area not yet swept: show real letter
        const letterIndex = i - wordStart;
        html += word[letterIndex];
      } else {
        // Not swept, not word: invisible
        html += `<span style="color:${invisibleColor}">_</span>`;
      }
    }

    state.el.innerHTML = html;
  }, []);

  const startLineCycle = useCallback((state: LineState, delay: number) => {
    if (DICTIONARY.length === 0) return;
    // Pick new word and position
    state.word = DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)];
    state.wordStart = Math.floor(Math.random() * Math.max(1, state.chars - state.word.length - 4)) + 2;
    state.rateA.value = 0;
    state.rateB.value = 0;

    const timeout = setTimeout(() => {
      // Phase 1: rateA sweeps 0->1 (reveal)
      const tweenA = gsap.to(state.rateA, {
        value: 1,
        duration: 1.5,
        ease: 'power2.inOut',
      });
      state.tweens.push(tweenA);

      // After reveal, hold 5-6s, then erase
      const holdTimeout = setTimeout(() => {
        // Phase 2: rateB sweeps 0->1 (erase)
        const tweenB = gsap.to(state.rateB, {
          value: 1,
          duration: 1.5,
          ease: 'power2.inOut',
        });
        state.tweens.push(tweenB);

        // After erase, pause 2s, then loop
        const pauseTimeout = setTimeout(() => {
          startLineCycleRef.current?.(state, 0);
        }, 2000);
        state.timeouts.push(pauseTimeout);
      }, 5000 + Math.random() * 1000);
      state.timeouts.push(holdTimeout);
    }, delay);
    state.timeouts.push(timeout);
  }, [DICTIONARY]);

  useEffect(() => {
    startLineCycleRef.current = startLineCycle;
  }, [startLineCycle]);

  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;

    const charsPerLine = Math.ceil(window.innerWidth / 8);
    const lineEls = ticker.querySelectorAll<HTMLDivElement>('.ticker-line');
    const lines: LineState[] = [];

    lineEls.forEach((el, i) => {
      const state: LineState = {
        el,
        chars: charsPerLine,
        word: '',
        wordStart: 0,
        rateA: { value: 0 },
        rateB: { value: 0 },
        tweens: [],
        timeouts: [],
      };
      lines.push(state);
      startLineCycle(state, i * 100);
    });

    linesRef.current = lines;

    // Render loop — gated by visibility, throttled to ~30 fps
    let isVisible = false;
    let lastRender = 0;
    const FRAME_INTERVAL = 1000 / 30;

    function render(now: number) {
      rafRef.current = requestAnimationFrame(render);
      if (!isVisible) return;
      if (now - lastRender < FRAME_INTERVAL) return;
      lastRender = now;
      for (const state of lines) {
        buildLineHTML(state);
      }
    }
    rafRef.current = requestAnimationFrame(render);

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isVisible = entry.isIntersecting;
        }
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(ticker);

    // Handle resize
    const handleResize = () => {
      const newChars = Math.ceil(window.innerWidth / 8);
      for (const state of lines) {
        state.tweens.forEach((t) => t.kill());
        state.timeouts.forEach((t) => clearTimeout(t));
        state.tweens = [];
        state.timeouts = [];
      }
      lines.forEach((state, i) => {
        state.chars = newChars;
        startLineCycle(state, i * 100);
      });
    };

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 300);
    };

    window.addEventListener('resize', debouncedResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      visibilityObserver.disconnect();
      window.removeEventListener('resize', debouncedResize);
      for (const state of lines) {
        state.tweens.forEach((t) => t.kill());
        state.timeouts.forEach((t) => clearTimeout(t));
      }
    };
  }, [startLineCycle, buildLineHTML]);

  if (footerConfig.linkColumns.length === 0 && footerConfig.tickerWords.length === 0 && !footerConfig.copyright) {
    return null;
  }

  const bgColor = isLight ? 'var(--day-surface)' : '#0a0a0b';
  const headingColor = isLight ? 'var(--day-muted)' : '#7a7c7f';
  const linkColor = isLight ? 'var(--day-muted)' : '#b0b2b5';
  const linkHoverColor = isLight ? 'var(--day-text)' : '#ffffff';
  const hrColor = isLight ? 'rgba(42,41,38,0.08)' : 'rgba(255,255,255,0.06)';
  const tickerTextColor = isLight ? 'var(--day-text)' : 'var(--color-inverse-text)';

  return (
    <footer
      id="footer"
      style={{
        background: bgColor,
        padding: '10rem var(--page-padding) 4rem',
        transition: 'background-color 0.5s ease',
      }}
    >
      {/* Top half — Site links */}
      {footerConfig.linkColumns.length > 0 && (
        <div
          className="mx-auto grid gap-16 footer-links"
          style={{ maxWidth: '1400px', gridTemplateColumns: 'repeat(2, 1fr)' }}
        >
          {footerConfig.linkColumns.map((col, colIdx) => (
            <div key={colIdx}>
              {col.heading && (
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '11px',
                    fontWeight: 400,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    color: headingColor,
                    marginBottom: '1rem',
                  }}
                >
                  {col.heading}
                </div>
              )}
              {col.links.map((link) => (
                <div key={link}>
                  <a
                    href="#hero"
                    onClick={(e) => e.preventDefault()}
                    className="block no-underline transition-colors duration-300"
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 300,
                      fontSize: '14px',
                      color: linkColor,
                      lineHeight: 2.2,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = linkHoverColor; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = linkColor; }}
                  >
                    {link}
                  </a>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Horizontal rule */}
      <div
        className="mx-auto"
        style={{
          maxWidth: '1400px',
          height: '1px',
          background: hrColor,
          margin: '6rem auto',
        }}
      />

      {/* Bottom half — Terminal ticker */}
      {footerConfig.tickerWords.length > 0 && (
        <div ref={tickerRef} style={{ color: tickerTextColor }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="ticker-line" />
          ))}
        </div>
      )}

      {/* Copyright */}
      {footerConfig.copyright && (
        <div
          className="text-center"
          style={{
            marginTop: '4rem',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            color: headingColor,
          }}
        >
          {footerConfig.copyright}
        </div>
      )}
    </footer>
  );
}


