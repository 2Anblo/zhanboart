import HomeExperience from "@/components/HomeExperience";
import { getPublicEntries } from "@/lib/content";
import type { ContentEntry } from "@/lib/content";
import type { LandingEntry } from "@/sections/LandingStage";

// Only what the landing needs crosses to the client, never the full markdown body.
function toLanding(entry: ContentEntry): LandingEntry {
  return {
    slug: entry.slug,
    title: entry.title,
    date: entry.date,
    excerpt: entry.excerpt,
    location: entry.location,
    image: entry.image,
  };
}

export default function HomePage() {
  return (
    <HomeExperience
      journal={getPublicEntries("journal").slice(0, 1).map(toLanding)}
      photos={getPublicEntries("photos").slice(0, 3).map(toLanding)}
    />
  );
}
