import type { ContentType } from "@/lib/content";
import { getPublicEntries } from "@/lib/content";
import { EntryList } from "@/components/EntryList";
import ContentNav from "@/components/ContentNav";

const pageConfig: Record<ContentType, { title: string; kicker: string }> = {
  journal: { title: "Journal", kicker: "Longer records" },
  notes: { title: "Notes", kicker: "Fragments" },
  photos: { title: "Photos", kicker: "Light archive" },
  music: { title: "Music", kicker: "Sound and words" },
};

export default function ContentListPage({ type }: { type: ContentType }) {
  const entries = getPublicEntries(type);
  const config = pageConfig[type];

  return (
    <div className="content-shell">
      <ContentNav />
      <div className="content-inner">
        <div className="content-kicker">{config.kicker}</div>
        <h1 className="content-title">{config.title}</h1>
        <EntryList entries={entries} />
      </div>
    </div>
  );
}
