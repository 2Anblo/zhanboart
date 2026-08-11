import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { DeleteObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import matter from "gray-matter";
import { CONTENT_TYPES, isContentType, isVisibility } from "@/lib/content-model";
import type { ContentType, Visibility } from "@/lib/content-model";

export const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
export const MAX_AUDIO_UPLOAD_BYTES = 100 * 1024 * 1024;
export const ADMIN_COOKIE = "zhanbo_admin_session";

export const IMAGE_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const AUDIO_TYPES = new Set([
  "audio/aac",
  "audio/flac",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/x-m4a",
  "audio/x-wav",
]);

export type OnlineContent = {
  type: ContentType;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  caption: string;
  location: string;
  mood: string;
  tags: string[];
  visibility: Visibility;
  image: string;
  audio: string;
  albumArt: string;
  artist: string;
  body: string;
  imageR2Key: string;
  audioR2Key: string;
  albumArtR2Key: string;
  managed: boolean;
};

export type OnlinePhoto = OnlineContent;

export type OnlineAsset = {
  name: string;
  path: string;
  url: string;
  size: number;
};

export type ConnectionState = {
  configured: boolean;
  connected: boolean;
  error?: string;
};

export type AdminConnection = {
  github: ConnectionState;
  r2: ConnectionState;
};

type GitHubFile = {
  name: string;
  path: string;
  sha: string;
  type: "file" | "dir";
  size?: number;
  content?: string;
};

type ManagedMedia = {
  key: string;
  url: string;
};

const SITE_ASSET_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);
const SITE_ASSET_FOLDERS = new Set(["gallery", "hero", "rooms", "uploads"]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
    if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) return false;
    const parsed = JSON.parse(decode(payload)) as { exp?: number };
    return typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

export function slugify(value: string, fallback = "fragment"): string {
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
  const fromName = fileName.toLowerCase().match(/\.(aac|avif|flac|gif|jpe?g|m4a|mp3|mp4|ogg|png|wav|webp)$/)?.[1];
  if (fromName) return fromName === "jpeg" ? "jpg" : fromName;
  const mimeExtensions: Record<string, string> = {
    "audio/aac": "aac",
    "audio/flac": "flac",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/x-m4a": "m4a",
    "audio/x-wav": "wav",
    "image/jpeg": "jpg",
  };
  return mimeExtensions[type] || type.split("/")[1] || "bin";
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
    contentRoot: (process.env.GITHUB_CONTENT_ROOT?.trim() || "content").replace(/^\/+|\/+$/g, ""),
  };
}

function contentDirectory(type: ContentType): string {
  return `${getGitHubConfig().contentRoot}/${type}`;
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
      "User-Agent": "zhanbo-art-content-admin",
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

async function listGitHubFiles(directoryPath: string): Promise<GitHubFile[]> {
  const config = getGitHubConfig();
  const files = await githubRequest<GitHubFile[]>(`${githubUrl(directoryPath)}?ref=${encodeURIComponent(config.branch)}`);
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

function contentFromMarkdown(type: ContentType, raw: string, fileName: string): OnlineContent {
  const { data, content } = matter(raw);
  const slug = String(data.slug || fileName.replace(/\.md$/, ""));
  const imageR2Key = String(data.imageR2Key || (type === "photos" ? data.r2Key : "") || "");
  const audioR2Key = String(data.audioR2Key || "");
  const albumArtR2Key = String(data.albumArtR2Key || "");
  const visibility = isVisibility(data.visibility) ? data.visibility : "public";
  return {
    type,
    slug,
    title: String(data.title || slug),
    date: String(data.date || ""),
    excerpt: String(data.excerpt || data.caption || ""),
    caption: String(data.caption || data.excerpt || ""),
    location: String(data.location || ""),
    mood: String(data.mood || ""),
    tags: parseTags(data.tags),
    visibility,
    image: String(data.image || ""),
    audio: String(data.audio || ""),
    albumArt: String(data.albumArt || ""),
    artist: String(data.artist || ""),
    body: content.trim(),
    imageR2Key,
    audioR2Key,
    albumArtR2Key,
    managed: Boolean(imageR2Key || audioR2Key || albumArtR2Key),
  };
}

async function listTypeContent(type: ContentType): Promise<OnlineContent[]> {
  const files = await listGitHubFiles(contentDirectory(type));
  return Promise.all(
    files.map(async (file) => {
      const full = await readGitHubFile(file.path);
      return contentFromMarkdown(type, decodeGitHubContent(full.content), file.name);
    }),
  );
}

export async function listRemoteContent(type?: ContentType): Promise<OnlineContent[]> {
  const types = type ? [type] : CONTENT_TYPES;
  const entries = (await Promise.all(types.map(listTypeContent))).flat();
  return entries.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
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
    }),
  );
}

async function deleteR2Object(key: string): Promise<void> {
  if (!key) return;
  const config = getR2Config();
  await config.client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
}

