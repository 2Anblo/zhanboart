import ContentDetailPage from "@/components/ContentDetailPage";
import { getStaticSlugs } from "@/lib/content";

export function generateStaticParams() {
  return getStaticSlugs("music");
}

export default async function MusicDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ContentDetailPage type="music" slug={slug} />;
}
