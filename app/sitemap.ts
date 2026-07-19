import type { MetadataRoute } from "next";
import { getAllEntries } from "@/lib/content";

export const dynamic = "force-static";

const baseUrl = "https://zhanbo.art";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/journal", "/notes", "/photos", "/music", "/archive"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));

  const contentRoutes = getAllEntries()
    .filter((entry) => entry.visibility === "public")
    .map((entry) => ({
      url: `${baseUrl}/${entry.type}/${entry.slug}`,
      lastModified: new Date(entry.date),
    }));

  return [...staticRoutes, ...contentRoutes];
}