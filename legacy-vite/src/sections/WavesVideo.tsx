import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { wavesVideoConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

export default function WavesVideo() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;
    const overlay = overlayRef.current;
    if (!section || !container || !overlay) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
      },
    });

    tl.fromTo(
      container,
      { scale: 0.95, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' }
    );

    tl.fromTo(
      overlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.8, ease: 'power2.out' },
      '-=0.7'
    );

    return () => {
      tl.kill();
    };
  }, []);

  if (!wavesVideoConfig.videoPath && !wavesVideoConfig.sectionLabel) return null;

  return (
    <section
      id="waves-video"
      ref={sectionRef}
      style={{
        background: '#0a0a0b',
        padding: '8rem var(--page-padding) 12rem',
      }}
    >
      {wavesVideoConfig.sectionLabel && (
        <div className="text-center" style={{ marginBottom: '3rem' }}>
          <div className="section-label">{wavesVideoConfig.sectionLabel}</div>
        </div>
      )}

      <div
        ref={containerRef}
        className="mx-auto relative"
        style={{
          width: '90vw',
          maxWidth: '1600px',
          aspectRatio: '16/9',
          overflow: 'hidden',
          opacity: 0,
        }}
      >
        {wavesVideoConfig.videoPath && (
          <video
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: 'cover' }}
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={wavesVideoConfig.videoPath} type="video/mp4" />
          </video>
        )}

        {/* Typography overlay */}
        <div
          ref={overlayRef}
          className="absolute bottom-0 left-0 right-0"
          style={{
            padding: '4rem',
            opacity: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
          }}
        >
          {wavesVideoConfig.title && (
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2rem, 5vw, 4.5rem)',
                color: '#ffffff',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 30px rgba(0,0,0,0.6)',
              }}
            >
              {wavesVideoConfig.title}
            </h2>
          )}

          {wavesVideoConfig.ctaText && (
            <a
              href="#hero"
              className="inline-block group"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                fontWeight: 400,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#f25b29',
                marginTop: '2rem',
                textDecoration: 'none',
                transition: 'letter-spacing 0.3s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.letterSpacing = '0.25em';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.letterSpacing = '0.15em';
              }}
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              {wavesVideoConfig.ctaText}
              <span
                className="inline-block ml-1 transition-transform duration-300 group-hover:translate-x-1"
              >
                &rarr;
              </span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
