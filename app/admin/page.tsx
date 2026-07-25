import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Content Manager | zhanbo.art",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <meta httpEquiv="refresh" content="0; url=/admin/index.html" />
      <div className="flex min-h-screen items-center justify-center px-6 text-center text-sm uppercase tracking-[0.18em]">
        <a href="/admin/index.html" className="text-white no-underline">
          Open Content Manager
        </a>
      </div>
    </main>
  );
}
