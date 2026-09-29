import type { ContentEntry } from "@/lib/content";

export default function ActivityEntry({ entry }: { entry: ContentEntry }) {
  const images = entry.images?.length ? entry.images : entry.image ? [entry.image] : [];
  return (
    <article className="activity-entry" aria-label={`${entry.date} 的动态`}>
      <time className="entry-meta" dateTime={entry.date}>{entry.date}</time>
      {entry.content.trim() ? <p className="activity-text">{entry.content.trim()}</p> : null}
      {images.length ? <div className={`activity-images ${images.length === 1 ? "is-single" : "is-grid"}`}>
        {images.map((src, index) => <a key={`${src}-${index}`} href={src} target="_blank" rel="noreferrer" aria-label={`查看图片 ${index + 1}`}>
          <img className="activity-image" src={src} alt={entry.caption || `动态配图 ${index + 1}`}
            width={960} height={720} loading="lazy" />
        </a>)}
      </div> : null}
    </article>
  );
}
