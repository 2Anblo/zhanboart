import { notFound } from "next/navigation";
import type { ContentType } from "@/lib/content";
import { getEntry } from "@/lib/content";
import ContentNav from "@/components/ContentNav";
import MarkdownRenderer from "@/components/markdown/MarkdownRenderer";
import MusicPlayer from "@/components/MusicPlayer";

export default function ContentDetailPage({ type, slug }: { type: ContentType; slug: string }) {
  const entry = getEntry(type, slug);
  if (!entry) notFound();

  return (
    <article className="content-shell">
      <ContentNav />
      <div className="content-inner">
        <div className="content-kicker">
          {entry.date}{entry.location ? ` / ${entry.location}` : ""}{entry.mood ? ` / ${entry.mood}` : ""}
        </div>
        <h1 className="content-title">{entry.title}</h1>
        {entry.image ? <img src={entry.image} alt={entry.caption || entry.title} className="mb-10 w-full object-cover" /> : null}
        {entry.audio ? (
          <div className="mb-10">
            <MusicPlayer
              src={entry.audio}
              title={entry.title}
              artist={entry.artist}
              albumArt={entry.albumArt || entry.image}
            />
          </div>
        ) : null}
        <MarkdownRenderer content={entry.content} />
      </div>
    </article>
  );
}
