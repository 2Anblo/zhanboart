"use client";

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { galleryConfig } from '../config';
import { useTheme } from '@/components/ThemeProvider';

gsap.registerPlugin(ScrollTrigger);

export default function ImageGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cards = section.querySelectorAll('.gallery-card');
    const triggers: ScrollTrigger[] = [];

    cards.forEach((card) => {
      const anim = gsap.fromTo(
        card,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
          },
        }
      );
      if (anim.scrollTrigger) {
        triggers.push(anim.scrollTrigger);
      }
    });

    return () => {
      triggers.forEach((st) => st.kill());
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIndex(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIndex]);

  if (galleryConfig.items.length === 0) return null;

  const selected = selectedIndex !== null ? galleryConfig.items[selectedIndex] : null;

  const bgColor = isLight ? 'var(--day-surface)' : '#0a0a0b';
  const titleColor = isLight ? 'var(--day-text)' : '#ffffff';
  const captionColor = isLight ? 'var(--day-muted)' : '#999';

  return (
    <>
      <section
        id="waves-gallery"
        ref={sectionRef}
        style={{
          background: bgColor,
          padding: '12rem var(--page-padding)',
          transition: 'background-color 0.5s ease',
        }}
      >
        <div className="text-center" style={{ marginBottom: '4rem' }}>
          {galleryConfig.sectionLabel && (
            <div className="section-label" style={{ marginBottom: '2rem' }}>
              {galleryConfig.sectionLabel}
            </div>
          )}
          {galleryConfig.sectionTitle && (
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                color: titleColor,
                lineHeight: 0.95,
                letterSpacing: '-0.03em',
                transition: 'color 0.5s ease',
              }}
            >
              {galleryConfig.sectionTitle}
            </h2>
          )}
        </div>

        <div
          className="mx-auto gallery-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'clamp(0.75rem, 2vw, 2rem)',
            width: 'min(85vw, 1400px)',
          }}
        >
          {galleryConfig.items.map((item, i) => (
            <div
              key={i}
              className="gallery-card"
              style={{ opacity: 0, cursor: 'pointer' }}
              onClick={() => setSelectedIndex(i)}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '3/4',
                  borderRadius: '0px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <img
                  src={item.src}
                  alt={item.caption}
                  loading="lazy"
                  className="transition-transform duration-500"
                  style={{
                    objectFit: 'cover',
                    width: '100%',
                    height: '100%',
                    display: 'block',
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = 'scale(1.03)'; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
                />
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  color: captionColor,
                  marginTop: '0.75rem',
                  letterSpacing: '0.02em',
                  transition: 'color 0.5s ease',
                }}
              >
                {item.caption}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox overlay */}
      {selected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: isLight ? 'rgba(251, 247, 236, 0.94)' : 'rgba(10, 10, 11, 0.95)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5vh 5vw',
            cursor: 'pointer',
            animation: 'fadeIn 0.3s ease',
          }}
          onClick={() => setSelectedIndex(null)}
        >
          <div
            style={{
              display: 'flex',
              gap: '4vw',
              maxWidth: 1400,
              width: '100%',
              maxHeight: '80vh',
              alignItems: 'center',
              cursor: 'default',
              flexDirection: 'column',
            }}
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image — left */}
            <div style={{ flex: '0 0 auto', maxHeight: '60vh' }}>
              <img
                src={selected.src}
                alt={selected.caption}
                style={{
                  width: '100%',
                  maxHeight: '60vh',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>

            {/* Description — below */}
            <div style={{ flex: '1 1 auto', overflow: 'auto', maxWidth: '600px', textAlign: 'center' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                  color: titleColor,
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  marginBottom: '1rem',
                }}
              >
                {selected.caption}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '15px',
                  fontWeight: 300,
                  lineHeight: 1.85,
                  color: captionColor,
                }}
              >
                {selected.description}
              </p>

              {/* Close hint */}
              {galleryConfig.lightboxCloseHint && (
                <div
                  style={{
                    marginTop: '2rem',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '11px',
                    color: isLight ? 'var(--day-muted)' : '#666',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {galleryConfig.lightboxCloseHint}
                </div>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setSelectedIndex(null)}
            style={{
              position: 'absolute',
              top: '3vh',
              right: '3vw',
              background: 'none',
              border: 'none',
              color: isLight ? 'var(--day-muted)' : '#999',
              fontSize: '2rem',
              cursor: 'pointer',
              lineHeight: 1,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.color = isLight ? 'var(--day-text)' : '#fff'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.color = isLight ? 'var(--day-muted)' : '#999'; }}
          >
            &times;
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}

