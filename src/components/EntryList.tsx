import Link from "next/link";
import type { ContentEntry, ContentType } from "@/lib/content";

const labels: Record<ContentType, string> = {
  journal: "Journal",
  notes: "Notes",
  photos: "Photos",
};

export function EntryList({ entries }: { entries: ContentEntry[] }) {
  return (
    <div className="entry-list">
      {entries.map((entry) => (
        <Link key={`${entry.type}-${entry.slug}`} href={`/${entry.type}/${entry.slug}`} className="entry-card">
          <div className="entry-meta">{entry.date} / {labels[entry.type]}{entry.mood ? ` / ${entry.mood}` : ""}</div>
          <h2>{entry.title}</h2>
          {entry.excerpt ? <p>{entry.excerpt}</p> : null}
        </Link>
      ))}
    </div>
  );
}
