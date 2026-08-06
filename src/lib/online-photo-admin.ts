import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { DeleteObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import matter from "gray-matter";

export const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
export const ADMIN_COOKIE = "zhanbo_admin_session";

export const IMAGE_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type OnlinePhoto = {
  slug: string;
  title: string;
  date: string;
  caption: string;
  location: string;
  mood: string;
  tags: string[];
  visibility: string;
  image: string;
  body: string;
  r2Key: string;
  managed: boolean;
};

export type OnlineAsset = {
  name: string;
  path: string;
  url: string;
  size: number;
};

type GitHubFile = {
  name: string;
  path: string;
  sha: string;
  type: string;
  size?: number;
  content?: string;
};

const SITE_ASSET_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);
const SITE_ASSET_FOLDERS = new Set(["gallery", "hero", "rooms", "uploads"]);

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`缺少环境变量：${name}`);
  return value;
}

function getSessionSecret(): string {
  return requiredEnv("ADMIN_SESSION_SECRET");
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sessionSignature(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected || !password) return false;
  const expectedHash = createHmac("sha256", getSessionSecret()).update(expected).digest();
  const actualHash = createHmac("sha256", getSessionSecret()).update(password).digest();
  return timingSafeEqual(expectedHash, actualHash);
}

export function createAdminSession(): string {
  const payload = encode(JSON.stringify({ exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }));
  return `${payload}.${sessionSignature(payload)}`;
}

export function isValidAdminSession(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  try {
    const expected = sessionSignature(payload);
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(signature);
    if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
      return false;
    }
    const parsed = JSON.parse(decode(payload)) as { exp?: number };
    return typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

export function slugify(value: string, fallback = "photo"): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug || fallback;
}

export function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function extensionFor(fileName: string, type: string): string {
  const fromName = fileName.toLowerCase().match(/\.(avif|gif|jpe?g|png|webp)$/)?.[1];
  if (fromName) return fromName === "jpeg" ? "jpg" : fromName;
  return type.split("/")[1] === "jpeg" ? "jpg" : type.split("/")[1];
}

function normalizePublicUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("CLOUDFLARE_R2_PUBLIC_URL 必须使用 https");
  return url.toString().replace(/\/$/, "");
}

function getR2Config() {
  const accountId = requiredEnv("CLOUDFLARE_ACCOUNT_ID");
  const bucket = requiredEnv("CLOUDFLARE_R2_BUCKET");
  const publicUrl = normalizePublicUrl(requiredEnv("CLOUDFLARE_R2_PUBLIC_URL"));
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnv("CLOUDFLARE_R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
    },
  });
  return { bucket, client, publicUrl };
}

function getGitHubConfig() {
  return {
    owner: requiredEnv("GITHUB_OWNER"),
    repo: requiredEnv("GITHUB_REPO"),
    token: requiredEnv("GITHUB_TOKEN"),
    branch: process.env.GITHUB_BRANCH?.trim() || "master",
    contentPath: (process.env.GITHUB_CONTENT_PATH?.trim() || "content/photos").replace(/^\/+|\/+$/g, ""),
  };
}

function githubUrl(path: string, config = getGitHubConfig()): string {
  return `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

async function githubRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  const config = getGitHubConfig();
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "User-Agent": "zhanbo-art-photo-admin",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub API ${response.status}: ${detail.slice(0, 220)}`);
  }
  return (await response.json()) as T;
}

async function listGitHubFiles(): Promise<GitHubFile[]> {
  const config = getGitHubConfig();
  const files = await githubRequest<GitHubFile[]>(`${githubUrl(config.contentPath)}?ref=${encodeURIComponent(config.branch)}`);
  return files.filter((file) => file.type === "file" && file.name.endsWith(".md"));
}

async function readGitHubFile(filePath: string): Promise<GitHubFile> {
  const config = getGitHubConfig();
  return githubRequest<GitHubFile>(`${githubUrl(filePath)}?ref=${encodeURIComponent(config.branch)}`);
}

