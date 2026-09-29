"use client";

import { useEffect, useRef, useState } from "react";
import { quickJournalConfig as copy } from "@/config";

const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export default function QuickJournal({ canPublish, mediaConnected, busy, onPublish }: {
  canPublish: boolean;
  mediaConnected: boolean;
  busy: boolean;
  onPublish: (data: FormData) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [image, setImage] = useState<{ file: File; preview: string } | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const submitting = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const locked = busy || sending;

  useEffect(() => () => { if (image) URL.revokeObjectURL(image.preview); }, [image]);

  function chooseImage(file?: File) {
    if (!file || locked || !mediaConnected) return;
    if (!imageTypes.includes(file.type)) { setError(copy.invalidImage); return; }
    // Leave room for multipart fields within the hosting platform's request limit.
    if (file.size > 4 * 1024 * 1024) { setError(copy.largeImage); return; }
    setError("");
    setImage({ file, preview: URL.createObjectURL(file) });
  }

  async function publish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || locked || !canPublish || (!body.trim() && !image)) return;
    submitting.current = true;
    setSending(true);
    setError("");
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const text = body.trim();
    const data = new FormData();
    data.set("type", "notes");
    data.set("body", text);
    data.set("excerpt", Array.from(text.replace(/\s+/g, " ")).slice(0, 120).join(""));
    data.set("date", date);
    data.set("slug", `activity-${date}-${crypto.randomUUID()}`);
    data.set("visibility", "public");
    if (image) data.set("imageFile", image.file);
    try {
      await onPublish(data);
      setBody("");
      setImage(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.failed);
    } finally {
      submitting.current = false;
      setSending(false);
    }
  }

  return (
    <form className="quick-journal" onSubmit={publish} aria-label={copy.heading} aria-busy={sending}>
      <label htmlFor="quick-journal-body">{copy.heading}</label>
      <textarea id="quick-journal-body" value={body} onChange={(event) => setBody(event.target.value)}
        placeholder={copy.placeholder} rows={4} maxLength={20000} disabled={locked}
        onPaste={(event) => {
          const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/"));
          if (file && mediaConnected && !locked) { event.preventDefault(); chooseImage(file); }
        }} />
      {image ? <div className="quick-journal-image">
        <img src={image.preview} alt={copy.preview} width={160} height={160} />
        <button type="button" onClick={() => setImage(null)} disabled={locked}>{copy.removeImage}</button>
      </div> : null}
      <input ref={fileInput} type="file" accept={imageTypes.join(",")} hidden disabled={locked || !mediaConnected}
        onChange={(event) => { chooseImage(event.target.files?.[0]); event.target.value = ""; }} />
      <div className="quick-journal-actions">
        <button type="button" onClick={() => fileInput.current?.click()} disabled={locked || !mediaConnected}>
          {image ? copy.replaceImage : copy.addImage}
        </button>
        <span>{copy.publicNote}{!mediaConnected ? ` · ${copy.noMedia}` : ""}</span>
        <button className="quick-journal-publish" type="submit" disabled={locked || !canPublish || (!body.trim() && !image)}>
          {sending ? copy.sending : copy.publish}
        </button>
      </div>
      {error ? <p className="admin-alert is-error" role="alert">{error}</p> : null}
    </form>
  );
}
