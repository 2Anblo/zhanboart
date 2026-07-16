import HomeExperience from "@/components/HomeExperience";
import { getRecentPublicEntries } from "@/lib/content";

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

  return <HomeExperience recentEntries={recentEntries} />;
}
