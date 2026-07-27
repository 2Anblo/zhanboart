import InfiniteGallery from "@/components/InfiniteGallery";
import ContentNav from "@/components/ContentNav";
import ProgressiveBlurFade from "@/components/ProgressiveBlurFade";
import { getPublicEntries } from "@/lib/content";
import { getGalleryImages } from "@/lib/gallery";

export default function PhotosPage() {
  const entries = getPublicEntries("photos");
  const galleryImages = getGalleryImages();

  return (
    <div className="gallery-page">
      <ContentNav />
      <ProgressiveBlurFade />
      <InfiniteGallery entries={entries} galleryImages={galleryImages} />
    </div>
  );
}
