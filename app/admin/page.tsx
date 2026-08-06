"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./admin.css";

type PhotoRecord = {
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

type Connection = { configured: boolean; connected: boolean; error?: string };

const emptyConnection: Connection = { configured: false, connected: false };

export default function OnlinePhotoAdmin() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [connection, setConnection] = useState<Connection>(emptyConnection);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function loadPhotos() {
    const response = await fetch("/api/admin/photos", { cache: "no-store" });
    const data = (await response.json()) as { photos?: PhotoRecord[]; connection?: Connection; error?: string };
    if (response.status === 401) {
      setAuthenticated(false);
      return;
    }
    if (!response.ok) throw new Error(data.error || "读取照片失败");
    setPhotos(data.photos || []);
    setConnection(data.connection || emptyConnection);
  }

  useEffect(() => {
    fetch("/api/admin/auth", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ authenticated: boolean }>)
      .then((data) => {
        setAuthenticated(data.authenticated);
        if (data.authenticated) return loadPhotos();
        return undefined;
      })
      .catch(() => setAuthenticated(false));
  }, []);

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
      await loadPhotos();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthenticated(false);
    setPhotos([]);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/photos", { method: "POST", body: new FormData(event.currentTarget) });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "上传失败");
      event.currentTarget.reset();
      setMessage("已上传，GitHub 正在触发网站重新部署。");
      await loadPhotos();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上传失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(photo: PhotoRecord) {
    if (!photo.managed || !window.confirm(`确认删除「${photo.title}」？这会同时删除 R2 图片和 GitHub 记录。`)) return;
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/photos/${encodeURIComponent(photo.slug)}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "删除失败");
      setMessage("已删除，网站会在 GitHub/Vercel 完成部署后更新。");
      await loadPhotos();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除失败");
    } finally {
      setLoading(false);
    }
  }

  if (authenticated === null) {
    return <main className="online-admin online-admin--loading" aria-busy="true">正在打开暗房……</main>;
  }

  if (!authenticated) {
    return (
      <main className="online-admin online-admin--login">
        <section className="login-card" aria-labelledby="login-title">
          <p className="eyebrow">ZHANBO.ART / PRIVATE DARKROOM</p>
          <h1 id="login-title">进入线上暗房</h1>
          <p className="login-copy">照片会进入 Cloudflare R2，记录会通过 GitHub 提交并触发网站部署。</p>
          <form onSubmit={handleLogin} className="login-form">
            <label htmlFor="admin-password">管理员密码</label>
            <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button type="submit" disabled={loading}>{loading ? "验证中……" : "进入暗房"}</button>
          </form>
          <Link className="back-link" href="/photos">← 返回照片页</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="online-admin">
      <header className="admin-header">
        <Link href="/photos" className="wordmark">ZHANBO.ART</Link>
        <div className="admin-header-actions">
          <span className={`connection-dot ${connection.connected ? "is-online" : ""}`}>
            {connection.connected ? "R2 / GITHUB 已连接" : "等待连接"}
          </span>
          <button type="button" className="quiet-button" onClick={handleLogout}>退出</button>
        </div>
      </header>

      <div className="admin-grid">
        <section className="upload-panel" aria-labelledby="upload-title">
          <p className="eyebrow">ONLINE DARKROOM / R2</p>
          <h1 id="upload-title">放入一张<br /><em>尚未命名的光</em></h1>
          <p className="intro">图片进入 Cloudflare R2，文字进入 GitHub。每次保存都会让公开站点重新部署。</p>
          {!connection.configured || !connection.connected ? (
            <div className="connection-warning" role="status">
              <strong>连接还没有完成</strong>
              <span>{connection.error || "请检查 Vercel 环境变量：R2、GitHub 和管理员密码。"}</span>
            </div>
          ) : null}
          {message ? <p className="form-success" role="status">{message}</p> : null}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <form ref={formRef} onSubmit={handleUpload} className="photo-form">
            <label className="drop-zone" htmlFor="photo-file">
              <span className="drop-symbol">＋</span>
              <strong>选择或拖入照片</strong>
              <small>JPG / PNG / WebP / GIF / AVIF · 最大 30 MB</small>
              <input id="photo-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" required />
            </label>
            <div className="form-fields">
              <label>标题<input name="title" placeholder="百叶窗的光" required /></label>
              <label>日期<input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
              <label>说明<input name="caption" placeholder="这一刻为什么被留下" /></label>
              <label>地点<input name="location" placeholder="Shanghai" /></label>
              <label>心情<input name="mood" placeholder="quiet" /></label>
              <label>标签<input name="tags" placeholder="light, memory, room" /></label>
              <label className="field-wide">正文<textarea name="body" rows={4} placeholder="如果这张照片还有一些话……" /></label>
              <label>可见性<select name="visibility" defaultValue="public"><option value="public">公开</option><option value="unlisted">不列出</option><option value="draft">草稿</option></select></label>
            </div>
            <button className="submit-button" type="submit" disabled={loading || !connection.connected}>{loading ? "处理中……" : "上传并发布"}</button>
          </form>
        </section>

        <section className="contact-sheet" aria-labelledby="records-title">
          <div className="sheet-heading">
            <div><p className="eyebrow">CONTACT SHEET</p><h2 id="records-title">照片记录</h2></div>
            <span>{String(photos.length).padStart(2, "0")} FRAME{photos.length === 1 ? "" : "S"}</span>
          </div>
          {photos.length === 0 ? <p className="empty-state">还没有照片记录。先把一张光放进来。</p> : (
            <div className="photo-list">
              {photos.map((photo) => (
                <article className="photo-card" key={photo.slug}>
                  <div className="photo-image-wrap"><img src={photo.image} alt={photo.title} /></div>
                  <div className="photo-meta"><time>{photo.date}</time><h3>{photo.title}</h3><p>{photo.caption || "没有留下说明"}</p>{photo.location ? <small>{photo.location}</small> : null}</div>
                  <button type="button" className="delete-button" disabled={loading || !photo.managed} onClick={() => handleDelete(photo)}>{photo.managed ? "删除" : "本地旧记录"}</button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
