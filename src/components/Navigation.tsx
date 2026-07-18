"use client";

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { siteConfig, navigationConfig } from '../config';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/components/ThemeProvider';

interface NavigationProps {
  onMenuOpen: () => void;
}

export default function Navigation({ onMenuOpen }: NavigationProps) {
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    const logo = logoRef.current;
    if (!logo) return;

    const letters = logo.querySelectorAll('.logo-letter');

    const handleMouseEnter = () => {
      gsap.to(letters, {
        rotationY: 15,
        duration: 0.3,
        ease: 'power2.inOut',
        stagger: {
          each: 0.05,
          yoyo: true,
          repeat: 1,
        },
      });
    };

    logo.addEventListener('mouseenter', handleMouseEnter);
    return () => logo.removeEventListener('mouseenter', handleMouseEnter);
  }, []);

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!siteConfig.brandName && !navigationConfig.menuLabel) return null;

  const textColor = isLight ? 'var(--day-text)' : '#ffffff';
  const borderColor = isLight ? 'rgba(42,41,38,0.25)' : 'rgba(255,255,255,0.3)';
  const borderHover = '#f25b29';
  const textShadow = isLight ? 'none' : '0 2px 8px rgba(0,0,0,0.5)';

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-8 py-6"
      style={{
        textShadow,
        transition: 'color 0.5s ease',
      }}
    >
      <a
        ref={logoRef}
        href="#"
        onClick={scrollToTop}
        className="no-underline"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: '24px',
          color: textColor,
          display: 'inline-flex',
          perspective: '200px',
          transition: 'color 0.5s ease',
        }}
      >
        {siteConfig.brandName.split('').map((char, i) => (
          <span
            key={i}
            className="logo-letter inline-block"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {char}
          </span>
        ))}
      </a>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        {navigationConfig.menuLabel && (
          <button
            onClick={onMenuOpen}
            className="cursor-pointer bg-transparent"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: textColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '20px',
              padding: '8px 20px',
              transition: 'border-color 0.3s ease, color 0.5s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = borderHover;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = borderColor;
            }}
          >
            {navigationConfig.menuLabel}
          </button>
        )}
      </div>
    </nav>
  );
}