async function listGitHubDirectory(directoryPath: string): Promise<GitHubFile[]> {
  const config = getGitHubConfig();
  const entries = await githubRequest<GitHubFile[]>(`${githubUrl(directoryPath)}?ref=${encodeURIComponent(config.branch)}`);
  const files = entries.filter((entry) => entry.type === "file");
  const directories = entries.filter((entry) => entry.type === "dir");
  const nested = await Promise.all(directories.map((directory) => listGitHubDirectory(directory.path)));
  return files.concat(nested.flat());
}

function isSiteImage(assetPath: string): boolean {
  return assetPath.startsWith("public/images/") && SITE_ASSET_EXTENSIONS.has(assetPath.slice(assetPath.lastIndexOf(".")).toLowerCase());
}

export async function listSiteAssets(): Promise<OnlineAsset[]> {
  const files = await listGitHubDirectory("public/images");
  return files
    .filter((file) => isSiteImage(file.path))
    .map((file) => ({
      name: file.name,
      path: file.path,
      url: `/${file.path.slice("public/".length)}`,
      size: file.size || 0,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

function decodeGitHubContent(content: string | undefined): string {
  return Buffer.from(String(content || "").replace(/\s/g, ""), "base64").toString("utf8");
}

function photoFromMarkdown(raw: string, fileName: string, r2Key = ""): OnlinePhoto {
  const { data, content } = matter(raw);
  const slug = String(data.slug || fileName.replace(/\.md$/, ""));
  return {
    slug,
    title: String(data.title || slug),
    date: String(data.date || ""),
    caption: String(data.caption || data.excerpt || ""),
    location: String(data.location || ""),
    mood: String(data.mood || ""),
    tags: parseTags(data.tags),
    visibility: String(data.visibility || "public"),
    image: String(data.image || ""),
    body: content.trim(),
    r2Key: String(data.r2Key || r2Key || ""),
    managed: Boolean(data.r2Key || r2Key),
  };
}

export async function listRemotePhotos(): Promise<OnlinePhoto[]> {
  const files = await listGitHubFiles();
  const entries = await Promise.all(
    files.map(async (file) => {
      const full = await readGitHubFile(file.path);
      return photoFromMarkdown(decodeGitHubContent(full.content), file.name);
    })
  );
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

function publicObjectUrl(baseUrl: string, key: string): string {
  return `${baseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

async function putR2Object(key: string, file: File, config: ReturnType<typeof getR2Config>): Promise<void> {
  await config.client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

export async function createRemotePhoto(form: FormData): Promise<{ slug: string; image: string }> {
  const config = getR2Config();
  const github = getGitHubConfig();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("请选择一张图片");
  if (!IMAGE_TYPES.has(file.type)) throw new Error("仅支持 JPG、PNG、WebP、GIF 和 AVIF");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("图片不能超过 30 MB");

  const date = String(form.get("date") || new Date().toISOString().slice(0, 10));
  const title = String(form.get("title") || file.name.replace(/\.[^.]+$/, "") || "未命名照片").trim();
  const existing = await listGitHubFiles();
  const taken = new Set(existing.map((entry) => entry.name.replace(/\.md$/, "")));
  const fallback = `photo-${date.replaceAll("-", "")}-${Date.now().toString().slice(-6)}`;
  const baseSlug = slugify(String(form.get("slug") || title), fallback);
  let slug = baseSlug;
  let suffix = 2;
  while (taken.has(slug)) slug = `${baseSlug}-${suffix++}`;

  const extension = extensionFor(file.name, file.type);
  const key = `photos/${date.slice(0, 4)}/${date.slice(5, 7)}/${slug}-${randomUUID().slice(0, 8)}.${extension}`;
  await putR2Object(key, file, config);

  const image = publicObjectUrl(config.publicUrl, key);
  const caption = String(form.get("caption") || "").trim();
  const visibilityValue = String(form.get("visibility") || "public");
  const visibility = ["public", "unlisted", "draft"].includes(visibilityValue) ? visibilityValue : "public";
  const frontmatter = {
    title,
    date,
    slug,
    excerpt: caption,
    tags: parseTags(form.get("tags")),
    mood: String(form.get("mood") || "").trim(),
    location: String(form.get("location") || "").trim(),
    image,
    caption,
    r2Key: key,
    visibility,
  };
  const markdown = matter.stringify(String(form.get("body") || "").trim() ? `${String(form.get("body"))!.trim()}\n` : "", frontmatter);

  try {
    await githubRequest(`${githubUrl(`${github.contentPath}/${slug}.md`)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Add photo: ${title}`,
        content: Buffer.from(markdown, "utf8").toString("base64"),
        branch: github.branch,
      }),
    });
  } catch (error) {
    await config.client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    throw error;
  }

  return { slug, image };
}

export async function deleteRemotePhoto(slug: string): Promise<void> {
  const config = getR2Config();
  const github = getGitHubConfig();
  const filePath = `${github.contentPath}/${slug}.md`;
  const file = await readGitHubFile(filePath);
  const photo = photoFromMarkdown(decodeGitHubContent(file.content), file.name);
  if (!photo.r2Key) throw new Error("这是一张旧的本地照片，不能从线上 R2 后台删除");

  try {
    await githubRequest(githubUrl(filePath), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Delete photo: ${photo.title}`, sha: file.sha, branch: github.branch }),
    });
  } catch (error) {
    throw new Error(`GitHub Markdown 删除失败，R2 图片未删除，请重试 ${filePath}：${String(error)}`);
  }

  try {
    await config.client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: photo.r2Key }));
  } catch (error) {
    throw new Error(`GitHub Markdown 已删除，但 R2 图片删除失败，请在 R2 手动删除 ${photo.r2Key}：${String(error)}`);
  }
}

