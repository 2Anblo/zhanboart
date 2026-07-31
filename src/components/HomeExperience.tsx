"use client";

import { useCallback, useState } from "react";
import { useLenis } from "@/hooks/useLenis";
import Navigation from "@/components/Navigation";
import OpeningAnimation from "@/components/OpeningAnimation";
import SilentHero from "@/sections/SilentHero";
import MemoryStrip from "@/sections/MemoryStrip";
import HomeAfterglow from "@/sections/HomeAfterglow";

export default function HomeExperience() {
  const [openingDone, setOpeningDone] = useState(false);
  useLenis();

  const handleOpeningComplete = useCallback(() => setOpeningDone(true), []);

  return (
    <div className="home-experience">
      <OpeningAnimation onComplete={handleOpeningComplete} />
      <div
        style={{
          opacity: openingDone ? 1 : 0.92,
          transform: openingDone ? "none" : "scale(1.005)",
          transition: "opacity 0.9s ease, transform 0.9s ease",
          transformOrigin: "center top",
        }}
      >
        <Navigation variant="home" />
        <main>
          <SilentHero />
          <MemoryStrip />
          <HomeAfterglow />
        </main>
      </div>
    </div>
  );
}
