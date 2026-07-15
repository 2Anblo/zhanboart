import ContentDetailPage from "@/components/ContentDetailPage";
import { getStaticSlugs } from "@/lib/content";

export function generateStaticParams() {
  return getStaticSlugs("photos");
}

export default async function PhotoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ContentDetailPage type="photos" slug={slug} />;
}
