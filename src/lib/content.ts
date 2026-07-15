import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type ContentType = "journal" | "notes" | "photos";
export type Visibility = "public" | "unlisted" | "draft";

export interface ContentEntry {
  type: ContentType;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  mood?: string;
  location?: string;
  image?: string;
  caption?: string;
  visibility: Visibility;
  content: string;
}

const contentRoot = path.join(process.cwd(), "content");
const contentTypes: ContentType[] = ["journal", "notes", "photos"];

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split(",").map((tag) => tag.trim()).filter(Boolean);
  return [];
}

function readType(type: ContentType): ContentEntry[] {
  const dir = path.join(contentRoot, type);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const fullPath = path.join(dir, file);
      const raw = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(raw);
      const slug = String(data.slug || file.replace(/\.md$/, ""));

      return {
        type,
        slug,
        title: String(data.title || slug),
        date: String(data.date || ""),
        excerpt: String(data.excerpt || data.caption || ""),
        tags: normalizeTags(data.tags),
        mood: data.mood ? String(data.mood) : undefined,
        location: data.location ? String(data.location) : undefined,
        image: data.image ? String(data.image) : undefined,
        caption: data.caption ? String(data.caption) : undefined,
        visibility: (data.visibility || "public") as Visibility,
        content,
      } satisfies ContentEntry;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getEntries(type: ContentType, includeDrafts = false): ContentEntry[] {
  return readType(type).filter((entry) => includeDrafts || entry.visibility !== "draft");
}

export function getPublicEntries(type: ContentType): ContentEntry[] {
  return getEntries(type).filter((entry) => entry.visibility === "public");
}

export function getEntry(type: ContentType, slug: string): ContentEntry | undefined {
  return getEntries(type).find((entry) => entry.slug === slug);
}

export function getAllEntries(includeDrafts = false): ContentEntry[] {
  return contentTypes
    .flatMap((type) => getEntries(type, includeDrafts))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getRecentPublicEntries(limit: number): ContentEntry[] {
  return getAllEntries().filter((entry) => entry.visibility === "public").slice(0, limit);
}

export function getStaticSlugs(type: ContentType): { slug: string }[] {
  return getEntries(type).map((entry) => ({ slug: entry.slug }));
}
