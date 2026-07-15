import ContentDetailPage from "@/components/ContentDetailPage";
import { getStaticSlugs } from "@/lib/content";

export function generateStaticParams() {
  return getStaticSlugs("journal");
}

export default async function JournalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ContentDetailPage type="journal" slug={slug} />;
}
