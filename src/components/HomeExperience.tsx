"use client";

import { useState, useCallback } from "react";
import { useLenis } from "@/hooks/useLenis";
import Navigation from "@/components/Navigation";
import HeroRoomGallery from "@/sections/HeroRoomGallery";
import ParticleSculpture from "@/sections/ParticleSculpture";
import LighthouseVideo from "@/sections/LighthouseVideo";
import MusicSection from "@/sections/MusicSection";
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
  const [openingDone, setOpeningDone] = useState(false);
  useLenis();

  const handleOpeningComplete = useCallback(() => setOpeningDone(true), []);

  return (
    <div className="relative">
      <OpeningAnimation onComplete={handleOpeningComplete} />
      <div
        style={{
          opacity: openingDone ? 1 : 0.92,
          transform: openingDone ? "none" : "scale(1.005)",
          transition: "opacity 0.9s ease, transform 0.9s ease",
          transformOrigin: "center top",
        }}
      >
        <Navigation />
        <main>
          <HeroRoomGallery entries={recentEntries} />
          <ParticleSculpture />
          <LighthouseVideo />
          <MusicSection entries={musicEntries} />
        </main>
        <FooterTicker />
      </div>
    </div>
  );
}
