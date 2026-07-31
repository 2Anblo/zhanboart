"use client";

import { useLenis } from "@/hooks/useLenis";
import Navigation from "@/components/Navigation";
import SilentHero from "@/sections/SilentHero";
import MemoryStrip from "@/sections/MemoryStrip";
import HomeAfterglow from "@/sections/HomeAfterglow";

export default function HomeExperience() {
  useLenis();

  return (
    <div className="home-experience">
      <Navigation variant="home" />
      <main>
        <SilentHero />
        <MemoryStrip />
        <HomeAfterglow />
      </main>
    </div>
  );
}
