import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { navigationConfig } from '../config';

interface FullScreenMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
}

export default function FullScreenMenu({ isOpen, onClose, onNavigate }: FullScreenMenuProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const links = linksRef.current;
    if (!overlay || !links) return;

    const linkEls = links.querySelectorAll('.menu-link');

    if (tlRef.current) {
      tlRef.current.kill();
    }

    const tl = gsap.timeline({ paused: true });

    tl.set(overlay, { display: 'flex' });
    tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    tl.fromTo(
      linkEls,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.08 },
      '-=0.2'
    );

    tlRef.current = tl;

    if (isOpen) {
      tl.play();
    } else {
      tl.reverse();
    }

    return () => {
      tl.kill();
    };
  }, [isOpen]);

  const handleLinkClick = (target: string) => {
    onNavigate(target);
    onClose();
  };

  if (navigationConfig.fullscreenMenuLinks.length === 0) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] hidden"
      style={{ background: '#0a0a0b' }}
    >
      {navigationConfig.closeLabel && (
        <button
          onClick={onClose}
          className="absolute top-6 right-8 cursor-pointer bg-transparent"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '20px',
            padding: '8px 20px',
            transition: 'border-color 0.3s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#f25b29';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.3)';
          }}
        >
          {navigationConfig.closeLabel}
        </button>
      )}

      <div className="flex items-center justify-center w-full h-full px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-[1200px] w-full">
          <div ref={linksRef} className="flex flex-col gap-2">
            {navigationConfig.fullscreenMenuLinks.map((link) => (
              <button
                key={link.target}
                className="menu-link text-left cursor-pointer bg-transparent group"
                onClick={() => handleLinkClick(link.target)}
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                  color: '#ffffff',
                  lineHeight: 1.8,
                  border: 'none',
                  position: 'relative',
                  display: 'inline-block',
                }}
              >
                <span className="relative">
                  {link.label}
                  <span
                    className="absolute bottom-1 left-0 h-[1px] w-0 group-hover:w-full transition-all duration-300 ease-out"
                    style={{ background: '#f25b29' }}
                  />
                </span>
              </button>
            ))}
          </div>

          {navigationConfig.menuSideInfo.length > 0 && (
            <div className="flex flex-col gap-8 justify-center">
              {navigationConfig.menuSideInfo.map((info, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    letterSpacing: '0.08em',
                    lineHeight: 1.4,
                    color: '#7a7c7f',
                  }}
                >
                  <div>{info}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
