import HomeExperience from "@/components/HomeExperience";
import { getRecentPublicEntries } from "@/lib/content";

export default function HomePage() {
  getRecentPublicEntries(6);
  return <HomeExperience />;
}
