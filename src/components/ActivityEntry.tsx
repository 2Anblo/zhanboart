import type { ContentEntry } from "@/lib/content";
import ActivityGallery from "@/components/ActivityGallery";

export default function ActivityEntry({ entry }: { entry: ContentEntry }) {
  const images = entry.images?.length ? entry.images : entry.image ? [entry.image] : [];
  return (
    <article className="activity-entry" aria-label={`${entry.date} 的动态`}>
      <time className="entry-meta" dateTime={entry.date}>{entry.date}</time>
      {entry.content.trim() ? <p className="activity-text">{entry.content.trim()}</p> : null}
      {images.length ? <ActivityGallery images={images} caption={entry.caption} /> : null}
    </article>
  );
}