export async function createSiteAsset(form: FormData): Promise<OnlineAsset> {
  const github = getGitHubConfig();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("请选择一张资源图片");
  if (!IMAGE_TYPES.has(file.type) && file.type !== "image/svg+xml") throw new Error("仅支持 JPG、PNG、WebP、GIF、AVIF 和 SVG 图片");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("图片不能超过 30 MB");

  const requestedFolder = String(form.get("folder") || "uploads");
  const folder = SITE_ASSET_FOLDERS.has(requestedFolder) ? requestedFolder : "uploads";
  const extension = extensionFor(file.name, file.type);
  const baseName = slugify(file.name.replace(/\.[^.]+$/, ""), "asset");
  const existing = new Set((await listSiteAssets()).map((asset) => asset.path));
  let filePath = `public/images/${folder}/${baseName}.${extension}`;
  let suffix = 2;
  while (existing.has(filePath)) filePath = `public/images/${folder}/${baseName}-${suffix++}.${extension}`;

  await githubRequest(githubUrl(filePath), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `Add site asset: ${file.name}`,
      content: Buffer.from(await file.arrayBuffer()).toString("base64"),
      branch: github.branch,
    }),
  });

  return { name: filePath.split("/").pop() || filePath, path: filePath, url: `/${filePath.slice("public/".length)}`, size: file.size };
}

export async function deleteSiteAsset(assetPath: string): Promise<void> {
  const normalizedPath = assetPath.replace(/^\/+/, "");
  if (!isSiteImage(normalizedPath) || normalizedPath.includes("..")) throw new Error("资源路径无效");
  const github = getGitHubConfig();
  const file = await readGitHubFile(normalizedPath);
  await githubRequest(githubUrl(normalizedPath), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: `Delete site asset: ${file.name}`, sha: file.sha, branch: github.branch }),
  });
}

export async function checkRemoteConfig(): Promise<{ configured: boolean; connected: boolean; error?: string }> {
  try {
    const r2 = getR2Config();
    const github = getGitHubConfig();
    await r2.client.send(new HeadBucketCommand({ Bucket: r2.bucket }));
    await githubRequest<{ full_name: string }>(`https://api.github.com/repos/${encodeURIComponent(github.owner)}/${encodeURIComponent(github.repo)}`);
    return { configured: true, connected: true };
  } catch (error) {
    return { configured: false, connected: false, error: error instanceof Error ? error.message : "连接失败" };
  }
}
