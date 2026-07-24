import ContentDetailPage from "@/components/ContentDetailPage";
import { getStaticSlugs } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getStaticSlugs("thoughts");
}

export default async function ThoughtDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ContentDetailPage type="thoughts" slug={slug} />;
}
