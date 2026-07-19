import HomeExperience from "@/components/HomeExperience";
import { getRecentPublicEntries, getPublicEntries } from "@/lib/content";

export default function HomePage() {
  const recentEntries = getRecentPublicEntries(3).map((entry) => ({
    type: entry.type,
    slug: entry.slug,
    title: entry.title,
    date: entry.date,
    excerpt: entry.excerpt,
    tags: entry.tags,
    mood: entry.mood,
    location: entry.location,
    image: entry.image,
    caption: entry.caption,
    visibility: entry.visibility,
  }));

  const musicEntries = getPublicEntries("music").slice(0, 3);

  return <HomeExperience recentEntries={recentEntries} musicEntries={musicEntries} />;
}
