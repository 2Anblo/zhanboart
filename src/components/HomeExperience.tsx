"use client";

import { useCallback, useState } from "react";
import { useLenis } from "@/hooks/useLenis";
import OpeningAnimation from "@/components/OpeningAnimation";
import LandingStage from "@/sections/LandingStage";
import type { LandingEntry } from "@/sections/LandingStage";

export default function HomeExperience({ journal, photos }: { journal: LandingEntry[]; photos: LandingEntry[] }) {
  const [openingDone, setOpeningDone] = useState(false);
  const lenisRef = useLenis();

  const handleOpeningComplete = useCallback(() => setOpeningDone(true), []);

  return (
    <div className="home-experience" id="top">
      <OpeningAnimation onComplete={handleOpeningComplete} />
      <div
        style={{
          opacity: openingDone ? 1 : 0.92,
          transition: "opacity 0.9s ease",
        }}
      >
        <main>
          <LandingStage journal={journal} photos={photos} lenisRef={lenisRef} />
        </main>
      </div>
    </div>
  );
}
