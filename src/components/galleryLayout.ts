import type { ContentEntry } from "@/lib/content";

export interface GalleryItem {
  id: string;
  image: string;
  title: string;
  year: string;
  caption?: string;
  slug?: string;
  baseX: number;
  baseY: number;
  width: number;
  height: number;
  rotation: number;
}

const CANVAS_W = 3200;
const CANVAS_H_MIN = 1600;
const CANVAS_Y_PADDING = 520;
const FALLBACK_CARD_W = 280;
const BASE_CARD_H = 300;
const ROW_HEIGHT_MIN = 420;
const ROW_HEIGHT_MAX = 540;
const GAP_X_MIN = 60;
const GAP_X_MAX = 160;

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}

/**
 * Generate an irregular scatter layout for gallery photos.
 * Photos are grouped into rows with varying counts (2~5 per row),
 * random vertical spacing, jittered positions, and a consistent card height.
 */
export function generateScatterLayout(
  entries: ContentEntry[],
  galleryImages?: string[]
): GalleryItem[] {
  const entriesWithImages = entries.filter(
    (entry): entry is ContentEntry & { image: string } => Boolean(entry.image)
  );
  const entryImages = new Set(entriesWithImages.map((entry) => entry.image));
  const sources = [
    ...entriesWithImages.map((entry) => ({ image: entry.image, entry })),
    ...(galleryImages ?? [])
      .filter((image) => !entryImages.has(image))
      .map((image) => ({ image, entry: undefined })),
  ];

  if (sources.length === 0) return [];

  const items: GalleryItem[] = [];
  let currentY = 80;
  let sourceIndex = 0;

  while (sourceIndex < sources.length) {
    const photosInRow = Math.min(randInt(2, 5), sources.length - sourceIndex);
    const rowHeight = rand(ROW_HEIGHT_MIN, ROW_HEIGHT_MAX);
    const totalGap = rand(GAP_X_MIN * (photosInRow - 1), GAP_X_MAX * (photosInRow - 1));
    const usableWidth = CANVAS_W - totalGap - 120; // 60px padding each side
    const photoWidth = usableWidth / photosInRow;

    // Random start offset for this row (stagger effect)
    const startX = rand(40, 200);

    for (let col = 0; col < photosInRow; col++) {
      const source = sources[sourceIndex];
      const entry = source.entry;
      sourceIndex++;

      // Keep every card at one height. The width is refined from the image's
      // natural dimensions once it has loaded in the gallery.
      const width = FALLBACK_CARD_W;
      const height = BASE_CARD_H;

      // Jitter position
      const jitterX = rand(-20, 20);
      const jitterY = rand(-30, 30);

      // Slight rotation for handmade feel
      const rotation = rand(-2.5, 2.5);

      const baseX = startX + col * (photoWidth + rand(GAP_X_MIN, GAP_X_MAX)) + jitterX;
      const baseY = currentY + jitterY;

      const filename = decodeURIComponent(source.image.split("/").pop() ?? "photo")
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]+/g, " ");

      items.push({
        id: entry?.slug ?? `media-${sourceIndex}-${filename}`,
        image: source.image,
        title: entry?.title ?? filename,
        year: entry?.date ? entry.date.slice(0, 4) : "",
        caption: entry?.caption || entry?.excerpt,
        slug: entry?.slug,
        baseX: Math.round(baseX),
        baseY: Math.round(baseY),
        width,
        height,
        rotation,
      });
    }

    currentY += rowHeight;
  }

  return items;
}

export function getScatterLayoutHeight(items: GalleryItem[]) {
  if (items.length === 0) return CANVAS_H_MIN;

  const top = Math.min(...items.map((item) => item.baseY - item.height / 2));
  const bottom = Math.max(...items.map((item) => item.baseY + item.height / 2));
  return Math.max(CANVAS_H_MIN, Math.ceil(bottom - top + CANVAS_Y_PADDING));
}

export { CANVAS_W };
