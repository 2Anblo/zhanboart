import type { ContentEntry } from "@/lib/content";

export default function ActivityEntry({ entry }: { entry: ContentEntry }) {
  return (
    <article className="activity-entry" aria-label={`${entry.date} 的动态`}>
      <time className="entry-meta" dateTime={entry.date}>{entry.date}</time>
      {entry.content.trim() ? <p className="activity-text">{entry.content.trim()}</p> : null}
      {entry.image ? (
        <img className="activity-image" src={entry.image} alt={entry.caption || "动态配图"}
          width={960} height={720} loading="lazy" />
      ) : null}
    </article>
  );
}