function formText(form: FormData, name: string, fallback = ""): string {
  if (!form.has(name)) return fallback;
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : fallback;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function mediaReference(value: string, label: string): string {
  if (!value || value.startsWith("/")) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${label}必须是站内路径或 https 地址`);
  }
}

async function uploadManagedMedia(
  file: File,
  options: { type: ContentType; date: string; slug: string; kind: "image" | "album-art" | "audio" },
): Promise<ManagedMedia> {
  const allowed = options.kind === "audio" ? AUDIO_TYPES : IMAGE_TYPES;
  const maxBytes = options.kind === "audio" ? MAX_AUDIO_UPLOAD_BYTES : MAX_UPLOAD_BYTES;
  if (!allowed.has(file.type)) {
    throw new Error(options.kind === "audio" ? "音频仅支持 MP3、M4A、AAC、WAV、FLAC 和 OGG" : "图片仅支持 JPG、PNG、WebP、GIF 和 AVIF");
  }
  if (file.size > maxBytes) throw new Error(options.kind === "audio" ? "音频不能超过 100 MB" : "图片不能超过 30 MB");
  const config = getR2Config();
  const extension = extensionFor(file.name, file.type);
  const key = `${options.type}/${options.date.slice(0, 4)}/${options.date.slice(5, 7)}/${options.slug}-${options.kind}-${randomUUID().slice(0, 8)}.${extension}`;
  await putR2Object(key, file, config);
  return { key, url: publicObjectUrl(config.publicUrl, key) };
}

function compactFrontmatter(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== "" && value !== undefined && value !== null),
  );
}

export async function saveRemoteContent(
  form: FormData,
  identity?: { type: ContentType; slug: string },
): Promise<{ entry: OnlineContent; warnings: string[] }> {
  const requestedType = form.get("type");
  if (!isContentType(requestedType)) throw new Error("内容类型无效");
  const type = requestedType;
  if (identity && identity.type !== type) throw new Error("不能在编辑时更改内容类型");
  if (identity && !SLUG_PATTERN.test(identity.slug)) throw new Error("内容标识无效");

  const date = formText(form, "date", new Date().toISOString().slice(0, 10));
  if (!validDate(date)) throw new Error("日期格式无效");
  const title = formText(form, "title");
  if (!title) throw new Error("请填写标题");
  const fallbackPrefix: Record<ContentType, string> = {
    journal: "journal",
    notes: "note",
    photos: "photo",
    music: "music",
    thoughts: "thought",
  };
  const fallbackSlug = `${fallbackPrefix[type]}-${date.replaceAll("-", "")}-${Date.now().toString().slice(-6)}`;
  const slug = identity?.slug || slugify(formText(form, "slug") || title, fallbackSlug);
  if (!SLUG_PATTERN.test(slug)) throw new Error("固定链接只能包含小写字母、数字和连字符");

  const filePath = `${contentDirectory(type)}/${slug}.md`;
  const existingFile = identity ? await readGitHubFile(filePath) : undefined;
  const existingRaw = existingFile ? decodeGitHubContent(existingFile.content) : "";
  const existingMatter = existingRaw ? matter(existingRaw) : { data: {} as Record<string, unknown>, content: "" };
  const existing = existingFile ? contentFromMarkdown(type, existingRaw, existingFile.name) : undefined;

  if (!existingFile) {
    const files = await listGitHubFiles(contentDirectory(type));
    if (files.some((file) => file.name === `${slug}.md`)) throw new Error("这个固定链接已经存在");
  }

  const body = formText(form, "body", existing?.body || "");
  if (Buffer.byteLength(body, "utf8") > 1024 * 1024) throw new Error("正文不能超过 1 MB");

  let image = mediaReference(formText(form, "image", existing?.image || ""), "图片地址");
  let audio = mediaReference(formText(form, "audio", existing?.audio || ""), "音频地址");
  let albumArt = mediaReference(formText(form, "albumArt", existing?.albumArt || ""), "封面地址");
  let imageR2Key = image === existing?.image ? existing.imageR2Key : "";
  let audioR2Key = audio === existing?.audio ? existing.audioR2Key : "";
  let albumArtR2Key = albumArt === existing?.albumArt ? existing.albumArtR2Key : "";
  const uploaded: ManagedMedia[] = [];

  try {
    const imageFile = form.get("imageFile");
    if (imageFile instanceof File && imageFile.size > 0) {
      const result = await uploadManagedMedia(imageFile, { type, date, slug, kind: "image" });
      uploaded.push(result);
      image = result.url;
      imageR2Key = result.key;
    }
    const albumArtFile = form.get("albumArtFile");
    if (albumArtFile instanceof File && albumArtFile.size > 0) {
      const result = await uploadManagedMedia(albumArtFile, { type, date, slug, kind: "album-art" });
      uploaded.push(result);
      albumArt = result.url;
      albumArtR2Key = result.key;
    }
    const audioFile = form.get("audioFile");
    if (audioFile instanceof File && audioFile.size > 0) {
      const result = await uploadManagedMedia(audioFile, { type, date, slug, kind: "audio" });
      uploaded.push(result);
      audio = result.url;
      audioR2Key = result.key;
    }

    if (type === "photos" && !image) throw new Error("照片记录需要图片文件或图片地址");
    const visibilityValue = formText(form, "visibility", existing?.visibility || "public");
    const visibility: Visibility = isVisibility(visibilityValue) ? visibilityValue : "public";
    const excerpt = formText(form, "excerpt", existing?.excerpt || "");
    const caption = formText(form, "caption", existing?.caption || excerpt);
    const frontmatter = compactFrontmatter({
      ...existingMatter.data,
      title,
      date,
      type,
      slug,
      excerpt,
      tags: parseTags(formText(form, "tags", existing?.tags.join(", ") || "")),
      mood: formText(form, "mood", existing?.mood || ""),
      location: formText(form, "location", existing?.location || ""),
      image,
      caption,
      audio,
      albumArt,
      artist: formText(form, "artist", existing?.artist || ""),
      imageR2Key: type === "photos" ? undefined : imageR2Key,
      r2Key: type === "photos" ? imageR2Key : undefined,
      audioR2Key,
      albumArtR2Key,
      visibility,
    });
    const markdown = matter.stringify(body ? `${body}\n` : "", frontmatter);
    const github = getGitHubConfig();
    await githubRequest(githubUrl(filePath), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `${existingFile ? "Update" : "Add"} ${type}: ${title}`,
        content: Buffer.from(markdown, "utf8").toString("base64"),
        branch: github.branch,
        ...(existingFile ? { sha: existingFile.sha } : {}),
      }),
    });

    const warnings: string[] = [];
    const staleKeys = [existing?.imageR2Key, existing?.audioR2Key, existing?.albumArtR2Key]
      .filter((key): key is string => Boolean(key))
      .filter((key) => ![imageR2Key, audioR2Key, albumArtR2Key].includes(key));
    for (const key of new Set(staleKeys)) {
      try {
        await deleteR2Object(key);
      } catch {
        warnings.push(`旧媒体 ${key} 未能自动清理`);
      }
    }

    return {
      entry: contentFromMarkdown(type, markdown, `${slug}.md`),
      warnings,
    };
  } catch (error) {
    await Promise.allSettled(uploaded.map((media) => deleteR2Object(media.key)));
    throw error;
  }
}

export async function deleteRemoteContent(type: ContentType, slug: string): Promise<{ warnings: string[] }> {
  if (!SLUG_PATTERN.test(slug)) throw new Error("内容标识无效");
  const github = getGitHubConfig();
  const filePath = `${contentDirectory(type)}/${slug}.md`;
  const file = await readGitHubFile(filePath);
  const entry = contentFromMarkdown(type, decodeGitHubContent(file.content), file.name);
  await githubRequest(githubUrl(filePath), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: `Delete ${type}: ${entry.title}`, sha: file.sha, branch: github.branch }),
  });

  const warnings: string[] = [];
  const mediaKeys = new Set([entry.imageR2Key, entry.audioR2Key, entry.albumArtR2Key].filter(Boolean));
  for (const key of mediaKeys) {
    try {
      await deleteR2Object(key);
    } catch {
      warnings.push(`内容已删除，但 R2 媒体 ${key} 需要手动清理`);
    }
  }
  return { warnings };
}

export async function listRemotePhotos(): Promise<OnlinePhoto[]> {
  return listRemoteContent("photos");
}

export async function createRemotePhoto(form: FormData): Promise<{ slug: string; image: string }> {
  form.set("type", "photos");
  if (form.has("file")) form.set("imageFile", form.get("file") as File);
  const { entry } = await saveRemoteContent(form);
  return { slug: entry.slug, image: entry.image };
}

export async function deleteRemotePhoto(slug: string): Promise<void> {
  await deleteRemoteContent("photos", slug);
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

async function checkConnection(work: () => Promise<unknown>): Promise<ConnectionState> {
  try {
    await work();
    return { configured: true, connected: true };
  } catch (error) {
    return { configured: false, connected: false, error: error instanceof Error ? error.message : "连接失败" };
  }
}

export async function checkAdminConnection(): Promise<AdminConnection> {
  const github = await checkConnection(async () => {
    const config = getGitHubConfig();
    await githubRequest<{ full_name: string }>(`https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}`);
  });
  const r2 = await checkConnection(async () => {
    const config = getR2Config();
    await config.client.send(new HeadBucketCommand({ Bucket: config.bucket }));
  });
  return { github, r2 };
}

export async function checkRemoteConfig(): Promise<ConnectionState> {
  const connection = await checkAdminConnection();
  const connected = connection.github.connected && connection.r2.connected;
  return {
    configured: connection.github.configured && connection.r2.configured,
    connected,
    error: connected ? undefined : connection.github.error || connection.r2.error,
  };
}
