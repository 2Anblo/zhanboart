import fs from "node:fs";
import path from "node:path";

const GALLERY_DIR = path.join(process.cwd(), "public", "images", "gallery");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

export function getGalleryImages(): string[] {
  if (!fs.existsSync(GALLERY_DIR)) return [];

  return fs
    .readdirSync(GALLERY_DIR)
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return IMAGE_EXTENSIONS.has(ext);
    })
    .sort()
    .map((file) => `/images/gallery/${file}`);
}
