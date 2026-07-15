import ContentDetailPage from "@/components/ContentDetailPage";
import { getStaticSlugs } from "@/lib/content";

export function generateStaticParams() {
  return getStaticSlugs("notes");
}

export default async function NoteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ContentDetailPage type="notes" slug={slug} />;
}
