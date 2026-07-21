"use client";

import { useState, useCallback } from "react";
import { useLenis } from "@/hooks/useLenis";
import Navigation from "@/components/Navigation";
import FullScreenMenu from "@/components/FullScreenMenu";
import HeroRoomGallery from "@/sections/HeroRoomGallery";
import ParticleSculpture from "@/sections/ParticleSculpture";
import LighthouseVideo from "@/sections/LighthouseVideo";
import MusicSection from "@/sections/MusicSection";
import ImageGallery from "@/sections/ImageGallery";
import WavesVideo from "@/sections/WavesVideo";
import FooterTicker from "@/sections/FooterTicker";
import OpeningAnimation from "@/components/OpeningAnimation";
import type { ContentEntry } from "@/lib/content";

type HomeEntry = Omit<ContentEntry, "content">;

export default function HomeExperience({
  recentEntries,
  musicEntries,
}: {
  recentEntries: HomeEntry[];
  musicEntries: ContentEntry[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openingDone, setOpeningDone] = useState(false);
  const lenisRef = useLenis();

  const handleMenuOpen = useCallback(() => setMenuOpen(true), []);
  const handleMenuClose = useCallback(() => setMenuOpen(false), []);
  const handleOpeningComplete = useCallback(() => setOpeningDone(true), []);

  const handleNavigate = useCallback(
    (sectionId: string) => {
      const el = document.getElementById(sectionId);
      if (el && lenisRef.current) {
        lenisRef.current.scrollTo(el, { offset: 0 });
      } else if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    },
    [lenisRef]
  );

  return (
    <div className="relative">
      <OpeningAnimation onComplete={handleOpeningComplete} />
      <div
        style={{
          opacity: openingDone ? 1 : 0.92,
          transform: openingDone ? "scale(1)" : "scale(1.005)",
          transition: "opacity 0.9s ease, transform 0.9s ease",
          transformOrigin: "center top",
        }}
      >
        <Navigation onMenuOpen={handleMenuOpen} />
        <FullScreenMenu isOpen={menuOpen} onClose={handleMenuClose} onNavigate={handleNavigate} />
        <main>
          <HeroRoomGallery entries={recentEntries} />
          <ParticleSculpture />
          <LighthouseVideo />
          <MusicSection entries={musicEntries} />
          <ImageGallery />
          <WavesVideo />
        </main>
        <FooterTicker />
      </div>
    </div>
  );
}
