import Link from "next/link";
import ContentNav from "@/components/ContentNav";
import { getAllEntries } from "@/lib/content";

export default function ArchivePage() {
  const entries = getAllEntries().filter((entry) => entry.visibility === "public");
  const years = Array.from(new Set(entries.map((entry) => entry.date.slice(0, 4))));

  return (
    <div className="content-shell">
      <ContentNav />
      <div className="content-inner">
        <div className="content-kicker">All public fragments</div>
        <h1 className="content-title">Archive</h1>
        {years.map((year) => (
          <section key={year}>
            <h2 className="archive-year">{year}</h2>
            <div className="entry-list">
              {entries.filter((entry) => entry.date.startsWith(year)).map((entry) => (
                <Link key={`${entry.type}-${entry.slug}`} href={`/${entry.type}/${entry.slug}`} className="entry-card">
                  <div className="entry-meta">{entry.date} / {entry.type}</div>
                  <h2>{entry.title}</h2>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
