import path from "node:path";

export const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const EXTENSIONS = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/avif", ".avif"],
]);

export function slugify(value, fallback = "photo") {
  const normalized = String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return normalized || fallback;
}

export function normalizePublicUrl(value) {
  const url = String(value ?? "").trim().replace(/\/+$/, "");
  if (!/^https:\/\//i.test(url)) {
    throw new Error("CLOUDFLARE_R2_PUBLIC_URL 必须是 https:// 地址");
  }
  return url;
}

export function extensionFor(filename, contentType) {
  const extension = path.extname(filename || "").toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"].includes(extension)) {
    return extension === ".jpeg" ? ".jpg" : extension;
  }
  return EXTENSIONS.get(contentType) ?? ".jpg";
}

export function makeObjectKey({ slug, date, suffix, extension }) {
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10);
  const [year, month] = safeDate.split("-");
  return `photos/${year}/${month}/${slug}-${suffix}${extension}`;
}

export function parseTags(value) {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  return String(value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function envStatus(env) {
  const required = [
    "CLOUDFLARE_ACCOUNT_ID",
    "CLOUDFLARE_R2_ACCESS_KEY_ID",
    "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
    "CLOUDFLARE_R2_BUCKET",
    "CLOUDFLARE_R2_PUBLIC_URL",
  ];
  const missing = required.filter((name) => !String(env[name] ?? "").trim());
  return { configured: missing.length === 0, missing };
}
