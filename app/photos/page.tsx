import InfiniteGallery from "@/components/InfiniteGallery";
import ContentNav from "@/components/ContentNav";
import ProgressiveBlurFade from "@/components/ProgressiveBlurFade";
import { getPublicEntries } from "@/lib/content";

export default function PhotosPage() {
  const entries = getPublicEntries("photos");

  return (
    <div className="gallery-page">
      <ContentNav />
      <ProgressiveBlurFade />
      <InfiniteGallery entries={entries} />
    </div>
  );
}
