"use client";

import Link from "next/link";
import type { ContentEntry, ContentType } from "@/lib/content";
import FigureDark from "@/components/hero/FigureDark";
import FigureLight from "@/components/hero/FigureLight";

type HeroEntry = Omit<ContentEntry, "content">;

const typeLabels: Record<ContentType, string> = {
  journal: "Journal",
  notes: "Notes",
  photos: "Photos",
};

export default function HeroRoomGallery({ entries }: { entries: HeroEntry[] }) {
  return (
    <section id="hero" className="quiet-hero" aria-label="zhanbo.art private archive">
      <div className="quiet-hero__scene" aria-hidden="true">
        <div className="quiet-hero__image quiet-hero__image--night" />
        <div className="quiet-hero__image quiet-hero__image--day" />
        <div className="quiet-hero__window" />
        <div className="hero-figure hero-figure--dark"><FigureDark /></div>
        <div className="hero-figure hero-figure--light"><FigureLight /></div>
        <div className="quiet-hero__grain" />
      </div>

      <div className="quiet-hero__inner">
        <div className="quiet-hero__copy">
          <p className="quiet-hero__kicker">zhanbo.art</p>
          <h1>一些不需要被总结的东西</h1>
          <p className="quiet-hero__summary">fragments, light, night, music, and memory</p>
        </div>

        {entries.length > 0 ? (
          <div className="quiet-hero__recent" aria-label="最近内容">
            <div className="quiet-hero__recent-label">Recent</div>
            <div className="quiet-hero__entries">
              {entries.map((entry) => (
                <Link
                  key={`${entry.type}-${entry.slug}`}
                  href={`/${entry.type}/${entry.slug}`}
                  className="quiet-hero__entry"
                >
                  <span className="quiet-hero__entry-meta">
                    {entry.date} / {typeLabels[entry.type]}
                    {entry.mood ? ` / ${entry.mood}` : ""}
                  </span>
                  <span className="quiet-hero__entry-title">{entry.title}</span>
                  {entry.excerpt ? <span className="quiet-hero__entry-excerpt">{entry.excerpt}</span> : null}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
