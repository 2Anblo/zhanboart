import { createServer } from "node:http";
import { readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import matter from "gray-matter";
import {
  DeleteObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  IMAGE_TYPES,
  envStatus,
  extensionFor,
  makeObjectKey,
  normalizePublicUrl,
  parseTags,
  slugify,
} from "./lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const contentDir = path.join(projectRoot, "content", "photos");
const publicImagesDir = path.join(projectRoot, "public", "images");
const uiDir = path.join(__dirname, "ui");
const host = "127.0.0.1";
const port = Number.parseInt(process.env.PHOTO_ADMIN_PORT || "4173", 10);
const maxUploadBytes = 30 * 1024 * 1024;

const staticFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
]);

const imageContentTypes = new Map([
  [".avif", "image/avif"],
  [".gif", "image/gif"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

function safeError(error) {
  if (error instanceof Error) return error.message;
  return "未知错误";
}

function requireLocalRequest(request) {
  const address = request.socket.remoteAddress || "";
  const localAddress = address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
  const hostname = String(request.headers.host || "").split(":")[0].replace(/^\[|\]$/g, "");
  const localHost = hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";
  return localAddress && localHost;
}

async function serveLocalImage(response, pathname) {
  const relativePath = decodeURIComponent(pathname.slice("/images/".length));
  const imagePath = path.resolve(publicImagesDir, relativePath);
  if (!imagePath.startsWith(`${publicImagesDir}${path.sep}`)) return false;

  const contentType = imageContentTypes.get(path.extname(imagePath).toLowerCase());
  if (!contentType || !existsSync(imagePath) || !(await stat(imagePath)).isFile()) return false;

  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(await readFile(imagePath));
  return true;
}

function getR2Config() {
  const status = envStatus(process.env);
  if (!status.configured) {
    throw new Error(`缺少环境变量：${status.missing.join(", ")}`);
  }

  return {
    bucket: process.env.CLOUDFLARE_R2_BUCKET,
    publicUrl: normalizePublicUrl(process.env.CLOUDFLARE_R2_PUBLIC_URL),
    client: new S3Client({
      region: "auto",
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      },
    }),
  };
}

function publicObjectUrl(baseUrl, key) {
  return `${baseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

async function listPhotos() {
  if (!existsSync(contentDir)) return [];
  const files = (await readdir(contentDir)).filter((file) => file.endsWith(".md"));
  const entries = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(contentDir, file), "utf8");
      const { data, content } = matter(raw);
      const slug = String(data.slug || file.replace(/\.md$/, ""));
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
        managed: Boolean(data.r2Key),
      };
    })
  );

  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

async function uniqueSlug(candidate) {
  let slug = candidate;
  let suffix = 2;
  while (existsSync(path.join(contentDir, `${slug}.md`))) {
    slug = `${candidate}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

async function parseMultipart(request) {
  const length = Number.parseInt(request.headers["content-length"] || "0", 10);
  if (length > maxUploadBytes) throw new Error("图片不能超过 30 MB");

  const webRequest = new Request(`http://${request.headers.host}${request.url}`, {
    method: request.method,
    headers: request.headers,
    body: Readable.toWeb(request),
    duplex: "half",
  });
  return webRequest.formData();
}

async function createPhoto(request, response) {
  const config = getR2Config();
  const form = await parseMultipart(request);
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return sendJson(response, 400, { error: "请选择一张图片" });
  }
  if (!IMAGE_TYPES.has(file.type)) {
    return sendJson(response, 415, { error: "仅支持 JPG、PNG、WebP、GIF 和 AVIF" });
  }
  if (file.size > maxUploadBytes) {
    return sendJson(response, 413, { error: "图片不能超过 30 MB" });
  }

  const date = String(form.get("date") || new Date().toISOString().slice(0, 10));
  const fallbackSlug = `photo-${date.replaceAll("-", "")}-${Date.now().toString().slice(-6)}`;
  const title = String(form.get("title") || path.parse(file.name).name || "未命名照片").trim();
  const slug = await uniqueSlug(slugify(String(form.get("slug") || title), fallbackSlug));
  const extension = extensionFor(file.name, file.type);
  const key = makeObjectKey({
    slug,
    date,
    suffix: randomUUID().slice(0, 8),
    extension,
  });
  const image = publicObjectUrl(config.publicUrl, key);
  const caption = String(form.get("caption") || "").trim();
  const body = String(form.get("body") || "").trim();
  const visibilityValue = String(form.get("visibility") || "public");
  const visibility = ["public", "unlisted", "draft"].includes(visibilityValue)
    ? visibilityValue
    : "public";
  const buffer = Buffer.from(await file.arrayBuffer());

  await config.client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
      Metadata: { slug },
    })
  );

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
  const markdownPath = path.join(contentDir, `${slug}.md`);

  try {
    const markdown = matter.stringify(body ? `${body}\n` : "", frontmatter);
    const temporaryPath = `${markdownPath}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, markdown, "utf8");
    await rename(temporaryPath, markdownPath);
  } catch (error) {
    await config.client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    throw error;
  }

  sendJson(response, 201, { ok: true, slug, image });
}

async function deletePhoto(request, response, slug) {
  const config = getR2Config();
  const filePath = path.join(contentDir, `${slug}.md`);
  if (!existsSync(filePath)) return sendJson(response, 404, { error: "没有找到这张照片" });

  const body = await readJson(request);
  if (body.confirmSlug !== slug) {
    return sendJson(response, 400, { error: "删除确认不匹配" });
  }

  const raw = await readFile(filePath, "utf8");
  const { data } = matter(raw);
  const key = data.r2Key ? String(data.r2Key) : "";
  if (!key) {
    return sendJson(response, 409, { error: "这是本地旧照片，不能通过 R2 工作台删除" });
  }

  const stagedPath = `${filePath}.deleting`;
  await rename(filePath, stagedPath);
  try {
    await config.client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    await unlink(stagedPath);
  } catch (error) {
    await rename(stagedPath, filePath);
    throw error;
  }

  sendJson(response, 200, { ok: true });
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 64 * 1024) throw new Error("请求内容过大");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

async function handleApi(request, response, pathname) {
  if (request.method === "GET" && pathname === "/api/status") {
    const environment = envStatus(process.env);
    if (!environment.configured) return sendJson(response, 200, { ...environment, connected: false });
    try {
      const config = getR2Config();
      await config.client.send(new HeadBucketCommand({ Bucket: config.bucket }));
      return sendJson(response, 200, { ...environment, connected: true });
    } catch (error) {
      return sendJson(response, 200, {
        ...environment,
        connected: false,
        error: safeError(error),
      });
    }
  }

  if (request.method === "GET" && pathname === "/api/photos") {
    return sendJson(response, 200, { photos: await listPhotos() });
  }

  if (request.method === "POST" && pathname === "/api/photos") {
    return createPhoto(request, response);
  }

  const deleteMatch = pathname.match(/^\/api\/photos\/([a-z0-9-]+)$/);
  if (request.method === "DELETE" && deleteMatch) {
    return deletePhoto(request, response, deleteMatch[1]);
  }

  sendJson(response, 404, { error: "接口不存在" });
}

const server = createServer(async (request, response) => {
  if (!requireLocalRequest(request)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    return response.end("This tool is available on localhost only.");
  }

  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      return await handleApi(request, response, url.pathname);
    }

    if (request.method === "GET" && url.pathname.startsWith("/images/")) {
      if (await serveLocalImage(response, url.pathname)) return;
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return response.end("Not found");
    }

    const file = staticFiles.get(url.pathname);
    if (!file || request.method !== "GET") {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return response.end("Not found");
    }

    const [filename, contentType] = file;
    const content = await readFile(path.join(uiDir, filename));
    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'self'; img-src 'self' https: blob:; style-src 'self'; script-src 'self'; connect-src 'self'",
    });
    response.end(content);
  } catch (error) {
    console.error("[photo-admin]", error);
    sendJson(response, 500, { error: safeError(error) });
  }
});

server.listen(port, host, () => {
  console.log(`Photo admin: http://${host}:${port}`);
  console.log(`Content: ${contentDir}`);
});
