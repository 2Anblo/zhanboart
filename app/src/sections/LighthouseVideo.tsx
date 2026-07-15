import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { lighthouseVideoConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

export default function LighthouseVideo() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    const panel = panelRef.current;
    if (!section || !video || !panel) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
      },
    });

    tl.fromTo(video, { opacity: 0 }, { opacity: 1, duration: 1.5, ease: 'power2.out' });
    tl.fromTo(
      panel,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
      '-=0.7'
    );

    const dataPoints = panel.querySelectorAll('.data-point');
    tl.fromTo(
      dataPoints,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', stagger: 0.15 },
      '-=0.3'
    );

    return () => {
      tl.kill();
    };
  }, []);

  if (!lighthouseVideoConfig.videoPath && !lighthouseVideoConfig.sectionLabel) return null;

  return (
    <section
      id="lighthouse"
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ width: '100vw', height: '100vh' }}
    >
      {lighthouseVideoConfig.videoPath && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover', opacity: 0 }}
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={lighthouseVideoConfig.videoPath} type="video/mp4" />
        </video>
      )}

      {/* Liquid glass panel */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={panelRef}
          className="liquid-glass"
          style={{
            width: 'min(600px, 80vw)',
            padding: '3rem',
            opacity: 0,
          }}
        >
          {lighthouseVideoConfig.sectionLabel && (
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                fontWeight: 400,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '2rem',
              }}
            >
              {lighthouseVideoConfig.sectionLabel}
            </div>
          )}

          {lighthouseVideoConfig.dataPoints.length > 0 && (
            <div className="flex flex-col gap-8">
              {lighthouseVideoConfig.dataPoints.map((point, i) => (
                <div
                  key={i}
                  className="data-point"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    letterSpacing: '0.08em',
                    color: '#ffffff',
                    lineHeight: 1.4,
                  }}
                >
                  {point}
                </div>
              ))}
            </div>
          )}

          <div
            className="mx-auto"
            style={{
              width: '60%',
              height: '1px',
              background: 'rgba(255,255,255,0.1)',
              marginTop: '2rem',
              marginBottom: '1.5rem',
            }}
          />

          {lighthouseVideoConfig.description && (
            <p
              className="data-point"
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 300,
                fontStyle: 'italic',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.7,
                textAlign: 'center',
              }}
            >
              {lighthouseVideoConfig.description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
