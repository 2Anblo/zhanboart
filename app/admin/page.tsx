"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CONTENT_TYPES, CONTENT_TYPE_META } from "@/lib/content-model";
import type { ContentType, Visibility } from "@/lib/content-model";
import "./admin.css";

type ContentRecord = {
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

type AssetRecord = {
  name: string;
  path: string;
  url: string;
  size: number;
};

type ConnectionState = { configured: boolean; connected: boolean; error?: string };
type AdminConnection = { github: ConnectionState; r2: ConnectionState };
type AdminView = "overview" | ContentType | "archive" | "assets";
type EditorState = { type: ContentType; entry?: ContentRecord } | null;

const disconnected: ConnectionState = { configured: false, connected: false };
const emptyConnection: AdminConnection = { github: disconnected, r2: disconnected };

const visibilityLabels: Record<Visibility, string> = {
  public: "公开",
  unlisted: "不列出",
  draft: "草稿",
};

const viewLabels: Record<AdminView, { title: string; kicker: string; note: string }> = {
  overview: { title: "私人索引", kicker: "PRIVATE INDEX", note: "所有留在这里的文字、声音与光。" },
  journal: { title: "日志", kicker: "JOURNAL", note: CONTENT_TYPE_META.journal.description },
  notes: { title: "笔记", kicker: "NOTES", note: CONTENT_TYPE_META.notes.description },
  photos: { title: "照片", kicker: "PHOTOS", note: CONTENT_TYPE_META.photos.description },
  music: { title: "音乐", kicker: "MUSIC", note: CONTENT_TYPE_META.music.description },
  thoughts: { title: "想法", kicker: "THOUGHTS", note: CONTENT_TYPE_META.thoughts.description },
  archive: { title: "归档", kicker: "ARCHIVE", note: "按年份查看全部内容，不制造另一份数据。" },
  assets: { title: "站点资源", kicker: "ASSET LIBRARY", note: "首页、房间与内容共用的图片文件。" },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function recordSearchText(entry: ContentRecord): string {
  return [entry.title, entry.excerpt, entry.caption, entry.artist, entry.location, entry.mood, ...entry.tags]
    .join(" ")
    .toLowerCase();
}

export default function UnifiedContentAdmin() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [entries, setEntries] = useState<ContentRecord[]>([]);
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [connection, setConnection] = useState<AdminConnection>(emptyConnection);
  const [view, setView] = useState<AdminView>("overview");
  const [editor, setEditor] = useState<EditorState>(null);
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<"all" | Visibility>("all");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  async function loadContent() {
    const response = await fetch("/api/admin/content", { cache: "no-store" });
    const data = (await response.json()) as {
      entries?: ContentRecord[];
      connection?: AdminConnection;
      error?: string;
    };
    if (response.status === 401) {
      setAuthenticated(false);
      return;
    }
    if (!response.ok) throw new Error(data.error || "读取内容失败");
    setEntries(data.entries || []);
    setConnection(data.connection || emptyConnection);
  }

  async function loadAssets() {
    const response = await fetch("/api/admin/assets", { cache: "no-store" });
    const data = (await response.json()) as { assets?: AssetRecord[]; error?: string };
    if (response.status === 401) {
      setAuthenticated(false);
      return;
    }
    if (!response.ok) throw new Error(data.error || "读取站点资源失败");
    setAssets(data.assets || []);
    setAssetsLoaded(true);
  }

  useEffect(() => {
    fetch("/api/admin/auth", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ authenticated: boolean }>)
      .then(async (data) => {
        setAuthenticated(data.authenticated);
        if (data.authenticated) await loadContent();
      })
      .catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    if (!editor) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) setEditor(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [editor, loading]);

  const counts = useMemo(() => {
    const result = Object.fromEntries(CONTENT_TYPES.map((type) => [type, 0])) as Record<ContentType, number>;
    entries.forEach((entry) => result[entry.type]++);
    return result;
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const inView = view === "archive" || view === "overview" || view === "assets" || entry.type === view;
      const matchesVisibility = visibility === "all" || entry.visibility === visibility;
      const matchesQuery = !normalizedQuery || recordSearchText(entry).includes(normalizedQuery);
      return inView && matchesVisibility && matchesQuery;
    });
  }, [entries, query, view, visibility]);

  const archiveYears = useMemo(
    () => Array.from(new Set(filteredEntries.map((entry) => entry.date.slice(0, 4)).filter(Boolean))),
    [filteredEntries],
  );

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "登录失败");
      setPassword("");
      setAuthenticated(true);
      await loadContent();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthenticated(false);
    setEntries([]);
    setAssets([]);
    setAssetsLoaded(false);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      const endpoint = editor.entry
        ? `/api/admin/content/${editor.entry.type}/${encodeURIComponent(editor.entry.slug)}`
        : "/api/admin/content";
      const response = await fetch(endpoint, { method: editor.entry ? "PUT" : "POST", body: formData });
      const data = (await response.json()) as { error?: string; warnings?: string[] };
      if (!response.ok) throw new Error(data.error || "保存失败");
      setEditor(null);
      setMessage(data.warnings?.length
        ? `内容已保存；${data.warnings.join("；")}。`
        : "内容已保存，GitHub 正在触发网站重新部署。");
      await loadContent();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(entry: ContentRecord) {
    const mediaNote = entry.managed ? "；它拥有的 R2 媒体也会删除" : "";
    if (!window.confirm(`确认删除「${entry.title}」？GitHub 记录会被删除${mediaNote}。`)) return;
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/content/${entry.type}/${encodeURIComponent(entry.slug)}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string; warnings?: string[] };
      if (!response.ok) throw new Error(data.error || "删除失败");
      setMessage(data.warnings?.length
        ? `内容已删除；${data.warnings.join("；")}。`
        : "内容已删除，公开站点会在部署完成后更新。");
      await loadContent();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssetUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/assets", { method: "POST", body: new FormData(form) });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "上传资源失败");
      form.reset();
      setMessage("资源已提交到 GitHub，部署完成后会出现在公开网站。");
      await loadAssets();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上传资源失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssetDelete(asset: AssetRecord) {
    if (!window.confirm(`确认删除「${asset.path}」？它可能正被公开页面引用。`)) return;
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const encodedPath = asset.path.split("/").map(encodeURIComponent).join("/");
      const response = await fetch(`/api/admin/assets/${encodedPath}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "删除资源失败");
      setMessage("资源已删除，部署完成后公开网站会更新。");
      await loadAssets();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除资源失败");
    } finally {
      setLoading(false);
    }
  }

  function selectView(nextView: AdminView) {
    setView(nextView);
    setQuery("");
    setVisibility("all");
    setMessage("");
    setError("");
    if (nextView === "assets" && !assetsLoaded) {
      void loadAssets().catch((assetError) => setError(assetError instanceof Error ? assetError.message : "读取站点资源失败"));
    }
  }

  if (authenticated === null) {
    return <main className="online-admin online-admin--loading" aria-busy="true">正在翻开私人索引……</main>;
  }

  if (!authenticated) {
    return (
      <main className="online-admin online-admin--login">
        <section className="login-card" aria-labelledby="login-title">
          <p className="admin-eyebrow">ZHANBO.ART / PRIVATE INDEX</p>
          <h1 id="login-title">回到<br /><em>没有公开的房间</em></h1>
          <p className="login-copy">这里管理日志、笔记、照片、音乐与想法。保存后，GitHub 会让网站重新部署。</p>
          <form onSubmit={handleLogin} className="login-form">
            <label htmlFor="admin-password">管理员密码</label>
            <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required autoFocus />
            {error ? <p className="admin-alert is-error" role="alert">{error}</p> : null}
            <button type="submit" disabled={loading}>{loading ? "正在验证……" : "进入私人索引"}</button>
          </form>
          <Link className="back-link" href="/">← 返回公开网站</Link>
        </section>
      </main>
    );
  }

  const activeMeta = viewLabels[view];
  const canCreate = CONTENT_TYPES.includes(view as ContentType);

  return (
    <main className="online-admin">
      <header className="admin-header">
        <button className="admin-wordmark" type="button" onClick={() => selectView("overview")}>ZHANBO.ART <span>/ INDEX</span></button>
        <div className="admin-header-status" aria-label="服务连接状态">
          <span className={connection.github.connected ? "is-online" : ""}>GITHUB</span>
          <span className={connection.r2.connected ? "is-online" : ""}>R2</span>
        </div>
        <div className="admin-header-actions">
          <Link href="/" target="_blank">查看网站 ↗</Link>
          <button type="button" onClick={handleLogout}>退出</button>
        </div>
      </header>

      <div className="admin-workspace">
        <aside className="admin-index" aria-label="内容索引">
          <button className={view === "overview" ? "is-active" : ""} type="button" onClick={() => selectView("overview")}>
            <span>总览</span><small>{String(entries.length).padStart(2, "0")}</small>
          </button>
          <div className="index-rule" />
          {CONTENT_TYPES.map((type) => (
            <button className={view === type ? "is-active" : ""} type="button" key={type} onClick={() => selectView(type)}>
              <span>{CONTENT_TYPE_META[type].label}</span><small>{String(counts[type]).padStart(2, "0")}</small>
            </button>
          ))}
          <div className="index-rule" />
          <button className={view === "archive" ? "is-active" : ""} type="button" onClick={() => selectView("archive")}>
            <span>归档</span><small>{new Set(entries.map((entry) => entry.date.slice(0, 4))).size || "–"}</small>
          </button>
          <button className={view === "assets" ? "is-active" : ""} type="button" onClick={() => selectView("assets")}>
            <span>站点资源</span><small>{assetsLoaded ? String(assets.length).padStart(2, "0") : "··"}</small>
          </button>
          <p className="index-caption">碎片<br />光线<br />记忆</p>
        </aside>

        <section className="admin-desk">
          <div className="desk-heading">
            <div>
              <p className="admin-eyebrow">{activeMeta.kicker}</p>
              <h1>{activeMeta.title}</h1>
              <p>{activeMeta.note}</p>
            </div>
            {canCreate ? (
              <button className="new-entry-button" type="button" onClick={() => setEditor({ type: view as ContentType })} disabled={!connection.github.connected}>
                <span>＋</span> 新建{CONTENT_TYPE_META[view as ContentType].singular}
              </button>
            ) : null}
          </div>

          {!connection.github.connected ? (
            <div className="admin-alert is-error" role="status">
              <strong>GitHub 还没有连接</strong>
              <span>{connection.github.error || "请检查 Vercel 中的 GitHub 环境变量。"}</span>
            </div>
          ) : !connection.r2.connected ? (
            <div className="admin-alert" role="status">
              <strong>文字可以保存，媒体上传暂不可用</strong>
              <span>{connection.r2.error || "请检查 Cloudflare R2 环境变量。"}</span>
            </div>
          ) : null}
          {message ? <div className="admin-alert is-success" role="status">{message}</div> : null}
          {error ? <div className="admin-alert is-error" role="alert">{error}</div> : null}

          {view === "overview" ? (
            <Overview entries={entries} counts={counts} canWrite={connection.github.connected} onOpen={(entry) => setEditor({ type: entry.type, entry })} onCreate={(type) => setEditor({ type })} />
          ) : null}

          {CONTENT_TYPES.includes(view as ContentType) || view === "archive" ? (
            <>
              <div className="ledger-tools">
                <label className="search-field">
                  <span>搜索</span>
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="标题、标签、地点……" />
                </label>
                <label className="visibility-filter">
                  <span>状态</span>
                  <select value={visibility} onChange={(event) => setVisibility(event.target.value as "all" | Visibility)}>
                    <option value="all">全部</option>
                    <option value="public">公开</option>
                    <option value="unlisted">不列出</option>
                    <option value="draft">草稿</option>
                  </select>
                </label>
                <span className="result-count">{String(filteredEntries.length).padStart(2, "0")} RECORDS</span>
              </div>
              {view === "archive" ? (
                <ArchiveLedger years={archiveYears} entries={filteredEntries} loading={loading} onOpen={(entry) => setEditor({ type: entry.type, entry })} onDelete={handleDelete} />
              ) : (
                <ContentLedger entries={filteredEntries} loading={loading} onOpen={(entry) => setEditor({ type: entry.type, entry })} onDelete={handleDelete} />
              )}
            </>
          ) : null}

          {view === "assets" ? (
            <AssetLibrary assets={assets} loading={loading} connected={connection.github.connected} onUpload={handleAssetUpload} onDelete={handleAssetDelete} />
          ) : null}
        </section>
      </div>

      {editor ? (
        <ContentEditor
          key={`${editor.type}-${editor.entry?.slug || "new"}`}
          state={editor}
          loading={loading}
          canSave={connection.github.connected}
          mediaConnected={connection.r2.connected}
          onClose={() => !loading && setEditor(null)}
          onSave={handleSave}
        />
      ) : null}
    </main>
  );
}

function Overview({
  entries,
  counts,
  canWrite,
  onOpen,
  onCreate,
}: {
  entries: ContentRecord[];
  counts: Record<ContentType, number>;
  canWrite: boolean;
  onOpen: (entry: ContentRecord) => void;
  onCreate: (type: ContentType) => void;
}) {
  const publicCount = entries.filter((entry) => entry.visibility === "public").length;
  const draftCount = entries.filter((entry) => entry.visibility === "draft").length;
  return (
    <div className="overview-grid">
      <section className="overview-register">
        <div className="register-number"><strong>{String(entries.length).padStart(2, "0")}</strong><span>全部记录</span></div>
        <div className="register-number"><strong>{String(publicCount).padStart(2, "0")}</strong><span>已经公开</span></div>
        <div className="register-number"><strong>{String(draftCount).padStart(2, "0")}</strong><span>仍是草稿</span></div>
      </section>
      <section className="collection-cards" aria-label="内容分类">
        {CONTENT_TYPES.map((type) => (
          <article key={type}>
            <div><span>{CONTENT_TYPE_META[type].label}</span><strong>{String(counts[type]).padStart(2, "0")}</strong></div>
            <p>{CONTENT_TYPE_META[type].description}</p>
            <button type="button" onClick={() => onCreate(type)} disabled={!canWrite}>写{CONTENT_TYPE_META[type].singular} →</button>
          </article>
        ))}
      </section>
      <section className="recent-register">
        <div className="section-heading"><p className="admin-eyebrow">RECENTLY TOUCHED</p><span>最近的记录</span></div>
        <ContentLedger entries={entries.slice(0, 6)} loading={false} onOpen={onOpen} compact />
      </section>
    </div>
  );
}

function ContentLedger({
  entries,
  loading,
  onOpen,
  onDelete,
  compact = false,
}: {
  entries: ContentRecord[];
  loading: boolean;
  onOpen: (entry: ContentRecord) => void;
  onDelete?: (entry: ContentRecord) => void;
  compact?: boolean;
}) {
  if (entries.length === 0) return <p className="empty-ledger">这里还没有记录。新建一条，让索引从某个时刻开始。</p>;
  return (
    <div className={`content-ledger ${compact ? "is-compact" : ""}`}>
      {entries.map((entry) => (
        <article className="ledger-row" key={`${entry.type}-${entry.slug}`}>
          <button className="ledger-main" type="button" onClick={() => onOpen(entry)}>
            <span className="ledger-date">{entry.date || "未注明日期"}</span>
            <span className="ledger-type">{CONTENT_TYPE_META[entry.type].label}</span>
            <span className="ledger-title">
              <strong>{entry.title}</strong>
              <small>{entry.excerpt || entry.caption || entry.artist || "没有摘要"}</small>
            </span>
            <span className={`visibility-mark is-${entry.visibility}`}>{visibilityLabels[entry.visibility]}</span>
          </button>
          {!compact && onDelete ? (
            <div className="ledger-actions">
              <Link href={`/${entry.type}/${entry.slug}`} target="_blank" aria-label={`打开 ${entry.title}`}>↗</Link>
              <button type="button" onClick={() => onDelete(entry)} disabled={loading}>删除</button>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function ArchiveLedger({
  years,
  entries,
  loading,
  onOpen,
  onDelete,
}: {
  years: string[];
  entries: ContentRecord[];
  loading: boolean;
  onOpen: (entry: ContentRecord) => void;
  onDelete: (entry: ContentRecord) => void;
}) {
  if (years.length === 0) return <p className="empty-ledger">归档里还没有符合条件的记录。</p>;
  return (
    <div className="archive-ledger">
      {years.map((year) => (
        <section key={year}>
          <div className="archive-year"><strong>{year}</strong><span>{entries.filter((entry) => entry.date.startsWith(year)).length} fragments</span></div>
          <ContentLedger entries={entries.filter((entry) => entry.date.startsWith(year))} loading={loading} onOpen={onOpen} onDelete={onDelete} />
        </section>
      ))}
    </div>
  );
}

function ContentEditor({
  state,
  loading,
  canSave,
  mediaConnected,
  onClose,
  onSave,
}: {
  state: NonNullable<EditorState>;
  loading: boolean;
  canSave: boolean;
  mediaConnected: boolean;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const { type, entry } = state;
  const isPhoto = type === "photos";
  const isMusic = type === "music";
  return (
    <div className="editor-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="content-editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <header>
          <div>
            <p className="admin-eyebrow">{entry ? "EDIT RECORD" : "NEW RECORD"} / {type.toUpperCase()}</p>
            <h2 id="editor-title">{entry ? entry.title : `新建${CONTENT_TYPE_META[type].singular}`}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={loading} aria-label="关闭编辑器">×</button>
        </header>
        <form className="editor-form" onSubmit={onSave}>
          <input type="hidden" name="type" value={type} />
          <div className="editor-fields">
            <label className="field-wide">标题<input name="title" defaultValue={entry?.title || ""} placeholder="这一刻叫什么" required autoFocus /></label>
            <label>日期<input name="date" type="date" defaultValue={entry?.date || new Date().toISOString().slice(0, 10)} required /></label>
            <label>固定链接<input name="slug" defaultValue={entry?.slug || ""} placeholder="留空则自动生成" readOnly={Boolean(entry)} /></label>
            <label className="field-wide">摘要<textarea name="excerpt" rows={2} defaultValue={entry?.excerpt || ""} placeholder="在列表里留下的一句话" /></label>
            <label>地点<input name="location" defaultValue={entry?.location || ""} placeholder="Shanghai" /></label>
            <label>心情<input name="mood" defaultValue={entry?.mood || ""} placeholder="quiet" /></label>
            <label className="field-wide">标签<input name="tags" defaultValue={entry?.tags.join(", ") || ""} placeholder="night, memory, room" /></label>

            {isPhoto ? (
              <>
                <label className="field-wide">照片说明<textarea name="caption" rows={2} defaultValue={entry?.caption || ""} placeholder="为什么留下这一张" /></label>
                <MediaFields label="照片" urlName="image" fileName="imageFile" currentUrl={entry?.image || ""} accept="image/jpeg,image/png,image/webp,image/gif,image/avif" disabled={!mediaConnected} />
              </>
            ) : null}

            {!isPhoto && !isMusic ? (
              <MediaFields label="配图（可选）" urlName="image" fileName="imageFile" currentUrl={entry?.image || ""} accept="image/jpeg,image/png,image/webp,image/gif,image/avif" disabled={!mediaConnected} />
            ) : null}

            {isMusic ? (
              <>
                <label className="field-wide">音乐人<input name="artist" defaultValue={entry?.artist || ""} placeholder="Artist" /></label>
                <MediaFields label="音频" urlName="audio" fileName="audioFile" currentUrl={entry?.audio || ""} accept="audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,audio/flac,audio/ogg" disabled={!mediaConnected} />
                <MediaFields label="封面" urlName="albumArt" fileName="albumArtFile" currentUrl={entry?.albumArt || ""} accept="image/jpeg,image/png,image/webp,image/gif,image/avif" disabled={!mediaConnected} />
              </>
            ) : null}

            <label className="field-wide body-field">正文<textarea name="body" rows={14} defaultValue={entry?.body || ""} placeholder="支持 Markdown。写下那些不需要被总结的东西……" /></label>
            <label>可见性
              <select name="visibility" defaultValue={entry?.visibility || "public"}>
                <option value="public">公开</option>
                <option value="unlisted">可访问，但不出现在列表</option>
                <option value="draft">草稿</option>
              </select>
            </label>
          </div>
          <footer>
            <p>{mediaConnected ? "媒体会上传到 R2；文字会提交到 GitHub。" : "R2 未连接，可继续保存纯文字或使用已有媒体地址。"}</p>
            <div><button className="editor-cancel" type="button" onClick={onClose} disabled={loading}>取消</button><button className="editor-save" type="submit" disabled={loading || !canSave}>{loading ? "正在保存……" : !canSave ? "等待 GitHub" : entry ? "保存修改" : "保存记录"}</button></div>
          </footer>
        </form>
      </aside>
    </div>
  );
}

function MediaFields({
  label,
  urlName,
  fileName,
  currentUrl,
  accept,
  disabled,
}: {
  label: string;
  urlName: string;
  fileName: string;
  currentUrl: string;
  accept: string;
  disabled: boolean;
}) {
  return (
    <fieldset className="media-fields field-wide">
      <legend>{label}</legend>
      <label>已有地址<input name={urlName} defaultValue={currentUrl} placeholder="/media/example 或 https://…" /></label>
      <label className={disabled ? "is-disabled" : ""}>上传新文件<input name={fileName} type="file" accept={accept} disabled={disabled} /></label>
      {currentUrl ? <small>保留地址即可继续使用现有文件；选择新文件会替换它。</small> : null}
    </fieldset>
  );
}

function AssetLibrary({
  assets,
  loading,
  connected,
  onUpload,
  onDelete,
}: {
  assets: AssetRecord[];
  loading: boolean;
  connected: boolean;
  onUpload: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (asset: AssetRecord) => void;
}) {
  return (
    <div className="asset-library">
      <form className="asset-upload" onSubmit={onUpload}>
        <label>选择图片<input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml" required /></label>
        <label>存放位置<select name="folder" defaultValue="uploads"><option value="uploads">uploads / 新资源</option><option value="gallery">gallery / 画廊</option><option value="hero">hero / 首页</option><option value="rooms">rooms / 房间</option></select></label>
        <button type="submit" disabled={loading || !connected}>上传到 GitHub</button>
      </form>
      <div className="asset-note"><span>{String(assets.length).padStart(2, "0")} FILES</span><p>删除前请确认资源没有被首页、房间或内容引用。</p></div>
      {assets.length === 0 ? <p className="empty-ledger">还没有找到站点图片。</p> : (
        <div className="asset-grid">
          {assets.map((asset) => (
            <article key={asset.path}>
              <img src={asset.url} alt={asset.name} width={320} height={320} loading="lazy" />
              <div><code>{asset.path.replace("public/images/", "")}</code><small>{formatBytes(asset.size)}</small></div>
              <button type="button" onClick={() => onDelete(asset)} disabled={loading}>删除</button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
