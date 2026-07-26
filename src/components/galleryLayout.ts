import type { ContentEntry } from "@/lib/content";

export interface GalleryItem {
  id: string;
  image: string;
  title: string;
  year: string;
  caption?: string;
  slug: string;
  baseX: number;
  baseY: number;
  width: number;
  height: number;
  rotation: number;
}

const CANVAS_W = 3200;
const BASE_CARD_W = 280;
const BASE_CARD_H = 380;
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
 * random vertical spacing, jittered positions, and varying card sizes.
 */
export function generateScatterLayout(entries: ContentEntry[]): GalleryItem[] {
  if (entries.length === 0) return [];

  const items: GalleryItem[] = [];
  let currentY = 80;
  let entryIndex = 0;

  // Keep cycling through entries if we need more slots (for infinite feel)
  const getEntry = (i: number) => entries[i % entries.length];

  // Generate enough rows to fill ~3 viewport heights worth of content
  const targetRows = Math.max(4, Math.ceil(entries.length * 0.6));

  for (let row = 0; row < targetRows && entryIndex < Math.max(entries.length, 12); row++) {
    const photosInRow = randInt(2, 5);
    const rowHeight = rand(ROW_HEIGHT_MIN, ROW_HEIGHT_MAX);
    const totalGap = rand(GAP_X_MIN * (photosInRow - 1), GAP_X_MAX * (photosInRow - 1));
    const usableWidth = CANVAS_W - totalGap - 120; // 60px padding each side
    const photoWidth = usableWidth / photosInRow;

    // Random start offset for this row (stagger effect)
    const startX = rand(40, 200);

    for (let col = 0; col < photosInRow; col++) {
      const entry = getEntry(entryIndex);
      entryIndex++;

      // Vary card size ±15%
      const sizeVar = rand(0.85, 1.15);
      const width = Math.round(BASE_CARD_W * sizeVar);
      const height = Math.round(BASE_CARD_H * sizeVar);

      // Jitter position
      const jitterX = rand(-20, 20);
      const jitterY = rand(-30, 30);

      // Slight rotation for handmade feel
      const rotation = rand(-2.5, 2.5);

      const baseX = startX + col * (photoWidth + rand(GAP_X_MIN, GAP_X_MAX)) + jitterX;
      const baseY = currentY + jitterY;

      items.push({
        id: `${entry.slug}-${entryIndex}`,
        image: entry.image || `/images/gallery/item${(entryIndex % 9) + 1}.jpg`,
        title: entry.title,
        year: entry.date ? entry.date.slice(0, 4) : "",
        caption: entry.caption || entry.excerpt,
        slug: entry.slug,
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

export { CANVAS_W };
