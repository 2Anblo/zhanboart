import ContentNav from "@/components/ContentNav";
import ActivityEntry from "@/components/ActivityEntry";
import { getPublicEntries } from "@/lib/content";
import { activityConfig } from "@/config";

export const metadata = { title: "动态 | zhanbo.art" };

export default function NotesPage() {
  const entries = getPublicEntries("notes");
  return (
    <main className="content-shell">
      <ContentNav />
      <div className="content-inner activity-feed">
        <h1 className="sr-only">{activityConfig.label}</h1>
        {entries.length ? entries.map((entry) => <ActivityEntry key={entry.slug} entry={entry} />)
          : <p className="content-empty">{activityConfig.empty}</p>}
      </div>
    </main>
  );
}
